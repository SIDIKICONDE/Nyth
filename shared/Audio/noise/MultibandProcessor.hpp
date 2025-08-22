#pragma once

#ifdef __cplusplus
#include "../fft/FFTEngine.hpp"
#include <array>
#include <cmath>
#include <complex>
#include <memory>
#include <vector>


namespace AudioNR {

/**
 * @brief Multi-band frequency processor for targeted noise reduction
 *
 * Divides the spectrum into perceptually-motivated frequency bands
 * and applies different noise reduction parameters to each band.
 *
 * Based on psychoacoustic principles:
 * - Critical bands (Bark scale)
 * - Frequency masking
 * - Different noise characteristics per band
 */
class MultibandProcessor {
public:
    /**
     * @brief Band definition with frequency range and parameters
     */
    struct FrequencyBand {
        float freqLow;           ///< Lower frequency bound (Hz)
        float freqHigh;          ///< Upper frequency bound (Hz)
        float noiseFloor;        ///< Estimated noise floor for this band (dB)
        float reductionFactor;   ///< Noise reduction aggressiveness (0-1)
        float smoothingFactor;   ///< Temporal smoothing factor
        bool preserveTransients; ///< Preserve transient sounds in this band

        // Psychoacoustic parameters
        float maskingThreshold;  ///< Masking threshold in dB
        float criticalBandwidth; ///< Critical bandwidth in Hz
    };

    /**
     * @brief Configuration for multiband processing
     */
    struct Config {
        uint32_t sampleRate = 48000;
        size_t fftSize = 2048; ///< Larger FFT for better frequency resolution
        size_t hopSize = 512;  ///< 75% overlap

        // Band configuration modes
        enum BandMode {
            BARK_SCALE,   ///< Perceptual Bark scale (24 bands)
            MEL_SCALE,    ///< Mel scale bands
            OCTAVE_BANDS, ///< Standard octave bands
            CUSTOM        ///< User-defined bands
        } bandMode = BARK_SCALE;

        // Processing parameters per band type
        struct BandProfile {
            // Sub-bass (20-60 Hz) - Rumble removal
            float subBassReduction = 0.9f;
            float subBassFloor = -50.0f;

            // Bass (60-250 Hz) - Moderate reduction
            float bassReduction = 0.7f;
            float bassFloor = -45.0f;

            // Low-mid (250-500 Hz) - Speech fundamentals
            float lowMidReduction = 0.5f;
            float lowMidFloor = -40.0f;

            // Mid (500-2000 Hz) - Speech clarity
            float midReduction = 0.3f;
            float midFloor = -35.0f;

            // High-mid (2000-4000 Hz) - Presence
            float highMidReduction = 0.4f;
            float highMidFloor = -35.0f;

            // High (4000-8000 Hz) - Brilliance
            float highReduction = 0.6f;
            float highFloor = -40.0f;

            // Ultra-high (>8000 Hz) - Air/hiss
            float ultraHighReduction = 0.8f;
            float ultraHighFloor = -45.0f;
        } profile;

        // Adaptive parameters
        bool adaptiveBands = true;    ///< Adapt band parameters based on content
        float adaptationRate = 0.95f; ///< Rate of adaptation (0-1)

        // Transient preservation
        float transientThreshold = 6.0f; ///< dB above average for transient detection
        float transientDecay = 0.9f;     ///< Transient envelope decay rate
    };

    explicit MultibandProcessor(const Config& cfg = Config{});
    ~MultibandProcessor();

    /**
     * @brief Process audio frame with multiband noise reduction
     * @param input Input audio frame
     * @param output Output audio frame
     * @param numSamples Number of samples to process
     */
    void process(const float* input, float* output, size_t numSamples);

    /**
     * @brief Set custom frequency bands
     * @param bands Vector of frequency band definitions
     */
    void setCustomBands(const std::vector<FrequencyBand>& bands);

    /**
     * @brief Get current band energies (for visualization)
     * @return Vector of energy values per band in dB
     */
    std::vector<float> getBandEnergies() const;

    /**
     * @brief Get current noise estimates per band
     * @return Vector of noise floor estimates in dB
     */
    std::vector<float> getBandNoiseEstimates() const;

    /**
     * @brief Update configuration
     * @param cfg New configuration
     */
    void setConfig(const Config& cfg);

private:
    Config cfg_;
    std::vector<FrequencyBand> bands_;
    size_t numBins_;

    // FFT processing
    std::unique_ptr<AudioFX::IFFTEngine> fftEngine_;
    std::vector<float> window_;
    std::vector<float> inputBuffer_;
    std::vector<float> outputBuffer_;
    size_t writePos_;

    // Spectral data
    std::vector<float> realSpec_;
    std::vector<float> imagSpec_;
    std::vector<float> magnitude_;
    std::vector<float> phase_;

    // Per-band processing state
    struct BandState {
        size_t binStart;                      ///< Starting FFT bin index
        size_t binEnd;                        ///< Ending FFT bin index
        float energy;                         ///< Current energy estimate
        float noiseEstimate;                  ///< Current noise floor estimate
        float gain;                           ///< Current gain value
        float transientEnergy;                ///< Transient detector state
        std::vector<float> smoothedMagnitude; ///< Temporally smoothed magnitude
    };
    std::vector<BandState> bandStates_;

    // Helper functions
    void initializeBands();
    void initializeBarkBands();
    void initializeMelBands();
    void initializeOctaveBands();
    void buildWindow();

    void processSpectralFrame();
    void updateBandAnalysis();
    void applyBandGains();
    void detectTransients();

    // Psychoacoustic calculations
    float barkToHz(float bark);
    float hzToBark(float hz);
    float melToHz(float mel);
    float hzToMel(float hz);

    // Mathematical utilities
    inline float linearToDb(float linear) {
        return 20.0f * std::log10(std::max(linear, 1e-10f));
    }

    inline float dbToLinear(float db) {
        return std::pow(10.0f, db / 20.0f);
    }
};

/**
 * @brief Gammatone filterbank for alternative multiband processing
 *
 * Implements a bank of gammatone filters that model the human auditory system
 */
class GammatoneFilterbank {
public:
    struct Config {
        uint32_t sampleRate = 48000;
        size_t numFilters = 32;   ///< Number of gammatone filters
        float freqLow = 50.0f;    ///< Lowest center frequency
        float freqHigh = 8000.0f; ///< Highest center frequency
        float qFactor = 9.26449f; ///< Q factor (bandwidth parameter)
        size_t filterOrder = 4;   ///< Gammatone filter order
    };

    explicit GammatoneFilterbank(const Config& cfg = Config{});
    ~GammatoneFilterbank();

    /**
     * @brief Analyze signal into gammatone bands
     * @param input Input signal
     * @param bandOutputs Output energy per band
     * @param numSamples Number of samples
     */
    void analyze(const float* input, std::vector<float>& bandOutputs, size_t numSamples);

    /**
     * @brief Synthesize signal from modified band energies
     * @param bandGains Gain per band
     * @param output Output signal
     * @param numSamples Number of samples
     */
    void synthesize(const std::vector<float>& bandGains, float* output, size_t numSamples);

private:
    Config cfg_;

    struct GammatoneFilter {
        float centerFreq;
        float bandwidth;
        std::vector<std::complex<float>> poles;
        std::vector<std::complex<float>> state;
    };

    std::vector<GammatoneFilter> filters_;
    std::vector<std::vector<float>> filterOutputs_;

    void initializeFilters();
    float erbBandwidth(float centerFreq);
};

} // namespace AudioNR
#endif // __cplusplus
