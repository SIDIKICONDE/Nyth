#include "AudioCaptureImpl.hpp"
#include <cstring>

namespace Audio {
namespace capture {

// ============================================================================
// Implémentation Android
// ============================================================================
#ifdef __ANDROID__

// Constructeur et destructeur
AudioCaptureAndroid::AudioCaptureAndroid() {
    oboeCallback_ = std::make_unique<OboeCallback>();
    oboeCallback_->parent = this;
}

AudioCaptureAndroid::~AudioCaptureAndroid() {
    release();
}

// Méthodes principales
bool AudioCaptureAndroid::initialize(const AudioCaptureConfig& config) {
    if (state_ != CaptureState::Uninitialized) {
        reportError("AudioCapture already initialized");
        return false;
    }
    
    config_ = config;
    
    // Essayer Oboe en premier (recommandé)
    if (initializeOboe()) {
        setState(CaptureState::Initialized);
        return true;
    }
    
    // Fallback sur AAudio si disponible
    if (initializeAAudio()) {
        setState(CaptureState::Initialized);
        return true;
    }
    
    // Fallback final sur OpenSL ES
    if (initializeOpenSL()) {
        setState(CaptureState::Initialized);
        return true;
    }
    
    reportError("Failed to initialize any audio backend");
    setState(CaptureState::Error);
    return false;
}

bool AudioCaptureAndroid::start() {
    if (state_ != CaptureState::Initialized && state_ != CaptureState::Stopped) {
        reportError("Cannot start: invalid state");
        return false;
    }
    
    setState(CaptureState::Starting);
    
    // Démarrer selon le backend utilisé
    if (oboeStream_) {
        oboe::Result result = oboeStream_->requestStart();
        if (result != oboe::Result::OK) {
            reportError("Failed to start Oboe stream");
            setState(CaptureState::Error);
            return false;
        }
    } else if (aaudio_.stream) {
        aaudio_result_t result = AAudioStream_requestStart(aaudio_.stream);
        if (result != AAUDIO_OK) {
            reportError("Failed to start AAudio stream");
            setState(CaptureState::Error);
            return false;
        }
    } else if (opensl_.recorderRecord) {
        SLresult result = (*opensl_.recorderRecord)->SetRecordState(
            opensl_.recorderRecord, SL_RECORDSTATE_RECORDING);
        if (result != SL_RESULT_SUCCESS) {
            reportError("Failed to start OpenSL recording");
            setState(CaptureState::Error);
            return false;
        }
    }
    
    setState(CaptureState::Running);
    return true;
}

bool AudioCaptureAndroid::stop() {
    if (state_ != CaptureState::Running && state_ != CaptureState::Paused) {
        return false;
    }
    
    setState(CaptureState::Stopping);
    
    // Arrêter selon le backend utilisé
    if (oboeStream_) {
        oboeStream_->requestStop();
    } else if (aaudio_.stream) {
        AAudioStream_requestStop(aaudio_.stream);
    } else if (opensl_.recorderRecord) {
        (*opensl_.recorderRecord)->SetRecordState(
            opensl_.recorderRecord, SL_RECORDSTATE_STOPPED);
    }
    
    setState(CaptureState::Stopped);
    return true;
}

bool AudioCaptureAndroid::pause() {
    if (state_ != CaptureState::Running) {
        return false;
    }
    
    setState(CaptureState::Pausing);
    
    if (oboeStream_) {
        oboeStream_->requestPause();
    } else if (aaudio_.stream) {
        AAudioStream_requestPause(aaudio_.stream);
    } else if (opensl_.recorderRecord) {
        (*opensl_.recorderRecord)->SetRecordState(
            opensl_.recorderRecord, SL_RECORDSTATE_PAUSED);
    }
    
    setState(CaptureState::Paused);
    return true;
}

bool AudioCaptureAndroid::resume() {
    if (state_ != CaptureState::Paused) {
        return false;
    }
    
    return start();
}

void AudioCaptureAndroid::release() {
    if (state_ != CaptureState::Uninitialized) {
        stop();
        
        cleanupOboe();
        cleanupAAudio();
        cleanupOpenSL();
        
        setState(CaptureState::Uninitialized);
    }
}

// Méthodes d'initialisation spécifiques
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

bool AudioCaptureAndroid::initializeAAudio() {
    if (__builtin_available(android 26, *)) {
        AAudioStreamBuilder* builder;
        aaudio_result_t result = AAudio_createStreamBuilder(&builder);
        if (result != AAUDIO_OK) return false;
        
        AAudioStreamBuilder_setDirection(builder, AAUDIO_DIRECTION_INPUT);
        AAudioStreamBuilder_setSampleRate(builder, config_.sampleRate);
        AAudioStreamBuilder_setChannelCount(builder, config_.channelCount);
        AAudioStreamBuilder_setFormat(builder, AAUDIO_FORMAT_PCM_FLOAT);
        AAudioStreamBuilder_setPerformanceMode(builder, AAUDIO_PERFORMANCE_MODE_LOW_LATENCY);
        AAudioStreamBuilder_setDataCallback(builder, aaudioDataCallback, this);
        AAudioStreamBuilder_setErrorCallback(builder, aaudioErrorCallback, this);
        
        result = AAudioStreamBuilder_openStream(builder, &aaudio_.stream);
        AAudioStreamBuilder_delete(builder);
        
        if (result == AAUDIO_OK) {
            aaudio_.useAAudio = true;
            return true;
        }
    }
    return false;
}

bool AudioCaptureAndroid::initializeOpenSL() {
    // Création du moteur OpenSL ES
    SLresult result = slCreateEngine(&opensl_.engineObject, 0, nullptr, 0, nullptr, nullptr);
    if (result != SL_RESULT_SUCCESS) return false;
    
    result = (*opensl_.engineObject)->Realize(opensl_.engineObject, SL_BOOLEAN_FALSE);
    if (result != SL_RESULT_SUCCESS) return false;
    
    result = (*opensl_.engineObject)->GetInterface(opensl_.engineObject, 
                                                   SL_IID_ENGINE, &opensl_.engineEngine);
    if (result != SL_RESULT_SUCCESS) return false;
    
    // Configuration de la source audio (microphone)
    SLDataLocator_IODevice loc_dev = {SL_DATALOCATOR_IODEVICE, SL_IODEVICE_AUDIOINPUT,
                                      SL_DEFAULTDEVICEID_AUDIOINPUT, nullptr};
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
        config_.channelCount == 1 ? SL_SPEAKER_FRONT_CENTER : 
                                   (SL_SPEAKER_FRONT_LEFT | SL_SPEAKER_FRONT_RIGHT),
        SL_BYTEORDER_LITTLEENDIAN
    };
    
