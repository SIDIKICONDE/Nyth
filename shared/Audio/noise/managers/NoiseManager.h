#pragma once

#include <atomic>
#include <functional>
#include <memory>
#include <mutex>
#include <string>
#include <vector>

#include "../../common/jsi/JSICallbackManager.h"
#include "../components/Noise/NoiseReducer.hpp"
#include "../components/Spectral/AdvancedSpectralNR.hpp"
#include "../components/Spectral/SpectralNR.hpp"
#include "../config/NoiseConfig.h"
#include "../../common/SIMD/SIMDIntegration.hpp"

namespace facebook {
namespace react {

/**
 * @brief Gestionnaire principal pour la réduction de bruit audio
 *
 * Ce manager coordonne tous les composants de réduction de bruit :
 * - AdvancedSpectralNR : Algorithme hybride complet (IMCRA + Wiener + Multiband)
 * - SpectralNR : Réduction spectrale classique
 * - NoiseReducer : Gate/expander simple
 *
 * Supporte 6 algorithmes : ADVANCED_SPECTRAL, WIENER_FILTER, MULTIBAND,
 * TWO_STEP, HYBRID, SPECTRAL_SUBTRACTION
 */
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
    bool processAudioStereo(const float* inputL, const float* inputR, float* outputL, float* outputR,
                            size_t frameCount);

    // === Méthodes SIMD ===
    bool processAudio_SIMD(const float* input, float* output, size_t frameCount, int channels);
    bool processAudioStereo_SIMD(const float* inputL, const float* inputR, float* outputL, float* outputR,
                                 size_t frameCount);
    float analyzeLevel_SIMD(const float* data, size_t count) const;

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

    // === Méthodes privées SIMD ===
    void applyNoiseReduction_SIMD(float* data, size_t count);

    // === Callbacks ===
    using StatisticsCallback = std::function<void(const Nyth::Audio::NoiseStatistics& stats)>;
    using ProcessingCallback = std::function<void(const float* input, const float* output, size_t frameCount)>;
    void setStatisticsCallback(StatisticsCallback callback);
    void setProcessingCallback(ProcessingCallback callback);

private:
    // === Composants AudioNR connectés ===
    std::unique_ptr<AudioNR::AdvancedSpectralNR> advancedSpectralNR_;
    std::unique_ptr<AudioNR::SpectralNR> spectralNR_;
    std::unique_ptr<AudioNR::NoiseReducer> noiseReducer_;

    // === Gestionnaire de callbacks ===
    std::shared_ptr<JSICallbackManager> callbackManager_;

    // === Configuration ===
    Nyth::Audio::NoiseConfig config_;

    // === État ===
    std::atomic<Nyth::Audio::NoiseState> currentState_{Nyth::Audio::NoiseState::UNINITIALIZED};
    std::atomic<bool> isInitialized_{false};

    // === Synchronisation ===
    mutable std::mutex mutex_;      // Mutex principal pour la synchronisation
    mutable std::mutex statsMutex_; // Mutex pour les statistiques
    Nyth::Audio::NoiseStatistics currentStats_;

    // === Buffers de travail ===
    std::vector<float> workBufferL_;
    std::vector<float> workBufferR_;
    std::vector<float> intermediateBuffer_;

    // === Callbacks ===
    StatisticsCallback statisticsCallback_;
    ProcessingCallback processingCallback_;

    // === Méthodes privées ===
    void initializeNoiseComponents();
    void connectComponents();
    void updateStatistics(const float* input, const float* output, size_t frameCount, int channels);
    void notifyStatisticsCallback();
    bool validateConfig(const Nyth::Audio::NoiseConfig& config) const;

    // === Helpers ===
    float calculateRMS(const float* data, size_t size) const;
    void handleError(const std::string& error);
    std::string formatStatisticsToJSON(const Nyth::Audio::NoiseStatistics& stats) const;

    // === Pipeline de traitement ===
    bool processWithPipeline(const float* input, float* output, size_t frameCount, int channels);
    void setupProcessingPipeline();
};

} // namespace react
} // namespace facebook
