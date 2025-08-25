#include "../../shared/Audio/common/SIMD/SIMDCore.hpp"
#include "../../shared/Audio/common/SIMD/SIMDMathFunctions.hpp"
#include "../../shared/Audio/common/SIMD/SIMDIntegration.hpp"
#include <iostream>
#include <iomanip>
#include <vector>
#include <chrono>
#include <cmath>
#include <random>
#include <cassert>

// Macro pour les tests
#define TEST_ASSERT(condition, message) \
    do { \
        if (!(condition)) { \
            std::cout << "❌ TEST FAILED: " << message << std::endl; \
            return false; \
        } \
    } while(0)

#define TEST_SUCCESS(message) \
    std::cout << "✅ " << message << std::endl

#define PERFORMANCE_TEST(func, name, iterations) \
    do { \
        auto start = std::chrono::high_resolution_clock::now(); \
        for (int i = 0; i < iterations; ++i) { func; } \
        auto end = std::chrono::high_resolution_clock::now(); \
        double time = std::chrono::duration<double, std::milli>(end - start).count(); \
        std::cout << "⏱️  " << name << ": " << std::fixed << std::setprecision(2) << time << "ms" << std::endl; \
    } while(0)

// Générateur de nombres aléatoires
class RandomGenerator {
private:
    std::mt19937 gen;
    std::uniform_real_distribution<float> dist;

public:
    RandomGenerator(float min = -1.0f, float max = 1.0f)
        : gen(std::random_device{}()), dist(min, max) {}

    float next() { return dist(gen); }

    void fillArray(float* array, size_t size) {
        for (size_t i = 0; i < size; ++i) {
            array[i] = next();
        }
    }

    std::vector<float> generate(size_t size) {
        std::vector<float> result(size);
        fillArray(result.data(), size);
        return result;
    }
};

