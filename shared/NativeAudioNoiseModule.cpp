#include "NativeAudioNoiseModule.h"

#if NYTH_AUDIO_NOISE_ENABLED

#include "Audio/noise/AdvancedSpectralNR.hpp"
#include "Audio/noise/IMCRA.hpp"
#include "Audio/noise/MultibandProcessor.hpp"
#include "Audio/noise/NoiseReducer.hpp"
#include "Audio/noise/RNNoiseSuppressor.hpp"
#include "Audio/noise/WienerFilter.hpp"
#include <algorithm>
#include <chrono>
#include <cmath>
#include <sstream>

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
    if (!config)
        return false;

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
    if (!stats)
        return;

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
    if (!config)
        return;

    std::lock_guard<std::mutex> lock(g_globalMutex);
    *config = g_currentConfig;
}

bool NythNoise_UpdateConfig(const NythNoiseConfig* config) {
    if (!config)
        return false;

    std::lock_guard<std::mutex> lock(g_globalMutex);
    return NythNoise_Initialize(config);
}

bool NythNoise_SetAlgorithm(NythNoiseAlgorithm algorithm) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (g_currentState == NOISE_STATE_UNINITIALIZED)
        return false;

    g_currentConfig.algorithm = algorithm;

    // Reinitialize with new algorithm
    return NythNoise_Initialize(&g_currentConfig);
}

bool NythNoise_SetAggressiveness(float aggressiveness) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (g_currentState == NOISE_STATE_UNINITIALIZED)
        return false;

    g_currentConfig.aggressiveness = aggressiveness;

    if (g_advancedSpectralNR) {
        g_advancedSpectralNR->setAggressiveness(aggressiveness);
    }

    return true;
}

// === Traitement audio ===
bool NythNoise_ProcessAudio(const float* input, float* output, size_t frameCount, int channels) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (g_currentState != NOISE_STATE_PROCESSING)
        return false;
    if (!input || !output || frameCount == 0)
        return false;

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

bool NythNoise_ProcessAudioStereo(const float* inputL, const float* inputR, float* outputL, float* outputR,
                                  size_t frameCount) {
    std::lock_guard<std::mutex> lock(g_globalMutex);

    if (g_currentState != NOISE_STATE_PROCESSING)
        return false;
    if (!inputL || !inputR || !outputL || !outputR || frameCount == 0)
        return false;

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
    if (!config)
        return false;

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
    if (!config || !g_imcra)
        return;

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
    if (!config || !g_imcra)
        return false;
    return NythNoise_InitializeIMCRA(config);
}

// Wiener
bool NythNoise_InitializeWiener(const NythWienerConfig* config) {
    if (!config)
        return false;

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
    if (!config)
        return;

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
    if (!config)
        return false;
    return NythNoise_InitializeWiener(config);
}

// Multi-bandes
bool NythNoise_InitializeMultiband(const NythMultibandConfig* config) {
    if (!config)
        return false;

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
    if (!config)
        return;

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
    if (!config)
        return false;
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
    if (algorithmStr == "advanced_spectral")
        return NOISE_ALGORITHM_ADVANCED_SPECTRAL;
    if (algorithmStr == "wiener_filter")
        return NOISE_ALGORITHM_WIENER_FILTER;
    if (algorithmStr == "multiband")
        return NOISE_ALGORITHM_MULTIBAND;
    if (algorithmStr == "two_step")
        return NOISE_ALGORITHM_TWO_STEP;
    if (algorithmStr == "hybrid")
        return NOISE_ALGORITHM_HYBRID;
    return NOISE_ALGORITHM_SPECTRAL_SUBTRACTION;
}

std::string NativeAudioNoiseModule::algorithmToString(NythNoiseAlgorithm algorithm) const {
    switch (algorithm) {
        case NOISE_ALGORITHM_ADVANCED_SPECTRAL:
            return "advanced_spectral";
        case NOISE_ALGORITHM_WIENER_FILTER:
            return "wiener_filter";
        case NOISE_ALGORITHM_MULTIBAND:
            return "multiband";
        case NOISE_ALGORITHM_TWO_STEP:
            return "two_step";
        case NOISE_ALGORITHM_HYBRID:
            return "hybrid";
        default:
            return "spectral_subtraction";
    }
}

