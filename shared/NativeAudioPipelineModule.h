#pragma once

// Includes conditionnels pour la compatibilité
#if defined(__has_include)
  #if __has_include(<NythJSI.h>)
    #include <NythJSI.h>
  #endif
#endif

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

// Vérification de la disponibilité de TurboModule
#if defined(__has_include) && \
    __has_include(<ReactCommon/TurboModule.h>) && \
    __has_include(<ReactCommon/TurboModuleUtils.h>)
#define NYTH_AUDIO_PIPELINE_ENABLED 1
#else
#define NYTH_AUDIO_PIPELINE_ENABLED 0
#endif

// === API C globale pour le pipeline audio ===
#ifdef __cplusplus
extern "C" {
#endif

// === Types d'erreurs du pipeline ===
typedef enum {
    PIPELINE_ERROR_OK = 0,
    PIPELINE_ERROR_NOT_INITIALIZED = -1,
    PIPELINE_ERROR_ALREADY_RUNNING = -2,
    PIPELINE_ERROR_ALREADY_STOPPED = -3,
    PIPELINE_ERROR_MODULE_ERROR = -4,
    PIPELINE_ERROR_CONFIG_ERROR = -5,
    PIPELINE_ERROR_PROCESSING_FAILED = -6
} NythPipelineError;

// === États du pipeline ===
typedef enum {
    PIPELINE_STATE_UNINITIALIZED = 0,
    PIPELINE_STATE_INITIALIZED,
    PIPELINE_STATE_STARTING,
    PIPELINE_STATE_RUNNING,
    PIPELINE_STATE_PAUSED,
    PIPELINE_STATE_STOPPING,
    PIPELINE_STATE_ERROR
} NythPipelineState;

// === Configuration du pipeline ===
typedef struct {
    // Configuration de capture
    struct {
        int sampleRate;
        int channelCount;
        int bufferSizeFrames;
        int bitsPerSample;
        bool enableEchoCancellation;
        bool enableNoiseSuppression;
        bool enableAutomaticGainControl;
    } captureConfig;

    // Activation des modules
    bool enableEqualizer;
    bool enableNoiseReduction;
    bool enableEffects;
    bool enableSafetyLimiter;
    bool enableFFTAnalysis;

    // Configuration des modules
    float safetyLimiterThreshold; // 0.0-1.0
    float noiseReductionStrength; // 0.0-1.0
    size_t fftSize; // 256, 512, 1024, 2048, 4096

    // Configuration avancée
    bool lowLatencyMode;
    bool highQualityMode;
    int targetLatencyMs;
} NythPipelineConfig;

// === Métriques du pipeline ===
typedef struct {
    float currentLevel;
    float peakLevel;
    bool isClipping;
    float cpuUsage;
    float latencyMs;
    NythPipelineState state;
    bool isRecording;
} NythPipelineMetrics;

// === Informations sur les modules ===
typedef struct {
    bool equalizerActive;
    bool noiseReductionActive;
    bool effectsActive;
    bool safetyLimiterActive;
    bool fftAnalysisActive;
    int activeEffectsCount;
} NythPipelineModuleStatus;

// === Configuration d'effet pour pipeline ===
typedef struct {
    char effectId[64];
    char effectType[32];
    float parameters[16];
    int parameterCount;
    bool enabled;
} NythPipelineEffectConfig;

// === Configuration d'égaliseur ===
typedef struct {
    int band; // 0-9 for 10-band EQ
    float frequency;
    float gain; // dB
    float q; // Quality factor
} NythEqualizerBandConfig;

// === API de gestion du pipeline ===

bool NythPipeline_Initialize(const NythPipelineConfig* config);
bool NythPipeline_IsInitialized(void);
void NythPipeline_Release(void);

// === Contrôle du pipeline ===
bool NythPipeline_Start(void);
bool NythPipeline_Stop(void);
bool NythPipeline_Pause(void);
bool NythPipeline_Resume(void);

// === État et informations ===
NythPipelineState NythPipeline_GetState(void);
const char* NythPipeline_GetErrorString(NythPipelineError error);
void NythPipeline_GetMetrics(NythPipelineMetrics* metrics);
void NythPipeline_GetModuleStatus(NythPipelineModuleStatus* status);

// === Configuration des modules ===

// Equalizer
bool NythPipeline_SetEqualizerEnabled(bool enabled);
bool NythPipeline_SetEqualizerBand(const NythEqualizerBandConfig* band);
bool NythPipeline_LoadEqualizerPreset(const char* presetName);
bool NythPipeline_ResetEqualizer(void);

// Noise Reduction
bool NythPipeline_SetNoiseReductionEnabled(bool enabled);
bool NythPipeline_SetNoiseReductionStrength(float strength);
bool NythPipeline_TrainNoiseProfile(float durationSeconds);

// Effects
bool NythPipeline_SetEffectsEnabled(bool enabled);
bool NythPipeline_AddEffect(const NythPipelineEffectConfig* config);
bool NythPipeline_RemoveEffect(const char* effectId);
bool NythPipeline_SetEffectParameter(const char* effectId, const char* param, float value);
void NythPipeline_RemoveAllEffects(void);

// Safety Limiter
bool NythPipeline_SetSafetyLimiterEnabled(bool enabled);
bool NythPipeline_SetSafetyLimiterThreshold(float threshold);

// FFT Analysis
bool NythPipeline_SetFFTAnalysisEnabled(bool enabled);
bool NythPipeline_SetFFTSize(size_t size);

// === Enregistrement ===
bool NythPipeline_StartRecording(const char* filename);
bool NythPipeline_StopRecording(void);
bool NythPipeline_IsRecording(void);

// === Utilitaires ===
float NythPipeline_GetCurrentLevel(void);
float NythPipeline_GetPeakLevel(void);
bool NythPipeline_IsClipping(void);
float NythPipeline_GetLatencyMs(void);
float NythPipeline_GetCpuUsage(void);

// === Callbacks (pour usage interne) ===
typedef void (*NythPipelineAudioDataCallback)(const float* data, size_t frameCount, int channels);
typedef void (*NythPipelineFFTDataCallback)(const float* magnitudes, size_t binCount, float sampleRate);
typedef void (*NythPipelineMetricsCallback)(const NythPipelineMetrics* metrics);
typedef void (*NythPipelineErrorCallback)(NythPipelineError error, const char* message);
typedef void (*NythPipelineStateChangeCallback)(NythPipelineState oldState, NythPipelineState newState);

void NythPipeline_SetAudioDataCallback(NythPipelineAudioDataCallback callback);
void NythPipeline_SetFFTDataCallback(NythPipelineFFTDataCallback callback);
void NythPipeline_SetMetricsCallback(NythPipelineMetricsCallback callback);
void NythPipeline_SetErrorCallback(NythPipelineErrorCallback callback);
void NythPipeline_SetStateChangeCallback(NythPipelineStateChangeCallback callback);

#ifdef __cplusplus
}
#endif

