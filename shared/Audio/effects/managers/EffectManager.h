#pragma once

#include <atomic>
#include <map>
#include <memory>
#include <mutex>
#include <string>
#include <vector>

#include <jsi/jsi.h>
#include "../../capture/jsi/JSICallbackManager.h"
#include "../components/EffectBase.hpp"
#include "../config/EffectsConfig.h"
#include "../config/EffectsLimits.h"

namespace facebook {
namespace react {

class EffectManager {
public:
    explicit EffectManager(std::shared_ptr<JSICallbackManager> callbackManager);
    ~EffectManager();

    // === Cycle de vie ===
    bool initialize(const Nyth::Audio::EffectsConfig& config);
    bool isInitialized() const;
    void release();

    // === Gestion des effets ===
    int createEffect(Nyth::Audio::Effects::EffectType type);
    bool destroyEffect(int effectId);
    bool hasEffect(int effectId) const;
    std::vector<int> getActiveEffects() const;

    // === Configuration des effets ===
    bool setEffectConfig(jsi::Runtime& rt, int effectId, const jsi::Object& config);
    jsi::Object getEffectConfig(jsi::Runtime& rt, int effectId) const;
    bool enableEffect(int effectId, bool enabled);
    bool isEffectEnabled(int effectId) const;

    // === Contrôle global ===
    bool setBypassAll(bool bypass);
    bool isBypassAll() const;
    bool setMasterLevels(float input, float output);
    void getMasterLevels(float& input, float& output) const;

    // === Traitement audio ===
    bool processAudio(const float* input, float* output, size_t frameCount, int channels);
    bool processAudioStereo(const float* inputL, const float* inputR, float* outputL, float* outputR,
                            size_t frameCount);

    // === Métriques et statistiques ===
    struct ProcessingMetrics {
        float inputLevel = 0.0f;
        float outputLevel = 0.0f;
        uint64_t processedFrames = 0;
        uint64_t processedSamples = 0;
        size_t activeEffectsCount = 0;
        double processingTimeMs = 0.0;
    };

    ProcessingMetrics getMetrics() const;

    // === Informations ===
    std::string getInfo() const;
    size_t getMaxEffects() const;
    uint32_t getLatency() const;

    // === Callbacks ===
    using ProcessingCallback = std::function<void(const ProcessingMetrics& metrics)>;
    using EffectCallback = std::function<void(int effectId, const std::string& event)>;
    void setProcessingCallback(ProcessingCallback callback);
    void setEffectCallback(EffectCallback callback);

private:
    // === Gestionnaire de callbacks ===
    std::shared_ptr<JSICallbackManager> callbackManager_;

    // === Configuration ===
    Nyth::Audio::EffectsConfig config_;

    // === État ===
    std::atomic<bool> isInitialized_{false};
    std::atomic<bool> bypassAll_{false};
    mutable std::mutex effectsMutex_;

    // === Gestion des IDs ===
    std::atomic<int> nextEffectId_{1};
    std::map<int, std::unique_ptr<AudioFX::IAudioEffect>> activeEffects_;

    // === Niveaux maître ===
    std::atomic<float> masterInputLevel_{1.0f};
    std::atomic<float> masterOutputLevel_{1.0f};

    // === Métriques ===
    mutable std::mutex metricsMutex_;
    ProcessingMetrics currentMetrics_;

    // === Callbacks ===
    ProcessingCallback processingCallback_;
    EffectCallback effectCallback_;

    // === Buffers de travail ===
    std::vector<float> workBufferL_;
    std::vector<float> workBufferR_;

    // === Méthodes privées ===
    bool validateEffectType(Nyth::Audio::Effects::EffectType type) const;
    std::unique_ptr<AudioFX::IAudioEffect> createEffectByType(Nyth::Audio::Effects::EffectType type);
    void updateMetrics();
    void notifyProcessingCallback();
    void notifyEffectCallback(int effectId, const std::string& event);
    Nyth::Audio::Effects::EffectType stringToEffectType(const std::string& typeStr) const;
    std::string effectTypeToString(Nyth::Audio::Effects::EffectType type) const;
};

} // namespace react
} // namespace facebook
