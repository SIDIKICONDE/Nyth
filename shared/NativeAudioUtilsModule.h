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
#define NYTH_AUDIO_UTILS_ENABLED 1
#else
#define NYTH_AUDIO_UTILS_ENABLED 0
#endif

// === Types d'erreurs d'utilitaires ===
typedef enum {
    UTILS_ERROR_OK = 0,
    UTILS_ERROR_INVALID_BUFFER = -1,
    UTILS_ERROR_INVALID_CHANNEL = -2,
    UTILS_ERROR_INVALID_SAMPLE = -3,
    UTILS_ERROR_OUT_OF_MEMORY = -4,
    UTILS_ERROR_PROCESSING_FAILED = -5
} NythUtilsError;

// === États du système d'utilitaires ===
typedef enum {
    UTILS_STATE_UNINITIALIZED = 0,
    UTILS_STATE_INITIALIZED,
    UTILS_STATE_PROCESSING,
    UTILS_STATE_ERROR
} NythUtilsState;

// === Configuration du buffer audio ===
typedef struct {
    size_t numChannels;
    size_t numSamples;
    bool useSIMD;          // Utiliser les optimisations SIMD
    bool enableValidation; // Activer la validation des buffers
    size_t alignment;      // Alignement mémoire
} NythAudioBufferConfig;

// === Informations du buffer ===
typedef struct {
    size_t numChannels;
    size_t numSamples;
    size_t totalSizeBytes;
    size_t alignment;
    bool isValid;
    bool hasSIMD;
} NythAudioBufferInfo;

// === Statistiques du buffer ===
typedef struct {
    float peakLevel;
    float rmsLevel;
    float dcOffset;
    size_t clippedSamples;
    bool hasNaN;
    bool hasInf;
} NythAudioBufferStats;

// === Configuration d'opération ===
typedef struct {
    size_t channel;
    size_t startSample;
    size_t numSamples;
    float gain;
    float startGain;
    float endGain;
} NythBufferOperationConfig;

// === Interface C++ pour TurboModule ===
#if NYTH_AUDIO_UTILS_ENABLED && defined(__cplusplus)

// Includes C++ nécessaires pour TurboModule
#include <functional>
#include <memory>
#include <string>
#include <vector>

#include "Audio/utils/AudioBuffer.hpp"
#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModuleUtils.h>
#include <atomic>
#include <jsi/jsi.h>
#include <mutex>
#include <queue>

namespace facebook {
namespace react {

class JSI_EXPORT NativeAudioUtilsModule : public TurboModule {
public:
    explicit NativeAudioUtilsModule(std::shared_ptr<CallInvoker> jsInvoker)
        : TurboModule("NativeAudioUtilsModule", jsInvoker) {}
    ~NativeAudioUtilsModule() override;

    // === Méthodes TurboModule ===
    static constexpr auto kModuleName = "NativeAudioUtilsModule";

    // === Méthodes synchrones ===

    // Gestion du cycle de vie du buffer
    jsi::Value createBuffer(jsi::Runtime& rt, size_t numChannels, size_t numSamples);
    jsi::Value destroyBuffer(jsi::Runtime& rt);
    jsi::Value isBufferValid(jsi::Runtime& rt);

    // Informations du buffer
    jsi::Value getBufferInfo(jsi::Runtime& rt);
    jsi::Value getBufferStats(jsi::Runtime& rt, size_t channel, size_t startSample, size_t numSamples);

    // Opérations de base
    jsi::Value clearBuffer(jsi::Runtime& rt);
    jsi::Value clearChannel(jsi::Runtime& rt, size_t channel);
    jsi::Value clearRange(jsi::Runtime& rt, size_t channel, size_t startSample, size_t numSamples);

    // Opérations de copie
    jsi::Value copyFromBuffer(jsi::Runtime& rt);
    jsi::Value copyFromChannel(jsi::Runtime& rt, size_t destChannel, size_t destStartSample, size_t srcChannel,
                               size_t srcStartSample, size_t numSamples);
    jsi::Value copyFromArray(jsi::Runtime& rt, size_t destChannel, const jsi::Array& source);

    // Opérations de mixage
    jsi::Value addFrom(jsi::Runtime& rt, size_t destChannel, const jsi::Array& source, float gain);
    jsi::Value addFromBuffer(jsi::Runtime& rt, float gain);

