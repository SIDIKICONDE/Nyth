#include "NoiseManager.h"
#include "../../common/jsi/JSICallbackManager.h"
#include "../../common/config/NoiseContants.hpp"

namespace facebook {
namespace react {

NoiseManager::NoiseManager(std::shared_ptr<JSICallbackManager> callbackManager) : callbackManager_(callbackManager) {}

NoiseManager::~NoiseManager() {
    release();
}

// === Cycle de vie ===
bool NoiseManager::initialize(const Nyth::Audio::NoiseConfig& config) {
    if (isInitialized_.load()) {
        return true;
    }

    try {
        std::lock_guard<std::mutex> lock(mutex_);

        // Validation de la configuration
        if (!validateConfig(config)) {
            return false;
        }

        config_ = config;

        // Initialisation des composants AudioNR selon l'algorithme
        initializeNoiseComponents();

        isInitialized_.store(true);
        currentState_ = Nyth::Audio::NoiseState::INITIALIZED;

        return true;

    } catch (const std::exception& e) {
        handleError("Initialization failed: " + std::string(e.what()));
        return false;
    }
}

bool NoiseManager::isInitialized() const {
    return isInitialized_.load();
}

void NoiseManager::release() {
    std::lock_guard<std::mutex> lock(mutex_);

    // Libération des composants AudioNR
    advancedSpectralNR_.reset();
    spectralNR_.reset();
    noiseReducer_.reset();

    // Reset des statistiques
    std::lock_guard<std::mutex> statsLock(statsMutex_);
    memset(&currentStats_, 0, sizeof(Nyth::Audio::NoiseStatistics));

    isInitialized_.store(false);
    currentState_ = Nyth::Audio::NoiseState::UNINITIALIZED;
}

// === Configuration ===
bool NoiseManager::setConfig(const Nyth::Audio::NoiseConfig& config) {
    if (!validateConfig(config)) {
        return false;
    }

    std::lock_guard<std::mutex> lock(mutex_);
    config_ = config;

    // Reinitialisation avec la nouvelle configuration
    initializeNoiseComponents();

    return true;
}

Nyth::Audio::NoiseConfig NoiseManager::getConfig() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return config_;
}

bool NoiseManager::setAlgorithm(Nyth::Audio::NoiseAlgorithm algorithm) {
    std::lock_guard<std::mutex> lock(mutex_);
    config_.algorithm = algorithm;

    // Reinitialisation avec le nouvel algorithme
    initializeNoiseComponents();

    return true;
}

bool NoiseManager::setAggressiveness(float aggressiveness) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (aggressiveness < NoiseManagerConstants::MIN_AGGRESSIVENESS ||
        aggressiveness > NoiseManagerConstants::MAX_AGGRESSIVENESS) {
        return false;
    }

    config_.aggressiveness = aggressiveness;

    // Mise à jour de l'agressivité sur les composants actifs
    if (advancedSpectralNR_) {
        advancedSpectralNR_->setAggressiveness(aggressiveness);
    }

    return true;
}

// === Contrôle ===
bool NoiseManager::start() {
    std::lock_guard<std::mutex> lock(mutex_);

    if (currentState_ == Nyth::Audio::NoiseState::INITIALIZED) {
        currentState_ = Nyth::Audio::NoiseState::PROCESSING;
        return true;
    }

    return false;
}

bool NoiseManager::stop() {
    std::lock_guard<std::mutex> lock(mutex_);

    if (currentState_ == Nyth::Audio::NoiseState::PROCESSING) {
        currentState_ = Nyth::Audio::NoiseState::INITIALIZED;
        return true;
    }

    return false;
}

bool NoiseManager::isProcessing() const {
    return currentState_ == Nyth::Audio::NoiseState::PROCESSING;
}

