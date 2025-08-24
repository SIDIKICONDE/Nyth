#pragma once

#include <algorithm>
#include <atomic>
#include <chrono>
#include <cmath>
#include <cstddef>
#include <cstdint>
#include <mutex>
#include <vector>

namespace Nyth {
namespace Audio {

// === Conversion entre formats audio ===

class AudioFormatConverter {
public:
    // Conversion int16 <-> float
    static void int16ToFloat(const int16_t* input, float* output, size_t sampleCount);
    static void floatToInt16(const float* input, int16_t* output, size_t sampleCount);
    
    // Conversion int32 <-> float
    static void int32ToFloat(const int32_t* input, float* output, size_t sampleCount);
    static void floatToInt32(const float* input, int32_t* output, size_t sampleCount);
    
    // Conversion entre taux d'échantillonnage (resampling simple)
    static void resample(const float* input, size_t inputSamples, int inputRate,
                        float* output, size_t outputSamples, int outputRate);
    
    // Conversion mono <-> stereo
    static void monoToStereo(const float* mono, float* stereo, size_t frameCount);
    static void stereoToMono(const float* stereo, float* mono, size_t frameCount);
    
    // Interleaving/deinterleaving pour multi-canal
    static void interleave(const float** channels, float* interleaved, 
                          size_t channelCount, size_t frameCount);
    static void deinterleave(const float* interleaved, float** channels,
                            size_t channelCount, size_t frameCount);
};

// === Buffer circulaire thread-safe ===

template<typename T>
class CircularBuffer {
private:
    std::vector<T> buffer_;
    size_t capacity_;
    size_t writePos_ = 0;
    size_t readPos_ = 0;
    std::atomic<size_t> size_{0};
    mutable std::mutex mutex_;
    
public:
    explicit CircularBuffer(size_t capacity) 
        : buffer_(capacity), capacity_(capacity) {}
    
    // Écriture dans le buffer
    size_t write(const T* data, size_t count) {
        std::lock_guard<std::mutex> lock(mutex_);
        
        size_t available = capacity_ - size_;
        size_t toWrite = std::min(count, available);
        
        for (size_t i = 0; i < toWrite; ++i) {
            buffer_[writePos_] = data[i];
            writePos_ = (writePos_ + 1) % capacity_;
        }
        
        size_ += toWrite;
        return toWrite;
    }
    
    // Lecture depuis le buffer
    size_t read(T* data, size_t count) {
        std::lock_guard<std::mutex> lock(mutex_);
        
        size_t available = size_.load();
        size_t toRead = std::min(count, available);
        
        for (size_t i = 0; i < toRead; ++i) {
            data[i] = buffer_[readPos_];
            readPos_ = (readPos_ + 1) % capacity_;
        }
        
        size_ -= toRead;
        return toRead;
    }
    
    // Peek sans consommer
    size_t peek(T* data, size_t count) const {
        std::lock_guard<std::mutex> lock(mutex_);
        
        size_t available = size_.load();
        size_t toPeek = std::min(count, available);
        
        size_t peekPos = readPos_;
        for (size_t i = 0; i < toPeek; ++i) {
            data[i] = buffer_[peekPos];
            peekPos = (peekPos + 1) % capacity_;
        }
        
        return toPeek;
    }
    
    // Skip des échantillons
    size_t skip(size_t count) {
        std::lock_guard<std::mutex> lock(mutex_);
        
        size_t available = size_.load();
        size_t toSkip = std::min(count, available);
        
        readPos_ = (readPos_ + toSkip) % capacity_;
        size_ -= toSkip;
        
        return toSkip;
    }
    
    // Utilitaires
    size_t available() const { return size_.load(); }
    size_t capacity() const { return capacity_; }
    bool empty() const { return size_ == 0; }
    bool full() const { return size_ == capacity_; }
    
    void clear() {
        std::lock_guard<std::mutex> lock(mutex_);
        writePos_ = 0;
        readPos_ = 0;
        size_ = 0;
    }
    
    void resize(size_t newCapacity) {
        std::lock_guard<std::mutex> lock(mutex_);
        buffer_.resize(newCapacity);
        capacity_ = newCapacity;
        clear();
    }
};

// === Analyse audio ===

class AudioAnalyzer {
public:
    // Calcul du niveau RMS
    static float calculateRMS(const float* data, size_t sampleCount);
    static float calculateRMSdB(const float* data, size_t sampleCount);
    
