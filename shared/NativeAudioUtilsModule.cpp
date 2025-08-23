#include "NativeAudioUtilsModule.h"

#if NYTH_AUDIO_UTILS_ENABLED

#include "Audio/utils/AudioBuffer.hpp"
#include "Audio/utils/utilsConstants.hpp"
#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstring>
#include <sstream>
#include <stdexcept>

namespace facebook {
namespace react {

NativeAudioUtilsModule::~NativeAudioUtilsModule() {
    std::lock_guard<std::mutex> lock(utilsMutex_);
    audioBuffer_.reset();
}

// === Méthodes privées ===

bool NativeAudioUtilsModule::validateBuffer() const {
    return audioBuffer_ != nullptr && audioBuffer_->validateBuffer();
}

bool NativeAudioUtilsModule::validateChannel(size_t channel) const {
    return audioBuffer_ && channel < audioBuffer_->getNumChannels();
}

bool NativeAudioUtilsModule::validateRange(size_t channel, size_t startSample, size_t numSamples) const {
    if (!audioBuffer_ || channel >= audioBuffer_->getNumChannels())
        return false;

    size_t maxSamples = audioBuffer_->getNumSamples();
    return startSample < maxSamples && startSample + numSamples <= maxSamples;
}

NythUtilsError NativeAudioUtilsModule::convertError(const std::string& error) const {
    if (error.find("invalid") != std::string::npos) {
        return UTILS_ERROR_INVALID_BUFFER;
    }
    if (error.find("channel") != std::string::npos) {
        return UTILS_ERROR_INVALID_CHANNEL;
    }
    if (error.find("sample") != std::string::npos) {
        return UTILS_ERROR_INVALID_SAMPLE;
    }
    if (error.find("memory") != std::string::npos) {
        return UTILS_ERROR_OUT_OF_MEMORY;
    }
    return UTILS_ERROR_PROCESSING_FAILED;
}

void NativeAudioUtilsModule::handleBufferOperation(const std::string& operation, bool success) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    if (jsCallbacks_.bufferCallback) {
        invokeJSCallback("bufferCallback", [operation, success](jsi::Runtime& rt) {
            // TODO: Implement callback invocation with operation and success
        });
    }
}

void NativeAudioUtilsModule::handleError(NythUtilsError error, const std::string& message) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    if (jsCallbacks_.errorCallback) {
        invokeJSCallback("errorCallback", [error, message](jsi::Runtime& rt) {
            // TODO: Implement callback invocation with error and message
        });
    }
}

void NativeAudioUtilsModule::handleStateChange(NythUtilsState oldState, NythUtilsState newState) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    if (jsCallbacks_.stateChangeCallback) {
        invokeJSCallback("stateChangeCallback", [oldState, newState, this](jsi::Runtime& rt) {
            std::string oldStateStr = stateToString(oldState);
            std::string newStateStr = stateToString(newState);
            jsi::String oldStateJS = jsi::String::createFromUtf8(rt, oldStateStr);
            jsi::String newStateJS = jsi::String::createFromUtf8(rt, newStateStr);
        });
    }
}

std::string NativeAudioUtilsModule::stateToString(NythUtilsState state) const {
    switch (state) {
        case UTILS_STATE_UNINITIALIZED:
            return "uninitialized";
        case UTILS_STATE_INITIALIZED:
            return "initialized";
        case UTILS_STATE_PROCESSING:
            return "processing";
        case UTILS_STATE_ERROR:
            return "error";
        default:
            return "unknown";
    }
}

NythAudioBufferInfo NativeAudioUtilsModule::getBufferInfoInternal() const {
    NythAudioBufferInfo info = {};

    if (audioBuffer_) {
        info.numChannels = audioBuffer_->getNumChannels();
        info.numSamples = audioBuffer_->getNumSamples();
        info.totalSizeBytes = info.numChannels * info.numSamples * sizeof(float);
        info.alignment = AudioUtils::SIMD_ALIGNMENT_BYTES;
        info.isValid = audioBuffer_->validateBuffer();

#ifdef __ARM_NEON
        info.hasSIMD = true;
#elif defined(__SSE2__)
        info.hasSIMD = true;
#else
        info.hasSIMD = false;
#endif
    }

    return info;
}

