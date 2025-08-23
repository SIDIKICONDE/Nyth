#pragma once
#ifndef BIQUADFILTER_HPP_INCLUDED
#define BIQUADFILTER_HPP_INCLUDED

// 🎯 C++17 PURE - 100% standard C++17, no platform-specific extensions
// ✅ SFINAE, std::string, std::ostringstream, constexpr

// C++17 standard headers
#include <cstddef>
#include <cmath>
#include <vector>
#include <string>
#include <type_traits>

// Legacy constants header
#include "CoreConstants.hpp"

// C++17 pure - no platform-specific SIMD optimizations

namespace AudioFX {

// Note: is_audio_buffer_type is already defined in CoreConstants.hpp

// Macro pour remplacer source_location
#define NYTH_SOURCE_LOCATION (std::string(__FILE__) + ":" + std::to_string(__LINE__))

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

    // C++17 modernized processing methods with SFINAE
    template<typename T = float,
             typename = std::enable_if_t<std::is_floating_point<T>::value>>
    void process(const std::vector<T>& input, std::vector<T>& output,
                const std::string& location = NYTH_SOURCE_LOCATION);

    template<typename T = float,
             typename = std::enable_if_t<std::is_floating_point<T>::value>>
    void processStereo(const std::vector<T>& inputL, const std::vector<T>& inputR,
                      std::vector<T>& outputL, std::vector<T>& outputR,
                      const std::string& location = NYTH_SOURCE_LOCATION);

    // Legacy methods for backward compatibility
    [[deprecated("Use vector version instead")]]
    void process(const float* input, float* output, size_t numSamples);

    [[deprecated("Use vector version instead")]]
    void processStereo(const float* inputL, const float* inputR,
                      float* outputL, float* outputR, size_t numSamples);
    
    // Mono processing method
    void processMono(const float* input, float* output, size_t numSamples);

    // Process single sample (for real-time processing)
    template<typename T = float,
             typename = std::enable_if_t<std::is_floating_point<T>::value>>
    inline T processSample(T input);

    // Reset filter state
    void reset();

    // Get current coefficients
    void getCoefficients(double& a0, double& a1, double& a2,
                        double& b0, double& b1, double& b2) const;

    // C++17 formatted debugging
    std::string getDebugInfo(const std::string& location = NYTH_SOURCE_LOCATION) const;

protected:
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

    // C++17 pure implementation - no SIMD optimizations
};

// C++17 constexpr helper functions
constexpr double compute_frequency_response(double frequency, double sampleRate) {
    return BiquadConstants::TWO_PI_MULTIPLIER * BiquadConstants::PI_PRECISE * frequency / sampleRate;
}

// C++17 type-trait based validation
template<typename T>
inline typename std::enable_if<std::is_floating_point<T>::value, T>::type
process_sample_implementation(double a0, double a1, double a2, double b1, double b2,
                                      T input, double& y1, double& y2) {
    // Direct Form II implementation
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

// C++17 template implementations
template<typename T, typename>
inline T AudioFX::BiquadFilter::processSample(T input) {
    return process_sample_implementation(m_a0, m_a1, m_a2, m_b1, m_b2, input, m_y1, m_y2);
}

#endif // BIQUADFILTER_HPP_INCLUDED
