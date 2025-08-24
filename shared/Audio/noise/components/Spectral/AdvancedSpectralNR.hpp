#pragma once

#ifdef __cplusplus
#include "../Imcra/Imcra.hpp"
#include "../Wiener/WienerFilter.hpp"
#include "MultibandProcessor.hpp"
#include "../../../fft/components/FFTEngine.hpp"
#include <memory>
#include <string>
#include <vector>


namespace AudioNR {

/**
 * @brief Advanced Spectral Noise Reduction with state-of-the-art algorithms
 *
 * Integrates multiple advanced noise reduction techniques:
 * - IMCRA for robust noise estimation
 * - Wiener filtering with MMSE-LSA
 * - Multi-band processing for frequency-dependent treatment
 * - Musical noise reduction
 * - Transient preservation
 */
class AdvancedSpectralNR {
public:
    /**
     * @brief Configuration for advanced spectral noise reduction
     */
    struct Config {
        // Core parameters
        uint32_t sampleRate = 48000;
        size_t fftSize = 2048; ///< Larger FFT for better resolution
        size_t hopSize = 512;  ///< 75% overlap

        // Algorithm selection
        enum Algorithm {
            SPECTRAL_SUBTRACTION, ///< Classic spectral subtraction
            WIENER_FILTER,        ///< Wiener filter with IMCRA
            MMSE_LSA,             ///< MMSE Log-Spectral Amplitude
            TWO_STEP,             ///< Two-step noise reduction
            MULTIBAND             ///< Multi-band processing
        } algorithm = MMSE_LSA;

        // Noise estimation method
        enum NoiseEstimation {
            SIMPLE_MCRA, ///< Basic MCRA
            IMCRA,       ///< Full IMCRA
            ADAPTIVE     ///< Adaptive selection
        } noiseMethod = IMCRA;

        // Processing options
        bool enableMultiband = true;    ///< Enable multi-band processing
        bool preserveTransients = true; ///< Preserve transient sounds
        bool reduceMusicalNoise = true; ///< Apply musical noise reduction

        // Aggressiveness control (0-1)
        float aggressiveness = 0.7f;

        // Advanced parameters
        struct Advanced {
            // IMCRA parameters
            float speechThreshold = 4.6f;
            float noiseUpdateRate = 0.95f;

            // Wiener parameters
            float wienerAlpha = 0.98f;
            float minGain = 0.1f;
            float maxGain = 1.0f;

            // Multi-band parameters
            MultibandProcessor::Config::BandMode bandMode = MultibandProcessor::Config::BARK_SCALE;

            // Musical noise reduction
            float temporalSmoothing = 0.7f;
            float spectralSmoothing = 0.3f;

            // Transient preservation
            float transientThreshold = 6.0f;
            float transientProtection = 0.8f;
        } advanced;
    };

    explicit AdvancedSpectralNR(const Config& cfg);
    explicit AdvancedSpectralNR();
    ~AdvancedSpectralNR();

    /**
     * @brief Process audio with advanced spectral noise reduction
     * @param input Input buffer
     * @param output Output buffer (can be same as input)
     * @param numSamples Number of samples to process
     */
    void process(const float* input, float* output, size_t numSamples);

    /**
     * @brief Set configuration
     * @param cfg New configuration
     */
    void setConfig(const Config& cfg);

    /**
     * @brief Get current configuration
     * @return Current configuration
     */
    const Config& getConfig() const {
        return cfg_;
    }

    /**
     * @brief Set aggressiveness (0-1)
     * @param aggressiveness Noise reduction aggressiveness
     */
    void setAggressiveness(float aggressiveness);

    /**
     * @brief Get current noise spectrum estimate
     * @return Vector of noise magnitude values per frequency bin
     */
    std::vector<float> getNoiseSpectrum() const;

    /**
     * @brief Get speech presence probability
     * @return Vector of probability values (0-1) per frequency bin
     */
    std::vector<float> getSpeechProbability() const;

    /**
     * @brief Get current SNR estimate
     * @return Estimated SNR in dB
     */
    float getEstimatedSNR() const;

