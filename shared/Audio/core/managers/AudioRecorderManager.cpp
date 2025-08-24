#include "AudioRecorderManager.h"
#include <algorithm>
#include <chrono>
#include <filesystem>
#include <iomanip>
#include <sstream>

namespace facebook {
namespace react {

AudioRecorderManager::AudioRecorderManager(std::shared_ptr<JSICallbackManager> callbackManager)
    : callbackManager_(callbackManager),
      recordingSampleRate_(44100),
      recordingChannels_(2),
      recordingBitsPerSample_(16),
      maxDurationMs_(0) // 0 = no limit
      ,
      qualityPreset_("medium") {}

AudioRecorderManager::~AudioRecorderManager() {
    if (isRecording_.load()) {
        stopRecording();
    }
    release();
}

// === Cycle de vie ===
bool AudioRecorderManager::initialize(const Nyth::Audio::AudioConfig& config) {
    std::lock_guard<std::mutex> lock(recorderMutex_);

    try {
        // Nettoyer l'instance existante
        if (isInitialized_.load()) {
            release();
        }

        config_ = config;
        currentStats_ = {0, 0, 0, 0, 0, 0.0, 0.0, false};
        isInitialized_.store(true);

        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to initialize recorder: ") + e.what());
        }
        return false;
    }
}

bool AudioRecorderManager::isInitialized() const {
    return isInitialized_.load();
}

void AudioRecorderManager::release() {
    std::lock_guard<std::mutex> lock(recorderMutex_);

    if (isRecording_.load()) {
        stopRecording();
    }

    // Nettoyer les ressources
    currentFilePath_.clear();
    recordingFormat_.clear();
    isInitialized_.store(false);
}

// === Configuration d'enregistrement ===
bool AudioRecorderManager::setRecordingConfig(const std::string& filePath, const std::string& format,
                                              uint32_t sampleRate, int channels, int bitsPerSample) {
    std::lock_guard<std::mutex> lock(recorderMutex_);

    if (isRecording_.load()) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback("Cannot change config while recording");
        }
        return false;
    }

    try {
        // Valider les paramètres
        if (sampleRate < 8000 || sampleRate > 192000) {
            throw std::invalid_argument("Sample rate must be between 8000 and 192000 Hz");
        }

        if (channels < 1 || channels > 8) {
            throw std::invalid_argument("Channels must be between 1 and 8");
        }

        if (bitsPerSample != 8 && bitsPerSample != 16 && bitsPerSample != 24 && bitsPerSample != 32) {
            throw std::invalid_argument("Bits per sample must be 8, 16, 24, or 32");
        }

        // Formats supportés
        std::vector<std::string> supportedFormats = {"wav", "aiff", "flac", "ogg", "mp3"};
        if (std::find(supportedFormats.begin(), supportedFormats.end(), format) == supportedFormats.end()) {
            throw std::invalid_argument("Unsupported format: " + format);
        }

        currentFilePath_ = filePath;
        recordingFormat_ = format;
        recordingSampleRate_ = sampleRate;
        recordingChannels_ = channels;
        recordingBitsPerSample_ = bitsPerSample;

        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to set recording config: ") + e.what());
        }
        return false;
    }
}

bool AudioRecorderManager::setMaxDuration(uint32_t maxDurationMs) {
    std::lock_guard<std::mutex> lock(recorderMutex_);

    if (isRecording_.load()) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback("Cannot change max duration while recording");
        }
        return false;
    }

    maxDurationMs_ = maxDurationMs;
    return true;
}

bool AudioRecorderManager::setQualityPreset(const std::string& preset) {
    std::lock_guard<std::mutex> lock(recorderMutex_);

    if (isRecording_.load()) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback("Cannot change quality preset while recording");
        }
        return false;
    }

    std::vector<std::string> validPresets = {"low", "medium", "high", "lossless"};

    if (std::find(validPresets.begin(), validPresets.end(), preset) == validPresets.end()) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback("Invalid quality preset: " + preset);
        }
        return false;
    }

    qualityPreset_ = preset;

    // Appliquer les paramètres selon le preset
    if (preset == "low") {
        recordingSampleRate_ = 22050;
        recordingChannels_ = 1;
        recordingBitsPerSample_ = 16;
        recordingFormat_ = "ogg";
    } else if (preset == "medium") {
        recordingSampleRate_ = 44100;
        recordingChannels_ = 2;
        recordingBitsPerSample_ = 16;
        recordingFormat_ = "wav";
    } else if (preset == "high") {
        recordingSampleRate_ = 48000;
        recordingChannels_ = 2;
        recordingBitsPerSample_ = 24;
        recordingFormat_ = "flac";
    } else if (preset == "lossless") {
        recordingSampleRate_ = 96000;
        recordingChannels_ = 2;
        recordingBitsPerSample_ = 32;
        recordingFormat_ = "flac";
    }

    return true;
}

