# Architecture iOS/Android VideoFilterProcessor

## Vue d'ensemble

Cette architecture est **exclusivement dédiée aux plateformes mobiles iOS et Android**. Elle fournit une interface unifiée pour le traitement de filtres vidéo tout en permettant des implémentations optimisées spécifiques à chaque plateforme.

## Structure des dossiers

```
shared/Videos/Platform/
├── Common/                    # Code partagé entre iOS et Android
│   ├── IVideoFilterProcessor.hpp       # Interface commune
│   └── VideoFilterProcessorFactory.cpp # Factory et utilitaires
├── iOS/                       # Implémentation spécifique iOS
│   └── iOSVideoFilterProcessor.hpp
└── Android/                   # Implémentation spécifique Android
    └── AndroidVideoFilterProcessor.hpp
```

## 🚫 Plateformes Supportées

**✅ iOS** - Support complet avec Metal et OpenGL ES
**✅ Android** - Support complet avec Vulkan et OpenGL ES
**❌ Desktop** - Non supporté (utiliser l'ancienne implémentation OpenGLFilterProcessor)

## Avantages de cette architecture

### 1. **Séparation claire des responsabilités**

- **Common** : Interface et logique métier commune
- **iOS** : Optimisations et APIs spécifiques iOS (Metal/OpenGL ES)
- **Android** : Optimisations et APIs spécifiques Android (Vulkan/OpenGL ES)

### 2. **Maintenance facilitée**

- Corrections de bugs spécifiques à une plateforme
- Évolution indépendante des APIs natives
- Tests isolés par plateforme

### 3. **Performance optimisée**

- Utilisation des meilleures APIs par plateforme
- Optimisations matérielles spécifiques
- Gestion mémoire adaptée à chaque OS

### 4. **Évolutivité**

- Ajout de nouvelles plateformes (tvOS, macOS, etc.)
- Migration facile vers de nouvelles APIs (Metal 2, Vulkan 2)
- Support de fonctionnalités exclusives

## Interfaces et classes principales

### IVideoFilterProcessor (Interface commune)

```cpp
class IVideoFilterProcessor {
public:
    virtual bool initialize() = 0;
    virtual bool applyFilter(const FilterState& filter, ...) = 0;
    virtual bool setVideoFormat(int width, int height, ...) = 0;
    // ... autres méthodes communes
};
```

### Factory Pattern

```cpp
auto processor = VideoFilterProcessorFactory::createProcessor();
// Crée automatiquement la bonne implémentation selon la plateforme
```

## Implémentations par plateforme

### iOS (iOSVideoFilterProcessor)

**APIs supportées :**

- **Metal** (recommandé) : Haute performance, API moderne
- **OpenGL ES 3.0** (fallback) : Compatibilité legacy
- **Core Video** : Optimisations pour le pipeline vidéo iOS

**Optimisations iOS :**

- Utilisation de CVPixelBuffer pour zero-copy
- Intégration avec AVFoundation
- Support des formats de pixels iOS natifs
- Gestion optimisée de la mémoire autorelease

### Android (AndroidVideoFilterProcessor)

**APIs supportées :**

- **Vulkan** (recommandé) : Haute performance, API moderne
- **OpenGL ES 3.0** (fallback) : Compatibilité
- **Hardware Buffers** : Zero-copy avec Camera2 API

**Optimisations Android :**

- Utilisation d'AHardwareBuffer pour zero-copy
- Intégration avec Camera2 API
- Support des formats YUV Android natifs
- Gestion de la thermique et de la batterie

## Utilisation

### Code commun (identique sur toutes les plateformes)

```cpp
#include "Platform/Common/IVideoFilterProcessor.hpp"

void processVideoFrame(const void* inputData, void* outputData) {
    // Création automatique du processeur adapté à la plateforme
    auto processor = Camera::VideoFilterProcessorFactory::createProcessor();

    if (processor->initialize()) {
        Camera::FilterState filter;
        filter.type = Camera::FilterType::SEPIA;
        filter.params.intensity = 0.7f;

        processor->setVideoFormat(1920, 1080, "rgba");
        processor->applyFilter(filter, inputData, inputSize, outputData, outputSize);
    }
}
```

### Code spécifique iOS (optionnel)

```cpp
#ifdef __APPLE__
#include "Platform/iOS/iOSVideoFilterProcessor.hpp"

auto iosProcessor = std::make_unique<Camera::iOSVideoFilterProcessor>();
iosProcessor->setEAGLContext(myEAGLContext);
iosProcessor->useMetalBackend(true); // Utiliser Metal au lieu d'OpenGL ES
#endif
```

### Code spécifique Android (optionnel)

```cpp
#ifdef __ANDROID__
#include "Platform/Android/AndroidVideoFilterProcessor.hpp"

auto androidProcessor = std::make_unique<Camera::AndroidVideoFilterProcessor>();
androidProcessor->setEGLContext(myEGLContext);
androidProcessor->enableVulkanBackend(true); // Utiliser Vulkan
#endif
```

## Configuration de compilation

### iOS

```cmake
if(IOS)
    target_sources(myapp PRIVATE
        Platform/iOS/iOSVideoFilterProcessor.hpp
        Platform/iOS/iOSVideoFilterProcessor.cpp
    )
    target_link_libraries(myapp
        "-framework Metal"
        "-framework GLKit"
        "-framework OpenGLES"
    )
endif()
```

### Android

```cmake
if(ANDROID)
    target_sources(myapp PRIVATE
        Platform/Android/AndroidVideoFilterProcessor.hpp
        Platform/Android/AndroidVideoFilterProcessor.cpp
    )
    target_link_libraries(myapp
        android
        EGL
        GLESv3
    )
endif()
```

## Migration depuis l'ancienne architecture

### Avant (code monolithique)

```cpp
// Un seul fichier pour toutes les plateformes
#include "OpenGLFilterProcessor.hpp"
auto processor = std::make_unique<OpenGLFilterProcessor>();
```

### Après (architecture modulaire)

```cpp
// Interface commune, implémentation automatique
#include "Platform/Common/IVideoFilterProcessor.hpp"
auto processor = Camera::VideoFilterProcessorFactory::createProcessor();
```

## Tests et validation

### Tests unitaires par plateforme

- **iOS** : Tests avec XCTest, validation Metal/OpenGL ES
- **Android** : Tests avec JUnit, validation Vulkan/OpenGL ES
- **Desktop** : Tests de compatibilité OpenGL

### Tests d'intégration

- Validation de l'interface commune
- Tests de performance par plateforme
- Tests de compatibilité des formats

## Évolution future

### Nouvelles plateformes

- **tvOS** : Extension de l'iOS avec optimisations tvOS
- **macOS** : Version desktop avec Metal
- **Web** : Version WebGL/WebGPU

### Nouvelles APIs

- **Metal 2+** : Features avancées sur iOS
- **Vulkan 2+** : Ray tracing, etc. sur Android
- **WebGPU** : API moderne pour le web

Cette architecture permet une **évolution indépendante** de chaque plateforme tout en maintenant une **interface unifiée** pour le code applicatif.
