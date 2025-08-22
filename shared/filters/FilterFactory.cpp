#include "FilterFactory.hpp"
#include "FFmpegFilterProcessor.hpp"
#include "OpenGLFilterProcessor.hpp"
#include <cstdio>

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
            std::cout << "[FilterFactory] Processeur CUSTOM - utilisation FFmpeg obligatoire" << std::endl;
            return createFFmpegProcessor();

        default:
            std::cout << "[FilterFactory] Type de processeur inconnu - utilisation FFmpeg obligatoire" << std::endl;
            return createFFmpegProcessor();
    }
}

std::shared_ptr<IFilterProcessor> FilterFactory::createFFmpegProcessor() {
    std::cout << "[FilterFactory] Création du processeur FFmpeg" << std::endl;
    return std::make_shared<FFmpegFilterProcessor>();
}



std::shared_ptr<IFilterProcessor> FilterFactory::createOpenGLProcessor() {
    std::cout << "[FilterFactory] Création du processeur OpenGL" << std::endl;

    auto processor = std::make_shared<OpenGLFilterProcessor>();
    if (processor && processor->initialize()) {
        std::cout << "[FilterFactory] Processeur OpenGL créé avec succès" << std::endl;
        return processor;
    } else {
        std::cout << "[FilterFactory] Échec création OpenGL - fallback vers FFmpeg" << std::endl;
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
        std::cout << "[FilterFactory] Processeur par défaut défini: " << static_cast<int>(type) << std::endl;
    } else {
        std::cout << "[FilterFactory] Processeur non disponible: " << static_cast<int>(type) << std::endl;
    }
}

FilterFactory::ProcessorType FilterFactory::getDefaultProcessor() {
    return defaultProcessor_;
}

} // namespace Camera
