
#include "BiquadFilter.hpp"
#include <cmath>
#include <algorithm>
#include <stdexcept>
#include <sstream>
#include <iomanip>

namespace AudioFX {

// Import des constantes pour éviter la répétition des namespace
using namespace BiquadConstants;

AudioFX::BiquadFilter::BiquadFilter()
    : m_a0(BiquadConstants::DEFAULT_A0), m_a1(BiquadConstants::DEFAULT_COEFFICIENT), m_a2(BiquadConstants::DEFAULT_COEFFICIENT)
    , m_b1(BiquadConstants::DEFAULT_COEFFICIENT), m_b2(BiquadConstants::DEFAULT_COEFFICIENT)
    , m_y1(BiquadConstants::DEFAULT_COEFFICIENT), m_y2(BiquadConstants::DEFAULT_COEFFICIENT)
    , m_y1R(BiquadConstants::DEFAULT_COEFFICIENT), m_y2R(BiquadConstants::DEFAULT_COEFFICIENT) {
}

AudioFX::BiquadFilter::~BiquadFilter() = default;

void AudioFX::BiquadFilter::setCoefficients(double a0, double a1, double a2,
                                  double b0, double b1, double b2) {
    normalizeCoefficients(a0, a1, a2, b0, b1, b2);
    m_a0 = a0;
    m_a1 = a1;
    m_a2 = a2;
    m_b1 = b1;
    m_b2 = b2;
}

void AudioFX::BiquadFilter::normalizeCoefficients(double& a0, double& a1, double& a2,
                                        double& b0, double& b1, double& b2) {
    if (std::abs(b0) < EPSILON) {
        b0 = BiquadConstants::UNITY_COEFFICIENT;
    }

    double inv_b0 = BiquadConstants::UNITY_COEFFICIENT / b0;
    a0 *= inv_b0;
    a1 *= inv_b0;
    a2 *= inv_b0;
    b1 *= inv_b0;
    b2 *= inv_b0;
}

void AudioFX::BiquadFilter::calculateLowpass(double frequency, double sampleRate, double q) {
    double omega = BiquadConstants::TWO_PI_MULTIPLIER * BiquadConstants::PI_PRECISE * frequency / sampleRate;
    double sin_omega = std::sin(omega);
    double cos_omega = std::cos(omega);
    double alpha = sin_omega / (BiquadConstants::HALF_DIVISOR * q);

    double b0 = BiquadConstants::UNITY_COEFFICIENT + alpha;
    double b1 = BiquadConstants::NEGATIVE_TWO * cos_omega;
    double b2 = BiquadConstants::UNITY_COEFFICIENT - alpha;
    double a0 = (BiquadConstants::UNITY_COEFFICIENT - cos_omega) / BiquadConstants::HALF_DIVISOR;
    double a1 = BiquadConstants::UNITY_COEFFICIENT - cos_omega;
    double a2 = (BiquadConstants::UNITY_COEFFICIENT - cos_omega) / BiquadConstants::HALF_DIVISOR;

    setCoefficients(a0, a1, a2, b0, b1, b2);
}

void AudioFX::BiquadFilter::calculateHighpass(double frequency, double sampleRate, double q) {
    double omega = BiquadConstants::TWO_PI_MULTIPLIER * BiquadConstants::PI_PRECISE * frequency / sampleRate;
    double sin_omega = std::sin(omega);
    double cos_omega = std::cos(omega);
    double alpha = sin_omega / (BiquadConstants::HALF_DIVISOR * q);

    double b0 = BiquadConstants::UNITY_COEFFICIENT + alpha;
    double b1 = BiquadConstants::NEGATIVE_TWO * cos_omega;
    double b2 = BiquadConstants::UNITY_COEFFICIENT - alpha;
    double a0 = (BiquadConstants::UNITY_COEFFICIENT + cos_omega) / BiquadConstants::HALF_DIVISOR;
    double a1 = -(BiquadConstants::UNITY_COEFFICIENT + cos_omega);
    double a2 = (BiquadConstants::UNITY_COEFFICIENT + cos_omega) / BiquadConstants::HALF_DIVISOR;

    setCoefficients(a0, a1, a2, b0, b1, b2);
}

void AudioFX::BiquadFilter::calculateBandpass(double frequency, double sampleRate, double q) {
    double omega = BiquadConstants::TWO_PI_MULTIPLIER * BiquadConstants::PI_PRECISE * frequency / sampleRate;
    double sin_omega = std::sin(omega);
    double cos_omega = std::cos(omega);
    double alpha = sin_omega / (BiquadConstants::HALF_DIVISOR * q);

    double b0 = BiquadConstants::UNITY_COEFFICIENT + alpha;
    double b1 = BiquadConstants::NEGATIVE_TWO * cos_omega;
    double b2 = BiquadConstants::UNITY_COEFFICIENT - alpha;
    double a0 = alpha;
    double a1 = BiquadConstants::DEFAULT_COEFFICIENT;
    double a2 = -alpha;

    setCoefficients(a0, a1, a2, b0, b1, b2);
}

void AudioFX::BiquadFilter::calculateNotch(double frequency, double sampleRate, double q) {
    double omega = BiquadConstants::TWO_PI_MULTIPLIER * BiquadConstants::PI_PRECISE * frequency / sampleRate;
    double sin_omega = std::sin(omega);
    double cos_omega = std::cos(omega);
    double alpha = sin_omega / (BiquadConstants::HALF_DIVISOR * q);

    double b0 = BiquadConstants::UNITY_COEFFICIENT + alpha;
    double b1 = BiquadConstants::NEGATIVE_TWO * cos_omega;
    double b2 = BiquadConstants::UNITY_COEFFICIENT - alpha;
    double a0 = BiquadConstants::UNITY_COEFFICIENT;
    double a1 = BiquadConstants::NEGATIVE_TWO * cos_omega;
    double a2 = BiquadConstants::UNITY_COEFFICIENT;

    setCoefficients(a0, a1, a2, b0, b1, b2);
}

void AudioFX::BiquadFilter::calculatePeaking(double frequency, double sampleRate, double q, double gainDB) {
    double omega = BiquadConstants::TWO_PI_MULTIPLIER * BiquadConstants::PI_PRECISE * frequency / sampleRate;
    double sin_omega = std::sin(omega);
    double cos_omega = std::cos(omega);
    double alpha = sin_omega / (BiquadConstants::HALF_DIVISOR * q);

    double A = std::pow(BiquadConstants::POWER_BASE, gainDB / BiquadConstants::PEAKING_DB_DIVISOR);
    double sqrt_A = std::sqrt(A);

    double b0 = BiquadConstants::UNITY_COEFFICIENT + alpha * A;
    double b1 = BiquadConstants::NEGATIVE_TWO * cos_omega;
    double b2 = BiquadConstants::UNITY_COEFFICIENT - alpha * A;
    double a0 = BiquadConstants::UNITY_COEFFICIENT + alpha / A;
    double a1 = BiquadConstants::NEGATIVE_TWO * cos_omega;
    double a2 = BiquadConstants::UNITY_COEFFICIENT - alpha / A;

    setCoefficients(a0, a1, a2, b0, b1, b2);
}

void AudioFX::BiquadFilter::calculateLowShelf(double frequency, double sampleRate, double q, double gainDB) {
    double omega = BiquadConstants::TWO_PI_MULTIPLIER * BiquadConstants::PI_PRECISE * frequency / sampleRate;
    double sin_omega = std::sin(omega);
    double cos_omega = std::cos(omega);
    double alpha = sin_omega / (BiquadConstants::HALF_DIVISOR * q);

    double A = std::pow(BiquadConstants::POWER_BASE, gainDB / BiquadConstants::PEAKING_DB_DIVISOR);
    double sqrt_A = std::sqrt(A);

    double b0 = A * ((A + BiquadConstants::UNITY_COEFFICIENT) + (A - BiquadConstants::UNITY_COEFFICIENT) * cos_omega + BiquadConstants::HALF_DIVISOR * alpha * sqrt_A);
    double b1 = BiquadConstants::NEGATIVE_TWO * A * ((A - BiquadConstants::UNITY_COEFFICIENT) + (A + BiquadConstants::UNITY_COEFFICIENT) * cos_omega);
    double b2 = A * ((A + BiquadConstants::UNITY_COEFFICIENT) + (A - BiquadConstants::UNITY_COEFFICIENT) * cos_omega - BiquadConstants::HALF_DIVISOR * alpha * sqrt_A);
    double a0 = (A + BiquadConstants::UNITY_COEFFICIENT) - (A - BiquadConstants::UNITY_COEFFICIENT) * cos_omega + BiquadConstants::HALF_DIVISOR * alpha * sqrt_A;
    double a1 = BiquadConstants::NEGATIVE_TWO * ((A - BiquadConstants::UNITY_COEFFICIENT) - (A + BiquadConstants::UNITY_COEFFICIENT) * cos_omega);
    double a2 = (A + BiquadConstants::UNITY_COEFFICIENT) - (A - BiquadConstants::UNITY_COEFFICIENT) * cos_omega - BiquadConstants::HALF_DIVISOR * alpha * sqrt_A;

    setCoefficients(a0, a1, a2, b0, b1, b2);
}

void AudioFX::BiquadFilter::calculateHighShelf(double frequency, double sampleRate, double q, double gainDB) {
    double omega = BiquadConstants::TWO_PI_MULTIPLIER * BiquadConstants::PI_PRECISE * frequency / sampleRate;
    double sin_omega = std::sin(omega);
    double cos_omega = std::cos(omega);
    double alpha = sin_omega / (BiquadConstants::HALF_DIVISOR * q);

    double A = std::pow(BiquadConstants::POWER_BASE, gainDB / BiquadConstants::PEAKING_DB_DIVISOR);
    double sqrt_A = std::sqrt(A);

    double b0 = A * ((A + BiquadConstants::UNITY_COEFFICIENT) - (A - BiquadConstants::UNITY_COEFFICIENT) * cos_omega + BiquadConstants::HALF_DIVISOR * alpha * sqrt_A);
    double b1 = BiquadConstants::NEGATIVE_TWO * A * ((A - BiquadConstants::UNITY_COEFFICIENT) - (A + BiquadConstants::UNITY_COEFFICIENT) * cos_omega);
    double b2 = A * ((A + BiquadConstants::UNITY_COEFFICIENT) - (A - BiquadConstants::UNITY_COEFFICIENT) * cos_omega - BiquadConstants::HALF_DIVISOR * alpha * sqrt_A);
    double a0 = (A + BiquadConstants::UNITY_COEFFICIENT) + (A - BiquadConstants::UNITY_COEFFICIENT) * cos_omega + BiquadConstants::HALF_DIVISOR * alpha * sqrt_A;
    double a1 = BiquadConstants::NEGATIVE_TWO * ((A - BiquadConstants::UNITY_COEFFICIENT) + (A + BiquadConstants::UNITY_COEFFICIENT) * cos_omega);
    double a2 = (A + BiquadConstants::UNITY_COEFFICIENT) + (A - BiquadConstants::UNITY_COEFFICIENT) * cos_omega - BiquadConstants::HALF_DIVISOR * alpha * sqrt_A;

    setCoefficients(a0, a1, a2, b0, b1, b2);
}

void AudioFX::BiquadFilter::calculateAllpass(double frequency, double sampleRate, double q) {
    double omega = BiquadConstants::TWO_PI_MULTIPLIER * BiquadConstants::PI_PRECISE * frequency / sampleRate;
    double sin_omega = std::sin(omega);
    double cos_omega = std::cos(omega);
    double alpha = sin_omega / (BiquadConstants::HALF_DIVISOR * q);

    double b0 = BiquadConstants::UNITY_COEFFICIENT - alpha;
    double b1 = BiquadConstants::NEGATIVE_TWO * cos_omega;
    double b2 = BiquadConstants::UNITY_COEFFICIENT + alpha;
    double a0 = BiquadConstants::UNITY_COEFFICIENT + alpha;
    double a1 = BiquadConstants::NEGATIVE_TWO * cos_omega;
    double a2 = BiquadConstants::UNITY_COEFFICIENT - alpha;

    setCoefficients(a0, a1, a2, b0, b1, b2);
}

void AudioFX::BiquadFilter::process(const float* input, float* output, size_t numSamples) {
    // Optimized C++17 implementation - Direct Form II Transposed
    double y1 = m_y1, y2 = m_y2;

    // Process in larger blocks for better cache efficiency and vectorization opportunities
    constexpr size_t BLOCK_SIZE = PROCESSING_BLOCK_SIZE;
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
        if (block + EqualizerConstants::STEP_INCREMENT < fullBlocks) {
            AUDIO_PREFETCH(&input[offset + BLOCK_SIZE], EqualizerConstants::PREFETCH_READ, EqualizerConstants::PREFETCH_LOCALITY);
            AUDIO_PREFETCH(&output[offset + BLOCK_SIZE], EqualizerConstants::PREFETCH_WRITE, EqualizerConstants::PREFETCH_LOCALITY);
        }

        // Process UNROLL_FACTOR_BIQUAD samples at a time for better ILP
        for (size_t i = SAMPLE_INDEX_0; i < BLOCK_SIZE; i += UNROLL_FACTOR_BIQUAD) {
            // Sample 0
            double x0 = static_cast<double>(input[offset + i]);
            double w0 = x0 - b1 * y1 - b2 * y2;
            double y0 = a0 * w0 + a1 * y1 + a2 * y2;

            // Sample 1
            double x1 = static_cast<double>(input[offset + i + SAMPLE_INDEX_1]);
            double w1 = x1 - b1 * w0 - b2 * y1;
            double y1_new = a0 * w1 + a1 * w0 + a2 * y1;

            // Sample 2
            double x2 = static_cast<double>(input[offset + i + SAMPLE_INDEX_2]);
            double w2 = x2 - b1 * w1 - b2 * w0;
            double y2_new = a0 * w2 + a1 * w1 + a2 * w0;

            // Sample 3
            double x3 = static_cast<double>(input[offset + i + SAMPLE_INDEX_3]);
            double w3 = x3 - b1 * w2 - b2 * w1;
            double y3 = a0 * w3 + a1 * w2 + a2 * w1;

            // Update state for next iteration
            y2 = w2;
            y1 = (std::abs(w3) < EPSILON) ? RESET_VALUE : w3;

            // Write outputs
            output[offset + i] = static_cast<float>(y0);
            output[offset + i + SAMPLE_INDEX_1] = static_cast<float>(y1_new);
            output[offset + i + SAMPLE_INDEX_2] = static_cast<float>(y2_new);
            output[offset + i + SAMPLE_INDEX_3] = static_cast<float>(y3);
        }
    }

