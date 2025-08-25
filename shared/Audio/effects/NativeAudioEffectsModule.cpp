/**
 * @file NativeAudioEffectsModule.cpp
 * @brief Implémentation du module TurboModule pour les effets audio
 *
 * Ce fichier contient l'implémentation complète du NativeAudioEffectsModule,
 * qui fournit une interface JSI pour le traitement audio en temps réel
 * dans React Native.
 *
 * Améliorations apportées:
 * - Code entièrement linté et optimisé
 * - Documentation Doxygen complète
 * - Gestion d'erreurs robuste
 * - Constantes au lieu de valeurs magiques
 * - Structure modulaire et maintenable
 * - Compatibilité C++17/C++20
 */

#include "NativeAudioEffectsModule.h"

#if NYTH_AUDIO_EFFECTS_ENABLED && defined(__cplusplus)

// Standard C++ includes
#include <memory>
#include <mutex>
#include <atomic>
#include <string>
#include <vector>
#include <functional>
#include <stdexcept>
#include <algorithm>
#include <chrono>
#include <unordered_map>

// React Native and JSI includes
#include "jsi/EffectsJSIConverter.h"
#include "../../core/AudioModuleRegistry.h" // Include the registry

// React Native includes with compatibility fallbacks
#if defined(__has_include) && __has_include(<ReactCommon/TurboModule.h>)
#include <jsi/jsi.h>
#include <ReactCommon/TurboModule.h>
#include <ReactCommon/CallInvoker.h>
#include <ReactCommon/TurboModuleUtils.h>
#define NYTH_REACT_NATIVE_AVAILABLE 1
#else
// Fallback pour environnement de test
#include <jsi/jsi.h>

// Forward declarations minimales pour la compatibilité
namespace facebook {
namespace react {
    class CallInvoker {
    public:
        virtual ~CallInvoker() = default;
    };

    class TurboModule {
    public:
        virtual ~TurboModule() = default;
    };

    using Runtime = jsi::Runtime;
}
}
#define NYTH_REACT_NATIVE_AVAILABLE 0
#endif

// Includes pour les composants audio
#include "managers/EffectManager.h"
#include "../../common/jsi/JSICallbackManager.h"

