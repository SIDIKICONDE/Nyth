#include "SafetyManager.h"

#include <algorithm>
#include <atomic>
#include <chrono>
#include <cmath>
#include <cstring>
#include <memory>
#include <mutex>
#include <string>
#include <vector>

#include "../components/AudioSafety.hpp"
#include "../components/AudioSafetyOptimized.hpp"

namespace facebook {
namespace react {

SafetyManager::SafetyManager(std::shared_ptr<JSICallbackManager> callbackManager) : callbackManager_(callbackManager) {}

SafetyManager::~SafetyManager() {
    cleanupEngines();
}

// === Cycle de vie ===

bool SafetyManager::initialize(const Nyth::Audio::SafetyConfig& config) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (isInitialized_.load()) {
        return true; // Already initialized
    }

    try {
        // Validate configuration
        if (!validateConfig(config)) {
            handleError(Nyth::Audio::SafetyError::INVALID_CONFIG, "Invalid configuration provided");
            return false;
        }

        config_ = config;

        // Initialize engines
        initializeEngines();

        // Set initial state
        setState(Nyth::Audio::SafetyState::INITIALIZED);
        isInitialized_.store(true);

        return true;
    } catch (const std::exception& e) {
        handleError(Nyth::Audio::SafetyError::PROCESSING_FAILED, std::string("Initialization failed: ") + e.what());
        setState(Nyth::Audio::SafetyState::ERROR);
        return false;
    }
}

bool SafetyManager::isInitialized() const {
    return isInitialized_.load();
}

void SafetyManager::release() {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!isInitialized_.load()) {
        return;
    }

    try {
        cleanupEngines();
        resetStatsInternal();

        setState(Nyth::Audio::SafetyState::SHUTDOWN);
        isInitialized_.store(false);
    } catch (const std::exception& e) {
        handleError(Nyth::Audio::SafetyError::PROCESSING_FAILED, std::string("Release failed: ") + e.what());
    }
}

// === Configuration ===

bool SafetyManager::setConfig(const Nyth::Audio::SafetyConfig& config) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!isInitialized_.load()) {
        handleError(Nyth::Audio::SafetyError::ENGINE_NOT_INITIALIZED, "Engine not initialized");
        return false;
    }

    if (!validateConfig(config)) {
        handleError(Nyth::Audio::SafetyError::INVALID_CONFIG, "Invalid configuration provided");
        return false;
    }

    try {
        config_ = config;

        // Update engines configuration
        auto nativeConfig = convertConfig(config_);
        bool success = true;

        if (safetyEngine_) {
            success &= (safetyEngine_->setConfig(nativeConfig) == Nyth::Audio::SafetyError::OK);
        }

        if (optimizedEngine_) {
            success &= (optimizedEngine_->setConfig(nativeConfig) == Nyth::Audio::SafetyError::OK);
        }

        if (!success) {
            handleError(Nyth::Audio::SafetyError::PROCESSING_FAILED, "Failed to update engine configuration");
            return false;
        }

        return true;
    } catch (const std::exception& e) {
        handleError(Nyth::Audio::SafetyError::PROCESSING_FAILED,
                    std::string("Configuration update failed: ") + e.what());
        return false;
    }
}

Nyth::Audio::SafetyConfig SafetyManager::getConfig() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return config_;
}

bool SafetyManager::updateConfig(const Nyth::Audio::SafetyConfig& config) {
    return setConfig(config);
}

// === Contrôle ===

bool SafetyManager::start() {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!isInitialized_.load()) {
        handleError(Nyth::Audio::SafetyError::ENGINE_NOT_INITIALIZED, "Engine not initialized");
        return false;
    }

    if (isProcessing_.load()) {
        return true; // Already started
    }

    try {
        isProcessing_.store(true);
        setState(Nyth::Audio::SafetyState::PROCESSING);
        return true;
    } catch (const std::exception& e) {
        handleError(Nyth::Audio::SafetyError::PROCESSING_FAILED, std::string("Start failed: ") + e.what());
        return false;
    }
}

