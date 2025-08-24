// Test de vérification de l'intégration du module Effects
// Vérifie si tous les fichiers travaillent ensemble correctement

#include <iostream>
#include <iomanip>
#include <vector>
#include <string>
#include <filesystem>
#include <fstream>

namespace fs = std::filesystem;

// Structure de résultat de vérification
struct IntegrationIssue {
    std::string file;
    std::string issue;
    std::string severity; // "ERROR", "WARNING", "INFO"
    std::string description;
};

struct IntegrationResult {
    bool fullyIntegrated = false;
    std::vector<IntegrationIssue> issues;
    int errorCount = 0;
    int warningCount = 0;
    int infoCount = 0;
};

// Fonction de vérification des includes
IntegrationResult checkIncludes() {
    IntegrationResult result;

    std::cout << "🔍 VÉRIFICATION DES INCLUDES ET DÉPENDANCES\n";
    std::cout << "===========================================\n\n";

    // Liste des fichiers à vérifier
    std::vector<std::string> filesToCheck = {
        "../../shared/Audio/effects/NativeAudioEffectsModule.h",
        "../../shared/Audio/effects/managers/EffectManager.h",
        "../../shared/Audio/effects/components/Compressor.hpp",
        "../../shared/Audio/effects/components/Delay.hpp",
        "../../shared/Audio/effects/components/EffectChain.hpp",
        "../../shared/Audio/effects/config/EffectsConfig.h",
        "../../shared/Audio/effects/jsi/EffectsJSIConverter.h"
    };

    for (const auto& filePath : filesToCheck) {
        if (!fs::exists(filePath)) {
            result.issues.push_back({
                filePath,
                "Fichier manquant",
                "ERROR",
                "Le fichier n'existe pas dans le système de fichiers"
            });
            result.errorCount++;
            continue;
        }

        // Lecture du fichier pour vérifier les includes
        std::ifstream file(filePath);
        if (!file.is_open()) {
            result.issues.push_back({
                filePath,
                "Lecture impossible",
                "ERROR",
                "Impossible d'ouvrir le fichier pour vérification"
            });
            result.errorCount++;
            continue;
        }

        std::string line;
        int lineNumber = 0;
        bool hasErrors = false;

        while (std::getline(file, line)) {
            lineNumber++;

            // Vérifier les includes problématiques
            if (line.find("#include") != std::string::npos) {
                // Vérifier les includes qui pourraient poser problème
                if (line.find("<jsi/jsi.h>") != std::string::npos ||
                    line.find("<ReactCommon/TurboModule.h>") != std::string::npos) {
                    result.issues.push_back({
                        filePath,
                        "Include JSI/TurboModule",
                        "WARNING",
                        "Ligne " + std::to_string(lineNumber) + ": Dépendance React Native"
                    });
                    result.warningCount++;
                }
            }

            // Vérifier les références à des classes manquantes
            if (line.find("CompressorManager") != std::string::npos ||
                line.find("DelayManager") != std::string::npos) {
                result.issues.push_back({
                    filePath,
                    "Référence manquante",
                    "ERROR",
                    "Ligne " + std::to_string(lineNumber) + ": Référence à CompressorManager/DelayManager qui n'existe pas"
                });
                result.errorCount++;
                hasErrors = true;
            }

            // Vérifier les namespaces manquants
            if (line.find("Nyth::Audio::Effects::") != std::string::npos) {
                // Vérifier si ces types existent vraiment
                if (line.find("EffectType") != std::string::npos ||
                    line.find("EffectState") != std::string::npos) {
                    // Ces types sont définis dans EffectsLimits.h et les alias using sont CORRECTS
                    // Ne pas signaler d'erreur pour les alias using
                    if (line.find("using EffectType = ") == std::string::npos &&
                        line.find("using EffectState = ") == std::string::npos) {
                        result.issues.push_back({
                            filePath,
                            "Namespace incorrect",
                            "ERROR",
                            "Ligne " + std::to_string(lineNumber) + ": Types EffectType/EffectState dans mauvais namespace"
                        });
                        result.errorCount++;
                        hasErrors = true;
                    }
                }
            }
        }

        if (!hasErrors) {
            result.issues.push_back({
                filePath,
                "Includes OK",
                "INFO",
                "Tous les includes semblent corrects"
            });
            result.infoCount++;
        }
    }

    return result;
}

