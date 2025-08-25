#!/bin/bash

# Lanceur principal pour les scripts de maintenance iOS
# Point d'entrée unique pour tous les outils de maintenance

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Vérifier si on est dans le bon répertoire
if [ ! -d "maintenance" ]; then
    echo -e "${RED}❌ Dossier maintenance/ non trouvé${NC}"
    echo "   Assurez-vous d'être dans le répertoire ios/"
    echo "   cd ios && ./maintenance.sh"
    exit 1
fi

# Vérifier si le script existe
if [ ! -f "maintenance/maintenance_menu.sh" ]; then
    echo -e "${RED}❌ Script de menu non trouvé${NC}"
    echo "   maintenance/maintenance_menu.sh manquant"
    exit 1
fi

# Lancer le menu principal
echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                 🛠️  MAINTENANCE iOS                     ║"
echo "║                 Projet Nyth - React Native                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${BLUE}▶️  Lancement du menu de maintenance...${NC}"
echo ""

bash maintenance/maintenance_menu.sh
