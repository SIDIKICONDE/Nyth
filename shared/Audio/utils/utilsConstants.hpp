#pragma once

#ifdef __cplusplus

// === COMPATIBILITÉ CROSS-PLATFORM ===
// Détection du compilateur et de la plateforme
#if defined(__APPLE__) && defined(__MACH__)
    #define AUDIO_PLATFORM_MACOS 1
    #include <TargetConditionals.h>
#elif defined(_WIN32) || defined(_WIN64)
    #define AUDIO_PLATFORM_WINDOWS 1
#elif defined(__linux__)
    #define AUDIO_PLATFORM_LINUX 1
#else
    #define AUDIO_PLATFORM_UNKNOWN 1
#endif

// Détection du compilateur
#if defined(__clang__)
    #define AUDIO_COMPILER_CLANG 1
    #define AUDIO_COMPILER_NAME "Clang"
#elif defined(__GNUC__) || defined(__GNUG__)
    #define AUDIO_COMPILER_GCC 1
    #define AUDIO_COMPILER_NAME "GCC"
#elif defined(_MSC_VER)
    #define AUDIO_COMPILER_MSVC 1
    #define AUDIO_COMPILER_NAME "MSVC"
#else
    #define AUDIO_COMPILER_UNKNOWN 1
    #define AUDIO_COMPILER_NAME "Unknown"
#endif

// Macros de compatibilité pour les attributs
#ifdef AUDIO_COMPILER_CLANG
    #define AUDIO_FORCE_INLINE __attribute__((always_inline)) inline
    #define AUDIO_NO_INLINE __attribute__((noinline))
#elif defined(AUDIO_COMPILER_GCC)
    #define AUDIO_FORCE_INLINE __attribute__((always_inline)) inline
    #define AUDIO_NO_INLINE __attribute__((noinline))
#elif defined(AUDIO_COMPILER_MSVC)
    #define AUDIO_FORCE_INLINE __forceinline
    #define AUDIO_NO_INLINE __declspec(noinline)
#else
    #define AUDIO_FORCE_INLINE inline
    #define AUDIO_NO_INLINE
#endif

// C++17 standard headers - Required for types used
#include <cstddef>  // for size_t

