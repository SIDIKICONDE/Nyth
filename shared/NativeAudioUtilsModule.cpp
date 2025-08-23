#include "NativeAudioUtilsModule.h"

#if NYTH_AUDIO_UTILS_ENABLED

#include "Audio/utils/AudioBuffer.hpp"
#include <chrono>
#include <sstream>
#include <algorithm>
#include <cmath>
#include <cstring>
#include <stdexcept>

// === Instance globale pour l'API C ===
static std::unique_ptr<AudioUtils::AudioBuffer> g_audioBuffer;
static std::mutex g_globalMutex;
static NythUtilsState g_currentState = UTILS_STATE_UNINITIALIZED;

// === Implémentation de l'API C ===
extern "C" {

bool NythAudioBuffer_Create(size_t numChannels, size_t numSamples) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    try {
        if (numChannels == 0 || numSamples == 0 ||
            numChannels > AudioUtils::MAX_CHANNELS ||
            numSamples > AudioUtils::MAX_SAMPLES) {
            g_currentState = UTILS_STATE_ERROR;
            return false;
        }

        g_audioBuffer = std::make_unique<AudioUtils::AudioBuffer>(numChannels, numSamples);
        g_currentState = UTILS_STATE_INITIALIZED;
        return true;
    } catch (...) {
        g_currentState = UTILS_STATE_ERROR;
        return false;
    }
}

bool NythAudioBuffer_IsValid(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_audioBuffer != nullptr && g_audioBuffer->validateBuffer();
}

void NythAudioBuffer_Destroy(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    g_audioBuffer.reset();
    g_currentState = UTILS_STATE_UNINITIALIZED;
}

// === Informations et statistiques ===
void NythAudioBuffer_GetInfo(NythAudioBufferInfo* info) {
    if (!info) return;

    std::lock_guard<std::mutex> lock(g_globalMutex);

    memset(info, 0, sizeof(NythAudioBufferInfo));

    if (g_audioBuffer) {
        info->numChannels = g_audioBuffer->getNumChannels();
        info->numSamples = g_audioBuffer->getNumSamples();
        info->totalSizeBytes = info->numChannels * info->numSamples * sizeof(float);
        info->alignment = AudioUtils::SIMD_ALIGNMENT_BYTES;
        info->isValid = g_audioBuffer->validateBuffer();

#ifdef __ARM_NEON
        info->hasSIMD = true;
#elif defined(__SSE2__)
        info->hasSIMD = true;
#else
        info->hasSIMD = false;
#endif
    }
}

void NythAudioBuffer_GetStats(size_t channel, size_t startSample, size_t numSamples,
                             NythAudioBufferStats* stats) {
    if (!stats || !g_audioBuffer) return;

    std::lock_guard<std::mutex> lock(g_globalMutex);

    memset(stats, 0, sizeof(NythAudioBufferStats));

    if (channel >= g_audioBuffer->getNumChannels()) return;

    size_t maxSamples = g_audioBuffer->getNumSamples();
    if (startSample >= maxSamples) return;

    size_t actualSamples = std::min(numSamples, maxSamples - startSample);

    // Calcul des statistiques
    const float* data = g_audioBuffer->getChannel(startSample);
    if (!data) return;

    float peak = 0.0f;
    double sum = 0.0;
    double sumSquares = 0.0;
    size_t clipped = 0;

    for (size_t i = 0; i < actualSamples; ++i) {
        float sample = data[i];

        // Vérification NaN/Inf
        if (std::isnan(sample)) {
            stats->hasNaN = true;
            continue;
        }
        if (std::isinf(sample)) {
            stats->hasInf = true;
            continue;
        }

        // Calcul du peak
        float absSample = std::abs(sample);
        peak = std::max(peak, absSample);

        // Comptage des échantillons écrêtés
        if (absSample > 1.0f) {
            clipped++;
        }

        // Calcul de la moyenne et RMS
        sum += sample;
        sumSquares += sample * sample;
    }

    stats->peakLevel = peak;
    stats->dcOffset = sum / actualSamples;
    stats->rmsLevel = std::sqrt(sumSquares / actualSamples);
    stats->clippedSamples = clipped;
}

// === Opérations de base ===
bool NythAudioBuffer_Clear(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (!g_audioBuffer) return false;

    try {
        g_audioBuffer->clear();
        return true;
    } catch (...) {
        return false;
    }
}

