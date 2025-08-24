// Test sophistiqué du module Effects
// Teste l'initialisation, les effets individuels, la chaîne d'effets,
// les performances et l'intégration avec le système

#include <algorithm>
#include <atomic>
#include <chrono>
#include <cmath>
#include <iostream>
#include <iomanip>
#include <memory>
#include <mutex>
#include <string>
#include <thread>
#include <vector>
#include <map>

// Headers du projet
#include "../../shared/Audio/effects/components/Compressor.hpp"
#include "../../shared/Audio/effects/components/Delay.hpp"
#include "../../shared/Audio/effects/components/EffectBase.hpp"
#include "../../shared/Audio/effects/components/EffectChain.hpp"
#include "../../shared/Audio/effects/config/EffectsConfig.h"
#include "../../shared/Audio/core/components/constant/CoreConstants.hpp"
#include "../../shared/Audio/effects/components/constant/EffectConstants.hpp"

// Utilisation des namespaces
using namespace AudioFX;
using namespace Nyth::Audio;

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

// Configuration des tests
const int TEST_SAMPLE_RATE = 44100;
const size_t TEST_BUFFER_SIZE = 2048;
const double MAX_ACCEPTABLE_JITTER = 15.0; // Pourcent
const int PERFORMANCE_TEST_ITERATIONS = 1000;

// Structure de résultat de test
struct TestResult {
    bool passed = false;
    double executionTime = 0.0;
    std::vector<double> metrics; // métriques spécifiques au test
    std::string errorMessage;
};

// Mock pour les tests (simulant JSI Runtime)
class MockJSIRuntime {
public:
    jsi::Value getUndefined() { return jsi::Value(); }
    jsi::Value getNull() { return jsi::Value(nullptr); }
    jsi::Value getBoolean(bool b) { return jsi::Value(b); }
    jsi::Value getNumber(double d) { return jsi::Value(d); }
    jsi::Value getString(const jsi::String& s) { return jsi::Value(s); }
    jsi::Value getObject(const jsi::Object& o) { return jsi::Value(o); }
    jsi::Value getArray(const jsi::Array& a) { return jsi::Value(a); }
};

// Test 1: Initialisation et configuration du système d'effets
TestResult testEffectsInitialization() {
    TestResult result;
    auto start = std::chrono::high_resolution_clock::now();

    std::cout << "🎛️ Test 1: Initialisation système d'effets...\n";

    try {
        bool initTestsPassed = true;

        // 1. Test de configuration par défaut
        std::cout << "   - Test configuration par défaut...\n";

        Nyth::Audio::EffectsConfig defaultConfig = Nyth::Audio::EffectsConfigValidator::getDefault();
        std::string validationError;
        bool configValid = Nyth::Audio::EffectsConfigValidator::validate(defaultConfig, validationError);

        if (configValid) {
            std::cout << "   - ✅ Configuration par défaut valide\n";
            std::cout << "     Sample Rate: " << defaultConfig.sampleRate << " Hz\n";
            std::cout << "     Channels: " << defaultConfig.channels << "\n";
            std::cout << "     Input Level: " << defaultConfig.inputLevel << "\n";
            std::cout << "     Output Level: " << defaultConfig.outputLevel << "\n";
        } else {
            std::cout << "   - ❌ Configuration par défaut invalide: " << validationError << "\n";
            initTestsPassed = false;
        }

        // 2. Test d'initialisation d'EffectManager
        std::cout << "   - Test initialisation EffectManager...\n";

        auto mockCallbackManager = std::make_shared<JSICallbackManager>(nullptr);
        EffectManager effectManager(mockCallbackManager);

        bool initSuccess = effectManager.initialize(defaultConfig);
        bool isInitialized = effectManager.isInitialized();

        if (initSuccess && isInitialized) {
            std::cout << "   - ✅ EffectManager initialisé avec succès\n";
        } else {
            std::cout << "   - ❌ Échec initialisation EffectManager\n";
            initTestsPassed = false;
        }

        // 3. Test des informations système
        std::cout << "   - Test informations système...\n";

        std::string systemInfo = effectManager.getInfo();
        size_t maxEffects = effectManager.getMaxEffects();
        uint32_t latency = effectManager.getLatency();

        std::cout << "   - Info système: " << systemInfo << "\n";
        std::cout << "   - Max effets: " << maxEffects << "\n";
        std::cout << "   - Latence: " << latency << " samples\n";

        // 4. Test des métriques initiales
        std::cout << "   - Test métriques initiales...\n";

        auto initialMetrics = effectManager.getMetrics();
        std::cout << "   - Métriques initiales:\n";
        std::cout << "     Input Level: " << initialMetrics.inputLevel << " dB\n";
        std::cout << "     Output Level: " << initialMetrics.outputLevel << " dB\n";
        std::cout << "     Processed Frames: " << initialMetrics.processedFrames << "\n";
        std::cout << "     Active Effects: " << initialMetrics.activeEffectsCount << "\n";

        // 5. Test du bypass initial
        std::cout << "   - Test bypass initial...\n";

        bool initialBypass = effectManager.isBypassAll();
        if (!initialBypass) {
            std::cout << "   - ✅ Bypass initial désactivé (normal)\n";
        } else {
            std::cout << "   - ❌ Bypass initial activé (anormal)\n";
            initTestsPassed = false;
        }

        // Validation finale
        if (initTestsPassed) {
            std::cout << "✅ Test initialisation système d'effets validé\n";
            result.passed = true;
            result.metrics = {static_cast<double>(maxEffects), static_cast<double>(latency)};
        } else {
            std::cout << "❌ Erreurs dans l'initialisation\n";
            result.passed = false;
        }

    } catch (const std::exception& e) {
        std::cout << "❌ Erreur test initialisation: " << e.what() << "\n";
        result.passed = false;
        result.errorMessage = e.what();
    }

    auto end = std::chrono::high_resolution_clock::now();
    result.executionTime = std::chrono::duration<double>(end - start).count();

    return result;
}

