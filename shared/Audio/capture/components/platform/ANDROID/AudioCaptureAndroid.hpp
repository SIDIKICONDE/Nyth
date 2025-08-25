#pragma once

#ifdef __ANDROID__

#include "../../core/AudioCapture.hpp"
#include <jni.h>
#include <memory>
#include <oboe/Oboe.h>

namespace Nyth {
namespace Audio {

class AudioCaptureAndroid : public AudioCaptureBase {
private:
    // Contexte JNI
    JavaVM* javaVM_ = nullptr;
    jobject androidContext_ = nullptr;

    // Backend Oboe
    std::shared_ptr<oboe::AudioStream> oboeStream_;

    class OboeCallback : public oboe::AudioStreamDataCallback, public oboe::AudioStreamErrorCallback {
    public:
        AudioCaptureAndroid* parent = nullptr;
        oboe::DataCallbackResult onAudioReady(oboe::AudioStream* stream, void* audioData, int32_t numFrames) override;
        void onErrorBeforeClose(oboe::AudioStream* stream, oboe::Result error) override;
        void onErrorAfterClose(oboe::AudioStream* stream, oboe::Result error) override;
    };

    std::unique_ptr<OboeCallback> oboeCallback_;

    // Méthodes internes
    bool initializeOboe();
    void cleanupOboe();
    AudioDeviceInfo createDeviceInfo(const std::string& id, const std::string& name, bool isAvailable) const;

public:
    AudioCaptureAndroid();
    ~AudioCaptureAndroid() override;

    // --- Interface Publique ---
    bool initialize(const AudioCaptureConfig& config) override;
    bool start() override;
    bool stop() override;
    bool pause() override;
    bool resume() override;
    void release() override;

    bool updateConfig(const AudioCaptureConfig& config) override;
    std::vector<AudioDeviceInfo> getAvailableDevices() const override;
    bool selectDevice(const std::string& deviceId) override;
    AudioDeviceInfo getCurrentDevice() const override;

    // --- Gestion des Permissions (Vérification uniquement) ---
    bool hasPermission() const override;

    // --- Configuration Spécifique Android ---
    void setJavaVM(JavaVM* vm) { javaVM_ = vm; }
    void setAndroidContext(jobject context) {
        if (context && javaVM_) {
            JNIEnv* env = nullptr;
            if (javaVM_->GetEnv((void**)&env, JNI_VERSION_1_6) == JNI_OK && env) {
                androidContext_ = env->NewGlobalRef(context);
            }
        }
    }
};

} // namespace Audio
} // namespace Nyth

#endif // __ANDROID__
