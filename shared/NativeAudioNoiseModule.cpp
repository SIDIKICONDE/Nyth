#include "NativeAudioNoiseModule.h"

#if NYTH_AUDIO_NOISE_ENABLED

#include "Audio/noise/AdvancedSpectralNR.hpp"
#include "Audio/noise/IMCRA.hpp"
#include "Audio/noise/MultibandProcessor.hpp"
#include "Audio/noise/WienerFilter.hpp"
#include "Audio/noise/NoiseReducer.hpp"
#include "Audio/noise/RNNoiseSuppressor.hpp"
#include <chrono>
#include <sstream>
#include <algorithm>
#include <cmath>
#include <cstring>

// === Instance globale pour l'API C ===
static std::unique_ptr<AudioNR::AdvancedSpectralNR> g_advancedSpectralNR;
static std::unique_ptr<AudioNR::IMCRA> g_imcra;
static std::unique_ptr<AudioNR::WienerFilter> g_wienerFilter;
static std::unique_ptr<AudioNR::MultibandProcessor> g_multibandProcessor;
static std::unique_ptr<AudioNR::NoiseReducer> g_noiseReducer;
static std::unique_ptr<AudioNR::RNNoiseSuppressor> g_rnNoiseSuppressor;
static std::mutex g_globalMutex;
static NythNoiseConfig g_currentConfig = {};
static NythNoiseState g_currentState = NOISE_STATE_UNINITIALIZED;
static NythNoiseStatistics g_currentStats = {0};

// === Implémentation de l'API C ===
extern "C" {

bool NythNoise_Initialize(const NythNoiseConfig* config) {
    if (!config) return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);

    try {
        g_currentConfig = *config;

        // Initialize Advanced Spectral NR (main system)
        AudioNR::AdvancedSpectralNR::Config advConfig;
        advConfig.sampleRate = config->sampleRate;
        advConfig.fftSize = config->fftSize;
        advConfig.hopSize = config->hopSize;
        advConfig.aggressiveness = config->aggressiveness;
        advConfig.enableMultiband = config->enableMultiband;
        advConfig.preserveTransients = config->preserveTransients;
        advConfig.reduceMusicalNoise = config->reduceMusicalNoise;

        // Map algorithm type
        switch (config->algorithm) {
            case NOISE_ALGORITHM_ADVANCED_SPECTRAL:
                advConfig.algorithm = AudioNR::AdvancedSpectralNR::Config::Algorithm::MMSE_LSA;
                break;
            case NOISE_ALGORITHM_WIENER_FILTER:
                advConfig.algorithm = AudioNR::AdvancedSpectralNR::Config::Algorithm::WIENER_FILTER;
                break;
            case NOISE_ALGORITHM_MULTIBAND:
                advConfig.algorithm = AudioNR::AdvancedSpectralNR::Config::Algorithm::MULTIBAND;
                break;
            case NOISE_ALGORITHM_TWO_STEP:
                advConfig.algorithm = AudioNR::AdvancedSpectralNR::Config::Algorithm::TWO_STEP;
                break;
            default:
                advConfig.algorithm = AudioNR::AdvancedSpectralNR::Config::Algorithm::SPECTRAL_SUBTRACTION;
                break;
        }

        // Map noise estimation method
        switch (config->noiseMethod) {
            case NOISE_ESTIMATION_IMCRA:
                advConfig.noiseMethod = AudioNR::AdvancedSpectralNR::Config::NoiseEstimation::IMCRA;
                break;
            case NOISE_ESTIMATION_MCRA:
                advConfig.noiseMethod = AudioNR::AdvancedSpectralNR::Config::NoiseEstimation::SIMPLE_MCRA;
                break;
            default:
                advConfig.noiseMethod = AudioNR::AdvancedSpectralNR::Config::NoiseEstimation::SIMPLE_MCRA;
                break;
        }

        g_advancedSpectralNR = std::make_unique<AudioNR::AdvancedSpectralNR>(advConfig);

        // Initialize other components as needed
        if (config->algorithm == NOISE_ALGORITHM_WIENER_FILTER) {
            AudioNR::WienerFilter::Config wienerCfg;
            wienerCfg.fftSize = config->fftSize;
            wienerCfg.sampleRate = config->sampleRate;
            g_wienerFilter = std::make_unique<AudioNR::WienerFilter>(wienerCfg);
        }

        if (config->enableMultiband) {
            AudioNR::MultibandProcessor::Config mbConfig;
            mbConfig.sampleRate = config->sampleRate;
            mbConfig.fftSize = config->fftSize;
            g_multibandProcessor = std::make_unique<AudioNR::MultibandProcessor>(mbConfig);
        }

        // Initialize temporal noise reducer
        g_noiseReducer = std::make_unique<AudioNR::NoiseReducer>(config->sampleRate, config->channels);

        g_currentState = NOISE_STATE_INITIALIZED;
        return true;
    } catch (...) {
        g_currentState = NOISE_STATE_ERROR;
        return false;
    }
}

bool NythNoise_Start(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (g_currentState == NOISE_STATE_INITIALIZED) {
        g_currentState = NOISE_STATE_PROCESSING;
        return true;
    }
    return false;
}

bool NythNoise_Stop(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (g_currentState == NOISE_STATE_PROCESSING) {
        g_currentState = NOISE_STATE_INITIALIZED;
        return true;
    }
    return false;
}

