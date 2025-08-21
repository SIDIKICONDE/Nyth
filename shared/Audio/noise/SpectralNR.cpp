#include "SpectralNR.h"
#include <cstring>
#include <stdexcept>
#include <cmath>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

namespace AudioNR {

static inline float hann(size_t n, size_t N) {
    return 0.5f * (1.0f - std::cos(2.0f * static_cast<float>(M_PI) * static_cast<float>(n) / static_cast<float>(N - 1)));
}

SpectralNR::SpectralNR(const SpectralNRConfig& cfg) { setConfig(cfg); }
SpectralNR::~SpectralNR() = default;

void SpectralNR::setConfig(const SpectralNRConfig& cfg) {
    // Validate configuration
    if (!isPowerOfTwo(cfg.fftSize)) {
        throw std::invalid_argument("FFT size must be a power of 2");
    }
    if (cfg.fftSize < 64 || cfg.fftSize > 8192) {
        throw std::invalid_argument("FFT size must be between 64 and 8192");
    }
    if (cfg.hopSize == 0 || cfg.hopSize > cfg.fftSize) {
        throw std::invalid_argument("Hop size must be between 1 and FFT size");
    }
    if (cfg.beta < 0.5 || cfg.beta > 5.0) {
        throw std::invalid_argument("Beta must be between 0.5 and 5.0");
    }
    if (cfg.floorGain < 0.0 || cfg.floorGain > 1.0) {
        throw std::invalid_argument("Floor gain must be between 0.0 and 1.0");
    }
    if (cfg.noiseUpdate < 0.0 || cfg.noiseUpdate > 1.0) {
        throw std::invalid_argument("Noise update must be between 0.0 and 1.0");
    }
    
    cfg_ = cfg;
    buildWindow();
    precomputeTwiddleFactors();  // Pre-compute FFT coefficients
    inBuf_.assign(cfg_.fftSize, 0.0f);
    outBuf_.assign(cfg_.fftSize, 0.0f);
    noiseMag_.assign(cfg_.fftSize / 2 + 1, 0.0f);
    writePos_ = 0;
    noiseInit_ = true;
}

void SpectralNR::buildWindow() {
    window_.resize(cfg_.fftSize);
    for (size_t n = 0; n < cfg_.fftSize; ++n) window_[n] = hann(n, cfg_.fftSize);
}

void SpectralNR::fft(const std::vector<float>& in, std::vector<float>& re, std::vector<float>& im) {
    size_t N = cfg_.fftSize;
    if (!isPowerOfTwo(N)) {
        // Fallback to DFT for non-power-of-2 sizes (should not happen with proper config)
        throw std::runtime_error("FFT size must be a power of 2");
    }
    
    // Convert to complex format
    std::vector<std::complex<float>> data(N);
    for (size_t i = 0; i < N; ++i) {
        data[i] = std::complex<float>(in[i], 0.0f);
    }
    
    // Perform FFT
    fftRadix2(data, false);
    
    // Extract real and imaginary parts
    re.resize(N);
    im.resize(N);
    for (size_t i = 0; i < N; ++i) {
        re[i] = data[i].real();
        im[i] = data[i].imag();
    }
}

void SpectralNR::ifft(const std::vector<float>& re, const std::vector<float>& im, std::vector<float>& out) {
    size_t N = cfg_.fftSize;
    if (!isPowerOfTwo(N)) {
        throw std::runtime_error("IFFT size must be a power of 2");
    }
    
    // Convert to complex format
    std::vector<std::complex<float>> data(N);
    for (size_t i = 0; i < N; ++i) {
        data[i] = std::complex<float>(re[i], im[i]);
    }
    
    // Perform inverse FFT
    fftRadix2(data, true);
    
    // Extract real part and normalize
    out.resize(N);
    float scale = 1.0f / static_cast<float>(N);
    for (size_t i = 0; i < N; ++i) {
        out[i] = data[i].real() * scale;
    }
}

void SpectralNR::process(const float* input, float* output, size_t numSamples) {
    if (!input || !output) {
        throw std::invalid_argument("Input and output buffers must not be null");
    }
    if (numSamples == 0) return;
    
    if (!cfg_.enabled) {
        // Avoid copy if processing in-place
        if (output != input) {
            std::memcpy(output, input, numSamples * sizeof(float));
        }
        return;
    }
    size_t pos = 0;
    while (pos < numSamples) {
        size_t toCopy = std::min(cfg_.hopSize, numSamples - pos);
        // Shift buffer left by hop
        std::memmove(inBuf_.data(), inBuf_.data() + cfg_.hopSize, (cfg_.fftSize - cfg_.hopSize) * sizeof(float));
        // Copy new input
        size_t destOffset = cfg_.fftSize - cfg_.hopSize;
        std::memcpy(inBuf_.data() + destOffset, input + pos, toCopy * sizeof(float));
        if (toCopy < cfg_.hopSize) {
            // Zero-pad if we don't have enough samples
            std::memset(inBuf_.data() + destOffset + toCopy, 0, (cfg_.hopSize - toCopy) * sizeof(float));
        }

        // Window
        std::vector<float> frame(cfg_.fftSize);
        for (size_t i = 0; i < cfg_.fftSize; ++i) frame[i] = inBuf_[i] * window_[i];

        // FFT
        std::vector<float> re, im;
        fft(frame, re, im);

        // Magnitude and phase
        size_t half = cfg_.fftSize / 2;
        std::vector<float> mag(half + 1), ph(half + 1);
        for (size_t k = 0; k <= half; ++k) {
            float r = re[k]; float ii = im[k];
            mag[k] = std::sqrt(r * r + ii * ii);
            ph[k] = std::atan2(ii, r);
        }

        // Noise estimate (MCRA-like)
        if (noiseInit_) {
            for (size_t k = 0; k <= half; ++k) noiseMag_[k] = mag[k];
            noiseInit_ = false;
        } else {
            for (size_t k = 0; k <= half; ++k) noiseMag_[k] = static_cast<float>(cfg_.noiseUpdate * noiseMag_[k] + (1.0 - cfg_.noiseUpdate) * mag[k]);
        }

        // Spectral subtraction with floor
        for (size_t k = 0; k <= half; ++k) {
            float sub = mag[k] - static_cast<float>(cfg_.beta) * noiseMag_[k];
            if (sub < cfg_.floorGain * noiseMag_[k]) sub = static_cast<float>(cfg_.floorGain * noiseMag_[k]);
            mag[k] = sub;
        }

        // Reconstruct full spectrum (Hermitian for real signal)
        for (size_t k = 0; k <= half; ++k) {
            re[k] = mag[k] * std::cos(ph[k]);
            im[k] = mag[k] * std::sin(ph[k]);
        }
        for (size_t k = half + 1; k < cfg_.fftSize; ++k) {
            size_t kr = cfg_.fftSize - k;
            re[k] = re[kr];
            im[k] = -im[kr];
        }

        // IFFT
        std::vector<float> time;
        ifft(re, im, time);

        // Overlap-add
        if (outBuf_.size() != cfg_.fftSize) outBuf_.assign(cfg_.fftSize, 0.0f);
        for (size_t i = 0; i < cfg_.fftSize; ++i) outBuf_[i] += time[i] * window_[i];

        // Output hop segment
        size_t outCount = std::min(cfg_.hopSize, numSamples - pos);
        std::memcpy(output + pos, outBuf_.data(), outCount * sizeof(float));
        // Shift out buffer left
        std::memmove(outBuf_.data(), outBuf_.data() + cfg_.hopSize, (cfg_.fftSize - cfg_.hopSize) * sizeof(float));
        std::memset(outBuf_.data() + (cfg_.fftSize - cfg_.hopSize), 0, cfg_.hopSize * sizeof(float));

        pos += toCopy;
    }
}

size_t SpectralNR::reverseBits(size_t x, size_t n) {
    size_t result = 0;
    for (size_t i = 0; i < n; ++i) {
        result = (result << 1) | (x & 1);
        x >>= 1;
    }
    return result;
}

void SpectralNR::fftRadix2(std::vector<std::complex<float>>& data, bool inverse) {
    size_t N = data.size();
    if (N <= 1) return;
    
    // Bit-reversal permutation
    size_t bits = 0;
    size_t temp = N;
    while (temp > 1) {
        bits++;
        temp >>= 1;
    }
    
    for (size_t i = 0; i < N; ++i) {
        size_t j = reverseBits(i, bits);
        if (i < j) {
            std::swap(data[i], data[j]);
        }
    }
    
    // Cooley-Tukey FFT using pre-computed twiddle factors
    size_t twiddleOffset = 0;
    for (size_t size = 2; size <= N; size *= 2) {
        size_t halfSize = size / 2;
        
        for (size_t start = 0; start < N; start += size) {
            for (size_t k = 0; k < halfSize; ++k) {
                // Use pre-computed twiddle factor
                std::complex<float> w = twiddleFactors_[twiddleOffset + k];
                if (inverse) w = std::conj(w);
                
                std::complex<float> t = w * data[start + k + halfSize];
                std::complex<float> u = data[start + k];
                
                data[start + k] = u + t;
                data[start + k + halfSize] = u - t;
            }
        }
        twiddleOffset += halfSize;
    }
}

void SpectralNR::precomputeTwiddleFactors() {
    twiddleFactors_.clear();
    size_t N = cfg_.fftSize;
    
    // Pre-compute twiddle factors for all stages
    for (size_t size = 2; size <= N; size *= 2) {
        size_t halfSize = size / 2;
        float angle = 2.0f * static_cast<float>(M_PI) / static_cast<float>(size);
        
        for (size_t k = 0; k < halfSize; ++k) {
            float phase = angle * static_cast<float>(k);
            twiddleFactors_.emplace_back(std::cos(phase), std::sin(phase));
        }
    }
}

} // namespace AudioNR


