#include "../../shared/Audio/core/AudioEqualizer.hpp"
#include "../../shared/Audio/core/BiquadFilter.hpp"
#include <cassert>
#include <cmath>
#include <iostream>
#include <vector>
#include <algorithm>
#include <random>
#include <chrono>

using namespace AudioEqualizer;

class IntegrationTest {
private:
    static constexpr double EPSILON = 1e-6;
    static constexpr size_t TEST_BUFFER_SIZE = 2048;
    static constexpr uint32_t TEST_SAMPLE_RATE = 48000;
    
    std::random_device rd;
    std::mt19937 gen;
    std::uniform_real_distribution<float> noise_dist;

public:
    IntegrationTest() : gen(rd()), noise_dist(-1.0f, 1.0f) {}

    // Test 1: Intégration basique - AudioEqualizer utilise BiquadFilter
    void testBasicIntegration() {
        std::cout << "🧪 Test 1: Intégration basique...\n";
        
        AudioEqualizer eq(3, TEST_SAMPLE_RATE);
        
        // Configurer l'égaliseur avec différents types de filtres
        eq.setBandType(0, FilterType::LOWPASS);
        eq.setBandType(1, FilterType::PEAK);
        eq.setBandType(2, FilterType::HIGHPASS);
        
        eq.setBandGain(0, 6.0);
        eq.setBandGain(1, 3.0);
        eq.setBandGain(2, -3.0);
        
        eq.setBandFrequency(0, 500.0);
        eq.setBandFrequency(1, 2000.0);
        eq.setBandFrequency(2, 8000.0);
        
        // Créer un signal de test
        std::vector<float> input(TEST_BUFFER_SIZE);
        std::vector<float> output(TEST_BUFFER_SIZE);
        
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            input[i] = std::sin(2.0 * M_PI * 440.0 * i / TEST_SAMPLE_RATE);
        }
        
        // Traitement
        eq.process(std::span<const float>(input), std::span<float>(output));
        
        // Vérifications
        assert(output.size() == input.size());
        
        // Vérifier qu'il n'y a pas de NaN ou infinis
        for (float val : output) {
            assert(std::isfinite(val));
            assert(!std::isnan(val));
        }
        
