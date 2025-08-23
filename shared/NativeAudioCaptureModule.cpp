#include "NativeAudioCaptureModule.h"

#if NYTH_AUDIO_CAPTURE_ENABLED

#include "Audio/capture/AudioCapture.hpp"
#include "Audio/capture/AudioCaptureUtils.hpp"
#include "Audio/capture/AudioFileWriter.hpp"
#include <chrono>
#include <sstream>

namespace {
class VectorBuffer : public facebook::jsi::MutableBuffer {
public:
    VectorBuffer(size_t size) : data_(size) {}
    uint8_t* data() override {
        return data_.data();
    }
    size_t size() const override {
        return data_.size();
    }

private:
    std::vector<uint8_t> data_;
};
} // namespace

// === Instance globale pour l'API C ===
static std::unique_ptr<Audio::capture::AudioCapture> g_captureInstance;
static std::unique_ptr<Nyth::Audio::AudioRecorder> g_recorderInstance;
static std::mutex g_globalMutex;

// === Implémentation de l'API C ===
extern "C" {

bool NythCapture_Initialize(const NythCaptureConfig* config) {
    if (!config)
        return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);

    Audio::capture::AudioCaptureConfig nativeConfig;
    nativeConfig.sampleRate = config->sampleRate;
    nativeConfig.channelCount = config->channelCount;
    nativeConfig.bitsPerSample = config->bitsPerSample;
    nativeConfig.bufferSizeFrames = config->bufferSizeFrames;
    nativeConfig.enableEchoCancellation = config->enableEchoCancellation;
    nativeConfig.enableNoiseSuppression = config->enableNoiseSuppression;
    nativeConfig.enableAutoGainControl = config->enableAutoGainControl;

    g_captureInstance = Audio::capture::AudioCapture::create(nativeConfig);
    return g_captureInstance != nullptr;
}

bool NythCapture_Start(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_captureInstance && g_captureInstance->start();
}

bool NythCapture_Stop(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_captureInstance && g_captureInstance->stop();
}

bool NythCapture_Pause(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_captureInstance && g_captureInstance->pause();
}

bool NythCapture_Resume(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_captureInstance && g_captureInstance->resume();
}

void NythCapture_Release(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (g_captureInstance) {
        g_captureInstance->release();
        g_captureInstance.reset();
    }
    g_recorderInstance.reset();
}

NythCaptureState NythCapture_GetState(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (!g_captureInstance)
        return CAPTURE_STATE_UNINITIALIZED;

    auto state = g_captureInstance->getState();
    return static_cast<NythCaptureState>(state);
}

bool NythCapture_IsCapturing(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_captureInstance && g_captureInstance->isCapturing();
}

void NythCapture_GetStatistics(NythCaptureStatistics* stats) {
    if (!stats)
        return;

    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (!g_captureInstance) {
        memset(stats, 0, sizeof(NythCaptureStatistics));
        return;
    }

    auto nativeStats = g_captureInstance->getStatistics();
    stats->framesProcessed = nativeStats.framesProcessed;
    stats->bytesProcessed = nativeStats.bytesProcessed;
    stats->averageLevel = nativeStats.averageLevel;
    stats->peakLevel = nativeStats.peakLevel;
    stats->overruns = nativeStats.overruns;
    stats->underruns = nativeStats.underruns;
    stats->durationMs = nativeStats.totalDuration.count();
}

void NythCapture_ResetStatistics(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (g_captureInstance) {
        g_captureInstance->resetStatistics();
    }
}

void NythCapture_GetConfig(NythCaptureConfig* config) {
    if (!config)
        return;

    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (!g_captureInstance) {
        memset(config, 0, sizeof(NythCaptureConfig));
        return;
    }

    auto nativeConfig = g_captureInstance->getConfig();
    config->sampleRate = nativeConfig.sampleRate;
    config->channelCount = nativeConfig.channelCount;
    config->bitsPerSample = nativeConfig.bitsPerSample;
    config->bufferSizeFrames = nativeConfig.bufferSizeFrames;
    config->enableEchoCancellation = nativeConfig.enableEchoCancellation;
    config->enableNoiseSuppression = nativeConfig.enableNoiseSuppression;
    config->enableAutoGainControl = nativeConfig.enableAutoGainControl;
}

bool NythCapture_UpdateConfig(const NythCaptureConfig* config) {
    if (!config)
        return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (!g_captureInstance)
        return false;

    Audio::capture::AudioCaptureConfig nativeConfig;
    nativeConfig.sampleRate = config->sampleRate;
    nativeConfig.channelCount = config->channelCount;
    nativeConfig.bitsPerSample = config->bitsPerSample;
    nativeConfig.bufferSizeFrames = config->bufferSizeFrames;
    nativeConfig.enableEchoCancellation = config->enableEchoCancellation;
    nativeConfig.enableNoiseSuppression = config->enableNoiseSuppression;
    nativeConfig.enableAutoGainControl = config->enableAutoGainControl;

    return g_captureInstance->updateConfig(nativeConfig);
}

float NythCapture_GetCurrentLevel(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_captureInstance ? g_captureInstance->getCurrentLevel() : 0.0f;
}

float NythCapture_GetPeakLevel(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_captureInstance ? g_captureInstance->getPeakLevel() : 0.0f;
}

void NythCapture_ResetPeakLevel(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (g_captureInstance) {
        g_captureInstance->resetPeakLevel();
    }
}

bool NythCapture_HasPermission(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_captureInstance && g_captureInstance->hasPermission();
}

void NythCapture_RequestPermission(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (g_captureInstance) {
        g_captureInstance->requestPermission([](bool granted) {
            // Callback vide pour l'API C
        });
    }
}

