cmake_minimum_required(VERSION 3.10)
project(NythAudioCapture)

# Configuration C++
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Options de compilation
option(BUILD_EXAMPLES "Build example programs" ON)
option(BUILD_TESTS "Build test programs" OFF)
option(USE_ALSA "Use ALSA for Linux audio capture" ON)
option(USE_WASAPI "Use WASAPI for Windows audio capture" ON)
option(USE_COREAUDIO "Use CoreAudio for macOS audio capture" ON)

# Détection de la plateforme
if(WIN32)
    set(PLATFORM_WINDOWS TRUE)
    add_definitions(-D_WIN32)
elseif(APPLE)
    set(PLATFORM_MACOS TRUE)
    add_definitions(-D__APPLE__)
elseif(UNIX)
    set(PLATFORM_LINUX TRUE)
    add_definitions(-D__linux__)
endif()

# Sources principales
set(AUDIO_CAPTURE_HEADERS
    AudioCapture.hpp
    AudioCaptureImpl.hpp
    AudioCaptureUtils.hpp
    AudioCaptureUtilsImpl.hpp
    AudioFileWriter.hpp
    AudioFileWriterImpl.hpp
)

set(AUDIO_CAPTURE_SOURCES
    # Ajoutez ici les fichiers .cpp si vous en créez
)

# Créer une bibliothèque header-only
add_library(NythAudioCapture INTERFACE)
target_include_directories(NythAudioCapture INTERFACE 
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}>
    $<INSTALL_INTERFACE:include>
)

# Dépendances système selon la plateforme
if(PLATFORM_WINDOWS AND USE_WASAPI)
    target_link_libraries(NythAudioCapture INTERFACE
        ole32
        winmm
        ksuser
        uuid
    )
    target_compile_definitions(NythAudioCapture INTERFACE USE_WASAPI)
endif()

if(PLATFORM_MACOS AND USE_COREAUDIO)
    find_library(COREAUDIO_LIBRARY CoreAudio)
    find_library(AUDIOTOOLBOX_LIBRARY AudioToolbox)
    find_library(AUDIOUNIT_LIBRARY AudioUnit)
    find_library(COREFOUNDATION_LIBRARY CoreFoundation)
    
    target_link_libraries(NythAudioCapture INTERFACE
        ${COREAUDIO_LIBRARY}
        ${AUDIOTOOLBOX_LIBRARY}
        ${AUDIOUNIT_LIBRARY}
        ${COREFOUNDATION_LIBRARY}
    )
    target_compile_definitions(NythAudioCapture INTERFACE USE_COREAUDIO)
endif()

if(PLATFORM_LINUX AND USE_ALSA)
    find_package(ALSA REQUIRED)
    target_link_libraries(NythAudioCapture INTERFACE ${ALSA_LIBRARIES})
    target_include_directories(NythAudioCapture INTERFACE ${ALSA_INCLUDE_DIRS})
    target_compile_definitions(NythAudioCapture INTERFACE USE_ALSA)
endif()

# Threads
find_package(Threads REQUIRED)
target_link_libraries(NythAudioCapture INTERFACE Threads::Threads)

# Options de compilation
target_compile_options(NythAudioCapture INTERFACE
    $<$<CXX_COMPILER_ID:GNU>:-Wall -Wextra -Wpedantic>
    $<$<CXX_COMPILER_ID:Clang>:-Wall -Wextra -Wpedantic>
    $<$<CXX_COMPILER_ID:MSVC>:/W4>
)

# Optimisations pour le release
target_compile_options(NythAudioCapture INTERFACE
    $<$<AND:$<CONFIG:Release>,$<CXX_COMPILER_ID:GNU>>:-O3 -march=native>
    $<$<AND:$<CONFIG:Release>,$<CXX_COMPILER_ID:Clang>>:-O3 -march=native>
    $<$<AND:$<CONFIG:Release>,$<CXX_COMPILER_ID:MSVC>>:/O2>
)

# Exemples
if(BUILD_EXAMPLES)
    add_subdirectory(examples)
endif()

# Tests
if(BUILD_TESTS)
    enable_testing()
    add_subdirectory(tests)
endif()

# Installation
install(FILES ${AUDIO_CAPTURE_HEADERS}
    DESTINATION include/nyth/audio/capture
)

install(TARGETS NythAudioCapture
    EXPORT NythAudioCaptureTargets
    INCLUDES DESTINATION include
)

install(EXPORT NythAudioCaptureTargets
    FILE NythAudioCaptureTargets.cmake
    NAMESPACE Nyth::
    DESTINATION lib/cmake/NythAudioCapture
)

# Créer le fichier de configuration du package
include(CMakePackageConfigHelpers)
write_basic_package_version_file(
    "${CMAKE_CURRENT_BINARY_DIR}/NythAudioCaptureConfigVersion.cmake"
    VERSION 1.0.0
    COMPATIBILITY AnyNewerVersion
)

configure_file(cmake/NythAudioCaptureConfig.cmake.in
    "${CMAKE_CURRENT_BINARY_DIR}/NythAudioCaptureConfig.cmake"
    @ONLY
)

install(FILES
    "${CMAKE_CURRENT_BINARY_DIR}/NythAudioCaptureConfig.cmake"
    "${CMAKE_CURRENT_BINARY_DIR}/NythAudioCaptureConfigVersion.cmake"
    DESTINATION lib/cmake/NythAudioCapture
)

# Messages de configuration
message(STATUS "")
message(STATUS "Nyth Audio Capture Configuration:")
message(STATUS "  Platform: ${CMAKE_SYSTEM_NAME}")
message(STATUS "  C++ Standard: ${CMAKE_CXX_STANDARD}")
message(STATUS "  Build Type: ${CMAKE_BUILD_TYPE}")
message(STATUS "  Build Examples: ${BUILD_EXAMPLES}")
message(STATUS "  Build Tests: ${BUILD_TESTS}")

if(PLATFORM_WINDOWS)
    message(STATUS "  Audio Backend: WASAPI")
elseif(PLATFORM_MACOS)
    message(STATUS "  Audio Backend: CoreAudio")
elseif(PLATFORM_LINUX)
    message(STATUS "  Audio Backend: ALSA")
endif()

message(STATUS "")