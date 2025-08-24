# 🛠️ Guide de développement - Audio Capture Module

## 📋 **Table des matières**

- [Architecture détaillée](#architecture-détaillée)
- [Implémentation par plateforme](#implémentation-par-plateforme)
- [Thread safety](#thread-safety)
- [Gestion mémoire](#gestion-mémoire)
- [Debug et monitoring](#debug-et-monitoring)
- [Tests](#tests)
- [Performance](#performance)

---

## 🏗️ **Architecture détaillée**

### **Classes principales**

#### **AudioCapture (Interface abstraite)**

```cpp
class AudioCapture {
public:
    virtual ~AudioCapture() = default;

    // Cycle de vie
    virtual bool initialize(const AudioCaptureConfig& config) = 0;
    virtual bool start() = 0;
    virtual bool stop() = 0;
    virtual bool pause() = 0;
    virtual bool resume() = 0;
    virtual void release() = 0;

    // Configuration
    virtual bool updateConfig(const AudioCaptureConfig& config) = 0;
    virtual AudioCaptureConfig getConfig() const = 0;

    // Callbacks
    virtual void setAudioDataCallback(AudioDataCallback callback) = 0;
    virtual void setErrorCallback(ErrorCallback callback) = 0;
    virtual void setStateChangeCallback(StateChangeCallback callback) = 0;

    // État
    virtual CaptureState getState() const = 0;
    virtual bool isCapturing() const = 0;
    virtual CaptureStatistics getStatistics() const = 0;

    // Périphériques
    virtual std::vector<AudioDeviceInfo> getAvailableDevices() const = 0;
    virtual bool selectDevice(const std::string& deviceId) = 0;
    virtual AudioDeviceInfo getCurrentDevice() const = 0;

    // Permissions
    virtual bool hasPermission() const = 0;
    virtual void requestPermission(std::function<void(bool)> callback) = 0;

    // Niveaux
    virtual float getCurrentLevel() const = 0;
    virtual float getPeakLevel() const = 0;
    virtual void resetPeakLevel() = 0;
};
```

#### **AudioCaptureBase (Implémentation commune)**

```cpp
class AudioCaptureBase : public AudioCapture {
protected:
    AudioCaptureConfig config_;
    std::atomic<CaptureState> state_{CaptureState::Uninitialized};
    CaptureStatistics statistics_;

    // Callbacks
    AudioDataCallback dataCallback_;
    ErrorCallback errorCallback_;
    StateChangeCallback stateChangeCallback_;

    // Niveaux atomiques
    std::atomic<float> currentLevel_{0.0f};
    std::atomic<float> peakLevel_{0.0f};

    // Méthodes utilitaires
    void setState(CaptureState newState);
    void reportError(const std::string& error);
    void processAudioData(const float* data, size_t frameCount);
    void updateLevels(const float* data, size_t sampleCount);
};
```

#### **Implémentations spécifiques**

- **`AudioCaptureAndroid`** - Hérite de `AudioCaptureBase`
- **`AudioCaptureIOS`** - Hérite de `AudioCaptureBase`

---

## 📱 **Implémentation par plateforme**

### **Android - Architecture multi-backend**

#### **Stratégie de fallback**

```cpp
bool AudioCaptureAndroid::initialize(const AudioCaptureConfig& config) {
    // 1. Essayer Oboe (recommandé)
    if (initializeOboe()) {
        setState(CaptureState::Initialized);
        return true;
    }

    // 2. Fallback AAudio (Android 8.0+)
    if (initializeAAudio()) {
        setState(CaptureState::Initialized);
        return true;
    }

    // 3. Fallback OpenSL ES (legacy)
    if (initializeOpenSL()) {
        setState(CaptureState::Initialized);
        return true;
    }

    return false;
}
```

#### **Oboe Implementation**

```cpp
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
```

#### **AAudio Implementation**

```cpp
bool AudioCaptureAndroid::initializeAAudio() {
    if (__builtin_available(android 26, *)) {
        AAudioStreamBuilder* builder;
        AAudio_createStreamBuilder(&builder);

        AAudioStreamBuilder_setDirection(builder, AAUDIO_DIRECTION_INPUT);
        AAudioStreamBuilder_setSampleRate(builder, config_.sampleRate);
        AAudioStreamBuilder_setFormat(builder, AAUDIO_FORMAT_PCM_FLOAT);
        AAudioStreamBuilder_setPerformanceMode(builder, AAUDIO_PERFORMANCE_MODE_LOW_LATENCY);
        AAudioStreamBuilder_setDataCallback(builder, aaudioDataCallback, this);

        AAudioStreamBuilder_openStream(builder, &aaudio_.stream);
        AAudioStreamBuilder_delete(builder);

        return aaudio_.stream != nullptr;
    }
    return false;
}
```

### **iOS - Audio Units**

#### **Setup Audio Session**

```cpp
bool AudioCaptureIOS::setupAudioSession() {
    AVAudioSession* session = [AVAudioSession sharedInstance];
    NSError* error = nil;

    // Configuration pour enregistrement
    [session setCategory:AVAudioSessionCategoryRecord error:&error];
    [session setPreferredSampleRate:config_.sampleRate error:&error];
    [session setActive:YES error:&error];

    return error == nil;
}
```

#### **Setup Audio Unit**

```cpp
bool AudioCaptureIOS::setupAudioUnit() {
    AudioComponentDescription desc;
    desc.componentType = kAudioUnitType_Output;
    desc.componentSubType = kAudioUnitSubType_RemoteIO;

    AudioComponent component = AudioComponentFindNext(nullptr, &desc);
    AudioComponentInstanceNew(component, &audioUnit_);

    // Configuration entrée/sortie
    UInt32 enableInput = 1, disableOutput = 0;
    AudioUnitSetProperty(audioUnit_,
                         kAudioOutputUnitProperty_EnableIO,
                         kAudioUnitScope_Input, 1, &enableInput, sizeof(enableInput));
    AudioUnitSetProperty(audioUnit_,
                         kAudioOutputUnitProperty_EnableIO,
                         kAudioUnitScope_Output, 0, &disableOutput, sizeof(disableOutput));

    // Format audio
    AudioStreamBasicDescription format;
    format.mSampleRate = config_.sampleRate;
    format.mFormatID = kAudioFormatLinearPCM;
    format.mChannelsPerFrame = config_.channelCount;
    format.mBitsPerChannel = 32;

    AudioUnitSetProperty(audioUnit_,
                         kAudioUnitProperty_StreamFormat,
                         kAudioUnitScope_Output, 1, &format, sizeof(format));

    return true;
}
```

---

## 🔒 **Thread Safety**

### **Design Thread-Safe**

#### **Variables atomiques**

```cpp
class AudioCaptureBase {
protected:
    std::atomic<CaptureState> state_{CaptureState::Uninitialized};
    std::atomic<float> currentLevel_{0.0f};
    std::atomic<float> peakLevel_{0.0f};
};
```

#### **Mutex pour structures complexes**

```cpp
class AudioCaptureIOS::CircularBuffer {
    std::vector<float> buffer;
    size_t writePos = 0, readPos = 0;
    size_t size = 0;
    mutable std::mutex mutex;
};
```

### **JSICallbackManager - Thread Safety**

```cpp
class JSICallbackManager {
private:
    std::mutex callbackMutex_;
    std::queue<CallbackData> callbackQueue_;
    std::condition_variable callbackCV_;
    std::atomic<bool> isProcessing_{false};

public:
    void enqueueCallback(const std::string& type, const jsi::Value& data) {
        std::lock_guard<std::mutex> lock(callbackMutex_);
        callbackQueue_.push({type, data});
        callbackCV_.notify_one();
    }
};
```

---

## 💾 **Gestion mémoire**

### **RAII Pattern**

```cpp
class AudioCaptureAndroid {
private:
    std::shared_ptr<oboe::AudioStream> oboeStream_;
    std::unique_ptr<OboeCallback> oboeCallback_;

    struct OpenSLContext {
        SLObjectItf engineObject = nullptr;
        SLObjectItf recorderObject = nullptr;
        std::vector<int16_t> buffers[3];
    } opensl_;

public:
    ~AudioCaptureAndroid() {
        release(); // Nettoyage automatique
    }
};
```

### **Memory Pool pour buffers**

```cpp
class AudioBufferPool {
private:
    std::vector<std::unique_ptr<AudioBuffer>> pool_;
    std::mutex poolMutex_;

public:
    std::unique_ptr<AudioBuffer> acquire() {
        std::lock_guard<std::mutex> lock(poolMutex_);
        if (!pool_.empty()) {
            auto buffer = std::move(pool_.back());
            pool_.pop_back();
            return buffer;
        }
        return std::make_unique<AudioBuffer>();
    }

    void release(std::unique_ptr<AudioBuffer> buffer) {
        std::lock_guard<std::mutex> lock(poolMutex_);
        pool_.push_back(std::move(buffer));
    }
};
```

---

## 🔍 **Debug et monitoring**

### **Logging système**

```cpp
#define AUDIO_LOG_DEBUG(...) \
    if (config_.enableDebugLogging) { \
        std::fprintf(stderr, "[AUDIO_DEBUG] " __VA_ARGS__); \
    }

#define AUDIO_LOG_ERROR(...) \
    std::fprintf(stderr, "[AUDIO_ERROR] " __VA_ARGS__);
```

### **Métriques temps réel**

```cpp
struct CaptureStatistics {
    uint64_t framesProcessed = 0;
    uint64_t bytesProcessed = 0;
    std::chrono::milliseconds totalDuration{0};
    float averageLevel = 0.0f;
    float peakLevel = 0.0f;
    uint32_t overruns = 0;
    uint32_t underruns = 0;
};
```

### **Performance monitoring**

```cpp
class AudioCaptureMetrics {
private:
    std::chrono::steady_clock::time_point captureStart_;
    uint64_t callbackCount_ = 0;
    double totalCallbackTime_ = 0.0;

public:
    void startCallback() {
        callbackStart_ = std::chrono::steady_clock::now();
    }

    void endCallback() {
        auto end = std::chrono::steady_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(
            end - callbackStart_).count();
        totalCallbackTime_ += duration / 1000.0; // ms
        callbackCount_++;
    }

    double getAverageCallbackTime() const {
        return callbackCount_ > 0 ? totalCallbackTime_ / callbackCount_ : 0.0;
    }
};
```

---

## 🧪 **Tests**

### **Structure des tests**

```
__tests__/
├── AudioScreen/
│   ├── AudioScreen.integration.test.tsx
│   ├── components/
│   │   ├── [tests composants]
│   └── coverage/
├── audio/
│   ├── AudioTestSuite.cpp
│   ├── CMakeLists.txt
│   └── [tests natifs]
```

### **Tests unitaires C++**

```cpp
// Test configuration
TEST(AudioConfigTest, ValidConfiguration) {
    Nyth::Audio::AudioConfig config;
    config.sampleRate = 44100;
    config.channelCount = 2;

    EXPECT_TRUE(config.isValid());
    EXPECT_TRUE(config.getValidationError().empty());
}

// Test capture Android
TEST(AudioCaptureAndroidTest, Initialization) {
    AudioCaptureAndroid capture;

    AudioCaptureConfig config;
    config.sampleRate = 44100;
    config.channelCount = 1;

    EXPECT_TRUE(capture.initialize(config));
    EXPECT_EQ(capture.getState(), CaptureState::Initialized);
}
```

### **Tests d'intégration**

```cpp
// Test JSI
TEST(JSITest, CallbackManager) {
    auto jsInvoker = std::make_shared<JSIInvoker>();
    auto callbackManager = std::make_shared<JSICallbackManager>(jsInvoker);

    bool callbackCalled = false;
    callbackManager->setAudioDataCallback([&](const float* data, size_t frames) {
        callbackCalled = true;
    });

    // Simuler réception de données
    callbackManager->processAudioData(testData.data(), testData.size());

    EXPECT_TRUE(callbackCalled);
}
```

---

## ⚡ **Performance**

### **Optimisations SIMD**

```cpp
// AudioCaptureSIMD.hpp
class AudioCaptureSIMD {
public:
    static void processAudioData(float* data, size_t frameCount, int channels) {
    #ifdef __ARM_NEON
        // NEON optimizations pour ARM
        processNEON(data, frameCount * channels);
    #elif defined(__AVX2__)
        // AVX2 optimizations pour x86
        processAVX2(data, frameCount * channels);
    #else
        // Fallback standard
        processStandard(data, frameCount * channels);
    #endif
    }

private:
    static void processNEON(float* data, size_t sampleCount);
    static void processAVX2(float* data, size_t sampleCount);
    static void processStandard(float* data, size_t sampleCount);
};
```

### **Triple buffering**

```cpp
class AudioCaptureAndroid {
private:
    struct OpenSLContext {
        std::vector<int16_t> buffers[3]; // 3 buffers
        int currentBuffer = 0;
    } opensl_;

    void openSLRecorderCallback(SLAndroidSimpleBufferQueueItf bq, void* context) {
        AudioCaptureAndroid* capture = static_cast<AudioCaptureAndroid*>(context);

        // Traiter buffer actuel
        int current = capture->opensl_.currentBuffer;
        capture->processAudioData(capture->opensl_.buffers[current].data(),
                                capture->opensl_.buffers[current].size());

        // Passer au suivant
        capture->opensl_.currentBuffer = (current + 1) % 3;

        // Ré-enqueue le buffer
        (*bq)->Enqueue(bq, capture->opensl_.buffers[capture->opensl_.currentBuffer].data(),
                       capture->opensl_.buffers[capture->opensl_.currentBuffer].size() * sizeof(int16_t));
    }
};
```

### **Low latency configuration**

```cpp
// Configuration Android
oboe::AudioStreamBuilder builder;
builder.setDirection(oboe::Direction::Input)
        ->setPerformanceMode(oboe::PerformanceMode::LowLatency)
        ->setSharingMode(oboe::SharingMode::Exclusive)
        ->setFormat(oboe::AudioFormat::Float)
        ->setSampleRate(config_.sampleRate)
        ->setChannelCount(config_.channelCount)
        ->setFramesPerDataCallback(config_.bufferSizeFrames)
        ->setDataCallback(oboeCallback_.get())
        ->setErrorCallback(oboeCallback_.get());
```

---

## 🚨 **Gestion d'erreurs**

### **Types d'erreurs**

```cpp
enum class AudioError {
    // Erreurs de configuration
    INVALID_CONFIG,
    UNSUPPORTED_SAMPLE_RATE,
    UNSUPPORTED_CHANNEL_COUNT,
    UNSUPPORTED_FORMAT,

    // Erreurs de permissions
    PERMISSION_DENIED,
    PERMISSION_REQUEST_FAILED,

    // Erreurs système
    DEVICE_NOT_FOUND,
    DEVICE_BUSY,
    OUT_OF_MEMORY,
    SYSTEM_ERROR,

    // Erreurs de capture
    BUFFER_OVERFLOW,
    BUFFER_UNDERFLOW,
    STREAM_DISCONNECTED,
    TIMEOUT
};
```

### **Error handling pattern**

```cpp
bool AudioCaptureAndroid::start() {
    try {
        if (state_ != CaptureState::Initialized) {
            reportError("Cannot start: invalid state");
            return false;
        }

        setState(CaptureState::Starting);

        // Démarrage selon backend
        if (oboeStream_) {
            auto result = oboeStream_->requestStart();
            if (result != oboe::Result::OK) {
                throw AudioException(AudioError::STREAM_START_FAILED,
                                    "Failed to start Oboe stream: " + oboe::convertToText(result));
            }
        }

        setState(CaptureState::Running);
        return true;

    } catch (const AudioException& e) {
        setState(CaptureState::Error);
        reportError(e.what());
        return false;
    } catch (const std::exception& e) {
        setState(CaptureState::Error);
        reportError("Unexpected error: " + std::string(e.what()));
        return false;
    }
}
```

---

## 📊 **Benchmarks**

### **Performance attendue**

| Configuration     | Latence | CPU Usage | Memory |
| ----------------- | ------- | --------- | ------ |
| Android (Oboe)    | <10ms   | <5%       | <50MB  |
| Android (AAudio)  | <15ms   | <8%       | <60MB  |
| Android (OpenSL)  | <25ms   | <15%      | <80MB  |
| iOS (Audio Units) | <8ms    | <4%       | <45MB  |

### **Optimisations recommandées**

1. **Utiliser le sample rate natif** du device
2. **Activer SIMD** si disponible
3. **Triple buffering** pour éviter les glitches
4. **Memory pool** pour les allocations fréquentes
5. **Thread priorities** appropriées

---

## 🔧 **Checklist développement**

### **Avant commit**

- [ ] Code compilé sans warnings
- [ ] Tests unitaires passent
- [ ] Documentation mise à jour
- [ ] Thread safety vérifiée
- [ ] Memory leaks vérifiés
- [ ] Performance testée

### **Pour nouvelles features**

- [ ] Interface définie dans `AudioCapture.hpp`
- [ ] Implémentation Android et iOS
- [ ] Tests unitaires
- [ ] Documentation technique
- [ ] Exemples d'utilisation
- [ ] Gestion d'erreurs

---

## 📚 **Ressources**

- [Oboe Documentation](https://github.com/google/oboe)
- [AAudio Guide](https://developer.android.com/ndk/guides/audio/aaudio)
- [iOS Audio Programming Guide](https://developer.apple.com/library/archive/documentation/Audio/Conceptual/AudioSessionProgrammingGuide/)
- [React Native TurboModule](https://reactnative.dev/docs/turbomodule)

_Guide mis à jour : Décembre 2024_