// Audio Utils Constants - Centralized for all utility functions
namespace AudioUtils {

// Constantes pour éviter les nombres magiques
namespace UtilsConstants {

// === CONFIGURATION DU BUFFER AUDIO ===
static constexpr size_t MAX_CHANNELS = 2;               // Maximum number of channels supported
static constexpr size_t MAX_SAMPLES = 4096;             // Maximum samples per buffer
static constexpr size_t MIN_CHANNELS = 1;               // Minimum number of channels
static constexpr size_t DEFAULT_BUFFER_SIZE = 1024;     // Default buffer size in samples
static constexpr size_t INVALID_BUFFER_SIZE = 0;        // Invalid buffer size indicator

// === ALIGNEMENT SIMD ===
static constexpr size_t SIMD_ALIGNMENT_BYTES = 16;      // 16-byte boundary alignment for SSE/NEON
static constexpr size_t SIMD_ALIGNMENT_FLOATS = 4;      // 4 floats = 16 bytes (SSE/NEON vector size)
static constexpr size_t SIMD_ALIGNMENT_MASK = 3;        // For (size + 3) & ~3 alignment calculation
static constexpr size_t SIMD_ALIGNMENT_INVERSE_MASK = static_cast<size_t>(~3UL); // ~3 for masking (inverse of mask)
static constexpr size_t SIMD_BLOCK_SIZE = 4;            // Process 4 samples at a time (vector width)
static constexpr size_t SIMD_MASK_FOR_BLOCK = static_cast<size_t>(~3UL);       // Mask for SIMD blocks (4-sample alignment)

// === VALEURS D'INITIALISATION ===
static constexpr float ZERO_FLOAT = 0.0f;               // Float zero value
static constexpr double ZERO_DOUBLE = 0.0;              // Double zero value
static constexpr float UNITY_GAIN = 1.0f;               // Unity gain (no change)
static constexpr size_t ZERO_INDEX = 0;                 // Zero index for arrays
static constexpr size_t ZERO_SAMPLES = 0;               // Zero samples count

// === INDICES SIMD ===
static constexpr int SIMD_LANE_0 = 0;                   // First SIMD lane
static constexpr int SIMD_LANE_1 = 1;                   // Second SIMD lane
static constexpr int SIMD_LANE_2 = 2;                   // Third SIMD lane
static constexpr int SIMD_LANE_3 = 3;                   // Fourth SIMD lane

// === INDICES POUR CALCULS ===
static constexpr size_t FIRST_CHANNEL = 0;              // First channel index
static constexpr size_t FIRST_SAMPLE = 0;               // First sample index
static constexpr size_t SECOND_CHANNEL = 1;             // Second channel index (for stereo)

// === LIMITES DE VALIDATION ===
static constexpr size_t MIN_SAMPLES_PER_BUFFER = 1;     // Minimum samples per buffer
static constexpr size_t MAX_SAMPLES_PER_BUFFER = MAX_SAMPLES; // Maximum samples per buffer
static constexpr float MIN_GAIN_VALUE = 0.0f;           // Minimum gain value
static constexpr float MAX_GAIN_VALUE = 10.0f;          // Maximum gain value (10x boost)

// === CONSTANTES MATHEMATIQUES POUR BUFFERS ===
static constexpr float EPSILON_FLOAT = 1e-7f;           // Small float value for comparisons
static constexpr double EPSILON_DOUBLE = 1e-15;         // Small double value for comparisons
static constexpr float MIN_MAGNITUDE = 1e-6f;           // Minimum magnitude to avoid log(0)
static constexpr float MAX_DB_VALUE = 120.0f;           // Maximum dB value to clamp
static constexpr float MIN_DB_VALUE = -120.0f;          // Minimum dB value to clamp

// === CONSTANTES DE CONVERSION ===
static constexpr float DB_TO_LINEAR_FACTOR = 20.0f;     // Factor for dB to linear conversion (20*log10)
static constexpr float LINEAR_TO_DB_FACTOR = 20.0f;     // Factor for linear to dB conversion (20*log10)
static constexpr float LOG10_BASE = 10.0f;              // Base for log10 calculations (10^x)
static constexpr float SQRT_2 = 1.4142135623730951f;    // Square root of 2 (√2)
static constexpr float INV_SQRT_2 = 0.7071067811865476f; // 1/sqrt(2) for pan laws (1/√2)

// === CONSTANTES DE PERFORMANCE ===
static constexpr size_t CACHE_LINE_SIZE = 64;           // CPU cache line size in bytes
static constexpr size_t PREFETCH_DISTANCE = 64;         // Distance for memory prefetching
static constexpr size_t UNROLL_FACTOR = 4;              // Loop unrolling factor
static constexpr size_t MIN_SIZE_FOR_SIMD = 4;          // Minimum size to use SIMD

// === CONSTANTES TEMPORELLES ===
static constexpr double SAMPLE_RATE_44100 = 44100.0;    // Standard CD sample rate
static constexpr double SAMPLE_RATE_48000 = 48000.0;    // Standard digital sample rate
static constexpr double SAMPLE_RATE_96000 = 96000.0;    // High-quality sample rate
static constexpr double MS_TO_SAMPLES_AT_44100 = 44.1;  // Milliseconds to samples at 44.1kHz
static constexpr double MS_TO_SAMPLES_AT_48000 = 48.0;  // Milliseconds to samples at 48kHz

// === CONSTANTES DE VALIDATION C++17 ===
static constexpr size_t MAX_STACK_BUFFER_SIZE = 8192;   // Maximum size for stack-allocated buffers
static constexpr size_t SPAN_SAFETY_MARGIN = 1;         // Safety margin for span operations

// === CONSTANTES SIMD SPÉCIFIQUES ===
static constexpr size_t SIMD_VECTOR_SIZE = 4;           // 4 floats per SIMD vector
static constexpr size_t SIMD_MASK_4 = static_cast<size_t>(~3UL);               // Mask for 4-byte alignment (~3)
static constexpr size_t SIMD_INCREMENT_4 = 4;           // Increment for 4-float SIMD operations

// === CONSTANTES DE RÉINITIALISATION ===
static constexpr size_t RESET_CHANNELS = 0;             // Reset value for channels
static constexpr size_t RESET_SAMPLES = 0;              // Reset value for samples

// === CONSTANTES DE CALCUL ===
static constexpr float INITIAL_MAX_MAGNITUDE = 0.0f;    // Initial value for magnitude calculation
static constexpr double INITIAL_SUM = 0.0;              // Initial value for sum calculations
static constexpr float DEFAULT_RETURN_VALUE = 0.0f;     // Default return value for invalid operations

} // namespace UtilsConstants

// Import des constantes pour éviter la répétition des namespace
using namespace UtilsConstants;

} // namespace AudioUtils

// C++17 constexpr utilities
namespace AudioUtils {
    constexpr size_t compute_max_channels() { return MAX_CHANNELS; }
    constexpr size_t compute_max_samples() { return MAX_SAMPLES; }
    constexpr size_t compute_simd_alignment() { return SIMD_ALIGNMENT_BYTES; }
    constexpr size_t compute_default_buffer_size() { return DEFAULT_BUFFER_SIZE; }
}

#endif // __cplusplus
