#pragma once

// Forward declarations pour Ã©viter les includes inutiles
// Les includes nÃ©cessaires seront faits dans le fichier .cpp

// React Native includes conditionnels pour la compatibilitÃ©
#if defined(__has_include)
#if __has_include(<NythJSI.h>)
#include <NythJSI.h>
#endif
#endif

// VÃ©rification de la disponibilitÃ© de TurboModule
#if defined(__has_include) && __has_include(<ReactCommon/TurboModule.h>) && \
    __has_include(<ReactCommon/TurboModuleUtils.h>)
#define NYTH_AUDIO_EFFECTS_ENABLED 1

// Includes C++ nÃ©cessaires pour TurboModule
#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModuleUtils.h>
#include <jsi/jsi.h>

#include "config/EffectsConfig.h"
#include "../../common/jsi/JSICallbackManager.h"
#include "jsi/EffectsJSIConverter.h"
#include "managers/EffectManager.h"

#else
#define NYTH_AUDIO_EFFECTS_ENABLED 0
#endif

// === Interface C++ pour TurboModule ===
#if NYTH_AUDIO_EFFECTS_ENABLED && defined(__cplusplus)

// Forward declarations (C++ only)

namespace Nyth {
namespace Audio {
    class EffectsConfig;
    namespace Effects {
        enum class EffectType;
    }
}
}

namespace facebook {
namespace react {

// Using declarations pour les types frÃ©quemment utilisÃ©s du namespace Nyth::Audio
using Nyth::Audio::EffectsConfig;
using Nyth::Audio::EffectsConfigValidator;
using Nyth::Audio::Effects::EffectType;

/**
 * @brief Module principal pour les effets audio dans React Native
 *
 * Cette classe fournit une interface JSI pour la gestion des effets audio
 * en temps rÃ©el. Elle hÃ©rite de TurboModule pour une intÃ©gration optimale
 * avec React Native.
 */
class JSI_EXPORT NativeAudioEffectsModule : public TurboModule, public std::enable_shared_from_this<NativeAudioEffectsModule> {
public:
    /**
     * @brief Constructeur du module
     * @param jsInvoker Invoker pour les appels JavaScript
     */
    explicit NativeAudioEffectsModule(std::shared_ptr<CallInvoker> jsInvoker);

    /**
     * @brief Destructeur virtuel
     */
    ~NativeAudioEffectsModule() override;

    // === MÃ©thodes TurboModule ===
    static constexpr auto kModuleName = "NativeAudioEffectsModule";

    // === Cycle de vie ===

    /**
     * @brief Initialise le module et ses composants internes
     * @param rt Runtime JSI
     * @return true si l'initialisation rÃ©ussit, false sinon
     */
    jsi::Value initialize(jsi::Runtime& rt);
    jsi::Value start(jsi::Runtime& rt);
    jsi::Value stop(jsi::Runtime& rt);

    /**
     * @brief VÃ©rifie si le module est initialisÃ©
     * @param rt Runtime JSI
     * @return true si le module est initialisÃ©, false sinon
     */
    jsi::Value isInitialized(jsi::Runtime& rt);

    /**
     * @brief LibÃ¨re les ressources et nettoie le module
     * @param rt Runtime JSI
     * @return true si la libÃ©ration rÃ©ussit, false sinon
     */
    jsi::Value dispose(jsi::Runtime& rt);

    // === Ã‰tat et informations ===

    /**
     * @brief RÃ©cupÃ¨re l'Ã©tat actuel du module
     * @param rt Runtime JSI
     * @return ChaÃ®ne reprÃ©sentant l'Ã©tat (uninitialized, initialized, processing, error)
     */
    jsi::Value getState(jsi::Runtime& rt);

    /**
     * @brief RÃ©cupÃ¨re les statistiques de traitement
     * @param rt Runtime JSI
     * @return Objet contenant les mÃ©triques de traitement ou null
     */
    jsi::Value getStatistics(jsi::Runtime& rt);

    /**
     * @brief RÃ©initialise les statistiques de traitement
     * @param rt Runtime JSI
     * @return true
     */
    jsi::Value resetStatistics(jsi::Runtime& rt);

    // === Gestion des effets ===

    /**
     * @brief CrÃ©e un nouvel effet audio
     * @param rt Runtime JSI
     * @param config Configuration de l'effet (type, paramÃ¨tres)
     * @return ID de l'effet crÃ©Ã© ou -1 en cas d'erreur
     */
    jsi::Value createEffect(jsi::Runtime& rt, const jsi::Object& config);

    /**
     * @brief DÃ©truit un effet audio
     * @param rt Runtime JSI
     * @param effectId ID de l'effet Ã  dÃ©truire
     * @return true si la destruction rÃ©ussit, false sinon
     */
    jsi::Value destroyEffect(jsi::Runtime& rt, int effectId);

    /**
     * @brief Met Ã  jour la configuration d'un effet
     * @param rt Runtime JSI
     * @param effectId ID de l'effet Ã  modifier
     * @param config Nouvelle configuration
     * @return true si la mise Ã  jour rÃ©ussit, false sinon
     */
    jsi::Value updateEffect(jsi::Runtime& rt, int effectId, const jsi::Object& config);

    /**
     * @brief RÃ©cupÃ¨re la configuration actuelle d'un effet
     * @param rt Runtime JSI
     * @param effectId ID de l'effet
     * @return Objet configuration ou null si l'effet n'existe pas
     */
    jsi::Value getEffectConfig(jsi::Runtime& rt, int effectId);

