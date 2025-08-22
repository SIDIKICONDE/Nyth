#pragma once

#ifdef __cplusplus
#include <cmath>
#include <cstdint>
#include <vector>


namespace AudioNR {

/**
 * @brief IMCRA - Improved Minima Controlled Recursive Averaging
 *
 * Advanced noise estimation algorithm based on:
 * Cohen, I. (2003). "Noise spectrum estimation in adverse environments:
 * Improved minima controlled recursive averaging"
 *
 * Key improvements over basic MCRA:
 * - Speech presence probability estimation
 * - Bias compensation for noise overestimation
 * - Adaptive smoothing parameters
 * - Minimum statistics tracking with bias correction
 */
class IMCRA {
public:
    struct Config {
        // Core parameters
        size_t fftSize = 1024;       ///< FFT size for spectral analysis
        uint32_t sampleRate = 48000; ///< Sample rate in Hz

        // IMCRA specific parameters
        double alphaS = 0.95;  ///< Smoothing factor for power spectrum
        double alphaD = 0.95;  ///< Smoothing factor for noise estimation
        double alphaD2 = 0.9;  ///< Secondary smoothing for minima tracking
        double betaMax = 0.96; ///< Maximum noise overestimation factor
        double gamma0 = 4.6;   ///< SNR threshold for speech presence
        double gamma1 = 3.0;   ///< Secondary SNR threshold
        double zeta0 = 1.67;   ///< A priori SNR threshold

        // Window parameters for minimum tracking
        size_t windowLength = 80;   ///< Length of minimum tracking window (frames)
        size_t subWindowLength = 8; ///< Sub-window for local minima

        // Speech presence probability parameters
        double qMax = 0.95;    ///< Maximum speech absence probability
        double qMin = 0.3;     ///< Minimum speech absence probability
        double xiOptDb = 15.0; ///< Optimal a priori SNR in dB
        double xiMin = 0.001;  ///< Minimum a priori SNR
        double gMin = 0.001;   ///< Minimum gain floor
    };

    explicit IMCRA(const Config& cfg);
    explicit IMCRA();
    ~IMCRA();

    /**
     * @brief Process a spectral frame and update noise estimation
     * @param magnitudeSpectrum Input magnitude spectrum
     * @param noiseSpectrum Output estimated noise spectrum
     * @param speechProbability Output speech presence probability per bin
     */
    void processFrame(const std::vector<float>& magnitudeSpectrum, std::vector<float>& noiseSpectrum,
                      std::vector<float>& speechProbability);

    /**
     * @brief Get the a priori SNR estimate
     * @return Vector of a priori SNR values per frequency bin
     */
    const std::vector<float>& getAPrioriSNR() const {
        return xi_;
    }

    /**
     * @brief Get the a posteriori SNR estimate
     * @return Vector of a posteriori SNR values per frequency bin
     */
    const std::vector<float>& getAPosterioriSNR() const {
        return gamma_;
    }

    /**
     * @brief Reset the estimator to initial state
     */
    void reset();

    /**
     * @brief Update configuration
     * @param cfg New configuration
     */
    void setConfig(const Config& cfg);

private:
    Config cfg_;
    size_t numBins_;    ///< Number of frequency bins (fftSize/2 + 1)
    size_t frameCount_; ///< Frame counter

    // Spectral estimates
    std::vector<float> S_;        ///< Smoothed power spectrum
    std::vector<float> Smin_;     ///< Minimum power spectrum
    std::vector<float> Stmp_;     ///< Temporary minimum for current window
    std::vector<float> lambda_d_; ///< Noise power spectrum estimate

    // SNR estimates
    std::vector<float> xi_;    ///< A priori SNR
    std::vector<float> gamma_; ///< A posteriori SNR
    std::vector<float> GH1_;   ///< Gain function for hypothesis H1 (speech present)

    // Speech presence probability
    std::vector<float> q_; ///< Speech absence probability
    std::vector<float> p_; ///< Speech presence probability

    // Minimum tracking
    std::vector<std::vector<float>> Smin_sw_; ///< Sub-window minima buffer
    std::vector<size_t> Smin_sw_idx_;         ///< Sub-window index
    size_t subwc_;                            ///< Sub-window counter

    // Bias correction
    std::vector<float> b_;          ///< Bias correction factor
    std::vector<float> Bmin_;       ///< Minimum bias factor
    std::vector<size_t> lmin_flag_; ///< Flag for minimum update

    // Helper functions
    void updateMinimumStatistics(const std::vector<float>& magnitude);
    void updateSpeechPresenceProbability();
    void updateAPrioriSNR(const std::vector<float>& magnitude);
    void computeGainFunction();
    float computeSpeechProbability(float gammak, float xik);

    // Mathematical utilities
    inline float expint(float x) {
        // Exponential integral approximation E1(x)
        if (x < 1.0f) {
            return -std::log(x) - 0.57721566f + x - x * x / 4.0f + x * x * x / 18.0f;
        } else {
            // Continued fraction approximation for large x
            float sum = 0.0f;
            float term = 1.0f;
            for (int n = 1; n <= 20; ++n) {
                term *= -n / x;
                sum += term;
                if (std::abs(term) < 1e-10f)
                    break;
            }
            return std::exp(-x) / x * (1.0f + sum);
        }
    }

    inline float max(float a, float b) {
        return (a > b) ? a : b;
    }
    inline float min(float a, float b) {
        return (a < b) ? a : b;
    }
    inline float clamp(float x, float lo, float hi) {
        return min(max(x, lo), hi);
    }
};

} // namespace AudioNR
#endif // __cplusplus
