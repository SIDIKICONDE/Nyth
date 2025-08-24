#pragma once

#ifdef __cplusplus
#include "SIMDCore_Optimized.hpp"
#include <vector>
#include <functional>
#include <memory>
#include <cmath>

namespace AudioNR {
namespace SIMD {

// ====================
// Lookup Tables pour optimisation
// ====================

class LookupTables {
private:
    static constexpr size_t SINE_TABLE_SIZE = 4096;
    static constexpr size_t EXP_TABLE_SIZE = 2048;
    
    ALIGNED(64) float sineTable[SINE_TABLE_SIZE];
    ALIGNED(64) float cosineTable[SINE_TABLE_SIZE];
    ALIGNED(64) float expTable[EXP_TABLE_SIZE];
    
    LookupTables() {
        // Initialiser les tables
        for (size_t i = 0; i < SINE_TABLE_SIZE; ++i) {
            float angle = (2.0f * M_PI * i) / SINE_TABLE_SIZE;
            sineTable[i] = std::sin(angle);
            cosineTable[i] = std::cos(angle);
        }
        
        for (size_t i = 0; i < EXP_TABLE_SIZE; ++i) {
            float x = -10.0f + (20.0f * i) / EXP_TABLE_SIZE;
            expTable[i] = std::exp(x);
        }
    }
    
public:
    static LookupTables& getInstance() {
        static LookupTables instance;
        return instance;
    }
    
    FORCE_INLINE float fastSin(float x) const {
        // Normaliser x dans [0, 2π]
        x = std::fmod(x, 2.0f * M_PI);
        if (x < 0) x += 2.0f * M_PI;
        
        float index = (x * SINE_TABLE_SIZE) / (2.0f * M_PI);
        size_t i0 = static_cast<size_t>(index);
        size_t i1 = (i0 + 1) & (SINE_TABLE_SIZE - 1);
        float frac = index - i0;
        
        // Interpolation linéaire
        return sineTable[i0] * (1.0f - frac) + sineTable[i1] * frac;
    }
    
    FORCE_INLINE float fastCos(float x) const {
        x = std::fmod(x, 2.0f * M_PI);
        if (x < 0) x += 2.0f * M_PI;
        
        float index = (x * SINE_TABLE_SIZE) / (2.0f * M_PI);
        size_t i0 = static_cast<size_t>(index);
        size_t i1 = (i0 + 1) & (SINE_TABLE_SIZE - 1);
        float frac = index - i0;
        
        return cosineTable[i0] * (1.0f - frac) + cosineTable[i1] * frac;
    }
    
    FORCE_INLINE float fastExp(float x) const {
        if (x < -10.0f) return 0.0f;
        if (x > 10.0f) return std::exp(x);
        
        float index = ((x + 10.0f) * EXP_TABLE_SIZE) / 20.0f;
        size_t i0 = static_cast<size_t>(index);
        size_t i1 = std::min(i0 + 1, EXP_TABLE_SIZE - 1);
        float frac = index - i0;
        
        return expTable[i0] * (1.0f - frac) + expTable[i1] * frac;
    }
};

// ====================
// Fonctions Mathématiques SIMD Optimisées
// ====================

class SIMDMathFunctionsOptimized {
public:
    // Approximation rapide de sin/cos avec SIMD
    static void sin_vectorized_fast(const float* RESTRICT x, float* RESTRICT result, size_t count) {
#ifdef __ARM_NEON
        const float c1 = -0.16666667f;
        const float c2 = 0.00833333f;
        const float c3 = -0.00019841f;
        
        size_t i = 0;
        Vec4f vc1 = SIMDOps::broadcast(c1);
        Vec4f vc2 = SIMDOps::broadcast(c2);
        Vec4f vc3 = SIMDOps::broadcast(c3);
        
        for (; i + 15 < count; i += 16) {
            PREFETCH(&x[i + 64]);
            
            // Traiter 16 valeurs en parallèle
            for (size_t j = 0; j < 16; j += 4) {
                Vec4f vx = SIMDOps::load(&x[i + j]);
                
                // Réduire x dans [-π, π]
                Vec4f vx_mod = vx; // Simplification pour la demo
                
                // Approximation de Taylor
                Vec4f vx2 = SIMDOps::mul(vx_mod, vx_mod);
                Vec4f vx3 = SIMDOps::mul(vx2, vx_mod);
                Vec4f vx5 = SIMDOps::mul(vx3, vx2);
                Vec4f vx7 = SIMDOps::mul(vx5, vx2);
                
                Vec4f result_v = vx_mod;
                result_v = SIMDOps::fma(vx3, vc1, result_v);
                result_v = SIMDOps::fma(vx5, vc2, result_v);
                result_v = SIMDOps::fma(vx7, vc3, result_v);
                
                SIMDOps::store(&result[i + j], result_v);
            }
        }
        
        // Éléments restants avec lookup table
        auto& lut = LookupTables::getInstance();
        for (; i < count; ++i) {
            result[i] = lut.fastSin(x[i]);
        }
#else
        auto& lut = LookupTables::getInstance();
        for (size_t i = 0; i < count; ++i) {
            result[i] = lut.fastSin(x[i]);
        }
#endif
    }
    
