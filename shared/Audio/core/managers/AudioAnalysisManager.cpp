#include "AudioAnalysisManager.h"
#include <algorithm>
#include <cmath>
#include <cstddef>
#include <numeric>
#include <cstdint>

namespace facebook {
namespace react {

AudioAnalysisManager::AudioAnalysisManager(std::shared_ptr<JSICallbackManager> callbackManager)
    : callbackManager_(callbackManager),
      analysisIntervalMs_(100),
      silenceThreshold_(-60.0),
      clippingThreshold_(-1.0),
      enableFrequencyAnalysis_(true),
      bufferIndex_(0) {
    resetMetrics();
    initializeDefaultBands();
}

AudioAnalysisManager::~AudioAnalysisManager() {
    if (isAnalyzing_.load()) {
        stopAnalysis();
    }
    release();
}

// === Cycle de vie ===
bool AudioAnalysisManager::initialize(const Nyth::Audio::AudioConfig& config) {
    std::lock_guard<std::mutex> lock(analysisMutex_);

    try {
        // Nettoyer l'instance existante
        if (isInitialized_.load()) {
            release();
        }

        config_ = config;

        // Initialiser les buffers
        size_t bufferSize = static_cast<size_t>(config.sampleRate * analysisIntervalMs_ / 1000.0);
        analysisBuffer_.resize(bufferSize * 2); // Stéréo
        bufferIndex_ = 0;

        resetMetrics();
        resetStats();

        isInitialized_.store(true);
        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to initialize analysis: ") + e.what());
        }
        return false;
    }
}

bool AudioAnalysisManager::isInitialized() const {
    return isInitialized_.load();
}

void AudioAnalysisManager::release() {
    std::lock_guard<std::mutex> lock(analysisMutex_);

    stopAnalysis();

    // Nettoyer les ressources
    analysisBuffer_.clear();
    bufferIndex_ = 0;
    isInitialized_.store(false);
}

// === Configuration d'analyse ===
bool AudioAnalysisManager::setAnalysisConfig(int analysisIntervalMs, double silenceThreshold, double clippingThreshold,
                                             bool enableFrequencyAnalysis) {
    std::lock_guard<std::mutex> lock(analysisMutex_);

    if (isAnalyzing_.load()) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback("Cannot change config while analyzing");
        }
        return false;
    }

    try {
        // Valider les paramètres
        if (analysisIntervalMs < 10 || analysisIntervalMs > 1000) {
            throw std::invalid_argument("Analysis interval must be between 10 and 1000 ms");
        }

        if (silenceThreshold > -20.0) {
            throw std::invalid_argument("Silence threshold should be lower than -20 dB");
        }

        if (clippingThreshold > 0.0) {
            throw std::invalid_argument("Clipping threshold should be negative");
        }

        analysisIntervalMs_ = analysisIntervalMs;
        silenceThreshold_ = silenceThreshold;
        clippingThreshold_ = clippingThreshold;
        enableFrequencyAnalysis_ = enableFrequencyAnalysis;

        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to set analysis config: ") + e.what());
        }
        return false;
    }
}

bool AudioAnalysisManager::setFrequencyBands(const std::vector<double>& bands)
{
    std::lock_guard<std::mutex> lock(analysisMutex_);

    if (isAnalyzing_.load()) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback("Cannot change frequency bands while analyzing");
        }
        return false;
    }

    try {
        // Valider les bandes de fréquences
        if (bands.empty()) {
            throw std::invalid_argument("Frequency bands cannot be empty");
        }

        // Vérifier que les fréquences sont croissantes et valides
        for (size_t i = 0; i < bands.size(); ++i) {
            if (bands[i] <= 0.0 || bands[i] >= config_.sampleRate / 2.0) {
                throw std::invalid_argument("Invalid frequency in band: " + std::to_string(bands[i]));
            }
            if (i > 0 && bands[i] <= bands[i - 1]) {
                throw std::invalid_argument("Frequency bands must be strictly increasing");
            }
        }

        frequencyBands_ = bands;
        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to set frequency bands: ") + e.what());
        }
        return false;
    }
}

