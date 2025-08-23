#include "NativeAudioEffectsModule.h"

#if NYTH_AUDIO_EFFECTS_ENABLED

#include "Audio/effects/Compressor.hpp"
#include "Audio/effects/Delay.hpp"
#include "Audio/effects/EffectConstants.hpp"
#include <algorithm>
#include <chrono>
#include <sstream>


// === Instance globale pour l'API C ===
static std::unique_ptr<AudioFX::EffectChain> g_effectChain;
static std::map<int, std::unique_ptr<AudioFX::IAudioEffect>> g_activeEffects;
static std::atomic<int> g_nextEffectId{1};
static std::mutex g_globalMutex;
static uint32_t g_currentSampleRate = 44100;
static int g_currentChannels = 2;

// Instance statique pour les callbacks
namespace {
facebook::react::NativeAudioEffectsModule* g_moduleInstance = nullptr;
std::mutex g_instanceMutex;
} // namespace

// === Implémentation de l'API C ===
extern "C" {

bool NythEffects_Initialize(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    try {
        g_effectChain = std::make_unique<AudioFX::EffectChain>();
        g_effectChain->setSampleRate(g_currentSampleRate, g_currentChannels);
        g_activeEffects.clear();
        g_nextEffectId = 1;
        return true;
    } catch (...) {
        return false;
    }
}

bool NythEffects_Start(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_effectChain != nullptr;
}

bool NythEffects_Stop(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_effectChain != nullptr;
}

void NythEffects_Release(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    g_activeEffects.clear();
    g_effectChain.reset();
}

// === État et informations ===
NythEffectsState NythEffects_GetState(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (!g_effectChain)
        return EFFECTS_STATE_UNINITIALIZED;
    return EFFECTS_STATE_INITIALIZED;
}

void NythEffects_GetStatistics(NythEffectsStatistics* stats) {
    if (!stats)
        return;

    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (g_effectChain) {
        stats->inputLevel = 0.0f; // À implémenter selon les métriques disponibles
        stats->outputLevel = 0.0f;
        stats->processedFrames = 0;
        stats->processedSamples = 0;
        stats->durationMs = 0;
        stats->activeEffectsCount = static_cast<int>(g_activeEffects.size());
    }
}

void NythEffects_ResetStatistics(void) {
    // À implémenter si nécessaire
}

// === Gestion des effets individuels ===
int NythEffects_CreateEffect(const NythEffectConfig* config) {
    if (!config)
        return -1;

    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (!g_effectChain)
        return -1;

    try {
        std::unique_ptr<AudioFX::IAudioEffect> effect;

        switch (config->type) {
            case EFFECT_TYPE_COMPRESSOR: {
                auto compressor = std::make_unique<AudioFX::CompressorEffect>();
                compressor->setParameters(config->config.compressor.thresholdDb, config->config.compressor.ratio,
                                          config->config.compressor.attackMs, config->config.compressor.releaseMs,
                                          config->config.compressor.makeupDb);
                compressor->setSampleRate(config->sampleRate, config->channels);
                effect = std::move(compressor);
                break;
            }
            case EFFECT_TYPE_DELAY: {
                auto delay = std::make_unique<AudioFX::DelayEffect>();
                delay->setParameters(config->config.delay.delayMs, config->config.delay.feedback,
                                     config->config.delay.mix);
                delay->setSampleRate(config->sampleRate, config->channels);
                effect = std::move(delay);
                break;
            }
            default:
                return -1;
        }

        int effectId = g_nextEffectId++;
        g_activeEffects[effectId] = std::move(effect);

        // Ajouter à la chaîne d'effets - les effets sont déjà créés et configurés
        // La chaîne d'effets gère les effets individuellement

        return effectId;
    } catch (...) {
        return -1;
    }
}

bool NythEffects_DestroyEffect(int effectId) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeEffects.find(effectId);
    if (it != g_activeEffects.end()) {
        g_activeEffects.erase(it);
        // Note: La chaîne d'effets ne supporte pas la suppression individuelle
        // Il faudrait recréer la chaîne ou implémenter une méthode de suppression
        return true;
    }
    return false;
}

