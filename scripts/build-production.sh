#!/bin/bash

# Build script optimisé pour la production
# Utilise les configurations de production pour Android et iOS

set -e  # Arrêter en cas d'erreur

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_TYPE="Release"
ENABLE_PROFILING=false
CLEAN_BUILD=false
SKIP_TESTS=false

# Fonctions utilitaires
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

# Afficher l'aide
show_help() {
    cat << EOF
Build Script de Production pour Nyth

Usage: $0 [OPTIONS]

Options:
    -h, --help          Afficher cette aide
    -c, --clean         Build propre (nettoie avant compilation)
    -p, --profile       Activer le profiling
    -t, --skip-tests    Ignorer les tests
    --android           Build Android uniquement
    --ios               Build iOS uniquement
    --debug             Build en mode Debug au lieu de Release

Variables d'environnement:
    FILTER_PRODUCTION_MODE=1    Activer le mode production (défaut)
    FILTER_CACHE_SIZE_MB=512    Taille du cache en MB
    FILTER_TARGET_FPS=60        FPS cible
    FILTER_MAX_THREADS=4        Nombre max de threads

Exemples:
    $0                          Build production complet
    $0 --clean --android        Build Android propre
    $0 --debug --profile        Build debug avec profiling
EOF
}

# Parser les arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -c|--clean)
            CLEAN_BUILD=true
            shift
            ;;
        -p|--profile)
            ENABLE_PROFILING=true
            shift
            ;;
        -t|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --android)
            BUILD_ANDROID_ONLY=true
            shift
            ;;
        --ios)
            BUILD_IOS_ONLY=true
            shift
            ;;
        --debug)
            BUILD_TYPE="Debug"
            shift
            ;;
        *)
            log_error "Option inconnue: $1"
            show_help
            exit 1
            ;;
    esac
done

# Configuration des variables d'environnement de production
setup_production_env() {
    log_info "Configuration de l'environnement de production..."
    
    export FILTER_PRODUCTION_MODE=1
    export FILTER_ENABLE_LOGGING=0
    export FILTER_CACHE_SIZE_MB=${FILTER_CACHE_SIZE_MB:-512}
    export FILTER_TARGET_FPS=${FILTER_TARGET_FPS:-60}
    export FILTER_MAX_THREADS=${FILTER_MAX_THREADS:-4}
    
    if [[ "$ENABLE_PROFILING" == "true" ]]; then
        export FILTER_ENABLE_LOGGING=1
        log_warning "Profiling activé - performances réduites"
    fi
    
    if [[ "$BUILD_TYPE" == "Debug" ]]; then
        export FILTER_PRODUCTION_MODE=0
        export FILTER_ENABLE_LOGGING=1
        log_warning "Build Debug - optimisations désactivées"
    fi
    
    log_success "Variables d'environnement configurées"
}

# Vérification des prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js non trouvé"
        exit 1
    fi
    
    # Vérifier React Native CLI
    if ! command -v npx &> /dev/null; then
        log_error "npx non trouvé"
        exit 1
    fi
    
    # Vérifier CMake
    if ! command -v cmake &> /dev/null; then
        log_error "CMake non trouvé"
        exit 1
    fi
    
    log_success "Prérequis vérifiés"
}

# Nettoyage des builds précédents
clean_builds() {
    if [[ "$CLEAN_BUILD" == "true" ]]; then
        log_info "Nettoyage des builds précédents..."
        
        # Android
        if [[ -d "$PROJECT_ROOT/android" ]]; then
            cd "$PROJECT_ROOT/android"
            ./gradlew clean || log_warning "Erreur nettoyage Android"
        fi
        
        # iOS
        if [[ -d "$PROJECT_ROOT/ios" ]]; then
            cd "$PROJECT_ROOT/ios"
            xcodebuild clean -workspace Nyth.xcworkspace -scheme Nyth || log_warning "Erreur nettoyage iOS"
        fi
        
        # Node modules
        cd "$PROJECT_ROOT"
        rm -rf node_modules
        npm install --production
        
        log_success "Nettoyage terminé"
    fi
}

