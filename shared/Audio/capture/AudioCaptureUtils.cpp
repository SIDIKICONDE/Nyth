#include "AudioCaptureUtils.hpp"
#include <cmath>
#include <algorithm>
#include <cstring>
#include <limits>

namespace Audio {
namespace capture {

// ============================================================================
// AudioFormatConverter Implementation
// ============================================================================

void AudioFormatConverter::int16ToFloat(const int16_t* input, float* output, size_t sampleCount) {
    if (!input || !output || sampleCount == 0) return;
    
    const float scale = 1.0f / 32768.0f;
    for (size_t i = 0; i < sampleCount; ++i) {
        output[i] = input[i] * scale;
    }
}

void AudioFormatConverter::floatToInt16(const float* input, int16_t* output, size_t sampleCount) {
    if (!input || !output || sampleCount == 0) return;
    
    const float scale = 32767.0f;
    for (size_t i = 0; i < sampleCount; ++i) {
        float sample = input[i] * scale;
        // Clamp to int16 range
        sample = std::max(-32768.0f, std::min(32767.0f, sample));
        output[i] = static_cast<int16_t>(sample);
    }
}

void AudioFormatConverter::int32ToFloat(const int32_t* input, float* output, size_t sampleCount) {
    if (!input || !output || sampleCount == 0) return;
    
    const float scale = 1.0f / 2147483648.0f;
    for (size_t i = 0; i < sampleCount; ++i) {
        output[i] = input[i] * scale;
    }
}

void AudioFormatConverter::floatToInt32(const float* input, int32_t* output, size_t sampleCount) {
    if (!input || !output || sampleCount == 0) return;
    
    const float scale = 2147483647.0f;
    for (size_t i = 0; i < sampleCount; ++i) {
        float sample = input[i] * scale;
        // Clamp to int32 range
        sample = std::max(-2147483648.0f, std::min(2147483647.0f, sample));
        output[i] = static_cast<int32_t>(sample);
    }
}

void AudioFormatConverter::monoToStereo(const float* mono, float* stereo, size_t frameCount) {
    if (!mono || !stereo || frameCount == 0) return;
    
    for (size_t i = 0; i < frameCount; ++i) {
        stereo[i * 2] = mono[i];
        stereo[i * 2 + 1] = mono[i];
    }
}

void AudioFormatConverter::stereoToMono(const float* stereo, float* mono, size_t frameCount) {
    if (!stereo || !mono || frameCount == 0) return;
    
    for (size_t i = 0; i < frameCount; ++i) {
        mono[i] = (stereo[i * 2] + stereo[i * 2 + 1]) * 0.5f;
    }
}

void AudioFormatConverter::interleaveChannels(const float** channels, float* interleaved, 
                                              size_t channelCount, size_t frameCount) {
    if (!channels || !interleaved || channelCount == 0 || frameCount == 0) return;
    
    for (size_t frame = 0; frame < frameCount; ++frame) {
        for (size_t ch = 0; ch < channelCount; ++ch) {
            interleaved[frame * channelCount + ch] = channels[ch][frame];
        }
    }
}

void AudioFormatConverter::deinterleaveChannels(const float* interleaved, float** channels,
                                                size_t channelCount, size_t frameCount) {
    if (!interleaved || !channels || channelCount == 0 || frameCount == 0) return;
    
    for (size_t frame = 0; frame < frameCount; ++frame) {
        for (size_t ch = 0; ch < channelCount; ++ch) {
            channels[ch][frame] = interleaved[frame * channelCount + ch];
        }
    }
}

bool AudioFormatConverter::resample(const float* input, size_t inputFrames, int inputRate,
                                   float* output, size_t& outputFrames, int outputRate) {
    if (!input || !output || inputFrames == 0 || inputRate <= 0 || outputRate <= 0) {
        return false;
    }
    
    // Simple linear interpolation resampling
    float ratio = static_cast<float>(inputRate) / static_cast<float>(outputRate);
    size_t maxOutputFrames = outputFrames;
    outputFrames = static_cast<size_t>(inputFrames / ratio);
    
    if (outputFrames > maxOutputFrames) {
        outputFrames = maxOutputFrames;
    }
    
    for (size_t i = 0; i < outputFrames; ++i) {
        float srcIndex = i * ratio;
        size_t srcIndexInt = static_cast<size_t>(srcIndex);
        float fraction = srcIndex - srcIndexInt;
        
        if (srcIndexInt < inputFrames - 1) {
            // Linear interpolation between two samples
            output[i] = input[srcIndexInt] * (1.0f - fraction) + 
                       input[srcIndexInt + 1] * fraction;
        } else {
            // Use last sample
            output[i] = input[inputFrames - 1];
        }
    }
    
    return true;
}

// ============================================================================
// AudioAnalyzer Implementation
// ============================================================================

float AudioAnalyzer::calculateRMS(const float* data, size_t sampleCount) {
    if (!data || sampleCount == 0) return 0.0f;
    
    float sum = 0.0f;
    for (size_t i = 0; i < sampleCount; ++i) {
        sum += data[i] * data[i];
    }
    
    return std::sqrt(sum / sampleCount);
}

float AudioAnalyzer::calculateRMSdB(const float* data, size_t sampleCount) {
    float rms = calculateRMS(data, sampleCount);
    if (rms <= 0.0f) return -std::numeric_limits<float>::infinity();
    
    return 20.0f * std::log10(rms);
}

float AudioAnalyzer::calculatePeak(const float* data, size_t sampleCount) {
    if (!data || sampleCount == 0) return 0.0f;
    
    float peak = 0.0f;
    for (size_t i = 0; i < sampleCount; ++i) {
        float absValue = std::abs(data[i]);
        if (absValue > peak) {
            peak = absValue;
        }
    }
    
    return peak;
}

float AudioAnalyzer::calculatePeakdB(const float* data, size_t sampleCount) {
    float peak = calculatePeak(data, sampleCount);
    if (peak <= 0.0f) return -std::numeric_limits<float>::infinity();
    
    return 20.0f * std::log10(peak);
}

bool AudioAnalyzer::isSilent(const float* data, size_t sampleCount, float threshold) {
    if (!data || sampleCount == 0) return true;
    
    for (size_t i = 0; i < sampleCount; ++i) {
        if (std::abs(data[i]) > threshold) {
            return false;
        }
    }
    
    return true;
}

bool AudioAnalyzer::hasClipping(const float* data, size_t sampleCount, float threshold) {
    if (!data || sampleCount == 0) return false;
    
    for (size_t i = 0; i < sampleCount; ++i) {
        if (std::abs(data[i]) >= threshold) {
            return true;
        }
    }
    
    return false;
}

void AudioAnalyzer::normalize(float* data, size_t sampleCount, float targetPeak) {
    if (!data || sampleCount == 0 || targetPeak <= 0.0f) return;
    
    float currentPeak = calculatePeak(data, sampleCount);
    if (currentPeak <= 0.0f) return;
    
    float scale = targetPeak / currentPeak;
    for (size_t i = 0; i < sampleCount; ++i) {
        data[i] *= scale;
    }
}

void AudioAnalyzer::applyGain(float* data, size_t sampleCount, float gainDb) {
    if (!data || sampleCount == 0) return;
    
    float gainLinear = std::pow(10.0f, gainDb / 20.0f);
    for (size_t i = 0; i < sampleCount; ++i) {
        data[i] *= gainLinear;
    }
}

float AudioAnalyzer::calculateZeroCrossingRate(const float* data, size_t sampleCount) {
    if (!data || sampleCount < 2) return 0.0f;
    
    size_t crossings = 0;
    for (size_t i = 1; i < sampleCount; ++i) {
        if ((data[i-1] >= 0 && data[i] < 0) || (data[i-1] < 0 && data[i] >= 0)) {
            crossings++;
        }
    }
    
    return static_cast<float>(crossings) / static_cast<float>(sampleCount - 1);
}

float AudioAnalyzer::calculateEnergy(const float* data, size_t sampleCount) {
    if (!data || sampleCount == 0) return 0.0f;
    
    float energy = 0.0f;
    for (size_t i = 0; i < sampleCount; ++i) {
        energy += data[i] * data[i];
    }
    
    return energy;
}

// ============================================================================
// AudioBufferPool Implementation
// ============================================================================

AudioBufferPool::AudioBufferPool(size_t bufferSize, size_t poolSize)
    : bufferSize_(bufferSize), poolSize_(poolSize) {
    
    // Pre-allocate buffers
    for (size_t i = 0; i < poolSize; ++i) {
        freeBuffers_.push(std::make_unique<std::vector<float>>(bufferSize));
    }
}

AudioBufferPool::~AudioBufferPool() {
    // Destructor will automatically clean up unique_ptrs
}

std::unique_ptr<std::vector<float>> AudioBufferPool::acquire() {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (!freeBuffers_.empty()) {
        auto buffer = std::move(freeBuffers_.front());
        freeBuffers_.pop();
        return buffer;
    }
    
    // If no free buffers, create a new one
    return std::make_unique<std::vector<float>>(bufferSize_);
}

void AudioBufferPool::release(std::unique_ptr<std::vector<float>> buffer) {
    if (!buffer || buffer->size() != bufferSize_) return;
    
    std::lock_guard<std::mutex> lock(mutex_);
    
    // Only keep buffers up to pool size
    if (freeBuffers_.size() < poolSize_) {
        // Clear the buffer before returning to pool
        std::fill(buffer->begin(), buffer->end(), 0.0f);
        freeBuffers_.push(std::move(buffer));
    }
}

size_t AudioBufferPool::availableBuffers() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return freeBuffers_.size();
}

void AudioBufferPool::resize(size_t newPoolSize) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (newPoolSize > poolSize_) {
        // Add more buffers
        size_t toAdd = newPoolSize - poolSize_;
        for (size_t i = 0; i < toAdd; ++i) {
            freeBuffers_.push(std::make_unique<std::vector<float>>(bufferSize_));
        }
    } else if (newPoolSize < poolSize_) {
        // Remove excess buffers
        while (freeBuffers_.size() > newPoolSize) {
            freeBuffers_.pop();
        }
    }
    
