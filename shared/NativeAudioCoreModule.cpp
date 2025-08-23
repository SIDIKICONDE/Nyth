#include "NativeAudioCoreModule.h"

#if NYTH_AUDIO_CORE_ENABLED

#include "Audio/core/AudioEqualizer.hpp"
#include "Audio/core/BiquadFilter.hpp"
#include "Audio/core/MemoryPool.hpp"
#include "Audio/core/AudioError.hpp"
#include "Audio/core/EQPresetFactory.hpp"
#include "Audio/core/DbLookupTable.hpp"
#include "Audio/core/BiquadFilterSIMD.hpp"
#include "Audio/core/BiquadFilterOptimized.hpp"
#include "Audio/core/ThreadSafeBiquadFilter.hpp"
#include "Audio/core/BranchFreeAlgorithms.hpp"
#include <chrono>
#include <sstream>
#include <algorithm>
#include <cmath>
#include <map>

// === Instance globale pour l'API C ===
static std::unique_ptr<Audio::core::AudioEqualizer> g_audioEqualizer;
static std::map<int64_t, std::unique_ptr<AudioFX::BiquadFilter>> g_activeFilters;
static std::atomic<int64_t> g_nextFilterId{1};
static std::unique_ptr<AudioFX::LockFreeMemoryPool<float>> g_memoryPool;
static std::mutex g_globalMutex;
static NythCoreState g_currentState = CORE_STATE_UNINITIALIZED;
static NythCoreEqualizerConfig g_currentEqualizerConfig = {};

// === Instance pour les composants avancés ===
static AudioFX::DbLookupTable& g_dbLookupTable = AudioFX::DbLookupTable::getInstance();
static std::unordered_map<std::string, AudioFX::EQPreset> g_presetCache;

// === Composants SIMD et optimisés ===
static std::unique_ptr<AudioFX::BiquadFilterSIMD> g_simdFilter;
static std::unique_ptr<AudioFX::BiquadFilterOptimized> g_optimizedFilter;
static std::unique_ptr<AudioFX::ThreadSafeBiquadFilter> g_threadSafeFilter;

// === Algorithmes branch-free ===
using namespace AudioFX::BranchFree;

// === Implémentation partagée (privée au module) ===
namespace NythCoreImpl {

    // --- Conversion d'enums avec mapping explicite ---
    AudioFX::FilterType convertToAudioFXFilterType(NythCoreFilterType type) {
        switch (type) {
            case CORE_FILTER_LOWPASS:   return AudioFX::FilterType::LOWPASS;
            case CORE_FILTER_HIGHPASS:  return AudioFX::FilterType::HIGHPASS;
            case CORE_FILTER_BANDPASS:  return AudioFX::FilterType::BANDPASS;
            case CORE_FILTER_NOTCH:     return AudioFX::FilterType::NOTCH;
            case CORE_FILTER_PEAK:      return AudioFX::FilterType::PEAK;
            case CORE_FILTER_LOWSHELF:  return AudioFX::FilterType::LOWSHELF;
            case CORE_FILTER_HIGHSHELF: return AudioFX::FilterType::HIGHSHELF;
            case CORE_FILTER_ALLPASS:   return AudioFX::FilterType::ALLPASS;
            default:                    return AudioFX::FilterType::PEAK; // Default
        }
    }

    NythCoreFilterType convertFromAudioFXFilterType(AudioFX::FilterType type) {
        switch (type) {
            case AudioFX::FilterType::LOWPASS:   return CORE_FILTER_LOWPASS;
            case AudioFX::FilterType::HIGHPASS:  return CORE_FILTER_HIGHPASS;
            case AudioFX::FilterType::BANDPASS:  return CORE_FILTER_BANDPASS;
            case AudioFX::FilterType::NOTCH:     return CORE_FILTER_NOTCH;
            case AudioFX::FilterType::PEAK:      return CORE_FILTER_PEAK;
            case AudioFX::FilterType::LOWSHELF:  return CORE_FILTER_LOWSHELF;
            case AudioFX::FilterType::HIGHSHELF: return CORE_FILTER_HIGHSHELF;
            case AudioFX::FilterType::ALLPASS:   return CORE_FILTER_ALLPASS;
            default:                              return CORE_FILTER_PEAK; // Default
        }
    }

    // --- Helpers pour l'égaliseur ---

    bool equalizerSetMasterGain(Audio::core::AudioEqualizer* eq, double gainDB) {
        if (!eq) return false;
        eq->setMasterGain(gainDB);
        return true;
    }

    bool equalizerSetBypass(Audio::core::AudioEqualizer* eq, bool bypass) {
        if (!eq) return false;
        eq->setBypass(bypass);
        return true;
    }

    bool equalizerSetSampleRate(Audio::core::AudioEqualizer* eq, uint32_t sampleRate) {
        if (!eq) return false;
        eq->setSampleRate(sampleRate);
        return true;
    }

    bool equalizerSetBand(Audio::core::AudioEqualizer* eq, size_t bandIndex, const NythCoreBandConfig* config) {
        if (!eq || !config) return false;
        try {
            eq->setBandFrequency(bandIndex, config->frequency);
            eq->setBandGain(bandIndex, config->gainDB);
            eq->setBandQ(bandIndex, config->q);
            eq->setBandEnabled(bandIndex, config->enabled);

            AudioFX::FilterType type = convertToAudioFXFilterType(config->type);
            eq->setBandType(bandIndex, type);
            return true;
        } catch (...) {
            return false;
        }
    }

    bool equalizerProcessMono(Audio::core::AudioEqualizer* eq, const float* input, float* output, size_t numSamples) {
        if (!eq || !input || !output || numSamples == 0) return false;
        try {
            eq->processMono(input, output, numSamples);
            return true;
        } catch (...) {
            return false;
        }
    }
    
    bool equalizerProcessStereo(Audio::core::AudioEqualizer* eq, const float* inputL, const float* inputR, float* outputL, float* outputR, size_t numSamples) {
        if (!eq || !inputL || !inputR || !outputL || !outputR || numSamples == 0) return false;
        try {
            std::vector<float> inputLVec(inputL, inputL + numSamples);
            std::vector<float> inputRVec(inputR, inputR + numSamples);
            std::vector<float> outputLVec(numSamples);
            std::vector<float> outputRVec(numSamples);

            eq->processStereo(inputLVec, inputRVec, outputLVec, outputRVec);

            std::copy(outputLVec.begin(), outputLVec.end(), outputL);
            std::copy(outputRVec.begin(), outputRVec.end(), outputR);
            return true;
        } catch (...) {
            return false;
        }
    }

    // --- Helpers pour les filtres Biquad ---

    int64_t filterCreate(std::map<int64_t, std::unique_ptr<AudioFX::BiquadFilter>>& filters, std::atomic<int64_t>& nextId) {
        try {
            int64_t filterId = nextId++;
            filters[filterId] = std::make_unique<AudioFX::BiquadFilter>();
            return filterId;
        } catch (...) {
            return -1;
        }
    }
    
