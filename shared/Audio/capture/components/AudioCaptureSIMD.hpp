#pragma once

#include <algorithm>
#include <cmath>
#include <cstddef>
#include <cstdint>

// Détection des capacités SIMD
#ifdef __ARM_NEON
    #include <arm_neon.h>
    #define HAS_NEON 1
#endif

#ifdef __SSE2__
    #include <emmintrin.h>
    #define HAS_SSE2 1
#endif

#ifdef __AVX2__
    #include <immintrin.h>
    #define HAS_AVX2 1
#endif

namespace Nyth {
namespace Audio {
namespace SIMD {

// ============================================================================
// Conversion de format optimisée
// ============================================================================

class AudioFormatConverterSIMD {
public:
    // Conversion int16 -> float avec SIMD
    static void int16ToFloat_Optimized(const int16_t* input, float* output, size_t sampleCount) {
        const float scale = 1.0f / 32768.0f;
        
#ifdef HAS_NEON
        // Version ARM NEON
        const float32x4_t vscale = vdupq_n_f32(scale);
        size_t simdCount = sampleCount & ~3; // Traiter par blocs de 4
        
        for (size_t i = 0; i < simdCount; i += 4) {
            // Charger 4 int16
            int16x4_t vint16 = vld1_s16(&input[i]);
            // Convertir en int32
            int32x4_t vint32 = vmovl_s16(vint16);
            // Convertir en float
            float32x4_t vfloat = vcvtq_f32_s32(vint32);
            // Appliquer le scale
            vfloat = vmulq_f32(vfloat, vscale);
            // Stocker le résultat
            vst1q_f32(&output[i], vfloat);
        }
        
        // Traiter les échantillons restants
        for (size_t i = simdCount; i < sampleCount; ++i) {
            output[i] = input[i] * scale;
        }
        
#elif defined(HAS_SSE2)
        // Version x86 SSE2
        const __m128 vscale = _mm_set1_ps(scale);
        size_t simdCount = sampleCount & ~3;
        
        for (size_t i = 0; i < simdCount; i += 4) {
            // Charger 4 int16 et les étendre en int32
            __m128i vint16 = _mm_loadl_epi64((__m128i*)&input[i]);
            __m128i vint32 = _mm_cvtepi16_epi32(vint16);
            // Convertir en float
            __m128 vfloat = _mm_cvtepi32_ps(vint32);
            // Appliquer le scale
            vfloat = _mm_mul_ps(vfloat, vscale);
            // Stocker le résultat
            _mm_store_ps(&output[i], vfloat);
        }
        
        // Traiter les échantillons restants
        for (size_t i = simdCount; i < sampleCount; ++i) {
            output[i] = input[i] * scale;
        }
#else
        // Version scalaire de fallback
        for (size_t i = 0; i < sampleCount; ++i) {
            output[i] = input[i] * scale;
        }
#endif
    }
    
