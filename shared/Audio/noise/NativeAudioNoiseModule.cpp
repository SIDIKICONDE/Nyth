#include "NativeAudioNoiseModule.h"

#if NYTH_AUDIO_NOISE_ENABLED

#include <algorithm>
#include <utility>

namespace facebook {
namespace react {

// Using declarations pour les types fréquemment utilisés du namespace Nyth::Audio
using Nyth::Audio::NoiseConfig;
using Nyth::Audio::NoiseStatistics;
using Nyth::Audio::NoiseState;

NativeAudioNoiseModule::NativeAudioNoiseModule(std::shared_ptr<CallInvoker> jsInvoker)
    : TurboModule("NativeAudioNoiseModule", jsInvoker), jsInvoker_(std::move(jsInvoker)) {
    // Initialisation des composants
    initializeManagers();

    // Configuration par défaut
    config_ = NoiseConfig();
}

NativeAudioNoiseModule::~NativeAudioNoiseModule() {
    cleanupManagers();
}

// === Cycle de vie ===
jsi::Value NativeAudioNoiseModule::initialize(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(mutex_);

    try {
        // Conversion de la configuration JSI vers native
        config_ = NoiseJSIConverter::noiseConfigFromJS(rt, config);

        // Initialisation du manager
        if (noiseManager_->initialize(config_)) {
            isInitialized_.store(true);
            currentState_ = 1; // INITIALIZED
            return jsi::Value(true);
        } else {
            currentState_ = 3; // ERROR
            return jsi::Value(false);
        }
    } catch (const std::exception& e) {
        handleError(3, std::string("Initialization failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioNoiseModule::start(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!isInitialized_.load()) {
        handleError(2, "Module not initialized");
        return jsi::Value(false);
    }

    try {
        if (noiseManager_->start()) {
            currentState_ = 2; // PROCESSING
            return jsi::Value(true);
        } else {
            return jsi::Value(false);
        }
    } catch (const std::exception& e) {
        handleError(3, std::string("Start failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioNoiseModule::stop(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    try {
        if (noiseManager_ && noiseManager_->isProcessing()) {
            noiseManager_->stop();
        }
        currentState_ = 1; // INITIALIZED
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(3, std::string("Stop failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioNoiseModule::dispose(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    try {
        cleanupManagers();
        isInitialized_.store(false);
        currentState_ = 0; // UNINITIALIZED
        return jsi::Value::undefined();
    } catch (const std::exception& e) {
        handleError(3, std::string("Dispose failed: ") + e.what());
        return jsi::Value(false);
    }
}

// === État et informations ===
jsi::Value NativeAudioNoiseModule::getState(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);
    return jsi::String::createFromUtf8(rt, stateToString(currentState_));
}

jsi::Value NativeAudioNoiseModule::getStatistics(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!noiseManager_) {
        return jsi::Value(nullptr);
    }

    try {
        auto stats = noiseManager_->getStatistics();
        return NoiseJSIConverter::statisticsToJS(rt, stats);
    } catch (const std::exception& e) {
        handleError(3, std::string("Get statistics failed: ") + e.what());
        return jsi::Value(nullptr);
    }
}

jsi::Value NativeAudioNoiseModule::resetStatistics(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!noiseManager_) {
        return jsi::Value(false);
    }

    try {
        noiseManager_->resetStatistics();
        return jsi::Value::undefined();
    } catch (const std::exception& e) {
        handleError(3, std::string("Reset statistics failed: ") + e.what());
        return jsi::Value(false);
    }
}

// === Configuration ===
jsi::Value NativeAudioNoiseModule::getConfig(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);
    return NoiseJSIConverter::noiseConfigToJS(rt, config_);
}

jsi::Value NativeAudioNoiseModule::updateConfig(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(mutex_);

    try {
        auto newConfig = NoiseJSIConverter::noiseConfigFromJS(rt, config);

        if (noiseManager_ && noiseManager_->setConfig(newConfig)) {
            config_ = newConfig;
            return jsi::Value(true);
        } else {
            return jsi::Value(false);
        }
    } catch (const std::exception& e) {
        handleError(3, std::string("Update config failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioNoiseModule::setAlgorithm(jsi::Runtime& rt, const jsi::String& algorithm) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!noiseManager_) {
        return jsi::Value(false);
    }

    try {
        auto algoStr = algorithm.utf8(rt);
        auto algo = NoiseJSIConverter::stringToAlgorithm(algoStr);
        return jsi::Value(noiseManager_->setAlgorithm(algo));
    } catch (const std::exception& e) {
        handleError(3, std::string("Set algorithm failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioNoiseModule::setAggressiveness(jsi::Runtime& rt, float aggressiveness) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!noiseManager_) {
        return jsi::Value(false);
    }

    try {
        return jsi::Value(noiseManager_->setAggressiveness(aggressiveness));
    } catch (const std::exception& e) {
        handleError(3, std::string("Set aggressiveness failed: ") + e.what());
        return jsi::Value(false);
    }
}

// === Traitement audio ===
jsi::Value NativeAudioNoiseModule::processAudio(jsi::Runtime& rt, const jsi::Array& input, int channels) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!noiseManager_ || !isInitialized_.load()) {
        return jsi::Value(nullptr);
    }

    try {
        // Conversion des données d'entrée
        auto inputData = NoiseJSIConverter::arrayToVector(rt, input);
        std::vector<float> outputData(inputData.size());

        // Traitement
        if (channels == 1) {
            noiseManager_->processAudio(inputData.data(), outputData.data(), inputData.size() / channels, channels);
        } else {
            // Pour le moment, traiter comme mono
            noiseManager_->processAudio(inputData.data(), outputData.data(), inputData.size() / channels, 1);
        }

        // Conversion vers JSI
        return NoiseJSIConverter::vectorToArray(rt, outputData);
    } catch (const std::exception& e) {
        handleError(3, std::string("Process audio failed: ") + e.what());
        return jsi::Value(nullptr);
    }
}

jsi::Value NativeAudioNoiseModule::processAudioStereo(jsi::Runtime& rt, const jsi::Array& inputL,
                                                      const jsi::Array& inputR) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!noiseManager_ || !isInitialized_.load()) {
        return jsi::Value(nullptr);
    }

    try {
        // Conversion des données d'entrée
        auto inputLData = NoiseJSIConverter::arrayToVector(rt, inputL);
        auto inputRData = NoiseJSIConverter::arrayToVector(rt, inputR);

        std::vector<float> outputLData(inputLData.size());
        std::vector<float> outputRData(inputRData.size());

        // Traitement stéréo
        noiseManager_->processAudioStereo(inputLData.data(), inputRData.data(), outputLData.data(), outputRData.data(),
                                          inputLData.size());

        // Créer l'objet de retour avec les deux canaux
        auto result = jsi::Object(rt);
        result.setProperty(rt, "left", NoiseJSIConverter::vectorToArray(rt, outputLData));
        result.setProperty(rt, "right", NoiseJSIConverter::vectorToArray(rt, outputRData));

        return result;
    } catch (const std::exception& e) {
        handleError(3, std::string("Process audio stereo failed: ") + e.what());
        return jsi::Value(nullptr);
    }
}

// === Analyse audio ===
jsi::Value NativeAudioNoiseModule::getInputLevel(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!noiseManager_) {
        return jsi::Value(0.0f);
    }

    try {
        return jsi::Value(noiseManager_->getInputLevel());
    } catch (const std::exception& e) {
        handleError(3, std::string("Get input level failed: ") + e.what());
        return jsi::Value(0.0f);
    }
}

jsi::Value NativeAudioNoiseModule::getOutputLevel(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!noiseManager_) {
        return jsi::Value(0.0f);
    }

    try {
        return jsi::Value(noiseManager_->getOutputLevel());
    } catch (const std::exception& e) {
        handleError(3, std::string("Get output level failed: ") + e.what());
        return jsi::Value(0.0f);
    }
}

jsi::Value NativeAudioNoiseModule::getEstimatedSNR(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!noiseManager_) {
        return jsi::Value(0.0f);
    }

