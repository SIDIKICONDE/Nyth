// C++17 standard implementation - No C++20 features
#include "NativeAudioSpectrumModule.h"

#ifdef NYTH_AUDIO_SPECTRUM_ENABLED

#include <thread>
#include <algorithm>
#include <chrono>
#include <cmath>
#include "Audio/fft/FFTEngine.hpp"

// TurboModule includes for React Native
#if defined(__has_include) && __has_include(<ReactCommon/TurboModule.h>)
#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModuleUtils.h>
#include <jsi/jsi.h>
#else
#pragma message("TurboModule headers not found, compiling without TurboModule support")
#endif

// Math constants
#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

namespace facebook {
namespace react {

// Constantes pour l'analyse spectrale
namespace SpectrumConstants {
constexpr size_t DEFAULT_FFT_SIZE = 1024;
constexpr size_t MIN_FFT_SIZE = 64;
constexpr size_t MAX_FFT_SIZE = 8192;
constexpr double DEFAULT_MIN_FREQ = 20.0;
constexpr double DEFAULT_MAX_FREQ = 20000.0;
constexpr size_t DEFAULT_NUM_BANDS = 32;
constexpr bool DEFAULT_USE_WINDOWING = true;
constexpr bool DEFAULT_USE_SIMD = true;
} // namespace SpectrumConstants

NativeAudioSpectrumModule::NativeAudioSpectrumModule(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeAudioSpectrumModuleCxxSpec(std::move(jsInvoker)) {
    currentConfig_.fftSize = SpectrumConstants::DEFAULT_FFT_SIZE;
    currentConfig_.numBands = SpectrumConstants::DEFAULT_NUM_BANDS;
    currentConfig_.minFreq = SpectrumConstants::DEFAULT_MIN_FREQ;
    currentConfig_.maxFreq = SpectrumConstants::DEFAULT_MAX_FREQ;
    currentConfig_.sampleRate = 48000; // Default sample rate
    currentConfig_.useWindowing = SpectrumConstants::DEFAULT_USE_WINDOWING;
    currentConfig_.useSIMD = SpectrumConstants::DEFAULT_USE_SIMD;
}

NativeAudioSpectrumModule::~NativeAudioSpectrumModule() {
    std::lock_guard<std::mutex> lock(spectrumMutex_);
    if (fftEngine_) {
        fftEngine_.reset();
    }
}

// === Méthodes TurboModule ===

jsi::Value NativeAudioSpectrumModule::initialize(jsi::Runtime& rt, const jsi::Object& config) {
    std::lock_guard<std::mutex> lock(spectrumMutex_);
    
    try {
        // Parse configuration
        if (config.hasProperty(rt, "fftSize")) {
            currentConfig_.fftSize = static_cast<size_t>(config.getProperty(rt, "fftSize").asNumber());
        }
        if (config.hasProperty(rt, "numBands")) {
            currentConfig_.numBands = static_cast<size_t>(config.getProperty(rt, "numBands").asNumber());
        }
        if (config.hasProperty(rt, "minFreq")) {
            currentConfig_.minFreq = config.getProperty(rt, "minFreq").asNumber();
        }
        if (config.hasProperty(rt, "maxFreq")) {
            currentConfig_.maxFreq = config.getProperty(rt, "maxFreq").asNumber();
        }
        if (config.hasProperty(rt, "sampleRate")) {
            currentConfig_.sampleRate = static_cast<uint32_t>(config.getProperty(rt, "sampleRate").asNumber());
        }
        if (config.hasProperty(rt, "useWindowing")) {
            currentConfig_.useWindowing = config.getProperty(rt, "useWindowing").asBool();
        }
        if (config.hasProperty(rt, "useSIMD")) {
            currentConfig_.useSIMD = config.getProperty(rt, "useSIMD").asBool();
        }
        
        // Validate configuration
        if (!validateConfigInternal()) {
            return jsi::Value(false);
        }
        
        // Initialize FFT engine
        if (currentConfig_.useSIMD) {
            fftEngine_ = std::make_unique<AudioFX::FFTEngineOptimized>(currentConfig_.fftSize);
        } else {
            fftEngine_ = std::make_unique<AudioFX::FFTEngine>(currentConfig_.fftSize);
        }
        
        // Initialize buffers
        audioBuffer_.resize(currentConfig_.fftSize);
        windowBuffer_.resize(currentConfig_.fftSize);
        fftRealBuffer_.resize(currentConfig_.fftSize);
        fftImagBuffer_.resize(currentConfig_.fftSize);
        currentMagnitudes_.resize(currentConfig_.numBands);
        frequencyBands_.resize(currentConfig_.numBands);
        
        // Calculate frequency bands
        calculateFrequencyBands();
        
        // Create window function
        if (currentConfig_.useWindowing) {
            for (size_t i = 0; i < currentConfig_.fftSize; ++i) {
                double phase = 2.0 * M_PI * static_cast<double>(i) / static_cast<double>(currentConfig_.fftSize - 1);
                windowBuffer_[i] = static_cast<float>(0.5 * (1.0 - std::cos(phase)));
            }
        }
        
        currentState_ = 1; // Initialized
        return jsi::Value(true);
        
    } catch (const std::exception& e) {
        handleError(1, std::string("Initialization failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioSpectrumModule::isInitialized(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(spectrumMutex_);
    return jsi::Value(currentState_ > 0);
}

jsi::Value NativeAudioSpectrumModule::release(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(spectrumMutex_);
    
    fftEngine_.reset();
    audioBuffer_.clear();
    windowBuffer_.clear();
    fftRealBuffer_.clear();
    fftImagBuffer_.clear();
    currentMagnitudes_.clear();
    frequencyBands_.clear();
    
    currentState_ = 0; // Uninitialized
    return jsi::Value::undefined();
}

jsi::Value NativeAudioSpectrumModule::getState(jsi::Runtime& rt) {
    return jsi::Value(currentState_.load());
}

jsi::Value NativeAudioSpectrumModule::getErrorString(jsi::Runtime& rt, int errorCode) {
    const char* errorStr = "";
    switch (errorCode) {
        case 0: errorStr = "No error"; break;
        case 1: errorStr = "Not initialized"; break;
        case 2: errorStr = "Already analyzing"; break;
        case 3: errorStr = "Already stopped"; break;
        case 4: errorStr = "FFT failed"; break;
        case 5: errorStr = "Invalid buffer"; break;
        case 6: errorStr = "Memory error"; break;
        case 7: errorStr = "Thread error"; break;
        default: errorStr = "Unknown error"; break;
    }
    return jsi::String::createFromUtf8(rt, errorStr);
}

jsi::Value NativeAudioSpectrumModule::setConfig(jsi::Runtime& rt, const jsi::Object& config) {
    return initialize(rt, config);
}

jsi::Value NativeAudioSpectrumModule::getConfig(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(spectrumMutex_);
    
    auto config = jsi::Object(rt);
    config.setProperty(rt, "fftSize", jsi::Value(static_cast<double>(currentConfig_.fftSize)));
    config.setProperty(rt, "numBands", jsi::Value(static_cast<double>(currentConfig_.numBands)));
    config.setProperty(rt, "minFreq", jsi::Value(currentConfig_.minFreq));
    config.setProperty(rt, "maxFreq", jsi::Value(currentConfig_.maxFreq));
    config.setProperty(rt, "sampleRate", jsi::Value(static_cast<double>(currentConfig_.sampleRate)));
    config.setProperty(rt, "useWindowing", jsi::Value(currentConfig_.useWindowing));
    config.setProperty(rt, "useSIMD", jsi::Value(currentConfig_.useSIMD));
    
    return config;
}

jsi::Value NativeAudioSpectrumModule::startAnalysis(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(spectrumMutex_);
    
    if (currentState_ != 1) {
        return jsi::Value(false);
    }
    
    currentState_ = 2; // Analyzing
    handleStateChange(1, 2);
    return jsi::Value(true);
}

jsi::Value NativeAudioSpectrumModule::stopAnalysis(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(spectrumMutex_);
    
    if (currentState_ != 2) {
        return jsi::Value(false);
    }
    
    currentState_ = 1; // Initialized
    handleStateChange(2, 1);
    return jsi::Value(true);
}

jsi::Value NativeAudioSpectrumModule::isAnalyzing(jsi::Runtime& rt) {
    return jsi::Value(currentState_ == 2);
}

jsi::Value NativeAudioSpectrumModule::processAudioBuffer(jsi::Runtime& rt, const jsi::Array& audioBuffer) {
    std::lock_guard<std::mutex> lock(spectrumMutex_);
    
    if (currentState_ != 2 || !fftEngine_) {
        return jsi::Value(false);
    }
    
    try {
        // Convert JS array to float vector
        auto buffer = arrayToFloatVector(rt, audioBuffer);
        
        // Process FFT
        if (!processFFT(buffer.data(), buffer.size())) {
            return jsi::Value(false);
        }
        
        // Update timestamp
        lastTimestamp_ = std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::system_clock::now().time_since_epoch()
        ).count() / 1000.0;
        
        // Notify data callback if set
        handleSpectrumData(currentMagnitudes_);
        
        return jsi::Value(true);
        
    } catch (const std::exception& e) {
        handleError(4, std::string("FFT processing failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioSpectrumModule::processAudioBufferStereo(jsi::Runtime& rt, 
                                                               const jsi::Array& audioBufferL,
                                                               const jsi::Array& audioBufferR) {
    std::lock_guard<std::mutex> lock(spectrumMutex_);
    
    if (currentState_ != 2 || !fftEngine_) {
        return jsi::Value(false);
    }
    
    try {
        // Convert JS arrays to float vectors
        auto bufferL = arrayToFloatVector(rt, audioBufferL);
        auto bufferR = arrayToFloatVector(rt, audioBufferR);
        
        // Mix to mono
        std::vector<float> monoBuffer(std::min(bufferL.size(), bufferR.size()));
        for (size_t i = 0; i < monoBuffer.size(); ++i) {
            monoBuffer[i] = (bufferL[i] + bufferR[i]) * 0.5f;
        }
        
        // Process FFT
        if (!processFFT(monoBuffer.data(), monoBuffer.size())) {
            return jsi::Value(false);
        }
        
        // Update timestamp
        lastTimestamp_ = std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::system_clock::now().time_since_epoch()
        ).count() / 1000.0;
        
        // Notify data callback if set
        handleSpectrumData(currentMagnitudes_);
        
        return jsi::Value(true);
        
    } catch (const std::exception& e) {
        handleError(4, std::string("FFT processing failed: ") + e.what());
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioSpectrumModule::getSpectrumData(jsi::Runtime& rt) {
    std::lock_guard<std::mutex> lock(spectrumMutex_);
    
    auto data = jsi::Object(rt);
    data.setProperty(rt, "numBands", jsi::Value(static_cast<double>(currentConfig_.numBands)));
    data.setProperty(rt, "timestamp", jsi::Value(lastTimestamp_));
    
    // Create magnitudes array
    auto magnitudes = jsi::Array(rt, currentMagnitudes_.size());
    for (size_t i = 0; i < currentMagnitudes_.size(); ++i) {
        magnitudes.setValueAtIndex(rt, i, jsi::Value(currentMagnitudes_[i]));
    }
    data.setProperty(rt, "magnitudes", magnitudes);
    
    // Create frequencies array
    auto frequencies = jsi::Array(rt, frequencyBands_.size());
    for (size_t i = 0; i < frequencyBands_.size(); ++i) {
        frequencies.setValueAtIndex(rt, i, jsi::Value(frequencyBands_[i]));
    }
    data.setProperty(rt, "frequencies", frequencies);
    
    return data;
}

jsi::Value NativeAudioSpectrumModule::calculateFFTSize(jsi::Runtime& rt, size_t desiredSize) {
    size_t fftSize = SpectrumConstants::MIN_FFT_SIZE;
    while (fftSize < desiredSize && fftSize < SpectrumConstants::MAX_FFT_SIZE) {
        fftSize *= 2;
    }
    return jsi::Value(static_cast<double>(fftSize));
}

jsi::Value NativeAudioSpectrumModule::validateConfig(jsi::Runtime& rt, const jsi::Object& config) {
    try {
        size_t fftSize = static_cast<size_t>(config.getProperty(rt, "fftSize").asNumber());
        size_t numBands = static_cast<size_t>(config.getProperty(rt, "numBands").asNumber());
        double minFreq = config.getProperty(rt, "minFreq").asNumber();
        double maxFreq = config.getProperty(rt, "maxFreq").asNumber();
        uint32_t sampleRate = static_cast<uint32_t>(config.getProperty(rt, "sampleRate").asNumber());
        
        bool valid = fftSize >= SpectrumConstants::MIN_FFT_SIZE &&
                    fftSize <= SpectrumConstants::MAX_FFT_SIZE &&
                    numBands > 0 && numBands <= fftSize / 2 &&
                    minFreq < maxFreq &&
                    sampleRate > 0;
                    
        return jsi::Value(valid);
    } catch (...) {
        return jsi::Value(false);
    }
}

jsi::Value NativeAudioSpectrumModule::setDataCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(spectrumMutex_);
    jsCallbacks_.dataCallback = std::make_shared<jsi::Function>(callback.getFunction(rt));
    return jsi::Value::undefined();
}

jsi::Value NativeAudioSpectrumModule::setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(spectrumMutex_);
    jsCallbacks_.errorCallback = std::make_shared<jsi::Function>(callback.getFunction(rt));
    return jsi::Value::undefined();
}

jsi::Value NativeAudioSpectrumModule::setStateCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    std::lock_guard<std::mutex> lock(spectrumMutex_);
    jsCallbacks_.stateCallback = std::make_shared<jsi::Function>(callback.getFunction(rt));
    return jsi::Value::undefined();
}

// === Private methods ===

bool NativeAudioSpectrumModule::validateConfigInternal() const {
    return currentConfig_.fftSize >= SpectrumConstants::MIN_FFT_SIZE &&
           currentConfig_.fftSize <= SpectrumConstants::MAX_FFT_SIZE &&
           currentConfig_.numBands > 0 &&
           currentConfig_.numBands <= currentConfig_.fftSize / 2 &&
           currentConfig_.minFreq < currentConfig_.maxFreq &&
           currentConfig_.sampleRate > 0;
}

void NativeAudioSpectrumModule::handleError(int error, const std::string& message) {
    // Les callbacks JSI doivent être invoqués dans le contexte approprié
    // Pour l'instant, on log simplement l'erreur
    // TODO: Implémenter la gestion appropriée des callbacks JSI
}

void NativeAudioSpectrumModule::handleStateChange(int oldState, int newState) {
    // Les callbacks JSI doivent être invoqués dans le contexte approprié
    // TODO: Implémenter la gestion appropriée des callbacks JSI
}

void NativeAudioSpectrumModule::handleSpectrumData(const std::vector<float>& magnitudes) {
    // Les callbacks JSI doivent être invoqués dans le contexte approprié
    // TODO: Implémenter la gestion appropriée des callbacks JSI
}

std::vector<float> NativeAudioSpectrumModule::arrayToFloatVector(jsi::Runtime& rt, const jsi::Array& array) const {
    size_t length = array.length(rt);
    std::vector<float> result(length);
    for (size_t i = 0; i < length; ++i) {
        result[i] = static_cast<float>(array.getValueAtIndex(rt, i).asNumber());
    }
    return result;
}

bool NativeAudioSpectrumModule::processFFT(const float* audioData, size_t numSamples) {
    if (!fftEngine_ || numSamples == 0) {
        return false;
    }
    
    // Copy and pad/truncate to FFT size
    std::copy_n(audioData, std::min(numSamples, currentConfig_.fftSize), audioBuffer_.begin());
    if (numSamples < currentConfig_.fftSize) {
        std::fill(audioBuffer_.begin() + numSamples, audioBuffer_.end(), 0.0f);
    }
    
    // Apply windowing if enabled
    if (currentConfig_.useWindowing) {
        applyWindowing(audioBuffer_);
    }
    
    // Perform FFT
    fftEngine_->forwardR2C(audioBuffer_.data(), fftRealBuffer_, fftImagBuffer_);
    
    // Calculate magnitudes for each band
    calculateFrequencyBands();
    
    return true;
}

void NativeAudioSpectrumModule::applyWindowing(std::vector<float>& buffer) {
    for (size_t i = 0; i < buffer.size() && i < windowBuffer_.size(); ++i) {
        buffer[i] *= windowBuffer_[i];
    }
}

void NativeAudioSpectrumModule::calculateFrequencyBands() {
    // Calculate frequency resolution
    double freqResolution = static_cast<double>(currentConfig_.sampleRate) / currentConfig_.fftSize;
    
    // Calculate frequency bands
    double freqRange = currentConfig_.maxFreq - currentConfig_.minFreq;
    for (size_t i = 0; i < currentConfig_.numBands; ++i) {
        double normalizedFreq = static_cast<double>(i) / static_cast<double>(currentConfig_.numBands - 1);
        frequencyBands_[i] = static_cast<float>(currentConfig_.minFreq + normalizedFreq * freqRange);
        
        // Find corresponding FFT bin
        size_t fftBin = static_cast<size_t>(frequencyBands_[i] / freqResolution);
        if (fftBin < fftRealBuffer_.size()) {
            currentMagnitudes_[i] = calculateMagnitude(fftRealBuffer_[fftBin], fftImagBuffer_[fftBin]);
        } else {
            currentMagnitudes_[i] = 0.0f;
        }
    }
}

float NativeAudioSpectrumModule::calculateMagnitude(float real, float imag) {
    return std::sqrt(real * real + imag * imag);
}

// === Module provider ===
std::shared_ptr<TurboModule> NativeAudioSpectrumModuleProvider(std::shared_ptr<CallInvoker> jsInvoker) {
    return std::make_shared<NativeAudioSpectrumModule>(jsInvoker);
}

} // namespace react
} // namespace facebook

#endif // NYTH_AUDIO_SPECTRUM_ENABLED