    bool filterDestroy(std::map<int64_t, std::unique_ptr<AudioFX::BiquadFilter>>& filters, int64_t filterId) {
        auto it = filters.find(filterId);
        if (it != filters.end()) {
            filters.erase(it);
            return true;
        }
        return false;
    }

    bool filterSetConfig(AudioFX::BiquadFilter* filter, const NythCoreFilterConfig* config, uint32_t sampleRate) {
        if (!filter || !config) return false;

        // Configuration du filtre principal
        switch (config->type) {
            case CORE_FILTER_LOWPASS:
                filter->calculateLowpass(config->frequency, sampleRate, config->q);
                break;
            case CORE_FILTER_HIGHPASS:
                filter->calculateHighpass(config->frequency, sampleRate, config->q);
                break;
            case CORE_FILTER_BANDPASS:
                filter->calculateBandpass(config->frequency, sampleRate, config->q);
                break;
            case CORE_FILTER_NOTCH:
                filter->calculateNotch(config->frequency, sampleRate, config->q);
                break;
            case CORE_FILTER_PEAK:
                filter->calculatePeaking(config->frequency, sampleRate, config->q, config->gainDB);
                break;
            case CORE_FILTER_LOWSHELF:
                filter->calculateLowShelf(config->frequency, sampleRate, config->q, config->gainDB);
                break;
            case CORE_FILTER_HIGHSHELF:
                filter->calculateHighShelf(config->frequency, sampleRate, config->q, config->gainDB);
                break;
            case CORE_FILTER_ALLPASS:
                filter->calculateAllpass(config->frequency, sampleRate, config->q);
                break;
            default:
                return false;
        }

        // Configuration des versions SIMD et optimisées si disponibles
        AudioFX::FilterType audioFXType = convertToAudioFXFilterType(config->type);
        if (g_simdFilter) {
            g_simdFilter->calculateCoefficients(
                audioFXType,
                config->frequency, config->q, config->gainDB, sampleRate
            );
        }
        if (g_optimizedFilter) {
            g_optimizedFilter->calculateCoefficients(
                audioFXType,
                config->frequency, config->q, config->gainDB, sampleRate
            );
        }
        if (g_threadSafeFilter) {
            g_threadSafeFilter->calculateCoefficients(
                audioFXType,
                config->frequency, config->q, config->gainDB, sampleRate
            );
        }

        return true;
    }
    
    bool filterProcessMono(AudioFX::BiquadFilter* filter, const float* input, float* output, size_t numSamples) {
        if (!filter) return false;
        filter->processMono(input, output, numSamples);
        return true;
    }
    
    bool filterProcessStereo(AudioFX::BiquadFilter* filter, const float* inputL, const float* inputR, float* outputL, float* outputR, size_t numSamples) {
        if (!filter) return false;
        filter->processStereo(inputL, inputR, outputL, outputR, numSamples);
        return true;
    }
    
    bool filterReset(AudioFX::BiquadFilter* filter) {
        if (!filter) return false;
        filter->reset();
        return true;
    }

} // namespace NythCoreImpl

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

        // Initialiser les composants avancés
        try {
            g_simdFilter = std::make_unique<AudioFX::BiquadFilterSIMD>();
            g_optimizedFilter = std::make_unique<AudioFX::BiquadFilterOptimized>();
            g_threadSafeFilter = std::make_unique<AudioFX::ThreadSafeBiquadFilter>();
        } catch (...) {
            // Les composants avancés sont optionnels, continuer sans eux
            g_simdFilter.reset();
            g_optimizedFilter.reset();
            g_threadSafeFilter.reset();
        }

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

    // Libérer les composants avancés
    g_simdFilter.reset();
    g_optimizedFilter.reset();
    g_threadSafeFilter.reset();

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

    if (NythCoreImpl::equalizerSetMasterGain(g_audioEqualizer.get(), gainDB)) {
        g_currentEqualizerConfig.masterGainDB = gainDB;
        return true;
    }
    return false;
}

bool NythCore_EqualizerSetBypass(bool bypass) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (!g_audioEqualizer) return false;

    if (NythCoreImpl::equalizerSetBypass(g_audioEqualizer.get(), bypass)) {
        g_currentEqualizerConfig.bypass = bypass;
        return true;
    }
    return false;
}

bool NythCore_EqualizerSetSampleRate(uint32_t sampleRate) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (!g_audioEqualizer) return false;

    if (NythCoreImpl::equalizerSetSampleRate(g_audioEqualizer.get(), sampleRate)) {
        g_currentEqualizerConfig.sampleRate = sampleRate;
        return true;
    }
    return false;
}

// Bandes
bool NythCore_EqualizerSetBand(size_t bandIndex, const NythCoreBandConfig* config) {
    if (!config) return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);

    return NythCoreImpl::equalizerSetBand(g_audioEqualizer.get(), bandIndex, config);
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

    return NythCoreImpl::equalizerProcessMono(g_audioEqualizer.get(), input, output, numSamples);
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

    return NythCoreImpl::equalizerProcessStereo(g_audioEqualizer.get(), inputL, inputR, outputL, outputR, numSamples);
}

// Presets
bool NythCore_EqualizerLoadPreset(const char* presetName) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (!g_audioEqualizer) return false;

    try {
        std::string preset(presetName);
        
        // Utiliser EQPresetFactory pour créer des presets prédéfinis
        AudioFX::EQPreset presetObj;
        if (preset == "flat") {
            presetObj = AudioFX::EQPresetFactory::createFlatPreset();
        } else if (preset == "rock") {
            presetObj = AudioFX::EQPresetFactory::createRockPreset();
        } else if (preset == "pop") {
            presetObj = AudioFX::EQPresetFactory::createPopPreset();
        } else if (preset == "jazz") {
            presetObj = AudioFX::EQPresetFactory::createJazzPreset();
        } else if (preset == "classical") {
            presetObj = AudioFX::EQPresetFactory::createClassicalPreset();
        } else if (preset == "electronic") {
            presetObj = AudioFX::EQPresetFactory::createElectronicPreset();
        } else if (preset == "vocal_boost") {
            presetObj = AudioFX::EQPresetFactory::createVocalBoostPreset();
        } else if (preset == "bass_boost") {
            presetObj = AudioFX::EQPresetFactory::createBassBoostPreset();
        } else if (preset == "treble_boost") {
            presetObj = AudioFX::EQPresetFactory::createTrebleBoostPreset();
        } else if (preset == "loudness") {
            presetObj = AudioFX::EQPresetFactory::createLoudnessPreset();
        } else {
            // Vérifier le cache des presets personnalisés
            auto it = g_presetCache.find(preset);
            if (it != g_presetCache.end()) {
                presetObj = it->second;
            } else {
                return false; // Preset non trouvé
            }
        }
        
        // Appliquer le preset
        g_audioEqualizer->loadPreset(presetObj);
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
        
        // Créer un nouveau preset avec les paramètres actuels
        AudioFX::EQPreset presetObj;
        presetObj.name = preset;
        
        // Sauvegarder les gains actuels
        g_audioEqualizer->savePreset(presetObj);
        
        // Mettre en cache
        g_presetCache[preset] = presetObj;
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

    return NythCoreImpl::filterCreate(g_activeFilters, g_nextFilterId);
}

