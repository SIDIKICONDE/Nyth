# Validation rapide de la configuration des tests core
Write-Host "🔍 Validation de la configuration des tests core..." -ForegroundColor Cyan

# Vérifier les fichiers requis
$requiredFiles = @(
    "test_equalizer.cpp",
    "test_biquad.cpp",
    "test_integration.cpp",
    "test_performance.cpp",
    "Makefile",
    "run_tests.ps1",
    "run_tests.bat",
    "README.md"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -eq 0) {
    Write-Host "✅ Tous les fichiers de test sont présents" -ForegroundColor Green
} else {
    Write-Host "❌ Fichiers manquants :" -ForegroundColor Red
    foreach ($file in $missingFiles) {
        Write-Host "   - $file" -ForegroundColor Red
    }
    exit 1
}

# Vérifier que le dossier shared existe
if (Test-Path "../../shared") {
    Write-Host "✅ Dossier shared/Audio/core accessible" -ForegroundColor Green
} else {
    Write-Host "❌ Dossier ../../shared non trouvé" -ForegroundColor Red
    exit 1
}

# Vérifier la présence de g++
try {
    $gppVersion = & g++ --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Compilateur g++ disponible" -ForegroundColor Green
    } else {
        Write-Host "⚠️ g++ trouvé mais version inconnue" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ g++ non trouvé dans le PATH" -ForegroundColor Red
    Write-Host "Installez GCC ou MinGW pour Windows" -ForegroundColor Yellow
    exit 1
}

# Test de compilation rapide
Write-Host "🔨 Test de compilation rapide..." -ForegroundColor Yellow

try {
    # Compiler test_equalizer.cpp
    $compileResult = & g++ -std=c++17 -I../../shared -I. -c test_equalizer.cpp 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ test_equalizer.cpp compile correctement" -ForegroundColor Green
        Remove-Item "test_equalizer.o" -ErrorAction SilentlyContinue
    } else {
        Write-Host "❌ Erreur de compilation pour test_equalizer.cpp" -ForegroundColor Red
        Write-Host $compileResult -ForegroundColor Red
        exit 1
    }

    # Compiler test_biquad.cpp
    $compileResult = & g++ -std=c++17 -I../../shared -I. -c test_biquad.cpp 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ test_biquad.cpp compile correctement" -ForegroundColor Green
        Remove-Item "test_biquad.o" -ErrorAction SilentlyContinue
    } else {
        Write-Host "❌ Erreur de compilation pour test_biquad.cpp" -ForegroundColor Red
        Write-Host $compileResult -ForegroundColor Red
        exit 1
    }

} catch {
    Write-Host "❌ Erreur lors du test de compilation" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host "" -ForegroundColor White
Write-Host "🎉 Configuration validée avec succès !" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Vous pouvez maintenant exécuter :" -ForegroundColor White
Write-Host "  .\run_tests.ps1              # Tests complets" -ForegroundColor Cyan
Write-Host "  make test                   # Tests avec Makefile" -ForegroundColor Cyan
Write-Host "  .\run_tests.bat             # Tests avec Batch" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White

Read-Host "Appuyez sur Entrée pour continuer"
