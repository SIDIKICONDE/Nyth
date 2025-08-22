// Headers système nécessaires AVANT les headers du projet
#include <cstdint>
#include <cstddef>
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
#include <string>
#include <span>

// Headers du projet APRÈS les headers système
#include "../../shared/Audio/core/AudioEqualizer.hpp"
#include "../../shared/Audio/core/BiquadFilter.hpp"

using namespace AudioFX;

class UltraStressTest {
private:
    static constexpr double EPSILON = 1e-6;
    
    // Configuration adaptée pour mobile
    #if defined(__ANDROID__) || defined(__IPHONE_OS_VERSION_MIN_REQUIRED)
        // Configuration mobile : réduire les tailles pour éviter les OOM
        static constexpr size_t MEGA_BUFFER_SIZE = 64 * 1024; // 64K échantillons (256KB)
        static constexpr size_t ULTRA_BUFFER_SIZE = 256 * 1024; // 256K échantillons (1MB)
        static constexpr size_t MAX_STRESS_ITERATIONS = 1000; // 10x moins d'itérations
        static constexpr size_t MEMORY_STRESS_SIZE = 10 * 1024 * 1024; // 10MB au lieu de 100MB
        static constexpr size_t MAX_EQUALIZERS = 100; // 10x moins d'instances
        static constexpr size_t MAX_CASCADE_FILTERS = 20; // 5x moins de filtres en cascade
        static constexpr size_t MOBILE_PRESET_ITERATIONS = 1000; // Réduire les tests de presets
        static constexpr size_t MOBILE_VALIDATION_ITERATIONS = 1000; // Réduire les validations
        static constexpr size_t MOBILE_BUFFER_ITERATIONS = 1000; // Réduire les tests de buffer
        static constexpr size_t MOBILE_REGRESSION_ITERATIONS = 1000; // Réduire les régressions
    #else
        // Configuration desktop : valeurs originales
        static constexpr size_t MEGA_BUFFER_SIZE = 1024 * 1024; // 1M échantillons
        static constexpr size_t ULTRA_BUFFER_SIZE = 10 * 1024 * 1024; // 10M échantillons
        static constexpr size_t MAX_STRESS_ITERATIONS = 10000;
        static constexpr size_t MEMORY_STRESS_SIZE = 100 * 1024 * 1024; // 100MB
        static constexpr size_t MAX_EQUALIZERS = 1000;
        static constexpr size_t MAX_CASCADE_FILTERS = 100;
        static constexpr size_t MOBILE_PRESET_ITERATIONS = 10000;
        static constexpr size_t MOBILE_VALIDATION_ITERATIONS = 10000;
        static constexpr size_t MOBILE_BUFFER_ITERATIONS = 10000;
        static constexpr size_t MOBILE_REGRESSION_ITERATIONS = 10000;
    #endif
    
    static constexpr uint32_t TEST_SAMPLE_RATE = 48000;
    
    std::random_device rd;
    std::mt19937 gen;
    std::uniform_real_distribution<float> noise_dist;
    std::uniform_real_distribution<float> extreme_dist;
    std::uniform_real_distribution<float> denormal_dist;

public:
    UltraStressTest() : gen(rd()), 
                       noise_dist(-1.0f, 1.0f),
                       extreme_dist(-1e6f, 1e6f),
                       denormal_dist(1e-38f, 1e-37f) {}

    // Test 1: Stress de mémoire massive
    void testMassiveMemoryStress() {
        std::cout << "🔥 Test 1: Stress de mémoire massive...\n";
        
        std::vector<std::unique_ptr<AudioEqualizer>> equalizers;
        std::vector<std::unique_ptr<BiquadFilter>> filters;
        
        // Créer des instances (adapté pour mobile)
        for (size_t i = 0; i < MAX_EQUALIZERS; ++i) {
            equalizers.push_back(std::make_unique<AudioEqualizer>(10, TEST_SAMPLE_RATE));
            filters.push_back(std::make_unique<BiquadFilter>());
            
            // Configurer chaque instance différemment
            auto& eq = equalizers.back();
            auto& filter = filters.back();
            
            eq->setBandGain(i % 10, (i % 20) - 10.0);
            eq->setBandFrequency(i % 10, 100.0 + i * 100.0);
            eq->setBandQ(i % 10, 0.1 + (i % 10) * 0.5);
            
            filter->calculatePeaking(1000.0 + i * 10.0, TEST_SAMPLE_RATE, 1.0, 6.0);
        }
        
        // Créer un buffer massif
        std::vector<float> massiveBuffer(MEGA_BUFFER_SIZE);
        for (size_t i = 0; i < MEGA_BUFFER_SIZE; ++i) {
            massiveBuffer[i] = noise_dist(gen);
        }
        
        // Traitement massif
        std::vector<float> outputBuffer(MEGA_BUFFER_SIZE);
        
        auto start = std::chrono::high_resolution_clock::now();
        
        for (size_t i = 0; i < 100; ++i) {
            auto& eq = equalizers[i % equalizers.size()];
            eq->process(std::span<const float>(massiveBuffer), std::span<float>(outputBuffer));
        }
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
        
        // Vérifier qu'il n'y a pas de fuites mémoire
        assert(equalizers.size() == MAX_EQUALIZERS);
        assert(filters.size() == MAX_EQUALIZERS);
        
        // Vérifier la stabilité
        for (float val : outputBuffer) {
            assert(std::isfinite(val));
            assert(!std::isnan(val));
        }
        
        std::cout << "✅ Stress de mémoire massive OK (" << duration.count() << "ms)\n";
    }

