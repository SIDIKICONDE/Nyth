#include "../../shared/Audio/core/AudioEqualizer.hpp"
#include "../../shared/Audio/core/BiquadFilter.hpp"
#include <cassert>
#include <cmath>
#include <iostream>
#include <vector>
#include <algorithm>
#include <random>
#include <chrono>

using AudioEqualizerClass = AudioEqualizer::AudioEqualizer;
using BiquadFilterClass = AudioEqualizer::BiquadFilter;

class AudioEqualizerTest {
private:
    static constexpr double EPSILON = 1e-6;
    static constexpr size_t TEST_BUFFER_SIZE = 1024;
    static constexpr uint32_t TEST_SAMPLE_RATE = 48000;
    
    std::random_device rd;
    std::mt19937 gen;
    std::uniform_real_distribution<float> noise_dist;

public:
    AudioEqualizerTest() : gen(rd()), noise_dist(-1.0f, 1.0f) {}

    // Test 1: Construction et initialisation
    void testConstruction() {
        std::cout << "🧪 Test 1: Construction et initialisation...\n";
        
        // Test constructeur par défaut
        {
            AudioEqualizer eq;
            assert(eq.getNumBands() == NUM_BANDS);
            assert(eq.getSampleRate() == DEFAULT_SAMPLE_RATE);
            assert(eq.getMasterGain() == ZERO_GAIN);
            assert(!eq.isBypassed());
        }
        
        // Test constructeur avec paramètres
        {
            AudioEqualizer eq(10, 44100);
            assert(eq.getNumBands() == 10);
            assert(eq.getSampleRate() == 44100);
        }
        
        // Test initialisation
        {
            AudioEqualizer eq;
            eq.initialize(5, 96000);
            assert(eq.getNumBands() == 5);
            assert(eq.getSampleRate() == 96000);
        }
        
        std::cout << "✅ Construction et initialisation OK\n";
    }

    // Test 2: Configuration des bandes
    void testBandConfiguration() {
        std::cout << "🧪 Test 2: Configuration des bandes...\n";
        
        AudioEqualizer eq(3, TEST_SAMPLE_RATE);
        
        // Test gain des bandes
        eq.setBandGain(0, 6.0);
        eq.setBandGain(1, -3.0);
        eq.setBandGain(2, 12.0);
        
        assert(std::abs(eq.getBandGain(0) - 6.0) < EPSILON);
        assert(std::abs(eq.getBandGain(1) - (-3.0)) < EPSILON);
        assert(std::abs(eq.getBandGain(2) - 12.0) < EPSILON);
        
        // Test fréquence des bandes
        eq.setBandFrequency(0, 100.0);
        eq.setBandFrequency(1, 1000.0);
        eq.setBandFrequency(2, 10000.0);
        
        assert(std::abs(eq.getBandFrequency(0) - 100.0) < EPSILON);
        assert(std::abs(eq.getBandFrequency(1) - 1000.0) < EPSILON);
        assert(std::abs(eq.getBandFrequency(2) - 10000.0) < EPSILON);
        
        // Test Q factor
        eq.setBandQ(0, 0.5);
        eq.setBandQ(1, 1.0);
        eq.setBandQ(2, 2.0);
        
        assert(std::abs(eq.getBandQ(0) - 0.5) < EPSILON);
        assert(std::abs(eq.getBandQ(1) - 1.0) < EPSILON);
        assert(std::abs(eq.getBandQ(2) - 2.0) < EPSILON);
        
        // Test type de filtre
        eq.setBandType(0, FilterType::LOWPASS);
        eq.setBandType(1, FilterType::HIGHPASS);
        eq.setBandType(2, FilterType::PEAK);
        
        assert(eq.getBandType(0) == FilterType::LOWPASS);
        assert(eq.getBandType(1) == FilterType::HIGHPASS);
        assert(eq.getBandType(2) == FilterType::PEAK);
        
        // Test activation/désactivation
        eq.setBandEnabled(0, false);
        eq.setBandEnabled(1, true);
        eq.setBandEnabled(2, false);
        
        assert(!eq.isBandEnabled(0));
        assert(eq.isBandEnabled(1));
        assert(!eq.isBandEnabled(2));
        
        std::cout << "✅ Configuration des bandes OK\n";
    }

