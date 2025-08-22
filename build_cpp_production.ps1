# =============================================================================
# Script PowerShell de build C++20 pour Nyth - Production (Windows)
# =============================================================================

param(
    [switch]$Debug,
    [switch]$Release,
    [switch]$Clean,
    [switch]$InstallOnly,
    [switch]$iOS,
    [switch]$Android,
    [switch]$Tests,
    [switch]$Help
)

# Configuration
$BuildType = if ($Debug) { "Debug" } else { "Release" }
$BuildDir = "build-production"
$SourceDir = "shared"
$InstallDir = "dist/production"

# Couleurs pour les messages (Windows)
$Colors = @{
    "Red" = [ConsoleColor]::Red
    "Green" = [ConsoleColor]::Green
    "Yellow" = [ConsoleColor]::Yellow
    "Blue" = [ConsoleColor]::Blue
    "White" = [ConsoleColor]::White
}

function Write-ColoredMessage {
    param([string]$Color, [string]$Message)
    $OriginalColor = $Host.UI.RawUI.ForegroundColor
    $Host.UI.RawUI.ForegroundColor = $Colors[$Color]
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message"
    $Host.UI.RawUI.ForegroundColor = $OriginalColor
}

function Write-Info { Write-ColoredMessage "Blue" "[INFO] $args" }
function Write-Success { Write-ColoredMessage "Green" "[SUCCESS] $args" }
function Write-Warning { Write-ColoredMessage "Yellow" "[WARNING] $args" }
function Write-Error { Write-ColoredMessage "Red" "[ERROR] $args" }

# Afficher l'aide
function Show-Help {
    Write-Host "Script de build C++20 pour Nyth - Production (Windows)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\build_cpp_production.ps1 [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Debug          Build en mode Debug"
    Write-Host "  -Release        Build en mode Release (défaut)"
    Write-Host "  -Clean          Nettoyer avant le build"
    Write-Host "  -InstallOnly    Seulement installer (pas compiler)"
    Write-Host "  -iOS            Build pour iOS (nécessite Xcode)"
    Write-Host "  -Android        Build pour Android (nécessite NDK)"
    Write-Host "  -Tests          Inclure les tests unitaires"
    Write-Host "  -Help           Afficher cette aide"
    Write-Host ""
    Write-Host "Exemples:"
    Write-Host "  .\build_cpp_production.ps1              # Build Release standard"
    Write-Host "  .\build_cpp_production.ps1 -Debug       # Build Debug"
    Write-Host "  .\build_cpp_production.ps1 -Clean       # Nettoyer et rebuild"
    Write-Host "  .\build_cpp_production.ps1 -iOS         # Build pour iOS"
}

# Vérifier les prérequis
function Test-Prerequisites {
    Write-Info "Vérification des prérequis..."

    # Vérifier CMake
    try {
        $cmakeVersion = & cmake --version
        Write-Success "CMake trouvé: $cmakeVersion"
    } catch {
        Write-Error "CMake n'est pas installé. Téléchargez-le depuis https://cmake.org/"
        exit 1
    }

    # Vérifier Visual Studio
    $vsPath = ${env:ProgramFiles(x86)} + "\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat"
    if (Test-Path $vsPath) {
        Write-Success "Visual Studio 2022 trouvé"
    } else {
        Write-Warning "Visual Studio 2022 non trouvé. Installez Visual Studio avec le développement Desktop C++"
    }

    # Vérifier Git (optionnel)
    try {
        $gitVersion = & git --version
        Write-Success "Git trouvé: $gitVersion"
    } catch {
        Write-Warning "Git non trouvé. Utile pour les submodules"
    }
}

