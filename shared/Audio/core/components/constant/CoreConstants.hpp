#pragma once

// C++17 standard headers - Nettoyés et organisés
#include <cstdint>
#include <cstddef>
#include <cmath>
#include <thread>
#include <chrono>
#include <array>
#include <type_traits>
#include <cstring>
#include <string>

#include "../../common/config/utilsConstants.hpp"

// ============================================================================
// COMPATIBILITÉ CROSS-PLATFORM POUR XCODE/CLANG/GCC
// ============================================================================

// Détection du compilateur et de la plateforme
#if defined(__APPLE__) && defined(__MACH__)
    #define AUDIO_PLATFORM_MACOS 1
    #include <TargetConditionals.h>
#elif defined(_WIN32) || defined(_WIN64)
    #define AUDIO_PLATFORM_WINDOWS 1
#elif defined(__linux__)
    #define AUDIO_PLATFORM_LINUX 1
#endif

// Détection du compilateur
#if defined(__clang__)
    #define AUDIO_COMPILER_CLANG 1
#elif defined(__GNUC__) || defined(__GNUG__)
    #define AUDIO_COMPILER_GCC 1
#elif defined(_MSC_VER)
    #define AUDIO_COMPILER_MSVC 1
#endif

// Macro de compatibilité pour __builtin_prefetch
#ifdef __has_builtin
  #if __has_builtin(__builtin_prefetch)
    #define AUDIO_PREFETCH(addr, rw, locality) __builtin_prefetch(addr, rw, locality)
  #else
    #define AUDIO_PREFETCH(addr, rw, locality) ((void)0)
  #endif
#else
  #ifdef __GNUC__
    #define AUDIO_PREFETCH(addr, rw, locality) __builtin_prefetch(addr, rw, locality)
  #else
    #define AUDIO_PREFETCH(addr, rw, locality) ((void)0)
  #endif
#endif

// Macros d'alignement et d'inline
#ifdef AUDIO_COMPILER_CLANG
    #define AUDIO_FORCE_INLINE __attribute__((always_inline)) inline
    #define AUDIO_NO_INLINE __attribute__((noinline))
    #define AUDIO_ALIGNED(x) __attribute__((aligned(x)))
#elif defined(AUDIO_COMPILER_GCC)
    #define AUDIO_FORCE_INLINE __attribute__((always_inline)) inline
    #define AUDIO_NO_INLINE __attribute__((noinline))
    #define AUDIO_ALIGNED(x) __attribute__((aligned(x)))
#elif defined(AUDIO_COMPILER_MSVC)
    #define AUDIO_FORCE_INLINE __forceinline
    #define AUDIO_NO_INLINE __declspec(noinline)
    #define AUDIO_ALIGNED(x) __declspec(align(x))
#else
    #define AUDIO_FORCE_INLINE inline
    #define AUDIO_NO_INLINE
    #define AUDIO_ALIGNED(x)
#endif

namespace Nyth {
namespace Audio {
namespace FX {

// ============================================================================
// C++17 TYPE TRAITS - Remplace les concepts C++20
// ============================================================================

// Type traits simplifiés pour C++17
template<typename T>
struct is_audio_sample_type {
    static constexpr bool value = std::is_floating_point<T>::value;
};

template<typename T>
constexpr bool is_audio_sample_type_v = is_audio_sample_type<T>::value;

template<typename T>
struct is_frequency_value {
    static constexpr bool value = std::is_floating_point<T>::value;
};

template<typename T>
constexpr bool is_frequency_value_v = is_frequency_value<T>::value;

// Type trait pour les buffers audio
template<typename T>
struct is_audio_buffer_type {
    template<typename U>
    static auto test_data(int) -> decltype(std::declval<U>().data(), std::true_type{});
    template<typename>
    static std::false_type test_data(...);

    template<typename U>
    static auto test_size(int) -> decltype(std::declval<U>().size(), std::true_type{});
    template<typename>
    static std::false_type test_size(...);

