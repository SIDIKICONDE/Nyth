#pragma once

#include <atomic>
#include <chrono>
#include <cmath>
#include <memory>
#include <mutex>
#include <string>
#include <thread>
#include <vector>

#include "Audio/capture/AudioCapture.hpp"
#include "Audio/capture/AudioCaptureUtilsImpl.hpp"

#ifdef NYTH_USE_ALSA
  #include <alsa/asoundlib.h>
#endif

namespace AudioFX {
namespace Capture {

class DummyToneCapture : public IAudioCapture {
public:
  DummyToneCapture() = default;
  ~DummyToneCapture() override { stop(); }

  bool start(const AudioStreamParams& params, AudioCaptureCallbacks callbacks) override {
    if (m_running.load()) return true;
    m_params = params;
    m_callbacks = std::move(callbacks);

    if (!m_callbacks.onData) {
      return false;
    }

    m_running.store(true);
    if (m_callbacks.onStateChanged) m_callbacks.onStateChanged(true);

    m_thread = std::thread([this]() {
      const double frequency = 440.0;
      const double twoPi = 6.283185307179586;
      double phase = 0.0;
      const double phaseIncrement = twoPi * frequency / static_cast<double>(m_params.sampleRate);

      const size_t frames = m_params.framesPerBuffer > 0 ? m_params.framesPerBuffer : 480;
      const size_t channels = m_params.numChannels > 0 ? m_params.numChannels : 1;

      std::vector<float> buffer(frames * channels);

      while (m_running.load()) {
        for (size_t i = 0; i < frames; ++i) {
          float sample = static_cast<float>(std::sin(phase));
          phase += phaseIncrement;
          if (phase >= twoPi) phase -= twoPi;
          for (size_t ch = 0; ch < channels; ++ch) {
            buffer[i * channels + ch] = sample;
          }
        }
        m_callbacks.onData(buffer.data(), frames);
        std::this_thread::sleep_for(std::chrono::milliseconds(
          static_cast<int>((1000.0 * frames) / std::max<uint32_t>(1, m_params.sampleRate))));
      }
    });

    return true;
  }

  void stop() override {
    if (!m_running.exchange(false)) return;
    if (m_thread.joinable()) m_thread.join();
    if (m_callbacks.onStateChanged) m_callbacks.onStateChanged(false);
  }

  bool isRunning() const override { return m_running.load(); }

  AudioStreamParams getParams() const override { return m_params; }

private:
  std::atomic<bool> m_running{false};
  std::thread m_thread;
  AudioStreamParams m_params;
  AudioCaptureCallbacks m_callbacks;
};

#ifdef NYTH_USE_ALSA
class AlsaAudioCapture : public IAudioCapture {
public:
  AlsaAudioCapture() = default;
  ~AlsaAudioCapture() override { stop(); }

