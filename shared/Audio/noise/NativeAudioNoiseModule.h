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
#define NYTH_AUDIO_NOISE_ENABLED 1
#else
#define NYTH_AUDIO_NOISE_ENABLED 0
#endif

// === Interface C++ pour TurboModule ===
#if NYTH_AUDIO_NOISE_ENABLED && defined(__cplusplus)

// Includes C++ nécessaires pour TurboModule
#include <algorithm>
#include <atomic>
#include <chrono>
#include <functional>
#include <memory>
#include <string>
#include <unordered_map>
#include <vector>

#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModuleUtils.h>
#include <jsi/jsi.h>

#include "../../common/jsi/JSICallbackManager.h"
#include "config/NoiseConfig.h"
#include "jsi/NoiseJSIConverter.h"
#include "managers/NoiseManager.h"

namespace facebook {
namespace react {

// === Module principal refactorisé ===
class JSI_EXPORT NativeAudioNoiseModule : public TurboModule {
public:
    explicit NativeAudioNoiseModule(std::shared_ptr<CallInvoker> jsInvoker);
    ~NativeAudioNoiseModule() override;

    // === Méthodes TurboModule ===
    static constexpr auto kModuleName = "NativeAudioNoiseModule";

    // === Cycle de vie ===
    jsi::Value initialize(jsi::Runtime& rt, const jsi::Object& config);
    jsi::Value start(jsi::Runtime& rt);
    jsi::Value stop(jsi::Runtime& rt);
    jsi::Value dispose(jsi::Runtime& rt);

    // === État et informations ===
    jsi::Value getState(jsi::Runtime& rt);
    jsi::Value getStatistics(jsi::Runtime& rt);
    jsi::Value resetStatistics(jsi::Runtime& rt);

    // === Configuration ===
    jsi::Value getConfig(jsi::Runtime& rt);
    jsi::Value updateConfig(jsi::Runtime& rt, const jsi::Object& config);
    jsi::Value setAlgorithm(jsi::Runtime& rt, const jsi::String& algorithm);
    jsi::Value setAggressiveness(jsi::Runtime& rt, float aggressiveness);

    // === Traitement audio ===
    jsi::Value processAudio(jsi::Runtime& rt, const jsi::Array& input, int channels);
    jsi::Value processAudioStereo(jsi::Runtime& rt, const jsi::Array& inputL, const jsi::Array& inputR);

    // === Analyse audio ===
    jsi::Value getInputLevel(jsi::Runtime& rt);
    jsi::Value getOutputLevel(jsi::Runtime& rt);
    jsi::Value getEstimatedSNR(jsi::Runtime& rt);
    jsi::Value getSpeechProbability(jsi::Runtime& rt);
    jsi::Value getMusicalNoiseLevel(jsi::Runtime& rt);

    // === Configuration avancée ===
    jsi::Value initializeIMCRA(jsi::Runtime& rt, const jsi::Object& config);
    jsi::Value getIMCRAConfig(jsi::Runtime& rt);
    jsi::Value updateIMCRAConfig(jsi::Runtime& rt, const jsi::Object& config);

    jsi::Value initializeWiener(jsi::Runtime& rt, const jsi::Object& config);
    jsi::Value getWienerConfig(jsi::Runtime& rt);
    jsi::Value updateWienerConfig(jsi::Runtime& rt, const jsi::Object& config);

    jsi::Value initializeMultiband(jsi::Runtime& rt, const jsi::Object& config);
    jsi::Value getMultibandConfig(jsi::Runtime& rt);
    jsi::Value updateMultibandConfig(jsi::Runtime& rt, const jsi::Object& config);

    // === Callbacks JavaScript ===
    jsi::Value setAudioDataCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setStateChangeCallback(jsi::Runtime& rt, const jsi::Function& callback);

    // === Installation du module ===
    static jsi::Value install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker);

private:
    // === Composants refactorisés ===
    std::unique_ptr<NoiseManager> noiseManager_;
    std::shared_ptr<JSICallbackManager> callbackManager_;

    // === Configuration ===
    Nyth::Audio::NoiseConfig config_;

    // === État interne ===
    std::atomic<bool> isInitialized_{false};
    int currentState_ = 0; // 0 = UNINITIALIZED, 1 = INITIALIZED, 2 = PROCESSING, 3 = ERROR

    // === Gestion du runtime ===
    jsi::Runtime* runtime_ = nullptr;
    std::atomic<bool> runtimeValid_{false};

    // === Mutex pour thread safety ===
    mutable std::mutex mutex_;

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
    void onStatisticsUpdate(const Nyth::Audio::NoiseStatistics& stats);
    void onProcessingComplete(const float* input, const float* output, size_t frameCount);
    void onError(const std::string& error);
    void onStateChange(Nyth::Audio::NoiseState oldState, Nyth::Audio::NoiseState newState);
};

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_NOISE_ENABLED && __cplusplus
