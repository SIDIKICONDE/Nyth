#include "SpectrumJSIConverter.h"

#include <algorithm>
#include <cmath>
#include <limits>

namespace facebook {
namespace react {

// === Constantes pour les validations ===

namespace {
constexpr double MIN_FREQUENCY = 1.0;
constexpr double MAX_FREQUENCY = 96000.0; // Fréquence de Nyquist maximale
constexpr size_t MIN_BANDS = 1;
constexpr size_t MAX_BANDS = 1024;
constexpr double MIN_OVERLAP = 0.0;
constexpr double MAX_OVERLAP = 0.99; // < 1.0 pour éviter les divisions par zéro
constexpr size_t MIN_FFT_SIZE = 64;
constexpr size_t MAX_FFT_SIZE = 8192;

// Validation d'une fréquence
bool isValidFrequency(double freq) {
    return std::isfinite(freq) && freq >= MIN_FREQUENCY && freq <= MAX_FREQUENCY;
}

// Validation du nombre de bandes
bool isValidBandCount(size_t bands) {
    return bands >= MIN_BANDS && bands <= MAX_BANDS;
}

// Validation du chevauchement
bool isValidOverlap(double overlap) {
    return std::isfinite(overlap) && overlap >= MIN_OVERLAP && overlap < MAX_OVERLAP;
}

// Validation de la taille FFT (doit être puissance de 2)
bool isValidFFTSize(size_t fftSize) {
    if (fftSize < MIN_FFT_SIZE || fftSize > MAX_FFT_SIZE)
        return false;
    if (fftSize == 0)
        return false;
    return (fftSize & (fftSize - 1)) == 0; // Test de puissance de 2
}

// Validation du sample rate
bool isValidSampleRate(uint32_t sampleRate) {
    return sampleRate >= 8000 && sampleRate <= 192000; // Plage raisonnable
}

// Validation de la plage de fréquences
bool isValidFrequencyRange(double minFreq, double maxFreq, uint32_t sampleRate) {
    if (!isValidFrequency(minFreq) || !isValidFrequency(maxFreq))
        return false;
    if (minFreq >= maxFreq)
        return false;
    if (maxFreq > sampleRate / 2.0)
        return false; // Ne pas dépasser la fréquence de Nyquist
    return true;
}
} // namespace

// === Implémentation des conversions JSI vers native ===

// Configuration
Nyth::Audio::SpectrumConfig SpectrumJSIConverter::jsiToSpectrumConfig(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    Nyth::Audio::SpectrumConfig config = Nyth::Audio::SpectrumConfig::getDefault();

    // Validation initiale
    if (!jsConfig.isObject(rt)) {
        throw std::invalid_argument("Configuration must be an object");
    }

    // Paramètres FFT avec validation
    if (hasProperty(rt, jsConfig, PROP_FFT_SIZE)) {
        size_t fftSize = static_cast<size_t>(getJSISize(rt, jsConfig, PROP_FFT_SIZE, config.fftSize));
        if (!isValidFFTSize(fftSize)) {
            throw std::invalid_argument("Invalid FFT size: " + std::to_string(fftSize) +
                                        " (must be power of 2 between " + std::to_string(MIN_FFT_SIZE) + " and " +
                                        std::to_string(MAX_FFT_SIZE) + ")");
        }
        config.fftSize = fftSize;
    }

    if (hasProperty(rt, jsConfig, PROP_SAMPLE_RATE)) {
        uint32_t sampleRate = getJSIUint32(rt, jsConfig, PROP_SAMPLE_RATE, config.sampleRate);
        if (!isValidSampleRate(sampleRate)) {
            throw std::invalid_argument("Invalid sample rate: " + std::to_string(sampleRate) +
                                        " (must be between 8000 and 192000 Hz)");
        }
        config.sampleRate = sampleRate;
    }

    // Plage de fréquences avec validation croisée
    double minFreq = config.minFreq;
    double maxFreq = config.maxFreq;

    if (hasProperty(rt, jsConfig, PROP_MIN_FREQ)) {
        minFreq = getJSIDouble(rt, jsConfig, PROP_MIN_FREQ, config.minFreq);
    }

    if (hasProperty(rt, jsConfig, PROP_MAX_FREQ)) {
        maxFreq = getJSIDouble(rt, jsConfig, PROP_MAX_FREQ, config.maxFreq);
    }

    if (!isValidFrequencyRange(minFreq, maxFreq, config.sampleRate)) {
        throw std::invalid_argument("Invalid frequency range: min=" + std::to_string(minFreq) + " Hz, max=" +
                                    std::to_string(maxFreq) + " Hz (must be between " + std::to_string(MIN_FREQUENCY) +
                                    " and " + std::to_string(config.sampleRate / 2.0) + " Hz)");
    }

    config.minFreq = minFreq;
    config.maxFreq = maxFreq;

    if (hasProperty(rt, jsConfig, PROP_NUM_BANDS)) {
        size_t numBands = static_cast<size_t>(getJSISize(rt, jsConfig, PROP_NUM_BANDS, config.numBands));
        if (!isValidBandCount(numBands)) {
            throw std::invalid_argument("Invalid band count: " + std::to_string(numBands) + " (must be between " +
                                        std::to_string(MIN_BANDS) + " and " + std::to_string(MAX_BANDS) + ")");
        }
        config.numBands = numBands;
    }

    // Paramètres de traitement
    if (hasProperty(rt, jsConfig, PROP_USE_WINDOWING)) {
        config.useWindowing = getJSIBool(rt, jsConfig, PROP_USE_WINDOWING, config.useWindowing);
    }

    if (hasProperty(rt, jsConfig, PROP_USE_SIMD)) {
        config.useSIMD = getJSIBool(rt, jsConfig, PROP_USE_SIMD, config.useSIMD);
    }

    if (hasProperty(rt, jsConfig, PROP_OVERLAP)) {
        double overlap = getJSIDouble(rt, jsConfig, PROP_OVERLAP, config.overlap);
        if (!isValidOverlap(overlap)) {
            throw std::invalid_argument("Invalid overlap: " + std::to_string(overlap) +
                                        " (must be between 0.0 and 0.99)");
        }
        config.overlap = overlap;
    }

    // Optimisations
    if (hasProperty(rt, jsConfig, PROP_ENABLE_MEMORY_POOL)) {
        config.enableMemoryPool = getJSIBool(rt, jsConfig, PROP_ENABLE_MEMORY_POOL, config.enableMemoryPool);
    }

    if (hasProperty(rt, jsConfig, PROP_MEMORY_POOL_SIZE)) {
        config.memoryPoolSize =
            static_cast<size_t>(getJSISize(rt, jsConfig, PROP_MEMORY_POOL_SIZE, config.memoryPoolSize));
        if (config.memoryPoolSize == 0) {
            throw std::invalid_argument("Memory pool size must be greater than 0");
        }
    }

    // Validation finale de la configuration
    if (!config.isValid()) {
        throw std::invalid_argument("Generated configuration is invalid");
    }

    return config;
}

// Données audio avec validation améliorée
std::vector<float> SpectrumJSIConverter::jsiArrayToFloatVector(jsi::Runtime& rt, const jsi::Array& jsArray) {
    size_t length = jsArray.length(rt);

    // Validation de la taille
    if (length == 0) {
        throw std::invalid_argument("Audio buffer cannot be empty");
    }

    if (length > MAX_FFT_SIZE * 2) { // Limite raisonnable pour éviter les allocations excessives
        throw std::invalid_argument("Audio buffer too large: " + std::to_string(length) +
                                   " samples (max: " + std::to_string(MAX_FFT_SIZE * 2) + ")");
    }

    std::vector<float> result;
    result.reserve(length);

    for (size_t i = 0; i < length; ++i) {
        jsi::Value element = jsArray.getValueAtIndex(rt, i);
        if (element.isNumber()) {
            float value = static_cast<float>(element.asNumber());

            // Validation de la plage audio [-1.0, 1.0] avec tolérance
            if (!std::isfinite(value)) {
                throw std::invalid_argument("Audio sample at index " + std::to_string(i) +
                                          " is not finite");
            }

            // Clamp values to valid range
            value = std::max(-1.0f, std::min(1.0f, value));
            result.push_back(value);
        } else {
            throw std::invalid_argument("Audio sample at index " + std::to_string(i) +
                                       " is not a number");
        }
    }

    return result;
}

void SpectrumJSIConverter::floatVectorToJSIArray(jsi::Runtime& rt, const std::vector<float>& data,
                                                 jsi::Array& jsArray) {
    for (size_t i = 0; i < data.size(); ++i) {
        jsArray.setValueAtIndex(rt, i, jsi::Value(data[i]));
    }
}

// === Implémentation des conversions native vers JSI ===

// Configuration
jsi::Object SpectrumJSIConverter::spectrumConfigToJSI(jsi::Runtime& rt, const Nyth::Audio::SpectrumConfig& config) {
    jsi::Object jsConfig(rt);

    setJSIProperty(rt, jsConfig, PROP_FFT_SIZE, config.fftSize);
    setJSIProperty(rt, jsConfig, PROP_SAMPLE_RATE, config.sampleRate);
    setJSIProperty(rt, jsConfig, PROP_MIN_FREQ, config.minFreq);
    setJSIProperty(rt, jsConfig, PROP_MAX_FREQ, config.maxFreq);
    setJSIProperty(rt, jsConfig, PROP_NUM_BANDS, config.numBands);
    setJSIProperty(rt, jsConfig, PROP_USE_WINDOWING, config.useWindowing);
    setJSIProperty(rt, jsConfig, PROP_USE_SIMD, config.useSIMD);
    setJSIProperty(rt, jsConfig, PROP_OVERLAP, config.overlap);
    setJSIProperty(rt, jsConfig, PROP_ENABLE_MEMORY_POOL, config.enableMemoryPool);
    setJSIProperty(rt, jsConfig, PROP_MEMORY_POOL_SIZE, config.memoryPoolSize);

    return jsConfig;
}

// Données spectrales
jsi::Object SpectrumJSIConverter::spectrumDataToJSI(jsi::Runtime& rt, const Nyth::Audio::SpectrumData& data) {
    jsi::Object jsData(rt);

    setJSIProperty(rt, jsData, PROP_NUM_BANDS_DATA, data.numBands);
    setJSIProperty(rt, jsData, PROP_TIMESTAMP, data.timestamp);

    // Magnitudes avec validation sécurisée
    if (!data.magnitudes.empty() && data.numBands > 0) {
        jsi::Array magnitudes(rt, data.numBands);
        for (size_t i = 0; i < data.numBands && i < data.magnitudes.size; ++i) {
            magnitudes.setValueAtIndex(rt, i, jsi::Value(data.magnitudes.data[i]));
        }
        setJSIProperty(rt, jsData, PROP_MAGNITUDES, magnitudes);
    }

    // Fréquences avec validation sécurisée
    if (!data.frequencies.empty() && data.numBands > 0) {
        jsi::Array frequencies(rt, data.numBands);
        for (size_t i = 0; i < data.numBands && i < data.frequencies.size; ++i) {
            frequencies.setValueAtIndex(rt, i, jsi::Value(data.frequencies.data[i]));
        }
        setJSIProperty(rt, jsData, PROP_FREQUENCIES, frequencies);
    }

    return jsData;
}

// Statistiques
jsi::Object SpectrumJSIConverter::spectrumStatisticsToJSI(jsi::Runtime& rt,
                                                          const Nyth::Audio::SpectrumStatistics& stats) {
    jsi::Object jsStats(rt);

    setJSIProperty(rt, jsStats, PROP_AVERAGE_MAGNITUDE, stats.averageMagnitude);
    setJSIProperty(rt, jsStats, PROP_PEAK_MAGNITUDE, stats.peakMagnitude);
    setJSIProperty(rt, jsStats, PROP_CENTROID, stats.centroid);
    setJSIProperty(rt, jsStats, PROP_SPREAD, stats.spread);
    setJSIProperty(rt, jsStats, PROP_FLATNESS, stats.flatness);
    setJSIProperty(rt, jsStats, PROP_ROLLOFF, stats.rolloff);
    setJSIProperty(rt, jsStats, PROP_TOTAL_FRAMES, stats.totalFrames);
    setJSIProperty(rt, jsStats, PROP_AVG_PROCESSING_TIME, stats.averageProcessingTimeMs);
    setJSIProperty(rt, jsStats, PROP_MAX_PROCESSING_TIME, stats.maxProcessingTimeMs);

    return jsStats;
}

// Données audio
jsi::Array SpectrumJSIConverter::floatVectorToJSIArray(jsi::Runtime& rt, const std::vector<float>& data) {
    jsi::Array jsArray(rt, data.size());
    floatVectorToJSIArray(rt, data, jsArray);
    return jsArray;
}

// === Utilitaires ===

// Validation
bool SpectrumJSIConverter::validateJSIConfig(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    // Validation de base des types
    if (hasProperty(rt, jsConfig, PROP_FFT_SIZE) && !isPropertyNumber(rt, jsConfig, PROP_FFT_SIZE)) {
        return false;
    }
    if (hasProperty(rt, jsConfig, PROP_SAMPLE_RATE) && !isPropertyNumber(rt, jsConfig, PROP_SAMPLE_RATE)) {
        return false;
    }
    if (hasProperty(rt, jsConfig, PROP_MIN_FREQ) && !isPropertyNumber(rt, jsConfig, PROP_MIN_FREQ)) {
        return false;
    }
    if (hasProperty(rt, jsConfig, PROP_MAX_FREQ) && !isPropertyNumber(rt, jsConfig, PROP_MAX_FREQ)) {
        return false;
    }
    if (hasProperty(rt, jsConfig, PROP_NUM_BANDS) && !isPropertyNumber(rt, jsConfig, PROP_NUM_BANDS)) {
        return false;
    }

    // Validation des valeurs
    try {
        Nyth::Audio::SpectrumConfig config = jsiToSpectrumConfig(rt, jsConfig);
        return config.isValid();
    } catch (...) {
        return false;
    }
}

std::string SpectrumJSIConverter::getJSIConfigValidationError(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    if (!validateJSIConfig(rt, jsConfig)) {
        return "Invalid spectrum configuration provided";
    }
    return "";
}

// Extraction de propriétés avec valeurs par défaut
double SpectrumJSIConverter::getJSIDouble(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop,
                                          double defaultValue) {
    if (hasProperty(rt, obj, prop) && obj.getProperty(rt, prop).isNumber()) {
        return obj.getProperty(rt, prop).asNumber();
    }
    return defaultValue;
}

int SpectrumJSIConverter::getJSIInt(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop,
                                    int defaultValue) {
    if (hasProperty(rt, obj, prop) && obj.getProperty(rt, prop).isNumber()) {
        return static_cast<int>(obj.getProperty(rt, prop).asNumber());
    }
    return defaultValue;
}

uint32_t SpectrumJSIConverter::getJSIUint32(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop,
                                            uint32_t defaultValue) {
    if (hasProperty(rt, obj, prop) && obj.getProperty(rt, prop).isNumber()) {
        return static_cast<uint32_t>(obj.getProperty(rt, prop).asNumber());
    }
    return defaultValue;
}

size_t SpectrumJSIConverter::getJSISize(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop,
                                        size_t defaultValue) {
    if (hasProperty(rt, obj, prop) && obj.getProperty(rt, prop).isNumber()) {
        return static_cast<size_t>(obj.getProperty(rt, prop).asNumber());
    }
    return defaultValue;
}

bool SpectrumJSIConverter::getJSIBool(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop,
                                      bool defaultValue) {
    if (hasProperty(rt, obj, prop) && obj.getProperty(rt, prop).isBool()) {
        return obj.getProperty(rt, prop).getBool();
    }
    return defaultValue;
}

std::string SpectrumJSIConverter::getJSIString(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop,
                                               const std::string& defaultValue) {
    if (hasProperty(rt, obj, prop) && obj.getProperty(rt, prop).isString()) {
        return obj.getProperty(rt, prop).asString(rt).utf8(rt);
    }
    return defaultValue;
}

// Vérification d'existence de propriétés
bool SpectrumJSIConverter::hasProperty(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop) {
    return obj.hasProperty(rt, prop.c_str());
}

bool SpectrumJSIConverter::isPropertyObject(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop) {
    return hasProperty(rt, obj, prop) && obj.getProperty(rt, prop).isObject();
}

bool SpectrumJSIConverter::isPropertyArray(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop) {
    return hasProperty(rt, obj, prop) && obj.getProperty(rt, prop).isObject() &&
           obj.getProperty(rt, prop).asObject(rt).isArray(rt);
}

bool SpectrumJSIConverter::isPropertyNumber(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop) {
    return hasProperty(rt, obj, prop) && obj.getProperty(rt, prop).isNumber();
}

bool SpectrumJSIConverter::isPropertyBool(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop) {
    return hasProperty(rt, obj, prop) && obj.getProperty(rt, prop).isBool();
}

bool SpectrumJSIConverter::isPropertyString(jsi::Runtime& rt, const jsi::Object& obj, const std::string& prop) {
    return hasProperty(rt, obj, prop) && obj.getProperty(rt, prop).isString();
}

// === Fonctions auxiliaires privées ===

void SpectrumJSIConverter::setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop, double value) {
    obj.setProperty(rt, jsi::PropNameID::forUtf8(rt, prop), jsi::Value(value));
}

void SpectrumJSIConverter::setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop, int value) {
    obj.setProperty(rt, jsi::PropNameID::forUtf8(rt, prop), jsi::Value(value));
}

void SpectrumJSIConverter::setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop, uint32_t value) {
    obj.setProperty(rt, jsi::PropNameID::forUtf8(rt, prop), jsi::Value(static_cast<double>(value)));
}

void SpectrumJSIConverter::setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop, size_t value) {
    obj.setProperty(rt, jsi::PropNameID::forUtf8(rt, prop), jsi::Value(static_cast<double>(value)));
}

void SpectrumJSIConverter::setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop, bool value) {
    obj.setProperty(rt, jsi::PropNameID::forUtf8(rt, prop), jsi::Value(value));
}

void SpectrumJSIConverter::setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop,
                                          const std::string& value) {
    obj.setProperty(rt, jsi::PropNameID::forUtf8(rt, prop), jsi::String::createFromUtf8(rt, value));
}

void SpectrumJSIConverter::setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop,
                                          const jsi::Object& value) {
    obj.setProperty(rt, jsi::PropNameID::forUtf8(rt, prop), value);
}

void SpectrumJSIConverter::setJSIProperty(jsi::Runtime& rt, jsi::Object& obj, const std::string& prop,
                                          const jsi::Array& value) {
    obj.setProperty(rt, jsi::PropNameID::forUtf8(rt, prop), value);
}

} // namespace react
} // namespace facebook
