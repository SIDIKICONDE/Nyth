# CMake for shared/Audio/safety

set(AUDIO_SAFETY_SOURCES
    AudioSafety.cpp
)

add_library(audio_safety STATIC ${AUDIO_SAFETY_SOURCES})

# Include directories
target_include_directories(audio_safety
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}
        ${CMAKE_CURRENT_SOURCE_DIR}/..
        ${CMAKE_CURRENT_SOURCE_DIR}/../../compat
)

# Link to audio_core for DbLookupTable and other shared utilities if needed
# Note: DbLookupTable.hpp is header-only, but link for future deps

target_link_libraries(audio_safety PUBLIC audio_core)

set_target_properties(audio_safety PROPERTIES
    CXX_STANDARD 20
    CXX_STANDARD_REQUIRED YES
)

if (MSVC)
    target_compile_options(audio_safety PRIVATE /W4)
else()
    target_compile_options(audio_safety PRIVATE -Wall -Wextra -Wpedantic)
endif()