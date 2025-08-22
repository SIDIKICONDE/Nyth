#pragma once

#include <chrono>
#include <exception>
#include <string>


namespace Nyth {
namespace Audio {

// Types d'erreurs audio
enum class AudioErrorType {
    InvalidConfiguration,
    DeviceNotFound,
    PermissionDenied,
    BufferOverflow,
    BufferUnderflow,
    SystemError,
    ResourceExhausted,
    FormatNotSupported,
    DeviceDisconnected,
    UnknownError
};

// Exception de base pour le module audio
class AudioException : public std::exception {
protected:
    AudioErrorType type_;
    std::string message_;
    std::string details_;
    std::chrono::system_clock::time_point timestamp_;
    int errorCode_;

public:
    AudioException(AudioErrorType type, const std::string& message, int errorCode = 0)
        : type_(type), message_(message), errorCode_(errorCode) {
        timestamp_ = std::chrono::system_clock::now();
    }

    AudioException(AudioErrorType type, const std::string& message, const std::string& details, int errorCode = 0)
        : type_(type), message_(message), details_(details), errorCode_(errorCode) {
        timestamp_ = std::chrono::system_clock::now();
    }

    const char* what() const noexcept override {
        return message_.c_str();
    }

    AudioErrorType getType() const {
        return type_;
    }
    const std::string& getDetails() const {
        return details_;
    }
    int getErrorCode() const {
        return errorCode_;
    }
    auto getTimestamp() const {
        return timestamp_;
    }

    std::string getFullDescription() const {
        std::string desc = "AudioException: " + message_;
        if (!details_.empty()) {
            desc += " | Details: " + details_;
        }
        if (errorCode_ != 0) {
            desc += " | Code: " + std::to_string(errorCode_);
        }
        return desc;
    }
};

// Exceptions spécifiques
class InvalidConfigurationException : public AudioException {
public:
    InvalidConfigurationException(const std::string& message)
        : AudioException(AudioErrorType::InvalidConfiguration, message) {}
};

class DeviceNotFoundException : public AudioException {
public:
    DeviceNotFoundException(const std::string& deviceId)
        : AudioException(AudioErrorType::DeviceNotFound, "Audio device not found: " + deviceId) {}
};

class PermissionDeniedException : public AudioException {
public:
    PermissionDeniedException()
        : AudioException(AudioErrorType::PermissionDenied, "Audio recording permission denied") {}
};

class BufferOverflowException : public AudioException {
public:
    BufferOverflowException(size_t bufferSize, size_t requestedSize)
        : AudioException(AudioErrorType::BufferOverflow, "Buffer overflow: requested " + std::to_string(requestedSize) +
                                                             " but buffer size is " + std::to_string(bufferSize)) {}
};

// Validateur de configuration
class AudioConfigValidator {
public:
    static void validateSampleRate(int sampleRate) {
        const int validRates[] = {8000, 11025, 16000, 22050, 44100, 48000, 88200, 96000, 176400, 192000};
        bool isValid = false;
        for (int rate : validRates) {
            if (sampleRate == rate) {
                isValid = true;
                break;
            }
        }
        if (!isValid) {
            throw InvalidConfigurationException(
                "Invalid sample rate: " + std::to_string(sampleRate) +
                ". Must be one of: 8000, 11025, 16000, 22050, 44100, 48000, 88200, 96000, 176400, 192000");
        }
    }

    static void validateChannelCount(int channels) {
        if (channels < 1 || channels > 8) {
            throw InvalidConfigurationException("Invalid channel count: " + std::to_string(channels) +
                                                ". Must be between 1 and 8");
        }
    }

    static void validateBitsPerSample(int bits) {
        if (bits != 8 && bits != 16 && bits != 24 && bits != 32) {
            throw InvalidConfigurationException("Invalid bits per sample: " + std::to_string(bits) +
                                                ". Must be 8, 16, 24, or 32");
        }
    }

    static void validateBufferSize(int bufferSize) {
        if (bufferSize < 64 || bufferSize > 8192) {
            throw InvalidConfigurationException("Invalid buffer size: " + std::to_string(bufferSize) +
                                                ". Must be between 64 and 8192 frames");
        }
        // Vérifier que c'est une puissance de 2
        if ((bufferSize & (bufferSize - 1)) != 0) {
            throw InvalidConfigurationException("Buffer size must be a power of 2");
        }
    }

    static void validateConfig(const AudioCaptureConfig& config) {
        validateSampleRate(config.sampleRate);
        validateChannelCount(config.channelCount);
        validateBitsPerSample(config.bitsPerSample);
        validateBufferSize(config.bufferSizeFrames);

        if (config.numBuffers < 2 || config.numBuffers > 10) {
            throw InvalidConfigurationException("Number of buffers must be between 2 and 10");
        }
    }
};

} // namespace Audio
} // namespace Nyth
