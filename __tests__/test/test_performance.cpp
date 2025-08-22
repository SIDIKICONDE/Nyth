#include <gtest/gtest.h>
#include <gmock/gmock.h>
#include <cmath>
#include <vector>
#include <memory>
#include <thread>
#include <chrono>
#include <algorithm>
#include <numeric>

// Inclure tous les composants pour les benchmarks
#include "../shared/Audio/core/BiquadFilter.h"
#include "../shared/Audio/core/AudioEqualizer.h"
#include "../shared/Audio/utils/AudioBuffer.h"
#include "../shared/Audio/safety/AudioSafety.h"
#include "../shared/Audio/noise/NoiseReducer.h"
#include "../shared/Audio/noise/SpectralNR.h"
#include "../shared/Audio/effects/Compressor.h"
#include "../shared/Audio/effects/Delay.h"
#include "../shared/Audio/effects/EffectChain.h"
#include "test_main.cpp"

// Test fixture pour les benchmarks de performance
class PerformanceTest : public ::testing::Test {
protected:
    void SetUp() override {
        sampleRate = 48000;
        blockSize = 512;
        numChannels = 2;
        numIterations = 1000;
        tolerance = 1e-6;

        // Créer des signaux de test représentatifs
        testSignalMono = TestSignalGenerator::generateSineWave(1000.0, sampleRate, blockSize, 0.5f);
        testSignalStereoL = TestSignalGenerator::generateSineWave(440.0, sampleRate, blockSize, 0.4f);
        testSignalStereoR = TestSignalGenerator::generateSineWave(880.0, sampleRate, blockSize, 0.3f);

        // Créer un signal avec du bruit pour les tests de réduction de bruit
        noisySignalMono = TestSignalGenerator::generateSineWave(1000.0, sampleRate, blockSize, 0.3f);
        auto noiseMono = TestSignalGenerator::generateNoise(blockSize, 0.1f);
        for (size_t i = 0; i < blockSize; ++i) {
            noisySignalMono[i] += noiseMono[i];
        }

        noisySignalStereoL = TestSignalGenerator::generateSineWave(440.0, sampleRate, blockSize, 0.4f);
        noisySignalStereoR = TestSignalGenerator::generateSineWave(880.0, sampleRate, blockSize, 0.3f);
        auto noiseL = TestSignalGenerator::generateNoise(blockSize, 0.05f);
        auto noiseR = TestSignalGenerator::generateNoise(blockSize, 0.05f);
        for (size_t i = 0; i < blockSize; ++i) {
            noisySignalStereoL[i] += noiseL[i];
            noisySignalStereoR[i] += noiseR[i];
        }
    }

    void TearDown() override {
        // Nettoyage automatique
    }

    uint32_t sampleRate;
    size_t blockSize;
    int numChannels;
    int numIterations;
    double tolerance;

    std::vector<float> testSignalMono;
    std::vector<float> testSignalStereoL, testSignalStereoR;
    std::vector<float> noisySignalMono;
    std::vector<float> noisySignalStereoL, noisySignalStereoR;
};

// Benchmark du BiquadFilter
TEST_F(PerformanceTest, BiquadFilterBenchmark) {
    AudioEqualizer::BiquadFilter filter;
    filter.calculateLowpass(1000.0, sampleRate, 0.707);

    std::vector<float> output(blockSize);

    auto duration = PerformanceBenchmark::benchmarkFunction([&]() {
        filter.process(testSignalMono.data(), output.data(), blockSize);
    }, numIterations);

    PerformanceBenchmark::logBenchmark("BiquadFilter Lowpass", duration, numIterations);

    // Vérifier que c'est temps réel (< 2ms pour 512 samples)
    double msPerBlock = duration.count() / static_cast<double>(numIterations) / 1000000.0;
    EXPECT_TRUE(msPerBlock < 2.0) << "BiquadFilter too slow: " << msPerBlock << "ms per block";
}

// Benchmark de l'AudioEqualizer
TEST_F(PerformanceTest, AudioEqualizerBenchmark) {
    AudioEqualizer::AudioEqualizer eq(10, sampleRate);

    // Configurer un égaliseur typique
    eq.setBandGain(0, 3.0);   // Bass boost
    eq.setBandGain(3, -2.0);  // Mid cut
    eq.setBandGain(6, 2.0);   // High boost

    std::vector<float> output(blockSize);

    auto duration = PerformanceBenchmark::benchmarkFunction([&]() {
        eq.process(testSignalMono.data(), output.data(), blockSize);
    }, numIterations);

    PerformanceBenchmark::logBenchmark("AudioEqualizer 10-band", duration, numIterations);

    // Vérifier que c'est temps réel (< 5ms pour 512 samples)
    double msPerBlock = duration.count() / static_cast<double>(numIterations) / 1000000.0;
    EXPECT_TRUE(msPerBlock < 5.0) << "AudioEqualizer too slow: " << msPerBlock << "ms per block";
}

