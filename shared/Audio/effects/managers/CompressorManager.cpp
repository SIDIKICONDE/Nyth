#include "CompressorManager.h"
#include "../config/EffectsLimits.h"

namespace facebook {
namespace react {

CompressorManager::CompressorManager(std::shared_ptr<JSICallbackManager> callbackManager)
    : callbackManager_(callbackManager) {}

CompressorManager::~CompressorManager() {
    if (compressor_) {
        compressor_->setEnabled(false);
        compressor_.reset();
    }
}

// === Cycle de vie ===
bool CompressorManager::initialize(const Nyth::Audio::EffectsConfig& config) {
    if (isInitialized_.load()) {
        return true;
    }

    try {
        // Créer le compresseur AudioFX
        compressor_ = std::make_unique<Nyth::Audio::FX::CompressorEffect>();

        // Configuration initiale
        config_ = config;
        compressorConfig_ = Nyth::Audio::EffectsConfigValidator::getDefaultCompressor();

        // Initialiser le compresseur
        compressor_->setSampleRate(config.sampleRate, config.channels);
        compressor_->setEnabled(compressorConfig_.enabled);

        isInitialized_.store(true);
        return true;

    } catch (const std::exception& e) {
        // Log l'erreur si nécessaire
        return false;
    }
}

bool CompressorManager::isInitialized() const {
    return isInitialized_.load();
}

void CompressorManager::release() {
    if (compressor_) {
        compressor_->setEnabled(false);
        compressor_.reset();
    }
    isInitialized_.store(false);
    isEnabled_.store(true);
    isBypassed_.store(false);
}

// === Configuration ===
bool CompressorManager::setConfig(const Nyth::Audio::CompressorConfig& config) {
    if (!isInitialized_.load()) {
        return false;
    }

    std::string error;
    if (!Nyth::Audio::EffectsConfigValidator::validate(config, error)) {
        return false;
    }

    compressorConfig_ = config;

    if (compressor_) {
        compressor_->setParameters(config.thresholdDb, config.ratio, config.attackMs, config.releaseMs,
                                   config.makeupDb);
        compressor_->setEnabled(config.enabled);
    }

    isEnabled_.store(config.enabled);
    return true;
}

Nyth::Audio::CompressorConfig CompressorManager::getConfig() const {
    return compressorConfig_;
}

bool CompressorManager::setThreshold(float thresholdDb) {
    if (!isInitialized_.load()) {
        return false;
    }

    Nyth::Audio::CompressorConfig newConfig = compressorConfig_;
    newConfig.thresholdDb = thresholdDb;

    return setConfig(newConfig);
}

bool CompressorManager::setRatio(float ratio) {
    if (!isInitialized_.load()) {
        return false;
    }

    Nyth::Audio::CompressorConfig newConfig = compressorConfig_;
    newConfig.ratio = ratio;

    return setConfig(newConfig);
}

bool CompressorManager::setAttack(float attackMs) {
    if (!isInitialized_.load()) {
        return false;
    }

    Nyth::Audio::CompressorConfig newConfig = compressorConfig_;
    newConfig.attackMs = attackMs;

    return setConfig(newConfig);
}

bool CompressorManager::setRelease(float releaseMs) {
    if (!isInitialized_.load()) {
        return false;
    }

    Nyth::Audio::CompressorConfig newConfig = compressorConfig_;
    newConfig.releaseMs = releaseMs;

    return setConfig(newConfig);
}

bool CompressorManager::setMakeup(float makeupDb) {
    if (!isInitialized_.load()) {
        return false;
    }

    Nyth::Audio::CompressorConfig newConfig = compressorConfig_;
    newConfig.makeupDb = makeupDb;

    return setConfig(newConfig);
}

// === Contrôle ===
bool CompressorManager::enable(bool enabled) {
    if (!isInitialized_.load()) {
        return false;
    }

    isEnabled_.store(enabled);
    compressorConfig_.enabled = enabled;

    if (compressor_) {
        compressor_->setEnabled(enabled && !isBypassed_.load());
    }

    return true;
}

bool CompressorManager::isEnabled() const {
    return isEnabled_.load();
}

bool CompressorManager::bypass(bool bypass) {
    if (!isInitialized_.load()) {
        return false;
    }

    isBypassed_.store(bypass);

    if (compressor_) {
        compressor_->setEnabled(isEnabled_.load() && !bypass);
    }

    return true;
}

bool CompressorManager::isBypassed() const {
    return isBypassed_.load();
}

// === Traitement audio ===
bool CompressorManager::processMono(std::vector<float>& input, std::vector<float>& output) {
    if (!isInitialized_.load() || !compressor_ || !isEnabled_.load() || isBypassed_.load()) {
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
        compressor_->processMono(input, output);
        updateMetrics();
        return true;
    } catch (const std::exception& e) {
        return false;
    }
}

bool CompressorManager::processStereo(std::vector<float>& inputL, std::vector<float>& inputR,
                                      std::vector<float>& outputL, std::vector<float>& outputR) {
    if (!isInitialized_.load() || !compressor_ || !isEnabled_.load() || isBypassed_.load()) {
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
        compressor_->processStereo(inputL, inputR, outputL, outputR);
        updateMetrics();
        return true;
    } catch (const std::exception& e) {
        return false;
    }
}

// === Métriques ===
CompressorManager::CompressorMetrics CompressorManager::getMetrics() const {
    std::lock_guard<std::mutex> lock(metricsMutex_);
    return currentMetrics_;
}

// === Informations ===
std::string CompressorManager::getInfo() const {
    return "AudioFX Compressor Effect - Dynamic Range Control";
}

uint32_t CompressorManager::getLatency() const {
    // Le compresseur a une latence due aux enveloppes attack/release
    return static_cast<uint32_t>(compressorConfig_.attackMs + compressorConfig_.releaseMs);
}

// === Callbacks ===
void CompressorManager::setMetricsCallback(MetricsCallback callback) {
    metricsCallback_ = std::move(callback);
}

// === Méthodes privées ===
void CompressorManager::updateMetrics() {
    if (!compressor_) {
        return;
    }

    std::lock_guard<std::mutex> lock(metricsMutex_);

    // Mettre à jour les métriques (valeurs fictives pour l'exemple)
    // Dans un vrai compresseur, on récupérerait ces valeurs du processeur
    currentMetrics_.inputLevel = 0.0f;
    currentMetrics_.outputLevel = 0.0f;
    currentMetrics_.gainReduction = 0.0f;
    currentMetrics_.compressionRatio = compressorConfig_.ratio;
    currentMetrics_.isActive = isEnabled_.load() && !isBypassed_.load();

    // Notifier le callback
    notifyMetricsCallback();
}

void CompressorManager::notifyMetricsCallback() {
    if (metricsCallback_ && callbackManager_) {
        // Envoyer les métriques via le callback manager
        callbackManager_->invokeCallback("compressorMetrics", [this](jsi::Runtime& rt) -> jsi::Value {
            auto metrics = getMetrics();
            jsi::Object obj(rt);
            obj.setProperty(rt, "inputLevel", jsi::Value(metrics.inputLevel));
            obj.setProperty(rt, "outputLevel", jsi::Value(metrics.outputLevel));
            obj.setProperty(rt, "gainReduction", jsi::Value(metrics.gainReduction));
            obj.setProperty(rt, "compressionRatio", jsi::Value(metrics.compressionRatio));
            obj.setProperty(rt, "isActive", jsi::Value(metrics.isActive));
            return obj;
        });
    }
}

bool CompressorManager::validateConfig(const Nyth::Audio::CompressorConfig& config) const {
    std::string error;
    return Nyth::Audio::EffectsConfigValidator::validate(config, error);
}

// === Implémentations SIMD ===

bool CompressorManager::processMono_SIMD(std::vector<float>& input, std::vector<float>& output) {
    if (!isInitialized_.load() || !compressor_ || !isEnabled_.load() || isBypassed_.load()) {
        if (input.size() == output.size()) {
            if (AudioNR::MathUtils::SIMDIntegration::isSIMDAccelerationEnabled() && input.size() >= 64) {
                std::memcpy(output.data(), input.data(), input.size() * sizeof(float));
            } else {
                std::copy(input.begin(), input.end(), output.begin());
            }
            return true;
        }
        return false;
    }

    if (input.size() != output.size()) {
        return false;
    }

    try {
        // Utiliser SIMD si disponible et taille suffisante
        if (AudioNR::MathUtils::SIMDIntegration::isSIMDAccelerationEnabled() && input.size() >= 64) {
            // Appliquer la compression SIMD
            compressor_->processMono_SIMD(input, output);

            // Appliquer des effets supplémentaires SIMD si nécessaire
            if (compressorConfig_.autoMakeup) {
                AudioNR::MathUtils::MathUtilsSIMDExtension::normalizeAudioSIMD(
                    output.data(), output.size(), 0.8f);
            }

            // Protection contre le clipping SIMD
            if (compressorConfig_.hardLimit) {
                AudioNR::SIMD::SIMDMathFunctions::apply_soft_clipper(
                    output.data(), output.size(), 0.95f);
            }
        } else {
            // Version standard
            return processMono(input, output);
        }

        updateMetrics();
        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("SIMD compression failed: ") + e.what());
        }
        return false;
    }
}

