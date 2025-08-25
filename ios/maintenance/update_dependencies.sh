#!/bin/bash

# Script de mise à jour des dépendances iOS
# Met à jour CocoaPods, les pods, et nettoie les caches

set -e

echo "🔄 MISE À JOUR DES DÉPENDANCES iOS"
echo "====================================="

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Fonctions
log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier les prérequis
log_info "Vérification des prérequis..."

if ! command -v pod >/dev/null 2>&1; then
    log_error "CocoaPods n'est pas installé"
    echo "   Installez avec: sudo gem install cocoapods"
    exit 1
fi

if [ ! -f "Podfile" ]; then
    log_error "Podfile non trouvé dans le répertoire actuel"
    exit 1
fi

log_success "Prérequis OK"

# 1. Créer une sauvegarde automatique
log_info "Création d'une sauvegarde automatique..."
timestamp=$(date +%Y%m%d_%H%M%S)
if [ -f "Podfile.lock" ]; then
    cp Podfile.lock "Podfile.lock.backup_$timestamp"
    log_success "Sauvegarde Podfile.lock créée"
fi

# 2. Mettre à jour CocoaPods
log_info "Mise à jour de CocoaPods..."
pod repo update
log_success "Repository CocoaPods mis à jour"

# 3. Nettoyer les anciens Pods
log_info "Suppression des anciens Pods..."
rm -rf Pods/
log_success "Anciens Pods supprimés"

# 4. Installer les nouveaux Pods
log_info "Installation des Pods..."
pod install
log_success "Pods installés"

# 5. Vérifier l'installation
log_info "Vérification de l'installation..."
if [ -d "Pods" ] && [ -f "Podfile.lock" ]; then
    pod_count=$(grep -c "PODS:" Podfile.lock 2>/dev/null || echo "0")
    log_success "Installation réussie - $pod_count pods installés"
else
    log_error "Installation échouée"
    exit 1
fi

# 6. Nettoyer les caches
log_info "Nettoyage des caches..."
rm -rf ~/Library/Caches/CocoaPods 2>/dev/null
rm -rf ~/Library/Developer/Xcode/DerivedData/* 2>/dev/null
log_success "Caches nettoyés"

# 7. Vérifier la compatibilité
log_info "Vérification de la compatibilité..."

# Vérifier si le projet s'ouvre
if [ -f "Nyth.xcworkspace/xcshareddata/IDEWorkspaceChecks.plist" ]; then
    rm -f "Nyth.xcworkspace/xcshareddata/IDEWorkspaceChecks.plist"
    log_success "Cache du workspace nettoyé"
fi

# 8. Afficher un résumé des changements
echo ""
echo "======================================"
echo -e "${PURPLE}📊 RÉSUMÉ DES CHANGEMENTS${NC}"
echo ""

if [ -f "Podfile.lock.backup_$timestamp" ]; then
    echo "📋 Comparaison Podfile.lock:"
    if command -v diff >/dev/null 2>&1; then
        diff Podfile.lock.backup_$timestamp Podfile.lock >/dev/null 2>&1 && \
            log_info "Aucun changement dans les versions des pods" || \
            log_warning "Des pods ont été mis à jour"
    fi
    rm -f Podfile.lock.backup_$timestamp
fi

# 9. Afficher les informations des pods
echo ""
echo "📦 PODS INSTALLÉS:"
echo "-------------------"
if [ -f "Podfile.lock" ]; then
    grep -A 50 "PODS:" Podfile.lock | grep -E "^  - " | head -10
    echo "..."
    pod_count=$(grep -c "^  - " Podfile.lock 2>/dev/null || echo "0")
    echo ""
    log_info "Total: $pod_count pods installés"
fi

# 10. Instructions finales
echo ""
echo "======================================"
echo -e "${GREEN}🎉 MISE À JOUR TERMINÉE${NC}"
echo ""
echo "📋 PROCHAINES ÉTAPES:"
echo "   1. Ouvrez le workspace: ${GREEN}open Nyth.xcworkspace${NC}"
echo "   2. Nettoyez le projet: ${GREEN}Cmd+Shift+K${NC}"
echo "   3. Recompilez: ${GREEN}Cmd+B${NC}"
echo ""
echo "⚠️  SI PROBLÈMES:"
echo "   - Utilisez: ${YELLOW}./maintenance/clean_cache.sh${NC}"
echo "   - Vérifiez les erreurs dans: ${YELLOW}View > Navigators > Issues${NC}"
echo "   - Consultez les logs: ${YELLOW}Window > Devices and Simulators${NC}"
echo ""
echo "💡 CONSEILS:"
echo "   - Testez sur un simulateur d'abord"
echo "   - Vérifiez les permissions microphone/camera si utilisé"
echo "   - Utilisez 'make status' pour vérifier l'état"
