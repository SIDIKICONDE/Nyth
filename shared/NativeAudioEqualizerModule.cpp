#include "NativeAudioEqualizerModule.h"
#include <atomic>
#include <mutex>
#include <algorithm>
#include <iostream>
#include <vector>
#include <string>
#include <cmath>
#include <cstring>

// === API C globale (accessible depuis ObjC/Java) pour l'état EQ par défaut ===
// Ces symboles existent toujours (stubs si NAAYA_AUDIO_EQ_ENABLED=0)
static std::mutex g_naaya_eq_mutex;
static bool g_naaya_eq_enabled = false;
static double g_naaya_eq_master_gain = 0.0;
static double g_naaya_eq_band_gains[32] = {0};
static size_t g_naaya_eq_num_bands = 10;
static std::atomic<bool> g_naaya_eq_dirty{false};

// === NR global state (accessible cross-platform) ===
static std::mutex g_naaya_nr_mutex;
static bool   g_naaya_nr_enabled = false;
// Mode NR: 0=expander, 1=rnnoise, 2=off
static int    g_naaya_nr_mode = 0;
// RNNoise aggressiveness (0.0..3.0)
static double g_naaya_rnns_aggr = 1.0;
static bool   g_naaya_nr_hp_enabled = true;
static double g_naaya_nr_hp_hz = 80.0;
static double g_naaya_nr_threshold_db = -45.0;
static double g_naaya_nr_ratio = 2.5;
static double g_naaya_nr_floor_db = -18.0;
static double g_naaya_nr_attack_ms = 3.0;
static double g_naaya_nr_release_ms = 80.0;
static std::atomic<bool> g_naaya_nr_dirty{false};

// Safety (audio integrity) global state
static std::mutex g_naaya_safety_mutex;
static bool   g_naaya_safety_enabled = true;
static bool   g_naaya_safety_dc_enabled = true;
static double g_naaya_safety_dc_threshold = 0.002;
static bool   g_naaya_safety_limiter_enabled = true;
static double g_naaya_safety_limiter_threshold_db = -1.0;
static bool   g_naaya_safety_softknee = true;
static double g_naaya_safety_knee_db = 6.0;
static bool   g_naaya_safety_feedback_enabled = true;
static double g_naaya_safety_feedback_thresh = 0.95;
static std::atomic<bool> g_naaya_safety_dirty{false};
static double g_naaya_safety_last_peak = 0.0;
static double g_naaya_safety_last_rms = 0.0;
static double g_naaya_safety_last_dc = 0.0;
static uint32_t g_naaya_safety_last_clipped = 0;
static double g_naaya_safety_last_feedback = 0.0;
static bool g_naaya_safety_last_overload = false;

// === FX (creative effects) global state ===
static std::mutex g_naaya_fx_mutex;
static bool   g_naaya_fx_enabled = false;
// Compressor
static double g_naaya_fx_comp_threshold_db = -18.0;
static double g_naaya_fx_comp_ratio        = 3.0;
static double g_naaya_fx_comp_attack_ms    = 10.0;
static double g_naaya_fx_comp_release_ms   = 80.0;
static double g_naaya_fx_comp_makeup_db    = 0.0;
// Delay
static double g_naaya_fx_delay_ms          = 150.0;
static double g_naaya_fx_delay_feedback    = 0.3;
static double g_naaya_fx_delay_mix         = 0.25;
static std::atomic<bool> g_naaya_fx_dirty{false};

extern "C" bool NaayaEQ_IsEnabled() {
  std::lock_guard<std::mutex> lk(g_naaya_eq_mutex);
  return g_naaya_eq_enabled;
}

extern "C" double NaayaEQ_GetMasterGainDB() {
  std::lock_guard<std::mutex> lk(g_naaya_eq_mutex);
  return g_naaya_eq_master_gain;
}

extern "C" size_t NaayaEQ_CopyBandGains(double* out, size_t maxCount) {
  if (!out || maxCount == 0) return 0;
  std::lock_guard<std::mutex> lk(g_naaya_eq_mutex);
  size_t n = g_naaya_eq_num_bands < maxCount ? g_naaya_eq_num_bands : maxCount;
  for (size_t i = 0; i < n; ++i) out[i] = g_naaya_eq_band_gains[i];
  return n;
}

