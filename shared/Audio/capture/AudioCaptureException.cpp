#include "AudioCaptureException.hpp"
#include <sstream>
#include <cstring>

namespace Audio {
namespace capture {

// ============================================================================
// AudioException Implementation
// ============================================================================

AudioException::AudioException(const std::string& message, ErrorCode code)
    : std::runtime_error(formatMessage(message, code))
    , message_(message)
    , code_(code)
    , timestamp_(std::chrono::steady_clock::now()) {
}

AudioException::AudioException(const std::string& message, ErrorCode code, 
                               const std::string& details)
    : std::runtime_error(formatMessage(message, code, details))
    , message_(message)
    , code_(code)
    , details_(details)
    , timestamp_(std::chrono::steady_clock::now()) {
}

AudioException::~AudioException() noexcept {
    // Destructor
}

const char* AudioException::what() const noexcept {
    return std::runtime_error::what();
}

ErrorCode AudioException::getErrorCode() const noexcept {
    return code_;
}

std::string AudioException::getMessage() const {
    return message_;
}

std::string AudioException::getDetails() const {
    return details_;
}

std::chrono::steady_clock::time_point AudioException::getTimestamp() const {
    return timestamp_;
}

std::string AudioException::getFullDescription() const {
    std::stringstream ss;
    ss << "AudioException: " << message_;
    ss << " [Code: " << errorCodeToString(code_) << "]";
    if (!details_.empty()) {
        ss << " - Details: " << details_;
    }
    return ss.str();
}

std::string AudioException::formatMessage(const std::string& message, ErrorCode code) {
    std::stringstream ss;
    ss << "[" << errorCodeToString(code) << "] " << message;
    return ss.str();
}

std::string AudioException::formatMessage(const std::string& message, ErrorCode code,
                                         const std::string& details) {
    std::stringstream ss;
    ss << "[" << errorCodeToString(code) << "] " << message;
    if (!details.empty()) {
        ss << " - " << details;
    }
    return ss.str();
}

// ============================================================================
// Specialized Exception Classes
// ============================================================================

InitializationException::InitializationException(const std::string& message)
    : AudioException(message, ErrorCode::InitializationFailed) {
}

InitializationException::InitializationException(const std::string& message, 
                                                 const std::string& details)
    : AudioException(message, ErrorCode::InitializationFailed, details) {
}

DeviceException::DeviceException(const std::string& message)
    : AudioException(message, ErrorCode::DeviceNotFound) {
}

DeviceException::DeviceException(const std::string& message, const std::string& deviceId)
    : AudioException(message, ErrorCode::DeviceNotFound, "Device: " + deviceId) {
}

PermissionException::PermissionException(const std::string& message)
    : AudioException(message, ErrorCode::PermissionDenied) {
}

BufferException::BufferException(const std::string& message, BufferError error)
    : AudioException(message, 
                    error == BufferError::Underrun ? ErrorCode::BufferUnderrun : 
                    ErrorCode::BufferOverrun)
    , bufferError_(error) {
}

FormatException::FormatException(const std::string& message)
    : AudioException(message, ErrorCode::UnsupportedFormat) {
}

FormatException::FormatException(const std::string& message, int sampleRate, 
                                 int channelCount, int bitsPerSample)
    : AudioException(message, ErrorCode::UnsupportedFormat, 
                    formatDetails(sampleRate, channelCount, bitsPerSample)) {
}

std::string FormatException::formatDetails(int sampleRate, int channelCount, 
                                          int bitsPerSample) {
    std::stringstream ss;
    ss << "Format: " << sampleRate << "Hz, ";
    ss << channelCount << " channel(s), ";
    ss << bitsPerSample << " bits";
    return ss.str();
}

StateException::StateException(const std::string& message, const std::string& currentState,
                               const std::string& expectedState)
    : AudioException(message, ErrorCode::InvalidState,
                    "Current: " + currentState + ", Expected: " + expectedState) {
}

TimeoutException::TimeoutException(const std::string& message, int timeoutMs)
    : AudioException(message, ErrorCode::Timeout, 
                    "Timeout: " + std::to_string(timeoutMs) + "ms") {
}

// ============================================================================
// Error Code Utilities
// ============================================================================

std::string errorCodeToString(ErrorCode code) {
    switch (code) {
        case ErrorCode::None:
            return "None";
        case ErrorCode::Unknown:
            return "Unknown";
        case ErrorCode::InitializationFailed:
            return "InitializationFailed";
        case ErrorCode::DeviceNotFound:
            return "DeviceNotFound";
        case ErrorCode::DeviceInUse:
            return "DeviceInUse";
        case ErrorCode::PermissionDenied:
            return "PermissionDenied";
        case ErrorCode::UnsupportedFormat:
            return "UnsupportedFormat";
        case ErrorCode::BufferOverrun:
            return "BufferOverrun";
        case ErrorCode::BufferUnderrun:
            return "BufferUnderrun";
        case ErrorCode::InvalidParameter:
            return "InvalidParameter";
        case ErrorCode::InvalidState:
            return "InvalidState";
        case ErrorCode::OutOfMemory:
            return "OutOfMemory";
        case ErrorCode::Timeout:
            return "Timeout";
        case ErrorCode::SystemError:
            return "SystemError";
        case ErrorCode::NotSupported:
            return "NotSupported";
        default:
            return "Unknown(" + std::to_string(static_cast<int>(code)) + ")";
    }
}

ErrorCode stringToErrorCode(const std::string& str) {
    if (str == "None") return ErrorCode::None;
    if (str == "Unknown") return ErrorCode::Unknown;
    if (str == "InitializationFailed") return ErrorCode::InitializationFailed;
    if (str == "DeviceNotFound") return ErrorCode::DeviceNotFound;
    if (str == "DeviceInUse") return ErrorCode::DeviceInUse;
    if (str == "PermissionDenied") return ErrorCode::PermissionDenied;
    if (str == "UnsupportedFormat") return ErrorCode::UnsupportedFormat;
    if (str == "BufferOverrun") return ErrorCode::BufferOverrun;
    if (str == "BufferUnderrun") return ErrorCode::BufferUnderrun;
    if (str == "InvalidParameter") return ErrorCode::InvalidParameter;
    if (str == "InvalidState") return ErrorCode::InvalidState;
    if (str == "OutOfMemory") return ErrorCode::OutOfMemory;
    if (str == "Timeout") return ErrorCode::Timeout;
    if (str == "SystemError") return ErrorCode::SystemError;
    if (str == "NotSupported") return ErrorCode::NotSupported;
    return ErrorCode::Unknown;
}

// ============================================================================
// ErrorHandler Implementation
// ============================================================================

ErrorHandler::ErrorHandler()
    : maxHistorySize_(100)
    , errorCallback_(nullptr) {
}

ErrorHandler::~ErrorHandler() {
    // Destructor
}

void ErrorHandler::handleError(const AudioException& exception) {
    ErrorInfo info;
    info.code = exception.getErrorCode();
    info.message = exception.getMessage();
    info.details = exception.getDetails();
    info.timestamp = exception.getTimestamp();
    
    addToHistory(info);
    
    // Call error callback if set
    if (errorCallback_) {
        errorCallback_(info);
    }
}

void ErrorHandler::handleError(ErrorCode code, const std::string& message) {
    ErrorInfo info;
    info.code = code;
    info.message = message;
    info.timestamp = std::chrono::steady_clock::now();
    
    addToHistory(info);
    
    // Call error callback if set
    if (errorCallback_) {
        errorCallback_(info);
    }
}

void ErrorHandler::handleError(ErrorCode code, const std::string& message,
                               const std::string& details) {
    ErrorInfo info;
    info.code = code;
    info.message = message;
    info.details = details;
    info.timestamp = std::chrono::steady_clock::now();
    
    addToHistory(info);
    
    // Call error callback if set
    if (errorCallback_) {
        errorCallback_(info);
    }
}

void ErrorHandler::setErrorCallback(ErrorCallback callback) {
    std::lock_guard<std::mutex> lock(mutex_);
    errorCallback_ = callback;
}

void ErrorHandler::clearErrorCallback() {
    std::lock_guard<std::mutex> lock(mutex_);
    errorCallback_ = nullptr;
}

std::vector<ErrorInfo> ErrorHandler::getErrorHistory(size_t maxCount) const {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (maxCount == 0 || maxCount >= errorHistory_.size()) {
        return errorHistory_;
    }
    
    // Return last maxCount errors
    return std::vector<ErrorInfo>(
        errorHistory_.end() - maxCount,
        errorHistory_.end()
    );
}

void ErrorHandler::clearErrorHistory() {
    std::lock_guard<std::mutex> lock(mutex_);
    errorHistory_.clear();
}

ErrorInfo ErrorHandler::getLastError() const {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (errorHistory_.empty()) {
        ErrorInfo info;
        info.code = ErrorCode::None;
        info.message = "No errors";
        info.timestamp = std::chrono::steady_clock::now();
        return info;
    }
    
    return errorHistory_.back();
}

size_t ErrorHandler::getErrorCount() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return errorHistory_.size();
}

size_t ErrorHandler::getErrorCount(ErrorCode code) const {
    std::lock_guard<std::mutex> lock(mutex_);
    
    size_t count = 0;
    for (const auto& error : errorHistory_) {
        if (error.code == code) {
            count++;
        }
    }
    
    return count;
}

void ErrorHandler::setMaxHistorySize(size_t size) {
    std::lock_guard<std::mutex> lock(mutex_);
    maxHistorySize_ = size;
    
    // Trim history if needed
    while (errorHistory_.size() > maxHistorySize_) {
        errorHistory_.erase(errorHistory_.begin());
    }
}

std::string ErrorHandler::getFormattedErrorReport() const {
    std::lock_guard<std::mutex> lock(mutex_);
    
    std::stringstream ss;
    ss << "=== Error Report ===" << std::endl;
    ss << "Total errors: " << errorHistory_.size() << std::endl;
    
    if (!errorHistory_.empty()) {
        ss << std::endl << "Error breakdown:" << std::endl;
        
        // Count errors by type
        std::map<ErrorCode, size_t> errorCounts;
        for (const auto& error : errorHistory_) {
            errorCounts[error.code]++;
        }
        
        for (const auto& pair : errorCounts) {
            ss << "  " << errorCodeToString(pair.first) << ": " << pair.second << std::endl;
        }
        
        ss << std::endl << "Last 5 errors:" << std::endl;
        size_t startIdx = errorHistory_.size() > 5 ? errorHistory_.size() - 5 : 0;
        
        for (size_t i = startIdx; i < errorHistory_.size(); ++i) {
            const auto& error = errorHistory_[i];
            auto duration = std::chrono::steady_clock::now() - error.timestamp;
            auto seconds = std::chrono::duration_cast<std::chrono::seconds>(duration).count();
            
            ss << "  [" << seconds << "s ago] ";
            ss << errorCodeToString(error.code) << ": " << error.message;
            if (!error.details.empty()) {
                ss << " (" << error.details << ")";
            }
            ss << std::endl;
        }
    } else {
        ss << "No errors recorded" << std::endl;
    }
    
    return ss.str();
}

void ErrorHandler::addToHistory(const ErrorInfo& info) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    errorHistory_.push_back(info);
    
