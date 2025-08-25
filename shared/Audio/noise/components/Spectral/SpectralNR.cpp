#include "SpectralNR.hpp"
#include "../../../common/config/NoiseConstants.hpp"
#include <algorithm>
#include <cmath>
#include <stdexcept>
#include <vector>

namespace AudioNR {

// Import des constantes pour éviter la répétition des namespace
using namespace SpectralNRConstants;

static inline float hann(size_t n, size_t N) {
    return HANN_AMPLITUDE * (HANN_FACTOR - std::cos(HANN_FREQUENCY_FACTOR * static_cast<float>(M_PI) * static_cast<float>(n) / static_cast<float>(N - HANN_LENGTH_OFFSET)));
}

SpectralNR::SpectralNR(const SpectralNRConfig& cfg) { setConfig(cfg); }
SpectralNR::~SpectralNR() = default;

void SpectralNR::setConfig(const SpectralNRConfig& cfg) {
    // Validate configuration
    if (!isPowerOfTwo(cfg.fftSize)) {
        throw std::invalid_argument("FFT size must be a power of 2");
    }
    if (cfg.fftSize < MIN_FFT_SIZE || cfg.fftSize > MAX_FFT_SIZE) {
        throw std::invalid_argument("FFT size must be between 64 and 8192");
    }
    if (cfg.hopSize < MIN_HOP_SIZE || cfg.hopSize > cfg.fftSize) {
        throw std::invalid_argument("Hop size must be between 1 and FFT size");
    }
    if (cfg.beta < MIN_BETA || cfg.beta > MAX_BETA) {
        throw std::invalid_argument("Beta must be between 0.5 and 5.0");
    }
    if (cfg.floorGain < MIN_FLOOR_GAIN || cfg.floorGain > MAX_FLOOR_GAIN) {
        throw std::invalid_argument("Floor gain must be between 0.0 and 1.0");
    }
    if (cfg.noiseUpdate < MIN_NOISE_UPDATE || cfg.noiseUpdate > MAX_NOISE_UPDATE) {
        throw std::invalid_argument("Noise update must be between 0.0 and 1.0");
    }

    cfg_ = cfg;
    buildWindow();
    // Init FFT engine
    fftEngine_ = Nyth::Audio::FX::createFFTEngine(cfg_.fftSize);
    inBuf_.assign(cfg_.fftSize, ZERO);
    outBuf_.assign(cfg_.fftSize, ZERO);
    noiseMag_.assign(cfg_.fftSize / FFT_HALF_DIVISOR + SPECTRUM_NYQUIST_OFFSET, ZERO);

    // Pre-allocate work buffers
    frame_.resize(cfg_.fftSize);
    re_.resize(cfg_.fftSize);
    im_.resize(cfg_.fftSize);
    mag_.resize(cfg_.fftSize / FFT_HALF_DIVISOR + SPECTRUM_NYQUIST_OFFSET);
    ph_.resize(cfg_.fftSize / FFT_HALF_DIVISOR + SPECTRUM_NYQUIST_OFFSET);
    time_.resize(cfg_.fftSize);

    writePos_ = SPECTRUM_DC_INDEX;
    noiseInit_ = true;
}

void SpectralNR::buildWindow() {
    window_.resize(cfg_.fftSize);
    for (size_t n = SPECTRUM_DC_INDEX; n < cfg_.fftSize; ++n) {
        window_[n] = hann(n, cfg_.fftSize);
    }
}

void SpectralNR::fft(const std::vector<float>& in, std::vector<float>& re, std::vector<float>& im) {
    fftEngine_->forwardR2C(in.data(), re, im);
}

void SpectralNR::ifft(const std::vector<float>& re, const std::vector<float>& im, std::vector<float>& out) {
    out.resize(cfg_.fftSize);
    fftEngine_->inverseC2R(re, im, out.data());
}

void SpectralNR::process(const float* input, float* output, size_t numSamples) {
    if (!input || !output) {
        throw std::invalid_argument("Input and output buffers must not be null");
    }
    if (numSamples == SPECTRUM_DC_INDEX) return;

    if (!cfg_.enabled) {
        // Avoid copy if processing in-place
        if (output != input) {
            std::copy(input, input + numSamples, output);
        }
        return;
    }
    size_t pos = SPECTRUM_DC_INDEX;
    while (pos < numSamples) {
        size_t toCopy = std::min(cfg_.hopSize, numSamples - pos);
        // Shift buffer left by hop
        // std::shift_left is C++20, use std::rotate for C++17
        std::rotate(inBuf_.begin(), inBuf_.begin() + cfg_.hopSize, inBuf_.end());
        // Copy new input
        size_t destOffset = cfg_.fftSize - cfg_.hopSize;
        std::copy(input + pos, input + pos + toCopy, inBuf_.data() + destOffset);
        if (toCopy < cfg_.hopSize) {
            // Zero-pad if we don't have enough samples
            std::fill(inBuf_.begin() + static_cast<long long>(destOffset + toCopy), inBuf_.begin() + static_cast<long long>(destOffset + cfg_.hopSize), 0.0f);
        }

        // Window - use pre-allocated buffer
        for (size_t i = SPECTRUM_DC_INDEX; i < cfg_.fftSize; ++i) frame_[i] = inBuf_[i] * window_[i];

        // FFT - use pre-allocated buffers
        fft(frame_, re_, im_);

        // Magnitude and phase - use pre-allocated buffers
        size_t half = cfg_.fftSize / FFT_HALF_DIVISOR;
        for (size_t k = SPECTRUM_DC_INDEX; k <= half; ++k) {
            float r = re_[k]; float ii = im_[k];
            mag_[k] = std::sqrt(r * r + ii * ii);
            ph_[k] = std::atan2(ii, r);
        }

        // Noise estimate (MCRA-like)
        if (noiseInit_) {
            for (size_t k = SPECTRUM_DC_INDEX; k <= half; ++k) noiseMag_[k] = mag_[k];
            noiseInit_ = false;
        } else {
            for (size_t k = SPECTRUM_DC_INDEX; k <= half; ++k) noiseMag_[k] = static_cast<float>(cfg_.noiseUpdate * noiseMag_[k] + (NOISE_UPDATE_COMPLEMENT - cfg_.noiseUpdate) * mag_[k]);
        }

        // Spectral subtraction with floor
        for (size_t k = SPECTRUM_DC_INDEX; k <= half; ++k) {
            float sub = mag_[k] - static_cast<float>(cfg_.beta) * noiseMag_[k];
            if (sub < cfg_.floorGain * noiseMag_[k]) sub = static_cast<float>(cfg_.floorGain * noiseMag_[k]);
            mag_[k] = sub;
        }

        // Reconstruct full spectrum (Hermitian for real signal)
        for (size_t k = SPECTRUM_DC_INDEX; k <= half; ++k) {
            re_[k] = mag_[k] * std::cos(ph_[k]);
            im_[k] = mag_[k] * std::sin(ph_[k]);
        }
        for (size_t k = half + SPECTRUM_NYQUIST_OFFSET; k < cfg_.fftSize; ++k) {
            size_t kr = cfg_.fftSize - k;
            re_[k] = re_[kr];
            im_[k] = -im_[kr];
        }

        // IFFT - use pre-allocated buffer
        ifft(re_, im_, time_);

        // Overlap-add
        if (outBuf_.size() != cfg_.fftSize) outBuf_.assign(cfg_.fftSize, ZERO);
        for (size_t i = SPECTRUM_DC_INDEX; i < cfg_.fftSize; ++i) outBuf_[i] += time_[i] * window_[i];

        // Output hop segment
        size_t outCount = std::min(cfg_.hopSize, numSamples - pos);
        std::copy(outBuf_.data(), outBuf_.data() + outCount, output + pos);
        // Shift out buffer left
        // std::shift_left is C++20, use std::rotate for C++17
        std::rotate(outBuf_.begin(), outBuf_.begin() + cfg_.hopSize, outBuf_.end());
        std::fill(outBuf_.end() - static_cast<long long>(cfg_.hopSize), outBuf_.end(), ZERO);

        pos += toCopy;
    }
}

} // namespace AudioNR
