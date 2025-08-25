#!/bin/bash

# Script de validation rapide pour CI/CD
# Vérifie l'intégration du module FFT

set -e

echo "🔍 Validation rapide de l'intégration FFT pour CI"
echo "==============================================="

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Test 1: Vérification des fichiers critiques
test_files_exist() {
    echo "📁 Test: Fichiers critiques présents"

    local critical_files=(
        "shared/Audio/fft/NativeAudioSpectrumModule.h"
        "shared/Audio/fft/NativeAudioSpectrumModule.cpp"
        "shared/Audio/fft/managers/SpectrumManager.h"
        "shared/Audio/fft/managers/SpectrumManager.cpp"
        "shared/Audio/fft/config/SpectrumConfig.h"
        "specs/NativeAudioSpectrumModule.ts"
    )

    for file in "${critical_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "Fichier critique manquant: $file"
            return 1
        fi
    done

    log_success "Tous les fichiers critiques sont présents"
    return 0
}

# Test 2: Vérification des corrections de compilation
test_compilation_fixes() {
    echo "🔧 Test: Corrections de compilation appliquées"

    # Vérifier l'absence de using declarations problématiques
    if grep -q "^using [A-Z]" shared/Audio/fft/NativeAudioSpectrumModule.cpp; then
        log_error "Using declarations non qualifiés présents"
        return 1
    fi

    # Vérifier les appels qualifiés
    if grep -q "return stateToString(state);" shared/Audio/fft/NativeAudioSpectrumModule.cpp; then
        log_error "Appel récursif stateToString non corrigé"
        return 1
    fi

    if grep -q "return errorToString(error);" shared/Audio/fft/NativeAudioSpectrumModule.cpp; then
        log_error "Appel récursif errorToString non corrigé"
        return 1
    fi

    # Vérifier ArrayView correctement initialisé
    if ! grep -q "Nyth::Audio::ArrayView<float>(magnitudesBuffer_.data(), config_.numBands)" shared/Audio/fft/managers/SpectrumManager.cpp; then
        log_error "ArrayView magnitudes mal initialisé"
        return 1
    fi

    log_success "Corrections de compilation validées"
    return 0
}

# Test 3: Vérification de l'API JSI
test_jsi_api() {
    echo "🔗 Test: API JSI correctement exposée"

    local module_file="shared/Audio/fft/NativeAudioSpectrumModule.cpp"

    # Vérifier que getState renvoie un nombre
    if ! grep -q "return jsi::Value(static_cast<int>(currentState_.load()));" "$module_file"; then
        log_error "getState ne renvoie pas un nombre"
        return 1
    fi

    # Vérifier que processAudioBuffer renvoie un booléen
    if ! grep -q "return jsi::Value(success);" "$module_file"; then
        log_error "processAudioBuffer ne renvoie pas un booléen"
        return 1
    fi

    # Vérifier dispose alias
    if ! grep -q 'return module->release(rt);' "$module_file"; then
        log_error "dispose n'est pas un alias de release"
        return 1
    fi

    # Vérifier validateConfig exposé
    if ! grep -q 'validateConfig.*module->validateConfig' "$module_file"; then
        log_error "validateConfig non exposé"
        return 1
    fi

    log_success "API JSI correctement exposée"
    return 0
}

# Test 4: Vérification des callbacks
test_callbacks() {
    echo "📡 Test: Callbacks correctement implémentés"

    local module_file="shared/Audio/fft/NativeAudioSpectrumModule.cpp"

    # Vérifier callback error avec 2 arguments
    if ! grep -q "jsi::Value(static_cast<int>(error))," "$module_file"; then
        log_error "Callback error n'a pas 2 arguments"
        return 1
    fi

    # Vérifier callback stateChange avec 2 arguments
    if ! grep -q "jsi::Value(static_cast<int>(oldState))," "$module_file"; then
        log_error "Callback stateChange n'a pas 2 arguments"
        return 1
    fi

    # Vérifier JSICallbackManager support multi-args
    if ! grep -q "args.size() == 2" shared/Audio/common/jsi/JSICallbackManager.cpp; then
        log_error "JSICallbackManager ne supporte pas 2 arguments"
        return 1
    fi

    log_success "Callbacks correctement implémentés"
    return 0
}

