#include "SIMDCore.hpp"
#include <algorithm>
#include <cmath>
#include <chrono>
#include <iostream>
#include <iomanip>
#include <memory>

// Support ARM NEON (Mobile uniquement)
#ifdef __ARM_NEON
#include <arm_neon.h>
#endif

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

namespace AudioNR {
namespace SIMD {

// ====================
// Implémentation SIMDMath
// ====================

void SIMDMath::add(float* result, const float* a, const float* b, size_t count) {
#if defined(__ARM_NEON)
    size_t i = 0;
    for (; i + 3 < count; i += 4) {
        float32x4_t va = vld1q_f32(&a[i]);
        float32x4_t vb = vld1q_f32(&b[i]);
        float32x4_t vr = vaddq_f32(va, vb);
        vst1q_f32(&result[i], vr);
    }
    // Échantillons restants
    for (; i < count; ++i) {
        result[i] = a[i] + b[i];
    }
#else
    // Version scalaire de fallback
    for (size_t i = 0; i < count; ++i) {
        result[i] = a[i] + b[i];
    }
#endif
}

void SIMDMath::multiply(float* result, const float* a, const float* b, size_t count) {
#if defined(__ARM_NEON)
    size_t i = 0;
    for (; i + 3 < count; i += 4) {
        float32x4_t va = vld1q_f32(&a[i]);
        float32x4_t vb = vld1q_f32(&b[i]);
        float32x4_t vr = vmulq_f32(va, vb);
        vst1q_f32(&result[i], vr);
    }
    for (; i < count; ++i) {
        result[i] = a[i] * b[i];
    }
#else
    for (size_t i = 0; i < count; ++i) {
        result[i] = a[i] * b[i];
    }
#endif
}

void SIMDMath::multiplyScalar(float* result, const float* a, float scalar, size_t count) {
#if defined(__ARM_NEON)
    size_t i = 0;
    float32x4_t scalarVec = vdupq_n_f32(scalar);
    for (; i + 3 < count; i += 4) {
        float32x4_t va = vld1q_f32(&a[i]);
        float32x4_t vr = vmulq_f32(va, scalarVec);
        vst1q_f32(&result[i], vr);
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

void SIMDMath::abs(float* result, const float* a, size_t count) {
#if defined(__ARM_NEON)
    size_t i = 0;
    for (; i + 3 < count; i += 4) {
        float32x4_t va = vld1q_f32(&a[i]);
        float32x4_t vr = vabsq_f32(va);
        vst1q_f32(&result[i], vr);
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

float SIMDMath::sum(const float* data, size_t count) {
#if defined(__ARM_NEON)
    size_t i = 0;
    float32x4_t sumVec = vdupq_n_f32(0.0f);
    for (; i + 3 < count; i += 4) {
        float32x4_t v = vld1q_f32(&data[i]);
        sumVec = vaddq_f32(sumVec, v);
    }

    // Réduction horizontale
    float sum = vgetq_lane_f32(sumVec, 0) + vgetq_lane_f32(sumVec, 1) +
                vgetq_lane_f32(sumVec, 2) + vgetq_lane_f32(sumVec, 3);

    for (; i < count; ++i) {
        sum += data[i];
    }
    return sum;
#else
    float sum = 0.0f;
    for (size_t i = 0; i < count; ++i) {
        sum += data[i];
    }
    return sum;
#endif
}

float SIMDMath::max(const float* data, size_t count) {
#if defined(__ARM_NEON)
    size_t i = 0;
    float32x4_t maxVec = vdupq_n_f32(-INFINITY);
    for (; i + 3 < count; i += 4) {
        float32x4_t v = vld1q_f32(&data[i]);
        maxVec = vmaxq_f32(maxVec, v);
    }

    // Trouver le maximum dans le vecteur
    float maxVal = std::max({vgetq_lane_f32(maxVec, 0), vgetq_lane_f32(maxVec, 1),
                              vgetq_lane_f32(maxVec, 2), vgetq_lane_f32(maxVec, 3)});

    for (; i < count; ++i) {
        maxVal = std::max(maxVal, data[i]);
    }
    return maxVal;
#else
    float maxVal = -INFINITY;
    for (size_t i = 0; i < count; ++i) {
        maxVal = std::max(maxVal, data[i]);
    }
    return maxVal;
#endif
}

float SIMDMath::rms(const float* data, size_t count) {
    float sumSquares = 0.0f;
#if defined(__ARM_NEON)
    size_t i = 0;
    float32x4_t sumVec = vdupq_n_f32(0.0f);
    for (; i + 3 < count; i += 4) {
        float32x4_t v = vld1q_f32(&data[i]);
        float32x4_t squared = vmulq_f32(v, v);
        sumVec = vaddq_f32(sumVec, squared);
    }

    // Réduction horizontale
    sumSquares = vgetq_lane_f32(sumVec, 0) + vgetq_lane_f32(sumVec, 1) +
                 vgetq_lane_f32(sumVec, 2) + vgetq_lane_f32(sumVec, 3);

    for (; i < count; ++i) {
        sumSquares += data[i] * data[i];
    }
    return std::sqrt(sumSquares / count);
#else
    for (size_t i = 0; i < count; ++i) {
        sumSquares += data[i] * data[i];
    }
    return std::sqrt(sumSquares / count);
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
