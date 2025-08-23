#include "NativeAudioPipelineModule.h"

#if NYTH_AUDIO_PIPELINE_ENABLED

#include "Audio/AudioPipeline.hpp"
#include <chrono>
#include <sstream>
#include <algorithm>
#include <cmath>

// === Instance globale pour l'API C ===
static std::unique_ptr<Nyth::Audio::AudioPipeline> g_audioPipeline;
static std::mutex g_globalMutex;
static NythPipelineState g_currentState = PIPELINE_STATE_UNINITIALIZED;
static NythPipelineConfig g_currentConfig = {};
static NythPipelineMetrics g_currentMetrics = {0};
static NythPipelineModuleStatus g_currentModuleStatus = {0};

// Note: Le pipeline utilise maintenant NativeAudioCaptureModule pour la capture
// au lieu d'implémenter sa propre logique. Cela évite la duplication.

// === Implémentation de l'API C ===

extern "C" {

// === Gestion du cycle de vie ===
bool NythPipeline_Initialize(const NythPipelineConfig* config) {
    if (!config) return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);

    try {
        g_currentConfig = *config;
        g_audioPipeline = std::make_unique<Nyth::Audio::AudioPipeline>();

        // Utiliser NativeAudioCaptureModule pour la capture au lieu d'implémenter sa propre logique
        // Le pipeline se contentera de coordonner les modules, pas de gérer la capture directement

        // Configure modules
        g_audioPipeline->setEqualizerEnabled(config->enableEqualizer);
        g_audioPipeline->setNoiseReductionEnabled(config->enableNoiseReduction);
        g_audioPipeline->setEffectsEnabled(config->enableEffects);
        g_audioPipeline->setSafetyLimiterEnabled(config->enableSafetyLimiter);
        g_audioPipeline->setFFTAnalysisEnabled(config->enableFFTAnalysis);

        // Configure safety limiter
        g_audioPipeline->setSafetyLimiterThreshold(config->safetyLimiterThreshold);

        // Configure FFT
        if (config->enableFFTAnalysis) {
            g_audioPipeline->setFFTSize(config->fftSize);
        }

        g_currentState = PIPELINE_STATE_INITIALIZED;
        return true;
    } catch (...) {
        g_currentState = PIPELINE_STATE_ERROR;
        return false;
    }
}

bool NythPipeline_IsInitialized(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_currentState == PIPELINE_STATE_INITIALIZED ||
           g_currentState == PIPELINE_STATE_STARTING ||
           g_currentState == PIPELINE_STATE_RUNNING ||
           g_currentState == PIPELINE_STATE_PAUSED;
}

void NythPipeline_Release(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    g_audioPipeline.reset();
    g_currentState = PIPELINE_STATE_UNINITIALIZED;
}

// === Contrôle du pipeline ===
bool NythPipeline_Start(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (g_currentState == PIPELINE_STATE_INITIALIZED) {
        g_currentState = PIPELINE_STATE_STARTING;

        // Le pipeline coordonne maintenant les modules, mais la capture est gérée par NativeAudioCaptureModule
        // Ici on pourrait démarrer les effets, l'égaliseur, etc. selon la configuration

        g_currentState = PIPELINE_STATE_RUNNING;
        return true;
    }
    return false;
}

bool NythPipeline_Stop(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (g_currentState == PIPELINE_STATE_RUNNING || g_currentState == PIPELINE_STATE_PAUSED) {
        g_currentState = PIPELINE_STATE_STOPPING;

        // Arrêter les effets, l'égaliseur, etc.
        // La capture sera arrêtée via NativeAudioCaptureModule

        g_currentState = PIPELINE_STATE_INITIALIZED;
        return true;
    }
    return false;
}

bool NythPipeline_Pause(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (g_currentState == PIPELINE_STATE_RUNNING) {
        g_currentState = PIPELINE_STATE_PAUSED;

        // Mettre en pause les effets, l'égaliseur, etc.
        // La capture sera mise en pause via NativeAudioCaptureModule

        return true;
    }
    return false;
}

bool NythPipeline_Resume(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (g_currentState == PIPELINE_STATE_PAUSED) {
        g_currentState = PIPELINE_STATE_RUNNING;

        // Reprendre les effets, l'égaliseur, etc.
        // La capture sera reprise via NativeAudioCaptureModule

        return true;
    }
    return false;
}

// === État et informations ===
NythPipelineState NythPipeline_GetState(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_currentState;
}

const char* NythPipeline_GetErrorString(NythPipelineError error) {
    switch (error) {
        case PIPELINE_ERROR_OK: return "OK";
        case PIPELINE_ERROR_NOT_INITIALIZED: return "Not initialized";
        case PIPELINE_ERROR_ALREADY_RUNNING: return "Already running";
        case PIPELINE_ERROR_ALREADY_STOPPED: return "Already stopped";
        case PIPELINE_ERROR_MODULE_ERROR: return "Module error";
        case PIPELINE_ERROR_CONFIG_ERROR: return "Config error";
        case PIPELINE_ERROR_PROCESSING_FAILED: return "Processing failed";
        default: return "Unknown error";
    }
}

