// C++17 standard implementation - No C++20 features
#include "NativeAudioSpectrumModule.h"

#ifdef NYTH_AUDIO_SPECTRUM_ENABLED

// TurboModule includes for React Native
#if defined(__has_include) && __has_include(<ReactCommon/TurboModule.h>)
#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModuleUtils.h>
#include <jsi/jsi.h>
#endif

#include "Audio/fft/FFTEngine.hpp"
#include <algorithm>
#include <atomic>
#include <chrono>
#include <cmath>
#include <memory>

namespace facebook {
namespace react {

namespace {

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

// Classe d'analyse spectrale interne
class SpectrumAnalyzer {
public:
    SpectrumAnalyzer() = default;
    ~SpectrumAnalyzer() = default;

    bool initialize(const NythSpectrumConfig* config) {
        if (!config)
            return false;

        config_ = *config;

        // Validation de la configuration
        if (!validateConfig())
            return false;

        // Initialisation du moteur FFT
        try {
            fftEngine_ = AudioFX::createFFTEngine(config_.fftSize);
        } catch (const std::exception& e) {
            return false;
        }

        // Préparation des buffers
        windowBuffer_.resize(config_.fftSize);
        fftRealBuffer_.resize(config_.fftSize);
        fftImagBuffer_.resize(config_.fftSize);

        // Calcul des fréquences des bandes
        calculateFrequencyBands();

        // Création de la fenêtre
        if (config_.useWindowing) {
            createHannWindow();
        }

        initialized_ = true;
        return true;
    }

    void release() {
        fftEngine_.reset();
        windowBuffer_.clear();
        fftRealBuffer_.clear();
        fftImagBuffer_.clear();
        frequencyBands_.clear();
        config_ = NythSpectrumConfig{};
        initialized_ = false;
    }

    bool processAudioBuffer(const float* audioBuffer, size_t numSamples) {
        if (!initialized_ || !audioBuffer || numSamples == 0)
            return false;

        // Copie des données audio
        std::vector<float> audioData(audioBuffer, audioBuffer + numSamples);

        // Application de la fenêtre si activée
        if (config_.useWindowing) {
            applyWindowing(audioData);
        }

        // Remplissage avec des zéros si nécessaire
        audioData.resize(config_.fftSize, 0.0f);

        // FFT
        try {
            fftEngine_->forwardR2C(audioData.data(), fftRealBuffer_, fftImagBuffer_);
        } catch (const std::exception& e) {
            return false;
        }

        // Calcul des magnitudes
        magnitudes_.resize(config_.numBands);
        for (size_t i = 0; i < config_.numBands; ++i) {
            size_t fftIndex = i * (config_.fftSize / 2) / config_.numBands;
            if (fftIndex < fftRealBuffer_.size()) {
                float real = fftRealBuffer_[fftIndex];
                float imag = fftImagBuffer_[fftIndex];
                magnitudes_[i] = calculateMagnitude(real, imag);
            } else {
                magnitudes_[i] = 0.0f;
            }
        }

        return true;
    }

    const std::vector<float>& getMagnitudes() const {
        return magnitudes_;
    }
    const std::vector<float>& getFrequencyBands() const {
        return frequencyBands_;
    }
    bool isInitialized() const {
        return initialized_;
    }

private:
    NythSpectrumConfig config_;
    bool initialized_ = false;

    std::unique_ptr<AudioFX::IFFTEngine> fftEngine_;
    std::vector<float> windowBuffer_;
    std::vector<float> fftRealBuffer_;
    std::vector<float> fftImagBuffer_;
    std::vector<float> frequencyBands_;
    std::vector<float> magnitudes_;

    bool validateConfig() const {
        if (config_.fftSize < SpectrumConstants::MIN_FFT_SIZE || config_.fftSize > SpectrumConstants::MAX_FFT_SIZE) {
            return false;
        }
        if (config_.numBands == 0 || config_.numBands > config_.fftSize / 2) {
            return false;
        }
        if (config_.sampleRate == 0) {
            return false;
        }
        return true;
    }

    void calculateFrequencyBands() {
        frequencyBands_.resize(config_.numBands);

        double freqRange = config_.maxFreq - config_.minFreq;
        for (size_t i = 0; i < config_.numBands; ++i) {
            double normalizedFreq = static_cast<double>(i) / static_cast<double>(config_.numBands - 1);
            frequencyBands_[i] = static_cast<float>(config_.minFreq + normalizedFreq * freqRange);
        }
    }

    void createHannWindow() {
        for (size_t i = 0; i < config_.fftSize; ++i) {
            double phase = 2.0 * M_PI * static_cast<double>(i) / static_cast<double>(config_.fftSize - 1);
            windowBuffer_[i] = static_cast<float>(0.5 * (1.0 - std::cos(phase)));
        }
    }

