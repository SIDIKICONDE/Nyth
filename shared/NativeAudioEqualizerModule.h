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
  #include <jsi/jsi.h>
  #include <ReactCommon/TurboModule.h>
  #include <ReactCommon/TurboModuleUtils.h>
  #include "Audio/core/AudioEqualizer.h"
  #include <memory>
  #include <mutex>
  #include <unordered_map>
#endif

#if defined(__cplusplus)
namespace facebook {
namespace react {

#if NAAYA_AUDIO_EQ_ENABLED
class JSI_EXPORT NativeAudioEqualizerModule : public TurboModule {
public:
    explicit NativeAudioEqualizerModule(std::shared_ptr<CallInvoker> jsInvoker);
    
    // TurboModule interface
    static constexpr auto kModuleName = "NativeAudioEqualizerModule";
    
    // Equalizer management
    jsi::Value createEqualizer(jsi::Runtime& rt, double numBands, double sampleRate);
    void destroyEqualizer(jsi::Runtime& rt, double equalizerId);
    
    // Audio processing
    jsi::Value processAudio(jsi::Runtime& rt, double equalizerId, jsi::Object inputBuffer);
    jsi::Value processAudioStereo(jsi::Runtime& rt, double equalizerId, 
                                  jsi::Object inputBufferL, jsi::Object inputBufferR);
    
    // Band control
    void setBandGain(jsi::Runtime& rt, double equalizerId, double bandIndex, double gainDB);
    void setBandFrequency(jsi::Runtime& rt, double equalizerId, double bandIndex, double frequency);
    void setBandQ(jsi::Runtime& rt, double equalizerId, double bandIndex, double q);
    void setBandType(jsi::Runtime& rt, double equalizerId, double bandIndex, double type);
    void setBandEnabled(jsi::Runtime& rt, double equalizerId, double bandIndex, bool enabled);
    
    // Get band parameters
    double getBandGain(jsi::Runtime& rt, double equalizerId, double bandIndex);
    double getBandFrequency(jsi::Runtime& rt, double equalizerId, double bandIndex);
    double getBandQ(jsi::Runtime& rt, double equalizerId, double bandIndex);
    double getBandType(jsi::Runtime& rt, double equalizerId, double bandIndex);
    bool isBandEnabled(jsi::Runtime& rt, double equalizerId, double bandIndex);
    
    // Global controls
    void setMasterGain(jsi::Runtime& rt, double equalizerId, double gainDB);
    double getMasterGain(jsi::Runtime& rt, double equalizerId);
    void setBypass(jsi::Runtime& rt, double equalizerId, bool bypass);
    bool isBypassed(jsi::Runtime& rt, double equalizerId);
    
    // Preset management
    void loadPreset(jsi::Runtime& rt, double equalizerId, jsi::Object preset);
    jsi::Object savePreset(jsi::Runtime& rt, double equalizerId);
    void resetAllBands(jsi::Runtime& rt, double equalizerId);
    
    // Get available presets
    jsi::Array getAvailablePresets(jsi::Runtime& rt);
    void loadPresetByName(jsi::Runtime& rt, double equalizerId, jsi::String presetName);
    
    // Utility
    double getNumBands(jsi::Runtime& rt, double equalizerId);
    void setSampleRate(jsi::Runtime& rt, double equalizerId, double sampleRate);
    double getSampleRate(jsi::Runtime& rt, double equalizerId);
    
    // Batch parameter updates
    void beginParameterUpdate(jsi::Runtime& rt, double equalizerId);
    void endParameterUpdate(jsi::Runtime& rt, double equalizerId);

    /*
     * JSI endpoints (enregistrés dans le constructeur via methodMap_)
     * – Wrappers par défaut (sans equalizerId explicite):
     *   beginBatch(), endBatch()
     *
     * – Noise Reduction (NR):
     *   nrSetEnabled(enabled)
     *   nrGetEnabled() -> boolean
     *   nrSetMode(mode)           // 'expander' | 'rnnoise' | 'off' (ou 0/1/2)
     *   nrGetMode() -> number     // 0=expander, 1=rnnoise, 2=off
     *   rnnsSetAggressiveness(a)  // 0.0 .. 3.0
     *   rnnsGetAggressiveness() -> number
     *   nrSetConfig(highPassEnabled, highPassHz, thresholdDb, ratio, floorDb, attackMs, releaseMs)
     *   nrGetConfig() -> { highPassEnabled, highPassHz, thresholdDb, ratio, floorDb, attackMs, releaseMs }
     *
     * – Audio Safety:
     *   safetySetConfig(enabled, dcRemovalEnabled, dcThreshold, limiterEnabled, limiterThresholdDb,
     *                  softKneeLimiter, kneeWidthDb, feedbackDetectEnabled, feedbackCorrThreshold)
     *   safetyGetReport() -> { peak, rms, dcOffset, clippedSamples, feedbackScore, overload }
     *
     * – FX (effets créatifs):
     *   fxSetEnabled(enabled), fxGetEnabled()
     *   fxSetCompressor(thresholdDb, ratio, attackMs, releaseMs, makeupDb)
     *   fxSetDelay(delayMs, feedback, mix)
     */

private:
    struct EqualizerInstance {
        std::unique_ptr<AudioEqualizer::AudioEqualizer> equalizer;
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
    AudioEqualizer::AudioEqualizer* getEqualizer(int32_t equalizerId);
    AudioEqualizer::FilterType jsNumberToFilterType(double type);
    double filterTypeToJsNumber(AudioEqualizer::FilterType type);
    
    // Audio buffer conversion helpers
    std::vector<float> jsArrayToFloatVector(jsi::Runtime& rt, const jsi::Object& array);
    jsi::Object floatVectorToJsArray(jsi::Runtime& rt, const std::vector<float>& vector);

    // Compat couche JS existante
    void ensureDefaultEqualizer(jsi::Runtime& rt);
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