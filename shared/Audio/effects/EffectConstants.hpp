#pragma once

// C++17 standard headers - Compatibility garantie
#include <cstdint>
#include <cstddef>
#include <array>
#include <vector>
#include <string>
#include <type_traits>
#include <limits>
#include <cmath>
#include <algorithm>

// Constantes des Effets Audio - Centralisées pour tous les effets audio (C++17)
namespace AudioFX {

// Constantes de taux d'échantillonnage et de canaux audio (C++17 constexpr)
constexpr uint32_t MIN_SAMPLE_RATE = 8000;           // Minimum sample rate (8kHz)
constexpr uint32_t DEFAULT_SAMPLE_RATE = 48000;      // Default sample rate (48kHz)
constexpr int MONO_CHANNELS = 1;                     // Mono channel count
constexpr int STEREO_CHANNELS = 2;                   // Stereo channel count
constexpr int DEFAULT_CHANNELS = STEREO_CHANNELS;    // Default channel count
constexpr bool DEFAULT_ENABLED_STATE = true;         // Default enabled state
constexpr bool DEFAULT_ENABLED = true;               // Default enabled
constexpr size_t ZERO_SAMPLES = 0;                   // Zero samples for validation

// Constantes de buffer et de traitement (C++17 constexpr)
constexpr size_t DEFAULT_BUFFER_SIZE = 1024;         // Default buffer size
constexpr float BUFFER_INIT_VALUE = 0.0f;            // Buffer initialization value
constexpr size_t FIRST_EFFECT_INDEX = 0;             // First effect index
constexpr size_t CHAIN_START_INDEX = 1;              // Chain start index
constexpr size_t REFERENCE_SAMPLE_RATE = 48000;      // Reference sample rate

// Constantes de l'effet Compresseur (C++17 constexpr)
constexpr double MIN_RATIO = 1.0;
constexpr double MIN_TIME_MS = 0.1;
constexpr double EPSILON_DB = 1e-12;
constexpr double DB_CONVERSION_FACTOR = 20.0;
constexpr double POWER_CONVERSION_BASE = 10.0;
constexpr double STEREO_AVERAGE_FACTOR = 0.5;
constexpr size_t UNROLL_BLOCK_SIZE = 4;              // Loop unrolling block size
constexpr size_t PREFETCH_DISTANCE = 16;             // Prefetch distance for optimization
constexpr double MS_TO_SECONDS_COMPRESSOR = 1000.0;
constexpr double GAIN_ATTACK_FACTOR = 0.5;
constexpr double MIN_GAIN_ATTACK_MS = 1.0;
constexpr double MIN_GAIN_RELEASE_MS = 5.0;

// Valeurs par défaut du Compresseur (C++17 constexpr)
constexpr double DEFAULT_THRESHOLD_DB = -18.0;
constexpr double DEFAULT_RATIO = 3.0;
constexpr double DEFAULT_ATTACK_MS = 10.0;
constexpr double DEFAULT_RELEASE_MS = 80.0;
constexpr double DEFAULT_MAKEUP_DB = 0.0;
constexpr double DEFAULT_ENVELOPE = 0.0;
constexpr double DEFAULT_GAIN = 1.0;
constexpr double DEFAULT_ATTACK_COEFF = 0.9;
constexpr double DEFAULT_RELEASE_COEFF = 0.99;
constexpr double DEFAULT_GAIN_ATTACK_COEFF = 0.8;
constexpr double DEFAULT_GAIN_RELEASE_COEFF = 0.98;

// Constantes de l'effet Delay (C++17 constexpr)
constexpr double MIN_DELAY_VALUE = 0.0;
constexpr double MAX_FEEDBACK = 0.95;
constexpr double MIN_FEEDBACK = 0.0;
constexpr double MIN_MIX = 0.0;
constexpr double MAX_MIX = 1.0;
constexpr double MIX_THRESHOLD = 0.0001;
constexpr double MIX_INVERT_FACTOR = 1.0;
constexpr double MS_TO_SECONDS_DELAY = 0.001;
constexpr size_t MIN_DELAY_SAMPLES = 1;
constexpr size_t MAX_DELAY_SECONDS = 4;
constexpr size_t DEFAULT_INDEX = 0;

// Valeurs par défaut du Delay (C++17 constexpr)
constexpr double DEFAULT_DELAY_MS = 150.0;
constexpr double DEFAULT_FEEDBACK = 0.3;
constexpr double DEFAULT_MIX = 0.25;

// Constantes utilitaires (C++17 constexpr)
constexpr double MAX_FLOAT = 3.40282347e+38;     // Maximum float value
constexpr double MIN_FLOAT = -3.40282347e+38;    // Minimum float value

} // namespace AudioFX
