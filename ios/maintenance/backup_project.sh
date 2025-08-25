#!/bin/bash

# Script de sauvegarde complète du projet iOS
# Crée une sauvegarde horodatée de tous les fichiers importants

set -e

echo "💾 SAUVEGARDE COMPLÈTE DU PROJET iOS"
echo "======================================"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Timestamp
timestamp=$(date +%Y%m%d_%H%M%S)
backup_name="ios_backup_$timestamp"

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

# Créer le dossier de sauvegarde
backup_dir="backups"
mkdir -p "$backup_dir"

log_info "Création de la sauvegarde: $backup_name"
echo ""

# 1. Sauvegarder la configuration Xcode
log_info "Sauvegarde de la configuration Xcode..."
if [ -d "Nyth.xcodeproj" ]; then
    cp -r Nyth.xcodeproj "$backup_dir/${backup_name}_xcodeproj"
    log_success "Configuration Xcode sauvegardée"
else
    log_error "Configuration Xcode non trouvée"
fi

# 2. Sauvegarder le workspace
log_info "Sauvegarde du workspace..."
if [ -d "Nyth.xcworkspace" ]; then
    cp -r Nyth.xcworkspace "$backup_dir/${backup_name}_workspace"
    log_success "Workspace sauvegardé"
else
    log_warning "Workspace non trouvé"
fi

# 3. Sauvegarder les configurations
log_info "Sauvegarde des configurations..."
config_files=("Podfile" "Podfile.lock" "Info.plist")
for file in "${config_files[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$backup_dir/${backup_name}_${file}"
        log_success "Configuration $file sauvegardée"
    elif [ -f "Nyth/$file" ]; then
        cp "Nyth/$file" "$backup_dir/${backup_name}_${file}"
        log_success "Configuration Nyth/$file sauvegardée"
    else
        log_warning "Configuration $file non trouvée"
    fi
done

# 4. Sauvegarder les scripts
log_info "Sauvegarde des scripts..."
script_files=("Makefile" "add_shared_modules.rb" "remove_shared_modules.rb" "demo_shared_modules.rb")
for script in "${script_files[@]}"; do
    if [ -f "$script" ]; then
        cp "$script" "$backup_dir/${backup_name}_${script}"
        log_success "Script $script sauvegardé"
    else
        log_warning "Script $script non trouvé"
    fi
done

# 5. Sauvegarder le dossier maintenance
log_info "Sauvegarde du dossier maintenance..."
if [ -d "maintenance" ]; then
    cp -r maintenance "$backup_dir/${backup_name}_maintenance"
    log_success "Dossier maintenance sauvegardé"
else
    log_warning "Dossier maintenance non trouvé"
fi

# 6. Créer un fichier d'information
cat > "$backup_dir/${backup_name}_README.txt" << EOF
SAUVEGARDE DU PROJET iOS - $timestamp
=====================================

Date: $(date)
Projet: Nyth iOS
Version: $(grep -A1 'MARKETING_VERSION' Nyth.xcodeproj/project.pbxproj 2>/dev/null | grep -o '[0-9]\+\.[0-9]\+' | head -1 || echo "N/A")

CONTENU DE LA SAUVEGARDE:
- Configuration Xcode (Nyth.xcodeproj)
- Workspace (Nyth.xcworkspace)
- Configurations (Podfile, Podfile.lock, Info.plist)
- Scripts de gestion des modules shared
- Dossier maintenance

RESTAURATION:
1. Arrêter Xcode complètement
2. Supprimer l'ancien projet si nécessaire
3. Copier les fichiers depuis cette sauvegarde
4. Ouvrir Nyth.xcworkspace
5. Nettoyer et recompiler si nécessaire

CONTACT:
Script de maintenance automatique
EOF

log_success "Fichier d'information créé"

# 7. Calculer la taille de la sauvegarde
backup_size=$(du -sh "$backup_dir" | cut -f1)
log_info "Taille totale de la sauvegarde: $backup_size"

# 8. Nettoyer les anciennes sauvegardes (garder les 5 plus récentes)
log_info "Nettoyage des anciennes sauvegardes..."
backup_count=$(ls -1 "$backup_dir"/ios_backup_* 2>/dev/null | wc -l | tr -d ' ')
if [ "$backup_count" -gt 5 ]; then
    ls -t "$backup_dir"/ios_backup_* | tail -n +6 | xargs rm -rf
    log_success "Anciennes sauvegardes nettoyées (5 plus récentes conservées)"
fi

# 9. Créer un résumé
echo ""
echo "======================================"
echo -e "${GREEN}🎉 SAUVEGARDE TERMINÉE${NC}"
echo ""
echo "📁 Sauvegarde créée:"
echo "   📂 $backup_dir/$backup_name/"
echo ""
echo "📊 Contenu:"
ls -la "$backup_dir/${backup_name}_"*
echo ""
echo "💡 Pour restaurer:"
echo "   cp $backup_dir/${backup_name}_xcodeproj Nyth.xcodeproj"
echo "   cp $backup_dir/${backup_name}_workspace Nyth.xcworkspace"
echo ""
echo "📋 Informations:"
echo "   Taille: $backup_size"
echo "   Date: $timestamp"
echo "   Fichier info: $backup_dir/${backup_name}_README.txt"

echo ""
echo -e "${PURPLE}📂 SAUVEGARDES DISPONIBLES:${NC}"
ls -lt "$backup_dir"/ios_backup_* | head -5