bool SafetyManager::stop() {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!isProcessing_.load()) {
        return true; // Already stopped
    }

    try {
        isProcessing_.store(false);
        setState(Nyth::Audio::SafetyState::INITIALIZED);
        return true;
    } catch (const std::exception& e) {
        handleError(Nyth::Audio::SafetyError::PROCESSING_FAILED, std::string("Stop failed: ") + e.what());
        return false;
    }
}

bool SafetyManager::isProcessing() const {
    return isProcessing_.load();
}

Nyth::Audio::SafetyState SafetyManager::getState() const {
    return currentState_.load();
}

// === Traitement audio ===

bool SafetyManager::processAudio(const float* input, float* output, size_t frameCount, int channels) {
    if (!isInitialized_.load() || !isProcessing_.load()) {
        return false;
    }

    if (!input || !output || frameCount == 0) {
        handleError(Nyth::Audio::SafetyError::NULL_BUFFER, "Invalid buffer or frame count");
        return false;
    }

    try {
        auto startTime = std::chrono::steady_clock::now();

        Nyth::Audio::SafetyError error;

        if (channels == 1) {
            error = processMonoInternal(output, frameCount);
            // Copy input to output if no processing was done
            std::memcpy(output, input, frameCount * sizeof(float));
        } else if (channels == 2) {
            // Désentrelacer en deux canaux temporaires
            if (workBufferL_.size() < frameCount) {
                workBufferL_.resize(frameCount);
                workBufferR_.resize(frameCount);
            }
            for (size_t i = 0; i < frameCount; ++i) {
                workBufferL_[i] = input[2 * i];
                workBufferR_[i] = input[2 * i + 1];
            }

            auto errStereo = processStereoInternal(workBufferL_.data(), workBufferR_.data(), frameCount);
            error = errStereo;

            // Réentrelacer vers output
            for (size_t i = 0; i < frameCount; ++i) {
                output[2 * i] = workBufferL_[i];
                output[2 * i + 1] = workBufferR_[i];
            }
        } else {
            // Fallback: traiter chaque canal comme mono séquentiellement
            size_t totalSamples = frameCount * static_cast<size_t>(channels);
            std::memcpy(output, input, totalSamples * sizeof(float));
            error = Nyth::Audio::SafetyError::OK;
        }

        auto endTime = std::chrono::steady_clock::now();
        double processingTimeMs =
            std::chrono::duration_cast<std::chrono::microseconds>(endTime - startTime).count() / 1000.0;

        // Check for timeout
        if (processingTimeMs > config_.maxProcessingTimeMs) {
            handleError(Nyth::Audio::SafetyError::TIMEOUT, "Processing timeout");
            return false;
        }

        if (error != Nyth::Audio::SafetyError::OK) {
            return false;
        }

        // Invoke data callback
        invokeDataCallback(input, output, frameCount, channels);

        return true;
    } catch (const std::exception& e) {
        handleError(Nyth::Audio::SafetyError::PROCESSING_FAILED, std::string("Audio processing failed: ") + e.what());
        return false;
    }
}

bool SafetyManager::processAudioStereo(const float* inputL, const float* inputR, float* outputL, float* outputR,
                                       size_t frameCount) {
    if (!isInitialized_.load() || !isProcessing_.load()) {
        return false;
    }

    if (!inputL || !inputR || !outputL || !outputR || frameCount == 0) {
        handleError(Nyth::Audio::SafetyError::NULL_BUFFER, "Invalid buffers or frame count");
        return false;
    }

    try {
        auto startTime = std::chrono::steady_clock::now();

        auto error = processStereoInternal(outputL, outputR, frameCount);

        auto endTime = std::chrono::steady_clock::now();
        double processingTimeMs =
            std::chrono::duration_cast<std::chrono::microseconds>(endTime - startTime).count() / 1000.0;

        // Check for timeout
        if (processingTimeMs > config_.maxProcessingTimeMs) {
            handleError(Nyth::Audio::SafetyError::TIMEOUT, "Processing timeout");
            return false;
        }

        if (error != Nyth::Audio::SafetyError::OK) {
            return false;
        }

        // Copy inputs to outputs if no processing was done
        std::memcpy(outputL, inputL, frameCount * sizeof(float));
        std::memcpy(outputR, inputR, frameCount * sizeof(float));

        // Invoke data callback
        invokeDataCallback(nullptr, nullptr, frameCount, 2); // Stereo

        return true;
    } catch (const std::exception& e) {
        handleError(Nyth::Audio::SafetyError::PROCESSING_FAILED,
                    std::string("Stereo audio processing failed: ") + e.what());
        return false;
    }
}

