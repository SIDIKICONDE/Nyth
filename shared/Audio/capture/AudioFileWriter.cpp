#include "AudioFileWriter.hpp"
#include <iostream>
#include <chrono>

namespace Nyth {
namespace Audio {

// ============================================================================
// AudioRecorder Implementation
// ============================================================================

AudioRecorder::AudioRecorder() = default;

AudioRecorder::~AudioRecorder() {
    if (isRecording()) {
        stopRecording();
    }
}

bool AudioRecorder::initialize(std::shared_ptr<::Audio::capture::AudioCapture> capture,
                              const AudioFileWriterConfig& writerConfig) {
    if (!capture) {
        return false;
    }

    capture_ = capture;
    writerConfig_ = writerConfig;

    // Créer le writer avec la configuration
    writer_ = AudioFileWriter();

    if (!writer_.initialize(writerConfig_)) {
        return false;
    }

    return true;
}

bool AudioRecorder::startRecording() {
    if (!capture_ || !writer_.isOpen()) {
        return false;
    }

    if (isRecording()) {
        return true; // Déjà en cours
    }

    // Sauvegarder le callback original
    originalCallback_ = capture_->getAudioDataCallback();

    // Configurer le callback d'enregistrement
    capture_->setAudioDataCallback(
        [this](const float* data, size_t frameCount, int channels) {
            audioDataCallback(data, frameCount, channels);
        }
    );

    isRecording_ = true;
    return true;
}

bool AudioRecorder::stopRecording() {
    if (!isRecording()) {
        return true; // Pas en cours
    }

    // Restaurer le callback original
    if (capture_ && originalCallback_) {
        capture_->setAudioDataCallback(originalCallback_);
    }

    // Finaliser le fichier
    if (writer_.isOpen()) {
        writer_.close();
    }

    isRecording_ = false;
    return true;
}

void AudioRecorder::pauseRecording() {
    isPaused_ = true;
}

void AudioRecorder::resumeRecording() {
    isPaused_ = false;
}

void AudioRecorder::audioDataCallback(const float* data, size_t frameCount, int channels) {
    if (!isRecording() || isPaused_ || !writer_.isOpen()) {
        return;
    }

    // Écrire les données dans le fichier
    writer_.write(data, frameCount * channels);
    framesRecorded_ += frameCount;
}

void AudioRecorder::writerThreadFunc() {
    // Thread d'écriture asynchrone (si nécessaire)
}

// ============================================================================
// MultiFileRecorder Implementation
// ============================================================================

MultiFileRecorder::MultiFileRecorder() = default;

MultiFileRecorder::~MultiFileRecorder() {
    if (currentRecorder_) {
        stopRecording();
    }
}

std::string MultiFileRecorder::generateFileName(int index) {
    std::string baseName = splitConfig_.filePattern;
    size_t pos = baseName.find("{index}");
    if (pos != std::string::npos) {
        baseName.replace(pos, 7, std::to_string(index));
    }
    return baseName;
}

bool MultiFileRecorder::createNewFile() {
    if (!currentRecorder_) {
        return false;
    }

    // Générer le nom du nouveau fichier
    std::string newFileName = generateFileName(fileCount_.load());
    AudioFileWriterConfig newConfig = writerConfig_;
    newConfig.filePath = newFileName;

    // Créer un nouveau recorder
    currentRecorder_ = std::make_unique<AudioRecorder>();
    return currentRecorder_->initialize(capture_, newConfig);
}

void MultiFileRecorder::checkSplitConditions() {
    // Implémentation basique - peut être étendue selon les besoins
    if (fileCount_.load() < 10) { // Limite arbitraire pour l'exemple
        createNewFile();
        fileCount_++;
    }
}

bool MultiFileRecorder::detectSilence(const float* data, size_t frameCount) {
    if (!data || frameCount == 0) return true;

    for (size_t i = 0; i < frameCount; ++i) {
        if (std::abs(data[i]) > splitConfig_.silenceThreshold) {
            return false;
        }
    }
    return true;
}

bool MultiFileRecorder::initialize(std::shared_ptr<::Audio::capture::AudioCapture> capture,
                                  const SplitConfig& config,
                                  const AudioFileWriterConfig& writerConfig) {
    capture_ = capture;
    splitConfig_ = config;
    writerConfig_ = writerConfig;

    // Créer le premier recorder
    currentRecorder_ = std::make_unique<AudioRecorder>();
    return createNewFile();
}

bool MultiFileRecorder::startRecording() {
    if (!currentRecorder_) {
        return false;
    }
    return currentRecorder_->startRecording();
}

void MultiFileRecorder::stopRecording() {
    if (currentRecorder_) {
        currentRecorder_->stopRecording();
    }
}

void MultiFileRecorder::pauseRecording() {
    if (currentRecorder_) {
        currentRecorder_->pauseRecording();
    }
}

void MultiFileRecorder::resumeRecording() {
    if (currentRecorder_) {
        currentRecorder_->resumeRecording();
    }
}

void MultiFileRecorder::splitNow() {
    if (currentRecorder_) {
        currentRecorder_->stopRecording();
        createNewFile();
        currentRecorder_->startRecording();
    }
}

// ============================================================================
// AudioFileWriter Implementation
// ============================================================================

AudioFileWriter::AudioFileWriter() = default;

AudioFileWriter::~AudioFileWriter() {
    if (isOpen()) {
        close();
    }
}

bool AudioFileWriter::initialize(const AudioFileWriterConfig& config) {
    config_ = config;
    return open(config);
}

bool AudioFileWriter::open(const AudioFileWriterConfig& config) {
    if (isOpen()) {
        close();
    }

    config_ = config;

    if (config.format == AudioFileFormat::WAV) {
        // Pour WAV, on écrit d'abord l'en-tête avec des valeurs placeholder
        file_.open(config.filePath, std::ios::binary);
        if (!file_.is_open()) {
            return false;
        }

        // Écrire l'en-tête WAV avec des valeurs temporaires
        writeWAVHeader();
    } else if (config.format == AudioFileFormat::RAW_PCM) {
        file_.open(config.filePath, std::ios::binary);
        if (!file_.is_open()) {
            return false;
        }
    }

    isOpen_ = true;
    framesWritten_ = 0;
    bufferPos_ = 0;

    return true;
}

void AudioFileWriter::close() {
    if (!isOpen()) {
        return;
    }

    flush();

    if (config_.format == AudioFileFormat::WAV) {
        // Mettre à jour l'en-tête WAV avec les vraies valeurs
        updateWAVHeader();
    }

    file_.close();
    isOpen_ = false;
}

bool AudioFileWriter::write(const float* data, size_t sampleCount) {
    if (!isOpen() || !data) {
        return false;
    }

    // Convertir float vers int16 pour l'écriture
    std::vector<int16_t> intData(sampleCount);
    for (size_t i = 0; i < sampleCount; ++i) {
        float sample = data[i] * 32767.0f;
        sample = std::max(-32768.0f, std::min(32767.0f, sample));
        intData[i] = static_cast<int16_t>(sample);
    }

    return writeInt16(intData.data(), sampleCount);
}

bool AudioFileWriter::writeInt16(const int16_t* data, size_t sampleCount) {
    if (!isOpen() || !data) {
        return false;
    }

    // Écrire directement dans le fichier
    file_.write(reinterpret_cast<const char*>(data), sampleCount * sizeof(int16_t));
    framesWritten_ += sampleCount / config_.channelCount;

    return file_.good();
}

void AudioFileWriter::flush() {
    if (bufferPos_ > 0 && isOpen()) {
        file_.write(reinterpret_cast<const char*>(writeBuffer_.data()), bufferPos_);
        bufferPos_ = 0;
    }
    file_.flush();
}

bool AudioFileWriter::writeWAVHeader() {
    if (!file_.is_open()) return false;

    WAVHeader header;
    header.dataSize = 0; // Sera mis à jour à la fin
    header.riffSize = sizeof(WAVHeader) - 8 + header.dataSize;

    header.numChannels = config_.channelCount;
    header.sampleRate = config_.sampleRate;
    header.bitsPerSample = config_.bitsPerSample;
    header.byteRate = config_.sampleRate * config_.channelCount * (config_.bitsPerSample / 8);
    header.blockAlign = config_.channelCount * (config_.bitsPerSample / 8);

    file_.write(reinterpret_cast<const char*>(&header), sizeof(WAVHeader));
    return file_.good();
}

void AudioFileWriter::updateWAVHeader() {
    if (!file_.is_open()) return;

    // Calculer la taille des données
    size_t dataSize = framesWritten_ * config_.channelCount * (config_.bitsPerSample / 8);

    // Se positionner au début du fichier
    file_.seekp(0, std::ios::beg);

    // Mettre à jour l'en-tête avec les vraies valeurs
    WAVHeader header;
    header.dataSize = static_cast<uint32_t>(dataSize);
    header.riffSize = sizeof(WAVHeader) - 8 + header.dataSize;
    header.numChannels = config_.channelCount;
    header.sampleRate = config_.sampleRate;
    header.bitsPerSample = config_.bitsPerSample;
    header.byteRate = config_.sampleRate * config_.channelCount * (config_.bitsPerSample / 8);
    header.blockAlign = config_.channelCount * (config_.bitsPerSample / 8);

    file_.write(reinterpret_cast<const char*>(&header), sizeof(WAVHeader));
}

bool AudioFileWriter::writeRawData(const void* data, size_t bytes) {
    if (!isOpen() || !data) return false;

    file_.write(static_cast<const char*>(data), bytes);
    return file_.good();
}

bool AudioFileWriter::flushBuffer() {
    if (bufferPos_ == 0) return true;

    bool success = writeRawData(writeBuffer_.data(), bufferPos_);
    if (success) {
        bufferPos_ = 0;
    }
    return success;
}

} // namespace Audio
} // namespace Nyth
