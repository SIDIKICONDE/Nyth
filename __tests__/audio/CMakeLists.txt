cmake_minimum_required(VERSION 3.20)
project(AudioTestSuite CXX)

# Configuration C++20
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Optimisations pour les tests de performance
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -O3 -march=native")

# Inclure Google Test
include(FetchContent)
FetchContent_Declare(
  googletest
  URL https://github.com/google/googletest/archive/refs/tags/v1.14.0.zip
)
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)

# Sources des tests
set(TEST_SOURCES
    AudioTestSuite.cpp
)

# Sources de l'application audio (à adapter selon votre structure)
set(AUDIO_SOURCES
    ${CMAKE_SOURCE_DIR}/shared/Audio/core/AudioEqualizer.cpp
    ${CMAKE_SOURCE_DIR}/shared/Audio/core/BiquadFilter.cpp
    ${CMAKE_SOURCE_DIR}/shared/Audio/utils/AudioBuffer.cpp
    ${CMAKE_SOURCE_DIR}/shared/Audio/effects/Compressor.cpp
    ${CMAKE_SOURCE_DIR}/shared/Audio/effects/Delay.cpp
    ${CMAKE_SOURCE_DIR}/shared/Audio/effects/EffectChain.cpp
    ${CMAKE_SOURCE_DIR}/shared/Audio/noise/NoiseReducer.cpp
    ${CMAKE_SOURCE_DIR}/shared/Audio/noise/SpectralNR.cpp
    ${CMAKE_SOURCE_DIR}/shared/Audio/noise/RNNoiseSuppressor.cpp
    ${CMAKE_SOURCE_DIR}/shared/Audio/safety/AudioSafety.cpp
)

# Headers
set(AUDIO_HEADERS
    ${CMAKE_SOURCE_DIR}/shared/Audio/core/AudioEqualizer.hpp
    ${CMAKE_SOURCE_DIR}/shared/Audio/core/BiquadFilter.hpp
    ${CMAKE_SOURCE_DIR}/shared/Audio/utils/AudioBuffer.hpp
    ${CMAKE_SOURCE_DIR}/shared/Audio/utils/Constants.hpp
    ${CMAKE_SOURCE_DIR}/shared/Audio/effects/Compressor.hpp
    ${CMAKE_SOURCE_DIR}/shared/Audio/effects/Delay.hpp
    ${CMAKE_SOURCE_DIR}/shared/Audio/effects/EffectBase.hpp
    ${CMAKE_SOURCE_DIR}/shared/Audio/noise/NoiseReducer.hpp
    ${CMAKE_SOURCE_DIR}/shared/Audio/noise/SpectralNR.hpp
    ${CMAKE_SOURCE_DIR}/shared/Audio/noise/RNNoiseSuppressor.hpp
    ${CMAKE_SOURCE_DIR}/shared/Audio/safety/AudioSafety.hpp
)

# Créer l'exécutable de test
add_executable(audio_tests ${TEST_SOURCES} ${AUDIO_SOURCES})

# Inclure les headers
target_include_directories(audio_tests PRIVATE
    ${CMAKE_SOURCE_DIR}
    ${CMAKE_SOURCE_DIR}/shared
    ${CMAKE_SOURCE_DIR}/shared/Audio
)

# Linker avec Google Test
target_link_libraries(audio_tests PRIVATE
    GTest::gtest_main
    GTest::gmock_main
)

# Configuration pour les tests SIMD
if(CMAKE_SYSTEM_PROCESSOR MATCHES "arm")
    target_compile_options(audio_tests PRIVATE -mfpu=neon)
elseif(CMAKE_SYSTEM_PROCESSOR MATCHES "x86_64|amd64")
    target_compile_options(audio_tests PRIVATE -msse2)
endif()

# Définitions pour les tests
target_compile_definitions(audio_tests PRIVATE
    AUDIO_TESTING=1
    _USE_MATH_DEFINES
)

# Configuration pour les tests de performance
if(CMAKE_BUILD_TYPE STREQUAL "Release")
    target_compile_options(audio_tests PRIVATE -funroll-loops)
endif()

# Tests de mémoire (optionnel)
option(ENABLE_MEMORY_TESTS "Enable memory leak detection tests" OFF)
if(ENABLE_MEMORY_TESTS)
    target_compile_definitions(audio_tests PRIVATE ENABLE_MEMORY_TESTS=1)
endif()

# Tests SIMD (optionnel)
option(ENABLE_SIMD_TESTS "Enable SIMD-specific tests" ON)
if(ENABLE_SIMD_TESTS)
    if(CMAKE_SYSTEM_PROCESSOR MATCHES "arm")
        target_compile_definitions(audio_tests PRIVATE __ARM_NEON)
    elseif(CMAKE_SYSTEM_PROCESSOR MATCHES "x86_64|amd64")
        target_compile_definitions(audio_tests PRIVATE __SSE2__)
    endif()
endif()

# CTest integration
include(GoogleTest)
gtest_discover_tests(audio_tests)

# Custom target pour exécuter les tests avec des options spéciales
add_custom_target(run_audio_tests
    COMMAND audio_tests --gtest_shuffle --gtest_repeat=1
    DEPENDS audio_tests
    COMMENT "Running Audio Test Suite with shuffle enabled"
)

# Performance tests
add_custom_target(run_performance_tests
    COMMAND audio_tests --gtest_filter="*Performance*"
    DEPENDS audio_tests
    COMMENT "Running Audio Performance Tests"
)

# Integration tests
add_custom_target(run_integration_tests
    COMMAND audio_tests --gtest_filter="*Integration*"
    DEPENDS audio_tests
    COMMENT "Running Audio Integration Tests"
)
