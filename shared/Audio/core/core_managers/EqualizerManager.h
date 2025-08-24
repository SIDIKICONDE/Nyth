#pragma once

#include "../config/AudioConfig.h"
#include "../core/AudioEqualizer.hpp"
#include "../core/AudioError.hpp"
#include "../core/EQPresetFactory.hpp"
#include "../jsi/JSICallbackManager.h"
#include <atomic>
#include <functional>
#include <memory>
#include <mutex>
#include <unordered_map>


namespace facebook {
namespace react {

class EqualizerManager {
public:
    explicit EqualizerManager(std::shared_ptr<JSICallbackManager> callbackManager);
    ~EqualizerManager();

    // === Cycle de vie ===
    bool initialize(const Nyth::Audio::AudioConfig& config);
    bool isInitialized() const;
    void release();

    // === Configuration globale ===
    bool setMasterGain(double gainDB);
    bool setBypass(bool bypass);
    bool setSampleRate(uint32_t sampleRate);
    double getMasterGain() const;
    bool isBypassed() const;

    // === Configuration des bandes ===
    bool setBand(size_t bandIndex, double frequency, double gainDB, double q, int filterType, bool enabled);
    bool getBand(size_t bandIndex, double& frequency, double& gainDB, double& q, int& filterType, bool& enabled) const;
    bool setBandGain(size_t bandIndex, double gainDB);
    bool setBandFrequency(size_t bandIndex, double frequency);
    bool setBandQ(size_t bandIndex, double q);
    bool setBandType(size_t bandIndex, int filterType);
    bool setBandEnabled(size_t bandIndex, bool enabled);

    // === Informations ===
    size_t getNumBands() const;
    uint32_t getSampleRate() const;

    // === Processing ===
    bool processMono(const float* input, float* output, size_t numSamples);
    bool processStereo(const float* inputL, const float* inputR, float* outputL, float* outputR, size_t numSamples);

    // === Presets ===
    bool loadPreset(const std::string& presetName);
    bool savePreset(const std::string& presetName);
    void resetAllBands();
    std::vector<std::string> getAvailablePresets() const;

private:
    // === Membres privés ===
    std::unique_ptr<Audio::core::AudioEqualizer> equalizer_;
    std::shared_ptr<JSICallbackManager> callbackManager_;

    Nyth::Audio::AudioConfig config_;
    mutable std::mutex equalizerMutex_;
    std::atomic<bool> isInitialized_{false};

    // Cache des presets personnalisés
    std::unordered_map<std::string, AudioFX::EQPreset> customPresets_;

    // === Conversion d'enums ===
    AudioFX::FilterType convertToAudioFXFilterType(int filterType) const;
    int convertFromAudioFXFilterType(AudioFX::FilterType type) const;

    // === Validation ===
    bool validateBandIndex(size_t bandIndex) const;
    bool validateParameters(double frequency, double gainDB, double q) const;
};

} // namespace react
} // namespace facebook