    poolSize_ = newPoolSize;
}

// ============================================================================
// AudioRingBuffer Implementation
// ============================================================================

AudioRingBuffer::AudioRingBuffer(size_t capacity)
    : buffer_(capacity), capacity_(capacity), writePos_(0), readPos_(0) {
}

AudioRingBuffer::~AudioRingBuffer() {
    // Destructor
}

size_t AudioRingBuffer::write(const float* data, size_t count) {
    if (!data || count == 0) return 0;
    
    std::lock_guard<std::mutex> lock(mutex_);
    
    size_t available = availableWrite();
    size_t toWrite = std::min(count, available);
    
    for (size_t i = 0; i < toWrite; ++i) {
        buffer_[writePos_] = data[i];
        writePos_ = (writePos_ + 1) % capacity_;
    }
    
    return toWrite;
}

size_t AudioRingBuffer::read(float* data, size_t count) {
    if (!data || count == 0) return 0;
    
    std::lock_guard<std::mutex> lock(mutex_);
    
    size_t available = availableRead();
    size_t toRead = std::min(count, available);
    
    for (size_t i = 0; i < toRead; ++i) {
        data[i] = buffer_[readPos_];
        readPos_ = (readPos_ + 1) % capacity_;
    }
    
    return toRead;
}

size_t AudioRingBuffer::peek(float* data, size_t count) const {
    if (!data || count == 0) return 0;
    
    std::lock_guard<std::mutex> lock(mutex_);
    
    size_t available = availableRead();
    size_t toPeek = std::min(count, available);
    
    size_t tempReadPos = readPos_;
    for (size_t i = 0; i < toPeek; ++i) {
        data[i] = buffer_[tempReadPos];
        tempReadPos = (tempReadPos + 1) % capacity_;
    }
    
    return toPeek;
}