bool NythAudioBuffer_ClearChannel(size_t channel) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (!g_audioBuffer || channel >= g_audioBuffer->getNumChannels()) return false;

    try {
        g_audioBuffer->clear(channel);
        return true;
    } catch (...) {
        return false;
    }
}

bool NythAudioBuffer_ClearRange(size_t channel, size_t startSample, size_t numSamples) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (!g_audioBuffer || channel >= g_audioBuffer->getNumChannels()) return false;

    try {
        g_audioBuffer->clear(channel, startSample, numSamples);
        return true;
    } catch (...) {
        return false;
    }
}

// === Opérations de copie ===
bool NythAudioBuffer_CopyFromBuffer(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (!g_audioBuffer) return false;

    try {
        // Créer un buffer temporaire pour la copie
        AudioUtils::AudioBuffer tempBuffer(*g_audioBuffer);
        g_audioBuffer->copyFrom(tempBuffer);
        return true;
    } catch (...) {
        return false;
    }
}

bool NythAudioBuffer_CopyFromChannel(size_t destChannel, size_t destStartSample,
                                   size_t srcChannel, size_t srcStartSample, size_t numSamples) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (!g_audioBuffer ||
        destChannel >= g_audioBuffer->getNumChannels() ||
        srcChannel >= g_audioBuffer->getNumChannels()) {
        return false;
    }

    try {
        g_audioBuffer->copyFrom(destChannel, destStartSample, *g_audioBuffer,
                               srcChannel, srcStartSample, numSamples);
        return true;
    } catch (...) {
        return false;
    }
}

bool NythAudioBuffer_CopyFromArray(size_t destChannel, const float* source, size_t numSamples) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (!g_audioBuffer || !source || destChannel >= g_audioBuffer->getNumChannels()) {
        return false;
    }

    try {
        g_audioBuffer->copyFrom(destChannel, source, numSamples);
        return true;
    } catch (...) {
        return false;
    }
}

// === Opérations de mixage ===
bool NythAudioBuffer_AddFrom(size_t destChannel, const float* source, size_t numSamples, float gain) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (!g_audioBuffer || !source || destChannel >= g_audioBuffer->getNumChannels()) {
        return false;
    }

    try {
        g_audioBuffer->addFrom(destChannel, source, numSamples, gain);
        return true;
    } catch (...) {
        return false;
    }
}

bool NythAudioBuffer_AddFromBuffer(float gain) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (!g_audioBuffer) return false;

    try {
        // Créer un buffer temporaire pour l'addition
        AudioUtils::AudioBuffer tempBuffer(*g_audioBuffer);
        g_audioBuffer->addFrom(tempBuffer, gain);
        return true;
    } catch (...) {
        return false;
    }
}

// === Opérations de gain ===
bool NythAudioBuffer_ApplyGain(size_t channel, float gain) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (!g_audioBuffer || channel >= g_audioBuffer->getNumChannels()) return false;

    try {
        g_audioBuffer->applyGain(channel, gain);
        return true;
    } catch (...) {
        return false;
    }
}

bool NythAudioBuffer_ApplyGainRange(size_t channel, size_t startSample, size_t numSamples, float gain) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (!g_audioBuffer || channel >= g_audioBuffer->getNumChannels()) return false;

    try {
        g_audioBuffer->applyGain(channel, startSample, numSamples, gain);
        return true;
    } catch (...) {
        return false;
    }
}

bool NythAudioBuffer_ApplyGainRamp(size_t channel, size_t startSample, size_t numSamples,
                                  float startGain, float endGain) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (!g_audioBuffer || channel >= g_audioBuffer->getNumChannels()) return false;

    try {
        g_audioBuffer->applyGainRamp(channel, startSample, numSamples, startGain, endGain);
        return true;
    } catch (...) {
        return false;
    }
}

// === Analyse du signal ===
float NythAudioBuffer_GetMagnitude(size_t channel, size_t startSample, size_t numSamples) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (!g_audioBuffer || channel >= g_audioBuffer->getNumChannels()) {
        return 0.0f;
    }

    try {
        return g_audioBuffer->getMagnitude(channel, startSample, numSamples);
    } catch (...) {
        return 0.0f;
    }
}

float NythAudioBuffer_GetRMSLevel(size_t channel, size_t startSample, size_t numSamples) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (!g_audioBuffer || channel >= g_audioBuffer->getNumChannels()) {
        return 0.0f;
    }

    try {
        return g_audioBuffer->getRMSLevel(channel, startSample, numSamples);
    } catch (...) {
        return 0.0f;
    }
}

