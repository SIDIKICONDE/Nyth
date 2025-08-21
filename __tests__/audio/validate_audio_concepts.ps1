# Script PowerShell pour valider les concepts de base de l'audio
# Ce script teste les mathématiques et concepts sans nécessiter de compilation

param(
    [switch]$Verbose = $false,
    [switch]$ExportResults = $false
)

# Configuration
$TestResults = @()
$TotalTests = 0
$PassedTests = 0

function Write-TestHeader {
    param([string]$Title)
    Write-Host ""
    Write-Host "🧪 $Title" -ForegroundColor Cyan
    Write-Host ("-" * ($Title.Length + 3)) -ForegroundColor Cyan
}

function Write-TestResult {
    param([string]$TestName, [bool]$Passed, [string]$Message = "")

    $TotalTests++
    if ($Passed) {
        $PassedTests++
        Write-Host "✅ $TestName" -ForegroundColor Green
        if ($Verbose -and $Message) {
            Write-Host "   $Message" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ $TestName" -ForegroundColor Red
        if ($Message) {
            Write-Host "   $Message" -ForegroundColor Red
        }
    }

    $TestResults += @{
        Name = $TestName
        Passed = $Passed
        Message = $Message
    }
}

function Test-AudioMath {
    Write-TestHeader "Test des Mathématiques Audio"

    # Test conversion dB <-> linéaire
    $testDb = 6.0
    $linear = [Math]::Pow(10, $testDb / 20.0)
    $backToDb = 20.0 * [Math]::Log10($linear)

    $tolerance = 0.001
    $passed = [Math]::Abs($backToDb - $testDb) -lt $tolerance

    Write-TestResult "Conversion dB <-> linéaire" $passed `
        "dB: $testDb -> Linear: $([Math]::Round($linear, 3)) -> Back to dB: $([Math]::Round($backToDb, 3))"

    # Test valeurs limites
    $edgeCases = @(
        @{dB = 0.0; Linear = 1.0},
        @{dB = -6.0; Linear = 0.501},
        @{dB = 12.0; Linear = 3.981},
        @{dB = -20.0; Linear = 0.1}
    )

    foreach ($case in $edgeCases) {
        $calculatedLinear = [Math]::Pow(10, $case.dB / 20.0)
        $diff = [Math]::Abs($calculatedLinear - $case.Linear)
        $passed = $diff -lt 0.01

        Write-TestResult "Conversion dB $($case.dB) -> Linear $($case.Linear)" $passed `
            "Calculated: $([Math]::Round($calculatedLinear, 3)), Expected: $($case.Linear), Diff: $([Math]::Round($diff, 3))"
    }
}

function Test-SignalGeneration {
    Write-TestHeader "Test de Génération de Signal"

    # Paramètres
    $sampleRate = 44100
    $frequency = 440.0
    $numSamples = 100

    # Générer un signal sinusoïdal simple
    $sineWave = @()
    for ($i = 0; $i -lt $numSamples; $i++) {
        $t = $i / $sampleRate
        $sample = [Math]::Sin(2 * [Math]::PI * $frequency * $t)
        $sineWave += $sample
    }

    # Vérifier les limites
    $maxVal = ($sineWave | Measure-Object -Maximum).Maximum
    $minVal = ($sineWave | Measure-Object -Minimum).Minimum

    $passed = ($maxVal -le 1.0) -and ($minVal -ge -1.0)
    Write-TestResult "Génération sinusoïdale" $passed `
        "Range: [$([Math]::Round($minVal, 3)), $([Math]::Round($maxVal, 3))]"

    # Test signal constant
    $constantSignal = @(0.5) * 10
    $constMax = ($constantSignal | Measure-Object -Maximum).Maximum
    $constMin = ($constantSignal | Measure-Object -Minimum).Minimum
    $constPassed = ($constMax -eq 0.5) -and ($constMin -eq 0.5)
    Write-TestResult "Signal constant" $constPassed `
        "Valeur: 0.5, Max: $constMax, Min: $constMin"

    # Test signal impulsion
    $impulseSignal = @(0) * 10
    $impulseSignal[5] = 1.0
    $impulseMax = ($impulseSignal | Measure-Object -Maximum).Maximum
    $impulsePassed = $impulseMax -eq 1.0
    Write-TestResult "Signal impulsion" $impulsePassed `
        "Position 5, Valeur: 1.0, Max détecté: $impulseMax"
}

function Test-RMSCalculation {
    Write-TestHeader "Test du Calcul RMS"

    # Signal simple ±0.5
    $signal1 = @(0.5, -0.5, 0.5, -0.5)
    $sumSquares1 = 0
    foreach ($sample in $signal1) {
        $sumSquares1 += $sample * $sample
    }
    $rms1 = [Math]::Sqrt($sumSquares1 / $signal1.Length)
    $expectedRMS1 = 0.5
    $passed1 = [Math]::Abs($rms1 - $expectedRMS1) -lt 0.001

    Write-TestResult "RMS signal ±0.5" $passed1 `
        "RMS: $([Math]::Round($rms1, 3)), Expected: $expectedRMS1"

    # Signal sinusoïdal (RMS = amplitude / sqrt(2))
    $signal2 = @(1.0, 0.0, -1.0, 0.0)  # Sinus normalisé
    $sumSquares2 = 0
    foreach ($sample in $signal2) {
        $sumSquares2 += $sample * $sample
    }
    $rms2 = [Math]::Sqrt($sumSquares2 / $signal2.Length)
    $expectedRMS2 = 1.0 / [Math]::Sqrt(2)  # ~0.707
    $passed2 = [Math]::Abs($rms2 - $expectedRMS2) -lt 0.01

    Write-TestResult "RMS signal sinusoïdal" $passed2 `
        "RMS: $([Math]::Round($rms2, 3)), Expected: $([Math]::Round($expectedRMS2, 3))"
}

function Test-SignalValidation {
    Write-TestHeader "Test de Validation de Signal"

    # Signaux de test
    $goodSignal = @(0.5, -0.3, 0.8, -0.9, 0.1, -0.2)
    $badSignal = @(1.5, -2.0, 0.5, -0.8)  # Hors limites

    # Validation du bon signal
    $goodValid = $true
    foreach ($sample in $goodSignal) {
        if ([Math]::Abs($sample) -gt 1.0 -or [double]::IsNaN($sample) -or [double]::IsInfinity($sample)) {
            $goodValid = $false
            break
        }
    }

    Write-TestResult "Signal valide (dans [-1, 1])" $goodValid

    # Validation du mauvais signal
    $badInvalid = $false
    foreach ($sample in $badSignal) {
        if ([Math]::Abs($sample) -gt 1.0) {
            $badInvalid = $true
            break
        }
    }

    Write-TestResult "Détection signal invalide" $badInvalid

    # Test NaN et Inf
    $nanSignal = @(0.5, [double]::NaN, 0.3)
    $hasNaN = $false
    foreach ($sample in $nanSignal) {
        if ([double]::IsNaN($sample)) {
            $hasNaN = $true
            break
        }
    }

    Write-TestResult "Détection NaN" $hasNaN

    $infSignal = @(0.5, [double]::PositiveInfinity, 0.3)
    $hasInf = $false
    foreach ($sample in $infSignal) {
        if ([double]::IsInfinity($sample)) {
            $hasInf = $true
            break
        }
    }

    Write-TestResult "Détection Inf" $hasInf
}

function Test-Performance {
    Write-TestHeader "Test de Performance Basique"

    $iterations = 10000
    $startTime = Get-Date

    $result = 0.0
    for ($i = 0; $i -lt $iterations; $i++) {
        $result += [Math]::Sin(2 * [Math]::PI * 440.0 * $i / 44100.0)
    }

    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMilliseconds

    $samplesPerMs = $iterations / $duration
    $realtimeFactor = $samplesPerMs / 44.1  # 44.1kHz

    $passed = $realtimeFactor -gt 0.1  # Au moins 0.1x temps réel
    Write-TestResult "Performance calcul" $passed `
        "Durée: $([Math]::Round($duration, 2))ms, Échantillons/ms: $([Math]::Round($samplesPerMs, 0)), Facteur temps réel: $([Math]::Round($realtimeFactor, 2))x"
}

