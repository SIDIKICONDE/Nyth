# Script PowerShell pour vérifier les namespaces
# Équivalent du script Bash verify_namespaces.sh

param(
    [switch]$Test,
    [switch]$Clean,
    [switch]$Help
)

# Configuration
$ScriptDir = Split-Path -Parent $PSCommandPath
$ProjectRoot = Split-Path -Parent $ScriptDir

# Liste des fichiers à vérifier
$ModuleFiles = @(
    "shared/Audio/safety/NativeAudioSafetyModule.h",
    "shared/Audio/safety/NativeAudioSafetyModule.cpp",
    "shared/Audio/noise/NativeAudioNoiseModule.h",
    "shared/Audio/noise/NativeAudioNoiseModule.cpp",
    "shared/Audio/fft/NativeAudioSpectrumModule.h",
    "shared/Audio/fft/NativeAudioSpectrumModule.cpp",
    "shared/Audio/effects/NativeAudioEffectsModule.h",
    "shared/Audio/effects/NativeAudioEffectsModule.cpp",
    "shared/Audio/core/NativeAudioCoreModule.h",
    "shared/Audio/core/NativeAudioCoreModule.cpp",
    "shared/Audio/capture/NativeAudioCaptureModule.h",
    "shared/Audio/capture/NativeAudioCaptureModule.cpp"
)

$ErrorsFound = 0

function Show-Help {
    Write-Host "🔍 Vérifications de Namespaces - Aide" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Utilisation:" -ForegroundColor Yellow
    Write-Host "  .\verify_namespaces.ps1              # Vérifier tous les namespaces"
    Write-Host "  .\verify_namespaces.ps1 -Test        # Tester le script"
    Write-Host "  .\verify_namespaces.ps1 -Clean       # Nettoyer les tests"
    Write-Host "  .\verify_namespaces.ps1 -Help        # Afficher cette aide"
    Write-Host ""
    Write-Host "Exemples:" -ForegroundColor Yellow
    Write-Host "  .\scripts\verify_namespaces.ps1"
    Write-Host "  .\scripts\verify_namespaces.ps1 -Test"
}

function Test-NamespaceFile {
    param([string]$FilePath)

    if (!(Test-Path $FilePath)) {
        Write-Host "⚠️  Fichier non trouvé: $FilePath" -ForegroundColor Yellow
        return
    }

    Write-Host "📁 Vérification de $FilePath..." -ForegroundColor Blue

    $Content = Get-Content $FilePath -Raw

    # Vérifier les using declarations attendues
    if ($Content -notmatch "using Nyth::Audio::") {
        Write-Host "❌ ERREUR: $FilePath - Using declarations Nyth::Audio manquantes" -ForegroundColor Red
        $script:ErrorsFound++
    }

    # Vérifier l'absence de références longues non autorisées
    $LongRefs = [regex]::Matches($Content, "Nyth::Audio::[A-Z]")
    if ($LongRefs.Count -gt 0) {
        Write-Host "❌ ERREUR: $FilePath - Références longues Nyth::Audio::* non autorisées:" -ForegroundColor Red
        foreach ($Match in $LongRefs) {
            Write-Host "   Ligne $($Match.Index): $($Match.Value)" -ForegroundColor Red
        }
        $script:ErrorsFound++
    }

    # Vérifier le namespace facebook::react
    if ($Content -notmatch "namespace facebook") {
        Write-Host "❌ ERREUR: $FilePath - Namespace facebook::react manquant" -ForegroundColor Red
        $script:ErrorsFound++
    }

    # Vérifier la structure des using declarations
    if (($Content -match "using Nyth::Audio::") -and ($Content -notmatch "namespace facebook")) {
        Write-Host "❌ ERREUR: $FilePath - Using declarations hors du namespace facebook::react" -ForegroundColor Red
        $script:ErrorsFound++
    }

    if ($script:ErrorsFound -eq 0) {
        Write-Host "✅ $FilePath - OK" -ForegroundColor Green
    }
}

