#pragma once

#ifdef __cplusplus

// C++17 standard headers - Required for types used
#include <cstddef>  // for size_t
#include <cstdint>  // for uint32_t


namespace AudioSafety {

// Constantes pour éviter les nombres magiques
namespace SafetyConstants {

// === CONSTANTES GLOBALES UNIFIÉES ===
// Valeurs fondamentales utilisées dans tout le système
static constexpr double ZERO = 0.0;
static constexpr double ONE = 1.0;
static constexpr double NEGATIVE_ONE = -1.0;
static constexpr size_t ZERO_SIZE = 0;
static constexpr bool FALSE_BOOL = false;
static constexpr bool TRUE_BOOL = true;

// Constantes mathématiques universelles
static constexpr double LOG10_BASE = 2.302585092994046; // log(10)
static constexpr double DB_SCALE_FACTOR = 20.0;         // Facteur d'échelle pour dB

// Constantes de précision
static constexpr double HIGH_PRECISION_TOLERANCE = 1e-9;  // Tolérance haute précision
static constexpr double STANDARD_PRECISION_TOLERANCE = 1e-6; // Tolérance standard

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

// === VALEURS D'INITIALISATION (UNIFIÉES) ===
static constexpr double INITIAL_PEAK = ZERO;
static constexpr double INITIAL_RMS = ZERO;
static constexpr double INITIAL_DC_OFFSET = ZERO;
static constexpr uint32_t INITIAL_CLIPPED_SAMPLES = static_cast<uint32_t>(ZERO_SIZE);
static constexpr bool INITIAL_OVERLOAD_ACTIVE = FALSE_BOOL;
static constexpr double INITIAL_FEEDBACK_SCORE = ZERO;
static constexpr bool INITIAL_HAS_NAN = FALSE_BOOL;
static constexpr bool INITIAL_FEEDBACK_LIKELY = FALSE_BOOL;

// === VALEURS PAR DEFAUT DE L'ENGINE ===
static constexpr double DEFAULT_LIMITER_THRESHOLD_LINEAR = 0.89; // from dB

// === CONSTANTES DE CONVERSION D/B (UNIFIÉES) ===
static constexpr double DB_TO_LINEAR_BASE = 10.0;
static constexpr double DB_TO_LINEAR_DIVISOR = DB_SCALE_FACTOR;

// === CONSTANTES MATHEMATIQUES (UNIFIÉES) ===
static constexpr double SQRT_10_APPROX = 3.16;           // sqrt(10) approximation
static constexpr double SQRT_10_INV_APPROX = 0.316;      // 1/sqrt(10) approximation
static constexpr double LOG_BASE_10 = 10.0;              // Base 10 pour puissances
static constexpr double LOG_BASE_10_INV = 0.1;           // 1/10 pour puissances négatives
static constexpr double UNITY_POWER = ONE;               // 10^0 = 1
static constexpr double ZERO_POWER_EXP = ZERO;           // Exposant 0
static constexpr double POSITIVE_UNIT_EXP = ONE;         // Exposant +1
static constexpr double NEGATIVE_UNIT_EXP = NEGATIVE_ONE; // Exposant -1
static constexpr double FRACTIONAL_THRESHOLD = 0.5;      // Seuil pour partie fractionnaire

// === LIMITES DE VALIDATION (UNIFIÉES) ===
static constexpr uint32_t MIN_SAMPLE_RATE = 8000;        // Minimum sample rate (8kHz)
static constexpr uint32_t MAX_SAMPLE_RATE = 192000;      // Maximum sample rate (192kHz)
static constexpr int MIN_CHANNELS = 1;                   // Minimum number of channels
static constexpr int MAX_CHANNELS = 2;                   // Maximum number of channels
static constexpr double MIN_LIMITER_THRESHOLD_DB = -20.0;
static constexpr double MAX_LIMITER_THRESHOLD_DB = ZERO;
static constexpr double MIN_KNEE_WIDTH_DB = ZERO;
static constexpr double MAX_KNEE_WIDTH_DB = 24.0;
static constexpr double MIN_DC_THRESHOLD = ZERO;
static constexpr double MAX_DC_THRESHOLD = 0.05;
static constexpr double MIN_FEEDBACK_CORR_THRESHOLD = ZERO;
static constexpr double MAX_FEEDBACK_CORR_THRESHOLD = ONE;

// === CONSTANTES MATHEMATIQUES (UNIFIÉES) ===
static constexpr double MIN_LOG_PROTECTION = 1e-10;
static constexpr double STEREO_RMS_DIVISOR = 2.0;
static constexpr double STEREO_OFFSET_DIVISOR = 2.0;
static constexpr double MIN_ENERGY_THRESHOLD = 1e-9;
static constexpr size_t ZERO_SAMPLES = ZERO_SIZE;

// === CONSTANTES DE CLIPPING (UNIFIÉES) ===
static constexpr float CLIP_THRESHOLD_HIGH = 1.0f;     // Upper clipping threshold
static constexpr float CLIP_THRESHOLD_LOW = -1.0f;     // Lower clipping threshold
static constexpr float CLIP_CORRECTION_HIGH = 1.0f;    // Upper clipping correction value
static constexpr float CLIP_CORRECTION_LOW = -1.0f;    // Lower clipping correction value
static constexpr float NAN_REPLACEMENT = 0.0f;         // Replacement value for NaN/Inf

// === CONSTANTES D'INITIALISATION ===

// === CONSTANTES POUR L'AUTOCORRELATION DE FEEDBACK (UNIFIÉES) ===
static constexpr size_t MIN_LAG_DIVISOR = 4;
static constexpr size_t MIN_LAG_ABSOLUTE = 32;
static constexpr size_t MAX_LAG_ABSOLUTE = 512;
static constexpr size_t LAG_MULTIPLIER = 2;
static constexpr size_t MAX_LAG_INDEX = 1;
static constexpr double FEEDBACK_SCORE_MIN = ZERO;
static constexpr double FEEDBACK_SCORE_MAX = ONE;

// === CONSTANTES POUR LE SOFT KNEE LIMITER (UNIFIÉES) ===
static constexpr double CUBIC_COEFF_3 = 3.0;
static constexpr double CUBIC_COEFF_2 = 2.0;
static constexpr double MIN_KNEE_THRESHOLD = ZERO;
static constexpr double OVER_DB_THRESHOLD = ZERO;
static constexpr double GAIN_DB_DIVISOR = DB_SCALE_FACTOR;
static constexpr double GAIN_DB_BASE = 10.0;

// === CONSTANTES POUR LA NORMALISATION ===

// === CONSTANTES SIMD (UNIFIÉES) ===
static constexpr size_t AVX2_VECTOR_SIZE = 8;
static constexpr size_t AVX2_REMAINDER_THRESHOLD = 7; // AVX2_VECTOR_SIZE - 1
static constexpr size_t NEON_VECTOR_SIZE = 4;
static constexpr size_t NEON_REMAINDER_THRESHOLD = 3; // NEON_VECTOR_SIZE - 1

// === CONSTANTES DE TRAITEMENT AUDIO ===

// === CONSTANTES DE VALIDATION ===

// === CONSTANTES DE CONVERSION SIMD ===
static constexpr int SIMD_MASK_BASE_INDEX = 0;
static constexpr int SIMD_MASK_INDEX_1 = 1;
static constexpr int SIMD_MASK_INDEX_2 = 2;
static constexpr int SIMD_MASK_INDEX_3 = 3;

// === CONSTANTES DE MESSAGES D'ERREUR ===
static constexpr const char* ERROR_MESSAGE_OK = "OK";
static constexpr const char* ERROR_MESSAGE_NULL_BUFFER = "Null buffer";
static constexpr const char* ERROR_MESSAGE_INVALID_SAMPLE_RATE = "Invalid sample rate";
static constexpr const char* ERROR_MESSAGE_INVALID_CHANNELS = "Invalid channels";
static constexpr const char* ERROR_MESSAGE_INVALID_THRESHOLD_DB = "Invalid threshold dB";
static constexpr const char* ERROR_MESSAGE_INVALID_KNEE_WIDTH = "Invalid knee width";
static constexpr const char* ERROR_MESSAGE_INVALID_DC_THRESHOLD = "Invalid DC threshold";
static constexpr const char* ERROR_MESSAGE_INVALID_FEEDBACK_THRESHOLD = "Invalid feedback threshold";
static constexpr const char* ERROR_MESSAGE_PROCESSING_FAILED = "Processing failed";
static constexpr const char* ERROR_MESSAGE_UNKNOWN = "Unknown error";

// === CONSTANTES DE VALIDATION D'ERREUR ===
static constexpr int32_t ERROR_CODE_OK = 0;
static constexpr int32_t ERROR_CODE_NULL_BUFFER = -1;
static constexpr int32_t ERROR_CODE_INVALID_SAMPLE_RATE = -2;
static constexpr int32_t ERROR_CODE_INVALID_CHANNELS = -3;
static constexpr int32_t ERROR_CODE_INVALID_THRESHOLD_DB = -4;
static constexpr int32_t ERROR_CODE_INVALID_KNEE_WIDTH = -5;
static constexpr int32_t ERROR_CODE_INVALID_DC_THRESHOLD = -6;
static constexpr int32_t ERROR_CODE_INVALID_FEEDBACK_THRESHOLD = -7;
static constexpr int32_t ERROR_CODE_PROCESSING_FAILED = -8;

// === CONSTANTES DE CONFIGURATION TEMPORELLE ===
static constexpr double DEFAULT_SMOOTHING_FACTOR = 0.95;
static constexpr double DEFAULT_ATTACK_TIME_MS = 10.0;
static constexpr double DEFAULT_RELEASE_TIME_MS = 100.0;
static constexpr double DEFAULT_MAKEUP_GAIN_DB = 0.0;
static constexpr double DEFAULT_FEEDBACK_SENSITIVITY = 0.8;
static constexpr uint32_t DEFAULT_ANALYSIS_WINDOW_MS = 100;
static constexpr uint32_t DEFAULT_MIN_FREQUENCY_HZ = 20;
static constexpr uint32_t DEFAULT_MAX_FREQUENCY_HZ = 20000;
static constexpr double DEFAULT_MAX_PROCESSING_TIME_MS = 10.0;

// === CONSTANTES DE VALIDATION TEMPORELLE ===
static constexpr double MIN_PROCESSING_TIME_MS = 1.0;
static constexpr double MAX_PROCESSING_TIME_MS = 1000.0;
static constexpr double MIN_ATTACK_TIME_MS = 0.1;
static constexpr double MAX_ATTACK_TIME_MS = 1000.0;
static constexpr double MIN_RELEASE_TIME_MS = 1.0;
static constexpr double MAX_RELEASE_TIME_MS = 10000.0;
static constexpr double MIN_MAKEUP_GAIN_DB = -20.0;
static constexpr double MAX_MAKEUP_GAIN_DB = 20.0;
static constexpr uint32_t MIN_ANALYSIS_WINDOW_MS = 10u;
static constexpr uint32_t MAX_ANALYSIS_WINDOW_MS = 1000u;
static constexpr uint32_t MIN_FEEDBACK_FREQUENCY_HZ = 20u;
static constexpr uint32_t MAX_FEEDBACK_FREQUENCY_HZ = 50000u;
static constexpr uint32_t MIN_FREQUENCY_DIFFERENCE_HZ = 100u;

// === CONSTANTES DE COMPARAISON (UNIFIÉES) ===
static constexpr double CONFIG_COMPARISON_TOLERANCE = STANDARD_PRECISION_TOLERANCE;
static constexpr double THRESHOLD_COMPARISON_TOLERANCE = HIGH_PRECISION_TOLERANCE;
static constexpr double SMOOTHING_FACTOR_MIN = ZERO;
static constexpr double SMOOTHING_FACTOR_MAX = ONE;
static constexpr double SENSITIVITY_MIN = ZERO;
static constexpr double SENSITIVITY_MAX = ONE;

// === CONSTANTES DE DIAGNOSTIC ===
static constexpr size_t CONFIG_INFO_BUFFER_SIZE = 1024;
static constexpr size_t REPORT_INFO_BUFFER_SIZE = 512;

// === CONSTANTES DE CONVERSION D/B ===

// === CONSTANTES DE FORMATAGE DE CHAÎNES ===
static constexpr const char* FORMAT_DC_THRESHOLD = "%.6f";
static constexpr const char* FORMAT_LIMITER_THRESHOLD = "%.1f";
static constexpr const char* FORMAT_FEEDBACK_THRESHOLD = "%.3f";
static constexpr const char* FORMAT_PROCESSING_TIME = "%.2f";

// === CONSTANTES DE VALIDATION CONFIGURATION ===

// === CONSTANTES D'INITIALISATION ===

// === CONSTANTES DE VALIDATION ===

// === CONSTANTES DE MESSAGES D'ERREUR CONFIG ===
static constexpr const char* ERROR_CONFIG_OK = "OK";
static constexpr const char* ERROR_CONFIG_NULL_BUFFER = "Null buffer provided";
static constexpr const char* ERROR_CONFIG_INVALID_SAMPLE_RATE = "Invalid sample rate";
static constexpr const char* ERROR_CONFIG_INVALID_CHANNELS = "Invalid number of channels";
static constexpr const char* ERROR_CONFIG_INVALID_THRESHOLD_DB = "Invalid threshold in dB";
static constexpr const char* ERROR_CONFIG_INVALID_KNEE_WIDTH = "Invalid knee width";
static constexpr const char* ERROR_CONFIG_INVALID_DC_THRESHOLD = "Invalid DC threshold";
static constexpr const char* ERROR_CONFIG_INVALID_FEEDBACK_THRESHOLD = "Invalid feedback threshold";
static constexpr const char* ERROR_CONFIG_PROCESSING_FAILED = "Audio processing failed";
static constexpr const char* ERROR_CONFIG_TIMEOUT = "Processing timeout";
static constexpr const char* ERROR_CONFIG_MEMORY_ERROR = "Memory allocation error";
static constexpr const char* ERROR_CONFIG_INVALID_CONFIG = "Invalid configuration";
static constexpr const char* ERROR_CONFIG_ENGINE_NOT_INITIALIZED = "Engine not initialized";
static constexpr const char* ERROR_CONFIG_OPTIMIZATION_NOT_SUPPORTED = "Optimization not supported";
static constexpr const char* ERROR_CONFIG_UNKNOWN = "Unknown error";

// === CONSTANTES D'ÉTAT ===
static constexpr const char* STATE_UNINITIALIZED = "uninitialized";
static constexpr const char* STATE_INITIALIZED = "initialized";
static constexpr const char* STATE_PROCESSING = "processing";
static constexpr const char* STATE_ERROR = "error";
static constexpr const char* STATE_SHUTDOWN = "shutdown";
static constexpr const char* STATE_UNKNOWN = "unknown";

// === CONSTANTES DE CODES D'ERREUR CONFIG ===
static constexpr int32_t ERROR_CONFIG_CODE_OK = 0;
static constexpr int32_t ERROR_CONFIG_CODE_NULL_BUFFER = -1;
static constexpr int32_t ERROR_CONFIG_CODE_INVALID_SAMPLE_RATE = -2;
static constexpr int32_t ERROR_CONFIG_CODE_INVALID_CHANNELS = -3;
static constexpr int32_t ERROR_CONFIG_CODE_INVALID_THRESHOLD_DB = -4;
static constexpr int32_t ERROR_CONFIG_CODE_INVALID_KNEE_WIDTH = -5;
static constexpr int32_t ERROR_CONFIG_CODE_INVALID_DC_THRESHOLD = -6;
static constexpr int32_t ERROR_CONFIG_CODE_INVALID_FEEDBACK_THRESHOLD = -7;
static constexpr int32_t ERROR_CONFIG_CODE_PROCESSING_FAILED = -8;
static constexpr int32_t ERROR_CONFIG_CODE_TIMEOUT = -9;
static constexpr int32_t ERROR_CONFIG_CODE_MEMORY_ERROR = -10;
static constexpr int32_t ERROR_CONFIG_CODE_INVALID_CONFIG = -11;
static constexpr int32_t ERROR_CONFIG_CODE_ENGINE_NOT_INITIALIZED = -12;
static constexpr int32_t ERROR_CONFIG_CODE_OPTIMIZATION_NOT_SUPPORTED = -13;

// === CONSTANTES D'ÉTAT CONFIG ===
static constexpr int32_t STATE_CONFIG_CODE_UNINITIALIZED = 0;
static constexpr int32_t STATE_CONFIG_CODE_INITIALIZED = 1;
static constexpr int32_t STATE_CONFIG_CODE_PROCESSING = 2;
static constexpr int32_t STATE_CONFIG_CODE_ERROR = 3;
static constexpr int32_t STATE_CONFIG_CODE_SHUTDOWN = 4;

// === CONSTANTES DE STATISTIQUES (UNIFIÉES) ===
static constexpr uint64_t INITIAL_TOTAL_FRAMES = ZERO_SIZE;
static constexpr uint64_t INITIAL_TOTAL_CLIPPED_SAMPLES = ZERO_SIZE;
static constexpr uint64_t INITIAL_TOTAL_OVERLOAD_FRAMES = ZERO_SIZE;
static constexpr uint64_t INITIAL_TOTAL_FEEDBACK_FRAMES = ZERO_SIZE;

// === CONSTANTES SIMD OPTIMISÉES ===

} // namespace SafetyConstants

// Import des constantes pour éviter la répétition des namespace
using namespace SafetyConstants;

} // namespace AudioSafety

#endif // __cplusplus