// Benchmark stéréo de l'AudioEqualizer
TEST_F(PerformanceTest, AudioEqualizerStereoBenchmark) {
    AudioEqualizer::AudioEqualizer eq(10, sampleRate);

    // Configurer l'égaliseur
    eq.setBandGain(0, 2.0);
    eq.setBandGain(5, -3.0);

    std::vector<float> outputL(blockSize), outputR(blockSize);

    auto duration = PerformanceBenchmark::benchmarkFunction([&]() {
        eq.processStereo(testSignalStereoL.data(), testSignalStereoR.data(),
                        outputL.data(), outputR.data(), blockSize);
    }, numIterations);

    PerformanceBenchmark::logBenchmark("AudioEqualizer Stereo", duration, numIterations);

    double msPerBlock = duration.count() / static_cast<double>(numIterations) / 1000000.0;
    EXPECT_TRUE(msPerBlock < 3.0) << "AudioEqualizer stereo too slow: " << msPerBlock << "ms per block";
}

// Benchmark de l'AudioSafety
TEST_F(PerformanceTest, AudioSafetyBenchmark) {
    AudioSafety::AudioSafetyEngine safety(sampleRate, numChannels);
    std::vector<float> output(blockSize);

    auto duration = PerformanceBenchmark::benchmarkFunction([&]() {
        safety.processMono(testSignalMono.data(), output.data(), blockSize);
    }, numIterations);

    PerformanceBenchmark::logBenchmark("AudioSafetyEngine", duration, numIterations);

    double msPerBlock = duration.count() / static_cast<double>(numIterations) / 1000000.0;
    EXPECT_TRUE(msPerBlock < 1.0) << "AudioSafety too slow: " << msPerBlock << "ms per block";
}

// Benchmark du NoiseReducer
TEST_F(PerformanceTest, NoiseReducerBenchmark) {
    AudioNR::NoiseReducer noiseReducer(sampleRate, 1);
    std::vector<float> output(blockSize);

    auto duration = PerformanceBenchmark::benchmarkFunction([&]() {
        noiseReducer.processMono(noisySignalMono.data(), output.data(), blockSize);
    }, numIterations);

    PerformanceBenchmark::logBenchmark("NoiseReducer", duration, numIterations);

    double msPerBlock = duration.count() / static_cast<double>(numIterations) / 1000000.0;
    EXPECT_TRUE(msPerBlock < 10.0) << "NoiseReducer too slow: " << msPerBlock << "ms per block";
}

// Benchmark du SpectralNR
TEST_F(PerformanceTest, SpectralNRBenchmark) {
    AudioNR::SpectralNRConfig config{};
    config.fftSize = 512;
    config.hopSize = 128;
    config.beta = 1.5;
    config.enabled = true;
    config.sampleRate = sampleRate;

    AudioNR::SpectralNR spectralNR(config);
    std::vector<float> output(blockSize);

    auto duration = PerformanceBenchmark::benchmarkFunction([&]() {
        spectralNR.process(noisySignalMono.data(), output.data(), blockSize);
    }, 500); // Moins d'itérations car plus lent

    PerformanceBenchmark::logBenchmark("SpectralNR", duration, 500);

    double msPerBlock = duration.count() / 500.0 / 1000000.0;
    EXPECT_TRUE(msPerBlock < 50.0) << "SpectralNR too slow: " << msPerBlock << "ms per block";
}

// Benchmark du compresseur
TEST_F(PerformanceTest, CompressorBenchmark) {
    AudioFX::CompressorEffect compressor;
    compressor.setSampleRate(sampleRate, 1);
    compressor.setParameters(-18.0, 3.0, 10.0, 80.0, 0.0);
    compressor.setEnabled(true);

    std::vector<float> output(blockSize);

    auto duration = PerformanceBenchmark::benchmarkFunction([&]() {
        compressor.processMono(testSignalMono.data(), output.data(), blockSize);
    }, numIterations);

    PerformanceBenchmark::logBenchmark("Compressor", duration, numIterations);

    double msPerBlock = duration.count() / static_cast<double>(numIterations) / 1000000.0;
    EXPECT_TRUE(msPerBlock < 3.0) << "Compressor too slow: " << msPerBlock << "ms per block";
}