// === Contrôle d'enregistrement ===
bool AudioRecorderManager::startRecording() {
    std::lock_guard<std::mutex> lock(recorderMutex_);

    if (!isInitialized_.load()) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback("Recorder not initialized");
        }
        return false;
    }

    if (isRecording_.load()) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback("Recording already in progress");
        }
        return false;
    }

    if (currentFilePath_.empty()) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback("No file path set");
        }
        return false;
    }

    try {
        // Créer le répertoire si nécessaire
        if (!createRecordingDirectory(currentFilePath_)) {
            throw std::runtime_error("Failed to create recording directory");
        }

        // Vérifier la configuration
        if (!validateRecordingConfig()) {
            throw std::runtime_error("Invalid recording configuration");
        }

        // Initialiser les statistiques
        currentStats_ = {0, 0, recordingSampleRate_, recordingChannels_, recordingBitsPerSample_, 0.0, 0.0, false};
        pausedDurationMs_ = 0;

        // Démarrer l'enregistrement
        isRecording_.store(true);
        isPaused_.store(false);
        recordingStartTime_ = std::chrono::steady_clock::now();

        notifyRecordingEvent("started", currentFilePath_);
        return true;

    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to start recording: ") + e.what());
        }
        return false;
    }
}

bool AudioRecorderManager::stopRecording() {
    std::lock_guard<std::mutex> lock(recorderMutex_);

    if (!isRecording_.load()) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback("No recording in progress");
        }
        return false;
    }

    try {
        isRecording_.store(false);
        isPaused_.store(false);

        // Mettre à jour les statistiques finales
        updateRecordingStats();

        notifyRecordingEvent("stopped", currentFilePath_);
        return true;

    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to stop recording: ") + e.what());
        }
        return false;
    }
}

bool AudioRecorderManager::pauseRecording() {
    std::lock_guard<std::mutex> lock(recorderMutex_);

    if (!isRecording_.load() || isPaused_.load()) {
        return false;
    }

    try {
        isPaused_.store(true);
        // Note: Dans une vraie implémentation, on pauserait l'écriture du fichier
        notifyRecordingEvent("paused");
        return true;

    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to pause recording: ") + e.what());
        }
        return false;
    }
}

bool AudioRecorderManager::resumeRecording() {
    std::lock_guard<std::mutex> lock(recorderMutex_);

    if (!isRecording_.load() || !isPaused_.load()) {
        return false;
    }

    try {
        isPaused_.store(false);
        // Note: Dans une vraie implémentation, on reprendrait l'écriture du fichier
        notifyRecordingEvent("resumed");
        return true;

    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to resume recording: ") + e.what());
        }
        return false;
    }
}

bool AudioRecorderManager::isRecording() const {
    return isRecording_.load();
}

bool AudioRecorderManager::isPaused() const {
    return isPaused_.load();
}

// === État et informations ===
std::string AudioRecorderManager::getRecordingState() const {
    if (!isInitialized_.load()) {
        return "uninitialized";
    }
    if (isRecording_.load()) {
        if (isPaused_.load()) {
            return "paused";
        }
        return "recording";
    }
    return "stopped";
}

uint32_t AudioRecorderManager::getCurrentDuration() const {
    if (!isRecording_.load()) {
        return currentStats_.durationMs;
    }

    auto now = std::chrono::steady_clock::now();
    auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(now - recordingStartTime_).count();

    return static_cast<uint32_t>(elapsed) - pausedDurationMs_;
}

uint32_t AudioRecorderManager::getMaxDuration() const {
    return maxDurationMs_;
}

std::string AudioRecorderManager::getCurrentFilePath() const {
    std::lock_guard<std::mutex> lock(recorderMutex_);
    return currentFilePath_;
}

size_t AudioRecorderManager::getFileSize() const {
    std::lock_guard<std::mutex> lock(recorderMutex_);

    if (currentFilePath_.empty()) {
        return 0;
    }

    try {
        if (std::filesystem::exists(currentFilePath_)) {
            return std::filesystem::file_size(currentFilePath_);
        }
    } catch (const std::exception&) {
        // Ignore errors
    }

    return 0;
}

AudioRecorderManager::RecordingStats AudioRecorderManager::getRecordingStats() const {
    std::lock_guard<std::mutex> lock(recorderMutex_);
    return currentStats_;
}

// === Callbacks d'événements ===
void AudioRecorderManager::setRecordingCallback(RecordingCallback callback) {
    std::lock_guard<std::mutex> lock(recorderMutex_);
    recordingCallback_ = callback;
}