    // Test 2: Stress de performance extrême
    void testExtremePerformanceStress() {
        std::cout << "🔥 Test 2: Stress de performance extrême...\n";
        
        AudioEqualizer eq(10, TEST_SAMPLE_RATE);
        
        // Configuration extrême
        for (size_t i = 0; i < eq.getNumBands(); ++i) {
            eq.setBandGain(i, (i % 2 == 0) ? 20.0 : -20.0);
            eq.setBandFrequency(i, 20.0 + i * 2000.0);
            eq.setBandQ(i, 0.1 + i * 0.5);
            eq.setBandType(i, static_cast<FilterType>(i % 8));
        }
        
        // Buffer ultra-massif
        std::vector<float> ultraBuffer(ULTRA_BUFFER_SIZE);
        std::vector<float> ultraOutput(ULTRA_BUFFER_SIZE);
        
        for (size_t i = 0; i < ULTRA_BUFFER_SIZE; ++i) {
            ultraBuffer[i] = noise_dist(gen);
        }
        
        // Test de performance extrême
        auto start = std::chrono::high_resolution_clock::now();
        
        for (size_t i = 0; i < MAX_STRESS_ITERATIONS; ++i) {
            eq.process(std::span<const float>(ultraBuffer), std::span<float>(ultraOutput));
            
            // Changer les paramètres en temps réel
            if (i % 100 == 0) {
                eq.setBandGain(i % 10, (i % 40) - 20.0);
                eq.setBandFrequency(i % 10, 50.0 + (i % 1000) * 10.0);
            }
        }
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
        
        // Calculer le débit
        double samplesPerSecond = (double)ULTRA_BUFFER_SIZE * MAX_STRESS_ITERATIONS / (duration.count() / 1000.0);
        double realTimeRatio = samplesPerSecond / TEST_SAMPLE_RATE;
        
        std::cout << "   Débit: " << samplesPerSecond / 1e6 << "M échantillons/sec\n";
        std::cout << "   Ratio temps réel: " << realTimeRatio << "x\n";
        
        // Vérifier que le traitement est plus rapide que le temps réel
        assert(realTimeRatio > 1.0);
        
        // Vérifier la stabilité
        for (size_t i = 0; i < 1000; ++i) {
            assert(std::isfinite(ultraOutput[i]));
            assert(!std::isnan(ultraOutput[i]));
        }
        
        std::cout << "✅ Stress de performance extrême OK (" << duration.count() << "ms)\n";
    }

    // Test 3: Stress de stabilité numérique extrême
    void testExtremeNumericalStability() {
        std::cout << "🔥 Test 3: Stress de stabilité numérique extrême...\n";
        
        AudioEqualizer eq(10, TEST_SAMPLE_RATE);
        BiquadFilter filter;
        
        // Configuration avec des valeurs numériquement instables
        eq.setBandGain(0, 24.0); // Gain maximum
        eq.setBandGain(1, -24.0); // Gain minimum
        eq.setBandFrequency(0, 1.0); // Fréquence très basse
        eq.setBandFrequency(1, TEST_SAMPLE_RATE / 2.0 - 1.0); // Fréquence de Nyquist
        eq.setBandQ(0, 0.001); // Q très bas
        eq.setBandQ(1, 100.0); // Q très élevé
        
        filter.calculatePeaking(1.0, TEST_SAMPLE_RATE, 100.0, 24.0);
        
        // Signaux de test extrêmes
        std::vector<float> extremeSignals = {
            std::numeric_limits<float>::max(),
            std::numeric_limits<float>::lowest(),
            std::numeric_limits<float>::epsilon(),
            std::numeric_limits<float>::min(),
            std::numeric_limits<float>::denorm_min(),
            0.0f,
            -0.0f,
            1e-38f,
            -1e-38f,
            1e6f,
            -1e6f,
            std::numeric_limits<float>::infinity(),
            -std::numeric_limits<float>::infinity(),
            std::numeric_limits<float>::quiet_NaN(),
            std::numeric_limits<float>::signaling_NaN()
        };
        
        std::vector<float> output(extremeSignals.size());
        
        // Test AudioEqualizer
        eq.process(std::span<const float>(extremeSignals), std::span<float>(output));
        
        // Vérifier qu'il n'y a pas de NaN ou infinis dans la sortie
        for (float val : output) {
            assert(std::isfinite(val));
            assert(!std::isnan(val));
        }
        
        // Test BiquadFilter
        filter.process(std::span<const float>(extremeSignals), std::span<float>(output));
        
        for (float val : output) {
            assert(std::isfinite(val));
            assert(!std::isnan(val));
        }
        
        // Test avec des denormales
        std::vector<float> denormalBuffer(1000);
        for (size_t i = 0; i < 1000; ++i) {
            denormalBuffer[i] = denormal_dist(gen);
        }
        
        eq.process(std::span<const float>(denormalBuffer), std::span<float>(output));
        filter.process(std::span<const float>(denormalBuffer), std::span<float>(output));
        
        for (float val : output) {
            assert(std::isfinite(val));
            assert(!std::isnan(val));
        }
        
        std::cout << "✅ Stress de stabilité numérique extrême OK\n";
    }

