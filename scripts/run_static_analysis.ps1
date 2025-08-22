# Script principal pour l'analyse statique complète
param(
    [switch]$ClangTidyOnly,
    [switch]$CppcheckOnly,
    [switch]$Fix,
    [switch]$Verbose,
    [switch]$XmlReport
)

Write-Host "🔍 Analyse statique complète du projet Nyth" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

$startTime = Get-Date
$results = @{}

# Lancer clang-tidy
if (-not $CppcheckOnly) {
    Write-Host "`n🔧 Lancement de clang-tidy..." -ForegroundColor Yellow
    $clangTidyArgs = @()

    if ($Fix) { $clangTidyArgs += "--Fix" }
    if ($Verbose) { $clangTidyArgs += "--Verbose" }

    $clangTidyResult = & "$PSScriptRoot\run_clang_tidy.ps1" @clangTidyArgs
    $results.ClangTidy = $LASTEXITCODE
}

# Lancer cppcheck
if (-not $ClangTidyOnly) {
    Write-Host "`n🔧 Lancement de cppcheck..." -ForegroundColor Yellow
    $cppcheckArgs = @()

    if ($Verbose) { $cppcheckArgs += "--Verbose" }
    if ($XmlReport) { $cppcheckArgs += "--XmlReport" }

    $cppcheckResult = & "$PSScriptRoot\run_cppcheck.ps1" @cppcheckArgs
    $results.Cppcheck = $LASTEXITCODE
}

$endTime = Get-Date
$duration = $endTime - $startTime

# Résumé final
Write-Host "`n📊 Résumé de l'analyse statique:" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host "  Durée totale: $($duration.TotalSeconds.ToString('F2')) secondes" -ForegroundColor Cyan

if (-not $CppcheckOnly) {
    $clangStatus = if ($results.ClangTidy -eq 0) { "✅" } else { "❌" }
    Write-Host "  clang-tidy: $clangStatus" -ForegroundColor $(if ($results.ClangTidy -eq 0) { "Green" } else { "Red" })
}

if (-not $ClangTidyOnly) {
    $cppcheckStatus = if ($results.Cppcheck -eq 0) { "✅" } else { "❌" }
    Write-Host "  cppcheck: $cppcheckStatus" -ForegroundColor $(if ($results.Cppcheck -eq 0) { "Green" } else { "Red" })
}

# Déterminer le code de sortie global
$globalExitCode = 0
foreach ($result in $results.Values) {
    if ($result -ne 0) {
        $globalExitCode = 1
        break
    }
}

if ($globalExitCode -eq 0) {
    Write-Host "`n🎉 Analyse statique terminée avec succès!" -ForegroundColor Green
}
else {
    Write-Host "`n⚠️  Des problèmes ont été détectés lors de l'analyse statique" -ForegroundColor Yellow
    Write-Host "💡 Consultez les rapports détaillés ci-dessus" -ForegroundColor Yellow
}

exit $globalExitCode
