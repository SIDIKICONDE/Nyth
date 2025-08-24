#pragma once

#include <atomic>
#include <condition_variable>
#include <cstddef>
#include <cstdint>
#include <fstream>
#include <functional>
#include <memory>
#include <mutex>
#include <queue>
#include <string>
#include <thread>
#include <vector>
#include "AudioCapture.hpp"
#include "AudioCaptureUtils.hpp"

namespace Nyth {
namespace Audio {

// Format de fichier audio supporté
enum class AudioFileFormat {
    WAV,        // Format WAV standard
    RAW_PCM,    // PCM brut sans en-tête
    // Futurs formats possibles : MP3, AAC, OGG, etc.
};

// Configuration pour l'écriture de fichier audio
struct AudioFileWriterConfig {
    std::string filePath;
    AudioFileFormat format = AudioFileFormat::WAV;
    int sampleRate = 44100;
    int channelCount = 1;
    int bitsPerSample = 16;
    bool appendMode = false;  // Si true, ajoute à un fichier existant
    size_t bufferSize = 8192; // Taille du buffer d'écriture
};

// Classe pour écrire des données audio dans un fichier
class AudioFileWriter {
public:
    AudioFileWriter();
    ~AudioFileWriter();
    
    // Ouvre un fichier pour l'écriture
    bool open(const AudioFileWriterConfig& config);
    
    // Ferme le fichier
    void close();
    
    // Écrit des données audio (float)
    bool write(const float* data, size_t frameCount);
    
    // Écrit des données audio (int16)
    bool writeInt16(const int16_t* data, size_t frameCount);
    
    // Flush les données en attente
    void flush();
    
    // Obtient le nombre total de frames écrites
    size_t getFramesWritten() const { return framesWritten_.load(); }
    
    // Obtient la durée en secondes
    float getDurationSeconds() const;
    
    // Vérifie si le fichier est ouvert
    bool isOpen() const { return isOpen_.load(); }
    
    // Obtient la configuration actuelle
    AudioFileWriterConfig getConfig() const { return config_; }
    
private:
    AudioFileWriterConfig config_;
    std::ofstream file_;
    std::atomic<bool> isOpen_{false};
    std::atomic<size_t> framesWritten_{0};
    std::vector<uint8_t> writeBuffer_;
    size_t bufferPos_ = 0;
    
    // En-tête WAV
    struct WAVHeader {
        // RIFF chunk
        char riffId[4] = {'R', 'I', 'F', 'F'};
        uint32_t riffSize = 0;
        char waveId[4] = {'W', 'A', 'V', 'E'};
        
        // Format chunk
        char fmtId[4] = {'f', 'm', 't', ' '};
        uint32_t fmtSize = 16;
        uint16_t audioFormat = 1;  // PCM
        uint16_t numChannels = 1;
        uint32_t sampleRate = 44100;
        uint32_t byteRate = 0;
        uint16_t blockAlign = 0;
        uint16_t bitsPerSample = 16;
        
        // Data chunk
        char dataId[4] = {'d', 'a', 't', 'a'};
        uint32_t dataSize = 0;
    };
    
    // Méthodes privées
    bool writeWAVHeader();
    void updateWAVHeader();
    bool writeRawData(const void* data, size_t bytes);
    bool flushBuffer();
};

// Classe pour enregistrer directement depuis une capture audio
class AudioRecorder {
public:
    AudioRecorder();
    ~AudioRecorder();
    
    // Configure l'enregistreur
    bool initialize(std::shared_ptr<::Audio::capture::AudioCapture> capture,
                   const AudioFileWriterConfig& writerConfig);
    
    // Démarre l'enregistrement
    bool startRecording();
    
    // Arrête l'enregistrement
    void stopRecording();
    
    // Met en pause l'enregistrement
    void pauseRecording();
    
    // Reprend l'enregistrement
    void resumeRecording();
    
    // Vérifie si l'enregistrement est en cours
    bool isRecording() const { return isRecording_.load(); }
    
    // Vérifie si l'enregistrement est en pause
    bool isPaused() const { return isPaused_.load(); }
    
    // Obtient la durée de l'enregistrement
    float getRecordingDuration() const;
    
    // Obtient le nombre de frames enregistrées
    size_t getFramesRecorded() const;
    
    // Définit une limite de durée (0 = pas de limite)
    void setDurationLimit(float seconds) { durationLimit_ = seconds; }
    
    // Définit une limite de taille de fichier (0 = pas de limite)
    void setFileSizeLimit(size_t bytes) { fileSizeLimit_ = bytes; }
    