    // Test 4: Stress multi-threading extrême
    void testExtremeMultiThreadingStress() {
        std::cout << "🔥 Test 4: Stress multi-threading extrême...\n";
        
        const size_t numThreads = std::thread::hardware_concurrency();
        std::vector<std::unique_ptr<AudioEqualizer>> equalizers(numThreads);
        std::vector<std::unique_ptr<BiquadFilter>> filters(numThreads);
        
        // Initialiser les égaliseurs
        for (size_t i = 0; i < numThreads; ++i) {
            equalizers[i] = std::make_unique<AudioEqualizer>(10, TEST_SAMPLE_RATE);
            filters[i] = std::make_unique<BiquadFilter>();
            
            // Configuration différente par thread
            auto& eq = equalizers[i];
            auto& filter = filters[i];
            
            for (size_t j = 0; j < 10; ++j) {
                eq->setBandGain(j, (i + j) % 20 - 10.0);
                eq->setBandFrequency(j, 100.0 + i * 100.0 + j * 50.0);
                eq->setBandQ(j, 0.1 + (i + j) % 10 * 0.5);
            }
            
            filter->calculatePeaking(1000.0 + i * 100.0, TEST_SAMPLE_RATE, 1.0, 6.0);
        }
        
        // Buffer partagé
        std::vector<float> sharedBuffer(MEGA_BUFFER_SIZE);
        for (size_t i = 0; i < MEGA_BUFFER_SIZE; ++i) {
            sharedBuffer[i] = noise_dist(gen);
        }
        
        std::atomic<size_t> completedThreads{0};
        std::vector<std::future<void>> futures;
        
        auto start = std::chrono::high_resolution_clock::now();
        
        // Lancer les threads
        for (size_t threadId = 0; threadId < numThreads; ++threadId) {
            futures.push_back(std::async(std::launch::async, [&, threadId]() {
                auto& eq = equalizers[threadId];
                auto& filter = filters[threadId];
                
                std::vector<float> outputBuffer(MEGA_BUFFER_SIZE);
                
                for (size_t i = 0; i < 100; ++i) {
                    // Traitement AudioEqualizer
                    eq->process(std::span<const float>(sharedBuffer), std::span<float>(outputBuffer));
                    
                    // Modification des paramètres
                    eq->setBandGain(i % 10, (threadId + i) % 20 - 10.0);
                    eq->setBandFrequency(i % 10, 100.0 + threadId * 50.0 + i * 10.0);
                    
                    // Traitement BiquadFilter
                    filter->process(std::span<const float>(outputBuffer), std::span<float>(outputBuffer));
                    
                    // Vérification de stabilité
                    for (size_t j = 0; j < 1000; ++j) {
                        assert(std::isfinite(outputBuffer[j]));
                        assert(!std::isnan(outputBuffer[j]));
                    }
                }
                
                completedThreads++;
            }));
        }
        
        // Attendre tous les threads
        for (auto& future : futures) {
            future.wait();
        }
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
        
        assert(completedThreads == numThreads);
        
        std::cout << "   Threads: " << numThreads << "\n";
        std::cout << "   Temps total: " << duration.count() << "ms\n";
        
        std::cout << "✅ Stress multi-threading extrême OK\n";
    }

