#include "AudioCaptureMetrics.hpp"
#include "../../common/config/Constant.hpp"
#include <algorithm>
#include <cmath>
#include <functional> // For std::function
#include <sstream>
#include <iomanip>

namespace Nyth {
namespace Audio {

// ============================================================================
// AudioMetrics Implementation
// ============================================================================

AudioMetrics::AudioMetrics()
    : enabled_(true)
    , windowSize_(Constants::DEFAULT_METRICS_WINDOW_SIZE)
    , updateInterval_(Constants::DEFAULT_METRICS_UPDATE_INTERVAL_MS)
    , lastUpdateTime_(std::chrono::steady_clock::now()) {
    reset();
}

AudioMetrics::~AudioMetrics() {
    // Destructor
}

void AudioMetrics::reset() {
    std::lock_guard<std::mutex> lock(mutex_);

    // Reset all metrics
    currentMetrics_ = MetricsData();
    peakMetrics_ = MetricsData();
    averageMetrics_ = MetricsData();

    // Clear history
    levelHistory_.clear();
    peakHistory_.clear();

    // Reset counters
    sampleCount_ = 0;
    frameCount_ = 0;
    updateCount_ = 0;

    lastUpdateTime_ = std::chrono::steady_clock::now();
}

void AudioMetrics::process(const float* data, size_t frameCount, int channelCount) {
    if (!enabled_ || !data || frameCount == 0 || channelCount == 0) return;

    std::lock_guard<std::mutex> lock(mutex_);

    size_t sampleCount = frameCount * channelCount;

    // Calculate current metrics
    MetricsData current;
    current.timestamp = std::chrono::steady_clock::now();

    // RMS calculation
    float sumSquares = 0.0f;
    for (size_t i = 0; i < sampleCount; ++i) {
        sumSquares += data[i] * data[i];
    }
    current.rms = std::sqrt(sumSquares / sampleCount);
    current.rmsDb = Constants::AMPLITUDE_TO_DB_FACTOR * std::log10(std::max(current.rms, 1e-10f));

    // Peak calculation
    current.peak = 0.0f;
    for (size_t i = 0; i < sampleCount; ++i) {
        float absValue = std::abs(data[i]);
        if (absValue > current.peak) {
            current.peak = absValue;
        }
    }
    current.peakDb = Constants::AMPLITUDE_TO_DB_FACTOR * std::log10(std::max(current.peak, 1e-10f));

    // LUFS calculation (simplified)
    current.lufs = calculateLUFS(data, frameCount, channelCount);

    // True peak (oversampled peak detection)
    current.truePeak = calculateTruePeak(data, sampleCount);
    current.truePeakDb = Constants::AMPLITUDE_TO_DB_FACTOR * std::log10(std::max(current.truePeak, 1e-10f));

    // Crest factor
    if (current.rms > 0) {
        current.crestFactor = current.peak / current.rms;
        current.crestFactorDb = Constants::AMPLITUDE_TO_DB_FACTOR * std::log10(current.crestFactor);
    }

    // Dynamic range (simplified)
    current.dynamicRange = calculateDynamicRange(data, sampleCount);

    // Zero crossing rate
    current.zeroCrossingRate = calculateZeroCrossingRate(data, sampleCount);

    // Spectral centroid (simplified without FFT)
    current.spectralCentroid = estimateSpectralCentroid(data, sampleCount);

    // Update current metrics
    currentMetrics_ = current;

    // Update peak metrics
    if (current.peak > peakMetrics_.peak) {
        peakMetrics_.peak = current.peak;
        peakMetrics_.peakDb = current.peakDb;
        peakMetrics_.timestamp = current.timestamp;
    }

    if (current.truePeak > peakMetrics_.truePeak) {
        peakMetrics_.truePeak = current.truePeak;
        peakMetrics_.truePeakDb = current.truePeakDb;
    }

    // Update running averages
    updateAverages(current);

    // Update history
    updateHistory(current);

    // Update counters
    sampleCount_ += sampleCount;
    frameCount_ += frameCount;
    updateCount_++;

    // Check if we should trigger update callback
    auto now = std::chrono::steady_clock::now();
    auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(
        now - lastUpdateTime_).count();

    if (elapsed >= updateInterval_ && updateCallback_) {
        lastUpdateTime_ = now;
        updateCallback_(currentMetrics_);
    }
}

MetricsData AudioMetrics::getCurrentMetrics() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return currentMetrics_;
}

MetricsData AudioMetrics::getPeakMetrics() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return peakMetrics_;
}