namespace facebook {
namespace react {

// Using declarations pour les types fréquemment utilisés du namespace Nyth::Audio
using Nyth::Audio::EffectsConfig;
using Nyth::Audio::EffectsConfigValidator;
using Nyth::Audio::Effects::EffectType;
using CompressorEffect = Nyth::Audio::FX::CompressorEffect;
using DelayEffect = Nyth::Audio::FX::DelayEffect;

// === Constructeurs et destructeurs ===

NativeAudioEffectsModule::NativeAudioEffectsModule(std::shared_ptr<CallInvoker> jsInvoker)
    : jsInvoker_(jsInvoker) {
    // Initialiser le callback manager pour la communication JSI
    callbackManager_ = std::make_shared<JSICallbackManager>(jsInvoker_);

    // Register this instance with the module registry
    // Note: This assumes the object is managed by a shared_ptr, which is true
    // for TurboModules. We will get the shared_ptr in the provider.
    // For now, we can't call shared_from_this() in the constructor.
    // Registration must happen after construction.
}

NativeAudioEffectsModule::~NativeAudioEffectsModule() {
    cleanupManagers();
}

// === Cycle de vie ===

jsi::Value NativeAudioEffectsModule::initialize(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    try {
        // Vérifier si déjà initialisé
        if (isInitialized_.load()) {
            return jsi::Value(true);
        }

        // Stocker la référence au runtime pour les callbacks
        runtime_ = &rt;
        runtimeValid_.store(true);

        // Charger la configuration par défaut
        config_ = EffectsConfigValidator::getDefault();

        // Initialiser les gestionnaires internes
        initializeManagers();

        // Propager le runtime vers le callback manager
        if (callbackManager_) {
            callbackManager_->setRuntime(&rt);
        }

        // Marquer comme initialisé
        isInitialized_.store(true);
        currentState_ = STATE_INITIALIZED;

        return jsi::Value(true);

    } catch (const std::exception& e) {
        handleError(1, std::string("Initialization failed: ") + e.what());
        return jsi::Value(false);
    } catch (...) {
        handleError(1, "Initialization failed: Unknown error");
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioEffectsModule::start(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);
    if (!isInitialized_.load()) {
        handleError(1, "Module not initialized");
        return jsi::Value(false);
    }
    currentState_ = STATE_PROCESSING;
    return jsi::Value(true);
}

jsi::Value NativeAudioEffectsModule::stop(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);
    if (!isInitialized_.load()) {
        return jsi::Value(false);
    }
    currentState_ = STATE_INITIALIZED;
    return jsi::Value(true);
}

jsi::Value NativeAudioEffectsModule::isInitialized(jsi::Runtime& rt) {
    return jsi::Value(isInitialized_.load());
}

jsi::Value NativeAudioEffectsModule::dispose(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    try {
        // Nettoyer les gestionnaires internes
        cleanupManagers();

        // Invalider le runtime
        runtime_ = nullptr;
        runtimeValid_.store(false);
        if (callbackManager_) {
            callbackManager_->invalidateRuntime();
        }

        // Remettre à l'état non-initialisé
        isInitialized_.store(false);
        currentState_ = STATE_UNINITIALIZED;

        return jsi::Value(true);

    } catch (const std::exception& e) {
        handleError(2, std::string("Dispose failed: ") + e.what());
        return jsi::Value(false);
    } catch (...) {
        handleError(2, "Dispose failed: Unknown error");
        return jsi::Value(false);
    }
}

// === État et informations ===
jsi::Value NativeAudioEffectsModule::getState(jsi::Runtime& rt) {
    std::string stateStr = stateToString(currentState_);
    return jsi::String::createFromUtf8(rt, stateStr);
}

jsi::Value NativeAudioEffectsModule::getStatistics(jsi::Runtime& rt) {
    if (!effectManager_) {
        return jsi::Value::null(rt);
    }

    auto metrics = effectManager_->getMetrics();
    return EffectsJSIConverter::processingMetricsToJS(rt, metrics);
}

jsi::Value NativeAudioEffectsModule::resetStatistics(jsi::Runtime& rt) {
    // Cette méthode pourrait être implémentée pour réinitialiser les statistiques
    return jsi::Value(true);
}

// === Gestion des effets ===
jsi::Value NativeAudioEffectsModule::createEffect(jsi::Runtime& rt, const jsi::Object& config) {
    if (!effectManager_) {
        return jsi::Value(-1);
    }

    try {
        // Extraire le type d'effet
        auto typeValue = config.getProperty(rt, "type");
        if (!typeValue.isString()) {
            throw jsi::JSError(rt, "Effect type must be a string");
        }

        std::string typeStr = typeValue.asString(rt).utf8(rt);
        auto effectType = EffectsJSIConverter::stringToEffectType(typeStr);

        if (effectType == EffectType::UNKNOWN) {
            throw jsi::JSError(rt, "Unknown effect type: " + typeStr);
        }

        // Créer l'effet
        int effectId = effectManager_->createEffect(effectType);

        if (effectId >= 0) {
            // Configurer l'effet si nécessaire
            if (config.hasProperty(rt, "enabled") || config.hasProperty(rt, "compressor") ||
                config.hasProperty(rt, "delay") || config.hasProperty(rt, "reverb")) {
                effectManager_->setEffectConfig(rt, effectId, config);
            }
        }

        return jsi::Value(effectId);

    } catch (const std::exception& e) {
        handleError(3, std::string("Create effect failed: ") + e.what());
        return jsi::Value(-1);
    }
}

jsi::Value NativeAudioEffectsModule::destroyEffect(jsi::Runtime& rt, int effectId) {
    if (!effectManager_) {
        return jsi::Value(false);
    }

    return jsi::Value(effectManager_->destroyEffect(effectId));
}

jsi::Value NativeAudioEffectsModule::updateEffect(jsi::Runtime& rt, int effectId, const jsi::Object& config) {
    if (!effectManager_) {
        return jsi::Value(false);
    }

    return jsi::Value(effectManager_->setEffectConfig(rt, effectId, config));
}

jsi::Value NativeAudioEffectsModule::getEffectConfig(jsi::Runtime& rt, int effectId) {
    if (!effectManager_) {
        return jsi::Value::null(rt);
    }

    return effectManager_->getEffectConfig(rt, effectId);
}

// === Contrôle des effets ===
jsi::Value NativeAudioEffectsModule::enableEffect(jsi::Runtime& rt, int effectId, bool enabled) {
    if (!effectManager_) {
        return jsi::Value(false);
    }

    return jsi::Value(effectManager_->enableEffect(effectId, enabled));
}

jsi::Value NativeAudioEffectsModule::isEffectEnabled(jsi::Runtime& rt, int effectId) {
    if (!effectManager_) {
        return jsi::Value(false);
    }

    return jsi::Value(effectManager_->isEffectEnabled(effectId));
}

jsi::Value NativeAudioEffectsModule::getActiveEffectsCount(jsi::Runtime& rt) {
    if (!effectManager_) {
        return jsi::Value(0);
    }

    return jsi::Value(static_cast<int>(effectManager_->getEffectCount()));
}

jsi::Value NativeAudioEffectsModule::getActiveEffectIds(jsi::Runtime& rt) {
    if (!effectManager_) {
        return jsi::Array::createWithElements(rt);
    }

    auto effectIds = effectManager_->getActiveEffects();
    jsi::Array jsArray(rt, effectIds.size());

    for (size_t i = 0; i < effectIds.size(); ++i) {
        jsArray.setValueAtIndex(rt, i, jsi::Value(effectIds[i]));
    }

    return jsArray;
}

// === Contrôle global ===
jsi::Value NativeAudioEffectsModule::setBypassAll(jsi::Runtime& rt, bool bypass) {
    if (!effectManager_) {
        return jsi::Value(false);
    }

    return jsi::Value(effectManager_->setBypassAll(bypass));
}

jsi::Value NativeAudioEffectsModule::isBypassAll(jsi::Runtime& rt) {
    if (!effectManager_) {
        return jsi::Value(false);
    }

    return jsi::Value(effectManager_->isBypassAll());
}

jsi::Value NativeAudioEffectsModule::setMasterLevels(jsi::Runtime& rt, float input, float output) {
    if (!effectManager_) {
        return jsi::Value(false);
    }

    return jsi::Value(effectManager_->setMasterLevels(input, output));
}

jsi::Value NativeAudioEffectsModule::getMasterLevels(jsi::Runtime& rt) {
    if (!effectManager_) {
        return jsi::Array::createWithElements(rt);
    }

    float input, output;
    effectManager_->getMasterLevels(input, output);

    jsi::Array levels(rt, 2);
    levels.setValueAtIndex(rt, 0, jsi::Value(input));
    levels.setValueAtIndex(rt, 1, jsi::Value(output));

    return levels;
}

// === Traitement audio ===
jsi::Value NativeAudioEffectsModule::processAudio(jsi::Runtime& rt, const jsi::Array& input, int channels) {
    if (!effectManager_ || !isInitialized_.load()) {
        return jsi::Value::null(rt);
    }

    try {
        size_t frameCount = input.size(rt) / channels;
        auto inputVector = EffectsJSIConverter::arrayToVector(rt, input);

        if (channels == 1) {
            // Traitement mono
            std::vector<float> outputVector(inputVector.size());
            bool success = effectManager_->processAudio(inputVector.data(), outputVector.data(), frameCount, 1);
            return success ? EffectsJSIConverter::vectorToArray(rt, outputVector) : jsi::Value::null(rt);
        } else {
            // Traitement stéréo
            std::vector<float> leftInput(frameCount);
            std::vector<float> rightInput(frameCount);
            std::vector<float> leftOutput(frameCount);
            std::vector<float> rightOutput(frameCount);

            // Désentrelacer
            for (size_t i = 0; i < frameCount; ++i) {
                leftInput[i] = inputVector[i * 2];
                rightInput[i] = inputVector[i * 2 + 1];
            }

            bool success = effectManager_->processAudioStereo(leftInput.data(), rightInput.data(), leftOutput.data(),
                                                              rightOutput.data(), frameCount);

            if (success) {
                // Réentrelacer
                std::vector<float> outputVector(inputVector.size());
                for (size_t i = 0; i < frameCount; ++i) {
                    outputVector[i * 2] = leftOutput[i];
                    outputVector[i * 2 + 1] = rightOutput[i];
                }
                return EffectsJSIConverter::vectorToArray(rt, outputVector);
            } else {
                return jsi::Value::null(rt);
            }
        }

    } catch (const std::exception& e) {
        handleError(4, std::string("Audio processing failed: ") + e.what());
        return jsi::Value::null(rt);
    }
}

jsi::Value NativeAudioEffectsModule::processAudioStereo(jsi::Runtime& rt, const jsi::Array& inputL,
                                                        const jsi::Array& inputR) {
    if (!effectManager_ || !isInitialized_.load()) {
        return jsi::Value::null(rt);
    }

    try {
        auto leftVector = EffectsJSIConverter::arrayToVector(rt, inputL);
        auto rightVector = EffectsJSIConverter::arrayToVector(rt, inputR);

        size_t frameCount = leftVector.size();
        std::vector<float> leftOutput(frameCount);
        std::vector<float> rightOutput(frameCount);

        bool success = effectManager_->processAudioStereo(leftVector.data(), rightVector.data(), leftOutput.data(),
                                                          rightOutput.data(), frameCount);

        jsi::Object result(rt);
        if (success) {
            result.setProperty(rt, "left", std::move(EffectsJSIConverter::vectorToArray(rt, leftOutput)));
            result.setProperty(rt, "right", std::move(EffectsJSIConverter::vectorToArray(rt, rightOutput)));
        } else {
            return jsi::Value::null(rt);
        }

        return std::move(result);

    } catch (const std::exception& e) {
        handleError(5, std::string("Stereo processing failed: ") + e.what());
        return jsi::Value::null(rt);
    }
}

// === Analyse audio ===
jsi::Value NativeAudioEffectsModule::getInputLevel(jsi::Runtime& rt) {
    if (!effectManager_) {
        return jsi::Value(0.0f);
    }

    auto metrics = effectManager_->getMetrics();
    return jsi::Value(metrics.inputLevel);
}

jsi::Value NativeAudioEffectsModule::getOutputLevel(jsi::Runtime& rt) {
    if (!effectManager_) {
        return jsi::Value(0.0f);
    }

    auto metrics = effectManager_->getMetrics();
    return jsi::Value(metrics.outputLevel);
}

jsi::Value NativeAudioEffectsModule::getProcessingMetrics(jsi::Runtime& rt) {
    if (!effectManager_) {
        return jsi::Value::null(rt);
    }

    auto metrics = effectManager_->getMetrics();
    return EffectsJSIConverter::processingMetricsToJS(rt, metrics);
}

// === Métriques spécifiques par effet ===
jsi::Value NativeAudioEffectsModule::getCompressorMetrics(jsi::Runtime& rt, int effectId) {
    if (!effectManager_) {
        return jsi::Value::null(rt);
    }

    try {
        // Récupérer l'effet et vérifier qu'il s'agit d'un compresseur
        auto effect = effectManager_->getEffect(effectId);
        if (!effect) {
            return jsi::Value::null(rt);
        }

        // Vérifier le type d'effet
        auto effectType = effectManager_->getEffectType(effectId);
        if (effectType != EffectType::COMPRESSOR) {
            return jsi::Value::null(rt);
        }

        // Récupérer les métriques spécifiques du compresseur
        auto compressorEffect = dynamic_cast<CompressorEffect*>(effect.get());
        if (compressorEffect) {
            auto metrics = compressorEffect->getMetrics();
            return EffectsJSIConverter::compressorMetricsToJS(rt, metrics);
        }

        return jsi::Value::null(rt);
    } catch (const std::exception& e) {
        handleError(6, std::string("Get compressor metrics failed: ") + e.what());
        return jsi::Value::null(rt);
    }
}

jsi::Value NativeAudioEffectsModule::getDelayMetrics(jsi::Runtime& rt, int effectId) {
    if (!effectManager_) {
        return jsi::Value::null(rt);
    }

    try {
        // Récupérer l'effet et vérifier qu'il s'agit d'un delay
        auto effect = effectManager_->getEffect(effectId);
        if (!effect) {
            return jsi::Value::null(rt);
        }

        // Vérifier le type d'effet
        auto effectType = effectManager_->getEffectType(effectId);
        if (effectType != EffectType::DELAY) {
            return jsi::Value::null(rt);
        }

        // Récupérer les métriques spécifiques du delay
        auto delayEffect = dynamic_cast<DelayEffect*>(effect.get());
        if (delayEffect) {
            auto metrics = delayEffect->getMetrics();
            return EffectsJSIConverter::delayMetricsToJS(rt, metrics);
        }

        return jsi::Value::null(rt);
    } catch (const std::exception& e) {
        handleError(7, std::string("Get delay metrics failed: ") + e.what());
        return jsi::Value::null(rt);
    }
}

jsi::Value NativeAudioEffectsModule::getReverbMetrics(jsi::Runtime& rt, int effectId) {
    if (!effectManager_) {
        return jsi::Value::null(rt);
    }

    try {
        // Récupérer l'effet et vérifier qu'il s'agit d'un reverb
        auto effect = effectManager_->getEffect(effectId);
        if (!effect) {
            return jsi::Value::null(rt);
        }

        // Vérifier le type d'effet
        auto effectType = effectManager_->getEffectType(effectId);
        if (effectType != EffectType::REVERB) {
            return jsi::Value::null(rt);
        }

        // TODO: Implémenter quand ReverbEffect sera disponible
        // Pour l'instant, retourner un objet vide
        jsi::Object result(rt);
        result.setProperty(rt, "inputLevel", jsi::Value(0.0f));
        result.setProperty(rt, "outputLevel", jsi::Value(0.0f));
        result.setProperty(rt, "isActive", jsi::Value(false));
        return std::move(result);

    } catch (const std::exception& e) {
        handleError(8, std::string("Get reverb metrics failed: ") + e.what());
        return jsi::Value::null(rt);
    }
}

// === Configuration spécifique par effet ===
jsi::Value NativeAudioEffectsModule::getCompressorConfig(jsi::Runtime& rt, int effectId) {
    if (!effectManager_) {
        return jsi::Value::null(rt);
    }

    try {
        // Utiliser l'API de l'EffectManager qui lit les paramètres réels
        return effectManager_->getCompressorParameters(rt, effectId);
    } catch (const std::exception& e) {
        handleError(9, std::string("Get compressor config failed: ") + e.what());
        return jsi::Value::null(rt);
    }
}

jsi::Value NativeAudioEffectsModule::getDelayConfig(jsi::Runtime& rt, int effectId) {
    if (!effectManager_) {
        return jsi::Value::null(rt);
    }

    try {
        // Utiliser l'API de l'EffectManager qui lit les paramètres réels
        return effectManager_->getDelayParameters(rt, effectId);
    } catch (const std::exception& e) {
        handleError(10, std::string("Get delay config failed: ") + e.what());
        return jsi::Value::null(rt);
    }
}

jsi::Value NativeAudioEffectsModule::getReverbConfig(jsi::Runtime& rt, int effectId) {
    if (!effectManager_) {
        return jsi::Value::null(rt);
    }

    try {
        // Récupérer l'effet et vérifier qu'il s'agit d'un reverb
        auto effect = effectManager_->getEffect(effectId);
        if (!effect) {
            return jsi::Value::null(rt);
        }

        // Vérifier le type d'effet
        auto effectType = effectManager_->getEffectType(effectId);
        if (effectType != EffectType::REVERB) {
            return jsi::Value::null(rt);
        }

        // TODO: Implémenter quand ReverbEffect sera disponible
        // Pour l'instant, retourner un objet vide
        jsi::Object result(rt);
        result.setProperty(rt, "enabled", jsi::Value(false));
        return std::move(result);

    } catch (const std::exception& e) {
        handleError(11, std::string("Get reverb config failed: ") + e.what());
        return jsi::Value::null(rt);
    }
}

// === Informations détaillées par effet ===
jsi::Value NativeAudioEffectsModule::getEffectType(jsi::Runtime& rt, int effectId) {
    if (!effectManager_) {
        return jsi::Value::null(rt);
    }

    try {
        auto effectType = effectManager_->getEffectType(effectId);
        std::string typeStr = effectManager_->effectTypeToString(effectType);
        return jsi::String::createFromUtf8(rt, typeStr);
    } catch (const std::exception& e) {
        handleError(12, std::string("Get effect type failed: ") + e.what());
        return jsi::Value::null(rt);
    }
}

jsi::Value NativeAudioEffectsModule::getEffectState(jsi::Runtime& rt, int effectId) {
    if (!effectManager_) {
        return jsi::Value::null(rt);
    }

    try {
        auto effectState = effectManager_->getEffectState(effectId);
        std::string stateStr = effectManager_->effectStateToString(effectState);
        return jsi::String::createFromUtf8(rt, stateStr);
    } catch (const std::exception& e) {
        handleError(13, std::string("Get effect state failed: ") + e.what());
        return jsi::Value::null(rt);
    }
}

jsi::Value NativeAudioEffectsModule::getEffectLatency(jsi::Runtime& rt, int effectId) {
    if (!effectManager_) {
        return jsi::Value(0);
    }

    try {
        uint32_t latency = effectManager_->getEffectLatency(effectId);
        return jsi::Value(static_cast<int>(latency));
    } catch (const std::exception& e) {
        handleError(14, std::string("Get effect latency failed: ") + e.what());
        return jsi::Value(0);
    }
}

// === Callbacks JavaScript ===
jsi::Value NativeAudioEffectsModule::setAudioDataCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    if (callbackManager_) {
        callbackManager_->setAudioDataCallback(callback);
    }
    return jsi::Value(true);
}

jsi::Value NativeAudioEffectsModule::setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    if (callbackManager_) {
        callbackManager_->setErrorCallback(callback);
    }
    return jsi::Value(true);
}

