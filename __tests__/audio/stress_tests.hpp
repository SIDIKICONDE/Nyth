#pragma once

// Tests de stress et de robustesse pour les composants audio
// Ces tests vérifient le comportement dans des conditions extrêmes

#include <vector>
#include <algorithm>
#include <random>
#include <memory>
#include <thread>
#include <future>
#include <atomic>
#include <mutex>
#include <chrono>
#include <format>
#include <iostream>

#include "test_helpers.hpp"
#include "test_config.hpp"

namespace AudioTest {

// Test de stress pour l'AudioEqualizer
class AudioEqualizerStressTest {
public:
    static void runExtremeParametersTest() {
        std::cout << "🔥 Running AudioEqualizer Extreme Parameters Test\n";

        auto equalizer = std::make_unique<AudioEqualizer::AudioEqualizer>();
        auto input = TestSignalGenerator::generateSineWave(1024, 1000.0, 44100, 0.1f);
        std::vector<float> output(1024);

        // Test avec des paramètres extrêmes
        equalizer->setMasterGain(TestConfig::RobustnessConfig::EXTREME_GAIN_DB);
        equalizer->setBandGain(0, TestConfig::RobustnessConfig::EXTREME_GAIN_DB);
        equalizer->setBandFrequency(0, TestConfig::RobustnessConfig::EXTREME_FREQUENCY);
        equalizer->setBandQ(0, TestConfig::RobustnessConfig::EXTREME_Q);

        // Le traitement ne devrait pas crasher même avec ces paramètres
        try {
            equalizer->process(std::span(input), std::span(output));
            std::cout << "✅ Extreme parameters handled successfully\n";
        } catch (const std::exception& e) {
            std::cout << "❌ Failed with extreme parameters: " << e.what() << "\n";
        }
    }

    static void runBufferSizeStressTest() {
        std::cout << "🔥 Running AudioEqualizer Buffer Size Stress Test\n";

        auto equalizer = std::make_unique<AudioEqualizer::AudioEqualizer>();

        for (size_t bufferSize : TestConfig::RobustnessConfig::TEST_BUFFER_SIZES) {
            try {
                auto input = TestSignalGenerator::generateSineWave(bufferSize, 1000.0, 44100, 0.1f);
                std::vector<float> output(bufferSize);

                equalizer->process(std::span(input), std::span(output));

                if (SignalValidator::validateSignal(output)) {
                    std::cout << std::format("✅ Buffer size {} OK\n", bufferSize);
                } else {
                    std::cout << std::format("❌ Buffer size {} produced invalid signal\n", bufferSize);
                }
            } catch (const std::exception& e) {
                std::cout << std::format("❌ Buffer size {} failed: {}\n", bufferSize, e.what());
            }
        }
    }

    static void runMemoryStressTest() {
        std::cout << "🔥 Running AudioEqualizer Memory Stress Test\n";

        for (size_t i = 0; i < TestConfig::RobustnessConfig::STRESS_ITERATIONS; ++i) {
            auto equalizer = std::make_unique<AudioEqualizer::AudioEqualizer>();
            auto input = TestSignalGenerator::generateWhiteNoise(1024, 0.1f);
            std::vector<float> output(1024);

            equalizer->process(std::span(input), std::span(output));

            // Vérifier que le signal est toujours valide
            if (!SignalValidator::validateSignal(output)) {
                std::cout << std::format("❌ Memory stress test failed at iteration {}\n", i);
                return;
            }
        }

        std::cout << "✅ Memory stress test completed successfully\n";
    }

