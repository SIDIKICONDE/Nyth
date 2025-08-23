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
#include <string>
#include <memory>
#include <functional>
#include <vector>

// Vérification de la disponibilité de TurboModule
#if defined(__has_include) && \
    __has_include(<ReactCommon/TurboModule.h>) && \
    __has_include(<ReactCommon/TurboModuleUtils.h>)
#define NYTH_AUDIO_SAFETY_ENABLED 1
#else
#define NYTH_AUDIO_SAFETY_ENABLED 0
#endif

// === API C globale pour la sécurité audio ===
#ifdef __cplusplus
extern "C" {
#endif

// === Codes d'erreur de sécurité ===
typedef enum {
    SAFETY_ERROR_OK = 0,
    SAFETY_ERROR_NULL_BUFFER = -1,
    SAFETY_ERROR_INVALID_SAMPLE_RATE = -2,
    SAFETY_ERROR_INVALID_CHANNELS = -3,
    SAFETY_ERROR_INVALID_THRESHOLD_DB = -4,
    SAFETY_ERROR_INVALID_KNEE_WIDTH = -5,
    SAFETY_ERROR_INVALID_DC_THRESHOLD = -6,
    SAFETY_ERROR_INVALID_FEEDBACK_THRESHOLD = -7,
    SAFETY_ERROR_PROCESSING_FAILED = -8
} NythSafetyError;

// === État du système de sécurité ===
typedef enum {
    SAFETY_STATE_UNINITIALIZED = 0,
    SAFETY_STATE_INITIALIZED,
    SAFETY_STATE_PROCESSING,
    SAFETY_STATE_ERROR
} NythSafetyState;

// === Configuration de sécurité audio ===
typedef struct {
    bool enabled;
    // DC removal
    bool dcRemovalEnabled;
    double dcThreshold; // linear (~-54 dBFS)
    // Limiter
    bool limiterEnabled;
    double limiterThresholdDb; // dBFS
    bool softKneeLimiter;
    double kneeWidthDb;
    // Feedback detection
    bool feedbackDetectEnabled;
    double feedbackCorrThreshold; // normalized autocorrelation
} NythSafetyConfig;

// === Rapport de sécurité ===
typedef struct {
    double peak;
    double rms;
    double dcOffset;
    uint32_t clippedSamples;
    bool overloadActive;
    double feedbackScore; // 0..1
    bool hasNaN;
    bool feedbackLikely; // score >= threshold
} NythSafetyReport;

// === Configuration pour les optimisations ===
typedef struct {
    bool useOptimizedEngine;    // Utiliser la version SIMD
    bool enableMemoryPool;      // Pool de mémoire pour les rapports
    bool branchFreeProcessing;  // Traitement sans branchement
    size_t poolSize;           // Taille du pool de mémoire
} NythSafetyOptimizationConfig;

// === API de gestion de la sécurité ===
bool NythSafety_Initialize(uint32_t sampleRate, int channels);
bool NythSafety_IsInitialized(void);
void NythSafety_Release(void);

// === État et informations ===
NythSafetyState NythSafety_GetState(void);
const char* NythSafety_GetErrorString(NythSafetyError error);

// === Configuration ===
bool NythSafety_SetConfig(const NythSafetyConfig* config);
void NythSafety_GetConfig(NythSafetyConfig* config);
bool NythSafety_SetOptimizationConfig(const NythSafetyOptimizationConfig* config);

// === Traitement audio ===
NythSafetyError NythSafety_ProcessMono(float* buffer, size_t numSamples);
NythSafetyError NythSafety_ProcessStereo(float* left, float* right, size_t numSamples);

// === Analyse et rapports ===
void NythSafety_GetLastReport(NythSafetyReport* report);
bool NythSafety_IsOverloadActive(void);
bool NythSafety_HasFeedbackLikely(void);
double NythSafety_GetCurrentPeak(void);
double NythSafety_GetCurrentRMS(void);

// === Contrôle avancé ===

// Conversion dB/linéaire
double NythSafety_DbToLinear(double db);
double NythSafety_LinearToDb(double linear);

// Statistiques avancées
void NythSafety_ResetStatistics(void);
void NythSafety_GetStatistics(NythSafetyReport* min, NythSafetyReport* max, NythSafetyReport* avg);

// === Callbacks (pour usage interne) ===
typedef void (*NythSafetyDataCallback)(const float* input, float* output, size_t frameCount, int channels);
typedef void (*NythSafetyErrorCallback)(NythSafetyError error);
typedef void (*NythSafetyStateChangeCallback)(NythSafetyState oldState, NythSafetyState newState);

void NythSafety_SetAudioDataCallback(NythSafetyDataCallback callback);
void NythSafety_SetErrorCallback(NythSafetyErrorCallback callback);
void NythSafety_SetStateChangeCallback(NythSafetyStateChangeCallback callback);

#ifdef __cplusplus
}
#endif

// === Interface C++ pour TurboModule ===
#if NYTH_AUDIO_SAFETY_ENABLED && defined(__cplusplus)

#include <jsi/jsi.h>
#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModuleUtils.h>
#include "Audio/safety/AudioSafety.hpp"
#include "Audio/safety/AudioSafetyOptimized.hpp"
#include <mutex>
#include <atomic>
#include <queue>