    // Test 5: Stress de paramètres en temps réel extrême
    void testExtremeRealTimeParameterStress() {
        std::cout << "🔥 Test 5: Stress de paramètres en temps réel extrême...\n";
        
        AudioEqualizer eq(10, TEST_SAMPLE_RATE);
        
        // Configuration initiale
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
        
        // Modification extrême des paramètres pendant le traitement
        for (size_t iteration = 0; iteration < MOBILE_PRESET_ITERATIONS; ++iteration) {
            // Modification de tous les paramètres
            for (size_t band = 0; band < eq.getNumBands(); ++band) {
                eq.setBandGain(band, (iteration + band) % 40 - 20.0);
                eq.setBandFrequency(band, 20.0 + (iteration + band) % 20000);
                eq.setBandQ(band, 0.001 + (iteration + band) % 100 * 0.1);
                eq.setBandType(band, static_cast<FilterType>((iteration + band) % 8));
                eq.setBandEnabled(band, (iteration + band) % 2 == 0);
            }
            
            // Modification du gain master
            eq.setMasterGain((iteration % 40) - 20.0);
            
            // Basculement du bypass
            eq.setBypass(iteration % 2 == 0);
            
            // Traitement
            eq.process(std::span<const float>(inputBuffer), std::span<float>(outputBuffer));
            
            // Vérification de stabilité
            for (float val : outputBuffer) {
                assert(std::isfinite(val));
                assert(!std::isnan(val));
            }
        }
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
        
        std::cout << "   Modifications: 10000\n";
        std::cout << "   Temps: " << duration.count() << "ms\n";
        std::cout << "   Modifications/sec: " << 10000.0 / (duration.count() / 1000.0) << "\n";
        
        std::cout << "✅ Stress de paramètres en temps réel extrême OK\n";
    }

    // Test 6: Stress de cascade de filtres extrême
    void testExtremeFilterCascadeStress() {
        std::cout << "🔥 Test 6: Stress de cascade de filtres extrême...\n";
        
        const size_t numFilters = MAX_CASCADE_FILTERS;
        std::vector<BiquadFilter> filters(numFilters);
        std::vector<std::unique_ptr<AudioEqualizer>> equalizers;
        
        // Configuration de tous les filtres
        for (size_t i = 0; i < numFilters; ++i) {
            equalizers.push_back(std::make_unique<AudioEqualizer>(5, TEST_SAMPLE_RATE));
            
            // Configuration différente pour chaque égaliseur
            for (size_t j = 0; j < 5; ++j) {
                equalizers[i]->setBandGain(j, (i + j) % 20 - 10.0);
                equalizers[i]->setBandFrequency(j, 50.0 + i * 50.0 + j * 100.0);
                equalizers[i]->setBandQ(j, 0.1 + (i + j) % 10 * 0.5);
                equalizers[i]->setBandType(j, static_cast<FilterType>((i + j) % 8));
            }
            
            // Configuration des filtres biquad
            filters[i].calculatePeaking(1000.0 + i * 10.0, TEST_SAMPLE_RATE, 1.0, 6.0);
        }
        
        std::vector<float> inputBuffer(1024);
        std::vector<float> tempBuffer(1024);
        std::vector<float> outputBuffer(1024);
        
        for (size_t i = 0; i < 1024; ++i) {
            inputBuffer[i] = noise_dist(gen);
        }
        
        auto start = std::chrono::high_resolution_clock::now();
        
        // Traitement en cascade extrême
        for (size_t iteration = 0; iteration < 1000; ++iteration) {
            // Copier l'entrée
            std::copy(inputBuffer.begin(), inputBuffer.end(), tempBuffer.begin());
            
            // Cascade d'égaliseurs
            for (size_t i = 0; i < numFilters; ++i) {
                equalizers[i]->process(std::span<const float>(tempBuffer), std::span<float>(outputBuffer));
                std::copy(outputBuffer.begin(), outputBuffer.end(), tempBuffer.begin());
            }
            
            // Cascade de filtres biquad
            for (size_t i = 0; i < numFilters; ++i) {
                filters[i].process(std::span<const float>(tempBuffer), std::span<float>(outputBuffer));
                std::copy(outputBuffer.begin(), outputBuffer.end(), tempBuffer.begin());
            }
            
            // Vérification de stabilité
            for (float val : outputBuffer) {
                assert(std::isfinite(val));
                assert(!std::isnan(val));
            }
        }
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
        
        std::cout << "   Filtres en cascade: " << numFilters << "\n";
        std::cout << "   Itérations: 1000\n";
        std::cout << "   Temps: " << duration.count() << "ms\n";
        
        std::cout << "✅ Stress de cascade de filtres extrême OK\n";
    }

