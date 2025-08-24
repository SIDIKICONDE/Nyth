# 🛠️ Guide de développement - Effets Audio

## Vue d'ensemble

Ce guide fournit les instructions complètes pour développer, compiler, tester et contribuer au système d'effets audio de Nyth.

## 📋 Prérequis

### Configuration système requise

#### Matériel

- **Processeur** : x64 ou ARM64
- **Mémoire** : Minimum 4GB RAM (8GB recommandé)
- **Stockage** : 2GB d'espace libre

#### Logiciel

- **Système d'exploitation** :
  - macOS 11.0+ (iOS development)
  - Windows 10+ avec WSL2 (Android development)
  - Linux Ubuntu 20.04+ (Cross-platform)

### Outils de développement

#### Outils obligatoires

```bash
# Node.js et npm
node --version  # v16.0.0 minimum
npm --version   # v7.0.0 minimum

# React Native CLI
npm install -g @react-native-community/cli

# CMake
cmake --version  # v3.10.0 minimum

# Python (pour les scripts de build)
python3 --version  # v3.7+ minimum
```

#### Outils recommandés

```bash
# Gestionnaire de versions Node
npm install -g nvm

# Linting et formatage
npm install -g eslint prettier

# Tests
npm install -g jest

# Documentation
npm install -g typedoc
```

### Configuration de l'environnement

#### 1. Variables d'environnement

```bash
# Fichier .env ou export direct
export NODE_ENV=development
export REACT_NATIVE_DEBUG=true
export NYTH_AUDIO_DEBUG=true
export CMAKE_BUILD_TYPE=Debug
```

#### 2. Configuration CMake

```cmake
# toolchain.cmake (pour compilation croisée)
set(CMAKE_SYSTEM_NAME iOS)
set(CMAKE_SYSTEM_PROCESSOR arm64)
set(CMAKE_OSX_DEPLOYMENT_TARGET 11.0)
```

## 🚀 Installation et configuration

### Clonage du projet

```bash
# Clonage du repository
git clone https://github.com/your-org/nyth.git
cd nyth

# Installation des dépendances
npm install

# Installation des dépendances iOS
cd ios && pod install
cd ..

# Installation des dépendances Android
cd android && ./gradlew build
cd ..
```

### Configuration des sous-modules

```bash
# Initialisation des sous-modules
git submodule update --init --recursive

# Mise à jour des sous-modules
git submodule foreach git pull origin main
```

### Configuration du projet

#### iOS

```bash
# Configuration Xcode
open ios/Nyth.xcworkspace

# Dans Xcode:
# 1. Sélectionner le target "Nyth"
# 2. Build Settings > Architectures: arm64, x86_64
# 3. Build Settings > C++ Standard: C++17
# 4. Signing & Capabilities: Activer Audio Background Mode
```

#### Android

```gradle
// android/app/build.gradle
android {
    defaultConfig {
        externalNativeBuild {
            cmake {
                arguments "-DANDROID_STL=c++_shared",
                         "-DCMAKE_BUILD_TYPE=Debug"
            }
        }
    }
}
```

## 🏗️ Architecture du code

### Structure des répertoires

```
effects/
├── components/           # Composants d'effets
│   ├── EffectBase.hpp   # Interface de base
│   ├── Compressor.hpp   # Implémentation compresseur
│   ├── Delay.hpp       # Implémentation delay
│   ├── constant/       # Constantes
│   └── docs/          # Documentation composants
├── config/             # Configuration système
│   ├── EffectsConfig.h/cpp  # Configuration principale
│   └── EffectsLimits.h      # Limites et contraintes
├── jsi/               # Interface JavaScript
│   └── EffectsJSIConverter.h/cpp  # Conversion JSI
├── managers/          # Gestionnaires
│   ├── EffectManager.h/cpp    # Gestionnaire principal
│   ├── CompressorManager.h/cpp # Gestion compresseur
│   └── DelayManager.h/cpp     # Gestion delay
├── NativeAudioEffectsModule.h/cpp  # Module TurboModule
└── Docs/             # Documentation
```

### Conventions de nommage

#### Fichiers C++

- **Headers** : `.hpp` (au lieu de `.h`)
- **Implémentations** : `.cpp`
- **Noms** : PascalCase pour classes, snake_case pour fichiers