MetricsData AudioMetrics::getAverageMetrics() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return averageMetrics_;
}

std::vector<float> AudioMetrics::getLevelHistory(size_t maxSamples) const {
    std::lock_guard<std::mutex> lock(mutex_);

    if (maxSamples == 0 || levelHistory_.empty()) {
        return levelHistory_;
    }

    size_t startIdx = levelHistory_.size() > maxSamples ?
                     levelHistory_.size() - maxSamples : 0;

    return std::vector<float>(levelHistory_.begin() + startIdx, levelHistory_.end());
}

std::vector<float> AudioMetrics::getPeakHistory(size_t maxSamples) const {
    std::lock_guard<std::mutex> lock(mutex_);

    if (maxSamples == 0 || peakHistory_.empty()) {
        return peakHistory_;
    }

    size_t startIdx = peakHistory_.size() > maxSamples ?
                     peakHistory_.size() - maxSamples : 0;

    return std::vector<float>(peakHistory_.begin() + startIdx, peakHistory_.end());
}

void AudioMetrics::setUpdateCallback(std::function<void(const MetricsData&)> callback) {
    std::lock_guard<std::mutex> lock(mutex_);
    updateCallback_ = callback;
}

void AudioMetrics::setUpdateInterval(int milliseconds) {
    std::lock_guard<std::mutex> lock(mutex_);
    updateInterval_ = milliseconds;
}

void AudioMetrics::setHistorySize(size_t size) {
    std::lock_guard<std::mutex> lock(mutex_);

    // Resize history buffers
    if (levelHistory_.size() > size) {
        levelHistory_.erase(levelHistory_.begin(),
                           levelHistory_.begin() + (levelHistory_.size() - size));
    }

    if (peakHistory_.size() > size) {
        peakHistory_.erase(peakHistory_.begin(),
                          peakHistory_.begin() + (peakHistory_.size() - size));
    }
}

void AudioMetrics::enable(bool enabled) {
    std::lock_guard<std::mutex> lock(mutex_);
    enabled_ = enabled;
}

bool AudioMetrics::isEnabled() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return enabled_;
}

std::string AudioMetrics::getFormattedReport() const {
    std::lock_guard<std::mutex> lock(mutex_);

    std::stringstream ss;
    ss << std::fixed << std::setprecision(Constants::DISPLAY_PRECISION);
    ss << "=== Audio Metrics Report ===" << std::endl;
    ss << "Current:" << std::endl;
    ss << "  RMS: " << currentMetrics_.rmsDb << " dB" << std::endl;
    ss << "  Peak: " << currentMetrics_.peakDb << " dB" << std::endl;
    ss << "  True Peak: " << currentMetrics_.truePeakDb << " dB" << std::endl;
    ss << "  LUFS: " << currentMetrics_.lufs << std::endl;
    ss << "  Crest Factor: " << currentMetrics_.crestFactorDb << " dB" << std::endl;
    ss << "  Dynamic Range: " << currentMetrics_.dynamicRange << " dB" << std::endl;
    ss << std::endl;
    ss << "Peak (session):" << std::endl;
    ss << "  Peak: " << peakMetrics_.peakDb << " dB" << std::endl;
    ss << "  True Peak: " << peakMetrics_.truePeakDb << " dB" << std::endl;
    ss << std::endl;
    ss << "Average:" << std::endl;
    ss << "  RMS: " << averageMetrics_.rmsDb << " dB" << std::endl;
    ss << "  Peak: " << averageMetrics_.peakDb << " dB" << std::endl;
    ss << "  LUFS: " << averageMetrics_.lufs << std::endl;
    ss << std::endl;
    ss << "Statistics:" << std::endl;
    ss << "  Samples processed: " << sampleCount_ << std::endl;
    ss << "  Frames processed: " << frameCount_ << std::endl;
    ss << "  Updates: " << updateCount_ << std::endl;

    return ss.str();
}

