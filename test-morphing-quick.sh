#!/bin/bash

# 🎨 Test Rapide du Morphing - Script Global
# Lance les tests du système de morphing NYTH

cd /Users/m1/Desktop/Nyth

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🎨 TEST RAPIDE DU SYSTÈME DE MORPHING NYTH${NC}"
echo -e "${BLUE}=============================================${NC}"

# Vérifier si le script de test rapide existe
if [ -f "__tests__/morphing/testQuick.sh" ]; then
    echo -e "${GREEN}✅ Script de test trouvé${NC}"
    echo ""

    # Exécuter le test rapide
    bash __tests__/morphing/testQuick.sh
else
    echo -e "${RED}❌ Script de test non trouvé${NC}"
    echo -e "${YELLOW}🔧 Utilisation du script principal...${NC}"
    echo ""

    # Fallback vers les tests Jest directement
    if npm test -- --testPathPattern="LogoNythMorphing.test.tsx" --silent --verbose 2>/dev/null; then
        echo -e "${GREEN}✅ Tests du morphing réussis${NC}"
        exit 0
    else
        echo -e "${RED}❌ Tests du morphing échoués${NC}"
        exit 1
    fi
fi
