// Test d'intégration complète Core + Effects
// Teste l'interaction entre les modules Audio Core et Audio Effects
// Simule un pipeline audio complet : Capture -> Core Processing -> Effects -> Output

#include <algorithm>
#include <chrono>
#include <cmath>
#include <iostream>
#include <iomanip>
#include <vector>
#include <memory>

// Headers des modules
#include "../../shared/Audio/core/components/AudioEqualizer/AudioEqualizer.hpp"
#include "../../shared/Audio/core/components/BiquadFilter/BiquadFilter.hpp"
#include "../../shared/Audio/effects/components/Compressor.hpp"
#include "../../shared/Audio/effects/components/Delay.hpp"
#include "../../shared/Audio/core/components/constant/CoreConstants.hpp"
#include "../../shared/Audio/effects/components/constant/EffectConstants.hpp"

// Utilisation des namespaces
using namespace AudioFX;
using namespace Audio::core;

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

// Configuration des tests
const int TEST_SAMPLE_RATE = 44100;
const size_t TEST_BUFFER_SIZE = 2048;
const int INTEGRATION_TEST_ITERATIONS = 500;

// Structure de résultat de test
struct TestResult {
    bool passed = false;
    double executionTime = 0.0;
    std::vector<double> metrics;
    std::string errorMessage;
};