// === Accès direct aux données ===
float* NythAudioBuffer_GetChannelData(size_t channel) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (!g_audioBuffer || channel >= g_audioBuffer->getNumChannels()) {
        return nullptr;
    }

    return g_audioBuffer->getChannel(channel);
}

const float* NythAudioBuffer_GetChannelDataReadOnly(size_t channel) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (!g_audioBuffer || channel >= g_audioBuffer->getNumChannels()) {
        return nullptr;
    }

    return g_audioBuffer->getChannel(channel);
}

float** NythAudioBuffer_GetWritePointers(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (!g_audioBuffer) return nullptr;

    return g_audioBuffer->getArrayOfWritePointers();
}

const float* const* NythAudioBuffer_GetReadPointers(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (!g_audioBuffer) return nullptr;

    return g_audioBuffer->getArrayOfReadPointers();
}

// === Utilitaires de conversion ===
float NythUtils_DbToLinear(float db) {
    return std::pow(10.0f, db / 20.0f);
}

float NythUtils_LinearToDb(float linear) {
    return 20.0f * std::log10(std::max(linear, 1e-10f));
}

double NythUtils_DbToLinearDouble(double db) {
    return std::pow(10.0, db / 20.0);
}

double NythUtils_LinearToDbDouble(double linear) {
    return 20.0 * std::log10(std::max(linear, 1e-10));
}

// === Constantes et informations système ===
size_t NythUtils_GetMaxChannels(void) {
    return AudioUtils::MAX_CHANNELS;
}

size_t NythUtils_GetMaxSamples(void) {
    return AudioUtils::MAX_SAMPLES;
}

size_t NythUtils_GetSIMDAlignment(void) {
    return AudioUtils::SIMD_ALIGNMENT_BYTES;
}

bool NythUtils_HasSIMDSupport(void) {
#ifdef __ARM_NEON
    return true;
#elif defined(__SSE2__)
    return true;
#else
    return false;
#endif
}

const char* NythUtils_GetPlatformInfo(void) {
    static std::string platformInfo;

    if (platformInfo.empty()) {
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

        platformInfo = ss.str();
    }

    return platformInfo.c_str();
}

// === Callbacks ===
static NythUtilsBufferCallback g_bufferCallback = nullptr;
static NythUtilsErrorCallback g_errorCallback = nullptr;
static NythUtilsStateChangeCallback g_stateChangeCallback = nullptr;

void NythUtils_SetBufferCallback(NythUtilsBufferCallback callback) {
    g_bufferCallback = callback;
}

void NythUtils_SetErrorCallback(NythUtilsErrorCallback callback) {
    g_errorCallback = callback;
}

void NythUtils_SetStateChangeCallback(NythUtilsStateChangeCallback callback) {
    g_stateChangeCallback = callback;
}

} // extern "C"

// === Implémentation C++ pour TurboModule ===

namespace facebook {
namespace react {

NativeAudioUtilsModule::NativeAudioUtilsModule(std::shared_ptr<CallInvoker> jsInvoker)
    : TurboModule(jsInvoker) {
}

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
    if (!audioBuffer_ || channel >= audioBuffer_->getNumChannels()) return false;

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
        case UTILS_STATE_UNINITIALIZED: return "uninitialized";
        case UTILS_STATE_INITIALIZED: return "initialized";
        case UTILS_STATE_PROCESSING: return "processing";
        case UTILS_STATE_ERROR: return "error";
        default: return "unknown";
    }
}

