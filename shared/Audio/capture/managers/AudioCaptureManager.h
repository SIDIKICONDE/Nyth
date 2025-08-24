#pragma once

#include "../capture/AudioCapture.hpp"
#include "../config/AudioConfig.h"
#include "../jsi/JSICallbackManager.h"
#include <atomic>
#include <functional>
#include <memory>
#include <mutex>

namespace facebook {
namespace react {

class AudioCaptureManager {
public:
    explicit AudioCaptureManager(std::shared_ptr<JSICallbackManager> callbackManager);
    ~AudioCaptureManager();

    // === Cycle de vie ===
    bool initialize(const Nyth::Audio::AudioConfig& config);
    bool start();
    bool stop();
    bool pause();
    bool resume();
    bool isCapturing() const;

    // === État et informations ===
    Audio::capture::CaptureState getState() const;
    Audio::capture::CaptureStatistics getStatistics() const;
    void resetStatistics();

    // === Configuration ===
    bool updateConfig(const Nyth::Audio::AudioConfig& config);
    Nyth::Audio::AudioConfig getConfig() const;

    // === Niveaux audio ===
    float getCurrentLevel() const;
    float getPeakLevel() const;
    void resetPeakLevel();

    // === Analyse audio ===
    double getRMS() const;
    double getRMSdB() const;
    bool isSilent(float threshold = 0.01f) const;
    bool hasClipping() const;

    // === Périphériques ===
    std::vector<Audio::capture::AudioDeviceInfo> getAvailableDevices() const;
    bool selectDevice(const std::string& deviceId);
    Audio::capture::AudioDeviceInfo getCurrentDevice() const;

    // === Permissions ===
    bool hasPermission() const;
    void requestPermission(std::function<void(bool)> callback);

private:
    // === Membres privés ===
    std::unique_ptr<Audio::capture::AudioCapture> capture_;
    Nyth::Audio::AudioConfig config_;
    std::shared_ptr<JSICallbackManager> callbackManager_;

    mutable std::mutex captureMutex_;
    std::atomic<bool> isInitialized_{false};

    // === Conversion entre les configurations ===
    Audio::capture::AudioCaptureConfig convertToEngineConfig(const Nyth::Audio::AudioConfig& config) const;
    Nyth::Audio::AudioConfig convertFromEngineConfig(const Audio::capture::AudioCaptureConfig& engineConfig) const;

    // === Callbacks natifs ===
    void setupCallbacks();
    void onAudioData(const float* data, size_t frameCount, int channels);
    void onError(const std::string& error);
    void onStateChange(Audio::capture::CaptureState oldState, Audio::capture::CaptureState newState);

    // === Méthodes helpers ===
    void cleanup();
    bool validateConfig(const Nyth::Audio::AudioConfig& config) const;
};

} // namespace react
} // namespace facebook