void NythPipeline_GetMetrics(NythPipelineMetrics* metrics) {
    if (!metrics) return;

    std::lock_guard<std::mutex> lock(g_globalMutex);
    *metrics = g_currentMetrics;

    // Update with current values
    metrics->state = g_currentState;
    metrics->isRecording = false; // Not implemented in this version
    metrics->cpuUsage = 15.5f; // Simulated
    metrics->latencyMs = 5.2f; // Simulated
}

void NythPipeline_GetModuleStatus(NythPipelineModuleStatus* status) {
    if (!status) return;

    std::lock_guard<std::mutex> lock(g_globalMutex);
    *status = g_currentModuleStatus;

    // Update with current config
    status->equalizerActive = g_currentConfig.enableEqualizer;
    status->noiseReductionActive = g_currentConfig.enableNoiseReduction;
    status->effectsActive = g_currentConfig.enableEffects;
    status->safetyLimiterActive = g_currentConfig.enableSafetyLimiter;
    status->fftAnalysisActive = g_currentConfig.enableFFTAnalysis;
    status->activeEffectsCount = 0; // Not implemented in this version
}

// === Configuration des modules ===

// Equalizer
bool NythPipeline_SetEqualizerEnabled(bool enabled) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (g_currentState == PIPELINE_STATE_UNINITIALIZED) return false;

    if (g_audioPipeline) {
        g_audioPipeline->setEqualizerEnabled(enabled);
        g_currentConfig.enableEqualizer = enabled;
        return true;
    }
    return false;
}

bool NythPipeline_SetEqualizerBand(const NythEqualizerBandConfig* band) {
    if (!band) return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (!g_audioPipeline) return false;

    try {
        // Note: AudioPipeline may not have direct band access
        // This would need to be implemented based on the actual AudioPipeline interface
        return true;
    } catch (...) {
        return false;
    }
}

bool NythPipeline_LoadEqualizerPreset(const char* presetName) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (!g_audioPipeline) return false;

    try {
        std::string preset(presetName);
        // Implement preset loading logic here
        return true;
    } catch (...) {
        return false;
    }
}

bool NythPipeline_ResetEqualizer(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (!g_audioPipeline) return false;

    try {
        // Implement equalizer reset logic here
        return true;
    } catch (...) {
        return false;
    }
}

// Noise Reduction
bool NythPipeline_SetNoiseReductionEnabled(bool enabled) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (g_currentState == PIPELINE_STATE_UNINITIALIZED) return false;

    if (g_audioPipeline) {
        g_audioPipeline->setNoiseReductionEnabled(enabled);
        g_currentConfig.enableNoiseReduction = enabled;
        return true;
    }
    return false;
}

bool NythPipeline_SetNoiseReductionStrength(float strength) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (g_currentState == PIPELINE_STATE_UNINITIALIZED) return false;

    g_currentConfig.noiseReductionStrength = strength;
    return true;
}

bool NythPipeline_TrainNoiseProfile(float durationSeconds) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (!g_audioPipeline) return false;

    try {
        // Implement noise profile training logic here
        return true;
    } catch (...) {
        return false;
    }
}

// Effects
bool NythPipeline_SetEffectsEnabled(bool enabled) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (g_currentState == PIPELINE_STATE_UNINITIALIZED) return false;

    if (g_audioPipeline) {
        g_audioPipeline->setEffectsEnabled(enabled);
        g_currentConfig.enableEffects = enabled;
        return true;
    }
    return false;
}

bool NythPipeline_AddEffect(const NythPipelineEffectConfig* config) {
    if (!config) return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (!g_audioPipeline) return false;

    try {
        // Implement effect addition logic here
        return true;
    } catch (...) {
        return false;
    }
}

bool NythPipeline_RemoveEffect(const char* effectId) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (!g_audioPipeline) return false;

    try {
        std::string id(effectId);
        // Implement effect removal logic here
        return true;
    } catch (...) {
        return false;
    }
}

bool NythPipeline_SetEffectParameter(const char* effectId, const char* param, float value) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (!g_audioPipeline) return false;

    try {
        std::string id(effectId);
        std::string parameter(param);
        // Implement effect parameter setting logic here
        return true;
    } catch (...) {
        return false;
    }
}

void NythPipeline_RemoveAllEffects(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (g_audioPipeline) {
        // Implement remove all effects logic here
    }
}

