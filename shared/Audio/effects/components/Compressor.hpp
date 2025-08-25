#pragma once

// C++17 standard headers
#include "EffectBase.hpp"
#include "../../common/config/EffectConstants.hpp"
#include "../config/EffectsLimits.h" // Source of truth for default values
#include <algorithm>
#include <cmath>
#include <string>
#include <type_traits>
#include <vector>


// Compatibilité macOS/Clang
#ifdef __has_builtin
#if __has_builtin(__builtin_prefetch)
#define AUDIO_PREFETCH(addr, rw, locality) __builtin_prefetch(addr, rw, locality)
#else
#define AUDIO_PREFETCH(addr, rw, locality) ((void)0)
#endif
#else
#ifdef __GNUC__
#define AUDIO_PREFETCH(addr, rw, locality) __builtin_prefetch(addr, rw, locality)
#else
#define AUDIO_PREFETCH(addr, rw, locality) ((void)0)
#endif
#endif

namespace Nyth { namespace Audio { namespace FX {

class CompressorEffect final : public IAudioEffect {
public:
    using IAudioEffect::processMono;   // évite le masquage des surcharges (templates span)
    using IAudioEffect::processStereo; // idem

    // === Structure des métriques ===
    struct CompressorMetrics {
        float inputLevel = 0.0f;      // Niveau d'entrée en dB
        float outputLevel = 0.0f;     // Niveau de sortie en dB
        float gainReduction = 0.0f;   // Réduction de gain en dB
        float compressionRatio = 0.0f; // Ratio de compression actuel
        bool isActive = false;        // Si le compresseur est actif

        CompressorMetrics() = default;
    };

    // === Accès aux métriques ===
    CompressorMetrics getMetrics() const {
        return CompressorMetrics{
            .inputLevel = 20.0f * std::log10(std::max(envL_, Nyth::Audio::FX::EPSILON_DB)),
            .outputLevel = 20.0f * std::log10(std::max(envL_ * gainL_, Nyth::Audio::FX::EPSILON_DB)),
            .gainReduction = 20.0f * std::log10(std::max(gainL_, Nyth::Audio::FX::EPSILON_DB)),
            .compressionRatio = ratio_,
            .isActive = isEnabled() && (envL_ > thresholdDb_)
        };
    }
    void setParameters(double thresholdDb, double ratio, double attackMs, double releaseMs, double makeupDb) noexcept {
        thresholdDb_ = thresholdDb;
        ratio_ = std::max(Nyth::Audio::FX::MIN_RATIO, ratio);
        attackMs_ = std::max(Nyth::Audio::FX::MIN_TIME_MS, attackMs);
        releaseMs_ = std::max(Nyth::Audio::FX::MIN_TIME_MS, releaseMs);
        makeupDb_ = makeupDb;
        updateCoefficients();
    }

    // Structure pour récupérer les paramètres actuels
    struct CompressorParameters {
        float thresholdDb;
        float ratio;
        float attackMs;
        float releaseMs;
        float makeupDb;
    };

    // === Getter pour récupérer les paramètres actuels ===
    CompressorParameters getParameters() const noexcept {
        return CompressorParameters{
            .thresholdDb = static_cast<float>(thresholdDb_),
            .ratio = static_cast<float>(ratio_),
            .attackMs = static_cast<float>(attackMs_),
            .releaseMs = static_cast<float>(releaseMs_),
            .makeupDb = static_cast<float>(makeupDb_)
        };
    }

    void setSampleRate(uint32_t sampleRate, int numChannels) noexcept override {
        IAudioEffect::setSampleRate(sampleRate, numChannels);
        updateCoefficients();
        envL_ = envR_ = DEFAULT_ENVELOPE;
        gainL_ = gainR_ = DEFAULT_GAIN;
    }

