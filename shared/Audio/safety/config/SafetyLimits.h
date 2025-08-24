#pragma once

#include <cstdint>
#include <limits>

namespace Nyth {
namespace Audio {

// === Limites et constantes pour le module de sécurité audio ===

struct SafetyLimits {
    // === Paramètres temporels ===
    static constexpr uint32_t MIN_SAMPLE_RATE = 8000;
    static constexpr uint32_t MAX_SAMPLE_RATE = 192000;
    static constexpr uint32_t DEFAULT_SAMPLE_RATE = 48000;

    static constexpr size_t MIN_FRAME_SIZE = 64;
    static constexpr size_t MAX_FRAME_SIZE = 8192;
    static constexpr size_t DEFAULT_FRAME_SIZE = 512;

    // === Plages de canaux ===
    static constexpr int MIN_CHANNELS = 1;
    static constexpr int MAX_CHANNELS = 8;
    static constexpr int DEFAULT_CHANNELS = 2;

    // === Plages DC removal ===
    static constexpr double MIN_DC_THRESHOLD = 1e-6;      // ~ -120 dBFS
    static constexpr double MAX_DC_THRESHOLD = 0.1;       // ~ -20 dBFS
    static constexpr double DEFAULT_DC_THRESHOLD = 0.002; // ~ -54 dBFS

    // Constantes calculées pour les niveaux DC (pour référence)
    static constexpr double MIN_DC_THRESHOLD_DB = -120.0; // dBFS équivalent de MIN_DC_THRESHOLD
    static constexpr double MAX_DC_THRESHOLD_DB = -20.0;  // dBFS équivalent de MAX_DC_THRESHOLD
    static constexpr double DEFAULT_DC_THRESHOLD_DB = -54.0; // dBFS équivalent de DEFAULT_DC_THRESHOLD

    // === Plages limiter ===
    static constexpr double MIN_LIMITER_THRESHOLD_DB = -60.0;    // dBFS
    static constexpr double MAX_LIMITER_THRESHOLD_DB = 0.0;      // dBFS
    static constexpr double DEFAULT_LIMITER_THRESHOLD_DB = -1.0; // dBFS

    static constexpr double MIN_KNEE_WIDTH_DB = 0.0;     // dB
    static constexpr double MAX_KNEE_WIDTH_DB = 24.0;    // dB
    static constexpr double DEFAULT_KNEE_WIDTH_DB = 6.0; // dB

    // === Plages feedback detection ===
    static constexpr double MIN_FEEDBACK_THRESHOLD = 0.0;      // Correlation normalisée
    static constexpr double MAX_FEEDBACK_THRESHOLD = 1.0;      // Correlation normalisée
    static constexpr double DEFAULT_FEEDBACK_THRESHOLD = 0.95; // Correlation normalisée

    // === Plages de niveaux ===
    static constexpr double MIN_LEVEL_DB = -120.0;   // dBFS minimum détectable
    static constexpr double MAX_LEVEL_DB = 20.0;     // dBFS maximum (avec headroom)
    static constexpr double CLIPPING_LEVEL_DB = 0.0; // dBFS niveau de clipping

    static constexpr double MIN_LEVEL_LINEAR = 1e-6; // Niveau linéaire minimum
    static constexpr double MAX_LEVEL_LINEAR = 10.0; // Niveau linéaire maximum

    // === Paramètres de traitement ===
    static constexpr uint32_t MAX_REPORT_HISTORY = 1000;   // Nombre maximum de rapports gardés en mémoire
    static constexpr uint32_t STATS_UPDATE_INTERVAL = 100; // Fréquence de mise à jour des statistiques

    // === Paramètres d'optimisation ===
    static constexpr size_t MIN_MEMORY_POOL_SIZE = 8;
    static constexpr size_t MAX_MEMORY_POOL_SIZE = 1024;
    static constexpr size_t DEFAULT_MEMORY_POOL_SIZE = 32;