void AudioRingBuffer::clear() {
    std::lock_guard<std::mutex> lock(mutex_);
    readPos_ = writePos_ = 0;
    std::fill(buffer_.begin(), buffer_.end(), 0.0f);
}

size_t AudioRingBuffer::availableRead() const {
    if (writePos_ >= readPos_) {
        return writePos_ - readPos_;
    } else {
        return capacity_ - readPos_ + writePos_;
    }
}

size_t AudioRingBuffer::availableWrite() const {
    return capacity_ - availableRead() - 1;  // -1 to distinguish full from empty
}

bool AudioRingBuffer::empty() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return readPos_ == writePos_;
}

bool AudioRingBuffer::full() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return ((writePos_ + 1) % capacity_) == readPos_;
}

// ============================================================================
// AudioDelayLine Implementation
// ============================================================================

AudioDelayLine::AudioDelayLine(size_t maxDelaySamples)
    : buffer_(maxDelaySamples), maxDelay_(maxDelaySamples), 
      currentDelay_(0), writePos_(0) {
    std::fill(buffer_.begin(), buffer_.end(), 0.0f);
}

AudioDelayLine::~AudioDelayLine() {
    // Destructor
}

void AudioDelayLine::setDelay(size_t delaySamples) {
    if (delaySamples <= maxDelay_) {
        currentDelay_ = delaySamples;
    }
}