void NythNoise_Release(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    g_advancedSpectralNR.reset();
    g_imcra.reset();
    g_wienerFilter.reset();
    g_multibandProcessor.reset();
    g_noiseReducer.reset();
    g_rnNoiseSuppressor.reset();
    g_currentState = NOISE_STATE_UNINITIALIZED;
}

// === État et informations ===
NythNoiseState NythNoise_GetState(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_currentState;
}

void NythNoise_GetStatistics(NythNoiseStatistics* stats) {
    if (!stats) return;

    std::lock_guard<std::mutex> lock(g_globalMutex);
    *stats = g_currentStats;

    if (g_advancedSpectralNR) {
        stats->estimatedSNR = g_advancedSpectralNR->getEstimatedSNR();
    }
}

void NythNoise_ResetStatistics(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    memset(&g_currentStats, 0, sizeof(NythNoiseStatistics));
}

// === Configuration ===
void NythNoise_GetConfig(NythNoiseConfig* config) {
    if (!config) return;

    std::lock_guard<std::mutex> lock(g_globalMutex);
    *config = g_currentConfig;
}

bool NythNoise_UpdateConfig(const NythNoiseConfig* config) {
    if (!config) return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);
    return NythNoise_Initialize(config);
}

bool NythNoise_SetAlgorithm(NythNoiseAlgorithm algorithm) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (g_currentState == NOISE_STATE_UNINITIALIZED) return false;

    g_currentConfig.algorithm = algorithm;

    // Reinitialize with new algorithm
    return NythNoise_Initialize(&g_currentConfig);
}

bool NythNoise_SetAggressiveness(float aggressiveness) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (g_currentState == NOISE_STATE_UNINITIALIZED) return false;

    g_currentConfig.aggressiveness = aggressiveness;

    if (g_advancedSpectralNR) {
        g_advancedSpectralNR->setAggressiveness(aggressiveness);
    }

    return true;
}

// === Traitement audio ===
bool NythNoise_ProcessAudio(const float* input, float* output, size_t frameCount, int channels) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (g_currentState != NOISE_STATE_PROCESSING) return false;
    if (!input || !output || frameCount == 0) return false;

    try {
        // Update input level
        float inputLevel = 0.0f;
        for (size_t i = 0; i < frameCount * channels; ++i) {
            inputLevel = std::max(inputLevel, std::abs(input[i]));
        }
        g_currentStats.inputLevel = inputLevel;

        // Apply noise reduction based on algorithm
        if (g_advancedSpectralNR) {
            g_advancedSpectralNR->process(input, output, frameCount);
        } else if (g_noiseReducer) {
            if (channels == 1) {
                g_noiseReducer->processMono(input, output, frameCount);
            } else {
                // For stereo, process each channel separately
                std::vector<float> inL(frameCount), inR(frameCount);
                std::vector<float> outL(frameCount), outR(frameCount);

                for (size_t i = 0; i < frameCount; ++i) {
                    inL[i] = input[i * 2];
                    inR[i] = input[i * 2 + 1];
                }

                g_noiseReducer->processStereo(inL.data(), inR.data(), outL.data(), outR.data(), frameCount);

                for (size_t i = 0; i < frameCount; ++i) {
                    output[i * 2] = outL[i];
                    output[i * 2 + 1] = outR[i];
                }
            }
        } else {
            // Fallback: copy input to output
            std::copy(input, input + frameCount * channels, output);
        }

        // Update output level and statistics
        float outputLevel = 0.0f;
        for (size_t i = 0; i < frameCount * channels; ++i) {
            outputLevel = std::max(outputLevel, std::abs(output[i]));
        }
        g_currentStats.outputLevel = outputLevel;
        g_currentStats.processedFrames++;
        g_currentStats.processedSamples += frameCount * channels;
        g_currentStats.durationMs += (frameCount * 1000) / g_currentConfig.sampleRate;

        return true;
    } catch (...) {
        return false;
    }
}

bool NythNoise_ProcessAudioStereo(const float* inputL, const float* inputR,
                                 float* outputL, float* outputR, size_t frameCount) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (g_currentState != NOISE_STATE_PROCESSING) return false;
    if (!inputL || !inputR || !outputL || !outputR || frameCount == 0) return false;

    try {
        if (g_noiseReducer) {
            g_noiseReducer->processStereo(inputL, inputR, outputL, outputR, frameCount);
        } else {
            // Fallback: copy input to output
            std::copy(inputL, inputL + frameCount, outputL);
            std::copy(inputR, inputR + frameCount, outputR);
        }

        g_currentStats.processedFrames++;
        g_currentStats.processedSamples += frameCount * 2;
        g_currentStats.durationMs += (frameCount * 1000) / g_currentConfig.sampleRate;

        return true;
    } catch (...) {
        return false;
    }
}

// === Analyse audio ===
float NythNoise_GetInputLevel(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_currentStats.inputLevel;
}

float NythNoise_GetOutputLevel(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_currentStats.outputLevel;
}

float NythNoise_GetEstimatedSNR(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    if (g_advancedSpectralNR) {
        return g_advancedSpectralNR->getEstimatedSNR();
    }
    return g_currentStats.estimatedSNR;
}

float NythNoise_GetSpeechProbability(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_currentStats.speechProbability;
}

