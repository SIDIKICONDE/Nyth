#pragma once
#ifndef NYTH_AUDIO_FX_BIQUADFILTER_SAFE_HPP
#define BIQUADFILTER_SAFE_HPP

#include "../config/ErrorCodes.hpp"
#include "BiquadFilter.hpp"
#include <algorithm>
#include <cmath>
#include <cstdlib>
#include <new>


namespace Nyth {
namespace Audio {
namespace FX {

/**
 * @brief Safe version of BiquadFilter with complete bounds checking
 *
 * This version prioritizes safety over performance with comprehensive
 * validation of all inputs and outputs.
 */
class BiquadFilterSafe : public BiquadFilter {
public:
    BiquadFilterSafe() : BiquadFilter() {}
    ~BiquadFilterSafe() = default;

    /**
     * @brief Process audio with full validation
     * @return Error code indicating success or failure
     */
    AudioError processSafe(const float* input, float* output, size_t numSamples) noexcept {
        // Input validation
        AUDIO_RETURN_IF_ERROR(AudioValidator::validateBuffer(input, numSamples));
        AUDIO_RETURN_IF_ERROR(AudioValidator::validateBuffer(output, numSamples));

        // Check for aliasing (input == output is OK)
        // No additional check needed

        // Process with bounds checking
        for (size_t i = 0; i < numSamples; ++i) {
            // Validate input sample
            AUDIO_RETURN_IF_ERROR(AudioValidator::validateFinite(input[i]));

            // Process sample
            float result = processSampleSafe(input[i]);

            // Validate output
            AUDIO_RETURN_IF_ERROR(AudioValidator::validateFinite(result));

            // Clamp output to prevent overflow
            result = std::max(-10.0f, std::min(result, 10.0f)); // ±10 is reasonable for audio

            output[i] = result;
        }

        return Nyth::Audio::Constants::AudioError::OK;
    }

    /**
     * @brief Process stereo with full validation
     */
    AudioError processStereoSafe(const float* inputL, const float* inputR, float* outputL, float* outputR,
                                 size_t numSamples) noexcept {
        // Validate all buffers
        AUDIO_RETURN_IF_ERROR(AudioValidator::validateBuffer(inputL, numSamples));
        AUDIO_RETURN_IF_ERROR(AudioValidator::validateBuffer(inputR, numSamples));
        AUDIO_RETURN_IF_ERROR(AudioValidator::validateBuffer(outputL, numSamples));
        AUDIO_RETURN_IF_ERROR(AudioValidator::validateBuffer(outputR, numSamples));

        // Process each channel
        for (size_t i = 0; i < numSamples; ++i) {
            // Validate inputs
            AUDIO_RETURN_IF_ERROR(AudioValidator::validateFinite(inputL[i]));
            AUDIO_RETURN_IF_ERROR(AudioValidator::validateFinite(inputR[i]));

            // Process samples
            float resultL = processSampleSafe(inputL[i]);
            float resultR = processSampleSafeRight(inputR[i]);

            // Validate outputs
            AUDIO_RETURN_IF_ERROR(AudioValidator::validateFinite(resultL));
            AUDIO_RETURN_IF_ERROR(AudioValidator::validateFinite(resultR));

            // Clamp outputs
            outputL[i] = std::max(-10.0f, std::min(resultL, 10.0f));
            outputR[i] = std::max(-10.0f, std::min(resultR, 10.0f));
        }

        return Nyth::Audio::Constants::AudioError::OK;
    }

    /**
     * @brief Set coefficients with validation
     */
    AudioError setCoeffcientsSafe(double a0, double a1, double a2, double b0, double b1, double b2) noexcept {
        // Validate all coefficients are finite
        AUDIO_RETURN_IF_ERROR(AudioValidator::validateFinite(a0));
        AUDIO_RETURN_IF_ERROR(AudioValidator::validateFinite(a1));
        AUDIO_RETURN_IF_ERROR(AudioValidator::validateFinite(a2));
        AUDIO_RETURN_IF_ERROR(AudioValidator::validateFinite(b0));
        AUDIO_RETURN_IF_ERROR(AudioValidator::validateFinite(b1));
        AUDIO_RETURN_IF_ERROR(AudioValidator::validateFinite(b2));

        // Check for stability (simplified check)
        // For stability, poles must be inside unit circle
        // This is a simplified check - full stability analysis is complex
        if (std::abs(b0) < 1e-10) {
            return Nyth::Audio::Constants::AudioError::INVALID_PARAMETER; // b0 must not be zero
        }

        // Normalize and set
        setCoefficients(a0, a1, a2, b0, b1, b2);

        return Nyth::Audio::Constants::AudioError::OK;
    }

    /**
     * @brief Calculate filter coefficients with validation
     */
    AudioError calculateLowpassSafe(double frequency, double sampleRate, double q) noexcept {
        // Validate parameters
        AUDIO_RETURN_IF_ERROR(AudioValidator::validateSampleRate(static_cast<uint32_t>(sampleRate)));
        AUDIO_RETURN_IF_ERROR(AudioValidator::validateFrequency(frequency, sampleRate));
        AUDIO_RETURN_IF_ERROR(AudioValidator::validateQ(q));

        // Calculate using base class method
        calculateLowpass(frequency, sampleRate, q);

        // Verify coefficients are valid
        double a0, a1, a2, b0, b1, b2;
        getCoefficients(a0, a1, a2, b0, b1, b2);

        AUDIO_RETURN_IF_ERROR(AudioValidator::validateFinite(a0));
        AUDIO_RETURN_IF_ERROR(AudioValidator::validateFinite(a1));
        AUDIO_RETURN_IF_ERROR(AudioValidator::validateFinite(a2));
        AUDIO_RETURN_IF_ERROR(AudioValidator::validateFinite(b1));
        AUDIO_RETURN_IF_ERROR(AudioValidator::validateFinite(b2));

        return Nyth::Audio::Constants::AudioError::OK;
    }

protected:
    /**
     * @brief Process single sample with denormal prevention and bounds checking
     */
    float processSampleSafe(float input) noexcept {
        // Check input
        if (!std::isfinite(input)) {
            input = 0.0f; // Safe fallback
        }

        // Clamp input to prevent overflow in calculations
        input = std::max(-100.0f, std::min(input, 100.0f));

        // Process using base class
        float output = processSample(input);

        // Denormal prevention
        if (std::abs(output) < 1e-30f) {
            output = 0.0f;
        }

        // Prevent NaN/Inf propagation
        if (!std::isfinite(output)) {
            output = 0.0f;
            // Reset filter state to recover from numerical issues
            reset();
        }

        return output;
    }

