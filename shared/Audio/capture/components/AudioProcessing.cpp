// Implémentations audio multiplateformes pour mobile iOS/Android
#include "AudioCapture.hpp"
#include "../../common/config/Constant.hpp"
#include <algorithm>
#include <cmath>
#include <cstdint>
#include <vector>

namespace Nyth {
namespace Audio {

// Convertisseur int16 vers float - version portable
void convertInt16ToFloat(const int16_t* input, float* output, size_t count) {
    const float scale = Constants::INT16_TO_FLOAT_SCALE;

    for (size_t i = 0; i < count; ++i) {
        output[i] = static_cast<float>(input[i]) * scale;
    }
}

// Calculateur RMS - version portable
float calculateRMS(const float* data, size_t count) {
    if (count == 0) return Constants::RMS_ZERO_RETURN_VALUE;

    double sum = Constants::SUM_ACCUMULATOR_INITIAL_VALUE;
    for (size_t i = 0; i < count; ++i) {
        sum += static_cast<double>(data[i]) * static_cast<double>(data[i]);
    }

    return static_cast<float>(std::sqrt(sum / count));
}

// Compteur d'échantillons clippés - version portable
size_t countClippedSamples(const float* data, size_t count, float threshold) {
    size_t clipped = 0;
    for (size_t i = 0; i < count; ++i) {
        if (std::abs(data[i]) >= threshold) {
            ++clipped;
        }
    }
    return clipped;
}

// Fonction pour mélanger des canaux stéréo
void mixStereoToMono(const float* left, const float* right, float* output, size_t count) {
    for (size_t i = 0; i < count; ++i) {
        output[i] = (left[i] + right[i]) * Constants::STEREO_TO_MONO_MIX_FACTOR;
    }
}

// Appliquer un gain avec protection contre le clipping
void applyGain(const float* input, float* output, size_t count, float gain) {
    for (size_t i = 0; i < count; ++i) {
        output[i] = std::max(Constants::CLIPPING_THRESHOLD_MIN,
                           std::min(Constants::CLIPPING_THRESHOLD_MAX, input[i] * gain));
    }
}

} // namespace Audio
} // namespace Nyth
