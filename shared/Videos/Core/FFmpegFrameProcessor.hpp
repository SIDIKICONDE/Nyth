#pragma once

#include <cstdint>
#include <string>

// Forward declarations pour FFmpeg
extern "C" {
struct AVFrame;
struct AVFilterContext;
}

namespace Camera {

/**
 * Processeur de frames FFmpeg avec optimisation SIMD
 * Gère le traitement et la copie des frames avec accélération SIMD
 */
class FFmpegFrameProcessor {
public:
    FFmpegFrameProcessor();
    ~FFmpegFrameProcessor();

    /**
     * Traite un frame avec un filtre FFmpeg
     * @param inputData Données d'entrée
     * @param inputStride Stride des données d'entrée
     * @param width Largeur de l'image
     * @param height Hauteur de l'image
     * @param pixFormat Format de pixel FFmpeg
     * @param outputData Données de sortie
     * @param outputStride Stride des données de sortie
     * @param sourceContext Contexte source FFmpeg
     * @param sinkContext Contexte sink FFmpeg
     * @param inputFrame Frame d'entrée FFmpeg
     * @param outputFrame Frame de sortie FFmpeg
     * @return true si succès, false sinon
     */
    bool processFrame(const uint8_t* inputData, int inputStride, int width, int height, const char* pixFormat,
                      uint8_t* outputData, int outputStride, AVFilterContext* sourceContext,
                      AVFilterContext* sinkContext, AVFrame* inputFrame, AVFrame* outputFrame);

    /**
     * Copie des données de frame avec optimisation SIMD
     * @param src Données source
     * @param srcStride Stride source
     * @param dst Données destination
     * @param dstStride Stride destination
     * @param width Largeur
     * @param height Hauteur
     * @param bytesPerPixel Bytes par pixel
     * @return true si succès, false sinon
     */
    static bool copyFrameData(const uint8_t* src, int srcStride, uint8_t* dst, int dstStride, int width, int height,
                              int bytesPerPixel);

    /**
     * Vérifie si SIMD est disponible
     * @return Niveau SIMD supporté
     */
    static std::string getSIMDSupport();

private:
    /**
     * Prépare un frame d'entrée FFmpeg
     * @param inputFrame Frame à préparer
     * @param inputData Données d'entrée
     * @param inputStride Stride d'entrée
     * @param width Largeur
     * @param height Hauteur
     * @param pixFormat Format de pixel
     */
    void prepareInputFrame(AVFrame* inputFrame, const uint8_t* inputData, int inputStride, int width, int height,
                           const char* pixFormat);

    /**
     * Copie les données du frame de sortie
     * @param outputFrame Frame source
     * @param outputData Données de destination
     * @param outputStride Stride de destination
     * @return true si succès, false sinon
     */
    bool copyOutputFrameData(AVFrame* outputFrame, uint8_t* outputData, int outputStride);

    // Constantes pour l'optimisation
    static constexpr size_t AVX2_BLOCK_SIZE = 32;
    static constexpr size_t SSE2_BLOCK_SIZE = 16;
    static constexpr size_t AVX2_PREFETCH_DISTANCE = 128;
    static constexpr size_t SSE2_PREFETCH_DISTANCE = 64;
};
