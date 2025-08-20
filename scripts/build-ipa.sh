#!/bin/bash

# Script pour créer un IPA de l'application Nyth
# Utilisation: ./scripts/build-ipa.sh [configuration]

set -e

# Configuration par défaut
CONFIGURATION=${1:-"Release"}
SCHEME="Nyth"
WORKSPACE="ios/Nyth.xcworkspace"
ARCHIVE_PATH="build/Nyth.xcarchive"
EXPORT_PATH="build/ipa"
EXPORT_OPTIONS_PLIST="ios/ExportOptions.plist"

echo "🚀 Début de la création de l'IPA pour Nyth..."
echo "📱 Configuration: $CONFIGURATION"
echo "🏗️  Schéma: $SCHEME"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

# Vérifier que Xcode est installé
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Erreur: Xcode n'est pas installé ou xcodebuild n'est pas dans le PATH"
    exit 1
fi

# Créer le répertoire de build s'il n'existe pas
mkdir -p build

# Nettoyer les builds précédents
echo "🧹 Nettoyage des builds précédents..."
xcodebuild clean -workspace "$WORKSPACE" -scheme "$SCHEME" -configuration "$CONFIGURATION"

# Archiver le projet
echo "📦 Archivage du projet..."
xcodebuild archive \
    -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration "$CONFIGURATION" \
    -archivePath "$ARCHIVE_PATH" \
    -destination "generic/platform=iOS" \
    -allowProvisioningUpdates

# Vérifier que l'archive a été créée
if [ ! -d "$ARCHIVE_PATH" ]; then
    echo "❌ Erreur: L'archive n'a pas été créée"
    exit 1
fi

echo "✅ Archive créée avec succès: $ARCHIVE_PATH"

# Créer le répertoire d'export
mkdir -p "$EXPORT_PATH"

# Exporter l'IPA
echo "📤 Export de l'IPA..."
xcodebuild -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportPath "$EXPORT_PATH" \
    -exportOptionsPlist "$EXPORT_OPTIONS_PLIST" \
    -allowProvisioningUpdates

# Vérifier que l'IPA a été créé
IPA_FILE=$(find "$EXPORT_PATH" -name "*.ipa" | head -1)
if [ -z "$IPA_FILE" ]; then
    echo "❌ Erreur: L'IPA n'a pas été créé"
    exit 1
fi

echo "🎉 IPA créé avec succès!"
echo "📁 Emplacement: $IPA_FILE"
echo "📊 Taille: $(du -h "$IPA_FILE" | cut -f1)"

# Afficher les informations de l'IPA
echo ""
echo "📋 Informations de l'IPA:"
unzip -l "$IPA_FILE" | head -20

echo ""
echo "✨ Processus terminé avec succès!"
