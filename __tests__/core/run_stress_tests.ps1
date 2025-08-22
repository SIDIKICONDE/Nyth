#!/usr/bin/env pwsh

Write-Host "TESTS DE STRESS ULTRA PUSSES - MODULE CORE" -ForegroundColor Red
Write-Host "===========================================" -ForegroundColor Red

$testDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $testDir

$compileFlags = "-std=c++20 -Wall -Wextra -I. -I../../ -O2 -pthread"
$sources = "test_stress_ultra.cpp ../../shared/Audio/core/AudioEqualizer.cpp ../../shared/Audio/core/BiquadFilter.cpp"
$target = "test_stress_ultra"

Write-Host ""
Write-Host "Compilation des tests de stress ultra pousses..." -ForegroundColor Yellow

# Compilation
$compileCmd = "g++ $compileFlags -o $target $sources 2>&1"
$compileResult = Invoke-Expression $compileCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "Compilation reussie !" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Execution des tests de stress ultra pousses..." -ForegroundColor Yellow
    Write-Host "ATTENTION: Ces tests sont tres intensifs et peuvent prendre plusieurs minutes" -ForegroundColor Red
    
    # Execution
    $testResult = & ".\$target.exe" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "TOUS LES TESTS DE STRESS ULTRA PUSSES PASSES !" -ForegroundColor Green
        Write-Host "===============================================" -ForegroundColor Green
        Write-Host "Module Core valide pour la production intensive" -ForegroundColor White
        Write-Host "Performance, stabilite et robustesse confirmees" -ForegroundColor White
        Write-Host "Pret pour les charges de travail les plus extremes" -ForegroundColor White
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
Write-Host "RESUME DES TESTS DE STRESS ULTRA PUSSES :" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Test 1: Stress de memoire massive (1000 instances + 1M echantillons)" -ForegroundColor White
Write-Host "Test 2: Stress de performance extreme (10M echantillons + 10k iterations)" -ForegroundColor White
Write-Host "Test 3: Stress de stabilite numerique (valeurs extremes + denormales)" -ForegroundColor White
Write-Host "Test 4: Stress multi-threading (tous les coeurs CPU)" -ForegroundColor White
Write-Host "Test 5: Stress de parametres temps reel (10k modifications)" -ForegroundColor White
Write-Host "Test 6: Stress de cascade de filtres (100 filtres en cascade)" -ForegroundColor White
Write-Host "Test 7: Stress de presets (1000 presets + 10k operations)" -ForegroundColor White
Write-Host "Test 8: Stress de validation de parametres (valeurs hors limites)" -ForegroundColor White
Write-Host "Test 9: Stress de debordement de buffer (14 tailles differentes)" -ForegroundColor White
Write-Host "Test 10: Stress de regression (10k tests de coherence)" -ForegroundColor White

Read-Host "Appuyez sur Entree pour continuer"
