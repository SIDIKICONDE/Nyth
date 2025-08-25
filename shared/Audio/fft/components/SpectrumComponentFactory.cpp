#include "SpectrumComponentFactory.h"

#include "../../common/dsp/FFTEngine.hpp"
#include <tuple>


namespace Nyth {
namespace Audio {

// === Implémentation de la factory ===

std::unique_ptr<ISpectrumManager> SpectrumComponentFactory::createSpectrumManager() {
    return std::make_unique<SpectrumManager>();
}

std::shared_ptr<IJSICallbackManager> SpectrumComponentFactory::createJSICallbackManager(
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
    return std::make_shared<JSICallbackManager>(jsInvoker);
}

std::unique_ptr<Nyth::Audio::FX::IFFTEngine> SpectrumComponentFactory::createFFTEngine(size_t fftSize) {
    if (!isValidFFTSize(fftSize)) {
        throw std::invalid_argument("Invalid FFT size: must be a power of 2 between " +
                                    std::to_string(SpectrumConstants::MIN_FFT_SIZE) + " and " +
                                    std::to_string(SpectrumConstants::MAX_FFT_SIZE));
    }
    return Nyth::Audio::FX::createFFTEngine(fftSize);
}

std::tuple<std::unique_ptr<ISpectrumManager>, std::shared_ptr<IJSICallbackManager>>
SpectrumComponentFactory::createConnectedComponents(std::shared_ptr<facebook::react::CallInvoker> jsInvoker,
                                                    const SpectrumConfig& config) {
    // Création des composants
    auto spectrumManager = createSpectrumManager();
    auto callbackManager = createJSICallbackManager(jsInvoker);

    // Connexion des callbacks
    connectCallbacks(spectrumManager.get(), callbackManager.get());

    // Configuration des paramètres par défaut
    configureDefaults(spectrumManager.get(), config);

    // Validation de la compatibilité
    if (!validateComponentCompatibility(spectrumManager.get(), callbackManager.get())) {
        throw std::runtime_error("Incompatible components created");
    }

    return std::make_tuple(std::move(spectrumManager), std::move(callbackManager));
}

bool SpectrumComponentFactory::validateComponentCompatibility(const ISpectrumManager* spectrumManager,
                                                              const IJSICallbackManager* callbackManager) {
    if (!spectrumManager || !callbackManager) {
        return false;
    }

    // Vérifier que les composants sont dans un état cohérent
    return spectrumManager->getState() == SpectrumState::UNINITIALIZED;
}

bool SpectrumComponentFactory::isValidFFTSize(size_t fftSize) {
    if (fftSize < SpectrumConstants::MIN_FFT_SIZE || fftSize > SpectrumConstants::MAX_FFT_SIZE) {
        return false;
    }

    // Vérifier que c'est une puissance de 2
    return (fftSize & (fftSize - 1)) == 0;
}

void SpectrumComponentFactory::connectCallbacks(ISpectrumManager* spectrumManager,
                                                IJSICallbackManager* callbackManager) {
    // Connexion du callback de données spectrales
    spectrumManager->setDataCallback([callbackManager](const SpectrumData& data) {
        // Conversion des données spectrales vers JSI
        // Cette connexion sera complétée dans le module principal
        // où nous avons accès au runtime JSI
    });

    // Connexion du callback d'erreur
    spectrumManager->setErrorCallback([callbackManager](SpectrumError error, const std::string& message) {
        callbackManager->invokeErrorCallback(message);
    });

    // Connexion du callback de changement d'état
    spectrumManager->setStateCallback([callbackManager](SpectrumState oldState, SpectrumState newState) {
        std::string oldStateStr = stateToString(oldState);
        std::string newStateStr = stateToString(newState);
        callbackManager->invokeStateChangeCallback(oldStateStr, newStateStr);
    });
}

void SpectrumComponentFactory::configureDefaults(ISpectrumManager* spectrumManager, const SpectrumConfig& config) {
    // Configuration avec les paramètres par défaut
    if (!spectrumManager->setConfig(config)) {
        throw std::runtime_error("Failed to configure spectrum manager with default settings");
    }
}

} // namespace Audio
} // namespace Nyth
