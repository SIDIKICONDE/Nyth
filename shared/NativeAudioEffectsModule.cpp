#include "NativeAudioEffectsModule.h"

#if NYTH_AUDIO_EFFECTS_ENABLED

#include "Audio/effects/Compressor.hpp"
#include "Audio/effects/Delay.hpp"
#include "Audio/effects/EffectConstants.hpp"
#include <algorithm>
#include <chrono>
#include <sstream>

namespace facebook {
namespace react {

NativeAudioEffectsModule::~NativeAudioEffectsModule() {
    // Nettoyer les ressources
    std::lock_guard<std::mutex> lock(effectsMutex_);
    if (effectChain_) {
        effectChain_.reset();
    }
    activeEffects_.clear();

    // Nettoyer les callbacks
    {
        std::lock_guard<std::mutex> callbackLock(callbackMutex_);
        jsCallbacks_.audioDataCallback = {};
        jsCallbacks_.errorCallback = {};
        jsCallbacks_.stateChangeCallback = {};
    }
}

// === Méthodes privées ===

void NativeAudioEffectsModule::initializeEffectChain() {
    effectChain_ = std::make_unique<AudioFX::EffectChain>();
    effectChain_->setSampleRate(currentSampleRate_, currentChannels_);
    currentState_ = EFFECTS_STATE_INITIALIZED;
}

bool NativeAudioEffectsModule::validateEffectId(int effectId) const {
    return activeEffects_.find(effectId) != activeEffects_.end();
}

NythEffectType NativeAudioEffectsModule::stringToEffectType(const std::string& typeStr) const {
    if (typeStr == "compressor")
        return EFFECT_TYPE_COMPRESSOR;
    if (typeStr == "delay")
        return EFFECT_TYPE_DELAY;
    return EFFECT_TYPE_UNKNOWN;
}

std::string NativeAudioEffectsModule::effectTypeToString(NythEffectType type) const {
    switch (type) {
        case EFFECT_TYPE_COMPRESSOR:
            return "compressor";
        case EFFECT_TYPE_DELAY:
            return "delay";
        default:
            return "unknown";
    }
}

void NativeAudioEffectsModule::handleAudioData(const float* input, float* output, size_t frameCount, int channels) {
    std::lock_guard<std::mutex> lock(callbackMutex_);

    // Traiter les données audio avec la chaîne d'effets
    if (effectChain_ && currentState_ == EFFECTS_STATE_PROCESSING) {
        // Appliquer les effets
        if (channels == 1) {
            // Traitement mono
            std::vector<float> inputVec(input, input + frameCount);
            std::vector<float> outputVec(frameCount);
            effectChain_->processMono(inputVec, outputVec);
            std::copy(outputVec.begin(), outputVec.end(), output);
        } else if (channels == 2) {
            // Traitement stéréo - données entrelacées
            size_t samplesPerChannel = frameCount / 2;
            std::vector<float> inputL(samplesPerChannel);
            std::vector<float> inputR(samplesPerChannel);
            std::vector<float> outputL(samplesPerChannel);
            std::vector<float> outputR(samplesPerChannel);

            // Désentrelacer les canaux
            for (size_t i = 0; i < samplesPerChannel; ++i) {
                inputL[i] = input[i * 2];
                inputR[i] = input[i * 2 + 1];
            }

            // Traiter
            effectChain_->processStereo(inputL, inputR, outputL, outputR);

            // Réentrelacer les canaux
            for (size_t i = 0; i < samplesPerChannel; ++i) {
                output[i * 2] = outputL[i];
                output[i * 2 + 1] = outputR[i];
            }
        }
    } else {
        // Passthrough si pas de traitement
        if (output != input) {
            std::copy(input, input + frameCount * channels, output);
        }
    }

    // Appeler le callback JavaScript si défini
    if (jsCallbacks_.audioDataCallback.function && jsCallbacks_.audioDataCallback.runtime && jsInvoker_) {
        auto callback = jsCallbacks_.audioDataCallback.function;
        auto runtime = jsCallbacks_.audioDataCallback.runtime;

        // Créer des copies des données pour le callback
        std::vector<float> inputCopy(input, input + frameCount * channels);
        std::vector<float> outputCopy(output, output + frameCount * channels);

        jsInvoker_->invokeAsync([callback, runtime, inputCopy, outputCopy, frameCount, channels]() {
            try {
                // Créer les arrays JSI
                jsi::Array inputArray(*runtime, inputCopy.size());
                jsi::Array outputArray(*runtime, outputCopy.size());

                for (size_t i = 0; i < inputCopy.size(); ++i) {
                    inputArray.setValueAtIndex(*runtime, i, jsi::Value(inputCopy[i]));
                }
                for (size_t i = 0; i < outputCopy.size(); ++i) {
                    outputArray.setValueAtIndex(*runtime, i, jsi::Value(outputCopy[i]));
                }

                // Créer l'objet de métadonnées
                jsi::Object metadata(*runtime);
                metadata.setProperty(*runtime, "frameCount", jsi::Value(static_cast<double>(frameCount)));
                metadata.setProperty(*runtime, "channels", jsi::Value(channels));

                // Appeler le callback avec les données
                callback->call(*runtime, std::move(inputArray), std::move(outputArray), std::move(metadata));
            } catch (const jsi::JSError& e) {
                // Log l'erreur mais ne pas propager
            }
        });
    }
}

void NativeAudioEffectsModule::handleError(const std::string& error) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    if (jsCallbacks_.errorCallback.function && jsCallbacks_.errorCallback.runtime && jsInvoker_) {
        // Capturer les références nécessaires
        auto callback = jsCallbacks_.errorCallback.function;
        auto runtime = jsCallbacks_.errorCallback.runtime;

        jsInvoker_->invokeAsync([callback, runtime, error]() {
            try {
                // Créer l'argument string JSI
                jsi::String errorStr = jsi::String::createFromUtf8(*runtime, error);
                // Appeler le callback JavaScript avec l'erreur
                callback->call(*runtime, errorStr);
            } catch (const jsi::JSError& e) {
                // Log l'erreur mais ne pas propager pour éviter un crash
            }
        });
    }
}

void NativeAudioEffectsModule::handleStateChange(NythEffectsState oldState, NythEffectsState newState) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    if (jsCallbacks_.stateChangeCallback.function && jsCallbacks_.stateChangeCallback.runtime && jsInvoker_) {
        // Capturer les références nécessaires
        auto callback = jsCallbacks_.stateChangeCallback.function;
        auto runtime = jsCallbacks_.stateChangeCallback.runtime;
        std::string oldStateStr = stateToString(oldState);
        std::string newStateStr = stateToString(newState);

        jsInvoker_->invokeAsync([callback, runtime, oldStateStr, newStateStr]() {
            try {
                // Créer les arguments string JSI
                jsi::String oldStateJS = jsi::String::createFromUtf8(*runtime, oldStateStr);
                jsi::String newStateJS = jsi::String::createFromUtf8(*runtime, newStateStr);
                // Appeler le callback JavaScript avec les états
                callback->call(*runtime, oldStateJS, newStateJS);
            } catch (const jsi::JSError& e) {
                // Log l'erreur mais ne pas propager pour éviter un crash
            }
        });
    }
}