namespace facebook {
namespace react {

class JSI_EXPORT NativeAudioSafetyModule : public TurboModule {
public:
    explicit NativeAudioSafetyModule(std::shared_ptr<CallInvoker> jsInvoker);
    ~NativeAudioSafetyModule() override;

    // === Méthodes TurboModule ===
    static constexpr auto kModuleName = "NativeAudioSafetyModule";

    // === Méthodes synchrones ===

    // Gestion du cycle de vie
    jsi::Value initialize(jsi::Runtime& rt, uint32_t sampleRate, int channels);
    jsi::Value isInitialized(jsi::Runtime& rt);
    jsi::Value dispose(jsi::Runtime& rt);

    // État et informations
    jsi::Value getState(jsi::Runtime& rt);
    jsi::Value getErrorString(jsi::Runtime& rt, int errorCode);

    // Configuration
    jsi::Value setConfig(jsi::Runtime& rt, const jsi::Object& config);
    jsi::Value getConfig(jsi::Runtime& rt);
    jsi::Value setOptimizationConfig(jsi::Runtime& rt, const jsi::Object& config);

    // Traitement audio
    jsi::Value processMono(jsi::Runtime& rt, const jsi::Array& buffer);
    jsi::Value processStereo(jsi::Runtime& rt, const jsi::Array& left, const jsi::Array& right);

    // Analyse et rapports
    jsi::Value getLastReport(jsi::Runtime& rt);
    jsi::Value isOverloadActive(jsi::Runtime& rt);
    jsi::Value hasFeedbackLikely(jsi::Runtime& rt);
    jsi::Value getCurrentPeak(jsi::Runtime& rt);
    jsi::Value getCurrentRMS(jsi::Runtime& rt);

    // Contrôle avancé
    jsi::Value dbToLinear(jsi::Runtime& rt, double db);
    jsi::Value linearToDb(jsi::Runtime& rt, double linear);
    jsi::Value resetStatistics(jsi::Runtime& rt);
    jsi::Value getStatistics(jsi::Runtime& rt);

    // === Callbacks JavaScript ===
    jsi::Value setAudioDataCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setStateChangeCallback(jsi::Runtime& rt, const jsi::Function& callback);

    // === Installation du module ===
    static jsi::Value install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker);

private:
    // Moteurs de sécurité audio
    std::unique_ptr<AudioSafety::AudioSafetyEngine> safetyEngine_;
    std::unique_ptr<AudioSafety::AudioSafetyEngineOptimized> optimizedEngine_;

    // Mutex pour la thread safety
    mutable std::mutex safetyMutex_;
    mutable std::mutex callbackMutex_;

    // Callbacks JavaScript
    struct {
        std::shared_ptr<jsi::Function> audioDataCallback;
        std::shared_ptr<jsi::Function> errorCallback;
        std::shared_ptr<jsi::Function> stateChangeCallback;
    } jsCallbacks_;

    // Configuration actuelle
    NythSafetyConfig currentConfig_;
    NythSafetyOptimizationConfig optimizationConfig_;
    std::atomic<NythSafetyState> currentState_{SAFETY_STATE_UNINITIALIZED};

    // Statistiques
    NythSafetyReport lastReport_ = {0};
    NythSafetyReport minReport_ = {0};
    NythSafetyReport maxReport_ = {0};
    NythSafetyReport avgReport_ = {0};
    uint32_t statsCount_ = 0;

    // Buffers de traitement
    std::vector<float> tempBuffer_;

    // Méthodes privées
    bool useOptimizedEngine() const;
    AudioSafety::SafetyError processMonoInternal(float* buffer, size_t numSamples);
    AudioSafety::SafetyError processStereoInternal(float* left, float* right, size_t numSamples);
    void updateStatistics(const AudioSafety::SafetyReport& report);
    NythSafetyError convertError(AudioSafety::SafetyError error) const;
    AudioSafety::SafetyError convertError(NythSafetyError error) const;

    // Conversion JSI <-> Native
    NythSafetyConfig parseSafetyConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    jsi::Object safetyConfigToJS(jsi::Runtime& rt, const NythSafetyConfig& config);
    jsi::Object safetyReportToJS(jsi::Runtime& rt, const NythSafetyReport& report);

    NythSafetyOptimizationConfig parseOptimizationConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    jsi::Object optimizationConfigToJS(jsi::Runtime& rt, const NythSafetyOptimizationConfig& config);

    // Conversion entre les types
    NythSafetyReport convertReport(const AudioSafety::SafetyReport& src) const;
    AudioSafety::SafetyConfig convertConfig(const NythSafetyConfig& src) const;

    // Invocation de callbacks JS sur le thread principal
    void invokeJSCallback(const std::string& callbackName, std::function<void(jsi::Runtime&)> invocation);
};

// === Fonction d'enregistrement du module ===
JSI_EXPORT std::shared_ptr<TurboModule> NativeAudioSafetyModuleProvider(
    std::shared_ptr<CallInvoker> jsInvoker);

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_SAFETY_ENABLED && __cplusplus