    // Opérations de gain
    jsi::Value applyGain(jsi::Runtime& rt, size_t channel, float gain);
    jsi::Value applyGainRange(jsi::Runtime& rt, size_t channel, size_t startSample, size_t numSamples, float gain);
    jsi::Value applyGainRamp(jsi::Runtime& rt, size_t channel, size_t startSample, size_t numSamples, float startGain,
                             float endGain);

    // Analyse du signal
    jsi::Value getMagnitude(jsi::Runtime& rt, size_t channel, size_t startSample, size_t numSamples);
    jsi::Value getRMSLevel(jsi::Runtime& rt, size_t channel, size_t startSample, size_t numSamples);

    // Accès direct aux données
    jsi::Value getChannelData(jsi::Runtime& rt, size_t channel);
    jsi::Value setChannelData(jsi::Runtime& rt, size_t channel, const jsi::Array& data);

    // Utilitaires de conversion
    jsi::Value dbToLinear(jsi::Runtime& rt, float db);
    jsi::Value linearToDb(jsi::Runtime& rt, float linear);
    jsi::Value dbToLinearDouble(jsi::Runtime& rt, double db);
    jsi::Value linearToDbDouble(jsi::Runtime& rt, double linear);

    // Informations système
    jsi::Value getMaxChannels(jsi::Runtime& rt);
    jsi::Value getMaxSamples(jsi::Runtime& rt);
    jsi::Value getSIMDAlignment(jsi::Runtime& rt);
    jsi::Value hasSIMDSupport(jsi::Runtime& rt);
    jsi::Value getPlatformInfo(jsi::Runtime& rt);

    // === Callbacks JavaScript ===
    jsi::Value setBufferCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setStateChangeCallback(jsi::Runtime& rt, const jsi::Function& callback);

    // === Installation du module ===
    static jsi::Value install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker);

private:
    // Buffer audio principal
    std::unique_ptr<AudioUtils::AudioBuffer> audioBuffer_;

    // Mutex pour la thread safety
    mutable std::mutex utilsMutex_;
    mutable std::mutex callbackMutex_;

    // Callbacks JavaScript
    struct {
        std::shared_ptr<jsi::Function> bufferCallback;
        std::shared_ptr<jsi::Function> errorCallback;
        std::shared_ptr<jsi::Function> stateChangeCallback;
    } jsCallbacks_;

    // État actuel
    std::atomic<NythUtilsState> currentState_{UTILS_STATE_UNINITIALIZED};

    // Buffers temporaires pour les conversions JSI
    std::vector<float> tempBuffer_;

    // Méthodes privées
    bool validateBuffer() const;
    bool validateChannel(size_t channel) const;
    bool validateRange(size_t channel, size_t startSample, size_t numSamples) const;
    NythUtilsError convertError(const std::string& error) const;
    void handleBufferOperation(const std::string& operation, bool success);
    void handleError(NythUtilsError error, const std::string& message);
    void handleStateChange(NythUtilsState oldState, NythUtilsState newState);

    // Conversion JSI <-> Native
    NythAudioBufferInfo getBufferInfoInternal() const;
    NythAudioBufferStats getBufferStatsInternal(size_t channel, size_t startSample, size_t numSamples) const;
    jsi::Object bufferInfoToJS(jsi::Runtime& rt, const NythAudioBufferInfo& info) const;
    jsi::Object bufferStatsToJS(jsi::Runtime& rt, const NythAudioBufferStats& stats) const;

    // Conversion d'arrays JSI
    std::vector<float> arrayToFloatVector(jsi::Runtime& rt, const jsi::Array& array) const;
    jsi::Array floatVectorToArray(jsi::Runtime& rt, const std::vector<float>& vector) const;

    // Invocation de callbacks JS sur le thread principal
    void invokeJSCallback(const std::string& callbackName, std::function<void(jsi::Runtime&)> invocation);

    // Conversion d'état en string
    std::string stateToString(NythUtilsState state) const;
};

// === Fonction d'enregistrement du module ===
JSI_EXPORT std::shared_ptr<TurboModule> NativeAudioUtilsModuleProvider(std::shared_ptr<CallInvoker> jsInvoker);

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_UTILS_ENABLED && __cplusplus
