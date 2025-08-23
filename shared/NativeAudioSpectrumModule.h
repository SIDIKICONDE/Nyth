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
#define NYTH_AUDIO_SPECTRUM_ENABLED 1
#else
#define NYTH_AUDIO_SPECTRUM_ENABLED 0
#endif

// === Interface C++ pour TurboModule ===
#if NYTH_AUDIO_SPECTRUM_ENABLED && defined(__cplusplus)

// Includes C++ nécessaires pour TurboModule
#include <functional>
#include <memory>
#include <string>
#include <vector>

#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModuleUtils.h>
#include <atomic>
#include <jsi/jsi.h>
#include <memory>
#include <mutex>
#include <queue>

namespace facebook {
namespace react {

class JSI_EXPORT NativeAudioSpectrumModule : public TurboModule {
public:
    explicit NativeAudioSpectrumModule(std::shared_ptr<CallInvoker> jsInvoker)
        : TurboModule("NativeAudioSpectrumModule", jsInvoker) {}
    ~NativeAudioSpectrumModule() override;

    // === Méthodes TurboModule ===
    static constexpr auto kModuleName = "NativeAudioSpectrumModule";

    // === Méthodes synchrones ===

    // Gestion du cycle de vie
    jsi::Value initialize(jsi::Runtime& rt, const jsi::Object& config);
    jsi::Value isInitialized(jsi::Runtime& rt);
    jsi::Value release(jsi::Runtime& rt);

    // État et informations
    jsi::Value getState(jsi::Runtime& rt);
    jsi::Value getErrorString(jsi::Runtime& rt, int errorCode);

    // Configuration
    jsi::Value setConfig(jsi::Runtime& rt, const jsi::Object& config);
    jsi::Value getConfig(jsi::Runtime& rt);

    // Contrôle de l'analyse
    jsi::Value startAnalysis(jsi::Runtime& rt);
    jsi::Value stopAnalysis(jsi::Runtime& rt);
    jsi::Value isAnalyzing(jsi::Runtime& rt);

    // Traitement des données
    jsi::Value processAudioBuffer(jsi::Runtime& rt, const jsi::Array& audioBuffer);
    jsi::Value processAudioBufferStereo(jsi::Runtime& rt, const jsi::Array& audioBufferL,
                                        const jsi::Array& audioBufferR);

    // Récupération des données spectrales
    jsi::Value getSpectrumData(jsi::Runtime& rt);

    // Utilitaires
    jsi::Value calculateFFTSize(jsi::Runtime& rt, size_t desiredSize);
    jsi::Value validateConfig(jsi::Runtime& rt, const jsi::Object& config);

    // === Callbacks JavaScript ===
    jsi::Value setDataCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setStateCallback(jsi::Runtime& rt, const jsi::Function& callback);

    // === Installation du module ===
    static jsi::Value install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker);

private:
    // Configuration actuelle
    jsi::Object config_;
    std::atomic<int> currentState_{0}; // 0 = uninitialized

    // Mutex pour la thread safety
    mutable std::mutex spectrumMutex_;
    mutable std::mutex callbackMutex_;

    // Callbacks JavaScript
    struct {
        std::shared_ptr<jsi::Function> dataCallback;
        std::shared_ptr<jsi::Function> errorCallback;
        std::shared_ptr<jsi::Function> stateCallback;
    } jsCallbacks_;

    // Données spectrales actuelles
    std::vector<float> currentMagnitudes_;
    std::vector<float> frequencyBands_;
    double lastTimestamp_;

    // Buffers temporaires
    std::vector<float> audioBuffer_;
    std::vector<float> windowBuffer_;
    std::vector<float> fftRealBuffer_;
    std::vector<float> fftImagBuffer_;

    // Méthodes privées
    bool validateConfigInternal() const;
    int convertError(const std::string& error) const;
    void handleError(int error, const std::string& message);
    void handleStateChange(int oldState, int newState);
    void handleSpectrumData(const std::vector<float>& magnitudes);

    // Conversion JSI <-> Native
    jsi::Object parseSpectrumConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    jsi::Object spectrumConfigToJS(jsi::Runtime& rt, const jsi::Object& config) const;
    jsi::Object spectrumDataToJS(jsi::Runtime& rt, const jsi::Object& data) const;

    // Conversion d'arrays JSI
    std::vector<float> arrayToFloatVector(jsi::Runtime& rt, const jsi::Array& array) const;

    // Traitement FFT
    bool processFFT(const float* audioData, size_t numSamples);
    void applyWindowing(std::vector<float>& buffer);
    void calculateFrequencyBands();
    float calculateMagnitude(float real, float imag);

    // Invocation de callbacks JS sur le thread principal
    void invokeJSCallback(const std::string& callbackName, std::function<void(jsi::Runtime&)> invocation);
};

// === Fonction d'enregistrement du module ===
JSI_EXPORT std::shared_ptr<TurboModule> NativeAudioSpectrumModuleProvider(std::shared_ptr<CallInvoker> jsInvoker);

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_SPECTRUM_ENABLED && __cplusplus