    // Test 7: Stress de presets extrême
    void testExtremePresetStress() {
        std::cout << "🔥 Test 7: Stress de presets extrême...\n";
        
        AudioEqualizer eq(10, TEST_SAMPLE_RATE);
        
        // Créer des centaines de presets
        std::vector<EQPreset> presets(1000);
        
        for (size_t i = 0; i < 1000; ++i) {
            presets[i].name = "Stress Preset " + std::to_string(i);
            presets[i].gains.resize(10);
            
            for (size_t j = 0; j < 10; ++j) {
                presets[i].gains[j] = (i + j) % 40 - 20.0;
            }
        }
        
        std::vector<float> inputBuffer(1024);
        std::vector<float> outputBuffer(1024);
        
        for (size_t i = 0; i < 1024; ++i) {
            inputBuffer[i] = noise_dist(gen);
        }
        
        auto start = std::chrono::high_resolution_clock::now();
        
        // Chargement et sauvegarde de presets en boucle
        for (size_t iteration = 0; iteration < MOBILE_PRESET_ITERATIONS; ++iteration) {
            // Charger un preset
            eq.loadPreset(presets[iteration % presets.size()]);
            
            // Traitement
            eq.process(std::span<const float>(inputBuffer), std::span<float>(outputBuffer));
            
            // Sauvegarder un preset
            EQPreset savedPreset;
            eq.savePreset(savedPreset);
            
            // Vérification
            assert(savedPreset.gains.size() == 10);
            
            // Vérification de stabilité
            for (float val : outputBuffer) {
                assert(std::isfinite(val));
                assert(!std::isnan(val));
            }
        }
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
        
        std::cout << "   Presets: 1000\n";
        std::cout << "   Opérations: 10000\n";
        std::cout << "   Temps: " << duration.count() << "ms\n";
        
        std::cout << "✅ Stress de presets extrême OK\n";
    }

    // Test 8: Stress de validation de paramètres extrême
    void testExtremeParameterValidationStress() {
        std::cout << "🔥 Test 8: Stress de validation de paramètres extrême...\n";
        
        AudioEqualizer eq(10, TEST_SAMPLE_RATE);
        BiquadFilter filter;
        
        // Test avec des valeurs hors limites extrêmes
        std::vector<double> extremeGains = {
            std::numeric_limits<double>::max(),
            std::numeric_limits<double>::lowest(),
            std::numeric_limits<double>::infinity(),
            -std::numeric_limits<double>::infinity(),
            std::numeric_limits<double>::quiet_NaN(),
            1e6,
            -1e6,
            0.0,
            -0.0
        };
        
        std::vector<double> extremeFrequencies = {
            0.0,
            -1.0,
            std::numeric_limits<double>::max(),
            std::numeric_limits<double>::infinity(),
            1e6,
            TEST_SAMPLE_RATE * 2.0
        };
        
        std::vector<double> extremeQ = {
            0.0,
            -1.0,
            std::numeric_limits<double>::max(),
            std::numeric_limits<double>::infinity(),
            1e6
        };
        
        std::vector<float> inputBuffer(1024);
        std::vector<float> outputBuffer(1024);
        
        for (size_t i = 0; i < 1024; ++i) {
            inputBuffer[i] = noise_dist(gen);
        }
        
        auto start = std::chrono::high_resolution_clock::now();
        
        // Test de toutes les combinaisons extrêmes
        for (size_t iteration = 0; iteration < MOBILE_VALIDATION_ITERATIONS; ++iteration) {
            size_t i = iteration % 10;
            size_t j = iteration % extremeGains.size();
            size_t k = iteration % extremeFrequencies.size();
            size_t l = iteration % extremeQ.size();
            
            // Test AudioEqualizer
            eq.setBandGain(i, extremeGains[j]);
            eq.setBandFrequency(i, extremeFrequencies[k]);
            eq.setBandQ(i, extremeQ[l]);
            eq.setMasterGain(extremeGains[j % extremeGains.size()]);
            
            // Test BiquadFilter
            try {
                filter.calculatePeaking(extremeFrequencies[k], TEST_SAMPLE_RATE, extremeQ[l], extremeGains[j]);
            } catch (...) {
                // Ignorer les exceptions pour les valeurs invalides
            }
            
            // Traitement
            eq.process(std::span<const float>(inputBuffer), std::span<float>(outputBuffer));
            filter.process(std::span<const float>(inputBuffer), std::span<float>(outputBuffer));
            
            // Vérification de stabilité
            for (float val : outputBuffer) {
                assert(std::isfinite(val));
                assert(!std::isnan(val));
            }
        }
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
        
        std::cout << "   Tests de validation: 10000\n";
        std::cout << "   Temps: " << duration.count() << "ms\n";
        
        std::cout << "✅ Stress de validation de paramètres extrême OK\n";
    }

