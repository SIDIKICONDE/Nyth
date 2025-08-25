#pragma once

#include <cstdint>
#include <memory>
#include <utility>

namespace Nyth {
namespace Audio {
namespace Constants {

// ============================================================================
// Codes d'erreur et statuts universels pour l'audio
// ============================================================================

// Audio processing error codes (from AudioError system)
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

// Utility functions for AudioError
inline const char* audioErrorToString(AudioError error) noexcept {
    switch (error) {
        case AudioError::OK: return "OK";
        case AudioError::NULL_POINTER: return "Null pointer";
        case AudioError::INVALID_SIZE: return "Invalid size";
        case AudioError::BUFFER_TOO_SMALL: return "Buffer too small";
        case AudioError::BUFFER_TOO_LARGE: return "Buffer too large";
        case AudioError::SIZE_MISMATCH: return "Size mismatch";
        case AudioError::INVALID_PARAMETER: return "Invalid parameter";
        case AudioError::OUT_OF_RANGE: return "Out of range";
        case AudioError::NOT_INITIALIZED: return "Not initialized";
        case AudioError::ALREADY_INITIALIZED: return "Already initialized";
        case AudioError::INVALID_STATE: return "Invalid state";
        case AudioError::EFFECT_DISABLED: return "Effect disabled";
        case AudioError::OUT_OF_MEMORY: return "Out of memory";
        case AudioError::ALLOCATION_FAILED: return "Allocation failed";
        case AudioError::RESOURCE_BUSY: return "Resource busy";
        case AudioError::INVALID_SAMPLE_RATE: return "Invalid sample rate";
        case AudioError::INVALID_CHANNELS: return "Invalid channels";
        case AudioError::INVALID_FREQUENCY: return "Invalid frequency";
        case AudioError::INVALID_Q_FACTOR: return "Invalid Q factor";
        case AudioError::INVALID_GAIN: return "Invalid gain";
        case AudioError::INVALID_THRESHOLD: return "Invalid threshold";
        case AudioError::INVALID_RATIO: return "Invalid ratio";
        case AudioError::INVALID_TIME: return "Invalid time";
        case AudioError::PROCESSING_FAILED: return "Processing failed";
        case AudioError::OVERFLOW_DETECTED: return "Overflow detected";
        case AudioError::UNDERFLOW_DETECTED: return "Underflow detected";
        case AudioError::DENORMAL_DETECTED: return "Denormal detected";
        case AudioError::NAN_DETECTED: return "NaN detected";
        case AudioError::INF_DETECTED: return "Infinity detected";
        case AudioError::LOCK_FAILED: return "Lock failed";
        case AudioError::DEADLOCK_DETECTED: return "Deadlock detected";
        case AudioError::RACE_CONDITION: return "Race condition";
        case AudioError::UNKNOWN: return "Unknown error";
        default: return "Undefined error";
    }
}

inline bool isAudioErrorSuccess(AudioError error) noexcept {
    return error == AudioError::OK;
}

inline bool isAudioErrorCritical(AudioError error) noexcept {
    return static_cast<int32_t>(error) >= 400; // Processing errors and above
}

// ============================================================================
// AudioResult template class (from AudioError system)
// ============================================================================

/**
 * @brief Result type for audio operations
 *
 * Similar to std::expected (C++23) or Result<T,E> in Rust
 * Provides a safe way to return values or errors from audio operations
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

// ============================================================================
// Validation utilities (from AudioError system)
// ============================================================================

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

// JNI (Java Native Interface) error codes
namespace JNI {
    static constexpr int OK = 0;                      // JNI_OK
    static constexpr int ERR = -1;                    // JNI_ERR
    static constexpr int DETACHED = -2;               // JNI_EDETACHED
    static constexpr int VERSION = -3;                // JNI_EVERSION
    static constexpr int NOMEM = -4;                  // JNI_ENOMEM
    static constexpr int EXIST = -5;                  // JNI_EEXIST
    static constexpr int INVAL = -6;                  // JNI_EINVAL
    static constexpr int VERSION_1_6 = 0x00010006;    // JNI_VERSION_1_6
}

// OpenSL ES error codes
namespace OpenSL {
    static constexpr int RESULT_SUCCESS = 0;          // SL_RESULT_SUCCESS
    static constexpr int RESULT_PRECONDITIONS_VIOLATED = 1;
    static constexpr int RESULT_PARAMETER_INVALID = 2;
    static constexpr int RESULT_MEMORY_FAILURE = 3;
    static constexpr int RESULT_RESOURCE_ERROR = 4;
    static constexpr int RESULT_RESOURCE_LOST = 5;
    static constexpr int RESULT_IO_ERROR = 6;
    static constexpr int RESULT_BUFFER_INSUFFICIENT = 7;
    static constexpr int RESULT_CONTENT_CORRUPTED = 8;
    static constexpr int RESULT_CONTENT_UNSUPPORTED = 9;
    static constexpr int RESULT_CONTENT_NOT_FOUND = 10;
    static constexpr int RESULT_PERMISSION_DENIED = 11;
    static constexpr int RESULT_FEATURE_UNSUPPORTED = 12;
    static constexpr int RESULT_INTERNAL_ERROR = 13;
    static constexpr int RESULT_UNKNOWN_ERROR = 14;
    static constexpr int RESULT_OPERATION_ABORTED = 15;
    static constexpr int RESULT_CONTROL_LOST = 16;
}

// AAudio error codes
namespace AAudio {
    static constexpr int OK = 0;                      // AAUDIO_OK
    static constexpr int ERROR_BASE = -900;           // AAUDIO_ERROR_BASE
    static constexpr int ERROR_DISCONNECTED = -900;   // AAUDIO_ERROR_DISCONNECTED
    static constexpr int ERROR_ILLEGAL_ARGUMENT = -901; // AAUDIO_ERROR_ILLEGAL_ARGUMENT
    static constexpr int ERROR_INTERNAL = -902;       // AAUDIO_ERROR_INTERNAL
    static constexpr int ERROR_INVALID_STATE = -903;  // AAUDIO_ERROR_INVALID_STATE
    static constexpr int ERROR_INVALID_HANDLE = -904; // AAUDIO_ERROR_INVALID_HANDLE
    static constexpr int ERROR_UNIMPLEMENTED = -905;  // AAUDIO_ERROR_UNIMPLEMENTED
    static constexpr int ERROR_UNAVAILABLE = -906;    // AAUDIO_ERROR_UNAVAILABLE
    static constexpr int ERROR_NO_FREE_HANDLES = -907; // AAUDIO_ERROR_NO_FREE_HANDLES
    static constexpr int ERROR_NO_MEMORY = -908;      // AAUDIO_ERROR_NO_MEMORY
    static constexpr int ERROR_NULL = -909;           // AAUDIO_ERROR_NULL
    static constexpr int ERROR_TIMEOUT = -910;        // AAUDIO_ERROR_TIMEOUT
    static constexpr int ERROR_WOULD_BLOCK = -911;    // AAUDIO_ERROR_WOULD_BLOCK
    static constexpr int ERROR_INVALID_FORMAT = -912; // AAUDIO_ERROR_INVALID_FORMAT
    static constexpr int ERROR_OUT_OF_RANGE = -913;   // AAUDIO_ERROR_OUT_OF_RANGE
    static constexpr int ERROR_NO_SERVICE = -914;     // AAUDIO_ERROR_NO_SERVICE
    static constexpr int ERROR_INVALID_RATE = -915;   // AAUDIO_ERROR_INVALID_RATE
}

// Oboe result codes
namespace Oboe {
    enum class Result {
        OK = 0,
        ErrorBase = -900,
        ErrorDisconnected = -900,
        ErrorIllegalArgument = -901,
        ErrorInternal = -902,
        ErrorInvalidState = -903,
        ErrorInvalidHandle = -904,
        ErrorUnimplemented = -905,
        ErrorUnavailable = -906,
        ErrorNoFreeHandles = -907,
        ErrorNoMemory = -908,
        ErrorNull = -909,
        ErrorTimeout = -910,
        ErrorWouldBlock = -911,
        ErrorInvalidFormat = -912,
        ErrorOutOfRange = -913,
        ErrorNoService = -914,
        ErrorInvalidRate = -915
    };
}

// General Android error handling
namespace Android {
    static constexpr int SUCCESS = 0;
    static constexpr int FALSE = 0;
    static constexpr int TRUE = 1;
    static constexpr int ERROR = -1;
    static constexpr int INVALID_OPERATION = -2;
    static constexpr int BAD_VALUE = -3;
    static constexpr int BAD_TYPE = -4;
    static constexpr int NAME_NOT_FOUND = -5;
    static constexpr int PERMISSION_DENIED = -6;
    static constexpr int NO_MEMORY = -7;
    static constexpr int ALREADY_EXISTS = -8;
    static constexpr int NO_INIT = -9;
    static constexpr int BAD_FILE = -10;
    static constexpr int NO_RESOURCES = -11;
    static constexpr int IO_ERROR = -12;
    static constexpr int WOULD_BLOCK = -13;
    static constexpr int DEAD_OBJECT = -14;
    static constexpr int INVALID_OPERATION_DUPLICATE = -15;
}

// ============================================================================
// Fonctions utilitaires pour la gestion des erreurs
// ============================================================================

namespace ErrorUtils {

// Fonction pour convertir un code d'erreur en message lisible
inline const char* getErrorMessage(int errorCode) {
    switch (errorCode) {
        // JNI errors
        case JNI::OK: return "JNI_OK";
        case JNI::ERR: return "JNI_ERR";
        case JNI::DETACHED: return "JNI_EDETACHED";
        case JNI::VERSION: return "JNI_EVERSION";
        case JNI::NOMEM: return "JNI_ENOMEM";
        case JNI::EXIST: return "JNI_EEXIST";
        case JNI::INVAL: return "JNI_EINVAL";

        // OpenSL errors
        case OpenSL::RESULT_SUCCESS: return "SL_RESULT_SUCCESS";
        case OpenSL::RESULT_PRECONDITIONS_VIOLATED: return "SL_RESULT_PRECONDITIONS_VIOLATED";
        case OpenSL::RESULT_PARAMETER_INVALID: return "SL_RESULT_PARAMETER_INVALID";
        case OpenSL::RESULT_MEMORY_FAILURE: return "SL_RESULT_MEMORY_FAILURE";
        case OpenSL::RESULT_RESOURCE_ERROR: return "SL_RESULT_RESOURCE_ERROR";
        case OpenSL::RESULT_RESOURCE_LOST: return "SL_RESULT_RESOURCE_LOST";
        case OpenSL::RESULT_IO_ERROR: return "SL_RESULT_IO_ERROR";
        case OpenSL::RESULT_BUFFER_INSUFFICIENT: return "SL_RESULT_BUFFER_INSUFFICIENT";
        case OpenSL::RESULT_CONTENT_CORRUPTED: return "SL_RESULT_CONTENT_CORRUPTED";
        case OpenSL::RESULT_CONTENT_UNSUPPORTED: return "SL_RESULT_CONTENT_UNSUPPORTED";
        case OpenSL::RESULT_CONTENT_NOT_FOUND: return "SL_RESULT_CONTENT_NOT_FOUND";
        case OpenSL::RESULT_PERMISSION_DENIED: return "SL_RESULT_PERMISSION_DENIED";
        case OpenSL::RESULT_FEATURE_UNSUPPORTED: return "SL_RESULT_FEATURE_UNSUPPORTED";
        case OpenSL::RESULT_INTERNAL_ERROR: return "SL_RESULT_INTERNAL_ERROR";
        case OpenSL::RESULT_UNKNOWN_ERROR: return "SL_RESULT_UNKNOWN_ERROR";
        case OpenSL::RESULT_OPERATION_ABORTED: return "SL_RESULT_OPERATION_ABORTED";
        case OpenSL::RESULT_CONTROL_LOST: return "SL_RESULT_CONTROL_LOST";

        // AAudio errors
        case AAudio::OK: return "AAUDIO_OK";
        case AAudio::ERROR_DISCONNECTED: return "AAUDIO_ERROR_DISCONNECTED";
        case AAudio::ERROR_ILLEGAL_ARGUMENT: return "AAUDIO_ERROR_ILLEGAL_ARGUMENT";
        case AAudio::ERROR_INTERNAL: return "AAUDIO_ERROR_INTERNAL";
        case AAudio::ERROR_INVALID_STATE: return "AAUDIO_ERROR_INVALID_STATE";
        case AAudio::ERROR_INVALID_HANDLE: return "AAUDIO_ERROR_INVALID_HANDLE";
        case AAudio::ERROR_UNIMPLEMENTED: return "AAUDIO_ERROR_UNIMPLEMENTED";
        case AAudio::ERROR_UNAVAILABLE: return "AAUDIO_ERROR_UNAVAILABLE";
        case AAudio::ERROR_NO_FREE_HANDLES: return "AAUDIO_ERROR_NO_FREE_HANDLES";
        case AAudio::ERROR_NO_MEMORY: return "AAUDIO_ERROR_NO_MEMORY";
        case AAudio::ERROR_NULL: return "AAUDIO_ERROR_NULL";
        case AAudio::ERROR_TIMEOUT: return "AAUDIO_ERROR_TIMEOUT";
        case AAudio::ERROR_WOULD_BLOCK: return "AAUDIO_ERROR_WOULD_BLOCK";
        case AAudio::ERROR_INVALID_FORMAT: return "AAUDIO_ERROR_INVALID_FORMAT";
        case AAudio::ERROR_OUT_OF_RANGE: return "AAUDIO_ERROR_OUT_OF_RANGE";
        case AAudio::ERROR_NO_SERVICE: return "AAUDIO_ERROR_NO_SERVICE";
        case AAudio::ERROR_INVALID_RATE: return "AAUDIO_ERROR_INVALID_RATE";

        // Android general errors
        case Android::SUCCESS: return "ANDROID_SUCCESS";
        case Android::ERROR: return "ANDROID_ERROR";
        case Android::INVALID_OPERATION: return "ANDROID_INVALID_OPERATION";
        case Android::BAD_VALUE: return "ANDROID_BAD_VALUE";
        case Android::BAD_TYPE: return "ANDROID_BAD_TYPE";
        case Android::NAME_NOT_FOUND: return "ANDROID_NAME_NOT_FOUND";
        case Android::PERMISSION_DENIED: return "ANDROID_PERMISSION_DENIED";
        case Android::NO_MEMORY: return "ANDROID_NO_MEMORY";
        case Android::ALREADY_EXISTS: return "ANDROID_ALREADY_EXISTS";
        case Android::NO_INIT: return "ANDROID_NO_INIT";
        case Android::BAD_FILE: return "ANDROID_BAD_FILE";
        case Android::NO_RESOURCES: return "ANDROID_NO_RESOURCES";
        case Android::IO_ERROR: return "ANDROID_IO_ERROR";
        case Android::WOULD_BLOCK: return "ANDROID_WOULD_BLOCK";
        case Android::DEAD_OBJECT: return "ANDROID_DEAD_OBJECT";

        default: return "UNKNOWN_ERROR_CODE";
    }
}

// Fonction pour vérifier si un code d'erreur indique un succès
inline bool isSuccess(int errorCode) {
    return errorCode == JNI::OK ||
           errorCode == OpenSL::RESULT_SUCCESS ||
           errorCode == AAudio::OK ||
           errorCode == Android::SUCCESS;
}

// Fonction pour vérifier si un code d'erreur indique une erreur critique
inline bool isCriticalError(int errorCode) {
    return errorCode == AAudio::ERROR_DISCONNECTED ||
           errorCode == AAudio::ERROR_INTERNAL ||
           errorCode == AAudio::ERROR_NO_MEMORY ||
           errorCode == Android::NO_MEMORY ||
           errorCode == Android::DEAD_OBJECT;
}

} // namespace ErrorUtils

} // namespace Constants
} // namespace Audio
} // namespace Nyth