    // Conversion float -> int16 avec SIMD et saturation
    static void floatToInt16_Optimized(const float* input, int16_t* output, size_t sampleCount) {
        const float scale = 32767.0f;
        
#ifdef HAS_NEON
        const float32x4_t vscale = vdupq_n_f32(scale);
        const float32x4_t vmin = vdupq_n_f32(-32768.0f);
        const float32x4_t vmax = vdupq_n_f32(32767.0f);
        size_t simdCount = sampleCount & ~3;
        
        for (size_t i = 0; i < simdCount; i += 4) {
            // Charger 4 floats
            float32x4_t vfloat = vld1q_f32(&input[i]);
            // Appliquer le scale
            vfloat = vmulq_f32(vfloat, vscale);
            // Clipping
            vfloat = vmaxq_f32(vfloat, vmin);
            vfloat = vminq_f32(vfloat, vmax);
            // Convertir en int32
            int32x4_t vint32 = vcvtq_s32_f32(vfloat);
            // Convertir en int16 avec saturation
            int16x4_t vint16 = vqmovn_s32(vint32);
            // Stocker
            vst1_s16(&output[i], vint16);
        }
        
        // Traiter les échantillons restants
        for (size_t i = simdCount; i < sampleCount; ++i) {
            float sample = input[i] * scale;
            sample = std::max(-32768.0f, std::min(32767.0f, sample));
            output[i] = static_cast<int16_t>(sample);
        }
        
#elif defined(HAS_SSE2)
        const __m128 vscale = _mm_set1_ps(scale);
        const __m128 vmin = _mm_set1_ps(-32768.0f);
        const __m128 vmax = _mm_set1_ps(32767.0f);
        size_t simdCount = sampleCount & ~3;
        
        for (size_t i = 0; i < simdCount; i += 4) {
            // Charger 4 floats
            __m128 vfloat = _mm_load_ps(&input[i]);
            // Appliquer le scale
            vfloat = _mm_mul_ps(vfloat, vscale);
            // Clipping
            vfloat = _mm_max_ps(vfloat, vmin);
            vfloat = _mm_min_ps(vfloat, vmax);
            // Convertir en int32
            __m128i vint32 = _mm_cvtps_epi32(vfloat);
            // Convertir en int16 avec saturation
            __m128i vint16 = _mm_packs_epi32(vint32, vint32);
            // Stocker (seulement les 4 premiers int16)
            _mm_storel_epi64((__m128i*)&output[i], vint16);
        }
        
        // Traiter les échantillons restants
        for (size_t i = simdCount; i < sampleCount; ++i) {
            float sample = input[i] * scale;
            sample = std::max(-32768.0f, std::min(32767.0f, sample));
            output[i] = static_cast<int16_t>(sample);
        }
#else
        // Version scalaire
        for (size_t i = 0; i < sampleCount; ++i) {
            float sample = input[i] * scale;
            sample = std::max(-32768.0f, std::min(32767.0f, sample));
            output[i] = static_cast<int16_t>(sample);
        }
#endif
    }
};

// ============================================================================
// Analyse audio optimisée
// ============================================================================

class AudioAnalyzerSIMD {
public:
    // Calcul RMS optimisé avec SIMD
    static float calculateRMS_Optimized(const float* data, size_t sampleCount) {
        if (!data || sampleCount == 0) return 0.0f;
        
        float sum = 0.0f;
        
#ifdef HAS_NEON
        float32x4_t vsum = vdupq_n_f32(0.0f);
        size_t simdCount = sampleCount & ~3;
        
        for (size_t i = 0; i < simdCount; i += 4) {
            float32x4_t vdata = vld1q_f32(&data[i]);
            vsum = vmlaq_f32(vsum, vdata, vdata); // vsum += vdata * vdata
        }
        
        // Réduire le vecteur
        float32x2_t vsum2 = vadd_f32(vget_low_f32(vsum), vget_high_f32(vsum));
        sum = vget_lane_f32(vpadd_f32(vsum2, vsum2), 0);
        
        // Traiter les échantillons restants
        for (size_t i = simdCount; i < sampleCount; ++i) {
            sum += data[i] * data[i];
        }
        
#elif defined(HAS_SSE2)
        __m128 vsum = _mm_setzero_ps();
        size_t simdCount = sampleCount & ~3;
        
        for (size_t i = 0; i < simdCount; i += 4) {
            __m128 vdata = _mm_load_ps(&data[i]);
            vsum = _mm_add_ps(vsum, _mm_mul_ps(vdata, vdata));
        }
        
        // Réduire le vecteur (horizontal add)
        vsum = _mm_hadd_ps(vsum, vsum);
        vsum = _mm_hadd_ps(vsum, vsum);
        sum = _mm_cvtss_f32(vsum);
        
        // Traiter les échantillons restants
        for (size_t i = simdCount; i < sampleCount; ++i) {
            sum += data[i] * data[i];
        }
#else
        // Version scalaire
        for (size_t i = 0; i < sampleCount; ++i) {
            sum += data[i] * data[i];
        }
#endif
        
        return std::sqrt(sum / sampleCount);
    }
    
    // Calcul du niveau de crête optimisé
    static float calculatePeak_Optimized(const float* data, size_t sampleCount) {
        if (!data || sampleCount == 0) return 0.0f;
        
        float peak = 0.0f;
        
#ifdef HAS_NEON
        float32x4_t vpeak = vdupq_n_f32(0.0f);
        size_t simdCount = sampleCount & ~3;
        
        for (size_t i = 0; i < simdCount; i += 4) {
            float32x4_t vdata = vld1q_f32(&data[i]);
            float32x4_t vabs = vabsq_f32(vdata);
            vpeak = vmaxq_f32(vpeak, vabs);
        }
        
        // Réduire le vecteur pour trouver le maximum
        float32x2_t vmax2 = vmax_f32(vget_low_f32(vpeak), vget_high_f32(vpeak));
        peak = vget_lane_f32(vpmax_f32(vmax2, vmax2), 0);
        
        // Traiter les échantillons restants
        for (size_t i = simdCount; i < sampleCount; ++i) {
            peak = std::max(peak, std::abs(data[i]));
        }
        
#elif defined(HAS_SSE2)
        __m128 vpeak = _mm_setzero_ps();
        const __m128 sign_mask = _mm_set1_ps(-0.0f);
        size_t simdCount = sampleCount & ~3;
        
        for (size_t i = 0; i < simdCount; i += 4) {
            __m128 vdata = _mm_load_ps(&data[i]);
            __m128 vabs = _mm_andnot_ps(sign_mask, vdata); // abs
            vpeak = _mm_max_ps(vpeak, vabs);
        }
        
        // Réduire le vecteur
        __m128 temp = _mm_max_ps(vpeak, _mm_shuffle_ps(vpeak, vpeak, _MM_SHUFFLE(2, 3, 0, 1)));
        temp = _mm_max_ps(temp, _mm_shuffle_ps(temp, temp, _MM_SHUFFLE(1, 0, 3, 2)));
        peak = _mm_cvtss_f32(temp);
        
        // Traiter les échantillons restants
        for (size_t i = simdCount; i < sampleCount; ++i) {
            peak = std::max(peak, std::abs(data[i]));
        }
#else
        // Version scalaire
        for (size_t i = 0; i < sampleCount; ++i) {
            peak = std::max(peak, std::abs(data[i]));
        }
#endif
        
        return peak;
    }
    
