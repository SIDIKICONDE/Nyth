#include <iostream>
#include <vector>
#include <iomanip>
#include <cmath>
#include <chrono>

// Chemin relatif depuis __tests__/utils/ vers shared/Audio/common/utils/
#include "../../shared/Audio/common/utils/MathUtils.hpp"

// Directives using pour la commodité
using namespace AudioNR::MathUtils;
using namespace AudioNR::MathUtils::Testing;

/**
 * @brief Exécute une série de tests de validation pour vérifier la précision des fonctions.
 */
void run_tests() {
    std::cout << std::fixed << std::setprecision(8);

    std::cout << "--- Lancement des tests pour expint(x) ---" << std::endl;

    // Cas de test : {valeur d'entrée, résultat attendu}
    const std::vector<std::pair<float, float>> test_cases = {
        {0.5f, 0.5597736f},   // Petite valeur (développement en série)
        {0.8f, 0.3948512f},   // Autour du seuil SERIES_THRESHOLD
        {1.0f, 0.2193839f},   // Valeur moyenne (fraction continue)
        {10.0f, 4.15697e-6f}, // Valeur moyenne (fraction continue)
        {40.0f, 2.7615e-19f}, // Autour du seuil ASYMPTOTIC_THRESHOLD
        {50.0f, 3.7554e-24f}  // Grande valeur (asymptotique)
    };

    bool all_passed = true;
    for (const auto& test : test_cases) {
        float x = test.first;
        float expected = test.second;
        float computed = expint(x);
        float error = relative_error(computed, expected);

        std::cout << "\nTest E1(" << x << "):" << std::endl;
        std::cout << "  Calcule :  " << computed << std::endl;
        std::cout << "  Attendu :  " << expected << std::endl;
        std::cout << "  Erreur rel.: " << error << std::endl;

        if (error > 1e-6f) {
            std::cout << "  -> [!] ECHEC" << std::endl;
            all_passed = false;
        } else {
            std::cout << "  -> [+] SUCCES" << std::endl;
        }
    }

    std::cout << "\n--- Test de En(n, x) ---" << std::endl;
    // E2(1) = e^-1 - E1(1) ≈ 0.36787944 - 0.21938393 = 0.14849551
    float e2_1_computed = expint_en(2, 1.0f);
    float e2_1_expected = 0.14849551f;
    float en_error = relative_error(e2_1_computed, e2_1_expected);
    std::cout << "Test E2(1.0):" << std::endl;
    std::cout << "  Calcule :  " << e2_1_computed << std::endl;
    std::cout << "  Attendu :  " << e2_1_expected << std::endl;
    std::cout << "  Erreur rel.: " << en_error << std::endl;
    if (en_error > 1e-6f) {
        std::cout << "  -> [!] ECHEC" << std::endl;
        all_passed = false;
    } else {
        std::cout << "  -> [+] SUCCES" << std::endl;
    }

    std::cout << "\n--- Resultat Global ---" << std::endl;
    if (all_passed) {
        std::cout << "Tous les tests ont reussi !" << std::endl;
    } else {
        std::cout << "Certains tests ont echoue." << std::endl;
    }
}

/**
 * @brief Exécute des benchmarks pour mesurer la performance des algorithmes.
 */
void run_benchmarks() {
    std::cout << "\n--- Lancement des Benchmarks (1 million d'iterations chacun) ---" << std::endl;

    double time_series = benchmark([](float x){ return internal::expint_series_expansion_kahan(x); }, 0.5f);
    std::cout << "Benchmark Serie (x=0.5):      " << time_series << " secondes" << std::endl;

    double time_cf = benchmark([](float x){ return internal::expint_continued_fraction_enhanced(x); }, 10.0f);
    std::cout << "Benchmark Frac. Cont. (x=10.0): " << time_cf << " secondes" << std::endl;

    double time_asymptotic = benchmark([](float x){ return internal::expint_asymptotic_horner(x); }, 50.0f);
    std::cout << "Benchmark Asymptotique (x=50.0):" << time_asymptotic << " secondes" << std::endl;

    double time_adaptive = benchmark(expint, 10.0f);
    std::cout << "Benchmark Adaptatif (x=10.0):   " << time_adaptive << " secondes" << std::endl;
}

int main() {
    run_tests();
    run_benchmarks();
    return 0;
}