    static constexpr bool value = std::is_pointer<T>::value ||
                                 (decltype(test_data<T>(0))::value &&
                                  decltype(test_size<T>(0))::value);
};

template<typename T>
constexpr bool is_audio_buffer_type_v = is_audio_buffer_type<T>::value;

// Forward declaration pour EQBand
struct EQBand;

template<typename T>
struct is_equalizer_band_type {
    static constexpr bool value = std::is_same<T, EQBand>::value;
};

template<typename T>
constexpr bool is_equalizer_band_type_v = is_equalizer_band_type<T>::value;

// ============================================================================
// CONSTANTES MATHÉMATIQUES GLOBALES
// ============================================================================

// C++17 constexpr utilities
constexpr double compute_pi() { return 3.14159265358979323846; }
constexpr double compute_two_pi() { return 2.0 * compute_pi(); }

constexpr size_t compute_max_channels() { return 32; }
constexpr size_t compute_max_bands() { return 31; }

// Audio processing constants (constexpr in C++17)
constexpr double PI = compute_pi();
constexpr double TWO_PI = compute_two_pi();

// ============================================================================
// CONSTANTES AUDIO GLOBALES
// ============================================================================

// Sample rates
constexpr uint32_t SAMPLE_RATE_44100 = 44100;
constexpr uint32_t SAMPLE_RATE_48000 = 48000;
constexpr uint32_t SAMPLE_RATE_96000 = 96000;
constexpr uint32_t DEFAULT_SAMPLE_RATE = SAMPLE_RATE_48000;

// Processing parameters
constexpr size_t DEFAULT_BLOCK_SIZE = 512;
constexpr size_t MAX_BLOCK_SIZE = 2048;
constexpr size_t MIN_BLOCK_SIZE = 64;

// Equalizer bands
constexpr size_t NUM_BANDS = 10;
constexpr size_t MAX_BANDS = 31;

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

// SIMD alignment is already defined above at line 105
// constexpr size_t SIMD_ALIGNMENT = 16;  // Commented to avoid redefinition

// ============================================================================
// NAMESPACE EQUALIZER - Constantes spécifiques à l'égaliseur
// ============================================================================

namespace EqualizerConstants {
    // Default values
    constexpr double DEFAULT_MASTER_GAIN = 1.0;
    constexpr double ZERO_GAIN = 0.0;
    constexpr float ZERO_GAIN_F = 0.0f;
    constexpr float UNITY_GAIN_F = 1.0f;
    constexpr double DEFAULT_CENTER_FREQUENCY = 1000.0;  // Hz

    // Thresholds
    constexpr double ACTIVE_GAIN_THRESHOLD = 0.01;
    constexpr float MASTER_GAIN_THRESHOLD = 0.001f;

    // Processing block sizes
    constexpr size_t OPTIMAL_BLOCK_SIZE = 2048;

    // Frequency range
    constexpr double MIN_FREQUENCY_HZ = 20.0;
    constexpr double MAX_FREQUENCY_HZ = 20000.0;
    constexpr double NYQUIST_DIVISOR = 2.0;

    // Mathematical constants for audio processing
    constexpr double LOG_BASE_10 = 10.0;
    constexpr double DB_CONVERSION_FACTOR = 20.0;

    // Loop unrolling constants
    constexpr size_t UNROLL_FACTOR = 4;
    constexpr size_t UNROLL_OFFSET_1 = 1;
    constexpr size_t UNROLL_OFFSET_2 = 2;
    constexpr size_t UNROLL_OFFSET_3 = 3;

    // Band indices
    constexpr size_t FIRST_BAND_INDEX = 0;
    constexpr size_t MINIMUM_BANDS_FOR_SHELF = 1;

    // Prefetch parameters
    constexpr int PREFETCH_READ = 0;
    constexpr int PREFETCH_WRITE = 1;
    constexpr int PREFETCH_LOCALITY = 1;

    // Reset and initialization values
    constexpr size_t STEP_INCREMENT = 1;
    constexpr double LOGARITHMIC_BASE = 10.0;

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