    static void runConcurrentAccessTest() {
        std::cout << "🔥 Running AudioEqualizer Concurrent Access Test\n";

        const int numThreads = 4;
        std::vector<std::future<void>> futures;
        std::atomic<bool> running{true};
        std::mutex equalizerMutex;

        auto equalizer = std::make_unique<AudioEqualizer::AudioEqualizer>();
        auto input = TestSignalGenerator::generateSineWave(1024, 1000.0, 44100, 0.1f);
        std::vector<float> output(1024);

        // Lancer plusieurs threads qui utilisent l'égaliseur
        for (int t = 0; t < numThreads; ++t) {
            futures.push_back(std::async(std::launch::async, [&]() {
                while (running) {
                    {
                        std::lock_guard<std::mutex> lock(equalizerMutex);
                        equalizer->setBandGain(t % 10, static_cast<double>(t));
                        equalizer->process(std::span(input), std::span(output));
                    }
                    std::this_thread::sleep_for(std::chrono::microseconds(100));
                }
            }));
        }

        // Laisser tourner pendant 1 seconde
        std::this_thread::sleep_for(std::chrono::seconds(1));
        running = false;

        // Attendre que tous les threads se terminent
        for (auto& future : futures) {
            future.wait();
        }

        std::cout << "✅ Concurrent access test completed successfully\n";
    }
};

// Test de stress pour les BiquadFilters
class BiquadFilterStressTest {
public:
    static void runFilterTypeStressTest() {
        std::cout << "🔥 Running BiquadFilter Type Stress Test\n";

        auto filter = std::make_unique<AudioEqualizer::BiquadFilter>();
        auto input = TestSignalGenerator::generateSineWave(1024, 1000.0, 44100, 0.1f);
        std::vector<float> output(1024);

        // Tester tous les types de filtres avec des paramètres extrêmes
        using FilterType = AudioEqualizer::FilterType;

        std::vector<FilterType> filterTypes = {
            FilterType::LOWPASS, FilterType::HIGHPASS, FilterType::BANDPASS,
            FilterType::NOTCH, FilterType::PEAK, FilterType::LOWSHELF,
            FilterType::HIGHSHELF, FilterType::ALLPASS
        };

        for (auto filterType : filterTypes) {
            try {
                // Configuration avec paramètres extrêmes
                switch (filterType) {
                    case FilterType::LOWPASS:
                    case FilterType::HIGHPASS:
                        filter->calculateLowpass(TestConfig::RobustnessConfig::EXTREME_FREQUENCY, 44100, 10.0);
                        break;
                    case FilterType::PEAK:
                        filter->calculatePeaking(TestConfig::RobustnessConfig::EXTREME_FREQUENCY, 44100, 10.0, 120.0);
                        break;
                    case FilterType::LOWSHELF:
                    case FilterType::HIGHSHELF:
                        filter->calculateLowShelf(100.0, 44100, 10.0, 120.0);
                        break;
                    default:
                        filter->calculateLowpass(1000.0, 44100, 0.707);
                        break;
                }

                filter->process(std::span(input), std::span(output));

                if (SignalValidator::validateSignal(output)) {
                    std::cout << std::format("✅ Filter type {} OK\n", static_cast<int>(filterType));
                } else {
                    std::cout << std::format("❌ Filter type {} produced invalid signal\n", static_cast<int>(filterType));
                }
            } catch (const std::exception& e) {
                std::cout << std::format("❌ Filter type {} failed: {}\n", static_cast<int>(filterType), e.what());
            }
        }
    }

    static void runCoefficientStressTest() {
        std::cout << "🔥 Running BiquadFilter Coefficient Stress Test\n";

        auto filter = std::make_unique<AudioEqualizer::BiquadFilter>();

        // Tester avec des coefficients extrêmes
        std::vector<std::tuple<double, double, double, double, double, double>> extremeCoeffs = {
            {1.0, 0.0, 0.0, 1.0, 0.0, 0.0},  // Identité
            {10.0, 5.0, 2.0, 1.0, 0.1, 0.01}, // Coefficients élevés
            {0.1, -0.1, 0.05, 1.0, -0.5, 0.2}, // Coefficients négatifs
            {1e-6, 1e-6, 1e-6, 1.0, 1e-6, 1e-6} // Coefficients très petits
        };

        for (auto [a0, a1, a2, b0, b1, b2] : extremeCoeffs) {
            try {
                filter->setCoefficients(a0, a1, a2, b0, b1, b2);

                auto input = TestSignalGenerator::generateImpulse(1024, 0, 1.0f);
                std::vector<float> output(1024);

                filter->process(std::span(input), std::span(output));

                if (SignalValidator::validateSignal(output)) {
                    std::cout << std::format("✅ Coefficients ({:.0e}, {:.0e}, ...) OK\n", a0, a1);
                } else {
                    std::cout << std::format("❌ Coefficients ({:.0e}, {:.0e}, ...) produced invalid signal\n", a0, a1);
                }
            } catch (const std::exception& e) {
                std::cout << std::format("❌ Coefficients ({:.0e}, {:.0e}, ...) failed: {}\n", a0, a1, e.what());
            }
        }
    }
};

// Test de stress pour AudioBuffer
class AudioBufferStressTest {
public:
    static void runAllocationStressTest() {
        std::cout << "🔥 Running AudioBuffer Allocation Stress Test\n";

        std::vector<std::unique_ptr<AudioEqualizer::AudioBuffer>> buffers;

        for (size_t i = 0; i < TestConfig::RobustnessConfig::MEMORY_STRESS_ITERATIONS; ++i) {
            try {
                // Créer des buffers de différentes tailles
                size_t channels = 1 + (i % 8); // 1-8 canaux
                size_t samples = 64 * (1 + (i % 64)); // 64 à 4096 échantillons

                auto buffer = std::make_unique<AudioEqualizer::AudioBuffer>(channels, samples);

                // Remplir avec des données
                for (size_t ch = 0; ch < channels; ++ch) {
                    float* channel = buffer->getChannel(ch);
                    for (size_t s = 0; s < samples; ++s) {
                        channel[s] = static_cast<float>(std::sin(2.0 * M_PI * 440.0 * s / 44100.0));
                    }
                }

                // Effectuer quelques opérations
                buffer->applyGain(0.8f);
                buffer->clear();

                buffers.push_back(std::move(buffer));

                // Garder seulement les 10 derniers pour éviter une explosion mémoire
                if (buffers.size() > 10) {
                    buffers.erase(buffers.begin());
                }

            } catch (const std::exception& e) {
                std::cout << std::format("❌ Allocation stress test failed at iteration {}: {}\n", i, e.what());
                return;
            }
        }

        std::cout << "✅ Allocation stress test completed successfully\n";
    }

