#pragma once

// Benchmarks de performance pour les composants audio
// Ce fichier contient des tests de performance avancés avec métriques détaillées

#include <vector>
#include <chrono>
#include <algorithm>
#include <numeric>
#include <functional>
#include <memory>
#include <format>
#include <iostream>

#include "test_helpers.hpp"
#include "test_config.hpp"

namespace AudioTest {

// Structure pour stocker les résultats de benchmark
struct BenchmarkResult {
    std::string testName;
    std::string componentName;
    size_t bufferSize;
    size_t iterations;
    double totalTimeMs;
    double avgTimePerIterationMs;
    double realtimeFactor;
    size_t samplesProcessed;
    double samplesPerSecond;
    double latencyMs;

    std::string toString() const {
        return std::format(
            "Benchmark: {} ({})\n"
            "  Buffer Size: {} samples\n"
            "  Iterations: {}\n"
            "  Total Time: {:.2f} ms\n"
            "  Avg Time/Iteration: {:.3f} ms\n"
            "  Realtime Factor: {:.2f}x\n"
            "  Samples/sec: {:.0f}\n"
            "  Latency: {:.2f} ms\n",
            testName, componentName, bufferSize, iterations,
            totalTimeMs, avgTimePerIterationMs, realtimeFactor,
            samplesPerSecond, latencyMs
        );
    }
};

// Classe de base pour les benchmarks
class AudioBenchmark {
public:
    virtual ~AudioBenchmark() = default;

    virtual void setup(size_t bufferSize) = 0;
    virtual void run(size_t iterations) = 0;
    virtual void teardown() = 0;

    virtual std::string getBenchmarkName() const = 0;
    virtual std::string getComponentName() const = 0;

    BenchmarkResult runBenchmark(size_t bufferSize, size_t iterations) {
        // Setup
        setup(bufferSize);

        // Warmup
        run(TestConfig::PerformanceConfig::WARMUP_ITERATIONS);

        // Mesure
        auto start = std::chrono::high_resolution_clock::now();
        run(iterations);
        auto end = std::chrono::high_resolution_clock::now();

        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
        double totalTimeMs = static_cast<double>(duration.count()) / 1000.0;

        // Calcul des métriques
        double avgTimePerIterationMs = totalTimeMs / iterations;
        size_t samplesProcessed = bufferSize * iterations;
        double sampleRate = static_cast<double>(TestConfig::DEFAULT_SAMPLE_RATE);
        double expectedTimeMs = (static_cast<double>(samplesProcessed) / sampleRate) * 1000.0;
        double realtimeFactor = expectedTimeMs / totalTimeMs;
        double samplesPerSecond = static_cast<double>(samplesProcessed) / (totalTimeMs / 1000.0);
        double latencyMs = avgTimePerIterationMs;

        // Teardown
        teardown();

        return BenchmarkResult{
            getBenchmarkName(),
            getComponentName(),
            bufferSize,
            iterations,
            totalTimeMs,
            avgTimePerIterationMs,
            realtimeFactor,
            samplesProcessed,
            samplesPerSecond,
            latencyMs
        };
    }
};

// Benchmark pour l'AudioEqualizer
class AudioEqualizerBenchmark : public AudioBenchmark {
public:
    void setup(size_t bufferSize) override {
        // Créer un signal de test
        input_ = TestSignalGenerator::generateSineWave(bufferSize,
                                                      TestConfig::DEFAULT_TEST_FREQUENCY,
                                                      TestConfig::DEFAULT_SAMPLE_RATE,
                                                      TestConfig::DEFAULT_TEST_AMPLITUDE);
        output_.resize(bufferSize);

        // Initialiser l'égaliseur
        equalizer_ = std::make_unique<AudioEqualizer::AudioEqualizer>();

        // Configurer quelques bandes pour le test
        equalizer_->setBandGain(0, 6.0);  // +6dB sur les basses
        equalizer_->setBandGain(5, -3.0); // -3dB sur les médiums
        equalizer_->setBandGain(9, 3.0);  // +3dB sur les aigus
    }