NythAudioBufferInfo NativeAudioUtilsModule::getBufferInfoInternal() const {
    NythAudioBufferInfo info = {0};

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

NythAudioBufferStats NativeAudioUtilsModule::getBufferStatsInternal(size_t channel, size_t startSample, size_t numSamples) const {
    NythAudioBufferStats stats = {0};

    if (!audioBuffer_ || channel >= audioBuffer_->getNumChannels()) {
        return stats;
    }

    size_t maxSamples = audioBuffer_->getNumSamples();
    if (startSample >= maxSamples) return stats;

    size_t actualSamples = std::min(numSamples, maxSamples - startSample);
    const float* data = audioBuffer_->getChannel(channel) + startSample;

    if (!data) return stats;

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

void NativeAudioUtilsModule::invokeJSCallback(
    const std::string& callbackName,
    std::function<void(jsi::Runtime&)> invocation) {

    // Pour l'instant, implémentation basique
    // Dans un vrai module, il faudrait utiliser le jsInvoker pour invoquer sur le thread principal
    try {
        // TODO: Implémenter l'invocation sur le thread principal
        invocation(*reinterpret_cast<jsi::Runtime*>(nullptr));
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

jsi::Value NativeAudioUtilsModule::getBufferStats(jsi::Runtime& rt, size_t channel, size_t startSample, size_t numSamples) {
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
        audioBuffer_->clear(channel, startSample, numSamples);
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
        AudioUtils::AudioBuffer tempBuffer(*audioBuffer_);
        audioBuffer_->copyFrom(tempBuffer);
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
        audioBuffer_->copyFrom(destChannel, destStartSample, *audioBuffer_,
                              srcChannel, srcStartSample, numSamples);
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
        AudioUtils::AudioBuffer tempBuffer(*audioBuffer_);
        audioBuffer_->addFrom(tempBuffer, gain);
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

jsi::Value NativeAudioUtilsModule::applyGainRange(jsi::Runtime& rt, size_t channel, size_t startSample, size_t numSamples, float gain) {
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

jsi::Value NativeAudioUtilsModule::applyGainRamp(jsi::Runtime& rt, size_t channel, size_t startSample, size_t numSamples,
                                                float startGain, float endGain) {
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

jsi::Value NativeAudioUtilsModule::getMagnitude(jsi::Runtime& rt, size_t channel, size_t startSample, size_t numSamples) {
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

jsi::Value NativeAudioUtilsModule::getRMSLevel(jsi::Runtime& rt, size_t channel, size_t startSample, size_t numSamples) {
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
        if (!data) return jsi::Value::null();

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
    return jsi::Value(NythUtils_DbToLinear(db));
}

jsi::Value NativeAudioUtilsModule::linearToDb(jsi::Runtime& rt, float linear) {
    return jsi::Value(NythUtils_LinearToDb(linear));
}

jsi::Value NativeAudioUtilsModule::dbToLinearDouble(jsi::Runtime& rt, double db) {
    return jsi::Value(NythUtils_DbToLinearDouble(db));
}

jsi::Value NativeAudioUtilsModule::linearToDbDouble(jsi::Runtime& rt, double linear) {
    return jsi::Value(NythUtils_LinearToDbDouble(linear));
}

jsi::Value NativeAudioUtilsModule::getMaxChannels(jsi::Runtime& rt) {
    return jsi::Value(static_cast<int>(NythUtils_GetMaxChannels()));
}

jsi::Value NativeAudioUtilsModule::getMaxSamples(jsi::Runtime& rt) {
    return jsi::Value(static_cast<int>(NythUtils_GetMaxSamples()));
}

jsi::Value NativeAudioUtilsModule::getSIMDAlignment(jsi::Runtime& rt) {
    return jsi::Value(static_cast<int>(NythUtils_GetSIMDAlignment()));
}

jsi::Value NativeAudioUtilsModule::hasSIMDSupport(jsi::Runtime& rt) {
    return jsi::Value(NythUtils_HasSIMDSupport());
}

jsi::Value NativeAudioUtilsModule::getPlatformInfo(jsi::Runtime& rt) {
    const char* info = NythUtils_GetPlatformInfo();
    return jsi::String::createFromUtf8(rt, info);
}

// === Callbacks JavaScript ===

jsi::Value NativeAudioUtilsModule::setBufferCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    jsCallbacks_.bufferCallback = std::make_shared<jsi::Function>(
        jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forUtf8(rt, "bufferCallback"),
        0, [](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {
            return jsi::Value::undefined();
        }));
    return jsi::Value(true);
}

jsi::Value NativeAudioUtilsModule::setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    jsCallbacks_.errorCallback = std::make_shared<jsi::Function>(
        jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forUtf8(rt, "errorCallback"),
        0, [](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {
            return jsi::Value::undefined();
        }));
    return jsi::Value(true);
}

jsi::Value NativeAudioUtilsModule::setStateChangeCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    jsCallbacks_.stateChangeCallback = std::make_shared<jsi::Function>(
        jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forUtf8(rt, "stateChangeCallback"),
        0, [](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {
            return jsi::Value::undefined();
        }));
    return jsi::Value(true);
}

jsi::Value NativeAudioUtilsModule::install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker) {
    // Installation directe du module dans le runtime JSI
    return jsi::Value(true);
}

// === Fonction d'enregistrement du module ===
std::shared_ptr<TurboModule> NativeAudioUtilsModuleProvider(
    std::shared_ptr<CallInvoker> jsInvoker) {
    return std::make_shared<NativeAudioUtilsModule>(jsInvoker);
}

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_UTILS_ENABLED
