#include "RNNoiseSuppressor.hpp"
#include "../../common/config/NoiseContants.hpp"
#include <algorithm>
#include <memory>
#include <stdexcept>

namespace {
template <typename T>
inline T maxValue(const T& a, const T& b) {
    return (a < b) ? b : a;
}

template <typename T>
inline T minValue(const T& a, const T& b) {
    return (b < a) ? b : a;
}

// Import des constantes pour éviter la répétition des namespace
using namespace RNNoiseSuppressorConstants;
using namespace SpectralNRConstants;
} // namespace

namespace AudioNR {

RNNoiseSuppressor::RNNoiseSuppressor() = default;
RNNoiseSuppressor::~RNNoiseSuppressor() = default;

bool RNNoiseSuppressor::initialize(uint32_t sampleRate, int numChannels) {
    // Validate inputs
    if (sampleRate < RNNoiseSuppressorConstants::MIN_SAMPLE_RATE ||
        sampleRate > RNNoiseSuppressorConstants::MAX_SAMPLE_RATE) {
        throw std::invalid_argument("Sample rate must be between " +
                                    std::to_string(RNNoiseSuppressorConstants::MIN_SAMPLE_RATE) + " and " +
                                    std::to_string(RNNoiseSuppressorConstants::MAX_SAMPLE_RATE) + " Hz");
    }
    if (numChannels < RNNoiseSuppressorConstants::MIN_CHANNELS ||
        numChannels > RNNoiseSuppressorConstants::MAX_CHANNELS) {
        throw std::invalid_argument("Number of channels must be " +
                                    std::to_string(RNNoiseSuppressorConstants::MIN_CHANNELS) + " or " +
                                    std::to_string(RNNoiseSuppressorConstants::MAX_CHANNELS));
    }

    sampleRate_ = sampleRate;
    channels_ = numChannels;

    // Configs par défaut
    gateCfg_ = NoiseReducerConfig{};
    gateCfg_.enabled = true;
    gateCfg_.highPassHz = RNNoiseSuppressorConstants::DEFAULT_HIGHPASS_HZ;
    gateCfg_.enableHighPass = RNNoiseSuppressorConstants::DEFAULT_ENABLE_HIGHPASS;

    spectralCfg_ = SpectralNRConfig{};
    spectralCfg_.enabled = true;
    spectralCfg_.sampleRate = sampleRate_;
    spectralCfg_.fftSize = SpectralNRConstants::DEFAULT_FFT_SIZE;
    spectralCfg_.hopSize = SpectralNRConstants::DEFAULT_HOP_SIZE; // 75% overlap

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

bool RNNoiseSuppressor::isAvailable() const {
    return available_;
}

void RNNoiseSuppressor::setAggressiveness(double aggressiveness) {
    // Clamp within valid range
    if (aggressiveness < MIN_AGGRESSIVENESS || aggressiveness > MAX_AGGRESSIVENESS) {
        aggressiveness = maxValue(MIN_AGGRESSIVENESS, minValue(MAX_AGGRESSIVENESS, aggressiveness));
    }
    aggressiveness_ = aggressiveness;
    if (!available_)
        return;
    applyAggressivenessToConfigs();
    gate_->setConfig(gateCfg_);
    spectral_->setConfig(spectralCfg_);
}

void RNNoiseSuppressor::processMono(const float* input, float* output, size_t numSamples) {
    if (!input || !output) {
        throw std::invalid_argument("Input and output buffers must not be null");
    }
    if (numSamples == 0)
        return;
    if (!available_ || !gate_ || !spectral_) {
        if (output != input)
            std::copy_n(input, numSamples, output);
        return;
    }

    // Assurer les tampons
    if (scratchOut_.size() < numSamples)
        scratchOut_.resize(numSamples);

    // Étape 1: gate temporel
    gate_->processMono(input, scratchOut_.data(), numSamples);

    // Étape 2: réduction spectrale
    spectral_->process(scratchOut_.data(), output, numSamples);
}

void RNNoiseSuppressor::processStereo(const float* inL, const float* inR, float* outL, float* outR, size_t numSamples) {
    if (!inL || !inR || !outL || !outR) {
        throw std::invalid_argument("All input and output buffers must not be null");
    }
    if (numSamples == 0)
        return;
    if (!available_ || !gate_ || !spectral_) {
        if (outL != inL)
            std::copy_n(inL, numSamples, outL);
        if (outR != inR)
            std::copy_n(inR, numSamples, outR);
        return;
    }

    // Assurer tampons
    if (scratchMono_.size() < numSamples)
        scratchMono_.resize(numSamples);
    if (scratchOut_.size() < numSamples)
        scratchOut_.resize(numSamples);

    // 1) Gate stéréo (par canal) pour éviter les fuites avant mixage
    if (scratchL_.size() < numSamples)
        scratchL_.resize(numSamples);
    if (scratchR_.size() < numSamples)
        scratchR_.resize(numSamples);
    gate_->processStereo(inL, inR, scratchL_.data(), scratchR_.data(), numSamples);

    // 2) Downmix vers mono pour réduction spectrale partagée
    for (size_t i = 0; i < numSamples; ++i) {
        scratchMono_[i] = STEREO_DOWNMIX_FACTOR * (scratchL_[i] + scratchR_[i]);
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
    double a = maxValue(MIN_AGGRESSIVENESS, minValue(MAX_AGGRESSIVENESS, aggressiveness_));
    double t = a / AGGRESSIVENESS_NORMALIZATION; // 0..1

    // NoiseReducer mapping
    gateCfg_.enabled = (a > MIN_AGGRESSIVENESS);
    gateCfg_.thresholdDb = GateMapping::THRESHOLD_BASE_DB + GateMapping::THRESHOLD_RANGE_DB * t;
    gateCfg_.ratio = GateMapping::RATIO_BASE + GateMapping::RATIO_RANGE * t;
    gateCfg_.floorDb = GateMapping::FLOOR_BASE_DB + GateMapping::FLOOR_RANGE_DB * t;
    gateCfg_.attackMs = GateMapping::ATTACK_BASE_MS + GateMapping::ATTACK_RANGE_MS * t;
    gateCfg_.releaseMs = GateMapping::RELEASE_BASE_MS + GateMapping::RELEASE_RANGE_MS * t;
    gateCfg_.highPassHz = GateMapping::HIGHPASS_BASE_HZ + GateMapping::HIGHPASS_RANGE_HZ * t;
    gateCfg_.enableHighPass = true;

    // SpectralNR mapping
    spectralCfg_.enabled = (a > MIN_AGGRESSIVENESS);
    spectralCfg_.sampleRate = sampleRate_;
    spectralCfg_.fftSize = SpectralMapping::FFT_SIZE; // fixe et robuste
    spectralCfg_.hopSize = SpectralMapping::HOP_SIZE; // 75% overlap
    spectralCfg_.beta = SpectralMapping::BETA_BASE + SpectralMapping::BETA_RANGE * t;
    spectralCfg_.floorGain = SpectralMapping::FLOOR_GAIN_BASE + SpectralMapping::FLOOR_GAIN_RANGE * t;
    spectralCfg_.noiseUpdate = SpectralMapping::NOISE_UPDATE_BASE + SpectralMapping::NOISE_UPDATE_RANGE * t;
}

} // namespace AudioNR
