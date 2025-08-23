#include "ErrorHandler.hpp"
#include "JSIConverters.hpp"

namespace AudioFX {

void ErrorHandler::handleError(NythCoreError error, const std::string& message) {
    if (m_errorCallback && m_runtime) {
        try {
            facebook::jsi::Runtime& rt = *m_runtime;
            facebook::jsi::String errorStr = facebook::jsi::String::createFromUtf8(rt, message);
            facebook::jsi::String errorTypeStr = facebook::jsi::String::createFromUtf8(rt, 
                facebook::react::JSIConverters::errorToString(error));

            facebook::jsi::Object errorObj(rt);
            errorObj.setProperty(rt, "type", errorTypeStr);
            errorObj.setProperty(rt, "message", errorStr);
            errorObj.setProperty(rt, "code", facebook::jsi::Value(static_cast<int>(error)));

            m_errorCallback->call(rt, errorObj);
        } catch (...) {
            // Silently fail if callback invocation fails
        }
    }
}

void ErrorHandler::handleErrorSilent(NythCoreError error, const std::string& message) {
    // Log error without calling JS callback
    // In a real implementation, this could log to a file or system logger
}

bool ErrorHandler::validateAndReport(bool condition, NythCoreError error, const std::string& message) {
    if (!condition) {
        handleError(error, message);
        return false;
    }
    return true;
}

} // namespace AudioFX