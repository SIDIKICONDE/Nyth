#include "AudioSafety.h"
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <stdexcept>
#include <cmath>
#include <algorithm>

namespace AudioSafety {

AudioSafetyEngine::AudioSafetyEngine(uint32_t sampleRate, int channels)
    : sampleRate_(sampleRate), channels_(channels) {
    if (sampleRate_ < 8000 || sampleRate_ > 192000) {
        throw std::invalid_argument("AudioSafetyEngine: sampleRate must be between 8000 and 192000 Hz");
    }
    if (channels_ < 1 || channels_ > 2) {
        throw std::invalid_argument("AudioSafetyEngine: channels must be 1 or 2");
    }
    setConfig(SafetyConfig{});
}

AudioSafetyEngine::~AudioSafetyEngine() = default;

void AudioSafetyEngine::setSampleRate(uint32_t sr) {
    if (sr < 8000 || sr > 192000) {
        throw std::invalid_argument("AudioSafetyEngine::setSampleRate: out of range");
    }
    sampleRate_ = sr;
}

void AudioSafetyEngine::setConfig(const SafetyConfig& cfg) {
    if (cfg.limiterThresholdDb > 0.0 || cfg.limiterThresholdDb < -20.0) {
        throw std::invalid_argument("AudioSafetyEngine::setConfig: limiterThresholdDb must be between -20 and 0 dBFS");
    }
    if (cfg.kneeWidthDb < 0.0 || cfg.kneeWidthDb > 24.0) {
        throw std::invalid_argument("AudioSafetyEngine::setConfig: kneeWidthDb must be between 0 and 24 dB");
    }
    if (cfg.dcThreshold < 0.0 || cfg.dcThreshold > 0.05) {
        throw std::invalid_argument("AudioSafetyEngine::setConfig: dcThreshold must be between 0.0 and 0.05");
    }
    if (cfg.feedbackCorrThreshold < 0.0 || cfg.feedbackCorrThreshold > 1.0) {
        throw std::invalid_argument("AudioSafetyEngine::setConfig: feedbackCorrThreshold must be between 0 and 1");
    }
    config_ = cfg;
    limiterThresholdLin_ = dbToLin(config_.limiterThresholdDb);
}

void AudioSafetyEngine::processMono(float* buffer, size_t numSamples) {
    if (!buffer) throw std::invalid_argument("AudioSafetyEngine::processMono: buffer is null");
    if (!config_.enabled || numSamples == 0) return;
    report_ = analyzeAndClean(buffer, numSamples);
}

void AudioSafetyEngine::processStereo(float* left, float* right, size_t numSamples) {
    if (!left || !right) throw std::invalid_argument("AudioSafetyEngine::processStereo: buffers are null");
    if (!config_.enabled || numSamples == 0) return;
    // Analyser chaque canal séparément puis agréger
    SafetyReport rl = analyzeAndClean(left, numSamples);
    SafetyReport rr = analyzeAndClean(right, numSamples);
    SafetyReport agg{};
    agg.peak = std::max(rl.peak, rr.peak);
    // RMS agrégé (deux canaux supposés indépendants)
    agg.rms = std::sqrt((rl.rms*rl.rms + rr.rms*rr.rms) / 2.0);
    agg.dcOffset = (rl.dcOffset + rr.dcOffset) / 2.0;
    agg.clippedSamples = rl.clippedSamples + rr.clippedSamples;
    agg.overloadActive = rl.overloadActive || rr.overloadActive;
    agg.feedbackScore = std::max(rl.feedbackScore, rr.feedbackScore);
    agg.hasNaN = rl.hasNaN || rr.hasNaN;
    agg.feedbackLikely = agg.feedbackScore >= config_.feedbackCorrThreshold;
    report_ = agg;
}

SafetyReport AudioSafetyEngine::analyzeAndClean(float* x, size_t n) {
    SafetyReport localReport{};
    // NaN/Inf guard + stats
    double sum = 0.0, sum2 = 0.0; uint32_t clipped = 0; double peak = 0.0;
    for (size_t i = 0; i < n; ++i) {
        float v = x[i];
        if (!std::isfinite(v)) { localReport.hasNaN = true; v = 0.0f; }
        if (v > 1.0f) { v = 1.0f; ++clipped; }
        if (v < -1.0f) { v = -1.0f; ++clipped; }
        x[i] = v;
        double dv = static_cast<double>(v);
        sum += dv; sum2 += dv * dv; peak = std::max(peak, std::abs(dv));
    }
    double mean = sum / static_cast<double>(n);
    double rms = std::sqrt(sum2 / static_cast<double>(n));
    localReport.peak = peak; localReport.rms = rms; localReport.dcOffset = mean; localReport.clippedSamples = clipped;

    // DC offset handling
    if (config_.dcRemovalEnabled && std::abs(mean) > config_.dcThreshold) {
        dcRemove(x, n, mean);
        localReport.dcOffset = 0.0; // corrected
    }

    // Overload/limiter
    if (config_.limiterEnabled) {
        // Soft knee compressor/limiter (static, no look-ahead)
        const double knee = std::max(0.0, config_.kneeWidthDb);
        const double thr = limiterThresholdLin_;
        const double thrDb = 20.0 * std::log10(thr);
        for (size_t i = 0; i < n; ++i) {
            double v = x[i];
            double mag = std::abs(v);
            double magDb = 20.0 * std::log10(std::max(mag, 1e-10));
            double overDb = magDb - thrDb;
            if (overDb > 0.0) {
                localReport.overloadActive = true;
                double gainDb;
                if (config_.softKneeLimiter && overDb < knee) {
                    // Soft knee cubic
                    double t = overDb / knee; // 0..1
                    // gainDb goes from 0 to -overDb smoothly
                    gainDb = -overDb * (3*t*t - 2*t*t*t);
                } else {
                    gainDb = -overDb;
                }
                double g = std::pow(10.0, gainDb / 20.0);
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

void AudioSafetyEngine::dcRemove(float* x, size_t n, double mean) {
    for (size_t i = 0; i < n; ++i) x[i] -= static_cast<float>(mean);
}

void AudioSafetyEngine::limitBuffer(float* x, size_t n) {
    for (size_t i = 0; i < n; ++i) {
        float v = x[i];
        if (v > limiterThresholdLin_) x[i] = static_cast<float>(limiterThresholdLin_);
        else if (v < -limiterThresholdLin_) x[i] = static_cast<float>(-limiterThresholdLin_);
    }
}

double AudioSafetyEngine::estimateFeedbackScore(const float* x, size_t n) {
    // Autocorrelation at short lags (e.g., [32..512] samples)
    size_t minLag = std::min<size_t>(32, n/4);
    size_t maxLag = std::min<size_t>(512, n-1);
    if (maxLag <= minLag) return 0.0;
    double energy = 0.0; for (size_t i = 0; i < n; ++i) energy += x[i] * x[i]; if (energy <= 1e-9) return 0.0;
    double best = 0.0;
    for (size_t lag = minLag; lag <= maxLag; lag *= 2) {
        double corr = 0.0;
        for (size_t i = 0; i + lag < n; ++i) corr += x[i] * x[i + lag];
        corr /= energy;
        best = std::max(best, corr);
    }
    // Normalize 0..1 and thresholding
    double score = std::max(0.0, std::min(1.0, best));
    return score;
}

} // namespace AudioSafety