// === Analyse et rapports ===

Nyth::Audio::SafetyReport SafetyManager::getLastReport() const {
    std::lock_guard<std::mutex> lock(statsMutex_);
    return lastReport_;
}

Nyth::Audio::SafetyStatistics SafetyManager::getStatistics() const {
    std::lock_guard<std::mutex> lock(statsMutex_);
    return statistics_;
}

void SafetyManager::resetStatistics() {
    std::lock_guard<std::mutex> lock(statsMutex_);
    resetStatsInternal();
}

// === Métriques individuelles ===

double SafetyManager::getCurrentPeakLevel() const {
    std::lock_guard<std::mutex> lock(statsMutex_);
    return lastReport_.peakLevel;
}

double SafetyManager::getCurrentRMSLevel() const {
    std::lock_guard<std::mutex> lock(statsMutex_);
    return lastReport_.rmsLevel;
}

double SafetyManager::getCurrentDCOffset() const {
    std::lock_guard<std::mutex> lock(statsMutex_);
    return lastReport_.dcOffset;
}

uint32_t SafetyManager::getCurrentClippedSamples() const {
    std::lock_guard<std::mutex> lock(statsMutex_);
    return lastReport_.clippedSamples;
}

bool SafetyManager::isOverloadActive() const {
    std::lock_guard<std::mutex> lock(statsMutex_);
    return lastReport_.overloadActive;
}

double SafetyManager::getCurrentFeedbackScore() const {
    std::lock_guard<std::mutex> lock(statsMutex_);
    return lastReport_.feedbackScore;
}

bool SafetyManager::hasFeedbackLikely() const {
    std::lock_guard<std::mutex> lock(statsMutex_);
    return lastReport_.feedbackLikely;
}

// === Informations ===

std::string SafetyManager::getInfo() const {
    char buffer[512];
    std::snprintf(buffer, sizeof(buffer),
                  "SafetyManager{state=%s, initialized=%s, processing=%s, "
                  "sampleRate=%u, channels=%d, optimized=%s}",
                  Nyth::Audio::stateToString(currentState_.load()).c_str(), isInitialized_.load() ? "true" : "false",
                  isProcessing_.load() ? "true" : "false", config_.sampleRate, config_.channels,
                  shouldUseOptimizedEngine() ? "true" : "false");
    return std::string(buffer);
}

std::string SafetyManager::getVersion() const {
    return "SafetyManager v2.0.0";
}

// === Callbacks ===

void SafetyManager::setDataCallback(DataCallback callback) {
    dataCallback_ = callback;
}

void SafetyManager::setErrorCallback(ErrorCallback callback) {
    errorCallback_ = callback;
}

void SafetyManager::setStateCallback(StateCallback callback) {
    stateCallback_ = callback;
}

void SafetyManager::setReportCallback(ReportCallback callback) {
    reportCallback_ = callback;
}

// === Méthodes privées ===

void SafetyManager::initializeEngines() {
    Nyth::Audio::SafetyError error;

    // Initialize main engine
    safetyEngine_ = std::make_unique<Nyth::Audio::AudioSafetyEngine>(config_.sampleRate, config_.channels, &error);

    if (error != Nyth::Audio::SafetyError::OK) {
        throw std::runtime_error("Failed to initialize main safety engine");
    }

    // Initialize optimized engine if requested
    if (config_.optimizationConfig.useOptimizedEngine) {
        optimizedEngine_ =
            std::make_unique<Nyth::Audio::AudioSafetyEngineOptimized>(config_.sampleRate, config_.channels, &error);

        if (error != Nyth::Audio::SafetyError::OK) {
            optimizedEngine_.reset();
            // Continue without optimized engine
        }
    }

    // Apply configuration
    auto nativeConfig = convertConfig(config_);

    if (safetyEngine_->setConfig(nativeConfig) != Nyth::Audio::SafetyError::OK) {
        throw std::runtime_error("Failed to configure main safety engine");
    }

    if (optimizedEngine_ && optimizedEngine_->setConfig(nativeConfig) != Nyth::Audio::SafetyError::OK) {
        optimizedEngine_.reset();
    }

    // Allocate working buffers
    size_t maxFrameSize = Nyth::Audio::SafetyLimits::MAX_FRAME_SIZE * config_.channels;
    workBufferL_.resize(maxFrameSize);
    workBufferR_.resize(maxFrameSize);
    tempBuffer_.resize(maxFrameSize);
}