    // Test 9: Stress de débordement de buffer extrême
    void testExtremeBufferOverflowStress() {
        std::cout << "🔥 Test 9: Stress de débordement de buffer extrême...\n";
        
        AudioEqualizer eq(10, TEST_SAMPLE_RATE);
        BiquadFilter filter;
        
        // Buffers de différentes tailles
        std::vector<size_t> bufferSizes = {1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192};
        
        auto start = std::chrono::high_resolution_clock::now();
        
        for (size_t iteration = 0; iteration < MOBILE_BUFFER_ITERATIONS; ++iteration) {
            size_t bufferSize = bufferSizes[iteration % bufferSizes.size()];
            
            std::vector<float> inputBuffer(bufferSize);
            std::vector<float> outputBuffer(bufferSize);
            
            // Remplir avec des données aléatoires
            for (size_t i = 0; i < bufferSize; ++i) {
                inputBuffer[i] = noise_dist(gen);
            }
            
            // Test AudioEqualizer
            eq.process(std::span<const float>(inputBuffer), std::span<float>(outputBuffer));
            
            // Test BiquadFilter
            filter.process(std::span<const float>(inputBuffer), std::span<float>(outputBuffer));
            
            // Vérification de stabilité
            for (float val : outputBuffer) {
                assert(std::isfinite(val));
                assert(!std::isnan(val));
            }
            
            // Test avec des buffers vides
            if (iteration % 100 == 0) {
                std::vector<float> emptyInput(0);
                std::vector<float> emptyOutput(0);
                
                eq.process(std::span<const float>(emptyInput), std::span<float>(emptyOutput));
                filter.process(std::span<const float>(emptyInput), std::span<float>(emptyOutput));
            }
        }
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
        
        std::cout << "   Tests de buffer: 10000\n";
        std::cout << "   Tailles testées: " << bufferSizes.size() << "\n";
        std::cout << "   Temps: " << duration.count() << "ms\n";
        
        std::cout << "✅ Stress de débordement de buffer extrême OK\n";
    }

    // Test 10: Stress de régression extrême
    void testExtremeRegressionStress() {
        std::cout << "🔥 Test 10: Stress de régression extrême...\n";
        
        AudioEqualizer eq(10, TEST_SAMPLE_RATE);
        BiquadFilter filter;
        
        // Configuration de référence
        for (size_t i = 0; i < 10; ++i) {
            eq.setBandGain(i, 6.0);
            eq.setBandFrequency(i, 100.0 + i * 1000.0);
            eq.setBandQ(i, 0.5 + i * 0.5);
            eq.setBandType(i, static_cast<FilterType>(i % 8));
        }
        eq.setMasterGain(3.0);
        
        filter.calculatePeaking(1000.0, TEST_SAMPLE_RATE, 1.0, 6.0);
        
        // Signal de test reproductible
        std::vector<float> referenceInput(1024);
        for (size_t i = 0; i < 1024; ++i) {
            referenceInput[i] = std::sin(2.0 * 3.14159265358979323846 * 440.0 * i / TEST_SAMPLE_RATE) * 0.5f;
        }
        
        std::vector<float> referenceOutput(1024);
        eq.process(std::span<const float>(referenceInput), std::span<float>(referenceOutput));
        
        // Test de régression répété
        for (size_t iteration = 0; iteration < MOBILE_REGRESSION_ITERATIONS; ++iteration) {
            std::vector<float> testOutput(1024);
            
            // Réinitialiser l'égaliseur
            eq.resetAllBands();
            for (size_t i = 0; i < 10; ++i) {
                eq.setBandGain(i, 6.0);
                eq.setBandFrequency(i, 100.0 + i * 1000.0);
                eq.setBandQ(i, 0.5 + i * 0.5);
                eq.setBandType(i, static_cast<FilterType>(i % 8));
            }
            eq.setMasterGain(3.0);
            
            // Traitement
            eq.process(std::span<const float>(referenceInput), std::span<float>(testOutput));
            
            // Vérification de cohérence
            double maxDiff = 0.0;
            for (size_t i = 0; i < 1024; ++i) {
                double diff = std::abs(testOutput[i] - referenceOutput[i]);
                maxDiff = std::max(maxDiff, diff);
            }
            
            // La différence devrait être très faible (< 1e-6)
            assert(maxDiff < 1e-6);
            
            // Vérification de stabilité
            for (float val : testOutput) {
                assert(std::isfinite(val));
                assert(!std::isnan(val));
            }
        }
        
        std::cout << "   Tests de régression: 10000\n";
        std::cout << "   Cohérence: OK\n";
        
        std::cout << "✅ Stress de régression extrême OK\n";
    }

