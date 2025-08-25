#include "SIMDCore.hpp"
#include <algorithm>
#include <cmath>
#include <chrono>
#include <iostream>
#include <iomanip>
#include <memory>
#include <cstring>

// Support ARM NEON (Mobile uniquement)
#ifdef __ARM_NEON
#include <arm_neon.h>
#endif

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

#ifndef INFINITY
#define INFINITY (1.0f/0.0f)
#endif

namespace AudioNR {
namespace SIMD {

// ====================
// Implémentation SIMDMathOptimized
// ====================

void SIMDMathOptimized::add(float* RESTRICT result,
                           const float* RESTRICT a,
                           const float* RESTRICT b,
                           size_t count) {
#ifdef __ARM_NEON
    const size_t simdWidth = 4;
    const size_t unrollFactor = 4; // Process 16 elements at once
    size_t i = 0;

    // Version déroulée pour les gros blocs
    for (; i + (simdWidth * unrollFactor) - 1 < count; i += simdWidth * unrollFactor) {
        // Préfetch des données suivantes
        PREFETCH(&a[i + 64]);
        PREFETCH(&b[i + 64]);

        Vec4f va0 = SIMDOps::load(&a[i]);
        Vec4f va1 = SIMDOps::load(&a[i + 4]);
        Vec4f va2 = SIMDOps::load(&a[i + 8]);
        Vec4f va3 = SIMDOps::load(&a[i + 12]);

        Vec4f vb0 = SIMDOps::load(&b[i]);
        Vec4f vb1 = SIMDOps::load(&b[i + 4]);
        Vec4f vb2 = SIMDOps::load(&b[i + 8]);
        Vec4f vb3 = SIMDOps::load(&b[i + 12]);

        Vec4f vr0 = SIMDOps::add(va0, vb0);
        Vec4f vr1 = SIMDOps::add(va1, vb1);
        Vec4f vr2 = SIMDOps::add(va2, vb2);
        Vec4f vr3 = SIMDOps::add(va3, vb3);

        SIMDOps::store(&result[i], vr0);
        SIMDOps::store(&result[i + 4], vr1);
        SIMDOps::store(&result[i + 8], vr2);
        SIMDOps::store(&result[i + 12], vr3);
    }

    // Version normale pour les blocs moyens
    for (; i + simdWidth - 1 < count; i += simdWidth) {
        Vec4f va = SIMDOps::load(&a[i]);
        Vec4f vb = SIMDOps::load(&b[i]);
        Vec4f vr = SIMDOps::add(va, vb);
        SIMDOps::store(&result[i], vr);
    }

    // Échantillons restants
    for (; i < count; ++i) {
        result[i] = a[i] + b[i];
    }
#else
    // Version scalaire optimisée avec déroulement de boucle
    size_t i = 0;
    for (; i + 3 < count; i += 4) {
        result[i] = a[i] + b[i];
        result[i + 1] = a[i + 1] + b[i + 1];
        result[i + 2] = a[i + 2] + b[i + 2];
        result[i + 3] = a[i + 3] + b[i + 3];
    }
    for (; i < count; ++i) {
        result[i] = a[i] + b[i];
    }
#endif
}

void SIMDMathOptimized::multiply(float* RESTRICT result,
                                const float* RESTRICT a,
                                const float* RESTRICT b,
                                size_t count) {
#ifdef __ARM_NEON
    const size_t simdWidth = 4;
    const size_t unrollFactor = 4;
    size_t i = 0;

    // Version déroulée pour les gros blocs
    for (; i + (simdWidth * unrollFactor) - 1 < count; i += simdWidth * unrollFactor) {
        PREFETCH(&a[i + 64]);
        PREFETCH(&b[i + 64]);

        Vec4f va0 = SIMDOps::load(&a[i]);
        Vec4f va1 = SIMDOps::load(&a[i + 4]);
        Vec4f va2 = SIMDOps::load(&a[i + 8]);
        Vec4f va3 = SIMDOps::load(&a[i + 12]);

        Vec4f vb0 = SIMDOps::load(&b[i]);
        Vec4f vb1 = SIMDOps::load(&b[i + 4]);
        Vec4f vb2 = SIMDOps::load(&b[i + 8]);
        Vec4f vb3 = SIMDOps::load(&b[i + 12]);

        Vec4f vr0 = SIMDOps::mul(va0, vb0);
        Vec4f vr1 = SIMDOps::mul(va1, vb1);
        Vec4f vr2 = SIMDOps::mul(va2, vb2);
        Vec4f vr3 = SIMDOps::mul(va3, vb3);

        SIMDOps::store(&result[i], vr0);
        SIMDOps::store(&result[i + 4], vr1);
        SIMDOps::store(&result[i + 8], vr2);
        SIMDOps::store(&result[i + 12], vr3);
    }

    // Version normale pour les blocs moyens
    for (; i + simdWidth - 1 < count; i += simdWidth) {
        Vec4f va = SIMDOps::load(&a[i]);
        Vec4f vb = SIMDOps::load(&b[i]);
        Vec4f vr = SIMDOps::mul(va, vb);
        SIMDOps::store(&result[i], vr);
    }

    // Échantillons restants
    for (; i < count; ++i) {
        result[i] = a[i] * b[i];
    }
#else
    size_t i = 0;
    for (; i + 3 < count; i += 4) {
        result[i] = a[i] * b[i];
        result[i + 1] = a[i + 1] * b[i + 1];
        result[i + 2] = a[i + 2] * b[i + 2];
        result[i + 3] = a[i + 3] * b[i + 3];
    }
    for (; i < count; ++i) {
        result[i] = a[i] * b[i];
    }
#endif
}

void SIMDMathOptimized::multiplyScalar(float* RESTRICT result,
                                      const float* RESTRICT a,
                                      float scalar,
                                      size_t count) {
#ifdef __ARM_NEON
    size_t i = 0;
    Vec4f scalarVec = SIMDOps::broadcast(scalar);
    for (; i + 15 < count; i += 16) {
        PREFETCH(&a[i + 64]);

        Vec4f va0 = SIMDOps::load(&a[i]);
        Vec4f va1 = SIMDOps::load(&a[i + 4]);
        Vec4f va2 = SIMDOps::load(&a[i + 8]);
        Vec4f va3 = SIMDOps::load(&a[i + 12]);

        Vec4f vr0 = SIMDOps::mul(va0, scalarVec);
        Vec4f vr1 = SIMDOps::mul(va1, scalarVec);
        Vec4f vr2 = SIMDOps::mul(va2, scalarVec);
        Vec4f vr3 = SIMDOps::mul(va3, scalarVec);

        SIMDOps::store(&result[i], vr0);
        SIMDOps::store(&result[i + 4], vr1);
        SIMDOps::store(&result[i + 8], vr2);
        SIMDOps::store(&result[i + 12], vr3);
    }

    for (; i + 3 < count; i += 4) {
        Vec4f va = SIMDOps::load(&a[i]);
        Vec4f vr = SIMDOps::mul(va, scalarVec);
        SIMDOps::store(&result[i], vr);
    }

    for (; i < count; ++i) {
        result[i] = a[i] * scalar;
    }
#else
    for (size_t i = 0; i < count; ++i) {
        result[i] = a[i] * scalar;
    }
#endif
}

void SIMDMathOptimized::abs(float* RESTRICT result, const float* RESTRICT a, size_t count) {
#ifdef __ARM_NEON
    size_t i = 0;
    for (; i + 15 < count; i += 16) {
        PREFETCH(&a[i + 64]);

        Vec4f va0 = SIMDOps::load(&a[i]);
        Vec4f va1 = SIMDOps::load(&a[i + 4]);
        Vec4f va2 = SIMDOps::load(&a[i + 8]);
        Vec4f va3 = SIMDOps::load(&a[i + 12]);

        Vec4f vr0 = SIMDOps::abs(va0);
        Vec4f vr1 = SIMDOps::abs(va1);
        Vec4f vr2 = SIMDOps::abs(va2);
        Vec4f vr3 = SIMDOps::abs(va3);

        SIMDOps::store(&result[i], vr0);
        SIMDOps::store(&result[i + 4], vr1);
        SIMDOps::store(&result[i + 8], vr2);
        SIMDOps::store(&result[i + 12], vr3);
    }

    for (; i + 3 < count; i += 4) {
        Vec4f va = SIMDOps::load(&a[i]);
        Vec4f vr = SIMDOps::abs(va);
        SIMDOps::store(&result[i], vr);
    }

    for (; i < count; ++i) {
        result[i] = std::abs(a[i]);
    }
#else
    for (size_t i = 0; i < count; ++i) {
        result[i] = std::abs(a[i]);
    }
#endif
}

float SIMDMathOptimized::sum(const float* RESTRICT data, size_t count) {
#ifdef __ARM_NEON
    if (count < 4) {
        float sum = 0.0f;
        for (size_t i = 0; i < count; ++i) {
            sum += data[i];
        }
        return sum;
    }

    size_t i = 0;
    Vec4f sum0 = SIMDOps::broadcast(0.0f);
    Vec4f sum1 = SIMDOps::broadcast(0.0f);
    Vec4f sum2 = SIMDOps::broadcast(0.0f);
    Vec4f sum3 = SIMDOps::broadcast(0.0f);

    // Déroulement x4 pour réduire les dépendances
    for (; i + 15 < count; i += 16) {
        PREFETCH(&data[i + 64]);

        sum0 = SIMDOps::add(sum0, SIMDOps::load(&data[i]));
        sum1 = SIMDOps::add(sum1, SIMDOps::load(&data[i + 4]));
        sum2 = SIMDOps::add(sum2, SIMDOps::load(&data[i + 8]));
        sum3 = SIMDOps::add(sum3, SIMDOps::load(&data[i + 12]));
    }

    // Combiner les accumulateurs
    sum0 = SIMDOps::add(sum0, sum1);
    sum2 = SIMDOps::add(sum2, sum3);
    sum0 = SIMDOps::add(sum0, sum2);

    // Traiter les éléments restants
    for (; i + 3 < count; i += 4) {
        sum0 = SIMDOps::add(sum0, SIMDOps::load(&data[i]));
    }

    // Réduction horizontale
    float result = SIMDOps::hsum(sum0);

    // Éléments finaux
    for (; i < count; ++i) {
        result += data[i];
    }

    return result;
#else
    float sum = 0.0f;
    size_t i = 0;

    // Déroulement x4 pour la version scalaire aussi
    float sum0 = 0.0f, sum1 = 0.0f, sum2 = 0.0f, sum3 = 0.0f;
    for (; i + 3 < count; i += 4) {
        sum0 += data[i];
        sum1 += data[i + 1];
        sum2 += data[i + 2];
        sum3 += data[i + 3];
    }
    sum = sum0 + sum1 + sum2 + sum3;

    for (; i < count; ++i) {
        sum += data[i];
    }
    return sum;
#endif
}

float SIMDMathOptimized::max(const float* RESTRICT data, size_t count) {
#ifdef __ARM_NEON
    if (count < 4) {
        float maxVal = -INFINITY;
        for (size_t i = 0; i < count; ++i) {
            maxVal = std::max(maxVal, data[i]);
        }
        return maxVal;
    }

    size_t i = 0;
    Vec4f maxVec = SIMDOps::broadcast(-INFINITY);

    for (; i + 15 < count; i += 16) {
        PREFETCH(&data[i + 64]);

        Vec4f v0 = SIMDOps::load(&data[i]);
        Vec4f v1 = SIMDOps::load(&data[i + 4]);
        Vec4f v2 = SIMDOps::load(&data[i + 8]);
        Vec4f v3 = SIMDOps::load(&data[i + 12]);

        maxVec = SIMDOps::max(maxVec, v0);
        maxVec = SIMDOps::max(maxVec, v1);
        maxVec = SIMDOps::max(maxVec, v2);
        maxVec = SIMDOps::max(maxVec, v3);
    }

    for (; i + 3 < count; i += 4) {
        Vec4f v = SIMDOps::load(&data[i]);
        maxVec = SIMDOps::max(maxVec, v);
    }

    float result = SIMDOps::hmax(maxVec);

    for (; i < count; ++i) {
        result = std::max(result, data[i]);
    }

    return result;
#else
    float maxVal = -INFINITY;
    for (size_t i = 0; i < count; ++i) {
        maxVal = std::max(maxVal, data[i]);
    }
    return maxVal;
#endif
}

float SIMDMathOptimized::rms(const float* RESTRICT data, size_t count) {
    if (count == 0) return 0.0f;

#ifdef __ARM_NEON
    size_t i = 0;
    Vec4f sum0 = SIMDOps::broadcast(0.0f);
    Vec4f sum1 = SIMDOps::broadcast(0.0f);
    Vec4f sum2 = SIMDOps::broadcast(0.0f);
    Vec4f sum3 = SIMDOps::broadcast(0.0f);

    for (; i + 15 < count; i += 16) {
        PREFETCH(&data[i + 64]);

        Vec4f v0 = SIMDOps::load(&data[i]);
        Vec4f v1 = SIMDOps::load(&data[i + 4]);
        Vec4f v2 = SIMDOps::load(&data[i + 8]);
        Vec4f v3 = SIMDOps::load(&data[i + 12]);

        sum0 = SIMDOps::fma(v0, v0, sum0);
        sum1 = SIMDOps::fma(v1, v1, sum1);
        sum2 = SIMDOps::fma(v2, v2, sum2);
        sum3 = SIMDOps::fma(v3, v3, sum3);
    }

    sum0 = SIMDOps::add(sum0, sum1);
    sum2 = SIMDOps::add(sum2, sum3);
    sum0 = SIMDOps::add(sum0, sum2);

    for (; i + 3 < count; i += 4) {
        Vec4f v = SIMDOps::load(&data[i]);
        sum0 = SIMDOps::fma(v, v, sum0);
    }

    float sumSquares = SIMDOps::hsum(sum0);

    for (; i < count; ++i) {
        sumSquares += data[i] * data[i];
    }

    return std::sqrt(sumSquares / count);
#else
    float sumSquares = 0.0f;
    for (size_t i = 0; i < count; ++i) {
        sumSquares += data[i] * data[i];
    }
    return std::sqrt(sumSquares / count);
#endif
}

// FMA (Fused Multiply-Add) pour une meilleure performance
void SIMDMathOptimized::fma(float* RESTRICT result,
                           const float* RESTRICT a,
                           const float* RESTRICT b,
                           const float* RESTRICT c,
                           size_t count) {
#ifdef __ARM_NEON
    size_t i = 0;
    for (; i + 15 < count; i += 16) {
        PREFETCH(&a[i + 64]);
        PREFETCH(&b[i + 64]);
        PREFETCH(&c[i + 64]);

        Vec4f va0 = SIMDOps::load(&a[i]);
        Vec4f va1 = SIMDOps::load(&a[i + 4]);
        Vec4f va2 = SIMDOps::load(&a[i + 8]);
        Vec4f va3 = SIMDOps::load(&a[i + 12]);

        Vec4f vb0 = SIMDOps::load(&b[i]);
        Vec4f vb1 = SIMDOps::load(&b[i + 4]);
        Vec4f vb2 = SIMDOps::load(&b[i + 8]);
        Vec4f vb3 = SIMDOps::load(&b[i + 12]);

        Vec4f vc0 = SIMDOps::load(&c[i]);
        Vec4f vc1 = SIMDOps::load(&c[i + 4]);
        Vec4f vc2 = SIMDOps::load(&c[i + 8]);
        Vec4f vc3 = SIMDOps::load(&c[i + 12]);

        Vec4f vr0 = SIMDOps::fma(va0, vb0, vc0);
        Vec4f vr1 = SIMDOps::fma(va1, vb1, vc1);
        Vec4f vr2 = SIMDOps::fma(va2, vb2, vc2);
        Vec4f vr3 = SIMDOps::fma(va3, vb3, vc3);

        SIMDOps::store(&result[i], vr0);
        SIMDOps::store(&result[i + 4], vr1);
        SIMDOps::store(&result[i + 8], vr2);
        SIMDOps::store(&result[i + 12], vr3);
    }

    for (; i + 3 < count; i += 4) {
        Vec4f va = SIMDOps::load(&a[i]);
        Vec4f vb = SIMDOps::load(&b[i]);
        Vec4f vc = SIMDOps::load(&c[i]);
        Vec4f vr = SIMDOps::fma(va, vb, vc);
        SIMDOps::store(&result[i], vr);
    }

    for (; i < count; ++i) {
        result[i] = a[i] * b[i] + c[i];
    }
#else
    for (size_t i = 0; i < count; ++i) {
        result[i] = a[i] * b[i] + c[i];
    }
#endif
}

// ====================
// Implémentation SIMDUtils
// ====================

void SIMDUtils::convertInt16ToFloat32(const int16_t* input, float* output, size_t count) {
    const float scale = 1.0f / 32768.0f;
#ifdef __ARM_NEON
    size_t i = 0;
    Vec4f scaleVec = SIMDOps::broadcast(scale);
    for (; i + 7 < count; i += 8) {
        // Charger 8 valeurs int16_t (4 paires de 2x int16x4_t)
        int16x4_t intVec0 = vld1_s16(&input[i]);
        int16x4_t intVec1 = vld1_s16(&input[i + 4]);

        // Convertir en int32
        int32x4_t int32Vec0 = vmovl_s16(intVec0);
        int32x4_t int32Vec1 = vmovl_s16(intVec1);

        // Convertir en float
        Vec4f floatVec0 = vcvtq_f32_s32(int32Vec0);
        Vec4f floatVec1 = vcvtq_f32_s32(int32Vec1);

        // Appliquer le scale
        Vec4f result0 = SIMDOps::mul(floatVec0, scaleVec);
        Vec4f result1 = SIMDOps::mul(floatVec1, scaleVec);

        SIMDOps::store(&output[i], result0);
        SIMDOps::store(&output[i + 4], result1);
    }

    for (; i + 3 < count; i += 4) {
        int16x4_t intVec = vld1_s16(&input[i]);
        int32x4_t int32Vec = vmovl_s16(intVec);
        Vec4f floatVec = vcvtq_f32_s32(int32Vec);
        Vec4f result = SIMDOps::mul(floatVec, scaleVec);
        SIMDOps::store(&output[i], result);
    }

    for (; i < count; ++i) {
        output[i] = input[i] * scale;
    }
#else
    for (size_t i = 0; i < count; ++i) {
        output[i] = input[i] * scale;
    }
#endif
}

void SIMDUtils::convertFloat32ToInt16(const float* input, int16_t* output, size_t count) {
    const float scale = 32767.0f;
#ifdef __ARM_NEON
    size_t i = 0;
    Vec4f scaleVec = SIMDOps::broadcast(scale);
    Vec4f minVec = SIMDOps::broadcast(-32768.0f);
    Vec4f maxVec = SIMDOps::broadcast(32767.0f);

    for (; i + 7 < count; i += 8) {
        Vec4f floatVec0 = SIMDOps::load(&input[i]);
        Vec4f floatVec1 = SIMDOps::load(&input[i + 4]);

        Vec4f scaled0 = SIMDOps::mul(floatVec0, scaleVec);
        Vec4f scaled1 = SIMDOps::mul(floatVec1, scaleVec);

        scaled0 = SIMDOps::max(SIMDOps::min(scaled0, maxVec), minVec);
        scaled1 = SIMDOps::max(SIMDOps::min(scaled1, maxVec), minVec);

        int32x4_t int32Vec0 = vcvtq_s32_f32(scaled0);
        int32x4_t int32Vec1 = vcvtq_s32_f32(scaled1);

        int16x4_t int16Vec0 = vqmovn_s32(int32Vec0);
        int16x4_t int16Vec1 = vqmovn_s32(int32Vec1);

        vst1_s16(&output[i], int16Vec0);
        vst1_s16(&output[i + 4], int16Vec1);
    }

    for (; i + 3 < count; i += 4) {
        Vec4f floatVec = SIMDOps::load(&input[i]);
        Vec4f scaled = SIMDOps::mul(floatVec, scaleVec);
        scaled = SIMDOps::max(SIMDOps::min(scaled, maxVec), minVec);
        int32x4_t int32Vec = vcvtq_s32_f32(scaled);
        int16x4_t int16Vec = vqmovn_s32(int32Vec);
        vst1_s16(&output[i], int16Vec);
    }

    for (; i < count; ++i) {
        float sample = input[i] * scale;
        sample = std::max(-32768.0f, std::min(32767.0f, sample));
        output[i] = static_cast<int16_t>(sample);
    }
#else
    for (size_t i = 0; i < count; ++i) {
        float sample = input[i] * scale;
        sample = std::max(-32768.0f, std::min(32767.0f, sample));
        output[i] = static_cast<int16_t>(sample);
    }
#endif
}

void SIMDUtils::applyGain(float* data, size_t count, float gain) {
    SIMDMathOptimized::multiplyScalar(data, data, gain, count);
}

void SIMDUtils::applyGainRamp(float* data, size_t count, float startGain, float endGain) {
    float gainStep = (endGain - startGain) / count;
    float currentGain = startGain;

    // Version vectorisée avec calcul des gains
    std::vector<float> gains(count);
    for (size_t i = 0; i < count; ++i) {
        gains[i] = currentGain;
        currentGain += gainStep;
    }

    SIMDMathOptimized::multiply(data, data, gains.data(), count);
}

void SIMDUtils::mixFloat32(const float* input1, const float* input2, float* output,
                          size_t count, float gain1, float gain2) {
#ifdef __ARM_NEON
    size_t i = 0;
    Vec4f gain1Vec = SIMDOps::broadcast(gain1);
    Vec4f gain2Vec = SIMDOps::broadcast(gain2);

    for (; i + 7 < count; i += 8) {
        Vec4f in1_0 = SIMDOps::load(&input1[i]);
        Vec4f in1_1 = SIMDOps::load(&input1[i + 4]);
        Vec4f in2_0 = SIMDOps::load(&input2[i]);
        Vec4f in2_1 = SIMDOps::load(&input2[i + 4]);

        Vec4f result1_0 = SIMDOps::mul(in1_0, gain1Vec);
        Vec4f result1_1 = SIMDOps::mul(in1_1, gain1Vec);
        Vec4f result2_0 = SIMDOps::mul(in2_0, gain2Vec);
        Vec4f result2_1 = SIMDOps::mul(in2_1, gain2Vec);

        Vec4f final_0 = SIMDOps::add(result1_0, result2_0);
        Vec4f final_1 = SIMDOps::add(result1_1, result2_1);

        SIMDOps::store(&output[i], final_0);
        SIMDOps::store(&output[i + 4], final_1);
    }

    for (; i + 3 < count; i += 4) {
        Vec4f in1 = SIMDOps::load(&input1[i]);
        Vec4f in2 = SIMDOps::load(&input2[i]);
        Vec4f result1 = SIMDOps::mul(in1, gain1Vec);
        Vec4f result2 = SIMDOps::mul(in2, gain2Vec);
        Vec4f final = SIMDOps::add(result1, result2);
        SIMDOps::store(&output[i], final);
    }

    for (; i < count; ++i) {
        output[i] = input1[i] * gain1 + input2[i] * gain2;
    }
#else
    for (size_t i = 0; i < count; ++i) {
        output[i] = input1[i] * gain1 + input2[i] * gain2;
    }
#endif
}

void SIMDUtils::clamp(float* data, size_t count, float minVal, float maxVal) {
#ifdef __ARM_NEON
    size_t i = 0;
    Vec4f minVec = SIMDOps::broadcast(minVal);
    Vec4f maxVec = SIMDOps::broadcast(maxVal);

    for (; i + 7 < count; i += 8) {
        Vec4f v0 = SIMDOps::load(&data[i]);
        Vec4f v1 = SIMDOps::load(&data[i + 4]);

        v0 = SIMDOps::max(SIMDOps::min(v0, maxVec), minVec);
        v1 = SIMDOps::max(SIMDOps::min(v1, maxVec), minVec);

        SIMDOps::store(&data[i], v0);
        SIMDOps::store(&data[i + 4], v1);
    }

    for (; i + 3 < count; i += 4) {
        Vec4f v = SIMDOps::load(&data[i]);
        v = SIMDOps::max(SIMDOps::min(v, maxVec), minVec);
        SIMDOps::store(&data[i], v);
    }

    for (; i < count; ++i) {
        data[i] = std::max(minVal, std::min(maxVal, data[i]));
    }
#else
    for (size_t i = 0; i < count; ++i) {
        data[i] = std::max(minVal, std::min(maxVal, data[i]));
    }
#endif
}

// ====================
// Implémentation AlignedMemory
// ====================

float* AlignedMemory::allocate(size_t count) {
    // Allocation alignée sur 32 octets pour AVX
    size_t alignment = 32;
    size_t size = count * sizeof(float);
    void* ptr = nullptr;
#ifdef _WIN32
    ptr = _aligned_malloc(size, alignment);
#else
    if (posix_memalign(&ptr, alignment, size) != 0) {
        ptr = nullptr;
    }
#endif
    return static_cast<float*>(ptr);
}

void AlignedMemory::deallocate(float* ptr) {
#ifdef _WIN32
    _aligned_free(ptr);
#else
    free(ptr);
#endif
}

bool AlignedMemory::isAligned(const void* ptr, size_t alignment) {
    return (reinterpret_cast<uintptr_t>(ptr) % alignment) == 0;
}

// ====================
// Implémentation SIMDUtils
// ====================

void SIMDUtils::convertInt16ToFloat32(const int16_t* input, float* output, size_t count) {
    const float scale = 1.0f / 32768.0f;
#if defined(__ARM_NEON)
    size_t i = 0;
    float32x4_t scaleVec = vdupq_n_f32(scale);
    for (; i + 3 < count; i += 4) {
        int16x4_t intVec = vld1_s16(&input[i]);
        int32x4_t int32Vec = vmovl_s16(intVec);
        float32x4_t floatVec = vcvtq_f32_s32(int32Vec);
        float32x4_t result = vmulq_f32(floatVec, scaleVec);
        vst1q_f32(&output[i], result);
    }
    for (; i < count; ++i) {
        output[i] = input[i] * scale;
    }
#else
    for (size_t i = 0; i < count; ++i) {
        output[i] = input[i] * scale;
    }
#endif
}

void SIMDUtils::convertFloat32ToInt16(const float* input, int16_t* output, size_t count) {
    const float scale = 32767.0f;
#if defined(__ARM_NEON)
    size_t i = 0;
    float32x4_t scaleVec = vdupq_n_f32(scale);
    float32x4_t minVec = vdupq_n_f32(-32768.0f);
    float32x4_t maxVec = vdupq_n_f32(32767.0f);
    for (; i + 3 < count; i += 4) {
        float32x4_t floatVec = vld1q_f32(&input[i]);
        floatVec = vmulq_f32(floatVec, scaleVec);
        floatVec = vminq_f32(vmaxq_f32(floatVec, minVec), maxVec);
        int32x4_t int32Vec = vcvtq_s32_f32(floatVec);
        int16x4_t int16Vec = vqmovn_s32(int32Vec);
        vst1_s16(&output[i], int16Vec);
    }
    for (; i < count; ++i) {
        float sample = input[i] * scale;
        sample = std::max(-32768.0f, std::min(32767.0f, sample));
        output[i] = static_cast<int16_t>(sample);
    }
#else
    for (size_t i = 0; i < count; ++i) {
        float sample = input[i] * scale;
        sample = std::max(-32768.0f, std::min(32767.0f, sample));
        output[i] = static_cast<int16_t>(sample);
    }
#endif
}

void SIMDUtils::applyGain(float* data, size_t count, float gain) {
    SIMDMath::multiplyScalar(data, data, gain, count);
}

void SIMDUtils::applyGainRamp(float* data, size_t count, float startGain, float endGain) {
    float gainStep = (endGain - startGain) / count;
    float currentGain = startGain;

    // Version vectorisée avec calcul des gains
    std::vector<float> gains(count);
    for (size_t i = 0; i < count; ++i) {
        gains[i] = currentGain;
        currentGain += gainStep;
    }

    SIMDMath::multiply(data, data, gains.data(), count);
}

void SIMDUtils::mixFloat32(const float* input1, const float* input2, float* output,
                          size_t count, float gain1, float gain2) {
#if defined(__ARM_NEON)
    size_t i = 0;
    float32x4_t gain1Vec = vdupq_n_f32(gain1);
    float32x4_t gain2Vec = vdupq_n_f32(gain2);
    for (; i + 3 < count; i += 4) {
        float32x4_t in1 = vld1q_f32(&input1[i]);
        float32x4_t in2 = vld1q_f32(&input2[i]);
        float32x4_t result1 = vmulq_f32(in1, gain1Vec);
        float32x4_t result2 = vmulq_f32(in2, gain2Vec);
        float32x4_t final = vaddq_f32(result1, result2);
        vst1q_f32(&output[i], final);
    }
    for (; i < count; ++i) {
        output[i] = input1[i] * gain1 + input2[i] * gain2;
    }
#else
    for (size_t i = 0; i < count; ++i) {
        output[i] = input1[i] * gain1 + input2[i] * gain2;
    }
#endif
}

void SIMDUtils::clamp(float* data, size_t count, float minVal, float maxVal) {
#if defined(__ARM_NEON)
    size_t i = 0;
    float32x4_t minVec = vdupq_n_f32(minVal);
    float32x4_t maxVec = vdupq_n_f32(maxVal);
    for (; i + 3 < count; i += 4) {
        float32x4_t v = vld1q_f32(&data[i]);
        v = vminq_f32(vmaxq_f32(v, minVec), maxVec);
        vst1q_f32(&data[i], v);
    }
    for (; i < count; ++i) {
        data[i] = std::max(minVal, std::min(maxVal, data[i]));
    }
#else
    for (size_t i = 0; i < count; ++i) {
        data[i] = std::max(minVal, std::min(maxVal, data[i]));
    }
#endif
}

// ====================
// Implémentation SIMDBenchmark
// ====================

SIMDBenchmark::BenchmarkResult SIMDBenchmark::benchmarkFunction(
    std::function<void(float*, size_t)> func,
    float* data,
    size_t count,
    const std::string& name,
    int iterations
) {
    // Préparation des données
    std::vector<float> testData(data, data + count);

    // Benchmark
    auto start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < iterations; ++i) {
        func(testData.data(), count);
    }
    auto end = std::chrono::high_resolution_clock::now();