// Safety Limiter
bool NythPipeline_SetSafetyLimiterEnabled(bool enabled) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (g_currentState == PIPELINE_STATE_UNINITIALIZED) return false;

    if (g_audioPipeline) {
        g_audioPipeline->setSafetyLimiterEnabled(enabled);
        g_currentConfig.enableSafetyLimiter = enabled;
        return true;
    }
    return false;
}

bool NythPipeline_SetSafetyLimiterThreshold(float threshold) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (g_currentState == PIPELINE_STATE_UNINITIALIZED) return false;

    if (g_audioPipeline) {
        g_audioPipeline->setSafetyLimiterThreshold(threshold);
        g_currentConfig.safetyLimiterThreshold = threshold;
        return true;
    }
    return false;
}

// FFT Analysis
bool NythPipeline_SetFFTAnalysisEnabled(bool enabled) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (g_currentState == PIPELINE_STATE_UNINITIALIZED) return false;

    if (g_audioPipeline) {
        g_audioPipeline->setFFTAnalysisEnabled(enabled);
        g_currentConfig.enableFFTAnalysis = enabled;
        return true;
    }
    return false;
}

bool NythPipeline_SetFFTSize(size_t size) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (g_currentState == PIPELINE_STATE_UNINITIALIZED) return false;

    if (g_audioPipeline) {
        g_audioPipeline->setFFTSize(size);
        g_currentConfig.fftSize = size;
        return true;
    }
    return false;
}

// === Enregistrement ===
bool NythPipeline_StartRecording(const char* filename) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (!g_audioPipeline) return false;

    try {
        std::string file(filename);
        // Implement recording start logic here
        g_currentMetrics.isRecording = true;
        return true;
    } catch (...) {
        return false;
    }
}

bool NythPipeline_StopRecording(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (!g_audioPipeline) return false;

    try {
        // Implement recording stop logic here
        g_currentMetrics.isRecording = false;
        return true;
    } catch (...) {
        return false;
    }
}

bool NythPipeline_IsRecording(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_currentMetrics.isRecording;
}

// === Utilitaires ===
float NythPipeline_GetCurrentLevel(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_currentMetrics.currentLevel;
}

float NythPipeline_GetPeakLevel(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_currentMetrics.peakLevel;
}

bool NythPipeline_IsClipping(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_currentMetrics.isClipping;
}

float NythPipeline_GetLatencyMs(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_currentMetrics.latencyMs;
}

float NythPipeline_GetCpuUsage(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_currentMetrics.cpuUsage;
}

// === Callbacks (pour usage interne) ===
void NythPipeline_SetAudioDataCallback(NythPipelineAudioDataCallback callback) {
    // Not implemented in this version
}

void NythPipeline_SetFFTDataCallback(NythPipelineFFTDataCallback callback) {
    // Not implemented in this version
}

void NythPipeline_SetMetricsCallback(NythPipelineMetricsCallback callback) {
    // Not implemented in this version
}

void NythPipeline_SetErrorCallback(NythPipelineErrorCallback callback) {
    // Not implemented in this version
}

void NythPipeline_SetStateChangeCallback(NythPipelineStateChangeCallback callback) {
    // Not implemented in this version
}

// === Intégration avec NativeAudioCaptureModule ===

// Ces fonctions permettent au pipeline d'utiliser NativeAudioCaptureModule
// pour éviter la duplication de code

bool NythPipeline_HasCapturePermission(void) {
    // Cette fonction devrait appeler NythCapture_HasPermission()
    // mais comme on est dans un contexte C++, on ne peut pas l'appeler directement
    // Le JavaScript devra gérer les permissions via NativeAudioCaptureModule
    return true; // Placeholder
}

bool NythPipeline_RequestCapturePermission(void) {
    // Cette fonction devrait appeler NythCapture_RequestPermission()
    // mais comme on est dans un contexte C++, on ne peut pas l'appeler directement
    // Le JavaScript devra gérer les permissions via NativeAudioCaptureModule
    return true; // Placeholder
}

bool NythPipeline_IsCapturing(void) {
    // Cette fonction devrait vérifier l'état de NativeAudioCaptureModule
    // mais comme on est dans un contexte C++, on ne peut pas l'appeler directement
    // Le JavaScript devra vérifier l'état via NativeAudioCaptureModule
    return false; // Placeholder - le pipeline ne gère plus directement la capture
}

float NythPipeline_GetCaptureLevel(void) {
    // Cette fonction devrait appeler NythCapture_GetCurrentLevel()
    // mais comme on est dans un contexte C++, on ne peut pas l'appeler directement
    // Le JavaScript devra obtenir le niveau via NativeAudioCaptureModule
    return 0.0f; // Placeholder
}

} // extern "C"

// === Implémentation C++ pour TurboModule ===

