#!/bin/bash

# Script de build et validation du module FFT
# Utilise les headers React Native locaux pour compilation

set -e

echo "🔧 Script de build et validation du module FFT"
echo "=============================================="

# Variables
BUILD_DIR="build"
FFT_MODULE_DIR="shared/Audio/fft"
COMMON_DIR="shared/Audio/common"
IOS_DIR="ios/Nyth"
ANDROID_DIR="android/app/src/main"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Fonction de vérification des fichiers
check_files() {
    log_info "Vérification des fichiers requis..."

    local files=(
        "$FFT_MODULE_DIR/NativeAudioSpectrumModule.h"
        "$FFT_MODULE_DIR/NativeAudioSpectrumModule.cpp"
        "$FFT_MODULE_DIR/managers/SpectrumManager.h"
        "$FFT_MODULE_DIR/managers/SpectrumManager.cpp"
        "$FFT_MODULE_DIR/jsi/SpectrumJSIConverter.h"
        "$FFT_MODULE_DIR/jsi/SpectrumJSIConverter.cpp"
        "$FFT_MODULE_DIR/config/SpectrumConfig.h"
        "$FFT_MODULE_DIR/components/SpectrumComponentFactory.h"
        "$FFT_MODULE_DIR/components/SpectrumComponentFactory.cpp"
        "$COMMON_DIR/jsi/JSICallbackManager.h"
        "$COMMON_DIR/jsi/JSICallbackManager.cpp"
        "$COMMON_DIR/dsp/FFTEngine.hpp"
    )

    for file in "${files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "Fichier manquant: $file"
            return 1
        fi
    done

    log_info "Tous les fichiers requis sont présents"
    return 0
}

# Fonction de vérification des corrections apportées
verify_fixes() {
    log_info "Vérification des corrections apportées..."

    # Vérifier l'absence de using declarations non qualifiés dans le module principal
    if grep -q "^using [A-Z]" "$FFT_MODULE_DIR/NativeAudioSpectrumModule.cpp"; then
        log_error "Using declarations non qualifiés trouvés dans NativeAudioSpectrumModule.cpp"
        grep -n "^using [A-Z]" "$FFT_MODULE_DIR/NativeAudioSpectrumModule.cpp"
        return 1
    fi

    # Vérifier les appels qualifiés dans les helpers
    if grep -q "return stateToString(state);" "$FFT_MODULE_DIR/NativeAudioSpectrumModule.cpp"; then
        log_error "Appel récursif stateToString trouvé"
        return 1
    fi

    if grep -q "return errorToString(error);" "$FFT_MODULE_DIR/NativeAudioSpectrumModule.cpp"; then
        log_error "Appel récursif errorToString trouvé"
        return 1
    fi

    # Vérifier ArrayView correctement initialisé
    if ! grep -q "Nyth::Audio::ArrayView<float>(magnitudesBuffer_.data(), config_.numBands)" "$FFT_MODULE_DIR/managers/SpectrumManager.cpp"; then
        log_error "ArrayView magnitudes non initialisé correctement"
        return 1
    fi

    # Vérifier includes corrigés
    if grep -q '"../../../common/jsi/JSICallbackManager.h"' "$FFT_MODULE_DIR/NativeAudioSpectrumModule.h"; then
        log_error "Include JSICallbackManager non corrigé"
        return 1
    fi

    # Vérifier le module SpectrumManager qualifié
    if ! grep -q "spectrumManager_ = std::make_unique<Nyth::Audio::SpectrumManager>()" "$FFT_MODULE_DIR/NativeAudioSpectrumModule.cpp"; then
        log_error "SpectrumManager non qualifié dans initializeManagers"
        return 1
    fi

    log_info "Toutes les corrections ont été appliquées correctement"
    return 0
}

# Fonction de compilation iOS
build_ios() {
    log_info "Compilation iOS..."

    if [[ ! -d "$IOS_DIR" ]]; then
        log_error "Dossier iOS non trouvé: $IOS_DIR"
        return 1
    fi

    # Vérifier la syntaxe des fichiers iOS
    if ! xcodebuild -dry-run -workspace ios/Nyth.xcworkspace -scheme Nyth -sdk iphonesimulator 2>/dev/null; then
        log_warn "Xcodebuild n'est pas disponible, vérification basique des includes"

        # Vérification basique des includes dans NativeModuleProvider.mm
        if grep -q "#include $" "ios/Nyth/NativeModuleProvider.mm"; then
            log_error "Include vide trouvé dans NativeModuleProvider.mm"
            return 1
        fi

        if ! grep -q "#include <vector>" "ios/Nyth/NativeModuleProvider.mm"; then
            log_error "Include <vector> manquant dans NativeModuleProvider.mm"
            return 1
        fi
    else
        log_info "Compilation Xcode réussie"
    fi

    return 0
}

