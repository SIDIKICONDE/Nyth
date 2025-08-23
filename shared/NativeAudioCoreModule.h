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
#include <string>
#include <memory>
#include <functional>
#include <vector>

// Vérification de la disponibilité de TurboModule
#if defined(__has_include) && \
    __has_include(<ReactCommon/TurboModule.h>) && \
    __has_include(<ReactCommon/TurboModuleUtils.h>)
#define NYTH_AUDIO_CORE_ENABLED 1
#else
#define NYTH_AUDIO_CORE_ENABLED 0
#endif

// === API C globale pour les composants core ===
#ifdef __cplusplus
extern "C" {
#endif

// === Types d'erreurs du module core ===
typedef enum {
    CORE_ERROR_OK = 0,
    CORE_ERROR_NOT_INITIALIZED = -1,
    CORE_ERROR_ALREADY_RUNNING = -2,
    CORE_ERROR_ALREADY_STOPPED = -3,
    CORE_ERROR_MODULE_ERROR = -4,
    CORE_ERROR_CONFIG_ERROR = -5,
    CORE_ERROR_PROCESSING_FAILED = -6,
    CORE_ERROR_MEMORY_ERROR = -7,
    CORE_ERROR_THREAD_ERROR = -8
} NythCoreError;

// === États du module core ===
typedef enum {
    CORE_STATE_UNINITIALIZED = 0,
    CORE_STATE_INITIALIZED,
    CORE_STATE_PROCESSING,
    CORE_STATE_ERROR
} NythCoreState;

// === Types de filtres ===
typedef enum {
    CORE_FILTER_LOWPASS = 0,
    CORE_FILTER_HIGHPASS,
    CORE_FILTER_BANDPASS,
    CORE_FILTER_NOTCH,
    CORE_FILTER_PEAK,
    CORE_FILTER_LOWSHELF,
    CORE_FILTER_HIGHSHELF,
    CORE_FILTER_ALLPASS
} NythCoreFilterType;

// === Configuration d'un filtre biquad ===
typedef struct {
    double frequency;
    double q;
    double gainDB;
    NythCoreFilterType type;
} NythCoreFilterConfig;

// === Configuration d'une bande d'égaliseur ===
typedef struct {
    size_t bandIndex;
    double frequency;
    double gainDB;
    double q;
    NythCoreFilterType type;
    bool enabled;
} NythCoreBandConfig;

// === Configuration de l'égaliseur ===
typedef struct {
    size_t numBands;
    uint32_t sampleRate;
    double masterGainDB;
    bool bypass;
} NythCoreEqualizerConfig;

// === Informations sur un filtre ===
typedef struct {
    double a0, a1, a2;  // Coefficients feedforward
    double b1, b2;      // Coefficients feedback
    double y1, y2;      // État du filtre
} NythCoreFilterInfo;

// === Informations sur l'égaliseur ===
typedef struct {
    size_t numBands;
    uint32_t sampleRate;
    double masterGainDB;
    bool bypass;
    NythCoreState state;
} NythCoreEqualizerInfo;

// === API de gestion des composants core ===

// === Gestion du cycle de vie ===
bool NythCore_Initialize(void);
bool NythCore_IsInitialized(void);
void NythCore_Release(void);

// === État et informations ===
NythCoreState NythCore_GetState(void);
const char* NythCore_GetErrorString(NythCoreError error);

// === Gestion de l'égaliseur ===

// Initialisation
bool NythCore_EqualizerInitialize(const NythCoreEqualizerConfig* config);
bool NythCore_EqualizerIsInitialized(void);
void NythCore_EqualizerRelease(void);

// Configuration
bool NythCore_EqualizerSetMasterGain(double gainDB);
bool NythCore_EqualizerSetBypass(bool bypass);
bool NythCore_EqualizerSetSampleRate(uint32_t sampleRate);

// Bandes
bool NythCore_EqualizerSetBand(size_t bandIndex, const NythCoreBandConfig* config);
bool NythCore_EqualizerGetBand(size_t bandIndex, NythCoreBandConfig* config);
bool NythCore_EqualizerSetBandGain(size_t bandIndex, double gainDB);
bool NythCore_EqualizerSetBandFrequency(size_t bandIndex, double frequency);
bool NythCore_EqualizerSetBandQ(size_t bandIndex, double q);
bool NythCore_EqualizerSetBandType(size_t bandIndex, NythCoreFilterType type);
bool NythCore_EqualizerSetBandEnabled(size_t bandIndex, bool enabled);

// Informations
void NythCore_EqualizerGetInfo(NythCoreEqualizerInfo* info);
size_t NythCore_EqualizerGetNumBands(void);

// Processing
bool NythCore_EqualizerProcessMono(const float* input, float* output, size_t numSamples);
bool NythCore_EqualizerProcessStereo(const float* inputL, const float* inputR,
                                   float* outputL, float* outputR, size_t numSamples);

// Presets
bool NythCore_EqualizerLoadPreset(const char* presetName);
bool NythCore_EqualizerSavePreset(const char* presetName);
bool NythCore_EqualizerResetAllBands(void);

// === Gestion des filtres biquad individuels ===

// Création/destruction
int64_t NythCore_FilterCreate(void);
bool NythCore_FilterDestroy(int64_t filterId);

// Configuration
bool NythCore_FilterSetConfig(int64_t filterId, const NythCoreFilterConfig* config);
bool NythCore_FilterGetConfig(int64_t filterId, NythCoreFilterConfig* config);

// Types de filtres
bool NythCore_FilterSetLowpass(int64_t filterId, double frequency, double sampleRate, double q);
bool NythCore_FilterSetHighpass(int64_t filterId, double frequency, double sampleRate, double q);
bool NythCore_FilterSetBandpass(int64_t filterId, double frequency, double sampleRate, double q);
bool NythCore_FilterSetNotch(int64_t filterId, double frequency, double sampleRate, double q);
bool NythCore_FilterSetPeaking(int64_t filterId, double frequency, double sampleRate, double q, double gainDB);
bool NythCore_FilterSetLowShelf(int64_t filterId, double frequency, double sampleRate, double q, double gainDB);
bool NythCore_FilterSetHighShelf(int64_t filterId, double frequency, double sampleRate, double q, double gainDB);
bool NythCore_FilterSetAllpass(int64_t filterId, double frequency, double sampleRate, double q);

// Processing
bool NythCore_FilterProcessMono(int64_t filterId, const float* input, float* output, size_t numSamples);
bool NythCore_FilterProcessStereo(int64_t filterId, const float* inputL, const float* inputR,
                                float* outputL, float* outputR, size_t numSamples);

// Informations
bool NythCore_FilterGetInfo(int64_t filterId, NythCoreFilterInfo* info);
bool NythCore_FilterReset(int64_t filterId);

// === Utilitaires de conversion ===

// dB <-> Linéaire
double NythCore_DBToLinear(double db);
double NythCore_LinearToDB(double linear);

// Validation
bool NythCore_ValidateFrequency(double frequency, double sampleRate);
bool NythCore_ValidateQ(double q);
bool NythCore_ValidateGainDB(double gainDB);

// === Gestion de la mémoire ===

// Pools de mémoire
bool NythCore_MemoryInitialize(size_t poolSize);
void NythCore_MemoryRelease(void);
size_t NythCore_MemoryGetAvailable(void);
size_t NythCore_MemoryGetUsed(void);

// === Callbacks (pour usage interne) ===
typedef void (*NythCoreAudioCallback)(const float* data, size_t frameCount, int channels);
typedef void (*NythCoreErrorCallback)(NythCoreError error, const char* message);
typedef void (*NythCoreStateCallback)(NythCoreState oldState, NythCoreState newState);

void NythCore_SetAudioCallback(NythCoreAudioCallback callback);
void NythCore_SetErrorCallback(NythCoreErrorCallback callback);
void NythCore_SetStateCallback(NythCoreStateCallback callback);

#ifdef __cplusplus
}
#endif