#### Code C++

```cpp
// Classes
class AudioEffect { ... };           // PascalCase
class IAudioEffect { ... };          // Interface avec préfixe I

// Méthodes
void processAudioMono(float* input, float* output, size_t numSamples);
bool initializeEffect(const EffectConfig& config);

// Variables
size_t buffer_size_;                // snake_case avec suffixe _
float threshold_db_;               // suffixe _ pour membres
int effect_id_ = -1;               // initialisation à zéro
```

#### JavaScript/TypeScript

```javascript
// Classes
class AudioEffectsManager { ... }

// Méthodes
async initializeEffects() { ... }
function processAudioBuffer(buffer) { ... }

// Variables
const audioContext = null;         // camelCase
let processingEnabled = true;      // camelCase
```

## 🔨 Compilation et build

### Build de développement

#### Debug build

```bash
# Build complet en mode debug
npm run build:debug

# Build spécifique plateforme
npm run build:ios:debug
npm run build:android:debug
```

#### Release build

```bash
# Build optimisé
npm run build:release

# Build avec profiling
npm run build:profile
```

### Compilation native

#### CMake

```bash
# Configuration
cmake -S shared/Audio/effects \
      -B build/effects \
      -DCMAKE_BUILD_TYPE=Debug \
      -DCMAKE_CXX_STANDARD=17

# Compilation
cmake --build build/effects --config Debug

# Installation
cmake --install build/effects --prefix install
```

#### Compilation conditionnelle

```cpp
// Configuration basée sur la plateforme
#ifdef __APPLE__
#include <TargetConditionals.h>
#if TARGET_OS_IOS
// Code spécifique iOS
#endif
#endif

// Configuration basée sur les capacités du compilateur
#if defined(__has_cpp_attribute)
#if __has_cpp_attribute(nodiscard)
#define AUDIO_NODISCARD [[nodiscard]]
#endif
#endif
```

### Scripts de build automatisés

#### Script de build principal

```bash
#!/bin/bash
# build-effects.sh

set -e  # Arrêt sur erreur

echo "🚀 Build du système d'effets audio"

# Nettoyage
rm -rf build/effects
mkdir -p build/effects

# Configuration CMake
cmake -S shared/Audio/effects \
      -B build/effects \
      ${CMAKE_ARGS}

# Compilation parallèle
cmake --build build/effects \
      --config $BUILD_TYPE \
      --parallel $(nproc)

# Tests
if [ "$RUN_TESTS" = "true" ]; then
    ctest --test-dir build/effects --output-on-failure
fi

echo "✅ Build terminé avec succès"
```

## 🧪 Tests et validation

### Tests unitaires

#### Structure des tests

```
__tests__/
├── effects/
│   ├── Compressor.test.cpp
│   ├── Delay.test.cpp
│   ├── EffectManager.test.cpp
│   └── EffectsJSIConverter.test.ts
```

#### Tests C++ avec Google Test

```cpp
// EffectBase.test.cpp
#include <gtest/gtest.h>
#include "effects/components/EffectBase.hpp"

class EffectBaseTest : public ::testing::Test {
protected:
    void SetUp() override {
        effect_ = std::make_unique<TestAudioEffect>();
    }

    std::unique_ptr<IAudioEffect> effect_;
};

TEST_F(EffectBaseTest, Initialization) {
    EXPECT_FALSE(effect_->isEnabled());

    effect_->setEnabled(true);
    EXPECT_TRUE(effect_->isEnabled());
}

TEST_F(EffectBaseTest, ParameterValidation) {
    EXPECT_THROW({
        effect_->setSampleRate(0, 1);  // Fréquence invalide
    }, std::invalid_argument);
}
```

#### Tests JavaScript avec Jest

```javascript
// EffectsJSIConverter.test.ts
import { EffectsJSIConverter } from '../jsi/EffectsJSIConverter';

describe('EffectsJSIConverter', () => {
  let converter;

  beforeEach(() => {
    converter = new EffectsJSIConverter();
  });

  test('should convert effect config', () => {
    const jsConfig = {
      type: 'compressor',
      parameters: {
        thresholdDb: -10.0,
        ratio: 4.0,
      },
    };

    const nativeConfig = converter.toNative(jsConfig);
    expect(nativeConfig.type).toBe('compressor');
    expect(nativeConfig.parameters.thresholdDb).toBe(-10.0);
  });

  test('should handle invalid parameters', () => {
    expect(() => {
      converter.toNative({
        type: 'invalid_type',
        parameters: {},
      });
    }).toThrow('Unsupported effect type');
  });
});
```

