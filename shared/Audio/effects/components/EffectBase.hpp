#pragma once

// C++17 compatible headers
#include <algorithm>
#include <cstddef>
#include <cstdint>
#include <sstream>
#include <stdexcept>
#include <string>
#include <type_traits>
#include <vector>


#include "../../core/components/constant/CoreConstants.hpp"
#include "../../common/config/EffectConstants.hpp"


namespace AudioFX {

// All constants are now centralized in EffectConstants.hpp

// C++17 Type traits for better type safety (replaces concepts)
// Note: is_audio_sample_type is now imported from CoreConstants.hpp to avoid conflicts

// Note: is_audio_buffer_type is now imported from CoreConstants.hpp to avoid conflicts

class IAudioEffect {
public:
    virtual ~IAudioEffect() noexcept = default;

    virtual void setSampleRate(uint32_t sampleRate, int numChannels) noexcept {
        sampleRate_ = sampleRate > AudioFX::MIN_SAMPLE_RATE ? sampleRate : AudioFX::DEFAULT_SAMPLE_RATE;
        channels_ = (numChannels == AudioFX::MONO_CHANNELS || numChannels == AudioFX::STEREO_CHANNELS)
                        ? numChannels
                        : AudioFX::DEFAULT_CHANNELS;
    }

    virtual void setEnabled(bool enabled) noexcept {
        enabled_ = enabled;
    }
    [[nodiscard]] bool isEnabled() const noexcept {
        return enabled_;
    }

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

    virtual void processStereo(const float* inL, const float* inR, float* outL, float* outR, size_t numSamples) {
        if (!enabled_ || !inL || !inR || !outL || !outR || numSamples == AudioFX::ZERO_SAMPLES) {
            if (outL && inL && outL != inL) {
                std::copy_n(inL, numSamples, outL);
            }
            if (outR && inR && outR != inR) {
                std::copy_n(inR, numSamples, outR);
            }
            return;
        }
        // Default: passthrough
        if (outL != inL)
            std::copy_n(inL, numSamples, outL);
        if (outR != inR)
            std::copy_n(inR, numSamples, outR);
    }

    // C++17 modernized processing methods
    template <typename T = float>
    typename std::enable_if<std::is_floating_point<T>::value>::type processMono(
        std::vector<T>& input, std::vector<T>& output,
        const std::string& location = std::string(__FILE__) + ":" + std::to_string(__LINE__)) {
        // C++17 validation
        if (input.size() != output.size()) {
            std::ostringstream oss;
            oss << "Input and output vectors must have the same size. Input: " << input.size()
                << ", Output: " << output.size() << " [" << location << "]";
            throw std::invalid_argument(oss.str());
        }

        // Call legacy method for backward compatibility
        if (std::is_same<T, float>::value) {
            processMono(input.data(), output.data(), input.size());
        } else {
            // Convert to float for processing
            std::vector<float> tempInput(input.begin(), input.end());
            std::vector<float> tempOutput(output.size());
            processMono(tempInput.data(), tempOutput.data(), tempInput.size());
            std::copy(tempOutput.begin(), tempOutput.end(), output.begin());
        }
    }

    template <typename T = float>
    typename std::enable_if<std::is_floating_point<T>::value>::type processStereo(
        std::vector<T>& inputL, std::vector<T>& inputR, std::vector<T>& outputL, std::vector<T>& outputR,
        const std::string& location = std::string(__FILE__) + ":" + std::to_string(__LINE__)) {
        // C++17 validation
        if (inputL.size() != inputR.size() || inputL.size() != outputL.size() || inputR.size() != outputR.size()) {
            std::ostringstream oss;
            oss << "All vectors must have the same size [" << location << "]";
            throw std::invalid_argument(oss.str());
        }

        // Pure C++17 implementation - passthrough by default
        if (!enabled_ || inputL.empty()) {
            if (outputL.data() != inputL.data()) {
                std::copy(inputL.begin(), inputL.end(), outputL.begin());
            }
            if (outputR.data() != inputR.data()) {
                std::copy(inputR.begin(), inputR.end(), outputR.begin());
            }
            return;
        }

        // Convert to float for processing if needed
        if (std::is_same<T, float>::value) {
            // Direct float processing - default passthrough
            std::copy(inputL.begin(), inputL.end(), outputL.begin());
            std::copy(inputR.begin(), inputR.end(), outputR.begin());
        } else {
            // Convert to float for processing
            std::vector<float> tempInputL(inputL.begin(), inputL.end());
            std::vector<float> tempInputR(inputR.begin(), inputR.end());
            std::vector<float> tempOutputL(outputL.size());
            std::vector<float> tempOutputR(outputR.size());
            // Default passthrough for base class
            std::copy(tempInputL.begin(), tempInputL.end(), tempOutputL.begin());
            std::copy(tempInputR.begin(), tempInputR.end(), tempOutputR.begin());
            std::copy(tempOutputL.begin(), tempOutputL.end(), outputL.begin());
            std::copy(tempOutputR.begin(), tempOutputR.end(), outputR.begin());
        }
    }

protected:
    uint32_t sampleRate_ = AudioFX::DEFAULT_SAMPLE_RATE;
    int channels_ = AudioFX::DEFAULT_CHANNELS;
    bool enabled_ = AudioFX::DEFAULT_ENABLED_STATE;
};

} // namespace AudioFX
