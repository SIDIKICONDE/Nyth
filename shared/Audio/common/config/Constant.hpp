#ifndef NYTH_AUDIO_CONSTANTS_HPP
#define NYTH_AUDIO_CONSTANTS_HPP

#include <cstddef>
#include <cstdint>
#include <chrono>

namespace Nyth {
namespace Audio {
namespace Constants {

// Audio conversion constants
static constexpr float INT16_SCALE = 32767.0f;
static constexpr float INT16_TO_FLOAT_SCALE = 1.0f / 32768.0f;
static constexpr float INT24_SCALE = 8388607.0f; // 2^23 - 1
static constexpr float INT24_MIN = -8388608.0f;
static constexpr float INT24_MAX = 8388607.0f;
static constexpr float INT16_MIN_VALUE = -32768.0f;
static constexpr float INT16_MAX_VALUE = 32767.0f;

// Default buffer sizes
static constexpr size_t DEFAULT_BUFFER_SIZE = 8192;
static constexpr size_t DEFAULT_SILENCE_BUFFER_SIZE = 44100; // 1 second at 44.1kHz

// WAV format constants
static constexpr unsigned int WAV_HEADER_SIZE = 36; // Size without RIFF chunk
static constexpr unsigned short WAV_FORMAT_PCM = 1;
static constexpr unsigned short WAV_FORMAT_IEEE_FLOAT = 3;

// Silence detection
static constexpr float DEFAULT_SILENCE_THRESHOLD = 0.01f;

// Audio metrics constants
static constexpr size_t DEFAULT_METRICS_WINDOW_SIZE = 1024;
static constexpr int DEFAULT_METRICS_UPDATE_INTERVAL_MS = 100;
static constexpr float METRICS_SMOOTHING_ALPHA = 0.1f;
static constexpr size_t MAX_METRICS_HISTORY_SIZE = 1000;
static constexpr size_t DYNAMIC_RANGE_WINDOW_SIZE = 256;
static constexpr float SILENCE_RMS_THRESHOLD = 0.001f;
static constexpr float DEFAULT_SAMPLE_RATE = 44100.0f;

// Performance monitor constants
static constexpr size_t MAX_LATENCY_HISTORY_SIZE = 1000;
static constexpr size_t MAX_CPU_HISTORY_SIZE = 1000;
static constexpr float DROPOUT_THRESHOLD_MULTIPLIER = 0.8f;

// LUFS calculation constants
static constexpr float LUFS_K_WEIGHTING_CORRECTION = -0.691f;
static constexpr float POWER_TO_DB_FACTOR = 10.0f;
static constexpr float AMPLITUDE_TO_DB_FACTOR = 20.0f;

// True peak detection constants
static constexpr int TRUE_PEAK_OVERSAMPLING_FACTOR = 4;
static constexpr float TRUE_PEAK_OVERSAMPLING_FACTOR_FLOAT = 4.0f;

// Dynamic range calculation constants
static constexpr float DYNAMIC_RANGE_HIGH_PERCENTILE = 0.95f;
static constexpr float DYNAMIC_RANGE_LOW_PERCENTILE = 0.10f;

// Spectral analysis constants
static constexpr float SPECTRAL_CENTROID_DIVISOR = 2.0f;

// Performance monitoring constants
static constexpr float MICROSECONDS_TO_MILLISECONDS = 1000.0f;
static constexpr float PERCENTAGE_FACTOR = 100.0f;

// Display precision constants
static constexpr int DISPLAY_PRECISION = 2;

// SIMD constants
static constexpr size_t SIMD_VECTOR_SIZE = 4;
static constexpr size_t SIMD_VECTOR_SIZE_FLOAT = 4;
static constexpr float SIMD_ZERO_FLOAT = 0.0f;

// Gain ramp constants
static constexpr size_t GAIN_RAMP_VECTOR_INDEX_1 = 1;
static constexpr size_t GAIN_RAMP_VECTOR_INDEX_2 = 2;
static constexpr size_t GAIN_RAMP_VECTOR_INDEX_3 = 3;

// Audio file writer constants
static constexpr int BITS_PER_SAMPLE_16 = 16;
static constexpr int BITS_PER_SAMPLE_24 = 24;
static constexpr int BITS_PER_SAMPLE_32 = 32;
static constexpr int BITS_TO_BYTES_FACTOR = 8;
static constexpr int FILENAME_INDEX_WIDTH = 4;
static constexpr size_t INDEX_PLACEHOLDER_LENGTH = 7; // "{index}"
static constexpr size_t TIMESTAMP_PLACEHOLDER_LENGTH = 11; // "{timestamp}"
static constexpr size_t WAV_RIFF_SIZE_POSITION = 4;
static constexpr size_t WAV_DATA_SIZE_POSITION = 40;
static constexpr uint32_t UINT32_MAX_VALUE = 0xFFFFFFFF;
static constexpr uint8_t BYTE_MASK = 0xFF;
static constexpr int INT24_SHIFT_8 = 8;
static constexpr int INT24_SHIFT_16 = 16;
static constexpr float SILENCE_SUM_INITIAL_VALUE = 0.0f;

// Audio format constants for mobile platforms
static constexpr int AAC_BITRATE_LOW = 64000;     // 64 kbps for voice
static constexpr int AAC_BITRATE_MEDIUM = 128000; // 128 kbps for music
static constexpr int AAC_BITRATE_HIGH = 256000;   // 256 kbps for high quality
static constexpr int AAC_BITRATE_MAX = 320000;    // 320 kbps max

// Audio format quality levels
static constexpr float AUDIO_QUALITY_LOW = 0.3f;    // 30% quality
static constexpr float AUDIO_QUALITY_MEDIUM = 0.6f; // 60% quality
static constexpr float AUDIO_QUALITY_HIGH = 0.9f;   // 90% quality
static constexpr float AUDIO_QUALITY_LOSSLESS = 1.0f; // 100% quality

// Audio processing constants
static constexpr float STEREO_TO_MONO_MIX_FACTOR = 0.5f;
static constexpr float CLIPPING_THRESHOLD_MIN = -1.0f;
static constexpr float CLIPPING_THRESHOLD_MAX = 1.0f;
static constexpr float RMS_ZERO_RETURN_VALUE = 0.0f;
static constexpr double SUM_ACCUMULATOR_INITIAL_VALUE = 0.0;

// Audio capture constants
static constexpr int DEFAULT_CHANNEL_COUNT = 1;
static constexpr int DEFAULT_BITS_PER_SAMPLE = 16;
static constexpr int DEFAULT_BUFFER_SIZE_FRAMES = 1024;
static constexpr int DEFAULT_NUM_BUFFERS = 3;
static constexpr float DEFAULT_LEVEL_VALUE = 0.0f;
static constexpr double RMS_TO_DB_FACTOR = 20.0;
static constexpr double VERY_LOW_DB_LEVEL = -100.0;
static constexpr float DEFAULT_CLIPPING_THRESHOLD = 0.99f;

// Validation constants
static constexpr int SAMPLE_RATE_8KHZ = 8000;
static constexpr int SAMPLE_RATE_11KHZ = 11025;
static constexpr int SAMPLE_RATE_16KHZ = 16000;
static constexpr int SAMPLE_RATE_22KHZ = 22050;
static constexpr int SAMPLE_RATE_44KHZ = 44100;
static constexpr int SAMPLE_RATE_48KHZ = 48000;
static constexpr int SAMPLE_RATE_88KHZ = 88200;
static constexpr int SAMPLE_RATE_96KHZ = 96000;
static constexpr int SAMPLE_RATE_176KHZ = 176400;
static constexpr int SAMPLE_RATE_192KHZ = 192000;
static constexpr int MIN_CHANNEL_COUNT = 1;
static constexpr int MAX_CHANNEL_COUNT = 8;
static constexpr int BITS_PER_SAMPLE_8 = 8;
static constexpr int MIN_BUFFER_SIZE = 64;
static constexpr int MAX_BUFFER_SIZE = 8192;
static constexpr int MIN_NUM_BUFFERS = 2;
static constexpr int MAX_NUM_BUFFERS = 10;

// Implementation constants
static constexpr int TRIPLE_BUFFER_COUNT = 3;
static constexpr int INITIAL_BUFFER_INDEX = 0;
static constexpr int INITIAL_POSITION = 0;
static constexpr int INITIAL_SIZE = 0;
static constexpr int NULL_DATA_CHECK = 0;
static constexpr float SUM_INITIAL_VALUE = 0.0f;
static constexpr float MAX_INITIAL_VALUE = 0.0f;

// Metrics constants
static constexpr std::chrono::seconds DEFAULT_RETENTION_PERIOD{300};
static constexpr int METRICS_HISTORY_SECONDS = 60;
static constexpr int CPU_HISTORY_SECONDS = 60;
static constexpr float DEFAULT_METRICS_VALUE = 0.0f;
static constexpr float VARIANCE_INITIAL_VALUE = 0.0f;
static constexpr uint64_t DEFAULT_COUNTER_VALUE = 0;
static constexpr int PERCENTILE_50 = 50;
static constexpr int PERCENTILE_95 = 95;
static constexpr int PERCENTILE_99 = 99;
static constexpr float MAX_LATENCY_INITIAL = 0.0f;

// SIMD processing constants
static constexpr float CLIPPING_DETECTION_THRESHOLD = 0.99f;
static constexpr float NORMALIZATION_TARGET_PEAK = 0.95f;
static constexpr float STEREO_TO_MONO_MIX_FACTOR_SIMD = 0.5f;
static constexpr float SILENCE_DETECTION_THRESHOLD = 0.001f;

// Audio file writer constants
static constexpr float DEFAULT_DURATION_LIMIT = 60.0f;
static constexpr size_t DEFAULT_SPLIT_SIZE_MB = 100 * 1024 * 1024; // 100 MB
static constexpr float DEFAULT_SILENCE_DURATION = 2.0f;
static constexpr int DEFAULT_FILE_START_INDEX = 0;
static constexpr uint32_t WAV_FORMAT_CHUNK_SIZE = 16;
static constexpr float DEFAULT_DURATION_VALUE = 0.0f;

// Audio utils constants
static constexpr int32_t INT32_SCALE = 2147483647;
static constexpr int32_t INT32_MIN_VALUE = -2147483648;
static constexpr int32_t INT32_MAX_VALUE = 2147483647;
static constexpr float INT32_TO_FLOAT_SCALE = 1.0f / 2147483648.0f;
static constexpr float NORMALIZATION_TARGET_RMS = 0.5f;
static constexpr float TIMER_ZERO_RETURN = 0;
static constexpr int MS_TO_FRAMES_FACTOR = 1000;
static constexpr int FRAMES_TO_MS_FACTOR = 1000;
static constexpr bool BUFFER_NOT_IN_USE = false;

// iOS Audio constants
static constexpr int IOS_AUDIO_INPUT_BUS = 1;
static constexpr int IOS_AUDIO_OUTPUT_BUS = 0;
static constexpr int IOS_MAX_CHANNELS_DEFAULT = 2;
static constexpr int IOS_BUFFER_POSITION_INCREMENT = 1;
static constexpr int IOS_BUFFER_POSITION_RESET = 0;

// Android Audio constants
static constexpr int ANDROID_MAX_CHANNELS_DEFAULT = 2;
static constexpr int ANDROID_OPENSL_BUFFER_COUNT = 3;
static constexpr int ANDROID_BUFFER_INDEX_INCREMENT = 1;
static constexpr int ANDROID_BUFFER_INDEX_MODULO = 3;

// Android error handling
static constexpr int ANDROID_SUCCESS = 0;
static constexpr int ANDROID_FALSE = 0;
static constexpr int ANDROID_TRUE = 1;

// ============================================================================
// Constantes spécifiques à la plateforme Android
// ============================================================================
namespace Android {

// Seuils et paramètres audio
namespace AudioThresholds {
    static constexpr float CLIPPING_THRESHOLD_DEFAULT = 0.99f;        // Seuil de clipping par défaut
    static constexpr float SILENCE_THRESHOLD_DEFAULT = 0.001f;        // Seuil de silence par défaut
    static constexpr float PEAK_LEVEL_MAX = 1.0f;                     // Niveau de crête maximum
    static constexpr float RMS_TARGET_DEFAULT = 0.7f;                 // RMS cible par défaut pour la normalisation
    static constexpr float INPUT_GAIN_DEFAULT = 1.0f;                 // Gain d'entrée par défaut
}

// Paramètres de calcul audio
namespace AudioCalculation {
    static constexpr float RMS_DB_LOW_LEVEL = -100.0f;                // Niveau très bas en dB
    static constexpr float DB_MULTIPLIER = 20.0f;                     // Multiplicateur pour conversion linéaire -> dB
    static constexpr size_t SIMD_MIN_SIZE = 64;                       // Taille minimale pour utiliser SIMD
}

// Paramètres de buffer et streaming
namespace BufferConfig {
    static constexpr size_t MIN_BUFFER_SIZE = 1024;                   // Taille minimale du buffer
    static constexpr size_t DEFAULT_BUFFER_SIZE = 4096;               // Taille par défaut du buffer
    static constexpr int32_t DEFAULT_NUM_BUFFERS = 2;                 // Nombre de buffers par défaut
}

// Paramètres temporels
namespace TimeConfig {
    static constexpr float MAX_DURATION_UNLIMITED = 0.0f;             // Durée illimitée
    static constexpr size_t MAX_FILE_SIZE_UNLIMITED = 0;              // Taille de fichier illimitée
}

// États et flags
namespace StateFlags {
    static constexpr bool DEFAULT_AUTO_NORMALIZE = false;             // Normalisation automatique par défaut
    static constexpr bool DEFAULT_ENABLE_CLIPPING_PROTECTION = true;  // Protection contre le clipping activée par défaut
}

// Validation des paramètres
namespace ValidationLimits {
    static constexpr int MIN_SAMPLE_RATE = 8000;                      // Taux d'échantillonnage minimum
    static constexpr int MAX_SAMPLE_RATE = 192000;                    // Taux d'échantillonnage maximum
    static constexpr int MIN_CHANNEL_COUNT = 1;                       // Nombre minimum de canaux
    static constexpr int MAX_CHANNEL_COUNT = 8;                       // Nombre maximum de canaux
    static constexpr int MIN_BITS_PER_SAMPLE = 8;                     // Bits par échantillon minimum
    static constexpr int MAX_BITS_PER_SAMPLE = 32;                    // Bits par échantillon maximum
    static constexpr size_t MIN_BUFFER_SIZE_FRAMES = 256;             // Taille minimale du buffer en frames
    static constexpr size_t MAX_BUFFER_SIZE_FRAMES = 16384;           // Taille maximale du buffer en frames
}

} // namespace Android

} // namespace Constants
} // namespace Audio
} // namespace Nyth

#endif // NYTH_AUDIO_CONSTANTS_HPP
