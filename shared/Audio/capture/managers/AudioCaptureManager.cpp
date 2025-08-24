#include "AudioCaptureManager.h"
#include <algorithm>
#include <cmath>

namespace facebook {
namespace react {

AudioCaptureManager::AudioCaptureManager(std::shared_ptr<JSICallbackManager> callbackManager)
    : callbackManager_(callbackManager) {}

AudioCaptureManager::~AudioCaptureManager() {
    cleanup();
}

// === Cycle de vie ===
bool AudioCaptureManager::initialize(const Nyth::Audio::AudioConfig& config) {
    if (!validateConfig(config)) {
        return false;
    }

    std::lock_guard<std::mutex> lock(captureMutex_);

    try {
        // Nettoyer l'instance existante
        if (capture_) {
            capture_->release();
            capture_.reset();
        }

        // Convertir la configuration pour le moteur
        Audio::capture::AudioCaptureConfig engineConfig = convertToEngineConfig(config);

        // Créer une nouvelle instance de capture avec le moteur existant
        capture_ = Audio::capture::AudioCapture::create(engineConfig);

        if (!capture_) {
            if (callbackManager_) {
                callbackManager_->invokeErrorCallback("Failed to create audio capture instance");
            }
            return false;
        }

        // Sauvegarder la configuration
        config_ = config;

        // Configurer les callbacks pour connecter le moteur aux callbacks JS
        setupCallbacks();

        isInitialized_.store(true);
        return true;

    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to initialize audio capture: ") + e.what());
        }
        return false;
    }
}

bool AudioCaptureManager::start() {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (!isInitialized_.load() || !capture_) {
        return false;
    }

    try {
        return capture_->start();
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to start audio capture: ") + e.what());
        }
        return false;
    }
}

bool AudioCaptureManager::stop() {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (!isInitialized_.load() || !capture_) {
        return false;
    }

    try {
        return capture_->stop();
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to stop audio capture: ") + e.what());
        }
        return false;
    }
}

bool AudioCaptureManager::pause() {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (!isInitialized_.load() || !capture_) {
        return false;
    }

    try {
        return capture_->pause();
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to pause audio capture: ") + e.what());
        }
        return false;
    }
}

bool AudioCaptureManager::resume() {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (!isInitialized_.load() || !capture_) {
        return false;
    }

    try {
        return capture_->resume();
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to resume audio capture: ") + e.what());
        }
        return false;
    }
}

bool AudioCaptureManager::isCapturing() const {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (!isInitialized_.load() || !capture_) {
        return false;
    }

    return capture_->isCapturing();
}

// === État et informations ===
Audio::capture::CaptureState AudioCaptureManager::getState() const {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (!isInitialized_.load() || !capture_) {
        return Audio::capture::CaptureState::Uninitialized;
    }

    return capture_->getState();
}

Audio::capture::CaptureStatistics AudioCaptureManager::getStatistics() const {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (!isInitialized_.load() || !capture_) {
        return Audio::capture::CaptureStatistics{};
    }

    return capture_->getStatistics();
}

void AudioCaptureManager::resetStatistics() {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (isInitialized_.load() && capture_) {
        capture_->resetStatistics();
    }
}

// === Configuration ===
bool AudioCaptureManager::updateConfig(const Nyth::Audio::AudioConfig& config) {
    if (!validateConfig(config)) {
        return false;
    }

    std::lock_guard<std::mutex> lock(captureMutex_);

    if (!isInitialized_.load() || !capture_) {
        return false;
    }

    try {
        bool success = capture_->updateConfig(config);
        if (success) {
            config_ = config;
        }
        return success;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to update audio config: ") + e.what());
        }
        return false;
    }
}

Nyth::Audio::AudioConfig AudioCaptureManager::getConfig() const {
    std::lock_guard<std::mutex> lock(captureMutex_);
    return config_;
}

// === Niveaux audio ===
float AudioCaptureManager::getCurrentLevel() const {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (!isInitialized_.load() || !capture_) {
        return 0.0f;
    }

    return capture_->getCurrentLevel();
}

float AudioCaptureManager::getPeakLevel() const {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (!isInitialized_.load() || !capture_) {
        return 0.0f;
    }

    return capture_->getPeakLevel();
}

void AudioCaptureManager::resetPeakLevel() {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (isInitialized_.load() && capture_) {
        capture_->resetPeakLevel();
    }
}

// === Analyse audio ===
double AudioCaptureManager::getRMS() const {
    // Pour l'instant, retourner le niveau actuel comme approximation
    // Dans une implémentation complète, calculer le vrai RMS
    return static_cast<double>(getCurrentLevel());
}

double AudioCaptureManager::getRMSdB() const {
    double rms = getRMS();
    if (rms > 0) {
        return 20.0 * std::log10(rms);
    }
    return -100.0; // Niveau très bas en dB
}

bool AudioCaptureManager::isSilent(float threshold) const {
    return getCurrentLevel() < threshold;
}

bool AudioCaptureManager::hasClipping() const {
    return getPeakLevel() >= 0.99f;
}

// === Périphériques ===
std::vector<Audio::capture::AudioDeviceInfo> AudioCaptureManager::getAvailableDevices() const {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (!isInitialized_.load() || !capture_) {
        return {};
    }

    try {
        return capture_->getAvailableDevices();
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to get available devices: ") + e.what());
        }
        return {};
    }
}

