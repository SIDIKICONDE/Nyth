#pragma once
#ifndef NYTH_AUDIO_FX_BIQUADFILTER_NEON_PARALLEL_OPT_HPP
#define NYTH_AUDIO_FX_BIQUADFILTER_NEON_PARALLEL_OPT_HPP

#include <cstddef>
#include <arm_neon.h>

namespace Nyth {
namespace Audio {
namespace FX {

class BiquadFilterNEONParallelOpt {
public:
    float m_y1[4] = {0.0f, 0.0f, 0.0f, 0.0f};
    float m_y2[4] = {0.0f, 0.0f, 0.0f, 0.0f};

    float m_a0[4], m_a1[4], m_a2[4], m_b1[4], m_b2[4];

    BiquadFilterNEONParallelOpt(const float a0[4], const float a1[4], const float a2[4],
                                const float b1[4], const float b2[4]) {
        for (int i = 0; i < 4; ++i) {
            m_a0[i] = a0[i]; m_a1[i] = a1[i]; m_a2[i] = a2[i];
            m_b1[i] = b1[i]; m_b2[i] = b2[i];
        }
    }

    void process(const float* input[4], float* output[4], size_t numSamples) {
        // Charger les coefficients en SIMD une seule fois
        const float32x4_t a0_vec = vld1q_f32(m_a0);
        const float32x4_t a1_vec = vld1q_f32(m_a1);
        const float32x4_t a2_vec = vld1q_f32(m_a2);
        const float32x4_t b1_vec = vld1q_f32(m_b1);
        const float32x4_t b2_vec = vld1q_f32(m_b2);

        float32x4_t y1_vec = vld1q_f32(m_y1);
        float32x4_t y2_vec = vld1q_f32(m_y2);

        for (size_t n = 0; n < numSamples; ++n) {
            // Charger les entrées
            float32x4_t x_vec = { input[0][n], input[1][n], input[2][n], input[3][n] };

            // Calcul w = x - b1*y1 - b2*y2
            float32x4_t w_vec = vsubq_f32(x_vec, vaddq_f32(vmulq_f32(b1_vec, y1_vec),
                                                            vmulq_f32(b2_vec, y2_vec)));

            // Calcul y = a0*w + a1*y1 + a2*y2
            float32x4_t y_vec = vaddq_f32(vmulq_f32(a0_vec, w_vec),
                                          vaddq_f32(vmulq_f32(a1_vec, y1_vec),
                                                    vmulq_f32(a2_vec, y2_vec)));

            // Stocker les sorties directement
            vst1q_lane_f32(&output[0][n], y_vec, 0);
            vst1q_lane_f32(&output[1][n], y_vec, 1);
            vst1q_lane_f32(&output[2][n], y_vec, 2);
            vst1q_lane_f32(&output[3][n], y_vec, 3);

            // Mettre à jour les états pour le prochain échantillon
            y2_vec = y1_vec;
            y1_vec = w_vec;
        }

        // Sauvegarder les états finaux
        vst1q_f32(m_y1, y1_vec);
        vst1q_f32(m_y2, y2_vec);
    }
};

} // namespace FX
} // namespace Audio
} // namespace Nyth

#endif // NYTH_AUDIO_FX_BIQUADFILTER_NEON_PARALLEL_OPT_HPP
