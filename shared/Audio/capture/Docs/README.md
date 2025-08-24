# 📁 Documentation du module Audio Capture

## 🏗️ **Architecture du module**

Le module `shared/Audio/capture` fournit une interface unifiée de capture audio multi-plateforme pour React Native via TurboModule.

### **Structure générale**

```
shared/Audio/capture/
├── 📁 build/                 # Fichiers de build CMake
├── 📁 components/           # Composants de base de la capture
├── 📁 config/              # Configuration et limites
├── 📁 jsi/                 # Intégration JavaScript/React Native
├── 📁 managers/            # Gestionnaires de haut niveau
├── 📄 NativeAudioCaptureModule.cpp
├── 📄 NativeAudioCaptureModule.h
└── 📁 Docs/                # Documentation (ce dossier)
```

---

## 📋 **Détail des composants**

### **🔧 components/** - _Composants de base_

#### **Core Interfaces**

- **`AudioCapture.hpp`** - Interface abstraite principale
  - Définition des états de capture
  - Configuration audio (sample rate, canaux, format)
  - Callbacks pour données audio et erreurs
  - Gestion des périphériques audio

#### **Implémentations spécifiques**

- **`AudioCaptureImpl.cpp`** - **Android** (Oboe → AAudio → OpenSL ES)
- **`AudioCaptureImpl.mm`** - **iOS** (Audio Units + AVFoundation)
- **`AudioCaptureImpl.hpp`** - Header commun aux implémentations

#### **Composants spécialisés**

- **`AudioCaptureException.hpp`** - Gestion des erreurs
- **`AudioCaptureJNI.hpp`** - Interface JNI pour Android
- **`AudioCaptureMetrics.cpp/.hpp`** - Métriques de performance
- **`AudioCaptureSIMD.cpp/.hpp`** - Optimisations SIMD
- **`AudioCaptureUtils.cpp/.hpp`** - Utilitaires de capture
- **`AudioFileWriter.cpp/.hpp`** - Écriture de fichiers audio

### **⚙️ config/** - _Configuration système_

- **`AudioConfig.h`** - Configuration audio centralisée

  - Paramètres de base (sample rate, canaux, bits)
  - Options de traitement (echo cancellation, noise suppression)
  - Configuration d'enregistrement et d'analyse
  - Validation automatique des paramètres

- **`AudioLimits.h`** - Limites et contraintes système

  - Valeurs min/max pour tous les paramètres
  - Contraintes par plateforme
  - Constantes système

- **`PlatformSupport.h`** - Support par plateforme
  - Détection des capacités matérielles
  - Fallbacks automatiques

### **🔗 jsi/** - _Intégration React Native_

- **`JSICallbackManager.cpp/.h`** - Gestion des callbacks JavaScript

  - File d'attente thread-safe
  - Conversion automatique des types
  - Gestion des erreurs JS

- **`JSIConverter.cpp/.h`** - Conversion types C++/JavaScript

  - Sérialisation des données audio
  - Conversion des configurations
  - Gestion des erreurs de conversion

- **`JSIValidator.h`** - Validation des paramètres JavaScript
  - Validation des types
  - Contraintes de sécurité
  - Messages d'erreur descriptifs

### **🎛️ managers/** - _Gestion de haut niveau_

- **`AudioCaptureManager.cpp/.h`** - Gestionnaire principal
  - Interface unifiée pour toutes les plateformes
  - Gestion du cycle de vie (init/start/stop/pause)
  - Coordination des composants
  - Statistiques temps réel

### **🎯 Fichiers principaux**

- **`NativeAudioCaptureModule.h/.cpp`** - Module TurboModule
  - Interface React Native
  - Exposition des méthodes JavaScript
  - Gestion des permissions
  - Intégration avec React Native

---

## 🏛️ **Architecture logicielle**

### **📱 Architecture en couches**

```
┌─────────────────────────────────────────────┐
│     🎯 NativeAudioCaptureModule (TurboModule) │
├─────────────────────────────────────────────┤
│         🎛️ AudioCaptureManager              │
├─────────────────────────────────────────────┤
│         🔧 Composants de base               │
├─────────────────────────────────────────────┤
│         📱 APIs natives (Oboe/AudioUnits)    │
└─────────────────────────────────────────────┘
```

### **🔄 Flux de données**

```
React Native → JSI → NativeAudioCaptureModule → AudioCaptureManager → AudioCapture → APIs natives
```

---

## 🚀 **Fonctionnalités principales**

### **📱 Support multi-plateforme**

#### **Android** (3 niveaux de fallback)

