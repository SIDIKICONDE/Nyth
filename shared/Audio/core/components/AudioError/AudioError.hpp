#pragma once
#ifndef AUDIOFX_AUDIO_ERROR_HPP
#define AUDIOFX_AUDIO_ERROR_HPP

#include <cstdint>
#include <memory>
#include <utility>
#include <cmath>


namespace AudioFX {

/**
 * @brief Error codes for audio processing operations
 *
 * Using error codes instead of exceptions for real-time safety.
 * Based on POSIX error model and industry best practices.
 */
enum class AudioError : int32_t {
    // Success
    OK = 0,

    // Input validation errors (1-99)
    NULL_POINTER = 1,
    INVALID_SIZE = 2,
    BUFFER_TOO_SMALL = 3,
    BUFFER_TOO_LARGE = 4,
    SIZE_MISMATCH = 5,
    INVALID_PARAMETER = 6,
    OUT_OF_RANGE = 7,

    // State errors (100-199)
    NOT_INITIALIZED = 100,
    ALREADY_INITIALIZED = 101,
    INVALID_STATE = 102,
    EFFECT_DISABLED = 103,

    // Resource errors (200-299)
    OUT_OF_MEMORY = 200,
    ALLOCATION_FAILED = 201,
    RESOURCE_BUSY = 202,

    // Configuration errors (300-399)
    INVALID_SAMPLE_RATE = 300,
    INVALID_CHANNELS = 301,
    INVALID_FREQUENCY = 302,
    INVALID_Q_FACTOR = 303,
    INVALID_GAIN = 304,
    INVALID_THRESHOLD = 305,
    INVALID_RATIO = 306,
    INVALID_TIME = 307,

    // Processing errors (400-499)
    PROCESSING_FAILED = 400,
    OVERFLOW_DETECTED = 401,
    UNDERFLOW_DETECTED = 402,
    DENORMAL_DETECTED = 403,
    NAN_DETECTED = 404,
    INF_DETECTED = 405,

    // Thread safety errors (500-599)
    LOCK_FAILED = 500,
    DEADLOCK_DETECTED = 501,
    RACE_CONDITION = 502,

    // Unknown error
    UNKNOWN = -1
};

/**
 * @brief Result type for audio operations
 *
 * Similar to std::expected (C++23) or Result<T,E> in Rust
 */
template <typename T>
class AudioResult {
public:
    // Constructors
    AudioResult(T value) : m_value(std::make_unique<T>(std::move(value))), m_error(AudioError::OK) {}
    AudioResult(AudioError error) : m_error(error) {}

    // Check if operation succeeded
    bool isOk() const noexcept {
        return m_error == AudioError::OK;
    }
    bool hasError() const noexcept {
        return m_error != AudioError::OK;
    }
    explicit operator bool() const noexcept {
        return isOk();
    }

    // Access value (only if OK)
    T& value() & {
        return *m_value;
    }
    const T& value() const& {
        return *m_value;
    }
    T&& value() && {
        return std::move(*m_value);
    }

    // Access value with default
    T valueOr(T defaultValue) const {
        return isOk() ? *m_value : defaultValue;
    }

    // Access error
    AudioError error() const noexcept {
        return m_error;
    }

    // Monadic operations
    template <typename F>
    auto map(F&& f) -> AudioResult<decltype(f(std::declval<T>()))> {
        using U = decltype(f(std::declval<T>()));
        if (isOk()) {
            return AudioResult<U>(f(*m_value));
        }
        return AudioResult<U>(m_error);
    }

    template <typename F>
    auto andThen(F&& f) -> decltype(f(std::declval<T>())) {
        using U = decltype(f(std::declval<T>()));
        if (isOk()) {
            return f(*m_value);
        }
        return U(m_error);
    }

private:
    std::unique_ptr<T> m_value;
    AudioError m_error;
};

// Specialization for void
template <>
class AudioResult<void> {
public:
    AudioResult() : m_error(AudioError::OK) {}
    AudioResult(AudioError error) : m_error(error) {}

    bool isOk() const noexcept {
        return m_error == AudioError::OK;
    }
    bool hasError() const noexcept {
        return m_error != AudioError::OK;
    }
    explicit operator bool() const noexcept {
        return isOk();
    }

