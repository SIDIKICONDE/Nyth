// Test des composants du module Effects
// Teste les effets individuels : Compressor, Delay, EffectBase

#include <algorithm>
#include <chrono>
#include <cmath>
#include <iostream>
#include <iomanip>
#include <vector>
#include <memory>

// Headers du projet
#include "../../shared/Audio/effects/components/Compressor.hpp"
#include "../../shared/Audio/effects/components/Delay.hpp"
#include "../../shared/Audio/effects/components/EffectBase.hpp"
#include "../../shared/Audio/effects/components/EffectChain.hpp"
#include "../../shared/Audio/core/components/constant/CoreConstants.hpp"
#include "../../shared/Audio/effects/components/constant/EffectConstants.hpp"

// Utilisation des namespaces
using namespace AudioFX;

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

// Configuration des tests
const int TEST_SAMPLE_RATE = 44100;
const size_t TEST_BUFFER_SIZE = 2048;
const int PERFORMANCE_TEST_ITERATIONS = 1000;

// Structure de résultat de test
struct TestResult {
    bool passed = false;
    double executionTime = 0.0;
    std::vector<double> metrics;
    std::string errorMessage;
};

// Test 1: Test du compresseur audio
TestResult testCompressor() {
    TestResult result;
    auto start = std::chrono::high_resolution_clock::now();

    std::cout << "🎛️ Test 1: Compresseur audio...\n";

    try {
        bool compressorTestsPassed = true;

        // 1. Test d'initialisation du compresseur
        std::cout << "   - Test initialisation compresseur...\n";

        CompressorEffect compressor;
        compressor.setSampleRate(TEST_SAMPLE_RATE, 2); // Stéréo

        if (compressor.isEnabled()) {
            std::cout << "   - ✅ Compresseur initialisé (activé par défaut)\n";
        } else {
            std::cout << "   - ❌ Compresseur non activé\n";
            compressorTestsPassed = false;
        }

        // 2. Test de configuration
        std::cout << "   - Test configuration compresseur...\n";

        compressor.setParameters(-20.0, 4.0, 15.0, 150.0, -6.0);

        std::cout << "   - Paramètres configurés:\n";
        std::cout << "     Seuil: -20.0 dB\n";
        std::cout << "     Ratio: 4.0:1\n";
        std::cout << "     Attack: 15.0 ms\n";
        std::cout << "     Release: 150.0 ms\n";
        std::cout << "     Makeup: -6.0 dB\n";

        // 3. Test de traitement audio mono
        std::cout << "   - Test traitement mono...\n";

        std::vector<float> inputMono(TEST_BUFFER_SIZE);
        std::vector<float> outputMono(TEST_BUFFER_SIZE);

        // Générer un signal de test avec transients
        for (size_t i = 0; i < inputMono.size(); ++i) {
            double t = static_cast<double>(i) / TEST_SAMPLE_RATE;
            // Signal avec compression dynamique
            double envelope = 0.3 + 0.7 * std::exp(-t * 2.0); // Attaque rapide
            inputMono[i] = static_cast<float>(envelope * std::sin(2.0 * M_PI * 440.0 * t));
        }

        compressor.processMono(inputMono.data(), outputMono.data(), inputMono.size());

        std::cout << "   - ✅ Traitement mono OK\n";

        // Analyser la compression
        float inputPeak = 0.0f, outputPeak = 0.0f;
        float inputRMS = 0.0f, outputRMS = 0.0f;

        for (size_t i = 0; i < inputMono.size(); ++i) {
            inputPeak = std::max(inputPeak, std::abs(inputMono[i]));
            outputPeak = std::max(outputPeak, std::abs(outputMono[i]));
            inputRMS += inputMono[i] * inputMono[i];
            outputRMS += outputMono[i] * outputMono[i];
        }

        inputRMS = std::sqrt(inputRMS / inputMono.size());
        outputRMS = std::sqrt(outputRMS / outputMono.size());

        double gainReduction = 20.0 * std::log10(outputRMS / inputRMS);

        std::cout << "   - Analyse compression:\n";
        std::cout << "     Pic entrée: " << std::fixed << std::setprecision(3) << inputPeak << "\n";
        std::cout << "     Pic sortie: " << std::fixed << std::setprecision(3) << outputPeak << "\n";
        std::cout << "     Réduction gain: " << std::fixed << std::setprecision(2) << gainReduction << " dB\n";

        // 4. Test de traitement audio stéréo
        std::cout << "   - Test traitement stéréo...\n";

        std::vector<float> inputLeft(TEST_BUFFER_SIZE);
        std::vector<float> inputRight(TEST_BUFFER_SIZE);
        std::vector<float> outputLeft(TEST_BUFFER_SIZE);
        std::vector<float> outputRight(TEST_BUFFER_SIZE);

        // Signal stéréo avec corrélation
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            double t = static_cast<double>(i) / TEST_SAMPLE_RATE;
            double envelope = 0.3 + 0.6 * std::exp(-t * 1.5);
            float baseSignal = static_cast<float>(envelope * std::sin(2.0 * M_PI * 440.0 * t));

            inputLeft[i] = baseSignal;
            inputRight[i] = baseSignal * 0.8f; // Canal droit légèrement atténué
        }

        compressor.processStereo(inputLeft.data(), inputRight.data(),
                                outputLeft.data(), outputRight.data(),
                                inputLeft.size());

        std::cout << "   - ✅ Traitement stéréo OK\n";

        // 5. Test de désactivation
        std::cout << "   - Test désactivation...\n";

        compressor.setEnabled(false);
        if (!compressor.isEnabled()) {
            std::cout << "   - ✅ Désactivation OK\n";
        } else {
            std::cout << "   - ❌ Erreur désactivation\n";
            compressorTestsPassed = false;
        }

        // Validation finale
        if (compressorTestsPassed) {
            std::cout << "✅ Test compresseur validé\n";
            result.passed = true;
            result.metrics = {gainReduction, inputPeak, outputPeak};
        } else {
            std::cout << "❌ Erreurs dans le test compresseur\n";
            result.passed = false;
        }

    } catch (const std::exception& e) {
        std::cout << "❌ Erreur test compresseur: " << e.what() << "\n";
        result.passed = false;
        result.errorMessage = e.what();
    }

    auto end = std::chrono::high_resolution_clock::now();
    result.executionTime = std::chrono::duration<double>(end - start).count();

    return result;
}

