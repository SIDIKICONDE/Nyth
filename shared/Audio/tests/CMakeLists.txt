# CMake for shared/Audio/tests

# Common include directories for tests
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/..
    ${CMAKE_CURRENT_SOURCE_DIR}/../core
    ${CMAKE_CURRENT_SOURCE_DIR}/../safety
    ${CMAKE_CURRENT_SOURCE_DIR}/../../compat
)

# Test: Corrections
add_executable(test_corrections TestCorrections.cpp)
target_link_libraries(test_corrections PRIVATE audio_core audio_safety)
set_target_properties(test_corrections PROPERTIES CXX_STANDARD 20 CXX_STANDARD_REQUIRED YES)

# Test: Benchmark (optional, not added to ctest by default due to long runtime)
add_executable(benchmark_optimizations BenchmarkOptimizations.cpp)
target_link_libraries(benchmark_optimizations PRIVATE audio_core)
set_target_properties(benchmark_optimizations PROPERTIES CXX_STANDARD 20 CXX_STANDARD_REQUIRED YES)

# AudioSafety unit tests
add_executable(test_audio_safety ../safety/TestAudioSafety.cpp)
target_link_libraries(test_audio_safety PRIVATE audio_safety audio_core)
set_target_properties(test_audio_safety PROPERTIES CXX_STANDARD 20 CXX_STANDARD_REQUIRED YES)

# Register tests with CTest
# add_test(NAME Audio_Corrections COMMAND test_corrections)
add_test(NAME Audio_Safety COMMAND test_audio_safety)
# Benchmark intentionally not registered