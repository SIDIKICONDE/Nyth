# CMakeLists.txt - Configuration C++20 pour iOS/macOS
cmake_minimum_required(VERSION 3.18.1)

project(Nyth
    VERSION 1.0.0
    DESCRIPTION "Nyth iOS Application with C++20 Audio Processing"
    LANGUAGES CXX C OBJCXX  # Support pour Objective-C++
)

# =============================================================================
# C++20 Configuration pour iOS
# =============================================================================

# Force C++20 standard
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Configuration spécifique pour Apple Clang
if(CMAKE_SYSTEM_NAME STREQUAL "iOS" OR CMAKE_SYSTEM_NAME STREQUAL "Darwin")
    # Flags spécifiques pour Apple Clang
    add_compile_options(
        -std=c++20
        -stdlib=libc++
        -fobjc-arc  # ARC pour Objective-C
        -fmodules   # Modules support
        -fcxx-modules  # C++ modules
    )

    # Optimisations pour Apple Silicon et Intel
    if(CMAKE_SYSTEM_PROCESSOR STREQUAL "arm64")
        add_compile_options(-mcpu=apple-m1)
    endif()
endif()

# =============================================================================
# Build Configuration
# =============================================================================

# Configuration Debug
set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} -g -O0")
set(CMAKE_C_FLAGS_DEBUG "${CMAKE_C_FLAGS_DEBUG} -g -O0")

# Configuration Release
set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} -O3 -DNDEBUG")
set(CMAKE_C_FLAGS_RELEASE "${CMAKE_C_FLAGS_RELEASE} -O3 -DNDEBUG")

# Flags de sécurité et warnings
add_compile_options(
    -Wall
    -Wextra
    -Wpedantic
    -Wshadow
    -Wconversion
    -Wsign-conversion
    -Wunused
    -fvisibility=hidden
    -fstack-protector-strong
)

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
# Audio Effects C++20 Sources
# =============================================================================

# C++20 Effects Sources (nouvellement ajoutés)
set(EFFECTS_SOURCES
    ../shared/Audio/effects/Compressor.cpp
    ../shared/Audio/effects/Delay.cpp
    ../shared/Audio/effects/EffectChain.cpp
    ../shared/Audio/effects/EffectBase.cpp
)

# =============================================================================
# Source Files
# =============================================================================

# C++20 Audio Processing Sources
set(AUDIO_SOURCES
    ../shared/NativeAudioEqualizerModule.cpp
    ../shared/Audio/core/AudioEqualizer.cpp
    ../shared/Audio/core/BiquadFilter.cpp
    ../shared/Audio/noise/NoiseReducer.cpp
    ../shared/Audio/noise/RNNoiseSuppressor.cpp
    ../shared/Audio/noise/SpectralNR.cpp
    ../shared/Audio/safety/AudioSafety.cpp
    ../shared/Audio/utils/AudioBuffer.cpp
)

# Camera Filters Sources
set(CAMERA_SOURCES
    ../shared/NativeCameraFiltersModule.cpp
    ../shared/filters/FFmpegFilterProcessor.cpp
    ../shared/filters/FilterFactory.cpp
    ../shared/filters/FilterManager.cpp
)

# =============================================================================
# Include Directories
# =============================================================================

include_directories(
    ../shared
    ../shared/Audio
    ../shared/Audio/core
    ../shared/Audio/noise
    ../shared/Audio/safety
    ../shared/Audio/utils
    ../shared/Audio/effects
    ../shared/filters
    ../shared/filters/common
    # iOS frameworks
    ${CMAKE_SOURCE_DIR}/../../../ios/Pods/Headers/Public
)

# =============================================================================
# Build Summary
# =============================================================================

message(STATUS "🔧 iOS C++20 Configuration Summary:")
message(STATUS "  - Platform: ${CMAKE_SYSTEM_NAME}")
message(STATUS "  - Architecture: ${CMAKE_SYSTEM_PROCESSOR}")
message(STATUS "  - C++ Standard: ${CMAKE_CXX_STANDARD}")
message(STATUS "  - Compiler: ${CMAKE_CXX_COMPILER_ID}")
message(STATUS "  - Version: ${CMAKE_CXX_COMPILER_VERSION}")

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

message(STATUS "🎯 iOS C++20 Audio Processing configured successfully!")