float AudioDelayLine::process(float input) {
    // Write input to buffer
    buffer_[writePos_] = input;
    
    // Calculate read position
    int readPos = static_cast<int>(writePos_) - static_cast<int>(currentDelay_);
    if (readPos < 0) {
        readPos += static_cast<int>(maxDelay_);
    }
    
    // Read delayed sample
    float output = buffer_[readPos];
    
    // Advance write position
    writePos_ = (writePos_ + 1) % maxDelay_;
    
    return output;
}

void AudioDelayLine::process(const float* input, float* output, size_t count) {
    if (!input || !output || count == 0) return;
    
    for (size_t i = 0; i < count; ++i) {
        output[i] = process(input[i]);
    }
}

void AudioDelayLine::clear() {
    std::fill(buffer_.begin(), buffer_.end(), 0.0f);
    writePos_ = 0;
}

// ============================================================================
// AudioFilter Implementation
// ============================================================================

AudioFilter::AudioFilter() {
    reset();
}

AudioFilter::~AudioFilter() {
    // Destructor
}

void AudioFilter::setLowpass(float frequency, float sampleRate, float q) {
    float omega = 2.0f * M_PI * frequency / sampleRate;
    float sin_omega = std::sin(omega);
    float cos_omega = std::cos(omega);
    float alpha = sin_omega / (2.0f * q);
    
    float b0 = (1.0f - cos_omega) / 2.0f;
    float b1 = 1.0f - cos_omega;
    float b2 = (1.0f - cos_omega) / 2.0f;
    float a0 = 1.0f + alpha;
    float a1 = -2.0f * cos_omega;
    float a2 = 1.0f - alpha;
    
    // Normalize coefficients
    b0_ = b0 / a0;
    b1_ = b1 / a0;
    b2_ = b2 / a0;
    a1_ = a1 / a0;
    a2_ = a2 / a0;
}

void AudioFilter::setHighpass(float frequency, float sampleRate, float q) {
    float omega = 2.0f * M_PI * frequency / sampleRate;
    float sin_omega = std::sin(omega);
    float cos_omega = std::cos(omega);
    float alpha = sin_omega / (2.0f * q);
    
    float b0 = (1.0f + cos_omega) / 2.0f;
    float b1 = -(1.0f + cos_omega);
    float b2 = (1.0f + cos_omega) / 2.0f;
    float a0 = 1.0f + alpha;
    float a1 = -2.0f * cos_omega;
    float a2 = 1.0f - alpha;
    
    // Normalize coefficients
    b0_ = b0 / a0;
    b1_ = b1 / a0;
    b2_ = b2 / a0;
    a1_ = a1 / a0;
    a2_ = a2 / a0;
}

void AudioFilter::setBandpass(float frequency, float sampleRate, float q) {
    float omega = 2.0f * M_PI * frequency / sampleRate;
    float sin_omega = std::sin(omega);
    float cos_omega = std::cos(omega);
    float alpha = sin_omega / (2.0f * q);
    
    float b0 = alpha;
    float b1 = 0.0f;
    float b2 = -alpha;
    float a0 = 1.0f + alpha;
    float a1 = -2.0f * cos_omega;
    float a2 = 1.0f - alpha;
    
    // Normalize coefficients
    b0_ = b0 / a0;
    b1_ = b1 / a0;
    b2_ = b2 / a0;
    a1_ = a1 / a0;
    a2_ = a2 / a0;
}

float AudioFilter::process(float input) {
    float output = b0_ * input + b1_ * x1_ + b2_ * x2_ - a1_ * y1_ - a2_ * y2_;
    
    // Update state
    x2_ = x1_;
    x1_ = input;
    y2_ = y1_;
    y1_ = output;
    
    return output;
}

void AudioFilter::process(const float* input, float* output, size_t count) {
    if (!input || !output || count == 0) return;
    
    for (size_t i = 0; i < count; ++i) {
        output[i] = process(input[i]);
    }
}

void AudioFilter::reset() {
    x1_ = x2_ = y1_ = y2_ = 0.0f;
    b0_ = 1.0f;
    b1_ = b2_ = a1_ = a2_ = 0.0f;
}

} // namespace capture
} // namespace Audio