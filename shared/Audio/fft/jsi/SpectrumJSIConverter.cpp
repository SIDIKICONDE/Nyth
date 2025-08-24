#include "SpectrumJSIConverter.h"

#include <algorithm>
#include <cmath>

namespace facebook {
namespace react {

// === Implémentation des conversions JSI vers native ===

// Configuration
Nyth::Audio::SpectrumConfig SpectrumJSIConverter::jsiToSpectrumConfig(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    Nyth::Audio::SpectrumConfig config = Nyth::Audio::SpectrumConfig::getDefault();

    // Paramètres FFT
    if (hasProperty(rt, jsConfig, PROP_FFT_SIZE)) {
        config.fftSize = static_cast<size_t>(getJSISize(rt, jsConfig, PROP_FFT_SIZE, config.fftSize));
    }

    if (hasProperty(rt, jsConfig, PROP_SAMPLE_RATE)) {
        config.sampleRate = getJSIUint32(rt, jsConfig, PROP_SAMPLE_RATE, config.sampleRate);
    }

    // Plage de fréquences
    if (hasProperty(rt, jsConfig, PROP_MIN_FREQ)) {
        config.minFreq = getJSIDouble(rt, jsConfig, PROP_MIN_FREQ, config.minFreq);
    }

    if (hasProperty(rt, jsConfig, PROP_MAX_FREQ)) {
        config.maxFreq = getJSIDouble(rt, jsConfig, PROP_MAX_FREQ, config.maxFreq);
    }

    if (hasProperty(rt, jsConfig, PROP_NUM_BANDS)) {
        config.numBands = static_cast<size_t>(getJSISize(rt, jsConfig, PROP_NUM_BANDS, config.numBands));
    }

    // Paramètres de traitement
    if (hasProperty(rt, jsConfig, PROP_USE_WINDOWING)) {
        config.useWindowing = getJSIBool(rt, jsConfig, PROP_USE_WINDOWING, config.useWindowing);
    }

    if (hasProperty(rt, jsConfig, PROP_USE_SIMD)) {
        config.useSIMD = getJSIBool(rt, jsConfig, PROP_USE_SIMD, config.useSIMD);
    }

    if (hasProperty(rt, jsConfig, PROP_OVERLAP)) {
        config.overlap = getJSIDouble(rt, jsConfig, PROP_OVERLAP, config.overlap);
    }

    // Optimisations
    if (hasProperty(rt, jsConfig, PROP_ENABLE_MEMORY_POOL)) {
        config.enableMemoryPool = getJSIBool(rt, jsConfig, PROP_ENABLE_MEMORY_POOL, config.enableMemoryPool);
    }

    if (hasProperty(rt, jsConfig, PROP_MEMORY_POOL_SIZE)) {
        config.memoryPoolSize =
            static_cast<size_t>(getJSISize(rt, jsConfig, PROP_MEMORY_POOL_SIZE, config.memoryPoolSize));
    }

    return config;
}

// Données audio
std::vector<float> SpectrumJSIConverter::jsiArrayToFloatVector(jsi::Runtime& rt, const jsi::Array& jsArray) {
    size_t length = jsArray.length(rt);
    std::vector<float> result(length);

    for (size_t i = 0; i < length; ++i) {
        jsi::Value element = jsArray.getValueAtIndex(rt, i);
        if (element.isNumber()) {
            result[i] = static_cast<float>(element.asNumber());
        } else {
            result[i] = 0.0f;
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

    // Magnitudes
    if (data.magnitudes && data.numBands > 0) {
        jsi::Array magnitudes(rt, data.numBands);
        for (size_t i = 0; i < data.numBands; ++i) {
            magnitudes.setValueAtIndex(rt, i, jsi::Value(data.magnitudes[i]));
        }
        setJSIProperty(rt, jsData, PROP_MAGNITUDES, magnitudes);
    }

    // Fréquences
    if (data.frequencies && data.numBands > 0) {
        jsi::Array frequencies(rt, data.numBands);
        for (size_t i = 0; i < data.numBands; ++i) {
            frequencies.setValueAtIndex(rt, i, jsi::Value(data.frequencies[i]));
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