namespace facebook {
namespace react {



NativeAudioPipelineModule::~NativeAudioPipelineModule() {
    std::lock_guard<std::mutex> lock(pipelineMutex_);
    if (audioPipeline_) {
        audioPipeline_.reset();
    }
}

// === Méthodes privées ===

NythPipelineError NativeAudioPipelineModule::convertError(const std::string& error) const {
    if (error == "not_initialized") return PIPELINE_ERROR_NOT_INITIALIZED;
    if (error == "already_running") return PIPELINE_ERROR_ALREADY_RUNNING;
    if (error == "already_stopped") return PIPELINE_ERROR_ALREADY_STOPPED;
    if (error == "config_error") return PIPELINE_ERROR_CONFIG_ERROR;
    if (error == "processing_failed") return PIPELINE_ERROR_PROCESSING_FAILED;
    if (error == "module_error") return PIPELINE_ERROR_MODULE_ERROR;
    return PIPELINE_ERROR_MODULE_ERROR;
}

std::string NativeAudioPipelineModule::stateToString(NythPipelineState state) const {
    switch (state) {
        case PIPELINE_STATE_UNINITIALIZED: return "uninitialized";
        case PIPELINE_STATE_INITIALIZED: return "initialized";
        case PIPELINE_STATE_STARTING: return "starting";
        case PIPELINE_STATE_RUNNING: return "running";
        case PIPELINE_STATE_PAUSED: return "paused";
        case PIPELINE_STATE_STOPPING: return "stopping";
        case PIPELINE_STATE_ERROR: return "error";
        default: return "unknown";
    }
}

// === Conversion JSI <-> Native ===

NythPipelineConfig NativeAudioPipelineModule::parsePipelineConfig(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    NythPipelineConfig config = {};

    // Capture config
    if (jsConfig.hasProperty(rt, "captureConfig")) {
        jsi::Object captureObj = jsConfig.getProperty(rt, "captureConfig").asObject(rt);

        if (captureObj.hasProperty(rt, "sampleRate")) {
            config.captureConfig.sampleRate = static_cast<int>(captureObj.getProperty(rt, "sampleRate").asNumber());
        }
        if (captureObj.hasProperty(rt, "channelCount")) {
            config.captureConfig.channelCount = static_cast<int>(captureObj.getProperty(rt, "channelCount").asNumber());
        }
        if (captureObj.hasProperty(rt, "bufferSizeFrames")) {
            config.captureConfig.bufferSizeFrames = static_cast<int>(captureObj.getProperty(rt, "bufferSizeFrames").asNumber());
        }
        if (captureObj.hasProperty(rt, "bitsPerSample")) {
            config.captureConfig.bitsPerSample = static_cast<int>(captureObj.getProperty(rt, "bitsPerSample").asNumber());
        }
        if (captureObj.hasProperty(rt, "enableEchoCancellation")) {
            config.captureConfig.enableEchoCancellation = captureObj.getProperty(rt, "enableEchoCancellation").asBool();
        }
        if (captureObj.hasProperty(rt, "enableNoiseSuppression")) {
            config.captureConfig.enableNoiseSuppression = captureObj.getProperty(rt, "enableNoiseSuppression").asBool();
        }
        if (captureObj.hasProperty(rt, "enableAutomaticGainControl")) {
            config.captureConfig.enableAutomaticGainControl = captureObj.getProperty(rt, "enableAutomaticGainControl").asBool();
        }
    }

    // Module activation
    if (jsConfig.hasProperty(rt, "enableEqualizer")) {
        config.enableEqualizer = jsConfig.getProperty(rt, "enableEqualizer").asBool();
    }
    if (jsConfig.hasProperty(rt, "enableNoiseReduction")) {
        config.enableNoiseReduction = jsConfig.getProperty(rt, "enableNoiseReduction").asBool();
    }
    if (jsConfig.hasProperty(rt, "enableEffects")) {
        config.enableEffects = jsConfig.getProperty(rt, "enableEffects").asBool();
    }
    if (jsConfig.hasProperty(rt, "enableSafetyLimiter")) {
        config.enableSafetyLimiter = jsConfig.getProperty(rt, "enableSafetyLimiter").asBool();
    }
    if (jsConfig.hasProperty(rt, "enableFFTAnalysis")) {
        config.enableFFTAnalysis = jsConfig.getProperty(rt, "enableFFTAnalysis").asBool();
    }

    // Advanced config
    if (jsConfig.hasProperty(rt, "safetyLimiterThreshold")) {
        config.safetyLimiterThreshold = static_cast<float>(jsConfig.getProperty(rt, "safetyLimiterThreshold").asNumber());
    }
    if (jsConfig.hasProperty(rt, "noiseReductionStrength")) {
        config.noiseReductionStrength = static_cast<float>(jsConfig.getProperty(rt, "noiseReductionStrength").asNumber());
    }
    if (jsConfig.hasProperty(rt, "fftSize")) {
        config.fftSize = static_cast<size_t>(jsConfig.getProperty(rt, "fftSize").asNumber());
    }
    if (jsConfig.hasProperty(rt, "lowLatencyMode")) {
        config.lowLatencyMode = jsConfig.getProperty(rt, "lowLatencyMode").asBool();
    }
    if (jsConfig.hasProperty(rt, "highQualityMode")) {
        config.highQualityMode = jsConfig.getProperty(rt, "highQualityMode").asBool();
    }
    if (jsConfig.hasProperty(rt, "targetLatencyMs")) {
        config.targetLatencyMs = static_cast<int>(jsConfig.getProperty(rt, "targetLatencyMs").asNumber());
    }

    return config;
}

jsi::Object NativeAudioPipelineModule::pipelineConfigToJS(jsi::Runtime& rt, const NythPipelineConfig& config) const {
    jsi::Object jsConfig(rt);

    // Capture config
    jsi::Object captureObj(rt);
    captureObj.setProperty(rt, "sampleRate", jsi::Value(config.captureConfig.sampleRate));
    captureObj.setProperty(rt, "channelCount", jsi::Value(config.captureConfig.channelCount));
    captureObj.setProperty(rt, "bufferSizeFrames", jsi::Value(config.captureConfig.bufferSizeFrames));
    captureObj.setProperty(rt, "bitsPerSample", jsi::Value(config.captureConfig.bitsPerSample));
    captureObj.setProperty(rt, "enableEchoCancellation", jsi::Value(config.captureConfig.enableEchoCancellation));
    captureObj.setProperty(rt, "enableNoiseSuppression", jsi::Value(config.captureConfig.enableNoiseSuppression));
    captureObj.setProperty(rt, "enableAutomaticGainControl", jsi::Value(config.captureConfig.enableAutomaticGainControl));
    jsConfig.setProperty(rt, "captureConfig", std::move(captureObj));

    // Module activation
    jsConfig.setProperty(rt, "enableEqualizer", jsi::Value(config.enableEqualizer));
    jsConfig.setProperty(rt, "enableNoiseReduction", jsi::Value(config.enableNoiseReduction));
    jsConfig.setProperty(rt, "enableEffects", jsi::Value(config.enableEffects));
    jsConfig.setProperty(rt, "enableSafetyLimiter", jsi::Value(config.enableSafetyLimiter));
    jsConfig.setProperty(rt, "enableFFTAnalysis", jsi::Value(config.enableFFTAnalysis));

    // Advanced config
    jsConfig.setProperty(rt, "safetyLimiterThreshold", jsi::Value(config.safetyLimiterThreshold));
    jsConfig.setProperty(rt, "noiseReductionStrength", jsi::Value(config.noiseReductionStrength));
    jsConfig.setProperty(rt, "fftSize", jsi::Value(static_cast<int>(config.fftSize)));
    jsConfig.setProperty(rt, "lowLatencyMode", jsi::Value(config.lowLatencyMode));
    jsConfig.setProperty(rt, "highQualityMode", jsi::Value(config.highQualityMode));
    jsConfig.setProperty(rt, "targetLatencyMs", jsi::Value(config.targetLatencyMs));

    return jsConfig;
}

jsi::Object NativeAudioPipelineModule::pipelineMetricsToJS(jsi::Runtime& rt, const NythPipelineMetrics& metrics) const {
    jsi::Object jsMetrics(rt);
    jsMetrics.setProperty(rt, "currentLevel", jsi::Value(metrics.currentLevel));
    jsMetrics.setProperty(rt, "peakLevel", jsi::Value(metrics.peakLevel));
    jsMetrics.setProperty(rt, "isClipping", jsi::Value(metrics.isClipping));
    jsMetrics.setProperty(rt, "cpuUsage", jsi::Value(metrics.cpuUsage));
    jsMetrics.setProperty(rt, "latencyMs", jsi::Value(metrics.latencyMs));
    jsMetrics.setProperty(rt, "state", jsi::String::createFromUtf8(rt, stateToString(metrics.state)));
    jsMetrics.setProperty(rt, "isRecording", jsi::Value(metrics.isRecording));
    return jsMetrics;
}

jsi::Object NativeAudioPipelineModule::moduleStatusToJS(jsi::Runtime& rt, const NythPipelineModuleStatus& status) const {
    jsi::Object jsStatus(rt);
    jsStatus.setProperty(rt, "equalizerActive", jsi::Value(status.equalizerActive));
    jsStatus.setProperty(rt, "noiseReductionActive", jsi::Value(status.noiseReductionActive));
    jsStatus.setProperty(rt, "effectsActive", jsi::Value(status.effectsActive));
    jsStatus.setProperty(rt, "safetyLimiterActive", jsi::Value(status.safetyLimiterActive));
    jsStatus.setProperty(rt, "fftAnalysisActive", jsi::Value(status.fftAnalysisActive));
    jsStatus.setProperty(rt, "activeEffectsCount", jsi::Value(status.activeEffectsCount));
    return jsStatus;
}

NythEqualizerBandConfig NativeAudioPipelineModule::parseEqualizerBandConfig(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    NythEqualizerBandConfig config = {};
    config.band = 0;
    config.frequency = 1000.0;
    config.gain = 0.0;
    config.q = 1.0;

    if (jsConfig.hasProperty(rt, "band")) {
        config.band = static_cast<int>(jsConfig.getProperty(rt, "band").asNumber());
    }
    if (jsConfig.hasProperty(rt, "frequency")) {
        config.frequency = static_cast<float>(jsConfig.getProperty(rt, "frequency").asNumber());
    }
    if (jsConfig.hasProperty(rt, "gain")) {
        config.gain = static_cast<float>(jsConfig.getProperty(rt, "gain").asNumber());
    }
    if (jsConfig.hasProperty(rt, "q")) {
        config.q = static_cast<float>(jsConfig.getProperty(rt, "q").asNumber());
    }

    return config;
}

NythPipelineEffectConfig NativeAudioPipelineModule::parseEffectConfig(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    NythPipelineEffectConfig config = {};

    if (jsConfig.hasProperty(rt, "effectType")) {
        std::string typeStr = jsConfig.getProperty(rt, "effectType").asString(rt).utf8(rt);
        strncpy(config.effectType, typeStr.c_str(), sizeof(config.effectType) - 1);
        config.effectType[sizeof(config.effectType) - 1] = '\0';
    }
    if (jsConfig.hasProperty(rt, "effectId")) {
        std::string idStr = jsConfig.getProperty(rt, "effectId").asString(rt).utf8(rt);
        strncpy(config.effectId, idStr.c_str(), sizeof(config.effectId) - 1);
        config.effectId[sizeof(config.effectId) - 1] = '\0';
    }
    if (jsConfig.hasProperty(rt, "parameters")) {
        // Pour les paramètres, on suppose que c'est un tableau de nombres
        auto paramsValue = jsConfig.getProperty(rt, "parameters");
        if (paramsValue.isObject()) {
            auto paramsObj = paramsValue.asObject(rt);
            if (paramsObj.isArray(rt)) {
                auto paramsArray = paramsObj.asArray(rt);
                size_t paramCount = std::min(paramsArray.length(rt), static_cast<size_t>(16));
                config.parameterCount = static_cast<int>(paramCount);
                
                for (size_t i = 0; i < paramCount; ++i) {
                    config.parameters[i] = static_cast<float>(paramsArray.getValueAtIndex(rt, i).asNumber());
                }
            }
        }
    }

    return config;
}

// === Gestion des callbacks ===

void NativeAudioPipelineModule::invokeJSCallback(const std::string& callbackName,
                                               std::function<void(jsi::Runtime&)> invocation) {
    // Pour l'instant, implémentation basique
    try {
        // TODO: Implémenter l'invocation sur le thread principal
        // Note: Cette ligne est temporaire et sera remplacée par une vraie invocation
        // invocation(*reinterpret_cast<jsi::Runtime*>(nullptr));
    } catch (...) {
        // Gérer les erreurs d'invocation
    }
}

// === Méthodes publiques ===

// Gestion du cycle de vie
jsi::Value NativeAudioPipelineModule::initialize(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);

