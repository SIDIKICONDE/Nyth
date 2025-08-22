#pragma once

#include <cstddef>
#include <cstdint>

namespace AudioFX {
namespace Capture {

void convertInt16ToFloat(const int16_t* inSamples, float* outSamples, size_t sampleCount);
void clampFloatBuffer(float* buffer, size_t sampleCount, float minVal = -1.0f, float maxVal = 1.0f);

double computeRMS(const float* buffer, size_t sampleCount);
double computePeak(const float* buffer, size_t sampleCount);

} // namespace Capture
} // namespace AudioFX