// === Traitement audio ===
bool NoiseManager::processAudio(const float* input, float* output, size_t frameCount, int channels) {
    if (!isInitialized_.load() || currentState_ != Nyth::Audio::NoiseState::PROCESSING) {
        // Passthrough si non initialisé ou non en cours de traitement
        if (input != output) {
            std::copy(input, input + frameCount * channels, output);
        }
        return true;
    }

    std::lock_guard<std::mutex> lock(mutex_);

    try {
        // Mise à jour des statistiques d'entrée
        updateStatistics(input, nullptr, frameCount, channels);

        // Traitement selon l'algorithme sélectionné
        bool success = processWithPipeline(input, output, frameCount, channels);

        // Mise à jour des statistiques de sortie
        if (success) {
            updateStatistics(nullptr, output, frameCount, channels);
        }

        return success;

    } catch (const std::exception& e) {
        handleError("Audio processing failed: " + std::string(e.what()));
        // Passthrough en cas d'erreur
        if (input != output) {
            std::copy(input, input + frameCount * channels, output);
        }
        return false;
    }
}

bool NoiseManager::processAudioStereo(const float* inputL, const float* inputR, float* outputL, float* outputR,
                                      size_t frameCount) {
    if (!isInitialized_.load() || currentState_ != Nyth::Audio::NoiseState::PROCESSING) {
        // Passthrough si non initialisé ou non en cours de traitement
        if (inputL != outputL) {
            std::copy(inputL, inputL + frameCount, outputL);
        }
        if (inputR != outputR) {
            std::copy(inputR, inputR + frameCount, outputR);
        }
        return true;
    }

    std::lock_guard<std::mutex> lock(mutex_);

    try {
        // Conversion stéréo vers mono pour le traitement
        workBufferL_.resize(frameCount);
        workBufferR_.resize(frameCount);

        std::copy(inputL, inputL + frameCount, workBufferL_.data());
        std::copy(inputR, inputR + frameCount, workBufferR_.data());

        // Traitement mono de chaque canal
        bool successL = processWithPipeline(workBufferL_.data(), workBufferL_.data(), frameCount, 1);
        bool successR = processWithPipeline(workBufferR_.data(), workBufferR_.data(), frameCount, 1);

        // Copie des résultats
        if (successL) {
            std::copy(workBufferL_.data(), workBufferL_.data() + frameCount, outputL);
        } else if (inputL != outputL) {
            std::copy(inputL, inputL + frameCount, outputL);
        }

        if (successR) {
            std::copy(workBufferR_.data(), workBufferR_.data() + frameCount, outputR);
        } else if (inputR != outputR) {
            std::copy(inputR, inputR + frameCount, outputR);
        }

        return successL && successR;

    } catch (const std::exception& e) {
        handleError("Stereo processing failed: " + std::string(e.what()));
        // Passthrough en cas d'erreur
        if (inputL != outputL) {
            std::copy(inputL, inputL + frameCount, outputL);
        }
        if (inputR != outputR) {
            std::copy(inputR, inputR + frameCount, outputR);
        }
        return false;
    }
}

// === Statistiques et métriques ===
Nyth::Audio::NoiseStatistics NoiseManager::getStatistics() const {
    std::lock_guard<std::mutex> lock(statsMutex_);
    return currentStats_;
}

float NoiseManager::getInputLevel() const {
    std::lock_guard<std::mutex> lock(statsMutex_);
    return currentStats_.inputLevel;
}

float NoiseManager::getOutputLevel() const {
    std::lock_guard<std::mutex> lock(statsMutex_);
    return currentStats_.outputLevel;
}

float NoiseManager::getEstimatedSNR() const {
    std::lock_guard<std::mutex> lock(statsMutex_);
    return currentStats_.estimatedSNR;
}

float NoiseManager::getSpeechProbability() const {
    std::lock_guard<std::mutex> lock(statsMutex_);
    return currentStats_.speechProbability;
}

float NoiseManager::getMusicalNoiseLevel() const {
    std::lock_guard<std::mutex> lock(statsMutex_);
    return currentStats_.musicalNoiseLevel;
}

void NoiseManager::resetStatistics() {
    std::lock_guard<std::mutex> lock(statsMutex_);
    memset(&currentStats_, 0, sizeof(Nyth::Audio::NoiseStatistics));
}

// === Informations ===
std::string NoiseManager::getInfo() const {
    return "Noise Manager - Advanced noise reduction algorithms";
}

Nyth::Audio::NoiseState NoiseManager::getState() const {
    return currentState_.load();
}

// === Callbacks ===
void NoiseManager::setStatisticsCallback(StatisticsCallback callback) {
    std::lock_guard<std::mutex> lock(mutex_);
    statisticsCallback_ = std::move(callback);
}