extern "C" size_t NaayaEQ_GetNumBands() {
  std::lock_guard<std::mutex> lk(g_naaya_eq_mutex);
  return g_naaya_eq_num_bands;
}

extern "C" bool NaayaEQ_HasPendingUpdate() {
  return g_naaya_eq_dirty.load();
}

extern "C" void NaayaEQ_ClearPendingUpdate() {
  g_naaya_eq_dirty.store(false);
}

// === NR C API ===
extern "C" bool NaayaNR_IsEnabled() {
  std::lock_guard<std::mutex> lk(g_naaya_nr_mutex);
  return g_naaya_nr_enabled;
}

extern "C" bool NaayaNR_HasPendingUpdate() {
  return g_naaya_nr_dirty.load();
}

extern "C" void NaayaNR_ClearPendingUpdate() {
  g_naaya_nr_dirty.store(false);
}

extern "C" int NaayaNR_GetMode() {
  std::lock_guard<std::mutex> lk(g_naaya_nr_mutex);
  return g_naaya_nr_mode;
}

extern "C" double NaayaRNNS_GetAggressiveness() {
  std::lock_guard<std::mutex> lk(g_naaya_nr_mutex);
  return g_naaya_rnns_aggr;
}

extern "C" void NaayaNR_GetConfig(bool* hpEnabled,
                                  double* hpHz,
                                  double* thresholdDb,
                                  double* ratio,
                                  double* floorDb,
                                  double* attackMs,
                                  double* releaseMs) {
  std::lock_guard<std::mutex> lk(g_naaya_nr_mutex);
  if (hpEnabled)   *hpEnabled   = g_naaya_nr_hp_enabled;
  if (hpHz)        *hpHz        = g_naaya_nr_hp_hz;
  if (thresholdDb) *thresholdDb = g_naaya_nr_threshold_db;
  if (ratio)       *ratio       = g_naaya_nr_ratio;
  if (floorDb)     *floorDb     = g_naaya_nr_floor_db;
  if (attackMs)    *attackMs    = g_naaya_nr_attack_ms;
  if (releaseMs)   *releaseMs   = g_naaya_nr_release_ms;
}

// === FX C API ===
extern "C" bool NaayaFX_IsEnabled() {
  std::lock_guard<std::mutex> lk(g_naaya_fx_mutex);
  return g_naaya_fx_enabled;
}

extern "C" bool NaayaFX_HasPendingUpdate() {
  return g_naaya_fx_dirty.load();
}

extern "C" void NaayaFX_ClearPendingUpdate() {
  g_naaya_fx_dirty.store(false);
}

extern "C" void NaayaFX_GetCompressor(double* thresholdDb,
                                       double* ratio,
                                       double* attackMs,
                                       double* releaseMs,
                                       double* makeupDb) {
  std::lock_guard<std::mutex> lk(g_naaya_fx_mutex);
  if (thresholdDb) *thresholdDb = g_naaya_fx_comp_threshold_db;
  if (ratio)       *ratio       = g_naaya_fx_comp_ratio;
  if (attackMs)    *attackMs    = g_naaya_fx_comp_attack_ms;
  if (releaseMs)   *releaseMs   = g_naaya_fx_comp_release_ms;
  if (makeupDb)    *makeupDb    = g_naaya_fx_comp_makeup_db;
}

extern "C" void NaayaFX_GetDelay(double* delayMs,
                                  double* feedback,
                                  double* mix) {
  std::lock_guard<std::mutex> lk(g_naaya_fx_mutex);
  if (delayMs)  *delayMs  = g_naaya_fx_delay_ms;
  if (feedback) *feedback = g_naaya_fx_delay_feedback;
  if (mix)      *mix      = g_naaya_fx_delay_mix;
}

