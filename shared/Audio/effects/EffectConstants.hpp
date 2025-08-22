#pragma once

// C++17 standard headers
#include <cstdint>
#include <cstddef>

namespace AudioFX {

// === AUDIO CONFIGURATION ===
static constexpr uint32_t DEFAULT_SAMPLE_RATE = 48000;
static constexpr uint32_t MIN_SAMPLE_RATE = 8000;
static constexpr uint32_t MINIMUM_SAMPLE_RATE = 8000;
static constexpr uint32_t REFERENCE_SAMPLE_RATE = 48000;
static constexpr int DEFAULT_CHANNELS = 2;
static constexpr int MONO_CHANNELS = 1;
static constexpr int STEREO_CHANNELS = 2;

// === EFFECT CHAIN CONSTANTS ===
static constexpr bool DEFAULT_ENABLED = true;
static constexpr bool DEFAULT_ENABLED_STATE = true;
static constexpr size_t FIRST_EFFECT_INDEX = 0;
static constexpr size_t CHAIN_START_INDEX = 1;
static constexpr size_t ZERO_SAMPLES = 0;

// === COMPRESSOR CONSTANTS ===
static constexpr double DEFAULT_THRESHOLD_DB = -10.0;
static constexpr double DEFAULT_RATIO = 4.0;
static constexpr double DEFAULT_ATTACK_MS = 10.0;
static constexpr double DEFAULT_RELEASE_MS = 100.0;
static constexpr double DEFAULT_MAKEUP_DB = 0.0;
static constexpr double MIN_RATIO = 1.0;
static constexpr double MIN_TIME_MS = 0.1;
static constexpr double DEFAULT_ENVELOPE = 0.0;
static constexpr double DEFAULT_GAIN = 1.0;
static constexpr double DEFAULT_ATTACK_COEFF = 0.99;
static constexpr double DEFAULT_RELEASE_COEFF = 0.999;
static constexpr double DEFAULT_GAIN_ATTACK_COEFF = 0.99;
static constexpr double DEFAULT_GAIN_RELEASE_COEFF = 0.999;
static constexpr double EPSILON_DB = 1e-10;
static constexpr double DB_CONVERSION_FACTOR = 20.0;
static constexpr double POWER_CONVERSION_BASE = 10.0;
static constexpr double MS_TO_SECONDS_COMPRESSOR = 1000.0;
static constexpr double MIN_GAIN_ATTACK_MS = 0.1;
static constexpr double MIN_GAIN_RELEASE_MS = 0.1;
static constexpr double GAIN_ATTACK_FACTOR = 0.5;
static constexpr double STEREO_AVERAGE_FACTOR = 0.5;

// === DELAY CONSTANTS ===
static constexpr double DEFAULT_DELAY_MS = 100.0;
static constexpr double DEFAULT_FEEDBACK = 0.5;
static constexpr double DEFAULT_MIX = 0.5;
static constexpr double MIN_DELAY_VALUE = 0.1;
static constexpr double MIN_FEEDBACK = 0.0;
static constexpr double MAX_FEEDBACK = 0.99;
static constexpr double MIN_MIX = 0.0;
static constexpr double MAX_MIX = 1.0;
static constexpr double MIX_THRESHOLD = 0.001;
static constexpr double MIX_INVERT_FACTOR = 1.0;
static constexpr double MS_TO_SECONDS_DELAY = 0.001;
static constexpr size_t MIN_DELAY_SAMPLES = 1;
static constexpr size_t MAX_DELAY_SECONDS = 4;
static constexpr size_t DEFAULT_BUFFER_SIZE = 1024;
static constexpr size_t DEFAULT_INDEX = 0;
static constexpr float BUFFER_INIT_VALUE = 0.0f;

// === PERFORMANCE CONSTANTS ===
static constexpr size_t UNROLL_BLOCK_SIZE = 4;
static constexpr size_t PREFETCH_DISTANCE = 64;

<<<<<<< Current (Your changes)
<<<<<<< Current (Your changes)
// Valeurs par défaut du Delay (C++17 constexpr)
constexpr double DEFAULT_DELAY_MS = 150.0;
constexpr double DEFAULT_FEEDBACK = 0.3;
constexpr double DEFAULT_MIX = 0.25;

// Constantes utilitaires (C++17 constexpr)
constexpr double MAX_FLOAT = 3.40282347e+38;     // Maximum float value
constexpr double MIN_FLOAT = -3.40282347e+38;    // Minimum float value

=======
>>>>>>> Incoming (Background Agent changes)
=======
>>>>>>> Incoming (Background Agent changes)
} // namespace AudioFX
