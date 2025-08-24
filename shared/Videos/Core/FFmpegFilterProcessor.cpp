#include "FFmpegFilterProcessor.hpp"
#include "../common/FilterTypes.hpp"
#include <iostream>
#include <memory>

namespace Camera {

FFmpegFilterProcessor::FFmpegFilterProcessor()
    : graphManager_(std::make_unique<FFmpegGraphManager>()), frameProcessor_(std::make_unique<FFmpegFrameProcessor>()) {
    std::cout << "[FFmpegFilterProcessor] Construction" << std::endl;
}

FFmpegFilterProcessor::~FFmpegFilterProcessor() {
    shutdown();
    std::cout << "[FFmpegFilterProcessor] Destruction" << std::endl;
}

bool FFmpegFilterProcessor::initialize() {
    if (initialized_) {
        return true;
    }

    std::cout << "[FFmpegFilterProcessor] Initialisation..." << std::endl;

    // Initialiser les gestionnaires
    if (!graphManager_->initialize()) {
        setLastError("Échec d'initialisation du gestionnaire de graphe");
        return false;
    }

    initialized_ = true;
    std::cout << "[FFmpegFilterProcessor] Initialisation terminée" << std::endl;

    return true;
}

void FFmpegFilterProcessor::shutdown() {
    if (!initialized_) {
        return;
    }

    std::cout << "[FFmpegFilterProcessor] Arrêt..." << std::endl;

    graphManager_->shutdown();

    initialized_ = false;
    std::cout << "[FFmpegFilterProcessor] Arrêt terminé" << std::endl;
}

bool FFmpegFilterProcessor::applyFilter(const FilterState& filter, const void* inputData, size_t inputSize,
                                        void* outputData, size_t outputSize) {
    if (!initialized_) {
        setLastError("Processeur non initialisé");
        return false;
    }

    // Vérifier les paramètres
    if (width_ <= 0 || height_ <= 0) {
        setLastError("Format vidéo non défini");
        return false;
    }

    const std::string fmt = pixelFormat_.empty() ? "yuv420p" : pixelFormat_;
    const int stride = FFmpegUtils::calculateStride(fmt, width_);

    return applyFilterWithStride(filter, reinterpret_cast<const uint8_t*>(inputData), stride, width_, height_,
                                 fmt.c_str(), reinterpret_cast<uint8_t*>(outputData), stride);
}

bool FFmpegFilterProcessor::supportsFormat(const std::string& format) const {
    return FFmpegUtils::isPixelFormatSupported(format);
}

bool FFmpegFilterProcessor::supportsFilter(FilterType type) const {
    return FFmpegFilterBuilder::isFilterTypeSupported(type);
}

std::string FFmpegFilterProcessor::getName() const {
    return "FFmpegFilterProcessor";
}

std::vector<FilterInfo> FFmpegFilterProcessor::getSupportedFilters() const {
    return FFmpegUtils::getSupportedFilters();
}

bool FFmpegFilterProcessor::setVideoFormat(int width, int height, const std::string& pixelFormat) {
    width_ = width;
    height_ = height;
    pixelFormat_ = pixelFormat;

    // Configurer le gestionnaire de graphe
    graphManager_->setVideoFormat(width, height, pixelFormat, frameRate_);

    std::cout << "[FFmpegFilterProcessor] Format vidéo: " << width << "x" << height << " (" << pixelFormat << ")"
              << std::endl;
    return true;
}

bool FFmpegFilterProcessor::setFrameRate(int fps) {
    frameRate_ = fps;

    // Mettre à jour la configuration si déjà configurée
    if (width_ > 0 && height_ > 0) {
        graphManager_->setVideoFormat(width_, height_, pixelFormat_, frameRate_);
    }

    std::cout << "[FFmpegFilterProcessor] Frame rate: " << fps << " fps" << std::endl;
    return true;
}

// Méthodes privées
bool FFmpegFilterProcessor::ensureGraph(const FilterState& filter) {
    return graphManager_->ensureGraph(filter);
}

bool FFmpegFilterProcessor::applyFilterWithStride(const FilterState& filter, const uint8_t* inputData, int inputStride,
                                                  int width, int height, const char* pixFormat, uint8_t* outputData,
                                                  int outputStride) {
    if (!initialized_) {
        setLastError("Processeur non initialisé");
        return false;
    }
    pixelFormat_ = pixFormat ? std::string(pixFormat) : std::string("bgra");
    width_ = width;
    height_ = height;
    if (!ensureGraph(filter))
        return false;

    AVPixelFormat pix = av_get_pix_fmt(pixelFormat_.c_str());
    if (pix == AV_PIX_FMT_NONE)
        pix = AV_PIX_FMT_BGRA;

    // Optimisation: éviter av_frame_unref si possible
    // Préparer frame d'entrée en référençant directement les données + stride
    inputFrame_->width = width_;
    inputFrame_->height = height_;
    inputFrame_->format = pix;
    inputFrame_->data[0] = const_cast<uint8_t*>(inputData);
    inputFrame_->linesize[0] = inputStride;

    // Pour formats YUV, configurer les plans supplémentaires
    if (pix == AV_PIX_FMT_YUV420P || pix == AV_PIX_FMT_YUV422P || pix == AV_PIX_FMT_YUV444P) {
        int chromaHeight = (pix == AV_PIX_FMT_YUV420P) ? height_ / 2 : height_;
        int chromaWidth = (pix == AV_PIX_FMT_YUV420P || pix == AV_PIX_FMT_YUV422P) ? width_ / 2 : width_;
        inputFrame_->data[1] = inputFrame_->data[0] + (inputStride * height_);
        inputFrame_->data[2] = inputFrame_->data[1] + (chromaWidth * chromaHeight);
        inputFrame_->linesize[1] = inputFrame_->linesize[2] = chromaWidth;
    }

    // Pousser la frame avec flag optimisé
    int ret =
        av_buffersrc_add_frame_flags(sourceContext_, inputFrame_, AV_BUFFERSRC_FLAG_KEEP_REF | AV_BUFFERSRC_FLAG_PUSH);
    if (ret < 0) {
        setLastError("buffersrc_add_frame a échoué");
        return false;
    }

    // Tirer la frame
    ret = av_buffersink_get_frame(sinkContext_, outputFrame_);
    if (ret < 0) {
        setLastError("buffersink_get_frame a échoué");
        return false;
    }

    // Optimisation: copie SIMD pour les formats supportés
    const int outLinesize = outputFrame_->linesize[0];
    const int rowBytes =
        av_get_bits_per_pixel(av_pix_fmt_desc_get((AVPixelFormat)outputFrame_->format)) * outputFrame_->width / 8;

    if (outputStride < rowBytes) {
        av_frame_unref(outputFrame_);
        setLastError("outputStride insuffisant");
        return false;
    }

// Utiliser copie SIMD optimisée si disponible
#ifdef __AVX2__
    if (rowBytes >= 32) {
        // Traitement optimisé avec prefetching et alignement
        for (int y = 0; y < outputFrame_->height; ++y) {
            const uint8_t* srcRow = outputFrame_->data[0] + y * outLinesize;
            uint8_t* dstRow = outputData + y * outputStride;

            size_t simdBytes = rowBytes & ~31; // Aligner à 32 bytes (AVX2)
            size_t x = 0;

            // Boucle principale avec prefetching
            for (; x + 128 <= simdBytes; x += 128) {
                // Prefetch pour améliorer la localité cache
                _mm_prefetch(srcRow + x + 128, _MM_HINT_T0);
                _mm_prefetch(dstRow + x + 128, _MM_HINT_T0);

                // Traiter 4 vecteurs AVX2 de 32 bytes chacun
                __m256i data1 = _mm256_loadu_si256(reinterpret_cast<const __m256i*>(srcRow + x));
                __m256i data2 = _mm256_loadu_si256(reinterpret_cast<const __m256i*>(srcRow + x + 32));
                __m256i data3 = _mm256_loadu_si256(reinterpret_cast<const __m256i*>(srcRow + x + 64));
                __m256i data4 = _mm256_loadu_si256(reinterpret_cast<const __m256i*>(srcRow + x + 96));

                _mm256_storeu_si256(reinterpret_cast<__m256i*>(dstRow + x), data1);
                _mm256_storeu_si256(reinterpret_cast<__m256i*>(dstRow + x + 32), data2);
                _mm256_storeu_si256(reinterpret_cast<__m256i*>(dstRow + x + 64), data3);
                _mm256_storeu_si256(reinterpret_cast<__m256i*>(dstRow + x + 96), data4);
            }

            // Traiter les bytes restants par blocs de 32
            for (; x < simdBytes; x += 32) {
                __m256i data = _mm256_loadu_si256(reinterpret_cast<const __m256i*>(srcRow + x));
                _mm256_storeu_si256(reinterpret_cast<__m256i*>(dstRow + x), data);
            }

            // Copier les octets restants
            if (simdBytes < rowBytes) {
                std::memcpy(dstRow + simdBytes, srcRow + simdBytes, rowBytes - simdBytes);
            }
        }
    } else
#elif defined(__SSE2__)
    if (rowBytes >= 16) {
        // Optimisation SSE2 avec prefetching
        for (int y = 0; y < outputFrame_->height; ++y) {
            const uint8_t* srcRow = outputFrame_->data[0] + y * outLinesize;
            uint8_t* dstRow = outputData + y * outputStride;

            size_t simdBytes = rowBytes & ~15; // Aligner à 16 bytes (SSE2)
            size_t x = 0;

            // Boucle principale avec prefetching
            for (; x + 64 <= simdBytes; x += 64) {
                _mm_prefetch(srcRow + x + 64, _MM_HINT_T0);
                _mm_prefetch(dstRow + x + 64, _MM_HINT_T0);

                // Traiter 4 vecteurs SSE2 de 16 bytes chacun
                __m128i data1 = _mm_loadu_si128(reinterpret_cast<const __m128i*>(srcRow + x));
                __m128i data2 = _mm_loadu_si128(reinterpret_cast<const __m128i*>(srcRow + x + 16));
                __m128i data3 = _mm_loadu_si128(reinterpret_cast<const __m128i*>(srcRow + x + 32));
                __m128i data4 = _mm_loadu_si128(reinterpret_cast<const __m128i*>(srcRow + x + 48));

                _mm_storeu_si128(reinterpret_cast<__m128i*>(dstRow + x), data1);
                _mm_storeu_si128(reinterpret_cast<__m128i*>(dstRow + x + 16), data2);
                _mm_storeu_si128(reinterpret_cast<__m128i*>(dstRow + x + 32), data3);
                _mm_storeu_si128(reinterpret_cast<__m128i*>(dstRow + x + 48), data4);
            }

            // Traiter les bytes restants par blocs de 16
            for (; x < simdBytes; x += 16) {
                __m128i data = _mm_loadu_si128(reinterpret_cast<const __m128i*>(srcRow + x));
                _mm_storeu_si128(reinterpret_cast<__m128i*>(dstRow + x), data);
            }

            // Copier les octets restants
            if (simdBytes < rowBytes) {
                std::memcpy(dstRow + simdBytes, srcRow + simdBytes, rowBytes - simdBytes);
            }
        }
    } else
#endif
    {
        // Fallback vers memcpy standard
        for (int y = 0; y < outputFrame_->height; ++y) {
            const uint8_t* srcRow = outputFrame_->data[0] + y * outLinesize;
            uint8_t* dstRow = outputData + y * outputStride;
            std::memcpy(dstRow, srcRow, (size_t)rowBytes);
        }
    }

    // Allouer des frames temporaires pour le traitement
    AVFrame* inputFrame = av_frame_alloc();
    AVFrame* outputFrame = av_frame_alloc();

    if (!inputFrame || !outputFrame) {
        if (inputFrame)
            av_frame_free(&inputFrame);
        if (outputFrame)
            av_frame_free(&outputFrame);
        setLastError("Impossible d'allouer les frames FFmpeg");
        return false;
    }

    bool success = frameProcessor_->processFrame(inputData, inputStride, width, height, pixFormat, outputData,
                                                 outputStride, graphManager_->getSourceContext(),
                                                 graphManager_->getSinkContext(), inputFrame, outputFrame);

    // Nettoyer les frames temporaires
    av_frame_free(&inputFrame);
    av_frame_free(&outputFrame);

    return success;
}

void FFmpegFilterProcessor::setLastError(const std::string& error) {
    if (graphManager_) {
        // Note: Cette méthode pourrait être supprimée ou déplacée
        std::cout << "[FFmpegFilterProcessor] Erreur: " << error << std::endl;
    }
}

bool FFmpegFilterProcessor::isFFmpegAvailable() const {
    return FFmpegUtils::isFFmpegAvailable();
}

std::string FFmpegFilterProcessor::getSupportedPixelFormats() const {
    auto formats = FFmpegUtils::getSupportedPixelFormats();
    std::string result;
    for (size_t i = 0; i < formats.size(); ++i) {
        if (i > 0)
            result += ",";
        result += formats[i];
    }
    return result;
}

} // namespace Camera
