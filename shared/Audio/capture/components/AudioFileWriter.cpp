#include "AudioFileWriter.hpp"
#include "../../common/config/Constant.hpp"
#include <algorithm>
#include <chrono>
#include <cstring>
#include <iostream>
#include <sstream>
#include <iomanip>

namespace Nyth {
namespace Audio {

// ============================================================================
// AudioFileWriter Implementation
// ============================================================================

AudioFileWriter::AudioFileWriter() {
    // Réserver de l'espace pour le buffer d'écriture
    writeBuffer_.reserve(Constants::DEFAULT_BUFFER_SIZE);
}

AudioFileWriter::~AudioFileWriter() {
    if (isOpen()) {
        close();
    }
}

bool AudioFileWriter::open(const AudioFileWriterConfig& config) {
    // Vérifier si un fichier est déjà ouvert
    if (isOpen()) {
        std::cerr << "AudioFileWriter: File already open" << std::endl;
        return false;
    }

    // Valider la configuration
    if (config.filePath.empty()) {
        std::cerr << "AudioFileWriter: Empty file path" << std::endl;
        return false;
    }

    if (config.sampleRate <= 0 || config.channelCount <= 0) {
        std::cerr << "AudioFileWriter: Invalid sample rate or channel count" << std::endl;
        return false;
    }

    if (config.bitsPerSample != Constants::BITS_PER_SAMPLE_16 &&
        config.bitsPerSample != Constants::BITS_PER_SAMPLE_24 &&
        config.bitsPerSample != Constants::BITS_PER_SAMPLE_32) {
        std::cerr << "AudioFileWriter: Unsupported bits per sample: " << config.bitsPerSample << std::endl;
        return false;
    }

    config_ = config;

    // Ouvrir le fichier
    std::ios::openmode mode = std::ios::binary;
    if (config.appendMode) {
        mode |= std::ios::app;
    } else {
        mode |= std::ios::trunc;
    }

    file_.open(config.filePath, mode | std::ios::out);
    if (!file_.is_open()) {
        std::cerr << "AudioFileWriter: Failed to open file: " << config.filePath << std::endl;
        return false;
    }

    // Réinitialiser les compteurs
    framesWritten_ = 0;
    bufferPos_ = 0;
    writeBuffer_.resize(config.bufferSize);

    // Écrire l'en-tête si nécessaire
    if (config.format == AudioFileFormat::WAV && !config.appendMode) {
        if (!writeWAVHeader()) {
            file_.close();
            return false;
        }
    }

    isOpen_ = true;
    return true;
}

void AudioFileWriter::close() {
    if (!isOpen()) {
        return;
    }

    // Flush les données restantes
    flush();

    // Mettre à jour l'en-tête WAV si nécessaire
    if (config_.format == AudioFileFormat::WAV && !config_.appendMode) {
        updateWAVHeader();
    }

    // Fermer le fichier
    file_.close();
    isOpen_ = false;
}

bool AudioFileWriter::write(const float* data, size_t frameCount) {
    if (!isOpen() || !data || frameCount == 0) {
        return false;
    }

    size_t sampleCount = frameCount * config_.channelCount;

    // Convertir et écrire selon le format
    if (config_.bitsPerSample == Constants::BITS_PER_SAMPLE_16) {
        // Convertir float vers int16
        std::vector<int16_t> int16Data(sampleCount);

        for (size_t i = 0; i < sampleCount; ++i) {
            float sample = data[i] * Constants::INT16_SCALE;
            sample = std::max(Constants::INT16_MIN_VALUE, std::min(Constants::INT16_MAX_VALUE, sample));
            int16Data[i] = static_cast<int16_t>(sample);
        }

        return writeRawData(int16Data.data(), sampleCount * sizeof(int16_t));
    } else if (config_.bitsPerSample == Constants::BITS_PER_SAMPLE_32) {
        // Écrire directement les floats (32 bits)
        return writeRawData(data, sampleCount * sizeof(float));
    } else if (config_.bitsPerSample == Constants::BITS_PER_SAMPLE_24) {
        // Convertir float vers int24 (stocké dans int32)
        std::vector<uint8_t> int24Data(sampleCount * 3);

        for (size_t i = 0; i < sampleCount; ++i) {
            float sample = data[i] * Constants::INT24_SCALE;
            sample = std::max(Constants::INT24_MIN, std::min(Constants::INT24_MAX, sample));
            int32_t int32Sample = static_cast<int32_t>(sample);

            // Stocker en little-endian (3 octets)
            size_t byteIndex = i * 3;
            int24Data[byteIndex] = int32Sample & Constants::BYTE_MASK;
            int24Data[byteIndex + 1] = (int32Sample >> Constants::INT24_SHIFT_8) & Constants::BYTE_MASK;
            int24Data[byteIndex + 2] = (int32Sample >> Constants::INT24_SHIFT_16) & Constants::BYTE_MASK;
        }

        return writeRawData(int24Data.data(), int24Data.size());
    }

    return false;
}

bool AudioFileWriter::writeInt16(const int16_t* data, size_t frameCount) {
    if (!isOpen() || !data || frameCount == 0) {
        return false;
    }

    size_t sampleCount = frameCount * config_.channelCount;

    if (config_.bitsPerSample == Constants::BITS_PER_SAMPLE_16) {
        // Écrire directement
        return writeRawData(data, sampleCount * sizeof(int16_t));
    } else {
        // Convertir vers float puis écrire
        std::vector<float> floatData(sampleCount);

        for (size_t i = 0; i < sampleCount; ++i) {
            floatData[i] = data[i] * Constants::INT16_TO_FLOAT_SCALE;
        }

        return write(floatData.data(), frameCount);
    }
}

void AudioFileWriter::flush() {
    if (!isOpen()) {
        return;
    }

    flushBuffer();
    file_.flush();
}

bool AudioFileWriter::writeWAVHeader() {
    WAVHeader header;

    // Configurer l'en-tête
    header.audioFormat = (config_.bitsPerSample == Constants::BITS_PER_SAMPLE_32) ? Constants::WAV_FORMAT_IEEE_FLOAT : Constants::WAV_FORMAT_PCM;
    header.numChannels = config_.channelCount;
    header.sampleRate = config_.sampleRate;
    header.bitsPerSample = config_.bitsPerSample;
    header.blockAlign = config_.channelCount * (config_.bitsPerSample / Constants::BITS_TO_BYTES_FACTOR);
    header.byteRate = config_.sampleRate * header.blockAlign;

    // Les tailles seront mises à jour lors de la fermeture
    header.riffSize = Constants::WAV_HEADER_SIZE;
    header.dataSize = 0;

    // Écrire l'en-tête
    file_.write(reinterpret_cast<const char*>(&header), sizeof(header));

    return file_.good();
}

void AudioFileWriter::updateWAVHeader() {
    if (!file_.is_open()) {
        return;
    }

    // Calculer les tailles
    size_t dataSize = framesWritten_ * config_.channelCount * (config_.bitsPerSample / Constants::BITS_TO_BYTES_FACTOR);
    size_t riffSize = dataSize + Constants::WAV_HEADER_SIZE;

    // Sauvegarder la position actuelle
    std::streampos currentPos = file_.tellp();

    // Mettre à jour la taille RIFF
    file_.seekp(Constants::WAV_RIFF_SIZE_POSITION, std::ios::beg);
    uint32_t riffSize32 = static_cast<uint32_t>(std::min(riffSize, size_t(Constants::UINT32_MAX_VALUE)));
    file_.write(reinterpret_cast<const char*>(&riffSize32), sizeof(riffSize32));

    // Mettre à jour la taille des données
    file_.seekp(Constants::WAV_DATA_SIZE_POSITION, std::ios::beg);
    uint32_t dataSize32 = static_cast<uint32_t>(std::min(dataSize, size_t(Constants::UINT32_MAX_VALUE)));
    file_.write(reinterpret_cast<const char*>(&dataSize32), sizeof(dataSize32));

    // Restaurer la position
    file_.seekp(currentPos);
}

bool AudioFileWriter::writeRawData(const void* data, size_t bytes) {
    if (!data || bytes == 0) {
        return true;
    }

    const uint8_t* byteData = static_cast<const uint8_t*>(data);
    size_t bytesWritten = 0;

    while (bytesWritten < bytes) {
        // Calculer combien on peut écrire dans le buffer
        size_t spaceInBuffer = writeBuffer_.size() - bufferPos_;
        size_t bytesToWrite = std::min(bytes - bytesWritten, spaceInBuffer);

        // Copier dans le buffer
        std::memcpy(writeBuffer_.data() + bufferPos_, byteData + bytesWritten, bytesToWrite);
        bufferPos_ += bytesToWrite;
        bytesWritten += bytesToWrite;

        // Si le buffer est plein, le vider
        if (bufferPos_ >= writeBuffer_.size()) {
            if (!flushBuffer()) {
                return false;
            }
        }
    }

    // Mettre à jour le compteur de frames
    size_t bytesPerFrame = config_.channelCount * (config_.bitsPerSample / Constants::BITS_TO_BYTES_FACTOR);
    framesWritten_ += bytes / bytesPerFrame;

    return true;
}

bool AudioFileWriter::flushBuffer() {
    if (bufferPos_ == 0) {
        return true;
    }

    file_.write(reinterpret_cast<const char*>(writeBuffer_.data()), bufferPos_);
    bufferPos_ = 0;

    return file_.good();
}

// ============================================================================
// AudioRecorder Implementation
// ============================================================================

AudioRecorder::AudioRecorder() {
}

AudioRecorder::~AudioRecorder() {
    if (isRecording()) {
        stopRecording();
    }
}

bool AudioRecorder::initialize(std::shared_ptr<AudioCapture> capture,
                               const AudioFileWriterConfig& writerConfig) {
    if (!capture) {
        std::cerr << "AudioRecorder: Null capture object" << std::endl;
        return false;
    }

    capture_ = capture;
    writerConfig_ = writerConfig;

    // Adapter la configuration selon la capture
    auto captureConfig = capture_->getConfig();
    writerConfig_.sampleRate = captureConfig.sampleRate;
    writerConfig_.channelCount = captureConfig.channelCount;

    return true;
}

bool AudioRecorder::startRecording() {
    if (isRecording()) {
        return false;
    }

    // Ouvrir le fichier
    if (!writer_.open(writerConfig_)) {
        std::cerr << "AudioRecorder: Failed to open file for writing" << std::endl;
        return false;
    }

    // Réinitialiser les compteurs
    framesRecorded_ = 0;
    shouldStop_ = false;
    isPaused_ = false;

    // Démarrer le thread d'écriture
    writerThread_ = std::thread(&AudioRecorder::writerThreadFunc, this);

    // Configurer le callback de capture
    capture_->setAudioDataCallback(
        [this](const float* data, size_t frameCount, int channels) {
            audioDataCallback(data, frameCount, channels);
        });

    // Démarrer la capture si nécessaire
    if (capture_->getState() != CaptureState::Running) {
        if (!capture_->start()) {
            shouldStop_ = true;
            if (writerThread_.joinable()) {
                writerThread_.join();
            }
            writer_.close();
            return false;
        }
    }

    isRecording_ = true;

    if (recordingCallback_) {
        recordingCallback_("recording_started");
    }

    return true;
}

void AudioRecorder::stopRecording() {
    if (!isRecording()) {
        return;
    }

    isRecording_ = false;
    isPaused_ = false;

    // Arrêter le thread d'écriture
    shouldStop_ = true;
    queueCV_.notify_all();

    if (writerThread_.joinable()) {
        writerThread_.join();
    }

    // Fermer le fichier
    writer_.close();

    // Arrêter la capture si nécessaire
    if (capture_ && capture_->getState() == CaptureState::Running) {
        capture_->stop();
    }

    if (recordingCallback_) {
        recordingCallback_("recording_stopped");
    }
}

void AudioRecorder::pauseRecording() {
    if (!isRecording() || isPaused()) {
        return;
    }

    isPaused_ = true;

    if (recordingCallback_) {
        recordingCallback_("recording_paused");
    }
}

void AudioRecorder::resumeRecording() {
    if (!isRecording() || !isPaused()) {
        return;
    }

    isPaused_ = false;
    queueCV_.notify_all();

    if (recordingCallback_) {
        recordingCallback_("recording_resumed");
    }
}

void AudioRecorder::audioDataCallback(const float* data, size_t frameCount, int channels) {
    if (!isRecording() || isPaused()) {
        return;
    }

    // Copier les données dans un buffer
    std::vector<float> buffer(data, data + frameCount * channels);

    // Ajouter à la queue
    {
        std::lock_guard<std::mutex> lock(queueMutex_);
        writeQueue_.push(std::move(buffer));
    }

    queueCV_.notify_one();

    // Vérifier les limites
    checkLimits();
}

void AudioRecorder::writerThreadFunc() {
    while (!shouldStop_) {
        std::unique_lock<std::mutex> lock(queueMutex_);

        // Attendre qu'il y ait des données ou qu'on doive s'arrêter
        queueCV_.wait(lock, [this] {
            return !writeQueue_.empty() || shouldStop_;
        });

        // Traiter toutes les données en attente
        while (!writeQueue_.empty()) {
            auto buffer = std::move(writeQueue_.front());
            writeQueue_.pop();
            lock.unlock();

            // Écrire les données
            size_t frameCount = buffer.size() / writerConfig_.channelCount;
            if (writer_.write(buffer.data(), frameCount)) {
                framesRecorded_ += frameCount;
            } else {
                std::cerr << "AudioRecorder: Failed to write audio data" << std::endl;
            }

            lock.lock();
        }
    }

    // Écrire les dernières données restantes
    std::lock_guard<std::mutex> lock(queueMutex_);
    while (!writeQueue_.empty()) {
        auto buffer = std::move(writeQueue_.front());
        writeQueue_.pop();

        size_t frameCount = buffer.size() / writerConfig_.channelCount;
        writer_.write(buffer.data(), frameCount);
        framesRecorded_ += frameCount;
    }
}

void AudioRecorder::checkLimits() {
    // Vérifier la limite de durée
    if (durationLimit_ > 0) {
        float duration = getRecordingDuration();
        if (duration >= durationLimit_) {
            stopRecording();
            if (recordingCallback_) {
                recordingCallback_("duration_limit_reached");
            }
        }
    }

    // Vérifier la limite de taille
    if (fileSizeLimit_ > 0) {
        size_t bytesPerFrame = writerConfig_.channelCount * (writerConfig_.bitsPerSample / Constants::BITS_TO_BYTES_FACTOR);
        size_t currentSize = framesRecorded_ * bytesPerFrame;

        if (currentSize >= fileSizeLimit_) {
            stopRecording();
            if (recordingCallback_) {
                recordingCallback_("size_limit_reached");
            }
        }
    }
}

// ============================================================================
// MultiFileRecorder Implementation
// ============================================================================

MultiFileRecorder::MultiFileRecorder() {
    silenceBufferPtr_ = std::make_unique<CircularBuffer<float>>(Constants::DEFAULT_SILENCE_BUFFER_SIZE);
}

MultiFileRecorder::~MultiFileRecorder() {
    if (currentRecorder_ && currentRecorder_->isRecording()) {
        stopRecording();
    }
}

bool MultiFileRecorder::initialize(std::shared_ptr<AudioCapture> capture,
                                   const SplitConfig& config,
                                   const AudioFileWriterConfig& writerConfig) {
    if (!capture) {
        return false;
    }

    capture_ = capture;
    splitConfig_ = config;
    writerConfig_ = writerConfig;
    fileCount_ = splitConfig_.startIndex;

    // Initialiser le buffer de détection de silence si nécessaire
    if (splitConfig_.mode == SplitMode::BY_SILENCE) {
        size_t bufferSize = static_cast<size_t>(
            writerConfig_.sampleRate * splitConfig_.silenceDuration * writerConfig_.channelCount
        );
        silenceBufferPtr_ = std::make_unique<CircularBuffer<float>>(bufferSize);
    }

    return true;
}

bool MultiFileRecorder::startRecording() {
    if (!capture_) {
        return false;
    }

    // Créer le premier fichier
    if (!createNewFile()) {
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
    if (!currentRecorder_ || !currentRecorder_->isRecording()) {
        return;
    }

    bool wasPaused = currentRecorder_->isPaused();

    // Arrêter l'enregistrement actuel
    currentRecorder_->stopRecording();

    // Créer un nouveau fichier
    if (createNewFile()) {
        // Redémarrer l'enregistrement
        currentRecorder_->startRecording();

        if (wasPaused) {
            currentRecorder_->pauseRecording();
        }
    }
}

std::string MultiFileRecorder::generateFileName(int index) {
    std::string pattern = splitConfig_.filePattern;

    // Remplacer {index} par l'index actuel
    size_t pos = pattern.find("{index}");
    if (pos != std::string::npos) {
        std::stringstream ss;
        ss << std::setfill('0') << std::setw(Constants::FILENAME_INDEX_WIDTH) << index;
        pattern.replace(pos, Constants::INDEX_PLACEHOLDER_LENGTH, ss.str());
    }

    // Remplacer {timestamp} par un timestamp
    pos = pattern.find("{timestamp}");
    if (pos != std::string::npos) {
        auto now = std::chrono::system_clock::now();
        auto time_t = std::chrono::system_clock::to_time_t(now);
        std::stringstream ss;
        ss << std::put_time(std::localtime(&time_t), "%Y%m%d_%H%M%S");
        pattern.replace(pos, Constants::TIMESTAMP_PLACEHOLDER_LENGTH, ss.str());
    }

    return pattern;
}

bool MultiFileRecorder::createNewFile() {
    // Générer le nom du nouveau fichier
    std::string fileName = generateFileName(fileCount_);

    // Mettre à jour la configuration
    AudioFileWriterConfig config = writerConfig_;
    config.filePath = fileName;

    // Créer un nouveau recorder
    auto newRecorder = std::make_unique<AudioRecorder>();
    if (!newRecorder->initialize(capture_, config)) {
        return false;
    }

    // Configurer les callbacks et limites selon le mode
    switch (splitConfig_.mode) {
        case SplitMode::BY_DURATION:
            newRecorder->setDurationLimit(splitConfig_.splitDuration);
            break;

        case SplitMode::BY_SIZE:
            newRecorder->setFileSizeLimit(splitConfig_.splitSize);
            break;

        case SplitMode::BY_SILENCE:
            // Configuration spéciale pour la détection de silence
            break;

        case SplitMode::MANUAL:
            // Pas de limites automatiques
            break;
    }

    // Configurer le callback pour détecter quand diviser
    newRecorder->setRecordingCallback([this](const std::string& event) {
        if (event == "duration_limit_reached" || event == "size_limit_reached") {
            // Créer automatiquement un nouveau fichier
            splitNow();
        }
    });

    // Remplacer l'ancien recorder
    currentRecorder_ = std::move(newRecorder);

    // Ajouter à la liste des fichiers créés
    {
        std::lock_guard<std::mutex> lock(filesMutex_);
        createdFiles_.push_back(fileName);
    }

    fileCount_++;

    // Notifier le callback
    if (fileSplitCallback_) {
        fileSplitCallback_(fileName, fileCount_ - 1);
    }

    return true;
}

void MultiFileRecorder::checkSplitConditions() {
    if (!currentRecorder_ || !currentRecorder_->isRecording()) {
        return;
    }

    switch (splitConfig_.mode) {
        case SplitMode::BY_DURATION:
            // Géré par les limites du recorder
            break;

        case SplitMode::BY_SIZE:
            // Géré par les limites du recorder
            break;

        case SplitMode::BY_SILENCE:
            // Implémenter la détection de silence
            // (nécessite l'accès aux données audio)
            break;

        case SplitMode::MANUAL:
            // Rien à faire automatiquement
            break;
    }
}

bool MultiFileRecorder::detectSilence(const float* data, size_t frameCount) {
    if (!data || frameCount == 0) {
        return false;
    }

    // Calculer le niveau RMS
    float sumSquares = Constants::SILENCE_SUM_INITIAL_VALUE;
    size_t sampleCount = frameCount * writerConfig_.channelCount;

    for (size_t i = 0; i < sampleCount; ++i) {
        sumSquares += data[i] * data[i];
    }

    float rms = std::sqrt(sumSquares / sampleCount);

    // Vérifier si c'est du silence
    return rms < splitConfig_.silenceThreshold;
}

} // namespace Audio
} // namespace Nyth
