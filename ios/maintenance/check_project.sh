#!/bin/bash

# Script de diagnostic complet du projet iOS
# Vérifie l'état de santé du projet et détecte les problèmes

set -e

echo "🔍 DIAGNOSTIC COMPLET DU PROJET iOS"
echo "====================================="

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Compteurs
errors=0
warnings=0
info=0

# Fonctions de logging
log_error() {
    echo -e "${RED}❌ $1${NC}"
    ((errors++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((warnings++))
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
    ((info++))
}

# 1. Vérifier la structure du projet
echo ""
echo "📁 VÉRIFICATION DE LA STRUCTURE:"
echo "----------------------------------"

# Vérifier le workspace
if [ -f "Nyth.xcworkspace/contents.xcworkspacedata" ]; then
    log_success "Workspace Nyth.xcworkspace trouvé"
else
    log_error "Workspace Nyth.xcworkspace manquant"
fi

# Vérifier le projet
if [ -f "Nyth.xcodeproj/project.pbxproj" ]; then
    log_success "Projet Nyth.xcodeproj trouvé"
else
    log_error "Projet Nyth.xcodeproj manquant"
fi

# Vérifier les dossiers importants
for dir in "Nyth.xcodeproj/xcshareddata" "Nyth" "Pods"; do
    if [ -d "$dir" ]; then
        log_success "Dossier $dir présent"
    else
        log_warning "Dossier $dir manquant"
    fi
done

# 2. Vérifier les fichiers de configuration
echo ""
echo "⚙️  VÉRIFICATION DES CONFIGURATIONS:"
echo "-------------------------------------"

# Vérifier les fichiers de configuration
config_files=("Podfile" "Podfile.lock" "Info.plist" "project.pbxproj")
for file in "${config_files[@]}"; do
    if [ -f "$file" ] || [ -f "Nyth.xcodeproj/$file" ] || [ -f "Nyth/$file" ]; then
        log_success "Configuration $file trouvée"
    else
        log_warning "Configuration $file manquante"
    fi
done

# 3. Vérifier les caches et sauvegardes
echo ""
echo "💾 VÉRIFICATION DES CACHES:"
echo "------------------------------"

# Vérifier l'espace disque des données dérivées
derived_data_size=$(du -sh ~/Library/Developer/Xcode/DerivedData 2>/dev/null | cut -f1)
if [ -n "$derived_data_size" ]; then
    log_info "Données dérivées Xcode: $derived_data_size"
else
    log_info "Aucune donnée dérivée trouvée"
fi

# Vérifier les sauvegardes du projet
backup_count=$(ls -1 Nyth.xcodeproj/project.pbxproj.backup_* 2>/dev/null | wc -l | tr -d ' ')
if [ "$backup_count" -gt 0 ]; then
    log_success "$backup_count sauvegardes du projet trouvées"
else
    log_warning "Aucune sauvegarde du projet trouvée"
fi

# 4. Vérifier les dépendances
echo ""
echo "📦 VÉRIFICATION DES DÉPENDANCES:"
echo "-----------------------------------"

# Vérifier CocoaPods
if command -v pod >/dev/null 2>&1; then
    pod_version=$(pod --version)
    log_success "CocoaPods installé (v$pod_version)"
else
    log_error "CocoaPods non installé"
fi

# Vérifier si les Pods sont installés
if [ -d "Pods" ] && [ -f "Podfile.lock" ]; then
    log_success "Pods installés"
else
    log_warning "Pods non installés ou Podfile.lock manquant"
fi

# 5. Vérifier les scripts de gestion
echo ""
echo "🔧 VÉRIFICATION DES SCRIPTS:"
echo "------------------------------"

scripts=("add_shared_modules.rb" "remove_shared_modules.rb" "Makefile")
for script in "${scripts[@]}"; do
    if [ -f "$script" ]; then
        log_success "Script $script trouvé"
    else
        log_warning "Script $script manquant"
    fi
done

# Scripts de maintenance
maintenance_scripts=("maintenance/clean_cache.sh" "maintenance/check_project.sh")
for script in "${maintenance_scripts[@]}"; do
    if [ -f "$script" ]; then
        log_success "Script maintenance $script trouvé"
    else
        log_warning "Script maintenance $script manquant"
    fi
done

# 6. Vérifier les modules shared
echo ""
echo "📂 VÉRIFICATION DES MODULES SHARED:"
echo "--------------------------------------"

# Vérifier le dossier shared
if [ -d "../shared" ]; then
    shared_files=$(find ../shared -name "*.cpp" -o -name "*.hpp" -o -name "*.h" | wc -l | tr -d ' ')
    log_success "Dossier shared trouvé avec $shared_files fichiers"

    # Vérifier les sous-modules
    for module in "Audio" "Videos"; do
        if [ -d "../shared/$module" ]; then
            module_files=$(find ../shared/$module -name "*.cpp" -o -name "*.hpp" | wc -l | tr -d ' ')
            log_info "Module $module: $module_files fichiers"
        else
            log_warning "Module $module manquant"
        fi
    done
else
    log_error "Dossier shared manquant"
fi

# 7. Vérifier l'état Git
echo ""
echo "📋 VÉRIFICATION GIT:"
echo "---------------------"

if [ -d "../.git" ]; then
    if git status --porcelain >/dev/null 2>&1; then
        modified_files=$(git status --porcelain | wc -l | tr -d ' ')
        if [ "$modified_files" -gt 0 ]; then
            log_warning "$modified_files fichiers modifiés non committés"
        else
            log_success "Repository Git propre"
        fi
    else
        log_warning "Impossible de vérifier l'état Git"
    fi
else
    log_info "Pas de repository Git détecté"
fi

# 8. Résumé final
echo ""
echo "====================================="
echo -e "${PURPLE}📊 RÉSULTATS DU DIAGNOSTIC${NC}"
echo ""
echo "📈 Statistiques:"
echo "   Erreurs: $errors"
echo "   Avertissements: $warnings"
echo "   Informations: $info"
echo ""

if [ $errors -gt 0 ]; then
    echo -e "${RED}🚨 $errors ERREURS DÉTECTÉES${NC}"
    echo "   Consultez les messages d'erreur ci-dessus"
elif [ $warnings -gt 0 ]; then
    echo -e "${YELLOW}⚠️  $warnings AVERTISSEMENTS${NC}"
    echo "   Le projet peut fonctionner mais des optimisations sont possibles"
else
    echo -e "${GREEN}✅ PROJET SAIN${NC}"
    echo "   Aucune erreur détectée, tout semble en ordre"
fi

echo ""
echo "💡 CONSEILS:"
if [ $errors -gt 0 ]; then
    echo "   - Corrigez les erreurs avant de continuer"
fi
if [ $warnings -gt 0 ]; then
    echo "   - Considérez résoudre les avertissements"
fi
echo "   - Utilisez 'make status' pour l'état détaillé"
echo "   - Utilisez './maintenance/clean_cache.sh' pour nettoyer"
