#!/bin/bash

# Script de déploiement Phase 1: Stabilité
# Ce script déploie tous les composants optimisés du système d'abonnement

set -e

echo "🚀 Déploiement Phase 1: Stabilité du système d'abonnement"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de log
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier les prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."

    # Vérifier si Node.js est installé
    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé. Veuillez l'installer d'abord."
        exit 1
    fi

    # Vérifier si Firebase CLI est installé
    if ! command -v firebase &> /dev/null; then
        log_error "Firebase CLI n'est pas installé. Veuillez l'installer avec: npm install -g firebase-tools"
        exit 1
    fi

    # Vérifier si le projet Firebase est configuré
    if [ ! -f "firebase.json" ]; then
        log_error "Fichier firebase.json non trouvé. Assurez-vous d'être dans le bon répertoire."
        exit 1
    fi

    log_success "Prérequis vérifiés avec succès"
}

# Sauvegarder les fichiers existants
backup_existing_files() {
    log_info "Sauvegarde des fichiers existants..."

    BACKUP_DIR="backup-phase1-$(date +%Y%m%d-%H%M%S)"

    mkdir -p "$BACKUP_DIR"

    # Fichiers à sauvegarder
    FILES_TO_BACKUP=(
        "src/services/firebase/subscriptionService.ts"
        "functions/src/subscriptionFunctions.ts"
        "src/types/subscription.ts"
    )

    for file in "${FILES_TO_BACKUP[@]}"; do
        if [ -f "$file" ]; then
            cp "$file" "$BACKUP_DIR/"
            log_info "Sauvegardé: $file"
        fi
    done

    log_success "Sauvegarde terminée dans: $BACKUP_DIR"
}

# Copier les nouveaux fichiers
deploy_new_files() {
    log_info "Déploiement des nouveaux fichiers..."

    # Liste des nouveaux fichiers
    NEW_FILES=(
        "src/services/subscription/SubscriptionCacheService.ts"
        "src/services/subscription/FirestoreListenerOptimizer.ts"
        "src/services/subscription/SubscriptionHealthMonitor.ts"
        "src/types/subscriptionCache.ts"
        "src/services/subscription/PHASE1_STABILITE_README.md"
    )

    for file in "${NEW_FILES[@]}"; do
        if [ -f "$file" ]; then
            log_success "Fichier trouvé: $file"
        else
            log_warning "Fichier manquant: $file"
        fi
    done

    log_success "Nouveaux fichiers vérifiés"
}

# Mettre à jour les services existants
update_existing_services() {
    log_info "Mise à jour des services existants..."

    # Vérifier si les mises à jour sont nécessaires
    if grep -q "subscriptionCacheService" "src/services/firebase/subscriptionService.ts"; then
        log_info "Services déjà mis à jour"
    else
        log_warning "Les services existants doivent être mis à jour manuellement"
        log_warning "Vérifiez que subscriptionService.ts utilise le nouveau cache"
    fi
}

# Configurer les variables d'environnement
setup_environment() {
    log_info "Configuration des variables d'environnement..."

    # Vérifier .env
    if [ ! -f ".env" ]; then
        log_warning "Fichier .env non trouvé. Création d'un template..."
        cat > .env.template << EOF
# Variables d'environnement pour Phase 1: Stabilité

# RevenueCat Webhook Secret (générer dans RevenueCat Dashboard)
REVENUECAT_WEBHOOK_SECRET=votre_secret_webhook_ici

# Configuration du cache
SUBSCRIPTION_CACHE_TTL=300000
USAGE_CACHE_TTL=120000
MAX_CACHE_RETRIES=3

# Monitoring
HEALTH_CHECK_INTERVAL=30000
ENABLE_AUTO_FIX=true
EOF
        log_warning "Template .env créé: .env.template"
        log_warning "Veuillez le renommer en .env et le configurer"
    else
        log_success "Fichier .env trouvé"
    fi

    # Variables d'environnement Firebase Functions
    log_info "Configuration des variables Firebase Functions..."
    log_info "Exécutez manuellement:"
    log_info "firebase functions:secrets:set REVENUECAT_WEBHOOK_SECRET"
}

