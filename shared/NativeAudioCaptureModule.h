#pragma once

// Includes conditionnels pour la compatibilité
#if defined(__has_include)
#if __has_include(<NythJSI.h>)
#include <NythJSI.h>
#endif
#endif

// Vérification de la disponibilité de TurboModule
#if defined(__has_include) && __has_include(<ReactCommon/TurboModule.h>) && \
    __has_include(<ReactCommon/TurboModuleUtils.h>)
#define NYTH_AUDIO_CAPTURE_ENABLED 1
#else
#define NYTH_AUDIO_CAPTURE_ENABLED 0
#endif

// === Interface C++ pour TurboModule ===
#if NYTH_AUDIO_CAPTURE_ENABLED && defined(__cplusplus)

// Includes C++ nécessaires pour TurboModule
#include <functional>
#include <limits>
#include <memory>
#include <string>
#include <vector>

#include "Audio/capture/AudioCapture.hpp"
#include "Audio/capture/AudioFileWriter.hpp"
#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModuleUtils.h>
#include <atomic>
#include <jsi/jsi.h>
#include <mutex>
#include <queue>

// === Constantes de limites pour la sécurité ===
namespace AudioLimits {
// Limites de buffer
constexpr size_t MAX_BUFFER_SIZE = 1024 * 1024; // 1MB max pour éviter les allocations excessives
constexpr size_t MAX_ARRAY_LENGTH = 100000;     // Limite pour les tableaux JSI

// Limites de configuration audio
constexpr int MIN_SAMPLE_RATE = 8000;   // Minimum supporté
constexpr int MAX_SAMPLE_RATE = 192000; // Maximum supporté
constexpr int MIN_CHANNELS = 1;         // Mono minimum
constexpr int MAX_CHANNELS = 8;         // 8 canaux maximum
constexpr int MIN_BITS_PER_SAMPLE = 8;
constexpr int MAX_BITS_PER_SAMPLE = 32;
constexpr int MIN_BUFFER_SIZE_FRAMES = 64;
constexpr int MAX_BUFFER_SIZE_FRAMES = 8192;

// Limites de niveau audio
constexpr float MIN_THRESHOLD = 0.0f;
constexpr float MAX_THRESHOLD = 1.0f;

// Limites temporelles
constexpr double MAX_ANALYSIS_INTERVAL_MS = 10000.0; // 10 secondes max
constexpr double MIN_ANALYSIS_INTERVAL_MS = 10.0;    // 10ms minimum
} // namespace AudioLimits

// === Classe de validation JSI ===
class JSIValidator {
public:
    // Validation de types basiques
    static void validateNumber(jsi::Runtime& rt, const jsi::Value& val, const std::string& name) {
        if (!val.isNumber()) {
            throw jsi::JSError(rt, name + " must be a number");
        }
    }

    static void validateString(jsi::Runtime& rt, const jsi::Value& val, const std::string& name) {
        if (!val.isString()) {
            throw jsi::JSError(rt, name + " must be a string");
        }
    }

    static void validateBool(jsi::Runtime& rt, const jsi::Value& val, const std::string& name) {
        if (!val.isBool()) {
            throw jsi::JSError(rt, name + " must be a boolean");
        }
    }

    static void validateObject(jsi::Runtime& rt, const jsi::Value& val, const std::string& name) {
        if (!val.isObject()) {
            throw jsi::JSError(rt, name + " must be an object");
        }
    }

    static void validateArray(jsi::Runtime& rt, const jsi::Value& val, const std::string& name) {
        if (!val.isObject() || !val.asObject(rt).isArray(rt)) {
            throw jsi::JSError(rt, name + " must be an array");
        }
    }

    static void validateFunction(jsi::Runtime& rt, const jsi::Value& val, const std::string& name) {
        if (!val.isObject() || !val.asObject(rt).isFunction(rt)) {
            throw jsi::JSError(rt, name + " must be a function");
        }
    }

    // Validation avec plages
    static double validateNumberInRange(jsi::Runtime& rt, const jsi::Value& val, const std::string& name, double min,
                                        double max) {
        validateNumber(rt, val, name);
        double value = val.asNumber();
        if (value < min || value > max) {
            throw jsi::JSError(rt, name + " must be between " + std::to_string(min) + " and " + std::to_string(max));
        }
        return value;
    }

    // Validation de taille de tableau
    static size_t validateArraySize(jsi::Runtime& rt, const jsi::Array& array, const std::string& name,
                                    size_t maxSize) {
        size_t length = array.length(rt);
        if (length > maxSize) {
            throw jsi::JSError(rt, name + " array is too large (max: " + std::to_string(maxSize) + ")");
        }
        return length;
    }

    // Validation de propriété optionnelle
    template <typename T>
    static bool getOptionalProperty(jsi::Runtime& rt, const jsi::Object& obj, const std::string& propName, T& value,
                                    std::function<T(jsi::Runtime&, const jsi::Value&)> converter) {
        if (obj.hasProperty(rt, propName.c_str())) {
            auto prop = obj.getProperty(rt, propName.c_str());
            value = converter(rt, prop);
            return true;
        }
        return false;
    }
};

