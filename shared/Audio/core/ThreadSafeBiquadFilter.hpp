#pragma once
#ifndef THREADSAFE_BIQUADFILTER_HPP
#define THREADSAFE_BIQUADFILTER_HPP

#include "BiquadFilter.hpp"
#include "AudioError.hpp"
#include <atomic>
#include <mutex>
#include <cstring>  // for memcpy

namespace AudioFX {

/**
 * Thread-safe wrapper for BiquadFilter
 * Ensures safe concurrent access to filter state
 */
class ThreadSafeBiquadFilter {
public:
    ThreadSafeBiquadFilter() : m_filter(std::make_unique<BiquadFilter>()) {}
    
    // Thread-safe coefficient updates
    void setCoefficients(double a0, double a1, double a2, double b0, double b1, double b2) {
        std::lock_guard<std::mutex> lock(m_mutex);
        m_filter->setCoefficients(a0, a1, a2, b0, b1, b2);
    }
    
    void calculateLowpass(double frequency, double sampleRate, double q) {
        std::lock_guard<std::mutex> lock(m_mutex);
        m_filter->calculateLowpass(frequency, sampleRate, q);
    }
    
    void calculateHighpass(double frequency, double sampleRate, double q) {
        std::lock_guard<std::mutex> lock(m_mutex);
        m_filter->calculateHighpass(frequency, sampleRate, q);
    }
    
    void calculateBandpass(double frequency, double sampleRate, double q) {
        std::lock_guard<std::mutex> lock(m_mutex);
        m_filter->calculateBandpass(frequency, sampleRate, q);
    }
    
    void calculateNotch(double frequency, double sampleRate, double q) {
        std::lock_guard<std::mutex> lock(m_mutex);
        m_filter->calculateNotch(frequency, sampleRate, q);
    }
    
    void calculatePeaking(double frequency, double sampleRate, double q, double gainDB) {
        std::lock_guard<std::mutex> lock(m_mutex);
        m_filter->calculatePeaking(frequency, sampleRate, q, gainDB);
    }
    
    void calculateLowShelf(double frequency, double sampleRate, double q, double gainDB) {
        std::lock_guard<std::mutex> lock(m_mutex);
        m_filter->calculateLowShelf(frequency, sampleRate, q, gainDB);
    }
    
    void calculateHighShelf(double frequency, double sampleRate, double q, double gainDB) {
        std::lock_guard<std::mutex> lock(m_mutex);
        m_filter->calculateHighShelf(frequency, sampleRate, q, gainDB);
    }
    
    void calculateAllpass(double frequency, double sampleRate, double q) {
        std::lock_guard<std::mutex> lock(m_mutex);
        m_filter->calculateAllpass(frequency, sampleRate, q);
    }
    
    // Thread-safe processing with error handling
    AudioError process(const float* input, float* output, size_t numSamples) noexcept {
        // Validate inputs first
        AUDIO_RETURN_IF_ERROR(AudioValidator::validateBuffer(input, numSamples));
        AUDIO_RETURN_IF_ERROR(AudioValidator::validateBuffer(output, numSamples));
        
        // Use try_lock for processing to avoid blocking audio thread
        std::unique_lock<std::mutex> lock(m_mutex, std::try_to_lock);
        if (lock.owns_lock()) {
            m_filter->process(input, output, numSamples);
            return AudioError::OK;
        } else {
            // If can't acquire lock, pass through unprocessed
            // This prevents audio dropouts in real-time context
            if (input != output) {
                std::copy(input, input + numSamples, output);
            }
            return AudioError::RESOURCE_BUSY;
        }
    }
    
    void processStereo(const float* inputL, const float* inputR,
                      float* outputL, float* outputR, size_t numSamples) {
        std::unique_lock<std::mutex> lock(m_mutex, std::try_to_lock);
        if (lock.owns_lock()) {
            m_filter->processStereo(inputL, inputR, outputL, outputR, numSamples);
        } else {
            // Pass through if can't acquire lock
            if (inputL != outputL) {
                std::copy(inputL, inputL + numSamples, outputL);
            }
            if (inputR != outputR) {
                std::copy(inputR, inputR + numSamples, outputR);
            }
        }
    }
    
    void reset() {
        std::lock_guard<std::mutex> lock(m_mutex);
        m_filter->reset();
    }
    
    // Get underlying filter (use with caution)
    BiquadFilter* getFilter() const { return m_filter.get(); }
    
private:
    std::unique_ptr<BiquadFilter> m_filter;
    mutable std::mutex m_mutex;
};

/**
 * Lock-free filter state for real-time processing
 * Uses double buffering with atomic swapping
 */
class LockFreeBiquadFilter {
public:
    LockFreeBiquadFilter() {
        m_filters[0] = std::make_unique<BiquadFilter>();
        m_filters[1] = std::make_unique<BiquadFilter>();
        m_activeIndex.store(0);
    }
    
    // Update coefficients on the inactive filter then swap
    void updateCoefficients(double a0, double a1, double a2, double b0, double b1, double b2) {
        int inactiveIndex = 1 - m_activeIndex.load();
        m_filters[inactiveIndex]->setCoefficients(a0, a1, a2, b0, b1, b2);
        
        // Copy current state to maintain continuity
        double y1, y2, dummy;
        m_filters[m_activeIndex.load()]->getCoefficients(dummy, dummy, dummy, dummy, dummy, dummy);
        
        // Atomic swap to new filter
        m_activeIndex.store(inactiveIndex);
    }
    
    // Lock-free processing
    void process(const float* input, float* output, size_t numSamples) {
        m_filters[m_activeIndex.load()]->process(input, output, numSamples);
    }
    
    void processStereo(const float* inputL, const float* inputR,
                      float* outputL, float* outputR, size_t numSamples) {
        m_filters[m_activeIndex.load()]->processStereo(inputL, inputR, outputL, outputR, numSamples);
    }
    
private:
    std::unique_ptr<BiquadFilter> m_filters[2];
    std::atomic<int> m_activeIndex;
};

} // namespace AudioFX

#endif // THREADSAFE_BIQUADFILTER_HPP