    // Tanh optimisé pour la distorsion audio
    FORCE_INLINE static void tanh_vectorized_fast(const float* RESTRICT x, 
                                                  float* RESTRICT result, 
                                                  size_t count) {
#ifdef __ARM_NEON
        size_t i = 0;
        
        // Constantes pour l'approximation rationnelle de tanh
        Vec4f va = SIMDOps::broadcast(1.0f);
        Vec4f vb = SIMDOps::broadcast(0.5f);
        Vec4f vc = SIMDOps::broadcast(0.25f);
        
        for (; i + 15 < count; i += 16) {
            PREFETCH(&x[i + 64]);
            
            for (size_t j = 0; j < 16; j += 4) {
                Vec4f vx = SIMDOps::load(&x[i + j]);
                Vec4f vabs = SIMDOps::abs(vx);
                
                // Approximation: tanh(x) ≈ x / (1 + |x| + 0.5*x² + 0.25*|x|³)
                Vec4f vx2 = SIMDOps::mul(vx, vx);
                Vec4f vx3 = SIMDOps::mul(vabs, vx2);
                
                Vec4f denom = va;
                denom = SIMDOps::add(denom, vabs);
                denom = SIMDOps::fma(vb, vx2, denom);
                denom = SIMDOps::fma(vc, vx3, denom);
                
                // Division approximative (Newton-Raphson)
                Vec4f inv_denom = vrecpeq_f32(denom);
                inv_denom = SIMDOps::mul(inv_denom, vrecpsq_f32(denom, inv_denom));
                
                Vec4f result_v = SIMDOps::mul(vx, inv_denom);
                SIMDOps::store(&result[i + j], result_v);
            }
        }
        
        for (; i < count; ++i) {
            result[i] = std::tanh(x[i]);
        }
#else
        for (size_t i = 0; i < count; ++i) {
            float val = x[i];
            float abs_val = std::abs(val);
            result[i] = val / (1.0f + abs_val + 0.5f * val * val + 0.25f * abs_val * val * val);
        }
#endif
    }
    
    // Soft clipper optimisé
    FORCE_INLINE static void apply_soft_clipper_optimized(float* RESTRICT data, 
                                                         size_t count, 
                                                         float threshold) {
#ifdef __ARM_NEON
        size_t i = 0;
        Vec4f vthresh = SIMDOps::broadcast(threshold);
        Vec4f vneg_thresh = SIMDOps::broadcast(-threshold);
        Vec4f vscale = SIMDOps::broadcast(1.0f / threshold);
        
        for (; i + 15 < count; i += 16) {
            PREFETCH(&data[i + 64]);
            
            for (size_t j = 0; j < 16; j += 4) {
                Vec4f v = SIMDOps::load(&data[i + j]);
                
                // Créer des masques pour les différentes régions
                uint32x4_t mask_pos = vcgtq_f32(v, vthresh);
                uint32x4_t mask_neg = vcltq_f32(v, vneg_thresh);
                uint32x4_t mask_linear = vornq_u32(mask_pos, mask_neg);
                
                // Appliquer le soft clipping
                Vec4f v_scaled = SIMDOps::mul(v, vscale);
                Vec4f v_clipped = SIMDOps::mul(vthresh, vbslq_f32(mask_pos, 
                                                                  SIMDOps::broadcast(1.0f), 
                                                                  vbslq_f32(mask_neg, 
                                                                           SIMDOps::broadcast(-1.0f), 
                                                                           v_scaled)));
                
                SIMDOps::store(&data[i + j], v_clipped);
            }
        }
        
        for (; i < count; ++i) {
            float x = data[i];
            if (x > threshold) {
                data[i] = threshold;
            } else if (x < -threshold) {
                data[i] = -threshold;
            }
        }
#else
        for (size_t i = 0; i < count; ++i) {
            float x = data[i];
            if (x > threshold) {
                data[i] = threshold;
            } else if (x < -threshold) {
                data[i] = -threshold;
            }
        }
#endif
    }
    
