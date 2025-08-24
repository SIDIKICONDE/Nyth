# Connexion des Composants Noise

## Architecture Générale

Le système de réduction de bruit audio est organisé en plusieurs couches interconnectées :

```
NativeAudioNoiseModule (TurboModule)
    ↓
NoiseManager (Gestionnaire principal)
    ↓
Composants AudioNR (Algorithmes spécialisés)
    ↓
Composants de base (IMCRA, Wiener, Multiband)
```

## Composants Principaux

### 1. NativeAudioNoiseModule

- **Rôle** : Interface TurboModule pour React Native
- **Responsabilités** :
  - Gestion du cycle de vie (initialize, start, stop, dispose)
  - Configuration des algorithmes
  - Gestion des callbacks JavaScript
  - Traitement des erreurs

### 2. NoiseManager

- **Rôle** : Orchestrateur des composants audio
- **Responsabilités** :
  - Initialisation des composants selon l'algorithme
  - Connexion des composants entre eux
  - Gestion du pipeline de traitement
  - Statistiques et métriques

### 3. Composants AudioNR

#### AdvancedSpectralNR

- **Algorithme** : MMSE-LSA, Wiener, Multiband
- **Composants internes** :
  - IMCRA (estimation de bruit)
  - Wiener Filter (filtrage adaptatif)
  - Multiband Processor (traitement par bandes)
- **Cas d'usage** : Réduction de bruit avancée, préservation des transitoires

#### SpectralNR

- **Algorithme** : Soustraction spectrale classique
- **Composants internes** : FFT, estimation de bruit simple
- **Cas d'usage** : Réduction de bruit basique, performance optimisée

#### NoiseReducer

- **Algorithme** : Gate/expander descendant
- **Composants internes** : Filtres biquad, suiveur d'enveloppe
- **Cas d'usage** : Réduction de bruit en temps réel, préservation de la dynamique

## Pipeline de Traitement

### Pipeline AdvancedSpectralNR

```
Input → FFT → IMCRA → Wiener → Multiband → IFFT → Output
```

1. **FFT** : Conversion vers le domaine fréquentiel
2. **IMCRA** : Estimation robuste du bruit
3. **Wiener** : Filtrage adaptatif optimal
4. **Multiband** : Traitement par bandes de fréquences
5. **IFFT** : Retour au domaine temporel

### Pipeline SpectralNR

```
Input → FFT → Estimation Bruit → Soustraction → IFFT → Output
```

### Pipeline NoiseReducer

```
Input → HighPass → Enveloppe → Gain → Output
```

## Connexion des Composants

### Méthode `connectComponents()`

```cpp
void NoiseManager::connectComponents() {
    if (advancedSpectralNR_) {
        // AdvancedSpectralNR gère ses sous-composants internes
        // IMCRA ↔ Wiener ↔ Multiband sont connectés automatiquement
    }

    if (spectralNR_) {
        // Configuration des callbacks si nécessaire
    }

    if (noiseReducer_) {
        // Configuration des callbacks si nécessaire
    }
}
```

### Méthode `setupProcessingPipeline()`

```cpp
void NoiseManager::setupProcessingPipeline() {
    switch (config_.algorithm) {
        case ADVANCED_SPECTRAL:
            // Pipeline: Input → IMCRA → Wiener → Multiband → Output
            break;
        case WIENER_FILTER:
            // Pipeline: Input → IMCRA → Wiener → Output
            break;
        case MULTIBAND:
            // Pipeline: Input → IMCRA → Multiband → Output
            break;
        default:
            // Pipeline: Input → NoiseReducer → Output
            break;
    }
}
```

## Configuration des Algorithmes

### AdvancedSpectralNR

```cpp
AudioNR::AdvancedSpectralNR::Config advConfig;
advConfig.sampleRate = config_.sampleRate;
advConfig.fftSize = config_.fftSize;
advConfig.hopSize = config_.hopSize;
advConfig.aggressiveness = config_.aggressiveness;
advConfig.enableMultiband = config_.enableMultiband;
advConfig.preserveTransients = config_.preserveTransients;
advConfig.reduceMusicalNoise = config_.reduceMusicalNoise;

// Sélection de l'algorithme
switch (config_.algorithm) {
    case ADVANCED_SPECTRAL:
        advConfig.algorithm = MMSE_LSA;
        break;
    case WIENER_FILTER:
        advConfig.algorithm = WIENER_FILTER;
        break;
    case MULTIBAND:
        advConfig.algorithm = MULTIBAND;
        break;
}
```

### SpectralNR

```cpp
AudioNR::SpectralNR::Config specConfig;
specConfig.sampleRate = config_.sampleRate;
specConfig.fftSize = config_.fftSize;
specConfig.hopSize = config_.hopSize;
specConfig.aggressiveness = config_.aggressiveness;
```

## Gestion des Callbacks

### Callbacks JavaScript

- `setAudioDataCallback` : Données audio traitées
- `setErrorCallback` : Gestion des erreurs
- `setStateChangeCallback` : Changements d'état

### Callbacks Internes

- `setStatisticsCallback` : Mise à jour des statistiques
- `setProcessingCallback` : Fin du traitement audio

## Optimisations

### Buffers de Travail

- `workBufferL_` / `workBufferR_` : Traitement stéréo
- `intermediateBuffer_` : Traitement intermédiaire

### Thread Safety

- Mutex pour la configuration
- Mutex séparé pour les statistiques
- Atomic pour l'état et l'initialisation

## Utilisation

### Initialisation

```cpp
// Configuration
Nyth::Audio::NoiseConfig config;
config.algorithm = Nyth::Audio::NoiseAlgorithm::ADVANCED_SPECTRAL;
config.aggressiveness = 0.7f;
config.enableMultiband = true;

// Initialisation
noiseManager_->initialize(config);
noiseManager_->start();
```

### Traitement

```cpp
// Traitement mono
noiseManager_->processAudio(input, output, frameCount, 1);

// Traitement stéréo
noiseManager_->processAudioStereo(inputL, inputR, outputL, outputR, frameCount);
```

### Nettoyage

```cpp
noiseManager_->stop();
noiseManager_->release();
```

## Avantages de cette Architecture

1. **Modularité** : Chaque composant a une responsabilité claire
2. **Flexibilité** : Changement d'algorithme à la volée
3. **Performance** : Pipeline optimisé selon l'algorithme
4. **Maintenabilité** : Séparation claire des préoccupations
5. **Extensibilité** : Ajout facile de nouveaux algorithmes
