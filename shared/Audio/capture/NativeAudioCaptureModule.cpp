#include "NativeAudioCaptureModule.h"

#if NYTH_AUDIO_CAPTURE_ENABLED

#include <ReactCommon/TurboModuleUtils.h>
#include <sstream>

namespace facebook {
namespace react {

NativeAudioCaptureModule::NativeAudioCaptureModule(std::shared_ptr<CallInvoker> jsInvoker) {
    // Initialiser avec les valeurs par défaut
    config_ = Nyth::Audio::AudioCaptureConfig();

    // Créer le gestionnaire de callbacks
    callbackManager_ = std::make_unique<JSICallbackManager>(jsInvoker);
    jsInvoker_ = jsInvoker;

    // Le captureManager sera créé lors de l'initialisation
}

NativeAudioCaptureModule::~NativeAudioCaptureModule() {
    cleanupManagers();
}

// === Cycle de vie ===
jsi::Value NativeAudioCaptureModule::initialize(jsi::Runtime& rt, const jsi::Object& config) {
    try {
        // Parser et valider la configuration
        const auto highLevel = JSIConverter::jsToAudioConfig(rt, config);
        config_ = toCaptureConfig(highLevel);

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
    return JSIConverter::audioConfigToJS(rt, toAudioConfig(config_));
}

jsi::Value NativeAudioCaptureModule::updateConfig(jsi::Runtime& rt, const jsi::Object& config) {
    if (!isInitialized_.load() || !captureManager_) {
        return jsi::Value(false);
    }

    try {
        auto newHighLevel = JSIConverter::jsToAudioConfig(rt, config);
        auto newConfig = toCaptureConfig(newHighLevel);
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

                            captureManager_->requestPermission([this, resolve, reject, rt](bool granted) {
                                // Cette callback sera appelée depuis un thread natif
                                // Le callbackManager gère l'invocation sur le thread JS
                                if (runtimeValid_.load() && jsInvoker_) {
                                    jsInvoker_->invokeAsync([resolve, reject, granted, rt]() {
                                        if (granted) {
                                            resolve->call(jsi::Value(true));
                                        } else {
                                            auto error =
                                                jsi::JSError(jsi::String::createFromUtf8(rt, "Permission denied"));
                                            reject->call(error.value());
                                        }
                                    });
                                } else {
                                    // Fallback si runtime non disponible
                                    if (granted) {
                                        resolve->call(jsi::Value(true));
                                    } else {
                                        auto error = jsi::JSError(jsi::String::createFromUtf8(rt, "Permission denied"));
                                        reject->call(error.value());
                                    }
                                }
                            });

                            return jsi::Value::undefined();
                        }));