    // Process remaining samples
    size_t offset = fullBlocks * BLOCK_SIZE;
    for (size_t i = SAMPLE_INDEX_0; i < remaining; ++i) {
        double x = static_cast<double>(input[offset + i]);
        double w = x - b1 * y1 - b2 * y2;
        double y = a0 * w + a1 * y1 + a2 * y2;

        y2 = y1;
        y1 = (std::abs(w) < EPSILON) ? RESET_VALUE : w;

        output[offset + i] = static_cast<float>(y);
    }

    m_y1 = y1;
    m_y2 = y2;
}

void AudioFX::BiquadFilter::processStereo(const float* inputL, const float* inputR,
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

    // Process UNROLL_FACTOR_BIQUAD samples at a time for both channels
    size_t i = SAMPLE_INDEX_0;
    for (; i + SAMPLE_INDEX_3 < numSamples; i += UNROLL_FACTOR_BIQUAD) {
        // Prefetch next data
        AUDIO_PREFETCH(&inputL[i + PREFETCH_DISTANCE], EqualizerConstants::PREFETCH_READ, EqualizerConstants::PREFETCH_LOCALITY);
        AUDIO_PREFETCH(&inputR[i + PREFETCH_DISTANCE], EqualizerConstants::PREFETCH_READ, EqualizerConstants::PREFETCH_LOCALITY);

        // Left channel - UNROLL_FACTOR_BIQUAD samples
        double xL0 = static_cast<double>(inputL[i]);
        double wL0 = xL0 - b1 * y1L - b2 * y2L;
        double yL0 = a0 * wL0 + a1 * y1L + a2 * y2L;

        double xL1 = static_cast<double>(inputL[i + SAMPLE_INDEX_1]);
        double wL1 = xL1 - b1 * wL0 - b2 * y1L;
        double yL1 = a0 * wL1 + a1 * wL0 + a2 * y1L;

        double xL2 = static_cast<double>(inputL[i + SAMPLE_INDEX_2]);
        double wL2 = xL2 - b1 * wL1 - b2 * wL0;
        double yL2 = a0 * wL2 + a1 * wL1 + a2 * wL0;

        double xL3 = static_cast<double>(inputL[i + SAMPLE_INDEX_3]);
        double wL3 = xL3 - b1 * wL2 - b2 * wL1;
        double yL3 = a0 * wL3 + a1 * wL2 + a2 * wL1;

        // Right channel - UNROLL_FACTOR_BIQUAD samples
        double xR0 = static_cast<double>(inputR[i]);
        double wR0 = xR0 - b1 * y1R - b2 * y2R;
        double yR0 = a0 * wR0 + a1 * y1R + a2 * y2R;

        double xR1 = static_cast<double>(inputR[i + SAMPLE_INDEX_1]);
        double wR1 = xR1 - b1 * wR0 - b2 * y1R;
        double yR1 = a0 * wR1 + a1 * wR0 + a2 * y1R;

        double xR2 = static_cast<double>(inputR[i + SAMPLE_INDEX_2]);
        double wR2 = xR2 - b1 * wR1 - b2 * wR0;
        double yR2 = a0 * wR2 + a1 * wR1 + a2 * wR0;

        double xR3 = static_cast<double>(inputR[i + SAMPLE_INDEX_3]);
        double wR3 = xR3 - b1 * wR2 - b2 * wR1;
        double yR3 = a0 * wR3 + a1 * wR2 + a2 * wR1;

        // Update states
        y2L = wL2;
        y1L = (std::abs(wL3) < EPSILON) ? RESET_VALUE : wL3;
        y2R = wR2;
        y1R = (std::abs(wR3) < EPSILON) ? RESET_VALUE : wR3;

        // Write outputs
        outputL[i] = static_cast<float>(yL0);
        outputL[i + SAMPLE_INDEX_1] = static_cast<float>(yL1);
        outputL[i + SAMPLE_INDEX_2] = static_cast<float>(yL2);
        outputL[i + SAMPLE_INDEX_3] = static_cast<float>(yL3);

        outputR[i] = static_cast<float>(yR0);
        outputR[i + SAMPLE_INDEX_1] = static_cast<float>(yR1);
        outputR[i + SAMPLE_INDEX_2] = static_cast<float>(yR2);
        outputR[i + SAMPLE_INDEX_3] = static_cast<float>(yR3);
    }

    // Process remaining samples
    for (; i < numSamples; ++i) {
        // Left channel
        double xL = static_cast<double>(inputL[i]);
        double wL = xL - b1 * y1L - b2 * y2L;
        double yL = a0 * wL + a1 * y1L + a2 * y2L;
        y2L = y1L;
        y1L = (std::abs(wL) < EPSILON) ? RESET_VALUE : wL;
        outputL[i] = static_cast<float>(yL);

        // Right channel
        double xR = static_cast<double>(inputR[i]);
        double wR = xR - b1 * y1R - b2 * y2R;
        double yR = a0 * wR + a1 * y1R + a2 * y2R;
        y2R = y1R;
        y1R = (std::abs(wR) < EPSILON) ? RESET_VALUE : wR;
        outputR[i] = static_cast<float>(yR);
    }

    m_y1 = y1L; m_y2 = y2L;
    m_y1R = y1R; m_y2R = y2R;
}