bool NythEffects_UpdateEffect(int effectId, const NythEffectConfig* config) {
    if (!config)
        return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeEffects.find(effectId);
    if (it != g_activeEffects.end()) {
        switch (config->type) {
            case EFFECT_TYPE_COMPRESSOR: {
                if (auto compressor = dynamic_cast<AudioFX::CompressorEffect*>(it->second.get())) {
                    compressor->setParameters(config->config.compressor.thresholdDb, config->config.compressor.ratio,
                                              config->config.compressor.attackMs, config->config.compressor.releaseMs,
                                              config->config.compressor.makeupDb);
                    return true;
                }
                break;
            }
            case EFFECT_TYPE_DELAY: {
                if (auto delay = dynamic_cast<AudioFX::DelayEffect*>(it->second.get())) {
                    delay->setParameters(config->config.delay.delayMs, config->config.delay.feedback,
                                         config->config.delay.mix);
                    return true;
                }
                break;
            }
            default:
                break;
        }
    }
    return false;
}

bool NythEffects_GetEffectConfig(int effectId, NythEffectConfig* config) {
    if (!config)
        return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeEffects.find(effectId);
    if (it != g_activeEffects.end()) {
        config->effectId = effectId;

        if (auto compressor = dynamic_cast<AudioFX::CompressorEffect*>(it->second.get())) {
            config->type = EFFECT_TYPE_COMPRESSOR;
            // Note: Il faudrait ajouter des getters dans les classes d'effets pour récupérer les paramètres
            config->config.compressor.thresholdDb = AudioFX::DEFAULT_THRESHOLD_DB;
            config->config.compressor.ratio = AudioFX::DEFAULT_RATIO;
            config->config.compressor.attackMs = AudioFX::DEFAULT_ATTACK_MS;
            config->config.compressor.releaseMs = AudioFX::DEFAULT_RELEASE_MS;
            config->config.compressor.makeupDb = AudioFX::DEFAULT_MAKEUP_DB;
        } else if (auto delay = dynamic_cast<AudioFX::DelayEffect*>(it->second.get())) {
            config->type = EFFECT_TYPE_DELAY;
            config->config.delay.delayMs = AudioFX::DEFAULT_DELAY_MS;
            config->config.delay.feedback = AudioFX::DEFAULT_FEEDBACK;
            config->config.delay.mix = AudioFX::DEFAULT_MIX;
        } else {
            config->type = EFFECT_TYPE_UNKNOWN;
        }

        config->enabled = it->second->isEnabled();
        config->sampleRate = g_currentSampleRate;
        config->channels = g_currentChannels;

        return true;
    }
    return false;
}

// === Contrôle des effets ===
bool NythEffects_EnableEffect(int effectId, bool enabled) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeEffects.find(effectId);
    if (it != g_activeEffects.end()) {
        it->second->setEnabled(enabled);
        return true;
    }
    return false;
}

bool NythEffects_IsEffectEnabled(int effectId) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeEffects.find(effectId);
    if (it != g_activeEffects.end()) {
        return it->second->isEnabled();
    }
    return false;
}

int NythEffects_GetActiveEffectsCount(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return static_cast<int>(g_activeEffects.size());
}

const int* NythEffects_GetActiveEffectIds(size_t* count) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    static std::vector<int> effectIds;
    effectIds.clear();

    for (const auto& pair : g_activeEffects) {
        effectIds.push_back(pair.first);
    }

    if (count) {
        *count = effectIds.size();
    }

    return effectIds.data();
}

// === Configuration des effets spécifiques ===

// Compresseur
bool NythEffects_SetCompressorParameters(int effectId, float thresholdDb, float ratio, float attackMs, float releaseMs,
                                         float makeupDb) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeEffects.find(effectId);
    if (it != g_activeEffects.end()) {
        if (auto compressor = dynamic_cast<AudioFX::CompressorEffect*>(it->second.get())) {
            compressor->setParameters(thresholdDb, ratio, attackMs, releaseMs, makeupDb);
            return true;
        }
    }
    return false;
}