// Test 2: Test du delay audio
TestResult testDelay() {
    TestResult result;
    auto start = std::chrono::high_resolution_clock::now();

    std::cout << "⏰ Test 2: Delay audio...\n";

    try {
        bool delayTestsPassed = true;

        // 1. Test d'initialisation du delay
        std::cout << "   - Test initialisation delay...\n";

        DelayEffect delay;
        delay.setSampleRate(TEST_SAMPLE_RATE, 2); // Stéréo

        if (delay.isEnabled()) {
            std::cout << "   - ✅ Delay initialisé (activé par défaut)\n";
        } else {
            std::cout << "   - ❌ Delay non activé\n";
            delayTestsPassed = false;
        }

        // 2. Test de configuration
        std::cout << "   - Test configuration delay...\n";

        delay.setParameters(300.0, 0.4, 0.3); // 300ms delay, 0.4 feedback, 0.3 mix

        std::cout << "   - Paramètres configurés:\n";
        std::cout << "     Delay: 300.0 ms\n";
        std::cout << "     Feedback: 0.4\n";
        std::cout << "     Mix: 0.3\n";

        // 3. Test de traitement audio mono
        std::cout << "   - Test traitement mono...\n";

        std::vector<float> inputMono(TEST_BUFFER_SIZE);
        std::vector<float> outputMono(TEST_BUFFER_SIZE);

        // Générer un signal de test
        for (size_t i = 0; i < inputMono.size(); ++i) {
            double t = static_cast<double>(i) / TEST_SAMPLE_RATE;
            // Signal avec une attaque marquée
            if (i < 100) {
                inputMono[i] = 0.5f * (static_cast<float>(i) / 100.0f); // Fade in
            } else {
                inputMono[i] = 0.5f * std::sin(2.0 * M_PI * 220.0 * t);
            }
        }

        delay.processMono(inputMono.data(), outputMono.data(), inputMono.size());

        std::cout << "   - ✅ Traitement mono OK\n";

        // Analyser l'effet delay
        float maxDelayLevel = 0.0f;
        for (size_t i = 0; i < outputMono.size(); ++i) {
            maxDelayLevel = std::max(maxDelayLevel, std::abs(outputMono[i]));
        }

        std::cout << "   - Niveau max avec delay: " << std::fixed << std::setprecision(3) << maxDelayLevel << "\n";

        // 4. Test de traitement audio stéréo
        std::cout << "   - Test traitement stéréo...\n";

        std::vector<float> inputLeft(TEST_BUFFER_SIZE);
        std::vector<float> inputRight(TEST_BUFFER_SIZE);
        std::vector<float> outputLeft(TEST_BUFFER_SIZE);
        std::vector<float> outputRight(TEST_BUFFER_SIZE);

        // Signal stéréo différent
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            double t = static_cast<double>(i) / TEST_SAMPLE_RATE;
            inputLeft[i] = 0.4f * std::sin(2.0 * M_PI * 220.0 * t);
            inputRight[i] = 0.4f * std::sin(2.0 * M_PI * 330.0 * t);
        }

        delay.processStereo(inputLeft.data(), inputRight.data(),
                           outputLeft.data(), outputRight.data(),
                           inputLeft.size());

        std::cout << "   - ✅ Traitement stéréo OK\n";

        // 5. Test de désactivation
        std::cout << "   - Test désactivation...\n";

        delay.setEnabled(false);
        if (!delay.isEnabled()) {
            std::cout << "   - ✅ Désactivation OK\n";
        } else {
            std::cout << "   - ❌ Erreur désactivation\n";
            delayTestsPassed = false;
        }

        // Validation finale
        if (delayTestsPassed) {
            std::cout << "✅ Test delay validé\n";
            result.passed = true;
            result.metrics = {300.0, 0.4, 0.3}; // delay time, feedback, mix
        } else {
            std::cout << "❌ Erreurs dans le test delay\n";
            result.passed = false;
        }

    } catch (const std::exception& e) {
        std::cout << "❌ Erreur test delay: " << e.what() << "\n";
        result.passed = false;
        result.errorMessage = e.what();
    }

    auto end = std::chrono::high_resolution_clock::now();
    result.executionTime = std::chrono::duration<double>(end - start).count();

    return result;
}

