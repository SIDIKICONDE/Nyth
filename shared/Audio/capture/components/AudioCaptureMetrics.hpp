#ifndef NYTH_AUDIO_CAPTURE_METRICS_HPP
#define NYTH_AUDIO_CAPTURE_METRICS_HPP

// C++ Standard Library Includes with linter compatibility
#pragma once
#include "../../common/config/Constant.hpp"
#include <atomic>
#include <chrono>
#include <cstddef>
#include <string>
#include <vector>
#include <mutex>
#include <deque>
#include <algorithm>
#include <cmath> // For std::sqrt
#include <functional> // For std::function
#include <numeric> // For std::accumulate
#include <unordered_map> // For std::unordered_map
#include <limits> // For std::numeric_limits

namespace Nyth {
namespace Audio {

// Métriques de performance en temps réel
struct RealtimeMetrics {
    float cpuUsagePercent = Constants::DEFAULT_METRICS_VALUE;
    size_t memoryUsageBytes = Constants::DEFAULT_COUNTER_VALUE;
    float inputLatencyMs = Constants::DEFAULT_METRICS_VALUE;
    float outputLatencyMs = Constants::DEFAULT_METRICS_VALUE;
    float roundTripLatencyMs = Constants::DEFAULT_METRICS_VALUE;
    uint32_t xruns = Constants::DEFAULT_COUNTER_VALUE;  // Underruns + Overruns
    uint32_t droppedFrames = Constants::DEFAULT_COUNTER_VALUE;
    float currentLoad = Constants::DEFAULT_METRICS_VALUE;
};

// Statistiques détaillées
struct DetailedStatistics {
    // Distribution de latence
    float minLatencyMs = Constants::DEFAULT_METRICS_VALUE;
    float maxLatencyMs = Constants::DEFAULT_METRICS_VALUE;
    float avgLatencyMs = Constants::DEFAULT_METRICS_VALUE;
    float stdDevLatencyMs = Constants::DEFAULT_METRICS_VALUE;
    float p50LatencyMs = Constants::DEFAULT_METRICS_VALUE;  // Médiane
    float p95LatencyMs = Constants::DEFAULT_METRICS_VALUE;
    float p99LatencyMs = Constants::DEFAULT_METRICS_VALUE;

    // Qualité audio
    float signalToNoiseRatio = Constants::DEFAULT_METRICS_VALUE;
    float totalHarmonicDistortion = Constants::DEFAULT_METRICS_VALUE;
    uint32_t clippingEvents = Constants::DEFAULT_COUNTER_VALUE;
    float peakFrequency = Constants::DEFAULT_METRICS_VALUE;

    // Performance système
    float avgCpuUsage = Constants::DEFAULT_METRICS_VALUE;
    float peakCpuUsage = Constants::DEFAULT_METRICS_VALUE;
    size_t avgMemoryUsage = Constants::DEFAULT_COUNTER_VALUE;
    size_t peakMemoryUsage = Constants::DEFAULT_COUNTER_VALUE;

    // Erreurs
    uint32_t totalErrors = Constants::DEFAULT_COUNTER_VALUE;
    uint32_t permissionErrors = Constants::DEFAULT_COUNTER_VALUE;
    uint32_t deviceErrors = Constants::DEFAULT_COUNTER_VALUE;
    uint32_t bufferErrors = Constants::DEFAULT_COUNTER_VALUE;
};

// Historique circulaire pour les métriques
template<typename T>
class MetricHistory {
private:
    std::deque<std::pair<std::chrono::steady_clock::time_point, T>> history_;
    size_t maxSize_;
    mutable std::mutex mutex_;
    std::chrono::seconds retentionPeriod_;

public:
    MetricHistory(size_t maxSize = Constants::MAX_METRICS_HISTORY_SIZE, std::chrono::seconds retention = Constants::DEFAULT_RETENTION_PERIOD)
        : maxSize_(maxSize), retentionPeriod_(retention) {}

