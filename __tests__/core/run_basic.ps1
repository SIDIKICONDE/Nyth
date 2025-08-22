#!/usr/bin/env pwsh

Write-Host "TESTS DE STRESS BASIQUES - MODULE CORE" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

$testDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $testDir

$compileFlags = "-std=c++20 -Wall -Wextra -I. -I../../ -O2"
$sources = "test_stress_basic.cpp ../../shared/Audio/core/AudioEqualizer.cpp ../../shared/Audio/core/BiquadFilter.cpp"
$target = "test_basic"

Write-Host ""
Write-Host "Compilation des tests basiques..." -ForegroundColor Yellow

# Compilation
$compileCmd = "g++ $compileFlags -o $target $sources 2>&1"
$compileResult = Invoke-Expression $compileCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "Compilation reussie !" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Execution des tests basiques..." -ForegroundColor Yellow
    
    # Execution
    $testResult = & ".\$target.exe" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "TOUS LES TESTS BASIQUES PASSES !" -ForegroundColor Green
        Write-Host "=================================" -ForegroundColor Green
        Write-Host "Module Core fonctionnel" -ForegroundColor White
        Write-Host "Tests de base valides" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "CERTAINS TESTS ONT ECHOUE" -ForegroundColor Red
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
Write-Host "RESUME DES TESTS BASIQUES :" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host "Test 1: Test de base AudioEqualizer" -ForegroundColor White
Write-Host "Test 2: Test de base BiquadFilter" -ForegroundColor White
Write-Host "Test 3: Test de performance simple" -ForegroundColor White
Write-Host "Test 4: Test de parametres" -ForegroundColor White
Write-Host "Test 5: Test d'integration simple" -ForegroundColor White

Read-Host "Appuyez sur Entree pour continuer"
