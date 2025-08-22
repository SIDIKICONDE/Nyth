// Inclure d'abord notre en-tête pour garantir la cohérence des dépendances
#include "AudioBuffer.hpp"

// En-têtes C++ standards
#include <algorithm>
#include <cmath>
#include <algorithm>
#include <iterator>

#ifdef __ARM_NEON
#include <arm_neon.h>
#endif

#ifdef __SSE2__
#include <emmintrin.h>
#endif

#include "utilsConstants.hpp"

namespace AudioUtils {

// Import des constantes pour éviter la répétition des namespace
using namespace UtilsConstants;

AudioBuffer::AudioBuffer(size_t numChannels, size_t numSamples)
    : m_numChannels(numChannels)
    , m_numSamples(numSamples) {
    allocateData();
    allocateChannels();
    clear();
}

AudioBuffer::~AudioBuffer() = default;

void AudioBuffer::allocateData() {
    size_t totalSamples = m_numChannels * getAlignedSize(m_numSamples);
    m_data = std::make_unique<float[]>(totalSamples);
}

void AudioBuffer::allocateChannels() {
    m_channels = std::make_unique<float*[]>(m_numChannels);
    size_t alignedSamples = getAlignedSize(m_numSamples);

    std::for_each(std::views::iota(size_t{ZERO_INDEX}, m_numChannels),
                         [this, alignedSamples](size_t ch) {
                             m_channels[ch] = m_data.get() + (ch * alignedSamples);
                         });
}

size_t AudioBuffer::getAlignedSize(size_t size) {
    // Align to 16-byte boundary for SIMD
    return (size + SIMD_ALIGNMENT_MASK) & SIMD_ALIGNMENT_INVERSE_MASK;  // Align to 4 floats (16 bytes)
}

float** AudioBuffer::getArrayOfWritePointers() {
    return m_channels.get();
}

const float* const* AudioBuffer::getArrayOfReadPointers() const {
    return const_cast<const float* const*>(m_channels.get());
}

void AudioBuffer::clear() {
    size_t totalSamples = m_numChannels * getAlignedSize(m_numSamples);
    std::fill_n(m_data.get(), totalSamples, ZERO_FLOAT);
}

void AudioBuffer::clear(size_t channel) {
    if (channel < m_numChannels) {
        std::fill_n(m_channels[channel], m_numSamples, ZERO_FLOAT);
    }
}

void AudioBuffer::clear(size_t startSample, size_t numSamples) {
    for (size_t ch = FIRST_CHANNEL; ch < m_numChannels; ++ch) {
        if (startSample + numSamples <= m_numSamples) {
            std::fill_n(m_channels[ch] + startSample, numSamples, ZERO_FLOAT);
        }
    }
}

void AudioBuffer::copyFrom(const AudioBuffer& source) {
    size_t channelsToCopy = std::min(m_numChannels, source.getNumChannels());
    size_t samplesToCopy = std::min(m_numSamples, source.getNumSamples());
    
    for (size_t ch = FIRST_CHANNEL; ch < channelsToCopy; ++ch) {
        std::copy_n(source.getChannel(ch), samplesToCopy, m_channels[ch]);
    }
}

void AudioBuffer::copyFrom(size_t destChannel, const float* source, size_t numSamples) {
    if (destChannel < m_numChannels && source != nullptr) {
        size_t samplesToCopy = std::min(numSamples, m_numSamples);
        std::copy_n(source, samplesToCopy, m_channels[destChannel]);
    }
}

void AudioBuffer::copyFrom(size_t destChannel, size_t destStartSample,
                          const AudioBuffer& source, size_t sourceChannel,
                          size_t sourceStartSample, size_t numSamples) {
    if (destChannel < m_numChannels && sourceChannel < source.getNumChannels()) {
        size_t maxDestSamples = (destStartSample < m_numSamples) ? 
                                m_numSamples - destStartSample : ZERO_SAMPLES;
        size_t maxSourceSamples = (sourceStartSample < source.getNumSamples()) ?
                                  source.getNumSamples() - sourceStartSample : ZERO_SAMPLES;
        size_t samplesToCopy = std::min({numSamples, maxDestSamples, maxSourceSamples});
        
        if (samplesToCopy > ZERO_SAMPLES) {
            std::copy_n(source.getChannel(sourceChannel) + sourceStartSample,
                        samplesToCopy,
                        m_channels[destChannel] + destStartSample);
        }
    }
}

void AudioBuffer::addFrom(size_t destChannel, const float* source, size_t numSamples, float gain) {
    if (destChannel >= m_numChannels || source == nullptr) return;
    
    float* dest = m_channels[destChannel];
    size_t samplesToProcess = std::min(numSamples, m_numSamples);
    
#ifdef __ARM_NEON
    // NEON optimized version
    size_t simdSamples = samplesToProcess & SIMD_MASK_FOR_BLOCK;
    float32x4_t gainVec = vdupq_n_f32(gain);
    
    for (size_t i = ZERO_INDEX; i < simdSamples; i += SIMD_BLOCK_SIZE) {
        float32x4_t srcVec = vld1q_f32(&source[i]);
        float32x4_t destVec = vld1q_f32(&dest[i]);
        destVec = vmlaq_f32(destVec, srcVec, gainVec);
        vst1q_f32(&dest[i], destVec);
    }
    
    // Process remaining samples
    for (size_t i = simdSamples; i < samplesToProcess; ++i) {
        dest[i] += source[i] * gain;
    }
#elif defined(__SSE2__)
    // SSE2 optimized version
    size_t simdSamples = samplesToProcess & SIMD_MASK_FOR_BLOCK;
    __m128 gainVec = _mm_set1_ps(gain);
    
    for (size_t i = ZERO_INDEX; i < simdSamples; i += SIMD_BLOCK_SIZE) {
        __m128 srcVec = _mm_loadu_ps(&source[i]);
        __m128 destVec = _mm_loadu_ps(&dest[i]);
        srcVec = _mm_mul_ps(srcVec, gainVec);
        destVec = _mm_add_ps(destVec, srcVec);
        _mm_storeu_ps(&dest[i], destVec);
    }
    
    // Process remaining samples
    for (size_t i = simdSamples; i < samplesToProcess; ++i) {
        dest[i] += source[i] * gain;
    }
#else
    // Scalar version
    if (gain == UNITY_GAIN) {
        for (size_t i = ZERO_INDEX; i < samplesToProcess; ++i) {
            dest[i] += source[i];
        }
    } else {
        for (size_t i = ZERO_INDEX; i < samplesToProcess; ++i) {
            dest[i] += source[i] * gain;
        }
    }
#endif
}

void AudioBuffer::addFrom(const AudioBuffer& source, float gain) {
    size_t channelsToAdd = std::min(m_numChannels, source.getNumChannels());
    
    for (size_t ch = FIRST_CHANNEL; ch < channelsToAdd; ++ch) {
        addFrom(ch, source.getChannel(ch), source.getNumSamples(), gain);
    }
}

void AudioBuffer::applyGain(float gain) {
    for (size_t ch = FIRST_CHANNEL; ch < m_numChannels; ++ch) {
        applyGain(ch, gain);
    }
}

void AudioBuffer::applyGain(size_t channel, float gain) {
    if (channel < m_numChannels) {
        applyGain(channel, FIRST_SAMPLE, m_numSamples, gain);
    }
}

void AudioBuffer::applyGain(size_t channel, size_t startSample, size_t numSamples, float gain) {
    if (channel >= m_numChannels) return;
    
    float* data = m_channels[channel] + startSample;
    size_t samplesToProcess = std::min(numSamples, m_numSamples - startSample);
    
#ifdef __ARM_NEON
    // NEON optimized version
    size_t simdSamples = samplesToProcess & SIMD_MASK_FOR_BLOCK;
    float32x4_t gainVec = vdupq_n_f32(gain);
    
    for (size_t i = ZERO_INDEX; i < simdSamples; i += SIMD_BLOCK_SIZE) {
        float32x4_t vec = vld1q_f32(&data[i]);
        vec = vmulq_f32(vec, gainVec);
        vst1q_f32(&data[i], vec);
    }
    
    // Process remaining samples
    for (size_t i = simdSamples; i < samplesToProcess; ++i) {
        data[i] *= gain;
    }
#elif defined(__SSE2__)
    // SSE2 optimized version
    size_t simdSamples = samplesToProcess & SIMD_MASK_FOR_BLOCK;
    __m128 gainVec = _mm_set1_ps(gain);
    
    for (size_t i = ZERO_INDEX; i < simdSamples; i += SIMD_BLOCK_SIZE) {
        __m128 vec = _mm_loadu_ps(&data[i]);
        vec = _mm_mul_ps(vec, gainVec);
        _mm_storeu_ps(&data[i], vec);
    }
    
    // Process remaining samples
    for (size_t i = simdSamples; i < samplesToProcess; ++i) {
        data[i] *= gain;
    }
#else
    // Scalar version
    for (size_t i = ZERO_INDEX; i < samplesToProcess; ++i) {
        data[i] *= gain;
    }
#endif
}

void AudioBuffer::applyGainRamp(size_t channel, size_t startSample, size_t numSamples,
                               float startGain, float endGain) {
    if (channel >= m_numChannels) return;
    
    float* data = m_channels[channel] + startSample;
    size_t samplesToProcess = std::min(numSamples, m_numSamples - startSample);
    
    if (samplesToProcess == ZERO_SAMPLES) return;
    
    float gainIncrement = (endGain - startGain) / static_cast<float>(samplesToProcess);
    float currentGain = startGain;
    
    for (size_t i = ZERO_INDEX; i < samplesToProcess; ++i) {
        data[i] *= currentGain;
        currentGain += gainIncrement;
    }
}

float AudioBuffer::getMagnitude(size_t channel, size_t startSample, size_t numSamples) const {
    if (channel >= m_numChannels) return ZERO_FLOAT;
    
    const float* data = m_channels[channel] + startSample;
    size_t samplesToProcess = std::min(numSamples, m_numSamples - startSample);
    
    float maxMagnitude = INITIAL_MAX_MAGNITUDE;
    
#ifdef __ARM_NEON
    // NEON optimized version
    size_t simdSamples = samplesToProcess & SIMD_MASK_4;
    float32x4_t maxVec = vdupq_n_f32(INITIAL_MAX_MAGNITUDE);
    
    for (size_t i = 0; i < simdSamples; i += SIMD_INCREMENT_4) {
        float32x4_t vec = vld1q_f32(&data[i]);
        vec = vabsq_f32(vec);
        maxVec = vmaxq_f32(maxVec, vec);
    }
    
    // Extract maximum from vector
    float32x2_t max2 = vmax_f32(vget_low_f32(maxVec), vget_high_f32(maxVec));
    maxMagnitude = std::max(vget_lane_f32(max2, 0), vget_lane_f32(max2, 1));
    
    // Process remaining samples
    for (size_t i = simdSamples; i < samplesToProcess; ++i) {
        maxMagnitude = std::max(maxMagnitude, std::abs(data[i]));
    }
#else
    // Scalar version
    for (size_t i = 0; i < samplesToProcess; ++i) {
        maxMagnitude = std::max(maxMagnitude, std::abs(data[i]));
    }
#endif
    
    return maxMagnitude;
}

float AudioBuffer::getRMSLevel(size_t channel, size_t startSample, size_t numSamples) const {
    if (channel >= m_numChannels || numSamples == 0) return DEFAULT_RETURN_VALUE;
    
    const float* data = m_channels[channel] + startSample;
    size_t samplesToProcess = std::min(numSamples, m_numSamples - startSample);
    
    double sum = INITIAL_SUM;
    
#ifdef __ARM_NEON
    // NEON optimized version
    size_t simdSamples = samplesToProcess & SIMD_MASK_4;
    float32x4_t sumVec = vdupq_n_f32(INITIAL_MAX_MAGNITUDE);
    
    for (size_t i = 0; i < simdSamples; i += SIMD_INCREMENT_4) {
        float32x4_t vec = vld1q_f32(&data[i]);
        vec = vmulq_f32(vec, vec);  // Square the values
        sumVec = vaddq_f32(sumVec, vec);
    }
    
    // Sum the vector elements
    float32x2_t sum2 = vadd_f32(vget_low_f32(sumVec), vget_high_f32(sumVec));
    sum = vget_lane_f32(sum2, 0) + vget_lane_f32(sum2, 1);
    
    // Process remaining samples
    for (size_t i = simdSamples; i < samplesToProcess; ++i) {
        sum += data[i] * data[i];
    }
#else
    // Scalar version
    for (size_t i = 0; i < samplesToProcess; ++i) {
        sum += data[i] * data[i];
    }
#endif
    
    return static_cast<float>(std::sqrt(sum / samplesToProcess));
}

// Move constructor
AudioBuffer::AudioBuffer(AudioBuffer&& other) noexcept
    : m_numChannels(other.m_numChannels)
    , m_numSamples(other.m_numSamples)
    , m_data(std::move(other.m_data))
    , m_channels(std::move(other.m_channels)) {
    other.m_numChannels = RESET_CHANNELS;
    other.m_numSamples = RESET_SAMPLES;
}

// Move assignment
AudioBuffer& AudioBuffer::operator=(AudioBuffer&& other) noexcept {
    if (this != &other) {
        m_numChannels = other.m_numChannels;
        m_numSamples = other.m_numSamples;
        m_data = std::move(other.m_data);
        m_channels = std::move(other.m_channels);
        
        other.m_numChannels = RESET_CHANNELS;
        other.m_numSamples = RESET_SAMPLES;
    }
    return *this;
}

// Validation
bool AudioBuffer::validateBuffer(std::source_location location) const {
    if (m_numChannels == RESET_CHANNELS || m_numSamples == RESET_SAMPLES) {
        return false;
    }
    
    if (!m_data || !m_channels) {
        return false;
    }
    
    for (size_t ch = 0; ch < m_numChannels; ++ch) {
        if (!m_channels[ch]) {
            return false;
        }
    }
    
    return true;
}

// Debug info
std::string AudioBuffer::getDebugInfo(std::source_location location) const {
    return nyth::format("AudioBuffer [{}:{}] - channels: {}, samples: {}, data: {}, channels_ptr: {}", 
                       location.file_name(), location.line(),
                       m_numChannels, m_numSamples, 
                       m_data ? "valid" : "null", 
                       m_channels ? "valid" : "null");
}

} // namespace AudioUtils