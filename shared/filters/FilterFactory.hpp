#pragma once

#include "common/FilterTypes.hpp"
#include <string>
#include <vector>
#include <memory>
#include <cstring>

namespace Camera {

/**
 * Factory pour créer les processeurs de filtres
 * Permet d'ajouter facilement de nouveaux processeurs
 */
class FilterFactory {
public:
    // Types de processeurs disponibles
    enum class ProcessorType {
        FFMPEG,     // Processeur FFmpeg
        OPENGL,     // Processeur OpenGL
        CUSTOM      // Processeur personnalisé
    };
    
    // Création de processeurs
    static std::shared_ptr<IFilterProcessor> createProcessor(ProcessorType type);
    static std::shared_ptr<IFilterProcessor> createFFmpegProcessor();
    static std::shared_ptr<IFilterProcessor> createOpenGLProcessor();

    
    // Informations sur les processeurs
    static std::vector<std::string> getAvailableProcessorTypes();
    static bool isProcessorTypeAvailable(ProcessorType type);
    
    // Configuration
    static void setDefaultProcessor(ProcessorType type);
    static ProcessorType getDefaultProcessor();
    
private:
    static ProcessorType defaultProcessor_;
};

} // namespace Camera
