#include "NativeAudioCoreModule.h"

#if NYTH_AUDIO_CORE_ENABLED

#include "Audio/core/AudioEqualizer.hpp"
#include "Audio/core/BiquadFilter.hpp"
#include "Audio/core/MemoryPool.hpp"
#include <chrono>
#include <sstream>
#include <algorithm>
#include <cmath>

// === Instance globale pour l'API C ===
static std::unique_ptr<Audio::core::AudioEqualizer> g_audioEqualizer;
static std::map<int64_t, std::unique_ptr<AudioFX::BiquadFilter>> g_activeFilters;
static std::atomic<int64_t> g_nextFilterId{1};
static std::unique_ptr<AudioFX::LockFreeMemoryPool<float>> g_memoryPool;
static std::mutex g_globalMutex;
static NythCoreState g_currentState = CORE_STATE_UNINITIALIZED;
static NythCoreEqualizerConfig g_currentEqualizerConfig = {0};

// === Implémentation de l'API C ===

extern "C" {

// === Gestion du cycle de vie ===
bool NythCore_Initialize(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    try {
        g_audioEqualizer = std::make_unique<Audio::core::AudioEqualizer>(10, 48000); // 10-band EQ, 48kHz
        g_activeFilters.clear();
        g_nextFilterId = 1;
        g_memoryPool = std::make_unique<AudioFX::LockFreeMemoryPool<float>>(1024);
        g_currentState = CORE_STATE_INITIALIZED;
        return true;
    } catch (...) {
        g_currentState = CORE_STATE_ERROR;
        return false;
    }
}

bool NythCore_IsInitialized(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_currentState == CORE_STATE_INITIALIZED;
}

void NythCore_Release(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    g_audioEqualizer.reset();
    g_activeFilters.clear();
    g_memoryPool.reset();
    g_currentState = CORE_STATE_UNINITIALIZED;
}

// === État et informations ===
NythCoreState NythCore_GetState(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_currentState;
}

const char* NythCore_GetErrorString(NythCoreError error) {
    switch (error) {
        case CORE_ERROR_OK: return "OK";
        case CORE_ERROR_NOT_INITIALIZED: return "Not initialized";
        case CORE_ERROR_ALREADY_RUNNING: return "Already running";
        case CORE_ERROR_ALREADY_STOPPED: return "Already stopped";
        case CORE_ERROR_MODULE_ERROR: return "Module error";
        case CORE_ERROR_CONFIG_ERROR: return "Config error";
        case CORE_ERROR_PROCESSING_FAILED: return "Processing failed";
        case CORE_ERROR_MEMORY_ERROR: return "Memory error";
        case CORE_ERROR_THREAD_ERROR: return "Thread error";
        default: return "Unknown error";
    }
}

// === Gestion de l'égaliseur ===

// Initialisation
bool NythCore_EqualizerInitialize(const NythCoreEqualizerConfig* config) {
    if (!config) return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (g_currentState == CORE_STATE_UNINITIALIZED) return false;

    try {
        g_currentEqualizerConfig = *config;

        if (g_audioEqualizer) {
            g_audioEqualizer->setSampleRate(config->sampleRate);
            g_audioEqualizer->setMasterGain(config->masterGainDB);
            g_audioEqualizer->setBypass(config->bypass);

            // Initialize bands
            for (size_t i = 0; i < config->numBands; ++i) {
                g_audioEqualizer->setBandEnabled(i, true);
            }
        }

        return true;
    } catch (...) {
        return false;
    }
}

bool NythCore_EqualizerIsInitialized(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_audioEqualizer != nullptr;
}

void NythCore_EqualizerRelease(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    g_audioEqualizer.reset();
}

// Configuration
bool NythCore_EqualizerSetMasterGain(double gainDB) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (!g_audioEqualizer) return false;

    g_audioEqualizer->setMasterGain(gainDB);
    g_currentEqualizerConfig.masterGainDB = gainDB;
    return true;
}

bool NythCore_EqualizerSetBypass(bool bypass) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (!g_audioEqualizer) return false;

    g_audioEqualizer->setBypass(bypass);
    g_currentEqualizerConfig.bypass = bypass;
    return true;
}

bool NythCore_EqualizerSetSampleRate(uint32_t sampleRate) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (!g_audioEqualizer) return false;

    g_audioEqualizer->setSampleRate(sampleRate);
    g_currentEqualizerConfig.sampleRate = sampleRate;
    return true;
}

// Bandes
bool NythCore_EqualizerSetBand(size_t bandIndex, const NythCoreBandConfig* config) {
    if (!config) return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (!g_audioEqualizer) return false;

    try {
        g_audioEqualizer->setBandFrequency(bandIndex, config->frequency);
        g_audioEqualizer->setBandGain(bandIndex, config->gainDB);
        g_audioEqualizer->setBandQ(bandIndex, config->q);
        g_audioEqualizer->setBandEnabled(bandIndex, config->enabled);

        // Set filter type
        AudioFX::FilterType type;
        switch (config->type) {
            case CORE_FILTER_LOWPASS: type = AudioFX::FilterType::LOWPASS; break;
            case CORE_FILTER_HIGHPASS: type = AudioFX::FilterType::HIGHPASS; break;
            case CORE_FILTER_BANDPASS: type = AudioFX::FilterType::BANDPASS; break;
            case CORE_FILTER_NOTCH: type = AudioFX::FilterType::NOTCH; break;
            case CORE_FILTER_PEAK: type = AudioFX::FilterType::PEAK; break;
            case CORE_FILTER_LOWSHELF: type = AudioFX::FilterType::LOWSHELF; break;
            case CORE_FILTER_HIGHSHELF: type = AudioFX::FilterType::HIGHSHELF; break;
            case CORE_FILTER_ALLPASS: type = AudioFX::FilterType::ALLPASS; break;
            default: return false;
        }

        g_audioEqualizer->setBandType(bandIndex, type);
        return true;
    } catch (...) {
        return false;
    }
}

bool NythCore_EqualizerGetBand(size_t bandIndex, NythCoreBandConfig* config) {
    if (!config) return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (!g_audioEqualizer) return false;

    try {
        config->bandIndex = bandIndex;
        config->frequency = g_audioEqualizer->getBandFrequency(bandIndex);
        config->gainDB = g_audioEqualizer->getBandGain(bandIndex);
        config->q = g_audioEqualizer->getBandQ(bandIndex);
        config->enabled = g_audioEqualizer->isBandEnabled(bandIndex);

        // Get filter type
        AudioFX::FilterType type = g_audioEqualizer->getBandType(bandIndex);
        switch (type) {
            case AudioFX::FilterType::LOWPASS: config->type = CORE_FILTER_LOWPASS; break;
            case AudioFX::FilterType::HIGHPASS: config->type = CORE_FILTER_HIGHPASS; break;
            case AudioFX::FilterType::BANDPASS: config->type = CORE_FILTER_BANDPASS; break;
            case AudioFX::FilterType::NOTCH: config->type = CORE_FILTER_NOTCH; break;
            case AudioFX::FilterType::PEAK: config->type = CORE_FILTER_PEAK; break;
            case AudioFX::FilterType::LOWSHELF: config->type = CORE_FILTER_LOWSHELF; break;
            case AudioFX::FilterType::HIGHSHELF: config->type = CORE_FILTER_HIGHSHELF; break;
            case AudioFX::FilterType::ALLPASS: config->type = CORE_FILTER_ALLPASS; break;
            default: config->type = CORE_FILTER_PEAK; break;
        }

        return true;
    } catch (...) {
        return false;
    }
}

// Other band control functions
bool NythCore_EqualizerSetBandGain(size_t bandIndex, double gainDB) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (!g_audioEqualizer) return false;
    g_audioEqualizer->setBandGain(bandIndex, gainDB);
    return true;
}