    void add(const T& value) {
        std::lock_guard<std::mutex> lock(mutex_);
        auto now = std::chrono::steady_clock::now();

        // Nettoyer les anciennes entrées
        auto cutoff = now - retentionPeriod_;
        while (!history_.empty() && history_.front().first < cutoff) {
            history_.pop_front();
        }

        // Ajouter la nouvelle valeur
        history_.emplace_back(now, value);

        // Limiter la taille
        while (history_.size() > maxSize_) {
            history_.pop_front();
        }
    }

    std::vector<T> getLastN(size_t n) const {
        std::lock_guard<std::mutex> lock(mutex_);
        std::vector<T> result;
        size_t count = std::min(n, history_.size());

        for (size_t i = history_.size() - count; i < history_.size(); ++i) {
            result.push_back(history_[i].second);
        }

        return result;
    }

    std::vector<T> getLastSeconds(int seconds) const {
        std::lock_guard<std::mutex> lock(mutex_);
        std::vector<T> result;
        auto cutoff = std::chrono::steady_clock::now() - std::chrono::seconds(seconds);

        for (const auto& [time, value] : history_) {
            if (time >= cutoff) {
                result.push_back(value);
            }
        }

        return result;
    }

    void clear() {
        std::lock_guard<std::mutex> lock(mutex_);
        history_.clear();
    }
};

// Collecteur de métriques principal
class AudioMetricsCollector {
private:
    std::atomic<float> cpuUsagePercent_{Constants::DEFAULT_METRICS_VALUE};
    std::atomic<size_t> memoryUsageBytes_{Constants::DEFAULT_COUNTER_VALUE};
    std::atomic<float> inputLatencyMs_{Constants::DEFAULT_METRICS_VALUE};
    std::atomic<float> outputLatencyMs_{Constants::DEFAULT_METRICS_VALUE};
    std::atomic<float> roundTripLatencyMs_{Constants::DEFAULT_METRICS_VALUE};
    std::atomic<uint32_t> xruns_{Constants::DEFAULT_COUNTER_VALUE};
    std::atomic<uint32_t> droppedFrames_{Constants::DEFAULT_COUNTER_VALUE};
    std::atomic<float> currentLoad_{Constants::DEFAULT_METRICS_VALUE};

    DetailedStatistics detailed_;

    MetricHistory<float> latencyHistory_;
    MetricHistory<float> cpuHistory_;
    MetricHistory<size_t> memoryHistory_;
    MetricHistory<float> levelHistory_;

    std::chrono::steady_clock::time_point startTime_;
    std::atomic<bool> isCollecting_{false};

    // Pour le calcul du CPU
    std::chrono::steady_clock::time_point lastCpuTime_;
    std::chrono::microseconds lastProcessingTime_{0};

public:
    AudioMetricsCollector() {
        startTime_ = std::chrono::steady_clock::now();
    }

    void startCollection() {
        isCollecting_ = true;
        startTime_ = std::chrono::steady_clock::now();
        lastCpuTime_ = startTime_;
    }

    void stopCollection() {
        isCollecting_ = false;
    }

    // Mise à jour des métriques de latence
    void updateLatency(float latencyMs) {
        if (!isCollecting_) return;

        inputLatencyMs_ = latencyMs;
        latencyHistory_.add(latencyMs);

        // Mettre à jour les statistiques
        auto history = latencyHistory_.getLastSeconds(Constants::METRICS_HISTORY_SECONDS);
        if (!history.empty()) {
            updateLatencyStats(history);
        }
    }

    // Mise à jour de l'utilisation CPU
    void updateCpuUsage(std::chrono::microseconds processingTime,
                        std::chrono::microseconds availableTime) {
        if (!isCollecting_) return;

        float usage = Constants::PERCENTAGE_FACTOR * processingTime.count() / availableTime.count();
        cpuUsagePercent_ = usage;
        cpuHistory_.add(usage);

        // Mettre à jour les statistiques
        auto history = cpuHistory_.getLastSeconds(Constants::CPU_HISTORY_SECONDS);
        if (!history.empty()) {
            detailed_.avgCpuUsage = std::accumulate(history.begin(), history.end(), Constants::DEFAULT_METRICS_VALUE) / history.size();
            detailed_.peakCpuUsage = *std::max_element(history.begin(), history.end());
        }
    }

