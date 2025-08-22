# Script PowerShell pour lancer cppcheck
param(
    [string]$OutputDir = "cppcheck_reports",
    [string]$Checks = "all",
    [switch]$Enable = "all",
    [switch]$Suppress = "missingIncludeSystem",
    [switch]$Verbose,
    [switch]$XmlReport
)

Write-Host "🔍 Lancement de cppcheck sur le projet Nyth..." -ForegroundColor Green

# Vérifier si cppcheck est installé
try {
    $cppcheckVersion = cppcheck --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ cppcheck n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
        Write-Host "💡 Installez cppcheck depuis: https://cppcheck.sourceforge.io/" -ForegroundColor Yellow
        Write-Host "   Ou via: winget install cppcheck.cppcheck" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ cppcheck trouvé:" -ForegroundColor Green
    Write-Host $cppcheckVersion[0] -ForegroundColor Cyan
} catch {
    Write-Host "❌ Erreur lors de la vérification de cppcheck" -ForegroundColor Red
    exit 1
}

# Créer le répertoire de sortie si nécessaire
if (!(Test-Path $OutputDir)) {
    Write-Host "📁 Création du répertoire de sortie: $OutputDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
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

# Préparer la commande cppcheck
$cppcheckArgs = @(
    "--enable=$Enable",
    "--std=c++17",
    "--language=c++",
    "--platform=win64",
    "--inline-suppr",
    "--force"
)

if ($Checks -ne "all") {
    $cppcheckArgs += "--enable=$Checks"
}

if ($Suppress) {
    $cppcheckArgs += "--suppress=$Suppress"
}

if ($Verbose) {
    $cppcheckArgs += "--verbose"
}

if ($XmlReport) {
    $xmlReportPath = Join-Path $OutputDir "cppcheck_report.xml"
    $cppcheckArgs += "--xml"
    $cppcheckArgs += "--xml-version=2"
    $cppcheckArgs += "--output-file=$xmlReportPath"
    Write-Host "📄 Rapport XML sera généré: $xmlReportPath" -ForegroundColor Yellow
}

# Ajouter les répertoires d'inclusion
$cppcheckArgs += @(
    "-I", "shared",
    "-I", "shared/Audio/core",
    "-I", "shared/filters",
    "-I", "test",
    "-I", "__tests__"
)

# Lancer cppcheck
Write-Host "🔍 Lancement de l'analyse cppcheck..." -ForegroundColor Yellow

$startTime = Get-Date
$output = & cppcheck @cppcheckArgs $allFiles.FullName 2>&1
$endTime = Get-Date
$duration = $endTime - $startTime

# Analyser les résultats
$errors = 0
$warnings = 0
$style = 0
$performance = 0
$portability = 0
$information = 0

$outputLines = $output -split "`n"
foreach ($line in $outputLines) {
    if ($line -match "error:") { $errors++ }
    elseif ($line -match "warning:") { $warnings++ }
    elseif ($line -match "style:") { $style++ }
    elseif ($line -match "performance:") { $performance++ }
    elseif ($line -match "portability:") { $portability++ }
    elseif ($line -match "information:") { $information++ }
}

# Afficher les résultats
Write-Host "`n📊 Résultats de l'analyse cppcheck:" -ForegroundColor Green
Write-Host "  Durée: $($duration.TotalSeconds.ToString('F2')) secondes" -ForegroundColor Cyan
Write-Host "  Fichiers analysés: $($allFiles.Count)" -ForegroundColor Cyan
Write-Host "  Erreurs: $errors" -ForegroundColor $(if ($errors -gt 0) { "Red" } else { "Green" })
Write-Host "  Avertissements: $warnings" -ForegroundColor $(if ($warnings -gt 0) { "Yellow" } else { "Green" })
Write-Host "  Style: $style" -ForegroundColor $(if ($style -gt 0) { "Yellow" } else { "Green" })
Write-Host "  Performance: $performance" -ForegroundColor $(if ($performance -gt 0) { "Yellow" } else { "Green" })
Write-Host "  Portabilité: $portability" -ForegroundColor $(if ($portability -gt 0) { "Yellow" } else { "Green" })
Write-Host "  Information: $information" -ForegroundColor $(if ($information -gt 0) { "Blue" } else { "Green" })

# Afficher les détails si des problèmes sont trouvés
$totalIssues = $errors + $warnings + $style + $performance + $portability + $information
if ($totalIssues -gt 0) {
    Write-Host "`n📋 Détails des problèmes trouvés:" -ForegroundColor Yellow
    Write-Host $output -ForegroundColor White
} else {
    Write-Host "`n🎉 Aucun problème détecté par cppcheck!" -ForegroundColor Green
}

# Sauvegarder le rapport complet
$reportPath = Join-Path $OutputDir "cppcheck_full_report.txt"
$output | Out-File -FilePath $reportPath -Encoding UTF8
Write-Host "📄 Rapport complet sauvegardé: $reportPath" -ForegroundColor Cyan

if ($totalIssues -gt 0) {
    Write-Host "💡 Consultez le rapport complet pour plus de détails" -ForegroundColor Yellow
    exit 1
}