bool NythCore_EqualizerSetBandFrequency(size_t bandIndex, double frequency) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (!g_audioEqualizer) return false;
    g_audioEqualizer->setBandFrequency(bandIndex, frequency);
    return true;
}

bool NythCore_EqualizerSetBandQ(size_t bandIndex, double q) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (!g_audioEqualizer) return false;
    g_audioEqualizer->setBandQ(bandIndex, q);
    return true;
}

bool NythCore_EqualizerSetBandType(size_t bandIndex, NythCoreFilterType type) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (!g_audioEqualizer) return false;

    AudioFX::FilterType filterType;
    switch (type) {
        case CORE_FILTER_LOWPASS: filterType = AudioFX::FilterType::LOWPASS; break;
        case CORE_FILTER_HIGHPASS: filterType = AudioFX::FilterType::HIGHPASS; break;
        case CORE_FILTER_BANDPASS: filterType = AudioFX::FilterType::BANDPASS; break;
        case CORE_FILTER_NOTCH: filterType = AudioFX::FilterType::NOTCH; break;
        case CORE_FILTER_PEAK: filterType = AudioFX::FilterType::PEAK; break;
        case CORE_FILTER_LOWSHELF: filterType = AudioFX::FilterType::LOWSHELF; break;
        case CORE_FILTER_HIGHSHELF: filterType = AudioFX::FilterType::HIGHSHELF; break;
        case CORE_FILTER_ALLPASS: filterType = AudioFX::FilterType::ALLPASS; break;
        default: return false;
    }

    g_audioEqualizer->setBandType(bandIndex, filterType);
    return true;
}

bool NythCore_EqualizerSetBandEnabled(size_t bandIndex, bool enabled) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (!g_audioEqualizer) return false;
    g_audioEqualizer->setBandEnabled(bandIndex, enabled);
    return true;
}

// Informations
void NythCore_EqualizerGetInfo(NythCoreEqualizerInfo* info) {
    if (!info) return;

    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (g_audioEqualizer) {
        info->numBands = g_audioEqualizer->getNumBands();
        info->sampleRate = g_currentEqualizerConfig.sampleRate;
        info->masterGainDB = g_currentEqualizerConfig.masterGainDB;
        info->bypass = g_currentEqualizerConfig.bypass;
        info->state = g_currentState;
    }
}

size_t NythCore_EqualizerGetNumBands(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (g_audioEqualizer) {
        return g_audioEqualizer->getNumBands();
    }
    return 0;
}

// Processing
bool NythCore_EqualizerProcessMono(const float* input, float* output, size_t numSamples) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (g_currentState != CORE_STATE_PROCESSING && g_currentState != CORE_STATE_INITIALIZED) {
        return false;
    }

    if (!g_audioEqualizer || !input || !output || numSamples == 0) {
        return false;
    }

    try {
        // Since AudioEqualizer doesn't have processMono, we use processStereo with identical channels
        std::vector<float> inputL(input, input + numSamples);
        std::vector<float> inputR(input, input + numSamples);
        std::vector<float> outputL(numSamples);
        std::vector<float> outputR(numSamples);

        g_audioEqualizer->processStereo(inputL, inputR, outputL, outputR);

        // Mix left and right channels for mono output
        for (size_t i = 0; i < numSamples; ++i) {
            output[i] = (outputL[i] + outputR[i]) * 0.5f;
        }
        return true;
    } catch (...) {
        return false;
    }
}

bool NythCore_EqualizerProcessStereo(const float* inputL, const float* inputR,
                                   float* outputL, float* outputR, size_t numSamples) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (g_currentState != CORE_STATE_PROCESSING && g_currentState != CORE_STATE_INITIALIZED) {
        return false;
    }

    if (!g_audioEqualizer || !inputL || !inputR || !outputL || !outputR || numSamples == 0) {
        return false;
    }

    try {
        std::vector<float> inputLVec(inputL, inputL + numSamples);
        std::vector<float> inputRVec(inputR, inputR + numSamples);
        std::vector<float> outputLVec(numSamples);
        std::vector<float> outputRVec(numSamples);

        g_audioEqualizer->processStereo(inputLVec, inputRVec, outputLVec, outputRVec);

        // Copy back to output arrays
        std::copy(outputLVec.begin(), outputLVec.end(), outputL);
        std::copy(outputRVec.begin(), outputRVec.end(), outputR);
        return true;
    } catch (...) {
        return false;
    }
}

// Presets
bool NythCore_EqualizerLoadPreset(const char* presetName) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (!g_audioEqualizer) return false;

    try {
        std::string preset(presetName);
        // Implement preset loading logic here
        return true;
    } catch (...) {
        return false;
    }
}

bool NythCore_EqualizerSavePreset(const char* presetName) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (!g_audioEqualizer) return false;

    try {
        std::string preset(presetName);
        // Implement preset saving logic here
        return true;
    } catch (...) {
        return false;
    }
}

bool NythCore_EqualizerResetAllBands(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (!g_audioEqualizer) return false;

    try {
        g_audioEqualizer->resetAllBands();
        return true;
    } catch (...) {
        return false;
    }
}

// === Gestion des filtres biquad individuels ===

// Création/destruction
int64_t NythCore_FilterCreate(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (g_currentState == CORE_STATE_UNINITIALIZED) return -1;

    try {
        int64_t filterId = g_nextFilterId++;
        g_activeFilters[filterId] = std::make_unique<AudioFX::BiquadFilter>();
        return filterId;
    } catch (...) {
        return -1;
    }
}

bool NythCore_FilterDestroy(int64_t filterId) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeFilters.find(filterId);
    if (it != g_activeFilters.end()) {
        g_activeFilters.erase(it);
        return true;
    }
    return false;
}

// Configuration
bool NythCore_FilterSetConfig(int64_t filterId, const NythCoreFilterConfig* config) {
    if (!config) return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeFilters.find(filterId);
    if (it != g_activeFilters.end()) {
        AudioFX::FilterType type;
        switch (config->type) {
            case CORE_FILTER_LOWPASS: type = AudioFX::FilterType::LOWPASS; break;
            case CORE_FILTER_HIGHPASS: type = AudioFX::FilterType::HIGHPASS; break;
            case CORE_FILTER_BANDPASS: type = AudioFX::FilterType::BANDPASS; break;
            case CORE_FILTER_NOTCH: type = AudioFX::FilterType::NOTCH; break;
            case CORE_FILTER_PEAK: type = AudioFX::FilterType::PEAK; break;
            case CORE_FILTER_LOWSHELF: type = AudioFX::FilterType::LOWSHELF; break;
            case CORE_FILTER_HIGHSHELF: type = AudioFX::FilterType::HIGHSHELF; break;
            case CORE_FILTER_ALLPASS: type = AudioFX::FilterType::ALLPASS; break;
            default: return false;
        }

        // Use the appropriate calculate method based on filter type
        switch (config->type) {
            case CORE_FILTER_LOWPASS:
                it->second->calculateLowpass(config->frequency, 48000.0, config->q);
                break;
            case CORE_FILTER_HIGHPASS:
                it->second->calculateHighpass(config->frequency, 48000.0, config->q);
                break;
            case CORE_FILTER_BANDPASS:
                it->second->calculateBandpass(config->frequency, 48000.0, config->q);
                break;
            case CORE_FILTER_NOTCH:
                it->second->calculateNotch(config->frequency, 48000.0, config->q);
                break;
            case CORE_FILTER_PEAK:
                it->second->calculatePeaking(config->frequency, 48000.0, config->q, config->gainDB);
                break;
            case CORE_FILTER_LOWSHELF:
                it->second->calculateLowShelf(config->frequency, 48000.0, config->q, config->gainDB);
                break;
            case CORE_FILTER_HIGHSHELF:
                it->second->calculateHighShelf(config->frequency, 48000.0, config->q, config->gainDB);
                break;
            case CORE_FILTER_ALLPASS:
                it->second->calculateAllpass(config->frequency, 48000.0, config->q);
                break;
            default:
                return false;
        }
        return true;
    }
    return false;
}