    void applyWindowing(std::vector<float>& buffer) {
        if (buffer.size() > windowBuffer_.size()) {
            buffer.resize(windowBuffer_.size());
        }

        for (size_t i = 0; i < buffer.size(); ++i) {
            buffer[i] *= windowBuffer_[i];
        }
    }

    float calculateMagnitude(float real, float imag) {
        return std::sqrt(real * real + imag * imag);
    }
};

} // namespace

} // namespace react
} // namespace facebook

// Instance globale de l'analyseur
static facebook::react::SpectrumAnalyzer g_spectrumAnalyzer;
static std::atomic<NythSpectrumState> g_currentState{SPECTRUM_STATE_UNINITIALIZED};
static NythSpectrumConfig g_currentConfig;

// Callbacks globaux
static NythSpectrumDataCallback g_dataCallback = nullptr;
static NythSpectrumErrorCallback g_errorCallback = nullptr;
static NythSpectrumStateCallback g_stateCallback = nullptr;

// === Implémentation de l'API C ===

extern "C" {

bool NythSpectrum_Initialize(const NythSpectrumConfig* config) {
    if (!config)
        return false;

    if (g_currentState.load() != SPECTRUM_STATE_UNINITIALIZED) {
        return false;
    }

    g_currentConfig = *config;

    // Configuration par défaut
    if (g_currentConfig.fftSize == 0) {
        g_currentConfig.fftSize = 1024; // DEFAULT_FFT_SIZE
    }
    if (g_currentConfig.numBands == 0) {
        g_currentConfig.numBands = 32; // DEFAULT_NUM_BANDS
    }
    if (g_currentConfig.minFreq <= 0.0) {
        g_currentConfig.minFreq = 20.0; // DEFAULT_MIN_FREQ
    }
    if (g_currentConfig.maxFreq <= 0.0) {
        g_currentConfig.maxFreq = 20000.0; // DEFAULT_MAX_FREQ
    }

    bool success = g_spectrumAnalyzer.initialize(&g_currentConfig);
    if (success) {
        g_currentState.store(SPECTRUM_STATE_INITIALIZED);
        if (g_stateCallback) {
            g_stateCallback(SPECTRUM_STATE_UNINITIALIZED, SPECTRUM_STATE_INITIALIZED);
        }
    } else {
        g_currentState.store(SPECTRUM_STATE_ERROR);
        if (g_errorCallback) {
            g_errorCallback(SPECTRUM_ERROR_FFT_FAILED, "Failed to initialize FFT engine");
        }
    }

    return success;
}

bool NythSpectrum_IsInitialized(void) {
    return g_spectrumAnalyzer.isInitialized();
}

void NythSpectrum_Release(void) {
    NythSpectrumState oldState = g_currentState.load();
    g_spectrumAnalyzer.release();
    g_currentState.store(SPECTRUM_STATE_UNINITIALIZED);

    if (g_stateCallback) {
        g_stateCallback(oldState, SPECTRUM_STATE_UNINITIALIZED);
    }
}

NythSpectrumState NythSpectrum_GetState(void) {
    return g_currentState.load();
}

const char* NythSpectrum_GetErrorString(NythSpectrumError error) {
    switch (error) {
        case SPECTRUM_ERROR_OK:
            return "No error";
        case SPECTRUM_ERROR_NOT_INITIALIZED:
            return "Module not initialized";
        case SPECTRUM_ERROR_ALREADY_ANALYZING:
            return "Already analyzing";
        case SPECTRUM_ERROR_ALREADY_STOPPED:
            return "Already stopped";
        case SPECTRUM_ERROR_FFT_FAILED:
            return "FFT processing failed";
        case SPECTRUM_ERROR_INVALID_BUFFER:
            return "Invalid audio buffer";
        case SPECTRUM_ERROR_MEMORY_ERROR:
            return "Memory allocation failed";
        case SPECTRUM_ERROR_THREAD_ERROR:
            return "Thread operation failed";
        default:
            return "Unknown error";
    }
}

bool NythSpectrum_SetConfig(const NythSpectrumConfig* config) {
    if (!config)
        return false;

    g_currentConfig = *config;
    return g_spectrumAnalyzer.initialize(&g_currentConfig);
}

void NythSpectrum_GetConfig(NythSpectrumConfig* config) {
    if (config) {
        *config = g_currentConfig;
    }
}

bool NythSpectrum_StartAnalysis(void) {
    if (g_currentState.load() != SPECTRUM_STATE_INITIALIZED) {
        return false;
    }

    g_currentState.store(SPECTRUM_STATE_ANALYZING);
    if (g_stateCallback) {
        g_stateCallback(SPECTRUM_STATE_INITIALIZED, SPECTRUM_STATE_ANALYZING);
    }
    return true;
}

bool NythSpectrum_StopAnalysis(void) {
    if (g_currentState.load() != SPECTRUM_STATE_ANALYZING) {
        return false;
    }

    g_currentState.store(SPECTRUM_STATE_INITIALIZED);
    if (g_stateCallback) {
        g_stateCallback(SPECTRUM_STATE_ANALYZING, SPECTRUM_STATE_INITIALIZED);
    }
    return true;
}

bool NythSpectrum_IsAnalyzing(void) {
    return g_currentState.load() == SPECTRUM_STATE_ANALYZING;
}

bool NythSpectrum_ProcessAudioBuffer(const float* audioBuffer, size_t numSamples) {
    if (g_currentState.load() != SPECTRUM_STATE_ANALYZING) {
        return false;
    }

    if (!g_spectrumAnalyzer.processAudioBuffer(audioBuffer, numSamples)) {
        if (g_errorCallback) {
            g_errorCallback(SPECTRUM_ERROR_FFT_FAILED, "Failed to process audio buffer");
        }
        return false;
    }

    // Notification des données si callback défini
    if (g_dataCallback) {
        NythSpectrumData data;
        data.numBands = g_currentConfig.numBands;
        data.timestamp = static_cast<double>(
            std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch())
                .count());

        // Allocation temporaire pour les données
        std::vector<float> magnitudes = g_spectrumAnalyzer.getMagnitudes();
        std::vector<float> frequencies = g_spectrumAnalyzer.getFrequencyBands();

        data.magnitudes = magnitudes.data();
        data.frequencies = frequencies.data();

        g_dataCallback(&data);
    }

    return true;
}

