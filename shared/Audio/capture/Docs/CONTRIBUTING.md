# 🤝 Guide de contribution - Audio Capture Module

## 📋 **Table des matières**

- [Introduction](#introduction)
- [Prérequis](#prérequis)
- [Configuration de l'environnement](#configuration-de-lenvironnement)
- [Structure du projet](#structure-du-projet)
- [Workflow de développement](#workflow-de-développement)
- [Standards de code](#standards-de-code)
- [Tests](#tests)
- [Documentation](#documentation)
- [Pull Requests](#pull-requests)
- [Debugging](#debugging)

---

## 📖 **Introduction**

Bienvenue dans le guide de contribution du module Audio Capture ! Ce module fournit une interface unifiée de capture audio multi-plateforme pour React Native.

### **Objectifs du module**

- **Interface unifiée** : Même API sur Android et iOS
- **Performance optimale** : Faible latence, haute qualité
- **Robustesse** : Gestion d'erreurs complète
- **Maintenabilité** : Code modulaire et bien testé

### **Types de contributions**

- 🐛 **Bug fixes** : Corrections de bugs
- ✨ **Features** : Nouvelles fonctionnalités
- 📚 **Documentation** : Amélioration de la documentation
- 🧪 **Tests** : Ajout de tests
- 🎨 **Refactoring** : Amélioration du code existant
- 📊 **Performance** : Optimisations

---

## 📋 **Prérequis**

### **Système**

- **macOS** (pour iOS) ou **Linux/Windows** (pour Android)
- **CMake 3.15+**
- **Git**
- **Node.js 18+** (pour React Native)

### **Android**

- **Android Studio** Arctic Fox ou plus récent
- **Android SDK 30+**
- **NDK 25+**
- **Oboe** (inclus via CMake)

### **iOS**

- **Xcode 14+**
- **macOS 13+**
- **iOS 14+** (target minimum)

### **Outils de développement**

- **Clang/LLVM** (compilateur C++)
- **Valgrind/AddressSanitizer** (debug mémoire)
- **CppCheck/Clang-Tidy** (analyse statique)
- **Doxygen** (documentation)

---

## ⚙️ **Configuration de l'environnement**

### **1. Clonage du projet**

```bash
# Cloner le repository
git clone https://github.com/your-org/nyth.git
cd nyth

# Initialiser les submodules
git submodule update --init --recursive

# Installer les dépendances Node.js
npm install
```

### **2. Configuration Android**

```bash
# Installer Android SDK/NDK via Android Studio ou CLI
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Vérifier la configuration
echo $ANDROID_HOME
echo $ANDROID_NDK  # Doit pointer vers NDK 25+
```

### **3. Configuration iOS**

```bash
# Installer CocoaPods
sudo gem install cocoapods

# Installer les dépendances iOS
cd ios
pod install
```

### **4. Configuration CMake**

```bash
# Configurer le projet
mkdir build && cd build
cmake .. \
  -DCMAKE_BUILD_TYPE=Debug \
  -DANDROID_ABI=arm64-v8a \
  -DANDROID_PLATFORM=android-30

# Compiler
make -j$(nproc)
```

---

## 📁 **Structure du projet**

```
shared/Audio/capture/
├── 📁 build/                 # Fichiers de build CMake
├── 📁 components/           # Composants de base
│   ├── AudioCapture.hpp     # Interface principale
│   ├── AudioCaptureImpl.cpp # Android (Oboe/AAudio/OpenSL)
│   ├── AudioCaptureImpl.mm  # iOS (Audio Units)
│   ├── AudioCaptureMetrics.*# Métriques
│   └── AudioFileWriter.*    # Écriture fichiers
├── 📁 config/              # Configuration
│   ├── AudioConfig.h       # Configuration principale
│   ├── AudioLimits.h       # Limites système
│   └── PlatformSupport.h   # Support plateforme
├── 📁 jsi/                 # Intégration React Native
│   ├── JSICallbackManager.*# Gestion callbacks
│   ├── JSIConverter.*      # Conversion types
│   └── JSIValidator.h      # Validation
├── 📁 managers/            # Gestion haut niveau
│   └── AudioCaptureManager.* # Gestionnaire principal
├── 📄 NativeAudioCaptureModule.* # Module TurboModule
└── 📁 Docs/                # Documentation
```

---

## 🔄 **Workflow de développement**

### **1. Créer une branche**

```bash
# Pour une nouvelle feature
git checkout -b feature/audio-processing-pipeline

# Pour un bug fix
git checkout -b bugfix/android-buffer-overflow

# Pour la documentation
git checkout -b docs/update-api-reference
```

### **2. Développement**

```bash
# Compiler en mode debug
cd build
cmake .. -DCMAKE_BUILD_TYPE=Debug
make -j$(nproc)

# Lancer les tests
ctest --verbose

# Vérifier la couverture
gcovr -r .. --html --html-details -o coverage.html
```

### **3. Tests locaux**

```bash
# Tests unitaires
./test/AudioCaptureTest

# Tests d'intégration
./test/AudioIntegrationTest

# Tests de performance
./test/AudioPerformanceTest

# Tests React Native
npm test
```

### **4. Validation**

```bash
# Analyse statique
cppcheck --enable=all --std=c++17 --platform=unix64 \
          --suppress=missingIncludeSystem \
          -I include src/

# Clang-Tidy
clang-tidy -p build src/*.cpp src/*.hpp

# Vérifier la mémoire
valgrind --leak-check=full --show-leak-kinds=all \
          --track-origins=yes ./test/AudioCaptureTest
```

---

## 📝 **Standards de code**

### **C++ Standards**

#### **Version et dialecte**

- **C++17** minimum
- **Extensions GNU** autorisées pour la compatibilité
- **RAII** obligatoire pour la gestion des ressources

#### **Conventions de nommage**

```cpp
// Classes et structs
class AudioCaptureManager;      // PascalCase
struct AudioConfig;             // PascalCase

// Méthodes et fonctions
void initializeAudio();         // camelCase
bool isCapturing() const;       // camelCase

// Variables membres
private:
    std::string deviceId_;       // snake_case avec suffixe _
    int sampleRate_;             // snake_case avec suffixe _

// Variables locales
int bufferSize = 1024;          // snake_case
float* audioData = nullptr;     // snake_case

// Constantes
static constexpr int DEFAULT_SAMPLE_RATE = 44100; // UPPER_SNAKE_CASE
```

#### **Structure des fichiers**

```cpp
// Header (.hpp)
#pragma once

// Includes système
#include <memory>
#include <string>

// Includes locaux
#include "AudioConfig.h"

// Namespace
namespace Audio {
namespace capture {

// Déclarations forward
class AudioCaptureManager;

// Déclarations de classes
class AudioCapture {
public:
    // Interface publique
    virtual ~AudioCapture() = default;
    virtual bool initialize(const AudioCaptureConfig& config) = 0;

protected:
    // Méthodes protégées
    void setState(CaptureState state);
};

// Implémentations inline
inline void AudioCapture::setState(CaptureState state) {
    state_ = state;
}

} // namespace capture
} // namespace Audio
```

```cpp
// Implementation (.cpp)
#include "AudioCapture.hpp"

// Includes locaux additionnels
#include "AudioCaptureMetrics.h"

// Namespace
namespace Audio {
namespace capture {

// Implémentations
AudioCaptureManager::AudioCaptureManager() {
    // Implémentation
}

bool AudioCaptureManager::initialize(const AudioCaptureConfig& config) {
    // Validation
    if (!config.isValid()) {
        return false;
    }

    // Implémentation
    config_ = config;
    return true;
}

} // namespace capture
} // namespace Audio
```

### **Objective-C++ (iOS)**

```objc
// AudioCaptureImpl.mm
#import <AVFoundation/AVFoundation.h>
#include "AudioCaptureImpl.hpp"

namespace Audio {
namespace capture {

AudioCaptureIOS::AudioCaptureIOS() {
    // Initialisation iOS
    audioUnit_ = nullptr;
    audioSession_ = [AVAudioSession sharedInstance];
}

bool AudioCaptureIOS::setupAudioSession() {
    NSError* error = nil;

    // Configuration AVAudioSession
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryRecord
                                            error:&error];
    if (error) {
        reportError("Failed to set audio session category");
        return false;
    }

    return true;
}

} // namespace capture
} // namespace Audio
```

### **Documentation du code**

```cpp
/**
 * @brief Gestionnaire principal de capture audio
 *
 * Cette classe fournit une interface unifiée pour la capture audio
 * sur Android et iOS via React Native TurboModule.
 *
 * @note Thread-safe : toutes les méthodes publiques peuvent être
 * appelées depuis n'importe quel thread.
 *
 * @author Équipe Audio Nyth
 * @version 3.0.0
 * @since 2024-01-15
 */
class AudioCaptureManager {
public:
    /**
     * @brief Constructeur
     *
     * @param callbackManager Gestionnaire des callbacks JavaScript
     * @throws std::runtime_error si l'initialisation échoue
     */
    explicit AudioCaptureManager(
        std::shared_ptr<JSICallbackManager> callbackManager);

    /**
     * @brief Initialise la capture audio
     *
     * @param config Configuration audio à appliquer
     * @return true si l'initialisation réussit, false sinon
     *
     * @note Cette méthode doit être appelée avant start()
     * @see AudioConfig pour les options de configuration
     */
    bool initialize(const Nyth::Audio::AudioConfig& config);

    /**
     * @brief Démarre la capture audio
     *
     * @return true si le démarrage réussit, false sinon
     *
     * @pre initialize() doit avoir été appelée avec succès
     * @post getState() retourne CaptureState::Running
     */
    bool start();

    /**
     * @brief Arrête la capture audio
     *
     * @return true si l'arrêt réussit, false sinon
     */
    bool stop();

private:
    /**
     * @brief Valide et applique la configuration
     *
     * @param config Configuration à valider
     * @return true si la configuration est valide
     */
    bool validateAndApplyConfig(const Nyth::Audio::AudioConfig& config);
};
```

---

## 🧪 **Tests**

### **Stratégie de tests**

#### **Tests unitaires** (gtest/gmock)

- **Couverture** : Minimum 80%
- **Isolés** : Pas de dépendances externes
- **Rapides** : < 100ms par test
- **Déterministes** : Résultats reproductibles

#### **Tests d'intégration**

- **Validation** des interactions entre composants
- **Tests end-to-end** de la capture audio
- **Tests de performance** et charge

#### **Tests React Native**

- **Tests JavaScript** de l'interface publique
- **Tests d'intégration** avec React Native

### **Exemples de tests**

```cpp
// Test configuration
TEST(AudioConfigTest, ValidConfiguration) {
    Nyth::Audio::AudioConfig config;
    config.sampleRate = 44100;
    config.channelCount = 2;

    EXPECT_TRUE(config.isValid());
    EXPECT_TRUE(config.getValidationError().empty());
}

// Test capture Android
TEST(AudioCaptureAndroidTest, Initialization) {
    AudioCaptureAndroid capture;

    AudioCaptureConfig config;
    config.sampleRate = 44100;
    config.channelCount = 1;

    EXPECT_TRUE(capture.initialize(config));
    EXPECT_EQ(capture.getState(), CaptureState::Initialized);
}

// Test d'intégration
TEST(AudioCaptureManagerTest, InitializeAndStart) {
    auto callbackManager = std::make_shared<MockJSICallbackManager>();
    AudioCaptureManager manager(callbackManager);

    Nyth::Audio::AudioConfig config;
    config.sampleRate = 44100;
    config.channelCount = 1;

    // Test d'initialisation
    EXPECT_TRUE(manager.initialize(config));
    EXPECT_EQ(manager.getState(), Audio::capture::CaptureState::Initialized);

    // Test de démarrage
    EXPECT_TRUE(manager.start());
    EXPECT_EQ(manager.getState(), Audio::capture::CaptureState::Running);

    // Vérifier que le callback manager a été configuré
    EXPECT_TRUE(callbackManager->audioCallbackSet());
}

// Test de performance
TEST(AudioCapturePerformanceTest, CallbackLatency) {
    // Configuration pour test de performance
    Nyth::Audio::AudioConfig config;
    config.sampleRate = 44100;
    config.bufferSizeFrames = 1024; // ~23ms

    // Mesurer la latence des callbacks
    auto start = std::chrono::high_resolution_clock::now();

    // Simuler traitement
    for (int i = 0; i < 1000; ++i) {
        // Simuler un callback
        std::vector<float> testData(config.bufferSizeFrames * config.channelCount, 0.5f);
        processAudioData(testData.data(), config.bufferSizeFrames, config.channelCount);
    }

    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(
        end - start).count();

    // Vérifier que la latence est acceptable (< 10ms moyenne)
    EXPECT_LT(duration, 10000) << "Average callback latency too high: " << duration << "ms";
}
```

### **Mock Objects**

```cpp
// Mock pour les tests
class MockJSICallbackManager : public JSICallbackManager {
public:
    MOCK_METHOD(void, setAudioDataCallback, (const jsi::Function&), (override));
    MOCK_METHOD(void, enqueueAudioData, (const float*, size_t, int), (override));
    MOCK_METHOD(void, enqueueError, (const std::string&), (override));

    bool audioCallbackSet() const {
        return audioCallbackSet_;
    }

private:
    bool audioCallbackSet_ = false;
};
```

---

## 📚 **Documentation**

### **Génération automatique**

```bash
# Doxygen pour la documentation C++
doxygen Doxyfile

# Documentation JavaScript (JSDoc)
npm run docs

# Documentation complète
npm run docs:all
```

### **Standards de documentation**

#### **Fichiers README**

- **`README.md`** : Vue d'ensemble et guide de démarrage
- **`DEVELOPMENT.md`** : Guide développeur (architecture, debug)
- **`EXAMPLES.md`** : Exemples d'utilisation
- **`ARCHITECTURE.md`** : Architecture technique détaillée

#### **Code comments**

- **Doxygen** pour les headers
- **Explications** des algorithmes complexes
- **Warnings** pour les comportements non-évidents
- **TODO/FIXME** pour les améliorations futures

---

## 🔄 **Pull Requests**

### **Processus de PR**

#### **1. Préparation**

```bash
# S'assurer que la branche est à jour
git fetch origin
git rebase origin/main

# Vérifier les tests locaux
npm test
npm run lint
```

#### **2. Création de la PR**

- **Titre descriptif** : "feat: Add audio effects pipeline"
- **Description complète** :
  - Problème résolu
  - Solution proposée
  - Breaking changes
  - Tests ajoutés
  - Documentation mise à jour

#### **3. Template de PR**

```markdown
## Description

[Description détaillée des changements]

## Type de changement

- [x] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] 📚 Documentation
- [ ] 🎨 Refactoring
- [ ] 🧪 Tests

## Breaking Changes

- [ ] Oui
- [x] Non

## Tests

- [x] Tests unitaires ajoutés/modifiés
- [x] Tests d'intégration passent
- [x] Tests de performance OK

## Checklist

- [x] Code suit les standards
- [x] Documentation mise à jour
- [x] Tests ajoutés
- [x] Breaking changes documentés
```

### **Review Process**

#### **Critères de review**

- ✅ **Code quality** : Standards respectés
- ✅ **Tests** : Couverture suffisante
- ✅ **Documentation** : Mise à jour
- ✅ **Performance** : Pas de régression
- ✅ **Thread safety** : Vérifiée
- ✅ **Error handling** : Robuste

#### **Labels automatiques**

- `bug` : Correction de bug
- `feature` : Nouvelle fonctionnalité
- `documentation` : Documentation
- `refactoring` : Refactoring
- `performance` : Optimisation
- `breaking-change` : Changement cassant

---

## 🔍 **Debugging**

### **Outils de debug**

#### **Android**

```bash
# Logs Android
adb logcat -s AudioCapture

# Debug natif Android Studio
# Attacher le debugger au processus

# Valgrind sur Android (nécessite root)
adb shell valgrind --leak-check=full ./test/AudioCaptureTest
```

#### **iOS**

```bash
# Logs iOS
xcrun simctl spawn booted log stream --level debug --predicate 'subsystem == "com.nyth.audio"'

# Debug Xcode
# Attacher le debugger au simulateur/dévice

# Instruments pour performance
xcrun xctrace record --template "Audio Performance" --launch -- ./app
```

### **Debugging C++**

```cpp
void AudioCaptureAndroid::start() {
    AUDIO_LOG_DEBUG("Starting audio capture with config: %s",
                    configToString(config_).c_str());

    try {
        // Point de debug : vérifier l'état
        assert(state_ == CaptureState::Initialized);

        // Démarrer Oboe
        auto result = oboeStream_->requestStart();
        if (result != oboe::Result::OK) {
            AUDIO_LOG_ERROR("Failed to start Oboe stream: %s",
                            oboe::convertToText(result));
            return false;
        }

        AUDIO_LOG_DEBUG("Oboe stream started successfully");
        setState(CaptureState::Running);
        return true;

    } catch (const std::exception& e) {
        AUDIO_LOG_ERROR("Exception in start(): %s", e.what());
        setState(CaptureState::Error);
        return false;
    }
}
```

### **Logging macros**

```cpp
// Macros de logging
#define AUDIO_LOG_DEBUG(...) \
    if (config_.enableDebugLogging) { \
        std::fprintf(stderr, "[AUDIO_DEBUG] " __VA_ARGS__); \
        std::fprintf(stderr, "\n"); \
    }

#define AUDIO_LOG_INFO(...) \
    std::fprintf(stderr, "[AUDIO_INFO] " __VA_ARGS__); \
    std::fprintf(stderr, "\n");

#define AUDIO_LOG_ERROR(...) \
    std::fprintf(stderr, "[AUDIO_ERROR] " __VA_ARGS__); \
    std::fprintf(stderr, "\n");
```

### **Debugging JavaScript**

```javascript
// Debug des callbacks
const capture = new NativeAudioCaptureModule();
capture.setLogLevel('debug');

// Écouter tous les événements
capture.addListener('onAudioData', data => {
  console.log('Audio data:', {
    frames: data.frameCount,
    channels: data.channels,
    timestamp: Date.now(),
  });
});

capture.addListener('onError', error => {
  console.error('Audio error:', error);
  // Stack trace si disponible
  console.error('Stack:', new Error().stack);
});

capture.addListener('onStateChange', state => {
  console.log('State changed:', state);
});
```

### **Profiling**

```cpp
// Profiling des callbacks
class CallbackProfiler {
private:
    std::chrono::steady_clock::time_point callbackStart_;
    std::vector<double> callbackTimes_;
    std::mutex profilerMutex_;

public:
    void startCallback() {
        std::lock_guard<std::mutex> lock(profilerMutex_);
        callbackStart_ = std::chrono::steady_clock::now();
    }

    void endCallback() {
        std::lock_guard<std::mutex> lock(profilerMutex_);
        auto end = std::chrono::steady_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(
            end - callbackStart_).count();
        callbackTimes_.push_back(duration / 1000.0); // ms
    }

    double getAverageCallbackTime() const {
        std::lock_guard<std::mutex> lock(profilerMutex_);
        if (callbackTimes_.empty()) return 0.0;

        double sum = 0.0;
        for (double time : callbackTimes_) {
            sum += time;
        }
        return sum / callbackTimes_.size();
    }
};
```

---

## 📊 **Métriques de contribution**

### **Qualité du code**

- **Code coverage** : > 80%
- **Tests** : Tous les tests passent
- **Warnings** : 0 warnings de compilation
- **Static analysis** : 0 erreurs critiques

### **Performance**

- **Latence callback** : < 10ms
- **Memory leaks** : 0
- **Thread safety** : Vérifiée
- **Error rate** : < 0.1%

### **Documentation**

- **README** : À jour et complet
- **API docs** : Générées automatiquement
- **Examples** : Fonctionnels et testés
- **Code comments** : > 70% des méthodes

---

## 🎯 **Conclusion**

### **Ressources**

- **Issues** : [GitHub Issues](https://github.com/your-org/nyth/issues)
- **Discussions** : [GitHub Discussions](https://github.com/your-org/nyth/discussions)
- **Documentation** : [Audio Capture Docs](https://nyth.audio/docs/audio-capture)

### **Support**

- **Slack** : #audio-capture
- **Email** : audio@nyth.dev
- **Forum** : [Community Forum](https://forum.nyth.audio)

### **Remerciements**

Merci de contribuer au module Audio Capture ! Votre travail aide à améliorer l'expérience audio pour tous les utilisateurs de React Native.

_Guide de contribution : Décembre 2024_
