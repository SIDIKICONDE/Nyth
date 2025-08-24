#include "EffectManager.h"
#include "../components/Compressor.hpp"
#include "../components/Delay.hpp"
#include "../components/EffectChain.hpp"
#include "../config/EffectsLimits.h"

namespace facebook {
namespace react {

EffectManager::EffectManager(std::shared_ptr<JSICallbackManager> callbackManager) : callbackManager_(callbackManager) {}

EffectManager::~EffectManager() {
    release();
}

// === Cycle de vie ===
bool EffectManager::initialize(const Nyth::Audio::EffectsConfig& config) {
    if (isInitialized_.load()) {
        return true;
    }

    try {
        config_ = config;

        // Initialiser la chaîne d'effets
        effectChain_.setSampleRate(config.sampleRate, config.channels);
        effectChain_.setEnabled(true);

        isInitialized_.store(true);
        return true;

    } catch (const std::exception& e) {
        return false;
    }
}

bool EffectManager::isInitialized() const {
    return isInitialized_.load();
}

void EffectManager::release() {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    // Libérer tous les effets
    activeEffects_.clear();
    nextEffectId_.store(1);

    isInitialized_.store(false);
    bypassAll_.store(false);
}

// === Gestion des effets ===
int EffectManager::createEffect(EffectType type) {
    if (!isInitialized_.load()) {
        return -1;
    }

    if (!validateEffectType(type)) {
        return -1;
    }

    std::lock_guard<std::mutex> lock(effectsMutex_);

    try {
        auto effect = createEffectByType(type);
        if (!effect) {
            return -1;
        }

        int effectId = nextEffectId_.fetch_add(1);
        activeEffects_[effectId] = std::move(effect);

        return effectId;

    } catch (const std::exception& e) {
        return -1;
    }
}

bool EffectManager::destroyEffect(int effectId) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    auto it = activeEffects_.find(effectId);
    if (it != activeEffects_.end()) {
        activeEffects_.erase(it);
        return true;
    }

    return false;
}

bool EffectManager::hasEffect(int effectId) const {
    std::lock_guard<std::mutex> lock(effectsMutex_);
    return activeEffects_.find(effectId) != activeEffects_.end();
}

std::vector<int> EffectManager::getActiveEffects() const {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    std::vector<int> effectIds;
    effectIds.reserve(activeEffects_.size());

    for (const auto& pair : activeEffects_) {
        effectIds.push_back(pair.first);
    }

    return effectIds;
}

// === Configuration des effets ===
bool EffectManager::setEffectConfig(jsi::Runtime& rt, int effectId, const jsi::Object& config) {
    // Cette méthode nécessiterait une implémentation plus complexe
    // pour parser la configuration JSI et l'appliquer à l'effet spécifique
    // Pour l'instant, on retourne false pour indiquer non implémenté
    return false;
}

jsi::Object EffectManager::getEffectConfig(jsi::Runtime& rt, int effectId) const {
    // Cette méthode nécessiterait une implémentation pour récupérer
    // la configuration de l'effet spécifique et la convertir en JSI
    // Pour l'instant, on retourne un objet vide
    return jsi::Object(rt);
}

bool EffectManager::enableEffect(int effectId, bool enabled) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    auto it = activeEffects_.find(effectId);
    if (it != activeEffects_.end()) {
        // TODO: Implémenter la méthode enable/disable sur l'effet
        return true;
    }

    return false;
}

bool EffectManager::isEffectEnabled(int effectId) const {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    auto it = activeEffects_.find(effectId);
    if (it != activeEffects_.end()) {
        // TODO: Implémenter la méthode isEnabled sur l'effet
        return true;
    }

    return false;
}

// === Contrôle global ===
bool EffectManager::setBypassAll(bool bypass) {
    bypassAll_.store(bypass);
    return true;
}

bool EffectManager::isBypassAll() const {
    return bypassAll_.load();
}

bool EffectManager::setMasterLevels(float input, float output) {
    masterInputLevel_.store(input);
    masterOutputLevel_.store(output);
    return true;
}

void EffectManager::getMasterLevels(float& input, float& output) const {
    input = masterInputLevel_.load();
    output = masterOutputLevel_.load();
}