// Benchmark du delay
TEST_F(PerformanceTest, DelayBenchmark) {
    AudioFX::DelayEffect delay;
    delay.setSampleRate(sampleRate, 1);
    delay.setParameters(150.0, 0.3, 0.25);
    delay.setEnabled(true);

    std::vector<float> output(blockSize);

    auto duration = PerformanceBenchmark::benchmarkFunction([&]() {
        delay.processMono(testSignalMono.data(), output.data(), blockSize);
    }, numIterations);

    PerformanceBenchmark::logBenchmark("Delay", duration, numIterations);

    double msPerBlock = duration.count() / static_cast<double>(numIterations) / 1000000.0;
    EXPECT_TRUE(msPerBlock < 2.0) << "Delay too slow: " << msPerBlock << "ms per block";
}

// Benchmark de l'EffectChain
TEST_F(PerformanceTest, EffectChainBenchmark) {
    AudioFX::EffectChain chain;
    chain.setSampleRate(sampleRate, 1);

    // Ajouter plusieurs effets
    auto* compressor = chain.emplaceEffect<AudioFX::CompressorEffect>();
    compressor->setParameters(-18.0, 3.0, 10.0, 80.0, 0.0);
    compressor->setEnabled(true);

    auto* delay = chain.emplaceEffect<AudioFX::DelayEffect>();
    delay->setParameters(100.0, 0.2, 0.15);
    delay->setEnabled(true);

    chain.setEnabled(true);
    std::vector<float> output(blockSize);

    auto duration = PerformanceBenchmark::benchmarkFunction([&]() {
        chain.processMono(testSignalMono.data(), output.data(), blockSize);
    }, numIterations);

    PerformanceBenchmark::logBenchmark("EffectChain (2 effects)", duration, numIterations);

    double msPerBlock = duration.count() / static_cast<double>(numIterations) / 1000000.0;
    EXPECT_TRUE(msPerBlock < 8.0) << "EffectChain too slow: " << msPerBlock << "ms per block";
}

// Benchmark de l'AudioBuffer
TEST_F(PerformanceTest, AudioBufferBenchmark) {
    AudioEqualizer::AudioBuffer buffer(numChannels, blockSize);

    // Remplir le buffer
    for (size_t ch = 0; ch < numChannels; ++ch) {
        buffer.copyFrom(ch, testSignalMono.data(), blockSize);
    }

    auto duration = PerformanceBenchmark::benchmarkFunction([&]() {
        buffer.applyGain(2.0f);
    }, numIterations * 10);

    PerformanceBenchmark::logBenchmark("AudioBuffer applyGain", duration, numIterations * 10);

    double msPerOperation = duration.count() / static_cast<double>(numIterations * 10) / 1000000.0;
    EXPECT_TRUE(msPerOperation < 1.0) << "AudioBuffer too slow: " << msPerOperation << "ms per operation";
}

// Test de latence
TEST_F(PerformanceTest, LatencyTest) {
    // Mesurer la latence de bout en bout
    AudioEqualizer::AudioEqualizer eq(10, sampleRate);
    eq.setBandGain(0, 3.0);

    AudioSafety::AudioSafetyEngine safety(sampleRate, 1);

    const int numBlocks = 1000;
    std::vector<float> input(blockSize);
    std::vector<float> temp(blockSize);
    std::vector<float> output(blockSize);

    // Générer un signal d'impulsion pour mesurer la latence
    std::fill(input.begin(), input.end(), 0.0f);
    input[0] = 1.0f; // Impulsion

    auto start = std::chrono::high_resolution_clock::now();

    for (int i = 0; i < numBlocks; ++i) {
        // Chaîne complète : Safety -> EQ -> Safety
        safety.processMono(input.data(), temp.data(), blockSize);
        eq.process(temp.data(), output.data(), blockSize);
        safety.processMono(output.data(), temp.data(), blockSize);

        // Pour les itérations suivantes, utiliser un signal nul
        std::fill(input.begin(), input.end(), 0.0f);
    }

    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::nanoseconds>(end - start);

    double totalLatencyMs = duration.count() / 1000000.0;
    double latencyPerBlockUs = totalLatencyMs * 1000.0 / numBlocks;

    PerformanceBenchmark::logBenchmark("Full Chain Latency", duration, numBlocks);

    // La latence par bloc devrait être < 1ms pour un traitement temps réel
    EXPECT_TRUE(latencyPerBlockUs < 1000.0) << "Latency too high: " << latencyPerBlockUs << "µs per block";
}

