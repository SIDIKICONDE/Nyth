#pragma once

#include "AudioCapture.hpp"
#include <thread>
#include <mutex>
#include <condition_variable>
#include <queue>
#include <cmath>
#include <algorithm>
#include <cstring>

// Platform-specific includes
#ifdef _WIN32
    #include <windows.h>
    #include <mmdeviceapi.h>
    #include <audioclient.h>
    #include <functiondiscoverykeys_devpkey.h>
#elif __APPLE__
    #include <AudioToolbox/AudioToolbox.h>
    #include <CoreAudio/CoreAudio.h>
#elif __linux__
    #include <alsa/asoundlib.h>
#endif

namespace Nyth {
namespace Audio {

class AudioCaptureImpl : public AudioCapture {
public:
    AudioCaptureImpl();
    ~AudioCaptureImpl() override;
    
    // Configuration
    bool configure(const CaptureConfig& config) override;
    CaptureConfig getConfiguration() const override;
    
    // Contrôle de la capture
    bool start() override;
    bool stop() override;
    bool pause() override;
    bool resume() override;
    
    // État
    CaptureState getState() const override;
    bool isCapturing() const override;
    
    // Périphériques
    std::vector<AudioDevice> getAvailableDevices() const override;
    bool selectDevice(const std::string& deviceId) override;
    AudioDevice getCurrentDevice() const override;
    
    // Callbacks
    void setDataCallback(AudioDataCallback callback) override;
    void setDataCallbackInt16(AudioDataCallbackInt16 callback) override;
    void setStateChangeCallback(StateChangeCallback callback) override;
    void setErrorCallback(ErrorCallback callback) override;
    
    // Statistiques
    CaptureStats getStatistics() const override;
    void resetStatistics() override;
    
    // Volume et gain
    bool setInputGain(float gain) override;
    float getInputGain() const override;
    float getPeakLevel() const override;
    float getRMSLevel() const override;
    
protected:
    void notifyStateChange(CaptureState newState) override;
    void notifyError(const std::string& error) override;
    
private:
    // Thread de capture
    void captureThread();
    void processAudioData(const void* data, size_t frames);
    
    // Calculs audio
    void updateLevels(const float* data, size_t frames);
    void updateLevelsInt16(const int16_t* data, size_t frames);
    float calculateRMS(const float* data, size_t frames);
    float calculatePeak(const float* data, size_t frames);
    
    // Conversion de format
    void convertInt16ToFloat(const int16_t* input, float* output, size_t samples);
    void convertFloatToInt16(const float* input, int16_t* output, size_t samples);
    void applyGain(float* data, size_t samples, float gain);
    
    // Platform-specific methods
#ifdef _WIN32
    bool initializeWASAPI();
    void cleanupWASAPI();
    bool captureWASAPI();
#elif __APPLE__
    bool initializeCoreAudio();
    void cleanupCoreAudio();
    static OSStatus audioInputCallback(void* inRefCon,
                                      AudioUnitRenderActionFlags* ioActionFlags,
                                      const AudioTimeStamp* inTimeStamp,
                                      UInt32 inBusNumber,
                                      UInt32 inNumberFrames,
                                      AudioBufferList* ioData);
#elif __linux__
    bool initializeALSA();
    void cleanupALSA();
    bool captureALSA();
#endif
    
    // Membres
    mutable std::mutex mutex_;
    std::condition_variable cv_;
    std::thread captureThread_;
    std::atomic<CaptureState> state_{CaptureState::IDLE};
    
    CaptureConfig config_;
    AudioDevice currentDevice_;
    CaptureStats stats_;
    
    // Callbacks
    AudioDataCallback dataCallback_;
    AudioDataCallbackInt16 dataCallbackInt16_;
    StateChangeCallback stateChangeCallback_;
    ErrorCallback errorCallback_;
    
    // Audio levels
    std::atomic<float> inputGain_{1.0f};
    std::atomic<float> peakLevel_{0.0f};
    std::atomic<float> rmsLevel_{0.0f};
    
    // Buffers
    CircularAudioBuffer<float> audioBuffer_{48000 * 2 * 10}; // 10 secondes à 48kHz stéréo
    std::vector<float> tempBuffer_;
    std::vector<int16_t> tempBufferInt16_;
    
    // Platform-specific handles
#ifdef _WIN32
    IMMDevice* pDevice_ = nullptr;
    IAudioClient* pAudioClient_ = nullptr;
    IAudioCaptureClient* pCaptureClient_ = nullptr;
    WAVEFORMATEX* pwfx_ = nullptr;
#elif __APPLE__
    AudioUnit audioUnit_ = nullptr;
    AudioBufferList* bufferList_ = nullptr;
#elif __linux__
    snd_pcm_t* pcmHandle_ = nullptr;
#endif
    