    try {
        return jsi::Value(noiseManager_->getEstimatedSNR());
    } catch (const std::exception& e) {
        handleError(3, std::string("Get estimated SNR failed: ") + e.what());
        return jsi::Value(0.0f);
    }
}

jsi::Value NativeAudioNoiseModule::getSpeechProbability(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!noiseManager_) {
        return jsi::Value(0.0f);
    }

    try {
        return jsi::Value(noiseManager_->getSpeechProbability());
    } catch (const std::exception& e) {
        handleError(3, std::string("Get speech probability failed: ") + e.what());
        return jsi::Value(0.0f);
    }
}

jsi::Value NativeAudioNoiseModule::getMusicalNoiseLevel(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!noiseManager_) {
        return jsi::Value(0.0f);
    }

    try {
        return jsi::Value(noiseManager_->getMusicalNoiseLevel());
    } catch (const std::exception& e) {
        handleError(3, std::string("Get musical noise level failed: ") + e.what());
        return jsi::Value(0.0f);
    }
}

// === Configuration avancée ===
jsi::Value NativeAudioNoiseModule::initializeIMCRA(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(mutex_);

    // Pour le moment, déléguer au manager si nécessaire
    // Cette méthode pourrait être étendue pour une configuration spécifique IMCRA
    return jsi::Value(true);
}