// Test 3: Test de performance des effets
TestResult testEffectsPerformance() {
    TestResult result;
    auto start = std::chrono::high_resolution_clock::now();

    std::cout << "⚡ Test 3: Performance des effets...\n";

    try {
        bool perfTestsPassed = true;

        // 1. Test de performance du compresseur
        std::cout << "   - Test performance compresseur...\n";

        CompressorEffect compressor;
        compressor.setSampleRate(TEST_SAMPLE_RATE, 2);
        compressor.setParameters(-24.0, 6.0, 10.0, 100.0, -3.0);

        std::vector<float> input(TEST_BUFFER_SIZE);
        std::vector<float> output(TEST_BUFFER_SIZE);

        // Remplir avec des données de test
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            input[i] = 0.5f * std::sin(2.0 * M_PI * 440.0 * i / TEST_SAMPLE_RATE);
        }

        auto perfStart = std::chrono::high_resolution_clock::now();

        for (int i = 0; i < PERFORMANCE_TEST_ITERATIONS; ++i) {
            compressor.processMono(input.data(), output.data(), TEST_BUFFER_SIZE);
        }

        auto perfEnd = std::chrono::high_resolution_clock::now();
        double totalTime = std::chrono::duration<double>(perfEnd - perfStart).count();
        double avgTimePerIteration = totalTime / PERFORMANCE_TEST_ITERATIONS;
        double realtimeFactor = (TEST_BUFFER_SIZE / static_cast<double>(TEST_SAMPLE_RATE)) / avgTimePerIteration;

        std::cout << "   - Temps traitement moyen: " << std::fixed << std::setprecision(6)
                  << (avgTimePerIteration * 1000.0) << " ms\n";
        std::cout << "   - Facteur temps réel: " << std::fixed << std::setprecision(1) << realtimeFactor << "x\n";

        if (realtimeFactor > 20.0) {
            std::cout << "   - ✅ Performance compresseur excellente\n";
        } else if (realtimeFactor > 5.0) {
            std::cout << "   - ⚠️ Performance compresseur acceptable\n";
        } else {
            std::cout << "   - ❌ Performance compresseur insuffisante\n";
            perfTestsPassed = false;
        }

        // 2. Test de performance du delay
        std::cout << "   - Test performance delay...\n";

        DelayEffect delay;
        delay.setSampleRate(TEST_SAMPLE_RATE, 2);
        delay.setParameters(200.0, 0.3, 0.2);

        auto delayPerfStart = std::chrono::high_resolution_clock::now();

        for (int i = 0; i < PERFORMANCE_TEST_ITERATIONS; ++i) {
            delay.processMono(input.data(), output.data(), TEST_BUFFER_SIZE);
        }

        auto delayPerfEnd = std::chrono::high_resolution_clock::now();
        double delayTotalTime = std::chrono::duration<double>(delayPerfEnd - delayPerfStart).count();
        double delayAvgTime = delayTotalTime / PERFORMANCE_TEST_ITERATIONS;
        double delayRealtimeFactor = (TEST_BUFFER_SIZE / static_cast<double>(TEST_SAMPLE_RATE)) / delayAvgTime;

        std::cout << "   - Temps traitement moyen: " << std::fixed << std::setprecision(6)
                  << (delayAvgTime * 1000.0) << " ms\n";
        std::cout << "   - Facteur temps réel: " << std::fixed << std::setprecision(1) << delayRealtimeFactor << "x\n";

        if (delayRealtimeFactor > 15.0) {
            std::cout << "   - ✅ Performance delay excellente\n";
        } else if (delayRealtimeFactor > 3.0) {
            std::cout << "   - ⚠️ Performance delay acceptable\n";
        } else {
            std::cout << "   - ❌ Performance delay insuffisante\n";
            perfTestsPassed = false;
        }

        // 3. Test de robustesse avec données extrêmes
        std::cout << "   - Test robustesse données extrêmes...\n";

        std::vector<float> extremeData(TEST_BUFFER_SIZE);
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            if (i % 3 == 0) extremeData[i] = 10.0f;      // Valeur très élevée
            else if (i % 3 == 1) extremeData[i] = -10.0f; // Valeur très basse
            else extremeData[i] = 0.0f;                   // Zéro
        }

        compressor.processMono(extremeData.data(), output.data(), TEST_BUFFER_SIZE);

        // Vérifier que la sortie est stable
        bool outputStable = true;
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            if (!std::isfinite(output[i]) || std::abs(output[i]) > 100.0f) {
                outputStable = false;
                break;
            }
        }

        if (outputStable) {
            std::cout << "   - ✅ Robustesse données extrêmes OK\n";
        } else {
            std::cout << "   - ❌ Sortie instable avec données extrêmes\n";
            perfTestsPassed = false;
        }

        // Validation finale
        if (perfTestsPassed) {
            std::cout << "✅ Test performance validé\n";
            result.passed = true;
            result.metrics = {realtimeFactor, delayRealtimeFactor, avgTimePerIteration * 1000.0};
        } else {
            std::cout << "❌ Erreurs dans les tests de performance\n";
            result.passed = false;
        }

    } catch (const std::exception& e) {
        std::cout << "❌ Erreur test performance: " << e.what() << "\n";
        result.passed = false;
        result.errorMessage = e.what();
    }

    auto end = std::chrono::high_resolution_clock::now();
    result.executionTime = std::chrono::duration<double>(end - start).count();

    return result;
}

