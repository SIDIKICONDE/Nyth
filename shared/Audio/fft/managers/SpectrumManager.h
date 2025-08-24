#pragma once

#include <atomic>
#include <memory>
#include <vector>

#include "../../fft/FFTEngine.hpp"
#include "../config/SpectrumConfig.h"

namespace Nyth {
namespace Audio {

// === Interface du gestionnaire d'analyse spectrale ===

class SpectrumManager {
public:
    SpectrumManager();
    ~SpectrumManager();

    // === Cycle de vie ===
    bool initialize(const SpectrumConfig& config);
    void release();
    bool isInitialized() const;

    // === Configuration ===
    bool setConfig(const SpectrumConfig& config);
    const SpectrumConfig& getConfig() const;

    // === Contrôle de l'analyse ===
    bool start();
    bool stop();
    bool isAnalyzing() const;

    // === Traitement audio ===
    bool processAudioBuffer(const float* audioBuffer, size_t numSamples);
    bool processAudioBufferStereo(const float* audioBufferL, const float* audioBufferR, size_t numSamples);

    // === Récupération des données ===
    const SpectrumData& getLastSpectrumData() const;
    const SpectrumStatistics& getStatistics() const;
    void resetStatistics();

    // === Callbacks ===
    using SpectrumDataCallback = std::function<void(const SpectrumData& data)>;
    using SpectrumErrorCallback = std::function<void(SpectrumError error, const std::string& message)>;
    using SpectrumStateCallback = std::function<void(SpectrumState oldState, SpectrumState newState)>;

    void setDataCallback(SpectrumDataCallback callback);
    void setErrorCallback(SpectrumErrorCallback callback);
    void setStateCallback(SpectrumStateCallback callback);

    // === État ===
    SpectrumState getState() const;
    std::string getLastError() const;

private:
    // === Membres privés ===

    // Configuration et état
    SpectrumConfig config_;
    std::atomic<SpectrumState> state_;
    std::string lastError_;

    // Données spectrales
    SpectrumData lastSpectrumData_;
    SpectrumStatistics statistics_;

    // Buffers de travail
    std::vector<float> audioBuffer_;
    std::vector<float> windowBuffer_;
    std::vector<float> fftRealBuffer_;
    std::vector<float> fftImagBuffer_;
    std::vector<float> magnitudesBuffer_;
    std::vector<float> frequencyBandsBuffer_;

    // Moteur FFT
    std::unique_ptr<AudioFX::IFFTEngine> fftEngine_;

    // Callbacks
    SpectrumDataCallback dataCallback_;
    SpectrumErrorCallback errorCallback_;
    SpectrumStateCallback stateCallback_;

    // === Méthodes privées ===

    // Initialisation
    bool initializeFFT();
    void calculateFrequencyBands();
    void createHannWindow();

    // Traitement
    bool processFFT(const float* audioData, size_t numSamples);
    void applyWindowing(std::vector<float>& buffer);
    float calculateMagnitude(float real, float imag) const;

    // Analyse spectrale
    void updateStatistics();
    void computeSpectralFeatures();

    // Utilitaires
    void setState(SpectrumState newState);
    void handleError(SpectrumError error, const std::string& message);
    void notifyDataCallback();
    void resetBuffers();
};

} // namespace Audio
} // namespace Nyth