    SLDataSink audioSnk = {&loc_bq, &format_pcm};
    
    // Création de l'enregistreur
    const SLInterfaceID id[1] = {SL_IID_ANDROIDSIMPLEBUFFERQUEUE};
    const SLboolean req[1] = {SL_BOOLEAN_TRUE};
    
    result = (*opensl_.engineEngine)->CreateAudioRecorder(opensl_.engineEngine,
                                                          &opensl_.recorderObject,
                                                          &audioSrc, &audioSnk,
                                                          1, id, req);
    if (result != SL_RESULT_SUCCESS) return false;
    
    result = (*opensl_.recorderObject)->Realize(opensl_.recorderObject, SL_BOOLEAN_FALSE);
    if (result != SL_RESULT_SUCCESS) return false;
    
    result = (*opensl_.recorderObject)->GetInterface(opensl_.recorderObject,
                                                     SL_IID_RECORD, &opensl_.recorderRecord);
    if (result != SL_RESULT_SUCCESS) return false;
    
    result = (*opensl_.recorderObject)->GetInterface(opensl_.recorderObject,
                                                     SL_IID_ANDROIDSIMPLEBUFFERQUEUE,
                                                     &opensl_.recorderBufferQueue);
    if (result != SL_RESULT_SUCCESS) return false;
    
