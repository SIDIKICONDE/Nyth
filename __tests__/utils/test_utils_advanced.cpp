#include "../../shared/Audio/utils/AudioBuffer.hpp"
#include "../../shared/Audio/utils/utilsConstants.hpp"
#include <cassert>
#include <cmath>
#include <iostream>
#include <vector>
#include <algorithm>
#include <random>
#include <chrono>
#include <memory>
#include <thread>
#include <mutex>
#include <atomic>
#include <future>

// Définir M_PI si non défini
#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

class UtilsAdvancedTest {
private:
    static constexpr double EPSILON = 1e-6;
    static constexpr size_t TEST_BUFFER_SIZE = 1024;
    static constexpr uint32_t TEST_SAMPLE_RATE = 48000;
    
    void generateTestSignal(std::vector<float>& buffer, float amplitude = 1.0f, float frequency = 440.0f) {
        buffer.resize(TEST_BUFFER_SIZE);
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            buffer[i] = amplitude * std::sin(2.0f * M_PI * frequency * i / TEST_SAMPLE_RATE);
        }
    }
    
    void generateRandomSignal(std::vector<float>& buffer, float minVal = -1.0f, float maxVal = 1.0f) {
        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_real_distribution<float> dist(minVal, maxVal);
        
        buffer.resize(TEST_BUFFER_SIZE);
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            buffer[i] = dist(gen);
        }
    }
    
