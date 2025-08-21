# =============================================================================
# toolchain.cmake - Configuration C++20 Toolchain
# =============================================================================

# Configuration C++20 pour toutes les plateformes
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# =============================================================================
# Platform-specific configurations
# =============================================================================

if(ANDROID)
    # Configuration pour Android NDK avec C++20
    message(STATUS "🔧 Configuring Android toolchain for C++20")

    # Assurer que l'NDK supporte C++20
    if(CMAKE_ANDROID_NDK_VERSION LESS 23)
        message(WARNING "⚠️  Android NDK version ${CMAKE_ANDROID_NDK_VERSION} may not fully support C++20")
    endif()

    # Flags spécifiques Android
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++20 -fexceptions -frtti")
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -fexceptions -frtti")

    # Support pour les architectures 64-bit
    if(CMAKE_ANDROID_ARCH_ABI STREQUAL "arm64-v8a")
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -march=armv8-a")
    endif()

elseif(APPLE)
    # Configuration pour Apple platforms avec C++20
    message(STATUS "🔧 Configuring Apple toolchain for C++20")

    # Flags spécifiques Apple
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++20 -stdlib=libc++")
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -stdlib=libc++")

    # Support pour Apple Silicon
    if(CMAKE_SYSTEM_PROCESSOR STREQUAL "arm64")
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -mcpu=apple-m1")
    endif()

elseif(WIN32)
    # Configuration pour Windows avec C++20
    message(STATUS "🔧 Configuring Windows toolchain for C++20")

    # Flags spécifiques MSVC
    add_compile_options(/std:c++20 /Zc:__cplusplus)

    # Configuration pour différentes versions de MSVC
    if(MSVC_VERSION GREATER_EQUAL 1930)  # VS 2022
        add_compile_options(/std:c++20)
    elseif(MSVC_VERSION GREATER_EQUAL 1920)  # VS 2019
        add_compile_options(/std:c++20)
    endif()

endif()

# =============================================================================
# Common C++20 optimization flags
# =============================================================================

# Flags d'optimisation pour toutes les plateformes
add_compile_options(
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

# =============================================================================
# C++20 Feature flags
# =============================================================================

# Détection et configuration des fonctionnalités C++20
include(CheckCXXSourceCompiles)

# Concepts
check_cxx_source_compiles("
    #include <concepts>
    template<typename T>
    concept Integral = std::integral<T>;
    int main() { return 0; }
" HAS_CONCEPTS)

if(HAS_CONCEPTS)
    add_definitions(-DHAS_CONCEPTS)
    message(STATUS "✅ C++20 Concepts: ENABLED")
else()
    message(WARNING "❌ C++20 Concepts: NOT AVAILABLE")
endif()

# std::format
check_cxx_source_compiles("
    #include <format>
    int main() {
        std::string s = std::format(\"Hello {}\", \"World\");
        return 0;
    }
" HAS_FORMAT)

if(HAS_FORMAT)
    add_definitions(-DHAS_FORMAT)
    message(STATUS "✅ std::format: ENABLED")
else()
    message(WARNING "❌ std::format: NOT AVAILABLE")
endif()

# std::source_location
check_cxx_source_compiles("
    #include <source_location>
    int main() {
        auto loc = std::source_location::current();
        return 0;
    }
" HAS_SOURCE_LOCATION)

if(HAS_SOURCE_LOCATION)
    add_definitions(-DHAS_SOURCE_LOCATION)
    message(STATUS "✅ std::source_location: ENABLED")
else()
    message(WARNING "❌ std::source_location: NOT AVAILABLE")
endif()

# consteval
check_cxx_source_compiles("
    consteval int square(int x) { return x * x; }
    int main() { return square(5); }
" HAS_CONSTEVAL)

if(HAS_CONSTEVAL)
    add_definitions(-DHAS_CONSTEVAL)
    message(STATUS "✅ consteval: ENABLED")
else()
    message(WARNING "❌ consteval: NOT AVAILABLE")
endif()

# std::span
check_cxx_source_compiles("
    #include <span>
    int main() {
        int arr[5] = {1, 2, 3, 4, 5};
        std::span<int> s(arr);
        return 0;
    }
" HAS_SPAN)

if(HAS_SPAN)
    add_definitions(-DHAS_SPAN)
    message(STATUS "✅ std::span: ENABLED")
else()
    message(WARNING "❌ std::span: NOT AVAILABLE")
endif()

message(STATUS "🎯 C++20 toolchain configuration completed!")
