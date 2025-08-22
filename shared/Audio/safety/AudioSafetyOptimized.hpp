#pragma once

#include "AudioSafety.hpp"
#include "../core/BranchFreeAlgorithms.hpp"
#include "../core/MemoryPool.hpp"
#include <memory>
#include <cstring>

// SIMD headers
#if defined(__x86_64__) || defined(_M_X64) || defined(__i386__)
    #ifdef __AVX2__
        #include <immintrin.h>
        #define SAFETY_AVX2
    #elif defined(__SSE4_1__)
        #include <smmintrin.h>
        #define SAFETY_SSE
    #endif
#elif defined(__ARM_NEON) || defined(__aarch64__)
    #include <arm_neon.h>
    #define SAFETY_NEON
#endif

namespace AudioSafety {

/**
 * @brief Optimized version of AudioSafetyEngine with SIMD and branch-free algorithms
 * 
 * Features:
 * - SIMD vectorized DC removal
 * - Branch-free limiting
 * - Memory pool for reports
 * - Cache-optimized processing
 */
class AudioSafetyEngineOptimized : public AudioSafetyEngine {
public:
    AudioSafetyEngineOptimized(uint32_t sampleRate, int channels, SafetyError* error = nullptr);
    ~AudioSafetyEngineOptimized();
    
    // Override processing methods with optimized versions
    SafetyError processMono(float* buffer, size_t numSamples) noexcept override;
    SafetyError processStereo(float* left, float* right, size_t numSamples) noexcept override;
    
private:
    // Memory pool for SafetyReport allocations
    static AudioFX::ObjectPool<SafetyReport> reportPool_;
    
    // Optimized DC removal with SIMD
    void dcRemoveSIMD(float* x, size_t n, float mean) noexcept;
    
    // Branch-free limiting
    void limitBufferBranchFree(float* x, size_t n, float threshold) noexcept;
    