bool NythCapture_StartRecording(const char* filePath) {
    if (!filePath)
        return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (!g_captureInstance)
        return false;

    Nyth::Audio::AudioFileWriterConfig writerConfig;
    writerConfig.filePath = filePath;
    writerConfig.format = Nyth::Audio::AudioFileFormat::WAV;
    writerConfig.sampleRate = g_captureInstance->getConfig().sampleRate;
    writerConfig.channelCount = g_captureInstance->getConfig().channelCount;
    writerConfig.bitsPerSample = g_captureInstance->getConfig().bitsPerSample;

    g_recorderInstance = std::make_unique<Nyth::Audio::AudioRecorder>();
    if (g_recorderInstance->initialize(std::shared_ptr<Audio::capture::AudioCapture>(g_captureInstance.get()),
                                       writerConfig)) {
        return g_recorderInstance->startRecording();
    }

    return false;
}

bool NythCapture_StopRecording(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (g_recorderInstance) {
        g_recorderInstance->stopRecording();
        return true;
    }
    return false;
}

bool NythCapture_PauseRecording(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (g_recorderInstance) {
        g_recorderInstance->pauseRecording();
        return true;
    }
    return false;
}

bool NythCapture_ResumeRecording(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (g_recorderInstance) {
        g_recorderInstance->resumeRecording();
        return true;
    }
    return false;
}

bool NythCapture_IsRecording(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_recorderInstance && g_recorderInstance->isRecording();
}

float NythCapture_GetRecordingDuration(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_recorderInstance ? g_recorderInstance->getRecordingDuration() : 0.0f;
}

uint64_t NythCapture_GetRecordingSize(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_recorderInstance ? g_recorderInstance->getFramesRecorded() * 2 : 0; // Approximation
}

// === Callbacks C ===
static NythAudioDataCallback g_audioDataCallback = nullptr;
static NythErrorCallback g_errorCallback = nullptr;
static NythStateChangeCallback g_stateChangeCallback = nullptr;

void NythCapture_SetAudioDataCallback(NythAudioDataCallback callback) {
    g_audioDataCallback = callback;
}

void NythCapture_SetErrorCallback(NythErrorCallback callback) {
    g_errorCallback = callback;
}

void NythCapture_SetStateChangeCallback(NythStateChangeCallback callback) {
    g_stateChangeCallback = callback;
}

} // extern "C"

// === Implémentation du TurboModule ===

