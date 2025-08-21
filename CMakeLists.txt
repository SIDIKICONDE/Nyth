# =============================================================================
# CMakeLists.txt - Configuration C++20 Globale pour Nyth
# =============================================================================
cmake_minimum_required(VERSION 3.18.1)

project(Nyth
    VERSION 1.0.0
    DESCRIPTION "Nyth - Application mobile avec traitement audio C++20"
    LANGUAGES CXX C
)

# =============================================================================
# C++20 Global Configuration
# =============================================================================

# Force C++20 standard pour tous les sous-projets
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Configuration globale des flags de compilation
if(MSVC)
    # Configuration pour MSVC (Windows)
    add_compile_options(
        /std:c++20
        /O2
        /Wall
        /DNDEBUG
        /DCXX20_AUDIO_ENABLED
    )
elseif(CMAKE_CXX_COMPILER_ID MATCHES "Clang|GNU")
    # Configuration pour Clang/GCC (macOS, Linux, Android)
    add_compile_options(
        -std=c++20
        -O3
        -Wall
        -Wextra
        -Wpedantic
        -Wshadow
        -Wconversion
        -Wsign-conversion
        -Wunused
        -fvisibility=hidden
        -ffast-math
        -funroll-loops
        -DNDEBUG
        -DCXX20_AUDIO_ENABLED
    )
endif()

# =============================================================================
# C++20 Feature Detection
# =============================================================================

include(CheckCXXSourceCompiles)

# Vérifier les concepts
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

# Vérifier std::format
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
    message(WARNING "❌ std::format support: NOT AVAILABLE")
endif()

# Vérifier std::source_location
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

# Vérifier consteval
check_cxx_source_compiles("
    consteval int square(int x) { return x * x; }
    int main() { return square(5); }
" HAS_CONSTEVAL)

if(HAS_CONSTEVAL)
    message(STATUS "✅ consteval support: ENABLED")
    add_definitions(-DHAS_CONSTEVAL)
else()
    message(WARNING "❌ consteval support: NOT AVAILABLE")
endif()

# =============================================================================
# Include Directories
# =============================================================================

include_directories(
    shared
    shared/Audio
    shared/Audio/core
    shared/Audio/noise
    shared/Audio/safety
    shared/Audio/utils
    shared/Audio/effects
    shared/filters
    shared/filters/common
)

# =============================================================================
# Build Summary
# =============================================================================

message(STATUS "🔧 C++20 Global Configuration Summary:")
message(STATUS "  - C++ Standard: ${CMAKE_CXX_STANDARD}")
message(STATUS "  - Compiler: ${CMAKE_CXX_COMPILER_ID}")
message(STATUS "  - Version: ${CMAKE_CXX_COMPILER_VERSION}")
message(STATUS "  - Platform: ${CMAKE_SYSTEM_NAME}")

if(HAS_CONCEPTS)
    message(STATUS "  - Concepts: ✅ ENABLED")
endif()

if(HAS_FORMAT)
    message(STATUS "  - std::format: ✅ ENABLED")
endif()

if(HAS_SOURCE_LOCATION)
    message(STATUS "  - std::source_location: ✅ ENABLED")
endif()

if(HAS_CONSTEVAL)
    message(STATUS "  - consteval: ✅ ENABLED")
endif()

message(STATUS "🎯 C++20 Global Configuration completed successfully!")

# =============================================================================
# Subdirectories
# =============================================================================

# Inclure les configurations spécifiques à chaque plateforme
if(ANDROID)
    message(STATUS "📱 Building for Android with C++20")
elseif(APPLE)
    message(STATUS "🍎 Building for Apple platforms with C++20")
elseif(WIN32)
    message(STATUS "🖥️ Building for Windows with C++20")
endif()