// === Contrôle d'analyse ===
bool AudioAnalysisManager::startAnalysis() {
    std::lock_guard<std::mutex> lock(analysisMutex_);

    if (!isInitialized_.load()) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback("Analysis manager not initialized");
        }
        return false;
    }

    if (isAnalyzing_.load()) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback("Analysis already in progress");
        }
        return false;
    }

    try {
        resetStats();
        isAnalyzing_.store(true);
        lastAnalysisTime_ = std::chrono::steady_clock::now();

        notifyGeneralEvent("analysis_started");
        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to start analysis: ") + e.what());
        }
        return false;
    }
}

bool AudioAnalysisManager::stopAnalysis() {
    std::lock_guard<std::mutex> lock(analysisMutex_);

    if (!isAnalyzing_.load()) {
        return false;
    }

    try {
        isAnalyzing_.store(false);
        notifyGeneralEvent("analysis_stopped");
        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to stop analysis: ") + e.what());
        }
        return false;
    }
}

bool AudioAnalysisManager::isAnalyzing() const {
    return isAnalyzing_.load();
}

// === Analyse temps réel ===
bool AudioAnalysisManager::processAudioData(const float* data, size_t frameCount, int channels) {
    if (!isInitialized_.load() || !isAnalyzing_.load()) {
        return false;
    }

    if (!data || frameCount == 0 || channels < 1 || channels > 2) {
        return false;
    }

    std::lock_guard<std::mutex> lock(analysisMutex_);

    try {
        // Ajouter les données au buffer d'analyse
        for (size_t i = 0; i < frameCount; ++i) {
            for (int ch = 0; ch < channels; ++ch) {
                if (bufferIndex_ < analysisBuffer_.size()) {
                    analysisBuffer_[bufferIndex_] = data[i * channels + ch];
                    bufferIndex_++;
                }
            }
        }

        // Vérifier si on doit effectuer l'analyse
        if (shouldPerformAnalysis()) {
            updateMetrics(analysisBuffer_.data(), bufferIndex_ / channels, channels);

            if (enableFrequencyAnalysis_) {
                updateFrequencyAnalysis(analysisBuffer_.data(), bufferIndex_ / channels, channels);
            }

            checkForEvents();

            // Notifier les callbacks
            if (analysisCallback_) {
                notifyAnalysisEvent(currentMetrics_);
            }

            if (enableFrequencyAnalysis_ && frequencyCallback_) {
                notifyFrequencyEvent(currentFrequencyAnalysis_);
            }

            // Reset buffer
            bufferIndex_ = 0;
            lastAnalysisTime_ = std::chrono::steady_clock::now();
        }

        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to process audio data: ") + e.what());
        }
        return false;
    }
}

bool AudioAnalysisManager::processAudioDataStereo(const float* leftData, const float* rightData, size_t frameCount) {
    if (!isInitialized_.load() || !isAnalyzing_.load()) {
        return false;
    }

    if (!leftData || !rightData || frameCount == 0) {
        return false;
    }

    std::lock_guard<std::mutex> lock(analysisMutex_);

    try {
        // Interleave les données stéréo
        std::vector<float> interleavedData(frameCount * 2);

        for (size_t i = 0; i < frameCount; ++i) {
            interleavedData[i * 2] = leftData[i];
            interleavedData[i * 2 + 1] = rightData[i];
        }

        return processAudioData(interleavedData.data(), frameCount, 2);
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to process stereo audio data: ") + e.what());
        }
        return false;
    }
}

// === Métriques audio ===
AudioAnalysisManager::AudioMetrics AudioAnalysisManager::getCurrentMetrics() const {
    std::lock_guard<std::mutex> lock(analysisMutex_);
    return currentMetrics_;
}

