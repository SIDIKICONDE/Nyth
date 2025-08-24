#include <iostream>
#include <iomanip>
#include <vector>
#include <chrono>
#include "shared/Audio/common/utils/MathUtils.hpp"

using namespace AudioNR::MathUtils;

void test_basic_functions() {
    std::cout << "=== Test des Fonctions de Base ===\n";

    // Test safe_log
    std::cout << "safe_log(1.0): " << safe_log(1.0f) << "\n";
    std::cout << "safe_log(0.001): " << safe_log(0.001f) << "\n";
    std::cout << "safe_log(1e-25): " << safe_log(1e-25f) << "\n";

    // Test clamp
    std::cout << "clamp(5.0, 0.0, 10.0): " << clamp(5.0f, 0.0f, 10.0f) << "\n";
    std::cout << "clamp(-5.0, 0.0, 10.0): " << clamp(-5.0f, 0.0f, 10.0f) << "\n";
    std::cout << "clamp(15.0, 0.0, 10.0): " << clamp(15.0f, 0.0f, 10.0f) << "\n";
}

void test_expint() {
    std::cout << "\n=== Test de la Fonction expint (E1) ===\n";

    std::vector<float> test_values = {0.001f, 0.1f, 1.0f, 5.0f, 10.0f, 50.0f};

    for (float x : test_values) {
        float result = expint(x);
        std::cout << std::fixed << std::setprecision(8)
                  << "E1(" << x << ") = " << result << "\n";
    }
}

void test_expint_ei() {
    std::cout << "\n=== Test de la Fonction expint_ei (Ei) ===\n";

    std::vector<float> test_values = {0.001f, 0.1f, 1.0f, 5.0f, 10.0f};

    for (float x : test_values) {
        float result = expint_ei(x);
        std::cout << std::fixed << std::setprecision(8)
                  << "Ei(" << x << ") = " << result << "\n";
    }
}

void test_expint_en() {
    std::cout << "\n=== Test de la Fonction expint_en (En) ===\n";

    std::vector<std::pair<int, float>> test_cases = {
        {1, 1.0f}, {2, 1.0f}, {3, 1.0f},
        {1, 5.0f}, {2, 5.0f}, {3, 5.0f},
        {10, 2.0f}, {20, 10.0f}
    };

    for (auto& test : test_cases) {
        int n = test.first;
        float x = test.second;
        float result = expint_en(n, x);
        std::cout << std::fixed << std::setprecision(8)
                  << "E" << n << "(" << x << ") = " << result << "\n";
    }
}

void test_edge_cases() {
    std::cout << "\n=== Test des Cas Limites ===\n";

    // Test valeurs spéciales
    std::cout << "expint(0.0): " << expint(0.0f) << " (devrait être NaN)\n";
    std::cout << "expint(-1.0): " << expint(-1.0f) << " (devrait être NaN)\n";
    std::cout << "expint(1e-15): " << expint(1e-15f) << "\n";

    // Test Ei avec valeurs spéciales
    std::cout << "expint_ei(0.0): " << expint_ei(0.0f) << " (devrait être NaN)\n";
    std::cout << "expint_ei(-1.0): " << expint_ei(-1.0f) << " (devrait être NaN)\n";

    // Test En avec paramètres invalides
    std::cout << "expint_en(0, 1.0): " << expint_en(0, 1.0f) << " (devrait être NaN)\n";
    std::cout << "expint_en(-1, 1.0): " << expint_en(-1, 1.0f) << " (devrait être NaN)\n";
}

void test_convergence() {
    std::cout << "\n=== Test de Convergence ===\n";

    // Test de cohérence entre méthodes pour différentes plages
    float x = 2.0f;
    float e1_direct = expint(x);
    float e1_from_en = expint_en(1, x);

    std::cout << std::fixed << std::setprecision(8)
              << "E1 direct(" << x << "): " << e1_direct << "\n"
              << "E1 via En(" << x << "): " << e1_from_en << "\n"
              << "Différence: " << std::abs(e1_direct - e1_from_en) << "\n";
}

void performance_test() {
    std::cout << "\n=== Test de Performance ===\n";

    const int iterations = 100000;
    float test_value = 2.0f;

    // Mesure du temps pour expint
    auto start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < iterations; ++i) {
        volatile float result = expint(test_value);
        (void)result; // Supprimer le warning unused variable
    }
    auto end = std::chrono::high_resolution_clock::now();

    double time_ms = std::chrono::duration<double, std::milli>(end - start).count();
    std::cout << iterations << " appels à expint(): " << time_ms << " ms\n";
    std::cout << "Temps par appel: " << (time_ms * 1000.0 / iterations) << " μs\n";
}

int main() {
    std::cout << "Test du Module MathUtils\n";
    std::cout << "=======================\n";

    try {
        test_basic_functions();
        test_expint();
        test_expint_ei();
        test_expint_en();
        test_edge_cases();
        test_convergence();
        performance_test();

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
