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
#define NYTH_AUDIO_CORE_ENABLED 1
#else
#define NYTH_AUDIO_CORE_ENABLED 0
#endif

// Définition de fallback pour JSI_EXPORT si <NythJSI.h> n'est pas disponible
#ifndef JSI_EXPORT
#define JSI_EXPORT
#endif

// === Interface C++ pour TurboModule ===
#if NYTH_AUDIO_CORE_ENABLED && defined(__cplusplus)

// Includes C++ nÃ©cessaires pour TurboModule
#include <algorithm>
#include <atomic>
#include <chrono>
#include <functional>
#include <memory>
#include <mutex>
#include <string>
#include <unordered_map>
#include <vector>

#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModuleUtils.h>
#include <jsi/jsi.h>

// Includes des composants refactorisÃ©s
#include "../common/config/AudioConfig.h"
#include "managers/AudioAnalysisManager.h"
#include "managers/EqualizerManager.h"
#include "managers/FilterManager.h"
#include "../common/jsi/JSICallbackManager.h"
#include "jsi/JSIConverter.h"

namespace facebook {
namespace react {

// Using declarations pour les types frÃ©quemment utilisÃ©s du namespace Nyth::Audio
using Nyth::Audio::AudioConfig;
using Nyth::Audio::AudioManager;

// === Module principal refactorisÃ© ===
/**
 * @class NativeAudioCoreModule
 * @brief Module TurboModule principal pour le traitement audio temps rÃ©el
 *
 * Ce module fournit une interface JSI complÃ¨te pour:
 * - Ã‰galisation audio multi-bandes (10 bandes par dÃ©faut)
 * - Filtres biquad individuels (lowpass, highpass, bandpass, etc.)
 * - Analyse audio temps rÃ©el (RMS, peak, frÃ©quences)
 * - Support optimisÃ© des TypedArray pour les performances
 *
 * @note Thread-safe et optimisÃ© pour le traitement temps rÃ©el
 */
class JSI_EXPORT NativeAudioCoreModule : public TurboModule {
public:
    explicit NativeAudioCoreModule(std::shared_ptr<CallInvoker> jsInvoker);
    ~NativeAudioCoreModule() override;

    // === MÃ©thodes TurboModule ===
    static constexpr auto kModuleName = "NativeAudioCoreModule";

    // === Cycle de vie ===
    jsi::Value initialize(jsi::Runtime& rt);
    jsi::Value isInitialized(jsi::Runtime& rt);
    jsi::Value dispose(jsi::Runtime& rt);

    // === Ã‰tat et informations ===
    jsi::Value getState(jsi::Runtime& rt);
    jsi::Value getErrorString(jsi::Runtime& rt, int errorCode);

    // === Ã‰galiseur ===
    jsi::Value equalizerInitialize(jsi::Runtime& rt, const jsi::Object& config);
    jsi::Value equalizerIsInitialized(jsi::Runtime& rt);
    jsi::Value equalizerRelease(jsi::Runtime& rt);

    jsi::Value equalizerSetMasterGain(jsi::Runtime& rt, double gainDB);
    jsi::Value equalizerSetBypass(jsi::Runtime& rt, bool bypass);
    jsi::Value equalizerSetSampleRate(jsi::Runtime& rt, uint32_t sampleRate);

    jsi::Value equalizerSetBand(jsi::Runtime& rt, size_t bandIndex, const jsi::Object& bandConfig);
    jsi::Value equalizerGetBand(jsi::Runtime& rt, size_t bandIndex);
    jsi::Value equalizerSetBandGain(jsi::Runtime& rt, size_t bandIndex, double gainDB);
    jsi::Value equalizerSetBandFrequency(jsi::Runtime& rt, size_t bandIndex, double frequency);
    jsi::Value equalizerSetBandQ(jsi::Runtime& rt, size_t bandIndex, double q);
    jsi::Value equalizerSetBandType(jsi::Runtime& rt, size_t bandIndex, int filterType);
    jsi::Value equalizerSetBandEnabled(jsi::Runtime& rt, size_t bandIndex, bool enabled);

    jsi::Value equalizerGetInfo(jsi::Runtime& rt);
    jsi::Value equalizerGetNumBands(jsi::Runtime& rt);

    jsi::Value equalizerProcessMono(jsi::Runtime& rt, const jsi::Value& input);
    jsi::Value equalizerProcessStereo(jsi::Runtime& rt, const jsi::Value& inputL, const jsi::Value& inputR);

