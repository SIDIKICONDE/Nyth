#pragma once

#ifdef __cplusplus
#include <vector>
#include <complex>
#include <cmath>
#include <memory>
#include "IMCRA.hpp"

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
        size_t fftSize = 1024;
        uint32_t sampleRate = 48000;
        
        // Wiener filter parameters
        double alpha = 0.98;              ///< Decision-directed smoothing factor
        double minGain = 0.1;             ///< Minimum gain floor (prevents over-suppression)
        double maxGain = 1.0;             ///< Maximum gain ceiling
        
        // MMSE-LSA parameters
        bool useLSA = true;               ///< Use Log-Spectral Amplitude estimator
        double xiMin = 0.001;             ///< Minimum a priori SNR
        double xiMax = 1000.0;            ///< Maximum a priori SNR
        
        // Musical noise reduction
        double gainSmoothing = 0.7;       ///< Temporal gain smoothing
        double frequencySmoothing = 0.3;  ///< Spectral gain smoothing
        
        // Perceptual weighting
        bool usePerceptualWeighting = true;
        double perceptualFactor = 0.5;    ///< Strength of perceptual weighting
        
        // Noise estimation mode
        enum NoiseEstimationMode {
            SIMPLE,                       ///< Simple recursive averaging
            MCRA,                         ///< Basic MCRA
            IMCRA_FULL                    ///< Full IMCRA implementation
        } noiseMode = IMCRA_FULL;
    };

    explicit WienerFilter(const Config& cfg = Config{});
    ~WienerFilter();

    /**
     * @brief Process spectral frame with Wiener filtering
     * @param realIn Real part of input spectrum
     * @param imagIn Imaginary part of input spectrum
     * @param realOut Real part of output spectrum
     * @param imagOut Imaginary part of output spectrum
     */
    void processSpectrum(const std::vector<float>& realIn,
                        const std::vector<float>& imagIn,
                        std::vector<float>& realOut,
                        std::vector<float>& imagOut);

    /**
     * @brief Alternative processing with magnitude/phase representation
     * @param magnitude Input magnitude spectrum
     * @param phase Input phase spectrum
     * @param outputMagnitude Output magnitude spectrum
     */
    void processMagnitudePhase(const std::vector<float>& magnitude,
                              const std::vector<float>& phase,
                              std::vector<float>& outputMagnitude);

    /**
     * @brief Get current Wiener gains
     * @return Vector of gain values per frequency bin
     */
    const std::vector<float>& getGains() const { return G_; }

    /**
     * @brief Get a priori SNR estimates
     * @return Vector of a priori SNR values
     */
    const std::vector<float>& getAPrioriSNR() const { return xi_; }

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
    std::vector<float> xi_;              ///< A priori SNR
    std::vector<float> gamma_;           ///< A posteriori SNR
    std::vector<float> G_;               ///< Wiener gain
    std::vector<float> Gprev_;           ///< Previous gain (for smoothing)
    std::vector<float> lambda_n_;        ///< Noise PSD estimate
    std::vector<float> S_prev_;          ///< Previous clean speech estimate
    
    // MMSE-LSA specific
    std::vector<float> v_;               ///< v = xi / (1 + xi) * gamma
    std::vector<float> GH1_;             ///< Gain under H1 hypothesis
    
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
    
    // Mathematical functions
    float expint(float x);
    float besselI0(float x);
    float besselI1(float x);
    
    inline float max(float a, float b) { return (a > b) ? a : b; }
    inline float min(float a, float b) { return (a < b) ? a : b; }
    inline float clamp(float x, float lo, float hi) { return min(max(x, lo), hi); }
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
        double beta = 1.0;                ///< Over-subtraction factor
        double musicNoiseFloor = 0.01;    ///< Floor for musical noise
        
        // Adaptive parameters based on SNR
        struct SNRAdaptive {
            double lowSNR = -5.0;          ///< Low SNR threshold (dB)
            double highSNR = 20.0;         ///< High SNR threshold (dB)
            double aggressiveLow = 0.9;   ///< Aggressive reduction at low SNR
            double gentleHigh = 0.3;      ///< Gentle reduction at high SNR
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
        size_t fftSize = 1024;
        uint32_t sampleRate = 48000;
        
        // First step: Conservative Wiener filter
        double step1MinGain = 0.3;
        double step1Alpha = 0.95;
        
        // Second step: Aggressive filtering on residual noise
        double step2MinGain = 0.1;
        double step2Alpha = 0.98;
        
        // Residual noise estimation
        double residualThreshold = 0.5;   ///< Threshold for residual detection
        double residualSmoothing = 0.9;   ///< Smoothing for residual estimate
    };

    explicit TwoStepNoiseReduction(const Config& cfg = Config{});
    ~TwoStepNoiseReduction();

    /**
     * @brief Process spectrum with two-step noise reduction
     * @param magnitude Input magnitude spectrum
     * @param phase Input phase spectrum
     * @param outputMagnitude Output magnitude spectrum
     */
    void process(const std::vector<float>& magnitude,
                const std::vector<float>& phase,
                std::vector<float>& outputMagnitude);

    /**
     * @brief Get gains from both steps (for analysis)
     * @param step1Gains Output gains from step 1
     * @param step2Gains Output gains from step 2
     */
    void getStepGains(std::vector<float>& step1Gains,
                      std::vector<float>& step2Gains) const;

private:
    Config cfg_;
    
    // Two Wiener filters for each step
    std::unique_ptr<WienerFilter> step1Filter_;
    std::unique_ptr<WienerFilter> step2Filter_;
    
    // Intermediate buffers
    std::vector<float> intermediateMagnitude_;
    std::vector<float> residualNoise_;
    
    void estimateResidualNoise(const std::vector<float>& original,
                               const std::vector<float>& filtered);
};

} // namespace AudioNR
#endif // __cplusplus