# Test 5: Vérification des includes
test_includes() {
    echo "📋 Test: Includes correctement corrigés"

    # Vérifier include JSICallbackManager
    if grep -q '"../../../common/jsi/JSICallbackManager.h"' shared/Audio/fft/NativeAudioSpectrumModule.h; then
        log_error "Include JSICallbackManager incorrect"
        return 1
    fi

    if ! grep -q '"../common/jsi/JSICallbackManager.h"' shared/Audio/fft/NativeAudioSpectrumModule.h; then
        log_error "Include JSICallbackManager manquant ou incorrect"
        return 1
    fi

    # Vérifier include FFTEngine
    if grep -q '"../../../common/dsp/FFTEngine.hpp"' shared/Audio/fft/components/SpectrumComponentFactory.cpp; then
        log_error "Include FFTEngine incorrect"
        return 1
    fi

    log_success "Includes correctement corrigés"
    return 0
}

# Test 6: Vérification iOS
test_ios() {
    echo "🍎 Test: Intégration iOS"

    local provider_file="ios/Nyth/NativeModuleProvider.mm"

    if [[ ! -f "$provider_file" ]]; then
        log_warning "Fichier iOS non trouvé, test ignoré"
        return 0
    fi

    # Vérifier absence d'include vide
    if grep -q "#include $" "$provider_file"; then
        log_error "Include vide trouvé dans NativeModuleProvider.mm"
        return 1
    fi

    # Vérifier include vector présent
    if ! grep -q "#include <vector>" "$provider_file"; then
        log_error "Include <vector> manquant"
        return 1
    fi

    log_success "Intégration iOS validée"
    return 0
}

# Test 7: Vérification Android
test_android() {
    echo "🤖 Test: Intégration Android"

    local cmake_file="android/app/src/main/jni/CMakeLists.txt"

    if [[ ! -f "$cmake_file" ]]; then
        log_warning "CMakeLists.txt Android non trouvé, test ignoré"
        return 0
    fi

    # Vérifier FFTEngine référencé
    if ! grep -q "FFTEngine.hpp" "$cmake_file"; then
        log_error "FFTEngine.hpp non référencé dans CMakeLists.txt"
        return 1
    fi

    log_success "Intégration Android validée"
    return 0
}

# Test 8: Validation TypeScript
test_typescript() {
    echo "📘 Test: Interface TypeScript cohérente"

    local spec_file="specs/NativeAudioSpectrumModule.ts"

    if [[ ! -f "$spec_file" ]]; then
        log_warning "Spec TS non trouvée, test ignoré"
        return 0
    fi

    # Vérifier les fonctions critiques
    local required_functions=("initialize" "getState" "processAudioBuffer" "dispose" "getSpectrumData")

    for func in "${required_functions[@]}"; do
        if ! grep -q " $func(" "$spec_file"; then
            log_error "Fonction manquante dans spec TS: $func"
            return 1
        fi
    done

    log_success "Interface TypeScript cohérente"
    return 0
}

# Fonction principale
main() {
    echo "🚀 Validation d'intégration FFT pour CI/CD"
    echo ""

    local tests_passed=0
    local total_tests=8

    # Exécuter tous les tests
    local test_functions=(
        test_files_exist
        test_compilation_fixes
        test_jsi_api
        test_callbacks
        test_includes
        test_ios
        test_android
        test_typescript
    )

    for test_func in "${test_functions[@]}"; do
        if $test_func; then
            ((tests_passed++))
        else
            log_error "Test échoué: $test_func"
        fi
        echo ""
    done

    # Résultat final
    echo "📊 Résultats: $tests_passed/$total_tests tests passés"

    if [[ $tests_passed -eq $total_tests ]]; then
        log_success "🎉 Toutes les validations sont passées !"
        log_success "Le module FFT est prêt pour l'intégration CI/CD"
        return 0
    else
        log_error "Certaines validations ont échoué"
        log_warning "Vérifiez les erreurs ci-dessus avant l'intégration"
        return 1
    fi
}

# Exécution
main "$@"