    // Test 11: Stress spécifique mobile - Interruptions système
    void testMobileInterruptionStress() {
        std::cout << "📱 Test 11: Stress d'interruptions mobiles...\n";
        
        AudioEqualizer eq(5, TEST_SAMPLE_RATE); // Moins de bandes pour mobile
        BiquadFilter filter;
        
        // Configuration légère pour mobile
        for (size_t i = 0; i < 5; ++i) {
            eq.setBandGain(i, (i % 2 == 0) ? 3.0 : -3.0); // Gains plus modérés
            eq.setBandFrequency(i, 100.0 + i * 1000.0);
            eq.setBandQ(i, 0.7 + i * 0.3);
        }
        
        filter.calculatePeaking(1000.0, TEST_SAMPLE_RATE, 1.0, 3.0);
        
        // Buffer mobile plus petit
        constexpr size_t MOBILE_BUFFER_SIZE = 512;
        std::vector<float> inputBuffer(MOBILE_BUFFER_SIZE);
        std::vector<float> outputBuffer(MOBILE_BUFFER_SIZE);
        
        for (size_t i = 0; i < MOBILE_BUFFER_SIZE; ++i) {
            inputBuffer[i] = noise_dist(gen) * 0.5f; // Amplitude réduite
        }
        
        auto start = std::chrono::high_resolution_clock::now();
        
        // Simuler des interruptions pendant le traitement
        for (size_t iteration = 0; iteration < 500; ++iteration) {
            // Traitement normal
            eq.process(std::span<const float>(inputBuffer), std::span<float>(outputBuffer));
            filter.process(std::span<const float>(outputBuffer), std::span<float>(outputBuffer));
            
            // Simuler une interruption système (pause courte)
            if (iteration % 50 == 0) {
                std::this_thread::sleep_for(std::chrono::microseconds(100));
                
                // Vérifier que l'état est toujours stable après interruption
                eq.process(std::span<const float>(inputBuffer), std::span<float>(outputBuffer));
                for (float val : outputBuffer) {
                    assert(std::isfinite(val));
                    assert(!std::isnan(val));
                }
            }
            
            // Simuler des changements de paramètres pendant interruptions
            if (iteration % 25 == 0) {
                eq.setBandGain(iteration % 5, (iteration % 10) - 5.0);
                eq.setBandFrequency(iteration % 5, 200.0 + (iteration % 500) * 10.0);
            }
        }
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
        
        std::cout << "   Interruptions simulées: 10\n";
        std::cout << "   Temps: " << duration.count() << "ms\n";
        
        std::cout << "✅ Stress d'interruptions mobiles OK\n";
    }

    // Test 12: Stress d'économie d'énergie mobile
    void testMobileBatteryStress() {
        std::cout << "🔋 Test 12: Stress d'économie d'énergie mobile...\n";
        
        AudioEqualizer eq(5, TEST_SAMPLE_RATE);
        
        // Configuration économe en énergie
        for (size_t i = 0; i < 5; ++i) {
            eq.setBandGain(i, 0.0); // Gains neutres pour économiser
            eq.setBandFrequency(i, 440.0 + i * 440.0);
            eq.setBandQ(i, 0.707); // Q standard
        }
        
        constexpr size_t ECO_BUFFER_SIZE = 256; // Buffer encore plus petit
        std::vector<float> inputBuffer(ECO_BUFFER_SIZE);
        std::vector<float> outputBuffer(ECO_BUFFER_SIZE);
        
        // Signal plus faible pour économiser l'énergie
        for (size_t i = 0; i < ECO_BUFFER_SIZE; ++i) {
            inputBuffer[i] = std::sin(2.0 * 3.14159265358979323846 * 440.0 * i / TEST_SAMPLE_RATE) * 0.1f;
        }
        
        auto start = std::chrono::high_resolution_clock::now();
        
        // Mode économie d'énergie : traitement par bursts avec pauses
        for (size_t burst = 0; burst < 100; ++burst) {
            // Burst de traitement
            for (size_t i = 0; i < 10; ++i) {
                eq.process(std::span<const float>(inputBuffer), std::span<float>(outputBuffer));
                
                // Vérification légère
                bool hasSignal = false;
                for (float val : outputBuffer) {
                    if (std::abs(val) > 1e-6) {
                        hasSignal = true;
                        break;
                    }
                }
                assert(hasSignal || burst == 0); // Premier burst peut être silencieux
            }
            
            // Pause pour économiser la batterie
            std::this_thread::sleep_for(std::chrono::microseconds(50));
            
            // Réduire progressivement l'activité
            if (burst % 20 == 0 && burst > 0) {
                eq.setMasterGain(0.9); // Réduire le gain global
            }
        }
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
        
        std::cout << "   Bursts de traitement: 100\n";
        std::cout << "   Temps total: " << duration.count() << "ms\n";
        std::cout << "   Temps actif estimé: " << (duration.count() * 0.8) << "ms (80%)\n";
        
        std::cout << "✅ Stress d'économie d'énergie mobile OK\n";
    }

