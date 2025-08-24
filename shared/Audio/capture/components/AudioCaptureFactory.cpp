#include "AudioCapture.hpp"
#include "AudioCaptureImpl.hpp"
#include <stdexcept>
#include <string>

namespace Nyth {
namespace Audio {

// === Implémentation de la factory AudioCapture ===

// Factory method pour créer une instance selon la plateforme
std::unique_ptr<AudioCapture> AudioCapture::create() {
    AudioCaptureConfig defaultConfig;
    return create(defaultConfig);
}

// Factory method avec configuration spécifique
std::unique_ptr<AudioCapture> AudioCapture::create(const AudioCaptureConfig& config) {
    std::unique_ptr<AudioCapture> instance = nullptr;

// === Détection de la plateforme et création de l'instance appropriée ===

// Android
#ifdef __ANDROID__
    {
        instance = std::make_unique<AudioCaptureAndroid>();
        if (instance && instance->initialize(config)) {
            return instance;
        }
    }
#endif // __ANDROID__

// iOS
#if defined(__APPLE__) && TARGET_OS_IOS
    {
        instance = std::make_unique<AudioCaptureIOS>();
        if (instance && instance->initialize(config)) {
            return instance;
        }
    }
#endif // __APPLE__ && TARGET_OS_IOS

    // Si aucune implémentation n'est disponible
    throw std::runtime_error("No suitable AudioCapture implementation available for this platform");

    return nullptr;
}

} // namespace Audio
} // namespace Nyth