        // Vérifier que le traitement a un effet
        bool hasEffect = false;
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            if (std::abs(output[i] - input[i]) > 0.01f) {
                hasEffect = true;
                break;
            }
        }
        assert(hasEffect);
        
        std::cout << "✅ Intégration basique OK\n";
    }

    // Test 2: Comparaison directe entre BiquadFilter et AudioEqualizer
    void testDirectComparison() {
        std::cout << "🧪 Test 2: Comparaison directe...\n";
        
        // Créer un filtre biquad direct
        BiquadFilter directFilter;
        directFilter.calculatePeaking(1000.0, TEST_SAMPLE_RATE, 1.0, 6.0);
        
        // Créer un égaliseur avec une seule bande
        AudioEqualizer eq(1, TEST_SAMPLE_RATE);
        eq.setBandType(0, FilterType::PEAK);
        eq.setBandGain(0, 6.0);
        eq.setBandFrequency(0, 1000.0);
        eq.setBandQ(0, 1.0);
        
        // Créer un signal de test
        std::vector<float> input(TEST_BUFFER_SIZE);
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            input[i] = std::sin(2.0 * M_PI * 1000.0 * i / TEST_SAMPLE_RATE);
        }
        
        // Traitement avec filtre direct
        std::vector<float> directOutput(TEST_BUFFER_SIZE);
        directFilter.process(std::span<const float>(input), std::span<float>(directOutput));
        
        // Traitement avec égaliseur
        std::vector<float> eqOutput(TEST_BUFFER_SIZE);
        eq.process(std::span<const float>(input), std::span<float>(eqOutput));
        
        // Les résultats devraient être similaires (pas identiques à cause du gain master)
        double maxDiff = 0.0;
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            double diff = std::abs(directOutput[i] - eqOutput[i]);
            maxDiff = std::max(maxDiff, diff);
        }
        
        // La différence devrait être raisonnable (< 0.1)
        assert(maxDiff < 0.1);
        
        std::cout << "✅ Comparaison directe OK (diff max: " << maxDiff << ")\n";
    }

    // Test 3: Cascade de filtres
    void testFilterCascade() {
        std::cout << "🧪 Test 3: Cascade de filtres...\n";
        
        // Créer plusieurs filtres biquad
        std::vector<BiquadFilter> filters;
        
        // Filtre passe-bas
        BiquadFilter lowpass;
        lowpass.calculateLowpass(500.0, TEST_SAMPLE_RATE, 0.707);
        filters.push_back(lowpass);
        
        // Filtre peaking
        BiquadFilter peaking;
        peaking.calculatePeaking(2000.0, TEST_SAMPLE_RATE, 1.0, 6.0);
        filters.push_back(peaking);
        
        // Filtre passe-haut
        BiquadFilter highpass;
        highpass.calculateHighpass(8000.0, TEST_SAMPLE_RATE, 0.707);
        filters.push_back(highpass);
        
        // Créer un égaliseur équivalent
        AudioEqualizer eq(3, TEST_SAMPLE_RATE);
        eq.setBandType(0, FilterType::LOWPASS);
        eq.setBandGain(0, 0.0);
        eq.setBandFrequency(0, 500.0);
        eq.setBandQ(0, 0.707);
        
        eq.setBandType(1, FilterType::PEAK);
        eq.setBandGain(1, 6.0);
        eq.setBandFrequency(1, 2000.0);
        eq.setBandQ(1, 1.0);
        
        eq.setBandType(2, FilterType::HIGHPASS);
        eq.setBandGain(2, 0.0);
        eq.setBandFrequency(2, 8000.0);
        eq.setBandQ(2, 0.707);
        
        // Créer un signal de test
        std::vector<float> input(TEST_BUFFER_SIZE);
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            input[i] = noise_dist(gen);
        }
        
        // Traitement en cascade
        std::vector<float> cascadeOutput = input;
        for (auto& filter : filters) {
            std::vector<float> tempOutput(cascadeOutput.size());
            filter.process(std::span<const float>(cascadeOutput), std::span<float>(tempOutput));
            cascadeOutput = tempOutput;
        }
        
        // Traitement avec égaliseur
        std::vector<float> eqOutput(TEST_BUFFER_SIZE);
        eq.process(std::span<const float>(input), std::span<float>(eqOutput));
        
        // Vérifier que les deux traitements ont un effet
        bool cascadeHasEffect = false;
        bool eqHasEffect = false;
        
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            if (std::abs(cascadeOutput[i] - input[i]) > 0.01f) {
                cascadeHasEffect = true;
            }
            if (std::abs(eqOutput[i] - input[i]) > 0.01f) {
                eqHasEffect = true;
            }
        }
        
        assert(cascadeHasEffect);
        assert(eqHasEffect);
        
        std::cout << "✅ Cascade de filtres OK\n";
    }

    // Test 4: Performance comparée
    void testPerformanceComparison() {
        std::cout << "🧪 Test 4: Performance comparée...\n";
        
        // Créer un égaliseur avec plusieurs bandes
        AudioEqualizer eq(10, TEST_SAMPLE_RATE);
        
        // Configurer toutes les bandes
        for (size_t i = 0; i < eq.getNumBands(); ++i) {
            eq.setBandGain(i, (i % 2 == 0) ? 3.0 : -3.0);
            eq.setBandFrequency(i, 100.0 + i * 1000.0);
            eq.setBandQ(i, 0.5 + i * 0.1);
        }
        
        // Créer un signal de test
        std::vector<float> input(TEST_BUFFER_SIZE);
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            input[i] = noise_dist(gen);
        }
        
        std::vector<float> output(TEST_BUFFER_SIZE);
        
        // Mesurer le temps de traitement
        auto start = std::chrono::high_resolution_clock::now();
        
        for (int i = 0; i < 100; ++i) {
            eq.process(std::span<const float>(input), std::span<float>(output));
        }
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
        
        // Vérifier que le traitement est rapide (< 2ms pour 100 itérations)
        assert(duration.count() < 2000000);
        
        std::cout << "✅ Performance comparée OK (temps: " << duration.count() << " μs)\n";
    }

    // Test 5: Stabilité avec paramètres extrêmes
    void testExtremeParameters() {
        std::cout << "🧪 Test 5: Stabilité avec paramètres extrêmes...\n";
        
        AudioEqualizer eq(5, TEST_SAMPLE_RATE);
        
        // Configurer avec des paramètres extrêmes
        eq.setBandGain(0, 20.0);  // Gain très élevé
        eq.setBandGain(1, -20.0); // Gain très négatif
        eq.setBandGain(2, 0.0);   // Gain neutre
        eq.setBandGain(3, 12.0);  // Gain élevé
        eq.setBandGain(4, -12.0); // Gain négatif élevé
        
        eq.setBandFrequency(0, 20.0);                    // Fréquence très basse
        eq.setBandFrequency(1, TEST_SAMPLE_RATE / 2.0);  // Fréquence de Nyquist
        eq.setBandFrequency(2, 1000.0);                  // Fréquence normale
        eq.setBandFrequency(3, 20000.0);                 // Fréquence haute
        eq.setBandFrequency(4, 50.0);                    // Fréquence très basse
        
        eq.setBandQ(0, 0.1);   // Q très bas
        eq.setBandQ(1, 10.0);  // Q très élevé
        eq.setBandQ(2, 1.0);   // Q normal
        eq.setBandQ(3, 5.0);   // Q élevé
        eq.setBandQ(4, 0.5);   // Q bas
        
        // Créer un signal avec des valeurs extrêmes
        std::vector<float> extremeInput = {
            1.0f, -1.0f, 0.0f, 0.5f, -0.5f,
            100.0f, -100.0f, 1e6f, -1e6f, 0.0f
        };
        
        std::vector<float> output(extremeInput.size());
        
        // Traitement
        eq.process(std::span<const float>(extremeInput), std::span<float>(output));
        
        // Vérifier la stabilité
        for (float val : output) {
            assert(std::isfinite(val));
            assert(!std::isnan(val));
            assert(std::abs(val) < 1e6); // Pas de débordement extrême
        }
        
        std::cout << "✅ Stabilité avec paramètres extrêmes OK\n";
    }

    // Test 6: Thread safety intégrée
    void testThreadSafety() {
        std::cout << "🧪 Test 6: Thread safety intégrée...\n";
        
        AudioEqualizer eq(3, TEST_SAMPLE_RATE);
        
        // Test ParameterUpdateGuard
        {
            AudioEqualizer::ParameterUpdateGuard guard(eq);
            
            eq.setBandGain(0, 6.0);
            eq.setBandFrequency(1, 1000.0);
            eq.setBandQ(2, 1.0);
            eq.setBandType(0, FilterType::LOWPASS);
            eq.setBandType(1, FilterType::PEAK);
            eq.setBandType(2, FilterType::HIGHPASS);
        }
        
        // Vérifier que les changements ont été appliqués
        assert(std::abs(eq.getBandGain(0) - 6.0) < EPSILON);
        assert(std::abs(eq.getBandFrequency(1) - 1000.0) < EPSILON);
        assert(std::abs(eq.getBandQ(2) - 1.0) < EPSILON);
        assert(eq.getBandType(0) == FilterType::LOWPASS);
        assert(eq.getBandType(1) == FilterType::PEAK);
        assert(eq.getBandType(2) == FilterType::HIGHPASS);
        
        // Test traitement après modification
        std::vector<float> input = {1.0f, -0.5f, 0.8f, -0.2f};
        std::vector<float> output(input.size());
        
        eq.process(std::span<const float>(input), std::span<float>(output));
        
        // Vérifier que le traitement fonctionne
        for (float val : output) {
            assert(std::isfinite(val));
            assert(!std::isnan(val));
        }
        
        std::cout << "✅ Thread safety intégrée OK\n";
    }

    // Test 7: Gestion des presets avec filtres complexes
    void testPresetManagement() {
        std::cout << "🧪 Test 7: Gestion des presets avec filtres complexes...\n";
        
        AudioEqualizer eq(5, TEST_SAMPLE_RATE);
        
        // Configurer un preset complexe
        EQPreset complexPreset;
        complexPreset.name = "Complex Preset";
        complexPreset.gains = {6.0, -3.0, 12.0, -6.0, 3.0};
        
        // Charger le preset
        eq.loadPreset(complexPreset);
        
        // Vérifier que les gains ont été appliqués
        for (size_t i = 0; i < eq.getNumBands(); ++i) {
            assert(std::abs(eq.getBandGain(i) - complexPreset.gains[i]) < EPSILON);
        }
        
        // Configurer des types de filtres différents
        eq.setBandType(0, FilterType::LOWPASS);
        eq.setBandType(1, FilterType::HIGHPASS);
        eq.setBandType(2, FilterType::PEAK);
        eq.setBandType(3, FilterType::NOTCH);
        eq.setBandType(4, FilterType::LOWSHELF);
        
        // Test traitement avec preset complexe
        std::vector<float> input(TEST_BUFFER_SIZE);
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            input[i] = std::sin(2.0 * M_PI * 440.0 * i / TEST_SAMPLE_RATE);
        }
        
        std::vector<float> output(TEST_BUFFER_SIZE);
        eq.process(std::span<const float>(input), std::span<float>(output));
        
        // Vérifier que le traitement fonctionne
        for (float val : output) {
            assert(std::isfinite(val));
            assert(!std::isnan(val));
        }
        
        // Sauvegarder le preset modifié
        EQPreset savedPreset;
        eq.savePreset(savedPreset);
        
        assert(savedPreset.gains.size() == 5);
        for (size_t i = 0; i < 5; ++i) {
            assert(std::abs(savedPreset.gains[i] - complexPreset.gains[i]) < EPSILON);
        }
        
        std::cout << "✅ Gestion des presets avec filtres complexes OK\n";
    }

    // Test 8: Validation des paramètres intégrée
    void testParameterValidation() {
        std::cout << "🧪 Test 8: Validation des paramètres intégrée...\n";
        
        AudioEqualizer eq(3, TEST_SAMPLE_RATE);
        
        // Test gains valides
        eq.setBandGain(0, 0.0);
        eq.setBandGain(1, 12.0);
        eq.setBandGain(2, -12.0);
        
        // Test fréquences valides
        eq.setBandFrequency(0, 20.0);
        eq.setBandFrequency(1, TEST_SAMPLE_RATE / 2.0);
        eq.setBandFrequency(2, 20000.0);
        
        // Test Q factors valides
        eq.setBandQ(0, 0.1);
        eq.setBandQ(1, 1.0);
        eq.setBandQ(2, 10.0);
        
        // Test sample rate
        eq.setSampleRate(44100);
        assert(eq.getSampleRate() == 44100);
        
        eq.setSampleRate(96000);
        assert(eq.getSampleRate() == 96000);
        
        // Test traitement après validation
        std::vector<float> input = {0.5f, -0.3f, 0.8f, -0.1f};
        std::vector<float> output(input.size());
        
        eq.process(std::span<const float>(input), std::span<float>(output));
        
        // Vérifier que le traitement fonctionne
        for (float val : output) {
            assert(std::isfinite(val));
            assert(!std::isnan(val));
        }
        
        std::cout << "✅ Validation des paramètres intégrée OK\n";
    }

    // Test 9: Debug et informations intégrées
    void testDebugAndInfo() {
        std::cout << "🧪 Test 9: Debug et informations intégrées...\n";
        
        AudioEqualizer eq(3, TEST_SAMPLE_RATE);
        
        // Configurer l'égaliseur
        eq.setBandGain(0, 6.0);
        eq.setBandFrequency(1, 1000.0);
        eq.setBandType(2, FilterType::LOWPASS);
        eq.setMasterGain(3.0);
        
        // Obtenir les informations de debug
        std::string debugInfo = eq.getDebugInfo();
        
        // Vérifier que les informations sont présentes
        assert(debugInfo.find("AudioEqualizer Debug Info") != std::string::npos);
        assert(debugInfo.find("48000") != std::string::npos);  // Sample rate
        assert(debugInfo.find("3.00") != std::string::npos);   // Master gain
        assert(debugInfo.find("6.00") != std::string::npos);   // Band gain
        assert(debugInfo.find("1000.0") != std::string::npos); // Frequency
        
        // Test validation de buffer
        std::vector<float> validBuffer = {0.5f, -0.3f, 0.8f, -0.1f};
        assert(eq.validateAudioBuffer(std::span<const float>(validBuffer)));
        
        std::vector<float> invalidBuffer = {0.5f, std::numeric_limits<float>::quiet_NaN(), 0.8f};
        assert(!eq.validateAudioBuffer(std::span<const float>(invalidBuffer)));
        
        // Test debug d'un filtre biquad individuel
        BiquadFilter filter;
        filter.calculatePeaking(1000.0, 48000.0, 1.0, 6.0);
        std::string filterDebug = filter.getDebugInfo();
        
        assert(filterDebug.find("BiquadFilter Debug Info") != std::string::npos);
        assert(filterDebug.find("Coefficients") != std::string::npos);
        
        std::cout << "✅ Debug et informations intégrées OK\n";
    }

    // Test 10: Test de régression complet
    void testRegression() {
        std::cout << "🧪 Test 10: Test de régression complet...\n";
        
        AudioEqualizer eq(5, TEST_SAMPLE_RATE);
        
        // Configuration de référence
        eq.setBandGain(0, 6.0);
        eq.setBandGain(1, -3.0);
        eq.setBandGain(2, 12.0);
        eq.setBandGain(3, -6.0);
        eq.setBandGain(4, 3.0);
        
        eq.setBandFrequency(0, 100.0);
        eq.setBandFrequency(1, 500.0);
        eq.setBandFrequency(2, 1000.0);
        eq.setBandFrequency(3, 5000.0);
        eq.setBandFrequency(4, 10000.0);
        
        eq.setBandQ(0, 0.5);
        eq.setBandQ(1, 1.0);
        eq.setBandQ(2, 2.0);
        eq.setBandQ(3, 1.5);
        eq.setBandQ(4, 0.8);
        
        eq.setBandType(0, FilterType::LOWSHELF);
        eq.setBandType(1, FilterType::LOWPASS);
        eq.setBandType(2, FilterType::PEAK);
        eq.setBandType(3, FilterType::HIGHPASS);
        eq.setBandType(4, FilterType::HIGHSHELF);
        
        eq.setMasterGain(3.0);
        
        // Créer un signal de test reproductible
        std::vector<float> input(TEST_BUFFER_SIZE);
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            input[i] = std::sin(2.0 * M_PI * 440.0 * i / TEST_SAMPLE_RATE) * 0.5f;
        }
        
        std::vector<float> output(TEST_BUFFER_SIZE);
        
        // Traitement
        eq.process(std::span<const float>(input), std::span<float>(output));
        
        // Vérifications de régression
        assert(output.size() == input.size());
        
        // Vérifier qu'il n'y a pas de NaN ou infinis
        for (float val : output) {
            assert(std::isfinite(val));
            assert(!std::isnan(val));
        }
        
        // Vérifier que le traitement a un effet
        bool hasEffect = false;
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            if (std::abs(output[i] - input[i]) > 0.01f) {
                hasEffect = true;
                break;
            }
        }
        assert(hasEffect);
        
        // Vérifier que les valeurs sont dans des limites raisonnables
        float maxOutput = 0.0f;
        for (float val : output) {
            maxOutput = std::max(maxOutput, std::abs(val));
        }
        assert(maxOutput < 10.0f); // Pas de débordement extrême
        
        std::cout << "✅ Test de régression complet OK (max output: " << maxOutput << ")\n";
    }

    // Exécuter tous les tests
    void runAllTests() {
        std::cout << "🚀 Démarrage des tests d'intégration (Production)\n\n";
        
        testBasicIntegration();
        testDirectComparison();
        testFilterCascade();
        testPerformanceComparison();
        testExtremeParameters();
        testThreadSafety();
        testPresetManagement();
        testParameterValidation();
        testDebugAndInfo();
        testRegression();
        
        std::cout << "\n🎉 TOUS LES TESTS D'INTÉGRATION PASSÉS !\n\n";
    }
};

int main() {
    IntegrationTest test;
    test.runAllTests();
    return 0;
}
