cmake_minimum_required(VERSION 3.14)

# Inclure FetchContent pour télécharger les dépendances
include(FetchContent)
project(AudioCaptureTests)

# C++ Standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Options de compilation
option(BUILD_TESTS "Build unit tests" ON)
option(BUILD_BENCHMARKS "Build performance benchmarks" ON)
option(ENABLE_SIMD "Enable SIMD optimizations" ON)

# Détection des capacités SIMD
if(ENABLE_SIMD)
    include(CheckCXXCompilerFlag)
    
    # ARM NEON
    if(CMAKE_SYSTEM_PROCESSOR MATCHES "arm" OR CMAKE_SYSTEM_PROCESSOR MATCHES "aarch64")
        check_cxx_compiler_flag("-mfpu=neon" COMPILER_SUPPORTS_NEON)
        if(COMPILER_SUPPORTS_NEON)
            add_compile_options(-mfpu=neon)
            add_compile_definitions(HAS_NEON=1)
        endif()
    endif()
    
    # x86 SSE/AVX
    if(CMAKE_SYSTEM_PROCESSOR MATCHES "x86_64" OR CMAKE_SYSTEM_PROCESSOR MATCHES "i686")
        check_cxx_compiler_flag("-msse2" COMPILER_SUPPORTS_SSE2)
        check_cxx_compiler_flag("-mavx2" COMPILER_SUPPORTS_AVX2)
        
        if(COMPILER_SUPPORTS_SSE2)
            add_compile_options(-msse2)
            add_compile_definitions(HAS_SSE2=1)
        endif()
        
        if(COMPILER_SUPPORTS_AVX2)
            add_compile_options(-mavx2)
            add_compile_definitions(HAS_AVX2=1)
        endif()
    endif()
endif()

# Flags de compilation pour optimisation
if(CMAKE_BUILD_TYPE STREQUAL "Release")
    add_compile_options(-O3 -march=native -mtune=native)
    
    # Link Time Optimization
    include(CheckIPOSupported)
    check_ipo_supported(RESULT ipo_supported)
    if(ipo_supported)
        set(CMAKE_INTERPROCEDURAL_OPTIMIZATION TRUE)
    endif()
endif()

# Flags de débogage
if(CMAKE_BUILD_TYPE STREQUAL "Debug")
    add_compile_options(-g -O0 -fsanitize=address -fsanitize=undefined)
    add_link_options(-fsanitize=address -fsanitize=undefined)
endif()

# Sources du module audio
set(AUDIO_CAPTURE_SOURCES
    ../shared/Audio/capture/AudioCapture.hpp
    ../shared/Audio/capture/AudioCaptureImpl.hpp
    ../shared/Audio/capture/AudioCaptureUtils.hpp
    ../shared/Audio/capture/AudioFileWriter.hpp
    ../shared/Audio/capture/AudioCaptureException.hpp
    ../shared/Audio/capture/AudioCaptureMetrics.hpp
    ../shared/Audio/capture/AudioCaptureSIMD.hpp
)

# Bibliothèque audio capture (header-only dans ce cas)
add_library(audio_capture INTERFACE)
target_include_directories(audio_capture INTERFACE 
    ${CMAKE_CURRENT_SOURCE_DIR}/../shared/Audio/capture
)

# ============================================================================
# Tests unitaires avec Google Test
# ============================================================================

if(BUILD_TESTS)
    # Télécharger Google Test
    include(FetchContent)
    FetchContent_Declare(
        googletest
        GIT_REPOSITORY https://github.com/google/googletest.git
        GIT_TAG v1.14.0
    )
    
    # Pour Windows: forcer les bibliothèques statiques
    set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
    
    FetchContent_MakeAvailable(googletest)
    
    # Exécutable de tests
    add_executable(audio_capture_tests
        AudioCaptureTests.cpp
    )
    
    target_link_libraries(audio_capture_tests
        PRIVATE
        audio_capture
        gtest
        gtest_main
        gmock
        pthread
    )
    
    # Ajouter les tests à CTest
    include(GoogleTest)
    gtest_discover_tests(audio_capture_tests)
    
    # Commande pour exécuter les tests
    add_custom_target(run_tests
        COMMAND audio_capture_tests --gtest_color=yes
        DEPENDS audio_capture_tests
        WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}
        COMMENT "Running audio capture unit tests..."
    )