bool NythCore_FilterGetConfig(int64_t filterId, NythCoreFilterConfig* config) {
    if (!config) return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeFilters.find(filterId);
    if (it != g_activeFilters.end()) {
        // Note: BiquadFilter doesn't expose getters, so we'll need to implement this
        // For now, return default values
        config->frequency = 1000.0;
        config->q = 1.0;
        config->gainDB = 0.0;
        config->type = CORE_FILTER_PEAK;
        return true;
    }
    return false;
}

// Type-specific filter setters
bool NythCore_FilterSetLowpass(int64_t filterId, double frequency, double sampleRate, double q) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeFilters.find(filterId);
    if (it != g_activeFilters.end()) {
        it->second->calculateLowpass(frequency, sampleRate, q);
        return true;
    }
    return false;
}

bool NythCore_FilterSetHighpass(int64_t filterId, double frequency, double sampleRate, double q) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeFilters.find(filterId);
    if (it != g_activeFilters.end()) {
        it->second->calculateHighpass(frequency, sampleRate, q);
        return true;
    }
    return false;
}

bool NythCore_FilterSetBandpass(int64_t filterId, double frequency, double sampleRate, double q) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeFilters.find(filterId);
    if (it != g_activeFilters.end()) {
        it->second->calculateBandpass(frequency, sampleRate, q);
        return true;
    }
    return false;
}

bool NythCore_FilterSetNotch(int64_t filterId, double frequency, double sampleRate, double q) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeFilters.find(filterId);
    if (it != g_activeFilters.end()) {
        it->second->calculateNotch(frequency, sampleRate, q);
        return true;
    }
    return false;
}

bool NythCore_FilterSetPeaking(int64_t filterId, double frequency, double sampleRate, double q, double gainDB) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeFilters.find(filterId);
    if (it != g_activeFilters.end()) {
        it->second->calculatePeaking(frequency, sampleRate, q, gainDB);
        return true;
    }
    return false;
}

bool NythCore_FilterSetLowShelf(int64_t filterId, double frequency, double sampleRate, double q, double gainDB) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeFilters.find(filterId);
    if (it != g_activeFilters.end()) {
        it->second->calculateLowShelf(frequency, sampleRate, q, gainDB);
        return true;
    }
    return false;
}

bool NythCore_FilterSetHighShelf(int64_t filterId, double frequency, double sampleRate, double q, double gainDB) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeFilters.find(filterId);
    if (it != g_activeFilters.end()) {
        it->second->calculateHighShelf(frequency, sampleRate, q, gainDB);
        return true;
    }
    return false;
}

bool NythCore_FilterSetAllpass(int64_t filterId, double frequency, double sampleRate, double q) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeFilters.find(filterId);
    if (it != g_activeFilters.end()) {
        it->second->calculateAllpass(frequency, sampleRate, q);
        return true;
    }
    return false;
}

// Processing
bool NythCore_FilterProcessMono(int64_t filterId, const float* input, float* output, size_t numSamples) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeFilters.find(filterId);
    if (it != g_activeFilters.end()) {
        it->second->process(input, output, numSamples);
        return true;
    }
    return false;
}

bool NythCore_FilterProcessStereo(int64_t filterId, const float* inputL, const float* inputR,
                                float* outputL, float* outputR, size_t numSamples) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeFilters.find(filterId);
    if (it != g_activeFilters.end()) {
        it->second->processStereo(inputL, inputR, outputL, outputR, numSamples);
        return true;
    }
    return false;
}

// Informations
bool NythCore_FilterGetInfo(int64_t filterId, NythCoreFilterInfo* info) {
    if (!info) return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeFilters.find(filterId);
    if (it != g_activeFilters.end()) {
        // Note: BiquadFilter doesn't expose coefficient getters, so we'll need to implement this
        // For now, return default values
        info->a0 = 1.0;
        info->a1 = 0.0;
        info->a2 = 0.0;
        info->b1 = 0.0;
        info->b2 = 0.0;
        info->y1 = 0.0;
        info->y2 = 0.0;
        return true;
    }
    return false;
}

bool NythCore_FilterReset(int64_t filterId) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeFilters.find(filterId);
    if (it != g_activeFilters.end()) {
        it->second->reset();
        return true;
    }
    return false;
}

// === Utilitaires de conversion ===

// dB <-> Linéaire
double NythCore_DBToLinear(double db) {
    return std::pow(10.0, db / 20.0);
}

double NythCore_LinearToDB(double linear) {
    return 20.0 * std::log10(std::max(linear, 1e-10));
}

// Validation
bool NythCore_ValidateFrequency(double frequency, double sampleRate) {
    return frequency > 0.0 && frequency < sampleRate / 2.0;
}

bool NythCore_ValidateQ(double q) {
    return q > 0.0 && q <= 100.0;
}

bool NythCore_ValidateGainDB(double gainDB) {
    return gainDB >= -60.0 && gainDB <= 30.0;
}

// === Gestion de la mémoire ===
bool NythCore_MemoryInitialize(size_t poolSize) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    try {
        g_memoryPool = std::make_unique<AudioFX::LockFreeMemoryPool<float>>(poolSize);
        return true;
    } catch (...) {
        return false;
    }
}

void NythCore_MemoryRelease(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    g_memoryPool.reset();
}

size_t NythCore_MemoryGetAvailable(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (g_memoryPool) {
        return g_memoryPool->getAvailableCount();
    }
    return 0;
}

size_t NythCore_MemoryGetUsed(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (g_memoryPool) {
        return g_memoryPool->getAllocatedCount();
    }
    return 0;
}

// === Callbacks (pour usage interne) ===
void NythCore_SetAudioCallback(NythCoreAudioCallback callback) {
    // Not implemented in this version
}

void NythCore_SetErrorCallback(NythCoreErrorCallback callback) {
    // Not implemented in this version
}

void NythCore_SetStateCallback(NythCoreStateCallback callback) {
    // Not implemented in this version
}

} // extern "C"

// === Implémentation C++ pour TurboModule ===