bool NythCore_FilterDestroy(int64_t filterId) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return NythCoreImpl::filterDestroy(g_activeFilters, filterId);
}

// Configuration
bool NythCore_FilterSetConfig(int64_t filterId, const NythCoreFilterConfig* config) {
    if (!config) return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeFilters.find(filterId);
    if (it != g_activeFilters.end()) {
        return NythCoreImpl::filterSetConfig(it->second.get(), config, g_currentEqualizerConfig.sampleRate);
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
        NythCoreFilterConfig tempConfig = { frequency, q, 0.0, CORE_FILTER_LOWPASS };
        return NythCoreImpl::filterSetConfig(it->second.get(), &tempConfig, sampleRate);
    }
    return false;
}

bool NythCore_FilterSetHighpass(int64_t filterId, double frequency, double sampleRate, double q) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeFilters.find(filterId);
    if (it != g_activeFilters.end()) {
        NythCoreFilterConfig tempConfig = { frequency, q, 0.0, CORE_FILTER_HIGHPASS };
        return NythCoreImpl::filterSetConfig(it->second.get(), &tempConfig, sampleRate);
    }
    return false;
}

bool NythCore_FilterSetBandpass(int64_t filterId, double frequency, double sampleRate, double q) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeFilters.find(filterId);
    if (it != g_activeFilters.end()) {
        NythCoreFilterConfig tempConfig = { frequency, q, 0.0, CORE_FILTER_BANDPASS };
        return NythCoreImpl::filterSetConfig(it->second.get(), &tempConfig, sampleRate);
    }
    return false;
}

bool NythCore_FilterSetNotch(int64_t filterId, double frequency, double sampleRate, double q) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeFilters.find(filterId);
    if (it != g_activeFilters.end()) {
        NythCoreFilterConfig tempConfig = { frequency, q, 0.0, CORE_FILTER_NOTCH };
        return NythCoreImpl::filterSetConfig(it->second.get(), &tempConfig, sampleRate);
    }
    return false;
}

bool NythCore_FilterSetPeaking(int64_t filterId, double frequency, double sampleRate, double q, double gainDB) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    auto it = g_activeFilters.find(filterId);
    if (it != g_activeFilters.end()) {
        NythCoreFilterConfig tempConfig = { frequency, q, gainDB, CORE_FILTER_PEAK };
        return NythCoreImpl::filterSetConfig(it->second.get(), &tempConfig, sampleRate);
    }
    return false;
}

bool NythCore_FilterSetLowShelf(int64_t filterId, double frequency, double sampleRate, double q, double gainDB) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    auto it = g_activeFilters.find(filterId);
    if (it != g_activeFilters.end()) {
        NythCoreFilterConfig tempConfig = { frequency, q, gainDB, CORE_FILTER_LOWSHELF };
        return NythCoreImpl::filterSetConfig(it->second.get(), &tempConfig, sampleRate);
    }
    return false;
}

bool NythCore_FilterSetHighShelf(int64_t filterId, double frequency, double sampleRate, double q, double gainDB) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    auto it = g_activeFilters.find(filterId);
    if (it != g_activeFilters.end()) {
        NythCoreFilterConfig tempConfig = { frequency, q, gainDB, CORE_FILTER_HIGHSHELF };
        return NythCoreImpl::filterSetConfig(it->second.get(), &tempConfig, sampleRate);
    }
    return false;
}

bool NythCore_FilterSetAllpass(int64_t filterId, double frequency, double sampleRate, double q) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    auto it = g_activeFilters.find(filterId);
    if (it != g_activeFilters.end()) {
        NythCoreFilterConfig tempConfig = { frequency, q, 0.0, CORE_FILTER_ALLPASS };
        return NythCoreImpl::filterSetConfig(it->second.get(), &tempConfig, sampleRate);
    }
    return false;
}

// Processing
bool NythCore_FilterProcessMono(int64_t filterId, const float* input, float* output, size_t numSamples) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeFilters.find(filterId);
    if (it != g_activeFilters.end()) {
        return NythCoreImpl::filterProcessMono(it->second.get(), input, output, numSamples);
    }
    return false;
}

bool NythCore_FilterProcessStereo(int64_t filterId, const float* inputL, const float* inputR,
                                float* outputL, float* outputR, size_t numSamples) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    auto it = g_activeFilters.find(filterId);
    if (it != g_activeFilters.end()) {
        return NythCoreImpl::filterProcessStereo(it->second.get(), inputL, inputR, outputL, outputR, numSamples);
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
        try {
            return NythCoreImpl::filterReset(it->second.get());
        } catch (...) {
            return false;
        }
    }
    return false;
}

// === Utilitaires de conversion ===

// dB <-> Linéaire avec DbLookupTable et algorithmes branch-free pour de meilleures performances
double NythCore_DBToLinear(double db) {
    // Utiliser la table de conversion optimisée avec algorithmes branch-free
    float result = g_dbLookupTable.dbToLinear(static_cast<float>(db));

    // Utiliser abs branch-free pour éviter les branches conditionnelles
    result = AudioFX::BranchFree::abs(result);

    return static_cast<double>(result);
}

double NythCore_LinearToDB(double linear) {
    // Utiliser la table de conversion optimisée avec algorithmes branch-free
    float result = g_dbLookupTable.linearToDb(static_cast<float>(linear));

    // Utiliser max branch-free pour éviter les branches
    result = AudioFX::BranchFree::max(result, -120.0f); // Limite inférieure pour éviter -inf

    return static_cast<double>(result);
}

// Validation avec AudioError
bool NythCore_ValidateFrequency(double frequency, double sampleRate) {
    // Utiliser AudioValidator pour une validation robuste
    return AudioFX::AudioValidator::validateFrequency(frequency, sampleRate) == AudioFX::AudioError::OK;
}

bool NythCore_ValidateQ(double q) {
    // Utiliser AudioValidator pour une validation robuste
    return AudioFX::AudioValidator::validateQ(q) == AudioFX::AudioError::OK;
}

bool NythCore_ValidateGainDB(double gainDB) {
    // Validation personnalisée pour notre plage de gain
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
static NythCoreAudioCallback g_audioCallback = nullptr;
static NythCoreErrorCallback g_errorCallback = nullptr;
static NythCoreStateCallback g_stateCallback = nullptr;

void NythCore_SetAudioCallback(NythCoreAudioCallback callback) {
    g_audioCallback = callback;
}

void NythCore_SetErrorCallback(NythCoreErrorCallback callback) {
    g_errorCallback = callback;
}

void NythCore_SetStateCallback(NythCoreStateCallback callback) {
    g_stateCallback = callback;
}

// Helper function to invoke callbacks
void invokeCCallback(NythCoreError error, const char* message) {
    if (g_errorCallback) {
        g_errorCallback(error, message);
    }
}

void invokeCStateCallback(NythCoreState oldState, NythCoreState newState) {
    if (g_stateCallback) {
        g_stateCallback(oldState, newState);
    }
}

} // extern "C"

