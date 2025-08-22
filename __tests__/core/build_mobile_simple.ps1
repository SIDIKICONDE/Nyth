# Script PowerShell simplifié pour build des tests de stress mobiles
param([string]$Platform = "auto")

Write-Host "🔧 Build des tests de stress pour mobile" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Configuration de base
$CxxFlags = "-std=c++20 -O2 -DNDEBUG"
$Includes = "-I../../shared -I../../shared/Audio/core"
$Sources = "test_stress_ultra.cpp ../../shared/Audio/core/AudioEqualizer.cpp ../../shared/Audio/core/BiquadFilter.cpp"
$Output = "test_stress_mobile.exe"

# Ajouter le flag mobile forcé si demandé
if ($Platform -eq "force") {
    Write-Host "📱 Configuration mobile forcée (desktop)" -ForegroundColor Green
    $CxxFlags += " -DFORCE_MOBILE_CONFIG"
} elseif ($Platform -eq "android") {
    Write-Host "📱 Configuration Android" -ForegroundColor Green
    $CxxFlags += " -D__ANDROID__"
} elseif ($Platform -eq "ios") {
    Write-Host "📱 Configuration iOS" -ForegroundColor Green
    $CxxFlags += " -D__IPHONE_OS_VERSION_MIN_REQUIRED=140000"
} else {
    Write-Host "📱 Configuration mobile auto-détectée" -ForegroundColor Green
}

Write-Host "   Plateforme: $Platform" -ForegroundColor White
Write-Host "   Flags: $CxxFlags" -ForegroundColor White
Write-Host ""

# Vérifier que les fichiers sources existent
Write-Host "🔍 Vérification des fichiers sources..." -ForegroundColor Cyan
$SourceFiles = @("test_stress_ultra.cpp", "../../shared/Audio/core/AudioEqualizer.cpp", "../../shared/Audio/core/BiquadFilter.cpp")

foreach ($file in $SourceFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Fichier manquant: $file" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Tous les fichiers sources trouvés" -ForegroundColor Green

# Compilation
Write-Host ""
Write-Host "🔨 Compilation en cours..." -ForegroundColor Cyan
$Command = "g++ $CxxFlags $Includes $Sources -o $Output"
Write-Host "Commande: $Command" -ForegroundColor Gray

try {
    Invoke-Expression $Command
    
    if (Test-Path $Output) {
        Write-Host "✅ Compilation réussie!" -ForegroundColor Green
        
        # Informations sur l'exécutable
        $fileInfo = Get-Item $Output
        Write-Host ""
        Write-Host "📊 Exécutable créé:" -ForegroundColor Cyan
        Write-Host "   Taille: $([math]::Round($fileInfo.Length / 1MB, 2)) MB" -ForegroundColor White
        Write-Host "   Fichier: $Output" -ForegroundColor White
        
        Write-Host ""
        Write-Host "🎯 Build terminé avec succès!" -ForegroundColor Green
        Write-Host "   Lancer avec: .\$Output" -ForegroundColor White
        
    } else {
        Write-Host "❌ Erreur: exécutable non trouvé" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "❌ Erreur de compilation: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📱 Configuration mobile utilisée:" -ForegroundColor Cyan
Write-Host "   • Buffers réduits (64K-256K échantillons)" -ForegroundColor White
Write-Host "   • Itérations réduites (1000 vs 10000)" -ForegroundColor White
Write-Host "   • Mémoire limitée (10MB vs 100MB)" -ForegroundColor White
Write-Host "   • Tests spécifiques mobiles inclus" -ForegroundColor White
