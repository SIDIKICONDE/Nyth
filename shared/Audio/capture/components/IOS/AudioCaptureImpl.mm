#include "AudioCaptureImpl.hpp"
#include <cstring>

namespace Audio {
namespace capture {

// Note: L'implémentation Android est dans AudioCaptureImpl.cpp
// Ce fichier ne contient que l'implémentation iOS

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

AudioCaptureIOS::~AudioCaptureIOS() { release(); }

void AudioCaptureIOS::teardownAudioUnit() {
  if (audioUnit_) {
    AudioComponentInstanceDispose(audioUnit_);
    audioUnit_ = nullptr;
  }
}

void AudioCaptureIOS::processingThreadFunc() {
  // Le traitement est maintenant fait directement dans le callback Audio Unit
  // Cette méthode pourrait être utilisée pour un traitement supplémentaire si
  // nécessaire
}

void AudioCaptureIOS::handleInterruption(NSNotification *notification) {
  // Gestion des interruptions (appels entrants, etc.)
  NSDictionary *userInfo = notification.userInfo;
  AVAudioSessionInterruptionType interruptionType =
      (AVAudioSessionInterruptionType)
          [userInfo[AVAudioSessionInterruptionTypeKey] integerValue];

  if (interruptionType == AVAudioSessionInterruptionTypeBegan) {
    // Interruption commencée - arrêter la capture
    stop();
  } else if (interruptionType == AVAudioSessionInterruptionTypeEnded) {
    // Interruption terminée - redémarrer si possible
    AVAudioSessionInterruptionOptions options =
        (AVAudioSessionInterruptionOptions)
            [userInfo[AVAudioSessionInterruptionOptionKey] integerValue];
    if (options == AVAudioSessionInterruptionOptionShouldResume) {
      // Redémarrer la capture
      initialize(config_);
    }
  }
}

void AudioCaptureIOS::handleRouteChange(NSNotification *notification) {
  // Gestion des changements de route audio (changement de périphérique)
  // Pour l'instant, on ne fait rien de spécial
}

bool AudioCaptureIOS::initialize(const AudioCaptureConfig &config) {
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
  AVAudioSession *session = [AVAudioSession sharedInstance];
  NSError *error = nil;

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

  status = AudioUnitSetProperty(audioUnit_, kAudioOutputUnitProperty_EnableIO,
                                kAudioUnitScope_Input,
                                1, // input bus
                                &enableInput, sizeof(enableInput));
  if (status != noErr) {
    reportError("Failed to enable input");
    return false;
  }

  status = AudioUnitSetProperty(audioUnit_, kAudioOutputUnitProperty_EnableIO,
                                kAudioUnitScope_Output,
                                0, // output bus
                                &disableOutput, sizeof(disableOutput));
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

  status = AudioUnitSetProperty(audioUnit_, kAudioUnitProperty_StreamFormat,
                                kAudioUnitScope_Output,
                                1, // input bus
                                &format, sizeof(format));
  if (status != noErr) {
    reportError("Failed to set stream format");
    return false;
  }

  // Configurer le callback
  AURenderCallbackStruct callbackStruct;
  callbackStruct.inputProc = recordingCallback;
  callbackStruct.inputProcRefCon = this;

  status = AudioUnitSetProperty(
      audioUnit_, kAudioOutputUnitProperty_SetInputCallback,
      kAudioUnitScope_Global, 0, &callbackStruct, sizeof(callbackStruct));
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

OSStatus AudioCaptureIOS::recordingCallback(
    void *inRefCon, AudioUnitRenderActionFlags *ioActionFlags,
    const AudioTimeStamp *inTimeStamp, UInt32 inBusNumber,
    UInt32 inNumberFrames, AudioBufferList *ioData) {

  AudioCaptureIOS *capture = static_cast<AudioCaptureIOS *>(inRefCon);

  // Allouer un buffer pour recevoir les données
  AudioBufferList bufferList;
  bufferList.mNumberBuffers = 1;
  bufferList.mBuffers[0].mNumberChannels = capture->config_.channelCount;
  bufferList.mBuffers[0].mDataByteSize =
      inNumberFrames * capture->config_.channelCount * sizeof(float);

  // Allouer temporairement de la mémoire pour le buffer
  std::vector<float> tempBuffer(inNumberFrames * capture->config_.channelCount);
  bufferList.mBuffers[0].mData = tempBuffer.data();

  // Récupérer les données audio
  OSStatus status =
      AudioUnitRender(capture->audioUnit_, ioActionFlags, inTimeStamp,
                      inBusNumber, inNumberFrames, &bufferList);

  if (status == noErr) {
    // Traiter les données
    capture->processAudioData(
        static_cast<const float *>(bufferList.mBuffers[0].mData),
        bufferList.mBuffers[0].mDataByteSize / sizeof(float));
  }

  return status;
}

OSStatus AudioCaptureIOS::renderNotifyCallback(
    void *inRefCon, AudioUnitRenderActionFlags *ioActionFlags,
    const AudioTimeStamp *inTimeStamp, UInt32 inBusNumber,
    UInt32 inNumberFrames, AudioBufferList *ioData) {
  // Callback de notification pour le rendu audio
  // Pour l'instant, on ne fait rien de spécial
  return noErr;
}

// Implémentation des méthodes CircularBuffer
void AudioCaptureIOS::CircularBuffer::write(const float *data, size_t frames) {
  std::lock_guard<std::mutex> lock(mutex);
  for (size_t i = 0; i < frames; ++i) {
    buffer[writePos] = data[i];
    writePos = (writePos + 1) % size;
  }
}

size_t AudioCaptureIOS::CircularBuffer::read(float *data, size_t maxFrames) {
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
  AVAudioSession *session = [AVAudioSession sharedInstance];
  AVAudioSessionRecordPermission permission = [session recordPermission];
  return permission == AVAudioSessionRecordPermissionGranted;
}

void AudioCaptureIOS::requestPermission(std::function<void(bool)> callback) {
  AVAudioSession *session = [AVAudioSession sharedInstance];
  [session requestRecordPermission:^(BOOL granted) {
    if (callback) {
      callback(granted);
    }
  }];
}

std::vector<AudioDeviceInfo> AudioCaptureIOS::getAvailableDevices() const {
  std::vector<AudioDeviceInfo> devices;

  AVAudioSession *session = [AVAudioSession sharedInstance];
  NSArray<AVAudioSessionPortDescription *> *inputs = [session availableInputs];

  for (AVAudioSessionPortDescription *port in inputs) {
    AudioDeviceInfo device;
    device.id = [port.UID UTF8String];
    device.name = [port.portName UTF8String];
    device.isDefault = false;
    device.maxChannels = 2; // Valeur par défaut
    device.supportedSampleRates = {44100,
                                   48000}; // Taux d'échantillonnage courants
    devices.push_back(device);
  }

  // Marquer le device actuel comme défaut
  AVAudioSessionPortDescription *currentInput =
      [session.currentRoute.inputs firstObject];
  if (currentInput) {
    for (auto &device : devices) {
      if (device.id == [currentInput.UID UTF8String]) {
        device.isDefault = true;
        break;
      }
    }
  }

  return devices;
}

bool AudioCaptureIOS::selectDevice(const std::string &deviceId) {
  AVAudioSession *session = [AVAudioSession sharedInstance];
  NSArray<AVAudioSessionPortDescription *> *inputs = [session availableInputs];

  for (AVAudioSessionPortDescription *port in inputs) {
    if (deviceId == [port.UID UTF8String]) {
      NSError *error = nil;
      [session setPreferredInput:port error:&error];
      return error == nil;
    }
  }

  return false;
}

AudioDeviceInfo AudioCaptureIOS::getCurrentDevice() const {
  AudioDeviceInfo device;

  AVAudioSession *session = [AVAudioSession sharedInstance];
  AVAudioSessionPortDescription *currentInput =
      [session.currentRoute.inputs firstObject];

  if (currentInput) {
    device.id = [currentInput.UID UTF8String];
    device.name = [currentInput.portName UTF8String];
    device.isDefault = true;
    device.maxChannels = 2; // Valeur par défaut
    device.supportedSampleRates = {44100,
                                   48000}; // Taux d'échantillonnage courants
  }

  return device;
}

bool AudioCaptureIOS::updateConfig(const AudioCaptureConfig &config) {
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

std::unique_ptr<AudioCapture>
AudioCapture::create(const AudioCaptureConfig &config) {
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
