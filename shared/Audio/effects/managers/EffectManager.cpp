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
        workBufferL_.clear();
        workBufferR_.clear();

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

        // Associer l'effet à la chaîne pour qu'il soit réellement utilisé
        Nyth::Audio::FX::IAudioEffect* rawPtr = nullptr;
        switch (type) {
            case EffectType::COMPRESSOR: {
                rawPtr = effectChain_.emplaceEffect<Nyth::Audio::FX::CompressorEffect>();
                break;
            }
            case EffectType::DELAY: {
                rawPtr = effectChain_.emplaceEffect<Nyth::Audio::FX::DelayEffect>();
                break;
            }
            default: {
                // Types non gérés pour l'instant
                break;
            }
        }

        int effectId = nextEffectId_.fetch_add(1);
        // Conserver l'instance principale dans activeEffects_
        activeEffects_[effectId] = std::move(effect);
        if (rawPtr) {
            idToChainEffect_[effectId] = rawPtr;
        }

        // S'assurer que l'effet dans la chaîne a le même SR/channels et enabled
        if (rawPtr) {
            rawPtr->setSampleRate(config_.sampleRate, config_.channels);
            rawPtr->setEnabled(true);
        }

        return effectId;

    } catch (const std::exception& e) {
        return -1;
    }
}

bool EffectManager::destroyEffect(int effectId) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    auto it = activeEffects_.find(effectId);
    if (it != activeEffects_.end()) {
        auto jt = idToChainEffect_.find(effectId);
        if (jt != idToChainEffect_.end() && jt->second) {
            // Désactiver l'effet dans la chaîne pour ne plus l'appliquer
            jt->second->setEnabled(false);
            idToChainEffect_.erase(jt);
        }
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

size_t EffectManager::getEffectCount() const {
    std::lock_guard<std::mutex> lock(effectsMutex_);
    return activeEffects_.size();
}

// === Configuration des effets ===
bool EffectManager::setEffectConfig(jsi::Runtime& rt, int effectId, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(effectsMutex_);
    auto it = activeEffects_.find(effectId);
    if (it == activeEffects_.end()) {
        return false;
    }
    auto* effect = it->second.get();

    // Déterminer le type et appliquer les paramètres spécifiques
    if (auto* compressor = dynamic_cast<Nyth::Audio::FX::CompressorEffect*>(effect)) {
        float thresholdDb = -24.0f;
        float ratio = 4.0f;
        float attackMs = 10.0f;
        float releaseMs = 100.0f;
        float makeupDb = 0.0f;
        if (config.hasProperty(rt, "compressor")) {
            auto compObj = config.getProperty(rt, "compressor").asObject(rt);
            if (compObj.hasProperty(rt, "thresholdDb")) thresholdDb = compObj.getProperty(rt, "thresholdDb").asNumber();
            if (compObj.hasProperty(rt, "ratio")) ratio = compObj.getProperty(rt, "ratio").asNumber();
            if (compObj.hasProperty(rt, "attackMs")) attackMs = compObj.getProperty(rt, "attackMs").asNumber();
            if (compObj.hasProperty(rt, "releaseMs")) releaseMs = compObj.getProperty(rt, "releaseMs").asNumber();
            if (compObj.hasProperty(rt, "makeupDb")) makeupDb = compObj.getProperty(rt, "makeupDb").asNumber();
        }
        compressor->setParameters(thresholdDb, ratio, attackMs, releaseMs, makeupDb);
        if (config.hasProperty(rt, "enabled")) {
            bool enabled = config.getProperty(rt, "enabled").asBool();
            compressor->setEnabled(enabled);
        }
        // Mettre aussi à jour l'effet de la chaîne
        auto cit = idToChainEffect_.find(effectId);
        if (cit != idToChainEffect_.end()) {
            if (auto* c2 = dynamic_cast<Nyth::Audio::FX::CompressorEffect*>(cit->second)) {
                c2->setParameters(thresholdDb, ratio, attackMs, releaseMs, makeupDb);
                if (config.hasProperty(rt, "enabled")) {
                    bool enabled = config.getProperty(rt, "enabled").asBool();
                    c2->setEnabled(enabled);
                }
            }
        }
        return true;
    }

    if (auto* delay = dynamic_cast<Nyth::Audio::FX::DelayEffect*>(effect)) {
        float delayMs = 250.0f;
        float feedback = 0.3f;
        float mix = 0.2f;
        if (config.hasProperty(rt, "delay")) {
            auto delObj = config.getProperty(rt, "delay").asObject(rt);
            if (delObj.hasProperty(rt, "delayMs")) delayMs = delObj.getProperty(rt, "delayMs").asNumber();
            if (delObj.hasProperty(rt, "feedback")) feedback = delObj.getProperty(rt, "feedback").asNumber();
            if (delObj.hasProperty(rt, "mix")) mix = delObj.getProperty(rt, "mix").asNumber();
        }
        delay->setParameters(delayMs, feedback, mix);
        if (config.hasProperty(rt, "enabled")) {
            bool enabled = config.getProperty(rt, "enabled").asBool();
            delay->setEnabled(enabled);
        }
        auto dit = idToChainEffect_.find(effectId);
        if (dit != idToChainEffect_.end()) {
            if (auto* d2 = dynamic_cast<Nyth::Audio::FX::DelayEffect*>(dit->second)) {
                d2->setParameters(delayMs, feedback, mix);
                if (config.hasProperty(rt, "enabled")) {
                    bool enabled = config.getProperty(rt, "enabled").asBool();
                    d2->setEnabled(enabled);
                }
            }
        }
        return true;
    }
    return false;
}

jsi::Object EffectManager::getEffectConfig(jsi::Runtime& rt, int effectId) const {
    std::lock_guard<std::mutex> lock(effectsMutex_);
    auto it = activeEffects_.find(effectId);
    if (it == activeEffects_.end()) {
        return jsi::Object(rt);
    }
    auto* effect = it->second.get();

    jsi::Object result(rt);
    result.setProperty(rt, "enabled", jsi::Value(effect->isEnabled()));
    result.setProperty(rt, "sampleRate", jsi::Value(static_cast<int>(effect->getSampleRate())));
    result.setProperty(rt, "channels", jsi::Value(effect->getChannels()));

    if (dynamic_cast<Nyth::Audio::FX::CompressorEffect*>(effect)) {
        result.setProperty(rt, "type", jsi::String::createFromUtf8(rt, "compressor"));
    } else if (dynamic_cast<Nyth::Audio::FX::DelayEffect*>(effect)) {
        result.setProperty(rt, "type", jsi::String::createFromUtf8(rt, "delay"));
    } else {
        result.setProperty(rt, "type", jsi::String::createFromUtf8(rt, "unknown"));
    }
    return result;
}

bool EffectManager::enableEffect(int effectId, bool enabled) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    auto it = activeEffects_.find(effectId);
    if (it != activeEffects_.end()) {
        if (it->second) {
            it->second->setEnabled(enabled);
            auto jt = idToChainEffect_.find(effectId);
            if (jt != idToChainEffect_.end() && jt->second) {
                jt->second->setEnabled(enabled);
            }
            return true;
        }
    }

    return false;
}