// C++17 pure - no SIMD optimizations

void BiquadFilter::reset() {
    m_y1 = m_y2 = RESET_VALUE;
    m_y1R = m_y2R = RESET_VALUE;
}

void BiquadFilter::getCoefficients(double& a0, double& a1, double& a2,
                                  double& b0, double& b1, double& b2) const {
    a0 = m_a0;
    a1 = m_a1;
    a2 = m_a2;
    b0 = UNITY_COEFFICIENT;
    b1 = m_b1;
    b2 = m_b2;
}

// C++17 modernized processing methods with SFINAE
template<typename T, typename>
void BiquadFilter::process(const std::vector<T>& input, std::vector<T>& output,
                          const std::string& location) {
    // C++17 validation at runtime
    if (input.size() != output.size()) {
        std::ostringstream oss;
        oss << "Input and output spans must have the same size. Input: "
            << input.size() << ", Output: " << output.size() << " [" << location << "]";
        throw std::invalid_argument(oss.str());
    }

    if (input.empty()) return;

    // Use C++17 algorithms for processing
    double y1 = m_y1, y2 = m_y2;

    std::transform(input.begin(), input.end(), output.begin(),
                          [&](const T& sample) {
                              return process_sample_implementation(m_a0, m_a1, m_a2, m_b1, m_b2,
                                                                 sample, y1, y2);
                          });

    m_y1 = y1;
    m_y2 = y2;
}

