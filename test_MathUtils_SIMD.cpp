#define _USE_MATH_DEFINES
#include <iostream>
#include <iomanip>
#include <vector>
#include <chrono>
#include <cmath>
#include <cstdlib>
#include "shared/Audio/common/utils/MathUtils.hpp"

using namespace AudioNR::MathUtils;

void testSIMDSupport() {
    std::cout << "=== Test du Support SIMD ===\n";
    std::cout << "Support SIMD: " << (has_simd_support() ? "Oui" : "Non") << "\n";
    std::cout << "Type SIMD: " << get_simd_type() << "\n";
    std::cout << "Taille vector max: " << MAX_VECTOR_SIZE << " éléments\n";
    std::cout << std::endl;
}

void testExpintVectorized() {
    std::cout << "=== Test expint Vectorisé ===\n";

    const int sampleCount = 1024;
    std::vector<float> input(sampleCount);
    std::vector<float> result_scalar(sampleCount);
    std::vector<float> result_vector(sampleCount);

    // Initialiser les données de test
    for (int i = 0; i < sampleCount; ++i) {
        input[i] = 0.1f + static_cast<float>(i) * 5.0f / sampleCount; // 0.1 à 5.1
    }

    // Test version scalaire
    auto start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < sampleCount; ++i) {
        result_scalar[i] = expint(input[i]);
    }
    auto end = std::chrono::high_resolution_clock::now();
    double timeScalar = std::chrono::duration<double, std::milli>(end - start).count();

    // Test version vectorisée
    start = std::chrono::high_resolution_clock::now();
    expint_vectorized_auto(input.data(), result_vector.data(), sampleCount);
    end = std::chrono::high_resolution_clock::now();
    double timeVector = std::chrono::duration<double, std::milli>(end - start).count();

    // Comparaison des résultats
    double maxError = 0.0;
    for (int i = 0; i < sampleCount; ++i) {
        double error = std::abs(result_scalar[i] - result_vector[i]);
        if (error > maxError) maxError = error;
    }

    std::cout << "Temps scalaire: " << std::fixed << std::setprecision(3) << timeScalar << " ms\n";
    std::cout << "Temps vectorisé: " << std::fixed << std::setprecision(3) << timeVector << " ms\n";
    std::cout << "Accélération: " << std::fixed << std::setprecision(2) << (timeScalar / timeVector) << "x\n";
    std::cout << "Erreur max: " << std::scientific << maxError << "\n";
    std::cout << std::endl;
}

void testExpintEIVectorized() {
    std::cout << "=== Test expint_ei Vectorisé ===\n";

    const int sampleCount = 512;
    std::vector<float> input(sampleCount);
    std::vector<float> result_scalar(sampleCount);
    std::vector<float> result_vector(sampleCount);

    // Initialiser les données de test
    for (int i = 0; i < sampleCount; ++i) {
        input[i] = 0.1f + static_cast<float>(i) * 3.0f / sampleCount; // 0.1 à 3.1
    }

    // Test version scalaire
    auto start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < sampleCount; ++i) {
        result_scalar[i] = expint_ei(input[i]);
    }
    auto end = std::chrono::high_resolution_clock::now();
    double timeScalar = std::chrono::duration<double, std::milli>(end - start).count();

    // Test version vectorisée
    start = std::chrono::high_resolution_clock::now();
    expint_ei_vectorized_auto(input.data(), result_vector.data(), sampleCount);
    end = std::chrono::high_resolution_clock::now();
    double timeVector = std::chrono::duration<double, std::milli>(end - start).count();

    // Comparaison des résultats
    double maxError = 0.0;
    for (int i = 0; i < sampleCount; ++i) {
        double error = std::abs(result_scalar[i] - result_vector[i]);
        if (error > maxError) maxError = error;
    }

    std::cout << "Temps scalaire: " << std::fixed << std::setprecision(3) << timeScalar << " ms\n";
    std::cout << "Temps vectorisé: " << std::fixed << std::setprecision(3) << timeVector << " ms\n";
    std::cout << "Accélération: " << std::fixed << std::setprecision(2) << (timeScalar / timeVector) << "x\n";
    std::cout << "Erreur max: " << std::scientific << maxError << "\n";
    std::cout << std::endl;
}

void testBatchFunctions() {
    std::cout << "=== Test des Fonctions Batch ===\n";

    const int sampleCount = 256;
    std::vector<float> input(sampleCount);
    std::vector<float> result_expint(sampleCount);
    std::vector<float> result_ei(sampleCount);

    // Initialiser les données de test
    for (int i = 0; i < sampleCount; ++i) {
        input[i] = 0.1f + static_cast<float>(i) * 2.0f / sampleCount;
    }

    // Test expint_batch
    auto start = std::chrono::high_resolution_clock::now();
    expint_batch(input.data(), result_expint.data(), sampleCount);
    auto end = std::chrono::high_resolution_clock::now();
    double timeExpint = std::chrono::duration<double, std::milli>(end - start).count();

    // Test expint_ei_batch
    start = std::chrono::high_resolution_clock::now();
    expint_ei_batch(input.data(), result_ei.data(), sampleCount);
    end = std::chrono::high_resolution_clock::now();
    double timeEi = std::chrono::duration<double, std::milli>(end - start).count();

    std::cout << "expint_batch (" << sampleCount << " samples): " << std::fixed << std::setprecision(3) << timeExpint << " ms\n";
    std::cout << "expint_ei_batch (" << sampleCount << " samples): " << std::fixed << std::setprecision(3) << timeEi << " ms\n";

    // Afficher quelques résultats
    std::cout << "Quelques résultats expint:\n";
    for (int i = 0; i < 5; ++i) {
        int idx = i * sampleCount / 5;
        std::cout << "  expint(" << std::fixed << std::setprecision(2) << input[idx] << ") = "
                  << std::scientific << result_expint[idx] << "\n";
    }

    std::cout << "Quelques résultats expint_ei:\n";
    for (int i = 0; i < 5; ++i) {
        int idx = i * sampleCount / 5;
        std::cout << "  Ei(" << std::fixed << std::setprecision(2) << input[idx] << ") = "
                  << std::scientific << result_ei[idx] << "\n";
    }
    std::cout << std::endl;
}