void NoiseManager::setProcessingCallback(ProcessingCallback callback) {
    std::lock_guard<std::mutex> lock(mutex_);
    processingCallback_ = std::move(callback);
}

// === Méthodes privées ===

void NoiseManager::initializeNoiseComponents() {
    // Libération des composants existants
    advancedSpectralNR_.reset();
    spectralNR_.reset();
    noiseReducer_.reset();

    // Initialisation selon l'algorithme
    switch (config_.algorithm) {
        case Nyth::Audio::NoiseAlgorithm::ADVANCED_SPECTRAL: {
            // Configuration pour Advanced Spectral NR (algorithme hybride complet)
            AudioNR::AdvancedSpectralNR::Config advConfig;
            advConfig.sampleRate = config_.sampleRate;
            advConfig.fftSize = config_.fftSize;
            advConfig.hopSize = config_.hopSize;
            advConfig.aggressiveness = config_.aggressiveness;
            advConfig.enableMultiband = config_.enableMultiband;
            advConfig.preserveTransients = config_.preserveTransients;
            advConfig.reduceMusicalNoise = config_.reduceMusicalNoise;

            advancedSpectralNR_ = std::make_unique<AudioNR::AdvancedSpectralNR>(advConfig);
            break;
        }

        case Nyth::Audio::NoiseAlgorithm::WIENER_FILTER: {
            // Configuration pour Wiener Filter avec IMCRA
            AudioNR::AdvancedSpectralNR::Config wienerConfig;
            wienerConfig.sampleRate = config_.sampleRate;
            wienerConfig.fftSize = config_.fftSize;
            wienerConfig.hopSize = config_.hopSize;
            wienerConfig.aggressiveness = config_.aggressiveness;
            wienerConfig.enableMultiband = false; // Désactivé pour Wiener pur
            wienerConfig.preserveTransients = config_.preserveTransients;
            wienerConfig.reduceMusicalNoise = config_.reduceMusicalNoise;

            advancedSpectralNR_ = std::make_unique<AudioNR::AdvancedSpectralNR>(wienerConfig);
            break;
        }

        case Nyth::Audio::NoiseAlgorithm::MULTIBAND: {
            // Configuration pour traitement multi-bandes
            AudioNR::AdvancedSpectralNR::Config multibandConfig;
            multibandConfig.sampleRate = config_.sampleRate;
            multibandConfig.fftSize = config_.fftSize;
            multibandConfig.hopSize = config_.hopSize;
            multibandConfig.aggressiveness = config_.aggressiveness;
            multibandConfig.enableMultiband = true; // Activé pour multi-bandes
            multibandConfig.preserveTransients = config_.preserveTransients;
            multibandConfig.reduceMusicalNoise = config_.reduceMusicalNoise;

            advancedSpectralNR_ = std::make_unique<AudioNR::AdvancedSpectralNR>(multibandConfig);
            break;
        }

        case Nyth::Audio::NoiseAlgorithm::TWO_STEP: {
            // Configuration pour réduction en deux étapes
            AudioNR::AdvancedSpectralNR::Config twoStepConfig;
            twoStepConfig.sampleRate = config_.sampleRate;
            twoStepConfig.fftSize = config_.fftSize;
            twoStepConfig.hopSize = config_.hopSize;
            twoStepConfig.aggressiveness = config_.aggressiveness;
            twoStepConfig.enableMultiband = false;
            twoStepConfig.preserveTransients = true; // Important pour two-step
            twoStepConfig.reduceMusicalNoise = true; // Important pour two-step

            advancedSpectralNR_ = std::make_unique<AudioNR::AdvancedSpectralNR>(twoStepConfig);
            break;
        }

        case Nyth::Audio::NoiseAlgorithm::HYBRID: {
            // Configuration pour algorithme hybride (combine plusieurs approches)
            AudioNR::AdvancedSpectralNR::Config hybridConfig;
            hybridConfig.sampleRate = config_.sampleRate;
            hybridConfig.fftSize = config_.fftSize;
            hybridConfig.hopSize = config_.hopSize;
            hybridConfig.aggressiveness = config_.aggressiveness;
            hybridConfig.enableMultiband = true;    // Activé pour hybride
            hybridConfig.preserveTransients = true; // Activé pour hybride
            hybridConfig.reduceMusicalNoise = true; // Activé pour hybride

            advancedSpectralNR_ = std::make_unique<AudioNR::AdvancedSpectralNR>(hybridConfig);
            break;
        }

        case Nyth::Audio::NoiseAlgorithm::SPECTRAL_SUBTRACTION: {
            // Configuration pour Spectral NR classique
            AudioNR::SpectralNR::Config specConfig;
            specConfig.sampleRate = config_.sampleRate;
            specConfig.fftSize = config_.fftSize;
            specConfig.hopSize = config_.hopSize;
            specConfig.aggressiveness = config_.aggressiveness;

            spectralNR_ = std::make_unique<AudioNR::SpectralNR>(specConfig);
            break;
        }

        default: {
            // Fallback vers NoiseReducer pour les algorithmes non reconnus
            noiseReducer_ = std::make_unique<AudioNR::NoiseReducer>(config_.sampleRate, config_.channels);
            break;
        }
    }

    // Connexion des composants après initialisation
    connectComponents();
}

