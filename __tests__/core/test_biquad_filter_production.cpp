#include "../../shared/Audio/core/BiquadFilter.hpp"
#include "../../shared/Audio/core/AudioEqualizer.hpp"
#include <cassert>
#include <cmath>
#include <iostream>
#include <vector>
#include <algorithm>
#include <random>
#include <chrono>

using namespace AudioEqualizer;

class BiquadFilterTest {
private:
    static constexpr double EPSILON = 1e-6;
    static constexpr size_t TEST_BUFFER_SIZE = 1024;
    static constexpr uint32_t TEST_SAMPLE_RATE = 48000;
    
    std::random_device rd;
    std::mt19937 gen;
    std::uniform_real_distribution<float> noise_dist;

public:
    BiquadFilterTest() : gen(rd()), noise_dist(-1.0f, 1.0f) {}

    // Test 1: Construction et initialisation
    void testConstruction() {
        std::cout << "🧪 Test 1: Construction et initialisation...\n";
        
        // Test constructeur par défaut
        {
            BiquadFilter filter;
            double a0, a1, a2, b0, b1, b2;
            filter.getCoefficients(a0, a1, a2, b0, b1, b2);
            
            assert(std::abs(a0 - DEFAULT_A0) < EPSILON);
            assert(std::abs(a1 - DEFAULT_COEFFICIENT) < EPSILON);
            assert(std::abs(a2 - DEFAULT_COEFFICIENT) < EPSILON);
            assert(std::abs(b0 - UNITY_COEFFICIENT) < EPSILON);
            assert(std::abs(b1 - DEFAULT_COEFFICIENT) < EPSILON);
            assert(std::abs(b2 - DEFAULT_COEFFICIENT) < EPSILON);
        }
        
        std::cout << "✅ Construction et initialisation OK\n";
    }

    // Test 2: Configuration manuelle des coefficients
    void testManualCoefficientSetting() {
        std::cout << "🧪 Test 2: Configuration manuelle des coefficients...\n";
        
        BiquadFilter filter;
        
        // Test coefficients valides
        double test_a0 = 0.5, test_a1 = 0.3, test_a2 = 0.2;
        double test_b0 = 1.0, test_b1 = -0.8, test_b2 = 0.6;
        
        filter.setCoefficients(test_a0, test_a1, test_a2, test_b0, test_b1, test_b2);
        
        double a0, a1, a2, b0, b1, b2;
        filter.getCoefficients(a0, a1, a2, b0, b1, b2);
        
        // Les coefficients a sont normalisés par b0
        assert(std::abs(a0 - test_a0/test_b0) < EPSILON);
        assert(std::abs(a1 - test_a1/test_b0) < EPSILON);
        assert(std::abs(a2 - test_a2/test_b0) < EPSILON);
        assert(std::abs(b0 - UNITY_COEFFICIENT) < EPSILON);
        assert(std::abs(b1 - test_b1/test_b0) < EPSILON);
        assert(std::abs(b2 - test_b2/test_b0) < EPSILON);
        
        // Test avec b0 = 0 (devrait être géré)
        filter.setCoefficients(1.0, 0.5, 0.3, 0.0, 0.2, 0.1);
        filter.getCoefficients(a0, a1, a2, b0, b1, b2);
        
        // Vérifier que les coefficients sont finis
        assert(std::isfinite(a0));
        assert(std::isfinite(a1));
        assert(std::isfinite(a2));
        
        std::cout << "✅ Configuration manuelle des coefficients OK\n";
    }