// === Implémentation C++ pour TurboModule ===

namespace facebook {
namespace react {

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
    if (m_jsCallbacks.errorCallback && m_runtime) {
        // Invoke error callback with error details
        try {
            jsi::Runtime& rt = *m_runtime;
            jsi::String errorStr = jsi::String::createFromUtf8(rt, message);
            jsi::String errorTypeStr = jsi::String::createFromUtf8(rt, errorToString(error));
            
            jsi::Object errorObj(rt);
            errorObj.setProperty(rt, "type", errorTypeStr);
            errorObj.setProperty(rt, "message", errorStr);
            errorObj.setProperty(rt, "code", jsi::Value(static_cast<int>(error)));
            
            m_jsCallbacks.errorCallback->call(rt, errorObj);
        } catch (...) {
            // Silently fail if callback invocation fails
        }
    }
}

void NativeAudioCoreModule::handleStateChange(NythCoreState oldState, NythCoreState newState) {
    std::lock_guard<std::mutex> lock(m_coreMutex);
    if (m_jsCallbacks.stateCallback && m_runtime) {
        // Invoke state change callback
        try {
            jsi::Runtime& rt = *m_runtime;
            jsi::String oldStateStr = jsi::String::createFromUtf8(rt, stateToString(oldState));
            jsi::String newStateStr = jsi::String::createFromUtf8(rt, stateToString(newState));
            
            jsi::Object stateObj(rt);
            stateObj.setProperty(rt, "oldState", oldStateStr);
            stateObj.setProperty(rt, "newState", newStateStr);
            stateObj.setProperty(rt, "oldStateCode", jsi::Value(static_cast<int>(oldState)));
            stateObj.setProperty(rt, "newStateCode", jsi::Value(static_cast<int>(newState)));
            
            m_jsCallbacks.stateCallback->call(rt, stateObj);
        } catch (...) {
            // Silently fail if callback invocation fails
        }
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
    NythCoreEqualizerConfig config = {};
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
    NythCoreBandConfig config = {};
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
    NythCoreFilterConfig config = {};
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
    // Basic implementation for now
    try {
        if (m_runtime) {
            invocation(*m_runtime);
        }
    } catch (...) {
        // Handle invocation errors silently
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
    return jsi::Value(NythCoreImpl::equalizerSetBypass(m_equalizer.get(), bypass));
}

jsi::Value NativeAudioCoreModule::equalizerSetSampleRate(jsi::Runtime& rt, uint32_t sampleRate) {
    std::lock_guard<std::mutex> lock(m_coreMutex);

    if (!m_equalizer) {
        handleError(CORE_ERROR_NOT_INITIALIZED, "Equalizer not initialized");
        return jsi::Value(false);
    }

    if (NythCoreImpl::equalizerSetSampleRate(m_equalizer.get(), sampleRate)) {
        currentSampleRate_ = sampleRate;
        return jsi::Value(true);
    }
    return jsi::Value(false);
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
        return jsi::Value(NythCoreImpl::equalizerSetBand(m_equalizer.get(), bandIndex, &config));
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
        NythCoreBandConfig config = {};
        config.bandIndex = bandIndex;
        config.frequency = m_equalizer->getBandFrequency(bandIndex);
        config.gainDB = m_equalizer->getBandGain(bandIndex);
        config.q = m_equalizer->getBandQ(bandIndex);
        config.enabled = m_equalizer->isBandEnabled(bandIndex);

        AudioFX::FilterType type = m_equalizer->getBandType(bandIndex);
        config.type = NythCoreImpl::convertFromAudioFXFilterType(type);

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
        NythCoreBandConfig config = {};
        config.type = static_cast<NythCoreFilterType>(filterType);
        // Convert the integer filterType to our enum, then to AudioFX::FilterType
        NythCoreFilterType coreType = static_cast<NythCoreFilterType>(filterType);
        AudioFX::FilterType type = NythCoreImpl::convertToAudioFXFilterType(coreType);
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
        NythCoreEqualizerInfo info = {};
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

        if (NythCoreImpl::equalizerProcessMono(m_equalizer.get(), inputVector.data(), outputVector.data(), inputVector.size())) {
            return floatVectorToArray(rt, outputVector);
        }
        
        handleError(CORE_ERROR_PROCESSING_FAILED, "Mono processing failed internally.");
        return jsi::Value::null();

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
        
        if (NythCoreImpl::equalizerProcessStereo(m_equalizer.get(), inputLVector.data(), inputRVector.data(), outputLVector.data(), outputRVector.data(), inputLVector.size())) {
            jsi::Object result(rt);
            result.setProperty(rt, "left", floatVectorToArray(rt, outputLVector));
            result.setProperty(rt, "right", floatVectorToArray(rt, outputRVector));
            return result;
        }

        handleError(CORE_ERROR_PROCESSING_FAILED, "Stereo processing failed internally.");
        return jsi::Value::null();

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
        
        // Utiliser EQPresetFactory pour créer des presets prédéfinis
        AudioFX::EQPreset presetObj;
        if (preset == "flat") {
            presetObj = AudioFX::EQPresetFactory::createFlatPreset();
        } else if (preset == "rock") {
            presetObj = AudioFX::EQPresetFactory::createRockPreset();
        } else if (preset == "pop") {
            presetObj = AudioFX::EQPresetFactory::createPopPreset();
        } else if (preset == "jazz") {
            presetObj = AudioFX::EQPresetFactory::createJazzPreset();
        } else if (preset == "classical") {
            presetObj = AudioFX::EQPresetFactory::createClassicalPreset();
        } else if (preset == "electronic") {
            presetObj = AudioFX::EQPresetFactory::createElectronicPreset();
        } else if (preset == "vocal_boost") {
            presetObj = AudioFX::EQPresetFactory::createVocalBoostPreset();
        } else if (preset == "bass_boost") {
            presetObj = AudioFX::EQPresetFactory::createBassBoostPreset();
        } else if (preset == "treble_boost") {
            presetObj = AudioFX::EQPresetFactory::createTrebleBoostPreset();
        } else if (preset == "loudness") {
            presetObj = AudioFX::EQPresetFactory::createLoudnessPreset();
        } else {
            // Vérifier le cache des presets personnalisés
            auto it = g_presetCache.find(preset);
            if (it != g_presetCache.end()) {
                presetObj = it->second;
            } else {
                return jsi::Value(false); // Preset non trouvé
            }
        }
        
        // Appliquer le preset
        m_equalizer->loadPreset(presetObj);
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
        
        // Créer un nouveau preset avec les paramètres actuels
        AudioFX::EQPreset presetObj;
        presetObj.name = preset;
        
        // Sauvegarder les gains actuels
        m_equalizer->savePreset(presetObj);
        
        // Mettre en cache
        g_presetCache[preset] = presetObj;
        return jsi::Value(true);
    } catch (...) {
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioCoreModule::equalizerResetAllBands(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(m_coreMutex);
    if (!m_equalizer) return jsi::Value(false);

    try {
        // Reset all bands to default values
        m_equalizer->reset();
        return jsi::Value(true);
    } catch (...) {
        return jsi::Value(false);
    }
}

// === Filtres biquad individuels ===

// Gestion du cycle de vie
jsi::Value NativeAudioCoreModule::filterCreate(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(m_filterMutex);

    int64_t filterId = NythCoreImpl::filterCreate(m_filters, m_nextFilterId);
    return jsi::Value(static_cast<double>(filterId));
}

jsi::Value NativeAudioCoreModule::filterDestroy(jsi::Runtime& rt, int64_t filterId) {
    std::lock_guard<std::mutex> lock(m_filterMutex);
    return jsi::Value(NythCoreImpl::filterDestroy(m_filters, filterId));
}

// Configuration
jsi::Value NativeAudioCoreModule::filterSetConfig(jsi::Runtime& rt, int64_t filterId, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(m_filterMutex);

    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        try {
            auto filterConfig = parseFilterConfig(rt, config);
            return jsi::Value(NythCoreImpl::filterSetConfig(it->second.get(), &filterConfig, currentSampleRate_));
        } catch (...) {
            return jsi::Value(false);
        }
    }
    return jsi::Value(false);
}

// Type-specific filter setters - simplified implementations
jsi::Value NativeAudioCoreModule::filterSetLowpass(jsi::Runtime& rt, int64_t filterId, double frequency, double sampleRate, double q) {
    std::lock_guard<std::mutex> lock(m_filterMutex);
    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        NythCoreFilterConfig config = { frequency, q, 0.0, CORE_FILTER_LOWPASS };
        return jsi::Value(NythCoreImpl::filterSetConfig(it->second.get(), &config, currentSampleRate_));
    }
    return jsi::Value(false);
}

jsi::Value NativeAudioCoreModule::filterSetHighpass(jsi::Runtime& rt, int64_t filterId, double frequency, double sampleRate, double q) {
    std::lock_guard<std::mutex> lock(m_filterMutex);
    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        NythCoreFilterConfig config = { frequency, q, 0.0, CORE_FILTER_HIGHPASS };
        return jsi::Value(NythCoreImpl::filterSetConfig(it->second.get(), &config, currentSampleRate_));
    }
    return jsi::Value(false);
}

jsi::Value NativeAudioCoreModule::filterSetBandpass(jsi::Runtime& rt, int64_t filterId, double frequency, double sampleRate, double q) {
    std::lock_guard<std::mutex> lock(m_filterMutex);
    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        NythCoreFilterConfig config = { frequency, q, 0.0, CORE_FILTER_BANDPASS };
        return jsi::Value(NythCoreImpl::filterSetConfig(it->second.get(), &config, currentSampleRate_));
    }
    return jsi::Value(false);
}