AudioAnalysisManager::FrequencyAnalysis AudioAnalysisManager::getFrequencyAnalysis() const {
    std::lock_guard<std::mutex> lock(analysisMutex_);
    return currentFrequencyAnalysis_;
}

AudioAnalysisManager::AnalysisStats AudioAnalysisManager::getAnalysisStats() const {
    std::lock_guard<std::mutex> lock(analysisMutex_);
    return analysisStats_;
}

void AudioAnalysisManager::resetStats() {
    analysisStats_ = {0, 0, 0, -120.0, 0.0, 0.0, 0};
}

// === Callbacks d'événements ===
void AudioAnalysisManager::setAnalysisCallback(AnalysisCallback callback) {
    std::lock_guard<std::mutex> lock(analysisMutex_);
    analysisCallback_ = callback;
}

void AudioAnalysisManager::setFrequencyCallback(FrequencyCallback callback) {
    std::lock_guard<std::mutex> lock(analysisMutex_);
    frequencyCallback_ = callback;
}

void AudioAnalysisManager::setEventCallback(EventCallback callback) {
    std::lock_guard<std::mutex> lock(analysisMutex_);
    eventCallback_ = callback;
}

// === Utilitaires ===
double AudioAnalysisManager::linearToDecibels(double linear) {
    if (linear <= 0.0) {
        return -120.0; // Valeur minimale
    }
    return 20.0 * std::log10(linear);
}

double AudioAnalysisManager::decibelsToLinear(double db) {
    return std::pow(10.0, db / 20.0);
}

bool AudioAnalysisManager::isFrequencyValid(double frequency, double sampleRate) {
    return frequency > 0.0 && frequency < sampleRate / 2.0;
}

// === Méthodes privées ===
void AudioAnalysisManager::resetMetrics() {
    currentMetrics_ = {0.0, -120.0, -120.0, false, true, 0.0, 0.0};
    currentFrequencyAnalysis_ = {{}, {}, 0.0, 0.0, 0.0};
}

void AudioAnalysisManager::updateMetrics(const float* data, size_t frameCount, int channels) {
    if (!data || frameCount == 0) {
        return;
    }

    // Calculer les métriques de base
    double rms = calculateRMS(data, frameCount * channels);
    double peak = calculatePeak(data, frameCount * channels);
    double average = calculateAverage(data, frameCount * channels);

    // Convertir en dB
    currentMetrics_.rmsLevel = linearToDecibels(rms);
    currentMetrics_.peakLevel = linearToDecibels(peak);
    currentMetrics_.averageLevel = linearToDecibels(average);

    // Détecter le clipping et le silence
    currentMetrics_.hasClipping = detectClipping(data, frameCount * channels, clippingThreshold_);
    currentMetrics_.isSilent = currentMetrics_.rmsLevel < silenceThreshold_;

    // Mettre à jour les statistiques globales
    analysisStats_.totalFramesProcessed += frameCount;
    if (currentMetrics_.isSilent) {
        analysisStats_.silenceFrames += frameCount;
    }
    if (currentMetrics_.hasClipping) {
        analysisStats_.clippingFrames += frameCount;
    }

    analysisStats_.maxPeakLevel = std::max(analysisStats_.maxPeakLevel, currentMetrics_.peakLevel);
    analysisStats_.minRMSLevel = std::min(analysisStats_.minRMSLevel, currentMetrics_.rmsLevel);
    analysisStats_.averageRMSLevel =
        (analysisStats_.averageRMSLevel * (analysisStats_.totalFramesProcessed - frameCount) +
         currentMetrics_.rmsLevel * frameCount) /
        analysisStats_.totalFramesProcessed;
}

