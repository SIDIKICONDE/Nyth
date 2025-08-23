#!/bin/bash

# Script de recompilation pour Android avec les modules natifs
# Usage: ./rebuild-android.sh

echo "🔧 Recompilation de l'application Android avec les modules natifs..."
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages de succès
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Fonction pour afficher les messages d'erreur
error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Fonction pour afficher les messages d'avertissement
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    error "Ce script doit être exécuté depuis la racine du projet React Native"
fi

# Étape 1: Nettoyer le cache Metro
echo "📦 Étape 1: Nettoyage du cache Metro..."
npx react-native start --reset-cache &
METRO_PID=$!
sleep 3
kill $METRO_PID 2>/dev/null
success "Cache Metro nettoyé"
echo ""

# Étape 2: Nettoyer le build Android
echo "🧹 Étape 2: Nettoyage du build Android..."
cd android || error "Impossible d'accéder au dossier android"

# Nettoyer Gradle
./gradlew clean
if [ $? -eq 0 ]; then
    success "Build Android nettoyé"
else
    error "Échec du nettoyage du build Android"
fi
echo ""

# Étape 3: Supprimer les dossiers de build
echo "🗑️  Étape 3: Suppression des dossiers de build..."
rm -rf app/build
rm -rf build
rm -rf .gradle
success "Dossiers de build supprimés"
echo ""

# Étape 4: Recompiler les modules natifs C++
echo "🔨 Étape 4: Compilation des modules natifs C++..."
./gradlew :app:externalNativeBuildDebug
if [ $? -eq 0 ]; then
    success "Modules natifs C++ compilés"
else
    warning "La compilation des modules natifs a peut-être échoué, vérifiez les logs"
fi
echo ""

# Étape 5: Assembler l'APK de debug
echo "📱 Étape 5: Construction de l'APK de debug..."
./gradlew assembleDebug
if [ $? -eq 0 ]; then
    success "APK de debug construit avec succès"
    
    # Afficher la taille de l'APK
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
    if [ -f "$APK_PATH" ]; then
        APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
        echo "   📊 Taille de l'APK: $APK_SIZE"
    fi
else
    error "Échec de la construction de l'APK"
fi
echo ""

# Revenir au répertoire racine
cd ..

# Étape 6: Vérifier les modules natifs compilés
echo "🔍 Étape 6: Vérification des modules natifs compilés..."
if [ -f "android/app/build/intermediates/cxx/Debug/*/obj/arm64-v8a/libappmodules.so" ]; then
    success "Bibliothèque native libappmodules.so trouvée pour arm64-v8a"
    
    # Afficher la taille de la bibliothèque
    LIB_SIZE=$(find android/app/build/intermediates/cxx -name "libappmodules.so" -exec du -h {} \; | head -1 | cut -f1)
    echo "   📊 Taille de la bibliothèque native: $LIB_SIZE"
else
    warning "Bibliothèque native non trouvée, les modules pourraient ne pas être disponibles"
fi
echo ""

# Étape 7: Installer l'APK sur le dispositif
echo "📲 Étape 7: Installation de l'APK..."
read -p "Voulez-vous installer l'APK sur un dispositif connecté? (o/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Oo]$ ]]; then
    # Vérifier si un dispositif est connecté
    DEVICE_COUNT=$(adb devices | grep -c "device$")
    
    if [ $DEVICE_COUNT -eq 0 ]; then
        warning "Aucun dispositif Android connecté"
        echo "   Connectez un dispositif ou démarrez un émulateur et réessayez"
    else
        echo "   Installation en cours..."
        npx react-native run-android
        
        if [ $? -eq 0 ]; then
            success "Application installée et lancée"
        else
            error "Échec de l'installation"
        fi
    fi
fi
echo ""

# Résumé
echo "════════════════════════════════════════════════════════"
echo "                    📋 RÉSUMÉ"
echo "════════════════════════════════════════════════════════"
success "Recompilation terminée!"
echo ""
echo "Pour tester les modules natifs:"
echo "1. Lancez l'application: npx react-native run-android"
echo "2. Importez le composant de test dans votre App.tsx:"
echo "   import TestNativeModules from './src/screens/TestNativeModules';"
echo "3. Ajoutez <TestNativeModules /> dans votre rendu"
echo ""
echo "Si les modules ne sont toujours pas disponibles:"
echo "• Vérifiez les logs de compilation pour des erreurs C++"
echo "• Assurez-vous que le NDK est correctement installé"
echo "• Vérifiez que les chemins dans CMakeLists.txt sont corrects"
echo "════════════════════════════════════════════════════════"