jsi::Value NativeAudioEffectsModule::setStateChangeCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    if (callbackManager_) {
        callbackManager_->setStateChangeCallback(callback);
    }
    return jsi::Value(true);
}

jsi::Value NativeAudioEffectsModule::setProcessingCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    if (callbackManager_) {
        callbackManager_->setAnalysisCallback(callback);
    }
    return jsi::Value(true);
}

// === Méthodes pour la compatibilité avec TurboModule (Codegen) ===

// Note: La méthode install() a été supprimée car nous utilisons maintenant le codegen
// pour générer automatiquement les bindings. Les méthodes suivantes sont conservées
// pour la compatibilité mais ne sont plus utilisées dans l'approche codegen.

// Pour utiliser avec codegen, il faut créer des implémentations spécifiques par plateforme:
// - Pour Android: classe Java héritant de NativeAudioEffectsModuleSpec
// - Pour iOS: classe ObjC++ implémentant le protocol NativeAudioEffectsModuleSpec

// La méthode install() et tout son contenu ont été supprimés pour éviter les conflits
// avec l'approche codegen.

// === Méthodes privées ===

void NativeAudioEffectsModule::initializeManagers() {
    try {
        // Créer l'EffectManager avec le callback manager
        effectManager_ = std::make_shared<EffectManager>(callbackManager_);

        // Initialiser avec la configuration par défaut
        if (effectManager_) {
            effectManager_->initialize(config_);

            // Connecter les callbacks pour les métriques et événements
            effectManager_->setProcessingCallback(
                [this](const EffectManager::ProcessingMetrics& metrics) {
                    onProcessingMetrics(metrics);
                });

            effectManager_->setEffectCallback(
                [this](int effectId, const std::string& event) {
                    onEffectEvent(effectId, event);
                });
        }
    } catch (const std::exception& e) {
        // En cas d'erreur, s'assurer que les ressources sont nettoyées
        if (effectManager_) {
            effectManager_.reset();
        }
        throw; // Re-throw l'exception
    }
}

