#pragma once

#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModuleUtils.h>
#include <atomic>
#include <jsi/jsi.h>
#include <memory>
#include <mutex>

#include "../common/jsi/JSICallbackManager.h"
#include "config/SpectrumConfig.h"
#include "jsi/SpectrumJSIConverter.h"
#include "managers/SpectrumManager.h"

// Forward declarations pour les interfaces
namespace Nyth {
namespace Audio {
class ISpectrumManager;
}
} // namespace Nyth

namespace facebook {
namespace react {

// Using declarations pour les types frÃ©quemment utilisÃ©s du namespace Nyth::Audio
using Nyth::Audio::SpectrumConfig;
using Nyth::Audio::SpectrumError;
using Nyth::Audio::SpectrumState;
using Nyth::Audio::SpectrumData;
using Nyth::Audio::SpectrumManager;
using Nyth::Audio::ISpectrumManager;

// === Module principal refactorisÃ© pour l'analyse spectrale audio ===

class JSI_EXPORT NativeAudioSpectrumModule : public TurboModule {
public:
    explicit NativeAudioSpectrumModule(std::shared_ptr<CallInvoker> jsInvoker);
    ~NativeAudioSpectrumModule() override;

    // === MÃ©thodes TurboModule ===
    static constexpr auto kModuleName = "NativeAudioSpectrumModule";

    // === Cycle de vie ===

    /// @brief Initialise le module d'analyse spectrale avec la configuration fournie
    /// @param rt Runtime JSI pour les opÃ©rations JavaScript
    /// @param config Objet de configuration contenant les paramÃ¨tres FFT
    /// @return jsi::Value(true) si l'initialisation rÃ©ussit, jsi::Value(false) sinon
    jsi::Value initialize(jsi::Runtime& rt, const jsi::Object& config);

    /// @brief VÃ©rifie si le module est correctement initialisÃ©
    /// @param rt Runtime JSI pour les opÃ©rations JavaScript
    /// @return jsi::Value(true) si le module est initialisÃ©
    jsi::Value isInitialized(jsi::Runtime& rt);

    /// @brief LibÃ¨re toutes les ressources du module et arrÃªte l'analyse
    /// @param rt Runtime JSI pour les opÃ©rations JavaScript
    /// @return jsi::Value(true) si la libÃ©ration rÃ©ussit
    jsi::Value release(jsi::Runtime& rt);

    // === Ã‰tat et informations ===

    /// @brief RÃ©cupÃ¨re l'Ã©tat actuel du module
    /// @param rt Runtime JSI pour les opÃ©rations JavaScript
    /// @return Objet contenant l'Ã©tat, isInitialized, isAnalyzing
    jsi::Value getState(jsi::Runtime& rt);

    /// @brief Convertit un code d'erreur en message descriptif
    /// @param rt Runtime JSI pour les opÃ©rations JavaScript
    /// @param errorCode Code d'erreur SpectrumError
    /// @return ChaÃ®ne dÃ©crivant l'erreur
    jsi::Value getErrorString(jsi::Runtime& rt, int errorCode);

    /// @brief RÃ©cupÃ¨re les informations dÃ©taillÃ©es du module
    /// @param rt Runtime JSI pour les opÃ©rations JavaScript
    /// @return Objet contenant version, capacitÃ©s et configuration
    jsi::Value getInfo(jsi::Runtime& rt);

    // === Configuration ===
    jsi::Value setConfig(jsi::Runtime& rt, const jsi::Object& config);
    jsi::Value getConfig(jsi::Runtime& rt);

    // === Traitement audio ===

    /// @brief Traite un buffer audio mono pour l'analyse spectrale
    /// @param rt Runtime JSI pour les opÃ©rations JavaScript
    /// @param audioBuffer Tableau de samples audio (float32)
    /// @return jsi::Value(true) si le traitement rÃ©ussit
    jsi::Value processAudioBuffer(jsi::Runtime& rt, const jsi::Array& audioBuffer);

    /// @brief Traite des buffers audio stÃ©rÃ©o pour l'analyse spectrale
    /// @param rt Runtime JSI pour les opÃ©rations JavaScript
    /// @param audioBufferL Tableau de samples du canal gauche
    /// @param audioBufferR Tableau de samples du canal droit
    /// @return jsi::Value(true) si le traitement rÃ©ussit
    jsi::Value processAudioBufferStereo(jsi::Runtime& rt, const jsi::Array& audioBufferL,
                                        const jsi::Array& audioBufferR);