    AudioError error() const noexcept {
        return m_error;
    }

private:
    AudioError m_error;
};

// Convenience type aliases
using VoidResult = AudioResult<void>;
using FloatResult = AudioResult<float>;
using SizeResult = AudioResult<size_t>;

/**
 * @brief Convert error code to string for debugging
 * Note: This should NOT be used in real-time context
 */
inline const char* audioErrorToString(AudioError error) noexcept {
    switch (error) {
        case AudioError::OK:
            return "OK";
        case AudioError::NULL_POINTER:
            return "Null pointer";
        case AudioError::INVALID_SIZE:
            return "Invalid size";
        case AudioError::BUFFER_TOO_SMALL:
            return "Buffer too small";
        case AudioError::BUFFER_TOO_LARGE:
            return "Buffer too large";
        case AudioError::SIZE_MISMATCH:
            return "Size mismatch";
        case AudioError::INVALID_PARAMETER:
            return "Invalid parameter";
        case AudioError::OUT_OF_RANGE:
            return "Out of range";
        case AudioError::NOT_INITIALIZED:
            return "Not initialized";
        case AudioError::ALREADY_INITIALIZED:
            return "Already initialized";
        case AudioError::INVALID_STATE:
            return "Invalid state";
        case AudioError::EFFECT_DISABLED:
            return "Effect disabled";
        case AudioError::OUT_OF_MEMORY:
            return "Out of memory";
        case AudioError::ALLOCATION_FAILED:
            return "Allocation failed";
        case AudioError::RESOURCE_BUSY:
            return "Resource busy";
        case AudioError::INVALID_SAMPLE_RATE:
            return "Invalid sample rate";
        case AudioError::INVALID_CHANNELS:
            return "Invalid channels";
        case AudioError::INVALID_FREQUENCY:
            return "Invalid frequency";
        case AudioError::INVALID_Q_FACTOR:
            return "Invalid Q factor";
        case AudioError::INVALID_GAIN:
            return "Invalid gain";
        case AudioError::INVALID_THRESHOLD:
            return "Invalid threshold";
        case AudioError::INVALID_RATIO:
            return "Invalid ratio";
        case AudioError::INVALID_TIME:
            return "Invalid time";
        case AudioError::PROCESSING_FAILED:
            return "Processing failed";
        case AudioError::OVERFLOW_DETECTED:
            return "Overflow detected";
        case AudioError::UNDERFLOW_DETECTED:
            return "Underflow detected";
        case AudioError::DENORMAL_DETECTED:
            return "Denormal detected";
        case AudioError::NAN_DETECTED:
            return "NaN detected";
        case AudioError::INF_DETECTED:
            return "Infinity detected";
        case AudioError::LOCK_FAILED:
            return "Lock failed";
        case AudioError::DEADLOCK_DETECTED:
            return "Deadlock detected";
        case AudioError::RACE_CONDITION:
            return "Race condition";
        case AudioError::UNKNOWN:
            return "Unknown error";
        default:
            return "Undefined error";
    }
}

/**
 * @brief Validation helpers with error codes
 */
class AudioValidator {
public:
    // Pointer validation
    template <typename T>
    static AudioError validatePointer(const T* ptr) noexcept {
        return ptr ? AudioError::OK : AudioError::NULL_POINTER;
    }

    // Buffer validation
    template <typename T>
    static AudioError validateBuffer(const T* buffer, size_t size) noexcept {
        if (!buffer && size > 0)
            return AudioError::NULL_POINTER;
        if (size == 0)
            return AudioError::INVALID_SIZE;
        if (size > 1024 * 1024 * 100)
            return AudioError::BUFFER_TOO_LARGE; // 100MB limit
        return AudioError::OK;
    }

    // Range validation
    template <typename T>
    static AudioError validateRange(T value, T min, T max) noexcept {
        if (value < min || value > max)
            return AudioError::OUT_OF_RANGE;
        return AudioError::OK;
    }

    // Sample rate validation
    static AudioError validateSampleRate(uint32_t sampleRate) noexcept {
        if (sampleRate < 8000 || sampleRate > 192000) {
            return AudioError::INVALID_SAMPLE_RATE;
        }
        return AudioError::OK;
    }

    // Channel count validation
    static AudioError validateChannels(int channels) noexcept {
        if (channels < 1 || channels > 32) {
            return AudioError::INVALID_CHANNELS;
        }
        return AudioError::OK;
    }

    // Frequency validation
    static AudioError validateFrequency(double freq, double sampleRate) noexcept {
        if (freq <= 0 || freq >= sampleRate / 2) {
            return AudioError::INVALID_FREQUENCY;
        }
        return AudioError::OK;
    }

    // Q factor validation
    static AudioError validateQ(double q) noexcept {
        if (q <= 0.01 || q > 100) {
            return AudioError::INVALID_Q_FACTOR;
        }
        return AudioError::OK;
    }

    // Check for NaN/Inf
    template <typename T>
    static AudioError validateFinite(T value) noexcept {
        if (std::isnan(value))
            return AudioError::NAN_DETECTED;
        if (std::isinf(value))
            return AudioError::INF_DETECTED;
        return AudioError::OK;
    }
};

// Macro helpers for early return on error (optional)
#define AUDIO_RETURN_IF_ERROR(expr) \
    do {                            \
        AudioError _err = (expr);   \
        if (_err != AudioError::OK) \
            return _err;            \
    } while (0)

#define AUDIO_RETURN_RESULT_IF_ERROR(expr)  \
    do {                                    \
        AudioError _err = (expr);           \
        if (_err != AudioError::OK)         \
            return AudioResult<void>(_err); \
    } while (0)

} // namespace AudioFX

#endif // AUDIOFX_AUDIO_ERROR_HPP
