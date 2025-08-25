#!/bin/bash

# Test rapide pour CI - Version ultra-légère
# Pour les workflows où le temps est critique

set -e

echo "⚡ Test rapide FFT pour CI"
echo "========================="

# Test 1: Fichiers présents
echo "📁 Vérification fichiers..."
files=(
    "shared/Audio/fft/NativeAudioSpectrumModule.h"
    "shared/Audio/fft/NativeAudioSpectrumModule.cpp"
    "shared/Audio/fft/managers/SpectrumManager.cpp"
    "specs/NativeAudioSpectrumModule.ts"
)

for file in "${files[@]}"; do
    [[ -f "$file" ]] || { echo "❌ Fichier manquant: $file"; exit 1; }
done
echo "✅ Fichiers présents"

# Test 2: Corrections appliquées
echo "🔧 Vérification corrections..."
[[ ! $(grep "^using [A-Z]" shared/Audio/fft/NativeAudioSpectrumModule.cpp) ]] || { echo "❌ Using declarations présents"; exit 1; }
[[ ! $(grep "return stateToString(state);" shared/Audio/fft/NativeAudioSpectrumModule.cpp) ]] || { echo "❌ Récursion stateToString"; exit 1; }
grep -q "Nyth::Audio::ArrayView<float>(magnitudesBuffer_.data(), config_.numBands)" shared/Audio/fft/managers/SpectrumManager.cpp || { echo "❌ ArrayView mal initialisé"; exit 1; }
echo "✅ Corrections appliquées"

# Test 3: API JSI
echo "🔗 Vérification API..."
grep -q "return jsi::Value(static_cast<int>(currentState_.load()));" shared/Audio/fft/NativeAudioSpectrumModule.cpp || { echo "❌ getState pas un nombre"; exit 1; }
grep -q "return jsi::Value(success);" shared/Audio/fft/NativeAudioSpectrumModule.cpp || { echo "❌ processAudioBuffer pas booléen"; exit 1; }
echo "✅ API JSI correcte"

# Test 4: Callbacks
echo "📡 Vérification callbacks..."
grep -q "jsi::Value(static_cast<int>(error))," shared/Audio/fft/NativeAudioSpectrumModule.cpp || { echo "❌ Callback error mal formaté"; exit 1; }
grep -q "args.size() == 2" shared/Audio/common/jsi/JSICallbackManager.cpp || { echo "❌ Multi-args non supporté"; exit 1; }
echo "✅ Callbacks corrects"

echo ""
echo "🎉 Test rapide réussi ! Module FFT prêt pour CI/CD"
echo "📊 Résultat: 4/4 tests passés"
