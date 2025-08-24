#pragma once

#include "SafetyLimits.h"
#include <functional>
#include <string>


namespace Nyth {
namespace Audio {

// === Structures de configuration pour le module de sécurité ===

// Configuration de base pour le DC removal
struct DCConfig {
    bool enabled = true;
    double threshold = SafetyLimits::DEFAULT_DC_THRESHOLD; // Linéaire
    double smoothingFactor = DEFAULT_DC_SMOOTHING;         // Facteur de lissage

    // Validation
    bool isValid() const {
        return SafetyParameterValidator::isValidDCThreshold(threshold) && smoothingFactor >= MIN_SMOOTHING_FACTOR &&
               smoothingFactor <= MAX_SMOOTHING_FACTOR;
    }
};

// Configuration du limiter
struct LimiterConfig {
    bool enabled = true;
    double thresholdDb = SafetyLimits::DEFAULT_LIMITER_THRESHOLD_DB; // dBFS
    bool softKnee = true;
    double kneeWidthDb = SafetyLimits::DEFAULT_KNEE_WIDTH_DB; // dB
    double attackTimeMs = DEFAULT_ATTACK_TIME_MS;             // ms
    double releaseTimeMs = DEFAULT_RELEASE_TIME_MS;           // ms
    double makeupGainDb = DEFAULT_LIMITER_MAKEUP;             // dB

    // Validation
    bool isValid() const {
        return SafetyParameterValidator::isValidLimiterThreshold(thresholdDb) &&
               SafetyParameterValidator::isValidKneeWidth(kneeWidthDb) && attackTimeMs > MIN_ATTACK_TIME &&
               attackTimeMs <= MAX_ATTACK_TIME && releaseTimeMs > MIN_RELEASE_TIME && releaseTimeMs <= MAX_RELEASE_TIME &&
               makeupGainDb >= MIN_MAKEUP_GAIN && makeupGainDb <= MAX_MAKEUP_GAIN;
    }
};

// Configuration de la détection de feedback
struct FeedbackConfig {
    bool enabled = true;
    double threshold = SafetyLimits::DEFAULT_FEEDBACK_THRESHOLD; // Corrélation normalisée
    double sensitivity = DEFAULT_FEEDBACK_SENSITIVITY;           // Sensibilité (0-1)
    uint32_t analysisWindowMs = DEFAULT_FEEDBACK_WINDOW;         // Fenêtre d'analyse en ms
    uint32_t minFrequencyHz = DEFAULT_MIN_FREQ;                  // Fréquence minimale
    uint32_t maxFrequencyHz = DEFAULT_MAX_FREQ;                  // Fréquence maximale

    // Validation
    bool isValid() const {
        return SafetyParameterValidator::isValidFeedbackThreshold(threshold) && sensitivity >= MIN_SENSITIVITY &&
               sensitivity <= MAX_SENSITIVITY && analysisWindowMs >= MIN_ANALYSIS_WINDOW &&
               analysisWindowMs <= MAX_ANALYSIS_WINDOW && minFrequencyHz >= DEFAULT_MIN_FREQ &&
               minFrequencyHz < maxFrequencyHz && maxFrequencyHz <= MAX_FEEDBACK_FREQ;
    }
};

// Configuration des optimisations
struct OptimizationConfig {
    bool useOptimizedEngine = false;                                // Utiliser la version SIMD
    bool enableMemoryPool = true;                                   // Pool de mémoire
    bool branchFreeProcessing = true;                               // Traitement sans branchement
    size_t memoryPoolSize = SafetyLimits::DEFAULT_MEMORY_POOL_SIZE; // Taille du pool
    bool enableStatistics = true;                                   // Activer les statistiques détaillées

    // Validation
    bool isValid() const {
        return SafetyParameterValidator::isValidMemoryPoolSize(memoryPoolSize);
    }
};

// === Configuration principale du module de sécurité ===

struct SafetyConfig {
    // Paramètres généraux
    uint32_t sampleRate = SafetyLimits::DEFAULT_SAMPLE_RATE;
    int channels = SafetyLimits::DEFAULT_CHANNELS;

