// Test unitaire des composants du module core/ audio
#include <iostream>
#include <vector>
#include <chrono>
#include <cmath>
#include <algorithm>
#include <string>
#include <memory>

// Includes des composants core
#include "../../shared/Audio/core/components/constant/CoreConstants.hpp"
#include "../../shared/Audio/core/components/AudioEqualizer/AudioEqualizer.hpp"
#include "../../shared/Audio/core/components/BiquadFilter/BiquadFilter.hpp"

// Définir M_PI si pas disponible
#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

// Tests unitaires des composants core
namespace CoreUnitTests {

// Test 1: BiquadFilter - Passe-bas
bool testBiquadLowpass() {
    std::cout << "🎵 Test 1: BiquadFilter - Passe-bas...\n";

    try {
        AudioFX::BiquadFilter filter;
        const double sampleRate = 48000.0;
        const double cutoffFreq = 1000.0;
        const double q = 0.707;

        // Configurer le filtre passe-bas
        filter.calculateLowpass(cutoffFreq, sampleRate, q);

        // Test avec des fréquences individuelles
        std::vector<double> testFreqs = {500.0, 2000.0}; // 500Hz devrait passer, 2000Hz devrait être atténué
        std::vector<double> attenuations;

        const int numSamples = 2048;

        for (double freq : testFreqs) {
            std::vector<float> input(numSamples);
            std::vector<float> output(numSamples);

            // Générer un signal sinusoïdal pur
            for (int i = 0; i < numSamples; ++i) {
                double t = static_cast<double>(i) / sampleRate;
                input[i] = std::sin(2.0 * M_PI * freq * t);
            }

            // Traiter le signal
            filter.process(input, output);

            // Calculer RMS
            double inputRMS = 0.0, outputRMS = 0.0;
            for (int i = 0; i < numSamples; ++i) {
                inputRMS += input[i] * input[i];
                outputRMS += output[i] * output[i];
            }
            inputRMS = std::sqrt(inputRMS / numSamples);
            outputRMS = std::sqrt(outputRMS / numSamples);

            double attenuation = 20.0 * std::log10(outputRMS / inputRMS);
            attenuations.push_back(attenuation);
        }

        std::cout << "   - Atténuation à 500Hz: " << attenuations[0] << " dB\n";
        std::cout << "   - Atténuation à 2000Hz: " << attenuations[1] << " dB\n";
        std::cout << "   - Différence d'atténuation: " << (attenuations[1] - attenuations[0]) << " dB\n";

        // Un filtre passe-bas devrait plus atténuer les hautes fréquences
        if (attenuations[1] < attenuations[0] - 5.0) { // Au moins 5dB de différence
            std::cout << "✅ BiquadFilter passe-bas fonctionne\n";
            return true;
        } else {
            std::cout << "❌ BiquadFilter passe-bas n'atténue pas assez les hautes fréquences\n";
            return false;
        }

    } catch (const std::exception& e) {
        std::cout << "❌ Erreur BiquadFilter passe-bas: " << e.what() << "\n";
        return false;
    }
}

// Test 2: BiquadFilter - Passe-haut
bool testBiquadHighpass() {
    std::cout << "🎵 Test 2: BiquadFilter - Passe-haut...\n";

    try {
        AudioFX::BiquadFilter filter;
        const double sampleRate = 48000.0;
        const double cutoffFreq = 1000.0;
        const double q = 0.707;

        // Configurer le filtre passe-haut
        filter.calculateHighpass(cutoffFreq, sampleRate, q);

        // Test avec des fréquences individuelles
        std::vector<double> testFreqs = {300.0, 2000.0}; // 300Hz devrait être atténué, 2000Hz devrait passer
        std::vector<double> attenuations;

        const int numSamples = 2048;

        for (double freq : testFreqs) {
            std::vector<float> input(numSamples);
            std::vector<float> output(numSamples);

            // Générer un signal sinusoïdal pur
            for (int i = 0; i < numSamples; ++i) {
                double t = static_cast<double>(i) / sampleRate;
                input[i] = std::sin(2.0 * M_PI * freq * t);
            }

            // Traiter le signal
            filter.process(input, output);

            // Calculer RMS
            double inputRMS = 0.0, outputRMS = 0.0;
            for (int i = 0; i < numSamples; ++i) {
                inputRMS += input[i] * input[i];
                outputRMS += output[i] * output[i];
            }
            inputRMS = std::sqrt(inputRMS / numSamples);
            outputRMS = std::sqrt(outputRMS / numSamples);

            double attenuation = 20.0 * std::log10(outputRMS / inputRMS);
            attenuations.push_back(attenuation);
        }

        std::cout << "   - Atténuation à 300Hz: " << attenuations[0] << " dB\n";
        std::cout << "   - Atténuation à 2000Hz: " << attenuations[1] << " dB\n";
        std::cout << "   - Différence d'atténuation: " << (attenuations[0] - attenuations[1]) << " dB\n";

        // Un filtre passe-haut devrait plus atténuer les basses fréquences
        if (attenuations[0] < attenuations[1] - 5.0) { // Au moins 5dB de différence
            std::cout << "✅ BiquadFilter passe-haut fonctionne\n";
            return true;
        } else {
            std::cout << "❌ BiquadFilter passe-haut n'atténue pas assez les basses fréquences\n";
            return false;
        }

    } catch (const std::exception& e) {
        std::cout << "❌ Erreur BiquadFilter passe-haut: " << e.what() << "\n";
        return false;
    }
}

// Test 3: AudioEqualizer - Configuration basique
bool testAudioEqualizerBasic() {
    std::cout << "🎛️  Test 3: AudioEqualizer - Configuration basique...\n";

    try {
        // Créer un égaliseur 10 bandes
        Audio::core::AudioEqualizer equalizer(10, 48000);

        // Configurer quelques bandes
        equalizer.setBandGain(0, 3.0);  // +3dB sur les basses
        equalizer.setBandGain(9, -3.0); // -3dB sur les aigus

        std::cout << "✅ AudioEqualizer configuré avec 10 bandes\n";
        std::cout << "   - Bande 0 (basses): +3dB\n";
        std::cout << "   - Bande 9 (aigus): -3dB\n";

        return true;

    } catch (const std::exception& e) {
        std::cout << "❌ Erreur AudioEqualizer: " << e.what() << "\n";
        return false;
    }
}

// Test 4: AudioEqualizer - Traitement audio
bool testAudioEqualizerProcessing() {
    std::cout << "🎛️  Test 4: AudioEqualizer - Traitement audio...\n";

    try {
        Audio::core::AudioEqualizer equalizer(10, 48000);

        // Appliquer un preset rock (amplifier basses et aigus)
        equalizer.setBandGain(0, 4.0);  // Sub-bass +4dB
        equalizer.setBandGain(1, 3.0);  // Bass +3dB
        equalizer.setBandGain(8, 3.0);  // Brilliance +3dB
        equalizer.setBandGain(9, 2.0);  // Air +2dB

        // Générer un signal de test
        const int numSamples = 1024;
        std::vector<float> input(numSamples);
        std::vector<float> output(numSamples);

        // Signal avec composantes basse et haute fréquence
        for (int i = 0; i < numSamples; ++i) {
            double t = static_cast<double>(i) / 48000.0;
            input[i] = 0.3f * std::sin(2.0 * M_PI * 60.0 * t) +  // Basse 60Hz
                      0.3f * std::sin(2.0 * M_PI * 10000.0 * t); // Haute 10kHz
        }

        // Traiter le signal
        equalizer.process(input, output);

        // Calculer RMS entrée/sortie
        double inputRMS = 0.0, outputRMS = 0.0;
        for (int i = 0; i < numSamples; ++i) {
            inputRMS += input[i] * input[i];
            outputRMS += output[i] * output[i];
        }
        inputRMS = std::sqrt(inputRMS / numSamples);
        outputRMS = std::sqrt(outputRMS / numSamples);

        std::cout << "   - RMS entrée: " << inputRMS << "\n";
        std::cout << "   - RMS sortie: " << outputRMS << "\n";
        std::cout << "   - Gain total: " << (outputRMS / inputRMS) << "x\n";

        // L'égaliseur devrait modifier le signal
        if (std::abs(outputRMS - inputRMS) > 0.001) {
            std::cout << "✅ AudioEqualizer modifie le signal correctement\n";
            return true;
        } else {
            std::cout << "❌ AudioEqualizer ne modifie pas le signal\n";
            return false;
        }

    } catch (const std::exception& e) {
        std::cout << "❌ Erreur AudioEqualizer traitement: " << e.what() << "\n";
        return false;
    }
}

// Test 5: Performance des composants core
bool testCorePerformance() {
    std::cout << "⚡ Test 5: Performance des composants core...\n";

    try {
        const int iterations = 1000;
        const int bufferSize = 2048;

        // Test BiquadFilter
        AudioFX::BiquadFilter filter;
        filter.calculateLowpass(1000.0, 48000.0, 0.707);

        std::vector<float> input(bufferSize);
        std::vector<float> output(bufferSize);

        for (int i = 0; i < bufferSize; ++i) {
            input[i] = std::sin(2.0 * M_PI * 440.0 * i / 48000.0);
        }

        auto start = std::chrono::high_resolution_clock::now();

        for (int i = 0; i < iterations; ++i) {
            filter.process(input, output);
        }

        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);

        double samplesProcessed = static_cast<double>(iterations) * bufferSize;
        double samplesPerMs = samplesProcessed / duration.count();
        double realtimeFactor = samplesPerMs / 48.0; // 48kHz

        std::cout << "   - Temps total: " << duration.count() << " ms\n";
        std::cout << "   - Échantillons traités: " << static_cast<int>(samplesProcessed) << "\n";
        std::cout << "   - Performance: " << realtimeFactor << "x temps réel\n";

        if (realtimeFactor > 10.0) {
            std::cout << "✅ Performance des composants core acceptable\n";
            return true;
        } else {
            std::cout << "❌ Performance insuffisante\n";
            return false;
        }

    } catch (const std::exception& e) {
        std::cout << "❌ Erreur performance: " << e.what() << "\n";
        return false;
    }
}

} // namespace CoreUnitTests

