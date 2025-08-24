#pragma once

#ifdef __cplusplus
#include <cmath>
#include <memory>
#include <vector>
#include "../core/BiquadFilter.hpp"
#include "NoiseContants.hpp"

namespace AudioNR {

// Import des constantes pour éviter la répétition des namespace
using namespace NoiseReducerConstants;

/**
 * @brief Configuration for the NoiseReducer downward expander/gate
 * 
 * This configuration controls how the noise reducer behaves. It implements
 * a downward expander that reduces the volume of signals below a threshold,
 * effectively reducing background noise while preserving louder signals.
 */
struct NoiseReducerConfig {
    // Gate/expander parameters
    double thresholdDb = DEFAULT_THRESHOLD_DB;   ///< Threshold in dBFS below which expansion starts (range: MIN_THRESHOLD_DB to MAX_THRESHOLD_DB)
    double ratio = DEFAULT_RATIO;           ///< Downward expander ratio (>1). Higher = more aggressive noise reduction
    double floorDb = DEFAULT_FLOOR_DB;       ///< Maximum attenuation in dB. Limits how much signal is reduced
    double attackMs = DEFAULT_ATTACK_MS;        ///< Attack time in ms. How fast the gate opens (MIN_ATTACK_MS to MAX_ATTACK_MS typical)
    double releaseMs = DEFAULT_RELEASE_MS;      ///< Release time in ms. How fast the gate closes (MIN_RELEASE_MS to MAX_RELEASE_MS typical)

    // Pre-filter parameters
    double highPassHz = DEFAULT_HIGHPASS_HZ;     ///< High-pass filter frequency for rumble removal (MIN_HIGHPASS_HZ to MAX_HIGHPASS_HZ typical)
    bool enableHighPass = DEFAULT_ENABLE_HIGHPASS;   ///< Enable/disable the high-pass pre-filter

    // Enable/disable
    bool enabled = DEFAULT_ENABLED;         ///< Master enable/disable for the entire noise reduction
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
     * @param numChannels Number of channels (MONO_CHANNELS for mono, STEREO_CHANNELS for stereo)
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
        std::unique_ptr<AudioFX::BiquadFilter> highPass;
        double env = INITIAL_ENVELOPE;      // envelope follower (linear)
        double gain = INITIAL_GAIN;     // smoothed gain (linear)
    };
    std::vector<ChannelState> ch_;

    // Cached coefficients for performance
    double threshLin_ = DEFAULT_THRESH_LINEAR;       ///< Linear threshold (converted from dB)
    double floorLin_ = DEFAULT_FLOOR_LINEAR;          ///< Linear floor (converted from dB)
    double attackCoeffEnv_ = DEFAULT_ATTACK_COEFF_ENV;    ///< Envelope follower attack coefficient
    double releaseCoeffEnv_ = DEFAULT_RELEASE_COEFF_ENV;  ///< Envelope follower release coefficient
    double attackCoeffGain_ = DEFAULT_ATTACK_COEFF_GAIN;   ///< Gain smoothing attack coefficient
    double releaseCoeffGain_ = DEFAULT_RELEASE_COEFF_GAIN; ///< Gain smoothing release coefficient
    double expansionSlope_ = DEFAULT_EXPANSION_SLOPE;    ///< Pre-calculated 1/ratio for expansion curve
    double threshLin2_ = DEFAULT_THRESH_LINEAR_SQUARED;   ///< Pre-calculated threshold squared

    void updateDerived();
    inline double dbToLin(double dB) const { return std::pow(DB_TO_LINEAR_BASE, dB / DB_TO_LINEAR_DIVISOR); }
    inline double linToDb(double lin) const { return DB_TO_LINEAR_DIVISOR * std::log10(std::max(lin, LOG_PROTECTION_MIN)); }
    inline double coefForMs(double ms) const {
        double T = std::max(ms, MIN_MS_FOR_COEFF) / MS_TO_SECONDS_DIVISOR;
        return std::exp(EXP_COEFFICIENT / (T * static_cast<double>(sampleRate_)));
    }
    void ensureFilters();
    void processChannel(const float* in, float* out, size_t n, ChannelState& st);
};

} // namespace AudioNR
#endif // __cplusplus