namespace facebook {
namespace react {

NativeAudioCoreModule::NativeAudioCoreModule(std::shared_ptr<CallInvoker> jsInvoker)
    : TurboModule("NativeAudioCoreModule", jsInvoker) {
    currentSampleRate_ = 44100;
    currentChannels_ = 2;
}

NativeAudioCoreModule::~NativeAudioCoreModule() {
    std::lock_guard<std::mutex> lock(m_coreMutex);
    if (m_equalizer) {
        m_equalizer.reset();
    }
    m_filters.clear();
}

// === Méthodes privées ===

void NativeAudioCoreModule::initializeEqualizer() {
    m_equalizer = std::make_unique<Audio::core::AudioEqualizer>(10, currentSampleRate_);
    m_equalizer->setMasterGain(0.0);
    m_equalizer->setBypass(false);
    m_currentState = CORE_STATE_INITIALIZED;
}

bool NativeAudioCoreModule::validateFilterId(int64_t filterId) {
    return m_filters.find(filterId) != m_filters.end();
}

NythCoreFilterType NativeAudioCoreModule::stringToFilterType(const std::string& typeStr) const {
    if (typeStr == "lowpass") return CORE_FILTER_LOWPASS;
    if (typeStr == "highpass") return CORE_FILTER_HIGHPASS;
    if (typeStr == "bandpass") return CORE_FILTER_BANDPASS;
    if (typeStr == "notch") return CORE_FILTER_NOTCH;
    if (typeStr == "peak") return CORE_FILTER_PEAK;
    if (typeStr == "lowshelf") return CORE_FILTER_LOWSHELF;
    if (typeStr == "highshelf") return CORE_FILTER_HIGHSHELF;
    if (typeStr == "allpass") return CORE_FILTER_ALLPASS;
    return CORE_FILTER_PEAK;
}

std::string NativeAudioCoreModule::filterTypeToString(NythCoreFilterType type) const {
    switch (type) {
        case CORE_FILTER_LOWPASS: return "lowpass";
        case CORE_FILTER_HIGHPASS: return "highpass";
        case CORE_FILTER_BANDPASS: return "bandpass";
        case CORE_FILTER_NOTCH: return "notch";
        case CORE_FILTER_PEAK: return "peak";
        case CORE_FILTER_LOWSHELF: return "lowshelf";
        case CORE_FILTER_HIGHSHELF: return "highshelf";
        case CORE_FILTER_ALLPASS: return "allpass";
        default: return "peak";
    }
}

void NativeAudioCoreModule::handleAudioData(const float* data, size_t frameCount, int channels) {
    // Handle audio data callbacks
}

void NativeAudioCoreModule::handleError(NythCoreError error, const std::string& message) {
    std::lock_guard<std::mutex> lock(m_coreMutex);
    if (m_jsCallbacks.errorCallback) {
        // TODO: Implement callback invocation
        // invokeJSCallback("errorCallback", [error, message](jsi::Runtime& rt) {
        //     jsi::String errorStr = jsi::String::createFromUtf8(rt, message);
        // });
    }
}

void NativeAudioCoreModule::handleStateChange(NythCoreState oldState, NythCoreState newState) {
    std::lock_guard<std::mutex> lock(m_coreMutex);
    if (m_jsCallbacks.stateCallback) {
        // TODO: Implement callback invocation
        // invokeJSCallback("stateChangeCallback", [oldState, newState, this](jsi::Runtime& rt) {
        //     std::string oldStateStr = stateToString(oldState);
        //     std::string newStateStr = stateToString(newState);
        //     jsi::String oldStateJS = jsi::String::createFromUtf8(rt, oldStateStr);
        //     jsi::String newStateJS = jsi::String::createFromUtf8(rt, newStateStr);
        // });
    }
}

std::string NativeAudioCoreModule::stateToString(NythCoreState state) const {
    switch (state) {
        case CORE_STATE_UNINITIALIZED: return "uninitialized";
        case CORE_STATE_INITIALIZED: return "initialized";
        case CORE_STATE_PROCESSING: return "processing";
        case CORE_STATE_ERROR: return "error";
        default: return "unknown";
    }
}

NythCoreError NativeAudioCoreModule::convertError(const std::string& error) const {
    if (error == "not_initialized") return CORE_ERROR_NOT_INITIALIZED;
    if (error == "already_running") return CORE_ERROR_ALREADY_RUNNING;
    if (error == "already_stopped") return CORE_ERROR_ALREADY_STOPPED;
    if (error == "config_error") return CORE_ERROR_CONFIG_ERROR;
    if (error == "processing_failed") return CORE_ERROR_PROCESSING_FAILED;
    if (error == "memory_error") return CORE_ERROR_MEMORY_ERROR;
    if (error == "thread_error") return CORE_ERROR_THREAD_ERROR;
    return CORE_ERROR_MODULE_ERROR;
}

std::string NativeAudioCoreModule::errorToString(NythCoreError error) const {
    switch (error) {
        case CORE_ERROR_OK: return "OK";
        case CORE_ERROR_NOT_INITIALIZED: return "Not initialized";
        case CORE_ERROR_ALREADY_RUNNING: return "Already running";
        case CORE_ERROR_ALREADY_STOPPED: return "Already stopped";
        case CORE_ERROR_MODULE_ERROR: return "Module error";
        case CORE_ERROR_CONFIG_ERROR: return "Config error";
        case CORE_ERROR_PROCESSING_FAILED: return "Processing failed";
        case CORE_ERROR_MEMORY_ERROR: return "Memory error";
        case CORE_ERROR_THREAD_ERROR: return "Thread error";
        default: return "Unknown error";
    }
}

// === Conversion JSI <-> Native ===

NythCoreEqualizerConfig NativeAudioCoreModule::parseEqualizerConfig(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    NythCoreEqualizerConfig config = {0};
    config.numBands = 10; // Default 10-band EQ
    config.sampleRate = currentSampleRate_;
    config.masterGainDB = 0.0;
    config.bypass = false;

    if (jsConfig.hasProperty(rt, "numBands")) {
        config.numBands = static_cast<size_t>(jsConfig.getProperty(rt, "numBands").asNumber());
    }
    if (jsConfig.hasProperty(rt, "sampleRate")) {
        config.sampleRate = static_cast<uint32_t>(jsConfig.getProperty(rt, "sampleRate").asNumber());
    }
    if (jsConfig.hasProperty(rt, "masterGainDB")) {
        config.masterGainDB = jsConfig.getProperty(rt, "masterGainDB").asNumber();
    }
    if (jsConfig.hasProperty(rt, "bypass")) {
        config.bypass = jsConfig.getProperty(rt, "bypass").asBool();
    }

    return config;
}

jsi::Object NativeAudioCoreModule::equalizerConfigToJS(jsi::Runtime& rt, const NythCoreEqualizerConfig& config) const {
    jsi::Object jsConfig(rt);
    jsConfig.setProperty(rt, "numBands", jsi::Value(static_cast<int>(config.numBands)));
    jsConfig.setProperty(rt, "sampleRate", jsi::Value(static_cast<int>(config.sampleRate)));
    jsConfig.setProperty(rt, "masterGainDB", jsi::Value(config.masterGainDB));
    jsConfig.setProperty(rt, "bypass", jsi::Value(config.bypass));
    return jsConfig;
}

jsi::Object NativeAudioCoreModule::equalizerInfoToJS(jsi::Runtime& rt, const NythCoreEqualizerInfo& info) const {
    jsi::Object jsInfo(rt);
    jsInfo.setProperty(rt, "numBands", jsi::Value(static_cast<int>(info.numBands)));
    jsInfo.setProperty(rt, "sampleRate", jsi::Value(static_cast<int>(info.sampleRate)));
    jsInfo.setProperty(rt, "masterGainDB", jsi::Value(info.masterGainDB));
    jsInfo.setProperty(rt, "bypass", jsi::Value(info.bypass));
    jsInfo.setProperty(rt, "state", jsi::String::createFromUtf8(rt, stateToString(info.state)));
    return jsInfo;
}

NythCoreBandConfig NativeAudioCoreModule::parseBandConfig(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    NythCoreBandConfig config = {0};
    config.bandIndex = 0;
    config.frequency = 1000.0;
    config.gainDB = 0.0;
    config.q = 1.0;
    config.type = CORE_FILTER_PEAK;
    config.enabled = true;

    if (jsConfig.hasProperty(rt, "bandIndex")) {
        config.bandIndex = static_cast<size_t>(jsConfig.getProperty(rt, "bandIndex").asNumber());
    }
    if (jsConfig.hasProperty(rt, "frequency")) {
        config.frequency = jsConfig.getProperty(rt, "frequency").asNumber();
    }
    if (jsConfig.hasProperty(rt, "gainDB")) {
        config.gainDB = jsConfig.getProperty(rt, "gainDB").asNumber();
    }
    if (jsConfig.hasProperty(rt, "q")) {
        config.q = jsConfig.getProperty(rt, "q").asNumber();
    }
    if (jsConfig.hasProperty(rt, "type")) {
        std::string typeStr = jsConfig.getProperty(rt, "type").asString(rt).utf8(rt);
        config.type = stringToFilterType(typeStr);
    }
    if (jsConfig.hasProperty(rt, "enabled")) {
        config.enabled = jsConfig.getProperty(rt, "enabled").asBool();
    }

    return config;
}

jsi::Object NativeAudioCoreModule::bandConfigToJS(jsi::Runtime& rt, const NythCoreBandConfig& config) const {
    jsi::Object jsConfig(rt);
    jsConfig.setProperty(rt, "bandIndex", jsi::Value(static_cast<int>(config.bandIndex)));
    jsConfig.setProperty(rt, "frequency", jsi::Value(config.frequency));
    jsConfig.setProperty(rt, "gainDB", jsi::Value(config.gainDB));
    jsConfig.setProperty(rt, "q", jsi::Value(config.q));
    jsConfig.setProperty(rt, "type", jsi::String::createFromUtf8(rt, filterTypeToString(config.type)));
    jsConfig.setProperty(rt, "enabled", jsi::Value(config.enabled));
    return jsConfig;
}

NythCoreFilterConfig NativeAudioCoreModule::parseFilterConfig(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    NythCoreFilterConfig config = {0};
    config.frequency = 1000.0;
    config.q = 1.0;
    config.gainDB = 0.0;
    config.type = CORE_FILTER_PEAK;

    if (jsConfig.hasProperty(rt, "frequency")) {
        config.frequency = jsConfig.getProperty(rt, "frequency").asNumber();
    }
    if (jsConfig.hasProperty(rt, "q")) {
        config.q = jsConfig.getProperty(rt, "q").asNumber();
    }
    if (jsConfig.hasProperty(rt, "gainDB")) {
        config.gainDB = jsConfig.getProperty(rt, "gainDB").asNumber();
    }
    if (jsConfig.hasProperty(rt, "type")) {
        std::string typeStr = jsConfig.getProperty(rt, "type").asString(rt).utf8(rt);
        config.type = stringToFilterType(typeStr);
    }

    return config;
}

jsi::Object NativeAudioCoreModule::filterConfigToJS(jsi::Runtime& rt, const NythCoreFilterConfig& config) const {
    jsi::Object jsConfig(rt);
    jsConfig.setProperty(rt, "frequency", jsi::Value(config.frequency));
    jsConfig.setProperty(rt, "q", jsi::Value(config.q));
    jsConfig.setProperty(rt, "gainDB", jsi::Value(config.gainDB));
    jsConfig.setProperty(rt, "type", jsi::String::createFromUtf8(rt, filterTypeToString(config.type)));
    return jsConfig;
}

jsi::Object NativeAudioCoreModule::filterInfoToJS(jsi::Runtime& rt, const NythCoreFilterInfo& info) const {
    jsi::Object jsInfo(rt);
    jsInfo.setProperty(rt, "a0", jsi::Value(info.a0));
    jsInfo.setProperty(rt, "a1", jsi::Value(info.a1));
    jsInfo.setProperty(rt, "a2", jsi::Value(info.a2));
    jsInfo.setProperty(rt, "b1", jsi::Value(info.b1));
    jsInfo.setProperty(rt, "b2", jsi::Value(info.b2));
    jsInfo.setProperty(rt, "y1", jsi::Value(info.y1));
    jsInfo.setProperty(rt, "y2", jsi::Value(info.y2));
    return jsInfo;
}

// === Conversion des vecteurs ===

std::vector<float> NativeAudioCoreModule::arrayToFloatVector(jsi::Runtime& rt, const jsi::Array& array) const {
    size_t length = array.length(rt);
    std::vector<float> result(length);
    for (size_t i = 0; i < length; ++i) {
        result[i] = static_cast<float>(array.getValueAtIndex(rt, i).asNumber());
    }
    return result;
}

jsi::Array NativeAudioCoreModule::floatVectorToArray(jsi::Runtime& rt, const std::vector<float>& vector) const {
    jsi::Array result(rt, vector.size());
    for (size_t i = 0; i < vector.size(); ++i) {
        result.setValueAtIndex(rt, i, jsi::Value(vector[i]));
    }
    return result;
}

// === Gestion des callbacks ===

void NativeAudioCoreModule::invokeJSCallback(const std::string& callbackName,
                                           std::function<void(jsi::Runtime&)> invocation) {
    // Pour l'instant, implémentation basique
    try {
        // TODO: Implémenter l'invocation sur le thread principal
        // invocation(*reinterpret_cast<jsi::Runtime*>(nullptr));
    } catch (...) {
        // Gérer les erreurs d'invocation
    }
}

// === Méthodes publiques ===

// Gestion du cycle de vie
void NativeAudioCoreModule::initialize(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(m_coreMutex);

    try {
        initializeEqualizer();
    } catch (const std::exception& e) {
        handleError(convertError("module_error"), std::string("Initialization failed: ") + e.what());
    }
}

jsi::Value NativeAudioCoreModule::isInitialized(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(m_coreMutex);
    return jsi::Value(m_currentState.load() == CORE_STATE_INITIALIZED);
}

jsi::Value NativeAudioCoreModule::dispose(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(m_coreMutex);

    if (m_equalizer) {
        m_equalizer.reset();
    }
    m_filters.clear();
    m_currentState = CORE_STATE_UNINITIALIZED;

    return jsi::Value(true);
}

// État et informations
jsi::Value NativeAudioCoreModule::getState(jsi::Runtime& rt) {
    return jsi::String::createFromUtf8(rt, stateToString(m_currentState.load()));
}

jsi::Value NativeAudioCoreModule::getErrorString(jsi::Runtime& rt, int errorCode) {
    NythCoreError error = static_cast<NythCoreError>(errorCode);
    return jsi::String::createFromUtf8(rt, errorToString(error));
}

// === Égaliseur ===

// Initialisation
jsi::Value NativeAudioCoreModule::equalizerInitialize(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(m_coreMutex);

    try {
        auto nativeConfig = parseEqualizerConfig(rt, config);
        initializeEqualizer();
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(convertError("config_error"), std::string("Equalizer initialization failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioCoreModule::equalizerIsInitialized(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(m_coreMutex);
    return jsi::Value(m_equalizer != nullptr);
}

jsi::Value NativeAudioCoreModule::equalizerRelease(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(m_coreMutex);

    if (m_equalizer) {
        m_equalizer.reset();
        m_currentState = CORE_STATE_UNINITIALIZED;
    }

    return jsi::Value(true);
}

// Configuration globale
jsi::Value NativeAudioCoreModule::equalizerSetMasterGain(jsi::Runtime& rt, double gainDB) {
    std::lock_guard<std::mutex> lock(m_coreMutex);

    if (!m_equalizer) {
        handleError(CORE_ERROR_NOT_INITIALIZED, "Equalizer not initialized");
        return jsi::Value(false);
    }

    try {
        m_equalizer->setMasterGain(gainDB);
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(CORE_ERROR_CONFIG_ERROR, std::string("Set master gain failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioCoreModule::equalizerSetBypass(jsi::Runtime& rt, bool bypass) {
    std::lock_guard<std::mutex> lock(m_coreMutex);

    if (!m_equalizer) {
        handleError(CORE_ERROR_NOT_INITIALIZED, "Equalizer not initialized");
        return jsi::Value(false);
    }

    try {
        m_equalizer->setBypass(bypass);
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(CORE_ERROR_CONFIG_ERROR, std::string("Set bypass failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioCoreModule::equalizerSetSampleRate(jsi::Runtime& rt, uint32_t sampleRate) {
    std::lock_guard<std::mutex> lock(m_coreMutex);

    if (!m_equalizer) {
        handleError(CORE_ERROR_NOT_INITIALIZED, "Equalizer not initialized");
        return jsi::Value(false);
    }

    try {
        m_equalizer->setSampleRate(sampleRate);
        currentSampleRate_ = sampleRate;
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(CORE_ERROR_CONFIG_ERROR, std::string("Set sample rate failed: ") + e.what());
        return jsi::Value(false);
    }
}

// Configuration des bandes
jsi::Value NativeAudioCoreModule::equalizerSetBand(jsi::Runtime& rt, size_t bandIndex, const jsi::Object& bandConfig) {
    std::lock_guard<std::mutex> lock(m_coreMutex);

    if (!m_equalizer) {
        handleError(CORE_ERROR_NOT_INITIALIZED, "Equalizer not initialized");
        return jsi::Value(false);
    }

    try {
        auto config = parseBandConfig(rt, bandConfig);
        m_equalizer->setBandFrequency(bandIndex, config.frequency);
        m_equalizer->setBandGain(bandIndex, config.gainDB);
        m_equalizer->setBandQ(bandIndex, config.q);
        m_equalizer->setBandEnabled(bandIndex, config.enabled);

        // Convert filter type
        AudioFX::FilterType type;
        switch (config.type) {
            case CORE_FILTER_LOWPASS: type = AudioFX::FilterType::LOWPASS; break;
            case CORE_FILTER_HIGHPASS: type = AudioFX::FilterType::HIGHPASS; break;
            case CORE_FILTER_BANDPASS: type = AudioFX::FilterType::BANDPASS; break;
            case CORE_FILTER_NOTCH: type = AudioFX::FilterType::NOTCH; break;
            case CORE_FILTER_PEAK: type = AudioFX::FilterType::PEAK; break;
            case CORE_FILTER_LOWSHELF: type = AudioFX::FilterType::LOWSHELF; break;
            case CORE_FILTER_HIGHSHELF: type = AudioFX::FilterType::HIGHSHELF; break;
            case CORE_FILTER_ALLPASS: type = AudioFX::FilterType::ALLPASS; break;
            default: return jsi::Value(false);
        }

        m_equalizer->setBandType(bandIndex, type);
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(CORE_ERROR_CONFIG_ERROR, std::string("Set band config failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioCoreModule::equalizerGetBand(jsi::Runtime& rt, size_t bandIndex) {
    std::lock_guard<std::mutex> lock(m_coreMutex);

    if (!m_equalizer) {
        handleError(CORE_ERROR_NOT_INITIALIZED, "Equalizer not initialized");
        return jsi::Value::null();
    }

    try {
        NythCoreBandConfig config = {0};
        config.bandIndex = bandIndex;
        config.frequency = m_equalizer->getBandFrequency(bandIndex);
        config.gainDB = m_equalizer->getBandGain(bandIndex);
        config.q = m_equalizer->getBandQ(bandIndex);
        config.enabled = m_equalizer->isBandEnabled(bandIndex);

        AudioFX::FilterType type = m_equalizer->getBandType(bandIndex);
        switch (type) {
            case AudioFX::FilterType::LOWPASS: config.type = CORE_FILTER_LOWPASS; break;
            case AudioFX::FilterType::HIGHPASS: config.type = CORE_FILTER_HIGHPASS; break;
            case AudioFX::FilterType::BANDPASS: config.type = CORE_FILTER_BANDPASS; break;
            case AudioFX::FilterType::NOTCH: config.type = CORE_FILTER_NOTCH; break;
            case AudioFX::FilterType::PEAK: config.type = CORE_FILTER_PEAK; break;
            case AudioFX::FilterType::LOWSHELF: config.type = CORE_FILTER_LOWSHELF; break;
            case AudioFX::FilterType::HIGHSHELF: config.type = CORE_FILTER_HIGHSHELF; break;
            case AudioFX::FilterType::ALLPASS: config.type = CORE_FILTER_ALLPASS; break;
            default: config.type = CORE_FILTER_PEAK; break;
        }

        return bandConfigToJS(rt, config);
    } catch (const std::exception& e) {
        handleError(CORE_ERROR_CONFIG_ERROR, std::string("Get band config failed: ") + e.what());
        return jsi::Value::null();
    }
}

// Simplified band control methods
jsi::Value NativeAudioCoreModule::equalizerSetBandGain(jsi::Runtime& rt, size_t bandIndex, double gainDB) {
    std::lock_guard<std::mutex> lock(m_coreMutex);
    if (!m_equalizer) return jsi::Value(false);
    try {
        m_equalizer->setBandGain(bandIndex, gainDB);
        return jsi::Value(true);
    } catch (...) {
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioCoreModule::equalizerSetBandFrequency(jsi::Runtime& rt, size_t bandIndex, double frequency) {
    std::lock_guard<std::mutex> lock(m_coreMutex);
    if (!m_equalizer) return jsi::Value(false);
    try {
        m_equalizer->setBandFrequency(bandIndex, frequency);
        return jsi::Value(true);
    } catch (...) {
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioCoreModule::equalizerSetBandQ(jsi::Runtime& rt, size_t bandIndex, double q) {
    std::lock_guard<std::mutex> lock(m_coreMutex);
    if (!m_equalizer) return jsi::Value(false);
    try {
        m_equalizer->setBandQ(bandIndex, q);
        return jsi::Value(true);
    } catch (...) {
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioCoreModule::equalizerSetBandType(jsi::Runtime& rt, size_t bandIndex, int filterType) {
    std::lock_guard<std::mutex> lock(m_coreMutex);
    if (!m_equalizer) return jsi::Value(false);
    try {
        AudioFX::FilterType type = static_cast<AudioFX::FilterType>(filterType);
        m_equalizer->setBandType(bandIndex, type);
        return jsi::Value(true);
    } catch (...) {
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioCoreModule::equalizerSetBandEnabled(jsi::Runtime& rt, size_t bandIndex, bool enabled) {
    std::lock_guard<std::mutex> lock(m_coreMutex);
    if (!m_equalizer) return jsi::Value(false);
    try {
        m_equalizer->setBandEnabled(bandIndex, enabled);
        return jsi::Value(true);
    } catch (...) {
        return jsi::Value(false);
    }
}

// Informations
jsi::Value NativeAudioCoreModule::equalizerGetInfo(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(m_coreMutex);

    if (!m_equalizer) {
        handleError(CORE_ERROR_NOT_INITIALIZED, "Equalizer not initialized");
        return jsi::Value::null();
    }

    try {
        NythCoreEqualizerInfo info = {0};
        info.numBands = m_equalizer->getNumBands();
        info.sampleRate = currentSampleRate_;
        info.masterGainDB = m_equalizer->getMasterGain();
        info.bypass = m_equalizer->isBypassed();
        info.state = m_currentState.load();

        return equalizerInfoToJS(rt, info);
    } catch (const std::exception& e) {
        handleError(CORE_ERROR_CONFIG_ERROR, std::string("Get equalizer info failed: ") + e.what());
        return jsi::Value::null();
    }
}

jsi::Value NativeAudioCoreModule::equalizerGetNumBands(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(m_coreMutex);
    if (!m_equalizer) return jsi::Value(0);
    return jsi::Value(static_cast<int>(m_equalizer->getNumBands()));
}

// Processing
jsi::Value NativeAudioCoreModule::equalizerProcessMono(jsi::Runtime& rt, const jsi::Array& input) {
    std::lock_guard<std::mutex> lock(m_coreMutex);

    if (!m_equalizer) {
        handleError(CORE_ERROR_NOT_INITIALIZED, "Equalizer not initialized");
        return jsi::Value::null();
    }

    try {
        auto inputVector = arrayToFloatVector(rt, input);
        std::vector<float> outputVector(inputVector.size());

        // TODO: Implémenter processMono avec les vecteurs
        // m_equalizer->process(inputVector, outputVector);

        return floatVectorToArray(rt, outputVector);
    } catch (const std::exception& e) {
        handleError(CORE_ERROR_PROCESSING_FAILED, std::string("Mono processing failed: ") + e.what());
        return jsi::Value::null();
    }
}

jsi::Value NativeAudioCoreModule::equalizerProcessStereo(jsi::Runtime& rt, const jsi::Array& inputL, const jsi::Array& inputR) {
    std::lock_guard<std::mutex> lock(m_coreMutex);

    if (!m_equalizer) {
        handleError(CORE_ERROR_NOT_INITIALIZED, "Equalizer not initialized");
        return jsi::Value::null();
    }

    try {
        auto inputLVector = arrayToFloatVector(rt, inputL);
        auto inputRVector = arrayToFloatVector(rt, inputR);
        std::vector<float> outputLVector(inputLVector.size());
        std::vector<float> outputRVector(inputRVector.size());

        // TODO: Corriger processStereo pour utiliser les vecteurs
        // m_equalizer->processStereo(inputLVector, inputRVector, outputLVector, outputRVector);

        jsi::Object result(rt);
        result.setProperty(rt, "left", floatVectorToArray(rt, outputLVector));
        result.setProperty(rt, "right", floatVectorToArray(rt, outputRVector));
        return result;
    } catch (const std::exception& e) {
        handleError(CORE_ERROR_PROCESSING_FAILED, std::string("Stereo processing failed: ") + e.what());
        return jsi::Value::null();
    }
}

// Presets
jsi::Value NativeAudioCoreModule::equalizerLoadPreset(jsi::Runtime& rt, const jsi::String& presetName) {
    std::lock_guard<std::mutex> lock(m_coreMutex);
    if (!m_equalizer) return jsi::Value(false);

    try {
        std::string preset = presetName.utf8(rt);
        // Implement preset loading logic here
        return jsi::Value(true);
    } catch (...) {
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioCoreModule::equalizerSavePreset(jsi::Runtime& rt, const jsi::String& presetName) {
    std::lock_guard<std::mutex> lock(m_coreMutex);
    if (!m_equalizer) return jsi::Value(false);

    try {
        std::string preset = presetName.utf8(rt);
        // Implement preset saving logic here
        return jsi::Value(true);
    } catch (...) {
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioCoreModule::equalizerResetAllBands(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(m_coreMutex);
    if (!m_equalizer) return jsi::Value(false);

    try {
        // TODO: Implémenter reset pour AudioEqualizer
        // m_equalizer->reset();
        return jsi::Value(true);
    } catch (...) {
        return jsi::Value(false);
    }
}

// === Filtres biquad individuels ===

// Gestion du cycle de vie
jsi::Value NativeAudioCoreModule::filterCreate(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(m_filterMutex);

    try {
        int64_t filterId = m_nextFilterId++;
        m_filters[filterId] = std::make_unique<AudioFX::BiquadFilter>();
        return jsi::Value(static_cast<double>(filterId));
    } catch (...) {
        return jsi::Value(-1.0);
    }
}

jsi::Value NativeAudioCoreModule::filterDestroy(jsi::Runtime& rt, int64_t filterId) {
    std::lock_guard<std::mutex> lock(m_filterMutex);

    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        m_filters.erase(it);
        return jsi::Value(true);
    }
    return jsi::Value(false);
}

// Configuration
jsi::Value NativeAudioCoreModule::filterSetConfig(jsi::Runtime& rt, int64_t filterId, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(m_filterMutex);

    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        try {
            auto filterConfig = parseFilterConfig(rt, config);
            AudioFX::FilterType type;
            switch (filterConfig.type) {
                case CORE_FILTER_LOWPASS: type = AudioFX::FilterType::LOWPASS; break;
                case CORE_FILTER_HIGHPASS: type = AudioFX::FilterType::HIGHPASS; break;
                case CORE_FILTER_BANDPASS: type = AudioFX::FilterType::BANDPASS; break;
                case CORE_FILTER_NOTCH: type = AudioFX::FilterType::NOTCH; break;
                case CORE_FILTER_PEAK: type = AudioFX::FilterType::PEAK; break;
                case CORE_FILTER_LOWSHELF: type = AudioFX::FilterType::LOWSHELF; break;
                case CORE_FILTER_HIGHSHELF: type = AudioFX::FilterType::HIGHSHELF; break;
                case CORE_FILTER_ALLPASS: type = AudioFX::FilterType::ALLPASS; break;
                default: return jsi::Value(false);
            }

            // Use the appropriate calculate method based on filter type
            switch (filterConfig.type) {
                case CORE_FILTER_LOWPASS:
                    it->second->calculateLowpass(filterConfig.frequency, 48000.0, filterConfig.q);
                    break;
                case CORE_FILTER_HIGHPASS:
                    it->second->calculateHighpass(filterConfig.frequency, 48000.0, filterConfig.q);
                    break;
                case CORE_FILTER_BANDPASS:
                    it->second->calculateBandpass(filterConfig.frequency, 48000.0, filterConfig.q);
                    break;
                case CORE_FILTER_NOTCH:
                    it->second->calculateNotch(filterConfig.frequency, 48000.0, filterConfig.q);
                    break;
                case CORE_FILTER_PEAK:
                    it->second->calculatePeaking(filterConfig.frequency, 48000.0, filterConfig.q, filterConfig.gainDB);
                    break;
                case CORE_FILTER_LOWSHELF:
                    it->second->calculateLowShelf(filterConfig.frequency, 48000.0, filterConfig.q, filterConfig.gainDB);
                    break;
                case CORE_FILTER_HIGHSHELF:
                    it->second->calculateHighShelf(filterConfig.frequency, 48000.0, filterConfig.q, filterConfig.gainDB);
                    break;
                case CORE_FILTER_ALLPASS:
                    it->second->calculateAllpass(filterConfig.frequency, 48000.0, filterConfig.q);
                    break;
                default:
                    return jsi::Value(false);
            }
            return jsi::Value(true);
        } catch (...) {
            return jsi::Value(false);
        }
    }
    return jsi::Value(false);
}

jsi::Value NativeAudioCoreModule::filterGetConfig(jsi::Runtime& rt, int64_t filterId) {
    std::lock_guard<std::mutex> lock(m_filterMutex);

    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        // Note: BiquadFilter doesn't expose getters, so we'll need to implement this
        NythCoreFilterConfig config = {0};
        config.frequency = 1000.0;
        config.q = 1.0;
        config.gainDB = 0.0;
        config.type = CORE_FILTER_PEAK;
        return filterConfigToJS(rt, config);
    }
    return jsi::Value::null();
}

// Type-specific filter setters - simplified implementations
jsi::Value NativeAudioCoreModule::filterSetLowpass(jsi::Runtime& rt, int64_t filterId, double frequency, double sampleRate, double q) {
    std::lock_guard<std::mutex> lock(m_filterMutex);
    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        try {
            it->second->calculateLowpass(frequency, 48000.0, q);
            return jsi::Value(true);
        } catch (...) {
            return jsi::Value(false);
        }
    }
    return jsi::Value(false);
}

jsi::Value NativeAudioCoreModule::filterSetHighpass(jsi::Runtime& rt, int64_t filterId, double frequency, double sampleRate, double q) {
    std::lock_guard<std::mutex> lock(m_filterMutex);
    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        try {
            it->second->calculateHighpass(frequency, 48000.0, q);
            return jsi::Value(true);
        } catch (...) {
            return jsi::Value(false);
        }
    }
    return jsi::Value(false);
}

jsi::Value NativeAudioCoreModule::filterSetBandpass(jsi::Runtime& rt, int64_t filterId, double frequency, double sampleRate, double q) {
    std::lock_guard<std::mutex> lock(m_filterMutex);
    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        try {
            it->second->calculateBandpass(frequency, 48000.0, q);
            return jsi::Value(true);
        } catch (...) {
            return jsi::Value(false);
        }
    }
    return jsi::Value(false);
}

jsi::Value NativeAudioCoreModule::filterSetNotch(jsi::Runtime& rt, int64_t filterId, double frequency, double sampleRate, double q) {
    std::lock_guard<std::mutex> lock(m_filterMutex);
    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        try {
            it->second->calculateNotch(frequency, 48000.0, q);
            return jsi::Value(true);
        } catch (...) {
            return jsi::Value(false);
        }
    }
    return jsi::Value(false);
}

jsi::Value NativeAudioCoreModule::filterSetPeaking(jsi::Runtime& rt, int64_t filterId, double frequency, double sampleRate, double q, double gainDB) {
    std::lock_guard<std::mutex> lock(m_filterMutex);
    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        try {
            it->second->calculatePeaking(frequency, 48000.0, q, gainDB);
            return jsi::Value(true);
        } catch (...) {
            return jsi::Value(false);
        }
    }
    return jsi::Value(false);
}

jsi::Value NativeAudioCoreModule::filterSetLowShelf(jsi::Runtime& rt, int64_t filterId, double frequency, double sampleRate, double q, double gainDB) {
    std::lock_guard<std::mutex> lock(m_filterMutex);
    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        try {
            it->second->calculateLowShelf(frequency, 48000.0, q, gainDB);
            return jsi::Value(true);
        } catch (...) {
            return jsi::Value(false);
        }
    }
    return jsi::Value(false);
}

jsi::Value NativeAudioCoreModule::filterSetHighShelf(jsi::Runtime& rt, int64_t filterId, double frequency, double sampleRate, double q, double gainDB) {
    std::lock_guard<std::mutex> lock(m_filterMutex);
    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        try {
            it->second->calculateHighShelf(frequency, 48000.0, q, gainDB);
            return jsi::Value(true);
        } catch (...) {
            return jsi::Value(false);
        }
    }
    return jsi::Value(false);
}

jsi::Value NativeAudioCoreModule::filterSetAllpass(jsi::Runtime& rt, int64_t filterId, double frequency, double sampleRate, double q) {
    std::lock_guard<std::mutex> lock(m_filterMutex);
    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        try {
            it->second->calculateAllpass(frequency, 48000.0, q);
            return jsi::Value(true);
        } catch (...) {
            return jsi::Value(false);
        }
    }
    return jsi::Value(false);
}

// Processing
jsi::Value NativeAudioCoreModule::filterProcessMono(jsi::Runtime& rt, int64_t filterId, const jsi::Array& input) {
    std::lock_guard<std::mutex> lock(m_filterMutex);

    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        try {
            auto inputVector = arrayToFloatVector(rt, input);
            std::vector<float> outputVector(inputVector.size());
            // TODO: BiquadFilter n'a pas processMono, utiliser process avec les vecteurs
            // it->second->process(inputVector, outputVector);
            return floatVectorToArray(rt, outputVector);
        } catch (...) {
            return jsi::Value::null();
        }
    }
    return jsi::Value::null();
}

jsi::Value NativeAudioCoreModule::filterProcessStereo(jsi::Runtime& rt, int64_t filterId, const jsi::Array& inputL, const jsi::Array& inputR) {
    std::lock_guard<std::mutex> lock(m_filterMutex);

    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        try {
            auto inputLVector = arrayToFloatVector(rt, inputL);
            auto inputRVector = arrayToFloatVector(rt, inputR);
            std::vector<float> outputLVector(inputLVector.size());
            std::vector<float> outputRVector(inputRVector.size());
            it->second->processStereo(inputLVector.data(), inputRVector.data(),
                                    outputLVector.data(), outputRVector.data(), inputLVector.size());

            jsi::Object result(rt);
            result.setProperty(rt, "left", floatVectorToArray(rt, outputLVector));
            result.setProperty(rt, "right", floatVectorToArray(rt, outputRVector));
            return result;
        } catch (...) {
            return jsi::Value::null();
        }
    }
    return jsi::Value::null();
}

// Informations
jsi::Value NativeAudioCoreModule::filterGetInfo(jsi::Runtime& rt, int64_t filterId) {
    std::lock_guard<std::mutex> lock(m_filterMutex);

    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        NythCoreFilterInfo info = {1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0}; // Default values
        return filterInfoToJS(rt, info);
    }
    return jsi::Value::null();
}

jsi::Value NativeAudioCoreModule::filterReset(jsi::Runtime& rt, int64_t filterId) {
    std::lock_guard<std::mutex> lock(m_filterMutex);

    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        try {
            it->second->reset();
            return jsi::Value(true);
        } catch (...) {
            return jsi::Value(false);
        }
    }
    return jsi::Value(false);
}

// === Utilitaires ===

// Conversion dB/linéaire
jsi::Value NativeAudioCoreModule::dbToLinear(jsi::Runtime& rt, double db) {
    return jsi::Value(NythCore_DBToLinear(db));
}

jsi::Value NativeAudioCoreModule::linearToDb(jsi::Runtime& rt, double linear) {
    return jsi::Value(NythCore_LinearToDB(linear));
}

// Validation
jsi::Value NativeAudioCoreModule::validateFrequency(jsi::Runtime& rt, double frequency, double sampleRate) {
    return jsi::Value(NythCore_ValidateFrequency(frequency, sampleRate));
}

jsi::Value NativeAudioCoreModule::validateQ(jsi::Runtime& rt, double q) {
    return jsi::Value(NythCore_ValidateQ(q));
}

jsi::Value NativeAudioCoreModule::validateGainDB(jsi::Runtime& rt, double gainDB) {
    return jsi::Value(NythCore_ValidateGainDB(gainDB));
}

// === Gestion mémoire ===

jsi::Value NativeAudioCoreModule::memoryInitialize(jsi::Runtime& rt, size_t poolSize) {
    std::lock_guard<std::mutex> lock(m_coreMutex);

    try {
        m_memoryPool = std::make_unique<AudioFX::LockFreeMemoryPool<float>>(poolSize);
        return jsi::Value(true);
    } catch (...) {
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioCoreModule::memoryRelease(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(m_coreMutex);
    m_memoryPool.reset();
    return jsi::Value(true);
}

jsi::Value NativeAudioCoreModule::memoryGetAvailable(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(m_coreMutex);
    if (m_memoryPool) {
        return jsi::Value(static_cast<int>(m_memoryPool->getAvailableCount()));
    }
    return jsi::Value(0);
}

jsi::Value NativeAudioCoreModule::memoryGetUsed(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(m_coreMutex);
    if (m_memoryPool) {
        return jsi::Value(static_cast<int>(m_memoryPool->getAllocatedCount()));
    }
    return jsi::Value(0);
}

// === Callbacks JavaScript ===

jsi::Value NativeAudioCoreModule::setAudioCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(m_coreMutex);
    m_jsCallbacks.audioCallback = std::make_shared<jsi::Function>(
        jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forUtf8(rt, "audioCallback"),
        0, [](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {
            return jsi::Value::undefined();
        }));
    return jsi::Value(true);
}

jsi::Value NativeAudioCoreModule::setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(m_coreMutex);
    m_jsCallbacks.errorCallback = std::make_shared<jsi::Function>(
        jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forUtf8(rt, "errorCallback"),
        0, [](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {
            return jsi::Value::undefined();
        }));
    return jsi::Value(true);
}

jsi::Value NativeAudioCoreModule::setStateCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(m_coreMutex);
    m_jsCallbacks.stateCallback = std::make_shared<jsi::Function>(
        jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forUtf8(rt, "stateChangeCallback"),
        0, [](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {
            return jsi::Value::undefined();
        }));
    return jsi::Value(true);
}

// === Installation du module ===
jsi::Value NativeAudioCoreModule::install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker) {
    // Installation directe du module dans le runtime JSI
    return jsi::Value(true);
}

// === Fonction d'enregistrement du module ===
std::shared_ptr<TurboModule> NativeAudioCoreModuleProvider(
    std::shared_ptr<CallInvoker> jsInvoker) {
    return std::make_shared<NativeAudioCoreModule>(jsInvoker);
}

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_CORE_ENABLED