bool NythEffects_GetCompressorParameters(int effectId, float* thresholdDb, float* ratio, float* attackMs,
                                         float* releaseMs, float* makeupDb) {
    if (!thresholdDb || !ratio || !attackMs || !releaseMs || !makeupDb)
        return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeEffects.find(effectId);
    if (it != g_activeEffects.end()) {
        if (auto compressor = dynamic_cast<AudioFX::CompressorEffect*>(it->second.get())) {
            // Note: Il faudrait ajouter des getters dans CompressorEffect
            *thresholdDb = AudioFX::DEFAULT_THRESHOLD_DB;
            *ratio = AudioFX::DEFAULT_RATIO;
            *attackMs = AudioFX::DEFAULT_ATTACK_MS;
            *releaseMs = AudioFX::DEFAULT_RELEASE_MS;
            *makeupDb = AudioFX::DEFAULT_MAKEUP_DB;
            return true;
        }
    }
    return false;
}

// Délai
bool NythEffects_SetDelayParameters(int effectId, float delayMs, float feedback, float mix) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeEffects.find(effectId);
    if (it != g_activeEffects.end()) {
        if (auto delay = dynamic_cast<AudioFX::DelayEffect*>(it->second.get())) {
            delay->setParameters(delayMs, feedback, mix);
            return true;
        }
    }
    return false;
}

bool NythEffects_GetDelayParameters(int effectId, float* delayMs, float* feedback, float* mix) {
    if (!delayMs || !feedback || !mix)
        return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeEffects.find(effectId);
    if (it != g_activeEffects.end()) {
        if (auto delay = dynamic_cast<AudioFX::DelayEffect*>(it->second.get())) {
            // Note: Il faudrait ajouter des getters dans DelayEffect
            *delayMs = AudioFX::DEFAULT_DELAY_MS;
            *feedback = AudioFX::DEFAULT_FEEDBACK;
            *mix = AudioFX::DEFAULT_MIX;
            return true;
        }
    }
    return false;
}

// === Traitement audio ===
bool NythEffects_ProcessAudio(const float* input, float* output, size_t frameCount, int channels) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (!g_effectChain || !input || !output || frameCount == 0) {
        return false;
    }

    try {
        // Convertir en vecteurs pour l'API EffectChain
        std::vector<float> inputVec(input, input + (frameCount * channels));
        std::vector<float> outputVec(frameCount * channels);

        if (channels == 1) {
            g_effectChain->processMono(inputVec, outputVec);
        } else {
            // Pour stéréo, désentrelacer et traiter
            std::vector<float> inputL(frameCount), inputR(frameCount);
            std::vector<float> outputL(frameCount), outputR(frameCount);

            for (size_t i = 0; i < frameCount; ++i) {
                inputL[i] = input[i * 2];
                inputR[i] = input[i * 2 + 1];
            }

            g_effectChain->processStereo(inputL, inputR, outputL, outputR);

            for (size_t i = 0; i < frameCount; ++i) {
                output[i * 2] = outputL[i];
                output[i * 2 + 1] = outputR[i];
            }
        }

        return true;
    } catch (...) {
        return false;
    }
}

bool NythEffects_ProcessAudioStereo(const float* inputL, const float* inputR, float* outputL, float* outputR,
                                    size_t frameCount) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (!g_effectChain || !inputL || !inputR || !outputL || !outputR || frameCount == 0) {
        return false;
    }

    try {
        // Convertir en vecteurs pour l'API EffectChain
        std::vector<float> inputLVec(inputL, inputL + frameCount);
        std::vector<float> inputRVec(inputR, inputR + frameCount);
        std::vector<float> outputLVec(frameCount);
        std::vector<float> outputRVec(frameCount);

        g_effectChain->processStereo(inputLVec, inputRVec, outputLVec, outputRVec);

        // Copier les résultats
        std::copy(outputLVec.begin(), outputLVec.end(), outputL);
        std::copy(outputRVec.begin(), outputRVec.end(), outputR);

        return true;
    } catch (...) {
        return false;
    }
}

