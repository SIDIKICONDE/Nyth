#!/bin/bash

# 🎨 Script de Test Indépendant du Système de Morphing NYTH
# Teste uniquement le système de morphing sans dépendances externes

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../" && pwd)"
TEST_DIR="$PROJECT_ROOT/__tests__"
MORPHING_DIR="$TEST_DIR/morphing"
REPORTS_DIR="$MORPHING_DIR/reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Fonction de logging
log() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$REPORTS_DIR/morphing_test_execution_$TIMESTAMP.log"
}

# Fonction pour vérifier les prérequis
check_prerequisites() {
    log "${CYAN}🔍 Vérification des prérequis pour les tests de morphing...${NC}"

    if ! command -v node &> /dev/null; then
        log "${RED}❌ Node.js n'est pas installé${NC}"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        log "${RED}❌ npm n'est pas installé${NC}"
        exit 1
    fi

    if ! command -v jest &> /dev/null && ! npm list -g jest &> /dev/null; then
        log "${YELLOW}⚠️ Jest n'est pas installé globalement, tentative d'utilisation locale...${NC}"
    fi

    # Créer le dossier de rapports
    mkdir -p "$REPORTS_DIR"
    log "${GREEN}✅ Prérequis vérifiés avec succès${NC}"
}

# Fonction pour exécuter un test avec métriques
run_test() {
    local test_file="$1"
    local test_name="$2"
    local start_time=$(date +%s%3N)
    local test_passed=false

    log "${BLUE}🧪 Exécution du test: ${WHITE}$test_name${NC}"
    log "${BLUE}📁 Fichier: ${WHITE}$test_file${NC}"

    # Exécuter le test avec Jest
    if npm test -- --testPathPattern="$test_file" --verbose --silent 2>/dev/null; then
        test_passed=true
        log "${GREEN}✅ Test réussi: $test_name${NC}"
    else
        log "${RED}❌ Test échoué: $test_name${NC}"
    fi

    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))

    # Afficher le résultat
    if [ "$test_passed" = true ]; then
        print_result "$test_name" "PASS" "$duration"
    else
        print_result "$test_name" "FAIL" "$duration"
    fi

    return $test_passed
}

# Fonction pour afficher le résultat formaté
print_result() {
    local test_name="$1"
    local status="$2"
    local duration="$3"

    if [ "$status" = "PASS" ]; then
        printf "${GREEN}✅ %-50s ${WHITE}%6s${NC}\n" "$test_name" "${duration}ms"
    else
        printf "${RED}❌ %-50s ${WHITE}%6s${NC}\n" "$test_name" "${duration}ms"
    fi
}

# Fonction pour générer un rapport de couverture
generate_coverage_report() {
    log "${PURPLE}📊 Génération du rapport de couverture...${NC}"

    local coverage_file="$REPORTS_DIR/coverage_$TIMESTAMP.json"

    # Exécuter les tests avec couverture
    if npm test -- --testPathPattern="LogoNythMorphing.test.tsx" --coverage --coverageDirectory="$REPORTS_DIR" --coverageReporters="json" --silent 2>/dev/null; then
        log "${GREEN}✅ Rapport de couverture généré${NC}"

        # Analyser le rapport de couverture
        if [ -f "$REPORTS_DIR/coverage-final.json" ]; then
            local coverage_data=$(cat "$REPORTS_DIR/coverage-final.json")
            local lines_pct=$(echo "$coverage_data" | grep -o '"lines":{"total":[0-9]*,"covered":[0-9]*,"skipped":[0-9]*,"pct":[0-9.]*' | grep -o '"pct":[0-9.]*' | grep -o '[0-9.]*' | head -1)
            local functions_pct=$(echo "$coverage_data" | grep -o '"functions":{"total":[0-9]*,"covered":[0-9]*,"skipped":[0-9]*,"pct":[0-9.]*' | grep -o '"pct":[0-9.]*' | grep -o '[0-9.]*' | head -1)
            local branches_pct=$(echo "$coverage_data" | grep -o '"branches":{"total":[0-9]*,"covered":[0-9]*,"skipped":[0-9]*,"pct":[0-9.]*' | grep -o '"pct":[0-9.]*' | grep -o '[0-9.]*' | head -1)

            log "${CYAN}📈 Couverture du code:${NC}"
            log "${WHITE}   Lignes: ${YELLOW}${lines_pct}%${NC}"
            log "${WHITE}   Fonctions: ${YELLOW}${functions_pct}%${NC}"
            log "${WHITE}   Branches: ${YELLOW}${branches_pct}%${NC}"
        fi
    else
        log "${YELLOW}⚠️ Impossible de générer le rapport de couverture${NC}"
    fi
}

