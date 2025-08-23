#include "NativeAudioCoreModule.h"

#if NYTH_AUDIO_CORE_ENABLED

#include "Audio/core/AudioCoreHelpers.hpp"
#include "Audio/core/JSIConverters.hpp"
#include "Audio/core/AudioEqualizer.hpp"
#include "Audio/core/AudioError.hpp"
#include "Audio/core/BiquadFilter.hpp"
#include "Audio/core/BiquadFilterOptimized.hpp"
#include "Audio/core/BiquadFilterSIMD.hpp"
#include "Audio/core/BranchFreeAlgorithms.hpp"
#include "Audio/core/DbLookupTable.hpp"
#include "Audio/core/EQPresetFactory.hpp"
#include "Audio/core/MemoryPool.hpp"
#include "Audio/core/ThreadSafeBiquadFilter.hpp"
#include <algorithm>
#include <chrono>
#include <cmath>
#include <map>
#include <sstream>

// === Instance pour les composants avancés ===
static AudioFX::DbLookupTable& g_dbLookupTable = AudioFX::DbLookupTable::getInstance();
static std::unordered_map<std::string, AudioFX::EQPreset> g_presetCache;

// === Algorithmes branch-free ===
using namespace AudioFX::BranchFree;
using namespace AudioFX::CoreHelpers;
using namespace facebook::react;

