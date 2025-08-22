#pragma once

#include "AudioFileWriter.hpp"
#include "AudioCaptureUtils.hpp"
#include <cstring>
#include <iostream>
#include <chrono>

namespace Nyth {
namespace Audio {

// ============================================================================
// AudioFileWriter Implementation
// ============================================================================

inline AudioFileWriter::AudioFileWriter() {
    writeBuffer_.reserve(1024 * 1024); // 1MB buffer
    conversionBuffer_.reserve(48000 * 2); // 1 seconde à 48kHz stéréo
}

inline AudioFileWriter::~AudioFileWriter() {
    if (isOpen_) {
        close();
    }
}

inline bool AudioFileWriter::open(const std::string& filename, const FileWriterConfig& config) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (isOpen_) {
        return false;
    }
    
    filename_ = filename;
    config_ = config;
    
    // Ouvrir le fichier en mode binaire
    file_.open(filename, std::ios::binary | std::ios::out);
    if (!file_.is_open()) {
        return false;
    }
    
    // Écrire l'en-tête selon le format
    if (config_.format == AudioFileFormat::WAV) {
        if (!writeWAVHeader()) {
            file_.close();
            return false;
        }
    }
    
    isOpen_ = true;
    stats_ = WriterStats();
    stats_.isWriting = true;
    
    return true;
}

inline bool AudioFileWriter::close() {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (!isOpen_) {
        return false;
    }
    
    // Mettre à jour l'en-tête WAV avec la taille finale
    if (config_.format == AudioFileFormat::WAV) {
        updateWAVHeader();
    }
    
    file_.close();
    isOpen_ = false;
    stats_.isWriting = false;
    
    return true;
}

inline bool AudioFileWriter::isOpen() const {
    return isOpen_.load();
}

inline bool AudioFileWriter::write(const float* data, size_t frames) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (!isOpen_) {
        return false;
    }
    
    size_t samples = frames * config_.channels;
    
    // Normaliser si nécessaire
    if (config_.normalizeOnWrite) {
        conversionBuffer_.resize(samples);
        std::memcpy(conversionBuffer_.data(), data, samples * sizeof(float));
        normalizeData(conversionBuffer_.data(), samples);
        data = conversionBuffer_.data();
    }
    
    // Convertir et écrire selon le format
    switch (config_.format) {
        case AudioFileFormat::WAV: {
            size_t bytesPerSample = config_.bitsPerSample / 8;
            size_t totalBytes = frames * config_.channels * bytesPerSample;
            writeBuffer_.resize(totalBytes);
            
            convertFloatToFormat(data, writeBuffer_.data(), frames);
            
            if (!writeWAVData(writeBuffer_.data(), totalBytes)) {
                return false;
            }
            break;
        }
        
        case AudioFileFormat::RAW_FLOAT32: {
            size_t totalBytes = samples * sizeof(float);
            if (!writeRaw(data, totalBytes)) {
                return false;
            }
            break;
        }
        
        case AudioFileFormat::RAW_INT16: {
            writeBuffer_.resize(samples * sizeof(int16_t));
            Utils::floatToInt16(data, reinterpret_cast<int16_t*>(writeBuffer_.data()), samples);
            if (!writeRaw(writeBuffer_.data(), writeBuffer_.size())) {
                return false;
            }
            break;
        }
        
        default:
            return false;
    }
    
    // Mettre à jour les statistiques
    stats_.samplesWritten += samples;
    stats_.durationSeconds = static_cast<double>(stats_.samplesWritten) / 
                             (config_.sampleRate * config_.channels);
    
    notifyProgress();
    
    return true;
}

inline bool AudioFileWriter::write(const int16_t* data, size_t frames) {
    size_t samples = frames * config_.channels;
    conversionBuffer_.resize(samples);
    Utils::int16ToFloat(data, conversionBuffer_.data(), samples);
    return write(conversionBuffer_.data(), frames);
}

inline bool AudioFileWriter::write(const int32_t* data, size_t frames) {
    size_t samples = frames * config_.channels;
    conversionBuffer_.resize(samples);
    Utils::int32ToFloat(data, conversionBuffer_.data(), samples);
    return write(conversionBuffer_.data(), frames);
}