bool AudioCaptureManager::selectDevice(const std::string& deviceId) {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (!isInitialized_.load() || !capture_) {
        return false;
    }

    try {
        return capture_->selectDevice(deviceId);
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to select device: ") + e.what());
        }
        return false;
    }
}

Audio::capture::AudioDeviceInfo AudioCaptureManager::getCurrentDevice() const {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (!isInitialized_.load() || !capture_) {
        return Audio::capture::AudioDeviceInfo{};
    }

    try {
        return capture_->getCurrentDevice();
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to get current device: ") + e.what());
        }
        return Audio::capture::AudioDeviceInfo{};
    }
}

// === Permissions ===
bool AudioCaptureManager::hasPermission() const {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (!isInitialized_.load() || !capture_) {
        return false;
    }

    try {
        return capture_->hasPermission();
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to check permission: ") + e.what());
        }
        return false;
    }
}

void AudioCaptureManager::requestPermission(std::function<void(bool)> callback) {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (!isInitialized_.load() || !capture_) {
        if (callback) {
            callback(false);
        }
        return;
    }

    try {
        capture_->requestPermission(callback);
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to request permission: ") + e.what());
        }
        if (callback) {
            callback(false);
        }
    }
}

// === Conversion entre les configurations ===
Audio::capture::AudioCaptureConfig AudioCaptureManager::convertToEngineConfig(
    const Nyth::Audio::AudioConfig& config) const {
    Audio::capture::AudioCaptureConfig engineConfig;

    engineConfig.sampleRate = config.sampleRate;
    engineConfig.channelCount = config.channelCount;
    engineConfig.bitsPerSample = config.bitsPerSample;
    engineConfig.bufferSizeFrames = config.bufferSizeFrames;

    engineConfig.enableEchoCancellation = config.enableEchoCancellation;
    engineConfig.enableNoiseSuppression = config.enableNoiseSuppression;
    engineConfig.enableAutoGainControl = config.enableAutoGainControl;

    engineConfig.requestPermissionOnInit = true;

    return engineConfig;
}

Nyth::Audio::AudioConfig AudioCaptureManager::convertFromEngineConfig(
    const Audio::capture::AudioCaptureConfig& engineConfig) const {
    Nyth::Audio::AudioConfig config;

    config.sampleRate = engineConfig.sampleRate;
    config.channelCount = engineConfig.channelCount;
    config.bitsPerSample = engineConfig.bitsPerSample;
    config.bufferSizeFrames = engineConfig.bufferSizeFrames;

    config.enableEchoCancellation = engineConfig.enableEchoCancellation;
    config.enableNoiseSuppression = engineConfig.enableNoiseSuppression;
    config.enableAutoGainControl = engineConfig.enableAutoGainControl;

    return config;
}

// === Méthodes privées ===
void AudioCaptureManager::setupCallbacks() {
    if (!capture_ || !callbackManager_) {
        return;
    }

    // Callback pour les données audio - connecte le moteur aux callbacks JS
    capture_->setAudioDataCallback(
        [this](const float* data, size_t frameCount, int channels) { onAudioData(data, frameCount, channels); });

    // Callback pour les erreurs - connecte le moteur aux callbacks JS
    capture_->setErrorCallback([this](const std::string& error) { onError(error); });

    // Callback pour les changements d'état - connecte le moteur aux callbacks JS
    capture_->setStateChangeCallback(
        [this](Audio::capture::CaptureState oldState, Audio::capture::CaptureState newState) {
            onStateChange(oldState, newState);
        });
}

void AudioCaptureManager::onAudioData(const float* data, size_t frameCount, int channels) {
    if (callbackManager_) {
        callbackManager_->invokeAudioDataCallback(data, frameCount, channels);
    }
}

void AudioCaptureManager::onError(const std::string& error) {
    if (callbackManager_) {
        callbackManager_->invokeErrorCallback(error);
    }
}

void AudioCaptureManager::onStateChange(Audio::capture::CaptureState oldState, Audio::capture::CaptureState newState) {
    if (callbackManager_) {
        // Convertir les états en strings pour le callback JS
        std::string oldStateStr, newStateStr;

        auto stateToString = [](Audio::capture::CaptureState state) -> std::string {
            switch (state) {
                case Audio::capture::CaptureState::Uninitialized:
                    return "uninitialized";
                case Audio::capture::CaptureState::Initialized:
                    return "initialized";
                case Audio::capture::CaptureState::Starting:
                    return "starting";
                case Audio::capture::CaptureState::Running:
                    return "running";
                case Audio::capture::CaptureState::Pausing:
                    return "pausing";
                case Audio::capture::CaptureState::Paused:
                    return "paused";
                case Audio::capture::CaptureState::Stopping:
                    return "stopping";
                case Audio::capture::CaptureState::Stopped:
                    return "stopped";
                case Audio::capture::CaptureState::Error:
                    return "error";
                default:
                    return "unknown";
            }
        };

        oldStateStr = stateToString(oldState);
        newStateStr = stateToString(newState);

        callbackManager_->invokeStateChangeCallback(oldStateStr, newStateStr);
    }
}

void AudioCaptureManager::cleanup() {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (capture_) {
        try {
            if (capture_->isCapturing()) {
                capture_->stop();
            }
            capture_->release();
        } catch (const std::exception& e) {
            // Logger l'erreur silencieusement
        }
        capture_.reset();
    }

    isInitialized_.store(false);
}

bool AudioCaptureManager::validateConfig(const Nyth::Audio::AudioConfig& config) const {
    return config.isValid();
}

} // namespace react
} // namespace facebook
