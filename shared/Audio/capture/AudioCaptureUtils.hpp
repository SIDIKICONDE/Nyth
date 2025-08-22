#pragma once

#include <vector>
#include <cstdint>
#include <cmath>
#include <algorithm>
#include <complex>
#include <string>
#include <sstream>
#include <iomanip>

namespace Nyth {
namespace Audio {
namespace Utils {

// Constantes audio
constexpr float DB_MIN = -96.0f;
constexpr float DB_MAX = 0.0f;
constexpr float SILENCE_THRESHOLD_DB = -60.0f;

// ============================================================================
// Conversions de format audio
// ============================================================================

// Conversion Int16 <-> Float
inline void int16ToFloat(const int16_t* input, float* output, size_t samples) {
    constexpr float scale = 1.0f / 32768.0f;
    for (size_t i = 0; i < samples; ++i) {
        output[i] = input[i] * scale;
    }
}

inline void floatToInt16(const float* input, int16_t* output, size_t samples) {
    for (size_t i = 0; i < samples; ++i) {
        float sample = input[i] * 32767.0f;
        sample = std::max(-32768.0f, std::min(32767.0f, sample));
        output[i] = static_cast<int16_t>(sample);
    }
}

// Conversion Int24 <-> Float
inline void int24ToFloat(const uint8_t* input, float* output, size_t samples) {
    constexpr float scale = 1.0f / 8388608.0f;
    for (size_t i = 0; i < samples; ++i) {
        int32_t sample = (input[i*3] << 8) | (input[i*3 + 1] << 16) | (input[i*3 + 2] << 24);
        sample >>= 8; // Sign extend
        output[i] = sample * scale;
    }
}

inline void floatToInt24(const float* input, uint8_t* output, size_t samples) {
    for (size_t i = 0; i < samples; ++i) {
        float sample = input[i] * 8388607.0f;
        sample = std::max(-8388608.0f, std::min(8388607.0f, sample));
        int32_t intSample = static_cast<int32_t>(sample);
        output[i*3] = (intSample >> 0) & 0xFF;
        output[i*3 + 1] = (intSample >> 8) & 0xFF;
        output[i*3 + 2] = (intSample >> 16) & 0xFF;
    }
}

// Conversion Int32 <-> Float
inline void int32ToFloat(const int32_t* input, float* output, size_t samples) {
    constexpr float scale = 1.0f / 2147483648.0f;
    for (size_t i = 0; i < samples; ++i) {
        output[i] = input[i] * scale;
    }
}

inline void floatToInt32(const float* input, int32_t* output, size_t samples) {
    for (size_t i = 0; i < samples; ++i) {
        double sample = input[i] * 2147483647.0;
        sample = std::max(-2147483648.0, std::min(2147483647.0, sample));
        output[i] = static_cast<int32_t>(sample);
    }
}

// ============================================================================
// Conversions de canaux
// ============================================================================

// Mono vers Stéréo
inline void monoToStereo(const float* mono, float* stereo, size_t frames) {
    for (size_t i = 0; i < frames; ++i) {
        stereo[i * 2] = mono[i];
        stereo[i * 2 + 1] = mono[i];
    }
}

// Stéréo vers Mono
inline void stereoToMono(const float* stereo, float* mono, size_t frames) {
    for (size_t i = 0; i < frames; ++i) {
        mono[i] = (stereo[i * 2] + stereo[i * 2 + 1]) * 0.5f;
    }
}

// Interleave/Deinterleave
inline void interleave(const float** planar, float* interleaved, size_t frames, size_t channels) {
    for (size_t frame = 0; frame < frames; ++frame) {
        for (size_t ch = 0; ch < channels; ++ch) {
            interleaved[frame * channels + ch] = planar[ch][frame];
        }
    }
}

inline void deinterleave(const float* interleaved, float** planar, size_t frames, size_t channels) {
    for (size_t frame = 0; frame < frames; ++frame) {
        for (size_t ch = 0; ch < channels; ++ch) {
            planar[ch][frame] = interleaved[frame * channels + ch];
        }
    }
}

// ============================================================================
// Calculs de niveaux audio
// ============================================================================

// RMS (Root Mean Square)
inline float calculateRMS(const float* data, size_t samples) {
    float sum = 0.0f;
    for (size_t i = 0; i < samples; ++i) {
        sum += data[i] * data[i];
    }
    return std::sqrt(sum / samples);
}

// Peak level
inline float calculatePeak(const float* data, size_t samples) {
    float peak = 0.0f;
    for (size_t i = 0; i < samples; ++i) {
        peak = std::max(peak, std::abs(data[i]));
    }
    return peak;
}

// True Peak (avec interpolation)
inline float calculateTruePeak(const float* data, size_t samples, int oversampleFactor = 4) {
    if (samples < 4) return calculatePeak(data, samples);
    
    float truePeak = 0.0f;
    std::vector<float> oversampled(samples * oversampleFactor);
    
    // Simple linear interpolation for oversampling
    for (size_t i = 0; i < samples - 1; ++i) {
        for (int j = 0; j < oversampleFactor; ++j) {
            float t = static_cast<float>(j) / oversampleFactor;
            oversampled[i * oversampleFactor + j] = data[i] * (1.0f - t) + data[i + 1] * t;
        }
    }
    
    return calculatePeak(oversampled.data(), oversampled.size());
}

// Conversion dB <-> Linear
inline float linearToDb(float linear) {
    if (linear <= 0.0f) return DB_MIN;
    float db = 20.0f * std::log10(linear);
    return std::max(DB_MIN, std::min(DB_MAX, db));
}

inline float dbToLinear(float db) {
    if (db <= DB_MIN) return 0.0f;
    return std::pow(10.0f, db / 20.0f);
}

// LUFS (Loudness Units relative to Full Scale) - Simplified
inline float calculateLUFS(const float* data, size_t samples, float sampleRate) {
    // Pre-filter (K-weighting approximation)
    std::vector<float> filtered(samples);
    
    // High shelf filter coefficients (simplified)
    float b0 = 1.53512485958697f;
    float b1 = -2.69169618940638f;
    float b2 = 1.19839281085285f;
    float a1 = -1.69065929318241f;
    float a2 = 0.73248077421585f;
    
    float x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    
    for (size_t i = 0; i < samples; ++i) {
        float x0 = data[i];
        float y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
        
        filtered[i] = y0;
        
        x2 = x1; x1 = x0;
        y2 = y1; y1 = y0;
    }
    
    // Calculate mean square
    float meanSquare = 0.0f;
    for (size_t i = 0; i < samples; ++i) {
        meanSquare += filtered[i] * filtered[i];
    }
    meanSquare /= samples;
    
    // Convert to LUFS
    return -0.691f + 10.0f * std::log10(meanSquare);
}

// ============================================================================
// Détection et analyse
// ============================================================================

// Détection de silence
inline bool isSilent(const float* data, size_t samples, float thresholdDb = SILENCE_THRESHOLD_DB) {
    float peak = calculatePeak(data, samples);
    return linearToDb(peak) < thresholdDb;
}

// Détection de clipping
inline bool isClipping(const float* data, size_t samples, float threshold = 0.99f) {
    for (size_t i = 0; i < samples; ++i) {
        if (std::abs(data[i]) >= threshold) {
            return true;
        }
    }
    return false;
}

// Comptage de samples clippés
inline size_t countClippedSamples(const float* data, size_t samples, float threshold = 0.99f) {
    size_t count = 0;
    for (size_t i = 0; i < samples; ++i) {
        if (std::abs(data[i]) >= threshold) {
            count++;
        }
    }
    return count;
}

// Zero Crossing Rate
inline float calculateZeroCrossingRate(const float* data, size_t samples) {
    if (samples < 2) return 0.0f;
    
    size_t crossings = 0;
    for (size_t i = 1; i < samples; ++i) {
        if ((data[i-1] >= 0 && data[i] < 0) || (data[i-1] < 0 && data[i] >= 0)) {
            crossings++;
        }
    }
    
    return static_cast<float>(crossings) / (samples - 1);
}

// ============================================================================
// Traitement audio
// ============================================================================

// Application de gain
inline void applyGain(float* data, size_t samples, float gain) {
    for (size_t i = 0; i < samples; ++i) {
        data[i] *= gain;
    }
}

// Application de gain avec soft clipping
inline void applyGainWithSoftClipping(float* data, size_t samples, float gain) {
    for (size_t i = 0; i < samples; ++i) {
        float sample = data[i] * gain;
        
        // Soft clipping using tanh
        if (std::abs(sample) > 0.7f) {
            sample = std::tanh(sample);
        }
        
        data[i] = sample;
    }
}

// Normalisation
inline void normalize(float* data, size_t samples, float targetLevel = 1.0f) {
    float peak = calculatePeak(data, samples);
    if (peak > 0.0f) {
        float gain = targetLevel / peak;
        applyGain(data, samples, gain);
    }
}

// DC offset removal
inline void removeDCOffset(float* data, size_t samples) {
    float sum = 0.0f;
    for (size_t i = 0; i < samples; ++i) {
        sum += data[i];
    }
    
    float offset = sum / samples;
    for (size_t i = 0; i < samples; ++i) {
        data[i] -= offset;
    }
}

// Fade in/out
inline void fadeIn(float* data, size_t samples, size_t fadeSamples) {
    fadeSamples = std::min(fadeSamples, samples);
    for (size_t i = 0; i < fadeSamples; ++i) {
        float factor = static_cast<float>(i) / fadeSamples;
        data[i] *= factor;
    }
}

inline void fadeOut(float* data, size_t samples, size_t fadeSamples) {
    fadeSamples = std::min(fadeSamples, samples);
    size_t startFade = samples - fadeSamples;
    for (size_t i = 0; i < fadeSamples; ++i) {
        float factor = 1.0f - (static_cast<float>(i) / fadeSamples);
        data[startFade + i] *= factor;
    }
}

// ============================================================================
// Génération de signaux de test
// ============================================================================

// Génération de sinus
inline void generateSine(float* output, size_t samples, float frequency, float sampleRate, float amplitude = 1.0f) {
    const float omega = 2.0f * M_PI * frequency / sampleRate;
    for (size_t i = 0; i < samples; ++i) {
        output[i] = amplitude * std::sin(omega * i);
    }
}

// Génération de bruit blanc
inline void generateWhiteNoise(float* output, size_t samples, float amplitude = 1.0f) {
    for (size_t i = 0; i < samples; ++i) {
        output[i] = amplitude * (2.0f * (rand() / static_cast<float>(RAND_MAX)) - 1.0f);
    }
}

// Génération de bruit rose (approximation)
inline void generatePinkNoise(float* output, size_t samples, float amplitude = 1.0f) {
    static float b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    
    for (size_t i = 0; i < samples; ++i) {
        float white = (rand() / static_cast<float>(RAND_MAX)) - 0.5f;
        
        b0 = 0.99886f * b0 + white * 0.0555179f;
        b1 = 0.99332f * b1 + white * 0.0750759f;
        b2 = 0.96900f * b2 + white * 0.1538520f;
        b3 = 0.86650f * b3 + white * 0.3104856f;
        b4 = 0.55000f * b4 + white * 0.5329522f;
        b5 = -0.7616f * b5 - white * 0.0168980f;
        
        float pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362f;
        b6 = white * 0.115926f;
        
        output[i] = amplitude * pink * 0.11f; // Compensate for gain
    }
}

// ============================================================================
// Utilitaires de format
// ============================================================================

// Formatage du temps en HH:MM:SS.mmm
inline std::string formatTime(double seconds) {
    int hours = static_cast<int>(seconds / 3600);
    int minutes = static_cast<int>((seconds - hours * 3600) / 60);
    double secs = seconds - hours * 3600 - minutes * 60;
    
    std::stringstream ss;
    ss << std::setfill('0') << std::setw(2) << hours << ":"
       << std::setfill('0') << std::setw(2) << minutes << ":"
       << std::fixed << std::setprecision(3) << std::setw(6) << secs;
    
    return ss.str();
}

// Formatage de la taille en octets
inline std::string formatBytes(uint64_t bytes) {
    const char* units[] = {"B", "KB", "MB", "GB", "TB"};
    int unitIndex = 0;
    double size = static_cast<double>(bytes);
    
    while (size >= 1024.0 && unitIndex < 4) {
        size /= 1024.0;
        unitIndex++;
    }
    
    std::stringstream ss;
    ss << std::fixed << std::setprecision(2) << size << " " << units[unitIndex];
    return ss.str();
}

// Calcul de la taille du buffer en millisecondes
inline double bufferSizeToMs(size_t bufferSize, uint32_t sampleRate) {
    return (static_cast<double>(bufferSize) / sampleRate) * 1000.0;
}

// Calcul de la taille du buffer en échantillons
inline size_t msToBufferSize(double ms, uint32_t sampleRate) {
    return static_cast<size_t>((ms * sampleRate) / 1000.0);
}

} // namespace Utils
} // namespace Audio
} // namespace Nyth