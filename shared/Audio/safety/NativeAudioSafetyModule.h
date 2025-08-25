#pragma once

#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModuleUtils.h>
#include <atomic>
#include <jsi/jsi.h>
#include <memory>


#include "../../common/jsi/JSICallbackManager.h"
#include "config/SafetyConfig.h"
#include "jsi/SafetyJSIConverter.h"
#include "managers/SafetyManager.h"
#include "../../common/SIMD/SIMDIntegration.hpp"


namespace facebook {
namespace react {

// Using declarations pour les types fréquemment utilisés du namespace Nyth::Audio
using Nyth::Audio::SafetyConfig;
using Nyth::Audio::SafetyError;
using Nyth::Audio::SafetyState;
using Nyth::Audio::SafetyReport;
using Nyth::Audio::SafetyStatistics;

// === Module principal refactorisé pour la sécurité audio ===

class JSI_EXPORT NativeAudioSafetyModule : public TurboModule {
public:
    explicit NativeAudioSafetyModule(std::shared_ptr<CallInvoker> jsInvoker);
    ~NativeAudioSafetyModule() override;

    // === Méthodes TurboModule ===
    static constexpr auto kModuleName = "NativeAudioSafetyModule";

    // === Cycle de vie ===
    jsi::Value initialize(jsi::Runtime& rt, uint32_t sampleRate, int channels);
    jsi::Value isInitialized(jsi::Runtime& rt);
    jsi::Value dispose(jsi::Runtime& rt);

    // === État et informations ===
    jsi::Value getState(jsi::Runtime& rt);
    jsi::Value getErrorString(jsi::Runtime& rt, int errorCode);
    jsi::Value getInfo(jsi::Runtime& rt);

    // === Configuration ===
    jsi::Value setConfig(jsi::Runtime& rt, const jsi::Object& config);
    jsi::Value getConfig(jsi::Runtime& rt);
    jsi::Value setOptimizationConfig(jsi::Runtime& rt, const jsi::Object& config);
    jsi::Value updateConfig(jsi::Runtime& rt, const jsi::Object& config);

    // === Traitement audio ===
    jsi::Value processAudio(jsi::Runtime& rt, const jsi::Array& input, int channels);
    jsi::Value processAudioStereo(jsi::Runtime& rt, const jsi::Array& inputL, const jsi::Array& inputR);

    // === Analyse et rapports ===
    jsi::Value getLastReport(jsi::Runtime& rt);
    jsi::Value getStatistics(jsi::Runtime& rt);
    jsi::Value resetStatistics(jsi::Runtime& rt);

    // === Métriques individuelles ===
    jsi::Value getCurrentPeakLevel(jsi::Runtime& rt);
    jsi::Value getCurrentRMSLevel(jsi::Runtime& rt);
    jsi::Value getCurrentDCOffset(jsi::Runtime& rt);
    jsi::Value getCurrentClippedSamples(jsi::Runtime& rt);
    jsi::Value isOverloadActive(jsi::Runtime& rt);
    jsi::Value getCurrentFeedbackScore(jsi::Runtime& rt);
    jsi::Value hasFeedbackLikely(jsi::Runtime& rt);

    // === Contrôles ===
    jsi::Value start(jsi::Runtime& rt);
    jsi::Value stop(jsi::Runtime& rt);
    jsi::Value isProcessing(jsi::Runtime& rt);

    // === Utilitaires ===
    jsi::Value dbToLinear(jsi::Runtime& rt, double db);
    jsi::Value linearToDb(jsi::Runtime& rt, double linear);
    jsi::Value validateConfig(jsi::Runtime& rt, const jsi::Object& config);

    // === Callbacks JavaScript ===
    jsi::Value setAudioDataCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setStateChangeCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setReportCallback(jsi::Runtime& rt, const jsi::Function& callback);

    // === Installation du module ===
    static jsi::Value install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker);

private:
    // === Composants refactorisés ===
    std::unique_ptr<SafetyManager> safetyManager_;
    std::shared_ptr<JSICallbackManager> callbackManager_;

    // === JS Invoker ===
    std::shared_ptr<CallInvoker> jsInvoker_;

    // === Configuration ===
    SafetyConfig config_;

    // === État interne ===
    std::atomic<bool> isInitialized_{false};
    std::atomic<bool> isProcessing_{false};
    std::atomic<SafetyState> currentState_{SafetyState::UNINITIALIZED};

    // === Gestion du runtime ===
    jsi::Runtime* runtime_ = nullptr;
    std::atomic<bool> runtimeValid_{false};

    // === Mutex pour thread safety ===
    mutable std::mutex mutex_;

    // === Buffers de travail ===
    std::vector<float> workBufferL_;
    std::vector<float> workBufferR_;
    std::vector<float> tempBuffer_;

    // === Méthodes privées ===
    void initializeManagers();
    void cleanupManagers();
    void setRuntime(jsi::Runtime* rt);
    void invalidateRuntime();

    // === Gestion d'erreurs ===
    void handleError(SafetyError error, const std::string& message);
    std::string stateToString(SafetyState state) const;
    std::string errorToString(SafetyError error) const;

    // === Callbacks ===
    void onStatisticsUpdate(const SafetyStatistics& stats);
    void onProcessingComplete(const float* input, const float* output, size_t frameCount);
    void onError(const std::string& error);
    void onStateChange(SafetyState oldState, SafetyState newState);
    void onReportUpdate(const SafetyReport& report);

    // === Validation ===
    bool validateConfig(const SafetyConfig& config) const;

    // === Utilitaires ===
    void setupCallbacks();
    void resetBuffers();
    std::string getModuleInfo() const;
};

} // namespace react
} // namespace facebook
