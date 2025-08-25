#!/bin/bash

# Script de vérification des namespaces pour CI/CD
# Vérifie que les conventions de namespaces sont respectées

set -e

echo "🔍 Vérification des namespaces..."

# Liste des fichiers à vérifier (modules TurboModule)
MODULE_FILES=(
    "shared/Audio/safety/NativeAudioSafetyModule.h"
    "shared/Audio/safety/NativeAudioSafetyModule.cpp"
    "shared/Audio/noise/NativeAudioNoiseModule.h"
    "shared/Audio/noise/NativeAudioNoiseModule.cpp"
    "shared/Audio/fft/NativeAudioSpectrumModule.h"
    "shared/Audio/fft/NativeAudioSpectrumModule.cpp"
    "shared/Audio/effects/NativeAudioEffectsModule.h"
    "shared/Audio/effects/NativeAudioEffectsModule.cpp"
    "shared/Audio/core/NativeAudioCoreModule.h"
    "shared/Audio/core/NativeAudioCoreModule.cpp"

)

ERRORS_FOUND=0

for file in "${MODULE_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo "📁 Vérification de $file..."

        # Vérifier les using declarations attendues
        if ! grep -q "using Nyth::Audio::" "$file"; then
            echo "❌ ERREUR: $file - Using declarations Nyth::Audio manquantes"
            ((ERRORS_FOUND++))
        fi

        # Vérifier l'absence de références longues non autorisées
        if grep -q "Nyth::Audio::[A-Z]" "$file"; then
            echo "❌ ERREUR: $file - Références longues Nyth::Audio::* non autorisées"
            grep -n "Nyth::Audio::[A-Z]" "$file"
            ((ERRORS_FOUND++))
        fi

        # Vérifier le namespace facebook::react
        if ! grep -q "namespace facebook {" "$file"; then
            echo "❌ ERREUR: $file - Namespace facebook::react manquant"
            ((ERRORS_FOUND++))
        fi

        # Vérifier la structure des using declarations
        if grep -q "using Nyth::Audio::" "$file" && ! grep -q "namespace facebook {" "$file"; then
            echo "❌ ERREUR: $file - Using declarations hors du namespace facebook::react"
            ((ERRORS_FOUND++))
        fi

        echo "✅ $file - OK"
    else
        echo "⚠️  Fichier non trouvé: $file"
    fi
done

# Vérifications générales du projet
echo ""
echo "🔍 Vérifications générales..."

# Vérifier la cohérence des includes
if find shared/Audio -name "*.cpp" -o -name "*.hpp" | xargs grep -l "Nyth::Audio::[A-Z]" | grep -v "using Nyth::Audio::" > /dev/null; then
    echo "❌ ERREUR: Références longues Nyth::Audio::* trouvées en dehors des using declarations"
    find shared/Audio -name "*.cpp" -o -name "*.hpp" | xargs grep -l "Nyth::Audio::[A-Z]" | grep -v "using Nyth::Audio::"
    ((ERRORS_FOUND++))
fi

# Résultat final
echo ""
if [[ $ERRORS_FOUND -eq 0 ]]; then
    echo "🎉 Toutes les vérifications de namespaces sont passées avec succès !"
    exit 0
else
    echo "❌ $ERRORS_FOUND erreurs de namespaces trouvées. Veuillez corriger."
    exit 1
fi
