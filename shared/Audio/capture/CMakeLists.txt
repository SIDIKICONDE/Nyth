# CMakeLists.txt pour le module de capture audio Nyth
cmake_minimum_required(VERSION 3.16)
project(NythAudioCapture)

# Configuration C++
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Options de compilation
option(BUILD_EXAMPLES "Build audio capture examples" ON)
option(ENABLE_OBOE "Enable Oboe for Android (recommended)" ON)
option(ENABLE_AAUDIO "Enable AAudio for Android" ON)
option(ENABLE_OPENSLES "Enable OpenSL ES for Android" ON)

# Détection de la plateforme
if(ANDROID)
    message(STATUS "Building for Android")
    set(PLATFORM_ANDROID TRUE)
elseif(IOS)
    message(STATUS "Building for iOS")
    set(PLATFORM_IOS TRUE)
elseif(APPLE)
    message(STATUS "Building for macOS (testing only)")
    set(PLATFORM_MACOS TRUE)
else()
    message(FATAL_ERROR "Unsupported platform. This module supports Android and iOS only.")
endif()

# Sources communes
set(AUDIO_CAPTURE_HEADERS
    AudioCapture.hpp
    AudioCaptureImpl.hpp
    AudioCaptureUtils.hpp
    AudioCaptureUtilsImpl.hpp
    AudioFileWriter.hpp
    AudioFileWriterImpl.hpp
)

set(AUDIO_CAPTURE_SOURCES
    # Les implémentations seront ajoutées ici
)

# === Configuration Android ===
if(PLATFORM_ANDROID)
    # Sources Android
    list(APPEND AUDIO_CAPTURE_SOURCES
        android/AudioCaptureAndroid.cpp
        android/AudioCaptureAndroidOpenSL.cpp
        android/AudioCaptureAndroidAAudio.cpp
        android/AudioCaptureAndroidOboe.cpp
        android/AudioPermissionsAndroid.cpp
    )
    
    # Bibliothèques Android
    find_library(log-lib log)
    find_library(android-lib android)
    
    # OpenSL ES
    if(ENABLE_OPENSLES)
        find_library(opensles-lib OpenSLES)
        if(opensles-lib)
            add_definitions(-DUSE_OPENSLES=1)
            list(APPEND PLATFORM_LIBS ${opensles-lib})
        endif()
    endif()
    
    # AAudio (Android 8.0+)
    if(ENABLE_AAUDIO)
        find_library(aaudio-lib aaudio)
        if(aaudio-lib)
            add_definitions(-DUSE_AAUDIO=1)
            list(APPEND PLATFORM_LIBS ${aaudio-lib})
        endif()
    endif()
    
    # Oboe (recommandé)
    if(ENABLE_OBOE)
        # Option 1: Utiliser Oboe précompilé
        find_package(oboe QUIET)
        if(oboe_FOUND)
            add_definitions(-DUSE_OBOE=1)
            list(APPEND PLATFORM_LIBS oboe::oboe)
        else()
            # Option 2: Compiler Oboe depuis les sources
            include(FetchContent)
            FetchContent_Declare(
                oboe
                GIT_REPOSITORY https://github.com/google/oboe.git
                GIT_TAG        stable
            )
            FetchContent_MakeAvailable(oboe)
            add_definitions(-DUSE_OBOE=1)
            list(APPEND PLATFORM_LIBS oboe)
        endif()
    endif()
    
    list(APPEND PLATFORM_LIBS
        ${log-lib}
        ${android-lib}
    )
endif()

# === Configuration iOS ===
if(PLATFORM_IOS)
    # Sources iOS
    list(APPEND AUDIO_CAPTURE_SOURCES
        ios/AudioCaptureIOS.mm
        ios/AudioSessionIOS.mm
        ios/AudioPermissionsIOS.mm
        ios/AudioUnitIOS.mm
    )
    
    # Frameworks iOS
    find_library(AVFOUNDATION_FRAMEWORK AVFoundation)
    find_library(AUDIOTOOLBOX_FRAMEWORK AudioToolbox)
    find_library(COREAUDIO_FRAMEWORK CoreAudio)
    find_library(FOUNDATION_FRAMEWORK Foundation)
    
    list(APPEND PLATFORM_LIBS
        ${AVFOUNDATION_FRAMEWORK}
        ${AUDIOTOOLBOX_FRAMEWORK}
        ${COREAUDIO_FRAMEWORK}
        ${FOUNDATION_FRAMEWORK}
    )
    
    # Configuration spécifique iOS
    set(CMAKE_XCODE_ATTRIBUTE_IPHONEOS_DEPLOYMENT_TARGET "11.0")
    set(CMAKE_XCODE_ATTRIBUTE_ENABLE_BITCODE "NO")
