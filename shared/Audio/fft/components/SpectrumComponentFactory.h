#pragma once

#include <memory>
#include "../../common/jsi/JSICallbackManager.h"
#include "../config/SpectrumConfig.h"
#include "../managers/SpectrumManager.h"

namespace Nyth {
namespace Audio {

// === Factory pour créer et connecter les composants FFT ===

class SpectrumComponentFactory {
public:
    // === Création des composants individuels ===

    /**
     * @brief Crée un gestionnaire d'analyse spectrale
     * @return Unique pointer vers l'interface ISpectrumManager
     */
    static std::unique_ptr<ISpectrumManager> createSpectrumManager();

    /**
     * @brief Crée un gestionnaire de callbacks JSI
     * @param jsInvoker CallInvoker pour l'invocation JavaScript
     * @return Shared pointer vers l'interface IJSICallbackManager
     */
    static std::shared_ptr<IJSICallbackManager> createJSICallbackManager(
        std::shared_ptr<facebook::react::CallInvoker> jsInvoker);

    /**
     * @brief Crée un moteur FFT avec la taille spécifiée
     * @param fftSize Taille de la FFT (doit être une puissance de 2)
     * @return Unique pointer vers l'interface IFFTEngine
     */
    static std::unique_ptr<Nyth::Audio::FX::IFFTEngine> createFFTEngine(size_t fftSize);

    // === Création et connexion complète ===

    /**
     * @brief Crée et connecte tous les composants nécessaires pour l'analyse spectrale
     * @param jsInvoker CallInvoker pour l'invocation JavaScript
     * @param config Configuration initiale pour le système
     * @return Tuple contenant le SpectrumManager et le JSICallbackManager connectés
     */
    static std::tuple<std::unique_ptr<ISpectrumManager>, std::shared_ptr<IJSICallbackManager>>
    createConnectedComponents(std::shared_ptr<facebook::react::CallInvoker> jsInvoker,
                              const SpectrumConfig& config = SpectrumConfig::getDefault());

    // === Utilitaires de validation ===

    /**
     * @brief Valide la compatibilité des composants
     * @param spectrumManager Gestionnaire d'analyse spectrale
     * @param callbackManager Gestionnaire de callbacks
     * @return true si les composants sont compatibles
     */
    static bool validateComponentCompatibility(const ISpectrumManager* spectrumManager,
                                               const IJSICallbackManager* callbackManager);

    /**
     * @brief Vérifie si une taille FFT est valide pour le système
     * @param fftSize Taille à vérifier
     * @return true si la taille est valide
     */
    static bool isValidFFTSize(size_t fftSize);

private:
    // === Méthodes privées ===

    /**
     * @brief Connecte les callbacks entre le SpectrumManager et le JSICallbackManager
     * @param spectrumManager Gestionnaire d'analyse spectrale
     * @param callbackManager Gestionnaire de callbacks
     */
    static void connectCallbacks(ISpectrumManager* spectrumManager, IJSICallbackManager* callbackManager);

    /**
     * @brief Configure les paramètres par défaut des composants
     * @param spectrumManager Gestionnaire à configurer
     * @param config Configuration à appliquer
     */
    static void configureDefaults(ISpectrumManager* spectrumManager, const SpectrumConfig& config);
};

} // namespace Audio
} // namespace Nyth