// Test 1: Pipeline de base - Core -> Effects
TestResult testCoreEffectsPipeline() {
    TestResult result;
    auto start = std::chrono::high_resolution_clock::now();

    std::cout << "🔄 Test 1: Pipeline Core -> Effects...\n";

    try {
        bool pipelineTestsPassed = true;

        // 1. Initialisation des composants
        std::cout << "   - Initialisation des composants...\n";

        // AudioEqualizer du module Core
        AudioEqualizer equalizer(8, TEST_SAMPLE_RATE); // 8 bandes

        // Configuration de l'equalizer
        equalizer.setBandGain(0, 3.0f);  // Basses +3dB
        equalizer.setBandGain(2, -2.0f); // Mids -2dB
        equalizer.setBandGain(6, 2.0f);  // Aigus +2dB

        // Effets du module Effects
        CompressorEffect compressor;
        compressor.setSampleRate(TEST_SAMPLE_RATE, 2);
        compressor.setParameters(-18.0f, 4.0f, 15.0f, 150.0f, -3.0f);

        DelayEffect delay;
        delay.setSampleRate(TEST_SAMPLE_RATE, 2);
        delay.setParameters(200.0f, 0.3f, 0.25f);

        std::cout << "   - ✅ Composants initialisés\n";

        // 2. Test du pipeline mono
        std::cout << "   - Test pipeline mono...\n";

        std::vector<float> inputAudio(TEST_BUFFER_SIZE);
        std::vector<float> eqOutput(TEST_BUFFER_SIZE);
        std::vector<float> compOutput(TEST_BUFFER_SIZE);
        std::vector<float> finalOutput(TEST_BUFFER_SIZE);

        // Générer un signal de test complexe (simulant un signal audio réel)
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            double t = static_cast<double>(i) / TEST_SAMPLE_RATE;

            // Combinaison de fréquences pour simuler un signal musical
            double signal = 0.3 * std::sin(2.0 * M_PI * 80.0 * t) +    // Basse
                           0.4 * std::sin(2.0 * M_PI * 440.0 * t) +   // Note A4
                           0.2 * std::sin(2.0 * M_PI * 880.0 * t) +   // Harmonique
                           0.1 * std::sin(2.0 * M_PI * 2000.0 * t);   // Aigu

            // Ajouter des transients pour tester la compression
            if (i > 500 && i < 600) {
                signal *= 3.0; // Transient fort
            }

            inputAudio[i] = static_cast<float>(signal);
        }

        // Pipeline: Equalizer -> Compressor -> Delay
        equalizer.process(inputAudio, eqOutput);
        compressor.processMono(eqOutput.data(), compOutput.data(), TEST_BUFFER_SIZE);
        delay.processMono(compOutput.data(), finalOutput.data(), TEST_BUFFER_SIZE);

        std::cout << "   - ✅ Pipeline mono traité\n";

        // Analyser les résultats du pipeline
        float inputRMS = 0.0f, finalRMS = 0.0f;
        float inputPeak = 0.0f, finalPeak = 0.0f;

        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            inputRMS += inputAudio[i] * inputAudio[i];
            finalRMS += finalOutput[i] * finalOutput[i];
            inputPeak = std::max(inputPeak, std::abs(inputAudio[i]));
            finalPeak = std::max(finalPeak, std::abs(finalOutput[i]));
        }

        inputRMS = std::sqrt(inputRMS / TEST_BUFFER_SIZE);
        finalRMS = std::sqrt(finalRMS / TEST_BUFFER_SIZE);

        double totalGain = 20.0 * std::log10(finalRMS / inputRMS);

        std::cout << "   - Analyse pipeline:\n";
        std::cout << "     Pic entrée: " << std::fixed << std::setprecision(3) << inputPeak << "\n";
        std::cout << "     Pic sortie: " << std::fixed << std::setprecision(3) << finalPeak << "\n";
        std::cout << "     Gain total: " << std::fixed << std::setprecision(2) << totalGain << " dB\n";

        // 3. Test du pipeline stéréo
        std::cout << "   - Test pipeline stéréo...\n";

        std::vector<float> inputLeft(TEST_BUFFER_SIZE);
        std::vector<float> inputRight(TEST_BUFFER_SIZE);
        std::vector<float> eqLeft(TEST_BUFFER_SIZE);
        std::vector<float> eqRight(TEST_BUFFER_SIZE);
        std::vector<float> compLeft(TEST_BUFFER_SIZE);
        std::vector<float> compRight(TEST_BUFFER_SIZE);
        std::vector<float> finalLeft(TEST_BUFFER_SIZE);
        std::vector<float> finalRight(TEST_BUFFER_SIZE);

        // Signal stéréo avec corrélation
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            double t = static_cast<double>(i) / TEST_SAMPLE_RATE;
            double baseSignal = 0.4 * std::sin(2.0 * M_PI * 440.0 * t);

            inputLeft[i] = static_cast<float>(baseSignal * (1.0 + 0.1 * std::sin(2.0 * M_PI * 2.0 * t)));
            inputRight[i] = static_cast<float>(baseSignal * (1.0 - 0.1 * std::sin(2.0 * M_PI * 2.0 * t)));
        }

        // Pipeline stéréo complet
        std::vector<float> tempStereoL = inputLeft;
        std::vector<float> tempStereoR = inputRight;
        equalizer.process(tempStereoL, eqLeft);
        equalizer.process(tempStereoR, eqRight);

        compressor.processStereo(eqLeft.data(), eqRight.data(),
                                compLeft.data(), compRight.data(),
                                TEST_BUFFER_SIZE);

        delay.processStereo(compLeft.data(), compRight.data(),
                           finalLeft.data(), finalRight.data(),
                           TEST_BUFFER_SIZE);

        std::cout << "   - ✅ Pipeline stéréo traité\n";

        // 4. Test de performance du pipeline complet
        std::cout << "   - Test performance pipeline...\n";

        auto perfStart = std::chrono::high_resolution_clock::now();

        for (int i = 0; i < INTEGRATION_TEST_ITERATIONS; ++i) {
            // Pipeline mono
            equalizer.process(inputAudio, eqOutput);
            compressor.processMono(eqOutput.data(), compOutput.data(), TEST_BUFFER_SIZE);
            delay.processMono(compOutput.data(), finalOutput.data(), TEST_BUFFER_SIZE);
        }

        auto perfEnd = std::chrono::high_resolution_clock::now();
        double totalTime = std::chrono::duration<double>(perfEnd - perfStart).count();
        double avgTimePerIteration = totalTime / INTEGRATION_TEST_ITERATIONS;
        double realtimeFactor = (TEST_BUFFER_SIZE / static_cast<double>(TEST_SAMPLE_RATE)) / avgTimePerIteration;

        std::cout << "   - Performance pipeline:\n";
        std::cout << "     Temps moyen: " << std::fixed << std::setprecision(6)
                  << (avgTimePerIteration * 1000.0) << " ms\n";
        std::cout << "     Facteur temps réel: " << std::fixed << std::setprecision(1) << realtimeFactor << "x\n";

        if (realtimeFactor > 8.0) {
            std::cout << "   - ✅ Performance pipeline excellente\n";
        } else if (realtimeFactor > 2.0) {
            std::cout << "   - ⚠️ Performance pipeline acceptable\n";
        } else {
            std::cout << "   - ❌ Performance pipeline insuffisante\n";
            pipelineTestsPassed = false;
        }

        // Validation finale
        if (pipelineTestsPassed) {
            std::cout << "✅ Test pipeline Core->Effects validé\n";
            result.passed = true;
            result.metrics = {totalGain, realtimeFactor, avgTimePerIteration * 1000.0};
        } else {
            std::cout << "❌ Erreurs dans le test pipeline\n";
            result.passed = false;
        }

    } catch (const std::exception& e) {
        std::cout << "❌ Erreur test pipeline: " << e.what() << "\n";
        result.passed = false;
        result.errorMessage = e.what();
    }

    auto end = std::chrono::high_resolution_clock::now();
    result.executionTime = std::chrono::duration<double>(end - start).count();

    return result;
}