void AudioAnalysisManager::updateFrequencyAnalysis(const float* data, size_t frameCount, int channels) {
    if (!data || frameCount == 0 || frequencyBands_.empty()) {
        return;
    }

    try {
        // Effectuer l'analyse FFT (simplifiée)
        auto fftData = performFFT(data, frameCount * channels);
        auto bandMagnitudes = calculateBandMagnitudes(fftData);

        currentFrequencyAnalysis_.magnitudes = bandMagnitudes;
        currentFrequencyAnalysis_.frequencies = frequencyBands_;
        currentFrequencyAnalysis_.spectralCentroid = calculateSpectralCentroid(bandMagnitudes);
        currentFrequencyAnalysis_.spectralRolloff = calculateSpectralRolloff(bandMagnitudes);
        currentFrequencyAnalysis_.spectralFlux = 0.0; // Non implémenté pour l'exemple

    } catch (const std::exception& e) {
        // En cas d'erreur, utiliser des valeurs par défaut
        currentFrequencyAnalysis_ = {{}, frequencyBands_, 0.0, 0.0, 0.0};
    }
}

void AudioAnalysisManager::checkForEvents() {
    // Vérifier les changements d'état
    static bool wasSilent = true;
    static bool hadClipping = false;

    if (currentMetrics_.isSilent != wasSilent) {
        if (currentMetrics_.isSilent) {
            notifyGeneralEvent("silence_detected");
        } else {
            notifyGeneralEvent("audio_detected");
        }
        wasSilent = currentMetrics_.isSilent;
    }

    if (currentMetrics_.hasClipping != hadClipping) {
        if (currentMetrics_.hasClipping) {
            notifyGeneralEvent("clipping_detected");
        } else {
            notifyGeneralEvent("clipping_ended");
        }
        hadClipping = currentMetrics_.hasClipping;
    }
}

// === Analyseurs ===
double AudioAnalysisManager::calculateRMS(const float* data, size_t frameCount) const {
    if (!data || frameCount == 0) {
        return 0.0;
    }

    double sum = 0.0;
    for (size_t i = 0; i < frameCount; ++i) {
        sum += data[i] * data[i];
    }

    return std::sqrt(sum / frameCount);
}

double AudioAnalysisManager::calculatePeak(const float* data, size_t frameCount) const {
    if (!data || frameCount == 0) {
        return 0.0;
    }

    double peak = 0.0;
    for (size_t i = 0; i < frameCount; ++i) {
        peak = std::max<double>(peak, std::abs(data[i]));
    }

    return peak;
}

double AudioAnalysisManager::calculateAverage(const float* data, size_t frameCount) const {
    if (!data || frameCount == 0) {
        return 0.0;
    }

    double sum = 0.0;
    for (size_t i = 0; i < frameCount; ++i) {
        sum += std::abs(data[i]);
    }

    return sum / frameCount;
}

bool AudioAnalysisManager::detectClipping(const float* data, size_t frameCount, double threshold) const {
    if (!data || frameCount == 0) {
        return false;
    }

    double thresholdLinear = decibelsToLinear(threshold);

    for (size_t i = 0; i < frameCount; ++i) {
        if (std::abs(data[i]) >= thresholdLinear) {
            return true;
        }
    }

    return false;
}

// === Analyse fréquentielle ===
std::vector<double> AudioAnalysisManager::performFFT(const float* data, size_t frameCount) const {
    // Implémentation simplifiée d'une FFT basique
    // Dans une vraie implémentation, on utiliserait une bibliothèque FFT optimisée

    std::vector<double> fftData(frameCount / 2, 0.0); // Seulement les fréquences positives

    // Version très simplifiée - juste pour l'exemple
    // Une vraie implémentation utiliserait FFTW, KissFFT, ou une autre bibliothèque
    for (size_t i = 0; i < std::min(frameCount / 2, fftData.size()); ++i) {
        double frequency = static_cast<double>(i) * config_.sampleRate / frameCount;
        double magnitude = 0.0;

        // Calcul simplifié de la magnitude pour cette fréquence
        for (size_t j = 0; j < frameCount; ++j) {
            double angle = 2.0 * M_PI * frequency * j / config_.sampleRate;
            magnitude += data[j] * std::cos(angle); // Partie réelle seulement
        }

        fftData[i] = std::abs(magnitude) / frameCount;
    }

    return fftData;
}

