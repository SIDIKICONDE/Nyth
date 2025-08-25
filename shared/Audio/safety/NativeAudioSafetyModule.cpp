#include "NativeAudioSafetyModule.h"

#include <algorithm>
#include <chrono>

namespace facebook {
namespace react {

// Using declarations pour les types fréquemment utilisés du namespace Nyth::Audio
using Nyth::Audio::SafetyConfig;
using Nyth::Audio::SafetyError;
using Nyth::Audio::SafetyState;
using Nyth::Audio::SafetyReport;
using Nyth::Audio::SafetyStatistics;
using Nyth::Audio::SafetyLimits;
using Nyth::Audio::SafetyParameterValidator;

NativeAudioSafetyModule::NativeAudioSafetyModule(std::shared_ptr<CallInvoker> jsInvoker)
    : TurboModule("NativeAudioSafetyModule", jsInvoker) {
    jsInvoker_ = jsInvoker;
    // Initialisation des composants
    initializeManagers();

    // Configuration par défaut
    config_ = SafetyConfig::getDefault();
}

NativeAudioSafetyModule::~NativeAudioSafetyModule() {
    cleanupManagers();
}

// === Cycle de vie ===

jsi::Value NativeAudioSafetyModule::initialize(jsi::Runtime& rt, uint32_t sampleRate, int channels) {
    std::lock_guard<std::mutex> lock(mutex_);

    try {
        // Validation des paramètres
        if (!SafetyParameterValidator::isValidSampleRate(sampleRate)) {
            handleError(SafetyError::INVALID_SAMPLE_RATE,
                        "Invalid sample rate: " + std::to_string(sampleRate));
            return jsi::Value(false);
        }

        if (!SafetyParameterValidator::isValidChannels(channels)) {
            handleError(SafetyError::INVALID_CHANNELS, "Invalid channels: " + std::to_string(channels));
            return jsi::Value(false);
        }

        // Mise à jour de la configuration
        config_.sampleRate = sampleRate;
        config_.channels = channels;

        // Initialisation du manager
        if (safetyManager_->initialize(config_)) {
            isInitialized_.store(true);
            currentState_ = SafetyState::INITIALIZED;

            // Allocation des buffers de travail
            resetBuffers();

            return jsi::Value(true);
        } else {
            currentState_ = SafetyState::ERROR;
            handleError(SafetyError::PROCESSING_FAILED, "Failed to initialize safety manager");
            return jsi::Value(false);
        }
    } catch (const std::exception& e) {
        handleError(SafetyError::PROCESSING_FAILED, std::string("Initialization failed: ") + e.what());
        currentState_ = SafetyState::ERROR;
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioSafetyModule::isInitialized(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);
    return jsi::Value(isInitialized_.load());
}

jsi::Value NativeAudioSafetyModule::dispose(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    try {
        if (safetyManager_) {
            safetyManager_->stop();
            safetyManager_->release();
        }

        cleanupManagers();
        resetBuffers();

        isInitialized_.store(false);
        isProcessing_.store(false);
        currentState_ = SafetyState::SHUTDOWN;

        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(SafetyError::PROCESSING_FAILED, std::string("Dispose failed: ") + e.what());
        return jsi::Value(false);
    }
}

// === État et informations ===

jsi::Value NativeAudioSafetyModule::getState(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    // Retourner une string pour compat TS (SafetyState)
    return jsi::String::createFromUtf8(rt, stateToString(currentState_.load()));
}

jsi::Value NativeAudioSafetyModule::getErrorString(jsi::Runtime& rt, int errorCode) {
    auto error = static_cast<SafetyError>(errorCode);
    return jsi::String::createFromUtf8(rt, errorToString(error));
}

jsi::Value NativeAudioSafetyModule::getInfo(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    auto infoObj = jsi::Object(rt);
    infoObj.setProperty(rt, "moduleName", jsi::String::createFromUtf8(rt, kModuleName));
    infoObj.setProperty(rt, "version", jsi::String::createFromUtf8(rt, "2.0.0"));
    infoObj.setProperty(rt, "architecture", jsi::String::createFromUtf8(rt, "modular"));
    infoObj.setProperty(rt, "sampleRate", jsi::Value(config_.sampleRate));
    infoObj.setProperty(rt, "channels", jsi::Value(config_.channels));
    infoObj.setProperty(rt, "hasOptimizedEngine", jsi::Value(config_.optimizationConfig.useOptimizedEngine));

    return infoObj;
}

// === Configuration ===

jsi::Value NativeAudioSafetyModule::setConfig(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(mutex_);

    try {
        // Conversion JSI vers native
        auto newConfig = SafetyJSIConverter::jsiToSafetyConfig(rt, config);

        // Validation
        if (!validateConfig(newConfig)) {
            handleError(SafetyError::INVALID_CONFIG, "Invalid configuration provided");
            return jsi::Value(false);
        }

        // Application de la configuration
        if (safetyManager_ && safetyManager_->setConfig(newConfig)) {
            // Sauvegarder l'ancienne configuration pour détecter les changements de taille
            auto prevSampleRate = config_.sampleRate;
            auto prevChannels = config_.channels;
            config_ = newConfig;

            // Reallocation des buffers si nécessaire
            if (newConfig.sampleRate != prevSampleRate || newConfig.channels != prevChannels) {
                resetBuffers();
            }

            return jsi::Value(true);
        } else {
            handleError(SafetyError::PROCESSING_FAILED, "Failed to update safety manager configuration");
            return jsi::Value(false);
        }
    } catch (const std::exception& e) {
        handleError(SafetyError::PROCESSING_FAILED,
                    std::string("Configuration update failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioSafetyModule::getConfig(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);
    return SafetyJSIConverter::safetyConfigToJSI(rt, config_);
}

jsi::Value NativeAudioSafetyModule::setOptimizationConfig(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(mutex_);

    try {
        auto optConfig = SafetyJSIConverter::jsiToOptimizationConfig(rt, config);
        config_.optimizationConfig = optConfig;

        // Appliquer au manager si initialisé
        if (safetyManager_) {
            return jsi::Value(safetyManager_->setConfig(config_));
        }

        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(SafetyError::PROCESSING_FAILED,
                    std::string("Optimization config update failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioSafetyModule::updateConfig(jsi::Runtime& rt, const jsi::Object& config) {
    return setConfig(rt, config);
}

// === Traitement audio ===

jsi::Value NativeAudioSafetyModule::processAudio(jsi::Runtime& rt, const jsi::Array& input, int channels) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!isInitialized_.load() || !isProcessing_.load()) {
        return jsi::Value(nullptr);
    }

    try {
        // Conversion des données d'entrée
        auto inputData = SafetyJSIConverter::jsiArrayToFloatVector(rt, input);

        // Vérification des paramètres
        if (inputData.empty()) {
            return jsi::Value(nullptr);
        }

        // Validation du nombre de canaux
        if (channels != config_.channels) {
            handleError(SafetyError::INVALID_CHANNELS, "Channel count mismatch");
            return jsi::Value(nullptr);
        }

        // Redimensionnement du buffer de sortie si nécessaire
        if (tempBuffer_.size() < inputData.size()) {
            tempBuffer_.resize(inputData.size());
        }

        // Traitement
        bool success =
            safetyManager_->processAudio(inputData.data(), tempBuffer_.data(), inputData.size() / channels, channels);

        if (success) {
            // Conversion vers JSI
            return SafetyJSIConverter::floatVectorToJSIArray(rt, tempBuffer_);
        } else {
            return jsi::Value(nullptr);
        }
    } catch (const std::exception& e) {
        handleError(SafetyError::PROCESSING_FAILED, std::string("Audio processing failed: ") + e.what());
        return jsi::Value(nullptr);
    }
}

jsi::Value NativeAudioSafetyModule::processAudioStereo(jsi::Runtime& rt, const jsi::Array& inputL,
                                                       const jsi::Array& inputR) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!isInitialized_.load() || !isProcessing_.load()) {
        return jsi::Value(nullptr);
    }

    try {
        // Conversion des données d'entrée
        auto inputLData = SafetyJSIConverter::jsiArrayToFloatVector(rt, inputL);
        auto inputRData = SafetyJSIConverter::jsiArrayToFloatVector(rt, inputR);

        // Validation
        if (inputLData.empty() || inputRData.empty() || inputLData.size() != inputRData.size()) {
            handleError(SafetyError::NULL_BUFFER, "Invalid stereo input data");
            return jsi::Value(nullptr);
        }

        // Redimensionnement des buffers de sortie
        size_t frameCount = inputLData.size();
        if (workBufferL_.size() < frameCount) {
            workBufferL_.resize(frameCount);
            workBufferR_.resize(frameCount);
        }

        // Traitement stéréo
        bool success = safetyManager_->processAudioStereo(inputLData.data(), inputRData.data(), workBufferL_.data(),
                                                          workBufferR_.data(), frameCount);

        if (success) {
            // Création de l'objet de retour
            auto result = jsi::Object(rt);
            result.setProperty(rt, "left", SafetyJSIConverter::floatVectorToJSIArray(rt, workBufferL_));
            result.setProperty(rt, "right", SafetyJSIConverter::floatVectorToJSIArray(rt, workBufferR_));
            return result;
        } else {
            return jsi::Value(nullptr);
        }
    } catch (const std::exception& e) {
        handleError(SafetyError::PROCESSING_FAILED,
                    std::string("Stereo audio processing failed: ") + e.what());
        return jsi::Value(nullptr);
    }
}

// === Analyse et rapports ===

jsi::Value NativeAudioSafetyModule::getLastReport(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!safetyManager_) {
        return jsi::Value(nullptr);
    }

    try {
        auto report = safetyManager_->getLastReport();
        return SafetyJSIConverter::safetyReportToJSI(rt, report);
    } catch (const std::exception& e) {
        handleError(SafetyError::PROCESSING_FAILED, std::string("Get report failed: ") + e.what());
        return jsi::Value(nullptr);
    }
}

jsi::Value NativeAudioSafetyModule::getStatistics(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!safetyManager_) {
        return jsi::Value(nullptr);
    }

    try {
        auto stats = safetyManager_->getStatistics();
        return SafetyJSIConverter::safetyStatisticsToJSI(rt, stats);
    } catch (const std::exception& e) {
        handleError(SafetyError::PROCESSING_FAILED, std::string("Get statistics failed: ") + e.what());
        return jsi::Value(nullptr);
    }
}

jsi::Value NativeAudioSafetyModule::resetStatistics(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!safetyManager_) {
        return jsi::Value(false);
    }

    try {
        safetyManager_->resetStatistics();
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(SafetyError::PROCESSING_FAILED, std::string("Reset statistics failed: ") + e.what());
        return jsi::Value(false);
    }
}

// === Métriques individuelles ===

jsi::Value NativeAudioSafetyModule::getCurrentPeakLevel(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!safetyManager_) {
        return jsi::Value(0.0);
    }

