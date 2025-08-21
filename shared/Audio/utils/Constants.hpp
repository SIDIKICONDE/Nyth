#pragma once

#if defined(__has_include)
#  if __has_include(<cstdint>)
#    include <cstdint>
#  else
#    include <stdint.h>
#  endif
#  if __has_include(<cstddef>)
#    include <cstddef>
#  else
#    include <stddef.h>
#  endif
#else
#  include <stdint.h>
#  include <stddef.h>
#endif
#include <cmath>
#include <thread>
#include <chrono>
#include <array>
#include <algorithm>
#include <format>
#include <source_location>
#include <concepts>
#include <type_traits>
#include <string>

namespace AudioEqualizer {

// C++20 Concepts for better type safety
template<typename T>
concept AudioSampleType = std::floating_point<T>;

template<typename T>
concept FrequencyValue = std::floating_point<T> && requires(T freq) {
    freq > 0.0;
};

// C++20 consteval utilities for compile-time computation
consteval double compute_pi() { return 3.14159265358979323846; }
consteval double compute_two_pi() { return 2.0 * compute_pi(); }

consteval size_t compute_max_channels() { return 32; }
consteval size_t compute_max_bands() { return MAX_BANDS; }

// Audio processing constants (now using consteval)
constexpr double PI = compute_pi();
constexpr double TWO_PI = compute_two_pi();

// Sample rates
constexpr uint32_t SAMPLE_RATE_44100 = 44100;
constexpr uint32_t SAMPLE_RATE_48000 = 48000;
constexpr uint32_t DEFAULT_SAMPLE_RATE = SAMPLE_RATE_48000;

// Processing parameters
constexpr size_t DEFAULT_BLOCK_SIZE = 512;
constexpr size_t MAX_BLOCK_SIZE = 2048;
constexpr size_t MIN_BLOCK_SIZE = 64;

// Equalizer bands
constexpr size_t NUM_BANDS = 10;
constexpr size_t MAX_BANDS = 31;

// Default frequency bands for 10-band EQ (Hz)
constexpr double DEFAULT_FREQUENCIES[NUM_BANDS] = {
    31.25,   // Sub-bass
    62.5,    // Bass
    125.0,   // Low-mid
    250.0,   // Mid
    500.0,   // Mid
    1000.0,  // Mid-high
    2000.0,  // High-mid
    4000.0,  // Presence
    8000.0,  // Brilliance
    16000.0  // Air
};

// Q factor ranges
constexpr double MIN_Q = 0.1;
constexpr double MAX_Q = 10.0;
constexpr double DEFAULT_Q = 0.707; // Butterworth response

// Gain ranges (dB)
constexpr double MIN_GAIN_DB = -24.0;
constexpr double MAX_GAIN_DB = 24.0;
constexpr double DEFAULT_GAIN_DB = 0.0;

// Filter types
enum class FilterType {
    LOWPASS,
    HIGHPASS,
    BANDPASS,
    NOTCH,
    PEAK,
    LOWSHELF,
    HIGHSHELF,
    ALLPASS
};

// Processing precision
constexpr double EPSILON = 1e-10;
constexpr double DENORMAL_THRESHOLD = 1e-15;

// SIMD alignment
constexpr size_t SIMD_ALIGNMENT = 16;

// C++20 modernized frequency bands using std::array
constexpr std::array<double, NUM_BANDS> DEFAULT_FREQUENCY_BANDS = {
    31.25,   // Sub-bass
    62.5,    // Bass
    125.0,   // Low-mid
    250.0,   // Mid
    500.0,   // Mid
    1000.0,  // Mid-high
    2000.0,  // High-mid
    4000.0,  // Presence
    8000.0,  // Brilliance
    16000.0  // Air
};

// C++20 consteval functions for validation
consteval bool is_valid_frequency(double freq) {
    return freq > 0.0 && freq <= 22050.0; // Nyquist limit for 44.1kHz
}

consteval bool is_valid_q(double q) {
    return q >= MIN_Q && q <= MAX_Q;
}

consteval bool is_valid_gain_db(double gain_db) {
    return gain_db >= MIN_GAIN_DB && gain_db <= MAX_GAIN_DB;
}

// C++20 template for frequency validation at compile time
template<FrequencyValue T>
consteval bool validate_frequency(T freq) {
    return is_valid_frequency(static_cast<double>(freq));
}

// C++20 utility functions
template<AudioSampleType T = double>
constexpr T db_to_linear(T db) {
    return static_cast<T>(std::pow(10.0, db / 20.0));
}

template<AudioSampleType T = double>
constexpr T linear_to_db(T linear) {
    return static_cast<T>(20.0 * std::log10(linear));
}

// C++20 enhanced validation with source_location
bool validate_frequency_range(double freq,
                            std::source_location location = std::source_location::current());

bool validate_q_range(double q,
                    std::source_location location = std::source_location::current());

bool validate_gain_range(double gain_db,
                        std::source_location location = std::source_location::current());

// C++20 formatted error messages
std::string format_frequency_error(double freq,
                                 std::source_location location = std::source_location::current());

std::string format_q_error(double q,
                         std::source_location location = std::source_location::current());

std::string format_gain_error(double gain_db,
                            std::source_location location = std::source_location::current());

// Temporisation portable en C++20 (évite les APIs C spécifiques plateforme)
inline void portable_sleep_ms(long milliseconds) {
    std::this_thread::sleep_for(std::chrono::milliseconds(milliseconds));
}

} // namespace AudioEqualizer