NythAudioBufferStats NativeAudioUtilsModule::getBufferStatsInternal(size_t channel, size_t startSample,
                                                                    size_t numSamples) const {
    NythAudioBufferStats stats = {};

    if (!audioBuffer_ || channel >= audioBuffer_->getNumChannels()) {
        return stats;
    }

    size_t maxSamples = audioBuffer_->getNumSamples();
    if (startSample >= maxSamples)
        return stats;

    size_t actualSamples = std::min(numSamples, maxSamples - startSample);
    const float* data = audioBuffer_->getChannel(channel) + startSample;

    if (!data)
        return stats;

    float peak = 0.0f;
    double sum = 0.0, sumSquares = 0.0;
    size_t clipped = 0;

    for (size_t i = 0; i < actualSamples; ++i) {
        float sample = data[i];

        if (std::isnan(sample)) {
            stats.hasNaN = true;
            continue;
        }
        if (std::isinf(sample)) {
            stats.hasInf = true;
            continue;
        }

        float absSample = std::abs(sample);
        peak = std::max(peak, absSample);

        if (absSample > 1.0f) {
            clipped++;
        }

        sum += sample;
        sumSquares += sample * sample;
    }

    stats.peakLevel = peak;
    stats.dcOffset = sum / actualSamples;
    stats.rmsLevel = std::sqrt(sumSquares / actualSamples);
    stats.clippedSamples = clipped;

    return stats;
}

jsi::Object NativeAudioUtilsModule::bufferInfoToJS(jsi::Runtime& rt, const NythAudioBufferInfo& info) const {
    jsi::Object jsInfo(rt);

    jsInfo.setProperty(rt, "numChannels", jsi::Value(static_cast<int>(info.numChannels)));
    jsInfo.setProperty(rt, "numSamples", jsi::Value(static_cast<int>(info.numSamples)));
    jsInfo.setProperty(rt, "totalSizeBytes", jsi::Value(static_cast<int>(info.totalSizeBytes)));
    jsInfo.setProperty(rt, "alignment", jsi::Value(static_cast<int>(info.alignment)));
    jsInfo.setProperty(rt, "isValid", jsi::Value(info.isValid));
    jsInfo.setProperty(rt, "hasSIMD", jsi::Value(info.hasSIMD));

    return jsInfo;
}

jsi::Object NativeAudioUtilsModule::bufferStatsToJS(jsi::Runtime& rt, const NythAudioBufferStats& stats) const {
    jsi::Object jsStats(rt);

    jsStats.setProperty(rt, "peakLevel", jsi::Value(stats.peakLevel));
    jsStats.setProperty(rt, "rmsLevel", jsi::Value(stats.rmsLevel));
    jsStats.setProperty(rt, "dcOffset", jsi::Value(stats.dcOffset));
    jsStats.setProperty(rt, "clippedSamples", jsi::Value(static_cast<int>(stats.clippedSamples)));
    jsStats.setProperty(rt, "hasNaN", jsi::Value(stats.hasNaN));
    jsStats.setProperty(rt, "hasInf", jsi::Value(stats.hasInf));

    return jsStats;
}

std::vector<float> NativeAudioUtilsModule::arrayToFloatVector(jsi::Runtime& rt, const jsi::Array& array) const {
    size_t length = array.length(rt);
    std::vector<float> result(length);

    for (size_t i = 0; i < length; ++i) {
        result[i] = static_cast<float>(array.getValueAtIndex(rt, i).asNumber());
    }

    return result;
}

jsi::Array NativeAudioUtilsModule::floatVectorToArray(jsi::Runtime& rt, const std::vector<float>& vector) const {
    jsi::Array result(rt, vector.size());

    for (size_t i = 0; i < vector.size(); ++i) {
        result.setValueAtIndex(rt, i, jsi::Value(vector[i]));
    }

    return result;
}

void NativeAudioUtilsModule::invokeJSCallback(const std::string& callbackName,
                                              std::function<void(jsi::Runtime&)> invocation) {
    // Pour l'instant, implémentation basique
    // Dans un vrai module, il faudrait utiliser le jsInvoker pour invoquer sur le thread principal
    try {
        // TODO: Implémenter l'invocation sur le thread principal
        // Pour l'instant, on ne fait rien
    } catch (...) {
        // Gérer les erreurs d'invocation
    }
}

// === Méthodes publiques ===

