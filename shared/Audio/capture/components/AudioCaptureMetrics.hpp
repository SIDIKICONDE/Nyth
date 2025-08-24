#pragma once

#include <atomic>
#include <chrono>
#include <cstddef>
#include <string>
#include <vector>
#include <mutex>
#include <deque>
#include <algorithm>
#include <cmath> // For std::sqrt
#include <numeric> // For std::accumulate
#include <unordered_map> // For std::unordered_map
#include <limits> // For std::numeric_limits

namespace Nyth {
namespace Audio {

// Métriques de performance en temps réel
struct RealtimeMetrics {
    float cpuUsagePercent = 0.0f;
    size_t memoryUsageBytes = 0;
    float inputLatencyMs = 0.0f;
    float outputLatencyMs = 0.0f;
    float roundTripLatencyMs = 0.0f;
    uint32_t xruns = 0;  // Underruns + Overruns
    uint32_t droppedFrames = 0;
    float currentLoad = 0.0f;
};

// Statistiques détaillées
struct DetailedStatistics {
    // Distribution de latence
    float minLatencyMs = 0.0f;
    float maxLatencyMs = 0.0f;
    float avgLatencyMs = 0.0f;
    float stdDevLatencyMs = 0.0f;
    float p50LatencyMs = 0.0f;  // Médiane
    float p95LatencyMs = 0.0f;
    float p99LatencyMs = 0.0f;
    
    // Qualité audio
    float signalToNoiseRatio = 0.0f;
    float totalHarmonicDistortion = 0.0f;
    uint32_t clippingEvents = 0;
    float peakFrequency = 0.0f;
    
    // Performance système
    float avgCpuUsage = 0.0f;
    float peakCpuUsage = 0.0f;
    size_t avgMemoryUsage = 0;
    size_t peakMemoryUsage = 0;
    
    // Erreurs
    uint32_t totalErrors = 0;
    uint32_t permissionErrors = 0;
    uint32_t deviceErrors = 0;
    uint32_t bufferErrors = 0;
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
    MetricHistory(size_t maxSize = 1000, std::chrono::seconds retention = std::chrono::seconds(300))
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
    std::atomic<float> cpuUsagePercent_{0.0f};
    std::atomic<size_t> memoryUsageBytes_{0};
    std::atomic<float> inputLatencyMs_{0.0f};
    std::atomic<float> outputLatencyMs_{0.0f};
    std::atomic<float> roundTripLatencyMs_{0.0f};
    std::atomic<uint32_t> xruns_{0};
    std::atomic<uint32_t> droppedFrames_{0};
    std::atomic<float> currentLoad_{0.0f};
    
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
        auto history = latencyHistory_.getLastSeconds(60);
        if (!history.empty()) {
            updateLatencyStats(history);
        }
    }
    
    // Mise à jour de l'utilisation CPU
    void updateCpuUsage(std::chrono::microseconds processingTime, 
                        std::chrono::microseconds availableTime) {
        if (!isCollecting_) return;
        
        float usage = 100.0f * processingTime.count() / availableTime.count();
        cpuUsagePercent_ = usage;
        cpuHistory_.add(usage);
        
        // Mettre à jour les statistiques
        auto history = cpuHistory_.getLastSeconds(60);
        if (!history.empty()) {
            detailed_.avgCpuUsage = std::accumulate(history.begin(), history.end(), 0.0f) / history.size();
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
        cpuUsagePercent_ = 0.0f;
        memoryUsageBytes_ = 0;
        inputLatencyMs_ = 0.0f;
        outputLatencyMs_ = 0.0f;
        roundTripLatencyMs_ = 0.0f;
        xruns_ = 0;
        droppedFrames_ = 0;
        currentLoad_ = 0.0f;
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
        detailed_.avgLatencyMs = std::accumulate(history.begin(), history.end(), 0.0f) / history.size();
        
        // Calculer les percentiles
        std::vector<float> sorted = history;
        std::sort(sorted.begin(), sorted.end());
        
        size_t p50Index = sorted.size() * 50 / 100;
        size_t p95Index = sorted.size() * 95 / 100;
        size_t p99Index = sorted.size() * 99 / 100;
        
        detailed_.p50LatencyMs = sorted[p50Index];
        detailed_.p95LatencyMs = sorted[p95Index];
        detailed_.p99LatencyMs = sorted[p99Index];
        
        // Calculer l'écart-type
        float variance = 0.0f;
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
    float rms = 0.0f;
    float rmsDb = 0.0f;
    float peak = 0.0f;
    float peakDb = 0.0f;
    float lufs = 0.0f;
    float truePeak = 0.0f;
    float truePeakDb = 0.0f;
    float crestFactor = 0.0f;
    float crestFactorDb = 0.0f;
    float dynamicRange = 0.0f;
    float zeroCrossingRate = 0.0f;
    float spectralCentroid = 0.0f;
};

struct PerformanceStats {
    uint64_t totalFrames = 0;
    uint64_t totalSamples = 0;
    float currentLatency = 0.0f;
    float averageLatency = 0.0f;
    float minLatency = std::numeric_limits<float>::max();
    float maxLatency = 0.0f;
    float cpuUsage = 0.0f;
    uint32_t dropouts = 0;
    uint32_t bufferUnderruns = 0;
    uint32_t bufferOverruns = 0;
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
        uint64_t callCount = 0;
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
                data.totalTime.count() / data.callCount : 0;
            
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