### Tests d'intégration

#### Tests React Native

```javascript
// AudioEffects.integration.test.tsx
import { NativeAudioEffectsModule } from '../NativeAudioEffectsModule';

describe('AudioEffects Integration', () => {
  let effectsModule;

  beforeEach(async () => {
    effectsModule = new NativeAudioEffectsModule();
    await effectsModule.initialize();
  });

  afterEach(async () => {
    await effectsModule.dispose();
  });

  test('should process audio with compressor', async () => {
    const inputBuffer = [0.1, 0.5, 0.8, 0.3];

    const effectId = await effectsModule.createEffect({
      type: 'compressor',
      parameters: {
        thresholdDb: -6.0,
        ratio: 4.0,
      },
    });

    const outputBuffer = await effectsModule.processAudio(
      inputBuffer,
      1, // Mono
    );

    expect(outputBuffer).toHaveLength(inputBuffer.length);
    expect(outputBuffer).not.toEqual(inputBuffer); // Audio modifié

    await effectsModule.destroyEffect(effectId);
  });
});
```

### Tests de performance

#### Benchmarking

```cpp
// PerformanceBenchmark.cpp
#include <benchmark/benchmark.h>
#include "effects/components/Compressor.hpp"

static void BM_CompressorProcess(benchmark::State& state) {
    auto compressor = std::make_unique<CompressorEffect>();
    compressor->setSampleRate(44100, 1);

    std::vector<float> input(1024, 0.5f);
    std::vector<float> output(1024);

    for (auto _ : state) {
        compressor->processMono(input.data(), output.data(), input.size());
    }
}

BENCHMARK(BM_CompressorProcess);
```

#### Profilage

```bash
# Profilage avec Xcode Instruments (iOS)
xcrun xctrace record --template "Time Profiler" \
    --launch -- build/Products/Debug-iphoneos/Nyth.app

# Profilage avec Android Studio (Android)
# Utiliser CPU Profiler dans Android Studio
```

### Tests de régression

#### Tests automatisés

```bash
# Tests quotidiens
npm run test:regression

# Tests de performance
npm run benchmark

# Tests de compatibilité
npm run test:compatibility
```

## 🐛 Debugging et troubleshooting

### Outils de debug

#### Logging

```cpp
// Configuration du logging
#define AUDIO_DEBUG_LOG 1

// Logs conditionnels
#if AUDIO_DEBUG_LOG
#define AUDIO_LOG(fmt, ...) printf("[AUDIO] " fmt "\n", ##__VA_ARGS__)
#else
#define AUDIO_LOG(fmt, ...) ((void)0)
#endif

// Utilisation
AUDIO_LOG("Processing buffer of size %zu", bufferSize);
```

#### Breakpoints conditionnels

```cpp
// Breakpoint conditionnel en C++
if (effectId == 0 && envL_ > thresholdDb_) {
    // Breakpoint ici pour déboguer la compression
    __builtin_debugtrap();  // macOS
    __debugbreak();         // Windows
}
```

### Debugging JavaScript

#### Source maps et debugging

```javascript
// Activation du debugging détaillé
const DEBUG_AUDIO = __DEV__;

if (DEBUG_AUDIO) {
  console.log('Audio processing:', {
    inputLevel: inputLevel,
    outputLevel: outputLevel,
    processingTime: processingTime,
  });
}
```

#### React Native Debugger

```bash
# Démarrage du debugger
npm run start:debug

# Dans Chrome DevTools:
# - Sources > NativeAudioEffectsModule
# - Breakpoints sur les méthodes JSI
```

### Debugging natif

#### iOS (Xcode)

1. **Breakpoints** : Ajouter des breakpoints dans `NativeAudioEffectsModule.mm`
2. **Console** : Utiliser `NSLog` pour les logs iOS
3. **Instruments** : Profilage performance et mémoire

#### Android (Android Studio)

