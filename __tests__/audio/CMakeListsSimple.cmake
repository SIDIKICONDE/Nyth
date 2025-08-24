cmake_minimum_required(VERSION 3.10)
project(SIMDTestSimple CXX)

# Configuration C++17
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Optimisations
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -O3")

# Support ARM NEON (pour les mobiles)
if(CMAKE_SYSTEM_PROCESSOR MATCHES "arm")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -mfpu=neon")
elseif(CMAKE_SYSTEM_PROCESSOR MATCHES "x86_64|amd64")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -msse2")
endif()

# Sources SIMD
set(SIMD_SOURCES
    ${CMAKE_SOURCE_DIR}/shared/Audio/common/SIMD/SIMDCore.cpp
    ${CMAKE_SOURCE_DIR}/shared/Audio/common/SIMD/SIMDMathFunctions.cpp
    ${CMAKE_SOURCE_DIR}/shared/Audio/common/SIMD/SIMDIntegration.cpp
)

# Headers SIMD
set(SIMD_HEADERS
    ${CMAKE_SOURCE_DIR}/shared/Audio/common/SIMD/SIMDCore.hpp
    ${CMAKE_SOURCE_DIR}/shared/Audio/common/SIMD/SIMDMathFunctions.hpp
    ${CMAKE_SOURCE_DIR}/shared/Audio/common/SIMD/SIMDIntegration.hpp
    ${CMAKE_SOURCE_DIR}/shared/Audio/common/SIMD/SIMDConfig.hpp
)

# Créer l'exécutable de test
add_executable(simd_test_simple SIMDTestSimple.cpp ${SIMD_SOURCES})

# Inclure les headers
target_include_directories(simd_test_simple PRIVATE
    ${CMAKE_SOURCE_DIR}
    ${CMAKE_SOURCE_DIR}/shared
    ${CMAKE_SOURCE_DIR}/shared/Audio
)

# Définitions
target_compile_definitions(simd_test_simple PRIVATE
    _USE_MATH_DEFINES
)

# Support ARM NEON
if(CMAKE_SYSTEM_PROCESSOR MATCHES "arm")
    target_compile_definitions(simd_test_simple PRIVATE __ARM_NEON)
elseif(CMAKE_SYSTEM_PROCESSOR MATCHES "x86_64|amd64")
    target_compile_definitions(simd_test_simple PRIVATE __SSE2__)
endif()

# Message d'information
message("=== Configuration SIMD Test ===")
message("Processeur: ${CMAKE_SYSTEM_PROCESSOR}")
message("Compilateur: ${CMAKE_CXX_COMPILER}")
message("Flags: ${CMAKE_CXX_FLAGS}")
if(CMAKE_SYSTEM_PROCESSOR MATCHES "arm")
    message("Mode: ARM NEON")
elseif(CMAKE_SYSTEM_PROCESSOR MATCHES "x86_64|amd64")
    message("Mode: x86 SIMD")
else()
    message("Mode: Générique (pas de SIMD)")
endif()