// === Interface C++ pour TurboModule ===
#if NYTH_AUDIO_CORE_ENABLED && defined(__cplusplus)

#include <jsi/jsi.h>
#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModuleUtils.h>
#include "Audio/core/AudioEqualizer.hpp"
#include "Audio/core/BiquadFilter.hpp"
#include "Audio/core/MemoryPool.hpp"
#include <mutex>
#include <atomic>
#include <unordered_map>

namespace facebook {
namespace react {

class JSI_EXPORT NativeAudioCoreModule : public TurboModule {
public:
    explicit NativeAudioCoreModule(std::shared_ptr<CallInvoker> jsInvoker);
    ~NativeAudioCoreModule() override;

    // === Méthodes TurboModule ===
    static constexpr auto kModuleName = "NativeAudioCoreModule";

    // === Méthodes synchrones ===

    // Gestion du cycle de vie
    jsi::Value initialize(jsi::Runtime& rt);
    jsi::Value isInitialized(jsi::Runtime& rt);
    jsi::Value dispose(jsi::Runtime& rt);

    // État et informations
    jsi::Value getState(jsi::Runtime& rt);
    jsi::Value getErrorString(jsi::Runtime& rt, int errorCode);

    // === Égaliseur ===

    // Initialisation
    jsi::Value equalizerInitialize(jsi::Runtime& rt, const jsi::Object& config);
    jsi::Value equalizerIsInitialized(jsi::Runtime& rt);
    jsi::Value equalizerRelease(jsi::Runtime& rt);

