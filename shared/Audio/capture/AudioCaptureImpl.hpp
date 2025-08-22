#pragma once

#include "AudioCapture.hpp"
#include <mutex>
#include <thread>
#include <queue>
#include <condition_variable>

#ifdef __ANDROID__
#include <SLES/OpenSLES.h>
#include <SLES/OpenSLES_Android.h>
#include <aaudio/AAudio.h>
#include <oboe/Oboe.h>
#endif

#ifdef __APPLE__
#include <TargetConditionals.h>
#if TARGET_OS_IOS
#import <AVFoundation/AVFoundation.h>
#import <AudioToolbox/AudioToolbox.h>
#endif
#endif

namespace Nyth {
namespace Audio {

// === Implémentation Android ===
#ifdef __ANDROID__

class AudioCaptureAndroid : public AudioCaptureBase {
private:
    // Option 1: OpenSL ES (compatible avec plus d'appareils)
    struct OpenSLContext {
        SLObjectItf engineObject = nullptr;
        SLEngineItf engineEngine = nullptr;
        SLObjectItf recorderObject = nullptr;
        SLRecordItf recorderRecord = nullptr;
        SLAndroidSimpleBufferQueueItf recorderBufferQueue = nullptr;
        
        std::vector<int16_t> buffers[3];  // Triple buffering
        int currentBuffer = 0;
    } opensl_;
    
    // Option 2: AAudio (Android 8.0+, meilleure latence)
    struct AAudioContext {
        AAudioStream* stream = nullptr;
        bool useAAudio = false;
    } aaudio_;
    
    // Option 3: Oboe (wrapper moderne, recommandé)
    class OboeCallback : public oboe::AudioStreamDataCallback {
    public:
        AudioCaptureAndroid* parent = nullptr;
        
        oboe::DataCallbackResult onAudioReady(
            oboe::AudioStream* stream,
            void* audioData,
            int32_t numFrames) override;
            
        void onErrorBeforeClose(oboe::AudioStream* stream, oboe::Result error) override;
        void onErrorAfterClose(oboe::AudioStream* stream, oboe::Result error) override;
    };
    
    std::shared_ptr<oboe::AudioStream> oboeStream_;
    std::unique_ptr<OboeCallback> oboeCallback_;
    
    // Méthodes privées
    bool initializeOpenSL();
    bool initializeAAudio();
    bool initializeOboe();
    void cleanupOpenSL();
    void cleanupAAudio();
    void cleanupOboe();
    
    static void openSLRecorderCallback(SLAndroidSimpleBufferQueueItf bq, void* context);
    static void aaudioDataCallback(AAudioStream* stream, void* userData,
                                   void* audioData, int32_t numFrames);
    static void aaudioErrorCallback(AAudioStream* stream, void* userData, aaudio_result_t error);
    
public:
    AudioCaptureAndroid();
    ~AudioCaptureAndroid() override;
    
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
    void requestPermission(std::function<void(bool granted)> callback) override;
};

#endif // __ANDROID__

// === Implémentation iOS ===
#ifdef __APPLE__
#if TARGET_OS_IOS

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
        size_t writePos = 0;
        size_t readPos = 0;
        size_t size = 0;
        std::mutex mutex;
        
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
    static OSStatus recordingCallback(void* inRefCon,
                                     AudioUnitRenderActionFlags* ioActionFlags,
                                     const AudioTimeStamp* inTimeStamp,
                                     UInt32 inBusNumber,
                                     UInt32 inNumberFrames,
                                     AudioBufferList* ioData);
    
    static OSStatus renderNotifyCallback(void* inRefCon,
                                        AudioUnitRenderActionFlags* ioActionFlags,
                                        const AudioTimeStamp* inTimeStamp,
                                        UInt32 inBusNumber,
                                        UInt32 inNumberFrames,
                                        AudioBufferList* ioData);
    
    // Gestion des interruptions
    void handleInterruption(NSNotification* notification);
    void handleRouteChange(NSNotification* notification);
    
public:
    AudioCaptureIOS();
    ~AudioCaptureIOS() override;
    
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
    void requestPermission(std::function<void(bool granted)> callback) override;
};

#endif // TARGET_OS_IOS
#endif // __APPLE__

// === Implémentation de base commune ===

class AudioCaptureBaseImpl : public AudioCaptureBase {
protected:
    std::chrono::steady_clock::time_point captureStartTime_;
    std::mutex statsMutex_;
    
