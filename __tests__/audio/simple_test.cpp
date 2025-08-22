// Test simple sans dépendances externes pour tester les concepts de base
#include <iostream>
#include <vector>
#include <chrono>
#include <cmath>
#include <algorithm>
#include <limits>
#include "../../shared/Audio/core/CoreConstants.hpp"

using namespace AudioFX;

// Tests simples pour valider les concepts de base
namespace SimpleTest {

// Test de base pour les mathématiques audio
bool testAudioMath() {
    std::cout << "🧮 Test des mathématiques audio...\n";

    // Test de conversion dB <-> linéaire
    auto dbToLinear = [](double db) { return std::pow(10.0, db / 20.0); };
    auto linearToDb = [](double linear) { return 20.0 * std::log10(linear); };

    double testDb = 6.0;
    double linear = dbToLinear(testDb);
    double backToDb = linearToDb(linear);

    if (std::abs(backToDb - testDb) < 0.001) {
        std::cout << "✅ Conversion dB <-> linéaire OK\n";
        return true;
    } else {
        std::cout << "❌ Conversion dB <-> linéaire FAILED\n";
        return false;
    }
}

// Test de génération de signal
bool testSignalGeneration() {
    std::cout << "🎵 Test de génération de signal...\n";

    const int numSamples = 1000;
    const double sampleRate = 44100.0;
    const double frequency = 440.0; // La note A4

    std::vector<double> sineWave(numSamples);

    for (int i = 0; i < numSamples; ++i) {
        double t = static_cast<double>(i) / sampleRate;
        sineWave[i] = std::sin(2.0 * PI * frequency * t);
    }

    // Vérifier que le signal est dans les limites
    double maxVal = *std::max_element(sineWave.begin(), sineWave.end());
    double minVal = *std::min_element(sineWave.begin(), sineWave.end());

    if (maxVal <= 1.0 && minVal >= -1.0) {
        std::cout << "✅ Génération de signal OK\n";
        return true;
    } else {
        std::cout << "❌ Génération de signal FAILED\n";
        return false;
    }
}

// Test de calcul RMS
bool testRMS() {
    std::cout << "📊 Test du calcul RMS...\n";

    std::vector<double> signal = {0.5, -0.5, 0.5, -0.5};

    double sumSquares = 0.0;
    for (double sample : signal) {
        sumSquares += sample * sample;
    }
    double rms = std::sqrt(sumSquares / signal.size());

    double expectedRMS = 0.5; // Pour un signal constant ±0.5

    if (std::abs(rms - expectedRMS) < 0.001) {
        std::cout << "✅ Calcul RMS OK\n";
        return true;
    } else {
        std::cout << "❌ Calcul RMS FAILED (rms=" << rms << ", expected=" << expectedRMS << ")\n";
        return false;
    }
}

// Test de performance basique
bool testBasicPerformance() {
    std::cout << "⚡ Test de performance basique...\n";

    const int iterations = 100000;
    std::vector<double> signal(iterations);

    auto start = std::chrono::high_resolution_clock::now();

    for (int i = 0; i < iterations; ++i) {
        signal[i] = std::sin(2.0 * PI * 440.0 * i / 44100.0);
    }

    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);

    double samplesPerMs = static_cast<double>(iterations) / duration.count();
    double realtimeFactor = samplesPerMs / 44.1; // 44.1kHz

    std::cout << "Performance: " << realtimeFactor << "x temps réel\n";

    if (realtimeFactor > 1.0) {
        std::cout << "✅ Performance OK\n";
        return true;
    } else {
        std::cout << "❌ Performance FAILED\n";
        return false;
    }
}

// Test de validation de signal
bool testSignalValidation() {
    std::cout << "🔍 Test de validation de signal...\n";

    std::vector<double> goodSignal = {0.5, -0.3, 0.8, -0.9};
    std::vector<double> badSignal = {1.5, -2.0, std::nan(""), 0.5};

    // Vérifier le bon signal
    bool goodSignalValid = true;
    for (double sample : goodSignal) {
        if (!std::isfinite(sample) || std::abs(sample) > 1.0) {
            goodSignalValid = false;
            break;
        }
    }

    // Vérifier le mauvais signal
    bool badSignalInvalid = false;
    for (double sample : badSignal) {
        if (!std::isfinite(sample) || std::abs(sample) > 1.0) {
            badSignalInvalid = true;
            break;
        }
    }

    if (goodSignalValid && badSignalInvalid) {
        std::cout << "✅ Validation de signal OK\n";
        return true;
    } else {
        std::cout << "❌ Validation de signal FAILED\n";
        return false;
    }
}

} // namespace SimpleTest

int main() {
    std::cout << "🎵 Test Simple Audio - Validation des Concepts de Base\n";
    std::cout << "===================================================\n\n";

    int passed = 0;
    int total = 5;

    if (SimpleTest::testAudioMath()) passed++;
    std::cout << "\n";

    if (SimpleTest::testSignalGeneration()) passed++;
    std::cout << "\n";

    if (SimpleTest::testRMS()) passed++;
    std::cout << "\n";

    if (SimpleTest::testBasicPerformance()) passed++;
    std::cout << "\n";

    if (SimpleTest::testSignalValidation()) passed++;
    std::cout << "\n";

    // Résumé
    std::cout << "📊 Résumé des tests:\n";
    std::cout << "  Tests passés: " << passed << "/" << total << "\n";
    std::cout << "  Taux de succès: " << (100.0 * passed / total) << "%\n\n";

    if (passed == total) {
        std::cout << "🎉 Tous les tests ont réussi !\n";
        std::cout << "✅ Les concepts de base de l'audio numérique fonctionnent correctement.\n";
    } else {
        std::cout << "⚠️  Certains tests ont échoué.\n";
        std::cout << "❌ Vérifiez l'implémentation et les dépendances.\n";
    }

    return (passed == total) ? 0 : 1;
}