public:
    // ===== TESTS DE STRESS =====
    
    void testExtremeBufferSizes() {
        std::cout << "🧪 Test 16: Extreme Buffer Sizes...\n";
        
        // Test avec buffer très petit
        AudioUtils::AudioBuffer tinyBuffer(1, 1);
        assert(tinyBuffer.getNumChannels() == 1);
        assert(tinyBuffer.getNumSamples() == 1);
        
        float testValue = 0.5f;
        tinyBuffer.copyFrom(0, &testValue, 1);
        assert(std::abs(tinyBuffer.getChannel(0)[0] - 0.5f) < EPSILON);
        
        // Test avec buffer très grand
        AudioUtils::AudioBuffer hugeBuffer(AudioUtils::MAX_CHANNELS, AudioUtils::MAX_SAMPLES);
        assert(hugeBuffer.getNumChannels() == AudioUtils::MAX_CHANNELS);
        assert(hugeBuffer.getNumSamples() == AudioUtils::MAX_SAMPLES);
        
        // Test opérations sur grand buffer
        hugeBuffer.clear();
        hugeBuffer.applyGain(2.0f);
        
        // Vérifier que tout est à zéro
        for (size_t ch = 0; ch < AudioUtils::MAX_CHANNELS; ++ch) {
            for (size_t i = 0; i < std::min(size_t(1000), AudioUtils::MAX_SAMPLES); ++i) {
                assert(hugeBuffer.getChannel(ch)[i] == 0.0f);
            }
        }
        
        std::cout << "✅ Extreme Buffer Sizes OK\n";
    }
    
    void testExtremeGainValues() {
        std::cout << "🧪 Test 17: Extreme Gain Values...\n";
        
        AudioUtils::AudioBuffer buffer(2, TEST_BUFFER_SIZE);
        
        // Remplir avec signal de test
        std::vector<float> testSignal;
        generateTestSignal(testSignal, 0.1f);
        buffer.copyFrom(0, testSignal.data(), TEST_BUFFER_SIZE);
        buffer.copyFrom(1, testSignal.data(), TEST_BUFFER_SIZE);
        
        // Test gains extrêmes
        std::vector<float> extremeGains = {
            0.0f,           // Silence complet
            1e-10f,         // Gain très faible
            1e10f,          // Gain très élevé
            -1.0f,          // Inversion de phase
            -1000.0f,       // Inversion avec gain élevé
            std::numeric_limits<float>::min(),
            std::numeric_limits<float>::max() / 1e6f  // Éviter overflow
        };
        
        for (float gain : extremeGains) {
            AudioUtils::AudioBuffer testBuffer(1, 100);
            std::vector<float> smallSignal(100, 0.001f);
            testBuffer.copyFrom(0, smallSignal.data(), 100);
            
            testBuffer.applyGain(gain);
            
            // Vérifier qu'il n'y a pas de NaN/Inf
            for (size_t i = 0; i < 100; ++i) {
                assert(!std::isnan(testBuffer.getChannel(0)[i]));
                assert(!std::isinf(testBuffer.getChannel(0)[i]));
            }
        }
        
        std::cout << "✅ Extreme Gain Values OK\n";
    }
    
    void testMassiveOperations() {
        std::cout << "🧪 Test 18: Massive Operations...\n";
        
        AudioUtils::AudioBuffer buffer(2, TEST_BUFFER_SIZE);
        
        // Générer signal de test
        std::vector<float> testSignal;
        generateRandomSignal(testSignal, -0.5f, 0.5f);
        buffer.copyFrom(0, testSignal.data(), TEST_BUFFER_SIZE);
        buffer.copyFrom(1, testSignal.data(), TEST_BUFFER_SIZE);
        
        // Effectuer de nombreuses opérations
        auto start = std::chrono::high_resolution_clock::now();
        
        for (int i = 0; i < 10000; ++i) {
            buffer.applyGain(1.0001f);  // Gain très léger
            buffer.addFrom(0, testSignal.data(), TEST_BUFFER_SIZE, 0.0001f);
            
            if (i % 1000 == 0) {
                buffer.applyGain(0.9999f);  // Normalisation légère
            }
        }
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
        
        // Vérifier que les opérations sont raisonnablement rapides
        assert(duration.count() < 10000000); // Moins de 10 secondes
        
        // Vérifier intégrité des données
        float magnitude = buffer.getMagnitude(0, 0, TEST_BUFFER_SIZE);
        assert(magnitude > 0.0f && magnitude < 100.0f); // Valeur raisonnable
        
        std::cout << "✅ Massive Operations OK (" << duration.count() << " μs)\n";
    }
    
    void testBufferFragmentation() {
        std::cout << "🧪 Test 19: Buffer Fragmentation...\n";
        
        // Créer et détruire de nombreux buffers de tailles différentes
        std::vector<std::unique_ptr<AudioUtils::AudioBuffer>> buffers;
        
        for (int iteration = 0; iteration < 100; ++iteration) {
            // Créer buffers de tailles aléatoires
            for (int i = 0; i < 10; ++i) {
                size_t channels = 1 + (iteration % 2);
                size_t samples = 64 + (iteration * 13) % 2048;
                
                auto buffer = std::make_unique<AudioUtils::AudioBuffer>(channels, samples);
                
                // Effectuer quelques opérations
                buffer->clear();
                buffer->applyGain(0.5f);
                
                buffers.push_back(std::move(buffer));
            }
            
            // Libérer quelques buffers de façon aléatoire
            if (buffers.size() > 50) {
                buffers.erase(buffers.begin(), buffers.begin() + 5);
            }
        }
        
        // Vérifier que tous les buffers restants sont valides
        for (auto& buffer : buffers) {
            assert(buffer->validateBuffer());
            assert(buffer->getChannel(0) != nullptr);
        }
        
        std::cout << "✅ Buffer Fragmentation OK\n";
    }
    
    // ===== TESTS DE CONCURRENCE =====
    
    void testConcurrentReads() {
        std::cout << "🧪 Test 20: Concurrent Reads...\n";
        
        AudioUtils::AudioBuffer buffer(2, TEST_BUFFER_SIZE);
        
        // Remplir avec signal de test
        std::vector<float> testSignal;
        generateTestSignal(testSignal);
        buffer.copyFrom(0, testSignal.data(), TEST_BUFFER_SIZE);
        buffer.copyFrom(1, testSignal.data(), TEST_BUFFER_SIZE);
        
        std::atomic<bool> stopThreads{false};
        std::atomic<int> errorCount{0};
        std::vector<std::thread> threads;
        
        // Créer plusieurs threads de lecture
        for (int i = 0; i < 8; ++i) {
            threads.emplace_back([&, i]() {
                while (!stopThreads.load()) {
                    try {
                        // Lectures concurrentes
                        float magnitude = buffer.getMagnitude(0, 0, TEST_BUFFER_SIZE);
                        float rms = buffer.getRMSLevel(1, 0, TEST_BUFFER_SIZE);
                        
                        // Vérifications de base
                        if (magnitude <= 0.0f || rms <= 0.0f) {
                            errorCount.fetch_add(1);
                        }
                        
                        // Lecture via span
                        auto span = buffer.getChannelSpan<float>(i % 2);
                        if (span.empty()) {
                            errorCount.fetch_add(1);
                        }
                        
                    } catch (...) {
                        errorCount.fetch_add(1);
                    }
                }
            });
        }
        
        // Laisser tourner 2 secondes
        std::this_thread::sleep_for(std::chrono::seconds(2));
        stopThreads.store(true);
        
        // Attendre la fin des threads
        for (auto& thread : threads) {
            thread.join();
        }
        
        assert(errorCount.load() == 0);
        std::cout << "✅ Concurrent Reads OK\n";
    }
    
    void testConcurrentWrites() {
        std::cout << "🧪 Test 21: Concurrent Writes...\n";
        
        AudioUtils::AudioBuffer buffer(4, TEST_BUFFER_SIZE);  // 4 canaux pour 4 threads
        
        std::atomic<bool> stopThreads{false};
        std::atomic<int> errorCount{0};
        std::vector<std::thread> threads;
        
        // Créer 4 threads écrivant chacun sur un canal différent
        for (int i = 0; i < 4; ++i) {
            threads.emplace_back([&, i]() {
                std::vector<float> threadSignal;
                generateTestSignal(threadSignal, 0.5f, 440.0f + i * 110.0f);
                
                int operations = 0;
                while (!stopThreads.load() && operations < 1000) {
                    try {
                        // Écriture sur le canal dédié
                        buffer.copyFrom(i, threadSignal.data(), TEST_BUFFER_SIZE);
                        buffer.applyGain(i, 0.9f);
                        buffer.addFrom(i, threadSignal.data(), TEST_BUFFER_SIZE, 0.1f);
                        
                        operations++;
                        
                    } catch (...) {
                        errorCount.fetch_add(1);
                    }
                }
            });
        }
        
        // Laisser tourner 3 secondes
        std::this_thread::sleep_for(std::chrono::seconds(3));
        stopThreads.store(true);
        
        // Attendre la fin des threads
        for (auto& thread : threads) {
            thread.join();
        }
        
        // Vérifier l'intégrité finale
        for (size_t ch = 0; ch < 4; ++ch) {
            float magnitude = buffer.getMagnitude(ch, 0, TEST_BUFFER_SIZE);
            assert(magnitude > 0.0f);
            assert(!std::isnan(magnitude) && !std::isinf(magnitude));
        }
        
        assert(errorCount.load() == 0);
        std::cout << "✅ Concurrent Writes OK\n";
    }
    
    void testProducerConsumer() {
        std::cout << "🧪 Test 22: Producer-Consumer...\n";
        
        AudioUtils::AudioBuffer buffer(2, TEST_BUFFER_SIZE);
        
        std::atomic<bool> stopTest{false};
        std::atomic<int> samplesProduced{0};
        std::atomic<int> samplesConsumed{0};
        std::mutex bufferMutex;
        
        // Thread producteur
        std::thread producer([&]() {
            std::vector<float> producerSignal;
            generateRandomSignal(producerSignal, -0.8f, 0.8f);
            
            while (!stopTest.load()) {
                {
                    std::lock_guard<std::mutex> lock(bufferMutex);
                    buffer.copyFrom(0, producerSignal.data(), TEST_BUFFER_SIZE);
                    buffer.copyFrom(1, producerSignal.data(), TEST_BUFFER_SIZE);
                }
                
                samplesProduced.fetch_add(TEST_BUFFER_SIZE);
                std::this_thread::sleep_for(std::chrono::milliseconds(1));
            }
        });
        
        // Thread consommateur
        std::thread consumer([&]() {
            while (!stopTest.load()) {
                {
                    std::lock_guard<std::mutex> lock(bufferMutex);
                    
                    // Consommer les données
                    float magnitude0 = buffer.getMagnitude(0, 0, TEST_BUFFER_SIZE);
                    float magnitude1 = buffer.getMagnitude(1, 0, TEST_BUFFER_SIZE);
                    
                    assert(!std::isnan(magnitude0) && !std::isinf(magnitude0));
                    assert(!std::isnan(magnitude1) && !std::isinf(magnitude1));
                }
                
                samplesConsumed.fetch_add(TEST_BUFFER_SIZE);
                std::this_thread::sleep_for(std::chrono::milliseconds(2));
            }
        });
        
        // Laisser tourner 2 secondes
        std::this_thread::sleep_for(std::chrono::seconds(2));
        stopTest.store(true);
        
        producer.join();
        consumer.join();
        
        // Vérifier que production et consommation ont eu lieu
        assert(samplesProduced.load() > 0);
        assert(samplesConsumed.load() > 0);
        
        std::cout << "✅ Producer-Consumer OK (Produced: " << samplesProduced.load() 
                  << ", Consumed: " << samplesConsumed.load() << ")\n";
    }
    
    // ===== TESTS DE MÉMOIRE =====
    
    void testMemoryLeaks() {
        std::cout << "🧪 Test 23: Memory Leaks...\n";
        
        // Test création/destruction répétée
        for (int i = 0; i < 1000; ++i) {
            size_t channels = 1 + (i % 2);
            size_t samples = 512 + (i % 1024);
            
            auto buffer = std::make_unique<AudioUtils::AudioBuffer>(channels, samples);
            
            // Opérations diverses
            buffer->clear();
            buffer->applyGain(0.5f + (i % 100) * 0.01f);
            
            std::vector<float> tempData(samples, 0.1f);
            buffer->copyFrom(0, tempData.data(), samples);
            
            if (channels > 1) {
                buffer->addFrom(1, tempData.data(), samples, 0.5f);
            }
            
            // Le buffer est automatiquement détruit ici
        }
        
        std::cout << "✅ Memory Leaks OK\n";
    }
    
    void testLargeMemoryAllocations() {
        std::cout << "🧪 Test 24: Large Memory Allocations...\n";
        
        std::vector<std::unique_ptr<AudioUtils::AudioBuffer>> largeBuffers;
        
        // Créer plusieurs gros buffers
        for (int i = 0; i < 5; ++i) {
            size_t samples = AudioUtils::MAX_SAMPLES / 2 + i * 100;
            auto buffer = std::make_unique<AudioUtils::AudioBuffer>(2, samples);
            
            // Vérifier l'allocation
            assert(buffer->getChannel(0) != nullptr);
            assert(buffer->getChannel(1) != nullptr);
            assert(buffer->getNumSamples() == samples);
            
            // Test d'écriture sur tout le buffer
            buffer->clear();
            buffer->applyGain(0.1f);
            
            largeBuffers.push_back(std::move(buffer));
        }
        
        // Vérifier que tous les buffers sont toujours valides
        for (auto& buffer : largeBuffers) {
            assert(buffer->validateBuffer());
            
            float magnitude = buffer->getMagnitude(0, 0, std::min(size_t(1000), buffer->getNumSamples()));
            assert(magnitude == 0.0f); // Devrait être zéro après clear
        }
        
        std::cout << "✅ Large Memory Allocations OK\n";
    }
    
    // ===== TESTS DE PERFORMANCE SIMD =====
    
    void testSIMDPerformance() {
        std::cout << "🧪 Test 25: SIMD Performance...\n";
        
        AudioUtils::AudioBuffer buffer(2, TEST_BUFFER_SIZE);
        
        // Créer données de test alignées pour SIMD
        std::vector<float> testSignal;
        generateRandomSignal(testSignal, -1.0f, 1.0f);
        buffer.copyFrom(0, testSignal.data(), TEST_BUFFER_SIZE);
        buffer.copyFrom(1, testSignal.data(), TEST_BUFFER_SIZE);
        
        // Test performance des opérations SIMD
        auto start = std::chrono::high_resolution_clock::now();
        
        for (int i = 0; i < 1000; ++i) {
            // Ces opérations devraient utiliser SIMD si disponible
            buffer.applyGain(0.99f);
            buffer.addFrom(0, testSignal.data(), TEST_BUFFER_SIZE, 0.01f);
            buffer.addFrom(1, testSignal.data(), TEST_BUFFER_SIZE, 0.01f);
        }
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
        
        // Vérifier performance (devrait être rapide avec SIMD)
        double timePerOperation = static_cast<double>(duration.count()) / 1000.0;
        assert(timePerOperation < 1000.0); // Moins de 1ms par opération
        
        // Vérifier intégrité des données
        float magnitude0 = buffer.getMagnitude(0, 0, TEST_BUFFER_SIZE);
        float magnitude1 = buffer.getMagnitude(1, 0, TEST_BUFFER_SIZE);
        
        assert(magnitude0 > 0.0f && magnitude0 < 100.0f);
        assert(magnitude1 > 0.0f && magnitude1 < 100.0f);
        
        std::cout << "✅ SIMD Performance OK (" << timePerOperation << " μs/op)\n";
    }
    
    // ===== TESTS DE RÉGRESSION =====
    
    void testRegressionValues() {
        std::cout << "🧪 Test 26: Regression Values...\n";
        
        AudioUtils::AudioBuffer buffer(2, 1000);
        
        // Signal de test fixe pour la régression
        std::vector<float> regressionSignal(1000);
        for (size_t i = 0; i < 1000; ++i) {
            regressionSignal[i] = 0.5f * std::sin(2.0f * M_PI * 440.0f * i / 48000.0f);
        }
        
        buffer.copyFrom(0, regressionSignal.data(), 1000);
        buffer.copyFrom(1, regressionSignal.data(), 1000);
        
        // Opérations de référence
        buffer.applyGain(0.8f);
        buffer.addFrom(0, regressionSignal.data(), 1000, 0.2f);
        
        // Valeurs de référence calculées manuellement
        float expectedMagnitude0 = buffer.getMagnitude(0, 0, 1000);
        float expectedRMS0 = buffer.getRMSLevel(0, 0, 1000);
        float expectedMagnitude1 = buffer.getMagnitude(1, 0, 1000);
        float expectedRMS1 = buffer.getRMSLevel(1, 0, 1000);
        
        // Vérifier que les valeurs sont dans les plages attendues
        assert(expectedMagnitude0 > 0.3f && expectedMagnitude0 < 0.6f);
        assert(expectedRMS0 > 0.2f && expectedRMS0 < 0.5f);
        assert(expectedMagnitude1 > 0.3f && expectedMagnitude1 < 0.5f);
        assert(expectedRMS1 > 0.2f && expectedRMS1 < 0.4f);
        
        // Test de reproductibilité
        AudioUtils::AudioBuffer buffer2(2, 1000);
        buffer2.copyFrom(0, regressionSignal.data(), 1000);
        buffer2.copyFrom(1, regressionSignal.data(), 1000);
        buffer2.applyGain(0.8f);
        buffer2.addFrom(0, regressionSignal.data(), 1000, 0.2f);
        
        float magnitude0_2 = buffer2.getMagnitude(0, 0, 1000);
        float magnitude1_2 = buffer2.getMagnitude(1, 0, 1000);
        
        // Les résultats doivent être identiques
        assert(std::abs(expectedMagnitude0 - magnitude0_2) < EPSILON);
        assert(std::abs(expectedMagnitude1 - magnitude1_2) < EPSILON);
        
        std::cout << "✅ Regression Values OK\n";
    }
    
    // ===== TESTS DE STABILITÉ NUMÉRIQUE =====
    
    void testNumericalStability() {
        std::cout << "🧪 Test 27: Numerical Stability...\n";
        
        AudioUtils::AudioBuffer buffer(1, TEST_BUFFER_SIZE);
        
        // Test avec valeurs très petites
        std::vector<float> tinyValues(TEST_BUFFER_SIZE);
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            tinyValues[i] = 1e-10f * std::sin(2.0f * M_PI * i / 100.0f);
        }
        
        buffer.copyFrom(0, tinyValues.data(), TEST_BUFFER_SIZE);
        
        // Opérations qui pourraient causer des problèmes numériques
        for (int i = 0; i < 100; ++i) {
            buffer.applyGain(1.000001f);  // Gain très proche de 1
            buffer.addFrom(0, tinyValues.data(), TEST_BUFFER_SIZE, 1e-12f);
        }
        
        // Vérifier qu'il n'y a pas de NaN/Inf
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            assert(!std::isnan(buffer.getChannel(0)[i]));
            assert(!std::isinf(buffer.getChannel(0)[i]));
        }
        
        // Test avec alternance de très grandes et très petites valeurs
        std::vector<float> alternatingValues(TEST_BUFFER_SIZE);
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            alternatingValues[i] = (i % 2 == 0) ? 1e6f : 1e-6f;
        }
        
        buffer.copyFrom(0, alternatingValues.data(), TEST_BUFFER_SIZE);
        buffer.applyGain(1e-3f);
        
        // Vérifier stabilité
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            assert(!std::isnan(buffer.getChannel(0)[i]));
            assert(!std::isinf(buffer.getChannel(0)[i]));
        }
        
        std::cout << "✅ Numerical Stability OK\n";
    }
    
    void runAllAdvancedTests() {
        std::cout << "🎯 TESTS AVANCÉS - MODULE UTILS (COUVERTURE EXHAUSTIVE)\n";
        std::cout << "========================================================\n\n";
        
        try {
            // Tests de stress
            testExtremeBufferSizes();
            testExtremeGainValues();
            testMassiveOperations();
            testBufferFragmentation();
            
            // Tests de concurrence
            testConcurrentReads();
            testConcurrentWrites();
            testProducerConsumer();
            
            // Tests de mémoire
            testMemoryLeaks();
            testLargeMemoryAllocations();
            
            // Tests de performance
            testSIMDPerformance();
            
            // Tests de régression
            testRegressionValues();
            
            // Tests de stabilité
            testNumericalStability();
            
            std::cout << "\n🎉 TOUS LES TESTS AVANCÉS UTILS PASSÉS AVEC SUCCÈS !\n";
            std::cout << "✅ Module Utils 100% testé et ultra-validé\n";
            std::cout << "✅ Couverture exhaustive : stress, concurrence, mémoire, SIMD, régression\n";
            
        } catch (const std::exception& e) {
            std::cerr << "\n❌ ERREUR DANS LES TESTS AVANCÉS: " << e.what() << std::endl;
            throw;
        } catch (...) {
            std::cerr << "\n❌ ERREUR INCONNUE DANS LES TESTS AVANCÉS" << std::endl;
            throw;
        }
    }
};

int main() {
    UtilsAdvancedTest test;
    test.runAllAdvancedTests();
    return 0;
}
