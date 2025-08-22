#include "NoiseReducer.hpp"
#include <algorithm>
#include <cmath>
#include <memory>
#include <stdexcept>
#include <vector>
#include "NoiseContants.hpp"

namespace AudioNR {

// Import des constantes pour éviter la répétition des namespace
using namespace NoiseReducerConstants;

NoiseReducer::NoiseReducer(uint32_t sampleRate, int numChannels)
    : sampleRate_(sampleRate), channels_(numChannels) {
    // Validate and clamp inputs
    if (sampleRate_ < MIN_SAMPLE_RATE) {
        throw std::invalid_argument("Sample rate must be at least 8000 Hz");
    }
    if (sampleRate_ > MAX_SAMPLE_RATE) {
        throw std::invalid_argument("Sample rate must not exceed 192000 Hz");
    }

    if (channels_ < MIN_CHANNELS) channels_ = MIN_CHANNELS;
    if (channels_ > MAX_CHANNELS) channels_ = MAX_CHANNELS;

    ch_.resize(static_cast<size_t>(channels_));
    ensureFilters();
    updateDerived();
}

NoiseReducer::~NoiseReducer() = default;

void NoiseReducer::setSampleRate(uint32_t sampleRate) {
    // Validate sample rate (same as constructor)
    if (sampleRate < MIN_SAMPLE_RATE) {
        throw std::invalid_argument("Sample rate must be at least 8000 Hz");
    }
    if (sampleRate > MAX_SAMPLE_RATE) {
        throw std::invalid_argument("Sample rate must not exceed 192000 Hz");
    }

    if (sampleRate_ == sampleRate) return; // Optimization: no change needed
    sampleRate_ = sampleRate;
    ensureFilters();
    updateDerived();
}

void NoiseReducer::setConfig(const NoiseReducerConfig& cfg) {
    // Validate configuration parameters
    if (cfg.thresholdDb > MAX_THRESHOLD_DB || cfg.thresholdDb < MIN_THRESHOLD_DB) {
        throw std::invalid_argument("Threshold must be between -80 and 0 dB");
    }
    if (cfg.ratio < MIN_RATIO || cfg.ratio > MAX_RATIO) {
        throw std::invalid_argument("Ratio must be between 1.0 and 20.0");
    }
    if (cfg.floorDb > MAX_FLOOR_DB || cfg.floorDb < MIN_FLOOR_DB) {
        throw std::invalid_argument("Floor must be between -60 and 0 dB");
    }
    if (cfg.attackMs < MIN_ATTACK_MS || cfg.attackMs > MAX_ATTACK_MS) {
        throw std::invalid_argument("Attack time must be between 0.1 and 100 ms");
    }
    if (cfg.releaseMs < MIN_RELEASE_MS || cfg.releaseMs > MAX_RELEASE_MS) {
        throw std::invalid_argument("Release time must be between 1 and 1000 ms");
    }
    if (cfg.highPassHz < MIN_HIGHPASS_HZ || cfg.highPassHz > MAX_HIGHPASS_HZ) {
        throw std::invalid_argument("High-pass frequency must be between 20 and 1000 Hz");
    }

    config_ = cfg;
    ensureFilters();
    updateDerived();
}

void NoiseReducer::updateDerived() {
    // Pre-calculate linear values from dB (avoid repeated pow() calls)
    threshLin_ = dbToLin(config_.thresholdDb);
    floorLin_ = dbToLin(config_.floorDb);

    // Pre-calculate envelope follower coefficients
    // These use exp() which is expensive, so we cache them
    attackCoeffEnv_ = coefForMs(config_.attackMs);
    releaseCoeffEnv_ = coefForMs(config_.releaseMs);

    // Gain smoothing coefficients (slightly faster attack than release)
    // Attack is faster to open the gate quickly
    attackCoeffGain_ = coefForMs(std::max(UNITY_GAIN, config_.attackMs * ATTACK_GAIN_FACTOR));
    releaseCoeffGain_ = coefForMs(std::max(MIN_RELEASE_GAIN_MS, config_.releaseMs));

    // Pre-calculate common values for the expander curve
    // This avoids repeated calculations in the process loop
    expansionSlope_ = UNITY_RECIPROCAL / config_.ratio;
    threshLin2_ = threshLin_ * threshLin_;  // For faster comparison
}

void NoiseReducer::ensureFilters() {
    for (auto& st : ch_) {
        if (config_.enableHighPass) {
            if (!st.highPass) st.highPass = std::make_unique<AudioFX::BiquadFilter>();
            st.highPass->calculateHighpass(config_.highPassHz, sampleRate_, BUTTERWORTH_Q_FACTOR);
        } else {
            st.highPass.reset();
        }
    }
}

void NoiseReducer::processMono(const float* input, float* output, size_t numSamples) {
    if (!input || !output) {
        throw std::invalid_argument("Input and output buffers must not be null");
    }
    if (numSamples == ZERO_SAMPLES_CHECK) return;

    if (!config_.enabled) {
        if (output != input) std::copy_n(input, numSamples, output);
        return;
    }
    processChannel(input, output, numSamples, ch_[FIRST_CHANNEL_INDEX]);
}

void NoiseReducer::processStereo(const float* inL, const float* inR, float* outL, float* outR, size_t numSamples) {
    if (!inL || !inR || !outL || !outR) {
        throw std::invalid_argument("All input and output buffers must not be null");
    }
    if (numSamples == ZERO_SAMPLES_CHECK) return;
    if (channels_ < STEREO_REQUIRED_CHANNELS) {
        throw std::runtime_error("Stereo processing requires 2 channels");
    }

    if (!config_.enabled) {
        if (outL != inL) std::copy_n(inL, numSamples, outL);
        if (outR != inR) std::copy_n(inR, numSamples, outR);
        return;
    }
    processChannel(inL, outL, numSamples, ch_[FIRST_CHANNEL_INDEX]);
    processChannel(inR, outR, numSamples, ch_[SECOND_CHANNEL_INDEX]);
}

void NoiseReducer::processChannel(const float* in, float* out, size_t n, ChannelState& st) {
    // Optional high-pass pre-filter to remove rumble (avoid per-call allocations)
    if (st.highPass) {
        // Process directly using pointer-based API to avoid vector allocations
        st.highPass->process(in, out, n);
        // For in-place operation, update input pointer to filtered output
        in = out;
    } else if (out != in) {
        // Only copy if buffers are different
        std::copy_n(in, n, out);
    }

    // Envelope follower and expander gain using C++17 loop
    // Simple RMS-like envelope using absolute value smoothing (fast, low cost)
    for (size_t i = 0; i < n; ++i) {
        double x = static_cast<double>(out[i]);
        double ax = std::abs(x);
        // Envelope
        if (ax > st.env) st.env = attackCoeffEnv_ * st.env + (UNITY_GAIN - attackCoeffEnv_) * ax;
        else             st.env = releaseCoeffEnv_ * st.env + (UNITY_GAIN - releaseCoeffEnv_) * ax;

        // Compute static curve for downward expander
        double gTarget = UNITY_GAIN;
        if (st.env < threshLin_) {
            // Below threshold: apply expansion
            // Simplified calculation using pre-computed values
            double ratio = st.env / threshLin_;

            // Apply expansion curve: output = input^(1/ratio)
            // This gives a smooth transition at the threshold
            gTarget = std::pow(ratio, expansionSlope_);

            // Apply floor limit
            if (gTarget < floorLin_) gTarget = floorLin_;
        }

        // Smooth gain (avoid pumping)
        if (gTarget > st.gain) st.gain = attackCoeffGain_ * st.gain + (UNITY_GAIN - attackCoeffGain_) * gTarget;
        else                   st.gain = releaseCoeffGain_ * st.gain + (UNITY_GAIN - releaseCoeffGain_) * gTarget;

        out[i] = static_cast<float>(out[i] * st.gain);
    }
}

} // namespace AudioNR
