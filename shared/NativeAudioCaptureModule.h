#pragma once

// Includes conditionnels pour la compatibilité
#if defined(__has_include)
  #if __has_include(<NythJSI.h>)
    #include <NythJSI.h>
  #endif
#endif

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>
#include <string>
#include <memory>
#include <functional>
#include <vector>

// Vérification de la disponibilité de TurboModule
#if defined(__has_include) && \
    __has_include(<ReactCommon/TurboModule.h>) && \
    __has_include(<ReactCommon/TurboModuleUtils.h>)
#define NYTH_AUDIO_CAPTURE_ENABLED 1
#else
#define NYTH_AUDIO_CAPTURE_ENABLED 0
#endif

// === API C globale pour la capture audio ===
#ifdef __cplusplus
extern "C" {
#endif

// === État de la capture ===
typedef enum {
    CAPTURE_STATE_UNINITIALIZED = 0,
    CAPTURE_STATE_INITIALIZED,
    CAPTURE_STATE_STARTING,
    CAPTURE_STATE_RUNNING,
    CAPTURE_STATE_PAUSING,
    CAPTURE_STATE_PAUSED,
    CAPTURE_STATE_STOPPING,
    CAPTURE_STATE_STOPPED,
    CAPTURE_STATE_ERROR
} NythCaptureState;

// === Configuration de capture ===
typedef struct {
    int sampleRate;
    int channelCount;
    int bitsPerSample;
    int bufferSizeFrames;
    bool enableEchoCancellation;
    bool enableNoiseSuppression;
    bool enableAutoGainControl;
} NythCaptureConfig;

// === Statistiques de capture ===
typedef struct {
    uint64_t framesProcessed;
    uint64_t bytesProcessed;
    float averageLevel;
    float peakLevel;
    uint32_t overruns;
    uint32_t underruns;
    int64_t durationMs;
} NythCaptureStatistics;

// === API de capture ===
bool NythCapture_Initialize(const NythCaptureConfig* config);
bool NythCapture_Start(void);
bool NythCapture_Stop(void);
bool NythCapture_Pause(void);
bool NythCapture_Resume(void);
void NythCapture_Release(void);

// === État et informations ===
NythCaptureState NythCapture_GetState(void);
bool NythCapture_IsCapturing(void);
void NythCapture_GetStatistics(NythCaptureStatistics* stats);
void NythCapture_ResetStatistics(void);

// === Configuration ===
void NythCapture_GetConfig(NythCaptureConfig* config);
bool NythCapture_UpdateConfig(const NythCaptureConfig* config);

// === Niveaux audio ===
float NythCapture_GetCurrentLevel(void);
float NythCapture_GetPeakLevel(void);
void NythCapture_ResetPeakLevel(void);

// === Permissions ===
bool NythCapture_HasPermission(void);
void NythCapture_RequestPermission(void);

// === Enregistrement ===
bool NythCapture_StartRecording(const char* filePath);
bool NythCapture_StopRecording(void);
bool NythCapture_PauseRecording(void);
bool NythCapture_ResumeRecording(void);
bool NythCapture_IsRecording(void);
float NythCapture_GetRecordingDuration(void);
uint64_t NythCapture_GetRecordingSize(void);

// === Analyse audio ===
float NythCapture_GetRMS(void);
float NythCapture_GetRMSdB(void);
bool NythCapture_IsSilent(float threshold);
bool NythCapture_HasClipping(void);

// === Callbacks (pour usage interne) ===
typedef void (*NythAudioDataCallback)(const float* data, size_t frameCount, int channels);
typedef void (*NythErrorCallback)(const char* error);
typedef void (*NythStateChangeCallback)(NythCaptureState oldState, NythCaptureState newState);

void NythCapture_SetAudioDataCallback(NythAudioDataCallback callback);
void NythCapture_SetErrorCallback(NythErrorCallback callback);
void NythCapture_SetStateChangeCallback(NythStateChangeCallback callback);

#ifdef __cplusplus
}
#endif

// === Interface C++ pour TurboModule ===
#if NYTH_AUDIO_CAPTURE_ENABLED && defined(__cplusplus)

#include <jsi/jsi.h>
#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModuleUtils.h>
#include "Audio/capture/AudioCapture.hpp"
#include "Audio/capture/AudioFileWriter.hpp"
#include <mutex>
#include <atomic>
#include <queue>

namespace facebook {
namespace react {

class JSI_EXPORT NativeAudioCaptureModule : public TurboModule {
public:
    explicit NativeAudioCaptureModule(std::shared_ptr<CallInvoker> jsInvoker);
    ~NativeAudioCaptureModule();
    
    // === Méthodes TurboModule ===
    static constexpr auto kModuleName = "NativeAudioCaptureModule";
    
    // === Méthodes synchrones ===
    
    // Gestion du cycle de vie
    jsi::Value initialize(jsi::Runtime& rt, const jsi::Object& config);
    jsi::Value start(jsi::Runtime& rt);
    jsi::Value stop(jsi::Runtime& rt);
    jsi::Value pause(jsi::Runtime& rt);
    jsi::Value resume(jsi::Runtime& rt);
    jsi::Value release(jsi::Runtime& rt);
    
    // État et informations
    jsi::Value getState(jsi::Runtime& rt);
    jsi::Value isCapturing(jsi::Runtime& rt);
    jsi::Value getStatistics(jsi::Runtime& rt);
    jsi::Value resetStatistics(jsi::Runtime& rt);
    
