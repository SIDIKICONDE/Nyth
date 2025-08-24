#define _USE_MATH_DEFINES
#include <iostream>
#include <iomanip>
#include <vector>
#include <chrono>
#include <cmath>
#include <cstdlib> // pour rand()
#include "shared/Audio/capture/components/AudioCaptureSIMD.hpp"

// using namespace Nyth::Audio::SIMD;

void testBasicSIMDFunctions() {
    std::cout << "=== Test des Fonctions SIMD de Base ===\n";

    const size_t sampleCount = 1024;
    std::vector<float> input(sampleCount);
    std::vector<float> output(sampleCount);

    // Initialiser les données de test
    for (size_t i = 0; i < sampleCount; ++i) {
        input[i] = sin(2.0f * M_PI * i / sampleCount) * 0.5f;
    }

    // Test processFloat32
    Nyth::Audio::SIMD::processFloat32(input.data(), output.data(), sampleCount, 2.0f);
    std::cout << "processFloat32 avec gain 2.0: OK\n";

    // Test mixFloat32
    std::vector<float> input2(sampleCount);
    for (size_t i = 0; i < sampleCount; ++i) {
        input2[i] = cos(2.0f * M_PI * i / sampleCount) * 0.3f;
    }

    Nyth::Audio::SIMD::mixFloat32(input.data(), input2.data(), output.data(), sampleCount, 0.8f, 0.6f);
    std::cout << "mixFloat32: OK\n";

    // Test calculateRMS
    float rms = Nyth::Audio::SIMD::calculateRMS(input.data(), sampleCount);
    std::cout << "calculateRMS: " << std::fixed << std::setprecision(4) << rms << "\n";

    // Test calculatePeak
    float peak = Nyth::Audio::SIMD::calculatePeak(input.data(), sampleCount);
    std::cout << "calculatePeak: " << std::fixed << std::setprecision(4) << peak << "\n";

    // Test applyGain
    Nyth::Audio::SIMD::applyGain(output.data(), sampleCount, 1.5f);
    std::cout << "applyGain: OK\n";

    // Test applyGainRamp
    Nyth::Audio::SIMD::applyGainRamp(output.data(), sampleCount, 0.5f, 2.0f);
    std::cout << "applyGainRamp: OK\n";
}

void testAudioEffects() {
    std::cout << "\n=== Test des Effets Audio SIMD ===\n";

    const size_t sampleCount = 4096;
    std::vector<float> data(sampleCount);

    // Initialiser les données de test
    for (size_t i = 0; i < sampleCount; ++i) {
        data[i] = sin(2.0f * M_PI * 440.0f * i / 44100.0f) * 0.5f; // Signal 440Hz
    }

    // Test du filtre passe-bas
    Nyth::Audio::SIMD::applyLowPassFilter(data.data(), sampleCount, 1000.0f, 44100.0f);
    std::cout << "applyLowPassFilter: OK\n";

    // Test de l'égaliseur 3 bandes
    Nyth::Audio::SIMD::applyThreeBandEQ(data.data(), sampleCount, 1.2f, 0.8f, 1.5f);
    std::cout << "applyThreeBandEQ: OK\n";

    // Test du compresseur
    Nyth::Audio::SIMD::applyCompressor(data.data(), sampleCount, 0.7f, 4.0f, 0.01f, 0.1f);
    std::cout << "applyCompressor: OK\n";

    // Test de la reverb
    Nyth::Audio::SIMD::applySimpleReverb(data.data(), sampleCount, 0.5f, 0.3f);
    std::cout << "applySimpleReverb: OK\n";

    // Test du tremolo
    Nyth::Audio::SIMD::applyTremolo(data.data(), sampleCount, 5.0f, 0.4f, 44100.0f);
    std::cout << "applyTremolo: OK\n";

    // Test du flanger
    Nyth::Audio::SIMD::applyFlanger(data.data(), sampleCount, 0.5f, 0.6f, 0.4f, 44100.0f);
    std::cout << "applyFlanger: OK\n";

    // Test du limiteur
    Nyth::Audio::SIMD::applyLimiter(data.data(), sampleCount, 0.8f);
    std::cout << "applyLimiter: OK\n";

    // Test du de-esser
    Nyth::Audio::SIMD::applyDeEsser(data.data(), sampleCount, 0.3f, 0.5f, 44100.0f);
    std::cout << "applyDeEsser: OK\n";

    // Test de la noise gate
    Nyth::Audio::SIMD::applyNoiseGate(data.data(), sampleCount, 0.1f, 0.01f, 0.1f);
    std::cout << "applyNoiseGate: OK\n";

    // Test de la distortion
    Nyth::Audio::SIMD::applyDistortion(data.data(), sampleCount, 2.0f, 0.7f);
    std::cout << "applyDistortion: OK\n";

    // Test du chorus
    Nyth::Audio::SIMD::applyChorus(data.data(), sampleCount, 1.0f, 0.5f, 0.3f, 44100.0f);
    std::cout << "applyChorus: OK\n";
}

