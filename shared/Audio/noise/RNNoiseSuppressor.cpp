#include "RNNoiseSuppressor.hpp"
#include <algorithm>
#include <memory>
#include <vector>
#include <cstdio>
#include <stdexcept>
#include <stdexcept>

namespace {
template <typename T>
inline T maxValue(const T& a, const T& b) { return (a < b) ? b : a; }

template <typename T>
inline T minValue(const T& a, const T& b) { return (b < a) ? b : a; }
}

namespace AudioNR {

RNNoiseSuppressor::RNNoiseSuppressor() = default;
RNNoiseSuppressor::~RNNoiseSuppressor() = default;

bool RNNoiseSuppressor::initialize(uint32_t sampleRate, int numChannels) {
    // Validate inputs
    if (sampleRate < 8000 || sampleRate > 192000) {
        throw std::invalid_argument("Sample rate must be between 8000 and 192000 Hz");
    }
    if (numChannels < 1 || numChannels > 2) {
        throw std::invalid_argument("Number of channels must be 1 or 2");
    }

    sampleRate_ = sampleRate;
    channels_ = numChannels;

    // Configs par défaut
    gateCfg_ = NoiseReducerConfig{};
    gateCfg_.enabled = true;
    gateCfg_.highPassHz = 80.0;
    gateCfg_.enableHighPass = true;

    spectralCfg_ = SpectralNRConfig{};
    spectralCfg_.enabled = true;
    spectralCfg_.sampleRate = sampleRate_;
    spectralCfg_.fftSize = 1024;
    spectralCfg_.hopSize = 256; // 75% overlap

    // Instancier modules
    gate_ = std::make_unique<NoiseReducer>(sampleRate_, channels_);
    spectral_ = std::make_unique<SpectralNR>(spectralCfg_);

    // Appliquer agressivité actuelle
    applyAggressivenessToConfigs();
    gate_->setConfig(gateCfg_);
    spectral_->setConfig(spectralCfg_);

    available_ = true;
    return true;
}

bool RNNoiseSuppressor::isAvailable() const { return available_; }

void RNNoiseSuppressor::setAggressiveness(double aggressiveness) {
    // Clamp 0..3
    if (aggressiveness < 0.0 || aggressiveness > 3.0) {
        aggressiveness = maxValue(0.0, minValue(3.0, aggressiveness));
    }
    aggressiveness_ = aggressiveness;
    if (!available_) return;
    applyAggressivenessToConfigs();
    gate_->setConfig(gateCfg_);
    spectral_->setConfig(spectralCfg_);
}

void RNNoiseSuppressor::processMono(const float* input, float* output, size_t numSamples) {
    if (!input || !output) {
        throw std::invalid_argument("Input and output buffers must not be null");
    }
    if (numSamples == 0) return;
    if (!available_ || !gate_ || !spectral_) {
        if (output != input) std::copy_n(input, numSamples, output);
        return;
    }

    // Assurer les tampons
    if (scratchOut_.size() < numSamples) scratchOut_.resize(numSamples);

    // Étape 1: gate temporel
    gate_->processMono(input, scratchOut_.data(), numSamples);

    // Étape 2: réduction spectrale
    spectral_->process(scratchOut_.data(), output, numSamples);
}

void RNNoiseSuppressor::processStereo(const float* inL, const float* inR,
                                      float* outL, float* outR,
                                      size_t numSamples) {
    if (!inL || !inR || !outL || !outR) {
        throw std::invalid_argument("All input and output buffers must not be null");
    }
    if (numSamples == 0) return;
    if (!available_ || !gate_ || !spectral_) {
        if (outL != inL) std::copy_n(inL, numSamples, outL);
        if (outR != inR) std::copy_n(inR, numSamples, outR);
        return;
    }

    // Assurer tampons
    if (scratchMono_.size() < numSamples) scratchMono_.resize(numSamples);
    if (scratchOut_.size() < numSamples) scratchOut_.resize(numSamples);

    // 1) Gate stéréo (par canal) pour éviter les fuites avant mixage
    if (scratchL_.size() < numSamples) scratchL_.resize(numSamples);
    if (scratchR_.size() < numSamples) scratchR_.resize(numSamples);
    gate_->processStereo(inL, inR, scratchL_.data(), scratchR_.data(), numSamples);

    // 2) Downmix vers mono pour réduction spectrale partagée
    for (size_t i = 0; i < numSamples; ++i) {
        scratchMono_[i] = 0.5f * (scratchL_[i] + scratchR_[i]);
    }

    // 3) Réduction spectrale
    spectral_->process(scratchMono_.data(), scratchOut_.data(), numSamples);

    // 4) Upmix identique sur L/R
    for (size_t i = 0; i < numSamples; ++i) {
        outL[i] = scratchOut_[i];
        outR[i] = scratchOut_[i];
    }
}

void RNNoiseSuppressor::applyAggressivenessToConfigs() {
    double a = maxValue(0.0, minValue(3.0, aggressiveness_));
    double t = a / 3.0; // 0..1

    // NoiseReducer mapping
    gateCfg_.enabled = (a > 0.0);
    gateCfg_.thresholdDb = -45.0 - 25.0 * t;        // -45 .. -70 dB
    gateCfg_.ratio = 1.5 + 6.5 * t;                 // 1.5 .. 8.0
    gateCfg_.floorDb = -12.0 - 23.0 * t;            // -12 .. -35 dB
    gateCfg_.attackMs = 3.0 + 7.0 * t;              // 3 .. 10 ms
    gateCfg_.releaseMs = 30.0 + 120.0 * t;          // 30 .. 150 ms
    gateCfg_.highPassHz = 60.0 + 60.0 * t;          // 60 .. 120 Hz
    gateCfg_.enableHighPass = true;

    // SpectralNR mapping
    spectralCfg_.enabled = (a > 0.0);
    spectralCfg_.sampleRate = sampleRate_;
    spectralCfg_.fftSize = 1024;                     // fixe et robuste
    spectralCfg_.hopSize = 256;                      // 75% overlap
    spectralCfg_.beta = 1.2 + 1.6 * t;               // 1.2 .. 2.8
    spectralCfg_.floorGain = 0.10 - 0.07 * t;        // 0.10 .. 0.03
    spectralCfg_.noiseUpdate = 0.95 + 0.035 * t;     // 0.95 .. 0.985
}

} // namespace AudioNR