#include "NoiseManager.h"
#include "../../jsi/JSICallbackManager.h"

namespace facebook {
namespace react {

NoiseManager::NoiseManager(std::shared_ptr<JSICallbackManager> callbackManager)
    : callbackManager_(callbackManager) {
}

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

    if (aggressiveness < 0.0f || aggressiveness > 3.0f) {
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
        bool success = processAudioWithAlgorithm(input, output, frameCount, channels);

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

bool NoiseManager::processAudioStereo(const float* inputL, const float* inputR,
                                      float* outputL, float* outputR, size_t frameCount) {
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
        bool successL = processAudioWithAlgorithm(workBufferL_.data(), workBufferL_.data(), frameCount, 1);
        bool successR = processAudioWithAlgorithm(workBufferR_.data(), workBufferR_.data(), frameCount, 1);

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
    noiseReducer_.reset();

    // Initialisation selon l'algorithme
    switch (config_.algorithm) {
        case Nyth::Audio::NoiseAlgorithm::ADVANCED_SPECTRAL: {
            // Configuration pour Advanced Spectral NR
            AudioNR::AdvancedSpectralNR::Config advConfig;
            advConfig.sampleRate = config_.sampleRate;
            advConfig.fftSize = config_.fftSize;
            advConfig.hopSize = config_.hopSize;
            advConfig.aggressiveness = config_.aggressiveness;
            advConfig.enableMultiband = config_.enableMultiband;
            advConfig.preserveTransients = config_.preserveTransients;
            advConfig.reduceMusicalNoise = config_.reduceMusicalNoise;

            // Mapping des algorithmes
            switch (config_.algorithm) {
                case Nyth::Audio::NoiseAlgorithm::ADVANCED_SPECTRAL:
                    advConfig.algorithm = AudioNR::AdvancedSpectralNR::Config::Algorithm::MMSE_LSA;
                    break;
                case Nyth::Audio::NoiseAlgorithm::WIENER_FILTER:
                    advConfig.algorithm = AudioNR::AdvancedSpectralNR::Config::Algorithm::WIENER_FILTER;
                    break;
                case Nyth::Audio::NoiseAlgorithm::MULTIBAND:
                    advConfig.algorithm = AudioNR::AdvancedSpectralNR::Config::Algorithm::MULTIBAND;
                    break;
                default:
                    advConfig.algorithm = AudioNR::AdvancedSpectralNR::Config::Algorithm::SPECTRAL_SUBTRACTION;
                    break;
            }

            advancedSpectralNR_ = std::make_unique<AudioNR::AdvancedSpectralNR>(advConfig);
            break;
        }

        default: {
            // Fallback vers NoiseReducer pour les autres algorithmes
            noiseReducer_ = std::make_unique<AudioNR::NoiseReducer>(config_.sampleRate, config_.channels);
            break;
        }
    }
}

bool NoiseManager::processAudioWithAlgorithm(const float* input, float* output, size_t frameCount, int channels) {
    if (advancedSpectralNR_) {
        // Utilisation d'Advanced Spectral NR
        if (channels == 1) {
            return advancedSpectralNR_->process(input, output, frameCount);
        } else {
            // Traitement stéréo : traiter chaque canal séparément
            std::vector<float> leftInput(frameCount), rightInput(frameCount);
            std::vector<float> leftOutput(frameCount), rightOutput(frameCount);

            // Désentrelacement
            for (size_t i = 0; i < frameCount; ++i) {
                leftInput[i] = input[i * 2];
                rightInput[i] = input[i * 2 + 1];
            }

            // Traitement de chaque canal
            bool leftSuccess = advancedSpectralNR_->process(leftInput.data(), leftOutput.data(), frameCount);
            bool rightSuccess = advancedSpectralNR_->process(rightInput.data(), rightOutput.data(), frameCount);

            // Réeentrelacement
            for (size_t i = 0; i < frameCount; ++i) {
                output[i * 2] = leftOutput[i];
                output[i * 2 + 1] = rightOutput[i];
            }

            return leftSuccess && rightSuccess;
        }
    } else if (noiseReducer_) {
        // Utilisation de NoiseReducer
        if (channels == 1) {
            return noiseReducer_->processMono(input, output, frameCount);
        } else {
            // Traitement stéréo avec NoiseReducer
            std::vector<float> leftInput(frameCount), rightInput(frameCount);
            std::vector<float> leftOutput(frameCount), rightOutput(frameCount);

            // Désentrelacement
            for (size_t i = 0; i < frameCount; ++i) {
                leftInput[i] = input[i * 2];
                rightInput[i] = input[i * 2 + 1];
            }

            // Traitement stéréo
            bool success = noiseReducer_->processStereo(leftInput.data(), rightInput.data(),
                                                       leftOutput.data(), rightOutput.data(), frameCount);

            // Réeentrelacement
            for (size_t i = 0; i < frameCount; ++i) {
                output[i * 2] = leftOutput[i];
                output[i * 2 + 1] = rightOutput[i];
            }

            return success;
        }
    }

    // Fallback : passthrough
    if (input != output) {
        std::copy(input, input + frameCount * channels, output);
    }
    return true;
}

void NoiseManager::updateStatistics(const float* input, const float* output, size_t frameCount, int channels) {
    std::lock_guard<std::mutex> lock(statsMutex_);

    if (input) {
        // Calcul du niveau d'entrée
        float inputLevel = 0.0f;
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
        float outputLevel = 0.0f;
        for (size_t i = 0; i < frameCount * channels; ++i) {
            outputLevel = std::max(outputLevel, std::abs(output[i]));
        }
        currentStats_.outputLevel = outputLevel;

        // Calcul du SNR estimé (simplifié)
        if (currentStats_.inputLevel > 0.0f) {
            currentStats_.estimatedSNR = 20.0f * std::log10(currentStats_.outputLevel / currentStats_.inputLevel);
        }
    }

    // Calcul de la probabilité de parole (simplifié)
    currentStats_.speechProbability = std::min(1.0f, currentStats_.inputLevel / 0.1f);

    // Mise à jour du niveau de bruit musical (estimation simplifiée)
    currentStats_.musicalNoiseLevel = std::max(0.0f, currentStats_.inputLevel - currentStats_.outputLevel);

    // Notification du callback
    notifyStatisticsCallback();
}

void NoiseManager::notifyStatisticsCallback() {
    if (statisticsCallback_) {
        statisticsCallback_(currentStats_);
    }

    // Notification via JSICallbackManager si disponible
    if (callbackManager_) {
        // TODO: Implémenter la notification via callback manager
    }
}

bool NoiseManager::validateConfig(const Nyth::Audio::NoiseConfig& config) const {
    std::string error;
    return Nyth::Audio::NoiseConfigValidator::validate(config, error);
}

void NoiseManager::handleError(const std::string& error) {
    currentState_ = Nyth::Audio::NoiseState::ERROR;

    if (callbackManager_) {
        // TODO: Implémenter la gestion d'erreur via callback manager
    }
}

float NoiseManager::calculateRMS(const float* data, size_t size) const {
    if (size == 0) return 0.0f;

    float sum = 0.0f;
    for (size_t i = 0; i < size; ++i) {
        sum += data[i] * data[i];
    }

    return std::sqrt(sum / size);
}

} // namespace react
} // namespace facebook


