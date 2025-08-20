cmake_minimum_required(VERSION 3.13)

# Define the library name here.
project(appmodules)

# This file includes all the necessary to let you build your React Native application
include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)

# Define where the additional source code lives. We need to crawl back the jni, main, src, app, android folders

# Audio System C++ Sources
target_sources(${CMAKE_PROJECT_NAME} PRIVATE ../../../../../shared/NativeAudioEqualizerModule.cpp)
target_sources(${CMAKE_PROJECT_NAME} PRIVATE ../../../../../shared/Audio/core/AudioEqualizer.cpp)
target_sources(${CMAKE_PROJECT_NAME} PRIVATE ../../../../../shared/Audio/core/BiquadFilter.cpp)
target_sources(${CMAKE_PROJECT_NAME} PRIVATE ../../../../../shared/Audio/noise/NoiseReducer.cpp)
target_sources(${CMAKE_PROJECT_NAME} PRIVATE ../../../../../shared/Audio/noise/RNNoiseSuppressor.cpp)
target_sources(${CMAKE_PROJECT_NAME} PRIVATE ../../../../../shared/Audio/noise/SpectralNR.cpp)
target_sources(${CMAKE_PROJECT_NAME} PRIVATE ../../../../../shared/Audio/safety/AudioSafety.cpp)
target_sources(${CMAKE_PROJECT_NAME} PRIVATE ../../../../../shared/Audio/utils/AudioBuffer.cpp)

# Camera Filters System C++ Sources
target_sources(${CMAKE_PROJECT_NAME} PRIVATE ../../../../../shared/NativeCameraFiltersModule.cpp)
target_sources(${CMAKE_PROJECT_NAME} PRIVATE ../../../../../shared/filters/FFmpegFilterProcessor.cpp)
target_sources(${CMAKE_PROJECT_NAME} PRIVATE ../../../../../shared/filters/FilterFactory.cpp)
target_sources(${CMAKE_PROJECT_NAME} PRIVATE ../../../../../shared/filters/FilterManager.cpp)
target_sources(${CMAKE_PROJECT_NAME} PRIVATE ../../../../../shared/filters/vulkan/VulkanFilterProcessor.cpp)

# Define where CMake can find the additional header files. We need to crawl back the jni, main, src, app, android folders
target_include_directories(${CMAKE_PROJECT_NAME} PUBLIC ../../../../../shared)
target_include_directories(${CMAKE_PROJECT_NAME} PUBLIC ../../../../../shared/Audio)
target_include_directories(${CMAKE_PROJECT_NAME} PUBLIC ../../../../../shared/Audio/core)
target_include_directories(${CMAKE_PROJECT_NAME} PUBLIC ../../../../../shared/Audio/noise)
target_include_directories(${CMAKE_PROJECT_NAME} PUBLIC ../../../../../shared/Audio/safety)
target_include_directories(${CMAKE_PROJECT_NAME} PUBLIC ../../../../../shared/Audio/utils)
target_include_directories(${CMAKE_PROJECT_NAME} PUBLIC ../../../../../shared/Audio/effects)
target_include_directories(${CMAKE_PROJECT_NAME} PUBLIC ../../../../../shared/filters)
target_include_directories(${CMAKE_PROJECT_NAME} PUBLIC ../../../../../shared/filters/common)
target_include_directories(${CMAKE_PROJECT_NAME} PUBLIC ../../../../../shared/filters/vulkan)