// === Gestion des fichiers ===
bool AudioRecorderManager::deleteRecording(const std::string& filePath) {
    std::lock_guard<std::mutex> lock(recorderMutex_);

    if (isRecording_.load() && currentFilePath_ == filePath) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback("Cannot delete file while recording to it");
        }
        return false;
    }

    try {
        if (std::filesystem::exists(filePath)) {
            return std::filesystem::remove(filePath);
        }
        return false;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("Failed to delete recording: ") + e.what());
        }
        return false;
    }
}

std::vector<std::string> AudioRecorderManager::listRecordings() const {
    std::vector<std::string> recordings;

    try {
        // Note: Dans une vraie implémentation, on scannerait un répertoire spécifique
        // Pour l'exemple, on retourne juste le fichier en cours
        if (!currentFilePath_.empty() && std::filesystem::exists(currentFilePath_)) {
            recordings.push_back(currentFilePath_);
        }
    } catch (const std::exception&) {
        // Ignore errors
    }

    return recordings;
}

bool AudioRecorderManager::fileExists(const std::string& filePath) const {
    try {
        return std::filesystem::exists(filePath);
    } catch (const std::exception&) {
        return false;
    }
}

// === Utilitaires ===
std::string AudioRecorderManager::generateFileName(const std::string& prefix) {
    auto now = std::chrono::system_clock::now();
    auto time = std::chrono::system_clock::to_time_t(now);

    std::stringstream ss;
    ss << prefix << "_" << std::put_time(std::localtime(&time), "%Y%m%d_%H%M%S") << ".wav";

    return ss.str();
}

std::string AudioRecorderManager::getSupportedFormats() {
    return "wav, aiff, flac, ogg, mp3";
}

// === Méthodes privées ===
bool AudioRecorderManager::validateRecordingConfig() const {
    if (currentFilePath_.empty()) {
        return false;
    }

    if (recordingSampleRate_ < 8000 || recordingSampleRate_ > 192000) {
        return false;
    }

    if (recordingChannels_ < 1 || recordingChannels_ > 8) {
        return false;
    }

    if (recordingBitsPerSample_ != 8 && recordingBitsPerSample_ != 16 && recordingBitsPerSample_ != 24 &&
        recordingBitsPerSample_ != 32) {
        return false;
    }

    return true;
}

void AudioRecorderManager::updateRecordingStats() {
    currentStats_.durationMs = getCurrentDuration();
    currentStats_.fileSizeBytes = getFileSize();
    currentStats_.sampleRate = recordingSampleRate_;
    currentStats_.channels = recordingChannels_;
    currentStats_.bitsPerSample = recordingBitsPerSample_;

    // Note: peakLevel, averageLevel, hasClipping seraient mis à jour
    // pendant l'enregistrement avec les données audio réelles
}

void AudioRecorderManager::notifyRecordingEvent(const std::string& event, const std::string& data) {
    if (recordingCallback_) {
        try {
            recordingCallback_(event, data);
        } catch (const std::exception& e) {
            if (callbackManager_) {
                callbackManager_->invokeErrorCallback(std::string("Recording callback error: ") + e.what());
            }
        }
    }
}

bool AudioRecorderManager::createRecordingDirectory(const std::string& filePath) {
    try {
        std::filesystem::path path(filePath);
        std::filesystem::path directory = path.parent_path();

        if (!directory.empty() && !std::filesystem::exists(directory)) {
            return std::filesystem::create_directories(directory);
        }

        return true;
    } catch (const std::exception&) {
        return false;
    }
}

std::string AudioRecorderManager::getFileExtension() const {
    if (recordingFormat_ == "wav")
        return ".wav";
    if (recordingFormat_ == "aiff")
        return ".aiff";
    if (recordingFormat_ == "flac")
        return ".flac";
    if (recordingFormat_ == "ogg")
        return ".ogg";
    if (recordingFormat_ == "mp3")
        return ".mp3";
    return ".wav";
}

bool AudioRecorderManager::isValidFilePath(const std::string& filePath) const {
    if (filePath.empty()) {
        return false;
    }

    // Vérifier les caractères interdits selon la plateforme
    std::vector<char> invalidChars = {'<', '>', ':', '"', '|', '?', '*'};

    for (char c : invalidChars) {
        if (filePath.find(c) != std::string::npos) {
            return false;
        }
    }

    return true;
}

size_t AudioRecorderManager::calculateEstimatedFileSize(uint32_t durationMs) const {
    // Calculer la taille approximative du fichier
    // Taille = durée (secondes) * sampleRate * channels * (bitsPerSample/8)
    double durationSec = durationMs / 1000.0;
    size_t bytesPerSecond = recordingSampleRate_ * recordingChannels_ * (recordingBitsPerSample_ / 8);

    // Ajouter l'overhead du format (environ 10% pour WAV)
    return static_cast<size_t>(durationSec * bytesPerSecond * 1.1);
}

} // namespace react
} // namespace facebook