bool EffectManager::isEffectEnabled(int effectId) const {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    auto it = activeEffects_.find(effectId);
    if (it != activeEffects_.end()) {
        if (it->second) {
            return it->second->isEnabled();
        }
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

    if (activeEffects_.empty() || idToChainEffect_.empty()) {
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
            // Stereo interleaved input -> deinterleave for chain API
            std::vector<float> inputVecL(frameCount);
            std::vector<float> inputVecR(frameCount);
            for (size_t i = 0; i < frameCount; ++i) {
                inputVecL[i] = input[i * 2];
                inputVecR[i] = input[i * 2 + 1];
            }
            std::vector<float> outputVecL(frameCount);
            std::vector<float> outputVecR(frameCount);

            effectChain_.processStereo(inputVecL, inputVecR, outputVecL, outputVecR);

            if (output) {
                for (size_t i = 0; i < frameCount; ++i) {
                    output[i * 2] = outputVecL[i];
                    output[i * 2 + 1] = outputVecR[i];
                }
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
Nyth::Audio::FX::IAudioEffect* EffectManager::getEffect(int effectId) {
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
        if (dynamic_cast<Nyth::Audio::FX::CompressorEffect*>(it->second.get())) {
            return EffectType::COMPRESSOR;
        } else if (dynamic_cast<Nyth::Audio::FX::DelayEffect*>(it->second.get())) {
            return EffectType::DELAY;
        } else {
            return EffectType::UNKNOWN; // Type non déterminé
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

    return EffectState::UNINITIALIZED;
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

std::unique_ptr<Nyth::Audio::FX::IAudioEffect> EffectManager::createEffectByType(EffectType type) {
    try {
        switch (type) {
            case EffectType::COMPRESSOR: {
                // Créer un effet compresseur
                auto compressor = std::make_unique<Nyth::Audio::FX::CompressorEffect>();
                compressor->setSampleRate(config_.sampleRate, config_.channels);
                return compressor;
            }

            case EffectType::DELAY: {
                // Créer un effet de délai
                auto delay = std::make_unique<Nyth::Audio::FX::DelayEffect>();
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

// === Paramètres spécifiques aux effets ===
jsi::Object EffectManager::getCompressorParameters(jsi::Runtime& rt, int effectId) const {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    auto it = activeEffects_.find(effectId);
    if (it == activeEffects_.end()) {
        // Retourner un objet vide si l'effet n'existe pas
        return jsi::Object(rt);
    }

    // Vérifier que c'est bien un compresseur
    if (getEffectType(effectId) != EffectType::COMPRESSOR) {
        return jsi::Object(rt);
    }

    // Convertir l'effet en CompressorEffect et récupérer ses paramètres
    auto* compressor = dynamic_cast<Nyth::Audio::FX::CompressorEffect*>(it->second.get());
    if (!compressor) {
        return jsi::Object(rt);
    }

    auto params = compressor->getParameters();
    jsi::Object result(rt);

    result.setProperty(rt, "thresholdDb", jsi::Value(params.thresholdDb));
    result.setProperty(rt, "ratio", jsi::Value(params.ratio));
    result.setProperty(rt, "attackMs", jsi::Value(params.attackMs));
    result.setProperty(rt, "releaseMs", jsi::Value(params.releaseMs));
    result.setProperty(rt, "makeupDb", jsi::Value(params.makeupDb));

    return result;
}

jsi::Object EffectManager::getDelayParameters(jsi::Runtime& rt, int effectId) const {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    auto it = activeEffects_.find(effectId);
    if (it == activeEffects_.end()) {
        // Retourner un objet vide si l'effet n'existe pas
        return jsi::Object(rt);
    }

    // Vérifier que c'est bien un delay
    if (getEffectType(effectId) != EffectType::DELAY) {
        return jsi::Object(rt);
    }

    // Convertir l'effet en DelayEffect et récupérer ses paramètres
    auto* delay = dynamic_cast<Nyth::Audio::FX::DelayEffect*>(it->second.get());
    if (!delay) {
        return jsi::Object(rt);
    }

    auto params = delay->getParameters();
    jsi::Object result(rt);

    result.setProperty(rt, "delayMs", jsi::Value(params.delayMs));
    result.setProperty(rt, "feedback", jsi::Value(params.feedback));
    result.setProperty(rt, "mix", jsi::Value(params.mix));

    return result;
}

bool EffectManager::setCompressorParameters(int effectId, float thresholdDb, float ratio, float attackMs, float releaseMs, float makeupDb) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    auto it = activeEffects_.find(effectId);
    if (it == activeEffects_.end()) {
        return false;
    }

    // Vérifier que c'est bien un compresseur
    if (getEffectType(effectId) != EffectType::COMPRESSOR) {
        return false;
    }

    // Convertir l'effet en CompressorEffect et définir ses paramètres
    auto* compressor = dynamic_cast<Nyth::Audio::FX::CompressorEffect*>(it->second.get());
    if (!compressor) {
        return false;
    }

    compressor->setParameters(thresholdDb, ratio, attackMs, releaseMs, makeupDb);
    return true;
}

bool EffectManager::setDelayParameters(int effectId, float delayMs, float feedback, float mix) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    auto it = activeEffects_.find(effectId);
    if (it == activeEffects_.end()) {
        return false;
    }

    // Vérifier que c'est bien un delay
    if (getEffectType(effectId) != EffectType::DELAY) {
        return false;
    }

    // Convertir l'effet en DelayEffect et définir ses paramètres
    auto* delay = dynamic_cast<Nyth::Audio::FX::DelayEffect*>(it->second.get());
    if (!delay) {
        return false;
    }

    delay->setParameters(delayMs, feedback, mix);
    return true;
}

// (duplicate removed) effectTypeToString is already defined earlier in this file

// === Implémentations SIMD ===

bool EffectManager::processAudio_SIMD(const float* input, float* output, size_t frameCount, int channels) {
    if (!isInitialized_.load() || bypassAll_.load()) {
        if (input != output) {
            // Utiliser SIMD pour la copie si disponible
            if (AudioNR::MathUtils::SIMDIntegration::isSIMDAccelerationEnabled() && frameCount >= 64) {
                // Copie optimisée SIMD
                std::memcpy(output, input, frameCount * channels * sizeof(float));
            } else {
                std::copy(input, input + frameCount * channels, output);
            }
        }
        return true;
    }

    std::lock_guard<std::mutex> lock(effectsMutex_);

    if (activeEffects_.empty() || idToChainEffect_.empty()) {
        if (input != output) {
            if (AudioNR::MathUtils::SIMDIntegration::isSIMDAccelerationEnabled() && frameCount >= 64) {
                std::memcpy(output, input, frameCount * channels * sizeof(float));
            } else {
                std::copy(input, input + frameCount * channels, output);
            }
        }
        return true;
    }

    try {
        // Utiliser SIMD si disponible et taille suffisante
        if (AudioNR::MathUtils::SIMDIntegration::isSIMDAccelerationEnabled() && frameCount >= 64) {
            // Pré-traitement SIMD
            if (masterInputLevel_.load() != 1.0f) {
                AudioNR::MathUtils::MathUtilsSIMDExtension::applyGainSIMD(
                    const_cast<float*>(input), frameCount * channels, masterInputLevel_.load());
            }

            // Traitement de la chaîne d'effets
            effectChain_.processMono_SIMD(input, output, frameCount * channels);

            // Post-traitement SIMD
            if (masterOutputLevel_.load() != 1.0f) {
                AudioNR::MathUtils::MathUtilsSIMDExtension::applyGainSIMD(
                    output, frameCount * channels, masterOutputLevel_.load());
            }
        } else {
            // Version standard
            return processAudio(input, output, frameCount, channels);
        }

        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("SIMD processing failed: ") + e.what());
        }
        return false;
    }
}

bool EffectManager::processAudioStereo_SIMD(const float* inputL, const float* inputR, float* outputL, float* outputR,
                                           size_t frameCount) {
    if (!isInitialized_.load() || bypassAll_.load()) {
        if (inputL != outputL) {
            if (AudioNR::MathUtils::SIMDIntegration::isSIMDAccelerationEnabled() && frameCount >= 64) {
                std::memcpy(outputL, inputL, frameCount * sizeof(float));
            } else {
                std::copy(inputL, inputL + frameCount, outputL);
            }
        }
        if (inputR != outputR) {
            if (AudioNR::MathUtils::SIMDIntegration::isSIMDAccelerationEnabled() && frameCount >= 64) {
                std::memcpy(outputR, inputR, frameCount * sizeof(float));
            } else {
                std::copy(inputR, inputR + frameCount, outputR);
            }
        }
        return true;
    }

    std::lock_guard<std::mutex> lock(effectsMutex_);

    if (activeEffects_.empty() || idToChainEffect_.empty()) {
        if (inputL != outputL) {
            if (AudioNR::MathUtils::SIMDIntegration::isSIMDAccelerationEnabled() && frameCount >= 64) {
                std::memcpy(outputL, inputL, frameCount * sizeof(float));
            } else {
                std::copy(inputL, inputL + frameCount, outputL);
            }
        }
        if (inputR != outputR) {
            if (AudioNR::MathUtils::SIMDIntegration::isSIMDAccelerationEnabled() && frameCount >= 64) {
                std::memcpy(outputR, inputR, frameCount * sizeof(float));
            } else {
                std::copy(inputR, inputR + frameCount, outputR);
            }
        }
        return true;
    }

    try {
        // Utiliser SIMD si disponible et taille suffisante
        if (AudioNR::MathUtils::SIMDIntegration::isSIMDAccelerationEnabled() && frameCount >= 64) {
            // Pré-traitement SIMD
            if (masterInputLevel_.load() != 1.0f) {
                AudioNR::MathUtils::MathUtilsSIMDExtension::applyGainSIMD(
                    const_cast<float*>(inputL), frameCount, masterInputLevel_.load());
                AudioNR::MathUtils::MathUtilsSIMDExtension::applyGainSIMD(
                    const_cast<float*>(inputR), frameCount, masterInputLevel_.load());
            }

            // Traitement de la chaîne d'effets stéréo SIMD
            effectChain_.processStereo_SIMD(inputL, inputR, outputL, outputR, frameCount);

            // Post-traitement SIMD
            if (masterOutputLevel_.load() != 1.0f) {
                AudioNR::MathUtils::MathUtilsSIMDExtension::applyGainSIMD(
                    outputL, frameCount, masterOutputLevel_.load());
                AudioNR::MathUtils::MathUtilsSIMDExtension::applyGainSIMD(
                    outputR, frameCount, masterOutputLevel_.load());
            }
        } else {
            // Version standard
            return processAudioStereo(inputL, inputR, outputL, outputR, frameCount);
        }

        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("SIMD stereo processing failed: ") + e.what());
        }
        return false;
    }
}

} // namespace react
} // namespace facebook