    // C++17 modernized processing methods
    template <typename T = float>
    typename std::enable_if<std::is_floating_point<T>::value>::type processMonoModern(
        std::vector<T>& input, std::vector<T>& output,
        const std::string& location = std::string(__FILE__) + ":" + std::to_string(__LINE__)) {
        (void)location; // Éviter warning unused parameter
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
        if (!isEnabled() || !input || !output || numSamples == 0) {
            if (output != input && input && output) {
                std::copy_n(input, numSamples, output);
            }
            return;
        }

        // Optimized processing with loop unrolling
        size_t i = 0;

        // Process samples in blocks for better pipelining
        for (; i + (Nyth::Audio::FX::UNROLL_BLOCK_SIZE - 1) < numSamples; i += Nyth::Audio::FX::UNROLL_BLOCK_SIZE) {
            // Prefetch next block
            if (i + Nyth::Audio::FX::PREFETCH_DISTANCE < numSamples) {
                AUDIO_PREFETCH(&input[i + Nyth::Audio::FX::PREFETCH_DISTANCE], 0, 1);
            }

            // Process samples in current block
            double x0 = static_cast<double>(input[i]);
            double x1 = static_cast<double>(input[i + 1]);
            double x2 = static_cast<double>(input[i + 2]);
            double x3 = static_cast<double>(input[i + 3]);

            double ax0 = std::abs(x0) + Nyth::Audio::FX::EPSILON_DB;
            double ax1 = std::abs(x1) + Nyth::Audio::FX::EPSILON_DB;
            double ax2 = std::abs(x2) + Nyth::Audio::FX::EPSILON_DB;
            double ax3 = std::abs(x3) + Nyth::Audio::FX::EPSILON_DB;

            // Envelope follower for each sample
            double coeff0 = (ax0 > envL_) ? attackCoeff_ : releaseCoeff_;
            envL_ = coeff0 * envL_ + (Nyth::Audio::FX::DEFAULT_GAIN - coeff0) * ax0;
            double levelDb0 = Nyth::Audio::FX::DB_CONVERSION_FACTOR * std::log10(envL_);

            double coeff1 = (ax1 > envL_) ? attackCoeff_ : releaseCoeff_;
            envL_ = coeff1 * envL_ + (Nyth::Audio::FX::DEFAULT_GAIN - coeff1) * ax1;
            double levelDb1 = Nyth::Audio::FX::DB_CONVERSION_FACTOR * std::log10(envL_);

            double coeff2 = (ax2 > envL_) ? attackCoeff_ : releaseCoeff_;
            envL_ = coeff2 * envL_ + (Nyth::Audio::FX::DEFAULT_GAIN - coeff2) * ax2;
            double levelDb2 = Nyth::Audio::FX::DB_CONVERSION_FACTOR * std::log10(envL_);

            double coeff3 = (ax3 > envL_) ? attackCoeff_ : releaseCoeff_;
            envL_ = coeff3 * envL_ + (Nyth::Audio::FX::DEFAULT_GAIN - coeff3) * ax3;
            double levelDb3 = Nyth::Audio::FX::DB_CONVERSION_FACTOR * std::log10(envL_);

            // Apply compression curve
            double outDb0 = (levelDb0 > thresholdDb_) ? thresholdDb_ + (levelDb0 - thresholdDb_) / ratio_ : levelDb0;
            double outDb1 = (levelDb1 > thresholdDb_) ? thresholdDb_ + (levelDb1 - thresholdDb_) / ratio_ : levelDb1;
            double outDb2 = (levelDb2 > thresholdDb_) ? thresholdDb_ + (levelDb2 - thresholdDb_) / ratio_ : levelDb2;
            double outDb3 = (levelDb3 > thresholdDb_) ? thresholdDb_ + (levelDb3 - thresholdDb_) / ratio_ : levelDb3;

            // Calculate gains
            double gainDb0 = (outDb0 - levelDb0) + makeupDb_;
            double gainDb1 = (outDb1 - levelDb1) + makeupDb_;
            double gainDb2 = (outDb2 - levelDb2) + makeupDb_;
            double gainDb3 = (outDb3 - levelDb3) + makeupDb_;

            double gTarget0 = std::pow(Nyth::Audio::FX::POWER_CONVERSION_BASE, gainDb0 / Nyth::Audio::FX::DB_CONVERSION_FACTOR);
            double gTarget1 = std::pow(Nyth::Audio::FX::POWER_CONVERSION_BASE, gainDb1 / Nyth::Audio::FX::DB_CONVERSION_FACTOR);
            double gTarget2 = std::pow(Nyth::Audio::FX::POWER_CONVERSION_BASE, gainDb2 / Nyth::Audio::FX::DB_CONVERSION_FACTOR);
            double gTarget3 = std::pow(Nyth::Audio::FX::POWER_CONVERSION_BASE, gainDb3 / Nyth::Audio::FX::DB_CONVERSION_FACTOR);

            // Smooth gains
            double gCoeff0 = (gTarget0 > gainL_) ? gainAttackCoeff_ : gainReleaseCoeff_;
            gainL_ = gCoeff0 * gainL_ + (Nyth::Audio::FX::DEFAULT_GAIN - gCoeff0) * gTarget0;
            output[i] = static_cast<float>(x0 * gainL_);

            double gCoeff1 = (gTarget1 > gainL_) ? gainAttackCoeff_ : gainReleaseCoeff_;
            gainL_ = gCoeff1 * gainL_ + (Nyth::Audio::FX::DEFAULT_GAIN - gCoeff1) * gTarget1;
            output[i + 1] = static_cast<float>(x1 * gainL_);

            double gCoeff2 = (gTarget2 > gainL_) ? gainAttackCoeff_ : gainReleaseCoeff_;
            gainL_ = gCoeff2 * gainL_ + (Nyth::Audio::FX::DEFAULT_GAIN - gCoeff2) * gTarget2;
            output[i + 2] = static_cast<float>(x2 * gainL_);

            double gCoeff3 = (gTarget3 > gainL_) ? gainAttackCoeff_ : gainReleaseCoeff_;
            gainL_ = gCoeff3 * gainL_ + (Nyth::Audio::FX::DEFAULT_GAIN - gCoeff3) * gTarget3;
            output[i + 3] = static_cast<float>(x3 * gainL_);
        }

        // Process remaining samples
        for (; i < numSamples; ++i) {
            double x = static_cast<double>(input[i]);
            double ax = std::abs(x) + Nyth::Audio::FX::EPSILON_DB;
            double coeff = (ax > envL_) ? attackCoeff_ : releaseCoeff_;
            envL_ = coeff * envL_ + (Nyth::Audio::FX::DEFAULT_GAIN - coeff) * ax;
            double levelDb = Nyth::Audio::FX::DB_CONVERSION_FACTOR * std::log10(envL_);
            double outDb = (levelDb > thresholdDb_) ? thresholdDb_ + (levelDb - thresholdDb_) / ratio_ : levelDb;
            double gainDb = (outDb - levelDb) + makeupDb_;
            double gTarget = std::pow(Nyth::Audio::FX::POWER_CONVERSION_BASE, gainDb / Nyth::Audio::FX::DB_CONVERSION_FACTOR);
            double gCoeff = (gTarget > gainL_) ? gainAttackCoeff_ : gainReleaseCoeff_;
            gainL_ = gCoeff * gainL_ + (Nyth::Audio::FX::DEFAULT_GAIN - gCoeff) * gTarget;
            output[i] = static_cast<float>(x * gainL_);
        }
    }

