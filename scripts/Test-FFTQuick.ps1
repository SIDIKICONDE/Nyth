# Test rapide FFT pour CI - Version PowerShell
# Pour les environnements Windows

Write-Host "⚡ Test rapide FFT pour CI (PowerShell)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Test 1: Fichiers présents
Write-Host "📁 Vérification fichiers..." -ForegroundColor Yellow
$files = @(
    "shared/Audio/fft/NativeAudioSpectrumModule.h",
    "shared/Audio/fft/NativeAudioSpectrumModule.cpp",
    "shared/Audio/fft/managers/SpectrumManager.cpp",
    "specs/NativeAudioSpectrumModule.ts"
)

foreach ($file in $files) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Fichier manquant: $file" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Fichiers présents" -ForegroundColor Green

# Test 2: Corrections appliquées
Write-Host "🔧 Vérification corrections..." -ForegroundColor Yellow

$content = Get-Content "shared/Audio/fft/NativeAudioSpectrumModule.cpp" -Raw
if ($content -match "^using [A-Z]") {
    Write-Host "❌ Using declarations présents" -ForegroundColor Red
    exit 1
}

if ($content -match "return stateToString\(state\);") {
    Write-Host "❌ Récursion stateToString" -ForegroundColor Red
    exit 1
}

$content = Get-Content "shared/Audio/fft/managers/SpectrumManager.cpp" -Raw
if ($content -notmatch "Nyth::Audio::ArrayView<float>\(magnitudesBuffer_\.data\(\), config_\.numBands\)") {
    Write-Host "❌ ArrayView mal initialisé" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Corrections appliquées" -ForegroundColor Green

# Test 3: API JSI
Write-Host "🔗 Vérification API..." -ForegroundColor Yellow
if ($content -notmatch "return jsi::Value\(static_cast<int>\(currentState_\.load\(\)\)\);") {
    Write-Host "❌ getState pas un nombre" -ForegroundColor Red
    exit 1
}

if ($content -notmatch "return jsi::Value\(success\);") {
    Write-Host "❌ processAudioBuffer pas booléen" -ForegroundColor Red
    exit 1
}
Write-Host "✅ API JSI correcte" -ForegroundColor Green

# Test 4: Callbacks
Write-Host "📡 Vérification callbacks..." -ForegroundColor Yellow
if ($content -notmatch "jsi::Value\(static_cast<int>\(error\)\),") {
    Write-Host "❌ Callback error mal formaté" -ForegroundColor Red
    exit 1
}

$content = Get-Content "shared/Audio/common/jsi/JSICallbackManager.cpp" -Raw
if ($content -notmatch "args\.size\(\) == 2") {
    Write-Host "❌ Multi-args non supporté" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Callbacks corrects" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Test rapide réussi ! Module FFT prêt pour CI/CD" -ForegroundColor Green
Write-Host "📊 Résultat: 4/4 tests passés" -ForegroundColor Cyan
