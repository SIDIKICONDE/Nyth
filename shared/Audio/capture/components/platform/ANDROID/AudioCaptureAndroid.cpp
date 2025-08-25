#include "AudioCaptureAndroid.hpp"
#include "../../../../common/config/Constant.hpp"
#include <cstring>
#include <android/log.h>

#define LOG_TAG "AudioCaptureAndroid"
#define LOGD(...) __android_log_print(ANDROID_LOG_DEBUG, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

namespace Nyth {
namespace Audio {

// ============================================================================
// Implémentation Android (Oboe uniquement)
// ============================================================================
#ifdef __ANDROID__

// --- JNI Helper Internals ---
namespace {
    JavaVM* gJavaVM = nullptr;
    jclass gContextClass = nullptr;
    jmethodID gCheckPermissionMethod = nullptr;

    bool initializeJNI(JNIEnv* env, jobject context) {
        if (gJavaVM != nullptr) return true;
        if (env->GetJavaVM(&gJavaVM) != JNI_OK) {
            LOGE("Failed to get JavaVM");
            return false;
        }
        jclass contextClass = env->FindClass("android/content/Context");
        if (!contextClass) return false;
        gContextClass = static_cast<jclass>(env->NewGlobalRef(contextClass));
        env->DeleteLocalRef(contextClass);
        gCheckPermissionMethod = env->GetMethodID(gContextClass, "checkSelfPermission", "(Ljava/lang/String;)I");
        return gCheckPermissionMethod != nullptr;
    }
}

// --- AudioCaptureAndroid Implementation ---

AudioCaptureAndroid::AudioCaptureAndroid() {
    oboeCallback_ = std::make_unique<OboeCallback>();
    oboeCallback_->parent = this;
}

AudioCaptureAndroid::~AudioCaptureAndroid() {
    if (androidContext_ && gJavaVM) {
        JNIEnv* env = nullptr;
        if (gJavaVM->GetEnv((void**)&env, JNI_VERSION_1_6) == JNI_OK && env) {
            env->DeleteGlobalRef(androidContext_);
            androidContext_ = nullptr;
        }
    }
    if (gContextClass) {
        JNIEnv* env = nullptr;
        if (gJavaVM->GetEnv((void**)&env, JNI_VERSION_1_6) == JNI_OK && env) {
            env->DeleteGlobalRef(gContextClass);
            gContextClass = nullptr;
        }
    }
    release();
}

bool AudioCaptureAndroid::initialize(const AudioCaptureConfig& config) {
    if (state_ != CaptureState::Uninitialized) {
        reportError("AudioCapture already initialized");
        return false;
    }
    config_ = config;

    // Initialisation JNI (nécessaire pour les permissions)
    if (!androidContext_) {
        reportError("Android context not set. Call setAndroidContext before initializing.");
        return false;
    }
    JNIEnv* env = nullptr;
    if (gJavaVM && gJavaVM->GetEnv((void**)&env, JNI_VERSION_1_6) == JNI_OK && env) {
        if (!initializeJNI(env, androidContext_)) {
            reportError("Failed to initialize JNI for permission checks.");
            return false;
        }
    }


    if (!initializeOboe()) {
        reportError("Failed to initialize Oboe audio backend");
        setState(CaptureState::Error);
        return false;
    }

    setState(CaptureState::Initialized);
    return true;
}

bool AudioCaptureAndroid::hasPermission() const {
    JNIEnv* env = nullptr;
    if (gJavaVM && gJavaVM->GetEnv((void**)&env, JNI_VERSION_1_6) == JNI_OK && env && androidContext_ && gCheckPermissionMethod) {
        jstring permissionString = env->NewStringUTF("android.permission.RECORD_AUDIO");
        jint result = env->CallIntMethod(androidContext_, gCheckPermissionMethod, permissionString);
        env->DeleteLocalRef(permissionString);
        return (result == 0); // PERMISSION_GRANTED
    }
    return false;
}

AudioDeviceInfo AudioCaptureAndroid::createDeviceInfo(const std::string& id, const std::string& name, bool isAvailable) const {
    AudioDeviceInfo device;
    device.id = id;
    device.name = name;
    device.isDefault = true;
    device.isAvailable = isAvailable;
    device.maxChannels = Constants::ANDROID_MAX_CHANNELS_DEFAULT;
    device.supportedSampleRates = {
        Constants::SAMPLE_RATE_8KHZ, Constants::SAMPLE_RATE_11KHZ, Constants::SAMPLE_RATE_16KHZ,
        Constants::SAMPLE_RATE_22KHZ, Constants::DEFAULT_SAMPLE_RATE, Constants::SAMPLE_RATE_48KHZ,
        Constants::SAMPLE_RATE_88KHZ, Constants::SAMPLE_RATE_96KHZ, Constants::SAMPLE_RATE_176KHZ,
        Constants::SAMPLE_RATE_192KHZ
    };
    return device;
}

std::vector<AudioDeviceInfo> AudioCaptureAndroid::getAvailableDevices() const {
    std::vector<AudioDeviceInfo> devices;
    if (oboeStream_) {
        devices.push_back(createDeviceInfo("default", "Default Microphone (Oboe)", true));
    }
    return devices;
}

bool AudioCaptureAndroid::selectDevice(const std::string& deviceId) {
    return deviceId == "default";
}

AudioDeviceInfo AudioCaptureAndroid::getCurrentDevice() const {
    if (oboeStream_) {
        return createDeviceInfo("default", "Default Microphone (Oboe)", true);
    }
    return createDeviceInfo("default", "No active device", false);
}

bool AudioCaptureAndroid::updateConfig(const AudioCaptureConfig& config) {
    if (state_ == CaptureState::Running) {
        reportError("Cannot update config while running");
        return false;
    }
    config_ = config;
    if (state_ != CaptureState::Uninitialized) {
        release();
        return initialize(config);
    }
    return true;
}

bool AudioCaptureAndroid::start() {
    if (state_ != CaptureState::Initialized && state_ != CaptureState::Stopped) {
        reportError("Cannot start: invalid state");
        return false;
    }
    if (!hasPermission()) {
        reportError("Audio permission not granted. Please request it from React Native.");
        setState(CaptureState::Error);
        return false;
    }
    setState(CaptureState::Starting);
    if (oboeStream_) {
        oboe::Result result = oboeStream_->requestStart();
        if (result != oboe::Result::OK) {
            reportError("Failed to start Oboe stream: " + std::string(oboe::convertToText(result)));
            setState(CaptureState::Error);
            return false;
        }
    } else {
        reportError("Oboe stream is not available.");
        setState(CaptureState::Error);
        return false;
    }
    setState(CaptureState::Running);
    return true;
}

bool AudioCaptureAndroid::stop() {
    if (state_ != CaptureState::Running && state_ != CaptureState::Paused) {
        return false;
    }
    setState(CaptureState::Stopping);
    if (oboeStream_) {
        oboeStream_->requestStop();
    }
    setState(CaptureState::Stopped);
    return true;
}

bool AudioCaptureAndroid::pause() {
    if (state_ != CaptureState::Running) return false;
    if (oboeStream_) oboeStream_->requestPause();
    setState(CaptureState::Paused);
    return true;
}

bool AudioCaptureAndroid::resume() {
    if (state_ != CaptureState::Paused) return false;
    if (oboeStream_) oboeStream_->requestStart();
    setState(CaptureState::Running);
    return true;
}

void AudioCaptureAndroid::release() {
    if (state_ != CaptureState::Uninitialized) {
        stop();
        cleanupOboe();
        setState(CaptureState::Uninitialized);
    }
}

bool AudioCaptureAndroid::initializeOboe() {
    oboe::AudioStreamBuilder builder;
    builder.setDirection(oboe::Direction::Input)
        ->setPerformanceMode(oboe::PerformanceMode::LowLatency)
        ->setSharingMode(oboe::SharingMode::Exclusive)
        ->setFormat(oboe::AudioFormat::Float)
        ->setSampleRate(config_.sampleRate)
        ->setChannelCount(config_.channelCount)
        ->setDataCallback(oboeCallback_.get())
        ->setErrorCallback(oboeCallback_.get());
    oboe::Result result = builder.openStream(oboeStream_);
    return result == oboe::Result::OK;
}

void AudioCaptureAndroid::cleanupOboe() {
    if (oboeStream_) {
        oboeStream_->close();
        oboeStream_.reset();
    }
}

oboe::DataCallbackResult AudioCaptureAndroid::OboeCallback::onAudioReady(oboe::AudioStream* stream, void* audioData, int32_t numFrames) {
    if (!parent || !audioData || numFrames <= 0) return oboe::DataCallbackResult::Stop;
    parent->processAudioData(static_cast<const float*>(audioData), numFrames);
    return oboe::DataCallbackResult::Continue;
}

void AudioCaptureAndroid::OboeCallback::onErrorBeforeClose(oboe::AudioStream* stream, oboe::Result error) {
    if (parent) parent->reportError("Oboe error before close: " + std::string(oboe::convertToText(error)));
}

void AudioCaptureAndroid::OboeCallback::onErrorAfterClose(oboe::AudioStream* stream, oboe::Result error) {
    if (parent) {
        parent->reportError("Oboe error after close: " + std::string(oboe::convertToText(error)));
        parent->setState(CaptureState::Error);
    }
}

#endif // __ANDROID__

} // namespace Audio
} // namespace Nyth
