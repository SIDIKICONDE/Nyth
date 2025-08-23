#include "NativeAudioSafetyModule.h"

#if NYTH_AUDIO_SAFETY_ENABLED

#include "Audio/safety/AudioSafety.hpp"
#include "Audio/safety/AudioSafetyOptimized.hpp"
#include <chrono>
#include <sstream>
#include <algorithm>
#include <cmath>

// === Instance globale pour l'API C ===
static std::unique_ptr<AudioSafety::AudioSafetyEngine> g_safetyEngine;
static std::unique_ptr<AudioSafety::AudioSafetyEngineOptimized> g_optimizedEngine;
static std::mutex g_globalMutex;
static NythSafetyConfig g_currentConfig = {0};
static NythSafetyOptimizationConfig g_optimizationConfig = {0};
static NythSafetyState g_currentState = SAFETY_STATE_UNINITIALIZED;
static NythSafetyReport g_lastReport = {0};

// === Implémentation de l'API C ===
extern "C" {

bool NythSafety_Initialize(uint32_t sampleRate, int channels) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    try {
        AudioSafety::SafetyError error;

        // Initialize main engine
        g_safetyEngine = std::make_unique<AudioSafety::AudioSafetyEngine>(
            sampleRate, channels, &error);

        if (error != AudioSafety::SafetyError::OK) {
            g_currentState = SAFETY_STATE_ERROR;
            return false;
        }

        // Initialize optimized engine if requested
        if (g_optimizationConfig.useOptimizedEngine) {
            g_optimizedEngine = std::make_unique<AudioSafety::AudioSafetyEngineOptimized>(
                sampleRate, channels, &error);

            if (error != AudioSafety::SafetyError::OK) {
                g_optimizedEngine.reset();
                // Continue without optimized engine
            }
        }

        // Apply current configuration
        if (!g_currentConfig.enabled) {
            // Set default config if not set
            g_currentConfig = {
                true,   // enabled
                true,   // dcRemovalEnabled
                0.002,  // dcThreshold
                true,   // limiterEnabled
                -1.0,   // limiterThresholdDb
                true,   // softKneeLimiter
                6.0,    // kneeWidthDb
                true,   // feedbackDetectEnabled
                0.95    // feedbackCorrThreshold
            };
        }

        AudioSafety::SafetyConfig nativeConfig = {
            g_currentConfig.enabled,
            g_currentConfig.dcRemovalEnabled,
            g_currentConfig.dcThreshold,
            g_currentConfig.limiterEnabled,
            g_currentConfig.limiterThresholdDb,
            g_currentConfig.softKneeLimiter,
            g_currentConfig.kneeWidthDb,
            g_currentConfig.feedbackDetectEnabled,
            g_currentConfig.feedbackCorrThreshold
        };

        if (g_safetyEngine->setConfig(nativeConfig) != AudioSafety::SafetyError::OK) {
            g_currentState = SAFETY_STATE_ERROR;
            return false;
        }

        if (g_optimizedEngine) {
            g_optimizedEngine->setConfig(nativeConfig);
        }

        g_currentState = SAFETY_STATE_INITIALIZED;
        return true;
    } catch (...) {
        g_currentState = SAFETY_STATE_ERROR;
        return false;
    }
}

bool NythSafety_IsInitialized(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_currentState == SAFETY_STATE_INITIALIZED ||
           g_currentState == SAFETY_STATE_PROCESSING;
}

void NythSafety_Release(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    g_safetyEngine.reset();
    g_optimizedEngine.reset();
    g_currentState = SAFETY_STATE_UNINITIALIZED;
}

// === État et informations ===
NythSafetyState NythSafety_GetState(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_currentState;
}

const char* NythSafety_GetErrorString(NythSafetyError error) {
    switch (error) {
        case SAFETY_ERROR_OK:
            return "OK";
        case SAFETY_ERROR_NULL_BUFFER:
            return "Null buffer";
        case SAFETY_ERROR_INVALID_SAMPLE_RATE:
            return "Invalid sample rate";
        case SAFETY_ERROR_INVALID_CHANNELS:
            return "Invalid channels";
        case SAFETY_ERROR_INVALID_THRESHOLD_DB:
            return "Invalid threshold dB";
        case SAFETY_ERROR_INVALID_KNEE_WIDTH:
            return "Invalid knee width";
        case SAFETY_ERROR_INVALID_DC_THRESHOLD:
            return "Invalid DC threshold";
        case SAFETY_ERROR_INVALID_FEEDBACK_THRESHOLD:
            return "Invalid feedback threshold";
        case SAFETY_ERROR_PROCESSING_FAILED:
            return "Processing failed";
        default:
            return "Unknown error";
    }
}

