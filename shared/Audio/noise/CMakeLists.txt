# CMakeLists.txt pour le module de bruit refactorisé

# Configuration C++17
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Définition pour activer le module de bruit
add_definitions(-DNYTH_AUDIO_NOISE_ENABLED=1)

# Fichiers sources du module de bruit
set(NOISE_SOURCES
    config/NoiseConfig.cpp
    jsi/NoiseJSIConverter.cpp
    managers/NoiseManager.cpp
    NativeAudioNoiseModule.cpp
)

# Fichiers d'en-tête (pour IntelliSense)
set(NOISE_HEADERS
    config/NoiseConfig.h
    jsi/NoiseJSIConverter.h
    managers/NoiseManager.h
    NativeAudioNoiseModule.h
)

# Créer la bibliothèque partagée
add_library(NythAudioNoise SHARED
    ${NOISE_SOURCES}
    ${NOISE_HEADERS}
)

# Inclure les répertoires nécessaires
target_include_directories(NythAudioNoise
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}/config
        ${CMAKE_CURRENT_SOURCE_DIR}/jsi
        ${CMAKE_CURRENT_SOURCE_DIR}/managers
        ${CMAKE_CURRENT_SOURCE_DIR}/../../Audio/noise  # Pour les headers AudioNR
        ${CMAKE_CURRENT_SOURCE_DIR}/../jsi             # Pour JSICallbackManager
        ${CMAKE_CURRENT_SOURCE_DIR}/../../../          # Pour ReactCommon
)

# Lier avec les bibliothèques nécessaires
target_link_libraries(NythAudioNoise
    PUBLIC
        AudioCore        # Bibliothèque Audio existante
        ReactNative      # Bibliothèque React Native
)

# Propriétés de la cible
set_target_properties(NythAudioNoise PROPERTIES
    VERSION 1.0.0
    SOVERSION 1
    OUTPUT_NAME "NythAudioNoise"
)

# Configuration pour différentes plateformes
if(APPLE)
    # Configuration iOS/macOS
    target_compile_definitions(NythAudioNoise PRIVATE
        NYTH_PLATFORM_APPLE=1
    )
elseif(ANDROID)
    # Configuration Android
    target_compile_definitions(NythAudioNoise PRIVATE
        NYTH_PLATFORM_ANDROID=1
    )
elseif(WIN32)
    # Configuration Windows
    target_compile_definitions(NythAudioNoise PRIVATE
        NYTH_PLATFORM_WINDOWS=1
    )
endif()

# Optimisations de compilation
if(CMAKE_BUILD_TYPE STREQUAL "Release")
    target_compile_options(NythAudioNoise PRIVATE
        -O3
        -ffast-math
        -funroll-loops
    )
endif()

# Installation (optionnel)
install(TARGETS NythAudioNoise
    LIBRARY DESTINATION lib
    ARCHIVE DESTINATION lib
)

install(FILES ${NOISE_HEADERS}
    DESTINATION include/audio/noise
)