    // === Constantes mathématiques ===
    static constexpr double LOG10_VALUE = 2.302585092994046; // Valeur de log(10)
    static constexpr double DB_SCALE_FACTOR = 20.0;          // Facteur d'échelle pour dB
    static constexpr double DB_TO_LINEAR_FACTOR = DB_SCALE_FACTOR / LOG10_VALUE; // 20/log(10)
    static constexpr double LINEAR_TO_DB_FACTOR = LOG10_VALUE / DB_SCALE_FACTOR; // log(10)/20

    // === Constantes de sécurité ===
    static constexpr double MAX_OVERLOAD_TIME_MS = 1000.0;        // Temps maximum en surcharge
    static constexpr uint32_t MAX_CLIPPED_SAMPLES_WARNING = 1000; // Seuil d'avertissement

    // === Paramètres de callback ===
    static constexpr uint32_t MAX_CALLBACK_QUEUE_SIZE = 100; // Taille max de la queue de callbacks
    static constexpr uint32_t CALLBACK_TIMEOUT_MS = 5000;    // Timeout pour les callbacks JS

    // Constantes pour les seuils de callback
    static constexpr uint32_t DEFAULT_CALLBACK_QUEUE_SIZE = 100;
    static constexpr uint32_t MIN_CALLBACK_TIMEOUT_MS = 1000;    // Timeout minimum
    static constexpr uint32_t MAX_CALLBACK_TIMEOUT_MS = 30000;   // Timeout maximum
    static constexpr uint32_t DEFAULT_CALLBACK_TIMEOUT_MS = 5000; // Timeout par défaut
};

// === Validation des paramètres ===

class SafetyParameterValidator {
public:
    static bool isValidSampleRate(uint32_t sampleRate) {
        return sampleRate >= SafetyLimits::MIN_SAMPLE_RATE && sampleRate <= SafetyLimits::MAX_SAMPLE_RATE;
    }

    static bool isValidChannels(int channels) {
        return channels >= SafetyLimits::MIN_CHANNELS && channels <= SafetyLimits::MAX_CHANNELS;
    }

    static bool isValidFrameSize(size_t frameSize) {
        return frameSize >= SafetyLimits::MIN_FRAME_SIZE && frameSize <= SafetyLimits::MAX_FRAME_SIZE;
    }

    static bool isValidDCThreshold(double threshold) {
        return threshold >= SafetyLimits::MIN_DC_THRESHOLD && threshold <= SafetyLimits::MAX_DC_THRESHOLD;
    }

    static bool isValidLimiterThreshold(double thresholdDb) {
        return thresholdDb >= SafetyLimits::MIN_LIMITER_THRESHOLD_DB &&
               thresholdDb <= SafetyLimits::MAX_LIMITER_THRESHOLD_DB;
    }

    static bool isValidKneeWidth(double kneeWidthDb) {
        return kneeWidthDb >= SafetyLimits::MIN_KNEE_WIDTH_DB && kneeWidthDb <= SafetyLimits::MAX_KNEE_WIDTH_DB;
    }

    static bool isValidFeedbackThreshold(double threshold) {
        return threshold >= SafetyLimits::MIN_FEEDBACK_THRESHOLD && threshold <= SafetyLimits::MAX_FEEDBACK_THRESHOLD;
    }

    static bool isValidLevelDb(double levelDb) {
        return levelDb >= SafetyLimits::MIN_LEVEL_DB && levelDb <= SafetyLimits::MAX_LEVEL_DB;
    }

    static bool isValidMemoryPoolSize(size_t poolSize) {
        return poolSize >= SafetyLimits::MIN_MEMORY_POOL_SIZE && poolSize <= SafetyLimits::MAX_MEMORY_POOL_SIZE;
    }

    static bool isValidCallbackTimeout(uint32_t timeoutMs) {
        return timeoutMs >= SafetyLimits::MIN_CALLBACK_TIMEOUT_MS && timeoutMs <= SafetyLimits::MAX_CALLBACK_TIMEOUT_MS;
    }

    static bool isValidCallbackQueueSize(uint32_t queueSize) {
        return queueSize >= 1 && queueSize <= SafetyLimits::MAX_CALLBACK_QUEUE_SIZE;
    }
};

} // namespace Audio
} // namespace Nyth
