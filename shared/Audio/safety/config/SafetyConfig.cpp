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
    config.maxProcessingTimeMs = 10.0;

    // Configuration DC par défaut
    config.dcConfig.enabled = true;
    config.dcConfig.threshold = SafetyLimits::DEFAULT_DC_THRESHOLD;
    config.dcConfig.smoothingFactor = 0.95;

    // Configuration limiter par défaut
    config.limiterConfig.enabled = true;
    config.limiterConfig.thresholdDb = SafetyLimits::DEFAULT_LIMITER_THRESHOLD_DB;
    config.limiterConfig.softKnee = true;
    config.limiterConfig.kneeWidthDb = SafetyLimits::DEFAULT_KNEE_WIDTH_DB;
    config.limiterConfig.attackTimeMs = 10.0;
    config.limiterConfig.releaseTimeMs = 100.0;
    config.limiterConfig.makeupGainDb = 0.0;

    // Configuration feedback par défaut
    config.feedbackConfig.enabled = true;
    config.feedbackConfig.threshold = SafetyLimits::DEFAULT_FEEDBACK_THRESHOLD;
    config.feedbackConfig.sensitivity = 0.8;
    config.feedbackConfig.analysisWindowMs = 100;
    config.feedbackConfig.minFrequencyHz = 20;
    config.feedbackConfig.maxFrequencyHz = 20000;

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
    return std::pow(10.0, db / 20.0);
}

double linearToDb(double linear) {
    if (linear <= SafetyLimits::MIN_LEVEL_LINEAR) {
        return SafetyLimits::MIN_LEVEL_DB;
    }
    return 20.0 * std::log10(linear);
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
    output.maxProcessingTimeMs = std::max(1.0, std::min(1000.0, output.maxProcessingTimeMs));

    // Correction DC
    output.dcConfig.threshold = clampDCThreshold(output.dcConfig.threshold);
    output.dcConfig.smoothingFactor = std::max(0.0, std::min(1.0, output.dcConfig.smoothingFactor));

    // Correction limiter
    output.limiterConfig.thresholdDb = clampLimiterThreshold(output.limiterConfig.thresholdDb);
    output.limiterConfig.kneeWidthDb = clampKneeWidth(output.limiterConfig.kneeWidthDb);
    output.limiterConfig.attackTimeMs = std::max(0.1, std::min(1000.0, output.limiterConfig.attackTimeMs));
    output.limiterConfig.releaseTimeMs = std::max(1.0, std::min(10000.0, output.limiterConfig.releaseTimeMs));
    output.limiterConfig.makeupGainDb = std::max(-20.0, std::min(20.0, output.limiterConfig.makeupGainDb));

    // Correction feedback
    output.feedbackConfig.threshold = clampFeedbackThreshold(output.feedbackConfig.threshold);
    output.feedbackConfig.sensitivity = std::max(0.0, std::min(1.0, output.feedbackConfig.sensitivity));
    output.feedbackConfig.analysisWindowMs = std::max(10u, std::min(1000u, output.feedbackConfig.analysisWindowMs));
    output.feedbackConfig.minFrequencyHz =
        std::max(20u, std::min(output.feedbackConfig.maxFrequencyHz - 100, output.feedbackConfig.minFrequencyHz));
    output.feedbackConfig.maxFrequencyHz =
        std::max(output.feedbackConfig.minFrequencyHz + 100, std::min(50000u, output.feedbackConfig.maxFrequencyHz));

    // Correction optimisation
    output.optimizationConfig.memoryPoolSize = clampMemoryPoolSize(output.optimizationConfig.memoryPoolSize);

    return output;
}

// === Fonctions de comparaison de configurations ===

bool configsEqual(const SafetyConfig& a, const SafetyConfig& b) {
    return a.sampleRate == b.sampleRate && a.channels == b.channels && a.enabled == b.enabled &&
           a.autoGainControl == b.autoGainControl && std::abs(a.maxProcessingTimeMs - b.maxProcessingTimeMs) < 1e-6 &&

           // Comparaison DC
           a.dcConfig.enabled == b.dcConfig.enabled && std::abs(a.dcConfig.threshold - b.dcConfig.threshold) < 1e-9 &&
           std::abs(a.dcConfig.smoothingFactor - b.dcConfig.smoothingFactor) < 1e-6 &&

           // Comparaison limiter
           a.limiterConfig.enabled == b.limiterConfig.enabled &&
           std::abs(a.limiterConfig.thresholdDb - b.limiterConfig.thresholdDb) < 1e-6 &&
           a.limiterConfig.softKnee == b.limiterConfig.softKnee &&
           std::abs(a.limiterConfig.kneeWidthDb - b.limiterConfig.kneeWidthDb) < 1e-6 &&
           std::abs(a.limiterConfig.attackTimeMs - b.limiterConfig.attackTimeMs) < 1e-6 &&
           std::abs(a.limiterConfig.releaseTimeMs - b.limiterConfig.releaseTimeMs) < 1e-6 &&
           std::abs(a.limiterConfig.makeupGainDb - b.limiterConfig.makeupGainDb) < 1e-6 &&

           // Comparaison feedback
           a.feedbackConfig.enabled == b.feedbackConfig.enabled &&
           std::abs(a.feedbackConfig.threshold - b.feedbackConfig.threshold) < 1e-6 &&
           std::abs(a.feedbackConfig.sensitivity - b.feedbackConfig.sensitivity) < 1e-6 &&
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
    char buffer[1024];
    std::snprintf(buffer, sizeof(buffer),
                  "SafetyConfig{sampleRate=%u, channels=%d, enabled=%s, "
                  "dc={enabled=%s, threshold=%.6f}, "
                  "limiter={enabled=%s, threshold=%.1f dB, softKnee=%s}, "
                  "feedback={enabled=%s, threshold=%.3f}, "
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
    char buffer[512];
    std::snprintf(buffer, sizeof(buffer),
                  "SafetyReport{peak=%.1f dB, rms=%.1f dB, dc=%.6f, clipped=%u, "
                  "overload=%s, feedback=%.3f, hasNaN=%s, time=%.2f ms}",
                  report.peakLevel, report.rmsLevel, report.dcOffset, report.clippedSamples,
                  report.overloadActive ? "true" : "false", report.feedbackScore, report.hasNaN ? "true" : "false",
                  report.processingTimeMs);
    return std::string(buffer);
}

} // namespace Audio
} // namespace Nyth