// === Interface C++ pour TurboModule ===
#if NYTH_AUDIO_PIPELINE_ENABLED && defined(__cplusplus)

// Includes C++ nécessaires pour TurboModule
#include <string>
#include <memory>
#include <functional>
#include <vector>

#include <jsi/jsi.h>
#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModuleUtils.h>
#include "Audio/AudioPipeline.hpp"
#include "NativeAudioEffectsModule.h"
#include <mutex>
#include <atomic>
#include <queue>

namespace facebook {
namespace react {

class JSI_EXPORT NativeAudioPipelineModule : public TurboModule {
public:
    explicit NativeAudioPipelineModule(std::shared_ptr<CallInvoker> jsInvoker)
        : TurboModule("NativeAudioPipelineModule", jsInvoker), jsInvoker_(jsInvoker) {
        currentSampleRate_ = 44100;
        currentChannels_ = 2;
    }
    ~NativeAudioPipelineModule() override;

    // === Méthodes TurboModule ===
    static constexpr auto kModuleName = "NativeAudioPipelineModule";

    // === Méthodes synchrones ===

    // Gestion du cycle de vie
    jsi::Value initialize(jsi::Runtime& rt, const jsi::Object& config);
    jsi::Value isInitialized(jsi::Runtime& rt);
    jsi::Value dispose(jsi::Runtime& rt);

    // Contrôle du pipeline
    jsi::Value start(jsi::Runtime& rt);
    jsi::Value stop(jsi::Runtime& rt);
    jsi::Value pause(jsi::Runtime& rt);
    jsi::Value resume(jsi::Runtime& rt);

    // État et informations
    jsi::Value getState(jsi::Runtime& rt);
    jsi::Value getErrorString(jsi::Runtime& rt, int errorCode);
    jsi::Value getMetrics(jsi::Runtime& rt);
    jsi::Value getModuleStatus(jsi::Runtime& rt);

    // Configuration des modules
    jsi::Value setEqualizerEnabled(jsi::Runtime& rt, bool enabled);
    jsi::Value setEqualizerBand(jsi::Runtime& rt, const jsi::Object& bandConfig);
    jsi::Value loadEqualizerPreset(jsi::Runtime& rt, const jsi::String& presetName);
    jsi::Value resetEqualizer(jsi::Runtime& rt);

    jsi::Value setNoiseReductionEnabled(jsi::Runtime& rt, bool enabled);
    jsi::Value setNoiseReductionStrength(jsi::Runtime& rt, float strength);
    jsi::Value trainNoiseProfile(jsi::Runtime& rt, float durationSeconds);

