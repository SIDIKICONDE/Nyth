#pragma once

// Includes conditionnels pour la compatibilité
#if defined(__has_include)
#if __has_include(<NythJSI.h>)
#include <NythJSI.h>
#endif
#endif

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

// Vérification de la disponibilité de TurboModule
#if defined(__has_include) && __has_include(<ReactCommon/TurboModule.h>) && \
    __has_include(<ReactCommon/TurboModuleUtils.h>)
#define NYTH_AUDIO_NOISE_ENABLED 1
#else
#define NYTH_AUDIO_NOISE_ENABLED 0
#endif

// === API C globale pour les effets de bruit ===
#ifdef __cplusplus
extern "C" {
#endif

// === Types d'algorithmes de réduction de bruit ===
typedef enum {
    NOISE_ALGORITHM_SPECTRAL_SUBTRACTION = 0,
    NOISE_ALGORITHM_WIENER_FILTER,
    NOISE_ALGORITHM_MULTIBAND,
    NOISE_ALGORITHM_TWO_STEP,
    NOISE_ALGORITHM_HYBRID,
    NOISE_ALGORITHM_ADVANCED_SPECTRAL
} NythNoiseAlgorithm;

// === Méthodes d'estimation de bruit ===
typedef enum { NOISE_ESTIMATION_SIMPLE = 0, NOISE_ESTIMATION_MCRA, NOISE_ESTIMATION_IMCRA } NythNoiseEstimationMethod;

// === État du système de bruit ===
typedef enum {
    NOISE_STATE_UNINITIALIZED = 0,
    NOISE_STATE_INITIALIZED,
    NOISE_STATE_PROCESSING,
    NOISE_STATE_ERROR
} NythNoiseState;

// === Configuration de réduction de bruit ===
typedef struct {
    NythNoiseAlgorithm algorithm;
    NythNoiseEstimationMethod noiseMethod;
    uint32_t sampleRate;
    int channels;
    size_t fftSize;
    size_t hopSize;
    float aggressiveness; // 0.0 - 3.0
    bool enableMultiband;
    bool preserveTransients;
    bool reduceMusicalNoise;
    // Paramètres avancés
    struct {
        float beta;               // Over-subtraction factor
        float floorGain;          // Spectral floor
        float noiseUpdateRate;    // Noise estimation smoothing
        float speechThreshold;    // Speech detection threshold
        float transientThreshold; // Transient detection
    } advanced;
} NythNoiseConfig;

// === Statistiques de réduction de bruit ===
typedef struct {
    float inputLevel;
    float outputLevel;
    float estimatedSNR;
    float noiseReductionDB;
    uint32_t processedFrames;
    uint64_t processedSamples;
    int64_t durationMs;
    float speechProbability;
    float musicalNoiseLevel;
} NythNoiseStatistics;

// === Configuration IMCRA ===
typedef struct {
    size_t fftSize;
    uint32_t sampleRate;
    double alphaS;  // Lissage spectral
    double alphaD;  // Lissage bruit
    double alphaD2; // Lissage minima
    double betaMax; // Correction biais max
    double gamma0;  // Seuil SNR
    double gamma1;  // Seuil secondaire
    double zeta0;   // Seuil SNR a priori
    size_t windowLength;
    size_t subWindowLength;
} NythIMCRAConfig;

// === Configuration Wiener ===
typedef struct {
    size_t fftSize;
    uint32_t sampleRate;
    double alpha;   // Smoothing factor
    double minGain; // Gain minimum
    double maxGain; // Gain maximum
    bool useLSA;    // Log-Spectral Amplitude
    double gainSmoothing;
    double frequencySmoothing;
    bool usePerceptualWeighting;
} NythWienerConfig;

// === Configuration Multi-bandes ===
typedef struct {
    uint32_t sampleRate;
    size_t fftSize;
    float subBassReduction;
    float bassReduction;
    float lowMidReduction;
    float midReduction;
    float highMidReduction;
    float highReduction;
    float ultraHighReduction;
} NythMultibandConfig;

// === API de gestion du bruit ===
bool NythNoise_Initialize(const NythNoiseConfig* config);
bool NythNoise_Start(void);
bool NythNoise_Stop(void);
void NythNoise_Release(void);

// === État et informations ===
NythNoiseState NythNoise_GetState(void);
void NythNoise_GetStatistics(NythNoiseStatistics* stats);
void NythNoise_ResetStatistics(void);

// === Configuration ===
void NythNoise_GetConfig(NythNoiseConfig* config);
bool NythNoise_UpdateConfig(const NythNoiseConfig* config);
bool NythNoise_SetAlgorithm(NythNoiseAlgorithm algorithm);
bool NythNoise_SetAggressiveness(float aggressiveness);

// === Traitement audio ===
bool NythNoise_ProcessAudio(const float* input, float* output, size_t frameCount, int channels);
bool NythNoise_ProcessAudioStereo(const float* inputL, const float* inputR, float* outputL, float* outputR,
                                  size_t frameCount);

// === Analyse audio ===
float NythNoise_GetInputLevel(void);
float NythNoise_GetOutputLevel(void);
float NythNoise_GetEstimatedSNR(void);
float NythNoise_GetSpeechProbability(void);
float NythNoise_GetMusicalNoiseLevel(void);

// === Contrôle avancé ===

// IMCRA
bool NythNoise_InitializeIMCRA(const NythIMCRAConfig* config);
void NythNoise_GetIMCRAConfig(NythIMCRAConfig* config);
bool NythNoise_UpdateIMCRAConfig(const NythIMCRAConfig* config);

// Wiener
bool NythNoise_InitializeWiener(const NythWienerConfig* config);
void NythNoise_GetWienerConfig(NythWienerConfig* config);
bool NythNoise_UpdateWienerConfig(const NythWienerConfig* config);

// Multi-bandes
bool NythNoise_InitializeMultiband(const NythMultibandConfig* config);
void NythNoise_GetMultibandConfig(NythMultibandConfig* config);
bool NythNoise_UpdateMultibandConfig(const NythMultibandConfig* config);

// === Callbacks (pour usage interne) ===
typedef void (*NythNoiseDataCallback)(const float* input, float* output, size_t frameCount, int channels);
typedef void (*NythNoiseErrorCallback)(const char* error);
typedef void (*NythNoiseStateChangeCallback)(NythNoiseState oldState, NythNoiseState newState);

void NythNoise_SetAudioDataCallback(NythNoiseDataCallback callback);
void NythNoise_SetErrorCallback(NythNoiseErrorCallback callback);
void NythNoise_SetStateChangeCallback(NythNoiseStateChangeCallback callback);

#ifdef __cplusplus
}
#endif