    // Trim history if it exceeds max size
    while (errorHistory_.size() > maxHistorySize_) {
        errorHistory_.erase(errorHistory_.begin());
    }
}

// ============================================================================
// Platform-specific error translation
// ============================================================================

#ifdef __ANDROID__

std::string translateAndroidError(int errorCode) {
    // Translate Android-specific audio error codes
    switch (errorCode) {
        case 0: // AAUDIO_OK
            return "Success";
        case -899: // AAUDIO_ERROR_DISCONNECTED
            return "Audio device disconnected";
        case -900: // AAUDIO_ERROR_ILLEGAL_ARGUMENT
            return "Illegal argument";
        case -902: // AAUDIO_ERROR_INTERNAL
            return "Internal error";
        case -903: // AAUDIO_ERROR_INVALID_STATE
            return "Invalid state";
        case -904: // AAUDIO_ERROR_INVALID_HANDLE
            return "Invalid handle";
        case -905: // AAUDIO_ERROR_UNIMPLEMENTED
            return "Unimplemented";
        case -906: // AAUDIO_ERROR_UNAVAILABLE
            return "Unavailable";
        case -907: // AAUDIO_ERROR_NO_FREE_HANDLES
            return "No free handles";
        case -908: // AAUDIO_ERROR_NO_MEMORY
            return "Out of memory";
        case -909: // AAUDIO_ERROR_NULL
            return "Null pointer";
        case -910: // AAUDIO_ERROR_TIMEOUT
            return "Timeout";
        case -911: // AAUDIO_ERROR_WOULD_BLOCK
            return "Would block";
        case -912: // AAUDIO_ERROR_INVALID_FORMAT
            return "Invalid format";
        case -913: // AAUDIO_ERROR_OUT_OF_RANGE
            return "Out of range";
        case -914: // AAUDIO_ERROR_NO_SERVICE
            return "No service";
        case -915: // AAUDIO_ERROR_INVALID_RATE
            return "Invalid rate";
        default:
            return "Unknown Android error: " + std::to_string(errorCode);
    }
}

