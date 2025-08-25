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
#define NYTH_AUDIO_CAPTURE_ENABLED 1
#else
#define NYTH_AUDIO_CAPTURE_ENABLED 0
#endif

// === Interface C++ pour TurboModule ===
#if NYTH_AUDIO_CAPTURE_ENABLED && defined(__cplusplus)

// Includes C++ nécessaires pour TurboModule
#include <atomic>
#include <chrono>
#include <condition_variable>
#include <functional>
#include <memory>
#include <string>
#include <thread>
#include <vector>


#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModuleUtils.h>
#include <jsi/jsi.h>

// Includes des composants refactorisés
#include "../../common/config/AudioConfig.h"
#include "../../common/config/AudioLimits.h"
#include "../../common/jsi/JSICallbackManager.h"
#include "jsi/JSIConverter.h"
#include "managers/AudioCaptureManager.h"


namespace facebook {
namespace react {

// Using declarations pour les types fréquemment utilisés du namespace Nyth::Audio
using Nyth::Audio::AudioCaptureConfig;
using Nyth::Audio::AudioConfig;

// === Module principal refactorisé ===
class JSI_EXPORT NativeAudioCaptureModule : public TurboModule {
public:
    explicit NativeAudioCaptureModule(std::shared_ptr<CallInvoker> jsInvoker);
    ~NativeAudioCaptureModule() override;

    // === Méthodes TurboModule ===
    static constexpr auto kModuleName = "NativeAudioCaptureModule";

    // === Cycle de vie simplifié ===
    jsi::Value initialize(jsi::Runtime& rt, const jsi::Object& config);
    jsi::Value start(jsi::Runtime& rt);
    jsi::Value stop(jsi::Runtime& rt);
    jsi::Value pause(jsi::Runtime& rt);
    jsi::Value resume(jsi::Runtime& rt);
    jsi::Value dispose(jsi::Runtime& rt);

    // === État et informations ===
    jsi::Value getState(jsi::Runtime& rt);
    jsi::Value isCapturing(jsi::Runtime& rt);
    jsi::Value getStatistics(jsi::Runtime& rt);
    jsi::Value resetStatistics(jsi::Runtime& rt);

    // === Configuration ===
    jsi::Value getConfig(jsi::Runtime& rt);
    jsi::Value updateConfig(jsi::Runtime& rt, const jsi::Object& config);

    // === Niveaux audio ===
    jsi::Value getCurrentLevel(jsi::Runtime& rt);
    jsi::Value getPeakLevel(jsi::Runtime& rt);
    jsi::Value resetPeakLevel(jsi::Runtime& rt);

    // === Analyse audio ===
    jsi::Value getRMS(jsi::Runtime& rt);
    jsi::Value getRMSdB(jsi::Runtime& rt);
    jsi::Value isSilent(jsi::Runtime& rt, double threshold);
    jsi::Value hasClipping(jsi::Runtime& rt);

    // === Périphériques ===
    jsi::Value getAvailableDevices(jsi::Runtime& rt);
    jsi::Value selectDevice(jsi::Runtime& rt, const jsi::String& deviceId);
    jsi::Value getCurrentDevice(jsi::Runtime& rt);

    // === Permissions ===
    jsi::Value hasPermission(jsi::Runtime& rt);
    jsi::Value requestPermission(jsi::Runtime& rt);

    // === Enregistrement ===
    jsi::Value startRecording(jsi::Runtime& rt, const jsi::String& filePath, const jsi::Object& options);
    jsi::Value stopRecording(jsi::Runtime& rt);
    jsi::Value pauseRecording(jsi::Runtime& rt);
    jsi::Value resumeRecording(jsi::Runtime& rt);
    jsi::Value isRecording(jsi::Runtime& rt);
    jsi::Value getRecordingInfo(jsi::Runtime& rt);

    // === Callbacks JavaScript ===
    jsi::Value setAudioDataCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setStateChangeCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setAnalysisCallback(jsi::Runtime& rt, const jsi::Function& callback, double intervalMs);

    // === Installation du module ===
    static jsi::Value install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker);

private:
    // === Composants refactorisés ===
    std::unique_ptr<AudioCaptureManager> captureManager_;
    std::shared_ptr<JSICallbackManager> callbackManager_;

    // Invoker JS pour les appels asynchrones
    std::shared_ptr<CallInvoker> jsInvoker_;

    // === Configuration ===
    AudioCaptureConfig config_;

    // === État interne ===
    std::atomic<bool> isInitialized_{false};

    // === Méthodes privées ===
    void initializeManagers();
    void cleanupManagers();

    // Gestion du runtime pour les callbacks
    jsi::Runtime* runtime_ = nullptr;
    std::atomic<bool> runtimeValid_{false};
    void setRuntime(jsi::Runtime* rt);
    void invalidateRuntime();

    // Gestion des erreurs
    void handleError(const std::string& error);

    // Conversion de configuration
    AudioCaptureConfig toCaptureConfig(const AudioConfig& config) const;
    AudioConfig toAudioConfig(const AudioCaptureConfig& config) const;

    // Analyse périodique
    std::thread analysisThread_;
    std::atomic<bool> analysisRunning_{false};
    std::atomic<int> analysisIntervalMs_{100};
    void startAnalysisLoop();
    void stopAnalysisLoop();
};

// === Fonction d'enregistrement du module ===
JSI_EXPORT std::shared_ptr<TurboModule> NativeAudioCaptureModuleProvider(std::shared_ptr<CallInvoker> jsInvoker);

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_CAPTURE_ENABLED && __cplusplus