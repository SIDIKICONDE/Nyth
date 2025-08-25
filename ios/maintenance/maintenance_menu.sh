#!/bin/bash

# Menu principal de maintenance iOS
# Interface interactive pour tous les scripts de maintenance

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Fonctions
show_header() {
    clear
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                 🛠️  MAINTENANCE iOS                     ║"
    echo "║                 Projet Nyth - React Native                   ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
}

show_menu() {
    echo -e "${CYAN}📋 SCRIPTS DE MAINTENANCE DISPONIBLES:${NC}"
    echo ""
    echo -e "${GREEN}1)${NC} 🧹 Nettoyer les caches et données temporaires"
    echo -e "${GREEN}2)${NC} 🔍 Diagnostiquer l'état du projet"
    echo -e "${GREEN}3)${NC} 💾 Créer une sauvegarde complète"
    echo -e "${GREEN}4)${NC} 🔄 Mettre à jour les dépendances CocoaPods"
    echo -e "${GREEN}5)${NC} 📊 Monitorer les performances"
    echo ""
    echo -e "${BLUE}GESTION DES MODULES SHARED:${NC}"
    echo -e "${GREEN}6)${NC} ➕ Ajouter tous les modules shared/"
    echo -e "${GREEN}7)${NC} ➖ Supprimer tous les modules shared/"
    echo -e "${GREEN}8)${NC} 📋 Voir l'état des modules shared/"
    echo ""
    echo -e "${YELLOW}COMMANDES MAKE:${NC}"
    echo -e "${GREEN}9)${NC} 📖 Afficher l'aide Make"
    echo -e "${GREEN}10)${NC} 🎬 Voir la démonstration Make"
    echo ""
    echo -e "${RED}q)${NC} 🚪 Quitter"
    echo ""
}

execute_script() {
    local script="$1"
    local description="$2"

    echo ""
    echo -e "${BLUE}▶️  $description${NC}"
    echo -e "${YELLOW}Script: $script${NC}"
    echo ""

    # Demander confirmation
    read -p "Voulez-vous continuer ? [y/N] " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ -f "$script" ]; then
            echo -e "${GREEN}▶️  Exécution en cours...${NC}"
            echo "-----------------------------------"
            bash "$script"
            echo "-----------------------------------"
            echo -e "${GREEN}✅ Exécution terminée${NC}"
        else
            echo -e "${RED}❌ Script non trouvé: $script${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Opération annulée${NC}"
    fi

    echo ""
    read -p "Appuyez sur Entrée pour continuer..."
}

make_command() {
    local command="$1"
    local description="$2"

    echo ""
    echo -e "${BLUE}▶️  $description${NC}"
    echo -e "${YELLOW}Commande: make $command${NC}"
    echo ""

    read -p "Voulez-vous continuer ? [y/N] " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}▶️  Exécution en cours...${NC}"
        echo "-----------------------------------"
        make "$command"
        echo "-----------------------------------"
        echo -e "${GREEN}✅ Exécution terminée${NC}"
    else
        echo -e "${YELLOW}⚠️  Opération annulée${NC}"
    fi

    echo ""
    read -p "Appuyez sur Entrée pour continuer..."
}

show_shared_status() {
    echo ""
    echo -e "${BLUE}📊 ÉTAT DES MODULES SHARED/${NC}"
    echo "=================================="

    # Vérifier le dossier shared
    if [ -d "../shared" ]; then
        echo -e "${GREEN}✅ Dossier shared/ trouvé${NC}"

        # Compter les fichiers
        cpp_files=$(find ../shared -name "*.cpp" -o -name "*.c" -o -name "*.mm" | wc -l | tr -d ' ')
        hpp_files=$(find ../shared -name "*.hpp" -o -name "*.h" | wc -l | tr -d ' ')

        echo "   🔧 Fichiers C/C++/Obj-C: $cpp_files"
        echo "   📄 Fichiers headers: $hpp_files"
        echo "   📊 Total: $((cpp_files + hpp_files)) fichiers"

        # Modules présents
        echo ""
        echo "📦 Modules disponibles:"
        for module in "Audio" "Videos"; do
            if [ -d "../shared/$module" ]; then
                module_files=$(find ../shared/$module -name "*.cpp" -o -name "*.hpp" | wc -l | tr -d ' ')
                echo -e "   ${GREEN}✅ $module${NC} ($module_files fichiers)"
            else
                echo -e "   ${RED}❌ $module${NC} (manquant)"
            fi
        done
    else
        echo -e "${RED}❌ Dossier shared/ non trouvé${NC}"
    fi

    # État dans le projet Xcode
    echo ""
    echo "📱 Dans le projet Xcode:"
    if grep -q "shared" Nyth.xcodeproj/project.pbxproj 2>/dev/null; then
        shared_refs=$(grep -c "shared" Nyth.xcodeproj/project.pbxproj 2>/dev/null || echo "0")
        echo -e "${GREEN}✅ Modules shared présents${NC} ($shared_refs références)"
    else
        echo -e "${YELLOW}⚠️  Aucun module shared dans le projet${NC}"
    fi

    # Sauvegardes
    echo ""
    echo "💾 Sauvegardes:"
    backup_count=$(ls -1 Nyth.xcodeproj/project.pbxproj.backup_* 2>/dev/null | wc -l | tr -d ' ')
    echo "   📋 Sauvegardes disponibles: $backup_count"

    echo ""
    read -p "Appuyez sur Entrée pour continuer..."
}

# Boucle principale
while true; do
    show_header
    show_menu

    read -p "Choisissez une option (1-10, q pour quitter): " -n 1 -r choice
    echo ""

    case $choice in
        1)
            execute_script "maintenance/clean_cache.sh" "Nettoyage complet des caches"
            ;;
        2)
            execute_script "maintenance/check_project.sh" "Diagnostic du projet"
            ;;
        3)
            execute_script "maintenance/backup_project.sh" "Sauvegarde complète"
            ;;
        4)
            execute_script "maintenance/update_dependencies.sh" "Mise à jour des dépendances"
            ;;
        5)
            execute_script "maintenance/monitor_performance.sh" "Monitoring des performances"
            ;;
        6)
            make_command "add-shared" "Ajout des modules shared/"
            ;;
        7)
            make_command "remove-shared" "Suppression des modules shared/"
            ;;
        8)
            show_shared_status
            ;;
        9)
            make_command "help" "Affichage de l'aide Make"
            ;;
        10)
            make_command "demo" "Démonstration des scripts"
            ;;
        q|Q)
            echo ""
            echo -e "${GREEN}👋 Au revoir !${NC}"
            echo ""
            exit 0
            ;;
        *)
            echo ""
            echo -e "${RED}❌ Option invalide${NC}"
            echo ""
            read -p "Appuyez sur Entrée pour continuer..."
            ;;
    esac
done