    // Calcul du niveau de crête
    static float calculatePeak(const float* data, size_t sampleCount);
    static float calculatePeakdB(const float* data, size_t sampleCount);
    
    // Détection de silence
    static bool isSilent(const float* data, size_t sampleCount, float threshold = 0.001f);
    
    // Calcul de l'énergie
    static float calculateEnergy(const float* data, size_t sampleCount);
    
    // Détection de clipping
    static bool hasClipping(const float* data, size_t sampleCount, float threshold = 0.99f);
    static size_t countClippedSamples(const float* data, size_t sampleCount, float threshold = 0.99f);
    
    // Normalisation
    static void normalize(float* data, size_t sampleCount, float targetPeak = 0.95f);
    static void normalizeRMS(float* data, size_t sampleCount, float targetRMS = 0.5f);
};

// === Utilitaires de timing ===

class AudioTimer {
private:
    std::chrono::steady_clock::time_point startTime_;
    std::chrono::steady_clock::time_point lastTime_;
    std::atomic<bool> running_{false};
    
public:
    void start() {
        startTime_ = std::chrono::steady_clock::now();
        lastTime_ = startTime_;
        running_ = true;
    }
    
    void stop() {
        running_ = false;
    }
    
    bool isRunning() const {
        return running_.load();
    }
    
    // Temps écoulé depuis le début en millisecondes
    int64_t elapsedMs() const {
        if (!running_) return 0;
        auto now = std::chrono::steady_clock::now();
        return std::chrono::duration_cast<std::chrono::milliseconds>(now - startTime_).count();
    }
    
    // Temps depuis la dernière mesure
    int64_t deltaMs() {
        if (!running_) return 0;
        auto now = std::chrono::steady_clock::now();
        auto delta = std::chrono::duration_cast<std::chrono::milliseconds>(now - lastTime_).count();
        lastTime_ = now;
        return delta;
    }
    
    // Conversion frames <-> temps
    static int64_t framesToMs(size_t frames, int sampleRate) {
        return (frames * 1000) / sampleRate;
    }
    
    static size_t msToFrames(int64_t ms, int sampleRate) {
        return (ms * sampleRate) / 1000;
    }
};

// === Gestion de la mémoire audio ===

class AudioBufferPool {
private:
    struct Buffer {
        std::vector<float> data;
        bool inUse = false;
    };
    
    std::vector<Buffer> buffers_;
    size_t bufferSize_;
    mutable std::mutex mutex_;
    
public:
    AudioBufferPool(size_t bufferSize, size_t poolSize) 
        : bufferSize_(bufferSize) {
        buffers_.reserve(poolSize);
        for (size_t i = 0; i < poolSize; ++i) {
            buffers_.push_back({std::vector<float>(bufferSize), false});
        }
    }
    
    float* acquire() {
        std::lock_guard<std::mutex> lock(mutex_);
        for (auto& buffer : buffers_) {
            if (!buffer.inUse) {
                buffer.inUse = true;
                return buffer.data.data();
            }
        }
        return nullptr; // Tous les buffers sont utilisés
    }
    
    void release(float* ptr) {
        if (!ptr) return;
        std::lock_guard<std::mutex> lock(mutex_);
        for (auto& buffer : buffers_) {
            if (buffer.data.data() == ptr) {
                buffer.inUse = false;
                return;
            }
        }
    }
    