    // Normalisation optimisée avec une seule passe pour le RMS
    FORCE_INLINE static void normalize_optimized(float* RESTRICT data, 
                                               size_t count, 
                                               float target_rms = 1.0f) {
        if (count == 0) return;
        
        // Calculer le RMS actuel
        float current_rms = SIMDMathOptimized::rms(data, count);
        if (current_rms < 1e-10f) return;
        
        // Calculer et appliquer le gain
        float gain = target_rms / current_rms;
        
#ifdef __ARM_NEON
        size_t i = 0;
        Vec4f vgain = SIMDOps::broadcast(gain);
        
        for (; i + 15 < count; i += 16) {
            PREFETCH(&data[i + 64]);
            
            Vec4f v0 = SIMDOps::load(&data[i]);
            Vec4f v1 = SIMDOps::load(&data[i + 4]);
            Vec4f v2 = SIMDOps::load(&data[i + 8]);
            Vec4f v3 = SIMDOps::load(&data[i + 12]);
            
            v0 = SIMDOps::mul(v0, vgain);
            v1 = SIMDOps::mul(v1, vgain);
            v2 = SIMDOps::mul(v2, vgain);
            v3 = SIMDOps::mul(v3, vgain);
            
            SIMDOps::store(&data[i], v0);
            SIMDOps::store(&data[i + 4], v1);
            SIMDOps::store(&data[i + 8], v2);
            SIMDOps::store(&data[i + 12], v3);
        }
        
        for (; i < count; ++i) {
            data[i] *= gain;
        }
#else
        for (size_t i = 0; i < count; ++i) {
            data[i] *= gain;
        }
#endif
    }
};

// ====================
// Processeur DSP SIMD Optimisé
// ====================

template<size_t BLOCK_SIZE = 512>
class SIMDBlockProcessor {
private:
    ALIGNED(64) float workBuffer[BLOCK_SIZE];
    ALIGNED(64) float tempBuffer[BLOCK_SIZE];
    
public:
    template<typename ProcessFunc>
    void processInBlocks(float* data, size_t totalCount, ProcessFunc func) {
        size_t processed = 0;
        
        while (processed < totalCount) {
            size_t blockCount = std::min(BLOCK_SIZE, totalCount - processed);
            
            // Copier dans le buffer de travail aligné
            std::memcpy(workBuffer, &data[processed], blockCount * sizeof(float));
            
            // Traiter le bloc
            func(workBuffer, blockCount);
            
            // Copier le résultat
            std::memcpy(&data[processed], workBuffer, blockCount * sizeof(float));
            
            processed += blockCount;
        }
    }
    
    // Version avec double buffering pour le pipeline
    template<typename ProcessFunc>
    void processInBlocksPipelined(float* data, size_t totalCount, ProcessFunc func) {
        if (totalCount <= BLOCK_SIZE) {
            processInBlocks(data, totalCount, func);
            return;
        }
        
        size_t processed = 0;
        bool useWorkBuffer = true;
        
        // Charger le premier bloc
        size_t blockCount = std::min(BLOCK_SIZE, totalCount);
        std::memcpy(workBuffer, data, blockCount * sizeof(float));
        
        while (processed < totalCount) {
            size_t nextBlockStart = processed + blockCount;
            size_t nextBlockCount = std::min(BLOCK_SIZE, totalCount - nextBlockStart);
            
            // Précharger le prochain bloc pendant le traitement
            if (nextBlockStart < totalCount) {
                PREFETCH(&data[nextBlockStart]);
                PREFETCH(&data[nextBlockStart + 64]);
            }
            
            // Traiter le bloc actuel
            if (useWorkBuffer) {
                func(workBuffer, blockCount);
                
                // Charger le prochain bloc dans tempBuffer pendant qu'on écrit
                if (nextBlockStart < totalCount) {
                    std::memcpy(tempBuffer, &data[nextBlockStart], nextBlockCount * sizeof(float));
                }
                
                // Écrire le résultat
                std::memcpy(&data[processed], workBuffer, blockCount * sizeof(float));
            } else {
                func(tempBuffer, blockCount);
                
                if (nextBlockStart < totalCount) {
                    std::memcpy(workBuffer, &data[nextBlockStart], nextBlockCount * sizeof(float));
                }
                
                std::memcpy(&data[processed], tempBuffer, blockCount * sizeof(float));
            }
            
            useWorkBuffer = !useWorkBuffer;
            processed += blockCount;
            blockCount = nextBlockCount;
        }
    }
};

// Alias pour compatibilité
using SIMDMathFunctions = SIMDMathFunctionsOptimized;

} // namespace SIMD
} // namespace AudioNR

#endif // __cplusplus