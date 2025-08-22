@echo off
echo 🔍 Analyse statique rapide du projet Nyth
echo ==========================================

REM Vérifier clang-tidy
where clang-tidy >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ clang-tidy non trouvé. Installez LLVM/Clang
    goto :end
)

REM Vérifier cppcheck
where cppcheck >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ cppcheck non trouvé. Installez cppcheck
    goto :end
)

echo ✅ Outils trouvés, lancement des analyses...

REM Générer compilation database avec le bon générateur
if not exist "build_cpp17" mkdir build_cpp17
cd build_cpp17

REM Essayer différents générateurs
cmake -G "Visual Studio 17 2022" -DCMAKE_EXPORT_COMPILE_COMMANDS=ON .. >nul 2>&1
if %errorlevel% neq 0 (
    cmake -G "Visual Studio 16 2019" -DCMAKE_EXPORT_COMPILE_COMMANDS=ON .. >nul 2>&1
    if %errorlevel% neq 0 (
        cmake -G "MinGW Makefiles" -DCMAKE_EXPORT_COMPILE_COMMANDS=ON .. >nul 2>&1
        if %errorlevel% neq 0 (
            echo ❌ Impossible de générer la compilation database
            echo 💡 Installez Visual Studio ou MinGW
            cd ..
            goto :end
        )
    )
)

cd ..

REM Lancer clang-tidy avec includes système
echo.
echo 🔧 Lancement de clang-tidy...
clang-tidy -I "C:/Program Files/Microsoft Visual Studio/2022/Community/VC/Tools/MSVC/14.37.32822/include" -I "C:/Program Files (x86)/Windows Kits/10/Include/10.0.22621.0/ucrt" shared/Audio/core/*.cpp shared/Audio/core/*.hpp

REM Lancer cppcheck
echo.
echo 🔧 Lancement de cppcheck...
cppcheck --enable=all --std=c++17 --platform=win64 -I shared -I shared/Audio/core shared/Audio/core/*.cpp shared/Audio/core/*.hpp

echo.
echo ✅ Analyse terminée !

:end
pause