float NythNoise_GetMusicalNoiseLevel(void) {
    std::lock_guard<std::mutex> lock(g_globalMutex);
    return g_currentStats.musicalNoiseLevel;
}

// === Contrôle avancé ===

// IMCRA
bool NythNoise_InitializeIMCRA(const NythIMCRAConfig* config) {
    if (!config) return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);

    try {
        AudioNR::IMCRA::Config imcraCfg;
        imcraCfg.fftSize = config->fftSize;
        imcraCfg.sampleRate = config->sampleRate;
        imcraCfg.alphaS = config->alphaS;
        imcraCfg.alphaD = config->alphaD;
        imcraCfg.alphaD2 = config->alphaD2;
        imcraCfg.betaMax = config->betaMax;
        imcraCfg.gamma0 = config->gamma0;
        imcraCfg.gamma1 = config->gamma1;
        imcraCfg.zeta0 = config->zeta0;
        imcraCfg.windowLength = config->windowLength;
        imcraCfg.subWindowLength = config->subWindowLength;

        g_imcra = std::make_unique<AudioNR::IMCRA>(imcraCfg);
        return true;
    } catch (...) {
        return false;
    }
}

void NythNoise_GetIMCRAConfig(NythIMCRAConfig* config) {
    if (!config || !g_imcra) return;

    // This would need to be implemented in IMCRA class with getters
    // For now, return default values
    config->fftSize = 1024;
    config->sampleRate = 48000;
    config->alphaS = 0.95;
    config->alphaD = 0.95;
    config->alphaD2 = 0.9;
    config->betaMax = 0.96;
    config->gamma0 = 4.6;
    config->gamma1 = 3.0;
    config->zeta0 = 1.67;
    config->windowLength = 80;
    config->subWindowLength = 8;
}

bool NythNoise_UpdateIMCRAConfig(const NythIMCRAConfig* config) {
    if (!config || !g_imcra) return false;
    return NythNoise_InitializeIMCRA(config);
}

// Wiener
bool NythNoise_InitializeWiener(const NythWienerConfig* config) {
    if (!config) return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);

    try {
        AudioNR::WienerFilter::Config wienerCfg;
        wienerCfg.fftSize = config->fftSize;
        wienerCfg.sampleRate = config->sampleRate;
        wienerCfg.alpha = config->alpha;
        wienerCfg.minGain = config->minGain;
        wienerCfg.maxGain = config->maxGain;
        wienerCfg.useLSA = config->useLSA;
        wienerCfg.gainSmoothing = config->gainSmoothing;
        wienerCfg.frequencySmoothing = config->frequencySmoothing;
        wienerCfg.usePerceptualWeighting = config->usePerceptualWeighting;

        g_wienerFilter = std::make_unique<AudioNR::WienerFilter>(wienerCfg);
        return true;
    } catch (...) {
        return false;
    }
}

void NythNoise_GetWienerConfig(NythWienerConfig* config) {
    if (!config) return;

    // Return default values
    config->fftSize = 1024;
    config->sampleRate = 48000;
    config->alpha = 0.98;
    config->minGain = 0.1;
    config->maxGain = 1.0;
    config->useLSA = true;
    config->gainSmoothing = 0.7;
    config->frequencySmoothing = 0.3;
    config->usePerceptualWeighting = true;
}

bool NythNoise_UpdateWienerConfig(const NythWienerConfig* config) {
    if (!config) return false;
    return NythNoise_InitializeWiener(config);
}

// Multi-bandes
bool NythNoise_InitializeMultiband(const NythMultibandConfig* config) {
    if (!config) return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);

    try {
        AudioNR::MultibandProcessor::Config mbConfig;
        mbConfig.sampleRate = config->sampleRate;
        mbConfig.fftSize = config->fftSize;
        mbConfig.profile.subBassReduction = config->subBassReduction;
        mbConfig.profile.bassReduction = config->bassReduction;
        mbConfig.profile.lowMidReduction = config->lowMidReduction;
        mbConfig.profile.midReduction = config->midReduction;
        mbConfig.profile.highMidReduction = config->highMidReduction;
        mbConfig.profile.highReduction = config->highReduction;
        mbConfig.profile.ultraHighReduction = config->ultraHighReduction;

        g_multibandProcessor = std::make_unique<AudioNR::MultibandProcessor>(mbConfig);
        return true;
    } catch (...) {
        return false;
    }
}

void NythNoise_GetMultibandConfig(NythMultibandConfig* config) {
    if (!config) return;

    // Return default values
    config->sampleRate = 48000;
    config->fftSize = 2048;
    config->subBassReduction = 0.9f;
    config->bassReduction = 0.7f;
    config->lowMidReduction = 0.5f;
    config->midReduction = 0.3f;
    config->highMidReduction = 0.4f;
    config->highReduction = 0.6f;
    config->ultraHighReduction = 0.8f;
}

bool NythNoise_UpdateMultibandConfig(const NythMultibandConfig* config) {
    if (!config) return false;
    return NythNoise_InitializeMultiband(config);
}

// === Callbacks ===
static NythNoiseDataCallback g_dataCallback = nullptr;
static NythNoiseErrorCallback g_errorCallback = nullptr;
static NythNoiseStateChangeCallback g_stateChangeCallback = nullptr;

void NythNoise_SetAudioDataCallback(NythNoiseDataCallback callback) {
    g_dataCallback = callback;
}