std::string NativeAudioEffectsModule::stateToString(NythEffectsState state) const {
    switch (state) {
        case EFFECTS_STATE_UNINITIALIZED:
            return "uninitialized";
        case EFFECTS_STATE_INITIALIZED:
            return "initialized";
        case EFFECTS_STATE_PROCESSING:
            return "processing";
        case EFFECTS_STATE_ERROR:
            return "error";
        default:
            return "unknown";
    }
}

NythEffectConfig NativeAudioEffectsModule::parseEffectConfig(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    NythEffectConfig config = {};

    // Validation et extraction du type
    if (jsConfig.hasProperty(rt, "type")) {
        auto typeValue = jsConfig.getProperty(rt, "type");
        if (typeValue.isString()) {
            std::string typeStr = typeValue.asString(rt).utf8(rt);
            config.type = stringToEffectType(typeStr);
        } else {
            throw jsi::JSError(rt, "Effect type must be a string");
        }
    }

    // Validation et extraction de enabled
    if (jsConfig.hasProperty(rt, "enabled")) {
        auto enabledValue = jsConfig.getProperty(rt, "enabled");
        if (enabledValue.isBool()) {
            config.enabled = enabledValue.asBool();
        } else {
            throw jsi::JSError(rt, "Enabled property must be a boolean");
        }
    }

    config.sampleRate = currentSampleRate_;
    config.channels = currentChannels_;

    // Configuration spécifique selon le type avec validation
    if (config.type == EFFECT_TYPE_COMPRESSOR && jsConfig.hasProperty(rt, "compressor")) {
        auto compValue = jsConfig.getProperty(rt, "compressor");
        if (!compValue.isObject()) {
            throw jsi::JSError(rt, "Compressor config must be an object");
        }
        jsi::Object compConfig = compValue.asObject(rt);

        if (compConfig.hasProperty(rt, "thresholdDb")) {
            auto value = compConfig.getProperty(rt, "thresholdDb");
            if (value.isNumber()) {
                config.config.compressor.thresholdDb = static_cast<float>(value.asNumber());
            }
        }
        if (compConfig.hasProperty(rt, "ratio")) {
            auto value = compConfig.getProperty(rt, "ratio");
            if (value.isNumber()) {
                config.config.compressor.ratio = static_cast<float>(value.asNumber());
            }
        }
        if (compConfig.hasProperty(rt, "attackMs")) {
            auto value = compConfig.getProperty(rt, "attackMs");
            if (value.isNumber()) {
                config.config.compressor.attackMs = static_cast<float>(value.asNumber());
            }
        }
        if (compConfig.hasProperty(rt, "releaseMs")) {
            auto value = compConfig.getProperty(rt, "releaseMs");
            if (value.isNumber()) {
                config.config.compressor.releaseMs = static_cast<float>(value.asNumber());
            }
        }
        if (compConfig.hasProperty(rt, "makeupDb")) {
            auto value = compConfig.getProperty(rt, "makeupDb");
            if (value.isNumber()) {
                config.config.compressor.makeupDb = static_cast<float>(value.asNumber());
            }
        }
    } else if (config.type == EFFECT_TYPE_DELAY && jsConfig.hasProperty(rt, "delay")) {
        auto delayValue = jsConfig.getProperty(rt, "delay");
        if (!delayValue.isObject()) {
            throw jsi::JSError(rt, "Delay config must be an object");
        }
        jsi::Object delayConfig = delayValue.asObject(rt);

        if (delayConfig.hasProperty(rt, "delayMs")) {
            auto value = delayConfig.getProperty(rt, "delayMs");
            if (value.isNumber()) {
                config.config.delay.delayMs = static_cast<float>(value.asNumber());
            }
        }
        if (delayConfig.hasProperty(rt, "feedback")) {
            auto value = delayConfig.getProperty(rt, "feedback");
            if (value.isNumber()) {
                config.config.delay.feedback = static_cast<float>(value.asNumber());
            }
        }
        if (delayConfig.hasProperty(rt, "mix")) {
            auto value = delayConfig.getProperty(rt, "mix");
            if (value.isNumber()) {
                config.config.delay.mix = static_cast<float>(value.asNumber());
            }
        }
    }

    return config;
}

