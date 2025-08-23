#pragma once

#ifdef __cplusplus

// C++17 standard headers - Robust compatibility
#if defined(__has_include)
#if __has_include(<cstdint>)
#include <cstdint>
#else
#include <stdint.h>
#endif
#if __has_include(<cstddef>)
#include <cstddef>
#else
#include <stddef.h>
#endif
#else
#include <stddef.h>
#include <stdint.h>
#endif
#include "SafetyContants.hpp"

namespace AudioSafety {

// Import des constantes pour éviter la répétition des namespace
using namespace SafetyConstants;

/**
 * @brief Error codes for AudioSafety operations
 * Real-time safe alternative to exceptions
 */
enum class SafetyError : int32_t {
    OK = 0,
    NULL_BUFFER = -1,
    INVALID_SAMPLE_RATE = -2,
    INVALID_CHANNELS = -3,
    INVALID_THRESHOLD_DB = -4,
    INVALID_KNEE_WIDTH = -5,
    INVALID_DC_THRESHOLD = -6,
    INVALID_FEEDBACK_THRESHOLD = -7,
    PROCESSING_FAILED = -8
};

/**
 * @brief Configuration de l'engine de sécurité audio
 *
 * Permet de protéger la chaîne audio contre des anomalies courantes :
 * - Elimination du DC offset
 * - Limiteur (soft knee optionnel)
 * - Détection de feedback (auto-corrélation)
 */
struct SafetyConfig {
    bool enabled = DEFAULT_ENABLED;
    // DC removal
    bool dcRemovalEnabled = DEFAULT_DC_REMOVAL_ENABLED;
    double dcThreshold = DEFAULT_DC_THRESHOLD; // linear (~-54 dBFS)
    // Limiter
    bool limiterEnabled = DEFAULT_LIMITER_ENABLED;
    double limiterThresholdDb = DEFAULT_LIMITER_THRESHOLD_DB; // dBFS
    bool softKneeLimiter = DEFAULT_SOFT_KNEE_LIMITER;
    double kneeWidthDb = DEFAULT_KNEE_WIDTH_DB;
    // Feedback detection
    bool feedbackDetectEnabled = DEFAULT_FEEDBACK_DETECT_ENABLED;
    double feedbackCorrThreshold = DEFAULT_FEEDBACK_CORR_THRESHOLD; // normalized autocorrelation
};

/**
 * @brief Rapport d'analyse et de protection pour un buffer
 */
struct SafetyReport {
    double peak = INITIAL_PEAK;
    double rms = INITIAL_RMS;
    double dcOffset = INITIAL_DC_OFFSET;
    uint32_t clippedSamples = INITIAL_CLIPPED_SAMPLES;
    bool overloadActive = INITIAL_OVERLOAD_ACTIVE;
    double feedbackScore = INITIAL_FEEDBACK_SCORE; // 0..1
    bool hasNaN = INITIAL_HAS_NAN;
    bool feedbackLikely = INITIAL_FEEDBACK_LIKELY; // score >= threshold

    // Reset method for object pool
    void reset() {
        peak = INITIAL_PEAK;
        rms = INITIAL_RMS;
        dcOffset = INITIAL_DC_OFFSET;
        clippedSamples = INITIAL_CLIPPED_SAMPLES;
        overloadActive = INITIAL_OVERLOAD_ACTIVE;
        feedbackScore = INITIAL_FEEDBACK_SCORE;
        hasNaN = INITIAL_HAS_NAN;
        feedbackLikely = INITIAL_FEEDBACK_LIKELY;
    }
};

class AudioSafetyEngine {
public:
    /**
     * @brief Constructeur
     * @param sampleRate Fréquence d'échantillonnage (Hz)
     * @param channels Nombre de canaux (1 ou 2)
     * @param error Output error code (optional)
     */
    AudioSafetyEngine(uint32_t sampleRate, int channels, SafetyError* error = nullptr);
    ~AudioSafetyEngine();

    /**
     * @brief Mise à jour de la fréquence d'échantillonnage
     * @return Error code
     */
    SafetyError setSampleRate(uint32_t sr) noexcept;

    /**
     * @brief Mise à jour de la configuration
     * @return Error code
     */
    SafetyError setConfig(const SafetyConfig& cfg) noexcept;

    const SafetyConfig& getConfig() const {
        return config_;
    }
    SafetyReport getLastReport() const {
        return report_;
    }
    uint32_t getSampleRate() const {
        return sampleRate_;
    }

    /**
     * @brief Process mono audio buffer
     * @return Error code
     */
    SafetyError processMono(float* buffer, size_t numSamples) noexcept;

    /**
     * @brief Process stereo audio buffers
     * @return Error code
     */
    SafetyError processStereo(float* left, float* right, size_t numSamples) noexcept;

    /**
     * @brief Check if last initialization was successful
     */
    bool isValid() const noexcept {
        return valid_;
    }

protected:
    uint32_t sampleRate_;
    int channels_;
    SafetyConfig config_{};
    SafetyReport report_{};
    double limiterThresholdLin_ = DEFAULT_LIMITER_THRESHOLD_LINEAR;
    bool valid_ = false; // Track initialization status

    // DbLookupTable will be integrated here
    class DbConverter; // Forward declaration for LUT integration

    // Helpers - Using LUT for dB conversion when available
    double dbToLin(double dB) const noexcept;
    double linToDb(double linear) const noexcept;

    // Analyse + nettoyage d'un canal. Retourne un rapport pour ce canal
    SafetyReport analyzeAndClean(float* x, size_t n) noexcept;
    void dcRemove(float* x, size_t n, double mean) noexcept;
    void limitBuffer(float* x, size_t n) noexcept;
    double estimateFeedbackScore(const float* x, size_t n) noexcept;
};

/**
 * @brief Convert error code to string for debugging (non-RT)
 */
inline const char* safetyErrorToString(SafetyError error) noexcept {
    switch (error) {
        case SafetyError::OK:
            return "OK";
        case SafetyError::NULL_BUFFER:
            return "Null buffer";
        case SafetyError::INVALID_SAMPLE_RATE:
            return "Invalid sample rate";
        case SafetyError::INVALID_CHANNELS:
            return "Invalid channels";
        case SafetyError::INVALID_THRESHOLD_DB:
            return "Invalid threshold dB";
        case SafetyError::INVALID_KNEE_WIDTH:
            return "Invalid knee width";
        case SafetyError::INVALID_DC_THRESHOLD:
            return "Invalid DC threshold";
        case SafetyError::INVALID_FEEDBACK_THRESHOLD:
            return "Invalid feedback threshold";
        case SafetyError::PROCESSING_FAILED:
            return "Processing failed";
        default:
            return "Unknown error";
    }
}

} // namespace AudioSafety

#endif // __cplusplus