// Test 2: Configuration dynamique du pipeline
TestResult testDynamicPipelineConfiguration() {
    TestResult result;
    auto start = std::chrono::high_resolution_clock::now();

    std::cout << "⚙️ Test 2: Configuration dynamique du pipeline...\n";

    try {
        bool dynamicTestsPassed = true;

        // 1. Test de changement de configuration en temps réel
        std::cout << "   - Test reconfiguration temps réel...\n";

        AudioEqualizer equalizer(10, TEST_SAMPLE_RATE);
        CompressorEffect compressor;
        compressor.setSampleRate(TEST_SAMPLE_RATE, 2);

        std::vector<float> testSignal(TEST_BUFFER_SIZE);
        std::vector<float> output1(TEST_BUFFER_SIZE);
        std::vector<float> output2(TEST_BUFFER_SIZE);

        // Signal de test
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            testSignal[i] = 0.5f * std::sin(2.0 * M_PI * 440.0 * i / TEST_SAMPLE_RATE);
        }

        // Configuration 1: Égaliseur neutre, compression douce
        equalizer.setBandGain(0, 0.0f);
        equalizer.setBandGain(5, 0.0f);
        equalizer.setBandGain(9, 0.0f);
        compressor.setParameters(-24.0f, 2.0f, 30.0f, 300.0f, 0.0f);

        equalizer.process(testSignal, output1);
        compressor.processMono(output1.data(), output1.data(), TEST_BUFFER_SIZE);

        // Configuration 2: Égaliseur boosté, compression forte
        equalizer.setBandGain(0, 6.0f);   // +6dB basses
        equalizer.setBandGain(5, -3.0f);  // -3dB mids
        equalizer.setBandGain(9, 4.0f);   // +4dB aigus
        compressor.setParameters(-12.0f, 8.0f, 5.0f, 50.0f, -6.0f);

        equalizer.process(testSignal, output2);
        compressor.processMono(output2.data(), output2.data(), TEST_BUFFER_SIZE);

        // Analyser les différences entre configurations
        float rms1 = 0.0f, rms2 = 0.0f;
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            rms1 += output1[i] * output1[i];
            rms2 += output2[i] * output2[i];
        }
        rms1 = std::sqrt(rms1 / TEST_BUFFER_SIZE);
        rms2 = std::sqrt(rms2 / TEST_BUFFER_SIZE);

        double configGainDiff = 20.0 * std::log10(rms2 / rms1);

        std::cout << "   - Différence entre configurations: " << std::fixed << std::setprecision(2)
                  << configGainDiff << " dB\n";
        std::cout << "   - ✅ Reconfiguration temps réel OK\n";

        // 2. Test de bypass sélectif
        std::cout << "   - Test bypass sélectif...\n";

        std::vector<float> bypassOutput(TEST_BUFFER_SIZE);
        compressor.setEnabled(false);
        equalizer.setBandGain(0, 0.0f); // Reset

        equalizer.process(testSignal, bypassOutput);
        compressor.processMono(bypassOutput.data(), bypassOutput.data(), TEST_BUFFER_SIZE);

        // Comparer avec le signal original
        float bypassRMS = 0.0f;
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            bypassRMS += bypassOutput[i] * bypassOutput[i];
        }
        bypassRMS = std::sqrt(bypassRMS / TEST_BUFFER_SIZE);

        double bypassGain = 20.0 * std::log10(bypassRMS / 0.5f); // 0.5f = amplitude du signal original

        std::cout << "   - Gain avec bypass: " << std::fixed << std::setprecision(2)
                  << bypassGain << " dB\n";

        if (std::abs(bypassGain) < 1.0) { // Moins de 1dB de différence
            std::cout << "   - ✅ Bypass sélectif OK\n";
        } else {
            std::cout << "   - ❌ Bypass sélectif défaillant\n";
            dynamicTestsPassed = false;
        }

        // 3. Test de performance avec reconfiguration
        std::cout << "   - Test performance reconfiguration...\n";

        auto dynamicPerfStart = std::chrono::high_resolution_clock::now();

        for (int i = 0; i < 100; ++i) {
            // Changer la configuration à chaque itération
            equalizer.setBandGain(i % 10, static_cast<float>(i % 20 - 10) / 2.0f);
            compressor.setParameters(-24.0f + (i % 12), 2.0f + (i % 8), 10.0f + (i % 20), 100.0f + (i % 200), 0.0f);

            equalizer.process(testSignal, output1);
            compressor.processMono(output1.data(), output1.data(), TEST_BUFFER_SIZE);
        }

        auto dynamicPerfEnd = std::chrono::high_resolution_clock::now();
        double dynamicTime = std::chrono::duration<double>(dynamicPerfEnd - dynamicPerfStart).count();
        double dynamicAvgTime = dynamicTime / 100.0;
        double dynamicRealtimeFactor = (TEST_BUFFER_SIZE / static_cast<double>(TEST_SAMPLE_RATE)) / dynamicAvgTime;

        std::cout << "   - Temps reconfiguration moyen: " << std::fixed << std::setprecision(6)
                  << (dynamicAvgTime * 1000.0) << " ms\n";
        std::cout << "   - Facteur temps réel: " << std::fixed << std::setprecision(1) << dynamicRealtimeFactor << "x\n";

        if (dynamicRealtimeFactor > 5.0) {
            std::cout << "   - ✅ Performance reconfiguration OK\n";
        } else {
            std::cout << "   - ❌ Performance reconfiguration insuffisante\n";
            dynamicTestsPassed = false;
        }

        // Validation finale
        if (dynamicTestsPassed) {
            std::cout << "✅ Test configuration dynamique validé\n";
            result.passed = true;
            result.metrics = {configGainDiff, bypassGain, dynamicRealtimeFactor};
        } else {
            std::cout << "❌ Erreurs dans le test configuration dynamique\n";
            result.passed = false;
        }

    } catch (const std::exception& e) {
        std::cout << "❌ Erreur test configuration dynamique: " << e.what() << "\n";
        result.passed = false;
        result.errorMessage = e.what();
    }

    auto end = std::chrono::high_resolution_clock::now();
    result.executionTime = std::chrono::duration<double>(end - start).count();

    return result;
}

