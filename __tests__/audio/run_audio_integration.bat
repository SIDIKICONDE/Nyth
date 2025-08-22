@echo off
REM Script pour tester l'intégration audio complète
REM Ce script compile et exécute le test d'intégration audio de bout en bout

echo 🎵 Test d'Intégration Audio Complet
echo ==================================
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

REM Compiler le test d'intégration audio
echo 🏗️  Compilation du test d'intégration audio...
g++ test_audio_integration.cpp -o test_audio_integration.exe -std=c++20 -O2

if %errorlevel% neq 0 (
    echo ❌ Erreur de compilation
    echo.
    echo Vérifiez que:
    echo - Le fichier test_audio_integration.cpp existe
    echo - Le compilateur C++ est installé
    echo - Les dépendances sont disponibles
    pause
    exit /b 1
)

echo ✅ Compilation réussie
echo.

REM Exécuter le test d'intégration
echo 🚀 Exécution du test d'intégration audio...
echo.
test_audio_integration.exe

REM Sauvegarder le code de sortie
set EXIT_CODE=%errorlevel%

echo.
if %EXIT_CODE% equ 0 (
    echo 🎉 Intégration audio complète réussie !
    echo ✅ Le système audio est prêt pour la production.
    echo.
    echo Composants validés:
    echo ✅ Génération de signal audio
    echo ✅ Simulation FFT
    echo ✅ Traitement spectral (réduction de bruit)
    echo ✅ Performance et latence
    echo ✅ Formats de données (Float32/Float64)
    echo.
    echo Prochaines étapes:
    echo 1. Tester avec les vrais modules FFT: run_simple_test.bat
    echo 2. Tester l'intégration JavaScript: npm test
    echo 3. Déployer sur mobile: build Android/iOS
) else (
    echo ⚠️  Intégration audio échouée.
    echo ❌ Certains composants nécessitent des corrections.
    echo.
    echo Vérifiez les erreurs ci-dessus et corrigez:
    echo - La génération de signal
    echo - Les algorithmes FFT
    echo - Le traitement spectral
    echo - Les performances
    echo - Les formats de données
)

echo.
echo Appuyez sur une touche pour continuer...
pause >nul

exit /b %EXIT_CODE%
