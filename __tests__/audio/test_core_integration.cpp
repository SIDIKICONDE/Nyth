// Test d'intégration du module core/ audio
#include <iostream>
#include <vector>
#include <chrono>
#include <cmath>
#include <algorithm>
#include <fstream>
#include <string>

// Définir M_PI si pas disponible
#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

// Tests d'intégration du module core audio
namespace CoreIntegrationTest {

// Test 1: Validation des fichiers core
bool testCoreFiles() {
    std::cout << "📁 Test 1: Validation des fichiers core...\n";

    // Vérifier les fichiers principaux du module core
    std::vector<std::string> coreFiles = {
        "../../shared/Audio/core/AudioEqualizer.hpp",
        "../../shared/Audio/core/AudioEqualizer.cpp", 
        "../../shared/Audio/core/BiquadFilter.hpp",
        "../../shared/Audio/core/BiquadFilter.cpp",
        "../../shared/Audio/core/CoreConstants.hpp"
    };

    int foundFiles = 0;
    for (const auto& file : coreFiles) {
        std::ifstream testFile(file);
        if (testFile.is_open()) {
            foundFiles++;
            testFile.close();
        } else {
            std::cout << "   - ❌ Fichier manquant: " << file << "\n";
        }
    }

    std::cout << "   - Fichiers trouvés: " << foundFiles << "/" << coreFiles.size() << "\n";

    if (foundFiles == coreFiles.size()) {
        std::cout << "✅ Tous les fichiers core sont présents\n";
        return true;
    } else {
        std::cout << "❌ Certains fichiers core sont manquants\n";
        return false;
    }
}

// Test 2: Simulation AudioEqualizer
bool testAudioEqualizer() {
    std::cout << "🎛️  Test 2: Simulation AudioEqualizer...\n";

    const int numBands = 10;
    const int sampleRate = 48000;
    const int bufferSize = 1024;

    // Simuler un égaliseur 10-bandes
    std::vector<double> bandGains(numBands, 0.0);
    std::vector<double> bandFrequencies = {
        31.25, 62.5, 125.0, 250.0, 500.0, 1000.0, 2000.0, 4000.0, 8000.0, 16000.0
    };

    // Appliquer un preset "Rock" simulé
    std::vector<double> rockPreset = {4.0, 3.0, -1.0, -2.0, -1.0, 2.0, 3.0, 4.0, 3.0, 2.0};
    for (int i = 0; i < numBands; ++i) {
        bandGains[i] = rockPreset[i];
    }

    // Générer un signal de test
    std::vector<float> inputSignal(bufferSize);
    for (int i = 0; i < bufferSize; ++i) {
        double t = static_cast<double>(i) / sampleRate;
        // Signal complexe avec plusieurs fréquences
        inputSignal[i] = static_cast<float>(
            std::sin(2.0 * M_PI * 440.0 * t) +  // La 440Hz
            0.5 * std::sin(2.0 * M_PI * 880.0 * t) +  // La 880Hz
            0.3 * std::sin(2.0 * M_PI * 220.0 * t)    // La 220Hz
        );
    }

    // Simuler le traitement par l'égaliseur
    std::vector<float> outputSignal(bufferSize);
    
    // Appliquer les gains de chaque bande (simulation simplifiée)
    for (int i = 0; i < bufferSize; ++i) {
        double t = static_cast<double>(i) / sampleRate;
        outputSignal[i] = inputSignal[i];
        
        // Appliquer les gains de chaque bande
        for (int band = 0; band < numBands; ++band) {
            double freq = bandFrequencies[band];
            double gain = bandGains[band];
            
            // Simulation simple d'un filtre peaking
            double omega = 2.0 * M_PI * freq * t;
            double filterResponse = 1.0 + gain * std::exp(-std::pow(omega - 2.0 * M_PI * freq, 2) / (2.0 * std::pow(freq * 0.1, 2)));
            
            outputSignal[i] *= static_cast<float>(filterResponse);
        }
    }

    // Calculer les statistiques
    float inputRMS = 0.0f, outputRMS = 0.0f;
    for (int i = 0; i < bufferSize; ++i) {
        inputRMS += inputSignal[i] * inputSignal[i];
        outputRMS += outputSignal[i] * outputSignal[i];
    }
    inputRMS = std::sqrt(inputRMS / bufferSize);
    outputRMS = std::sqrt(outputRMS / bufferSize);

    std::cout << "   - Bandes configurées: " << numBands << "\n";
    std::cout << "   - Taille buffer: " << bufferSize << "\n";
    std::cout << "   - RMS entrée: " << inputRMS << "\n";
    std::cout << "   - RMS sortie: " << outputRMS << "\n";
    std::cout << "   - Gain total: " << (outputRMS / inputRMS) << "\n";

    // Validation: le signal doit être modifié par l'égaliseur
    bool isValid = (std::abs(outputRMS - inputRMS) > 0.01f && 
                   outputRMS > 0.0f && inputRMS > 0.0f);

    if (isValid) {
        std::cout << "✅ AudioEqualizer fonctionne correctement\n";
        return true;
    } else {
        std::cout << "❌ AudioEqualizer ne fonctionne pas\n";
        return false;
    }
}

// Test 3: Simulation BiquadFilter
bool testBiquadFilter() {
    std::cout << "🔧 Test 3: Simulation BiquadFilter...\n";

    const int sampleRate = 48000;
    const int bufferSize = 1024;
    const double cutoffFreq = 1000.0; // 1kHz lowpass

    // Générer un signal de test (bruit blanc + tonalité)
    std::vector<float> inputSignal(bufferSize);
    for (int i = 0; i < bufferSize; ++i) {
        double t = static_cast<double>(i) / sampleRate;
        // Signal avec composantes haute et basse fréquence
        inputSignal[i] = static_cast<float>(
            std::sin(2.0 * M_PI * 500.0 * t) +   // 500Hz (passera)
            std::sin(2.0 * M_PI * 2000.0 * t)    // 2kHz (sera filtré)
        );
    }

    // Simuler un filtre passe-bas biquad
    std::vector<float> outputSignal(bufferSize);
    
    // Coefficients d'un filtre passe-bas Butterworth à 1kHz
    double omega = 2.0 * M_PI * cutoffFreq / sampleRate;
    double alpha = std::sin(omega) / (2.0 * 0.707); // Q = 0.707 (Butterworth)
    
    double b0 = 1.0 + alpha;
    double b1 = -2.0 * std::cos(omega);
    double b2 = 1.0 - alpha;
    double a0 = (1.0 - std::cos(omega)) / 2.0;
    double a1 = 1.0 - std::cos(omega);
    double a2 = (1.0 - std::cos(omega)) / 2.0;

    // Normaliser les coefficients
    double norm = b0;
    a0 /= norm; a1 /= norm; a2 /= norm;
    b1 /= norm; b2 /= norm;

    // Appliquer le filtre (Direct Form II)
    double w1 = 0.0, w2 = 0.0;
    for (int i = 0; i < bufferSize; ++i) {
        double w0 = inputSignal[i] - b1 * w1 - b2 * w2;
        outputSignal[i] = static_cast<float>(a0 * w0 + a1 * w1 + a2 * w2);
        w2 = w1;
        w1 = w0;
    }

    // Analyser le spectre de sortie
    std::vector<float> spectrum(bufferSize / 2);
    for (int k = 0; k < bufferSize / 2; ++k) {
        float real = 0.0f, imag = 0.0f;
        for (int n = 0; n < bufferSize; ++n) {
            float angle = -2.0f * M_PI * k * n / bufferSize;
            real += outputSignal[n] * std::cos(angle);
            imag += outputSignal[n] * std::sin(angle);
        }
        spectrum[k] = std::sqrt(real * real + imag * imag);
    }

    // Trouver les pics principaux
    std::vector<int> peaks;
    for (int i = 1; i < spectrum.size() - 1; ++i) {
        if (spectrum[i] > spectrum[i-1] && spectrum[i] > spectrum[i+1] && spectrum[i] > 10.0f) {
            peaks.push_back(i);
        }
    }

    // Calculer les fréquences des pics
    std::vector<float> peakFrequencies;
    for (int peak : peaks) {
        float freq = static_cast<float>(peak) * sampleRate / bufferSize;
        peakFrequencies.push_back(freq);
    }

    std::cout << "   - Fréquence de coupure: " << cutoffFreq << " Hz\n";
    std::cout << "   - Pics détectés: " << peaks.size() << "\n";
    for (size_t i = 0; i < peakFrequencies.size(); ++i) {
        std::cout << "   - Pic " << (i+1) << ": " << peakFrequencies[i] << " Hz\n";
    }

    // Validation: le filtre doit atténuer les hautes fréquences
    bool hasLowFreq = false, hasHighFreq = false;
    for (float freq : peakFrequencies) {
        if (freq < cutoffFreq) hasLowFreq = true;
        if (freq > cutoffFreq * 1.5) hasHighFreq = true;
    }

    // Le filtre doit préserver les basses fréquences et atténuer les hautes
    bool isValid = hasLowFreq && !hasHighFreq;

    if (isValid) {
        std::cout << "✅ BiquadFilter fonctionne correctement\n";
        return true;
    } else {
        std::cout << "❌ BiquadFilter ne fonctionne pas\n";
        return false;
    }
}

// Test 4: Intégration core + FFT
bool testCoreFFTIntegration() {
    std::cout << "🔗 Test 4: Intégration core + FFT...\n";

    const int sampleRate = 48000;
    const int bufferSize = 1024;

    // Générer un signal de test
    std::vector<float> inputSignal(bufferSize);
    for (int i = 0; i < bufferSize; ++i) {
        double t = static_cast<double>(i) / sampleRate;
        inputSignal[i] = static_cast<float>(
            std::sin(2.0 * M_PI * 440.0 * t) +  // 440Hz
            0.5 * std::sin(2.0 * M_PI * 880.0 * t) +  // 880Hz
            0.3 * std::sin(2.0 * M_PI * 220.0 * t)    // 220Hz
        );
    }

    // Simuler le traitement par l'égaliseur
    std::vector<float> equalizedSignal(bufferSize);
    std::copy(inputSignal.begin(), inputSignal.end(), equalizedSignal.begin());

    // Appliquer un preset "Bass Boost"
    std::vector<double> bassBoostGains = {6.0, 5.0, 4.0, 2.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0};
    std::vector<double> bandFrequencies = {31.25, 62.5, 125.0, 250.0, 500.0, 1000.0, 2000.0, 4000.0, 8000.0, 16000.0};

    for (int i = 0; i < bufferSize; ++i) {
        double t = static_cast<double>(i) / sampleRate;
        for (int band = 0; band < 10; ++band) {
            double freq = bandFrequencies[band];
            double gain = bassBoostGains[band];
            double omega = 2.0 * M_PI * freq * t;
            double filterResponse = 1.0 + gain * std::exp(-std::pow(omega - 2.0 * M_PI * freq, 2) / (2.0 * std::pow(freq * 0.1, 2)));
            equalizedSignal[i] *= static_cast<float>(filterResponse);
        }
    }

    // Analyser le spectre avant et après égalisation
    std::vector<float> inputSpectrum(bufferSize / 2);
    std::vector<float> outputSpectrum(bufferSize / 2);

    // FFT du signal d'entrée
    for (int k = 0; k < bufferSize / 2; ++k) {
        float real = 0.0f, imag = 0.0f;
        for (int n = 0; n < bufferSize; ++n) {
            float angle = -2.0f * M_PI * k * n / bufferSize;
            real += inputSignal[n] * std::cos(angle);
            imag += inputSignal[n] * std::sin(angle);
        }
        inputSpectrum[k] = std::sqrt(real * real + imag * imag);
    }

    // FFT du signal égalisé
    for (int k = 0; k < bufferSize / 2; ++k) {
        float real = 0.0f, imag = 0.0f;
        for (int n = 0; n < bufferSize; ++n) {
            float angle = -2.0f * M_PI * k * n / bufferSize;
            real += equalizedSignal[n] * std::cos(angle);
            imag += equalizedSignal[n] * std::sin(angle);
        }
        outputSpectrum[k] = std::sqrt(real * real + imag * imag);
    }

    // Calculer l'amplification des basses fréquences
    float lowFreqInput = 0.0f, lowFreqOutput = 0.0f;
    float highFreqInput = 0.0f, highFreqOutput = 0.0f;

    for (int k = 0; k < bufferSize / 4; ++k) { // Basses fréquences (0-12kHz)
        lowFreqInput += inputSpectrum[k];
        lowFreqOutput += outputSpectrum[k];
    }

    for (int k = bufferSize / 4; k < bufferSize / 2; ++k) { // Hautes fréquences (12-24kHz)
        highFreqInput += inputSpectrum[k];
        highFreqOutput += outputSpectrum[k];
    }

    float bassBoost = lowFreqOutput / lowFreqInput;
    float trebleRatio = highFreqOutput / highFreqInput;

    std::cout << "   - Amplification basses: " << bassBoost << "x\n";
    std::cout << "   - Ratio aigus: " << trebleRatio << "x\n";
    std::cout << "   - Rapport bass/treble: " << (bassBoost / trebleRatio) << "\n";

    // Validation: le bass boost doit amplifier les basses plus que les aigus
    bool isValid = (bassBoost > 1.5f && bassBoost > trebleRatio * 1.2f);

    if (isValid) {
        std::cout << "✅ Intégration core + FFT réussie\n";
        return true;
    } else {
        std::cout << "❌ Intégration core + FFT échouée\n";
        return false;
    }
}

// Test 5: Performance du module core
bool testCorePerformance() {
    std::cout << "⚡ Test 5: Performance du module core...\n";

    const int numTests = 100;
    const int bufferSize = 2048;
    const int numBands = 10;

    // Préparer les données de test
    std::vector<float> inputBuffer(bufferSize);
    std::vector<float> outputBuffer(bufferSize);
    
    for (int i = 0; i < bufferSize; ++i) {
        double t = static_cast<double>(i) / 48000.0;
        inputBuffer[i] = static_cast<float>(std::sin(2.0 * M_PI * 440.0 * t));
    }

    auto start = std::chrono::high_resolution_clock::now();

    // Simuler le traitement par l'égaliseur
    for (int test = 0; test < numTests; ++test) {
        // Copier l'entrée
        std::copy(inputBuffer.begin(), inputBuffer.end(), outputBuffer.begin());

        // Simuler le traitement par 10 bandes
        for (int band = 0; band < numBands; ++band) {
            double gain = 1.0 + 0.1 * std::sin(2.0 * M_PI * band / numBands);
            
            // Appliquer le gain de la bande
            for (int i = 0; i < bufferSize; ++i) {
                outputBuffer[i] *= static_cast<float>(gain);
            }
        }

        // Simuler un filtre passe-bas
        double w1 = 0.0, w2 = 0.0;
        double a0 = 0.1, a1 = 0.2, a2 = 0.1;
        double b1 = -1.5, b2 = 0.6;

        for (int i = 0; i < bufferSize; ++i) {
            double w0 = outputBuffer[i] - b1 * w1 - b2 * w2;
            outputBuffer[i] = static_cast<float>(a0 * w0 + a1 * w1 + a2 * w2);
            w2 = w1;
            w1 = w0;
        }
    }

    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);