    // Composants
    DCConfig dcConfig;
    LimiterConfig limiterConfig;
    FeedbackConfig feedbackConfig;
    OptimizationConfig optimizationConfig;

    // Contrôles globaux
    bool enabled = true;
    bool autoGainControl = false;
    double maxProcessingTimeMs = DEFAULT_MAX_PROCESSING_TIME_MS; // Timeout de traitement

    // Validation complète
    bool isValid() const {
        return SafetyParameterValidator::isValidSampleRate(sampleRate) &&
               SafetyParameterValidator::isValidChannels(channels) && dcConfig.isValid() && limiterConfig.isValid() &&
               feedbackConfig.isValid() && optimizationConfig.isValid() && maxProcessingTimeMs > ZERO_VALUE &&
               maxProcessingTimeMs <= MAX_PROCESSING_TIME_MS;
    }

    // Méthode pour obtenir une configuration par défaut
    static SafetyConfig getDefault() {
        return SafetyConfig();
    }
};

// === Structures de rapport et statistiques ===

// Rapport de sécurité pour une frame audio
struct SafetyReport {
    double peakLevel = INITIAL_LEVEL_DB;        // Niveau de crête en dBFS
    double rmsLevel = INITIAL_LEVEL_DB;         // Niveau RMS en dBFS
    double dcOffset = INITIAL_DC_OFFSET;        // Offset DC (linéaire)
    uint32_t clippedSamples = INITIAL_CLIPPED_SAMPLES;   // Nombre d'échantillons clipés
    bool overloadActive = INITIAL_OVERLOAD;     // Surcharge active
    double feedbackScore = INITIAL_FEEDBACK_SCORE;       // Score de feedback (0-1)
    bool hasNaN = INITIAL_HAS_NAN;              // Présence de NaN
    bool feedbackLikely = INITIAL_FEEDBACK_LIKELY;      // Feedback probable
    double processingTimeMs = INITIAL_PROCESSING_TIME;   // Temps de traitement en ms

    // Validation du rapport
    bool isValid() const {
        return SafetyParameterValidator::isValidLevelDb(peakLevel) &&
               SafetyParameterValidator::isValidLevelDb(rmsLevel) && std::isfinite(dcOffset) &&
               feedbackScore >= ZERO_VALUE && feedbackScore <= UNITY_VALUE && processingTimeMs >= ZERO_VALUE;
    }
};

// Statistiques cumulées
struct SafetyStatistics {
    SafetyReport minReport;
    SafetyReport maxReport;
    SafetyReport avgReport;
    SafetyReport lastReport;

    uint64_t totalFrames = INITIAL_TOTAL_FRAMES;
    uint64_t totalClippedSamples = INITIAL_TOTAL_CLIPPED_SAMPLES;
    uint64_t totalOverloadFrames = INITIAL_TOTAL_OVERLOAD_FRAMES;
    uint64_t totalFeedbackFrames = INITIAL_TOTAL_FEEDBACK_FRAMES;

    double averageProcessingTimeMs = INITIAL_PROCESSING_TIME;
    double maxProcessingTimeMs = INITIAL_PROCESSING_TIME;