// === Configuration ===
bool NythSafety_SetConfig(const NythSafetyConfig* config) {
    if (!config) return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (g_currentState == SAFETY_STATE_UNINITIALIZED) return false;

    g_currentConfig = *config;

    AudioSafety::SafetyConfig nativeConfig = {
        config->enabled,
        config->dcRemovalEnabled,
        config->dcThreshold,
        config->limiterEnabled,
        config->limiterThresholdDb,
        config->softKneeLimiter,
        config->kneeWidthDb,
        config->feedbackDetectEnabled,
        config->feedbackCorrThreshold
    };

    bool success = true;
    if (g_safetyEngine) {
        success &= (g_safetyEngine->setConfig(nativeConfig) == AudioSafety::SafetyError::OK);
    }
    if (g_optimizedEngine) {
        success &= (g_optimizedEngine->setConfig(nativeConfig) == AudioSafety::SafetyError::OK);
    }

    return success;
}

void NythSafety_GetConfig(NythSafetyConfig* config) {
    if (!config) return;

    std::lock_guard<std::mutex> lock(g_globalMutex);
    *config = g_currentConfig;
}

bool NythSafety_SetOptimizationConfig(const NythSafetyOptimizationConfig* config) {
    if (!config) return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);
    g_optimizationConfig = *config;
    return true;
}

// === Traitement audio ===
NythSafetyError NythSafety_ProcessMono(float* buffer, size_t numSamples) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (g_currentState != SAFETY_STATE_PROCESSING &&
        g_currentState != SAFETY_STATE_INITIALIZED) {
        return SAFETY_ERROR_PROCESSING_FAILED;
    }

    if (!buffer) return SAFETY_ERROR_NULL_BUFFER;
    if (numSamples == 0) return SAFETY_ERROR_OK;

    AudioSafety::SafetyError error;

    if (g_optimizationConfig.useOptimizedEngine && g_optimizedEngine) {
        error = g_optimizedEngine->processMono(buffer, numSamples);
    } else if (g_safetyEngine) {
        error = g_safetyEngine->processMono(buffer, numSamples);
    } else {
        return SAFETY_ERROR_PROCESSING_FAILED;
    }

    // Update state and report
    if (error == AudioSafety::SafetyError::OK) {
        g_currentState = SAFETY_STATE_PROCESSING;
        if (g_optimizationConfig.useOptimizedEngine && g_optimizedEngine) {
            auto report = g_optimizedEngine->getLastReport();
            g_lastReport = {
                report.peak,
                report.rms,
                report.dcOffset,
                report.clippedSamples,
                report.overloadActive,
                report.feedbackScore,
                report.hasNaN,
                report.feedbackLikely
            };
        } else if (g_safetyEngine) {
            auto report = g_safetyEngine->getLastReport();
            g_lastReport = {
                report.peak,
                report.rms,
                report.dcOffset,
                report.clippedSamples,
                report.overloadActive,
                report.feedbackScore,
                report.hasNaN,
                report.feedbackLikely
            };
        }
    }

    return (error == AudioSafety::SafetyError::OK) ? SAFETY_ERROR_OK :
           (error == AudioSafety::SafetyError::NULL_BUFFER) ? SAFETY_ERROR_NULL_BUFFER :
           SAFETY_ERROR_PROCESSING_FAILED;
}

NythSafetyError NythSafety_ProcessStereo(float* left, float* right, size_t numSamples) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (g_currentState != SAFETY_STATE_PROCESSING &&
        g_currentState != SAFETY_STATE_INITIALIZED) {
        return SAFETY_ERROR_PROCESSING_FAILED;
    }

    if (!left || !right) return SAFETY_ERROR_NULL_BUFFER;
    if (numSamples == 0) return SAFETY_ERROR_OK;

    AudioSafety::SafetyError error;

    if (g_optimizationConfig.useOptimizedEngine && g_optimizedEngine) {
        error = g_optimizedEngine->processStereo(left, right, numSamples);
    } else if (g_safetyEngine) {
        error = g_safetyEngine->processStereo(left, right, numSamples);
    } else {
        return SAFETY_ERROR_PROCESSING_FAILED;
    }

    // Update state and report
    if (error == AudioSafety::SafetyError::OK) {
        g_currentState = SAFETY_STATE_PROCESSING;
        if (g_optimizationConfig.useOptimizedEngine && g_optimizedEngine) {
            auto report = g_optimizedEngine->getLastReport();
            g_lastReport = {
                report.peak,
                report.rms,
                report.dcOffset,
                report.clippedSamples,
                report.overloadActive,
                report.feedbackScore,
                report.hasNaN,
                report.feedbackLikely
            };
        } else if (g_safetyEngine) {
            auto report = g_safetyEngine->getLastReport();
            g_lastReport = {
                report.peak,
                report.rms,
                report.dcOffset,
                report.clippedSamples,
                report.overloadActive,
                report.feedbackScore,
                report.hasNaN,
                report.feedbackLikely
            };
        }
    }

    return (error == AudioSafety::SafetyError::OK) ? SAFETY_ERROR_OK :
           (error == AudioSafety::SafetyError::NULL_BUFFER) ? SAFETY_ERROR_NULL_BUFFER :
           SAFETY_ERROR_PROCESSING_FAILED;
}