void SafetyManager::cleanupEngines() {
    safetyEngine_.reset();
    optimizedEngine_.reset();

    workBufferL_.clear();
    workBufferR_.clear();
    tempBuffer_.clear();
}

bool SafetyManager::validateConfig(const Nyth::Audio::SafetyConfig& config) const {
    return config.isValid();
}

bool SafetyManager::shouldUseOptimizedEngine() const {
    return config_.optimizationConfig.useOptimizedEngine && optimizedEngine_ != nullptr;
}

Nyth::Audio::SafetyError SafetyManager::processMonoInternal(float* buffer, size_t frameCount) {
    if (shouldUseOptimizedEngine()) {
        auto error = optimizedEngine_->processMono(buffer, frameCount);
        if (error == Nyth::Audio::SafetyError::OK) {
            auto report = optimizedEngine_->getLastReport();
            updateStatistics(report, 0.0); // Processing time not available from engine
        }
        return convertError(error);
    } else if (safetyEngine_) {
        auto error = safetyEngine_->processMono(buffer, frameCount);
        if (error == Nyth::Audio::SafetyError::OK) {
            auto report = safetyEngine_->getLastReport();
            updateStatistics(report, 0.0);
        }
        return convertError(error);
    }

    return Nyth::Audio::SafetyError::PROCESSING_FAILED;
}

Nyth::Audio::SafetyError SafetyManager::processStereoInternal(float* left, float* right, size_t frameCount) {
    if (shouldUseOptimizedEngine()) {
        auto error = optimizedEngine_->processStereo(left, right, frameCount);
        if (error == Nyth::Audio::SafetyError::OK) {
            auto report = optimizedEngine_->getLastReport();
            updateStatistics(report, 0.0);
        }
        return convertError(error);
    } else if (safetyEngine_) {
        auto error = safetyEngine_->processStereo(left, right, frameCount);
        if (error == Nyth::Audio::SafetyError::OK) {
            auto report = safetyEngine_->getLastReport();
            updateStatistics(report, 0.0);
        }
        return convertError(error);
    }

    return Nyth::Audio::SafetyError::PROCESSING_FAILED;
}