namespace facebook {
namespace react {

NativeAudioCaptureModule::~NativeAudioCaptureModule() {
    // Nettoyer toutes les ressources de manière sécurisée
    cleanup();
}

// Nouvelle méthode pour nettoyer les ressources
void NativeAudioCaptureModule::cleanup() {
    // Arrêter le thread d'analyse
    stopAnalysisThread();

    // Nettoyer les callbacks sous protection mutex
    {
        std::lock_guard<std::mutex> lock(callbackMutex_);
        jsCallbacks_.clear();
        runtime_ = nullptr;
        isRuntimeValid_ = false;
    }

    // Libérer la capture audio
    {
        std::lock_guard<std::mutex> lock(captureMutex_);
        if (capture_) {
            capture_->release();
            capture_.reset();
        }
        if (recorder_) {
            recorder_->stopRecording();
            recorder_.reset();
        }
    }
}

// === Méthodes publiques ===

// Gestion du cycle de vie
jsi::Value NativeAudioCaptureModule::initialize(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(captureMutex_);

    try {
        // Validation et parsing sécurisé de la configuration
        currentConfig_ = parseConfigSafe(rt, config);

        // Valider la configuration
        validateAudioConfig(currentConfig_);

        // Sauvegarder le runtime pour les callbacks
        runtime_ = &rt;
        isRuntimeValid_ = true;

        initializeCapture(currentConfig_);
        return jsi::Value(true);
    } catch (const jsi::JSError& e) {
        // Erreur JS déjà formatée, la propager
        throw;
    } catch (const std::exception& e) {
        // Convertir en erreur JS
        throw jsi::JSError(rt, std::string("Failed to initialize capture: ") + e.what());
    }
}

jsi::Value NativeAudioCaptureModule::start(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(captureMutex_);

    try {
        if (!capture_) {
            initializeCapture(currentConfig_);
        }

        bool success = capture_ && capture_->start();
        if (!success) {
            throw jsi::JSError(rt, "Failed to start audio capture");
        }
        return jsi::Value(true);
    } catch (const jsi::JSError& e) {
        throw;
    } catch (const std::exception& e) {
        throw jsi::JSError(rt, std::string("Start failed: ") + e.what());
    }
}

jsi::Value NativeAudioCaptureModule::stop(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(captureMutex_);

    bool success = capture_ && capture_->stop();
    return jsi::Value(success);
}

jsi::Value NativeAudioCaptureModule::pause(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(captureMutex_);

    bool success = capture_ && capture_->pause();
    return jsi::Value(success);
}

jsi::Value NativeAudioCaptureModule::resume(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(captureMutex_);

    bool success = capture_ && capture_->resume();
    return jsi::Value(success);
}

jsi::Value NativeAudioCaptureModule::dispose(jsi::Runtime& rt) {
    cleanup();
    return jsi::Value::undefined();
}

// === État et informations ===

jsi::Value NativeAudioCaptureModule::getState(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (!capture_) {
        return jsi::String::createFromUtf8(rt, "uninitialized");
    }

    auto state = capture_->getState();
    std::string stateStr;

    switch (state) {
        case Audio::capture::CaptureState::Uninitialized:
            stateStr = "uninitialized";
            break;
        case Audio::capture::CaptureState::Initialized:
            stateStr = "initialized";
            break;
        case Audio::capture::CaptureState::Starting:
            stateStr = "starting";
            break;
        case Audio::capture::CaptureState::Running:
            stateStr = "running";
            break;
        case Audio::capture::CaptureState::Pausing:
            stateStr = "pausing";
            break;
        case Audio::capture::CaptureState::Paused:
            stateStr = "paused";
            break;
        case Audio::capture::CaptureState::Stopping:
            stateStr = "stopping";
            break;
        case Audio::capture::CaptureState::Stopped:
            stateStr = "stopped";
            break;
        case Audio::capture::CaptureState::Error:
            stateStr = "error";
            break;
    }

    return jsi::String::createFromUtf8(rt, stateStr);
}

jsi::Value NativeAudioCaptureModule::isCapturing(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(captureMutex_);

    bool capturing = capture_ && capture_->isCapturing();
    return jsi::Value(capturing);
}

jsi::Value NativeAudioCaptureModule::getStatistics(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (!capture_) {
        return jsi::Value::null();
    }

    auto stats = capture_->getStatistics();
    return statisticsToJS(rt, stats);
}

jsi::Value NativeAudioCaptureModule::resetStatistics(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (capture_) {
        capture_->resetStatistics();
    }

    return jsi::Value::undefined();
}

// === Configuration ===

jsi::Value NativeAudioCaptureModule::getConfig(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(captureMutex_);

    return configToJS(rt, currentConfig_);
}

jsi::Value NativeAudioCaptureModule::updateConfig(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(captureMutex_);

    try {
        currentConfig_ = parseConfig(rt, config);

        if (capture_) {
            bool success = capture_->updateConfig(currentConfig_);
            return jsi::Value(success);
        }

        return jsi::Value(true);
    } catch (const std::exception& e) {
        return jsi::Value(false);
    }
}

// === Niveaux audio ===

jsi::Value NativeAudioCaptureModule::getCurrentLevel(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(captureMutex_);

    float level = capture_ ? capture_->getCurrentLevel() : 0.0f;
    return jsi::Value(static_cast<double>(level));
}

jsi::Value NativeAudioCaptureModule::getPeakLevel(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(captureMutex_);

    float level = capture_ ? capture_->getPeakLevel() : 0.0f;
    return jsi::Value(static_cast<double>(level));
}

jsi::Value NativeAudioCaptureModule::resetPeakLevel(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (capture_) {
        capture_->resetPeakLevel();
    }

    return jsi::Value::undefined();
}

// === Analyse audio ===

jsi::Value NativeAudioCaptureModule::getRMS(jsi::Runtime& rt) {
    // Nécessite l'accès aux dernières données audio
    // Pour l'instant, retourne le niveau actuel comme approximation
    return getCurrentLevel(rt);
}

jsi::Value NativeAudioCaptureModule::getRMSdB(jsi::Runtime& rt) {
    double rms = getRMS(rt).asNumber();
    double db = rms > 0 ? 20.0 * std::log10(rms) : -100.0;
    return jsi::Value(db);
}

jsi::Value NativeAudioCaptureModule::isSilent(jsi::Runtime& rt, double threshold) {
    // Valider le threshold
    if (threshold < AudioLimits::MIN_THRESHOLD || threshold > AudioLimits::MAX_THRESHOLD) {
        throw jsi::JSError(rt, "Threshold must be between " + std::to_string(AudioLimits::MIN_THRESHOLD) + " and " +
                                   std::to_string(AudioLimits::MAX_THRESHOLD));
    }

    double level = getCurrentLevel(rt).asNumber();
    return jsi::Value(level < threshold);
}

jsi::Value NativeAudioCaptureModule::hasClipping(jsi::Runtime& rt) {
    double peak = getPeakLevel(rt).asNumber();
    return jsi::Value(peak >= 0.99);
}

// === Périphériques ===

jsi::Value NativeAudioCaptureModule::getAvailableDevices(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (!capture_) {
        return jsi::Array(rt, 0);
    }

    auto devices = capture_->getAvailableDevices();
    return devicesToJS(rt, devices);
}

jsi::Value NativeAudioCaptureModule::selectDevice(jsi::Runtime& rt, const jsi::String& deviceId) {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (!capture_) {
        return jsi::Value(false);
    }

    std::string id = deviceId.utf8(rt);
    bool success = capture_->selectDevice(id);
    return jsi::Value(success);
}

jsi::Value NativeAudioCaptureModule::getCurrentDevice(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (!capture_) {
        return jsi::Value::null();
    }

    auto device = capture_->getCurrentDevice();
    return deviceToJS(rt, device);
}

// === Permissions ===

jsi::Value NativeAudioCaptureModule::hasPermission(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (!capture_) {
        initializeCapture(currentConfig_);
    }

    bool hasPermission = capture_ && capture_->hasPermission();
    return jsi::Value(hasPermission);
}

jsi::Value NativeAudioCaptureModule::requestPermission(jsi::Runtime& rt) {
    auto promise =
        rt.global()
            .getPropertyAsFunction(rt, "Promise")
            .callAsConstructor(
                rt,
                jsi::Function::createFromHostFunction(
                    rt, jsi::PropNameID::forAscii(rt, "executor"), 2,
                    [this](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t) -> jsi::Value {
                        auto resolve = std::make_shared<jsi::Function>(std::move(args[0].asObject(rt).asFunction(rt)));
                        auto reject = std::make_shared<jsi::Function>(std::move(args[1].asObject(rt).asFunction(rt)));

                        if (!capture_) {
                            initializeCapture(currentConfig_);
                        }

                        if (capture_) {
                            capture_->requestPermission([this, resolve](bool granted) {
                                invokeJSCallback("permission_callback", [resolve, granted](jsi::Runtime& rt) {
                                    resolve->call(rt, jsi::Value(granted));
                                });
                            });
                        } else {
                            invokeJSCallback("permission_callback", [reject](jsi::Runtime& rt) {
                                reject->call(rt, jsi::String::createFromUtf8(rt, "Failed to initialize capture"));
                            });
                        }

                        return jsi::Value::undefined();
                    }));

    return promise;
}

// === Enregistrement ===

jsi::Value NativeAudioCaptureModule::startRecording(jsi::Runtime& rt, const jsi::String& filePath,
                                                    const jsi::Object& options) {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (!capture_) {
        return jsi::Value(false);
    }

    std::string path = filePath.utf8(rt);

    Nyth::Audio::AudioFileWriterConfig writerConfig;
    writerConfig.filePath = path;
    writerConfig.format = Nyth::Audio::AudioFileFormat::WAV;
    writerConfig.sampleRate = currentConfig_.sampleRate;
    writerConfig.channelCount = currentConfig_.channelCount;
    writerConfig.bitsPerSample = currentConfig_.bitsPerSample;

    // Parse options if provided
    if (options.hasProperty(rt, "format")) {
        std::string format = options.getProperty(rt, "format").asString(rt).utf8(rt);
        if (format == "raw") {
            writerConfig.format = Nyth::Audio::AudioFileFormat::RAW_PCM;
        }
    }

    recorder_ = std::make_unique<Nyth::Audio::AudioRecorder>();
    if (recorder_->initialize(capture_, writerConfig)) {
        bool success = recorder_->startRecording();
        if (success) {
            isRecordingActive_ = true;
            currentRecordingPath_ = path;
        }
        return jsi::Value(success);
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioCaptureModule::stopRecording(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (recorder_) {
        recorder_->stopRecording();
        isRecordingActive_ = false;
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioCaptureModule::pauseRecording(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (recorder_) {
        recorder_->pauseRecording();
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioCaptureModule::resumeRecording(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (recorder_) {
        recorder_->resumeRecording();
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioCaptureModule::isRecording(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(captureMutex_);

    bool recording = recorder_ && recorder_->isRecording();
    return jsi::Value(recording);
}

jsi::Value NativeAudioCaptureModule::getRecordingInfo(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(captureMutex_);

    if (!recorder_) {
        return jsi::Value::null();
    }

    auto info = jsi::Object(rt);
    info.setProperty(rt, "duration", jsi::Value(static_cast<double>(recorder_->getRecordingDuration())));
    info.setProperty(rt, "frames", jsi::Value(static_cast<double>(recorder_->getFramesRecorded())));
    info.setProperty(rt, "path", jsi::String::createFromUtf8(rt, currentRecordingPath_));
    info.setProperty(rt, "isRecording", jsi::Value(recorder_->isRecording()));
    info.setProperty(rt, "isPaused", jsi::Value(recorder_->isPaused()));

    return info;
}

// === Callbacks JavaScript ===

jsi::Value NativeAudioCaptureModule::setAudioDataCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);

    try {
        // Valider que c'est bien une fonction
        JSIValidator::validateFunction(rt, callback, "audioDataCallback");

        // Sauvegarder le callback et le runtime
        jsCallbacks_.audioDataCallback =
            std::make_shared<jsi::Function>(std::move(const_cast<jsi::Function&>(callback)));
        runtime_ = &rt;
        isRuntimeValid_ = true;

        if (capture_) {
            capture_->setAudioDataCallback([this](const float* data, size_t frameCount, int channels) {
                // Vérifier que le runtime est toujours valide avant d'appeler
                if (isRuntimeValid_.load()) {
                    handleAudioData(data, frameCount, channels);
                }
            });
        }

        return jsi::Value::undefined();
    } catch (const jsi::JSError& e) {
        throw;
    } catch (const std::exception& e) {
        throw jsi::JSError(rt, std::string("Failed to set audio callback: ") + e.what());
    }
}

jsi::Value NativeAudioCaptureModule::setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);

    try {
        JSIValidator::validateFunction(rt, callback, "errorCallback");

        jsCallbacks_.errorCallback = std::make_shared<jsi::Function>(std::move(const_cast<jsi::Function&>(callback)));
        runtime_ = &rt;
        isRuntimeValid_ = true;

        if (capture_) {
            capture_->setErrorCallback([this](const std::string& error) {
                if (isRuntimeValid_.load()) {
                    handleError(error);
                }
            });
        }

        return jsi::Value::undefined();
    } catch (const jsi::JSError& e) {
        throw;
    } catch (const std::exception& e) {
        throw jsi::JSError(rt, std::string("Failed to set error callback: ") + e.what());
    }
}

jsi::Value NativeAudioCaptureModule::setStateChangeCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);

    try {
        JSIValidator::validateFunction(rt, callback, "stateChangeCallback");

        jsCallbacks_.stateChangeCallback =
            std::make_shared<jsi::Function>(std::move(const_cast<jsi::Function&>(callback)));
        runtime_ = &rt;
        isRuntimeValid_ = true;

        if (capture_) {
            capture_->setStateChangeCallback(
                [this](Audio::capture::CaptureState oldState, Audio::capture::CaptureState newState) {
                    if (isRuntimeValid_.load()) {
                        handleStateChange(oldState, newState);
                    }
                });
        }

        return jsi::Value::undefined();
    } catch (const jsi::JSError& e) {
        throw;
    } catch (const std::exception& e) {
        throw jsi::JSError(rt, std::string("Failed to set state change callback: ") + e.what());
    }
}

jsi::Value NativeAudioCaptureModule::setAnalysisCallback(jsi::Runtime& rt, const jsi::Function& callback,
                                                         double intervalMs) {
    std::lock_guard<std::mutex> lock(callbackMutex_);

    try {
        JSIValidator::validateFunction(rt, callback, "analysisCallback");

        // Valider l'intervalle
        if (intervalMs < AudioLimits::MIN_ANALYSIS_INTERVAL_MS || intervalMs > AudioLimits::MAX_ANALYSIS_INTERVAL_MS) {
            throw jsi::JSError(rt, "Analysis interval must be between " +
                                       std::to_string(AudioLimits::MIN_ANALYSIS_INTERVAL_MS) + " and " +
                                       std::to_string(AudioLimits::MAX_ANALYSIS_INTERVAL_MS) + " ms");
        }

        jsCallbacks_.analysisCallback =
            std::make_shared<jsi::Function>(std::move(const_cast<jsi::Function&>(callback)));
        analysisIntervalMs_ = intervalMs;
        runtime_ = &rt;
        isRuntimeValid_ = true;

        // Démarrer le thread d'analyse si nécessaire
        stopAnalysisThread();
        analysisRunning_ = true;
        analysisThread_ = std::thread(&NativeAudioCaptureModule::runAnalysisThread, this);

        return jsi::Value::undefined();
    } catch (const jsi::JSError& e) {
        throw;
    } catch (const std::exception& e) {
        throw jsi::JSError(rt, std::string("Failed to set analysis callback: ") + e.what());
    }
}

// === Méthodes privées ===

void NativeAudioCaptureModule::initializeCapture(const Audio::capture::AudioCaptureConfig& config) {
    capture_ = std::shared_ptr<Audio::capture::AudioCapture>(Audio::capture::AudioCapture::create(config).release());

    if (capture_) {
        // Configurer les callbacks si déjà définis
        if (jsCallbacks_.audioDataCallback) {
            capture_->setAudioDataCallback([this](const float* data, size_t frameCount, int channels) {
                handleAudioData(data, frameCount, channels);
            });
        }

        if (jsCallbacks_.errorCallback) {
            capture_->setErrorCallback([this](const std::string& error) { handleError(error); });
        }

        if (jsCallbacks_.stateChangeCallback) {
            capture_->setStateChangeCallback(
                [this](Audio::capture::CaptureState oldState, Audio::capture::CaptureState newState) {
                    handleStateChange(oldState, newState);
                });
        }
    }
}

void NativeAudioCaptureModule::handleAudioData(const float* data, size_t frameCount, int channels) {
    if (!jsCallbacks_.audioDataCallback || !isRuntimeValid_.load())
        return;

    // Vérifier la taille du buffer pour éviter les allocations excessives
    size_t totalSamples = frameCount * channels;
    if (totalSamples > AudioLimits::MAX_BUFFER_SIZE) {
        handleError("Audio buffer too large: " + std::to_string(totalSamples) + " samples");
        return;
    }

    // Limiter la taille des données dans la queue pour éviter l'accumulation
    {
        std::lock_guard<std::mutex> lock(queueMutex_);
        if (audioDataQueue_.size() > 10) { // Limiter à 10 buffers en attente
            // Supprimer les anciens buffers si la queue est trop grande
            while (audioDataQueue_.size() > 5) {
                audioDataQueue_.pop();
            }
        }

        // Ajouter les nouvelles données
        std::vector<float> buffer(data, data + totalSamples);
        audioDataQueue_.push(std::move(buffer));
    }

    queueCV_.notify_one();

    // Invoquer le callback sur le thread JS de manière sécurisée
    invokeJSCallback("audioData", [this, frameCount, channels](jsi::Runtime& rt) {
        std::vector<float> buffer;
        {
            std::lock_guard<std::mutex> lock(queueMutex_);
            if (!audioDataQueue_.empty()) {
                buffer = std::move(audioDataQueue_.front());
                audioDataQueue_.pop();
            }
        }

        if (!buffer.empty() && jsCallbacks_.audioDataCallback && isRuntimeValid_.load()) {
            try {
                // Vérifier que Float32Array existe
                if (!rt.global().hasProperty(rt, "Float32Array")) {
                    throw jsi::JSError(rt, "Float32Array not available in this environment");
                }

                // Créer un Float32Array de manière sécurisée
                size_t totalBytes = buffer.size() * sizeof(float);

                // Limiter la taille pour la sécurité
                if (totalBytes > AudioLimits::MAX_BUFFER_SIZE * sizeof(float)) {
                    throw jsi::JSError(rt, "Buffer size exceeds maximum allowed");
                }

                auto arrayBuffer = jsi::ArrayBuffer(rt, std::make_shared<VectorBuffer>(totalBytes));

                // Copier les données de manière sécurisée
                float* bufferData = reinterpret_cast<float*>(arrayBuffer.data(rt));
                std::memcpy(bufferData, buffer.data(), totalBytes);

                auto float32ArrayCtor = rt.global().getPropertyAsFunction(rt, "Float32Array");
                auto float32Array = float32ArrayCtor.callAsConstructor(rt, arrayBuffer).asObject(rt);

                // Appeler le callback avec protection contre les exceptions
                jsCallbacks_.audioDataCallback->call(rt, float32Array, jsi::Value(static_cast<int>(frameCount)),
                                                     jsi::Value(channels));
            } catch (const jsi::JSError& e) {
                // L'erreur JS est déjà formatée, on peut la logger ou la traiter
                handleError(std::string("JS callback error: ") + e.getMessage());
            } catch (const std::exception& e) {
                handleError(std::string("Native callback error: ") + e.what());
            }
        }
    });
}

void NativeAudioCaptureModule::handleError(const std::string& error) {
    if (!jsCallbacks_.errorCallback)
        return;

    invokeJSCallback("error", [this, error](jsi::Runtime& rt) {
        jsCallbacks_.errorCallback->call(rt, jsi::String::createFromUtf8(rt, error));
    });
}

void NativeAudioCaptureModule::handleStateChange(Audio::capture::CaptureState oldState,
                                                 Audio::capture::CaptureState newState) {
    if (!jsCallbacks_.stateChangeCallback)
        return;

    invokeJSCallback("stateChange", [this, oldState, newState](jsi::Runtime& rt) {
        std::string oldStateStr, newStateStr;

        // Convertir les états en strings
        auto stateToString = [](Audio::capture::CaptureState state) -> std::string {
            switch (state) {
                case Audio::capture::CaptureState::Uninitialized:
                    return "uninitialized";
                case Audio::capture::CaptureState::Initialized:
                    return "initialized";
                case Audio::capture::CaptureState::Starting:
                    return "starting";
                case Audio::capture::CaptureState::Running:
                    return "running";
                case Audio::capture::CaptureState::Pausing:
                    return "pausing";
                case Audio::capture::CaptureState::Paused:
                    return "paused";
                case Audio::capture::CaptureState::Stopping:
                    return "stopping";
                case Audio::capture::CaptureState::Stopped:
                    return "stopped";
                case Audio::capture::CaptureState::Error:
                    return "error";
                default:
                    return "unknown";
            }
        };

        oldStateStr = stateToString(oldState);
        newStateStr = stateToString(newState);

        jsCallbacks_.stateChangeCallback->call(rt, jsi::String::createFromUtf8(rt, oldStateStr),
                                               jsi::String::createFromUtf8(rt, newStateStr));
    });
}

void NativeAudioCaptureModule::runAnalysisThread() {
    while (analysisRunning_) {
        auto startTime = std::chrono::steady_clock::now();

        if (capture_ && capture_->isCapturing() && jsCallbacks_.analysisCallback) {
            invokeJSCallback("analysis", [this](jsi::Runtime& rt) {
                auto analysis = jsi::Object(rt);

                analysis.setProperty(rt, "currentLevel", jsi::Value(static_cast<double>(capture_->getCurrentLevel())));
                analysis.setProperty(rt, "peakLevel", jsi::Value(static_cast<double>(capture_->getPeakLevel())));

                auto stats = capture_->getStatistics();
                analysis.setProperty(rt, "averageLevel", jsi::Value(static_cast<double>(stats.averageLevel)));
                analysis.setProperty(rt, "framesProcessed", jsi::Value(static_cast<double>(stats.framesProcessed)));

                jsCallbacks_.analysisCallback->call(rt, analysis);
            });
        }

        auto elapsed = std::chrono::steady_clock::now() - startTime;
        auto sleepTime = std::chrono::milliseconds(static_cast<int>(analysisIntervalMs_)) - elapsed;

        if (sleepTime.count() > 0) {
            std::this_thread::sleep_for(sleepTime);
        }
    }
}

void NativeAudioCaptureModule::stopAnalysisThread() {
    if (analysisRunning_) {
        analysisRunning_ = false;
        if (analysisThread_.joinable()) {
            analysisThread_.join();
        }
    }
}

// === Conversion helpers ===

// Nouvelle méthode de parsing sécurisée avec validation
Audio::capture::AudioCaptureConfig NativeAudioCaptureModule::parseConfigSafe(jsi::Runtime& rt,
                                                                             const jsi::Object& jsConfig) {
    Audio::capture::AudioCaptureConfig config;

    try {
        // Sample Rate - avec validation de plage
        if (jsConfig.hasProperty(rt, "sampleRate")) {
            auto prop = jsConfig.getProperty(rt, "sampleRate");
            config.sampleRate = static_cast<int>(JSIValidator::validateNumberInRange(
                rt, prop, "sampleRate", AudioLimits::MIN_SAMPLE_RATE, AudioLimits::MAX_SAMPLE_RATE));
        }

        // Channel Count - avec validation
        if (jsConfig.hasProperty(rt, "channelCount")) {
            auto prop = jsConfig.getProperty(rt, "channelCount");
            config.channelCount = static_cast<int>(JSIValidator::validateNumberInRange(
                rt, prop, "channelCount", AudioLimits::MIN_CHANNELS, AudioLimits::MAX_CHANNELS));
        }

        // Bits per sample - avec validation
        if (jsConfig.hasProperty(rt, "bitsPerSample")) {
            auto prop = jsConfig.getProperty(rt, "bitsPerSample");
            int bits = static_cast<int>(JSIValidator::validateNumberInRange(
                rt, prop, "bitsPerSample", AudioLimits::MIN_BITS_PER_SAMPLE, AudioLimits::MAX_BITS_PER_SAMPLE));
            // Vérifier que c'est une valeur valide (8, 16, 24, ou 32)
            if (bits != 8 && bits != 16 && bits != 24 && bits != 32) {
                throw jsi::JSError(rt, "bitsPerSample must be 8, 16, 24, or 32");
            }
            config.bitsPerSample = bits;
        }

        // Buffer size - avec validation
        if (jsConfig.hasProperty(rt, "bufferSizeFrames")) {
            auto prop = jsConfig.getProperty(rt, "bufferSizeFrames");
            config.bufferSizeFrames = static_cast<int>(
                JSIValidator::validateNumberInRange(rt, prop, "bufferSizeFrames", AudioLimits::MIN_BUFFER_SIZE_FRAMES,
                                                    AudioLimits::MAX_BUFFER_SIZE_FRAMES));
        }

        // Options booléennes avec validation de type
        if (jsConfig.hasProperty(rt, "enableEchoCancellation")) {
            auto prop = jsConfig.getProperty(rt, "enableEchoCancellation");
            JSIValidator::validateBool(rt, prop, "enableEchoCancellation");
            config.enableEchoCancellation = prop.asBool();
        }

        if (jsConfig.hasProperty(rt, "enableNoiseSuppression")) {
            auto prop = jsConfig.getProperty(rt, "enableNoiseSuppression");
            JSIValidator::validateBool(rt, prop, "enableNoiseSuppression");
            config.enableNoiseSuppression = prop.asBool();
        }

        if (jsConfig.hasProperty(rt, "enableAutoGainControl")) {
            auto prop = jsConfig.getProperty(rt, "enableAutoGainControl");
            JSIValidator::validateBool(rt, prop, "enableAutoGainControl");
            config.enableAutoGainControl = prop.asBool();
        }

    } catch (const jsi::JSError& e) {
        // Propager les erreurs JS
        throw;
    } catch (const std::exception& e) {
        // Convertir les autres erreurs en erreurs JS
        throw jsi::JSError(rt, std::string("Invalid configuration: ") + e.what());
    }

    return config;
}

// Validation de la configuration audio
void NativeAudioCaptureModule::validateAudioConfig(const Audio::capture::AudioCaptureConfig& config) {
    // Vérifications supplémentaires de cohérence

    // Vérifier que la taille du buffer est appropriée pour le sample rate
    double bufferDurationMs = (config.bufferSizeFrames * 1000.0) / config.sampleRate;
    if (bufferDurationMs < 1.0) {
        throw std::runtime_error("Buffer duration too short (< 1ms)");
    }
    if (bufferDurationMs > 1000.0) {
        throw std::runtime_error("Buffer duration too long (> 1s)");
    }

    // Vérifier la cohérence des options de traitement
    if (config.enableEchoCancellation && config.sampleRate < 16000) {
        throw std::runtime_error("Echo cancellation requires sample rate >= 16kHz");
    }
}

// Méthode originale améliorée avec validation basique
Audio::capture::AudioCaptureConfig NativeAudioCaptureModule::parseConfig(jsi::Runtime& rt,
                                                                         const jsi::Object& jsConfig) {
    // Utiliser la version sécurisée
    return parseConfigSafe(rt, jsConfig);
}

jsi::Object NativeAudioCaptureModule::configToJS(jsi::Runtime& rt, const Audio::capture::AudioCaptureConfig& config) {
    auto jsConfig = jsi::Object(rt);

    jsConfig.setProperty(rt, "sampleRate", jsi::Value(config.sampleRate));
    jsConfig.setProperty(rt, "channelCount", jsi::Value(config.channelCount));
    jsConfig.setProperty(rt, "bitsPerSample", jsi::Value(config.bitsPerSample));
    jsConfig.setProperty(rt, "bufferSizeFrames", jsi::Value(config.bufferSizeFrames));
    jsConfig.setProperty(rt, "enableEchoCancellation", jsi::Value(config.enableEchoCancellation));
    jsConfig.setProperty(rt, "enableNoiseSuppression", jsi::Value(config.enableNoiseSuppression));
    jsConfig.setProperty(rt, "enableAutoGainControl", jsi::Value(config.enableAutoGainControl));

    return jsConfig;
}

jsi::Object NativeAudioCaptureModule::statisticsToJS(jsi::Runtime& rt, const Audio::capture::CaptureStatistics& stats) {
    auto jsStats = jsi::Object(rt);

    jsStats.setProperty(rt, "framesProcessed", jsi::Value(static_cast<double>(stats.framesProcessed)));
    jsStats.setProperty(rt, "bytesProcessed", jsi::Value(static_cast<double>(stats.bytesProcessed)));
    jsStats.setProperty(rt, "averageLevel", jsi::Value(static_cast<double>(stats.averageLevel)));
    jsStats.setProperty(rt, "peakLevel", jsi::Value(static_cast<double>(stats.peakLevel)));
    jsStats.setProperty(rt, "overruns", jsi::Value(static_cast<double>(stats.overruns)));
    jsStats.setProperty(rt, "underruns", jsi::Value(static_cast<double>(stats.underruns)));
    jsStats.setProperty(rt, "durationMs", jsi::Value(static_cast<double>(stats.totalDuration.count())));

    return jsStats;
}

jsi::Object NativeAudioCaptureModule::deviceToJS(jsi::Runtime& rt, const Audio::capture::AudioDeviceInfo& device) {
    auto jsDevice = jsi::Object(rt);

    jsDevice.setProperty(rt, "id", jsi::String::createFromUtf8(rt, device.id));
    jsDevice.setProperty(rt, "name", jsi::String::createFromUtf8(rt, device.name));
    jsDevice.setProperty(rt, "isDefault", jsi::Value(device.isDefault));
    jsDevice.setProperty(rt, "maxChannels", jsi::Value(device.maxChannels));

    auto jsSampleRates = jsi::Array(rt, device.supportedSampleRates.size());
    for (size_t i = 0; i < device.supportedSampleRates.size(); ++i) {
        jsSampleRates.setValueAtIndex(rt, i, jsi::Value(device.supportedSampleRates[i]));
    }
    jsDevice.setProperty(rt, "supportedSampleRates", jsSampleRates);

    return jsDevice;
}

jsi::Array NativeAudioCaptureModule::devicesToJS(jsi::Runtime& rt,
                                                 const std::vector<Audio::capture::AudioDeviceInfo>& devices) {
    auto jsDevices = jsi::Array(rt, devices.size());

    for (size_t i = 0; i < devices.size(); ++i) {
        jsDevices.setValueAtIndex(rt, i, deviceToJS(rt, devices[i]));
    }

    return jsDevices;
}

void NativeAudioCaptureModule::invokeJSCallback(const std::string& callbackName,
                                                std::function<void(jsi::Runtime&)> invocation) {
    if (jsInvoker_) {
        jsInvoker_->invokeAsync(std::move(invocation));
    }
}

// === Méthodes utilitaires ===

jsi::Value NativeAudioCaptureModule::convertAudioFormat(jsi::Runtime& rt, const jsi::Object& params) {
    // TODO: Implémenter la conversion de format audio
    // Pour l'instant, retourne un objet vide
    auto result = jsi::Object(rt);
    result.setProperty(rt, "success", jsi::Value(false));
    result.setProperty(rt, "error", jsi::String::createFromUtf8(rt, "Not implemented yet"));
    return result;
}

jsi::Value NativeAudioCaptureModule::analyzeAudioFile(jsi::Runtime& rt, const jsi::String& filePath) {
    // TODO: Implémenter l'analyse de fichier audio
    // Pour l'instant, retourne un objet vide
    auto result = jsi::Object(rt);
    result.setProperty(rt, "success", jsi::Value(false));
    result.setProperty(rt, "error", jsi::String::createFromUtf8(rt, "Not implemented yet"));
    return result;
}

// === Installation du module ===

jsi::Value NativeAudioCaptureModule::install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker) {
    auto module = std::make_shared<NativeAudioCaptureModule>(jsInvoker);

    auto object = jsi::Object(rt);

    // Enregistrer toutes les méthodes
    auto registerMethod =
        [&](const char* name, size_t paramCount,
            std::function<jsi::Value(NativeAudioCaptureModule*, jsi::Runtime&, const jsi::Value*, size_t)> method) {
            object.setProperty(
                rt, name,
                jsi::Function::createFromHostFunction(
                    rt, jsi::PropNameID::forAscii(rt, name), static_cast<unsigned int>(paramCount),
                    [module, method](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args,
                                     size_t count) -> jsi::Value { return method(module.get(), rt, args, count); }));
        };

    // Enregistrer les méthodes du module
    registerMethod("initialize", 1,
                   [](auto* m, auto& rt, auto* args, auto) { return m->initialize(rt, args[0].asObject(rt)); });

    registerMethod("start", 0, [](auto* m, auto& rt, auto*, auto) { return m->start(rt); });

    registerMethod("stop", 0, [](auto* m, auto& rt, auto*, auto) { return m->stop(rt); });

    registerMethod("pause", 0, [](auto* m, auto& rt, auto*, auto) { return m->pause(rt); });

    registerMethod("resume", 0, [](auto* m, auto& rt, auto*, auto) { return m->resume(rt); });

    registerMethod("dispose", 0, [](auto* m, auto& rt, auto*, auto) { return m->dispose(rt); });

    // === État et informations ===
    registerMethod("getState", 0, [](auto* m, auto& rt, auto*, auto) { return m->getState(rt); });

    registerMethod("isCapturing", 0, [](auto* m, auto& rt, auto*, auto) { return m->isCapturing(rt); });

    registerMethod("getStatistics", 0, [](auto* m, auto& rt, auto*, auto) { return m->getStatistics(rt); });

    registerMethod("resetStatistics", 0, [](auto* m, auto& rt, auto*, auto) { return m->resetStatistics(rt); });

    // === Configuration ===
    registerMethod("getConfig", 0, [](auto* m, auto& rt, auto*, auto) { return m->getConfig(rt); });

    registerMethod("updateConfig", 1,
                   [](auto* m, auto& rt, auto* args, auto) { return m->updateConfig(rt, args[0].asObject(rt)); });

    // === Niveaux audio ===
    registerMethod("getCurrentLevel", 0, [](auto* m, auto& rt, auto*, auto) { return m->getCurrentLevel(rt); });

    registerMethod("getPeakLevel", 0, [](auto* m, auto& rt, auto*, auto) { return m->getPeakLevel(rt); });

    registerMethod("resetPeakLevel", 0, [](auto* m, auto& rt, auto*, auto) { return m->resetPeakLevel(rt); });

    // === Analyse audio ===
    registerMethod("getRMS", 0, [](auto* m, auto& rt, auto*, auto) { return m->getRMS(rt); });

    registerMethod("getRMSdB", 0, [](auto* m, auto& rt, auto*, auto) { return m->getRMSdB(rt); });

    registerMethod("isSilent", 1,
                   [](auto* m, auto& rt, auto* args, auto) { return m->isSilent(rt, args[0].asNumber()); });

    registerMethod("hasClipping", 0, [](auto* m, auto& rt, auto*, auto) { return m->hasClipping(rt); });

    // === Périphériques ===
    registerMethod("getAvailableDevices", 0, [](auto* m, auto& rt, auto*, auto) { return m->getAvailableDevices(rt); });

    registerMethod("selectDevice", 1,
                   [](auto* m, auto& rt, auto* args, auto) { return m->selectDevice(rt, args[0].asString(rt)); });

    registerMethod("getCurrentDevice", 0, [](auto* m, auto& rt, auto*, auto) { return m->getCurrentDevice(rt); });

    // === Permissions ===
    registerMethod("hasPermission", 0, [](auto* m, auto& rt, auto*, auto) { return m->hasPermission(rt); });

    registerMethod("requestPermission", 0, [](auto* m, auto& rt, auto*, auto) { return m->requestPermission(rt); });

    // === Enregistrement ===
    registerMethod("startRecording", 2, [](auto* m, auto& rt, auto* args, auto) {
        return m->startRecording(rt, args[0].asString(rt), args[1].asObject(rt));
    });

    registerMethod("stopRecording", 0, [](auto* m, auto& rt, auto*, auto) { return m->stopRecording(rt); });

    registerMethod("pauseRecording", 0, [](auto* m, auto& rt, auto*, auto) { return m->pauseRecording(rt); });

    registerMethod("resumeRecording", 0, [](auto* m, auto& rt, auto*, auto) { return m->resumeRecording(rt); });

    registerMethod("isRecording", 0, [](auto* m, auto& rt, auto*, auto) { return m->isRecording(rt); });

    registerMethod("getRecordingInfo", 0, [](auto* m, auto& rt, auto*, auto) { return m->getRecordingInfo(rt); });

    // === Callbacks ===
    registerMethod("setAudioDataCallback", 1, [](auto* m, auto& rt, auto* args, auto) {
        return m->setAudioDataCallback(rt, args[0].asObject(rt).asFunction(rt));
    });

    registerMethod("setErrorCallback", 1, [](auto* m, auto& rt, auto* args, auto) {
        return m->setErrorCallback(rt, args[0].asObject(rt).asFunction(rt));
    });

    registerMethod("setStateChangeCallback", 1, [](auto* m, auto& rt, auto* args, auto) {
        return m->setStateChangeCallback(rt, args[0].asObject(rt).asFunction(rt));
    });

    registerMethod("setAnalysisCallback", 2, [](auto* m, auto& rt, auto* args, auto) {
        return m->setAnalysisCallback(rt, args[0].asObject(rt).asFunction(rt), args[1].asNumber());
    });

    // === Méthodes utilitaires ===
    registerMethod("convertAudioFormat", 1,
                   [](auto* m, auto& rt, auto* args, auto) { return m->convertAudioFormat(rt, args[0].asObject(rt)); });

    registerMethod("analyzeAudioFile", 1,
                   [](auto* m, auto& rt, auto* args, auto) { return m->analyzeAudioFile(rt, args[0].asString(rt)); });

    // ... Ajouter toutes les autres méthodes ...

    rt.global().setProperty(rt, "NativeAudioCaptureModule", object);

    return object;
}

// === Provider function ===

std::shared_ptr<TurboModule> NativeAudioCaptureModuleProvider(std::shared_ptr<CallInvoker> jsInvoker) {
    return std::make_shared<NativeAudioCaptureModule>(jsInvoker);
}

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_CAPTURE_ENABLED
