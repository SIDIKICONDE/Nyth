#pragma once

#include <cstdint>
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
    uint32_t sampleRate = 48000;
    int channels = 2;
    size_t fftSize = 2048;
    size_t hopSize = 512;
    float aggressiveness = 0.7f; // 0.0 - 3.0
    bool enableMultiband = true;
    bool preserveTransients = true;
    bool reduceMusicalNoise = true;

    // Paramètres avancés
    struct {
        float beta = 0.01f;              // Over-subtraction factor
        float floorGain = 0.001f;        // Spectral floor
        float noiseUpdateRate = 0.95f;   // Noise estimation smoothing
        float speechThreshold = 0.5f;    // Speech detection threshold
        float transientThreshold = 0.3f; // Transient detection
    } advanced;
};

// === Configuration IMCRA ===
struct IMCRAConfig {
    size_t fftSize = 1024;
    uint32_t sampleRate = 48000;
    double alphaS = 0.95;  // Lissage spectral
    double alphaD = 0.95;  // Lissage bruit
    double alphaD2 = 0.9;  // Lissage minima
    double betaMax = 0.96; // Correction biais max
    double gamma0 = 4.6;   // Seuil SNR
    double gamma1 = 3.0;   // Seuil secondaire
    double zeta0 = 1.67;   // Seuil SNR a priori
    size_t windowLength = 80;
    size_t subWindowLength = 8;
};

// === Configuration Wiener ===
struct WienerConfig {
    size_t fftSize = 1024;
    uint32_t sampleRate = 48000;
    double alpha = 0.98;  // Smoothing factor
    double minGain = 0.1; // Gain minimum
    double maxGain = 1.0; // Gain maximum
    bool useLSA = true;   // Log-Spectral Amplitude
    double gainSmoothing = 0.7;
    double frequencySmoothing = 0.3;
    bool usePerceptualWeighting = true;
};

// === Configuration Multi-bandes ===
struct MultibandConfig {
    uint32_t sampleRate = 48000;
    size_t fftSize = 2048;
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
