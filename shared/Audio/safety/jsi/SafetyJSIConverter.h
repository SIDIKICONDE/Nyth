#pragma once

#include <jsi/jsi.h>
#include <string>
#include <vector>


#include "../../common/jsi/JSICallbackManager.h"
#include "../config/SafetyConfig.h"


namespace facebook {
namespace react {

// === Convertisseur JSI pour le module de sécurité audio ===

class SafetyJSIConverter {
public:
    // === Conversion JSI vers native ===

    // Configuration
    static Nyth::Audio::SafetyConfig jsiToSafetyConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    static Nyth::Audio::DCConfig jsiToDCConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    static Nyth::Audio::LimiterConfig jsiToLimiterConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    static Nyth::Audio::FeedbackConfig jsiToFeedbackConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    static Nyth::Audio::OptimizationConfig jsiToOptimizationConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);

    // Données audio
    static std::vector<float> jsiArrayToFloatVector(jsi::Runtime& rt, const jsi::Array& jsArray);
    static void floatVectorToJSIArray(jsi::Runtime& rt, const std::vector<float>& data, jsi::Array& jsArray);

    // === Conversion native vers JSI ===

    // Configuration
    static jsi::Object safetyConfigToJSI(jsi::Runtime& rt, const Nyth::Audio::SafetyConfig& config);
    static jsi::Object dcConfigToJSI(jsi::Runtime& rt, const Nyth::Audio::DCConfig& config);
    static jsi::Object limiterConfigToJSI(jsi::Runtime& rt, const Nyth::Audio::LimiterConfig& config);
    static jsi::Object feedbackConfigToJSI(jsi::Runtime& rt, const Nyth::Audio::FeedbackConfig& config);
    static jsi::Object optimizationConfigToJSI(jsi::Runtime& rt, const Nyth::Audio::OptimizationConfig& config);

    // Rapports et statistiques
    static jsi::Object safetyReportToJSI(jsi::Runtime& rt, const Nyth::Audio::SafetyReport& report);
    static jsi::Object safetyStatisticsToJSI(jsi::Runtime& rt, const Nyth::Audio::SafetyStatistics& stats);

    // Données audio
    static jsi::Array floatVectorToJSIArray(jsi::Runtime& rt, const std::vector<float>& data);

    // === Utilitaires ===

    // Validation
    static bool validateJSIConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    static std::string getJSIConfigValidationError(jsi::Runtime& rt, const jsi::Object& jsConfig);

    // Extraction de propriétés avec valeurs par défaut
    static double getJSIDouble(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop,
                               double defaultValue = 0.0);
    static int getJSIInt(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop, int defaultValue = 0);
    static uint32_t getJSIUint32(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop,
                                 uint32_t defaultValue = 0);
    static bool getJSIBool(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop,
                           bool defaultValue = false);
    static std::string getJSIString(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop,
                                    const std::string& defaultValue = "");

    // Vérification d'existence de propriétés
    static bool hasProperty(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop);
    static bool isPropertyObject(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop);
    static bool isPropertyArray(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop);
    static bool isPropertyNumber(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop);
    static bool isPropertyBool(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop);
    static bool isPropertyString(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop);

    // === Constantes ===

    // Noms des propriétés JavaScript
    static constexpr auto PROP_SAMPLE_RATE = "sampleRate";
    static constexpr auto PROP_CHANNELS = "channels";
    static constexpr auto PROP_ENABLED = "enabled";

    // Configuration DC
    static constexpr auto PROP_DC_CONFIG = "dcConfig";
    static constexpr auto PROP_DC_ENABLED = "enabled";
    static constexpr auto PROP_DC_THRESHOLD = "threshold";
    static constexpr auto PROP_DC_SMOOTHING = "smoothingFactor";

