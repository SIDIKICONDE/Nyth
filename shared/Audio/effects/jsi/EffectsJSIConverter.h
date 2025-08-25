#pragma once

#include <jsi/jsi.h>
#include <memory>
#include <string>

#include "../config/EffectsConfig.h"
#include "../config/EffectsLimits.h"
#include "../managers/EffectManager.h"
#include "../components/Compressor.hpp"
#include "../components/Delay.hpp"

namespace facebook {
namespace react {

// Alias pour les types d'effets
using EffectType = Nyth::Audio::Effects::EffectType;
using EffectState = Nyth::Audio::Effects::EffectState;

class EffectsJSIConverter {
public:
    // === Conversion des configurations ===
    static Nyth::Audio::EffectsConfig effectsConfigFromJS(jsi::Runtime& rt, const jsi::Object& jsConfig);
    static jsi::Object effectsConfigToJS(jsi::Runtime& rt, const Nyth::Audio::EffectsConfig& config);

    static Nyth::Audio::CompressorConfig compressorConfigFromJS(jsi::Runtime& rt, const jsi::Object& jsConfig);
    static jsi::Object compressorConfigToJS(jsi::Runtime& rt, const Nyth::Audio::CompressorConfig& config);

    static Nyth::Audio::DelayConfig delayConfigFromJS(jsi::Runtime& rt, const jsi::Object& jsConfig);
    static jsi::Object delayConfigToJS(jsi::Runtime& rt, const Nyth::Audio::DelayConfig& config);

    static Nyth::Audio::ReverbConfig reverbConfigFromJS(jsi::Runtime& rt, const jsi::Object& jsConfig);
    static jsi::Object reverbConfigToJS(jsi::Runtime& rt, const Nyth::Audio::ReverbConfig& config);

    // === Conversion des métriques ===
    static jsi::Object processingMetricsToJS(jsi::Runtime& rt, const EffectManager::ProcessingMetrics& metrics);
    // Note: CompressorMetrics et DelayMetrics définis dans les classes respectives
    static jsi::Object compressorMetricsToJS(jsi::Runtime& rt, const Nyth::Audio::FX::CompressorEffect::CompressorMetrics& metrics);
    static jsi::Object delayMetricsToJS(jsi::Runtime& rt, const Nyth::Audio::FX::DelayEffect::DelayMetrics& metrics);

    // === Conversion des statistiques ===
    static jsi::Object statisticsToJS(jsi::Runtime& rt, const Nyth::Audio::EffectsStatistics& stats);

    // === Utilitaires de conversion ===
    static EffectType stringToEffectType(const std::string& typeStr);
    static std::string effectTypeToString(EffectType type);

    static EffectState stringToEffectState(const std::string& stateStr);
    static std::string effectStateToString(EffectState state);

    // === Validation et conversion d'arrays ===
    static std::vector<float> arrayToVector(jsi::Runtime& rt, const jsi::Array& array);
    static jsi::Array vectorToArray(jsi::Runtime& rt, const std::vector<float>& vector);

private:
    // === Méthodes utilitaires privées ===
    static bool hasProperty(jsi::Runtime& rt, const jsi::Object& obj, const std::string& propName);
    static double getNumberProperty(jsi::Runtime& rt, const jsi::Object& obj, const std::string& propName,
                                    double defaultValue = 0.0);
    static bool getBoolProperty(jsi::Runtime& rt, const jsi::Object& obj, const std::string& propName,
                                bool defaultValue = false);
    static std::string getStringProperty(jsi::Runtime& rt, const jsi::Object& obj, const std::string& propName,
                                         const std::string& defaultValue = "");
};

} // namespace react
} // namespace facebook