// Private methods

void AudioMetrics::updateAverages(const MetricsData& current) {
    if (updateCount_ == 0) {
        averageMetrics_ = current;
        return;
    }

    // Exponential moving average
    const float alpha = Constants::METRICS_SMOOTHING_ALPHA;

    averageMetrics_.rms = averageMetrics_.rms * (1 - alpha) + current.rms * alpha;
    averageMetrics_.rmsDb = Constants::AMPLITUDE_TO_DB_FACTOR * std::log10(std::max(averageMetrics_.rms, 1e-10f));

    averageMetrics_.peak = averageMetrics_.peak * (1 - alpha) + current.peak * alpha;
    averageMetrics_.peakDb = Constants::AMPLITUDE_TO_DB_FACTOR * std::log10(std::max(averageMetrics_.peak, 1e-10f));

    averageMetrics_.lufs = averageMetrics_.lufs * (1 - alpha) + current.lufs * alpha;
    averageMetrics_.dynamicRange = averageMetrics_.dynamicRange * (1 - alpha) +
                                  current.dynamicRange * alpha;
}

void AudioMetrics::updateHistory(const MetricsData& current) {
    const size_t maxHistorySize = Constants::MAX_METRICS_HISTORY_SIZE;

    levelHistory_.push_back(current.rmsDb);
    if (levelHistory_.size() > maxHistorySize) {
        levelHistory_.erase(levelHistory_.begin());
    }

    peakHistory_.push_back(current.peakDb);
    if (peakHistory_.size() > maxHistorySize) {
        peakHistory_.erase(peakHistory_.begin());
    }
}

float AudioMetrics::calculateLUFS(const float* data, size_t frameCount, int channelCount) {
    // Simplified LUFS calculation (not fully compliant with ITU-R BS.1770)
    // For accurate LUFS, you would need proper K-weighting filters

    float sum = 0.0f;
    size_t sampleCount = frameCount * channelCount;

    for (size_t i = 0; i < sampleCount; ++i) {
        sum += data[i] * data[i];
    }

    float meanSquare = sum / sampleCount;

    // Apply approximate K-weighting correction
    // This is a simplified approximation, not accurate K-weighting
    float kWeightedPower = meanSquare * 1.0f; // Simplified, should use proper filter

    // Convert to LUFS
    float lufs = Constants::LUFS_K_WEIGHTING_CORRECTION + Constants::POWER_TO_DB_FACTOR * std::log10(std::max(kWeightedPower, 1e-10f));

    return lufs;
}

float AudioMetrics::calculateTruePeak(const float* data, size_t sampleCount) {
    // Simplified true peak calculation
    // For accurate true peak, you would need oversampling

    float peak = 0.0f;

    // Simple 4x oversampling approximation using linear interpolation
    for (size_t i = 0; i < sampleCount - 1; ++i) {
        float sample1 = std::abs(data[i]);
        float sample2 = std::abs(data[i + 1]);

        // Check original samples
        peak = std::max(peak, sample1);
        peak = std::max(peak, sample2);

        // Check interpolated samples (simplified)
        for (int j = 1; j < Constants::TRUE_PEAK_OVERSAMPLING_FACTOR; ++j) {
            float t = j / Constants::TRUE_PEAK_OVERSAMPLING_FACTOR_FLOAT;
            float interpolated = std::abs(data[i] * (1 - t) + data[i + 1] * t);
            peak = std::max(peak, interpolated);
        }
    }

    // Check last sample
    if (sampleCount > 0) {
        peak = std::max(peak, std::abs(data[sampleCount - 1]));
    }

    return peak;
}

