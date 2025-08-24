#pragma once

#include <atomic>
#include <chrono>
#include <functional>
#include <memory>
#include <mutex>
#include <string>
#include <vector>


#include "../../jsi/JSICallbackManager.h"
#include "../config/SafetyConfig.h"

namespace facebook {
namespace react {

class SafetyManager {
public:
    explicit SafetyManager(std::shared_ptr<JSICallbackManager> callbackManager);
    ~SafetyManager();

    // === Cycle de vie ===
    bool initialize(const Nyth::Audio::SafetyConfig& config);
    bool isInitialized() const;
    void release();

    // === Configuration ===
    bool setConfig(const Nyth::Audio::SafetyConfig& config);
    Nyth::Audio::SafetyConfig getConfig() const;
    bool updateConfig(const Nyth::Audio::SafetyConfig& config);

    // === Contrôle ===
    bool start();
    bool stop();
    bool isProcessing() const;
    Nyth::Audio::SafetyState getState() const;

    // === Traitement audio ===
    bool processAudio(const float* input, float* output, size_t frameCount, int channels);
    bool processAudioStereo(const float* inputL, const float* inputR, float* outputL, float* outputR,
                            size_t frameCount);

    // === Analyse et rapports ===
    Nyth::Audio::SafetyReport getLastReport() const;
    Nyth::Audio::SafetyStatistics getStatistics() const;
    void resetStatistics();

    // === Métriques individuelles ===
    double getCurrentPeakLevel() const;
    double getCurrentRMSLevel() const;
    double getCurrentDCOffset() const;
    uint32_t getCurrentClippedSamples() const;
    bool isOverloadActive() const;
    double getCurrentFeedbackScore() const;
    bool hasFeedbackLikely() const;

    // === Informations ===
    std::string getInfo() const;
    std::string getVersion() const;

    // === Callbacks ===
    using DataCallback = std::function<void(const float* input, float* output, size_t frameCount, int channels)>;
    using ErrorCallback = std::function<void(Nyth::Audio::SafetyError error, const std::string& message)>;
    using StateCallback = std::function<void(Nyth::Audio::SafetyState oldState, Nyth::Audio::SafetyState newState)>;
    using ReportCallback = std::function<void(const Nyth::Audio::SafetyReport& report)>;

    void setDataCallback(DataCallback callback);
    void setErrorCallback(ErrorCallback callback);
    void setStateCallback(StateCallback callback);
    void setReportCallback(ReportCallback callback);

private:
    // === Moteurs de sécurité ===
    std::unique_ptr<AudioSafety::AudioSafetyEngine> safetyEngine_;
    std::unique_ptr<AudioSafety::AudioSafetyEngineOptimized> optimizedEngine_;

    // === Gestionnaire de callbacks ===
    std::shared_ptr<JSICallbackManager> callbackManager_;

    // === Configuration ===
    Nyth::Audio::SafetyConfig config_;

    // === État ===
    std::atomic<Nyth::Audio::SafetyState> currentState_{Nyth::Audio::SafetyState::UNINITIALIZED};
    std::atomic<bool> isInitialized_{false};
    std::atomic<bool> isProcessing_{false};

    // === Statistiques ===
    mutable std::mutex statsMutex_;
    Nyth::Audio::SafetyStatistics statistics_;
    Nyth::Audio::SafetyReport lastReport_;
    std::chrono::steady_clock::time_point lastStatsUpdate_;
    uint32_t statsUpdateCounter_ = 0;

    // === Buffers de travail ===
    std::vector<float> workBufferL_;
    std::vector<float> workBufferR_;
    std::vector<float> tempBuffer_;

    // === Mutex pour thread safety ===
    mutable std::mutex mutex_;

    // === Callbacks ===
    DataCallback dataCallback_;
    ErrorCallback errorCallback_;
    StateCallback stateCallback_;
    ReportCallback reportCallback_;

    // === Méthodes privées ===
    void initializeEngines();
    void cleanupEngines();
    bool validateConfig(const Nyth::Audio::SafetyConfig& config) const;
    bool shouldUseOptimizedEngine() const;

    // Traitement interne
    Nyth::Audio::SafetyError processMonoInternal(float* buffer, size_t frameCount);
    Nyth::Audio::SafetyError processStereoInternal(float* left, float* right, size_t frameCount);

    // Analyse et statistiques
    void updateStatistics(const AudioSafety::SafetyReport& nativeReport, double processingTimeMs);
    void analyzeAudio(const float* input, size_t frameCount, int channels);
    double calculatePeakLevel(const float* data, size_t size) const;
    double calculateRMSLevel(const float* data, size_t size) const;
    double calculateDCOffset(const float* data, size_t size) const;
    uint32_t countClippedSamples(const float* data, size_t size) const;

    // Gestion d'état
    void setState(Nyth::Audio::SafetyState newState);
    void handleError(Nyth::Audio::SafetyError error, const std::string& message);

    // Callbacks
    void invokeDataCallback(const float* input, float* output, size_t frameCount, int channels);
    void invokeErrorCallback(Nyth::Audio::SafetyError error, const std::string& message);
    void invokeStateCallback(Nyth::Audio::SafetyState oldState, Nyth::Audio::SafetyState newState);
    void invokeReportCallback(const Nyth::Audio::SafetyReport& report);

    // Utilitaires
    bool checkTimeout(std::chrono::steady_clock::time_point start, double maxTimeMs) const;
    void resetStatsInternal();
    std::string formatProcessingInfo() const;
};

} // namespace react
} // namespace facebook