jsi::Object NativeAudioEffectsModule::effectConfigToJS(jsi::Runtime& rt, const NythEffectConfig& config) {
    jsi::Object jsConfig(rt);

    jsConfig.setProperty(rt, "effectId", jsi::Value(config.effectId));
    jsConfig.setProperty(rt, "type", jsi::String::createFromUtf8(rt, effectTypeToString(config.type)));
    jsConfig.setProperty(rt, "enabled", jsi::Value(config.enabled));
    jsConfig.setProperty(rt, "sampleRate", jsi::Value(static_cast<int>(config.sampleRate)));
    jsConfig.setProperty(rt, "channels", jsi::Value(config.channels));

    if (config.type == EFFECT_TYPE_COMPRESSOR) {
        jsi::Object compConfig(rt);
        compConfig.setProperty(rt, "thresholdDb", jsi::Value(config.config.compressor.thresholdDb));
        compConfig.setProperty(rt, "ratio", jsi::Value(config.config.compressor.ratio));
        compConfig.setProperty(rt, "attackMs", jsi::Value(config.config.compressor.attackMs));
        compConfig.setProperty(rt, "releaseMs", jsi::Value(config.config.compressor.releaseMs));
        compConfig.setProperty(rt, "makeupDb", jsi::Value(config.config.compressor.makeupDb));
        jsConfig.setProperty(rt, "compressor", std::move(compConfig));
    } else if (config.type == EFFECT_TYPE_DELAY) {
        jsi::Object delayConfig(rt);
        delayConfig.setProperty(rt, "delayMs", jsi::Value(config.config.delay.delayMs));
        delayConfig.setProperty(rt, "feedback", jsi::Value(config.config.delay.feedback));
        delayConfig.setProperty(rt, "mix", jsi::Value(config.config.delay.mix));
        jsConfig.setProperty(rt, "delay", std::move(delayConfig));
    }

    return jsConfig;
}

