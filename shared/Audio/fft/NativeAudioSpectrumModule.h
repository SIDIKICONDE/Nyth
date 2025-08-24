#pragma once

#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModuleUtils.h>
#include <atomic>
#include <jsi/jsi.h>
#include <memory>
#include <mutex>

#include "../../common/jsi/JSICallbackManager.h"
#include "config/SpectrumConfig.h"
#include "jsi/SpectrumJSIConverter.h"
#include "managers/SpectrumManager.h"

// Forward declarations pour les interfaces
namespace Nyth {
namespace Audio {
class ISpectrumManager;
}
} // namespace Nyth

namespace facebook {
namespace react {

// === Module principal refactorisé pour l'analyse spectrale audio ===

class JSI_EXPORT NativeAudioSpectrumModule : public TurboModule {
public:
    explicit NativeAudioSpectrumModule(std::shared_ptr<CallInvoker> jsInvoker);
    ~NativeAudioSpectrumModule() override;

    // === Méthodes TurboModule ===
    static constexpr auto kModuleName = "NativeAudioSpectrumModule";

    // === Cycle de vie ===
    jsi::Value initialize(jsi::Runtime& rt, const jsi::Object& config);
    jsi::Value isInitialized(jsi::Runtime& rt);
    jsi::Value release(jsi::Runtime& rt);

    // === État et informations ===
    jsi::Value getState(jsi::Runtime& rt);
    jsi::Value getErrorString(jsi::Runtime& rt, int errorCode);
    jsi::Value getInfo(jsi::Runtime& rt);

    // === Configuration ===
    jsi::Value setConfig(jsi::Runtime& rt, const jsi::Object& config);
    jsi::Value getConfig(jsi::Runtime& rt);

    // === Traitement audio ===
    jsi::Value processAudioBuffer(jsi::Runtime& rt, const jsi::Array& audioBuffer);
    jsi::Value processAudioBufferStereo(jsi::Runtime& rt, const jsi::Array& audioBufferL,
                                        const jsi::Array& audioBufferR);

    // === Analyse et rapports ===
    jsi::Value getLastSpectrumData(jsi::Runtime& rt);
    jsi::Value getStatistics(jsi::Runtime& rt);
    jsi::Value resetStatistics(jsi::Runtime& rt);

    // === Contrôles ===
    jsi::Value startAnalysis(jsi::Runtime& rt);
    jsi::Value stopAnalysis(jsi::Runtime& rt);
    jsi::Value isAnalyzing(jsi::Runtime& rt);

    // === Utilitaires ===
    jsi::Value calculateFFTSize(jsi::Runtime& rt, size_t desiredSize);
    jsi::Value validateConfig(jsi::Runtime& rt, const jsi::Object& config);

    // === Callbacks JavaScript ===
    jsi::Value setDataCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setStateCallback(jsi::Runtime& rt, const jsi::Function& callback);

    // === Installation du module ===
    static jsi::Value install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker);

private:
    // === Composants refactorisés ===
    std::unique_ptr<Nyth::Audio::ISpectrumManager> spectrumManager_;
    std::shared_ptr<IJSICallbackManager> callbackManager_;

    // === JS Invoker ===
    std::shared_ptr<CallInvoker> jsInvoker_;

    // === Configuration ===
    Nyth::Audio::SpectrumConfig config_;

    // === État interne ===
    std::atomic<bool> isInitialized_{false};
    std::atomic<bool> isAnalyzing_{false};
    Nyth::Audio::SpectrumState currentState_{Nyth::Audio::SpectrumState::UNINITIALIZED};

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
    void handleError(Nyth::Audio::SpectrumError error, const std::string& message);
    std::string stateToString(Nyth::Audio::SpectrumState state) const;
    std::string errorToString(Nyth::Audio::SpectrumError error) const;

    // === Callbacks ===
    void onSpectrumData(const Nyth::Audio::SpectrumData& data);
    void onError(Nyth::Audio::SpectrumError error, const std::string& message);
    void onStateChange(Nyth::Audio::SpectrumState oldState, Nyth::Audio::SpectrumState newState);

    // === Validation ===
    bool validateConfig(const Nyth::Audio::SpectrumConfig& config) const;

    // === Utilitaires ===
    void setupCallbacks();
};

} // namespace react
} // namespace facebook