    // Test 3: Calcul des filtres passe-bas
    void testLowpassCalculation() {
        std::cout << "🧪 Test 3: Calcul des filtres passe-bas...\n";
        
        BiquadFilter filter;
        
        // Test différentes fréquences et Q
        std::vector<std::tuple<double, double, double>> testCases = {
            {100.0, 0.707, 48000.0},   // Fréquence basse, Q normal
            {1000.0, 1.0, 44100.0},    // Fréquence moyenne, Q élevé
            {5000.0, 0.5, 96000.0},    // Fréquence haute, Q bas
            {TEST_SAMPLE_RATE/4.0, 2.0, TEST_SAMPLE_RATE}  // Fréquence critique
        };
        
        for (const auto& [freq, q, sampleRate] : testCases) {
            filter.calculateLowpass(freq, sampleRate, q);
            
            double a0, a1, a2, b0, b1, b2;
            filter.getCoefficients(a0, a1, a2, b0, b1, b2);
            
            // Pour un passe-bas, a0 et a2 devraient être positifs et égaux
            assert(a0 > 0.0);
            assert(a2 > 0.0);
            assert(std::abs(a0 - a2) < EPSILON);
            
            // Vérifier la stabilité (pôles dans le cercle unité)
            assert(std::abs(b1) < 2.0);
            assert(std::abs(b2) < 1.0);
        }
        
        std::cout << "✅ Calcul des filtres passe-bas OK\n";
    }

    // Test 4: Calcul des filtres passe-haut
    void testHighpassCalculation() {
        std::cout << "🧪 Test 4: Calcul des filtres passe-haut...\n";
        
        BiquadFilter filter;
        
        std::vector<std::tuple<double, double, double>> testCases = {
            {100.0, 0.707, 48000.0},
            {1000.0, 1.0, 44100.0},
            {5000.0, 0.5, 96000.0},
            {TEST_SAMPLE_RATE/4.0, 2.0, TEST_SAMPLE_RATE}
        };
        
        for (const auto& [freq, q, sampleRate] : testCases) {
            filter.calculateHighpass(freq, sampleRate, q);
            
            double a0, a1, a2, b0, b1, b2;
            filter.getCoefficients(a0, a1, a2, b0, b1, b2);
            
            // Pour un passe-haut, a0 et a2 devraient être positifs et égaux
            assert(a0 > 0.0);
            assert(a2 > 0.0);
            assert(std::abs(a0 - a2) < EPSILON);
            assert(a1 < 0.0); // a1 négatif pour passe-haut
            
            // Vérifier la stabilité
            assert(std::abs(b1) < 2.0);
            assert(std::abs(b2) < 1.0);
        }
        
        std::cout << "✅ Calcul des filtres passe-haut OK\n";
    }

    // Test 5: Calcul des filtres passe-bande
    void testBandpassCalculation() {
        std::cout << "🧪 Test 5: Calcul des filtres passe-bande...\n";
        
        BiquadFilter filter;
        
        std::vector<std::tuple<double, double, double>> testCases = {
            {500.0, 1.0, 48000.0},
            {2000.0, 2.0, 44100.0},
            {8000.0, 0.5, 96000.0}
        };
        
        for (const auto& [freq, q, sampleRate] : testCases) {
            filter.calculateBandpass(freq, sampleRate, q);
            
            double a0, a1, a2, b0, b1, b2;
            filter.getCoefficients(a0, a1, a2, b0, b1, b2);
            
            // Pour un passe-bande, a0 > 0, a1 ≈ 0, a2 < 0
            assert(a0 > 0.0);
            assert(std::abs(a1) < 1e-3);
            assert(a2 < 0.0);
            
            // Vérifier la stabilité
            assert(std::abs(b1) < 2.0);
            assert(std::abs(b2) < 1.0);
        }
        
        std::cout << "✅ Calcul des filtres passe-bande OK\n";
    }

    // Test 6: Calcul des filtres notch
    void testNotchCalculation() {
        std::cout << "🧪 Test 6: Calcul des filtres notch...\n";
        
        BiquadFilter filter;
        
        std::vector<std::tuple<double, double, double>> testCases = {
            {1000.0, 1.0, 48000.0},
            {5000.0, 2.0, 44100.0}
        };
        
        for (const auto& [freq, q, sampleRate] : testCases) {
            filter.calculateNotch(freq, sampleRate, q);
            
            double a0, a1, a2, b0, b1, b2;
            filter.getCoefficients(a0, a1, a2, b0, b1, b2);
            
            // Pour un notch, a0 > 0, a1 ≈ 0, a2 > 0
            assert(a0 > 0.0);
            assert(std::abs(a1) < 1e-3);
            assert(a2 > 0.0);
            
            // Vérifier la stabilité
            assert(std::abs(b1) < 2.0);
            assert(std::abs(b2) < 1.0);
        }
        
        std::cout << "✅ Calcul des filtres notch OK\n";
    }

