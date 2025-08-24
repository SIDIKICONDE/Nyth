#pragma once

#ifdef __cplusplus
#include "../Imcra/Imcra.hpp"
#include <cstdint>
#include <memory>
#include <vector>

#include "../../common/utils/MathUtils.hpp"

namespace AudioNR {

/**
 * @brief Adaptive Wiener Filter for optimal noise suppression
 *
 * Implements an adaptive Wiener filter based on MMSE (Minimum Mean Square Error)
 * estimation. The filter adapts to changing noise conditions and provides
 * optimal suppression in the MMSE sense.
 *
 * Key features:
 * - MMSE-LSA (Log-Spectral Amplitude) estimator
 * - Decision-directed approach for a priori SNR estimation
 * - Musical noise reduction through gain smoothing
 * - Incorporates perceptual weighting
 */
class WienerFilter {
public:
    /**
     * @brief Configuration for Wiener filter
     */
    struct Config {
        // Core parameters
        size_t fftSize = WienerFilterConstants::DEFAULT_FFT_SIZE;
        uint32_t sampleRate = WienerFilterConstants::DEFAULT_SAMPLE_RATE;

        // Wiener filter parameters
        double alpha = WienerFilterConstants::DEFAULT_ALPHA;  ///< Decision-directed smoothing factor
        double minGain = WienerFilterConstants::DEFAULT_MIN_GAIN; ///< Minimum gain floor (prevents over-suppression)
        double maxGain = WienerFilterConstants::DEFAULT_MAX_GAIN; ///< Maximum gain ceiling

        // MMSE-LSA parameters
        bool useLSA = true;    ///< Use Log-Spectral Amplitude estimator
        double xiMin = WienerFilterConstants::DEFAULT_XI_MIN;  ///< Minimum a priori SNR
        double xiMax = WienerFilterConstants::DEFAULT_XI_MAX; ///< Maximum a priori SNR

        // Musical noise reduction
        double gainSmoothing = WienerFilterConstants::DEFAULT_GAIN_SMOOTHING;      ///< Temporal gain smoothing
        double frequencySmoothing = WienerFilterConstants::DEFAULT_FREQUENCY_SMOOTHING; ///< Spectral gain smoothing

        // Perceptual weighting
        bool usePerceptualWeighting = true;
        double perceptualFactor = WienerFilterConstants::DEFAULT_PERCEPTUAL_FACTOR; ///< Strength of perceptual weighting

        // Noise estimation mode
        enum NoiseEstimationMode {
            SIMPLE,    ///< Simple recursive averaging
            MCRA,      ///< Basic MCRA
            IMCRA_FULL ///< Full IMCRA implementation
        } noiseMode = IMCRA_FULL;
    };

    explicit WienerFilter(const Config& cfg);
    explicit WienerFilter();
    ~WienerFilter();

    /**
     * @brief Process spectral frame with Wiener filtering
     * @param realIn Real part of input spectrum
     * @param imagIn Imaginary part of input spectrum
     * @param realOut Real part of output spectrum
     * @param imagOut Imaginary part of output spectrum
     */
    void processSpectrum(const std::vector<float>& realIn, const std::vector<float>& imagIn,
                         std::vector<float>& realOut, std::vector<float>& imagOut);

    /**
     * @brief Alternative processing with magnitude/phase representation
     * @param magnitude Input magnitude spectrum
     * @param phase Input phase spectrum
     * @param outputMagnitude Output magnitude spectrum
     */
    void processMagnitudePhase(const std::vector<float>& magnitude, const std::vector<float>& phase,
                               std::vector<float>& outputMagnitude);

    /**
     * @brief Get current Wiener gains
     * @return Vector of gain values per frequency bin
     */
    const std::vector<float>& getGains() const {
        return G_;
    }

    /**
     * @brief Get a priori SNR estimates
     * @return Vector of a priori SNR values
     */
    const std::vector<float>& getAPrioriSNR() const {
        return xi_;
    }

    /**
     * @brief Reset filter state
     */
    void reset();

    /**
     * @brief Update configuration
     * @param cfg New configuration
     */
    void setConfig(const Config& cfg);

private:
    Config cfg_;
    size_t numBins_;

    // State variables
    std::vector<float> xi_;       ///< A priori SNR
    std::vector<float> gamma_;    ///< A posteriori SNR
    std::vector<float> G_;        ///< Wiener gain
    std::vector<float> Gprev_;    ///< Previous gain (for smoothing)
    std::vector<float> lambda_n_; ///< Noise PSD estimate
    std::vector<float> S_prev_;   ///< Previous clean speech estimate

    // MMSE-LSA specific
    std::vector<float> v_;   ///< v = xi / (1 + xi) * gamma
    std::vector<float> GH1_; ///< Gain under H1 hypothesis

    // Perceptual weighting
    std::vector<float> perceptualWeight_;

    // Noise estimator
    std::unique_ptr<IMCRA> imcra_;

