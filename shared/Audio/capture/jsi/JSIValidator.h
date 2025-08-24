#pragma once

#include "../config/AudioLimits.h"
#include <jsi/jsi.h>
#include <string>
#include <vector>


namespace Nyth {
namespace Audio {

// === Classe de validation JSI réutilisable ===
class JSIValidator {
public:
    // === Validation de types basiques ===
    static void validateNumber(jsi::Runtime& rt, const jsi::Value& val, const std::string& name) {
        if (!val.isNumber()) {
            throw jsi::JSError(rt, name + " must be a number");
        }
    }

    static void validateString(jsi::Runtime& rt, const jsi::Value& val, const std::string& name) {
        if (!val.isString()) {
            throw jsi::JSError(rt, name + " must be a string");
        }
    }

    static void validateBool(jsi::Runtime& rt, const jsi::Value& val, const std::string& name) {
        if (!val.isBool()) {
            throw jsi::JSError(rt, name + " must be a boolean");
        }
    }

    static void validateObject(jsi::Runtime& rt, const jsi::Value& val, const std::string& name) {
        if (!val.isObject()) {
            throw jsi::JSError(rt, name + " must be an object");
        }
    }

    static void validateArray(jsi::Runtime& rt, const jsi::Value& val, const std::string& name) {
        if (!val.isObject() || !val.asObject(rt).isArray(rt)) {
            throw jsi::JSError(rt, name + " must be an array");
        }
    }

    static void validateFunction(jsi::Runtime& rt, const jsi::Value& val, const std::string& name) {
        if (!val.isObject() || !val.asObject(rt).isFunction(rt)) {
            throw jsi::JSError(rt, name + " must be a function");
        }
    }

    // === Validation avec plages ===
    static double validateNumberInRange(jsi::Runtime& rt, const jsi::Value& val, const std::string& name, double min,
                                        double max) {
        validateNumber(rt, val, name);
        double value = val.asNumber();
        if (value < min || value > max) {
            throw jsi::JSError(rt, name + " must be between " + std::to_string(min) + " and " + std::to_string(max));
        }
        return value;
    }

    // === Validation spécifique audio ===
    static int validateSampleRate(jsi::Runtime& rt, const jsi::Value& val) {
        return static_cast<int>(
            validateNumberInRange(rt, val, "sampleRate", Limits::MIN_SAMPLE_RATE, Limits::MAX_SAMPLE_RATE));
    }

    static int validateChannelCount(jsi::Runtime& rt, const jsi::Value& val) {
        return static_cast<int>(
            validateNumberInRange(rt, val, "channelCount", Limits::MIN_CHANNELS, Limits::MAX_CHANNELS));
    }

    static int validateBitsPerSample(jsi::Runtime& rt, const jsi::Value& val) {
        int bits = static_cast<int>(
            validateNumberInRange(rt, val, "bitsPerSample", Limits::MIN_BITS_PER_SAMPLE, Limits::MAX_BITS_PER_SAMPLE));
        if (bits != 8 && bits != 16 && bits != 24 && bits != 32) {
            throw jsi::JSError(rt, "bitsPerSample must be 8, 16, 24, or 32");
        }
        return bits;
    }

    static int validateBufferSizeFrames(jsi::Runtime& rt, const jsi::Value& val) {
        return static_cast<int>(validateNumberInRange(rt, val, "bufferSizeFrames", Limits::MIN_BUFFER_SIZE_FRAMES,
                                                      Limits::MAX_BUFFER_SIZE_FRAMES));
    }

    static double validateAnalysisInterval(jsi::Runtime& rt, const jsi::Value& val) {
        return validateNumberInRange(rt, val, "analysisIntervalMs", Limits::MIN_ANALYSIS_INTERVAL_MS,
                                     Limits::MAX_ANALYSIS_INTERVAL_MS);
    }

    static float validateThreshold(jsi::Runtime& rt, const jsi::Value& val, const std::string& name = "threshold") {
        return static_cast<float>(validateNumberInRange(rt, val, name, Limits::MIN_THRESHOLD, Limits::MAX_THRESHOLD));
    }

    // === Validation de taille de tableau ===
    static size_t validateArraySize(jsi::Runtime& rt, const jsi::Array& array, const std::string& name,
                                    size_t maxSize = Limits::MAX_ARRAY_LENGTH) {
        size_t length = array.length(rt);
        if (length > maxSize) {
            throw jsi::JSError(rt, name + " array is too large (max: " + std::to_string(maxSize) + ")");
        }
        return length;
    }

    // === Validation de propriété optionnelle ===
    template <typename T>
    static bool getOptionalProperty(jsi::Runtime& rt, const jsi::Object& obj, const std::string& propName, T& value,
                                    std::function<T(jsi::Runtime&, const jsi::Value&)> converter) {
        if (obj.hasProperty(rt, propName.c_str())) {
            auto prop = obj.getProperty(rt, propName.c_str());
            value = converter(rt, prop);
            return true;
        }
        return false;
    }

    // === Validation de format d'enregistrement ===
    static std::string validateRecordingFormat(jsi::Runtime& rt, const jsi::Value& val) {
        validateString(rt, val, "format");
        std::string format = val.asString(rt).utf8(rt);
        if (format != "WAV" && format != "RAW_PCM") {
            throw jsi::JSError(rt, "Recording format must be 'WAV' or 'RAW_PCM'");
        }
        return format;
    }

    // === Validation de chemin de fichier ===
    static std::string validateFilePath(jsi::Runtime& rt, const jsi::Value& val) {
        validateString(rt, val, "filePath");
        std::string path = val.asString(rt).utf8(rt);
        if (path.empty()) {
            throw jsi::JSError(rt, "File path cannot be empty");
        }
        if (path.length() > Limits::MAX_FILE_PATH_LENGTH) {
            throw jsi::JSError(rt, "File path too long (max: " + std::to_string(Limits::MAX_FILE_PATH_LENGTH) + ")");
        }
        return path;
    }

    // === Validation de nom de fichier ===
    static std::string validateFileName(jsi::Runtime& rt, const jsi::Value& val) {
        validateString(rt, val, "fileName");
        std::string name = val.asString(rt).utf8(rt);
        if (name.empty()) {
            throw jsi::JSError(rt, "File name cannot be empty");
        }
        if (name.length() > Limits::MAX_FILENAME_LENGTH) {
            throw jsi::JSError(rt, "File name too long (max: " + std::to_string(Limits::MAX_FILENAME_LENGTH) + ")");
        }
        return name;
    }
};

} // namespace Audio
} // namespace Nyth