// === Analyse audio ===
float NythEffects_GetInputLevel(void) {
    // À implémenter selon les métriques disponibles
    return 0.0f;
}

float NythEffects_GetOutputLevel(void) {
    // À implémenter selon les métriques disponibles
    return 0.0f;
}

// === Callbacks ===
static NythEffectsDataCallback g_dataCallback = nullptr;
static NythEffectsErrorCallback g_errorCallback = nullptr;
static NythEffectsStateChangeCallback g_stateChangeCallback = nullptr;

void NythEffects_SetAudioDataCallback(NythEffectsDataCallback callback) {
    g_dataCallback = callback;
}

void NythEffects_SetErrorCallback(NythEffectsErrorCallback callback) {
    g_errorCallback = callback;
}

void NythEffects_SetStateChangeCallback(NythEffectsStateChangeCallback callback) {
    g_stateChangeCallback = callback;
}

} // extern "C"

// === Implémentation C++ pour TurboModule ===

namespace facebook {
namespace react {

NativeAudioEffectsModule::~NativeAudioEffectsModule() {
    // Nettoyer l'instance globale
    {
        std::lock_guard<std::mutex> instanceLock(g_instanceMutex);
        if (g_moduleInstance == this) {
            g_moduleInstance = nullptr;
        }
    }

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
                // Dans un environnement de production, on pourrait logger ceci
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

        // Enregistrer cette instance comme instance globale
        {
            std::lock_guard<std::mutex> instanceLock(g_instanceMutex);
            g_moduleInstance = this;
        }

        // Initialiser la chaîne d'effets
        initializeEffectChain();

        // Configurer les callbacks C globaux pour rediriger vers cette instance
        NythEffects_SetAudioDataCallback([](const float* input, float* output, size_t frameCount, int channels) {
            std::lock_guard<std::mutex> instanceLock(g_instanceMutex);
            if (g_moduleInstance) {
                g_moduleInstance->handleAudioData(input, output, frameCount, channels);
            }
        });

        NythEffects_SetErrorCallback([](const char* error) {
            std::lock_guard<std::mutex> instanceLock(g_instanceMutex);
            if (g_moduleInstance) {
                g_moduleInstance->handleError(std::string(error));
            }
        });

        NythEffects_SetStateChangeCallback([](NythEffectsState oldState, NythEffectsState newState) {
            std::lock_guard<std::mutex> instanceLock(g_instanceMutex);
            if (g_moduleInstance) {
                g_moduleInstance->handleStateChange(oldState, newState);
            }
        });

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
    NythEffects_GetStatistics(&stats);
    return statisticsToJS(rt, stats);
}

jsi::Value NativeAudioEffectsModule::resetStatistics(jsi::Runtime& rt) {
    NythEffects_ResetStatistics();
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

        // Appeler aussi l'API C pour la compatibilité
        nativeConfig.effectId = effectId;
        int cEffectId = NythEffects_CreateEffect(&nativeConfig);

        return jsi::Value(effectId);

    } catch (const std::exception& e) {
        handleError(std::string("Create effect failed: ") + e.what());
        throw jsi::JSError(rt, std::string("Failed to create effect: ") + e.what());
    }
}

jsi::Value NativeAudioEffectsModule::destroyEffect(jsi::Runtime& rt, int effectId) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    if (NythEffects_DestroyEffect(effectId)) {
        activeEffects_.erase(effectId);
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioEffectsModule::updateEffect(jsi::Runtime& rt, int effectId, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    try {
        auto nativeConfig = parseEffectConfig(rt, config);
        nativeConfig.effectId = effectId;

        if (NythEffects_UpdateEffect(effectId, &nativeConfig)) {
            return jsi::Value(true);
        }
    } catch (const std::exception& e) {
        handleError(std::string("Update effect failed: ") + e.what());
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioEffectsModule::getEffectConfig(jsi::Runtime& rt, int effectId) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    NythEffectConfig config;
    if (NythEffects_GetEffectConfig(effectId, &config)) {
        return effectConfigToJS(rt, config);
    }

    return jsi::Value::null();
}

jsi::Value NativeAudioEffectsModule::enableEffect(jsi::Runtime& rt, int effectId, bool enabled) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    if (NythEffects_EnableEffect(effectId, enabled)) {
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioEffectsModule::isEffectEnabled(jsi::Runtime& rt, int effectId) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    return jsi::Value(NythEffects_IsEffectEnabled(effectId));
}

jsi::Value NativeAudioEffectsModule::getActiveEffectsCount(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    return jsi::Value(NythEffects_GetActiveEffectsCount());
}

jsi::Value NativeAudioEffectsModule::getActiveEffectIds(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    size_t count = 0;
    const int* ids = NythEffects_GetActiveEffectIds(&count);

    std::vector<int> effectIds(ids, ids + count);
    return effectIdsToJS(rt, effectIds);
}

jsi::Value NativeAudioEffectsModule::setCompressorParameters(jsi::Runtime& rt, int effectId, float thresholdDb,
                                                             float ratio, float attackMs, float releaseMs,
                                                             float makeupDb) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    if (NythEffects_SetCompressorParameters(effectId, thresholdDb, ratio, attackMs, releaseMs, makeupDb)) {
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioEffectsModule::getCompressorParameters(jsi::Runtime& rt, int effectId) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    float thresholdDb, ratio, attackMs, releaseMs, makeupDb;
    if (NythEffects_GetCompressorParameters(effectId, &thresholdDb, &ratio, &attackMs, &releaseMs, &makeupDb)) {
        jsi::Object params(rt);
        params.setProperty(rt, "thresholdDb", jsi::Value(thresholdDb));
        params.setProperty(rt, "ratio", jsi::Value(ratio));
        params.setProperty(rt, "attackMs", jsi::Value(attackMs));
        params.setProperty(rt, "releaseMs", jsi::Value(releaseMs));
        params.setProperty(rt, "makeupDb", jsi::Value(makeupDb));
        return params;
    }

    return jsi::Value::null();
}

jsi::Value NativeAudioEffectsModule::setDelayParameters(jsi::Runtime& rt, int effectId, float delayMs, float feedback,
                                                        float mix) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    if (NythEffects_SetDelayParameters(effectId, delayMs, feedback, mix)) {
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioEffectsModule::getDelayParameters(jsi::Runtime& rt, int effectId) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    float delayMs, feedback, mix;
    if (NythEffects_GetDelayParameters(effectId, &delayMs, &feedback, &mix)) {
        jsi::Object params(rt);
        params.setProperty(rt, "delayMs", jsi::Value(delayMs));
        params.setProperty(rt, "feedback", jsi::Value(feedback));
        params.setProperty(rt, "mix", jsi::Value(mix));
        return params;
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

    if (NythEffects_ProcessAudio(inputBuffer.data(), outputBuffer.data(), frameCount, channels)) {
        // Convertir le résultat en array JSI
        jsi::Array result(rt, outputBuffer.size());
        for (size_t i = 0; i < outputBuffer.size(); ++i) {
            result.setValueAtIndex(rt, i, jsi::Value(outputBuffer[i]));
        }
        return result;
    }

    return jsi::Value::null();
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

    if (NythEffects_ProcessAudioStereo(inputLBuffer.data(), inputRBuffer.data(), outputLBuffer.data(),
                                       outputRBuffer.data(), frameCount)) {
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

    return jsi::Value::null();
}

jsi::Value NativeAudioEffectsModule::getInputLevel(jsi::Runtime& rt) {
    return jsi::Value(NythEffects_GetInputLevel());
}

jsi::Value NativeAudioEffectsModule::getOutputLevel(jsi::Runtime& rt) {
    return jsi::Value(NythEffects_GetOutputLevel());
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
    // À implémenter selon les besoins
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