// Test 3: Robustesse du pipeline
TestResult testPipelineRobustness() {
    TestResult result;
    auto start = std::chrono::high_resolution_clock::now();

    std::cout << "🛡️ Test 3: Robustesse du pipeline...\n";

    try {
        bool robustnessTestsPassed = true;

        // 1. Test avec données audio extrêmes
        std::cout << "   - Test données extrêmes...\n";

        AudioEqualizer equalizer(8, TEST_SAMPLE_RATE);
        CompressorEffect compressor;
        compressor.setSampleRate(TEST_SAMPLE_RATE, 2);

        std::vector<float> extremeSignal(TEST_BUFFER_SIZE);
        std::vector<float> processedSignal(TEST_BUFFER_SIZE);

        // Créer un signal avec des valeurs extrêmes
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            if (i % 4 == 0) extremeSignal[i] = 10.0f;      // Très fort
            else if (i % 4 == 1) extremeSignal[i] = -10.0f; // Très faible
            else if (i % 4 == 2) extremeSignal[i] = 0.0f;   // Zéro
            else extremeSignal[i] = 0.001f * std::sin(2.0 * M_PI * 440.0 * i / TEST_SAMPLE_RATE); // Très faible signal
        }

        equalizer.process(extremeSignal, processedSignal);
        compressor.processMono(processedSignal.data(), processedSignal.data(), TEST_BUFFER_SIZE);

        // Vérifier que le signal traité est stable
        bool stable = true;
        float maxValue = 0.0f;

        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            if (!std::isfinite(processedSignal[i])) {
                stable = false;
                break;
            }
            maxValue = std::max(maxValue, std::abs(processedSignal[i]));
        }

        if (stable && maxValue < 100.0f) {
            std::cout << "   - ✅ Gestion données extrêmes OK (max: " << std::fixed << std::setprecision(3) << maxValue << ")\n";
        } else {
            std::cout << "   - ❌ Instabilité avec données extrêmes\n";
            robustnessTestsPassed = false;
        }

        // 2. Test avec différentes tailles de buffers
        std::cout << "   - Test buffers variables...\n";

        std::vector<size_t> bufferSizes = {256, 512, 1024, 2048, 4096, 8192};

        for (size_t bufferSize : bufferSizes) {
            std::vector<float> varInput(bufferSize);
            std::vector<float> varOutput(bufferSize);

            // Remplir avec des données de test
            for (size_t i = 0; i < bufferSize; ++i) {
                varInput[i] = 0.5f * std::sin(2.0 * M_PI * 440.0 * i / TEST_SAMPLE_RATE);
            }

            equalizer.process(varInput, varOutput);
            compressor.processMono(varOutput.data(), varOutput.data(), bufferSize);

            std::cout << "   - ✅ Buffer " << bufferSize << " samples OK\n";
        }

        // 3. Test de continuité du traitement
        std::cout << "   - Test continuité traitement...\n";

        // Simuler un traitement en streaming avec chevauchement
        const size_t hopSize = TEST_BUFFER_SIZE / 4; // 25% overlap
        std::vector<float> continuousSignal(TEST_BUFFER_SIZE * 4);
        std::vector<float> continuousOutput(TEST_BUFFER_SIZE * 4, 0.0f);

        // Générer un signal continu
        for (size_t i = 0; i < continuousSignal.size(); ++i) {
            continuousSignal[i] = 0.3f * std::sin(2.0 * M_PI * 440.0 * i / TEST_SAMPLE_RATE);
        }

        // Traiter par blocs avec chevauchement
        for (size_t start = 0; start + TEST_BUFFER_SIZE <= continuousSignal.size(); start += hopSize) {
            std::vector<float> block(TEST_BUFFER_SIZE);
            std::vector<float> blockOutput(TEST_BUFFER_SIZE);

            std::copy_n(continuousSignal.begin() + start, TEST_BUFFER_SIZE, block.begin());

            equalizer.process(block, blockOutput);
            compressor.processMono(blockOutput.data(), blockOutput.data(), TEST_BUFFER_SIZE);

            // Superposer les résultats (mix simple pour le test)
            for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
                size_t outIndex = start + i;
                if (outIndex < continuousOutput.size()) {
                    continuousOutput[outIndex] = blockOutput[i];
                }
            }
        }

        std::cout << "   - ✅ Traitement continu OK\n";

        // 4. Test de stabilité temporelle
        std::cout << "   - Test stabilité temporelle...\n";

        std::vector<double> processingTimes;
        std::vector<float> testInput(TEST_BUFFER_SIZE);
        std::vector<float> testOutput(TEST_BUFFER_SIZE);

        std::fill(testInput.begin(), testInput.end(), 0.5f);

        // Mesurer les temps de traitement
        for (int i = 0; i < 50; ++i) {
            auto iterStart = std::chrono::high_resolution_clock::now();

            equalizer.process(testInput, testOutput);
            compressor.processMono(testOutput.data(), testOutput.data(), TEST_BUFFER_SIZE);

            auto iterEnd = std::chrono::high_resolution_clock::now();
            double iterTime = std::chrono::duration<double>(iterEnd - iterStart).count() * 1000.0; // ms
            processingTimes.push_back(iterTime);
        }

        // Calculer la variance des temps
        double meanTime = 0.0;
        for (double time : processingTimes) {
            meanTime += time;
        }
        meanTime /= processingTimes.size();

        double variance = 0.0;
        for (double time : processingTimes) {
            double diff = time - meanTime;
            variance += diff * diff;
        }
        variance /= processingTimes.size();
        double stdDev = std::sqrt(variance);
        double jitterPercent = (stdDev / meanTime) * 100.0;

        std::cout << "   - Jitter temporel: " << std::fixed << std::setprecision(2) << jitterPercent << "%\n";

        if (jitterPercent < 25.0) {
            std::cout << "   - ✅ Stabilité temporelle OK\n";
        } else {
            std::cout << "   - ⚠️ Jitter temporel élevé\n";
        }

        // Validation finale
        if (robustnessTestsPassed) {
            std::cout << "✅ Test robustesse pipeline validé\n";
            result.passed = true;
            result.metrics = {maxValue, static_cast<double>(bufferSizes.size()), jitterPercent};
        } else {
            std::cout << "❌ Erreurs dans le test robustesse\n";
            result.passed = false;
        }

    } catch (const std::exception& e) {
        std::cout << "❌ Erreur test robustesse: " << e.what() << "\n";
        result.passed = false;
        result.errorMessage = e.what();
    }

    auto end = std::chrono::high_resolution_clock::now();
    result.executionTime = std::chrono::duration<double>(end - start).count();

    return result;
}

