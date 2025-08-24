# Configuration CMake pour l'architecture multiplateforme VideoFilterProcessor
cmake_minimum_required(VERSION 3.10)

# === PROJET PRINCIPAL ===
project(VideoFilterProcessor_Platform)

# === OPTIONS DE CONFIGURATION ===
option(VIDEO_FILTER_USE_METAL "Utiliser Metal sur iOS" ON)
option(VIDEO_FILTER_USE_VULKAN "Utiliser Vulkan sur Android" ON)
option(VIDEO_FILTER_BUILD_TESTS "Construire les tests" OFF)

# === FICHIERS COMMUNS ===
set(COMMON_SOURCES
    Common/IVideoFilterProcessor.hpp
    Common/VideoFilterProcessorFactory.cpp
)

# === SOURCES PAR PLATEFORME ===
if(IOS)
    set(PLATFORM_SOURCES
        iOS/iOSVideoFilterProcessor.hpp
        iOS/iOSVideoFilterProcessor.cpp
    )
    set(PLATFORM_LIBRARIES
        "-framework Metal"
        "-framework GLKit"
        "-framework OpenGLES"
        "-framework Foundation"
        "-framework CoreVideo"
        "-framework AVFoundation"
    )
elseif(ANDROID)
    set(PLATFORM_SOURCES
        Android/AndroidVideoFilterProcessor.hpp
        Android/AndroidVideoFilterProcessor.cpp
    )
    set(PLATFORM_LIBRARIES
        android
        EGL
        GLESv3
        log
    )
    if(VIDEO_FILTER_USE_VULKAN)
        list(APPEND PLATFORM_LIBRARIES vulkan)
    endif()
else()
    # Desktop - utiliser l'ancienne implémentation OpenGL
    set(PLATFORM_SOURCES
        ../OpenGLFilterProcessor.hpp
        ../OpenGLFilterProcessor.cpp
    )
    find_package(OpenGL REQUIRED)
    set(PLATFORM_LIBRARIES
        OpenGL::GL
        GLEW
    )
endif()

# === BIBLIOTHÈQUE PRINCIPALE ===
add_library(VideoFilterProcessor_Platform ${COMMON_SOURCES} ${PLATFORM_SOURCES})

# === INCLUDES ===
target_include_directories(VideoFilterProcessor_Platform
    PUBLIC
        $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/Common>
        $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/../common>
        $<INSTALL_INTERFACE:include>
    PRIVATE
        $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}>
        $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/../>
)

# === DÉFINITIONS DE COMPILATION ===
if(IOS)
    target_compile_definitions(VideoFilterProcessor_Platform
        PRIVATE
            PLATFORM_IOS
            $<$<BOOL:${VIDEO_FILTER_USE_METAL}>:USE_METAL_BACKEND>
    )
elseif(ANDROID)
    target_compile_definitions(VideoFilterProcessor_Platform
        PRIVATE
            PLATFORM_ANDROID
            $<$<BOOL:${VIDEO_FILTER_USE_VULKAN}>:USE_VULKAN_BACKEND>
    )
else()
    target_compile_definitions(VideoFilterProcessor_Platform
        PRIVATE
            PLATFORM_DESKTOP
    )
endif()

# === OPTIONS DE COMPILATION ===
target_compile_options(VideoFilterProcessor_Platform
    PRIVATE
        $<$<PLATFORM_ID:Darwin>:-fobjc-arc>
        $<$<PLATFORM_ID:iOS>:-fobjc-arc>
        $<$<PLATFORM_ID:Android>:-fvisibility=hidden>
)

# === LIENS AVEC LES BIBLIOTHÈQUES ===
target_link_libraries(VideoFilterProcessor_Platform
    PUBLIC
        ${PLATFORM_LIBRARIES}
    PRIVATE
        $<$<PLATFORM_ID:Android>:android>
        $<$<PLATFORM_ID:Android>:log>
)

# === TESTS ===
if(VIDEO_FILTER_BUILD_TESTS)
    add_subdirectory(tests)
endif()

# === EXEMPLES ===
add_subdirectory(examples)

# === INSTALLATION ===
install(TARGETS VideoFilterProcessor_Platform
    EXPORT VideoFilterProcessor_PlatformTargets
    LIBRARY DESTINATION lib
    ARCHIVE DESTINATION lib
    RUNTIME DESTINATION bin
    INCLUDES DESTINATION include
)

install(FILES
    Common/IVideoFilterProcessor.hpp
    DESTINATION include/VideoFilterProcessor_Platform
)

# === EXPORT DE LA CONFIGURATION ===
install(EXPORT VideoFilterProcessor_PlatformTargets
    FILE VideoFilterProcessor_PlatformTargets.cmake
    NAMESPACE VideoFilterProcessor_Platform::
    DESTINATION lib/cmake/VideoFilterProcessor_Platform
)

# === FICHIER DE CONFIGURATION PAQUET ===
include(CMakePackageConfigHelpers)
configure_package_config_file(
    ${CMAKE_CURRENT_SOURCE_DIR}/Config.cmake.in
    ${CMAKE_CURRENT_BINARY_DIR}/VideoFilterProcessor_PlatformConfig.cmake
    INSTALL_DESTINATION lib/cmake/VideoFilterProcessor_Platform
)

# === FICHIER DE VERSION ===
write_basic_package_version_file(
    ${CMAKE_CURRENT_BINARY_DIR}/VideoFilterProcessor_PlatformConfigVersion.cmake
    VERSION 1.0.0
    COMPATIBILITY SameMajorVersion
)

install(FILES
    ${CMAKE_CURRENT_BINARY_DIR}/VideoFilterProcessor_PlatformConfig.cmake
    ${CMAKE_CURRENT_BINARY_DIR}/VideoFilterProcessor_PlatformConfigVersion.cmake
    DESTINATION lib/cmake/VideoFilterProcessor_Platform
)

# === AFFICHAGE DES INFORMATIONS DE COMPILATION ===
message(STATUS "=== VideoFilterProcessor_Platform Configuration ===")
message(STATUS "Platform: ${CMAKE_SYSTEM_NAME}")
message(STATUS "iOS Metal backend: ${VIDEO_FILTER_USE_METAL}")
message(STATUS "Android Vulkan backend: ${VIDEO_FILTER_USE_VULKAN}")
message(STATUS "Build tests: ${VIDEO_FILTER_BUILD_TESTS}")
message(STATUS "Common sources: ${COMMON_SOURCES}")
message(STATUS "Platform sources: ${PLATFORM_SOURCES}")
message(STATUS "Platform libraries: ${PLATFORM_LIBRARIES}")
message(STATUS "=================================================")