    // Optimized analysis with SIMD
    SafetyReport analyzeAndCleanOptimized(float* x, size_t n) noexcept;
    
#ifdef SAFETY_AVX2
    void dcRemoveAVX2(float* x, size_t n, float mean) noexcept;
    void limitBufferAVX2(float* x, size_t n, float threshold) noexcept;
    SafetyReport analyzeAVX2(const float* x, size_t n) noexcept;
#endif

#ifdef SAFETY_NEON
    void dcRemoveNEON(float* x, size_t n, float mean) noexcept;
    void limitBufferNEON(float* x, size_t n, float threshold) noexcept;
    SafetyReport analyzeNEON(const float* x, size_t n) noexcept;
#endif
};

// Implementation of optimized methods

inline AudioSafetyEngineOptimized::AudioSafetyEngineOptimized(
    uint32_t sampleRate, int channels, SafetyError* error)
    : AudioSafetyEngine(sampleRate, channels, error) {
}

inline AudioSafetyEngineOptimized::~AudioSafetyEngineOptimized() = default;

// Initialize static memory pool
inline AudioFX::ObjectPool<SafetyReport> AudioSafetyEngineOptimized::reportPool_(32);

inline void AudioSafetyEngineOptimized::dcRemoveSIMD(float* x, size_t n, float mean) noexcept {
#ifdef SAFETY_AVX2
    dcRemoveAVX2(x, n, mean);
#elif defined(SAFETY_NEON)
    dcRemoveNEON(x, n, mean);
#else
    // Fallback to base implementation
    dcRemove(x, n, mean);
#endif
}

#ifdef SAFETY_AVX2
inline void AudioSafetyEngineOptimized::dcRemoveAVX2(float* x, size_t n, float mean) noexcept {
    const __m256 mean_vec = _mm256_set1_ps(mean);
    size_t i = 0;
    
    // Process 8 samples at a time
    for (; i + 7 < n; i += 8) {
        __m256 samples = _mm256_loadu_ps(&x[i]);
        samples = _mm256_sub_ps(samples, mean_vec);
        _mm256_storeu_ps(&x[i], samples);
    }
    
    // Process remaining samples
    for (; i < n; ++i) {
        x[i] -= mean;
    }
}

inline void AudioSafetyEngineOptimized::limitBufferAVX2(float* x, size_t n, float threshold) noexcept {
    const __m256 pos_thresh = _mm256_set1_ps(threshold);
    const __m256 neg_thresh = _mm256_set1_ps(-threshold);
    size_t i = 0;
    
    // Process 8 samples at a time
    for (; i + 7 < n; i += 8) {
        __m256 samples = _mm256_loadu_ps(&x[i]);
        
        // Branch-free clamping using min/max
        samples = _mm256_min_ps(samples, pos_thresh);
        samples = _mm256_max_ps(samples, neg_thresh);
        
        _mm256_storeu_ps(&x[i], samples);
    }
    
    // Process remaining samples with branch-free scalar
    for (; i < n; ++i) {
        x[i] = BranchFree::clamp(x[i], -threshold, threshold);
    }
}

inline SafetyReport AudioSafetyEngineOptimized::analyzeAVX2(const float* x, size_t n) noexcept {
    SafetyReport report{};
    
    __m256 sum_vec = _mm256_setzero_ps();
    __m256 sum2_vec = _mm256_setzero_ps();
    __m256 peak_vec = _mm256_setzero_ps();
    
    size_t i = 0;
    uint32_t clipped = 0;
    
    const __m256 clip_high = _mm256_set1_ps(CLIP_THRESHOLD_HIGH);
    const __m256 clip_low = _mm256_set1_ps(CLIP_THRESHOLD_LOW);
    
    // Process 8 samples at a time
    for (; i + 7 < n; i += 8) {
        __m256 samples = _mm256_loadu_ps(&x[i]);
        
        // Accumulate sum and sum of squares
        sum_vec = _mm256_add_ps(sum_vec, samples);
        __m256 squares = _mm256_mul_ps(samples, samples);
        sum2_vec = _mm256_add_ps(sum2_vec, squares);
        
        // Update peak (absolute value)
        __m256 abs_samples = _mm256_andnot_ps(_mm256_set1_ps(-0.0f), samples);
        peak_vec = _mm256_max_ps(peak_vec, abs_samples);
        
        // Count clipped samples
        __m256 high_mask = _mm256_cmp_ps(samples, clip_high, _CMP_GT_OQ);
        __m256 low_mask = _mm256_cmp_ps(samples, clip_low, _CMP_LT_OQ);
        __m256 clip_mask = _mm256_or_ps(high_mask, low_mask);
        
        // Convert mask to count (simplified - actual implementation would use movemask)
        int mask = _mm256_movemask_ps(clip_mask);
        clipped += __builtin_popcount(mask);
    }
    
    // Horizontal sum for accumulated values
    float sum_arr[8], sum2_arr[8], peak_arr[8];
    _mm256_storeu_ps(sum_arr, sum_vec);
    _mm256_storeu_ps(sum2_arr, sum2_vec);
    _mm256_storeu_ps(peak_arr, peak_vec);
    
    double sum = 0, sum2 = 0, peak = 0;
    for (int j = 0; j < 8; ++j) {
        sum += sum_arr[j];
        sum2 += sum2_arr[j];
        peak = std::max(peak, static_cast<double>(peak_arr[j]));
    }
    
    // Process remaining samples
    for (; i < n; ++i) {
        float v = x[i];
        sum += v;
        sum2 += v * v;
        peak = std::max(peak, static_cast<double>(std::abs(v)));
        if (v > CLIP_THRESHOLD_HIGH || v < CLIP_THRESHOLD_LOW) {
            clipped++;
        }
    }
    
    report.peak = peak;
    report.rms = std::sqrt(sum2 / n);
    report.dcOffset = sum / n;
    report.clippedSamples = clipped;
    
    return report;
}
#endif // SAFETY_AVX2

#ifdef SAFETY_NEON
inline void AudioSafetyEngineOptimized::dcRemoveNEON(float* x, size_t n, float mean) noexcept {
    const float32x4_t mean_vec = vdupq_n_f32(mean);
    size_t i = 0;
    
    // Process 4 samples at a time
    for (; i + 3 < n; i += 4) {
        float32x4_t samples = vld1q_f32(&x[i]);
        samples = vsubq_f32(samples, mean_vec);
        vst1q_f32(&x[i], samples);
    }
    
    // Process remaining samples
    for (; i < n; ++i) {
        x[i] -= mean;
    }
}

inline void AudioSafetyEngineOptimized::limitBufferNEON(float* x, size_t n, float threshold) noexcept {
    const float32x4_t pos_thresh = vdupq_n_f32(threshold);
    const float32x4_t neg_thresh = vdupq_n_f32(-threshold);
    size_t i = 0;
    
    // Process 4 samples at a time
    for (; i + 3 < n; i += 4) {
        float32x4_t samples = vld1q_f32(&x[i]);
        
        // Branch-free clamping
        samples = vminq_f32(samples, pos_thresh);
        samples = vmaxq_f32(samples, neg_thresh);
        
        vst1q_f32(&x[i], samples);
    }
    
    // Process remaining samples
    for (; i < n; ++i) {
        x[i] = BranchFree::clamp(x[i], -threshold, threshold);
    }
}
#endif // SAFETY_NEON

inline void AudioSafetyEngineOptimized::limitBufferBranchFree(float* x, size_t n, float threshold) noexcept {
#ifdef SAFETY_AVX2
    limitBufferAVX2(x, n, threshold);
#elif defined(SAFETY_NEON)
    limitBufferNEON(x, n, threshold);
#else
    // Branch-free scalar fallback
    for (size_t i = 0; i < n; ++i) {
        x[i] = BranchFree::clamp(x[i], -threshold, threshold);
    }
#endif
}

inline SafetyReport AudioSafetyEngineOptimized::analyzeAndCleanOptimized(float* x, size_t n) noexcept {
    // Get report from pool
    auto pooledReport = AudioFX::PooledObject<SafetyReport>(reportPool_);
    SafetyReport& report = *pooledReport;
    
#ifdef SAFETY_AVX2
    report = analyzeAVX2(x, n);
#elif defined(SAFETY_NEON)
    report = analyzeNEON(x, n);
#else
    // Fallback to base implementation
    report = analyzeAndClean(x, n);
#endif
    
    // DC removal with SIMD if needed
    if (config_.dcRemovalEnabled && std::abs(report.dcOffset) > config_.dcThreshold) {
        dcRemoveSIMD(x, n, static_cast<float>(report.dcOffset));
        report.dcOffset = 0.0;
    }
    
    // Branch-free limiting if needed
    if (config_.limiterEnabled) {
        limitBufferBranchFree(x, n, static_cast<float>(limiterThresholdLin_));
        report.overloadActive = report.peak > limiterThresholdLin_;
    }
    
    // Feedback detection (keep original for now)
    if (config_.feedbackDetectEnabled) {
        report.feedbackScore = estimateFeedbackScore(x, n);
        report.feedbackLikely = report.feedbackScore >= config_.feedbackCorrThreshold;
    }
    
    return report;
}

inline SafetyError AudioSafetyEngineOptimized::processMono(float* buffer, size_t numSamples) noexcept {
    if (!buffer) {
        return SafetyError::NULL_BUFFER;
    }
    if (!config_.enabled || numSamples == 0) {
        return SafetyError::OK;
    }
    
    report_ = analyzeAndCleanOptimized(buffer, numSamples);
    return SafetyError::OK;
}

inline SafetyError AudioSafetyEngineOptimized::processStereo(float* left, float* right, size_t numSamples) noexcept {
    if (!left || !right) {
        return SafetyError::NULL_BUFFER;
    }
    if (!config_.enabled || numSamples == 0) {
        return SafetyError::OK;
    }
    
    // Process each channel with optimized version
    SafetyReport rl = analyzeAndCleanOptimized(left, numSamples);
    SafetyReport rr = analyzeAndCleanOptimized(right, numSamples);
    
    // Aggregate reports
    report_.peak = std::max(rl.peak, rr.peak);
    report_.rms = std::sqrt((rl.rms * rl.rms + rr.rms * rr.rms) / 2.0);
    report_.dcOffset = (rl.dcOffset + rr.dcOffset) / 2.0;
    report_.clippedSamples = rl.clippedSamples + rr.clippedSamples;
    report_.overloadActive = rl.overloadActive || rr.overloadActive;
    report_.feedbackScore = std::max(rl.feedbackScore, rr.feedbackScore);
    report_.hasNaN = rl.hasNaN || rr.hasNaN;
    report_.feedbackLikely = report_.feedbackScore >= config_.feedbackCorrThreshold;
    
    return SafetyError::OK;
}

} // namespace AudioSafety