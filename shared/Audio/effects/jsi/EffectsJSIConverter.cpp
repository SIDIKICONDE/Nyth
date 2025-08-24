#include "EffectsJSIConverter.h"

namespace facebook {
namespace react {

// === Conversion des configurations ===

Nyth::Audio::EffectsConfig EffectsJSIConverter::effectsConfigFromJS(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    Nyth::Audio::EffectsConfig config;

    if (hasProperty(rt, jsConfig, "sampleRate")) {
        config.sampleRate =
            static_cast<uint32_t>(getNumberProperty(rt, jsConfig, "sampleRate", Nyth::Audio::DEFAULT_SAMPLE_RATE));
    }

    if (hasProperty(rt, jsConfig, "channels")) {
        config.channels = static_cast<int>(getNumberProperty(rt, jsConfig, "channels", Nyth::Audio::DEFAULT_CHANNELS));
    }

    if (hasProperty(rt, jsConfig, "inputLevel")) {
        config.inputLevel =
            static_cast<float>(getNumberProperty(rt, jsConfig, "inputLevel", Nyth::Audio::DEFAULT_LEVEL));
    }

    if (hasProperty(rt, jsConfig, "outputLevel")) {
        config.outputLevel =
            static_cast<float>(getNumberProperty(rt, jsConfig, "outputLevel", Nyth::Audio::DEFAULT_LEVEL));
    }

    if (hasProperty(rt, jsConfig, "bypassAll")) {
        config.bypassAll = getBoolProperty(rt, jsConfig, "bypassAll", false);
    }

    return config;
}

jsi::Object EffectsJSIConverter::effectsConfigToJS(jsi::Runtime& rt, const Nyth::Audio::EffectsConfig& config) {
    jsi::Object jsConfig(rt);

    jsConfig.setProperty(rt, "sampleRate", jsi::Value(static_cast<int>(config.sampleRate)));
    jsConfig.setProperty(rt, "channels", jsi::Value(config.channels));
    jsConfig.setProperty(rt, "inputLevel", jsi::Value(config.inputLevel));
    jsConfig.setProperty(rt, "outputLevel", jsi::Value(config.outputLevel));
    jsConfig.setProperty(rt, "bypassAll", jsi::Value(config.bypassAll));

    return jsConfig;
}

Nyth::Audio::CompressorConfig EffectsJSIConverter::compressorConfigFromJS(jsi::Runtime& rt,
                                                                          const jsi::Object& jsConfig) {
    Nyth::Audio::CompressorConfig config;

    if (hasProperty(rt, jsConfig, "thresholdDb")) {
        config.thresholdDb = static_cast<float>(
            getNumberProperty(rt, jsConfig, "thresholdDb", Nyth::Audio::Effects::Compressor::DEFAULT_THRESHOLD_DB));
    }

    if (hasProperty(rt, jsConfig, "ratio")) {
        config.ratio = static_cast<float>(
            getNumberProperty(rt, jsConfig, "ratio", Nyth::Audio::Effects::Compressor::DEFAULT_RATIO));
    }

    if (hasProperty(rt, jsConfig, "attackMs")) {
        config.attackMs = static_cast<float>(
            getNumberProperty(rt, jsConfig, "attackMs", Nyth::Audio::Effects::Compressor::DEFAULT_ATTACK_MS));
    }

    if (hasProperty(rt, jsConfig, "releaseMs")) {
        config.releaseMs = static_cast<float>(
            getNumberProperty(rt, jsConfig, "releaseMs", Nyth::Audio::Effects::Compressor::DEFAULT_RELEASE_MS));
    }

    if (hasProperty(rt, jsConfig, "makeupDb")) {
        config.makeupDb = static_cast<float>(
            getNumberProperty(rt, jsConfig, "makeupDb", Nyth::Audio::Effects::Compressor::DEFAULT_MAKEUP_DB));
    }

    if (hasProperty(rt, jsConfig, "enabled")) {
        config.enabled = getBoolProperty(rt, jsConfig, "enabled", true);
    }

    return config;
}

jsi::Object EffectsJSIConverter::compressorConfigToJS(jsi::Runtime& rt, const Nyth::Audio::CompressorConfig& config) {
    jsi::Object jsConfig(rt);

    jsConfig.setProperty(rt, "thresholdDb", jsi::Value(config.thresholdDb));
    jsConfig.setProperty(rt, "ratio", jsi::Value(config.ratio));
    jsConfig.setProperty(rt, "attackMs", jsi::Value(config.attackMs));
    jsConfig.setProperty(rt, "releaseMs", jsi::Value(config.releaseMs));
    jsConfig.setProperty(rt, "makeupDb", jsi::Value(config.makeupDb));
    jsConfig.setProperty(rt, "enabled", jsi::Value(config.enabled));

    return jsConfig;
}

Nyth::Audio::DelayConfig EffectsJSIConverter::delayConfigFromJS(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    Nyth::Audio::DelayConfig config;

    if (hasProperty(rt, jsConfig, "delayMs")) {
        config.delayMs = static_cast<float>(
            getNumberProperty(rt, jsConfig, "delayMs", Nyth::Audio::Effects::Delay::DEFAULT_DELAY_MS));
    }

    if (hasProperty(rt, jsConfig, "feedback")) {
        config.feedback = static_cast<float>(
            getNumberProperty(rt, jsConfig, "feedback", Nyth::Audio::Effects::Delay::DEFAULT_FEEDBACK));
    }

    if (hasProperty(rt, jsConfig, "mix")) {
        config.mix =
            static_cast<float>(getNumberProperty(rt, jsConfig, "mix", Nyth::Audio::Effects::Delay::DEFAULT_MIX));
    }

    if (hasProperty(rt, jsConfig, "enabled")) {
        config.enabled = getBoolProperty(rt, jsConfig, "enabled", true);
    }

    return config;
}

jsi::Object EffectsJSIConverter::delayConfigToJS(jsi::Runtime& rt, const Nyth::Audio::DelayConfig& config) {
    jsi::Object jsConfig(rt);

    jsConfig.setProperty(rt, "delayMs", jsi::Value(config.delayMs));
    jsConfig.setProperty(rt, "feedback", jsi::Value(config.feedback));
    jsConfig.setProperty(rt, "mix", jsi::Value(config.mix));
    jsConfig.setProperty(rt, "enabled", jsi::Value(config.enabled));

    return jsConfig;
}

Nyth::Audio::ReverbConfig EffectsJSIConverter::reverbConfigFromJS(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    Nyth::Audio::ReverbConfig config;

    if (hasProperty(rt, jsConfig, "roomSize")) {
        config.roomSize = static_cast<float>(
            getNumberProperty(rt, jsConfig, "roomSize", Nyth::Audio::Effects::Reverb::DEFAULT_ROOM_SIZE));
    }

    if (hasProperty(rt, jsConfig, "damping")) {
        config.damping = static_cast<float>(
            getNumberProperty(rt, jsConfig, "damping", Nyth::Audio::Effects::Reverb::DEFAULT_DAMPING));
    }

    if (hasProperty(rt, jsConfig, "wetLevel")) {
        config.wetLevel = static_cast<float>(
            getNumberProperty(rt, jsConfig, "wetLevel", Nyth::Audio::Effects::Reverb::DEFAULT_WET_LEVEL));
    }

    if (hasProperty(rt, jsConfig, "dryLevel")) {
        config.dryLevel = static_cast<float>(
            getNumberProperty(rt, jsConfig, "dryLevel", Nyth::Audio::Effects::Reverb::DEFAULT_DRY_LEVEL));
    }

    if (hasProperty(rt, jsConfig, "enabled")) {
        config.enabled = getBoolProperty(rt, jsConfig, "enabled", true);
    }

    return config;
}

jsi::Object EffectsJSIConverter::reverbConfigToJS(jsi::Runtime& rt, const Nyth::Audio::ReverbConfig& config) {
    jsi::Object jsConfig(rt);

    jsConfig.setProperty(rt, "roomSize", jsi::Value(config.roomSize));
    jsConfig.setProperty(rt, "damping", jsi::Value(config.damping));
    jsConfig.setProperty(rt, "wetLevel", jsi::Value(config.wetLevel));
    jsConfig.setProperty(rt, "dryLevel", jsi::Value(config.dryLevel));
    jsConfig.setProperty(rt, "enabled", jsi::Value(config.enabled));

    return jsConfig;
}

// === Conversion des métriques ===

jsi::Object EffectsJSIConverter::processingMetricsToJS(jsi::Runtime& rt,
                                                       const EffectManager::ProcessingMetrics& metrics) {
    jsi::Object jsMetrics(rt);

    jsMetrics.setProperty(rt, "inputLevel", jsi::Value(metrics.inputLevel));
    jsMetrics.setProperty(rt, "outputLevel", jsi::Value(metrics.outputLevel));
    jsMetrics.setProperty(rt, "processedFrames", jsi::Value(static_cast<double>(metrics.processedFrames)));
    jsMetrics.setProperty(rt, "processedSamples", jsi::Value(static_cast<double>(metrics.processedSamples)));
    jsMetrics.setProperty(rt, "activeEffectsCount", jsi::Value(metrics.activeEffectsCount));
    jsMetrics.setProperty(rt, "processingTimeMs", jsi::Value(metrics.processingTimeMs));

    return jsMetrics;
}

jsi::Object EffectsJSIConverter::compressorMetricsToJS(jsi::Runtime& rt,
                                                       const CompressorManager::CompressorMetrics& metrics) {
    jsi::Object jsMetrics(rt);

    jsMetrics.setProperty(rt, "inputLevel", jsi::Value(metrics.inputLevel));
    jsMetrics.setProperty(rt, "outputLevel", jsi::Value(metrics.outputLevel));
    jsMetrics.setProperty(rt, "gainReduction", jsi::Value(metrics.gainReduction));
    jsMetrics.setProperty(rt, "compressionRatio", jsi::Value(metrics.compressionRatio));
    jsMetrics.setProperty(rt, "isActive", jsi::Value(metrics.isActive));

    return jsMetrics;
}

jsi::Object EffectsJSIConverter::delayMetricsToJS(jsi::Runtime& rt, const DelayManager::DelayMetrics& metrics) {
    jsi::Object jsMetrics(rt);

    jsMetrics.setProperty(rt, "inputLevel", jsi::Value(metrics.inputLevel));
    jsMetrics.setProperty(rt, "outputLevel", jsi::Value(metrics.outputLevel));
    jsMetrics.setProperty(rt, "feedbackLevel", jsi::Value(metrics.feedbackLevel));
    jsMetrics.setProperty(rt, "wetLevel", jsi::Value(metrics.wetLevel));
    jsMetrics.setProperty(rt, "isActive", jsi::Value(metrics.isActive));

    return jsMetrics;
}

jsi::Object EffectsJSIConverter::statisticsToJS(jsi::Runtime& rt, const Nyth::Audio::EffectsStatistics& stats) {
    jsi::Object jsStats(rt);

    jsStats.setProperty(rt, "inputLevel", jsi::Value(stats.inputLevel));
    jsStats.setProperty(rt, "outputLevel", jsi::Value(stats.outputLevel));
    jsStats.setProperty(rt, "processedFrames", jsi::Value(static_cast<double>(stats.processedFrames)));
    jsStats.setProperty(rt, "processedSamples", jsi::Value(static_cast<double>(stats.processedSamples)));
    jsStats.setProperty(rt, "durationMs", jsi::Value(static_cast<double>(stats.durationMs)));
    jsStats.setProperty(rt, "activeEffectsCount", jsi::Value(stats.activeEffectsCount));

    return jsStats;
}

// === Utilitaires de conversion ===

Nyth::Audio::Effects::EffectType EffectsJSIConverter::stringToEffectType(const std::string& typeStr) {
    if (typeStr == "compressor") {
        return Nyth::Audio::Effects::EffectType::COMPRESSOR;
    } else if (typeStr == "delay") {
        return Nyth::Audio::Effects::EffectType::DELAY;
    } else if (typeStr == "reverb") {
        return Nyth::Audio::Effects::EffectType::REVERB;
    } else if (typeStr == "equalizer") {
        return Nyth::Audio::Effects::EffectType::EQUALIZER;
    } else if (typeStr == "filter") {
        return Nyth::Audio::Effects::EffectType::FILTER;
    } else if (typeStr == "limiter") {
        return Nyth::Audio::Effects::EffectType::LIMITER;
    }
    return Nyth::Audio::Effects::EffectType::UNKNOWN;
}

std::string EffectsJSIConverter::effectTypeToString(Nyth::Audio::Effects::EffectType type) {
    switch (type) {
        case Nyth::Audio::Effects::EffectType::COMPRESSOR:
            return "compressor";
        case Nyth::Audio::Effects::EffectType::DELAY:
            return "delay";
        case Nyth::Audio::Effects::EffectType::REVERB:
            return "reverb";
        case Nyth::Audio::Effects::EffectType::EQUALIZER:
            return "equalizer";
        case Nyth::Audio::Effects::EffectType::FILTER:
            return "filter";
        case Nyth::Audio::Effects::EffectType::LIMITER:
            return "limiter";
        default:
            return "unknown";
    }
}

Nyth::Audio::Effects::EffectState EffectsJSIConverter::stringToEffectState(const std::string& stateStr) {
    if (stateStr == "uninitialized") {
        return Nyth::Audio::Effects::EffectState::UNINITIALIZED;
    } else if (stateStr == "initialized") {
        return Nyth::Audio::Effects::EffectState::INITIALIZED;
    } else if (stateStr == "processing") {
        return Nyth::Audio::Effects::EffectState::PROCESSING;
    } else if (stateStr == "bypassed") {
        return Nyth::Audio::Effects::EffectState::BYPASSED;
    } else if (stateStr == "error") {
        return Nyth::Audio::Effects::EffectState::ERROR;
    }
    return Nyth::Audio::Effects::EffectState::UNINITIALIZED;
}

std::string EffectsJSIConverter::effectStateToString(Nyth::Audio::Effects::EffectState state) {
    switch (state) {
        case Nyth::Audio::Effects::EffectState::UNINITIALIZED:
            return "uninitialized";
        case Nyth::Audio::Effects::EffectState::INITIALIZED:
            return "initialized";
        case Nyth::Audio::Effects::EffectState::PROCESSING:
            return "processing";
        case Nyth::Audio::Effects::EffectState::BYPASSED:
            return "bypassed";
        case Nyth::Audio::Effects::EffectState::ERROR:
            return "error";
        default:
            return "unknown";
    }
}

// === Validation et conversion d'arrays ===

std::vector<float> EffectsJSIConverter::arrayToVector(jsi::Runtime& rt, const jsi::Array& array) {
    size_t length = array.length(rt);
    std::vector<float> vector(length);

    for (size_t i = 0; i < length; ++i) {
        vector[i] = static_cast<float>(array.getValueAtIndex(rt, i).asNumber());
    }

    return vector;
}

jsi::Array EffectsJSIConverter::vectorToArray(jsi::Runtime& rt, const std::vector<float>& vector) {
    jsi::Array array(rt, vector.size());

    for (size_t i = 0; i < vector.size(); ++i) {
        array.setValueAtIndex(rt, i, jsi::Value(vector[i]));
    }

    return array;
}

// === Méthodes utilitaires privées ===

bool EffectsJSIConverter::hasProperty(jsi::Runtime& rt, const jsi::Object& obj, const std::string& propName) {
    return obj.hasProperty(rt, propName.c_str());
}

double EffectsJSIConverter::getNumberProperty(jsi::Runtime& rt, const jsi::Object& obj, const std::string& propName,
                                              double defaultValue) {
    if (hasProperty(rt, obj, propName)) {
        auto value = obj.getProperty(rt, propName.c_str());
        if (value.isNumber()) {
            return value.asNumber();
        }
    }
    return defaultValue;
}

bool EffectsJSIConverter::getBoolProperty(jsi::Runtime& rt, const jsi::Object& obj, const std::string& propName,
                                          bool defaultValue) {
    if (hasProperty(rt, obj, propName)) {
        auto value = obj.getProperty(rt, propName.c_str());
        if (value.isBool()) {
            return value.asBool();
        }
    }
    return defaultValue;
}

std::string EffectsJSIConverter::getStringProperty(jsi::Runtime& rt, const jsi::Object& obj,
                                                   const std::string& propName, const std::string& defaultValue) {
    if (hasProperty(rt, obj, propName)) {
        auto value = obj.getProperty(rt, propName.c_str());
        if (value.isString()) {
            return value.asString(rt).utf8(rt);
        }
    }
    return defaultValue;
}

} // namespace react
} // namespace facebook