bool NythSpectrum_ProcessAudioBufferStereo(const float* audioBufferL, const float* audioBufferR, size_t numSamples) {
    // Traitement mono simple - moyenne des canaux
    std::vector<float> monoBuffer(numSamples);
    for (size_t i = 0; i < numSamples; ++i) {
        monoBuffer[i] = (audioBufferL[i] + audioBufferR[i]) * 0.5f;
    }

    return NythSpectrum_ProcessAudioBuffer(monoBuffer.data(), numSamples);
}

bool NythSpectrum_GetSpectrumData(NythSpectrumData* data) {
    if (!data)
        return false;

    data->numBands = g_currentConfig.numBands;
    data->timestamp = static_cast<double>(
        std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch())
            .count());

    // Copie des données
    const auto& magnitudes = g_spectrumAnalyzer.getMagnitudes();
    const auto& frequencies = g_spectrumAnalyzer.getFrequencyBands();

    // Allocation des tableaux (l'appelant doit les libérer)
    data->magnitudes = new float[magnitudes.size()];
    data->frequencies = new float[frequencies.size()];

    std::copy(magnitudes.begin(), magnitudes.end(), data->magnitudes);
    std::copy(frequencies.begin(), frequencies.end(), data->frequencies);

    return true;
}

void NythSpectrum_ReleaseSpectrumData(NythSpectrumData* data) {
    if (data) {
        delete[] data->magnitudes;
        delete[] data->frequencies;
        data->magnitudes = nullptr;
        data->frequencies = nullptr;
    }
}

void NythSpectrum_SetDataCallback(NythSpectrumDataCallback callback) {
    g_dataCallback = callback;
}

void NythSpectrum_SetErrorCallback(NythSpectrumErrorCallback callback) {
    g_errorCallback = callback;
}

void NythSpectrum_SetStateCallback(NythSpectrumStateCallback callback) {
    g_stateCallback = callback;
}

size_t NythSpectrum_CalculateFFTSize(size_t desiredSize) {
    const size_t MIN_FFT_SIZE = 64;
    const size_t MAX_FFT_SIZE = 8192;

    if (desiredSize < MIN_FFT_SIZE) {
        return MIN_FFT_SIZE;
    }
    if (desiredSize > MAX_FFT_SIZE) {
        return MAX_FFT_SIZE;
    }

    // Trouver la puissance de 2 la plus proche
    size_t power = MIN_FFT_SIZE;
    while (power < desiredSize && power < MAX_FFT_SIZE) {
        power *= 2;
    }

    return power;
}

bool NythSpectrum_ValidateConfig(const NythSpectrumConfig* config) {
    const size_t MIN_FFT_SIZE = 64;
    const size_t MAX_FFT_SIZE = 8192;

    if (!config)
        return false;
    if (config->fftSize < MIN_FFT_SIZE)
        return false;
    if (config->fftSize > MAX_FFT_SIZE)
        return false;
    if (config->numBands == 0)
        return false;
    if (config->sampleRate == 0)
        return false;
    if (config->minFreq >= config->maxFreq)
        return false;
    return true;
}

} // extern "C"

// === Note: TurboModule implementation removed for compilation simplicity ===
// The C API functions above provide the core functionality
// TODO: Re-implement TurboModule bindings when React Native setup is available

#endif // NYTH_AUDIO_SPECTRUM_ENABLED
