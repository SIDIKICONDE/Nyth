#include "NoiseConfig.h"
#include "../../common/config/NoiseContants.hpp"

namespace Nyth {
namespace Audio {

// === Constantes de validation ===
// Utilise les constantes globales unifiées pour la cohérence
constexpr uint32_t MIN_SAMPLE_RATE = GlobalAudioConstants::MIN_SAMPLE_RATE;
constexpr uint32_t MAX_SAMPLE_RATE = GlobalAudioConstants::MAX_SAMPLE_RATE;
constexpr int MIN_CHANNELS = GlobalAudioConstants::MIN_CHANNELS;
constexpr int MAX_CHANNELS = GlobalAudioConstants::MAX_CHANNELS;
constexpr size_t MIN_FFT_SIZE = GlobalAudioConstants::MIN_FFT_SIZE;
constexpr size_t MAX_FFT_SIZE = GlobalAudioConstants::MAX_FFT_SIZE;
constexpr size_t MIN_HOP_SIZE = GlobalAudioConstants::MIN_HOP_SIZE;
constexpr size_t MAX_HOP_SIZE = GlobalAudioConstants::MAX_HOP_SIZE;
constexpr float MIN_AGGRESSIVENESS = GlobalValidationConstants::MIN_AGGRESSIVENESS;
constexpr float MAX_AGGRESSIVENESS = GlobalValidationConstants::MAX_AGGRESSIVENESS;

// === Implémentation NoiseConfigValidator ===

bool NoiseConfigValidator::validate(const NoiseConfig& config, std::string& error) {
    if (config.sampleRate < MIN_SAMPLE_RATE || config.sampleRate > MAX_SAMPLE_RATE) {
        error = "Sample rate must be between " + std::to_string(MIN_SAMPLE_RATE) + " and " +
                std::to_string(MAX_SAMPLE_RATE) + " Hz";
        return false;
    }

    if (config.channels < MIN_CHANNELS || config.channels > MAX_CHANNELS) {
        error = "Channels must be between " + std::to_string(MIN_CHANNELS) + " and " + std::to_string(MAX_CHANNELS);
        return false;
    }

    if (config.fftSize < MIN_FFT_SIZE || config.fftSize > MAX_FFT_SIZE) {
        error = "FFT size must be between " + std::to_string(MIN_FFT_SIZE) + " and " + std::to_string(MAX_FFT_SIZE);
        return false;
    }

    if (config.hopSize < MIN_HOP_SIZE || config.hopSize > MAX_HOP_SIZE) {
        error = "Hop size must be between " + std::to_string(MIN_HOP_SIZE) + " and " + std::to_string(MAX_HOP_SIZE);
        return false;
    }

    if (config.aggressiveness < MIN_AGGRESSIVENESS || config.aggressiveness > MAX_AGGRESSIVENESS) {
        error = "Aggressiveness must be between " + std::to_string(MIN_AGGRESSIVENESS) + " and " +
                std::to_string(MAX_AGGRESSIVENESS);
        return false;
    }

    if (config.advanced.beta <= 0.0f || config.advanced.beta > 1.0f) {
        error = "Advanced beta must be between 0.0 and 1.0";
        return false;
    }

    if (config.advanced.floorGain < 0.0f || config.advanced.floorGain > 1.0f) {
        error = "Advanced floor gain must be between 0.0 and 1.0";
        return false;
    }

    if (config.advanced.noiseUpdateRate <= 0.0f || config.advanced.noiseUpdateRate > 1.0f) {
        error = "Advanced noise update rate must be between 0.0 and 1.0";
        return false;
    }

    return true;
}

bool NoiseConfigValidator::validate(const IMCRAConfig& config, std::string& error) {
    if (config.fftSize < MIN_FFT_SIZE || config.fftSize > MAX_FFT_SIZE) {
        error =
            "IMCRA FFT size must be between " + std::to_string(MIN_FFT_SIZE) + " and " + std::to_string(MAX_FFT_SIZE);
        return false;
    }

    if (config.sampleRate < MIN_SAMPLE_RATE || config.sampleRate > MAX_SAMPLE_RATE) {
        error = "IMCRA sample rate must be between " + std::to_string(MIN_SAMPLE_RATE) + " and " +
                std::to_string(MAX_SAMPLE_RATE) + " Hz";
        return false;
    }

    if (config.alphaS <= 0.0 || config.alphaS > 1.0) {
        error = "IMCRA alphaS must be between 0.0 and 1.0";
        return false;
    }

    if (config.alphaD <= 0.0 || config.alphaD > 1.0) {
        error = "IMCRA alphaD must be between 0.0 and 1.0";
        return false;
    }

    if (config.alphaD2 <= 0.0 || config.alphaD2 > 1.0) {
        error = "IMCRA alphaD2 must be between 0.0 and 1.0";
        return false;
    }

    if (config.betaMax <= 0.0 || config.betaMax > 1.0) {
        error = "IMCRA betaMax must be between 0.0 and 1.0";
        return false;
    }

    return true;
}

bool NoiseConfigValidator::validate(const WienerConfig& config, std::string& error) {
    if (config.fftSize < MIN_FFT_SIZE || config.fftSize > MAX_FFT_SIZE) {
        error =
            "Wiener FFT size must be between " + std::to_string(MIN_FFT_SIZE) + " and " + std::to_string(MAX_FFT_SIZE);
        return false;
    }

    if (config.sampleRate < MIN_SAMPLE_RATE || config.sampleRate > MAX_SAMPLE_RATE) {
        error = "Wiener sample rate must be between " + std::to_string(MIN_SAMPLE_RATE) + " and " +
                std::to_string(MAX_SAMPLE_RATE) + " Hz";
        return false;
    }

    if (config.alpha <= 0.0 || config.alpha > 1.0) {
        error = "Wiener alpha must be between 0.0 and 1.0";
        return false;
    }

    if (config.minGain < 0.0 || config.minGain > config.maxGain) {
        error = "Wiener minGain must be between 0.0 and maxGain";
        return false;
    }

    if (config.maxGain < config.minGain || config.maxGain > 1.0) {
        error = "Wiener maxGain must be between minGain and 1.0";
        return false;
    }

    return true;
}

bool NoiseConfigValidator::validate(const MultibandConfig& config, std::string& error) {
    if (config.sampleRate < MIN_SAMPLE_RATE || config.sampleRate > MAX_SAMPLE_RATE) {
        error = "Multiband sample rate must be between " + std::to_string(MIN_SAMPLE_RATE) + " and " +
                std::to_string(MAX_SAMPLE_RATE) + " Hz";
        return false;
    }

    if (config.fftSize < MIN_FFT_SIZE || config.fftSize > MAX_FFT_SIZE) {
        error = "Multiband FFT size must be between " + std::to_string(MIN_FFT_SIZE) + " and " +
                std::to_string(MAX_FFT_SIZE);
        return false;
    }

    // Validation des niveaux de réduction (doivent être entre 0.0 et 1.0)
    const float reductions[] = {config.subBassReduction,  config.bassReduction,    config.lowMidReduction,
                                config.midReduction,      config.highMidReduction, config.highReduction,
                                config.ultraHighReduction};

    for (float reduction : reductions) {
        if (reduction < 0.0f || reduction > 1.0f) {
            error = "Multiband reduction levels must be between 0.0 and 1.0";
            return false;
        }
    }

    return true;
}

NoiseConfig NoiseConfigValidator::getDefault() {
    return NoiseConfig();
}

IMCRAConfig NoiseConfigValidator::getDefaultIMCRA() {
    IMCRAConfig config;
    config.fftSize = GlobalAudioConstants::DEFAULT_FFT_SIZE;
    config.sampleRate = GlobalAudioConstants::DEFAULT_SAMPLE_RATE;
    config.alphaS = 0.95;
    config.alphaD = 0.95;
    config.alphaD2 = 0.9;
    config.betaMax = 0.96;
    config.gamma0 = 4.6;
    config.gamma1 = 3.0;
    config.zeta0 = 1.67;
    config.windowLength = 80;
    config.subWindowLength = 8;
    return config;
}

WienerConfig NoiseConfigValidator::getDefaultWiener() {
    WienerConfig config;
    config.fftSize = GlobalAudioConstants::DEFAULT_FFT_SIZE;
    config.sampleRate = GlobalAudioConstants::DEFAULT_SAMPLE_RATE;
    config.alpha = GlobalValidationConstants::DEFAULT_ALPHA;
    config.minGain = GlobalValidationConstants::DEFAULT_MIN_GAIN;
    config.maxGain = GlobalValidationConstants::DEFAULT_MAX_GAIN;
    config.useLSA = true;
    config.gainSmoothing = 0.7;
    config.frequencySmoothing = 0.3;
    config.usePerceptualWeighting = true;
    return config;
}

MultibandConfig NoiseConfigValidator::getDefaultMultiband() {
    MultibandConfig config;
    config.sampleRate = GlobalAudioConstants::DEFAULT_SAMPLE_RATE;
    config.fftSize = 2048; // Valeur spécifique pour multiband
    config.subBassReduction = 0.9f;
    config.bassReduction = 0.7f;
    config.lowMidReduction = 0.5f;
    config.midReduction = 0.3f;
    config.highMidReduction = 0.4f;
    config.highReduction = 0.6f;
    config.ultraHighReduction = 0.8f;
    return config;
}

} // namespace Audio
} // namespace Nyth
