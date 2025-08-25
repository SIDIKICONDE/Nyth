#!/bin/bash

# Script de test complet pour la bibliothèque SIMD
# Usage: ./run_simd_tests.sh [option]

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 SIMD Comprehensive Test Suite"
echo "================================="

# Fonction pour vérifier les prérequis
check_prerequisites() {
    echo "🔍 Vérification des prérequis..."

    # Vérifier CMake
    if ! command -v cmake &> /dev/null; then
        echo "❌ CMake non trouvé. Veuillez installer CMake."
        exit 1
    fi

    # Vérifier le compilateur C++
    if ! command -v g++ &> /dev/null && ! command -v clang++ &> /dev/null; then
        echo "❌ Aucun compilateur C++ trouvé (g++ ou clang++)."
        exit 1
    fi

    echo "✅ Prérequis OK"
}

# Fonction pour configurer et compiler
build_tests() {
    echo "🔨 Configuration et compilation..."

    cd "$SCRIPT_DIR"

    # Créer répertoire de build
    mkdir -p build
    cd build

    # Configurer avec CMake
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        cmake .. -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_COMPILER=clang++
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        cmake .. -DCMAKE_BUILD_TYPE=Release
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows
        cmake .. -DCMAKE_BUILD_TYPE=Release -G "Unix Makefiles"
    else
        cmake .. -DCMAKE_BUILD_TYPE=Release
    fi

    # Compiler
    make -j$(nproc 2>/dev/null || echo 4)

    echo "✅ Compilation terminée"
}

# Fonction pour exécuter les tests
run_tests() {
    echo "🧪 Exécution des tests..."

    cd "$SCRIPT_DIR/build"

    if [[ -f "./simd_tests" ]]; then
        ./simd_tests
    else
        echo "❌ Exécutable non trouvé. Compilation nécessaire."
        exit 1
    fi
}

# Fonction pour benchmark
run_benchmark() {
    echo "📊 Exécution des benchmarks..."

    cd "$SCRIPT_DIR/build"

    if [[ -f "./simd_tests" ]]; then
        echo "=== BENCHMARK MODE ===" >> benchmark_results.txt
        date >> benchmark_results.txt
        ./simd_tests >> benchmark_results.txt 2>&1
        echo "✅ Résultats sauvegardés dans build/benchmark_results.txt"
    else
        echo "❌ Exécutable non trouvé. Compilation nécessaire."
        exit 1
    fi
}

# Fonction pour nettoyer
clean_build() {
    echo "🧹 Nettoyage..."

    cd "$SCRIPT_DIR"
    rm -rf build/
    rm -f *.log

    echo "✅ Nettoyage terminé"
}

# Fonction pour afficher l'aide
show_help() {
    echo "Usage: $0 [option]"
    echo ""
    echo "Options:"
    echo "  build     - Configurer et compiler les tests"
    echo "  test      - Exécuter les tests complets"
    echo "  bench     - Exécuter les benchmarks de performance"
    echo "  clean     - Nettoyer les fichiers de compilation"
    echo "  all       - Effectuer build + test + bench"
    echo "  help      - Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  $0 all           # Tout faire (build, test, benchmark)"
    echo "  $0 test          # Juste exécuter les tests"
    echo "  $0 bench         # Juste les benchmarks"
}

# Fonction principale
main() {
    local option=${1:-all}

    case $option in
        "build")
            check_prerequisites
            build_tests
            ;;
        "test")
            run_tests
            ;;
        "bench")
            run_benchmark
            ;;
        "clean")
            clean_build
            ;;
        "all")
            check_prerequisites
            build_tests
            run_tests
            run_benchmark
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Exécuter la fonction principale
main "$@"
