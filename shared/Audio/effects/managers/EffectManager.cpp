#include "EffectManager.h"
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
int EffectManager::createEffect(Nyth::Audio::Effects::EffectType type) {
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
bool EffectManager::setEffectConfig(int effectId, const jsi::Object& config) {
    // Cette méthode nécessiterait une implémentation plus complexe
    // pour parser la configuration JSI et l'appliquer à l'effet spécifique
    // Pour l'instant, on retourne false pour indiquer non implémenté
    return false;
}

jsi::Object EffectManager::getEffectConfig(int effectId) const {
    // Cette méthode nécessiterait une implémentation pour récupérer
    // la configuration de l'effet spécifique et la convertir en JSI
    // Pour l'instant, on retourne un objet vide
    jsi::Runtime* rt = nullptr; // TODO: Obtenir le runtime
    return jsi::Object(*rt);
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
        // TODO: Implémenter le chaînage des effets
        // Pour l'instant, on fait un passthrough
        if (input != output) {
            std::copy(input, input + frameCount * channels, output);
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
        // TODO: Implémenter le chaînage des effets en stéréo
        // Pour l'instant, on fait un passthrough
        if (inputL != outputL) {
            std::copy(inputL, inputL + frameCount, outputL);
        }
        if (inputR != outputR) {
            std::copy(inputR, inputR + frameCount, outputR);
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

// === Méthodes privées ===
bool EffectManager::validateEffectType(Nyth::Audio::Effects::EffectType type) const {
    switch (type) {
        case Nyth::Audio::Effects::EffectType::COMPRESSOR:
        case Nyth::Audio::Effects::EffectType::DELAY:
        case Nyth::Audio::Effects::EffectType::REVERB:
            return true;
        default:
            return false;
    }
}

std::unique_ptr<AudioFX::IAudioEffect> EffectManager::createEffectByType(Nyth::Audio::Effects::EffectType type) {
    // TODO: Implémenter la création des effets selon le type
    // Pour l'instant, on retourne nullptr
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
    if (processingCallback_ && callbackManager_) {
        // TODO: Envoyer les métriques via le callback manager
        notifyProcessingCallback();
    }
}

void EffectManager::notifyEffectCallback(int effectId, const std::string& event) {
    if (effectCallback_ && callbackManager_) {
        // TODO: Envoyer l'événement via le callback manager
        notifyEffectCallback(effectId, event);
    }
}

Nyth::Audio::Effects::EffectType EffectManager::stringToEffectType(const std::string& typeStr) const {
    if (typeStr == "compressor") {
        return Nyth::Audio::Effects::EffectType::COMPRESSOR;
    } else if (typeStr == "delay") {
        return Nyth::Audio::Effects::EffectType::DELAY;
    } else if (typeStr == "reverb") {
        return Nyth::Audio::Effects::EffectType::REVERB;
    }
    return Nyth::Audio::Effects::EffectType::UNKNOWN;
}

std::string EffectManager::effectTypeToString(Nyth::Audio::Effects::EffectType type) const {
    switch (type) {
        case Nyth::Audio::Effects::EffectType::COMPRESSOR:
            return "compressor";
        case Nyth::Audio::Effects::EffectType::DELAY:
            return "delay";
        case Nyth::Audio::Effects::EffectType::REVERB:
            return "reverb";
        default:
            return "unknown";
    }
}

} // namespace react
} // namespace facebook