    return jsi::Value(safetyManager_->getCurrentPeakLevel());
}

jsi::Value NativeAudioSafetyModule::getCurrentRMSLevel(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!safetyManager_) {
        return jsi::Value(0.0);
    }

    return jsi::Value(safetyManager_->getCurrentRMSLevel());
}

jsi::Value NativeAudioSafetyModule::getCurrentDCOffset(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!safetyManager_) {
        return jsi::Value(0.0);
    }

    return jsi::Value(safetyManager_->getCurrentDCOffset());
}

jsi::Value NativeAudioSafetyModule::getCurrentClippedSamples(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!safetyManager_) {
        return jsi::Value(0);
    }

    return jsi::Value(static_cast<int>(safetyManager_->getCurrentClippedSamples()));
}

jsi::Value NativeAudioSafetyModule::isOverloadActive(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!safetyManager_) {
        return jsi::Value(false);
    }

    return jsi::Value(safetyManager_->isOverloadActive());
}

jsi::Value NativeAudioSafetyModule::getCurrentFeedbackScore(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!safetyManager_) {
        return jsi::Value(0.0);
    }

    return jsi::Value(safetyManager_->getCurrentFeedbackScore());
}

jsi::Value NativeAudioSafetyModule::hasFeedbackLikely(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!safetyManager_) {
        return jsi::Value(false);
    }

    return jsi::Value(safetyManager_->hasFeedbackLikely());
}