// === Traitement audio ===
bool EffectManager::processAudio(const float* input, float* output, size_t frameCount, int channels) {
    if (!isInitialized_.load() || bypassAll_.load()) {
        if (input != output) {
            std::copy(input, input + frameCount * channels, output);
        }
        return true;
    }

    std::lock_guard<std::mutex> lock(effectsMutex_);

    if (activeEffects_.empty()) {
        if (input != output) {
            std::copy(input, input + frameCount * channels, output);
        }
        return true;
    }

    try {
        // Appliquer les niveaux maître d'entrée
        float inputLevel = masterInputLevel_.load();
        if (inputLevel != 1.0f) {
            // TODO: Appliquer le gain d'entrée si nécessaire
        }

        // Traiter avec la chaîne d'effets
        if (channels == 1) {
            // Mono
            std::vector<float> inputVec(input, input + frameCount);
            std::vector<float> outputVec(frameCount);

            effectChain_.processMono(inputVec, outputVec);

            if (output) {
                std::copy(outputVec.begin(), outputVec.end(), output);
            }
        } else if (channels == 2) {
            // Stereo - utiliser les méthodes stéréo
            std::vector<float> inputVecL(input, input + frameCount);
            std::vector<float> inputVecR(input + frameCount, input + 2 * frameCount);
            std::vector<float> outputVecL(frameCount);
            std::vector<float> outputVecR(frameCount);

            effectChain_.processStereo(inputVecL, inputVecR, outputVecL, outputVecR);

            if (output) {
                std::copy(outputVecL.begin(), outputVecL.end(), output);
                std::copy(outputVecR.begin(), outputVecR.end(), output + frameCount);
            }
        }

        // Appliquer les niveaux maître de sortie
        float outputLevel = masterOutputLevel_.load();
        if (outputLevel != 1.0f && output) {
            // TODO: Appliquer le gain de sortie si nécessaire
        }

        updateMetrics();
        return true;

    } catch (const std::exception& e) {
        return false;
    }
}

bool EffectManager::processAudioStereo(const float* inputL, const float* inputR, float* outputL, float* outputR,
                                       size_t frameCount) {
    if (!isInitialized_.load() || bypassAll_.load()) {
        if (inputL != outputL) {
            std::copy(inputL, inputL + frameCount, outputL);
        }
        if (inputR != outputR) {
            std::copy(inputR, inputR + frameCount, outputR);
        }
        return true;
    }

    std::lock_guard<std::mutex> lock(effectsMutex_);

    if (activeEffects_.empty()) {
        if (inputL != outputL) {
            std::copy(inputL, inputL + frameCount, outputL);
        }
        if (inputR != outputR) {
            std::copy(inputR, inputR + frameCount, outputR);
        }
        return true;
    }

    try {
        // Appliquer les niveaux maître d'entrée
        float inputLevel = masterInputLevel_.load();
        if (inputLevel != 1.0f) {
            // TODO: Appliquer le gain d'entrée si nécessaire
        }

        // Traiter avec la chaîne d'effets
        std::vector<float> inputVecL(inputL, inputL + frameCount);
        std::vector<float> inputVecR(inputR, inputR + frameCount);
        std::vector<float> outputVecL(frameCount);
        std::vector<float> outputVecR(frameCount);

        effectChain_.processStereo(inputVecL, inputVecR, outputVecL, outputVecR);

        if (outputL) {
            std::copy(outputVecL.begin(), outputVecL.end(), outputL);
        }
        if (outputR) {
            std::copy(outputVecR.begin(), outputVecR.end(), outputR);
        }

        // Appliquer les niveaux maître de sortie
        float outputLevel = masterOutputLevel_.load();
        if (outputLevel != 1.0f) {
            // TODO: Appliquer le gain de sortie si nécessaire
        }

        updateMetrics();
        return true;

    } catch (const std::exception& e) {
        return false;
    }
}

// === Métriques et statistiques ===
EffectManager::ProcessingMetrics EffectManager::getMetrics() const {
    std::lock_guard<std::mutex> lock(metricsMutex_);
    return currentMetrics_;
}

// === Informations ===
std::string EffectManager::getInfo() const {
    return "Audio Effects Manager - Multi-effect processing";
}

size_t EffectManager::getMaxEffects() const {
    return Nyth::Audio::Effects::MAX_ACTIVE_EFFECTS;
}

uint32_t EffectManager::getLatency() const {
    // TODO: Calculer la latence totale de tous les effets actifs
    return 0;
}

// === Callbacks ===
void EffectManager::setProcessingCallback(ProcessingCallback callback) {
    processingCallback_ = std::move(callback);
}

void EffectManager::setEffectCallback(EffectCallback callback) {
    effectCallback_ = std::move(callback);
}

// === Accès aux effets individuels ===
AudioFX::IAudioEffect* EffectManager::getEffect(int effectId) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    auto it = activeEffects_.find(effectId);
    if (it != activeEffects_.end()) {
        return it->second.get();
    }

    return nullptr;
}

EffectType EffectManager::getEffectType(int effectId) const {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    auto it = activeEffects_.find(effectId);
    if (it != activeEffects_.end()) {
        // Déterminer le type par dynamic_cast
        if (dynamic_cast<AudioFX::CompressorEffect*>(it->second.get())) {
            return EffectType::COMPRESSOR;
        } else if (dynamic_cast<AudioFX::DelayEffect*>(it->second.get())) {
            return EffectType::DELAY;
        } else {
            return EffectType::REVERB; // Par défaut pour les autres effets
        }
    }

    return EffectType::UNKNOWN;
}

