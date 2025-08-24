#pragma once

#include "AudioLimits.h"
#include <string>

namespace Nyth {
namespace Audio {

// === Configuration audio centralisée ===
struct AudioConfig {
    // === Paramètres de base ===
    int sampleRate = Limits::DEFAULT_SAMPLE_RATE;
    int channelCount = Limits::DEFAULT_CHANNELS;
    int bitsPerSample = Limits::DEFAULT_BITS_PER_SAMPLE;
    int bufferSizeFrames = Limits::DEFAULT_BUFFER_SIZE_FRAMES;

    // === Options de traitement ===
    bool enableEchoCancellation = false;
    bool enableNoiseSuppression = false;
    bool enableAutoGainControl = false;

    // === Configuration d'enregistrement ===
    std::string recordingFormat = "WAV"; // "WAV" ou "RAW_PCM"
    size_t maxRecordingDurationMs = Limits::MAX_RECORDING_DURATION_MS;

    // === Configuration d'analyse ===
    double analysisIntervalMs = Limits::DEFAULT_ANALYSIS_INTERVAL_MS;
    float silenceThreshold = Limits::DEFAULT_THRESHOLD;

    // === Validation ===
    bool isValid() const {
        return validateConfiguration().empty();
    }

    std::string getValidationError() const {
        return validateConfiguration();
    }

    // === Méthodes utilitaires ===
    size_t getBytesPerFrame() const {
        return (bitsPerSample / 8) * channelCount;
    }

    size_t getBufferSizeBytes() const {
        return bufferSizeFrames * getBytesPerFrame();
    }

    double getBufferDurationMs() const {
        return (bufferSizeFrames * 1000.0) / sampleRate;
    }

    // === Comparaison et copie ===
    bool operator==(const AudioConfig& other) const {
        return sampleRate == other.sampleRate && channelCount == other.channelCount &&
               bitsPerSample == other.bitsPerSample && bufferSizeFrames == other.bufferSizeFrames &&
               enableEchoCancellation == other.enableEchoCancellation &&
               enableNoiseSuppression == other.enableNoiseSuppression &&
               enableAutoGainControl == other.enableAutoGainControl;
    }

    bool operator!=(const AudioConfig& other) const {
        return !(*this == other);
    }

private:
    std::string validateConfiguration() const {
        // Validation du sample rate
        if (sampleRate < Limits::MIN_SAMPLE_RATE || sampleRate > Limits::MAX_SAMPLE_RATE) {
            return "Sample rate must be between " + std::to_string(Limits::MIN_SAMPLE_RATE) + " and " +
                   std::to_string(Limits::MAX_SAMPLE_RATE) + " Hz";
        }

        // Validation des canaux
        if (channelCount < Limits::MIN_CHANNELS || channelCount > Limits::MAX_CHANNELS) {
            return "Channel count must be between " + std::to_string(Limits::MIN_CHANNELS) + " and " +
                   std::to_string(Limits::MAX_CHANNELS);
        }

        // Validation des bits par sample
        if (bitsPerSample != 8 && bitsPerSample != 16 && bitsPerSample != 24 && bitsPerSample != 32) {
            return "Bits per sample must be 8, 16, 24, or 32";
        }

        // Validation de la taille du buffer
        if (bufferSizeFrames < Limits::MIN_BUFFER_SIZE_FRAMES || bufferSizeFrames > Limits::MAX_BUFFER_SIZE_FRAMES) {
            return "Buffer size must be between " + std::to_string(Limits::MIN_BUFFER_SIZE_FRAMES) + " and " +
                   std::to_string(Limits::MAX_BUFFER_SIZE_FRAMES) + " frames";
        }

        // Validation de la cohérence
        double bufferDurationMs = getBufferDurationMs();
        if (bufferDurationMs < 1.0) {
            return "Buffer duration too short (< 1ms)";
        }
        if (bufferDurationMs > 1000.0) {
            return "Buffer duration too long (> 1s)";
        }

        // Validation de l'annulation d'écho
        if (enableEchoCancellation && sampleRate < 16000) {
            return "Echo cancellation requires sample rate >= 16kHz";
        }

        // Validation de l'intervalle d'analyse
        if (analysisIntervalMs < Limits::MIN_ANALYSIS_INTERVAL_MS ||
            analysisIntervalMs > Limits::MAX_ANALYSIS_INTERVAL_MS) {
            return "Analysis interval must be between " + std::to_string(Limits::MIN_ANALYSIS_INTERVAL_MS) + " and " +
                   std::to_string(Limits::MAX_ANALYSIS_INTERVAL_MS) + " ms";
        }

        // Validation du seuil de silence
        if (silenceThreshold < Limits::MIN_THRESHOLD || silenceThreshold > Limits::MAX_THRESHOLD) {
            return "Silence threshold must be between " + std::to_string(Limits::MIN_THRESHOLD) + " and " +
                   std::to_string(Limits::MAX_THRESHOLD);
        }

        return ""; // Configuration valide
    }
};

// === Configuration d'enregistrement audio ===
struct AudioRecordingConfig {
    std::string filePath;
    std::string format = "WAV"; // "WAV" ou "RAW_PCM"
    size_t maxDurationMs = Limits::MAX_RECORDING_DURATION_MS;

    bool isValid() const {
        if (filePath.empty()) {
            return false;
        }
        if (filePath.length() > Limits::MAX_FILE_PATH_LENGTH) {
            return false;
        }
        if (format != "WAV" && format != "RAW_PCM") {
            return false;
        }
        if (maxDurationMs < Limits::MIN_RECORDING_DURATION_MS || maxDurationMs > Limits::MAX_RECORDING_DURATION_MS) {
            return false;
        }
        return true;
    }
};

} // namespace Audio
} // namespace Nyth
