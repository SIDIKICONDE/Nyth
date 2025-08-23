#include "AudioCapture.hpp"
#include "AudioCaptureImpl.hpp"
#include <iostream>
#include <sstream>

namespace Audio {
namespace capture {

// Implémentation de AudioCaptureBase
AudioCaptureBase::AudioCaptureBase() 
    : state_(CaptureState::Uninitialized)
    , framesProcessed_(0)
    , bytesProcessed_(0) {
}

AudioCaptureBase::~AudioCaptureBase() {
    if (state_ != CaptureState::Uninitialized && state_ != CaptureState::Stopped) {
        stop();
        release();
    }
}

CaptureState AudioCaptureBase::getState() const {
    std::lock_guard<std::mutex> lock(stateMutex_);
    return state_;
}

AudioCaptureConfig AudioCaptureBase::getConfig() const {
    std::lock_guard<std::mutex> lock(configMutex_);
    return config_;
}

CaptureStatistics AudioCaptureBase::getStatistics() const {
    CaptureStatistics stats;
    stats.framesProcessed = framesProcessed_.load();
    stats.bytesProcessed = bytesProcessed_.load();
    stats.droppedFrames = droppedFrames_.load();
    stats.errorCount = errorCount_.load();
    
    auto now = std::chrono::steady_clock::now();
    if (state_ == CaptureState::Running && captureStartTime_.time_since_epoch().count() > 0) {
        stats.captureTime = std::chrono::duration_cast<std::chrono::seconds>(
            now - captureStartTime_).count();
    }
    
    if (stats.captureTime > 0) {
        stats.averageLatency = totalLatency_.load() / std::max(uint64_t(1), latencyMeasurements_.load());
        stats.currentBufferLevel = getCurrentBufferLevel();
    }
    
    return stats;
}

void AudioCaptureBase::setAudioDataCallback(AudioDataCallback callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    audioDataCallback_ = callback;
}

void AudioCaptureBase::setErrorCallback(ErrorCallback callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    errorCallback_ = callback;
}

void AudioCaptureBase::setStateChangedCallback(StateChangedCallback callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    stateChangedCallback_ = callback;
}

void AudioCaptureBase::setState(CaptureState newState) {
    CaptureState oldState;
    {
        std::lock_guard<std::mutex> lock(stateMutex_);
        oldState = state_;
        state_ = newState;
    }
    
    // Notifier le changement d'état
    if (stateChangedCallback_) {
        stateChangedCallback_(oldState, newState);
    }
    
    // Mise à jour des timestamps
    if (newState == CaptureState::Running) {
        captureStartTime_ = std::chrono::steady_clock::now();
    } else if (newState == CaptureState::Stopped || newState == CaptureState::Error) {
        captureStartTime_ = std::chrono::steady_clock::time_point();
    }
}

void AudioCaptureBase::processAudioData(const void* data, size_t sizeInBytes) {
    // Mise à jour des statistiques
    size_t frameCount = sizeInBytes / (config_.bitsPerSample / 8 * config_.channelCount);
    framesProcessed_ += frameCount;
    bytesProcessed_ += sizeInBytes;
    
    // Conversion en float si nécessaire et appel du callback
    if (audioDataCallback_) {
        std::vector<float> floatData;
        
        if (config_.bitsPerSample == 16) {
            const int16_t* int16Data = static_cast<const int16_t*>(data);
            size_t sampleCount = sizeInBytes / sizeof(int16_t);
            floatData.resize(sampleCount);
            
            for (size_t i = 0; i < sampleCount; ++i) {
                floatData[i] = int16Data[i] / 32768.0f;
            }
        } else if (config_.bitsPerSample == 32) {
            const float* floatPtr = static_cast<const float*>(data);
            size_t sampleCount = sizeInBytes / sizeof(float);
            floatData.assign(floatPtr, floatPtr + sampleCount);
        }
        
        if (!floatData.empty()) {
            audioDataCallback_(floatData.data(), frameCount, config_.channelCount);
        }
    }
}

void AudioCaptureBase::reportError(const std::string& error) {
    errorCount_++;
    
    if (errorCallback_) {
        errorCallback_(error);
    }
    
    // Log l'erreur
    std::cerr << "AudioCapture Error: " << error << std::endl;
}

float AudioCaptureBase::getCurrentBufferLevel() const {
    // Cette méthode doit être surchargée par les implémentations spécifiques
    // Retourne une valeur par défaut
    return 0.0f;
}

// Fonction utilitaire pour convertir l'état en string
std::string captureStateToString(CaptureState state) {
    switch (state) {
        case CaptureState::Uninitialized: return "Uninitialized";
        case CaptureState::Initialized: return "Initialized";
        case CaptureState::Starting: return "Starting";
        case CaptureState::Running: return "Running";
        case CaptureState::Pausing: return "Pausing";
        case CaptureState::Paused: return "Paused";
        case CaptureState::Stopping: return "Stopping";
        case CaptureState::Stopped: return "Stopped";
        case CaptureState::Error: return "Error";
        default: return "Unknown";
    }
}

// Fonction utilitaire pour valider la configuration
bool validateConfig(const AudioCaptureConfig& config, std::string& errorMsg) {
    std::stringstream ss;
    
    // Validation du taux d'échantillonnage
    if (config.sampleRate != 8000 && config.sampleRate != 16000 && 
        config.sampleRate != 22050 && config.sampleRate != 44100 && 
        config.sampleRate != 48000 && config.sampleRate != 96000) {
        ss << "Invalid sample rate: " << config.sampleRate << ". ";
        ss << "Supported rates: 8000, 16000, 22050, 44100, 48000, 96000 Hz.";
        errorMsg = ss.str();
        return false;
    }
    
    // Validation du nombre de canaux
    if (config.channelCount < 1 || config.channelCount > 8) {
        ss << "Invalid channel count: " << config.channelCount << ". ";
        ss << "Supported range: 1-8 channels.";
        errorMsg = ss.str();
        return false;
    }
    
    // Validation des bits par échantillon
    if (config.bitsPerSample != 16 && config.bitsPerSample != 32) {
        ss << "Invalid bits per sample: " << config.bitsPerSample << ". ";
        ss << "Supported values: 16, 32 bits.";
        errorMsg = ss.str();
        return false;
    }
    
    // Validation de la taille du buffer
    if (config.bufferSizeFrames < 64 || config.bufferSizeFrames > 8192) {
        ss << "Invalid buffer size: " << config.bufferSizeFrames << " frames. ";
        ss << "Supported range: 64-8192 frames.";
        errorMsg = ss.str();
        return false;
    }
    
    // Validation du nombre de buffers
    if (config.numBuffers < 2 || config.numBuffers > 10) {
        ss << "Invalid number of buffers: " << config.numBuffers << ". ";
        ss << "Supported range: 2-10 buffers.";
        errorMsg = ss.str();
        return false;
    }
    
    return true;
}

} // namespace capture
} // namespace Audio