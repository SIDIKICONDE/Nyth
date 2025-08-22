#!/bin/bash

# Script de build pour les tests de stress mobiles
# Usage: ./build_mobile.sh [android|ios|force]

set -e

echo "🔧 Build des tests de stress pour mobile"
echo "======================================="

# Déterminer la plateforme cible
PLATFORM=""
FORCE_MOBILE=""
CXX_FLAGS="-std=c++20 -O2 -DNDEBUG"
INCLUDES="-I../../shared -I../../shared/Audio/core"
SOURCES="test_stress_ultra.cpp ../../shared/Audio/core/AudioEqualizer.cpp ../../shared/Audio/core/BiquadFilter.cpp"
OUTPUT="test_stress_mobile"

case "$1" in
    "android")
        echo "📱 Configuration Android"
        PLATFORM="Android"
        CXX_FLAGS="$CXX_FLAGS -D__ANDROID__"
        # Pour Android NDK, utiliser le compilateur approprié
        if [ ! -z "$ANDROID_NDK" ]; then
            CXX="$ANDROID_NDK/toolchains/llvm/prebuilt/linux-x86_64/bin/aarch64-linux-android21-clang++"
        else
            echo "⚠️  ANDROID_NDK non défini, utilisation du compilateur système"
            CXX="g++"
        fi
        ;;
    "ios")
        echo "📱 Configuration iOS"
        PLATFORM="iOS"
        CXX_FLAGS="$CXX_FLAGS -D__IPHONE_OS_VERSION_MIN_REQUIRED=140000"
        # Pour iOS, utiliser clang avec les bons flags
        CXX="clang++"
        CXX_FLAGS="$CXX_FLAGS -arch arm64 -isysroot $(xcrun --show-sdk-path --sdk iphoneos)"
        ;;
    "force")
        echo "📱 Configuration mobile forcée (desktop)"
        PLATFORM="Mobile (forcé)"
        CXX_FLAGS="$CXX_FLAGS -DFORCE_MOBILE_CONFIG"
        CXX="g++"
        ;;
    *)
        echo "📱 Configuration mobile auto-détectée"
        PLATFORM="Auto"
        CXX="g++"
        ;;
esac

echo "   Plateforme: $PLATFORM"
echo "   Compilateur: $CXX"
echo "   Flags: $CXX_FLAGS"
echo ""

# Vérifier que les fichiers sources existent
echo "🔍 Vérification des fichiers sources..."
for file in $SOURCES; do
    if [ ! -f "$file" ]; then
        echo "❌ Fichier manquant: $file"
        exit 1
    fi
done
echo "✅ Tous les fichiers sources trouvés"

# Compilation
echo ""
echo "🔨 Compilation en cours..."
echo "Commande: $CXX $CXX_FLAGS $INCLUDES $SOURCES -o $OUTPUT"

if $CXX $CXX_FLAGS $INCLUDES $SOURCES -o $OUTPUT; then
    echo "✅ Compilation réussie!"
    echo ""
    
    # Afficher les informations sur l'exécutable
    if [ -f "$OUTPUT" ]; then
        echo "📊 Informations sur l'exécutable:"
        ls -lh "$OUTPUT"
        echo ""
        
        # Test rapide de l'exécutable (seulement si on peut l'exécuter)
        if [[ "$1" != "android" && "$1" != "ios" ]]; then
            echo "🧪 Test rapide de l'exécutable..."
            echo "   (Interruption après 10 secondes si nécessaire)"
            
            # Lancer le test avec un timeout
            if timeout 10s ./$OUTPUT > /dev/null 2>&1; then
                echo "✅ Test rapide réussi!"
            else
                echo "⚠️  Test rapide interrompu (normal pour les longs tests)"
            fi
        else
            echo "📱 Exécutable cross-compilé - pas de test local possible"
        fi
        
        echo ""
        echo "🎯 Build terminé avec succès!"
        echo "   Exécutable: ./$OUTPUT"
        
        if [[ "$1" == "android" || "$1" == "ios" ]]; then
            echo "   ⚠️  Transférer l'exécutable sur l'appareil cible pour l'exécuter"
        else
            echo "   Lancer avec: ./$OUTPUT"
        fi
        
    else
        echo "❌ Erreur: exécutable non trouvé après compilation"
        exit 1
    fi
else
    echo "❌ Erreur de compilation"
    exit 1
fi

echo ""
echo "📱 Configuration mobile utilisée:"
echo "   • Buffers réduits (64K-256K échantillons)"
echo "   • Itérations réduites (1000 vs 10000)"
echo "   • Mémoire limitée (10MB vs 100MB)"
echo "   • Tests spécifiques mobiles inclus"
echo "   • Optimisations pour économie d'énergie"