    // Timing
    std::chrono::steady_clock::time_point startTime_;
    std::chrono::steady_clock::time_point lastFrameTime_;
};

// Implémentation inline des méthodes simples
inline CaptureState AudioCaptureImpl::getState() const {
    return state_.load();
}

inline bool AudioCaptureImpl::isCapturing() const {
    return state_ == CaptureState::RUNNING;
}

inline float AudioCaptureImpl::getInputGain() const {
    return inputGain_.load();
}

inline float AudioCaptureImpl::getPeakLevel() const {
    return peakLevel_.load();
}

inline float AudioCaptureImpl::getRMSLevel() const {
    return rmsLevel_.load();
}

// Constructeur
inline AudioCaptureImpl::AudioCaptureImpl() {
    tempBuffer_.reserve(config_.bufferSize * config_.channels);
    tempBufferInt16_.reserve(config_.bufferSize * config_.channels);
}

// Destructeur
inline AudioCaptureImpl::~AudioCaptureImpl() {
    if (state_ != CaptureState::IDLE) {
        stop();
    }
}

// Configuration
inline bool AudioCaptureImpl::configure(const CaptureConfig& config) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (state_ != CaptureState::IDLE) {
        notifyError("Cannot configure while capturing");
        return false;
    }
    
    config_ = config;
    
    // Redimensionner les buffers
    size_t bufferSamples = config_.bufferSize * config_.channels;
    tempBuffer_.resize(bufferSamples);
    tempBufferInt16_.resize(bufferSamples);
    
    // Redimensionner le buffer circulaire (10 secondes de données)
    size_t circularBufferSize = config_.sampleRate * config_.channels * 10;
    audioBuffer_ = CircularAudioBuffer<float>(circularBufferSize);
    
    return true;
}

inline CaptureConfig AudioCaptureImpl::getConfiguration() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return config_;
}

// Contrôle du gain
inline bool AudioCaptureImpl::setInputGain(float gain) {
    if (gain < 0.0f || gain > 2.0f) {
        return false;
    }
    inputGain_.store(gain);
    return true;
}

// Notification d'état
inline void AudioCaptureImpl::notifyStateChange(CaptureState newState) {
    CaptureState oldState = state_.exchange(newState);
    if (stateChangeCallback_ && oldState != newState) {
        stateChangeCallback_(oldState, newState);
    }
}

inline void AudioCaptureImpl::notifyError(const std::string& error) {
    if (errorCallback_) {
        errorCallback_(error);
    }
}

// Callbacks
inline void AudioCaptureImpl::setDataCallback(AudioDataCallback callback) {
    std::lock_guard<std::mutex> lock(mutex_);
    dataCallback_ = callback;
}

inline void AudioCaptureImpl::setDataCallbackInt16(AudioDataCallbackInt16 callback) {
    std::lock_guard<std::mutex> lock(mutex_);
    dataCallbackInt16_ = callback;
}

inline void AudioCaptureImpl::setStateChangeCallback(StateChangeCallback callback) {
    std::lock_guard<std::mutex> lock(mutex_);
    stateChangeCallback_ = callback;
}

inline void AudioCaptureImpl::setErrorCallback(ErrorCallback callback) {
    std::lock_guard<std::mutex> lock(mutex_);
    errorCallback_ = callback;
}

// Statistiques
inline CaptureStats AudioCaptureImpl::getStatistics() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return stats_;
}

inline void AudioCaptureImpl::resetStatistics() {
    std::lock_guard<std::mutex> lock(mutex_);
    stats_ = CaptureStats();
}

// Conversion de format
inline void AudioCaptureImpl::convertInt16ToFloat(const int16_t* input, float* output, size_t samples) {
    const float scale = 1.0f / 32768.0f;
    for (size_t i = 0; i < samples; ++i) {
        output[i] = input[i] * scale;
    }
}

inline void AudioCaptureImpl::convertFloatToInt16(const float* input, int16_t* output, size_t samples) {
    for (size_t i = 0; i < samples; ++i) {
        float sample = input[i] * 32767.0f;
        sample = std::max(-32768.0f, std::min(32767.0f, sample));
        output[i] = static_cast<int16_t>(sample);
    }
}

inline void AudioCaptureImpl::applyGain(float* data, size_t samples, float gain) {
    if (gain == 1.0f) return;
    
    for (size_t i = 0; i < samples; ++i) {
        data[i] *= gain;
        // Limiter pour éviter la saturation
        data[i] = std::max(-1.0f, std::min(1.0f, data[i]));
    }
}

// Calculs de niveau
inline float AudioCaptureImpl::calculateRMS(const float* data, size_t frames) {
    float sum = 0.0f;
    size_t samples = frames * config_.channels;
    
    for (size_t i = 0; i < samples; ++i) {
        sum += data[i] * data[i];
    }
    
    return std::sqrt(sum / samples);
}

inline float AudioCaptureImpl::calculatePeak(const float* data, size_t frames) {
    float peak = 0.0f;
    size_t samples = frames * config_.channels;
    
    for (size_t i = 0; i < samples; ++i) {
        peak = std::max(peak, std::abs(data[i]));
    }
    
    return peak;
}

inline void AudioCaptureImpl::updateLevels(const float* data, size_t frames) {
    float rms = calculateRMS(data, frames);
    float peak = calculatePeak(data, frames);
    
    // Smooth the levels with exponential moving average
    const float alpha = 0.1f;
    rmsLevel_.store(rmsLevel_ * (1.0f - alpha) + rms * alpha);
    peakLevel_.store(std::max(peakLevel_.load() * 0.95f, peak));
}

inline void AudioCaptureImpl::updateLevelsInt16(const int16_t* data, size_t frames) {
    size_t samples = frames * config_.channels;
    convertInt16ToFloat(data, tempBuffer_.data(), samples);
    updateLevels(tempBuffer_.data(), frames);
}

} // namespace Audio
} // namespace Nyth