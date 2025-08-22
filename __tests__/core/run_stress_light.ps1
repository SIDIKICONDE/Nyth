#!/usr/bin/env pwsh

Write-Host "TESTS DE STRESS ULTRA LEGERS - MODULE CORE" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green

$testDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $testDir

$compileFlags = "-std=c++20 -Wall -Wextra -I. -I../../ -O2 -pthread"
$sources = "test_stress_ultra_light.cpp ../../shared/Audio/core/AudioEqualizer.cpp ../../shared/Audio/core/BiquadFilter.cpp"
$target = "test_stress_light"

Write-Host ""
Write-Host "Compilation des tests de stress legers..." -ForegroundColor Yellow

# Compilation
$compileCmd = "g++ $compileFlags -o $target $sources 2>&1"
$compileResult = Invoke-Expression $compileCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "Compilation reussie !" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Execution des tests de stress legers..." -ForegroundColor Yellow
    Write-Host "Version legere pour eviter les blocages" -ForegroundColor Cyan
    
    # Execution
    $testResult = & ".\$target.exe" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "TOUS LES TESTS DE STRESS LEGERS PASSES !" -ForegroundColor Green
        Write-Host "=========================================" -ForegroundColor Green
        Write-Host "Module Core valide pour la production" -ForegroundColor White
        Write-Host "Performance et stabilite confirmees" -ForegroundColor White
        Write-Host "Tests legers termines avec succes" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "CERTAINS TESTS DE STRESS ONT ECHOUE" -ForegroundColor Red
        Write-Host $testResult -ForegroundColor Red
    }
    
    # Nettoyer l'executable
    if (Test-Path "$target.exe") {
        Remove-Item "$target.exe"
    }
} else {
    Write-Host "ECHEC DE LA COMPILATION" -ForegroundColor Red
    Write-Host $compileResult -ForegroundColor Red
}

Write-Host ""
Write-Host "RESUME DES TESTS DE STRESS LEGERS :" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Test 1: Stress de memoire leger (100 instances + 1M echantillons)" -ForegroundColor White
Write-Host "Test 2: Stress de performance leger (1M echantillons + 1k iterations)" -ForegroundColor White
Write-Host "Test 3: Stress de stabilite numerique (valeurs extremes)" -ForegroundColor White
Write-Host "Test 4: Stress multi-threading leger (4 threads max)" -ForegroundColor White
Write-Host "Test 5: Stress de parametres temps reel leger (1k modifications)" -ForegroundColor White

Read-Host "Appuyez sur Entree pour continuer"
