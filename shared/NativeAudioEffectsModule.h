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
#define NYTH_AUDIO_EFFECTS_ENABLED 1
#else
#define NYTH_AUDIO_EFFECTS_ENABLED 0
#endif

// === API C globale pour les effets audio ===
#ifdef __cplusplus
extern "C" {
#endif

// === Types d'effets ===
typedef enum {
    EFFECT_TYPE_COMPRESSOR = 0,
    EFFECT_TYPE_DELAY,
    EFFECT_TYPE_UNKNOWN
} NythEffectType;

// === État des effets ===
typedef enum {
    EFFECTS_STATE_UNINITIALIZED = 0,
    EFFECTS_STATE_INITIALIZED,
    EFFECTS_STATE_PROCESSING,
    EFFECTS_STATE_ERROR
} NythEffectsState;

// === Configuration des effets ===
typedef struct {
    NythEffectType type;
    int effectId; // ID unique de l'effet
    bool enabled;
    uint32_t sampleRate;
    int channels;
    // Données spécifiques à l'effet (union pour différents types)
    union {
        // Configuration compresseur
        struct {
            float thresholdDb;
            float ratio;
            float attackMs;
            float releaseMs;
            float makeupDb;
        } compressor;
        // Configuration délai
        struct {
            float delayMs;
            float feedback;
            float mix;
        } delay;
    } config;
} NythEffectConfig;

// === Statistiques des effets ===
typedef struct {
    float inputLevel;
    float outputLevel;
    uint32_t processedFrames;
    uint64_t processedSamples;
    int64_t durationMs;
    int activeEffectsCount;
} NythEffectsStatistics;

// === API de gestion des effets ===
bool NythEffects_Initialize(void);
bool NythEffects_Start(void);
bool NythEffects_Stop(void);
void NythEffects_Release(void);

// === État et informations ===
NythEffectsState NythEffects_GetState(void);
void NythEffects_GetStatistics(NythEffectsStatistics* stats);
void NythEffects_ResetStatistics(void);

// === Gestion des effets individuels ===
int NythEffects_CreateEffect(const NythEffectConfig* config);
bool NythEffects_DestroyEffect(int effectId);
bool NythEffects_UpdateEffect(int effectId, const NythEffectConfig* config);
bool NythEffects_GetEffectConfig(int effectId, NythEffectConfig* config);

// === Contrôle des effets ===
bool NythEffects_EnableEffect(int effectId, bool enabled);
bool NythEffects_IsEffectEnabled(int effectId);
int NythEffects_GetActiveEffectsCount(void);
const int* NythEffects_GetActiveEffectIds(size_t* count);

// === Configuration des effets spécifiques ===

// Compresseur
bool NythEffects_SetCompressorParameters(int effectId, float thresholdDb, float ratio,
                                       float attackMs, float releaseMs, float makeupDb);
bool NythEffects_GetCompressorParameters(int effectId, float* thresholdDb, float* ratio,
                                       float* attackMs, float* releaseMs, float* makeupDb);

// Délai
bool NythEffects_SetDelayParameters(int effectId, float delayMs, float feedback, float mix);
bool NythEffects_GetDelayParameters(int effectId, float* delayMs, float* feedback, float* mix);

// === Traitement audio ===
bool NythEffects_ProcessAudio(const float* input, float* output, size_t frameCount, int channels);
bool NythEffects_ProcessAudioStereo(const float* inputL, const float* inputR,
                                   float* outputL, float* outputR, size_t frameCount);

// === Analyse audio ===
float NythEffects_GetInputLevel(void);
float NythEffects_GetOutputLevel(void);

// === Callbacks (pour usage interne) ===
typedef void (*NythEffectsDataCallback)(const float* input, float* output, size_t frameCount, int channels);
typedef void (*NythEffectsErrorCallback)(const char* error);
typedef void (*NythEffectsStateChangeCallback)(NythEffectsState oldState, NythEffectsState newState);

void NythEffects_SetAudioDataCallback(NythEffectsDataCallback callback);
void NythEffects_SetErrorCallback(NythEffectsErrorCallback callback);
void NythEffects_SetStateChangeCallback(NythEffectsStateChangeCallback callback);

#ifdef __cplusplus
}
#endif

// === Interface C++ pour TurboModule ===
#if NYTH_AUDIO_EFFECTS_ENABLED && defined(__cplusplus)

// Includes C++ nécessaires pour TurboModule
#include <string>
#include <memory>
#include <functional>
#include <vector>
#include <map>

#include <jsi/jsi.h>
#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModuleUtils.h>
#include "Audio/effects/EffectChain.hpp"
#include "Audio/effects/EffectBase.hpp"
#include <mutex>
#include <atomic>
#include <queue>

// Forward declarations for Nyth namespace
namespace Nyth {
namespace Audio {
    class IAudioEffect;
}
}

namespace facebook {
namespace react {

class JSI_EXPORT NativeAudioEffectsModule : public TurboModule {
public:
    explicit NativeAudioEffectsModule(std::shared_ptr<CallInvoker> jsInvoker)
        : TurboModule("NativeAudioEffectsModule", jsInvoker) {}
    ~NativeAudioEffectsModule() override;

