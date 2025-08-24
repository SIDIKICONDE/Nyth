#include "DelayManager.h"
#include "../config/EffectsLimits.h"

namespace facebook {
namespace react {

DelayManager::DelayManager(std::shared_ptr<JSICallbackManager> callbackManager) : callbackManager_(callbackManager) {}

DelayManager::~DelayManager() {
    if (delay_) {
        delay_->setEnabled(false);
        delay_.reset();
    }
}

// === Cycle de vie ===
bool DelayManager::initialize(const Nyth::Audio::EffectsConfig& config) {
    if (isInitialized_.load()) {
        return true;
    }

    try {
        // Créer l'effet delay AudioFX
        delay_ = std::make_unique<AudioFX::DelayEffect>();

        // Configuration initiale
        config_ = config;
        delayConfig_ = Nyth::Audio::EffectsConfigValidator::getDefaultDelay();

        // Initialiser l'effet delay
        delay_->setSampleRate(config.sampleRate, config.channels);
        delay_->setEnabled(delayConfig_.enabled);

        isInitialized_.store(true);
        return true;

    } catch (const std::exception& e) {
        // Log l'erreur si nécessaire
        return false;
    }
}

bool DelayManager::isInitialized() const {
    return isInitialized_.load();
}

void DelayManager::release() {
    if (delay_) {
        delay_->setEnabled(false);
        delay_.reset();
    }
    isInitialized_.store(false);
    isEnabled_.store(true);
    isBypassed_.store(false);
}

// === Configuration ===
bool DelayManager::setConfig(const Nyth::Audio::DelayConfig& config) {
    if (!isInitialized_.load()) {
        return false;
    }

    std::string error;
    if (!Nyth::Audio::EffectsConfigValidator::validate(config, error)) {
        return false;
    }

    delayConfig_ = config;

    if (delay_) {
        delay_->setParameters(config.delayMs, config.feedback, config.mix);
        delay_->setEnabled(config.enabled);
    }

    isEnabled_.store(config.enabled);
    return true;
}

Nyth::Audio::DelayConfig DelayManager::getConfig() const {
    return delayConfig_;
}

bool DelayManager::setDelay(float delayMs) {
    if (!isInitialized_.load()) {
        return false;
    }

    Nyth::Audio::DelayConfig newConfig = delayConfig_;
    newConfig.delayMs = delayMs;

    return setConfig(newConfig);
}

bool DelayManager::setFeedback(float feedback) {
    if (!isInitialized_.load()) {
        return false;
    }

    Nyth::Audio::DelayConfig newConfig = delayConfig_;
    newConfig.feedback = feedback;

    return setConfig(newConfig);
}

bool DelayManager::setMix(float mix) {
    if (!isInitialized_.load()) {
        return false;
    }

    Nyth::Audio::DelayConfig newConfig = delayConfig_;
    newConfig.mix = mix;

    return setConfig(newConfig);
}

// === Contrôle ===
bool DelayManager::enable(bool enabled) {
    if (!isInitialized_.load()) {
        return false;
    }

    isEnabled_.store(enabled);
    delayConfig_.enabled = enabled;

    if (delay_) {
        delay_->setEnabled(enabled && !isBypassed_.load());
    }

    return true;
}

bool DelayManager::isEnabled() const {
    return isEnabled_.load();
}

bool DelayManager::bypass(bool bypass) {
    if (!isInitialized_.load()) {
        return false;
    }

    isBypassed_.store(bypass);

    if (delay_) {
        delay_->setEnabled(isEnabled_.load() && !bypass);
    }

    return true;
}

bool DelayManager::isBypassed() const {
    return isBypassed_.load();
}

// === Traitement audio ===
bool DelayManager::processMono(std::vector<float>& input, std::vector<float>& output) {
    if (!isInitialized_.load() || !delay_ || !isEnabled_.load() || isBypassed_.load()) {
        if (input.size() == output.size()) {
            std::copy(input.begin(), input.end(), output.begin());
            return true;
        }
        return false;
    }

    if (input.size() != output.size()) {
        return false;
    }

    try {
        delay_->processMono(input, output);
        updateMetrics();
        return true;
    } catch (const std::exception& e) {
        return false;
    }
}

bool DelayManager::processStereo(std::vector<float>& inputL, std::vector<float>& inputR, std::vector<float>& outputL,
                                 std::vector<float>& outputR) {
    if (!isInitialized_.load() || !delay_ || !isEnabled_.load() || isBypassed_.load()) {
        if (inputL.size() == outputL.size() && inputR.size() == outputR.size()) {
            std::copy(inputL.begin(), inputL.end(), outputL.begin());
            std::copy(inputR.begin(), inputR.end(), outputR.begin());
            return true;
        }
        return false;
    }

    if (inputL.size() != outputL.size() || inputR.size() != outputR.size()) {
        return false;
    }

    try {
        delay_->processStereo(inputL, inputR, outputL, outputR);
        updateMetrics();
        return true;
    } catch (const std::exception& e) {
        return false;
    }
}

// === Métriques ===
DelayManager::DelayMetrics DelayManager::getMetrics() const {
    std::lock_guard<std::mutex> lock(metricsMutex_);
    return currentMetrics_;
}

// === Informations ===
std::string DelayManager::getInfo() const {
    return "AudioFX Delay Effect - Echo/Reverb Simulation";
}

uint32_t DelayManager::getLatency() const {
    // La latence correspond au temps de delay configuré
    return static_cast<uint32_t>(delayConfig_.delayMs);
}

// === Callbacks ===
void DelayManager::setMetricsCallback(MetricsCallback callback) {
    metricsCallback_ = std::move(callback);
}

// === Méthodes privées ===
void DelayManager::updateMetrics() {
    if (!delay_) {
        return;
    }

    std::lock_guard<std::mutex> lock(metricsMutex_);

    // Mettre à jour les métriques (valeurs fictives pour l'exemple)
    // Dans un vrai delay, on récupérerait ces valeurs du processeur
    currentMetrics_.inputLevel = 0.0f;
    currentMetrics_.outputLevel = 0.0f;
    currentMetrics_.feedbackLevel = delayConfig_.feedback;
    currentMetrics_.wetLevel = delayConfig_.mix;
    currentMetrics_.isActive = isEnabled_.load() && !isBypassed_.load();

    // Notifier le callback
    notifyMetricsCallback();
}

void DelayManager::notifyMetricsCallback() {
    if (metricsCallback_ && callbackManager_) {
        // Envoyer les métriques via le callback manager
        callbackManager_->invokeCallback("delayMetrics", [this](jsi::Runtime& rt) -> jsi::Value {
            auto metrics = getMetrics();
            jsi::Object obj(rt);
            obj.setProperty(rt, "inputLevel", jsi::Value(metrics.inputLevel));
            obj.setProperty(rt, "outputLevel", jsi::Value(metrics.outputLevel));
            obj.setProperty(rt, "feedbackLevel", jsi::Value(metrics.feedbackLevel));
            obj.setProperty(rt, "wetLevel", jsi::Value(metrics.wetLevel));
            obj.setProperty(rt, "isActive", jsi::Value(metrics.isActive));
            return obj;
        });
    }
}

bool DelayManager::validateConfig(const Nyth::Audio::DelayConfig& config) const {
    std::string error;
    return Nyth::Audio::EffectsConfigValidator::validate(config, error);
}

} // namespace react
} // namespace facebook
