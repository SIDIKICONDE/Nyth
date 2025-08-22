#pragma once
#ifndef EQPRESET_HPP_INCLUDED
#define EQPRESET_HPP_INCLUDED

#include <string>
#include <vector>

namespace AudioFX {

// Preset structure
struct EQPreset {
    std::string name;
    std::vector<double> gains;  // Gains for each band in dB
    
    EQPreset() = default;
    EQPreset(const std::string& n) : name(n) {}
    EQPreset(const std::string& n, const std::vector<double>& g) 
        : name(n), gains(g) {}
};

} // namespace AudioFX

#endif // EQPRESET_HPP_INCLUDED