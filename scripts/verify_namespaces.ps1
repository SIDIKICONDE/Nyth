# Script PowerShell pour vérifier les namespaces
# Equivalent du script Bash verify_namespaces.sh

param(
    [switch]$Test,
    [switch]$Clean,
    [switch]$Help
)

# Configuration
$ScriptDir = Split-Path -Parent $PSCommandPath
$ProjectRoot = Split-Path -Parent $ScriptDir

# Liste des fichiers a verifier
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
    Write-Host "Verifications de Namespaces - Aide" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Utilisation:" -ForegroundColor Yellow
    Write-Host "  .\verify_namespaces.ps1              # Verifier tous les namespaces"
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
        Write-Host "Fichier non trouve: $FilePath" -ForegroundColor Yellow
        return
    }

    Write-Host "Verification de $FilePath..." -ForegroundColor Blue

    $Content = Get-Content $FilePath -Raw

    # Verifier les using declarations attendues
    if ($Content -notmatch "using Nyth::Audio::") {
        Write-Host "ERREUR: $FilePath - Using declarations Nyth::Audio manquantes" -ForegroundColor Red
        $script:ErrorsFound++
    }

    # Verifier l'absence de references longues non autorisees
    # Exclure les using declarations: "using Nyth::Audio::Type;"
    $LongRefs = [regex]::Matches($Content, "(?<!using\s)Nyth::Audio::[A-Z][a-zA-Z0-9_]*")
    if ($LongRefs.Count -gt 0) {
        Write-Host "ERREUR: $FilePath - References longues Nyth::Audio::* non autorisees:" -ForegroundColor Red
        foreach ($Match in $LongRefs) {
            Write-Host "   Ligne $($Match.Index): $($Match.Value)" -ForegroundColor Red
        }
        $script:ErrorsFound++
    }

    # Verifier le namespace facebook::react
    if ($Content -notmatch "namespace facebook") {
        Write-Host "ERREUR: $FilePath - Namespace facebook::react manquant" -ForegroundColor Red
        $script:ErrorsFound++
    }

    # Verifier la structure des using declarations
    if (($Content -match "using Nyth::Audio::") -and ($Content -notmatch "namespace facebook")) {
        Write-Host "ERREUR: $FilePath - Using declarations hors du namespace facebook::react" -ForegroundColor Red
        $script:ErrorsFound++
    }

    if ($script:ErrorsFound -eq 0) {
        Write-Host "OK: $FilePath" -ForegroundColor Green
    }
}

function Test-VerificationScript {
    Write-Host "Test des verifications de namespaces..." -ForegroundColor Cyan

    # Creer un repertoire de test
    $TestDir = Join-Path $ProjectRoot "test_namespace_verification"
    if (Test-Path $TestDir) {
        Remove-Item $TestDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $TestDir | Out-Null

    # Creer un fichier de test valide
    $ValidFile = @'
#pragma once

namespace facebook {
namespace react {

using Nyth::Audio::SafetyConfig;
using Nyth::Audio::SafetyError;
using Nyth::Audio::SafetyState;

class ValidModule {
public:
    explicit ValidModule();
    ~ValidModule() override;

    jsi::Value process(jsi::Runtime rt);

private:
    SafetyConfig config_;
    SafetyState currentState_;
};

} // namespace react
} // namespace facebook
'@

    $ValidFile | Out-File -FilePath (Join-Path $TestDir "ValidModule.h") -Encoding UTF8

    # Creer un fichier de test invalide
    $InvalidFile = @'
#pragma once

namespace facebook {
namespace react {

class InvalidModule {
public:
    explicit InvalidModule();

private:
    Nyth::Audio::SafetyConfig config_;
    Nyth::Audio::SafetyState currentState_;
};

} // namespace react
} // namespace facebook
'@

    $InvalidFile | Out-File -FilePath (Join-Path $TestDir "InvalidModule.h") -Encoding UTF8

    Write-Host "Fichiers de test crees" -ForegroundColor Blue

    # Tester les fichiers
    Write-Host ""
    Write-Host "Test du script de verification..." -ForegroundColor Cyan

    Test-NamespaceFile -FilePath (Join-Path $TestDir "ValidModule.h")
    Test-NamespaceFile -FilePath (Join-Path $TestDir "InvalidModule.h")

    # Nettoyer
    Remove-Item $TestDir -Recurse -Force

    if ($script:ErrorsFound -eq 0) {
        Write-Host ""
        Write-Host "Test echoue ! Le script n'a pas detecte les erreurs attendues." -ForegroundColor Red
        exit 1
    }
    else {
        Write-Host ""
        Write-Host "Test reussi ! Le script detecte correctement les erreurs de namespaces." -ForegroundColor Green
        exit 0
    }
}

function Clean-TestArtifacts {
    Write-Host "Nettoyage des artefacts de test..." -ForegroundColor Cyan

    $TestDir = Join-Path $ProjectRoot "test_namespace_verification"
    if (Test-Path $TestDir) {
        Remove-Item $TestDir -Recurse -Force
        Write-Host "Nettoyage termine" -ForegroundColor Green
    }
    else {
        Write-Host "Aucun artefact de test trouve" -ForegroundColor Blue
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

    # Verification normale
    Write-Host "Verification des namespaces..." -ForegroundColor Cyan
    Write-Host ""

    foreach ($File in $ModuleFiles) {
        $FullPath = Join-Path $ProjectRoot $File
        Test-NamespaceFile -FilePath $FullPath
    }

    # Verifications generales du projet
    Write-Host ""
    Write-Host "Verifications generales..." -ForegroundColor Blue

    # Verifier la coherence des includes
    $CppFiles = Get-ChildItem -Path (Join-Path $ProjectRoot "shared/Audio") -Recurse -Include "*.cpp", "*.hpp"
    $FilesWithLongRefs = @()

    foreach ($File in $CppFiles) {
        $Content = Get-Content $File.FullName -Raw
        if ($Content -match "Nyth::Audio::[A-Z]" -and $Content -notmatch "using Nyth::Audio::") {
            $FilesWithLongRefs += $File.FullName
        }
    }

    if ($FilesWithLongRefs.Count -gt 0) {
        Write-Host "ERREUR: References longues Nyth::Audio::* trouvees en dehors des using declarations:" -ForegroundColor Red
        foreach ($File in $FilesWithLongRefs) {
            Write-Host "   $File" -ForegroundColor Red
        }
        $script:ErrorsFound++
    }

    # Resultat final
    Write-Host ""
    if ($ErrorsFound -eq 0) {
        Write-Host "Toutes les verifications de namespaces sont passees avec succes !" -ForegroundColor Green
        exit 0
    }
    else {
        Write-Host "$ErrorsFound erreurs de namespaces trouvees. Veuillez corriger." -ForegroundColor Red
        exit 1
    }
}

# Executer la fonction principale
Main
