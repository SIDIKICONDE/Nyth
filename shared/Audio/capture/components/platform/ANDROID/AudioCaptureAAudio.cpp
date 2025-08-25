#include "../../AudioCaptureImpl.hpp"
#include "../../../common/config/Constant.hpp"
#include "../../../common/config/ErrorCodes.hpp"
#include <cstring>
#include <aaudio/AAudio.h>

namespace Nyth {
namespace Audio {

// ============================================================================
// Implémentation AAudio pour Android
// ============================================================================
#ifdef __ANDROID__

bool AudioCaptureAndroid::initializeAAudio() {
    if (__builtin_available(android 26, *)) {
        AAudioStreamBuilder* builder;
        aaudio_result_t result = AAudio_createStreamBuilder(&builder);
        if (result != Constants::AAudio::OK)
            return false;

        AAudioStreamBuilder_setDirection(builder, AAUDIO_DIRECTION_INPUT);
        AAudioStreamBuilder_setSampleRate(builder, config_.sampleRate);
        AAudioStreamBuilder_setChannelCount(builder, config_.channelCount);
        AAudioStreamBuilder_setFormat(builder, AAUDIO_FORMAT_PCM_FLOAT);
        AAudioStreamBuilder_setPerformanceMode(builder, AAUDIO_PERFORMANCE_MODE_LOW_LATENCY);
        AAudioStreamBuilder_setDataCallback(builder, aaudioDataCallback, this);
        AAudioStreamBuilder_setErrorCallback(builder, aaudioErrorCallback, this);

        result = AAudioStreamBuilder_openStream(builder, &aaudio_.stream);
        AAudioStreamBuilder_delete(builder);

        if (result == Constants::AAudio::OK) {
            aaudio_.useAAudio = true;
            return true;
        }
    }
    return false;
}

void AudioCaptureAndroid::cleanupAAudio() {
    if (aaudio_.stream) {
        AAudioStream_close(aaudio_.stream);
        aaudio_.stream = nullptr;
        aaudio_.useAAudio = false;
    }
}

// Callbacks AAudio
void AudioCaptureAndroid::aaudioDataCallback(AAudioStream* stream, void* userData, void* audioData, int32_t numFrames) {
    AudioCaptureAndroid* capture = static_cast<AudioCaptureAndroid*>(userData);

    if (!capture || !audioData || numFrames <= 0) {
        return;
    }

    // Les données AAudio sont déjà en float
    const float* floatData = static_cast<const float*>(audioData);
    size_t sampleCount = numFrames * capture->config_.channelCount;

    // Traiter les données audio
    capture->processAudioData(floatData, numFrames);
}

void AudioCaptureAndroid::aaudioErrorCallback(AAudioStream* stream, void* userData, aaudio_result_t error) {
    AudioCaptureAndroid* capture = static_cast<AudioCaptureAndroid*>(userData);

    if (!capture) {
        return;
    }

    // Gérer l'erreur AAudio
    std::string errorMsg = "AAudio error: " + std::to_string(error);

    switch (error) {
        case Constants::AAudio::ERROR_DISCONNECTED:
            errorMsg = "AAudio device disconnected";
            break;
        case Constants::AAudio::ERROR_ILLEGAL_ARGUMENT:
            errorMsg = "AAudio illegal argument";
            break;
        case Constants::AAudio::ERROR_INTERNAL:
            errorMsg = "AAudio internal error";
            break;
        case Constants::AAudio::ERROR_INVALID_STATE:
            errorMsg = "AAudio invalid state";
            break;
        case Constants::AAudio::ERROR_INVALID_HANDLE:
            errorMsg = "AAudio invalid handle";
            break;
        case Constants::AAudio::ERROR_UNIMPLEMENTED:
            errorMsg = "AAudio unimplemented";
            break;
        case Constants::AAudio::ERROR_UNAVAILABLE:
            errorMsg = "AAudio unavailable";
            break;
        case Constants::AAudio::ERROR_NO_FREE_HANDLES:
            errorMsg = "AAudio no free handles";
            break;
        case Constants::AAudio::ERROR_NO_MEMORY:
            errorMsg = "AAudio no memory";
            break;
        case Constants::AAudio::ERROR_NULL:
            errorMsg = "AAudio null pointer";
            break;
        case Constants::AAudio::ERROR_TIMEOUT:
            errorMsg = "AAudio timeout";
            break;
        case Constants::AAudio::ERROR_WOULD_BLOCK:
            errorMsg = "AAudio would block";
            break;
        case Constants::AAudio::ERROR_INVALID_FORMAT:
            errorMsg = "AAudio invalid format";
            break;
        case Constants::AAudio::ERROR_OUT_OF_RANGE:
            errorMsg = "AAudio out of range";
            break;
        case Constants::AAudio::ERROR_NO_SERVICE:
            errorMsg = "AAudio no service";
            break;
        case Constants::AAudio::ERROR_INVALID_RATE:
            errorMsg = "AAudio invalid rate";
            break;
    }

    capture->reportError(errorMsg);
}

#endif // __ANDROID__

} // namespace Audio
} // namespace Nyth