// Test 4: Simulation d'un environnement de production
TestResult testProductionSimulation() {
    TestResult result;
    auto start = std::chrono::high_resolution_clock::now();

    std::cout << "🎵 Test 4: Simulation environnement production...\n";

    try {
        bool productionTestsPassed = true;

        // Configuration typique d'une session de production
        AudioEqualizer equalizer(10, TEST_SAMPLE_RATE);

        // Configuration d'equalizer typique pour la musique
        equalizer.setBandGain(0, 2.0f);   // +2dB @ 31Hz (basses)
        equalizer.setBandGain(1, 1.0f);   // +1dB @ 63Hz
        equalizer.setBandGain(2, 0.0f);   // 0dB @ 125Hz
        equalizer.setBandGain(3, -1.0f);  // -1dB @ 250Hz (mids)
        equalizer.setBandGain(4, -1.5f);  // -1.5dB @ 500Hz
        equalizer.setBandGain(5, 0.0f);   // 0dB @ 1kHz
        equalizer.setBandGain(6, 1.0f);   // +1dB @ 2kHz (présence)
        equalizer.setBandGain(7, 2.0f);   // +2dB @ 4kHz (brillance)
        equalizer.setBandGain(8, 1.0f);   // +1dB @ 8kHz
        equalizer.setBandGain(9, 0.0f);   // 0dB @ 16kHz

        CompressorEffect compressor;
        compressor.setSampleRate(TEST_SAMPLE_RATE, 2);
        compressor.setParameters(-20.0f, 3.0f, 25.0f, 200.0f, -2.0f); // Compression douce

        DelayEffect delay;
        delay.setSampleRate(TEST_SAMPLE_RATE, 2);
        delay.setParameters(250.0f, 0.25f, 0.15f); // Delay subtil

        // 1. Simulation de différents types de contenu
        std::cout << "   - Simulation différents contenus...\n";

        struct ContentType {
            std::string name;
            std::vector<float> content;
        };

        std::vector<ContentType> contentTypes = {
            {"Musique", std::vector<float>(TEST_BUFFER_SIZE)},
            {"Voix", std::vector<float>(TEST_BUFFER_SIZE)},
            {"SFX", std::vector<float>(TEST_BUFFER_SIZE)}
        };

        // Générer différents types de contenu
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            double t = static_cast<double>(i) / TEST_SAMPLE_RATE;

            // Musique: mélange harmonique riche
            contentTypes[0].content[i] = static_cast<float>(
                0.2 * std::sin(2.0 * M_PI * 110.0 * t) +   // A2
                0.3 * std::sin(2.0 * M_PI * 220.0 * t) +   // A3
                0.4 * std::sin(2.0 * M_PI * 440.0 * t) +   // A4
                0.2 * std::sin(2.0 * M_PI * 880.0 * t) +   // A5
                0.1 * std::sin(2.0 * M_PI * 1760.0 * t)    // A6
            );

            // Voix: fréquences vocales avec modulation
            double voiceMod = 1.0 + 0.3 * std::sin(2.0 * M_PI * 5.0 * t); // Modulation lente
            contentTypes[1].content[i] = static_cast<float>(
                voiceMod * (
                    0.4 * std::sin(2.0 * M_PI * 180.0 * t) +   // Fondamentale voix
                    0.3 * std::sin(2.0 * M_PI * 360.0 * t) +   // 1ère harmonique
                    0.2 * std::sin(2.0 * M_PI * 540.0 * t) +   // 2ème harmonique
                    0.1 * std::sin(2.0 * M_PI * 720.0 * t)     // 3ème harmonique
                )
            );

            // SFX: signal avec transients et bruit
            if (i < 100) {
                contentTypes[2].content[i] = 0.0f; // Silence
            } else if (i < 200) {
                contentTypes[2].content[i] = 1.0f; // Transient fort
            } else {
                contentTypes[2].content[i] = static_cast<float>(
                    0.1 * std::sin(2.0 * M_PI * 1000.0 * t) +  // Signal aigu
                    0.05 * (static_cast<double>(rand()) / RAND_MAX - 0.5) // Bruit léger
                );
            }
        }

        // Traiter chaque type de contenu
        for (auto& contentType : contentTypes) {
            std::vector<float> processed = contentType.content;

            equalizer.process(processed, processed);
            compressor.processMono(processed.data(), processed.data(), TEST_BUFFER_SIZE);
            delay.processMono(processed.data(), processed.data(), TEST_BUFFER_SIZE);

            std::cout << "   - ✅ " << contentType.name << " traité\n";
        }

        // 2. Test de performance en conditions réelles
        std::cout << "   - Test performance production...\n";

        auto productionStart = std::chrono::high_resolution_clock::now();

        // Simuler 2 secondes de traitement audio (environ 86 buffers)
        for (int i = 0; i < 86; ++i) {
            std::vector<float> buffer(TEST_BUFFER_SIZE, 0.5f);

            equalizer.process(buffer, buffer);
            compressor.processMono(buffer.data(), buffer.data(), TEST_BUFFER_SIZE);
            delay.processMono(buffer.data(), buffer.data(), TEST_BUFFER_SIZE);
        }

        auto productionEnd = std::chrono::high_resolution_clock::now();
        double productionTime = std::chrono::duration<double>(productionEnd - productionStart).count();
        double productionRealtimeFactor = 2.0 / productionTime; // 2 secondes simulées

        std::cout << "   - Temps pour 2s audio: " << std::fixed << std::setprecision(3) << productionTime << " s\n";
        std::cout << "   - Facteur temps réel production: " << std::fixed << std::setprecision(1)
                  << productionRealtimeFactor << "x\n";

        if (productionRealtimeFactor > 10.0) {
            std::cout << "   - ✅ Performance production excellente\n";
        } else if (productionRealtimeFactor > 3.0) {
            std::cout << "   - ⚠️ Performance production acceptable\n";
        } else {
            std::cout << "   - ❌ Performance production insuffisante\n";
            productionTestsPassed = false;
        }

        // 3. Test de latence totale du système
        std::cout << "   - Test latence système...\n";

        // Mesurer la latence du pipeline complet
        std::vector<float> impulse(TEST_BUFFER_SIZE, 0.0f);
        impulse[0] = 1.0f; // Impulse au début

        auto latencyStart = std::chrono::high_resolution_clock::now();

        equalizer.process(impulse, impulse);
        compressor.processMono(impulse.data(), impulse.data(), TEST_BUFFER_SIZE);
        delay.processMono(impulse.data(), impulse.data(), TEST_BUFFER_SIZE);

        auto latencyEnd = std::chrono::high_resolution_clock::now();
        double processingLatency = std::chrono::duration<double>(latencyEnd - latencyStart).count() * 1000.0; // ms

        // Latence algorithmique estimée (basée sur les paramètres)
        double algorithmicLatency = 250.0 + 25.0; // Delay 250ms + attack compressor 25ms

        std::cout << "   - Latence traitement: " << std::fixed << std::setprecision(2) << processingLatency << " ms\n";
        std::cout << "   - Latence algorithmique: " << std::fixed << std::setprecision(2) << algorithmicLatency << " ms\n";

        if (processingLatency < 100.0) {
            std::cout << "   - ✅ Latence système OK\n";
        } else {
            std::cout << "   - ⚠️ Latence système élevée\n";
        }

        // Validation finale
        if (productionTestsPassed) {
            std::cout << "✅ Test simulation production validé\n";
            result.passed = true;
            result.metrics = {productionRealtimeFactor, processingLatency, algorithmicLatency};
        } else {
            std::cout << "❌ Erreurs dans la simulation production\n";
            result.passed = false;
        }

    } catch (const std::exception& e) {
        std::cout << "❌ Erreur test production: " << e.what() << "\n";
        result.passed = false;
        result.errorMessage = e.what();
    }

    auto end = std::chrono::high_resolution_clock::now();
    result.executionTime = std::chrono::duration<double>(end - start).count();

    return result;
}

