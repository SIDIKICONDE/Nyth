#!/bin/bash

# Script de monitoring des performances iOS
# Surveille l'utilisation des ressources pendant la compilation

set -e

echo "📊 MONITORING DES PERFORMANCES iOS"
echo "====================================="

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Fonctions
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

# 1. Informations système
echo ""
echo "💻 INFORMATIONS SYSTÈME:"
echo "---------------------------"

# CPU
cpu_info=$(sysctl -n machdep.cpu.brand_string 2>/dev/null || echo "N/A")
log_info "CPU: $cpu_info"

# Mémoire
memory_info=$(echo "scale=2; $(sysctl -n hw.memsize 2>/dev/null || echo "0") / 1024 / 1024 / 1024" | bc 2>/dev/null || echo "N/A")
log_info "Mémoire: ${memory_info} GB"

# Disque
disk_info=$(df -h . | awk 'NR==2 {print $4 " disponible sur " $2}')
log_info "Disque: $disk_info"

# macOS version
macos_version=$(sw_vers -productVersion 2>/dev/null || echo "N/A")
log_info "macOS: $macos_version"

# Xcode version
if command -v xcodebuild >/dev/null 2>&1; then
    xcode_version=$(xcodebuild -version | head -1)
    log_success "Xcode: $xcode_version"
else
    log_error "Xcode non trouvé"
fi

# 2. État des caches
echo ""
echo "💾 ÉTAT DES CACHES:"
echo "---------------------"

# Données dérivées Xcode
derived_size=$(du -sh ~/Library/Developer/Xcode/DerivedData 2>/dev/null | cut -f1 || echo "N/A")
log_info "Données dérivées Xcode: $derived_size"

# Cache CocoaPods
cocoapods_cache=$(du -sh ~/Library/Caches/CocoaPods 2>/dev/null | cut -f1 || echo "N/A")
log_info "Cache CocoaPods: $cocoapods_cache"

# Cache Metro
metro_cache=$(du -sh node_modules/.cache 2>/dev/null | cut -f1 || echo "N/A")
log_info "Cache Metro: $metro_cache"

# Build folder
build_size=$(du -sh build/ ios/build/ 2>/dev/null | cut -f1 || echo "N/A")
log_info "Dossier build: $build_size"

# 3. Analyse des Pods
echo ""
echo "📦 ANALYSE DES PODS:"
echo "----------------------"

if [ -f "Podfile.lock" ]; then
    pod_count=$(grep -c "^  - " Podfile.lock 2>/dev/null || echo "0")
    log_info "Pods installés: $pod_count"

    # Pods les plus volumineux
    echo ""
    log_info "Pods les plus volumineux:"
    if [ -d "Pods" ]; then
        du -sh Pods/* 2>/dev/null | sort -hr | head -5 | while read size pod; do
            echo "   $size $pod"
        done
    fi
else
    log_warning "Podfile.lock non trouvé"
fi

# 4. Analyse du projet
echo ""
echo "📁 ANALYSE DU PROJET:"
echo "-----------------------"

# Taille du projet
project_size=$(du -sh Nyth.xcodeproj/ 2>/dev/null | cut -f1 || echo "N/A")
log_info "Taille du projet Xcode: $project_size"

# Nombre de fichiers sources
source_files=$(find . -name "*.m" -o -name "*.mm" -o -name "*.cpp" -o -name "*.swift" | wc -l | tr -d ' ')
log_info "Fichiers sources: $source_files"

# Nombre de fichiers de configuration
config_files=$(find . -name "*.plist" -o -name "*.xcconfig" -o -name "Podfile*" | wc -l | tr -d ' ')
log_info "Fichiers de configuration: $config_files"

# 5. Performance de compilation
echo ""
echo "⚡ PERFORMANCE DE COMPILATION:"
echo "--------------------------------"

# Vérifier si un build existe
if [ -d "build" ] || [ -d "ios/build" ]; then
    log_success "Build existant trouvé"
else
    log_info "Aucun build trouvé - compilation nécessaire"
fi

# Vérifier les frameworks
framework_count=$(find . -name "*.framework" 2>/dev/null | wc -l | tr -d ' ')
log_info "Frameworks: $framework_count"

# 6. Recommandations
echo ""
echo "💡 RECOMMANDATIONS:"
echo "--------------------"

# Recommandations basées sur l'analyse
if [ "$derived_size" != "N/A" ] && [ "${derived_size%G}" -gt 10 ] 2>/dev/null; then
    log_warning "Cache Xcode volumineux - considérez un nettoyage"
fi

if [ "$pod_count" -gt 50 ] 2>/dev/null; then
    log_warning "Nombre élevé de pods - peut ralentir la compilation"
fi

if [ "$source_files" -gt 1000 ] 2>/dev/null; then
    log_info "Grand nombre de fichiers sources - compilation optimisée recommandée"
fi

# 7. Mesure des performances actuelles
echo ""
echo "📈 PERFORMANCES ACTUELLES:"
echo "----------------------------"

# CPU usage
cpu_usage=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | cut -d% -f1 2>/dev/null || echo "N/A")
log_info "Utilisation CPU actuelle: ${cpu_usage}%"

# Mémoire disponible
memory_available=$(vm_stat | grep "Pages free" | awk '{print $3}' | tr -d '.' 2>/dev/null || echo "N/A")
if [ "$memory_available" != "N/A" ]; then
    memory_mb=$((memory_available * 4096 / 1024 / 1024))
    log_info "Mémoire disponible: ${memory_mb} MB"
fi

# 8. Actions recommandées
echo ""
echo "======================================"
echo -e "${PURPLE}🎯 ACTIONS RECOMMANDÉES${NC}"
echo ""

if [ "$derived_size" != "N/A" ] && [ "${derived_size%G}" -gt 5 ] 2>/dev/null; then
    echo "1. 🧹 Nettoyer les caches:"
    echo "   ./maintenance/clean_cache.sh"
fi

echo "2. 📊 Vérifier l'état du projet:"
echo "   make status"

echo "3. 🔧 Optimiser la compilation:"
echo "   - Utilisez le cache de compilation"
echo "   - Activez la compilation parallèle"
echo "   - Utilisez des configurations optimisées"

echo "4. 📦 Gérer les dépendances:"
echo "   ./maintenance/update_dependencies.sh"

echo "5. 💾 Sauvegarder régulièrement:"
echo "   ./maintenance/backup_project.sh"

echo ""
echo -e "${GREEN}✅ MONITORING TERMINÉ${NC}"