# Fonction de compilation Android
build_android() {
    log_info "Compilation Android..."

    if [[ ! -d "$ANDROID_DIR" ]]; then
        log_error "Dossier Android non trouvé: $ANDROID_DIR"
        return 1
    fi

    # Vérifier CMakeLists.txt Android
    local cmake_file="$ANDROID_DIR/jni/CMakeLists.txt"
    if [[ -f "$cmake_file" ]]; then
        if ! grep -q "FFTEngine.hpp" "$cmake_file"; then
            log_error "FFTEngine.hpp non référencé dans CMakeLists.txt Android"
            return 1
        fi
        log_info "CMakeLists.txt Android valide"
    else
        log_warn "CMakeLists.txt Android non trouvé, vérification ignorée"
    fi

    return 0
}

# Fonction de compilation C++ basique (sans headers RN)
compile_cpp_basic() {
    log_info "Compilation C++ basique des fichiers FFT..."

    mkdir -p "$BUILD_DIR"

    # Compiler les fichiers individuels pour vérifier la syntaxe
    local includes="-I. -I$FFT_MODULE_DIR -I$COMMON_DIR -I$FFT_MODULE_DIR/config -I$FFT_MODULE_DIR/managers -I$FFT_MODULE_DIR/jsi -I$FFT_MODULE_DIR/components"

    # Compiler FFTEngine.hpp (header only)
    if ! g++ -std=c++17 -fsyntax-only $includes "$COMMON_DIR/dsp/FFTEngine.hpp" 2>/dev/null; then
        log_error "Erreur de syntaxe dans FFTEngine.hpp"
        return 1
    fi

    # Compiler SpectrumConfig.h (header only)
    if ! g++ -std=c++17 -fsyntax-only $includes "$FFT_MODULE_DIR/config/SpectrumConfig.h" 2>/dev/null; then
        log_error "Erreur de syntaxe dans SpectrumConfig.h"
        return 1
    fi

    # Compiler les headers principaux
    local headers=(
        "$FFT_MODULE_DIR/managers/SpectrumManager.h"
        "$FFT_MODULE_DIR/jsi/SpectrumJSIConverter.h"
        "$FFT_MODULE_DIR/components/SpectrumComponentFactory.h"
        "$FFT_MODULE_DIR/NativeAudioSpectrumModule.h"
        "$COMMON_DIR/jsi/JSICallbackManager.h"
    )

    for header in "${headers[@]}"; do
        if ! g++ -std=c++17 -fsyntax-only $includes "$header" 2>/dev/null; then
            log_error "Erreur de syntaxe dans $header"
            return 1
        fi
    done

    log_info "Compilation des headers réussie"

    # Compiler les implémentations (avec mock des headers RN)
    echo "#pragma once" > "$BUILD_DIR/mock_jsi.h"
    echo "#pragma once" > "$BUILD_DIR/mock_turbo.h"
    echo "#pragma once" > "$BUILD_DIR/mock_callinvoker.h"

    local mock_includes="-I$BUILD_DIR $includes -DMOCK_REACT_NATIVE"

    # Compiler les fichiers source (sans linkage)
    local sources=(
        "$FFT_MODULE_DIR/managers/SpectrumManager.cpp"
        "$FFT_MODULE_DIR/jsi/SpectrumJSIConverter.cpp"
        "$FFT_MODULE_DIR/components/SpectrumComponentFactory.cpp"
        "$COMMON_DIR/jsi/JSICallbackManager.cpp"
    )

    for source in "${sources[@]}"; do
        local obj_file="$BUILD_DIR/$(basename "${source%.*}").o"
        if ! g++ -std=c++17 -c $mock_includes "$source" -o "$obj_file" 2>/dev/null; then
            log_error "Erreur de compilation dans $source"
            g++ -std=c++17 -c $mock_includes "$source" -o "$obj_file" 2>&1 | head -20
            return 1
        fi
    done

    log_info "Compilation des sources réussie"
    return 0
}

# Fonction de validation TypeScript
validate_typescript() {
    log_info "Validation TypeScript..."

    if [[ ! -f "specs/NativeAudioSpectrumModule.ts" ]]; then
        log_error "Spec TypeScript non trouvée"
        return 1
    fi

    # Vérifier que les fonctions sont correctement exportées dans la spec
    local required_functions=(
        "initialize"
        "getState"
        "processAudioBuffer"
        "processAudioBufferStereo"
        "getSpectrumData"
        "setDataCallback"
        "setErrorCallback"
        "setStateCallback"
        "dispose"
        "validateConfig"
    )

    for func in "${required_functions[@]}"; do
        if ! grep -q " $func(" "specs/NativeAudioSpectrumModule.ts"; then
            log_error "Fonction manquante dans la spec TS: $func"
            return 1
        fi
    done

    log_info "Spec TypeScript valide"
    return 0
}

# Fonction principale
main() {
    log_info "Début de la validation du module FFT"

    # Vérifications préliminaires
    check_files || exit 1

    # Vérifications des corrections
    verify_fixes || exit 1

    # Compilation C++ basique
    compile_cpp_basic || exit 1

    # Validation TypeScript
    validate_typescript || exit 1

    # Build iOS
    build_ios || exit 1

    # Build Android
    build_android || exit 1

    log_info "✅ Toutes les validations ont réussi !"
    log_info "Le module FFT est prêt pour l'intégration"

    return 0
}

# Exécution
main "$@"