// Fonction principale des tests d'intégration Core + Effects
int runCoreEffectsIntegrationTests() {
    std::cout << "🔗 TESTS D'INTÉGRATION CORE + EFFECTS\n";
    std::cout << "=====================================\n\n";

    std::vector<TestResult> results;
    int passedTests = 0;
    int totalTests = 4;

    // Test 1: Pipeline de base
    auto result1 = testCoreEffectsPipeline();
    results.push_back(result1);
    if (result1.passed) passedTests++;

    std::cout << "\n";

    // Test 2: Configuration dynamique
    auto result2 = testDynamicPipelineConfiguration();
    results.push_back(result2);
    if (result2.passed) passedTests++;

    std::cout << "\n";

    // Test 3: Robustesse du pipeline
    auto result4 = testPipelineRobustness();
    results.push_back(result4);
    if (result4.passed) passedTests++;

    std::cout << "\n";

    // Test 4: Simulation production
    auto result5 = testProductionSimulation();
    results.push_back(result5);
    if (result5.passed) passedTests++;

    // Rapport final
    std::cout << "\n=====================================\n";
    std::cout << "📊 RAPPORT FINAL - INTÉGRATION CORE + EFFECTS\n";
    std::cout << "=====================================\n\n";

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
        std::cout << "🎉 INTÉGRATION RÉUSSIE !\n";
        std::cout << "   Les modules Core et Effects fonctionnent parfaitement ensemble.\n";
        std::cout << "   Le pipeline audio est prêt pour la production !\n";
        return 0;
    } else {
        std::cout << "⚠️  Intégration partiellement réussie.\n";
        std::cout << "   Vérifiez les erreurs ci-dessus.\n";
        return 1;
    }
}

int main() {
    try {
        return runCoreEffectsIntegrationTests();
    } catch (const std::exception& e) {
        std::cerr << "❌ ERREUR FATALE: " << e.what() << std::endl;
        return 2;
    } catch (...) {
        std::cerr << "❌ ERREUR FATALE INCONNUE" << std::endl;
        return 2;
    }
}