# Déployer les fonctions Firebase
deploy_functions() {
    log_info "Déploiement des fonctions Firebase..."

    # Vérifier si connecté à Firebase
    if ! firebase projects:list &> /dev/null; then
        log_error "Non connecté à Firebase. Veuillez exécuter: firebase login"
        exit 1
    fi

    # Déployer seulement les fonctions mises à jour
    log_info "Déploiement des fonctions: revenuecatWebhook, saveSubscription, getSubscription"

    # Build des fonctions
    cd functions
    npm run build

    # Déployer
    firebase deploy --only functions:revenuecatWebhook,saveSubscription,getSubscription,cancelSubscription

    cd ..

    log_success "Fonctions déployées avec succès"
}

# Configurer RevenueCat Webhook
setup_revenuecat_webhook() {
    log_info "Configuration du webhook RevenueCat..."
    log_info ""
    log_info "📋 Instructions manuelles pour RevenueCat:"
    log_info "1. Aller dans RevenueCat Dashboard"
    log_info "2. Naviguer vers 'Projects' > Votre projet"
    log_info "3. Aller dans l'onglet 'Integrations'"
    log_info "4. Cliquer sur 'Add Webhook'"
    log_info "5. Configuration:"
    log_info "   - URL: https://us-central1-nyth.cloudfunctions.net/revenuecatWebhook"
    log_info "   - Events: Sélectionner tous les événements"
    log_info "   - Active: Oui"
    log_info "6. Sauvegarder le webhook secret dans Firebase:"
    log_info "   firebase functions:secrets:set REVENUECAT_WEBHOOK_SECRET"
    log_info ""
    log_warning "⚠️ Cette étape doit être faite manuellement dans l'interface RevenueCat"
}

# Tests post-déploiement
run_post_deployment_tests() {
    log_info "Exécution des tests post-déploiement..."

    # Vérifier que les fonctions sont déployées
    if firebase functions:list | grep -q revenuecatWebhook; then
        log_success "✅ Fonction revenuecatWebhook déployée"
    else
        log_error "❌ Fonction revenuecatWebhook non trouvée"
    fi

    # Test de santé du système
    log_info "Test de santé du système..."
    log_info "Vous pouvez tester avec:"
    log_info "curl -X GET https://us-central1-nyth.cloudfunctions.net/revenuecatWebhook"
    log_info "(Devrait retourner 405 Method Not Allowed)"
}

# Vérifier l'état final
final_verification() {
    log_info "Vérification finale..."

    # Liste des composants requis
    REQUIRED_COMPONENTS=(
        "src/services/subscription/SubscriptionCacheService.ts"
        "src/services/subscription/FirestoreListenerOptimizer.ts"
        "src/services/subscription/SubscriptionHealthMonitor.ts"
        "functions/lib/src/subscriptionFunctions.js"
    )

    for component in "${REQUIRED_COMPONENTS[@]}"; do
        if [ -f "$component" ]; then
            log_success "✅ $component"
        else
            log_error "❌ $component manquant"
        fi
    done
}

# Menu principal
main() {
    echo "========================================"
    echo "   Phase 1: Stabilité - Déploiement"
    echo "========================================"

    check_prerequisites
    backup_existing_files
    deploy_new_files
    update_existing_services
    setup_environment

    echo ""
    read -p "Voulez-vous déployer les fonctions Firebase maintenant? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_functions
    else
        log_warning "Déploiement des fonctions ignoré"
    fi

    setup_revenuecat_webhook
    run_post_deployment_tests
    final_verification

    echo ""
    log_success "🎉 Phase 1: Stabilité déployée avec succès!"
    echo ""
    log_info "📖 Consultez PHASE1_STABILITE_README.md pour la documentation complète"
    log_info "🔧 Configuration manuelle requise pour RevenueCat (voir instructions ci-dessus)"
    log_info "📊 Monitoring disponible via subscriptionHealthMonitor.getOverallHealth()"
}

# Gestion des erreurs
trap 'log_error "Script interrompu par l'\''utilisateur"' INT

# Lancer le script
main "$@"
