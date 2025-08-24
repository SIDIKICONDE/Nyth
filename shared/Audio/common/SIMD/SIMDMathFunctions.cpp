#include "SIMDMathFunctions.hpp"
#include "SIMDCore.hpp"
#include <algorithm>
#include <cmath>
#include <iostream>
#include <iomanip>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

namespace AudioNR {
namespace SIMD {

// ====================
// Constantes mathématiques
// ====================

namespace {
    constexpr float EULER_MASCHERONI = 0.57721566490153286060651209008240243104215933593992f;
    constexpr float EPSILON = 1e-12f;
    constexpr float MIN_LOG_ARG = 1e-20f;
    constexpr float MAX_FLOAT = std::numeric_limits<float>::max();

    // Constantes pour les séries
    constexpr int MAX_SERIES_ITERATIONS = 50;
    constexpr int MAX_CF_ITERATIONS = 100;
    constexpr float CF_INIT_VALUE = 1e10f;
    constexpr float SERIES_THRESHOLD = 0.8f;
    constexpr float ASYMPTOTIC_THRESHOLD = 40.0f;
}

// ====================
// Implémentation SIMDMathFunctions
// ====================

// Version scalaire de référence pour expint_e1
float SIMDMathFunctions::expint_e1_scalar(float x) {
    if (x <= 0.0f) return std::numeric_limits<float>::quiet_NaN();
    if (x < 1e-10f) return -EULER_MASCHERONI - std::log(x);

    if (x < SERIES_THRESHOLD) {
        // Série pour x < 0.8
        float sum = -EULER_MASCHERONI - std::log(x);
        float term = -x;
        for (int k = 1; k <= MAX_SERIES_ITERATIONS; ++k) {
            sum += term;
            if (std::abs(term) < EPSILON * std::abs(sum)) break;
            term *= (-x * k) / ((k + 1.0f) * (k + 1.0f));
        }
        return sum;
    } else if (x > ASYMPTOTIC_THRESHOLD) {
        // Approximation asymptotique
        float invx = 1.0f / x;
        float poly = 1.0f - invx + 2.0f * invx * invx - 6.0f * invx * invx * invx;
        return std::exp(-x) * invx * poly;
    } else {
        // Fraction continue
        float b = x + 1.0f;
        float c = CF_INIT_VALUE;
        float d = 1.0f / b;
        float h = d;
        for (int i = 1; i <= MAX_CF_ITERATIONS; ++i) {
            float a = -static_cast<float>(i * i);
            b += 2.0f;
            d = 1.0f / (a * d + b);
            float del = c * d;
            h *= del;
            if (std::abs(del - 1.0f) < EPSILON) break;
            c = b + a / c;
        }
        return h * std::exp(-x);
    }
}

// Version vectorisée d'expint_e1
void SIMDMathFunctions::expint_e1_vectorized(const float* x, float* result, size_t count) {
    for (size_t i = 0; i < count; ++i) {
        result[i] = expint_e1_scalar(x[i]);
    }
}

// Version scalaire de référence pour expint_ei
float SIMDMathFunctions::expint_ei_scalar(float x) {
    if (x <= 0.0f) return std::numeric_limits<float>::quiet_NaN();

    float sum = EULER_MASCHERONI + std::log(x);
    float term = x;
    float c = 0.0f; // Correction de Kahan

    for (int k = 1; k <= MAX_SERIES_ITERATIONS; ++k) {
        float y = term / k - c;
        float t = sum + y;
        c = (t - sum) - y;
        sum = t;

        if (std::abs(term / k) < EPSILON * std::abs(sum)) break;
        term *= x / (k + 1);
    }
    return sum;
}

// Version vectorisée d'expint_ei
void SIMDMathFunctions::expint_ei_vectorized(const float* x, float* result, size_t count) {
    for (size_t i = 0; i < count; ++i) {
        result[i] = expint_ei_scalar(x[i]);
    }
}

// Version scalaire de référence pour expint_en
float SIMDMathFunctions::expint_en_scalar(int n, float x) {
    if (n <= 0 || x <= 0.0f) return std::numeric_limits<float>::quiet_NaN();
    if (n == 1) return expint_e1_scalar(x);

    // Récurrence arrière pour n grand
    if (n > 10 && x < static_cast<float>(n) / 2.0f) {
        const int nstart = n + static_cast<int>(5 + std::sqrt(40.0f * n));
        float Ekp1 = 0.0f;
        float Ek = 1.0f;

        for (int k = nstart; k > n; --k) {
            Ek = (std::exp(-x) + x * Ek) / static_cast<float>(k - 1);
        }

        float En_unnormalized = Ek;

        for (int k = n; k > 1; --k) {
            Ek = (std::exp(-x) + x * Ek) / static_cast<float>(k - 1);
        }

        float scale = expint_e1_scalar(x) / Ek;
        return En_unnormalized * scale;
    } else {
        // Récurrence avant
        float Ek = expint_e1_scalar(x);
        for (int k = 2; k <= n; ++k) {
            Ek = (std::exp(-x) - x * Ek) / static_cast<float>(k - 1);
            if (Ek < MIN_LOG_ARG) return 0.0f;
        }
        return Ek;
    }
}

// Version vectorisée d'expint_en
void SIMDMathFunctions::expint_en_vectorized(int n, const float* x, float* result, size_t count) {
    for (size_t i = 0; i < count; ++i) {
        result[i] = expint_en_scalar(n, x[i]);
    }
}

// Fonctions trigonométriques vectorisées
void SIMDMathFunctions::sin_vectorized(const float* x, float* result, size_t count) {
    SIMDMath::sin(result, x, count);
}

void SIMDMathFunctions::cos_vectorized(const float* x, float* result, size_t count) {
    SIMDMath::cos(result, x, count);
}

void SIMDMathFunctions::tan_vectorized(const float* x, float* result, size_t count) {
    std::vector<float> sin_result(count), cos_result(count);
    SIMDMath::sin(sin_result.data(), x, count);
    SIMDMath::cos(cos_result.data(), x, count);

    for (size_t i = 0; i < count; ++i) {
        result[i] = sin_result[i] / cos_result[i];
    }
}

// Fonctions hyperboliques vectorisées
void SIMDMathFunctions::sinh_vectorized(const float* x, float* result, size_t count) {
    for (size_t i = 0; i < count; ++i) {
        result[i] = std::sinh(x[i]);
    }
}

void SIMDMathFunctions::cosh_vectorized(const float* x, float* result, size_t count) {
    for (size_t i = 0; i < count; ++i) {
        result[i] = std::cosh(x[i]);
    }
}

void SIMDMathFunctions::tanh_vectorized(const float* x, float* result, size_t count) {
    for (size_t i = 0; i < count; ++i) {
        result[i] = std::tanh(x[i]);
    }
}

// Fonctions logarithmiques et exponentielles
void SIMDMathFunctions::log2_vectorized(const float* x, float* result, size_t count) {
    for (size_t i = 0; i < count; ++i) {
        result[i] = std::log2(std::max(x[i], MIN_LOG_ARG));
    }
}

void SIMDMathFunctions::log10_vectorized(const float* x, float* result, size_t count) {
    for (size_t i = 0; i < count; ++i) {
        result[i] = std::log10(std::max(x[i], MIN_LOG_ARG));
    }
}

void SIMDMathFunctions::exp2_vectorized(const float* x, float* result, size_t count) {
    for (size_t i = 0; i < count; ++i) {
        result[i] = std::exp2(x[i]);
    }
}

void SIMDMathFunctions::exp10_vectorized(const float* x, float* result, size_t count) {
    for (size_t i = 0; i < count; ++i) {
        result[i] = std::pow(10.0f, x[i]);
    }
}

// Fonctions de puissance
void SIMDMathFunctions::pow_vectorized(const float* x, const float* y, float* result, size_t count) {
    for (size_t i = 0; i < count; ++i) {
        result[i] = std::pow(x[i], y[i]);
    }
}

void SIMDMathFunctions::sqrt_vectorized(const float* x, float* result, size_t count) {
    SIMDMath::sqrt(result, x, count);
}

void SIMDMathFunctions::cbrt_vectorized(const float* x, float* result, size_t count) {
    for (size_t i = 0; i < count; ++i) {
        result[i] = std::cbrt(x[i]);
    }
}

// Fonctions d'erreur
void SIMDMathFunctions::erf_vectorized(const float* x, float* result, size_t count) {
    for (size_t i = 0; i < count; ++i) {
        result[i] = std::erf(x[i]);
    }
}

void SIMDMathFunctions::erfc_vectorized(const float* x, float* result, size_t count) {
    for (size_t i = 0; i < count; ++i) {
        result[i] = std::erfc(x[i]);
    }
}

// Fonctions statistiques
float SIMDMathFunctions::mean(const float* data, size_t count) {
    if (count == 0) return 0.0f;
    return SIMDMath::sum(data, count) / static_cast<float>(count);
}

float SIMDMathFunctions::variance(const float* data, size_t count) {
    if (count <= 1) return 0.0f;

    float mean_val = mean(data, count);
    float sum_squares = 0.0f;

    for (size_t i = 0; i < count; ++i) {
        float diff = data[i] - mean_val;
        sum_squares += diff * diff;
    }

    return sum_squares / static_cast<float>(count - 1);
}

float SIMDMathFunctions::stddev(const float* data, size_t count) {
    return std::sqrt(variance(data, count));
}

void SIMDMathFunctions::normalize(float* data, size_t count, float target_rms) {
    float current_rms = std::sqrt(SIMDMath::rms(data, count));
    if (current_rms > EPSILON) {
        float gain = target_rms / current_rms;
        SIMDUtils::applyGain(data, count, gain);
    }
}

// Fonctions de filtrage
void SIMDMathFunctions::apply_lowpass_filter(float* data, size_t count, float cutoff, float sampleRate) {
    const float rc = 1.0f / (cutoff * 2.0f * M_PI);
    const float dt = 1.0f / sampleRate;
    const float alpha = dt / (rc + dt);

    float y = data[0];
    for (size_t i = 1; i < count; ++i) {
        y = y + alpha * (data[i] - y);
        data[i] = y;
    }
}

void SIMDMathFunctions::apply_highpass_filter(float* data, size_t count, float cutoff, float sampleRate) {
    const float rc = 1.0f / (cutoff * 2.0f * M_PI);
    const float dt = 1.0f / sampleRate;
    const float alpha = rc / (rc + dt);

    float y = data[0];
    float prev_x = data[0];

    for (size_t i = 1; i < count; ++i) {
        y = alpha * (y + data[i] - prev_x);
        prev_x = data[i];
        data[i] = y;
    }
}

void SIMDMathFunctions::apply_bandpass_filter(float* data, size_t count, float lowCut, float highCut, float sampleRate) {
    // Appliquer un filtre passe-bas puis passe-haut
    apply_lowpass_filter(data, count, highCut, sampleRate);
    apply_highpass_filter(data, count, lowCut, sampleRate);
}

// Fonctions de transformation
void SIMDMathFunctions::apply_soft_clipper(float* data, size_t count, float threshold) {
    for (size_t i = 0; i < count; ++i) {
        float x = data[i];
        if (x > threshold) {
            data[i] = threshold + (1.0f - std::exp(-(x - threshold))) * 0.1f;
        } else if (x < -threshold) {
            data[i] = -threshold - (1.0f - std::exp(-(x + threshold))) * 0.1f;
        }
    }
}

void SIMDMathFunctions::apply_hard_clipper(float* data, size_t count, float threshold) {
    SIMDUtils::clamp(data, count, -threshold, threshold);
}

void SIMDMathFunctions::apply_tanh_distortion(float* data, size_t count, float drive) {
    for (size_t i = 0; i < count; ++i) {
        data[i] = std::tanh(data[i] * drive);
    }
}

void SIMDMathFunctions::apply_cubic_distortion(float* data, size_t count, float drive) {
    for (size_t i = 0; i < count; ++i) {
        float x = data[i] * drive;
        data[i] = x - (1.0f/3.0f) * x * x * x;
        // Normaliser pour éviter la saturation
        if (std::abs(data[i]) > 1.0f) {
            data[i] = std::copysign(1.0f, data[i]);
        }
    }
}

// ====================
// Implémentation SIMDFilter
// ====================

SIMDFilter::SIMDFilter(FilterType type, float frequency, float q)
    : type_(type), frequency_(frequency), q_(q), x1_(0), x2_(0), y1_(0), y2_(0) {
    updateCoefficients();
}

void SIMDFilter::process(float* data, size_t count) {
    if (!enabled_) return;

    for (size_t i = 0; i < count; ++i) {
        float x = data[i];

        // Filtre biquad : y = a0*x + a1*x1 + a2*x2 - b1*y1 - b2*y2
        float y = a0_ * x + a1_ * x1_ + a2_ * x2_ - b1_ * y1_ - b2_ * y2_;

        // Mise à jour des états
        x2_ = x1_;
        x1_ = x;
        y2_ = y1_;
        y1_ = y;

        data[i] = y;
    }
}

std::string SIMDFilter::getName() const {
    switch (type_) {
        case LOWPASS: return "SIMD Lowpass Filter";
        case HIGHPASS: return "SIMD Highpass Filter";
        case BANDPASS: return "SIMD Bandpass Filter";
        case NOTCH: return "SIMD Notch Filter";
        default: return "SIMD Filter";
    }
}

bool SIMDFilter::isSIMDAccelerated() const {
    return SIMDDetector::hasSIMD();
}

void SIMDFilter::setFrequency(float frequency) {
    frequency_ = frequency;
    updateCoefficients();
}

void SIMDFilter::setQ(float q) {
    q_ = q;
    updateCoefficients();
}

void SIMDFilter::updateCoefficients() {
    float omega = 2.0f * M_PI * frequency_ / sampleRate_;
    float alpha = std::sin(omega) / (2.0f * q_);
    float cos_omega = std::cos(omega);

    switch (type_) {
        case LOWPASS:
            a0_ = (1.0f - cos_omega) / 2.0f;
            a1_ = 1.0f - cos_omega;
            a2_ = (1.0f - cos_omega) / 2.0f;
            b1_ = -2.0f * cos_omega;
            b2_ = 1.0f - alpha;
            break;

        case HIGHPASS:
            a0_ = (1.0f + cos_omega) / 2.0f;
            a1_ = -(1.0f + cos_omega);
            a2_ = (1.0f + cos_omega) / 2.0f;
            b1_ = -2.0f * cos_omega;
            b2_ = 1.0f - alpha;
            break;

        case BANDPASS:
            a0_ = alpha;
            a1_ = 0.0f;
            a2_ = -alpha;
            b1_ = -2.0f * cos_omega;
            b2_ = 1.0f - alpha;
            break;

        case NOTCH:
            a0_ = 1.0f;
            a1_ = -2.0f * cos_omega;
            a2_ = 1.0f;
            b1_ = -2.0f * cos_omega;
            b2_ = 1.0f - alpha;
            break;
    }

    // Normalisation
    float a0_norm = 1.0f / (1.0f + alpha);
    a0_ *= a0_norm;
    a1_ *= a0_norm;
    a2_ *= a0_norm;
    b1_ *= a0_norm;
    b2_ *= a0_norm;
}

// ====================
// Implémentation SIMDDistortion
// ====================

SIMDDistortion::SIMDDistortion(DistortionType type, float drive, float mix)
    : type_(type), drive_(drive), mix_(mix) {}

void SIMDDistortion::process(float* data, size_t count) {
    if (!enabled_) return;

    for (size_t i = 0; i < count; ++i) {
        float x = data[i];
        float y = x;

        switch (type_) {
            case SOFT_CLIP:
                SIMDMathFunctions::apply_soft_clipper(&y, 1, drive_);
                break;
            case HARD_CLIP:
                SIMDMathFunctions::apply_hard_clipper(&y, 1, drive_);
                break;
            case TANH:
                SIMDMathFunctions::apply_tanh_distortion(&y, 1, drive_);
                break;
            case CUBIC:
                SIMDMathFunctions::apply_cubic_distortion(&y, 1, drive_);
                break;
            case ARCTAN:
                y = std::atan(x * drive_) / (M_PI / 2.0f);
                break;
        }

        data[i] = x * (1.0f - mix_) + y * mix_;
    }
}

std::string SIMDDistortion::getName() const {
    switch (type_) {
        case SOFT_CLIP: return "SIMD Soft Clip Distortion";
        case HARD_CLIP: return "SIMD Hard Clip Distortion";
        case TANH: return "SIMD Tanh Distortion";
        case CUBIC: return "SIMD Cubic Distortion";
        case ARCTAN: return "SIMD Arctan Distortion";
        default: return "SIMD Distortion";
    }
}

bool SIMDDistortion::isSIMDAccelerated() const {
    return SIMDDetector::hasSIMD();
}

void SIMDDistortion::setDrive(float drive) {
    drive_ = drive;
}

void SIMDDistortion::setMix(float mix) {
    mix_ = std::max(0.0f, std::min(1.0f, mix));
}

// ====================
// Implémentation SIMDReverb
// ====================

SIMDReverb::SIMDReverb(float decay, float mix, float roomSize)
    : decay_(decay), mix_(mix), roomSize_(roomSize),
      delayIndex1_(0), delayIndex2_(0), delayIndex3_(0) {
    // Initialiser les buffers de delay
    delayLength1_ = static_cast<size_t>(0.0297f * sampleRate_); // ~30ms
    delayLength2_ = static_cast<size_t>(0.0371f * sampleRate_); // ~37ms
    delayLength3_ = static_cast<size_t>(0.0419f * sampleRate_); // ~42ms

    delayBuffer1_.resize(delayLength1_, 0.0f);
    delayBuffer2_.resize(delayLength2_, 0.0f);
    delayBuffer3_.resize(delayLength3_, 0.0f);
}

void SIMDReverb::process(float* data, size_t count) {
    if (!enabled_) return;

    for (size_t i = 0; i < count; ++i) {
        float x = data[i];

        // Lecture des delays
        float delayed1 = delayBuffer1_[delayIndex1_];
        float delayed2 = delayBuffer2_[delayIndex2_];
        float delayed3 = delayBuffer3_[delayIndex3_];

        // Mixage des delays
        float reverb = (delayed1 + delayed2 + delayed3) / 3.0f * decay_;

        // Écriture dans les buffers avec feedback
        delayBuffer1_[delayIndex1_] = x + reverb * 0.3f;
        delayBuffer2_[delayIndex2_] = x + reverb * 0.3f;
        delayBuffer3_[delayIndex3_] = x + reverb * 0.3f;

        // Mixage final
        data[i] = x * (1.0f - mix_) + reverb * mix_;

        // Avancement des indices
        delayIndex1_ = (delayIndex1_ + 1) % delayLength1_;
        delayIndex2_ = (delayIndex2_ + 1) % delayLength2_;
        delayIndex3_ = (delayIndex3_ + 1) % delayLength3_;
    }
}

std::string SIMDReverb::getName() const {
    return "SIMD Reverb";
}

bool SIMDReverb::isSIMDAccelerated() const {
    return SIMDDetector::hasSIMD();
}

void SIMDReverb::setDecay(float decay) {
    decay_ = std::max(0.0f, std::min(1.0f, decay));
}

void SIMDReverb::setMix(float mix) {
    mix_ = std::max(0.0f, std::min(1.0f, mix));
}

void SIMDReverb::setRoomSize(float roomSize) {
    roomSize_ = std::max(0.1f, std::min(2.0f, roomSize));
}

// ====================
// Implémentation SIMDDelay
// ====================

SIMDDelay::SIMDDelay(float delayMs, float feedback, float mix)
    : delayMs_(delayMs), feedback_(feedback), mix_(mix), delayIndex_(0) {
    delayLength_ = static_cast<size_t>((delayMs_ / 1000.0f) * sampleRate_);
    delayBuffer_.resize(delayLength_, 0.0f);
}

void SIMDDelay::process(float* data, size_t count) {
    if (!enabled_) return;

    for (size_t i = 0; i < count; ++i) {
        float x = data[i];

        // Lecture du signal retardé
        float delayed = delayBuffer_[delayIndex_];

        // Mixage avec feedback
        float input = x + delayed * feedback_;

        // Écriture dans le buffer
        delayBuffer_[delayIndex_] = input;

        // Mixage final
        data[i] = x * (1.0f - mix_) + delayed * mix_;

        // Avancement de l'index
        delayIndex_ = (delayIndex_ + 1) % delayLength_;
    }
}

std::string SIMDDelay::getName() const {
    return "SIMD Delay";
}

bool SIMDDelay::isSIMDAccelerated() const {
    return SIMDDetector::hasSIMD();
}

void SIMDDelay::setDelayMs(float delayMs) {
    delayMs_ = std::max(1.0f, std::min(2000.0f, delayMs));
    delayLength_ = static_cast<size_t>((delayMs_ / 1000.0f) * sampleRate_);
    delayBuffer_.resize(delayLength_, 0.0f);
    delayIndex_ = 0;
}

void SIMDDelay::setFeedback(float feedback) {
    feedback_ = std::max(0.0f, std::min(0.99f, feedback));
}

void SIMDDelay::setMix(float mix) {
    mix_ = std::max(0.0f, std::min(1.0f, mix));
}

// ====================
// Implémentation SIMDProcessingChain
// ====================

SIMDProcessingChain::SIMDProcessingChain() : enabled_(true) {}

SIMDProcessingChain::~SIMDProcessingChain() = default;

void SIMDProcessingChain::addProcessor(std::unique_ptr<SIMDProcessor> processor) {
    processors_.push_back(std::move(processor));
}

void SIMDProcessingChain::removeProcessor(size_t index) {
    if (index < processors_.size()) {
        processors_.erase(processors_.begin() + index);
    }
}

void SIMDProcessingChain::clear() {
    processors_.clear();
}

void SIMDProcessingChain::process(float* data, size_t count) {
    if (!enabled_) return;

    for (auto& processor : processors_) {
        if (processor && processor->isEnabled()) {
            processor->process(data, count);
        }
    }
}

void SIMDProcessingChain::processBlock(float* data, size_t count) {
    process(data, count);
}

SIMDProcessor* SIMDProcessingChain::getProcessor(size_t index) const {
    if (index < processors_.size()) {
        return processors_[index].get();
    }
    return nullptr;
}

// ====================
// Implémentation MathBenchmark
// ====================

MathBenchmark::MathBenchmarkResult MathBenchmark::benchmarkMathFunction(
    std::function<void(const float*, float*, size_t)> vectorizedFunc,
    std::function<float(float)> scalarFunc,
    const std::string& name,
    size_t count,
    int iterations
) {
    // Préparation des données
    std::vector<float> input(count);
    std::vector<float> output_vectorized(count);
    std::vector<float> output_scalar(count);

    for (size_t i = 0; i < count; ++i) {
        input[i] = 0.1f + static_cast<float>(rand()) / RAND_MAX * 10.0f; // Éviter les valeurs problématiques
    }

    // Benchmark vectorisé
    auto start = std::chrono::high_resolution_clock::now();
    for (int iter = 0; iter < iterations; ++iter) {
        vectorizedFunc(input.data(), output_vectorized.data(), count);
    }
    auto end = std::chrono::high_resolution_clock::now();
    double vectorizedTime = std::chrono::duration<double, std::milli>(end - start).count() / iterations;

    // Benchmark scalaire
    start = std::chrono::high_resolution_clock::now();
    for (int iter = 0; iter < iterations; ++iter) {
        for (size_t i = 0; i < count; ++i) {
            output_scalar[i] = scalarFunc(input[i]);
        }
    }
    end = std::chrono::high_resolution_clock::now();
    double scalarTime = std::chrono::duration<double, std::milli>(end - start).count() / iterations;

    double speedup = scalarTime / vectorizedTime;
    double scalarThroughput = count / (scalarTime / 1000.0);
    double vectorizedThroughput = count / (vectorizedTime / 1000.0);

    return {
        name,
        scalarTime,
        vectorizedTime,
        speedup,
        scalarThroughput,
        vectorizedThroughput,
        SIMDDetector::hasSIMD()
    };
}

void MathBenchmark::benchmarkAllMathFunctions(size_t count) {
    std::cout << "=== SIMD Math Functions Benchmark ===" << std::endl;
    std::cout << "Sample count: " << count << std::endl;
    std::cout << "SIMD type: " << SIMDDetector::getBestSIMDType() << std::endl;
    std::cout << std::endl;

    // Benchmark expint_e1
    auto result = benchmarkMathFunction(
        SIMDMathFunctions::expint_e1_vectorized,
        SIMDMathFunctions::expint_e1_scalar,
        "expint_e1"
    );

    std::cout << std::left << std::setw(15) << result.functionName << ": "
              << std::fixed << std::setprecision(2)
              << std::setw(8) << result.scalarTime << " ms (scalar), "
              << std::setw(8) << result.vectorizedTime << " ms (vectorized), "
              << "Speedup: " << std::setw(6) << std::setprecision(1) << result.speedup << "x"
              << std::endl;

    // Benchmark expint_ei
    result = benchmarkMathFunction(
        SIMDMathFunctions::expint_ei_vectorized,
        SIMDMathFunctions::expint_ei_scalar,
        "expint_ei"
    );

    std::cout << std::left << std::setw(15) << result.functionName << ": "
              << std::fixed << std::setprecision(2)
              << std::setw(8) << result.scalarTime << " ms (scalar), "
              << std::setw(8) << result.vectorizedTime << " ms (vectorized), "
              << "Speedup: " << std::setw(6) << std::setprecision(1) << result.speedup << "x"
              << std::endl;

    std::cout << std::endl;
}

} // namespace SIMD
} // namespace AudioNR