endif()

# === Configuration macOS (pour tests) ===
if(PLATFORM_MACOS)
    list(APPEND AUDIO_CAPTURE_SOURCES
        macos/AudioCaptureMacOS.mm
    )
    
    find_library(COREAUDIO_FRAMEWORK CoreAudio)
    find_library(AUDIOTOOLBOX_FRAMEWORK AudioToolbox)
    find_library(FOUNDATION_FRAMEWORK Foundation)
    
    list(APPEND PLATFORM_LIBS
        ${COREAUDIO_FRAMEWORK}
        ${AUDIOTOOLBOX_FRAMEWORK}
        ${FOUNDATION_FRAMEWORK}
    )
endif()

# Création de la bibliothèque
add_library(NythAudioCapture STATIC
    ${AUDIO_CAPTURE_HEADERS}
    ${AUDIO_CAPTURE_SOURCES}
)

# Include directories
target_include_directories(NythAudioCapture PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}/..
    ${CMAKE_CURRENT_SOURCE_DIR}/../..
)

# Liens avec les bibliothèques de la plateforme
target_link_libraries(NythAudioCapture PUBLIC
    ${PLATFORM_LIBS}
)

# Options de compilation
target_compile_options(NythAudioCapture PRIVATE
    $<$<CXX_COMPILER_ID:GNU>:-Wall -Wextra -Wpedantic>
    $<$<CXX_COMPILER_ID:Clang>:-Wall -Wextra -Wpedantic>
    $<$<CXX_COMPILER_ID:MSVC>:/W4>
)

# Optimisations pour Release
target_compile_options(NythAudioCapture PRIVATE
    $<$<CONFIG:Release>:-O3>
    $<$<CONFIG:Release>:-DNDEBUG>
)

# === Exemples ===
if(BUILD_EXAMPLES)
    add_executable(audio_recorder_example
        examples/audio_recorder_example.cpp
    )
    
    target_link_libraries(audio_recorder_example PRIVATE
        NythAudioCapture
    )
    
    # Installation des exemples
    install(TARGETS audio_recorder_example
        RUNTIME DESTINATION bin/examples
    )
endif()

# === Installation ===
install(TARGETS NythAudioCapture
    ARCHIVE DESTINATION lib
    LIBRARY DESTINATION lib
    RUNTIME DESTINATION bin
)

install(FILES ${AUDIO_CAPTURE_HEADERS}
    DESTINATION include/Nyth/Audio/capture
)

# === Tests ===
if(BUILD_TESTING)
    enable_testing()
    add_subdirectory(tests)
endif()

# === Documentation ===
find_package(Doxygen)
if(DOXYGEN_FOUND)
    set(DOXYGEN_OUTPUT_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}/docs)
    set(DOXYGEN_GENERATE_HTML YES)
    set(DOXYGEN_GENERATE_MAN NO)
    
    doxygen_add_docs(
        audio_capture_docs
        ${CMAKE_CURRENT_SOURCE_DIR}
        COMMENT "Generating API documentation with Doxygen"
    )
endif()

# === Résumé de la configuration ===
message(STATUS "")
message(STATUS "=== Nyth Audio Capture Configuration ===")
message(STATUS "Platform: ${CMAKE_SYSTEM_NAME}")
message(STATUS "Build type: ${CMAKE_BUILD_TYPE}")
message(STATUS "C++ Standard: ${CMAKE_CXX_STANDARD}")
message(STATUS "Build examples: ${BUILD_EXAMPLES}")

if(PLATFORM_ANDROID)
    message(STATUS "Android configuration:")
    message(STATUS "  - OpenSL ES: ${ENABLE_OPENSLES}")
    message(STATUS "  - AAudio: ${ENABLE_AAUDIO}")
    message(STATUS "  - Oboe: ${ENABLE_OBOE}")
endif()

message(STATUS "========================================")
message(STATUS "")