bool CompressorManager::processStereo_SIMD(std::vector<float>& inputL, std::vector<float>& inputR,
                                          std::vector<float>& outputL, std::vector<float>& outputR) {
    if (!isInitialized_.load() || !compressor_ || !isEnabled_.load() || isBypassed_.load()) {
        if (inputL.size() == outputL.size() && inputR.size() == outputR.size()) {
            if (AudioNR::MathUtils::SIMDIntegration::isSIMDAccelerationEnabled() && inputL.size() >= 64) {
                std::memcpy(outputL.data(), inputL.data(), inputL.size() * sizeof(float));
                std::memcpy(outputR.data(), inputR.data(), inputR.size() * sizeof(float));
            } else {
                std::copy(inputL.begin(), inputL.end(), outputL.begin());
                std::copy(inputR.begin(), inputR.end(), outputR.begin());
            }
            return true;
        }
        return false;
    }

    if (inputL.size() != outputL.size() || inputR.size() != outputR.size()) {
        return false;
    }

    try {
        // Utiliser SIMD si disponible et taille suffisante
        if (AudioNR::MathUtils::SIMDIntegration::isSIMDAccelerationEnabled() && inputL.size() >= 64) {
            // Appliquer la compression stéréo SIMD
            compressor_->processStereo_SIMD(inputL, inputR, outputL, outputR);

            // Appliquer des effets supplémentaires SIMD si nécessaire
            if (compressorConfig_.autoMakeup) {
                AudioNR::MathUtils::MathUtilsSIMDExtension::normalizeAudioSIMD(
                    outputL.data(), outputL.size(), 0.8f);
                AudioNR::MathUtils::MathUtilsSIMDExtension::normalizeAudioSIMD(
                    outputR.data(), outputR.size(), 0.8f);
            }

            // Protection contre le clipping SIMD
            if (compressorConfig_.hardLimit) {
                AudioNR::SIMD::SIMDMathFunctions::apply_soft_clipper(
                    outputL.data(), outputL.size(), 0.95f);
                AudioNR::SIMD::SIMDMathFunctions::apply_soft_clipper(
                    outputR.data(), outputR.size(), 0.95f);
            }
        } else {
            // Version standard
            return processStereo(inputL, inputR, outputL, outputR);
        }

        updateMetrics();
        return true;
    } catch (const std::exception& e) {
        if (callbackManager_) {
            callbackManager_->invokeErrorCallback(std::string("SIMD stereo compression failed: ") + e.what());
        }
        return false;
    }
}

} // namespace react
} // namespace facebook