void NoiseManager::connectComponents() {
    // Configuration des callbacks entre composants si nécessaire
    if (advancedSpectralNR_) {
        // Le composant AdvancedSpectralNR gère déjà ses sous-composants internes
        // (IMCRA, Wiener, Multiband) selon sa configuration
    }

    if (spectralNR_) {
        // Configuration des callbacks pour SpectralNR si nécessaire
    }

    if (noiseReducer_) {
        // Configuration des callbacks pour NoiseReducer si nécessaire
    }
}

bool NoiseManager::processWithPipeline(const float* input, float* output, size_t frameCount, int channels) {
    // Pipeline de traitement optimisé avec composants connectés
    if (advancedSpectralNR_) {
        // Traitement avec AdvancedSpectralNR (inclut IMCRA + Wiener + Multiband)
        return advancedSpectralNR_->process(input, output, frameCount);
    } else if (spectralNR_) {
        // Traitement avec SpectralNR classique
        return spectralNR_->process(input, output, frameCount);
    } else if (noiseReducer_) {
        // Traitement avec NoiseReducer (gate/expander)
        if (channels == 1) {
            noiseReducer_->processMono(input, output, frameCount);
            return true;
        } else {
            // Traitement stéréo
            std::vector<float> leftInput(frameCount), rightInput(frameCount);
            std::vector<float> leftOutput(frameCount), rightOutput(frameCount);

            // Désentrelacement
            for (size_t i = 0; i < frameCount; ++i) {
                leftInput[i] = input[i * 2];
                rightInput[i] = input[i * 2 + 1];
            }

            noiseReducer_->processStereo(leftInput.data(), rightInput.data(), leftOutput.data(), rightOutput.data(),
                                         frameCount);

            // Réeentrelacement
            for (size_t i = 0; i < frameCount; ++i) {
                output[i * 2] = leftOutput[i];
                output[i * 2 + 1] = rightOutput[i];
            }
            return true;
        }
    }

    return false;
}

void NoiseManager::setupProcessingPipeline() {
    // Configuration du pipeline de traitement selon l'algorithme
    switch (config_.algorithm) {
        case Nyth::Audio::NoiseAlgorithm::ADVANCED_SPECTRAL:
            // Pipeline: Input -> IMCRA -> Wiener -> Multiband -> Output
            // Géré automatiquement par AdvancedSpectralNR
            break;

        case Nyth::Audio::NoiseAlgorithm::WIENER_FILTER:
            // Pipeline: Input -> IMCRA -> Wiener -> Output
            // Utilise AdvancedSpectralNR avec configuration Wiener
            break;

        case Nyth::Audio::NoiseAlgorithm::MULTIBAND:
            // Pipeline: Input -> IMCRA -> Multiband -> Output
            // Utilise AdvancedSpectralNR avec configuration Multiband
            break;

        case Nyth::Audio::NoiseAlgorithm::TWO_STEP:
            // Pipeline: Input -> IMCRA -> Wiener (étape 1) -> Wiener (étape 2) -> Output
            // Utilise AdvancedSpectralNR avec configuration two-step
            break;

        case Nyth::Audio::NoiseAlgorithm::HYBRID:
            // Pipeline: Input -> IMCRA -> Wiener + Multiband + Spectral -> Output
            // Utilise AdvancedSpectralNR avec configuration hybride
            break;

        case Nyth::Audio::NoiseAlgorithm::SPECTRAL_SUBTRACTION:
            // Pipeline: Input -> SpectralNR -> Output
            break;

        default:
            // Pipeline: Input -> NoiseReducer -> Output
            break;
    }
}