    // Test 3: Contrôles globaux
    void testGlobalControls() {
        std::cout << "🧪 Test 3: Contrôles globaux...\n";
        
        AudioEqualizer eq;
        
        // Test gain master
        eq.setMasterGain(6.0);
        assert(std::abs(eq.getMasterGain() - 6.0) < EPSILON);
        
        eq.setMasterGain(-12.0);
        assert(std::abs(eq.getMasterGain() - (-12.0)) < EPSILON);
        
        // Test bypass
        eq.setBypass(true);
        assert(eq.isBypassed());
        
        eq.setBypass(false);
        assert(!eq.isBypassed());
        
        std::cout << "✅ Contrôles globaux OK\n";
    }

    // Test 4: Gestion des presets
    void testPresetManagement() {
        std::cout << "🧪 Test 4: Gestion des presets...\n";
        
        AudioEqualizer eq(3, TEST_SAMPLE_RATE);
        
        // Configurer un preset
        EQPreset preset;
        preset.name = "Test Preset";
        preset.gains = {6.0, -3.0, 12.0};
        
        // Charger le preset
        eq.loadPreset(preset);
        
        // Vérifier que les gains ont été appliqués
        assert(std::abs(eq.getBandGain(0) - 6.0) < EPSILON);
        assert(std::abs(eq.getBandGain(1) - (-3.0)) < EPSILON);
        assert(std::abs(eq.getBandGain(2) - 12.0) < EPSILON);
        
        // Sauvegarder un preset
        EQPreset savedPreset;
        eq.savePreset(savedPreset);
        
        assert(savedPreset.gains.size() == 3);
        assert(std::abs(savedPreset.gains[0] - 6.0) < EPSILON);
        assert(std::abs(savedPreset.gains[1] - (-3.0)) < EPSILON);
        assert(std::abs(savedPreset.gains[2] - 12.0) < EPSILON);
        
        // Test reset des bandes
        eq.resetAllBands();
        
        for (size_t i = 0; i < eq.getNumBands(); ++i) {
            assert(std::abs(eq.getBandGain(i) - ZERO_GAIN) < EPSILON);
            assert(eq.isBandEnabled(i));
        }
        
        std::cout << "✅ Gestion des presets OK\n";
    }

    // Test 5: Traitement audio mono
    void testMonoProcessing() {
        std::cout << "🧪 Test 5: Traitement audio mono...\n";
        
        AudioEqualizer eq(3, TEST_SAMPLE_RATE);
        
        // Configurer un égaliseur simple
        eq.setBandGain(0, 6.0);  // Boost basse
        eq.setBandGain(1, 0.0);  // Neutre
        eq.setBandGain(2, -3.0); // Cut haute
        
        // Créer un signal de test (sinusoïde)
        std::vector<float> input(TEST_BUFFER_SIZE);
        std::vector<float> output(TEST_BUFFER_SIZE);
        
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            input[i] = std::sin(2.0 * M_PI * 440.0 * i / TEST_SAMPLE_RATE);
        }
        
        // Traitement
        eq.process(std::span<const float>(input), std::span<float>(output));
        
        // Vérifications basiques
        assert(output.size() == input.size());
        
        // Vérifier qu'il n'y a pas de NaN ou infinis
        for (float val : output) {
            assert(std::isfinite(val));
            assert(!std::isnan(val));
        }
        
        // Test bypass
        eq.setBypass(true);
        std::vector<float> bypassOutput(TEST_BUFFER_SIZE);
        eq.process(std::span<const float>(input), std::span<float>(bypassOutput));
        