function Test-VerificationScript {
    Write-Host "🧪 Test des vérifications de namespaces..." -ForegroundColor Cyan

    # Créer un répertoire de test
    $TestDir = Join-Path $ProjectRoot "test_namespace_verification"
    if (Test-Path $TestDir) {
        Remove-Item $TestDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $TestDir | Out-Null

    # Créer un fichier de test valide
    $ValidFile = @'
#pragma once

namespace facebook {
namespace react {

// Using declarations pour les types fréquemment utilisés du namespace Nyth::Audio
using Nyth::Audio::SafetyConfig;
using Nyth::Audio::SafetyError;
using Nyth::Audio::SafetyState;

class ValidModule {
public:
    explicit ValidModule();
    ~ValidModule() override;

    jsi::Value process(jsi::Runtime& rt);

private:
    SafetyConfig config_;
    SafetyState currentState_;
};

} // namespace react
} // namespace facebook
'@

    $ValidFile | Out-File -FilePath (Join-Path $TestDir "ValidModule.h") -Encoding UTF8

    # Créer un fichier de test invalide
    $InvalidFile = @'
#pragma once

namespace facebook {
namespace react {

class InvalidModule {
public:
    explicit InvalidModule();

private:
    // Erreur : pas de using declarations
    Nyth::Audio::SafetyConfig config_;  // Erreur : référence longue
    Nyth::Audio::SafetyState currentState_;  // Erreur : référence longue
};

} // namespace react
} // namespace facebook
'@

    $InvalidFile | Out-File -FilePath (Join-Path $TestDir "InvalidModule.h") -Encoding UTF8

    Write-Host "📁 Fichiers de test créés" -ForegroundColor Blue

    # Tester les fichiers
    Write-Host ""
    Write-Host "🧪 Test du script de vérification..." -ForegroundColor Cyan

    Test-NamespaceFile -FilePath (Join-Path $TestDir "ValidModule.h")
    Test-NamespaceFile -FilePath (Join-Path $TestDir "InvalidModule.h")

    # Nettoyer
    Remove-Item $TestDir -Recurse -Force

    if ($script:ErrorsFound -eq 0) {
        Write-Host ""
        Write-Host "❌ Test échoué ! Le script n'a pas détecté les erreurs attendues." -ForegroundColor Red
        exit 1
    }
    else {
        Write-Host ""
        Write-Host "🎉 Test réussi ! Le script détecte correctement les erreurs de namespaces." -ForegroundColor Green
        exit 0
    }
}

function Clean-TestArtifacts {
    Write-Host "🧹 Nettoyage des artefacts de test..." -ForegroundColor Cyan

    $TestDir = Join-Path $ProjectRoot "test_namespace_verification"
    if (Test-Path $TestDir) {
        Remove-Item $TestDir -Recurse -Force
        Write-Host "✅ Nettoyage terminé" -ForegroundColor Green
    }
    else {
        Write-Host "ℹ️  Aucun artefact de test trouvé" -ForegroundColor Blue
    }
}

# Fonction principale
function Main {
    if ($Help) {
        Show-Help
        return
    }

    if ($Clean) {
        Clean-TestArtifacts
        return
    }

    if ($Test) {
        Test-VerificationScript
        return
    }

    # Vérification normale
    Write-Host "🔍 Vérification des namespaces..." -ForegroundColor Cyan
    Write-Host ""

    foreach ($File in $ModuleFiles) {
        $FullPath = Join-Path $ProjectRoot $File
        Test-NamespaceFile -FilePath $FullPath
    }

    # Vérifications générales du projet
    Write-Host ""
    Write-Host "🔍 Vérifications générales..." -ForegroundColor Blue

    # Vérifier la cohérence des includes
    $CppFiles = Get-ChildItem -Path (Join-Path $ProjectRoot "shared/Audio") -Recurse -Include "*.cpp", "*.hpp"
    $FilesWithLongRefs = @()

    foreach ($File in $CppFiles) {
        $Content = Get-Content $File.FullName -Raw
        if ($Content -match "Nyth::Audio::[A-Z]" -and $Content -notmatch "using Nyth::Audio::") {
            $FilesWithLongRefs += $File.FullName
        }
    }

    if ($FilesWithLongRefs.Count -gt 0) {
        Write-Host "❌ ERREUR: Références longues Nyth::Audio::* trouvées en dehors des using declarations:" -ForegroundColor Red
        foreach ($File in $FilesWithLongRefs) {
            Write-Host "   $File" -ForegroundColor Red
        }
        $script:ErrorsFound++
    }

    # Résultat final
    Write-Host ""
    if ($ErrorsFound -eq 0) {
        Write-Host "🎉 Toutes les vérifications de namespaces sont passées avec succès !" -ForegroundColor Green
        exit 0
    }
    else {
        Write-Host "❌ $ErrorsFound erreurs de namespaces trouvées. Veuillez corriger." -ForegroundColor Red
        exit 1
    }
}

# Exécuter la fonction principale
Main