jsi::Object NativeAudioEffectsModule::statisticsToJS(jsi::Runtime& rt, const NythEffectsStatistics& stats) {
    jsi::Object jsStats(rt);

    jsStats.setProperty(rt, "inputLevel", jsi::Value(stats.inputLevel));
    jsStats.setProperty(rt, "outputLevel", jsi::Value(stats.outputLevel));
    jsStats.setProperty(rt, "processedFrames", jsi::Value(static_cast<double>(stats.processedFrames)));
    jsStats.setProperty(rt, "processedSamples", jsi::Value(static_cast<double>(stats.processedSamples)));
    jsStats.setProperty(rt, "durationMs", jsi::Value(static_cast<double>(stats.durationMs)));
    jsStats.setProperty(rt, "activeEffectsCount", jsi::Value(stats.activeEffectsCount));

    return jsStats;
}

jsi::Array NativeAudioEffectsModule::effectIdsToJS(jsi::Runtime& rt, const std::vector<int>& effectIds) {
    jsi::Array jsArray(rt, effectIds.size());
    for (size_t i = 0; i < effectIds.size(); ++i) {
        jsArray.setValueAtIndex(rt, i, jsi::Value(effectIds[i]));
    }

    return jsArray;
}

void NativeAudioEffectsModule::invokeJSCallback(const std::string& callbackName,
                                                std::function<void(jsi::Runtime&)> invocation) {
    // Utiliser le jsInvoker pour exécuter le callback sur le thread JavaScript principal
    if (jsInvoker_ && runtime_) {
        // Capturer le runtime pour l'utiliser dans le callback
        auto runtime = runtime_;

        jsInvoker_->invokeAsync([runtime, invocation = std::move(invocation)]() {
            try {
                // Exécuter la fonction d'invocation avec le runtime
                if (runtime) {
                    invocation(*runtime);
                }
            } catch (const jsi::JSError& e) {
                // En production, on pourrait logger cette erreur
                // Pour l'instant, on évite juste le crash
            } catch (const std::exception& e) {
                // Gérer les autres exceptions
            }
        });
    }
}

// === Méthodes publiques ===

void NativeAudioEffectsModule::initialize(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    try {
        // Stocker la référence au runtime
        runtime_ = &rt;

        // Initialiser la chaîne d'effets
        initializeEffectChain();

    } catch (const std::exception& e) {
        handleError(std::string("Initialization failed: ") + e.what());
        throw jsi::JSError(rt, std::string("Failed to initialize audio effects: ") + e.what());
    }
}

