#pragma once

// Includes conditionnels pour la compatibilité
#if defined(__has_include)
#if __has_include(<NythJSI.h>)
#include <NythJSI.h>
#endif
#endif

// Vérification de la disponibilité de TurboModule
#if defined(__has_include) && __has_include(<ReactCommon/TurboModule.h>) && \
    __has_include(<ReactCommon/TurboModuleUtils.h>)
#define NYTH_AUDIO_EFFECTS_ENABLED 1
#else
#define NYTH_AUDIO_EFFECTS_ENABLED 0
#endif

// === Interface C++ pour TurboModule ===
#if NYTH_AUDIO_EFFECTS_ENABLED && defined(__cplusplus)

// Includes C++ nécessaires pour TurboModule
#include <functional>
#include <map>
#include <memory>
#include <string>
#include <vector>

#include "Audio/effects/EffectBase.hpp"
#include "Audio/effects/EffectChain.hpp"
#include "Audio/effects/EffectConstants.hpp"
#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModuleUtils.h>
#include <atomic>
#include <jsi/jsi.h>
#include <mutex>

// Forward declarations for AudioFX namespace
namespace AudioFX {
class IAudioEffect;
class CompressorEffect;
class DelayEffect;
class EffectChain;
} // namespace AudioFX

// Types d'effets audio
enum NythEffectType { EFFECT_TYPE_UNKNOWN = 0, EFFECT_TYPE_COMPRESSOR = 1, EFFECT_TYPE_DELAY = 2 };

// États du module
enum NythEffectsState {
    EFFECTS_STATE_UNINITIALIZED = 0,
    EFFECTS_STATE_INITIALIZED = 1,
    EFFECTS_STATE_PROCESSING = 2,
    EFFECTS_STATE_ERROR = 3
};

// Configuration des effets
struct NythEffectConfig {
    int effectId = 0;
    NythEffectType type = EFFECT_TYPE_UNKNOWN;
    bool enabled = AudioFX::DEFAULT_ENABLED;
    uint32_t sampleRate = AudioFX::REFERENCE_SAMPLE_RATE;
    int channels = AudioFX::DEFAULT_CHANNELS;

    union {
        struct {
            float thresholdDb;
            float ratio;
            float attackMs;
            float releaseMs;
            float makeupDb;
        } compressor;

        struct {
            float delayMs;
            float feedback;
            float mix;
        } delay;
    } config;
};

// Statistiques du module
struct NythEffectsStatistics {
    float inputLevel = AudioFX::BUFFER_INIT_VALUE;
    float outputLevel = AudioFX::BUFFER_INIT_VALUE;
    uint64_t processedFrames = AudioFX::ZERO_SAMPLES;
    uint64_t processedSamples = AudioFX::ZERO_SAMPLES;
    uint64_t durationMs = AudioFX::ZERO_SAMPLES;
    int activeEffectsCount = AudioFX::ZERO_SAMPLES;
};

namespace facebook {
namespace react {

class JSI_EXPORT NativeAudioEffectsModule : public TurboModule {
public:
    explicit NativeAudioEffectsModule(std::shared_ptr<CallInvoker> jsInvoker)
        : TurboModule("NativeAudioEffectsModule", jsInvoker), jsInvoker_(jsInvoker) {}
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
    jsi::Value setCompressorParameters(jsi::Runtime& rt, int effectId, float thresholdDb, float ratio, float attackMs,
                                       float releaseMs, float makeupDb);
    jsi::Value getCompressorParameters(jsi::Runtime& rt, int effectId);
    jsi::Value setDelayParameters(jsi::Runtime& rt, int effectId, float delayMs, float feedback, float mix);
    jsi::Value getDelayParameters(jsi::Runtime& rt, int effectId);

    // Traitement audio
    jsi::Value processAudio(jsi::Runtime& rt, const jsi::Array& input, int channels);
    jsi::Value processAudioStereo(jsi::Runtime& rt, const jsi::Array& inputL, const jsi::Array& inputR);

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

    // JSInvoker pour l'exécution sur le thread JS
    std::shared_ptr<CallInvoker> jsInvoker_;

    // Runtime reference (weak to avoid circular dependency)
    jsi::Runtime* runtime_ = nullptr;

    // Callbacks JavaScript avec runtime
    struct CallbackInfo {
        std::shared_ptr<jsi::Function> function;
        jsi::Runtime* runtime = nullptr;
    };

    struct {
        CallbackInfo audioDataCallback;
        CallbackInfo errorCallback;
        CallbackInfo stateChangeCallback;
    } jsCallbacks_;

    // Configuration actuelle - utilise les constantes d'EffectConstants.hpp
    uint32_t currentSampleRate_ = AudioFX::REFERENCE_SAMPLE_RATE;
    int currentChannels_ = AudioFX::DEFAULT_CHANNELS;
    std::atomic<NythEffectsState> currentState_{EFFECTS_STATE_UNINITIALIZED};

    // Gestion des IDs d'effets
    std::atomic<int> nextEffectId_{AudioFX::CHAIN_START_INDEX};
    std::map<int, std::unique_ptr<AudioFX::IAudioEffect>> activeEffects_;

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
JSI_EXPORT std::shared_ptr<TurboModule> NativeAudioEffectsModuleProvider(std::shared_ptr<CallInvoker> jsInvoker);

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_EFFECTS_ENABLED && __cplusplus