jsi::Value NativeAudioCoreModule::filterSetNotch(jsi::Runtime& rt, int64_t filterId, double frequency, double sampleRate, double q) {
    std::lock_guard<std::mutex> lock(m_filterMutex);
    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        NythCoreFilterConfig config = { frequency, q, 0.0, CORE_FILTER_NOTCH };
        return jsi::Value(NythCoreImpl::filterSetConfig(it->second.get(), &config, currentSampleRate_));
    }
    return jsi::Value(false);
}

jsi::Value NativeAudioCoreModule::filterSetPeaking(jsi::Runtime& rt, int64_t filterId, double frequency, double sampleRate, double q, double gainDB) {
    std::lock_guard<std::mutex> lock(m_filterMutex);
    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        NythCoreFilterConfig config = { frequency, q, gainDB, CORE_FILTER_PEAK };
        return jsi::Value(NythCoreImpl::filterSetConfig(it->second.get(), &config, currentSampleRate_));
    }
    return jsi::Value(false);
}

jsi::Value NativeAudioCoreModule::filterSetLowShelf(jsi::Runtime& rt, int64_t filterId, double frequency, double sampleRate, double q, double gainDB) {
    std::lock_guard<std::mutex> lock(m_filterMutex);
    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        NythCoreFilterConfig config = { frequency, q, gainDB, CORE_FILTER_LOWSHELF };
        return jsi::Value(NythCoreImpl::filterSetConfig(it->second.get(), &config, currentSampleRate_));
    }
    return jsi::Value(false);
}

jsi::Value NativeAudioCoreModule::filterSetHighShelf(jsi::Runtime& rt, int64_t filterId, double frequency, double sampleRate, double q, double gainDB) {
    std::lock_guard<std::mutex> lock(m_filterMutex);
    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        NythCoreFilterConfig config = { frequency, q, gainDB, CORE_FILTER_HIGHSHELF };
        return jsi::Value(NythCoreImpl::filterSetConfig(it->second.get(), &config, currentSampleRate_));
    }
    return jsi::Value(false);
}

jsi::Value NativeAudioCoreModule::filterSetAllpass(jsi::Runtime& rt, int64_t filterId, double frequency, double sampleRate, double q) {
    std::lock_guard<std::mutex> lock(m_filterMutex);
    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        NythCoreFilterConfig config = { frequency, q, 0.0, CORE_FILTER_ALLPASS };
        return jsi::Value(NythCoreImpl::filterSetConfig(it->second.get(), &config, currentSampleRate_));
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
            if(NythCoreImpl::filterProcessMono(it->second.get(), inputVector.data(), outputVector.data(), inputVector.size())) {
                return floatVectorToArray(rt, outputVector);
            }
        } catch (...) {
            // fall through to return null
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
            
            if (NythCoreImpl::filterProcessStereo(it->second.get(), inputLVector.data(), inputRVector.data(), outputLVector.data(), outputRVector.data(), inputLVector.size())) {
                jsi::Object result(rt);
                result.setProperty(rt, "left", floatVectorToArray(rt, outputLVector));
                result.setProperty(rt, "right", floatVectorToArray(rt, outputRVector));
                return result;
            }
        } catch (...) {
            // fall through to return null
        }
    }
    return jsi::Value::null();
}

// Informations
jsi::Value NativeAudioCoreModule::filterGetConfig(jsi::Runtime& rt, int64_t filterId) {
    std::lock_guard<std::mutex> lock(m_filterMutex);

    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        // Note: BiquadFilter doesn't expose getters, so we'll need to implement this
        NythCoreFilterConfig config = {};
        config.frequency = 1000.0;
        config.q = 1.0;
        config.gainDB = 0.0;
        config.type = CORE_FILTER_PEAK;
        return filterConfigToJS(rt, config);
    }
    return jsi::Value::null();
}

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
            return jsi::Value(NythCoreImpl::filterReset(it->second.get()));
        } catch (...) {
            return jsi::Value(false);
        }
    }
    return jsi::Value(false);
}

