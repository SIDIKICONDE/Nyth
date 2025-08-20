# Configuration CMake pour les tests unitaires du système audio
cmake_minimum_required(VERSION 3.14)
project(AudioSystemTests VERSION 1.0)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Configuration pour les optimisations et warnings
if(MSVC)
    add_compile_options(/W4 /O2)
else()
    add_compile_options(-Wall -Wextra -Wpedantic -O3 -march=native)
endif()

# Inclure les répertoires du projet audio
include_directories(
    ${CMAKE_SOURCE_DIR}/shared/Audio
    ${CMAKE_SOURCE_DIR}/shared/Audio/core
    ${CMAKE_SOURCE_DIR}/shared/Audio/utils
    ${CMAKE_SOURCE_DIR}/shared/Audio/effects
    ${CMAKE_SOURCE_DIR}/shared/Audio/noise
    ${CMAKE_SOURCE_DIR}/shared/Audio/safety
)

# Définitions pour les tests
add_definitions(-DTEST_MODE)

# Télécharger et configurer Google Test
include(FetchContent)
FetchContent_Declare(
    googletest
    URL https://github.com/google/googletest/archive/release-1.12.1.zip
    DOWNLOAD_EXTRACT_TIMESTAMP TRUE
)
FetchContent_MakeAvailable(googletest)

# Bibliothèque audio (mocks pour les tests)
add_library(audio_system STATIC
    # Fichiers sources du système audio
    shared/Audio/core/BiquadFilter.cpp
    shared/Audio/core/AudioEqualizer.cpp
    shared/Audio/utils/AudioBuffer.cpp
    shared/Audio/safety/AudioSafety.cpp
    shared/Audio/noise/NoiseReducer.cpp
    shared/Audio/noise/SpectralNR.cpp
    shared/Audio/effects/Compressor.h
    shared/Audio/effects/Delay.h
    shared/Audio/effects/EffectChain.h
    shared/Audio/effects/EffectBase.h
)

# Tests unitaires
add_executable(audio_tests
    test/test_main.cpp
    test/test_biquad_filter.cpp
    test/test_audio_equalizer.cpp
    test/test_audio_buffer.cpp
    test/test_audio_safety.cpp
    test/test_effects.cpp
    test/test_noise_reduction.cpp
    test/test_performance.cpp
    test/test_math_utilities.cpp
)

target_link_libraries(audio_tests
    PRIVATE
    audio_system
    gtest_main
    gmock_main
)

# Configuration pour les tests de performance
if(CMAKE_BUILD_TYPE STREQUAL "Release")
    target_compile_definitions(audio_tests PRIVATE PERFORMANCE_TESTING)
endif()

# Activer les tests
enable_testing()
add_test(NAME AudioSystemTests COMMAND audio_tests)

# Configuration pour générer des rapports de couverture (optionnel)
option(ENABLE_COVERAGE "Enable coverage reporting" OFF)
if(ENABLE_COVERAGE AND CMAKE_COMPILER_IS_GNUCXX)
    target_compile_options(audio_tests PRIVATE --coverage)
    target_link_libraries(audio_tests PRIVATE gcov)
endif()
