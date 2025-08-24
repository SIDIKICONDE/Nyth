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
    double smoothingFactor = 0.95;                         // Facteur de lissage

    // Validation
    bool isValid() const {
        return SafetyParameterValidator::isValidDCThreshold(threshold) && smoothingFactor >= 0.0 &&
               smoothingFactor <= 1.0;
    }
};

// Configuration du limiter
struct LimiterConfig {
    bool enabled = true;
    double thresholdDb = SafetyLimits::DEFAULT_LIMITER_THRESHOLD_DB; // dBFS
    bool softKnee = true;
    double kneeWidthDb = SafetyLimits::DEFAULT_KNEE_WIDTH_DB; // dB
    double attackTimeMs = 10.0;                               // ms
    double releaseTimeMs = 100.0;                             // ms
    double makeupGainDb = 0.0;                                // dB

    // Validation
    bool isValid() const {
        return SafetyParameterValidator::isValidLimiterThreshold(thresholdDb) &&
               SafetyParameterValidator::isValidKneeWidth(kneeWidthDb) && attackTimeMs > 0.0 &&
               attackTimeMs <= 1000.0 && releaseTimeMs > 0.0 && releaseTimeMs <= 10000.0 && makeupGainDb >= -20.0 &&
               makeupGainDb <= 20.0;
    }
};

// Configuration de la détection de feedback
struct FeedbackConfig {
    bool enabled = true;
    double threshold = SafetyLimits::DEFAULT_FEEDBACK_THRESHOLD; // Corrélation normalisée
    double sensitivity = 0.8;                                    // Sensibilité (0-1)
    uint32_t analysisWindowMs = 100;                             // Fenêtre d'analyse en ms
    uint32_t minFrequencyHz = 20;                                // Fréquence minimale
    uint32_t maxFrequencyHz = 20000;                             // Fréquence maximale

    // Validation
    bool isValid() const {
        return SafetyParameterValidator::isValidFeedbackThreshold(threshold) && sensitivity >= 0.0 &&
               sensitivity <= 1.0 && analysisWindowMs >= 10 && analysisWindowMs <= 1000 && minFrequencyHz >= 20 &&
               minFrequencyHz < maxFrequencyHz && maxFrequencyHz <= 50000;
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
    double maxProcessingTimeMs = 10.0; // Timeout de traitement

    // Validation complète
    bool isValid() const {
        return SafetyParameterValidator::isValidSampleRate(sampleRate) &&
               SafetyParameterValidator::isValidChannels(channels) && dcConfig.isValid() && limiterConfig.isValid() &&
               feedbackConfig.isValid() && optimizationConfig.isValid() && maxProcessingTimeMs > 0.0 &&
               maxProcessingTimeMs <= 1000.0;
    }

    // Méthode pour obtenir une configuration par défaut
    static SafetyConfig getDefault() {
        return SafetyConfig();
    }
};

// === Structures de rapport et statistiques ===

// Rapport de sécurité pour une frame audio
struct SafetyReport {
    double peakLevel = 0.0;        // Niveau de crête en dBFS
    double rmsLevel = 0.0;         // Niveau RMS en dBFS
    double dcOffset = 0.0;         // Offset DC (linéaire)
    uint32_t clippedSamples = 0;   // Nombre d'échantillons clipés
    bool overloadActive = false;   // Surcharge active
    double feedbackScore = 0.0;    // Score de feedback (0-1)
    bool hasNaN = false;           // Présence de NaN
    bool feedbackLikely = false;   // Feedback probable
    double processingTimeMs = 0.0; // Temps de traitement en ms

    // Validation du rapport
    bool isValid() const {
        return SafetyParameterValidator::isValidLevelDb(peakLevel) &&
               SafetyParameterValidator::isValidLevelDb(rmsLevel) && std::isfinite(dcOffset) && feedbackScore >= 0.0 &&
               feedbackScore <= 1.0 && processingTimeMs >= 0.0;
    }
};

// Statistiques cumulées
struct SafetyStatistics {
    SafetyReport minReport;
    SafetyReport maxReport;
    SafetyReport avgReport;
    SafetyReport lastReport;

    uint64_t totalFrames = 0;
    uint64_t totalClippedSamples = 0;
    uint64_t totalOverloadFrames = 0;
    uint64_t totalFeedbackFrames = 0;

    double averageProcessingTimeMs = 0.0;
    double maxProcessingTimeMs = 0.0;

    // Méthode pour réinitialiser
    void reset() {
        *this = SafetyStatistics();
    }
};

// === Types d'erreurs ===

enum class SafetyError {
    OK = 0,
    NULL_BUFFER = -1,
    INVALID_SAMPLE_RATE = -2,
    INVALID_CHANNELS = -3,
    INVALID_THRESHOLD_DB = -4,
    INVALID_KNEE_WIDTH = -5,
    INVALID_DC_THRESHOLD = -6,
    INVALID_FEEDBACK_THRESHOLD = -7,
    PROCESSING_FAILED = -8,
    TIMEOUT = -9,
    MEMORY_ERROR = -10,
    INVALID_CONFIG = -11,
    ENGINE_NOT_INITIALIZED = -12,
    OPTIMIZATION_NOT_SUPPORTED = -13
};

// Conversion d'erreur vers string
inline std::string errorToString(SafetyError error) {
    switch (error) {
        case SafetyError::OK:
            return "OK";
        case SafetyError::NULL_BUFFER:
            return "Null buffer provided";
        case SafetyError::INVALID_SAMPLE_RATE:
            return "Invalid sample rate";
        case SafetyError::INVALID_CHANNELS:
            return "Invalid number of channels";
        case SafetyError::INVALID_THRESHOLD_DB:
            return "Invalid threshold in dB";
        case SafetyError::INVALID_KNEE_WIDTH:
            return "Invalid knee width";
        case SafetyError::INVALID_DC_THRESHOLD:
            return "Invalid DC threshold";
        case SafetyError::INVALID_FEEDBACK_THRESHOLD:
            return "Invalid feedback threshold";
        case SafetyError::PROCESSING_FAILED:
            return "Audio processing failed";
        case SafetyError::TIMEOUT:
            return "Processing timeout";
        case SafetyError::MEMORY_ERROR:
            return "Memory allocation error";
        case SafetyError::INVALID_CONFIG:
            return "Invalid configuration";
        case SafetyError::ENGINE_NOT_INITIALIZED:
            return "Engine not initialized";
        case SafetyError::OPTIMIZATION_NOT_SUPPORTED:
            return "Optimization not supported";
        default:
            return "Unknown error";
    }
}

// === États du module ===

enum class SafetyState { UNINITIALIZED = 0, INITIALIZED = 1, PROCESSING = 2, ERROR = 3, SHUTDOWN = 4 };

// Conversion d'état vers string
inline std::string stateToString(SafetyState state) {
    switch (state) {
        case SafetyState::UNINITIALIZED:
            return "uninitialized";
        case SafetyState::INITIALIZED:
            return "initialized";
        case SafetyState::PROCESSING:
            return "processing";
        case SafetyState::ERROR:
            return "error";
        case SafetyState::SHUTDOWN:
            return "shutdown";
        default:
            return "unknown";
    }
}

// === Callbacks et événements ===

using SafetyDataCallback = std::function<void(const float* input, float* output, size_t frameCount, int channels)>;
using SafetyErrorCallback = std::function<void(SafetyError error, const std::string& message)>;
using SafetyStateCallback = std::function<void(SafetyState oldState, SafetyState newState)>;
using SafetyReportCallback = std::function<void(const SafetyReport& report)>;

} // namespace Audio
} // namespace Nyth