// === Contrôles ===

jsi::Value NativeAudioSafetyModule::start(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!isInitialized_.load()) {
        handleError(SafetyError::ENGINE_NOT_INITIALIZED, "Module not initialized");
        return jsi::Value(false);
    }

    if (isProcessing_.load()) {
        return jsi::Value(true); // Already started
    }

    try {
        if (safetyManager_->start()) {
            isProcessing_.store(true);
            currentState_ = SafetyState::PROCESSING;
            return jsi::Value(true);
        } else {
            return jsi::Value(false);
        }
    } catch (const std::exception& e) {
        handleError(SafetyError::PROCESSING_FAILED, std::string("Start failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioSafetyModule::stop(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!isProcessing_.load()) {
        return jsi::Value(true); // Already stopped
    }

    try {
        if (safetyManager_->stop()) {
            isProcessing_.store(false);
            currentState_ = SafetyState::INITIALIZED;
            return jsi::Value(true);
        } else {
            return jsi::Value(false);
        }
    } catch (const std::exception& e) {
        handleError(SafetyError::PROCESSING_FAILED, std::string("Stop failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioSafetyModule::isProcessing(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);
    return jsi::Value(isProcessing_.load());
}

// === Utilitaires ===

jsi::Value NativeAudioSafetyModule::dbToLinear(jsi::Runtime& rt, double db) {
    return jsi::Value(Nyth::Audio::dbToLinear(db));
}

jsi::Value NativeAudioSafetyModule::linearToDb(jsi::Runtime& rt, double linear) {
    return jsi::Value(Nyth::Audio::linearToDb(linear));
}

jsi::Value NativeAudioSafetyModule::validateConfig(jsi::Runtime& rt, const jsi::Object& config) {
    bool isValid = SafetyJSIConverter::validateJSIConfig(rt, config);
    return jsi::Value(isValid);
}

// === Callbacks JavaScript ===

jsi::Value NativeAudioSafetyModule::setAudioDataCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (callbackManager_) {
        callbackManager_->setAudioDataCallback(callback);
    }

    if (safetyManager_) {
        safetyManager_->setDataCallback([this](const float* input, float* output, size_t frameCount, int channels) {
            if (this->callbackManager_ && this->runtimeValid_.load()) {
                try {
                    this->callbackManager_->invokeAudioIOCallback(input, output, frameCount, channels);
                } catch (const std::exception&) {
                    // Éviter les boucles d'erreur
                }
            }
        });
    }

    return jsi::Value(true);
}

jsi::Value NativeAudioSafetyModule::setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (callbackManager_) {
        callbackManager_->setErrorCallback(callback);
    }

    return jsi::Value(true);
}

jsi::Value NativeAudioSafetyModule::setStateChangeCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (callbackManager_) {
        callbackManager_->setStateChangeCallback(callback);
    }

    return jsi::Value(true);
}

jsi::Value NativeAudioSafetyModule::setReportCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (callbackManager_) {
        // Enregistrer explicitement sous la clé "report" pour cohérence avec les invocations
        callbackManager_->registerCallback("report", rt, callback);
    }

    if (safetyManager_) {
        safetyManager_->setReportCallback(
            [this](const SafetyReport& report) { this->onReportUpdate(report); });
    }

    return jsi::Value(true);
}