    // Détection de clipping optimisée
    static size_t countClippedSamples_Optimized(const float* data, size_t sampleCount, float threshold = 0.99f) {
        if (!data || sampleCount == 0) return 0;
        
        size_t clippedCount = 0;
        
#ifdef HAS_NEON
        float32x4_t vthreshold = vdupq_n_f32(threshold);
        uint32x4_t vcount = vdupq_n_u32(0);
        size_t simdCount = sampleCount & ~3;
        
        for (size_t i = 0; i < simdCount; i += 4) {
            float32x4_t vdata = vld1q_f32(&data[i]);
            float32x4_t vabs = vabsq_f32(vdata);
            uint32x4_t vmask = vcgeq_f32(vabs, vthreshold);
            vcount = vaddq_u32(vcount, vmask);
        }
        
        // Réduire le compteur
        uint32x2_t vcount2 = vadd_u32(vget_low_u32(vcount), vget_high_u32(vcount));
        clippedCount = vget_lane_u32(vpadd_u32(vcount2, vcount2), 0);
        
        // Traiter les échantillons restants
        for (size_t i = simdCount; i < sampleCount; ++i) {
            if (std::abs(data[i]) >= threshold) {
                clippedCount++;
            }
        }
        
#elif defined(HAS_SSE2)
        __m128 vthreshold = _mm_set1_ps(threshold);
        const __m128 sign_mask = _mm_set1_ps(-0.0f);
        __m128i vcount = _mm_setzero_si128();
        size_t simdCount = sampleCount & ~3;
        
        for (size_t i = 0; i < simdCount; i += 4) {
            __m128 vdata = _mm_load_ps(&data[i]);
            __m128 vabs = _mm_andnot_ps(sign_mask, vdata);
            __m128 vcmp = _mm_cmpge_ps(vabs, vthreshold);
            vcount = _mm_sub_epi32(vcount, _mm_castps_si128(vcmp));
        }
        
        // Réduire le compteur
        __m128i temp = _mm_hadd_epi32(vcount, vcount);
        temp = _mm_hadd_epi32(temp, temp);
        clippedCount = _mm_cvtsi128_si32(temp);
        
        // Traiter les échantillons restants
        for (size_t i = simdCount; i < sampleCount; ++i) {
            if (std::abs(data[i]) >= threshold) {
                clippedCount++;
            }
        }
#else
        // Version scalaire
        for (size_t i = 0; i < sampleCount; ++i) {
            if (std::abs(data[i]) >= threshold) {
                clippedCount++;
            }
        }
#endif
        
        return clippedCount;
    }
    