// === Utilitaires ===

// Conversion dB/linéaire avec DbLookupTable pour de meilleures performances
jsi::Value NativeAudioCoreModule::dbToLinear(jsi::Runtime& rt, double db) {
    return jsi::Value(NythCore_DBToLinear(db));
}

jsi::Value NativeAudioCoreModule::linearToDb(jsi::Runtime& rt, double linear) {
    return jsi::Value(NythCore_LinearToDB(linear));
}

// Validation avec AudioError
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
    m_runtime = &rt;
    m_jsCallbacks.audioCallback = std::make_shared<jsi::Function>(callback);
    return jsi::Value(true);
}

jsi::Value NativeAudioCoreModule::setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(m_coreMutex);
    m_runtime = &rt;
    m_jsCallbacks.errorCallback = std::make_shared<jsi::Function>(callback);
    return jsi::Value(true);
}

jsi::Value NativeAudioCoreModule::setStateCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(m_coreMutex);
    m_runtime = &rt;
    m_jsCallbacks.stateCallback = std::make_shared<jsi::Function>(callback);
    return jsi::Value(true);
}

// === Installation du module ===
jsi::Value NativeAudioCoreModule::install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker) {
    auto module = std::make_shared<NativeAudioCoreModule>(jsInvoker);
    
    auto object = jsi::Object(rt);
    
    // Enregistrer toutes les méthodes
    auto registerMethod = [&](const char* name, size_t paramCount, 
                             std::function<jsi::Value(NativeAudioCoreModule*, jsi::Runtime&, const jsi::Value*, size_t)> method) {
        object.setProperty(rt, name, jsi::Function::createFromHostFunction(
            rt,
            jsi::PropNameID::forAscii(rt, name),
            static_cast<unsigned int>(paramCount),
            [module, method](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t count) -> jsi::Value {
                return method(module.get(), rt, args, count);
            }
        ));
    };
    
    // === Gestion du cycle de vie ===
    registerMethod("initialize", 0, [](auto* m, auto& rt, auto*, auto) { 
        m->initialize(rt); 
        return jsi::Value::undefined();
    });
    
    registerMethod("isInitialized", 0, [](auto* m, auto& rt, auto*, auto) { 
        return m->isInitialized(rt); 
    });
    
    registerMethod("dispose", 0, [](auto* m, auto& rt, auto*, auto) { 
        return m->dispose(rt);
    });
    
    // === État et informations ===
    registerMethod("getState", 0, [](auto* m, auto& rt, auto*, auto) { 
        return m->getState(rt); 
    });
    
    registerMethod("getErrorString", 1, [](auto* m, auto& rt, auto* args, auto) { 
        return m->getErrorString(rt, static_cast<int>(args[0].asNumber())); 
    });
    
    // === Égaliseur ===
    registerMethod("equalizerInitialize", 1, [](auto* m, auto& rt, auto* args, auto) { 
        return m->equalizerInitialize(rt, args[0].asObject(rt)); 
    });
    
    registerMethod("equalizerIsInitialized", 0, [](auto* m, auto& rt, auto*, auto) { 
        return m->equalizerIsInitialized(rt); 
    });
    
    registerMethod("equalizerRelease", 0, [](auto* m, auto& rt, auto*, auto) { 
        return m->equalizerRelease(rt);
    });
    
    registerMethod("equalizerSetMasterGain", 1, [](auto* m, auto& rt, auto* args, auto) { 
        return m->equalizerSetMasterGain(rt, args[0].asNumber()); 
    });
    
    registerMethod("equalizerSetBypass", 1, [](auto* m, auto& rt, auto* args, auto) { 
        return m->equalizerSetBypass(rt, args[0].asBool()); 
    });
    
    registerMethod("equalizerSetSampleRate", 1, [](auto* m, auto& rt, auto* args, auto) { 
        return m->equalizerSetSampleRate(rt, static_cast<uint32_t>(args[0].asNumber())); 
    });
    
    // === Configuration des bandes ===
    registerMethod("equalizerSetBand", 2, [](auto* m, auto& rt, auto* args, auto) { 
        return m->equalizerSetBand(rt, static_cast<size_t>(args[0].asNumber()), args[1].asObject(rt)); 
    });
    
    registerMethod("equalizerGetBand", 1, [](auto* m, auto& rt, auto* args, auto) { 
        return m->equalizerGetBand(rt, static_cast<size_t>(args[0].asNumber())); 
    });
    
    registerMethod("equalizerSetBandGain", 2, [](auto* m, auto& rt, auto* args, auto) { 
        return m->equalizerSetBandGain(rt, static_cast<size_t>(args[0].asNumber()), args[1].asNumber()); 
    });
    
    registerMethod("equalizerSetBandFrequency", 2, [](auto* m, auto& rt, auto* args, auto) { 
        return m->equalizerSetBandFrequency(rt, static_cast<size_t>(args[0].asNumber()), args[1].asNumber()); 
    });
    
    registerMethod("equalizerSetBandQ", 2, [](auto* m, auto& rt, auto* args, auto) { 
        return m->equalizerSetBandQ(rt, static_cast<size_t>(args[0].asNumber()), args[1].asNumber()); 
    });
    
    registerMethod("equalizerSetBandType", 2, [](auto* m, auto& rt, auto* args, auto) { 
        return m->equalizerSetBandType(rt, static_cast<size_t>(args[0].asNumber()), static_cast<int>(args[1].asNumber())); 
    });
    
    registerMethod("equalizerSetBandEnabled", 2, [](auto* m, auto& rt, auto* args, auto) { 
        return m->equalizerSetBandEnabled(rt, static_cast<size_t>(args[0].asNumber()), args[1].asBool()); 
    });
    
    // === Informations égaliseur ===
    registerMethod("equalizerGetInfo", 0, [](auto* m, auto& rt, auto*, auto) { 
        return m->equalizerGetInfo(rt); 
    });
    
    registerMethod("equalizerGetNumBands", 0, [](auto* m, auto& rt, auto*, auto) { 
        return m->equalizerGetNumBands(rt); 
    });
    
    // === Processing égaliseur ===
    registerMethod("equalizerProcessMono", 1, [](auto* m, auto& rt, auto* args, auto) { 
        return m->equalizerProcessMono(rt, args[0].asObject(rt).asArray(rt)); 
    });
    
    registerMethod("equalizerProcessStereo", 2, [](auto* m, auto& rt, auto* args, auto) { 
        return m->equalizerProcessStereo(rt, args[0].asObject(rt).asArray(rt), args[1].asObject(rt).asArray(rt)); 
    });
    
    // === Presets ===
    registerMethod("equalizerLoadPreset", 1, [](auto* m, auto& rt, auto* args, auto) { 
        return m->equalizerLoadPreset(rt, args[0].asString(rt)); 
    });
    
    registerMethod("equalizerSavePreset", 1, [](auto* m, auto& rt, auto* args, auto) { 
        return m->equalizerSavePreset(rt, args[0].asString(rt)); 
    });
    
    registerMethod("equalizerResetAllBands", 0, [](auto* m, auto& rt, auto*, auto) { 
        return m->equalizerResetAllBands(rt); 
    });
    
    registerMethod("getAvailablePresets", 0, [](auto* m, auto& rt, auto*, auto) { 
        return m->getAvailablePresets(rt); 
    });
    
    // === Filtres biquad ===
    registerMethod("filterCreate", 0, [](auto* m, auto& rt, auto*, auto) { 
        return m->filterCreate(rt); 
    });
    
    registerMethod("filterDestroy", 1, [](auto* m, auto& rt, auto* args, auto) { 
        return m->filterDestroy(rt, static_cast<int64_t>(args[0].asNumber())); 
    });
    
    registerMethod("filterSetConfig", 2, [](auto* m, auto& rt, auto* args, auto) { 
        return m->filterSetConfig(rt, static_cast<int64_t>(args[0].asNumber()), args[1].asObject(rt)); 
    });
    
    registerMethod("filterGetConfig", 1, [](auto* m, auto& rt, auto* args, auto) { 
        return m->filterGetConfig(rt, static_cast<int64_t>(args[0].asNumber())); 
    });
    
    // === Types de filtres ===
    registerMethod("filterSetLowpass", 4, [](auto* m, auto& rt, auto* args, auto) { 
        return m->filterSetLowpass(rt, static_cast<int64_t>(args[0].asNumber()), args[1].asNumber(), args[2].asNumber(), args[3].asNumber()); 
    });
    
    registerMethod("filterSetHighpass", 4, [](auto* m, auto& rt, auto* args, auto) { 
        return m->filterSetHighpass(rt, static_cast<int64_t>(args[0].asNumber()), args[1].asNumber(), args[2].asNumber(), args[3].asNumber()); 
    });
    
    registerMethod("filterSetBandpass", 4, [](auto* m, auto& rt, auto* args, auto) { 
        return m->filterSetBandpass(rt, static_cast<int64_t>(args[0].asNumber()), args[1].asNumber(), args[2].asNumber(), args[3].asNumber()); 
    });
    
    registerMethod("filterSetNotch", 4, [](auto* m, auto& rt, auto* args, auto) { 
        return m->filterSetNotch(rt, static_cast<int64_t>(args[0].asNumber()), args[1].asNumber(), args[2].asNumber(), args[3].asNumber()); 
    });
    
    registerMethod("filterSetPeaking", 5, [](auto* m, auto& rt, auto* args, auto) { 
        return m->filterSetPeaking(rt, static_cast<int64_t>(args[0].asNumber()), args[1].asNumber(), args[2].asNumber(), args[3].asNumber(), args[4].asNumber()); 
    });
    
    registerMethod("filterSetLowShelf", 5, [](auto* m, auto& rt, auto* args, auto) { 
        return m->filterSetLowShelf(rt, static_cast<int64_t>(args[0].asNumber()), args[1].asNumber(), args[2].asNumber(), args[3].asNumber(), args[4].asNumber()); 
    });
    
    registerMethod("filterSetHighShelf", 5, [](auto* m, auto& rt, auto* args, auto) { 
        return m->filterSetHighShelf(rt, static_cast<int64_t>(args[0].asNumber()), args[1].asNumber(), args[2].asNumber(), args[3].asNumber(), args[4].asNumber()); 
    });
    
    registerMethod("filterSetAllpass", 4, [](auto* m, auto& rt, auto* args, auto) { 
        return m->filterSetAllpass(rt, static_cast<int64_t>(args[0].asNumber()), args[1].asNumber(), args[2].asNumber(), args[3].asNumber()); 
    });
    
    // === Processing filtres ===
    registerMethod("filterProcessMono", 2, [](auto* m, auto& rt, auto* args, auto) { 
        return m->filterProcessMono(rt, static_cast<int64_t>(args[0].asNumber()), args[1].asObject(rt).asArray(rt)); 
    });
    
    registerMethod("filterProcessStereo", 3, [](auto* m, auto& rt, auto* args, auto) { 
        return m->filterProcessStereo(rt, static_cast<int64_t>(args[0].asNumber()), args[1].asObject(rt).asArray(rt), args[2].asObject(rt).asArray(rt)); 
    });
    
    // === Informations filtres ===
    registerMethod("filterGetInfo", 1, [](auto* m, auto& rt, auto* args, auto) { 
        return m->filterGetInfo(rt, static_cast<int64_t>(args[0].asNumber())); 
    });
    
    registerMethod("filterReset", 1, [](auto* m, auto& rt, auto* args, auto) { 
        return m->filterReset(rt, static_cast<int64_t>(args[0].asNumber())); 
    });
    
    // === Utilitaires ===
    registerMethod("dbToLinear", 1, [](auto* m, auto& rt, auto* args, auto) { 
        return m->dbToLinear(rt, args[0].asNumber()); 
    });
    
    registerMethod("linearToDb", 1, [](auto* m, auto& rt, auto* args, auto) { 
        return m->linearToDb(rt, args[0].asNumber()); 
    });
    
    registerMethod("validateFrequency", 2, [](auto* m, auto& rt, auto* args, auto) { 
        return m->validateFrequency(rt, args[0].asNumber(), args[1].asNumber()); 
    });
    
    registerMethod("validateQ", 1, [](auto* m, auto& rt, auto* args, auto) { 
        return m->validateQ(rt, args[0].asNumber()); 
    });
    
    registerMethod("validateGainDB", 1, [](auto* m, auto& rt, auto* args, auto) { 
        return m->validateGainDB(rt, args[0].asNumber()); 
    });
    
    // === Gestion mémoire ===
    registerMethod("memoryInitialize", 1, [](auto* m, auto& rt, auto* args, auto) { 
        return m->memoryInitialize(rt, static_cast<size_t>(args[0].asNumber())); 
    });
    
    registerMethod("memoryRelease", 0, [](auto* m, auto& rt, auto*, auto) { 
        return m->memoryRelease(rt);
    });
    
    registerMethod("memoryGetAvailable", 0, [](auto* m, auto& rt, auto*, auto) { 
        return m->memoryGetAvailable(rt); 
    });
    
    registerMethod("memoryGetUsed", 0, [](auto* m, auto& rt, auto*, auto) { 
        return m->memoryGetUsed(rt); 
    });
    
    // === Callbacks ===
    registerMethod("setAudioCallback", 1, [](auto* m, auto& rt, auto* args, auto) { 
        return m->setAudioCallback(rt, args[0].asObject(rt).asFunction(rt)); 
    });
    
    registerMethod("setErrorCallback", 1, [](auto* m, auto& rt, auto* args, auto) { 
        return m->setErrorCallback(rt, args[0].asObject(rt).asFunction(rt)); 
    });
    
    registerMethod("setStateCallback", 1, [](auto* m, auto& rt, auto* args, auto) { 
        return m->setStateCallback(rt, args[0].asObject(rt).asFunction(rt)); 
    });
    
    // === Contrôle de performance ===
    registerMethod("enableSIMD", 1, [](auto* m, auto& rt, auto* args, auto) { 
        return m->enableSIMD(rt, args[0].asBool()); 
    });
    
    registerMethod("enableOptimizedProcessing", 1, [](auto* m, auto& rt, auto* args, auto) { 
        return m->enableOptimizedProcessing(rt, args[0].asBool()); 
    });
    
    registerMethod("enableThreadSafe", 1, [](auto* m, auto& rt, auto* args, auto) { 
        return m->enableThreadSafe(rt, args[0].asBool()); 
    });
    
    registerMethod("getCapabilities", 0, [](auto* m, auto& rt, auto*, auto) { 
        return m->getCapabilities(rt); 
    });
    
    // Installer le module dans le runtime global
    rt.global().setProperty(rt, "NativeAudioCoreModule", object);
    
    return object;
}

