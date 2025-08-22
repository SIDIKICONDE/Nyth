# Main CMakeLists.txt for the project
cmake_minimum_required(VERSION 3.20)
project(AudioEqualizerProject)

# Configuration C++ standard - à configurer selon vos besoins
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Force l'utilisation de g++ pour éviter les problèmes de headers
set(CMAKE_CXX_COMPILER "g++")
set(CMAKE_C_COMPILER "gcc")

# Enable testing for the entire project
enable_testing()

# Add subdirectories
add_subdirectory(shared/Audio)

# Optional: Add other components here
# add_subdirectory(src)
# add_subdirectory(functions)

# Custom target to run all tests
add_custom_target(run_all_tests
    COMMAND ${CMAKE_CTEST_COMMAND} --output-on-failure
    DEPENDS audio_core_tests
    COMMENT "Running all tests"
)

# Custom target for coverage (if lcov is available)
find_program(LCOV lcov)
if(LCOV)
    add_custom_target(coverage
        COMMAND ${LCOV} --capture --directory . --output-file coverage.info
        COMMAND ${LCOV} --remove coverage.info '/usr/*' '*/tests/*' '*/build/*' --output-file coverage.info
        COMMAND genhtml coverage.info --output-directory coverage_report
        COMMENT "Generating coverage report"
    )
endif()

# Print configuration summary
message(STATUS "=== Audio Equalizer Project Configuration (C++17) ===")
message(STATUS "C++ Standard: ${CMAKE_CXX_STANDARD} (C++17)")
message(STATUS "Build Type: ${CMAKE_BUILD_TYPE}")
message(STATUS "Testing: Enabled")
if(LCOV)
    message(STATUS "Coverage: Enabled (lcov found)")
else()
    message(STATUS "Coverage: Disabled (lcov not found)")
endif()
message(STATUS "==========================================")