    // Test 7: Calcul des filtres peaking
    void testPeakingCalculation() {
        std::cout << "🧪 Test 7: Calcul des filtres peaking...\n";
        
        BiquadFilter filter;
        
        std::vector<std::tuple<double, double, double, double>> testCases = {
            {1000.0, 1.0, 6.0, 48000.0},   // Boost
            {2000.0, 2.0, -3.0, 44100.0},  // Cut
            {5000.0, 0.5, 12.0, 96000.0}   // Boost important
        };
        
        for (const auto& [freq, q, gainDB, sampleRate] : testCases) {
            filter.calculatePeaking(freq, sampleRate, q, gainDB);
            
            double a0, a1, a2, b0, b1, b2;
            filter.getCoefficients(a0, a1, a2, b0, b1, b2);
            
            // Pour un peaking, les coefficients devraient être non-nuls
            assert(a0 != 0.0);
            assert(a1 != 0.0);
            assert(a2 != 0.0);
            
            // Vérifier la stabilité
            assert(std::abs(b1) < 2.0);
            assert(std::abs(b2) < 1.0);
        }
        
        std::cout << "✅ Calcul des filtres peaking OK\n";
    }

    // Test 8: Calcul des filtres shelf
    void testShelfCalculation() {
        std::cout << "🧪 Test 8: Calcul des filtres shelf...\n";
        
        BiquadFilter filter;
        
        // Test low shelf
        {
            filter.calculateLowShelf(500.0, 48000.0, 0.707, 6.0);
            double a0, a1, a2, b0, b1, b2;
            filter.getCoefficients(a0, a1, a2, b0, b1, b2);
            
            assert(a0 != 0.0);
            assert(a1 != 0.0);
            assert(a2 != 0.0);
            assert(std::abs(b1) < 2.0);
            assert(std::abs(b2) < 1.0);
        }
        
        // Test high shelf
        {
            filter.calculateHighShelf(5000.0, 48000.0, 0.707, -3.0);
            double a0, a1, a2, b0, b1, b2;
            filter.getCoefficients(a0, a1, a2, b0, b1, b2);
            
            assert(a0 != 0.0);
            assert(a1 != 0.0);
            assert(a2 != 0.0);
            assert(std::abs(b1) < 2.0);
            assert(std::abs(b2) < 1.0);
        }
        
        std::cout << "✅ Calcul des filtres shelf OK\n";
    }

    // Test 9: Calcul des filtres allpass
    void testAllpassCalculation() {
        std::cout << "🧪 Test 9: Calcul des filtres allpass...\n";
        
        BiquadFilter filter;
        
        filter.calculateAllpass(1000.0, 48000.0, 1.0);
        
        double a0, a1, a2, b0, b1, b2;
        filter.getCoefficients(a0, a1, a2, b0, b1, b2);
        
        // Pour un allpass, |a0| = |a2| et |a1| = |b1|
        assert(std::abs(std::abs(a0) - std::abs(a2)) < EPSILON);
        assert(std::abs(std::abs(a1) - std::abs(b1)) < EPSILON);
        
        // Vérifier la stabilité
        assert(std::abs(b1) < 2.0);
        assert(std::abs(b2) < 1.0);
        
        std::cout << "✅ Calcul des filtres allpass OK\n";
    }