    jsi::Value setEffectsEnabled(jsi::Runtime& rt, bool enabled);
    jsi::Value addEffect(jsi::Runtime& rt, const jsi::Object& effectConfig);
    jsi::Value removeEffect(jsi::Runtime& rt, const jsi::String& effectId);
    jsi::Value setEffectParameter(jsi::Runtime& rt, const jsi::String& effectId,
                                const jsi::String& param, float value);
    jsi::Value removeAllEffects(jsi::Runtime& rt);

    jsi::Value setSafetyLimiterEnabled(jsi::Runtime& rt, bool enabled);
    jsi::Value setSafetyLimiterThreshold(jsi::Runtime& rt, float threshold);

    jsi::Value setFFTAnalysisEnabled(jsi::Runtime& rt, bool enabled);
    jsi::Value setFFTSize(jsi::Runtime& rt, size_t size);

    // Enregistrement
    jsi::Value startRecording(jsi::Runtime& rt, const jsi::String& filename);
    jsi::Value stopRecording(jsi::Runtime& rt);
    jsi::Value isRecording(jsi::Runtime& rt);

    // Utilitaires
    jsi::Value getCurrentLevel(jsi::Runtime& rt);
    jsi::Value getPeakLevel(jsi::Runtime& rt);
    jsi::Value isClipping(jsi::Runtime& rt);
    jsi::Value getLatencyMs(jsi::Runtime& rt);
    jsi::Value getCpuUsage(jsi::Runtime& rt);

    // === Callbacks JavaScript ===
    jsi::Value setAudioDataCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setFFTDataCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setMetricsCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setStateChangeCallback(jsi::Runtime& rt, const jsi::Function& callback);

    // === Intégration avec NativeAudioCaptureModule ===
    // Ces méthodes sont des placeholders - utiliser NativeAudioCaptureModule directement
    jsi::Value hasCapturePermission(jsi::Runtime& rt);
    jsi::Value requestCapturePermission(jsi::Runtime& rt);
    jsi::Value isCapturing(jsi::Runtime& rt);
    jsi::Value getCaptureLevel(jsi::Runtime& rt);

    // === Installation du module ===
    static jsi::Value install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker);

private:
    // Pipeline audio principal
    std::unique_ptr<Nyth::Audio::AudioPipeline> audioPipeline_;

    // CallInvoker pour l'invocation asynchrone
    std::shared_ptr<CallInvoker> jsInvoker_;
    
    // Runtime JavaScript (stocké lors de l'initialisation)
    jsi::Runtime* runtime_ = nullptr;

    // Mutex pour la thread safety
    mutable std::mutex pipelineMutex_;
    mutable std::mutex callbackMutex_;

    // Callbacks JavaScript
    struct {
        std::shared_ptr<jsi::Function> audioDataCallback;
        std::shared_ptr<jsi::Function> fftDataCallback;
        std::shared_ptr<jsi::Function> metricsCallback;
        std::shared_ptr<jsi::Function> errorCallback;
        std::shared_ptr<jsi::Function> stateChangeCallback;
    } jsCallbacks_;

    // État actuel
    std::atomic<NythPipelineState> currentState_{PIPELINE_STATE_UNINITIALIZED};

    // Configuration actuelle
    NythPipelineConfig currentConfig_;
    
    // Paramètres audio
    uint32_t currentSampleRate_;
    int currentChannels_;

    // Méthodes privées
    NythPipelineError convertError(const std::string& error) const;
    std::string stateToString(NythPipelineState state) const;

    // Conversion JSI <-> Native
    NythPipelineConfig parsePipelineConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    jsi::Object pipelineConfigToJS(jsi::Runtime& rt, const NythPipelineConfig& config) const;
    jsi::Object pipelineMetricsToJS(jsi::Runtime& rt, const NythPipelineMetrics& metrics) const;
    jsi::Object moduleStatusToJS(jsi::Runtime& rt, const NythPipelineModuleStatus& status) const;

    NythEqualizerBandConfig parseEqualizerBandConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    NythPipelineEffectConfig parseEffectConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);

    // Gestion des callbacks
    void handleAudioData(const float* data, size_t frameCount, int channels);
    void handleFFTData(const float* magnitudes, size_t binCount, float sampleRate);
    void handleMetrics(const NythPipelineMetrics& metrics);
    void handleError(NythPipelineError error, const std::string& message);
    void handleStateChange(NythPipelineState oldState, NythPipelineState newState);

    // Invocation de callbacks JS sur le thread principal
    void invokeJSCallback(const std::string& callbackName, std::function<void(jsi::Runtime&)> invocation);
};

// === Fonction d'enregistrement du module ===
JSI_EXPORT std::shared_ptr<TurboModule> NativeAudioPipelineModuleProvider(
    std::shared_ptr<CallInvoker> jsInvoker);

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_PIPELINE_ENABLED && __cplusplus
