#!/bin/bash

# Script de nettoyage complet pour le projet Nyth
# Usage: ./scripts/clean-cache.sh [--all] [--ios] [--android] [--metro] [--watchman] [--npm]

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLEAN_ALL=false
CLEAN_IOS=false
CLEAN_ANDROID=false
CLEAN_METRO=false
CLEAN_WATCHMAN=false
CLEAN_NPM=false

# Fonction d'aide
show_help() {
    echo -e "${BLUE}🧹 Script de nettoyage du cache pour Nyth${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --all       Nettoyer tous les caches (recommandé)"
    echo "  --ios       Nettoyer le cache iOS uniquement"
    echo "  --android   Nettoyer le cache Android uniquement"
    echo "  --metro     Nettoyer le cache Metro uniquement"
    echo "  --watchman  Nettoyer le cache Watchman uniquement"
    echo "  --npm       Nettoyer le cache NPM uniquement"
    echo "  --help      Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  $0 --all           # Nettoyer tout"
    echo "  $0 --ios --metro   # Nettoyer iOS et Metro"
    echo ""
}

# Fonction de nettoyage du cache Metro
clean_metro() {
    echo -e "${YELLOW}📱 Nettoyage du cache Metro...${NC}"
    
    # Arrêter Metro s'il tourne
    pkill -f "react-native start" 2>/dev/null || echo "Metro n'était pas en cours d'exécution"
    
    # Nettoyer les caches Metro
    rm -rf "$PROJECT_ROOT/metro-cache" 2>/dev/null || true
    rm -rf "$PROJECT_ROOT/.metro" 2>/dev/null || true
    rm -rf /tmp/metro-* 2>/dev/null || true
    rm -rf /tmp/react-native-* 2>/dev/null || true
    
    echo -e "${GREEN}✅ Cache Metro nettoyé${NC}"
}

# Fonction de nettoyage du cache iOS
clean_ios() {
    echo -e "${YELLOW}🍎 Nettoyage du cache iOS...${NC}"
    
    # Nettoyer les caches iOS
    rm -rf "$PROJECT_ROOT/ios/build" 2>/dev/null || true
    rm -rf "$PROJECT_ROOT/ios/DerivedData" 2>/dev/null || true
    rm -rf "$PROJECT_ROOT/ios/Pods" 2>/dev/null || true
    rm -rf "$PROJECT_ROOT/ios/Podfile.lock" 2>/dev/null || true
    
    # Nettoyer les caches Xcode
    rm -rf ~/Library/Developer/Xcode/DerivedData 2>/dev/null || true
    rm -rf ~/Library/Caches/com.apple.dt.Xcode 2>/dev/null || true
    
    echo -e "${GREEN}✅ Cache iOS nettoyé${NC}"
}

# Fonction de nettoyage du cache Android
clean_android() {
    echo -e "${YELLOW}🤖 Nettoyage du cache Android...${NC}"
    
    # Nettoyer les caches Android
    rm -rf "$PROJECT_ROOT/android/app/build" 2>/dev/null || true
    rm -rf "$PROJECT_ROOT/android/.gradle" 2>/dev/null || true
    rm -rf "$PROJECT_ROOT/android/build" 2>/dev/null || true
    
    # Nettoyer les caches Gradle
    rm -rf ~/.gradle/caches 2>/dev/null || true
    rm -rf ~/.android/build-cache 2>/dev/null || true
    
    echo -e "${GREEN}✅ Cache Android nettoyé${NC}"
}

# Fonction de nettoyage du cache Watchman
clean_watchman() {
    echo -e "${YELLOW}👀 Nettoyage du cache Watchman...${NC}"
    
    # Arrêter Watchman
    watchman watch-del-all 2>/dev/null || echo "Watchman n'était pas en cours d'exécution"
    
    # Nettoyer les caches Watchman
    rm -rf /usr/local/var/run/watchman 2>/dev/null || true
    rm -rf ~/.watchman 2>/dev/null || true
    
    echo -e "${GREEN}✅ Cache Watchman nettoyé${NC}"
}

# Fonction de nettoyage du cache NPM
clean_npm() {
    echo -e "${YELLOW}📦 Nettoyage du cache NPM...${NC}"
    
    # Nettoyer les caches NPM
    rm -rf "$PROJECT_ROOT/node_modules/.cache" 2>/dev/null || true
    rm -rf "$PROJECT_ROOT/node_modules" 2>/dev/null || true
    rm -rf "$PROJECT_ROOT/package-lock.json" 2>/dev/null || true
    
    # Nettoyer le cache global NPM
    npm cache clean --force 2>/dev/null || true
    
    # Nettoyer le cache du serveur
    if [ -d "$PROJECT_ROOT/server" ]; then
        rm -rf "$PROJECT_ROOT/server/node_modules/.cache" 2>/dev/null || true
        rm -rf "$PROJECT_ROOT/server/node_modules" 2>/dev/null || true
        rm -rf "$PROJECT_ROOT/server/package-lock.json" 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ Cache NPM nettoyé${NC}"
}