    // Normalisation optimisée
    static void normalize_Optimized(float* data, size_t sampleCount, float targetPeak = 0.95f) {
        float currentPeak = calculatePeak_Optimized(data, sampleCount);
        if (currentPeak <= 0.0f) return;
        
        float scale = targetPeak / currentPeak;
        
#ifdef HAS_NEON
        float32x4_t vscale = vdupq_n_f32(scale);
        size_t simdCount = sampleCount & ~3;
        
        for (size_t i = 0; i < simdCount; i += 4) {
            float32x4_t vdata = vld1q_f32(&data[i]);
            vdata = vmulq_f32(vdata, vscale);
            vst1q_f32(&data[i], vdata);
        }
        
        for (size_t i = simdCount; i < sampleCount; ++i) {
            data[i] *= scale;
        }
        
#elif defined(HAS_SSE2)
        __m128 vscale = _mm_set1_ps(scale);
        size_t simdCount = sampleCount & ~3;
        
        for (size_t i = 0; i < simdCount; i += 4) {
            __m128 vdata = _mm_load_ps(&data[i]);
            vdata = _mm_mul_ps(vdata, vscale);
            _mm_store_ps(&data[i], vdata);
        }
        
        for (size_t i = simdCount; i < sampleCount; ++i) {
            data[i] *= scale;
        }
#else
        for (size_t i = 0; i < sampleCount; ++i) {
            data[i] *= scale;
        }
#endif
    }
};

// ============================================================================
// Mixage et traitement multi-canal optimisé
// ============================================================================

class AudioMixerSIMD {
public:
    // Mixage stéréo vers mono optimisé
    static void stereoToMono_Optimized(const float* stereo, float* mono, size_t frameCount) {
#ifdef HAS_NEON
        float32x4x2_t vstereo;
        float32x4_t vmono;
        const float32x4_t vhalf = vdupq_n_f32(0.5f);
        size_t simdCount = frameCount & ~3;
        
        for (size_t i = 0; i < simdCount; i += 4) {
            // Charger 4 frames stéréo (8 échantillons)
            vstereo = vld2q_f32(&stereo[i * 2]);
            // Moyenner L et R
            vmono = vmulq_f32(vaddq_f32(vstereo.val[0], vstereo.val[1]), vhalf);
            // Stocker
            vst1q_f32(&mono[i], vmono);
        }
        
        for (size_t i = simdCount; i < frameCount; ++i) {
            mono[i] = (stereo[i * 2] + stereo[i * 2 + 1]) * 0.5f;
        }
        
#elif defined(HAS_SSE2)
        const __m128 vhalf = _mm_set1_ps(0.5f);
        size_t simdCount = frameCount & ~3;
        
        for (size_t i = 0; i < simdCount; i += 4) {
            // Charger 8 échantillons (4 frames stéréo)
            __m128 v1 = _mm_load_ps(&stereo[i * 2]);
            __m128 v2 = _mm_load_ps(&stereo[i * 2 + 4]);
            
            // Séparer L et R
            __m128 left = _mm_shuffle_ps(v1, v2, _MM_SHUFFLE(2, 0, 2, 0));
            __m128 right = _mm_shuffle_ps(v1, v2, _MM_SHUFFLE(3, 1, 3, 1));
            
            // Moyenner
            __m128 vmono = _mm_mul_ps(_mm_add_ps(left, right), vhalf);
            
            // Stocker
            _mm_store_ps(&mono[i], vmono);
        }
        
        for (size_t i = simdCount; i < frameCount; ++i) {
            mono[i] = (stereo[i * 2] + stereo[i * 2 + 1]) * 0.5f;
        }
#else
        for (size_t i = 0; i < frameCount; ++i) {
            mono[i] = (stereo[i * 2] + stereo[i * 2 + 1]) * 0.5f;
        }
#endif
    }
};

// ============================================================================
// Détection de features audio optimisée
// ============================================================================

class AudioFeatureDetectorSIMD {
public:
    // Détection de silence optimisée
    static bool isSilent_Optimized(const float* data, size_t sampleCount, float threshold = 0.001f) {
#ifdef HAS_NEON
        float32x4_t vthreshold = vdupq_n_f32(threshold);
        size_t simdCount = sampleCount & ~3;
        
        for (size_t i = 0; i < simdCount; i += 4) {
            float32x4_t vdata = vld1q_f32(&data[i]);
            float32x4_t vabs = vabsq_f32(vdata);
            uint32x4_t vmask = vcgtq_f32(vabs, vthreshold);
            
            // Si un échantillon dépasse le seuil, ce n'est pas du silence
            if (vmaxvq_u32(vmask) != 0) {
                return false;
            }
        }
        
        // Vérifier les échantillons restants
        for (size_t i = simdCount; i < sampleCount; ++i) {
            if (std::abs(data[i]) > threshold) {
                return false;
            }
        }
        
#elif defined(HAS_SSE2)
        __m128 vthreshold = _mm_set1_ps(threshold);
        const __m128 sign_mask = _mm_set1_ps(-0.0f);
        size_t simdCount = sampleCount & ~3;
        
        for (size_t i = 0; i < simdCount; i += 4) {
            __m128 vdata = _mm_load_ps(&data[i]);
            __m128 vabs = _mm_andnot_ps(sign_mask, vdata);
            __m128 vcmp = _mm_cmpgt_ps(vabs, vthreshold);
            
            if (_mm_movemask_ps(vcmp) != 0) {
                return false;
            }
        }
        
        for (size_t i = simdCount; i < sampleCount; ++i) {
            if (std::abs(data[i]) > threshold) {
                return false;
            }
        }
#else
        for (size_t i = 0; i < sampleCount; ++i) {
            if (std::abs(data[i]) > threshold) {
                return false;
            }
        }
#endif
        
        return true;
    }
};

} // namespace SIMD
} // namespace Audio
} // namespace Nyth