// === Analyse et rapports ===
void NythSafety_GetLastReport(NythSafetyReport* report) {
    if (!report) return;

    std::lock_guard<std::mutex> lock(g_globalMutex);
    *report = g_lastReport;
}

bool NythSafety_IsOverloadActive(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_lastReport.overloadActive;
}

bool NythSafety_HasFeedbackLikely(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_lastReport.feedbackLikely;
}

double NythSafety_GetCurrentPeak(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_lastReport.peak;
}

double NythSafety_GetCurrentRMS(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_lastReport.rms;
}

// === Contrôle avancé ===

double NythSafety_DbToLinear(double db) {
    return std::pow(10.0, db / 20.0);
}

double NythSafety_LinearToDb(double linear) {
    return 20.0 * std::log10(std::max(linear, 1e-10));
}

void NythSafety_ResetStatistics(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    memset(&g_lastReport, 0, sizeof(NythSafetyReport));
}

void NythSafety_GetStatistics(NythSafetyReport* min, NythSafetyReport* max, NythSafetyReport* avg) {
    // This would require tracking statistics over time
    // For now, just return the last report
    if (min) *min = g_lastReport;
    if (max) *max = g_lastReport;
    if (avg) *avg = g_lastReport;
}

// === Callbacks ===
static NythSafetyDataCallback g_dataCallback = nullptr;
static NythSafetyErrorCallback g_errorCallback = nullptr;
static NythSafetyStateChangeCallback g_stateChangeCallback = nullptr;

void NythSafety_SetAudioDataCallback(NythSafetyDataCallback callback) {
    g_dataCallback = callback;
}

void NythSafety_SetErrorCallback(NythSafetyErrorCallback callback) {
    g_errorCallback = callback;
}

void NythSafety_SetStateChangeCallback(NythSafetyStateChangeCallback callback) {
    g_stateChangeCallback = callback;
}

} // extern "C"

// === Implémentation C++ pour TurboModule ===

