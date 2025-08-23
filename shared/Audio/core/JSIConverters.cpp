#include "JSIConverters.hpp"

namespace facebook {
namespace react {

// === Configuration converters ===
NythCoreEqualizerConfig JSIConverters::parseEqualizerConfig(jsi::Runtime& rt, const jsi::Object& jsConfig, uint32_t defaultSampleRate) {
    NythCoreEqualizerConfig config = {};
    config.numBands = 10; // Default 10-band EQ
    config.sampleRate = defaultSampleRate;
    config.masterGainDB = 0.0;
    config.bypass = false;

    if (jsConfig.hasProperty(rt, "numBands")) {
        config.numBands = static_cast<size_t>(jsConfig.getProperty(rt, "numBands").asNumber());
    }
    if (jsConfig.hasProperty(rt, "sampleRate")) {
        config.sampleRate = static_cast<uint32_t>(jsConfig.getProperty(rt, "sampleRate").asNumber());
    }
    if (jsConfig.hasProperty(rt, "masterGainDB")) {
        config.masterGainDB = jsConfig.getProperty(rt, "masterGainDB").asNumber();
    }
    if (jsConfig.hasProperty(rt, "bypass")) {
        config.bypass = jsConfig.getProperty(rt, "bypass").asBool();
    }

    return config;
}

jsi::Object JSIConverters::equalizerConfigToJS(jsi::Runtime& rt, const NythCoreEqualizerConfig& config) {
    jsi::Object jsConfig(rt);
    jsConfig.setProperty(rt, "numBands", jsi::Value(static_cast<int>(config.numBands)));
    jsConfig.setProperty(rt, "sampleRate", jsi::Value(static_cast<int>(config.sampleRate)));
    jsConfig.setProperty(rt, "masterGainDB", jsi::Value(config.masterGainDB));
    jsConfig.setProperty(rt, "bypass", jsi::Value(config.bypass));
    return jsConfig;
}

jsi::Object JSIConverters::equalizerInfoToJS(jsi::Runtime& rt, const NythCoreEqualizerInfo& info) {
    jsi::Object jsInfo(rt);
    jsInfo.setProperty(rt, "numBands", jsi::Value(static_cast<int>(info.numBands)));
    jsInfo.setProperty(rt, "sampleRate", jsi::Value(static_cast<int>(info.sampleRate)));
    jsInfo.setProperty(rt, "masterGainDB", jsi::Value(info.masterGainDB));
    jsInfo.setProperty(rt, "bypass", jsi::Value(info.bypass));
    jsInfo.setProperty(rt, "state", jsi::String::createFromUtf8(rt, stateToString(info.state)));
    return jsInfo;
}

NythCoreBandConfig JSIConverters::parseBandConfig(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    NythCoreBandConfig config = {};
    config.bandIndex = 0;
    config.frequency = 1000.0;
    config.gainDB = 0.0;
    config.q = 1.0;
    config.type = CORE_FILTER_PEAK;
    config.enabled = true;

    if (jsConfig.hasProperty(rt, "bandIndex")) {
        config.bandIndex = static_cast<size_t>(jsConfig.getProperty(rt, "bandIndex").asNumber());
    }
    if (jsConfig.hasProperty(rt, "frequency")) {
        config.frequency = jsConfig.getProperty(rt, "frequency").asNumber();
    }
    if (jsConfig.hasProperty(rt, "gainDB")) {
        config.gainDB = jsConfig.getProperty(rt, "gainDB").asNumber();
    }
    if (jsConfig.hasProperty(rt, "q")) {
        config.q = jsConfig.getProperty(rt, "q").asNumber();
    }
    if (jsConfig.hasProperty(rt, "type")) {
        std::string typeStr = jsConfig.getProperty(rt, "type").asString(rt).utf8(rt);
        config.type = stringToFilterType(typeStr);
    }
    if (jsConfig.hasProperty(rt, "enabled")) {
        config.enabled = jsConfig.getProperty(rt, "enabled").asBool();
    }

    return config;
}

jsi::Object JSIConverters::bandConfigToJS(jsi::Runtime& rt, const NythCoreBandConfig& config) {
    jsi::Object jsConfig(rt);
    jsConfig.setProperty(rt, "bandIndex", jsi::Value(static_cast<int>(config.bandIndex)));
    jsConfig.setProperty(rt, "frequency", jsi::Value(config.frequency));
    jsConfig.setProperty(rt, "gainDB", jsi::Value(config.gainDB));
    jsConfig.setProperty(rt, "q", jsi::Value(config.q));
    jsConfig.setProperty(rt, "type", jsi::String::createFromUtf8(rt, filterTypeToString(config.type)));
    jsConfig.setProperty(rt, "enabled", jsi::Value(config.enabled));
    return jsConfig;
}

NythCoreFilterConfig JSIConverters::parseFilterConfig(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    NythCoreFilterConfig config = {};
    config.frequency = 1000.0;
    config.q = 1.0;
    config.gainDB = 0.0;
    config.type = CORE_FILTER_PEAK;

    if (jsConfig.hasProperty(rt, "frequency")) {
        config.frequency = jsConfig.getProperty(rt, "frequency").asNumber();
    }
    if (jsConfig.hasProperty(rt, "q")) {
        config.q = jsConfig.getProperty(rt, "q").asNumber();
    }
    if (jsConfig.hasProperty(rt, "gainDB")) {
        config.gainDB = jsConfig.getProperty(rt, "gainDB").asNumber();
    }
    if (jsConfig.hasProperty(rt, "type")) {
        std::string typeStr = jsConfig.getProperty(rt, "type").asString(rt).utf8(rt);
        config.type = stringToFilterType(typeStr);
    }

    return config;
}

jsi::Object JSIConverters::filterConfigToJS(jsi::Runtime& rt, const NythCoreFilterConfig& config) {
    jsi::Object jsConfig(rt);
    jsConfig.setProperty(rt, "frequency", jsi::Value(config.frequency));
    jsConfig.setProperty(rt, "q", jsi::Value(config.q));
    jsConfig.setProperty(rt, "gainDB", jsi::Value(config.gainDB));
    jsConfig.setProperty(rt, "type", jsi::String::createFromUtf8(rt, filterTypeToString(config.type)));
    return jsConfig;
}

jsi::Object JSIConverters::filterInfoToJS(jsi::Runtime& rt, const NythCoreFilterInfo& info) {
    jsi::Object jsInfo(rt);
    jsInfo.setProperty(rt, "a0", jsi::Value(info.a0));
    jsInfo.setProperty(rt, "a1", jsi::Value(info.a1));
    jsInfo.setProperty(rt, "a2", jsi::Value(info.a2));
    jsInfo.setProperty(rt, "b1", jsi::Value(info.b1));
    jsInfo.setProperty(rt, "b2", jsi::Value(info.b2));
    jsInfo.setProperty(rt, "y1", jsi::Value(info.y1));
    jsInfo.setProperty(rt, "y2", jsi::Value(info.y2));
    return jsInfo;
}

// === Array converters ===
std::vector<float> JSIConverters::arrayToFloatVector(jsi::Runtime& rt, const jsi::Array& array) {
    size_t length = array.length(rt);
    std::vector<float> result(length);
    for (size_t i = 0; i < length; ++i) {
        result[i] = static_cast<float>(array.getValueAtIndex(rt, i).asNumber());
    }
    return result;
}

jsi::Array JSIConverters::floatVectorToArray(jsi::Runtime& rt, const std::vector<float>& vector) {
    jsi::Array result(rt, vector.size());
    for (size_t i = 0; i < vector.size(); ++i) {
        result.setValueAtIndex(rt, i, jsi::Value(vector[i]));
    }
    return result;
}

// === Type converters ===
NythCoreFilterType JSIConverters::stringToFilterType(const std::string& typeStr) {
    if (typeStr == "lowpass")    return CORE_FILTER_LOWPASS;
    if (typeStr == "highpass")   return CORE_FILTER_HIGHPASS;
    if (typeStr == "bandpass")   return CORE_FILTER_BANDPASS;
    if (typeStr == "notch")      return CORE_FILTER_NOTCH;
    if (typeStr == "peak")       return CORE_FILTER_PEAK;
    if (typeStr == "lowshelf")   return CORE_FILTER_LOWSHELF;
    if (typeStr == "highshelf")  return CORE_FILTER_HIGHSHELF;
    if (typeStr == "allpass")    return CORE_FILTER_ALLPASS;
    return CORE_FILTER_PEAK;
}

std::string JSIConverters::filterTypeToString(NythCoreFilterType type) {
    switch (type) {
        case CORE_FILTER_LOWPASS:    return "lowpass";
        case CORE_FILTER_HIGHPASS:   return "highpass";
        case CORE_FILTER_BANDPASS:   return "bandpass";
        case CORE_FILTER_NOTCH:      return "notch";
        case CORE_FILTER_PEAK:       return "peak";
        case CORE_FILTER_LOWSHELF:   return "lowshelf";
        case CORE_FILTER_HIGHSHELF:  return "highshelf";
        case CORE_FILTER_ALLPASS:    return "allpass";
        default:                     return "peak";
    }
}

std::string JSIConverters::stateToString(NythCoreState state) {
    switch (state) {
        case CORE_STATE_UNINITIALIZED: return "uninitialized";
        case CORE_STATE_INITIALIZED:   return "initialized";
        case CORE_STATE_PROCESSING:    return "processing";
        case CORE_STATE_ERROR:         return "error";
        default:                       return "unknown";
    }
}

std::string JSIConverters::errorToString(NythCoreError error) {
    switch (error) {
        case CORE_ERROR_OK:                 return "OK";
        case CORE_ERROR_NOT_INITIALIZED:    return "Not initialized";
        case CORE_ERROR_ALREADY_RUNNING:    return "Already running";
        case CORE_ERROR_ALREADY_STOPPED:    return "Already stopped";
        case CORE_ERROR_MODULE_ERROR:       return "Module error";
        case CORE_ERROR_CONFIG_ERROR:       return "Config error";
        case CORE_ERROR_PROCESSING_FAILED:  return "Processing failed";
        case CORE_ERROR_MEMORY_ERROR:       return "Memory error";
        case CORE_ERROR_THREAD_ERROR:       return "Thread error";
        default:                            return "Unknown error";
    }
}

NythCoreError JSIConverters::stringToError(const std::string& error) {
    if (error == "not_initialized")    return CORE_ERROR_NOT_INITIALIZED;
    if (error == "already_running")    return CORE_ERROR_ALREADY_RUNNING;
    if (error == "already_stopped")    return CORE_ERROR_ALREADY_STOPPED;
    if (error == "config_error")       return CORE_ERROR_CONFIG_ERROR;
    if (error == "processing_failed")  return CORE_ERROR_PROCESSING_FAILED;
    if (error == "memory_error")       return CORE_ERROR_MEMORY_ERROR;
    if (error == "thread_error")       return CORE_ERROR_THREAD_ERROR;
    return CORE_ERROR_MODULE_ERROR;
}

} // namespace react
} // namespace facebook