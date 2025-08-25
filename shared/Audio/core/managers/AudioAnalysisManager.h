#pragma once

#include <cstddef>
#include <cstdint>
#include <atomic>
#include <functional>
#include <memory>
#include <mutex>
#include <vector>

#include "../../common/config/AudioConfig.hpp"
#include "../../common/jsi/JSICallbackManager.h"

namespace facebook {
namespace react {

class AudioAnalysisManager {
public:
    explicit AudioAnalysisManager(std::shared_ptr<JSICallbackManager> callbackManager);
    ~AudioAnalysisManager();

    // === Cycle de vie ===
    bool initialize(const Nyth::Audio::AudioConfig& config);
    bool isInitialized() const;
    void release();

    // === Configuration d'analyse ===
    bool setAnalysisConfig(int analysisIntervalMs = 100, double silenceThreshold = -60.0,
                           double clippingThreshold = -1.0, bool enableFrequencyAnalysis = true);
    bool setFrequencyBands(const std::vector<double>& bands); // Fréquences en Hz

    // === Contrôle d'analyse ===
    bool startAnalysis();
    bool stopAnalysis();
    bool isAnalyzing() const;

    // === Analyse temps réel ===
    bool processAudioData(const float* data, size_t frameCount, int channels);
    bool processAudioDataStereo(const float* leftData, const float* rightData, size_t frameCount);

    // === Métriques audio ===
    struct AudioMetrics {
        double rmsLevel;         // Niveau RMS en dB
        double peakLevel;        // Niveau de crête en dB
        double averageLevel;     // Niveau moyen en dB
        bool hasClipping;        // Indique si il y a clipping
        bool isSilent;           // Indique si c'est silencieux
        double silenceDuration;  // Durée du silence en secondes
        double clippingDuration; // Durée du clipping en secondes
    };

    AudioMetrics getCurrentMetrics() const;

    // === Analyse fréquentielle ===
    struct FrequencyAnalysis {
        std::vector<double> magnitudes;  // Magnitudes par bande
        std::vector<double> frequencies; // Fréquences centrales des bandes
        double spectralCentroid;         // Centroïde spectral
        double spectralRolloff;          // Roll-off spectral
        double spectralFlux;             // Flux spectral
    };

    FrequencyAnalysis getFrequencyAnalysis() const;

    // === Statistiques globales ===
    struct AnalysisStats {
        uint32_t totalFramesProcessed;
        uint32_t silenceFrames;
        uint32_t clippingFrames;
        double maxPeakLevel;
        double minRMSLevel;
        double averageRMSLevel;
        uint32_t analysisDurationMs;
    };

    AnalysisStats getAnalysisStats() const;
    void resetStats();

    // === Callbacks d'événements ===
    using AnalysisCallback = std::function<void(const AudioMetrics& metrics)>;
    using FrequencyCallback = std::function<void(const FrequencyAnalysis& analysis)>;
    using EventCallback = std::function<void(const std::string& event, const std::string& data)>;

    void setAnalysisCallback(AnalysisCallback callback);
    void setFrequencyCallback(FrequencyCallback callback);
    void setEventCallback(EventCallback callback);

    // === Utilitaires ===
    static double linearToDecibels(double linear);
    static double decibelsToLinear(double db);
    static bool isFrequencyValid(double frequency, double sampleRate);

private:
    // === Membres privés ===
    std::shared_ptr<JSICallbackManager> callbackManager_;

    Nyth::Audio::AudioConfig config_;
    mutable std::mutex analysisMutex_;
    std::atomic<bool> isInitialized_{false};
    std::atomic<bool> isAnalyzing_{false};

    // Configuration d'analyse
    int analysisIntervalMs_;
    double silenceThreshold_;  // Seuil de silence en dB
    double clippingThreshold_; // Seuil de clipping en dB
    bool enableFrequencyAnalysis_;
    std::vector<double> frequencyBands_; // Bandes de fréquences pour l'analyse

    // État d'analyse
    AudioMetrics currentMetrics_;
    FrequencyAnalysis currentFrequencyAnalysis_;
    AnalysisStats analysisStats_;

    // Buffers pour l'analyse
    std::vector<float> analysisBuffer_;
    size_t bufferIndex_;
    std::chrono::steady_clock::time_point lastAnalysisTime_;

    // Callbacks
    AnalysisCallback analysisCallback_;
    FrequencyCallback frequencyCallback_;
    EventCallback eventCallback_;

    // === Méthodes privées ===
    void resetMetrics();
    void updateMetrics(const float* data, size_t frameCount, int channels);
    void updateFrequencyAnalysis(const float* data, size_t frameCount, int channels);
    void checkForEvents();

    // Analyseurs
    double calculateRMS(const float* data, size_t frameCount) const;
    double calculatePeak(const float* data, size_t frameCount) const;
    double calculateAverage(const float* data, size_t frameCount) const;
    bool detectClipping(const float* data, size_t frameCount, double threshold) const;

    // Analyse fréquentielle
    std::vector<double> performFFT(const float* data, size_t frameCount) const;
    std::vector<double> calculateBandMagnitudes(const std::vector<double>& fftData) const;
    double calculateSpectralCentroid(const std::vector<double>& magnitudes) const;
    double calculateSpectralRolloff(const std::vector<double>& magnitudes, double rolloffPercent = 0.85) const;
    double calculateSpectralFlux(const std::vector<double>& currentMagnitudes,
                                 const std::vector<double>& previousMagnitudes) const;

    // Utilitaires
    void notifyAnalysisEvent(const AudioMetrics& metrics);
    void notifyFrequencyEvent(const FrequencyAnalysis& analysis);
    void notifyGeneralEvent(const std::string& event, const std::string& data = "");
    bool shouldPerformAnalysis() const;
    void initializeDefaultBands();
};

} // namespace react
} // namespace facebook
