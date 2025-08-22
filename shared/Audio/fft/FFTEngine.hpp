#pragma once

#ifdef __cplusplus

// C++17 standard headers ONLY - No C++20 features
#include <cstddef>
#include <cstdint>
#include <complex>
#include <memory>
#include <array>
#include <vector>
#include <stdexcept>
#include <cmath>
#include <algorithm>
#include <type_traits>

namespace AudioFX {

// C++17 constexpr constants for FFT
namespace FFTConstants {
    constexpr size_t MIN_FFT_SIZE = 64;
    constexpr size_t MAX_FFT_SIZE = 8192;
    constexpr size_t DEFAULT_FFT_SIZE = 1024;
    constexpr double PI = 3.14159265358979323846;
    constexpr double TWO_PI = 2.0 * PI;
}

// C++17 type traits for validation
template<typename T>
struct is_fft_float_type {
    static constexpr bool value = std::is_same_v<T, float> || std::is_same_v<T, double>;
};

template<typename T>
constexpr bool is_fft_float_type_v = is_fft_float_type<T>::value;

/**
 * @brief Interface for FFT engines - C++17 pure implementation
 */
class IFFTEngine {
public:
    virtual ~IFFTEngine() = default;

    virtual void forwardR2C(const float* real, std::vector<float>& realOut, std::vector<float>& imagOut) = 0;
    virtual void inverseC2R(const std::vector<float>& realIn, const std::vector<float>& imagIn, float* real) = 0;
    virtual size_t getSize() const = 0;
};

/**
 * @brief Simple radix-2 FFT implementation - C++17 compliant
 * No external dependencies, pure C++17
 */
class SimpleFFT : public IFFTEngine {
public:
    explicit SimpleFFT(size_t size) : size_(size) {
        if (!isPowerOfTwo(size)) {
            throw std::invalid_argument("FFT size must be a power of 2");
        }
        if (size < FFTConstants::MIN_FFT_SIZE || size > FFTConstants::MAX_FFT_SIZE) {
            throw std::invalid_argument("FFT size out of range");
        }

        // Precompute twiddle factors
        computeTwiddleFactors();
    }

    void forwardR2C(const float* real, std::vector<float>& realOut, std::vector<float>& imagOut) override {
        // Copy input to complex array
        realOut.resize(size_);
        imagOut.resize(size_);

        for (size_t i = 0; i < size_; ++i) {
            realOut[i] = real[i];
            imagOut[i] = 0.0f;
        }

        // Perform FFT
        fftRadix2(realOut, imagOut, false);
    }

    void inverseC2R(const std::vector<float>& realIn, const std::vector<float>& imagIn, float* real) override {
        std::vector<float> tempReal = realIn;
        std::vector<float> tempImag = imagIn;

        // Perform inverse FFT
        fftRadix2(tempReal, tempImag, true);

        // Copy real part and normalize
        float norm = 1.0f / static_cast<float>(size_);
        for (size_t i = 0; i < size_; ++i) {
            real[i] = tempReal[i] * norm;
        }
    }

    size_t getSize() const override { return size_; }

private:
    size_t size_;
    std::vector<float> twiddleReal_;
    std::vector<float> twiddleImag_;

    static bool isPowerOfTwo(size_t n) {
        return n && !(n & (n - 1));
    }

    void computeTwiddleFactors() {
        twiddleReal_.resize(size_ / 2);
        twiddleImag_.resize(size_ / 2);

        for (size_t i = 0; i < size_ / 2; ++i) {
            double angle = -FFTConstants::TWO_PI * static_cast<double>(i) / static_cast<double>(size_);
            twiddleReal_[i] = static_cast<float>(std::cos(angle));
            twiddleImag_[i] = static_cast<float>(std::sin(angle));
        }
    }

    void fftRadix2(std::vector<float>& real, std::vector<float>& imag, bool inverse) {
        // Bit reversal
        bitReverse(real, imag);

        // FFT computation
        for (size_t stage = 2; stage <= size_; stage *= 2) {
            size_t halfStage = stage / 2;
            size_t twiddleStep = size_ / stage;

            for (size_t k = 0; k < size_; k += stage) {
                for (size_t j = 0; j < halfStage; ++j) {
                    size_t idx1 = k + j;
                    size_t idx2 = idx1 + halfStage;
                    size_t twiddleIdx = j * twiddleStep;

                    float tReal = inverse ? -twiddleImag_[twiddleIdx] : twiddleImag_[twiddleIdx];
                    float tImag = twiddleReal_[twiddleIdx];

                    if (inverse) {
                        tReal = -tReal;
                    }

                    float tempReal = real[idx2] * twiddleReal_[twiddleIdx] - imag[idx2] * tReal;
                    float tempImag = real[idx2] * tReal + imag[idx2] * twiddleReal_[twiddleIdx];

                    real[idx2] = real[idx1] - tempReal;
                    imag[idx2] = imag[idx1] - tempImag;
                    real[idx1] += tempReal;
                    imag[idx1] += tempImag;
                }
            }
        }
    }

    void bitReverse(std::vector<float>& real, std::vector<float>& imag) {
        size_t bits = 0;
        size_t temp = size_;
        while (temp > 1) {
            temp >>= 1;
            bits++;
        }

        for (size_t i = 1; i < size_ - 1; ++i) {
            size_t rev = 0;
            size_t val = i;
            for (size_t j = 0; j < bits; ++j) {
                rev = (rev << 1) | (val & 1);
                val >>= 1;
            }

            if (i < rev) {
                std::swap(real[i], real[rev]);
                std::swap(imag[i], imag[rev]);
            }
        }
    }
};

// Factory function - C++17 style
inline std::unique_ptr<IFFTEngine> createFFTEngine(size_t size) {
    return std::make_unique<SimpleFFT>(size);
}

} // namespace AudioFX

#endif // __cplusplus