int main() {
    std::cout << "🎵 Test Unitaire du Module Core Audio\n";
    std::cout << "====================================\n\n";

    int passed = 0;
    int total = 5;

    if (CoreUnitTests::testBiquadLowpass()) passed++;
    std::cout << "\n";

    if (CoreUnitTests::testBiquadHighpass()) passed++;
    std::cout << "\n";

    if (CoreUnitTests::testAudioEqualizerBasic()) passed++;
    std::cout << "\n";

    if (CoreUnitTests::testAudioEqualizerProcessing()) passed++;
    std::cout << "\n";

    if (CoreUnitTests::testCorePerformance()) passed++;
    std::cout << "\n";

    // Résumé
    std::cout << "📊 Résumé des tests unitaires core:\n";
    std::cout << "  Tests passés: " << passed << "/" << total << "\n";
    std::cout << "  Taux de succès: " << (100.0 * passed / total) << "%\n\n";

    if (passed == total) {
        std::cout << "🎉 Tous les tests unitaires core ont réussi !\n";
        std::cout << "✅ Le module core est fonctionnel et optimisé.\n";
    } else {
        std::cout << "⚠️  Certains tests unitaires core ont échoué.\n";
        std::cout << "❌ Vérifiez les composants et leur configuration.\n";
    }

    return (passed == total) ? 0 : 1;
}
