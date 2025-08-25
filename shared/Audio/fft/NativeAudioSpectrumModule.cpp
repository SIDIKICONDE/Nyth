#include "NativeAudioSpectrumModule.h"

#include <algorithm>
#include <chrono>

namespace facebook {
namespace react {

// Using declarations handled in header; prefer fully-qualified names when needed

NativeAudioSpectrumModule::NativeAudioSpectrumModule(std::shared_ptr<CallInvoker> jsInvoker)
    : TurboModule("NativeAudioSpectrumModule", jsInvoker) {
    jsInvoker_ = jsInvoker;
    // Initialisation des composants
    initializeManagers();

    // Configuration par défaut
    config_ = SpectrumConfig::getDefault();
}

NativeAudioSpectrumModule::~NativeAudioSpectrumModule() {
    cleanupManagers();
}

// === Cycle de vie ===

jsi::Value NativeAudioSpectrumModule::initialize(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(mutex_);

    try {
        // Conversion JSI vers native
        auto newConfig = SpectrumJSIConverter::jsiToSpectrumConfig(rt, config);

        // Validation
        if (!validateConfig(newConfig)) {
            handleError(SpectrumError::INVALID_CONFIG, "Invalid configuration provided");
            return jsi::Value(false);
        }

        // Application de la configuration
        if (spectrumManager_ && spectrumManager_->setConfig(newConfig)) {
            config_ = newConfig;
            isInitialized_.store(true);
            currentState_ = SpectrumState::INITIALIZED;
            return jsi::Value(true);
        } else {
            currentState_ = SpectrumState::ERROR;
            handleError(SpectrumError::FFT_FAILED, "Failed to initialize spectrum manager");
            return jsi::Value(false);
        }
    } catch (const std::exception& e) {
        handleError(SpectrumError::INVALID_CONFIG, std::string("Initialization failed: ") + e.what());
        currentState_ = SpectrumState::ERROR;
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioSpectrumModule::isInitialized(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);
    return jsi::Value(isInitialized_.load());
}

jsi::Value NativeAudioSpectrumModule::release(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    try {
        if (spectrumManager_) {
            spectrumManager_->stop();
            spectrumManager_->release();
        }

        cleanupManagers();

        isInitialized_.store(false);
        isAnalyzing_.store(false);
        currentState_ = SpectrumState::SHUTDOWN;

        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(SpectrumError::INVALID_CONFIG, std::string("Release failed: ") + e.what());
        return jsi::Value(false);
    }
}

// === État et informations ===

jsi::Value NativeAudioSpectrumModule::getState(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    // Aligne la spec TS: getState() -> number
    return jsi::Value(static_cast<int>(currentState_.load()));
}

jsi::Value NativeAudioSpectrumModule::getErrorString(jsi::Runtime& rt, int errorCode) {
    auto error = static_cast<SpectrumError>(errorCode);
    return jsi::String::createFromUtf8(rt, errorToString(error));
}

jsi::Value NativeAudioSpectrumModule::getInfo(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    auto infoObj = jsi::Object(rt);
    infoObj.setProperty(rt, "moduleName", jsi::String::createFromUtf8(rt, kModuleName));
    infoObj.setProperty(rt, "version", jsi::String::createFromUtf8(rt, "2.0.0"));
    infoObj.setProperty(rt, "architecture", jsi::String::createFromUtf8(rt, "modular"));
    infoObj.setProperty(rt, "fftSize", jsi::Value(static_cast<double>(config_.fftSize)));
    infoObj.setProperty(rt, "sampleRate", jsi::Value(static_cast<double>(config_.sampleRate)));
    infoObj.setProperty(rt, "numBands", jsi::Value(static_cast<double>(config_.numBands)));
    infoObj.setProperty(rt, "useWindowing", jsi::Value(config_.useWindowing));

    return infoObj;
}

// === Configuration ===

jsi::Value NativeAudioSpectrumModule::setConfig(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(mutex_);

    try {
        // Conversion JSI vers native
        auto newConfig = SpectrumJSIConverter::jsiToSpectrumConfig(rt, config);

        // Validation
        if (!validateConfig(newConfig)) {
            handleError(SpectrumError::INVALID_CONFIG, "Invalid configuration provided");
            return jsi::Value(false);
        }

        // Application de la configuration
        if (spectrumManager_ && spectrumManager_->setConfig(newConfig)) {
            config_ = newConfig;
            return jsi::Value(true);
        } else {
            handleError(SpectrumError::FFT_FAILED, "Failed to update spectrum manager configuration");
            return jsi::Value(false);
        }
    } catch (const std::exception& e) {
        handleError(SpectrumError::INVALID_CONFIG,
                    std::string("Configuration update failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioSpectrumModule::getConfig(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);
    return SpectrumJSIConverter::spectrumConfigToJSI(rt, config_);
}

// === Traitement audio ===

jsi::Value NativeAudioSpectrumModule::processAudioBuffer(jsi::Runtime& rt, const jsi::Array& input) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!isInitialized_.load() || !isAnalyzing_.load()) {
        return jsi::Value(false);
    }

    try {
        // Conversion des données d'entrée
        auto inputData = SpectrumJSIConverter::jsiArrayToFloatVector(rt, input);

        // Vérification des paramètres
        if (inputData.empty()) {
            return jsi::Value(false);
        }

        // Traitement
        bool success = spectrumManager_->processAudioBuffer(inputData.data(), inputData.size());

        // Aligne la spec TS: retourner un booléen
        return jsi::Value(success);
    } catch (const std::exception& e) {
        handleError(SpectrumError::FFT_FAILED, std::string("Audio processing failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioSpectrumModule::processAudioBufferStereo(jsi::Runtime& rt, const jsi::Array& inputL,
                                                               const jsi::Array& inputR) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!isInitialized_.load() || !isAnalyzing_.load()) {
        return jsi::Value(false);
    }

    try {
        // Conversion des données d'entrée
        auto inputLData = SpectrumJSIConverter::jsiArrayToFloatVector(rt, inputL);
        auto inputRData = SpectrumJSIConverter::jsiArrayToFloatVector(rt, inputR);

        // Validation
        if (inputLData.empty() || inputRData.empty() || inputLData.size() != inputRData.size()) {
            handleError(SpectrumError::INVALID_BUFFER, "Invalid stereo input data");
            return jsi::Value(false);
        }

        // Traitement stéréo
        bool success =
            spectrumManager_->processAudioBufferStereo(inputLData.data(), inputRData.data(), inputLData.size());

        // Aligne la spec TS: retourner un booléen
        return jsi::Value(success);
    } catch (const std::exception& e) {
        handleError(SpectrumError::FFT_FAILED, std::string("Stereo audio processing failed: ") + e.what());
        return jsi::Value(false);
    }
}

// === Analyse et rapports ===

jsi::Value NativeAudioSpectrumModule::getLastSpectrumData(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!spectrumManager_) {
        return jsi::Value(nullptr);
    }

    try {
        auto data = spectrumManager_->getLastSpectrumData();
        return SpectrumJSIConverter::spectrumDataToJSI(rt, data);
    } catch (const std::exception& e) {
        handleError(SpectrumError::FFT_FAILED, std::string("Get spectrum data failed: ") + e.what());
        return jsi::Value(nullptr);
    }
}

jsi::Value NativeAudioSpectrumModule::getStatistics(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!spectrumManager_) {
        return jsi::Value(nullptr);
    }

    try {
        auto stats = spectrumManager_->getStatistics();
        return SpectrumJSIConverter::spectrumStatisticsToJSI(rt, stats);
    } catch (const std::exception& e) {
        handleError(SpectrumError::FFT_FAILED, std::string("Get statistics failed: ") + e.what());
        return jsi::Value(nullptr);
    }
}

jsi::Value NativeAudioSpectrumModule::resetStatistics(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!spectrumManager_) {
        return jsi::Value(false);
    }

    try {
        spectrumManager_->resetStatistics();
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(SpectrumError::FFT_FAILED, std::string("Reset statistics failed: ") + e.what());
        return jsi::Value(false);
    }
}

// === Contrôles ===

jsi::Value NativeAudioSpectrumModule::startAnalysis(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!isInitialized_.load()) {
        handleError(SpectrumError::NOT_INITIALIZED, "Module not initialized");
        return jsi::Value(false);
    }