// === Installation du module ===

jsi::Value NativeAudioSafetyModule::install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker) {
    // Créer l'instance du module
    auto module = std::make_shared<NativeAudioSafetyModule>(jsInvoker);

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
                return jsi::String::createFromUtf8(rt, NativeAudioSafetyModule::kModuleName);
            }));

    // Fonction d'initialisation
    turboModule.setProperty(
        rt, "initialize",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "initialize"), 2,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                if (count >= 2 && args[0].isNumber() && args[1].isNumber()) {
                    uint32_t sampleRate = static_cast<uint32_t>(args[0].asNumber());
                    int channels = static_cast<int>(args[1].asNumber());
                    return module->initialize(rt, sampleRate, channels);
                }
                return jsi::Value(false);
            }));

    // Fonction isInitialized
    turboModule.setProperty(rt, "isInitialized",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "isInitialized"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->isInitialized(rt); }));

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

    // Fonction getInfo
    turboModule.setProperty(rt, "getInfo",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "getInfo"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->getInfo(rt); }));

    // Fonction getErrorString
    turboModule.setProperty(
        rt, "getErrorString",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "getErrorString"), 1,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                if (count > 0 && args[0].isNumber()) {
                    int errorCode = static_cast<int>(args[0].asNumber());
                    return module->getErrorString(rt, errorCode);
                }
                return jsi::String::createFromUtf8(rt, "Unknown error");
            }));

    // Fonction setConfig
    turboModule.setProperty(
        rt, "setConfig",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "setConfig"), 1,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                if (count > 0 && args[0].isObject()) {
                    return module->setConfig(rt, args[0].asObject(rt));
                }
                return jsi::Value(false);
            }));

    // Fonction getConfig
    turboModule.setProperty(rt, "getConfig",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "getConfig"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->getConfig(rt); }));

    // Fonction setOptimizationConfig
    turboModule.setProperty(
        rt, "setOptimizationConfig",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "setOptimizationConfig"), 1,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                if (count > 0 && args[0].isObject()) {
                    return module->setOptimizationConfig(rt, args[0].asObject(rt));
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

    // Fonction isProcessing
    turboModule.setProperty(rt, "isProcessing",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "isProcessing"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->isProcessing(rt); }));

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

    // Fonction getLastReport
    turboModule.setProperty(rt, "getLastReport",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "getLastReport"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->getLastReport(rt); }));

    // Alias getReport
    turboModule.setProperty(rt, "getReport",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "getReport"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->getLastReport(rt); }));

    // Fonction getStatistics
    turboModule.setProperty(rt, "getStatistics",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "getStatistics"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->getStatistics(rt); }));

    // Alias getMetrics -> getStatisticsSimple
    turboModule.setProperty(rt, "getMetrics",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "getMetrics"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) {
                                    // Reuse simple mapping
                                    auto statsVal = module->getStatistics(rt);
                                    if (!statsVal.isObject()) {
                                        return jsi::Value::null(rt);
                                    }
                                    auto original = statsVal.asObject(rt);
                                    jsi::Object result(rt);
                                    if (original.hasProperty(rt, "minReport")) {
                                        result.setProperty(rt, "min", original.getProperty(rt, "minReport"));
                                    }
                                    if (original.hasProperty(rt, "maxReport")) {
                                        result.setProperty(rt, "max", original.getProperty(rt, "maxReport"));
                                    }
                                    if (original.hasProperty(rt, "avgReport")) {
                                        result.setProperty(rt, "avg", original.getProperty(rt, "avgReport"));
                                    }
                                    return jsi::Value(result);
                                }));

    // Fonction getStatisticsSimple (min/max/avg)
    turboModule.setProperty(
        rt, "getStatisticsSimple",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "getStatisticsSimple"), 0,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                auto statsVal = module->getStatistics(rt);
                if (!statsVal.isObject()) {
                    return jsi::Value::null(rt);
                }
                auto original = statsVal.asObject(rt);
                jsi::Object result(rt);
                if (original.hasProperty(rt, "minReport")) {
                    result.setProperty(rt, "min", original.getProperty(rt, "minReport"));
                }
                if (original.hasProperty(rt, "maxReport")) {
                    result.setProperty(rt, "max", original.getProperty(rt, "maxReport"));
                }
                if (original.hasProperty(rt, "avgReport")) {
                    result.setProperty(rt, "avg", original.getProperty(rt, "avgReport"));
                }
                return jsi::Value(result);
            }));

    // Fonction resetStatistics
    turboModule.setProperty(rt, "resetStatistics",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "resetStatistics"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->resetStatistics(rt); }));

    // Fonctions des métriques individuelles
    turboModule.setProperty(rt, "getCurrentPeakLevel",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "getCurrentPeakLevel"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->getCurrentPeakLevel(rt); }));

    turboModule.setProperty(rt, "getCurrentRMSLevel",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "getCurrentRMSLevel"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->getCurrentRMSLevel(rt); }));

    // Fonctions utilitaires
    turboModule.setProperty(rt, "dbToLinear",
                            jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forUtf8(rt, "dbToLinear"), 1,
                                                                  [module](jsi::Runtime& rt, const jsi::Value& thisVal,
                                                                           const jsi::Value* args, size_t count) {
                                                                      if (count > 0 && args[0].isNumber()) {
                                                                          double db = args[0].asNumber();
                                                                          return module->dbToLinear(rt, db);
                                                                      }
                                                                      return jsi::Value(1.0);
                                                                  }));

    turboModule.setProperty(rt, "linearToDb",
                            jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forUtf8(rt, "linearToDb"), 1,
                                                                  [module](jsi::Runtime& rt, const jsi::Value& thisVal,
                                                                           const jsi::Value* args, size_t count) {
                                                                      if (count > 0 && args[0].isNumber()) {
                                                                          double linear = args[0].asNumber();
                                                                          return module->linearToDb(rt, linear);
                                                                      }
                                                                      return jsi::Value(0.0);
                                                                  }));

    // Alias pour la compatibilité TS
    turboModule.setProperty(
        rt, "processMono",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "processMono"), 1,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                if (count >= 1 && args[0].isObject()) {
                    auto inputArray = args[0].asObject(rt).asArray(rt);
                    return module->processAudio(rt, inputArray, 1);
                }
                return jsi::Value(nullptr);
            }));

    turboModule.setProperty(
        rt, "processStereo",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "processStereo"), 2,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                if (count >= 2 && args[0].isObject() && args[1].isObject()) {
                    auto inputLArray = args[0].asObject(rt).asArray(rt);
                    auto inputRArray = args[1].asObject(rt).asArray(rt);
                    return module->processAudioStereo(rt, inputLArray, inputRArray);
                }
                return jsi::Value(nullptr);
            }));

    turboModule.setProperty(rt, "getCurrentPeak",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "getCurrentPeak"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->getCurrentPeakLevel(rt); }));

    turboModule.setProperty(rt, "getCurrentRMS",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "getCurrentRMS"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->getCurrentRMSLevel(rt); }));

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

    turboModule.setProperty(
        rt, "setReportCallback",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "setReportCallback"), 1,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                if (count > 0 && args[0].isObject()) {
                    auto callback = args[0].asObject(rt).asFunction(rt);
                    return module->setReportCallback(rt, callback);
                }
                return jsi::Value(false);
            }));

    return turboModule;
}