    // Méthode pour réinitialiser
    void reset() {
        *this = SafetyStatistics();
    }
};

// === Types d'erreurs ===

enum class SafetyError {
    OK = ERROR_CONFIG_CODE_OK,
    NULL_BUFFER = ERROR_CONFIG_CODE_NULL_BUFFER,
    INVALID_SAMPLE_RATE = ERROR_CONFIG_CODE_INVALID_SAMPLE_RATE,
    INVALID_CHANNELS = ERROR_CONFIG_CODE_INVALID_CHANNELS,
    INVALID_THRESHOLD_DB = ERROR_CONFIG_CODE_INVALID_THRESHOLD_DB,
    INVALID_KNEE_WIDTH = ERROR_CONFIG_CODE_INVALID_KNEE_WIDTH,
    INVALID_DC_THRESHOLD = ERROR_CONFIG_CODE_INVALID_DC_THRESHOLD,
    INVALID_FEEDBACK_THRESHOLD = ERROR_CONFIG_CODE_INVALID_FEEDBACK_THRESHOLD,
    PROCESSING_FAILED = ERROR_CONFIG_CODE_PROCESSING_FAILED,
    TIMEOUT = ERROR_CONFIG_CODE_TIMEOUT,
    MEMORY_ERROR = ERROR_CONFIG_CODE_MEMORY_ERROR,
    INVALID_CONFIG = ERROR_CONFIG_CODE_INVALID_CONFIG,
    ENGINE_NOT_INITIALIZED = ERROR_CONFIG_CODE_ENGINE_NOT_INITIALIZED,
    OPTIMIZATION_NOT_SUPPORTED = ERROR_CONFIG_CODE_OPTIMIZATION_NOT_SUPPORTED
};

// Conversion d'erreur vers string
inline std::string errorToString(SafetyError error) {
    switch (error) {
        case SafetyError::OK:
            return ERROR_CONFIG_OK;
        case SafetyError::NULL_BUFFER:
            return ERROR_CONFIG_NULL_BUFFER;
        case SafetyError::INVALID_SAMPLE_RATE:
            return ERROR_CONFIG_INVALID_SAMPLE_RATE;
        case SafetyError::INVALID_CHANNELS:
            return ERROR_CONFIG_INVALID_CHANNELS;
        case SafetyError::INVALID_THRESHOLD_DB:
            return ERROR_CONFIG_INVALID_THRESHOLD_DB;
        case SafetyError::INVALID_KNEE_WIDTH:
            return ERROR_CONFIG_INVALID_KNEE_WIDTH;
        case SafetyError::INVALID_DC_THRESHOLD:
            return ERROR_CONFIG_INVALID_DC_THRESHOLD;
        case SafetyError::INVALID_FEEDBACK_THRESHOLD:
            return ERROR_CONFIG_INVALID_FEEDBACK_THRESHOLD;
        case SafetyError::PROCESSING_FAILED:
            return ERROR_CONFIG_PROCESSING_FAILED;
        case SafetyError::TIMEOUT:
            return ERROR_CONFIG_TIMEOUT;
        case SafetyError::MEMORY_ERROR:
            return ERROR_CONFIG_MEMORY_ERROR;
        case SafetyError::INVALID_CONFIG:
            return ERROR_CONFIG_INVALID_CONFIG;
        case SafetyError::ENGINE_NOT_INITIALIZED:
            return ERROR_CONFIG_ENGINE_NOT_INITIALIZED;
        case SafetyError::OPTIMIZATION_NOT_SUPPORTED:
            return ERROR_CONFIG_OPTIMIZATION_NOT_SUPPORTED;
        default:
            return ERROR_CONFIG_UNKNOWN;
    }
}

// === États du module ===

enum class SafetyState {
    UNINITIALIZED = STATE_CONFIG_CODE_UNINITIALIZED,
    INITIALIZED = STATE_CONFIG_CODE_INITIALIZED,
    PROCESSING = STATE_CONFIG_CODE_PROCESSING,
    ERROR = STATE_CONFIG_CODE_ERROR,
    SHUTDOWN = STATE_CONFIG_CODE_SHUTDOWN
};

// Conversion d'état vers string
inline std::string stateToString(SafetyState state) {
    switch (state) {
        case SafetyState::UNINITIALIZED:
            return STATE_UNINITIALIZED;
        case SafetyState::INITIALIZED:
            return STATE_INITIALIZED;
        case SafetyState::PROCESSING:
            return STATE_PROCESSING;
        case SafetyState::ERROR:
            return STATE_ERROR;
        case SafetyState::SHUTDOWN:
            return STATE_SHUTDOWN;
        default:
            return STATE_UNKNOWN;
    }
}

// === Callbacks et événements ===

using SafetyDataCallback = std::function<void(const float* input, float* output, size_t frameCount, int channels)>;
using SafetyErrorCallback = std::function<void(SafetyError error, const std::string& message)>;
using SafetyStateCallback = std::function<void(SafetyState oldState, SafetyState newState)>;
using SafetyReportCallback = std::function<void(const SafetyReport& report)>;

} // namespace Audio
} // namespace Nyth