    // Configuration
    jsi::Value getConfig(jsi::Runtime& rt);
    jsi::Value updateConfig(jsi::Runtime& rt, const jsi::Object& config);
    
    // Niveaux audio
    jsi::Value getCurrentLevel(jsi::Runtime& rt);
    jsi::Value getPeakLevel(jsi::Runtime& rt);
    jsi::Value resetPeakLevel(jsi::Runtime& rt);
    
    // Analyse audio
    jsi::Value getRMS(jsi::Runtime& rt);
    jsi::Value getRMSdB(jsi::Runtime& rt);
    jsi::Value isSilent(jsi::Runtime& rt, double threshold);
    jsi::Value hasClipping(jsi::Runtime& rt);
    
    // Périphériques
    jsi::Value getAvailableDevices(jsi::Runtime& rt);
    jsi::Value selectDevice(jsi::Runtime& rt, const jsi::String& deviceId);
    jsi::Value getCurrentDevice(jsi::Runtime& rt);
    
    // === Méthodes asynchrones (Promises) ===
    
    // Permissions
    jsi::Value hasPermission(jsi::Runtime& rt);
    jsi::Value requestPermission(jsi::Runtime& rt);
    
    // Enregistrement
    jsi::Value startRecording(jsi::Runtime& rt, const jsi::String& filePath, const jsi::Object& options);
    jsi::Value stopRecording(jsi::Runtime& rt);
    jsi::Value pauseRecording(jsi::Runtime& rt);
    jsi::Value resumeRecording(jsi::Runtime& rt);
    jsi::Value isRecording(jsi::Runtime& rt);
    jsi::Value getRecordingInfo(jsi::Runtime& rt);
    
    // === Callbacks JavaScript ===
    
    // Définir le callback pour les données audio
    jsi::Value setAudioDataCallback(jsi::Runtime& rt, const jsi::Function& callback);
    
    // Définir le callback pour les erreurs
    jsi::Value setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback);
    
    // Définir le callback pour les changements d'état
    jsi::Value setStateChangeCallback(jsi::Runtime& rt, const jsi::Function& callback);
    
    // Définir le callback pour l'analyse audio
    jsi::Value setAnalysisCallback(jsi::Runtime& rt, const jsi::Function& callback, double intervalMs);
    
    // === Méthodes utilitaires ===
    
    // Conversion de formats
    jsi::Value convertAudioFormat(jsi::Runtime& rt, const jsi::Object& params);
    
    // Analyse de fichier audio
    jsi::Value analyzeAudioFile(jsi::Runtime& rt, const jsi::String& filePath);
    
    // === Installation du module ===
    static jsi::Value install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker);
    
private:
    // Instance de capture audio
    std::unique_ptr<Nyth::Audio::AudioCapture> capture_;
    std::unique_ptr<Nyth::Audio::AudioRecorder> recorder_;
    
    // Mutex pour la thread safety
    mutable std::mutex captureMutex_;
    mutable std::mutex callbackMutex_;
    
    // Callbacks JavaScript
    struct {
        std::shared_ptr<jsi::Function> audioDataCallback;
        std::shared_ptr<jsi::Function> errorCallback;
        std::shared_ptr<jsi::Function> stateChangeCallback;
        std::shared_ptr<jsi::Function> analysisCallback;
    } jsCallbacks_;
    
    // Thread d'analyse
    std::thread analysisThread_;
    std::atomic<bool> analysisRunning_{false};
    double analysisIntervalMs_ = 100.0;
    
    // Buffer pour les données audio
    std::queue<std::vector<float>> audioDataQueue_;
    std::mutex queueMutex_;
    std::condition_variable queueCV_;
    
    // Configuration actuelle
    Nyth::Audio::AudioCaptureConfig currentConfig_;
    
    // État de l'enregistrement
    std::atomic<bool> isRecordingActive_{false};
    std::string currentRecordingPath_;
    
    // Méthodes privées
    void initializeCapture(const Nyth::Audio::AudioCaptureConfig& config);
    void handleAudioData(const float* data, size_t frameCount, int channels);
    void handleError(const std::string& error);
    void handleStateChange(Nyth::Audio::CaptureState oldState, Nyth::Audio::CaptureState newState);
    void runAnalysisThread();
    void stopAnalysisThread();
    
    // Conversion JSI <-> Native
    Nyth::Audio::AudioCaptureConfig parseConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    jsi::Object configToJS(jsi::Runtime& rt, const Nyth::Audio::AudioCaptureConfig& config);
    jsi::Object statisticsToJS(jsi::Runtime& rt, const Nyth::Audio::CaptureStatistics& stats);
    jsi::Object deviceToJS(jsi::Runtime& rt, const Nyth::Audio::AudioDeviceInfo& device);
    jsi::Array devicesToJS(jsi::Runtime& rt, const std::vector<Nyth::Audio::AudioDeviceInfo>& devices);
    
    // Invocation de callbacks JS sur le thread principal
    void invokeJSCallback(const std::string& callbackName, std::function<void(jsi::Runtime&)> invocation);
};

// === Fonction d'enregistrement du module ===
JSI_EXPORT std::shared_ptr<TurboModule> NativeAudioCaptureModuleProvider(
    std::shared_ptr<CallInvoker> jsInvoker);

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_CAPTURE_ENABLED && __cplusplus