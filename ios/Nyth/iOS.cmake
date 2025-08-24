# iOS Toolchain for CMake

# Définir le nom du système cible
set(CMAKE_SYSTEM_NAME iOS)

# Définir les architectures cibles (ex: ARM64 pour les appareils, x86_64 pour le simulateur)
set(CMAKE_OSX_ARCHITECTURES "arm64;x86_64" CACHE STRING "Architectures for iOS")

# Définir la version minimale d'iOS
set(CMAKE_OSX_DEPLOYMENT_TARGET "13.0" CACHE STRING "Minimum iOS deployment version")

# Définir le chemin vers le SDK iOS
find_program(XCRUN_EXECUTABLE xcrun)
if(NOT XCRUN_EXECUTABLE)
    message(FATAL_ERROR "xcrun executable not found!")
endif()

execute_process(
    COMMAND ${XCRUN_EXECUTABLE} --sdk iphoneos --show-sdk-path
    OUTPUT_VARIABLE CMAKE_OSX_SYSROOT
    OUTPUT_STRIP_TRAILING_WHITESPACE
)

# Activer la visibilité des symboles pour C++
set(CMAKE_CXX_VISIBILITY_PRESET hidden)