1. **LLDB** : Debugging natif via LLDB
2. **Logcat** : `adb logcat | grep -i audio`
3. **CPU Profiler** : Analyse des performances

### Problèmes courants

#### 1. Erreur d'initialisation

```cpp
// Vérification des erreurs d'initialisation
try {
    bool success = effectsModule.initialize();
    if (!success) {
        // Récupérer l'erreur détaillée
        std::string error = effectsModule.getLastError();
        AUDIO_LOG("Initialization failed: %s", error.c_str());
    }
} catch (const std::exception& e) {
    AUDIO_LOG("Exception during initialization: %s", e.what());
}
```

#### 2. Problèmes de mémoire

```cpp
// Détection des fuites mémoire
#ifdef AUDIO_MEMORY_DEBUG
#define AUDIO_MALLOC(size) debug_malloc(size, __FILE__, __LINE__)
#define AUDIO_FREE(ptr) debug_free(ptr, __FILE__, __LINE__)
#endif

// Vérification périodique
void checkMemoryUsage() {
    size_t currentUsage = getCurrentMemoryUsage();
    if (currentUsage > MAX_MEMORY_USAGE) {
        AUDIO_LOG("Memory usage too high: %zu bytes", currentUsage);
        // Trigger cleanup
        cleanupUnusedEffects();
    }
}
```

#### 3. Artifacts audio

```cpp
// Validation des buffers audio
bool validateAudioBuffer(const float* buffer, size_t size) {
    for (size_t i = 0; i < size; i++) {
        if (!std::isfinite(buffer[i])) {
            AUDIO_LOG("Invalid audio sample at index %zu: %f", i, buffer[i]);
            return false;
        }
        if (std::abs(buffer[i]) > 1.0f) {
            AUDIO_LOG("Clipped audio sample at index %zu: %f", i, buffer[i]);
            // Option: appliquer un soft clip
            buffer[i] = std::tanh(buffer[i]);
        }
    }
    return true;
}
```

## 📊 Performance et optimisation

### Optimisations CPU

#### 1. Unrolling de boucle

```cpp
// Traitement optimisé par blocs de 4 échantillons
void processBlockOptimized(const float* input, float* output, size_t numSamples) {
    size_t i = 0;

    // Traitement par blocs de 4 pour optimiser le pipeline
    for (; i + 3 < numSamples; i += 4) {
        // Prefetch
        __builtin_prefetch(&input[i + 16], 0, 1);

        // Traitement vectorisé
        float x0 = input[i];
        float x1 = input[i + 1];
        float x2 = input[i + 2];
        float x3 = input[i + 3];

        // Application de l'effet
        output[i] = processSample(x0);
        output[i + 1] = processSample(x1);
        output[i + 2] = processSample(x2);
        output[i + 3] = processSample(x3);
    }

    // Traitement des échantillons restants
    for (; i < numSamples; ++i) {
        output[i] = processSample(input[i]);
    }
}
```

#### 2. Optimisations SIMD

```cpp
// Utilisation de SIMD pour le traitement parallèle
#include <arm_neon.h>  // ARM NEON
#include <immintrin.h> // Intel AVX

void processSIMD(const float* input, float* output, size_t numSamples) {
#ifdef __ARM_NEON
    // Traitement NEON pour ARM
    size_t i = 0;
    for (; i + 3 < numSamples; i += 4) {
        float32x4_t x = vld1q_f32(&input[i]);
        float32x4_t y = processSIMD(x);  // Fonction SIMD
        vst1q_f32(&output[i], y);
    }
#endif

    // Traitement scalaire pour les restes
    for (; i < numSamples; ++i) {
        output[i] = processSample(input[i]);
    }
}
```

### Optimisations mémoire

#### 1. Gestion des pools

```cpp
class AudioBufferPool {
public:
    float* allocate(size_t size) {
        if (available_.empty()) {
            return new float[size];
        }

        float* buffer = available_.back();
        available_.pop_back();
        return buffer;
    }

    void deallocate(float* buffer) {
        available_.push_back(buffer);
    }

private:
    std::vector<float*> available_;
    std::mutex mutex_;
};
```

#### 2. Allocation alignée

