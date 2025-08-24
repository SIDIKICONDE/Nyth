#include "JSIConverter.h"
#include <sstream>

namespace facebook {
namespace react {

// === Conversion AudioConfig ===
Nyth::Audio::AudioConfig JSIConverter::jsToAudioConfig(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    Nyth::Audio::AudioConfig config;

    // Sample Rate
    if (jsConfig.hasProperty(rt, "sampleRate")) {
        auto prop = jsConfig.getProperty(rt, "sampleRate");
        config.sampleRate = Nyth::Audio::JSIValidator::validateSampleRate(rt, prop);
    }

    // Channel Count
    if (jsConfig.hasProperty(rt, "channelCount")) {
        auto prop = jsConfig.getProperty(rt, "channelCount");
        config.channelCount = Nyth::Audio::JSIValidator::validateChannelCount(rt, prop);
    }

    // Bits per sample
    if (jsConfig.hasProperty(rt, "bitsPerSample")) {
        auto prop = jsConfig.getProperty(rt, "bitsPerSample");
        config.bitsPerSample = Nyth::Audio::JSIValidator::validateBitsPerSample(rt, prop);
    }

    // Buffer size frames
    if (jsConfig.hasProperty(rt, "bufferSizeFrames")) {
        auto prop = jsConfig.getProperty(rt, "bufferSizeFrames");
        config.bufferSizeFrames = Nyth::Audio::JSIValidator::validateBufferSizeFrames(rt, prop);
    }

    // Number of buffers
    if (jsConfig.hasProperty(rt, "numBuffers")) {
        auto prop = jsConfig.getProperty(rt, "numBuffers");
        config.numBuffers = static_cast<int>(Nyth::Audio::JSIValidator::validateNumberInRange(
            rt, prop, "numBuffers", Nyth::Audio::Limits::MIN_NUM_BUFFERS, Nyth::Audio::Limits::MAX_NUM_BUFFERS));
    }

    // Options booléennes
    if (jsConfig.hasProperty(rt, "enableEchoCancellation")) {
        auto prop = jsConfig.getProperty(rt, "enableEchoCancellation");
        Nyth::Audio::JSIValidator::validateBool(rt, prop, "enableEchoCancellation");
        config.enableEchoCancellation = prop.asBool();
    }

    if (jsConfig.hasProperty(rt, "enableNoiseSuppression")) {
        auto prop = jsConfig.getProperty(rt, "enableNoiseSuppression");
        Nyth::Audio::JSIValidator::validateBool(rt, prop, "enableNoiseSuppression");
        config.enableNoiseSuppression = prop.asBool();
    }

    if (jsConfig.hasProperty(rt, "enableAutoGainControl")) {
        auto prop = jsConfig.getProperty(rt, "enableAutoGainControl");
        Nyth::Audio::JSIValidator::validateBool(rt, prop, "enableAutoGainControl");
        config.enableAutoGainControl = prop.asBool();
    }

    // Intervalle d'analyse
    if (jsConfig.hasProperty(rt, "analysisIntervalMs")) {
        auto prop = jsConfig.getProperty(rt, "analysisIntervalMs");
        config.analysisIntervalMs = Nyth::Audio::JSIValidator::validateAnalysisInterval(rt, prop);
    }

    // Seuil de silence
    if (jsConfig.hasProperty(rt, "silenceThreshold")) {
        auto prop = jsConfig.getProperty(rt, "silenceThreshold");
        config.silenceThreshold = Nyth::Audio::JSIValidator::validateThreshold(rt, prop, "silenceThreshold");
    }

    // Validation finale
    if (!config.isValid()) {
        throw jsi::JSError(rt, "Invalid audio configuration: " + config.getValidationError());
    }

    return config;
}

jsi::Object JSIConverter::audioConfigToJS(jsi::Runtime& rt, const Nyth::Audio::AudioConfig& config) {
    auto jsConfig = createEmptyObject(rt);

    jsConfig.setProperty(rt, "sampleRate", jsi::Value(config.sampleRate));
    jsConfig.setProperty(rt, "channelCount", jsi::Value(config.channelCount));
    jsConfig.setProperty(rt, "bitsPerSample", jsi::Value(config.bitsPerSample));
    jsConfig.setProperty(rt, "bufferSizeFrames", jsi::Value(config.bufferSizeFrames));
    jsConfig.setProperty(rt, "numBuffers", jsi::Value(config.numBuffers));
    jsConfig.setProperty(rt, "enableEchoCancellation", jsi::Value(config.enableEchoCancellation));
    jsConfig.setProperty(rt, "enableNoiseSuppression", jsi::Value(config.enableNoiseSuppression));
    jsConfig.setProperty(rt, "enableAutoGainControl", jsi::Value(config.enableAutoGainControl));
    jsConfig.setProperty(rt, "analysisIntervalMs", jsi::Value(config.analysisIntervalMs));
    jsConfig.setProperty(rt, "silenceThreshold", jsi::Value(config.silenceThreshold));

    return jsConfig;
}

// === Conversion AudioRecordingConfig ===
Nyth::Audio::AudioRecordingConfig JSIConverter::jsToAudioRecordingConfig(jsi::Runtime& rt,
                                                                         const jsi::Object& jsConfig) {
    Nyth::Audio::AudioRecordingConfig config;

    // File path (obligatoire)
    if (jsConfig.hasProperty(rt, "filePath")) {
        auto prop = jsConfig.getProperty(rt, "filePath");
        config.filePath = Nyth::Audio::JSIValidator::validateFilePath(rt, prop);
    } else {
        throw jsi::JSError(rt, "filePath is required for recording configuration");
    }

    // Format (optionnel)
    if (jsConfig.hasProperty(rt, "format")) {
        auto prop = jsConfig.getProperty(rt, "format");
        config.format = Nyth::Audio::JSIValidator::validateRecordingFormat(rt, prop);
    }

    // Max duration (optionnel)
    if (jsConfig.hasProperty(rt, "maxDurationMs")) {
        auto prop = jsConfig.getProperty(rt, "maxDurationMs");
        config.maxDurationMs = static_cast<size_t>(Nyth::Audio::JSIValidator::validateNumberInRange(
            rt, prop, "maxDurationMs", Nyth::Audio::Limits::MIN_RECORDING_DURATION_MS,
            Nyth::Audio::Limits::MAX_RECORDING_DURATION_MS));
    }

    if (!config.isValid()) {
        throw jsi::JSError(rt, "Invalid recording configuration");
    }

    return config;
}

jsi::Object JSIConverter::audioRecordingConfigToJS(jsi::Runtime& rt, const Nyth::Audio::AudioRecordingConfig& config) {
    auto jsConfig = createEmptyObject(rt);

    jsConfig.setProperty(rt, "filePath", jsi::String::createFromUtf8(rt, config.filePath));
    jsConfig.setProperty(rt, "format", jsi::String::createFromUtf8(rt, config.format));
    jsConfig.setProperty(rt, "maxDurationMs", jsi::Value(static_cast<double>(config.maxDurationMs)));

    return jsConfig;
}

// === Conversion des statistiques ===
jsi::Object JSIConverter::audioStatisticsToJS(jsi::Runtime& rt, const Nyth::Audio::CaptureStatistics& stats) {
    auto jsStats = createEmptyObject(rt);

    jsStats.setProperty(rt, "framesProcessed", jsi::Value(static_cast<double>(stats.framesProcessed)));
    jsStats.setProperty(rt, "bytesProcessed", jsi::Value(static_cast<double>(stats.bytesProcessed)));
    jsStats.setProperty(rt, "averageLevel", jsi::Value(static_cast<double>(stats.averageLevel)));
    jsStats.setProperty(rt, "peakLevel", jsi::Value(static_cast<double>(stats.peakLevel)));
    jsStats.setProperty(rt, "overruns", jsi::Value(static_cast<double>(stats.overruns)));
    jsStats.setProperty(rt, "underruns", jsi::Value(static_cast<double>(stats.underruns)));
    jsStats.setProperty(rt, "durationMs", jsi::Value(static_cast<double>(stats.totalDuration.count())));

    return jsStats;
}

// === Conversion des périphériques ===
jsi::Object JSIConverter::audioDeviceToJS(jsi::Runtime& rt, const Nyth::Audio::AudioDeviceInfo& device) {
    auto jsDevice = createEmptyObject(rt);

    jsDevice.setProperty(rt, "id", jsi::String::createFromUtf8(rt, device.id));
    jsDevice.setProperty(rt, "name", jsi::String::createFromUtf8(rt, device.name));
    jsDevice.setProperty(rt, "isDefault", jsi::Value(device.isDefault));
    jsDevice.setProperty(rt, "maxChannels", jsi::Value(device.maxChannels));

    auto jsSampleRates = convertSampleRatesToJS(rt, device.supportedSampleRates);
    jsDevice.setProperty(rt, "supportedSampleRates", jsSampleRates);

    return jsDevice;
}

jsi::Array JSIConverter::audioDevicesToJS(jsi::Runtime& rt, const std::vector<Nyth::Audio::AudioDeviceInfo>& devices) {
    auto jsDevices = createEmptyArray(rt, devices.size());

    for (size_t i = 0; i < devices.size(); ++i) {
        jsDevices.setValueAtIndex(rt, i, audioDeviceToJS(rt, devices[i]));
    }

    return jsDevices;
}

// === Conversion des données d'analyse ===
jsi::Object JSIConverter::createAnalysisData(jsi::Runtime& rt, float currentLevel, float peakLevel, float averageLevel,
                                             size_t framesProcessed) {
    auto analysis = createEmptyObject(rt);

    analysis.setProperty(rt, "currentLevel", jsi::Value(static_cast<double>(currentLevel)));
    analysis.setProperty(rt, "peakLevel", jsi::Value(static_cast<double>(peakLevel)));
    analysis.setProperty(rt, "averageLevel", jsi::Value(static_cast<double>(averageLevel)));
    analysis.setProperty(rt, "framesProcessed", jsi::Value(static_cast<double>(framesProcessed)));

    // Timestamp
    auto now = std::chrono::system_clock::now();
    auto timestamp = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count();
    analysis.setProperty(rt, "timestamp", jsi::Value(static_cast<double>(timestamp)));

    return analysis;
}

// === Conversion des états ===
std::string JSIConverter::stateToString(Nyth::Audio::CaptureState state) {
    switch (state) {
        case Nyth::Audio::CaptureState::Uninitialized:
            return "uninitialized";
        case Nyth::Audio::CaptureState::Initialized:
            return "initialized";
        case Nyth::Audio::CaptureState::Starting:
            return "starting";
        case Nyth::Audio::CaptureState::Running:
            return "running";
        case Nyth::Audio::CaptureState::Pausing:
            return "pausing";
        case Nyth::Audio::CaptureState::Paused:
            return "paused";
        case Nyth::Audio::CaptureState::Stopping:
            return "stopping";
        case Nyth::Audio::CaptureState::Stopped:
            return "stopped";
        case Nyth::Audio::CaptureState::Error:
            return "error";
        default:
            return "unknown";
    }
}

Nyth::Audio::CaptureState JSIConverter::stringToState(const std::string& stateStr) {
    if (stateStr == "uninitialized")
        return Nyth::Audio::CaptureState::Uninitialized;
    if (stateStr == "initialized")
        return Nyth::Audio::CaptureState::Initialized;
    if (stateStr == "starting")
        return Nyth::Audio::CaptureState::Starting;
    if (stateStr == "running")
        return Nyth::Audio::CaptureState::Running;
    if (stateStr == "pausing")
        return Nyth::Audio::CaptureState::Pausing;
    if (stateStr == "paused")
        return Nyth::Audio::CaptureState::Paused;
    if (stateStr == "stopping")
        return Nyth::Audio::CaptureState::Stopping;
    if (stateStr == "stopped")
        return Nyth::Audio::CaptureState::Stopped;
    if (stateStr == "error")
        return Nyth::Audio::CaptureState::Error;
    return Nyth::Audio::CaptureState::Uninitialized;
}

// === Méthodes helpers ===
jsi::Object JSIConverter::createEmptyObject(jsi::Runtime& rt) {
    return jsi::Object(rt);
}

jsi::Array JSIConverter::createEmptyArray(jsi::Runtime& rt) {
    return jsi::Array(rt, 0);
}

jsi::Array JSIConverter::createEmptyArray(jsi::Runtime& rt, size_t size) {
    return jsi::Array(rt, size);
}

jsi::Array JSIConverter::convertSampleRatesToJS(jsi::Runtime& rt, const std::vector<int>& sampleRates) {
    auto jsArray = jsi::Array(rt, sampleRates.size());
    for (size_t i = 0; i < sampleRates.size(); ++i) {
        jsArray.setValueAtIndex(rt, i, jsi::Value(sampleRates[i]));
    }
    return jsArray;
}

} // namespace react
} // namespace facebook