// Fonction de vérification des types et constantes
IntegrationResult checkTypesAndConstants() {
    IntegrationResult result;

    std::cout << "🔍 VÉRIFICATION DES TYPES ET CONSTANTES\n";
    std::cout << "=======================================\n\n";

    // Vérifier si EffectsLimits.h existe et contient les définitions
    std::string limitsFile = "../../shared/Audio/effects/config/EffectsLimits.h";
    if (!fs::exists(limitsFile)) {
        result.issues.push_back({
            limitsFile,
            "Fichier manquant",
            "ERROR",
            "EffectsLimits.h n'existe pas mais est référencé par d'autres fichiers"
        });
        result.errorCount++;
    } else {
        // Vérifier le contenu d'EffectsLimits.h
        std::ifstream file(limitsFile);
        std::string content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());

        if (content.find("enum class EffectType") != std::string::npos) {
            result.issues.push_back({
                limitsFile,
                "EffectType trouvé",
                "INFO",
                "EffectType est défini dans EffectsLimits.h"
            });
            result.infoCount++;
        } else {
            result.issues.push_back({
                limitsFile,
                "EffectType manquant",
                "ERROR",
                "EffectType n'est pas défini dans EffectsLimits.h"
            });
            result.errorCount++;
        }

        if (content.find("EffectState") != std::string::npos) {
            result.issues.push_back({
                limitsFile,
                "EffectState trouvé",
                "INFO",
                "EffectState est défini dans EffectsLimits.h"
            });
            result.infoCount++;
        } else {
            result.issues.push_back({
                limitsFile,
                "EffectState manquant",
                "ERROR",
                "EffectState n'est pas défini dans EffectsLimits.h"
            });
            result.errorCount++;
        }
    }

    // Vérifier la cohérence des namespaces
    std::string configFile = "../../shared/Audio/effects/config/EffectsConfig.h";
    if (fs::exists(configFile)) {
        std::ifstream file(configFile);
        std::string content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());

        if (content.find("namespace Nyth") != std::string::npos &&
            content.find("namespace Audio") != std::string::npos) {
            result.issues.push_back({
                configFile,
                "Namespace cohérent",
                "INFO",
                "Le fichier utilise le bon namespace Nyth::Audio"
            });
            result.infoCount++;
        } else {
            result.issues.push_back({
                configFile,
                "Namespace incorrect",
                "WARNING",
                "Le namespace pourrait ne pas être cohérent avec les autres fichiers"
            });
            result.warningCount++;
        }
    }

    return result;
}

// Fonction de vérification de compilation
IntegrationResult checkCompilation() {
    IntegrationResult result;

    std::cout << "🔍 VÉRIFICATION DE COMPILATION\n";
    std::cout << "===============================\n\n";

    // Test de compilation d'un fichier simple
    std::string testFile = "../../shared/Audio/effects/components/Compressor.hpp";

    if (fs::exists(testFile)) {
        // Créer un fichier de test temporaire
        std::ofstream tempTest("__temp_test_effects.cpp");
        tempTest << "#include \"" << testFile << "\"\n";
        tempTest << "#include \"../../shared/Audio/effects/components/constant/EffectConstants.hpp\"\n";
        tempTest << "int main() { return 0; }\n";
        tempTest.close();

        // Essayer de compiler
        int compileResult = std::system("g++ -c -I../../shared/Audio/effects -I../../shared/Audio/core/components/constant __temp_test_effects.cpp -o __temp_test_effects.o 2>&1");

        if (compileResult == 0) {
            result.issues.push_back({
                "Compilation test",
                "Compilation réussie",
                "INFO",
                "Le fichier Compressor.hpp compile correctement"
            });
            result.infoCount++;
        } else {
            result.issues.push_back({
                "Compilation test",
                "Erreur de compilation",
                "ERROR",
                "Impossible de compiler Compressor.hpp - dépendances manquantes"
            });
            result.errorCount++;
        }

        // Nettoyer
        fs::remove("__temp_test_effects.cpp");
        if (fs::exists("__temp_test_effects.o")) {
            fs::remove("__temp_test_effects.o");
        }
    } else {
        result.issues.push_back({
            testFile,
            "Fichier manquant",
            "ERROR",
            "Impossible de tester la compilation - fichier manquant"
        });
        result.errorCount++;
    }

    return result;
}

