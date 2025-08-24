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
#include <algorithm>
#include <atomic>
#include <chrono>
#include <functional>
#include <memory>
#include <mutex>
#include <string>
#include <unordered_map>
#include <vector>

#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModuleUtils.h>
#include <jsi/jsi.h>

#include "../capture/jsi/JSICallbackManager.h"
#include "effects/config/EffectsConfig.h"
#include "effects/jsi/EffectsJSIConverter.h"
#include "effects/managers/EffectManager.h"

namespace facebook {
namespace react {

// === Module principal refactorisé ===
class JSI_EXPORT NativeAudioEffectsModule : public TurboModule {
public:
    explicit NativeAudioEffectsModule(std::shared_ptr<CallInvoker> jsInvoker);
    ~NativeAudioEffectsModule() override;

    // === Méthodes TurboModule ===
    static constexpr auto kModuleName = "NativeAudioEffectsModule";

    // === Cycle de vie ===
    jsi::Value initialize(jsi::Runtime& rt);
    jsi::Value isInitialized(jsi::Runtime& rt);
    jsi::Value dispose(jsi::Runtime& rt);

    // === État et informations ===
    jsi::Value getState(jsi::Runtime& rt);
    jsi::Value getStatistics(jsi::Runtime& rt);
    jsi::Value resetStatistics(jsi::Runtime& rt);

    // === Gestion des effets ===
    jsi::Value createEffect(jsi::Runtime& rt, const jsi::Object& config);
    jsi::Value destroyEffect(jsi::Runtime& rt, int effectId);
    jsi::Value updateEffect(jsi::Runtime& rt, int effectId, const jsi::Object& config);
    jsi::Value getEffectConfig(jsi::Runtime& rt, int effectId);

    // === Contrôle des effets ===
    jsi::Value enableEffect(jsi::Runtime& rt, int effectId, bool enabled);
    jsi::Value isEffectEnabled(jsi::Runtime& rt, int effectId);
    jsi::Value getActiveEffectsCount(jsi::Runtime& rt);
    jsi::Value getActiveEffectIds(jsi::Runtime& rt);

    // === Contrôle global ===
    jsi::Value setBypassAll(jsi::Runtime& rt, bool bypass);
    jsi::Value isBypassAll(jsi::Runtime& rt);
    jsi::Value setMasterLevels(jsi::Runtime& rt, float input, float output);
    jsi::Value getMasterLevels(jsi::Runtime& rt);

    // === Traitement audio ===
    jsi::Value processAudio(jsi::Runtime& rt, const jsi::Array& input, int channels);
    jsi::Value processAudioStereo(jsi::Runtime& rt, const jsi::Array& inputL, const jsi::Array& inputR);

    // === Analyse audio ===
    jsi::Value getInputLevel(jsi::Runtime& rt);
    jsi::Value getOutputLevel(jsi::Runtime& rt);
    jsi::Value getProcessingMetrics(jsi::Runtime& rt);

    // === Callbacks JavaScript ===
    jsi::Value setAudioDataCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setStateChangeCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setProcessingCallback(jsi::Runtime& rt, const jsi::Function& callback);

    // === Installation du module ===
    static jsi::Value install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker);

private:
    // === Composants refactorisés ===
    std::unique_ptr<EffectManager> effectManager_;
    std::shared_ptr<JSICallbackManager> callbackManager_;

    // === Configuration ===
    Nyth::Audio::EffectsConfig config_;

    // === État interne ===
    std::atomic<bool> isInitialized_{false};
    int currentState_ = 0; // 0 = UNINITIALIZED, 1 = INITIALIZED, 2 = PROCESSING, 3 = ERROR

    // === Gestion du runtime ===
    jsi::Runtime* runtime_ = nullptr;
    std::atomic<bool> runtimeValid_{false};

    // === Méthodes privées ===
    void initializeManagers();
    void cleanupManagers();
    void setRuntime(jsi::Runtime* rt);
    void invalidateRuntime();

    // === Gestion d'erreurs ===
    void handleError(int error, const std::string& message);
    std::string stateToString(int state) const;
    std::string errorToString(int error) const;

    // === Callbacks ===
    void onProcessingMetrics(const EffectManager::ProcessingMetrics& metrics);
    void onEffectEvent(int effectId, const std::string& event);

    // === JSI Invoker ===
    std::shared_ptr<CallInvoker> jsInvoker_;

    // === Synchronisation ===
    mutable std::mutex mutex_;
};

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_EFFECTS_ENABLED && __cplusplus
