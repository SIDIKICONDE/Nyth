#include "NoiseJSIConverter.h"

namespace facebook {
namespace react {

// === Conversion des configurations ===

Nyth::Audio::NoiseConfig NoiseJSIConverter::noiseConfigFromJS(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    Nyth::Audio::NoiseConfig config;

    if (hasProperty(rt, jsConfig, "algorithm")) {
        std::string algStr = getStringProperty(rt, jsConfig, "algorithm");
        config.algorithm = stringToAlgorithm(algStr);
    }

    if (hasProperty(rt, jsConfig, "noiseMethod")) {
        std::string methodStr = getStringProperty(rt, jsConfig, "noiseMethod");
        config.noiseMethod = stringToEstimationMethod(methodStr);
    }

    if (hasProperty(rt, jsConfig, "sampleRate")) {
        config.sampleRate = static_cast<uint32_t>(getNumberProperty(rt, jsConfig, "sampleRate"));
    }

    if (hasProperty(rt, jsConfig, "channels")) {
        config.channels = static_cast<int>(getNumberProperty(rt, jsConfig, "channels"));
    }

    if (hasProperty(rt, jsConfig, "fftSize")) {
        config.fftSize = static_cast<size_t>(getNumberProperty(rt, jsConfig, "fftSize"));
    }

    if (hasProperty(rt, jsConfig, "hopSize")) {
        config.hopSize = static_cast<size_t>(getNumberProperty(rt, jsConfig, "hopSize"));
    }

    if (hasProperty(rt, jsConfig, "aggressiveness")) {
        config.aggressiveness = static_cast<float>(getNumberProperty(rt, jsConfig, "aggressiveness"));
    }

    if (hasProperty(rt, jsConfig, "enableMultiband")) {
        config.enableMultiband = getBoolProperty(rt, jsConfig, "enableMultiband");
    }

    if (hasProperty(rt, jsConfig, "preserveTransients")) {
        config.preserveTransients = getBoolProperty(rt, jsConfig, "preserveTransients");
    }

    if (hasProperty(rt, jsConfig, "reduceMusicalNoise")) {
        config.reduceMusicalNoise = getBoolProperty(rt, jsConfig, "reduceMusicalNoise");
    }

    // Configuration avancée
    if (hasProperty(rt, jsConfig, "advanced")) {
        auto advancedObj = jsConfig.getProperty(rt, "advanced").asObject(rt);

        if (hasProperty(rt, advancedObj, "beta")) {
            config.advanced.beta = static_cast<float>(getNumberProperty(rt, advancedObj, "beta"));
        }

        if (hasProperty(rt, advancedObj, "floorGain")) {
            config.advanced.floorGain = static_cast<float>(getNumberProperty(rt, advancedObj, "floorGain"));
        }

        if (hasProperty(rt, advancedObj, "noiseUpdateRate")) {
            config.advanced.noiseUpdateRate = static_cast<float>(getNumberProperty(rt, advancedObj, "noiseUpdateRate"));
        }

        if (hasProperty(rt, advancedObj, "speechThreshold")) {
            config.advanced.speechThreshold = static_cast<float>(getNumberProperty(rt, advancedObj, "speechThreshold"));
        }

        if (hasProperty(rt, advancedObj, "transientThreshold")) {
            config.advanced.transientThreshold =
                static_cast<float>(getNumberProperty(rt, advancedObj, "transientThreshold"));
        }
    }

    return config;
}

jsi::Object NoiseJSIConverter::noiseConfigToJS(jsi::Runtime& rt, const Nyth::Audio::NoiseConfig& config) {
    jsi::Object jsConfig(rt);

    jsConfig.setProperty(rt, "algorithm", jsi::String::createFromUtf8(rt, algorithmToString(config.algorithm)));
    jsConfig.setProperty(rt, "noiseMethod",
                         jsi::String::createFromUtf8(rt, estimationMethodToString(config.noiseMethod)));
    jsConfig.setProperty(rt, "sampleRate", jsi::Value(static_cast<double>(config.sampleRate)));
    jsConfig.setProperty(rt, "channels", jsi::Value(config.channels));
    jsConfig.setProperty(rt, "fftSize", jsi::Value(static_cast<double>(config.fftSize)));
    jsConfig.setProperty(rt, "hopSize", jsi::Value(static_cast<double>(config.hopSize)));
    jsConfig.setProperty(rt, "aggressiveness", jsi::Value(config.aggressiveness));
    jsConfig.setProperty(rt, "enableMultiband", jsi::Value(config.enableMultiband));
    jsConfig.setProperty(rt, "preserveTransients", jsi::Value(config.preserveTransients));
    jsConfig.setProperty(rt, "reduceMusicalNoise", jsi::Value(config.reduceMusicalNoise));

    // Configuration avancée
    jsi::Object advancedObj(rt);
    advancedObj.setProperty(rt, "beta", jsi::Value(config.advanced.beta));
    advancedObj.setProperty(rt, "floorGain", jsi::Value(config.advanced.floorGain));
    advancedObj.setProperty(rt, "noiseUpdateRate", jsi::Value(config.advanced.noiseUpdateRate));
    advancedObj.setProperty(rt, "speechThreshold", jsi::Value(config.advanced.speechThreshold));
    advancedObj.setProperty(rt, "transientThreshold", jsi::Value(config.advanced.transientThreshold));

    jsConfig.setProperty(rt, "advanced", std::move(advancedObj));

    return jsConfig;
}

Nyth::Audio::IMCRAConfig NoiseJSIConverter::imcraConfigFromJS(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    Nyth::Audio::IMCRAConfig config;

    if (hasProperty(rt, jsConfig, "fftSize")) {
        config.fftSize = static_cast<size_t>(getNumberProperty(rt, jsConfig, "fftSize"));
    }

    if (hasProperty(rt, jsConfig, "sampleRate")) {
        config.sampleRate = static_cast<uint32_t>(getNumberProperty(rt, jsConfig, "sampleRate"));
    }

    if (hasProperty(rt, jsConfig, "alphaS")) {
        config.alphaS = getNumberProperty(rt, jsConfig, "alphaS");
    }

    if (hasProperty(rt, jsConfig, "alphaD")) {
        config.alphaD = getNumberProperty(rt, jsConfig, "alphaD");
    }

    if (hasProperty(rt, jsConfig, "alphaD2")) {
        config.alphaD2 = getNumberProperty(rt, jsConfig, "alphaD2");
    }

    if (hasProperty(rt, jsConfig, "betaMax")) {
        config.betaMax = getNumberProperty(rt, jsConfig, "betaMax");
    }

    if (hasProperty(rt, jsConfig, "gamma0")) {
        config.gamma0 = getNumberProperty(rt, jsConfig, "gamma0");
    }

    if (hasProperty(rt, jsConfig, "gamma1")) {
        config.gamma1 = getNumberProperty(rt, jsConfig, "gamma1");
    }

    if (hasProperty(rt, jsConfig, "zeta0")) {
        config.zeta0 = getNumberProperty(rt, jsConfig, "zeta0");
    }

    if (hasProperty(rt, jsConfig, "windowLength")) {
        config.windowLength = static_cast<size_t>(getNumberProperty(rt, jsConfig, "windowLength"));
    }

    if (hasProperty(rt, jsConfig, "subWindowLength")) {
        config.subWindowLength = static_cast<size_t>(getNumberProperty(rt, jsConfig, "subWindowLength"));
    }

    return config;
}

jsi::Object NoiseJSIConverter::imcraConfigToJS(jsi::Runtime& rt, const Nyth::Audio::IMCRAConfig& config) {
    jsi::Object jsConfig(rt);

    jsConfig.setProperty(rt, "fftSize", jsi::Value(static_cast<double>(config.fftSize)));
    jsConfig.setProperty(rt, "sampleRate", jsi::Value(static_cast<double>(config.sampleRate)));
    jsConfig.setProperty(rt, "alphaS", jsi::Value(config.alphaS));
    jsConfig.setProperty(rt, "alphaD", jsi::Value(config.alphaD));
    jsConfig.setProperty(rt, "alphaD2", jsi::Value(config.alphaD2));
    jsConfig.setProperty(rt, "betaMax", jsi::Value(config.betaMax));
    jsConfig.setProperty(rt, "gamma0", jsi::Value(config.gamma0));
    jsConfig.setProperty(rt, "gamma1", jsi::Value(config.gamma1));
    jsConfig.setProperty(rt, "zeta0", jsi::Value(config.zeta0));
    jsConfig.setProperty(rt, "windowLength", jsi::Value(static_cast<double>(config.windowLength)));
    jsConfig.setProperty(rt, "subWindowLength", jsi::Value(static_cast<double>(config.subWindowLength)));

    return jsConfig;
}

Nyth::Audio::WienerConfig NoiseJSIConverter::wienerConfigFromJS(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    Nyth::Audio::WienerConfig config;

    if (hasProperty(rt, jsConfig, "fftSize")) {
        config.fftSize = static_cast<size_t>(getNumberProperty(rt, jsConfig, "fftSize"));
    }

    if (hasProperty(rt, jsConfig, "sampleRate")) {
        config.sampleRate = static_cast<uint32_t>(getNumberProperty(rt, jsConfig, "sampleRate"));
    }

    if (hasProperty(rt, jsConfig, "alpha")) {
        config.alpha = getNumberProperty(rt, jsConfig, "alpha");
    }

    if (hasProperty(rt, jsConfig, "minGain")) {
        config.minGain = getNumberProperty(rt, jsConfig, "minGain");
    }

    if (hasProperty(rt, jsConfig, "maxGain")) {
        config.maxGain = getNumberProperty(rt, jsConfig, "maxGain");
    }

    if (hasProperty(rt, jsConfig, "useLSA")) {
        config.useLSA = getBoolProperty(rt, jsConfig, "useLSA");
    }

    if (hasProperty(rt, jsConfig, "gainSmoothing")) {
        config.gainSmoothing = getNumberProperty(rt, jsConfig, "gainSmoothing");
    }

    if (hasProperty(rt, jsConfig, "frequencySmoothing")) {
        config.frequencySmoothing = getNumberProperty(rt, jsConfig, "frequencySmoothing");
    }

    if (hasProperty(rt, jsConfig, "usePerceptualWeighting")) {
        config.usePerceptualWeighting = getBoolProperty(rt, jsConfig, "usePerceptualWeighting");
    }

    return config;
}

jsi::Object NoiseJSIConverter::wienerConfigToJS(jsi::Runtime& rt, const Nyth::Audio::WienerConfig& config) {
    jsi::Object jsConfig(rt);

    jsConfig.setProperty(rt, "fftSize", jsi::Value(static_cast<double>(config.fftSize)));
    jsConfig.setProperty(rt, "sampleRate", jsi::Value(static_cast<double>(config.sampleRate)));
    jsConfig.setProperty(rt, "alpha", jsi::Value(config.alpha));
    jsConfig.setProperty(rt, "minGain", jsi::Value(config.minGain));
    jsConfig.setProperty(rt, "maxGain", jsi::Value(config.maxGain));
    jsConfig.setProperty(rt, "useLSA", jsi::Value(config.useLSA));
    jsConfig.setProperty(rt, "gainSmoothing", jsi::Value(config.gainSmoothing));
    jsConfig.setProperty(rt, "frequencySmoothing", jsi::Value(config.frequencySmoothing));
    jsConfig.setProperty(rt, "usePerceptualWeighting", jsi::Value(config.usePerceptualWeighting));

    return jsConfig;
}

Nyth::Audio::MultibandConfig NoiseJSIConverter::multibandConfigFromJS(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    Nyth::Audio::MultibandConfig config;

    if (hasProperty(rt, jsConfig, "sampleRate")) {
        config.sampleRate = static_cast<uint32_t>(getNumberProperty(rt, jsConfig, "sampleRate"));
    }

    if (hasProperty(rt, jsConfig, "fftSize")) {
        config.fftSize = static_cast<size_t>(getNumberProperty(rt, jsConfig, "fftSize"));
    }

    if (hasProperty(rt, jsConfig, "subBassReduction")) {
        config.subBassReduction = static_cast<float>(getNumberProperty(rt, jsConfig, "subBassReduction"));
    }

    if (hasProperty(rt, jsConfig, "bassReduction")) {
        config.bassReduction = static_cast<float>(getNumberProperty(rt, jsConfig, "bassReduction"));
    }

    if (hasProperty(rt, jsConfig, "lowMidReduction")) {
        config.lowMidReduction = static_cast<float>(getNumberProperty(rt, jsConfig, "lowMidReduction"));
    }

    if (hasProperty(rt, jsConfig, "midReduction")) {
        config.midReduction = static_cast<float>(getNumberProperty(rt, jsConfig, "midReduction"));
    }

    if (hasProperty(rt, jsConfig, "highMidReduction")) {
        config.highMidReduction = static_cast<float>(getNumberProperty(rt, jsConfig, "highMidReduction"));
    }

    if (hasProperty(rt, jsConfig, "highReduction")) {
        config.highReduction = static_cast<float>(getNumberProperty(rt, jsConfig, "highReduction"));
    }

    if (hasProperty(rt, jsConfig, "ultraHighReduction")) {
        config.ultraHighReduction = static_cast<float>(getNumberProperty(rt, jsConfig, "ultraHighReduction"));
    }

    return config;
}

jsi::Object NoiseJSIConverter::multibandConfigToJS(jsi::Runtime& rt, const Nyth::Audio::MultibandConfig& config) {
    jsi::Object jsConfig(rt);

    jsConfig.setProperty(rt, "sampleRate", jsi::Value(static_cast<double>(config.sampleRate)));
    jsConfig.setProperty(rt, "fftSize", jsi::Value(static_cast<double>(config.fftSize)));
    jsConfig.setProperty(rt, "subBassReduction", jsi::Value(static_cast<double>(config.subBassReduction)));
    jsConfig.setProperty(rt, "bassReduction", jsi::Value(static_cast<double>(config.bassReduction)));
    jsConfig.setProperty(rt, "lowMidReduction", jsi::Value(static_cast<double>(config.lowMidReduction)));
    jsConfig.setProperty(rt, "midReduction", jsi::Value(static_cast<double>(config.midReduction)));
    jsConfig.setProperty(rt, "highMidReduction", jsi::Value(static_cast<double>(config.highMidReduction)));
    jsConfig.setProperty(rt, "highReduction", jsi::Value(static_cast<double>(config.highReduction)));
    jsConfig.setProperty(rt, "ultraHighReduction", jsi::Value(static_cast<double>(config.ultraHighReduction)));

    return jsConfig;
}

// === Conversion des statistiques ===

jsi::Object NoiseJSIConverter::statisticsToJS(jsi::Runtime& rt, const Nyth::Audio::NoiseStatistics& stats) {
    jsi::Object jsStats(rt);

    jsStats.setProperty(rt, "inputLevel", jsi::Value(stats.inputLevel));
    jsStats.setProperty(rt, "outputLevel", jsi::Value(stats.outputLevel));
    jsStats.setProperty(rt, "estimatedSNR", jsi::Value(stats.estimatedSNR));
    jsStats.setProperty(rt, "noiseReductionDB", jsi::Value(stats.noiseReductionDB));
    jsStats.setProperty(rt, "processedFrames", jsi::Value(static_cast<double>(stats.processedFrames)));
    jsStats.setProperty(rt, "processedSamples", jsi::Value(static_cast<double>(stats.processedSamples)));
    jsStats.setProperty(rt, "durationMs", jsi::Value(static_cast<double>(stats.durationMs)));
    jsStats.setProperty(rt, "speechProbability", jsi::Value(stats.speechProbability));
    jsStats.setProperty(rt, "musicalNoiseLevel", jsi::Value(stats.musicalNoiseLevel));

    return jsStats;
}

// === Utilitaires de conversion ===

Nyth::Audio::NoiseAlgorithm NoiseJSIConverter::stringToAlgorithm(const std::string& typeStr) {
    if (typeStr == "spectral_subtraction") {
        return Nyth::Audio::NoiseAlgorithm::SPECTRAL_SUBTRACTION;
    } else if (typeStr == "wiener_filter") {
        return Nyth::Audio::NoiseAlgorithm::WIENER_FILTER;
    } else if (typeStr == "multiband") {
        return Nyth::Audio::NoiseAlgorithm::MULTIBAND;
    } else if (typeStr == "two_step") {
        return Nyth::Audio::NoiseAlgorithm::TWO_STEP;
    } else if (typeStr == "hybrid") {
        return Nyth::Audio::NoiseAlgorithm::HYBRID;
    } else if (typeStr == "advanced_spectral") {
        return Nyth::Audio::NoiseAlgorithm::ADVANCED_SPECTRAL;
    }

    return Nyth::Audio::NoiseAlgorithm::ADVANCED_SPECTRAL; // Default
}

std::string NoiseJSIConverter::algorithmToString(Nyth::Audio::NoiseAlgorithm algorithm) {
    switch (algorithm) {
        case Nyth::Audio::NoiseAlgorithm::SPECTRAL_SUBTRACTION:
            return "spectral_subtraction";
        case Nyth::Audio::NoiseAlgorithm::WIENER_FILTER:
            return "wiener_filter";
        case Nyth::Audio::NoiseAlgorithm::MULTIBAND:
            return "multiband";
        case Nyth::Audio::NoiseAlgorithm::TWO_STEP:
            return "two_step";
        case Nyth::Audio::NoiseAlgorithm::HYBRID:
            return "hybrid";
        case Nyth::Audio::NoiseAlgorithm::ADVANCED_SPECTRAL:
            return "advanced_spectral";
        default:
            return "advanced_spectral";
    }
}

Nyth::Audio::NoiseEstimationMethod NoiseJSIConverter::stringToEstimationMethod(const std::string& methodStr) {
    if (methodStr == "simple") {
        return Nyth::Audio::NoiseEstimationMethod::SIMPLE;
    } else if (methodStr == "mcra") {
        return Nyth::Audio::NoiseEstimationMethod::MCRA;
    } else if (methodStr == "imcra") {
        return Nyth::Audio::NoiseEstimationMethod::IMCRA;
    }

    return Nyth::Audio::NoiseEstimationMethod::IMCRA; // Default
}

std::string NoiseJSIConverter::estimationMethodToString(Nyth::Audio::NoiseEstimationMethod method) {
    switch (method) {
        case Nyth::Audio::NoiseEstimationMethod::SIMPLE:
            return "simple";
        case Nyth::Audio::NoiseEstimationMethod::MCRA:
            return "mcra";
        case Nyth::Audio::NoiseEstimationMethod::IMCRA:
            return "imcra";
        default:
            return "imcra";
    }
}

Nyth::Audio::NoiseState NoiseJSIConverter::stringToNoiseState(const std::string& stateStr) {
    if (stateStr == "uninitialized") {
        return Nyth::Audio::NoiseState::UNINITIALIZED;
    } else if (stateStr == "initialized") {
        return Nyth::Audio::NoiseState::INITIALIZED;
    } else if (stateStr == "processing") {
        return Nyth::Audio::NoiseState::PROCESSING;
    } else if (stateStr == "error") {
        return Nyth::Audio::NoiseState::ERROR;
    }

    return Nyth::Audio::NoiseState::UNINITIALIZED;
}

std::string NoiseJSIConverter::noiseStateToString(Nyth::Audio::NoiseState state) {
    switch (state) {
        case Nyth::Audio::NoiseState::UNINITIALIZED:
            return "uninitialized";
        case Nyth::Audio::NoiseState::INITIALIZED:
            return "initialized";
        case Nyth::Audio::NoiseState::PROCESSING:
            return "processing";
        case Nyth::Audio::NoiseState::ERROR:
            return "error";
        default:
            return "uninitialized";
    }
}

// === Validation et conversion d'arrays ===

std::vector<float> NoiseJSIConverter::arrayToVector(jsi::Runtime& rt, const jsi::Array& array) {
    size_t length = array.length(rt);
    std::vector<float> vector(length);

    for (size_t i = 0; i < length; ++i) {
        vector[i] = static_cast<float>(array.getValueAtIndex(rt, i).asNumber());
    }

    return vector;
}

jsi::Array NoiseJSIConverter::vectorToArray(jsi::Runtime& rt, const std::vector<float>& vector) {
    jsi::Array array(rt, vector.size());

    for (size_t i = 0; i < vector.size(); ++i) {
        array.setValueAtIndex(rt, i, jsi::Value(vector[i]));
    }

    return array;
}

// === Méthodes utilitaires privées ===

bool NoiseJSIConverter::hasProperty(jsi::Runtime& rt, const jsi::Object& obj, const std::string& propName) {
    return obj.hasProperty(rt, propName.c_str());
}

double NoiseJSIConverter::getNumberProperty(jsi::Runtime& rt, const jsi::Object& obj, const std::string& propName,
                                            double defaultValue) {
    if (hasProperty(rt, obj, propName)) {
        auto value = obj.getProperty(rt, propName.c_str());
        if (value.isNumber()) {
            return value.asNumber();
        }
    }
    return defaultValue;
}

bool NoiseJSIConverter::getBoolProperty(jsi::Runtime& rt, const jsi::Object& obj, const std::string& propName,
                                        bool defaultValue) {
    if (hasProperty(rt, obj, propName)) {
        auto value = obj.getProperty(rt, propName.c_str());
        if (value.isBool()) {
            return value.asBool();
        }
    }
    return defaultValue;
}

std::string NoiseJSIConverter::getStringProperty(jsi::Runtime& rt, const jsi::Object& obj, const std::string& propName,
                                                 const std::string& defaultValue) {
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
