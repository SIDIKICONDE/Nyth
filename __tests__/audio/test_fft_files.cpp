// Test de validation des fichiers FFT avant intégration
#include <iostream>
#include <vector>
#include <chrono>
#include <cmath>
#include <algorithm>
#include <fstream>
#include <string>

// Tests de validation des fichiers FFT
namespace FFTFileTest {

// Test de validation du header FFTEngine.hpp
bool testFFTEngineHeader() {
    std::cout << "📁 Test de validation du header FFTEngine.hpp...\n";

    // Vérifier que le fichier existe
    std::ifstream headerFile("../../shared/Audio/fft/FFTEngine.hpp");
    if (!headerFile.is_open()) {
        std::cout << "❌ Fichier FFTEngine.hpp non trouvé\n";
        return false;
    }

    std::string line;
    bool hasInterface = false;
    bool hasRadix2 = false;
    bool hasKissFFT = false;
    bool hasCreateFunction = false;

    while (std::getline(headerFile, line)) {
        if (line.find("class IFFTEngine") != std::string::npos) {
            hasInterface = true;
        }
        if (line.find("class Radix2FFTEngine") != std::string::npos) {
            hasRadix2 = true;
        }
        if (line.find("KISSFFT_AVAILABLE") != std::string::npos) {
            hasKissFFT = true;
        }
        if (line.find("createFFTEngine") != std::string::npos) {
            hasCreateFunction = true;
        }
    }

    headerFile.close();

    if (hasInterface && hasRadix2 && hasCreateFunction) {
        std::cout << "✅ Header FFTEngine.hpp valide\n";
        if (hasKissFFT) {
            std::cout << "   - Support KissFFT détecté\n";
        }
        return true;
    } else {
        std::cout << "❌ Header FFTEngine.hpp invalide\n";
        std::cout << "   - Interface: " << (hasInterface ? "✅" : "❌") << "\n";
        std::cout << "   - Radix2: " << (hasRadix2 ? "✅" : "❌") << "\n";
        std::cout << "   - Create: " << (hasCreateFunction ? "✅" : "❌") << "\n";
        return false;
    }
}

// Test de validation de l'intégration SpectralNR
bool testSpectralNRIntegration() {
    std::cout << "🔗 Test de validation de l'intégration SpectralNR...\n";

    // Vérifier le header SpectralNR.hpp
    std::ifstream headerFile("../../shared/Audio/noise/SpectralNR.hpp");
    if (!headerFile.is_open()) {
        std::cout << "❌ Fichier SpectralNR.hpp non trouvé\n";
        return false;
    }

    std::string line;
    bool hasFFTInclude = false;
    bool hasFFTEngine = false;

    while (std::getline(headerFile, line)) {
        if (line.find("#include") != std::string::npos && 
            line.find("FFTEngine.hpp") != std::string::npos) {
            hasFFTInclude = true;
        }
        if (line.find("std::unique_ptr<IFFTEngine>") != std::string::npos) {
            hasFFTEngine = true;
        }
    }

    headerFile.close();

    // Vérifier l'implémentation SpectralNR.cpp
    std::ifstream implFile("../../shared/Audio/noise/SpectralNR.cpp");
    if (!implFile.is_open()) {
        std::cout << "❌ Fichier SpectralNR.cpp non trouvé\n";
        return false;
    }

    bool hasCreateFFT = false;
    bool hasFFTForward = false;
    bool hasFFTInverse = false;

    while (std::getline(implFile, line)) {
        if (line.find("createFFTEngine") != std::string::npos) {
            hasCreateFFT = true;
        }
        if (line.find("forwardR2C") != std::string::npos) {
            hasFFTForward = true;
        }
        if (line.find("inverseC2R") != std::string::npos) {
            hasFFTInverse = true;
        }
    }

    implFile.close();

    if (hasFFTInclude && hasFFTEngine && hasCreateFFT && hasFFTForward && hasFFTInverse) {
        std::cout << "✅ Intégration SpectralNR valide\n";
        return true;
    } else {
        std::cout << "❌ Intégration SpectralNR invalide\n";
        std::cout << "   - Include: " << (hasFFTInclude ? "✅" : "❌") << "\n";
        std::cout << "   - Engine: " << (hasFFTEngine ? "✅" : "❌") << "\n";
        std::cout << "   - Create: " << (hasCreateFFT ? "✅" : "❌") << "\n";
        std::cout << "   - Forward: " << (hasFFTForward ? "✅" : "❌") << "\n";
        std::cout << "   - Inverse: " << (hasFFTInverse ? "✅" : "❌") << "\n";
        return false;
    }
}

// Test de validation du worker TypeScript
bool testWorkerTypeScript() {
    std::cout << "🔧 Test de validation du worker TypeScript...\n";

    // Vérifier le worker audioProcessor.worker.ts
    std::ifstream workerFile("../../src/workers/audioProcessor.worker.ts");
    if (!workerFile.is_open()) {
        std::cout << "❌ Fichier audioProcessor.worker.ts non trouvé\n";
        return false;
    }

    std::string line;
    bool hasFP64Default = false;
    bool hasFFTFunction = false;
    bool hasPrecisionParam = false;

    while (std::getline(workerFile, line)) {
        if (line.find("precision: 'fp32' | 'fp64' = 'fp64'") != std::string::npos) {
            hasFP64Default = true;
        }
        if (line.find("function processSpectrum") != std::string::npos) {
            hasFFTFunction = true;
        }
        if (line.find("precision: 'fp32' | 'fp64'") != std::string::npos) {
            hasPrecisionParam = true;
        }
    }

    workerFile.close();

    if (hasFFTFunction && hasPrecisionParam && hasFP64Default) {
        std::cout << "✅ Worker TypeScript valide\n";
        return true;
    } else {
        std::cout << "❌ Worker TypeScript invalide\n";
        std::cout << "   - FFT Function: " << (hasFFTFunction ? "✅" : "❌") << "\n";
        std::cout << "   - Precision Param: " << (hasPrecisionParam ? "✅" : "❌") << "\n";
        std::cout << "   - FP64 Default: " << (hasFP64Default ? "✅" : "❌") << "\n";
        return false;
    }
}

// Test de validation des hooks React
bool testReactHooks() {
    std::cout << "⚛️  Test de validation des hooks React...\n";

    // Vérifier useAudioWorker.ts
    std::ifstream hookFile("../../src/hooks/useAudioWorker.ts");
    if (!hookFile.is_open()) {
        std::cout << "❌ Fichier useAudioWorker.ts non trouvé\n";
        return false;
    }

    std::string line;
    bool hasFP64Default = false;
    bool hasPrecisionParam = false;

    while (std::getline(hookFile, line)) {
        if (line.find("precision: 'fp32' | 'fp64' = 'fp64'") != std::string::npos) {
            hasFP64Default = true;
        }
        if (line.find("precision: 'fp32' | 'fp64'") != std::string::npos) {
            hasPrecisionParam = true;
        }
    }

    hookFile.close();

    if (hasPrecisionParam && hasFP64Default) {
        std::cout << "✅ Hooks React valides\n";
        return true;
    } else {
        std::cout << "❌ Hooks React invalides\n";
        std::cout << "   - Precision Param: " << (hasPrecisionParam ? "✅" : "❌") << "\n";
        std::cout << "   - FP64 Default: " << (hasFP64Default ? "✅" : "❌") << "\n";
        return false;
    }
}

// Test de validation du build CMake
bool testCMakeBuild() {
    std::cout << "🏗️  Test de validation du build CMake...\n";

    // Vérifier CMakeLists.txt Android
    std::ifstream cmakeFile("../../android/app/src/main/jni/CMakeLists.txt");
    if (!cmakeFile.is_open()) {
        std::cout << "❌ Fichier CMakeLists.txt Android non trouvé\n";
        return false;
    }

    std::string line;
    bool hasFFTHeader = false;

    while (std::getline(cmakeFile, line)) {
        if (line.find("FFTEngine.hpp") != std::string::npos) {
            hasFFTHeader = true;
        }
    }

    cmakeFile.close();

    if (hasFFTHeader) {
        std::cout << "✅ Build CMake valide\n";
        return true;
    } else {
        std::cout << "❌ Build CMake invalide\n";
        std::cout << "   - FFT Header: " << (hasFFTHeader ? "✅" : "❌") << "\n";
        return false;
    }
}

// Test de validation des tests C++
bool testCppTests() {
    std::cout << "🧪 Test de validation des tests C++...\n";

    // Vérifier AudioTestSuite.cpp
    std::ifstream testFile("AudioTestSuite.cpp");
    if (!testFile.is_open()) {
        std::cout << "❌ Fichier AudioTestSuite.cpp non trouvé\n";
        return false;
    }

    std::string line;
    bool hasFFTInclude = false;
    bool hasFFTTests = false;
    bool hasRoundTripTest = false;

    while (std::getline(testFile, line)) {
        if (line.find("#include") != std::string::npos && 
            line.find("FFTEngine.hpp") != std::string::npos) {
            hasFFTInclude = true;
        }
        if (line.find("FFTEngineSmoke") != std::string::npos) {
            hasFFTTests = true;
        }
        if (line.find("RoundTripAccuracy") != std::string::npos) {
            hasRoundTripTest = true;
        }
    }

    testFile.close();

    if (hasFFTInclude && hasFFTTests && hasRoundTripTest) {
        std::cout << "✅ Tests C++ valides\n";
        return true;
    } else {
        std::cout << "❌ Tests C++ invalides\n";
        std::cout << "   - FFT Include: " << (hasFFTInclude ? "✅" : "❌") << "\n";
        std::cout << "   - FFT Tests: " << (hasFFTTests ? "✅" : "❌") << "\n";
        std::cout << "   - Round Trip: " << (hasRoundTripTest ? "✅" : "❌") << "\n";
        return false;
    }
}

} // namespace FFTFileTest