#endif // __ANDROID__

#ifdef __APPLE__

std::string translateIOSError(OSStatus status) {
    // Translate iOS/macOS Core Audio error codes
    switch (status) {
        case noErr:
            return "Success";
        case kAudioUnitErr_InvalidProperty:
            return "Invalid property";
        case kAudioUnitErr_InvalidParameter:
            return "Invalid parameter";
        case kAudioUnitErr_InvalidElement:
            return "Invalid element";
        case kAudioUnitErr_NoConnection:
            return "No connection";
        case kAudioUnitErr_FailedInitialization:
            return "Failed initialization";
        case kAudioUnitErr_TooManyFramesToProcess:
            return "Too many frames to process";
        case kAudioUnitErr_InvalidFile:
            return "Invalid file";
        case kAudioUnitErr_FormatNotSupported:
            return "Format not supported";
        case kAudioUnitErr_Uninitialized:
            return "Uninitialized";
        case kAudioUnitErr_InvalidScope:
            return "Invalid scope";
        case kAudioUnitErr_PropertyNotWritable:
            return "Property not writable";
        case kAudioUnitErr_CannotDoInCurrentContext:
            return "Cannot do in current context";
        case kAudioUnitErr_InvalidPropertyValue:
            return "Invalid property value";
        case kAudioUnitErr_PropertyNotInUse:
            return "Property not in use";
        case kAudioUnitErr_Initialized:
            return "Already initialized";
        case kAudioUnitErr_InvalidOfflineRender:
            return "Invalid offline render";
        case kAudioUnitErr_Unauthorized:
            return "Unauthorized";
        default:
            return "Unknown iOS error: " + std::to_string(status);
    }
}

#endif // __APPLE__

} // namespace capture
} // namespace Audio