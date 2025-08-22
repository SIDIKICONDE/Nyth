#include "../../shared/Audio/core/AudioEqualizer.hpp"
#include "../../shared/Audio/core/BiquadFilter.hpp"
#include <cassert>
#include <cmath>
#include <iostream>
#include <vector>
#include <random>
#include <chrono>
#include <cstddef>

using namespace AudioFX;

class BasicStressTest {
private:
    static constexpr uint32_t TEST_SAMPLE_RATE = 48000;
    std::random_device rd;
    std::mt19937 gen;
    std::uniform_real_distribution<float> noise_dist;

public:
    BasicStressTest() : gen(rd()), noise_dist(-0.5f, 0.5f) {}

    // Test 1: Test de base AudioEqualizer
    void testBasicAudioEqualizer() {
        std::cout << "Test 1: Test de base AudioEqualizer...\n";
        
        AudioEqualizer eq(10, TEST_SAMPLE_RATE);
        
        // Configuration simple
        for (size_t i = 0; i < eq.getNumBands(); ++i) {
            eq.setBandGain(i, 0.0);
            eq.setBandFrequency(i, 1000.0);
            eq.setBandQ(i, 1.0);
        }
        
        // Signal de test simple
        std::vector<float> input(1024);
        std::vector<float> output(1024);
        
        for (size_t i = 0; i < 1024; ++i) {
            input[i] = noise_dist(gen);
        }
        
        // Traitement
        eq.process(std::span<const float>(input), std::span<float>(output));
        
        // Vérification basique
        for (float val : output) {
            assert(std::isfinite(val));
            assert(!std::isnan(val));
        }
        
        std::cout << "✅ Test de base AudioEqualizer OK\n";
    }

    // Test 2: Test de base BiquadFilter
    void testBasicBiquadFilter() {
        std::cout << "Test 2: Test de base BiquadFilter...\n";
        
        BiquadFilter filter;
        filter.calculatePeaking(1000.0, TEST_SAMPLE_RATE, 1.0, 6.0);
        
        std::vector<float> input(1024);
        std::vector<float> output(1024);
        
        for (size_t i = 0; i < 1024; ++i) {
            input[i] = noise_dist(gen);
        }
        
        filter.process(std::span<const float>(input), std::span<float>(output));
        
        for (float val : output) {
            assert(std::isfinite(val));
            assert(!std::isnan(val));
        }
        
        std::cout << "✅ Test de base BiquadFilter OK\n";
    }

    // Test 3: Test de performance simple
    void testBasicPerformance() {
        std::cout << "Test 3: Test de performance simple...\n";
        
        AudioEqualizer eq(10, TEST_SAMPLE_RATE);
        
        std::vector<float> input(8192);
        std::vector<float> output(8192);
        
        for (size_t i = 0; i < 8192; ++i) {
            input[i] = noise_dist(gen);
        }
        
        auto start = std::chrono::high_resolution_clock::now();
        
        for (size_t i = 0; i < 100; ++i) {
            eq.process(std::span<const float>(input), std::span<float>(output));
        }
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
        
        std::cout << "   Temps: " << duration.count() << "ms\n";
        std::cout << "✅ Test de performance simple OK\n";
    }

    // Test 4: Test de paramètres
    void testBasicParameters() {
        std::cout << "Test 4: Test de paramètres...\n";
        
        AudioEqualizer eq(10, TEST_SAMPLE_RATE);
        
        // Test de modification des paramètres
        for (size_t i = 0; i < 10; ++i) {
            eq.setBandGain(i, 6.0);
            eq.setBandFrequency(i, 100.0 + i * 1000.0);
            eq.setBandQ(i, 0.5 + i * 0.5);
        }
        
        eq.setMasterGain(3.0);
        eq.setBypass(false);
        
        std::vector<float> input(1024);
        std::vector<float> output(1024);
        
        for (size_t i = 0; i < 1024; ++i) {
            input[i] = noise_dist(gen);
        }
        
        eq.process(std::span<const float>(input), std::span<float>(output));
        
        for (float val : output) {
            assert(std::isfinite(val));
            assert(!std::isnan(val));
        }
        
        std::cout << "✅ Test de paramètres OK\n";
    }

    // Test 5: Test d'intégration simple
    void testBasicIntegration() {
        std::cout << "Test 5: Test d'intégration simple...\n";
        
        AudioEqualizer eq(10, TEST_SAMPLE_RATE);
        BiquadFilter filter;
        
        // Configuration
        eq.setBandGain(0, 6.0);
        eq.setBandFrequency(0, 1000.0);
        eq.setBandQ(0, 1.0);
        
        filter.calculatePeaking(1000.0, TEST_SAMPLE_RATE, 1.0, 6.0);
        
        std::vector<float> input(1024);
        std::vector<float> temp(1024);
        std::vector<float> output(1024);
        
        for (size_t i = 0; i < 1024; ++i) {
            input[i] = noise_dist(gen);
        }
        
        // Cascade: AudioEqualizer -> BiquadFilter
        eq.process(std::span<const float>(input), std::span<float>(temp));
        filter.process(std::span<const float>(temp), std::span<float>(output));
        
        for (float val : output) {
            assert(std::isfinite(val));
            assert(!std::isnan(val));
        }
        
        std::cout << "✅ Test d'intégration simple OK\n";
    }

    void runAllBasicTests() {
        std::cout << "TESTS DE STRESS BASIQUES - MODULE CORE\n";
        std::cout << "=====================================\n\n";
        
        auto start = std::chrono::high_resolution_clock::now();
        
        testBasicAudioEqualizer();
        testBasicBiquadFilter();
        testBasicPerformance();
        testBasicParameters();
        testBasicIntegration();
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
        
        std::cout << "\nRÉSULTATS DES TESTS BASIQUES\n";
        std::cout << "============================\n";
        std::cout << "✅ TOUS LES TESTS BASIQUES PASSÉS !\n";
        std::cout << "⏱️  Temps total: " << duration.count() << "ms\n";
        std::cout << "🎯 Module Core fonctionnel\n";
        std::cout << "🚀 Prêt pour les tests avancés\n\n";
    }
};

int main() {
    BasicStressTest test;
    test.runAllBasicTests();
    return 0;
}
