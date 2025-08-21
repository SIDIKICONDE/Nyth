#!/bin/bash

# Script de lancement de la suite de tests AudioEqualizer
# Ce script automatise la compilation et l'exécution des tests avec différentes options

set -e  # Exit on any error

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BUILD_DIR="${PROJECT_ROOT}/build/audio_tests"
SOURCE_DIR="${PROJECT_ROOT}/__tests__/audio"
REPORT_DIR="${PROJECT_ROOT}/test_reports"

# Couleurs pour la sortie
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

show_banner() {
    echo -e "${BLUE}"
    echo "======================================"
    echo "  🎵 AudioEqualizer Test Suite"
    echo "======================================"
    echo -e "${NC}"
}

check_dependencies() {
    log_info "Checking dependencies..."

    # Vérifier CMake
    if ! command -v cmake &> /dev/null; then
        log_error "CMake is not installed. Please install it first."
        exit 1
    fi

    # Vérifier C++ compiler
    if ! command -v g++ &> /dev/null && ! command -v clang++ &> /dev/null; then
        log_error "No C++ compiler found. Please install g++ or clang++."
        exit 1
    fi

    log_success "Dependencies OK"
}

setup_build_dir() {
    log_info "Setting up build directory..."

    # Créer les répertoires nécessaires
    mkdir -p "${BUILD_DIR}"
    mkdir -p "${REPORT_DIR}"

    # Nettoyer le build précédent si demandé
    if [ "$1" = "clean" ]; then
        log_info "Cleaning previous build..."
        rm -rf "${BUILD_DIR}"/*
    fi

    log_success "Build directory ready: ${BUILD_DIR}"
}

configure_cmake() {
    log_info "Configuring CMake..."

    cd "${BUILD_DIR}"

    # Options CMake
    CMAKE_OPTIONS=(
        -DCMAKE_BUILD_TYPE="${BUILD_TYPE:-Release}"
        -DENABLE_SIMD_TESTS=ON
        -DENABLE_MEMORY_TESTS=OFF
        -DCMAKE_CXX_FLAGS="${CMAKE_CXX_FLAGS:-}"
    )

    # Configuration spécifique à la plateforme
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        CMAKE_OPTIONS+=(-DCMAKE_CXX_FLAGS="${CMAKE_CXX_FLAGS} -march=native")
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        CMAKE_OPTIONS+=(-DCMAKE_CXX_FLAGS="${CMAKE_CXX_FLAGS} -mcpu=apple-m1" 2>/dev/null || true)
    fi

    # Configurer
    if ! cmake "${CMAKE_OPTIONS[@]}" "${SOURCE_DIR}"; then
        log_error "CMake configuration failed"
        exit 1
    fi

    log_success "CMake configuration complete"
}

build_tests() {
    log_info "Building tests..."

    cd "${BUILD_DIR}"

    # Compiler
    if ! make -j$(nproc 2>/dev/null || echo 4); then
        log_error "Build failed"
        exit 1
    fi

    # Vérifier que l'exécutable existe
    if [ ! -f "./audio_tests" ]; then
        log_error "Test executable not found"
        exit 1
    fi

    log_success "Build complete"
}

run_tests() {
    log_info "Running tests..."

    cd "${BUILD_DIR}"

    # Options par défaut pour les tests
    TEST_OPTIONS=(
        --gtest_color=yes
        --gtest_output=xml:"${REPORT_DIR}/audio_tests.xml"
    )

    # Ajouter les options spécifiques
    if [ -n "${GTEST_FILTER}" ]; then
        TEST_OPTIONS+=(--gtest_filter="${GTEST_FILTER}")
    fi

    if [ "${GTEST_SHUFFLE}" = "1" ]; then
        TEST_OPTIONS+=(--gtest_shuffle)
    fi

    if [ -n "${GTEST_REPEAT}" ]; then
        TEST_OPTIONS+=(--gtest_repeat="${GTEST_REPEAT}")
    fi

    # Exécuter les tests
    echo "Test options: ${TEST_OPTIONS[*]}"
    if ./audio_tests "${TEST_OPTIONS[@]}"; then
        log_success "All tests passed!"
        return 0
    else
        local EXIT_CODE=$?
        log_error "Some tests failed (exit code: ${EXIT_CODE})"
        return ${EXIT_CODE}
    fi
}

run_performance_tests() {
    log_info "Running performance tests..."

    cd "${BUILD_DIR}"

    # Tests de performance uniquement
    GTEST_FILTER="*Performance*" ./audio_tests \
        --gtest_color=yes \
        --gtest_output=xml:"${REPORT_DIR}/performance_tests.xml"

    log_success "Performance tests complete"
}

run_memory_tests() {
    log_info "Running memory tests with Valgrind..."

    cd "${BUILD_DIR}"

    # Vérifier que Valgrind est installé
    if ! command -v valgrind &> /dev/null; then
        log_warning "Valgrind not found, skipping memory tests"
        return 0
    fi

    # Exécuter avec Valgrind
    valgrind --tool=memcheck \
             --leak-check=full \
             --track-origins=yes \
             --verbose \
             --xml=yes \
             --xml-file="${REPORT_DIR}/memcheck.xml" \
             ./audio_tests --gtest_filter="*Memory*" \
             2>&1 | tee "${REPORT_DIR}/valgrind.log"

    log_success "Memory tests complete"
}

generate_report() {
    log_info "Generating test report..."

    # Vérifier que xsltproc est installé pour le rapport HTML
    if command -v xsltproc &> /dev/null && [ -f "${REPORT_DIR}/audio_tests.xml" ]; then
        # Générer un rapport HTML simple
        cat > "${REPORT_DIR}/report.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>AudioEqualizer Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .pass { color: green; }
        .fail { color: red; }
        .test { margin: 10px 0; padding: 10px; border-left: 4px solid #ccc; }
        .test.passed { border-left-color: green; }
        .test.failed { border-left-color: red; }
        h1 { color: #333; }
        .summary { background: #f0f0f0; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>🎵 AudioEqualizer Test Report</h1>
    <div class="summary">
        <h2>Test Summary</h2>
        <p>Report generated on: $(date)</p>
        <p>Build type: ${BUILD_TYPE:-Release}</p>
    </div>
    <pre>
EOF

        # Ajouter les résultats des tests
        if [ -f "${REPORT_DIR}/audio_tests.xml" ]; then
            echo "XML Report available: ${REPORT_DIR}/audio_tests.xml"
        fi

        echo "</pre></body></html>" >> "${REPORT_DIR}/report.html"

        log_success "HTML report generated: ${REPORT_DIR}/report.html"
    else
        log_warning "xsltproc not available, skipping HTML report generation"
    fi
}

show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -c, --clean         Clean build directory before building"
    echo "  -b, --build-only    Build tests without running them"
    echo "  -p, --performance   Run only performance tests"
    echo "  -m, --memory        Run memory tests with Valgrind"
    echo "  -r, --repeat N      Repeat tests N times"
    echo "  -s, --shuffle       Shuffle test order"
    echo "  -f, --filter FILTER GTest filter expression"
    echo "  --release          Build in Release mode (default)"
    echo "  --debug            Build in Debug mode"
    echo ""
    echo "Examples:"
    echo "  $0                  # Build and run all tests"
    echo "  $0 -c               # Clean build and run all tests"
    echo "  $0 -p               # Run only performance tests"
    echo "  $0 -f '*Equalizer*' # Run only equalizer tests"
    echo "  $0 -m               # Run memory tests"
}

# Variables globales
BUILD_TYPE="Release"
CLEAN_BUILD=false
BUILD_ONLY=false
RUN_PERFORMANCE=false
RUN_MEMORY=false

# Parser les arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -c|--clean)
            CLEAN_BUILD=true
            shift
            ;;
        -b|--build-only)
            BUILD_ONLY=true
            shift
            ;;
        -p|--performance)
            RUN_PERFORMANCE=true
            shift
            ;;
        -m|--memory)
            RUN_MEMORY=true
            shift
            ;;
        -r|--repeat)
            GTEST_REPEAT="$2"
            shift 2
            ;;
        -s|--shuffle)
            GTEST_SHUFFLE="1"
            shift
            ;;
        -f|--filter)
            GTEST_FILTER="$2"
            shift 2
            ;;
        --release)
            BUILD_TYPE="Release"
            shift
            ;;
        --debug)
            BUILD_TYPE="Debug"
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Fonction principale
main() {
    show_banner

    log_info "Starting AudioEqualizer test suite..."
    log_info "Build type: ${BUILD_TYPE}"
    log_info "Source directory: ${SOURCE_DIR}"
    log_info "Build directory: ${BUILD_DIR}"
    log_info "Report directory: ${REPORT_DIR}"

    # Vérifier les dépendances
    check_dependencies

    # Configurer le build
    setup_build_dir ${CLEAN_BUILD}

    # Configurer CMake
    configure_cmake

    # Compiler
    build_tests

    # Arrêter ici si build only
    if [ "${BUILD_ONLY}" = true ]; then
        log_success "Build complete. Exiting."
        exit 0
    fi

    # Exécuter les tests appropriés
    if [ "${RUN_PERFORMANCE}" = true ]; then
        run_performance_tests
    elif [ "${RUN_MEMORY}" = true ]; then
        run_memory_tests
    else
        # Exécuter tous les tests
        if run_tests; then
            generate_report
        else
            log_error "Tests failed, skipping report generation"
            exit 1
        fi
    fi

    log_success "Test suite execution completed successfully! 🎵"
}

# Capturer les signaux d'interruption
trap 'log_warning "Interrupted by user"; exit 1' INT TERM

# Exécuter la fonction principale
main "$@"
