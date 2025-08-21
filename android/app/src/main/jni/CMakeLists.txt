# CMakeLists.txt - Configuration C++20 pour Android NDK
cmake_minimum_required(VERSION 3.18.1)  # Minimum pour C++20 support complet

# Define the library name here.
project(appmodules
    VERSION 1.0.0
    DESCRIPTION "React Native C++20 Audio Processing Modules"
    LANGUAGES CXX C
)

# This file includes all the necessary to let you build your React Native application
include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)

# =============================================================================
# C++20 Configuration
# =============================================================================

# Force C++20 standard
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Ensure compiler supports C++20
if(CMAKE_CXX_COMPILER_ID STREQUAL "Clang")
    # Clang-specific C++20 flags
    add_compile_options(
        -std=c++20
        -stdlib=libc++
        -fexperimental-library  # Pour les nouvelles features de la stdlib
    )
elseif(CMAKE_CXX_COMPILER_ID STREQUAL "GNU")
    # GCC-specific C++20 flags
    add_compile_options(
        -std=c++20
        -lstdc++fs  # Pour filesystem si nécessaire
    )
endif()

# =============================================================================
# Build Configuration
# =============================================================================

# Debug configuration
set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} -g -O0")
set(CMAKE_C_FLAGS_DEBUG "${CMAKE_C_FLAGS_DEBUG} -g -O0")

# Release configuration avec optimisations C++20
set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} -O3 -DNDEBUG")
set(CMAKE_C_FLAGS_RELEASE "${CMAKE_C_FLAGS_RELEASE} -O3 -DNDEBUG")

# Common flags for all configurations
add_compile_options(
    -Wall
    -Wextra
    -Wpedantic
    -Wshadow
    -Wconversion
    -Wsign-conversion
    -Wunused
    -fvisibility=hidden  # Réduire la taille du binaire
)

# =============================================================================
# C++20 Standard Library Configuration
# =============================================================================

# Link against libc++ for NDK (C++20 compatible)
find_library(CPP_SHARED_LIB c++_shared NAMES c++_shared)
if (CPP_SHARED_LIB)
    target_link_libraries(${CMAKE_PROJECT_NAME} ${CPP_SHARED_LIB})
else()
    # Fallback pour différentes versions de l'NDK
    find_library(CPP_STATIC_LIB c++_static NAMES c++_static)
    if (CPP_STATIC_LIB)
        target_link_libraries(${CMAKE_PROJECT_NAME} ${CPP_STATIC_LIB})
    else()
        message(WARNING "Could not find C++ standard library. Using system default.")
    endif()
endif()

# =============================================================================
# Feature Detection
# =============================================================================

# Vérifier le support des concepts
include(CheckCXXSourceCompiles)
check_cxx_source_compiles("
    #include <concepts>
    template<typename T>
    concept Integral = std::integral<T>;
    int main() { return 0; }
" HAS_CONCEPTS)

if(HAS_CONCEPTS)
    message(STATUS "✅ C++20 Concepts support: ENABLED")
    add_definitions(-DHAS_CONCEPTS)
else()
    message(WARNING "❌ C++20 Concepts support: NOT AVAILABLE")
endif()

# Vérifier le support de std::format
check_cxx_source_compiles("
    #include <format>
    int main() {
        std::string s = std::format(\"Hello {}\", \"World\");
        return 0;
    }
" HAS_FORMAT)

if(HAS_FORMAT)
    message(STATUS "✅ std::format support: ENABLED")
    add_definitions(-DHAS_FORMAT)
else()
    message(WARNING "❌ std::format support: NOT AVAILABLE - fallback to sprintf")
endif()

# Vérifier le support de std::source_location
check_cxx_source_compiles("
    #include <source_location>
    int main() {
        auto loc = std::source_location::current();
        return 0;
    }
" HAS_SOURCE_LOCATION)

if(HAS_SOURCE_LOCATION)
    message(STATUS "✅ std::source_location support: ENABLED")
    add_definitions(-DHAS_SOURCE_LOCATION)
else()
    message(WARNING "❌ std::source_location support: NOT AVAILABLE")
endif()

# Vérifier le support de consteval
check_cxx_source_compiles("
    consteval int square(int x) { return x * x; }
    int main() { return square(5); }
" HAS_CONSTEVAL)

if(HAS_CONSTEVAL)
    message(STATUS "✅ consteval support: ENABLED")
    add_definitions(-DHAS_CONSTEVAL)
else()
    message(WARNING "❌ consteval support: NOT AVAILABLE - using constexpr")
endif()

# =============================================================================
# Source Files Configuration
# =============================================================================

# Define where the additional source code lives. We need to crawl back the jni, main, src, app, android folders

# Audio System C++20 Sources
target_sources(${CMAKE_PROJECT_NAME} PRIVATE
    ../../../../../shared/NativeAudioEqualizerModule.cpp
    ../../../../../shared/Audio/core/AudioEqualizer.cpp
    ../../../../../shared/Audio/core/BiquadFilter.cpp
    ../../../../../shared/Audio/noise/NoiseReducer.cpp
    ../../../../../shared/Audio/noise/RNNoiseSuppressor.cpp
    ../../../../../shared/Audio/noise/SpectralNR.cpp
    ../../../../../shared/Audio/safety/AudioSafety.cpp
    ../../../../../shared/Audio/utils/AudioBuffer.cpp
    # Note: Effects are header-only for now
)

# Camera Filters System C++ Sources
target_sources(${CMAKE_PROJECT_NAME} PRIVATE
    ../../../../../shared/NativeCameraFiltersModule.cpp
    ../../../../../shared/filters/FFmpegFilterProcessor.cpp
    ../../../../../shared/filters/FilterFactory.cpp
    ../../../../../shared/filters/FilterManager.cpp
)

# =============================================================================
# Include Directories Configuration
# =============================================================================

# Define where CMake can find the additional header files
target_include_directories(${CMAKE_PROJECT_NAME} PUBLIC
    ../../../../../shared
    ../../../../../shared/Audio
    ../../../../../shared/Audio/core
    ../../../../../shared/Audio/noise
    ../../../../../shared/Audio/safety
    ../../../../../shared/Audio/utils
    ../../../../../shared/Audio/effects
    ../../../../../shared/filters
    ../../../../../shared/filters/common
)

# =============================================================================
# Build Summary
# =============================================================================

message(STATUS "🔧 C++20 Configuration Summary:")
message(STATUS "  - Standard: C++20")
message(STATUS "  - Extensions: ${CMAKE_CXX_EXTENSIONS}")
message(STATUS "  - Compiler: ${CMAKE_CXX_COMPILER_ID}")
message(STATUS "  - Version: ${CMAKE_CXX_COMPILER_VERSION}")
message(STATUS "  - Build Type: ${CMAKE_BUILD_TYPE}")

if(HAS_CONCEPTS)
    message(STATUS "  - Concepts: ✅ ENABLED")
else()
    message(STATUS "  - Concepts: ❌ DISABLED")
endif()

if(HAS_FORMAT)
    message(STATUS "  - std::format: ✅ ENABLED")
else()
    message(STATUS "  - std::format: ❌ DISABLED")
endif()

if(HAS_SOURCE_LOCATION)
    message(STATUS "  - std::source_location: ✅ ENABLED")
else()
    message(STATUS "  - std::source_location: ❌ DISABLED")
endif()

if(HAS_CONSTEVAL)
    message(STATUS "  - consteval: ✅ ENABLED")
else()
    message(STATUS "  - consteval: ❌ DISABLED")
endif()

message(STATUS "🎯 C++20 Audio Processing Modules configured successfully!")
