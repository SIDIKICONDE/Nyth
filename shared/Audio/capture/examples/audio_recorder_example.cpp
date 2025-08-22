#include <atomic>
#include <chrono>
#include <csignal>
#include <cstdio>
#include <thread>
#include <vector>

#include "Audio/capture/AudioCapture.hpp"
#include "Audio/capture/AudioCaptureImpl.hpp"
#include "Audio/capture/AudioFileWriterImpl.hpp"

using namespace AudioFX::Capture;

static std::atomic<bool> g_stop{false};

static void handleSignal(int) {
  g_stop.store(true);
}

int main() {
  std::signal(SIGINT, handleSignal);

  auto capture = createAudioCapture();

  AudioStreamParams params;
  params.sampleRate = 48000;
  params.numChannels = 1;
  params.framesPerBuffer = 480;
  params.sampleFormat = AudioSampleFormat::Float32;

  WavFileWriter writer;
  if (!writer.open("output.wav", params.sampleRate, params.numChannels)) {
    std::fprintf(stderr, "Failed to open output.wav for writing\n");
    return 1;
  }

  std::atomic<size_t> totalFrames{0};

  AudioCaptureCallbacks cbs;
  cbs.onData = [&](const float* interleaved, size_t frames) {
    writer.writeInterleavedFloat(interleaved, frames);
    totalFrames += frames;
  };
  cbs.onError = [&](const std::string& msg) {
    std::fprintf(stderr, "Capture error: %s\n", msg.c_str());
  };
  cbs.onStateChanged = [&](bool running) {
    std::fprintf(stderr, "Capture state: %s\n", running ? "running" : "stopped");
  };

  if (!capture->start(params, cbs)) {
    std::fprintf(stderr, "Failed to start capture\n");
    return 1;
  }

  const auto start = std::chrono::steady_clock::now();
  while (!g_stop.load()) {
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
    auto elapsed = std::chrono::steady_clock::now() - start;
    if (std::chrono::duration_cast<std::chrono::seconds>(elapsed).count() >= 5) break;
  }

  capture->stop();
  writer.close();

  std::fprintf(stderr, "Recorded %.2f seconds to output.wav\n",
               (double)totalFrames.load() / (double)params.sampleRate);

  return 0;
}