    // Signaler un xrun (underrun ou overrun)
    void reportXRun() {
        xruns_++;
        detailed_.bufferErrors++;
        detailed_.totalErrors++;
    }

    // Signaler des frames perdues
    void reportDroppedFrames(uint32_t count) {
        droppedFrames_ += count;
    }

    // Signaler un événement de clipping
    void reportClipping() {
        detailed_.clippingEvents++;
    }

    // Obtenir les métriques en temps réel
    RealtimeMetrics getRealtimeMetrics() const {
        RealtimeMetrics metrics;
        metrics.cpuUsagePercent = cpuUsagePercent_.load();
        metrics.memoryUsageBytes = memoryUsageBytes_.load();
        metrics.inputLatencyMs = inputLatencyMs_.load();
        metrics.outputLatencyMs = outputLatencyMs_.load();
        metrics.roundTripLatencyMs = roundTripLatencyMs_.load();
        metrics.xruns = xruns_.load();
        metrics.droppedFrames = droppedFrames_.load();
        metrics.currentLoad = currentLoad_.load();
        return metrics;
    }

    // Obtenir les statistiques détaillées
    DetailedStatistics getDetailedStatistics() const {
        return detailed_;
    }

    // Réinitialiser toutes les métriques
    void reset() {
        cpuUsagePercent_ = Constants::DEFAULT_METRICS_VALUE;
        memoryUsageBytes_ = Constants::DEFAULT_COUNTER_VALUE;
        inputLatencyMs_ = Constants::DEFAULT_METRICS_VALUE;
        outputLatencyMs_ = Constants::DEFAULT_METRICS_VALUE;
        roundTripLatencyMs_ = Constants::DEFAULT_METRICS_VALUE;
        xruns_ = Constants::DEFAULT_COUNTER_VALUE;
        droppedFrames_ = Constants::DEFAULT_COUNTER_VALUE;
        currentLoad_ = Constants::DEFAULT_METRICS_VALUE;
        detailed_ = DetailedStatistics();
        latencyHistory_.clear();
        cpuHistory_.clear();
        memoryHistory_.clear();
        levelHistory_.clear();
        startTime_ = std::chrono::steady_clock::now();
    }

