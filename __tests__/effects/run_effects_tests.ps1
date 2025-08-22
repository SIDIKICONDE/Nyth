# Script PowerShell pour les tests du module Effects
Write-Host "🎯 TESTS UNITAIRES - MODULE EFFECTS" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Configuration
$CXX = "g++"
$CXXFLAGS = "-std=c++20 -Wall -Wextra -O2 -I../../shared -I../../shared/Audio -I../../shared/compat"
$TARGET = "test_effects_complete"
$SOURCES = "test_effects_complete.cpp"

Write-Host "🔧 Compilation des tests..." -ForegroundColor Yellow

# Compilation
$compileCmd = "$CXX $CXXFLAGS -o $TARGET $SOURCES"
Write-Host "Commande: $compileCmd" -ForegroundColor Gray

try {
    Invoke-Expression $compileCmd
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Compilation réussie!" -ForegroundColor Green
        
        Write-Host "🧪 Exécution des tests..." -ForegroundColor Yellow
        & "./$TARGET"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "🎉 TOUS LES TESTS EFFECTS PASSÉS!" -ForegroundColor Green
        } else {
            Write-Host "❌ Certains tests ont échoué" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ Erreur de compilation" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
    exit 1
}
