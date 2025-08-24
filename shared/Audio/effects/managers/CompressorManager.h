#pragma once

#include <atomic>
#include <memory>
#include <mutex>
#include <string>
#include <vector>

#include "../../capture/jsi/JSICallbackManager.h"
#include "../components/Compressor.hpp"
#include "../config/EffectsConfig.h"

namespace facebook {
namespace react {

class CompressorManager {
public:
    explicit CompressorManager(std::shared_ptr<JSICallbackManager> callbackManager);
    ~CompressorManager();

    // === Cycle de vie ===
    bool initialize(const Nyth::Audio::EffectsConfig& config);
    bool isInitialized() const;
    void release();

    // === Configuration ===
    bool setConfig(const Nyth::Audio::CompressorConfig& config);
    Nyth::Audio::CompressorConfig getConfig() const;
    bool setThreshold(float thresholdDb);
    bool setRatio(float ratio);
    bool setAttack(float attackMs);
    bool setRelease(float releaseMs);
    bool setMakeup(float makeupDb);

    // === Contrôle ===
    bool enable(bool enabled);
    bool isEnabled() const;
    bool bypass(bool bypass);
    bool isBypassed() const;

    // === Traitement audio ===
    bool processMono(std::vector<float>& input, std::vector<float>& output);
    bool processStereo(std::vector<float>& inputL, std::vector<float>& inputR, std::vector<float>& outputL,
                       std::vector<float>& outputR);

    // === Métriques ===
    struct CompressorMetrics {
        float inputLevel = 0.0f;
        float outputLevel = 0.0f;
        float gainReduction = 0.0f;
        float compressionRatio = 1.0f;
        bool isActive = false;
    };

    CompressorMetrics getMetrics() const;

    // === Informations ===
    std::string getInfo() const;
    uint32_t getLatency() const;

    // === Callbacks ===
    using MetricsCallback = std::function<void(const CompressorMetrics& metrics)>;
    void setMetricsCallback(MetricsCallback callback);

private:
    // === Composants AudioFX ===
    std::unique_ptr<AudioFX::CompressorEffect> compressor_;

    // === Gestionnaire de callbacks ===
    std::shared_ptr<JSICallbackManager> callbackManager_;

    // === Configuration ===
    Nyth::Audio::EffectsConfig config_;
    Nyth::Audio::CompressorConfig compressorConfig_;

    // === État ===
    std::atomic<bool> isInitialized_{false};
    std::atomic<bool> isEnabled_{true};
    std::atomic<bool> isBypassed_{false};

    // === Métriques ===
    mutable std::mutex metricsMutex_;
    CompressorMetrics currentMetrics_;

    // === Callbacks ===
    MetricsCallback metricsCallback_;

    // === Méthodes privées ===
    void updateMetrics();
    void notifyMetricsCallback();
    bool validateConfig(const Nyth::Audio::CompressorConfig& config) const;
};

} // namespace react
} // namespace facebook