    if (isAnalyzing_.load()) {
        return jsi::Value(true); // Already analyzing
    }

    try {
        if (spectrumManager_->start()) {
            isAnalyzing_.store(true);
            currentState_ = SpectrumState::ANALYZING;
            return jsi::Value(true);
        } else {
            return jsi::Value(false);
        }
    } catch (const std::exception& e) {
        handleError(SpectrumError::FFT_FAILED, std::string("Start analysis failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioSpectrumModule::stopAnalysis(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!isAnalyzing_.load()) {
        return jsi::Value(true); // Already stopped
    }

    try {
        if (spectrumManager_->stop()) {
            isAnalyzing_.store(false);
            currentState_ = SpectrumState::INITIALIZED;
            return jsi::Value(true);
        } else {
            return jsi::Value(false);
        }
    } catch (const std::exception& e) {
        handleError(SpectrumError::FFT_FAILED, std::string("Stop analysis failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioSpectrumModule::isAnalyzing(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(mutex_);
    return jsi::Value(isAnalyzing_.load());
}

// === Utilitaires ===

jsi::Value NativeAudioSpectrumModule::calculateFFTSize(jsi::Runtime& rt, size_t desiredSize) {
    // Trouver la puissance de 2 la plus proche
    size_t fftSize = 64;                              // Minimum
    while (fftSize < desiredSize && fftSize < 8192) { // Maximum
        fftSize *= 2;
    }
    return jsi::Value(static_cast<double>(fftSize));
}

jsi::Value NativeAudioSpectrumModule::validateConfig(jsi::Runtime& rt, const jsi::Object& config) {
    bool isValid = SpectrumJSIConverter::validateJSIConfig(rt, config);
    return jsi::Value(isValid);
}

// === Callbacks JavaScript ===

jsi::Value NativeAudioSpectrumModule::setDataCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(mutex_);

    try {
        // Validation du callback manager
        if (!callbackManager_) {
            handleError(SpectrumError::NOT_INITIALIZED, "Callback manager not initialized");
            return jsi::Value(false);
        }

        // Enregistrer le callback avec validation
        callbackManager_->registerCallback("spectrumData", rt, callback);

        // Configurer le callback sur le spectrum manager si disponible
        if (spectrumManager_) {
            spectrumManager_->setDataCallback(
                [this](const SpectrumData& data) {
                    if (data.isValid()) {
                        this->onSpectrumData(data);
                    }
                });
        }

        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(SpectrumError::INVALID_CONFIG,
                   std::string("Failed to set data callback: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioSpectrumModule::setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(mutex_);

    try {
        if (!callbackManager_) {
            handleError(SpectrumError::NOT_INITIALIZED, "Callback manager not initialized");
            return jsi::Value(false);
        }

        callbackManager_->registerCallback("error", rt, callback);
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(SpectrumError::INVALID_CONFIG,
                   std::string("Failed to set error callback: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioSpectrumModule::setStateCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(mutex_);

    try {
        if (!callbackManager_) {
            handleError(SpectrumError::NOT_INITIALIZED, "Callback manager not initialized");
            return jsi::Value(false);
        }

        callbackManager_->registerCallback("stateChange", rt, callback);
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(SpectrumError::INVALID_CONFIG,
                   std::string("Failed to set state callback: ") + e.what());
        return jsi::Value(false);
    }
}

// === Installation du module ===

jsi::Value NativeAudioSpectrumModule::install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker) {
    // Créer l'instance du module
    auto module = std::make_shared<NativeAudioSpectrumModule>(jsInvoker);

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
                return jsi::String::createFromUtf8(rt, NativeAudioSpectrumModule::kModuleName);
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

    // Fonction isInitialized
    turboModule.setProperty(rt, "isInitialized",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "isInitialized"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->isInitialized(rt); }));

    // Fonction release
    turboModule.setProperty(rt, "release",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "release"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->release(rt); }));

    // Alias dispose -> release
    turboModule.setProperty(rt, "dispose",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "dispose"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->release(rt); }));

    // Fonction getState (renvoie un nombre)
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

    // Fonction startAnalysis
    turboModule.setProperty(rt, "startAnalysis",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "startAnalysis"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->startAnalysis(rt); }));

    // Fonction stopAnalysis
    turboModule.setProperty(rt, "stopAnalysis",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "stopAnalysis"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->stopAnalysis(rt); }));

