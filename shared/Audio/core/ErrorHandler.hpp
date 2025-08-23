#pragma once

#include "../NativeAudioCoreModule.h"
#include <jsi/jsi.h>
#include <string>
#include <functional>
#include <memory>

namespace AudioFX {

class ErrorHandler {
public:
    using ErrorCallback = std::shared_ptr<facebook::jsi::Function>;
    
    ErrorHandler() = default;
    
    // Configuration
    void setRuntime(facebook::jsi::Runtime* runtime) { m_runtime = runtime; }
    void setErrorCallback(ErrorCallback callback) { m_errorCallback = callback; }
    
    // Error handling methods
    void handleError(NythCoreError error, const std::string& message);
    void handleErrorSilent(NythCoreError error, const std::string& message);
    
    // Validation with error reporting
    bool validateAndReport(bool condition, NythCoreError error, const std::string& message);
    
    // Safe execution with error handling
    template<typename Func>
    bool safeExecute(Func&& func, const std::string& context) {
        try {
            func();
            return true;
        } catch (const std::exception& e) {
            handleError(CORE_ERROR_PROCESSING_FAILED, context + ": " + e.what());
            return false;
        } catch (...) {
            handleError(CORE_ERROR_PROCESSING_FAILED, context + ": Unknown error");
            return false;
        }
    }
    
    template<typename T, typename Func>
    T safeExecuteWithDefault(Func&& func, T defaultValue, const std::string& context) {
        try {
            return func();
        } catch (const std::exception& e) {
            handleError(CORE_ERROR_PROCESSING_FAILED, context + ": " + e.what());
            return defaultValue;
        } catch (...) {
            handleError(CORE_ERROR_PROCESSING_FAILED, context + ": Unknown error");
            return defaultValue;
        }
    }

private:
    facebook::jsi::Runtime* m_runtime = nullptr;
    ErrorCallback m_errorCallback;
};

} // namespace AudioFX