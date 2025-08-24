#pragma once

#ifdef __cplusplus
#include "SIMDCore.hpp"
#include <vector>
#include <functional>
#include <memory>

namespace AudioNR {
namespace SIMD {

// ====================
// Fonctions Mathématiques SIMD Avancées
// ====================

class SIMDMathFunctions {
public:
    // Fonctions spéciales vectorisées
    static void expint_e1_vectorized(const float* x, float* result, size_t count);
    static void expint_ei_vectorized(const float* x, float* result, size_t count);
    static void expint_en_vectorized(int n, const float* x, float* result, size_t count);

    // Fonctions trigonométriques optimisées
    static void sin_vectorized(const float* x, float* result, size_t count);
    static void cos_vectorized(const float* x, float* result, size_t count);
    static void tan_vectorized(const float* x, float* result, size_t count);

    // Fonctions hyperboliques
    static void sinh_vectorized(const float* x, float* result, size_t count);
    static void cosh_vectorized(const float* x, float* result, size_t count);
    static void tanh_vectorized(const float* x, float* result, size_t count);

    // Fonctions logarithmiques et exponentielles
    static void log2_vectorized(const float* x, float* result, size_t count);
    static void log10_vectorized(const float* x, float* result, size_t count);
    static void exp2_vectorized(const float* x, float* result, size_t count);
    static void exp10_vectorized(const float* x, float* result, size_t count);

    // Fonctions de puissance
    static void pow_vectorized(const float* x, const float* y, float* result, size_t count);
    static void sqrt_vectorized(const float* x, float* result, size_t count);
    static void cbrt_vectorized(const float* x, float* result, size_t count);

    // Fonctions d'erreur
    static void erf_vectorized(const float* x, float* result, size_t count);
    static void erfc_vectorized(const float* x, float* result, size_t count);

    // Fonctions statistiques
    static float mean(const float* data, size_t count);
    static float variance(const float* data, size_t count);
    static float stddev(const float* data, size_t count);
    static void normalize(float* data, size_t count, float target_rms = 1.0f);

    // Fonctions de filtrage
    static void apply_lowpass_filter(float* data, size_t count, float cutoff, float sampleRate);
    static void apply_highpass_filter(float* data, size_t count, float cutoff, float sampleRate);
    static void apply_bandpass_filter(float* data, size_t count, float lowCut, float highCut, float sampleRate);

    // Fonctions de transformation
    static void apply_soft_clipper(float* data, size_t count, float threshold);
    static void apply_hard_clipper(float* data, size_t count, float threshold);
    static void apply_tanh_distortion(float* data, size_t count, float drive);
    static void apply_cubic_distortion(float* data, size_t count, float drive);

    // Version scalaire de référence pour les benchmarks
    static float expint_e1_scalar(float x);
    static float expint_ei_scalar(float x);
    static float expint_en_scalar(int n, float x);
};

// ====================
// Interface pour les algorithmes DSP SIMD
// ====================

class SIMDProcessorFloat : public AudioNR::SIMD::SIMDProcessor<float> {
public:
    virtual ~SIMDProcessorFloat() = default;

    virtual void process(float* data, size_t count) override = 0;
    virtual std::string getName() const override = 0;
    virtual bool isSIMDAccelerated() const override = 0;

    // Méthodes communes
    void setSampleRate(float sampleRate) { sampleRate_ = sampleRate; }
    float getSampleRate() const { return sampleRate_; }

    void setEnabled(bool enabled) { enabled_ = enabled; }
    bool isEnabled() const { return enabled_; }

protected:
    float sampleRate_ = 44100.0f;
    bool enabled_ = true;
};

// ====================
// Processeurs DSP SIMD spécialisés
// ====================

class SIMDFilter : public SIMDProcessorFloat {
public:
    enum FilterType {
        LOWPASS,
        HIGHPASS,
        BANDPASS,
        NOTCH
    };

    SIMDFilter(FilterType type, float frequency, float q = 0.707f);
    ~SIMDFilter() override = default;