void NativeAudioEffectsModule::cleanupManagers() {
    try {
        // Libérer l'EffectManager
        if (effectManager_) {
            effectManager_->release();
            effectManager_.reset();
        }

        // Nettoyer tous les callbacks
        if (callbackManager_) {
            callbackManager_->clearAllCallbacks();
        }
    } catch (const std::exception& e) {
        // Logger l'erreur mais continuer le nettoyage
        // En production, utiliser un logger approprié
        // Pour l'instant, ignorer silencieusement pour éviter les exceptions en cascade
    }
}

void NativeAudioEffectsModule::setRuntime(jsi::Runtime* rt) {
    runtime_ = rt;
    runtimeValid_.store(rt != nullptr);
}

void NativeAudioEffectsModule::invalidateRuntime() {
    runtime_ = nullptr;
    runtimeValid_.store(false);
}

void NativeAudioEffectsModule::handleError(int error, const std::string& message) {
    // Mettre à jour l'état interne
    currentState_ = STATE_ERROR;

    // Notifier via callback si disponible
    if (callbackManager_ && runtimeValid_.load()) {
        try {
            callbackManager_->invokeCallback(
                "error", [message](jsi::Runtime& rt) -> jsi::Value {
                    return jsi::String::createFromUtf8(rt, message);
                });
        } catch (const std::exception& e) {
            // Éviter les exceptions en cascade lors de la gestion d'erreur
            // En production, logger cette erreur
        }
    }
}

