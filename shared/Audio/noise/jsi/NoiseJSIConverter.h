#pragma once

#include <jsi/jsi.h>
#include <memory>
#include <string>

#include "../config/NoiseConfig.h"

namespace facebook {
namespace react {

class NoiseJSIConverter {
public:
    // === Conversion des configurations ===
    static Nyth::Audio::NoiseConfig noiseConfigFromJS(jsi::Runtime& rt, const jsi::Object& jsConfig);
    static jsi::Object noiseConfigToJS(jsi::Runtime& rt, const Nyth::Audio::NoiseConfig& config);

    static Nyth::Audio::IMCRAConfig imcraConfigFromJS(jsi::Runtime& rt, const jsi::Object& jsConfig);
    static jsi::Object imcraConfigToJS(jsi::Runtime& rt, const Nyth::Audio::IMCRAConfig& config);

    static Nyth::Audio::WienerConfig wienerConfigFromJS(jsi::Runtime& rt, const jsi::Object& jsConfig);
    static jsi::Object wienerConfigToJS(jsi::Runtime& rt, const Nyth::Audio::WienerConfig& config);

    static Nyth::Audio::MultibandConfig multibandConfigFromJS(jsi::Runtime& rt, const jsi::Object& jsConfig);
    static jsi::Object multibandConfigToJS(jsi::Runtime& rt, const Nyth::Audio::MultibandConfig& config);

    // === Conversion des statistiques ===
    static jsi::Object statisticsToJS(jsi::Runtime& rt, const Nyth::Audio::NoiseStatistics& stats);

    // === Utilitaires de conversion ===
    static Nyth::Audio::NoiseAlgorithm stringToAlgorithm(const std::string& typeStr);
    static std::string algorithmToString(Nyth::Audio::NoiseAlgorithm algorithm);

    static Nyth::Audio::NoiseEstimationMethod stringToEstimationMethod(const std::string& methodStr);
    static std::string estimationMethodToString(Nyth::Audio::NoiseEstimationMethod method);

    static Nyth::Audio::NoiseState stringToNoiseState(const std::string& stateStr);
    static std::string noiseStateToString(Nyth::Audio::NoiseState state);

    // === Validation et conversion d'arrays ===
    static std::vector<float> arrayToVector(jsi::Runtime& rt, const jsi::Array& array);
    static jsi::Array vectorToArray(jsi::Runtime& rt, const std::vector<float>& vector);

private:
    // === Méthodes utilitaires privées ===
    static bool hasProperty(jsi::Runtime& rt, const jsi::Object& obj, const std::string& propName);
    static double getNumberProperty(jsi::Runtime& rt, const jsi::Object& obj, const std::string& propName, double defaultValue = 0.0);
    static bool getBoolProperty(jsi::Runtime& rt, const jsi::Object& obj, const std::string& propName, bool defaultValue = false);
    static std::string getStringProperty(jsi::Runtime& rt, const jsi::Object& obj, const std::string& propName, const std::string& defaultValue = "");
};

} // namespace react
} // namespace facebook