    size_t availableBuffers() const {
        std::lock_guard<std::mutex> lock(mutex_);
        size_t count = 0;
        for (const auto& buffer : buffers_) {
            if (!buffer.inUse) count++;
        }
        return count;
    }
};

// === Implémentation inline des méthodes ===

inline void AudioFormatConverter::int16ToFloat(const int16_t* input, float* output, size_t sampleCount) {
    const float scale = 1.0f / 32768.0f;
    for (size_t i = 0; i < sampleCount; ++i) {
        output[i] = input[i] * scale;
    }
}

inline void AudioFormatConverter::floatToInt16(const float* input, int16_t* output, size_t sampleCount) {
    const float scale = 32767.0f;
    for (size_t i = 0; i < sampleCount; ++i) {
        float sample = input[i] * scale;
        sample = std::max(-32768.0f, std::min(32767.0f, sample));
        output[i] = static_cast<int16_t>(sample);
    }
}

inline void AudioFormatConverter::int32ToFloat(const int32_t* input, float* output, size_t sampleCount) {
    const float scale = 1.0f / 2147483648.0f;
    for (size_t i = 0; i < sampleCount; ++i) {
        output[i] = input[i] * scale;
    }
}

inline void AudioFormatConverter::floatToInt32(const float* input, int32_t* output, size_t sampleCount) {
    const float scale = 2147483647.0f;
    for (size_t i = 0; i < sampleCount; ++i) {
        float sample = input[i] * scale;
        sample = std::max(-2147483648.0f, std::min(2147483647.0f, sample));
        output[i] = static_cast<int32_t>(sample);
    }
}

inline void AudioFormatConverter::monoToStereo(const float* mono, float* stereo, size_t frameCount) {
    for (size_t i = 0; i < frameCount; ++i) {
        stereo[i * 2] = mono[i];
        stereo[i * 2 + 1] = mono[i];
    }
}

inline void AudioFormatConverter::stereoToMono(const float* stereo, float* mono, size_t frameCount) {
    for (size_t i = 0; i < frameCount; ++i) {
        mono[i] = (stereo[i * 2] + stereo[i * 2 + 1]) * 0.5f;
    }
}

inline float AudioAnalyzer::calculateRMS(const float* data, size_t sampleCount) {
    if (!data || sampleCount == 0) return 0.0f;
    
    float sum = 0.0f;
    for (size_t i = 0; i < sampleCount; ++i) {
        sum += data[i] * data[i];
    }
    return std::sqrt(sum / sampleCount);
}

inline float AudioAnalyzer::calculateRMSdB(const float* data, size_t sampleCount) {
    float rms = calculateRMS(data, sampleCount);
    if (rms <= 0.0f) return -100.0f;
    return 20.0f * std::log10(rms);
}

inline float AudioAnalyzer::calculatePeak(const float* data, size_t sampleCount) {
    if (!data || sampleCount == 0) return 0.0f;
    
    float peak = 0.0f;
    for (size_t i = 0; i < sampleCount; ++i) {
        peak = std::max(peak, std::abs(data[i]));
    }
    return peak;
}

inline float AudioAnalyzer::calculatePeakdB(const float* data, size_t sampleCount) {
    float peak = calculatePeak(data, sampleCount);
    if (peak <= 0.0f) return -100.0f;
    return 20.0f * std::log10(peak);
}

inline bool AudioAnalyzer::isSilent(const float* data, size_t sampleCount, float threshold) {
    return calculatePeak(data, sampleCount) < threshold;
}

inline float AudioAnalyzer::calculateEnergy(const float* data, size_t sampleCount) {
    if (!data || sampleCount == 0) return 0.0f;
    
    float energy = 0.0f;
    for (size_t i = 0; i < sampleCount; ++i) {
        energy += data[i] * data[i];
    }
    return energy;
}

inline bool AudioAnalyzer::hasClipping(const float* data, size_t sampleCount, float threshold) {
    for (size_t i = 0; i < sampleCount; ++i) {
        if (std::abs(data[i]) >= threshold) {
            return true;
        }
    }
    return false;
}

inline size_t AudioAnalyzer::countClippedSamples(const float* data, size_t sampleCount, float threshold) {
    size_t count = 0;
    for (size_t i = 0; i < sampleCount; ++i) {
        if (std::abs(data[i]) >= threshold) {
            count++;
        }
    }
    return count;
}

inline void AudioAnalyzer::normalize(float* data, size_t sampleCount, float targetPeak) {
    float currentPeak = calculatePeak(data, sampleCount);
    if (currentPeak <= 0.0f) return;
    
    float scale = targetPeak / currentPeak;
    for (size_t i = 0; i < sampleCount; ++i) {
        data[i] *= scale;
    }
}

inline void AudioAnalyzer::normalizeRMS(float* data, size_t sampleCount, float targetRMS) {
    float currentRMS = calculateRMS(data, sampleCount);
    if (currentRMS <= 0.0f) return;
    
    float scale = targetRMS / currentRMS;
    for (size_t i = 0; i < sampleCount; ++i) {
        data[i] *= scale;
    }
}

} // namespace Audio
} // namespace Nyth