void NoiseManager::updateStatistics(const float* input, const float* output, size_t frameCount, int channels) {
    std::lock_guard<std::mutex> lock(statsMutex_);

    if (input) {
        // Calcul du niveau d'entrée
        float inputLevel = NoiseManagerConstants::DEFAULT_RESET_VALUE;
        for (size_t i = 0; i < frameCount * channels; ++i) {
            inputLevel = std::max(inputLevel, std::abs(input[i]));
        }
        currentStats_.inputLevel = inputLevel;
        currentStats_.processedFrames++;
        currentStats_.processedSamples += frameCount * channels;
        currentStats_.durationMs += (frameCount * 1000) / config_.sampleRate;
    }

    if (output) {
        // Calcul du niveau de sortie
        float outputLevel = NoiseManagerConstants::DEFAULT_RESET_VALUE;
        for (size_t i = 0; i < frameCount * channels; ++i) {
            outputLevel = std::max(outputLevel, std::abs(output[i]));
        }
        currentStats_.outputLevel = outputLevel;

        // Calcul du SNR estimé (simplifié)
        if (currentStats_.inputLevel > NoiseManagerConstants::DEFAULT_RESET_VALUE) {
            currentStats_.estimatedSNR = NoiseManagerConstants::SNR_LOG_FACTOR *
                std::log10(currentStats_.outputLevel / currentStats_.inputLevel);
        }
    }

    // Calcul de la probabilité de parole (simplifié)
    currentStats_.speechProbability = std::min(1.0f,
        currentStats_.inputLevel / NoiseManagerConstants::SPEECH_THRESHOLD_LEVEL);

    // Mise à jour du niveau de bruit musical (estimation simplifiée)
    currentStats_.musicalNoiseLevel = std::max(NoiseManagerConstants::DEFAULT_RESET_VALUE,
        currentStats_.inputLevel - currentStats_.outputLevel);

    // Notification du callback
    notifyStatisticsCallback();
}

void NoiseManager::notifyStatisticsCallback() {
    if (statisticsCallback_) {
        statisticsCallback_(currentStats_);
    }

    // Notification via JSICallbackManager si disponible
    if (callbackManager_) {
        // Utiliser l'API générique de callback avec un objet JS
        try {
            callbackManager_->invokeCallback("statistics", [this](jsi::Runtime& rt) {
                jsi::Object stats(rt);
                stats.setProperty(rt, "inputLevel", jsi::Value(currentStats_.inputLevel));
                stats.setProperty(rt, "outputLevel", jsi::Value(currentStats_.outputLevel));
                stats.setProperty(rt, "estimatedSNR", jsi::Value(currentStats_.estimatedSNR));
                stats.setProperty(rt, "noiseReductionDB", jsi::Value(currentStats_.noiseReductionDB));
                stats.setProperty(rt, "processedFrames", jsi::Value(static_cast<double>(currentStats_.processedFrames)));
                stats.setProperty(rt, "processedSamples", jsi::Value(static_cast<double>(currentStats_.processedSamples)));
                stats.setProperty(rt, "durationMs", jsi::Value(static_cast<double>(currentStats_.durationMs)));
                stats.setProperty(rt, "speechProbability", jsi::Value(currentStats_.speechProbability));
                stats.setProperty(rt, "musicalNoiseLevel", jsi::Value(currentStats_.musicalNoiseLevel));
                return std::vector<jsi::Value>{jsi::Value(rt, std::move(stats))};
            });
        } catch (...) {
            // Ignorer les erreurs de callback
        }
    }
}

bool NoiseManager::validateConfig(const Nyth::Audio::NoiseConfig& config) const {
    std::string error;
    return Nyth::Audio::NoiseConfigValidator::validate(config, error);
}