    void run(size_t iterations) override {
        for (size_t i = 0; i < iterations; ++i) {
            equalizer_->process(std::span<const float>(input_),
                               std::span<float>(output_));
        }
    }

    void teardown() override {
        equalizer_.reset();
        input_.clear();
        output_.clear();
    }

    std::string getBenchmarkName() const override {
        return "AudioEqualizer_10Band";
    }

    std::string getComponentName() const override {
        return "AudioEqualizer";
    }

private:
    std::unique_ptr<AudioEqualizer::AudioEqualizer> equalizer_;
    std::vector<float> input_;
    std::vector<float> output_;
};

// Benchmark pour les BiquadFilters
class BiquadFilterBenchmark : public AudioBenchmark {
public:
    void setup(size_t bufferSize) override {
        input_ = TestSignalGenerator::generateSineWave(bufferSize,
                                                      1000.0, // 1kHz
                                                      TestConfig::DEFAULT_SAMPLE_RATE,
                                                      TestConfig::DEFAULT_TEST_AMPLITUDE);
        output_.resize(bufferSize);

        // Créer plusieurs filtres pour simuler un scénario réaliste
        filters_.resize(5);
        for (auto& filter : filters_) {
            filter = std::make_unique<AudioEqualizer::BiquadFilter>();
        }

        // Configurer différents types de filtres
        filters_[0]->calculateLowpass(1000.0, TestConfig::DEFAULT_SAMPLE_RATE, 0.707);
        filters_[1]->calculateHighpass(100.0, TestConfig::DEFAULT_SAMPLE_RATE, 0.707);
        filters_[2]->calculatePeaking(1000.0, TestConfig::DEFAULT_SAMPLE_RATE, 1.414, 6.0);
        filters_[3]->calculateLowShelf(200.0, TestConfig::DEFAULT_SAMPLE_RATE, 0.707, 3.0);
        filters_[4]->calculateHighShelf(5000.0, TestConfig::DEFAULT_SAMPLE_RATE, 0.707, -2.0);
    }

    void run(size_t iterations) override {
        for (size_t i = 0; i < iterations; ++i) {
            // Traiter en cascade avec tous les filtres
            std::vector<float> temp = input_;
            for (auto& filter : filters_) {
                filter->process(std::span<const float>(temp),
                               std::span<float>(output_));
                temp = output_;
            }
        }
    }

    void teardown() override {
        filters_.clear();
        input_.clear();
        output_.clear();
    }

    std::string getBenchmarkName() const override {
        return "BiquadFilter_Cascade5";
    }

    std::string getComponentName() const override {
        return "BiquadFilter";
    }

private:
    std::vector<std::unique_ptr<AudioEqualizer::BiquadFilter>> filters_;
    std::vector<float> input_;
    std::vector<float> output_;
};

// Benchmark pour AudioBuffer
class AudioBufferBenchmark : public AudioBenchmark {
public:
    void setup(size_t bufferSize) override {
        buffer_ = std::make_unique<AudioEqualizer::AudioBuffer>(2, bufferSize);

        // Remplir avec des données de test
        for (size_t ch = 0; ch < 2; ++ch) {
            float* channel = buffer_->getChannel(ch);
            for (size_t i = 0; i < bufferSize; ++i) {
                channel[i] = static_cast<float>(std::sin(2.0 * M_PI * 440.0 * i / TestConfig::DEFAULT_SAMPLE_RATE));
            }
        }
    }

    void run(size_t iterations) override {
        for (size_t i = 0; i < iterations; ++i) {
            // Test des opérations courantes
            buffer_->applyGain(0.8f);
            buffer_->applyGainRamp(0, 0, buffer_->getNumSamples(), 0.5f, 1.0f);
            float magnitude = buffer_->getMagnitude(0, 0, buffer_->getNumSamples());
            float rms = buffer_->getRMSLevel(1, 0, buffer_->getNumSamples());
            buffer_->clear();
        }
    }

    void teardown() override {
        buffer_.reset();
    }

    std::string getBenchmarkName() const override {
        return "AudioBuffer_SIMD_Operations";
    }