    try {
        auto nativeConfig = parsePipelineConfig(rt, config);
        bool success = NythPipeline_Initialize(&nativeConfig);

        if (success) {
            currentConfig_ = nativeConfig;
            return jsi::Value(true);
        }
    } catch (const std::exception& e) {
        handleError(convertError("config_error"), std::string("Initialization failed: ") + e.what());
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioPipelineModule::isInitialized(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);
    return jsi::Value(NythPipeline_IsInitialized());
}

jsi::Value NativeAudioPipelineModule::dispose(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);

    NythPipeline_Release();
    currentState_ = PIPELINE_STATE_UNINITIALIZED;

    return jsi::Value(true);
}

// Contrôle du pipeline
jsi::Value NativeAudioPipelineModule::start(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);

    if (NythPipeline_Start()) {
        currentState_ = PIPELINE_STATE_RUNNING;
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioPipelineModule::stop(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);

    if (NythPipeline_Stop()) {
        currentState_ = PIPELINE_STATE_INITIALIZED;
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioPipelineModule::pause(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);

    if (NythPipeline_Pause()) {
        currentState_ = PIPELINE_STATE_PAUSED;
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioPipelineModule::resume(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);

    if (NythPipeline_Resume()) {
        currentState_ = PIPELINE_STATE_RUNNING;
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

// État et informations
jsi::Value NativeAudioPipelineModule::getState(jsi::Runtime& rt) {
    return jsi::String::createFromUtf8(rt, stateToString(currentState_.load()));
}

jsi::Value NativeAudioPipelineModule::getErrorString(jsi::Runtime& rt, int errorCode) {
    NythPipelineError error = static_cast<NythPipelineError>(errorCode);
    return jsi::String::createFromUtf8(rt, NythPipeline_GetErrorString(error));
}

jsi::Value NativeAudioPipelineModule::getMetrics(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);

    NythPipeline_GetMetrics(&g_currentMetrics);
    return pipelineMetricsToJS(rt, g_currentMetrics);
}

jsi::Value NativeAudioPipelineModule::getModuleStatus(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);

    NythPipeline_GetModuleStatus(&g_currentModuleStatus);
    return moduleStatusToJS(rt, g_currentModuleStatus);
}

// Configuration des modules - Equalizer
jsi::Value NativeAudioPipelineModule::setEqualizerEnabled(jsi::Runtime& rt, bool enabled) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);

    if (NythPipeline_SetEqualizerEnabled(enabled)) {
        currentConfig_.enableEqualizer = enabled;
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioPipelineModule::setEqualizerBand(jsi::Runtime& rt, const jsi::Object& bandConfig) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);

    try {
        auto config = parseEqualizerBandConfig(rt, bandConfig);
        if (NythPipeline_SetEqualizerBand(&config)) {
            return jsi::Value(true);
        }
    } catch (...) {
        // Free allocated strings if needed
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioPipelineModule::loadEqualizerPreset(jsi::Runtime& rt, const jsi::String& presetName) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);

    std::string preset = presetName.utf8(rt);
    if (NythPipeline_LoadEqualizerPreset(preset.c_str())) {
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioPipelineModule::resetEqualizer(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);

    if (NythPipeline_ResetEqualizer()) {
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

// Configuration des modules - Noise Reduction
jsi::Value NativeAudioPipelineModule::setNoiseReductionEnabled(jsi::Runtime& rt, bool enabled) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);

    if (NythPipeline_SetNoiseReductionEnabled(enabled)) {
        currentConfig_.enableNoiseReduction = enabled;
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioPipelineModule::setNoiseReductionStrength(jsi::Runtime& rt, float strength) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);

    if (NythPipeline_SetNoiseReductionStrength(strength)) {
        currentConfig_.noiseReductionStrength = strength;
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioPipelineModule::trainNoiseProfile(jsi::Runtime& rt, float durationSeconds) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);

    if (NythPipeline_TrainNoiseProfile(durationSeconds)) {
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

// Configuration des modules - Effects
jsi::Value NativeAudioPipelineModule::setEffectsEnabled(jsi::Runtime& rt, bool enabled) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);

    if (NythPipeline_SetEffectsEnabled(enabled)) {
        currentConfig_.enableEffects = enabled;
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioPipelineModule::addEffect(jsi::Runtime& rt, const jsi::Object& effectConfig) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);

    try {
        auto config = parseEffectConfig(rt, effectConfig);
        if (NythPipeline_AddEffect(&config)) {
            // No need to free strings since they are now arrays, not pointers
            return jsi::Value(true);
        }
    } catch (...) {
        // Free allocated strings if needed
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioPipelineModule::removeEffect(jsi::Runtime& rt, const jsi::String& effectId) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);

    std::string id = effectId.utf8(rt);
    if (NythPipeline_RemoveEffect(id.c_str())) {
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioPipelineModule::setEffectParameter(jsi::Runtime& rt, const jsi::String& effectId,
                                                       const jsi::String& param, float value) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);

    std::string id = effectId.utf8(rt);
    std::string parameter = param.utf8(rt);
    if (NythPipeline_SetEffectParameter(id.c_str(), parameter.c_str(), value)) {
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioPipelineModule::removeAllEffects(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);

    NythPipeline_RemoveAllEffects();
    return jsi::Value(true);
}

// Configuration des modules - Safety Limiter
jsi::Value NativeAudioPipelineModule::setSafetyLimiterEnabled(jsi::Runtime& rt, bool enabled) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);

    if (NythPipeline_SetSafetyLimiterEnabled(enabled)) {
        currentConfig_.enableSafetyLimiter = enabled;
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioPipelineModule::setSafetyLimiterThreshold(jsi::Runtime& rt, float threshold) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);

    if (NythPipeline_SetSafetyLimiterThreshold(threshold)) {
        currentConfig_.safetyLimiterThreshold = threshold;
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

// Configuration des modules - FFT Analysis
jsi::Value NativeAudioPipelineModule::setFFTAnalysisEnabled(jsi::Runtime& rt, bool enabled) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);

    if (NythPipeline_SetFFTAnalysisEnabled(enabled)) {
        currentConfig_.enableFFTAnalysis = enabled;
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioPipelineModule::setFFTSize(jsi::Runtime& rt, size_t size) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);

    if (NythPipeline_SetFFTSize(size)) {
        currentConfig_.fftSize = size;
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

// Enregistrement
jsi::Value NativeAudioPipelineModule::startRecording(jsi::Runtime& rt, const jsi::String& filename) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);

    std::string file = filename.utf8(rt);
    if (NythPipeline_StartRecording(file.c_str())) {
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioPipelineModule::stopRecording(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);

    if (NythPipeline_StopRecording()) {
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioPipelineModule::isRecording(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);
    return jsi::Value(NythPipeline_IsRecording());
}

// Utilitaires
jsi::Value NativeAudioPipelineModule::getCurrentLevel(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);
    return jsi::Value(NythPipeline_GetCurrentLevel());
}

jsi::Value NativeAudioPipelineModule::getPeakLevel(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);
    return jsi::Value(NythPipeline_GetPeakLevel());
}

jsi::Value NativeAudioPipelineModule::isClipping(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);
    return jsi::Value(NythPipeline_IsClipping());
}