    // Preset gain values (organized by preset type)
    namespace PresetGains {
        // Rock preset gains
        constexpr std::array<double, NUM_BANDS> ROCK = {4.0, 3.0, -1.0, -2.0, -1.0, 2.0, 3.0, 4.0, 3.0, 2.0};

        // Pop preset gains
        constexpr std::array<double, NUM_BANDS> POP = {-1.0, 2.0, 4.0, 3.0, 0.0, -1.0, -1.0, 0.0, 2.0, 3.0};

        // Jazz preset gains
        constexpr std::array<double, NUM_BANDS> JAZZ = {0.0, 2.0, 1.0, 2.0, -2.0, -2.0, 0.0, 1.0, 2.0, 3.0};

        // Classical preset gains
        constexpr std::array<double, NUM_BANDS> CLASSICAL = {0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -2.0, -2.0, -2.0, -3.0};

        // Electronic preset gains
        constexpr std::array<double, NUM_BANDS> ELECTRONIC = {4.0, 3.0, 1.0, 0.0, -2.0, 2.0, 1.0, 1.0, 3.0, 4.0};

        // Vocal boost preset gains
        constexpr std::array<double, NUM_BANDS> VOCAL_BOOST = {-2.0, -1.0, 0.0, 2.0, 4.0, 4.0, 3.0, 2.0, 0.0, -1.0};

        // Bass boost preset gains
        constexpr std::array<double, NUM_BANDS> BASS_BOOST = {6.0, 5.0, 4.0, 2.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0};

        // Treble boost preset gains
        constexpr std::array<double, NUM_BANDS> TREBLE_BOOST = {0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 2.0, 4.0, 5.0, 6.0};

        // Loudness preset gains
        constexpr std::array<double, NUM_BANDS> LOUDNESS = {5.0, 3.0, 0.0, -1.0, -2.0, -2.0, -1.0, 0.0, 3.0, 5.0};
    }
}

// BiquadFilter specific constants
namespace BiquadConstants {
    // Default coefficient values
    constexpr double DEFAULT_A0 = 1.0;
    constexpr double DEFAULT_COEFFICIENT = 0.0;
    constexpr double UNITY_COEFFICIENT = 1.0;
    constexpr double NEGATIVE_TWO = -2.0;
    constexpr double HALF_DIVISOR = 2.0;

    // Mathematical constants for filter calculations
    constexpr double PEAKING_DB_DIVISOR = 40.0;  // Division factor for peaking filter gain conversion
    constexpr double POWER_BASE = 10.0;          // Base for pow() calculations
    constexpr double SHELF_SLOPE_DEFAULT = 1.0;  // Default shelf slope parameter

    // Performance optimization constants
    constexpr size_t PROCESSING_BLOCK_SIZE = 64;      // Optimal block size for cache efficiency
    constexpr size_t UNROLL_FACTOR_BIQUAD = 4;        // Unroll factor for sample processing
    constexpr size_t PREFETCH_DISTANCE = 16;          // Distance for prefetching in stereo processing

    // Sample indices for unrolled processing
    constexpr size_t SAMPLE_INDEX_0 = 0;
    constexpr size_t SAMPLE_INDEX_1 = 1;
    constexpr size_t SAMPLE_INDEX_2 = 2;
    constexpr size_t SAMPLE_INDEX_3 = 3;

    // Reset and default values
    constexpr double RESET_VALUE = 0.0;

    // Prefetch parameters (already defined above)
    // PREFETCH_READ, PREFETCH_WRITE, PREFETCH_LOCALITY already available

    // Mathematical constants for header file
    constexpr double PI_PRECISE = 3.14159265358979323846;  // High precision Pi for constexpr functions
    constexpr double TWO_PI_MULTIPLIER = 2.0;             // Multiplier for 2*Pi calculations

    // Audio type size constants (in bytes)
    constexpr size_t FLOAT_SIZE_BYTES = 4;               // sizeof(float)
    constexpr size_t DOUBLE_SIZE_BYTES = 8;              // sizeof(double)