# Fonction de nettoyage des fichiers temporaires
clean_temp() {
    echo -e "${YELLOW}🗑️  Nettoyage des fichiers temporaires...${NC}"
    
    # Nettoyer les fichiers temporaires du projet
    rm -rf "$PROJECT_ROOT/.bundle" 2>/dev/null || true
    rm -rf "$PROJECT_ROOT/build" 2>/dev/null || true
    rm -rf "$PROJECT_ROOT/dist" 2>/dev/null || true
    rm -rf "$PROJECT_ROOT/coverage" 2>/dev/null || true
    
    # Nettoyer les logs
    rm -f "$PROJECT_ROOT/server/server.log" 2>/dev/null || true
    rm -f "$PROJECT_ROOT/server/server.pid" 2>/dev/null || true
    
    echo -e "${GREEN}✅ Fichiers temporaires nettoyés${NC}"
}

# Fonction de réinstallation des dépendances
reinstall_deps() {
    echo -e "${YELLOW}📥 Réinstallation des dépendances...${NC}"
    
    # Installer les dépendances du client
    npm install
    
    # Installer les dépendances du serveur si il existe
    if [ -d "$PROJECT_ROOT/server" ]; then
        cd "$PROJECT_ROOT/server" && npm install && cd "$PROJECT_ROOT"
    fi
    
    # Installer les pods iOS
    if [ -d "$PROJECT_ROOT/ios" ]; then
        cd "$PROJECT_ROOT/ios" && pod install --repo-update && cd "$PROJECT_ROOT"
    fi
    
    echo -e "${GREEN}✅ Dépendances réinstallées${NC}"
}

# Traitement des arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --all)
            CLEAN_ALL=true
            shift
            ;;
        --ios)
            CLEAN_IOS=true
            shift
            ;;
        --android)
            CLEAN_ANDROID=true
            shift
            ;;
        --metro)
            CLEAN_METRO=true
            shift
            ;;
        --watchman)
            CLEAN_WATCHMAN=true
            shift
            ;;
        --npm)
            CLEAN_NPM=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Option inconnue: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Si aucune option n'est spécifiée, nettoyer tout
if [ "$CLEAN_ALL" = false ] && [ "$CLEAN_IOS" = false ] && [ "$CLEAN_ANDROID" = false ] && [ "$CLEAN_METRO" = false ] && [ "$CLEAN_WATCHMAN" = false ] && [ "$CLEAN_NPM" = false ]; then
    CLEAN_ALL=true
fi

# Début du nettoyage
echo -e "${BLUE}🚀 Début du nettoyage du cache pour Nyth...${NC}"
echo ""

# Exécuter les nettoyages demandés
if [ "$CLEAN_ALL" = true ] || [ "$CLEAN_METRO" = true ]; then
    clean_metro
fi

if [ "$CLEAN_ALL" = true ] || [ "$CLEAN_IOS" = true ]; then
    clean_ios
fi

if [ "$CLEAN_ALL" = true ] || [ "$CLEAN_ANDROID" = true ]; then
    clean_android
fi

if [ "$CLEAN_ALL" = true ] || [ "$CLEAN_WATCHMAN" = true ]; then
    clean_watchman
fi

if [ "$CLEAN_ALL" = true ] || [ "$CLEAN_NPM" = true ]; then
    clean_npm
fi

if [ "$CLEAN_ALL" = true ]; then
    clean_temp
fi

echo ""
echo -e "${GREEN}🎉 Nettoyage terminé avec succès !${NC}"

# Demander si l'utilisateur veut réinstaller les dépendances
if [ "$CLEAN_NPM" = true ] || [ "$CLEAN_ALL" = true ]; then
    echo ""
    read -p "Voulez-vous réinstaller les dépendances maintenant ? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        reinstall_deps
    else
        echo -e "${YELLOW}💡 Pour réinstaller les dépendances plus tard, exécutez:${NC}"
        echo "  npm install"
        if [ -d "$PROJECT_ROOT/server" ]; then
            echo "  cd server && npm install"
        fi
        if [ -d "$PROJECT_ROOT/ios" ]; then
            echo "  cd ios && pod install"
        fi
    fi
fi

echo ""
echo -e "${BLUE}✨ Votre projet est maintenant propre et prêt à être utilisé !${NC}"
