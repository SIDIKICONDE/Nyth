#!/bin/bash

# Script de nettoyage des caches iOS
# Supprime tous les caches et données temporaires

set -e

echo "🧹 NETTOYAGE COMPLET DES CACHES iOS"
echo "======================================"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de logging
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Compteurs
cache_removed=0
data_cleaned=0

# 1. Nettoyer les données dérivées Xcode
log_info "Suppression des données dérivées Xcode..."
if rm -rf ~/Library/Developer/Xcode/DerivedData/* 2>/dev/null; then
    log_success "Données dérivées supprimées"
    ((cache_removed++))
else
    log_warning "Aucune donnée dérivée trouvée"
fi

# 2. Nettoyer le cache de compilation
log_info "Suppression du cache de compilation..."
if rm -rf build/ ios/build/ 2>/dev/null; then
    log_success "Cache de compilation supprimé"
    ((cache_removed++))
else
    log_warning "Aucun cache de compilation trouvé"
fi

# 3. Nettoyer les caches CocoaPods
log_info "Suppression des caches CocoaPods..."
if rm -rf ~/Library/Caches/CocoaPods 2>/dev/null; then
    log_success "Cache CocoaPods supprimé"
    ((cache_removed++))
else
    log_warning "Aucun cache CocoaPods trouvé"
fi

# 4. Nettoyer les Pods
log_info "Suppression des Pods..."
if rm -rf ios/Pods ios/Podfile.lock 2>/dev/null; then
    log_success "Pods supprimés"
    ((data_cleaned++))
else
    log_warning "Aucun Pod trouvé"
fi

# 5. Nettoyer les caches Metro/React Native
log_info "Suppression des caches Metro..."
if rm -rf node_modules/.cache 2>/dev/null; then
    log_success "Cache Metro supprimé"
    ((cache_removed++))
else
    log_warning "Aucun cache Metro trouvé"
fi

# 6. Nettoyer les caches temporaires
log_info "Suppression des fichiers temporaires..."
if rm -rf ios/*.log ios/*.tmp 2>/dev/null; then
    log_success "Fichiers temporaires supprimés"
    ((data_cleaned++))
else
    log_warning "Aucun fichier temporaire trouvé"
fi

# 7. Nettoyer les sauvegardes du projet (garder les 3 plus récentes)
log_info "Nettoyage des anciennes sauvegardes..."
backup_count=$(ls -1 ios/Nyth.xcodeproj/project.pbxproj.backup_* 2>/dev/null | wc -l)
if [ "$backup_count" -gt 3 ]; then
    ls -t ios/Nyth.xcodeproj/project.pbxproj.backup_* | tail -n +4 | xargs rm -f
    log_success "Anciennes sauvegardes supprimées (3 plus récentes conservées)"
    ((data_cleaned++))
else
    log_warning "Pas assez de sauvegardes pour nettoyer"
fi

# 8. Vérifier et nettoyer l'espace disque
log_info "Vérification de l'espace disque..."
if command -v df >/dev/null 2>&1; then
    available_space=$(df -h . | awk 'NR==2 {print $4}')
    log_info "Espace disponible: $available_space"
fi

echo ""
echo "======================================"
echo -e "${GREEN}🎉 NETTOYAGE TERMINÉ${NC}"
echo ""
echo "📊 RÉSULTATS:"
echo "   Caches supprimés: $cache_removed"
echo "   Données nettoyées: $data_cleaned"
echo ""
echo "📋 PROCHAINES ÉTAPES:"
echo "   1. pod install (si Pods supprimés)"
echo "   2. npm install (si node_modules affecté)"
echo "   3. Ouvrir le workspace: open ios/Nyth.xcworkspace"
echo ""
echo "💡 CONSEILS:"
echo "   - Utilisez 'make status' pour vérifier l'état"
echo "   - Utilisez 'make backup' avant les modifications importantes"