```cpp
// Allocation mémoire alignée pour optimiser l'accès
float* allocateAlignedBuffer(size_t size, size_t alignment = 32) {
#ifdef _WIN32
    return static_cast<float*>(_aligned_malloc(size * sizeof(float), alignment));
#else
    void* ptr;
    if (posix_memalign(&ptr, alignment, size * sizeof(float)) == 0) {
        return static_cast<float*>(ptr);
    }
    return nullptr;
#endif
}
```

### Optimisations JavaScript

#### 1. Gestion des promesses

```javascript
// Pool de workers pour éviter la surcharge
class AudioProcessingPool {
  constructor(size = 4) {
    this.workers = [];
    this.queue = [];
    this.initializeWorkers(size);
  }

  async processAudio(audioBuffer, effectId) {
    return new Promise((resolve, reject) => {
      const work = { audioBuffer, effectId, resolve, reject };
      this.queue.push(work);
      this.processQueue();
    });
  }

  processQueue() {
    if (this.queue.length === 0 || this.workers.length === 0) return;

    const worker = this.workers.find(w => !w.busy);
    if (!worker) return;

    const work = this.queue.shift();
    worker.process(work);
  }
}
```

## 🤝 Contribution

### Workflow de développement

#### 1. Fork et branche

```bash
# Fork du repository
# Création d'une branche feature
git checkout -b feature/nouvel-effet-reverb

# Commits atomiques
git commit -m "feat: ajout effet reverb de base"
git commit -m "test: tests unitaires pour reverb"
git commit -m "docs: documentation API reverb"
```

#### 2. Pull Request

```markdown
## Description

Ajout d'un nouvel effet de réverbération avec les caractéristiques suivantes:

### Fonctionnalités

- [x] Algorithme de réverbération
- [x] Paramètres ajustables (taille, damping)
- [x] Support stéréo
- [x] Optimisations de performance

### Tests

- [x] Tests unitaires C++
- [x] Tests d'intégration React Native
- [x] Tests de performance

### Breaking Changes

- Aucun

### Checklist

- [x] Code compilé sans warnings
- [x] Tests passant
- [x] Documentation mise à jour
- [x] Performance validée
```

### Guidelines de code

#### Code C++

```cpp
// ✅ Recommandé
class AudioEffect {
public:
    // Constructeur explicite
    explicit AudioEffect(EffectConfig config);

    // Getters const
    [[nodiscard]] bool isEnabled() const noexcept { return enabled_; }

    // Paramètres de validation
    void setParameter(std::string_view name, float value) {
        if (value < 0.0f || value > 1.0f) {
            throw std::invalid_argument("Parameter out of range");
        }
        // ...
    }

private:
    bool enabled_ = false;
    float parameter_ = 0.5f;
};

// ❌ À éviter
class BadAudioEffect {
public:
    BadAudioEffect() = default;  // Pas de validation

    bool isEnabled() { return enabled; }  // Pas const, pas noexcept

    void setParam(float val) {  // Pas de validation
        param = val;
    }

private:
    bool enabled;
    float param;
};
```

#### Code JavaScript

```javascript
// ✅ Recommandé
export class AudioEffectsManager {
  /**
   * Crée un nouvel effet audio
   * @param {EffectConfig} config - Configuration de l'effet
   * @returns {Promise<number>} ID de l'effet créé
   */
  async createEffect(config) {
    this.validateConfig(config);

    const effectId = await this.nativeModule.createEffect(config);
    this.activeEffects.add(effectId);

    return effectId;
  }

  validateConfig(config) {
    if (!config.type) {
      throw new Error('Effect type is required');
    }
  }
}

// ❌ À éviter
export class BadManager {
  constructor() {
    this.effects = []; // Pas de type, gestion confuse
  }

  async makeEffect(stuff) {
    // Nom vague, pas de validation
    // Pas de gestion d'erreur
    return this.nativeModule.createEffect(stuff);
  }
}
```

### Tests obligatoires

#### Pour tout nouveau code

```bash
# Tests unitaires C++
# - Tests de tous les chemins de code
# - Tests des cas d'erreur
# - Tests de performance

# Tests JavaScript
# - Tests d'intégration
# - Tests des API publiques
# - Tests de régression

# Validation
npm run test:coverage  # Coverage > 80%
npm run lint          # Pas de warnings
npm run build         # Compilation réussie
```