    // Denormal prevention value
    constexpr double DENORMAL_RESET_VALUE = 0.0;         // Value to replace denormals
}

// AudioFX effects constants
namespace EffectConstants {
    // Default audio parameters
    constexpr uint32_t DEFAULT_SAMPLE_RATE = 48000;      // Default sample rate in Hz
    constexpr int DEFAULT_CHANNELS = 2;                  // Default number of channels (stereo)
    constexpr int MONO_CHANNELS = 1;                     // Mono channel count
    constexpr int STEREO_CHANNELS = 2;                   // Stereo channel count

    // Default states
    constexpr bool DEFAULT_ENABLED_STATE = true;         // Default enabled state for effects

    // Validation constants
    constexpr size_t ZERO_SAMPLES = 0;                   // Zero samples for validation
    constexpr uint32_t MIN_SAMPLE_RATE = 8000;           // Minimum valid sample rate (8kHz minimum)

    // Buffer and processing (moved to utils/utilsConstants.hpp)

    // Time conversion constants
    constexpr double MS_TO_SECONDS = 0.001;              // Milliseconds to seconds conversion
}

// SIMD alignment - already defined above
// constexpr size_t SIMD_ALIGNMENT = 16;

// C++17 modernized frequency bands using std::array
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

// C++17 constexpr functions for validation
constexpr bool is_valid_frequency(double freq) {
    return freq > 0.0 && freq <= 22050.0; // Nyquist limit for 44.1kHz
}

constexpr bool is_valid_q(double q) {
    return q >= MIN_Q && q <= MAX_Q;
}

constexpr bool is_valid_gain_db(double gain_db) {
    return gain_db >= MIN_GAIN_DB && gain_db <= MAX_GAIN_DB;
}

// C++17 template for frequency validation at compile time
template<typename T>
constexpr typename std::enable_if<is_frequency_value_v<T>, bool>::type validate_frequency(T freq) {
    return is_valid_frequency(static_cast<double>(freq));
}

// C++17 utility functions
template<typename T = double>
constexpr typename std::enable_if<is_audio_sample_type_v<T>, T>::type db_to_linear(T db) {
    return static_cast<T>(std::pow(10.0, db / 20.0));
}

template<typename T = double>
constexpr typename std::enable_if<is_audio_sample_type_v<T>, T>::type linear_to_db(T linear) {
    return static_cast<T>(20.0 * std::log10(linear));
}

// C++17 enhanced validation without source_location
inline bool validate_frequency_range(double freq, const std::string& /*location*/ = std::string(__FILE__) + ":" + std::to_string(__LINE__)) {
    return freq >= EqualizerConstants::MIN_FREQUENCY_HZ && freq <= EqualizerConstants::MAX_FREQUENCY_HZ;
}

inline bool validate_q_range(double q, const std::string& /*location*/ = std::string(__FILE__) + ":" + std::to_string(__LINE__)) {
    return q >= MIN_Q && q <= MAX_Q;
}

inline bool validate_gain_range(double gain_db, const std::string& /*location*/ = std::string(__FILE__) + ":" + std::to_string(__LINE__)) {
    return gain_db >= MIN_GAIN_DB && gain_db <= MAX_GAIN_DB;
}

// C++17 formatted error messages (basic string versions)
inline std::string format_frequency_error(double freq, const std::string& location = std::string(__FILE__) + ":" + std::to_string(__LINE__)) {
    return std::string("Invalid frequency: ") + std::to_string(freq) + " at " + location;
}

inline std::string format_q_error(double q, const std::string& location = std::string(__FILE__) + ":" + std::to_string(__LINE__)) {
    return std::string("Invalid Q: ") + std::to_string(q) + " at " + location;
}

inline std::string format_gain_error(double gain_db, const std::string& location = std::string(__FILE__) + ":" + std::to_string(__LINE__)) {
    return std::string("Invalid gain: ") + std::to_string(gain_db) + " at " + location;
}

// Temporisation portable en C++17 (évite les APIs C spécifiques plateforme)
inline void portable_sleep_ms(long milliseconds) {
    std::this_thread::sleep_for(std::chrono::milliseconds(milliseconds));
}

} // namespace FX
} // namespace Audio
} // namespace Nyth
