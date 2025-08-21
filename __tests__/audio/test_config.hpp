#pragma once

// Configuration pour la suite de tests audio
// Ce fichier définit les constantes et configurations partagées entre tous les tests

#include <cstdint>
#include <string>
#include <vector>
#include <chrono>

namespace AudioTest {

// Configuration générale des tests
struct TestConfig {
    // Paramètres audio
    static constexpr uint32_t DEFAULT_SAMPLE_RATE = 44100;
    static constexpr uint32_t HIGH_SAMPLE_RATE = 192000;
    static constexpr int DEFAULT_CHANNELS = 2;
    static constexpr size_t DEFAULT_BUFFER_SIZE = 1024;
    static constexpr size_t MAX_BUFFER_SIZE = 8192;

    // Paramètres de performance
    static constexpr size_t PERFORMANCE_ITERATIONS = 1000;
    static constexpr double MIN_REALTIME_FACTOR = 1.0;
    static constexpr std::chrono::milliseconds MAX_PROCESSING_TIME{10};

    // Tolérances pour les tests
    static constexpr double FLOAT_TOLERANCE = 1e-6;
    static constexpr double DB_TOLERANCE = 0.1;
    static constexpr double RMS_TOLERANCE = 0.01;
    static constexpr double FREQUENCY_TOLERANCE = 1.0;

    // Paramètres de signal de test
    static constexpr double DEFAULT_TEST_FREQUENCY = 440.0; // La4
    static constexpr double DEFAULT_TEST_AMPLITUDE = 0.5;
    static constexpr double NOISE_AMPLITUDE = 0.1;

    // Paramètres d'effet de test
    static constexpr double COMPRESSOR_THRESHOLD_DB = -20.0;
    static constexpr double COMPRESSOR_RATIO = 3.0;
    static constexpr double DELAY_TIME_MS = 150.0;
    static constexpr double DELAY_FEEDBACK = 0.3;
    static constexpr double DELAY_MIX = 0.25;

    // Paramètres de sécurité audio
    static constexpr double SAFETY_THRESHOLD_DB = -6.0;
    static constexpr double SAFETY_KNEE_WIDTH_DB = 6.0;
    static constexpr double DC_THRESHOLD = 0.002;

    // Paramètres de réduction de bruit
    static constexpr double NOISE_GATE_THRESHOLD_DB = -30.0;
    static constexpr double NOISE_GATE_RATIO = 2.0;
    static constexpr double SPECTRAL_BETA = 1.5;
    static constexpr double SPECTRAL_FLOOR_GAIN = 0.05;

    // Chemins et fichiers de test
    static const std::string TEST_AUDIO_DIR;
    static const std::string TEST_OUTPUT_DIR;
    static const std::string REFERENCE_AUDIO_FILE;

    // Paramètres FFT pour les tests
    static constexpr size_t FFT_SIZE = 1024;
    static constexpr size_t HOP_SIZE = 256;
    static constexpr double FFT_OVERLAP = 0.75; // 75% overlap

    // Paramètres de validation
    static constexpr size_t MIN_VALIDATION_SAMPLES = 64;
    static constexpr size_t MAX_VALIDATION_SAMPLES = 65536;
    static constexpr double MAX_AMPLITUDE = 1.0;
    static constexpr double MIN_SNR_DB = 10.0; // SNR minimum acceptable
};

// Constantes de test au moment de la compilation
template<typename T>
consteval T test_constant(T value) {
    return value;
}

// Helpers pour la génération de noms de test
inline std::string getTestName(const std::string& prefix, const std::string& suffix) {
    return prefix + "_" + suffix;
}

inline std::string getTestName(const std::string& prefix, double value) {
    return prefix + "_" + std::to_string(static_cast<int>(value));
}

// Configuration pour les tests de performance
struct PerformanceConfig {
    static constexpr size_t WARMUP_ITERATIONS = 10;
    static constexpr size_t BENCHMARK_ITERATIONS = 100;
    static constexpr size_t MEMORY_TEST_ITERATIONS = 50;

    // Seuils de performance (en pourcentage du temps réel)
    static constexpr double EXCELLENT_THRESHOLD = 10.0; // 10x realtime
    static constexpr double GOOD_THRESHOLD = 2.0;       // 2x realtime
    static constexpr double MINIMUM_THRESHOLD = 1.0;     // 1x realtime

    // Limites de latence (en millisecondes)
    static constexpr double MAX_LATENCY_MS = 50.0;
    static constexpr double TARGET_LATENCY_MS = 10.0;
};

// Configuration pour les tests SIMD
struct SIMDConfig {
    static constexpr bool ENABLE_NEON_TESTS = true;
    static constexpr bool ENABLE_SSE_TESTS = true;
    static constexpr bool ENABLE_AVX_TESTS = false; // Pas encore implémenté

    // Tailles de buffer optimisées pour SIMD
    static constexpr size_t NEON_VECTOR_SIZE = 4;   // 4 floats
    static constexpr size_t SSE_VECTOR_SIZE = 4;    // 4 floats
    static constexpr size_t AVX_VECTOR_SIZE = 8;    // 8 floats
};

// Configuration pour les tests d'intégration
struct IntegrationConfig {
    static constexpr size_t PIPELINE_STAGES = 4;    // Safety -> EQ -> Effects -> NR
    static constexpr size_t INTEGRATION_BUFFER_SIZE = 2048;
    static constexpr size_t INTEGRATION_ITERATIONS = 100;

    // Configuration de pipeline de test
    static const std::vector<std::string> PIPELINE_EFFECTS;
};

// Configuration pour les tests de robustesse
struct RobustnessConfig {
    // Valeurs extrêmes pour les tests
    static constexpr double EXTREME_GAIN_DB = 120.0;    // Gain extrême
    static constexpr double EXTREME_Q = 50.0;           // Q extrême
    static constexpr double EXTREME_FREQUENCY = 100000.0; // Fréquence extrême

    // Tailles de buffer extrêmes
    static const std::vector<size_t> TEST_BUFFER_SIZES;

    // Paramètres de stress test
    static constexpr size_t STRESS_ITERATIONS = 1000;
    static constexpr size_t MEMORY_STRESS_ITERATIONS = 100;
};

// Implémentation des variables statiques
inline const std::string TestConfig::TEST_AUDIO_DIR = "test_audio/";
inline const std::string TestConfig::TEST_OUTPUT_DIR = "test_output/";
inline const std::string TestConfig::REFERENCE_AUDIO_FILE = "reference_sine_440hz.wav";

inline const std::vector<std::string> IntegrationConfig::PIPELINE_EFFECTS = {
    "AudioSafety", "Equalizer", "Compressor", "Delay", "NoiseReduction"
};

inline const std::vector<size_t> RobustnessConfig::TEST_BUFFER_SIZES = {
    64, 128, 256, 512, 1024, 2048, 4096, 8192
};

} // namespace AudioTest