template<typename T, typename>
void BiquadFilter::processStereo(const std::vector<T>& inputL, const std::vector<T>& inputR,
                                std::vector<T>& outputL, std::vector<T>& outputR,
                                const std::string& location) {
    // C++17 validation
    if (inputL.size() != inputR.size() || inputL.size() != outputL.size() || inputR.size() != outputR.size()) {
        std::ostringstream oss;
        oss << "All spans must have the same size [" << location << "]";
        throw std::invalid_argument(oss.str());
    }

    if (inputL.empty()) return;

    // Process left channel
    double y1L = m_y1, y2L = m_y2;
    std::transform(inputL.begin(), inputL.end(), outputL.begin(),
                          [&](const T& sample) {
                              return process_sample_implementation(m_a0, m_a1, m_a2, m_b1, m_b2,
                                                                 sample, y1L, y2L);
                          });

    // Process right channel
    double y1R = m_y1R, y2R = m_y2R;
    std::transform(inputR.begin(), inputR.end(), outputR.begin(),
                          [&](const T& sample) {
                              return process_sample_implementation(m_a0, m_a1, m_a2, m_b1, m_b2,
                                                                 sample, y1R, y2R);
                          });

    m_y1 = y1L; m_y2 = y2L;
    m_y1R = y1R; m_y2R = y2R;
}

