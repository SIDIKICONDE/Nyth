#pragma once

#include <atomic>
#include <memory>
#include <string>
#include <vector>
#include <mutex>

#include "../config/NoiseConfig.h"
#include "../../jsi/JSICallbackManager.h"

namespace facebook {
namespace react {

class NoiseManager {
public:
    explicit NoiseManager(std::shared_ptr<JSICallbackManager> callbackManager);
    ~NoiseManager();

    // === Cycle de vie ===
    bool initialize(const Nyth::Audio::NoiseConfig& config);
    bool isInitialized() const;
    void release();

    // === Configuration ===
    bool setConfig(const Nyth::Audio::NoiseConfig& config);
    Nyth::Audio::NoiseConfig getConfig() const;
    bool setAlgorithm(Nyth::Audio::NoiseAlgorithm algorithm);
    bool setAggressiveness(float aggressiveness);

    // === Contrôle ===
    bool start();
    bool stop();
    bool isProcessing() const;

    // === Traitement audio ===
    bool processAudio(const float* input, float* output, size_t frameCount, int channels);
    bool processAudioStereo(const float* inputL, const float* inputR,
                            float* outputL, float* outputR, size_t frameCount);

    // === Statistiques et métriques ===
    Nyth::Audio::NoiseStatistics getStatistics() const;
    float getInputLevel() const;
    float getOutputLevel() const;
    float getEstimatedSNR() const;
    float getSpeechProbability() const;
    float getMusicalNoiseLevel() const;
    void resetStatistics();

    // === Informations ===
    std::string getInfo() const;
    Nyth::Audio::NoiseState getState() const;

    // === Callbacks ===
    using StatisticsCallback = std::function<void(const Nyth::Audio::NoiseStatistics& stats)>;
    using ProcessingCallback = std::function<void(const float* input, const float* output, size_t frameCount)>;
    void setStatisticsCallback(StatisticsCallback callback);
    void setProcessingCallback(ProcessingCallback callback);

private:
    // === Composants AudioNR ===
    std::unique_ptr<AudioNR::AdvancedSpectralNR> advancedSpectralNR_;
    std::unique_ptr<AudioNR::NoiseReducer> noiseReducer_;

    // === Gestionnaire de callbacks ===
    std::shared_ptr<JSICallbackManager> callbackManager_;

    // === Configuration ===
    Nyth::Audio::NoiseConfig config_;

    // === État ===
    std::atomic<Nyth::Audio::NoiseState> currentState_{Nyth::Audio::NoiseState::UNINITIALIZED};
    std::atomic<bool> isInitialized_{false};

    // === Statistiques ===
    mutable std::mutex statsMutex_;
    Nyth::Audio::NoiseStatistics currentStats_;

    // === Buffers de travail ===
    std::vector<float> workBufferL_;
    std::vector<float> workBufferR_;

    // === Callbacks ===
    StatisticsCallback statisticsCallback_;
    ProcessingCallback processingCallback_;

    // === Méthodes privées ===
    void initializeNoiseSystem();
    void updateStatistics(const float* input, const float* output, size_t frameCount, int channels);
    void notifyStatisticsCallback();
    void notifyProcessingCallback(const float* input, const float* output, size_t frameCount);
    bool validateConfig(const Nyth::Audio::NoiseConfig& config) const;

    // === Helpers ===
    float calculateRMS(const float* data, size_t size) const;
    void resetStatsInternal();
};

} // namespace react
} // namespace facebook