// === Fonction d'enregistrement du module ===
std::shared_ptr<TurboModule> NativeAudioCoreModuleProvider(
    std::shared_ptr<CallInvoker> jsInvoker) {
    return std::make_shared<NativeAudioCoreModule>(jsInvoker);
}

// === Fonctions utilitaires supplémentaires ===

// Contrôle de performance - activer/désactiver SIMD
jsi::Value NativeAudioCoreModule::enableSIMD(jsi::Runtime& rt, bool enable) {
    std::lock_guard<std::mutex> lock(m_coreMutex);
    try {
        if (enable && !g_simdFilter) {
            g_simdFilter = std::make_unique<AudioFX::BiquadFilterSIMD>();
        } else if (!enable && g_simdFilter) {
            g_simdFilter.reset();
        }
        return jsi::Value(true);
    } catch (...) {
        return jsi::Value(false);
    }
}

// Contrôle de performance - activer/désactiver les optimisations
jsi::Value NativeAudioCoreModule::enableOptimizedProcessing(jsi::Runtime& rt, bool enable) {
    std::lock_guard<std::mutex> lock(m_coreMutex);
    try {
        if (enable && !g_optimizedFilter) {
            g_optimizedFilter = std::make_unique<AudioFX::BiquadFilterOptimized>();
        } else if (!enable && g_optimizedFilter) {
            g_optimizedFilter.reset();
        }
        return jsi::Value(true);
    } catch (...) {
        return jsi::Value(false);
    }
}

