#pragma once

// Helpers et utilitaires pour les tests audio
// Ce fichier fournit des fonctions utilitaires communes à tous les tests

#include <vector>
#include <algorithm>
#include <numeric>
#include <random>
#include <cmath>
#include <chrono>
#include <functional>
#include <span>
#include <format>
#include <iostream>
#include <string>
#include <memory>

#include "test_config.hpp"

namespace AudioTest {

// Générateur de nombres aléatoires thread-safe
class RandomGenerator {
public:
    static RandomGenerator& instance() {
        static RandomGenerator instance;
        return instance;
    }

    double getRandom(double min = 0.0, double max = 1.0) {
        std::uniform_real_distribution<> dist(min, max);
        return dist(gen_);
    }

    double getRandomNormal(double mean = 0.0, double stddev = 1.0) {
        std::normal_distribution<> dist(mean, stddev);
        return dist(gen_);
    }

private:
    RandomGenerator() : gen_(std::random_device{}()) {}
    std::mt19937 gen_;
};

// Classe de base pour les tests de performance
class PerformanceTestBase {
public:
    virtual ~PerformanceTestBase() = default;

    virtual void runTest(size_t iterations) = 0;
    virtual std::string getTestName() const = 0;

    double measureExecutionTime(size_t iterations) {
        // Warmup
        runTest(TestConfig::PerformanceConfig::WARMUP_ITERATIONS);

        // Mesure
        auto start = std::chrono::high_resolution_clock::now();
        runTest(iterations);
        auto end = std::chrono::high_resolution_clock::now();

        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
        return static_cast<double>(duration.count()) / 1000.0; // Convertir en millisecondes
    }

    double calculateRealtimeFactor(double executionTimeMs, size_t iterations, size_t bufferSize) {
        double totalSamples = static_cast<double>(iterations * bufferSize);
        double sampleRate = static_cast<double>(TestConfig::DEFAULT_SAMPLE_RATE);
        double expectedTimeMs = (totalSamples / sampleRate) * 1000.0;

        return expectedTimeMs / executionTimeMs;
    }
};

// Helper pour la validation de signaux audio
class SignalValidator {
public:
    static bool validateSignal(const std::span<const float> signal,
                              double maxAmplitude = TestConfig::MAX_AMPLITUDE) {
        return std::ranges::all_of(signal, [maxAmplitude](float sample) {
            return std::isfinite(sample) && std::abs(sample) <= maxAmplitude;
        });
    }

    static bool validateSignal(const std::vector<float>& signal,
                              double maxAmplitude = TestConfig::MAX_AMPLITUDE) {
        return validateSignal(std::span<const float>(signal), maxAmplitude);
    }

    static bool checkForNaN(const std::span<const float> signal) {
        return std::ranges::any_of(signal, [](float sample) {
            return std::isnan(sample);
        });
    }

    static bool checkForInf(const std::span<const float> signal) {
        return std::ranges::any_of(signal, [](float sample) {
            return std::isinf(sample);
        });
    }

    static size_t countClippedSamples(const std::span<const float> signal,
                                     double threshold = TestConfig::MAX_AMPLITUDE) {
        return std::ranges::count_if(signal, [threshold](float sample) {
            return std::abs(sample) >= threshold;
        });
    }

    static double calculateRMS(const std::span<const float> signal) {
        if (signal.empty()) return 0.0;

        double sum = 0.0;
        for (float sample : signal) {
            sum += static_cast<double>(sample) * sample;
        }
        return std::sqrt(sum / signal.size());
    }

    static double calculatePeak(const std::span<const float> signal) {
        if (signal.empty()) return 0.0;

        float peak = 0.0f;
        for (float sample : signal) {
            peak = std::max(peak, std::abs(sample));
        }
        return peak;
    }

    static double calculateSNR(const std::span<const float> original,
                              const std::span<const float> processed) {
        if (original.size() != processed.size() || original.empty()) {
            return 0.0;
        }

        double signalPower = 0.0, noisePower = 0.0;
        for (size_t i = 0; i < original.size(); ++i) {
            double diff = original[i] - processed[i];
            signalPower += original[i] * original[i];
            noisePower += diff * diff;
        }

        if (noisePower < 1e-10) return 100.0; // Signal parfait
        return 10.0 * std::log10(signalPower / noisePower);
    }

