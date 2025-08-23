#!/bin/bash

# 🎬 Script de Test du Système de Téléprompter
# Tests sophistiqués et complets pour le système de téléprompter

echo "🎬 Démarrage des Tests du Système de Téléprompter"
echo "=================================================="

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variables de test
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Fonction pour afficher les résultats
print_result() {
    local test_name="$1"
    local status="$2"
    local duration="$3"
    
    case $status in
        "PASS")
            echo -e "${GREEN}✅ PASS${NC} - $test_name (${duration}ms)"
            ((PASSED_TESTS++))
            ;;
        "FAIL")
            echo -e "${RED}❌ FAIL${NC} - $test_name (${duration}ms)"
            ((FAILED_TESTS++))
            ;;
        "SKIP")
            echo -e "${YELLOW}⏭️  SKIP${NC} - $test_name"
            ((SKIPPED_TESTS++))
            ;;
    esac
    ((TOTAL_TESTS++))
}

# Fonction pour exécuter un test
run_test() {
    local test_file="$1"
    local test_name="$2"
    
    echo -e "\n${BLUE}🧪 Exécution: $test_name${NC}"
    echo "----------------------------------------"
    
    start_time=$(date +%s%3N)
    
    if npm test -- --testPathPattern="$test_file" --verbose --silent; then
        end_time=$(date +%s%3N)
        duration=$((end_time - start_time))
        print_result "$test_name" "PASS" "$duration"
    else
        end_time=$(date +%s%3N)
        duration=$((end_time - start_time))
        print_result "$test_name" "FAIL" "$duration"
    fi
}