void testSIMDInfo() {
    std::cout << "\n=== Informations SIMD ===\n";
    std::cout << "SIMD disponible: " << (Nyth::Audio::SIMD::isSimdAvailable() ? "Oui" : "Non") << "\n";
    std::cout << "Type SIMD: " << Nyth::Audio::SIMD::getSimdType() << "\n";
}

void performanceComparison() {
    std::cout << "\n=== Comparaison de Performance ===\n";

    const size_t sampleCount = 1024 * 256; // 256K échantillons
    std::vector<float> input(sampleCount);
    std::vector<float> output(sampleCount);

    // Initialiser les données de test
    for (size_t i = 0; i < sampleCount; ++i) {
        input[i] = static_cast<float>(rand()) / RAND_MAX * 2.0f - 1.0f;
    }

    // Test processFloat32
    auto start = std::chrono::high_resolution_clock::now();
    Nyth::Audio::SIMD::processFloat32(input.data(), output.data(), sampleCount, 1.5f);
    auto end = std::chrono::high_resolution_clock::now();
    double timeMs = std::chrono::duration<double, std::milli>(end - start).count();

    double throughput = sampleCount / (timeMs / 1000.0);
    std::cout << "processFloat32 (" << sampleCount << " samples):\n";
    std::cout << "  Temps: " << std::fixed << std::setprecision(2) << timeMs << " ms\n";
    std::cout << "  Débit: " << (throughput / 1000000.0) << " M échantillons/sec\n";

    // Test calculateRMS
    start = std::chrono::high_resolution_clock::now();
    float rms = Nyth::Audio::SIMD::calculateRMS(input.data(), sampleCount);
    end = std::chrono::high_resolution_clock::now();
    timeMs = std::chrono::duration<double, std::milli>(end - start).count();

    throughput = sampleCount / (timeMs / 1000.0);
    std::cout << "calculateRMS (" << sampleCount << " samples):\n";
    std::cout << "  Temps: " << std::fixed << std::setprecision(2) << timeMs << " ms\n";
    std::cout << "  Débit: " << (throughput / 1000000.0) << " M échantillons/sec\n";
    std::cout << "  RMS: " << std::fixed << std::setprecision(4) << rms << "\n";

    // Test calculatePeak
    start = std::chrono::high_resolution_clock::now();
    float peak = Nyth::Audio::SIMD::calculatePeak(input.data(), sampleCount);
    end = std::chrono::high_resolution_clock::now();
    timeMs = std::chrono::duration<double, std::milli>(end - start).count();

    throughput = sampleCount / (timeMs / 1000.0);
    std::cout << "calculatePeak (" << sampleCount << " samples):\n";
    std::cout << "  Temps: " << std::fixed << std::setprecision(2) << timeMs << " ms\n";
    std::cout << "  Débit: " << (throughput / 1000000.0) << " M échantillons/sec\n";
    std::cout << "  Peak: " << std::fixed << std::setprecision(4) << peak << "\n";
}

int main() {
    std::cout << "Test Complet du Module SIMD AudioCapture\n";
    std::cout << "======================================\n";

    try {
        testSIMDInfo();
        testBasicSIMDFunctions();
        testAudioEffects();
        performanceComparison();

        std::cout << "\n=== Tests Terminés avec Succès ===\n";
        return 0;

    } catch (const std::exception& e) {
        std::cerr << "Erreur pendant les tests: " << e.what() << "\n";
        return 1;
    } catch (...) {
        std::cerr << "Erreur inconnue pendant les tests\n";
        return 1;
    }
}
