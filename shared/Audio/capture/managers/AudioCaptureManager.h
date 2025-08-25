#pragma once

#include "../components/AudioCapture.hpp"
#include "../components/AudioFileWriter.hpp"
#include "../../common/jsi/JSICallbackManager.h"
#include "../../common/SIMD/SIMDIntegration.hpp"
#include <atomic>
#include <functional>
#include <memory>
#include <mutex>
#include <string>
#include <vector>


namespace facebook {
namespace react {

class AudioCaptureManager {
public:
    using AudioConsumerCallback = std::function<void(const float*, size_t, int)>;

    explicit AudioCaptureManager(std::shared_ptr<JSICallbackManager> callbackManager);
    ~AudioCaptureManager();

    // === Cycle de vie ===
    bool initialize(const Nyth::Audio::AudioCaptureConfig& config);
    bool start();
    bool stop();
    bool pause();
    bool resume();
    bool isCapturing() const;

    // === État et informations ===
    Nyth::Audio::CaptureState getState() const;
    Nyth::Audio::CaptureStatistics getStatistics() const;
    void resetStatistics();

    // === Configuration ===
    bool updateConfig(const Nyth::Audio::AudioCaptureConfig& config);
    Nyth::Audio::AudioCaptureConfig getConfig() const;

    // === Niveaux audio ===
    float getCurrentLevel() const;
    float getPeakLevel() const;
    void resetPeakLevel();

    // === Analyse audio ===
    double getRMS() const;
    double getRMSdB() const;
    bool isSilent(float threshold = 0.01f) const;
    bool hasClipping() const;

    // === Méthodes SIMD ===
    float getRMS_SIMD() const;
    float getPeakLevel_SIMD() const;
    void processAudioData_SIMD(float* buffer, size_t count);
    void analyzeAudioBuffer_SIMD(const float* buffer, size_t count,
                                 float& rms, float& peak, bool& hasClipping);

    // === Périphériques ===
    std::vector<Nyth::Audio::AudioDeviceInfo> getAvailableDevices() const;
    bool selectDevice(const std::string& deviceId);
    Nyth::Audio::AudioDeviceInfo getCurrentDevice() const;

    // === Permissions ===
    bool hasPermission() const;
    void requestPermission(std::function<void(bool)> callback);

    // === Enregistrement ===
    bool startRecording(const std::string& filePath,
                        const Nyth::Audio::AudioFileWriterConfig& writerConfig,
                        float maxDurationSeconds = 0.0f,
                        size_t maxFileSizeBytes = 0);
    void stopRecording();
    void pauseRecording();
    void resumeRecording();
    bool isRecording() const;
    struct RecordingInfo {
        double durationSeconds = 0.0;
        size_t frames = 0;
        std::string path;
        bool recording = false;
        bool paused = false;
    };
    RecordingInfo getRecordingInfo() const;

    // === Connexion au pipeline ===
    void setAudioConsumer(AudioConsumerCallback callback);

private:
    // === Membres privés ===
    std::shared_ptr<Nyth::Audio::AudioCapture> capture_;
    Nyth::Audio::AudioCaptureConfig config_;
    std::shared_ptr<JSICallbackManager> callbackManager_;

    mutable std::mutex captureMutex_;
    std::atomic<bool> isInitialized_{false};

    // Enregistrement
    std::unique_ptr<Nyth::Audio::AudioRecorder> recorder_;
    std::string currentRecordingPath_;

    // === Consommateur audio externe ===
    AudioConsumerCallback audioConsumer_;

    // === Conversion entre les configurations ===
    Nyth::Audio::AudioCaptureConfig convertToEngineConfig(const Nyth::Audio::AudioCaptureConfig& config) const;
    Nyth::Audio::AudioCaptureConfig convertFromEngineConfig(const Nyth::Audio::AudioCaptureConfig& engineConfig) const;

    // === Callbacks natifs ===
    void setupCallbacks();
    void onAudioData(const float* data, size_t frameCount, int channels);
    void onError(const std::string& error);
    void onStateChange(Nyth::Audio::CaptureState oldState, Nyth::Audio::CaptureState newState);

    // === Méthodes helpers ===
    void cleanup();
    bool validateConfig(const Nyth::Audio::AudioCaptureConfig& config) const;

    // === Méthodes privées SIMD ===
    void processAudioDataStandard(float* buffer, size_t count);
};

} // namespace react
} // namespace facebook