// === Interface C++ pour TurboModule ===
#if NYTH_AUDIO_NOISE_ENABLED && defined(__cplusplus)

// Includes C++ nécessaires pour TurboModule
#include <functional>
#include <map>
#include <memory>
#include <string>
#include <vector>

#include "Audio/noise/AdvancedSpectralNR.hpp"
#include "Audio/noise/IMCRA.hpp"
#include "Audio/noise/MultibandProcessor.hpp"
#include "Audio/noise/NoiseReducer.hpp"
#include "Audio/noise/RNNoiseSuppressor.hpp"
#include "Audio/noise/WienerFilter.hpp"
#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModuleUtils.h>
#include <atomic>
#include <jsi/jsi.h>
#include <mutex>
#include <queue>

namespace facebook {
namespace react {

class JSI_EXPORT NativeAudioNoiseModule : public TurboModule {
public:
    explicit NativeAudioNoiseModule(std::shared_ptr<CallInvoker> jsInvoker)
        : TurboModule("NativeAudioNoiseModule", jsInvoker), jsInvoker_(jsInvoker) {
        currentConfig_.sampleRate = 48000;
        currentConfig_.channels = 2;
        currentConfig_.fftSize = 2048;
        currentConfig_.hopSize = 512;
        currentConfig_.algorithm = NOISE_ALGORITHM_ADVANCED_SPECTRAL;
        currentConfig_.noiseMethod = NOISE_ESTIMATION_IMCRA;
        currentConfig_.aggressiveness = 0.7f;
        currentConfig_.enableMultiband = true;
        currentConfig_.preserveTransients = true;
        currentConfig_.reduceMusicalNoise = true;
    }
    ~NativeAudioNoiseModule() override;

    // === Méthodes TurboModule ===
    static constexpr auto kModuleName = "NativeAudioNoiseModule";

    // === Méthodes synchrones ===

    // Gestion du cycle de vie
    jsi::Value initialize(jsi::Runtime& rt, const jsi::Object& config);
    jsi::Value start(jsi::Runtime& rt);
    jsi::Value stop(jsi::Runtime& rt);
    jsi::Value dispose(jsi::Runtime& rt);