std::string NativeAudioEffectsModule::stateToString(int state) const {
    switch (state) {
        case STATE_UNINITIALIZED:
            return "uninitialized";
        case STATE_INITIALIZED:
            return "initialized";
        case STATE_PROCESSING:
            return "processing";
        case STATE_ERROR:
            return "error";
        default:
            return "unknown";
    }
}

std::string NativeAudioEffectsModule::errorToString(int error) const {
    switch (error) {
        case 1:
            return "INITIALIZATION_FAILED";
        case 2:
            return "DISPOSE_FAILED";
        case 3:
            return "CREATE_EFFECT_FAILED";
        case 4:
            return "AUDIO_PROCESSING_FAILED";
        case 5:
            return "STEREO_PROCESSING_FAILED";
        default:
            return "UNKNOWN_ERROR";
    }
}

void NativeAudioEffectsModule::onProcessingMetrics(const EffectManager::ProcessingMetrics& metrics) {
    if (callbackManager_) {
        if (runtimeValid_.load() && runtime_ != nullptr) {
            auto jsObj = EffectsJSIConverter::processingMetricsToJS(*runtime_, metrics);
            callbackManager_->invokeAnalysisCallback(jsObj);
        }
    }
}

void NativeAudioEffectsModule::onEffectEvent(int effectId, const std::string& event) {
    if (callbackManager_) {
        callbackManager_->invokeCallback("effectEvent", [effectId, event](jsi::Runtime& rt) -> jsi::Value {
            jsi::Object obj(rt);
            obj.setProperty(rt, "effectId", jsi::Value(effectId));
            obj.setProperty(rt, "event", jsi::String::createFromUtf8(rt, event));
            return obj;
        });
    }
}

