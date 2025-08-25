cmake_minimum_required(VERSION 3.10)
project(SIMDTests)

# Configuration pour React Native / C++
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Activer les optimisations SIMD
if(CMAKE_SYSTEM_PROCESSOR MATCHES "arm" OR CMAKE_SYSTEM_PROCESSOR MATCHES "aarch64")
    # Configuration pour ARM NEON
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -march=armv8-a+simd -mfpu=neon")
elseif(CMAKE_SYSTEM_PROCESSOR MATCHES "x86" OR CMAKE_SYSTEM_PROCESSOR MATCHES "x86_64")
    # Configuration pour x86 AVX2
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -mavx2 -mfma")
endif()

# Optimisations générales
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -O3 -ffast-math -funroll-loops")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -Wextra -pedantic")

# Inclure les répertoires nécessaires
include_directories(
    ../../shared/Audio/common/SIMD
    ../../shared/Audio/common
    ../../src
)

# Fichiers sources de la bibliothèque SIMD
set(SIMD_SOURCES
    ../../shared/Audio/common/SIMD/SIMDCore.cpp
    ../../shared/Audio/common/SIMD/SIMDMathFunctions.cpp
    ../../shared/Audio/common/SIMD/SIMDIntegration.cpp
)

# Fichier de test principal
set(TEST_SOURCES
    SIMDComprehensiveTest.cpp
)

# Créer l'exécutable de test
add_executable(simd_tests ${TEST_SOURCES} ${SIMD_SOURCES})

# Configuration spécifique pour Android
if(ANDROID)
    target_link_libraries(simd_tests
        android
        log
    )

    # Flags spécifiques Android
    set_target_properties(simd_tests PROPERTIES
        COMPILE_FLAGS "-fvisibility=hidden -fexceptions"
    )
endif()

# Configuration pour iOS/macOS
if(APPLE)
    set_target_properties(simd_tests PROPERTIES
        XCODE_ATTRIBUTE_CLANG_CXX_LANGUAGE_STANDARD "c++17"
        XCODE_ATTRIBUTE_CLANG_CXX_LIBRARY "libc++"
    )
endif()

# Configuration pour Windows
if(WIN32)
    # Utiliser _aligned_malloc sur Windows
    target_compile_definitions(simd_tests PRIVATE
        _CRT_SECURE_NO_WARNINGS
    )
endif()

# Afficher les informations de compilation
message(STATUS "=== Configuration SIMD Tests ===")
message(STATUS "Processor: ${CMAKE_SYSTEM_PROCESSOR}")
message(STATUS "C++ Flags: ${CMAKE_CXX_FLAGS}")
message(STATUS "SIMD Sources: ${SIMD_SOURCES}")
message(STATUS "Test Sources: ${TEST_SOURCES}")

# Option pour activer/désactiver les optimisations SIMD
option(ENABLE_SIMD_OPTIMIZATIONS "Enable SIMD optimizations" ON)
if(ENABLE_SIMD_OPTIMIZATIONS)
    target_compile_definitions(simd_tests PRIVATE
        SIMD_ENABLE_OPTIMIZATIONS=1
    )
else()
    target_compile_definitions(simd_tests PRIVATE
        SIMD_ENABLE_OPTIMIZATIONS=0
    )
endif()

# Cible pour exécuter les tests
add_custom_target(run_simd_tests
    COMMAND simd_tests
    DEPENDS simd_tests
    COMMENT "Running SIMD comprehensive tests"
)

# Cible pour benchmark
add_custom_target(simd_benchmark
    COMMAND simd_tests benchmark
    DEPENDS simd_tests
    COMMENT "Running SIMD benchmarks"
)

# Afficher l'aide
message(STATUS "")
message(STATUS "=== SIMD Tests Build Targets ===")
message(STATUS "make simd_tests        - Build test executable")
message(STATUS "make run_simd_tests    - Run comprehensive tests")
message(STATUS "make simd_benchmark    - Run performance benchmarks")
message(STATUS "")