    // Configuration limiter
    static constexpr auto PROP_LIMITER_CONFIG = "limiterConfig";
    static constexpr auto PROP_LIMITER_ENABLED = "enabled";
    static constexpr auto PROP_LIMITER_THRESHOLD = "thresholdDb";
    static constexpr auto PROP_LIMITER_SOFT_KNEE = "softKnee";
    static constexpr auto PROP_LIMITER_KNEE_WIDTH = "kneeWidthDb";
    static constexpr auto PROP_LIMITER_ATTACK = "attackTimeMs";
    static constexpr auto PROP_LIMITER_RELEASE = "releaseTimeMs";
    static constexpr auto PROP_LIMITER_MAKEUP = "makeupGainDb";

    // Configuration feedback
    static constexpr auto PROP_FEEDBACK_CONFIG = "feedbackConfig";
    static constexpr auto PROP_FEEDBACK_ENABLED = "enabled";
    static constexpr auto PROP_FEEDBACK_THRESHOLD = "threshold";
    static constexpr auto PROP_FEEDBACK_SENSITIVITY = "sensitivity";
    static constexpr auto PROP_FEEDBACK_WINDOW = "analysisWindowMs";
    static constexpr auto PROP_FEEDBACK_MIN_FREQ = "minFrequencyHz";
    static constexpr auto PROP_FEEDBACK_MAX_FREQ = "maxFrequencyHz";

    // Configuration optimisation
    static constexpr auto PROP_OPTIMIZATION_CONFIG = "optimizationConfig";
    static constexpr auto PROP_OPT_USE_OPTIMIZED = "useOptimizedEngine";
    static constexpr auto PROP_OPT_MEMORY_POOL = "enableMemoryPool";
    static constexpr auto PROP_OPT_BRANCH_FREE = "branchFreeProcessing";
    static constexpr auto PROP_OPT_POOL_SIZE = "memoryPoolSize";
    static constexpr auto PROP_OPT_STATISTICS = "enableStatistics";

    // Contrôles globaux
    static constexpr auto PROP_AUTO_GAIN = "autoGainControl";
    static constexpr auto PROP_MAX_PROCESSING_TIME = "maxProcessingTimeMs";

    // Rapports
    static constexpr auto PROP_PEAK_LEVEL = "peakLevel";
    static constexpr auto PROP_RMS_LEVEL = "rmsLevel";
    static constexpr auto PROP_DC_OFFSET = "dcOffset";
    static constexpr auto PROP_CLIPPED_SAMPLES = "clippedSamples";
    static constexpr auto PROP_OVERLOAD_ACTIVE = "overloadActive";
    static constexpr auto PROP_FEEDBACK_SCORE = "feedbackScore";
    static constexpr auto PROP_HAS_NAN = "hasNaN";
    static constexpr auto PROP_FEEDBACK_LIKELY = "feedbackLikely";
    static constexpr auto PROP_PROCESSING_TIME = "processingTimeMs";

    // Statistiques
    static constexpr auto PROP_MIN_REPORT = "minReport";
    static constexpr auto PROP_MAX_REPORT = "maxReport";
    static constexpr auto PROP_AVG_REPORT = "avgReport";
    static constexpr auto PROP_LAST_REPORT = "lastReport";
    static constexpr auto PROP_TOTAL_FRAMES = "totalFrames";
    static constexpr auto PROP_TOTAL_CLIPPED = "totalClippedSamples";
    static constexpr auto PROP_TOTAL_OVERLOAD = "totalOverloadFrames";
    static constexpr auto PROP_TOTAL_FEEDBACK = "totalFeedbackFrames";
    static constexpr auto PROP_AVG_PROCESSING_TIME = "averageProcessingTimeMs";
    static constexpr auto PROP_MAX_PROCESSING_TIME = "maxProcessingTimeMs";

private:
    // Fonctions auxiliaires privées
    static void setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop, double value);
    static void setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop, int value);
    static void setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop, uint32_t value);
    static void setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop, bool value);
    static void setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop, const std::string& value);
    static void setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop, const jsi::Object& value);
    static void setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop, const jsi::Array& value);
};

} // namespace react
} // namespace facebook
