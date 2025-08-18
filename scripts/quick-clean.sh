#!/bin/bash

# Script de nettoyage rapide pour Nyth
# Usage: ./scripts/quick-clean.sh

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}🚀 Nettoyage rapide du cache pour Nyth...${NC}"
echo ""

# Arrêter les processus en cours
echo -e "${YELLOW}🛑 Arrêt des processus en cours...${NC}"
pkill -f "react-native start" 2>/dev/null || echo "Metro n'était pas en cours d'exécution"
pkill -f "node index.js" 2>/dev/null || echo "Serveur n'était pas en cours d'exécution"

# Nettoyage rapide des caches
echo -e "${YELLOW}🧹 Nettoyage des caches...${NC}"

# Cache Metro
rm -rf "$PROJECT_ROOT/metro-cache" 2>/dev/null || true
rm -rf "$PROJECT_ROOT/.metro" 2>/dev/null || true
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/react-native-* 2>/dev/null || true

# Cache NPM (sans supprimer node_modules)
rm -rf "$PROJECT_ROOT/node_modules/.cache" 2>/dev/null || true
if [ -d "$PROJECT_ROOT/server" ]; then
    rm -rf "$PROJECT_ROOT/server/node_modules/.cache" 2>/dev/null || true
fi

# Cache Watchman
watchman watch-del-all 2>/dev/null || echo "Watchman n'était pas en cours d'exécution"

# Fichiers temporaires
rm -rf "$PROJECT_ROOT/.bundle" 2>/dev/null || true
rm -rf "$PROJECT_ROOT/build" 2>/dev/null || true
rm -f "$PROJECT_ROOT/server/server.log" 2>/dev/null || true
rm -f "$PROJECT_ROOT/server/server.pid" 2>/dev/null || true

echo -e "${GREEN}✅ Nettoyage rapide terminé !${NC}"
echo ""
echo -e "${BLUE}💡 Pour un nettoyage complet, utilisez:${NC}"
echo "  npm run clean"
echo "  ou"
echo "  ./scripts/clean-cache.sh --all"
echo ""
echo -e "${BLUE}✨ Votre projet est prêt à être relancé !${NC}"
