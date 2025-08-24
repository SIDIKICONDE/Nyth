#include "IVideoFilterProcessor.hpp"
#include <iostream>
#include <stdexcept>
#include <string>

// Implémentations spécifiques aux plateformes
#ifdef __APPLE__
#include "../iOS/iOSVideoFilterProcessor.hpp"
#endif

#ifdef __ANDROID__
#include "../Android/AndroidVideoFilterProcessor.hpp"
#endif

namespace Camera {

std::unique_ptr<IVideoFilterProcessor> VideoFilterProcessorFactory::createProcessor() {
    try {
        return createProcessorForPlatform(PlatformInfo::getCurrentPlatform());
    } catch (const std::runtime_error& e) {
        // Log l'erreur et retourne nullptr
        std::cerr << "VideoFilterProcessorFactory error: " << e.what() << std::endl;
        return nullptr;
    }
}

std::unique_ptr<IVideoFilterProcessor> VideoFilterProcessorFactory::createProcessorForPlatform(
    const std::string& platform) {
    if (platform == "iOS") {
#ifdef __APPLE__
        return std::make_unique<iOSVideoFilterProcessor>();
#else
        // Erreur: iOS non supporté sur cette plateforme
        throw std::runtime_error("iOS platform not supported on this build");
#endif
    } else if (platform == "Android") {
#ifdef __ANDROID__
        return std::make_unique<AndroidVideoFilterProcessor>();
#else
        // Erreur: Android non supporté sur cette plateforme
        throw std::runtime_error("Android platform not supported on this build");
#endif
    } else {
        // Plateforme non supportée
        throw std::runtime_error("Unsupported platform: " + platform);
    }
}

// === Implémentation PlatformInfo ===

std::string PlatformInfo::getCurrentPlatform() {
#ifdef __APPLE__
    return "iOS";
#elif defined(__ANDROID__)
    return "Android";
#else
    return "Desktop";
#endif
}

bool PlatformInfo::isIOS() {
#ifdef __APPLE__
    return true;
#else
    return false;
#endif
}

bool PlatformInfo::isAndroid() {
#ifdef __ANDROID__
    return true;
#else
    return false;
#endif
}

bool PlatformInfo::isDesktop() {
    return !isIOS() && !isAndroid();
}

std::string PlatformInfo::getPlatformVersion() {
#ifdef __APPLE__
    // Version iOS
    return "iOS " + std::string([[UIDevice currentDevice].systemVersion UTF8String]);
#elif defined(__ANDROID__)
    // Version Android
    char version[128];
    sprintf(version, "Android API %d", android_get_device_api_level());
    return std::string(version);
#else
    return "Desktop (OpenGL)";
#endif
}

} // namespace Camera
