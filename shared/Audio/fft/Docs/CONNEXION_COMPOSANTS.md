# Connexion des Composants FFT

## Vue d'ensemble de l'architecture

Le module FFT est organisé autour de plusieurs composants interconnectés :

```
NativeAudioSpectrumModule (Module principal)
├── SpectrumManager (Gestionnaire d'analyse spectrale)
│   ├── FFTEngine (Moteur de transformée de Fourier)
│   │   └── SimpleFFT (Implémentation concrète)
│   └── SpectrumConfig (Configuration)
├── SpectrumJSIConverter (Convertisseur JSI)
└── JSICallbackManager (Gestionnaire de callbacks)
```

## 1. Connexions principales

### 1.1 NativeAudioSpectrumModule ↔ SpectrumManager

**Fichier** : `NativeAudioSpectrumModule.cpp`

**Connexions** :

- Initialisation : `initializeManagers()` (ligne 12)
- Configuration : `spectrumManager_->setConfig(newConfig)` (ligne 38)
- Contrôle : `spectrumManager_->start()`, `spectrumManager_->stop()` (lignes 64-65)
- Nettoyage : `cleanupManagers()` (ligne 69)

### 1.2 SpectrumManager ↔ FFTEngine

**Fichier** : `SpectrumManager.cpp`

**Connexions** :

- Initialisation : `initializeFFT()` (ligne 36)
- Utilisation : `fftEngine_->forwardR2C()` dans `processFFT()` (ligne 147)
- Stockage : `std::unique_ptr<AudioFX::IFFTEngine> fftEngine_` (ligne 77)

### 1.3 NativeAudioSpectrumModule ↔ SpectrumJSIConverter

**Fichier** : `NativeAudioSpectrumModule.cpp`

**Connexions** :

- Conversion config : `SpectrumJSIConverter::jsiToSpectrumConfig()` (ligne 29)
- Validation : `SpectrumJSIConverter::validateJSIConfig()` (ligne 32)

### 1.4 NativeAudioSpectrumModule ↔ JSICallbackManager

**Fichier** : `NativeAudioSpectrumModule.cpp`

**Connexions** :

- Initialisation : `callbackManager_` (ligne 72)
- Configuration callbacks : `setupCallbacks()` (ligne 110)
- Invocation : `onSpectrumData()`, `onError()`, `onStateChange()` (lignes 101-103)

## 2. Interfaces et contrats

### 2.1 Interface FFTEngine

**Fichier** : `components/FFTEngine.hpp`

**Contrat** :

```cpp
class IFFTEngine {
public:
    virtual ~IFFTEngine() = default;
    virtual void forwardR2C(const float* real, std::vector<float>& realOut, std::vector<float>& imagOut) = 0;
    virtual void inverseC2R(const std::vector<float>& realIn, const std::vector<float>& imagIn, float* real) = 0;
    virtual size_t getSize() const = 0;
};
```

### 2.2 Interface SpectrumManager

**Fichier** : `managers/SpectrumManager.h`

**Callbacks** :

```cpp
using SpectrumDataCallback = std::function<void(const SpectrumData& data)>;
using SpectrumErrorCallback = std::function<void(SpectrumError error, const std::string& message)>;
using SpectrumStateCallback = std::function<void(SpectrumState oldState, SpectrumState newState)>;
```

## 3. Flux de données

### 3.1 Initialisation

```
1. NativeAudioSpectrumModule::initialize()
   ↓
2. SpectrumJSIConverter::jsiToSpectrumConfig()
   ↓
3. SpectrumManager::setConfig()
   ↓
4. SpectrumManager::initialize()
   ↓
5. FFTEngine::createFFTEngine()
   ↓
6. SimpleFFT (implémentation concrète)
```

### 3.2 Traitement audio

```
1. NativeAudioSpectrumModule::processAudioBuffer()
   ↓
2. SpectrumManager::processAudioBuffer()
   ↓
3. FFTEngine::forwardR2C()
   ↓
4. SpectrumManager::computeSpectralFeatures()
   ↓
5. JSICallbackManager::invokeAudioDataCallback()
   ↓
6. JavaScript callback
```

## 4. Gestion d'erreurs

### 4.1 Propagation des erreurs

```
Erreur FFT → SpectrumManager::handleError() → JSICallbackManager::invokeErrorCallback()
Erreur JSI → NativeAudioSpectrumModule::handleError() → JSICallbackManager::invokeErrorCallback()
```

### 4.2 États du système

```cpp
enum class SpectrumState {
    UNINITIALIZED = 0,
    INITIALIZED = 1,
    ANALYZING = 2,
    ERROR = 3,
    SHUTDOWN = 4
};
```

## 5. Optimisations et performances

### 5.1 Gestion mémoire

- **Buffers réutilisables** : `audioBuffer_`, `fftRealBuffer_`, `fftImagBuffer_`
- **Allocation unique** : Tous les buffers sont alloués une fois lors de l'initialisation
- **Memory pools** : Support pour les pools de mémoire configurables

### 5.2 Traitement temps réel

- **Thread safety** : Utilisation de `std::mutex` et `std::atomic`
- **File d'attente** : `JSICallbackManager` utilise une file pour éviter les blocages
- **Optimisations SIMD** : Support optionnel pour les instructions vectorielles

## 6. Extensions et modularité

### 6.1 Points d'extension

1. **Nouveaux moteurs FFT** : Implémenter `IFFTEngine` pour ajouter KissFFT, FFTW, etc.
2. **Nouveaux convertisseurs** : Étendre `SpectrumJSIConverter` pour de nouveaux formats
3. **Gestionnaires spécialisés** : Créer des `SpectrumManager` dérivés pour des cas spécifiques

### 6.2 Factory pattern

Le système utilise déjà un pattern factory implicite :

```cpp
std::unique_ptr<IFFTEngine> createFFTEngine(size_t size) {
    return std::make_unique<SimpleFFT>(size);
}
```

## 7. Recommandations d'amélioration

### 7.1 Architecture

1. **Interface explicite** : Créer une interface `ISpectrumManager` pour faciliter les tests et extensions
2. **Dependency injection** : Injecter les dépendances via le constructeur plutôt que les créer à l'intérieur
3. **Configuration centralisée** : Utiliser un système de configuration unifié

### 7.2 Performance

1. **Cache locality** : Optimiser l'organisation des données pour une meilleure localité cache
2. **Allocation mémoire** : Utiliser des allocateurs spécialisés pour les buffers audio
3. **Vectorisation** : Étendre le support SIMD à tous les composants

### 7.3 Maintenabilité

1. **Tests unitaires** : Ajouter des tests pour chaque composant individuellement
2. **Documentation** : Maintenir cette documentation à jour
3. **Logging** : Ajouter un système de logging configurable

## 8. Exemple d'utilisation

```cpp
// 1. Création du module principal
auto module = std::make_shared<NativeAudioSpectrumModule>(jsInvoker);

// 2. Configuration
jsi::Object config = createConfig(rt);
module->initialize(rt, config);

// 3. Configuration des callbacks
module->setDataCallback(rt, dataCallback);
module->setErrorCallback(rt, errorCallback);

// 4. Démarrage de l'analyse
module->startAnalysis(rt);

// 5. Traitement audio
jsi::Array audioBuffer = createAudioBuffer(rt);
module->processAudioBuffer(rt, audioBuffer);
```

Cette architecture modulaire permet une extension facile tout en maintenant des performances optimales pour l'analyse spectrale en temps réel.