// === Méthodes privées ===

void NativeAudioSafetyModule::initializeManagers() {
    // Créer le callback manager
    callbackManager_ = std::make_shared<JSICallbackManager>(jsInvoker_);

    // Créer le safety manager
    safetyManager_ = std::make_unique<SafetyManager>(callbackManager_);

    // Configuration des callbacks
    setupCallbacks();
}

void NativeAudioSafetyModule::cleanupManagers() {
    if (safetyManager_) {
        safetyManager_->release();
        safetyManager_.reset();
    }

    if (callbackManager_) {
        callbackManager_->clearAllCallbacks();
        callbackManager_.reset();
    }
}

void NativeAudioSafetyModule::setRuntime(jsi::Runtime* rt) {
    std::lock_guard<std::mutex> lock(mutex_);
    runtime_ = rt;
    runtimeValid_.store(rt != nullptr);

    if (callbackManager_) {
        callbackManager_->setRuntime(rt);
    }
}

void NativeAudioSafetyModule::invalidateRuntime() {
    std::lock_guard<std::mutex> lock(mutex_);
    runtimeValid_.store(false);
    runtime_ = nullptr;

    if (callbackManager_) {
        callbackManager_->invalidateRuntime();
    }
}

void NativeAudioSafetyModule::handleError(SafetyError error, const std::string& message) {
    currentState_ = SafetyState::ERROR;

    // Notifier via callback si disponible
    if (callbackManager_ && runtimeValid_.load()) {
        try {
            callbackManager_->invokeErrorCallback(message);
        } catch (const std::exception&) {
            // Silencieux pour éviter les boucles
        }
    }
}