float AudioMetrics::calculateDynamicRange(const float* data, size_t sampleCount) {
    if (sampleCount == 0) return 0.0f;

    // Calculate RMS values over short windows
    const size_t windowSize = std::min(Constants::DYNAMIC_RANGE_WINDOW_SIZE, sampleCount);
    const size_t numWindows = sampleCount / windowSize;

    if (numWindows < 2) return 0.0f;

    std::vector<float> windowRMS;
    windowRMS.reserve(numWindows);

    for (size_t w = 0; w < numWindows; ++w) {
        float sum = 0.0f;
        size_t startIdx = w * windowSize;

        for (size_t i = 0; i < windowSize; ++i) {
            float sample = data[startIdx + i];
            sum += sample * sample;
        }

        float rms = std::sqrt(sum / windowSize);
        if (rms > Constants::SILENCE_RMS_THRESHOLD) {
            windowRMS.push_back(rms);
        }
    }

    if (windowRMS.size() < 2) return 0.0f;

    // Sort to find percentiles
    std::sort(windowRMS.begin(), windowRMS.end());

    // Use 95th percentile vs 10th percentile as dynamic range
    size_t idx95 = static_cast<size_t>(windowRMS.size() * Constants::DYNAMIC_RANGE_HIGH_PERCENTILE);
    size_t idx10 = static_cast<size_t>(windowRMS.size() * Constants::DYNAMIC_RANGE_LOW_PERCENTILE);

    float loud = windowRMS[idx95];
    float quiet = windowRMS[idx10];

    if (quiet > 0) {
        return Constants::AMPLITUDE_TO_DB_FACTOR * std::log10(loud / quiet);
    }

    return 0.0f;
}

float AudioMetrics::calculateZeroCrossingRate(const float* data, size_t sampleCount) {
    if (sampleCount < 2) return 0.0f;

    size_t crossings = 0;
    for (size_t i = 1; i < sampleCount; ++i) {
        if ((data[i-1] >= 0 && data[i] < 0) || (data[i-1] < 0 && data[i] >= 0)) {
            crossings++;
        }
    }

    return static_cast<float>(crossings) / static_cast<float>(sampleCount - 1);
}

float AudioMetrics::estimateSpectralCentroid(const float* data, size_t sampleCount) {
    // Very simplified spectral centroid estimation without FFT
    // This is just an approximation based on zero-crossing rate

    float zcr = calculateZeroCrossingRate(data, sampleCount);

    // Approximate frequency from zero-crossing rate
    // Using default sample rate (should be passed as parameter)
    float estimatedFreq = zcr * Constants::DEFAULT_SAMPLE_RATE / Constants::SPECTRAL_CENTROID_DIVISOR;

    return estimatedFreq;
}

// ============================================================================
// PerformanceMonitor Implementation
// ============================================================================

PerformanceMonitor::PerformanceMonitor()
    : enabled_(true) {
    reset();
}

PerformanceMonitor::~PerformanceMonitor() {
    // Destructor
}

void PerformanceMonitor::reset() {
    std::lock_guard<std::mutex> lock(mutex_);

    stats_ = PerformanceStats();
    latencyHistory_.clear();
    cpuHistory_.clear();
}

void PerformanceMonitor::startFrame() {
    if (!enabled_) return;

    frameStartTime_ = std::chrono::high_resolution_clock::now();
}

