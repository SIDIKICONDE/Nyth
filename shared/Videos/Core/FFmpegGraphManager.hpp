#pragma once

#include "../common/FilterTypes.hpp"
#include <cstdint>
#include <string>

// Forward declarations pour FFmpeg
extern "C" {
struct AVFilterContext;
struct AVFilterGraph;
struct AVFrame;
}

namespace Camera {

/**
 * Gestionnaire du graphe de filtres FFmpeg
 * Responsable de la création, configuration et destruction du graphe
 */
class FFmpegGraphManager {
public:
    FFmpegGraphManager();
    ~FFmpegGraphManager();

    // Initialisation et nettoyage
    bool initialize();
    void shutdown();

    // Configuration
    bool setVideoFormat(int width, int height, const std::string& pixelFormat, int frameRate);

    // Gestion du graphe
    bool ensureGraph(const FilterState& filter);
    bool createFilterGraph();
    void destroyFilterGraph();
    bool addFilterToGraph(const FilterState& filter);

    // Accès aux contextes
    AVFilterGraph* getFilterGraph() const {
        return filterGraph_;
    }
    AVFilterContext* getSourceContext() const {
        return sourceContext_;
    }
    AVFilterContext* getSinkContext() const {
        return sinkContext_;
    }

    // État
    bool isInitialized() const {
        return initialized_;
    }
    const std::string& getLastError() const {
        return lastError_;
    }

private:
    // Gestion d'erreur
    void setLastError(const std::string& error);

    // Configuration
    int width_{0};
    int height_{0};
    std::string pixelFormat_;
    int frameRate_{30};

    // Contexte FFmpeg
    AVFilterGraph* filterGraph_{nullptr};
    AVFilterContext* sourceContext_{nullptr};
    AVFilterContext* sinkContext_{nullptr};

    // Cache pour optimisation
    int lastWidth_{0};
    int lastHeight_{0};
    int lastFrameRate_{0};
    std::string lastPixelFormat_;
    std::string lastFilterDesc_;

    // État
    bool initialized_{false};
    std::string lastError_;
};

} // namespace Camera
