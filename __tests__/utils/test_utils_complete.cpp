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

// Définir M_PI si non défini
#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

class UtilsTest {
private:
    static constexpr double EPSILON = 1e-6;
    static constexpr size_t TEST_BUFFER_SIZE = 1024;
    static constexpr uint32_t TEST_SAMPLE_RATE = 48000;
    
    void generateTestSignal(std::vector<float>& buffer) {
        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_real_distribution<float> dist(-1.0f, 1.0f);
        
        buffer.resize(TEST_BUFFER_SIZE);
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            buffer[i] = dist(gen);
        }
    }
    
public:
    void testConstants() {
        std::cout << "🧪 Test 1: Constants...\n";
        
        // Test des constantes de base
        assert(AudioUtils::MAX_CHANNELS == 2);
        assert(AudioUtils::MAX_SAMPLES == 4096);
        assert(AudioUtils::MIN_CHANNELS == 1);
        assert(AudioUtils::DEFAULT_BUFFER_SIZE == 1024);
        assert(AudioUtils::INVALID_BUFFER_SIZE == 0);
        
        // Test des constantes SIMD
        assert(AudioUtils::SIMD_ALIGNMENT_BYTES == 16);
        assert(AudioUtils::SIMD_ALIGNMENT_FLOATS == 4);
        assert(AudioUtils::SIMD_BLOCK_SIZE == 4);
        
        // Test des constantes mathématiques
        assert(AudioUtils::ZERO_FLOAT == 0.0f);
        assert(AudioUtils::UNITY_GAIN == 1.0f);
        assert(AudioUtils::EPSILON_FLOAT == 1e-7f);
        assert(std::abs(AudioUtils::SQRT_2 - 1.4142135623730951f) < EPSILON);
        assert(std::abs(AudioUtils::INV_SQRT_2 - 0.7071067811865476f) < EPSILON);
        
        // Test des constantes de performance
        assert(AudioUtils::CACHE_LINE_SIZE == 64);
        assert(AudioUtils::PREFETCH_DISTANCE == 64);
        assert(AudioUtils::UNROLL_FACTOR == 4);
        
        // Test des constantes temporelles
        assert(AudioUtils::SAMPLE_RATE_44100 == 44100.0);
        assert(AudioUtils::SAMPLE_RATE_48000 == 48000.0);
        assert(AudioUtils::SAMPLE_RATE_96000 == 96000.0);
        
        std::cout << "✅ Constants OK\n";
    }
    
    void testAudioBufferConstruction() {
        std::cout << "🧪 Test 2: AudioBuffer Construction...\n";
        
        // Test construction normale
        AudioUtils::AudioBuffer buffer(2, TEST_BUFFER_SIZE);
        assert(buffer.getNumChannels() == 2);
        assert(buffer.getNumSamples() == TEST_BUFFER_SIZE);
        
        // Test construction mono
        AudioUtils::AudioBuffer monoBuffer(1, 512);
        assert(monoBuffer.getNumChannels() == 1);
        assert(monoBuffer.getNumSamples() == 512);
        
        // Test que les pointeurs sont valides
        assert(buffer.getChannel(0) != nullptr);
        assert(buffer.getChannel(1) != nullptr);
        assert(monoBuffer.getChannel(0) != nullptr);
        
        // Test que les pointeurs de lecture sont valides
        assert(buffer.getArrayOfReadPointers() != nullptr);
        assert(monoBuffer.getArrayOfReadPointers() != nullptr);
        
        std::cout << "✅ AudioBuffer Construction OK\n";
    }
    
    void testAudioBufferClear() {
        std::cout << "🧪 Test 3: AudioBuffer Clear...\n";
        
        AudioUtils::AudioBuffer buffer(2, TEST_BUFFER_SIZE);
        
        // Remplir avec des données
        std::vector<float> testData(TEST_BUFFER_SIZE, 0.5f);
        buffer.copyFrom(0, testData.data(), TEST_BUFFER_SIZE);
        buffer.copyFrom(1, testData.data(), TEST_BUFFER_SIZE);
        
        // Vérifier que les données sont là
        assert(buffer.getChannel(0)[0] == 0.5f);
        assert(buffer.getChannel(1)[0] == 0.5f);
        
        // Clear complet
        buffer.clear();
        
        // Vérifier que tout est à zéro
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            assert(buffer.getChannel(0)[i] == 0.0f);
            assert(buffer.getChannel(1)[i] == 0.0f);
        }
        
        // Clear d'un canal spécifique
        buffer.copyFrom(0, testData.data(), TEST_BUFFER_SIZE);
        buffer.copyFrom(1, testData.data(), TEST_BUFFER_SIZE); // S'assurer que canal 1 a bien 0.5f
        buffer.clear(0);
        
        // Vérifier que seul le canal 0 est à zéro
        assert(buffer.getChannel(0)[0] == 0.0f);
        assert(buffer.getChannel(1)[0] == 0.5f);
        
        // Clear d'une portion
        buffer.copyFrom(0, testData.data(), TEST_BUFFER_SIZE);
        buffer.copyFrom(1, testData.data(), TEST_BUFFER_SIZE); // Remettre canal 1 à 0.5f
        buffer.clear(100, 200);
        
        // Vérifier que la portion est à zéro (de 100 à 299 inclus)
        for (size_t i = 100; i < 300 && i < TEST_BUFFER_SIZE; ++i) {
            assert(buffer.getChannel(0)[i] == 0.0f);
            assert(buffer.getChannel(1)[i] == 0.0f);
        }
        
        std::cout << "✅ AudioBuffer Clear OK\n";
    }
    
    void testAudioBufferCopy() {
        std::cout << "🧪 Test 4: AudioBuffer Copy...\n";
        
        AudioUtils::AudioBuffer source(2, TEST_BUFFER_SIZE);
        AudioUtils::AudioBuffer dest(2, TEST_BUFFER_SIZE);
        
        // Remplir la source avec des données
        std::vector<float> testData(TEST_BUFFER_SIZE);
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            testData[i] = static_cast<float>(i) / TEST_BUFFER_SIZE;
        }
        
        source.copyFrom(0, testData.data(), TEST_BUFFER_SIZE);
        source.copyFrom(1, testData.data(), TEST_BUFFER_SIZE);
        
        // Copy complète
        dest.copyFrom(source);
        
        // Vérifier que la copie est correcte
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            assert(std::abs(dest.getChannel(0)[i] - source.getChannel(0)[i]) < EPSILON);
            assert(std::abs(dest.getChannel(1)[i] - source.getChannel(1)[i]) < EPSILON);
        }
        
        // Copy d'un canal spécifique
        dest.clear();
        dest.copyFrom(0, source.getChannel(0), TEST_BUFFER_SIZE);
        
        // Vérifier que seul le canal 0 a été copié
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            assert(std::abs(dest.getChannel(0)[i] - source.getChannel(0)[i]) < EPSILON);
            assert(dest.getChannel(1)[i] == 0.0f);
        }
        
        // Copy avec offset
        dest.clear();
        dest.copyFrom(0, 100, source, 0, 0, 200);
        
        // Vérifier que la copie avec offset est correcte
        for (size_t i = 0; i < 200; ++i) {
            assert(std::abs(dest.getChannel(0)[i + 100] - source.getChannel(0)[i]) < EPSILON);
        }
        
        std::cout << "✅ AudioBuffer Copy OK\n";
    }
    
    void testAudioBufferAdd() {
        std::cout << "🧪 Test 5: AudioBuffer Add...\n";
        
        AudioUtils::AudioBuffer buffer(2, TEST_BUFFER_SIZE);
        
        // Remplir avec des données initiales
        std::vector<float> initialData(TEST_BUFFER_SIZE, 0.5f);
        buffer.copyFrom(0, initialData.data(), TEST_BUFFER_SIZE);
        buffer.copyFrom(1, initialData.data(), TEST_BUFFER_SIZE);
        
        // Données à ajouter
        std::vector<float> addData(TEST_BUFFER_SIZE, 0.3f);
        
        // Add avec gain par défaut (1.0)
        buffer.addFrom(0, addData.data(), TEST_BUFFER_SIZE);
        
        // Vérifier que l'addition est correcte (0.5 + 0.3 = 0.8)
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            assert(std::abs(buffer.getChannel(0)[i] - 0.8f) < EPSILON);
            assert(std::abs(buffer.getChannel(1)[i] - 0.5f) < EPSILON); // Canal 1 inchangé
        }
        
        // Add avec gain personnalisé
        buffer.addFrom(1, addData.data(), TEST_BUFFER_SIZE, 2.0f);
        
        // Vérifier que l'addition avec gain est correcte (0.5 + 0.3 * 2.0 = 1.1)
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            assert(std::abs(buffer.getChannel(1)[i] - 1.1f) < EPSILON);
        }
        
        // Test addFrom avec AudioBuffer
        AudioUtils::AudioBuffer source(2, TEST_BUFFER_SIZE);
        source.copyFrom(0, addData.data(), TEST_BUFFER_SIZE);
        source.copyFrom(1, addData.data(), TEST_BUFFER_SIZE);
        
        buffer.addFrom(source, 0.5f);
        
        // Vérifier que l'addition de buffer est correcte
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            // Canal 0: 0.8 + 0.3 * 0.5 = 0.95
            assert(std::abs(buffer.getChannel(0)[i] - 0.95f) < EPSILON);
            // Canal 1: 1.1 + 0.3 * 0.5 = 1.25
            assert(std::abs(buffer.getChannel(1)[i] - 1.25f) < EPSILON);
        }
        
        std::cout << "✅ AudioBuffer Add OK\n";
    }
    
    void testAudioBufferGain() {
        std::cout << "🧪 Test 6: AudioBuffer Gain...\n";
        
        AudioUtils::AudioBuffer buffer(2, TEST_BUFFER_SIZE);
        
        // Remplir avec des données
        std::vector<float> testData(TEST_BUFFER_SIZE, 0.5f);
        buffer.copyFrom(0, testData.data(), TEST_BUFFER_SIZE);
        buffer.copyFrom(1, testData.data(), TEST_BUFFER_SIZE);
        
        // Apply gain global
        buffer.applyGain(2.0f);
        
        // Vérifier que le gain global est appliqué
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            assert(std::abs(buffer.getChannel(0)[i] - 1.0f) < EPSILON);
            assert(std::abs(buffer.getChannel(1)[i] - 1.0f) < EPSILON);
        }
        
        // Apply gain sur un canal spécifique
        buffer.applyGain(0, 0.5f);
        
        // Vérifier que seul le canal 0 a été modifié
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            assert(std::abs(buffer.getChannel(0)[i] - 0.5f) < EPSILON);
            assert(std::abs(buffer.getChannel(1)[i] - 1.0f) < EPSILON);
        }
        
        // Apply gain sur une portion
        buffer.applyGain(1, 100, 200, 0.25f);
        
        // Vérifier que la portion a le bon gain
        for (size_t i = 100; i < 300; ++i) {
            assert(std::abs(buffer.getChannel(1)[i] - 0.25f) < EPSILON);
        }
        
        // Vérifier que le reste est inchangé
        assert(std::abs(buffer.getChannel(1)[0] - 1.0f) < EPSILON);
        assert(std::abs(buffer.getChannel(1)[400] - 1.0f) < EPSILON);
        
        std::cout << "✅ AudioBuffer Gain OK\n";
    }
    
    void testAudioBufferGainRamp() {
        std::cout << "🧪 Test 7: AudioBuffer Gain Ramp...\n";
        
        AudioUtils::AudioBuffer buffer(1, TEST_BUFFER_SIZE);
        
        // Remplir avec des données constantes
        std::vector<float> testData(TEST_BUFFER_SIZE, 1.0f);
        buffer.copyFrom(0, testData.data(), TEST_BUFFER_SIZE);
        
        // Apply gain ramp de 0.0 à 1.0
        buffer.applyGainRamp(0, 0, TEST_BUFFER_SIZE, 0.0f, 1.0f);
        
        // Vérifier que le ramp est correct
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            float expectedGain = static_cast<float>(i) / TEST_BUFFER_SIZE;
            assert(std::abs(buffer.getChannel(0)[i] - expectedGain) < 0.01f); // Tolérance plus large pour le ramp
        }
        
        // Vérifier les valeurs extrêmes
        assert(std::abs(buffer.getChannel(0)[0]) < 0.01f); // Début proche de 0
        assert(std::abs(buffer.getChannel(0)[TEST_BUFFER_SIZE - 1] - 1.0f) < 0.01f); // Fin proche de 1
        
        std::cout << "✅ AudioBuffer Gain Ramp OK\n";
    }
    
    void testAudioBufferMagnitude() {
        std::cout << "🧪 Test 8: AudioBuffer Magnitude...\n";
        
        AudioUtils::AudioBuffer buffer(2, TEST_BUFFER_SIZE);
        
        // Créer un signal avec une magnitude connue
        std::vector<float> testData(TEST_BUFFER_SIZE);
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            testData[i] = 0.5f * std::sin(2.0f * M_PI * 440.0f * i / TEST_SAMPLE_RATE);
        }
        
        buffer.copyFrom(0, testData.data(), TEST_BUFFER_SIZE);
        buffer.copyFrom(1, testData.data(), TEST_BUFFER_SIZE);
        
        // Test magnitude
        float magnitude = buffer.getMagnitude(0, 0, TEST_BUFFER_SIZE);
        assert(magnitude > 0.0f);
        assert(magnitude <= 0.5f); // Amplitude maximale du signal
        
        // Test RMS
        float rms = buffer.getRMSLevel(0, 0, TEST_BUFFER_SIZE);
        assert(rms > 0.0f);
        assert(rms < magnitude); // RMS est toujours inférieur ou égal à la magnitude
        
        // Test avec des valeurs négatives
        std::vector<float> negativeData(TEST_BUFFER_SIZE, -0.3f);
        buffer.copyFrom(0, negativeData.data(), TEST_BUFFER_SIZE);
        
        magnitude = buffer.getMagnitude(0, 0, TEST_BUFFER_SIZE);
        assert(std::abs(magnitude - 0.3f) < EPSILON);
        
        rms = buffer.getRMSLevel(0, 0, TEST_BUFFER_SIZE);
        assert(std::abs(rms - 0.3f) < EPSILON);
        
        std::cout << "✅ AudioBuffer Magnitude OK\n";
    }
    
    void testAudioBufferSpan() {
        std::cout << "🧪 Test 9: AudioBuffer Span...\n";
        
        AudioUtils::AudioBuffer buffer(2, TEST_BUFFER_SIZE);
        
        // Remplir avec des données
        std::vector<float> testData(TEST_BUFFER_SIZE);
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            testData[i] = static_cast<float>(i);
        }
        
        buffer.copyFrom(0, testData.data(), TEST_BUFFER_SIZE);
        buffer.copyFrom(1, testData.data(), TEST_BUFFER_SIZE);
        
        // Test getChannelSpan (méthodes de base sans templates)
        auto span0 = buffer.getChannelSpan<float>(0);
        auto span1 = buffer.getChannelSpan<float>(1);
        
        assert(span0.size() == TEST_BUFFER_SIZE);
        assert(span1.size() == TEST_BUFFER_SIZE);
        
        // Vérifier que les données sont accessibles via span
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            assert(std::abs(span0[i] - static_cast<float>(i)) < EPSILON);
            assert(std::abs(span1[i] - static_cast<float>(i)) < EPSILON);
        }
        
        // Test span const
        const AudioUtils::AudioBuffer& constBuffer = buffer;
        auto constSpan0 = constBuffer.getChannelSpan<float>(0);
        auto constSpan1 = constBuffer.getChannelSpan<float>(1);
        
        assert(constSpan0.size() == TEST_BUFFER_SIZE);
        assert(constSpan1.size() == TEST_BUFFER_SIZE);
        
        // Test copyFromSpan
        std::vector<float> newData(TEST_BUFFER_SIZE, 42.0f);
        std::span<const float> newDataSpan(newData);
        
        buffer.copyFromSpan<float>(0, newDataSpan);
        
        // Vérifier que la copie via span a fonctionné
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            assert(std::abs(buffer.getChannel(0)[i] - 42.0f) < EPSILON);
        }
        
        std::cout << "✅ AudioBuffer Span OK\n";
    }
    
    void testAudioBufferValidation() {
        std::cout << "🧪 Test 10: AudioBuffer Validation...\n";
        
        AudioUtils::AudioBuffer buffer(2, TEST_BUFFER_SIZE);
        
        // Test validation normale
        assert(buffer.validateBuffer());
        
        // Test debug info
        std::string debugInfo = buffer.getDebugInfo();
        assert(!debugInfo.empty());
        assert(debugInfo.find("channels: 2") != std::string::npos);
        assert(debugInfo.find("samples: 1024") != std::string::npos);
        
        // Test avec canal invalide
        assert(buffer.getChannel(2) == nullptr); // Canal inexistant
        assert(buffer.getChannel(999) == nullptr); // Canal très invalide
        
        // Test avec indices négatifs (via size_t, donc 0 sera le minimum)
        assert(buffer.getChannel(0) != nullptr); // Canal valide
        
        std::cout << "✅ AudioBuffer Validation OK\n";
    }
    
    void testAudioBufferPerformance() {
        std::cout << "🧪 Test 11: AudioBuffer Performance...\n";
        
        AudioUtils::AudioBuffer buffer(2, TEST_BUFFER_SIZE);
        
        // Remplir avec des données
        std::vector<float> testData(TEST_BUFFER_SIZE, 0.5f);
        buffer.copyFrom(0, testData.data(), TEST_BUFFER_SIZE);
        buffer.copyFrom(1, testData.data(), TEST_BUFFER_SIZE);
        
        // Test performance des opérations de base
        auto start = std::chrono::high_resolution_clock::now();
        
        for (int i = 0; i < 100; ++i) {
            buffer.applyGain(0.5f);
            buffer.addFrom(0, testData.data(), TEST_BUFFER_SIZE, 0.1f);
        }
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
        
        // Vérifier que la performance est raisonnable
        assert(duration.count() < 1000000); // Moins d'1 seconde
        
        std::cout << "✅ AudioBuffer Performance OK (" << duration.count() << " microseconds)\n";
    }
    
    void testAudioBufferStability() {
        std::cout << "🧪 Test 12: AudioBuffer Stability...\n";
        
        // Test avec des tailles extrêmes
        AudioUtils::AudioBuffer smallBuffer(1, 1);
        AudioUtils::AudioBuffer largeBuffer(2, AudioUtils::MAX_SAMPLES);
        
        assert(smallBuffer.getNumChannels() == 1);
        assert(smallBuffer.getNumSamples() == 1);
        assert(largeBuffer.getNumChannels() == 2);
        assert(largeBuffer.getNumSamples() == AudioUtils::MAX_SAMPLES);
        
        // Test avec des gains extrêmes
        AudioUtils::AudioBuffer buffer(1, 100);
        std::vector<float> testData(100, 0.1f);
        buffer.copyFrom(0, testData.data(), 100);
        
        // Gain très élevé
        buffer.applyGain(1000.0f);
        for (size_t i = 0; i < 100; ++i) {
            assert(!std::isnan(buffer.getChannel(0)[i]));
            assert(!std::isinf(buffer.getChannel(0)[i]));
        }
        
        // Gain très faible
        buffer.applyGain(0.0001f);
        for (size_t i = 0; i < 100; ++i) {
            assert(!std::isnan(buffer.getChannel(0)[i]));
            assert(!std::isinf(buffer.getChannel(0)[i]));
        }
        
        std::cout << "✅ AudioBuffer Stability OK\n";
    }
    
    void testAudioBufferIntegration() {
        std::cout << "🧪 Test 13: AudioBuffer Integration...\n";
        
        // Test d'intégration complexe
        AudioUtils::AudioBuffer source(2, TEST_BUFFER_SIZE);
        AudioUtils::AudioBuffer dest(2, TEST_BUFFER_SIZE);
        AudioUtils::AudioBuffer temp(2, TEST_BUFFER_SIZE);
        
        // Créer un signal complexe
        std::vector<float> complexData(TEST_BUFFER_SIZE);
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            complexData[i] = 0.3f * std::sin(2.0f * M_PI * 440.0f * i / TEST_SAMPLE_RATE) +
                            0.2f * std::sin(2.0f * M_PI * 880.0f * i / TEST_SAMPLE_RATE);
        }
        
        source.copyFrom(0, complexData.data(), TEST_BUFFER_SIZE);
        source.copyFrom(1, complexData.data(), TEST_BUFFER_SIZE);
        
        // Opérations complexes
        dest.copyFrom(source);
        dest.applyGain(0.5f);
        dest.addFrom(source, 0.25f);
        dest.applyGainRamp(0, 0, TEST_BUFFER_SIZE / 2, 0.0f, 1.0f);
        dest.applyGainRamp(0, TEST_BUFFER_SIZE / 2, TEST_BUFFER_SIZE / 2, 1.0f, 0.0f);
        
        // Vérifier que le résultat est cohérent
        float magnitude = dest.getMagnitude(0, 0, TEST_BUFFER_SIZE);
        float rms = dest.getRMSLevel(0, 0, TEST_BUFFER_SIZE);
        
        assert(magnitude > 0.0f);
        assert(rms > 0.0f);
        assert(rms <= magnitude);
        
        // Vérifier qu'il n'y a pas de NaN/Inf
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            assert(!std::isnan(dest.getChannel(0)[i]));
            assert(!std::isinf(dest.getChannel(0)[i]));
            assert(!std::isnan(dest.getChannel(1)[i]));
            assert(!std::isinf(dest.getChannel(1)[i]));
        }
        
        std::cout << "✅ AudioBuffer Integration OK\n";
    }
    
    void testAudioBufferMoveSemantics() {
        std::cout << "🧪 Test 14: AudioBuffer Move Semantics...\n";
        
        // Test move constructor
        AudioUtils::AudioBuffer original(2, TEST_BUFFER_SIZE);
        std::vector<float> testData(TEST_BUFFER_SIZE, 0.5f);
        original.copyFrom(0, testData.data(), TEST_BUFFER_SIZE);
        original.copyFrom(1, testData.data(), TEST_BUFFER_SIZE);
        
        AudioUtils::AudioBuffer moved(std::move(original));
        
        // Vérifier que le buffer déplacé a les bonnes données
        assert(moved.getNumChannels() == 2);
        assert(moved.getNumSamples() == TEST_BUFFER_SIZE);
        
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            assert(std::abs(moved.getChannel(0)[i] - 0.5f) < EPSILON);
            assert(std::abs(moved.getChannel(1)[i] - 0.5f) < EPSILON);
        }
        
        // Test move assignment
        AudioUtils::AudioBuffer assigned(1, 100);
        assigned = std::move(moved);
        
        assert(assigned.getNumChannels() == 2);
        assert(assigned.getNumSamples() == TEST_BUFFER_SIZE);
        
        for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
            assert(std::abs(assigned.getChannel(0)[i] - 0.5f) < EPSILON);
            assert(std::abs(assigned.getChannel(1)[i] - 0.5f) < EPSILON);
        }
        
        std::cout << "✅ AudioBuffer Move Semantics OK\n";
    }
    
    void testAudioBufferRangeOperations() {
        std::cout << "🧪 Test 15: AudioBuffer Range Operations...\n";
        
        AudioUtils::AudioBuffer buffer(2, TEST_BUFFER_SIZE);
        
        // Remplir avec des données
        std::vector<float> testData(TEST_BUFFER_SIZE, 0.5f);
        buffer.copyFrom(0, testData.data(), TEST_BUFFER_SIZE);
        buffer.copyFrom(1, testData.data(), TEST_BUFFER_SIZE);
        
        // Test range access (simplifié)
        for (size_t ch = 0; ch < buffer.getNumChannels(); ++ch) {
            auto channelSpan = buffer.getChannelSpan<float>(ch);
            assert(channelSpan.size() == TEST_BUFFER_SIZE);
            
            // Vérifier que les données sont accessibles
            for (size_t i = 0; i < std::min(size_t(100), TEST_BUFFER_SIZE); ++i) {
                assert(std::abs(channelSpan[i] - 0.5f) < EPSILON);
            }
        }
        
        std::cout << "✅ AudioBuffer Range Operations OK\n";
    }
    
    void runAllTests() {
        std::cout << "🎯 TESTS UNITAIRES - MODULE UTILS (QUALITÉ PRODUCTION)\n";
        std::cout << "=====================================================\n\n";
        
        try {
            testConstants();
            testAudioBufferConstruction();
            testAudioBufferClear();
            testAudioBufferCopy();
            testAudioBufferAdd();
            testAudioBufferGain();
            testAudioBufferGainRamp();
            testAudioBufferMagnitude();
            testAudioBufferSpan();
            testAudioBufferValidation();
            testAudioBufferPerformance();
            testAudioBufferStability();
            testAudioBufferIntegration();
            testAudioBufferMoveSemantics();
            testAudioBufferRangeOperations();
            
            std::cout << "\n🎉 TOUS LES TESTS UTILS PASSÉS AVEC SUCCÈS !\n";
            std::cout << "✅ Module Utils prêt pour la production\n";
            
        } catch (const std::exception& e) {
            std::cerr << "\n❌ ERREUR DANS LES TESTS: " << e.what() << std::endl;
            throw;
        } catch (...) {
            std::cerr << "\n❌ ERREUR INCONNUE DANS LES TESTS" << std::endl;
            throw;
        }
    }
};

int main() {
    UtilsTest test;
    test.runAllTests();
    return 0;
}