int main() {
    std::cout << "🔍 Test de Validation des Fichiers FFT\n";
    std::cout << "=====================================\n\n";

    int passed = 0;
    int total = 6;

    if (FFTFileTest::testFFTEngineHeader()) passed++;
    std::cout << "\n";

    if (FFTFileTest::testSpectralNRIntegration()) passed++;
    std::cout << "\n";

    if (FFTFileTest::testWorkerTypeScript()) passed++;
    std::cout << "\n";

    if (FFTFileTest::testReactHooks()) passed++;
    std::cout << "\n";

    if (FFTFileTest::testCMakeBuild()) passed++;
    std::cout << "\n";

    if (FFTFileTest::testCppTests()) passed++;
    std::cout << "\n";

    // Résumé
    std::cout << "📊 Résumé de validation des fichiers:\n";
    std::cout << "  Tests passés: " << passed << "/" << total << "\n";
    std::cout << "  Taux de succès: " << (100.0 * passed / total) << "%\n\n";

    if (passed == total) {
        std::cout << "🎉 Tous les fichiers FFT sont valides !\n";
        std::cout << "✅ Prêt pour les tests d'intégration réels.\n";
    } else {
        std::cout << "⚠️  Certains fichiers nécessitent des corrections.\n";
        std::cout << "❌ Corrigez les problèmes avant de lancer les tests réels.\n";
    }

    return (passed == total) ? 0 : 1;
}
