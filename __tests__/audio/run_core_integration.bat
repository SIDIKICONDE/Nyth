@echo off
REM Script pour tester l'intégration du module core audio
REM Ce script compile et exécute le test d'intégration du module core

echo 🎛️  Test d'Intégration du Module Core Audio
echo ==========================================
echo.

REM Vérifier si g++ est disponible
where g++ >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ g++ n'est pas installé ou n'est pas dans le PATH
    echo Veuillez installer MinGW-w64 ou Visual Studio avec les outils C++
    echo Téléchargeable sur: https://www.mingw-w64.org/ ou https://visualstudio.microsoft.com/
    pause
    exit /b 1
)

echo ✅ Compilateur C++ trouvé
echo.

REM Compiler le test d'intégration core
echo 🏗️  Compilation du test d'intégration core...
g++ test_core_integration.cpp -o test_core_integration.exe -std=c++20 -O2

if %errorlevel% neq 0 (
    echo ❌ Erreur de compilation
    echo.
    echo Vérifiez que:
    echo - Le fichier test_core_integration.cpp existe
    echo - Le compilateur C++ est installé
    echo - Les dépendances sont disponibles
    pause
    exit /b 1
)

echo ✅ Compilation réussie
echo.

REM Exécuter le test d'intégration core
echo 🚀 Exécution du test d'intégration core...
echo.
test_core_integration.exe

REM Sauvegarder le code de sortie
set EXIT_CODE=%errorlevel%

echo.
if %EXIT_CODE% equ 0 (
    echo 🎉 Intégration du module core réussie !
    echo ✅ AudioEqualizer, BiquadFilter et CoreConstants fonctionnent.
    echo.
    echo Composants validés:
    echo ✅ Fichiers core présents
    echo ✅ AudioEqualizer (10-bandes, presets)
    echo ✅ BiquadFilter (passe-bas, passe-haut)
    echo ✅ Intégration core + FFT
    echo ✅ Performance du module core
    echo.
    echo Prochaines étapes:
    echo 1. Tester l'intégration complète: run_audio_integration.bat
    echo 2. Tester l'intégration JavaScript: npm test
    echo 3. Déployer sur mobile: build Android/iOS
) else (
    echo ⚠️  Intégration du module core échouée.
    echo ❌ Certains composants nécessitent des corrections.
    echo.
    echo Vérifiez les erreurs ci-dessus et corrigez:
    echo - Les fichiers core manquants
    echo - Les algorithmes AudioEqualizer
    echo - Les filtres BiquadFilter
    echo - L'intégration avec FFT
    echo - Les performances
)

echo.
echo Appuyez sur une touche pour continuer...
pause >nul

exit /b %EXIT_CODE%