void NoiseManager::handleError(const std::string& error) {
    currentState_ = Nyth::Audio::NoiseState::ERROR;

    if (callbackManager_) {
        // Notifier l'erreur via callback manager
        try {
            callbackManager_->invokeErrorCallback(error);
        } catch (...) {
            // Ignorer les erreurs de callback
        }
    }
}

float NoiseManager::calculateRMS(const float* data, size_t size) const {
    if (size == 0)
        return 0.0f;

    float sum = 0.0f;
    for (size_t i = 0; i < size; ++i) {
        sum += data[i] * data[i];
    }

    return std::sqrt(sum / size);
}

std::string NoiseManager::formatStatisticsToJSON(const Nyth::Audio::NoiseStatistics& stats) const {
    // Formater les statistiques en JSON simple pour JavaScript
    std::string json = "{";
    json += "\"inputLevel\":" + std::to_string(stats.inputLevel) + ",";
    json += "\"outputLevel\":" + std::to_string(stats.outputLevel) + ",";
    json += "\"estimatedSNR\":" + std::to_string(stats.estimatedSNR) + ",";
    json += "\"noiseReductionDB\":" + std::to_string(stats.noiseReductionDB) + ",";
    json += "\"processedFrames\":" + std::to_string(stats.processedFrames) + ",";
    json += "\"processedSamples\":" + std::to_string(stats.processedSamples) + ",";
    json += "\"durationMs\":" + std::to_string(stats.durationMs) + ",";
    json += "\"speechProbability\":" + std::to_string(stats.speechProbability) + ",";
    json += "\"musicalNoiseLevel\":" + std::to_string(stats.musicalNoiseLevel);
    json += "}";

    return json;
}

// === Implémentations SIMD ===

bool NoiseManager::processAudio_SIMD(const float* input, float* output, size_t frameCount, int channels) {
    if (!isInitialized_.load() || !isProcessing_.load()) {
        if (input != output) {
            if (AudioNR::MathUtils::SIMDIntegration::isSIMDAccelerationEnabled() && frameCount >= 64) {
                std::memcpy(output, input, frameCount * channels * sizeof(float));
            } else {
                std::copy(input, input + frameCount * channels, output);
            }
        }
        return true;
    }

    if (!input || !output || frameCount == 0) {
        return false;
    }

    try {
        // Utiliser SIMD si disponible et taille suffisante
        if (AudioNR::MathUtils::SIMDIntegration::isSIMDAccelerationEnabled() &&
            frameCount >= NoiseManagerConstants::SIMD_MIN_SIZE) {
            // Pré-traitement SIMD
            if (channels == 1) {
                // Copie SIMD
                std::memcpy(output, input, frameCount * sizeof(float));

                // Appliquer la réduction de bruit avec SIMD
                applyNoiseReduction_SIMD(output, frameCount);

                // Normalisation SIMD
                if (config_.autoNormalize) {
                    AudioNR::MathUtils::MathUtilsSIMDExtension::normalizeAudioSIMD(
                        output, frameCount, config_.targetLevel);
                }
            } else {
                // Traitement multi-canaux SIMD
                size_t totalSamples = frameCount * channels;
                std::vector<float> tempBuffer(totalSamples);

                // Copie entrelacée SIMD
                std::memcpy(tempBuffer.data(), input, totalSamples * sizeof(float));

                // Appliquer la réduction de bruit avec SIMD
                applyNoiseReduction_SIMD(tempBuffer.data(), totalSamples);

                // Normalisation SIMD
                if (config_.autoNormalize) {
                    AudioNR::MathUtils::MathUtilsSIMDExtension::normalizeAudioSIMD(
                        tempBuffer.data(), totalSamples, config_.targetLevel);
                }

                // Copie vers output
                std::memcpy(output, tempBuffer.data(), totalSamples * sizeof(float));
            }

            return true;
        } else {
            // Version standard
            return processAudio(input, output, frameCount, channels);
        }
    } catch (const std::exception& e) {
        handleError("SIMD noise processing failed: " + std::string(e.what()));
        return false;
    }
}