inline bool AudioFileWriter::writeRaw(const void* data, size_t bytes) {
    if (!isOpen_) {
        return false;
    }
    
    file_.write(static_cast<const char*>(data), bytes);
    stats_.bytesWritten += bytes;
    
    return file_.good();
}

inline bool AudioFileWriter::flush() {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (!isOpen_) {
        return false;
    }
    
    file_.flush();
    return file_.good();
}

inline FileWriterConfig AudioFileWriter::getConfig() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return config_;
}

inline std::string AudioFileWriter::getFilename() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return filename_;
}

inline WriterStats AudioFileWriter::getStats() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return stats_;
}

inline void AudioFileWriter::resetStats() {
    std::lock_guard<std::mutex> lock(mutex_);
    stats_ = WriterStats();
    stats_.isWriting = isOpen_;
}

inline void AudioFileWriter::setProgressCallback(ProgressCallback callback) {
    std::lock_guard<std::mutex> lock(mutex_);
    progressCallback_ = callback;
}

inline bool AudioFileWriter::writeWAVHeader() {
    WAVHeader header;
    
    // Configurer l'en-tête
    header.numChannels = config_.channels;
    header.sampleRate = config_.sampleRate;
    header.bitsPerSample = config_.bitsPerSample;
    
    // Format audio: 1 = PCM entier, 3 = IEEE float
    if (config_.bitsPerSample == 32 && config_.format == AudioFileFormat::WAV) {
        header.audioFormat = 3; // IEEE float
    } else {
        header.audioFormat = 1; // PCM
    }
    
    header.blockAlign = config_.channels * (config_.bitsPerSample / 8);
    header.byteRate = config_.sampleRate * header.blockAlign;
    
    // Tailles temporaires (seront mises à jour à la fermeture)
    header.dataSize = 0;
    header.fileSize = 36; // Taille minimale sans données
    
    // Sauvegarder la position de l'en-tête
    headerPos_ = file_.tellp();
    
    // Écrire l'en-tête
    file_.write(reinterpret_cast<const char*>(&header), sizeof(header));
    
    // Sauvegarder la position des données
    dataPos_ = file_.tellp();
    
    return file_.good();
}

inline bool AudioFileWriter::updateWAVHeader() {
    if (!file_.is_open()) {
        return false;
    }
    
    // Sauvegarder la position actuelle
    std::streampos currentPos = file_.tellp();
    
    // Calculer les tailles
    uint32_t dataSize = static_cast<uint32_t>(currentPos - dataPos_);
    uint32_t fileSize = static_cast<uint32_t>(currentPos - headerPos_) - 8;
    
    // Aller à la position du champ fileSize
    file_.seekp(headerPos_ + 4);
    file_.write(reinterpret_cast<const char*>(&fileSize), sizeof(fileSize));
    
    // Aller à la position du champ dataSize
    file_.seekp(dataPos_ - 4);
    file_.write(reinterpret_cast<const char*>(&dataSize), sizeof(dataSize));
    
    // Retourner à la position actuelle
    file_.seekp(currentPos);
    
    return file_.good();
}

inline bool AudioFileWriter::writeWAVData(const void* data, size_t bytes) {
    file_.write(static_cast<const char*>(data), bytes);
    stats_.bytesWritten += bytes;
    return file_.good();
}

inline void AudioFileWriter::convertFloatToFormat(const float* input, void* output, size_t frames) {
    size_t samples = frames * config_.channels;
    
    switch (config_.bitsPerSample) {
        case 16:
            Utils::floatToInt16(input, static_cast<int16_t*>(output), samples);
            break;
            
        case 24:
            Utils::floatToInt24(input, static_cast<uint8_t*>(output), samples);
            break;
            
        case 32:
            if (config_.audioFormat == 3) { // IEEE float
                std::memcpy(output, input, samples * sizeof(float));
            } else { // PCM int32
                Utils::floatToInt32(input, static_cast<int32_t*>(output), samples);
            }
            break;
            
        default:
            // Format non supporté, copier tel quel
            std::memcpy(output, input, samples * sizeof(float));
            break;
    }
}

inline void AudioFileWriter::normalizeData(float* data, size_t samples) {
    float peak = Utils::calculatePeak(data, samples);
    if (peak > 0.0f) {
        float gain = config_.normalizeTarget / peak;
        Utils::applyGain(data, samples, gain);
    }
}

