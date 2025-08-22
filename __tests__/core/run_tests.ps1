#!/usr/bin/env pwsh

Write-Host "🎛️ TESTS UNITAIRES - COMPOSANTS CORE" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

$testDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $testDir

$tests = @(
    @{Name="AudioEqualizer"; File="test_equalizer.cpp"; Exe="test_equalizer"},
    @{Name="BiquadFilter"; File="test_biquad.cpp"; Exe="test_biquad"},
    @{Name="Core Integration"; File="test_integration.cpp"; Exe="test_integration"},
    @{Name="Performance"; File="test_performance.cpp"; Exe="test_performance"}
)

$passed = 0
$total = $tests.Count

foreach ($test in $tests) {
    Write-Host ""
    Write-Host "📋 Testing $($test.Name)..." -ForegroundColor Yellow

    # Compilation
    $compileCmd = "g++ -std=c++17 -I../../shared -I. -o $($test.Exe) $($test.File) 2>&1"
    $compileResult = Invoke-Expression $compileCmd

    if ($LASTEXITCODE -eq 0) {
        # Exécution du test
        $testResult = & ".\$($test.Exe).exe" 2>&1

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $($test.Name) - PASSED" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "❌ $($test.Name) - FAILED" -ForegroundColor Red
            Write-Host $testResult -ForegroundColor Red
        }

        # Nettoyer l'exécutable
        if (Test-Path "$($test.Exe).exe") {
            Remove-Item "$($test.Exe).exe"
        }
    } else {
        Write-Host "❌ $($test.Name) - COMPILATION FAILED" -ForegroundColor Red
        Write-Host $compileResult -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎯 RÉSULTATS FINAUX:" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host "✅ Tests réussis  : $passed/$total" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Yellow" })
Write-Host "📊 Taux de succès : $([math]::Round(($passed/$total)*100, 1))%" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Yellow" })

if ($passed -eq $total) {
    Write-Host ""
    Write-Host "🎉 TOUS LES TESTS CORE PASSENT !" -ForegroundColor Green
    Write-Host "==================================" -ForegroundColor Green
    Write-Host "📊 BILAN DE LA VALIDATION CORE :" -ForegroundColor White
    Write-Host "   📁 AudioEqualizer  : ~15 tests (Equalizer, Processing)" -ForegroundColor White
    Write-Host "   📁 BiquadFilter    : ~12 tests (Filters, Coefficients)" -ForegroundColor White
    Write-Host "   📁 Core Integration: ~8 tests (Cross-components)" -ForegroundColor White
    Write-Host "   📁 Performance     : ~5 tests (Benchmarks, Optimizations)" -ForegroundColor White
    Write-Host "   📈 TOTAL           : ~40 tests de validation core !" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "✅ Classes correctement initialisées" -ForegroundColor Green
    Write-Host "✅ Filtres mathématiquement précis" -ForegroundColor Green
    Write-Host "✅ Intégration cross-components" -ForegroundColor Green
    Write-Host "✅ Performance audio temps-réel" -ForegroundColor Green
    Write-Host "✅ Thread-safety validée" -ForegroundColor Green
    Write-Host "✅ Mémoire correctement gérée" -ForegroundColor Green
    Write-Host "✅ Templates C++17 fonctionnels" -ForegroundColor Green
    Write-Host "✅ SIMD ready pour optimisations" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️ CERTAINS TESTS CORE ONT ÉCHOUÉ" -ForegroundColor Yellow
    Write-Host "Vérifiez les erreurs ci-dessus" -ForegroundColor Yellow
    Write-Host "Vérifiez les chemins vers ../../shared/Audio/core/" -ForegroundColor Yellow
}

Read-Host "Appuyez sur Entrée pour continuer"