    // Fonction isAnalyzing
    turboModule.setProperty(rt, "isAnalyzing",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "isAnalyzing"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->isAnalyzing(rt); }));

    // Fonction processAudioBuffer
    turboModule.setProperty(
        rt, "processAudioBuffer",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "processAudioBuffer"), 1,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                if (count > 0 && args[0].isObject()) {
                    auto inputArray = args[0].asObject(rt).asArray(rt);
                    return module->processAudioBuffer(rt, inputArray);
                }
                return jsi::Value(false);
            }));

    // Fonction processAudioBufferStereo
    turboModule.setProperty(
        rt, "processAudioBufferStereo",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "processAudioBufferStereo"), 2,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                if (count >= 2 && args[0].isObject() && args[1].isObject()) {
                    auto inputLArray = args[0].asObject(rt).asArray(rt);
                    auto inputRArray = args[1].asObject(rt).asArray(rt);
                    return module->processAudioBufferStereo(rt, inputLArray, inputRArray);
                }
                return jsi::Value(false);
            }));

    // Fonction getLastSpectrumData
    turboModule.setProperty(rt, "getLastSpectrumData",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "getLastSpectrumData"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->getLastSpectrumData(rt); }));

    // Alias TS: getSpectrumData()
    turboModule.setProperty(rt, "getSpectrumData",
                            jsi::Function::createFromHostFunction(
                                rt, jsi::PropNameID::forUtf8(rt, "getSpectrumData"), 0,
                                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                         size_t count) { return module->getLastSpectrumData(rt); }));

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

    // Fonctions utilitaires
    turboModule.setProperty(
        rt, "calculateFFTSize",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "calculateFFTSize"), 1,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                if (count > 0 && args[0].isNumber()) {
                    size_t desiredSize = static_cast<size_t>(args[0].asNumber());
                    return module->calculateFFTSize(rt, desiredSize);
                }
                return jsi::Value(static_cast<double>(1024));
            }));

    // Expose validateConfig(config)
    turboModule.setProperty(
        rt, "validateConfig",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "validateConfig"), 1,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                if (count > 0 && args[0].isObject()) {
                    return module->validateConfig(rt, args[0].asObject(rt));
                }
                return jsi::Value(false);
            }));

    // Callbacks
    turboModule.setProperty(
        rt, "setDataCallback",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "setDataCallback"), 1,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                if (count > 0 && args[0].isObject()) {
                    auto callback = args[0].asObject(rt).asFunction(rt);
                    return module->setDataCallback(rt, callback);
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
        rt, "setStateCallback",
        jsi::Function::createFromHostFunction(
            rt, jsi::PropNameID::forUtf8(rt, "setStateCallback"), 1,
            [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                if (count > 0 && args[0].isObject()) {
                    auto callback = args[0].asObject(rt).asFunction(rt);
                    return module->setStateCallback(rt, callback);
                }
                return jsi::Value(false);
            }));

    return turboModule;
}

