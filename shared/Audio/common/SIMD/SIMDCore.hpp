#pragma once

#ifdef __cplusplus
#include <stdint.h>
#include <string>
#include <vector>
#include <functional>
#include <immintrin.h> // Pour les intrinsics supplémentaires

// Support ARM NEON (Mobile uniquement)
#ifdef __ARM_NEON
#include <arm_neon.h>
#endif

namespace AudioNR {
namespace SIMD {

// ====================
// Optimisations de performance
// ====================

// Macros pour forcer l'inlining et l'alignement
#ifdef _MSC_VER
    #define FORCE_INLINE __forceinline
    #define ALIGNED(x) __declspec(align(x))
    #define RESTRICT __restrict
#else
    #define FORCE_INLINE __attribute__((always_inline)) inline
    #define ALIGNED(x) __attribute__((aligned(x)))
    #define RESTRICT __restrict__
#endif

// Préfetch pour optimiser le cache
#ifdef __ARM_NEON
    #define PREFETCH(addr) __builtin_prefetch(addr, 0, 3)
#else
    #define PREFETCH(addr) ((void)(addr))
#endif

// Constantes d'optimisation
constexpr size_t CACHE_LINE_SIZE = 64;
constexpr size_t SIMD_ALIGNMENT = 32;
constexpr size_t UNROLL_FACTOR = 8; // Déroulement de boucle

// ====================
// Types SIMD unifiés optimisés
// ====================

#ifdef __ARM_NEON
using Vec4f = float32x4_t;  // 4 floats (128-bit)
using Vec4i = int32x4_t;    // 4 ints (128-bit)
using Vec2f = float32x2_t;  // 2 floats (64-bit)

// Wrapper pour les opérations SIMD courantes
struct SIMDOps {
    FORCE_INLINE static Vec4f load(const float* ptr) { return vld1q_f32(ptr); }
    FORCE_INLINE static void store(float* ptr, Vec4f v) { vst1q_f32(ptr, v); }
    FORCE_INLINE static Vec4f add(Vec4f a, Vec4f b) { return vaddq_f32(a, b); }
    FORCE_INLINE static Vec4f mul(Vec4f a, Vec4f b) { return vmulq_f32(a, b); }
    FORCE_INLINE static Vec4f fma(Vec4f a, Vec4f b, Vec4f c) { return vfmaq_f32(c, a, b); }
    FORCE_INLINE static Vec4f max(Vec4f a, Vec4f b) { return vmaxq_f32(a, b); }
    FORCE_INLINE static Vec4f min(Vec4f a, Vec4f b) { return vminq_f32(a, b); }
    FORCE_INLINE static Vec4f abs(Vec4f a) { return vabsq_f32(a); }
    FORCE_INLINE static Vec4f sqrt(Vec4f a) { return vsqrtq_f32(a); }
    FORCE_INLINE static Vec4f broadcast(float v) { return vdupq_n_f32(v); }

    // Réduction horizontale optimisée
    FORCE_INLINE static float hsum(Vec4f v) {
        Vec2f sum = vadd_f32(vget_low_f32(v), vget_high_f32(v));
        return vget_lane_f32(vpadd_f32(sum, sum), 0);
    }

    FORCE_INLINE static float hmax(Vec4f v) {
        Vec2f max_val = vmax_f32(vget_low_f32(v), vget_high_f32(v));
        return vget_lane_f32(vpmax_f32(max_val, max_val), 0);
    }
};
#endif

// ====================
// Détection des capacités SIMD améliorée
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

    FORCE_INLINE static std::string getBestSIMDType() {
        if (hasNEON()) return "ARM NEON (128-bit)";
        return "Generic (No SIMD)";
    }

    FORCE_INLINE static constexpr int getVectorSize() {
        return 4; // ARM NEON traite 4 floats à la fois
    }

    FORCE_INLINE static constexpr int getOptimalBlockSize() {
        return 16; // Optimal pour le cache et le pipeline
    }
};

// ====================
// Fonctions SIMD optimisées (Forward declaration pour la classe complète)
// ====================

class SIMDMathOptimized {
public:
    // Opérations arithmétiques optimisées
    static void add(float* result, const float* a, const float* b, size_t count);
    static void multiply(float* result, const float* a, const float* b, size_t count);
    static void multiplyScalar(float* result, const float* a, float scalar, size_t count);

    // Fonctions mathématiques optimisées
    static void abs(float* result, const float* a, size_t count);

    // Fonctions de réduction optimisées
    static float sum(const float* data, size_t count);
    static float max(const float* data, size_t count);
    static float rms(const float* data, size_t count);

    // FMA (Fused Multiply-Add)
    static void fma(float* result, const float* a, const float* b, const float* c, size_t count);
};

// Alias pour compatibilité
using SIMDMath = SIMDMathOptimized;

// ====================
// Gestion de mémoire alignée optimisée
// ====================

class AlignedMemoryOptimized {
public:
    template<typename T>
    FORCE_INLINE static T* allocate(size_t count) {
        constexpr size_t alignment = SIMD_ALIGNMENT;
        size_t size = count * sizeof(T);
        void* ptr = nullptr;

#ifdef _WIN32
        ptr = _aligned_malloc(size, alignment);
#else
        if (posix_memalign(&ptr, alignment, size) != 0) {
            ptr = nullptr;
        }
#endif
        return static_cast<T*>(ptr);
    }

    template<typename T>
    FORCE_INLINE static void deallocate(T* ptr) {
#ifdef _WIN32
        _aligned_free(ptr);
#else
        free(ptr);
#endif
    }

    FORCE_INLINE static bool isAligned(const void* ptr, size_t alignment = SIMD_ALIGNMENT) {
        return (reinterpret_cast<uintptr_t>(ptr) & (alignment - 1)) == 0;
    }

    // Allocation avec initialisation à zéro
    template<typename T>
    FORCE_INLINE static T* allocateZero(size_t count) {
        T* ptr = allocate<T>(count);
        if (ptr) {
            std::memset(ptr, 0, count * sizeof(T));
        }
        return ptr;
    }
};

// Alias pour compatibilité
using AlignedMemory = AlignedMemoryOptimized;

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
