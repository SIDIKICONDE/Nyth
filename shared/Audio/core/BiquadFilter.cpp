
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
    // Optimized C++20 implementation - Direct Form II Transposed
    double y1 = m_y1, y2 = m_y2;

    // Process in larger blocks for better cache efficiency and vectorization opportunities
    constexpr size_t BLOCK_SIZE = 64;
    size_t fullBlocks = numSamples / BLOCK_SIZE;
    size_t remaining = numSamples % BLOCK_SIZE;

    // Cache coefficients in local variables to avoid memory access
    const double a0 = m_a0;
    const double a1 = m_a1;
    const double a2 = m_a2;
    const double b1 = m_b1;
    const double b2 = m_b2;

    // Process full blocks with unrolled loop for better pipelining
    for (size_t block = 0; block < fullBlocks; ++block) {
        size_t offset = block * BLOCK_SIZE;
        
        // Prefetch next block data
        if (block + 1 < fullBlocks) {
            __builtin_prefetch(&input[offset + BLOCK_SIZE], 0, 1);
            __builtin_prefetch(&output[offset + BLOCK_SIZE], 1, 1);
        }
        
        // Process 4 samples at a time for better ILP
        for (size_t i = 0; i < BLOCK_SIZE; i += 4) {
            // Sample 0
            double x0 = static_cast<double>(input[offset + i]);
            double w0 = x0 - b1 * y1 - b2 * y2;
            double y0 = a0 * w0 + a1 * y1 + a2 * y2;
            
            // Sample 1
            double x1 = static_cast<double>(input[offset + i + 1]);
            double w1 = x1 - b1 * w0 - b2 * y1;
            double y1_new = a0 * w1 + a1 * w0 + a2 * y1;
            
            // Sample 2
            double x2 = static_cast<double>(input[offset + i + 2]);
            double w2 = x2 - b1 * w1 - b2 * w0;
            double y2_new = a0 * w2 + a1 * w1 + a2 * w0;
            
            // Sample 3
            double x3 = static_cast<double>(input[offset + i + 3]);
            double w3 = x3 - b1 * w2 - b2 * w1;
            double y3 = a0 * w3 + a1 * w2 + a2 * w1;
            
            // Update state for next iteration
            y2 = w2;
            y1 = (std::abs(w3) < EPSILON) ? 0.0 : w3;
            
            // Write outputs
            output[offset + i] = static_cast<float>(y0);
            output[offset + i + 1] = static_cast<float>(y1_new);
            output[offset + i + 2] = static_cast<float>(y2_new);
            output[offset + i + 3] = static_cast<float>(y3);
        }
    }

    // Process remaining samples
    size_t offset = fullBlocks * BLOCK_SIZE;
    for (size_t i = 0; i < remaining; ++i) {
        double x = static_cast<double>(input[offset + i]);
        double w = x - b1 * y1 - b2 * y2;
        double y = a0 * w + a1 * y1 + a2 * y2;

        y2 = y1;
        y1 = (std::abs(w) < EPSILON) ? 0.0 : w;

        output[offset + i] = static_cast<float>(y);
    }

    m_y1 = y1;
    m_y2 = y2;
}

void BiquadFilter::processStereo(const float* inputL, const float* inputR,
                                float* outputL, float* outputR, size_t numSamples) {
    // Optimized stereo processing - interleaved for better cache usage
    double y1L = m_y1, y2L = m_y2;
    double y1R = m_y1R, y2R = m_y2R;
    
    // Cache coefficients
    const double a0 = m_a0;
    const double a1 = m_a1;
    const double a2 = m_a2;
    const double b1 = m_b1;
    const double b2 = m_b2;
    
    // Process 4 samples at a time for both channels
    size_t i = 0;
    for (; i + 3 < numSamples; i += 4) {
        // Prefetch next data
        __builtin_prefetch(&inputL[i + 16], 0, 1);
        __builtin_prefetch(&inputR[i + 16], 0, 1);
        
        // Left channel - 4 samples
        double xL0 = static_cast<double>(inputL[i]);
        double wL0 = xL0 - b1 * y1L - b2 * y2L;
        double yL0 = a0 * wL0 + a1 * y1L + a2 * y2L;
        
        double xL1 = static_cast<double>(inputL[i + 1]);
        double wL1 = xL1 - b1 * wL0 - b2 * y1L;
        double yL1 = a0 * wL1 + a1 * wL0 + a2 * y1L;
        
        double xL2 = static_cast<double>(inputL[i + 2]);
        double wL2 = xL2 - b1 * wL1 - b2 * wL0;
        double yL2 = a0 * wL2 + a1 * wL1 + a2 * wL0;
        
        double xL3 = static_cast<double>(inputL[i + 3]);
        double wL3 = xL3 - b1 * wL2 - b2 * wL1;
        double yL3 = a0 * wL3 + a1 * wL2 + a2 * wL1;
        
        // Right channel - 4 samples  
        double xR0 = static_cast<double>(inputR[i]);
        double wR0 = xR0 - b1 * y1R - b2 * y2R;
        double yR0 = a0 * wR0 + a1 * y1R + a2 * y2R;
        
        double xR1 = static_cast<double>(inputR[i + 1]);
        double wR1 = xR1 - b1 * wR0 - b2 * y1R;
        double yR1 = a0 * wR1 + a1 * wR0 + a2 * y1R;
        
        double xR2 = static_cast<double>(inputR[i + 2]);
        double wR2 = xR2 - b1 * wR1 - b2 * wR0;
        double yR2 = a0 * wR2 + a1 * wR1 + a2 * wR0;
        
        double xR3 = static_cast<double>(inputR[i + 3]);
        double wR3 = xR3 - b1 * wR2 - b2 * wR1;
        double yR3 = a0 * wR3 + a1 * wR2 + a2 * wR1;
        
        // Update states
        y2L = wL2;
        y1L = (std::abs(wL3) < EPSILON) ? 0.0 : wL3;
        y2R = wR2;
        y1R = (std::abs(wR3) < EPSILON) ? 0.0 : wR3;
        
        // Write outputs
        outputL[i] = static_cast<float>(yL0);
        outputL[i + 1] = static_cast<float>(yL1);
        outputL[i + 2] = static_cast<float>(yL2);
        outputL[i + 3] = static_cast<float>(yL3);
        
        outputR[i] = static_cast<float>(yR0);
        outputR[i + 1] = static_cast<float>(yR1);
        outputR[i + 2] = static_cast<float>(yR2);
        outputR[i + 3] = static_cast<float>(yR3);
    }
    
    // Process remaining samples
    for (; i < numSamples; ++i) {
        // Left channel
        double xL = static_cast<double>(inputL[i]);
        double wL = xL - b1 * y1L - b2 * y2L;
        double yL = a0 * wL + a1 * y1L + a2 * y2L;
        y2L = y1L;
        y1L = (std::abs(wL) < EPSILON) ? 0.0 : wL;
        outputL[i] = static_cast<float>(yL);
        
        // Right channel
        double xR = static_cast<double>(inputR[i]);
        double wR = xR - b1 * y1R - b2 * y2R;
        double yR = a0 * wR + a1 * y1R + a2 * y2R;
        y2R = y1R;
        y1R = (std::abs(wR) < EPSILON) ? 0.0 : wR;
        outputR[i] = static_cast<float>(yR);
    }
    
    m_y1 = y1L; m_y2 = y2L;
    m_y1R = y1R; m_y2R = y2R;
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