jsi::Value NativeAudioNoiseModule::getIMCRAConfig(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    auto config = jsi::Object(rt);
    // Configuration par défaut IMCRA
    config.setProperty(rt, "speechThreshold", jsi::Value(4.6f));
    config.setProperty(rt, "noiseUpdateRate", jsi::Value(0.95f));
    return config;
}

jsi::Value NativeAudioNoiseModule::updateIMCRAConfig(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(mutex_);
    // Pour le moment, accepter la configuration sans l'appliquer
    return jsi::Value(true);
}

jsi::Value NativeAudioNoiseModule::initializeWiener(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(mutex_);
    return jsi::Value(true);
}

jsi::Value NativeAudioNoiseModule::getWienerConfig(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    auto config = jsi::Object(rt);
    config.setProperty(rt, "alpha", jsi::Value(0.98f));
    config.setProperty(rt, "minGain", jsi::Value(0.1f));
    config.setProperty(rt, "maxGain", jsi::Value(1.0f));
    return config;
}

jsi::Value NativeAudioNoiseModule::updateWienerConfig(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(mutex_);
    return jsi::Value(true);
}

jsi::Value NativeAudioNoiseModule::initializeMultiband(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(mutex_);
    return jsi::Value(true);
}

jsi::Value NativeAudioNoiseModule::getMultibandConfig(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    auto config = jsi::Object(rt);
    config.setProperty(rt, "numBands", jsi::Value(8));
    config.setProperty(rt, "crossoverFrequencies", jsi::Value(nullptr)); // Array à implémenter
    return config;
}

jsi::Value NativeAudioNoiseModule::updateMultibandConfig(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(mutex_);
    return jsi::Value(true);
}

// === Callbacks JavaScript ===
jsi::Value NativeAudioNoiseModule::setAudioDataCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (callbackManager_) {
        callbackManager_->setAudioDataCallback(callback);
    }
    return jsi::Value::undefined();
}

jsi::Value NativeAudioNoiseModule::setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (callbackManager_) {
        callbackManager_->setErrorCallback(callback);
    }
    return jsi::Value::undefined();
}

jsi::Value NativeAudioNoiseModule::setStateChangeCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (callbackManager_) {
        callbackManager_->setStateChangeCallback(callback);
    }
    return jsi::Value::undefined();
}

