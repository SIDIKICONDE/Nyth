#include "AudioCaptureSIMD.hpp"
#include <cstring>
#include <algorithm>
#include <string>

#ifdef __ARM_NEON
#include <arm_neon.h>
#endif

#ifdef __SSE2__
#include <emmintrin.h>
#endif

#ifdef __AVX__
#include <immintrin.h>
#endif

namespace Audio {
namespace capture {
namespace simd {

// ============================================================================
// Generic (non-SIMD) implementations as fallback
// ============================================================================

namespace generic {

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
    const float scale = 1.0f / 32768.0f;
    for (size_t i = 0; i < count; ++i) {
        output[i] = input[i] * scale;
    }
}

void convertFloat32ToInt16(const float* input, int16_t* output, size_t count) {
    const float scale = 32767.0f;
    for (size_t i = 0; i < count; ++i) {
        float sample = input[i] * scale;
        sample = std::max(-32768.0f, std::min(32767.0f, sample));
        output[i] = static_cast<int16_t>(sample);
    }
}

float calculateRMS(const float* data, size_t count) {
    float sum = 0.0f;
    for (size_t i = 0; i < count; ++i) {
        sum += data[i] * data[i];
    }
    return std::sqrt(sum / count);
}

float calculatePeak(const float* data, size_t count) {
    float peak = 0.0f;
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

void processFloat32(const float* input, float* output, size_t count, float gain) {
    size_t simdCount = count / 4;
    size_t remainder = count % 4;
    
    float32x4_t gainVec = vdupq_n_f32(gain);
    
    for (size_t i = 0; i < simdCount; ++i) {
        float32x4_t in = vld1q_f32(input + i * 4);
        float32x4_t result = vmulq_f32(in, gainVec);
        vst1q_f32(output + i * 4, result);
    }
    
    // Process remaining samples
    for (size_t i = simdCount * 4; i < count; ++i) {
        output[i] = input[i] * gain;
    }
}

void mixFloat32(const float* input1, const float* input2, float* output,
                size_t count, float gain1, float gain2) {
    size_t simdCount = count / 4;
    size_t remainder = count % 4;
    
    float32x4_t gain1Vec = vdupq_n_f32(gain1);
    float32x4_t gain2Vec = vdupq_n_f32(gain2);
    
    for (size_t i = 0; i < simdCount; ++i) {
        float32x4_t in1 = vld1q_f32(input1 + i * 4);
        float32x4_t in2 = vld1q_f32(input2 + i * 4);
        
        float32x4_t scaled1 = vmulq_f32(in1, gain1Vec);
        float32x4_t scaled2 = vmulq_f32(in2, gain2Vec);
        float32x4_t result = vaddq_f32(scaled1, scaled2);
        
        vst1q_f32(output + i * 4, result);
    }
    
    // Process remaining samples
    for (size_t i = simdCount * 4; i < count; ++i) {
        output[i] = input1[i] * gain1 + input2[i] * gain2;
    }
}

void convertInt16ToFloat32(const int16_t* input, float* output, size_t count) {
    const float scale = 1.0f / 32768.0f;
    size_t simdCount = count / 4;
    
    float32x4_t scaleVec = vdupq_n_f32(scale);
    
    for (size_t i = 0; i < simdCount; ++i) {
        int16x4_t in16 = vld1_s16(input + i * 4);
        int32x4_t in32 = vmovl_s16(in16);
        float32x4_t inFloat = vcvtq_f32_s32(in32);
        float32x4_t result = vmulq_f32(inFloat, scaleVec);
        vst1q_f32(output + i * 4, result);
    }
    
    // Process remaining samples
    for (size_t i = simdCount * 4; i < count; ++i) {
        output[i] = input[i] * scale;
    }
}

void convertFloat32ToInt16(const float* input, int16_t* output, size_t count) {
    const float scale = 32767.0f;
    size_t simdCount = count / 4;
    
    float32x4_t scaleVec = vdupq_n_f32(scale);
    float32x4_t minVec = vdupq_n_f32(-32768.0f);
    float32x4_t maxVec = vdupq_n_f32(32767.0f);
    
    for (size_t i = 0; i < simdCount; ++i) {
        float32x4_t in = vld1q_f32(input + i * 4);
        float32x4_t scaled = vmulq_f32(in, scaleVec);
        
        // Clamp
        scaled = vmaxq_f32(scaled, minVec);
        scaled = vminq_f32(scaled, maxVec);
        
        int32x4_t in32 = vcvtq_s32_f32(scaled);
        int16x4_t in16 = vqmovn_s32(in32);
        vst1_s16(output + i * 4, in16);
    }
    
    // Process remaining samples
    for (size_t i = simdCount * 4; i < count; ++i) {
        float sample = input[i] * scale;
        sample = std::max(-32768.0f, std::min(32767.0f, sample));
        output[i] = static_cast<int16_t>(sample);
    }
}

float calculateRMS(const float* data, size_t count) {
    size_t simdCount = count / 4;
    float32x4_t sum = vdupq_n_f32(0.0f);
    
    for (size_t i = 0; i < simdCount; ++i) {
        float32x4_t in = vld1q_f32(data + i * 4);
        float32x4_t squared = vmulq_f32(in, in);
        sum = vaddq_f32(sum, squared);
    }
    
    // Sum the vector elements
    float32x2_t sum2 = vadd_f32(vget_low_f32(sum), vget_high_f32(sum));
    float totalSum = vget_lane_f32(vpadd_f32(sum2, sum2), 0);
    
    // Add remaining samples
    for (size_t i = simdCount * 4; i < count; ++i) {
        totalSum += data[i] * data[i];
    }
    
    return std::sqrt(totalSum / count);
}

float calculatePeak(const float* data, size_t count) {
    size_t simdCount = count / 4;
    float32x4_t peak = vdupq_n_f32(0.0f);
    
    for (size_t i = 0; i < simdCount; ++i) {
        float32x4_t in = vld1q_f32(data + i * 4);
        float32x4_t absVal = vabsq_f32(in);
        peak = vmaxq_f32(peak, absVal);
    }
    
    // Find max in vector
    float32x2_t max2 = vmax_f32(vget_low_f32(peak), vget_high_f32(peak));
    float maxVal = vget_lane_f32(vpmax_f32(max2, max2), 0);
    
    // Check remaining samples
    for (size_t i = simdCount * 4; i < count; ++i) {
        float absVal = std::abs(data[i]);
        if (absVal > maxVal) {
            maxVal = absVal;
        }
    }
    
    return maxVal;
}

void applyGain(float* data, size_t count, float gain) {
    processFloat32(data, data, count, gain);
}

void applyGainRamp(float* data, size_t count, float startGain, float endGain) {
    float gainStep = (endGain - startGain) / count;
    size_t simdCount = count / 4;
    
    float32x4_t step = vdupq_n_f32(gainStep * 4);
    float32x4_t gain = {
        startGain,
        startGain + gainStep,
        startGain + gainStep * 2,
        startGain + gainStep * 3
    };
    
    for (size_t i = 0; i < simdCount; ++i) {
        float32x4_t in = vld1q_f32(data + i * 4);
        float32x4_t result = vmulq_f32(in, gain);
        vst1q_f32(data + i * 4, result);
        gain = vaddq_f32(gain, step);
    }
    
    // Process remaining samples
    float currentGain = startGain + simdCount * 4 * gainStep;
    for (size_t i = simdCount * 4; i < count; ++i) {
        data[i] *= currentGain;
        currentGain += gainStep;
    }
}

} // namespace neon

#endif // __ARM_NEON

// ============================================================================
// x86 SSE2 implementations
// ============================================================================

#ifdef __SSE2__

namespace sse2 {

void processFloat32(const float* input, float* output, size_t count, float gain) {
    size_t simdCount = count / 4;
    __m128 gainVec = _mm_set1_ps(gain);
    
    for (size_t i = 0; i < simdCount; ++i) {
        __m128 in = _mm_loadu_ps(input + i * 4);
        __m128 result = _mm_mul_ps(in, gainVec);
        _mm_storeu_ps(output + i * 4, result);
    }
    
    // Process remaining samples
    for (size_t i = simdCount * 4; i < count; ++i) {
        output[i] = input[i] * gain;
    }
}

void mixFloat32(const float* input1, const float* input2, float* output,
                size_t count, float gain1, float gain2) {
    size_t simdCount = count / 4;
    __m128 gain1Vec = _mm_set1_ps(gain1);
    __m128 gain2Vec = _mm_set1_ps(gain2);
    
    for (size_t i = 0; i < simdCount; ++i) {
        __m128 in1 = _mm_loadu_ps(input1 + i * 4);
        __m128 in2 = _mm_loadu_ps(input2 + i * 4);
        
        __m128 scaled1 = _mm_mul_ps(in1, gain1Vec);
        __m128 scaled2 = _mm_mul_ps(in2, gain2Vec);
        __m128 result = _mm_add_ps(scaled1, scaled2);
        
        _mm_storeu_ps(output + i * 4, result);
    }
    
    // Process remaining samples
    for (size_t i = simdCount * 4; i < count; ++i) {
        output[i] = input1[i] * gain1 + input2[i] * gain2;
    }
}

void convertInt16ToFloat32(const int16_t* input, float* output, size_t count) {
    const float scale = 1.0f / 32768.0f;
    size_t simdCount = count / 4;
    __m128 scaleVec = _mm_set1_ps(scale);
    
    for (size_t i = 0; i < simdCount; ++i) {
        // Load 4 int16 values (8 bytes)
        __m128i in16 = _mm_loadl_epi64((__m128i*)(input + i * 4));
        
        // Convert to int32
        __m128i in32 = _mm_cvtepi16_epi32(in16);
        
        // Convert to float
        __m128 inFloat = _mm_cvtepi32_ps(in32);
        
        // Scale
        __m128 result = _mm_mul_ps(inFloat, scaleVec);
        
        _mm_storeu_ps(output + i * 4, result);
    }
    
    // Process remaining samples
    for (size_t i = simdCount * 4; i < count; ++i) {
        output[i] = input[i] * scale;
    }
}

void convertFloat32ToInt16(const float* input, int16_t* output, size_t count) {
    const float scale = 32767.0f;
    size_t simdCount = count / 4;
    
    __m128 scaleVec = _mm_set1_ps(scale);
    __m128 minVec = _mm_set1_ps(-32768.0f);
    __m128 maxVec = _mm_set1_ps(32767.0f);
    
    for (size_t i = 0; i < simdCount; ++i) {
        __m128 in = _mm_loadu_ps(input + i * 4);
        __m128 scaled = _mm_mul_ps(in, scaleVec);
        
        // Clamp
        scaled = _mm_max_ps(scaled, minVec);
        scaled = _mm_min_ps(scaled, maxVec);
        
        // Convert to int32
        __m128i in32 = _mm_cvtps_epi32(scaled);
        
        // Pack to int16
        __m128i in16 = _mm_packs_epi32(in32, in32);
        
        // Store lower 8 bytes (4 int16 values)
        _mm_storel_epi64((__m128i*)(output + i * 4), in16);
    }
    
    // Process remaining samples
    for (size_t i = simdCount * 4; i < count; ++i) {
        float sample = input[i] * scale;
        sample = std::max(-32768.0f, std::min(32767.0f, sample));
        output[i] = static_cast<int16_t>(sample);
    }
}

float calculateRMS(const float* data, size_t count) {
    size_t simdCount = count / 4;
    __m128 sum = _mm_setzero_ps();
    
    for (size_t i = 0; i < simdCount; ++i) {
        __m128 in = _mm_loadu_ps(data + i * 4);
        __m128 squared = _mm_mul_ps(in, in);
        sum = _mm_add_ps(sum, squared);
    }
    
    // Sum the vector elements
    __m128 shuf = _mm_shuffle_ps(sum, sum, _MM_SHUFFLE(2, 3, 0, 1));
    __m128 sums = _mm_add_ps(sum, shuf);
    shuf = _mm_movehl_ps(shuf, sums);
    sums = _mm_add_ss(sums, shuf);
    float totalSum = _mm_cvtss_f32(sums);
    
    // Add remaining samples
    for (size_t i = simdCount * 4; i < count; ++i) {
        totalSum += data[i] * data[i];
    }
    
    return std::sqrt(totalSum / count);
}

float calculatePeak(const float* data, size_t count) {
    size_t simdCount = count / 4;
    __m128 peak = _mm_setzero_ps();
    __m128 signMask = _mm_castsi128_ps(_mm_set1_epi32(0x7FFFFFFF));
    
    for (size_t i = 0; i < simdCount; ++i) {
        __m128 in = _mm_loadu_ps(data + i * 4);
        __m128 absVal = _mm_and_ps(in, signMask); // Absolute value
        peak = _mm_max_ps(peak, absVal);
    }
    
    // Find max in vector
    __m128 shuf = _mm_shuffle_ps(peak, peak, _MM_SHUFFLE(2, 3, 0, 1));
    __m128 maxs = _mm_max_ps(peak, shuf);
    shuf = _mm_movehl_ps(shuf, maxs);
    maxs = _mm_max_ss(maxs, shuf);
    float maxVal = _mm_cvtss_f32(maxs);
    
    // Check remaining samples
    for (size_t i = simdCount * 4; i < count; ++i) {
        float absVal = std::abs(data[i]);
        if (absVal > maxVal) {
            maxVal = absVal;
        }
    }
    
    return maxVal;
}

void applyGain(float* data, size_t count, float gain) {
    processFloat32(data, data, count, gain);
}

void applyGainRamp(float* data, size_t count, float startGain, float endGain) {
    float gainStep = (endGain - startGain) / count;
    size_t simdCount = count / 4;
    
    __m128 step = _mm_set1_ps(gainStep * 4);
    __m128 gain = _mm_set_ps(
        startGain + gainStep * 3,
        startGain + gainStep * 2,
        startGain + gainStep,
        startGain
    );
    
    for (size_t i = 0; i < simdCount; ++i) {
        __m128 in = _mm_loadu_ps(data + i * 4);
        __m128 result = _mm_mul_ps(in, gain);
        _mm_storeu_ps(data + i * 4, result);
        gain = _mm_add_ps(gain, step);
    }
    
    // Process remaining samples
    float currentGain = startGain + simdCount * 4 * gainStep;
    for (size_t i = simdCount * 4; i < count; ++i) {
        data[i] *= currentGain;
        currentGain += gainStep;
    }
}

} // namespace sse2

#endif // __SSE2__

// ============================================================================
// Public API - Select best implementation based on CPU features
// ============================================================================

void processFloat32(const float* input, float* output, size_t count, float gain) {
#ifdef __ARM_NEON
    neon::processFloat32(input, output, count, gain);
#elif defined(__SSE2__)
    sse2::processFloat32(input, output, count, gain);
#else
    generic::processFloat32(input, output, count, gain);
#endif
}

void mixFloat32(const float* input1, const float* input2, float* output,
                size_t count, float gain1, float gain2) {
#ifdef __ARM_NEON
    neon::mixFloat32(input1, input2, output, count, gain1, gain2);
#elif defined(__SSE2__)
    sse2::mixFloat32(input1, input2, output, count, gain1, gain2);
#else
    generic::mixFloat32(input1, input2, output, count, gain1, gain2);
#endif
}

void convertInt16ToFloat32(const int16_t* input, float* output, size_t count) {
#ifdef __ARM_NEON
    neon::convertInt16ToFloat32(input, output, count);
#elif defined(__SSE2__)
    sse2::convertInt16ToFloat32(input, output, count);
#else
    generic::convertInt16ToFloat32(input, output, count);
#endif
}

void convertFloat32ToInt16(const float* input, int16_t* output, size_t count) {
#ifdef __ARM_NEON
    neon::convertFloat32ToInt16(input, output, count);
#elif defined(__SSE2__)
    sse2::convertFloat32ToInt16(input, output, count);
#else
    generic::convertFloat32ToInt16(input, output, count);
#endif
}

float calculateRMS(const float* data, size_t count) {
#ifdef __ARM_NEON
    return neon::calculateRMS(data, count);
#elif defined(__SSE2__)
    return sse2::calculateRMS(data, count);
#else
    return generic::calculateRMS(data, count);
#endif
}

float calculatePeak(const float* data, size_t count) {
#ifdef __ARM_NEON
    return neon::calculatePeak(data, count);
#elif defined(__SSE2__)
    return sse2::calculatePeak(data, count);
#else
    return generic::calculatePeak(data, count);
#endif
}

void applyGain(float* data, size_t count, float gain) {
#ifdef __ARM_NEON
    neon::applyGain(data, count, gain);
#elif defined(__SSE2__)
    sse2::applyGain(data, count, gain);
#else
    generic::applyGain(data, count, gain);
#endif
}

void applyGainRamp(float* data, size_t count, float startGain, float endGain) {
#ifdef __ARM_NEON
    neon::applyGainRamp(data, count, startGain, endGain);
#elif defined(__SSE2__)
    sse2::applyGainRamp(data, count, startGain, endGain);
#else
    generic::applyGainRamp(data, count, startGain, endGain);
#endif
}

bool isSimdAvailable() {
#ifdef __ARM_NEON
    return true;
#elif defined(__SSE2__)
    return true;
#else
    return false;
#endif
}

std::string getSimdType() {
#ifdef __ARM_NEON
    return "ARM NEON";
#elif defined(__AVX__)
    return "x86 AVX";
#elif defined(__SSE2__)
    return "x86 SSE2";
#else
    return "None (Generic)";
#endif
}

} // namespace simd
} // namespace capture
} // namespace Audio
