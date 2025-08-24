#include "../../AudioCaptureImpl.hpp"
#include "../../../common/config/Constant.hpp"
#include <cstring>

namespace Nyth {
namespace Audio {

// ============================================================================
// Implémentation Oboe pour Android
// ============================================================================
#ifdef __ANDROID__

// Constructeur et destructeur pour Oboe
AudioCaptureAndroid::AudioCaptureAndroid() {
    oboeCallback_ = std::make_unique<OboeCallback>();
    oboeCallback_->parent = this;
}

AudioCaptureAndroid::~AudioCaptureAndroid() {
    release();
}

// Méthodes principales Oboe
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

// Callback Oboe complet
oboe::DataCallbackResult AudioCaptureAndroid::OboeCallback::onAudioReady(oboe::AudioStream* stream, void* audioData,
                                                                         int32_t numFrames) {
    if (!parent || !audioData || numFrames <= 0) {
        return oboe::DataCallbackResult::Stop;
    }

    // Les données Oboe sont en float
    const float* floatData = static_cast<const float*>(audioData);

    // Traiter les données audio
    parent->processAudioData(floatData, numFrames);

    return oboe::DataCallbackResult::Continue;
}

void AudioCaptureAndroid::OboeCallback::onErrorBeforeClose(oboe::AudioStream* stream, oboe::Result error) {
    if (!parent) {
        return;
    }

    // Gérer l'erreur Oboe avant fermeture
    std::string errorMsg = "Oboe error before close: " + oboe::convertToText(error);
    parent->reportError(errorMsg);
}

void AudioCaptureAndroid::OboeCallback::onErrorAfterClose(oboe::AudioStream* stream, oboe::Result error) {
    if (!parent) {
        return;
    }

    // Gérer l'erreur Oboe après fermeture
    std::string errorMsg = "Oboe error after close: " + oboe::convertToText(error);
    parent->reportError(errorMsg);
    parent->setState(CaptureState::Error);
}

#endif // __ANDROID__

} // namespace Audio
} // namespace Nyth