// Forward declarations for namespaces
namespace Audio {
namespace capture {
struct AudioCaptureConfig;
enum class CaptureState;
struct CaptureStatistics;
struct AudioDeviceInfo;
} // namespace capture
} // namespace Audio

namespace facebook {
namespace react {

class JSI_EXPORT NativeAudioCaptureModule : public TurboModule {
public:
    explicit NativeAudioCaptureModule(std::shared_ptr<CallInvoker> jsInvoker)
        : TurboModule("NativeAudioCaptureModule", jsInvoker) {
        // Configuration par défaut avec valeurs sûres
        currentConfig_.sampleRate = 44100;
        currentConfig_.channelCount = 1;
        currentConfig_.bitsPerSample = 16;
        currentConfig_.bufferSizeFrames = 1024;
    }
    ~NativeAudioCaptureModule() override;

    // === Méthodes TurboModule ===
    static constexpr auto kModuleName = "NativeAudioCaptureModule";

    // === Méthodes synchrones ===

    // Gestion du cycle de vie
    jsi::Value initialize(jsi::Runtime& rt, const jsi::Object& config);
    jsi::Value start(jsi::Runtime& rt);
    jsi::Value stop(jsi::Runtime& rt);
    jsi::Value pause(jsi::Runtime& rt);
    jsi::Value resume(jsi::Runtime& rt);
    jsi::Value dispose(jsi::Runtime& rt);

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
    std::shared_ptr<Audio::capture::AudioCapture> capture_;
    std::unique_ptr<Nyth::Audio::AudioRecorder> recorder_;

    // Mutex pour la thread safety
    mutable std::mutex captureMutex_;
    mutable std::mutex callbackMutex_;

    // Callbacks JavaScript avec protection
    struct JSCallbacks {
        std::shared_ptr<jsi::Function> audioDataCallback;
        std::shared_ptr<jsi::Function> errorCallback;
        std::shared_ptr<jsi::Function> stateChangeCallback;
        std::shared_ptr<jsi::Function> analysisCallback;

        // Méthode pour nettoyer tous les callbacks
        void clear() {
            audioDataCallback.reset();
            errorCallback.reset();
            stateChangeCallback.reset();
            analysisCallback.reset();
        }
    } jsCallbacks_;

    // Runtime pour les callbacks (avec protection)
    jsi::Runtime* runtime_ = nullptr;
    std::atomic<bool> isRuntimeValid_{false};

    // Thread d'analyse
    std::thread analysisThread_;
    std::atomic<bool> analysisRunning_{false};
    double analysisIntervalMs_ = 100.0;

    // Buffer pour les données audio
    std::queue<std::vector<float>> audioDataQueue_;
    std::mutex queueMutex_;
    std::condition_variable queueCV_;

    // Configuration actuelle
    Audio::capture::AudioCaptureConfig currentConfig_;

    // État de l'enregistrement
    std::atomic<bool> isRecordingActive_{false};
    std::string currentRecordingPath_;

    // Méthodes privées améliorées
    void initializeCapture(const Audio::capture::AudioCaptureConfig& config);
    void handleAudioData(const float* data, size_t frameCount, int channels);
    void handleError(const std::string& error);
    void handleStateChange(Audio::capture::CaptureState oldState, Audio::capture::CaptureState newState);
    void runAnalysisThread();
    void stopAnalysisThread();

    // Méthode pour nettoyer les ressources
    void cleanup();

    // Validation et conversion sécurisées
    Audio::capture::AudioCaptureConfig parseConfigSafe(jsi::Runtime& rt, const jsi::Object& jsConfig);
    void validateAudioConfig(const Audio::capture::AudioCaptureConfig& config);

    // Conversion JSI <-> Native
    Audio::capture::AudioCaptureConfig parseConfig(jsi::Runtime& rt, const jsi::Object& jsConfig);
    jsi::Object configToJS(jsi::Runtime& rt, const Audio::capture::AudioCaptureConfig& config);
    jsi::Object statisticsToJS(jsi::Runtime& rt, const Audio::capture::CaptureStatistics& stats);
    jsi::Object deviceToJS(jsi::Runtime& rt, const Audio::capture::AudioDeviceInfo& device);
    jsi::Array devicesToJS(jsi::Runtime& rt, const std::vector<Audio::capture::AudioDeviceInfo>& devices);

    // Invocation de callbacks JS sur le thread principal
    void invokeJSCallback(const std::string& callbackName, std::function<void(jsi::Runtime&)> invocation);
};

// === Fonction d'enregistrement du module ===
JSI_EXPORT std::shared_ptr<TurboModule> NativeAudioCaptureModuleProvider(std::shared_ptr<CallInvoker> jsInvoker);

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_CAPTURE_ENABLED && __cplusplus
