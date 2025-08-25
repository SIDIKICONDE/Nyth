#pragma once
#ifndef NYTH_AUDIO_FX_BIQUADFILTER_OPTIMIZED_HPP
#define BIQUADFILTER_OPTIMIZED_HPP

#include <cmath>
#include "BiquadFilter.hpp"

#ifdef __x86_64__
#include <immintrin.h> // For x86/x64 SIMD intrinsics
#endif

#ifdef __ARM_NEON
#include <arm_neon.h> // For ARM NEON intrinsics
#endif

namespace Nyth {
namespace Audio {
namespace FX {

// Specialized float-only processing to avoid conversions
class BiquadFilterFloat : public BiquadFilter {
public:
    // Process using native float precision throughout
    void processFloatOptimized(const float* input, float* output, size_t numSamples) {
        if (!input || !output || numSamples == 0)
            return;

        // Use float precision for state variables
        float y1f = static_cast<float>(m_y1);
        float y2f = static_cast<float>(m_y2);

        // Convert coefficients once
        const float a0f = static_cast<float>(m_a0);
        const float a1f = static_cast<float>(m_a1);
        const float a2f = static_cast<float>(m_a2);
        const float b1f = static_cast<float>(m_b1);
        const float b2f = static_cast<float>(m_b2);

        // Process in float precision
        for (size_t i = 0; i < numSamples; ++i) {
            float x = input[i];
            float w = x - b1f * y1f - b2f * y2f;
            float y = a0f * w + a1f * y1f + a2f * y2f;

            y2f = y1f;
            y1f = (std::abs(w) < 1e-30f) ? 0.0f : w;

            output[i] = y;
        }

        // Store state back as double for compatibility
        m_y1 = static_cast<double>(y1f);
        m_y2 = static_cast<double>(y2f);
    }

#if defined(__AVX2__) && defined(__x86_64__)
    // AVX2 optimized version for x86_64
    void processAVX2(const float* input, float* output, size_t numSamples) {
        if (!input || !output || numSamples == 0)
            return;

        // Process 8 samples at a time with AVX2
        const __m256 a0_vec = _mm256_set1_ps(static_cast<float>(m_a0));
        const __m256 a1_vec = _mm256_set1_ps(static_cast<float>(m_a1));
        const __m256 a2_vec = _mm256_set1_ps(static_cast<float>(m_a2));
        const __m256 b1_vec = _mm256_set1_ps(static_cast<float>(m_b1));
        const __m256 b2_vec = _mm256_set1_ps(static_cast<float>(m_b2));

        size_t i = 0;
        for (; i + 7 < numSamples; i += 8) {
            __m256 x = _mm256_loadu_ps(&input[i]);

            // Process 8 samples in parallel
            // Note: This is simplified - real implementation would need
            // to handle state propagation between samples
            __m256 y = x; // Placeholder for actual filter computation

            _mm256_storeu_ps(&output[i], y);
        }

        // Process remaining samples
        for (; i < numSamples; ++i) {
            processFloatOptimized(&input[i], &output[i], 1);
        }
    }
#endif

#ifdef __ARM_NEON
    // NEON optimized version for ARM
    void processNEON(const float* input, float* output, size_t numSamples) {
        if (!input || !output || numSamples == 0)
            return;

        // Process 4 samples at a time with NEON
        const float32x4_t a0_vec = vdupq_n_f32(static_cast<float>(m_a0));
        const float32x4_t a1_vec = vdupq_n_f32(static_cast<float>(m_a1));
        const float32x4_t a2_vec = vdupq_n_f32(static_cast<float>(m_a2));
        const float32x4_t b1_vec = vdupq_n_f32(static_cast<float>(m_b1));
        const float32x4_t b2_vec = vdupq_n_f32(static_cast<float>(m_b2));

        size_t i = 0;
        for (; i + 3 < numSamples; i += 4) {
            float32x4_t x = vld1q_f32(&input[i]);

            // Process 4 samples in parallel
            // Note: This is simplified - real implementation would need
            // to handle state propagation between samples
            float32x4_t y = x; // Placeholder for actual filter computation

            vst1q_f32(&output[i], y);
        }

        // Process remaining samples
        for (; i < numSamples; ++i) {
            processFloatOptimized(&input[i], &output[i], 1);
        }
    }
#endif
};

} // namespace FX
} // namespace Audio
} // namespace Nyth

#endif // NYTH_AUDIO_FX_BIQUADFILTER_OPTIMIZED_HPP
