#pragma once

#ifdef __cplusplus

// C++20 standard headers - Robust compatibility
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

namespace AudioSafety {

// Constantes pour éviter les nombres magiques
namespace SafetyConstants {

// === CONFIGURATION PAR DEFAUT ===
static constexpr bool DEFAULT_ENABLED = true;
static constexpr bool DEFAULT_DC_REMOVAL_ENABLED = true;
static constexpr double DEFAULT_DC_THRESHOLD = 0.002; // linear (~-54 dBFS)
static constexpr bool DEFAULT_LIMITER_ENABLED = true;
static constexpr double DEFAULT_LIMITER_THRESHOLD_DB = -1.0; // dBFS
static constexpr bool DEFAULT_SOFT_KNEE_LIMITER = true;
static constexpr double DEFAULT_KNEE_WIDTH_DB = 6.0;
static constexpr bool DEFAULT_FEEDBACK_DETECT_ENABLED = true;
static constexpr double DEFAULT_FEEDBACK_CORR_THRESHOLD = 0.95; // normalized autocorrelation

// === VALEURS D'INITIALISATION ===
static constexpr double INITIAL_PEAK = 0.0;
static constexpr double INITIAL_RMS = 0.0;
static constexpr double INITIAL_DC_OFFSET = 0.0;
static constexpr uint32_t INITIAL_CLIPPED_SAMPLES = 0;
static constexpr bool INITIAL_OVERLOAD_ACTIVE = false;
static constexpr double INITIAL_FEEDBACK_SCORE = 0.0;
static constexpr bool INITIAL_HAS_NAN = false;
static constexpr bool INITIAL_FEEDBACK_LIKELY = false;

// === VALEURS PAR DEFAUT DE L'ENGINE ===
static constexpr double DEFAULT_LIMITER_THRESHOLD_LINEAR = 0.89; // from dB

// === CONSTANTES DE CONVERSION D/B ===
static constexpr double DB_TO_LINEAR_BASE = 10.0;
static constexpr double DB_TO_LINEAR_DIVISOR = 20.0;

// === CONSTANTES MATHEMATIQUES POUR CONVERSIONS ===
static constexpr double SQRT_10_APPROX = 3.16;           // sqrt(10) approximation
static constexpr double SQRT_10_INV_APPROX = 0.316;      // 1/sqrt(10) approximation
static constexpr double LOG_BASE_10 = 10.0;              // Base 10 pour puissances
static constexpr double LOG_BASE_10_INV = 0.1;           // 1/10 pour puissances négatives
static constexpr double UNITY_POWER = 1.0;               // 10^0 = 1
static constexpr double ZERO_POWER_EXP = 0.0;            // Exposant 0
static constexpr double POSITIVE_UNIT_EXP = 1.0;         // Exposant +1
static constexpr double NEGATIVE_UNIT_EXP = -1.0;        // Exposant -1
static constexpr double FRACTIONAL_THRESHOLD = 0.5;      // Seuil pour partie fractionnaire

// === LIMITES DE VALIDATION ===
static constexpr uint32_t MIN_SAMPLE_RATE = 8000;
static constexpr uint32_t MAX_SAMPLE_RATE = 192000;
static constexpr int MIN_CHANNELS = 1;
static constexpr int MAX_CHANNELS = 2;
static constexpr double MIN_LIMITER_THRESHOLD_DB = -20.0;
static constexpr double MAX_LIMITER_THRESHOLD_DB = 0.0;
static constexpr double MIN_KNEE_WIDTH_DB = 0.0;
static constexpr double MAX_KNEE_WIDTH_DB = 24.0;
static constexpr double MIN_DC_THRESHOLD = 0.0;
static constexpr double MAX_DC_THRESHOLD = 0.05;
static constexpr double MIN_FEEDBACK_CORR_THRESHOLD = 0.0;
static constexpr double MAX_FEEDBACK_CORR_THRESHOLD = 1.0;

// === CONSTANTES MATHEMATIQUES ===
static constexpr double MIN_LOG_PROTECTION = 1e-10;
static constexpr double STEREO_RMS_DIVISOR = 2.0;
static constexpr double STEREO_OFFSET_DIVISOR = 2.0;
static constexpr double MIN_ENERGY_THRESHOLD = 1e-9;
static constexpr size_t ZERO_SAMPLES = 0;

// === CONSTANTES DE CLIPPING ===
static constexpr float CLIP_THRESHOLD_HIGH = 1.0f;
static constexpr float CLIP_THRESHOLD_LOW = -1.0f;
static constexpr float CLIP_CORRECTION_HIGH = 1.0f;
static constexpr float CLIP_CORRECTION_LOW = -1.0f;
static constexpr float NAN_REPLACEMENT = 0.0f;

// === CONSTANTES D'INITIALISATION ===
static constexpr double INITIAL_SUM = 0.0;
static constexpr double INITIAL_SUM2 = 0.0;
static constexpr uint32_t INITIAL_CLIPPED = 0;

// === CONSTANTES POUR L'AUTOCORRELATION DE FEEDBACK ===
static constexpr size_t MIN_LAG_DIVISOR = 4;
static constexpr size_t MIN_LAG_ABSOLUTE = 32;
static constexpr size_t MAX_LAG_ABSOLUTE = 512;
static constexpr size_t LAG_MULTIPLIER = 2;
static constexpr size_t MAX_LAG_INDEX = 1;
static constexpr double FEEDBACK_SCORE_MIN = 0.0;
static constexpr double FEEDBACK_SCORE_MAX = 1.0;

// === CONSTANTES POUR LE SOFT KNEE LIMITER ===
static constexpr double CUBIC_COEFF_3 = 3.0;
static constexpr double CUBIC_COEFF_2 = 2.0;
static constexpr double MIN_KNEE_THRESHOLD = 0.0;
static constexpr double OVER_DB_THRESHOLD = 0.0;
static constexpr double GAIN_DB_DIVISOR = 20.0;
static constexpr double GAIN_DB_BASE = 10.0;

// === CONSTANTES POUR LA NORMALISATION ===
static constexpr double NORMALIZATION_MIN = 0.0;
static constexpr double NORMALIZATION_MAX = 1.0;

} // namespace SafetyConstants

// Import des constantes pour éviter la répétition des namespace
using namespace SafetyConstants;

} // namespace AudioSafety

#endif // __cplusplus