    void processStereo(const float* inL, const float* inR, float* outL, float* outR, size_t numSamples) override {
        if (!isEnabled() || !inL || !inR || !outL || !outR || numSamples == 0) {
            if (outL != inL && inL && outL)
                for (size_t i = 0; i < numSamples; ++i)
                    outL[i] = inL[i];
            if (outR != inR && inR && outR)
                for (size_t i = 0; i < numSamples; ++i)
                    outR[i] = inR[i];
            return;
        }
        for (size_t i = 0; i < numSamples; ++i) {
            double xl = static_cast<double>(inL[i]);
            double xr = static_cast<double>(inR[i]);
            double ax = Nyth::Audio::FX::STEREO_AVERAGE_FACTOR * (std::abs(xl) + std::abs(xr)) + Nyth::Audio::FX::EPSILON_DB;
            double coeff = (ax > envL_) ? attackCoeff_ : releaseCoeff_;
            envL_ = coeff * envL_ + (Nyth::Audio::FX::DEFAULT_GAIN - coeff) * ax;
            double levelDb = Nyth::Audio::FX::DB_CONVERSION_FACTOR * std::log10(envL_);
            double outDb = levelDb;
            if (levelDb > thresholdDb_)
                outDb = thresholdDb_ + (levelDb - thresholdDb_) / ratio_;
            double gainDb = (outDb - levelDb) + makeupDb_;
            double gTarget = std::pow(Nyth::Audio::FX::POWER_CONVERSION_BASE, gainDb / Nyth::Audio::FX::DB_CONVERSION_FACTOR);
            double gCoeff = (gTarget > gainL_) ? gainAttackCoeff_ : gainReleaseCoeff_;
            gainL_ = gCoeff * gainL_ + (Nyth::Audio::FX::DEFAULT_GAIN - gCoeff) * gTarget;
            // Use separate gain for right channel
            gCoeff = (gTarget > gainR_) ? gainAttackCoeff_ : gainReleaseCoeff_;
            gainR_ = gCoeff * gainR_ + (Nyth::Audio::FX::DEFAULT_GAIN - gCoeff) * gTarget;
            outL[i] = static_cast<float>(xl * gainL_);
            outR[i] = static_cast<float>(xr * gainR_);
        }
    }

private:
    // All constants are now centralized in EffectConstants.hpp