void NythNoise_SetErrorCallback(NythNoiseErrorCallback callback) {
    g_errorCallback = callback;
}

void NythNoise_SetStateChangeCallback(NythNoiseStateChangeCallback callback) {
    g_stateChangeCallback = callback;
}

} // extern "C"

// === Implémentation C++ pour TurboModule ===

namespace facebook {
namespace react {



NativeAudioNoiseModule::~NativeAudioNoiseModule() {
    std::lock_guard<std::mutex> lock(noiseMutex_);
    advancedSpectralNR_.reset();
    imcra_.reset();
    wienerFilter_.reset();
    multibandProcessor_.reset();
    noiseReducer_.reset();
    rnNoiseSuppressor_.reset();
}

// === Méthodes privées ===

void NativeAudioNoiseModule::initializeNoiseSystem(const NythNoiseConfig& config) {
    // Initialize Advanced Spectral NR
    AudioNR::AdvancedSpectralNR::Config advConfig;
    advConfig.sampleRate = config.sampleRate;
    advConfig.fftSize = config.fftSize;
    advConfig.hopSize = config.hopSize;
    advConfig.aggressiveness = config.aggressiveness;
    advConfig.enableMultiband = config.enableMultiband;
    advConfig.preserveTransients = config.preserveTransients;
    advConfig.reduceMusicalNoise = config.reduceMusicalNoise;

    switch (config.algorithm) {
        case NOISE_ALGORITHM_ADVANCED_SPECTRAL:
            advConfig.algorithm = AudioNR::AdvancedSpectralNR::Config::Algorithm::MMSE_LSA;
            break;
        case NOISE_ALGORITHM_WIENER_FILTER:
            advConfig.algorithm = AudioNR::AdvancedSpectralNR::Config::Algorithm::WIENER_FILTER;
            break;
        case NOISE_ALGORITHM_MULTIBAND:
            advConfig.algorithm = AudioNR::AdvancedSpectralNR::Config::Algorithm::MULTIBAND;
            break;
        case NOISE_ALGORITHM_TWO_STEP:
            advConfig.algorithm = AudioNR::AdvancedSpectralNR::Config::Algorithm::TWO_STEP;
            break;
        default:
            advConfig.algorithm = AudioNR::AdvancedSpectralNR::Config::Algorithm::SPECTRAL_SUBTRACTION;
            break;
    }

    advancedSpectralNR_ = std::make_unique<AudioNR::AdvancedSpectralNR>(advConfig);

    // Initialize Noise Reducer for temporal processing
    noiseReducer_ = std::make_unique<AudioNR::NoiseReducer>(config.sampleRate, config.channels);

    currentState_ = NOISE_STATE_INITIALIZED;
}

NythNoiseAlgorithm NativeAudioNoiseModule::stringToAlgorithm(const std::string& algorithmStr) const {
    if (algorithmStr == "advanced_spectral") return NOISE_ALGORITHM_ADVANCED_SPECTRAL;
    if (algorithmStr == "wiener_filter") return NOISE_ALGORITHM_WIENER_FILTER;
    if (algorithmStr == "multiband") return NOISE_ALGORITHM_MULTIBAND;
    if (algorithmStr == "two_step") return NOISE_ALGORITHM_TWO_STEP;
    if (algorithmStr == "hybrid") return NOISE_ALGORITHM_HYBRID;
    return NOISE_ALGORITHM_SPECTRAL_SUBTRACTION;
}

std::string NativeAudioNoiseModule::algorithmToString(NythNoiseAlgorithm algorithm) const {
    switch (algorithm) {
        case NOISE_ALGORITHM_ADVANCED_SPECTRAL: return "advanced_spectral";
        case NOISE_ALGORITHM_WIENER_FILTER: return "wiener_filter";
        case NOISE_ALGORITHM_MULTIBAND: return "multiband";
        case NOISE_ALGORITHM_TWO_STEP: return "two_step";
        case NOISE_ALGORITHM_HYBRID: return "hybrid";
        default: return "spectral_subtraction";
    }
}

void NativeAudioNoiseModule::handleAudioData(const float* input, float* output,
                                           size_t frameCount, int channels) {
    // Handle audio data callbacks
}

void NativeAudioNoiseModule::handleError(const std::string& error) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    if (jsCallbacks_.errorCallback && runtime_) {
        try {
            auto& rt = *runtime_;
            jsCallbacks_.errorCallback->call(rt, jsi::String::createFromUtf8(rt, error));
        } catch (...) {
        }
    }
}

void NativeAudioNoiseModule::handleStateChange(NythNoiseState oldState,
                                             NythNoiseState newState) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    if (jsCallbacks_.stateChangeCallback && runtime_) {
        try {
            auto& rt = *runtime_;
            auto oldStr = jsi::String::createFromUtf8(rt, stateToString(oldState));
            auto newStr = jsi::String::createFromUtf8(rt, stateToString(newState));
            jsCallbacks_.stateChangeCallback->call(rt, oldStr, newStr);
        } catch (...) {
        }
    }
}

std::string NativeAudioNoiseModule::stateToString(NythNoiseState state) const {
    switch (state) {
        case NOISE_STATE_UNINITIALIZED: return "uninitialized";
        case NOISE_STATE_INITIALIZED: return "initialized";
        case NOISE_STATE_PROCESSING: return "processing";
        case NOISE_STATE_ERROR: return "error";
        default: return "unknown";
    }
}

