cmake_minimum_required(VERSION 3.14)
project(AudioCoreTests)

# C++ Standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Build type
if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release)
endif()

# Compiler flags
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -Wextra -Wpedantic")
set(CMAKE_CXX_FLAGS_DEBUG "-g -O0 -DDEBUG")
set(CMAKE_CXX_FLAGS_RELEASE "-O3 -DNDEBUG -march=native -mtune=native")

# Enable testing
enable_testing()

# Find packages
find_package(Threads REQUIRED)

# Google Test
include(FetchContent)
FetchContent_Declare(
    googletest
    GIT_REPOSITORY https://github.com/google/googletest.git
    GIT_TAG release-1.12.1
)
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)

# Include directories
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/../
    ${CMAKE_CURRENT_SOURCE_DIR}/../core
    ${CMAKE_CURRENT_SOURCE_DIR}/../effects
    ${CMAKE_CURRENT_SOURCE_DIR}/../utils
    ${CMAKE_CURRENT_SOURCE_DIR}/../safety
)

# Source files for the Audio Core library
set(AUDIO_CORE_SOURCES
    ../core/BiquadFilter.cpp
    ../core/AudioEqualizer.cpp
    ../core/EQPresetFactory.cpp
)

# Create Audio Core library
add_library(AudioCore STATIC ${AUDIO_CORE_SOURCES})
target_compile_features(AudioCore PUBLIC cxx_std_17)