    // État et informations
    jsi::Value getState(jsi::Runtime& rt);
    jsi::Value getStatistics(jsi::Runtime& rt);
    jsi::Value resetStatistics(jsi::Runtime& rt);

    // Configuration
    jsi::Value getConfig(jsi::Runtime& rt);
    jsi::Value updateConfig(jsi::Runtime& rt, const jsi::Object& config);
    jsi::Value setAlgorithm(jsi::Runtime& rt, const jsi::String& algorithm);
    jsi::Value setAggressiveness(jsi::Runtime& rt, float aggressiveness);

    // Traitement audio
    jsi::Value processAudio(jsi::Runtime& rt, const jsi::Array& input, int channels);
    jsi::Value processAudioStereo(jsi::Runtime& rt, const jsi::Array& inputL, const jsi::Array& inputR);

    // Analyse audio
    jsi::Value getInputLevel(jsi::Runtime& rt);
    jsi::Value getOutputLevel(jsi::Runtime& rt);
    jsi::Value getEstimatedSNR(jsi::Runtime& rt);
    jsi::Value getSpeechProbability(jsi::Runtime& rt);
    jsi::Value getMusicalNoiseLevel(jsi::Runtime& rt);

    // Configuration avancée
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
    // Systèmes de réduction de bruit
    std::unique_ptr<AudioNR::AdvancedSpectralNR> advancedSpectralNR_;
    std::unique_ptr<AudioNR::IMCRA> imcra_;
    std::unique_ptr<AudioNR::WienerFilter> wienerFilter_;
    std::unique_ptr<AudioNR::MultibandProcessor> multibandProcessor_;
    std::unique_ptr<AudioNR::NoiseReducer> noiseReducer_;
    std::unique_ptr<AudioNR::RNNoiseSuppressor> rnNoiseSuppressor_;

    // CallInvoker pour les callbacks JavaScript
    std::shared_ptr<CallInvoker> jsInvoker_;

    // Mutex pour la thread safety
    mutable std::mutex noiseMutex_;
    mutable std::mutex callbackMutex_;

    // Callbacks JavaScript
    struct {
        std::shared_ptr<jsi::Function> audioDataCallback;
        std::shared_ptr<jsi::Function> errorCallback;
        std::shared_ptr<jsi::Function> stateChangeCallback;
    } jsCallbacks_;

    // Configuration actuelle
    NythNoiseConfig currentConfig_;
    std::atomic<NythNoiseState> currentState_{NOISE_STATE_UNINITIALIZED};

    // Statistiques
    NythNoiseStatistics currentStats_;

    // Méthodes privées
    void initializeNoiseSystem(const NythNoiseConfig& config);
    NythNoiseAlgorithm stringToAlgorithm(const std::string& algorithmStr) const;
    std::string algorithmToString(NythNoiseAlgorithm algorithm) const;
    std::string stateToString(NythNoiseState state) const;
    void handleAudioData(const float* input, float* output, size_t frameCount, int channels);
    void handleError(const std::string& error);
    void handleStateChange(NythNoiseState oldState, NythNoiseState newState);

    // Conversion JSI <-> Native
    NythNoiseConfig parseNoiseConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    jsi::Object noiseConfigToJS(jsi::Runtime& rt, const NythNoiseConfig& config);
    jsi::Object statisticsToJS(jsi::Runtime& rt, const NythNoiseStatistics& stats);

    NythIMCRAConfig parseIMCRAConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    jsi::Object imcraConfigToJS(jsi::Runtime& rt, const NythIMCRAConfig& config);

    NythWienerConfig parseWienerConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    jsi::Object wienerConfigToJS(jsi::Runtime& rt, const NythWienerConfig& config);

    NythMultibandConfig parseMultibandConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    jsi::Object multibandConfigToJS(jsi::Runtime& rt, const NythMultibandConfig& config);

    // Invocation de callbacks JS sur le thread principal
    void invokeJSCallback(const std::string& callbackName, std::function<void(jsi::Runtime&)> invocation);
};

// === Fonction d'enregistrement du module ===
JSI_EXPORT std::shared_ptr<TurboModule> NativeAudioNoiseModuleProvider(std::shared_ptr<CallInvoker> jsInvoker);

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_NOISE_ENABLED && __cplusplus