std::string NativeAudioSafetyModule::stateToString(SafetyState state) const {
    return Nyth::Audio::stateToString(state);
}

std::string NativeAudioSafetyModule::errorToString(SafetyError error) const {
    return Nyth::Audio::errorToString(error);
}

void NativeAudioSafetyModule::onStatisticsUpdate(const SafetyStatistics& stats) {
    if (callbackManager_ && runtimeValid_.load()) {
        try {
            callbackManager_->invokeCallback("statistics", [this, stats](jsi::Runtime& rt) {
                auto statsObj = SafetyJSIConverter::safetyStatisticsToJSI(rt, stats);
                return std::vector<jsi::Value>{statsObj};
            });
        } catch (const std::exception& e) {
            // Silencer les erreurs de callback pour éviter les boucles
        }
    }
}

void NativeAudioSafetyModule::onProcessingComplete(const float* input, float* output, size_t frameCount) {
    if (callbackManager_ && runtimeValid_.load()) {
        try {
            callbackManager_->invokeCallback("audioData", [input, output, frameCount](jsi::Runtime& rt) {
                auto inputArray = jsi::Array(rt, frameCount);
                auto outputArray = jsi::Array(rt, frameCount);

                for (size_t i = 0; i < frameCount; ++i) {
                    inputArray.setValueAtIndex(rt, i, jsi::Value(input[i]));
                    outputArray.setValueAtIndex(rt, i, jsi::Value(output[i]));
                }

                auto result = jsi::Object(rt);
                result.setProperty(rt, "input", inputArray);
                result.setProperty(rt, "output", outputArray);
                result.setProperty(rt, "frameCount", jsi::Value(static_cast<double>(frameCount)));

                return std::vector<jsi::Value>{result};
            });
        } catch (const std::exception& e) {
            // Silencer les erreurs de callback
        }
    }
}