    jsi::Value equalizerLoadPreset(jsi::Runtime& rt, const jsi::String& presetName);
    jsi::Value equalizerSavePreset(jsi::Runtime& rt, const jsi::String& presetName);
    jsi::Value equalizerResetAllBands(jsi::Runtime& rt);

    // === Filtres biquad individuels ===
    jsi::Value filterCreate(jsi::Runtime& rt);
    jsi::Value filterDestroy(jsi::Runtime& rt, int64_t filterId);

    // === Analyse audio ===
    jsi::Value startAnalysis(jsi::Runtime& rt);
    jsi::Value stopAnalysis(jsi::Runtime& rt);
    jsi::Value isAnalyzing(jsi::Runtime& rt);
    jsi::Value getAnalysisMetrics(jsi::Runtime& rt);
    jsi::Value getFrequencyAnalysis(jsi::Runtime& rt);
    jsi::Value setAnalysisConfig(jsi::Runtime& rt, const jsi::Object& config);

    // === Intégration des données audio ===
    jsi::Value pushAudioBuffer(jsi::Runtime& rt, const jsi::Value& buffer, int channels);
    jsi::Value pushAudioBuffersStereo(jsi::Runtime& rt, const jsi::Value& leftBuffer, const jsi::Value& rightBuffer);

    // === Intégration avec le module Capture ===
    jsi::Value setAudioDataCallback(jsi::Runtime& rt, const jsi::Value& callback);
    jsi::Value removeAudioDataCallback(jsi::Runtime& rt);

    jsi::Value filterSetConfig(jsi::Runtime& rt, int64_t filterId, const jsi::Object& config);
    jsi::Value filterGetConfig(jsi::Runtime& rt, int64_t filterId);

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

    jsi::Value filterProcessMono(jsi::Runtime& rt, int64_t filterId, const jsi::Array& input);
    jsi::Value filterProcessStereo(jsi::Runtime& rt, int64_t filterId, const jsi::Array& inputL,
                                   const jsi::Array& inputR);

    jsi::Value filterGetInfo(jsi::Runtime& rt, int64_t filterId);
    jsi::Value filterReset(jsi::Runtime& rt, int64_t filterId);

    // === Utilitaires ===
    jsi::Value dbToLinear(jsi::Runtime& rt, double db);
    jsi::Value linearToDb(jsi::Runtime& rt, double linear);
    jsi::Value validateFrequency(jsi::Runtime& rt, double frequency, double sampleRate);
    jsi::Value validateQ(jsi::Runtime& rt, double q);
    jsi::Value validateGainDB(jsi::Runtime& rt, double gainDB);

    // === Installation du module ===
    static jsi::Value install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker);

private:
    // === Composants refactorisÃ©s ===
    std::unique_ptr<EqualizerManager> equalizerManager_;
    std::unique_ptr<FilterManager> filterManager_;
    std::unique_ptr<AudioAnalysisManager> analysisManager_;
    std::shared_ptr<JSICallbackManager> callbackManager_;

    // === Configuration ===
    AudioConfig config_;

    // === Ã‰tat interne ===
    std::atomic<bool> isInitialized_{false};
    int currentState_ = 0; // 0 = UNINITIALIZED, 1 = INITIALIZED, 2 = PROCESSING, 3 = ERROR

    // === Gestion du runtime ===
    jsi::Runtime* runtime_ = nullptr;
    std::atomic<bool> runtimeValid_{false};

    // === Callback pour l'intégration ===
    jsi::Function audioDataCallback_;

    // === MÃ©thodes privÃ©es ===
    void initializeManagers();
    void cleanupManagers();
    void setRuntime(jsi::Runtime* rt);
    void invalidateRuntime();

    // === Gestion d'erreurs ===
    void handleError(int error, const std::string& message);
    std::string stateToString(int state) const;
    std::string errorToString(int error) const;
    int stringToFilterType(const std::string& typeStr) const;
    std::string filterTypeToString(int type) const;

    // === Helpers pour l'intégration ===
    void invokeAudioDataCallback(const std::vector<float>& audioData, int channels);
};

// === Fonction d'enregistrement du module ===
JSI_EXPORT std::shared_ptr<TurboModule> NativeAudioCoreModuleProvider(std::shared_ptr<CallInvoker> jsInvoker);

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_CORE_ENABLED && __cplusplus
