#include "EQPresetFactory.hpp"
#include "CoreConstants.hpp"
#include <vector>

namespace AudioFX {

// Import des constantes pour éviter la répétition des namespace
using namespace EqualizerConstants;

EQPreset EQPresetFactory::createFlatPreset() {
    EQPreset preset;
    preset.name = "Flat";
    preset.gains = std::vector<double>(NUM_BANDS, EqualizerConstants::ZERO_GAIN);
    return preset;
}

EQPreset EQPresetFactory::createRockPreset() {
    EQPreset preset;
    preset.name = "Rock";
    preset.gains = std::vector<double>(PresetGains::ROCK.begin(), PresetGains::ROCK.end());
    return preset;
}

EQPreset EQPresetFactory::createPopPreset() {
    EQPreset preset;
    preset.name = "Pop";
    preset.gains = std::vector<double>(PresetGains::POP.begin(), PresetGains::POP.end());
    return preset;
}

EQPreset EQPresetFactory::createJazzPreset() {
    EQPreset preset;
    preset.name = "Jazz";
    preset.gains = std::vector<double>(PresetGains::JAZZ.begin(), PresetGains::JAZZ.end());
    return preset;
}

EQPreset EQPresetFactory::createClassicalPreset() {
    EQPreset preset;
    preset.name = "Classical";
    preset.gains = std::vector<double>(PresetGains::CLASSICAL.begin(), PresetGains::CLASSICAL.end());
    return preset;
}

EQPreset EQPresetFactory::createElectronicPreset() {
    EQPreset preset;
    preset.name = "Electronic";
    preset.gains = std::vector<double>(PresetGains::ELECTRONIC.begin(), PresetGains::ELECTRONIC.end());
    return preset;
}

EQPreset EQPresetFactory::createVocalBoostPreset() {
    EQPreset preset;
    preset.name = "Vocal Boost";
    preset.gains = std::vector<double>(PresetGains::VOCAL_BOOST.begin(), PresetGains::VOCAL_BOOST.end());
    return preset;
}

EQPreset EQPresetFactory::createBassBoostPreset() {
    EQPreset preset;
    preset.name = "Bass Boost";
    preset.gains = std::vector<double>(PresetGains::BASS_BOOST.begin(), PresetGains::BASS_BOOST.end());
    return preset;
}

EQPreset EQPresetFactory::createTrebleBoostPreset() {
    EQPreset preset;
    preset.name = "Treble Boost";
    preset.gains = std::vector<double>(PresetGains::TREBLE_BOOST.begin(), PresetGains::TREBLE_BOOST.end());
    return preset;
}

EQPreset EQPresetFactory::createLoudnessPreset() {
    EQPreset preset;
    preset.name = "Loudness";
    preset.gains = std::vector<double>(PresetGains::LOUDNESS.begin(), PresetGains::LOUDNESS.end());
    return preset;
}

} // namespace AudioFX