EffectState EffectManager::getEffectState(int effectId) const {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    auto it = activeEffects_.find(effectId);
    if (it != activeEffects_.end()) {
        if (it->second && it->second->isEnabled()) {
            return EffectState::PROCESSING;
        } else {
            return EffectState::BYPASSED;
        }
    }

    return EffectState::UNKNOWN;
}

uint32_t EffectManager::getEffectLatency(int effectId) const {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    auto it = activeEffects_.find(effectId);
    if (it != activeEffects_.end()) {
        // Estimation de la latence basée sur le type d'effet
        auto effectType = getEffectType(effectId);
        switch (effectType) {
            case EffectType::COMPRESSOR:
                return 1; // Très faible latence
            case EffectType::DELAY:
                return 5; // Latence due au buffer de delay
            case EffectType::REVERB:
                return 10; // Latence due aux algorithmes de réverbération
            default:
                return 0;
        }
    }

    return 0;
}

// === Conversion string ↔ enum ===
std::string EffectManager::effectTypeToString(EffectType type) const {
    switch (type) {
        case EffectType::COMPRESSOR:
            return "compressor";
        case EffectType::DELAY:
            return "delay";
        case EffectType::REVERB:
            return "reverb";
        case EffectType::FILTER:
            return "filter";
        case EffectType::EQUALIZER:
            return "equalizer";
        case EffectType::LIMITER:
            return "limiter";
        default:
            return "unknown";
    }
}

std::string EffectManager::effectStateToString(EffectState state) const {
    switch (state) {
        case EffectState::UNINITIALIZED:
            return "uninitialized";
        case EffectState::INITIALIZED:
            return "initialized";
        case EffectState::PROCESSING:
            return "processing";
        case EffectState::BYPASSED:
            return "bypassed";
        case EffectState::ERROR:
            return "error";
        default:
            return "unknown";
    }
}

// === Méthodes privées ===
bool EffectManager::validateEffectType(EffectType type) const {
    switch (type) {
        case EffectType::COMPRESSOR:
        case EffectType::DELAY:
        case EffectType::REVERB:
            return true;
        default:
            return false;
    }
}

std::unique_ptr<AudioFX::IAudioEffect> EffectManager::createEffectByType(EffectType type) {
    try {
        switch (type) {
            case EffectType::COMPRESSOR: {
                // Créer un effet compresseur
                auto compressor = std::make_unique<AudioFX::CompressorEffect>();
                compressor->setSampleRate(config_.sampleRate, config_.channels);
                return compressor;
            }

            case EffectType::DELAY: {
                // Créer un effet de délai
                auto delay = std::make_unique<AudioFX::DelayEffect>();
                delay->setSampleRate(config_.sampleRate, config_.channels);
                return delay;
            }

            case EffectType::REVERB: {
                // TODO: Implémenter l'effet de réverbération
                // Pour l'instant, retourner nullptr
                break;
            }

            case EffectType::FILTER: {
                // TODO: Implémenter l'effet de filtre
                // Pour l'instant, retourner nullptr
                break;
            }

            default:
                break;
        }
    } catch (const std::exception& e) {
        // En cas d'erreur, on peut logger l'erreur mais on retourne nullptr
        // pour que la création d'effet échoue proprement
    }

    return nullptr;
}

void EffectManager::updateMetrics() {
    std::lock_guard<std::mutex> lock(metricsMutex_);

    // TODO: Mettre à jour les métriques réelles
    currentMetrics_.processedFrames++;
    currentMetrics_.processedSamples += 512; // Exemple
    currentMetrics_.activeEffectsCount = activeEffects_.size();

    // Notifier le callback
    notifyProcessingCallback();
}

void EffectManager::notifyProcessingCallback() {
    if (processingCallback_) {
        processingCallback_(currentMetrics_);
    }

    if (callbackManager_) {
        // TODO: Envoyer les métriques via le callback manager si nécessaire
        // callbackManager_->invokeProcessingCallback(currentMetrics_);
    }
}

void EffectManager::notifyEffectCallback(int effectId, const std::string& event) {
    if (effectCallback_) {
        effectCallback_(effectId, event);
    }

    if (callbackManager_) {
        // TODO: Envoyer l'événement via le callback manager si nécessaire
        // callbackManager_->invokeEffectCallback(effectId, event);
    }
}

EffectType EffectManager::stringToEffectType(const std::string& typeStr) const {
    if (typeStr == "compressor") {
        return EffectType::COMPRESSOR;
    } else if (typeStr == "delay") {
        return EffectType::DELAY;
    } else if (typeStr == "reverb") {
        return EffectType::REVERB;
    }
    return EffectType::UNKNOWN;
}

std::string EffectManager::effectTypeToString(EffectType type) const {
    switch (type) {
        case EffectType::COMPRESSOR:
            return "compressor";
        case EffectType::DELAY:
            return "delay";
        case EffectType::REVERB:
            return "reverb";
        default:
            return "unknown";
    }
}

} // namespace react
} // namespace facebook
