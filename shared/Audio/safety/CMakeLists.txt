# CMakeLists.txt pour le module de sécurité audio refactorisé

cmake_minimum_required(VERSION 3.10)

# Nom du projet
project(NythAudioSafety LANGUAGES CXX)

# Configuration C++17
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Options de compilation
if(MSVC)
    add_compile_options(/W4 /WX)
else()
    add_compile_options(-Wall -Wextra -Wpedantic)
endif()

# Fichiers sources
set(SAFETY_SOURCES
    config/SafetyConfig.cpp
    managers/SafetyManager.cpp
    jsi/SafetyJSIConverter.cpp
    NativeAudioSafetyModule.cpp
)

# Fichiers headers
set(SAFETY_HEADERS
    config/SafetyLimits.h
    config/SafetyConfig.h
    managers/SafetyManager.h
    jsi/SafetyJSIConverter.h
    NativeAudioSafetyModule.h
)

# Bibliothèque principale
add_library(${PROJECT_NAME} SHARED ${SAFETY_SOURCES} ${SAFETY_HEADERS})

# Includes
target_include_directories(${PROJECT_NAME}
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}/config
        ${CMAKE_CURRENT_SOURCE_DIR}/managers
        ${CMAKE_CURRENT_SOURCE_DIR}/jsi
    PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/../../../
)

# Dépendances React Native
find_package(React REQUIRED)
target_link_libraries(${PROJECT_NAME} React::TurboModule)

# Dépendances système
if(WIN32)
    target_link_libraries(${PROJECT_NAME} ws2_32)
elseif(UNIX)
    target_link_libraries(${PROJECT_NAME} m) # math library
endif()

# Définitions de préprocesseur
target_compile_definitions(${PROJECT_NAME}
    PRIVATE
        NYTH_AUDIO_SAFETY_ENABLED=1
)

# Optimisations
if(CMAKE_BUILD_TYPE STREQUAL "Release")
    target_compile_options(${PROJECT_NAME} PRIVATE -O3)
    if(CMAKE_CXX_COMPILER_ID MATCHES "Clang|GNU")
        target_compile_options(${PROJECT_NAME} PRIVATE -flto)
    endif()
endif()

# Installation
install(TARGETS ${PROJECT_NAME}
    LIBRARY DESTINATION lib
    ARCHIVE DESTINATION lib
    RUNTIME DESTINATION bin
)

# Tests (optionnel)
option(BUILD_SAFETY_TESTS "Build safety module tests" OFF)
if(BUILD_SAFETY_TESTS)
    enable_testing()

    # Fichiers de test
    set(TEST_SOURCES
        tests/SafetyManagerTest.cpp
        tests/SafetyJSIConverterTest.cpp
        tests/SafetyConfigTest.cpp
    )

    # Exécutable de tests
    add_executable(${PROJECT_NAME}Tests ${TEST_SOURCES})

    # Dépendances de tests
    find_package(GTest REQUIRED)
    target_link_libraries(${PROJECT_NAME}Tests
        ${PROJECT_NAME}
        GTest::GTest
        GTest::Main
    )

    # Découverte des tests
    include(GoogleTest)
    gtest_discover_tests(${PROJECT_NAME}Tests)
endif()

# Documentation
option(BUILD_SAFETY_DOCS "Build safety module documentation" OFF)
if(BUILD_SAFETY_DOCS)
    find_package(Doxygen REQUIRED)
    set(DOXYGEN_INPUT_DIR ${CMAKE_CURRENT_SOURCE_DIR})
    set(DOXYGEN_OUTPUT_DIR ${CMAKE_CURRENT_BINARY_DIR}/docs)
    configure_file(${CMAKE_CURRENT_SOURCE_DIR}/Doxyfile.in ${CMAKE_CURRENT_BINARY_DIR}/Doxyfile @ONLY)
    add_custom_target(${PROJECT_NAME}Docs
        COMMAND ${DOXYGEN_EXECUTABLE} ${CMAKE_CURRENT_BINARY_DIR}/Doxyfile
        WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}
        COMMENT "Generating API documentation"
        VERBATIM
    )
endif()

# Affichage de la configuration
message(STATUS "NythAudioSafety configuration:")
message(STATUS "  C++ Standard: ${CMAKE_CXX_STANDARD}")
message(STATUS "  Build type: ${CMAKE_BUILD_TYPE}")
message(STATUS "  Tests: ${BUILD_SAFETY_TESTS}")
message(STATUS "  Documentation: ${BUILD_SAFETY_DOCS}")
message(STATUS "  Compiler: ${CMAKE_CXX_COMPILER_ID} ${CMAKE_CXX_COMPILER_VERSION}")

