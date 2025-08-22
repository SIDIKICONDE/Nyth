#pragma once

#ifdef __cplusplus
#include <cstddef>
#include <complex>
#include <memory>
#include <vector>
#include <stdexcept>
#include <cmath>

// Try to detect KissFFT headers. Users can also define KISSFFT_AVAILABLE=1 via build flags.
#if !defined(KISSFFT_AVAILABLE)
  #if defined(__has_include)
    #if __has_include(<kissfft/kiss_fftr.h>)
      #define KISSFFT_AVAILABLE 1
    #else
      #define KISSFFT_AVAILABLE 0
    #endif
  #else
    #define KISSFFT_AVAILABLE 0
  #endif
#endif

namespace AudioNR {

/**
 * Abstract FFT engine for real-valued signals.
 * Implementations may use KissFFT (if available) or a fallback radix-2 FFT.
 * All methods operate on length-N buffers where N is the configured fftSize.
 */
class IFFTEngine {
public:
    virtual ~IFFTEngine() = default;

    /**
     * @return FFT size configured for this engine.
     */
    virtual std::size_t getFftSize() const noexcept = 0;

    /**
     * Real-to-complex forward FFT.
     * - timeIn: pointer to N real samples (length = N)
     * - reOut, imOut: output arrays (length will be set to N)
     */
    virtual void forwardR2C(const float* timeIn,
                            std::vector<float>& reOut,
                            std::vector<float>& imOut) = 0;

    /**
     * Complex-to-real inverse FFT.
     * - reIn, imIn: input arrays (length = N)
     * - timeOut: pointer to output buffer (length = N)
     *
     * Implementations must apply the 1/N scale so that forward followed by
     * inverse reconstructs the original signal (within numeric error).
     */
    virtual void inverseC2R(const std::vector<float>& reIn,
                            const std::vector<float>& imIn,
                            float* timeOut) = 0;
};

/** Factory that returns KissFFT-based engine if available, otherwise a radix-2 engine. */
std::unique_ptr<IFFTEngine> createFFTEngine(std::size_t fftSize);

} // namespace AudioNR
#endif // __cplusplus

// ====== Header-only fallback implementation (Radix-2 Cooley-Tukey) ======
#ifdef __cplusplus
namespace AudioNR {

class Radix2FFTEngine final : public IFFTEngine {
public:
    explicit Radix2FFTEngine(std::size_t fftSize)
        : fftSize_(fftSize) {
        if (fftSize_ == 0 || (fftSize_ & (fftSize_ - 1)) != 0) {
            throw std::invalid_argument("FFTEngine: fftSize must be power of two and > 0");
        }
        precomputeTwiddles();
        work_.resize(fftSize_);
    }

    std::size_t getFftSize() const noexcept override { return fftSize_; }

    void forwardR2C(const float* timeIn,
                    std::vector<float>& reOut,
                    std::vector<float>& imOut) override {
        const std::size_t N = fftSize_;
        reOut.resize(N);
        imOut.resize(N);
        for (std::size_t i = 0; i < N; ++i) {
            work_[i] = { static_cast<float>(timeIn[i]), 0.0f };
        }
        fftInPlace(work_, /*inverse=*/false);
        for (std::size_t i = 0; i < N; ++i) {
            reOut[i] = work_[i].real();
            imOut[i] = work_[i].imag();
        }
    }

    void inverseC2R(const std::vector<float>& reIn,
                    const std::vector<float>& imIn,
                    float* timeOut) override {
        const std::size_t N = fftSize_;
        if (reIn.size() < N || imIn.size() < N) {
            throw std::invalid_argument("FFTEngine: input spectrum size mismatch");
        }
        for (std::size_t i = 0; i < N; ++i) {
            work_[i] = { reIn[i], imIn[i] };
        }
        fftInPlace(work_, /*inverse=*/true);
        const float scale = 1.0f / static_cast<float>(N);
        for (std::size_t i = 0; i < N; ++i) timeOut[i] = work_[i].real() * scale;
    }

private:
    std::size_t fftSize_;
    std::vector<std::complex<float>> work_;
    std::vector<std::complex<float>> twiddles_;

    static std::size_t reverseBits(std::size_t x, std::size_t nBits) {
        std::size_t r = 0;
        for (std::size_t i = 0; i < nBits; ++i) {
            r = (r << 1) | (x & 1);
            x >>= 1;
        }
        return r;
    }

    void precomputeTwiddles() {
        twiddles_.clear();
        for (std::size_t size = 2; size <= fftSize_; size <<= 1) {
            const std::size_t half = size >> 1;
            const float angle = 2.0f * static_cast<float>(M_PI) / static_cast<float>(size);
            for (std::size_t k = 0; k < half; ++k) {
                const float phase = angle * static_cast<float>(k);
                twiddles_.emplace_back(std::cos(phase), std::sin(phase));
            }
        }
    }