// === Conversion JSI <-> Native ===

NythNoiseConfig NativeAudioNoiseModule::parseNoiseConfig(
    jsi::Runtime& rt, const jsi::Object& jsConfig) {

    NythNoiseConfig config = currentConfig_;

    if (jsConfig.hasProperty(rt, "algorithm")) {
        std::string algStr = jsConfig.getProperty(rt, "algorithm").asString(rt).utf8(rt);
        config.algorithm = stringToAlgorithm(algStr);
    }

    if (jsConfig.hasProperty(rt, "sampleRate")) {
        config.sampleRate = static_cast<uint32_t>(jsConfig.getProperty(rt, "sampleRate").asNumber());
    }

    if (jsConfig.hasProperty(rt, "channels")) {
        config.channels = static_cast<int>(jsConfig.getProperty(rt, "channels").asNumber());
    }

    if (jsConfig.hasProperty(rt, "fftSize")) {
        config.fftSize = static_cast<size_t>(jsConfig.getProperty(rt, "fftSize").asNumber());
    }

    if (jsConfig.hasProperty(rt, "hopSize")) {
        config.hopSize = static_cast<size_t>(jsConfig.getProperty(rt, "hopSize").asNumber());
    }

    if (jsConfig.hasProperty(rt, "aggressiveness")) {
        config.aggressiveness = static_cast<float>(jsConfig.getProperty(rt, "aggressiveness").asNumber());
    }

    if (jsConfig.hasProperty(rt, "enableMultiband")) {
        auto v = jsConfig.getProperty(rt, "enableMultiband");
        config.enableMultiband = v.isBool() ? v.getBool() : v.asNumber() != 0;
    }

    if (jsConfig.hasProperty(rt, "preserveTransients")) {
        auto v = jsConfig.getProperty(rt, "preserveTransients");
        config.preserveTransients = v.isBool() ? v.getBool() : v.asNumber() != 0;
    }

    if (jsConfig.hasProperty(rt, "reduceMusicalNoise")) {
        auto v = jsConfig.getProperty(rt, "reduceMusicalNoise");
        config.reduceMusicalNoise = v.isBool() ? v.getBool() : v.asNumber() != 0;
    }

    return config;
}

jsi::Object NativeAudioNoiseModule::noiseConfigToJS(
    jsi::Runtime& rt, const NythNoiseConfig& config) {

    jsi::Object jsConfig(rt);

    jsConfig.setProperty(rt, "algorithm", jsi::String::createFromUtf8(rt, algorithmToString(config.algorithm)));
    jsConfig.setProperty(rt, "sampleRate", jsi::Value(static_cast<int>(config.sampleRate)));
    jsConfig.setProperty(rt, "channels", jsi::Value(config.channels));
    jsConfig.setProperty(rt, "fftSize", jsi::Value(static_cast<int>(config.fftSize)));
    jsConfig.setProperty(rt, "hopSize", jsi::Value(static_cast<int>(config.hopSize)));
    jsConfig.setProperty(rt, "aggressiveness", jsi::Value(config.aggressiveness));
    jsConfig.setProperty(rt, "enableMultiband", jsi::Value(config.enableMultiband));
    jsConfig.setProperty(rt, "preserveTransients", jsi::Value(config.preserveTransients));
    jsConfig.setProperty(rt, "reduceMusicalNoise", jsi::Value(config.reduceMusicalNoise));

    return jsConfig;
}

jsi::Object NativeAudioNoiseModule::statisticsToJS(
    jsi::Runtime& rt, const NythNoiseStatistics& stats) {

    jsi::Object jsStats(rt);

    jsStats.setProperty(rt, "inputLevel", jsi::Value(stats.inputLevel));
    jsStats.setProperty(rt, "outputLevel", jsi::Value(stats.outputLevel));
    jsStats.setProperty(rt, "estimatedSNR", jsi::Value(stats.estimatedSNR));
    jsStats.setProperty(rt, "noiseReductionDB", jsi::Value(stats.noiseReductionDB));
    jsStats.setProperty(rt, "processedFrames", jsi::Value(static_cast<double>(stats.processedFrames)));
    jsStats.setProperty(rt, "processedSamples", jsi::Value(static_cast<double>(stats.processedSamples)));
    jsStats.setProperty(rt, "durationMs", jsi::Value(static_cast<double>(stats.durationMs)));
    jsStats.setProperty(rt, "speechProbability", jsi::Value(stats.speechProbability));
    jsStats.setProperty(rt, "musicalNoiseLevel", jsi::Value(stats.musicalNoiseLevel));

    return jsStats;
}

// === Méthodes publiques ===