    static void runSIMDStressTest() {
        std::cout << "🔥 Running AudioBuffer SIMD Stress Test\n";

#ifdef __ARM_NEON
        std::cout << "  Using NEON SIMD\n";
#elif defined(__SSE2__)
        std::cout << "  Using SSE2 SIMD\n";
#else
        std::cout << "  No SIMD available\n";
#endif

        auto buffer = std::make_unique<AudioEqualizer::AudioBuffer>(2, 2048);

        // Remplir avec des données qui stressent les opérations SIMD
        for (size_t ch = 0; ch < buffer->getNumChannels(); ++ch) {
            float* channel = buffer->getChannel(ch);
            for (size_t i = 0; i < buffer->getNumSamples(); ++i) {
                channel[i] = static_cast<float>((i % 4) == 0 ? 1.0f : -1.0f); // Pattern stressant
            }
        }

        // Effectuer de nombreuses opérations SIMD
        for (size_t i = 0; i < 1000; ++i) {
            buffer->applyGain(1.1f);
            buffer->applyGain(0.9f);
            float magnitude = buffer->getMagnitude(0, 0, buffer->getNumSamples());
            float rms = buffer->getRMSLevel(1, 0, buffer->getNumSamples());
        }

        std::cout << "✅ SIMD stress test completed successfully\n";
    }
};

// Test de stress pour les effets audio
class AudioEffectsStressTest {
public:
    static void runParameterStressTest() {
        std::cout << "🔥 Running AudioEffects Parameter Stress Test\n";

        auto compressor = std::make_unique<AudioFX::CompressorEffect>();
        auto delay = std::make_unique<AudioFX::DelayEffect>();

        compressor->setSampleRate(44100, 1);
        delay->setSampleRate(44100, 1);

        auto input = TestSignalGenerator::generateWhiteNoise(1024, 0.5f);
        std::vector<float> output(1024);

        // Tester avec des paramètres extrêmes
        std::vector<std::tuple<double, double, double, double, double>> extremeCompressorParams = {
            {-80.0, 1.0, 0.1, 10.0, 0.0},    // Threshold très bas
            {0.0, 20.0, 50.0, 1000.0, 20.0},  // Compression extrême
            {-20.0, 3.0, 0.1, 1000.0, -20.0}  // Release très long
        };

        for (auto [threshold, ratio, attack, release, makeup] : extremeCompressorParams) {
            try {
                compressor->setParameters(threshold, ratio, attack, release, makeup);
                compressor->processMono(input.data(), output.data(), input.size());

                if (SignalValidator::validateSignal(output)) {
                    std::cout << std::format("✅ Compressor params ({:.0f}, {:.0f}, ...) OK\n", threshold, ratio);
                } else {
                    std::cout << std::format("❌ Compressor params ({:.0f}, {:.0f}, ...) produced invalid signal\n", threshold, ratio);
                }
            } catch (const std::exception& e) {
                std::cout << std::format("❌ Compressor params ({:.0f}, {:.0f}, ...) failed: {}\n", threshold, ratio, e.what());
            }
        }
    }