    // Export des métriques en JSON
    std::string exportToJSON() const {
        std::string json = "{\n";
        json += "  \"realtime\": {\n";
        json += "    \"cpuUsage\": " + std::to_string(cpuUsagePercent_.load()) + ",\n";
        json += "    \"memoryUsage\": " + std::to_string(memoryUsageBytes_.load()) + ",\n";
        json += "    \"inputLatency\": " + std::to_string(inputLatencyMs_.load()) + ",\n";
        json += "    \"xruns\": " + std::to_string(xruns_.load()) + ",\n";
        json += "    \"droppedFrames\": " + std::to_string(droppedFrames_.load()) + "\n";
        json += "  },\n";
        json += "  \"detailed\": {\n";
        json += "    \"avgLatency\": " + std::to_string(detailed_.avgLatencyMs) + ",\n";
        json += "    \"p95Latency\": " + std::to_string(detailed_.p95LatencyMs) + ",\n";
        json += "    \"clippingEvents\": " + std::to_string(detailed_.clippingEvents) + ",\n";
        json += "    \"totalErrors\": " + std::to_string(detailed_.totalErrors) + "\n";
        json += "  }\n";
        json += "}";
        return json;
    }

private:
    void updateLatencyStats(const std::vector<float>& history) {
        if (history.empty()) return;

        // Calculer min, max, moyenne
        detailed_.minLatencyMs = *std::min_element(history.begin(), history.end());
        detailed_.maxLatencyMs = *std::max_element(history.begin(), history.end());
        detailed_.avgLatencyMs = std::accumulate(history.begin(), history.end(), Constants::DEFAULT_METRICS_VALUE) / history.size();

        // Calculer les percentiles
        std::vector<float> sorted = history;
        std::sort(sorted.begin(), sorted.end());

        size_t p50Index = sorted.size() * Constants::PERCENTILE_50 / 100;
        size_t p95Index = sorted.size() * Constants::PERCENTILE_95 / 100;
        size_t p99Index = sorted.size() * Constants::PERCENTILE_99 / 100;

        detailed_.p50LatencyMs = sorted[p50Index];
        detailed_.p95LatencyMs = sorted[p95Index];
        detailed_.p99LatencyMs = sorted[p99Index];

        // Calculer l'écart-type
        float variance = Constants::VARIANCE_INITIAL_VALUE;
        for (float val : history) {
            float diff = val - detailed_.avgLatencyMs;
            variance += diff * diff;
        }
        detailed_.stdDevLatencyMs = std::sqrt(variance / history.size());
    }
};

// Classe pour l'analyse de métriques audio avancées
struct MetricsData {
    std::chrono::steady_clock::time_point timestamp;
    float rms = Constants::DEFAULT_METRICS_VALUE;
    float rmsDb = Constants::DEFAULT_METRICS_VALUE;
    float peak = Constants::DEFAULT_METRICS_VALUE;
    float peakDb = Constants::DEFAULT_METRICS_VALUE;
    float lufs = Constants::DEFAULT_METRICS_VALUE;
    float truePeak = Constants::DEFAULT_METRICS_VALUE;
    float truePeakDb = Constants::DEFAULT_METRICS_VALUE;
    float crestFactor = Constants::DEFAULT_METRICS_VALUE;
    float crestFactorDb = Constants::DEFAULT_METRICS_VALUE;
    float dynamicRange = Constants::DEFAULT_METRICS_VALUE;
    float zeroCrossingRate = Constants::DEFAULT_METRICS_VALUE;
    float spectralCentroid = Constants::DEFAULT_METRICS_VALUE;
};

struct PerformanceStats {
    uint64_t totalFrames = Constants::DEFAULT_COUNTER_VALUE;
    uint64_t totalSamples = Constants::DEFAULT_COUNTER_VALUE;
    float currentLatency = Constants::DEFAULT_METRICS_VALUE;
    float averageLatency = Constants::DEFAULT_METRICS_VALUE;
    float minLatency = std::numeric_limits<float>::max();
    float maxLatency = Constants::MAX_LATENCY_INITIAL;
    float cpuUsage = Constants::DEFAULT_METRICS_VALUE;
    uint32_t dropouts = Constants::DEFAULT_COUNTER_VALUE;
    uint32_t bufferUnderruns = Constants::DEFAULT_COUNTER_VALUE;
    uint32_t bufferOverruns = Constants::DEFAULT_COUNTER_VALUE;
};

class AudioMetrics {
private:
    bool enabled_;
    size_t windowSize_;
    int updateInterval_;
    std::chrono::steady_clock::time_point lastUpdateTime_;

    MetricsData currentMetrics_;
    MetricsData peakMetrics_;
    MetricsData averageMetrics_;

    std::vector<float> levelHistory_;
    std::vector<float> peakHistory_;

    size_t sampleCount_;
    size_t frameCount_;
    size_t updateCount_;

    std::function<void(const MetricsData&)> updateCallback_;
    mutable std::mutex mutex_;

    void updateAverages(const MetricsData& current);
    void updateHistory(const MetricsData& current);

    float calculateLUFS(const float* data, size_t frameCount, int channelCount);
    float calculateTruePeak(const float* data, size_t sampleCount);
    float calculateDynamicRange(const float* data, size_t sampleCount);
    float calculateZeroCrossingRate(const float* data, size_t sampleCount);
    float estimateSpectralCentroid(const float* data, size_t sampleCount);

public:
    AudioMetrics();
    ~AudioMetrics();

    void reset();
    void process(const float* data, size_t frameCount, int channelCount);

    MetricsData getCurrentMetrics() const;
    MetricsData getPeakMetrics() const;
    MetricsData getAverageMetrics() const;

