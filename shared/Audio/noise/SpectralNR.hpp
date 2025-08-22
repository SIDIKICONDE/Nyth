#pragma once

#ifdef __cplusplus
#include <array>
#include <cstdint>
#include <cmath>
#include <algorithm>
#include <complex>
#include "NoiseContants.hpp"
#include "../fft/FFTEngine.hpp"

namespace AudioNR {

// Import des constantes pour éviter la répétition des namespace
using namespace SpectralNRConstants;

/**
 * @brief Configuration for spectral noise reduction
 * 
 * Controls parameters for frequency-domain noise reduction using
 * spectral subtraction with noise estimation.
 */
struct SpectralNRConfig {
    uint32_t sampleRate = DEFAULT_SAMPLE_RATE;  ///< Sample rate in Hz
    size_t fftSize = DEFAULT_FFT_SIZE;        ///< FFT size (must be power of 2). Larger = better frequency resolution
    size_t hopSize = DEFAULT_HOP_SIZE;         ///< Hop size for overlap-add (typically fftSize/4 for 75% overlap)
    double beta = DEFAULT_BETA;            ///< Over-subtraction factor (1.0-3.0). Higher = more aggressive
    double floorGain = DEFAULT_FLOOR_GAIN;      ///< Spectral floor to prevent over-suppression (0.01-0.1 typical)
    double noiseUpdate = DEFAULT_NOISE_UPDATE;    ///< Noise estimation smoothing (0.9-0.99). Higher = slower adaptation
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
    size_t writePos_ = INITIAL_WRITE_POSITION;

    // Noise magnitude estimate per bin
    std::vector<float> noiseMag_;
    bool noiseInit_ = INITIAL_NOISE_STATE;

    // Pre-allocated work buffers to avoid allocations in process()
    std::vector<float> frame_;
    std::vector<float> re_, im_;
    std::vector<float> mag_, ph_;
    std::vector<float> time_;

    // FFT engine (pluggable: KissFFT or fallback radix-2)
    std::unique_ptr<IFFTEngine> fftEngine_;
    void buildWindow();
    
    // Helper
    bool isPowerOfTwo(size_t n) const { return n && !(n & (n - 1)); }
};

} // namespace AudioNR
#endif // __cplusplus


