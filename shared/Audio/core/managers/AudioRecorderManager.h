#pragma once


#include "../../common/config/AudioConfig.hpp"
#include "../../common/jsi/JSICallbackManager.h"
#include <atomic>
#include <functional>
#include <memory>
#include <mutex>
#include <string>
#include <vector>

namespace facebook {
namespace react {

class AudioRecorderManager {
public:
    explicit AudioRecorderManager(std::shared_ptr<JSICallbackManager> callbackManager);
    ~AudioRecorderManager();

    // === Cycle de vie ===
    bool initialize(const Nyth::Audio::AudioConfig& config);
    bool isInitialized() const;
    void release();

    // === Configuration d'enregistrement ===
    bool setRecordingConfig(const std::string& filePath, const std::string& format = "wav", uint32_t sampleRate = 44100,
                            int channels = 2, int bitsPerSample = 16);
    bool setMaxDuration(uint32_t maxDurationMs);
    bool setQualityPreset(const std::string& preset); // "low", "medium", "high", "lossless"

    // === Contrôle d'enregistrement ===
    bool startRecording();
    bool stopRecording();
    bool pauseRecording();
    bool resumeRecording();
    bool isRecording() const;
    bool isPaused() const;

    // === État et informations ===
    std::string getRecordingState() const;
    uint32_t getCurrentDuration() const;
    uint32_t getMaxDuration() const;
    std::string getCurrentFilePath() const;
    size_t getFileSize() const;

    // === Statistiques ===
    struct RecordingStats {
        uint32_t durationMs;
        size_t fileSizeBytes;
        uint32_t sampleRate;
        int channels;
        int bitsPerSample;
        double peakLevel;
        double averageLevel;
        bool hasClipping;
    };
    RecordingStats getRecordingStats() const;

    // === Callbacks d'événements ===
    using RecordingCallback = std::function<void(const std::string& event, const std::string& data)>;
    void setRecordingCallback(RecordingCallback callback);

    // === Gestion des fichiers ===
    bool deleteRecording(const std::string& filePath);
    std::vector<std::string> listRecordings() const;
    bool fileExists(const std::string& filePath) const;

    // === Utilitaires ===
    static std::string generateFileName(const std::string& prefix = "recording");
    static std::string getSupportedFormats();

private:
    // === Membres privés ===
    std::shared_ptr<JSICallbackManager> callbackManager_;

    Nyth::Audio::AudioConfig config_;
    mutable std::mutex recorderMutex_;
    std::atomic<bool> isInitialized_{false};

    // Configuration d'enregistrement
    std::string currentFilePath_;
    std::string recordingFormat_;
    uint32_t recordingSampleRate_;
    int recordingChannels_;
    int recordingBitsPerSample_;
    uint32_t maxDurationMs_;
    std::string qualityPreset_;

    // État d'enregistrement
    std::atomic<bool> isRecording_{false};
    std::atomic<bool> isPaused_{false};
    std::chrono::steady_clock::time_point recordingStartTime_;
    uint32_t pausedDurationMs_{0};

    // Statistiques
    RecordingStats currentStats_;
    RecordingCallback recordingCallback_;

    // Gestionnaire de fichiers audio (si disponible)
    // Note: À implémenter selon les capacités du système de fichiers

    // === Méthodes privées ===
    bool validateRecordingConfig() const;
    void updateRecordingStats();
    void notifyRecordingEvent(const std::string& event, const std::string& data = "");
    bool createRecordingDirectory(const std::string& filePath);
    std::string getFileExtension() const;
    bool isValidFilePath(const std::string& filePath) const;
    size_t calculateEstimatedFileSize(uint32_t durationMs) const;
};

} // namespace react
} // namespace facebook
