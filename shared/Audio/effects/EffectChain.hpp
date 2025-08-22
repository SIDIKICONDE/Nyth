#pragma once
#include "EffectBase.hpp"
#include "EffectConstants.hpp"
#include <memory>
#include <vector>
#include <span>
#include "../../compat/format.hpp"
#include <source_location>
#include <ranges>
#include <stdexcept>

namespace AudioFX {

class EffectChain {
public:
  EffectChain() = default;
  ~EffectChain() = default;

  void setEnabled(bool enabled) noexcept { enabled_ = enabled; }
  [[nodiscard]] bool isEnabled() const noexcept { return enabled_; }

  void setSampleRate(uint32_t sampleRate, int numChannels) noexcept {
    sampleRate_ = sampleRate >= AudioFX::MIN_SAMPLE_RATE ? sampleRate : AudioFX::DEFAULT_SAMPLE_RATE;
    channels_ = (numChannels == AudioFX::MONO_CHANNELS || numChannels == AudioFX::STEREO_CHANNELS) ? numChannels : AudioFX::DEFAULT_CHANNELS;
    std::ranges::for_each(effects_, [&](const auto& e) {
        if (e) e->setSampleRate(sampleRate_, channels_);
    });
  }

  template <typename T, typename... Args>
  T* emplaceEffect(Args&&... args) {
    auto ptr = std::make_unique<T>(std::forward<Args>(args)...);
    ptr->setSampleRate(sampleRate_, channels_);
    T* raw = ptr.get();
    effects_.push_back(std::move(ptr));
    return raw;
  }

  void clear() noexcept { effects_.clear(); }

  // C++20 modernized processing methods
  template<AudioSampleType T = float>
  void processMono(std::span<const T> input, std::span<T> output,
                   std::source_location location = std::source_location::current()) {
    if (!enabled_ || effects_.empty()) {
      if (output.data() != input.data() && !input.empty() && !output.empty()) {
        std::ranges::copy(input, output.begin());
      }
      return;
    }

    // C++20 validation
    if (input.size() != output.size()) {
      throw std::invalid_argument(nyth::format(
          "Input and output spans must have the same size [{}:{}]", location.file_name(), location.line()));
    }

    // Process chain using modern methods if available
    if (!scratch_.size()) scratch_.resize(input.size());

    // First effect - try modern method, fallback to legacy
    if constexpr (std::is_same_v<T, float>) {
      effects_[AudioFX::FIRST_EFFECT_INDEX]->processMono(input.data(), output.data(), input.size());
    } else {
      // Convert for processing
      std::vector<float> tempInput(input.begin(), input.end());
      std::vector<float> tempOutput(output.size());
      effects_[AudioFX::FIRST_EFFECT_INDEX]->processMono(tempInput.data(), tempOutput.data(), tempInput.size());
      std::ranges::copy(tempOutput, output.begin());
    }

    // Chain remaining effects in-place
    for (size_t i = AudioFX::CHAIN_START_INDEX; i < effects_.size(); ++i) {
      if constexpr (std::is_same_v<T, float>) {
        effects_[i]->processMono(output.data(), output.data(), output.size());
      } else {
        std::vector<float> tempOutput(output.begin(), output.end());
        effects_[i]->processMono(tempOutput.data(), tempOutput.data(), tempOutput.size());
        std::ranges::copy(tempOutput, output.begin());
      }
    }
  }

  template<AudioSampleType T = float>
  void processStereo(std::span<const T> inputL, std::span<const T> inputR,
                     std::span<T> outputL, std::span<T> outputR,
                     std::source_location location = std::source_location::current()) {
    if (!enabled_ || effects_.empty()) {
      if (outputL.data() != inputL.data() && !inputL.empty() && !outputL.empty()) {
        std::ranges::copy(inputL, outputL.begin());
      }
      if (outputR.data() != inputR.data() && !inputR.empty() && !outputR.empty()) {
        std::ranges::copy(inputR, outputR.begin());
      }
      return;
    }

    // C++20 validation
    if (inputL.size() != inputR.size() || inputL.size() != outputL.size() || inputR.size() != outputR.size()) {
      throw std::invalid_argument(nyth::format(
          "All spans must have the same size [{}:{}]", location.file_name(), location.line()));
    }

    // Process chain using modern methods
    if constexpr (std::is_same_v<T, float>) {
      effects_[AudioFX::FIRST_EFFECT_INDEX]->processStereo(inputL.data(), inputR.data(), outputL.data(), outputR.data(), inputL.size());
      for (size_t i = AudioFX::CHAIN_START_INDEX; i < effects_.size(); ++i) {
        effects_[i]->processStereo(outputL.data(), outputR.data(), outputL.data(), outputR.data(), outputL.size());
      }
    } else {
      // Convert for processing
      std::vector<float> tempInputL(inputL.begin(), inputL.end());
      std::vector<float> tempInputR(inputR.begin(), inputR.end());
      std::vector<float> tempOutputL(outputL.size());
      std::vector<float> tempOutputR(outputR.size());

      effects_[AudioFX::FIRST_EFFECT_INDEX]->processStereo(tempInputL.data(), tempInputR.data(), tempOutputL.data(), tempOutputR.data(), tempInputL.size());
      for (size_t i = AudioFX::CHAIN_START_INDEX; i < effects_.size(); ++i) {
        effects_[i]->processStereo(tempOutputL.data(), tempOutputR.data(), tempOutputL.data(), tempOutputR.data(), tempOutputL.size());
      }

      std::ranges::copy(tempOutputL, outputL.begin());
      std::ranges::copy(tempOutputR, outputR.begin());
    }
  }

  // Legacy methods for backward compatibility
  void processMonoLegacy(const float* input, float* output, size_t numSamples) {
    if (!enabled_ || effects_.empty()) {
      if (output != input && input && output) for (size_t i = 0; i < numSamples; ++i) output[i] = input[i];
      return;
    }
    // first effect reads input, others in-place on tmp buffer
    if (!scratch_.size()) scratch_.resize(numSamples);
    // run first
    effects_[AudioFX::FIRST_EFFECT_INDEX]->processMono(input, output, numSamples);
    // then chain in-place
    for (size_t i = AudioFX::CHAIN_START_INDEX; i < effects_.size(); ++i) {
      effects_[i]->processMono(output, output, numSamples);
    }
  }

  void processStereoLegacy(const float* inL, const float* inR, float* outL, float* outR, size_t numSamples) {
    if (!enabled_ || effects_.empty()) {
      if (outL != inL && inL && outL) for (size_t i = 0; i < numSamples; ++i) outL[i] = inL[i];
      if (outR != inR && inR && outR) for (size_t i = 0; i < numSamples; ++i) outR[i] = inR[i];
      return;
    }
    effects_[AudioFX::FIRST_EFFECT_INDEX]->processStereo(inL, inR, outL, outR, numSamples);
    for (size_t i = AudioFX::CHAIN_START_INDEX; i < effects_.size(); ++i) {
      effects_[i]->processStereo(outL, outR, outL, outR, numSamples);
    }
  }

private:
  // All constants are now centralized in EffectConstants.hpp

  bool enabled_ = AudioFX::DEFAULT_ENABLED;
  uint32_t sampleRate_ = AudioFX::DEFAULT_SAMPLE_RATE;
  int channels_ = AudioFX::DEFAULT_CHANNELS;
  std::vector<std::unique_ptr<IAudioEffect>> effects_;
  std::vector<float> scratch_;
};

} // namespace AudioFX