// Contrôle thread-safety
jsi::Value NativeAudioCoreModule::enableThreadSafe(jsi::Runtime& rt, bool enable) {
    std::lock_guard<std::mutex> lock(m_coreMutex);
    try {
        if (enable && !g_threadSafeFilter) {
            g_threadSafeFilter = std::make_unique<AudioFX::ThreadSafeBiquadFilter>();
        } else if (!enable && g_threadSafeFilter) {
            g_threadSafeFilter.reset();
        }
        return jsi::Value(true);
    } catch (...) {
        return jsi::Value(false);
    }
}

// Lister les presets disponibles
jsi::Value NativeAudioCoreModule::getAvailablePresets(jsi::Runtime& rt) {
    try {
        jsi::Array presetArray(rt, 11); // 10 presets prédéfinis + presets personnalisés
        
        // Presets prédéfinis
        presetArray.setValueAtIndex(rt, 0, jsi::String::createFromUtf8(rt, "flat"));
        presetArray.setValueAtIndex(rt, 1, jsi::String::createFromUtf8(rt, "rock"));
        presetArray.setValueAtIndex(rt, 2, jsi::String::createFromUtf8(rt, "pop"));
        presetArray.setValueAtIndex(rt, 3, jsi::String::createFromUtf8(rt, "jazz"));
        presetArray.setValueAtIndex(rt, 4, jsi::String::createFromUtf8(rt, "classical"));
        presetArray.setValueAtIndex(rt, 5, jsi::String::createFromUtf8(rt, "electronic"));
        presetArray.setValueAtIndex(rt, 6, jsi::String::createFromUtf8(rt, "vocal_boost"));
        presetArray.setValueAtIndex(rt, 7, jsi::String::createFromUtf8(rt, "bass_boost"));
        presetArray.setValueAtIndex(rt, 8, jsi::String::createFromUtf8(rt, "treble_boost"));
        presetArray.setValueAtIndex(rt, 9, jsi::String::createFromUtf8(rt, "loudness"));
        
        // Ajouter les presets personnalisés
        size_t customIndex = 10;
        for (const auto& [name, preset] : g_presetCache) {
            if (customIndex < presetArray.length(rt)) {
                presetArray.setValueAtIndex(rt, customIndex, jsi::String::createFromUtf8(rt, name));
                customIndex++;
            }
        }
        
        return presetArray;
    } catch (...) {
        return jsi::Value::null();
    }
}

// Améliorer la gestion d'erreurs avec AudioError
void NativeAudioCoreModule::handleErrorWithAudioError(AudioFX::AudioError error, const std::string& context) {
    std::string errorMessage = context + ": " + AudioFX::audioErrorToString(error);
    handleError(convertError("processing_failed"), errorMessage);
}

// Vérifier les capacités disponibles
jsi::Value NativeAudioCoreModule::getCapabilities(jsi::Runtime& rt) {
    try {
        jsi::Object capabilities(rt);

        capabilities.setProperty(rt, "simd", jsi::Value(g_simdFilter != nullptr));
        capabilities.setProperty(rt, "optimized", jsi::Value(g_optimizedFilter != nullptr));
        capabilities.setProperty(rt, "threadSafe", jsi::Value(g_threadSafeFilter != nullptr));
        capabilities.setProperty(rt, "branchFree", jsi::Value(true)); // Toujours disponible
        capabilities.setProperty(rt, "dbLookup", jsi::Value(true)); // Toujours disponible

        return capabilities;
    } catch (...) {
        return jsi::Value::null();
    }
}

// Traitement audio avec sélection automatique du meilleur algorithme
void NativeAudioCoreModule::processAudioWithBestAlgorithm(const float* input, float* output, size_t numSamples) {
    // Sélectionner le meilleur algorithme disponible
    if (g_simdFilter) {
        // SIMD pour la meilleure performance
        g_simdFilter->processMono(input, output, numSamples);
    } else if (g_optimizedFilter) {
        // Optimisé pour performance
        g_optimizedFilter->processMono(input, output, numSamples);
    } else if (g_threadSafeFilter) {
        // Thread-safe pour la sécurité
        g_threadSafeFilter->processMono(input, output, numSamples);
    } else {
        // Algorithme standard
        // Utiliser les algorithmes branch-free pour les opérations
        for (size_t i = 0; i < numSamples; ++i) {
            output[i] = AudioFX::BranchFree::abs(input[i]);
            output[i] = AudioFX::BranchFree::max(output[i], 0.0001f); // Éviter les valeurs nulles
        }
    }
}

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_CORE_ENABLED
