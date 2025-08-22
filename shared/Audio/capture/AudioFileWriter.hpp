#pragma once

#include <string>
#include <fstream>
#include <vector>
#include <cstdint>
#include <memory>
#include <mutex>
#include <atomic>
#include <functional>

namespace Nyth {
namespace Audio {

// Format de fichier audio
enum class AudioFileFormat {
    WAV,           // Format WAV standard
    RAW_FLOAT32,   // Données brutes float 32-bit
    RAW_INT16,     // Données brutes int 16-bit
    RAW_INT24,     // Données brutes int 24-bit
    RAW_INT32,     // Données brutes int 32-bit
    FLAC,          // Format FLAC (si disponible)
    OGG,           // Format OGG Vorbis (si disponible)
    MP3            // Format MP3 (si disponible)
};

// Configuration pour l'écriture de fichiers
struct FileWriterConfig {
    AudioFileFormat format = AudioFileFormat::WAV;
    uint32_t sampleRate = 48000;
    uint16_t channels = 2;
    uint16_t bitsPerSample = 16;
    bool normalizeOnWrite = false;
    float normalizeTarget = 0.95f;
    
    // Métadonnées (pour formats qui les supportent)
    std::string title;
    std::string artist;
    std::string album;
    std::string comment;
    std::string date;
};

// Statistiques d'écriture
struct WriterStats {
    uint64_t bytesWritten = 0;
    uint64_t samplesWritten = 0;
    double durationSeconds = 0.0;
    bool isWriting = false;
};

// Callback de progression
using ProgressCallback = std::function<void(uint64_t bytesWritten, double durationSeconds)>;

// Classe principale pour l'écriture de fichiers audio
class AudioFileWriter {
public:
    AudioFileWriter();
    ~AudioFileWriter();
    
    // Ouverture/Fermeture du fichier
    bool open(const std::string& filename, const FileWriterConfig& config);
    bool close();
    bool isOpen() const;
    
    // Écriture de données
    bool write(const float* data, size_t frames);
    bool write(const int16_t* data, size_t frames);
    bool write(const int32_t* data, size_t frames);
    bool writeRaw(const void* data, size_t bytes);
    
    // Flush des données en attente
    bool flush();
    
    // Configuration
    FileWriterConfig getConfig() const;
    std::string getFilename() const;
    
    // Statistiques
    WriterStats getStats() const;
    void resetStats();
    
    // Callbacks
    void setProgressCallback(ProgressCallback callback);
    
    // Méthodes statiques utilitaires
    static bool convertFile(const std::string& inputFile, 
                          const std::string& outputFile,
                          AudioFileFormat outputFormat);
    static bool concatenateFiles(const std::vector<std::string>& inputFiles,
                                const std::string& outputFile);
    static bool extractChannel(const std::string& inputFile,
                              const std::string& outputFile,
                              uint16_t channelIndex);
    
private:
    // Structure d'en-tête WAV
    struct WAVHeader {
        // RIFF chunk
        char riffId[4];      // "RIFF"
        uint32_t fileSize;   // Taille du fichier - 8
        char waveId[4];      // "WAVE"
        
        // Format chunk
        char fmtId[4];       // "fmt "
        uint32_t fmtSize;    // Taille du chunk format (16 pour PCM)
        uint16_t audioFormat; // Format audio (1 = PCM, 3 = float)
        uint16_t numChannels; // Nombre de canaux
        uint32_t sampleRate;  // Fréquence d'échantillonnage
        uint32_t byteRate;    // Taux d'octets par seconde
        uint16_t blockAlign;  // Alignement des blocs
        uint16_t bitsPerSample; // Bits par échantillon
        
        // Data chunk
        char dataId[4];      // "data"
        uint32_t dataSize;   // Taille des données audio
        
