#pragma once

#include "capture/AudioCapture.hpp"

#include "capture/AudioFileWriter.hpp"
#include "core/AudioEqualizer.hpp"

#include "effects/EffectChain.hpp"
#include "effects/EffectBase.hpp"
#include "fft/FFTEngine.hpp"
#include "noise/NoiseReducer.hpp"
#include "safety/AudioSafety.hpp"
#include "utils/AudioBuffer.hpp"

#include <atomic>
#include <functional>
#include <memory>
#include <vector>


namespace Nyth {
namespace Audio {

// ============================================================================
// Pipeline audio complet intégrant tous les modules
// ============================================================================

class AudioPipeline {
public:
    // Configuration du pipeline
    struct Config {
        ::Audio::capture::AudioCaptureConfig captureConfig;

        // Activation des modules
        bool enableEqualizer = false;
        bool enableNoiseReduction = false;
        bool enableEffects = false;
        bool enableSafetyLimiter = true;
        bool enableFFTAnalysis = false;

        // Configuration des modules
        float safetyLimiterThreshold = 0.95f;
        float noiseReductionStrength = 0.5f;
    };

    // Callback pour les données traitées
    using ProcessedDataCallback = std::function<void(const float* data, size_t frameCount, int channels)>;

    // Callback pour l'analyse FFT
    using FFTAnalysisCallback = std::function<void(const float* magnitudes, size_t binCount, float sampleRate)>;

    AudioPipeline();
    ~AudioPipeline();

    // === Initialisation ===
    bool initialize(const Config& config);
    void release();

    // === Contrôle du pipeline ===
    bool start();
    bool stop();
    bool pause();
    bool resume();

    // === Configuration des modules ===

    // Equalizer
    void setEqualizerEnabled(bool enabled);
    void setEqualizerBand(int band, float frequency, float gain, float q);
    void loadEqualizerPreset(const std::string& presetName);

    // Noise reduction
    void setNoiseReductionEnabled(bool enabled);
    void setNoiseReductionStrength(float strength); // 0.0 à 1.0
    void trainNoiseProfile(float durationSeconds = 1.0f);

    // Effects
    void setEffectsEnabled(bool enabled);
    void addEffect(std::shared_ptr<AudioFX::IAudioEffect> effect);
    void removeEffect(const std::string& effectId);
    void setEffectParameter(const std::string& effectId, const std::string& param, float value);

    // Safety limiter
    void setSafetyLimiterEnabled(bool enabled);
    void setSafetyLimiterThreshold(float threshold);

    // FFT Analysis
    void setFFTAnalysisEnabled(bool enabled);
    void setFFTSize(size_t size); // 256, 512, 1024, 2048, 4096

    // === Callbacks ===
    void setProcessedDataCallback(ProcessedDataCallback callback);
    void setFFTAnalysisCallback(FFTAnalysisCallback callback);

    // === Monitoring ===
    float getCurrentLevel() const;
    float getPeakLevel() const;
    bool isClipping() const;
    float getLatencyMs() const;

    // === Recording ===
    bool startRecording(const std::string& filename);
    bool stopRecording();
    bool isRecording() const;

private:
    // Modules
    std::unique_ptr<::Audio::capture::AudioCapture> capture_;
    std::unique_ptr<::Audio::core::AudioEqualizer> equalizer_;
    std::unique_ptr<AudioNR::NoiseReducer> noiseReduction_;
    std::unique_ptr<AudioFX::EffectChain> effectsChain_;
    std::unique_ptr<AudioSafety::AudioSafetyEngine> safetyLimiter_;
    std::unique_ptr<AudioFX::SimpleFFT> fftAnalyzer_;
    std::unique_ptr<Nyth::Audio::AudioRecorder> recorder_;

    // Buffers de traitement
    std::unique_ptr<AudioUtils::AudioBuffer> processBuffer_;
    std::unique_ptr<AudioUtils::AudioBuffer> tempBuffer_;

