#include "AudioSafety.hpp"
#include "../core/DbLookupTable.hpp"  // Integration of LUT for dB conversions
#include <cstddef>
#include <cstdint>
#include <cstring>
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

AudioSafetyEngine::AudioSafetyEngine(std::uint32_t sampleRate, int channels, SafetyError* error)
    : sampleRate_(sampleRate), channels_(channels), valid_(false) {
    
    SafetyError localError = SafetyError::OK;
    
    if (sampleRate_ < MIN_SAMPLE_RATE || sampleRate_ > MAX_SAMPLE_RATE) {
        localError = SafetyError::INVALID_SAMPLE_RATE;
    } else if (channels_ < MIN_CHANNELS || channels_ > MAX_CHANNELS) {
        localError = SafetyError::INVALID_CHANNELS;
    } else {
        localError = setConfig(SafetyConfig{});
        if (localError == SafetyError::OK) {
            valid_ = true;
        }
    }
    
    if (error) {
        *error = localError;
    }
}

AudioSafetyEngine::~AudioSafetyEngine() = default;

SafetyError AudioSafetyEngine::setSampleRate(std::uint32_t sr) noexcept {
    if (sr < MIN_SAMPLE_RATE || sr > MAX_SAMPLE_RATE) {
        return SafetyError::INVALID_SAMPLE_RATE;
    }
    sampleRate_ = sr;
    return SafetyError::OK;
}

SafetyError AudioSafetyEngine::setConfig(const SafetyConfig& cfg) noexcept {
    if (cfg.limiterThresholdDb > MAX_LIMITER_THRESHOLD_DB || 
        cfg.limiterThresholdDb < MIN_LIMITER_THRESHOLD_DB) {
        return SafetyError::INVALID_THRESHOLD_DB;
    }
    if (cfg.kneeWidthDb < MIN_KNEE_WIDTH_DB || cfg.kneeWidthDb > MAX_KNEE_WIDTH_DB) {
        return SafetyError::INVALID_KNEE_WIDTH;
    }
    if (cfg.dcThreshold < MIN_DC_THRESHOLD || cfg.dcThreshold > MAX_DC_THRESHOLD) {
        return SafetyError::INVALID_DC_THRESHOLD;
    }
    if (cfg.feedbackCorrThreshold < MIN_FEEDBACK_CORR_THRESHOLD || 
        cfg.feedbackCorrThreshold > MAX_FEEDBACK_CORR_THRESHOLD) {
        return SafetyError::INVALID_FEEDBACK_THRESHOLD;
    }
    
    config_ = cfg;
    limiterThresholdLin_ = dbToLin(config_.limiterThresholdDb);
    return SafetyError::OK;
}

// Optimized dB conversion using LUT
double AudioSafetyEngine::dbToLin(double dB) const noexcept {
    // Use the optimized lookup table
    return AudioFX::DbLookupTable::getInstance().dbToLinear(static_cast<float>(dB));
}

double AudioSafetyEngine::linToDb(double linear) const noexcept {
    // Use the optimized lookup table
    return AudioFX::DbLookupTable::getInstance().linearToDb(static_cast<float>(linear));
}

SafetyError AudioSafetyEngine::processMono(float* buffer, std::size_t numSamples) noexcept {
    if (!buffer) {
        return SafetyError::NULL_BUFFER;
    }
    if (!config_.enabled || numSamples == ZERO_SAMPLES) {
        return SafetyError::OK;
    }
    
    report_ = analyzeAndClean(buffer, numSamples);
    return SafetyError::OK;
}

SafetyError AudioSafetyEngine::processStereo(float* left, float* right, std::size_t numSamples) noexcept {
    if (!left || !right) {
        return SafetyError::NULL_BUFFER;
    }
    if (!config_.enabled || numSamples == ZERO_SAMPLES) {
        return SafetyError::OK;
    }
    
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
    
    return SafetyError::OK;
}

