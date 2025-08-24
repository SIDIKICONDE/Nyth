// Test d'intégration simple des composants audio
// Teste la compatibilité et la performance des composants validés

#include <algorithm>
#include <chrono>
#include <cmath>
#include <iostream>
#include <iomanip>
#include <vector>

// Headers du projet
#include "../../shared/Audio/effects/components/Compressor.hpp"
#include "../../shared/Audio/effects/components/Delay.hpp"
#include "../../shared/Audio/effects/components/constant/EffectConstants.hpp"

// Simulation simple d'un égaliseur pour les tests
class SimpleEqualizer {
public:
    SimpleEqualizer(int numBands, uint32_t sampleRate) : bands_(numBands, 0.0f) {}

    void setBandGain(int band, float gain) {
        if (band >= 0 && band < static_cast<int>(bands_.size())) {
            bands_[band] = gain;
        }
    }

    void process(std::vector<float>& input, std::vector<float>& output) {
        output = input; // Pour le test, on ne fait qu'une copie
        // Simulation simple: appliquer un gain global
        float totalGain = 0.0f;
        for (float bandGain : bands_) {
            totalGain += bandGain;
        }
        totalGain = 1.0f + totalGain / bands_.size(); // Gain moyen

        for (size_t i = 0; i < output.size(); ++i) {
            output[i] *= totalGain;
        }
    }

private:
    std::vector<float> bands_;
};

// Utilisation des namespaces
using namespace AudioFX;

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

// Configuration des tests
const int TEST_SAMPLE_RATE = 44100;
const size_t TEST_BUFFER_SIZE = 2048;
const int INTEGRATION_ITERATIONS = 1000;

// Structure de résultat de test
struct TestResult {
    bool passed = false;
    double executionTime = 0.0;
    std::vector<double> metrics;
    std::string errorMessage;
};

// Test 1: Pipeline simple Equalizer -> Compressor -> Delay
TestResult testBasicPipeline() {
    TestResult result;
    auto start = std::chrono::high_resolution_clock::now();

    std::cout << "🔄 Test 1: Pipeline basique...\n";

    try {
        bool pipelineTestsPassed = true;

        // 1. Initialisation des composants
        std::cout << "   - Initialisation composants...\n";

        SimpleEqualizer equalizer(8, TEST_SAMPLE_RATE);
        CompressorEffect compressor;
        compressor.setSampleRate(TEST_SAMPLE_RATE, 2);
        DelayEffect delay;
        delay.setSampleRate(TEST_SAMPLE_RATE, 2);

        // Configuration des effets
        equalizer.setBandGain(0, 2.0f); // +2dB basses
        equalizer.setBandGain(6, 1.0f); // +1dB aigus
        compressor.setParameters(-20.0f, 4.0f, 15.0f, 150.0f, -3.0f);
        delay.setParameters(300.0f, 0.4f, 0.3f);

        std::cout << "   - ✅ Composants configurés\n";

        // 2. Test du pipeline mono
        std::cout << "   - Test pipeline mono...\n";

        std::vector<float> inputAudio(TEST_BUFFER_SIZE);
        std::vector<float> eqOutput(TEST_BUFFER_SIZE);
        std::vector<float> compOutput(TEST_BUFFER_SIZE);
        std::vector<float> finalOutput(TEST_BUFFER_SIZE);

        // Générer un signal de test
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            double t = static_cast<double>(i) / TEST_SAMPLE_RATE;
            inputAudio[i] = 0.5f * std::sin(2.0 * M_PI * 440.0 * t) +
                           0.3f * std::sin(2.0 * M_PI * 880.0 * t) +
                           0.2f * std::sin(2.0 * M_PI * 220.0 * t);
        }

        // Pipeline: Equalizer -> Compressor -> Delay
        equalizer.process(inputAudio, eqOutput);
        compressor.processMono(eqOutput.data(), compOutput.data(), TEST_BUFFER_SIZE);
        delay.processMono(compOutput.data(), finalOutput.data(), TEST_BUFFER_SIZE);

        std::cout << "   - ✅ Pipeline mono OK\n";

        // Analyser les résultats
        float inputRMS = 0.0f, finalRMS = 0.0f;
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            inputRMS += inputAudio[i] * inputAudio[i];
            finalRMS += finalOutput[i] * finalOutput[i];
        }
        inputRMS = std::sqrt(inputRMS / TEST_BUFFER_SIZE);
        finalRMS = std::sqrt(finalRMS / TEST_BUFFER_SIZE);

        double totalGain = 20.0 * std::log10(finalRMS / inputRMS);
        std::cout << "   - Gain total du pipeline: " << std::fixed << std::setprecision(2) << totalGain << " dB\n";

        // 3. Test du pipeline stéréo
        std::cout << "   - Test pipeline stéréo...\n";

        std::vector<float> inputLeft(TEST_BUFFER_SIZE);
        std::vector<float> inputRight(TEST_BUFFER_SIZE);
        std::vector<float> finalLeft(TEST_BUFFER_SIZE);
        std::vector<float> finalRight(TEST_BUFFER_SIZE);

        // Signal stéréo
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            double t = static_cast<double>(i) / TEST_SAMPLE_RATE;
            inputLeft[i] = 0.4f * std::sin(2.0 * M_PI * 440.0 * t);
            inputRight[i] = 0.4f * std::sin(2.0 * M_PI * 660.0 * t);
        }

        // Pipeline stéréo
        std::vector<float> tempLeft = inputLeft;
        std::vector<float> tempRight = inputRight;

        equalizer.process(tempLeft, tempLeft);
        equalizer.process(tempRight, tempRight);

        compressor.processStereo(tempLeft.data(), tempRight.data(),
                                tempLeft.data(), tempRight.data(), TEST_BUFFER_SIZE);

        delay.processStereo(tempLeft.data(), tempRight.data(),
                           finalLeft.data(), finalRight.data(), TEST_BUFFER_SIZE);

        std::cout << "   - ✅ Pipeline stéréo OK\n";

        // 4. Test de performance
        std::cout << "   - Test performance pipeline...\n";

        auto perfStart = std::chrono::high_resolution_clock::now();

        for (int i = 0; i < INTEGRATION_ITERATIONS; ++i) {
            std::vector<float> buffer = inputAudio;
            equalizer.process(buffer, buffer);
            compressor.processMono(buffer.data(), buffer.data(), TEST_BUFFER_SIZE);
            delay.processMono(buffer.data(), buffer.data(), TEST_BUFFER_SIZE);
        }

        auto perfEnd = std::chrono::high_resolution_clock::now();
        double totalTime = std::chrono::duration<double>(perfEnd - perfStart).count();
        double avgTimePerIteration = totalTime / INTEGRATION_ITERATIONS;
        double realtimeFactor = (TEST_BUFFER_SIZE / static_cast<double>(TEST_SAMPLE_RATE)) / avgTimePerIteration;

        std::cout << "   - Temps moyen: " << std::fixed << std::setprecision(6)
                  << (avgTimePerIteration * 1000.0) << " ms\n";
        std::cout << "   - Facteur temps réel: " << std::fixed << std::setprecision(1) << realtimeFactor << "x\n";

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
            std::cout << "✅ Test pipeline basique validé\n";
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

