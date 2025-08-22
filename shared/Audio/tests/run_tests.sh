#!/bin/bash

# Audio Core Test Runner Script
# ==============================
# This script automates the building and running of Audio Core tests
# with various configurations and analysis tools.

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUILD_DIR="build"
TEST_MODE="all"  # all, unit, benchmark, valgrind, coverage
BUILD_TYPE="Release"
VERBOSE=0
CLEAN_BUILD=0
PARALLEL_JOBS=$(nproc 2>/dev/null || echo 4)

# Function to print colored messages
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to display usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Audio Core Test Runner - Comprehensive testing suite for Audio Core module

OPTIONS:
    -h, --help          Show this help message
    -m, --mode MODE     Test mode: all, unit, benchmark, valgrind, coverage (default: all)
    -b, --build TYPE    Build type: Debug, Release, RelWithDebInfo (default: Release)
    -c, --clean         Clean build directory before building
    -v, --verbose       Enable verbose output
    -j, --jobs N        Number of parallel build jobs (default: auto-detect)

EXAMPLES:
    $0                          # Run all tests with default settings
    $0 -m unit                  # Run only unit tests
    $0 -m benchmark -b Release  # Run benchmarks in Release mode
    $0 -m valgrind -b Debug     # Run tests with Valgrind in Debug mode
    $0 -m coverage -b Debug     # Generate code coverage report
    $0 -c -v                    # Clean build with verbose output

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -m|--mode)
            TEST_MODE="$2"
            shift 2
            ;;
        -b|--build)
            BUILD_TYPE="$2"
            shift 2
            ;;
        -c|--clean)
            CLEAN_BUILD=1
            shift
            ;;
        -v|--verbose)
            VERBOSE=1
            shift
            ;;
        -j|--jobs)
            PARALLEL_JOBS="$2"
            shift 2
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Validate test mode
case $TEST_MODE in
    all|unit|benchmark|valgrind|coverage)
        ;;
    *)
        print_error "Invalid test mode: $TEST_MODE"
        usage
        exit 1
        ;;
esac

# Validate build type
case $BUILD_TYPE in
    Debug|Release|RelWithDebInfo)
        ;;
    *)
        print_error "Invalid build type: $BUILD_TYPE"
        usage
        exit 1
        ;;
esac

# Print configuration
print_info "Audio Core Test Runner Configuration:"
print_info "  Test Mode: $TEST_MODE"
print_info "  Build Type: $BUILD_TYPE"
print_info "  Parallel Jobs: $PARALLEL_JOBS"
print_info "  Clean Build: $([ $CLEAN_BUILD -eq 1 ] && echo 'Yes' || echo 'No')"
print_info "  Verbose: $([ $VERBOSE -eq 1 ] && echo 'Yes' || echo 'No')"
echo ""

# Check for required tools
check_tool() {
    if ! command -v $1 &> /dev/null; then
        print_warning "$1 is not installed. Some features may not be available."
        return 1
    fi
    return 0
}

print_info "Checking for required tools..."
check_tool cmake || exit 1
check_tool make || check_tool ninja || exit 1
check_tool g++ || check_tool clang++ || exit 1

# Optional tools
HAS_VALGRIND=$(check_tool valgrind && echo 1 || echo 0)
HAS_LCOV=$(check_tool lcov && echo 1 || echo 0)
HAS_GENHTML=$(check_tool genhtml && echo 1 || echo 0)

# Clean build directory if requested
if [ $CLEAN_BUILD -eq 1 ]; then
    print_info "Cleaning build directory..."
    rm -rf "$BUILD_DIR"
fi

# Create build directory
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

# Configure CMake
print_info "Configuring CMake..."
CMAKE_ARGS="-DCMAKE_BUILD_TYPE=$BUILD_TYPE"

