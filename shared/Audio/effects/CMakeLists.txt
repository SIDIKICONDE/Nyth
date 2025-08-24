# CMakeLists.txt pour le module audio effects refactorisé
cmake_minimum_required(VERSION 3.20)

# Configuration C++17
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Définitions de compilation
add_definitions(-DNYTH_AUDIO_EFFECTS_ENABLED=1)

# Inclure les dossiers
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/config
    ${CMAKE_CURRENT_SOURCE_DIR}/managers
    ${CMAKE_CURRENT_SOURCE_DIR}/jsi
    ${CMAKE_CURRENT_SOURCE_DIR}/../config
    ${CMAKE_CURRENT_SOURCE_DIR}/../jsi
    ${CMAKE_CURRENT_SOURCE_DIR}/../../Audio/core
    ${CMAKE_CURRENT_SOURCE_DIR}/../../Audio/effects
)

# Sources principales
set(EFFECTS_SOURCES
    NativeAudioEffectsModule.cpp
    config/EffectsConfig.cpp
    managers/CompressorManager.cpp
    managers/DelayManager.cpp
    jsi/EffectsJSIConverter.cpp
)

# Créer la bibliothèque effects
add_library(NythAudioEffects SHARED
    ${EFFECTS_SOURCES}
)

# Lier avec les bibliothèques nécessaires
target_link_libraries(NythAudioEffects
    AudioCore
    AudioEffects
    ReactNative
)

# Propriétés de la bibliothèque
set_target_properties(NythAudioEffects PROPERTIES
    CXX_STANDARD 17
    CXX_STANDARD_REQUIRED ON
    POSITION_INDEPENDENT_CODE ON
)

# Tests
if(BUILD_TESTING)
    enable_testing()
    add_subdirectory(tests)
endif()

# Installation
install(TARGETS NythAudioEffects
    LIBRARY DESTINATION lib
    ARCHIVE DESTINATION lib
)

install(FILES
    NativeAudioEffectsModule.h
    DESTINATION include/audio/effects
)