namespace facebook {
namespace react {

// === Constructeur/Destructeur ===
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

AudioFX::BiquadFilter* NativeAudioCoreModule::getFilter(int64_t filterId) {
    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        return it->second.get();
    }
    return nullptr;
}

void NativeAudioCoreModule::handleAudioData(const float* data, size_t frameCount, int channels) {
    // Handle audio data callbacks
}

void NativeAudioCoreModule::handleError(NythCoreError error, const std::string& message) {
    std::lock_guard<std::mutex> lock(m_coreMutex);
    if (m_jsCallbacks.errorCallback && m_runtime) {
        try {
            jsi::Runtime& rt = *m_runtime;
            jsi::String errorStr = jsi::String::createFromUtf8(rt, message);
            jsi::String errorTypeStr = jsi::String::createFromUtf8(rt, JSIConverters::errorToString(error));

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
        try {
            jsi::Runtime& rt = *m_runtime;
            jsi::String oldStateStr = jsi::String::createFromUtf8(rt, JSIConverters::stateToString(oldState));
            jsi::String newStateStr = jsi::String::createFromUtf8(rt, JSIConverters::stateToString(newState));

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

void NativeAudioCoreModule::invokeJSCallback(const std::string& callbackName,
                                             std::function<void(jsi::Runtime&)> invocation) {
    try {
        if (m_runtime) {
            invocation(*m_runtime);
        }
    } catch (...) {
        // Handle invocation errors silently
    }
}

// === Méthodes publiques - Gestion du cycle de vie ===

void NativeAudioCoreModule::initialize(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(m_coreMutex);

    try {
        initializeEqualizer();
    } catch (const std::exception& e) {
        handleError(JSIConverters::stringToError("module_error"), std::string("Initialization failed: ") + e.what());
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

// === État et informations ===

jsi::Value NativeAudioCoreModule::getState(jsi::Runtime& rt) {
    return jsi::String::createFromUtf8(rt, JSIConverters::stateToString(m_currentState.load()));
}

jsi::Value NativeAudioCoreModule::getErrorString(jsi::Runtime& rt, int errorCode) {
    NythCoreError error = static_cast<NythCoreError>(errorCode);
    return jsi::String::createFromUtf8(rt, JSIConverters::errorToString(error));
}

// === Égaliseur - Initialisation ===

jsi::Value NativeAudioCoreModule::equalizerInitialize(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(m_coreMutex);

    try {
        auto nativeConfig = JSIConverters::parseEqualizerConfig(rt, config, currentSampleRate_);
        initializeEqualizer();
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(JSIConverters::stringToError("config_error"), std::string("Equalizer initialization failed: ") + e.what());
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

// === Égaliseur - Configuration globale ===

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
    return jsi::Value(equalizerSetBypass(m_equalizer.get(), bypass));
}

jsi::Value NativeAudioCoreModule::equalizerSetSampleRate(jsi::Runtime& rt, uint32_t sampleRate) {
    std::lock_guard<std::mutex> lock(m_coreMutex);

    if (!m_equalizer) {
        handleError(CORE_ERROR_NOT_INITIALIZED, "Equalizer not initialized");
        return jsi::Value(false);
    }

    if (equalizerSetSampleRate(m_equalizer.get(), sampleRate)) {
        currentSampleRate_ = sampleRate;
        return jsi::Value(true);
    }
    return jsi::Value(false);
}

// === Égaliseur - Configuration des bandes ===

jsi::Value NativeAudioCoreModule::equalizerSetBand(jsi::Runtime& rt, size_t bandIndex, const jsi::Object& bandConfig) {
    std::lock_guard<std::mutex> lock(m_coreMutex);

    if (!m_equalizer) {
        handleError(CORE_ERROR_NOT_INITIALIZED, "Equalizer not initialized");
        return jsi::Value(false);
    }

    try {
        auto config = JSIConverters::parseBandConfig(rt, bandConfig);
        return jsi::Value(equalizerSetBand(m_equalizer.get(), bandIndex, &config));
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
        config.type = convertFromAudioFXFilterType(type);

        return JSIConverters::bandConfigToJS(rt, config);
    } catch (const std::exception& e) {
        handleError(CORE_ERROR_CONFIG_ERROR, std::string("Get band config failed: ") + e.what());
        return jsi::Value::null();
    }
}

// === Égaliseur - Méthodes simplifiées de contrôle des bandes ===

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
        NythCoreFilterType coreType = static_cast<NythCoreFilterType>(filterType);
        AudioFX::FilterType type = convertToAudioFXFilterType(coreType);
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

// === Égaliseur - Informations ===

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

        return JSIConverters::equalizerInfoToJS(rt, info);
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

// === Égaliseur - Processing ===

jsi::Value NativeAudioCoreModule::equalizerProcessMono(jsi::Runtime& rt, const jsi::Array& input) {
    std::lock_guard<std::mutex> lock(m_coreMutex);

    if (!m_equalizer) {
        handleError(CORE_ERROR_NOT_INITIALIZED, "Equalizer not initialized");
        return jsi::Value::null();
    }

    try {
        auto inputVector = JSIConverters::arrayToFloatVector(rt, input);
        std::vector<float> outputVector(inputVector.size());

        if (equalizerProcessMono(m_equalizer.get(), inputVector.data(), outputVector.data(), inputVector.size())) {
            return JSIConverters::floatVectorToArray(rt, outputVector);
        }

        handleError(CORE_ERROR_PROCESSING_FAILED, "Mono processing failed internally.");
        return jsi::Value::null();

    } catch (const std::exception& e) {
        handleError(CORE_ERROR_PROCESSING_FAILED, std::string("Mono processing failed: ") + e.what());
        return jsi::Value::null();
    }
}

jsi::Value NativeAudioCoreModule::equalizerProcessStereo(jsi::Runtime& rt, const jsi::Array& inputL,
                                                         const jsi::Array& inputR) {
    std::lock_guard<std::mutex> lock(m_coreMutex);

    if (!m_equalizer) {
        handleError(CORE_ERROR_NOT_INITIALIZED, "Equalizer not initialized");
        return jsi::Value::null();
    }

    try {
        auto inputLVector = JSIConverters::arrayToFloatVector(rt, inputL);
        auto inputRVector = JSIConverters::arrayToFloatVector(rt, inputR);
        std::vector<float> outputLVector(inputLVector.size());
        std::vector<float> outputRVector(inputRVector.size());

        if (equalizerProcessStereo(m_equalizer.get(), inputLVector.data(), inputRVector.data(),
                                   outputLVector.data(), outputRVector.data(), inputLVector.size())) {
            jsi::Object result(rt);
            result.setProperty(rt, "left", JSIConverters::floatVectorToArray(rt, outputLVector));
            result.setProperty(rt, "right", JSIConverters::floatVectorToArray(rt, outputRVector));
            return result;
        }

        handleError(CORE_ERROR_PROCESSING_FAILED, "Stereo processing failed internally.");
        return jsi::Value::null();

    } catch (const std::exception& e) {
        handleError(CORE_ERROR_PROCESSING_FAILED, std::string("Stereo processing failed: ") + e.what());
        return jsi::Value::null();
    }
}

// === Égaliseur - Presets ===

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
        m_equalizer->reset();
        return jsi::Value(true);
    } catch (...) {
        return jsi::Value(false);
    }
}

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

// === Filtres biquad individuels - Gestion du cycle de vie ===

jsi::Value NativeAudioCoreModule::filterCreate(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(m_filterMutex);

    int64_t filterId = AudioFX::CoreHelpers::filterCreate(m_filters, m_nextFilterId);
    return jsi::Value(static_cast<double>(filterId));
}

jsi::Value NativeAudioCoreModule::filterDestroy(jsi::Runtime& rt, int64_t filterId) {
    std::lock_guard<std::mutex> lock(m_filterMutex);
    return jsi::Value(AudioFX::CoreHelpers::filterDestroy(m_filters, filterId));
}

// === Filtres biquad - Configuration ===

jsi::Value NativeAudioCoreModule::filterSetConfig(jsi::Runtime& rt, int64_t filterId, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(m_filterMutex);

    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        try {
            auto filterConfig = JSIConverters::parseFilterConfig(rt, config);
            return jsi::Value(AudioFX::CoreHelpers::filterSetConfig(it->second.get(), &filterConfig, currentSampleRate_));
        } catch (...) {
            return jsi::Value(false);
        }
    }
    return jsi::Value(false);
}

// === Filtres biquad - Type-specific filter setters ===

jsi::Value NativeAudioCoreModule::filterSetLowpass(jsi::Runtime& rt, int64_t filterId, double frequency,
                                                   double sampleRate, double q) {
    std::lock_guard<std::mutex> lock(m_filterMutex);
    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        NythCoreFilterConfig config = {frequency, q, 0.0, CORE_FILTER_LOWPASS};
        return jsi::Value(AudioFX::CoreHelpers::filterSetConfig(it->second.get(), &config, currentSampleRate_));
    }
    return jsi::Value(false);
}

jsi::Value NativeAudioCoreModule::filterSetHighpass(jsi::Runtime& rt, int64_t filterId, double frequency,
                                                    double sampleRate, double q) {
    std::lock_guard<std::mutex> lock(m_filterMutex);
    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        NythCoreFilterConfig config = {frequency, q, 0.0, CORE_FILTER_HIGHPASS};
        return jsi::Value(AudioFX::CoreHelpers::filterSetConfig(it->second.get(), &config, currentSampleRate_));
    }
    return jsi::Value(false);
}

jsi::Value NativeAudioCoreModule::filterSetBandpass(jsi::Runtime& rt, int64_t filterId, double frequency,
                                                    double sampleRate, double q) {
    std::lock_guard<std::mutex> lock(m_filterMutex);
    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        NythCoreFilterConfig config = {frequency, q, 0.0, CORE_FILTER_BANDPASS};
        return jsi::Value(AudioFX::CoreHelpers::filterSetConfig(it->second.get(), &config, currentSampleRate_));
    }
    return jsi::Value(false);
}

jsi::Value NativeAudioCoreModule::filterSetNotch(jsi::Runtime& rt, int64_t filterId, double frequency,
                                                 double sampleRate, double q) {
    std::lock_guard<std::mutex> lock(m_filterMutex);
    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        NythCoreFilterConfig config = {frequency, q, 0.0, CORE_FILTER_NOTCH};
        return jsi::Value(AudioFX::CoreHelpers::filterSetConfig(it->second.get(), &config, currentSampleRate_));
    }
    return jsi::Value(false);
}

jsi::Value NativeAudioCoreModule::filterSetPeaking(jsi::Runtime& rt, int64_t filterId, double frequency,
                                                   double sampleRate, double q, double gainDB) {
    std::lock_guard<std::mutex> lock(m_filterMutex);
    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        NythCoreFilterConfig config = {frequency, q, gainDB, CORE_FILTER_PEAK};
        return jsi::Value(AudioFX::CoreHelpers::filterSetConfig(it->second.get(), &config, currentSampleRate_));
    }
    return jsi::Value(false);
}

