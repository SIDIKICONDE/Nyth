// Test de diagnostic pour BiquadFilter
#include <iostream>
#include <vector>
#include <cmath>

// Includes des composants core
#include "../../shared/Audio/core/components/constant/CoreConstants.hpp"
#include "../../shared/Audio/core/components/BiquadFilter/BiquadFilter.hpp"

// Définir M_PI si pas disponible
#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

int main() {
    std::cout << "🔍 Test Diagnostic BiquadFilter\n";
    std::cout << "==============================\n\n";

    AudioFX::BiquadFilter filter;

    // Test 1: Vérifier les coefficients du filtre passe-bas
    std::cout << "Test 1: Coefficients du filtre passe-bas\n";
    filter.calculateLowpass(1000.0, 48000.0, 0.707);

    // Note: BiquadFilter n'expose pas directement les coefficients
    // Testons avec un signal simple
    std::vector<float> input = {1.0f, 0.0f, 0.0f, 0.0f, 0.0f};
    std::vector<float> output(input.size());

    filter.process(input, output);

    std::cout << "   - Entrée:  [";
    for (size_t i = 0; i < input.size(); ++i) {
        std::cout << input[i];
        if (i < input.size() - 1) std::cout << ", ";
    }
    std::cout << "]\n";

    std::cout << "   - Sortie:  [";
    for (size_t i = 0; i < output.size(); ++i) {
        std::cout << output[i];
        if (i < output.size() - 1) std::cout << ", ";
    }
    std::cout << "]\n\n";

    // Test 2: Test avec un signal sinusoïdal
    std::cout << "Test 2: Réponse à une sinusoïde\n";
    const int numSamples = 1024;
    std::vector<float> sineInput(numSamples);
    std::vector<float> sineOutput(numSamples);

    // Générer une sinusoïde à 1000Hz
    for (int i = 0; i < numSamples; ++i) {
        double t = static_cast<double>(i) / 48000.0;
        sineInput[i] = std::sin(2.0 * M_PI * 1000.0 * t);
    }

    filter.process(sineInput, sineOutput);

    // Calculer RMS
    double inputRMS = 0.0, outputRMS = 0.0;
    for (int i = 0; i < numSamples; ++i) {
        inputRMS += sineInput[i] * sineInput[i];
        outputRMS += sineOutput[i] * sineOutput[i];
    }
    inputRMS = std::sqrt(inputRMS / numSamples);
    outputRMS = std::sqrt(outputRMS / numSamples);

    std::cout << "   - RMS entrée: " << inputRMS << "\n";
    std::cout << "   - RMS sortie: " << outputRMS << "\n";
    std::cout << "   - Atténuation: " << (20.0 * std::log10(outputRMS / inputRMS)) << " dB\n\n";

    // Test 3: Vérifier si le filtre est passe-bas ou tout-passe
    std::cout << "Test 3: Analyse de la réponse en fréquence\n";
    std::vector<double> testFreqs = {100.0, 500.0, 1000.0, 2000.0, 5000.0};
    std::vector<double> attenuations;

    for (double freq : testFreqs) {
        std::vector<float> freqInput(numSamples);
        std::vector<float> freqOutput(numSamples);

        for (int i = 0; i < numSamples; ++i) {
            double t = static_cast<double>(i) / 48000.0;
            freqInput[i] = std::sin(2.0 * M_PI * freq * t);
        }

        filter.process(freqInput, freqOutput);

        double freqInputRMS = 0.0, freqOutputRMS = 0.0;
        for (int i = 0; i < numSamples; ++i) {
            freqInputRMS += freqInput[i] * freqInput[i];
            freqOutputRMS += freqOutput[i] * freqOutput[i];
        }
        freqInputRMS = std::sqrt(freqInputRMS / numSamples);
        freqOutputRMS = std::sqrt(freqOutputRMS / numSamples);

        double attenuation = 20.0 * std::log10(freqOutputRMS / freqInputRMS);
        attenuations.push_back(attenuation);

        std::cout << "   - " << freq << " Hz: " << attenuation << " dB\n";
    }

    std::cout << "\nAnalyse: Un filtre passe-bas devrait atténuer les hautes fréquences.\n";
    std::cout << "Si les atténuations sont similaires, le filtre ne fonctionne pas correctement.\n";

    return 0;
}
