@echo off
echo 🔥🔥🔥 TESTS DE STRESS ULTRA PUSSÉS - MODULE CORE 🔥🔥🔥
echo =====================================================

cd /d "%~dp0"

REM Compilation des tests de stress
echo.
echo 🔨 Compilation des tests de stress ultra poussés...
g++ -std=c++20 -Wall -Wextra -I. -I../../ -O2 -pthread -o test_stress_ultra test_stress_ultra.cpp ../../shared/Audio/core/AudioEqualizer.cpp ../../shared/Audio/core/BiquadFilter.cpp

if %errorlevel% equ 0 (
    echo ✅ Compilation réussie !
    
    echo.
    echo 🚀 Exécution des tests de stress ultra poussés...
    echo ⚠️  ATTENTION: Ces tests sont très intensifs et peuvent prendre plusieurs minutes
    
    test_stress_ultra.exe
    
    if %errorlevel% equ 0 (
        echo.
        echo 🎉 TOUS LES TESTS DE STRESS ULTRA PUSSÉS PASSÉS !
        echo =====================================================
        echo 🔥 Module Core validé pour la production intensive
        echo 💪 Performance, stabilité et robustesse confirmées
        echo 🚀 Prêt pour les charges de travail les plus extrêmes
    ) else (
        echo.
        echo ❌ CERTAINS TESTS DE STRESS ONT ÉCHOUÉ
    )
    
    del test_stress_ultra.exe
) else (
    echo ❌ ÉCHEC DE LA COMPILATION
)

echo.
echo 📊 RÉSUMÉ DES TESTS DE STRESS ULTRA PUSSÉS :
echo =============================================
echo 🔥 Test 1: Stress de mémoire massive (1000 instances + 1M échantillons)
echo 🔥 Test 2: Stress de performance extrême (10M échantillons + 10k itérations)
echo 🔥 Test 3: Stress de stabilité numérique (valeurs extrêmes + denormales)
echo 🔥 Test 4: Stress multi-threading (tous les cœurs CPU)
echo 🔥 Test 5: Stress de paramètres temps réel (10k modifications)
echo 🔥 Test 6: Stress de cascade de filtres (100 filtres en cascade)
echo 🔥 Test 7: Stress de presets (1000 presets + 10k opérations)
echo 🔥 Test 8: Stress de validation de paramètres (valeurs hors limites)
echo 🔥 Test 9: Stress de débordement de buffer (14 tailles différentes)
echo 🔥 Test 10: Stress de régression (10k tests de cohérence)

pause
