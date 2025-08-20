# Script PowerShell pour tester le systeme audio
Write-Host "=== Test du Systeme Audio ===" -ForegroundColor Green

# Test 1: Verification des fichiers
Write-Host "`n1. Verification des fichiers..." -ForegroundColor Yellow

$audioFiles = @(
    "shared/Audio/core/BiquadFilter.cpp",
    "shared/Audio/core/BiquadFilter.h",
    "shared/Audio/core/AudioEqualizer.cpp",
    "shared/Audio/core/AudioEqualizer.h",
    "shared/Audio/utils/AudioBuffer.cpp",
    "shared/Audio/utils/AudioBuffer.h",
    "shared/Audio/utils/Constants.h",
    "shared/Audio/safety/AudioSafety.cpp",
    "shared/Audio/safety/AudioSafety.h",
    "shared/Audio/noise/NoiseReducer.cpp",
    "shared/Audio/noise/NoiseReducer.h",
    "shared/Audio/noise/SpectralNR.cpp",
    "shared/Audio/noise/SpectralNR.h",
    "shared/Audio/effects/Compressor.h",
    "shared/Audio/effects/Delay.h",
    "shared/Audio/effects/EffectChain.h",
    "shared/Audio/effects/EffectBase.h"
)

$allFilesExist = $true
foreach ($file in $audioFiles) {
    if (Test-Path $file) {
        Write-Host "OK $file" -ForegroundColor Green
    } else {
        Write-Host "ERREUR $file" -ForegroundColor Red
        $allFilesExist = $false
    }
}

# Test 2: Analyse de la structure du code
Write-Host "`n2. Analyse de la structure du code..." -ForegroundColor Yellow

$cppLines = 0
$hppLines = 0

foreach ($file in $audioFiles) {
    if ($file -match "\.cpp$") {
        $lines = (Get-Content $file -ErrorAction SilentlyContinue | Measure-Object -Line).Lines
        $cppLines += $lines
    } elseif ($file -match "\.h(pp)?$") {
        $lines = (Get-Content $file -ErrorAction SilentlyContinue | Measure-Object -Line).Lines
        $hppLines += $lines
    }
}

Write-Host "Lignes de code C++ : $cppLines" -ForegroundColor Cyan
Write-Host "Lignes de code Headers : $hppLines" -ForegroundColor Cyan
Write-Host "Total : $($cppLines + $hppLines)" -ForegroundColor Green

# Test 3: Verification des constantes audio
Write-Host "`n3. Verification des constantes audio..." -ForegroundColor Yellow

$constantsFile = "shared/Audio/utils/Constants.h"
if (Test-Path $constantsFile) {
    $constants = Get-Content $constantsFile

    if ($constants -match "31\.25") {
        Write-Host "OK Frequences dB ISO" -ForegroundColor Green
    }

    if ($constants -match "3\.141592653589793") {
        Write-Host "OK Constante PI" -ForegroundColor Green
    }

    if ($constants -match "MIN_GAIN_DB.*-24\.0") {
        Write-Host "OK Limites de gain" -ForegroundColor Green
    }

    if ($constants -match "LOWPASS") {
        Write-Host "OK Types de filtres" -ForegroundColor Green
    }
}

# Test 4: Analyse des algorithmes
Write-Host "`n4. Analyse des algorithmes..." -ForegroundColor Yellow

$algorithms = @(
    @{Name="BiquadFilter"; File="shared/Audio/core/BiquadFilter.cpp"; Pattern="calculateLowpass|Direct Form II"},
    @{Name="AudioEqualizer"; File="shared/Audio/core/AudioEqualizer.cpp"; Pattern="process\(|SIMD|atomic"},
    @{Name="AudioSafety"; File="shared/Audio/safety/AudioSafety.cpp"; Pattern="limiter|feedback|dcRemove"},
    @{Name="NoiseReducer"; File="shared/Audio/noise/NoiseReducer.cpp"; Pattern="expansion|envelope|threshold"},
    @{Name="AudioBuffer"; File="shared/Audio/utils/AudioBuffer.cpp"; Pattern="SIMD|AVX2|SSE2"}
)

foreach ($algo in $algorithms) {
    if (Test-Path $algo.File) {
        $content = Get-Content $algo.File -Raw
        if ($content -match $algo.Pattern) {
            Write-Host "OK $($algo.Name) - Algorithmes presents" -ForegroundColor Green
        } else {
            Write-Host "WARNING $($algo.Name) - Patterns non trouves" -ForegroundColor Yellow
        }
    }
}

# Test 5: Verification des optimisations SIMD
Write-Host "`n5. Verification des optimisations SIMD..." -ForegroundColor Yellow

$simdFiles = @(
    "shared/Audio/core/BiquadFilter.cpp",
    "shared/Audio/utils/AudioBuffer.cpp"
)

foreach ($file in $simdFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $simdFeatures = @()

        if ($content -match "AVX2|__AVX2__") { $simdFeatures += "AVX2" }
        if ($content -match "SSE2|__SSE2__") { $simdFeatures += "SSE2" }
        if ($content -match "NEON|__ARM_NEON") { $simdFeatures += "NEON" }
        if ($content -match "_mm256|_mm_load") { $simdFeatures += "Intrinsics" }

        if ($simdFeatures.Count -gt 0) {
            Write-Host "OK $((Split-Path $file -Leaf)) - Optimisations: $($simdFeatures -join ', ')" -ForegroundColor Green
        } else {
            Write-Host "WARNING $((Split-Path $file -Leaf)) - Pas d'optimisations SIMD detectees" -ForegroundColor Yellow
        }
    }
}

# Test 6: Validation des tests unitaires
Write-Host "`n6. Validation des tests unitaires..." -ForegroundColor Yellow

$testFiles = @(
    "test/test_biquad_filter.cpp",
    "test/test_audio_equalizer.cpp",
    "test/test_audio_buffer.cpp",
    "test/test_audio_safety.cpp",
    "test/test_effects.cpp",
    "test/test_noise_reduction.cpp",
    "test/test_performance.cpp",
    "test/test_math_utilities.cpp"
)

foreach ($file in $testFiles) {
    if (Test-Path $file) {
        Write-Host "OK $((Split-Path $file -Leaf))" -ForegroundColor Green
    } else {
        Write-Host "ERREUR $((Split-Path $file -Leaf))" -ForegroundColor Red
    }
}

Write-Host "`n=== RESULTATS DU TEST ===" -ForegroundColor Green

if ($allFilesExist) {
    Write-Host "OK Tous les fichiers sont presents" -ForegroundColor Green
} else {
    Write-Host "ERREUR Certains fichiers sont manquants" -ForegroundColor Red
}

Write-Host "`nStatistiques du code:" -ForegroundColor Cyan
Write-Host "  - Composants audio: $($audioFiles.Count)" -ForegroundColor White
Write-Host "  - Fichiers de test: $($testFiles.Count)" -ForegroundColor White
Write-Host "  - Lignes de code: $($cppLines + $hppLines)" -ForegroundColor White

Write-Host "`n=== TEST TERMINE ===" -ForegroundColor Green