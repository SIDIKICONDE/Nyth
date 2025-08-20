#include <gtest/gtest.h>
#include <gmock/gmock.h>
#include <cmath>
#include <vector>
#include <chrono>
#include <random>

// Configuration globale des tests
class AudioTestEnvironment : public ::testing::Environment {
public:
    void SetUp() override {
        // Configuration pour les tests numériques
        std::srand(static_cast<unsigned>(std::time(nullptr)));

        // Paramètres de précision pour les tests flottants
        floatingPointTolerance = 1e-6;
        doubleTolerance = 1e-12;

        // Paramètres audio de test
        testSampleRate = 48000;
        testBlockSize = 512;
    }

    void TearDown() override {
        // Nettoyage après les tests
    }

    double floatingPointTolerance;
    double doubleTolerance;
    uint32_t testSampleRate;
    size_t testBlockSize;
};

// Générateur de signaux de test
class TestSignalGenerator {
public:
    static std::vector<float> generateSineWave(float frequency, uint32_t sampleRate, size_t numSamples, float amplitude = 0.5f) {
        std::vector<float> signal(numSamples);
        for (size_t i = 0; i < numSamples; ++i) {
            double t = static_cast<double>(i) / sampleRate;
            signal[i] = amplitude * std::sin(2.0 * M_PI * frequency * t);
        }
        return signal;
    }

    static std::vector<float> generateImpulse(size_t numSamples, size_t impulsePosition = 0) {
        std::vector<float> signal(numSamples, 0.0f);
        if (impulsePosition < numSamples) {
            signal[impulsePosition] = 1.0f;
        }
        return signal;
    }

    static std::vector<float> generateNoise(size_t numSamples, float amplitude = 0.1f) {
        std::vector<float> signal(numSamples);
        std::default_random_engine generator;
        std::normal_distribution<float> distribution(0.0f, amplitude);

        for (size_t i = 0; i < numSamples; ++i) {
            signal[i] = distribution(generator);
        }
        return signal;
    }

    static std::vector<float> generateChirp(float startFreq, float endFreq, uint32_t sampleRate, size_t numSamples) {
        std::vector<float> signal(numSamples);
        double duration = static_cast<double>(numSamples) / sampleRate;
        double k = (endFreq - startFreq) / duration;

        for (size_t i = 0; i < numSamples; ++i) {
            double t = static_cast<double>(i) / sampleRate;
            double freq = startFreq + k * t;
            signal[i] = 0.5f * std::sin(2.0 * M_PI * freq * t);
        }
        return signal;
    }
};

// Utilitaires de test mathématiques
class MathTestUtilities {
public:
    static bool isApproximatelyEqual(double a, double b, double tolerance = 1e-6) {
        return std::abs(a - b) <= tolerance;
    }

    static bool isApproximatelyEqual(const std::vector<float>& a, const std::vector<float>& b, double tolerance = 1e-6) {
        if (a.size() != b.size()) return false;
        for (size_t i = 0; i < a.size(); ++i) {
            if (!isApproximatelyEqual(a[i], b[i], tolerance)) return false;
        }
        return true;
    }

    static double computeRMS(const std::vector<float>& signal) {
        double sumSquares = 0.0;
        for (float sample : signal) {
            sumSquares += sample * sample;
        }
        return std::sqrt(sumSquares / signal.size());
    }

    static double computePeak(const std::vector<float>& signal) {
        double peak = 0.0;
        for (float sample : signal) {
            peak = std::max(peak, std::abs(static_cast<double>(sample)));
        }
        return peak;
    }

    static std::vector<float> applyWindow(const std::vector<float>& signal, const std::string& windowType = "hann") {
        std::vector<float> windowed(signal.size());
        size_t N = signal.size();

        for (size_t i = 0; i < N; ++i) {
            double w = 1.0;
            if (windowType == "hann") {
                w = 0.5 * (1.0 - std::cos(2.0 * M_PI * i / (N - 1)));
            } else if (windowType == "hamming") {
                w = 0.54 - 0.46 * std::cos(2.0 * M_PI * i / (N - 1));
            }
            windowed[i] = signal[i] * static_cast<float>(w);
        }
        return windowed;
    }
};

// Benchmarking utilities
class PerformanceBenchmark {
public:
    template<typename Func>
    static std::chrono::nanoseconds benchmarkFunction(Func func, int iterations = 1000) {
        auto start = std::chrono::high_resolution_clock::now();

        for (int i = 0; i < iterations; ++i) {
            func();
        }

        auto end = std::chrono::high_resolution_clock::now();
        return std::chrono::duration_cast<std::chrono::nanoseconds>(end - start);
    }

    static void logBenchmark(const std::string& testName, std::chrono::nanoseconds duration, int iterations) {
        double msPerIteration = duration.count() / static_cast<double>(iterations) / 1000000.0;
        std::cout << "[BENCHMARK] " << testName << ": "
                  << msPerIteration << " ms/iteration ("
                  << iterations << " iterations)" << std::endl;
    }
};

int main(int argc, char** argv) {
    ::testing::InitGoogleTest(&argc, argv);

    // Configuration de l'environnement de test
    auto* env = new AudioTestEnvironment();
    ::testing::AddGlobalTestEnvironment(env);

    // Configuration des tests
    ::testing::FLAGS_gtest_shuffle = true;
    ::testing::FLAGS_gtest_repeat = 1;

    return RUN_ALL_TESTS();
}
