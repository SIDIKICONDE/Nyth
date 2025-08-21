@echo off
REM Script simple pour tester les concepts de base audio
REM Ce script compile et exécute un test simple sans dépendances externes

echo 🎵 Test Simple Audio - Validation des Concepts de Base
echo ===================================================
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

REM Compiler le test simple
echo 🏗️  Compilation du test simple...
g++ simple_test.cpp -o simple_test.exe -std=c++20 -O2

if %errorlevel% neq 0 (
    echo ❌ Erreur de compilation
    pause
    exit /b 1
)

echo ✅ Compilation réussie
echo.

REM Exécuter le test
echo 🚀 Exécution du test...
echo.
simple_test.exe

REM Sauvegarder le code de sortie
set EXIT_CODE=%errorlevel%

echo.
if %EXIT_CODE% equ 0 (
    echo 🎉 Test terminé avec succès !
) else (
    echo ⚠️  Test terminé avec des erreurs
)

echo.
echo Appuyez sur une touche pour continuer...
pause >nul

exit /b %EXIT_CODE%
