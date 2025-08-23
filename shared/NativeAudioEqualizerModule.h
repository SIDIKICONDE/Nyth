#pragma once
#if defined(__has_include)
  #if __has_include(<NythJSI.h>)
    #include <NythJSI.h>
  #endif
#endif
#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#if defined(__has_include) && \
    __has_include(<ReactCommon/TurboModule.h>) && \
    __has_include(<ReactCommon/TurboModuleUtils.h>)
#define NAAYA_AUDIO_EQ_ENABLED 1
#else
#define NAAYA_AUDIO_EQ_ENABLED 0
#endif

// === API C globale pour l'état EQ/NR/FX/Safety ===
#ifdef __cplusplus
extern "C" {
#endif

// === API EQ ===
bool NaayaEQ_IsEnabled(void);
double NaayaEQ_GetMasterGainDB(void);
size_t NaayaEQ_CopyBandGains(double* out, size_t maxCount);
size_t NaayaEQ_GetNumBands(void);
bool NaayaEQ_HasPendingUpdate(void);
void NaayaEQ_ClearPendingUpdate(void);

// === API NR (Noise Reduction) ===
bool NaayaNR_IsEnabled(void);
bool NaayaNR_HasPendingUpdate(void);
void NaayaNR_ClearPendingUpdate(void);
int NaayaNR_GetMode(void);
double NaayaRNNS_GetAggressiveness(void);
void NaayaNR_GetConfig(bool* hpEnabled,
                       double* hpHz,
                       double* thresholdDb,
                       double* ratio,
                       double* floorDb,
                       double* attackMs,
                       double* releaseMs);

// === API FX (Effects) ===
bool NaayaFX_IsEnabled(void);
bool NaayaFX_HasPendingUpdate(void);
void NaayaFX_ClearPendingUpdate(void);
void NaayaFX_GetCompressor(double* thresholdDb,
                           double* ratio,
                           double* attackMs,
                           double* releaseMs,
                           double* makeupDb);
void NaayaFX_GetDelay(double* delayMs,
                      double* feedback,
                      double* mix);

// === API Safety ===
void NaayaSafety_UpdateReport(double peak,
                              double rms,
                              double dcOffset,
                              uint32_t clippedSamples,
                              double feedbackScore,
                              bool overload);

// === API Spectrum (si disponible) ===
#if NAAYA_AUDIO_EQ_ENABLED
void NaayaAudioSpectrumStart(void);
void NaayaAudioSpectrumStop(void);
size_t NaayaAudioSpectrumCopyMagnitudes(float* outBuffer, size_t maxCount);
#endif

#ifdef __cplusplus
}
#endif

#if NAAYA_AUDIO_EQ_ENABLED
  #if __has_include(<NaayaJSI.h>)
  #include <NaayaJSI.h>
  #endif

  #include "Audio/core/AudioEqualizer.hpp"
  #include <memory>
  #include <mutex>
  #include <unordered_map>

  // Completely disable JSI/TurboModule to avoid C++20 concepts issues
  // Use pure C++17 compatible interface
  #define SKIP_REACT_NATIVE_TURBO_MODULE
#endif

#if defined(__cplusplus)
namespace facebook {
namespace react {

#if NAAYA_AUDIO_EQ_ENABLED
// Pure C++17 compatible interface - no JSI/TurboModule dependencies
class NativeAudioEqualizerModule {
public:
    // Simple C++17 compatible constructor
    NativeAudioEqualizerModule();

    // Core equalizer functionality using C++ types
    int32_t createEqualizer(size_t numBands, double sampleRate);
    void destroyEqualizer(int32_t equalizerId);

    // Audio processing with float arrays
    bool processAudio(int32_t equalizerId, const float* inputBuffer, float* outputBuffer, size_t bufferSize);
    bool processAudioStereo(int32_t equalizerId,
                           const float* inputBufferL, const float* inputBufferR,
                           float* outputBufferL, float* outputBufferR,
                           size_t bufferSize);

    // Band control with simple types
    bool setBandGain(int32_t equalizerId, size_t bandIndex, double gainDB);
    bool setBandFrequency(int32_t equalizerId, size_t bandIndex, double frequency);
    bool setBandQ(int32_t equalizerId, size_t bandIndex, double q);
    bool setBandType(int32_t equalizerId, size_t bandIndex, int type);
    bool setBandEnabled(int32_t equalizerId, size_t bandIndex, bool enabled);

    // Get band parameters
    double getBandGain(int32_t equalizerId, size_t bandIndex);
    double getBandFrequency(int32_t equalizerId, size_t bandIndex);
    double getBandQ(int32_t equalizerId, size_t bandIndex);
    int getBandType(int32_t equalizerId, size_t bandIndex);
    bool isBandEnabled(int32_t equalizerId, size_t bandIndex);

    // Global controls
    bool setMasterGain(int32_t equalizerId, double gainDB);
    double getMasterGain(int32_t equalizerId);
    bool setBypass(int32_t equalizerId, bool bypass);
    bool isBypassed(int32_t equalizerId);

    // Preset management with simple structures
    struct PresetData {
        std::vector<double> bandGains;
        std::vector<double> bandFrequencies;
        double masterGain;
        std::string name;
    };

    bool loadPreset(int32_t equalizerId, const PresetData& preset);
    PresetData savePreset(int32_t equalizerId);
    bool resetAllBands(int32_t equalizerId);

    // Get available presets
    std::vector<std::string> getAvailablePresets();
    bool loadPresetByName(int32_t equalizerId, const std::string& presetName);

    // Utility
    size_t getNumBands(int32_t equalizerId);
    bool setSampleRate(int32_t equalizerId, double sampleRate);
    double getSampleRate(int32_t equalizerId);

    // Batch parameter updates
    bool beginParameterUpdate(int32_t equalizerId);
    bool endParameterUpdate(int32_t equalizerId);

private:
    struct EqualizerInstance {
        std::unique_ptr<AudioFX::AudioEqualizer> equalizer;
        uint32_t refCount;

        // Constructeur par défaut
        EqualizerInstance() = default;

        // Interdire la copie
        EqualizerInstance(const EqualizerInstance&) = delete;
        EqualizerInstance& operator=(const EqualizerInstance&) = delete;

        // Permettre le déplacement (std::unique_ptr est déplaçable)
        EqualizerInstance(EqualizerInstance&&) = default;
        EqualizerInstance& operator=(EqualizerInstance&&) = default;
    };

    std::unordered_map<int32_t, EqualizerInstance> m_equalizers;
    std::mutex m_equalizersMutex;
    int32_t m_nextEqualizerId;

    // Helper methods
    AudioFX::AudioEqualizer* getEqualizer(int32_t equalizerId);
    AudioFX::FilterType intToFilterType(int type);
    int filterTypeToInt(AudioFX::FilterType type);

    // Audio buffer conversion helpers (C++ only)
    std::vector<float> arrayToFloatVector(const std::vector<double>& array);
    std::vector<double> floatVectorToArray(const std::vector<float>& vector);

    // Default equalizer management
    void ensureDefaultEqualizer();

    int32_t defaultEqualizerId_;
    bool bypassed_;
    std::string currentPresetName_;
    bool analysisRunning_;
};
#else
// Stub minimal pour éviter les erreurs de linter quand JSI/TurboModule ne sont pas présents.
class NativeAudioEqualizerModule; // déclaration vide
#endif // NAAYA_AUDIO_EQ_ENABLED

} // namespace react
} // namespace facebook
#endif // __cplusplus