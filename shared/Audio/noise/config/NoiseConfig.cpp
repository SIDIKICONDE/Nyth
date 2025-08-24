#include "NoiseConfig.h"

namespace Nyth {
namespace Audio {

// === Constantes de validation ===
constexpr uint32_t MIN_SAMPLE_RATE = 8000;
constexpr uint32_t MAX_SAMPLE_RATE = 192000;
constexpr int MIN_CHANNELS = 1;
constexpr int MAX_CHANNELS = 8;
constexpr size_t MIN_FFT_SIZE = 128;
constexpr size_t MAX_FFT_SIZE = 8192;
constexpr size_t MIN_HOP_SIZE = 32;
constexpr size_t MAX_HOP_SIZE = 4096;
constexpr float MIN_AGGRESSIVENESS = 0.0f;
constexpr float MAX_AGGRESSIVENESS = 3.0f;

// === Implémentation NoiseConfigValidator ===

bool NoiseConfigValidator::validate(const NoiseConfig& config, std::string& error) {
    if (config.sampleRate < MIN_SAMPLE_RATE || config.sampleRate > MAX_SAMPLE_RATE) {
        error = "Sample rate must be between " + std::to_string(MIN_SAMPLE_RATE) + " and " + std::to_string(MAX_SAMPLE_RATE) + " Hz";
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
        error = "Aggressiveness must be between " + std::to_string(MIN_AGGRESSIVENESS) + " and " + std::to_string(MAX_AGGRESSIVENESS);
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
        error = "IMCRA FFT size must be between " + std::to_string(MIN_FFT_SIZE) + " and " + std::to_string(MAX_FFT_SIZE);
        return false;
    }

    if (config.sampleRate < MIN_SAMPLE_RATE || config.sampleRate > MAX_SAMPLE_RATE) {
        error = "IMCRA sample rate must be between " + std::to_string(MIN_SAMPLE_RATE) + " and " + std::to_string(MAX_SAMPLE_RATE) + " Hz";
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
        error = "Wiener FFT size must be between " + std::to_string(MIN_FFT_SIZE) + " and " + std::to_string(MAX_FFT_SIZE);
        return false;
    }

    if (config.sampleRate < MIN_SAMPLE_RATE || config.sampleRate > MAX_SAMPLE_RATE) {
        error = "Wiener sample rate must be between " + std::to_string(MIN_SAMPLE_RATE) + " and " + std::to_string(MAX_SAMPLE_RATE) + " Hz";
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
        error = "Multiband sample rate must be between " + std::to_string(MIN_SAMPLE_RATE) + " and " + std::to_string(MAX_SAMPLE_RATE) + " Hz";
        return false;
    }

    if (config.fftSize < MIN_FFT_SIZE || config.fftSize > MAX_FFT_SIZE) {
        error = "Multiband FFT size must be between " + std::to_string(MIN_FFT_SIZE) + " and " + std::to_string(MAX_FFT_SIZE);
        return false;
    }

    // Validation des niveaux de réduction (doivent être entre 0.0 et 1.0)
    const float reductions[] = {
        config.subBassReduction, config.bassReduction, config.lowMidReduction,
        config.midReduction, config.highMidReduction, config.highReduction,
        config.ultraHighReduction
    };

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
    config.fftSize = 1024;
    config.sampleRate = 48000;
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
    config.fftSize = 1024;
    config.sampleRate = 48000;
    config.alpha = 0.98;
    config.minGain = 0.1;
    config.maxGain = 1.0;
    config.useLSA = true;
    config.gainSmoothing = 0.7;
    config.frequencySmoothing = 0.3;
    config.usePerceptualWeighting = true;
    return config;
}

MultibandConfig NoiseConfigValidator::getDefaultMultiband() {
    MultibandConfig config;
    config.sampleRate = 48000;
    config.fftSize = 2048;
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