        WAVHeader() {
            std::memcpy(riffId, "RIFF", 4);
            std::memcpy(waveId, "WAVE", 4);
            std::memcpy(fmtId, "fmt ", 4);
            std::memcpy(dataId, "data", 4);
            fmtSize = 16;
            audioFormat = 1; // PCM par défaut
        }
    };
    
    // Méthodes privées
    bool writeWAVHeader();
    bool updateWAVHeader();
    bool writeWAVData(const void* data, size_t bytes);
    
    void convertFloatToFormat(const float* input, void* output, size_t frames);
    void convertInt16ToFormat(const int16_t* input, void* output, size_t frames);
    void convertInt32ToFormat(const int32_t* input, void* output, size_t frames);
    
    void normalizeData(float* data, size_t samples);
    void notifyProgress();
    
    // Membres
    mutable std::mutex mutex_;
    std::ofstream file_;
    std::string filename_;
    FileWriterConfig config_;
    WriterStats stats_;
    std::atomic<bool> isOpen_{false};
    
    // Buffer interne
    std::vector<uint8_t> writeBuffer_;
    std::vector<float> conversionBuffer_;
    
    // Position dans le fichier
    std::streampos headerPos_;
    std::streampos dataPos_;
    
    // Callback
    ProgressCallback progressCallback_;
    
    // Seuil pour notification de progression (tous les N octets)
    static constexpr uint64_t PROGRESS_THRESHOLD = 1024 * 1024; // 1 MB
    uint64_t lastProgressNotification_ = 0;
};

// Classe pour l'écriture multi-fichiers (splitting)
class MultiFileWriter {
public:
    struct SplitConfig {
        double maxDurationSeconds = 3600.0; // 1 heure par défaut
        uint64_t maxSizeBytes = 2ULL * 1024 * 1024 * 1024; // 2 GB par défaut
        bool autoSplit = true;
        std::string baseFilename;
        std::string suffix = "_{index}";
        AudioFileFormat format = AudioFileFormat::WAV;
    };
    
    MultiFileWriter();
    ~MultiFileWriter();
    
    bool configure(const SplitConfig& splitConfig, const FileWriterConfig& writerConfig);
    bool write(const float* data, size_t frames);
    bool close();
    
    std::vector<std::string> getWrittenFiles() const;
    WriterStats getTotalStats() const;
    
private:
    bool shouldSplit() const;
    bool createNewFile();
    std::string generateFilename(int index) const;
    
    SplitConfig splitConfig_;
    FileWriterConfig writerConfig_;
    std::unique_ptr<AudioFileWriter> currentWriter_;
    std::vector<std::string> writtenFiles_;
    WriterStats totalStats_;
    int fileIndex_ = 0;
    mutable std::mutex mutex_;
};

// Classe pour l'enregistrement en buffer circulaire
class CircularRecorder {
public:
    CircularRecorder(size_t maxDurationSeconds, uint32_t sampleRate, uint16_t channels);
    ~CircularRecorder();
    
    // Ajouter des données au buffer circulaire
    void write(const float* data, size_t frames);
    
    // Sauvegarder les N dernières secondes
    bool saveLastSeconds(const std::string& filename, double seconds, 
                        const FileWriterConfig& config);
    
    // Sauvegarder tout le contenu du buffer
    bool saveAll(const std::string& filename, const FileWriterConfig& config);
    
    // Effacer le buffer
    void clear();
    
    // Obtenir la durée actuelle en secondes
    double getCurrentDuration() const;
    
private:
    struct BufferChunk {
        std::vector<float> data;
        size_t frames;
        std::chrono::steady_clock::time_point timestamp;
    };
    
    mutable std::mutex mutex_;
    std::vector<BufferChunk> chunks_;
    size_t maxChunks_;
    size_t currentChunk_ = 0;
    uint32_t sampleRate_;
    uint16_t channels_;
    size_t totalFrames_ = 0;
    bool wrapped_ = false;
};

} // namespace Audio
} // namespace Nyth