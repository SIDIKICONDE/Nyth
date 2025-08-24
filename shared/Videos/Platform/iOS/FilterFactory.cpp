#include "FilterFactory.hpp"
#include "FFmpegFilterProcessor.hpp"
#include "OpenGLFilterProcessor.hpp"
#include <iostream>
#include <cstdio>
#include <sstream>

#ifdef __APPLE__
#include <TargetConditionals.h>
#endif

// Fonction de logging compatible iOS
inline void logFilterFactory(const std::string& message) {
#ifdef TARGET_OS_IOS
    // Pour iOS, on peut utiliser NSLog ou simplement ignorer
    // NSLog(@"[FilterFactory] %s", message.c_str());
    (void)message; // Supprime l'avertissement de paramètre non utilisé
#else
    std::cout << "[FilterFactory] " << message << std::endl;
#endif
}

// Macro helper pour les messages avec flux
#define LOG_FILTER_FACTORY(msg) do { std::stringstream ss; ss << msg; logFilterFactory(ss.str()); } while(0)

namespace Camera {

// Initialisation de la variable statique
FilterFactory::ProcessorType FilterFactory::defaultProcessor_ = FilterFactory::ProcessorType::FFMPEG;

std::shared_ptr<IFilterProcessor> FilterFactory::createProcessor(ProcessorType type) {
    switch (type) {
        case ProcessorType::FFMPEG:
            return createFFmpegProcessor();

        case ProcessorType::OPENGL:
            return createOpenGLProcessor();

        case ProcessorType::CUSTOM:
            // FFmpeg obligatoire pour les processeurs personnalisés
            LOG_FILTER_FACTORY("Processeur CUSTOM - utilisation FFmpeg obligatoire");
            return createFFmpegProcessor();

        default:
            LOG_FILTER_FACTORY("Type de processeur inconnu - utilisation FFmpeg obligatoire");
            return createFFmpegProcessor();
    }
}

std::shared_ptr<IFilterProcessor> FilterFactory::createFFmpegProcessor() {
    LOG_FILTER_FACTORY("Création du processeur FFmpeg");
    return std::make_shared<FFmpegFilterProcessor>();
}



std::shared_ptr<IFilterProcessor> FilterFactory::createOpenGLProcessor() {
    LOG_FILTER_FACTORY("Création du processeur OpenGL");

    auto processor = std::make_shared<OpenGLFilterProcessor>();
    if (processor && processor->initialize()) {
        LOG_FILTER_FACTORY("Processeur OpenGL créé avec succès");
        return processor;
    } else {
        LOG_FILTER_FACTORY("Échec création OpenGL - fallback vers FFmpeg");
        return createFFmpegProcessor();
    }
}



std::vector<std::string> FilterFactory::getAvailableProcessorTypes() {
    std::vector<std::string> types;

    // FFmpeg est toujours disponible (avec fallback)
    types.push_back("FFMPEG");

    // OpenGL disponible partout
    types.push_back("OPENGL");

    return types;
}

bool FilterFactory::isProcessorTypeAvailable(ProcessorType type) {
    switch (type) {
        case ProcessorType::FFMPEG:
            return true; // Toujours disponible avec fallback

        case ProcessorType::OPENGL: {
            // Vérifier si OpenGL est réellement disponible
            auto tempProcessor = std::make_shared<OpenGLFilterProcessor>();
            bool available = tempProcessor && tempProcessor->initialize();
            if (tempProcessor) tempProcessor->shutdown();
            return available;
        }

        case ProcessorType::CUSTOM:
            return false; // Pas encore implémenté

        default:
            return false;
    }
}

void FilterFactory::setDefaultProcessor(ProcessorType type) {
    if (isProcessorTypeAvailable(type)) {
        defaultProcessor_ = type;
        LOG_FILTER_FACTORY("Processeur par défaut défini: " << static_cast<int>(type));
    } else {
        LOG_FILTER_FACTORY("Processeur non disponible: " << static_cast<int>(type));
    }
}

FilterFactory::ProcessorType FilterFactory::getDefaultProcessor() {
    return defaultProcessor_;
}

} // namespace Camera