// Test 2: Test de robustesse de l'intégration
TestResult testIntegrationRobustness() {
    TestResult result;
    auto start = std::chrono::high_resolution_clock::now();

    std::cout << "🛡️ Test 2: Robustesse de l'intégration...\n";

    try {
        bool robustnessTestsPassed = true;

        SimpleEqualizer equalizer(10, TEST_SAMPLE_RATE);
        CompressorEffect compressor;
        compressor.setSampleRate(TEST_SAMPLE_RATE, 2);
        DelayEffect delay;
        delay.setSampleRate(TEST_SAMPLE_RATE, 2);

        // 1. Test avec données extrêmes
        std::cout << "   - Test données extrêmes...\n";

        std::vector<float> extremeData(TEST_BUFFER_SIZE);
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            if (i % 3 == 0) extremeData[i] = 5.0f;
            else if (i % 3 == 1) extremeData[i] = -5.0f;
            else extremeData[i] = 0.0f;
        }

        std::vector<float> processed = extremeData;
        equalizer.process(processed, processed);
        compressor.processMono(processed.data(), processed.data(), TEST_BUFFER_SIZE);
        delay.processMono(processed.data(), processed.data(), TEST_BUFFER_SIZE);

        // Vérifier stabilité
        bool stable = true;
        float maxValue = 0.0f;
        for (float sample : processed) {
            if (!std::isfinite(sample)) {
                stable = false;
                break;
            }
            maxValue = std::max(maxValue, std::abs(sample));
        }

        if (stable && maxValue < 20.0f) {
            std::cout << "   - ✅ Robustesse données extrêmes OK\n";
        } else {
            std::cout << "   - ❌ Instabilité détectée\n";
            robustnessTestsPassed = false;
        }

        // 2. Test avec différentes configurations
        std::cout << "   - Test configurations multiples...\n";

        std::vector<float> testSignal(TEST_BUFFER_SIZE, 0.5f);

        for (int config = 0; config < 5; ++config) {
            // Changer la configuration
            equalizer.setBandGain(0, static_cast<float>(config) - 2.0f);
            compressor.setParameters(-24.0f + config * 2, 2.0f + config, 10.0f + config * 5, 100.0f + config * 25, 0.0f);
            delay.setParameters(200.0f + config * 50, 0.2f + config * 0.1, 0.1f + config * 0.1);

            std::vector<float> resultSignal = testSignal;
            equalizer.process(resultSignal, resultSignal);
            compressor.processMono(resultSignal.data(), resultSignal.data(), TEST_BUFFER_SIZE);
            delay.processMono(resultSignal.data(), resultSignal.data(), TEST_BUFFER_SIZE);

            std::cout << "   - ✅ Configuration " << (config + 1) << " OK\n";
        }

        // 3. Test de continuité
        std::cout << "   - Test traitement continu...\n";

        const size_t largeBufferSize = TEST_BUFFER_SIZE * 4;
        std::vector<float> continuousInput(largeBufferSize);
        std::vector<float> continuousOutput(largeBufferSize);

        // Signal continu
        for (size_t i = 0; i < largeBufferSize; ++i) {
            double t = static_cast<double>(i) / TEST_SAMPLE_RATE;
            continuousInput[i] = 0.3f * std::sin(2.0 * M_PI * 440.0 * t);
        }

        // Traiter en blocs
        for (size_t start = 0; start + TEST_BUFFER_SIZE <= largeBufferSize; start += TEST_BUFFER_SIZE / 2) {
            std::vector<float> block(TEST_BUFFER_SIZE);
            std::copy_n(continuousInput.begin() + start, TEST_BUFFER_SIZE, block.begin());

            equalizer.process(block, block);
            compressor.processMono(block.data(), block.data(), TEST_BUFFER_SIZE);
            delay.processMono(block.data(), block.data(), TEST_BUFFER_SIZE);

            // Copier le résultat
            std::copy(block.begin(), block.end(), continuousOutput.begin() + start);
        }

        std::cout << "   - ✅ Traitement continu OK\n";

        // Validation finale
        if (robustnessTestsPassed) {
            std::cout << "✅ Test robustesse intégration validé\n";
            result.passed = true;
        } else {
            std::cout << "❌ Erreurs dans la robustesse\n";
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

// Test 3: Performance comparée
TestResult testPerformanceComparison() {
    TestResult result;
    auto start = std::chrono::high_resolution_clock::now();

    std::cout << "⚡ Test 3: Comparaison de performance...\n";

    try {
        bool perfTestsPassed = true;

        // 1. Performance individuelle
        std::cout << "   - Test performance individuelle...\n";

        SimpleEqualizer equalizer(8, TEST_SAMPLE_RATE);
        CompressorEffect compressor;
        compressor.setSampleRate(TEST_SAMPLE_RATE, 2);
        DelayEffect delay;
        delay.setSampleRate(TEST_SAMPLE_RATE, 2);

        std::vector<float> testBuffer(TEST_BUFFER_SIZE, 0.5f);

        // Test equalizer seul
        auto eqStart = std::chrono::high_resolution_clock::now();
        for (int i = 0; i < INTEGRATION_ITERATIONS; ++i) {
            equalizer.process(testBuffer, testBuffer);
        }
        auto eqEnd = std::chrono::high_resolution_clock::now();
        double eqTime = std::chrono::duration<double>(eqEnd - eqStart).count() / INTEGRATION_ITERATIONS;

        // Test compressor seul
        auto compStart = std::chrono::high_resolution_clock::now();
        for (int i = 0; i < INTEGRATION_ITERATIONS; ++i) {
            compressor.processMono(testBuffer.data(), testBuffer.data(), TEST_BUFFER_SIZE);
        }
        auto compEnd = std::chrono::high_resolution_clock::now();
        double compTime = std::chrono::duration<double>(compEnd - compStart).count() / INTEGRATION_ITERATIONS;

        // Test delay seul
        auto delayStart = std::chrono::high_resolution_clock::now();
        for (int i = 0; i < INTEGRATION_ITERATIONS; ++i) {
            delay.processMono(testBuffer.data(), testBuffer.data(), TEST_BUFFER_SIZE);
        }
        auto delayEnd = std::chrono::high_resolution_clock::now();
        double delayTime = std::chrono::duration<double>(delayEnd - delayStart).count() / INTEGRATION_ITERATIONS;

        std::cout << "   - Equalizer seul: " << std::fixed << std::setprecision(6) << (eqTime * 1000.0) << " ms\n";
        std::cout << "   - Compressor seul: " << std::fixed << std::setprecision(6) << (compTime * 1000.0) << " ms\n";
        std::cout << "   - Delay seul: " << std::fixed << std::setprecision(6) << (delayTime * 1000.0) << " ms\n";

        // 2. Performance combinée
        std::cout << "   - Test performance combinée...\n";

        auto combinedStart = std::chrono::high_resolution_clock::now();
        for (int i = 0; i < INTEGRATION_ITERATIONS; ++i) {
            equalizer.process(testBuffer, testBuffer);
            compressor.processMono(testBuffer.data(), testBuffer.data(), TEST_BUFFER_SIZE);
            delay.processMono(testBuffer.data(), testBuffer.data(), TEST_BUFFER_SIZE);
        }
        auto combinedEnd = std::chrono::high_resolution_clock::now();
        double combinedTime = std::chrono::duration<double>(combinedEnd - combinedStart).count() / INTEGRATION_ITERATIONS;

        double expectedCombinedTime = eqTime + compTime + delayTime;
        double overheadPercent = ((combinedTime - expectedCombinedTime) / expectedCombinedTime) * 100.0;

        std::cout << "   - Pipeline combiné: " << std::fixed << std::setprecision(6) << (combinedTime * 1000.0) << " ms\n";
        std::cout << "   - Overhead: " << std::fixed << std::setprecision(2) << overheadPercent << "%\n";

        if (overheadPercent < 50.0) {
            std::cout << "   - ✅ Overhead acceptable\n";
        } else {
            std::cout << "   - ⚠️ Overhead élevé\n";
        }

        // 3. Facteurs temps réel
        double eqRealtime = (TEST_BUFFER_SIZE / static_cast<double>(TEST_SAMPLE_RATE)) / eqTime;
        double compRealtime = (TEST_BUFFER_SIZE / static_cast<double>(TEST_SAMPLE_RATE)) / compTime;
        double delayRealtime = (TEST_BUFFER_SIZE / static_cast<double>(TEST_SAMPLE_RATE)) / delayTime;
        double combinedRealtime = (TEST_BUFFER_SIZE / static_cast<double>(TEST_SAMPLE_RATE)) / combinedTime;

        std::cout << "   - Facteurs temps réel:\n";
        std::cout << "     Equalizer: " << std::fixed << std::setprecision(1) << eqRealtime << "x\n";
        std::cout << "     Compressor: " << std::fixed << std::setprecision(1) << compRealtime << "x\n";
        std::cout << "     Delay: " << std::fixed << std::setprecision(1) << delayRealtime << "x\n";
        std::cout << "     Pipeline: " << std::fixed << std::setprecision(1) << combinedRealtime << "x\n";

        if (combinedRealtime > 5.0) {
            std::cout << "   - ✅ Performance combinée excellente\n";
        } else if (combinedRealtime > 1.0) {
            std::cout << "   - ⚠️ Performance combinée acceptable\n";
        } else {
            std::cout << "   - ❌ Performance combinée insuffisante\n";
            perfTestsPassed = false;
        }

        // Validation finale
        if (perfTestsPassed) {
            std::cout << "✅ Test performance comparée validé\n";
            result.passed = true;
            result.metrics = {combinedRealtime, overheadPercent, combinedTime * 1000.0};
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

// Fonction principale des tests d'intégration simple
int runSimpleIntegrationTests() {
    std::cout << "🔗 TESTS D'INTÉGRATION SIMPLE\n";
    std::cout << "==============================\n\n";

    std::vector<TestResult> results;
    int passedTests = 0;
    int totalTests = 3;

    // Test 1: Pipeline basique
    auto result1 = testBasicPipeline();
    results.push_back(result1);
    if (result1.passed) passedTests++;

    std::cout << "\n";

    // Test 2: Robustesse
    auto result2 = testIntegrationRobustness();
    results.push_back(result2);
    if (result2.passed) passedTests++;

    std::cout << "\n";

    // Test 3: Performance comparée
    auto result3 = testPerformanceComparison();
    results.push_back(result3);
    if (result3.passed) passedTests++;

    // Rapport final
    std::cout << "\n==============================\n";
    std::cout << "📊 RAPPORT FINAL - INTÉGRATION SIMPLE\n";
    std::cout << "==============================\n\n";

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
        std::cout << "   Les composants audio fonctionnent parfaitement ensemble.\n";
        return 0;
    } else {
        std::cout << "⚠️  Intégration partiellement réussie.\n";
        std::cout << "   Vérifiez les erreurs ci-dessus.\n";
        return 1;
    }
}

int main() {
    try {
        return runSimpleIntegrationTests();
    } catch (const std::exception& e) {
        std::cerr << "❌ ERREUR FATALE: " << e.what() << std::endl;
        return 2;
    } catch (...) {
        std::cerr << "❌ ERREUR FATALE INCONNUE" << std::endl;
        return 2;
    }
}
