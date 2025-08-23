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
#define NYTH_AUDIO_SPECTRUM_ENABLED 1
#else
#define NYTH_AUDIO_SPECTRUM_ENABLED 0
#endif

// === API C globale pour l'analyse spectrale ===
#ifdef __cplusplus
extern "C" {
#endif

// === Types d'erreurs du module spectre ===
typedef enum {
    SPECTRUM_ERROR_OK = 0,
    SPECTRUM_ERROR_NOT_INITIALIZED = -1,
    SPECTRUM_ERROR_ALREADY_ANALYZING = -2,
    SPECTRUM_ERROR_ALREADY_STOPPED = -3,
    SPECTRUM_ERROR_FFT_FAILED = -4,
    SPECTRUM_ERROR_INVALID_BUFFER = -5,
    SPECTRUM_ERROR_MEMORY_ERROR = -6,
    SPECTRUM_ERROR_THREAD_ERROR = -7
} NythSpectrumError;

// === États du module spectre ===
typedef enum {
    SPECTRUM_STATE_UNINITIALIZED = 0,
    SPECTRUM_STATE_INITIALIZED,
    SPECTRUM_STATE_ANALYZING,
    SPECTRUM_STATE_ERROR
} NythSpectrumState;

// === Configuration de l'analyse spectrale ===
typedef struct {
    uint32_t sampleRate;
    size_t fftSize;              // Taille FFT (puissance de 2)
    size_t hopSize;              // Pas de déplacement (overlap)
    size_t numBands;             // Nombre de bandes de fréquence
    double minFreq;              // Fréquence minimale (Hz)
    double maxFreq;              // Fréquence maximale (Hz)
    bool useWindowing;           // Utiliser fenêtrage
    bool useSIMD;                // Utiliser SIMD si disponible
} NythSpectrumConfig;

// === Données d'analyse spectrale ===
typedef struct {
    size_t numBands;
    double timestamp;            // Timestamp en ms
    float* magnitudes;           // Tableau des magnitudes (0-1)
    float* frequencies;          // Tableau des fréquences centrales
} NythSpectrumData;

// === Callback pour les données spectrales ===
typedef void (*NythSpectrumDataCallback)(const NythSpectrumData* data);
typedef void (*NythSpectrumErrorCallback)(NythSpectrumError error, const char* message);
typedef void (*NythSpectrumStateCallback)(NythSpectrumState oldState, NythSpectrumState newState);

// === API de gestion du module spectre ===

// === Gestion du cycle de vie ===
bool NythSpectrum_Initialize(const NythSpectrumConfig* config);
bool NythSpectrum_IsInitialized(void);
void NythSpectrum_Release(void);

// === État et informations ===
NythSpectrumState NythSpectrum_GetState(void);
const char* NythSpectrum_GetErrorString(NythSpectrumError error);

// === Configuration ===
bool NythSpectrum_SetConfig(const NythSpectrumConfig* config);
void NythSpectrum_GetConfig(NythSpectrumConfig* config);

// === Analyse spectrale ===
bool NythSpectrum_StartAnalysis(void);
bool NythSpectrum_StopAnalysis(void);
bool NythSpectrum_IsAnalyzing(void);

// === Traitement des données audio ===
bool NythSpectrum_ProcessAudioBuffer(const float* audioBuffer, size_t numSamples);
bool NythSpectrum_ProcessAudioBufferStereo(const float* audioBufferL, const float* audioBufferR, size_t numSamples);

// === Récupération des données ===
bool NythSpectrum_GetSpectrumData(NythSpectrumData* data);
void NythSpectrum_ReleaseSpectrumData(NythSpectrumData* data);

// === Callbacks ===
void NythSpectrum_SetDataCallback(NythSpectrumDataCallback callback);
void NythSpectrum_SetErrorCallback(NythSpectrumErrorCallback callback);
void NythSpectrum_SetStateCallback(NythSpectrumStateCallback callback);

// === Utilitaires ===
size_t NythSpectrum_CalculateFFTSize(size_t desiredSize);
bool NythSpectrum_ValidateConfig(const NythSpectrumConfig* config);

#ifdef __cplusplus
}
#endif

// === Interface C++ pour TurboModule ===
#if NYTH_AUDIO_SPECTRUM_ENABLED && defined(__cplusplus)

// Includes C++ nécessaires pour TurboModule
#include <string>
#include <memory>
#include <functional>
#include <vector>

#include <jsi/jsi.h>
#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModuleUtils.h>
#include <memory>
#include <mutex>
#include <atomic>
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
    jsi::Value processAudioBufferStereo(jsi::Runtime& rt, const jsi::Array& audioBufferL, const jsi::Array& audioBufferR);

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
    NythSpectrumConfig config_;
    std::atomic<NythSpectrumState> currentState_{SPECTRUM_STATE_UNINITIALIZED};

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
    NythSpectrumError convertError(const std::string& error) const;
    void handleError(NythSpectrumError error, const std::string& message);
    void handleStateChange(NythSpectrumState oldState, NythSpectrumState newState);
    void handleSpectrumData(const std::vector<float>& magnitudes);

    // Conversion JSI <-> Native
    NythSpectrumConfig parseSpectrumConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    jsi::Object spectrumConfigToJS(jsi::Runtime& rt, const NythSpectrumConfig& config) const;
    jsi::Object spectrumDataToJS(jsi::Runtime& rt, const NythSpectrumData& data) const;

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
JSI_EXPORT std::shared_ptr<TurboModule> NativeAudioSpectrumModuleProvider(
    std::shared_ptr<CallInvoker> jsInvoker);

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_SPECTRUM_ENABLED && __cplusplus