    // Helper functions
    void initializePerceptualWeights();
    void updateNoiseEstimate(const std::vector<float>& magnitude);
    void computeAPrioriSNR(const std::vector<float>& magnitude);
    void computeWienerGain();
    void computeMMSE_LSA_Gain();
    void applyGainSmoothing();

    // Mathematical functions are now in MathUtils or std
    float besselI0(float x);
    float besselI1(float x);

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

/**
 * @brief Parametric Wiener Filter with adaptive parameters
 *
 * Extension of basic Wiener filter with parametric control
 * over the trade-off between noise reduction and signal distortion
 */
class ParametricWienerFilter : public WienerFilter {
public:
    /**
     * @brief Parametric configuration
     */
    struct ParametricConfig : public WienerFilter::Config {
        // Trade-off parameters
        double beta = ParametricWienerConstants::DEFAULT_BETA;             ///< Over-subtraction factor
        double musicNoiseFloor = ParametricWienerConstants::DEFAULT_MUSIC_NOISE_FLOOR; ///< Floor for musical noise

        // Adaptive parameters based on SNR
        struct SNRAdaptive {
            double lowSNR = ParametricWienerConstants::DEFAULT_LOW_SNR_THRESHOLD;       ///< Low SNR threshold (dB)
            double highSNR = ParametricWienerConstants::DEFAULT_HIGH_SNR_THRESHOLD;      ///< High SNR threshold (dB)
            double aggressiveLow = ParametricWienerConstants::DEFAULT_AGGRESSIVE_LOW; ///< Aggressive reduction at low SNR
            double gentleHigh = ParametricWienerConstants::DEFAULT_GENTLE_HIGH;    ///< Gentle reduction at high SNR
        } snrAdaptive;

        // Frequency-dependent parameters
        bool frequencyShaping = true;
        std::vector<float> frequencyWeights; ///< Per-bin weights
    };

    explicit ParametricWienerFilter(const ParametricConfig& cfg);

    /**
     * @brief Set trade-off parameter
     * @param beta Trade-off between noise reduction and distortion (0-2)
     */
    void setTradeoffParameter(double beta);

    /**
     * @brief Adapt parameters based on estimated SNR
     * @param estimatedSNR Current SNR estimate in dB
     */
    void adaptToSNR(double estimatedSNR);

private:
    ParametricConfig pCfg_;

    void updateParametricGains();
    double computeAdaptiveBeta(double snr);
};

/**
 * @brief Two-Step Noise Reduction (TSNR) using Wiener filter
 *
 * Implements the two-step noise reduction algorithm that combines
 * Wiener filtering with additional post-processing for improved quality
 */
class TwoStepNoiseReduction {
public:
    struct Config {
        size_t fftSize = TwoStepNoiseReductionConstants::DEFAULT_FFT_SIZE;
        uint32_t sampleRate = TwoStepNoiseReductionConstants::DEFAULT_SAMPLE_RATE;

        // First step: Conservative Wiener filter
        double step1MinGain = TwoStepNoiseReductionConstants::DEFAULT_STEP1_MIN_GAIN;
        double step1Alpha = TwoStepNoiseReductionConstants::DEFAULT_STEP1_ALPHA;

        // Second step: Aggressive filtering on residual noise
        double step2MinGain = TwoStepNoiseReductionConstants::DEFAULT_STEP2_MIN_GAIN;
        double step2Alpha = TwoStepNoiseReductionConstants::DEFAULT_STEP2_ALPHA;

        // Residual noise estimation
        double residualThreshold = TwoStepNoiseReductionConstants::DEFAULT_RESIDUAL_THRESHOLD; ///< Threshold for residual detection
        double residualSmoothing = TwoStepNoiseReductionConstants::DEFAULT_RESIDUAL_SMOOTHING; ///< Smoothing for residual estimate
    };

    explicit TwoStepNoiseReduction(const Config& cfg);
    explicit TwoStepNoiseReduction();
    ~TwoStepNoiseReduction();

    /**
     * @brief Process spectrum with two-step noise reduction
     * @param magnitude Input magnitude spectrum
     * @param phase Input phase spectrum
     * @param outputMagnitude Output magnitude spectrum
     */
    void process(const std::vector<float>& magnitude, const std::vector<float>& phase,
                 std::vector<float>& outputMagnitude);

    /**
     * @brief Get gains from both steps (for analysis)
     * @param step1Gains Output gains from step 1
     * @param step2Gains Output gains from step 2
     */
    void getStepGains(std::vector<float>& step1Gains, std::vector<float>& step2Gains) const;

private:
    Config cfg_;

    // Two Wiener filters for each step
    std::unique_ptr<WienerFilter> step1Filter_;
    std::unique_ptr<WienerFilter> step2Filter_;

    // Intermediate buffers
    std::vector<float> intermediateMagnitude_;
    std::vector<float> residualNoise_;

    void estimateResidualNoise(const std::vector<float>& original, const std::vector<float>& filtered);
};

} // namespace AudioNR
#endif // __cplusplus
