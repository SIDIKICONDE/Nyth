#!/bin/bash

# =============================================================================
# Script de build C++20 pour Nyth - Production
# =============================================================================

set -e  # Sortir en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
BUILD_TYPE="Release"
BUILD_DIR="build-production"
SOURCE_DIR="shared"
INSTALL_DIR="dist/production"

# Fonction pour afficher les messages
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

    # Vérifier CMake
    if ! command -v cmake &> /dev/null; then
        log_error "CMake n'est pas installé. Veuillez l'installer."
        exit 1
    fi

    # Vérifier le compilateur C++
    if ! command -v g++ &> /dev/null && ! command -v clang++ &> /dev/null; then
        log_error "Aucun compilateur C++ trouvé. Installez g++ ou clang++."
        exit 1
    fi

    log_success "Prérequis vérifiés"
}

# Détecter la plateforme
detect_platform() {
    log_info "Détection de la plateforme..."

    if [[ "$OSTYPE" == "darwin"* ]]; then
        PLATFORM="macos"
        if [[ -n "$IOS_PLATFORM" ]]; then
            PLATFORM="ios"
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        PLATFORM="linux"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "mingw"* ]]; then
        PLATFORM="windows"
    else
        PLATFORM="unknown"
    fi

    log_info "Plateforme détectée: $PLATFORM"
}

# Configurer CMake
configure_cmake() {
    log_info "Configuration CMake pour $BUILD_TYPE..."

    # Créer le répertoire de build
    rm -rf "$BUILD_DIR"
    mkdir -p "$BUILD_DIR"
    cd "$BUILD_DIR"

    # Options CMake de base
    CMAKE_OPTIONS=(
        "-DCMAKE_BUILD_TYPE=$BUILD_TYPE"
        "-DCMAKE_INSTALL_PREFIX=$INSTALL_DIR"
        "-DBUILD_TESTS=OFF"
    )

    # Options spécifiques à la plateforme
    case $PLATFORM in
        "ios")
            CMAKE_OPTIONS+=(
                "-DCMAKE_SYSTEM_NAME=iOS"
                "-DCMAKE_OSX_ARCHITECTURES=arm64;x86_64"
                "-DCMAKE_OSX_DEPLOYMENT_TARGET=12.0"
                "-DCMAKE_XCODE_ATTRIBUTE_ONLY_ACTIVE_ARCH=NO"
            )
            ;;
        "macos")
            CMAKE_OPTIONS+=(
                "-DCMAKE_OSX_ARCHITECTURES=arm64;x86_64"
            )
            ;;
        "linux")
            CMAKE_OPTIONS+=(
                "-DCMAKE_C_COMPILER=gcc"
                "-DCMAKE_CXX_COMPILER=g++"
            )
            ;;
        "windows")
            CMAKE_OPTIONS+=(
                "-G" "Visual Studio 17 2022"
                "-A" "x64"
            )
            ;;
    esac

    # Configuration CMake
    cmake "${CMAKE_OPTIONS[@]}" "../$SOURCE_DIR"

    if [ $? -eq 0 ]; then
        log_success "Configuration CMake réussie"
    else
        log_error "Échec de la configuration CMake"
        exit 1
    fi

    cd ..
}

# Compiler le projet
build_project() {
    log_info "Compilation en cours..."

    cd "$BUILD_DIR"

    # Nombre de cœurs pour le build parallèle
    if [[ "$OSTYPE" == "darwin"* ]]; then
        JOBS=$(sysctl -n hw.ncpu)
    else
        JOBS=$(nproc)
    fi

    # Compilation
    cmake --build . --config $BUILD_TYPE --parallel $JOBS

    if [ $? -eq 0 ]; then
        log_success "Compilation réussie"
    else
        log_error "Échec de la compilation"
        exit 1
    fi

    cd ..
}

# Installer les bibliothèques
install_libraries() {
    log_info "Installation des bibliothèques..."

    cd "$BUILD_DIR"

    # Installation
    cmake --install . --config $BUILD_TYPE

    if [ $? -eq 0 ]; then
        log_success "Installation réussie dans $INSTALL_DIR"
    else
        log_error "Échec de l'installation"
        exit 1
    fi

    cd ..
}

