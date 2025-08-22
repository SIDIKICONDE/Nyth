#pragma once
#include <cstdint>
#include <cstddef>
#include <algorithm>
#include <vector>
#include "../../compat/format.hpp"
// #include <concepts> // Supprimé pour C++17
// #include <source_location> // Supprimé pour C++17
#include <type_traits>
#include <array>
#include <algorithm>
#include <stdexcept>
#include "../utils/utilsConstants.hpp"
#include "EffectConstants.hpp"

namespace AudioFX {

// All constants are now centralized in EffectConstants.hpp

// C++20 Concepts for better type safety
template<typename T>
concept AudioSampleType = std::floating_point<T>;

template<typename T>
concept AudioBuffer = requires(T t) {
    typename T::value_type;
    { t.data() } -> std::same_as<typename T::pointer>;
    { t.size() } -> std::same_as<typename T::size_type>;
} || std::is_pointer_v<T>;

class IAudioEffect {
public:
  virtual ~IAudioEffect() noexcept = default;

  virtual void setSampleRate(uint32_t sampleRate, int numChannels) noexcept {
    sampleRate_ = sampleRate > AudioFX::MINIMUM_SAMPLE_RATE ? sampleRate : AudioFX::DEFAULT_SAMPLE_RATE;
    channels_ = (numChannels == AudioFX::MONO_CHANNELS || numChannels == AudioFX::STEREO_CHANNELS) ? numChannels : AudioFX::DEFAULT_CHANNELS;
  }

  virtual void setEnabled(bool enabled) noexcept { enabled_ = enabled; }
  [[nodiscard]] bool isEnabled() const noexcept { return enabled_; }

  // Legacy methods for backward compatibility
  virtual void processMono(const float* input, float* output, size_t numSamples) {
    if (!enabled_ || !input || !output || numSamples == AudioFX::ZERO_SAMPLES) {
      if (output && input && output != input) {
        std::copy_n(input, numSamples, output);
      }
      return;
    }
    // Default: passthrough
    if (output != input) {
      std::copy_n(input, numSamples, output);
    }
  }

  virtual void processStereo(const float* inL, const float* inR,
                             float* outL, float* outR, size_t numSamples) {
    if (!enabled_ || !inL || !inR || !outL || !outR || numSamples == AudioFX::ZERO_SAMPLES) {
      if (outL && inL && outL != inL) { std::copy_n(inL, numSamples, outL); }
      if (outR && inR && outR != inR) { std::copy_n(inR, numSamples, outR); }
      return;
    }
    // Default: passthrough
    if (outL != inL) std::copy_n(inL, numSamples, outL);
    if (outR != inR) std::copy_n(inR, numSamples, outR);
  }

  // C++20 modernized processing methods
  template<AudioSampleType T = float>
  void processMono(std::vector<const T>& input, std::vector<T>& output,
                   std::source_location location = std::string(__FILE__) + ":" + std::to_string(__LINE__)) {
    // C++20 validation
    if (input.size() != output.size()) {
      throw std::invalid_argument(nyth::format(
          "Input and output spans must have the same size. Input: {}, Output: {} [{}:{}]",
          input.size(), output.size(), location.file_name(), location.line()));
    }

    // Call legacy method for backward compatibility
    if constexpr (std::is_same_v<T, float>) {
      processMono(input.data(), output.data(), input.size());
    } else {
      // Convert to float for processing
      std::vector<float> tempInput(input.begin(), input.end());
      std::vector<float> tempOutput(output.size());
      processMono(tempInput.data(), tempOutput.data(), tempInput.size());
      std::copy(tempOutput, output.begin());
    }
  }

  template<AudioSampleType T = float>
  void processStereo(std::vector<const T>& inputL, std::vector<const T>& inputR,
                     std::vector<T>& outputL, std::vector<T>& outputR,
                     std::source_location location = std::string(__FILE__) + ":" + std::to_string(__LINE__)) {
    // C++20 validation
    if (inputL.size() != inputR.size() || inputL.size() != outputL.size() || inputR.size() != outputR.size()) {
      throw std::invalid_argument(nyth::format(
          "All spans must have the same size [{}:{}]", location.file_name(), location.line()));
    }

    // Pure C++20 implementation - passthrough by default
    if (!enabled_ || inputL.empty()) {
      if (outputL.data() != inputL.data()) {
        std::copy(inputL, outputL.begin());
      }
      if (outputR.data() != inputR.data()) {
        std::copy(inputR, outputR.begin());
      }
      return;
    }

    // Convert to float for processing if needed
    if constexpr (std::is_same_v<T, float>) {
      // Direct float processing - default passthrough
      std::copy(inputL, outputL.begin());
      std::copy(inputR, outputR.begin());
    } else {
      // Convert to float for processing
      std::vector<float> tempInputL(inputL.begin(), inputL.end());
      std::vector<float> tempInputR(inputR.begin(), inputR.end());
      std::vector<float> tempOutputL(outputL.size());
      std::vector<float> tempOutputR(outputR.size());
      // Default passthrough for base class
      std::copy(tempInputL, tempOutputL.begin());
      std::copy(tempInputR, tempOutputR.begin());
      std::copy(tempOutputL, outputL.begin());
      std::copy(tempOutputR, outputR.begin());
    }
  }

protected:
  uint32_t sampleRate_ = AudioFX::DEFAULT_SAMPLE_RATE;
  int channels_ = AudioFX::DEFAULT_CHANNELS;
  bool enabled_ = AudioFX::DEFAULT_ENABLED_STATE;
};

} // namespace AudioFX
