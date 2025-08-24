#pragma once

#include <cstdint>

namespace Nyth {
namespace Audio {

// === Constantes générales ===
constexpr uint32_t MIN_SAMPLE_RATE = 8000;
constexpr uint32_t MAX_SAMPLE_RATE = 192000;
constexpr uint32_t DEFAULT_SAMPLE_RATE = 44100;

constexpr int MIN_CHANNELS = 1;
constexpr int MAX_CHANNELS = 8;
constexpr int DEFAULT_CHANNELS = 2;

constexpr float MIN_LEVEL = 0.0f;
constexpr float MAX_LEVEL = 2.0f;
constexpr float DEFAULT_LEVEL = 1.0f;

// === Constantes des effets ===
namespace Effects {

// === Constantes globales des effets ===
static constexpr float DEFAULT_THRESHOLD_DB = -24.0f;
static constexpr float DEFAULT_RATIO = 4.0f;
static constexpr float DEFAULT_ATTACK_MS = 10.0f;
static constexpr float DEFAULT_RELEASE_MS = 100.0f;
static constexpr float DEFAULT_MAKEUP_DB = 0.0f;
static constexpr float DEFAULT_DELAY_MS = 250.0f;
static constexpr float DEFAULT_FEEDBACK = 0.3f;
static constexpr float DEFAULT_MIX = 0.2f;
static constexpr float DEFAULT_ROOM_SIZE = 0.5f;
static constexpr float DEFAULT_DAMPING = 0.5f;
static constexpr float DEFAULT_WET_LEVEL = 0.3f;
static constexpr float DEFAULT_DRY_LEVEL = 0.7f;

// === Compresseur ===
namespace Compressor {
constexpr float MIN_THRESHOLD_DB = -60.0f;
constexpr float MAX_THRESHOLD_DB = 0.0f;
constexpr float DEFAULT_THRESHOLD_DB = -24.0f;

constexpr float MIN_RATIO = 1.0f;
constexpr float MAX_RATIO = 20.0f;
constexpr float DEFAULT_RATIO = 4.0f;

constexpr float MIN_ATTACK_MS = 1.0f;
constexpr float MAX_ATTACK_MS = 1000.0f;
constexpr float DEFAULT_ATTACK_MS = 10.0f;

constexpr float MIN_RELEASE_MS = 10.0f;
constexpr float MAX_RELEASE_MS = 5000.0f;
constexpr float DEFAULT_RELEASE_MS = 100.0f;

constexpr float MIN_MAKEUP_DB = -20.0f;
constexpr float MAX_MAKEUP_DB = 20.0f;
constexpr float DEFAULT_MAKEUP_DB = 0.0f;
} // namespace Compressor

// === Delay ===
namespace Delay {
constexpr float MIN_DELAY_MS = 1.0f;
constexpr float MAX_DELAY_MS = 2000.0f;
constexpr float DEFAULT_DELAY_MS = 250.0f;

constexpr float MIN_FEEDBACK = 0.0f;
constexpr float MAX_FEEDBACK = 0.95f;
constexpr float DEFAULT_FEEDBACK = 0.3f;

constexpr float MIN_MIX = 0.0f;
constexpr float MAX_MIX = 1.0f;
constexpr float DEFAULT_MIX = 0.2f;
} // namespace Delay

// === Reverb ===
namespace Reverb {
constexpr float MIN_ROOM_SIZE = 0.0f;
constexpr float MAX_ROOM_SIZE = 1.0f;
constexpr float DEFAULT_ROOM_SIZE = 0.5f;

constexpr float MIN_DAMPING = 0.0f;
constexpr float MAX_DAMPING = 1.0f;
constexpr float DEFAULT_DAMPING = 0.5f;

constexpr float MIN_WET_LEVEL = 0.0f;
constexpr float MAX_WET_LEVEL = 1.0f;
constexpr float DEFAULT_WET_LEVEL = 0.3f;

constexpr float MIN_DRY_LEVEL = 0.0f;
constexpr float MAX_DRY_LEVEL = 1.0f;
constexpr float DEFAULT_DRY_LEVEL = 0.7f;
} // namespace Reverb

// === Limites de performance ===
constexpr size_t MAX_ACTIVE_EFFECTS = 10;
constexpr size_t MAX_PROCESSING_BLOCK_SIZE = 4096;
constexpr size_t MIN_PROCESSING_BLOCK_SIZE = 64;

// === Types d'effets ===
enum class EffectType { UNKNOWN = 0, COMPRESSOR = 1, DELAY = 2, REVERB = 3, EQUALIZER = 4, FILTER = 5, LIMITER = 6 };

// === États des effets ===
enum class EffectState { UNINITIALIZED = 0, INITIALIZED = 1, PROCESSING = 2, BYPASSED = 3, ERROR = 4 };

} // namespace Effects

} // namespace Audio
} // namespace Nyth
