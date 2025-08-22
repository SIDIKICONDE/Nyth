#pragma once
#ifndef AUDIOFX_EQPRESET_HPP
#define AUDIOFX_EQPRESET_HPP

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

#endif // AUDIOFX_EQPRESET_HPP
