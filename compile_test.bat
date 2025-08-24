@echo off
echo === Compilation et Test de MathUtils ===

REM Vérifier si nous sommes dans le bon répertoire
if not exist "test_MathUtils.cpp" (
    echo Erreur: test_MathUtils.cpp non trouvé
    pause
    exit /b 1
)

echo Compilation en cours...
g++ -std=c++17 -O3 -march=native ^
    -I. ^
    -Wall -Wextra -Wpedantic ^
    test_MathUtils.cpp ^
    -o test_MathUtils.exe

REM Vérifier si la compilation a réussi
if %errorlevel% equ 0 (
    echo Compilation réussie!
    echo Exécution des tests...
    echo =======================
    test_MathUtils.exe
) else (
    echo Erreur de compilation
    pause
    exit /b 1
)

echo === Fin du Test ===
pause
