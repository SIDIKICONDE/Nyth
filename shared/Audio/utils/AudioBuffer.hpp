#pragma once

#ifdef __cplusplus
// C++20 standard headers
#include <cstddef>
#include <memory>
#include <vector>
#include <span>
#include <concepts>
#include <type_traits>
#include <algorithm>
#include <numeric>
#include <format>
#include <source_location>
#include <ranges>
#include <stdexcept>
#include "Constants.hpp"

namespace AudioEqualizer {

// C++20 Concepts for better type safety
template<typename T>
concept AudioSampleType = std::floating_point<T>;

template<typename T>
concept BufferOperation = requires(T op, std::span<const float> buffer) {
    { op(buffer) } -> std::same_as<void>;
};

// C++20 consteval utilities
consteval size_t compute_max_channels() { return MAX_CHANNELS; }
consteval size_t compute_max_samples() { return MAX_SAMPLES; }

class AudioBuffer {
public:
    AudioBuffer(size_t numChannels, size_t numSamples);
    ~AudioBuffer();

    // C++20 modernized constructors and operators
    AudioBuffer(const AudioBuffer& other) = delete;  // Prevent accidental copies
    AudioBuffer& operator=(const AudioBuffer& other) = delete;
    AudioBuffer(AudioBuffer&& other) noexcept;
    AudioBuffer& operator=(AudioBuffer&& other) noexcept;

    // Get buffer data
    float* getChannel(size_t channel);
    const float* getChannel(size_t channel) const;
    
    // Get write pointer
    float** getArrayOfWritePointers();
    const float* const* getArrayOfReadPointers() const;
    
    // Buffer info
    size_t getNumChannels() const { return m_numChannels; }
    size_t getNumSamples() const { return m_numSamples; }
    
    // Clear buffer
    void clear();
    void clear(size_t channel);
    void clear(size_t startSample, size_t numSamples);
    
    // Copy operations
    void copyFrom(const AudioBuffer& source);
    void copyFrom(size_t destChannel, const float* source, size_t numSamples);
    void copyFrom(size_t destChannel, size_t destStartSample,
                  const AudioBuffer& source, size_t sourceChannel,
                  size_t sourceStartSample, size_t numSamples);
    
    // Add operations (for mixing)
    void addFrom(size_t destChannel, const float* source, size_t numSamples, float gain = 1.0f);
    void addFrom(const AudioBuffer& source, float gain = 1.0f);
    
    // Apply gain
    void applyGain(float gain);
    void applyGain(size_t channel, float gain);
    void applyGain(size_t channel, size_t startSample, size_t numSamples, float gain);
    
    // Apply gain ramp (for smooth parameter changes)
    void applyGainRamp(size_t channel, size_t startSample, size_t numSamples,
                       float startGain, float endGain);
    
    // Get magnitude
    float getMagnitude(size_t channel, size_t startSample, size_t numSamples) const;
    float getRMSLevel(size_t channel, size_t startSample, size_t numSamples) const;

    // C++20 modernized methods
    template<AudioSampleType T = float>
    std::span<T> getChannelSpan(size_t channel) {
        if (channel >= m_numChannels) {
            return std::span<T>();
        }
        return std::span<T>(reinterpret_cast<T*>(m_channels[channel]), m_numSamples);
    }

    template<AudioSampleType T = float>
    std::span<const T> getChannelSpan(size_t channel) const {
        if (channel >= m_numChannels) {
            return std::span<const T>();
        }
        return std::span<const T>(reinterpret_cast<const T*>(m_channels[channel]), m_numSamples);
    }

    // C++20 range-based operations
    template<AudioSampleType T = float>
    void applyOperation(BufferOperation auto&& operation) {
        for (size_t ch = 0; ch < m_numChannels; ++ch) {
            auto channelSpan = getChannelSpan<T>(ch);
            operation(channelSpan);
        }
    }

    // C++20 enhanced copy operations
    template<AudioSampleType T = float>
    void copyFromSpan(size_t destChannel, std::span<const T> source,
                     std::source_location location = std::source_location::current()) {
        if (destChannel >= m_numChannels) {
            throw std::out_of_range(std::format("Channel {} out of range [0, {}) [{}:{}]",
                destChannel, m_numChannels, location.file_name(), location.line()));
        }

        if (source.size() > m_numSamples) {
            throw std::invalid_argument(std::format("Source span too large: {} > {} [{}:{}]",
                source.size(), m_numSamples, location.file_name(), location.line()));
        }

        auto destSpan = getChannelSpan<T>(destChannel);
        std::ranges::copy(source, destSpan.begin());
    }

    // C++20 validation
    bool validateBuffer(std::source_location location = std::source_location::current()) const;
    std::string getDebugInfo(std::source_location location = std::source_location::current()) const;

    // C++20 range access
    auto getChannels() const {
        return std::ranges::views::iota(size_t(0), m_numChannels) |
               std::ranges::views::transform([this](size_t ch) { return getChannelSpan(ch); });
    }

private:
    size_t m_numChannels;
    size_t m_numSamples;
    std::unique_ptr<float[]> m_data;
    std::unique_ptr<float*[]> m_channels;
    
    // Allocate aligned memory for SIMD operations
    void allocateData();
    void allocateChannels();
    
    // Helper to ensure alignment
    static size_t getAlignedSize(size_t size);
};

// Inline implementations for performance
inline float* AudioBuffer::getChannel(size_t channel) {
    return (channel < m_numChannels) ? m_channels[channel] : nullptr;
}

inline const float* AudioBuffer::getChannel(size_t channel) const {
    return (channel < m_numChannels) ? m_channels[channel] : nullptr;
}

} // namespace AudioEqualizer

#else
/* Ce header contient uniquement des déclarations C++.
   Aucune API C n'est exposée lorsqu'il est inclus dans un TU C/Obj-C. */
#endif