    // Configuration du callback
    result = (*opensl_.recorderBufferQueue)->RegisterCallback(opensl_.recorderBufferQueue,
                                                              openSLRecorderCallback, this);
    if (result != SL_RESULT_SUCCESS) return false;
    
    // Initialisation des buffers
    size_t bufferSize = config_.bufferSizeFrames * config_.channelCount * sizeof(int16_t);
    for (int i = 0; i < 3; ++i) {
        opensl_.buffers[i].resize(bufferSize / sizeof(int16_t));
    }
    
    return true;
}

// Méthodes de nettoyage
void AudioCaptureAndroid::cleanupOboe() {
    if (oboeStream_) {
        oboeStream_->close();
        oboeStream_.reset();
    }
}

void AudioCaptureAndroid::cleanupAAudio() {
    if (aaudio_.stream) {
        AAudioStream_close(aaudio_.stream);
        aaudio_.stream = nullptr;
        aaudio_.useAAudio = false;
    }
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

// Callbacks
void AudioCaptureAndroid::openSLRecorderCallback(SLAndroidSimpleBufferQueueItf bq, void* context) {
    AudioCaptureAndroid* capture = static_cast<AudioCaptureAndroid*>(context);
    
    // Traiter les données du buffer actuel
    int currentBuffer = capture->opensl_.currentBuffer;
    capture->processAudioData(capture->opensl_.buffers[currentBuffer].data(),
                             capture->opensl_.buffers[currentBuffer].size() * sizeof(int16_t));
    
    // Passer au buffer suivant
    capture->opensl_.currentBuffer = (currentBuffer + 1) % 3;
    
    // Ré-enqueue le buffer pour la prochaine capture
    (*bq)->Enqueue(bq, capture->opensl_.buffers[capture->opensl_.currentBuffer].data(),
                   capture->opensl_.buffers[capture->opensl_.currentBuffer].size() * sizeof(int16_t));
}

void AudioCaptureAndroid::aaudioDataCallback(AAudioStream* stream, void* userData,
                                            void* audioData, int32_t numFrames) {
    AudioCaptureAndroid* capture = static_cast<AudioCaptureAndroid*>(userData);
    size_t bytesPerFrame = capture->config_.channelCount * sizeof(float);
    capture->processAudioData(audioData, numFrames * bytesPerFrame);
}

void AudioCaptureAndroid::aaudioErrorCallback(AAudioStream* stream, void* userData,
                                             aaudio_result_t error) {
    AudioCaptureAndroid* capture = static_cast<AudioCaptureAndroid*>(userData);
    capture->reportError("AAudio error: " + std::to_string(error));
}

// Implémentation du callback Oboe
oboe::DataCallbackResult AudioCaptureAndroid::OboeCallback::onAudioReady(
    oboe::AudioStream* stream, void* audioData, int32_t numFrames) {
    
    if (parent) {
        size_t bytesPerFrame = stream->getChannelCount() * sizeof(float);
        parent->processAudioData(audioData, numFrames * bytesPerFrame);
    }
    
    return oboe::DataCallbackResult::Continue;
}

void AudioCaptureAndroid::OboeCallback::onErrorBeforeClose(oboe::AudioStream* stream, oboe::Result error) {
    if (parent) {
        parent->reportError("Oboe error before close: " + oboe::convertToText(error));
    }
}

void AudioCaptureAndroid::OboeCallback::onErrorAfterClose(oboe::AudioStream* stream, oboe::Result error) {
    if (parent) {
        parent->reportError("Oboe error after close: " + oboe::convertToText(error));
        parent->setState(CaptureState::Error);
    }
}

// Autres méthodes
bool AudioCaptureAndroid::hasPermission() const {
    // Cette méthode doit être implémentée via JNI pour vérifier la permission RECORD_AUDIO
    // Pour l'instant, on retourne true par défaut
    return true;
}

void AudioCaptureAndroid::requestPermission(std::function<void(bool)> callback) {
    // Cette méthode doit être implémentée via JNI pour demander la permission
    // Pour l'instant, on appelle le callback avec true
    if (callback) {
        callback(true);
    }
}

std::vector<AudioDeviceInfo> AudioCaptureAndroid::getAvailableDevices() const {
    std::vector<AudioDeviceInfo> devices;
    
    // Ajouter le microphone par défaut
    AudioDeviceInfo defaultMic;
    defaultMic.id = "default";
    defaultMic.name = "Default Microphone";
    defaultMic.isDefault = true;
    defaultMic.isAvailable = true;
    devices.push_back(defaultMic);
    
    return devices;
}

bool AudioCaptureAndroid::selectDevice(const std::string& deviceId) {
    // Pour l'instant, on accepte seulement le device par défaut
    return deviceId == "default";
}

AudioDeviceInfo AudioCaptureAndroid::getCurrentDevice() const {
    AudioDeviceInfo device;
    device.id = "default";
    device.name = "Default Microphone";
    device.isDefault = true;
    device.isAvailable = true;
    return device;
}

bool AudioCaptureAndroid::updateConfig(const AudioCaptureConfig& config) {
    if (state_ == CaptureState::Running) {
        reportError("Cannot update config while running");
        return false;
    }
    
    config_ = config;
    
    // Si déjà initialisé, réinitialiser avec la nouvelle config
    if (state_ != CaptureState::Uninitialized) {
        release();
        return initialize(config);
    }
    
    return true;
}

#endif // __ANDROID__

// ============================================================================
// Implémentation iOS
// ============================================================================
#ifdef __APPLE__
#if TARGET_OS_IOS

AudioCaptureIOS::AudioCaptureIOS() {
    // Initialisation spécifique iOS
    audioUnit_ = nullptr;
    audioSession_ = nil;
    shouldProcess_.store(false);
}

AudioCaptureIOS::~AudioCaptureIOS() {
    release();
}

void AudioCaptureIOS::teardownAudioUnit() {
    if (audioUnit_) {
        AudioComponentInstanceDispose(audioUnit_);
        audioUnit_ = nullptr;
    }
}

void AudioCaptureIOS::processingThreadFunc() {
    // Le traitement est maintenant fait directement dans le callback Audio Unit
    // Cette méthode pourrait être utilisée pour un traitement supplémentaire si nécessaire
}

void AudioCaptureIOS::handleInterruption(NSNotification* notification) {
    // Gestion des interruptions (appels entrants, etc.)
    NSDictionary* userInfo = notification.userInfo;
    AVAudioSessionInterruptionType interruptionType = (AVAudioSessionInterruptionType)[userInfo[AVAudioSessionInterruptionTypeKey] integerValue];

    if (interruptionType == AVAudioSessionInterruptionTypeBegan) {
        // Interruption commencée - arrêter la capture
        stop();
    } else if (interruptionType == AVAudioSessionInterruptionTypeEnded) {
        // Interruption terminée - redémarrer si possible
        AVAudioSessionInterruptionOptions options = (AVAudioSessionInterruptionOptions)[userInfo[AVAudioSessionInterruptionOptionKey] integerValue];
        if (options == AVAudioSessionInterruptionOptionShouldResume) {
            // Redémarrer la capture
            initialize(config_);
        }
    }
}

void AudioCaptureIOS::handleRouteChange(NSNotification* notification) {
    // Gestion des changements de route audio (changement de périphérique)
    // Pour l'instant, on ne fait rien de spécial
}

bool AudioCaptureIOS::initialize(const AudioCaptureConfig& config) {
    if (state_ != CaptureState::Uninitialized) {
        reportError("AudioCapture already initialized");
        return false;
    }
    
    config_ = config;
    
    if (!setupAudioSession()) {
        reportError("Failed to setup audio session");
        return false;
    }
    
    if (!setupAudioUnit()) {
        reportError("Failed to setup audio unit");
        return false;
    }
    
    setState(CaptureState::Initialized);
    return true;
}

bool AudioCaptureIOS::start() {
    if (state_ != CaptureState::Initialized && state_ != CaptureState::Stopped) {
        return false;
    }
    
    setState(CaptureState::Starting);
    
    OSStatus status = AudioOutputUnitStart(audioUnit_);
    if (status != noErr) {
        reportError("Failed to start audio unit: " + std::to_string(status));
        setState(CaptureState::Error);
        return false;
    }
    
    setState(CaptureState::Running);
    return true;
}

bool AudioCaptureIOS::stop() {
    if (state_ != CaptureState::Running && state_ != CaptureState::Paused) {
        return false;
    }
    
    setState(CaptureState::Stopping);
    
    OSStatus status = AudioOutputUnitStop(audioUnit_);
    if (status != noErr) {
        reportError("Failed to stop audio unit: " + std::to_string(status));
    }
    
    setState(CaptureState::Stopped);
    return true;
}

bool AudioCaptureIOS::pause() {
    // iOS ne supporte pas vraiment la pause, on arrête
    return stop();
}

bool AudioCaptureIOS::resume() {
    // iOS ne supporte pas vraiment le resume, on redémarre
    return start();
}

void AudioCaptureIOS::release() {
    if (state_ != CaptureState::Uninitialized) {
        stop();
        teardownAudioUnit();
        setState(CaptureState::Uninitialized);
    }
}

bool AudioCaptureIOS::setupAudioSession() {
    // Configuration de la session audio iOS
    AVAudioSession* session = [AVAudioSession sharedInstance];
    NSError* error = nil;
    
    // Définir la catégorie pour l'enregistrement
    [session setCategory:AVAudioSessionCategoryRecord error:&error];
    if (error) {
        reportError("Failed to set audio category");
        return false;
    }
    
    // Définir le taux d'échantillonnage préféré
    [session setPreferredSampleRate:config_.sampleRate error:&error];
    if (error) {
        reportError("Failed to set sample rate");
        return false;
    }
    
    // Activer la session
    [session setActive:YES error:&error];
    if (error) {
        reportError("Failed to activate audio session");
        return false;
    }
    
    return true;
}

bool AudioCaptureIOS::setupAudioUnit() {
    // Description du composant audio
    AudioComponentDescription desc;
    desc.componentType = kAudioUnitType_Output;
    desc.componentSubType = kAudioUnitSubType_RemoteIO;
    desc.componentManufacturer = kAudioUnitManufacturer_Apple;
    desc.componentFlags = 0;
    desc.componentFlagsMask = 0;
    
    // Trouver le composant
    AudioComponent component = AudioComponentFindNext(nullptr, &desc);
    if (!component) {
        reportError("Failed to find audio component");
        return false;
    }
    
    // Créer l'instance
    OSStatus status = AudioComponentInstanceNew(component, &audioUnit_);
    if (status != noErr) {
        reportError("Failed to create audio unit instance");
        return false;
    }
    
    // Activer l'entrée et désactiver la sortie
    UInt32 enableInput = 1;
    UInt32 disableOutput = 0;
    
    status = AudioUnitSetProperty(audioUnit_,
                                 kAudioOutputUnitProperty_EnableIO,
                                 kAudioUnitScope_Input,
                                 1,  // input bus
                                 &enableInput,
                                 sizeof(enableInput));
    if (status != noErr) {
        reportError("Failed to enable input");
        return false;
    }
    
    status = AudioUnitSetProperty(audioUnit_,
                                 kAudioOutputUnitProperty_EnableIO,
                                 kAudioUnitScope_Output,
                                 0,  // output bus
                                 &disableOutput,
                                 sizeof(disableOutput));
    if (status != noErr) {
        reportError("Failed to disable output");
        return false;
    }
    
    // Configurer le format audio
    AudioStreamBasicDescription format;
    format.mSampleRate = config_.sampleRate;
    format.mFormatID = kAudioFormatLinearPCM;
    format.mFormatFlags = kAudioFormatFlagIsFloat | kAudioFormatFlagIsPacked;
    format.mFramesPerPacket = 1;
    format.mChannelsPerFrame = config_.channelCount;
    format.mBitsPerChannel = 32;
    format.mBytesPerPacket = format.mBytesPerFrame = 
        format.mChannelsPerFrame * sizeof(float);
    
    status = AudioUnitSetProperty(audioUnit_,
                                 kAudioUnitProperty_StreamFormat,
                                 kAudioUnitScope_Output,
                                 1,  // input bus
                                 &format,
                                 sizeof(format));
    if (status != noErr) {
        reportError("Failed to set stream format");
        return false;
    }
    
    // Configurer le callback
    AURenderCallbackStruct callbackStruct;
    callbackStruct.inputProc = recordingCallback;
    callbackStruct.inputProcRefCon = this;
    
    status = AudioUnitSetProperty(audioUnit_,
                                 kAudioOutputUnitProperty_SetInputCallback,
                                 kAudioUnitScope_Global,
                                 0,
                                 &callbackStruct,
                                 sizeof(callbackStruct));
    if (status != noErr) {
        reportError("Failed to set input callback");
        return false;
    }
    
    // Initialiser l'audio unit
    status = AudioUnitInitialize(audioUnit_);
    if (status != noErr) {
        reportError("Failed to initialize audio unit");
        return false;
    }
    
    return true;
}

OSStatus AudioCaptureIOS::recordingCallback(void* inRefCon,
                                            AudioUnitRenderActionFlags* ioActionFlags,
                                            const AudioTimeStamp* inTimeStamp,
                                            UInt32 inBusNumber,
                                            UInt32 inNumberFrames,
                                            AudioBufferList* ioData) {

    AudioCaptureIOS* capture = static_cast<AudioCaptureIOS*>(inRefCon);

    // Allouer un buffer pour recevoir les données
    AudioBufferList bufferList;
    bufferList.mNumberBuffers = 1;
    bufferList.mBuffers[0].mNumberChannels = capture->config_.channelCount;
    bufferList.mBuffers[0].mDataByteSize = inNumberFrames * capture->config_.channelCount * sizeof(float);

    // Allouer temporairement de la mémoire pour le buffer
    std::vector<float> tempBuffer(inNumberFrames * capture->config_.channelCount);
    bufferList.mBuffers[0].mData = tempBuffer.data();

    // Récupérer les données audio
    OSStatus status = AudioUnitRender(capture->audioUnit_,
                                      ioActionFlags,
                                      inTimeStamp,
                                      inBusNumber,
                                      inNumberFrames,
                                      &bufferList);

    if (status == noErr) {
        // Traiter les données
        capture->processAudioData(static_cast<const float*>(bufferList.mBuffers[0].mData),
                                 bufferList.mBuffers[0].mDataByteSize / sizeof(float));
    }

    return status;
}

OSStatus AudioCaptureIOS::renderNotifyCallback(void* inRefCon, AudioUnitRenderActionFlags* ioActionFlags,
                                               const AudioTimeStamp* inTimeStamp, UInt32 inBusNumber, UInt32 inNumberFrames,
                                               AudioBufferList* ioData) {
    // Callback de notification pour le rendu audio
    // Pour l'instant, on ne fait rien de spécial
    return noErr;
}

// Implémentation des méthodes CircularBuffer
void AudioCaptureIOS::CircularBuffer::write(const float* data, size_t frames) {
    std::lock_guard<std::mutex> lock(mutex);
    for (size_t i = 0; i < frames; ++i) {
        buffer[writePos] = data[i];
        writePos = (writePos + 1) % size;
    }
}

size_t AudioCaptureIOS::CircularBuffer::read(float* data, size_t maxFrames) {
    std::lock_guard<std::mutex> lock(mutex);
    size_t framesRead = 0;
    while (framesRead < maxFrames && readPos != writePos) {
        data[framesRead] = buffer[readPos];
        readPos = (readPos + 1) % size;
        framesRead++;
    }
    return framesRead;
}

size_t AudioCaptureIOS::CircularBuffer::available() const {
    std::lock_guard<std::mutex> lock(mutex);
    if (writePos >= readPos) {
        return writePos - readPos;
    } else {
        return size - readPos + writePos;
    }
}

void AudioCaptureIOS::CircularBuffer::clear() {
    std::lock_guard<std::mutex> lock(mutex);
    writePos = 0;
    readPos = 0;
}



bool AudioCaptureIOS::hasPermission() const {
    AVAudioSession* session = [AVAudioSession sharedInstance];
    AVAudioSessionRecordPermission permission = [session recordPermission];
    return permission == AVAudioSessionRecordPermissionGranted;
}

void AudioCaptureIOS::requestPermission(std::function<void(bool)> callback) {
    AVAudioSession* session = [AVAudioSession sharedInstance];
    [session requestRecordPermission:^(BOOL granted) {
        if (callback) {
            callback(granted);
        }
    }];
}

std::vector<AudioDeviceInfo> AudioCaptureIOS::getAvailableDevices() const {
    std::vector<AudioDeviceInfo> devices;
    
    AVAudioSession* session = [AVAudioSession sharedInstance];
    NSArray<AVAudioSessionPortDescription*>* inputs = [session availableInputs];
    
    for (AVAudioSessionPortDescription* port in inputs) {
        AudioDeviceInfo device;
        device.id = [port.UID UTF8String];
        device.name = [port.portName UTF8String];
        device.isDefault = false;
        device.maxChannels = 2; // Valeur par défaut
        device.supportedSampleRates = {44100, 48000}; // Taux d'échantillonnage courants
        devices.push_back(device);
    }
    
    // Marquer le device actuel comme défaut
    AVAudioSessionPortDescription* currentInput = [session.currentRoute.inputs firstObject];
    if (currentInput) {
        for (auto& device : devices) {
            if (device.id == [currentInput.UID UTF8String]) {
                device.isDefault = true;
                break;
            }
        }
    }
    
    return devices;
}

bool AudioCaptureIOS::selectDevice(const std::string& deviceId) {
    AVAudioSession* session = [AVAudioSession sharedInstance];
    NSArray<AVAudioSessionPortDescription*>* inputs = [session availableInputs];
    
    for (AVAudioSessionPortDescription* port in inputs) {
        if (deviceId == [port.UID UTF8String]) {
            NSError* error = nil;
            [session setPreferredInput:port error:&error];
            return error == nil;
        }
    }
    
    return false;
}

AudioDeviceInfo AudioCaptureIOS::getCurrentDevice() const {
    AudioDeviceInfo device;
    
    AVAudioSession* session = [AVAudioSession sharedInstance];
    AVAudioSessionPortDescription* currentInput = [session.currentRoute.inputs firstObject];
    
    if (currentInput) {
        device.id = [currentInput.UID UTF8String];
        device.name = [currentInput.portName UTF8String];
        device.isDefault = true;
        device.maxChannels = 2; // Valeur par défaut
        device.supportedSampleRates = {44100, 48000}; // Taux d'échantillonnage courants
    }
    
    return device;
}

bool AudioCaptureIOS::updateConfig(const AudioCaptureConfig& config) {
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

// Implémentation des méthodes factory
std::unique_ptr<AudioCapture> AudioCapture::create() {
    AudioCaptureConfig defaultConfig;
    return create(defaultConfig);
}

std::unique_ptr<AudioCapture> AudioCapture::create(const AudioCaptureConfig& config) {
#ifdef __ANDROID__
    auto capture = std::make_unique<AudioCaptureAndroid>();
#elif defined(__APPLE__) && TARGET_OS_IOS
    auto capture = std::make_unique<AudioCaptureIOS>();
#else
    // Fallback pour les plateformes non supportées
    std::unique_ptr<AudioCapture> capture = nullptr;
#endif

    if (capture && capture->initialize(config)) {
        return capture;
    }

    return nullptr;
}



#endif // TARGET_OS_IOS
#endif // __APPLE__

} // namespace capture
} // namespace Audio
