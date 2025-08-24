#include "JSIConverter.h"
#include <cstring>
#include <stdexcept>

namespace facebook {
namespace react {

// === Conversion AudioConfig ===
Nyth::Audio::AudioConfig JSIConverter::jsToAudioConfig(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    Nyth::Audio::AudioConfig config;
    
    // Extraire les propriétés de base
    if (jsConfig.hasProperty(rt, "sampleRate")) {
        config.sampleRate = static_cast<uint32_t>(jsConfig.getProperty(rt, "sampleRate").asNumber());
    }
    
    if (jsConfig.hasProperty(rt, "bufferSize")) {
        config.bufferSize = static_cast<uint32_t>(jsConfig.getProperty(rt, "bufferSize").asNumber());
    }
    
    if (jsConfig.hasProperty(rt, "channels")) {
        config.channels = static_cast<uint32_t>(jsConfig.getProperty(rt, "channels").asNumber());
    }
    
    if (jsConfig.hasProperty(rt, "bitDepth")) {
        config.bitDepth = static_cast<uint32_t>(jsConfig.getProperty(rt, "bitDepth").asNumber());
    }
    
    if (jsConfig.hasProperty(rt, "format")) {
        auto formatStr = jsConfig.getProperty(rt, "format").asString(rt).utf8(rt);
        // Convertir le format string en enum si nécessaire
        if (formatStr == "float32") {
            config.format = Nyth::Audio::AudioFormat::Float32;
        } else if (formatStr == "int16") {
            config.format = Nyth::Audio::AudioFormat::Int16;
        } else if (formatStr == "int32") {
            config.format = Nyth::Audio::AudioFormat::Int32;
        }
    }
    
    if (jsConfig.hasProperty(rt, "isInterleaved")) {
        config.isInterleaved = jsConfig.getProperty(rt, "isInterleaved").asBool();
    }
    
    return config;
}

jsi::Object JSIConverter::audioConfigToJS(jsi::Runtime& rt, const Nyth::Audio::AudioConfig& config) {
    auto jsConfig = jsi::Object(rt);
    
    jsConfig.setProperty(rt, "sampleRate", jsi::Value(static_cast<double>(config.sampleRate)));
    jsConfig.setProperty(rt, "bufferSize", jsi::Value(static_cast<double>(config.bufferSize)));
    jsConfig.setProperty(rt, "channels", jsi::Value(static_cast<double>(config.channels)));
    jsConfig.setProperty(rt, "bitDepth", jsi::Value(static_cast<double>(config.bitDepth)));
    jsConfig.setProperty(rt, "isInterleaved", jsi::Value(config.isInterleaved));
    
    // Convertir le format enum en string
    std::string formatStr;
    switch (config.format) {
        case Nyth::Audio::AudioFormat::Float32:
            formatStr = "float32";
            break;
        case Nyth::Audio::AudioFormat::Int16:
            formatStr = "int16";
            break;
        case Nyth::Audio::AudioFormat::Int32:
            formatStr = "int32";
            break;
        default:
            formatStr = "unknown";
    }
    jsConfig.setProperty(rt, "format", jsi::String::createFromUtf8(rt, formatStr));
    
    return jsConfig;
}

// === Conversion des arrays audio ===
std::vector<float> JSIConverter::jsArrayToFloatVector(jsi::Runtime& rt, const jsi::Value& jsArray) {
    if (!jsArray.isObject()) {
        throw std::runtime_error("Expected an array object");
    }
    
    auto arrayObj = jsArray.asObject(rt);
    
    // Essayer d'abord la conversion optimisée via TypedArray
    if (isTypedArray(rt, jsArray)) {
        float* data = nullptr;
        size_t length = 0;
        
        if (getTypedArrayData(rt, arrayObj, &data, &length)) {
            // Copie rapide depuis le TypedArray
            return std::vector<float>(data, data + length);
        }
    }
    
    // Fallback vers la conversion élément par élément
    if (!arrayObj.isArray(rt)) {
        throw std::runtime_error("Value is not an array");
    }
    
    auto array = arrayObj.asArray(rt);
    size_t length = array.length(rt);
    std::vector<float> result;
    result.reserve(length);
    
    for (size_t i = 0; i < length; ++i) {
        result.push_back(static_cast<float>(array.getValueAtIndex(rt, i).asNumber()));
    }
    
    return result;
}

jsi::Value JSIConverter::floatVectorToJSArray(jsi::Runtime& rt, const std::vector<float>& data) {
    return floatArrayToJSArray(rt, data.data(), data.size());
}

jsi::Value JSIConverter::floatArrayToJSArray(jsi::Runtime& rt, const float* data, size_t length) {
    // Tentative de création d'un TypedArray pour de meilleures performances
    try {
        // Vérifier si Float32Array est disponible
        auto global = rt.global();
        if (global.hasProperty(rt, "Float32Array")) {
            auto Float32Array = global.getPropertyAsFunction(rt, "Float32Array");
            
            // Créer un ArrayBuffer
            auto arrayBuffer = jsi::ArrayBuffer(rt, length * sizeof(float));
            memcpy(arrayBuffer.data(rt), data, length * sizeof(float));
            
            // Créer le Float32Array à partir de l'ArrayBuffer
            return Float32Array.callAsConstructor(rt, arrayBuffer);
        }
    } catch (...) {
        // Fallback si Float32Array n'est pas disponible
    }
    
    // Fallback vers un Array JavaScript normal
    auto array = jsi::Array(rt, length);
    for (size_t i = 0; i < length; ++i) {
        array.setValueAtIndex(rt, i, jsi::Value(data[i]));
    }
    
    return array;
}

// === Conversion des paramètres de filtre ===
int JSIConverter::stringToFilterType(const std::string& filterType) {
    if (filterType == "lowpass") return 0;
    if (filterType == "highpass") return 1;
    if (filterType == "bandpass") return 2;
    if (filterType == "notch") return 3;
    if (filterType == "peak" || filterType == "peaking") return 4;
    if (filterType == "lowshelf") return 5;
    if (filterType == "highshelf") return 6;
    if (filterType == "allpass") return 7;
    
    // Default to peak
    return 4;
}

std::string JSIConverter::filterTypeToString(int type) {
    switch (type) {
        case 0: return "lowpass";
        case 1: return "highpass";
        case 2: return "bandpass";
        case 3: return "notch";
        case 4: return "peak";
        case 5: return "lowshelf";
        case 6: return "highshelf";
        case 7: return "allpass";
        default: return "peak";
    }
}

// === Conversion des configurations de bande EQ ===
JSIConverter::EQBandConfig JSIConverter::jsToEQBandConfig(jsi::Runtime& rt, const jsi::Object& jsBand) {
    EQBandConfig config;
    
    if (jsBand.hasProperty(rt, "frequency")) {
        config.frequency = jsBand.getProperty(rt, "frequency").asNumber();
    }
    
    if (jsBand.hasProperty(rt, "gainDB")) {
        config.gainDB = jsBand.getProperty(rt, "gainDB").asNumber();
    }
    
    if (jsBand.hasProperty(rt, "q")) {
        config.q = jsBand.getProperty(rt, "q").asNumber();
    }
    
    if (jsBand.hasProperty(rt, "type")) {
        auto typeValue = jsBand.getProperty(rt, "type");
        if (typeValue.isString()) {
            config.type = stringToFilterType(typeValue.asString(rt).utf8(rt));
        } else if (typeValue.isNumber()) {
            config.type = static_cast<int>(typeValue.asNumber());
        }
    }
    
    if (jsBand.hasProperty(rt, "enabled")) {
        config.enabled = jsBand.getProperty(rt, "enabled").asBool();
    }
    
    return config;
}

jsi::Object JSIConverter::eqBandConfigToJS(jsi::Runtime& rt, const EQBandConfig& band) {
    auto jsBand = jsi::Object(rt);
    
    jsBand.setProperty(rt, "frequency", jsi::Value(band.frequency));
    jsBand.setProperty(rt, "gainDB", jsi::Value(band.gainDB));
    jsBand.setProperty(rt, "q", jsi::Value(band.q));
    jsBand.setProperty(rt, "type", jsi::String::createFromUtf8(rt, filterTypeToString(band.type)));
    jsBand.setProperty(rt, "enabled", jsi::Value(band.enabled));
    
    return jsBand;
}

// === Utilitaires de validation ===
bool JSIConverter::isTypedArray(jsi::Runtime& rt, const jsi::Value& value) {
    if (!value.isObject()) {
        return false;
    }
    
    try {
        auto obj = value.asObject(rt);
        
        // Vérifier si c'est un TypedArray en vérifiant la présence de propriétés spécifiques
        if (obj.hasProperty(rt, "buffer") && 
            obj.hasProperty(rt, "byteLength") && 
            obj.hasProperty(rt, "byteOffset")) {
            
            // Vérifier aussi le constructeur
            auto constructor = obj.getProperty(rt, "constructor");
            if (constructor.isObject()) {
                auto constructorObj = constructor.asObject(rt);
                if (constructorObj.hasProperty(rt, "name")) {
                    auto name = constructorObj.getProperty(rt, "name").asString(rt).utf8(rt);
                    return name.find("Array") != std::string::npos;
                }
            }
        }
    } catch (...) {
        // En cas d'erreur, ce n'est pas un TypedArray
    }
    
    return false;
}

bool JSIConverter::getTypedArrayData(jsi::Runtime& rt, const jsi::Object& array, 
                                     float** outData, size_t* outLength) {
    try {
        // Vérifier si c'est un Float32Array
        auto constructor = array.getProperty(rt, "constructor");
        if (constructor.isObject()) {
            auto constructorObj = constructor.asObject(rt);
            if (constructorObj.hasProperty(rt, "name")) {
                auto name = constructorObj.getProperty(rt, "name").asString(rt).utf8(rt);
                if (name != "Float32Array") {
                    return false; // Nous ne supportons que Float32Array pour l'instant
                }
            }
        }
        
        // Obtenir le buffer sous-jacent
        auto bufferProp = array.getProperty(rt, "buffer");
        if (!bufferProp.isObject()) {
            return false;
        }
        
        auto buffer = bufferProp.asObject(rt).asArrayBuffer(rt);
        auto byteOffset = static_cast<size_t>(array.getProperty(rt, "byteOffset").asNumber());
        auto byteLength = static_cast<size_t>(array.getProperty(rt, "byteLength").asNumber());
        
        *outData = reinterpret_cast<float*>(static_cast<uint8_t*>(buffer.data(rt)) + byteOffset);
        *outLength = byteLength / sizeof(float);
        
        return true;
    } catch (...) {
        return false;
    }
}

} // namespace react
} // namespace facebook