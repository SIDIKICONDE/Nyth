#pragma once
#include "EffectBase.hpp"
#include <vector>
#include <algorithm>
#include <cmath>
#include <span>
#include <format>
#include <source_location>
#include <ranges>

namespace AudioFX {

class DelayEffect final : public IAudioEffect {
public:
  using IAudioEffect::processMono;   // évite le masquage des surcharges (templates span)
  using IAudioEffect::processStereo; // idem
  void setParameters(double delayMs, double feedback, double mix) noexcept {
    delayMs_ = std::max(0.0, delayMs);
    feedback_ = std::clamp(feedback, 0.0, 0.95);
    mix_ = std::clamp(mix, 0.0, 1.0);
    updateBuffers();
  }

  void setSampleRate(uint32_t sampleRate, int numChannels) noexcept override {
    IAudioEffect::setSampleRate(sampleRate, numChannels);
    updateBuffers();
  }

  // C++20 modernized processing methods
  template<AudioSampleType T = float>
  void processMonoModern(std::span<const T> input, std::span<T> output,
                        std::source_location location = std::source_location::current()) {
    // Use the base class C++20 method
    processMono(input, output, location);
  }

  template<AudioSampleType T = float>
  void processStereoModern(std::span<const T> inputL, std::span<const T> inputR,
                          std::span<T> outputL, std::span<T> outputR,
                          std::source_location location = std::source_location::current()) {
    // Use the base class C++20 method
    processStereo(inputL, inputR, outputL, outputR, location);
  }

  // Legacy methods (call the modern versions for C++20)
  void processMono(const float* input, float* output, size_t numSamples) override {
    if (!isEnabled() || mix_ <= 0.0001 || !input || !output || numSamples == 0) {
      if (output != input && input && output) {
        std::ranges::copy(std::span<const float>(input, numSamples),
                         std::span<float>(output, numSamples).begin());
      }
      return;
    }
    ensureState(1);
    size_t maxN = buffer_[0].size();

    // C++20 ranges-based processing
    std::ranges::for_each(std::views::iota(size_t{0}, numSamples),
                         [&](size_t i) {
                             float x = input[i];
                             float d = buffer_[0][readIndex_];
                             float y = static_cast<float>((1.0 - mix_) * x + mix_ * d);
                             output[i] = y;
                             // write with feedback
                             float w = static_cast<float>(x + feedback_ * d);
                             buffer_[0][writeIndex_] = w;
                             incrementIndices(maxN);
                         });
  }

  void processStereo(const float* inL, const float* inR, float* outL, float* outR, size_t numSamples) override {
    if (!isEnabled() || mix_ <= 0.0001 || !inL || !inR || !outL || !outR || numSamples == 0) {
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
      outL[i] = static_cast<float>((1.0 - mix_) * xl + mix_ * dl);
      outR[i] = static_cast<float>((1.0 - mix_) * xr + mix_ * dr);
      buffer_[0][writeIndex_] = static_cast<float>(xl + feedback_ * dl);
      buffer_[1][writeIndex_] = static_cast<float>(xr + feedback_ * dr);
      incrementIndices(maxN);
    }
  }

private:
  void updateBuffers() noexcept {
    ensureState(channels_);
    size_t maxDelaySamples = static_cast<size_t>(std::round(delayMs_ * 0.001 * static_cast<double>(sampleRate_)));
    if (maxDelaySamples < 1) maxDelaySamples = 1;
    if (maxDelaySamples > 4 * 48000) maxDelaySamples = 4 * 48000; // clamp 4s max
    std::ranges::for_each(std::views::iota(0, channels_),
                          [&](int ch) {
                              buffer_[ch].assign(maxDelaySamples, 0.0f);
                          });
    // set read/write offset
    writeIndex_ = 0;
    readIndex_ = (maxDelaySamples + writeIndex_ - 1) % maxDelaySamples; // ~delay of N-1 samples initially
  }

  void ensureState(int requiredChannels) {
    if (static_cast<int>(buffer_.size()) != requiredChannels) {
      buffer_.assign(static_cast<size_t>(requiredChannels), std::vector<float>());
      writeIndex_ = readIndex_ = 0;
    }
    for (auto& b : buffer_) if (b.empty()) b.assign(1024, 0.0f);
  }

  inline void incrementIndices(size_t maxN) noexcept {
    writeIndex_++; if (writeIndex_ >= maxN) writeIndex_ = 0;
    readIndex_++; if (readIndex_ >= maxN) readIndex_ = 0;
  }

  // params
  double delayMs_ = 150.0;
  double feedback_ = 0.3;
  double mix_ = 0.25;

  // state
  std::vector<std::vector<float>> buffer_;
  size_t writeIndex_ = 0;
  size_t readIndex_ = 0;
};

} // namespace AudioFX
