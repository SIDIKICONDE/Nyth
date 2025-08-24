#include "SafetyJSIConverter.h"

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <string>
#include <vector>

namespace facebook {
namespace react {

// === Conversion JSI vers native ===

// Configuration principale
Nyth::Audio::SafetyConfig SafetyJSIConverter::jsiToSafetyConfig(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    Nyth::Audio::SafetyConfig config = Nyth::Audio::SafetyConfig::getDefault();

    // Paramètres de base
    if (hasProperty(rt, jsConfig, PROP_SAMPLE_RATE)) {
        config.sampleRate = static_cast<uint32_t>(getJSIUint32(rt, jsConfig, PROP_SAMPLE_RATE, config.sampleRate));
    }

    if (hasProperty(rt, jsConfig, PROP_CHANNELS)) {
        config.channels = getJSIInt(rt, jsConfig, PROP_CHANNELS, config.channels);
    }

    if (hasProperty(rt, jsConfig, PROP_ENABLED)) {
        config.enabled = getJSIBool(rt, jsConfig, PROP_ENABLED, config.enabled);
    }

    // Configuration DC
    if (hasProperty(rt, jsConfig, PROP_DC_CONFIG) && isPropertyObject(rt, jsConfig, PROP_DC_CONFIG)) {
        auto dcObj = jsConfig.getProperty(rt, PROP_DC_CONFIG).asObject(rt);
        config.dcConfig = jsiToDCConfig(rt, dcObj);
    }

    // Configuration limiter
    if (hasProperty(rt, jsConfig, PROP_LIMITER_CONFIG) && isPropertyObject(rt, jsConfig, PROP_LIMITER_CONFIG)) {
        auto limiterObj = jsConfig.getProperty(rt, jsConfig, PROP_LIMITER_CONFIG).asObject(rt);
        config.limiterConfig = jsiToLimiterConfig(rt, limiterObj);
    }

    // Configuration feedback
    if (hasProperty(rt, jsConfig, PROP_FEEDBACK_CONFIG) && isPropertyObject(rt, jsConfig, PROP_FEEDBACK_CONFIG)) {
        auto feedbackObj = jsConfig.getProperty(rt, jsConfig, PROP_FEEDBACK_CONFIG).asObject(rt);
        config.feedbackConfig = jsiToFeedbackConfig(rt, feedbackObj);
    }

    // Configuration optimisation
    if (hasProperty(rt, jsConfig, PROP_OPTIMIZATION_CONFIG) &&
        isPropertyObject(rt, jsConfig, PROP_OPTIMIZATION_CONFIG)) {
        auto optObj = jsConfig.getProperty(rt, jsConfig, PROP_OPTIMIZATION_CONFIG).asObject(rt);
        config.optimizationConfig = jsiToOptimizationConfig(rt, optObj);
    }

    // Contrôles globaux
    if (hasProperty(rt, jsConfig, PROP_AUTO_GAIN)) {
        config.autoGainControl = getJSIBool(rt, jsConfig, PROP_AUTO_GAIN, config.autoGainControl);
    }

    if (hasProperty(rt, jsConfig, PROP_MAX_PROCESSING_TIME)) {
        config.maxProcessingTimeMs = getJSIDouble(rt, jsConfig, PROP_MAX_PROCESSING_TIME, config.maxProcessingTimeMs);
    }

    return config;
}

// Configuration DC
Nyth::Audio::DCConfig SafetyJSIConverter::jsiToDCConfig(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    Nyth::Audio::DCConfig config;

    if (hasProperty(rt, jsConfig, PROP_DC_ENABLED)) {
        config.enabled = getJSIBool(rt, jsConfig, PROP_DC_ENABLED, config.enabled);
    }

    if (hasProperty(rt, jsConfig, PROP_DC_THRESHOLD)) {
        config.threshold = getJSIDouble(rt, jsConfig, PROP_DC_THRESHOLD, config.threshold);
    }

    if (hasProperty(rt, jsConfig, PROP_DC_SMOOTHING)) {
        config.smoothingFactor = getJSIDouble(rt, jsConfig, PROP_DC_SMOOTHING, config.smoothingFactor);
    }

    return config;
}

// Configuration limiter
Nyth::Audio::LimiterConfig SafetyJSIConverter::jsiToLimiterConfig(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    Nyth::Audio::LimiterConfig config;

    if (hasProperty(rt, jsConfig, PROP_LIMITER_ENABLED)) {
        config.enabled = getJSIBool(rt, jsConfig, PROP_LIMITER_ENABLED, config.enabled);
    }

    if (hasProperty(rt, jsConfig, PROP_LIMITER_THRESHOLD)) {
        config.thresholdDb = getJSIDouble(rt, jsConfig, PROP_LIMITER_THRESHOLD, config.thresholdDb);
    }

    if (hasProperty(rt, jsConfig, PROP_LIMITER_SOFT_KNEE)) {
        config.softKnee = getJSIBool(rt, jsConfig, PROP_LIMITER_SOFT_KNEE, config.softKnee);
    }

    if (hasProperty(rt, jsConfig, PROP_LIMITER_KNEE_WIDTH)) {
        config.kneeWidthDb = getJSIDouble(rt, jsConfig, PROP_LIMITER_KNEE_WIDTH, config.kneeWidthDb);
    }

    if (hasProperty(rt, jsConfig, PROP_LIMITER_ATTACK)) {
        config.attackTimeMs = getJSIDouble(rt, jsConfig, PROP_LIMITER_ATTACK, config.attackTimeMs);
    }

    if (hasProperty(rt, jsConfig, PROP_LIMITER_RELEASE)) {
        config.releaseTimeMs = getJSIDouble(rt, jsConfig, PROP_LIMITER_RELEASE, config.releaseTimeMs);
    }

    if (hasProperty(rt, jsConfig, PROP_LIMITER_MAKEUP)) {
        config.makeupGainDb = getJSIDouble(rt, jsConfig, PROP_LIMITER_MAKEUP, config.makeupGainDb);
    }

    return config;
}

// Configuration feedback
Nyth::Audio::FeedbackConfig SafetyJSIConverter::jsiToFeedbackConfig(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    Nyth::Audio::FeedbackConfig config;

    if (hasProperty(rt, jsConfig, PROP_FEEDBACK_ENABLED)) {
        config.enabled = getJSIBool(rt, jsConfig, PROP_FEEDBACK_ENABLED, config.enabled);
    }

    if (hasProperty(rt, jsConfig, PROP_FEEDBACK_THRESHOLD)) {
        config.threshold = getJSIDouble(rt, jsConfig, PROP_FEEDBACK_THRESHOLD, config.threshold);
    }

    if (hasProperty(rt, jsConfig, PROP_FEEDBACK_SENSITIVITY)) {
        config.sensitivity = getJSIDouble(rt, jsConfig, PROP_FEEDBACK_SENSITIVITY, config.sensitivity);
    }

    if (hasProperty(rt, jsConfig, PROP_FEEDBACK_WINDOW)) {
        config.analysisWindowMs =
            static_cast<uint32_t>(getJSIUint32(rt, jsConfig, PROP_FEEDBACK_WINDOW, config.analysisWindowMs));
    }

    if (hasProperty(rt, jsConfig, PROP_FEEDBACK_MIN_FREQ)) {
        config.minFrequencyHz =
            static_cast<uint32_t>(getJSIUint32(rt, jsConfig, PROP_FEEDBACK_MIN_FREQ, config.minFrequencyHz));
    }

    if (hasProperty(rt, jsConfig, PROP_FEEDBACK_MAX_FREQ)) {
        config.maxFrequencyHz =
            static_cast<uint32_t>(getJSIUint32(rt, jsConfig, PROP_FEEDBACK_MAX_FREQ, config.maxFrequencyHz));
    }

    return config;
}

// Configuration optimisation
Nyth::Audio::OptimizationConfig SafetyJSIConverter::jsiToOptimizationConfig(jsi::Runtime& rt,
                                                                            const jsi::Object& jsConfig) {
    Nyth::Audio::OptimizationConfig config;

    if (hasProperty(rt, jsConfig, PROP_OPT_USE_OPTIMIZED)) {
        config.useOptimizedEngine = getJSIBool(rt, jsConfig, PROP_OPT_USE_OPTIMIZED, config.useOptimizedEngine);
    }

    if (hasProperty(rt, jsConfig, PROP_OPT_MEMORY_POOL)) {
        config.enableMemoryPool = getJSIBool(rt, jsConfig, PROP_OPT_MEMORY_POOL, config.enableMemoryPool);
    }

    if (hasProperty(rt, jsConfig, PROP_OPT_BRANCH_FREE)) {
        config.branchFreeProcessing = getJSIBool(rt, jsConfig, PROP_OPT_BRANCH_FREE, config.branchFreeProcessing);
    }

    if (hasProperty(rt, jsConfig, PROP_OPT_POOL_SIZE)) {
        config.memoryPoolSize = static_cast<size_t>(
            getJSIUint32(rt, jsConfig, PROP_OPT_POOL_SIZE, static_cast<uint32_t>(config.memoryPoolSize)));
    }

    if (hasProperty(rt, jsConfig, PROP_OPT_STATISTICS)) {
        config.enableStatistics = getJSIBool(rt, jsConfig, PROP_OPT_STATISTICS, config.enableStatistics);
    }

    return config;
}

// Données audio
std::vector<float> SafetyJSIConverter::jsiArrayToFloatVector(jsi::Runtime& rt, const jsi::Array& jsArray) {
    size_t length = jsArray.length(rt);
    std::vector<float> result(length);

    for (size_t i = 0; i < length; ++i) {
        auto value = jsArray.getValueAtIndex(rt, i);
        if (value.isNumber()) {
            result[i] = static_cast<float>(value.asNumber());
        } else {
            result[i] = 0.0f;
        }
    }

    return result;
}

void SafetyJSIConverter::floatVectorToJSIArray(jsi::Runtime& rt, const std::vector<float>& data, jsi::Array& jsArray) {
    for (size_t i = 0; i < data.size() && i < jsArray.length(rt); ++i) {
        jsArray.setValueAtIndex(rt, i, jsi::Value(data[i]));
    }
}

// === Conversion native vers JSI ===

// Configuration principale
jsi::Object SafetyJSIConverter::safetyConfigToJSI(jsi::Runtime& rt, const Nyth::Audio::SafetyConfig& config) {
    jsi::Object jsConfig(rt);

    // Paramètres de base
    setJSIProperty(rt, jsConfig, PROP_SAMPLE_RATE, config.sampleRate);
    setJSIProperty(rt, jsConfig, PROP_CHANNELS, config.channels);
    setJSIProperty(rt, jsConfig, PROP_ENABLED, config.enabled);
    setJSIProperty(rt, jsConfig, PROP_AUTO_GAIN, config.autoGainControl);
    setJSIProperty(rt, jsConfig, PROP_MAX_PROCESSING_TIME, config.maxProcessingTimeMs);

    // Configurations imbriquées
    setJSIProperty(rt, jsConfig, PROP_DC_CONFIG, dcConfigToJSI(rt, config.dcConfig));
    setJSIProperty(rt, jsConfig, PROP_LIMITER_CONFIG, limiterConfigToJSI(rt, config.limiterConfig));
    setJSIProperty(rt, jsConfig, PROP_FEEDBACK_CONFIG, feedbackConfigToJSI(rt, config.feedbackConfig));
    setJSIProperty(rt, jsConfig, PROP_OPTIMIZATION_CONFIG, optimizationConfigToJSI(rt, config.optimizationConfig));

    return jsConfig;
}

// Configuration DC
jsi::Object SafetyJSIConverter::dcConfigToJSI(jsi::Runtime& rt, const Nyth::Audio::DCConfig& config) {
    jsi::Object jsConfig(rt);

    setJSIProperty(rt, jsConfig, PROP_DC_ENABLED, config.enabled);
    setJSIProperty(rt, jsConfig, PROP_DC_THRESHOLD, config.threshold);
    setJSIProperty(rt, jsConfig, PROP_DC_SMOOTHING, config.smoothingFactor);

    return jsConfig;
}

// Configuration limiter
jsi::Object SafetyJSIConverter::limiterConfigToJSI(jsi::Runtime& rt, const Nyth::Audio::LimiterConfig& config) {
    jsi::Object jsConfig(rt);

    setJSIProperty(rt, jsConfig, PROP_LIMITER_ENABLED, config.enabled);
    setJSIProperty(rt, jsConfig, PROP_LIMITER_THRESHOLD, config.thresholdDb);
    setJSIProperty(rt, jsConfig, PROP_LIMITER_SOFT_KNEE, config.softKnee);
    setJSIProperty(rt, jsConfig, PROP_LIMITER_KNEE_WIDTH, config.kneeWidthDb);
    setJSIProperty(rt, jsConfig, PROP_LIMITER_ATTACK, config.attackTimeMs);
    setJSIProperty(rt, jsConfig, PROP_LIMITER_RELEASE, config.releaseTimeMs);
    setJSIProperty(rt, jsConfig, PROP_LIMITER_MAKEUP, config.makeupGainDb);

    return jsConfig;
}

// Configuration feedback
jsi::Object SafetyJSIConverter::feedbackConfigToJSI(jsi::Runtime& rt, const Nyth::Audio::FeedbackConfig& config) {
    jsi::Object jsConfig(rt);

    setJSIProperty(rt, jsConfig, PROP_FEEDBACK_ENABLED, config.enabled);
    setJSIProperty(rt, jsConfig, PROP_FEEDBACK_THRESHOLD, config.threshold);
    setJSIProperty(rt, jsConfig, PROP_FEEDBACK_SENSITIVITY, config.sensitivity);
    setJSIProperty(rt, jsConfig, PROP_FEEDBACK_WINDOW, config.analysisWindowMs);
    setJSIProperty(rt, jsConfig, PROP_FEEDBACK_MIN_FREQ, config.minFrequencyHz);
    setJSIProperty(rt, jsConfig, PROP_FEEDBACK_MAX_FREQ, config.maxFrequencyHz);

    return jsConfig;
}

// Configuration optimisation
jsi::Object SafetyJSIConverter::optimizationConfigToJSI(jsi::Runtime& rt,
                                                        const Nyth::Audio::OptimizationConfig& config) {
    jsi::Object jsConfig(rt);

    setJSIProperty(rt, jsConfig, PROP_OPT_USE_OPTIMIZED, config.useOptimizedEngine);
    setJSIProperty(rt, jsConfig, PROP_OPT_MEMORY_POOL, config.enableMemoryPool);
    setJSIProperty(rt, jsConfig, PROP_OPT_BRANCH_FREE, config.branchFreeProcessing);
    setJSIProperty(rt, jsConfig, PROP_OPT_POOL_SIZE, static_cast<uint32_t>(config.memoryPoolSize));
    setJSIProperty(rt, jsConfig, PROP_OPT_STATISTICS, config.enableStatistics);

    return jsConfig;
}

// Rapports et statistiques
jsi::Object SafetyJSIConverter::safetyReportToJSI(jsi::Runtime& rt, const Nyth::Audio::SafetyReport& report) {
    jsi::Object jsReport(rt);

    setJSIProperty(rt, jsReport, PROP_PEAK_LEVEL, report.peakLevel);
    setJSIProperty(rt, jsReport, PROP_RMS_LEVEL, report.rmsLevel);
    setJSIProperty(rt, jsReport, PROP_DC_OFFSET, report.dcOffset);
    setJSIProperty(rt, jsReport, PROP_CLIPPED_SAMPLES, report.clippedSamples);
    setJSIProperty(rt, jsReport, PROP_OVERLOAD_ACTIVE, report.overloadActive);
    setJSIProperty(rt, jsReport, PROP_FEEDBACK_SCORE, report.feedbackScore);
    setJSIProperty(rt, jsReport, PROP_HAS_NAN, report.hasNaN);
    setJSIProperty(rt, jsReport, PROP_FEEDBACK_LIKELY, report.feedbackLikely);
    setJSIProperty(rt, jsReport, PROP_PROCESSING_TIME, report.processingTimeMs);

    return jsReport;
}

jsi::Object SafetyJSIConverter::safetyStatisticsToJSI(jsi::Runtime& rt, const Nyth::Audio::SafetyStatistics& stats) {
    jsi::Object jsStats(rt);

    setJSIProperty(rt, jsStats, PROP_MIN_REPORT, safetyReportToJSI(rt, stats.minReport));
    setJSIProperty(rt, jsStats, PROP_MAX_REPORT, safetyReportToJSI(rt, stats.maxReport));
    setJSIProperty(rt, jsStats, PROP_AVG_REPORT, safetyReportToJSI(rt, stats.avgReport));
    setJSIProperty(rt, jsStats, PROP_LAST_REPORT, safetyReportToJSI(rt, stats.lastReport));

    setJSIProperty(rt, jsStats, PROP_TOTAL_FRAMES, static_cast<double>(stats.totalFrames));
    setJSIProperty(rt, jsStats, PROP_TOTAL_CLIPPED, static_cast<double>(stats.totalClippedSamples));
    setJSIProperty(rt, jsStats, PROP_TOTAL_OVERLOAD, static_cast<double>(stats.totalOverloadFrames));
    setJSIProperty(rt, jsStats, PROP_TOTAL_FEEDBACK, static_cast<double>(stats.totalFeedbackFrames));
    setJSIProperty(rt, jsStats, PROP_AVG_PROCESSING_TIME, stats.averageProcessingTimeMs);
    setJSIProperty(rt, jsStats, PROP_MAX_PROCESSING_TIME, stats.maxProcessingTimeMs);

    return jsStats;
}

// Données audio
jsi::Array SafetyJSIConverter::floatVectorToJSIArray(jsi::Runtime& rt, const std::vector<float>& data) {
    jsi::Array jsArray(rt, data.size());

    for (size_t i = 0; i < data.size(); ++i) {
        jsArray.setValueAtIndex(rt, i, jsi::Value(data[i]));
    }

    return jsArray;
}

// === Utilitaires ===

// Validation
bool SafetyJSIConverter::validateJSIConfig(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    try {
        // Validation basique - on pourrait ajouter plus de validations spécifiques
        if (hasProperty(rt, jsConfig, PROP_SAMPLE_RATE)) {
            uint32_t sampleRate = static_cast<uint32_t>(getJSIUint32(rt, jsConfig, PROP_SAMPLE_RATE));
            if (!Nyth::Audio::SafetyParameterValidator::isValidSampleRate(sampleRate)) {
                return false;
            }
        }

        if (hasProperty(rt, jsConfig, PROP_CHANNELS)) {
            int channels = getJSIInt(rt, jsConfig, PROP_CHANNELS);
            if (!Nyth::Audio::SafetyParameterValidator::isValidChannels(channels)) {
                return false;
            }
        }

        // Validation des configurations imbriquées si présentes
        if (hasProperty(rt, jsConfig, PROP_DC_CONFIG) && isPropertyObject(rt, jsConfig, PROP_DC_CONFIG)) {
            auto dcObj = jsConfig.getProperty(rt, PROP_DC_CONFIG).asObject(rt);
            if (hasProperty(rt, dcObj, PROP_DC_THRESHOLD)) {
                double threshold = getJSIDouble(rt, dcObj, PROP_DC_THRESHOLD);
                if (!Nyth::Audio::SafetyParameterValidator::isValidDCThreshold(threshold)) {
                    return false;
                }
            }
        }

        if (hasProperty(rt, jsConfig, PROP_LIMITER_CONFIG) && isPropertyObject(rt, jsConfig, PROP_LIMITER_CONFIG)) {
            auto limiterObj = jsConfig.getProperty(rt, PROP_LIMITER_CONFIG).asObject(rt);
            if (hasProperty(rt, limiterObj, PROP_LIMITER_THRESHOLD)) {
                double threshold = getJSIDouble(rt, limiterObj, PROP_LIMITER_THRESHOLD);
                if (!Nyth::Audio::SafetyParameterValidator::isValidLimiterThreshold(threshold)) {
                    return false;
                }
            }
        }

        return true;
    } catch (...) {
        return false;
    }
}

std::string SafetyJSIConverter::getJSIConfigValidationError(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    // Pour l'instant, retourner une erreur générique
    // On pourrait implémenter une validation plus détaillée
    return "Invalid configuration parameters";
}

// Extraction de propriétés avec valeurs par défaut
double SafetyJSIConverter::getJSIDouble(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop,
                                        double defaultValue) {
    if (hasProperty(rt, obj, prop) && isPropertyNumber(rt, obj, prop)) {
        return obj.getProperty(rt, prop.c_str()).asNumber();
    }
    return defaultValue;
}

int SafetyJSIConverter::getJSIInt(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop, int defaultValue) {
    return static_cast<int>(getJSIDouble(rt, obj, prop, static_cast<double>(defaultValue)));
}

uint32_t SafetyJSIConverter::getJSIUint32(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop,
                                          uint32_t defaultValue) {
    return static_cast<uint32_t>(getJSIDouble(rt, obj, prop, static_cast<double>(defaultValue)));
}

bool SafetyJSIConverter::getJSIBool(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop,
                                    bool defaultValue) {
    if (hasProperty(rt, obj, prop) && isPropertyBool(rt, obj, prop)) {
        return obj.getProperty(rt, prop.c_str()).asBool();
    }
    return defaultValue;
}

std::string SafetyJSIConverter::getJSIString(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop,
                                             const std::string& defaultValue) {
    if (hasProperty(rt, obj, prop) && isPropertyString(rt, obj, prop)) {
        auto jsString = obj.getProperty(rt, prop.c_str()).asString(rt);
        return jsString.utf8(rt);
    }
    return defaultValue;
}

// Vérification d'existence de propriétés
bool SafetyJSIConverter::hasProperty(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop) {
    return obj.hasProperty(rt, prop.c_str());
}

bool SafetyJSIConverter::isPropertyObject(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop) {
    if (!hasProperty(rt, obj, prop))
        return false;
    auto value = obj.getProperty(rt, prop.c_str());
    return value.isObject();
}

bool SafetyJSIConverter::isPropertyArray(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop) {
    if (!hasProperty(rt, obj, prop))
        return false;
    auto value = obj.getProperty(rt, prop.c_str());
    return value.isObject() && value.asObject(rt).isArray(rt);
}

bool SafetyJSIConverter::isPropertyNumber(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop) {
    if (!hasProperty(rt, obj, prop))
        return false;
    auto value = obj.getProperty(rt, prop.c_str());
    return value.isNumber();
}

bool SafetyJSIConverter::isPropertyBool(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop) {
    if (!hasProperty(rt, obj, prop))
        return false;
    auto value = obj.getProperty(rt, prop.c_str());
    return value.isBool();
}

bool SafetyJSIConverter::isPropertyString(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop) {
    if (!hasProperty(rt, obj, prop))
        return false;
    auto value = obj.getProperty(rt, prop.c_str());
    return value.isString();
}

// === Fonctions auxiliaires privées ===

void SafetyJSIConverter::setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop, double value) {
    obj.setProperty(rt, prop.c_str(), jsi::Value(value));
}

void SafetyJSIConverter::setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop, int value) {
    obj.setProperty(rt, prop.c_str(), jsi::Value(value));
}

void SafetyJSIConverter::setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop, uint32_t value) {
    obj.setProperty(rt, prop.c_str(), jsi::Value(static_cast<double>(value)));
}

void SafetyJSIConverter::setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop, bool value) {
    obj.setProperty(rt, prop.c_str(), jsi::Value(value));
}

void SafetyJSIConverter::setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop,
                                        const std::string& value) {
    obj.setProperty(rt, prop.c_str(), jsi::String::createFromUtf8(rt, value));
}

void SafetyJSIConverter::setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop,
                                        const jsi::Object& value) {
    obj.setProperty(rt, prop.c_str(), value);
}

void SafetyJSIConverter::setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop,
                                        const jsi::Array& value) {
    obj.setProperty(rt, prop.c_str(), value);
}

} // namespace react
} // namespace facebook