    /**
     * @brief Process right channel sample
     */
    float processSampleSafeRight(float input) noexcept {
        // Similar to processSampleSafe but uses right channel state
        if (!std::isfinite(input)) {
            input = 0.0f;
        }

        input = std::max(-100.0f, std::min(input, 100.0f));

        // Direct Form II implementation for right channel
        double x = static_cast<double>(input);
        double w = x - m_b1 * m_y1R - m_b2 * m_y2R;
        double y = m_a0 * w + m_a1 * m_y1R + m_a2 * m_y2R;

        // Update state
        m_y2R = m_y1R;
        m_y1R = (std::abs(w) < 1e-30) ? 0.0 : w;

        float output = static_cast<float>(y);

        if (!std::isfinite(output)) {
            output = 0.0f;
            m_y1R = m_y2R = 0.0;
        }

        return output;
    }
};

/**
 * @brief Bounds-checked audio buffer wrapper
 *
 * Provides safe access to audio buffers with automatic bounds checking
 */
template <typename T>
class SafeAudioBuffer {
public:
    SafeAudioBuffer(T* data, size_t size) : m_data(data), m_size(size) {}

    /**
     * @brief Safe array access with bounds checking
     */
    AudioResult<T&> at(size_t index) noexcept {
        if (index >= m_size) {
            return Nyth::Audio::Constants::AudioError::OUT_OF_RANGE;
        }
        return m_data[index];
    }

    /**
     * @brief Safe const array access
     */
    AudioResult<const T&> at(size_t index) const noexcept {
        if (index >= m_size) {
            return Nyth::Audio::Constants::AudioError::OUT_OF_RANGE;
        }
        return m_data[index];
    }

    /**
     * @brief Get size
     */
    size_t size() const noexcept {
        return m_size;
    }

    /**
     * @brief Get raw pointer (use with caution)
     */
    T* data() noexcept {
        return m_data;
    }
    const T* data() const noexcept {
        return m_data;
    }

    /**
     * @brief Validate entire buffer
     */
    AudioError validate() const noexcept {
        if (!m_data)
            return Nyth::Audio::Constants::AudioError::NULL_POINTER;
        if (m_size == 0)
            return Nyth::Audio::Constants::AudioError::INVALID_SIZE;

        // Check for NaN/Inf in buffer
        for (size_t i = 0; i < m_size; ++i) {
            if (!std::isfinite(m_data[i])) {
                return Nyth::Audio::Constants::AudioError::NAN_DETECTED;
            }
        }

        return Nyth::Audio::Constants::AudioError::OK;
    }

    /**
     * @brief Fill buffer with value
     */
    void fill(T value) noexcept {
        std::fill_n(m_data, m_size, value);
    }

    /**
     * @brief Clear buffer (set to zero)
     */
    void clear() noexcept {
        fill(T(0));
    }

private:
    T* m_data;
    size_t m_size;
};

/**
 * @brief RAII wrapper for safe buffer allocation
 */
template <typename T>
class AlignedAudioBuffer {
public:
    explicit AlignedAudioBuffer(size_t size) : m_size(size) {
        // Allocate aligned memory for SIMD
        m_data = static_cast<T*>(aligned_alloc(64, size * sizeof(T)));
        if (!m_data) {
            throw std::bad_alloc();
        }
        std::fill_n(m_data, size, T(0));
    }

    ~AlignedAudioBuffer() {
        if (m_data) {
            std::free(m_data);
        }
    }

    // Delete copy operations
    AlignedAudioBuffer(const AlignedAudioBuffer&) = delete;
    AlignedAudioBuffer& operator=(const AlignedAudioBuffer&) = delete;

    // Allow move operations
    AlignedAudioBuffer(AlignedAudioBuffer&& other) noexcept : m_data(other.m_data), m_size(other.m_size) {
        other.m_data = nullptr;
        other.m_size = 0;
    }

    AlignedAudioBuffer& operator=(AlignedAudioBuffer&& other) noexcept {
        if (this != &other) {
            if (m_data)
                std::free(m_data);
            m_data = other.m_data;
            m_size = other.m_size;
            other.m_data = nullptr;
            other.m_size = 0;
        }
        return *this;
    }

    T* data() noexcept {
        return m_data;
    }
    const T* data() const noexcept {
        return m_data;
    }
    size_t size() const noexcept {
        return m_size;
    }

    SafeAudioBuffer<T> getSafe() noexcept {
        return SafeAudioBuffer<T>(m_data, m_size);
    }

private:
    T* m_data = nullptr;
    size_t m_size = 0;
};

} // namespace FX
} // namespace Audio
} // namespace Nyth

#endif // NYTH_AUDIO_FX_BIQUADFILTER_SAFE_HPP
