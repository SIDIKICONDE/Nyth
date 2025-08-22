#include "AudioSafety.hpp"
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <stdexcept>
#include <cmath>
#include <algorithm>

namespace {
template <typename T>
inline T maxValue(const T& a, const T& b) { return (a < b) ? b : a; }

template <typename T>
inline T minValue(const T& a, const T& b) { return (b < a) ? b : a; }

// Import des constantes pour éviter la répétition des namespace
using namespace AudioSafety::SafetyConstants;
}

namespace AudioSafety {

AudioSafetyEngine::AudioSafetyEngine(std::uint32_t sampleRate, int channels)
    : sampleRate_(sampleRate), channels_(channels) {
    if (sampleRate_ < MIN_SAMPLE_RATE || sampleRate_ > MAX_SAMPLE_RATE) {
        throw std::invalid_argument("AudioSafetyEngine: sampleRate must be between 8000 and 192000 Hz");
    }
    if (channels_ < MIN_CHANNELS || channels_ > MAX_CHANNELS) {
        throw std::invalid_argument("AudioSafetyEngine: channels must be 1 or 2");
    }
    setConfig(SafetyConfig{});
}

AudioSafetyEngine::~AudioSafetyEngine() = default;

void AudioSafetyEngine::setSampleRate(std::uint32_t sr) {
    if (sr < MIN_SAMPLE_RATE || sr > MAX_SAMPLE_RATE) {
        throw std::invalid_argument("AudioSafetyEngine::setSampleRate: out of range");
    }
    sampleRate_ = sr;
}

void AudioSafetyEngine::setConfig(const SafetyConfig& cfg) {
    if (cfg.limiterThresholdDb > MAX_LIMITER_THRESHOLD_DB || cfg.limiterThresholdDb < MIN_LIMITER_THRESHOLD_DB) {
        throw std::invalid_argument("AudioSafetyEngine::setConfig: limiterThresholdDb must be between -20 and 0 dBFS");
    }
    if (cfg.kneeWidthDb < MIN_KNEE_WIDTH_DB || cfg.kneeWidthDb > MAX_KNEE_WIDTH_DB) {
        throw std::invalid_argument("AudioSafetyEngine::setConfig: kneeWidthDb must be between 0 and 24 dB");
    }
    if (cfg.dcThreshold < MIN_DC_THRESHOLD || cfg.dcThreshold > MAX_DC_THRESHOLD) {
        throw std::invalid_argument("AudioSafetyEngine::setConfig: dcThreshold must be between 0.0 and 0.05");
    }
    if (cfg.feedbackCorrThreshold < MIN_FEEDBACK_CORR_THRESHOLD || cfg.feedbackCorrThreshold > MAX_FEEDBACK_CORR_THRESHOLD) {
        throw std::invalid_argument("AudioSafetyEngine::setConfig: feedbackCorrThreshold must be between 0 and 1");
    }
    config_ = cfg;
    limiterThresholdLin_ = dbToLin(config_.limiterThresholdDb);
}

void AudioSafetyEngine::processMono(float* buffer, std::size_t numSamples) {
    if (!buffer) throw std::invalid_argument("AudioSafetyEngine::processMono: buffer is null");
    if (!config_.enabled || numSamples == ZERO_SAMPLES) return;
    report_ = analyzeAndClean(buffer, numSamples);
}

void AudioSafetyEngine::processStereo(float* left, float* right, std::size_t numSamples) {
    if (!left || !right) throw std::invalid_argument("AudioSafetyEngine::processStereo: buffers are null");
    if (!config_.enabled || numSamples == ZERO_SAMPLES) return;
    // Analyser chaque canal séparément puis agréger
    SafetyReport rl = analyzeAndClean(left, numSamples);
    SafetyReport rr = analyzeAndClean(right, numSamples);
    SafetyReport agg{};
    agg.peak = maxValue(rl.peak, rr.peak);
    // RMS agrégé (deux canaux supposés indépendants)
    agg.rms = std::sqrt((rl.rms*rl.rms + rr.rms*rr.rms) / STEREO_RMS_DIVISOR);
    agg.dcOffset = (rl.dcOffset + rr.dcOffset) / STEREO_OFFSET_DIVISOR;
    agg.clippedSamples = rl.clippedSamples + rr.clippedSamples;
    agg.overloadActive = rl.overloadActive || rr.overloadActive;
    agg.feedbackScore = maxValue(rl.feedbackScore, rr.feedbackScore);
    agg.hasNaN = rl.hasNaN || rr.hasNaN;
    agg.feedbackLikely = agg.feedbackScore >= config_.feedbackCorrThreshold;
    report_ = agg;
}

SafetyReport AudioSafetyEngine::analyzeAndClean(float* x, std::size_t n) {
    SafetyReport localReport{};
    // NaN/Inf guard + stats
    double sum = INITIAL_SUM, sum2 = INITIAL_SUM2; std::uint32_t clipped = INITIAL_CLIPPED; double peak = INITIAL_PEAK;
    for (std::size_t i = ZERO_SAMPLES; i < n; ++i) {
        float v = x[i];
        if (!std::isfinite(v)) { localReport.hasNaN = true; v = NAN_REPLACEMENT; }
        if (v > CLIP_THRESHOLD_HIGH) { v = CLIP_CORRECTION_HIGH; ++clipped; }
        if (v < CLIP_THRESHOLD_LOW) { v = CLIP_CORRECTION_LOW; ++clipped; }
        x[i] = v;
        double dv = static_cast<double>(v);
        sum += dv; sum2 += dv * dv; peak = maxValue(peak, std::abs(dv));
    }
    double mean = sum / static_cast<double>(n);
    double rms = std::sqrt(sum2 / static_cast<double>(n));
    localReport.peak = peak; localReport.rms = rms; localReport.dcOffset = mean; localReport.clippedSamples = clipped;

    // DC offset handling
    if (config_.dcRemovalEnabled && std::abs(mean) > config_.dcThreshold) {
        dcRemove(x, n, mean);
        localReport.dcOffset = INITIAL_SUM; // corrected
    }

    // Overload/limiter
    if (config_.limiterEnabled) {
        // Soft knee compressor/limiter (static, no look-ahead)
        const double knee = maxValue(MIN_KNEE_THRESHOLD, config_.kneeWidthDb);
        const double thr = limiterThresholdLin_;
        const double thrDb = config_.limiterThresholdDb; // Utiliser directement la valeur dB
        for (std::size_t i = ZERO_SAMPLES; i < n; ++i) {
            double v = x[i];
            double mag = std::abs(v);
            double magDb = DB_TO_LINEAR_DIVISOR * std::log10(maxValue(mag, MIN_LOG_PROTECTION));
            double overDb = magDb - thrDb;
            if (overDb > OVER_DB_THRESHOLD) {
                localReport.overloadActive = true;
                double gainDb;
                if (config_.softKneeLimiter && overDb < knee) {
                    // Soft knee cubic
                    double t = overDb / knee; // 0..1
                    // gainDb goes from 0 to -overDb smoothly
                    gainDb = -overDb * (CUBIC_COEFF_3*t*t - CUBIC_COEFF_2*t*t*t);
                } else {
                    gainDb = -overDb;
                }
                double g = std::pow(GAIN_DB_BASE, gainDb / GAIN_DB_DIVISOR);
                x[i] = static_cast<float>(v * g);
            }
        }
    }

    // Feedback detection (simple autocorrelation peak at small lag)
    if (config_.feedbackDetectEnabled) {
        localReport.feedbackScore = estimateFeedbackScore(x, n);
        localReport.feedbackLikely = localReport.feedbackScore >= config_.feedbackCorrThreshold;
    }
    return localReport;
}

void AudioSafetyEngine::dcRemove(float* x, std::size_t n, double mean) {
    for (std::size_t i = ZERO_SAMPLES; i < n; ++i) x[i] -= static_cast<float>(mean);
}

void AudioSafetyEngine::limitBuffer(float* x, std::size_t n) {
    for (std::size_t i = ZERO_SAMPLES; i < n; ++i) {
        float v = x[i];
        if (v > limiterThresholdLin_) x[i] = static_cast<float>(limiterThresholdLin_);
        else if (v < -limiterThresholdLin_) x[i] = static_cast<float>(-limiterThresholdLin_);
    }
}

double AudioSafetyEngine::estimateFeedbackScore(const float* x, std::size_t n) {
    // Autocorrelation at short lags (e.g., [32..512] samples)
    std::size_t minLag = minValue<std::size_t>(MIN_LAG_ABSOLUTE, n/MIN_LAG_DIVISOR);
    std::size_t maxLag = minValue<std::size_t>(MAX_LAG_ABSOLUTE, n-MAX_LAG_INDEX);
    if (maxLag <= minLag) return FEEDBACK_SCORE_MIN;
    double energy = INITIAL_SUM; for (std::size_t i = ZERO_SAMPLES; i < n; ++i) energy += x[i] * x[i]; if (energy <= MIN_ENERGY_THRESHOLD) return FEEDBACK_SCORE_MIN;
    double best = INITIAL_SUM;
    for (std::size_t lag = minLag; lag <= maxLag; lag *= LAG_MULTIPLIER) {
        double corr = INITIAL_SUM;
        for (std::size_t i = ZERO_SAMPLES; i + lag < n; ++i) corr += x[i] * x[i + lag];
        corr /= energy;
        best = maxValue(best, corr);
    }
    // Normalize 0..1 and thresholding
    double score = maxValue(NORMALIZATION_MIN, minValue(NORMALIZATION_MAX, best));
    return score;
}

} // namespace AudioSafety


// Pas d'implémentation locale pour éviter les conflits de linkage.

