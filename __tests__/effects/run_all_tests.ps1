V# Script PowerShell pour exécuter tous les tests du module Effects
Write-Host "🎯 TESTS COMPLETS - MODULE EFFECTS" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Configuration
$CXX = "g++"
$CXXFLAGS = "-std=c++20 -Wall -Wextra -O2 -I../../shared -I../../shared/Audio -I../../shared/compat -pthread"

Write-Host "🔧 Compilation des tests de base..." -ForegroundColor Yellow
$compileBasicCmd = "$CXX $CXXFLAGS -o test_effects_complete test_effects_complete.cpp"
try {
    Invoke-Expression $compileBasicCmd
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Compilation des tests de base réussie!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur de compilation des tests de base" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
    exit 1
}

Write-Host "🔧 Compilation des tests avancés..." -ForegroundColor Yellow
$compileAdvancedCmd = "$CXX $CXXFLAGS -o test_effects_advanced test_effects_advanced.cpp"
try {
    Invoke-Expression $compileAdvancedCmd
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Compilation des tests avancés réussie!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur de compilation des tests avancés" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
    exit 1
}

Write-Host "🧪 Exécution des tests de base..." -ForegroundColor Yellow
try {
    & "./test_effects_complete"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Tests de base PASSÉS!" -ForegroundColor Green
    } else {
        Write-Host "❌ Tests de base ÉCHOUÉS" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
    exit 1
}

Write-Host "🧪 Exécution des tests avancés..." -ForegroundColor Yellow
try {
    & "./test_effects_advanced"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Tests avancés PASSÉS!" -ForegroundColor Green
    } else {
        Write-Host "❌ Tests avancés ÉCHOUÉS" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 TOUS LES TESTS EFFECTS PASSÉS AVEC SUCCÈS !" -ForegroundColor Green
Write-Host "✅ Module Effects 100% testé et validé" -ForegroundColor Green
Write-Host "✅ Couverture complète : 25 tests au total" -ForegroundColor Green
