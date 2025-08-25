#include "../../AudioCaptureImpl.hpp"
#include <SLES/OpenSLES_Android.h>
#include "../../../common/config/Constant.hpp"
#include "../../../common/config/ErrorCodes.hpp"
#include <cstring>

namespace Nyth {
namespace Audio {

// ============================================================================
// Implémentation OpenSL ES pour Android
// ============================================================================
#ifdef __ANDROID__

bool AudioCaptureAndroid::initializeOpenSL() {
    // Création du moteur OpenSL ES
    SLresult result = slCreateEngine(&opensl_.engineObject, Constants::OpenSL::RESULT_SUCCESS, nullptr, Constants::OpenSL::RESULT_SUCCESS, nullptr, nullptr);
    if (result != Constants::OpenSL::RESULT_SUCCESS)
        return false;

    result = (*opensl_.engineObject)->Realize(opensl_.engineObject, Constants::Android::FALSE);
    if (result != Constants::OpenSL::RESULT_SUCCESS)
        return false;

    result = (*opensl_.engineObject)->GetInterface(opensl_.engineObject, SL_IID_ENGINE, &opensl_.engineEngine);
    if (result != Constants::OpenSL::RESULT_SUCCESS)
        return false;

    // Configuration de la source audio (microphone)
    SLDataLocator_IODevice loc_dev = {SL_DATALOCATOR_IODEVICE, SL_IODEVICE_AUDIOINPUT, SL_DEFAULTDEVICEID_AUDIOINPUT,
                                      nullptr};
    SLDataSource audioSrc = {&loc_dev, nullptr};

    // Configuration du format audio
    SLDataLocator_AndroidSimpleBufferQueue loc_bq = {SL_DATALOCATOR_ANDROIDSIMPLEBUFFERQUEUE,
                                                     (SLuint32)config_.numBuffers};

    SLDataFormat_PCM format_pcm = {
        SL_DATAFORMAT_PCM,
        (SLuint32)config_.channelCount,
        (SLuint32)(config_.sampleRate * 1000),
        SL_PCMSAMPLEFORMAT_FIXED_16,
        SL_PCMSAMPLEFORMAT_FIXED_16,
        config_.channelCount == Constants::MIN_CHANNEL_COUNT ? SL_SPEAKER_FRONT_CENTER : (SL_SPEAKER_FRONT_LEFT | SL_SPEAKER_FRONT_RIGHT),
        SL_BYTEORDER_LITTLEENDIAN};

    SLDataSink audioSnk = {&loc_bq, &format_pcm};

    // Création de l'enregistreur
    const SLInterfaceID id[1] = {SL_IID_ANDROIDSIMPLEBUFFERQUEUE};
    const SLboolean req[1] = {Constants::Android::TRUE};

    result = (*opensl_.engineEngine)
                 ->CreateAudioRecorder(opensl_.engineEngine, &opensl_.recorderObject, &audioSrc, &audioSnk, 1, id, req);
    if (result != Constants::OpenSL::RESULT_SUCCESS)
        return false;

    result = (*opensl_.recorderObject)->Realize(opensl_.recorderObject, Constants::Android::FALSE);
    if (result != Constants::OpenSL::RESULT_SUCCESS)
        return false;

    result = (*opensl_.recorderObject)->GetInterface(opensl_.recorderObject, SL_IID_RECORD, &opensl_.recorderRecord);
    if (result != Constants::OpenSL::RESULT_SUCCESS)
        return false;

    result = (*opensl_.recorderObject)
                 ->GetInterface(opensl_.recorderObject, SL_IID_ANDROIDSIMPLEBUFFERQUEUE, &opensl_.recorderBufferQueue);
    if (result != Constants::OpenSL::RESULT_SUCCESS)
        return false;

    // Configuration du callback
    result =
        (*opensl_.recorderBufferQueue)->RegisterCallback(opensl_.recorderBufferQueue, openSLRecorderCallback, this);
    if (result != Constants::OpenSL::RESULT_SUCCESS)
        return false;

    // Initialisation des buffers
    size_t bufferSize = config_.bufferSizeFrames * config_.channelCount * sizeof(int16_t);
    for (int i = 0; i < Constants::ANDROID_OPENSL_BUFFER_COUNT; ++i) {
        opensl_.buffers[i].resize(bufferSize / sizeof(int16_t));
    }

    return true;
}

void AudioCaptureAndroid::cleanupOpenSL() {
    if (opensl_.recorderObject) {
        (*opensl_.recorderObject)->Destroy(opensl_.recorderObject);
        opensl_.recorderObject = nullptr;
    }

    if (opensl_.engineObject) {
        (*opensl_.engineObject)->Destroy(opensl_.engineObject);
        opensl_.engineObject = nullptr;
    }
}

// Callback OpenSL ES
void AudioCaptureAndroid::openSLRecorderCallback(SLAndroidSimpleBufferQueueItf bq, void* context) {
    AudioCaptureAndroid* capture = static_cast<AudioCaptureAndroid*>(context);

    // Traiter les données du buffer actuel
    int currentBuffer = capture->opensl_.currentBuffer;
    const int16_t* bufferData = capture->opensl_.buffers[currentBuffer].data();
    size_t bufferSize = capture->opensl_.buffers[currentBuffer].size();

    // Convertir int16 vers float et traiter
    std::vector<float> floatData(bufferSize);
    const float scale = Constants::INT16_TO_FLOAT_SCALE;
    for (size_t i = 0; i < bufferSize; ++i) {
        floatData[i] = bufferData[i] * scale;
    }

    // Traiter les données audio
    capture->processAudioData(floatData.data(), bufferSize / capture->config_.channelCount);

    // Passer au buffer suivant
    capture->opensl_.currentBuffer = (currentBuffer + Constants::ANDROID_BUFFER_INDEX_INCREMENT) % Constants::ANDROID_OPENSL_BUFFER_COUNT;

    // Ré-enqueue le buffer pour la prochaine capture
    (*bq)->Enqueue(bq, capture->opensl_.buffers[capture->opensl_.currentBuffer].data(),
                   capture->opensl_.buffers[capture->opensl_.currentBuffer].size() * sizeof(int16_t));
}

#endif // __ANDROID__

} // namespace Audio
} // namespace Nyth