    void updateStatistics(size_t frameCount, size_t byteCount);
    
public:
    void resetStatistics() override {
        statistics_ = CaptureStatistics();
        currentLevel_ = 0.0f;
        peakLevel_ = 0.0f;
    }
};

// === Factory implementation ===

inline std::unique_ptr<AudioCapture> AudioCapture::create() {
    AudioCaptureConfig defaultConfig;
    return create(defaultConfig);
}

inline std::unique_ptr<AudioCapture> AudioCapture::create(const AudioCaptureConfig& config) {
#ifdef __ANDROID__
    auto capture = std::make_unique<AudioCaptureAndroid>();
#elif defined(__APPLE__) && TARGET_OS_IOS
    auto capture = std::make_unique<AudioCaptureIOS>();
#else
    // Fallback ou erreur de compilation pour les plateformes non supportées
    #error "Platform not supported for audio capture"
#endif
    
    if (capture && capture->initialize(config)) {
        return capture;
    }
    
    return nullptr;
}

// === Implémentation des méthodes de base ===

inline void AudioCaptureBase::setState(CaptureState newState) {
    CaptureState oldState = state_.exchange(newState);
    if (stateChangeCallback_ && oldState != newState) {
        stateChangeCallback_(oldState, newState);
    }
}

inline void AudioCaptureBase::reportError(const std::string& error) {
    setState(CaptureState::Error);
    if (errorCallback_) {
        errorCallback_(error);
    }
}

inline void AudioCaptureBase::processAudioData(const float* data, size_t frameCount) {
    if (!data || frameCount == 0) return;
    
    // Mise à jour des niveaux
    updateLevels(data, frameCount * config_.channelCount);
    
    // Mise à jour des statistiques
    statistics_.framesProcessed += frameCount;
    statistics_.bytesProcessed += frameCount * config_.channelCount * sizeof(float);
    
    // Appel du callback
    if (dataCallback_) {
        dataCallback_(data, frameCount, config_.channelCount);
    }
}

inline void AudioCaptureBase::processAudioDataInt16(const int16_t* data, size_t frameCount) {
    if (!data || frameCount == 0) return;
    
    // Mise à jour des niveaux
    updateLevelsInt16(data, frameCount * config_.channelCount);
    
    // Mise à jour des statistiques
    statistics_.framesProcessed += frameCount;
    statistics_.bytesProcessed += frameCount * config_.channelCount * sizeof(int16_t);
    
    // Appel du callback
    if (dataCallbackInt16_) {
        dataCallbackInt16_(data, frameCount, config_.channelCount);
    }
}

inline void AudioCaptureBase::updateLevels(const float* data, size_t sampleCount) {
    if (!data || sampleCount == 0) return;
    
    float sum = 0.0f;
    float maxVal = 0.0f;
    
    for (size_t i = 0; i < sampleCount; ++i) {
        float absVal = std::abs(data[i]);
        sum += absVal;
        maxVal = std::max(maxVal, absVal);
    }
    
    float avgLevel = sum / sampleCount;
    currentLevel_ = avgLevel;
    
    float currentPeak = peakLevel_.load();
    if (maxVal > currentPeak) {
        peakLevel_ = maxVal;
    }
    
    statistics_.averageLevel = avgLevel;
    statistics_.peakLevel = maxVal;
}

inline void AudioCaptureBase::updateLevelsInt16(const int16_t* data, size_t sampleCount) {
    if (!data || sampleCount == 0) return;
    
    float sum = 0.0f;
    float maxVal = 0.0f;
    const float scale = 1.0f / 32768.0f;
    
    for (size_t i = 0; i < sampleCount; ++i) {
        float normalized = std::abs(data[i]) * scale;
        sum += normalized;
        maxVal = std::max(maxVal, normalized);
    }
    
    float avgLevel = sum / sampleCount;
    currentLevel_ = avgLevel;
    
    float currentPeak = peakLevel_.load();
    if (maxVal > currentPeak) {
        peakLevel_ = maxVal;
    }
    
    statistics_.averageLevel = avgLevel;
    statistics_.peakLevel = maxVal;
}



} // namespace Audio
} // namespace Nyth