SafetyReport AudioSafetyEngine::analyzeAndClean(float* x, std::size_t n) noexcept {
    SafetyReport localReport{};
    
    // NaN/Inf guard + stats
    double sum = INITIAL_SUM, sum2 = INITIAL_SUM2; 
    std::uint32_t clipped = INITIAL_CLIPPED; 
    double peak = INITIAL_PEAK;
    
    for (std::size_t i = ZERO_SAMPLES; i < n; ++i) {
        float v = x[i];
        if (!std::isfinite(v)) { 
            localReport.hasNaN = true; 
            v = NAN_REPLACEMENT; 
        }
        if (v > CLIP_THRESHOLD_HIGH) { 
            v = CLIP_CORRECTION_HIGH; 
            ++clipped; 
        }
        if (v < CLIP_THRESHOLD_LOW) { 
            v = CLIP_CORRECTION_LOW; 
            ++clipped; 
        }
        x[i] = v;
        double dv = static_cast<double>(v);
        sum += dv; 
        sum2 += dv * dv; 
        peak = maxValue(peak, std::abs(dv));
    }
    
    double mean = sum / static_cast<double>(n);
    double rms = std::sqrt(sum2 / static_cast<double>(n));
    localReport.peak = peak; 
    localReport.rms = rms; 
    localReport.dcOffset = mean; 
    localReport.clippedSamples = clipped;

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
        const double thrDb = config_.limiterThresholdDb;
        
        for (std::size_t i = ZERO_SAMPLES; i < n; ++i) {
            double v = x[i];
            double mag = std::abs(v);
            
            // Use LUT for dB conversion (much faster)
            double magDb = linToDb(mag);
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
                
                // Use LUT for dB to linear conversion
                double g = dbToLin(gainDb);
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

void AudioSafetyEngine::dcRemove(float* x, std::size_t n, double mean) noexcept {
    for (std::size_t i = ZERO_SAMPLES; i < n; ++i) {
        x[i] -= static_cast<float>(mean);
    }
}

void AudioSafetyEngine::limitBuffer(float* x, std::size_t n) noexcept {
    for (std::size_t i = ZERO_SAMPLES; i < n; ++i) {
        float v = x[i];
        if (v > limiterThresholdLin_) {
            x[i] = static_cast<float>(limiterThresholdLin_);
        } else if (v < -limiterThresholdLin_) {
            x[i] = static_cast<float>(-limiterThresholdLin_);
        }
    }
}

double AudioSafetyEngine::estimateFeedbackScore(const float* x, std::size_t n) noexcept {
    // Autocorrelation at short lags (e.g., [32..512] samples)
    std::size_t minLag = minValue<std::size_t>(MIN_LAG_ABSOLUTE, n/MIN_LAG_DIVISOR);
    std::size_t maxLag = minValue<std::size_t>(MAX_LAG_ABSOLUTE, n-MAX_LAG_INDEX);
    
    if (maxLag <= minLag) {
        return FEEDBACK_SCORE_MIN;
    }
    
    double energy = INITIAL_SUM; 
    for (std::size_t i = ZERO_SAMPLES; i < n; ++i) {
        energy += x[i] * x[i]; 
    }
    
    if (energy <= MIN_ENERGY_THRESHOLD) {
        return FEEDBACK_SCORE_MIN;
    }
    
    double best = INITIAL_SUM;
    for (std::size_t lag = minLag; lag <= maxLag; lag *= LAG_MULTIPLIER) {
        double corr = INITIAL_SUM;
        for (std::size_t i = ZERO_SAMPLES; i + lag < n; ++i) {
            corr += x[i] * x[i + lag];
        }
        corr /= energy;
        best = maxValue(best, corr);
    }
    
    // Normalize 0..1 and thresholding
    double score = maxValue(NORMALIZATION_MIN, minValue(NORMALIZATION_MAX, best));
    return score;
}

} // namespace AudioSafety


// Pas d'implémentation locale pour éviter les conflits de linkage.

