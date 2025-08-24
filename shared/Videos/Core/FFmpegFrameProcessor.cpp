#include "FFmpegFrameProcessor.hpp"
#include <algorithm>
#include <cstring>
#include <iostream>

#ifdef __AVX2__
#include <immintrin.h>
#endif

#ifdef __SSE2__
#include <emmintrin.h>
#endif

// Includes FFmpeg obligatoires
extern "C" {
#include <libavcodec/avcodec.h>
#include <libavfilter/avfilter.h>
#include <libavfilter/buffersink.h>
#include <libavfilter/buffersrc.h>
#include <libavutil/frame.h>
#include <libavutil/imgutils.h>
#include <libavutil/pixfmt.h>
}

namespace Camera {

FFmpegFrameProcessor::FFmpegFrameProcessor() {
    std::cout << "[FFmpegFrameProcessor] Construction - SIMD support: " << getSIMDSupport() << std::endl;
}

FFmpegFrameProcessor::~FFmpegFrameProcessor() {
    std::cout << "[FFmpegFrameProcessor] Destruction" << std::endl;
}

bool FFmpegFrameProcessor::processFrame(const uint8_t* inputData, int inputStride, int width, int height,
                                        const char* pixFormat, uint8_t* outputData, int outputStride,
                                        AVFilterContext* sourceContext, AVFilterContext* sinkContext,
                                        AVFrame* inputFrame, AVFrame* outputFrame) {
    // Préparer le frame d'entrée
    prepareInputFrame(inputFrame, inputData, inputStride, width, height, pixFormat);

    // Pousser la frame avec flag optimisé
    int ret =
        av_buffersrc_add_frame_flags(sourceContext, inputFrame, AV_BUFFERSRC_FLAG_KEEP_REF | AV_BUFFERSRC_FLAG_PUSH);
    if (ret < 0) {
        std::cerr << "[FFmpegFrameProcessor] buffersrc_add_frame a échoué" << std::endl;
        return false;
    }

    // Tirer la frame
    ret = av_buffersink_get_frame(sinkContext, outputFrame);
    if (ret < 0) {
        std::cerr << "[FFmpegFrameProcessor] buffersink_get_frame a échoué" << std::endl;
        return false;
    }

    // Copier les données de sortie
    return copyOutputFrameData(outputFrame, outputData, outputStride);
}

void FFmpegFrameProcessor::prepareInputFrame(AVFrame* inputFrame, const uint8_t* inputData, int inputStride, int width,
                                             int height, const char* pixFormat) {
    inputFrame->width = width;
    inputFrame->height = height;

    AVPixelFormat pix = av_get_pix_fmt(pixFormat ? pixFormat : "bgra");
    if (pix == AV_PIX_FMT_NONE) {
        pix = AV_PIX_FMT_BGRA;
    }
    inputFrame->format = pix;
    inputFrame->data[0] = const_cast<uint8_t*>(inputData);
    inputFrame->linesize[0] = inputStride;

    // Pour formats YUV, configurer les plans supplémentaires
    if (pix == AV_PIX_FMT_YUV420P || pix == AV_PIX_FMT_YUV422P || pix == AV_PIX_FMT_YUV444P) {
        int chromaHeight = (pix == AV_PIX_FMT_YUV420P) ? height / 2 : height;
        int chromaWidth = (pix == AV_PIX_FMT_YUV420P || pix == AV_PIX_FMT_YUV422P) ? width / 2 : width;
        inputFrame->data[1] = inputFrame->data[0] + (inputStride * height);
        inputFrame->data[2] = inputFrame->data[1] + (chromaWidth * chromaHeight);
        inputFrame->linesize[1] = inputFrame->linesize[2] = chromaWidth;
    }
}

bool FFmpegFrameProcessor::copyOutputFrameData(AVFrame* outputFrame, uint8_t* outputData, int outputStride) {
    const int outLinesize = outputFrame->linesize[0];
    const int rowBytes =
        av_get_bits_per_pixel(av_pix_fmt_desc_get((AVPixelFormat)outputFrame->format)) * outputFrame->width / 8;

    if (outputStride < rowBytes) {
        std::cerr << "[FFmpegFrameProcessor] outputStride insuffisant" << std::endl;
        return false;
    }

    // Utiliser copie SIMD optimisée
    const int bytesPerPixel = rowBytes / outputFrame->width;
    return copyFrameData(outputFrame->data[0], outLinesize, outputData, outputStride, outputFrame->width,
                         outputFrame->height, bytesPerPixel);
}

bool FFmpegFrameProcessor::copyFrameData(const uint8_t* src, int srcStride, uint8_t* dst, int dstStride, int width,
                                         int height, int bytesPerPixel) {
    const int rowBytes = width * bytesPerPixel;
    const std::string simdSupport = getSIMDSupport();

    for (int y = 0; y < height; ++y) {
        const uint8_t* srcRow = src + y * srcStride;
        uint8_t* dstRow = dst + y * dstStride;

        if (dstStride < rowBytes) {
            return false; // Buffer de destination insuffisant
        }

        bool success = true;
        if (simdSupport == "AVX2") {
            success = copyRowAVX2(srcRow, dstRow, rowBytes);
        } else if (simdSupport == "SSE2") {
            success = copyRowSSE2(srcRow, dstRow, rowBytes);
        } else {
            copyRowFallback(srcRow, dstRow, rowBytes);
        }

        if (!success) {
            return false;
        }
    }
    return true;
}

std::string FFmpegFrameProcessor::getSIMDSupport() {
#ifdef __AVX2__
    return "AVX2";
#elif defined(__SSE2__)
    return "SSE2";
#else
    return "NONE";
#endif
}

static bool copyRowAVX2(const uint8_t* src, uint8_t* dst, size_t bytes) {
    size_t x = 0;
    const size_t avx2End = bytes & ~(AVX2_BLOCK_SIZE - 1);

    // Copie principale avec AVX2
    for (; x + AVX2_PREFETCH_DISTANCE <= avx2End; x += AVX2_PREFETCH_DISTANCE) {
        // Prefetch pour améliorer la localité cache
        _mm_prefetch(src + x + AVX2_PREFETCH_DISTANCE, _MM_HINT_T0);
        _mm_prefetch(dst + x + AVX2_PREFETCH_DISTANCE, _MM_HINT_T0);

        // Traiter 4 vecteurs AVX2 de 32 bytes chacun
        __m256i data1 = _mm256_loadu_si256(reinterpret_cast<const __m256i*>(src + x));
        __m256i data2 = _mm256_loadu_si256(reinterpret_cast<const __m256i*>(src + x + 32));
        __m256i data3 = _mm256_loadu_si256(reinterpret_cast<const __m256i*>(src + x + 64));
        __m256i data4 = _mm256_loadu_si256(reinterpret_cast<const __m256i*>(src + x + 96));

        _mm256_storeu_si256(reinterpret_cast<__m256i*>(dst + x), data1);
        _mm256_storeu_si256(reinterpret_cast<__m256i*>(dst + x + 32), data2);
        _mm256_storeu_si256(reinterpret_cast<__m256i*>(dst + x + 64), data3);
        _mm256_storeu_si256(reinterpret_cast<__m256i*>(dst + x + 96), data4);
    }

    // Traiter les bytes restants par blocs de 32
    for (; x < avx2End; x += AVX2_BLOCK_SIZE) {
        __m256i data = _mm256_loadu_si256(reinterpret_cast<const __m256i*>(src + x));
        _mm256_storeu_si256(reinterpret_cast<__m256i*>(dst + x), data);
    }

    // Copier les octets restants
    if (x < bytes) {
        std::memcpy(dst + x, src + x, bytes - x);
    }

    return true;
}

static bool copyRowSSE2(const uint8_t* src, uint8_t* dst, size_t bytes) {
    size_t x = 0;
    const size_t sse2End = bytes & ~(SSE2_BLOCK_SIZE - 1);

    // Copie principale avec SSE2
    for (; x + SSE2_PREFETCH_DISTANCE <= sse2End; x += SSE2_PREFETCH_DISTANCE) {
        _mm_prefetch(src + x + SSE2_PREFETCH_DISTANCE, _MM_HINT_T0);
        _mm_prefetch(dst + x + SSE2_PREFETCH_DISTANCE, _MM_HINT_T0);

        // Traiter 4 vecteurs SSE2 de 16 bytes chacun
        __m128i data1 = _mm_loadu_si128(reinterpret_cast<const __m128i*>(src + x));
        __m128i data2 = _mm_loadu_si128(reinterpret_cast<const __m128i*>(src + x + 16));
        __m128i data3 = _mm_loadu_si128(reinterpret_cast<const __m128i*>(src + x + 32));
        __m128i data4 = _mm_loadu_si128(reinterpret_cast<const __m128i*>(src + x + 48));

        _mm_storeu_si128(reinterpret_cast<__m128i*>(dst + x), data1);
        _mm_storeu_si128(reinterpret_cast<__m128i*>(dst + x + 16), data2);
        _mm_storeu_si128(reinterpret_cast<__m128i*>(dst + x + 32), data3);
        _mm_storeu_si128(reinterpret_cast<__m128i*>(dst + x + 48), data4);
    }

    // Traiter les bytes restants par blocs de 16
    for (; x < sse2End; x += SSE2_BLOCK_SIZE) {
        __m128i data = _mm_loadu_si128(reinterpret_cast<const __m128i*>(src + x));
        _mm_storeu_si128(reinterpret_cast<__m128i*>(dst + x), data);
    }

    // Copier les octets restants
    if (x < bytes) {
        std::memcpy(dst + x, src + x, bytes - x);
    }

    return true;
}

static void copyRowFallback(const uint8_t* src, uint8_t* dst, size_t bytes) {
    std::memcpy(dst, src, bytes);
}

} // namespace Camera