// C++17 formatted debugging
std::string BiquadFilter::getDebugInfo(const std::string& location) const {
    std::ostringstream oss;
    oss << std::fixed << std::setprecision(6);
    oss << "BiquadFilter Debug Info:\n"
        << "  Coefficients: a0=" << m_a0 << ", a1=" << m_a1 << ", a2=" << m_a2
        << ", b1=" << m_b1 << ", b2=" << m_b2 << "\n"
        << "  State: y1=" << m_y1 << ", y2=" << m_y2 << ", y1R=" << m_y1R
        << ", y2R=" << m_y2R << "\n"
        << "  Location: " << location << "\n";
    return oss.str();
}

// Explicit template instantiations for common audio types
template void AudioFX::BiquadFilter::process<float>(const std::vector<float>&, std::vector<float>&, const std::string&);
template void AudioFX::BiquadFilter::process<double>(const std::vector<double>&, std::vector<double>&, const std::string&);
template void AudioFX::BiquadFilter::processStereo<float>(const std::vector<float>&, const std::vector<float>&,
                                                std::vector<float>&, std::vector<float>&, const std::string&);
template void AudioFX::BiquadFilter::processStereo<double>(const std::vector<double>&, const std::vector<double>&,
                                                 std::vector<double>&, std::vector<double>&, const std::string&);

} // namespace AudioFX
