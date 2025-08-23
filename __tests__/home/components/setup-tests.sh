#!/bin/bash

# Script de setup pour les tests HamburgerMenu
# Ce script configure l'environnement de test et vérifie les dépendances

set -e

echo "🚀 Setup des tests HamburgerMenu"
echo "================================"

# Vérifier que Jest est installé
if ! command -v jest &> /dev/null; then
    echo "❌ Jest n'est pas installé"
    echo "💡 Installez Jest: npm install --save-dev jest"
    exit 1
fi

# Vérifier les dépendances React Native
echo "📦 Vérification des dépendances..."

if [ ! -f "node_modules/react-native/package.json" ]; then
    echo "❌ react-native n'est pas installé"
    exit 1
fi

if [ ! -f "node_modules/@testing-library/react-native/package.json" ]; then
    echo "❌ @testing-library/react-native n'est pas installé"
    exit 1
fi

# Créer les dossiers nécessaires
echo "📁 Création des dossiers..."
mkdir -p reports
mkdir -p coverage

# Donner les permissions d'exécution aux scripts
echo "🔧 Configuration des permissions..."
chmod +x run-hamburger-tests.js
chmod +x check-coverage.js
chmod +x generate-report.js

# Vérifier la configuration Jest
echo "⚙️  Vérification de la configuration Jest..."
if [ -f "jest.config.js" ]; then
    echo "✅ Configuration Jest trouvée"
else
    echo "⚠️  Configuration Jest non trouvée"
fi

# Vérifier les fichiers de test
echo "🧪 Vérification des fichiers de test..."
test_files=(
    "HamburgerMenu.test.tsx"
    "HamburgerMenu.integration.test.tsx"
    "HamburgerMenu.setup.js"
)

for file in "${test_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file manquant"
    fi
done

echo ""
echo "🎉 Setup terminé !"
echo ""
echo "📋 Commandes disponibles:"
echo "  npm run test:unit        # Tests unitaires"
echo "  npm run test:integration # Tests d'intégration"
echo "  npm run test:coverage    # Tests avec couverture"
echo "  npm run coverage:check   # Vérifier la couverture"
echo "  npm run report           # Générer un rapport"
echo ""
echo "📊 Exécutez un test rapide:"
echo "  node run-hamburger-tests.js unit"
