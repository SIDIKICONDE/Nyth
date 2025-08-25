#pragma once

// C++17 compatible headers
#include <algorithm>
#include <cmath>
#include <cstddef>
#include <cstdint>
#include <string>
#include <type_traits>
#include <vector>


#include "EffectBase.hpp"
#include "../../common/config/EffectConstants.hpp"

namespace Nyth { namespace Audio { namespace FX {

class DelayEffect final : public IAudioEffect {
public:
    using IAudioEffect::processMono;   // évite le masquage des surcharges (templates span)
    using IAudioEffect::processStereo; // idem

    // === Structure des métriques ===
    struct DelayMetrics {
        float inputLevel = 0.0f;      // Niveau d'entrée en dB
        float outputLevel = 0.0f;     // Niveau de sortie en dB
        float feedbackLevel = 0.0f;   // Niveau du feedback en dB
        float wetLevel = 0.0f;        // Niveau du signal traité
        bool isActive = false;        // Si le delay est actif

        DelayMetrics() = default;
    };

    // === Accès aux métriques ===
    DelayMetrics getMetrics() const {
        return DelayMetrics{
            .inputLevel = 20.0f * std::log10(std::max(0.1f, 1.0f)), // Estimation
            .outputLevel = 20.0f * std::log10(std::max(0.1f, 1.0f)), // Estimation
            .feedbackLevel = 20.0f * std::log10(std::max(static_cast<double>(Nyth::Audio::FX::EPSILON_DB), static_cast<double>(feedback_))),
            .wetLevel = static_cast<float>(mix_),
            .isActive = isEnabled() && (mix_ > Nyth::Audio::FX::MIX_THRESHOLD)
        };
    }
    void setParameters(double delayMs, double feedback, double mix) noexcept {
        delayMs_ = (delayMs > Nyth::Audio::FX::MIN_DELAY_VALUE) ? delayMs : Nyth::Audio::FX::MIN_DELAY_VALUE;
        feedback_ = (feedback < Nyth::Audio::FX::MIN_FEEDBACK)   ? Nyth::Audio::FX::MIN_FEEDBACK
                    : (feedback > Nyth::Audio::FX::MAX_FEEDBACK) ? Nyth::Audio::FX::MAX_FEEDBACK
                                                         : feedback;
        mix_ = (mix < Nyth::Audio::FX::MIN_MIX) ? Nyth::Audio::FX::MIN_MIX : (mix > Nyth::Audio::FX::MAX_MIX) ? Nyth::Audio::FX::MAX_MIX : mix;
        updateBuffers();
    }

    // Structure pour récupérer les paramètres actuels
    struct DelayParameters {
        float delayMs;
        float feedback;
        float mix;
    };

    // === Getter pour récupérer les paramètres actuels ===
    DelayParameters getParameters() const noexcept {
        return DelayParameters{
            .delayMs = static_cast<float>(delayMs_),
            .feedback = static_cast<float>(feedback_),
            .mix = static_cast<float>(mix_)
        };
    }

    void setSampleRate(uint32_t sampleRate, int numChannels) noexcept override {
        IAudioEffect::setSampleRate(sampleRate, numChannels);
        updateBuffers();
    }

    // C++17 modernized processing methods
    template <typename T = float>
    typename std::enable_if<std::is_floating_point<T>::value>::type processMonoModern(
        std::vector<T>& input, std::vector<T>& output,
        const std::string& location = std::string(__FILE__) + ":" + std::to_string(__LINE__)) {
        // Use the base class C++17 method
        processMono(input, output, location);
    }

    template <typename T = float>
    typename std::enable_if<std::is_floating_point<T>::value>::type processStereoModern(
        std::vector<T>& inputL, std::vector<T>& inputR, std::vector<T>& outputL, std::vector<T>& outputR,
        const std::string& location = std::string(__FILE__) + ":" + std::to_string(__LINE__)) {
        (void)location; // Éviter warning unused parameter
        // Call our own stereo processing method
        if (std::is_same<T, float>::value) {
            processStereo(inputL.data(), inputR.data(), outputL.data(), outputR.data(), inputL.size());
        } else {
            // Convert to float for processing
            std::vector<float> tempInputL(inputL.begin(), inputL.end());
            std::vector<float> tempInputR(inputR.begin(), inputR.end());
            std::vector<float> tempOutputL(outputL.size());
            std::vector<float> tempOutputR(outputR.size());
            processStereo(tempInputL.data(), tempInputR.data(), tempOutputL.data(), tempOutputR.data(),
                          tempInputL.size());
            std::copy(tempOutputL.begin(), tempOutputL.end(), outputL.begin());
            std::copy(tempOutputR.begin(), tempOutputR.end(), outputR.begin());
        }
    }