    // === Méthodes TurboModule ===
    static constexpr auto kModuleName = "NativeAudioEffectsModule";

    // === Méthodes synchrones ===

    // Gestion du cycle de vie
    void initialize(jsi::Runtime& rt);
    jsi::Value start(jsi::Runtime& rt);
    jsi::Value stop(jsi::Runtime& rt);
    jsi::Value dispose(jsi::Runtime& rt);

    // État et informations
    jsi::Value getState(jsi::Runtime& rt);
    jsi::Value getStatistics(jsi::Runtime& rt);
    jsi::Value resetStatistics(jsi::Runtime& rt);

    // Gestion des effets
    jsi::Value createEffect(jsi::Runtime& rt, const jsi::Object& config);
    jsi::Value destroyEffect(jsi::Runtime& rt, int effectId);
    jsi::Value updateEffect(jsi::Runtime& rt, int effectId, const jsi::Object& config);
    jsi::Value getEffectConfig(jsi::Runtime& rt, int effectId);

    // Contrôle des effets
    jsi::Value enableEffect(jsi::Runtime& rt, int effectId, bool enabled);
    jsi::Value isEffectEnabled(jsi::Runtime& rt, int effectId);
    jsi::Value getActiveEffectsCount(jsi::Runtime& rt);
    jsi::Value getActiveEffectIds(jsi::Runtime& rt);

    // Configuration des effets spécifiques
    jsi::Value setCompressorParameters(jsi::Runtime& rt, int effectId, float thresholdDb,
                                     float ratio, float attackMs, float releaseMs, float makeupDb);
    jsi::Value getCompressorParameters(jsi::Runtime& rt, int effectId);
    jsi::Value setDelayParameters(jsi::Runtime& rt, int effectId, float delayMs,
                                float feedback, float mix);
    jsi::Value getDelayParameters(jsi::Runtime& rt, int effectId);

    // Traitement audio
    jsi::Value processAudio(jsi::Runtime& rt, const jsi::Array& input, int channels);
    jsi::Value processAudioStereo(jsi::Runtime& rt, const jsi::Array& inputL,
                                const jsi::Array& inputR);

    // Analyse audio
    jsi::Value getInputLevel(jsi::Runtime& rt);
    jsi::Value getOutputLevel(jsi::Runtime& rt);

    // === Callbacks JavaScript ===
    jsi::Value setAudioDataCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setStateChangeCallback(jsi::Runtime& rt, const jsi::Function& callback);

    // === Installation du module ===
    static jsi::Value install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker);

private:
    // Instance de la chaîne d'effets
    std::unique_ptr<AudioFX::EffectChain> effectChain_;

    // Mutex pour la thread safety
    mutable std::mutex effectsMutex_;
    mutable std::mutex callbackMutex_;

    // Callbacks JavaScript
    struct {
        std::shared_ptr<jsi::Function> audioDataCallback;
        std::shared_ptr<jsi::Function> errorCallback;
        std::shared_ptr<jsi::Function> stateChangeCallback;
    } jsCallbacks_;

    // Configuration actuelle
    uint32_t currentSampleRate_;
    int currentChannels_;
    std::atomic<NythEffectsState> currentState_{EFFECTS_STATE_UNINITIALIZED};

    // Gestion des IDs d'effets
    std::atomic<int> nextEffectId_{1};
    std::map<int, std::unique_ptr<AudioFX::IAudioEffect>> activeEffects_;

    // Buffers de traitement
    std::vector<float> inputBuffer_;
    std::vector<float> outputBuffer_;
    std::vector<float> tempBufferL_;
    std::vector<float> tempBufferR_;

    // Méthodes privées
    void initializeEffectChain();
    bool validateEffectId(int effectId) const;
    NythEffectType stringToEffectType(const std::string& typeStr) const;
    std::string effectTypeToString(NythEffectType type) const;
    std::string stateToString(NythEffectsState state) const;
    void handleAudioData(const float* input, float* output, size_t frameCount, int channels);
    void handleError(const std::string& error);
    void handleStateChange(NythEffectsState oldState, NythEffectsState newState);

    // Conversion JSI <-> Native
    NythEffectConfig parseEffectConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    jsi::Object effectConfigToJS(jsi::Runtime& rt, const NythEffectConfig& config);
    jsi::Object statisticsToJS(jsi::Runtime& rt, const NythEffectsStatistics& stats);
    jsi::Array effectIdsToJS(jsi::Runtime& rt, const std::vector<int>& effectIds);

    // Invocation de callbacks JS sur le thread principal
    void invokeJSCallback(const std::string& callbackName, std::function<void(jsi::Runtime&)> invocation);
};

// === Fonction d'enregistrement du module ===
JSI_EXPORT std::shared_ptr<TurboModule> NativeAudioEffectsModuleProvider(
    std::shared_ptr<CallInvoker> jsInvoker);

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_EFFECTS_ENABLED && __cplusplus
