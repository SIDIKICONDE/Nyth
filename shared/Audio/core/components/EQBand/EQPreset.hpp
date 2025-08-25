#pragma once
#ifndef AUDIOFX_EQPRESET_HPP
#define AUDIOFX_EQPRESET_HPP

#include <string>
#include <vector>
#include <cstdint>

namespace Nyth {
namespace Audio {
namespace FX {

// Preset structure
struct EQPreset {
    std::string name;
    std::vector<double> gains;  // Gains for each band in dB

    EQPreset() = default;
    EQPreset(const std::string& n) : name(n) {}
    EQPreset(const std::string& n, const std::vector<double>& g)
        : name(n), gains(g) {}
};

} // namespace FX
} // namespace Audio
} // namespace Nyth

#endif // NYTH_AUDIO_FX_EQPRESET_HPP
