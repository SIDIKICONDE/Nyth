#pragma once

// Includes conditionnels pour la compatibilitÃ©
#if defined(__has_include)
#if __has_include(<NythJSI.h>)
#include <NythJSI.h>
#endif
#endif

// VÃ©rification de la disponibilitÃ© de TurboModule
#if defined(__has_include) && __has_include(<ReactCommon/TurboModule.h>) && \
    __has_include(<ReactCommon/TurboModuleUtils.h>)
#define NYTH_AUDIO_NOISE_ENABLED 1
#else
#define NYTH_AUDIO_NOISE_ENABLED 0
#endif

// === Interface C++ pour TurboModule ===
#if NYTH_AUDIO_NOISE_ENABLED && defined(__cplusplus)

// Includes C++ nÃ©cessaires pour TurboModule
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
#include "../../common/SIMD/SIMDIntegration.hpp"

namespace facebook {
namespace react {

// Using declarations pour les types frÃ©quemment utilisÃ©s du namespace Nyth::Audio
using Nyth::Audio::NoiseConfig;
using Nyth::Audio::NoiseStatistics;
using Nyth::Audio::NoiseState;
using Nyth::Audio::NoiseManager;

// === Module principal refactorisÃ© ===
class JSI_EXPORT NativeAudioNoiseModule : public TurboModule {
public:
    explicit NativeAudioNoiseModule(std::shared_ptr<CallInvoker> jsInvoker);
    ~NativeAudioNoiseModule() override;

    // === MÃ©thodes TurboModule ===
    static constexpr auto kModuleName = "NativeAudioNoiseModule";

    // === Cycle de vie ===
    jsi::Value initialize(jsi::Runtime& rt, const jsi::Object& config);
    jsi::Value start(jsi::Runtime& rt);
    jsi::Value stop(jsi::Runtime& rt);
    jsi::Value dispose(jsi::Runtime& rt);

    // === Ã‰tat et informations ===
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

    // === Configuration avancÃ©e ===
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
    // === Composants refactorisÃ©s ===
    std::unique_ptr<NoiseManager> noiseManager_;
    std::shared_ptr<JSICallbackManager> callbackManager_;

    // === JS Invoker ===
    std::shared_ptr<CallInvoker> jsInvoker_;

    // === Configuration ===
    NoiseConfig config_;

    // === Ã‰tat interne ===
    std::atomic<bool> isInitialized_{false};
    int currentState_ = 0; // 0 = UNINITIALIZED, 1 = INITIALIZED, 2 = PROCESSING, 3 = ERROR

    // === Gestion du runtime ===
    jsi::Runtime* runtime_ = nullptr;
    std::atomic<bool> runtimeValid_{false};

    // === Mutex pour thread safety ===
    mutable std::mutex mutex_;

    // === MÃ©thodes privÃ©es ===
    void initializeManagers();
    void cleanupManagers();
    void setRuntime(jsi::Runtime* rt);
    void invalidateRuntime();

    // === Gestion d'erreurs ===
    void handleError(int error, const std::string& message);
    std::string stateToString(int state) const;
    std::string errorToString(int error) const;

    // === Callbacks ===
    void onStatisticsUpdate(const NoiseStatistics& stats);
    void onProcessingComplete(const float* input, const float* output, size_t frameCount);
    void onError(const std::string& error);
    void onStateChange(NoiseState oldState, NoiseState newState);
};

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_NOISE_ENABLED && __cplusplus
