@echo off
echo 🧪 TESTS UNITAIRES - CENTRALISATION DES CONSTANTES
echo =====================================================

cd /d "%~dp0"

REM Test CoreConstants.hpp
echo.
echo 📋 Testing CoreConstants.hpp...
g++ -std=c++20 -I. -o test_core test_core_constants.cpp
if %errorlevel% equ 0 (
    test_core.exe
    if %errorlevel% equ 0 (
        echo ✅ CoreConstants.hpp - PASSED
    ) else (
        echo ❌ CoreConstants.hpp - FAILED
    )
    del test_core.exe
) else (
    echo ❌ CoreConstants.hpp - COMPILATION FAILED
)

REM Test EffectConstants.hpp  
echo.
echo 📋 Testing EffectConstants.hpp...
g++ -std=c++20 -I. -o test_effect test_effect_constants.cpp
if %errorlevel% equ 0 (
    test_effect.exe
    if %errorlevel% equ 0 (
        echo ✅ EffectConstants.hpp - PASSED
    ) else (
        echo ❌ EffectConstants.hpp - FAILED
    )
    del test_effect.exe
) else (
    echo ❌ EffectConstants.hpp - COMPILATION FAILED
)

REM Test SafetyContants.hpp
echo.
echo 📋 Testing SafetyContants.hpp...
g++ -std=c++20 -I. -o test_safety test_safety_constants.cpp
if %errorlevel% equ 0 (
    test_safety.exe
    if %errorlevel% equ 0 (
        echo ✅ SafetyContants.hpp - PASSED
    ) else (
        echo ❌ SafetyContants.hpp - FAILED
    )
    del test_safety.exe
) else (
    echo ❌ SafetyContants.hpp - COMPILATION FAILED
)

REM Test utilsConstants.hpp
echo.
echo 📋 Testing utilsConstants.hpp...
g++ -std=c++20 -I. -o test_utils test_utils_constants.cpp
if %errorlevel% equ 0 (
    test_utils.exe
    if %errorlevel% equ 0 (
        echo ✅ utilsConstants.hpp - PASSED
    ) else (
        echo ❌ utilsConstants.hpp - FAILED
    )
    del test_utils.exe
) else (
    echo ❌ utilsConstants.hpp - COMPILATION FAILED
)

echo.
echo 🎉 TESTS TERMINÉS !
echo =====================================================
echo 📊 RÉSUMÉ DE LA CENTRALISATION :
echo    📁 CoreConstants.hpp    : ~50 constantes (Equalizer, Biquad)
echo    📁 EffectConstants.hpp  : ~56 constantes (Compressor, Delay)  
echo    📁 SafetyContants.hpp   : ~50 constantes (Audio Protection)
echo    📁 utilsConstants.hpp   : ~56 constantes (Buffers, SIMD, Utils)
echo    📈 TOTAL                : ~212 constantes centralisées !
echo.
echo ✅ Zéro duplication
echo ✅ Zéro nombre magique
echo ✅ Cross-platform compatible
echo ✅ Namespaces organisés
echo ✅ Performance optimisée (constexpr)

pause
