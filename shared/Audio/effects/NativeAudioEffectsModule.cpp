#include "NativeAudioEffectsModule.h"
#include "effects/jsi/EffectsJSIConverter.h"

namespace facebook {
namespace react {

NativeAudioEffectsModule::NativeAudioEffectsModule(std::shared_ptr<CallInvoker> jsInvoker) : jsInvoker_(jsInvoker) {
    // Initialiser le callback manager
    callbackManager_ = std::make_shared<JSICallbackManager>(jsInvoker);
}

NativeAudioEffectsModule::~NativeAudioEffectsModule() {
    cleanupManagers();
}

// === Cycle de vie ===
jsi::Value NativeAudioEffectsModule::initialize(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    try {
        if (isInitialized_.load()) {
            return jsi::Value(true);
        }

        // Stocker la référence au runtime
        runtime_ = &rt;
        runtimeValid_.store(true);

        // Configuration par défaut
        config_ = Nyth::Audio::EffectsConfigValidator::getDefault();

        // Initialiser les managers
        initializeManagers();

        isInitialized_.store(true);
        currentState_ = 1; // INITIALIZED

        return jsi::Value(true);

    } catch (const std::exception& e) {
        handleError(1, std::string("Initialization failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioEffectsModule::isInitialized(jsi::Runtime& rt) {
    return jsi::Value(isInitialized_.load());
}

jsi::Value NativeAudioEffectsModule::dispose(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    try {
        cleanupManagers();

        isInitialized_.store(false);
        currentState_ = 0; // UNINITIALIZED

        return jsi::Value(true);

    } catch (const std::exception& e) {
        handleError(2, std::string("Dispose failed: ") + e.what());
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
        return jsi::Value::null();
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

        if (effectType == Nyth::Audio::Effects::EffectType::UNKNOWN) {
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
        return jsi::Value::null();
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

    return jsi::Value(static_cast<int>(effectManager_->getActiveEffects().size()));
}

jsi::Value NativeAudioEffectsModule::getActiveEffectIds(jsi::Runtime& rt) {
    if (!effectManager_) {
        return jsi::Array(rt, 0);
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
        return jsi::Array(rt, 0);
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
    if (!effectManager_) {
        return input; // Passthrough
    }

    try {
        size_t frameCount = input.length(rt) / channels;
        auto inputVector = EffectsJSIConverter::arrayToVector(rt, input);

        if (channels == 1) {
            // Traitement mono
            std::vector<float> outputVector(inputVector.size());
            bool success = effectManager_->processAudio(inputVector.data(), outputVector.data(), frameCount, 1);
            return success ? EffectsJSIConverter::vectorToArray(rt, outputVector) : input;
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
                return input; // Passthrough
            }
        }

    } catch (const std::exception& e) {
        handleError(4, std::string("Audio processing failed: ") + e.what());
        return input; // Passthrough en cas d'erreur
    }
}

jsi::Value NativeAudioEffectsModule::processAudioStereo(jsi::Runtime& rt, const jsi::Array& inputL,
                                                        const jsi::Array& inputR) {
    if (!effectManager_) {
        jsi::Object result(rt);
        result.setProperty(rt, "left", inputL);
        result.setProperty(rt, "right", inputR);
        return result;
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
            result.setProperty(rt, "left", EffectsJSIConverter::vectorToArray(rt, leftOutput));
            result.setProperty(rt, "right", EffectsJSIConverter::vectorToArray(rt, rightOutput));
        } else {
            result.setProperty(rt, "left", inputL);
            result.setProperty(rt, "right", inputR);
        }

        return result;

    } catch (const std::exception& e) {
        handleError(5, std::string("Stereo processing failed: ") + e.what());
        jsi::Object result(rt);
        result.setProperty(rt, "left", inputL);
        result.setProperty(rt, "right", inputR);
        return result;
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
        return jsi::Value::null();
    }

    auto metrics = effectManager_->getMetrics();
    return EffectsJSIConverter::processingMetricsToJS(rt, metrics);
}

// === Callbacks JavaScript ===
jsi::Value NativeAudioEffectsModule::setAudioDataCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    if (callbackManager_) {
        callbackManager_->setCallback("audioData", rt, callback);
    }
    return jsi::Value(true);
}

jsi::Value NativeAudioEffectsModule::setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    if (callbackManager_) {
        callbackManager_->setCallback("error", rt, callback);
    }
    return jsi::Value(true);
}

jsi::Value NativeAudioEffectsModule::setStateChangeCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    if (callbackManager_) {
        callbackManager_->setCallback("stateChange", rt, callback);
    }
    return jsi::Value(true);
}

jsi::Value NativeAudioEffectsModule::setProcessingCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    if (callbackManager_) {
        callbackManager_->setCallback("processing", rt, callback);
    }
    return jsi::Value(true);
}

// === Installation du module ===
jsi::Value NativeAudioEffectsModule::install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker) {
    // Créer une instance du module
    auto module = std::make_shared<NativeAudioEffectsModule>(jsInvoker);

    // Installer le module dans le runtime
    auto moduleName = std::string(kModuleName);
    auto moduleObject = jsi::Object::createFromHostObject(rt, module);
    rt.global().setProperty(rt, moduleName.c_str(), std::move(moduleObject));

    return jsi::Value(true);
}

// === Méthodes privées ===
void NativeAudioEffectsModule::initializeManagers() {
    // Créer l'EffectManager
    effectManager_ = std::make_unique<EffectManager>(callbackManager_);

    // Initialiser avec la configuration par défaut
    effectManager_->initialize(config_);

    // Connecter les callbacks
    effectManager_->setProcessingCallback(
        [this](const EffectManager::ProcessingMetrics& metrics) { onProcessingMetrics(metrics); });

    effectManager_->setEffectCallback(
        [this](int effectId, const std::string& event) { onEffectEvent(effectId, event); });
}

void NativeAudioEffectsModule::cleanupManagers() {
    if (effectManager_) {
        effectManager_->release();
        effectManager_.reset();
    }

    if (callbackManager_) {
        callbackManager_->clearAllCallbacks();
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
    currentState_ = 3; // ERROR

    if (callbackManager_) {
        callbackManager_->invokeCallback(
            "error", [message](jsi::Runtime& rt) -> jsi::Value { return jsi::String::createFromUtf8(rt, message); });
    }
}

std::string NativeAudioEffectsModule::stateToString(int state) const {
    switch (state) {
        case 0:
            return "uninitialized";
        case 1:
            return "initialized";
        case 2:
            return "processing";
        case 3:
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
        callbackManager_->invokeCallback("processing", [metrics](jsi::Runtime& rt) -> jsi::Value {
            return EffectsJSIConverter::processingMetricsToJS(rt, metrics);
        });
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

// === Fonction d'enregistrement du module ===
std::shared_ptr<TurboModule> NativeAudioEffectsModuleProvider(std::shared_ptr<CallInvoker> jsInvoker) {
    return std::make_shared<NativeAudioEffectsModule>(jsInvoker);
}

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_EFFECTS_ENABLED && __cplusplus
