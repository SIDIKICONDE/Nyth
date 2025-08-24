#include "EffectsConfig.h"

namespace Nyth {
namespace Audio {

// === Implémentation EffectsConfigValidator ===

bool EffectsConfigValidator::validate(const EffectsConfig& config, std::string& error) {
    if (config.sampleRate < MIN_SAMPLE_RATE || config.sampleRate > MAX_SAMPLE_RATE) {
        error = "Sample rate must be between " + std::to_string(MIN_SAMPLE_RATE) + " and " +
                std::to_string(MAX_SAMPLE_RATE) + " Hz";
        return false;
    }

    if (config.channels < MIN_CHANNELS || config.channels > MAX_CHANNELS) {
        error = "Channels must be between " + std::to_string(MIN_CHANNELS) + " and " + std::to_string(MAX_CHANNELS);
        return false;
    }

    if (config.inputLevel < MIN_LEVEL || config.inputLevel > MAX_LEVEL) {
        error = "Input level must be between " + std::to_string(MIN_LEVEL) + " and " + std::to_string(MAX_LEVEL);
        return false;
    }

    if (config.outputLevel < MIN_LEVEL || config.outputLevel > MAX_LEVEL) {
        error = "Output level must be between " + std::to_string(MIN_LEVEL) + " and " + std::to_string(MAX_LEVEL);
        return false;
    }

    return true;
}

bool EffectsConfigValidator::validate(const CompressorConfig& config, std::string& error) {
    if (config.thresholdDb < Effects::Compressor::MIN_THRESHOLD_DB ||
        config.thresholdDb > Effects::Compressor::MAX_THRESHOLD_DB) {
        error = "Compressor threshold must be between " + std::to_string(Effects::Compressor::MIN_THRESHOLD_DB) +
                " and " + std::to_string(Effects::Compressor::MAX_THRESHOLD_DB) + " dB";
        return false;
    }

    if (config.ratio < Effects::Compressor::MIN_RATIO || config.ratio > Effects::Compressor::MAX_RATIO) {
        error = "Compressor ratio must be between " + std::to_string(Effects::Compressor::MIN_RATIO) + " and " +
                std::to_string(Effects::Compressor::MAX_RATIO);
        return false;
    }

    if (config.attackMs < Effects::Compressor::MIN_ATTACK_MS || config.attackMs > Effects::Compressor::MAX_ATTACK_MS) {
        error = "Compressor attack time must be between " + std::to_string(Effects::Compressor::MIN_ATTACK_MS) +
                " and " + std::to_string(Effects::Compressor::MAX_ATTACK_MS) + " ms";
        return false;
    }

    if (config.releaseMs < Effects::Compressor::MIN_RELEASE_MS ||
        config.releaseMs > Effects::Compressor::MAX_RELEASE_MS) {
        error = "Compressor release time must be between " + std::to_string(Effects::Compressor::MIN_RELEASE_MS) +
                " and " + std::to_string(Effects::Compressor::MAX_RELEASE_MS) + " ms";
        return false;
    }

    if (config.makeupDb < Effects::Compressor::MIN_MAKEUP_DB || config.makeupDb > Effects::Compressor::MAX_MAKEUP_DB) {
        error = "Compressor makeup gain must be between " + std::to_string(Effects::Compressor::MIN_MAKEUP_DB) +
                " and " + std::to_string(Effects::Compressor::MAX_MAKEUP_DB) + " dB";
        return false;
    }

    return true;
}

bool EffectsConfigValidator::validate(const DelayConfig& config, std::string& error) {
    if (config.delayMs < Effects::Delay::MIN_DELAY_MS || config.delayMs > Effects::Delay::MAX_DELAY_MS) {
        error = "Delay time must be between " + std::to_string(Effects::Delay::MIN_DELAY_MS) + " and " +
                std::to_string(Effects::Delay::MAX_DELAY_MS) + " ms";
        return false;
    }

    if (config.feedback < Effects::Delay::MIN_FEEDBACK || config.feedback > Effects::Delay::MAX_FEEDBACK) {
        error = "Delay feedback must be between " + std::to_string(Effects::Delay::MIN_FEEDBACK) + " and " +
                std::to_string(Effects::Delay::MAX_FEEDBACK);
        return false;
    }

    if (config.mix < Effects::Delay::MIN_MIX || config.mix > Effects::Delay::MAX_MIX) {
        error = "Delay mix must be between " + std::to_string(Effects::Delay::MIN_MIX) + " and " +
                std::to_string(Effects::Delay::MAX_MIX);
        return false;
    }

    return true;
}

bool EffectsConfigValidator::validate(const ReverbConfig& config, std::string& error) {
    if (config.roomSize < Effects::Reverb::MIN_ROOM_SIZE || config.roomSize > Effects::Reverb::MAX_ROOM_SIZE) {
        error = "Reverb room size must be between " + std::to_string(Effects::Reverb::MIN_ROOM_SIZE) + " and " +
                std::to_string(Effects::Reverb::MAX_ROOM_SIZE);
        return false;
    }

    if (config.damping < Effects::Reverb::MIN_DAMPING || config.damping > Effects::Reverb::MAX_DAMPING) {
        error = "Reverb damping must be between " + std::to_string(Effects::Reverb::MIN_DAMPING) + " and " +
                std::to_string(Effects::Reverb::MAX_DAMPING);
        return false;
    }

    if (config.wetLevel < Effects::Reverb::MIN_WET_LEVEL || config.wetLevel > Effects::Reverb::MAX_WET_LEVEL) {
        error = "Reverb wet level must be between " + std::to_string(Effects::Reverb::MIN_WET_LEVEL) + " and " +
                std::to_string(Effects::Reverb::MAX_WET_LEVEL);
        return false;
    }

    return true;
}

EffectsConfig EffectsConfigValidator::getDefault() {
    return EffectsConfig();
}

CompressorConfig EffectsConfigValidator::getDefaultCompressor() {
    return CompressorConfig();
}

DelayConfig EffectsConfigValidator::getDefaultDelay() {
    return DelayConfig();
}

ReverbConfig EffectsConfigValidator::getDefaultReverb() {
    return ReverbConfig();
}

} // namespace Audio
} // namespace Nyth