// Test 2: Test des effets individuels (Compressor, Delay)
TestResult testIndividualEffects() {
    TestResult result;
    auto start = std::chrono::high_resolution_clock::now();

    std::cout << "🎚️ Test 2: Effets individuels...\n";

    try {
        bool effectTestsPassed = true;

        // Configuration
        auto mockCallbackManager = std::make_shared<JSICallbackManager>(nullptr);
        EffectManager effectManager(mockCallbackManager);

        Nyth::Audio::EffectsConfig config;
        config.sampleRate = TEST_SAMPLE_RATE;
        config.channels = 2;

        effectManager.initialize(config);

        // 1. Test de création d'effets
        std::cout << "   - Test création d'effets...\n";

        int compressorId = effectManager.createEffect(Nyth::Audio::Effects::EffectType::COMPRESSOR);
        int delayId = effectManager.createEffect(Nyth::Audio::Effects::EffectType::DELAY);

        if (compressorId > 0) {
            std::cout << "   - ✅ Compresseur créé (ID: " << compressorId << ")\n";
        } else {
            std::cout << "   - ❌ Échec création compresseur\n";
            effectTestsPassed = false;
        }

        if (delayId > 0) {
            std::cout << "   - ✅ Delay créé (ID: " << delayId << ")\n";
        } else {
            std::cout << "   - ❌ Échec création delay\n";
            effectTestsPassed = false;
        }

        // 2. Test d'activation/désactivation
        std::cout << "   - Test contrôle d'effets...\n";

        if (compressorId > 0) {
            // Activer le compresseur
            bool enableSuccess = effectManager.enableEffect(compressorId, true);
            bool isEnabled = effectManager.isEffectEnabled(compressorId);

            if (enableSuccess && isEnabled) {
                std::cout << "   - ✅ Activation compresseur OK\n";
            } else {
                std::cout << "   - ❌ Erreur activation compresseur\n";
                effectTestsPassed = false;
            }

            // Désactiver le compresseur
            bool disableSuccess = effectManager.enableEffect(compressorId, false);
            bool isDisabled = !effectManager.isEffectEnabled(compressorId);

            if (disableSuccess && isDisabled) {
                std::cout << "   - ✅ Désactivation compresseur OK\n";
            } else {
                std::cout << "   - ❌ Erreur désactivation compresseur\n";
                effectTestsPassed = false;
            }
        }

        if (delayId > 0) {
            // Activer le delay
            bool enableSuccess = effectManager.enableEffect(delayId, true);
            bool isEnabled = effectManager.isEffectEnabled(delayId);

            if (enableSuccess && isEnabled) {
                std::cout << "   - ✅ Activation delay OK\n";
            } else {
                std::cout << "   - ❌ Erreur activation delay\n";
                effectTestsPassed = false;
            }
        }

        // 3. Test de traitement audio avec effets individuels
        std::cout << "   - Test traitement audio individuel...\n";

        // Activer le compresseur pour le test
        if (compressorId > 0) {
            effectManager.enableEffect(compressorId, true);
        }

        std::vector<float> inputAudio(TEST_BUFFER_SIZE);
        std::vector<float> outputAudio(TEST_BUFFER_SIZE);

        // Générer un signal de test
        for (size_t i = 0; i < inputAudio.size(); ++i) {
            double t = static_cast<double>(i) / TEST_SAMPLE_RATE;
            // Signal avec compression dynamique
            double envelope = 0.5 + 0.3 * std::sin(2.0 * M_PI * 2.0 * t); // Enveloppe lente
            inputAudio[i] = static_cast<float>(envelope * std::sin(2.0 * M_PI * 440.0 * t));
        }

        // Test traitement mono
        bool monoSuccess = effectManager.processAudio(
            inputAudio.data(), outputAudio.data(),
            inputAudio.size(), 1);

        if (monoSuccess) {
            std::cout << "   - ✅ Traitement mono OK\n";

            // Analyser le signal traité
            float inputRMS = 0.0f, outputRMS = 0.0f;
            for (size_t i = 0; i < inputAudio.size(); ++i) {
                inputRMS += inputAudio[i] * inputAudio[i];
                outputRMS += outputAudio[i] * outputAudio[i];
            }
            inputRMS = std::sqrt(inputRMS / inputAudio.size());
            outputRMS = std::sqrt(outputRMS / outputAudio.size());

            std::cout << "   - RMS Input: " << inputRMS << ", RMS Output: " << outputRMS << "\n";
        } else {
            std::cout << "   - ❌ Erreur traitement mono\n";
            effectTestsPassed = false;
        }

        // Test traitement stéréo
        std::vector<float> inputL = inputAudio;
        std::vector<float> inputR = inputAudio;
        std::vector<float> outputL(TEST_BUFFER_SIZE);
        std::vector<float> outputR(TEST_BUFFER_SIZE);

        bool stereoSuccess = effectManager.processAudioStereo(
            inputL.data(), inputR.data(),
            outputL.data(), outputR.data(),
            inputL.size());

        if (stereoSuccess) {
            std::cout << "   - ✅ Traitement stéréo OK\n";
        } else {
            std::cout << "   - ❌ Erreur traitement stéréo\n";
            effectTestsPassed = false;
        }

        // 4. Test de destruction d'effets
        std::cout << "   - Test destruction d'effets...\n";

        if (delayId > 0) {
            bool destroySuccess = effectManager.destroyEffect(delayId);
            if (destroySuccess) {
                std::cout << "   - ✅ Destruction delay OK\n";
            } else {
                std::cout << "   - ❌ Erreur destruction delay\n";
                effectTestsPassed = false;
            }
        }

        // Validation finale
        if (effectTestsPassed) {
            std::cout << "✅ Test effets individuels validé\n";
            result.passed = true;
        } else {
            std::cout << "❌ Erreurs dans les tests d'effets individuels\n";
            result.passed = false;
        }

    } catch (const std::exception& e) {
        std::cout << "❌ Erreur test effets individuels: " << e.what() << "\n";
        result.passed = false;
        result.errorMessage = e.what();
    }

    auto end = std::chrono::high_resolution_clock::now();
    result.executionTime = std::chrono::duration<double>(end - start).count();

    return result;
}

