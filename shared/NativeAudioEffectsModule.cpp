#include "NativeAudioEffectsModule.h"

#if NYTH_AUDIO_EFFECTS_ENABLED

#include "Audio/effects/Compressor.hpp"
#include "Audio/effects/Delay.hpp"
#include "Audio/effects/EffectConstants.hpp"
#include <chrono>
#include <sstream>
#include <algorithm>

// === Instance globale pour l'API C ===
static std::unique_ptr<Nyth::Audio::EffectChain> g_effectChain;
static std::map<int, std::unique_ptr<Nyth::Audio::IAudioEffect>> g_activeEffects;
static std::atomic<int> g_nextEffectId{1};
static std::mutex g_globalMutex;
static uint32_t g_currentSampleRate = 44100;
static int g_currentChannels = 2;

// === Implémentation de l'API C ===
extern "C" {

bool NythEffects_Initialize(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    try {
        g_effectChain = std::make_unique<Nyth::Audio::EffectChain>();
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
    if (!g_effectChain) return EFFECTS_STATE_UNINITIALIZED;
    return EFFECTS_STATE_INITIALIZED;
}

void NythEffects_GetStatistics(NythEffectsStatistics* stats) {
    if (!stats) return;

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
    if (!config) return -1;

    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (!g_effectChain) return -1;

    try {
        std::unique_ptr<Nyth::Audio::IAudioEffect> effect;

        switch (config->type) {
            case EFFECT_TYPE_COMPRESSOR: {
                auto compressor = std::make_unique<Nyth::Audio::CompressorEffect>();
                compressor->setParameters(
                    config->config.compressor.thresholdDb,
                    config->config.compressor.ratio,
                    config->config.compressor.attackMs,
                    config->config.compressor.releaseMs,
                    config->config.compressor.makeupDb
                );
                compressor->setSampleRate(config->sampleRate, config->channels);
                effect = std::move(compressor);
                break;
            }
            case EFFECT_TYPE_DELAY: {
                auto delay = std::make_unique<Nyth::Audio::DelayEffect>();
                delay->setParameters(
                    config->config.delay.delayMs,
                    config->config.delay.feedback,
                    config->config.delay.mix
                );
                delay->setSampleRate(config->sampleRate, config->channels);
                effect = std::move(delay);
                break;
            }
            default:
                return -1;
        }

        int effectId = g_nextEffectId++;
        g_activeEffects[effectId] = std::move(effect);

        // Ajouter à la chaîne d'effets
        if (auto compressor = dynamic_cast<Nyth::Audio::CompressorEffect*>(g_activeEffects[effectId].get())) {
            g_effectChain->emplaceEffect<Nyth::Audio::CompressorEffect>(
                config->config.compressor.thresholdDb,
                config->config.compressor.ratio,
                config->config.compressor.attackMs,
                config->config.compressor.releaseMs,
                config->config.compressor.makeupDb
            );
        } else if (auto delay = dynamic_cast<Nyth::Audio::DelayEffect*>(g_activeEffects[effectId].get())) {
            g_effectChain->emplaceEffect<Nyth::Audio::DelayEffect>(
                config->config.delay.delayMs,
                config->config.delay.feedback,
                config->config.delay.mix
            );
        }

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
    if (!config) return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeEffects.find(effectId);
    if (it != g_activeEffects.end()) {
        switch (config->type) {
            case EFFECT_TYPE_COMPRESSOR: {
                if (auto compressor = dynamic_cast<Nyth::Audio::CompressorEffect*>(it->second.get())) {
                    compressor->setParameters(
                        config->config.compressor.thresholdDb,
                        config->config.compressor.ratio,
                        config->config.compressor.attackMs,
                        config->config.compressor.releaseMs,
                        config->config.compressor.makeupDb
                    );
                    return true;
                }
                break;
            }
            case EFFECT_TYPE_DELAY: {
                if (auto delay = dynamic_cast<Nyth::Audio::DelayEffect*>(it->second.get())) {
                    delay->setParameters(
                        config->config.delay.delayMs,
                        config->config.delay.feedback,
                        config->config.delay.mix
                    );
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
    if (!config) return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeEffects.find(effectId);
    if (it != g_activeEffects.end()) {
        config->effectId = effectId;

        if (auto compressor = dynamic_cast<Nyth::Audio::CompressorEffect*>(it->second.get())) {
            config->type = EFFECT_TYPE_COMPRESSOR;
            // Note: Il faudrait ajouter des getters dans les classes d'effets pour récupérer les paramètres
            config->config.compressor.thresholdDb = AudioFX::DEFAULT_THRESHOLD_DB;
            config->config.compressor.ratio = AudioFX::DEFAULT_RATIO;
            config->config.compressor.attackMs = AudioFX::DEFAULT_ATTACK_MS;
            config->config.compressor.releaseMs = AudioFX::DEFAULT_RELEASE_MS;
            config->config.compressor.makeupDb = AudioFX::DEFAULT_MAKEUP_DB;
        } else if (auto delay = dynamic_cast<Nyth::Audio::DelayEffect*>(it->second.get())) {
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
bool NythEffects_SetCompressorParameters(int effectId, float thresholdDb, float ratio,
                                       float attackMs, float releaseMs, float makeupDb) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeEffects.find(effectId);
    if (it != g_activeEffects.end()) {
        if (auto compressor = dynamic_cast<Nyth::Audio::CompressorEffect*>(it->second.get())) {
            compressor->setParameters(thresholdDb, ratio, attackMs, releaseMs, makeupDb);
            return true;
        }
    }
    return false;
}

bool NythEffects_GetCompressorParameters(int effectId, float* thresholdDb, float* ratio,
                                       float* attackMs, float* releaseMs, float* makeupDb) {
    if (!thresholdDb || !ratio || !attackMs || !releaseMs || !makeupDb) return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeEffects.find(effectId);
    if (it != g_activeEffects.end()) {
        if (auto compressor = dynamic_cast<Nyth::Audio::CompressorEffect*>(it->second.get())) {
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
        if (auto delay = dynamic_cast<Nyth::Audio::DelayEffect*>(it->second.get())) {
            delay->setParameters(delayMs, feedback, mix);
            return true;
        }
    }
    return false;
}

bool NythEffects_GetDelayParameters(int effectId, float* delayMs, float* feedback, float* mix) {
    if (!delayMs || !feedback || !mix) return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeEffects.find(effectId);
    if (it != g_activeEffects.end()) {
        if (auto delay = dynamic_cast<Nyth::Audio::DelayEffect*>(it->second.get())) {
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

bool NythEffects_ProcessAudioStereo(const float* inputL, const float* inputR,
                                   float* outputL, float* outputR, size_t frameCount) {
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

NativeAudioEffectsModule::NativeAudioEffectsModule(std::shared_ptr<CallInvoker> jsInvoker)
    : TurboModule(jsInvoker) {
    currentSampleRate_ = 44100;
    currentChannels_ = 2;
}

NativeAudioEffectsModule::~NativeAudioEffectsModule() {
    std::lock_guard<std::mutex> lock(effectsMutex_);
    if (effectChain_) {
        effectChain_.reset();
    }
    activeEffects_.clear();
}

// === Méthodes privées ===

void NativeAudioEffectsModule::initializeEffectChain() {
    effectChain_ = std::make_unique<Nyth::Audio::EffectChain>();
    effectChain_->setSampleRate(currentSampleRate_, currentChannels_);
    currentState_ = EFFECTS_STATE_INITIALIZED;
}

bool NativeAudioEffectsModule::validateEffectId(int effectId) const {
    return activeEffects_.find(effectId) != activeEffects_.end();
}

NythEffectType NativeAudioEffectsModule::stringToEffectType(const std::string& typeStr) const {
    if (typeStr == "compressor") return EFFECT_TYPE_COMPRESSOR;
    if (typeStr == "delay") return EFFECT_TYPE_DELAY;
    return EFFECT_TYPE_UNKNOWN;
}

std::string NativeAudioEffectsModule::effectTypeToString(NythEffectType type) const {
    switch (type) {
        case EFFECT_TYPE_COMPRESSOR: return "compressor";
        case EFFECT_TYPE_DELAY: return "delay";
        default: return "unknown";
    }
}

void NativeAudioEffectsModule::handleAudioData(const float* input, float* output,
                                             size_t frameCount, int channels) {
    // Callback pour les données audio traitées
}

void NativeAudioEffectsModule::handleError(const std::string& error) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    if (jsCallbacks_.errorCallback) {
        invokeJSCallback("errorCallback", [error](jsi::Runtime& rt) {
            jsi::String errorStr = jsi::String::createFromUtf8(rt, error);
            // jsCallbacks_.errorCallback->call(rt, errorStr);
        });
    }
}

void NativeAudioEffectsModule::handleStateChange(NythEffectsState oldState,
                                               NythEffectsState newState) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    if (jsCallbacks_.stateChangeCallback) {
        invokeJSCallback("stateChangeCallback", [oldState, newState, this](jsi::Runtime& rt) {
            std::string oldStateStr = stateToString(oldState);
            std::string newStateStr = stateToString(newState);
            jsi::String oldStateJS = jsi::String::createFromUtf8(rt, oldStateStr);
            jsi::String newStateJS = jsi::String::createFromUtf8(rt, newStateStr);
            // jsCallbacks_.stateChangeCallback->call(rt, oldStateJS, newStateJS);
        });
    }
}

std::string NativeAudioEffectsModule::stateToString(NythEffectsState state) const {
    switch (state) {
        case EFFECTS_STATE_UNINITIALIZED: return "uninitialized";
        case EFFECTS_STATE_INITIALIZED: return "initialized";
        case EFFECTS_STATE_PROCESSING: return "processing";
        case EFFECTS_STATE_ERROR: return "error";
        default: return "unknown";
    }
}

NythEffectConfig NativeAudioEffectsModule::parseEffectConfig(
    jsi::Runtime& rt, const jsi::Object& jsConfig) {

    NythEffectConfig config = {0};

    if (jsConfig.hasProperty(rt, "type")) {
        std::string typeStr = jsConfig.getProperty(rt, "type").asString(rt).utf8(rt);
        config.type = stringToEffectType(typeStr);
    }

    if (jsConfig.hasProperty(rt, "enabled")) {
        config.enabled = jsConfig.getProperty(rt, "enabled").asBool();
    }

    config.sampleRate = currentSampleRate_;
    config.channels = currentChannels_;

    // Configuration spécifique selon le type
    if (config.type == EFFECT_TYPE_COMPRESSOR && jsConfig.hasProperty(rt, "compressor")) {
        jsi::Object compConfig = jsConfig.getProperty(rt, "compressor").asObject(rt);
        if (compConfig.hasProperty(rt, "thresholdDb")) {
            config.config.compressor.thresholdDb = static_cast<float>(
                compConfig.getProperty(rt, "thresholdDb").asNumber());
        }
        if (compConfig.hasProperty(rt, "ratio")) {
            config.config.compressor.ratio = static_cast<float>(
                compConfig.getProperty(rt, "ratio").asNumber());
        }
        if (compConfig.hasProperty(rt, "attackMs")) {
            config.config.compressor.attackMs = static_cast<float>(
                compConfig.getProperty(rt, "attackMs").asNumber());
        }
        if (compConfig.hasProperty(rt, "releaseMs")) {
            config.config.compressor.releaseMs = static_cast<float>(
                compConfig.getProperty(rt, "releaseMs").asNumber());
        }
        if (compConfig.hasProperty(rt, "makeupDb")) {
            config.config.compressor.makeupDb = static_cast<float>(
                compConfig.getProperty(rt, "makeupDb").asNumber());
        }
    } else if (config.type == EFFECT_TYPE_DELAY && jsConfig.hasProperty(rt, "delay")) {
        jsi::Object delayConfig = jsConfig.getProperty(rt, "delay").asObject(rt);
        if (delayConfig.hasProperty(rt, "delayMs")) {
            config.config.delay.delayMs = static_cast<float>(
                delayConfig.getProperty(rt, "delayMs").asNumber());
        }
        if (delayConfig.hasProperty(rt, "feedback")) {
            config.config.delay.feedback = static_cast<float>(
                delayConfig.getProperty(rt, "feedback").asNumber());
        }
        if (delayConfig.hasProperty(rt, "mix")) {
            config.config.delay.mix = static_cast<float>(
                delayConfig.getProperty(rt, "mix").asNumber());
        }
    }

    return config;
}

jsi::Object NativeAudioEffectsModule::effectConfigToJS(
    jsi::Runtime& rt, const NythEffectConfig& config) {

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

jsi::Object NativeAudioEffectsModule::statisticsToJS(
    jsi::Runtime& rt, const NythEffectsStatistics& stats) {

    jsi::Object jsStats(rt);

    jsStats.setProperty(rt, "inputLevel", jsi::Value(stats.inputLevel));
    jsStats.setProperty(rt, "outputLevel", jsi::Value(stats.outputLevel));
    jsStats.setProperty(rt, "processedFrames", jsi::Value(static_cast<int>(stats.processedFrames)));
    jsStats.setProperty(rt, "processedSamples", jsi::Value(static_cast<int>(stats.processedSamples)));
    jsStats.setProperty(rt, "durationMs", jsi::Value(static_cast<int>(stats.durationMs)));
    jsStats.setProperty(rt, "activeEffectsCount", jsi::Value(stats.activeEffectsCount));

    return jsStats;
}

jsi::Array NativeAudioEffectsModule::effectIdsToJS(
    jsi::Runtime& rt, const std::vector<int>& effectIds) {

    jsi::Array jsArray(rt, effectIds.size());
    for (size_t i = 0; i < effectIds.size(); ++i) {
        jsArray.setValueAtIndex(rt, i, jsi::Value(effectIds[i]));
    }

    return jsArray;
}

void NativeAudioEffectsModule::invokeJSCallback(
    const std::string& callbackName,
    std::function<void(jsi::Runtime&)> invocation) {

    // Pour l'instant, implémentation basique
    // Dans un vrai module, il faudrait utiliser le jsInvoker pour invoquer sur le thread principal
    try {
        // TODO: Implémenter l'invocation sur le thread principal
        invocation(*reinterpret_cast<jsi::Runtime*>(nullptr));
    } catch (...) {
        // Gérer les erreurs d'invocation
    }
}

// === Méthodes publiques ===

jsi::Value NativeAudioEffectsModule::initialize(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(effectsMutex_);

    try {
        initializeEffectChain();
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(std::string("Initialization failed: ") + e.what());
        return jsi::Value(false);
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
        int effectId = NythEffects_CreateEffect(&nativeConfig);

        if (effectId >= 0) {
            return jsi::Value(effectId);
        }
    } catch (const std::exception& e) {
        handleError(std::string("Create effect failed: ") + e.what());
    }

    return jsi::Value(-1);
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

jsi::Value NativeAudioEffectsModule::setCompressorParameters(jsi::Runtime& rt, int effectId,
                                                            float thresholdDb, float ratio,
                                                            float attackMs, float releaseMs, float makeupDb) {
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

jsi::Value NativeAudioEffectsModule::setDelayParameters(jsi::Runtime& rt, int effectId,
                                                       float delayMs, float feedback, float mix) {
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

jsi::Value NativeAudioEffectsModule::processAudioStereo(jsi::Runtime& rt,
                                                       const jsi::Array& inputL,
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

    if (NythEffects_ProcessAudioStereo(inputLBuffer.data(), inputRBuffer.data(),
                                      outputLBuffer.data(), outputRBuffer.data(), frameCount)) {
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
    jsCallbacks_.audioDataCallback = std::make_shared<jsi::Function>(
        jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forUtf8(rt, "audioDataCallback"),
        0, [](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {
            return jsi::Value::undefined();
        }));
    return jsi::Value(true);
}

jsi::Value NativeAudioEffectsModule::setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    jsCallbacks_.errorCallback = std::make_shared<jsi::Function>(
        jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forUtf8(rt, "errorCallback"),
        0, [](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {
            return jsi::Value::undefined();
        }));
    return jsi::Value(true);
}

jsi::Value NativeAudioEffectsModule::setStateChangeCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    jsCallbacks_.stateChangeCallback = std::make_shared<jsi::Function>(
        jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forUtf8(rt, "stateChangeCallback"),
        0, [](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {
            return jsi::Value::undefined();
        }));
    return jsi::Value(true);
}

jsi::Value NativeAudioEffectsModule::install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker) {
    // Installation directe du module dans le runtime JSI
    // À implémenter selon les besoins
    return jsi::Value(true);
}

// === Fonction d'enregistrement du module ===
std::shared_ptr<TurboModule> NativeAudioEffectsModuleProvider(
    std::shared_ptr<CallInvoker> jsInvoker) {
    return std::make_shared<NativeAudioEffectsModule>(jsInvoker);
}

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_EFFECTS_ENABLED
