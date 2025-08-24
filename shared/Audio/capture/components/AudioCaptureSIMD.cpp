#include "AudioCaptureSIMD.hpp"
#include "../../common/config/Constant.hpp"
#include <cstring>
#include <algorithm>
#include <string>
#include <vector>
#include <cmath>
#include <chrono>
#include <iostream>
#include <iomanip>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

#ifdef __ARM_NEON
#include <arm_neon.h>
#endif

// Support pour SSE/AVX sur x86/x64
#ifdef __SSE__
#include <xmmintrin.h>
#endif

#ifdef __SSE2__
#include <emmintrin.h>
#endif

#ifdef __SSE3__
#include <pmmintrin.h>
#endif

#ifdef __AVX__
#include <immintrin.h>
#endif

#ifdef __AVX2__
#include <avx2intrin.h>
#endif

namespace Nyth {
namespace Audio {
namespace SIMD {

// ============================================================================
// Implémentations SIMD optimisées pour mobile
// ============================================================================

// Version générique (fallback) des fonctions SIMD
namespace generic {

// Processus audio générique
void processFloat32(const float* input, float* output, size_t count, float gain) {
    for (size_t i = 0; i < count; ++i) {
        output[i] = input[i] * gain;
    }
}

void mixFloat32(const float* input1, const float* input2, float* output,
                size_t count, float gain1, float gain2) {
    for (size_t i = 0; i < count; ++i) {
        output[i] = input1[i] * gain1 + input2[i] * gain2;
    }
}

void convertInt16ToFloat32(const int16_t* input, float* output, size_t count) {
    const float scale = Constants::INT16_TO_FLOAT_SCALE;
    for (size_t i = 0; i < count; ++i) {
        output[i] = input[i] * scale;
    }
}

void convertFloat32ToInt16(const float* input, int16_t* output, size_t count) {
    const float scale = Constants::INT16_SCALE;
    for (size_t i = 0; i < count; ++i) {
        float sample = input[i] * scale;
        sample = std::max(Constants::INT16_MIN_VALUE, std::min(Constants::INT16_MAX_VALUE, sample));
        output[i] = static_cast<int16_t>(sample);
    }
}

float calculateRMS(const float* data, size_t count) {
    if (!data || count == Constants::NULL_DATA_CHECK) return Constants::RMS_ZERO_RETURN_VALUE;

    float sum = Constants::SUM_INITIAL_VALUE;
    for (size_t i = 0; i < count; ++i) {
        sum += data[i] * data[i];
    }
    return std::sqrt(sum / count);
}

float calculatePeak(const float* data, size_t count) {
    if (!data || count == Constants::NULL_DATA_CHECK) return Constants::RMS_ZERO_RETURN_VALUE;

    float peak = Constants::MAX_INITIAL_VALUE;
    for (size_t i = 0; i < count; ++i) {
        float absValue = std::abs(data[i]);
        if (absValue > peak) {
            peak = absValue;
        }
    }
    return peak;
}

void applyGain(float* data, size_t count, float gain) {
    for (size_t i = 0; i < count; ++i) {
        data[i] *= gain;
    }
}

void applyGainRamp(float* data, size_t count, float startGain, float endGain) {
    float gainStep = (endGain - startGain) / count;
    float currentGain = startGain;

    for (size_t i = 0; i < count; ++i) {
        data[i] *= currentGain;
        currentGain += gainStep;
    }
}

} // namespace generic

// ============================================================================
// ARM NEON implementations
// ============================================================================

#ifdef __ARM_NEON

namespace neon {

// Implémentations ARM NEON pour les appareils mobiles
void processFloat32(const float* input, float* output, size_t count, float gain) {
    size_t i = 0;
    float32x4_t gainVec = vdupq_n_f32(gain);

    // Traiter par blocs de 4 échantillons
    for (; i + 3 < count; i += 4) {
        float32x4_t data = vld1q_f32(&input[i]);
        float32x4_t result = vmulq_f32(data, gainVec);
        vst1q_f32(&output[i], result);
    }

    // Traiter les échantillons restants
    for (; i < count; ++i) {
        output[i] = input[i] * gain;
    }
}

void mixFloat32(const float* input1, const float* input2, float* output,
                size_t count, float gain1, float gain2) {
    size_t i = 0;
    float32x4_t gain1Vec = vdupq_n_f32(gain1);
    float32x4_t gain2Vec = vdupq_n_f32(gain2);

    // Traiter par blocs de 4 échantillons
    for (; i + 3 < count; i += 4) {
        float32x4_t data1 = vld1q_f32(&input1[i]);
        float32x4_t data2 = vld1q_f32(&input2[i]);
        float32x4_t result1 = vmulq_f32(data1, gain1Vec);
        float32x4_t result2 = vmulq_f32(data2, gain2Vec);
        float32x4_t final = vaddq_f32(result1, result2);
        vst1q_f32(&output[i], final);
    }

    // Traiter les échantillons restants
    for (; i < count; ++i) {
        output[i] = input1[i] * gain1 + input2[i] * gain2;
    }
}

void convertInt16ToFloat32(const int16_t* input, float* output, size_t count) {
    const float scale = Constants::INT16_TO_FLOAT_SCALE;
    size_t i = 0;
    float32x4_t scaleVec = vdupq_n_f32(scale);

    // Traiter par blocs de 4 échantillons
    for (; i + 3 < count; i += 4) {
        int16x4_t intData = vld1_s16(&input[i]);
        int32x4_t int32Data = vmovl_s16(intData);
        float32x4_t floatData = vcvtq_f32_s32(int32Data);
        float32x4_t result = vmulq_f32(floatData, scaleVec);
        vst1q_f32(&output[i], result);
    }

    // Traiter les échantillons restants
    for (; i < count; ++i) {
        output[i] = input[i] * scale;
    }
}

void convertFloat32ToInt16(const float* input, int16_t* output, size_t count) {
    const float scale = Constants::INT16_SCALE;
    size_t i = 0;
    float32x4_t scaleVec = vdupq_n_f32(scale);
    float32x4_t minVec = vdupq_n_f32(Constants::INT16_MIN_VALUE);
    float32x4_t maxVec = vdupq_n_f32(Constants::INT16_MAX_VALUE);

    // Traiter par blocs de 4 échantillons
    for (; i + 3 < count; i += 4) {
        float32x4_t floatData = vld1q_f32(&input[i]);
        float32x4_t scaled = vmulq_f32(floatData, scaleVec);
        scaled = vmaxq_f32(scaled, minVec);
        scaled = vminq_f32(scaled, maxVec);
        int32x4_t int32Data = vcvtq_s32_f32(scaled);
        int16x4_t int16Data = vqmovn_s32(int32Data);
        vst1_s16(&output[i], int16Data);
    }

    // Traiter les échantillons restants
    for (; i < count; ++i) {
        float sample = input[i] * scale;
        sample = std::max(Constants::INT16_MIN_VALUE, std::min(Constants::INT16_MAX_VALUE, sample));
        output[i] = static_cast<int16_t>(sample);
    }
}

float calculateRMS(const float* data, size_t count) {
    if (!data || count == Constants::NULL_DATA_CHECK) return Constants::RMS_ZERO_RETURN_VALUE;

    size_t i = 0;
    float32x4_t sumVec = vdupq_n_f32(Constants::SUM_INITIAL_VALUE);

    // Traiter par blocs de 4 échantillons
    for (; i + 3 < count; i += 4) {
        float32x4_t dataVec = vld1q_f32(&data[i]);
        float32x4_t squared = vmulq_f32(dataVec, dataVec);
        sumVec = vaddq_f32(sumVec, squared);
    }

    // Réduire le vecteur
    float sum = vgetq_lane_f32(sumVec, 0) + vgetq_lane_f32(sumVec, 1) +
                vgetq_lane_f32(sumVec, 2) + vgetq_lane_f32(sumVec, 3);

    // Traiter les échantillons restants
    for (; i < count; ++i) {
        sum += data[i] * data[i];
    }

    return std::sqrt(sum / count);
}

float calculatePeak(const float* data, size_t count) {
    if (!data || count == Constants::NULL_DATA_CHECK) return Constants::RMS_ZERO_RETURN_VALUE;

    size_t i = 0;
    float32x4_t peakVec = vdupq_n_f32(Constants::MAX_INITIAL_VALUE);

    // Traiter par blocs de 4 échantillons
    for (; i + 3 < count; i += 4) {
        float32x4_t dataVec = vld1q_f32(&data[i]);
        float32x4_t absVec = vabsq_f32(dataVec);
        peakVec = vmaxq_f32(peakVec, absVec);
    }

    // Trouver le maximum dans le vecteur
    float peak = std::max({vgetq_lane_f32(peakVec, 0), vgetq_lane_f32(peakVec, 1),
                           vgetq_lane_f32(peakVec, 2), vgetq_lane_f32(peakVec, 3)});

    // Traiter les échantillons restants
    for (; i < count; ++i) {
        peak = std::max(peak, std::abs(data[i]));
    }

    return peak;
}

void applyGain(float* data, size_t count, float gain) {
    processFloat32(data, data, count, gain);
}

void applyGainRamp(float* data, size_t count, float startGain, float endGain) {
    float gainStep = (endGain - startGain) / count;
    size_t i = 0;

    // Traiter par blocs de 4 échantillons
    for (; i + 3 < count; i += 4) {
        float gains[4] = {
            startGain + gainStep * i,
            startGain + gainStep * (i + 1),
            startGain + gainStep * (i + 2),
            startGain + gainStep * (i + 3)
        };
        float32x4_t gainVec = vld1q_f32(gains);
        float32x4_t dataVec = vld1q_f32(&data[i]);
        float32x4_t result = vmulq_f32(dataVec, gainVec);
        vst1q_f32(&data[i], result);
    }

    // Traiter les échantillons restants
    float currentGain = startGain + gainStep * i;
    for (; i < count; ++i) {
        data[i] *= currentGain;
        currentGain += gainStep;
    }
}

} // namespace neon

#endif // __ARM_NEON

// ============================================================================
// SSE/AVX implementations for x86/x64 platforms
// ============================================================================

#ifdef __AVX2__

namespace avx2 {

// AVX2 implementations using 256-bit vectors (8 floats)
void processFloat32(const float* input, float* output, size_t count, float gain) {
    size_t i = 0;
    __m256 gainVec = _mm256_set1_ps(gain);

    // Traiter par blocs de 8 échantillons
    for (; i + 7 < count; i += 8) {
        __m256 data = _mm256_loadu_ps(&input[i]);
        __m256 result = _mm256_mul_ps(data, gainVec);
        _mm256_storeu_ps(&output[i], result);
    }

    // Traiter les échantillons restants
    for (; i < count; ++i) {
        output[i] = input[i] * gain;
    }
}

void mixFloat32(const float* input1, const float* input2, float* output,
                size_t count, float gain1, float gain2) {
    size_t i = 0;
    __m256 gain1Vec = _mm256_set1_ps(gain1);
    __m256 gain2Vec = _mm256_set1_ps(gain2);

    // Traiter par blocs de 8 échantillons
    for (; i + 7 < count; i += 8) {
        __m256 data1 = _mm256_loadu_ps(&input1[i]);
        __m256 data2 = _mm256_loadu_ps(&input2[i]);
        __m256 result1 = _mm256_mul_ps(data1, gain1Vec);
        __m256 result2 = _mm256_mul_ps(data2, gain2Vec);
        __m256 final = _mm256_add_ps(result1, result2);
        _mm256_storeu_ps(&output[i], final);
    }

    // Traiter les échantillons restants
    for (; i < count; ++i) {
        output[i] = input1[i] * gain1 + input2[i] * gain2;
    }
}

float calculateRMS(const float* data, size_t count) {
    if (!data || count == Constants::NULL_DATA_CHECK) return Constants::RMS_ZERO_RETURN_VALUE;

    size_t i = 0;
    __m256 sumVec = _mm256_setzero_ps();

    // Traiter par blocs de 8 échantillons
    for (; i + 7 < count; i += 8) {
        __m256 dataVec = _mm256_loadu_ps(&data[i]);
        __m256 squared = _mm256_mul_ps(dataVec, dataVec);
        sumVec = _mm256_add_ps(sumVec, squared);
    }

    // Réduire le vecteur
    __m128 sum128 = _mm_add_ps(_mm256_castps256_ps128(sumVec), _mm256_extractf128_ps(sumVec, 1));
    sum128 = _mm_hadd_ps(sum128, sum128);
    sum128 = _mm_hadd_ps(sum128, sum128);
    float sum = _mm_cvtss_f32(sum128);

    // Traiter les échantillons restants
    for (; i < count; ++i) {
        sum += data[i] * data[i];
    }

    return std::sqrt(sum / count);
}

float calculatePeak(const float* data, size_t count) {
    if (!data || count == Constants::NULL_DATA_CHECK) return Constants::RMS_ZERO_RETURN_VALUE;

    size_t i = 0;
    __m256 peakVec = _mm256_setzero_ps();

    // Traiter par blocs de 8 échantillons
    for (; i + 7 < count; i += 8) {
        __m256 dataVec = _mm256_loadu_ps(&data[i]);
        __m256 absVec = _mm256_andnot_ps(_mm256_set1_ps(-0.0f), dataVec); // fabs
        peakVec = _mm256_max_ps(peakVec, absVec);
    }

    // Trouver le maximum
    __m128 peak128 = _mm_max_ps(_mm256_castps256_ps128(peakVec), _mm256_extractf128_ps(peakVec, 1));
    peak128 = _mm_max_ps(peak128, _mm_shuffle_ps(peak128, peak128, _MM_SHUFFLE(0, 0, 3, 2)));
    peak128 = _mm_max_ps(peak128, _mm_shuffle_ps(peak128, peak128, _MM_SHUFFLE(0, 0, 0, 1)));
    float peak = _mm_cvtss_f32(peak128);

    // Traiter les échantillons restants
    for (; i < count; ++i) {
        peak = std::max(peak, std::abs(data[i]));
    }

    return peak;
}

void applyGain(float* data, size_t count, float gain) {
    processFloat32(data, data, count, gain);
}

void applyGainRamp(float* data, size_t count, float startGain, float endGain) {
    float gainStep = (endGain - startGain) / count;
    size_t i = 0;

    // Traiter par blocs de 8 échantillons
    for (; i + 7 < count; i += 8) {
        alignas(32) float gains[8];
        for (int j = 0; j < 8; ++j) {
            gains[j] = startGain + gainStep * (i + j);
        }
        __m256 gainVec = _mm256_load_ps(gains);
        __m256 dataVec = _mm256_loadu_ps(&data[i]);
        __m256 result = _mm256_mul_ps(dataVec, gainVec);
        _mm256_storeu_ps(&data[i], result);
    }

    // Traiter les échantillons restants
    float currentGain = startGain + gainStep * i;
    for (; i < count; ++i) {
        data[i] *= currentGain;
        currentGain += gainStep;
    }
}

} // namespace avx2

#endif // __AVX2__

// ============================================================================
// SSE implementations for x86/x64 platforms
// ============================================================================

#ifdef __SSE2__

namespace sse {

// SSE implementations using 128-bit vectors (4 floats)
void processFloat32(const float* input, float* output, size_t count, float gain) {
    size_t i = 0;
    __m128 gainVec = _mm_set1_ps(gain);

    // Traiter par blocs de 4 échantillons
    for (; i + 3 < count; i += 4) {
        __m128 data = _mm_loadu_ps(&input[i]);
        __m128 result = _mm_mul_ps(data, gainVec);
        _mm_storeu_ps(&output[i], result);
    }

    // Traiter les échantillons restants
    for (; i < count; ++i) {
        output[i] = input[i] * gain;
    }
}

void mixFloat32(const float* input1, const float* input2, float* output,
                size_t count, float gain1, float gain2) {
    size_t i = 0;
    __m128 gain1Vec = _mm_set1_ps(gain1);
    __m128 gain2Vec = _mm_set1_ps(gain2);

    // Traiter par blocs de 4 échantillons
    for (; i + 3 < count; i += 4) {
        __m128 data1 = _mm_loadu_ps(&input1[i]);
        __m128 data2 = _mm_loadu_ps(&input2[i]);
        __m128 result1 = _mm_mul_ps(data1, gain1Vec);
        __m128 result2 = _mm_mul_ps(data2, gain2Vec);
        __m128 final = _mm_add_ps(result1, result2);
        _mm_storeu_ps(&output[i], final);
    }

    // Traiter les échantillons restants
    for (; i < count; ++i) {
        output[i] = input1[i] * gain1 + input2[i] * gain2;
    }
}

float calculateRMS(const float* data, size_t count) {
    if (!data || count == Constants::NULL_DATA_CHECK) return Constants::RMS_ZERO_RETURN_VALUE;

    size_t i = 0;
    __m128 sumVec = _mm_setzero_ps();

    // Traiter par blocs de 4 échantillons
    for (; i + 3 < count; i += 4) {
        __m128 dataVec = _mm_loadu_ps(&data[i]);
        __m128 squared = _mm_mul_ps(dataVec, dataVec);
        sumVec = _mm_add_ps(sumVec, squared);
    }

    // Réduire le vecteur
    sumVec = _mm_hadd_ps(sumVec, sumVec);
    sumVec = _mm_hadd_ps(sumVec, sumVec);
    float sum = _mm_cvtss_f32(sumVec);

    // Traiter les échantillons restants
    for (; i < count; ++i) {
        sum += data[i] * data[i];
    }

    return std::sqrt(sum / count);
}

float calculatePeak(const float* data, size_t count) {
    if (!data || count == Constants::NULL_DATA_CHECK) return Constants::RMS_ZERO_RETURN_VALUE;

    size_t i = 0;
    __m128 peakVec = _mm_setzero_ps();

    // Traiter par blocs de 4 échantillons
    for (; i + 3 < count; i += 4) {
        __m128 dataVec = _mm_loadu_ps(&data[i]);
        __m128 absVec = _mm_andnot_ps(_mm_set1_ps(-0.0f), dataVec); // fabs
        peakVec = _mm_max_ps(peakVec, absVec);
    }

    // Trouver le maximum
    peakVec = _mm_max_ps(peakVec, _mm_shuffle_ps(peakVec, peakVec, _MM_SHUFFLE(0, 0, 3, 2)));
    peakVec = _mm_max_ps(peakVec, _mm_shuffle_ps(peakVec, peakVec, _MM_SHUFFLE(0, 0, 0, 1)));
    float peak = _mm_cvtss_f32(peakVec);

    // Traiter les échantillons restants
    for (; i < count; ++i) {
        peak = std::max(peak, std::abs(data[i]));
    }

    return peak;
}

void applyGain(float* data, size_t count, float gain) {
    processFloat32(data, data, count, gain);
}

void applyGainRamp(float* data, size_t count, float startGain, float endGain) {
    float gainStep = (endGain - startGain) / count;
    size_t i = 0;

    // Traiter par blocs de 4 échantillons
    for (; i + 3 < count; i += 4) {
        alignas(16) float gains[4];
        for (int j = 0; j < 4; ++j) {
            gains[j] = startGain + gainStep * (i + j);
        }
        __m128 gainVec = _mm_load_ps(gains);
        __m128 dataVec = _mm_loadu_ps(&data[i]);
        __m128 result = _mm_mul_ps(dataVec, gainVec);
        _mm_storeu_ps(&data[i], result);
    }

    // Traiter les échantillons restants
    float currentGain = startGain + gainStep * i;
    for (; i < count; ++i) {
        data[i] *= currentGain;
        currentGain += gainStep;
    }
}

} // namespace sse

#endif // __SSE2__

// ============================================================================
// Advanced Audio Effects with SIMD
// ============================================================================

// Filtre passe-bas simple avec SIMD
void applyLowPassFilter(float* data, size_t count, float cutoff, float sampleRate) {
    const float rc = 1.0f / (cutoff * 2.0f * M_PI);
    const float dt = 1.0f / sampleRate;
    const float alpha = dt / (rc + dt);

    float y = data[0];

    for (size_t i = 1; i < count; ++i) {
        y = y + alpha * (data[i] - y);
        data[i] = y;
    }
}

// Égaliseur 3 bandes simple avec SIMD
void applyThreeBandEQ(float* data, size_t count, float lowGain, float midGain, float highGain) {
    // Version simplifiée - appliquer les gains selon la fréquence
    // En pratique, on utiliserait des filtres IIR/FIR avec SIMD

    for (size_t i = 0; i < count; ++i) {
        // Simulation simpliste d'un égaliseur
        float sample = data[i];

        // Gain pour les basses fréquences (approximation)
        if (i < count / 4) {
            sample *= lowGain;
        }
        // Gain pour les fréquences moyennes
        else if (i < 3 * count / 4) {
            sample *= midGain;
        }
        // Gain pour les hautes fréquences
        else {
            sample *= highGain;
        }

        data[i] = sample;
    }
}

// Compression audio simple avec SIMD
void applyCompressor(float* data, size_t count, float threshold, float ratio, float attack, float release) {
    float envelope = 0.0f;

    for (size_t i = 0; i < count; ++i) {
        float absSample = std::abs(data[i]);

        // Calcul de l'envelope
        if (absSample > envelope) {
            envelope = envelope + attack * (absSample - envelope);
        } else {
            envelope = envelope - release * (envelope - absSample);
        }

        // Application de la compression
        if (envelope > threshold) {
            float compressedGain = 1.0f + (envelope - threshold) * (ratio - 1.0f);
            data[i] /= compressedGain;
        }
    }
}

// Reverb simple avec SIMD
void applySimpleReverb(float* data, size_t count, float decay, float mix) {
    const size_t delayLength = 44100 / 4; // 250ms à 44.1kHz
    static std::vector<float> delayBuffer(delayLength, 0.0f);
    static size_t delayIndex = 0;

    for (size_t i = 0; i < count; ++i) {
        // Lecture du signal retardé
        float delayed = delayBuffer[delayIndex];

        // Mixage avec le signal original
        float wet = delayed * decay;
        float dry = data[i];

        // Écriture dans le buffer de delay
        delayBuffer[delayIndex] = dry + wet;

        // Mixage final
        data[i] = dry * (1.0f - mix) + wet * mix;

        // Avancement dans le buffer
        delayIndex = (delayIndex + 1) % delayLength;
    }
}

// Tremolo avec SIMD
void applyTremolo(float* data, size_t count, float rate, float depth, float sampleRate) {
    for (size_t i = 0; i < count; ++i) {
        float t = static_cast<float>(i) / sampleRate;
        float lfo = 1.0f - depth * 0.5f * (1.0f + std::sin(2.0f * M_PI * rate * t));
        data[i] *= lfo;
    }
}

// Flanger avec SIMD
void applyFlanger(float* data, size_t count, float rate, float depth, float feedback, float sampleRate) {
    const size_t maxDelay = static_cast<size_t>(0.01f * sampleRate); // 10ms max
    static std::vector<float> delayBuffer(maxDelay, 0.0f);
    static size_t delayIndex = 0;
    static float feedbackValue = 0.0f;

    for (size_t i = 0; i < count; ++i) {
        float t = static_cast<float>(i) / sampleRate;
        float lfo = 0.5f + 0.5f * std::sin(2.0f * M_PI * rate * t);
        size_t delaySamples = static_cast<size_t>(lfo * maxDelay);

        // Lecture du signal retardé
        size_t readIndex = (delayIndex - delaySamples + maxDelay) % maxDelay;
        float delayed = delayBuffer[readIndex];

        // Mixage avec feedback
        float input = data[i] + feedbackValue * feedback;

        // Écriture dans le buffer
        delayBuffer[delayIndex] = input;

        // Mixage final
        data[i] = data[i] + delayed * depth;

        // Mise à jour du feedback
        feedbackValue = delayed;

        // Avancement
        delayIndex = (delayIndex + 1) % maxDelay;
    }
}

// Limiteur avec SIMD (protection contre les pics)
void applyLimiter(float* data, size_t count, float threshold) {
    for (size_t i = 0; i < count; ++i) {
        if (data[i] > threshold) {
            data[i] = threshold;
        } else if (data[i] < -threshold) {
            data[i] = -threshold;
        }
    }
}

// De-essing (réduction des sibilances)
void applyDeEsser(float* data, size_t count, float threshold, float reduction, float /*sampleRate*/) {
    // Version simplifiée - détecter et réduire les hautes fréquences
    for (size_t i = 2; i < count; ++i) {
        // Détection rudimentaire des transitoires hautes fréquences
        float diff1 = data[i] - data[i-1];
        float diff2 = data[i-1] - data[i-2];

        if (std::abs(diff1) > threshold && std::abs(diff2) > threshold) {
            data[i] *= (1.0f - reduction);
        }
    }
}

// Noise Gate avec SIMD
void applyNoiseGate(float* data, size_t count, float threshold, float attack, float release) {
    static float envelope = 0.0f;
    static bool gateOpen = false;

    for (size_t i = 0; i < count; ++i) {
        float absSample = std::abs(data[i]);

        // Calcul de l'envelope
        if (absSample > envelope) {
            envelope = envelope + attack * (absSample - envelope);
        } else {
            envelope = envelope - release * (envelope - absSample);
        }

        // Décision d'ouverture/fermeture de la gate
        if (envelope > threshold) {
            gateOpen = true;
        } else if (envelope < threshold * 0.1f) {
            gateOpen = false;
            data[i] = 0.0f;
        }

        // Application de la gate
        if (!gateOpen) {
            data[i] = 0.0f;
        }
    }
}

// Distortion avec SIMD
void applyDistortion(float* data, size_t count, float drive, float tone) {
    for (size_t i = 0; i < count; ++i) {
        float sample = data[i];

        // Overdrive avec tanh
        sample = std::tanh(sample * drive);

        // Filtrage simple pour le ton
        if (tone < 1.0f) {
            static float prevSample = 0.0f;
            sample = sample * tone + prevSample * (1.0f - tone);
            prevSample = sample;
        }

        data[i] = sample;
    }
}

// Chorus avec SIMD
void applyChorus(float* data, size_t count, float rate, float depth, float feedback, float sampleRate) {
    const size_t maxDelay = static_cast<size_t>(0.03f * sampleRate); // 30ms max
    static std::vector<float> delayBuffer(maxDelay, 0.0f);
    static size_t delayIndex = 0;

    for (size_t i = 0; i < count; ++i) {
        float t = static_cast<float>(i) / sampleRate;
        float lfo = 0.5f + 0.5f * std::sin(2.0f * M_PI * rate * t);
        size_t delaySamples = static_cast<size_t>(lfo * depth * maxDelay);

        // Lecture du signal retardé
        size_t readIndex = (delayIndex - delaySamples + maxDelay) % maxDelay;
        float delayed = delayBuffer[readIndex];

        // Mixage avec feedback
        float input = data[i] + delayed * feedback;

        // Écriture dans le buffer
        delayBuffer[delayIndex] = input;

        // Mixage final (chorus = original + retardé)
        data[i] = data[i] + delayed;

        // Avancement
        delayIndex = (delayIndex + 1) % maxDelay;
    }
}

// ============================================================================
// Public API - Select best implementation based on CPU features
// ============================================================================

void processFloat32(const float* input, float* output, size_t count, float gain) {
#if defined(__AVX2__)
    avx2::processFloat32(input, output, count, gain);
#elif defined(__SSE2__)
    sse::processFloat32(input, output, count, gain);
#elif defined(__ARM_NEON)
    neon::processFloat32(input, output, count, gain);
#else
    generic::processFloat32(input, output, count, gain);
#endif
}

void mixFloat32(const float* input1, const float* input2, float* output,
                size_t count, float gain1, float gain2) {
#if defined(__AVX2__)
    avx2::mixFloat32(input1, input2, output, count, gain1, gain2);
#elif defined(__SSE2__)
    sse::mixFloat32(input1, input2, output, count, gain1, gain2);
#elif defined(__ARM_NEON)
    neon::mixFloat32(input1, input2, output, count, gain1, gain2);
#else
    generic::mixFloat32(input1, input2, output, count, gain1, gain2);
#endif
}

void convertInt16ToFloat32(const int16_t* input, float* output, size_t count) {
#if defined(__AVX2__)
    // AVX2 version could be added here for int16->float conversion
    generic::convertInt16ToFloat32(input, output, count);
#elif defined(__SSE2__)
    // SSE version could be added here for int16->float conversion
    generic::convertInt16ToFloat32(input, output, count);
#elif defined(__ARM_NEON)
    neon::convertInt16ToFloat32(input, output, count);
#else
    generic::convertInt16ToFloat32(input, output, count);
#endif
}

void convertFloat32ToInt16(const float* input, int16_t* output, size_t count) {
#if defined(__AVX2__)
    // AVX2 version could be added here for float->int16 conversion
    generic::convertFloat32ToInt16(input, output, count);
#elif defined(__SSE2__)
    // SSE version could be added here for float->int16 conversion
    generic::convertFloat32ToInt16(input, output, count);
#elif defined(__ARM_NEON)
    neon::convertFloat32ToInt16(input, output, count);
#else
    generic::convertFloat32ToInt16(input, output, count);
#endif
}

float calculateRMS(const float* data, size_t count) {
#if defined(__AVX2__)
    return avx2::calculateRMS(data, count);
#elif defined(__SSE2__)
    return sse::calculateRMS(data, count);
#elif defined(__ARM_NEON)
    return neon::calculateRMS(data, count);
#else
    return generic::calculateRMS(data, count);
#endif
}

float calculatePeak(const float* data, size_t count) {
#if defined(__AVX2__)
    return avx2::calculatePeak(data, count);
#elif defined(__SSE2__)
    return sse::calculatePeak(data, count);
#elif defined(__ARM_NEON)
    return neon::calculatePeak(data, count);
#else
    return generic::calculatePeak(data, count);
#endif
}

void applyGain(float* data, size_t count, float gain) {
#if defined(__AVX2__)
    avx2::applyGain(data, count, gain);
#elif defined(__SSE2__)
    sse::applyGain(data, count, gain);
#elif defined(__ARM_NEON)
    neon::applyGain(data, count, gain);
#else
    generic::applyGain(data, count, gain);
#endif
}

void applyGainRamp(float* data, size_t count, float startGain, float endGain) {
#if defined(__AVX2__)
    avx2::applyGainRamp(data, count, startGain, endGain);
#elif defined(__SSE2__)
    sse::applyGainRamp(data, count, startGain, endGain);
#elif defined(__ARM_NEON)
    neon::applyGainRamp(data, count, startGain, endGain);
#else
    generic::applyGainRamp(data, count, startGain, endGain);
#endif
}

bool isSimdAvailable() {
#if defined(__AVX2__) || defined(__SSE2__) || defined(__ARM_NEON)
    return true;
#else
    return false;
#endif
}

std::string getSimdType() {
#if defined(__AVX2__)
    return "AVX2 (256-bit vectors)";
#elif defined(__SSE2__)
    return "SSE2 (128-bit vectors)";
#elif defined(__ARM_NEON)
    return "ARM NEON";
#else
    return "Generic (No SIMD)";
#endif
}

// ============================================================================
// Benchmarking and Performance Testing
// ============================================================================

namespace Benchmark {

// Fonction de benchmark complet
void runCompleteBenchmark(size_t sampleCount) { // 1 million d'échantillons
    std::cout << "=== SIMD Benchmark Results ===" << std::endl;
    std::cout << "Sample count: " << sampleCount << std::endl;
    std::cout << "Implementation: " << getSimdType() << std::endl;
    std::cout << "SIMD available: " << (isSimdAvailable() ? "Yes" : "No") << std::endl;
    std::cout << std::endl;

    // Benchmark processFloat32
    std::vector<float> input(sampleCount);
    std::vector<float> output(sampleCount);
    float gain = 1.5f;

    // Initialiser les données de test
    for (size_t i = 0; i < sampleCount; ++i) {
        input[i] = static_cast<float>(rand()) / RAND_MAX * 2.0f - 1.0f;
    }

    auto start = std::chrono::high_resolution_clock::now();
    SIMD::processFloat32(input.data(), output.data(), sampleCount, gain);
    auto end = std::chrono::high_resolution_clock::now();
    double timeMs = std::chrono::duration<double, std::milli>(end - start).count();

    double throughput = sampleCount / (timeMs / 1000.0);
    std::cout << "processFloat32:" << std::endl;
    std::cout << "  Time: " << std::fixed << std::setprecision(2) << timeMs << " ms" << std::endl;
    std::cout << "  Throughput: " << (throughput / 1000000.0) << " M samples/sec" << std::endl;
    std::cout << std::endl;

    // Benchmark calculateRMS
    start = std::chrono::high_resolution_clock::now();
    float rms = SIMD::calculateRMS(input.data(), sampleCount);
    end = std::chrono::high_resolution_clock::now();
    timeMs = std::chrono::duration<double, std::milli>(end - start).count();

    throughput = sampleCount / (timeMs / 1000.0);
    std::cout << "calculateRMS:" << std::endl;
    std::cout << "  Time: " << std::fixed << std::setprecision(2) << timeMs << " ms" << std::endl;
    std::cout << "  Throughput: " << (throughput / 1000000.0) << " M samples/sec" << std::endl;
    std::cout << "  RMS: " << std::fixed << std::setprecision(4) << rms << "\n";
    std::cout << std::endl;

    // Benchmark calculatePeak
    start = std::chrono::high_resolution_clock::now();
    float peak = SIMD::calculatePeak(input.data(), sampleCount);
    end = std::chrono::high_resolution_clock::now();
    timeMs = std::chrono::duration<double, std::milli>(end - start).count();

    throughput = sampleCount / (timeMs / 1000.0);
    std::cout << "calculatePeak:" << std::endl;
    std::cout << "  Time: " << std::fixed << std::setprecision(2) << timeMs << " ms" << std::endl;
    std::cout << "  Throughput: " << (throughput / 1000000.0) << " M samples/sec" << std::endl;
    std::cout << "  Peak: " << std::fixed << std::setprecision(4) << peak << "\n";
    std::cout << std::endl;
}

} // namespace Benchmark

} // namespace SIMD
} // namespace Audio
} // namespace Nyth