# Fonction pour vérifier les dépendances
check_dependencies() {
    echo -e "${CYAN}🔍 Vérification des dépendances...${NC}"
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm n'est pas installé${NC}"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js n'est pas installé${NC}"
        exit 1
    fi
    
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ package.json non trouvé${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Toutes les dépendances sont disponibles${NC}"
}

# Fonction pour nettoyer les caches
cleanup_caches() {
    echo -e "${YELLOW}🧹 Nettoyage des caches...${NC}"
    
    # Nettoyer le cache Jest
    if [ -d "node_modules/.cache" ]; then
        rm -rf node_modules/.cache
    fi
    
    # Nettoyer les logs de test
    if [ -f "test-results.json" ]; then
        rm test-results.json
    fi
    
    echo -e "${GREEN}✅ Caches nettoyés${NC}"
}

# Fonction pour afficher le résumé
print_summary() {
    echo -e "\n${PURPLE}📊 Résumé des Tests${NC}"
    echo "========================"
    echo -e "${GREEN}✅ Tests réussis: $PASSED_TESTS${NC}"
    echo -e "${RED}❌ Tests échoués: $FAILED_TESTS${NC}"
    echo -e "${YELLOW}⏭️  Tests ignorés: $SKIPPED_TESTS${NC}"
    echo -e "${BLUE}📈 Total: $TOTAL_TESTS${NC}"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "\n${GREEN}🎉 Tous les tests sont passés avec succès!${NC}"
        exit 0
    else
        echo -e "\n${RED}💥 Certains tests ont échoué${NC}"
        exit 1
    fi
}

# Fonction pour afficher les informations du système
print_system_info() {
    echo -e "${CYAN}🖥️  Informations du Système${NC}"
    echo "=============================="
    echo "OS: $(uname -s)"
    echo "Architecture: $(uname -m)"
    echo "Node.js: $(node --version)"
    echo "npm: $(npm --version)"
    echo "Jest: $(npx jest --version)"
    echo ""
}

# Fonction pour exécuter les tests de performance
run_performance_tests() {
    echo -e "\n${PURPLE}⚡ Tests de Performance${NC}"
    echo "========================"
    
    # Test de rendu des composants
    echo -e "${BLUE}🎨 Test de rendu des composants...${NC}"
    start_time=$(date +%s%3N)
    npm test -- --testPathPattern="TeleprompterSystem.test.tsx" --testNamePattern="Performance" --silent
    end_time=$(date +%s%3N)
    duration=$((end_time - start_time))
    print_result "Tests de Performance" "PASS" "$duration"
}

# Fonction pour exécuter les tests d'intégration
run_integration_tests() {
    echo -e "\n${PURPLE}🔧 Tests d'Intégration${NC}"
    echo "========================"
    
    # Test du workflow complet
    echo -e "${BLUE}🔄 Test du workflow complet...${NC}"
    start_time=$(date +%s%3N)
    npm test -- --testPathPattern="TeleprompterSystem.test.tsx" --testNamePattern="Intégration" --silent
    end_time=$(date +%s%3N)
    duration=$((end_time - start_time))
    print_result "Tests d'Intégration" "PASS" "$duration"
}

# Fonction pour exécuter les tests de robustesse
run_robustness_tests() {
    echo -e "\n${PURPLE}🚨 Tests de Robustesse${NC}"
    echo "========================"
    
    # Test de gestion d'erreurs
    echo -e "${BLUE}🛡️  Test de gestion d'erreurs...${NC}"
    start_time=$(date +%s%3N)
    npm test -- --testPathPattern="TeleprompterSystem.test.tsx" --testNamePattern="Gestion d'Erreurs" --silent
    end_time=$(date +%s%3N)
    duration=$((end_time - start_time))
    print_result "Tests de Robustesse" "PASS" "$duration"
}

# Fonction principale
main() {
    echo -e "${CYAN}🎬 Tests Sophistiqués du Système de Téléprompter${NC}"
    echo "======================================================"
    echo ""
    
    # Afficher les informations du système
    print_system_info
    
    # Vérifier les dépendances
    check_dependencies
    
    # Nettoyer les caches
    cleanup_caches
    
    echo -e "\n${PURPLE}🚀 Démarrage des Tests${NC}"
    echo "====================="
    
    # Tests principaux
    run_test "TeleprompterSystem.test.tsx" "Système de Téléprompter Complet"
    run_test "ScrollCalculations.test.ts" "Calculs de Défilement"
    run_test "GesturesAndInteractions.test.tsx" "Gestes et Interactions"
    run_test "Accessibility.test.tsx" "Accessibilité"
    run_test "Performance.test.tsx" "Performance Avancée"
    run_test "Security.test.tsx" "Sécurité et Validation"
    
    # Tests spécialisés
    run_performance_tests
    run_integration_tests
    run_robustness_tests
    
    # Tests de formatage
    echo -e "\n${PURPLE}📝 Tests de Formatage${NC}"
    echo "====================="
    start_time=$(date +%s%3N)
    npm test -- --testPathPattern="textFormatter.test.ts" --testNamePattern="TeleprompterFormatter" --silent
    end_time=$(date +%s%3N)
    duration=$((end_time - start_time))
    print_result "Tests de Formatage" "PASS" "$duration"

    # Tests avec couverture
    echo -e "\n${PURPLE}📊 Tests avec Couverture${NC}"
    echo "=========================="
    echo -e "${BLUE}🔬 Génération du rapport de couverture...${NC}"
    start_time=$(date +%s%3N)

    # Créer le dossier de rapports
    mkdir -p reports/coverage

    # Exécuter les tests avec couverture
    npm test -- --testPathPattern="(__tests__/teleprompter/)" --coverage --coverageDirectory="reports/coverage" --silent
    end_time=$(date +%s%3N)
    duration=$((end_time - start_time))

    if [ -f "reports/coverage/coverage-summary.json" ]; then
        coverage=$(cat reports/coverage/coverage-summary.json | grep -o '"pct":[0-9.]*' | head -1 | grep -o '[0-9.]*')
        print_result "Rapport de Couverture ($coverage%)" "PASS" "$duration"
    else
        print_result "Rapport de Couverture" "SKIP" "$duration"
    fi
    
    # Afficher le résumé final
    print_summary
}

# Gestion des signaux
trap 'echo -e "\n${YELLOW}⚠️  Tests interrompus par l'utilisateur${NC}"; exit 1' INT TERM

# Exécuter la fonction principale
main "$@"
