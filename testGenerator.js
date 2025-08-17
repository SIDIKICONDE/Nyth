#!/bin/bash

# Script d'installation automatique pour le générateur d'icônes NYTH
# Usage: ./setup.sh

set -e  # Arrêter en cas d'erreur

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
print_header() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}🚀 GÉNÉRATEUR D'ICÔNES NYTH - INSTALLATION${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

print_step() {
    echo -e "${YELLOW}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}💡 $1${NC}"
}

# Vérification de Node.js
check_nodejs() {
    print_step "Vérification de Node.js..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        
        if [ "$MAJOR_VERSION" -ge 14 ]; then
            print_success "Node.js $NODE_VERSION détecté"
            return 0
        else
            print_error "Node.js $NODE_VERSION est trop ancien (requis: v14+)"
            return 1
        fi
    else
        print_error "Node.js n'est pas installé"
        print_info "Téléchargez Node.js depuis: https://nodejs.org"
        return 1
    fi
}

# Vérification de npm
check_npm() {
    print_step "Vérification de npm..."
    
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm $NPM_VERSION détecté"
        return 0
    else
        print_error "npm n'est pas installé"
        return 1
    fi
}

# Installation des dépendances
install_dependencies() {
    print_step "Installation des dépendances..."
    
    if [ ! -f "package.json" ]; then
        print_info "Création du package.json..."
        cat > package.json << 'EOF'
{
  "name": "nyth-icon-generator",
  "version": "1.0.0",
  "description": "Générateur automatique d'icônes NYTH pour iOS, Android et Web",
  "main": "generateIcons.js",
  "scripts": {
    "generate": "node generateIcons.js",
    "test": "node testGenerator.js",
    "install-deps": "npm install sharp fs-extra",
    "clean": "rm -rf icons test-icons",
    "build": "npm run clean && npm run generate"
  },
  "dependencies": {
    "sharp": "^0.32.6",
    "fs-extra": "^11.2.0"
  },
  "keywords": [
    "icon",
    "generator",
    "ios",
    "android",
    "mobile",
    "nyth"
  ],
  "author": "NYTH Team",
  "license": "MIT",
  "engines": {
    "node": ">=14.0.0"
  }
}
EOF
        print_success "package.json créé"
    fi
    
    print_info "Installation de sharp et fs-extra..."
    if npm install; then
        print_success "Dépendances installées avec succès"
        return 0
    else
        print_error "Échec de l'installation des dépendances"
        return 1
    fi
}

# Vérification des fichiers requis
check_files() {
	print_step "Vérification des fichiers requis..."

	local all_files_present=0

	if [ ! -f "generateIcons.js" ]; then
		print_error "generateIcons.js manquant"
		all_files_present=1
	else
		print_success "generateIcons.js trouvé"
	fi

	if [ ! -f "testGenerator.js" ]; then
		print_error "testGenerator.js manquant (optionnel)"
		print_info "Le fichier de test n'est pas obligatoire mais recommandé"
	else
		print_success "testGenerator.js trouvé"
	fi

	return $all_files_present
}

# Test de fonctionnement
run_tests() {
    print_step "Exécution des tests..."
    print_info "Test de génération d'une icône simple..."

    # Test simple avec Node.js (sharp)
    node -e "
    const sharp = require('sharp');
    const svg = '<svg width=\"64\" height=\"64\"><rect width=\"64\" height=\"64\" fill=\"#4A90E2\"/></svg>';
    sharp(Buffer.from(svg))
      .png()
      .toBuffer()
      .then(() => console.log('✅ Test sharp réussi'))
      .catch((err) => { console.error('❌ Test sharp échoué:', err.message); process.exit(1); });
    " && print_success "Test de génération basique réussi"
}

# Génération d'exemple
generate_sample() {
    print_step "Génération d'icônes d'exemple..."
    
    if node generateIcons.js; then
        print_success "Icônes d'exemple générées dans ./icons/"
        print_info "Vérifiez le dossier ./icons/ pour voir le résultat"
        return 0
    else
        print_error "Échec de la génération d'exemple"
        return 1
    fi
}

# Affichage du résumé final
show_summary() {
    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}🎉 INSTALLATION TERMINÉE AVEC SUCCÈS !${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo -e "${YELLOW}📋 Commandes disponibles :${NC}"
    echo -e "${BLUE}  npm run generate${NC}    - Générer toutes les icônes"
    echo -e "${BLUE}  npm run test${NC}        - Lancer les tests"
    echo -e "${BLUE}  npm run clean${NC}       - Nettoyer les fichiers générés"
    echo -e "${BLUE}  npm run build${NC}       - Nettoyer et regénérer"
    echo ""
    echo -e "${YELLOW}📁 Structure générée :${NC}"
    echo -e "${BLUE}  icons/ios/AppIcon.appiconset/${NC}  - Icônes iOS"
    echo -e "${BLUE}  icons/android/drawable-*/${NC}      - Icônes Android"
    echo -e "${BLUE}  icons/web/${NC}                     - Icônes Web/PWA"
    echo ""
    echo -e "${YELLOW}🎨 Personnalisation :${NC}"
    echo -e "${BLUE}  Éditez les couleurs dans generateIcons.js${NC}"
    echo -e "${BLUE}  Modifiez le SVG pour changer le design${NC}"
    echo ""
    echo -e "${GREEN}✨ Votre générateur d'icônes NYTH est prêt !${NC}"
    echo ""
}

# Fonction principale
main() {
    print_header
    
    # Vérifications préliminaires
    if ! check_nodejs; then
        exit 1
    fi
    
    if ! check_npm; then
        exit 1
    fi
    
    if ! check_files; then
        print_error "Fichiers manquants. Assurez-vous que generateIcons.js est présent."
        exit 1
    fi
    
    # Installation
    if ! install_dependencies; then
        exit 1
    fi
    
    # Tests
    if ! run_tests; then
        print_error "Les tests ont échoué, mais l'installation peut quand même fonctionner"
        print_info "Essayez de générer les icônes manuellement avec: npm run generate"
    fi
    
    # Génération d'exemple
    print_step "Voulez-vous générer des icônes d'exemple maintenant ? (y/N)"
    read -r generate_now
    
    if [[ $generate_now =~ ^[Yy]$ ]]; then
        generate_sample
    else
        print_info "Vous pouvez générer les icônes plus tard avec: npm run generate"
    fi
    
    show_summary
}

# Gestion des signaux
trap 'print_error "Installation interrompue"; exit 1' INT TERM

# Lancement du script principal
main "$@"