jsi::Value NativeAudioCoreModule::filterSetLowShelf(jsi::Runtime& rt, int64_t filterId, double frequency,
                                                    double sampleRate, double q, double gainDB) {
    std::lock_guard<std::mutex> lock(m_filterMutex);
    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        NythCoreFilterConfig config = {frequency, q, gainDB, CORE_FILTER_LOWSHELF};
        return jsi::Value(AudioFX::CoreHelpers::filterSetConfig(it->second.get(), &config, currentSampleRate_));
    }
    return jsi::Value(false);
}

jsi::Value NativeAudioCoreModule::filterSetHighShelf(jsi::Runtime& rt, int64_t filterId, double frequency,
                                                     double sampleRate, double q, double gainDB) {
    std::lock_guard<std::mutex> lock(m_filterMutex);
    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        NythCoreFilterConfig config = {frequency, q, gainDB, CORE_FILTER_HIGHSHELF};
        return jsi::Value(AudioFX::CoreHelpers::filterSetConfig(it->second.get(), &config, currentSampleRate_));
    }
    return jsi::Value(false);
}

jsi::Value NativeAudioCoreModule::filterSetAllpass(jsi::Runtime& rt, int64_t filterId, double frequency,
                                                   double sampleRate, double q) {
    std::lock_guard<std::mutex> lock(m_filterMutex);
    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        NythCoreFilterConfig config = {frequency, q, 0.0, CORE_FILTER_ALLPASS};
        return jsi::Value(AudioFX::CoreHelpers::filterSetConfig(it->second.get(), &config, currentSampleRate_));
    }
    return jsi::Value(false);
}