namespace facebook {
namespace react {

NativeAudioSafetyModule::NativeAudioSafetyModule(std::shared_ptr<CallInvoker> jsInvoker)
    : TurboModule(jsInvoker) {
    // Initialize with defaults
    currentConfig_ = {
        true,   // enabled
        true,   // dcRemovalEnabled
        0.002,  // dcThreshold
        true,   // limiterEnabled
        -1.0,   // limiterThresholdDb
        true,   // softKneeLimiter
        6.0,    // kneeWidthDb
        true,   // feedbackDetectEnabled
        0.95    // feedbackCorrThreshold
    };

    optimizationConfig_ = {
        false, // useOptimizedEngine
        true,  // enableMemoryPool
        true,  // branchFreeProcessing
        32     // poolSize
    };
}

NativeAudioSafetyModule::~NativeAudioSafetyModule() {
    std::lock_guard<std::mutex> lock(safetyMutex_);
    safetyEngine_.reset();
    optimizedEngine_.reset();
}

// === Méthodes privées ===

bool NativeAudioSafetyModule::useOptimizedEngine() const {
    return optimizationConfig_.useOptimizedEngine && optimizedEngine_ != nullptr;
}

AudioSafety::SafetyError NativeAudioSafetyModule::processMonoInternal(float* buffer, size_t numSamples) {
    if (useOptimizedEngine()) {
        return optimizedEngine_->processMono(buffer, numSamples);
    } else if (safetyEngine_) {
        return safetyEngine_->processMono(buffer, numSamples);
    }
    return AudioSafety::SafetyError::PROCESSING_FAILED;
}

AudioSafety::SafetyError NativeAudioSafetyModule::processStereoInternal(float* left, float* right, size_t numSamples) {
    if (useOptimizedEngine()) {
        return optimizedEngine_->processStereo(left, right, numSamples);
    } else if (safetyEngine_) {
        return safetyEngine_->processStereo(left, right, numSamples);
    }
    return AudioSafety::SafetyError::PROCESSING_FAILED;
}

void NativeAudioSafetyModule::updateStatistics(const AudioSafety::SafetyReport& report) {
    lastReport_ = convertReport(report);

    // Update min/max/avg statistics
    if (statsCount_ == 0) {
        minReport_ = lastReport_;
        maxReport_ = lastReport_;
        avgReport_ = lastReport_;
    } else {
        // Update min
        minReport_.peak = std::min(minReport_.peak, lastReport_.peak);
        minReport_.rms = std::min(minReport_.rms, lastReport_.rms);
        minReport_.dcOffset = std::min(minReport_.dcOffset, lastReport_.dcOffset);
        minReport_.clippedSamples = std::min(minReport_.clippedSamples, lastReport_.clippedSamples);
        minReport_.feedbackScore = std::min(minReport_.feedbackScore, lastReport_.feedbackScore);

        // Update max
        maxReport_.peak = std::max(maxReport_.peak, lastReport_.peak);
        maxReport_.rms = std::max(maxReport_.rms, lastReport_.rms);
        maxReport_.dcOffset = std::max(maxReport_.dcOffset, lastReport_.dcOffset);
        maxReport_.clippedSamples = std::max(maxReport_.clippedSamples, lastReport_.clippedSamples);
        maxReport_.feedbackScore = std::max(maxReport_.feedbackScore, lastReport_.feedbackScore);

        // Update avg (running average)
        double factor = 1.0 / (statsCount_ + 1);
        avgReport_.peak = avgReport_.peak * (1.0 - factor) + lastReport_.peak * factor;
        avgReport_.rms = avgReport_.rms * (1.0 - factor) + lastReport_.rms * factor;
        avgReport_.dcOffset = avgReport_.dcOffset * (1.0 - factor) + lastReport_.dcOffset * factor;
        avgReport_.clippedSamples = avgReport_.clippedSamples * (1.0 - factor) + lastReport_.clippedSamples * factor;
        avgReport_.feedbackScore = avgReport_.feedbackScore * (1.0 - factor) + lastReport_.feedbackScore * factor;
    }

    statsCount_++;
}

NythSafetyError NativeAudioSafetyModule::convertError(AudioSafety::SafetyError error) const {
    switch (error) {
        case AudioSafety::SafetyError::OK:
            return SAFETY_ERROR_OK;
        case AudioSafety::SafetyError::NULL_BUFFER:
            return SAFETY_ERROR_NULL_BUFFER;
        case AudioSafety::SafetyError::INVALID_SAMPLE_RATE:
            return SAFETY_ERROR_INVALID_SAMPLE_RATE;
        case AudioSafety::SafetyError::INVALID_CHANNELS:
            return SAFETY_ERROR_INVALID_CHANNELS;
        case AudioSafety::SafetyError::INVALID_THRESHOLD_DB:
            return SAFETY_ERROR_INVALID_THRESHOLD_DB;
        case AudioSafety::SafetyError::INVALID_KNEE_WIDTH:
            return SAFETY_ERROR_INVALID_KNEE_WIDTH;
        case AudioSafety::SafetyError::INVALID_DC_THRESHOLD:
            return SAFETY_ERROR_INVALID_DC_THRESHOLD;
        case AudioSafety::SafetyError::INVALID_FEEDBACK_THRESHOLD:
            return SAFETY_ERROR_INVALID_FEEDBACK_THRESHOLD;
        case AudioSafety::SafetyError::PROCESSING_FAILED:
        default:
            return SAFETY_ERROR_PROCESSING_FAILED;
    }
}

AudioSafety::SafetyError NativeAudioSafetyModule::convertError(NythSafetyError error) const {
    switch (error) {
        case SAFETY_ERROR_OK:
            return AudioSafety::SafetyError::OK;
        case SAFETY_ERROR_NULL_BUFFER:
            return AudioSafety::SafetyError::NULL_BUFFER;
        case SAFETY_ERROR_INVALID_SAMPLE_RATE:
            return AudioSafety::SafetyError::INVALID_SAMPLE_RATE;
        case SAFETY_ERROR_INVALID_CHANNELS:
            return AudioSafety::SafetyError::INVALID_CHANNELS;
        case SAFETY_ERROR_INVALID_THRESHOLD_DB:
            return AudioSafety::SafetyError::INVALID_THRESHOLD_DB;
        case SAFETY_ERROR_INVALID_KNEE_WIDTH:
            return AudioSafety::SafetyError::INVALID_KNEE_WIDTH;
        case SAFETY_ERROR_INVALID_DC_THRESHOLD:
            return AudioSafety::SafetyError::INVALID_DC_THRESHOLD;
        case SAFETY_ERROR_INVALID_FEEDBACK_THRESHOLD:
            return AudioSafety::SafetyError::INVALID_FEEDBACK_THRESHOLD;
        case SAFETY_ERROR_PROCESSING_FAILED:
        default:
            return AudioSafety::SafetyError::PROCESSING_FAILED;
    }
}

// === Conversion JSI <-> Native ===

NythSafetyConfig NativeAudioSafetyModule::parseSafetyConfig(
    jsi::Runtime& rt, const jsi::Object& jsConfig) {

    NythSafetyConfig config = currentConfig_;

    if (jsConfig.hasProperty(rt, "enabled")) {
        config.enabled = jsConfig.getProperty(rt, "enabled").asBool();
    }

    if (jsConfig.hasProperty(rt, "dcRemovalEnabled")) {
        config.dcRemovalEnabled = jsConfig.getProperty(rt, "dcRemovalEnabled").asBool();
    }

    if (jsConfig.hasProperty(rt, "dcThreshold")) {
        config.dcThreshold = jsConfig.getProperty(rt, "dcThreshold").asNumber();
    }

    if (jsConfig.hasProperty(rt, "limiterEnabled")) {
        config.limiterEnabled = jsConfig.getProperty(rt, "limiterEnabled").asBool();
    }

    if (jsConfig.hasProperty(rt, "limiterThresholdDb")) {
        config.limiterThresholdDb = jsConfig.getProperty(rt, "limiterThresholdDb").asNumber();
    }

    if (jsConfig.hasProperty(rt, "softKneeLimiter")) {
        config.softKneeLimiter = jsConfig.getProperty(rt, "softKneeLimiter").asBool();
    }

    if (jsConfig.hasProperty(rt, "kneeWidthDb")) {
        config.kneeWidthDb = jsConfig.getProperty(rt, "kneeWidthDb").asNumber();
    }

    if (jsConfig.hasProperty(rt, "feedbackDetectEnabled")) {
        config.feedbackDetectEnabled = jsConfig.getProperty(rt, "feedbackDetectEnabled").asBool();
    }

    if (jsConfig.hasProperty(rt, "feedbackCorrThreshold")) {
        config.feedbackCorrThreshold = jsConfig.getProperty(rt, "feedbackCorrThreshold").asNumber();
    }

    return config;
}

jsi::Object NativeAudioSafetyModule::safetyConfigToJS(
    jsi::Runtime& rt, const NythSafetyConfig& config) {

    jsi::Object jsConfig(rt);

    jsConfig.setProperty(rt, "enabled", jsi::Value(config.enabled));
    jsConfig.setProperty(rt, "dcRemovalEnabled", jsi::Value(config.dcRemovalEnabled));
    jsConfig.setProperty(rt, "dcThreshold", jsi::Value(config.dcThreshold));
    jsConfig.setProperty(rt, "limiterEnabled", jsi::Value(config.limiterEnabled));
    jsConfig.setProperty(rt, "limiterThresholdDb", jsi::Value(config.limiterThresholdDb));
    jsConfig.setProperty(rt, "softKneeLimiter", jsi::Value(config.softKneeLimiter));
    jsConfig.setProperty(rt, "kneeWidthDb", jsi::Value(config.kneeWidthDb));
    jsConfig.setProperty(rt, "feedbackDetectEnabled", jsi::Value(config.feedbackDetectEnabled));
    jsConfig.setProperty(rt, "feedbackCorrThreshold", jsi::Value(config.feedbackCorrThreshold));

    return jsConfig;
}

jsi::Object NativeAudioSafetyModule::safetyReportToJS(
    jsi::Runtime& rt, const NythSafetyReport& report) {

    jsi::Object jsReport(rt);

    jsReport.setProperty(rt, "peak", jsi::Value(report.peak));
    jsReport.setProperty(rt, "rms", jsi::Value(report.rms));
    jsReport.setProperty(rt, "dcOffset", jsi::Value(report.dcOffset));
    jsReport.setProperty(rt, "clippedSamples", jsi::Value(static_cast<int>(report.clippedSamples)));
    jsReport.setProperty(rt, "overloadActive", jsi::Value(report.overloadActive));
    jsReport.setProperty(rt, "feedbackScore", jsi::Value(report.feedbackScore));
    jsReport.setProperty(rt, "hasNaN", jsi::Value(report.hasNaN));
    jsReport.setProperty(rt, "feedbackLikely", jsi::Value(report.feedbackLikely));

    return jsReport;
}

NythSafetyOptimizationConfig NativeAudioSafetyModule::parseOptimizationConfig(
    jsi::Runtime& rt, const jsi::Object& jsConfig) {

    NythSafetyOptimizationConfig config = optimizationConfig_;

    if (jsConfig.hasProperty(rt, "useOptimizedEngine")) {
        config.useOptimizedEngine = jsConfig.getProperty(rt, "useOptimizedEngine").asBool();
    }

    if (jsConfig.hasProperty(rt, "enableMemoryPool")) {
        config.enableMemoryPool = jsConfig.getProperty(rt, "enableMemoryPool").asBool();
    }

    if (jsConfig.hasProperty(rt, "branchFreeProcessing")) {
        config.branchFreeProcessing = jsConfig.getProperty(rt, "branchFreeProcessing").asBool();
    }

    if (jsConfig.hasProperty(rt, "poolSize")) {
        config.poolSize = static_cast<size_t>(jsConfig.getProperty(rt, "poolSize").asNumber());
    }

    return config;
}

jsi::Object NativeAudioSafetyModule::optimizationConfigToJS(
    jsi::Runtime& rt, const NythSafetyOptimizationConfig& config) {

    jsi::Object jsConfig(rt);

    jsConfig.setProperty(rt, "useOptimizedEngine", jsi::Value(config.useOptimizedEngine));
    jsConfig.setProperty(rt, "enableMemoryPool", jsi::Value(config.enableMemoryPool));
    jsConfig.setProperty(rt, "branchFreeProcessing", jsi::Value(config.branchFreeProcessing));
    jsConfig.setProperty(rt, "poolSize", jsi::Value(static_cast<int>(config.poolSize)));

    return jsConfig;
}

NythSafetyReport NativeAudioSafetyModule::convertReport(const AudioSafety::SafetyReport& src) const {
    return {
        src.peak,
        src.rms,
        src.dcOffset,
        src.clippedSamples,
        src.overloadActive,
        src.feedbackScore,
        src.hasNaN,
        src.feedbackLikely
    };
}

AudioSafety::SafetyConfig NativeAudioSafetyModule::convertConfig(const NythSafetyConfig& src) const {
    return {
        src.enabled,
        src.dcRemovalEnabled,
        src.dcThreshold,
        src.limiterEnabled,
        src.limiterThresholdDb,
        src.softKneeLimiter,
        src.kneeWidthDb,
        src.feedbackDetectEnabled,
        src.feedbackCorrThreshold
    };
}

void NativeAudioSafetyModule::invokeJSCallback(
    const std::string& callbackName,
    std::function<void(jsi::Runtime&)> invocation) {

    // Pour l'instant, implémentation basique
    // Dans un vrai module, il faudrait utiliser le jsInvoker pour invoquer sur le thread principal
    try {
        // TODO: Implémenter l'invocation sur le thread principal
        invocation(*reinterpret_cast<jsi::Runtime*>(nullptr));
    } catch (...) {
        // Gérer les erreurs d'invocation
    }
}

// === Méthodes publiques ===

jsi::Value NativeAudioSafetyModule::initialize(jsi::Runtime& rt, uint32_t sampleRate, int channels) {
    std::lock_guard<std::mutex> lock(safetyMutex_);

    try {
        AudioSafety::SafetyError error;

        // Initialize main engine
        safetyEngine_ = std::make_unique<AudioSafety::AudioSafetyEngine>(
            sampleRate, channels, &error);

        if (error != AudioSafety::SafetyError::OK) {
            currentState_ = SAFETY_STATE_ERROR;
            return jsi::Value(false);
        }

        // Initialize optimized engine if requested
        if (optimizationConfig_.useOptimizedEngine) {
            optimizedEngine_ = std::make_unique<AudioSafety::AudioSafetyEngineOptimized>(
                sampleRate, channels, &error);

            if (error != AudioSafety::SafetyError::OK) {
                optimizedEngine_.reset();
                // Continue without optimized engine
            }
        }

        // Apply current configuration
        auto nativeConfig = convertConfig(currentConfig_);
        if (safetyEngine_->setConfig(nativeConfig) != AudioSafety::SafetyError::OK) {
            currentState_ = SAFETY_STATE_ERROR;
            return jsi::Value(false);
        }

        if (optimizedEngine_) {
            optimizedEngine_->setConfig(nativeConfig);
        }

        currentState_ = SAFETY_STATE_INITIALIZED;
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(std::string("Initialization failed: ") + e.what());
        currentState_ = SAFETY_STATE_ERROR;
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioSafetyModule::isInitialized(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(safetyMutex_);
    return jsi::Value(currentState_.load() == SAFETY_STATE_INITIALIZED ||
                     currentState_.load() == SAFETY_STATE_PROCESSING);
}

jsi::Value NativeAudioSafetyModule::dispose(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(safetyMutex_);

    safetyEngine_.reset();
    optimizedEngine_.reset();
    currentState_ = SAFETY_STATE_UNINITIALIZED;

    return jsi::Value(true);
}

jsi::Value NativeAudioSafetyModule::getState(jsi::Runtime& rt) {
    return jsi::String::createFromUtf8(rt, stateToString(currentState_.load()));
}

std::string NativeAudioSafetyModule::stateToString(NythSafetyState state) const {
    switch (state) {
        case SAFETY_STATE_UNINITIALIZED: return "uninitialized";
        case SAFETY_STATE_INITIALIZED: return "initialized";
        case SAFETY_STATE_PROCESSING: return "processing";
        case SAFETY_STATE_ERROR: return "error";
        default: return "unknown";
    }
}

jsi::Value NativeAudioSafetyModule::getErrorString(jsi::Runtime& rt, int errorCode) {
    return jsi::String::createFromUtf8(rt, NythSafety_GetErrorString(static_cast<NythSafetyError>(errorCode)));
}

jsi::Value NativeAudioSafetyModule::setConfig(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(safetyMutex_);

    try {
        auto nativeConfig = parseSafetyConfig(rt, config);
        currentConfig_ = nativeConfig;

        auto safetyConfig = convertConfig(nativeConfig);
        bool success = true;

        if (safetyEngine_) {
            success &= (safetyEngine_->setConfig(safetyConfig) == AudioSafety::SafetyError::OK);
        }

        if (optimizedEngine_) {
            success &= (optimizedEngine_->setConfig(safetyConfig) == AudioSafety::SafetyError::OK);
        }

        return jsi::Value(success);
    } catch (const std::exception& e) {
        handleError(std::string("Config update failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioSafetyModule::getConfig(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(safetyMutex_);
    return safetyConfigToJS(rt, currentConfig_);
}

jsi::Value NativeAudioSafetyModule::setOptimizationConfig(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(safetyMutex_);

    optimizationConfig_ = parseOptimizationConfig(rt, config);

    // If switching to optimized engine and we don't have one, try to create it
    if (optimizationConfig_.useOptimizedEngine && !optimizedEngine_ && safetyEngine_) {
        try {
            AudioSafety::SafetyError error;
            optimizedEngine_ = std::make_unique<AudioSafety::AudioSafetyEngineOptimized>(
                safetyEngine_->getConfig().sampleRate, 2, &error);

            if (error == AudioSafety::SafetyError::OK) {
                optimizedEngine_->setConfig(safetyEngine_->getConfig());
            } else {
                optimizedEngine_.reset();
            }
        } catch (...) {
            optimizedEngine_.reset();
        }
    }

    return jsi::Value(true);
}

jsi::Value NativeAudioSafetyModule::processMono(jsi::Runtime& rt, const jsi::Array& buffer) {
    std::lock_guard<std::mutex> lock(safetyMutex_);

    size_t numSamples = buffer.length(rt);
    if (tempBuffer_.size() < numSamples) {
        tempBuffer_.resize(numSamples);
    }

    // Convertir l'array JSI en buffer C++
    for (size_t i = 0; i < numSamples; ++i) {
        tempBuffer_[i] = static_cast<float>(buffer.getValueAtIndex(rt, i).asNumber());
    }

    auto error = processMonoInternal(tempBuffer_.data(), numSamples);

    if (error == AudioSafety::SafetyError::OK) {
        if (useOptimizedEngine()) {
            updateStatistics(optimizedEngine_->getLastReport());
        } else if (safetyEngine_) {
            updateStatistics(safetyEngine_->getLastReport());
        }
        currentState_ = SAFETY_STATE_PROCESSING;

        // Convertir le résultat en array JSI
        jsi::Array result(rt, numSamples);
        for (size_t i = 0; i < numSamples; ++i) {
            result.setValueAtIndex(rt, i, jsi::Value(tempBuffer_[i]));
        }
        return result;
    }

    return jsi::Value::null();
}

jsi::Value NativeAudioSafetyModule::processStereo(jsi::Runtime& rt,
                                                const jsi::Array& left,
                                                const jsi::Array& right) {
    std::lock_guard<std::mutex> lock(safetyMutex_);

    size_t numSamples = left.length(rt);
    if (numSamples != right.length(rt)) {
        return jsi::Value::null();
    }

    if (tempBuffer_.size() < numSamples * 2) {
        tempBuffer_.resize(numSamples * 2);
    }

    // Convertir les arrays JSI en buffers C++
    for (size_t i = 0; i < numSamples; ++i) {
        tempBuffer_[i] = static_cast<float>(left.getValueAtIndex(rt, i).asNumber());
        tempBuffer_[i + numSamples] = static_cast<float>(right.getValueAtIndex(rt, i).asNumber());
    }

    auto error = processStereoInternal(tempBuffer_.data(), tempBuffer_.data() + numSamples, numSamples);

    if (error == AudioSafety::SafetyError::OK) {
        if (useOptimizedEngine()) {
            updateStatistics(optimizedEngine_->getLastReport());
        } else if (safetyEngine_) {
            updateStatistics(safetyEngine_->getLastReport());
        }
        currentState_ = SAFETY_STATE_PROCESSING;

        // Convertir les résultats en objet JSI
        jsi::Object result(rt);
        jsi::Array resultL(rt, numSamples);
        jsi::Array resultR(rt, numSamples);

        for (size_t i = 0; i < numSamples; ++i) {
            resultL.setValueAtIndex(rt, i, jsi::Value(tempBuffer_[i]));
            resultR.setValueAtIndex(rt, i, jsi::Value(tempBuffer_[i + numSamples]));
        }

        result.setProperty(rt, "left", std::move(resultL));
        result.setProperty(rt, "right", std::move(resultR));
        return result;
    }

    return jsi::Value::null();
}

jsi::Value NativeAudioSafetyModule::getLastReport(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(safetyMutex_);
    return safetyReportToJS(rt, lastReport_);
}

jsi::Value NativeAudioSafetyModule::isOverloadActive(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(safetyMutex_);
    return jsi::Value(lastReport_.overloadActive);
}

jsi::Value NativeAudioSafetyModule::hasFeedbackLikely(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(safetyMutex_);
    return jsi::Value(lastReport_.feedbackLikely);
}

jsi::Value NativeAudioSafetyModule::getCurrentPeak(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(safetyMutex_);
    return jsi::Value(lastReport_.peak);
}

jsi::Value NativeAudioSafetyModule::getCurrentRMS(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(safetyMutex_);
    return jsi::Value(lastReport_.rms);
}

jsi::Value NativeAudioSafetyModule::dbToLinear(jsi::Runtime& rt, double db) {
    return jsi::Value(NythSafety_DbToLinear(db));
}

jsi::Value NativeAudioSafetyModule::linearToDb(jsi::Runtime& rt, double linear) {
    return jsi::Value(NythSafety_LinearToDb(linear));
}

jsi::Value NativeAudioSafetyModule::resetStatistics(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(safetyMutex_);
    statsCount_ = 0;
    memset(&lastReport_, 0, sizeof(NythSafetyReport));
    memset(&minReport_, 0, sizeof(NythSafetyReport));
    memset(&maxReport_, 0, sizeof(NythSafetyReport));
    memset(&avgReport_, 0, sizeof(NythSafetyReport));
    return jsi::Value(true);
}

jsi::Value NativeAudioSafetyModule::getStatistics(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(safetyMutex_);

    jsi::Object stats(rt);
    stats.setProperty(rt, "min", safetyReportToJS(rt, minReport_));
    stats.setProperty(rt, "max", safetyReportToJS(rt, maxReport_));
    stats.setProperty(rt, "avg", safetyReportToJS(rt, avgReport_));

    return stats;
}

// === Callbacks JavaScript ===

jsi::Value NativeAudioSafetyModule::setAudioDataCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    jsCallbacks_.audioDataCallback = std::make_shared<jsi::Function>(
        jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forUtf8(rt, "audioDataCallback"),
        0, [](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {
            return jsi::Value::undefined();
        }));
    return jsi::Value(true);
}

jsi::Value NativeAudioSafetyModule::setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    jsCallbacks_.errorCallback = std::make_shared<jsi::Function>(
        jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forUtf8(rt, "errorCallback"),
        0, [](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {
            return jsi::Value::undefined();
        }));
    return jsi::Value(true);
}

jsi::Value NativeAudioSafetyModule::setStateChangeCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    jsCallbacks_.stateChangeCallback = std::make_shared<jsi::Function>(
        jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forUtf8(rt, "stateChangeCallback"),
        0, [](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {
            return jsi::Value::undefined();
        }));
    return jsi::Value(true);
}

jsi::Value NativeAudioSafetyModule::install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker) {
    // Installation directe du module dans le runtime JSI
    return jsi::Value(true);
}

void NativeAudioSafetyModule::handleAudioData(const float* input, float* output,
                                           size_t frameCount, int channels) {
    // Handle audio data callbacks
}

void NativeAudioSafetyModule::handleError(const std::string& error) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    if (jsCallbacks_.errorCallback) {
        invokeJSCallback("errorCallback", [error](jsi::Runtime& rt) {
            jsi::String errorStr = jsi::String::createFromUtf8(rt, error);
        });
    }
}

void NativeAudioSafetyModule::handleStateChange(NythSafetyState oldState,
                                             NythSafetyState newState) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    if (jsCallbacks_.stateChangeCallback) {
        invokeJSCallback("stateChangeCallback", [oldState, newState, this](jsi::Runtime& rt) {
            std::string oldStateStr = stateToString(oldState);
            std::string newStateStr = stateToString(newState);
            jsi::String oldStateJS = jsi::String::createFromUtf8(rt, oldStateStr);
            jsi::String newStateJS = jsi::String::createFromUtf8(rt, newStateStr);
        });
    }
}

// === Fonction d'enregistrement du module ===
std::shared_ptr<TurboModule> NativeAudioSafetyModuleProvider(
    std::shared_ptr<CallInvoker> jsInvoker) {
    return std::make_shared<NativeAudioSafetyModule>(jsInvoker);
}

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_SAFETY_ENABLED