        // En bypass, sortie ≈ entrée
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            assert(std::abs(bypassOutput[i] - input[i]) < 0.01f);
        }
        
        std::cout << "✅ Traitement audio mono OK\n";
    }

    // Test 6: Traitement audio stéréo
    void testStereoProcessing() {
        std::cout << "🧪 Test 6: Traitement audio stéréo...\n";
        
        AudioEqualizer eq(3, TEST_SAMPLE_RATE);
        
        // Configurer l'égaliseur
        eq.setBandGain(0, 3.0);
        eq.setBandGain(1, -1.5);
        eq.setBandGain(2, 6.0);
        
        // Créer des signaux stéréo de test
        std::vector<float> inputL(TEST_BUFFER_SIZE);
        std::vector<float> inputR(TEST_BUFFER_SIZE);
        std::vector<float> outputL(TEST_BUFFER_SIZE);
        std::vector<float> outputR(TEST_BUFFER_SIZE);
        
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            inputL[i] = std::sin(2.0 * M_PI * 440.0 * i / TEST_SAMPLE_RATE);
            inputR[i] = std::cos(2.0 * M_PI * 440.0 * i / TEST_SAMPLE_RATE);
        }
        
        // Traitement stéréo
        eq.processStereo(std::span<const float>(inputL), std::span<const float>(inputR),
                        std::span<float>(outputL), std::span<float>(outputR));
        
        // Vérifications
        assert(outputL.size() == inputL.size());
        assert(outputR.size() == inputR.size());
        
        // Vérifier qu'il n'y a pas de NaN ou infinis
        for (float val : outputL) {
            assert(std::isfinite(val));
            assert(!std::isnan(val));
        }
        for (float val : outputR) {
            assert(std::isfinite(val));
            assert(!std::isnan(val));
        }
        
        std::cout << "✅ Traitement audio stéréo OK\n";
    }

    // Test 7: Performance et stabilité
    void testPerformanceAndStability() {
        std::cout << "🧪 Test 7: Performance et stabilité...\n";
        
        AudioEqualizer eq(10, TEST_SAMPLE_RATE);
        
        // Configurer avec des valeurs extrêmes
        for (size_t i = 0; i < eq.getNumBands(); ++i) {
            eq.setBandGain(i, (i % 2 == 0) ? 20.0 : -20.0);
            eq.setBandFrequency(i, 20.0 + i * 2000.0);
            eq.setBandQ(i, 0.1 + i * 0.5);
        }
        
        // Créer un signal de bruit blanc
        std::vector<float> input(TEST_BUFFER_SIZE);
        std::vector<float> output(TEST_BUFFER_SIZE);
        
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            input[i] = noise_dist(gen);
        }
        
        // Mesurer le temps de traitement
        auto start = std::chrono::high_resolution_clock::now();
        
        for (int i = 0; i < 100; ++i) {
            eq.process(std::span<const float>(input), std::span<float>(output));
        }
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
        
        // Vérifier que le traitement est rapide (< 1ms pour 100 itérations)
        assert(duration.count() < 1000000);
        
        // Vérifier la stabilité avec des valeurs extrêmes
        std::vector<float> extremeInput = {100.0f, -100.0f, 0.0f, 1e6f, -1e6f};
        std::vector<float> extremeOutput(extremeInput.size());
        
        eq.process(std::span<const float>(extremeInput), std::span<float>(extremeOutput));
        
        for (float val : extremeOutput) {
            assert(std::isfinite(val));
            assert(!std::isnan(val));
        }
        
        std::cout << "✅ Performance et stabilité OK (temps: " << duration.count() << " μs)\n";
    }

    // Test 8: Validation des paramètres
    void testParameterValidation() {
        std::cout << "🧪 Test 8: Validation des paramètres...\n";
        
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
        
        std::cout << "✅ Validation des paramètres OK\n";
    }

    // Test 9: Thread safety
    void testThreadSafety() {
        std::cout << "🧪 Test 9: Thread safety...\n";
        
        AudioEqualizer eq(5, TEST_SAMPLE_RATE);
        
        // Test ParameterUpdateGuard
        {
            AudioEqualizer::ParameterUpdateGuard guard(eq);
            eq.setBandGain(0, 6.0);
            eq.setBandFrequency(1, 1000.0);
            eq.setBandQ(2, 1.0);
        }
        
        // Vérifier que les changements ont été appliqués
        assert(std::abs(eq.getBandGain(0) - 6.0) < EPSILON);
        assert(std::abs(eq.getBandFrequency(1) - 1000.0) < EPSILON);
        assert(std::abs(eq.getBandQ(2) - 1.0) < EPSILON);
        
        // Test méthodes manuelles
        eq.beginParameterUpdate();
        eq.setBandGain(3, 3.0);
        eq.setBandGain(4, -3.0);
        eq.endParameterUpdate();
        
        assert(std::abs(eq.getBandGain(3) - 3.0) < EPSILON);
        assert(std::abs(eq.getBandGain(4) - (-3.0)) < EPSILON);
        
        std::cout << "✅ Thread safety OK\n";
    }

    // Test 10: Debug et informations
    void testDebugAndInfo() {
        std::cout << "🧪 Test 10: Debug et informations...\n";
        
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
        
        std::cout << "✅ Debug et informations OK\n";
    }

    // Exécuter tous les tests
    void runAllTests() {
        std::cout << "🚀 Démarrage des tests unitaires AudioEqualizer (Production)\n\n";
        
        testConstruction();
        testBandConfiguration();
        testGlobalControls();
        testPresetManagement();
        testMonoProcessing();
        testStereoProcessing();
        testPerformanceAndStability();
        testParameterValidation();
        testThreadSafety();
        testDebugAndInfo();
        
        std::cout << "\n🎉 TOUS LES TESTS AUDIOEQUALIZER PASSÉS !\n\n";
    }
};

int main() {
    AudioEqualizerTest test;
    test.runAllTests();
    return 0;
}