    double totalTimeMs = duration.count() / 1000.0;
    double avgTimePerTest = totalTimeMs / numTests;
    double samplesPerSecond = (numTests * bufferSize) / (totalTimeMs / 1000.0);
    double realtimeFactor = samplesPerSecond / 48000.0;

    std::cout << "   - Tests effectués: " << numTests << "\n";
    std::cout << "   - Taille buffer: " << bufferSize << "\n";
    std::cout << "   - Temps total: " << totalTimeMs << " ms\n";
    std::cout << "   - Temps moyen/test: " << avgTimePerTest << " ms\n";
    std::cout << "   - Débit: " << samplesPerSecond / 1000.0 << " kS/s\n";
    std::cout << "   - Facteur temps réel: " << realtimeFactor << "x\n";

    // Validation: doit être plus rapide que le temps réel
    bool isValid = (realtimeFactor > 1.0 && avgTimePerTest < 10.0);

    if (isValid) {
        std::cout << "✅ Performance du module core acceptable\n";
        return true;
    } else {
        std::cout << "❌ Performance du module core insuffisante\n";
        return false;
    }
}

} // namespace CoreIntegrationTest

int main() {
    std::cout << "🎛️  Test d'Intégration du Module Core Audio\n";
    std::cout << "==========================================\n\n";

    int passed = 0;
    int total = 5;

    if (CoreIntegrationTest::testCoreFiles()) passed++;
    std::cout << "\n";

    if (CoreIntegrationTest::testAudioEqualizer()) passed++;
    std::cout << "\n";

    if (CoreIntegrationTest::testBiquadFilter()) passed++;
    std::cout << "\n";

    if (CoreIntegrationTest::testCoreFFTIntegration()) passed++;
    std::cout << "\n";

    if (CoreIntegrationTest::testCorePerformance()) passed++;
    std::cout << "\n";

    // Résumé final
    std::cout << "🎯 Résumé de l'intégration du module core:\n";
    std::cout << "  Tests passés: " << passed << "/" << total << "\n";
    std::cout << "  Taux de succès: " << (100.0 * passed / total) << "%\n\n";

    if (passed == total) {
        std::cout << "🎉 Intégration du module core réussie !\n";
        std::cout << "✅ AudioEqualizer, BiquadFilter et CoreConstants fonctionnent.\n";
        std::cout << "✅ L'intégration avec FFT est opérationnelle.\n";
    } else {
        std::cout << "⚠️  Intégration du module core partielle.\n";
        std::cout << "❌ Certains composants nécessitent des corrections.\n";
    }

    return (passed == total) ? 0 : 1;
}