// === Safety C API to update metrics from platform recorders ===
extern "C" void NaayaSafety_UpdateReport(double peak,
                                          double rms,
                                          double dcOffset,
                                          uint32_t clippedSamples,
                                          double feedbackScore,
                                          bool overload) {
  std::lock_guard<std::mutex> lk(g_naaya_safety_mutex);
  g_naaya_safety_last_peak = peak;
  g_naaya_safety_last_rms = rms;
  g_naaya_safety_last_dc = dcOffset;
  g_naaya_safety_last_clipped = clippedSamples;
  g_naaya_safety_last_feedback = feedbackScore;
  g_naaya_safety_last_overload = overload;
}

#if NAAYA_AUDIO_EQ_ENABLED

#ifndef NAAYA_HAS_SPECTRUM
#define NAAYA_HAS_SPECTRUM 1
#endif

#if NAAYA_HAS_SPECTRUM
extern "C" {
void NaayaAudioSpectrumStart(void);
void NaayaAudioSpectrumStop(void);
size_t NaayaAudioSpectrumCopyMagnitudes(float* outBuffer, size_t maxCount);
}
#endif

namespace facebook {
namespace react {

// Pure C++17 implementation without JSI dependencies
NativeAudioEqualizerModule::NativeAudioEqualizerModule()
    : m_nextEqualizerId(1)
    , defaultEqualizerId_(0)
    , bypassed_(true)
    , currentPresetName_("flat")
    , analysisRunning_(false) {
    std::cout << "[NativeAudioEqualizerModule] C++17 constructor completed" << std::endl;
}

// Destructor
NativeAudioEqualizerModule::~NativeAudioEqualizerModule() {
    std::cout << "[NativeAudioEqualizerModule] C++17 destructor" << std::endl;
}

// Equalizer management - Pure C++17 implementation
int32_t NativeAudioEqualizerModule::createEqualizer(size_t numBands, double sampleRate) {
    std::lock_guard<std::mutex> lock(m_equalizersMutex);
    
    int32_t equalizerId = m_nextEqualizerId++;
    auto equalizer = std::make_unique<AudioFX::AudioEqualizer>(
        numBands, static_cast<uint32_t>(sampleRate));
    
    auto& instance = m_equalizers[equalizerId];
    instance.equalizer = std::move(equalizer);
    instance.refCount = 1;
    
    // Update global state
    {
        std::lock_guard<std::mutex> lk(g_naaya_eq_mutex);
        g_naaya_eq_num_bands = numBands;
        g_naaya_eq_dirty.store(true);
    }
    
    return equalizerId;
}

void NativeAudioEqualizerModule::destroyEqualizer(int32_t equalizerId) {
    std::lock_guard<std::mutex> lock(m_equalizersMutex);
    m_equalizers.erase(equalizerId);
}

// Audio processing
bool NativeAudioEqualizerModule::processAudio(int32_t equalizerId, const float* inputBuffer, 
                                              float* outputBuffer, size_t bufferSize) {
    auto* eq = getEqualizer(equalizerId);
    if (!eq || !inputBuffer || !outputBuffer) {
        return false;
    }
    
    eq->process(inputBuffer, outputBuffer, bufferSize);
    return true;
}

bool NativeAudioEqualizerModule::processAudioStereo(int32_t equalizerId,
                                                    const float* inputBufferL, const float* inputBufferR,
                                                    float* outputBufferL, float* outputBufferR,
                                                    size_t bufferSize) {
    auto* eq = getEqualizer(equalizerId);
    if (!eq || !inputBufferL || !inputBufferR || !outputBufferL || !outputBufferR) {
        return false;
    }
    
    eq->processStereo(inputBufferL, inputBufferR, outputBufferL, outputBufferR, bufferSize);
    return true;
}

// Band control
bool NativeAudioEqualizerModule::setBandGain(int32_t equalizerId, size_t bandIndex, double gainDB) {
    auto* eq = getEqualizer(equalizerId);
    if (!eq) return false;
    
    eq->setBandGain(bandIndex, gainDB);
    
    // Update global state
    {
        std::lock_guard<std::mutex> lk(g_naaya_eq_mutex);
        if (bandIndex < 32) {
            g_naaya_eq_band_gains[bandIndex] = gainDB;
            g_naaya_eq_dirty.store(true);
        }
    }
    
    return true;
}

bool NativeAudioEqualizerModule::setBandFrequency(int32_t equalizerId, size_t bandIndex, double frequency) {
    auto* eq = getEqualizer(equalizerId);
    if (!eq) return false;
    
    eq->setBandFrequency(bandIndex, frequency);
    return true;
}

bool NativeAudioEqualizerModule::setBandQ(int32_t equalizerId, size_t bandIndex, double q) {
    auto* eq = getEqualizer(equalizerId);
    if (!eq) return false;
    
    eq->setBandQ(bandIndex, q);
    return true;
}

bool NativeAudioEqualizerModule::setBandType(int32_t equalizerId, size_t bandIndex, int type) {
    auto* eq = getEqualizer(equalizerId);
    if (!eq) return false;
    
    eq->setBandType(bandIndex, intToFilterType(type));
    return true;
}

bool NativeAudioEqualizerModule::setBandEnabled(int32_t equalizerId, size_t bandIndex, bool enabled) {
    auto* eq = getEqualizer(equalizerId);
    if (!eq) return false;
    
    eq->setBandEnabled(bandIndex, enabled);
    return true;
}

// Get band parameters
double NativeAudioEqualizerModule::getBandGain(int32_t equalizerId, size_t bandIndex) {
    auto* eq = getEqualizer(equalizerId);
    if (!eq) return 0.0;
    
    return eq->getBandGain(bandIndex);
}

double NativeAudioEqualizerModule::getBandFrequency(int32_t equalizerId, size_t bandIndex) {
    auto* eq = getEqualizer(equalizerId);
    if (!eq) return 0.0;
    
    return eq->getBandFrequency(bandIndex);
}

double NativeAudioEqualizerModule::getBandQ(int32_t equalizerId, size_t bandIndex) {
    auto* eq = getEqualizer(equalizerId);
    if (!eq) return 1.0;
    
    return eq->getBandQ(bandIndex);
}

int NativeAudioEqualizerModule::getBandType(int32_t equalizerId, size_t bandIndex) {
    auto* eq = getEqualizer(equalizerId);
    if (!eq) return 0;
    
    return filterTypeToInt(eq->getBandType(bandIndex));
}

bool NativeAudioEqualizerModule::isBandEnabled(int32_t equalizerId, size_t bandIndex) {
    auto* eq = getEqualizer(equalizerId);
    if (!eq) return false;
    
    return eq->isBandEnabled(bandIndex);
}

// Global controls
bool NativeAudioEqualizerModule::setMasterGain(int32_t equalizerId, double gainDB) {
    auto* eq = getEqualizer(equalizerId);
    if (!eq) return false;
    
    eq->setMasterGain(gainDB);
    
    // Update global state
    {
        std::lock_guard<std::mutex> lk(g_naaya_eq_mutex);
        g_naaya_eq_master_gain = gainDB;
        g_naaya_eq_dirty.store(true);
    }
    
    return true;
}

double NativeAudioEqualizerModule::getMasterGain(int32_t equalizerId) {
    auto* eq = getEqualizer(equalizerId);
    if (!eq) return 0.0;
    
    return eq->getMasterGain();
}

bool NativeAudioEqualizerModule::setBypass(int32_t equalizerId, bool bypass) {
    auto* eq = getEqualizer(equalizerId);
    if (!eq) return false;
    
    eq->setBypass(bypass);
    bypassed_ = bypass;
    
    // Update global state
    {
        std::lock_guard<std::mutex> lk(g_naaya_eq_mutex);
        g_naaya_eq_enabled = !bypass;
        g_naaya_eq_dirty.store(true);
    }
    
    return true;
}

bool NativeAudioEqualizerModule::isBypassed(int32_t equalizerId) {
    auto* eq = getEqualizer(equalizerId);
    if (!eq) return true;
    
    return eq->isBypassed();
}

// Preset management
bool NativeAudioEqualizerModule::loadPreset(int32_t equalizerId, const PresetData& preset) {
    auto* eq = getEqualizer(equalizerId);
    if (!eq) return false;
    
    AudioFX::EQPreset eqPreset;
    eqPreset.name = preset.name;
    eqPreset.gains = preset.bandGains;
    
    eq->loadPreset(eqPreset);
    
    // Update global state
    {
        std::lock_guard<std::mutex> lk(g_naaya_eq_mutex);
        size_t n = preset.bandGains.size();
        if (n > 32) n = 32;
        for (size_t i = 0; i < n; ++i) {
            g_naaya_eq_band_gains[i] = preset.bandGains[i];
        }
        g_naaya_eq_master_gain = preset.masterGain;
        g_naaya_eq_dirty.store(true);
    }
    
    currentPresetName_ = preset.name;
    return true;
}

NativeAudioEqualizerModule::PresetData NativeAudioEqualizerModule::savePreset(int32_t equalizerId) {
    PresetData preset;
    auto* eq = getEqualizer(equalizerId);
    if (!eq) return preset;
    
    AudioFX::EQPreset eqPreset;
    eq->savePreset(eqPreset);
    
    preset.name = eqPreset.name;
    preset.bandGains = eqPreset.gains;
    preset.masterGain = eq->getMasterGain();
    
    // Add frequencies for each band
    size_t numBands = eq->getNumBands();
    preset.bandFrequencies.reserve(numBands);
    for (size_t i = 0; i < numBands; ++i) {
        preset.bandFrequencies.push_back(eq->getBandFrequency(i));
    }
    
    return preset;
}

bool NativeAudioEqualizerModule::resetAllBands(int32_t equalizerId) {
    auto* eq = getEqualizer(equalizerId);
    if (!eq) return false;
    
    eq->resetAllBands();
    
    // Update global state
    {
        std::lock_guard<std::mutex> lk(g_naaya_eq_mutex);
        for (size_t i = 0; i < 32; ++i) {
            g_naaya_eq_band_gains[i] = 0.0;
        }
        g_naaya_eq_master_gain = 0.0;
        g_naaya_eq_dirty.store(true);
    }
    
    return true;
}

std::vector<std::string> NativeAudioEqualizerModule::getAvailablePresets() {
    return {
        "Flat", "Rock", "Pop", "Jazz", "Classical", 
        "Electronic", "Vocal Boost", "Bass Boost", 
        "Treble Boost", "Loudness"
    };
}

bool NativeAudioEqualizerModule::loadPresetByName(int32_t equalizerId, const std::string& presetName) {
    auto* eq = getEqualizer(equalizerId);
    if (!eq) return false;
    
    AudioFX::EQPreset preset;
    
    if (presetName == "Flat") {
        preset = AudioFX::EQPresetFactory::createFlatPreset();
    } else if (presetName == "Rock") {
        preset = AudioFX::EQPresetFactory::createRockPreset();
    } else if (presetName == "Pop") {
        preset = AudioFX::EQPresetFactory::createPopPreset();
    } else if (presetName == "Jazz") {
        preset = AudioFX::EQPresetFactory::createJazzPreset();
    } else if (presetName == "Classical") {
        preset = AudioFX::EQPresetFactory::createClassicalPreset();
    } else if (presetName == "Electronic") {
        preset = AudioFX::EQPresetFactory::createElectronicPreset();
    } else if (presetName == "Vocal Boost") {
        preset = AudioFX::EQPresetFactory::createVocalBoostPreset();
    } else if (presetName == "Bass Boost") {
        preset = AudioFX::EQPresetFactory::createBassBoostPreset();
    } else if (presetName == "Treble Boost") {
        preset = AudioFX::EQPresetFactory::createTrebleBoostPreset();
    } else if (presetName == "Loudness") {
        preset = AudioFX::EQPresetFactory::createLoudnessPreset();
    } else {
        return false;
    }
    
    eq->loadPreset(preset);
    currentPresetName_ = presetName;
    
    // Update global state
    {
        std::lock_guard<std::mutex> lk(g_naaya_eq_mutex);
        size_t n = preset.gains.size();
        if (n > 32) n = 32;
        for (size_t i = 0; i < n; ++i) {
            g_naaya_eq_band_gains[i] = preset.gains[i];
        }
        g_naaya_eq_dirty.store(true);
    }
    
    return true;
}

// Utility
size_t NativeAudioEqualizerModule::getNumBands(int32_t equalizerId) {
    auto* eq = getEqualizer(equalizerId);
    if (!eq) return 0;
    
    return eq->getNumBands();
}

bool NativeAudioEqualizerModule::setSampleRate(int32_t equalizerId, double sampleRate) {
    auto* eq = getEqualizer(equalizerId);
    if (!eq) return false;
    
    eq->setSampleRate(static_cast<uint32_t>(sampleRate));
    return true;
}

double NativeAudioEqualizerModule::getSampleRate(int32_t equalizerId) {
    auto* eq = getEqualizer(equalizerId);
    if (!eq) return 0.0;
    
    return static_cast<double>(eq->getSampleRate());
}

bool NativeAudioEqualizerModule::beginParameterUpdate(int32_t equalizerId) {
    auto* eq = getEqualizer(equalizerId);
    if (!eq) return false;
    
    eq->beginParameterUpdate();
    return true;
}

bool NativeAudioEqualizerModule::endParameterUpdate(int32_t equalizerId) {
    auto* eq = getEqualizer(equalizerId);
    if (!eq) return false;
    
    eq->endParameterUpdate();
    return true;
}

// Helper methods
AudioFX::AudioEqualizer* NativeAudioEqualizerModule::getEqualizer(int32_t equalizerId) {
    std::lock_guard<std::mutex> lock(m_equalizersMutex);
    
    auto it = m_equalizers.find(equalizerId);
    if (it != m_equalizers.end()) {
        return it->second.equalizer.get();
    }
    
    return nullptr;
}

AudioFX::FilterType NativeAudioEqualizerModule::intToFilterType(int type) {
    switch (type) {
        case 0: return AudioFX::FilterType::LOWPASS;
        case 1: return AudioFX::FilterType::HIGHPASS;
        case 2: return AudioFX::FilterType::BANDPASS;
        case 3: return AudioFX::FilterType::NOTCH;
        case 4: return AudioFX::FilterType::PEAK;
        case 5: return AudioFX::FilterType::LOWSHELF;
        case 6: return AudioFX::FilterType::HIGHSHELF;
        case 7: return AudioFX::FilterType::ALLPASS;
        default: return AudioFX::FilterType::PEAK;
    }
}

int NativeAudioEqualizerModule::filterTypeToInt(AudioFX::FilterType type) {
    switch (type) {
        case AudioFX::FilterType::LOWPASS: return 0;
        case AudioFX::FilterType::HIGHPASS: return 1;
        case AudioFX::FilterType::BANDPASS: return 2;
        case AudioFX::FilterType::NOTCH: return 3;
        case AudioFX::FilterType::PEAK: return 4;
        case AudioFX::FilterType::LOWSHELF: return 5;
        case AudioFX::FilterType::HIGHSHELF: return 6;
        case AudioFX::FilterType::ALLPASS: return 7;
        default: return 4;
    }
}

// Default equalizer management
void NativeAudioEqualizerModule::ensureDefaultEqualizer() {
    if (defaultEqualizerId_ == 0) {
        // 10 bands, 48000Hz by default
        defaultEqualizerId_ = createEqualizer(10, 48000);
        // By default disabled (bypass activated)
        setBypass(defaultEqualizerId_, true);
        bypassed_ = true;
    }
}

// Audio buffer conversion helpers
std::vector<float> NativeAudioEqualizerModule::arrayToFloatVector(const std::vector<double>& array) {
    std::vector<float> result;
    result.reserve(array.size());
    for (double val : array) {
        result.push_back(static_cast<float>(val));
    }
    return result;
}

std::vector<double> NativeAudioEqualizerModule::floatVectorToArray(const std::vector<float>& vector) {
    std::vector<double> result;
    result.reserve(vector.size());
    for (float val : vector) {
        result.push_back(static_cast<double>(val));
    }
    return result;
}

} // namespace react
} // namespace facebook

#endif // NAAYA_AUDIO_EQ_ENABLED