std::vector<double> AudioAnalysisManager::calculateBandMagnitudes(const std::vector<double>& fftData) const
{
    std::vector<double> bandMagnitudes(frequencyBands_.size(), 0.0);

    for (size_t i = 0; i < frequencyBands_.size(); ++i) {
        double bandFreq = frequencyBands_[i];
        size_t binIndex = static_cast<size_t>(bandFreq * fftData.size() * 2 / config_.sampleRate);

        if (binIndex < fftData.size()) {
            bandMagnitudes[i] = fftData[binIndex];
        }
    }

    return bandMagnitudes;
}

double AudioAnalysisManager::calculateSpectralCentroid(const std::vector<double>& magnitudes) const
{
    if (magnitudes.empty()) {
        return 0.0;
    }

    double numerator = 0.0;
    double denominator = 0.0;

    for (size_t i = 0; i < magnitudes.size(); ++i) {
        double freq = frequencyBands_[i];
        numerator += freq * magnitudes[i];
        denominator += magnitudes[i];
    }

    return denominator > 0.0 ? numerator / denominator : 0.0;
}

double AudioAnalysisManager::calculateSpectralRolloff(const std::vector<double>& magnitudes,
                                                      double rolloffPercent) const
{
    if (magnitudes.empty()) {
        return 0.0;
    }

    double totalEnergy = std::accumulate(magnitudes.begin(), magnitudes.end(), 0.0);
    double targetEnergy = totalEnergy * rolloffPercent;

    double cumulativeEnergy = 0.0;
    for (size_t i = 0; i < magnitudes.size(); ++i) {
        cumulativeEnergy += magnitudes[i];
        if (cumulativeEnergy >= targetEnergy) {
            return frequencyBands_[i];
        }
    }

    return frequencyBands_.back();
}

double AudioAnalysisManager::calculateSpectralFlux(const std::vector<double>& currentMagnitudes,
                                                   const std::vector<double>& previousMagnitudes) const
{
    if (currentMagnitudes.size() != previousMagnitudes.size()) {
        return 0.0;
    }

    double flux = 0.0;
    for (size_t i = 0; i < currentMagnitudes.size(); ++i) {
        double diff = currentMagnitudes[i] - previousMagnitudes[i];
        flux += diff > 0.0 ? diff : 0.0; // Half-wave rectification
    }

    return flux;
}

// === Utilitaires ===
void AudioAnalysisManager::notifyAnalysisEvent(const AudioMetrics& metrics) {
    if (analysisCallback_) {
        try {
            analysisCallback_(metrics);
        } catch (const std::exception& e) {
            if (callbackManager_) {
                callbackManager_->invokeErrorCallback(std::string("Analysis callback error: ") + e.what());
            }
        }
    }
}

void AudioAnalysisManager::notifyFrequencyEvent(const FrequencyAnalysis& analysis) {
    if (frequencyCallback_) {
        try {
            frequencyCallback_(analysis);
        } catch (const std::exception& e) {
            if (callbackManager_) {
                callbackManager_->invokeErrorCallback(std::string("Frequency callback error: ") + e.what());
            }
        }
    }
}

void AudioAnalysisManager::notifyGeneralEvent(const std::string& event, const std::string& data) {
    if (eventCallback_) {
        try {
            eventCallback_(event, data);
        } catch (const std::exception& e) {
            if (callbackManager_) {
                callbackManager_->invokeErrorCallback(std::string("Event callback error: ") + e.what());
            }
        }
    }
}

bool AudioAnalysisManager::shouldPerformAnalysis() const {
    if (bufferIndex_ == 0) {
        return false;
    }

    auto now = std::chrono::steady_clock::now();
    auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(now - lastAnalysisTime_).count();

    return elapsed >= analysisIntervalMs_;
}

void AudioAnalysisManager::initializeDefaultBands() {
    // Bandes d'octave ISO standard
    frequencyBands_ = {31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000};
}

} // namespace react
} // namespace facebook