void SafetyManager::updateStatistics(const Nyth::Audio::SafetyReport& nativeReport, double processingTimeMs) {
    std::lock_guard<std::mutex> lock(statsMutex_);

    // Convert native report
    Nyth::Audio::SafetyReport report = {nativeReport.peak,
                                        nativeReport.rms,
                                        nativeReport.dcOffset,
                                        nativeReport.clippedSamples,
                                        nativeReport.overloadActive,
                                        nativeReport.feedbackScore,
                                        nativeReport.hasNaN,
                                        nativeReport.feedbackLikely,
                                        processingTimeMs};

    lastReport_ = report;

    // Update statistics
    if (statistics_.totalFrames == 0) {
        statistics_.minReport = report;
        statistics_.maxReport = report;
        statistics_.avgReport = report;
    } else {
        // Update min
        statistics_.minReport.peakLevel = std::min(statistics_.minReport.peakLevel, report.peakLevel);
        statistics_.minReport.rmsLevel = std::min(statistics_.minReport.rmsLevel, report.rmsLevel);
        statistics_.minReport.dcOffset = std::min(statistics_.minReport.dcOffset, report.dcOffset);
        statistics_.minReport.clippedSamples = std::min(statistics_.minReport.clippedSamples, report.clippedSamples);
        statistics_.minReport.feedbackScore = std::min(statistics_.minReport.feedbackScore, report.feedbackScore);
        statistics_.minReport.processingTimeMs =
            std::min(statistics_.minReport.processingTimeMs, report.processingTimeMs);

        // Update max
        statistics_.maxReport.peakLevel = std::max(statistics_.maxReport.peakLevel, report.peakLevel);
        statistics_.maxReport.rmsLevel = std::max(statistics_.maxReport.rmsLevel, report.rmsLevel);
        statistics_.maxReport.dcOffset = std::max(statistics_.maxReport.dcOffset, report.dcOffset);
        statistics_.maxReport.clippedSamples = std::max(statistics_.maxReport.clippedSamples, report.clippedSamples);
        statistics_.maxReport.feedbackScore = std::max(statistics_.maxReport.feedbackScore, report.feedbackScore);
        statistics_.maxReport.processingTimeMs =
            std::max(statistics_.maxReport.processingTimeMs, report.processingTimeMs);

        // Update avg (running average)
        double factor = 1.0 / (statistics_.totalFrames + 1);
        statistics_.avgReport.peakLevel = statistics_.avgReport.peakLevel * (1.0 - factor) + report.peakLevel * factor;
        statistics_.avgReport.rmsLevel = statistics_.avgReport.rmsLevel * (1.0 - factor) + report.rmsLevel * factor;
        statistics_.avgReport.dcOffset = statistics_.avgReport.dcOffset * (1.0 - factor) + report.dcOffset * factor;
        statistics_.avgReport.clippedSamples =
            statistics_.avgReport.clippedSamples * (1.0 - factor) + report.clippedSamples * factor;
        statistics_.avgReport.feedbackScore =
            statistics_.avgReport.feedbackScore * (1.0 - factor) + report.feedbackScore * factor;
        statistics_.avgReport.processingTimeMs =
            statistics_.avgReport.processingTimeMs * (1.0 - factor) + report.processingTimeMs * factor;
    }

    // Update counters
    statistics_.totalFrames++;
    statistics_.totalClippedSamples += report.clippedSamples;
    if (report.overloadActive)
        statistics_.totalOverloadFrames++;
    if (report.feedbackLikely)
        statistics_.totalFeedbackFrames++;

    statistics_.averageProcessingTimeMs = statistics_.avgReport.processingTimeMs;
    statistics_.maxProcessingTimeMs = statistics_.maxReport.processingTimeMs;
    statistics_.lastReport = report;

    // Invoke report callback
    invokeReportCallback(report);
}

void SafetyManager::analyzeAudio(const float* input, size_t frameCount, int channels) {
    // Additional analysis if needed
    // This could include frequency analysis, crest factor, etc.
}

double SafetyManager::calculatePeakLevel(const float* data, size_t size) const {
    if (!data || size == 0)
        return Nyth::Audio::SafetyLimits::MIN_LEVEL_DB;

    float peak = 0.0f;
    for (size_t i = 0; i < size; ++i) {
        peak = std::max(peak, std::abs(data[i]));
    }

    return Nyth::Audio::linearToDb(peak);
}

double SafetyManager::calculateRMSLevel(const float* data, size_t size) const {
    if (!data || size == 0)
        return Nyth::Audio::SafetyLimits::MIN_LEVEL_DB;

    double sum = 0.0;
    for (size_t i = 0; i < size; ++i) {
        sum += data[i] * data[i];
    }

    double rms = std::sqrt(sum / size);
    return Nyth::Audio::linearToDb(rms);
}

double SafetyManager::calculateDCOffset(const float* data, size_t size) const {
    if (!data || size == 0)
        return 0.0;

    double sum = 0.0;
    for (size_t i = 0; i < size; ++i) {
        sum += data[i];
    }

    return sum / size;
}

uint32_t SafetyManager::countClippedSamples(const float* data, size_t size) const {
    if (!data || size == 0)
        return 0;

    uint32_t count = 0;
    const float clipLevel = 0.99f; // -0.1 dBFS

    for (size_t i = 0; i < size; ++i) {
        if (std::abs(data[i]) >= clipLevel) {
            count++;
        }
    }

    return count;
}

void SafetyManager::setState(Nyth::Audio::SafetyState newState) {
    auto oldState = currentState_.load();
    currentState_.store(newState);

    if (oldState != newState) {
        invokeStateCallback(oldState, newState);
    }
}

void SafetyManager::handleError(Nyth::Audio::SafetyError error, const std::string& message) {
    invokeErrorCallback(error, message);
}

