#pragma once

#include "../../common/config/Constant.hpp"
#include <algorithm>
#include <cmath>
#include <cstddef>
#include <cstdint>
#include <string>

// Détection des capacités SIMD pour mobile uniquement
#ifdef __ARM_NEON
    #include <arm_neon.h>
    #define HAS_NEON 1
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
        const float scale = Constants::INT16_TO_FLOAT_SCALE;

#ifdef HAS_NEON
        // Version ARM NEON pour iOS/Android
        const float32x4_t vscale = vdupq_n_f32(scale);
        size_t simdCount = sampleCount & ~Constants::SIMD_VECTOR_SIZE; // Traiter par blocs de 4

        for (size_t i = 0; i < simdCount; i += Constants::SIMD_VECTOR_SIZE) {
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
#else
        // Version scalaire de fallback pour développement
        for (size_t i = 0; i < sampleCount; ++i) {
            output[i] = input[i] * scale;
        }
#endif
    }

    // Conversion float -> int16 avec SIMD et saturation
    static void floatToInt16_Optimized(const float* input, int16_t* output, size_t sampleCount) {
        const float scale = Constants::INT16_SCALE;

#ifdef HAS_NEON
        // Version ARM NEON pour iOS/Android
        const float32x4_t vscale = vdupq_n_f32(scale);
        const float32x4_t vmin = vdupq_n_f32(Constants::INT16_MIN);
        const float32x4_t vmax = vdupq_n_f32(Constants::INT16_MAX);
        size_t simdCount = sampleCount & ~Constants::SIMD_VECTOR_SIZE;

        for (size_t i = 0; i < simdCount; i += Constants::SIMD_VECTOR_SIZE) {
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
            sample = std::max(Constants::INT16_MIN_VALUE, std::min(Constants::INT16_MAX_VALUE, sample));
            output[i] = static_cast<int16_t>(sample);
        }
#else
        // Version scalaire pour développement
        for (size_t i = 0; i < sampleCount; ++i) {
            float sample = input[i] * scale;
            sample = std::max(Constants::INT16_MIN_VALUE, std::min(Constants::INT16_MAX_VALUE, sample));
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
        if (!data || sampleCount == Constants::NULL_DATA_CHECK) return Constants::RMS_ZERO_RETURN_VALUE;

        float sum = Constants::SUM_INITIAL_VALUE;

#ifdef HAS_NEON
        float32x4_t vsum = vdupq_n_f32(Constants::SUM_INITIAL_VALUE);
        size_t simdCount = sampleCount & ~Constants::SIMD_VECTOR_SIZE;

        for (size_t i = 0; i < simdCount; i += Constants::SIMD_VECTOR_SIZE) {
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


#else
        // Version scalaire pour développement
        for (size_t i = 0; i < sampleCount; ++i) {
            sum += data[i] * data[i];
        }
#endif

        return std::sqrt(sum / sampleCount);
    }

    // Calcul du niveau de crête optimisé
    static float calculatePeak_Optimized(const float* data, size_t sampleCount) {
        if (!data || sampleCount == Constants::NULL_DATA_CHECK) return Constants::RMS_ZERO_RETURN_VALUE;

        float peak = Constants::MAX_INITIAL_VALUE;

#ifdef HAS_NEON
        float32x4_t vpeak = vdupq_n_f32(Constants::MAX_INITIAL_VALUE);
        size_t simdCount = sampleCount & ~Constants::SIMD_VECTOR_SIZE;

        for (size_t i = 0; i < simdCount; i += Constants::SIMD_VECTOR_SIZE) {
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


#else
        // Version scalaire
        for (size_t i = 0; i < sampleCount; ++i) {
            peak = std::max(peak, std::abs(data[i]));
        }
#endif

        return peak;
    }

    // Détection de clipping optimisée
    static size_t countClippedSamples_Optimized(const float* data, size_t sampleCount, float threshold = Constants::CLIPPING_DETECTION_THRESHOLD) {
        if (!data || sampleCount == 0) return 0;

        size_t clippedCount = 0;

#ifdef HAS_NEON
        float32x4_t vthreshold = vdupq_n_f32(threshold);
        uint32x4_t vcount = vdupq_n_u32(0);
        size_t simdCount = sampleCount & ~Constants::SIMD_VECTOR_SIZE;

        for (size_t i = 0; i < simdCount; i += Constants::SIMD_VECTOR_SIZE) {
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
    static void normalize_Optimized(float* data, size_t sampleCount, float targetPeak = Constants::NORMALIZATION_TARGET_PEAK) {
        float currentPeak = calculatePeak_Optimized(data, sampleCount);
        if (currentPeak <= Constants::DEFAULT_METRICS_VALUE) return;

        float scale = targetPeak / currentPeak;

#ifdef HAS_NEON
        float32x4_t vscale = vdupq_n_f32(scale);
        size_t simdCount = sampleCount & ~Constants::SIMD_VECTOR_SIZE;

        for (size_t i = 0; i < simdCount; i += Constants::SIMD_VECTOR_SIZE) {
            float32x4_t vdata = vld1q_f32(&data[i]);
            vdata = vmulq_f32(vdata, vscale);
            vst1q_f32(&data[i], vdata);
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
        const float32x4_t vhalf = vdupq_n_f32(Constants::STEREO_TO_MONO_MIX_FACTOR_SIMD);
        size_t simdCount = frameCount & ~Constants::SIMD_VECTOR_SIZE;

        for (size_t i = 0; i < simdCount; i += Constants::SIMD_VECTOR_SIZE) {
            // Charger 4 frames stéréo (8 échantillons)
            vstereo = vld2q_f32(&stereo[i * 2]);
            // Moyenner L et R
            vmono = vmulq_f32(vaddq_f32(vstereo.val[0], vstereo.val[1]), vhalf);
            // Stocker
            vst1q_f32(&mono[i], vmono);
        }

        for (size_t i = simdCount; i < frameCount; ++i) {
            mono[i] = (stereo[i * 2] + stereo[i * 2 + 1]) * Constants::STEREO_TO_MONO_MIX_FACTOR_SIMD;
        }


#else
        for (size_t i = 0; i < frameCount; ++i) {
            mono[i] = (stereo[i * 2] + stereo[i * 2 + 1]) * Constants::STEREO_TO_MONO_MIX_FACTOR_SIMD;
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
    static bool isSilent_Optimized(const float* data, size_t sampleCount, float threshold = Constants::SILENCE_DETECTION_THRESHOLD) {
#ifdef HAS_NEON
        float32x4_t vthreshold = vdupq_n_f32(threshold);
        size_t simdCount = sampleCount & ~Constants::SIMD_VECTOR_SIZE;

        for (size_t i = 0; i < simdCount; i += Constants::SIMD_VECTOR_SIZE) {
            float32x4_t vdata = vld1q_f32(&data[i]);
            float32x4_t vabs = vabsq_f32(vdata);
            uint32x4_t vmask = vcgtq_f32(vabs, vthreshold);

            // Si un échantillon dépasse le seuil, ce n'est pas du silence
            uint32x2_t vmax2 = vmax_u32(vget_low_u32(vmask), vget_high_u32(vmask));
            if (vget_lane_u32(vpmax_u32(vmax2, vmax2), 0) != 0) {
                return false;
            }
        }

        // Vérifier les échantillons restants
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

// ============================================================================
// Basic SIMD Audio Processing Functions
// ============================================================================

// Application d'un gain à un buffer audio
void processFloat32(const float* input, float* output, size_t count, float gain);

// Mixage de deux buffers audio avec gains séparés
void mixFloat32(const float* input1, const float* input2, float* output,
                size_t count, float gain1, float gain2);

// Conversion int16 vers float32
void convertInt16ToFloat32(const int16_t* input, float* output, size_t count);

// Conversion float32 vers int16
void convertFloat32ToInt16(const float* input, int16_t* output, size_t count);

// Calcul RMS (Root Mean Square) d'un buffer audio
float calculateRMS(const float* data, size_t count);

// Calcul du niveau de crête d'un buffer audio
float calculatePeak(const float* data, size_t count);

// Application d'un gain simple
void applyGain(float* data, size_t count, float gain);

// Application d'un gain variable (ramp)
void applyGainRamp(float* data, size_t count, float startGain, float endGain);

// Vérification de la disponibilité SIMD
bool isSimdAvailable();

// Type d'implémentation SIMD utilisée
std::string getSimdType();

// ============================================================================
// Advanced Audio Effects Functions
// ============================================================================

// Filtre passe-bas simple avec SIMD
void applyLowPassFilter(float* data, size_t count, float cutoff, float sampleRate);

// Égaliseur 3 bandes simple avec SIMD
void applyThreeBandEQ(float* data, size_t count, float lowGain, float midGain, float highGain);

// Compression audio simple avec SIMD
void applyCompressor(float* data, size_t count, float threshold, float ratio, float attack, float release);

// Reverb simple avec SIMD
void applySimpleReverb(float* data, size_t count, float decay, float mix);

// Tremolo avec SIMD
void applyTremolo(float* data, size_t count, float rate, float depth, float sampleRate);

// Flanger avec SIMD
void applyFlanger(float* data, size_t count, float rate, float depth, float feedback, float sampleRate);

// Limiteur avec SIMD (protection contre les pics)
void applyLimiter(float* data, size_t count, float threshold);

// De-essing (réduction des sibilances)
void applyDeEsser(float* data, size_t count, float threshold, float reduction, float sampleRate);

// Noise Gate avec SIMD
void applyNoiseGate(float* data, size_t count, float threshold, float attack, float release);

// Distortion avec SIMD
void applyDistortion(float* data, size_t count, float drive, float tone);

// Chorus avec SIMD
void applyChorus(float* data, size_t count, float rate, float depth, float feedback, float sampleRate);

// ============================================================================
// Benchmarking and Performance Testing
// ============================================================================

namespace Benchmark {
    void runCompleteBenchmark(size_t sampleCount = 1024 * 1024);
}

} // namespace SIMD
} // namespace Audio
} // namespace Nyth