jsi::Value NativeAudioEffectsModule::start(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    if (!effectChain_) {
        initializeEffectChain();
    }

    if (effectChain_) {
        currentState_ = EFFECTS_STATE_PROCESSING;
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioEffectsModule::stop(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    if (effectChain_) {
        currentState_ = EFFECTS_STATE_INITIALIZED;
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioEffectsModule::dispose(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    if (effectChain_) {
        effectChain_.reset();
        activeEffects_.clear();
        currentState_ = EFFECTS_STATE_UNINITIALIZED;
    }

    return jsi::Value(true);
}

jsi::Value NativeAudioEffectsModule::getState(jsi::Runtime& rt) {
    return jsi::String::createFromUtf8(rt, stateToString(currentState_.load()));
}

jsi::Value NativeAudioEffectsModule::getStatistics(jsi::Runtime& rt) {
    NythEffectsStatistics stats = {0};
    stats.inputLevel = 0.0f;
    stats.outputLevel = 0.0f;
    stats.processedFrames = 0;
    stats.processedSamples = 0;
    stats.durationMs = 0;
    stats.activeEffectsCount = static_cast<int>(activeEffects_.size());

    return statisticsToJS(rt, stats);
}

jsi::Value NativeAudioEffectsModule::resetStatistics(jsi::Runtime& rt) {
    // Réinitialiser les statistiques locales si nécessaire
    return jsi::Value(true);
}

jsi::Value NativeAudioEffectsModule::createEffect(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    try {
        auto nativeConfig = parseEffectConfig(rt, config);

        // Créer l'effet directement dans notre module
        std::unique_ptr<AudioFX::IAudioEffect> effect;

        switch (nativeConfig.type) {
            case EFFECT_TYPE_COMPRESSOR: {
                auto compressor = std::make_unique<AudioFX::CompressorEffect>();
                compressor->setParameters(nativeConfig.config.compressor.thresholdDb,
                                          nativeConfig.config.compressor.ratio, nativeConfig.config.compressor.attackMs,
                                          nativeConfig.config.compressor.releaseMs,
                                          nativeConfig.config.compressor.makeupDb);
                compressor->setSampleRate(currentSampleRate_, currentChannels_);
                compressor->setEnabled(nativeConfig.enabled);
                effect = std::move(compressor);
                break;
            }
            case EFFECT_TYPE_DELAY: {
                auto delay = std::make_unique<AudioFX::DelayEffect>();
                delay->setParameters(nativeConfig.config.delay.delayMs, nativeConfig.config.delay.feedback,
                                     nativeConfig.config.delay.mix);
                delay->setSampleRate(currentSampleRate_, currentChannels_);
                delay->setEnabled(nativeConfig.enabled);
                effect = std::move(delay);
                break;
            }
            default:
                throw jsi::JSError(rt, "Unknown effect type");
        }

        // Générer un ID unique
        int effectId = nextEffectId_++;

        // Ajouter l'effet à notre map locale
        activeEffects_[effectId] = std::move(effect);

        // Ajouter aussi à la chaîne d'effets si elle existe
        if (effectChain_) {
            // Note: effectChain_ ne supporte pas l'ajout dynamique après création
            // Il faudrait recréer la chaîne ou implémenter une méthode addEffect
            // Pour l'instant, on garde l'effet dans activeEffects_ pour un traitement manuel
        }

        return jsi::Value(effectId);

    } catch (const std::exception& e) {
        handleError(std::string("Create effect failed: ") + e.what());
        throw jsi::JSError(rt, std::string("Failed to create effect: ") + e.what());
    }
}

jsi::Value NativeAudioEffectsModule::destroyEffect(jsi::Runtime& rt, int effectId) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    auto it = activeEffects_.find(effectId);
    if (it != activeEffects_.end()) {
        activeEffects_.erase(it);
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioEffectsModule::updateEffect(jsi::Runtime& rt, int effectId, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    try {
        auto nativeConfig = parseEffectConfig(rt, config);
        nativeConfig.effectId = effectId;

        auto it = activeEffects_.find(effectId);
        if (it != activeEffects_.end()) {
            switch (nativeConfig.type) {
                case EFFECT_TYPE_COMPRESSOR: {
                    if (auto compressor = dynamic_cast<AudioFX::CompressorEffect*>(it->second.get())) {
                        compressor->setParameters(
                            nativeConfig.config.compressor.thresholdDb, nativeConfig.config.compressor.ratio,
                            nativeConfig.config.compressor.attackMs, nativeConfig.config.compressor.releaseMs,
                            nativeConfig.config.compressor.makeupDb);
                        return jsi::Value(true);
                    }
                    break;
                }
                case EFFECT_TYPE_DELAY: {
                    if (auto delay = dynamic_cast<AudioFX::DelayEffect*>(it->second.get())) {
                        delay->setParameters(nativeConfig.config.delay.delayMs, nativeConfig.config.delay.feedback,
                                             nativeConfig.config.delay.mix);
                        return jsi::Value(true);
                    }
                    break;
                }
                default:
                    break;
            }
        }
    } catch (const std::exception& e) {
        handleError(std::string("Update effect failed: ") + e.what());
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioEffectsModule::getEffectConfig(jsi::Runtime& rt, int effectId) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    auto it = activeEffects_.find(effectId);
    if (it != activeEffects_.end()) {
        NythEffectConfig config = {};
        config.effectId = effectId;

        if (auto compressor = dynamic_cast<AudioFX::CompressorEffect*>(it->second.get())) {
            config.type = EFFECT_TYPE_COMPRESSOR;
            config.config.compressor.thresholdDb = AudioFX::DEFAULT_THRESHOLD_DB;
            config.config.compressor.ratio = AudioFX::DEFAULT_RATIO;
            config.config.compressor.attackMs = AudioFX::DEFAULT_ATTACK_MS;
            config.config.compressor.releaseMs = AudioFX::DEFAULT_RELEASE_MS;
            config.config.compressor.makeupDb = AudioFX::DEFAULT_MAKEUP_DB;
        } else if (auto delay = dynamic_cast<AudioFX::DelayEffect*>(it->second.get())) {
            config.type = EFFECT_TYPE_DELAY;
            config.config.delay.delayMs = AudioFX::DEFAULT_DELAY_MS;
            config.config.delay.feedback = AudioFX::DEFAULT_FEEDBACK;
            config.config.delay.mix = AudioFX::DEFAULT_MIX;
        } else {
            config.type = EFFECT_TYPE_UNKNOWN;
        }

        config.enabled = it->second->isEnabled();
        config.sampleRate = currentSampleRate_;
        config.channels = currentChannels_;

        return effectConfigToJS(rt, config);
    }

    return jsi::Value::null();
}

jsi::Value NativeAudioEffectsModule::enableEffect(jsi::Runtime& rt, int effectId, bool enabled) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    auto it = activeEffects_.find(effectId);
    if (it != activeEffects_.end()) {
        it->second->setEnabled(enabled);
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioEffectsModule::isEffectEnabled(jsi::Runtime& rt, int effectId) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    auto it = activeEffects_.find(effectId);
    if (it != activeEffects_.end()) {
        return jsi::Value(it->second->isEnabled());
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioEffectsModule::getActiveEffectsCount(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(effectsMutex_);
    return jsi::Value(static_cast<int>(activeEffects_.size()));
}

jsi::Value NativeAudioEffectsModule::getActiveEffectIds(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    std::vector<int> effectIds;
    for (const auto& pair : activeEffects_) {
        effectIds.push_back(pair.first);
    }

    return effectIdsToJS(rt, effectIds);
}

jsi::Value NativeAudioEffectsModule::setCompressorParameters(jsi::Runtime& rt, int effectId, float thresholdDb,
                                                             float ratio, float attackMs, float releaseMs,
                                                             float makeupDb) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    auto it = activeEffects_.find(effectId);
    if (it != activeEffects_.end()) {
        if (auto compressor = dynamic_cast<AudioFX::CompressorEffect*>(it->second.get())) {
            compressor->setParameters(thresholdDb, ratio, attackMs, releaseMs, makeupDb);
            return jsi::Value(true);
        }
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioEffectsModule::getCompressorParameters(jsi::Runtime& rt, int effectId) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    auto it = activeEffects_.find(effectId);
    if (it != activeEffects_.end()) {
        if (auto compressor = dynamic_cast<AudioFX::CompressorEffect*>(it->second.get())) {
            jsi::Object params(rt);
            params.setProperty(rt, "thresholdDb", jsi::Value(AudioFX::DEFAULT_THRESHOLD_DB));
            params.setProperty(rt, "ratio", jsi::Value(AudioFX::DEFAULT_RATIO));
            params.setProperty(rt, "attackMs", jsi::Value(AudioFX::DEFAULT_ATTACK_MS));
            params.setProperty(rt, "releaseMs", jsi::Value(AudioFX::DEFAULT_RELEASE_MS));
            params.setProperty(rt, "makeupDb", jsi::Value(AudioFX::DEFAULT_MAKEUP_DB));
            return params;
        }
    }

    return jsi::Value::null();
}

jsi::Value NativeAudioEffectsModule::setDelayParameters(jsi::Runtime& rt, int effectId, float delayMs, float feedback,
                                                        float mix) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    auto it = activeEffects_.find(effectId);
    if (it != activeEffects_.end()) {
        if (auto delay = dynamic_cast<AudioFX::DelayEffect*>(it->second.get())) {
            delay->setParameters(delayMs, feedback, mix);
            return jsi::Value(true);
        }
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioEffectsModule::getDelayParameters(jsi::Runtime& rt, int effectId) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    auto it = activeEffects_.find(effectId);
    if (it != activeEffects_.end()) {
        if (auto delay = dynamic_cast<AudioFX::DelayEffect*>(it->second.get())) {
            jsi::Object params(rt);
            params.setProperty(rt, "delayMs", jsi::Value(AudioFX::DEFAULT_DELAY_MS));
            params.setProperty(rt, "feedback", jsi::Value(AudioFX::DEFAULT_FEEDBACK));
            params.setProperty(rt, "mix", jsi::Value(AudioFX::DEFAULT_MIX));
            return params;
        }
    }

    return jsi::Value::null();
}

jsi::Value NativeAudioEffectsModule::processAudio(jsi::Runtime& rt, const jsi::Array& input, int channels) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    size_t frameCount = input.length(rt) / channels;
    std::vector<float> inputBuffer(input.length(rt));
    std::vector<float> outputBuffer(input.length(rt));

    // Convertir l'array JSI en buffer C++
    for (size_t i = 0; i < input.length(rt); ++i) {
        inputBuffer[i] = static_cast<float>(input.getValueAtIndex(rt, i).asNumber());
    }

    // Traiter avec la chaîne d'effets locale
    if (effectChain_ && currentState_ == EFFECTS_STATE_PROCESSING) {
        if (channels == 1) {
            effectChain_->processMono(inputBuffer, outputBuffer);
        } else if (channels == 2) {
            // Désentrelacer pour le traitement stéréo
            std::vector<float> inputL(frameCount), inputR(frameCount);
            std::vector<float> outputL(frameCount), outputR(frameCount);

            for (size_t i = 0; i < frameCount; ++i) {
                inputL[i] = inputBuffer[i * 2];
                inputR[i] = inputBuffer[i * 2 + 1];
            }

            effectChain_->processStereo(inputL, inputR, outputL, outputR);

            for (size_t i = 0; i < frameCount; ++i) {
                outputBuffer[i * 2] = outputL[i];
                outputBuffer[i * 2 + 1] = outputR[i];
            }
        }
    } else {
        // Passthrough
        std::copy(inputBuffer.begin(), inputBuffer.end(), outputBuffer.begin());
    }

    // Convertir le résultat en array JSI
    jsi::Array result(rt, outputBuffer.size());
    for (size_t i = 0; i < outputBuffer.size(); ++i) {
        result.setValueAtIndex(rt, i, jsi::Value(outputBuffer[i]));
    }
    return result;
}

jsi::Value NativeAudioEffectsModule::processAudioStereo(jsi::Runtime& rt, const jsi::Array& inputL,
                                                        const jsi::Array& inputR) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    size_t frameCount = inputL.length(rt);
    if (frameCount != inputR.length(rt)) {
        return jsi::Value::null();
    }

    std::vector<float> inputLBuffer(frameCount);
    std::vector<float> inputRBuffer(frameCount);
    std::vector<float> outputLBuffer(frameCount);
    std::vector<float> outputRBuffer(frameCount);

    // Convertir les arrays JSI en buffers C++
    for (size_t i = 0; i < frameCount; ++i) {
        inputLBuffer[i] = static_cast<float>(inputL.getValueAtIndex(rt, i).asNumber());
        inputRBuffer[i] = static_cast<float>(inputR.getValueAtIndex(rt, i).asNumber());
    }

    // Traiter avec la chaîne d'effets locale
    if (effectChain_ && currentState_ == EFFECTS_STATE_PROCESSING) {
        effectChain_->processStereo(inputLBuffer, inputRBuffer, outputLBuffer, outputRBuffer);
    } else {
        // Passthrough
        std::copy(inputLBuffer.begin(), inputLBuffer.end(), outputLBuffer.begin());
        std::copy(inputRBuffer.begin(), inputRBuffer.end(), outputRBuffer.begin());
    }

    // Convertir les résultats en objet JSI
    jsi::Object result(rt);
    jsi::Array resultL(rt, frameCount);
    jsi::Array resultR(rt, frameCount);

    for (size_t i = 0; i < frameCount; ++i) {
        resultL.setValueAtIndex(rt, i, jsi::Value(outputLBuffer[i]));
        resultR.setValueAtIndex(rt, i, jsi::Value(outputRBuffer[i]));
    }

    result.setProperty(rt, "left", std::move(resultL));
    result.setProperty(rt, "right", std::move(resultR));
    return result;
}

jsi::Value NativeAudioEffectsModule::getInputLevel(jsi::Runtime& rt) {
    // À implémenter selon les métriques disponibles
    return jsi::Value(0.0f);
}

jsi::Value NativeAudioEffectsModule::getOutputLevel(jsi::Runtime& rt) {
    // À implémenter selon les métriques disponibles
    return jsi::Value(0.0f);
}

jsi::Value NativeAudioEffectsModule::setAudioDataCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    // Stocker le callback et le runtime
    jsCallbacks_.audioDataCallback.function = std::make_shared<jsi::Function>(callback.getFunction(rt));
    jsCallbacks_.audioDataCallback.runtime = &rt;
    runtime_ = &rt; // Stocker aussi une référence globale au runtime
    return jsi::Value(true);
}

jsi::Value NativeAudioEffectsModule::setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    // Stocker le callback et le runtime
    jsCallbacks_.errorCallback.function = std::make_shared<jsi::Function>(callback.getFunction(rt));
    jsCallbacks_.errorCallback.runtime = &rt;
    runtime_ = &rt; // Stocker aussi une référence globale au runtime
    return jsi::Value(true);
}

jsi::Value NativeAudioEffectsModule::setStateChangeCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    // Stocker le callback et le runtime
    jsCallbacks_.stateChangeCallback.function = std::make_shared<jsi::Function>(callback.getFunction(rt));
    jsCallbacks_.stateChangeCallback.runtime = &rt;
    runtime_ = &rt; // Stocker aussi une référence globale au runtime
    return jsi::Value(true);
}

jsi::Value NativeAudioEffectsModule::install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker) {
    // Installation directe du module dans le runtime JSI
    jsInvoker_ = jsInvoker;
    return jsi::Value(true);
}

// === Fonction d'enregistrement du module ===
std::shared_ptr<TurboModule> NativeAudioEffectsModuleProvider(std::shared_ptr<CallInvoker> jsInvoker) {
    return std::make_shared<NativeAudioEffectsModule>(jsInvoker);
}

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_EFFECTS_ENABLED
