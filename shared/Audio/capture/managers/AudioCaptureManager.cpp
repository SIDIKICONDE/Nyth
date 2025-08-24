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
bool AudioCaptureManager::initialize(const Nyth::Audio::AudioCaptureConfig& config) {
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
        Nyth::Audio::AudioCaptureConfig engineConfig = convertToEngineConfig(config);

        // Créer une nouvelle instance de capture avec le moteur existant
        capture_ = Nyth::Audio::AudioCapture::create(engineConfig);

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
Nyth::Audio::CaptureState AudioCaptureManager::getState() const {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (!isInitialized_.load() || !capture_) {
        return Nyth::Audio::CaptureState::Uninitialized;
    }

    return capture_->getState();
}

Nyth::Audio::CaptureStatistics AudioCaptureManager::getStatistics() const {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (!isInitialized_.load() || !capture_) {
        return Nyth::Audio::CaptureStatistics{};
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
bool AudioCaptureManager::updateConfig(const Nyth::Audio::AudioCaptureConfig& config) {
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

Nyth::Audio::AudioCaptureConfig AudioCaptureManager::getConfig() const {
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
std::vector<Nyth::Audio::AudioDeviceInfo> AudioCaptureManager::getAvailableDevices() const {
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

Nyth::Audio::AudioDeviceInfo AudioCaptureManager::getCurrentDevice() const {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (!isInitialized_.load() || !capture_) {
        return Nyth::Audio::AudioDeviceInfo{};
    }

    try {
        return capture_->getCurrentDevice();
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to get current device: ") + e.what());
        }
        return Nyth::Audio::AudioDeviceInfo{};
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

// === Enregistrement ===
bool AudioCaptureManager::startRecording(const std::string& filePath,
                                         const Nyth::Audio::AudioFileWriterConfig& writerConfig,
                                         float maxDurationSeconds,
                                         size_t maxFileSizeBytes) {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (!isInitialized_.load() || !capture_) {
        return false;
    }

    if (!recorder_) {
        recorder_ = std::make_unique<Nyth::Audio::AudioRecorder>();
    }

    currentRecordingPath_ = filePath;
    auto cfg = writerConfig;
    cfg.filePath = filePath;

    if (!recorder_->initialize(capture_, cfg)) {
        return false;
    }

    if (maxDurationSeconds > 0.0f) {
        recorder_->setDurationLimit(maxDurationSeconds);
    }
    if (maxFileSizeBytes > 0) {
        recorder_->setFileSizeLimit(maxFileSizeBytes);
    }

    return recorder_->startRecording();
}

void AudioCaptureManager::stopRecording() {
    std::lock_guard<std::mutex> lock(captureMutex_);
    if (recorder_) {
        recorder_->stopRecording();
    }
}

void AudioCaptureManager::pauseRecording() {
    std::lock_guard<std::mutex> lock(captureMutex_);
    if (recorder_) {
        recorder_->pauseRecording();
    }
}

void AudioCaptureManager::resumeRecording() {
    std::lock_guard<std::mutex> lock(captureMutex_);
    if (recorder_) {
        recorder_->resumeRecording();
    }
}

bool AudioCaptureManager::isRecording() const {
    std::lock_guard<std::mutex> lock(captureMutex_);
    return recorder_ && recorder_->isRecording();
}

AudioCaptureManager::RecordingInfo AudioCaptureManager::getRecordingInfo() const {
    std::lock_guard<std::mutex> lock(captureMutex_);
    RecordingInfo info;
    if (recorder_) {
        info.durationSeconds = recorder_->getRecordingDuration();
        info.frames = recorder_->getFramesRecorded();
        info.path = currentRecordingPath_;
        info.recording = recorder_->isRecording();
        info.paused = recorder_->isPaused();
    }
    return info;
}

// === Conversion entre les configurations ===
Nyth::Audio::AudioCaptureConfig AudioCaptureManager::convertToEngineConfig(
    const Nyth::Audio::AudioCaptureConfig& config) const {
    return config; // Already the correct type
}

Nyth::Audio::AudioCaptureConfig AudioCaptureManager::convertFromEngineConfig(
    const Nyth::Audio::AudioCaptureConfig& engineConfig) const {
    return engineConfig; // Already the correct type
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
    capture_->setStateChangeCallback([this](Nyth::Audio::CaptureState oldState, Nyth::Audio::CaptureState newState) {
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

void AudioCaptureManager::onStateChange(Nyth::Audio::CaptureState oldState, Nyth::Audio::CaptureState newState) {
    if (callbackManager_) {
        // Convertir les états en strings pour le callback JS
        std::string oldStateStr, newStateStr;

        auto stateToString = [](Nyth::Audio::CaptureState state) -> std::string {
            switch (state) {
                case Nyth::Audio::CaptureState::Uninitialized:
                    return "uninitialized";
                case Nyth::Audio::CaptureState::Initialized:
                    return "initialized";
                case Nyth::Audio::CaptureState::Starting:
                    return "starting";
                case Nyth::Audio::CaptureState::Running:
                    return "running";
                case Nyth::Audio::CaptureState::Pausing:
                    return "pausing";
                case Nyth::Audio::CaptureState::Paused:
                    return "paused";
                case Nyth::Audio::CaptureState::Stopping:
                    return "stopping";
                case Nyth::Audio::CaptureState::Stopped:
                    return "stopped";
                case Nyth::Audio::CaptureState::Error:
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

bool AudioCaptureManager::validateConfig(const Nyth::Audio::AudioCaptureConfig& config) const {
    // Basic validation for AudioCaptureConfig
    return config.sampleRate > 0 &&
           config.channelCount > 0 &&
           config.bitsPerSample > 0 &&
           config.bufferSizeFrames > 0 &&
           config.numBuffers > 0;
}

} // namespace react
} // namespace facebook
