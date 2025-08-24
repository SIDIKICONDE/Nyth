#pragma once

#include <atomic>
#include <memory>
#include <string>
#include <vector>

#include "../../../jsi/JSICallbackManager.h"
#include "../config/EffectsConfig.h"


namespace facebook {
namespace react {

class DelayManager {
public:
    explicit DelayManager(std::shared_ptr<JSICallbackManager> callbackManager);
    ~DelayManager();

    // === Cycle de vie ===
    bool initialize(const Nyth::Audio::EffectsConfig& config);
    bool isInitialized() const;
    void release();

    // === Configuration ===
    bool setConfig(const Nyth::Audio::DelayConfig& config);
    Nyth::Audio::DelayConfig getConfig() const;
    bool setDelay(float delayMs);
    bool setFeedback(float feedback);
    bool setMix(float mix);

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
    struct DelayMetrics {
        float inputLevel = 0.0f;
        float outputLevel = 0.0f;
        float feedbackLevel = 0.0f;
        float wetLevel = 0.0f;
        bool isActive = false;
    };

    DelayMetrics getMetrics() const;

    // === Informations ===
    std::string getInfo() const;
    uint32_t getLatency() const;

    // === Callbacks ===
    using MetricsCallback = std::function<void(const DelayMetrics& metrics)>;
    void setMetricsCallback(MetricsCallback callback);

private:
    // === Composants AudioFX ===
    std::unique_ptr<AudioFX::DelayEffect> delay_;

    // === Gestionnaire de callbacks ===
    std::shared_ptr<JSICallbackManager> callbackManager_;

    // === Configuration ===
    Nyth::Audio::EffectsConfig config_;
    Nyth::Audio::DelayConfig delayConfig_;

    // === État ===
    std::atomic<bool> isInitialized_{false};
    std::atomic<bool> isEnabled_{true};
    std::atomic<bool> isBypassed_{false};

    // === Métriques ===
    mutable std::mutex metricsMutex_;
    DelayMetrics currentMetrics_;

    // === Callbacks ===
    MetricsCallback metricsCallback_;

    // === Méthodes privées ===
    void updateMetrics();
    void notifyMetricsCallback();
    bool validateConfig(const Nyth::Audio::DelayConfig& config) const;
};

} // namespace react
} // namespace facebook