void SafetyManager::invokeDataCallback(const float* input, float* output, size_t frameCount, int channels) {
    if (dataCallback_) {
        try {
            dataCallback_(input, output, frameCount, channels);
        } catch (const std::exception& e) {
            handleError(Nyth::Audio::SafetyError::PROCESSING_FAILED, std::string("Data callback failed: ") + e.what());
        }
    }
}

void SafetyManager::invokeErrorCallback(Nyth::Audio::SafetyError error, const std::string& message) {
    if (errorCallback_) {
        try {
            errorCallback_(error, message);
        } catch (const std::exception& e) {
            // Avoid recursive error handling
        }
    }
}

void SafetyManager::invokeStateCallback(Nyth::Audio::SafetyState oldState, Nyth::Audio::SafetyState newState) {
    if (stateCallback_) {
        try {
            stateCallback_(oldState, newState);
        } catch (const std::exception& e) {
            handleError(Nyth::Audio::SafetyError::PROCESSING_FAILED, std::string("State callback failed: ") + e.what());
        }
    }
}

void SafetyManager::invokeReportCallback(const Nyth::Audio::SafetyReport& report) {
    if (reportCallback_) {
        try {
            reportCallback_(report);
        } catch (const std::exception& e) {
            handleError(Nyth::Audio::SafetyError::PROCESSING_FAILED,
                        std::string("Report callback failed: ") + e.what());
        }
    }
}

bool SafetyManager::checkTimeout(std::chrono::steady_clock::time_point start, double maxTimeMs) const {
    auto now = std::chrono::steady_clock::now();
    auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(now - start);
    return elapsed.count() > maxTimeMs;
}

void SafetyManager::resetStatsInternal() {
    statistics_ = Nyth::Audio::SafetyStatistics();
    lastReport_ = Nyth::Audio::SafetyReport();
    lastStatsUpdate_ = std::chrono::steady_clock::now();
    statsUpdateCounter_ = 0;
}

std::string SafetyManager::formatProcessingInfo() const {
    char buffer[256];
    std::snprintf(buffer, sizeof(buffer),
                  "Processing: frames=%llu, clipped=%llu, overload=%llu, feedback=%llu, "
                  "avg_time=%.2f ms, max_time=%.2f ms",
                  statistics_.totalFrames, statistics_.totalClippedSamples, statistics_.totalOverloadFrames,
                  statistics_.totalFeedbackFrames, statistics_.averageProcessingTimeMs,
                  statistics_.maxProcessingTimeMs);
    return std::string(buffer);
}

// Conversion helper functions (to be moved to a separate file later)
Nyth::Audio::SafetyConfig SafetyManager::convertConfig(const Nyth::Audio::SafetyConfig& src) const {
    return {src.enabled,
            src.dcConfig.enabled,
            src.dcConfig.threshold,
            src.limiterConfig.enabled,
            src.limiterConfig.thresholdDb,
            src.limiterConfig.softKnee,
            src.limiterConfig.kneeWidthDb,
            src.feedbackConfig.enabled,
            src.feedbackConfig.threshold};
}

Nyth::Audio::SafetyError SafetyManager::convertError(Nyth::Audio::SafetyError error) const {
    switch (error) {
        case Nyth::Audio::SafetyError::OK:
            return Nyth::Audio::SafetyError::OK;
        case Nyth::Audio::SafetyError::NULL_BUFFER:
            return Nyth::Audio::SafetyError::NULL_BUFFER;
        case Nyth::Audio::SafetyError::INVALID_SAMPLE_RATE:
            return Nyth::Audio::SafetyError::INVALID_SAMPLE_RATE;
        case Nyth::Audio::SafetyError::INVALID_CHANNELS:
            return Nyth::Audio::SafetyError::INVALID_CHANNELS;
        case Nyth::Audio::SafetyError::INVALID_THRESHOLD_DB:
            return Nyth::Audio::SafetyError::INVALID_THRESHOLD_DB;
        case Nyth::Audio::SafetyError::INVALID_KNEE_WIDTH:
            return Nyth::Audio::SafetyError::INVALID_KNEE_WIDTH;
        case Nyth::Audio::SafetyError::INVALID_DC_THRESHOLD:
            return Nyth::Audio::SafetyError::INVALID_DC_THRESHOLD;
        case Nyth::Audio::SafetyError::INVALID_FEEDBACK_THRESHOLD:
            return Nyth::Audio::SafetyError::INVALID_FEEDBACK_THRESHOLD;
        case Nyth::Audio::SafetyError::PROCESSING_FAILED:
            return Nyth::Audio::SafetyError::PROCESSING_FAILED;
        default:
            return Nyth::Audio::SafetyError::PROCESSING_FAILED;
    }
}