jsi::Value NativeAudioUtilsModule::createBuffer(jsi::Runtime& rt, size_t numChannels, size_t numSamples) {
    std::lock_guard<std::mutex> lock(utilsMutex_);

    try {
        audioBuffer_ = std::make_unique<AudioUtils::AudioBuffer>(numChannels, numSamples);
        currentState_ = UTILS_STATE_INITIALIZED;
        handleBufferOperation("createBuffer", true);
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(UTILS_ERROR_PROCESSING_FAILED, std::string("Failed to create buffer: ") + e.what());
        handleBufferOperation("createBuffer", false);
        currentState_ = UTILS_STATE_ERROR;
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioUtilsModule::destroyBuffer(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(utilsMutex_);

    audioBuffer_.reset();
    currentState_ = UTILS_STATE_UNINITIALIZED;
    handleBufferOperation("destroyBuffer", true);

    return jsi::Value(true);
}

jsi::Value NativeAudioUtilsModule::isBufferValid(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(utilsMutex_);
    return jsi::Value(validateBuffer());
}

jsi::Value NativeAudioUtilsModule::getBufferInfo(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(utilsMutex_);
    auto info = getBufferInfoInternal();
    return bufferInfoToJS(rt, info);
}

jsi::Value NativeAudioUtilsModule::getBufferStats(jsi::Runtime& rt, size_t channel, size_t startSample,
                                                  size_t numSamples) {
    std::lock_guard<std::mutex> lock(utilsMutex_);

    if (!validateRange(channel, startSample, numSamples)) {
        handleError(UTILS_ERROR_INVALID_BUFFER, "Invalid range for buffer stats");
        return jsi::Value::null();
    }

    auto stats = getBufferStatsInternal(channel, startSample, numSamples);
    return bufferStatsToJS(rt, stats);
}

jsi::Value NativeAudioUtilsModule::clearBuffer(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(utilsMutex_);

    if (!audioBuffer_) {
        handleError(UTILS_ERROR_INVALID_BUFFER, "No buffer to clear");
        handleBufferOperation("clearBuffer", false);
        return jsi::Value(false);
    }

    try {
        audioBuffer_->clear();
        handleBufferOperation("clearBuffer", true);
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(UTILS_ERROR_PROCESSING_FAILED, std::string("Failed to clear buffer: ") + e.what());
        handleBufferOperation("clearBuffer", false);
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioUtilsModule::clearChannel(jsi::Runtime& rt, size_t channel) {
    std::lock_guard<std::mutex> lock(utilsMutex_);

    if (!validateChannel(channel)) {
        handleError(UTILS_ERROR_INVALID_CHANNEL, "Invalid channel for clear");
        handleBufferOperation("clearChannel", false);
        return jsi::Value(false);
    }

    try {
        audioBuffer_->clear(channel);
        handleBufferOperation("clearChannel", true);
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(UTILS_ERROR_PROCESSING_FAILED, std::string("Failed to clear channel: ") + e.what());
        handleBufferOperation("clearChannel", false);
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioUtilsModule::clearRange(jsi::Runtime& rt, size_t channel, size_t startSample, size_t numSamples) {
    std::lock_guard<std::mutex> lock(utilsMutex_);

    if (!validateRange(channel, startSample, numSamples)) {
        handleError(UTILS_ERROR_INVALID_BUFFER, "Invalid range for clear");
        handleBufferOperation("clearRange", false);
        return jsi::Value(false);
    }

    try {
        // Clear specific range - utiliser la méthode appropriée
        if (startSample == 0 && numSamples == audioBuffer_->getNumSamples()) {
            audioBuffer_->clear(channel);
        } else {
            // Pour une plage spécifique, on doit le faire manuellement
            float* channelData = audioBuffer_->getChannel(channel);
            if (channelData) {
                std::fill(channelData + startSample, channelData + startSample + numSamples, 0.0f);
            }
        }
        handleBufferOperation("clearRange", true);
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(UTILS_ERROR_PROCESSING_FAILED, std::string("Failed to clear range: ") + e.what());
        handleBufferOperation("clearRange", false);
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioUtilsModule::copyFromBuffer(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(utilsMutex_);

    if (!audioBuffer_) {
        handleError(UTILS_ERROR_INVALID_BUFFER, "No buffer to copy from");
        handleBufferOperation("copyFromBuffer", false);
        return jsi::Value(false);
    }

    try {
        // Copier depuis le même buffer - pas besoin de buffer temporaire
        // Cette opération n'a pas de sens, on retourne true
        handleBufferOperation("copyFromBuffer", true);
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(UTILS_ERROR_PROCESSING_FAILED, std::string("Failed to copy from buffer: ") + e.what());
        handleBufferOperation("copyFromBuffer", false);
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioUtilsModule::copyFromChannel(jsi::Runtime& rt, size_t destChannel, size_t destStartSample,
                                                   size_t srcChannel, size_t srcStartSample, size_t numSamples) {
    std::lock_guard<std::mutex> lock(utilsMutex_);

    if (!validateChannel(destChannel) || !validateChannel(srcChannel)) {
        handleError(UTILS_ERROR_INVALID_CHANNEL, "Invalid channel for copy");
        handleBufferOperation("copyFromChannel", false);
        return jsi::Value(false);
    }

    try {
        audioBuffer_->copyFrom(destChannel, destStartSample, *audioBuffer_, srcChannel, srcStartSample, numSamples);
        handleBufferOperation("copyFromChannel", true);
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(UTILS_ERROR_PROCESSING_FAILED, std::string("Failed to copy from channel: ") + e.what());
        handleBufferOperation("copyFromChannel", false);
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioUtilsModule::copyFromArray(jsi::Runtime& rt, size_t destChannel, const jsi::Array& source) {
    std::lock_guard<std::mutex> lock(utilsMutex_);

    if (!validateChannel(destChannel)) {
        handleError(UTILS_ERROR_INVALID_CHANNEL, "Invalid channel for array copy");
        handleBufferOperation("copyFromArray", false);
        return jsi::Value(false);
    }

    try {
        auto floatData = arrayToFloatVector(rt, source);
        audioBuffer_->copyFrom(destChannel, floatData.data(), floatData.size());
        handleBufferOperation("copyFromArray", true);
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(UTILS_ERROR_PROCESSING_FAILED, std::string("Failed to copy from array: ") + e.what());
        handleBufferOperation("copyFromArray", false);
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioUtilsModule::addFrom(jsi::Runtime& rt, size_t destChannel, const jsi::Array& source, float gain) {
    std::lock_guard<std::mutex> lock(utilsMutex_);

    if (!validateChannel(destChannel)) {
        handleError(UTILS_ERROR_INVALID_CHANNEL, "Invalid channel for add");
        handleBufferOperation("addFrom", false);
        return jsi::Value(false);
    }

    try {
        auto floatData = arrayToFloatVector(rt, source);
        audioBuffer_->addFrom(destChannel, floatData.data(), floatData.size(), gain);
        handleBufferOperation("addFrom", true);
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(UTILS_ERROR_PROCESSING_FAILED, std::string("Failed to add from array: ") + e.what());
        handleBufferOperation("addFrom", false);
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioUtilsModule::addFromBuffer(jsi::Runtime& rt, float gain) {
    std::lock_guard<std::mutex> lock(utilsMutex_);

    if (!audioBuffer_) {
        handleError(UTILS_ERROR_INVALID_BUFFER, "No buffer to add from");
        handleBufferOperation("addFromBuffer", false);
        return jsi::Value(false);
    }

    try {
        // Addition depuis le même buffer - pas besoin de buffer temporaire
        // Cette opération n'a pas de sens, on retourne true
        handleBufferOperation("addFromBuffer", true);
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(UTILS_ERROR_PROCESSING_FAILED, std::string("Failed to add from buffer: ") + e.what());
        handleBufferOperation("addFromBuffer", false);
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioUtilsModule::applyGain(jsi::Runtime& rt, size_t channel, float gain) {
    std::lock_guard<std::mutex> lock(utilsMutex_);

    if (!validateChannel(channel)) {
        handleError(UTILS_ERROR_INVALID_CHANNEL, "Invalid channel for gain");
        handleBufferOperation("applyGain", false);
        return jsi::Value(false);
    }

    try {
        audioBuffer_->applyGain(channel, gain);
        handleBufferOperation("applyGain", true);
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(UTILS_ERROR_PROCESSING_FAILED, std::string("Failed to apply gain: ") + e.what());
        handleBufferOperation("applyGain", false);
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioUtilsModule::applyGainRange(jsi::Runtime& rt, size_t channel, size_t startSample,
                                                  size_t numSamples, float gain) {
    std::lock_guard<std::mutex> lock(utilsMutex_);

    if (!validateRange(channel, startSample, numSamples)) {
        handleError(UTILS_ERROR_INVALID_BUFFER, "Invalid range for gain");
        handleBufferOperation("applyGainRange", false);
        return jsi::Value(false);
    }

    try {
        audioBuffer_->applyGain(channel, startSample, numSamples, gain);
        handleBufferOperation("applyGainRange", true);
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(UTILS_ERROR_PROCESSING_FAILED, std::string("Failed to apply gain range: ") + e.what());
        handleBufferOperation("applyGainRange", false);
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioUtilsModule::applyGainRamp(jsi::Runtime& rt, size_t channel, size_t startSample,
                                                 size_t numSamples, float startGain, float endGain) {
    std::lock_guard<std::mutex> lock(utilsMutex_);

    if (!validateRange(channel, startSample, numSamples)) {
        handleError(UTILS_ERROR_INVALID_BUFFER, "Invalid range for gain ramp");
        handleBufferOperation("applyGainRamp", false);
        return jsi::Value(false);
    }

    try {
        audioBuffer_->applyGainRamp(channel, startSample, numSamples, startGain, endGain);
        handleBufferOperation("applyGainRamp", true);
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(UTILS_ERROR_PROCESSING_FAILED, std::string("Failed to apply gain ramp: ") + e.what());
        handleBufferOperation("applyGainRamp", false);
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioUtilsModule::getMagnitude(jsi::Runtime& rt, size_t channel, size_t startSample,
                                                size_t numSamples) {
    std::lock_guard<std::mutex> lock(utilsMutex_);

    if (!validateRange(channel, startSample, numSamples)) {
        return jsi::Value(0.0f);
    }

    try {
        float magnitude = audioBuffer_->getMagnitude(channel, startSample, numSamples);
        return jsi::Value(magnitude);
    } catch (const std::exception& e) {
        handleError(UTILS_ERROR_PROCESSING_FAILED, std::string("Failed to get magnitude: ") + e.what());
        return jsi::Value(0.0f);
    }
}

jsi::Value NativeAudioUtilsModule::getRMSLevel(jsi::Runtime& rt, size_t channel, size_t startSample,
                                               size_t numSamples) {
    std::lock_guard<std::mutex> lock(utilsMutex_);

    if (!validateRange(channel, startSample, numSamples)) {
        return jsi::Value(0.0f);
    }

    try {
        float rms = audioBuffer_->getRMSLevel(channel, startSample, numSamples);
        return jsi::Value(rms);
    } catch (const std::exception& e) {
        handleError(UTILS_ERROR_PROCESSING_FAILED, std::string("Failed to get RMS level: ") + e.what());
        return jsi::Value(0.0f);
    }
}

jsi::Value NativeAudioUtilsModule::getChannelData(jsi::Runtime& rt, size_t channel) {
    std::lock_guard<std::mutex> lock(utilsMutex_);

    if (!validateChannel(channel)) {
        return jsi::Value::null();
    }

    try {
        const float* data = audioBuffer_->getChannel(channel);
        if (!data)
            return jsi::Value::null();

        size_t numSamples = audioBuffer_->getNumSamples();
        jsi::Array result(rt, numSamples);

        for (size_t i = 0; i < numSamples; ++i) {
            result.setValueAtIndex(rt, i, jsi::Value(data[i]));
        }

        return result;
    } catch (const std::exception& e) {
        handleError(UTILS_ERROR_PROCESSING_FAILED, std::string("Failed to get channel data: ") + e.what());
        return jsi::Value::null();
    }
}

jsi::Value NativeAudioUtilsModule::setChannelData(jsi::Runtime& rt, size_t channel, const jsi::Array& data) {
    std::lock_guard<std::mutex> lock(utilsMutex_);

    if (!validateChannel(channel)) {
        handleError(UTILS_ERROR_INVALID_CHANNEL, "Invalid channel for data set");
        handleBufferOperation("setChannelData", false);
        return jsi::Value(false);
    }

    try {
        auto floatData = arrayToFloatVector(rt, data);
        audioBuffer_->copyFrom(channel, floatData.data(), floatData.size());
        handleBufferOperation("setChannelData", true);
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(UTILS_ERROR_PROCESSING_FAILED, std::string("Failed to set channel data: ") + e.what());
        handleBufferOperation("setChannelData", false);
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioUtilsModule::dbToLinear(jsi::Runtime& rt, float db) {
    return jsi::Value(std::pow(10.0f, db / 20.0f));
}

jsi::Value NativeAudioUtilsModule::linearToDb(jsi::Runtime& rt, float linear) {
    return jsi::Value(20.0f * std::log10(std::max(linear, 1e-10f)));
}

jsi::Value NativeAudioUtilsModule::dbToLinearDouble(jsi::Runtime& rt, double db) {
    return jsi::Value(std::pow(10.0, db / 20.0));
}

jsi::Value NativeAudioUtilsModule::linearToDbDouble(jsi::Runtime& rt, double linear) {
    return jsi::Value(20.0 * std::log10(std::max(linear, 1e-10)));
}

jsi::Value NativeAudioUtilsModule::getMaxChannels(jsi::Runtime& rt) {
    return jsi::Value(static_cast<int>(AudioUtils::MAX_CHANNELS));
}

jsi::Value NativeAudioUtilsModule::getMaxSamples(jsi::Runtime& rt) {
    return jsi::Value(static_cast<int>(AudioUtils::MAX_SAMPLES));
}

jsi::Value NativeAudioUtilsModule::getSIMDAlignment(jsi::Runtime& rt) {
    return jsi::Value(static_cast<int>(AudioUtils::SIMD_ALIGNMENT_BYTES));
}

jsi::Value NativeAudioUtilsModule::hasSIMDSupport(jsi::Runtime& rt) {
#ifdef __ARM_NEON
    return jsi::Value(true);
#elif defined(__SSE2__)
    return jsi::Value(true);
#else
    return jsi::Value(false);
#endif
}

jsi::Value NativeAudioUtilsModule::getPlatformInfo(jsi::Runtime& rt) {
    std::stringstream ss;

#ifdef AUDIO_PLATFORM_MACOS
    ss << "macOS";
#elif defined(AUDIO_PLATFORM_WINDOWS)
    ss << "Windows";
#elif defined(AUDIO_PLATFORM_LINUX)
    ss << "Linux";
#else
    ss << "Unknown";
#endif

    ss << " - ";

#ifdef AUDIO_COMPILER_CLANG
    ss << "Clang";
#elif defined(AUDIO_COMPILER_GCC)
    ss << "GCC";
#elif defined(AUDIO_COMPILER_MSVC)
    ss << "MSVC";
#else
    ss << "Unknown Compiler";
#endif

    ss << " - ";

#ifdef __ARM_NEON
    ss << "NEON SIMD";
#elif defined(__SSE2__)
    ss << "SSE2 SIMD";
#else
    ss << "No SIMD";
#endif

    return jsi::String::createFromUtf8(rt, ss.str());
}

// === Callbacks JavaScript ===

jsi::Value NativeAudioUtilsModule::setBufferCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    jsCallbacks_.bufferCallback = std::make_shared<jsi::Function>(
        jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forUtf8(rt, "bufferCallback"), 0,
                                              [](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                                 size_t count) -> jsi::Value { return jsi::Value::undefined(); }));
    return jsi::Value(true);
}

jsi::Value NativeAudioUtilsModule::setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    jsCallbacks_.errorCallback = std::make_shared<jsi::Function>(
        jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forUtf8(rt, "errorCallback"), 0,
                                              [](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                                 size_t count) -> jsi::Value { return jsi::Value::undefined(); }));
    return jsi::Value(true);
}

jsi::Value NativeAudioUtilsModule::setStateChangeCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    jsCallbacks_.stateChangeCallback = std::make_shared<jsi::Function>(
        jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forUtf8(rt, "stateChangeCallback"), 0,
                                              [](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                                 size_t count) -> jsi::Value { return jsi::Value::undefined(); }));
    return jsi::Value(true);
}

jsi::Value NativeAudioUtilsModule::install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker) {
    // Installation directe du module dans le runtime JSI
    return jsi::Value(true);
}

// === Fonction d'enregistrement du module ===
std::shared_ptr<TurboModule> NativeAudioUtilsModuleProvider(std::shared_ptr<CallInvoker> jsInvoker) {
    return std::make_shared<NativeAudioUtilsModule>(jsInvoker);
}

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_UTILS_ENABLED
