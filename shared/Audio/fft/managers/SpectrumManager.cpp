#include "SpectrumManager.h"

#include <algorithm>
#include <chrono>
#include <cmath>
#include <numeric>

namespace Nyth {
namespace Audio {

SpectrumManager::SpectrumManager() : state_(SpectrumState::UNINITIALIZED), lastSpectrumData_({}), statistics_({}) {
    statistics_.reset();
}

SpectrumManager::~SpectrumManager() {
    release();
}

// === Cycle de vie ===

bool SpectrumManager::initialize(const SpectrumConfig& config) {
    if (state_.load() != SpectrumState::UNINITIALIZED) {
        handleError(SpectrumError::ALREADY_ANALYZING, "Manager already initialized");
        return false;
    }

    // Validation de la configuration
    if (!config.isValid()) {
        handleError(SpectrumError::INVALID_CONFIG, "Invalid configuration provided");
        return false;
    }

    config_ = config;

    // Initialisation du moteur FFT
    if (!initializeFFT()) {
        handleError(SpectrumError::FFT_FAILED, "Failed to initialize FFT engine");
        return false;
    }

    // Préparation des buffers
    resetBuffers();
    calculateFrequencyBands();

    if (config_.useWindowing) {
        createHannWindow();
    }

    // Initialisation des données spectrales
    lastSpectrumData_.numBands = config_.numBands;
    lastSpectrumData_.magnitudes = magnitudesBuffer_.data();
    lastSpectrumData_.frequencies = frequencyBandsBuffer_.data();

    setState(SpectrumState::INITIALIZED);
    return true;
}

void SpectrumManager::release() {
    if (fftEngine_) {
        fftEngine_.reset();
    }

    // Nettoyage des buffers
    audioBuffer_.clear();
    windowBuffer_.clear();
    fftRealBuffer_.clear();
    fftImagBuffer_.clear();
    magnitudesBuffer_.clear();
    frequencyBandsBuffer_.clear();

    // Reset des données
    lastSpectrumData_ = {};
    statistics_.reset();

    setState(SpectrumState::UNINITIALIZED);
}

bool SpectrumManager::isInitialized() const {
    return state_.load() == SpectrumState::INITIALIZED || state_.load() == SpectrumState::ANALYZING;
}

// === Configuration ===

bool SpectrumManager::setConfig(const SpectrumConfig& config) {
    if (!config.isValid()) {
        handleError(SpectrumError::INVALID_CONFIG, "Invalid configuration provided");
        return false;
    }

    if (isInitialized()) {
        release();
    }

    return initialize(config);
}

const SpectrumConfig& SpectrumManager::getConfig() const {
    return config_;
}

// === Contrôle de l'analyse ===

bool SpectrumManager::start() {
    if (state_.load() != SpectrumState::INITIALIZED) {
        handleError(SpectrumError::NOT_INITIALIZED, "Manager not initialized");
        return false;
    }

    setState(SpectrumState::ANALYZING);
    return true;
}

bool SpectrumManager::stop() {
    if (state_.load() != SpectrumState::ANALYZING) {
        handleError(SpectrumError::ALREADY_STOPPED, "Analysis not running");
        return false;
    }

    setState(SpectrumState::INITIALIZED);
    return true;
}

bool SpectrumManager::isAnalyzing() const {
    return state_.load() == SpectrumState::ANALYZING;
}

// === Traitement audio ===

bool SpectrumManager::processAudioBuffer(const float* audioBuffer, size_t numSamples) {
    if (state_.load() != SpectrumState::ANALYZING) {
        return false;
    }

    if (!audioBuffer || numSamples == 0) {
        handleError(SpectrumError::INVALID_BUFFER, "Invalid audio buffer");
        return false;
    }

    // Copie des données audio
    if (audioBuffer_.size() < numSamples) {
        audioBuffer_.resize(numSamples);
    }

    std::copy(audioBuffer, audioBuffer + numSamples, audioBuffer_.begin());

    // Traitement FFT
    if (!processFFT(audioBuffer_.data(), numSamples)) {
        handleError(SpectrumError::FFT_FAILED, "FFT processing failed");
        return false;
    }

    // Mise à jour du timestamp
    auto now = std::chrono::system_clock::now();
    lastSpectrumData_.timestamp =
        static_cast<double>(std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count());

    // Mise à jour des statistiques
    updateStatistics();

    // Notification du callback
    notifyDataCallback();

    return true;
}

bool SpectrumManager::processAudioBufferStereo(const float* audioBufferL, const float* audioBufferR,
                                               size_t numSamples) {
    // Traitement mono simple - moyenne des canaux
    if (audioBuffer_.size() < numSamples) {
        audioBuffer_.resize(numSamples);
    }

    for (size_t i = 0; i < numSamples; ++i) {
        audioBuffer_[i] = (audioBufferL[i] + audioBufferR[i]) * 0.5f;
    }

    return processAudioBuffer(audioBuffer_.data(), numSamples);
}

// === Récupération des données ===

const SpectrumData& SpectrumManager::getLastSpectrumData() const {
    return lastSpectrumData_;
}

const SpectrumStatistics& SpectrumManager::getStatistics() const {
    return statistics_;
}

void SpectrumManager::resetStatistics() {
    statistics_.reset();
}

// === Callbacks ===

void SpectrumManager::setDataCallback(SpectrumDataCallback callback) {
    dataCallback_ = callback;
}

void SpectrumManager::setErrorCallback(SpectrumErrorCallback callback) {
    errorCallback_ = callback;
}

void SpectrumManager::setStateCallback(SpectrumStateCallback callback) {
    stateCallback_ = callback;
}

// === État ===

SpectrumState SpectrumManager::getState() const {
    return state_.load();
}

std::string SpectrumManager::getLastError() const {
    return lastError_;
}

// === Méthodes privées ===

bool SpectrumManager::initializeFFT() {
    try {
        // Validation de la taille FFT
        if (!isValidFFTSize()) {
            lastError_ = "Invalid FFT size: " + std::to_string(config_.fftSize) + " (must be power of 2)";
            return false;
        }

        // Création du moteur FFT avec gestion d'erreur
        fftEngine_ = AudioFX::createFFTEngine(config_.fftSize);

        if (!fftEngine_) {
            lastError_ = "Failed to create FFT engine";
            return false;
        }

        // Validation de l'interface FFT
        if (fftEngine_->getSize() != config_.fftSize) {
            lastError_ = "FFT engine size mismatch: expected " + std::to_string(config_.fftSize) + ", got " +
                         std::to_string(fftEngine_->getSize());
            fftEngine_.reset();
            return false;
        }

        return true;
    } catch (const std::exception& e) {
        lastError_ = std::string("FFT initialization failed: ") + e.what();
        fftEngine_.reset();
        return false;
    }
}

bool SpectrumManager::isValidFFTSize() const {
    size_t fftSize = config_.fftSize;

    // Vérifier que ce n'est pas zéro
    if (fftSize == 0) {
        return false;
    }

    // Vérifier que c'est une puissance de 2
    if ((fftSize & (fftSize - 1)) != 0) {
        return false;
    }

    // Vérifier les limites
    return fftSize >= 64 && fftSize <= 8192;
}

void SpectrumManager::calculateFrequencyBands() {
    frequencyBandsBuffer_.resize(config_.numBands);

    double freqRange = config_.maxFreq - config_.minFreq;
    for (size_t i = 0; i < config_.numBands; ++i) {
        double normalizedFreq = static_cast<double>(i) / static_cast<double>(config_.numBands - 1);
        frequencyBandsBuffer_[i] = static_cast<float>(config_.minFreq + normalizedFreq * freqRange);
    }
}

void SpectrumManager::createHannWindow() {
    windowBuffer_.resize(config_.fftSize);
    for (size_t i = 0; i < config_.fftSize; ++i) {
        double phase = 2.0 * M_PI * static_cast<double>(i) / static_cast<double>(config_.fftSize - 1);
        windowBuffer_[i] = static_cast<float>(0.5 * (1.0 - std::cos(phase)));
    }
}

bool SpectrumManager::processFFT(const float* audioData, size_t numSamples) {
    if (!fftEngine_) {
        return false;
    }

    try {
        // Application de la fenêtre si activée
        if (config_.useWindowing) {
            std::vector<float> windowedData(audioData, audioData + numSamples);
            if (numSamples > windowBuffer_.size()) {
                windowedData.resize(windowBuffer_.size());
            }
            applyWindowing(windowedData);
            audioData = windowedData.data();
            numSamples = windowedData.size();
        }

        // Remplissage avec des zéros si nécessaire
        if (numSamples < config_.fftSize) {
            audioBuffer_.resize(config_.fftSize, 0.0f);
            std::copy(audioData, audioData + numSamples, audioBuffer_.begin());
            audioData = audioBuffer_.data();
        }

        // FFT
        fftEngine_->forwardR2C(audioData, fftRealBuffer_, fftImagBuffer_);

        // Calcul des magnitudes
        magnitudesBuffer_.resize(config_.numBands);
        for (size_t i = 0; i < config_.numBands; ++i) {
            size_t fftIndex = i * (config_.fftSize / 2) / config_.numBands;
            if (fftIndex < fftRealBuffer_.size()) {
                float real = fftRealBuffer_[fftIndex];
                float imag = fftImagBuffer_[fftIndex];
                magnitudesBuffer_[i] = calculateMagnitude(real, imag);
            } else {
                magnitudesBuffer_[i] = 0.0f;
            }
        }

        return true;
    } catch (const std::exception& e) {
        lastError_ = e.what();
        return false;
    }
}

void SpectrumManager::applyWindowing(std::vector<float>& buffer) {
    size_t windowSize = std::min(buffer.size(), windowBuffer_.size());
    for (size_t i = 0; i < windowSize; ++i) {
        buffer[i] *= windowBuffer_[i];
    }
}

float SpectrumManager::calculateMagnitude(float real, float imag) const {
    return std::sqrt(real * real + imag * imag);
}

void SpectrumManager::updateStatistics() {
    statistics_.totalFrames++;

    if (magnitudesBuffer_.empty()) {
        return;
    }

    // Calcul de la magnitude moyenne
    double sumMagnitudes = std::accumulate(magnitudesBuffer_.begin(), magnitudesBuffer_.end(), 0.0);
    double avgMagnitude = sumMagnitudes / magnitudesBuffer_.size();

    // Mise à jour des statistiques
    if (statistics_.totalFrames == 1) {
        statistics_.averageMagnitude = avgMagnitude;
    } else {
        statistics_.averageMagnitude =
            (statistics_.averageMagnitude * (statistics_.totalFrames - 1) + avgMagnitude) / statistics_.totalFrames;
    }

    // Pic spectral
    float maxMagnitude = *std::max_element(magnitudesBuffer_.begin(), magnitudesBuffer_.end());
    if (maxMagnitude > statistics_.peakMagnitude) {
        statistics_.peakMagnitude = maxMagnitude;
    }

    // Calcul des caractéristiques spectrales
    computeSpectralFeatures();
}

void SpectrumManager::computeSpectralFeatures() {
    if (magnitudesBuffer_.empty() || frequencyBandsBuffer_.empty()) {
        return;
    }

    double sumMagnitudes = 0.0;
    double sumWeightedFreq = 0.0;
    double sumWeights = 0.0;

    // Centroïde spectral
    for (size_t i = 0; i < magnitudesBuffer_.size(); ++i) {
        double mag = std::abs(magnitudesBuffer_[i]);
        double freq = frequencyBandsBuffer_[i];

        sumMagnitudes += mag;
        sumWeightedFreq += mag * freq;
        sumWeights += mag;
    }

    if (sumWeights > 0.0) {
        statistics_.centroid = sumWeightedFreq / sumWeights;
    }

    // Écart spectral
    if (sumWeights > 0.0) {
        double variance = 0.0;
        for (size_t i = 0; i < magnitudesBuffer_.size(); ++i) {
            double mag = std::abs(magnitudesBuffer_[i]);
            double freq = frequencyBandsBuffer_[i];
            double diff = freq - statistics_.centroid;
            variance += mag * diff * diff;
        }
        statistics_.spread = std::sqrt(variance / sumWeights);
    }

    // Aplatissement spectral (simplifié)
    if (sumMagnitudes > 0.0) {
        double geometricMean = 1.0;
        int nonZeroCount = 0;

        for (float mag : magnitudesBuffer_) {
            if (mag > 0.0f) {
                geometricMean *= std::abs(mag);
                nonZeroCount++;
            }
        }

        if (nonZeroCount > 0) {
            geometricMean = std::pow(geometricMean, 1.0 / nonZeroCount);
            double arithmeticMean = sumMagnitudes / magnitudesBuffer_.size();

            if (arithmeticMean > 0.0) {
                statistics_.flatness = geometricMean / arithmeticMean;
            }
        }
    }

    // Roulis spectral (95% de l'énergie)
    if (sumMagnitudes > 0.0) {
        double targetEnergy = 0.95 * sumMagnitudes;
        double cumulativeEnergy = 0.0;

        for (size_t i = 0; i < magnitudesBuffer_.size(); ++i) {
            cumulativeEnergy += std::abs(magnitudesBuffer_[i]);
            if (cumulativeEnergy >= targetEnergy) {
                statistics_.rolloff = frequencyBandsBuffer_[i];
                break;
            }
        }
    }
}

void SpectrumManager::setState(SpectrumState newState) {
    SpectrumState oldState = state_.load();
    state_.store(newState);

    if (stateCallback_ && oldState != newState) {
        stateCallback_(oldState, newState);
    }
}

void SpectrumManager::handleError(SpectrumError error, const std::string& message) {
    lastError_ = message;
    setState(SpectrumState::ERROR);

    if (errorCallback_) {
        errorCallback_(error, message);
    }
}

void SpectrumManager::notifyDataCallback() {
    if (dataCallback_) {
        dataCallback_(lastSpectrumData_);
    }
}

void SpectrumManager::resetBuffers() {
    audioBuffer_.resize(config_.fftSize);
    windowBuffer_.resize(config_.fftSize);
    fftRealBuffer_.resize(config_.fftSize);
    fftImagBuffer_.resize(config_.fftSize);
    magnitudesBuffer_.resize(config_.numBands);
    frequencyBandsBuffer_.resize(config_.numBands);

    std::fill(audioBuffer_.begin(), audioBuffer_.end(), 0.0f);
    std::fill(windowBuffer_.begin(), windowBuffer_.end(), 1.0f);
    std::fill(fftRealBuffer_.begin(), fftRealBuffer_.end(), 0.0f);
    std::fill(fftImagBuffer_.begin(), fftImagBuffer_.end(), 0.0f);
    std::fill(magnitudesBuffer_.begin(), magnitudesBuffer_.end(), 0.0f);
}

} // namespace Audio
} // namespace Nyth