// === Installation du module ===
jsi::Value NativeAudioNoiseModule::install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker) {
    // Créer l'instance du module
    auto module = std::make_shared<NativeAudioNoiseModule>(jsInvoker);

    // Définir le runtime pour les callbacks
    module->setRuntime(&rt);

    // Créer l'objet TurboModule
    auto turboModule = jsi::Object(rt);

    // Définir le nom du module
    turboModule.setProperty(
        rt, "getName",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "getName"), 0,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                return jsi::String::createFromUtf8(rt, NativeAudioNoiseModule::kModuleName);
            }));

    // Fonction d'initialisation
    turboModule.setProperty(
        rt, "initialize",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "initialize"), 1,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                if (count > 0 && args[0].isObject()) {
                    return module->initialize(rt, args[0].asObject(rt));
                }
                return jsi::Value(false);
            }));

    // Fonction start
    turboModule.setProperty(rt, "start",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "start"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->start(rt); }));

    // Fonction stop
    turboModule.setProperty(rt, "stop",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "stop"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->stop(rt); }));

    // Fonction dispose
    turboModule.setProperty(rt, "dispose",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "dispose"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->dispose(rt); }));

    // Fonction getState
    turboModule.setProperty(rt, "getState",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "getState"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->getState(rt); }));

    // Fonction getStatistics
    turboModule.setProperty(rt, "getStatistics",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "getStatistics"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->getStatistics(rt); }));

    // Fonction resetStatistics
    turboModule.setProperty(rt, "resetStatistics",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "resetStatistics"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->resetStatistics(rt); }));

    // Fonction getConfig
    turboModule.setProperty(rt, "getConfig",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "getConfig"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->getConfig(rt); }));

    // Fonction updateConfig
    turboModule.setProperty(
        rt, "updateConfig",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "updateConfig"), 1,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                if (count > 0 && args[0].isObject()) {
                    return module->updateConfig(rt, args[0].asObject(rt));
                }
                return jsi::Value(false);
            }));

    // Fonction setAlgorithm
    turboModule.setProperty(
        rt, "setAlgorithm",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "setAlgorithm"), 1,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                if (count > 0 && args[0].isString()) {
                    return module->setAlgorithm(rt, args[0].asString(rt));
                }
                return jsi::Value(false);
            }));

    // Fonction setAggressiveness
    turboModule.setProperty(
        rt, "setAggressiveness",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "setAggressiveness"), 1,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                if (count > 0 && args[0].isNumber()) {
                    return module->setAggressiveness(rt, static_cast<float>(args[0].asNumber()));
                }
                return jsi::Value(false);
            }));

    // Fonction processAudio
    turboModule.setProperty(
        rt, "processAudio",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "processAudio"), 2,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                if (count >= 2 && args[0].isObject() && args[1].isNumber()) {
                    auto inputArray = args[0].asObject(rt).asArray(rt);
                    int channels = static_cast<int>(args[1].asNumber());
                    return module->processAudio(rt, inputArray, channels);
                }
                return jsi::Value(nullptr);
            }));

    // Fonction processAudioStereo
    turboModule.setProperty(
        rt, "processAudioStereo",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "processAudioStereo"), 2,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                if (count >= 2 && args[0].isObject() && args[1].isObject()) {
                    auto inputLArray = args[0].asObject(rt).asArray(rt);
                    auto inputRArray = args[1].asObject(rt).asArray(rt);
                    return module->processAudioStereo(rt, inputLArray, inputRArray);
                }
                return jsi::Value(nullptr);
            }));

    // Fonctions d'analyse audio
    turboModule.setProperty(rt, "getInputLevel",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "getInputLevel"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->getInputLevel(rt); }));

    turboModule.setProperty(rt, "getOutputLevel",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "getOutputLevel"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->getOutputLevel(rt); }));

    turboModule.setProperty(rt, "getEstimatedSNR",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "getEstimatedSNR"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->getEstimatedSNR(rt); }));

    turboModule.setProperty(rt, "getSpeechProbability",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "getSpeechProbability"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->getSpeechProbability(rt); }));

    turboModule.setProperty(rt, "getMusicalNoiseLevel",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "getMusicalNoiseLevel"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->getMusicalNoiseLevel(rt); }));

    // Fonctions de configuration avancée
    turboModule.setProperty(
        rt, "initializeIMCRA",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "initializeIMCRA"), 1,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                if (count > 0 && args[0].isObject()) {
                    return module->initializeIMCRA(rt, args[0].asObject(rt));
                }
                return jsi::Value(false);
            }));

    turboModule.setProperty(rt, "getIMCRAConfig",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "getIMCRAConfig"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->getIMCRAConfig(rt); }));

    turboModule.setProperty(
        rt, "updateIMCRAConfig",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "updateIMCRAConfig"), 1,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                if (count > 0 && args[0].isObject()) {
                    return module->updateIMCRAConfig(rt, args[0].asObject(rt));
                }
                return jsi::Value(false);
            }));

    turboModule.setProperty(
        rt, "initializeWiener",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "initializeWiener"), 1,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                if (count > 0 && args[0].isObject()) {
                    return module->initializeWiener(rt, args[0].asObject(rt));
                }
                return jsi::Value(false);
            }));

    turboModule.setProperty(rt, "getWienerConfig",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "getWienerConfig"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->getWienerConfig(rt); }));

    turboModule.setProperty(
        rt, "updateWienerConfig",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "updateWienerConfig"), 1,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                if (count > 0 && args[0].isObject()) {
                    return module->updateWienerConfig(rt, args[0].asObject(rt));
                }
                return jsi::Value(false);
            }));

    turboModule.setProperty(
        rt, "initializeMultiband",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "initializeMultiband"), 1,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                if (count > 0 && args[0].isObject()) {
                    return module->initializeMultiband(rt, args[0].asObject(rt));
                }
                return jsi::Value(false);
            }));

    turboModule.setProperty(rt, "getMultibandConfig",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "getMultibandConfig"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->getMultibandConfig(rt); }));

    turboModule.setProperty(
        rt, "updateMultibandConfig",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "updateMultibandConfig"), 1,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                if (count > 0 && args[0].isObject()) {
                    return module->updateMultibandConfig(rt, args[0].asObject(rt));
                }
                return jsi::Value(false);
            }));

    // Callbacks
    turboModule.setProperty(
        rt, "setAudioDataCallback",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "setAudioDataCallback"), 1,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                if (count > 0 && args[0].isObject()) {
                    auto callback = args[0].asObject(rt).asFunction(rt);
                    return module->setAudioDataCallback(rt, callback);
                }
                return jsi::Value(false);
            }));

    turboModule.setProperty(
        rt, "setErrorCallback",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "setErrorCallback"), 1,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                if (count > 0 && args[0].isObject()) {
                    auto callback = args[0].asObject(rt).asFunction(rt);
                    return module->setErrorCallback(rt, callback);
                }
                return jsi::Value(false);
            }));

    turboModule.setProperty(
        rt, "setStateChangeCallback",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "setStateChangeCallback"), 1,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                if (count > 0 && args[0].isObject()) {
                    auto callback = args[0].asObject(rt).asFunction(rt);
                    return module->setStateChangeCallback(rt, callback);
                }
                return jsi::Value(false);
            }));

    return turboModule;
}