// === Filtres biquad - Processing ===

jsi::Value NativeAudioCoreModule::filterProcessMono(jsi::Runtime& rt, int64_t filterId, const jsi::Array& input) {
    std::lock_guard<std::mutex> lock(m_filterMutex);

    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        try {
            auto inputVector = JSIConverters::arrayToFloatVector(rt, input);
            std::vector<float> outputVector(inputVector.size());
            if (AudioFX::CoreHelpers::filterProcessMono(it->second.get(), inputVector.data(), outputVector.data(),
                                                inputVector.size())) {
                return JSIConverters::floatVectorToArray(rt, outputVector);
            }
        } catch (...) {
            // fall through to return null
        }
    }
    return jsi::Value::null();
}

jsi::Value NativeAudioCoreModule::filterProcessStereo(jsi::Runtime& rt, int64_t filterId, const jsi::Array& inputL,
                                                      const jsi::Array& inputR) {
    std::lock_guard<std::mutex> lock(m_filterMutex);

    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        try {
            auto inputLVector = JSIConverters::arrayToFloatVector(rt, inputL);
            auto inputRVector = JSIConverters::arrayToFloatVector(rt, inputR);
            std::vector<float> outputLVector(inputLVector.size());
            std::vector<float> outputRVector(inputRVector.size());

            if (AudioFX::CoreHelpers::filterProcessStereo(it->second.get(), inputLVector.data(), inputRVector.data(),
                                                  outputLVector.data(), outputRVector.data(), inputLVector.size())) {
                jsi::Object result(rt);
                result.setProperty(rt, "left", JSIConverters::floatVectorToArray(rt, outputLVector));
                result.setProperty(rt, "right", JSIConverters::floatVectorToArray(rt, outputRVector));
                return result;
            }
        } catch (...) {
            // fall through to return null
        }
    }
    return jsi::Value::null();
}

// === Filtres biquad - Informations ===

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
        return JSIConverters::filterConfigToJS(rt, config);
    }
    return jsi::Value::null();
}

jsi::Value NativeAudioCoreModule::filterGetInfo(jsi::Runtime& rt, int64_t filterId) {
    std::lock_guard<std::mutex> lock(m_filterMutex);

    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        NythCoreFilterInfo info = {1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0}; // Default values
        return JSIConverters::filterInfoToJS(rt, info);
    }
    return jsi::Value::null();
}

jsi::Value NativeAudioCoreModule::filterReset(jsi::Runtime& rt, int64_t filterId) {
    std::lock_guard<std::mutex> lock(m_filterMutex);

    auto it = m_filters.find(filterId);
    if (it != m_filters.end()) {
        try {
            return jsi::Value(AudioFX::CoreHelpers::filterReset(it->second.get()));
        } catch (...) {
            return jsi::Value(false);
        }
    }
    return jsi::Value(false);
}

// === Utilitaires ===

jsi::Value NativeAudioCoreModule::dbToLinear(jsi::Runtime& rt, double db) {
    // Utiliser la table de conversion optimisée avec algorithmes branch-free
    float result = g_dbLookupTable.dbToLinear(static_cast<float>(db));
    result = AudioFX::BranchFree::abs(result);
    return jsi::Value(static_cast<double>(result));
}