void NativeAudioNoiseModule::handleAudioData(const float* input, float* output, size_t frameCount, int channels) {
    // Handle audio data callbacks
    std::lock_guard<std::mutex> lock(callbackMutex_);

    if (jsCallbacks_.audioDataCallback && jsInvoker_) {
        // Créer des arrays JSI pour les données audio
        jsInvoker_->invokeAsync([this, input, output, frameCount, channels]() {
            // Note: Dans un contexte réel, il faudrait capturer le runtime approprié
            // et créer les arrays JSI avec les données audio
            // Ceci est une implémentation conceptuelle

            // Exemple de ce qui devrait être fait :
            // jsi::Array inputArray(rt, frameCount * channels);
            // jsi::Array outputArray(rt, frameCount * channels);
            //
            // for (size_t i = 0; i < frameCount * channels; ++i) {
            //     inputArray.setValueAtIndex(rt, i, jsi::Value(input[i]));
            //     outputArray.setValueAtIndex(rt, i, jsi::Value(output[i]));
            // }
            //
            // jsi::Object audioData(rt);
            // audioData.setProperty(rt, "input", inputArray);
            // audioData.setProperty(rt, "output", outputArray);
            // audioData.setProperty(rt, "frameCount", jsi::Value(static_cast<int>(frameCount)));
            // audioData.setProperty(rt, "channels", jsi::Value(channels));
            //
            // (*jsCallbacks_.audioDataCallback)(rt, audioData);
        });
    }
}

void NativeAudioNoiseModule::handleError(const std::string& error) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    if (jsCallbacks_.errorCallback && jsInvoker_) {
        jsInvoker_->invokeAsync([this, error]() {
            // Note: Dans un contexte réel, il faudrait capturer le runtime approprié
            // rt serait le runtime JavaScript
            // (*jsCallbacks_.errorCallback)(rt, jsi::String::createFromUtf8(rt, error));
        });
    }
}

void NativeAudioNoiseModule::handleStateChange(NythNoiseState oldState, NythNoiseState newState) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    if (jsCallbacks_.stateChangeCallback && jsInvoker_) {
        std::string oldStateStr = stateToString(oldState);
        std::string newStateStr = stateToString(newState);

        jsInvoker_->invokeAsync([this, oldStateStr, newStateStr]() {
            // Note: Dans un contexte réel, il faudrait capturer le runtime approprié
            // rt serait le runtime JavaScript
            // jsi::Object stateChange(rt);
            // stateChange.setProperty(rt, "oldState", jsi::String::createFromUtf8(rt, oldStateStr));
            // stateChange.setProperty(rt, "newState", jsi::String::createFromUtf8(rt, newStateStr));
            // (*jsCallbacks_.stateChangeCallback)(rt, stateChange);
        });
    }
}

std::string NativeAudioNoiseModule::stateToString(NythNoiseState state) const {
    switch (state) {
        case NOISE_STATE_UNINITIALIZED:
            return "uninitialized";
        case NOISE_STATE_INITIALIZED:
            return "initialized";
        case NOISE_STATE_PROCESSING:
            return "processing";
        case NOISE_STATE_ERROR:
            return "error";
        default:
            return "unknown";
    }
}

// === Conversion JSI <-> Native ===

NythNoiseConfig NativeAudioNoiseModule::parseNoiseConfig(jsi::Runtime& rt, const jsi::Object& jsConfig) {
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
        config.enableMultiband = jsConfig.getProperty(rt, "enableMultiband").asBool();
    }

    if (jsConfig.hasProperty(rt, "preserveTransients")) {
        config.preserveTransients = jsConfig.getProperty(rt, "preserveTransients").asBool();
    }

    if (jsConfig.hasProperty(rt, "reduceMusicalNoise")) {
        config.reduceMusicalNoise = jsConfig.getProperty(rt, "reduceMusicalNoise").asBool();
    }

    return config;
}