// Test de stabilité numérique
TEST_F(PerformanceTest, NumericalStabilityTest) {
    AudioEqualizer::BiquadFilter filter;
    AudioSafety::AudioSafetyEngine safety(sampleRate, 1);

    const int numBlocks = 10000;
    std::vector<float> signal(blockSize);
    std::vector<float> output(blockSize);

    // Test avec différentes fréquences et amplitudes
    std::vector<double> testFrequencies = {20.0, 100.0, 1000.0, 10000.0, 20000.0};
    std::vector<float> testAmplitudes = {0.01f, 0.1f, 0.5f, 1.0f};

    for (double freq : testFrequencies) {
        for (float amp : testAmplitudes) {
            filter.calculateLowpass(freq, sampleRate, 0.707);

            for (int i = 0; i < numBlocks; ++i) {
                // Générer un signal de test
                for (size_t j = 0; j < blockSize; ++j) {
                    signal[j] = amp * std::sin(2.0 * M_PI * freq * (i * blockSize + j) / sampleRate);
                }

                // Traiter le signal
                filter.process(signal.data(), output.data(), blockSize);
                safety.processMono(output.data(), signal.data(), blockSize);

                // Vérifier la stabilité numérique
                for (float sample : signal) {
                    EXPECT_TRUE(std::isfinite(sample)) << "Non-finite sample at freq=" << freq << " amp=" << amp;
                    EXPECT_TRUE(sample >= -1.1f && sample <= 1.1f) << "Sample out of range: " << sample;
                }
            }
        }
    }
}

// Test de charge mémoire
TEST_F(PerformanceTest, MemoryUsageTest) {
    const int numInstances = 100;
    std::vector<std::unique_ptr<AudioEqualizer::AudioEqualizer>> equalizers;

    // Créer de nombreuses instances
    for (int i = 0; i < numInstances; ++i) {
        auto eq = std::make_unique<AudioEqualizer::AudioEqualizer>(10, sampleRate);
        eq->setBandGain(i % 10, 3.0f);
        equalizers.push_back(std::move(eq));
    }

    // Utiliser les instances
    std::vector<float> output(blockSize);
    for (int i = 0; i < 100; ++i) {
        for (auto& eq : equalizers) {
            eq->process(testSignalMono.data(), output.data(), blockSize);
        }
    }

    // Vérifier que toutes les instances fonctionnent correctement
    for (auto& eq : equalizers) {
        eq->process(testSignalMono.data(), output.data(), blockSize);
        double rms = MathTestUtilities::computeRMS(output);
        EXPECT_TRUE(rms > 0.0);
    }

    // Nettoyer
    equalizers.clear();

    SUCCEED() << "Memory usage test passed with " << numInstances << " instances";
}

// Test de concurrence
TEST_F(PerformanceTest, ConcurrencyTest) {
    const int numThreads = 4;
    const int blocksPerThread = 1000;

    AudioEqualizer::AudioEqualizer eq(10, sampleRate);
    eq.setBandGain(0, 2.0);

    std::vector<std::thread> threads;
    std::vector<double> threadTimes(numThreads);

    for (int t = 0; t < numThreads; ++t) {
        threads.emplace_back([&, t]() {
            std::vector<float> localOutput(blockSize);
            auto start = std::chrono::high_resolution_clock::now();

            for (int i = 0; i < blocksPerThread; ++i) {
                eq.process(testSignalMono.data(), localOutput.data(), blockSize);
            }

            auto end = std::chrono::high_resolution_clock::now();
            auto duration = std::chrono::duration_cast<std::chrono::nanoseconds>(end - start);
            threadTimes[t] = duration.count() / 1000000.0; // Convertir en ms
        });
    }

    // Attendre que tous les threads terminent
    for (auto& thread : threads) {
        thread.join();
    }

    // Calculer les statistiques
    double totalTime = std::accumulate(threadTimes.begin(), threadTimes.end(), 0.0);
    double avgTime = totalTime / numThreads;
    double maxTime = *std::max_element(threadTimes.begin(), threadTimes.end());
    double minTime = *std::min_element(threadTimes.begin(), threadTimes.end());

    std::cout << "[CONCURRENCY] " << numThreads << " threads, "
              << blocksPerThread << " blocks each:" << std::endl;
    std::cout << "  Total time: " << totalTime << "ms" << std::endl;
    std::cout << "  Average time per thread: " << avgTime << "ms" << std::endl;
    std::cout << "  Min/Max time: " << minTime << "/" << maxTime << "ms" << std::endl;

    // Vérifier que la concurrence fonctionne correctement
    EXPECT_TRUE(maxTime < avgTime * 2.0) << "Thread time variance too high";
}