    std::vector<float> getLevelHistory(size_t maxSamples) const;
    std::vector<float> getPeakHistory(size_t maxSamples) const;

    void setUpdateCallback(std::function<void(const MetricsData&)> callback);
    void setUpdateInterval(int milliseconds);
    void setHistorySize(size_t size);

    void enable(bool enabled);
    bool isEnabled() const;

    std::string getFormattedReport() const;
};

class PerformanceMonitor {
private:
    bool enabled_;
    PerformanceStats stats_;
    std::vector<float> latencyHistory_;
    std::vector<float> cpuHistory_;
    std::chrono::high_resolution_clock::time_point frameStartTime_;
    mutable std::mutex mutex_;

public:
    PerformanceMonitor();
    ~PerformanceMonitor();

    void reset();
    void startFrame();
    void endFrame(size_t samplesProcessed);

    void recordDropout();
    void recordBufferUnderrun();
    void recordBufferOverrun();

    PerformanceStats getStats() const;
    std::vector<float> getLatencyHistory(size_t maxSamples) const;
    std::vector<float> getCPUHistory(size_t maxSamples) const;

    std::string getFormattedReport() const;

    void enable(bool enabled);
    bool isEnabled() const;
};

// Profiler pour mesurer les performances des fonctions
class AudioProfiler {
private:
    struct ProfileData {
        std::string name;
        std::chrono::microseconds totalTime{0};
        uint64_t callCount = Constants::DEFAULT_COUNTER_VALUE;
        std::chrono::microseconds minTime{std::chrono::microseconds::max()};
        std::chrono::microseconds maxTime{0};
    };

    std::unordered_map<std::string, ProfileData> profiles_;
    mutable std::mutex mutex_;

public:
    class ScopedTimer {
    private:
        AudioProfiler* profiler_;
        std::string name_;
        std::chrono::steady_clock::time_point start_;

    public:
        ScopedTimer(AudioProfiler* profiler, const std::string& name)
            : profiler_(profiler), name_(name) {
            start_ = std::chrono::steady_clock::now();
        }

        ~ScopedTimer() {
            auto end = std::chrono::steady_clock::now();
            auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start_);
            if (profiler_) {
                profiler_->record(name_, duration);
            }
        }
    };

    void record(const std::string& name, std::chrono::microseconds duration) {
        std::lock_guard<std::mutex> lock(mutex_);
        auto& data = profiles_[name];
        data.name = name;
        data.totalTime += duration;
        data.callCount++;
        data.minTime = std::min(data.minTime, duration);
        data.maxTime = std::max(data.maxTime, duration);
    }

    ScopedTimer measure(const std::string& name) {
        return ScopedTimer(this, name);
    }

    void reset() {
        std::lock_guard<std::mutex> lock(mutex_);
        profiles_.clear();
    }

    std::string getReport() const {
        std::lock_guard<std::mutex> lock(mutex_);
        std::string report = "Audio Profiling Report:\n";
        report += "========================\n";

        for (const auto& [name, data] : profiles_) {
            auto avgTime = data.callCount > 0 ?
                data.totalTime.count() / data.callCount : Constants::DEFAULT_COUNTER_VALUE;

            report += "Function: " + name + "\n";
            report += "  Calls: " + std::to_string(data.callCount) + "\n";
            report += "  Total: " + std::to_string(data.totalTime.count()) + " µs\n";
            report += "  Avg: " + std::to_string(avgTime) + " µs\n";
            report += "  Min: " + std::to_string(data.minTime.count()) + " µs\n";
            report += "  Max: " + std::to_string(data.maxTime.count()) + " µs\n\n";
        }

        return report;
    }
};

// Macro pour faciliter le profiling
#define AUDIO_PROFILE(profiler, name) \
    AudioProfiler::ScopedTimer _timer_##__LINE__ = (profiler)->measure(name)

} // namespace Audio
} // namespace Nyth

#endif // NYTH_AUDIO_CAPTURE_METRICS_HPP