    void fftInPlace(std::vector<std::complex<float>>& data, bool inverse) const {
        const std::size_t N = data.size();
        if (N <= 1) return;
        // Bit-reversal permutation
        std::size_t nBits = 0, t = N;
        while (t > 1) { ++nBits; t >>= 1; }
        for (std::size_t i = 0; i < N; ++i) {
            const std::size_t j = reverseBits(i, nBits);
            if (i < j) std::swap(data[i], data[j]);
        }
        // Iterative Cooley-Tukey using precomputed twiddles
        std::size_t twiddleOffset = 0;
        for (std::size_t size = 2; size <= N; size <<= 1) {
            const std::size_t half = size >> 1;
            for (std::size_t start = 0; start < N; start += size) {
                for (std::size_t k = 0; k < half; ++k) {
                    std::complex<float> w = twiddles_[twiddleOffset + k];
                    if (inverse) w = std::conj(w);
                    const std::complex<float> tVal = w * data[start + k + half];
                    const std::complex<float> uVal = data[start + k];
                    data[start + k] = uVal + tVal;
                    data[start + k + half] = uVal - tVal;
                }
            }
            twiddleOffset += half;
        }
        // Note: scaling is applied in inverseC2R()
    }
};

inline std::unique_ptr<IFFTEngine> createFFTEngine(std::size_t fftSize) {
    // Hook: prefer KissFFT if available at compile time
#if KISSFFT_AVAILABLE
    struct KissEngine final : public IFFTEngine {
        explicit KissEngine(std::size_t N)
            : N_(N) {
            if (N_ == 0 || (N_ & (N_ - 1)) != 0) {
                throw std::invalid_argument("KissFFTEngine: fftSize must be power of two and > 0");
            }
            cfgFwd_ = kiss_fftr_alloc(static_cast<int>(N_), 0, nullptr, nullptr);
            cfgInv_ = kiss_fftr_alloc(static_cast<int>(N_), 1, nullptr, nullptr);
            if (!cfgFwd_ || !cfgInv_) throw std::runtime_error("KissFFTEngine: allocation failed");
            tmpRe_.resize(N_);
            tmpIm_.resize(N_);
            tmpSpec_.resize(N_/2 + 1);
        }
        ~KissEngine() override {
            if (cfgFwd_) free(cfgFwd_);
            if (cfgInv_) free(cfgInv_);
        }
        std::size_t getFftSize() const noexcept override { return N_; }
        void forwardR2C(const float* timeIn, std::vector<float>& reOut, std::vector<float>& imOut) override {
            reOut.resize(N_); imOut.resize(N_);
            kiss_fftr(cfgFwd_, timeIn, tmpSpec_.data());
            // tmpSpec_ has N/2+1 bins (DC..Nyquist). Mirror to full complex spectrum (Hermitian)
            reOut[0] = tmpSpec_[0].r; imOut[0] = tmpSpec_[0].i;
            for (std::size_t k = 1; k < N_/2; ++k) {
                reOut[k] = tmpSpec_[k].r; imOut[k] = tmpSpec_[k].i;
                reOut[N_-k] = tmpSpec_[k].r; imOut[N_-k] = -tmpSpec_[k].i;
            }
            reOut[N_/2] = tmpSpec_[N_/2].r; imOut[N_/2] = tmpSpec_[N_/2].i; // Nyquist
        }
        void inverseC2R(const std::vector<float>& reIn, const std::vector<float>& imIn, float* timeOut) override {
            if (reIn.size() < N_ || imIn.size() < N_) throw std::invalid_argument("KissFFTEngine: spectrum size mismatch");
            // Pack Hermitian half into tmpSpec_
            tmpSpec_[0].r = reIn[0]; tmpSpec_[0].i = imIn[0];
            for (std::size_t k = 1; k < N_/2; ++k) {
                tmpSpec_[k].r = reIn[k]; tmpSpec_[k].i = imIn[k];
            }
            tmpSpec_[N_/2].r = reIn[N_/2]; tmpSpec_[N_/2].i = imIn[N_/2];
            kiss_fftri(cfgInv_, tmpSpec_.data(), timeOut);
            const float scale = 1.0f / static_cast<float>(N_);
            for (std::size_t i = 0; i < N_; ++i) timeOut[i] *= scale;
        }
    private:
        std::size_t N_{};
        kiss_fftr_cfg cfgFwd_{};
        kiss_fftr_cfg cfgInv_{};
        std::vector<float> tmpRe_, tmpIm_;
        std::vector<kiss_fft_cpx> tmpSpec_;
    };
    return std::make_unique<KissEngine>(fftSize);
#else
    return std::make_unique<Radix2FFTEngine>(fftSize);
#endif
}

} // namespace AudioNR
#endif // __cplusplus