    void updateCoefficients() noexcept {
        auto coefForMs = [this](double ms) {
            double T = std::max(Nyth::Audio::FX::MIN_TIME_MS, ms) / Nyth::Audio::FX::MS_TO_SECONDS_COMPRESSOR;
            return std::exp(-Nyth::Audio::FX::DEFAULT_GAIN / (T * static_cast<double>(sampleRate_)));
        };
        attackCoeff_ = coefForMs(attackMs_);
        releaseCoeff_ = coefForMs(releaseMs_);
        gainAttackCoeff_ = coefForMs(std::max(Nyth::Audio::FX::MIN_GAIN_ATTACK_MS, attackMs_ * Nyth::Audio::FX::GAIN_ATTACK_FACTOR));
        gainReleaseCoeff_ = coefForMs(std::max(Nyth::Audio::FX::MIN_GAIN_RELEASE_MS, releaseMs_));
    }

    // params
    double thresholdDb_ = Nyth::Audio::Effects::Compressor::DEFAULT_THRESHOLD_DB;
    double ratio_ = Nyth::Audio::Effects::Compressor::DEFAULT_RATIO;
    double attackMs_ = Nyth::Audio::Effects::Compressor::DEFAULT_ATTACK_MS;
    double releaseMs_ = Nyth::Audio::Effects::Compressor::DEFAULT_RELEASE_MS;
    double makeupDb_ = Nyth::Audio::Effects::Compressor::DEFAULT_MAKEUP_DB;

    // state
    double envL_ = Nyth::Audio::FX::DEFAULT_ENVELOPE;
    double envR_ = Nyth::Audio::FX::DEFAULT_ENVELOPE;
    double gainL_ = Nyth::Audio::FX::DEFAULT_GAIN;
    double gainR_ = Nyth::Audio::FX::DEFAULT_GAIN;
    double attackCoeff_ = Nyth::Audio::FX::DEFAULT_ATTACK_COEFF;
    double releaseCoeff_ = Nyth::Audio::FX::DEFAULT_RELEASE_COEFF;
    double gainAttackCoeff_ = Nyth::Audio::FX::DEFAULT_GAIN_ATTACK_COEFF;
    double gainReleaseCoeff_ = Nyth::Audio::FX::DEFAULT_GAIN_RELEASE_COEFF;
};

} // namespace Nyth { namespace Audio { namespace FX
