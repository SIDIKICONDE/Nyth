#pragma once
#ifndef NYTH_AUDIO_ERROR_CODES_HPP
#define NYTH_AUDIO_ERROR_CODES_HPP

#include <cstdint>
#include <cmath>
#include <cstddef>

namespace Nyth {
namespace Audio {
namespace Constants {

/**
 * @brief Error codes for audio operations
 */
enum class AudioError : int32_t {
    OK = 0,
    NULL_POINTER = -1,
    INVALID_PARAMETER = -2,
    INVALID_SIZE = -3,
    OUT_OF_RANGE = -4,
    NAN_DETECTED = -5,
    INF_DETECTED = -6,
    BUFFER_OVERFLOW = -7,
    BUFFER_UNDERFLOW = -8,
    INVALID_SAMPLE_RATE = -9,
    INVALID_FREQUENCY = -10,
    INVALID_Q = -11,
    PROCESSING_FAILED = -12,
    RESOURCE_BUSY = -13,
    NOT_IMPLEMENTED = -14,
    UNSUPPORTED_FORMAT = -15
};

/**
 * @brief Result wrapper for audio operations
 */
template<typename T>
struct AudioResult {
    AudioError error;
    T value;
    
    AudioResult(AudioError err) : error(err), value{} {}
    AudioResult(T val) : error(AudioError::OK), value(val) {}
    
    bool isOk() const { return error == AudioError::OK; }
    operator bool() const { return isOk(); }
};

/**
 * @brief Audio validation utilities
 */
struct AudioValidator {
    /**
     * @brief Validate buffer pointer and size
     */
    static AudioError validateBuffer(const float* buffer, size_t size) noexcept {
        if (!buffer) return AudioError::NULL_POINTER;
        if (size == 0) return AudioError::INVALID_SIZE;
        return AudioError::OK;
    }
    
    /**
     * @brief Validate finite value
     */
    static AudioError validateFinite(double value) noexcept {
        if (!std::isfinite(value)) {
            return std::isnan(value) ? AudioError::NAN_DETECTED : AudioError::INF_DETECTED;
        }
        return AudioError::OK;
    }
    
    /**
     * @brief Validate sample rate
     */
    static AudioError validateSampleRate(uint32_t sampleRate) noexcept {
        if (sampleRate < 8000 || sampleRate > 192000) {
            return AudioError::INVALID_SAMPLE_RATE;
        }
        return AudioError::OK;
    }
    
    /**
     * @brief Validate frequency
     */
    static AudioError validateFrequency(double frequency, double sampleRate) noexcept {
        if (frequency <= 0.0 || frequency >= sampleRate / 2.0) {
            return AudioError::INVALID_FREQUENCY;
        }
        return AudioError::OK;
    }
    
    /**
     * @brief Validate Q factor
     */
    static AudioError validateQ(double q) noexcept {
        if (q <= 0.0 || !std::isfinite(q)) {
            return AudioError::INVALID_Q;
        }
        return AudioError::OK;
    }
};

} // namespace Constants
} // namespace Audio
} // namespace Nyth

// Macro pour simplifier la gestion d'erreur
#define AUDIO_RETURN_IF_ERROR(expr) \
    do { \
        auto audio_result = (expr); \
        if (audio_result != Nyth::Audio::Constants::AudioError::OK) { \
            return audio_result; \
        } \
    } while(0)

#endif // NYTH_AUDIO_ERROR_CODES_HPP