    // Legacy methods (call the modern versions for C++17)
    void processMono(const float* input, float* output, size_t numSamples) override {
        if (!isEnabled() || mix_ <= Nyth::Audio::FX::MIX_THRESHOLD || !input || !output || numSamples == 0) {
            if (output != input && input && output) {
                std::copy_n(input, numSamples, output);
            }
            return;
        }
        ensureState(1);
        size_t maxN = buffer_[0].size();

        // C++17 traditional loop processing
        for (size_t i = 0; i < numSamples; ++i) {
            float x = input[i];
            float d = buffer_[0][readIndex_];
            float mixf = static_cast<float>(mix_);
            float y = (1.0f - mixf) * x + mixf * d;
            output[i] = y;
            // write with feedback
            float feedbackf = static_cast<float>(feedback_);
            float w = x + feedbackf * d;
            buffer_[0][writeIndex_] = w;
            incrementIndices(maxN);
        }
    }

    void processStereo(const float* inL, const float* inR, float* outL, float* outR, size_t numSamples) override {
        if (!isEnabled() || mix_ <= Nyth::Audio::FX::MIX_THRESHOLD || !inL || !inR || !outL || !outR || numSamples == 0) {
            if (outL != inL && inL && outL)
                for (size_t i = 0; i < numSamples; ++i)
                    outL[i] = inL[i];
            if (outR != inR && inR && outR)
                for (size_t i = 0; i < numSamples; ++i)
                    outR[i] = inR[i];
            return;
        }
        ensureState(2);
        size_t maxN = buffer_[0].size();
        float mixf = static_cast<float>(mix_);
        float feedbackf = static_cast<float>(feedback_);
        for (size_t i = 0; i < numSamples; ++i) {
            float xl = inL[i];
            float xr = inR[i];
            float dl = buffer_[0][readIndex_];
            float dr = buffer_[1][readIndex_];
            outL[i] = (1.0f - mixf) * xl + mixf * dl;
            outR[i] = (1.0f - mixf) * xr + mixf * dr;
            buffer_[0][writeIndex_] = xl + feedbackf * dl;
            buffer_[1][writeIndex_] = xr + feedbackf * dr;
            incrementIndices(maxN);
        }
    }

private:
    // All constants are now centralized in EffectConstants.hpp

    void updateBuffers() noexcept {
        ensureState(channels_);
        size_t maxDelaySamples =
            static_cast<size_t>(std::round(delayMs_ * Nyth::Audio::FX::MS_TO_SECONDS_DELAY * static_cast<double>(sampleRate_)));
        if (maxDelaySamples < Nyth::Audio::FX::MIN_DELAY_SAMPLES)
            maxDelaySamples = Nyth::Audio::FX::MIN_DELAY_SAMPLES;
        if (maxDelaySamples > Nyth::Audio::FX::MAX_DELAY_SECONDS * Nyth::Audio::FX::REFERENCE_SAMPLE_RATE)
            maxDelaySamples = Nyth::Audio::FX::MAX_DELAY_SECONDS * Nyth::Audio::FX::REFERENCE_SAMPLE_RATE; // clamp 4s max
        for (int ch = 0; ch < channels_; ++ch) {
            buffer_[ch].assign(maxDelaySamples, Nyth::Audio::FX::BUFFER_INIT_VALUE);
        }
        // set read/write offset
        writeIndex_ = Nyth::Audio::FX::DEFAULT_INDEX;
        readIndex_ = (maxDelaySamples + writeIndex_ - Nyth::Audio::FX::MIN_DELAY_SAMPLES) %
                     maxDelaySamples; // ~delay of N-1 samples initially
    }

    void ensureState(int requiredChannels) {
        if (static_cast<int>(buffer_.size()) != requiredChannels) {
            buffer_.assign(static_cast<size_t>(requiredChannels), std::vector<float>());
            writeIndex_ = readIndex_ = Nyth::Audio::FX::DEFAULT_INDEX;
        }
        for (auto& b : buffer_)
            if (b.empty())
                b.assign(Nyth::Audio::FX::DEFAULT_BUFFER_SIZE, Nyth::Audio::FX::BUFFER_INIT_VALUE);
    }

    inline void incrementIndices(size_t maxN) noexcept {
        writeIndex_++;
        if (writeIndex_ >= maxN)
            writeIndex_ = 0;
        readIndex_++;
        if (readIndex_ >= maxN)
            readIndex_ = 0;
    }

    // params
    double delayMs_ = Nyth::Audio::FX::DEFAULT_DELAY_MS;
    double feedback_ = Nyth::Audio::FX::DEFAULT_FEEDBACK;
    double mix_ = Nyth::Audio::FX::DEFAULT_MIX;

    // state
    std::vector<std::vector<float>> buffer_;
    size_t writeIndex_ = Nyth::Audio::FX::DEFAULT_INDEX;
    size_t readIndex_ = Nyth::Audio::FX::DEFAULT_INDEX;
};

} // namespace Nyth { namespace Audio { namespace FX
