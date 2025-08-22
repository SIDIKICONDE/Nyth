# CMakeLists.txt pour les exemples de capture audio

# Exemple principal
add_executable(audio_recorder_example
    audio_recorder_example.cpp
)

target_link_libraries(audio_recorder_example
    PRIVATE NythAudioCapture
)

# Définir le répertoire de sortie pour les exécutables
set_target_properties(audio_recorder_example PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin"
)

# Copier les exemples dans le répertoire d'installation
install(TARGETS audio_recorder_example
    RUNTIME DESTINATION bin/examples
)

# Message d'information
message(STATUS "  Examples will be built in: ${CMAKE_BINARY_DIR}/bin")