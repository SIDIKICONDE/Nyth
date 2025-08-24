#include "NativeAudioCaptureModule.h"

#if NYTH_AUDIO_CAPTURE_ENABLED

#include <ReactCommon/TurboModuleUtils.h>
#include <sstream>

namespace facebook {
namespace react {

NativeAudioCaptureModule::NativeAudioCaptureModule(std::shared_ptr<CallInvoker> jsInvoker) {
    // Initialiser avec les valeurs par défaut
    config_ = Nyth::Audio::AudioConfig();

    // Créer le gestionnaire de callbacks
    callbackManager_ = std::make_unique<JSICallbackManager>(jsInvoker);

    // Le captureManager sera créé lors de l'initialisation
}

NativeAudioCaptureModule::~NativeAudioCaptureModule() {
    cleanupManagers();
}

// === Cycle de vie ===
jsi::Value NativeAudioCaptureModule::initialize(jsi::Runtime& rt, const jsi::Object& config) {
    try {
        // Parser et valider la configuration
        config_ = JSIConverter::jsToAudioConfig(rt, config);

        // Sauvegarder le runtime pour les callbacks
        setRuntime(&rt);

        // Initialiser les gestionnaires
        initializeManagers();

        // Initialiser la capture audio
        if (captureManager_ && captureManager_->initialize(config_)) {
            isInitialized_.store(true);
            return jsi::Value(true);
        }

        throw jsi::JSError(rt, "Failed to initialize audio capture");

    } catch (const jsi::JSError& e) {
        throw;
    } catch (const std::exception& e) {
        throw jsi::JSError(rt, std::string("Initialization failed: ") + e.what());
    }
}

jsi::Value NativeAudioCaptureModule::start(jsi::Runtime& rt) {
    if (!isInitialized_.load() || !captureManager_) {
        throw jsi::JSError(rt, "Audio capture not initialized");
    }

    if (captureManager_->start()) {
        return jsi::Value(true);
    }

    throw jsi::JSError(rt, "Failed to start audio capture");
}

jsi::Value NativeAudioCaptureModule::stop(jsi::Runtime& rt) {
    if (!isInitialized_.load() || !captureManager_) {
        return jsi::Value(false);
    }

    return jsi::Value(captureManager_->stop());
}

jsi::Value NativeAudioCaptureModule::pause(jsi::Runtime& rt) {
    if (!isInitialized_.load() || !captureManager_) {
        return jsi::Value(false);
    }

    return jsi::Value(captureManager_->pause());
}

jsi::Value NativeAudioCaptureModule::resume(jsi::Runtime& rt) {
    if (!isInitialized_.load() || !captureManager_) {
        return jsi::Value(false);
    }

    return jsi::Value(captureManager_->resume());
}

jsi::Value NativeAudioCaptureModule::dispose(jsi::Runtime& rt) {
    cleanupManagers();
    return jsi::Value::undefined();
}

// === État et informations ===
jsi::Value NativeAudioCaptureModule::getState(jsi::Runtime& rt) {
    if (!isInitialized_.load() || !captureManager_) {
        return jsi::String::createFromUtf8(rt, "uninitialized");
    }

    auto state = captureManager_->getState();
    return jsi::String::createFromUtf8(rt, JSIConverter::stateToString(state));
}

jsi::Value NativeAudioCaptureModule::isCapturing(jsi::Runtime& rt) {
    if (!isInitialized_.load() || !captureManager_) {
        return jsi::Value(false);
    }

    return jsi::Value(captureManager_->isCapturing());
}

jsi::Value NativeAudioCaptureModule::getStatistics(jsi::Runtime& rt) {
    if (!isInitialized_.load() || !captureManager_) {
        return jsi::Value::null();
    }

    auto stats = captureManager_->getStatistics();
    return JSIConverter::audioStatisticsToJS(rt, stats);
}

jsi::Value NativeAudioCaptureModule::resetStatistics(jsi::Runtime& rt) {
    if (isInitialized_.load() && captureManager_) {
        captureManager_->resetStatistics();
    }
    return jsi::Value::undefined();
}

// === Configuration ===
jsi::Value NativeAudioCaptureModule::getConfig(jsi::Runtime& rt) {
    return JSIConverter::audioConfigToJS(rt, config_);
}

jsi::Value NativeAudioCaptureModule::updateConfig(jsi::Runtime& rt, const jsi::Object& config) {
    if (!isInitialized_.load() || !captureManager_) {
        return jsi::Value(false);
    }

    try {
        auto newConfig = JSIConverter::jsToAudioConfig(rt, config);
        bool success = captureManager_->updateConfig(newConfig);

        if (success) {
            config_ = newConfig;
        }

        return jsi::Value(success);
    } catch (const std::exception& e) {
        return jsi::Value(false);
    }
}

// === Niveaux audio ===
jsi::Value NativeAudioCaptureModule::getCurrentLevel(jsi::Runtime& rt) {
    if (!isInitialized_.load() || !captureManager_) {
        return jsi::Value(0.0);
    }

    float level = captureManager_->getCurrentLevel();
    return jsi::Value(static_cast<double>(level));
}

jsi::Value NativeAudioCaptureModule::getPeakLevel(jsi::Runtime& rt) {
    if (!isInitialized_.load() || !captureManager_) {
        return jsi::Value(0.0);
    }

    float level = captureManager_->getPeakLevel();
    return jsi::Value(static_cast<double>(level));
}

jsi::Value NativeAudioCaptureModule::resetPeakLevel(jsi::Runtime& rt) {
    if (isInitialized_.load() && captureManager_) {
        captureManager_->resetPeakLevel();
    }
    return jsi::Value::undefined();
}

// === Analyse audio ===
jsi::Value NativeAudioCaptureModule::getRMS(jsi::Runtime& rt) {
    if (!isInitialized_.load() || !captureManager_) {
        return jsi::Value(0.0);
    }

    double rms = captureManager_->getRMS();
    return jsi::Value(rms);
}

jsi::Value NativeAudioCaptureModule::getRMSdB(jsi::Runtime& rt) {
    if (!isInitialized_.load() || !captureManager_) {
        return jsi::Value(-100.0);
    }

    double rmsDb = captureManager_->getRMSdB();
    return jsi::Value(rmsDb);
}

jsi::Value NativeAudioCaptureModule::isSilent(jsi::Runtime& rt, double threshold) {
    if (threshold < Nyth::Audio::Limits::MIN_THRESHOLD || threshold > Nyth::Audio::Limits::MAX_THRESHOLD) {
        throw jsi::JSError(rt, "Threshold must be between " + std::to_string(Nyth::Audio::Limits::MIN_THRESHOLD) +
                                   " and " + std::to_string(Nyth::Audio::Limits::MAX_THRESHOLD));
    }

    if (!isInitialized_.load() || !captureManager_) {
        return jsi::Value(true);
    }

    bool silent = captureManager_->isSilent(static_cast<float>(threshold));
    return jsi::Value(silent);
}

jsi::Value NativeAudioCaptureModule::hasClipping(jsi::Runtime& rt) {
    if (!isInitialized_.load() || !captureManager_) {
        return jsi::Value(false);
    }

    bool clipping = captureManager_->hasClipping();
    return jsi::Value(clipping);
}

// === Périphériques ===
jsi::Value NativeAudioCaptureModule::getAvailableDevices(jsi::Runtime& rt) {
    if (!isInitialized_.load() || !captureManager_) {
        return jsi::Array(rt, 0);
    }

    auto devices = captureManager_->getAvailableDevices();
    return JSIConverter::audioDevicesToJS(rt, devices);
}

jsi::Value NativeAudioCaptureModule::selectDevice(jsi::Runtime& rt, const jsi::String& deviceId) {
    if (!isInitialized_.load() || !captureManager_) {
        return jsi::Value(false);
    }

    std::string id = deviceId.utf8(rt);
    bool success = captureManager_->selectDevice(id);
    return jsi::Value(success);
}

jsi::Value NativeAudioCaptureModule::getCurrentDevice(jsi::Runtime& rt) {
    if (!isInitialized_.load() || !captureManager_) {
        return jsi::Value::null();
    }

    auto device = captureManager_->getCurrentDevice();
    return JSIConverter::audioDeviceToJS(rt, device);
}

// === Permissions ===
jsi::Value NativeAudioCaptureModule::hasPermission(jsi::Runtime& rt) {
    if (!isInitialized_.load() || !captureManager_) {
        return jsi::Value(false);
    }

    bool hasPermission = captureManager_->hasPermission();
    return jsi::Value(hasPermission);
}

jsi::Value NativeAudioCaptureModule::requestPermission(jsi::Runtime& rt) {
    if (!isInitialized_.load() || !captureManager_) {
        throw jsi::JSError(rt, "Audio capture not initialized");
    }

    auto promise =
        rt.global()
            .getPropertyAsFunction(rt, "Promise")
            .callAsConstructor(
                rt, jsi::Function::createFromHostFunction(
                        rt, jsi::PropNameID::forAscii(rt, "executor"), 2,
                        [this](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t) -> jsi::Value {
                            auto resolve = std::make_shared<jsi::Function>(args[0].asObject(rt).asFunction(rt));
                            auto reject = std::make_shared<jsi::Function>(args[1].asObject(rt).asFunction(rt));

                            captureManager_->requestPermission([resolve, reject](bool granted) {
                                // Cette callback sera appelée depuis un thread natif
                                // Le callbackManager gère l'invocation sur le thread JS
                                if (granted) {
                                    // TODO: Invoker resolve sur le thread JS
                                } else {
                                    // TODO: Invoker reject sur le thread JS
                                }
                            });

                            return jsi::Value::undefined();
                        }));

    return promise;
}

// === Enregistrement ===
jsi::Value NativeAudioCaptureModule::startRecording(jsi::Runtime& rt, const jsi::String& filePath,
                                                    const jsi::Object& options) {
    // TODO: Implémenter avec AudioRecorderManager
    return jsi::Value(false);
}

jsi::Value NativeAudioCaptureModule::stopRecording(jsi::Runtime& rt) {
    // TODO: Implémenter avec AudioRecorderManager
    return jsi::Value(false);
}

jsi::Value NativeAudioCaptureModule::pauseRecording(jsi::Runtime& rt) {
    // TODO: Implémenter avec AudioRecorderManager
    return jsi::Value(false);
}

jsi::Value NativeAudioCaptureModule::resumeRecording(jsi::Runtime& rt) {
    // TODO: Implémenter avec AudioRecorderManager
    return jsi::Value(false);
}

jsi::Value NativeAudioCaptureModule::isRecording(jsi::Runtime& rt) {
    // TODO: Implémenter avec AudioRecorderManager
    return jsi::Value(false);
}

jsi::Value NativeAudioCaptureModule::getRecordingInfo(jsi::Runtime& rt) {
    // TODO: Implémenter avec AudioRecorderManager
    return jsi::Value::null();
}

// === Callbacks JavaScript ===
jsi::Value NativeAudioCaptureModule::setAudioDataCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    if (callbackManager_) {
        callbackManager_->setAudioDataCallback(callback);
    }
    return jsi::Value::undefined();
}

jsi::Value NativeAudioCaptureModule::setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    if (callbackManager_) {
        callbackManager_->setErrorCallback(callback);
    }
    return jsi::Value::undefined();
}

