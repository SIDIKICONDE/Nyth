#!/bin/bash

# Script de test pour les vérifications de namespaces
# Crée des fichiers de test avec différents scénarios

set -e

echo "🧪 Test des vérifications de namespaces..."

# Créer un répertoire de test
TEST_DIR="test_namespace_verification"
mkdir -p "$TEST_DIR"

# Créer un fichier de test valide
cat > "$TEST_DIR/ValidModule.h" << 'EOF'
#pragma once

namespace facebook {
namespace react {

// Using declarations pour les types fréquemment utilisés du namespace Nyth::Audio
using Nyth::Audio::SafetyConfig;
using Nyth::Audio::SafetyError;
using Nyth::Audio::SafetyState;

class ValidModule {
public:
    explicit ValidModule();
    ~ValidModule() override;

    jsi::Value process(jsi::Runtime& rt);

private:
    SafetyConfig config_;
    SafetyState currentState_;
};

} // namespace react
} // namespace facebook
EOF

# Créer un fichier de test invalide
cat > "$TEST_DIR/InvalidModule.h" << 'EOF'
#pragma once

namespace facebook {
namespace react {

class InvalidModule {
public:
    explicit InvalidModule();

private:
    // Erreur : pas de using declarations
    Nyth::Audio::SafetyConfig config_;  // Erreur : référence longue
    Nyth::Audio::SafetyState currentState_;  // Erreur : référence longue
};

} // namespace react
} // namespace facebook
EOF

echo "📁 Fichiers de test créés"

# Tester le script de vérification sur les fichiers de test
echo ""
echo "🧪 Test du script de vérification..."

# Copier le script de vérification dans le répertoire de test
cp scripts/verify_namespaces.sh "$TEST_DIR/"

# Modifier le script pour tester nos fichiers
sed -i 's|shared/Audio/|test_namespace_verification/|g' "$TEST_DIR/verify_namespaces.sh"

# Ajouter nos fichiers de test à la liste
sed -i 's|)$|    "test_namespace_verification/ValidModule.h"\n)|' "$TEST_DIR/verify_namespaces.sh"
sed -i 's|)$|    "test_namespace_verification/InvalidModule.h"\n)|' "$TEST_DIR/verify_namespaces.sh"

# Exécuter le test
cd "$TEST_DIR"
chmod +x verify_namespaces.sh
./verify_namespaces.sh

TEST_RESULT=$?
cd ..

# Nettoyer
rm -rf "$TEST_DIR"

if [[ $TEST_RESULT -eq 1 ]]; then
    echo ""
    echo "🎉 Test réussi ! Le script détecte correctement les erreurs de namespaces."
    exit 0
else
    echo ""
    echo "❌ Test échoué ! Le script n'a pas détecté les erreurs attendues."
    exit 1
fi
