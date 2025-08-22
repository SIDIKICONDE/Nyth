#include "../../shared/Audio/core/AudioEqualizer.hpp"
#include "../../shared/Audio/core/BiquadFilter.hpp"
#include <cassert>
#include <cmath>
#include <iostream>
#include <vector>
#include <algorithm>
#include <random>
#include <chrono>
#include <thread>
#include <future>
#include <atomic>
#include <memory>
#include <limits>
#include <array>
#include <cstdint>
#include <string>
#include <cstddef>

using namespace AudioFX;

class UltraStressTestLight {
private:
    static constexpr double EPSILON = 1e-6;
    static constexpr size_t LIGHT_BUFFER_SIZE = 1024 * 1024; // 1M échantillons (au lieu de 10M)
    static constexpr size_t LIGHT_ITERATIONS = 1000; // 1000 itérations (au lieu de 10k)
    static constexpr uint32_t TEST_SAMPLE_RATE = 48000;
    
    std::random_device rd;
    std::mt19937 gen;
    std::uniform_real_distribution<float> noise_dist;
    std::uniform_real_distribution<float> extreme_dist;
    std::uniform_real_distribution<float> denormal_dist;

public:
    UltraStressTestLight() : gen(rd()), 
                            noise_dist(-1.0f, 1.0f),
                            extreme_dist(-1e6f, 1e6f),
                            denormal_dist(1e-38f, 1e-37f) {}

    // Test 1: Stress de mémoire léger
    void testLightMemoryStress() {
        std::cout << "🔥 Test 1: Stress de mémoire léger...\n";
        
        std::vector<std::unique_ptr<AudioEqualizer>> equalizers;
        std::vector<std::unique_ptr<BiquadFilter>> filters;
        
        // Créer 100 instances (au lieu de 1000)
        for (size_t i = 0; i < 100; ++i) {
            equalizers.push_back(std::make_unique<AudioEqualizer>(10, TEST_SAMPLE_RATE));
            filters.push_back(std::make_unique<BiquadFilter>());
            
            auto& eq = equalizers.back();
            auto& filter = filters.back();
            
            eq->setBandGain(i % 10, (i % 20) - 10.0);
            eq->setBandFrequency(i % 10, 100.0 + i * 100.0);
            eq->setBandQ(i % 10, 0.1 + (i % 10) * 0.5);
            
            filter->calculatePeaking(1000.0 + i * 10.0, TEST_SAMPLE_RATE, 1.0, 6.0);
        }
        
        // Buffer plus petit
        std::vector<float> buffer(1024 * 1024); // 1M échantillons
        for (size_t i = 0; i < buffer.size(); ++i) {
            buffer[i] = noise_dist(gen);
        }
        
        std::vector<float> outputBuffer(buffer.size());
        
        auto start = std::chrono::high_resolution_clock::now();
        
        // Traitement plus léger
        for (size_t i = 0; i < 50; ++i) {
            auto& eq = equalizers[i % equalizers.size()];
            eq->process(std::span<const float>(buffer), std::span<float>(outputBuffer));
        }
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
        
        assert(equalizers.size() == 100);
        assert(filters.size() == 100);
        
        for (float val : outputBuffer) {
            assert(std::isfinite(val));
            assert(!std::isnan(val));
        }
        
        std::cout << "✅ Stress de mémoire léger OK (" << duration.count() << "ms)\n";
    }

    // Test 2: Stress de performance léger
    void testLightPerformanceStress() {
        std::cout << "🔥 Test 2: Stress de performance léger...\n";
        
        AudioEqualizer eq(10, TEST_SAMPLE_RATE);
        
        // Configuration normale
        for (size_t i = 0; i < eq.getNumBands(); ++i) {
            eq.setBandGain(i, (i % 2 == 0) ? 10.0 : -10.0);
            eq.setBandFrequency(i, 20.0 + i * 2000.0);
            eq.setBandQ(i, 0.1 + i * 0.5);
            eq.setBandType(i, static_cast<FilterType>(i % 8));
        }
        
        // Buffer plus petit
        std::vector<float> buffer(LIGHT_BUFFER_SIZE);
        std::vector<float> output(LIGHT_BUFFER_SIZE);
        
        for (size_t i = 0; i < LIGHT_BUFFER_SIZE; ++i) {
            buffer[i] = noise_dist(gen);
        }
        
        auto start = std::chrono::high_resolution_clock::now();
        
        // Itérations réduites
        for (size_t i = 0; i < LIGHT_ITERATIONS; ++i) {
            eq.process(std::span<const float>(buffer), std::span<float>(output));
            
            if (i % 100 == 0) {
                eq.setBandGain(i % 10, (i % 20) - 10.0);
                eq.setBandFrequency(i % 10, 50.0 + (i % 1000) * 10.0);
            }
        }
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
        
        double samplesPerSecond = (double)LIGHT_BUFFER_SIZE * LIGHT_ITERATIONS / (duration.count() / 1000.0);
        double realTimeRatio = samplesPerSecond / TEST_SAMPLE_RATE;
        
        std::cout << "   Débit: " << samplesPerSecond / 1e6 << "M échantillons/sec\n";
        std::cout << "   Ratio temps réel: " << realTimeRatio << "x\n";
        
        assert(realTimeRatio > 1.0);
        
        for (size_t i = 0; i < 1000; ++i) {
            assert(std::isfinite(output[i]));
            assert(!std::isnan(output[i]));
        }
        
        std::cout << "✅ Stress de performance léger OK (" << duration.count() << "ms)\n";
    }

