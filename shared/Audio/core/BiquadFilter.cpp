
#include "BiquadFilter.hpp"
#include <cmath>
#include <format>
#include <algorithm>
#include <ranges>

namespace AudioEqualizer {

BiquadFilter::BiquadFilter() 
    : m_a0(1.0), m_a1(0.0), m_a2(0.0)
    , m_b1(0.0), m_b2(0.0)
    , m_y1(0.0), m_y2(0.0)
    , m_y1R(0.0), m_y2R(0.0) {
}

BiquadFilter::~BiquadFilter() = default;

void BiquadFilter::setCoefficients(double a0, double a1, double a2, 
                                  double b0, double b1, double b2) {
    normalizeCoefficients(a0, a1, a2, b0, b1, b2);
    m_a0 = a0;
    m_a1 = a1;
    m_a2 = a2;
    m_b1 = b1;
    m_b2 = b2;
}

void BiquadFilter::normalizeCoefficients(double& a0, double& a1, double& a2, 
                                        double& b0, double& b1, double& b2) {
    if (std::abs(b0) < EPSILON) {
        b0 = 1.0;
    }
    
    double inv_b0 = 1.0 / b0;
    a0 *= inv_b0;
    a1 *= inv_b0;
    a2 *= inv_b0;
    b1 *= inv_b0;
    b2 *= inv_b0;
}

void BiquadFilter::calculateLowpass(double frequency, double sampleRate, double q) {
    double omega = TWO_PI * frequency / sampleRate;
    double sin_omega = std::sin(omega);
    double cos_omega = std::cos(omega);
    double alpha = sin_omega / (2.0 * q);
    
    double b0 = 1.0 + alpha;
    double b1 = -2.0 * cos_omega;
    double b2 = 1.0 - alpha;
    double a0 = (1.0 - cos_omega) / 2.0;
    double a1 = 1.0 - cos_omega;
    double a2 = (1.0 - cos_omega) / 2.0;
    
    setCoefficients(a0, a1, a2, b0, b1, b2);
}

void BiquadFilter::calculateHighpass(double frequency, double sampleRate, double q) {
    double omega = TWO_PI * frequency / sampleRate;
    double sin_omega = std::sin(omega);
    double cos_omega = std::cos(omega);
    double alpha = sin_omega / (2.0 * q);
    
    double b0 = 1.0 + alpha;
    double b1 = -2.0 * cos_omega;
    double b2 = 1.0 - alpha;
    double a0 = (1.0 + cos_omega) / 2.0;
    double a1 = -(1.0 + cos_omega);
    double a2 = (1.0 + cos_omega) / 2.0;
    
    setCoefficients(a0, a1, a2, b0, b1, b2);
}

void BiquadFilter::calculateBandpass(double frequency, double sampleRate, double q) {
    double omega = TWO_PI * frequency / sampleRate;
    double sin_omega = std::sin(omega);
    double cos_omega = std::cos(omega);
    double alpha = sin_omega / (2.0 * q);
    
    double b0 = 1.0 + alpha;
    double b1 = -2.0 * cos_omega;
    double b2 = 1.0 - alpha;
    double a0 = alpha;
    double a1 = 0.0;
    double a2 = -alpha;
    
    setCoefficients(a0, a1, a2, b0, b1, b2);
}

void BiquadFilter::calculateNotch(double frequency, double sampleRate, double q) {
    double omega = TWO_PI * frequency / sampleRate;
    double sin_omega = std::sin(omega);
    double cos_omega = std::cos(omega);
    double alpha = sin_omega / (2.0 * q);
    
    double b0 = 1.0 + alpha;
    double b1 = -2.0 * cos_omega;
    double b2 = 1.0 - alpha;
    double a0 = 1.0;
    double a1 = -2.0 * cos_omega;
    double a2 = 1.0;
    
    setCoefficients(a0, a1, a2, b0, b1, b2);
}

void BiquadFilter::calculatePeaking(double frequency, double sampleRate, double q, double gainDB) {
    double A = std::pow(10.0, gainDB / 40.0);
    double omega = TWO_PI * frequency / sampleRate;
    double sin_omega = std::sin(omega);
    double cos_omega = std::cos(omega);
    double alpha = sin_omega / (2.0 * q);
    
    double b0 = 1.0 + alpha / A;
    double b1 = -2.0 * cos_omega;
    double b2 = 1.0 - alpha / A;
    double a0 = 1.0 + alpha * A;
    double a1 = -2.0 * cos_omega;
    double a2 = 1.0 - alpha * A;
    
    setCoefficients(a0, a1, a2, b0, b1, b2);
}

void BiquadFilter::calculateLowShelf(double frequency, double sampleRate, double q, double gainDB) {
    double A = std::pow(10.0, gainDB / 40.0);
    double omega = TWO_PI * frequency / sampleRate;
    double sin_omega = std::sin(omega);
    double cos_omega = std::cos(omega);
    double S = 1.0; // Shelf slope parameter
    double alpha = sin_omega / 2.0 * std::sqrt((A + 1.0 / A) * (1.0 / S - 1.0) + 2.0);
    
    double sqrt_A = std::sqrt(A);
    double two_sqrt_A_alpha = 2.0 * sqrt_A * alpha;
    
    double b0 = (A + 1.0) + (A - 1.0) * cos_omega + two_sqrt_A_alpha;
    double b1 = -2.0 * ((A - 1.0) + (A + 1.0) * cos_omega);
    double b2 = (A + 1.0) + (A - 1.0) * cos_omega - two_sqrt_A_alpha;
    double a0 = A * ((A + 1.0) - (A - 1.0) * cos_omega + two_sqrt_A_alpha);
    double a1 = 2.0 * A * ((A - 1.0) - (A + 1.0) * cos_omega);
    double a2 = A * ((A + 1.0) - (A - 1.0) * cos_omega - two_sqrt_A_alpha);
    
    setCoefficients(a0, a1, a2, b0, b1, b2);
}

void BiquadFilter::calculateHighShelf(double frequency, double sampleRate, double q, double gainDB) {
    double A = std::pow(10.0, gainDB / 40.0);
    double omega = TWO_PI * frequency / sampleRate;
    double sin_omega = std::sin(omega);
    double cos_omega = std::cos(omega);
    double S = 1.0; // Shelf slope parameter
    double alpha = sin_omega / 2.0 * std::sqrt((A + 1.0 / A) * (1.0 / S - 1.0) + 2.0);
    
    double sqrt_A = std::sqrt(A);
    double two_sqrt_A_alpha = 2.0 * sqrt_A * alpha;
    
    double b0 = (A + 1.0) - (A - 1.0) * cos_omega + two_sqrt_A_alpha;
    double b1 = 2.0 * ((A - 1.0) - (A + 1.0) * cos_omega);
    double b2 = (A + 1.0) - (A - 1.0) * cos_omega - two_sqrt_A_alpha;
    double a0 = A * ((A + 1.0) + (A - 1.0) * cos_omega + two_sqrt_A_alpha);
    double a1 = -2.0 * A * ((A - 1.0) + (A + 1.0) * cos_omega);
    double a2 = A * ((A + 1.0) + (A - 1.0) * cos_omega - two_sqrt_A_alpha);
    
    setCoefficients(a0, a1, a2, b0, b1, b2);
}

void BiquadFilter::calculateAllpass(double frequency, double sampleRate, double q) {
    double omega = TWO_PI * frequency / sampleRate;
    double sin_omega = std::sin(omega);
    double cos_omega = std::cos(omega);
    double alpha = sin_omega / (2.0 * q);
    
    double b0 = 1.0 + alpha;
    double b1 = -2.0 * cos_omega;
    double b2 = 1.0 - alpha;
    double a0 = 1.0 - alpha;
    double a1 = -2.0 * cos_omega;
    double a2 = 1.0 + alpha;
    
    setCoefficients(a0, a1, a2, b0, b1, b2);
}

void BiquadFilter::process(const float* input, float* output, size_t numSamples) {
    // C++20 pure implementation - Direct Form II Transposed
    double y1 = m_y1, y2 = m_y2;

    // Process in blocks for better cache efficiency
    constexpr size_t BLOCK_SIZE = 32;
    size_t fullBlocks = numSamples / BLOCK_SIZE;
    size_t remaining = numSamples % BLOCK_SIZE;

    for (size_t block = 0; block < fullBlocks; ++block) {
        size_t offset = block * BLOCK_SIZE;
        for (size_t i = 0; i < BLOCK_SIZE; ++i) {
            double x = static_cast<double>(input[offset + i]);
            double w = x - m_b1 * y1 - m_b2 * y2;
            double y = m_a0 * w + m_a1 * y1 + m_a2 * y2;

            y2 = y1;
            y1 = preventDenormal(w);

            output[offset + i] = static_cast<float>(y);
        }
    }

    // Process remaining samples
    size_t offset = fullBlocks * BLOCK_SIZE;
    for (size_t i = 0; i < remaining; ++i) {
        double x = static_cast<double>(input[offset + i]);
        double w = x - m_b1 * y1 - m_b2 * y2;
        double y = m_a0 * w + m_a1 * y1 + m_a2 * y2;

        y2 = y1;
        y1 = preventDenormal(w);

        output[offset + i] = static_cast<float>(y);
    }

    m_y1 = y1;
    m_y2 = y2;
}

void BiquadFilter::processStereo(const float* inputL, const float* inputR,
                                float* outputL, float* outputR, size_t numSamples) {
    // Process left channel (DF-II transposé)
    double y1 = m_y1, y2 = m_y2;
    
    for (size_t i = 0; i < numSamples; ++i) {
        double x = static_cast<double>(inputL[i]);
        double w = x - m_b1 * y1 - m_b2 * y2;
        double y = m_a0 * w + m_a1 * y1 + m_a2 * y2;
        
        y2 = y1;
        y1 = preventDenormal(w);
        
        outputL[i] = static_cast<float>(y);
    }
    
    m_y1 = y1; m_y2 = y2;
    
    // Process right channel (DF-II transposé)
    y1 = m_y1R; y2 = m_y2R;
    
    for (size_t i = 0; i < numSamples; ++i) {
        double x = static_cast<double>(inputR[i]);
        double w = x - m_b1 * y1 - m_b2 * y2;
        double y = m_a0 * w + m_a1 * y1 + m_a2 * y2;
        
        y2 = y1;
        y1 = preventDenormal(w);
        
        outputR[i] = static_cast<float>(y);
    }
    
    m_y1R = y1; m_y2R = y2;
}

// C++20 pure - no SIMD optimizations

// C++20 pure - no SIMD optimizations

void BiquadFilter::reset() {
    m_y1 = m_y2 = 0.0;
    m_y1R = m_y2R = 0.0;
}

void BiquadFilter::getCoefficients(double& a0, double& a1, double& a2,
                                  double& b0, double& b1, double& b2) const {
    a0 = m_a0;
    a1 = m_a1;
    a2 = m_a2;
    b0 = 1.0;
    b1 = m_b1;
    b2 = m_b2;
}

// C++20 modernized processing methods
template<AudioSampleType T>
void BiquadFilter::process(std::span<const T> input, std::span<T> output,
                          std::source_location location) {
    // C++20 concept validation at runtime
    if (input.size() != output.size()) {
        throw std::invalid_argument(std::format(
            "Input and output spans must have the same size. Input: {}, Output: {} [{}:{}]",
            input.size(), output.size(), location.file_name(), location.line()));
    }

    if (input.empty()) return;

    // Use C++20 ranges for processing
    double y1 = m_y1, y2 = m_y2;

    std::ranges::transform(input, output.begin(),
                          [&](const T& sample) {
                              return process_sample_implementation(m_a0, m_a1, m_a2, m_b1, m_b2,
                                                                 sample, y1, y2);
                          });

    m_y1 = y1;
    m_y2 = y2;
}

template<AudioSampleType T>
void BiquadFilter::processStereo(std::span<const T> inputL, std::span<const T> inputR,
                                std::span<T> outputL, std::span<T> outputR,
                                std::source_location location) {
    // C++20 validation
    if (inputL.size() != inputR.size() || inputL.size() != outputL.size() || inputR.size() != outputR.size()) {
        throw std::invalid_argument(std::format(
            "All spans must have the same size [{}:{}]", location.file_name(), location.line()));
    }

    if (inputL.empty()) return;

    // Process left channel
    double y1L = m_y1, y2L = m_y2;
    std::ranges::transform(inputL, outputL.begin(),
                          [&](const T& sample) {
                              return process_sample_implementation(m_a0, m_a1, m_a2, m_b1, m_b2,
                                                                 sample, y1L, y2L);
                          });

    // Process right channel
    double y1R = m_y1R, y2R = m_y2R;
    std::ranges::transform(inputR, outputR.begin(),
                          [&](const T& sample) {
                              return process_sample_implementation(m_a0, m_a1, m_a2, m_b1, m_b2,
                                                                 sample, y1R, y2R);
                          });

    m_y1 = y1L; m_y2 = y2L;
    m_y1R = y1R; m_y2R = y2R;
}

// C++20 formatted debugging
std::string BiquadFilter::getDebugInfo(std::source_location location) const {
    return std::format(
        "BiquadFilter Debug Info:\n"
        "  Coefficients: a0={:.6f}, a1={:.6f}, a2={:.6f}, b1={:.6f}, b2={:.6f}\n"
        "  State: y1={:.6f}, y2={:.6f}, y1R={:.6f}, y2R={:.6f}\n"
        "  Location: {}:{} ({})\n",
        m_a0, m_a1, m_a2, m_b1, m_b2,
        m_y1, m_y2, m_y1R, m_y2R,
        location.file_name(), location.line(), location.function_name());
}

// Explicit template instantiations for common audio types
template void AudioEqualizer::BiquadFilter::process<float>(std::span<const float>, std::span<float>, std::source_location);
template void AudioEqualizer::BiquadFilter::process<double>(std::span<const double>, std::span<double>, std::source_location);
template void AudioEqualizer::BiquadFilter::processStereo<float>(std::span<const float>, std::span<const float>,
                                                std::span<float>, std::span<float>, std::source_location);
template void AudioEqualizer::BiquadFilter::processStereo<double>(std::span<const double>, std::span<const double>,
                                                 std::span<double>, std::span<double>, std::source_location);

} // namespace AudioEqualizer