  bool start(const AudioStreamParams& params, AudioCaptureCallbacks callbacks) override {
    if (m_running.load()) return true;
    if (!callbacks.onData) return false;

    m_params = params;
    m_callbacks = std::move(callbacks);

    const std::string device = m_params.deviceName.empty() ? std::string("default") : m_params.deviceName;

    int rc = snd_pcm_open(&m_pcm, device.c_str(), SND_PCM_STREAM_CAPTURE, 0);
    if (rc < 0) {
      reportError(std::string("ALSA open failed: ") + snd_strerror(rc));
      return false;
    }

    snd_pcm_hw_params_t* hwparams = nullptr;
    snd_pcm_hw_params_malloc(&hwparams);
    snd_pcm_hw_params_any(m_pcm, hwparams);

    snd_pcm_hw_params_set_access(m_pcm, hwparams, SND_PCM_ACCESS_RW_INTERLEAVED);

    snd_pcm_format_t fmt = (m_params.sampleFormat == AudioSampleFormat::Float32)
                             ? SND_PCM_FORMAT_FLOAT_LE
                             : SND_PCM_FORMAT_S16_LE;
    rc = snd_pcm_hw_params_set_format(m_pcm, hwparams, fmt);
    if (rc < 0) {
      reportError(std::string("ALSA set format failed: ") + snd_strerror(rc));
      snd_pcm_hw_params_free(hwparams);
      snd_pcm_close(m_pcm);
      m_pcm = nullptr;
      return false;
    }

    unsigned int rate = m_params.sampleRate;
    snd_pcm_hw_params_set_rate_near(m_pcm, hwparams, &rate, 0);

    rc = snd_pcm_hw_params_set_channels(m_pcm, hwparams, m_params.numChannels);
    if (rc < 0) {
      reportError(std::string("ALSA set channels failed: ") + snd_strerror(rc));
      snd_pcm_hw_params_free(hwparams);
      snd_pcm_close(m_pcm);
      m_pcm = nullptr;
      return false;
    }

    snd_pcm_uframes_t periodSize = m_params.framesPerBuffer > 0 ? m_params.framesPerBuffer : 480;
    snd_pcm_hw_params_set_period_size_near(m_pcm, hwparams, &periodSize, 0);

    rc = snd_pcm_hw_params(m_pcm, hwparams);
    snd_pcm_hw_params_free(hwparams);
    if (rc < 0) {
      reportError(std::string("ALSA apply hw params failed: ") + snd_strerror(rc));
      snd_pcm_close(m_pcm);
      m_pcm = nullptr;
      return false;
    }

    m_running.store(true);
    if (m_callbacks.onStateChanged) m_callbacks.onStateChanged(true);

    m_thread = std::thread([this, fmt]() {
      const size_t frames = m_params.framesPerBuffer > 0 ? m_params.framesPerBuffer : 480;
      const size_t channels = std::max<uint16_t>(1, m_params.numChannels);
      const size_t bytesPerSample = (fmt == SND_PCM_FORMAT_FLOAT_LE) ? sizeof(float) : sizeof(int16_t);
      const size_t bufferBytes = frames * channels * bytesPerSample;

      std::vector<uint8_t> byteBuffer(bufferBytes);
      std::vector<float> floatBuffer(frames * channels);

      while (m_running.load()) {
        snd_pcm_sframes_t readFrames = snd_pcm_readi(m_pcm, byteBuffer.data(), frames);
        if (readFrames == -EPIPE) {
          snd_pcm_prepare(m_pcm);
          continue;
        } else if (readFrames < 0) {
          reportError(std::string("ALSA read failed: ") + snd_strerror(readFrames));
          break;
        }

        const size_t samplesRead = static_cast<size_t>(readFrames) * channels;
        if (fmt == SND_PCM_FORMAT_FLOAT_LE) {
          const float* src = reinterpret_cast<const float*>(byteBuffer.data());
          std::copy(src, src + samplesRead, floatBuffer.data());
        } else {
          const int16_t* src = reinterpret_cast<const int16_t*>(byteBuffer.data());
          convertInt16ToFloat(src, floatBuffer.data(), samplesRead);
        }
        m_callbacks.onData(floatBuffer.data(), static_cast<size_t>(readFrames));
      }

      snd_pcm_drop(m_pcm);
      snd_pcm_close(m_pcm);
      m_pcm = nullptr;

      m_running.store(false);
      if (m_callbacks.onStateChanged) m_callbacks.onStateChanged(false);
    });

    return true;
  }

  void stop() override {
    if (!m_running.exchange(false)) return;
    if (m_pcm) {
      snd_pcm_drop(m_pcm);
    }
    if (m_thread.joinable()) m_thread.join();
    if (m_callbacks.onStateChanged) m_callbacks.onStateChanged(false);
  }

  bool isRunning() const override { return m_running.load(); }

  AudioStreamParams getParams() const override { return m_params; }

private:
  void reportError(const std::string& msg) {
    if (m_callbacks.onError) m_callbacks.onError(msg);
  }

private:
  std::atomic<bool> m_running{false};
  std::thread m_thread;
  snd_pcm_t* m_pcm = nullptr;
  AudioStreamParams m_params;
  AudioCaptureCallbacks m_callbacks;
};
#endif // NYTH_USE_ALSA

inline std::unique_ptr<IAudioCapture> createAudioCapture() {
#ifdef NYTH_USE_ALSA
  return std::make_unique<AlsaAudioCapture>();
#else
  return std::make_unique<DummyToneCapture>();
#endif
}

} // namespace Capture
} // namespace AudioFX