    /**
     * @brief Get processing latency in samples
     * @return Latency in samples
     */
    size_t getLatency() const {
        return cfg_.fftSize - cfg_.hopSize;
    }

private:
    Config cfg_;
    size_t numBins_;
    size_t writePos_;

    // Core components
    std::unique_ptr<IMCRA> imcra_;
    std::unique_ptr<WienerFilter> wienerFilter_;
    std::unique_ptr<TwoStepNoiseReduction> twoStepFilter_;
    std::unique_ptr<MultibandProcessor> multibandProcessor_;
    std::unique_ptr<AudioFX::IFFTEngine> fftEngine_;

    // Buffers
    std::vector<float> window_;
    std::vector<float> inputBuffer_;
    std::vector<float> outputBuffer_;
    std::vector<float> frameBuffer_;

    // Spectral data
    std::vector<float> realSpec_;
    std::vector<float> imagSpec_;
    std::vector<float> magnitude_;
    std::vector<float> phase_;
    std::vector<float> processedMag_;

    // Noise and speech estimates
    std::vector<float> noiseSpectrum_;
    std::vector<float> speechProbability_;
    std::vector<float> prevGains_;

    // Transient detection
    std::vector<float> transientEnergy_;
    std::vector<float> transientGain_;

    // Statistics
    float currentSNR_;
    size_t frameCount_;

    // Helper functions
    void initializeComponents();
    void buildWindow();
    void processFrame();

    // Processing methods
    void applySpectralSubtraction();
    void applyWienerFilter();
    void applyMMSE_LSA();
    void applyTwoStepReduction();
    void applyMultibandProcessing();

    // Post-processing
    void detectTransients();
    void reduceMusicalNoise();
    void applyTemporalSmoothing();
    void applySpectralSmoothing();

    // Utilities
    void updateSNREstimate();
    float computeSpectralFlatness(const std::vector<float>& mag);
    float computeSpectralCentroid(const std::vector<float>& mag);
};

/**
 * @brief Hybrid noise reducer combining multiple techniques
 *
 * Intelligently switches between different algorithms based on
 * signal characteristics for optimal results
 */
class HybridNoiseReducer {
public:
    struct Config {
        uint32_t sampleRate = 48000;
        size_t blockSize = 512;

        // Decision thresholds
        float speechThreshold = 0.7f;    ///< Threshold for speech detection
        float musicThreshold = 0.5f;     ///< Threshold for music detection
        float transientThreshold = 6.0f; ///< Threshold for transient detection

        // Algorithm weights for different content types
        struct Weights {
            // Speech weights
            float speechWiener = 0.8f;
            float speechSpectral = 0.2f;

            // Music weights
            float musicWiener = 0.5f;
            float musicMultiband = 0.5f;

            // Noise weights
            float noiseSpectral = 0.6f;
            float noiseWiener = 0.4f;
        } weights;
    };

    explicit HybridNoiseReducer(const Config& cfg);
    explicit HybridNoiseReducer();
    ~HybridNoiseReducer();

    /**
     * @brief Process audio with hybrid noise reduction
     * @param input Input buffer
     * @param output Output buffer
     * @param numSamples Number of samples
     */
    void process(const float* input, float* output, size_t numSamples);

    /**
     * @brief Get detected content type
     * @return Content type string ("speech", "music", "noise", "mixed")
     */
    std::string getDetectedContentType() const;

private:
    Config cfg_;

    // Multiple processing engines
    std::unique_ptr<AdvancedSpectralNR> spectralNR_;
    std::unique_ptr<WienerFilter> wienerFilter_;
    std::unique_ptr<MultibandProcessor> multibandProcessor_;

    // Content analysis
    enum ContentType { SPEECH, MUSIC, NOISE, MIXED };
    ContentType currentContent_;

    // Analysis buffers
    std::vector<float> analysisBuffer_;
    std::vector<float> featureBuffer_;

    // Helper functions
    ContentType analyzeContent(const float* input, size_t numSamples);
    void selectAlgorithm(ContentType content);
    float computeZCR(const float* signal, size_t length);
    float computeSpectralFlux(const std::vector<float>& mag);
};

} // namespace AudioNR
#endif // __cplusplus
