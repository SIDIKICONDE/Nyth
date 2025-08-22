#pragma once

#include <atomic>
#include <cstddef>
#include <cstdint>
#include <functional>
#include <memory>
#include <string>

namespace AudioFX {
namespace Capture {

enum class AudioSampleFormat {
  Float32,
  Int16
};

struct AudioStreamParams {
  uint32_t sampleRate = 48000;
  uint16_t numChannels = 1;
  AudioSampleFormat sampleFormat = AudioSampleFormat::Float32;
  uint32_t framesPerBuffer = 480;
  std::string deviceName; // empty -> default device
};

struct AudioCaptureCallbacks {
  std::function<void(const float* interleaved, size_t numFrames)> onData;
  std::function<void(const std::string& message)> onError;
  std::function<void(bool running)> onStateChanged;
};

class IAudioCapture {
public:
  virtual ~IAudioCapture() = default;

  virtual bool start(const AudioStreamParams& params,
                     AudioCaptureCallbacks callbacks) = 0;
  virtual void stop() = 0;
  virtual bool isRunning() const = 0;
  virtual AudioStreamParams getParams() const = 0;
};

std::unique_ptr<IAudioCapture> createAudioCapture();

} // namespace Capture
} // namespace AudioFX