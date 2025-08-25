#pragma once

#ifdef __APPLE__
#if TARGET_OS_IOS

#include "../../core/AudioCapture.hpp"
#include <AudioToolbox/AudioToolbox.h>
#include <AVFoundation/AVFoundation.h>

namespace Nyth {
namespace Audio {

class AudioCaptureIOS : public AudioCaptureBase {
private:
    // Audio Unit pour la capture
    AudioComponentInstance audioUnit_ = nullptr;
    AudioStreamBasicDescription audioFormat_;

    // AVAudioSession pour la gestion de la session audio
    AVAudioSession* audioSession_ = nil;

    // Buffer circulaire pour les données
    struct CircularBuffer {
        std::vector<float> buffer;
        size_t writePos = Constants::INITIAL_POSITION;
        size_t readPos = Constants::INITIAL_POSITION;
        size_t size = Constants::INITIAL_SIZE;
        mutable std::mutex mutex;

        void write(const float* data, size_t frames);
        size_t read(float* data, size_t maxFrames);
        size_t available() const;
        void clear();
    } circularBuffer_;

    // Thread de traitement
    std::thread processingThread_;
    std::atomic<bool> shouldProcess_{false};
    std::condition_variable processingCV_;
    std::mutex processingMutex_;

    // Méthodes privées
    bool setupAudioSession();
    bool setupAudioUnit();
    void teardownAudioUnit();
    void processingThreadFunc();

    // Callbacks Audio Unit
    static OSStatus recordingCallback(void* inRefCon, AudioUnitRenderActionFlags* ioActionFlags,
                                      const AudioTimeStamp* inTimeStamp, UInt32 inBusNumber, UInt32 inNumberFrames,
                                      AudioBufferList* ioData);

    static OSStatus renderNotifyCallback(void* inRefCon, AudioUnitRenderActionFlags* ioActionFlags,
                                         const AudioTimeStamp* inTimeStamp, UInt32 inBusNumber, UInt32 inNumberFrames,
                                         AudioBufferList* ioData);

    // Gestion des interruptions
    void handleInterruption(NSNotification* notification);
    void handleRouteChange(NSNotification* notification);

    // Méthodes SIMD
    void processAudioData_SIMD(const float* data, size_t sampleCount);
    void updateLevels_SIMD(const float* data, size_t sampleCount);

public:
    AudioCaptureIOS();
    virtual ~AudioCaptureIOS() override;

    bool initialize(const AudioCaptureConfig& config) override;
    bool start() override;
    bool pause() override;
    bool resume() override;
    bool stop() override;
    void release() override;

    bool updateConfig(const AudioCaptureConfig& config) override;
    std::vector<AudioDeviceInfo> getAvailableDevices() const override;
    bool selectDevice(const std::string& deviceId) override;
    AudioDeviceInfo getCurrentDevice() const override;

    bool hasPermission() const override;
};

} // namespace Audio
} // namespace Nyth

#endif // TARGET_OS_IOS
#endif // __APPLE__