void NativeAudioSafetyModule::onError(const std::string& error) {
    if (callbackManager_ && runtimeValid_.load()) {
        try {
            callbackManager_->invokeCallback("error", [error](jsi::Runtime& rt) {
                auto errorObj = jsi::Object(rt);
                errorObj.setProperty(rt, "message", jsi::String::createFromUtf8(rt, error));
                errorObj.setProperty(rt, "timestamp", jsi::Value(static_cast<double>(std::time(nullptr))));
                return std::vector<jsi::Value>{errorObj};
            });
        } catch (const std::exception& e) {
            // Silencer les erreurs de callback
        }
    }
}

void NativeAudioSafetyModule::onStateChange(SafetyState oldState, SafetyState newState) {
    if (callbackManager_ && runtimeValid_.load()) {
        try {
            // Appeler la variante dédiée avec deux chaînes, conforme au spec TS
            callbackManager_->invokeStateChangeCallback(
                Nyth::Audio::stateToString(oldState), Nyth::Audio::stateToString(newState));
        } catch (const std::exception& e) {
            // Silencer les erreurs de callback
        }
    }
}

void NativeAudioSafetyModule::onReportUpdate(const SafetyReport& report) {
    if (callbackManager_ && runtimeValid_.load()) {
        try {
            callbackManager_->invokeCallback("report", [this, report](jsi::Runtime& rt) {
                auto reportObj = SafetyJSIConverter::safetyReportToJSI(rt, report);
                return std::vector<jsi::Value>{reportObj};
            });
        } catch (const std::exception& e) {
            // Silencer les erreurs de callback
        }
    }
}

bool NativeAudioSafetyModule::validateConfig(const SafetyConfig& config) const {
    return config.isValid();
}

void NativeAudioSafetyModule::setupCallbacks() {
    if (safetyManager_) {
        safetyManager_->setStateCallback([this](SafetyState oldState, SafetyState newState) {
            this->onStateChange(oldState, newState);
        });

        safetyManager_->setErrorCallback(
            [this](SafetyError error, const std::string& message) { this->handleError(error, message); });
    }
}

void NativeAudioSafetyModule::resetBuffers() {
    size_t maxFrameSize = SafetyLimits::MAX_FRAME_SIZE * config_.channels;
    workBufferL_.resize(maxFrameSize);
    workBufferR_.resize(maxFrameSize);
    tempBuffer_.resize(maxFrameSize);
}

std::string NativeAudioSafetyModule::getModuleInfo() const {
    char buffer[256];
    std::snprintf(buffer, sizeof(buffer),
                  "NativeAudioSafetyModule{state=%s, initialized=%s, processing=%s, "
                  "sampleRate=%u, channels=%d, optimized=%s}",
                  stateToString(currentState_.load()).c_str(), isInitialized_.load() ? "true" : "false",
                  isProcessing_.load() ? "true" : "false", config_.sampleRate, config_.channels,
                  config_.optimizationConfig.useOptimizedEngine ? "true" : "false");
    return std::string(buffer);
}

// === Fonction d'enregistrement du module ===
JSI_EXPORT std::shared_ptr<facebook::react::TurboModule> NativeAudioSafetyModuleProvider(
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
    return std::make_shared<facebook::react::NativeAudioSafetyModule>(jsInvoker);
}

} // namespace react
} // namespace facebook
