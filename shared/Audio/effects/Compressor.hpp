#pragma once

// C++20 standard headers
#include <cstdint>
#include <algorithm>
#include <cmath>
#include <span>
#include <format>
#include <source_location>
#include <ranges>
#include <concepts>
#include <type_traits>

// Legacy headers
#include "EffectBase.hpp"

// Concepts fournis par EffectBase.hpp (éviter les redéfinitions locales)

namespace AudioFX {

class CompressorEffect final : public IAudioEffect {
public:
  using IAudioEffect::processMono;   // évite le masquage des surcharges (templates span)
  using IAudioEffect::processStereo; // idem
  void setParameters(double thresholdDb, double ratio, double attackMs, double releaseMs, double makeupDb) noexcept {
    thresholdDb_ = thresholdDb;
    ratio_ = std::max(1.0, ratio);
    attackMs_ = std::max(0.1, attackMs);
    releaseMs_ = std::max(0.1, releaseMs);
    makeupDb_ = makeupDb;
    updateCoefficients();
  }

  void setSampleRate(uint32_t sampleRate, int numChannels) noexcept override {
    IAudioEffect::setSampleRate(sampleRate, numChannels);
    updateCoefficients();
    envL_ = envR_ = 0.0;
    gainL_ = gainR_ = 1.0;
  }

  // C++20 modernized processing methods
  template<AudioSampleType T = float>
  void processMonoModern(std::span<const T> input, std::span<T> output,
                        std::source_location location = std::source_location::current()) {
    // Use the base class C++20 method
    processMono(input, output, location);
  }

  template<AudioSampleType T = float>
  void processStereoModern(std::span<const T> inputL, std::span<const T> inputR,
                          std::span<T> outputL, std::span<T> outputR,
                          std::source_location location = std::source_location::current()) {
    // Use the base class C++20 method
    processStereo(inputL, inputR, outputL, outputR, location);
  }

  // Legacy methods (call the modern versions for C++20)
  void processMono(const float* input, float* output, size_t numSamples) override {
    if (!isEnabled() || !input || !output || numSamples == 0) {
      if (output != input && input && output) {
        std::ranges::copy(std::span<const float>(input, numSamples),
                         std::span<float>(output, numSamples).begin());
      }
      return;
    }

    // Optimized processing with loop unrolling
    size_t i = 0;
    
    // Process 4 samples at a time for better pipelining
    for (; i + 3 < numSamples; i += 4) {
      // Prefetch next block
      if (i + 16 < numSamples) {
        __builtin_prefetch(&input[i + 16], 0, 1);
      }
      
      // Process 4 samples
      double x0 = static_cast<double>(input[i]);
      double x1 = static_cast<double>(input[i + 1]);
      double x2 = static_cast<double>(input[i + 2]);
      double x3 = static_cast<double>(input[i + 3]);
      
      double ax0 = std::abs(x0) + 1e-12;
      double ax1 = std::abs(x1) + 1e-12;
      double ax2 = std::abs(x2) + 1e-12;
      double ax3 = std::abs(x3) + 1e-12;
      
      // Envelope follower for each sample
      double coeff0 = (ax0 > envL_) ? attackCoeff_ : releaseCoeff_;
      envL_ = coeff0 * envL_ + (1.0 - coeff0) * ax0;
      double levelDb0 = 20.0 * std::log10(envL_);
      
      double coeff1 = (ax1 > envL_) ? attackCoeff_ : releaseCoeff_;
      envL_ = coeff1 * envL_ + (1.0 - coeff1) * ax1;
      double levelDb1 = 20.0 * std::log10(envL_);
      
      double coeff2 = (ax2 > envL_) ? attackCoeff_ : releaseCoeff_;
      envL_ = coeff2 * envL_ + (1.0 - coeff2) * ax2;
      double levelDb2 = 20.0 * std::log10(envL_);
      
      double coeff3 = (ax3 > envL_) ? attackCoeff_ : releaseCoeff_;
      envL_ = coeff3 * envL_ + (1.0 - coeff3) * ax3;
      double levelDb3 = 20.0 * std::log10(envL_);
      
      // Apply compression curve
      double outDb0 = (levelDb0 > thresholdDb_) ? thresholdDb_ + (levelDb0 - thresholdDb_) / ratio_ : levelDb0;
      double outDb1 = (levelDb1 > thresholdDb_) ? thresholdDb_ + (levelDb1 - thresholdDb_) / ratio_ : levelDb1;
      double outDb2 = (levelDb2 > thresholdDb_) ? thresholdDb_ + (levelDb2 - thresholdDb_) / ratio_ : levelDb2;
      double outDb3 = (levelDb3 > thresholdDb_) ? thresholdDb_ + (levelDb3 - thresholdDb_) / ratio_ : levelDb3;
      
      // Calculate gains
      double gainDb0 = (outDb0 - levelDb0) + makeupDb_;
      double gainDb1 = (outDb1 - levelDb1) + makeupDb_;
      double gainDb2 = (outDb2 - levelDb2) + makeupDb_;
      double gainDb3 = (outDb3 - levelDb3) + makeupDb_;
      
      double gTarget0 = std::pow(10.0, gainDb0 / 20.0);
      double gTarget1 = std::pow(10.0, gainDb1 / 20.0);
      double gTarget2 = std::pow(10.0, gainDb2 / 20.0);
      double gTarget3 = std::pow(10.0, gainDb3 / 20.0);
      
      // Smooth gains
      double gCoeff0 = (gTarget0 > gainL_) ? gainAttackCoeff_ : gainReleaseCoeff_;
      gainL_ = gCoeff0 * gainL_ + (1.0 - gCoeff0) * gTarget0;
      output[i] = static_cast<float>(x0 * gainL_);
      
      double gCoeff1 = (gTarget1 > gainL_) ? gainAttackCoeff_ : gainReleaseCoeff_;
      gainL_ = gCoeff1 * gainL_ + (1.0 - gCoeff1) * gTarget1;
      output[i + 1] = static_cast<float>(x1 * gainL_);
      
      double gCoeff2 = (gTarget2 > gainL_) ? gainAttackCoeff_ : gainReleaseCoeff_;
      gainL_ = gCoeff2 * gainL_ + (1.0 - gCoeff2) * gTarget2;
      output[i + 2] = static_cast<float>(x2 * gainL_);
      
      double gCoeff3 = (gTarget3 > gainL_) ? gainAttackCoeff_ : gainReleaseCoeff_;
      gainL_ = gCoeff3 * gainL_ + (1.0 - gCoeff3) * gTarget3;
      output[i + 3] = static_cast<float>(x3 * gainL_);
    }
    
    // Process remaining samples
    for (; i < numSamples; ++i) {
      double x = static_cast<double>(input[i]);
      double ax = std::abs(x) + 1e-12;
      double coeff = (ax > envL_) ? attackCoeff_ : releaseCoeff_;
      envL_ = coeff * envL_ + (1.0 - coeff) * ax;
      double levelDb = 20.0 * std::log10(envL_);
      double outDb = (levelDb > thresholdDb_) ? thresholdDb_ + (levelDb - thresholdDb_) / ratio_ : levelDb;
      double gainDb = (outDb - levelDb) + makeupDb_;
      double gTarget = std::pow(10.0, gainDb / 20.0);
      double gCoeff = (gTarget > gainL_) ? gainAttackCoeff_ : gainReleaseCoeff_;
      gainL_ = gCoeff * gainL_ + (1.0 - gCoeff) * gTarget;
      output[i] = static_cast<float>(x * gainL_);
    }
  }