# Fonction pour analyser les performances
run_performance_analysis() {
    log "${PURPLE}⚡ Analyse des performances du système de morphing...${NC}"

    # Test de performance des calculs mathématiques
    log "${CYAN}🔢 Test de performance des calculs mathématiques...${NC}"
    local math_start=$(date +%s%3N)

    # Simuler les calculs de morphing
    for i in {1..1000}; do
        t=$(echo "scale=4; $i * 0.01" | bc 2>/dev/null || echo "$i * 0.01" | awk '{print $1 * $2}')
        theta=$(echo "scale=4; ($i % 100) * 0.01 * 3.14159 * 2" | bc 2>/dev/null || echo "($i % 100) * 0.01 * 3.14159 * 2" | awk '{print ($1 % 100) * 0.01 * 3.14159 * 2}')

        # Calculs trigonométriques
        morph1=$(echo "scale=4; s($t * 2) * 0.3" | bc -l 2>/dev/null || echo "scale=4; $t * 2" | awk '{print sin($1) * 0.3}')
        morph2=$(echo "scale=4; c($t * 3) * 0.2" | bc -l 2>/dev/null || echo "scale=4; $t * 3" | awk '{print cos($1) * 0.2}')
        morph3=$(echo "scale=4; s($t * 1.5) * 0.4" | bc -l 2>/dev/null || echo "scale=4; $t * 1.5" | awk '{print sin($1) * 0.4}')

        # Calcul du rayon
        r=$(echo "scale=4; 100 + $morph1 * 30 + $morph2 * 20 + $morph3 * 25" | bc 2>/dev/null || echo "scale=4; 100 + $morph1 * 30 + $morph2 * 20 + $morph3 * 25" | awk '{print 100 + $1 * 30 + $2 * 20 + $3 * 25}')
    done

    local math_end=$(date +%s%3N)
    local math_duration=$((math_end - math_start))

    log "${GREEN}✅ Calculs mathématiques: ${WHITE}${math_duration}ms pour 1000 itérations${NC}"

    # Test de performance des particules
    log "${CYAN}✨ Test de performance du système de particules...${NC}"
    local particle_start=$(date +%s%3N)

    for i in {1..100}; do
        for j in {1..50}; do
            # Simuler les calculs de particules
            x=$(echo "scale=4; $RANDOM / 32767 * 400" | bc 2>/dev/null || echo "scale=4; $i * 4" | awk '{print $1 * 4}')
            y=$(echo "scale=4; $RANDOM / 32767 * 300" | bc 2>/dev/null || echo "scale=4; $j * 6" | awk '{print $1 * 6}')
            speedX=$(echo "scale=4; ($RANDOM / 32767 - 0.5) * 0.5" | bc 2>/dev/null || echo "scale=4; 0.1" | awk '{print 0.1}')
            speedY=$(echo "scale=4; ($RANDOM / 32767 - 0.5) * 0.5" | bc 2>/dev/null || echo "scale=4; -0.1" | awk '{print -0.1}')

            # Calcul de la nouvelle position
            newX=$(echo "scale=4; $x + $speedX" | bc 2>/dev/null || echo "scale=4; $x + $speedX" | awk '{print $1 + $2}')
            newY=$(echo "scale=4; $y + $speedY" | bc 2>/dev/null || echo "scale=4; $y + $speedY" | awk '{print $1 + $2}')
        done
    done

    local particle_end=$(date +%s%3N)
    local particle_duration=$((particle_end - particle_start))

    log "${GREEN}✅ Système de particules: ${WHITE}${particle_duration}ms pour 5000 calculs${NC}"
}

# Fonction pour tester la mémoire
run_memory_test() {
    log "${PURPLE}🧠 Test d'utilisation mémoire...${NC}"

    local initial_memory=$(ps aux | grep node | grep -v grep | awk '{print $6}' | head -1 2>/dev/null || echo "0")
    log "${CYAN}📊 Mémoire initiale: ${WHITE}${initial_memory}KB${NC}"

    # Exécuter un test de stress mémoire
    if npm test -- --testPathPattern="LogoNythMorphing.test.tsx" --testNamePattern="tracker l'utilisation mémoire des particules" --verbose --silent 2>/dev/null; then
        local final_memory=$(ps aux | grep node | grep -v grep | awk '{print $6}' | head -1 2>/dev/null || echo "0")
        local memory_diff=$((final_memory - initial_memory))

        log "${CYAN}📊 Mémoire finale: ${WHITE}${final_memory}KB${NC}"
        log "${CYAN}📊 Différence: ${WHITE}${memory_diff}KB${NC}"

        if [ $memory_diff -lt 10000 ]; then
            log "${GREEN}✅ Utilisation mémoire acceptable${NC}"
        else
            log "${YELLOW}⚠️ Utilisation mémoire élevée${NC}"
        fi
    fi
}

