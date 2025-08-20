#pragma once

#ifdef __cplusplus
#include <vector>
#include <memory>
#include <cmath>
#include "../core/BiquadFilter.h"

namespace AudioNR {

/**
 * @brief Configuration for the NoiseReducer downward expander/gate
 * 
 * This configuration controls how the noise reducer behaves. It implements
 * a downward expander that reduces the volume of signals below a threshold,
 * effectively reducing background noise while preserving louder signals.
 */
struct NoiseReducerConfig {
    // Gate/expander parameters
    double thresholdDb = -50.0;   ///< Threshold in dBFS below which expansion starts (range: -80 to 0)
    double ratio = 2.0;           ///< Downward expander ratio (>1). Higher = more aggressive noise reduction
    double floorDb = -20.0;       ///< Maximum attenuation in dB. Limits how much signal is reduced
    double attackMs = 5.0;        ///< Attack time in ms. How fast the gate opens (1-50ms typical)
    double releaseMs = 60.0;      ///< Release time in ms. How fast the gate closes (10-200ms typical)

    // Pre-filter parameters
    double highPassHz = 80.0;     ///< High-pass filter frequency for rumble removal (20-200Hz typical)
    bool enableHighPass = true;   ///< Enable/disable the high-pass pre-filter

    // Enable/disable
    bool enabled = false;         ///< Master enable/disable for the entire noise reduction
};

/**
 * @brief Real-time noise reducer using downward expansion
 * 
 * This class implements a noise gate/downward expander for real-time audio
 * noise reduction. It works by:
 * 1. Tracking the signal envelope
 * 2. Applying gain reduction when signal falls below threshold
 * 3. Optional high-pass filtering to remove low-frequency rumble
 * 
 * @note Thread-safe for processing, but configuration changes should be
 *       done from a single thread or protected by external synchronization.
 */
class NoiseReducer {
public:
    /**
     * @brief Construct a new NoiseReducer
     * @param sampleRate Sample rate in Hz (e.g., 44100, 48000)
     * @param numChannels Number of channels (1 for mono, 2 for stereo)
     */
    NoiseReducer(uint32_t sampleRate, int numChannels);
    ~NoiseReducer();

    /**
     * @brief Set the noise reducer configuration
     * @param cfg New configuration to apply
     */
    void setConfig(const NoiseReducerConfig& cfg);
    
    /**
     * @brief Get the current configuration
     * @return Current configuration
     */
    const NoiseReducerConfig& getConfig() const { return config_; }

    /**
     * @brief Update the sample rate
     * @param sampleRate New sample rate in Hz
     * @note This will reset internal filters
     */
    void setSampleRate(uint32_t sampleRate);
    
    /**
     * @brief Get current sample rate
     * @return Sample rate in Hz
     */
    uint32_t getSampleRate() const { return sampleRate_; }

    /**
     * @brief Process mono audio
     * @param input Input buffer (can be same as output for in-place)
     * @param output Output buffer
     * @param numSamples Number of samples to process
     */
    void processMono(const float* input, float* output, size_t numSamples);
    
    /**
     * @brief Process stereo audio
     * @param inL Left channel input
     * @param inR Right channel input
     * @param outL Left channel output (can be same as inL)
     * @param outR Right channel output (can be same as inR)
     * @param numSamples Number of samples per channel
     */
    void processStereo(const float* inL, const float* inR, float* outL, float* outR, size_t numSamples);

private:
    uint32_t sampleRate_;
    int channels_;
    NoiseReducerConfig config_{};

    // Per-channel filters and states
    struct ChannelState {
        std::unique_ptr<AudioEqualizer::BiquadFilter> highPass;
        double env = 0.0;      // envelope follower (linear)
        double gain = 1.0;     // smoothed gain (linear)
    };
    std::vector<ChannelState> ch_;

    // Cached coefficients for performance
    double threshLin_ = 0.003;       ///< Linear threshold (converted from dB)
    double floorLin_ = 0.1;          ///< Linear floor (converted from dB)
    double attackCoeffEnv_ = 0.9;    ///< Envelope follower attack coefficient
    double releaseCoeffEnv_ = 0.99;  ///< Envelope follower release coefficient
    double attackCoeffGain_ = 0.8;   ///< Gain smoothing attack coefficient
    double releaseCoeffGain_ = 0.98; ///< Gain smoothing release coefficient
    double expansionSlope_ = 0.5;    ///< Pre-calculated 1/ratio for expansion curve
    double threshLin2_ = 0.000009;   ///< Pre-calculated threshold squared

    void updateDerived();
    inline double dbToLin(double dB) const { return std::pow(10.0, dB / 20.0); }
    inline double linToDb(double lin) const { return 20.0 * std::log10(std::max(lin, 1e-10)); }
    inline double coefForMs(double ms) const {
        double T = std::max(ms, 0.1) / 1000.0;
        return std::exp(-1.0 / (T * static_cast<double>(sampleRate_)));
    }
    void ensureFilters();
    void processChannel(const float* in, float* out, size_t n, ChannelState& st);
};

} // namespace AudioNR
#endif // __cplusplus