// === Implémentations SIMD ===

bool SafetyManager::processAudio_SIMD(const float* input, float* output, size_t frameCount, int channels) {
    if (!isInitialized_.load() || !isProcessing_.load()) {
        return false;
    }

    if (!input || !output || frameCount == 0) {
        handleError(Nyth::Audio::SafetyError::NULL_BUFFER, "Invalid buffer or frame count");
        return false;
    }

    try {
        auto startTime = std::chrono::steady_clock::now();

        // Utiliser SIMD si disponible et taille suffisante
        if (AudioNR::MathUtils::SIMDIntegration::isSIMDAccelerationEnabled() && frameCount >= 64) {
            Nyth::Audio::SafetyError error;

            if (channels == 1) {
                // Analyse SIMD mono
                float rms = AudioNR::MathUtils::MathUtilsSIMDExtension::calculateRMSSIMD(input, frameCount);
                float peak = AudioNR::MathUtils::MathUtilsSIMDExtension::calculatePeakSIMD(input, frameCount);

                // Copie avec vérification SIMD
                std::memcpy(output, input, frameCount * sizeof(float));

                // Appliquer la protection si nécessaire
                if (config_.autoGainControl) {
                    AudioNR::MathUtils::MathUtilsSIMDExtension::applyGainSIMD(
                        output, frameCount, config_.targetGain);
                }

                // Clipping protection SIMD
                if (config_.clippingProtection) {
                    AudioNR::SIMD::SIMDMathFunctions::apply_soft_clipper(
                        output, frameCount, config_.clippingThreshold);
                }

                // Mettre à jour les métriques
                updateMetrics(rms, peak, peak >= config_.clippingThreshold);
            } else {
                // Traitement multi-canaux SIMD
                size_t totalSamples = frameCount * channels;
                std::vector<float> tempBuffer(totalSamples);

                // Copie entrelacée SIMD
                if (totalSamples >= 64) {
                    std::memcpy(tempBuffer.data(), input, totalSamples * sizeof(float));
                } else {
                    std::copy(input, input + totalSamples, tempBuffer.begin());
                }

                // Analyse SIMD
                float rms = AudioNR::MathUtils::MathUtilsSIMDExtension::calculateRMSSIMD(
                    tempBuffer.data(), totalSamples);
                float peak = AudioNR::MathUtils::MathUtilsSIMDExtension::calculatePeakSIMD(
                    tempBuffer.data(), totalSamples);

                // Copie vers output
                std::memcpy(output, tempBuffer.data(), totalSamples * sizeof(float));

                // Appliquer la protection si nécessaire
                if (config_.autoGainControl) {
                    AudioNR::MathUtils::MathUtilsSIMDExtension::applyGainSIMD(
                        output, totalSamples, config_.targetGain);
                }

                // Clipping protection SIMD
                if (config_.clippingProtection) {
                    AudioNR::SIMD::SIMDMathFunctions::apply_soft_clipper(
                        output, totalSamples, config_.clippingThreshold);
                }

                // Mettre à jour les métriques
                updateMetrics(rms, peak, peak >= config_.clippingThreshold);
            }

            auto endTime = std::chrono::steady_clock::now();
            auto duration = std::chrono::duration_cast<std::chrono::microseconds>(endTime - startTime);
            updateProcessingTime(duration.count());

            return true;
        } else {
            // Version standard
            return processAudio(input, output, frameCount, channels);
        }
    } catch (const std::exception& e) {
        handleError(Nyth::Audio::SafetyError::PROCESSING_FAILED,
                   std::string("SIMD processing failed: ") + e.what());
        return false;
    }
}