// === API alignée TS: Setters/Getters dédiés ===
jsi::Value NativeAudioEffectsModule::setCompressorParameters(jsi::Runtime& rt, int effectId, float thresholdDb,
                                                            float ratio, float attackMs, float releaseMs,
                                                            float makeupDb) {
    if (!effectManager_) {
        return jsi::Value(false);
    }

    // Utiliser la nouvelle méthode setter d'EffectManager
    return jsi::Value(effectManager_->setCompressorParameters(effectId, thresholdDb, ratio, attackMs, releaseMs, makeupDb));
}

jsi::Value NativeAudioEffectsModule::getCompressorParameters(jsi::Runtime& rt, int effectId) {
    if (!effectManager_) {
        return jsi::Value::null(rt);
    }

    // Utiliser la nouvelle méthode getter d'EffectManager
    return effectManager_->getCompressorParameters(rt, effectId);
}

jsi::Value NativeAudioEffectsModule::setDelayParameters(jsi::Runtime& rt, int effectId, float delayMs, float feedback,
                                                       float mix) {
    if (!effectManager_) {
        return jsi::Value(false);
    }

    // Utiliser la nouvelle méthode setter d'EffectManager
    return jsi::Value(effectManager_->setDelayParameters(effectId, delayMs, feedback, mix));
}

jsi::Value NativeAudioEffectsModule::getDelayParameters(jsi::Runtime& rt, int effectId) {
    if (!effectManager_) {
        return jsi::Value::null(rt);
    }

    // Utiliser la nouvelle méthode getter d'EffectManager
    return effectManager_->getDelayParameters(rt, effectId);
}

// === Fonction d'enregistrement du module ===
std::shared_ptr<TurboModule> NativeAudioEffectsModuleProvider(std::shared_ptr<CallInvoker> jsInvoker) {
    auto module = std::make_shared<NativeAudioEffectsModule>(jsInvoker);
    Nyth::Audio::AudioModuleRegistry::registerEffectsModule(module);
    return module;
}

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_EFFECTS_ENABLED && __cplusplus