1. **Oboe** - API moderne Google (recommandé)
2. **AAudio** - API Android 8.0+ (latence réduite)
3. **OpenSL ES** - API legacy (compatibilité maximale)

#### **iOS**

- **Audio Units** - Framework principal
- **AVFoundation** - Gestion des sessions audio
- **Gestion automatique des interruptions**

### **⚡ Performance**

- **Optimisations SIMD** pour le traitement audio
- **Triple buffering** pour éviter les underruns
- **Configuration low-latency** par défaut
- **Thread safety** complète
- **Memory pooling** pour réduire les allocations

### **🎛️ Gestion avancée**

- **Permissions automatiques** (microphone)
- **Gestion d'état robuste** avec états atomiques
- **Métriques temps réel** (niveaux, statistiques)
- **Callbacks JavaScript** thread-safe
- **Gestion d'erreurs** complète avec logging

### **🔧 Configuration flexible**

| Paramètre   | Plage          | Défaut      |
| ----------- | -------------- | ----------- |
| Sample Rate | 8kHz - 192kHz  | 44.1kHz     |
| Canaux      | 1-2            | Mono        |
| Bits/Sample | 8,16,24,32     | 16-bit      |
| Buffer Size | 64-8192 frames | 1024 frames |
| Format      | PCM Float/Int  | Float       |

---

## 📝 **Configuration d'exemple**

```cpp
// Configuration audio
Nyth::Audio::AudioConfig config;
config.sampleRate = 44100;          // 44.1kHz
config.channelCount = 2;            // Stéréo
config.bitsPerSample = 16;          // 16-bit
config.bufferSizeFrames = 1024;     // ~23ms à 44.1kHz
config.enableEchoCancellation = true;
config.enableNoiseSuppression = false;
```

---

## 🔄 **Cycle de vie**

```cpp
// 1. Initialisation
auto manager = std::make_shared<AudioCaptureManager>(jsiCallbackManager);
manager->initialize(config);

// 2. Configuration des callbacks
manager->setAudioDataCallback([](const float* data, size_t frameCount) {
     // Traitement des données audio
});

// 3. Démarrage
manager->start();

// 4. Contrôle
manager->pause();    // Pause
manager->resume();   // Reprise
manager->stop();     // Arrêt

// 5. Nettoyage automatique
```

---

## 🛠️ **Construction et compilation**

### **Prérequis**

- **Android**: Oboe, AAudio, OpenSL ES
- **iOS**: AudioToolbox, AVFoundation
- **CMake** pour la compilation native
- **React Native** 0.70+ avec TurboModule

### **Build**

```bash
# Android
cd android
./gradlew build

# iOS
cd ios
pod install
xcodebuild -workspace Nyth.xcworkspace -scheme Nyth
```

---

## 📊 **Métriques et monitoring**

Le module fournit des métriques temps réel :

- **Niveaux audio** (courant, crête)
- **Statistiques de capture** (frames, bytes, durée)
- **Taux d'erreur** (overruns, underruns)
- **Performance** (latence, utilisation CPU)

---

## 🚨 **Gestion d'erreurs**

Le système gère automatiquement :

- **Erreurs de permissions** (microphone)
- **Erreurs de périphériques** (déconnexion)
- **Erreurs de configuration** (paramètres invalides)
- **Erreurs système** (mémoire, ressources)
- **Timeouts et interruptions**

---

## 🔧 **Extensions et personnalisation**

Le module est conçu pour être extensible :

- **Nouveaux formats** audio
- **Filtres personnalisés**
- **Nouveaux backends** audio
- **Intégrations tierces**
- **Métriques custom**

---

## 📚 **API JavaScript**

```javascript
// Import
import { NativeAudioCaptureModule } from 'react-native-nyth-audio';

// Configuration
const config = {
  sampleRate: 44100,
  channelCount: 2,
  enableEchoCancellation: true,
};

// Utilisation
const capture = new NativeAudioCaptureModule();
await capture.initialize(config);
await capture.start();

// Callbacks
capture.onAudioData(data => {
  console.log('Données audio reçues:', data);
});

capture.onError(error => {
  console.error('Erreur:', error);
});
```

---

## 🤝 **Contribuer**

Pour contribuer au module :

1. **Fork** le projet
2. **Créer** une branche feature
3. **Ajouter** des tests unitaires
4. **Documenter** les changements
5. **Soumettre** une pull request

### **Standards de code**

- Code C++17 avec RAII
- Interface thread-safe
- Documentation Doxygen
- Tests unitaires obligatoires
- Logging détaillé pour debug

---

## 📄 **Licence**

Ce module fait partie du projet Nyth et suit la même licence.

_Dernière mise à jour : Décembre 2024_