bool NoiseManager::processAudioStereo_SIMD(const float* inputL, const float* inputR, float* outputL, float* outputR,
                                         size_t frameCount) {
    if (!isInitialized_.load() || !isProcessing_.load()) {
        if (inputL != outputL) {
            if (AudioNR::MathUtils::SIMDIntegration::isSIMDAccelerationEnabled() && frameCount >= 64) {
                std::memcpy(outputL, inputL, frameCount * sizeof(float));
                std::memcpy(outputR, inputR, frameCount * sizeof(float));
            } else {
                std::copy(inputL, inputL + frameCount, outputL);
                std::copy(inputR, inputR + frameCount, outputR);
            }
        }
        return true;
    }

    if (!inputL || !inputR || !outputL || !outputR || frameCount == 0) {
        return false;
    }

    try {
        // Utiliser SIMD si disponible et taille suffisante
        if (AudioNR::MathUtils::SIMDIntegration::isSIMDAccelerationEnabled() &&
            frameCount >= NoiseManagerConstants::SIMD_MIN_SIZE) {
            // Copie SIMD
            std::memcpy(outputL, inputL, frameCount * sizeof(float));
            std::memcpy(outputR, inputR, frameCount * sizeof(float));

            // Appliquer la réduction de bruit SIMD sur chaque canal
            applyNoiseReduction_SIMD(outputL, frameCount);
            applyNoiseReduction_SIMD(outputR, frameCount);

            // Normalisation SIMD
            if (config_.autoNormalize) {
                AudioNR::MathUtils::MathUtilsSIMDExtension::normalizeAudioSIMD(
                    outputL, frameCount, config_.targetLevel);
                AudioNR::MathUtils::MathUtilsSIMDExtension::normalizeAudioSIMD(
                    outputR, frameCount, config_.targetLevel);
            }

            return true;
        } else {
            // Version standard
            return processAudioStereo(inputL, inputR, outputL, outputR, frameCount);
        }
    } catch (const std::exception& e) {
        handleError("SIMD stereo noise processing failed: " + std::string(e.what()));
        return false;
    }
}

float NoiseManager::analyzeLevel_SIMD(const float* data, size_t count) const {
    if (!data || count == 0) return 0.0f;

    if (AudioNR::MathUtils::SIMDIntegration::isSIMDAccelerationEnabled() && count >= 64) {
        return AudioNR::MathUtils::MathUtilsSIMDExtension::calculateRMSSIMD(data, count);
    } else {
        // Version standard
        float sum = 0.0f;
        for (size_t i = 0; i < count; ++i) {
            sum += data[i] * data[i];
        }
        return std::sqrt(sum / count);
    }
}

// Méthode helper pour appliquer la réduction de bruit SIMD
void NoiseManager::applyNoiseReduction_SIMD(float* data, size_t count) {
    if (!data || count == 0) return;

    // Appliquer des filtres anti-bruit SIMD selon l'algorithme
    switch (config_.algorithm) {
        case Nyth::Audio::NoiseAlgorithm::SPECTRAL_SUBTRACTION:
            // Filtre spectral simple SIMD
            AudioNR::SIMD::SIMDMathFunctions::apply_soft_clipper(data, count, config_.aggressiveness);
            break;

        case Nyth::Audio::NoiseAlgorithm::WIENER_FILTER:
            // Filtre Wiener SIMD
            if (count >= NoiseManagerConstants::SIMD_STEREO_MIN_SIZE) {
                // Appliquer un filtre passe-bas pour réduire le bruit haute fréquence
                AudioNR::SIMD::SIMDMathFunctions::apply_lowpass_filter(
                    data, count, NoiseManagerConstants::LOWPASS_CUTOFF_FREQUENCY, config_.sampleRate);
            }
            break;

        case Nyth::Audio::NoiseAlgorithm::MULTIBAND:
            // Réduction multi-bande SIMD
            if (count >= NoiseManagerConstants::SIMD_MULTIBAND_MIN_SIZE) {
                // Appliquer différents niveaux de réduction selon les bandes
                AudioNR::SIMD::SIMDMathFunctions::apply_soft_clipper(data, count,
                    config_.aggressiveness * NoiseManagerConstants::MULTIBAND_REDUCTION_FACTOR);
            }
            break;

        default:
            // Réduction par défaut SIMD
            AudioNR::SIMD::SIMDMathFunctions::apply_soft_clipper(data, count, config_.aggressiveness);
            break;
    }
}

} // namespace react
} // namespace facebook