    // === Analyse et rapports ===
    jsi::Value getLastSpectrumData(jsi::Runtime& rt);
    jsi::Value getStatistics(jsi::Runtime& rt);
    jsi::Value resetStatistics(jsi::Runtime& rt);

    // === ContrÃ´les ===
    jsi::Value startAnalysis(jsi::Runtime& rt);
    jsi::Value stopAnalysis(jsi::Runtime& rt);
    jsi::Value isAnalyzing(jsi::Runtime& rt);

    // === Utilitaires ===
    jsi::Value calculateFFTSize(jsi::Runtime& rt, size_t desiredSize);
    jsi::Value validateConfig(jsi::Runtime& rt, const jsi::Object& config);

    // === Callbacks JavaScript ===

    /// @brief DÃ©finit le callback pour recevoir les donnÃ©es spectrales
    /// @param rt Runtime JSI pour les opÃ©rations JavaScript
    /// @param callback Fonction appelÃ©e avec les donnÃ©es spectrales
    /// @return jsi::Value(true) si l'enregistrement rÃ©ussit
    jsi::Value setDataCallback(jsi::Runtime& rt, const jsi::Function& callback);

    /// @brief DÃ©finit le callback pour les erreurs
    /// @param rt Runtime JSI pour les opÃ©rations JavaScript
    /// @param callback Fonction appelÃ©e lors d'erreurs (code, message)
    /// @return jsi::Value(true) si l'enregistrement rÃ©ussit
    jsi::Value setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback);

    /// @brief DÃ©finit le callback pour les changements d'Ã©tat
    /// @param rt Runtime JSI pour les opÃ©rations JavaScript
    /// @param callback Fonction appelÃ©e lors des transitions d'Ã©tat
    /// @return jsi::Value(true) si l'enregistrement rÃ©ussit
    jsi::Value setStateCallback(jsi::Runtime& rt, const jsi::Function& callback);

    // === Installation du module ===
    static jsi::Value install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker);

private:
    // === Composants refactorisÃ©s ===
    std::unique_ptr<ISpectrumManager> spectrumManager_;
    std::shared_ptr<IJSICallbackManager> callbackManager_;

    // === JS Invoker ===
    std::shared_ptr<CallInvoker> jsInvoker_;

    // === Configuration ===
    SpectrumConfig config_;

    // === Ã‰tat interne ===
    std::atomic<bool> isInitialized_{false};
    std::atomic<bool> isAnalyzing_{false};
    SpectrumState currentState_{SpectrumState::UNINITIALIZED};

    // === Gestion du runtime ===
    jsi::Runtime* runtime_ = nullptr;
    std::atomic<bool> runtimeValid_{false};

    // === Mutex pour thread safety ===
    mutable std::mutex mutex_;

    /// @brief Helper RAII pour gÃ©rer l'Ã©tat avec thread safety
    template<typename T>
    class AtomicStateGuard {
    public:
        AtomicStateGuard(std::atomic<T>& state, T newState)
            : state_(state), oldState_(state.load()) {
            state_.store(newState);
        }
        ~AtomicStateGuard() {
            // Restaurer uniquement si nÃ©cessaire
        }
        T getOldState() const { return oldState_; }
    private:
        std::atomic<T>& state_;
        T oldState_;
    };

    // === MÃ©thodes privÃ©es ===
    void initializeManagers();
    void cleanupManagers();
    void setRuntime(jsi::Runtime* rt);
    void invalidateRuntime();

    // === Gestion d'erreurs ===
    void handleError(SpectrumError error, const std::string& message);
    std::string stateToString(SpectrumState state) const;
    std::string errorToString(SpectrumError error) const;

    // === Callbacks ===
    void onSpectrumData(const SpectrumData& data);
    void onError(SpectrumError error, const std::string& message);
    void onStateChange(SpectrumState oldState, SpectrumState newState);

    // === Validation ===
    bool validateConfig(const SpectrumConfig& config) const;

    // === Utilitaires ===
    void setupCallbacks();
};

} // namespace react
} // namespace facebook
