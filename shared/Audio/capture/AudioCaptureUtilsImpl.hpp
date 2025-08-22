#pragma once

#include <algorithm>
#include <cmath>
#include "Audio/capture/AudioCaptureUtils.hpp"

namespace AudioFX {
namespace Capture {

inline void convertInt16ToFloat(const int16_t* inSamples,
                                float* outSamples,
                                size_t sampleCount) {
  constexpr float scale = 1.0f / 32768.0f;
  for (size_t i = 0; i < sampleCount; ++i) {
    outSamples[i] = static_cast<float>(inSamples[i]) * scale;
  }
}

inline void clampFloatBuffer(float* buffer, size_t sampleCount,
                             float minVal, float maxVal) {
  for (size_t i = 0; i < sampleCount; ++i) {
    float v = buffer[i];
    if (v < minVal) v = minVal;
    if (v > maxVal) v = maxVal;
    buffer[i] = v;
  }
}

inline double computeRMS(const float* buffer, size_t sampleCount) {
  if (sampleCount == 0) return 0.0;
  long double acc = 0.0;
  for (size_t i = 0; i < sampleCount; ++i) {
    long double v = static_cast<long double>(buffer[i]);
    acc += v * v;
  }
  return std::sqrt(static_cast<double>(acc / static_cast<long double>(sampleCount)));
}

inline double computePeak(const float* buffer, size_t sampleCount) {
  float peak = 0.0f;
  for (size_t i = 0; i < sampleCount; ++i) {
    float a = std::fabs(buffer[i]);
    if (a > peak) peak = a;
  }
  return static_cast<double>(peak);
}

} // namespace Capture
} // namespace AudioFX