void PerformanceMonitor::endFrame(size_t samplesProcessed) {
    if (!enabled_) return;

    auto endTime = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::microseconds>(
        endTime - frameStartTime_).count();

    std::lock_guard<std::mutex> lock(mutex_);

    // Update statistics
    stats_.totalFrames++;
    stats_.totalSamples += samplesProcessed;

    float latencyMs = duration / Constants::MICROSECONDS_TO_MILLISECONDS;
    stats_.currentLatency = latencyMs;

    if (latencyMs < stats_.minLatency) {
        stats_.minLatency = latencyMs;
    }

    if (latencyMs > stats_.maxLatency) {
        stats_.maxLatency = latencyMs;
    }

    // Update average latency
    stats_.averageLatency = (stats_.averageLatency * (stats_.totalFrames - 1) + latencyMs) /
                           stats_.totalFrames;

    // Update latency history
    latencyHistory_.push_back(latencyMs);
    if (latencyHistory_.size() > Constants::MAX_LATENCY_HISTORY_SIZE) {
        latencyHistory_.erase(latencyHistory_.begin());
    }

    // Estimate CPU usage (simplified)
    float expectedDuration = (samplesProcessed / Constants::DEFAULT_SAMPLE_RATE) * Constants::MICROSECONDS_TO_MILLISECONDS; // ms
    float cpuUsage = (latencyMs / expectedDuration) * Constants::PERCENTAGE_FACTOR;

    stats_.cpuUsage = cpuUsage;
    cpuHistory_.push_back(cpuUsage);
    if (cpuHistory_.size() > Constants::MAX_CPU_HISTORY_SIZE) {
        cpuHistory_.erase(cpuHistory_.begin());
    }

    // Check for dropouts
    if (latencyMs > expectedDuration * Constants::DROPOUT_THRESHOLD_MULTIPLIER) {
        stats_.dropouts++;
    }
}

void PerformanceMonitor::recordDropout() {
    if (!enabled_) return;

    std::lock_guard<std::mutex> lock(mutex_);
    stats_.dropouts++;
}

void PerformanceMonitor::recordBufferUnderrun() {
    if (!enabled_) return;

    std::lock_guard<std::mutex> lock(mutex_);
    stats_.bufferUnderruns++;
}

void PerformanceMonitor::recordBufferOverrun() {
    if (!enabled_) return;

    std::lock_guard<std::mutex> lock(mutex_);
    stats_.bufferOverruns++;
}

PerformanceStats PerformanceMonitor::getStats() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return stats_;
}

std::vector<float> PerformanceMonitor::getLatencyHistory(size_t maxSamples) const {
    std::lock_guard<std::mutex> lock(mutex_);

    if (maxSamples == 0 || latencyHistory_.empty()) {
        return latencyHistory_;
    }

    size_t startIdx = latencyHistory_.size() > maxSamples ?
                     latencyHistory_.size() - maxSamples : 0;

    return std::vector<float>(latencyHistory_.begin() + startIdx, latencyHistory_.end());
}

std::vector<float> PerformanceMonitor::getCPUHistory(size_t maxSamples) const {
    std::lock_guard<std::mutex> lock(mutex_);

    if (maxSamples == 0 || cpuHistory_.empty()) {
        return cpuHistory_;
    }

    size_t startIdx = cpuHistory_.size() > maxSamples ?
                     cpuHistory_.size() - maxSamples : 0;

    return std::vector<float>(cpuHistory_.begin() + startIdx, cpuHistory_.end());
}

std::string PerformanceMonitor::getFormattedReport() const {
    std::lock_guard<std::mutex> lock(mutex_);

    std::stringstream ss;
    ss << std::fixed << std::setprecision(Constants::DISPLAY_PRECISION);
    ss << "=== Performance Report ===" << std::endl;
    ss << "Frames: " << stats_.totalFrames << std::endl;
    ss << "Samples: " << stats_.totalSamples << std::endl;
    ss << "Latency:" << std::endl;
    ss << "  Current: " << stats_.currentLatency << " ms" << std::endl;
    ss << "  Average: " << stats_.averageLatency << " ms" << std::endl;
    ss << "  Min: " << stats_.minLatency << " ms" << std::endl;
    ss << "  Max: " << stats_.maxLatency << " ms" << std::endl;
    ss << "CPU Usage: " << stats_.cpuUsage << "%" << std::endl;
    ss << "Dropouts: " << stats_.dropouts << std::endl;
    ss << "Buffer Underruns: " << stats_.bufferUnderruns << std::endl;
    ss << "Buffer Overruns: " << stats_.bufferOverruns << std::endl;

    return ss.str();
}

void PerformanceMonitor::enable(bool enabled) {
    std::lock_guard<std::mutex> lock(mutex_);
    enabled_ = enabled;
}

bool PerformanceMonitor::isEnabled() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return enabled_;
}

} // namespace Audio
} // namespace Nyth
