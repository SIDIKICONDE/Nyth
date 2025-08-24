#pragma once

namespace Nyth {
namespace Audio {

// ============================================================================
// Déclarations des backends Android
// ============================================================================
#ifdef __ANDROID__

class AudioCaptureAndroid {
public:
    // Fonction helper pour créer les informations de périphérique
    AudioDeviceInfo createDeviceInfo(const std::string& id, const std::string& name, bool isAvailable) const;

    // Méthodes d'initialisation des backends
    bool initializeOboe();
    bool initializeAAudio();
    bool initializeOpenSL();

    // Méthodes de nettoyage des backends
    void cleanupOboe();
    void cleanupAAudio();
    void cleanupOpenSL();

    // Callbacks
    static void openSLRecorderCallback(SLAndroidSimpleBufferQueueItf bq, void* context);
    static void aaudioDataCallback(AAudioStream* stream, void* userData, void* audioData, int32_t numFrames);
    static void aaudioErrorCallback(AAudioStream* stream, void* userData, aaudio_result_t error);

    // Classe callback Oboe
    class OboeCallback : public oboe::AudioStreamDataCallback, public oboe::AudioStreamErrorCallback {
    public:
        AudioCaptureAndroid* parent = nullptr;

        oboe::DataCallbackResult onAudioReady(oboe::AudioStream* stream, void* audioData, int32_t numFrames) override;
        void onErrorBeforeClose(oboe::AudioStream* stream, oboe::Result error) override;
        void onErrorAfterClose(oboe::AudioStream* stream, oboe::Result error) override;
    };
};

#endif // __ANDROID__

} // namespace Audio
} // namespace Nyth
