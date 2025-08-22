#pragma once
#include "EffectBase.hpp"
#include "EffectConstants.hpp"
#include <array>
#include <algorithm>
#include <cmath>
#include <vector>
#include <format>
// #include <source_location> // Supprimé pour C++17
#include <algorithm>

namespace AudioFX {

class DelayEffect final : public IAudioEffect {
public:
  using IAudioEffect::processMono;   // évite le masquage des surcharges (templates span)
  using IAudioEffect::processStereo; // idem
  void setParameters(double delayMs, double feedback, double mix) noexcept {
    delayMs_ = std::max(AudioFX::MIN_DELAY_VALUE, delayMs);
    feedback_ = std::clamp(feedback, AudioFX::MIN_FEEDBACK, AudioFX::MAX_FEEDBACK);
    mix_ = std::clamp(mix, AudioFX::MIN_MIX, AudioFX::MAX_MIX);
    updateBuffers();
  }

  void setSampleRate(uint32_t sampleRate, int numChannels) noexcept override {
    IAudioEffect::setSampleRate(sampleRate, numChannels);
    updateBuffers();
  }

  // C++20 modernized processing methods
  template<AudioSampleType T = float>
  void processMonoModern(std::vector<const T>& input, std::vector<T>& output,
                        std::source_location location = std::string(__FILE__) + ":" + std::to_string(__LINE__)) {
    // Use the base class C++20 method
    processMono(input, output, location);
  }

  template<AudioSampleType T = float>
  void processStereoModern(std::vector<const T>& inputL, std::vector<const T>& inputR,
                          std::vector<T>& outputL, std::vector<T>& outputR,
                          std::source_location location = std::string(__FILE__) + ":" + std::to_string(__LINE__)) {
    // Call our own stereo processing method
    if constexpr (std::is_same_v<T, float>) {
      processStereo(inputL.data(), inputR.data(), outputL.data(), outputR.data(), inputL.size());
    } else {
      // Convert to float for processing
      std::vector<float> tempInputL(inputL.begin(), inputL.end());
      std::vector<float> tempInputR(inputR.begin(), inputR.end());
      std::vector<float> tempOutputL(outputL.size());
      std::vector<float> tempOutputR(outputR.size());
      processStereo(tempInputL.data(), tempInputR.data(), tempOutputL.data(), tempOutputR.data(), tempInputL.size());
      std::copy(tempOutputL, outputL.begin());
      std::copy(tempOutputR, outputR.begin());
    }
  }

  // Legacy methods (call the modern versions for C++20)
  void processMono(const float* input, float* output, size_t numSamples) override {
    if (!isEnabled() || mix_ <= AudioFX::MIX_THRESHOLD || !input || !output || numSamples == 0) {
      if (output != input && input && output) {
        std::copy(std::vector<const float>&(input, numSamples),
                         std::vector<float>&(output, numSamples).begin());
      }
      return;
    }
    ensureState(1);
    size_t maxN = buffer_[0].size();

    // C++20 ranges-based processing
    std::for_each(std::views::iota(size_t{0}, numSamples),
                         [&](size_t i) {
                             float x = input[i];
                             float d = buffer_[0][readIndex_];
                             float y = static_cast<float>((AudioFX::MIX_INVERT_FACTOR - mix_) * x + mix_ * d);
                             output[i] = y;
                             // write with feedback
                             float w = static_cast<float>(x + feedback_ * d);
                             buffer_[0][writeIndex_] = w;
                             incrementIndices(maxN);
                         });
  }

  void processStereo(const float* inL, const float* inR, float* outL, float* outR, size_t numSamples) override {
    if (!isEnabled() || mix_ <= AudioFX::MIX_THRESHOLD || !inL || !inR || !outL || !outR || numSamples == 0) {
      if (outL != inL && inL && outL) for (size_t i = 0; i < numSamples; ++i) outL[i] = inL[i];
      if (outR != inR && inR && outR) for (size_t i = 0; i < numSamples; ++i) outR[i] = inR[i];
      return;
    }
    ensureState(2);
    size_t maxN = buffer_[0].size();
    for (size_t i = 0; i < numSamples; ++i) {
      float xl = inL[i];
      float xr = inR[i];
      float dl = buffer_[0][readIndex_];
      float dr = buffer_[1][readIndex_];
      outL[i] = static_cast<float>((AudioFX::MIX_INVERT_FACTOR - mix_) * xl + mix_ * dl);
      outR[i] = static_cast<float>((AudioFX::MIX_INVERT_FACTOR - mix_) * xr + mix_ * dr);
      buffer_[0][writeIndex_] = static_cast<float>(xl + feedback_ * dl);
      buffer_[1][writeIndex_] = static_cast<float>(xr + feedback_ * dr);
      incrementIndices(maxN);
    }
  }

private:
  // All constants are now centralized in EffectConstants.hpp

  void updateBuffers() noexcept {
    ensureState(channels_);
    size_t maxDelaySamples = static_cast<size_t>(std::round(delayMs_ * AudioFX::MS_TO_SECONDS_DELAY * static_cast<double>(sampleRate_)));
    if (maxDelaySamples < AudioFX::MIN_DELAY_SAMPLES) maxDelaySamples = AudioFX::MIN_DELAY_SAMPLES;
    if (maxDelaySamples > AudioFX::MAX_DELAY_SECONDS * AudioFX::REFERENCE_SAMPLE_RATE) maxDelaySamples = AudioFX::MAX_DELAY_SECONDS * AudioFX::REFERENCE_SAMPLE_RATE; // clamp 4s max
    std::for_each(std::views::iota(0, channels_),
                          [&](int ch) {
                              buffer_[ch].assign(maxDelaySamples, AudioFX::BUFFER_INIT_VALUE);
                          });
    // set read/write offset
    writeIndex_ = AudioFX::DEFAULT_INDEX;
    readIndex_ = (maxDelaySamples + writeIndex_ - AudioFX::MIN_DELAY_SAMPLES) % maxDelaySamples; // ~delay of N-1 samples initially
  }

  void ensureState(int requiredChannels) {
    if (static_cast<int>(buffer_.size()) != requiredChannels) {
      buffer_.assign(static_cast<size_t>(requiredChannels), std::vector<float>());
      writeIndex_ = readIndex_ = AudioFX::DEFAULT_INDEX;
    }
    for (auto& b : buffer_) if (b.empty()) b.assign(AudioFX::DEFAULT_BUFFER_SIZE, AudioFX::BUFFER_INIT_VALUE);
  }

  inline void incrementIndices(size_t maxN) noexcept {
    writeIndex_++; if (writeIndex_ >= maxN) writeIndex_ = 0;
    readIndex_++; if (readIndex_ >= maxN) readIndex_ = 0;
  }

  // params
  double delayMs_ = AudioFX::DEFAULT_DELAY_MS;
  double feedback_ = AudioFX::DEFAULT_FEEDBACK;
  double mix_ = AudioFX::DEFAULT_MIX;

  // state
  std::vector<std::vector<float>> buffer_;
  size_t writeIndex_ = AudioFX::DEFAULT_INDEX;
  size_t readIndex_ = AudioFX::DEFAULT_INDEX;
};

} // namespace AudioFX