    std::string getComponentName() const override {
        return "AudioBuffer";
    }

private:
    std::unique_ptr<AudioEqualizer::AudioBuffer> buffer_;
};

// Benchmark pour les effets
class AudioEffectsBenchmark : public AudioBenchmark {
public:
    void setup(size_t bufferSize) override {
        input_ = TestSignalGenerator::generateSineWave(bufferSize,
                                                      TestConfig::DEFAULT_TEST_FREQUENCY,
                                                      TestConfig::DEFAULT_SAMPLE_RATE,
                                                      TestConfig::DEFAULT_TEST_AMPLITUDE);
        output_.resize(bufferSize);

        // Initialiser les effets
        compressor_ = std::make_unique<AudioFX::CompressorEffect>();
        delay_ = std::make_unique<AudioFX::DelayEffect>();

        compressor_->setSampleRate(TestConfig::DEFAULT_SAMPLE_RATE, 1);
        delay_->setSampleRate(TestConfig::DEFAULT_SAMPLE_RATE, 1);

        // Configurer les effets
        compressor_->setParameters(-20.0, 3.0, 10.0, 80.0, 2.0);
        delay_->setParameters(150.0, 0.3, 0.25);

        compressor_->setEnabled(true);
        delay_->setEnabled(true);
    }

    void run(size_t iterations) override {
        std::vector<float> temp(buffer_->getNumSamples());

        for (size_t i = 0; i < iterations; ++i) {
            // Chaîne d'effets
            compressor_->processMono(input_.data(), temp.data(), input_.size());
            delay_->processMono(temp.data(), output_.data(), output_.size());
        }
    }

    void teardown() override {
        compressor_.reset();
        delay_.reset();
        input_.clear();
        output_.clear();
    }

    std::string getBenchmarkName() const override {
        return "AudioEffects_Chain";
    }

    std::string getComponentName() const override {
        return "AudioEffects";
    }

private:
    std::unique_ptr<AudioFX::CompressorEffect> compressor_;
    std::unique_ptr<AudioFX::DelayEffect> delay_;
    std::vector<float> input_;
    std::vector<float> output_;
};

// Benchmark pour la réduction de bruit
class NoiseReductionBenchmark : public AudioBenchmark {
public:
    void setup(size_t bufferSize) override {
        // Créer un signal avec du bruit
        auto cleanSignal = TestSignalGenerator::generateSineWave(bufferSize,
                                                               TestConfig::DEFAULT_TEST_FREQUENCY,
                                                               TestConfig::DEFAULT_SAMPLE_RATE,
                                                               0.5);
        auto noise = TestSignalGenerator::generateWhiteNoise(bufferSize, 0.1);

        input_.resize(bufferSize);
        for (size_t i = 0; i < bufferSize; ++i) {
            input_[i] = cleanSignal[i] + noise[i];
        }
        output_.resize(bufferSize);

        // Initialiser les modules de réduction de bruit
        gate_ = std::make_unique<AudioNR::NoiseReducer>(TestConfig::DEFAULT_SAMPLE_RATE, 1);
        spectral_ = std::make_unique<AudioNR::SpectralNR>();

        AudioNR::NoiseReducerConfig gateConfig;
        gateConfig.enabled = true;
        gateConfig.thresholdDb = -30.0;
        gateConfig.ratio = 2.0;
        gate_->setConfig(gateConfig);

        AudioNR::SpectralNRConfig spectralConfig;
        spectralConfig.enabled = true;
        spectralConfig.sampleRate = TestConfig::DEFAULT_SAMPLE_RATE;
        spectralConfig.fftSize = 1024;
        spectralConfig.hopSize = 256;
        spectralConfig.beta = 1.5f;
        spectral_->setConfig(spectralConfig);
    }

    void run(size_t iterations) override {
        for (size_t i = 0; i < iterations; ++i) {
            // Pipeline de réduction de bruit
            gate_->processMono(input_.data(), output_.data(), input_.size());
            spectral_->process(output_.data(), output_.data(), output_.size());
        }
    }

