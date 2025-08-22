@echo off
REM Script pour valider les fichiers FFT avant tests d'intégration
REM Ce script compile et exécute le test de validation des fichiers FFT

echo 🔍 Test de Validation des Fichiers FFT
echo =====================================
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

REM Compiler le test de validation FFT
echo 🏗️  Compilation du test de validation FFT...
g++ test_fft_files.cpp -o test_fft_files.exe -std=c++20 -O2

if %errorlevel% neq 0 (
    echo ❌ Erreur de compilation
    echo.
    echo Vérifiez que:
    echo - Le fichier test_fft_files.cpp existe
    echo - Les chemins vers les fichiers FFT sont corrects
    echo - Le compilateur C++ est installé
    pause
    exit /b 1
)

echo ✅ Compilation réussie
echo.

REM Exécuter le test de validation
echo 🚀 Exécution du test de validation...
echo.
test_fft_files.exe

REM Sauvegarder le code de sortie
set EXIT_CODE=%errorlevel%

echo.
if %EXIT_CODE% equ 0 (
    echo 🎉 Validation des fichiers FFT réussie !
    echo ✅ Tous les fichiers sont prêts pour les tests d'intégration.
    echo.
    echo Prochaines étapes:
    echo 1. Lancer les tests C++ complets: run_simple_test.bat
    echo 2. Lancer les tests JavaScript: npm test
    echo 3. Tester l'intégration mobile: build Android/iOS
) else (
    echo ⚠️  Validation des fichiers FFT échouée.
    echo ❌ Certains fichiers nécessitent des corrections.
    echo.
    echo Vérifiez les erreurs ci-dessus et corrigez:
    echo - Les includes manquants
    echo - Les signatures de fonctions incorrectes
    echo - Les chemins de fichiers
    echo - Les configurations de build
)

echo.
echo Appuyez sur une touche pour continuer...
pause >nul

exit /b %EXIT_CODE%
