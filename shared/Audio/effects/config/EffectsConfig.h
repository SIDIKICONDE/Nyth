#pragma once

#include <cstdint>
#include <string>
#include <vector>

namespace Nyth {
namespace Audio {

struct EffectsConfig {
    // Configuration générale
    uint32_t sampleRate = 44100;
    int channels = 2;
    float inputLevel = 1.0f;
    float outputLevel = 1.0f;

    // Configuration des effets
    bool bypassAll = false;
    bool enableCompressor = false;
    bool enableDelay = false;
    bool enableReverb = false;

    // Paramètres par défaut
    static constexpr uint32_t DEFAULT_SAMPLE_RATE = 44100;
    static constexpr int DEFAULT_CHANNELS = 2;
    static constexpr float DEFAULT_INPUT_LEVEL = 1.0f;
    static constexpr float DEFAULT_OUTPUT_LEVEL = 1.0f;
};

struct CompressorConfig {
    float thresholdDb = -24.0f; // Seuil de compression en dB
    float ratio = 4.0f;         // Ratio de compression
    float attackMs = 10.0f;     // Temps d'attaque en ms
    float releaseMs = 100.0f;   // Temps de relâche en ms
    float makeupDb = 0.0f;      // Gain de compensation en dB
    bool enabled = true;

    // Constantes
    static constexpr float MIN_THRESHOLD_DB = -60.0f;
    static constexpr float MAX_THRESHOLD_DB = 0.0f;
    static constexpr float MIN_RATIO = 1.0f;
    static constexpr float MAX_RATIO = 20.0f;
    static constexpr float MIN_ATTACK_MS = 1.0f;
    static constexpr float MAX_ATTACK_MS = 1000.0f;
    static constexpr float MIN_RELEASE_MS = 10.0f;
    static constexpr float MAX_RELEASE_MS = 5000.0f;
};

struct DelayConfig {
    float delayMs = 250.0f; // Délai en ms
    float feedback = 0.3f;  // Rétroaction
    float mix = 0.2f;       // Mix sec/humide
    bool enabled = true;

    // Constantes
    static constexpr float MIN_DELAY_MS = 1.0f;
    static constexpr float MAX_DELAY_MS = 2000.0f;
    static constexpr float MIN_FEEDBACK = 0.0f;
    static constexpr float MAX_FEEDBACK = 0.95f;
    static constexpr float MIN_MIX = 0.0f;
    static constexpr float MAX_MIX = 1.0f;
};

struct ReverbConfig {
    float roomSize = 0.5f; // Taille de la pièce
    float damping = 0.5f;  // Amortissement
    float wetLevel = 0.3f; // Niveau de réverbération
    float dryLevel = 0.7f; // Niveau sec
    bool enabled = true;

    // Constantes
    static constexpr float MIN_ROOM_SIZE = 0.0f;
    static constexpr float MAX_ROOM_SIZE = 1.0f;
    static constexpr float MIN_DAMPING = 0.0f;
    static constexpr float MAX_DAMPING = 1.0f;
    static constexpr float MIN_WET_LEVEL = 0.0f;
    static constexpr float MAX_WET_LEVEL = 1.0f;
};

struct EffectsStatistics {
    float inputLevel = 0.0f;
    float outputLevel = 0.0f;
    uint64_t processedFrames = 0;
    uint64_t processedSamples = 0;
    uint64_t durationMs = 0;
    int activeEffectsCount = 0;
};

class EffectsConfigValidator {
public:
    static bool validate(const EffectsConfig& config, std::string& error);
    static bool validate(const CompressorConfig& config, std::string& error);
    static bool validate(const DelayConfig& config, std::string& error);
    static bool validate(const ReverbConfig& config, std::string& error);

    static EffectsConfig getDefault();
    static CompressorConfig getDefaultCompressor();
    static DelayConfig getDefaultDelay();
    static ReverbConfig getDefaultReverb();
};

} // namespace Audio
} // namespace Nyth
