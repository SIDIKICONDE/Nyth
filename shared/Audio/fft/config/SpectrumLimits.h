#pragma once

#include <cstdint>
#include <limits>

namespace Nyth {
namespace Audio {

// === Constantes et limites pour l'analyse spectrale ===

struct SpectrumLimits {
    // Limites FFT
    static constexpr size_t MIN_FFT_SIZE = 64;
    static constexpr size_t MAX_FFT_SIZE = 8192;
    static constexpr size_t DEFAULT_FFT_SIZE = 1024;

    // Limites de fréquences
    static constexpr double MIN_FREQUENCY = 1.0;     // 1 Hz minimum
    static constexpr double MAX_FREQUENCY = 96000.0; // 96 kHz maximum
    static constexpr double DEFAULT_MIN_FREQ = 20.0;
    static constexpr double DEFAULT_MAX_FREQ = 20000.0;

    // Limites de bandes
    static constexpr size_t MIN_NUM_BANDS = 1;
    static constexpr size_t MAX_NUM_BANDS = 1024;
    static constexpr size_t DEFAULT_NUM_BANDS = 32;

    // Limites de chevauchement
    static constexpr double MIN_OVERLAP = 0.0;
    static constexpr double MAX_OVERLAP = 0.95;

    // Limites de taux d'échantillonnage
    static constexpr uint32_t MIN_SAMPLE_RATE = 8000;
    static constexpr uint32_t MAX_SAMPLE_RATE = 192000;
    static constexpr uint32_t DEFAULT_SAMPLE_RATE = 44100;

    // Limites de mémoire
    static constexpr size_t MIN_MEMORY_POOL_SIZE = 1024;             // 1KB minimum
    static constexpr size_t MAX_MEMORY_POOL_SIZE = 16 * 1024 * 1024; // 16MB maximum
    static constexpr size_t DEFAULT_MEMORY_POOL_SIZE = 1024 * 1024;  // 1MB par défaut

    // Limites de niveaux
    static constexpr double MIN_MAGNITUDE_DB = -200.0; // dBFS minimum
    static constexpr double MAX_MAGNITUDE_DB = 0.0;    // dBFS maximum (normalisé)

    // Limites temporelles
    static constexpr double MAX_PROCESSING_TIME_MS = 100.0; // 100ms maximum par frame
};

// === Validateurs de paramètres ===

class SpectrumParameterValidator {
public:
    // Validation de la taille FFT
    static constexpr bool isValidFFTSize(size_t fftSize) noexcept {
        return fftSize >= SpectrumLimits::MIN_FFT_SIZE && fftSize <= SpectrumLimits::MAX_FFT_SIZE &&
               (fftSize & (fftSize - 1)) == 0; // Puissance de 2
    }

    // Validation des fréquences
    static constexpr bool isValidFrequency(double frequency) noexcept {
        return frequency >= SpectrumLimits::MIN_FREQUENCY && frequency <= SpectrumLimits::MAX_FREQUENCY;
    }

    static constexpr bool isValidFrequencyRange(double minFreq, double maxFreq) noexcept {
        return minFreq < maxFreq && isValidFrequency(minFreq) && isValidFrequency(maxFreq);
    }

    // Validation du nombre de bandes
    static constexpr bool isValidNumBands(size_t numBands, size_t fftSize) noexcept {
        return numBands >= SpectrumLimits::MIN_NUM_BANDS && numBands <= SpectrumLimits::MAX_NUM_BANDS &&
               numBands <= fftSize / 2;
    }

    // Validation du taux d'échantillonnage
    static constexpr bool isValidSampleRate(uint32_t sampleRate) noexcept {
        return sampleRate >= SpectrumLimits::MIN_SAMPLE_RATE && sampleRate <= SpectrumLimits::MAX_SAMPLE_RATE;
    }

    // Validation du chevauchement
    static constexpr bool isValidOverlap(double overlap) noexcept {
        return overlap >= SpectrumLimits::MIN_OVERLAP && overlap <= SpectrumLimits::MAX_OVERLAP;
    }

    // Validation de la taille du pool mémoire
    static constexpr bool isValidMemoryPoolSize(size_t size) noexcept {
        return size >= SpectrumLimits::MIN_MEMORY_POOL_SIZE && size <= SpectrumLimits::MAX_MEMORY_POOL_SIZE;
    }

    // Validation des niveaux de magnitude
    static constexpr bool isValidMagnitude(double magnitudeDb) noexcept {
        return magnitudeDb >= SpectrumLimits::MIN_MAGNITUDE_DB && magnitudeDb <= SpectrumLimits::MAX_MAGNITUDE_DB;
    }

    // Validation du temps de traitement
    static constexpr bool isValidProcessingTime(double timeMs) noexcept {
        return timeMs >= 0.0 && timeMs <= SpectrumLimits::MAX_PROCESSING_TIME_MS;
    }
};

} // namespace Audio
} // namespace Nyth