if [ "$TEST_MODE" = "coverage" ]; then
    if [ $HAS_LCOV -eq 0 ] || [ $HAS_GENHTML -eq 0 ]; then
        print_error "Coverage mode requires lcov and genhtml to be installed"
        exit 1
    fi
    CMAKE_ARGS="$CMAKE_ARGS -DENABLE_COVERAGE=ON"
    BUILD_TYPE="Debug"  # Force Debug for coverage
fi

if [ $VERBOSE -eq 1 ]; then
    CMAKE_ARGS="$CMAKE_ARGS -DCMAKE_VERBOSE_MAKEFILE=ON"
fi

cmake .. $CMAKE_ARGS

# Build the tests
print_info "Building tests..."
if [ $VERBOSE -eq 1 ]; then
    make -j$PARALLEL_JOBS VERBOSE=1
else
    make -j$PARALLEL_JOBS
fi

print_success "Build completed successfully!"
echo ""

# Run tests based on mode
run_unit_tests() {
    print_info "Running unit tests..."
    
    # Run main test suite
    if [ -f ./TestAudioCore ]; then
        print_info "Running Audio Core tests..."
        ./TestAudioCore --gtest_color=yes
        print_success "Audio Core tests passed!"
    fi
    
    # Run specialized component tests
    if [ -f ./TestSpecializedComponents ]; then
        print_info "Running Specialized Components tests..."
        ./TestSpecializedComponents --gtest_color=yes
        print_success "Specialized Components tests passed!"
    fi
}

run_benchmarks() {
    print_info "Running performance benchmarks..."
    
    if [ -f ./BenchmarkOptimizations ]; then
        ./BenchmarkOptimizations
        print_success "Benchmarks completed!"
    else
        print_warning "Benchmark executable not found"
    fi
}

run_valgrind_tests() {
    if [ $HAS_VALGRIND -eq 0 ]; then
        print_error "Valgrind is not installed"
        exit 1
    fi
    
    print_info "Running tests with Valgrind memory checker..."
    
    VALGRIND_OPTS="--leak-check=full --show-leak-kinds=all --track-origins=yes --error-exitcode=1"
    
    if [ -f ./TestAudioCore ]; then
        print_info "Checking Audio Core tests for memory issues..."
        valgrind $VALGRIND_OPTS ./TestAudioCore
        print_success "No memory issues found in Audio Core tests!"
    fi
    
    if [ -f ./TestSpecializedComponents ]; then
        print_info "Checking Specialized Components tests for memory issues..."
        valgrind $VALGRIND_OPTS ./TestSpecializedComponents
        print_success "No memory issues found in Specialized Components tests!"
    fi
}

run_coverage() {
    if [ $HAS_LCOV -eq 0 ] || [ $HAS_GENHTML -eq 0 ]; then
        print_error "Coverage requires lcov and genhtml to be installed"
        exit 1
    fi
    
    print_info "Generating code coverage report..."
    
    # Run tests first
    run_unit_tests
    
    # Generate coverage report
    make coverage
    
    print_success "Coverage report generated in build/coverage/index.html"
    
    # Try to open in browser
    if command -v xdg-open &> /dev/null; then
        xdg-open coverage/index.html
    elif command -v open &> /dev/null; then
        open coverage/index.html
    else
        print_info "Please open build/coverage/index.html in your browser"
    fi
}

# Execute tests based on mode
case $TEST_MODE in
    all)
        run_unit_tests
        echo ""
        run_benchmarks
        if [ $HAS_VALGRIND -eq 1 ] && [ "$BUILD_TYPE" = "Debug" ]; then
            echo ""
            run_valgrind_tests
        fi
        ;;
    unit)
        run_unit_tests
        ;;
    benchmark)
        run_benchmarks
        ;;
    valgrind)
        run_valgrind_tests
        ;;
    coverage)
        run_coverage
        ;;
esac

echo ""
print_success "All tests completed successfully!"

# Print summary
echo ""
print_info "Test Summary:"
print_info "  Mode: $TEST_MODE"
print_info "  Build Type: $BUILD_TYPE"
print_info "  Status: SUCCESS"

# Return to original directory
cd ..

exit 0