jsi::Value NativeAudioNoiseModule::initialize(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(noiseMutex_);

    try {
        auto nativeConfig = parseNoiseConfig(rt, config);
        initializeNoiseSystem(nativeConfig);
        currentConfig_ = nativeConfig;
        // Initialize C API for coherence
        NythNoise_Release();
        NythNoise_Initialize(&currentConfig_);
        runtime_ = &rt;
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(std::string("Initialization failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioNoiseModule::start(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(noiseMutex_);

    if (currentState_.load() == NOISE_STATE_INITIALIZED) {
        if (NythNoise_Start()) {
            currentState_ = NOISE_STATE_PROCESSING;
            return jsi::Value(true);
        }
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioNoiseModule::stop(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(noiseMutex_);

    if (currentState_.load() == NOISE_STATE_PROCESSING) {
        if (NythNoise_Stop()) {
            currentState_ = NOISE_STATE_INITIALIZED;
            return jsi::Value(true);
        }
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioNoiseModule::dispose(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(noiseMutex_);

    advancedSpectralNR_.reset();
    imcra_.reset();
    wienerFilter_.reset();
    multibandProcessor_.reset();
    noiseReducer_.reset();
    rnNoiseSuppressor_.reset();
    NythNoise_Release();
    currentState_ = NOISE_STATE_UNINITIALIZED;

    return jsi::Value(true);
}

jsi::Value NativeAudioNoiseModule::getState(jsi::Runtime& rt) {
    return jsi::String::createFromUtf8(rt, stateToString(currentState_.load()));
}

jsi::Value NativeAudioNoiseModule::getStatistics(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(noiseMutex_);
    NythNoise_GetStatistics(&currentStats_);
    return statisticsToJS(rt, currentStats_);
}

jsi::Value NativeAudioNoiseModule::resetStatistics(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(noiseMutex_);
    NythNoise_ResetStatistics();
    return jsi::Value(true);
}

jsi::Value NativeAudioNoiseModule::getConfig(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(noiseMutex_);
    return noiseConfigToJS(rt, currentConfig_);
}

jsi::Value NativeAudioNoiseModule::updateConfig(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(noiseMutex_);

    try {
        auto nativeConfig = parseNoiseConfig(rt, config);
        initializeNoiseSystem(nativeConfig);
        currentConfig_ = nativeConfig;
        // Keep C API in sync
        NythNoise_UpdateConfig(&currentConfig_);
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(std::string("Config update failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioNoiseModule::setAlgorithm(jsi::Runtime& rt, const jsi::String& algorithm) {
    std::lock_guard<std::mutex> lock(noiseMutex_);

    std::string algStr = algorithm.utf8(rt);
    currentConfig_.algorithm = stringToAlgorithm(algStr);

    // Reinitialize with new algorithm
    try {
        initializeNoiseSystem(currentConfig_);
        NythNoise_SetAlgorithm(currentConfig_.algorithm);
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(std::string("Algorithm change failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioNoiseModule::setAggressiveness(jsi::Runtime& rt, float aggressiveness) {
    std::lock_guard<std::mutex> lock(noiseMutex_);

    currentConfig_.aggressiveness = aggressiveness;

    if (advancedSpectralNR_) {
        advancedSpectralNR_->setAggressiveness(aggressiveness);
    }
    NythNoise_SetAggressiveness(aggressiveness);

    return jsi::Value(true);
}

// === Traitement audio ===

jsi::Value NativeAudioNoiseModule::processAudio(jsi::Runtime& rt, const jsi::Array& input, int channels) {
    std::lock_guard<std::mutex> lock(noiseMutex_);

    if (channels <= 0) {
        return jsi::Value::null();
    }
    size_t inputLen = input.length(rt);
    if (inputLen % static_cast<size_t>(channels) != 0) {
        return jsi::Value::null();
    }
    size_t frameCount = inputLen / static_cast<size_t>(channels);
    std::vector<float> inputBuffer(inputLen);
    std::vector<float> outputBuffer(inputLen);

    // Convertir l'array JSI en buffer C++
    for (size_t i = 0; i < inputLen; ++i) {
        inputBuffer[i] = static_cast<float>(input.getValueAtIndex(rt, i).asNumber());
    }

    if (NythNoise_ProcessAudio(inputBuffer.data(), outputBuffer.data(), frameCount, channels)) {
        // Convertir le résultat en array JSI
        jsi::Array result(rt, outputBuffer.size());
        for (size_t i = 0; i < outputBuffer.size(); ++i) {
            result.setValueAtIndex(rt, i, jsi::Value(outputBuffer[i]));
        }
        return result;
    }

    return jsi::Value::null();
}

jsi::Value NativeAudioNoiseModule::processAudioStereo(jsi::Runtime& rt,
                                                    const jsi::Array& inputL,
                                                    const jsi::Array& inputR) {
    std::lock_guard<std::mutex> lock(noiseMutex_);

    size_t frameCount = inputL.length(rt);
    if (frameCount == 0 || frameCount != inputR.length(rt)) {
        return jsi::Value::null();
    }

    std::vector<float> inputLBuffer(frameCount);
    std::vector<float> inputRBuffer(frameCount);
    std::vector<float> outputLBuffer(frameCount);
    std::vector<float> outputRBuffer(frameCount);

    // Convertir les arrays JSI en buffers C++
    for (size_t i = 0; i < frameCount; ++i) {
        inputLBuffer[i] = static_cast<float>(inputL.getValueAtIndex(rt, i).asNumber());
        inputRBuffer[i] = static_cast<float>(inputR.getValueAtIndex(rt, i).asNumber());
    }

    if (NythNoise_ProcessAudioStereo(inputLBuffer.data(), inputRBuffer.data(),
                                   outputLBuffer.data(), outputRBuffer.data(), frameCount)) {
        // Convertir les résultats en objet JSI
        jsi::Object result(rt);
        jsi::Array resultL(rt, frameCount);
        jsi::Array resultR(rt, frameCount);

        for (size_t i = 0; i < frameCount; ++i) {
            resultL.setValueAtIndex(rt, i, jsi::Value(outputLBuffer[i]));
            resultR.setValueAtIndex(rt, i, jsi::Value(outputRBuffer[i]));
        }

        result.setProperty(rt, "left", std::move(resultL));
        result.setProperty(rt, "right", std::move(resultR));
        return result;
    }

    return jsi::Value::null();
}

// === Analyse audio ===

jsi::Value NativeAudioNoiseModule::getInputLevel(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(noiseMutex_);
    return jsi::Value(NythNoise_GetInputLevel());
}

jsi::Value NativeAudioNoiseModule::getOutputLevel(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(noiseMutex_);
    return jsi::Value(NythNoise_GetOutputLevel());
}

jsi::Value NativeAudioNoiseModule::getEstimatedSNR(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(noiseMutex_);
    return jsi::Value(NythNoise_GetEstimatedSNR());
}

jsi::Value NativeAudioNoiseModule::getSpeechProbability(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(noiseMutex_);
    return jsi::Value(NythNoise_GetSpeechProbability());
}

jsi::Value NativeAudioNoiseModule::getMusicalNoiseLevel(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(noiseMutex_);
    return jsi::Value(NythNoise_GetMusicalNoiseLevel());
}

// === Configuration avancée ===

jsi::Value NativeAudioNoiseModule::initializeIMCRA(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(noiseMutex_);

    NythIMCRAConfig imcraConfig;
    // Parse config from JSI object
    if (config.hasProperty(rt, "fftSize")) {
        imcraConfig.fftSize = static_cast<size_t>(config.getProperty(rt, "fftSize").asNumber());
    }
    if (config.hasProperty(rt, "sampleRate")) {
        imcraConfig.sampleRate = static_cast<uint32_t>(config.getProperty(rt, "sampleRate").asNumber());
    }
    // Add other config parsing...

    if (NythNoise_InitializeIMCRA(&imcraConfig)) {
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioNoiseModule::getIMCRAConfig(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(noiseMutex_);

    NythIMCRAConfig config;
    NythNoise_GetIMCRAConfig(&config);
    return imcraConfigToJS(rt, config);
}

jsi::Value NativeAudioNoiseModule::updateIMCRAConfig(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(noiseMutex_);

    NythIMCRAConfig imcraConfig;
    // Parse config from JSI object (same as initializeIMCRA)

    if (NythNoise_UpdateIMCRAConfig(&imcraConfig)) {
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

// Implementations for Wiener and Multiband configs would follow the same pattern
jsi::Value NativeAudioNoiseModule::initializeWiener(jsi::Runtime& rt, const jsi::Object& config) {
    return jsi::Value(true); // Placeholder
}

jsi::Value NativeAudioNoiseModule::getWienerConfig(jsi::Runtime& rt) {
    NythWienerConfig config;
    NythNoise_GetWienerConfig(&config);
    return wienerConfigToJS(rt, config);
}

jsi::Value NativeAudioNoiseModule::updateWienerConfig(jsi::Runtime& rt, const jsi::Object& config) {
    return jsi::Value(true); // Placeholder
}

jsi::Value NativeAudioNoiseModule::initializeMultiband(jsi::Runtime& rt, const jsi::Object& config) {
    return jsi::Value(true); // Placeholder
}

jsi::Value NativeAudioNoiseModule::getMultibandConfig(jsi::Runtime& rt) {
    NythMultibandConfig config;
    NythNoise_GetMultibandConfig(&config);
    return multibandConfigToJS(rt, config);
}

jsi::Value NativeAudioNoiseModule::updateMultibandConfig(jsi::Runtime& rt, const jsi::Object& config) {
    return jsi::Value(true); // Placeholder
}

// === Callbacks JavaScript ===

jsi::Value NativeAudioNoiseModule::setAudioDataCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    runtime_ = &rt;
    jsCallbacks_.audioDataCallback = std::make_shared<jsi::Function>(callback);
    return jsi::Value(true);
}

jsi::Value NativeAudioNoiseModule::setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    runtime_ = &rt;
    jsCallbacks_.errorCallback = std::make_shared<jsi::Function>(callback);
    return jsi::Value(true);
}

jsi::Value NativeAudioNoiseModule::setStateChangeCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    runtime_ = &rt;
    jsCallbacks_.stateChangeCallback = std::make_shared<jsi::Function>(callback);
    return jsi::Value(true);
}

jsi::Value NativeAudioNoiseModule::install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker) {
    auto module = std::make_shared<NativeAudioNoiseModule>(jsInvoker);

    auto object = jsi::Object(rt);

    auto registerMethod = [&](const char* name, size_t paramCount,
                               std::function<jsi::Value(NativeAudioNoiseModule*, jsi::Runtime&, const jsi::Value*, size_t)> method) {
        object.setProperty(
            rt, name,
            jsi::Function::createFromHostFunction(
                rt, jsi::PropNameID::forAscii(rt, name), static_cast<unsigned int>(paramCount),
                [module, method](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t count) -> jsi::Value {
                    return method(module.get(), rt, args, count);
                }));
    };

    // Cycle de vie
    registerMethod("initialize", 1, [](auto* m, auto& rt, auto* args, auto) {
        return m->initialize(rt, args[0].asObject(rt));
    });
    registerMethod("start", 0, [](auto* m, auto& rt, auto*, auto) { return m->start(rt); });
    registerMethod("stop", 0, [](auto* m, auto& rt, auto*, auto) { return m->stop(rt); });
    registerMethod("dispose", 0, [](auto* m, auto& rt, auto*, auto) { return m->dispose(rt); });

    // État et infos
    registerMethod("getState", 0, [](auto* m, auto& rt, auto*, auto) { return m->getState(rt); });
    registerMethod("getStatistics", 0, [](auto* m, auto& rt, auto*, auto) { return m->getStatistics(rt); });
    registerMethod("resetStatistics", 0, [](auto* m, auto& rt, auto*, auto) { return m->resetStatistics(rt); });

    // Configuration
    registerMethod("getConfig", 0, [](auto* m, auto& rt, auto*, auto) { return m->getConfig(rt); });
    registerMethod("updateConfig", 1, [](auto* m, auto& rt, auto* args, auto) {
        return m->updateConfig(rt, args[0].asObject(rt));
    });
    registerMethod("setAlgorithm", 1, [](auto* m, auto& rt, auto* args, auto) {
        return m->setAlgorithm(rt, args[0].asString(rt));
    });
    registerMethod("setAggressiveness", 1, [](auto* m, auto& rt, auto* args, auto) {
        return m->setAggressiveness(rt, static_cast<float>(args[0].asNumber()));
    });

    // Traitement audio
    registerMethod("processAudio", 2, [](auto* m, auto& rt, auto* args, auto) {
        return m->processAudio(rt, args[0].asObject(rt).asArray(rt), static_cast<int>(args[1].asNumber()));
    });
    registerMethod("processAudioStereo", 2, [](auto* m, auto& rt, auto* args, auto) {
        return m->processAudioStereo(rt, args[0].asObject(rt).asArray(rt), args[1].asObject(rt).asArray(rt));
    });

    // Analyse
    registerMethod("getInputLevel", 0, [](auto* m, auto& rt, auto*, auto) { return m->getInputLevel(rt); });
    registerMethod("getOutputLevel", 0, [](auto* m, auto& rt, auto*, auto) { return m->getOutputLevel(rt); });
    registerMethod("getEstimatedSNR", 0, [](auto* m, auto& rt, auto*, auto) { return m->getEstimatedSNR(rt); });
    registerMethod("getSpeechProbability", 0, [](auto* m, auto& rt, auto*, auto) { return m->getSpeechProbability(rt); });
    registerMethod("getMusicalNoiseLevel", 0, [](auto* m, auto& rt, auto*, auto) { return m->getMusicalNoiseLevel(rt); });

    // Callbacks
    registerMethod("setAudioDataCallback", 1, [](auto* m, auto& rt, auto* args, auto) {
        return m->setAudioDataCallback(rt, args[0].asObject(rt).asFunction(rt));
    });
    registerMethod("setErrorCallback", 1, [](auto* m, auto& rt, auto* args, auto) {
        return m->setErrorCallback(rt, args[0].asObject(rt).asFunction(rt));
    });
    registerMethod("setStateChangeCallback", 1, [](auto* m, auto& rt, auto* args, auto) {
        return m->setStateChangeCallback(rt, args[0].asObject(rt).asFunction(rt));
    });

    // Installer le module dans le runtime global
    rt.global().setProperty(rt, "NativeAudioNoiseModule", object);

    return object;
}

void NativeAudioNoiseModule::invokeJSCallback(
    const std::string& callbackName,
    std::function<void(jsi::Runtime&)> invocation) {
    try {
        if (runtime_) {
            invocation(*runtime_);
        }
    } catch (...) {
    }
}

// Helper function implementations (placeholders for now)
NythIMCRAConfig NativeAudioNoiseModule::parseIMCRAConfig(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    NythIMCRAConfig config = {};
    // Implementation would parse JSI object into config struct
    return config;
}

jsi::Object NativeAudioNoiseModule::imcraConfigToJS(jsi::Runtime& rt, const NythIMCRAConfig& config) {
    jsi::Object jsConfig(rt);
    // Implementation would convert config struct to JSI object
    return jsConfig;
}

NythWienerConfig NativeAudioNoiseModule::parseWienerConfig(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    NythWienerConfig config = {};
    // Implementation would parse JSI object into config struct
    return config;
}

jsi::Object NativeAudioNoiseModule::wienerConfigToJS(jsi::Runtime& rt, const NythWienerConfig& config) {
    jsi::Object jsConfig(rt);
    // Implementation would convert config struct to JSI object
    return jsConfig;
}

NythMultibandConfig NativeAudioNoiseModule::parseMultibandConfig(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    NythMultibandConfig config = {};
    // Implementation would parse JSI object into config struct
    return config;
}

jsi::Object NativeAudioNoiseModule::multibandConfigToJS(jsi::Runtime& rt, const NythMultibandConfig& config) {
    jsi::Object jsConfig(rt);
    // Implementation would convert config struct to JSI object
    return jsConfig;
}

// === Fonction d'enregistrement du module ===
std::shared_ptr<TurboModule> NativeAudioNoiseModuleProvider(
    std::shared_ptr<CallInvoker> jsInvoker) {
    return std::make_shared<NativeAudioNoiseModule>(jsInvoker);
}

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_NOISE_ENABLED