jsi::Object NativeAudioNoiseModule::noiseConfigToJS(jsi::Runtime& rt, const NythNoiseConfig& config) {
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

jsi::Object NativeAudioNoiseModule::statisticsToJS(jsi::Runtime& rt, const NythNoiseStatistics& stats) {
    jsi::Object jsStats(rt);

    jsStats.setProperty(rt, "inputLevel", jsi::Value(stats.inputLevel));
    jsStats.setProperty(rt, "outputLevel", jsi::Value(stats.outputLevel));
    jsStats.setProperty(rt, "estimatedSNR", jsi::Value(stats.estimatedSNR));
    jsStats.setProperty(rt, "noiseReductionDB", jsi::Value(stats.noiseReductionDB));
    jsStats.setProperty(rt, "processedFrames", jsi::Value(static_cast<int>(stats.processedFrames)));
    jsStats.setProperty(rt, "processedSamples", jsi::Value(static_cast<int>(stats.processedSamples)));
    jsStats.setProperty(rt, "durationMs", jsi::Value(static_cast<int>(stats.durationMs)));
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
        return jsi::Value(true);
    } catch (const std::exception& e) {
        handleError(std::string("Initialization failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioNoiseModule::start(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(noiseMutex_);

    if (currentState_.load() == NOISE_STATE_INITIALIZED) {
        currentState_ = NOISE_STATE_PROCESSING;
        return jsi::Value(true);
    }

    return jsi::Value(false);
}

jsi::Value NativeAudioNoiseModule::stop(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(noiseMutex_);

    if (currentState_.load() == NOISE_STATE_PROCESSING) {
        currentState_ = NOISE_STATE_INITIALIZED;
        return jsi::Value(true);
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

    return jsi::Value(true);
}

// === Traitement audio ===

jsi::Value NativeAudioNoiseModule::processAudio(jsi::Runtime& rt, const jsi::Array& input, int channels) {
    std::lock_guard<std::mutex> lock(noiseMutex_);

    size_t frameCount = input.length(rt) / channels;
    std::vector<float> inputBuffer(input.length(rt));
    std::vector<float> outputBuffer(input.length(rt));

    // Convertir l'array JSI en buffer C++
    for (size_t i = 0; i < input.length(rt); ++i) {
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

jsi::Value NativeAudioNoiseModule::processAudioStereo(jsi::Runtime& rt, const jsi::Array& inputL,
                                                      const jsi::Array& inputR) {
    std::lock_guard<std::mutex> lock(noiseMutex_);

    size_t frameCount = inputL.length(rt);
    if (frameCount != inputR.length(rt)) {
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

    if (NythNoise_ProcessAudioStereo(inputLBuffer.data(), inputRBuffer.data(), outputLBuffer.data(),
                                     outputRBuffer.data(), frameCount)) {
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

    try {
        auto imcraConfig = parseIMCRAConfig(rt, config);
        if (NythNoise_InitializeIMCRA(&imcraConfig)) {
            return jsi::Value(true);
        }
        return jsi::Value(false);
    } catch (const std::exception& e) {
        handleError(std::string("IMCRA initialization failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioNoiseModule::getIMCRAConfig(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(noiseMutex_);

    NythIMCRAConfig config;
    NythNoise_GetIMCRAConfig(&config);
    return imcraConfigToJS(rt, config);
}

jsi::Value NativeAudioNoiseModule::updateIMCRAConfig(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(noiseMutex_);

    try {
        auto imcraConfig = parseIMCRAConfig(rt, config);
        if (NythNoise_UpdateIMCRAConfig(&imcraConfig)) {
            return jsi::Value(true);
        }
        return jsi::Value(false);
    } catch (const std::exception& e) {
        handleError(std::string("IMCRA config update failed: ") + e.what());
        return jsi::Value(false);
    }
}

// Implementations for Wiener and Multiband configs would follow the same pattern
jsi::Value NativeAudioNoiseModule::initializeWiener(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(noiseMutex_);

    try {
        auto wienerConfig = parseWienerConfig(rt, config);
        if (NythNoise_InitializeWiener(&wienerConfig)) {
            return jsi::Value(true);
        }
        return jsi::Value(false);
    } catch (const std::exception& e) {
        handleError(std::string("Wiener filter initialization failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioNoiseModule::getWienerConfig(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(noiseMutex_);

    NythWienerConfig config;
    NythNoise_GetWienerConfig(&config);
    return wienerConfigToJS(rt, config);
}

jsi::Value NativeAudioNoiseModule::updateWienerConfig(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(noiseMutex_);

    try {
        auto wienerConfig = parseWienerConfig(rt, config);
        if (NythNoise_UpdateWienerConfig(&wienerConfig)) {
            return jsi::Value(true);
        }
        return jsi::Value(false);
    } catch (const std::exception& e) {
        handleError(std::string("Wiener filter config update failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioNoiseModule::initializeMultiband(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(noiseMutex_);

    try {
        auto multibandConfig = parseMultibandConfig(rt, config);
        if (NythNoise_InitializeMultiband(&multibandConfig)) {
            return jsi::Value(true);
        }
        return jsi::Value(false);
    } catch (const std::exception& e) {
        handleError(std::string("Multiband processor initialization failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioNoiseModule::getMultibandConfig(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(noiseMutex_);

    NythMultibandConfig config;
    NythNoise_GetMultibandConfig(&config);
    return multibandConfigToJS(rt, config);
}

jsi::Value NativeAudioNoiseModule::updateMultibandConfig(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(noiseMutex_);

    try {
        auto multibandConfig = parseMultibandConfig(rt, config);
        if (NythNoise_UpdateMultibandConfig(&multibandConfig)) {
            return jsi::Value(true);
        }
        return jsi::Value(false);
    } catch (const std::exception& e) {
        handleError(std::string("Multiband processor config update failed: ") + e.what());
        return jsi::Value(false);
    }
}

// === Callbacks JavaScript ===

jsi::Value NativeAudioNoiseModule::setAudioDataCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    jsCallbacks_.audioDataCallback = std::make_shared<jsi::Function>(callback);
    return jsi::Value(true);
}

jsi::Value NativeAudioNoiseModule::setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    jsCallbacks_.errorCallback = std::make_shared<jsi::Function>(callback);
    return jsi::Value(true);
}

jsi::Value NativeAudioNoiseModule::setStateChangeCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(callbackMutex_);
    jsCallbacks_.stateChangeCallback = std::make_shared<jsi::Function>(callback);
    return jsi::Value(true);
}

jsi::Value NativeAudioNoiseModule::install(jsi::Runtime& rt, std::shared_ptr<CallInvoker> jsInvoker) {
    // Installation du module dans le runtime JSI
    try {
        // Créer une instance du module
        auto module = std::make_shared<NativeAudioNoiseModule>(jsInvoker);

        // Créer l'objet JavaScript du module
        jsi::Object jsModule(rt);

        // Ajouter toutes les méthodes publiques
        jsModule.setProperty(
            rt, "initialize",
            jsi::Function::createFromHostFunction(
                rt, jsi::PropNameID::forUtf8(rt, "initialize"), 1,
                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                    if (count < 1 || !args[0].isObject()) {
                        throw jsi::JSError(rt, "initialize requires a config object");
                    }
                    return module->initialize(rt, args[0].asObject(rt));
                }));

        jsModule.setProperty(rt, "start",
                             jsi::Function::createFromHostFunction(
                                 rt, jsi::PropNameID::forUtf8(rt, "start"), 0,
                                 [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                          size_t count) { return module->start(rt); }));

        jsModule.setProperty(rt, "stop",
                             jsi::Function::createFromHostFunction(
                                 rt, jsi::PropNameID::forUtf8(rt, "stop"), 0,
                                 [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                          size_t count) { return module->stop(rt); }));

        jsModule.setProperty(rt, "dispose",
                             jsi::Function::createFromHostFunction(
                                 rt, jsi::PropNameID::forUtf8(rt, "dispose"), 0,
                                 [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                          size_t count) { return module->dispose(rt); }));

        jsModule.setProperty(rt, "getState",
                             jsi::Function::createFromHostFunction(
                                 rt, jsi::PropNameID::forUtf8(rt, "getState"), 0,
                                 [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                          size_t count) { return module->getState(rt); }));

        jsModule.setProperty(rt, "getStatistics",
                             jsi::Function::createFromHostFunction(
                                 rt, jsi::PropNameID::forUtf8(rt, "getStatistics"), 0,
                                 [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                          size_t count) { return module->getStatistics(rt); }));

        jsModule.setProperty(rt, "resetStatistics",
                             jsi::Function::createFromHostFunction(
                                 rt, jsi::PropNameID::forUtf8(rt, "resetStatistics"), 0,
                                 [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                          size_t count) { return module->resetStatistics(rt); }));

        jsModule.setProperty(rt, "getConfig",
                             jsi::Function::createFromHostFunction(
                                 rt, jsi::PropNameID::forUtf8(rt, "getConfig"), 0,
                                 [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                          size_t count) { return module->getConfig(rt); }));

        jsModule.setProperty(
            rt, "updateConfig",
            jsi::Function::createFromHostFunction(
                rt, jsi::PropNameID::forUtf8(rt, "updateConfig"), 1,
                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                    if (count < 1 || !args[0].isObject()) {
                        throw jsi::JSError(rt, "updateConfig requires a config object");
                    }
                    return module->updateConfig(rt, args[0].asObject(rt));
                }));

        jsModule.setProperty(
            rt, "setAlgorithm",
            jsi::Function::createFromHostFunction(
                rt, jsi::PropNameID::forUtf8(rt, "setAlgorithm"), 1,
                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                    if (count < 1 || !args[0].isString()) {
                        throw jsi::JSError(rt, "setAlgorithm requires a string");
                    }
                    return module->setAlgorithm(rt, args[0].asString(rt));
                }));

        jsModule.setProperty(
            rt, "setAggressiveness",
            jsi::Function::createFromHostFunction(
                rt, jsi::PropNameID::forUtf8(rt, "setAggressiveness"), 1,
                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                    if (count < 1 || !args[0].isNumber()) {
                        throw jsi::JSError(rt, "setAggressiveness requires a number");
                    }
                    return module->setAggressiveness(rt, static_cast<float>(args[0].asNumber()));
                }));

        jsModule.setProperty(
            rt, "processAudio",
            jsi::Function::createFromHostFunction(
                rt, jsi::PropNameID::forUtf8(rt, "processAudio"), 2,
                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                    if (count < 2 || !args[0].isObject() || !args[1].isNumber()) {
                        throw jsi::JSError(rt, "processAudio requires an array and channel count");
                    }
                    return module->processAudio(rt, args[0].asObject(rt).asArray(rt),
                                                static_cast<int>(args[1].asNumber()));
                }));

        jsModule.setProperty(
            rt, "processAudioStereo",
            jsi::Function::createFromHostFunction(
                rt, jsi::PropNameID::forUtf8(rt, "processAudioStereo"), 2,
                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                    if (count < 2 || !args[0].isObject() || !args[1].isObject()) {
                        throw jsi::JSError(rt, "processAudioStereo requires two arrays");
                    }
                    return module->processAudioStereo(rt, args[0].asObject(rt).asArray(rt),
                                                      args[1].asObject(rt).asArray(rt));
                }));

        // Ajouter les méthodes d'analyse audio
        jsModule.setProperty(rt, "getInputLevel",
                             jsi::Function::createFromHostFunction(
                                 rt, jsi::PropNameID::forUtf8(rt, "getInputLevel"), 0,
                                 [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                          size_t count) { return module->getInputLevel(rt); }));

        jsModule.setProperty(rt, "getOutputLevel",
                             jsi::Function::createFromHostFunction(
                                 rt, jsi::PropNameID::forUtf8(rt, "getOutputLevel"), 0,
                                 [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                          size_t count) { return module->getOutputLevel(rt); }));

        jsModule.setProperty(rt, "getEstimatedSNR",
                             jsi::Function::createFromHostFunction(
                                 rt, jsi::PropNameID::forUtf8(rt, "getEstimatedSNR"), 0,
                                 [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                          size_t count) { return module->getEstimatedSNR(rt); }));

        jsModule.setProperty(rt, "getSpeechProbability",
                             jsi::Function::createFromHostFunction(
                                 rt, jsi::PropNameID::forUtf8(rt, "getSpeechProbability"), 0,
                                 [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                          size_t count) { return module->getSpeechProbability(rt); }));

        jsModule.setProperty(rt, "getMusicalNoiseLevel",
                             jsi::Function::createFromHostFunction(
                                 rt, jsi::PropNameID::forUtf8(rt, "getMusicalNoiseLevel"), 0,
                                 [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                          size_t count) { return module->getMusicalNoiseLevel(rt); }));

        // Ajouter les méthodes de configuration avancée
        jsModule.setProperty(
            rt, "initializeIMCRA",
            jsi::Function::createFromHostFunction(
                rt, jsi::PropNameID::forUtf8(rt, "initializeIMCRA"), 1,
                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                    if (count < 1 || !args[0].isObject()) {
                        throw jsi::JSError(rt, "initializeIMCRA requires a config object");
                    }
                    return module->initializeIMCRA(rt, args[0].asObject(rt));
                }));

        jsModule.setProperty(rt, "getIMCRAConfig",
                             jsi::Function::createFromHostFunction(
                                 rt, jsi::PropNameID::forUtf8(rt, "getIMCRAConfig"), 0,
                                 [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                          size_t count) { return module->getIMCRAConfig(rt); }));

        jsModule.setProperty(
            rt, "updateIMCRAConfig",
            jsi::Function::createFromHostFunction(
                rt, jsi::PropNameID::forUtf8(rt, "updateIMCRAConfig"), 1,
                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                    if (count < 1 || !args[0].isObject()) {
                        throw jsi::JSError(rt, "updateIMCRAConfig requires a config object");
                    }
                    return module->updateIMCRAConfig(rt, args[0].asObject(rt));
                }));

        // Ajouter les méthodes Wiener
        jsModule.setProperty(
            rt, "initializeWiener",
            jsi::Function::createFromHostFunction(
                rt, jsi::PropNameID::forUtf8(rt, "initializeWiener"), 1,
                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                    if (count < 1 || !args[0].isObject()) {
                        throw jsi::JSError(rt, "initializeWiener requires a config object");
                    }
                    return module->initializeWiener(rt, args[0].asObject(rt));
                }));

        jsModule.setProperty(rt, "getWienerConfig",
                             jsi::Function::createFromHostFunction(
                                 rt, jsi::PropNameID::forUtf8(rt, "getWienerConfig"), 0,
                                 [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                          size_t count) { return module->getWienerConfig(rt); }));

        jsModule.setProperty(
            rt, "updateWienerConfig",
            jsi::Function::createFromHostFunction(
                rt, jsi::PropNameID::forUtf8(rt, "updateWienerConfig"), 1,
                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                    if (count < 1 || !args[0].isObject()) {
                        throw jsi::JSError(rt, "updateWienerConfig requires a config object");
                    }
                    return module->updateWienerConfig(rt, args[0].asObject(rt));
                }));

        // Ajouter les méthodes Multiband
        jsModule.setProperty(
            rt, "initializeMultiband",
            jsi::Function::createFromHostFunction(
                rt, jsi::PropNameID::forUtf8(rt, "initializeMultiband"), 1,
                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                    if (count < 1 || !args[0].isObject()) {
                        throw jsi::JSError(rt, "initializeMultiband requires a config object");
                    }
                    return module->initializeMultiband(rt, args[0].asObject(rt));
                }));

        jsModule.setProperty(rt, "getMultibandConfig",
                             jsi::Function::createFromHostFunction(
                                 rt, jsi::PropNameID::forUtf8(rt, "getMultibandConfig"), 0,
                                 [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args,
                                          size_t count) { return module->getMultibandConfig(rt); }));

        jsModule.setProperty(
            rt, "updateMultibandConfig",
            jsi::Function::createFromHostFunction(
                rt, jsi::PropNameID::forUtf8(rt, "updateMultibandConfig"), 1,
                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                    if (count < 1 || !args[0].isObject()) {
                        throw jsi::JSError(rt, "updateMultibandConfig requires a config object");
                    }
                    return module->updateMultibandConfig(rt, args[0].asObject(rt));
                }));

        // Ajouter les callbacks
        jsModule.setProperty(
            rt, "setAudioDataCallback",
            jsi::Function::createFromHostFunction(
                rt, jsi::PropNameID::forUtf8(rt, "setAudioDataCallback"), 1,
                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                    if (count < 1 || !args[0].isObject() || !args[0].asObject(rt).isFunction(rt)) {
                        throw jsi::JSError(rt, "setAudioDataCallback requires a function");
                    }
                    return module->setAudioDataCallback(rt, args[0].asObject(rt).asFunction(rt));
                }));

        jsModule.setProperty(
            rt, "setErrorCallback",
            jsi::Function::createFromHostFunction(
                rt, jsi::PropNameID::forUtf8(rt, "setErrorCallback"), 1,
                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                    if (count < 1 || !args[0].isObject() || !args[0].asObject(rt).isFunction(rt)) {
                        throw jsi::JSError(rt, "setErrorCallback requires a function");
                    }
                    return module->setErrorCallback(rt, args[0].asObject(rt).asFunction(rt));
                }));

        jsModule.setProperty(
            rt, "setStateChangeCallback",
            jsi::Function::createFromHostFunction(
                rt, jsi::PropNameID::forUtf8(rt, "setStateChangeCallback"), 1,
                [module](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
                    if (count < 1 || !args[0].isObject() || !args[0].asObject(rt).isFunction(rt)) {
                        throw jsi::JSError(rt, "setStateChangeCallback requires a function");
                    }
                    return module->setStateChangeCallback(rt, args[0].asObject(rt).asFunction(rt));
                }));

        // Ajouter des constantes utiles
        jsModule.setProperty(rt, "ALGORITHMS", jsi::Object(rt));
        jsModule.setProperty(rt, "STATES", jsi::Object(rt));

        // Remplir les constantes ALGORITHMS
        auto algorithmsObj = jsModule.getProperty(rt, "ALGORITHMS").asObject(rt);
        algorithmsObj.setProperty(rt, "SPECTRAL_SUBTRACTION", jsi::String::createFromUtf8(rt, "spectral_subtraction"));
        algorithmsObj.setProperty(rt, "WIENER_FILTER", jsi::String::createFromUtf8(rt, "wiener_filter"));
        algorithmsObj.setProperty(rt, "MULTIBAND", jsi::String::createFromUtf8(rt, "multiband"));
        algorithmsObj.setProperty(rt, "TWO_STEP", jsi::String::createFromUtf8(rt, "two_step"));
        algorithmsObj.setProperty(rt, "HYBRID", jsi::String::createFromUtf8(rt, "hybrid"));
        algorithmsObj.setProperty(rt, "ADVANCED_SPECTRAL", jsi::String::createFromUtf8(rt, "advanced_spectral"));

        // Remplir les constantes STATES
        auto statesObj = jsModule.getProperty(rt, "STATES").asObject(rt);
        statesObj.setProperty(rt, "UNINITIALIZED", jsi::String::createFromUtf8(rt, "uninitialized"));
        statesObj.setProperty(rt, "INITIALIZED", jsi::String::createFromUtf8(rt, "initialized"));
        statesObj.setProperty(rt, "PROCESSING", jsi::String::createFromUtf8(rt, "processing"));
        statesObj.setProperty(rt, "ERROR", jsi::String::createFromUtf8(rt, "error"));

        return jsModule;

    } catch (const std::exception& e) {
        throw jsi::JSError(rt, std::string("Failed to install NativeAudioNoiseModule: ") + e.what());
    }
}

void NativeAudioNoiseModule::invokeJSCallback(const std::string& callbackName,
                                              std::function<void(jsi::Runtime&)> invocation) {
    // Utiliser le CallInvoker pour garantir l'exécution sur le thread JS principal
    if (jsInvoker_) {
        jsInvoker_->invokeAsync([invocation = std::move(invocation)]() {
            // Le runtime sera fourni par le CallInvoker
            // Note: Dans un vrai contexte, il faudrait accéder au runtime approprié
            // Ceci est une implémentation simplifiée
            try {
                // invocation(rt); // rt serait fourni par le contexte
            } catch (const std::exception& e) {
                // Log l'erreur
            }
        });
    }
}

// Helper function implementations (placeholders for now)
NythIMCRAConfig NativeAudioNoiseModule::parseIMCRAConfig(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    NythIMCRAConfig config = {};

    // Parse les propriétés de configuration IMCRA
    if (jsConfig.hasProperty(rt, "fftSize")) {
        config.fftSize = static_cast<size_t>(jsConfig.getProperty(rt, "fftSize").asNumber());
    }
    if (jsConfig.hasProperty(rt, "sampleRate")) {
        config.sampleRate = static_cast<uint32_t>(jsConfig.getProperty(rt, "sampleRate").asNumber());
    }
    if (jsConfig.hasProperty(rt, "alphaS")) {
        config.alphaS = jsConfig.getProperty(rt, "alphaS").asNumber();
    }
    if (jsConfig.hasProperty(rt, "alphaD")) {
        config.alphaD = jsConfig.getProperty(rt, "alphaD").asNumber();
    }
    if (jsConfig.hasProperty(rt, "alphaD2")) {
        config.alphaD2 = jsConfig.getProperty(rt, "alphaD2").asNumber();
    }
    if (jsConfig.hasProperty(rt, "betaMax")) {
        config.betaMax = jsConfig.getProperty(rt, "betaMax").asNumber();
    }
    if (jsConfig.hasProperty(rt, "gamma0")) {
        config.gamma0 = jsConfig.getProperty(rt, "gamma0").asNumber();
    }
    if (jsConfig.hasProperty(rt, "gamma1")) {
        config.gamma1 = jsConfig.getProperty(rt, "gamma1").asNumber();
    }
    if (jsConfig.hasProperty(rt, "zeta0")) {
        config.zeta0 = jsConfig.getProperty(rt, "zeta0").asNumber();
    }
    if (jsConfig.hasProperty(rt, "windowLength")) {
        config.windowLength = static_cast<size_t>(jsConfig.getProperty(rt, "windowLength").asNumber());
    }
    if (jsConfig.hasProperty(rt, "subWindowLength")) {
        config.subWindowLength = static_cast<size_t>(jsConfig.getProperty(rt, "subWindowLength").asNumber());
    }

    return config;
}

jsi::Object NativeAudioNoiseModule::imcraConfigToJS(jsi::Runtime& rt, const NythIMCRAConfig& config) {
    jsi::Object jsConfig(rt);

    jsConfig.setProperty(rt, "fftSize", jsi::Value(static_cast<double>(config.fftSize)));
    jsConfig.setProperty(rt, "sampleRate", jsi::Value(static_cast<double>(config.sampleRate)));
    jsConfig.setProperty(rt, "alphaS", jsi::Value(config.alphaS));
    jsConfig.setProperty(rt, "alphaD", jsi::Value(config.alphaD));
    jsConfig.setProperty(rt, "alphaD2", jsi::Value(config.alphaD2));
    jsConfig.setProperty(rt, "betaMax", jsi::Value(config.betaMax));
    jsConfig.setProperty(rt, "gamma0", jsi::Value(config.gamma0));
    jsConfig.setProperty(rt, "gamma1", jsi::Value(config.gamma1));
    jsConfig.setProperty(rt, "zeta0", jsi::Value(config.zeta0));
    jsConfig.setProperty(rt, "windowLength", jsi::Value(static_cast<double>(config.windowLength)));
    jsConfig.setProperty(rt, "subWindowLength", jsi::Value(static_cast<double>(config.subWindowLength)));

    return jsConfig;
}

NythWienerConfig NativeAudioNoiseModule::parseWienerConfig(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    NythWienerConfig config = {};

    if (jsConfig.hasProperty(rt, "fftSize")) {
        config.fftSize = static_cast<size_t>(jsConfig.getProperty(rt, "fftSize").asNumber());
    }
    if (jsConfig.hasProperty(rt, "sampleRate")) {
        config.sampleRate = static_cast<uint32_t>(jsConfig.getProperty(rt, "sampleRate").asNumber());
    }
    if (jsConfig.hasProperty(rt, "alpha")) {
        config.alpha = jsConfig.getProperty(rt, "alpha").asNumber();
    }
    if (jsConfig.hasProperty(rt, "minGain")) {
        config.minGain = jsConfig.getProperty(rt, "minGain").asNumber();
    }
    if (jsConfig.hasProperty(rt, "maxGain")) {
        config.maxGain = jsConfig.getProperty(rt, "maxGain").asNumber();
    }
    if (jsConfig.hasProperty(rt, "useLSA")) {
        config.useLSA = jsConfig.getProperty(rt, "useLSA").asBool();
    }
    if (jsConfig.hasProperty(rt, "gainSmoothing")) {
        config.gainSmoothing = jsConfig.getProperty(rt, "gainSmoothing").asNumber();
    }
    if (jsConfig.hasProperty(rt, "frequencySmoothing")) {
        config.frequencySmoothing = jsConfig.getProperty(rt, "frequencySmoothing").asNumber();
    }
    if (jsConfig.hasProperty(rt, "usePerceptualWeighting")) {
        config.usePerceptualWeighting = jsConfig.getProperty(rt, "usePerceptualWeighting").asBool();
    }

    return config;
}

jsi::Object NativeAudioNoiseModule::wienerConfigToJS(jsi::Runtime& rt, const NythWienerConfig& config) {
    jsi::Object jsConfig(rt);

    jsConfig.setProperty(rt, "fftSize", jsi::Value(static_cast<double>(config.fftSize)));
    jsConfig.setProperty(rt, "sampleRate", jsi::Value(static_cast<double>(config.sampleRate)));
    jsConfig.setProperty(rt, "alpha", jsi::Value(config.alpha));
    jsConfig.setProperty(rt, "minGain", jsi::Value(config.minGain));
    jsConfig.setProperty(rt, "maxGain", jsi::Value(config.maxGain));
    jsConfig.setProperty(rt, "useLSA", jsi::Value(config.useLSA));
    jsConfig.setProperty(rt, "gainSmoothing", jsi::Value(config.gainSmoothing));
    jsConfig.setProperty(rt, "frequencySmoothing", jsi::Value(config.frequencySmoothing));
    jsConfig.setProperty(rt, "usePerceptualWeighting", jsi::Value(config.usePerceptualWeighting));

    return jsConfig;
}

NythMultibandConfig NativeAudioNoiseModule::parseMultibandConfig(jsi::Runtime& rt, const jsi::Object& jsConfig) {
    NythMultibandConfig config = {};

    if (jsConfig.hasProperty(rt, "sampleRate")) {
        config.sampleRate = static_cast<uint32_t>(jsConfig.getProperty(rt, "sampleRate").asNumber());
    }
    if (jsConfig.hasProperty(rt, "fftSize")) {
        config.fftSize = static_cast<size_t>(jsConfig.getProperty(rt, "fftSize").asNumber());
    }
    if (jsConfig.hasProperty(rt, "subBassReduction")) {
        config.subBassReduction = static_cast<float>(jsConfig.getProperty(rt, "subBassReduction").asNumber());
    }
    if (jsConfig.hasProperty(rt, "bassReduction")) {
        config.bassReduction = static_cast<float>(jsConfig.getProperty(rt, "bassReduction").asNumber());
    }
    if (jsConfig.hasProperty(rt, "lowMidReduction")) {
        config.lowMidReduction = static_cast<float>(jsConfig.getProperty(rt, "lowMidReduction").asNumber());
    }
    if (jsConfig.hasProperty(rt, "midReduction")) {
        config.midReduction = static_cast<float>(jsConfig.getProperty(rt, "midReduction").asNumber());
    }
    if (jsConfig.hasProperty(rt, "highMidReduction")) {
        config.highMidReduction = static_cast<float>(jsConfig.getProperty(rt, "highMidReduction").asNumber());
    }
    if (jsConfig.hasProperty(rt, "highReduction")) {
        config.highReduction = static_cast<float>(jsConfig.getProperty(rt, "highReduction").asNumber());
    }
    if (jsConfig.hasProperty(rt, "ultraHighReduction")) {
        config.ultraHighReduction = static_cast<float>(jsConfig.getProperty(rt, "ultraHighReduction").asNumber());
    }

    return config;
}

jsi::Object NativeAudioNoiseModule::multibandConfigToJS(jsi::Runtime& rt, const NythMultibandConfig& config) {
    jsi::Object jsConfig(rt);

    jsConfig.setProperty(rt, "sampleRate", jsi::Value(static_cast<double>(config.sampleRate)));
    jsConfig.setProperty(rt, "fftSize", jsi::Value(static_cast<double>(config.fftSize)));
    jsConfig.setProperty(rt, "subBassReduction", jsi::Value(static_cast<double>(config.subBassReduction)));
    jsConfig.setProperty(rt, "bassReduction", jsi::Value(static_cast<double>(config.bassReduction)));
    jsConfig.setProperty(rt, "lowMidReduction", jsi::Value(static_cast<double>(config.lowMidReduction)));
    jsConfig.setProperty(rt, "midReduction", jsi::Value(static_cast<double>(config.midReduction)));
    jsConfig.setProperty(rt, "highMidReduction", jsi::Value(static_cast<double>(config.highMidReduction)));
    jsConfig.setProperty(rt, "highReduction", jsi::Value(static_cast<double>(config.highReduction)));
    jsConfig.setProperty(rt, "ultraHighReduction", jsi::Value(static_cast<double>(config.ultraHighReduction)));

    return jsConfig;
}

// === Fonction d'enregistrement du module ===
std::shared_ptr<TurboModule> NativeAudioNoiseModuleProvider(std::shared_ptr<CallInvoker> jsInvoker) {
    return std::make_shared<NativeAudioNoiseModule>(jsInvoker);
}

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_NOISE_ENABLED