    // Configuration
    Config config_;

    // État
    std::atomic<bool> isRunning_{false};
    std::atomic<bool> isPaused_{false};
    std::atomic<float> currentLevel_{0.0f};
    std::atomic<float> peakLevel_{0.0f};
    std::atomic<bool> isClipping_{false};

    // Callbacks
    ProcessedDataCallback processedDataCallback_;
    FFTAnalysisCallback fftAnalysisCallback_;

    // Méthode de traitement principal
    void processAudioData(const float* inputData, size_t frameCount, int channels);

    // Méthodes de traitement par module
    void applyNoiseReduction(float* data, size_t frameCount, int channels);
    void applyEqualizer(float* data, size_t frameCount, int channels);
    void applyEffects(float* data, size_t frameCount, int channels);
    void applySafetyLimiter(float* data, size_t frameCount, int channels);
    void analyzeFFT(const float* data, size_t frameCount, int channels);

    // Monitoring
    void updateLevels(const float* data, size_t sampleCount);
};

// ============================================================================
// Processeur audio en temps réel avec chaîne d'effets
// ============================================================================

class RealtimeAudioProcessor {
public:
    struct ProcessorConfig {
        int sampleRate = 44100;
        int blockSize = 512;
        int channelCount = 2;
        float latencyMs = 10.0f;
    };

    RealtimeAudioProcessor();
    ~RealtimeAudioProcessor();

    // Initialisation
    bool initialize(const ProcessorConfig& config);

    // Ajouter des processeurs à la chaîne
    void addProcessor(std::function<void(float*, size_t, int)> processor);

    // Traitement temps réel
    void process(float* data, size_t frameCount);

    // Métriques de performance
    float getCpuUsage() const {
        return cpuUsage_.load();
    }
    float getProcessingTimeUs() const {
        return processingTimeUs_.load();
    }

private:
    ProcessorConfig config_;
    std::vector<std::function<void(float*, size_t, int)>> processors_;

    std::atomic<float> cpuUsage_{0.0f};
    std::atomic<float> processingTimeUs_{0.0f};

    std::chrono::steady_clock::time_point lastProcessTime_;
};

// ============================================================================
// Gestionnaire de sessions audio
// ============================================================================

class AudioSessionManager {
public:
    enum class SessionType { Recording, Playback, Communication, GameAudio, MediaPlayback };

    struct SessionConfig {
        SessionType type = SessionType::Recording;
        int sampleRate = 44100;
        int channelCount = 2;
        bool exclusiveMode = false;
        bool lowLatency = false;
    };

    static AudioSessionManager& getInstance();

    // Gestion des sessions
    bool startSession(const SessionConfig& config);
    void endSession();
    bool isSessionActive() const;

    // Gestion des interruptions
    void handleInterruption();
    void handleRouteChange();

    // Permissions
    bool hasAudioPermission() const;
    void requestAudioPermission(std::function<void(bool)> callback);

private:
    AudioSessionManager() = default;
    SessionConfig currentSession_;
    std::atomic<bool> sessionActive_{false};
};

// ============================================================================
// Utilitaires d'intégration
// ============================================================================

class AudioIntegrationUtils {
public:
    // Conversion entre formats des différents modules
    static void convertCaptureToEffectsFormat(const float* captureData, float* effectsData, size_t frameCount,
                                              int channels);

    // Synchronisation entre modules
    static void syncModuleTiming(::Audio::capture::AudioCapture* capture, AudioFX::EffectChain* effects);

    // Validation de compatibilité
    static bool areModulesCompatible(const ::Audio::capture::AudioCaptureConfig& captureConfig, const ::Audio::core::AudioEqualizer& eq);

    // Optimisation de la latence
    static void optimizeLatency(AudioPipeline* pipeline);
};

} // namespace Audio
} // namespace Nyth