# Build Android
build_android() {
    if [[ "$BUILD_IOS_ONLY" != "true" ]]; then
        log_info "Build Android ($BUILD_TYPE)..."
        
        cd "$PROJECT_ROOT/android"
        
        # Configuration Gradle pour production
        export ORG_GRADLE_PROJECT_enableProguardInReleaseBuilds=true
        export ORG_GRADLE_PROJECT_enableSeparateBuildPerCPUArchitecture=true
        export ORG_GRADLE_PROJECT_universalApk=false
        
        if [[ "$BUILD_TYPE" == "Release" ]]; then
            ./gradlew assembleRelease \
                -Pproduction=true \
                -PenableProguard=true \
                -PenableHermes=true \
                --parallel \
                --build-cache
        else
            ./gradlew assembleDebug \
                -Pproduction=false \
                -PenableProguard=false \
                --parallel
        fi
        
        log_success "Build Android terminé"
        
        # Afficher les APKs générés
        find "$PROJECT_ROOT/android/app/build/outputs/apk" -name "*.apk" -exec ls -lh {} \;
    fi
}

# Build iOS
build_ios() {
    if [[ "$BUILD_ANDROID_ONLY" != "true" ]] && [[ "$OSTYPE" == "darwin"* ]]; then
        log_info "Build iOS ($BUILD_TYPE)..."
        
        cd "$PROJECT_ROOT/ios"
        
        # Configuration pour production
        if [[ "$BUILD_TYPE" == "Release" ]]; then
            xcodebuild \
                -workspace Nyth.xcworkspace \
                -scheme Nyth \
                -configuration Release \
                -destination generic/platform=iOS \
                -archivePath "$PROJECT_ROOT/build/Nyth.xcarchive" \
                archive \
                ENABLE_BITCODE=NO \
                COMPILER_INDEX_STORE_ENABLE=NO \
                ONLY_ACTIVE_ARCH=NO
        else
            xcodebuild \
                -workspace Nyth.xcworkspace \
                -scheme Nyth \
                -configuration Debug \
                -destination generic/platform=iOS \
                build
        fi
        
        log_success "Build iOS terminé"
    elif [[ "$OSTYPE" != "darwin"* ]]; then
        log_warning "Build iOS ignoré (macOS requis)"
    fi
}

# Exécution des tests
run_tests() {
    if [[ "$SKIP_TESTS" != "true" ]]; then
        log_info "Exécution des tests..."
        
        cd "$PROJECT_ROOT"
        
        # Tests JavaScript
        npm test -- --watchAll=false --coverage=false
        
        # Tests natifs (si disponibles)
        if [[ -f "$PROJECT_ROOT/__tests__/cpp/run_tests.sh" ]]; then
            bash "$PROJECT_ROOT/__tests__/cpp/run_tests.sh"
        fi
        
        log_success "Tests terminés"
    fi
}

# Génération du rapport de build
generate_build_report() {
    log_info "Génération du rapport de build..."
    
    REPORT_FILE="$PROJECT_ROOT/build/production-report.txt"
    mkdir -p "$PROJECT_ROOT/build"
    
    cat > "$REPORT_FILE" << EOF
=== Rapport de Build Production ===
Date: $(date)
Type de Build: $BUILD_TYPE
Profiling: $ENABLE_PROFILING
Tests: $(if [[ "$SKIP_TESTS" == "true" ]]; then echo "Ignorés"; else echo "Exécutés"; fi)

=== Configuration ===
FILTER_PRODUCTION_MODE: $FILTER_PRODUCTION_MODE
FILTER_CACHE_SIZE_MB: $FILTER_CACHE_SIZE_MB
FILTER_TARGET_FPS: $FILTER_TARGET_FPS
FILTER_MAX_THREADS: $FILTER_MAX_THREADS

=== Artefacts Générés ===
EOF
    
    # Lister les artefacts Android
    if [[ -d "$PROJECT_ROOT/android/app/build/outputs/apk" ]]; then
        echo "Android APKs:" >> "$REPORT_FILE"
        find "$PROJECT_ROOT/android/app/build/outputs/apk" -name "*.apk" -exec ls -lh {} \; >> "$REPORT_FILE"
    fi
    
    # Lister les artefacts iOS
    if [[ -d "$PROJECT_ROOT/build" ]]; then
        echo "iOS Archives:" >> "$REPORT_FILE"
        find "$PROJECT_ROOT/build" -name "*.xcarchive" -exec ls -lh {} \; >> "$REPORT_FILE"
    fi
    
    log_success "Rapport généré: $REPORT_FILE"
}

# Fonction principale
main() {
    log_info "🚀 Début du build de production Nyth"
    log_info "Répertoire: $PROJECT_ROOT"
    log_info "Type: $BUILD_TYPE"
    
    setup_production_env
    check_prerequisites
    clean_builds
    run_tests
    build_android
    build_ios
    generate_build_report
    
    log_success "✅ Build de production terminé avec succès!"
    
    if [[ -f "$PROJECT_ROOT/build/production-report.txt" ]]; then
        log_info "📊 Rapport disponible: build/production-report.txt"
    fi
}

# Exécution
main "$@"
