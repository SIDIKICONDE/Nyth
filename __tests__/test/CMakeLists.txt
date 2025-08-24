cmake_minimum_required(VERSION 3.20)
project(SIMDTestSuite CXX)

# Configuration C++17
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Optimisations
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -O3 -march=native")

# Inclure Google Test
include(FetchContent)
FetchContent_Declare(
  googletest
  URL https://github.com/google/googletest/archive/refs/tags/v1.14.0.zip
)
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)

# Sources des tests
set(TEST_SOURCES
    test_simd_math_functions.cpp
)

# Sources SIMD
set(SIMD_SOURCES
    ${CMAKE_SOURCE_DIR}/shared/Audio/common/SIMD/SIMDCore.cpp
    ${CMAKE_SOURCE_DIR}/shared/Audio/common/SIMD/SIMDMathFunctions.cpp
    ${CMAKE_SOURCE_DIR}/shared/Audio/common/SIMD/SIMDIntegration.cpp
)

# Créer l'exécutable de test
add_executable(simd_tests ${TEST_SOURCES} ${SIMD_SOURCES})

# Inclure les headers
target_include_directories(simd_tests PRIVATE
    ${CMAKE_SOURCE_DIR}
    ${CMAKE_SOURCE_DIR}/shared
)

# Linker avec Google Test
target_link_libraries(simd_tests PRIVATE
    GTest::gtest_main
    GTest::gmock_main
)

# CTest integration
include(GoogleTest)
gtest_discover_tests(simd_tests)