    // Test 10: Traitement mono
    void testMonoProcessing() {
        std::cout << "🧪 Test 10: Traitement mono...\n";
        
        BiquadFilter filter;
        
        // Configurer comme filtre transparent
        filter.setCoefficients(1.0, 0.0, 0.0, 1.0, 0.0, 0.0);
        
        std::vector<float> input = {1.0f, -0.5f, 0.8f, -0.2f, 0.0f};
        std::vector<float> output(input.size(), 0.0f);
        
        filter.process(std::span<const float>(input), std::span<float>(output));
        
        // Pour un filtre transparent, sortie ≈ entrée
        for (size_t i = 0; i < input.size(); ++i) {
            assert(std::abs(output[i] - input[i]) < 0.01f);
        }
        
        // Test avec filtre passe-bas
        filter.calculateLowpass(1000.0, 48000.0, 0.707);
        std::vector<float> filteredOutput(input.size(), 0.0f);
        filter.process(std::span<const float>(input), std::span<float>(filteredOutput));
        
        // Vérifier que le filtre a un effet
        bool hasEffect = false;
        for (size_t i = 0; i < input.size(); ++i) {
            if (std::abs(filteredOutput[i] - input[i]) > 0.01f) {
                hasEffect = true;
                break;
            }
        }
        assert(hasEffect);
        
        // Vérifier qu'il n'y a pas de NaN ou infinis
        for (float val : filteredOutput) {
            assert(std::isfinite(val));
            assert(!std::isnan(val));
        }
        
        std::cout << "✅ Traitement mono OK\n";
    }

    // Test 11: Traitement stéréo
    void testStereoProcessing() {
        std::cout << "🧪 Test 11: Traitement stéréo...\n";
        
        BiquadFilter filter;
        
        // Configurer comme filtre transparent
        filter.setCoefficients(1.0, 0.0, 0.0, 1.0, 0.0, 0.0);
        
        std::vector<float> inputL = {0.5f, -0.3f, 0.7f};
        std::vector<float> inputR = {-0.4f, 0.6f, -0.1f};
        std::vector<float> outputL(inputL.size(), 0.0f);
        std::vector<float> outputR(inputR.size(), 0.0f);
        
        filter.processStereo(std::span<const float>(inputL), std::span<const float>(inputR),
                           std::span<float>(outputL), std::span<float>(outputR));
        
        // Vérifier que les sorties correspondent aux entrées
        for (size_t i = 0; i < inputL.size(); ++i) {
            assert(std::abs(outputL[i] - inputL[i]) < 0.01f);
            assert(std::abs(outputR[i] - inputR[i]) < 0.01f);
        }
        
        // Test avec filtre réel
        filter.calculatePeaking(1000.0, 48000.0, 1.0, 6.0);
        std::vector<float> filteredL(inputL.size(), 0.0f);
        std::vector<float> filteredR(inputR.size(), 0.0f);
        
        filter.processStereo(std::span<const float>(inputL), std::span<const float>(inputR),
                           std::span<float>(filteredL), std::span<float>(filteredR));
        
        // Vérifier qu'il n'y a pas de NaN ou infinis
        for (float val : filteredL) {
            assert(std::isfinite(val));
            assert(!std::isnan(val));
        }
        for (float val : filteredR) {
            assert(std::isfinite(val));
            assert(!std::isnan(val));
        }
        
        std::cout << "✅ Traitement stéréo OK\n";
    }

    // Test 12: Traitement d'échantillon unique
    void testSingleSampleProcessing() {
        std::cout << "🧪 Test 12: Traitement d'échantillon unique...\n";
        
        BiquadFilter filter;
        
        // Configurer un gain simple
        filter.setCoefficients(0.5, 0.0, 0.0, 1.0, 0.0, 0.0);
        
        float input = 1.0f;
        float output = filter.processSample(input);
        
        assert(std::abs(output - 0.5f) < 0.001f);
        
        // Test avec filtre passe-bas
        filter.calculateLowpass(1000.0, 48000.0, 0.707);
        
        std::vector<float> inputs = {1.0f, 0.0f, -1.0f, 0.5f};
        std::vector<float> outputs;
        
        for (float in : inputs) {
            outputs.push_back(filter.processSample(in));
        }
        
        // Vérifier que tous les outputs sont finis
        for (float out : outputs) {
            assert(std::isfinite(out));
            assert(!std::isnan(out));
        }
        
        std::cout << "✅ Traitement d'échantillon unique OK\n";
    }