inline void AudioFileWriter::notifyProgress() {
    if (progressCallback_ && 
        stats_.bytesWritten - lastProgressNotification_ >= PROGRESS_THRESHOLD) {
        progressCallback_(stats_.bytesWritten, stats_.durationSeconds);
        lastProgressNotification_ = stats_.bytesWritten;
    }
}

// ============================================================================
// CircularRecorder Implementation
// ============================================================================

inline CircularRecorder::CircularRecorder(size_t maxDurationSeconds, 
                                         uint32_t sampleRate, 
                                         uint16_t channels) 
    : sampleRate_(sampleRate), channels_(channels) {
    
    // Calculer le nombre de chunks (1 chunk par seconde)
    maxChunks_ = maxDurationSeconds;
    chunks_.resize(maxChunks_);
    
    // Pré-allouer la mémoire pour chaque chunk
    size_t samplesPerChunk = sampleRate * channels;
    for (auto& chunk : chunks_) {
        chunk.data.reserve(samplesPerChunk);
    }
}

inline CircularRecorder::~CircularRecorder() = default;

inline void CircularRecorder::write(const float* data, size_t frames) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    size_t samples = frames * channels_;
    auto& chunk = chunks_[currentChunk_];
    
    // Si le chunk actuel est plein, passer au suivant
    if (chunk.frames >= sampleRate_) {
        currentChunk_ = (currentChunk_ + 1) % maxChunks_;
        if (currentChunk_ == 0) {
            wrapped_ = true;
        }
        
        chunk = chunks_[currentChunk_];
        chunk.data.clear();
        chunk.frames = 0;
        chunk.timestamp = std::chrono::steady_clock::now();
    }
    
    // Ajouter les données au chunk actuel
    chunk.data.insert(chunk.data.end(), data, data + samples);
    chunk.frames += frames;
    totalFrames_ += frames;
}

inline bool CircularRecorder::saveLastSeconds(const std::string& filename, 
                                             double seconds,
                                             const FileWriterConfig& config) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    AudioFileWriter writer;
    if (!writer.open(filename, config)) {
        return false;
    }
    
    size_t framesToSave = static_cast<size_t>(seconds * sampleRate_);
    size_t framesSaved = 0;
    
    // Calculer le point de départ
    size_t startChunk = currentChunk_;
    if (wrapped_) {
        // Reculer dans le buffer circulaire
        size_t chunksNeeded = static_cast<size_t>(seconds);
        if (chunksNeeded > maxChunks_) {
            chunksNeeded = maxChunks_;
        }
        
        startChunk = (currentChunk_ + maxChunks_ - chunksNeeded + 1) % maxChunks_;
    } else {
        // Commencer depuis le début si pas encore wrappé
        startChunk = 0;
    }
    
    // Écrire les chunks
    for (size_t i = 0; i < maxChunks_ && framesSaved < framesToSave; ++i) {
        size_t chunkIndex = (startChunk + i) % maxChunks_;
        const auto& chunk = chunks_[chunkIndex];
        
        if (chunk.frames > 0) {
            size_t framesToWrite = std::min(chunk.frames, framesToSave - framesSaved);
            writer.write(chunk.data.data(), framesToWrite);
            framesSaved += framesToWrite;
        }
    }
    
    return writer.close();
}

inline bool CircularRecorder::saveAll(const std::string& filename, 
                                     const FileWriterConfig& config) {
    double duration = getCurrentDuration();
    return saveLastSeconds(filename, duration, config);
}

inline void CircularRecorder::clear() {
    std::lock_guard<std::mutex> lock(mutex_);
    
    for (auto& chunk : chunks_) {
        chunk.data.clear();
        chunk.frames = 0;
    }
    
    currentChunk_ = 0;
    totalFrames_ = 0;
    wrapped_ = false;
}

inline double CircularRecorder::getCurrentDuration() const {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (wrapped_) {
        // Buffer plein, retourner la durée maximale
        return static_cast<double>(maxChunks_);
    } else {
        // Calculer la durée actuelle
        return static_cast<double>(totalFrames_) / sampleRate_;
    }
}

} // namespace Audio
} // namespace Nyth