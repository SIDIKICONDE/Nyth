// Implémentations audio multiplateformes pour mobile iOS/Android
#include "AudioProcessing.hpp"
#include "../../common/config/Constant.hpp"
#include <algorithm>
#include <cmath>
#include <cstdint>
#include <vector>

namespace Nyth {
namespace Audio {

// ============================================================================
// AudioFormatConverter Implementation
// ============================================================================

void AudioFormatConverter::int16ToFloat(const int16_t* input, float* output, size_t sampleCount) {
    const float scale = Constants::INT16_TO_FLOAT_SCALE;
    for (size_t i = 0; i < sampleCount; ++i) {
        output[i] = input[i] * scale;
    }
}

void AudioFormatConverter::floatToInt16(const float* input, int16_t* output, size_t sampleCount) {
    const float scale = Constants::INT16_SCALE;
    for (size_t i = 0; i < sampleCount; ++i) {
        float sample = input[i] * scale;
        sample = std::max(Constants::INT16_MIN_VALUE, std::min(Constants::INT16_MAX_VALUE, sample));
        output[i] = static_cast<int16_t>(sample);
    }
}

void AudioFormatConverter::int32ToFloat(const int32_t* input, float* output, size_t sampleCount) {
    const float scale = Constants::INT32_TO_FLOAT_SCALE;
    for (size_t i = 0; i < sampleCount; ++i) {
        output[i] = input[i] * scale;
    }
}

void AudioFormatConverter::floatToInt32(const float* input, int32_t* output, size_t sampleCount) {
    const float scale = Constants::INT32_SCALE;
    for (size_t i = 0; i < sampleCount; ++i) {
        float sample = input[i] * scale;
        sample = std::max(static_cast<float>(Constants::INT32_MIN_VALUE), std::min(static_cast<float>(Constants::INT32_MAX_VALUE), sample));
        output[i] = static_cast<int32_t>(sample);
    }
}

void AudioFormatConverter::monoToStereo(const float* mono, float* stereo, size_t frameCount) {
    for (size_t i = 0; i < frameCount; ++i) {
        stereo[i * 2] = mono[i];
        stereo[i * 2 + 1] = mono[i];
    }
}

void AudioFormatConverter::stereoToMono(const float* stereo, float* mono, size_t frameCount) {
    for (size_t i = 0; i < frameCount; ++i) {
        mono[i] = (stereo[i * 2] + stereo[i * 2 + 1]) * Constants::STEREO_TO_MONO_MIX_FACTOR_SIMD;
    }
}

// ============================================================================
// AudioAnalyzer Implementation
// ============================================================================

float AudioAnalyzer::calculateRMS(const float* data, size_t sampleCount) {
    if (!data || sampleCount == Constants::NULL_DATA_CHECK) return Constants::RMS_ZERO_RETURN_VALUE;

    float sum = Constants::SUM_INITIAL_VALUE;
    for (size_t i = 0; i < sampleCount; ++i) {
        sum += data[i] * data[i];
    }
    return std::sqrt(sum / sampleCount);
}

float AudioAnalyzer::calculateRMSdB(const float* data, size_t sampleCount) {
    float rms = calculateRMS(data, sampleCount);
    if (rms <= Constants::DEFAULT_METRICS_VALUE) return Constants::VERY_LOW_DB_LEVEL;
    return Constants::RMS_TO_DB_FACTOR * std::log10(rms);
}

float AudioAnalyzer::calculatePeak(const float* data, size_t sampleCount) {
    if (!data || sampleCount == Constants::NULL_DATA_CHECK) return Constants::RMS_ZERO_RETURN_VALUE;

    float peak = Constants::MAX_INITIAL_VALUE;
    for (size_t i = 0; i < sampleCount; ++i) {
        peak = std::max(peak, std::abs(data[i]));
    }
    return peak;
}

float AudioAnalyzer::calculatePeakdB(const float* data, size_t sampleCount) {
    float peak = calculatePeak(data, sampleCount);
    if (peak <= Constants::DEFAULT_METRICS_VALUE) return Constants::VERY_LOW_DB_LEVEL;
    return Constants::RMS_TO_DB_FACTOR * std::log10(peak);
}

bool AudioAnalyzer::isSilent(const float* data, size_t sampleCount, float threshold) {
    return calculatePeak(data, sampleCount) < threshold;
}

float AudioAnalyzer::calculateEnergy(const float* data, size_t sampleCount) {
    if (!data || sampleCount == Constants::NULL_DATA_CHECK) return Constants::RMS_ZERO_RETURN_VALUE;

    float energy = Constants::SUM_INITIAL_VALUE;
    for (size_t i = 0; i < sampleCount; ++i) {
        energy += data[i] * data[i];
    }
    return energy;
}

bool AudioAnalyzer::hasClipping(const float* data, size_t sampleCount, float threshold) {
    for (size_t i = 0; i < sampleCount; ++i) {
        if (std::abs(data[i]) >= threshold) {
            return true;
        }
    }
    return false;
}

size_t AudioAnalyzer::countClippedSamples(const float* data, size_t sampleCount, float threshold) {
    size_t count = Constants::DEFAULT_COUNTER_VALUE;
    for (size_t i = 0; i < sampleCount; ++i) {
        if (std::abs(data[i]) >= threshold) {
            count++;
        }
    }
    return count;
}

void AudioAnalyzer::normalize(float* data, size_t sampleCount, float targetPeak) {
    float currentPeak = calculatePeak(data, sampleCount);
    if (currentPeak <= Constants::DEFAULT_METRICS_VALUE) return;

    float scale = targetPeak / currentPeak;
    for (size_t i = 0; i < sampleCount; ++i) {
        data[i] *= scale;
    }
}

void AudioAnalyzer::normalizeRMS(float* data, size_t sampleCount, float targetRMS) {
    float currentRMS = calculateRMS(data, sampleCount);
    if (currentRMS <= Constants::DEFAULT_METRICS_VALUE) return;

    float scale = targetRMS / currentRMS;
    for (size_t i = 0; i < sampleCount; ++i) {
        data[i] *= scale;
    }
}

// ============================================================================
// AudioTimer Implementation
// ============================================================================

void AudioTimer::start() {
    startTime_ = std::chrono::steady_clock::now();
    lastTime_ = startTime_;
    running_ = true;
}

void AudioTimer::stop() {
    running_ = false;
}

bool AudioTimer::isRunning() const {
    return running_.load();
}

int64_t AudioTimer::elapsedMs() const {
    if (!running_) return Constants::TIMER_ZERO_RETURN;
    auto now = std::chrono::steady_clock::now();
    return std::chrono::duration_cast<std::chrono::milliseconds>(now - startTime_).count();
}

int64_t AudioTimer::deltaMs() {
    if (!running_) return Constants::TIMER_ZERO_RETURN;
    auto now = std::chrono::steady_clock::now();
    auto delta = std::chrono::duration_cast<std::chrono::milliseconds>(now - lastTime_).count();
    lastTime_ = now;
    return delta;
}

int64_t AudioTimer::framesToMs(size_t frames, int sampleRate) {
    return (frames * Constants::FRAMES_TO_MS_FACTOR) / sampleRate;
}

size_t AudioTimer::msToFrames(int64_t ms, int sampleRate) {
    return (ms * sampleRate) / Constants::MS_TO_FRAMES_FACTOR;
}

// ============================================================================
// AudioBufferPool Implementation
// ============================================================================

AudioBufferPool::AudioBufferPool(size_t bufferSize, size_t poolSize)
    : bufferSize_(bufferSize) {
    buffers_.reserve(poolSize);
    for (size_t i = 0; i < poolSize; ++i) {
        buffers_.push_back({std::vector<float>(bufferSize), false});
    }
}

float* AudioBufferPool::acquire() {
    std::lock_guard<std::mutex> lock(mutex_);
    for (auto& buffer : buffers_) {
        if (!buffer.inUse) {
            buffer.inUse = true;
            return buffer.data.data();
        }
    }
    return nullptr; // Tous les buffers sont utilisés
}

void AudioBufferPool::release(float* ptr) {
    if (!ptr) return;
    std::lock_guard<std::mutex> lock(mutex_);
    for (auto& buffer : buffers_) {
        if (buffer.data.data() == ptr) {
            buffer.inUse = false;
            return;
        }
    }
}

size_t AudioBufferPool::availableBuffers() const {
    std::lock_guard<std::mutex> lock(mutex_);
    size_t count = 0;
    for (const auto& buffer : buffers_) {
        if (!buffer.inUse) count++;
    }
    return count;
}

// ============================================================================
// Fonctions libres (compatibilité)
// ============================================================================

// Convertisseur int16 vers float - version portable
void convertInt16ToFloat(const int16_t* input, float* output, size_t count) {
    const float scale = Constants::INT16_TO_FLOAT_SCALE;

    for (size_t i = 0; i < count; ++i) {
        output[i] = static_cast<float>(input[i]) * scale;
    }
}

// Calculateur RMS - version portable
float calculateRMS(const float* data, size_t count) {
    if (count == 0) return Constants::RMS_ZERO_RETURN_VALUE;

    double sum = Constants::SUM_ACCUMULATOR_INITIAL_VALUE;
    for (size_t i = 0; i < count; ++i) {
        sum += static_cast<double>(data[i]) * static_cast<double>(data[i]);
    }

    return static_cast<float>(std::sqrt(sum / count));
}

// Compteur d'échantillons clippés - version portable
size_t countClippedSamples(const float* data, size_t count, float threshold) {
    size_t clipped = 0;
    for (size_t i = 0; i < count; ++i) {
        if (std::abs(data[i]) >= threshold) {
            ++clipped;
        }
    }
    return clipped;
}

// Fonction pour mélanger des canaux stéréo
void mixStereoToMono(const float* left, const float* right, float* output, size_t count) {
    for (size_t i = 0; i < count; ++i) {
        output[i] = (left[i] + right[i]) * Constants::STEREO_TO_MONO_MIX_FACTOR;
    }
}

// Appliquer un gain avec protection contre le clipping
void applyGain(const float* input, float* output, size_t count, float gain) {
    for (size_t i = 0; i < count; ++i) {
        output[i] = std::max(Constants::CLIPPING_THRESHOLD_MIN,
                           std::min(Constants::CLIPPING_THRESHOLD_MAX, input[i] * gain));
    }
}

} // namespace Audio
} // namespace Nyth