    // Test 13: Reset et état
    void testResetAndState() {
        std::cout << "🧪 Test 13: Reset et état...\n";
        
        BiquadFilter filter;
        
        // Traiter quelques échantillons
        std::vector<float> input = {1.0f, 1.0f, 1.0f, 1.0f};
        std::vector<float> output(input.size(), 0.0f);
        
        filter.calculateLowpass(1000.0, 48000.0, 0.707);
        filter.process(std::span<const float>(input), std::span<float>(output));
        
        // Reset
        filter.reset();
        
        // Traiter un échantillon de silence
        float silentInput = 0.0f;
        float silentOutput = 0.0f;
        filter.processSample(silentInput);
        
        // La sortie devrait être proche de zéro après reset
        assert(std::abs(silentOutput) < 0.001f);
        
        std::cout << "✅ Reset et état OK\n";
    }

    // Test 14: Performance et stabilité
    void testPerformanceAndStability() {
        std::cout << "🧪 Test 14: Performance et stabilité...\n";
        
        BiquadFilter filter;
        filter.calculateLowpass(1000.0, 48000.0, 0.707);
        
        // Créer un signal de bruit blanc
        std::vector<float> input(TEST_BUFFER_SIZE);
        std::vector<float> output(TEST_BUFFER_SIZE);
        
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            input[i] = noise_dist(gen);
        }
        
        // Mesurer le temps de traitement
        auto start = std::chrono::high_resolution_clock::now();
        
        for (int i = 0; i < 100; ++i) {
            filter.process(std::span<const float>(input), std::span<float>(output));
        }
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
        
        // Vérifier que le traitement est rapide (< 1ms pour 100 itérations)
        assert(duration.count() < 1000000);
        
        // Vérifier la stabilité avec des valeurs extrêmes
        std::vector<float> extremeInput = {100.0f, -100.0f, 0.0f, 1e6f, -1e6f};
        std::vector<float> extremeOutput(extremeInput.size());
        
        filter.process(std::span<const float>(extremeInput), std::span<float>(extremeOutput));
        
        for (float val : extremeOutput) {
            assert(std::isfinite(val));
            assert(!std::isnan(val));
        }
        
        std::cout << "✅ Performance et stabilité OK (temps: " << duration.count() << " μs)\n";
    }

    // Test 15: Debug et informations
    void testDebugAndInfo() {
        std::cout << "🧪 Test 15: Debug et informations...\n";
        
        BiquadFilter filter;
        filter.calculatePeaking(1000.0, 48000.0, 1.0, 6.0);
        
        // Obtenir les informations de debug
        std::string debugInfo = filter.getDebugInfo();
        
        // Vérifier que les informations sont présentes
        assert(debugInfo.find("BiquadFilter Debug Info") != std::string::npos);
        assert(debugInfo.find("Coefficients") != std::string::npos);
        assert(debugInfo.find("State") != std::string::npos);
        
        std::cout << "✅ Debug et informations OK\n";
    }

    // Exécuter tous les tests
    void runAllTests() {
        std::cout << "🚀 Démarrage des tests unitaires BiquadFilter (Production)\n\n";
        
        testConstruction();
        testManualCoefficientSetting();
        testLowpassCalculation();
        testHighpassCalculation();
        testBandpassCalculation();
        testNotchCalculation();
        testPeakingCalculation();
        testShelfCalculation();
        testAllpassCalculation();
        testMonoProcessing();
        testStereoProcessing();
        testSingleSampleProcessing();
        testResetAndState();
        testPerformanceAndStability();
        testDebugAndInfo();
        
        std::cout << "\n🎉 TOUS LES TESTS BIQUADFILTER PASSÉS !\n\n";
    }
};

int main() {
    BiquadFilterTest test;
    test.runAllTests();
    return 0;
}
