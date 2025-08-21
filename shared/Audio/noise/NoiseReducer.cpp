#include "NoiseReducer.hpp"
#include <stdexcept>
#include <algorithm>
#include <vector>
#include <memory>
#include <stdexcept>
#include <cmath>

namespace AudioNR {

NoiseReducer::NoiseReducer(uint32_t sampleRate, int numChannels)
    : sampleRate_(sampleRate), channels_(numChannels) {
    // Validate and clamp inputs
    if (sampleRate_ < 8000) {
        throw std::invalid_argument("Sample rate must be at least 8000 Hz");
    }
    if (sampleRate_ > 192000) {
        throw std::invalid_argument("Sample rate must not exceed 192000 Hz");
    }
    
    if (channels_ < 1) channels_ = 1;
    if (channels_ > 2) channels_ = 2;
    
    ch_.resize(static_cast<size_t>(channels_));
    ensureFilters();
    updateDerived();
}

NoiseReducer::~NoiseReducer() = default;

void NoiseReducer::setSampleRate(uint32_t sampleRate) {
    if (sampleRate_ == sampleRate) return;
    sampleRate_ = sampleRate;
    ensureFilters();
    updateDerived();
}

void NoiseReducer::setConfig(const NoiseReducerConfig& cfg) {
    // Validate configuration parameters
    if (cfg.thresholdDb > 0.0 || cfg.thresholdDb < -80.0) {
        throw std::invalid_argument("Threshold must be between -80 and 0 dB");
    }
    if (cfg.ratio < 1.0 || cfg.ratio > 20.0) {
        throw std::invalid_argument("Ratio must be between 1.0 and 20.0");
    }
    if (cfg.floorDb > 0.0 || cfg.floorDb < -60.0) {
        throw std::invalid_argument("Floor must be between -60 and 0 dB");
    }
    if (cfg.attackMs < 0.1 || cfg.attackMs > 100.0) {
        throw std::invalid_argument("Attack time must be between 0.1 and 100 ms");
    }
    if (cfg.releaseMs < 1.0 || cfg.releaseMs > 1000.0) {
        throw std::invalid_argument("Release time must be between 1 and 1000 ms");
    }
    if (cfg.highPassHz < 20.0 || cfg.highPassHz > 1000.0) {
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
    attackCoeffGain_ = coefForMs(std::max(1.0, config_.attackMs * 0.5));
    releaseCoeffGain_ = coefForMs(std::max(5.0, config_.releaseMs));
    
    // Pre-calculate common values for the expander curve
    // This avoids repeated calculations in the process loop
    expansionSlope_ = 1.0 / config_.ratio;
    threshLin2_ = threshLin_ * threshLin_;  // For faster comparison
}

void NoiseReducer::ensureFilters() {
    for (auto& st : ch_) {
        if (config_.enableHighPass) {
            if (!st.highPass) st.highPass = std::make_unique<AudioEqualizer::BiquadFilter>();
            st.highPass->calculateHighpass(config_.highPassHz, sampleRate_, 0.707);
        } else {
            st.highPass.reset();
        }
    }
}

void NoiseReducer::processMono(const float* input, float* output, size_t numSamples) {
    if (!input || !output) {
        throw std::invalid_argument("Input and output buffers must not be null");
    }
    if (numSamples == 0) return;
    
    if (!config_.enabled) {
        if (output != input) std::copy_n(input, numSamples, output);
        return;
    }
    processChannel(input, output, numSamples, ch_[0]);
}

void NoiseReducer::processStereo(const float* inL, const float* inR, float* outL, float* outR, size_t numSamples) {
    if (!inL || !inR || !outL || !outR) {
        throw std::invalid_argument("All input and output buffers must not be null");
    }
    if (numSamples == 0) return;
    if (channels_ < 2) {
        throw std::runtime_error("Stereo processing requires 2 channels");
    }
    
    if (!config_.enabled) {
        if (outL != inL) std::copy_n(inL, numSamples, outL);
        if (outR != inR) std::copy_n(inR, numSamples, outR);
        return;
    }
    processChannel(inL, outL, numSamples, ch_[0]);
    processChannel(inR, outR, numSamples, ch_[1]);
}

void NoiseReducer::processChannel(const float* in, float* out, size_t n, ChannelState& st) {
    // Optional high-pass pre-filter to remove rumble
    if (st.highPass) {
        st.highPass->process(in, out, n); // use out as temp
        // Now 'out' contains filtered data, 'in' points to original
        in = out; // For in-place operation, update input pointer
    } else if (out != in) {
        // Only copy if buffers are different
        std::copy_n(in, n, out);
    }

    // Envelope follower and expander gain using C++20 ranges
    // Simple RMS-like envelope using absolute value smoothing (fast, low cost)
    std::ranges::for_each(std::views::iota(size_t{0}, n),
                         [&](size_t i) {
                             double x = static_cast<double>(out[i]);
                             double ax = std::abs(x);
                             // Envelope
                             if (ax > st.env) st.env = attackCoeffEnv_ * st.env + (1.0 - attackCoeffEnv_) * ax;
                             else             st.env = releaseCoeffEnv_ * st.env + (1.0 - releaseCoeffEnv_) * ax;

                             // Compute static curve for downward expander
                             double gTarget = 1.0;
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
                             if (gTarget > st.gain) st.gain = attackCoeffGain_ * st.gain + (1.0 - attackCoeffGain_) * gTarget;
                             else                   st.gain = releaseCoeffGain_ * st.gain + (1.0 - releaseCoeffGain_) * gTarget;

                             out[i] = static_cast<float>(out[i] * st.gain);
                         });
}

} // namespace AudioNR