    // Configuration globale
    jsi::Value equalizerSetMasterGain(jsi::Runtime& rt, double gainDB);
    jsi::Value equalizerSetBypass(jsi::Runtime& rt, bool bypass);
    jsi::Value equalizerSetSampleRate(jsi::Runtime& rt, uint32_t sampleRate);

    // Configuration des bandes
    jsi::Value equalizerSetBand(jsi::Runtime& rt, size_t bandIndex, const jsi::Object& bandConfig);
    jsi::Value equalizerGetBand(jsi::Runtime& rt, size_t bandIndex);
    jsi::Value equalizerSetBandGain(jsi::Runtime& rt, size_t bandIndex, double gainDB);
    jsi::Value equalizerSetBandFrequency(jsi::Runtime& rt, size_t bandIndex, double frequency);
    jsi::Value equalizerSetBandQ(jsi::Runtime& rt, size_t bandIndex, double q);
    jsi::Value equalizerSetBandType(jsi::Runtime& rt, size_t bandIndex, int filterType);
    jsi::Value equalizerSetBandEnabled(jsi::Runtime& rt, size_t bandIndex, bool enabled);

    // Informations
    jsi::Value equalizerGetInfo(jsi::Runtime& rt);
    jsi::Value equalizerGetNumBands(jsi::Runtime& rt);

    // Processing
    jsi::Value equalizerProcessMono(jsi::Runtime& rt, const jsi::Array& input);
    jsi::Value equalizerProcessStereo(jsi::Runtime& rt, const jsi::Array& inputL, const jsi::Array& inputR);

    // Presets
    jsi::Value equalizerLoadPreset(jsi::Runtime& rt, const jsi::String& presetName);
    jsi::Value equalizerSavePreset(jsi::Runtime& rt, const jsi::String& presetName);
    jsi::Value equalizerResetAllBands(jsi::Runtime& rt);

    // === Filtres biquad individuels ===

    // Gestion du cycle de vie
    jsi::Value filterCreate(jsi::Runtime& rt);
    jsi::Value filterDestroy(jsi::Runtime& rt, int64_t filterId);

    // Configuration
    jsi::Value filterSetConfig(jsi::Runtime& rt, int64_t filterId, const jsi::Object& config);
    jsi::Value filterGetConfig(jsi::Runtime& rt, int64_t filterId);

    // Types de filtres
    jsi::Value filterSetLowpass(jsi::Runtime& rt, int64_t filterId, double frequency, double sampleRate, double q);
    jsi::Value filterSetHighpass(jsi::Runtime& rt, int64_t filterId, double frequency, double sampleRate, double q);
    jsi::Value filterSetBandpass(jsi::Runtime& rt, int64_t filterId, double frequency, double sampleRate, double q);
    jsi::Value filterSetNotch(jsi::Runtime& rt, int64_t filterId, double frequency, double sampleRate, double q);
    jsi::Value filterSetPeaking(jsi::Runtime& rt, int64_t filterId, double frequency, double sampleRate, double q, double gainDB);
    jsi::Value filterSetLowShelf(jsi::Runtime& rt, int64_t filterId, double frequency, double sampleRate, double q, double gainDB);
    jsi::Value filterSetHighShelf(jsi::Runtime& rt, int64_t filterId, double frequency, double sampleRate, double q, double gainDB);
    jsi::Value filterSetAllpass(jsi::Runtime& rt, int64_t filterId, double frequency, double sampleRate, double q);

    // Processing
    jsi::Value filterProcessMono(jsi::Runtime& rt, int64_t filterId, const jsi::Array& input);
    jsi::Value filterProcessStereo(jsi::Runtime& rt, int64_t filterId, const jsi::Array& inputL, const jsi::Array& inputR);

