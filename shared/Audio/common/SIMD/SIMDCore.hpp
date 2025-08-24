#pragma once

#ifdef __cplusplus
#include <cstdint>
#include <string>
#include <vector>
#include <functional>

// Support ARM NEON (Mobile uniquement)
#ifdef __ARM_NEON
#include <arm_neon.h>
#endif

namespace AudioNR {
namespace SIMD {

// ====================
// Types SIMD unifiés (ARM NEON uniquement)
// ====================

#ifdef __ARM_NEON
using Vec4f = float32x4_t;  // 4 floats (128-bit)
using Vec4i = int32x4_t;    // 4 ints (128-bit)
#endif

// ====================
// Détection des capacités SIMD
// ====================

class SIMDDetector {
public:
    static bool hasNEON() {
#if defined(__ARM_NEON)
        return true;
#else
        return false;
#endif
    }

    static bool hasSIMD() {
        return hasNEON();
    }

    static std::string getBestSIMDType() {
        if (hasNEON()) return "ARM NEON (128-bit)";
        return "Generic (No SIMD)";
    }

    static int getVectorSize() {
        if (hasNEON()) return 4;
        return 1;
    }
};

// ====================
// Fonctions SIMD de base (Vectorisées)
// ====================

class SIMDMath {
public:
    // Opérations arithmétiques vectorisées
    static void add(float* result, const float* a, const float* b, size_t count);
    static void subtract(float* result, const float* a, const float* b, size_t count);
    static void multiply(float* result, const float* a, const float* b, size_t count);
    static void divide(float* result, const float* a, const float* b, size_t count);

    // Opérations scalaires vectorisées
    static void multiplyScalar(float* result, const float* a, float scalar, size_t count);
    static void addScalar(float* result, const float* a, float scalar, size_t count);

    // Fonctions mathématiques vectorisées
    static void abs(float* result, const float* a, size_t count);
    static void sqrt(float* result, const float* a, size_t count);
    static void sin(float* result, const float* a, size_t count);
    static void cos(float* result, const float* a, size_t count);
    static void exp(float* result, const float* a, size_t count);
    static void log(float* result, const float* a, size_t count);

    // Fonctions de réduction
    static float sum(const float* data, size_t count);
    static float max(const float* data, size_t count);
    static float min(const float* data, size_t count);
    static float rms(const float* data, size_t count);
};

// ====================
// Gestion de mémoire alignée
// ====================

class AlignedMemory {
public:
    static float* allocate(size_t count);
    static void deallocate(float* ptr);
    static bool isAligned(const void* ptr, size_t alignment = 32);

    template<typename T>
    static T* allocate(size_t count) {
        return static_cast<T*>(allocate(sizeof(T) * count));
    }
};

// ====================
// Fonctions utilitaires SIMD
// ====================

class SIMDUtils {
public:
    // Conversion de types
    static void convertInt16ToFloat32(const int16_t* input, float* output, size_t count);
    static void convertFloat32ToInt16(const float* input, int16_t* output, size_t count);

    // Application de gains
    static void applyGain(float* data, size_t count, float gain);
    static void applyGainRamp(float* data, size_t count, float startGain, float endGain);

    // Mixage audio
    static void mixFloat32(const float* input1, const float* input2, float* output,
                          size_t count, float gain1, float gain2);

    // Limiteurs et protection
    static void clamp(float* data, size_t count, float minVal, float maxVal);
    static void hardLimit(float* data, size_t count, float threshold);
    static void softClip(float* data, size_t count, float threshold);
};

// ====================
// Interface pour les algorithmes SIMD
// ====================

template<typename T>
class SIMDProcessor {
public:
    virtual ~SIMDProcessor() = default;

    virtual void process(T* data, size_t count) = 0;
    virtual std::string getName() const = 0;
    virtual bool isSIMDAccelerated() const = 0;
};

// ====================
// Benchmarking SIMD
// ====================

class SIMDBenchmark {
public:
    struct BenchmarkResult {
        std::string implementation;
        double timeMs;
        double throughput; // éléments par seconde
        bool isSIMD;
    };

    static BenchmarkResult benchmarkFunction(
        std::function<void(float*, size_t)> func,
        float* data,
        size_t count,
        const std::string& name,
        int iterations = 100
    );

    static void compareImplementations(
        const std::vector<std::function<void(float*, size_t)>>& functions,
        const std::vector<std::string>& names,
        float* data,
        size_t count
    );
};

// ====================
// Gestionnaire SIMD principal
// ====================

class SIMDManager {
public:
    static SIMDManager& getInstance();

    void initialize();
    bool isInitialized() const { return initialized_; }

    std::string getSIMDInfo() const;
    void runBenchmark(size_t sampleCount = 1000000);

private:
    SIMDManager() = default;
    ~SIMDManager() = default;

    bool initialized_ = false;
    std::string bestSIMDType_;
};

} // namespace SIMD
} // namespace AudioNR

#endif // __cplusplus