// === Méthodes privées ===
void NativeAudioNoiseModule::initializeManagers() {
    // Créer le callback manager
    callbackManager_ = std::make_shared<JSICallbackManager>(jsInvoker_);

    // Créer le noise manager avec le callback manager
    noiseManager_ = std::make_unique<NoiseManager>(callbackManager_);

    // Configurer les callbacks
    noiseManager_->setStatisticsCallback(
        [this](const NoiseStatistics& stats) { this->onStatisticsUpdate(stats); });

    noiseManager_->setProcessingCallback([this](const float* input, const float* output, size_t frameCount) {
        this->onProcessingComplete(input, output, frameCount);
    });
}

void NativeAudioNoiseModule::cleanupManagers() {
    if (noiseManager_) {
        noiseManager_->release();
        noiseManager_.reset();
    }

    if (callbackManager_) {
        callbackManager_->clearAllCallbacks();
        callbackManager_.reset();
    }
}

void NativeAudioNoiseModule::setRuntime(jsi::Runtime* rt) {
    std::lock_guard<std::mutex> lock(mutex_);
    runtime_ = rt;
    runtimeValid_.store(rt != nullptr);

    if (callbackManager_) {
        callbackManager_->setRuntime(rt);
    }
}

void NativeAudioNoiseModule::invalidateRuntime() {
    std::lock_guard<std::mutex> lock(mutex_);
    runtimeValid_.store(false);
    runtime_ = nullptr;

    if (callbackManager_) {
        callbackManager_->invalidateRuntime();
    }
}

