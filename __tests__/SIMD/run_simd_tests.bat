@echo off
REM Script de test complet pour la bibliothèque SIMD (Windows)
REM Usage: run_simd_tests.bat [option]

setlocal enabledelayedexpansion

set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..\..

echo 🚀 SIMD Comprehensive Test Suite
echo =================================

REM Fonction pour vérifier les prérequis
:check_prerequisites
echo 🔍 Vérification des prérequis...

REM Vérifier CMake
where cmake >nul 2>nul
if errorlevel 1 (
    echo ❌ CMake non trouvé. Veuillez installer CMake.
    goto :error
)

REM Vérifier Visual Studio ou MinGW
if "%VSINSTALLDIR%"=="" (
    where g++ >nul 2>nul
    if errorlevel 1 (
        echo ❌ Aucun compilateur C++ trouvé.
        goto :error
    )
)

echo ✅ Prérequis OK
goto :eof

REM Fonction pour configurer et compiler
:build_tests
echo 🔨 Configuration et compilation...

cd /d "%SCRIPT_DIR%"

REM Créer répertoire de build
if not exist build mkdir build
cd build

REM Configurer avec CMake
if "%VSINSTALLDIR%"=="" (
    REM MinGW
    cmake .. -DCMAKE_BUILD_TYPE=Release -G "MinGW Makefiles"
) else (
    REM Visual Studio
    cmake .. -DCMAKE_BUILD_TYPE=Release
)

REM Compiler
if "%VSINSTALLDIR%"=="" (
    mingw32-make -j%NUMBER_OF_PROCESSORS%
) else (
    cmake --build . --config Release
)

if errorlevel 1 (
    echo ❌ Erreur de compilation
    goto :error
)

echo ✅ Compilation terminée
goto :eof

REM Fonction pour exécuter les tests
:run_tests
echo 🧪 Exécution des tests...

cd /d "%SCRIPT_DIR%\build"

if exist "simd_tests.exe" (
    .\simd_tests.exe
) else if exist "Release\simd_tests.exe" (
    .\Release\simd_tests.exe
) else (
    echo ❌ Exécutable non trouvé. Compilation nécessaire.
    goto :error
)

goto :eof

REM Fonction pour benchmark
:run_benchmark
echo 📊 Exécution des benchmarks...

cd /d "%SCRIPT_DIR%\build"

if exist "simd_tests.exe" (
    set EXECUTABLE=.\simd_tests.exe
) else if exist "Release\simd_tests.exe" (
    set EXECUTABLE=.\Release\simd_tests.exe
) else (
    echo ❌ Exécutable non trouvé. Compilation nécessaire.
    goto :error
)

echo === BENCHMARK MODE === >> benchmark_results.txt
date /t >> benchmark_results.txt
time /t >> benchmark_results.txt
%EXECUTABLE% >> benchmark_results.txt 2>&1
echo ✅ Résultats sauvegardés dans build\benchmark_results.txt

goto :eof

REM Fonction pour nettoyer
:clean_build
echo 🧹 Nettoyage...

cd /d "%SCRIPT_DIR%"
if exist build rmdir /s /q build
del /f *.log 2>nul

echo ✅ Nettoyage terminé
goto :eof

REM Fonction pour afficher l'aide
:show_help
echo Usage: %0 [option]
echo.
echo Options:
echo   build     - Configurer et compiler les tests
echo   test      - Exécuter les tests complets
echo   bench     - Exécuter les benchmarks de performance
echo   clean     - Nettoyer les fichiers de compilation
echo   all       - Effectuer build + test + bench
echo   help      - Afficher cette aide
echo.
echo Exemples:
echo   %0 all           # Tout faire (build, test, benchmark)
echo   %0 test          # Juste exécuter les tests
echo   %0 bench         # Juste les benchmarks
goto :eof

REM Fonction principale
:main
set option=%1
if "%option%"=="" set option=all

call :check_prerequisites

if "%option%"=="build" (
    call :build_tests
) else if "%option%"=="test" (
    call :run_tests
) else if "%option%"=="bench" (
    call :run_benchmark
) else if "%option%"=="clean" (
    call :clean_build
) else if "%option%"=="all" (
    call :build_tests
    if errorlevel 1 goto :error
    call :run_tests
    if errorlevel 1 goto :error
    call :run_benchmark
) else if "%option%"=="help" (
    call :show_help
) else (
    echo Option inconnue: %option%
    call :show_help
    goto :error
)

echo ✅ Script terminé avec succès
goto :end

:error
echo ❌ Erreur rencontrée
exit /b 1

:end
endlocal