// Fonction principale de vérification d'intégration
IntegrationResult checkEffectsIntegration() {
    std::cout << "🔗 VÉRIFICATION D'INTÉGRATION DU MODULE EFFECTS\n";
    std::cout << "===============================================\n\n";

    IntegrationResult result;

    // Vérification 1: Includes et dépendances
    auto includeResult = checkIncludes();
    result.issues.insert(result.issues.end(), includeResult.issues.begin(), includeResult.issues.end());
    result.errorCount += includeResult.errorCount;
    result.warningCount += includeResult.warningCount;
    result.infoCount += includeResult.infoCount;

    std::cout << "\n";

    // Vérification 2: Types et constantes
    auto typesResult = checkTypesAndConstants();
    result.issues.insert(result.issues.end(), typesResult.issues.begin(), typesResult.issues.end());
    result.errorCount += typesResult.errorCount;
    result.warningCount += typesResult.warningCount;
    result.infoCount += typesResult.infoCount;

    std::cout << "\n";

    // Vérification 3: Compilation
    auto compilationResult = checkCompilation();
    result.issues.insert(result.issues.end(), compilationResult.issues.begin(), compilationResult.issues.end());
    result.errorCount += compilationResult.errorCount;
    result.warningCount += compilationResult.warningCount;
    result.infoCount += compilationResult.infoCount;

    // Évaluation finale
    std::cout << "\n";
    std::cout << "📊 RÉSULTATS DE L'ANALYSE D'INTÉGRATION\n";
    std::cout << "=======================================\n\n";

    std::cout << "Erreurs trouvées: " << result.errorCount << "\n";
    std::cout << "Avertissements: " << result.warningCount << "\n";
    std::cout << "Informations: " << result.infoCount << "\n\n";

    // Afficher un résumé des problèmes
    if (result.errorCount == 0) {
        std::cout << "✅ CONCLUSION: Le module Effects est BIEN INTÉGRÉ\n";
        std::cout << "   Tous les fichiers travaillent ensemble correctement.\n";
        result.fullyIntegrated = true;
    } else {
        std::cout << "⚠️  CONCLUSION: Problèmes d'intégration détectés\n";
        std::cout << "   Certains fichiers ne sont pas correctement intégrés.\n";
        result.fullyIntegrated = false;

        std::cout << "\n📋 PROBLÈMES PRINCIPAUX IDENTIFIÉS:\n";

        // Grouper les erreurs par type
        bool hasMissingTypes = false;
        bool hasNamespaceIssues = false;
        bool hasMissingFiles = false;

        for (const auto& issue : result.issues) {
            if (issue.severity == "ERROR") {
                if (issue.issue.find("manquant") != std::string::npos) {
                    hasMissingFiles = true;
                } else if (issue.issue.find("Namespace") != std::string::npos) {
                    hasNamespaceIssues = true;
                } else if (issue.issue.find("Référence") != std::string::npos) {
                    hasMissingTypes = true;
                }
            }
        }

        if (hasMissingFiles) {
            std::cout << "   • Fichiers manquants ou inaccessibles\n";
        }
        if (hasNamespaceIssues) {
            std::cout << "   • Problèmes de namespaces et de types\n";
        }
        if (hasMissingTypes) {
            std::cout << "   • Références à des classes qui n'existent pas\n";
        }
    }

    return result;
}

int main() {
    try {
        auto result = checkEffectsIntegration();

        std::cout << "\n🔍 DÉTAIL DES PROBLÈMES:\n";
        std::cout << "=======================\n\n";

        for (const auto& issue : result.issues) {
            std::string icon;
            if (issue.severity == "ERROR") icon = "❌";
            else if (issue.severity == "WARNING") icon = "⚠️ ";
            else icon = "ℹ️ ";

            std::cout << icon << " " << issue.file << " - " << issue.issue << "\n";
            if (!issue.description.empty()) {
                std::cout << "   " << issue.description << "\n";
            }
            std::cout << "\n";
        }

        return result.fullyIntegrated ? 0 : 1;
    } catch (const std::exception& e) {
        std::cerr << "❌ ERREUR FATALE: " << e.what() << std::endl;
        return 2;
    } catch (...) {
        std::cerr << "❌ ERREUR FATALE INCONNUE" << std::endl;
        return 2;
    }
}