# Vérifier les dépendances
check_dependencies() {
    log_info "Vérification des dépendances..."

    # Vérifier FFmpeg
    if [[ "$PLATFORM" == "ios" ]] || [[ "$PLATFORM" == "macos" ]]; then
        FFMPEG_PATH="ios/FFmpeg"
        if [ -d "$FFMPEG_PATH" ]; then
            log_success "FFmpeg iOS trouvé: $FFMPEG_PATH"
        else
            log_warning "FFmpeg iOS non trouvé. Téléchargez FFmpeg depuis le guide iOS."
        fi
    else
        if command -v ffmpeg &> /dev/null; then
            log_success "FFmpeg système trouvé"
        else
            log_warning "FFmpeg non trouvé. Installez FFmpeg pour les fonctionnalités de filtres."
        fi
    fi

    # Vérifier OpenGL
    case $PLATFORM in
        "linux")
            if pkg-config --exists gl; then
                log_success "OpenGL trouvé"
            else
                log_warning "OpenGL non trouvé. Installez les packages de développement OpenGL."
            fi
            ;;
        "macos")
            log_success "OpenGL inclus dans macOS"
            ;;
        "ios")
            log_success "OpenGL ES inclus dans iOS"
            ;;
        "windows")
            log_success "OpenGL disponible sur Windows"
            ;;
    esac
}

# Nettoyer les fichiers temporaires
cleanup() {
    log_info "Nettoyage des fichiers temporaires..."

    # Supprimer les fichiers objet et temporaires
    find . -name "*.o" -delete
    find . -name "*.obj" -delete
    find . -name "*.a" -delete
    find . -name "*.lib" -delete
    find . -name "*.so" -delete
    find . -name "*.dylib" -delete
    find . -name "*.dll" -delete

    log_success "Nettoyage terminé"
}

# Afficher l'aide
show_help() {
    echo "Script de build C++20 pour Nyth - Production"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help          Afficher cette aide"
    echo "  -d, --debug         Build en mode Debug"
    echo "  -r, --release       Build en mode Release (défaut)"
    echo "  -c, --clean         Nettoyer avant le build"
    echo "  -i, --install-only  Seulement installer (pas compiler)"
    echo "  --ios               Build pour iOS"
    echo "  --android           Build pour Android"
    echo "  --tests             Inclure les tests unitaires"
    echo ""
    echo "Exemples:"
    echo "  $0                  # Build Release standard"
    echo "  $0 --debug          # Build Debug"
    echo "  $0 --clean          # Nettoyer et rebuild"
    echo "  $0 --ios            # Build pour iOS"
}

# Parser les arguments
BUILD_TESTS=false
CLEAN=false
INSTALL_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -d|--debug)
            BUILD_TYPE="Debug"
            shift
            ;;
        -r|--release)
            BUILD_TYPE="Release"
            shift
            ;;
        -c|--clean)
            CLEAN=true
            shift
            ;;
        -i|--install-only)
            INSTALL_ONLY=true
            shift
            ;;
        --ios)
            export IOS_PLATFORM=1
            shift
            ;;
        --android)
            PLATFORM="android"
            shift
            ;;
        --tests)
            BUILD_TESTS=true
            shift
            ;;
        *)
            log_error "Option inconnue: $1"
            show_help
            exit 1
            ;;
    esac
done

# Exécution principale
main() {
    echo -e "${GREEN}"
    echo "=========================================="
    echo "  🚀 Build C++20 Nyth - Production"
    echo "=========================================="
    echo -e "${NC}"

    log_info "Build Type: $BUILD_TYPE"
    log_info "Platform: $PLATFORM"
    log_info "Build Tests: $BUILD_TESTS"

    # Nettoyer si demandé
    if [ "$CLEAN" = true ]; then
        log_info "Nettoyage demandé..."
        rm -rf "$BUILD_DIR"
        rm -rf "$INSTALL_DIR"
        cleanup
    fi

    # Vérifications préalables
    check_prerequisites
    detect_platform
    check_dependencies

    # Build ou installation seulement
    if [ "$INSTALL_ONLY" = false ]; then
        configure_cmake
        build_project
    fi

    install_libraries

    echo -e "${GREEN}"
    echo "=========================================="
    echo "  ✅ Build terminé avec succès !"
    echo "=========================================="
    echo -e "${NC}"

    log_info "Bibliothèques installées dans: $INSTALL_DIR"
    log_info "Build terminé le: $(date)"

    if [ -d "$INSTALL_DIR/lib" ]; then
        log_info "Bibliothèques générées:"
        ls -la "$INSTALL_DIR/lib/"
    fi
}

# Lancer le script
main "$@"
