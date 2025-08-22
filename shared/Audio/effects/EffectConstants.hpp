#pragma once

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
// Note: Math functions not needed for constants only

// Audio Effect Constants - Centralized for all audio effects
namespace AudioFX {

// Audio Sample Rate and Channel Constants
static constexpr uint32_t MINIMUM_SAMPLE_RATE = 8000;
static constexpr uint32_t DEFAULT_SAMPLE_RATE = 48000;
static constexpr uint32_t MIN_SAMPLE_RATE = 1;
static constexpr int MONO_CHANNELS = 1;
static constexpr int STEREO_CHANNELS = 2;
static constexpr int DEFAULT_CHANNELS = STEREO_CHANNELS;
static constexpr bool DEFAULT_ENABLED_STATE = true;
static constexpr bool DEFAULT_ENABLED = true;
static constexpr size_t ZERO_SAMPLES = 0;

// Buffer and Processing Constants
static constexpr size_t DEFAULT_BUFFER_SIZE = 1024;
static constexpr float BUFFER_INIT_VALUE = 0.0f;
static constexpr size_t FIRST_EFFECT_INDEX = 0;
static constexpr size_t CHAIN_START_INDEX = 1;
static constexpr size_t REFERENCE_SAMPLE_RATE = 48000;

// Compressor Effect Constants
static constexpr double MIN_RATIO = 1.0;
static constexpr double MIN_TIME_MS = 0.1;
static constexpr double EPSILON_DB = 1e-12;
static constexpr double DB_CONVERSION_FACTOR = 20.0;
static constexpr double POWER_CONVERSION_BASE = 10.0;
static constexpr double STEREO_AVERAGE_FACTOR = 0.5;
static constexpr size_t UNROLL_BLOCK_SIZE = 4;
static constexpr size_t PREFETCH_DISTANCE = 16;
static constexpr double MS_TO_SECONDS_COMPRESSOR = 1000.0;
static constexpr double GAIN_ATTACK_FACTOR = 0.5;
static constexpr double MIN_GAIN_ATTACK_MS = 1.0;
static constexpr double MIN_GAIN_RELEASE_MS = 5.0;

// Compressor Default Values
static constexpr double DEFAULT_THRESHOLD_DB = -18.0;
static constexpr double DEFAULT_RATIO = 3.0;
static constexpr double DEFAULT_ATTACK_MS = 10.0;
static constexpr double DEFAULT_RELEASE_MS = 80.0;
static constexpr double DEFAULT_MAKEUP_DB = 0.0;
static constexpr double DEFAULT_ENVELOPE = 0.0;
static constexpr double DEFAULT_GAIN = 1.0;
static constexpr double DEFAULT_ATTACK_COEFF = 0.9;
static constexpr double DEFAULT_RELEASE_COEFF = 0.99;
static constexpr double DEFAULT_GAIN_ATTACK_COEFF = 0.8;
static constexpr double DEFAULT_GAIN_RELEASE_COEFF = 0.98;

// Delay Effect Constants
static constexpr double MIN_DELAY_VALUE = 0.0;
static constexpr double MAX_FEEDBACK = 0.95;
static constexpr double MIN_FEEDBACK = 0.0;
static constexpr double MIN_MIX = 0.0;
static constexpr double MAX_MIX = 1.0;
static constexpr double MIX_THRESHOLD = 0.0001;
static constexpr double MIX_INVERT_FACTOR = 1.0;
static constexpr double MS_TO_SECONDS_DELAY = 0.001;
static constexpr size_t MIN_DELAY_SAMPLES = 1;
static constexpr size_t MAX_DELAY_SECONDS = 4;
static constexpr size_t DEFAULT_INDEX = 0;

// Delay Default Values
static constexpr double DEFAULT_DELAY_MS = 150.0;
static constexpr double DEFAULT_FEEDBACK = 0.3;
static constexpr double DEFAULT_MIX = 0.25;

// Utility Constants
static constexpr double MAX_FLOAT = 3.40282347e+38;     // std::numeric_limits<float>::max()
static constexpr double MIN_FLOAT = -3.40282347e+38;    // std::numeric_limits<float>::lowest()

} // namespace AudioFX