// === Méthodes privées ===

void NativeAudioSpectrumModule::initializeManagers() {
    // Créer le callback manager
    callbackManager_ = std::make_shared<JSICallbackManager>(jsInvoker_);

    // Créer le spectrum manager
    spectrumManager_ = std::make_unique<Nyth::Audio::SpectrumManager>();

    // Configuration des callbacks
    setupCallbacks();
}

void NativeAudioSpectrumModule::cleanupManagers() {
    if (spectrumManager_) {
        spectrumManager_->release();
        spectrumManager_.reset();
    }

    if (callbackManager_) {
        callbackManager_->clearAllCallbacks();
        callbackManager_.reset();
    }
}

void NativeAudioSpectrumModule::setRuntime(jsi::Runtime* rt) {
    std::lock_guard<std::mutex> lock(mutex_);
    runtime_ = rt;
    runtimeValid_.store(rt != nullptr);

    if (callbackManager_) {
        callbackManager_->setRuntime(rt);
    }
}

void NativeAudioSpectrumModule::invalidateRuntime() {
    std::lock_guard<std::mutex> lock(mutex_);
    runtimeValid_.store(false);
    runtime_ = nullptr;

    if (callbackManager_) {
        callbackManager_->invalidateRuntime();
    }
}

void NativeAudioSpectrumModule::handleError(SpectrumError error, const std::string& message) {
    currentState_ = SpectrumState::ERROR;

    // Notifier via callback si disponible
    if (callbackManager_ && runtimeValid_.load()) {
        onError(error, message);
    }
}