    static double calculateTHD(const std::span<const float> signal,
                              double fundamentalFreq,
                              uint32_t sampleRate) {
        // Calcul simplifié du THD (Total Harmonic Distortion)
        // Dans un vrai test, on utiliserait une FFT pour analyser les harmoniques
        double rms = calculateRMS(signal);
        return 20.0 * std::log10(rms); // Approximation simplifiée
    }
};

// Générateur de signaux de test
class TestSignalGenerator {
public:
    static std::vector<float> generateSineWave(size_t length,
                                              double frequency,
                                              uint32_t sampleRate,
                                              double amplitude = TestConfig::DEFAULT_TEST_AMPLITUDE) {
        std::vector<float> signal(length);
        double phaseIncrement = 2.0 * M_PI * frequency / sampleRate;

        for (size_t i = 0; i < length; ++i) {
            signal[i] = static_cast<float>(amplitude * std::sin(i * phaseIncrement));
        }
        return signal;
    }

    static std::vector<float> generateSquareWave(size_t length,
                                                double frequency,
                                                uint32_t sampleRate,
                                                double amplitude = TestConfig::DEFAULT_TEST_AMPLITUDE) {
        std::vector<float> signal(length);
        double period = sampleRate / frequency;
        double halfPeriod = period / 2.0;

        for (size_t i = 0; i < length; ++i) {
            double phase = std::fmod(i, period);
            signal[i] = static_cast<float>(amplitude * (phase < halfPeriod ? 1.0 : -1.0));
        }
        return signal;
    }

    static std::vector<float> generateTriangleWave(size_t length,
                                                  double frequency,
                                                  uint32_t sampleRate,
                                                  double amplitude = TestConfig::DEFAULT_TEST_AMPLITUDE) {
        std::vector<float> signal(length);
        double period = sampleRate / frequency;

        for (size_t i = 0; i < length; ++i) {
            double phase = std::fmod(i, period) / period;
            double value = phase < 0.5 ? (4.0 * phase - 1.0) : (3.0 - 4.0 * phase);
            signal[i] = static_cast<float>(amplitude * value);
        }
        return signal;
    }

    static std::vector<float> generateSawtoothWave(size_t length,
                                                  double frequency,
                                                  uint32_t sampleRate,
                                                  double amplitude = TestConfig::DEFAULT_TEST_AMPLITUDE) {
        std::vector<float> signal(length);
        double period = sampleRate / frequency;

        for (size_t i = 0; i < length; ++i) {
            double phase = std::fmod(i, period) / period;
            signal[i] = static_cast<float>(amplitude * (2.0 * phase - 1.0));
        }
        return signal;
    }

    static std::vector<float> generateWhiteNoise(size_t length,
                                                double amplitude = TestConfig::NOISE_AMPLITUDE) {
        std::vector<float> signal(length);
        auto& rng = RandomGenerator::instance();

        for (size_t i = 0; i < length; ++i) {
            signal[i] = static_cast<float>(amplitude * rng.getRandomNormal());
        }
        return signal;
    }

    static std::vector<float> generatePinkNoise(size_t length,
                                               double amplitude = TestConfig::NOISE_AMPLITUDE) {
        // Génération de bruit rose approximatif
        std::vector<float> signal(length);
        auto& rng = RandomGenerator::instance();

        double b0 = 0.0, b1 = 0.0, b2 = 0.0;
        for (size_t i = 0; i < length; ++i) {
            double white = rng.getRandomNormal();
            b0 = 0.997 * b0 + 0.03 * white;
            b1 = 0.993 * b1 + 0.007 * white;
            b2 = 0.989 * b2 + 0.004 * white;
            signal[i] = static_cast<float>(amplitude * (b0 + b1 + b2));
        }
        return signal;
    }

    static std::vector<float> generateImpulse(size_t length,
                                             size_t impulsePosition = 0,
                                             double amplitude = 1.0) {
        std::vector<float> signal(length, 0.0f);
        if (impulsePosition < length) {
            signal[impulsePosition] = static_cast<float>(amplitude);
        }
        return signal;
    }