  void processStereo(const float* inL, const float* inR, float* outL, float* outR, size_t numSamples) override {
    if (!isEnabled() || !inL || !inR || !outL || !outR || numSamples == 0) {
      if (outL != inL && inL && outL) for (size_t i = 0; i < numSamples; ++i) outL[i] = inL[i];
      if (outR != inR && inR && outR) for (size_t i = 0; i < numSamples; ++i) outR[i] = inR[i];
      return;
    }
    for (size_t i = 0; i < numSamples; ++i) {
      double xl = static_cast<double>(inL[i]);
      double xr = static_cast<double>(inR[i]);
      double ax = 0.5 * (std::abs(xl) + std::abs(xr)) + 1e-12;
      double coeff = (ax > envL_) ? attackCoeff_ : releaseCoeff_;
      envL_ = coeff * envL_ + (1.0 - coeff) * ax;
      double levelDb = 20.0 * std::log10(envL_);
      double outDb = levelDb;
      if (levelDb > thresholdDb_) outDb = thresholdDb_ + (levelDb - thresholdDb_) / ratio_;
      double gainDb = (outDb - levelDb) + makeupDb_;
      double gTarget = std::pow(10.0, gainDb / 20.0);
      double gCoeff = (gTarget > gainL_) ? gainAttackCoeff_ : gainReleaseCoeff_;
      gainL_ = gCoeff * gainL_ + (1.0 - gCoeff) * gTarget;
      outL[i] = static_cast<float>(xl * gainL_);
      outR[i] = static_cast<float>(xr * gainL_);
    }
  }

private:
  void updateCoefficients() noexcept {
    auto coefForMs = [this](double ms) {
      double T = std::max(0.1, ms) / 1000.0;
      return std::exp(-1.0 / (T * static_cast<double>(sampleRate_)));
    };
    attackCoeff_ = coefForMs(attackMs_);
    releaseCoeff_ = coefForMs(releaseMs_);
    gainAttackCoeff_ = coefForMs(std::max(1.0, attackMs_ * 0.5));
    gainReleaseCoeff_ = coefForMs(std::max(5.0, releaseMs_));
  }

  // params
  double thresholdDb_ = -18.0;
  double ratio_ = 3.0;
  double attackMs_ = 10.0;
  double releaseMs_ = 80.0;
  double makeupDb_ = 0.0;

  // state
  double envL_ = 0.0;
  double envR_ = 0.0;
  double gainL_ = 1.0;
  double gainR_ = 1.0;
  double attackCoeff_ = 0.9;
  double releaseCoeff_ = 0.99;
  double gainAttackCoeff_ = 0.8;
  double gainReleaseCoeff_ = 0.98;
};

} // namespace AudioFX