    // Informations
    jsi::Value filterGetInfo(jsi::Runtime& rt, int64_t filterId);
    jsi::Value filterReset(jsi::Runtime& rt, int64_t filterId);

    // === Utilitaires ===

    // Conversion dB/linéaire
    jsi::Value dbToLinear(jsi::Runtime& rt, double db);
    jsi::Value linearToDb(jsi::Runtime& rt, double linear);

    // Validation
    jsi::Value validateFrequency(jsi::Runtime& rt, double frequency, double sampleRate);
    jsi::Value validateQ(jsi::Runtime& rt, double q);
    jsi::Value validateGainDB(jsi::Runtime& rt, double gainDB);

    // === Gestion mémoire ===

    jsi::Value memoryInitialize(jsi::Runtime& rt, size_t poolSize);
    jsi::Value memoryRelease(jsi::Runtime& rt);
    jsi::Value memoryGetAvailable(jsi::Runtime& rt);
    jsi::Value memoryGetUsed(jsi::Runtime& rt);

    // === Callbacks JavaScript ===
    jsi::Value setAudioCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setStateCallback(jsi::Runtime& rt, const jsi::Function& callback);

    // === Installation du module ===
    static jsi::Value install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker);

private:
    // Égaliseur principal
    std::unique_ptr<Audio::core::AudioEqualizer> m_equalizer;

    // Pool de filtres biquad individuels
    std::unordered_map<int64_t, std::unique_ptr<AudioFX::BiquadFilter>> m_filters;
    std::atomic<int64_t> m_nextFilterId{1};

    // Gestionnaire de mémoire
    std::unique_ptr<AudioFX::LockFreeMemoryPool<float>> m_memoryPool;

    // Mutex pour la thread safety
    mutable std::mutex m_coreMutex;
    mutable std::mutex m_filterMutex;

    // Callbacks JavaScript
    struct {
        std::shared_ptr<jsi::Function> audioCallback;
        std::shared_ptr<jsi::Function> errorCallback;
        std::shared_ptr<jsi::Function> stateCallback;
    } m_jsCallbacks;

    // État actuel
    std::atomic<NythCoreState> m_currentState{CORE_STATE_UNINITIALIZED};
    
    // Variables de configuration audio
    uint32_t currentSampleRate_;
    int currentChannels_;

    // Méthodes privées
    void initializeEqualizer();
    NythCoreError convertError(const std::string& error) const;
    std::string stateToString(NythCoreState state) const;
    std::string errorToString(NythCoreError error) const;
    NythCoreFilterType stringToFilterType(const std::string& typeStr) const;
    std::string filterTypeToString(NythCoreFilterType type) const;

    // Conversion JSI <-> Native
    NythCoreEqualizerConfig parseEqualizerConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    jsi::Object equalizerConfigToJS(jsi::Runtime& rt, const NythCoreEqualizerConfig& config) const;
    jsi::Object equalizerInfoToJS(jsi::Runtime& rt, const NythCoreEqualizerInfo& info) const;

    NythCoreBandConfig parseBandConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    jsi::Object bandConfigToJS(jsi::Runtime& rt, const NythCoreBandConfig& config) const;

    NythCoreFilterConfig parseFilterConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    jsi::Object filterConfigToJS(jsi::Runtime& rt, const NythCoreFilterConfig& config) const;
    jsi::Object filterInfoToJS(jsi::Runtime& rt, const NythCoreFilterInfo& info) const;

    // Gestion des filtres
    AudioFX::BiquadFilter* getFilter(int64_t filterId);
    bool validateFilterId(int64_t filterId);

    // Conversion des vecteurs
    std::vector<float> arrayToFloatVector(jsi::Runtime& rt, const jsi::Array& array) const;
    jsi::Array floatVectorToArray(jsi::Runtime& rt, const std::vector<float>& vector) const;

    // Gestion des callbacks
    void handleAudioData(const float* data, size_t frameCount, int channels);
    void handleError(NythCoreError error, const std::string& message);
    void handleStateChange(NythCoreState oldState, NythCoreState newState);

    // Invocation de callbacks JS sur le thread principal
    void invokeJSCallback(const std::string& callbackName, std::function<void(jsi::Runtime&)> invocation);
};

// === Fonction d'enregistrement du module ===
JSI_EXPORT std::shared_ptr<TurboModule> NativeAudioCoreModuleProvider(
    std::shared_ptr<CallInvoker> jsInvoker);

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_CORE_ENABLED && __cplusplus