// Test de débit maximal
TEST_F(PerformanceTest, ThroughputTest) {
    AudioEqualizer::AudioEqualizer eq(10, sampleRate);
    AudioSafety::AudioSafetyEngine safety(sampleRate, 1);

    // Configurer pour un traitement typique
    eq.setBandGain(0, 3.0);
    eq.setBandGain(5, -2.0);

    const int numBlocks = 10000;
    const size_t largeBlockSize = 4096; // 4K samples
    std::vector<float> largeSignal(largeBlockSize);
    std::vector<float> temp(largeBlockSize);
    std::vector<float> output(largeBlockSize);

    // Générer un signal de test
    for (size_t i = 0; i < largeBlockSize; ++i) {
        largeSignal[i] = 0.5f * std::sin(2.0 * M_PI * 1000.0 * i / sampleRate);
    }

    auto start = std::chrono::high_resolution_clock::now();

    for (int i = 0; i < numBlocks; ++i) {
        safety.processMono(largeSignal.data(), temp.data(), largeBlockSize);
        eq.process(temp.data(), output.data(), largeBlockSize);
        safety.processMono(output.data(), temp.data(), largeBlockSize);
    }

    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::nanoseconds>(end - start);

    double totalSeconds = duration.count() / 1e9;
    double totalSamples = static_cast<double>(numBlocks) * largeBlockSize;
    double sampleRateAchieved = totalSamples / totalSeconds;

    std::cout << "[THROUGHPUT] Processed " << totalSamples / 1000000.0 << "M samples in "
              << totalSeconds << "s" << std::endl;
    std::cout << "[THROUGHPUT] Achieved sample rate: " << sampleRateAchieved / 1000.0 << "kHz" << std::endl;

    // Devrait supporter au moins 44.1kHz stéréo
    EXPECT_TRUE(sampleRateAchieved > 44100.0) << "Throughput too low: " << sampleRateAchieved << " Hz";
}

// Test de robustesse face aux signaux extrêmes
TEST_F(PerformanceTest, ExtremeSignalTest) {
    AudioEqualizer::AudioEqualizer eq(10, sampleRate);
    AudioSafety::AudioSafetyEngine safety(sampleRate, 1);

    eq.setBandGain(0, 6.0); // Boost important

    std::vector<float> extremeSignal(blockSize);

    // Test avec différents types de signaux extrêmes
    std::vector<std::function<void(std::vector<float>&)>> signalGenerators = {
        // Signal avec des pics très élevés
        [](std::vector<float>& sig) {
            for (size_t i = 0; i < sig.size(); ++i) {
                sig[i] = (i % 10 == 0) ? 5.0f : 0.1f;
            }
        },
        // Signal avec NaN (devrait être géré)
        [](std::vector<float>& sig) {
            for (size_t i = 0; i < sig.size(); ++i) {
                sig[i] = (i % 100 == 0) ? std::numeric_limits<float>::quiet_NaN() : 0.5f;
            }
        },
        // Signal avec infinis
        [](std::vector<float>& sig) {
            for (size_t i = 0; i < sig.size(); ++i) {
                sig[i] = (i % 200 == 0) ? std::numeric_limits<float>::infinity() : 0.3f;
            }
        }
    };

    std::vector<float> output(blockSize);

    for (auto& generator : signalGenerators) {
        generator(extremeSignal);

        // Le système devrait rester stable même avec des signaux extrêmes
        EXPECT_NO_THROW({
            safety.processMono(extremeSignal.data(), output.data(), blockSize);
            eq.process(output.data(), extremeSignal.data(), blockSize);
            safety.processMono(extremeSignal.data(), output.data(), blockSize);
        });

        // Vérifier que la sortie est toujours valide
        for (float sample : output) {
            EXPECT_TRUE(std::isfinite(sample)) << "Non-finite output sample";
            EXPECT_TRUE(sample >= -1.1f && sample <= 1.1f) << "Sample out of range: " << sample;
        }
    }
}