    // Callback pour les événements
    using RecordingCallback = std::function<void(const std::string& event)>;
    void setRecordingCallback(RecordingCallback callback) { recordingCallback_ = callback; }
    
private:
    std::shared_ptr<::Audio::capture::AudioCapture> capture_;
    AudioFileWriter writer_;
    AudioFileWriterConfig writerConfig_;
    
    std::atomic<bool> isRecording_{false};
    std::atomic<bool> isPaused_{false};
    std::atomic<size_t> framesRecorded_{0};
    
    float durationLimit_ = 0.0f;
    size_t fileSizeLimit_ = 0;
    RecordingCallback recordingCallback_;
    
    // Thread d'écriture asynchrone
    std::thread writerThread_;
    std::queue<std::vector<float>> writeQueue_;
    std::mutex queueMutex_;
    std::condition_variable queueCV_;
    std::atomic<bool> shouldStop_{false};
    
    // Méthodes privées
    void audioDataCallback(const float* data, size_t frameCount, int channels);
    void writerThreadFunc();
    void checkLimits();
};

// Classe utilitaire pour diviser l'enregistrement en plusieurs fichiers
class MultiFileRecorder {
public:
    enum class SplitMode {
        BY_DURATION,    // Divise par durée
        BY_SIZE,        // Divise par taille de fichier
        BY_SILENCE,     // Divise sur détection de silence
        MANUAL          // Division manuelle
    };
    
    struct SplitConfig {
        SplitMode mode = SplitMode::BY_DURATION;
        float splitDuration = 60.0f;      // Durée en secondes pour BY_DURATION
        size_t splitSize = 100 * 1024 * 1024; // Taille en octets pour BY_SIZE
        float silenceThreshold = 0.001f;  // Seuil pour BY_SILENCE
        float silenceDuration = 2.0f;     // Durée de silence pour déclencher la division
        
        std::string filePattern = "recording_{index}.wav"; // Pattern pour les noms de fichiers
        int startIndex = 0;
    };
    
    MultiFileRecorder();
    ~MultiFileRecorder();
    
    // Initialise avec une capture et une configuration
    bool initialize(std::shared_ptr<::Audio::capture::AudioCapture> capture,
                   const SplitConfig& config,
                   const AudioFileWriterConfig& writerConfig);
    
    // Contrôle de l'enregistrement
    bool startRecording();
    void stopRecording();
    void pauseRecording();
    void resumeRecording();
    
    // Force la division vers un nouveau fichier
    void splitNow();
    
    // Obtient le nombre de fichiers créés
    int getFileCount() const { return fileCount_.load(); }
    
    // Obtient le fichier actuel
    std::string getCurrentFile() const;
    
    // Obtient la liste de tous les fichiers créés
    std::vector<std::string> getAllFiles() const;
    
    // Callbacks
    using FileSplitCallback = std::function<void(const std::string& newFile, int index)>;
    void setFileSplitCallback(FileSplitCallback callback) { fileSplitCallback_ = callback; }
    
private:
    std::shared_ptr<::Audio::capture::AudioCapture> capture_;
    std::unique_ptr<AudioRecorder> currentRecorder_;
    SplitConfig splitConfig_;
    AudioFileWriterConfig writerConfig_;
    
    std::atomic<int> fileCount_{0};
    std::vector<std::string> createdFiles_;
    mutable std::mutex filesMutex_;
    
    FileSplitCallback fileSplitCallback_;
    
    // Détection de silence
    std::unique_ptr<CircularBuffer<float>> silenceBufferPtr_;
    AudioTimer silenceTimer_;
    
    // Méthodes privées
    std::string generateFileName(int index);
    bool createNewFile();
    void checkSplitConditions();
    bool detectSilence(const float* data, size_t frameCount);
};

// === Implémentations inline simples ===

inline float AudioFileWriter::getDurationSeconds() const {
    if (config_.sampleRate == 0) return 0.0f;
    return static_cast<float>(framesWritten_.load()) / config_.sampleRate;
}

inline float AudioRecorder::getRecordingDuration() const {
    if (!writer_.isOpen() || writerConfig_.sampleRate == 0) return 0.0f;
    return static_cast<float>(framesRecorded_.load()) / writerConfig_.sampleRate;
}

inline size_t AudioRecorder::getFramesRecorded() const {
    return framesRecorded_.load();
}

inline std::string MultiFileRecorder::getCurrentFile() const {
    std::lock_guard<std::mutex> lock(filesMutex_);
    if (createdFiles_.empty()) return "";
    return createdFiles_.back();
}

inline std::vector<std::string> MultiFileRecorder::getAllFiles() const {
    std::lock_guard<std::mutex> lock(filesMutex_);
    return createdFiles_;
}

} // namespace Audio
} // namespace Nyth