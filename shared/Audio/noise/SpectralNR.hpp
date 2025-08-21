#pragma once

#ifdef __cplusplus
#include <vector>
#include <cstdint>
#include <cmath>
#include <algorithm>
#include <complex>

namespace AudioNR {

/**
 * @brief Configuration for spectral noise reduction
 * 
 * Controls parameters for frequency-domain noise reduction using
 * spectral subtraction with noise estimation.
 */
struct SpectralNRConfig {
    uint32_t sampleRate = 48000;  ///< Sample rate in Hz
    size_t fftSize = 1024;        ///< FFT size (must be power of 2). Larger = better frequency resolution
    size_t hopSize = 256;         ///< Hop size for overlap-add (typically fftSize/4 for 75% overlap)
    double beta = 1.5;            ///< Over-subtraction factor (1.0-3.0). Higher = more aggressive
    double floorGain = 0.05;      ///< Spectral floor to prevent over-suppression (0.01-0.1 typical)
    double noiseUpdate = 0.98;    ///< Noise estimation smoothing (0.9-0.99). Higher = slower adaptation
    bool enabled = false;         ///< Enable/disable spectral NR
};

/**
 * @brief Spectral noise reduction using frequency-domain processing
 * 
 * Implements spectral subtraction with dynamic noise estimation.
 * The algorithm:
 * 1. Transforms audio to frequency domain using FFT
 * 2. Estimates noise spectrum using minimum statistics
 * 3. Subtracts estimated noise from signal spectrum
 * 4. Applies spectral floor to prevent over-suppression
 * 5. Transforms back to time domain
 * 
 * @note Introduces latency of (fftSize - hopSize) samples
 * @note Best for stationary noise (fan noise, hiss, etc.)
 */
class SpectralNR {
public:
    /**
     * @brief Construct spectral noise reducer with config
     * @param cfg Initial configuration
     */
    explicit SpectralNR(const SpectralNRConfig& cfg);
    ~SpectralNR();

    /**
     * @brief Update configuration
     * @param cfg New configuration
     * @note This resets internal buffers
     */
    void setConfig(const SpectralNRConfig& cfg);
    
    /**
     * @brief Get current configuration
     * @return Current config
     */
    const SpectralNRConfig& getConfig() const { return cfg_; }

    /**
     * @brief Process audio samples
     * @param input Input buffer
     * @param output Output buffer (can be same as input)
     * @param numSamples Number of samples to process
     */
    void process(const float* input, float* output, size_t numSamples);

private:
    SpectralNRConfig cfg_{};
    std::vector<float> window_;
    std::vector<float> inBuf_;
    std::vector<float> outBuf_;
    size_t writePos_ = 0;

    // Noise magnitude estimate per bin
    std::vector<float> noiseMag_;
    bool noiseInit_ = true;

    // FFT implementation - Radix-2 Cooley-Tukey for efficiency
    void fft(const std::vector<float>& in, std::vector<float>& re, std::vector<float>& im);
    void ifft(const std::vector<float>& re, const std::vector<float>& im, std::vector<float>& out);
    void buildWindow();
    
    // FFT helper functions
    void fftRadix2(std::vector<std::complex<float>>& data, bool inverse = false);
    size_t reverseBits(size_t x, size_t n);
    bool isPowerOfTwo(size_t n) const { return n && !(n & (n - 1)); }
    
    // Pre-computed twiddle factors for FFT optimization
    std::vector<std::complex<float>> twiddleFactors_;
    void precomputeTwiddleFactors();
};

} // namespace AudioNR
#endif // __cplusplus


