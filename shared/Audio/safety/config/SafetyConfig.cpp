#include "SafetyConfig.h"

#include <algorithm>
#include <cstdint>
#include <string>

namespace Nyth {
namespace Audio {

// === Implémentation des validateurs et utilitaires ===

SafetyConfig SafetyConfig::getDefault() {
    SafetyConfig config;

    // Configuration par défaut
    config.sampleRate = SafetyLimits::DEFAULT_SAMPLE_RATE;
    config.channels = SafetyLimits::DEFAULT_CHANNELS;
    config.enabled = true;
    config.autoGainControl = false;
    config.maxProcessingTimeMs = DEFAULT_MAX_PROCESSING_TIME_MS;

    // Configuration DC par défaut
    config.dcConfig.enabled = true;
    config.dcConfig.threshold = SafetyLimits::DEFAULT_DC_THRESHOLD;
    config.dcConfig.smoothingFactor = DEFAULT_SMOOTHING_FACTOR;

    // Configuration limiter par défaut
    config.limiterConfig.enabled = true;
    config.limiterConfig.thresholdDb = SafetyLimits::DEFAULT_LIMITER_THRESHOLD_DB;
    config.limiterConfig.softKnee = true;
    config.limiterConfig.kneeWidthDb = SafetyLimits::DEFAULT_KNEE_WIDTH_DB;
    config.limiterConfig.attackTimeMs = DEFAULT_ATTACK_TIME_MS;
    config.limiterConfig.releaseTimeMs = DEFAULT_RELEASE_TIME_MS;
    config.limiterConfig.makeupGainDb = DEFAULT_MAKEUP_GAIN_DB;

    // Configuration feedback par défaut
    config.feedbackConfig.enabled = true;
    config.feedbackConfig.threshold = SafetyLimits::DEFAULT_FEEDBACK_THRESHOLD;
    config.feedbackConfig.sensitivity = DEFAULT_FEEDBACK_SENSITIVITY;
    config.feedbackConfig.analysisWindowMs = DEFAULT_ANALYSIS_WINDOW_MS;
    config.feedbackConfig.minFrequencyHz = DEFAULT_MIN_FREQUENCY_HZ;
    config.feedbackConfig.maxFrequencyHz = DEFAULT_MAX_FREQUENCY_HZ;

    // Configuration optimisation par défaut
    config.optimizationConfig.useOptimizedEngine = false;
    config.optimizationConfig.enableMemoryPool = true;
    config.optimizationConfig.branchFreeProcessing = true;
    config.optimizationConfig.memoryPoolSize = SafetyLimits::DEFAULT_MEMORY_POOL_SIZE;
    config.optimizationConfig.enableStatistics = true;

    return config;
}

// === Fonctions utilitaires pour la conversion dB/linéaire ===

double dbToLinear(double db) {
    if (db <= SafetyLimits::MIN_LEVEL_DB) {
        return SafetyLimits::MIN_LEVEL_LINEAR;
    }
    return std::pow(DB_CONVERSION_BASE, db / DB_CONVERSION_FACTOR);
}

double linearToDb(double linear) {
    if (linear <= SafetyLimits::MIN_LEVEL_LINEAR) {
        return SafetyLimits::MIN_LEVEL_DB;
    }
    return DB_CONVERSION_FACTOR * std::log10(linear);
}

// === Validation avancée des configurations ===

bool validateSampleRate(uint32_t sampleRate) {
    return SafetyParameterValidator::isValidSampleRate(sampleRate);
}

bool validateChannels(int channels) {
    return SafetyParameterValidator::isValidChannels(channels);
}

bool validateFrameSize(size_t frameSize) {
    return SafetyParameterValidator::isValidFrameSize(frameSize);
}

bool validateDCConfig(const DCConfig& config) {
    return config.isValid();
}

bool validateLimiterConfig(const LimiterConfig& config) {
    return config.isValid();
}

bool validateFeedbackConfig(const FeedbackConfig& config) {
    return config.isValid();
}

bool validateOptimizationConfig(const OptimizationConfig& config) {
    return config.isValid();
}

// === Fonctions de clamp (limitation) des paramètres ===

double clampDCThreshold(double threshold) {
    return std::max(SafetyLimits::MIN_DC_THRESHOLD, std::min(SafetyLimits::MAX_DC_THRESHOLD, threshold));
}

double clampLimiterThreshold(double thresholdDb) {
    return std::max(SafetyLimits::MIN_LIMITER_THRESHOLD_DB,
                    std::min(SafetyLimits::MAX_LIMITER_THRESHOLD_DB, thresholdDb));
}

double clampKneeWidth(double kneeWidthDb) {
    return std::max(SafetyLimits::MIN_KNEE_WIDTH_DB, std::min(SafetyLimits::MAX_KNEE_WIDTH_DB, kneeWidthDb));
}

double clampFeedbackThreshold(double threshold) {
    return std::max(SafetyLimits::MIN_FEEDBACK_THRESHOLD, std::min(SafetyLimits::MAX_FEEDBACK_THRESHOLD, threshold));
}

double clampLevelDb(double levelDb) {
    return std::max(SafetyLimits::MIN_LEVEL_DB, std::min(SafetyLimits::MAX_LEVEL_DB, levelDb));
}

size_t clampMemoryPoolSize(size_t poolSize) {
    return std::max(SafetyLimits::MIN_MEMORY_POOL_SIZE, std::min(SafetyLimits::MAX_MEMORY_POOL_SIZE, poolSize));
}

// === Fonctions d'auto-correction des configurations ===

SafetyConfig sanitizeConfig(const SafetyConfig& input) {
    SafetyConfig output = input;

    // Correction des paramètres de base
    output.sampleRate =
        std::max(SafetyLimits::MIN_SAMPLE_RATE, std::min(SafetyLimits::MAX_SAMPLE_RATE, output.sampleRate));
    output.channels = std::max(SafetyLimits::MIN_CHANNELS, std::min(SafetyLimits::MAX_CHANNELS, output.channels));
    output.maxProcessingTimeMs = std::max(MIN_PROCESSING_TIME_MS, std::min(MAX_PROCESSING_TIME_MS, output.maxProcessingTimeMs));

    // Correction DC
    output.dcConfig.threshold = clampDCThreshold(output.dcConfig.threshold);
    output.dcConfig.smoothingFactor = std::max(SMOOTHING_FACTOR_MIN, std::min(SMOOTHING_FACTOR_MAX, output.dcConfig.smoothingFactor));

    // Correction limiter
    output.limiterConfig.thresholdDb = clampLimiterThreshold(output.limiterConfig.thresholdDb);
    output.limiterConfig.kneeWidthDb = clampKneeWidth(output.limiterConfig.kneeWidthDb);
    output.limiterConfig.attackTimeMs = std::max(MIN_ATTACK_TIME_MS, std::min(MAX_ATTACK_TIME_MS, output.limiterConfig.attackTimeMs));
    output.limiterConfig.releaseTimeMs = std::max(MIN_RELEASE_TIME_MS, std::min(MAX_RELEASE_TIME_MS, output.limiterConfig.releaseTimeMs));
    output.limiterConfig.makeupGainDb = std::max(MIN_MAKEUP_GAIN_DB, std::min(MAX_MAKEUP_GAIN_DB, output.limiterConfig.makeupGainDb));

    // Correction feedback
    output.feedbackConfig.threshold = clampFeedbackThreshold(output.feedbackConfig.threshold);
    output.feedbackConfig.sensitivity = std::max(SENSITIVITY_MIN, std::min(SENSITIVITY_MAX, output.feedbackConfig.sensitivity));
    output.feedbackConfig.analysisWindowMs = std::max(MIN_ANALYSIS_WINDOW_MS, std::min(MAX_ANALYSIS_WINDOW_MS, output.feedbackConfig.analysisWindowMs));
    output.feedbackConfig.minFrequencyHz =
        std::max(MIN_FEEDBACK_FREQUENCY_HZ, std::min(output.feedbackConfig.maxFrequencyHz - MIN_FREQUENCY_DIFFERENCE_HZ, output.feedbackConfig.minFrequencyHz));
    output.feedbackConfig.maxFrequencyHz =
        std::max(output.feedbackConfig.minFrequencyHz + MIN_FREQUENCY_DIFFERENCE_HZ, std::min(MAX_FEEDBACK_FREQUENCY_HZ, output.feedbackConfig.maxFrequencyHz));

    // Correction optimisation
    output.optimizationConfig.memoryPoolSize = clampMemoryPoolSize(output.optimizationConfig.memoryPoolSize);

    return output;
}

// === Fonctions de comparaison de configurations ===

bool configsEqual(const SafetyConfig& a, const SafetyConfig& b) {
    return a.sampleRate == b.sampleRate && a.channels == b.channels && a.enabled == b.enabled &&
           a.autoGainControl == b.autoGainControl && std::abs(a.maxProcessingTimeMs - b.maxProcessingTimeMs) < CONFIG_COMPARISON_TOLERANCE &&

           // Comparaison DC
           a.dcConfig.enabled == b.dcConfig.enabled && std::abs(a.dcConfig.threshold - b.dcConfig.threshold) < THRESHOLD_COMPARISON_TOLERANCE &&
           std::abs(a.dcConfig.smoothingFactor - b.dcConfig.smoothingFactor) < CONFIG_COMPARISON_TOLERANCE &&

           // Comparaison limiter
           a.limiterConfig.enabled == b.limiterConfig.enabled &&
           std::abs(a.limiterConfig.thresholdDb - b.limiterConfig.thresholdDb) < CONFIG_COMPARISON_TOLERANCE &&
           a.limiterConfig.softKnee == b.limiterConfig.softKnee &&
           std::abs(a.limiterConfig.kneeWidthDb - b.limiterConfig.kneeWidthDb) < CONFIG_COMPARISON_TOLERANCE &&
           std::abs(a.limiterConfig.attackTimeMs - b.limiterConfig.attackTimeMs) < CONFIG_COMPARISON_TOLERANCE &&
           std::abs(a.limiterConfig.releaseTimeMs - b.limiterConfig.releaseTimeMs) < CONFIG_COMPARISON_TOLERANCE &&
           std::abs(a.limiterConfig.makeupGainDb - b.limiterConfig.makeupGainDb) < CONFIG_COMPARISON_TOLERANCE &&

           // Comparaison feedback
           a.feedbackConfig.enabled == b.feedbackConfig.enabled &&
           std::abs(a.feedbackConfig.threshold - b.feedbackConfig.threshold) < CONFIG_COMPARISON_TOLERANCE &&
           std::abs(a.feedbackConfig.sensitivity - b.feedbackConfig.sensitivity) < CONFIG_COMPARISON_TOLERANCE &&
           a.feedbackConfig.analysisWindowMs == b.feedbackConfig.analysisWindowMs &&
           a.feedbackConfig.minFrequencyHz == b.feedbackConfig.minFrequencyHz &&
           a.feedbackConfig.maxFrequencyHz == b.feedbackConfig.maxFrequencyHz &&

           // Comparaison optimisation
           a.optimizationConfig.useOptimizedEngine == b.optimizationConfig.useOptimizedEngine &&
           a.optimizationConfig.enableMemoryPool == b.optimizationConfig.enableMemoryPool &&
           a.optimizationConfig.branchFreeProcessing == b.optimizationConfig.branchFreeProcessing &&
           a.optimizationConfig.memoryPoolSize == b.optimizationConfig.memoryPoolSize &&
           a.optimizationConfig.enableStatistics == b.optimizationConfig.enableStatistics;
}

// === Fonctions de diagnostic ===

std::string getConfigInfo(const SafetyConfig& config) {
    char buffer[CONFIG_INFO_BUFFER_SIZE];
    std::snprintf(buffer, sizeof(buffer),
                  "SafetyConfig{sampleRate=%u, channels=%d, enabled=%s, "
                  "dc={enabled=%s, threshold=" FORMAT_DC_THRESHOLD "}, "
                  "limiter={enabled=%s, threshold=" FORMAT_LIMITER_THRESHOLD " dB, softKnee=%s}, "
                  "feedback={enabled=%s, threshold=" FORMAT_FEEDBACK_THRESHOLD "}, "
                  "optimization={useOptimized=%s, memoryPool=%zu}}",
                  config.sampleRate, config.channels, config.enabled ? "true" : "false",
                  config.dcConfig.enabled ? "true" : "false", config.dcConfig.threshold,
                  config.limiterConfig.enabled ? "true" : "false", config.limiterConfig.thresholdDb,
                  config.limiterConfig.softKnee ? "true" : "false", config.feedbackConfig.enabled ? "true" : "false",
                  config.feedbackConfig.threshold, config.optimizationConfig.useOptimizedEngine ? "true" : "false",
                  config.optimizationConfig.memoryPoolSize);
    return std::string(buffer);
}

std::string getReportInfo(const SafetyReport& report) {
    char buffer[REPORT_INFO_BUFFER_SIZE];
    std::snprintf(buffer, sizeof(buffer),
                  "SafetyReport{peak=" FORMAT_LIMITER_THRESHOLD " dB, rms=" FORMAT_LIMITER_THRESHOLD " dB, dc=" FORMAT_DC_THRESHOLD ", clipped=%u, "
                  "overload=%s, feedback=" FORMAT_FEEDBACK_THRESHOLD ", hasNaN=%s, time=" FORMAT_PROCESSING_TIME " ms}",
                  report.peakLevel, report.rmsLevel, report.dcOffset, report.clippedSamples,
                  report.overloadActive ? "true" : "false", report.feedbackScore, report.hasNaN ? "true" : "false",
                  report.processingTimeMs);
    return std::string(buffer);
}

} // namespace Audio
} // namespace Nyth