jsi::Value NativeAudioCaptureModule::setStateChangeCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    if (callbackManager_) {
        callbackManager_->setStateChangeCallback(callback);
    }
    return jsi::Value::undefined();
}

jsi::Value NativeAudioCaptureModule::setAnalysisCallback(jsi::Runtime& rt, const jsi::Function& callback,
                                                         double intervalMs) {
    if (callbackManager_) {
        callbackManager_->setAnalysisCallback(callback);
    }
    return jsi::Value::undefined();
}

// === Installation du module ===
jsi::Value NativeAudioCaptureModule::install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker) {
    auto module = std::make_shared<NativeAudioCaptureModule>(jsInvoker);

    auto object = jsi::Object(rt);

// Macro pour enregistrer une méthode
#define REGISTER_METHOD(name, paramCount)                                                                  \
    object.setProperty(rt, name,                                                                           \
                       jsi::Function::createFromHostFunction(                                              \
                           rt, jsi::PropNameID::forAscii(rt, name), static_cast<unsigned int>(paramCount), \
                           [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args,           \
                                    size_t count) -> jsi::Value { return module->name(rt, ##__VA_ARGS__); }))

    // Enregistrer toutes les méthodes
    REGISTER_METHOD(initialize, 1);
    REGISTER_METHOD(start, 0);
    REGISTER_METHOD(stop, 0);
    REGISTER_METHOD(pause, 0);
    REGISTER_METHOD(resume, 0);
    REGISTER_METHOD(dispose, 0);

    REGISTER_METHOD(getState, 0);
    REGISTER_METHOD(isCapturing, 0);
    REGISTER_METHOD(getStatistics, 0);
    REGISTER_METHOD(resetStatistics, 0);

    REGISTER_METHOD(getConfig, 0);
    REGISTER_METHOD(updateConfig, 1);

    REGISTER_METHOD(getCurrentLevel, 0);
    REGISTER_METHOD(getPeakLevel, 0);
    REGISTER_METHOD(resetPeakLevel, 0);

    REGISTER_METHOD(getRMS, 0);
    REGISTER_METHOD(getRMSdB, 0);
    REGISTER_METHOD(isSilent, 1);
    REGISTER_METHOD(hasClipping, 0);

    REGISTER_METHOD(getAvailableDevices, 0);
    REGISTER_METHOD(selectDevice, 1);
    REGISTER_METHOD(getCurrentDevice, 0);

    REGISTER_METHOD(hasPermission, 0);
    REGISTER_METHOD(requestPermission, 0);

    REGISTER_METHOD(startRecording, 2);
    REGISTER_METHOD(stopRecording, 0);
    REGISTER_METHOD(pauseRecording, 0);
    REGISTER_METHOD(resumeRecording, 0);
    REGISTER_METHOD(isRecording, 0);
    REGISTER_METHOD(getRecordingInfo, 0);

    REGISTER_METHOD(setAudioDataCallback, 1);
    REGISTER_METHOD(setErrorCallback, 1);
    REGISTER_METHOD(setStateChangeCallback, 1);
    REGISTER_METHOD(setAnalysisCallback, 2);

#undef REGISTER_METHOD

    rt.global().setProperty(rt, "NativeAudioCaptureModule", object);
    return object;
}

// === Méthodes privées ===
void NativeAudioCaptureModule::initializeManagers() {
    if (!captureManager_) {
        captureManager_ = std::make_unique<AudioCaptureManager>(callbackManager_);
    }

    if (callbackManager_ && runtime_) {
        callbackManager_->setRuntime(runtime_);
    }
}

void NativeAudioCaptureModule::cleanupManagers() {
    isInitialized_.store(false);

    if (captureManager_) {
        captureManager_.reset();
    }

    if (callbackManager_) {
        callbackManager_->clearAllCallbacks();
        callbackManager_->invalidateRuntime();
        callbackManager_.reset();
    }

    invalidateRuntime();
}

void NativeAudioCaptureModule::setRuntime(jsi::Runtime* rt) {
    runtime_ = rt;
    runtimeValid_.store(rt != nullptr);

    if (callbackManager_) {
        callbackManager_->setRuntime(rt);
    }
}

void NativeAudioCaptureModule::invalidateRuntime() {
    runtimeValid_.store(false);
    runtime_ = nullptr;

    if (callbackManager_) {
        callbackManager_->invalidateRuntime();
    }
}

void NativeAudioCaptureModule::handleError(const std::string& error) {
    if (callbackManager_) {
        callbackManager_->invokeErrorCallback(error);
    }
}

// === Provider function ===
std::shared_ptr<TurboModule> NativeAudioCaptureModuleProvider(std::shared_ptr<CallInvoker> jsInvoker) {
    return std::make_shared<NativeAudioCaptureModule>(jsInvoker);
}

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_CAPTURE_ENABLED
