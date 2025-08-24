#pragma once

#ifdef __cplusplus
#include <cstdint>
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
// Fonctions SIMD optimisées
// ====================

class SIMDMathOptimized {
public:
    // Version template pour éviter la duplication de code
    template<typename Func>
    FORCE_INLINE static void processBlocks(float* RESTRICT result, 
                                          const float* RESTRICT a, 
                                          const float* RESTRICT b, 
                                          size_t count, 
                                          Func simdOp) {
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
            
            Vec4f vr0 = simdOp(va0, vb0);
            Vec4f vr1 = simdOp(va1, vb1);
            Vec4f vr2 = simdOp(va2, vb2);
            Vec4f vr3 = simdOp(va3, vb3);
            
            SIMDOps::store(&result[i], vr0);
            SIMDOps::store(&result[i + 4], vr1);
            SIMDOps::store(&result[i + 8], vr2);
            SIMDOps::store(&result[i + 12], vr3);
        }
        
        // Version normale pour les blocs moyens
        for (; i + simdWidth - 1 < count; i += simdWidth) {
            Vec4f va = SIMDOps::load(&a[i]);
            Vec4f vb = SIMDOps::load(&b[i]);
            Vec4f vr = simdOp(va, vb);
            SIMDOps::store(&result[i], vr);
        }
        
        // Échantillons restants
        for (; i < count; ++i) {
            result[i] = simdOp(a[i], b[i]);
        }
#else
        // Version scalaire optimisée avec déroulement de boucle
        size_t i = 0;
        for (; i + 3 < count; i += 4) {
            result[i] = simdOp(a[i], b[i]);
            result[i + 1] = simdOp(a[i + 1], b[i + 1]);
            result[i + 2] = simdOp(a[i + 2], b[i + 2]);
            result[i + 3] = simdOp(a[i + 3], b[i + 3]);
        }
        for (; i < count; ++i) {
            result[i] = simdOp(a[i], b[i]);
        }
#endif
    }

    // Opérations arithmétiques optimisées
    FORCE_INLINE static void add(float* RESTRICT result, 
                                const float* RESTRICT a, 
                                const float* RESTRICT b, 
                                size_t count) {
#ifdef __ARM_NEON
        processBlocks(result, a, b, count, [](Vec4f va, Vec4f vb) { return SIMDOps::add(va, vb); });
#else
        processBlocks(result, a, b, count, [](float a, float b) { return a + b; });
#endif
    }

    FORCE_INLINE static void multiply(float* RESTRICT result,
                                     const float* RESTRICT a,
                                     const float* RESTRICT b,
                                     size_t count) {
#ifdef __ARM_NEON
        processBlocks(result, a, b, count, [](Vec4f va, Vec4f vb) { return SIMDOps::mul(va, vb); });
#else
        processBlocks(result, a, b, count, [](float a, float b) { return a * b; });
#endif
    }

    // FMA (Fused Multiply-Add) pour une meilleure performance
    FORCE_INLINE static void fma(float* RESTRICT result,
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

    // Réduction optimisée avec moins d'accès mémoire
    FORCE_INLINE static float sum(const float* RESTRICT data, size_t count) {
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

    // RMS optimisé avec FMA
    FORCE_INLINE static float rms(const float* RESTRICT data, size_t count) {
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
};

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
using SIMDMath = SIMDMathOptimized;

} // namespace SIMD
} // namespace AudioNR

#endif // __cplusplus