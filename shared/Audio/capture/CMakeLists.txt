cmake_minimum_required(VERSION 3.16)
project(NythAudioCapture LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Header-only capture API; create an INTERFACE target to carry includes/defs
add_library(nyth_audio_capture INTERFACE)

# Include path so headers can be included as "Audio/capture/..."
target_include_directories(nyth_audio_capture INTERFACE
  ${CMAKE_CURRENT_LIST_DIR}/../..
)

# Try to find ALSA; if found, enable ALSA backend
find_package(ALSA QUIET)
if(ALSA_FOUND)
  target_compile_definitions(nyth_audio_capture INTERFACE NYTH_USE_ALSA=1)
  target_link_libraries(nyth_audio_capture INTERFACE ALSA::ALSA)
endif()

# Example program
add_executable(audio_recorder_example
  examples/audio_recorder_example.cpp
)

target_link_libraries(audio_recorder_example PRIVATE nyth_audio_capture)

# Print a short summary
message(STATUS "Nyth Audio Capture: ALSA ${ALSA_FOUND}")