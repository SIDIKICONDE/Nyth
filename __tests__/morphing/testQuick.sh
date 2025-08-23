#!/bin/bash

# 🎨 Test Rapide du Système de Morphing NYTH
# Test rapide sans rapports détaillés - pour développement

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../" && pwd)"
cd "$PROJECT_ROOT"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🎨 TEST RAPIDE DU SYSTÈME DE MORPHING NYTH${NC}"
echo -e "${BLUE}=================================================${NC}"

# Vérifier que Jest est disponible
if ! npm list jest &> /dev/null && ! command -v jest &> /dev/null; then
    echo -e "${YELLOW}⚠️ Jest non trouvé, installation...${NC}"
    npm install --save-dev jest @testing-library/react-native @testing-library/jest-native --silent
fi

# Variables de suivi
start_time=$(date +%s)
passed_tests=0
total_tests=0

# Tests rapides
echo -e "${GREEN}🧪 Exécution des tests unitaires...${NC}"

# Test 1: Morphing Géométrique
echo -e "${BLUE}🔷 Test Morphing Géométrique...${NC}"
if npm test -- --testPathPattern="LogoNythMorphing.test.tsx" --testNamePattern="Morphing Géométrique" --silent --verbose 2>/dev/null; then
    echo -e "${GREEN}✅ Morphing Géométrique${NC}"
    ((passed_tests++))
else
    echo -e "${RED}❌ Morphing Géométrique${NC}"
fi
((total_tests++))

# Test 2: Système de Particules
echo -e "${BLUE}✨ Test Système de Particules...${NC}"
if npm test -- --testPathPattern="LogoNythMorphing.test.tsx" --testNamePattern="Système de Particules" --silent --verbose 2>/dev/null; then
    echo -e "${GREEN}✅ Système de Particules${NC}"
    ((passed_tests++))
else
    echo -e "${RED}❌ Système de Particules${NC}"
fi
((total_tests++))

# Test 3: Gestion des Couleurs
echo -e "${BLUE}🌈 Test Gestion des Couleurs...${NC}"
if npm test -- --testPathPattern="LogoNythMorphing.test.tsx" --testNamePattern="Gestion des Couleurs" --silent --verbose 2>/dev/null; then
    echo -e "${GREEN}✅ Gestion des Couleurs${NC}"
    ((passed_tests++))
else
    echo -e "${RED}❌ Gestion des Couleurs${NC}"
fi
((total_tests++))

# Test 4: Animations et Performance
echo -e "${BLUE}⚡ Test Animations et Performance...${NC}"
if npm test -- --testPathPattern="LogoNythMorphing.test.tsx" --testNamePattern="Animations et Performance" --silent --verbose 2>/dev/null; then
    echo -e "${GREEN}✅ Animations et Performance${NC}"
    ((passed_tests++))
else
    echo -e "${RED}❌ Animations et Performance${NC}"
fi
((total_tests++))

# Test 5: Interface de Contrôle
echo -e "${BLUE}🎛️ Test Interface de Contrôle...${NC}"
if npm test -- --testPathPattern="LogoNythMorphing.test.tsx" --testNamePattern="Interface de Contrôle" --silent --verbose 2>/dev/null; then
    echo -e "${GREEN}✅ Interface de Contrôle${NC}"
    ((passed_tests++))
else
    echo -e "${RED}❌ Interface de Contrôle${NC}"
fi
((total_tests++))

# Test 6: Configuration et Props
echo -e "${BLUE}🔧 Test Configuration et Props...${NC}"
if npm test -- --testPathPattern="LogoNythMorphing.test.tsx" --testNamePattern="Configuration et Props" --silent --verbose 2>/dev/null; then
    echo -e "${GREEN}✅ Configuration et Props${NC}"
    ((passed_tests++))
else
    echo -e "${RED}❌ Configuration et Props${NC}"
fi
((total_tests++))

# Test 7: Métriques de Performance
echo -e "${BLUE}📊 Test Métriques de Performance...${NC}"
if npm test -- --testPathPattern="LogoNythMorphing.test.tsx" --testNamePattern="Métriques de Performance" --silent --verbose 2>/dev/null; then
    echo -e "${GREEN}✅ Métriques de Performance${NC}"
    ((passed_tests++))
else
    echo -e "${RED}❌ Métriques de Performance${NC}"
fi
((total_tests++))

# Test 8: Effets Visuels
echo -e "${BLUE}🎨 Test Effets Visuels...${NC}"
if npm test -- --testPathPattern="LogoNythMorphing.test.tsx" --testNamePattern="Effets Visuels" --silent --verbose 2>/dev/null; then
    echo -e "${GREEN}✅ Effets Visuels${NC}"
    ((passed_tests++))
else
    echo -e "${RED}❌ Effets Visuels${NC}"
fi
((total_tests++))

# Résultats
end_time=$(date +%s)
duration=$((end_time - start_time))

echo ""
echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}🎯 RÉSULTATS DU TEST RAPIDE${NC}"
echo -e "${BLUE}=================================================${NC}"

if [ $passed_tests -eq $total_tests ]; then
    echo -e "${GREEN}🎉 SUCCÈS: $passed_tests/$total_tests tests réussis${NC}"
    echo -e "${GREEN}⏱️ Durée: ${duration}s${NC}"
    echo -e "${GREEN}✅ Système de Morphing opérationnel${NC}"
    exit 0
else
    failed_tests=$((total_tests - passed_tests))
    echo -e "${RED}⚠️ ÉCHEC: $passed_tests/$total_tests tests réussis ($failed_tests échoués)${NC}"
    echo -e "${YELLOW}⏱️ Durée: ${duration}s${NC}"
    echo -e "${YELLOW}🔧 Exécutez './__tests__/runMorphingTests.sh' pour plus de détails${NC}"
    exit 1
fi
