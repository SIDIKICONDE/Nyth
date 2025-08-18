#!/bin/bash

# Script de vérification de l'état du cache pour Nyth
# Usage: ./scripts/cache-status.sh

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}🔍 État du cache pour Nyth${NC}"
echo ""

# Fonction pour afficher la taille d'un répertoire
show_size() {
    local path="$1"
    local label="$2"
    
    if [ -d "$path" ]; then
        local size=$(du -sh "$path" 2>/dev/null | cut -f1)
        echo -e "  ${label}: ${GREEN}${size}${NC}"
    else
        echo -e "  ${label}: ${RED}N'existe pas${NC}"
    fi
}

# Fonction pour vérifier l'espace disque
check_disk_space() {
    echo -e "${BLUE}💾 Espace disque disponible:${NC}"
    df -h . | tail -1 | awk '{print "  " $4 " disponible sur " $2 " total"}'
    echo ""
}

# Fonction pour vérifier les processus en cours
check_processes() {
    echo -e "${BLUE}🔄 Processus en cours:${NC}"
    
    local metro_running=$(pgrep -f "react-native start" | wc -l)
    local server_running=$(pgrep -f "node index.js" | wc -l)
    
    if [ "$metro_running" -gt 0 ]; then
        echo -e "  Metro: ${GREEN}En cours d'exécution${NC}"
    else
        echo -e "  Metro: ${RED}Arrêté${NC}"
    fi
    
    if [ "$server_running" -gt 0 ]; then
        echo -e "  Serveur: ${GREEN}En cours d'exécution${NC}"
    else
        echo -e "  Serveur: ${RED}Arrêté${NC}"
    fi
    echo ""
}

# Fonction pour vérifier l'état de Watchman
check_watchman() {
    echo -e "${BLUE}👀 État de Watchman:${NC}"
    
    if command -v watchman >/dev/null 2>&1; then
        local watch_count=$(watchman watch-list 2>/dev/null | grep -c "Nyth" || echo "0")
        if [ "$watch_count" -gt 0 ]; then
            echo -e "  Watchman: ${GREEN}Actif (${watch_count} répertoires surveillés)${NC}"
        else
            echo -e "  Watchman: ${YELLOW}Installé mais inactif${NC}"
        fi
    else
        echo -e "  Watchman: ${RED}Non installé${NC}"
    fi
    echo ""
}

# Fonction pour vérifier les caches principaux
check_main_caches() {
    echo -e "${BLUE}📁 Caches principaux:${NC}"
    
    show_size "$PROJECT_ROOT/node_modules" "node_modules"
    show_size "$PROJECT_ROOT/metro-cache" "metro-cache"
    show_size "$PROJECT_ROOT/.metro" ".metro"
    show_size "$PROJECT_ROOT/.bundle" ".bundle"
    show_size "$PROJECT_ROOT/build" "build"
    
    if [ -d "$PROJECT_ROOT/server" ]; then
        show_size "$PROJECT_ROOT/server/node_modules" "server/node_modules"
    fi
    echo ""
}

# Fonction pour vérifier les caches iOS
check_ios_caches() {
    echo -e "${BLUE}🍎 Caches iOS:${NC}"
    
    show_size "$PROJECT_ROOT/ios/build" "ios/build"
    show_size "$PROJECT_ROOT/ios/DerivedData" "ios/DerivedData"
    show_size "$PROJECT_ROOT/ios/Pods" "ios/Pods"
    
    # Caches Xcode globaux
    local xcode_derived=$(du -sh ~/Library/Developer/Xcode/DerivedData 2>/dev/null | cut -f1 || echo "0B")
    local xcode_cache=$(du -sh ~/Library/Caches/com.apple.dt.Xcode 2>/dev/null | cut -f1 || echo "0B")
    
    echo -e "  Xcode DerivedData: ${YELLOW}${xcode_derived}${NC}"
    echo -e "  Xcode Cache: ${YELLOW}${xcode_cache}${NC}"
    echo ""
}

# Fonction pour vérifier les caches Android
check_android_caches() {
    echo -e "${BLUE}🤖 Caches Android:${NC}"
    
    show_size "$PROJECT_ROOT/android/app/build" "android/app/build"
    show_size "$PROJECT_ROOT/android/.gradle" "android/.gradle"
    show_size "$PROJECT_ROOT/android/build" "android/build"
    
    # Caches Gradle globaux
    local gradle_cache=$(du -sh ~/.gradle/caches 2>/dev/null | cut -f1 || echo "0B")
    local android_cache=$(du -sh ~/.android/build-cache 2>/dev/null | cut -f1 || echo "0B")
    
    echo -e "  Gradle Cache: ${YELLOW}${gradle_cache}${NC}"
    echo -e "  Android Build Cache: ${YELLOW}${android_cache}${NC}"
    echo ""
}

# Fonction pour vérifier les caches temporaires
check_temp_caches() {
    echo -e "${BLUE}🗑️  Caches temporaires:${NC}"
    
    local metro_tmp=$(du -sh /tmp/metro-* 2>/dev/null | cut -f1 | head -1 || echo "0B")
    local react_tmp=$(du -sh /tmp/react-native-* 2>/dev/null | cut -f1 | head -1 || echo "0B")
    
    echo -e "  /tmp/metro-*: ${YELLOW}${metro_tmp}${NC}"
    echo -e "  /tmp/react-native-*: ${YELLOW}${react_tmp}${NC}"
    echo ""
}

# Fonction pour afficher les recommandations
show_recommendations() {
    echo -e "${BLUE}💡 Recommandations:${NC}"
    
    # Vérifier la taille de node_modules
    if [ -d "$PROJECT_ROOT/node_modules" ]; then
        local node_size=$(du -sm "$PROJECT_ROOT/node_modules" 2>/dev/null | cut -f1)
        if [ "$node_size" -gt 500 ]; then
            echo -e "  ${YELLOW}⚠️  node_modules est volumineux (${node_size}MB)${NC}"
            echo -e "     Considérez: npm run clean:npm"
        fi
    fi
    
    # Vérifier les caches Metro
    if [ -d "$PROJECT_ROOT/metro-cache" ] || [ -d "$PROJECT_ROOT/.metro" ]; then
        echo -e "  ${YELLOW}📱 Cache Metro détecté${NC}"
        echo -e "     Pour nettoyer: npm run clean:metro"
    fi
    
    # Vérifier les caches iOS
    if [ -d "$PROJECT_ROOT/ios/build" ] || [ -d "$PROJECT_ROOT/ios/DerivedData" ]; then
        echo -e "  ${YELLOW}🍎 Caches iOS détectés${NC}"
        echo -e "     Pour nettoyer: npm run clean:ios"
    fi
    
    # Vérifier les caches Android
    if [ -d "$PROJECT_ROOT/android/build" ] || [ -d "$PROJECT_ROOT/android/.gradle" ]; then
        echo -e "  ${YELLOW}🤖 Caches Android détectés${NC}"
        echo -e "     Pour nettoyer: npm run clean:android"
    fi
    
    echo ""
    echo -e "  ${GREEN}🚀 Nettoyage rapide: npm run clean:quick${NC}"
    echo -e "  ${GREEN}🧹 Nettoyage complet: npm run clean${NC}"
}

# Exécution des vérifications
check_disk_space
check_processes
check_watchman
check_main_caches
check_ios_caches
check_android_caches
check_temp_caches
show_recommendations

echo -e "${BLUE}✨ Vérification terminée !${NC}"
