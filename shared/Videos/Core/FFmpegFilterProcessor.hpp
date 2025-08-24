#pragma once

#include <cstdint>
#include <cstring>
#include <memory>
#include <string>
#include <vector>

// Forward declarations
namespace Camera {
enum class FilterType;
struct FilterState;
struct FilterParams;
struct FilterInfo;
class IFilterProcessor;
} // namespace Camera

// Forward declarations pour FFmpeg
extern "C" {
struct AVCodecContext;
struct AVFilterContext;
struct AVFilterGraph;
struct AVFrame;
struct AVBufferRef;
}

namespace Camera {

/**
 * Processeur de filtres utilisant FFmpeg
 * Supporte les filtres vidéo FFmpeg pour le traitement en temps réel
 */
class FFmpegFilterProcessor : public IFilterProcessor {
public:
    FFmpegFilterProcessor();
    ~FFmpegFilterProcessor() override;

    // IFilterProcessor interface
    bool initialize() override;
    void shutdown() override;

    bool applyFilter(const FilterState& filter, const void* inputData, size_t inputSize, void* outputData,
                     size_t outputSize) override;

    bool supportsFormat(const std::string& format) const override;
    bool supportsFilter(FilterType type) const override;

    std::string getName() const override;
    std::vector<FilterInfo> getSupportedFilters() const override;

    // Configuration spécifique FFmpeg
    bool setVideoFormat(int width, int height, const std::string& pixelFormat);
    bool setFrameRate(int fps);

    // Application optimisée avec gestion de stride (évite les copies pack/unpack)
    // pixFormat: chaîne FFmpeg (ex: "bgra", "yuv420p")
    bool applyFilterWithStride(const FilterState& filter, const uint8_t* inputData, int inputStride, int width,
                               int height, const char* pixFormat, uint8_t* outputData, int outputStride);

private:
    // Forward declarations des classes spécialisées
    class FFmpegGraphManager;
    class FFmpegFrameProcessor;

    // Gestionnaires spécialisés
    std::unique_ptr<FFmpegGraphManager> graphManager_;
    std::unique_ptr<FFmpegFrameProcessor> frameProcessor_;

    // État
    bool initialized_{false};

    // Configuration vidéo
    int width_{0};
    int height_{0};
    std::string pixelFormat_;
    int frameRate_{30};

    // Méthodes privées
    void setLastError(const std::string& error);

    // Utilitaires
    bool isFFmpegAvailable() const;
    std::string getSupportedPixelFormats() const;
};

} // namespace Camera