function Test-FileExistence {
    Write-TestHeader "Validation des Fichiers Audio"

    $requiredFiles = @(
        "shared/Audio/core/AudioEqualizer.hpp",
        "shared/Audio/core/BiquadFilter.hpp",
        "shared/Audio/utils/AudioBuffer.hpp",
        "shared/Audio/utils/Constants.hpp",
        "shared/Audio/effects/Compressor.hpp",
        "shared/Audio/noise/NoiseReducer.hpp"
    )

    $allFilesExist = $true
    foreach ($file in $requiredFiles) {
        $fullPath = Join-Path $PSScriptRoot "../../$file"
        $exists = Test-Path $fullPath
        $allFilesExist = $allFilesExist -and $exists

        if ($exists) {
            Write-TestResult "Fichier $file" $true
        } else {
            Write-TestResult "Fichier $file" $false "Chemin: $fullPath"
        }
    }

    Write-TestResult "Tous les fichiers requis présents" $allFilesExist
}

function Export-Results {
    param([string]$FileName = "audio_test_results.json")

    $exportData = @{
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        TotalTests = $TotalTests
        PassedTests = $PassedTests
        SuccessRate = [Math]::Round(($PassedTests / $TotalTests) * 100, 2)
        Results = $TestResults
    }

    $json = $exportData | ConvertTo-Json -Depth 3
    $json | Out-File $FileName -Encoding UTF8

    Write-Host ""
    Write-Host "📊 Résultats exportés vers: $FileName" -ForegroundColor Green
}

# Exécution principale
Write-Host "🎵 Validation des Concepts Audio de Base" -ForegroundColor Magenta
Write-Host "==========================================" -ForegroundColor Magenta
Write-Host ""

Test-AudioMath
Test-SignalGeneration
Test-RMSCalculation
Test-SignalValidation
Test-Performance
Test-FileExistence

# Résumé
Write-Host ""
Write-Host "📊 Résumé des Tests" -ForegroundColor Yellow
Write-Host "==================" -ForegroundColor Yellow
Write-Host "Tests totaux: $TotalTests"
Write-Host "Tests réussis: $PassedTests"
Write-Host "Taux de succès: $([Math]::Round(($PassedTests / $TotalTests) * 100, 2))%"

if ($PassedTests -eq $TotalTests) {
    Write-Host ""
    Write-Host "🎉 Tous les tests ont réussi !" -ForegroundColor Green
    Write-Host "✅ Les concepts de base de l'audio numérique fonctionnent correctement." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  Certains tests ont échoué." -ForegroundColor Red
    Write-Host "❌ Vérifiez l'implémentation et les dépendances." -ForegroundColor Red
}

# Export des résultats si demandé
if ($ExportResults) {
    Export-Results
}

Write-Host ""
Write-Host "🔧 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "  1. Installez un compilateur C++ (g++ ou Visual Studio)" -ForegroundColor White
Write-Host "  2. Exécutez: cmake --build . --config Release" -ForegroundColor White
Write-Host "  3. Lancez: ./audio_tests.exe" -ForegroundColor White
Write-Host ""
Write-Host "📚 Pour plus d'informations, consultez manual_test_guide.md" -ForegroundColor Cyan