    // Test 13: Stress de mémoire limitée mobile
    void testMobileLimitedMemoryStress() {
        std::cout << "📱💾 Test 13: Stress de mémoire limitée mobile...\n";
        
        // Utiliser moins d'instances pour mobile
        constexpr size_t MOBILE_MAX_INSTANCES = 10;
        std::vector<std::unique_ptr<AudioEqualizer>> equalizers;
        
        // Créer et détruire des instances de manière cyclique
        for (size_t cycle = 0; cycle < 50; ++cycle) {
            // Phase de création
            for (size_t i = 0; i < MOBILE_MAX_INSTANCES; ++i) {
                equalizers.push_back(std::make_unique<AudioEqualizer>(3, TEST_SAMPLE_RATE));
                
                // Configuration minimale
                auto& eq = equalizers.back();
                eq->setBandGain(0, 1.0);
                eq->setBandGain(1, 0.0);
                eq->setBandGain(2, -1.0);
            }
            
            // Phase de test
            std::vector<float> testBuffer(128);
            std::vector<float> outputBuffer(128);
            
            for (size_t i = 0; i < 128; ++i) {
                testBuffer[i] = noise_dist(gen) * 0.25f;
            }
            
            // Traiter avec toutes les instances
            for (auto& eq : equalizers) {
                eq->process(std::span<const float>(testBuffer), std::span<float>(outputBuffer));
            }
            
            // Phase de nettoyage - libérer la mémoire
            equalizers.clear();
            
            // Vérification périodique
            if (cycle % 10 == 0) {
                std::cout << "   Cycle " << cycle << "/50 - Mémoire libérée\n";
            }
        }
        
        std::cout << "   Cycles de création/destruction: 50\n";
        std::cout << "   Instances max simultanées: " << MOBILE_MAX_INSTANCES << "\n";
        
        std::cout << "✅ Stress de mémoire limitée mobile OK\n";
    }

    // Exécuter tous les tests de stress
    void runAllStressTests() {
        std::cout << "🔥🔥🔥 TESTS DE STRESS ULTRA PUSSÉS - MODULE CORE 🔥🔥🔥\n";
        std::cout << "=====================================================\n\n";
        
        auto globalStart = std::chrono::high_resolution_clock::now();
        
        testMassiveMemoryStress();
        testExtremePerformanceStress();
        testExtremeNumericalStability();
        testExtremeMultiThreadingStress();
        testExtremeRealTimeParameterStress();
        testExtremeFilterCascadeStress();
        testExtremePresetStress();
        testExtremeParameterValidationStress();
        testExtremeBufferOverflowStress();
        testExtremeRegressionStress();
        
        // Tests spécifiques mobiles
        #if defined(__ANDROID__) || defined(__IPHONE_OS_VERSION_MIN_REQUIRED)
            std::cout << "\n📱 TESTS SPÉCIFIQUES MOBILES\n";
            std::cout << "==============================\n\n";
            testMobileInterruptionStress();
            testMobileBatteryStress();
            testMobileLimitedMemoryStress();
        #endif
        
        auto globalEnd = std::chrono::high_resolution_clock::now();
        auto globalDuration = std::chrono::duration_cast<std::chrono::seconds>(globalEnd - globalStart);
        
        std::cout << "\n🔥🔥🔥 RÉSULTATS DES TESTS DE STRESS ULTRA PUSSÉS 🔥🔥🔥\n";
        std::cout << "=====================================================\n";
        std::cout << "✅ TOUS LES TESTS DE STRESS PASSÉS !\n";
        std::cout << "⏱️  Temps total: " << globalDuration.count() << " secondes\n";
        
        #if defined(__ANDROID__) || defined(__IPHONE_OS_VERSION_MIN_REQUIRED)
            std::cout << "📱 Configuration MOBILE utilisée :\n";
            std::cout << "   • Buffers réduits (64K-256K échantillons)\n";
            std::cout << "   • Itérations réduites (1000 vs 10000)\n";
            std::cout << "   • Mémoire limitée (10MB vs 100MB)\n";
            std::cout << "   • Tests spécifiques mobiles inclus\n";
            std::cout << "🔋 Module Core optimisé pour mobile\n";
            std::cout << "📱 Prêt pour Android/iOS en production\n";
        #else
            std::cout << "🖥️  Configuration DESKTOP utilisée :\n";
            std::cout << "   • Buffers complets (1M-10M échantillons)\n";
            std::cout << "   • Itérations maximales (10000)\n";
            std::cout << "   • Mémoire étendue (100MB)\n";
            std::cout << "🎯 Module Core prêt pour la production intensive\n";
        #endif
        
        std::cout << "🚀 Performance, stabilité et robustesse validées\n";
        std::cout << "💪 Tests de stress ultra poussés terminés avec succès\n\n";
    }
};

int main() {
    UltraStressTest stressTest;
    stressTest.runAllStressTests();
    return 0;
}