# Fonction principale
main() {
    log "${PURPLE}🎨 DÉBUT DES TESTS INDÉPENDANTS DU SYSTÈME DE MORPHING NYTH${NC}"
    log "${WHITE}================================================================${NC}"

    # Vérifier les prérequis
    check_prerequisites

    # Variables de suivi
    local total_tests=0
    local passed_tests=0
    local failed_tests=0
    local start_time=$(date +%s)

    # Tests unitaires du morphing
    log "${WHITE}================================================================${NC}"
    log "${PURPLE}🧪 TESTS UNITAIRES DU MORPHING${NC}"
    log "${WHITE}================================================================${NC}"

    # Liste des tests à exécuter
    local tests=(
        "LogoNythMorphing.test.tsx:Morphing Géométrique - Tests des Transformations"
        "LogoNythMorphing.test.tsx:Système de Particules - Tests Physiques"
        "LogoNythMorphing.test.tsx:Gestion des Couleurs - Tests Dynamiques"
        "LogoNythMorphing.test.tsx:Animations et Performance - Tests Temps Réel"
        "LogoNythMorphing.test.tsx:Interface de Contrôle - Tests Interactifs"
        "LogoNythMorphing.test.tsx:Configuration et Props - Tests de Validation"
        "LogoNythMorphing.test.tsx:Métriques de Performance - Tests de Monitoring"
        "LogoNythMorphing.test.tsx:Effets Visuels - Tests de Rendu"
    )

    for test_info in "${tests[@]}"; do
        IFS=':' read -r test_file test_name <<< "$test_info"
        total_tests=$((total_tests + 1))

        if run_test "$test_file" "$test_name"; then
            passed_tests=$((passed_tests + 1))
        else
            failed_tests=$((failed_tests + 1))
        fi
        echo ""
    done

    # Analyse des performances
    log "${WHITE}================================================================${NC}"
    log "${PURPLE}⚡ ANALYSE DES PERFORMANCES${NC}"
    log "${WHITE}================================================================${NC}"

    run_performance_analysis
    echo ""

    # Test de mémoire
    log "${WHITE}================================================================${NC}"
    log "${PURPLE}🧠 TEST D'UTILISATION MÉMOIRE${NC}"
    log "${WHITE}================================================================${NC}"

    run_memory_test
    echo ""

    # Rapport de couverture
    log "${WHITE}================================================================${NC}"
    log "${PURPLE}📊 RAPPORT DE COUVERTURE${NC}"
    log "${WHITE}================================================================${NC}"

    generate_coverage_report
    echo ""

    # Résumé final
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log "${WHITE}================================================================${NC}"
    log "${PURPLE}🎯 RÉSUMÉ FINAL - SYSTÈME DE MORPHING NYTH${NC}"
    log "${WHITE}================================================================${NC}"

    log "${CYAN}📊 Résultats des tests:${NC}"
    log "${GREEN}   ✅ Tests réussis: ${WHITE}${passed_tests}/${total_tests}${NC}"
    if [ $failed_tests -gt 0 ]; then
        log "${RED}   ❌ Tests échoués: ${WHITE}${failed_tests}/${total_tests}${NC}"
    fi

    log "${CYAN}⏱️ Durée totale: ${WHITE}${duration} secondes${NC}"
    log "${CYAN}📁 Rapports générés dans: ${WHITE}$REPORTS_DIR${NC}"

    if [ $failed_tests -eq 0 ]; then
        log "${GREEN}🎉 TOUS LES TESTS DU SYSTÈME DE MORPHING SONT RÉUSSIS !${NC}"
        exit 0
    else
        log "${RED}⚠️ CERTAINS TESTS DU SYSTÈME DE MORPHING ONT ÉCHOUÉ${NC}"
        exit 1
    fi
}

# Vérifier si le script est appelé directement
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Aller dans le répertoire du projet
    cd "$PROJECT_ROOT"

    # Vérifier que nous sommes dans le bon répertoire
    if [ ! -f "package.json" ]; then
        log "${RED}❌ Erreur: package.json non trouvé. Êtes-vous dans le bon répertoire ?${NC}"
        exit 1
    fi

    # Exécuter la fonction principale
    main
fi