jsi::Value NativeAudioPipelineModule::getLatencyMs(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);
    return jsi::Value(NythPipeline_GetLatencyMs());
}

jsi::Value NativeAudioPipelineModule::getCpuUsage(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(pipelineMutex_);
    return jsi::Value(NythPipeline_GetCpuUsage());
}

// === Callbacks JavaScript ===

jsi::Value NativeAudioPipelineModule::setAudioDataCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    jsCallbacks_.audioDataCallback = std::make_shared<jsi::Function>(
        jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forUtf8(rt, "audioDataCallback"),
        0, [](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {
            return jsi::Value::undefined();
        }));
    return jsi::Value(true);
}

jsi::Value NativeAudioPipelineModule::setFFTDataCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    jsCallbacks_.fftDataCallback = std::make_shared<jsi::Function>(
        jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forUtf8(rt, "fftDataCallback"),
        0, [](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {
            return jsi::Value::undefined();
        }));
    return jsi::Value(true);
}

jsi::Value NativeAudioPipelineModule::setMetricsCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    jsCallbacks_.metricsCallback = std::make_shared<jsi::Function>(
        jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forUtf8(rt, "metricsCallback"),
        0, [](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {
            return jsi::Value::undefined();
        }));
    return jsi::Value(true);
}

jsi::Value NativeAudioPipelineModule::setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    jsCallbacks_.errorCallback = std::make_shared<jsi::Function>(
        jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forUtf8(rt, "errorCallback"),
        0, [](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {
            return jsi::Value::undefined();
        }));
    return jsi::Value(true);
}

