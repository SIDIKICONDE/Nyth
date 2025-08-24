#pragma once
#ifndef AUDIOFX_EQPRESETFACTORY_HPP
#define AUDIOFX_EQPRESETFACTORY_HPP

#include "EQPreset.hpp"

namespace AudioFX {

// Preset factory
class EQPresetFactory {
public:
    static EQPreset createFlatPreset();
    static EQPreset createRockPreset();
    static EQPreset createPopPreset();
    static EQPreset createJazzPreset();
    static EQPreset createClassicalPreset();
    static EQPreset createElectronicPreset();
    static EQPreset createVocalBoostPreset();
    static EQPreset createBassBoostPreset();
    static EQPreset createTrebleBoostPreset();
    static EQPreset createLoudnessPreset();

private:
    EQPresetFactory() = delete; // Static class only
};

} // namespace AudioFX

#endif // AUDIOFX_EQPRESETFACTORY_HPP