### Documentation

#### Mise à jour obligatoire

- [ ] **README.md** : Fonctionnalités et exemples
- [ ] **API_REFERENCE.md** : Nouvelles méthodes publiques
- [ ] **ARCHITECTURE.md** : Changements architecturaux
- [ ] **EXAMPLES.md** : Exemples d'utilisation

## 📈 CI/CD et automatisation

### Configuration GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run tests
        run: npm run test:coverage

      - name: Build
        run: npm run build

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Scripts de déploiement

#### Déploiement iOS

```bash
# build-ios.sh
#!/bin/bash

set -e

echo "📱 Build iOS"

# Clean
rm -rf ios/build
rm -rf ios/DerivedData

# Archive
xcodebuild archive \
  -workspace ios/Nyth.xcworkspace \
  -scheme Nyth \
  -configuration Release \
  -archivePath ios/build/Nyth.xcarchive

# Export
xcodebuild -exportArchive \
  -archivePath ios/build/Nyth.xcarchive \
  -exportOptionsPlist ios/ExportOptions.plist \
  -exportPath ios/build

echo "✅ iOS build terminé"
```

#### Déploiement Android

```bash
# build-android.sh
#!/bin/bash

set -e

echo "🤖 Build Android"

cd android

# Clean
./gradlew clean

# Build release
./gradlew assembleRelease \
  --no-daemon \
  --parallel \
  --build-cache

# Bundle
./gradlew bundleRelease

cd ..

echo "✅ Android build terminé"
```

## 🔒 Sécurité et bonnes pratiques

### Validation des entrées

```cpp
// Validation des paramètres utilisateur
bool validateEffectParameters(const EffectConfig& config) {
    // Vérification des plages
    if (config.thresholdDb < -60.0f || config.thresholdDb > 0.0f) {
        return false;
    }

    if (config.ratio < 1.0f || config.ratio > 20.0f) {
        return false;
    }

    // Vérification des valeurs spéciales
    if (!std::isfinite(config.thresholdDb) || !std::isfinite(config.ratio)) {
        return false;
    }

    return true;
}
```

### Gestion des ressources

```cpp
// RAII pour la gestion automatique des ressources
class ScopedEffect {
public:
    explicit ScopedEffect(NativeAudioEffectsModule* module, int effectId)
        : module_(module), effectId_(effectId) {}

    ~ScopedEffect() {
        if (module_ && effectId_ != -1) {
            module_->destroyEffect(effectId_);
        }
    }

    // Interdiction de la copie
    ScopedEffect(const ScopedEffect&) = delete;
    ScopedEffect& operator=(const ScopedEffect&) = delete;

private:
    NativeAudioEffectsModule* module_;
    int effectId_;
};
```

### Logging sécurisé

```cpp
// Logging sans informations sensibles
void logProcessingInfo(int effectId, size_t bufferSize) {
    AUDIO_LOG("Processing effect %d with buffer size %zu",
              effectId, bufferSize);
    // ❌ Éviter: AUDIO_LOG("Processing with data: %p", buffer);
}
```

## 📞 Support et communauté

### Ressources de support

#### Documentation

- [README principal](../README.md) - Vue d'ensemble
- [API Reference](API_REFERENCE.md) - Référence complète
- [Architecture](ARCHITECTURE.md) - Détails techniques
- [Exemples](EXAMPLES.md) - Guides pratiques

#### Communication

- **Issues GitHub** : Bugs et demandes de fonctionnalités
- **Discussions GitHub** : Questions générales
- **Pull Requests** : Contributions de code

### Demande d'aide

#### Bug report

```markdown
## Bug Report

### Description

[Description claire et concise du bug]

### Étapes de reproduction

1. [Première étape]
2. [Deuxième étape]
3. [Etc.]

### Comportement attendu

[Description de ce qui devrait se passer]

### Comportement actuel

[Description de ce qui se passe réellement]

### Environnement

- OS: [iOS/Android/Version]
- Version de l'app: [version]
- Device: [modèle]

### Logs
```

[Logs pertinents]

````

### Code sample
```javascript
// Code pour reproduire le problème
````

```

---

**Note** : Ce guide est vivant et évolue avec le projet. N'hésitez pas à proposer des améliorations via des pull requests ou des issues.
```