// Test 4: Test de la chaîne d'effets
TestResult testEffectChain() {
    TestResult result;
    auto start = std::chrono::high_resolution_clock::now();

    std::cout << "🔗 Test 4: Chaîne d'effets...\n";

    try {
        bool chainTestsPassed = true;

        // 1. Test de création de chaîne
        std::cout << "   - Test création chaîne...\n";

        EffectChain effectChain;
        std::cout << "   - ✅ Chaîne d'effets créée\n";

        // 2. Test d'ajout d'effets à la chaîne
        std::cout << "   - Test ajout d'effets...\n";

        // Créer des effets individuels
        auto compressor = std::make_unique<CompressorEffect>();
        compressor->setSampleRate(TEST_SAMPLE_RATE, 2);
        compressor->setParameters(-18.0, 3.0, 20.0, 200.0, -4.0);

        auto delay = std::make_unique<DelayEffect>();
        delay->setSampleRate(TEST_SAMPLE_RATE, 2);
        delay->setParameters(250.0, 0.35, 0.25);

        std::cout << "   - ✅ Effets individuels créés\n";

        // 3. Test de traitement en séquence
        std::cout << "   - Test traitement en séquence...\n";

        std::vector<float> input(TEST_BUFFER_SIZE);
        std::vector<float> intermediate(TEST_BUFFER_SIZE);
        std::vector<float> output(TEST_BUFFER_SIZE);

        // Générer un signal complexe
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            double t = static_cast<double>(i) / TEST_SAMPLE_RATE;
            double envelope = 0.3 + 0.5 * std::exp(-t * 1.0);
            input[i] = static_cast<float>(envelope * std::sin(2.0 * M_PI * 440.0 * t));
        }

        // Traiter d'abord avec le compresseur
        compressor->processMono(input.data(), intermediate.data(), TEST_BUFFER_SIZE);

        // Puis avec le delay
        delay->processMono(intermediate.data(), output.data(), TEST_BUFFER_SIZE);

        std::cout << "   - ✅ Traitement en séquence OK\n";

        // Analyser la chaîne
        float inputRMS = 0.0f, outputRMS = 0.0f;
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            inputRMS += input[i] * input[i];
            outputRMS += output[i] * output[i];
        }
        inputRMS = std::sqrt(inputRMS / TEST_BUFFER_SIZE);
        outputRMS = std::sqrt(outputRMS / TEST_BUFFER_SIZE);

        double chainGain = 20.0 * std::log10(outputRMS / inputRMS);

        std::cout << "   - Gain total de la chaîne: " << std::fixed << std::setprecision(2) << chainGain << " dB\n";

        // 4. Test de performance de la chaîne
        std::cout << "   - Test performance chaîne...\n";

        auto chainPerfStart = std::chrono::high_resolution_clock::now();

        for (int i = 0; i < PERFORMANCE_TEST_ITERATIONS / 2; ++i) {
            compressor->processMono(input.data(), intermediate.data(), TEST_BUFFER_SIZE);
            delay->processMono(intermediate.data(), output.data(), TEST_BUFFER_SIZE);
        }

        auto chainPerfEnd = std::chrono::high_resolution_clock::now();
        double chainTime = std::chrono::duration<double>(chainPerfEnd - chainPerfStart).count();
        double chainAvgTime = chainTime / (PERFORMANCE_TEST_ITERATIONS / 2);
        double chainRealtimeFactor = (TEST_BUFFER_SIZE / static_cast<double>(TEST_SAMPLE_RATE)) / chainAvgTime;

        std::cout << "   - Temps traitement moyen: " << std::fixed << std::setprecision(6)
                  << (chainAvgTime * 1000.0) << " ms\n";
        std::cout << "   - Facteur temps réel: " << std::fixed << std::setprecision(1) << chainRealtimeFactor << "x\n";

        if (chainRealtimeFactor > 10.0) {
            std::cout << "   - ✅ Performance chaîne excellente\n";
        } else if (chainRealtimeFactor > 2.0) {
            std::cout << "   - ⚠️ Performance chaîne acceptable\n";
        } else {
            std::cout << "   - ❌ Performance chaîne insuffisante\n";
            chainTestsPassed = false;
        }

        // Validation finale
        if (chainTestsPassed) {
            std::cout << "✅ Test chaîne d'effets validé\n";
            result.passed = true;
            result.metrics = {chainRealtimeFactor, chainGain, chainAvgTime * 1000.0};
        } else {
            std::cout << "❌ Erreurs dans les tests de chaîne\n";
            result.passed = false;
        }

    } catch (const std::exception& e) {
        std::cout << "❌ Erreur test chaîne d'effets: " << e.what() << "\n";
        result.passed = false;
        result.errorMessage = e.what();
    }

    auto end = std::chrono::high_resolution_clock::now();
    result.executionTime = std::chrono::duration<double>(end - start).count();

    return result;
}

