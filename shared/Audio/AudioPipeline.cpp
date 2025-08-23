#include "AudioPipeline.hpp"
#include "capture/AudioCapture.hpp"
#include "capture/AudioCaptureSIMD.hpp"
#include "noise/NoiseReducer.hpp"
#include "core/AudioEqualizer.hpp"
#include "effects/EffectChain.hpp"
#include "safety/AudioSafety.hpp"
#include "capture/AudioFileWriter.hpp"
#include "utils/AudioBuffer.hpp"

#include <chrono>
#include <cstring>
#include <algorithm>

namespace Nyth {
namespace Audio {

// ============================================================================
// AudioPipeline Implementation
// ============================================================================

AudioPipeline::AudioPipeline() = default;
AudioPipeline::~AudioPipeline() {
    if (isRunning_) {
        stop();
    }
    release();
}

bool AudioPipeline::initialize(const Config& config) {
    config_ = config;
    
    // 1. Initialiser la capture audio
    capture_ = ::Audio::capture::AudioCapture::create(config.captureConfig);
    if (!capture_) {
        return false;
    }
    
    // Configurer le callback de capture pour traiter les données
    capture_->setAudioDataCallback(
        [this](const float* data, size_t frameCount, int channels) {
            processAudioData(data, frameCount, channels);
        }
    );
    
    // 2. Initialiser l'equalizer si activé
    if (config.enableEqualizer) {
        equalizer_ = std::make_unique<::Audio::core::AudioEqualizer>();
        equalizer_->initialize(10, config.captureConfig.sampleRate);
    }
    
    // 3. Initialiser la réduction de bruit si activée
    if (config.enableNoiseReduction) {
        noiseReduction_ = std::make_unique<AudioNR::NoiseReducer>(config_.captureConfig.sampleRate, config_.captureConfig.channelCount);
        // noiseReduction_->initialize(config.captureConfig.sampleRate,
        //                            config.captureConfig.channelCount);
        // noiseReduction_->setStrength(config.noiseReductionStrength);
    }
    
    // 4. Initialiser la chaîne d'effets si activée
    if (config.enableEffects) {
        effectsChain_ = std::make_unique<AudioFX::EffectChain>();
        effectsChain_->setSampleRate(config.captureConfig.sampleRate,
                                    config.captureConfig.channelCount);
    }
    
    // 5. Initialiser le limiteur de sécurité (toujours activé par défaut)
    if (config.enableSafetyLimiter) {
        safetyLimiter_ = std::make_unique<AudioSafety::AudioSafetyEngine>(config_.captureConfig.sampleRate, config_.captureConfig.channelCount);
        // safetyLimiter_->setThreshold(config.safetyLimiterThreshold);
        // safetyLimiter_->setReleaseTime(0.050f); // 50ms release
    }
    
    // 6. Initialiser l'analyseur FFT si activé
    if (config.enableFFTAnalysis) {
        fftAnalyzer_ = std::make_unique<AudioFX::SimpleFFT>(2048);
        // fftAnalyzer_->initialize(2048); // FFT size par défaut
    }
    
    // 7. Allouer les buffers de traitement
    size_t bufferSize = config.captureConfig.bufferSizeFrames * 
                       config.captureConfig.channelCount;
    processBuffer_ = std::make_unique<AudioUtils::AudioBuffer>(config.captureConfig.channelCount, config.captureConfig.bufferSizeFrames);
    tempBuffer_ = std::make_unique<AudioUtils::AudioBuffer>(1, config.captureConfig.bufferSizeFrames);
    
    return true;
}

void AudioPipeline::release() {
    if (isRunning_) {
        stop();
    }
    
    capture_.reset();
    equalizer_.reset();
    noiseReduction_.reset();
    effectsChain_.reset();
    safetyLimiter_.reset();
    fftAnalyzer_.reset();
    recorder_.reset();
    processBuffer_.reset();
    tempBuffer_.reset();
}

bool AudioPipeline::start() {
    if (!capture_ || isRunning_) {
        return false;
    }
    
    isRunning_ = true;
    isPaused_ = false;
    return capture_->start();
}

bool AudioPipeline::stop() {
    if (!capture_ || !isRunning_) {
        return false;
    }
    
    bool result = capture_->stop();
    isRunning_ = false;
    isPaused_ = false;
    
    if (recorder_ && recorder_->isRecording()) {
        recorder_->stopRecording();
    }
    
    return result;
}

bool AudioPipeline::pause() {
    if (!capture_ || !isRunning_ || isPaused_) {
        return false;
    }
    
    isPaused_ = true;
    return capture_->pause();
}

bool AudioPipeline::resume() {
    if (!capture_ || !isRunning_ || !isPaused_) {
        return false;
    }
    
    isPaused_ = false;
    return capture_->resume();
}

void AudioPipeline::processAudioData(const float* inputData, size_t frameCount, int channels) {
    // Copier les données dans le buffer de traitement
    size_t sampleCount = frameCount * channels;
    float* workingData = processBuffer_->getChannel(0);
    std::memcpy(workingData, inputData, sampleCount * sizeof(float));
    
    // Chaîne de traitement audio
    
    // 1. Réduction de bruit
    if (config_.enableNoiseReduction && noiseReduction_) {
        applyNoiseReduction(workingData, frameCount, channels);
    }
    
    // 2. Égalisation
    if (config_.enableEqualizer && equalizer_) {
        applyEqualizer(workingData, frameCount, channels);
    }
    
    // 3. Effets
    if (config_.enableEffects && effectsChain_) {
        applyEffects(workingData, frameCount, channels);
    }
    
    // 4. Limiteur de sécurité (toujours appliqué en dernier)
    if (config_.enableSafetyLimiter && safetyLimiter_) {
        applySafetyLimiter(workingData, frameCount, channels);
    }
    
    // 5. Analyse FFT (non-destructive)
    if (config_.enableFFTAnalysis && fftAnalyzer_) {
        analyzeFFT(workingData, frameCount, channels);
    }
    
    // 6. Mise à jour des niveaux
    updateLevels(workingData, sampleCount);
    
    // 7. Enregistrement si actif
    if (recorder_ && recorder_->isRecording()) {
        // Le recorder a son propre callback, pas besoin de traiter ici
    }
    
    // 8. Callback final avec les données traitées
    if (processedDataCallback_) {
        processedDataCallback_(workingData, frameCount, channels);
    }
}

void AudioPipeline::applyNoiseReduction(float* data, size_t frameCount, int channels) {
    if (channels == 1) {
        noiseReduction_->processMono(data, data, frameCount);
    } else {
        // Pour stéréo, traiter chaque canal séparément
        std::vector<float> leftData(frameCount);
        std::vector<float> rightData(frameCount);

        // Désentrelacer
        for (size_t i = 0; i < frameCount; ++i) {
            leftData[i] = data[i * 2];
            rightData[i] = data[i * 2 + 1];
        }

        // Traiter chaque canal
        noiseReduction_->processMono(leftData.data(), leftData.data(), frameCount);
        noiseReduction_->processMono(rightData.data(), rightData.data(), frameCount);

        // Rentrelacer
        for (size_t i = 0; i < frameCount; ++i) {
            data[i * 2] = leftData[i];
            data[i * 2 + 1] = rightData[i];
        }
    }
}

void AudioPipeline::applyEqualizer(float* data, size_t frameCount, int channels) {
    // Traiter chaque canal séparément
    for (int ch = 0; ch < channels; ++ch) {
        float* channelData = data + ch;
        // equalizer_->process(channelData, frameCount, channels); // stride = channels
    }
}

void AudioPipeline::applyEffects(float* data, size_t frameCount, int channels) {
    if (channels == 1) {
        effectsChain_->processMonoLegacy(data, data, frameCount);
    } else {
        // For stereo, split the interleaved data
        size_t sampleCount = frameCount * channels;
        std::vector<float> leftData(frameCount);
        std::vector<float> rightData(frameCount);

        // De-interleave
        for (size_t i = 0; i < frameCount; ++i) {
            leftData[i] = data[i * 2];
            rightData[i] = data[i * 2 + 1];
        }

        // Process stereo
        effectsChain_->processStereoLegacy(leftData.data(), rightData.data(),
                                          leftData.data(), rightData.data(), frameCount);

        // Re-interleave
        for (size_t i = 0; i < frameCount; ++i) {
            data[i * 2] = leftData[i];
            data[i * 2 + 1] = rightData[i];
        }
    }
}

void AudioPipeline::applySafetyLimiter(float* data, size_t frameCount, int channels) {
    size_t sampleCount = frameCount * channels;

    // Utiliser AudioSafetyEngine pour la limitation
    if (channels == 1) {
        safetyLimiter_->processMono(data, frameCount);
    } else {
        // Pour stéréo, traiter chaque canal
        std::vector<float> leftData(frameCount);
        std::vector<float> rightData(frameCount);

        // Désentrelacer
        for (size_t i = 0; i < frameCount; ++i) {
            leftData[i] = data[i * 2];
            rightData[i] = data[i * 2 + 1];
        }

        // Traiter stéréo
        safetyLimiter_->processStereo(leftData.data(), rightData.data(), frameCount);

        // Rentrelacer
        for (size_t i = 0; i < frameCount; ++i) {
            data[i * 2] = leftData[i];
            data[i * 2 + 1] = rightData[i];
        }
    }

    // Vérifier le clipping avec SIMD (toujours utile pour les métriques)
    isClipping_ = SIMD::AudioAnalyzerSIMD::countClippedSamples_Optimized(
        data, sampleCount, config_.safetyLimiterThreshold) > 0;
}

void AudioPipeline::analyzeFFT(const float* data, size_t frameCount, int channels) {
    if (fftAnalysisCallback_) {
        // Moyenner les canaux pour l'analyse FFT
        float* monoData = tempBuffer_->getChannel(0);

        if (channels == 1) {
            std::memcpy(monoData, data, frameCount * sizeof(float));
        } else {
            // Convertir stéréo vers mono avec SIMD
            SIMD::AudioMixerSIMD::stereoToMono_Optimized(data, monoData, frameCount);
        }

        // Effectuer l'analyse FFT avec SimpleFFT
        std::vector<float> realOut, imagOut;
        fftAnalyzer_->forwardR2C(monoData, realOut, imagOut);

        // Calculer les magnitudes
        size_t binCount = fftAnalyzer_->getSize() / 2;
        std::vector<float> magnitudes(binCount);

        for (size_t i = 0; i < binCount; ++i) {
            magnitudes[i] = std::sqrt(realOut[i] * realOut[i] + imagOut[i] * imagOut[i]);
        }

        fftAnalysisCallback_(magnitudes.data(), binCount, config_.captureConfig.sampleRate);
    }
}

void AudioPipeline::updateLevels(const float* data, size_t sampleCount) {
    // Utiliser SIMD pour le calcul des niveaux
    float currentRMS = SIMD::AudioAnalyzerSIMD::calculateRMS_Optimized(data, sampleCount);
    float currentPeak = SIMD::AudioAnalyzerSIMD::calculatePeak_Optimized(data, sampleCount);

    currentLevel_ = currentRMS;

    // Mise à jour du peak avec decay
    float oldPeak = peakLevel_.load();
    if (currentPeak > oldPeak) {
        peakLevel_ = currentPeak;
    } else {
        // Decay de 20dB/sec
        float decay = 0.99f; // À ajuster selon le sample rate
        peakLevel_ = oldPeak * decay;
    }
}

// === Méthodes de configuration ===

void AudioPipeline::setEqualizerEnabled(bool enabled) {
    config_.enableEqualizer = enabled;
    if (enabled && !equalizer_) {
        equalizer_ = std::make_unique<::Audio::core::AudioEqualizer>();
        equalizer_->initialize(10, config_.captureConfig.sampleRate);
    }
}

void AudioPipeline::setEqualizerBand(int band, float frequency, float gain, float q) {
    if (equalizer_) {
        equalizer_->setBandGain(band, gain);
        equalizer_->setBandFrequency(band, frequency);
        equalizer_->setBandQ(band, q);
    }
}

void AudioPipeline::loadEqualizerPreset(const std::string& presetName) {
    if (equalizer_) {
        // equalizer_->loadPreset(presetName); // TODO: Need EQPreset object
    }
}

void AudioPipeline::setNoiseReductionEnabled(bool enabled) {
    config_.enableNoiseReduction = enabled;
    if (enabled && !noiseReduction_) {
        noiseReduction_ = std::make_unique<AudioNR::NoiseReducer>(config_.captureConfig.sampleRate, config_.captureConfig.channelCount);
        // noiseReduction_->initialize(config_.captureConfig.sampleRate,
        //                            config_.captureConfig.channelCount);
    }
}

void AudioPipeline::setNoiseReductionStrength(float strength) {
    config_.noiseReductionStrength = std::max(0.0f, std::min(strength, 1.0f));
    if (noiseReduction_) {
        AudioNR::NoiseReducerConfig nrConfig = noiseReduction_->getConfig();
        nrConfig.ratio = config_.noiseReductionStrength * 10.0 + 1.0; // Convertir 0-1 vers 1-11
        noiseReduction_->setConfig(nrConfig);
    }
}

void AudioPipeline::trainNoiseProfile(float durationSeconds) {
    if (noiseReduction_) {
        // noiseReduction_->startTraining(durationSeconds);
    }
}

void AudioPipeline::setSafetyLimiterEnabled(bool enabled) {
    config_.enableSafetyLimiter = enabled;
}

void AudioPipeline::setSafetyLimiterThreshold(float threshold) {
    config_.safetyLimiterThreshold = std::max(0.1f, std::min(threshold, 1.0f));
    if (safetyLimiter_) {
        // safetyLimiter_->setThreshold(config_.safetyLimiterThreshold);
    }
}

void AudioPipeline::setFFTAnalysisEnabled(bool enabled) {
    config_.enableFFTAnalysis = enabled;
    if (enabled && !fftAnalyzer_) {
        fftAnalyzer_ = std::make_unique<AudioFX::SimpleFFT>(2048);
        // fftAnalyzer_->initialize(2048);
    }
}

void AudioPipeline::setFFTSize(size_t size) {
    if (fftAnalyzer_) {
        // fftAnalyzer_->setSize(size);
    }
}

// === Callbacks ===

void AudioPipeline::setProcessedDataCallback(ProcessedDataCallback callback) {
    processedDataCallback_ = callback;
}

void AudioPipeline::setFFTAnalysisCallback(FFTAnalysisCallback callback) {
    fftAnalysisCallback_ = callback;
}

// === Monitoring ===

float AudioPipeline::getCurrentLevel() const {
    return currentLevel_.load();
}

float AudioPipeline::getPeakLevel() const {
    return peakLevel_.load();
}

bool AudioPipeline::isClipping() const {
    return isClipping_.load();
}

float AudioPipeline::getLatencyMs() const {
    if (capture_) {
        // Calculer la latence totale du pipeline
        float captureLatency = 1000.0f * config_.captureConfig.bufferSizeFrames / 
                              config_.captureConfig.sampleRate;
        
        float processingLatency = 0.0f;
        if (config_.enableNoiseReduction) processingLatency += 2.0f;
        if (config_.enableEqualizer) processingLatency += 0.5f;
        if (config_.enableEffects) processingLatency += 1.0f;
        
        return captureLatency + processingLatency;
    }
    return 0.0f;
}

// === Recording ===

bool AudioPipeline::startRecording(const std::string& filename) {
    if (!capture_ || recorder_) {
        return false;
    }
    
    recorder_ = std::make_unique<AudioRecorder>();
    
    AudioFileWriterConfig writerConfig;
    writerConfig.filePath = filename;
    writerConfig.format = AudioFileFormat::WAV;
    writerConfig.sampleRate = config_.captureConfig.sampleRate;
    writerConfig.channelCount = config_.captureConfig.channelCount;
    writerConfig.bitsPerSample = config_.captureConfig.bitsPerSample;
    
    if (recorder_->initialize(std::shared_ptr<::Audio::capture::AudioCapture>(capture_.get()), writerConfig)) {
        return recorder_->startRecording();
    }
    
    recorder_.reset();
    return false;
}

bool AudioPipeline::stopRecording() {
    if (recorder_ && recorder_->isRecording()) {
        recorder_->stopRecording();
        recorder_.reset();
        return true;
    }
    return false;
}

bool AudioPipeline::isRecording() const {
    return recorder_ && recorder_->isRecording();
}

// ============================================================================
// RealtimeAudioProcessor Implementation
// ============================================================================

RealtimeAudioProcessor::RealtimeAudioProcessor() = default;
RealtimeAudioProcessor::~RealtimeAudioProcessor() = default;

bool RealtimeAudioProcessor::initialize(const ProcessorConfig& config) {
    config_ = config;
    lastProcessTime_ = std::chrono::steady_clock::now();
    return true;
}

void RealtimeAudioProcessor::addProcessor(std::function<void(float*, size_t, int)> processor) {
    processors_.push_back(processor);
}

void RealtimeAudioProcessor::process(float* data, size_t frameCount) {
    auto startTime = std::chrono::steady_clock::now();
    
    // Appliquer tous les processeurs dans l'ordre
    for (auto& processor : processors_) {
        processor(data, frameCount, config_.channelCount);
    }
    
    auto endTime = std::chrono::steady_clock::now();
    auto processingTime = std::chrono::duration_cast<std::chrono::microseconds>(endTime - startTime);
    processingTimeUs_ = static_cast<float>(processingTime.count());
    
    // Calculer l'utilisation CPU
    float availableTimeUs = 1000000.0f * frameCount / config_.sampleRate;
    cpuUsage_ = 100.0f * processingTimeUs_ / availableTimeUs;
    
    lastProcessTime_ = endTime;
}

// ============================================================================
// AudioSessionManager Implementation
// ============================================================================

AudioSessionManager& AudioSessionManager::getInstance() {
    static AudioSessionManager instance;
    return instance;
}

bool AudioSessionManager::startSession(const SessionConfig& config) {
    if (sessionActive_) {
        return false;
    }
    
    currentSession_ = config;
    
    // Configuration spécifique à la plateforme
    #ifdef __ANDROID__
    // Configuration Android avec AAudio ou OpenSL ES
    #elif defined(__APPLE__) && TARGET_OS_IOS
    // Configuration iOS avec AVAudioSession
    #endif
    
    sessionActive_ = true;
    return true;
}

void AudioSessionManager::endSession() {
    sessionActive_ = false;
}

bool AudioSessionManager::isSessionActive() const {
    return sessionActive_.load();
}

void AudioSessionManager::handleInterruption() {
    // Gérer les interruptions (appel téléphonique, etc.)
    if (sessionActive_) {
        // Sauvegarder l'état et mettre en pause
    }
}

void AudioSessionManager::handleRouteChange() {
    // Gérer les changements de route audio (casque branché/débranché)
}

bool AudioSessionManager::hasAudioPermission() const {
    #ifdef __ANDROID__
    // Vérifier RECORD_AUDIO permission
    return true; // À implémenter avec JNI
    #elif defined(__APPLE__) && TARGET_OS_IOS
    // Vérifier AVAudioSession recordPermission
    return true; // À implémenter avec Objective-C
    #else
    return true; // Desktop assume permission
    #endif
}

void AudioSessionManager::requestAudioPermission(std::function<void(bool)> callback) {
    #ifdef __ANDROID__
    // Demander permission avec JNI
    #elif defined(__APPLE__) && TARGET_OS_IOS
    // Demander permission avec AVAudioSession
    #endif
    
    if (callback) {
        callback(true); // Pour l'instant, toujours accepté
    }
}

// ============================================================================
// AudioIntegrationUtils Implementation
// ============================================================================

void AudioIntegrationUtils::convertCaptureToEffectsFormat(const float* captureData,
                                                          float* effectsData,
                                                          size_t frameCount,
                                                          int channels) {
    // Conversion si nécessaire entre les formats
    // Pour l'instant, simple copie
    std::memcpy(effectsData, captureData, frameCount * channels * sizeof(float));
}

void AudioIntegrationUtils::syncModuleTiming(::Audio::capture::AudioCapture* capture,
                                            AudioFX::EffectChain* effects) {
    // Synchroniser les timestamps entre modules
    // À implémenter selon les besoins
}

bool AudioIntegrationUtils::areModulesCompatible(const ::Audio::capture::AudioCaptureConfig& captureConfig,
                                                const ::Audio::core::AudioEqualizer& eq) {
    // Vérifier la compatibilité des configurations
    return captureConfig.sampleRate == eq.getSampleRate();
}

void AudioIntegrationUtils::optimizeLatency(AudioPipeline* pipeline) {
    // Optimiser les tailles de buffer pour minimiser la latence
    // À implémenter selon la plateforme
}

} // namespace Audio
} // namespace Nyth