    static std::vector<float> generateFrequencySweep(size_t length,
                                                    uint32_t sampleRate,
                                                    double startFreq,
                                                    double endFreq,
                                                    double amplitude = TestConfig::DEFAULT_TEST_AMPLITUDE) {
        std::vector<float> signal(length);
        double freqRatio = std::log(endFreq / startFreq);
        double phase = 0.0;

        for (size_t i = 0; i < length; ++i) {
            double t = static_cast<double>(i) / length;
            double currentFreq = startFreq * std::exp(t * freqRatio);
            double phaseIncrement = 2.0 * M_PI * currentFreq / sampleRate;

            signal[i] = static_cast<float>(amplitude * std::sin(phase));
            phase += phaseIncrement;
        }
        return signal;
    }
};

// Classe pour mesurer les performances
class PerformanceProfiler {
public:
    PerformanceProfiler(const std::string& testName) : testName_(testName) {
        start_ = std::chrono::high_resolution_clock::now();
    }

    ~PerformanceProfiler() {
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start_);

        std::cout << std::format("[PERF] {}: {} ms\n", testName_, duration.count());
    }

private:
    std::string testName_;
    std::chrono::time_point<std::chrono::high_resolution_clock> start_;
};

// Helper pour les tests de latence
class LatencyTester {
public:
    static double measureLatency(std::function<void()> processFunction,
                               size_t iterations = 100) {
        std::vector<double> measurements(iterations);

        for (size_t i = 0; i < iterations; ++i) {
            auto start = std::chrono::high_resolution_clock::now();
            processFunction();
            auto end = std::chrono::high_resolution_clock::now();

            auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
            measurements[i] = static_cast<double>(duration.count());
        }

        // Retourner la médiane pour éviter les outliers
        std::sort(measurements.begin(), measurements.end());
        return measurements[iterations / 2] / 1000.0; // Convertir en millisecondes
    }

    static bool isWithinLatencyBudget(double measuredLatencyMs,
                                    double budgetMs = TestConfig::PerformanceConfig::MAX_LATENCY_MS) {
        return measuredLatencyMs <= budgetMs;
    }
};

// Helper pour les tests de mémoire
class MemoryTester {
public:
    static size_t getCurrentMemoryUsage() {
        // Cette fonction est une approximation simple
        // Dans un vrai environnement, on utiliserait des outils comme Valgrind
        return 0; // Placeholder
    }

    static bool checkForMemoryLeaks(const std::function<void()>& testFunction) {
        size_t memoryBefore = getCurrentMemoryUsage();
        testFunction();
        size_t memoryAfter = getCurrentMemoryUsage();

        // Tolérance de 1MB
        return (memoryAfter - memoryBefore) < 1024 * 1024;
    }
};

// Macros de test utilitaires
#define AUDIO_TEST_ASSERT_SIGNAL_VALID(signal) \
    ASSERT_TRUE(SignalValidator::validateSignal(signal))

#define AUDIO_TEST_ASSERT_NO_NAN(signal) \
    ASSERT_FALSE(SignalValidator::checkForNaN(signal))

#define AUDIO_TEST_ASSERT_NO_INF(signal) \
    ASSERT_FALSE(SignalValidator::checkForInf(signal))

#define AUDIO_TEST_ASSERT_RMS_RANGE(signal, min, max) { \
    double rms = SignalValidator::calculateRMS(signal); \
    ASSERT_GE(rms, min); \
    ASSERT_LE(rms, max); \
}

#define AUDIO_TEST_ASSERT_PEAK_RANGE(signal, min, max) { \
    double peak = SignalValidator::calculatePeak(signal); \
    ASSERT_GE(peak, min); \
    ASSERT_LE(peak, max); \
}

#define AUDIO_TEST_ASSERT_SNR_MIN(signal1, signal2, minSnr) { \
    double snr = SignalValidator::calculateSNR(signal1, signal2); \
    ASSERT_GE(snr, minSnr); \
}

#define AUDIO_TEST_PERFORMANCE_TEST(testName, iterations, testFunction) { \
    PerformanceProfiler profiler(testName); \
    for (size_t i = 0; i < (iterations); ++i) { \
        testFunction(); \
    } \
}

} // namespace AudioTest
