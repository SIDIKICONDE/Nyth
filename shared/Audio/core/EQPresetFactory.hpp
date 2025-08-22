#pragma once
#ifndef EQPRESETFACTORY_HPP_INCLUDED
#define EQPRESETFACTORY_HPP_INCLUDED

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

#endif // EQPRESETFACTORY_HPP_INCLUDED