#!/bin/bash

# Script de build et test du système audio avec tests unitaires
# Usage: ./build_and_test.sh [options]

set -e  # Exit on any error

# Configuration
BUILD_DIR="build"
CLEAN_BUILD=false
RUN_TESTS=true
RUN_BENCHMARKS=false
ENABLE_COVERAGE=false
BUILD_TYPE="Release"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--clean)
            CLEAN_BUILD=true
            shift
            ;;
        --no-tests)
            RUN_TESTS=false
            shift
            ;;
        --benchmarks)
            RUN_BENCHMARKS=true
            shift
            ;;
        --coverage)
            ENABLE_COVERAGE=true
            shift
            ;;
        -d|--debug)
            BUILD_TYPE="Debug"
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  -c, --clean     Clean build directory before building"
            echo "  --no-tests      Skip running tests"
            echo "  --benchmarks    Run performance benchmarks"
            echo "  --coverage      Enable coverage reporting"
            echo "  -d, --debug     Build in Debug mode"
            echo "  -h, --help      Show this help"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check CMake
    if ! command -v cmake &> /dev/null; then
        log_error "CMake is not installed. Please install CMake 3.14 or higher."
        exit 1
    fi

    # Check C++ compiler
    if ! command -v g++ &> /dev/null && ! command -v clang++ &> /dev/null; then
        log_error "No C++ compiler found. Please install g++ or clang++."
        exit 1
    fi

    # Check make or ninja
    if ! command -v make &> /dev/null && ! command -v ninja &> /dev/null; then
        log_error "No build system found. Please install make or ninja."
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Setup build directory
setup_build_dir() {
    if [[ "$CLEAN_BUILD" == true ]]; then
        log_info "Cleaning build directory..."
        rm -rf "$BUILD_DIR"
    fi

    if [[ ! -d "$BUILD_DIR" ]]; then
        log_info "Creating build directory..."
        mkdir -p "$BUILD_DIR"
    fi
}

# Configure CMake
configure_cmake() {
    log_info "Configuring CMake..."

    cd "$BUILD_DIR"

    local cmake_args=(
        "-DCMAKE_BUILD_TYPE=$BUILD_TYPE"
        "-DENABLE_COVERAGE=$ENABLE_COVERAGE"
    )

    if [[ "$ENABLE_COVERAGE" == true ]]; then
        cmake_args+=("-DCMAKE_CXX_FLAGS=--coverage")
        cmake_args+=("-DCMAKE_EXE_LINKER_FLAGS=--coverage")
    fi

    if cmake .. "${cmake_args[@]}"; then
        log_success "CMake configuration successful"
    else
        log_error "CMake configuration failed"
        exit 1
    fi

    cd ..
}

# Build project
build_project() {
    log_info "Building project..."

    cd "$BUILD_DIR"

    local build_args=()

    # Use all available cores
    if command -v nproc &> /dev/null; then
        build_args+=("-j$(nproc)")
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        build_args+=("-j$(sysctl -n hw.ncpu)")
    else
        build_args+=("-j4")
    fi

    if make "${build_args[@]}"; then
        log_success "Build successful"
    else
        log_error "Build failed"
        exit 1
    fi

    cd ..
}

# Run tests
run_tests() {
    if [[ "$RUN_TESTS" == false ]]; then
        log_info "Skipping tests as requested"
        return
    fi

    log_info "Running tests..."

    cd "$BUILD_DIR"

    local test_args=("--gtest_color=yes")

    if [[ "$RUN_BENCHMARKS" == true ]]; then
        log_info "Including performance benchmarks"
        test_args+=("--gtest_filter=*Performance*")
    fi

    # Run tests with timeout
    if timeout 300 ./audio_tests "${test_args[@]}"; then
        log_success "All tests passed"
    else
        log_error "Some tests failed"
        exit 1
    fi

    cd ..
}

# Generate coverage report
generate_coverage() {
    if [[ "$ENABLE_COVERAGE" != true ]]; then
        return
    fi

    log_info "Generating coverage report..."

    cd "$BUILD_DIR"

    # Generate coverage data
    if command -v lcov &> /dev/null; then
        lcov --capture --directory . --output-file coverage.info
        lcov --remove coverage.info '/usr/*' '*/tests/*' '*/build/*' --output-file coverage_clean.info
        genhtml coverage_clean.info --output-directory coverage_report

        log_success "Coverage report generated in $BUILD_DIR/coverage_report/index.html"
    else
        log_warning "lcov not found. Install lcov for HTML coverage reports."
        # Basic coverage info
        if command -v gcov &> /dev/null; then
            gcov *.gcno
            log_success "Basic coverage data generated"
        fi
    fi

    cd ..
}

# Print summary
print_summary() {
    log_success "Build and test completed successfully!"

    echo
    echo "Summary:"
    echo "  Build type: $BUILD_TYPE"
    echo "  Build directory: $BUILD_DIR"
    echo "  Tests run: $([[ "$RUN_TESTS" == true ]] && echo "Yes" || echo "No")"
    echo "  Benchmarks: $([[ "$RUN_BENCHMARKS" == true ]] && echo "Yes" || echo "No")"
    echo "  Coverage: $([[ "$ENABLE_COVERAGE" == true ]] && echo "Yes" || echo "No")"

    if [[ "$ENABLE_COVERAGE" == true ]]; then
        echo
        echo "Coverage report: $BUILD_DIR/coverage_report/index.html"
    fi

    echo
    echo "Next steps:"
    echo "  - Run specific tests: cd $BUILD_DIR && ./audio_tests --gtest_filter=ComponentTest.*"
    echo "  - Run benchmarks: ./build_and_test.sh --benchmarks"
    echo "  - Generate coverage: ./build_and_test.sh --coverage"
}

# Main execution
main() {
    echo "Audio System Build and Test Script"
    echo "=================================="

    check_prerequisites
    setup_build_dir
    configure_cmake
    build_project
    run_tests
    generate_coverage
    print_summary
}

# Run main function
main "$@"