jsi::Value NativeAudioPipelineModule::setStateChangeCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    jsCallbacks_.stateChangeCallback = std::make_shared<jsi::Function>(
        jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forUtf8(rt, "stateChangeCallback"),
        0, [](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {
            return jsi::Value::undefined();
        }));
    return jsi::Value(true);
}

// === Intégration avec NativeAudioCaptureModule ===

// Ces méthodes sont maintenant des placeholders car le pipeline ne gère plus
// directement la capture - il utilise NativeAudioCaptureModule

jsi::Value NativeAudioPipelineModule::hasCapturePermission(jsi::Runtime& rt) {
    // Le JavaScript devrait utiliser NativeAudioCaptureModule.hasPermission() directement
    return jsi::Value(true);
}

jsi::Value NativeAudioPipelineModule::requestCapturePermission(jsi::Runtime& rt) {
    // Le JavaScript devrait utiliser NativeAudioCaptureModule.requestPermission() directement
    return jsi::Value(true);
}

jsi::Value NativeAudioPipelineModule::isCapturing(jsi::Runtime& rt) {
    // Le JavaScript devrait utiliser NativeAudioCaptureModule.isCapturing() directement
    return jsi::Value(false);
}

jsi::Value NativeAudioPipelineModule::getCaptureLevel(jsi::Runtime& rt) {
    // Le JavaScript devrait utiliser NativeAudioCaptureModule.getCurrentLevel() directement
    return jsi::Value(0.0);
}

// === Installation du module ===
jsi::Value NativeAudioPipelineModule::install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker) {
    // Installation directe du module dans le runtime JSI
    return jsi::Value(true);
}

// === Fonction d'enregistrement du module ===
std::shared_ptr<TurboModule> NativeAudioPipelineModuleProvider(
    std::shared_ptr<CallInvoker> jsInvoker) {
    return std::make_shared<NativeAudioPipelineModule>(jsInvoker);
}

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_PIPELINE_ENABLED