    void teardown() override {
        gate_.reset();
        spectral_.reset();
        input_.clear();
        output_.clear();
    }

    std::string getBenchmarkName() const override {
        return "NoiseReduction_Pipeline";
    }

    std::string getComponentName() const override {
        return "NoiseReduction";
    }

private:
    std::unique_ptr<AudioNR::NoiseReducer> gate_;
    std::unique_ptr<AudioNR::SpectralNR> spectral_;
    std::vector<float> input_;
    std::vector<float> output_;
};

// Classe pour exécuter tous les benchmarks
class BenchmarkSuite {
public:
    void addBenchmark(std::unique_ptr<AudioBenchmark> benchmark) {
        benchmarks_.push_back(std::move(benchmark));
    }

    void runAllBenchmarks(const std::vector<size_t>& bufferSizes = {512, 1024, 2048, 4096},
                          size_t iterations = TestConfig::PerformanceConfig::BENCHMARK_ITERATIONS) {
        std::cout << "🎵 Running Audio Benchmark Suite\n";
        std::cout << "================================\n\n";

        for (size_t bufferSize : bufferSizes) {
            std::cout << std::format("Buffer Size: {} samples\n", bufferSize);
            std::cout << "--------------------------------\n";

            for (auto& benchmark : benchmarks_) {
                auto result = benchmark->runBenchmark(bufferSize, iterations);

                // Évaluer les performances
                std::string performanceRating;
                if (result.realtimeFactor >= TestConfig::PerformanceConfig::EXCELLENT_THRESHOLD) {
                    performanceRating = "🟢 EXCELLENT";
                } else if (result.realtimeFactor >= TestConfig::PerformanceConfig::GOOD_THRESHOLD) {
                    performanceRating = "🟡 GOOD";
                } else if (result.realtimeFactor >= TestConfig::PerformanceConfig::MINIMUM_THRESHOLD) {
                    performanceRating = "🟠 ACCEPTABLE";
                } else {
                    performanceRating = "🔴 POOR";
                }

                std::cout << result.toString();
                std::cout << "  Performance: " << performanceRating << "\n\n";
            }
        }

        printSummary();
    }

private:
    std::vector<std::unique_ptr<AudioBenchmark>> benchmarks_;

    void printSummary() {
        std::cout << "📊 Benchmark Summary\n";
        std::cout << "===================\n";
        std::cout << "All benchmarks completed. Check individual results above.\n";
        std::cout << "\nPerformance Guidelines:\n";
        std::cout << "🟢 EXCELLENT: >10x realtime (optimal for professional audio)\n";
        std::cout << "🟡 GOOD: >2x realtime (good for most applications)\n";
        std::cout << "🟠 ACCEPTABLE: >1x realtime (minimum for real-time)\n";
        std::cout << "🔴 POOR: <1x realtime (not suitable for real-time)\n";
    }
};

// Fonction utilitaire pour créer une suite de benchmarks complète
inline std::unique_ptr<BenchmarkSuite> createCompleteBenchmarkSuite() {
    auto suite = std::make_unique<BenchmarkSuite>();

    suite->addBenchmark(std::make_unique<AudioEqualizerBenchmark>());
    suite->addBenchmark(std::make_unique<BiquadFilterBenchmark>());
    suite->addBenchmark(std::make_unique<AudioBufferBenchmark>());
    suite->addBenchmark(std::make_unique<AudioEffectsBenchmark>());
    suite->addBenchmark(std::make_unique<NoiseReductionBenchmark>());

    return suite;
}

// Macros pour faciliter l'utilisation dans les tests
#define RUN_AUDIO_BENCHMARKS(bufferSizes, iterations) { \
    auto suite = createCompleteBenchmarkSuite(); \
    suite->runAllBenchmarks(bufferSizes, iterations); \
}

#define RUN_SINGLE_BENCHMARK(BenchmarkClass, bufferSize, iterations) { \
    auto benchmark = std::make_unique<BenchmarkClass>(); \
    auto result = benchmark->runBenchmark(bufferSize, iterations); \
    std::cout << result.toString() << std::endl; \
}

} // namespace AudioTest