    return promise;
}

// === Enregistrement ===
jsi::Value NativeAudioCaptureModule::startRecording(jsi::Runtime& rt, const jsi::String& filePath,
                                                    const jsi::Object& options) {
    if (!isInitialized_.load() || !captureManager_) {
        return jsi::Value(false);
    }

    Nyth::Audio::AudioFileWriterConfig writerCfg;
    writerCfg.filePath = filePath.utf8(rt);
    writerCfg.sampleRate = config_.sampleRate;
    writerCfg.channelCount = config_.channelCount;
    writerCfg.bitsPerSample = config_.bitsPerSample;

    // Options: format, maxDuration, maxFileSize
    if (options.hasProperty(rt, "format")) {
        auto fmtStr = options.getProperty(rt, "format").asString(rt).utf8(rt);
        if (fmtStr == "wav" || fmtStr == "WAV") {
            writerCfg.format = Nyth::Audio::AudioFileFormat::WAV;
        } else if (fmtStr == "raw" || fmtStr == "RAW" || fmtStr == "raw_pcm") {
            writerCfg.format = Nyth::Audio::AudioFileFormat::RAW_PCM;
        }
    }

    float maxDurationSeconds = 0.0f;
    size_t maxFileSizeBytes = 0;
    if (options.hasProperty(rt, "maxDuration")) {
        maxDurationSeconds = static_cast<float>(options.getProperty(rt, "maxDuration").asNumber());
    }
    if (options.hasProperty(rt, "maxFileSize")) {
        maxFileSizeBytes = static_cast<size_t>(options.getProperty(rt, "maxFileSize").asNumber());
    }

    bool ok = captureManager_->startRecording(writerCfg.filePath, writerCfg, maxDurationSeconds, maxFileSizeBytes);
    return jsi::Value(ok);
}

jsi::Value NativeAudioCaptureModule::stopRecording(jsi::Runtime& rt) {
    if (captureManager_) {
        captureManager_->stopRecording();
        return jsi::Value(true);
    }
    return jsi::Value(false);
}

jsi::Value NativeAudioCaptureModule::pauseRecording(jsi::Runtime& rt) {
    if (captureManager_) {
        captureManager_->pauseRecording();
        return jsi::Value(true);
    }
    return jsi::Value(false);
}

jsi::Value NativeAudioCaptureModule::resumeRecording(jsi::Runtime& rt) {
    if (captureManager_) {
        captureManager_->resumeRecording();
        return jsi::Value(true);
    }
    return jsi::Value(false);
}

jsi::Value NativeAudioCaptureModule::isRecording(jsi::Runtime& rt) {
    if (captureManager_) {
        return jsi::Value(captureManager_->isRecording());
    }
    return jsi::Value(false);
}

jsi::Value NativeAudioCaptureModule::getRecordingInfo(jsi::Runtime& rt) {
    if (!captureManager_) {
        return jsi::Value::null();
    }
    auto info = captureManager_->getRecordingInfo();
    auto obj = jsi::Object(rt);
    obj.setProperty(rt, "duration", jsi::Value(info.durationSeconds));
    obj.setProperty(rt, "frames", jsi::Value(static_cast<double>(info.frames)));
    obj.setProperty(rt, "path", jsi::String::createFromUtf8(rt, info.path));
    obj.setProperty(rt, "isRecording", jsi::Value(info.recording));
    obj.setProperty(rt, "isPaused", jsi::Value(info.paused));
    return obj;
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
    // Démarrer/mettre à jour la boucle d'analyse
    analysisIntervalMs_.store(static_cast<int>(intervalMs));
    startAnalysisLoop();
    return jsi::Value::undefined();
}

// === Installation du module ===
jsi::Value NativeAudioCaptureModule::install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker) {
    auto module = std::make_shared<NativeAudioCaptureModule>(jsInvoker);

    auto object = jsi::Object(rt);

// Macro pour enregistrer une méthode
#define REGISTER_METHOD_0(name)                                                                             \
    object.setProperty(rt, #name,                                                                           \
                       jsi::Function::createFromHostFunction(                                               \
                           rt, jsi::PropNameID::forAscii(rt, #name), 0,                                     \
                           [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value*, size_t)         \
                               -> jsi::Value { return module->name(rt); }))

#define REGISTER_METHOD_1_OBJ(name)                                                                         \
    object.setProperty(rt, #name,                                                                           \
                       jsi::Function::createFromHostFunction(                                               \
                           rt, jsi::PropNameID::forAscii(rt, #name), 1,                                     \
                           [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t c)  \
                               -> jsi::Value {                                                              \
                                   if (c < 1 || !args[0].isObject())                                        \
                                       throw jsi::JSError(rt, #name " expects 1 object argument");         \
                                   return module->name(rt, args[0].asObject(rt));                           \
                               }))

#define REGISTER_METHOD_1_STR(name)                                                                         \
    object.setProperty(rt, #name,                                                                           \
                       jsi::Function::createFromHostFunction(                                               \
                           rt, jsi::PropNameID::forAscii(rt, #name), 1,                                     \
                           [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t c)  \
                               -> jsi::Value {                                                              \
                                   if (c < 1 || !args[0].isString())                                        \
                                       throw jsi::JSError(rt, #name " expects 1 string argument");         \
                                   return module->name(rt, args[0].asString(rt));                           \
                               }))

#define REGISTER_METHOD_1_NUM(name)                                                                         \
    object.setProperty(rt, #name,                                                                           \
                       jsi::Function::createFromHostFunction(                                               \
                           rt, jsi::PropNameID::forAscii(rt, #name), 1,                                     \
                           [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t c)  \
                               -> jsi::Value {                                                              \
                                   if (c < 1 || !args[0].isNumber())                                        \
                                       throw jsi::JSError(rt, #name " expects 1 number argument");         \
                                   return module->name(rt, args[0].asNumber());                             \
                               }))

    // Enregistrer toutes les méthodes
    REGISTER_METHOD_1_OBJ(initialize);
    REGISTER_METHOD_0(start);
    REGISTER_METHOD_0(stop);
    REGISTER_METHOD_0(pause);
    REGISTER_METHOD_0(resume);
    REGISTER_METHOD_0(dispose);

    REGISTER_METHOD_0(getState);
    REGISTER_METHOD_0(isCapturing);
    REGISTER_METHOD_0(getStatistics);
    REGISTER_METHOD_0(resetStatistics);

    REGISTER_METHOD_0(getConfig);
    REGISTER_METHOD_1_OBJ(updateConfig);

    REGISTER_METHOD_0(getCurrentLevel);
    REGISTER_METHOD_0(getPeakLevel);
    REGISTER_METHOD_0(resetPeakLevel);

    REGISTER_METHOD_0(getRMS);
    REGISTER_METHOD_0(getRMSdB);
    REGISTER_METHOD_1_NUM(isSilent);
    REGISTER_METHOD_0(hasClipping);

    REGISTER_METHOD_0(getAvailableDevices);
    REGISTER_METHOD_1_STR(selectDevice);
    REGISTER_METHOD_0(getCurrentDevice);

    REGISTER_METHOD_0(hasPermission);
    REGISTER_METHOD_0(requestPermission);

    // Recording methods left as TODOs; keep signatures
    object.setProperty(rt, "startRecording",
                       jsi::Function::createFromHostFunction(
                           rt, jsi::PropNameID::forAscii(rt, "startRecording"), 2,
                           [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t c) -> jsi::Value {
                               if (c < 2 || !args[0].isString() || !args[1].isObject()) {
                                   throw jsi::JSError(rt, "startRecording expects (string, object)");
                               }
                               return module->startRecording(rt, args[0].asString(rt), args[1].asObject(rt));
                           }));
    REGISTER_METHOD_0(stopRecording);
    REGISTER_METHOD_0(pauseRecording);
    REGISTER_METHOD_0(resumeRecording);
    REGISTER_METHOD_0(isRecording);
    REGISTER_METHOD_0(getRecordingInfo);

    // Callbacks
    object.setProperty(rt, "setAudioDataCallback",
                       jsi::Function::createFromHostFunction(
                           rt, jsi::PropNameID::forAscii(rt, "setAudioDataCallback"), 1,
                           [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t c) -> jsi::Value {
                               if (c < 1 || !args[0].isObject() || !args[0].asObject(rt).isFunction(rt)) {
                                   throw jsi::JSError(rt, "setAudioDataCallback expects function");
                               }
                               return module->setAudioDataCallback(rt, args[0].asObject(rt).asFunction(rt));
                           }));
    object.setProperty(rt, "setErrorCallback",
                       jsi::Function::createFromHostFunction(
                           rt, jsi::PropNameID::forAscii(rt, "setErrorCallback"), 1,
                           [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t c) -> jsi::Value {
                               if (c < 1 || !args[0].isObject() || !args[0].asObject(rt).isFunction(rt)) {
                                   throw jsi::JSError(rt, "setErrorCallback expects function");
                               }
                               return module->setErrorCallback(rt, args[0].asObject(rt).asFunction(rt));
                           }));
    object.setProperty(rt, "setStateChangeCallback",
                       jsi::Function::createFromHostFunction(
                           rt, jsi::PropNameID::forAscii(rt, "setStateChangeCallback"), 1,
                           [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t c) -> jsi::Value {
                               if (c < 1 || !args[0].isObject() || !args[0].asObject(rt).isFunction(rt)) {
                                   throw jsi::JSError(rt, "setStateChangeCallback expects function");
                               }
                               return module->setStateChangeCallback(rt, args[0].asObject(rt).asFunction(rt));
                           }));
    object.setProperty(rt, "setAnalysisCallback",
                       jsi::Function::createFromHostFunction(
                           rt, jsi::PropNameID::forAscii(rt, "setAnalysisCallback"), 2,
                           [module](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t c) -> jsi::Value {
                               if (c < 2 || !args[0].isObject() || !args[0].asObject(rt).isFunction(rt) || !args[1].isNumber()) {
                                   throw jsi::JSError(rt, "setAnalysisCallback expects (function, number)");
                               }
                               return module->setAnalysisCallback(rt, args[0].asObject(rt).asFunction(rt), args[1].asNumber());
                           }));

#undef REGISTER_METHOD_0
#undef REGISTER_METHOD_1_OBJ
#undef REGISTER_METHOD_1_STR
#undef REGISTER_METHOD_1_NUM

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

void NativeAudioCaptureModule::startAnalysisLoop() {
    stopAnalysisLoop();
    analysisRunning_.store(true);
    analysisThread_ = std::thread([this]() {
        while (analysisRunning_.load()) {
            int sleepMs = std::max(10, analysisIntervalMs_.load());
            std::this_thread::sleep_for(std::chrono::milliseconds(sleepMs));
            if (!analysisRunning_.load()) break;
            if (!runtimeValid_.load() || !callbackManager_ || !captureManager_) continue;

            // Collecte des métriques simples
            float current = static_cast<float>(captureManager_->getCurrentLevel());
            float peak = static_cast<float>(captureManager_->getPeakLevel());
            float avg = static_cast<float>(captureManager_->getRMS());
            auto stats = captureManager_->getStatistics();

            try {
                if (runtime_ && callbackManager_) {
                    auto analysisObj = JSIConverter::createAnalysisData(*runtime_, current, peak, avg, stats.framesProcessed);
                    callbackManager_->invokeAnalysisCallback(analysisObj);
                }
            } catch (...) {
                // Éviter de tuer le thread en cas d'exception
            }
        }
    });
}

void NativeAudioCaptureModule::stopAnalysisLoop() {
    analysisRunning_.store(false);
    if (analysisThread_.joinable()) {
        analysisThread_.join();
    }
}

// === Conversions entre AudioConfig et AudioCaptureConfig ===
Nyth::Audio::AudioCaptureConfig NativeAudioCaptureModule::toCaptureConfig(const Nyth::Audio::AudioConfig& c) const {
    Nyth::Audio::AudioCaptureConfig out;
    out.sampleRate = c.sampleRate;
    out.channelCount = c.channelCount;
    out.bitsPerSample = c.bitsPerSample;
    out.bufferSizeFrames = c.bufferSizeFrames;
    out.numBuffers = c.numBuffers;
    out.enableEchoCancellation = c.enableEchoCancellation;
    out.enableNoiseSuppression = c.enableNoiseSuppression;
    out.enableAutoGainControl = c.enableAutoGainControl;
    return out;
}

Nyth::Audio::AudioConfig NativeAudioCaptureModule::toAudioConfig(const Nyth::Audio::AudioCaptureConfig& c) const {
    Nyth::Audio::AudioConfig out;
    out.sampleRate = c.sampleRate;
    out.channelCount = c.channelCount;
    out.bitsPerSample = c.bitsPerSample;
    out.bufferSizeFrames = c.bufferSizeFrames;
    out.numBuffers = c.numBuffers;
    out.enableEchoCancellation = c.enableEchoCancellation;
    out.enableNoiseSuppression = c.enableNoiseSuppression;
    out.enableAutoGainControl = c.enableAutoGainControl;
    return out;
}

// === Provider function ===
std::shared_ptr<TurboModule> NativeAudioCaptureModuleProvider(std::shared_ptr<CallInvoker> jsInvoker) {
    return std::make_shared<NativeAudioCaptureModule>(jsInvoker);
}

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_CAPTURE_ENABLED
