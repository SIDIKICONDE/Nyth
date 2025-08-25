# Script PowerShell pour corriger automatiquement les namespaces
# Ajoute les using declarations manquantes et remplace les references longues

param(
    [switch]$DryRun,
    [switch]$Help
)

# Configuration
$ScriptDir = Split-Path -Parent $PSCommandPath
$ProjectRoot = Split-Path -Parent $ScriptDir

# Liste des fichiers a corriger
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

# Types communs pour chaque module
$ModuleTypes = @{
    "safety"  = @("SafetyConfig", "SafetyError", "SafetyState", "SafetyReport", "SafetyStatistics", "SafetyLimits", "SafetyParameterValidator")
    "noise"   = @("NoiseConfig", "NoiseStatistics", "NoiseState", "NoiseManager", "NoiseReducer")
    "fft"     = @("SpectrumConfig", "SpectrumError", "SpectrumState", "SpectrumData", "SpectrumManager", "ISpectrumManager")
    "effects" = @("EffectsConfig", "EffectsConfigValidator", "EffectType", "CompressorEffect", "DelayEffect", "EffectManager")
    "core"    = @("AudioConfig", "AudioManager", "AudioRecorder", "AudioAnalyzer")
    "capture" = @("AudioCaptureConfig", "AudioConfig", "AudioFileWriterConfig", "AudioFileFormat", "Limits")
}

function Show-Help {
    Write-Host "Correction automatique des namespaces - Aide" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Utilisation:" -ForegroundColor Yellow
    Write-Host "  .\fix_namespaces.ps1              # Corriger tous les namespaces"
    Write-Host "  .\fix_namespaces.ps1 -DryRun      # Simuler les corrections sans modifier"
    Write-Host "  .\fix_namespaces.ps1 -Help        # Afficher cette aide"
    Write-Host ""
    Write-Host "Exemples:" -ForegroundColor Yellow
    Write-Host "  .\scripts\fix_namespaces.ps1"
    Write-Host "  .\scripts\fix_namespaces.ps1 -DryRun"
}

function Get-ModuleType {
    param([string]$FilePath)

    if ($FilePath -match "safety") { return "safety" }
    if ($FilePath -match "noise") { return "noise" }
    if ($FilePath -match "fft") { return "fft" }
    if ($FilePath -match "effects") { return "effects" }
    if ($FilePath -match "core") { return "core" }
    if ($FilePath -match "capture") { return "capture" }
    return "unknown"
}

function Fix-NamespaceFile {
    param([string]$FilePath, [bool]$DryRun)

    if (!(Test-Path $FilePath)) {
        Write-Host "Fichier non trouve: $FilePath" -ForegroundColor Yellow
        return
    }

    $ModuleType = Get-ModuleType $FilePath
    if ($ModuleType -eq "unknown") {
        Write-Host "Type de module inconnu pour: $FilePath" -ForegroundColor Yellow
        return
    }

    Write-Host "Correction de $FilePath (type: $ModuleType)..." -ForegroundColor Blue

    $Content = Get-Content $FilePath -Raw
    $OriginalContent = $Content
    $Modified = $false

    # Ajouter les using declarations manquantes
    $Types = $ModuleTypes[$ModuleType]
    foreach ($Type in $Types) {
        $UsingDeclaration = "using Nyth::Audio::$Type;"

        # Verifier si le using declaration existe deja
        if ($Content -notmatch [regex]::Escape($UsingDeclaration)) {
            # Trouver la position pour inserer le using declaration
            if ($Content -match "namespace facebook") {
                $NamespaceStart = $Content.IndexOf("namespace facebook")
                $NamespaceEnd = $Content.IndexOf("}", $NamespaceStart)

                if ($NamespaceEnd -gt $NamespaceStart) {
                    # Inserer apres l'ouverture du namespace
                    $InsertPos = $Content.IndexOf("{", $NamespaceStart) + 1
                    $Before = $Content.Substring(0, $InsertPos)
                    $After = $Content.Substring($InsertPos)

                    # Ajouter le using declaration avec une nouvelle ligne
                    $NewUsing = "`n`n// Using declarations pour les types du namespace Nyth::Audio`n$UsingDeclaration"

                    if ($Content -notmatch "// Using declarations pour les types du namespace Nyth::Audio") {
                        $Content = $Before + $NewUsing + $After
                        $Modified = $true
                        Write-Host "  + Ajoute: $UsingDeclaration" -ForegroundColor Green
                    }
                    else {
                        # Ajouter a la suite des using declarations existants
                        $UsingSection = $Content -replace "// Using declarations pour les types du namespace Nyth::Audio`n(.*?)(?=`n`n|$)", "// Using declarations pour les types du namespace Nyth::Audio`n`$1`n$UsingDeclaration"
                        if ($UsingSection -ne $Content) {
                            $Content = $UsingSection
                            $Modified = $true
                            Write-Host "  + Ajoute: $UsingDeclaration" -ForegroundColor Green
                        }
                    }
                }
            }
        }
    }

    # Remplacer les references longues par les noms courts
    foreach ($Type in $Types) {
        $LongRef = "Nyth::Audio::$Type"
        $ShortRef = $Type

        # Remplacer seulement si le using declaration existe
        if ($Content -match [regex]::Escape("using Nyth::Audio::$Type;")) {
            $Pattern = [regex]::Escape($LongRef)
            $NewContent = $Content -replace $Pattern, $ShortRef

            if ($NewContent -ne $Content) {
                $Content = $NewContent
                $Modified = $true
                Write-Host "  + Remplace: $LongRef -> $ShortRef" -ForegroundColor Green
            }
        }
    }

    if ($Modified) {
        if ($DryRun) {
            Write-Host "  [DRY RUN] Fichier serait modifie" -ForegroundColor Yellow
        }
        else {
            # Sauvegarder le fichier original
            $BackupFile = $FilePath + ".backup"
            Copy-Item $FilePath $BackupFile

            # Ecrire le nouveau contenu
            $Content | Out-File -FilePath $FilePath -Encoding UTF8
            Write-Host "  [SAUVEGARDE] Fichier modifie et sauvegarde creee: $BackupFile" -ForegroundColor Green
        }
    }
    else {
        Write-Host "  Aucune modification necessaire" -ForegroundColor Blue
    }
}

# Fonction principale
function Main {
    if ($Help) {
        Show-Help
        return
    }

    if ($DryRun) {
        Write-Host "MODE DRY RUN - Aucun fichier ne sera modifie" -ForegroundColor Yellow
        Write-Host ""
    }

    Write-Host "Correction automatique des namespaces..." -ForegroundColor Cyan
    Write-Host ""

    foreach ($File in $ModuleFiles) {
        $FullPath = Join-Path $ProjectRoot $File
        Fix-NamespaceFile -FilePath $FullPath -DryRun $DryRun
        Write-Host ""
    }

    Write-Host "Correction terminee !" -ForegroundColor Green

    if ($DryRun) {
        Write-Host "Pour appliquer les corrections, relancez sans -DryRun" -ForegroundColor Yellow
    }
    else {
        Write-Host "Verifiez les resultats avec: .\scripts\verify_namespaces.ps1" -ForegroundColor Cyan
    }
}

# Executer la fonction principale
Main
