#pragma once
#ifndef BIQUADFILTER_HPP_INCLUDED
#define BIQUADFILTER_HPP_INCLUDED

// 🎯 C++20 PURE - 100% standard C++20, no platform-specific extensions
// ✅ Concepts, std::span, std::format, std::source_location, consteval
// ❌ No SIMD, no platform-specific optimizations

// C++20 standard headers
#include <cstdint>
#include <cstddef>
#include <cmath>
#include <span>
#include <concepts>
#include "../../compat/format.hpp"
#include <source_location>
#include <type_traits>

// Legacy constants header
#include "CoreConstants.hpp"

// C++20 pure - no platform-specific SIMD optimizations

namespace AudioFX {

// C++20 Concepts for type safety (use concepts from CoreConstants.hpp)
template<typename T>
concept AudioBuffer = std::is_pointer_v<T> || requires(T t) {
    typename T::value_type;
    { t.data() } -> std::same_as<typename T::pointer>;
    { t.size() } -> std::same_as<typename T::size_type>;
};

using enum FilterType; // C++20 using enum

class BiquadFilter {
public:
    BiquadFilter();
    ~BiquadFilter();

    // Configure filter coefficients
    void setCoefficients(double a0, double a1, double a2, double b0, double b1, double b2);
    
    // Calculate coefficients for different filter types
    void calculateLowpass(double frequency, double sampleRate, double q);
    void calculateHighpass(double frequency, double sampleRate, double q);
    void calculateBandpass(double frequency, double sampleRate, double q);
    void calculateNotch(double frequency, double sampleRate, double q);
    void calculatePeaking(double frequency, double sampleRate, double q, double gainDB);
    void calculateLowShelf(double frequency, double sampleRate, double q, double gainDB);
    void calculateHighShelf(double frequency, double sampleRate, double q, double gainDB);
    void calculateAllpass(double frequency, double sampleRate, double q);

    // C++20 modernized processing methods
    template<AudioSampleType T = float>
    void process(std::span<const T> input, std::span<T> output,
                std::source_location location = std::source_location::current());

    template<AudioSampleType T = float>
    void processStereo(std::span<const T> inputL, std::span<const T> inputR,
                      std::span<T> outputL, std::span<T> outputR,
                      std::source_location location = std::source_location::current());

    // Legacy methods for backward compatibility (deprecated in C++20)
    [[deprecated("Use std::span version instead")]]
    void process(const float* input, float* output, size_t numSamples);

    [[deprecated("Use std::span version instead")]]
    void processStereo(const float* inputL, const float* inputR,
                      float* outputL, float* outputR, size_t numSamples);

    // Process single sample (for real-time processing)
    template<AudioSampleType T = float>
    inline T processSample(T input);

    // Reset filter state
    void reset();

    // Get current coefficients
    void getCoefficients(double& a0, double& a1, double& a2,
                        double& b0, double& b1, double& b2) const;

    // C++20 formatted debugging
    std::string getDebugInfo(std::source_location location = std::source_location::current()) const;

private:
    // Filter coefficients
    double m_a0, m_a1, m_a2;  // Feedforward coefficients
    double m_b1, m_b2;        // Feedback coefficients (b0 is normalized to 1)
    
    // Filter state (Direct Form II)
    double m_y1, m_y2;        // Previous outputs for left/mono channel
    double m_y1R, m_y2R;      // Previous outputs for right channel
    
    // Helper function
    
    
    // Prevent denormal numbers
    inline double preventDenormal(double x) {
        return (std::abs(x) < EPSILON) ? BiquadConstants::DENORMAL_RESET_VALUE : x;
    }
    
    // Normalize coefficients
    void normalizeCoefficients(double& a0, double& a1, double& a2, 
                              double& b0, double& b1, double& b2);
    
    // C++20 pure implementation - no SIMD optimizations
};

// C++20 consteval helper functions
consteval double compute_frequency_response(double frequency, double sampleRate) {
    return BiquadConstants::TWO_PI_MULTIPLIER * BiquadConstants::PI_PRECISE * frequency / sampleRate;
}

// C++20 concept-based validation
template<typename T>
requires AudioSampleType<T>
inline T process_sample_implementation(double a0, double a1, double a2, double b1, double b2,
                                      T input, double& y1, double& y2) {
    // Direct Form II implementation with C++20 concepts
    double x = static_cast<double>(input);

    // Apply input side
    double w = x - b1 * y1 - b2 * y2;

    // Apply output side
    double y = a0 * w + a1 * y1 + a2 * y2;

    // Update state variables
    y2 = y1;
    y1 = (std::abs(w) < EPSILON) ? BiquadConstants::DENORMAL_RESET_VALUE : w; // Prevent denormal numbers

    return static_cast<T>(y);
}

} // namespace AudioFX

// C++20 template implementations
template<AudioFX::AudioSampleType T>
inline T AudioFX::BiquadFilter::processSample(T input) {
    return process_sample_implementation(m_a0, m_a1, m_a2, m_b1, m_b2, input, m_y1, m_y2);
}

#endif // BIQUADFILTER_HPP_INCLUDED