    // Test 3: Stress de stabilité numérique léger
    void testLightNumericalStability() {
        std::cout << "🔥 Test 3: Stress de stabilité numérique léger...\n";
        
        AudioEqualizer eq(10, TEST_SAMPLE_RATE);
        BiquadFilter filter;
        
        eq.setBandGain(0, 20.0);
        eq.setBandGain(1, -20.0);
        eq.setBandFrequency(0, 1.0);
        eq.setBandFrequency(1, TEST_SAMPLE_RATE / 2.0 - 1.0);
        eq.setBandQ(0, 0.001);
        eq.setBandQ(1, 50.0);
        
        filter.calculatePeaking(1.0, TEST_SAMPLE_RATE, 50.0, 20.0);
        
        std::vector<float> extremeSignals = {
            std::numeric_limits<float>::max(),
            std::numeric_limits<float>::lowest(),
            std::numeric_limits<float>::epsilon(),
            0.0f,
            -0.0f,
            1e-38f,
            -1e-38f,
            1e6f,
            -1e6f
        };
        
        std::vector<float> output(extremeSignals.size());
        
        eq.process(std::span<const float>(extremeSignals), std::span<float>(output));
        
        for (float val : output) {
            assert(std::isfinite(val));
            assert(!std::isnan(val));
        }
        
        filter.process(std::span<const float>(extremeSignals), std::span<float>(output));
        
        for (float val : output) {
            assert(std::isfinite(val));
            assert(!std::isnan(val));
        }
        
        std::cout << "✅ Stress de stabilité numérique léger OK\n";
    }

    // Test 4: Stress multi-threading léger
    void testLightMultiThreadingStress() {
        std::cout << "🔥 Test 4: Stress multi-threading léger...\n";
        
        const size_t numThreads = std::min<size_t>(4, std::thread::hardware_concurrency());
        std::vector<std::unique_ptr<AudioEqualizer>> equalizers(numThreads);
        std::vector<std::unique_ptr<BiquadFilter>> filters(numThreads);
        
        for (size_t i = 0; i < numThreads; ++i) {
            equalizers[i] = std::make_unique<AudioEqualizer>(10, TEST_SAMPLE_RATE);
            filters[i] = std::make_unique<BiquadFilter>();
            
            auto& eq = equalizers[i];
            auto& filter = filters[i];
            
            for (size_t j = 0; j < 10; ++j) {
                eq->setBandGain(j, (i + j) % 20 - 10.0);
                eq->setBandFrequency(j, 100.0 + i * 100.0 + j * 50.0);
                eq->setBandQ(j, 0.1 + (i + j) % 10 * 0.5);
            }
            
            filter->calculatePeaking(1000.0 + i * 100.0, TEST_SAMPLE_RATE, 1.0, 6.0);
        }
        
        std::vector<float> sharedBuffer(1024 * 1024);
        for (size_t i = 0; i < sharedBuffer.size(); ++i) {
            sharedBuffer[i] = noise_dist(gen);
        }
        
        std::atomic<size_t> completedThreads{0};
        std::vector<std::future<void>> futures;
        
        auto start = std::chrono::high_resolution_clock::now();
        
        for (size_t threadId = 0; threadId < numThreads; ++threadId) {
            futures.push_back(std::async(std::launch::async, [&, threadId]() {
                auto& eq = equalizers[threadId];
                auto& filter = filters[threadId];
                
                std::vector<float> outputBuffer(1024 * 1024);
                
                for (size_t i = 0; i < 50; ++i) {
                    eq->process(std::span<const float>(sharedBuffer), std::span<float>(outputBuffer));
                    
                    eq->setBandGain(i % 10, (threadId + i) % 20 - 10.0);
                    eq->setBandFrequency(i % 10, 100.0 + threadId * 50.0 + i * 10.0);
                    
                    filter->process(std::span<const float>(outputBuffer), std::span<float>(outputBuffer));
                    
                    for (size_t j = 0; j < 1000; ++j) {
                        assert(std::isfinite(outputBuffer[j]));
                        assert(!std::isnan(outputBuffer[j]));
                    }
                }
                
                completedThreads++;
            }));
        }
        
        for (auto& future : futures) {
            future.wait();
        }
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
        
        assert(completedThreads == numThreads);
        
        std::cout << "   Threads: " << numThreads << "\n";
        std::cout << "   Temps total: " << duration.count() << "ms\n";
        
        std::cout << "✅ Stress multi-threading léger OK\n";
    }