    void process(float* data, size_t count) override;
    std::string getName() const override;
    bool isSIMDAccelerated() const override;

    void setFrequency(float frequency);
    void setQ(float q);

private:
    FilterType type_;
    float frequency_;
    float q_;

    // États du filtre
    float x1_, x2_, y1_, y2_; // Pour les filtres biquad
    float a0_, a1_, a2_, b1_, b2_; // Coefficients

    void updateCoefficients();
};

class SIMDDistortion : public SIMDProcessorFloat {
public:
    enum DistortionType {
        SOFT_CLIP,
        HARD_CLIP,
        TANH,
        CUBIC,
        ARCTAN
    };

    SIMDDistortion(DistortionType type, float drive = 1.0f, float mix = 1.0f);
    ~SIMDDistortion() override = default;

    void process(float* data, size_t count) override;
    std::string getName() const override;
    bool isSIMDAccelerated() const override;

    void setDrive(float drive);
    void setMix(float mix);

private:
    DistortionType type_;
    float drive_;
    float mix_;
};

class SIMDReverb : public SIMDProcessorFloat {
public:
    SIMDReverb(float decay = 0.5f, float mix = 0.3f, float roomSize = 0.8f);
    ~SIMDReverb() override = default;

    void process(float* data, size_t count) override;
    std::string getName() const override;
    bool isSIMDAccelerated() const override;

    void setDecay(float decay);
    void setMix(float mix);
    void setRoomSize(float roomSize);

private:
    float decay_;
    float mix_;
    float roomSize_;

    // Buffers de delay multiples pour l'effet de réverbération
    std::vector<float> delayBuffer1_, delayBuffer2_, delayBuffer3_;
    size_t delayIndex1_, delayIndex2_, delayIndex3_;
    size_t delayLength1_, delayLength2_, delayLength3_;
};

class SIMDDelay : public SIMDProcessorFloat {
public:
    SIMDDelay(float delayMs = 500.0f, float feedback = 0.3f, float mix = 0.5f);
    ~SIMDDelay() override = default;

    void process(float* data, size_t count) override;
    std::string getName() const override;
    bool isSIMDAccelerated() const override;

    void setDelayMs(float delayMs);
    void setFeedback(float feedback);
    void setMix(float mix);

private:
    float delayMs_;
    float feedback_;
    float mix_;

    std::vector<float> delayBuffer_;
    size_t delayIndex_;
    size_t delayLength_;
};

// ====================
// Chaîne de traitement SIMD
// ====================

class SIMDProcessingChain {
public:
    SIMDProcessingChain();
    ~SIMDProcessingChain();

    void addProcessor(std::unique_ptr<SIMDProcessorFloat> processor);
    void removeProcessor(size_t index);
    void clear();

    void process(float* data, size_t count);
    void processBlock(float* data, size_t count);

    void setEnabled(bool enabled) { enabled_ = enabled; }
    bool isEnabled() const { return enabled_; }

    size_t getProcessorCount() const { return processors_.size(); }
    SIMDProcessorFloat* getProcessor(size_t index) const;

private:
    std::vector<std::unique_ptr<SIMDProcessorFloat>> processors_;
    bool enabled_;
};

// ====================
// Utilitaires de benchmark pour les fonctions mathématiques
// ====================

class MathBenchmark {
public:
    struct MathBenchmarkResult {
        std::string functionName;
        double scalarTime;
        double vectorizedTime;
        double speedup;
        double scalarThroughput; // éléments par seconde
        double vectorizedThroughput;
        bool isSIMDAccelerated;
    };

    static MathBenchmarkResult benchmarkMathFunction(
        std::function<void(const float*, float*, size_t)> vectorizedFunc,
        std::function<float(float)> scalarFunc,
        const std::string& name,
        size_t count = 1000000,
        int iterations = 100
    );

    static void benchmarkAllMathFunctions(size_t count = 1000000);
};

} // namespace SIMD
} // namespace AudioNR

#endif // __cplusplus