# Configurer l'environnement Visual Studio
function Set-VSEnvironment {
    Write-Info "Configuration de l'environnement Visual Studio..."

    $vsPath = ${env:ProgramFiles(x86)} + "\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat"

    if (Test-Path $vsPath) {
        cmd /c "`"$vsPath`" && set" | ForEach-Object {
            if ($_ -match "^([^=]+)=(.*)$") {
                [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
            }
        }
        Write-Success "Environnement Visual Studio configuré"
    } else {
        Write-Warning "Impossible de configurer Visual Studio automatiquement"
    }
}

# Configurer CMake
function Configure-CMake {
    Write-Info "Configuration CMake pour $BuildType..."

    # Créer le répertoire de build
    if (Test-Path $BuildDir) {
        Remove-Item -Recurse -Force $BuildDir
    }
    New-Item -ItemType Directory -Force -Path $BuildDir | Out-Null

    Push-Location $BuildDir

    # Options CMake de base
    $cmakeOptions = @(
        "-DCMAKE_BUILD_TYPE=$BuildType",
        "-DCMAKE_INSTALL_PREFIX=$InstallDir",
        "-DBUILD_TESTS=$($Tests.ToString().ToUpper())"
    )

    # Options spécifiques à la plateforme
    if ($iOS) {
        $cmakeOptions += @(
            "-DCMAKE_SYSTEM_NAME=iOS",
            "-DCMAKE_OSX_ARCHITECTURES=arm64;x86_64",
            "-DCMAKE_OSX_DEPLOYMENT_TARGET=12.0",
            "-DCMAKE_XCODE_ATTRIBUTE_ONLY_ACTIVE_ARCH=NO",
            "-G", "Xcode"
        )
        Write-Info "Configuration pour iOS"
    } elseif ($Android) {
        $cmakeOptions += @(
            "-DCMAKE_SYSTEM_NAME=Android",
            "-DCMAKE_SYSTEM_VERSION=21",
            "-DCMAKE_ANDROID_ARCH_ABI=arm64-v8a",
            "-DCMAKE_ANDROID_NDK=$env:ANDROID_NDK",
            "-DCMAKE_ANDROID_STL=c++_shared"
        )
        Write-Info "Configuration pour Android"
    } else {
        # Windows par défaut
        $cmakeOptions += @(
            "-G", "Visual Studio 17 2022",
            "-A", "x64"
        )
        Write-Info "Configuration pour Windows"
    }

    # Configuration CMake
    $cmakeCommand = "cmake $cmakeOptions ../$SourceDir"
    Write-Info "Exécution: $cmakeCommand"

    Invoke-Expression $cmakeCommand

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Configuration CMake réussie"
    } else {
        Write-Error "Échec de la configuration CMake"
        Pop-Location
        exit 1
    }

    Pop-Location
}

# Compiler le projet
function Build-Project {
    Write-Info "Compilation en cours..."

    Push-Location $BuildDir

    # Compilation
    $buildCommand = "cmake --build . --config $BuildType --parallel $env:NUMBER_OF_PROCESSORS"
    Write-Info "Exécution: $buildCommand"

    Invoke-Expression $buildCommand

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Compilation réussie"
    } else {
        Write-Error "Échec de la compilation"
        Pop-Location
        exit 1
    }

    Pop-Location
}

# Installer les bibliothèques
function Install-Libraries {
    Write-Info "Installation des bibliothèques..."

    Push-Location $BuildDir

    # Installation
    $installCommand = "cmake --install . --config $BuildType"
    Write-Info "Exécution: $installCommand"

    Invoke-Expression $installCommand

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Installation réussie dans $InstallDir"
    } else {
        Write-Error "Échec de l'installation"
        Pop-Location
        exit 1
    }

    Pop-Location
}

# Vérifier les dépendances
function Test-Dependencies {
    Write-Info "Vérification des dépendances..."

    # Vérifier FFmpeg (Windows)
    $ffmpegPath = "ffmpeg/bin/ffmpeg.exe"
    if (Test-Path $ffmpegPath) {
        Write-Success "FFmpeg trouvé: $ffmpegPath"
    } else {
        Write-Warning "FFmpeg non trouvé. Téléchargez FFmpeg pour Windows."
    }

    # Vérifier OpenGL (inclus avec Windows)
    Write-Success "OpenGL disponible sur Windows"
}

# Nettoyer les fichiers temporaires
function Clear-BuildFiles {
    Write-Info "Nettoyage des fichiers temporaires..."

    # Extensions à supprimer
    $extensions = @("*.obj", "*.lib", "*.exp", "*.ilk", "*.pdb", "*.o", "*.a", "*.so", "*.dylib", "*.dll")

    foreach ($ext in $extensions) {
        Get-ChildItem -Path . -Filter $ext -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force
    }

    Write-Success "Nettoyage terminé"
}

# Script principal
function Main {
    if ($Help) {
        Show-Help
        return
    }

    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "  🚀 Build C++20 Nyth - Production (Windows)"
    Write-Host "==========================================" -ForegroundColor Green

    Write-Info "Build Type: $BuildType"
    Write-Info "Platform: $(if ($iOS) {'iOS'} elseif ($Android) {'Android'} else {'Windows'})"
    Write-Info "Build Tests: $Tests"

    # Nettoyer si demandé
    if ($Clean) {
        Write-Info "Nettoyage demandé..."
        Remove-Item -Recurse -Force $BuildDir -ErrorAction SilentlyContinue
        Remove-Item -Recurse -Force $InstallDir -ErrorAction SilentlyContinue
        Clear-BuildFiles
    }

    # Vérifications préalables
    Test-Prerequisites
    Set-VSEnvironment
    Test-Dependencies

    # Build ou installation seulement
    if (-not $InstallOnly) {
        Configure-CMake
        Build-Project
    }

    Install-Libraries

    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "  ✅ Build terminé avec succès !"
    Write-Host "==========================================" -ForegroundColor Green

    Write-Info "Bibliothèques installées dans: $InstallDir"
    Write-Info "Build terminé le: $(Get-Date)"

    if (Test-Path "$InstallDir/lib") {
        Write-Info "Bibliothèques générées:"
        Get-ChildItem "$InstallDir/lib" | ForEach-Object {
            Write-Host "  - $($_.Name)" -ForegroundColor Cyan
        }
    }
}

# Lancer le script
Main