void testUtilityFunctions() {
    std::cout << "=== Test des Fonctions Utilitaires SIMD ===\n";

    const int sampleCount = 128;
    std::vector<float> input(sampleCount);
    std::vector<float> log_result(sampleCount);
    std::vector<float> exp_result(sampleCount);

    // Initialiser les données de test (valeurs positives pour log)
    for (int i = 0; i < sampleCount; ++i) {
        input[i] = 0.1f + static_cast<float>(i) * 2.0f / sampleCount;
    }

    // Test safe_log_batch
    auto start = std::chrono::high_resolution_clock::now();
    safe_log_batch(input.data(), log_result.data(), sampleCount);
    auto end = std::chrono::high_resolution_clock::now();
    double timeLog = std::chrono::duration<double, std::milli>(end - start).count();

    // Test safe_exp_batch
    start = std::chrono::high_resolution_clock::now();
    safe_exp_batch(input.data(), exp_result.data(), sampleCount);
    end = std::chrono::high_resolution_clock::now();
    double timeExp = std::chrono::duration<double, std::milli>(end - start).count();

    std::cout << "safe_log_batch (" << sampleCount << " samples): " << std::fixed << std::setprecision(3) << timeLog << " ms\n";
    std::cout << "safe_exp_batch (" << sampleCount << " samples): " << std::fixed << std::setprecision(3) << timeExp << " ms\n";

    // Vérifier quelques résultats
    std::cout << "Vérification log:\n";
    for (int i = 0; i < 3; ++i) {
        int idx = i * sampleCount / 3;
        float expected_log = std::log(input[idx]);
        std::cout << "  log(" << std::fixed << std::setprecision(2) << input[idx] << ") = "
                  << std::scientific << log_result[idx]
                  << " (expected: " << expected_log << ")\n";
    }

    std::cout << "Vérification exp:\n";
    for (int i = 0; i < 3; ++i) {
        int idx = i * sampleCount / 3;
        float expected_exp = std::exp(input[idx]);
        std::cout << "  exp(" << std::fixed << std::setprecision(2) << input[idx] << ") = "
                  << std::scientific << exp_result[idx]
                  << " (expected: " << expected_exp << ")\n";
    }
    std::cout << std::endl;
}

void performanceBenchmark() {
    std::cout << "=== Benchmark de Performance ===\n";

    std::vector<size_t> sizes = {64, 256, 1024, 4096, 16384};
    std::vector<float> input(16384);
    std::vector<float> output(16384);

    // Initialiser les données de test
    for (size_t i = 0; i < 16384; ++i) {
        input[i] = 0.1f + static_cast<float>(i) * 3.0f / 16384;
    }

    for (size_t size : sizes) {
        // Benchmark version vectorisée
        auto start = std::chrono::high_resolution_clock::now();
        expint_vectorized_auto(input.data(), output.data(), static_cast<int>(size));
        auto end = std::chrono::high_resolution_clock::now();
        double timeVector = std::chrono::duration<double, std::milli>(end - start).count();

        // Benchmark version scalaire
        start = std::chrono::high_resolution_clock::now();
        for (size_t i = 0; i < size; ++i) {
            output[i] = expint(input[i]);
        }
        end = std::chrono::high_resolution_clock::now();
        double timeScalar = std::chrono::duration<double, std::milli>(end - start).count();

        double throughputVector = size / (timeVector / 1000.0);
        double throughputScalar = size / (timeScalar / 1000.0);
        double speedup = timeScalar / timeVector;

        std::cout << "Taille: " << std::setw(5) << size << " | ";
        std::cout << "Vector: " << std::fixed << std::setprecision(1) << (throughputVector / 1000.0) << "Kéch/sec | ";
        std::cout << "Scalar: " << std::fixed << std::setprecision(1) << (throughputScalar / 1000.0) << "Kéch/sec | ";
        std::cout << "Speedup: " << std::fixed << std::setprecision(2) << speedup << "x\n";
    }
    std::cout << std::endl;
}

int main() {
    std::cout << "Test Complet du SIMD dans MathUtils.hpp\n";
    std::cout << "=======================================\n";

    try {
        testSIMDSupport();
        testExpintVectorized();
        testExpintEIVectorized();
        testBatchFunctions();
        testUtilityFunctions();
        performanceBenchmark();

        std::cout << "=== Tests SIMD Terminés avec Succès ===\n";
        return 0;

    } catch (const std::exception& e) {
        std::cerr << "Erreur pendant les tests: " << e.what() << "\n";
        return 1;
    } catch (...) {
        std::cerr << "Erreur inconnue pendant les tests\n";
        return 1;
    }
}
