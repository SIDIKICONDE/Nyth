# CMake for shared/Audio/core

# Library sources
set(AUDIO_CORE_SOURCES
    AudioEqualizer.cpp
    BiquadFilter.cpp
)

add_library(audio_core STATIC ${AUDIO_CORE_SOURCES})

# Include directories (public so dependents can include headers)
target_include_directories(audio_core
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}
        ${CMAKE_CURRENT_SOURCE_DIR}/..
        ${CMAKE_CURRENT_SOURCE_DIR}/../../compat
)

# Set C++ standard and warnings
set_target_properties(audio_core PROPERTIES
    CXX_STANDARD 20
    CXX_STANDARD_REQUIRED YES
)

# Optionally add compile options
if (MSVC)
    target_compile_options(audio_core PRIVATE /W4)
else()
    target_compile_options(audio_core PRIVATE -Wall -Wextra -Wpedantic)
endif()