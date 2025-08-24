#pragma once

#include "../config/AudioConfig.h"
#include "JSIValidator.h"
#include <jsi/jsi.h>
#include <string>
#include <vector>


namespace facebook {
namespace react {

// === Classe pour la conversion JSI <-> Native ===
class JSIConverter {
public:
    // === Conversion AudioConfig ===
    static Nyth::Audio::AudioConfig jsToAudioConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    static jsi::Object audioConfigToJS(jsi::Runtime& rt, const Nyth::Audio::AudioConfig& config);

    // === Conversion AudioRecordingConfig ===
    static Nyth::Audio::AudioRecordingConfig jsToAudioRecordingConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    static jsi::Object audioRecordingConfigToJS(jsi::Runtime& rt, const Nyth::Audio::AudioRecordingConfig& config);

    // === Conversion des statistiques ===
    static jsi::Object audioStatisticsToJS(jsi::Runtime& rt, const Audio::capture::CaptureStatistics& stats);

    // === Conversion des périphériques ===
    static jsi::Object audioDeviceToJS(jsi::Runtime& rt, const Audio::capture::AudioDeviceInfo& device);
    static jsi::Array audioDevicesToJS(jsi::Runtime& rt, const std::vector<Audio::capture::AudioDeviceInfo>& devices);

    // === Conversion des données d'analyse ===
    static jsi::Object createAnalysisData(jsi::Runtime& rt, float currentLevel, float peakLevel, float averageLevel,
                                          size_t framesProcessed);

    // === Conversion des états ===
    static std::string stateToString(Audio::capture::CaptureState state);
    static Audio::capture::CaptureState stringToState(const std::string& stateStr);

private:
    // === Méthodes helpers ===
    static jsi::Object createEmptyObject(jsi::Runtime& rt);
    static jsi::Array createEmptyArray(jsi::Runtime& rt);
    static jsi::Array convertSampleRatesToJS(jsi::Runtime& rt, const std::vector<int>& sampleRates);
};

} // namespace react
} // namespace facebook