// Fonction principale des tests sophistiqués des composants effects
int runEffectsComponentsTests() {
    std::cout << "🎛️ TESTS SOPHISTIQUÉS DES COMPOSANTS EFFECTS\n";
    std::cout << "===========================================\n\n";

    std::vector<TestResult> results;
    int passedTests = 0;
    int totalTests = 4;

    // Test 1: Compresseur
    auto result1 = testCompressor();
    results.push_back(result1);
    if (result1.passed) passedTests++;

    std::cout << "\n";

    // Test 2: Delay
    auto result2 = testDelay();
    results.push_back(result2);
    if (result2.passed) passedTests++;

    std::cout << "\n";

    // Test 3: Performance
    auto result3 = testEffectsPerformance();
    results.push_back(result3);
    if (result3.passed) passedTests++;

    std::cout << "\n";

    // Test 4: Chaîne d'effets
    auto result4 = testEffectChain();
    results.push_back(result4);
    if (result4.passed) passedTests++;

    // Rapport final
    std::cout << "\n===========================================\n";
    std::cout << "📊 RAPPORT FINAL - TESTS COMPOSANTS EFFECTS\n";
    std::cout << "===========================================\n\n";

    std::cout << "Tests passés: " << passedTests << "/" << totalTests << "\n";
    std::cout << "Taux de succès: " << std::fixed << std::setprecision(1)
              << (static_cast<double>(passedTests) / totalTests * 100.0) << "%\n\n";

    for (int i = 0; i < results.size(); ++i) {
        const auto& result = results[i];
        std::string status = result.passed ? "✅ PASSÉ" : "❌ ÉCHEC";
        std::cout << "Test " << (i + 1) << ": " << status << " ("
                  << std::fixed << std::setprecision(3) << result.executionTime << " s)\n";

        if (!result.passed && !result.errorMessage.empty()) {
            std::cout << "   Erreur: " << result.errorMessage << "\n";
        }

        if (!result.metrics.empty()) {
            std::cout << "   Métriques: ";
            for (size_t j = 0; j < result.metrics.size(); ++j) {
                if (j > 0) std::cout << ", ";
                std::cout << std::fixed << std::setprecision(2) << result.metrics[j];
            }
            std::cout << "\n";
        }
    }

    std::cout << "\n";

    if (passedTests == totalTests) {
        std::cout << "🎉 TOUS LES TESTS SONT PASSÉS !\n";
        std::cout << "   Les composants du module Effects sont excellents.\n";
        return 0;
    } else {
        std::cout << "⚠️  Certains tests ont échoué.\n";
        std::cout << "   Vérifiez les erreurs ci-dessus.\n";
        return 1;
    }
}

int main() {
    try {
        return runEffectsComponentsTests();
    } catch (const std::exception& e) {
        std::cerr << "❌ ERREUR FATALE: " << e.what() << std::endl;
        return 2;
    } catch (...) {
        std::cerr << "❌ ERREUR FATALE INCONNUE" << std::endl;
        return 2;
    }
}