void NativeAudioNoiseModule::handleError(int error, const std::string& message) {
    currentState_ = 3; // ERROR

    // Notifier via callback si disponible
    if (callbackManager_ && runtimeValid_.load()) {
        onError(message);
    }
}

std::string NativeAudioNoiseModule::stateToString(int state) const {
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
            return "uninitialized";
    }
}

std::string NativeAudioNoiseModule::errorToString(int error) const {
    switch (error) {
        case 1:
            return "NOT_INITIALIZED";
        case 2:
            return "INVALID_CONFIG";
        case 3:
            return "PROCESSING_ERROR";
        case 4:
            return "MEMORY_ERROR";
        default:
            return "UNKNOWN_ERROR";
    }
}

void NativeAudioNoiseModule::onStatisticsUpdate(const NoiseStatistics& stats) {
    if (callbackManager_ && runtimeValid_.load()) {
        try {
            callbackManager_->invokeCallback("statistics", [this, stats](jsi::Runtime& rt) {
                auto statsObj = NoiseJSIConverter::statisticsToJS(rt, stats);
                return std::vector<jsi::Value>{statsObj};
            });
        } catch (const std::exception& e) {
            // Silencer les erreurs de callback pour éviter les boucles
        }
    }
}

void NativeAudioNoiseModule::onProcessingComplete(const float* input, const float* output, size_t frameCount) {
    if (callbackManager_ && runtimeValid_.load()) {
        try {
            // Transmet les buffers d'entrée et de sortie via Float32Array
            callbackManager_->invokeAudioIOCallback(input, output, frameCount, config_.channels);
        } catch (const std::exception& e) {
            // Silencer les erreurs de callback
        }
    }
}

void NativeAudioNoiseModule::onError(const std::string& error) {
    if (callbackManager_ && runtimeValid_.load()) {
        try {
            callbackManager_->invokeErrorCallback(error);
        } catch (const std::exception& e) {
            // Silencer les erreurs de callback
        }
    }
}

void NativeAudioNoiseModule::onStateChange(NoiseState oldState, NoiseState newState) {
    if (callbackManager_ && runtimeValid_.load()) {
        try {
            auto oldStr = NoiseJSIConverter::noiseStateToString(oldState);
            auto newStr = NoiseJSIConverter::noiseStateToString(newState);
            callbackManager_->invokeStateChangeCallback(oldStr, newStr);
        } catch (const std::exception& e) {
            // Silencer les erreurs de callback
        }
    }
}

// === Fonction d'enregistrement du module ===
JSI_EXPORT std::shared_ptr<facebook::react::TurboModule> NativeAudioNoiseModuleProvider(
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
    return std::make_shared<facebook::react::NativeAudioNoiseModule>(jsInvoker);
}

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_NOISE_ENABLED
