# Configuration C++20 pour Nyth

Ce dossier contient la configuration C++20 pour le projet Nyth.

## Fichiers de configuration

### `toolchain.cmake`
Configuration de toolchain C++20 pour toutes les plateformes :
- **Android NDK** avec support C++20
- **Apple Clang** avec support C++20
- **MSVC** avec support C++20
- Détection automatique des fonctionnalités C++20

### Utilisation dans CMakeLists.txt

```cmake
# Inclure la toolchain C++20
include(cmake/toolchain.cmake)

# Ou spécifiquement :
cmake_minimum_required(VERSION 3.18.1)
set(CMAKE_TOOLCHAIN_FILE ${CMAKE_SOURCE_DIR}/cmake/toolchain.cmake)
```

## Fonctionnalités C++20 configurées

### ✅ Activées automatiquement
- **Concepts** : Contraintes de type pour la sécurité
- **std::span** : Gestion sécurisée des buffers
- **std::format** : Formatage type-safe des messages
- **std::source_location** : Debug amélioré
- **consteval** : Calculs à la compilation
- **std::ranges** : Programmation fonctionnelle

### 🚀 Optimisations activées
- **O3** : Optimisation maximale
- **Fast math** : Optimisations mathématiques
- **Loop unrolling** : Déroulage des boucles
- **LTO** : Optimisation à l'édition de liens

## Plateformes supportées

### Android
- NDK r23+ requis pour C++20 complet
- Support arm64-v8a optimisé
- libc++ standard library

### iOS/macOS
- Xcode 14+ requis
- Support Apple Silicon (M1/M2)
- Bitcode activé

### Windows
- Visual Studio 2019+ requis
- Support MSVC avec /std:c++20

## Vérification de la configuration

Pour vérifier que C++20 est correctement configuré :

```bash
# Vérifier la version du compilateur
cmake --version

# Voir les flags de compilation
cmake -DCMAKE_BUILD_TYPE=Release -S . -B build
cd build
make VERBOSE=1  # ou ninja -v
```

## Variables CMake définies

- `HAS_CONCEPTS` : Concepts supportés
- `HAS_FORMAT` : std::format supporté
- `HAS_SOURCE_LOCATION` : source_location supporté
- `HAS_CONSTEVAL` : consteval supporté
- `HAS_SPAN` : std::span supporté
- `CXX20_AUDIO_ENABLED` : C++20 activé pour l'audio

## Dépannage

### Erreur "C++20 not supported"
- Vérifiez la version de votre compilateur
- Mettez à jour votre toolchain
- Consultez les logs CMake pour les détails

### Warnings sur les fonctionnalités manquantes
- Certaines fonctionnalités C++20 peuvent être manquantes
- Le code utilise des fallbacks automatiques
- Consultez les messages CMake pour les détails

## Fichiers liés

- `../CMakeLists.txt` : Configuration globale
- `../ios/CMakeLists.txt` : Configuration iOS spécifique
- `../android/app/src/main/jni/CMakeLists.txt` : Configuration Android spécifique
