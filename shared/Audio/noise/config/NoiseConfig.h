#pragma once

#include "../../common/config/NoiseContants.hpp"
#include <string>
#include <vector>

namespace Nyth {
namespace Audio {

// === Types d'algorithmes ===
enum class NoiseAlgorithm {
    SPECTRAL_SUBTRACTION = 0,
    WIENER_FILTER = 1,
    MULTIBAND = 2,
    TWO_STEP = 3,
    HYBRID = 4,
    ADVANCED_SPECTRAL = 5
};

// === Méthodes d'estimation de bruit ===
enum class NoiseEstimationMethod { SIMPLE = 0, MCRA = 1, IMCRA = 2 };

// === États du système ===
enum class NoiseState { UNINITIALIZED = 0, INITIALIZED = 1, PROCESSING = 2, ERROR = 3 };

// === Configuration générale du bruit ===
struct NoiseConfig {
    NoiseAlgorithm algorithm = NoiseAlgorithm::ADVANCED_SPECTRAL;
    NoiseEstimationMethod noiseMethod = NoiseEstimationMethod::IMCRA;
    uint32_t sampleRate = GlobalAudioConstants::DEFAULT_SAMPLE_RATE;
    int channels = GlobalAudioConstants::STEREO_CHANNELS;
    size_t fftSize = GlobalAudioConstants::DEFAULT_FFT_SIZE;
    size_t hopSize = GlobalAudioConstants::DEFAULT_HOP_SIZE;
    float aggressiveness = GlobalValidationConstants::DEFAULT_AGGRESSIVENESS;
    bool enableMultiband = true;
    bool preserveTransients = true;
    bool reduceMusicalNoise = true;

    // Paramètres avancés
    struct {
        float beta = GlobalValidationConstants::DEFAULT_BETA;              // Over-subtraction factor
        float floorGain = GlobalValidationConstants::DEFAULT_FLOOR_GAIN;   // Spectral floor
        float noiseUpdateRate = GlobalValidationConstants::DEFAULT_NOISE_UPDATE; // Noise estimation smoothing
        float speechThreshold = 0.5f;    // Speech detection threshold (valeur spécifique)
        float transientThreshold = 0.3f; // Transient detection (valeur spécifique)
    } advanced;
};

// === Configuration IMCRA ===
struct IMCRAConfig {
    size_t fftSize = GlobalAudioConstants::DEFAULT_FFT_SIZE;
    uint32_t sampleRate = GlobalAudioConstants::DEFAULT_SAMPLE_RATE;
    double alphaS = GlobalValidationConstants::DEFAULT_ALPHA;  // Lissage spectral
    double alphaD = GlobalValidationConstants::DEFAULT_ALPHA;  // Lissage bruit
    double alphaD2 = 0.9;  // Lissage minima (valeur spécifique)
    double betaMax = 0.96; // Correction biais max (valeur spécifique)
    double gamma0 = 4.6;   // Seuil SNR (valeur spécifique)
    double gamma1 = 3.0;   // Seuil secondaire (valeur spécifique)
    double zeta0 = 1.67;   // Seuil SNR a priori (valeur spécifique)
    size_t windowLength = 80;  // Fenêtre (valeur spécifique)
    size_t subWindowLength = 8; // Sous-fenêtre (valeur spécifique)
};

// === Configuration Wiener ===
struct WienerConfig {
    size_t fftSize = GlobalAudioConstants::DEFAULT_FFT_SIZE;
    uint32_t sampleRate = GlobalAudioConstants::DEFAULT_SAMPLE_RATE;
    double alpha = GlobalValidationConstants::DEFAULT_ALPHA;
    double minGain = GlobalValidationConstants::DEFAULT_MIN_GAIN;
    double maxGain = GlobalValidationConstants::DEFAULT_MAX_GAIN;
    bool useLSA = true; // Log-Spectral Amplitude
    double gainSmoothing = 0.7;  // Lissage gain (valeur spécifique)
    double frequencySmoothing = 0.3; // Lissage fréquence (valeur spécifique)
    bool usePerceptualWeighting = true;
};

// === Configuration Multi-bandes ===
struct MultibandConfig {
    uint32_t sampleRate = GlobalAudioConstants::DEFAULT_SAMPLE_RATE;
    size_t fftSize = GlobalAudioConstants::DEFAULT_FFT_SIZE;
    float subBassReduction = 0.9f;
    float bassReduction = 0.7f;
    float lowMidReduction = 0.5f;
    float midReduction = 0.3f;
    float highMidReduction = 0.4f;
    float highReduction = 0.6f;
    float ultraHighReduction = 0.8f;
};

// === Statistiques de réduction de bruit ===
struct NoiseStatistics {
    float inputLevel = 0.0f;
    float outputLevel = 0.0f;
    float estimatedSNR = 0.0f;
    float noiseReductionDB = 0.0f;
    uint32_t processedFrames = 0;
    uint64_t processedSamples = 0;
    int64_t durationMs = 0;
    float speechProbability = 0.0f;
    float musicalNoiseLevel = 0.0f;
};

class NoiseConfigValidator {
public:
    static bool validate(const NoiseConfig& config, std::string& error);
    static bool validate(const IMCRAConfig& config, std::string& error);
    static bool validate(const WienerConfig& config, std::string& error);
    static bool validate(const MultibandConfig& config, std::string& error);

    static NoiseConfig getDefault();
    static IMCRAConfig getDefaultIMCRA();
    static WienerConfig getDefaultWiener();
    static MultibandConfig getDefaultMultiband();
};

} // namespace Audio
} // namespace Nyth