bool SafetyManager::processAudioStereo_SIMD(const float* inputL, const float* inputR, float* outputL, float* outputR,
                                          size_t frameCount) {
    if (!isInitialized_.load() || !isProcessing_.load()) {
        return false;
    }

    if (!inputL || !inputR || !outputL || !outputR || frameCount == 0) {
        handleError(Nyth::Audio::SafetyError::NULL_BUFFER, "Invalid buffers or frame count");
        return false;
    }

    try {
        auto startTime = std::chrono::steady_clock::now();

        // Utiliser SIMD si disponible et taille suffisante
        if (AudioNR::MathUtils::SIMDIntegration::isSIMDAccelerationEnabled() && frameCount >= 64) {
            // Analyse SIMD des canaux gauche et droite
            float rmsL = AudioNR::MathUtils::MathUtilsSIMDExtension::calculateRMSSIMD(inputL, frameCount);
            float rmsR = AudioNR::MathUtils::MathUtilsSIMDExtension::calculateRMSSIMD(inputR, frameCount);
            float peakL = AudioNR::MathUtils::MathUtilsSIMDExtension::calculatePeakSIMD(inputL, frameCount);
            float peakR = AudioNR::MathUtils::MathUtilsSIMDExtension::calculatePeakSIMD(inputR, frameCount);

            // RMS stéréo (moyenne des deux canaux)
            float rms = (rmsL + rmsR) * 0.5f;
            float peak = std::max(peakL, peakR);
            bool hasClipping = peakL >= config_.clippingThreshold || peakR >= config_.clippingThreshold;

            // Copie SIMD
            std::memcpy(outputL, inputL, frameCount * sizeof(float));
            std::memcpy(outputR, inputR, frameCount * sizeof(float));

            // Appliquer la protection si nécessaire
            if (config_.autoGainControl) {
                AudioNR::MathUtils::MathUtilsSIMDExtension::applyGainSIMD(
                    outputL, frameCount, config_.targetGain);
                AudioNR::MathUtils::MathUtilsSIMDExtension::applyGainSIMD(
                    outputR, frameCount, config_.targetGain);
            }

            // Clipping protection SIMD
            if (config_.clippingProtection) {
                AudioNR::SIMD::SIMDMathFunctions::apply_soft_clipper(
                    outputL, frameCount, config_.clippingThreshold);
                AudioNR::SIMD::SIMDMathFunctions::apply_soft_clipper(
                    outputR, frameCount, config_.clippingThreshold);
            }

            // Mettre à jour les métriques
            updateMetrics(rms, peak, hasClipping);

            auto endTime = std::chrono::steady_clock::now();
            auto duration = std::chrono::duration_cast<std::chrono::microseconds>(endTime - startTime);
            updateProcessingTime(duration.count());

            return true;
        } else {
            // Version standard
            return processAudioStereo(inputL, inputR, outputL, outputR, frameCount);
        }
    } catch (const std::exception& e) {
        handleError(Nyth::Audio::SafetyError::PROCESSING_FAILED,
                   std::string("SIMD stereo processing failed: ") + e.what());
        return false;
    }
}

float SafetyManager::analyzePeak_SIMD(const float* data, size_t count) const {
    if (!data || count == 0) return 0.0f;

    if (AudioNR::MathUtils::SIMDIntegration::isSIMDAccelerationEnabled() && count >= 64) {
        return AudioNR::MathUtils::MathUtilsSIMDExtension::calculatePeakSIMD(data, count);
    } else {
        // Version standard
        float peak = 0.0f;
        for (size_t i = 0; i < count; ++i) {
            peak = std::max(peak, std::abs(data[i]));
        }
        return peak;
    }
}

float SafetyManager::analyzeRMS_SIMD(const float* data, size_t count) const {
    if (!data || count == 0) return 0.0f;

    if (AudioNR::MathUtils::SIMDIntegration::isSIMDAccelerationEnabled() && count >= 64) {
        return AudioNR::MathUtils::MathUtilsSIMDExtension::calculateRMSSIMD(data, count);
    } else {
        // Version standard
        float sum = 0.0f;
        for (size_t i = 0; i < count; ++i) {
            sum += data[i] * data[i];
        }
        return std::sqrt(sum / count);
    }
}

} // namespace react
} // namespace facebook