// Test 3: Test des performances et latence
TestResult testEffectsPerformance() {
    TestResult result;
    auto start = std::chrono::high_resolution_clock::now();

    std::cout << "⚡ Test 3: Performance et latence...\n";

    try {
        bool perfTestsPassed = true;

        // Configuration
        auto mockCallbackManager = std::make_shared<JSICallbackManager>(nullptr);
        EffectManager effectManager(mockCallbackManager);

        Nyth::Audio::EffectsConfig config;
        config.sampleRate = TEST_SAMPLE_RATE;
        config.channels = 2;

        effectManager.initialize(config);

        // Créer quelques effets pour le test de performance
        int compressorId = effectManager.createEffect(Nyth::Audio::Effects::EffectType::COMPRESSOR);
        int delayId = effectManager.createEffect(Nyth::Audio::Effects::EffectType::DELAY);

        if (compressorId > 0) effectManager.enableEffect(compressorId, true);
        if (delayId > 0) effectManager.enableEffect(delayId, true);

        // 1. Test de performance de base
        std::cout << "   - Test performance de base...\n";

        std::vector<float> inputL(TEST_BUFFER_SIZE);
        std::vector<float> inputR(TEST_BUFFER_SIZE);
        std::vector<float> outputL(TEST_BUFFER_SIZE);
        std::vector<float> outputR(TEST_BUFFER_SIZE);

        // Générer des données de test
        for (size_t i = 0; i < TEST_BUFFER_SIZE; ++i) {
            inputL[i] = 0.5f * std::sin(2.0 * M_PI * 440.0 * i / TEST_SAMPLE_RATE);
            inputR[i] = 0.5f * std::sin(2.0 * M_PI * 660.0 * i / TEST_SAMPLE_RATE);
        }

        // Test de performance
        auto perfStart = std::chrono::high_resolution_clock::now();

        for (int i = 0; i < PERFORMANCE_TEST_ITERATIONS; ++i) {
            effectManager.processAudioStereo(
                inputL.data(), inputR.data(),
                outputL.data(), outputR.data(),
                TEST_BUFFER_SIZE);
        }

        auto perfEnd = std::chrono::high_resolution_clock::now();
        double totalTime = std::chrono::duration<double>(perfEnd - perfStart).count();
        double avgTimePerIteration = totalTime / PERFORMANCE_TEST_ITERATIONS;
        double realtimeFactor = (TEST_BUFFER_SIZE / static_cast<double>(TEST_SAMPLE_RATE)) / avgTimePerIteration;

        std::cout << "   - Temps total: " << std::fixed << std::setprecision(3) << totalTime << " s\n";
        std::cout << "   - Temps moyen par itération: " << std::fixed << std::setprecision(6)
                  << (avgTimePerIteration * 1000.0) << " ms\n";
        std::cout << "   - Facteur temps réel: " << std::fixed << std::setprecision(1) << realtimeFactor << "x\n";

        if (realtimeFactor > 10.0) {
            std::cout << "   - ✅ Performance excellente\n";
        } else if (realtimeFactor > 2.0) {
            std::cout << "   - ⚠️ Performance acceptable\n";
        } else {
            std::cout << "   - ❌ Performance insuffisante\n";
            perfTestsPassed = false;
        }

        // 2. Test de jitter (variabilité temporelle)
        std::cout << "   - Test de jitter...\n";

        std::vector<double> processingTimes;
        processingTimes.reserve(100);

        for (int i = 0; i < 100; ++i) {
            auto iterStart = std::chrono::high_resolution_clock::now();
            effectManager.processAudioStereo(
                inputL.data(), inputR.data(),
                outputL.data(), outputR.data(),
                TEST_BUFFER_SIZE);
            auto iterEnd = std::chrono::high_resolution_clock::now();
            double iterTime = std::chrono::duration<double>(iterEnd - iterStart).count();
            processingTimes.push_back(iterTime);
        }

        // Calculer le jitter
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

        std::cout << "   - Jitter: " << std::fixed << std::setprecision(2) << jitterPercent << "%\n";

        if (jitterPercent < MAX_ACCEPTABLE_JITTER) {
            std::cout << "   - ✅ Jitter acceptable\n";
        } else {
            std::cout << "   - ❌ Jitter trop élevé\n";
            perfTestsPassed = false;
        }

        // 3. Test de latence
        std::cout << "   - Test de latence...\n";

        uint32_t reportedLatency = effectManager.getLatency();
        std::cout << "   - Latence rapportée: " << reportedLatency << " samples\n";

        double latencyMs = (reportedLatency / static_cast<double>(TEST_SAMPLE_RATE)) * 1000.0;
        std::cout << "   - Latence: " << std::fixed << std::setprecision(2) << latencyMs << " ms\n";

        if (latencyMs < 50.0) { // Moins de 50ms est excellent
            std::cout << "   - ✅ Latence excellente\n";
        } else if (latencyMs < 100.0) {
            std::cout << "   - ⚠️ Latence acceptable\n";
        } else {
            std::cout << "   - ❌ Latence trop élevée\n";
            perfTestsPassed = false;
        }

        // Validation finale
        if (perfTestsPassed) {
            std::cout << "✅ Test performance validé\n";
            result.passed = true;
            result.metrics = {realtimeFactor, jitterPercent, latencyMs};
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

// Test 4: Test de robustesse et gestion d'erreurs
TestResult testEffectsRobustness() {
    TestResult result;
    auto start = std::chrono::high_resolution_clock::now();

    std::cout << "🛡️ Test 4: Robustesse et gestion d'erreurs...\n";

    try {
        bool robustnessTestsPassed = true;

        // Configuration
        auto mockCallbackManager = std::make_shared<JSICallbackManager>(nullptr);
        EffectManager effectManager(mockCallbackManager);

        Nyth::Audio::EffectsConfig config;
        config.sampleRate = TEST_SAMPLE_RATE;
        config.channels = 2;

        effectManager.initialize(config);

        // 1. Test avec données audio extrêmes
        std::cout << "   - Test données extrêmes...\n";

        std::vector<float> extremeAudio(TEST_BUFFER_SIZE);
        std::vector<float> outputAudio(TEST_BUFFER_SIZE);

        // Remplir avec des valeurs extrêmes
        for (size_t i = 0; i < extremeAudio.size(); ++i) {
            if (i % 3 == 0) extremeAudio[i] = 10.0f;      // Valeur très élevée
            else if (i % 3 == 1) extremeAudio[i] = -10.0f; // Valeur très basse
            else extremeAudio[i] = 0.0f;                   // Zéro
        }

        bool extremeTestSuccess = effectManager.processAudio(
            extremeAudio.data(), outputAudio.data(),
            extremeAudio.size(), 1);

        if (extremeTestSuccess) {
            std::cout << "   - ✅ Gestion données extrêmes OK\n";

            // Vérifier que la sortie est stable
            bool outputStable = true;
            for (float sample : outputAudio) {
                if (!std::isfinite(sample) || std::abs(sample) > 100.0f) {
                    outputStable = false;
                    break;
                }
            }

            if (outputStable) {
                std::cout << "   - ✅ Sortie stable avec données extrêmes\n";
            } else {
                std::cout << "   - ❌ Sortie instable avec données extrêmes\n";
                robustnessTestsPassed = false;
            }
        } else {
            std::cout << "   - ❌ Échec traitement données extrêmes\n";
            robustnessTestsPassed = false;
        }

        // 2. Test avec buffers de tailles variables
        std::cout << "   - Test buffers variables...\n";

        std::vector<size_t> bufferSizes = {64, 128, 256, 512, 1024, 2048, 4096};

        for (size_t bufferSize : bufferSizes) {
            std::vector<float> varInput(bufferSize);
            std::vector<float> varOutput(bufferSize);

            // Remplir avec des données de test
            for (size_t i = 0; i < bufferSize; ++i) {
                varInput[i] = 0.5f * std::sin(2.0 * M_PI * 440.0 * i / TEST_SAMPLE_RATE);
            }

            bool varTestSuccess = effectManager.processAudio(
                varInput.data(), varOutput.data(),
                bufferSize, 1);

            if (varTestSuccess) {
                std::cout << "   - ✅ Buffer taille " << bufferSize << " OK\n";
            } else {
                std::cout << "   - ❌ Échec buffer taille " << bufferSize << "\n";
                robustnessTestsPassed = false;
            }
        }

        // 3. Test de gestion d'effets multiples
        std::cout << "   - Test gestion effets multiples...\n";

        std::vector<int> effectIds;

        // Créer plusieurs effets
        for (int i = 0; i < 5; ++i) {
            int effectId = effectManager.createEffect(Nyth::Audio::Effects::EffectType::COMPRESSOR);
            if (effectId > 0) {
                effectIds.push_back(effectId);
                effectManager.enableEffect(effectId, true);
            }
        }

        std::cout << "   - Effets créés: " << effectIds.size() << "\n";

        // Traiter avec tous les effets actifs
        std::vector<float> multiInput(TEST_BUFFER_SIZE);
        std::vector<float> multiOutput(TEST_BUFFER_SIZE);

        std::fill(multiInput.begin(), multiInput.end(), 0.3f);

        bool multiEffectSuccess = effectManager.processAudio(
            multiInput.data(), multiOutput.data(),
            multiInput.size(), 1);

        if (multiEffectSuccess) {
            std::cout << "   - ✅ Traitement avec effets multiples OK\n";
        } else {
            std::cout << "   - ❌ Échec traitement effets multiples\n";
            robustnessTestsPassed = false;
        }

        // Nettoyer les effets
        for (int effectId : effectIds) {
            effectManager.destroyEffect(effectId);
        }

        // 4. Test de bypass global
        std::cout << "   - Test bypass global...\n";

        // Activer le bypass
        bool bypassSet = effectManager.setBypassAll(true);
        bool bypassActive = effectManager.isBypassAll();

        std::vector<float> bypassInput = multiInput;
        std::vector<float> bypassOutput(TEST_BUFFER_SIZE);

        bool bypassProcessSuccess = effectManager.processAudio(
            bypassInput.data(), bypassOutput.data(),
            bypassInput.size(), 1);

        if (bypassSet && bypassActive && bypassProcessSuccess) {
            std::cout << "   - ✅ Bypass global OK\n";
        } else {
            std::cout << "   - ❌ Erreur bypass global\n";
            robustnessTestsPassed = false;
        }

        // Validation finale
        if (robustnessTestsPassed) {
            std::cout << "✅ Test robustesse validé\n";
            result.passed = true;
        } else {
            std::cout << "❌ Erreurs dans les tests de robustesse\n";
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

// Test 5: Test de la chaîne d'effets (EffectChain)
TestResult testEffectChain() {
    TestResult result;
    auto start = std::chrono::high_resolution_clock::now();

    std::cout << "🔗 Test 5: Chaîne d'effets...\n";

    try {
        bool chainTestsPassed = true;

        // Configuration
        auto mockCallbackManager = std::make_shared<JSICallbackManager>(nullptr);
        EffectManager effectManager(mockCallbackManager);

        Nyth::Audio::EffectsConfig config;
        config.sampleRate = TEST_SAMPLE_RATE;
        config.channels = 2;

        effectManager.initialize(config);

        // 1. Test de création de chaîne d'effets
        std::cout << "   - Test création chaîne...\n";

        std::vector<int> chainEffectIds;

        // Créer une séquence d'effets: Compressor -> Delay -> Compressor
        int comp1Id = effectManager.createEffect(Nyth::Audio::Effects::EffectType::COMPRESSOR);
        int delayId = effectManager.createEffect(Nyth::Audio::Effects::EffectType::DELAY);
        int comp2Id = effectManager.createEffect(Nyth::Audio::Effects::EffectType::COMPRESSOR);

        if (comp1Id > 0) chainEffectIds.push_back(comp1Id);
        if (delayId > 0) chainEffectIds.push_back(delayId);
        if (comp2Id > 0) chainEffectIds.push_back(comp2Id);

        std::cout << "   - Effets dans la chaîne: " << chainEffectIds.size() << "\n";

        // Activer tous les effets
        for (int effectId : chainEffectIds) {
            effectManager.enableEffect(effectId, true);
        }

        // 2. Test de traitement en chaîne
        std::cout << "   - Test traitement en chaîne...\n";

        std::vector<float> chainInput(TEST_BUFFER_SIZE);
        std::vector<float> chainOutput(TEST_BUFFER_SIZE);

        // Générer un signal de test complexe
        for (size_t i = 0; i < chainInput.size(); ++i) {
            double t = static_cast<double>(i) / TEST_SAMPLE_RATE;
            // Signal complexe avec transients
            double envelope = 0.3 + 0.4 * std::exp(-t * 3.0); // Attaque rapide
            chainInput[i] = static_cast<float>(envelope * std::sin(2.0 * M_PI * 440.0 * t));
        }

        bool chainProcessingSuccess = effectManager.processAudio(
            chainInput.data(), chainOutput.data(),
            chainInput.size(), 1);

        if (chainProcessingSuccess) {
            std::cout << "   - ✅ Traitement en chaîne OK\n";

            // Analyser les différences entre entrée et sortie
            double inputEnergy = 0.0, outputEnergy = 0.0;
            for (size_t i = 0; i < chainInput.size(); ++i) {
                inputEnergy += chainInput[i] * chainInput[i];
                outputEnergy += chainOutput[i] * chainOutput[i];
            }
            inputEnergy = std::sqrt(inputEnergy / chainInput.size());
            outputEnergy = std::sqrt(outputEnergy / chainOutput.size());

            double gainReduction = 20.0 * std::log10(outputEnergy / inputEnergy);
            std::cout << "   - Réduction de gain: " << std::fixed << std::setprecision(2)
                      << gainReduction << " dB\n";
        } else {
            std::cout << "   - ❌ Échec traitement en chaîne\n";
            chainTestsPassed = false;
        }

        // 3. Test de contrôle individuel dans la chaîne
        std::cout << "   - Test contrôle individuel...\n";

        // Désactiver le delay et voir l'effet
        if (delayId > 0) {
            effectManager.enableEffect(delayId, false);

            std::vector<float> noDelayOutput(TEST_BUFFER_SIZE);
            bool noDelaySuccess = effectManager.processAudio(
                chainInput.data(), noDelayOutput.data(),
                chainInput.size(), 1);

            if (noDelaySuccess) {
                std::cout << "   - ✅ Contrôle individuel OK\n";
            } else {
                std::cout << "   - ❌ Erreur contrôle individuel\n";
                chainTestsPassed = false;
            }
        }

        // 4. Test de métriques de la chaîne
        std::cout << "   - Test métriques de chaîne...\n";

        auto chainMetrics = effectManager.getMetrics();
        std::cout << "   - Métriques de chaîne:\n";
        std::cout << "     Niveau entrée: " << std::fixed << std::setprecision(2)
                  << chainMetrics.inputLevel << " dB\n";
        std::cout << "     Niveau sortie: " << std::fixed << std::setprecision(2)
                  << chainMetrics.outputLevel << " dB\n";
        std::cout << "     Frames traités: " << chainMetrics.processedFrames << "\n";
        std::cout << "     Effets actifs: " << chainMetrics.activeEffectsCount << "\n";

        // Validation finale
        if (chainTestsPassed) {
            std::cout << "✅ Test chaîne d'effets validé\n";
            result.passed = true;
            result.metrics = {static_cast<double>(chainEffectIds.size()), chainMetrics.inputLevel, chainMetrics.outputLevel};
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

// Fonction principale des tests sophistiqués des effets
int runSophisticatedEffectsTests() {
    std::cout << "🎛️ TESTS SOPHISTIQUÉS DU MODULE EFFECTS\n";
    std::cout << "==========================================\n\n";

    std::vector<TestResult> results;
    int passedTests = 0;
    int totalTests = 5;

    // Test 1: Initialisation
    auto result1 = testEffectsInitialization();
    results.push_back(result1);
    if (result1.passed) passedTests++;

    std::cout << "\n";

    // Test 2: Effets individuels
    auto result2 = testIndividualEffects();
    results.push_back(result2);
    if (result2.passed) passedTests++;

    std::cout << "\n";

    // Test 3: Performance
    auto result3 = testEffectsPerformance();
    results.push_back(result3);
    if (result3.passed) passedTests++;

    std::cout << "\n";

    // Test 4: Robustesse
    auto result4 = testEffectsRobustness();
    results.push_back(result4);
    if (result4.passed) passedTests++;

    std::cout << "\n";

    // Test 5: Chaîne d'effets
    auto result5 = testEffectChain();
    results.push_back(result5);
    if (result5.passed) passedTests++;

    // Rapport final
    std::cout << "\n==========================================\n";
    std::cout << "📊 RAPPORT FINAL - TESTS EFFECTS SOPHISTIQUÉS\n";
    std::cout << "==========================================\n\n";

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
        std::cout << "   Le module Effects est prêt pour la production.\n";
        return 0;
    } else {
        std::cout << "⚠️  Certains tests ont échoué.\n";
        std::cout << "   Vérifiez les erreurs ci-dessus.\n";
        return 1;
    }
}

int main() {
    try {
        return runSophisticatedEffectsTests();
    } catch (const std::exception& e) {
        std::cerr << "❌ ERREUR FATALE: " << e.what() << std::endl;
        return 2;
    } catch (...) {
        std::cerr << "❌ ERREUR FATALE INCONNUE" << std::endl;
        return 2;
    }
}
