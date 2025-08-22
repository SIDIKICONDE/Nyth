# Script PowerShell pour lancer clang-tidy
param(
    [string]$BuildDir = "build_cpp17",
    [string]$Checks = "modernize-*,performance-*,readability-*,bugprone-*,cert-*,clang-analyzer-*",
    [switch]$Fix,
    [switch]$Verbose
)

Write-Host "🔍 Lancement de clang-tidy sur le projet Nyth..." -ForegroundColor Green

# Vérifier si clang-tidy est installé
try {
    $clangTidyVersion = clang-tidy --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ clang-tidy n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
        Write-Host "💡 Installez LLVM/Clang depuis: https://releases.llvm.org/" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ clang-tidy trouvé:" -ForegroundColor Green
    Write-Host $clangTidyVersion[0] -ForegroundColor Cyan
}
catch {
    Write-Host "❌ Erreur lors de la vérification de clang-tidy" -ForegroundColor Red
    exit 1
}

# Créer le répertoire de build si nécessaire
if (!(Test-Path $BuildDir)) {
    Write-Host "📁 Création du répertoire de build: $BuildDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $BuildDir -Force | Out-Null
}

# Générer la compilation database
Write-Host "🔧 Génération de la compilation database..." -ForegroundColor Yellow
Push-Location $BuildDir
try {
    cmake -DCMAKE_EXPORT_COMPILE_COMMANDS=ON ..
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de la génération de la compilation database" -ForegroundColor Red
        exit 1
    }
}
finally {
    Pop-Location
}

# Fichiers C++ à analyser
$cppFiles = @(
    "shared/Audio/core/*.cpp",
    "shared/Audio/core/*.hpp",
    "shared/filters/*.cpp",
    "shared/filters/*.hpp",
    "test/*.cpp",
    "__tests__/audio/*.cpp",
    "__tests__/core/*.cpp",
    "__tests__/effects/*.cpp",
    "__tests__/noise/*.cpp",
    "__tests__/recording/*.cpp",
    "__tests__/safety/*.cpp",
    "__tests__/utils/*.cpp"
)

$allFiles = @()
foreach ($pattern in $cppFiles) {
    $files = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue
    $allFiles += $files
}

if ($allFiles.Count -eq 0) {
    Write-Host "⚠️  Aucun fichier C++ trouvé avec les patterns spécifiés" -ForegroundColor Yellow
    exit 0
}

Write-Host "📋 Fichiers à analyser ($($allFiles.Count) fichiers):" -ForegroundColor Green
$allFiles | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Cyan }

# Préparer la commande clang-tidy
$clangTidyArgs = @(
    "--checks=$Checks",
    "--header-filter=.*",
    "--quiet"
)

if ($Fix) {
    $clangTidyArgs += "--fix"
    Write-Host "🔧 Mode correction activé" -ForegroundColor Yellow
}

if ($Verbose) {
    $clangTidyArgs += "--verbose"
}

# Lancer clang-tidy sur chaque fichier
$errors = 0
$warnings = 0

foreach ($file in $allFiles) {
    Write-Host "🔍 Analyse de $($file.Name)..." -ForegroundColor Yellow

    $output = & clang-tidy @clangTidyArgs $file.FullName 2>&1

    if ($LASTEXITCODE -ne 0) {
        $errors++
        Write-Host "❌ Erreurs dans $($file.Name):" -ForegroundColor Red
        Write-Host $output -ForegroundColor Red
    }
    elseif ($output) {
        $warnings++
        Write-Host "⚠️  Avertissements dans $($file.Name):" -ForegroundColor Yellow
        Write-Host $output -ForegroundColor Yellow
    }
    else {
        Write-Host "✅ $($file.Name) - Aucun problème détecté" -ForegroundColor Green
    }
}

# Résumé
Write-Host "`n📊 Résumé de l'analyse clang-tidy:" -ForegroundColor Green
Write-Host "  Fichiers analysés: $($allFiles.Count)" -ForegroundColor Cyan
Write-Host "  Erreurs: $errors" -ForegroundColor $(if ($errors -gt 0) { "Red" } else { "Green" })
Write-Host "  Avertissements: $warnings" -ForegroundColor $(if ($warnings -gt 0) { "Yellow" } else { "Green" })

if ($errors -eq 0 -and $warnings -eq 0) {
    Write-Host "🎉 Tous les fichiers sont conformes aux standards clang-tidy!" -ForegroundColor Green
}
else {
    Write-Host "💡 Utilisez --Fix pour corriger automatiquement les problèmes corrigibles" -ForegroundColor Yellow
    exit 1
}