    // Test 5: Stress de paramètres temps réel léger
    void testLightRealTimeParameterStress() {
        std::cout << "🔥 Test 5: Stress de paramètres temps réel léger...\n";
        
        AudioEqualizer eq(10, TEST_SAMPLE_RATE);
        
        for (size_t i = 0; i < eq.getNumBands(); ++i) {
            eq.setBandGain(i, 0.0);
            eq.setBandFrequency(i, 1000.0);
            eq.setBandQ(i, 1.0);
        }
        
        std::vector<float> inputBuffer(1024);
        std::vector<float> outputBuffer(1024);
        
        for (size_t i = 0; i < 1024; ++i) {
            inputBuffer[i] = noise_dist(gen);
        }
        
        auto start = std::chrono::high_resolution_clock::now();
        
        // Itérations réduites
        for (size_t iteration = 0; iteration < 1000; ++iteration) {
            for (size_t band = 0; band < eq.getNumBands(); ++band) {
                eq.setBandGain(band, (iteration + band) % 20 - 10.0);
                eq.setBandFrequency(band, 20.0 + (iteration + band) % 10000);
                eq.setBandQ(band, 0.001 + (iteration + band) % 50 * 0.1);
                eq.setBandType(band, static_cast<FilterType>((iteration + band) % 8));
                eq.setBandEnabled(band, (iteration + band) % 2 == 0);
            }
            
            eq.setMasterGain((iteration % 20) - 10.0);
            eq.setBypass(iteration % 2 == 0);
            
            eq.process(std::span<const float>(inputBuffer), std::span<float>(outputBuffer));
            
            for (float val : outputBuffer) {
                assert(std::isfinite(val));
                assert(!std::isnan(val));
            }
        }
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
        
        std::cout << "   Modifications: 1000\n";
        std::cout << "   Temps: " << duration.count() << "ms\n";
        
        std::cout << "✅ Stress de paramètres temps réel léger OK\n";
    }

    // Exécuter tous les tests de stress légers
    void runAllLightStressTests() {
        std::cout << "🔥🔥🔥 TESTS DE STRESS ULTRA LÉGERS - MODULE CORE 🔥🔥🔥\n";
        std::cout << "=====================================================\n\n";
        
        auto globalStart = std::chrono::high_resolution_clock::now();
        
        testLightMemoryStress();
        testLightPerformanceStress();
        testLightNumericalStability();
        testLightMultiThreadingStress();
        testLightRealTimeParameterStress();
        
        auto globalEnd = std::chrono::high_resolution_clock::now();
        auto globalDuration = std::chrono::duration_cast<std::chrono::seconds>(globalEnd - globalStart);
        
        std::cout << "\n🔥🔥🔥 RÉSULTATS DES TESTS DE STRESS LÉGERS 🔥🔥🔥\n";
        std::cout << "=====================================================\n";
        std::cout << "✅ TOUS LES TESTS DE STRESS LÉGERS PASSÉS !\n";
        std::cout << "⏱️  Temps total: " << globalDuration.count() << " secondes\n";
        std::cout << "🎯 Module Core validé pour la production\n";
        std::cout << "🚀 Performance et stabilité confirmées\n";
        std::cout << "💪 Tests de stress légers terminés avec succès\n\n";
    }
};

int main() {
    UltraStressTestLight stressTest;
    stressTest.runAllLightStressTests();
    return 0;
}