# SIMD optimizations
if(CMAKE_SYSTEM_PROCESSOR MATCHES "x86_64|AMD64")
    target_compile_options(AudioCore PRIVATE -msse2 -msse3 -mssse3 -msse4.1 -msse4.2)
    if(CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
        # Check for AVX support
        include(CheckCXXCompilerFlag)
        CHECK_CXX_COMPILER_FLAG("-mavx" COMPILER_SUPPORTS_AVX)
        CHECK_CXX_COMPILER_FLAG("-mavx2" COMPILER_SUPPORTS_AVX2)
        CHECK_CXX_COMPILER_FLAG("-mfma" COMPILER_SUPPORTS_FMA)
        
        if(COMPILER_SUPPORTS_AVX)
            target_compile_options(AudioCore PRIVATE -mavx)
        endif()
        if(COMPILER_SUPPORTS_AVX2)
            target_compile_options(AudioCore PRIVATE -mavx2)
        endif()
        if(COMPILER_SUPPORTS_FMA)
            target_compile_options(AudioCore PRIVATE -mfma)
        endif()
    endif()
elseif(CMAKE_SYSTEM_PROCESSOR MATCHES "arm|aarch64")
    if(CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
        target_compile_options(AudioCore PRIVATE -mfpu=neon)
    endif()
endif()

# Test executables
add_executable(TestAudioCoreSimple TestAudioCoreSimple.cpp)
#add_executable(TestAudioCore TestAudioCore.cpp)
#add_executable(TestSpecializedComponents TestSpecializedComponents.cpp)
add_executable(BenchmarkOptimizations BenchmarkOptimizations.cpp)

# Link libraries
target_link_libraries(TestAudioCoreSimple
    AudioCore
    gtest
    gtest_main
    gmock
    Threads::Threads
)

#target_link_libraries(TestAudioCore
#    AudioCore
#    gtest
#    gtest_main
#    gmock
#    Threads::Threads
#)

#target_link_libraries(TestSpecializedComponents
#    AudioCore
#    gtest
#    gtest_main
#    gmock
#    Threads::Threads
#)

target_link_libraries(BenchmarkOptimizations
    AudioCore
    Threads::Threads
)

# Add tests
add_test(NAME AudioCoreSimpleTest COMMAND TestAudioCoreSimple)
#add_test(NAME AudioCoreTest COMMAND TestAudioCore)
#add_test(NAME SpecializedComponentsTest COMMAND TestSpecializedComponents)
add_test(NAME BenchmarkTest COMMAND BenchmarkOptimizations)

# Set test properties
set_tests_properties(AudioCoreSimpleTest PROPERTIES
    TIMEOUT 60
    LABELS "core;unit"
)

#set_tests_properties(SpecializedComponentsTest PROPERTIES
#    TIMEOUT 60
#    LABELS "specialized;unit"
#)

set_tests_properties(BenchmarkTest PROPERTIES
    TIMEOUT 120
    LABELS "performance;benchmark"
)

# Custom target to run all tests
add_custom_target(run_tests
    COMMAND ${CMAKE_CTEST_COMMAND} --output-on-failure
    DEPENDS TestAudioCore TestSpecializedComponents BenchmarkOptimizations
    COMMENT "Running all Audio Core tests..."
)

# Custom target to run tests with valgrind (if available)
find_program(VALGRIND_EXECUTABLE valgrind)
if(VALGRIND_EXECUTABLE)
    add_custom_target(valgrind_tests
        COMMAND ${VALGRIND_EXECUTABLE} --leak-check=full --show-leak-kinds=all --track-origins=yes --verbose ./TestAudioCore
        COMMAND ${VALGRIND_EXECUTABLE} --leak-check=full --show-leak-kinds=all --track-origins=yes --verbose ./TestSpecializedComponents
        DEPENDS TestAudioCore TestSpecializedComponents
        COMMENT "Running tests with Valgrind memory checker..."
    )
endif()

# Coverage target (requires gcov)
if(CMAKE_BUILD_TYPE STREQUAL "Debug" AND CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
    option(ENABLE_COVERAGE "Enable code coverage" OFF)
    if(ENABLE_COVERAGE)
        target_compile_options(AudioCore PRIVATE --coverage)
        target_link_options(AudioCore PRIVATE --coverage)
        target_compile_options(TestAudioCore PRIVATE --coverage)
        target_link_options(TestAudioCore PRIVATE --coverage)
        target_compile_options(TestSpecializedComponents PRIVATE --coverage)
        target_link_options(TestSpecializedComponents PRIVATE --coverage)
        
        add_custom_target(coverage
            COMMAND ${CMAKE_COMMAND} -E remove_directory ${CMAKE_BINARY_DIR}/coverage
            COMMAND ${CMAKE_COMMAND} -E make_directory ${CMAKE_BINARY_DIR}/coverage
            COMMAND ${CMAKE_CTEST_COMMAND}
            COMMAND lcov --capture --directory . --output-file ${CMAKE_BINARY_DIR}/coverage/coverage.info
            COMMAND lcov --remove ${CMAKE_BINARY_DIR}/coverage/coverage.info '/usr/*' --output-file ${CMAKE_BINARY_DIR}/coverage/coverage.info
            COMMAND lcov --remove ${CMAKE_BINARY_DIR}/coverage/coverage.info '*/googletest/*' --output-file ${CMAKE_BINARY_DIR}/coverage/coverage.info
            COMMAND genhtml ${CMAKE_BINARY_DIR}/coverage/coverage.info --output-directory ${CMAKE_BINARY_DIR}/coverage
            DEPENDS TestAudioCore TestSpecializedComponents
            COMMENT "Generating code coverage report..."
        )
    endif()
endif()

# Installation
install(TARGETS AudioCore
    ARCHIVE DESTINATION lib
    LIBRARY DESTINATION lib
)

install(DIRECTORY ../core/
    DESTINATION include/AudioFX/core
    FILES_MATCHING PATTERN "*.hpp"
)

# Print configuration summary
message(STATUS "===================================")
message(STATUS "Audio Core Tests Configuration:")
message(STATUS "  Build Type: ${CMAKE_BUILD_TYPE}")
message(STATUS "  C++ Standard: ${CMAKE_CXX_STANDARD}")
message(STATUS "  Compiler: ${CMAKE_CXX_COMPILER_ID}")
message(STATUS "  System: ${CMAKE_SYSTEM_NAME}")
message(STATUS "  Processor: ${CMAKE_SYSTEM_PROCESSOR}")
if(VALGRIND_EXECUTABLE)
    message(STATUS "  Valgrind: Found")
else()
    message(STATUS "  Valgrind: Not found")
endif()
if(ENABLE_COVERAGE)
    message(STATUS "  Coverage: Enabled")
else()
    message(STATUS "  Coverage: Disabled")
endif()
message(STATUS "===================================")