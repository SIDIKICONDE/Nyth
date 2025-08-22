#pragma once
#ifndef AUDIOFX_EQBAND_HPP
#define AUDIOFX_EQBAND_HPP

#include "BiquadFilter.hpp"
#include "CoreConstants.hpp"
#include <memory>


namespace AudioFX {

// Structure for a single EQ band
struct EQBand {
  double frequency;
  double gain; // in dB
  double q;
  FilterType type;
  std::unique_ptr<BiquadFilter> filter;
  bool enabled;

  EQBand()
      : frequency(EqualizerConstants::DEFAULT_CENTER_FREQUENCY),
        gain(EqualizerConstants::ZERO_GAIN), q(DEFAULT_Q),
        type(FilterType::PEAK), enabled(true) {
    filter = std::make_unique<BiquadFilter>();
  }

  // Copy constructor
  EQBand(const EQBand &other)
      : frequency(other.frequency), gain(other.gain), q(other.q),
        type(other.type), enabled(other.enabled) {
    filter = std::make_unique<BiquadFilter>(*other.filter);
  }

  // Move constructor
  EQBand(EQBand &&) = default;

  // Copy assignment
  EQBand &operator=(const EQBand &other) {
    if (this != &other) {
      frequency = other.frequency;
      gain = other.gain;
      q = other.q;
      type = other.type;
      enabled = other.enabled;
      filter = std::make_unique<BiquadFilter>(*other.filter);
    }
    return *this;
  }

  // Move assignment
  EQBand &operator=(EQBand &&) = default;
};

} // namespace AudioFX

#endif // AUDIOFX_EQBAND_HPP