jsi::Value NativeAudioCoreModule::linearToDb(jsi::Runtime& rt, double linear) {
    // Utiliser la table de conversion optimisée avec algorithmes branch-free
    float result = g_dbLookupTable.linearToDb(static_cast<float>(linear));
    result = AudioFX::BranchFree::max(result, -120.0f); // Limite inférieure pour éviter -inf
    return jsi::Value(static_cast<double>(result));
}

jsi::Value NativeAudioCoreModule::validateFrequency(jsi::Runtime& rt, double frequency, double sampleRate) {
    return jsi::Value(AudioFX::AudioValidator::validateFrequency(frequency, sampleRate) == AudioFX::AudioError::OK);
}

jsi::Value NativeAudioCoreModule::validateQ(jsi::Runtime& rt, double q) {
    return jsi::Value(AudioFX::AudioValidator::validateQ(q) == AudioFX::AudioError::OK);
}

jsi::Value NativeAudioCoreModule::validateGainDB(jsi::Runtime& rt, double gainDB) {
    return jsi::Value(gainDB >= -60.0 && gainDB <= 30.0);
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

// === Contrôle de performance ===

jsi::Value NativeAudioCoreModule::enableSIMD(jsi::Runtime& rt, bool enable) {
    // SIMD support removed from global scope
    return jsi::Value(false);
}

jsi::Value NativeAudioCoreModule::enableOptimizedProcessing(jsi::Runtime& rt, bool enable) {
    // Optimized processing removed from global scope
    return jsi::Value(false);
}

jsi::Value NativeAudioCoreModule::enableThreadSafe(jsi::Runtime& rt, bool enable) {
    // Thread-safe processing removed from global scope
    return jsi::Value(false);
}

jsi::Value NativeAudioCoreModule::getCapabilities(jsi::Runtime& rt) {
    try {
        jsi::Object capabilities(rt);

        capabilities.setProperty(rt, "simd", jsi::Value(false));       // Supprimé du scope global
        capabilities.setProperty(rt, "optimized", jsi::Value(false));  // Supprimé du scope global
        capabilities.setProperty(rt, "threadSafe", jsi::Value(false)); // Supprimé du scope global
        capabilities.setProperty(rt, "branchFree", jsi::Value(true));  // Toujours disponible
        capabilities.setProperty(rt, "dbLookup", jsi::Value(true));    // Toujours disponible

        return capabilities;
    } catch (...) {
        return jsi::Value::null();
    }
}

// === Méthodes helper privées ===

void NativeAudioCoreModule::handleErrorWithAudioError(AudioFX::AudioError error, const std::string& context) {
    std::string errorMessage = context + ": " + AudioFX::audioErrorToString(error);
    handleError(JSIConverters::stringToError("processing_failed"), errorMessage);
}

void NativeAudioCoreModule::processAudioWithBestAlgorithm(const float* input, float* output, size_t numSamples) {
    // Algorithme standard avec algorithmes branch-free
    for (size_t i = 0; i < numSamples; ++i) {
        output[i] = AudioFX::BranchFree::abs(input[i]);
        output[i] = AudioFX::BranchFree::max(output[i], 0.0001f); // Éviter les valeurs nulles
    }
}

// === Installation du module ===

jsi::Value NativeAudioCoreModule::install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker) {
    auto module = std::make_shared<NativeAudioCoreModule>(jsInvoker);

    auto object = jsi::Object(rt);

    // Enregistrer toutes les méthodes
    auto registerMethod =
        [&](const char* name, size_t paramCount,
            std::function<jsi::Value(NativeAudioCoreModule*, jsi::Runtime&, const jsi::Value*, size_t)> method) {
            object.setProperty(
                rt, name,
                jsi::Function::createFromHostFunction(
                    rt, jsi::PropNameID::forAscii(rt, name), static_cast<unsigned int>(paramCount),
                    [module, method](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args,
                                     size_t count) -> jsi::Value { return method(module.get(), rt, args, count); }));
        };

    // === Gestion du cycle de vie ===
    registerMethod("initialize", 0, [](auto* m, auto& rt, auto*, auto) {
        m->initialize(rt);
        return jsi::Value::undefined();
    });

    registerMethod("isInitialized", 0, [](auto* m, auto& rt, auto*, auto) { return m->isInitialized(rt); });

    registerMethod("dispose", 0, [](auto* m, auto& rt, auto*, auto) { return m->dispose(rt); });

    // === État et informations ===
    registerMethod("getState", 0, [](auto* m, auto& rt, auto*, auto) { return m->getState(rt); });

    registerMethod("getErrorString", 1, [](auto* m, auto& rt, auto* args, auto) {
        return m->getErrorString(rt, static_cast<int>(args[0].asNumber()));
    });

    // === Égaliseur ===
    registerMethod("equalizerInitialize", 1, [](auto* m, auto& rt, auto* args, auto) {
        return m->equalizerInitialize(rt, args[0].asObject(rt));
    });

    registerMethod("equalizerIsInitialized", 0,
                   [](auto* m, auto& rt, auto*, auto) { return m->equalizerIsInitialized(rt); });

    registerMethod("equalizerRelease", 0, [](auto* m, auto& rt, auto*, auto) { return m->equalizerRelease(rt); });

    registerMethod("equalizerSetMasterGain", 1, [](auto* m, auto& rt, auto* args, auto) {
        return m->equalizerSetMasterGain(rt, args[0].asNumber());
    });

    registerMethod("equalizerSetBypass", 1,
                   [](auto* m, auto& rt, auto* args, auto) { return m->equalizerSetBypass(rt, args[0].asBool()); });

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
        return m->equalizerSetBandType(rt, static_cast<size_t>(args[0].asNumber()),
                                       static_cast<int>(args[1].asNumber()));
    });

    registerMethod("equalizerSetBandEnabled", 2, [](auto* m, auto& rt, auto* args, auto) {
        return m->equalizerSetBandEnabled(rt, static_cast<size_t>(args[0].asNumber()), args[1].asBool());
    });

    // === Informations égaliseur ===
    registerMethod("equalizerGetInfo", 0, [](auto* m, auto& rt, auto*, auto) { return m->equalizerGetInfo(rt); });

    registerMethod("equalizerGetNumBands", 0,
                   [](auto* m, auto& rt, auto*, auto) { return m->equalizerGetNumBands(rt); });

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

    registerMethod("equalizerResetAllBands", 0,
                   [](auto* m, auto& rt, auto*, auto) { return m->equalizerResetAllBands(rt); });

    registerMethod("getAvailablePresets", 0, [](auto* m, auto& rt, auto*, auto) { return m->getAvailablePresets(rt); });

    // === Filtres biquad ===
    registerMethod("filterCreate", 0, [](auto* m, auto& rt, auto*, auto) { return m->filterCreate(rt); });

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
        return m->filterSetLowpass(rt, static_cast<int64_t>(args[0].asNumber()), args[1].asNumber(), args[2].asNumber(),
                                   args[3].asNumber());
    });

    registerMethod("filterSetHighpass", 4, [](auto* m, auto& rt, auto* args, auto) {
        return m->filterSetHighpass(rt, static_cast<int64_t>(args[0].asNumber()), args[1].asNumber(),
                                    args[2].asNumber(), args[3].asNumber());
    });

    registerMethod("filterSetBandpass", 4, [](auto* m, auto& rt, auto* args, auto) {
        return m->filterSetBandpass(rt, static_cast<int64_t>(args[0].asNumber()), args[1].asNumber(),
                                    args[2].asNumber(), args[3].asNumber());
    });

    registerMethod("filterSetNotch", 4, [](auto* m, auto& rt, auto* args, auto) {
        return m->filterSetNotch(rt, static_cast<int64_t>(args[0].asNumber()), args[1].asNumber(), args[2].asNumber(),
                                 args[3].asNumber());
    });

    registerMethod("filterSetPeaking", 5, [](auto* m, auto& rt, auto* args, auto) {
        return m->filterSetPeaking(rt, static_cast<int64_t>(args[0].asNumber()), args[1].asNumber(), args[2].asNumber(),
                                   args[3].asNumber(), args[4].asNumber());
    });

    registerMethod("filterSetLowShelf", 5, [](auto* m, auto& rt, auto* args, auto) {
        return m->filterSetLowShelf(rt, static_cast<int64_t>(args[0].asNumber()), args[1].asNumber(),
                                    args[2].asNumber(), args[3].asNumber(), args[4].asNumber());
    });

    registerMethod("filterSetHighShelf", 5, [](auto* m, auto& rt, auto* args, auto) {
        return m->filterSetHighShelf(rt, static_cast<int64_t>(args[0].asNumber()), args[1].asNumber(),
                                     args[2].asNumber(), args[3].asNumber(), args[4].asNumber());
    });

    registerMethod("filterSetAllpass", 4, [](auto* m, auto& rt, auto* args, auto) {
        return m->filterSetAllpass(rt, static_cast<int64_t>(args[0].asNumber()), args[1].asNumber(), args[2].asNumber(),
                                   args[3].asNumber());
    });

    // === Processing filtres ===
    registerMethod("filterProcessMono", 2, [](auto* m, auto& rt, auto* args, auto) {
        return m->filterProcessMono(rt, static_cast<int64_t>(args[0].asNumber()), args[1].asObject(rt).asArray(rt));
    });

    registerMethod("filterProcessStereo", 3, [](auto* m, auto& rt, auto* args, auto) {
        return m->filterProcessStereo(rt, static_cast<int64_t>(args[0].asNumber()), args[1].asObject(rt).asArray(rt),
                                      args[2].asObject(rt).asArray(rt));
    });

    // === Informations filtres ===
    registerMethod("filterGetInfo", 1, [](auto* m, auto& rt, auto* args, auto) {
        return m->filterGetInfo(rt, static_cast<int64_t>(args[0].asNumber()));
    });

    registerMethod("filterReset", 1, [](auto* m, auto& rt, auto* args, auto) {
        return m->filterReset(rt, static_cast<int64_t>(args[0].asNumber()));
    });

    // === Utilitaires ===
    registerMethod("dbToLinear", 1,
                   [](auto* m, auto& rt, auto* args, auto) { return m->dbToLinear(rt, args[0].asNumber()); });

    registerMethod("linearToDb", 1,
                   [](auto* m, auto& rt, auto* args, auto) { return m->linearToDb(rt, args[0].asNumber()); });

    registerMethod("validateFrequency", 2, [](auto* m, auto& rt, auto* args, auto) {
        return m->validateFrequency(rt, args[0].asNumber(), args[1].asNumber());
    });

    registerMethod("validateQ", 1,
                   [](auto* m, auto& rt, auto* args, auto) { return m->validateQ(rt, args[0].asNumber()); });

    registerMethod("validateGainDB", 1,
                   [](auto* m, auto& rt, auto* args, auto) { return m->validateGainDB(rt, args[0].asNumber()); });

    // === Gestion mémoire ===
    registerMethod("memoryInitialize", 1, [](auto* m, auto& rt, auto* args, auto) {
        return m->memoryInitialize(rt, static_cast<size_t>(args[0].asNumber()));
    });

    registerMethod("memoryRelease", 0, [](auto* m, auto& rt, auto*, auto) { return m->memoryRelease(rt); });

    registerMethod("memoryGetAvailable", 0, [](auto* m, auto& rt, auto*, auto) { return m->memoryGetAvailable(rt); });

    registerMethod("memoryGetUsed", 0, [](auto* m, auto& rt, auto*, auto) { return m->memoryGetUsed(rt); });

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
    registerMethod("enableSIMD", 1,
                   [](auto* m, auto& rt, auto* args, auto) { return m->enableSIMD(rt, args[0].asBool()); });

    registerMethod("enableOptimizedProcessing", 1, [](auto* m, auto& rt, auto* args, auto) {
        return m->enableOptimizedProcessing(rt, args[0].asBool());
    });

    registerMethod("enableThreadSafe", 1,
                   [](auto* m, auto& rt, auto* args, auto) { return m->enableThreadSafe(rt, args[0].asBool()); });

    registerMethod("getCapabilities", 0, [](auto* m, auto& rt, auto*, auto) { return m->getCapabilities(rt); });

    // Installer le module dans le runtime global
    rt.global().setProperty(rt, "NativeAudioCoreModule", object);

    return object;
}

// === Fonction d'enregistrement du module ===
std::shared_ptr<TurboModule> NativeAudioCoreModuleProvider(std::shared_ptr<CallInvoker> jsInvoker) {
    return std::make_shared<NativeAudioCoreModule>(jsInvoker);
}

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_CORE_ENABLED
