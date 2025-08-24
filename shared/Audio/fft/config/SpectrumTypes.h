#pragma once

#include <cstddef>
#include <cstdint>
#include <functional>
#include <memory>
#include <vector>

namespace Nyth {
namespace Audio {

// === Alias de types pour cohérence ===

// Types numériques
using SampleType = float;
using FrequencyType = double;
using MagnitudeType = float;
using TimeType = double;

// Types de taille
using FFTSize = size_t;
using SampleCount = size_t;
using BandCount = size_t;

// Types pour les indices
using BandIndex = size_t;
using SampleIndex = size_t;
using FrequencyBin = size_t;

// Smart pointers
template <typename T>
using UniquePtr = std::unique_ptr<T>;

template <typename T>
using SharedPtr = std::shared_ptr<T>;

// Types de buffers
using AudioBuffer = std::vector<SampleType>;
using MagnitudeBuffer = std::vector<MagnitudeType>;
using FrequencyBuffer = std::vector<FrequencyType>;

// === Concepts C++17 (simulés avec enable_if) ===

template <typename T>
using IsFloatingPoint = std::enable_if_t<std::is_floating_point_v<T>, bool>;

template <typename T>
using IsIntegral = std::enable_if_t<std::is_integral_v<T>, bool>;

// === Traits de types ===

template <typename T>
struct AudioTraits {
    static constexpr bool is_valid_sample_type = std::is_same_v<T, float> || std::is_same_v<T, double>;
    static constexpr bool is_valid_magnitude_type = std::is_same_v<T, float> || std::is_same_v<T, double>;
};

// === Constantes typées ===

namespace TypedConstants {
constexpr SampleType SAMPLE_MIN = -1.0f;
constexpr SampleType SAMPLE_MAX = 1.0f;
constexpr MagnitudeType MAGNITUDE_FLOOR_DB = -200.0f;
constexpr MagnitudeType MAGNITUDE_CEILING_DB = 0.0f;
constexpr FrequencyType FREQUENCY_EPSILON = 0.001;
} // namespace TypedConstants

} // namespace Audio
} // namespace Nyth
