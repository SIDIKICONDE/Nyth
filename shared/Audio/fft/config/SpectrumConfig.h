#pragma once

#include <functional>
#include <string>

namespace Nyth {
namespace Audio {

// === Constantes pour l'analyse spectrale ===

namespace SpectrumConstants {
constexpr size_t DEFAULT_FFT_SIZE = 1024;
constexpr size_t MIN_FFT_SIZE = 64;
constexpr size_t MAX_FFT_SIZE = 8192;
constexpr double DEFAULT_MIN_FREQ = 20.0;
constexpr double DEFAULT_MAX_FREQ = 20000.0;
constexpr size_t DEFAULT_NUM_BANDS = 32;
constexpr bool DEFAULT_USE_WINDOWING = true;
constexpr bool DEFAULT_USE_SIMD = true;
} // namespace SpectrumConstants

// === Structures de configuration pour le module spectrum ===

// Configuration de base pour l'analyse spectrale
struct SpectrumConfig {
    // Paramètres FFT
    size_t fftSize = SpectrumConstants::DEFAULT_FFT_SIZE;
    uint32_t sampleRate = 44100;

    // Plage de fréquences
    double minFreq = SpectrumConstants::DEFAULT_MIN_FREQ;
    double maxFreq = SpectrumConstants::DEFAULT_MAX_FREQ;
    size_t numBands = SpectrumConstants::DEFAULT_NUM_BANDS;

    // Paramètres de traitement
    bool useWindowing = SpectrumConstants::DEFAULT_USE_WINDOWING;
    bool useSIMD = SpectrumConstants::DEFAULT_USE_SIMD;
    double overlap = 0.5; // Chevauchement entre frames (0-1)

    // Optimisations
    bool enableMemoryPool = true;
    size_t memoryPoolSize = 1024 * 1024; // 1MB par défaut

    // Validation complète
    bool isValid() const {
        return fftSize >= SpectrumConstants::MIN_FFT_SIZE && fftSize <= SpectrumConstants::MAX_FFT_SIZE &&
               sampleRate > 0 && minFreq >= 1.0 && maxFreq > minFreq && maxFreq <= sampleRate / 2 && numBands > 0 &&
               numBands <= fftSize / 2 && overlap >= 0.0 && overlap < 1.0 && memoryPoolSize > 0;
    }

    // Méthode pour obtenir une configuration par défaut
    static SpectrumConfig getDefault() {
        return SpectrumConfig();
    }
};

// === Structures de données spectrales ===

// Données spectrales pour une frame
struct SpectrumData {
    size_t numBands = 0;
    double timestamp = 0.0;             // Timestamp en ms
    const float* magnitudes = nullptr;  // Magnitudes en dBFS
    const float* frequencies = nullptr; // Fréquences en Hz

    // Validation
    bool isValid() const noexcept {
        return numBands > 0 && magnitudes != nullptr && frequencies != nullptr && timestamp >= 0.0;
    }
    
    // Constructeur par défaut explicite
    SpectrumData() = default;
    
    // Constructeur avec paramètres
    SpectrumData(size_t bands, double ts, const float* mags, const float* freqs)
        : numBands(bands), timestamp(ts), magnitudes(mags), frequencies(freqs) {}
};

// Statistiques spectrales
struct SpectrumStatistics {
    double averageMagnitude = 0.0; // Magnitude moyenne en dBFS
    double peakMagnitude = -120.0; // Pic spectral en dBFS
    double centroid = 0.0;         // Centroïde spectral en Hz
    double spread = 0.0;           // Écart spectral
    double flatness = 0.0;         // Aplatissement spectral
    double rolloff = 0.0;          // Roulis spectral (95% de l'énergie)

    uint64_t totalFrames = 0;
    double averageProcessingTimeMs = 0.0;
    double maxProcessingTimeMs = 0.0;

    // Méthode pour réinitialiser
    void reset() noexcept {
        *this = SpectrumStatistics();
    }
};

// === Types d'erreurs ===

enum class SpectrumError {
    OK = 0,
    NOT_INITIALIZED = -1,
    ALREADY_ANALYZING = -2,
    ALREADY_STOPPED = -3,
    FFT_FAILED = -4,
    INVALID_BUFFER = -5,
    MEMORY_ERROR = -6,
    INVALID_CONFIG = -7,
    THREAD_ERROR = -8
};

// Conversion d'erreur vers string
inline std::string errorToString(SpectrumError error) {
    switch (error) {
        case SpectrumError::OK:
            return "OK";
        case SpectrumError::NOT_INITIALIZED:
            return "Module not initialized";
        case SpectrumError::ALREADY_ANALYZING:
            return "Already analyzing";
        case SpectrumError::ALREADY_STOPPED:
            return "Already stopped";
        case SpectrumError::FFT_FAILED:
            return "FFT processing failed";
        case SpectrumError::INVALID_BUFFER:
            return "Invalid audio buffer";
        case SpectrumError::MEMORY_ERROR:
            return "Memory allocation error";
        case SpectrumError::INVALID_CONFIG:
            return "Invalid configuration";
        case SpectrumError::THREAD_ERROR:
            return "Thread operation failed";
        default:
            return "Unknown error";
    }
}

// === États du module ===

enum class SpectrumState { UNINITIALIZED = 0, INITIALIZED = 1, ANALYZING = 2, ERROR = 3, SHUTDOWN = 4 };

// Conversion d'état vers string
inline std::string stateToString(SpectrumState state) {
    switch (state) {
        case SpectrumState::UNINITIALIZED:
            return "uninitialized";
        case SpectrumState::INITIALIZED:
            return "initialized";
        case SpectrumState::ANALYZING:
            return "analyzing";
        case SpectrumState::ERROR:
            return "error";
        case SpectrumState::SHUTDOWN:
            return "shutdown";
        default:
            return "unknown";
    }
}

// === Callbacks et événements ===

using SpectrumDataCallback = std::function<void(const SpectrumData& data)>;
using SpectrumErrorCallback = std::function<void(SpectrumError error, const std::string& message)>;
using SpectrumStateCallback = std::function<void(SpectrumState oldState, SpectrumState newState)>;

} // namespace Audio
} // namespace Nyth