std::string NativeAudioSpectrumModule::stateToString(SpectrumState state) const {
    return Nyth::Audio::stateToString(state);
}

std::string NativeAudioSpectrumModule::errorToString(SpectrumError error) const {
    return Nyth::Audio::errorToString(error);
}

void NativeAudioSpectrumModule::onSpectrumData(const SpectrumData& data) {
    if (callbackManager_ && runtimeValid_.load()) {
        try {
            callbackManager_->invokeCallback("spectrumData", [this, data](jsi::Runtime& rt) {
                auto dataObj = SpectrumJSIConverter::spectrumDataToJSI(rt, data);
                return std::vector<jsi::Value>{dataObj};
            });
        } catch (const std::exception& e) {
            // Silencer les erreurs de callback
        }
    }
}

void NativeAudioSpectrumModule::onError(SpectrumError error, const std::string& message) {
    if (callbackManager_ && runtimeValid_.load()) {
        try {
            // Aligne la spec TS: (errorCode: number, message: string)
            callbackManager_->invokeCallback("error", [error, message](jsi::Runtime& rt) {
                return std::vector<jsi::Value>{
                    jsi::Value(static_cast<int>(error)),
                    jsi::String::createFromUtf8(rt, message)
                };
            });
        } catch (const std::exception& e) {
            // Silencer les erreurs de callback
        }
    }
}

void NativeAudioSpectrumModule::onStateChange(SpectrumState oldState,
                                              SpectrumState newState) {
    if (callbackManager_ && runtimeValid_.load()) {
        try {
            // Aligne la spec TS: (oldState: number, newState: number)
            callbackManager_->invokeCallback("stateChange", [oldState, newState](jsi::Runtime& rt) {
                return std::vector<jsi::Value>{
                    jsi::Value(static_cast<int>(oldState)),
                    jsi::Value(static_cast<int>(newState))
                };
            });
        } catch (const std::exception& e) {
            // Silencer les erreurs de callback
        }
    }
}

bool NativeAudioSpectrumModule::validateConfig(const SpectrumConfig& config) const {
    return config.isValid();
}

void NativeAudioSpectrumModule::setupCallbacks() {
    if (spectrumManager_) {
        spectrumManager_->setStateCallback(
            [this](SpectrumState oldState, SpectrumState newState) {
                this->onStateChange(oldState, newState);
            });

        spectrumManager_->setErrorCallback([this](SpectrumError error, const std::string& message) {
            this->handleError(error, message);
        });
    }
}

} // namespace react
} // namespace facebook