    static void runEffectChainStressTest() {
        std::cout << "🔥 Running EffectChain Stress Test\n";

        auto chain = std::make_unique<AudioFX::EffectChain>();
        chain->setSampleRate(44100, 1);
        chain->setEnabled(true);

        // Ajouter de nombreux effets
        const int numEffects = 10;
        for (int i = 0; i < numEffects; ++i) {
            auto compressor = chain->emplaceEffect<AudioFX::CompressorEffect>();
            compressor->setParameters(-20.0, 3.0, 10.0, 80.0, 2.0);
            compressor->setEnabled(true);
        }

        auto input = TestSignalGenerator::generateSineWave(1024, 1000.0, 44100, 0.1f);
        std::vector<float> output(1024);

        try {
            chain->processMono(std::span(input), std::span(output));

            if (SignalValidator::validateSignal(output)) {
                std::cout << std::format("✅ Effect chain with {} effects OK\n", numEffects);
            } else {
                std::cout << std::format("❌ Effect chain with {} effects produced invalid signal\n", numEffects);
            }
        } catch (const std::exception& e) {
            std::cout << std::format("❌ Effect chain with {} effects failed: {}\n", numEffects, e.what());
        }
    }
};

// Test de stress pour la réduction de bruit
class NoiseReductionStressTest {
public:
    static void runSNRStressTest() {
        std::cout << "🔥 Running NoiseReduction SNR Stress Test\n";

        auto reducer = std::make_unique<AudioNR::NoiseReducer>(44100, 1);

        // Tester avec différents rapports signal/bruit
        std::vector<double> snrLevels = {-20.0, -10.0, 0.0, 10.0, 20.0}; // dB

        for (double snr : snrLevels) {
            try {
                // Créer un signal avec le SNR spécifié
                auto cleanSignal = TestSignalGenerator::generateSineWave(2048, 1000.0, 44100, 0.5);
                double noiseAmplitude = 0.5 / std::pow(10.0, snr / 20.0);
                auto noise = TestSignalGenerator::generateWhiteNoise(2048, noiseAmplitude);

                std::vector<float> input(2048);
                for (size_t i = 0; i < 2048; ++i) {
                    input[i] = cleanSignal[i] + noise[i];
                }

                std::vector<float> output(2048);

                // Appliquer la réduction de bruit
                reducer->processMono(input.data(), output.data(), 2048);

                if (SignalValidator::validateSignal(output)) {
                    double outputSNR = SignalValidator::calculateSNR(cleanSignal, output);
                    std::cout << std::format("✅ SNR stress test {} dB: {:.1f} dB output SNR\n", snr, outputSNR);
                } else {
                    std::cout << std::format("❌ SNR stress test {} dB produced invalid signal\n", snr);
                }
            } catch (const std::exception& e) {
                std::cout << std::format("❌ SNR stress test {} dB failed: {}\n", snr, e.what());
            }
        }
    }
};

// Classe principale pour exécuter tous les tests de stress
class StressTestSuite {
public:
    static void runAllStressTests() {
        std::cout << "🎯 Running Complete Audio Stress Test Suite\n";
        std::cout << "===========================================\n\n";

        // AudioEqualizer stress tests
        AudioEqualizerStressTest::runExtremeParametersTest();
        AudioEqualizerStressTest::runBufferSizeStressTest();
        AudioEqualizerStressTest::runMemoryStressTest();
        AudioEqualizerStressTest::runConcurrentAccessTest();

        std::cout << "\n";

        // BiquadFilter stress tests
        BiquadFilterStressTest::runFilterTypeStressTest();
        BiquadFilterStressTest::runCoefficientStressTest();

        std::cout << "\n";

        // AudioBuffer stress tests
        AudioBufferStressTest::runAllocationStressTest();
        AudioBufferStressTest::runSIMDStressTest();

        std::cout << "\n";

        // AudioEffects stress tests
        AudioEffectsStressTest::runParameterStressTest();
        AudioEffectsStressTest::runEffectChainStressTest();

        std::cout << "\n";

        // NoiseReduction stress tests
        NoiseReductionStressTest::runSNRStressTest();

        std::cout << "\n🎯 All stress tests completed!\n";
    }
};

// Macros pour faciliter l'utilisation
#define RUN_STRESS_TEST(testFunction) { \
    try { \
        testFunction(); \
    } catch (const std::exception& e) { \
        std::cout << "❌ Stress test failed with exception: " << e.what() << "\n"; \
    } \
}

#define RUN_ALL_STRESS_TESTS() { \
    StressTestSuite::runAllStressTests(); \
}

} // namespace AudioTest