    // === ContrÃ´le des effets ===
    jsi::Value enableEffect(jsi::Runtime& rt, int effectId, bool enabled);
    jsi::Value isEffectEnabled(jsi::Runtime& rt, int effectId);
    jsi::Value getActiveEffectsCount(jsi::Runtime& rt);
    jsi::Value getActiveEffectIds(jsi::Runtime& rt);

    // === ContrÃ´le global ===
    jsi::Value setBypassAll(jsi::Runtime& rt, bool bypass);
    jsi::Value isBypassAll(jsi::Runtime& rt);
    jsi::Value setMasterLevels(jsi::Runtime& rt, float input, float output);
    jsi::Value getMasterLevels(jsi::Runtime& rt);

    // === Traitement audio ===

    /**
     * @brief Traite un buffer audio avec les effets actifs
     * @param rt Runtime JSI
     * @param input Buffer audio d'entrÃ©e (entrelacÃ©)
     * @param channels Nombre de canaux (1 = mono, 2 = stÃ©rÃ©o)
     * @return Buffer audio traitÃ© ou buffer d'entrÃ©e en cas d'erreur
     */
    jsi::Value processAudio(jsi::Runtime& rt, const jsi::Array& input, int channels);

    /**
     * @brief Traite un buffer audio stÃ©rÃ©o sÃ©parÃ© avec les effets actifs
     * @param rt Runtime JSI
     * @param inputL Buffer audio gauche
     * @param inputR Buffer audio droite
     * @return Objet avec les buffers gauche et droite traitÃ©s
     */
    jsi::Value processAudioStereo(jsi::Runtime& rt, const jsi::Array& inputL, const jsi::Array& inputR);

    // === Analyse audio ===
    jsi::Value getInputLevel(jsi::Runtime& rt);
    jsi::Value getOutputLevel(jsi::Runtime& rt);
    jsi::Value getProcessingMetrics(jsi::Runtime& rt);

    // === MÃ©triques spÃ©cifiques par effet ===
    jsi::Value getCompressorMetrics(jsi::Runtime& rt, int effectId);
    jsi::Value getDelayMetrics(jsi::Runtime& rt, int effectId);
    jsi::Value getReverbMetrics(jsi::Runtime& rt, int effectId);

    // === Configuration spÃ©cifique par effet ===
    jsi::Value getCompressorConfig(jsi::Runtime& rt, int effectId);
    jsi::Value getDelayConfig(jsi::Runtime& rt, int effectId);
    jsi::Value getReverbConfig(jsi::Runtime& rt, int effectId);

    // === Informations dÃ©taillÃ©es par effet ===
    jsi::Value getEffectType(jsi::Runtime& rt, int effectId);
    jsi::Value getEffectState(jsi::Runtime& rt, int effectId);
    jsi::Value getEffectLatency(jsi::Runtime& rt, int effectId);

    // === Callbacks JavaScript ===
    jsi::Value setAudioDataCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setStateChangeCallback(jsi::Runtime& rt, const jsi::Function& callback);
    jsi::Value setProcessingCallback(jsi::Runtime& rt, const jsi::Function& callback);

    // === Configuration dÃ©diÃ©e par effet (API alignÃ©e TS) ===
    jsi::Value setCompressorParameters(jsi::Runtime& rt, int effectId, float thresholdDb, float ratio,
                                       float attackMs, float releaseMs, float makeupDb);
    jsi::Value getCompressorParameters(jsi::Runtime& rt, int effectId);
    jsi::Value setDelayParameters(jsi::Runtime& rt, int effectId, float delayMs, float feedback, float mix);
    jsi::Value getDelayParameters(jsi::Runtime& rt, int effectId);

    // === Installation du module ===
    static jsi::Value install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker);

    // === Accès aux gestionnaires internes ===
    std::shared_ptr<EffectManager> getEffectManager() { return effectManager_; }
    std::shared_ptr<JSICallbackManager> getCallbackManager() { return callbackManager_; }

private:
    // === Composants refactorisÃ©s ===
    std::shared_ptr<EffectManager> effectManager_;
    std::shared_ptr<JSICallbackManager> callbackManager_;

    // === Configuration ===
    EffectsConfig config_;

    // === Ã‰tat interne ===
    std::atomic<bool> isInitialized_{false};

    // Ã‰tats du module
    static constexpr int STATE_UNINITIALIZED = 0;
    static constexpr int STATE_INITIALIZED = 1;
    static constexpr int STATE_PROCESSING = 2;
    static constexpr int STATE_ERROR = 3;

    int currentState_ = STATE_UNINITIALIZED;

    // === Gestion du runtime ===
    jsi::Runtime* runtime_ = nullptr;
    std::atomic<bool> runtimeValid_{false};

    // === MÃ©thodes privÃ©es ===
    void initializeManagers();
    void cleanupManagers();
    void setRuntime(jsi::Runtime* rt);
    void invalidateRuntime();

    // === Gestion d'erreurs ===
    void handleError(int error, const std::string& message);
    std::string stateToString(int state) const;
    std::string errorToString(int error) const;

    // === Callbacks ===
    void onProcessingMetrics(const EffectManager::ProcessingMetrics& metrics);
    void onEffectEvent(int effectId, const std::string& event);

    // === JSI Invoker ===
    std::shared_ptr<CallInvoker> jsInvoker_;

    // === Synchronisation ===
    mutable std::mutex mutex_;
};

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_EFFECTS_ENABLED && __cplusplus
