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
#define NYTH_AUDIO_CORE_ENABLED 1
#else
#define NYTH_AUDIO_CORE_ENABLED 0
#endif

// === Interface C++ pour TurboModule ===
#if NYTH_AUDIO_CORE_ENABLED && defined(__cplusplus)

// Includes C++ nécessaires pour TurboModule
#include <functional>
#include <memory>
#include <string>
#include <vector>

#include "Audio/core/AudioEqualizer.hpp"
#include "Audio/core/AudioError.hpp"
#include "Audio/core/BiquadFilter.hpp"
#include "Audio/core/MemoryPool.hpp"
#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModuleUtils.h>
#include <atomic>
#include <jsi/jsi.h>
#include <mutex>
#include <unordered_map>

namespace facebook {
namespace react {

class JSI_EXPORT NativeAudioCoreModule : public TurboModule {
public:
    explicit NativeAudioCoreModule(std::shared_ptr<CallInvoker> jsInvoker)
        : TurboModule("NativeAudioCoreModule", jsInvoker) {
        currentSampleRate_ = 44100;
        currentChannels_ = 2;
    }
    ~NativeAudioCoreModule() override;

    // === Méthodes TurboModule ===
    static constexpr auto kModuleName = "NativeAudioCoreModule";

    // === Méthodes synchrones ===

    // Gestion du cycle de vie
    void initialize(jsi::Runtime& rt);
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
    jsi::Value filterSetPeaking(jsi::Runtime& rt, int64_t filterId, double frequency, double sampleRate, double q,
                                double gainDB);
    jsi::Value filterSetLowShelf(jsi::Runtime& rt, int64_t filterId, double frequency, double sampleRate, double q,
                                 double gainDB);
    jsi::Value filterSetHighShelf(jsi::Runtime& rt, int64_t filterId, double frequency, double sampleRate, double q,
                                  double gainDB);
    jsi::Value filterSetAllpass(jsi::Runtime& rt, int64_t filterId, double frequency, double sampleRate, double q);

    // Processing
    jsi::Value filterProcessMono(jsi::Runtime& rt, int64_t filterId, const jsi::Array& input);
    jsi::Value filterProcessStereo(jsi::Runtime& rt, int64_t filterId, const jsi::Array& inputL,
                                   const jsi::Array& inputR);

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

    // === Fonctions utilitaires supplémentaires ===
    jsi::Value getAvailablePresets(jsi::Runtime& rt);

    // === Contrôle de performance ===
    jsi::Value enableSIMD(jsi::Runtime& rt, bool enable);
    jsi::Value enableOptimizedProcessing(jsi::Runtime& rt, bool enable);
    jsi::Value enableThreadSafe(jsi::Runtime& rt, bool enable);
    jsi::Value getCapabilities(jsi::Runtime& rt);

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
    std::atomic<int> m_currentState{0}; // 0 = UNINITIALIZED

    // Variables de configuration audio
    uint32_t currentSampleRate_;
    int currentChannels_;

    // Runtime JSI pour les callbacks
    jsi::Runtime* m_runtime{nullptr};

    // Méthodes privées
    void initializeEqualizer();
    int convertError(const std::string& error) const;
    std::string stateToString(int state) const;
    std::string errorToString(int error) const;
    int stringToFilterType(const std::string& typeStr) const;
    std::string filterTypeToString(int type) const;

    // Conversion JSI <-> Native
    struct EqualizerConfig {
        size_t numBands;
        uint32_t sampleRate;
        double masterGainDB;
        bool bypass;
    };

    struct BandConfig {
        size_t bandIndex;
        double frequency;
        double gainDB;
        double q;
        int type;
        bool enabled;
    };

    struct FilterConfig {
        double frequency;
        double q;
        double gainDB;
        int type;
    };

    EqualizerConfig parseEqualizerConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    jsi::Object equalizerConfigToJS(jsi::Runtime& rt, const EqualizerConfig& config) const;
    jsi::Object equalizerInfoToJS(jsi::Runtime& rt, const EqualizerConfig& config) const;

    BandConfig parseBandConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    jsi::Object bandConfigToJS(jsi::Runtime& rt, const BandConfig& config) const;

    FilterConfig parseFilterConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    jsi::Object filterConfigToJS(jsi::Runtime& rt, const FilterConfig& config) const;
    jsi::Object filterInfoToJS(jsi::Runtime& rt, const FilterConfig& config) const;

    // Gestion des filtres
    AudioFX::BiquadFilter* getFilter(int64_t filterId);
    bool validateFilterId(int64_t filterId);

    // Conversion des vecteurs
    std::vector<float> arrayToFloatVector(jsi::Runtime& rt, const jsi::Array& array) const;
    jsi::Array floatVectorToArray(jsi::Runtime& rt, const std::vector<float>& vector) const;

    // Gestion des callbacks
    void handleAudioData(const float* data, size_t frameCount, int channels);
    void handleError(int error, const std::string& message);
    void handleStateChange(int oldState, int newState);

    // Invocation de callbacks JS sur le thread principal
    void invokeJSCallback(const std::string& callbackName, std::function<void(jsi::Runtime&)> invocation);

    // Gestion d'erreurs avancée avec AudioError
    void handleErrorWithAudioError(AudioFX::AudioError error, const std::string& context);

    // Traitement audio avec sélection automatique du meilleur algorithme
    void processAudioWithBestAlgorithm(const float* input, float* output, size_t numSamples);
};

// === Fonction d'enregistrement du module ===
JSI_EXPORT std::shared_ptr<TurboModule> NativeAudioCoreModuleProvider(std::shared_ptr<CallInvoker> jsInvoker);

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_CORE_ENABLED && __cplusplus