endif()

# ============================================================================
# Benchmarks avec Google Benchmark
# ============================================================================

if(BUILD_BENCHMARKS)
    # Télécharger Google Benchmark
    FetchContent_Declare(
        googlebenchmark
        GIT_REPOSITORY https://github.com/google/benchmark.git
        GIT_TAG v1.8.3
    )
    
    set(BENCHMARK_ENABLE_TESTING OFF CACHE BOOL "" FORCE)
    FetchContent_MakeAvailable(googlebenchmark)
    
    # Exécutable de benchmarks
    add_executable(audio_capture_benchmarks
        AudioCaptureBenchmarks.cpp
    )
    
    target_link_libraries(audio_capture_benchmarks
        PRIVATE
        audio_capture
        benchmark::benchmark
        pthread
    )
    
    # Commande pour exécuter les benchmarks
    add_custom_target(run_benchmarks
        COMMAND audio_capture_benchmarks --benchmark_format=console --benchmark_counters_tabular=true
        DEPENDS audio_capture_benchmarks
        WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}
        COMMENT "Running audio capture performance benchmarks..."
    )
    
    # Commande pour générer un rapport JSON
    add_custom_target(benchmark_json
        COMMAND audio_capture_benchmarks --benchmark_format=json --benchmark_out=benchmark_results.json
        DEPENDS audio_capture_benchmarks
        WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}
        COMMENT "Generating benchmark JSON report..."
    )
endif()

# ============================================================================
# Tests de couverture (optionnel)
# ============================================================================

if(CMAKE_BUILD_TYPE STREQUAL "Debug" AND CMAKE_COMPILER_IS_GNUCXX)
    option(ENABLE_COVERAGE "Enable code coverage" OFF)
    
    if(ENABLE_COVERAGE)
        add_compile_options(--coverage)
        add_link_options(--coverage)
        
        # Commande pour générer le rapport de couverture
        add_custom_target(coverage
            COMMAND lcov --capture --directory . --output-file coverage.info
            COMMAND lcov --remove coverage.info '/usr/*' --output-file coverage.info
            COMMAND lcov --list coverage.info
            COMMAND genhtml coverage.info --output-directory coverage_html
            DEPENDS run_tests
            WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}
            COMMENT "Generating code coverage report..."
        )
    endif()
endif()

# ============================================================================
# Installation
# ============================================================================

# Installer les headers
install(FILES ${AUDIO_CAPTURE_SOURCES}
    DESTINATION include/nyth/audio/capture
)

# Installer les exécutables de test si demandé
if(BUILD_TESTS)
    install(TARGETS audio_capture_tests
        RUNTIME DESTINATION bin
    )
endif()

if(BUILD_BENCHMARKS)
    install(TARGETS audio_capture_benchmarks
        RUNTIME DESTINATION bin
    )
endif()

# ============================================================================
# Résumé de la configuration
# ============================================================================

message(STATUS "")
message(STATUS "Audio Capture Tests Configuration:")
message(STATUS "  Build type: ${CMAKE_BUILD_TYPE}")
message(STATUS "  C++ Standard: ${CMAKE_CXX_STANDARD}")
message(STATUS "  Build tests: ${BUILD_TESTS}")
message(STATUS "  Build benchmarks: ${BUILD_BENCHMARKS}")
message(STATUS "  SIMD optimizations: ${ENABLE_SIMD}")

if(ENABLE_SIMD)
    if(COMPILER_SUPPORTS_NEON)
        message(STATUS "  ARM NEON: Enabled")
    endif()
    if(COMPILER_SUPPORTS_SSE2)
        message(STATUS "  x86 SSE2: Enabled")
    endif()
    if(COMPILER_SUPPORTS_AVX2)
        message(STATUS "  x86 AVX2: Enabled")
    endif()
endif()

message(STATUS "")