    double timeMs = std::chrono::duration<double, std::milli>(end - start).count();
    double avgTimeMs = timeMs / iterations;
    double throughput = count / (avgTimeMs / 1000.0);

    return {name, avgTimeMs, throughput, SIMDDetector::hasSIMD()};
}

void SIMDBenchmark::compareImplementations(
    const std::vector<std::function<void(float*, size_t)>>& functions,
    const std::vector<std::string>& names,
    float* data,
    size_t count
) {
    std::cout << "=== SIMD Benchmark Comparison ===" << std::endl;
    std::cout << "Sample count: " << count << std::endl;
    std::cout << "Best SIMD type: " << SIMDDetector::getBestSIMDType() << std::endl;
    std::cout << std::endl;

    std::vector<BenchmarkResult> results;
    for (size_t i = 0; i < functions.size(); ++i) {
        auto result = benchmarkFunction(functions[i], data, count, names[i]);
        results.push_back(result);

        std::cout << std::left << std::setw(20) << names[i] << ": "
                  << std::fixed << std::setprecision(2) << std::setw(8) << result.timeMs << " ms, "
                  << std::setw(10) << (result.throughput / 1000000.0) << " M samples/sec"
                  << (result.isSIMD ? " (SIMD)" : " (Generic)") << std::endl;
    }

    // Trouver le meilleur
    if (!results.empty()) {
        auto best = *std::min_element(results.begin(), results.end(),
            [](const BenchmarkResult& a, const BenchmarkResult& b) {
                return a.timeMs < b.timeMs;
            });

        std::cout << std::endl << "Best implementation: " << best.implementation
                  << " (" << std::fixed << std::setprecision(1)
                  << (best.throughput / results[0].throughput * 100.0) << "% faster)" << std::endl;
    }
}

// ====================
// Implémentation SIMDManager
// ====================

SIMDManager& SIMDManager::getInstance() {
    static SIMDManager instance;
    return instance;
}

void SIMDManager::initialize() {
    if (initialized_) return;

    bestSIMDType_ = SIMDDetector::getBestSIMDType();
    initialized_ = true;

    std::cout << "SIMD Manager initialized with: " << bestSIMDType_ << std::endl;
}

std::string SIMDManager::getSIMDInfo() const {
    if (!initialized_) return "Not initialized";

    std::string info = "SIMD Status: " + bestSIMDType_ + "\n";
    info += "Vector size: " + std::to_string(SIMDDetector::getVectorSize()) + " floats\n";
    // Pas de AVX2/SSE2 dans la version ARM NEON uniquement
    info += "NEON: " + std::string(SIMDDetector::hasNEON() ? "Yes" : "No");

    return info;
}

void SIMDManager::runBenchmark(size_t sampleCount) {
    if (!initialized_) initialize();

    // Préparation des données de test
    std::vector<float> testData(sampleCount);
    for (size_t i = 0; i < sampleCount; ++i) {
        testData[i] = static_cast<float>(rand()) / RAND_MAX * 2.0f - 1.0f;
    }

    // Benchmark des fonctions principales
    std::vector<std::function<void(float*, size_t)>> functions = {
        [](float* data, size_t count) { SIMDMath::abs(data, data, count); },
        [](float* data, size_t count) { SIMDMath::multiplyScalar(data, data, 1.5f, count); },
        [](float* data, size_t count) { SIMDUtils::applyGain(data, count, 1.2f); },
        [](float* data, size_t count) { SIMDUtils::clamp(data, count, -1.0f, 1.0f); }
    };

    std::vector<std::string> names = {
        "abs",
        "multiplyScalar",
        "applyGain",
        "clamp"
    };

    SIMDBenchmark::compareImplementations(functions, names, testData.data(), sampleCount);
}

} // namespace SIMD
} // namespace AudioNR