namespace AudioNR {
namespace SIMD {
namespace Tests {

// Test de la détection SIMD
bool testSIMDDetection() {
    std::cout << "\n🔍 === TEST DE DÉTECTION SIMD ===" << std::endl;

    bool hasSIMD = SIMDDetector::hasSIMD();
    bool hasNEON = SIMDDetector::hasNEON();

    TEST_SUCCESS("Détection SIMD: " + std::string(hasSIMD ? "DISPONIBLE" : "INDISPONIBLE"));
    TEST_SUCCESS("Détection NEON: " + std::string(hasNEON ? "DISPONIBLE" : "INDISPONIBLE"));
    TEST_SUCCESS("Type SIMD recommandé: " + SIMDDetector::getBestSIMDType());
    TEST_SUCCESS("Taille du vecteur: " + std::to_string(SIMDDetector::getVectorSize()) + " floats");

    return true;
}

// Test des fonctions mathématiques de base
bool testBasicMathFunctions() {
    std::cout << "\n🧮 === TEST FONCTIONS MATHÉMATIQUES DE BASE ===" << std::endl;

    const size_t TEST_SIZE = 1024;
    RandomGenerator rand(-1.0f, 1.0f);

    auto a = rand.generate(TEST_SIZE);
    auto b = rand.generate(TEST_SIZE);
    auto result = std::vector<float>(TEST_SIZE);

    // Test ADD
    SIMDMath::add(result.data(), a.data(), b.data(), TEST_SIZE);
    bool addCorrect = true;
    for (size_t i = 0; i < 10; ++i) {
        if (std::abs(result[i] - (a[i] + b[i])) > 1e-6f) {
            addCorrect = false;
            break;
        }
    }
    TEST_ASSERT(addCorrect, "Addition SIMD incorrecte");
    TEST_SUCCESS("Addition SIMD - OK");

    // Test MULTIPLY
    SIMDMath::multiply(result.data(), a.data(), b.data(), TEST_SIZE);
    bool mulCorrect = true;
    for (size_t i = 0; i < 10; ++i) {
        if (std::abs(result[i] - (a[i] * b[i])) > 1e-6f) {
            mulCorrect = false;
            break;
        }
    }
    TEST_ASSERT(mulCorrect, "Multiplication SIMD incorrecte");
    TEST_SUCCESS("Multiplication SIMD - OK");

    // Test SUM
    float sum = SIMDMath::sum(a.data(), TEST_SIZE);
    float expectedSum = 0.0f;
    for (size_t i = 0; i < TEST_SIZE; ++i) {
        expectedSum += a[i];
    }
    TEST_ASSERT(std::abs(sum - expectedSum) < 1e-5f, "Somme SIMD incorrecte");
    TEST_SUCCESS("Somme SIMD - OK (résultat: " + std::to_string(sum) + ")");

    // Test MAX
    float maxVal = SIMDMath::max(a.data(), TEST_SIZE);
    float expectedMax = -INFINITY;
    for (size_t i = 0; i < TEST_SIZE; ++i) {
        expectedMax = std::max(expectedMax, a[i]);
    }
    TEST_ASSERT(std::abs(maxVal - expectedMax) < 1e-6f, "Maximum SIMD incorrect");
    TEST_SUCCESS("Maximum SIMD - OK (résultat: " + std::to_string(maxVal) + ")");

    // Test RMS
    float rms = SIMDMath::rms(a.data(), TEST_SIZE);
    float expectedRMS = std::sqrt(expectedSum * expectedSum / TEST_SIZE);
    TEST_ASSERT(std::abs(rms - expectedRMS) < 1e-5f, "RMS SIMD incorrect");
    TEST_SUCCESS("RMS SIMD - OK (résultat: " + std::to_string(rms) + ")");

    return true;
}

// Test des fonctions mathématiques avancées
bool testAdvancedMathFunctions() {
    std::cout << "\n🔬 === TEST FONCTIONS MATHÉMATIQUES AVANCÉES ===" << std::endl;

    const size_t TEST_SIZE = 512;
    RandomGenerator rand(0.1f, 10.0f);

    auto x = rand.generate(TEST_SIZE);
    auto result = std::vector<float>(TEST_SIZE);

    // Test expint_e1
    SIMDMathFunctions::expint_e1_vectorized(x.data(), result.data(), TEST_SIZE);

    bool expintCorrect = true;
    for (size_t i = 0; i < 10; ++i) {
        float expected = SIMDMathFunctions::expint_e1_scalar(x[i]);
        if (std::abs(result[i] - expected) > 1e-4f) {
            expintCorrect = false;
            break;
        }
    }
    TEST_ASSERT(expintCorrect, "expint_e1 vectorisé incorrect");
    TEST_SUCCESS("expint_e1 vectorisé - OK");

    // Test des fonctions trigonométriques
    RandomGenerator randTrig(-M_PI, M_PI);
    auto angles = randTrig.generate(TEST_SIZE);

    SIMDMathFunctions::sin_vectorized(angles.data(), result.data(), TEST_SIZE);
    bool sinCorrect = true;
    for (size_t i = 0; i < 10; ++i) {
        float expected = std::sin(angles[i]);
        if (std::abs(result[i] - expected) > 1e-3f) {
            sinCorrect = false;
            break;
        }
    }
    TEST_ASSERT(sinCorrect, "sin vectorisé incorrect");
    TEST_SUCCESS("sin vectorisé - OK");

    // Test tanh
    SIMDMathFunctions::tanh_vectorized(angles.data(), result.data(), TEST_SIZE);
    bool tanhCorrect = true;
    for (size_t i = 0; i < 10; ++i) {
        float expected = std::tanh(angles[i]);
        if (std::abs(result[i] - expected) > 1e-3f) {
            tanhCorrect = false;
            break;
        }
    }
    TEST_ASSERT(tanhCorrect, "tanh vectorisé incorrect");
    TEST_SUCCESS("tanh vectorisé - OK");

    return true;
}

// Test de la gestion mémoire alignée
bool testMemoryManagement() {
    std::cout << "\n💾 === TEST GESTION MÉMOIRE ALIGNÉE ===" << std::endl;

    const size_t TEST_SIZE = 2048;

    // Test allocation alignée
    float* alignedBuffer = AlignedMemory::allocate<float>(TEST_SIZE);
    TEST_ASSERT(alignedBuffer != nullptr, "Allocation alignée échouée");
    TEST_SUCCESS("Allocation alignée - OK");

    // Test vérification d'alignement
    bool isAligned = AlignedMemory::isAligned(alignedBuffer);
    TEST_ASSERT(isAligned, "Buffer non aligné");
    TEST_SUCCESS("Vérification d'alignement - OK");

    // Test utilisation avec SIMD
    RandomGenerator rand;
    rand.fillArray(alignedBuffer, TEST_SIZE);

    // Test que les opérations SIMD fonctionnent avec la mémoire alignée
    float sum = SIMDMath::sum(alignedBuffer, TEST_SIZE);
    TEST_ASSERT(!std::isnan(sum) && !std::isinf(sum), "Somme avec mémoire alignée produite NaN/Inf");
    TEST_SUCCESS("Opérations SIMD avec mémoire alignée - OK");

    // Test deallocate
    AlignedMemory::deallocate(alignedBuffer);
    TEST_SUCCESS("Désallocation alignée - OK");

    return true;
}

// Test des utilitaires SIMD
bool testSIMDUtils() {
    std::cout << "\n🔧 === TEST UTILITAIRES SIMD ===" << std::endl;

    const size_t TEST_SIZE = 1024;
    RandomGenerator rand(-0.9f, 0.9f);

    auto data = rand.generate(TEST_SIZE);

    // Test applyGain
    std::vector<float> gainData = data;
    SIMDUtils::applyGain(gainData.data(), TEST_SIZE, 2.0f);

    bool gainCorrect = true;
    for (size_t i = 0; i < 10; ++i) {
        if (std::abs(gainData[i] - data[i] * 2.0f) > 1e-6f) {
            gainCorrect = false;
            break;
        }
    }
    TEST_ASSERT(gainCorrect, "Application de gain incorrecte");
    TEST_SUCCESS("Application de gain - OK");

    // Test clamp
    std::vector<float> clampData = data;
    SIMDUtils::clamp(clampData.data(), TEST_SIZE, -0.5f, 0.5f);

    bool clampCorrect = true;
    for (size_t i = 0; i < TEST_SIZE; ++i) {
        float expected = std::max(-0.5f, std::min(0.5f, data[i]));
        if (std::abs(clampData[i] - expected) > 1e-6f) {
            clampCorrect = false;
            break;
        }
    }
    TEST_ASSERT(clampCorrect, "Clamp incorrect");
    TEST_SUCCESS("Clamp - OK");

    // Test mixFloat32
    std::vector<float> input2 = rand.generate(TEST_SIZE);
    std::vector<float> mixed(TEST_SIZE);

    SIMDUtils::mixFloat32(data.data(), input2.data(), mixed.data(), TEST_SIZE, 0.7f, 0.3f);

    bool mixCorrect = true;
    for (size_t i = 0; i < 10; ++i) {
        float expected = data[i] * 0.7f + input2[i] * 0.3f;
        if (std::abs(mixed[i] - expected) > 1e-6f) {
            mixCorrect = false;
            break;
        }
    }
    TEST_ASSERT(mixCorrect, "Mixage audio incorrect");
    TEST_SUCCESS("Mixage audio - OK");

    return true;
}

// Test des processeurs DSP SIMD
bool testDSPProcessors() {
    std::cout << "\n🎵 === TEST PROCESSEURS DSP SIMD ===" << std::endl;

    const size_t TEST_SIZE = 2048;
    RandomGenerator rand(-0.8f, 0.8f);

    auto data = rand.generate(TEST_SIZE);

    // Test SIMDFilter
    SIMDFilter lowpass(SIMDFilter::LOWPASS, 1000.0f, 0.707f);
    TEST_ASSERT(lowpass.isSIMDAccelerated(), "Filtre pas accéléré SIMD");
    TEST_SUCCESS("SIMDFilter - OK");

    std::vector<float> filtered = data;
    lowpass.process(filtered.data(), TEST_SIZE);
    TEST_SUCCESS("Traitement filtre passe-bas - OK");

    // Test SIMDDistortion
    SIMDDistortion tanhDistortion(SIMDDistortion::TANH, 2.0f, 0.8f);
    TEST_ASSERT(tanhDistortion.isSIMDAccelerated(), "Distortion pas accélérée SIMD");
    TEST_SUCCESS("SIMDDistortion - OK");

    std::vector<float> distorted = data;
    tanhDistortion.process(distorted.data(), TEST_SIZE);
    TEST_SUCCESS("Traitement distortion tanh - OK");

    // Test SIMDReverb
    SIMDReverb reverb(0.4f, 0.3f, 0.6f);
    TEST_ASSERT(reverb.isSIMDAccelerated(), "Reverb pas accélérée SIMD");
    TEST_SUCCESS("SIMDReverb - OK");

    std::vector<float> reverbed = data;
    reverb.process(reverbed.data(), TEST_SIZE);
    TEST_SUCCESS("Traitement reverb - OK");

    // Test SIMDDelay
    SIMDDelay delay(200.0f, 0.2f, 0.4f);
    TEST_ASSERT(delay.isSIMDAccelerated(), "Delay pas accéléré SIMD");
    TEST_SUCCESS("SIMDDelay - OK");

    std::vector<float> delayed = data;
    delay.process(delayed.data(), TEST_SIZE);
    TEST_SUCCESS("Traitement delay - OK");

    return true;
}

// Test des benchmarks
bool testBenchmarks() {
    std::cout << "\n📊 === TEST BENCHMARKS ===" << std::endl;

    const size_t BENCHMARK_SIZE = 100000;
    RandomGenerator rand(-1.0f, 1.0f);

    auto data = rand.generate(BENCHMARK_SIZE);
    auto result = std::vector<float>(BENCHMARK_SIZE);

    std::cout << "Benchmark avec " << BENCHMARK_SIZE << " échantillons:" << std::endl;

    // Benchmark addition
    PERFORMANCE_TEST(
        SIMDMath::add(result.data(), data.data(), data.data(), BENCHMARK_SIZE),
        "Addition SIMD", 1000
    );

    // Benchmark multiplication
    PERFORMANCE_TEST(
        SIMDMath::multiply(result.data(), data.data(), data.data(), BENCHMARK_SIZE),
        "Multiplication SIMD", 1000
    );

    // Benchmark somme
    PERFORMANCE_TEST(
        volatile float s = SIMDMath::sum(data.data(), BENCHMARK_SIZE),
        "Somme SIMD", 1000
    );

    // Benchmark sin vectorisé
    std::vector<float> angles(BENCHMARK_SIZE);
    for (size_t i = 0; i < BENCHMARK_SIZE; ++i) {
        angles[i] = (static_cast<float>(i) / BENCHMARK_SIZE) * 2.0f * M_PI;
    }

    PERFORMANCE_TEST(
        SIMDMathFunctions::sin_vectorized(angles.data(), result.data(), BENCHMARK_SIZE),
        "Sin vectorisé", 100
    );

    // Benchmark tanh vectorisé
    PERFORMANCE_TEST(
        SIMDMathFunctions::tanh_vectorized(data.data(), result.data(), BENCHMARK_SIZE),
        "Tanh vectorisé", 100
    );

    return true;
}

// Test de précision
bool testPrecision() {
    std::cout << "\n🎯 === TEST PRÉCISION ===" << std::endl;

    const size_t TEST_SIZE = 10000;
    RandomGenerator rand(-10.0f, 10.0f);

    auto data = rand.generate(TEST_SIZE);
    auto result = std::vector<float>(TEST_SIZE);

    // Test précision des fonctions mathématiques
    float maxErrorSin = 0.0f;
    float maxErrorTanh = 0.0f;
    float maxErrorExpint = 0.0f;

    for (size_t i = 0; i < TEST_SIZE; ++i) {
        float x = data[i];

        // Test sin
        result[i] = std::sin(x);
        float sinApprox = LookupTables::getInstance().fastSin(x);
        maxErrorSin = std::max(maxErrorSin, std::abs(result[i] - sinApprox));

        // Test tanh
        result[i] = std::tanh(x);
        SIMDMathFunctions::tanh_vectorized(&x, &sinApprox, 1);
        maxErrorTanh = std::max(maxErrorTanh, std::abs(result[i] - sinApprox));

        // Test expint_e1 (pour valeurs positives)
        if (x > 0) {
            result[i] = SIMDMathFunctions::expint_e1_scalar(x);
            SIMDMathFunctions::expint_e1_vectorized(&x, &sinApprox, 1);
            maxErrorExpint = std::max(maxErrorExpint, std::abs(result[i] - sinApprox));
        }
    }

    std::cout << "Précision des approximations:" << std::endl;
    std::cout << "  Sin (LUT): erreur max = " << std::scientific << maxErrorSin << std::endl;
    std::cout << "  Tanh: erreur max = " << std::scientific << maxErrorTanh << std::endl;
    std::cout << "  Expint_e1: erreur max = " << std::scientific << maxErrorExpint << std::endl;

    // Vérifier que la précision est acceptable pour l'audio
    TEST_ASSERT(maxErrorSin < 0.01f, "Précision sin trop faible");
    TEST_ASSERT(maxErrorTanh < 0.01f, "Précision tanh trop faible");
    TEST_SUCCESS("Précision des approximations - OK");

    return true;
}

// Test de l'intégration
bool testIntegration() {
    std::cout << "\n🔗 === TEST INTÉGRATION ===" << std::endl;

    // Test SIMDIntegration
    std::string info = SIMDIntegration::getSIMDMathInfo();
    TEST_SUCCESS("Informations SIMD: " + info);

    bool isAvailable = SIMDIntegration::isSIMDMathAvailable();
    TEST_SUCCESS("SIMD disponible: " + std::string(isAvailable ? "Oui" : "Non"));

    // Test enable/disable
    SIMDIntegration::enableSIMDAcceleration(true);
    bool isEnabled = SIMDIntegration::isSIMDAccelerationEnabled();
    TEST_ASSERT(isEnabled, "Accélération SIMD non activée");
    TEST_SUCCESS("Activation SIMD - OK");

    // Test expint_with_simd
    float testValue = 2.0f;
    float result = SIMDIntegration::expint_with_simd(testValue);
    TEST_ASSERT(!std::isnan(result) && !std::isinf(result), "expint_with_simd retourne NaN/Inf");
    TEST_SUCCESS("expint_with_simd - OK (résultat: " + std::to_string(result) + ")");

    // Test expint_vectorized
    const size_t TEST_SIZE = 1024;
    RandomGenerator rand(0.1f, 5.0f);
    auto x = rand.generate(TEST_SIZE);
    auto resultVec = std::vector<float>(TEST_SIZE);

    SIMDIntegration::expint_vectorized(x.data(), resultVec.data(), TEST_SIZE);

    bool vectorizedCorrect = true;
    for (size_t i = 0; i < 10; ++i) {
        if (std::isnan(resultVec[i]) || std::isinf(resultVec[i])) {
            vectorizedCorrect = false;
            break;
        }
    }
    TEST_ASSERT(vectorizedCorrect, "expint_vectorized retourne NaN/Inf");
    TEST_SUCCESS("expint_vectorized - OK");

    // Test benchmark intégré
    SIMDIntegration::runMathUtilsSIMDBenchmark(10000);
    TEST_SUCCESS("Benchmark intégré - OK");

    return true;
}

// Test du gestionnaire SIMD
bool testSIMDManager() {
    std::cout << "\n⚙️  === TEST GESTIONNAIRE SIMD ===" << std::endl;

    // Test initialisation
    SIMDManager::getInstance().initialize();
    TEST_ASSERT(SIMDManager::getInstance().isInitialized(), "Gestionnaire non initialisé");
    TEST_SUCCESS("Initialisation gestionnaire - OK");

    // Test informations
    std::string info = SIMDManager::getInstance().getSIMDInfo();
    TEST_SUCCESS("Informations gestionnaire: " + info);

    // Test benchmark
    SIMDManager::getInstance().runBenchmark(50000);
    TEST_SUCCESS("Benchmark gestionnaire - OK");

    return true;
}

// Fonction principale de test
bool runAllTests() {
    std::cout << "🚀 === TESTS COMPLÉMENTAIRES BIBLIOTHÈQUE SIMD ===\n" << std::endl;

    bool allPassed = true;

    try {
        // Test de détection SIMD
        if (!testSIMDDetection()) allPassed = false;

        // Test fonctions mathématiques de base
        if (!testBasicMathFunctions()) allPassed = false;

        // Test fonctions mathématiques avancées
        if (!testAdvancedMathFunctions()) allPassed = false;

        // Test gestion mémoire
        if (!testMemoryManagement()) allPassed = false;

        // Test utilitaires
        if (!testSIMDUtils()) allPassed = false;

        // Test processeurs DSP
        if (!testDSPProcessors()) allPassed = false;

        // Test benchmarks
        if (!testBenchmarks()) allPassed = false;

        // Test précision
        if (!testPrecision()) allPassed = false;

        // Test intégration
        if (!testIntegration()) allPassed = false;

        // Test gestionnaire
        if (!testSIMDManager()) allPassed = false;

    } catch (const std::exception& e) {
        std::cout << "❌ EXCEPTION CAPTURÉE: " << e.what() << std::endl;
        allPassed = false;
    } catch (...) {
        std::cout << "❌ EXCEPTION INCONNUE CAPTURÉE" << std::endl;
        allPassed = false;
    }

    // Résumé final
    std::cout << "\n" << (allPassed ? "🎉" : "💥") << " === RÉSUMÉ FINAL === " << (allPassed ? "🎉" : "💥") << std::endl;
    std::cout << (allPassed ? "✅ TOUS LES TESTS RÉUSSIS" : "❌ CERTAINS TESTS ONT ÉCHOUÉ") << std::endl;
    std::cout << "📊 Tests terminés à " << std::fixed << std::setprecision(1)
              << (static_cast<double>(std::chrono::system_clock::now().time_since_epoch().count()) /
                  std::chrono::system_clock::period::den * 1000) << "ms" << std::endl;

    return allPassed;
}

} // namespace Tests
} // namespace SIMD
} // namespace AudioNR

// Point d'entrée pour les tests
int main() {
    std::cout << "🧪 SYSTÈME DE TEST COMPLÉMENTAIRE BIBLIOTHÈQUE SIMD\n" << std::endl;
    std::cout << "Test réalisé le: " << __DATE__ << " " << __TIME__ << "\n" << std::endl;

    bool success = AudioNR::SIMD::Tests::runAllTests();

    return success ? 0 : 1;
}
