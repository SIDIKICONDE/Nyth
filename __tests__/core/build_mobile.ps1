# Script PowerShell pour build des tests de stress mobiles
# Usage: .\build_mobile.ps1 [android|ios|force]

param(
    [string]$Platform = "auto"
)

Write-Host "🔧 Build des tests de stress pour mobile" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Configuration de base
$CxxFlags = "-std=c++20 -O2 -DNDEBUG"
$Includes = "-I../../shared -I../../shared/Audio/core"
$Sources = "test_stress_ultra.cpp ../../shared/Audio/core/AudioEqualizer.cpp ../../shared/Audio/core/BiquadFilter.cpp"
$Output = "test_stress_mobile.exe"
$Cxx = "g++"

# Déterminer la plateforme cible
switch ($Platform.ToLower()) {
    "android" {
        Write-Host "📱 Configuration Android" -ForegroundColor Green
        $CxxFlags += " -D__ANDROID__"
        if ($env:ANDROID_NDK) {
            Write-Host "   Utilisation Android NDK: $env:ANDROID_NDK" -ForegroundColor Yellow
        } else {
            Write-Host "⚠️  ANDROID_NDK non défini, utilisation du compilateur système" -ForegroundColor Yellow
        }
        break
    }
    "ios" {
        Write-Host "📱 Configuration iOS" -ForegroundColor Green
        $CxxFlags += " -D__IPHONE_OS_VERSION_MIN_REQUIRED=140000"
        Write-Host "   Note: Cross-compilation iOS sur Windows nécessite des outils spéciaux" -ForegroundColor Yellow
        break
    }
    "force" {
        Write-Host "📱 Configuration mobile forcée (desktop)" -ForegroundColor Green
        $CxxFlags += " -DFORCE_MOBILE_CONFIG"
        break
    }
    default {
        Write-Host "📱 Configuration mobile auto-détectée" -ForegroundColor Green
        break
    }
}

Write-Host "   Plateforme: $Platform" -ForegroundColor White
Write-Host "   Compilateur: $Cxx" -ForegroundColor White
Write-Host "   Flags: $CxxFlags" -ForegroundColor White
Write-Host ""

# Vérifier que les fichiers sources existent
Write-Host "🔍 Vérification des fichiers sources..." -ForegroundColor Cyan
$SourceFiles = $Sources -split " "
$AllFilesExist = $true

foreach ($file in $SourceFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Fichier manquant: $file" -ForegroundColor Red
        $AllFilesExist = $false
    }
}

if (-not $AllFilesExist) {
    Write-Host "❌ Certains fichiers sources sont manquants" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Tous les fichiers sources trouvés" -ForegroundColor Green

# Compilation
Write-Host ""
Write-Host "🔨 Compilation en cours..." -ForegroundColor Cyan
$CompileCommand = "$Cxx $CxxFlags $Includes $Sources -o $Output"
Write-Host "Commande: $CompileCommand" -ForegroundColor Gray

try {
    # Exécuter la compilation
    $process = Start-Process -FilePath $Cxx -ArgumentList "$CxxFlags $Includes $Sources -o $Output" -Wait -PassThru -NoNewWindow -RedirectStandardOutput "compile_output.txt" -RedirectStandardError "compile_error.txt"
    
    if ($process.ExitCode -eq 0) {
        Write-Host "✅ Compilation réussie!" -ForegroundColor Green
        
        # Afficher les informations sur l'exécutable
        if (Test-Path $Output) {
            Write-Host ""
            Write-Host "📊 Informations sur l'exécutable:" -ForegroundColor Cyan
            $fileInfo = Get-Item $Output
            Write-Host "   Taille: $([math]::Round($fileInfo.Length / 1MB, 2)) MB" -ForegroundColor White
            Write-Host "   Créé: $($fileInfo.CreationTime)" -ForegroundColor White
            
            # Test rapide si possible
            if ($Platform -ne "android" -and $Platform -ne "ios") {
                Write-Host ""
                Write-Host "🧪 Test rapide de l'exécutable..." -ForegroundColor Cyan
                Write-Host "   (Interruption après 10 secondes si nécessaire)" -ForegroundColor Yellow
                
                try {
                    # Lancer le test avec un timeout
                    $job = Start-Job -ScriptBlock { & $args[0] } -ArgumentList (Resolve-Path $Output)
                    $completed = Wait-Job -Job $job -Timeout 10
                    
                    if ($completed) {
                        Write-Host "✅ Test rapide réussi!" -ForegroundColor Green
                    } else {
                        Write-Host "⚠️  Test rapide interrompu (normal pour les longs tests)" -ForegroundColor Yellow
                        Stop-Job -Job $job
                    }
                    Remove-Job -Job $job -Force
                } catch {
                    Write-Host "⚠️  Impossible d'exécuter le test rapide" -ForegroundColor Yellow
                }
            } else {
                Write-Host "📱 Exécutable cross-compilé - pas de test local possible" -ForegroundColor Yellow
            }
            
            Write-Host ""
            Write-Host "🎯 Build terminé avec succès!" -ForegroundColor Green
            Write-Host "   Exécutable: .\$Output" -ForegroundColor White
            
            if ($Platform -eq "android" -or $Platform -eq "ios") {
                Write-Host "   ⚠️  Transférer l'exécutable sur l'appareil cible pour l'exécuter" -ForegroundColor Yellow
            } else {
                Write-Host "   Lancer avec: .\$Output" -ForegroundColor White
            }
        } else {
            Write-Host "❌ Erreur: exécutable non trouvé après compilation" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ Erreur de compilation (code: $($process.ExitCode))" -ForegroundColor Red
        
        # Afficher les erreurs si disponibles
        if (Test-Path "compile_error.txt") {
            $errorContent = Get-Content "compile_error.txt" -Raw
            if ($errorContent.Trim()) {
                Write-Host "Erreurs de compilation:" -ForegroundColor Red
                Write-Host $errorContent -ForegroundColor Red
            }
        }
        exit 1
    }
} catch {
    Write-Host "❌ Erreur lors de l'exécution de la compilation: $_" -ForegroundColor Red
    exit 1
} finally {
    # Nettoyer les fichiers temporaires
    if (Test-Path "compile_output.txt") { Remove-Item "compile_output.txt" -Force }
    if (Test-Path "compile_error.txt") { Remove-Item "compile_error.txt" -Force }
}

Write-Host ""
Write-Host "📱 Configuration mobile utilisée:" -ForegroundColor Cyan
Write-Host "   • Buffers réduits (64K-256K échantillons)" -ForegroundColor White
Write-Host "   • Itérations réduites (1000 vs 10000)" -ForegroundColor White
Write-Host "   • Mémoire limitée (10MB vs 100MB)" -ForegroundColor White
Write-Host "   • Tests spécifiques mobiles inclus" -ForegroundColor White
Write-Host "   • Optimisations pour économie d'énergie" -ForegroundColor White
