# Test rapide FFT pour CI - Version PowerShell simplifiee

Write-Host "=== Test rapide FFT pour CI (PowerShell) ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Fichiers presents
Write-Host "Verification fichiers..." -ForegroundColor Yellow
$files = @(
    "shared/Audio/fft/NativeAudioSpectrumModule.h",
    "shared/Audio/fft/NativeAudioSpectrumModule.cpp",
    "shared/Audio/fft/managers/SpectrumManager.cpp",
    "specs/NativeAudioSpectrumModule.ts"
)

foreach ($file in $files) {
    if (-not (Test-Path $file)) {
        Write-Host "ERREUR: Fichier manquant: $file" -ForegroundColor Red
        exit 1
    }
}
Write-Host "OK: Fichiers presents" -ForegroundColor Green

# Test 2: Corrections appliquees
Write-Host "Verification corrections..." -ForegroundColor Yellow

$content = Get-Content "shared/Audio/fft/NativeAudioSpectrumModule.cpp" -Raw
if ($content -match "^using [A-Z]") {
    Write-Host "ERREUR: Using declarations presents" -ForegroundColor Red
    exit 1
}

if ($content -match "return stateToString\(state\);") {
    Write-Host "ERREUR: Recursion stateToString" -ForegroundColor Red
    exit 1
}

$content = Get-Content "shared/Audio/fft/managers/SpectrumManager.cpp" -Raw
if ($content -notmatch "Nyth::Audio::ArrayView<float>\(magnitudesBuffer_\.data\(\), config_\.numBands\)") {
    Write-Host "ERREUR: ArrayView mal initialise" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Corrections appliquees" -ForegroundColor Green

# Test 3: API JSI
Write-Host "Verification API..." -ForegroundColor Yellow

$contentMain = Get-Content "shared/Audio/fft/NativeAudioSpectrumModule.cpp" -Raw
if ($contentMain -notmatch "return jsi::Value\(static_cast<int>\(currentState_\.load\(\)\)\);") {
    Write-Host "ERREUR: getState pas un nombre" -ForegroundColor Red
    exit 1
}

if ($contentMain -notmatch "return jsi::Value\(success\);") {
    Write-Host "ERREUR: processAudioBuffer pas booleen" -ForegroundColor Red
    exit 1
}
Write-Host "OK: API JSI correcte" -ForegroundColor Green

# Test 4: Callbacks
Write-Host "Verification callbacks..." -ForegroundColor Yellow
if ($contentMain -notmatch "jsi::Value\(static_cast<int>\(error\)\),") {
    Write-Host "ERREUR: Callback error mal formate" -ForegroundColor Red
    exit 1
}

$contentCallback = Get-Content "shared/Audio/common/jsi/JSICallbackManager.cpp" -Raw
if ($contentCallback -notmatch "args\.size\(\) == 2") {
    Write-Host "ERREUR: Multi-args non supporte" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Callbacks corrects" -ForegroundColor Green

Write-Host ""
Write-Host "SUCCES: Test rapide reussi ! Module FFT pret pour CI/CD" -ForegroundColor Green
Write-Host "Resultat: 4/4 tests passes" -ForegroundColor Cyan
