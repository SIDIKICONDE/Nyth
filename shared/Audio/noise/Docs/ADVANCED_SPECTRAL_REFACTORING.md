# Refactoring des Nombres Magiques - AdvancedSpectralNR

## 🎯 **Objectif du Refactoring**

Remplacer tous les nombres magiques dans le composant `AdvancedSpectralNR` par des constantes nommées et bien documentées, améliorant ainsi la lisibilité, la maintenabilité et la cohérence du code.

## 📁 **Composant Analysé**

### **AdvancedSpectralNR** (`AdvancedSpectralNR.hpp`)

- **Rôle** : Réduction de bruit spectrale avancée avec algorithmes de pointe
- **Nombres magiques identifiés** : Valeurs par défaut, seuils, paramètres de configuration
- **Statut** : ✅ **REFACTORÉ** - Utilise maintenant les constantes

## 🔧 **Constantes Ajoutées**

### Namespace `AdvancedSpectralNRConstants`

#### Paramètres de Base par Défaut

```cpp
constexpr uint32_t DEFAULT_SAMPLE_RATE = 48000;        // Fréquence d'échantillonnage par défaut
constexpr size_t DEFAULT_FFT_SIZE = 2048;              // Taille FFT par défaut (plus grande pour meilleure résolution)
constexpr size_t DEFAULT_HOP_SIZE = 512;               // Taille de saut par défaut (75% overlap)
```

#### Valeurs d'Agressivité par Défaut

```cpp
constexpr float DEFAULT_AGGRESSIVENESS = 0.7f;         // Agressivité par défaut (0-1)
```

#### Paramètres IMCRA par Défaut

```cpp
constexpr float DEFAULT_SPEECH_THRESHOLD = 4.6f;       // Seuil de détection de parole par défaut
constexpr float DEFAULT_NOISE_UPDATE_RATE = 0.95f;     // Taux de mise à jour du bruit par défaut
```

#### Paramètres Wiener par Défaut

```cpp
constexpr float DEFAULT_WIENER_ALPHA = 0.98f;          // Paramètre alpha de Wiener par défaut
constexpr float DEFAULT_MIN_GAIN = 0.1f;               // Gain minimal par défaut
constexpr float DEFAULT_MAX_GAIN = 1.0f;               // Gain maximal par défaut
```

#### Paramètres de Réduction du Bruit Musical par Défaut

```cpp
constexpr float DEFAULT_TEMPORAL_SMOOTHING = 0.7f;     // Lissage temporel par défaut
constexpr float DEFAULT_SPECTRAL_SMOOTHING = 0.3f;     // Lissage spectral par défaut
```

#### Paramètres de Préservation des Transitoires par Défaut

```cpp
constexpr float DEFAULT_TRANSIENT_THRESHOLD = 6.0f;    // Seuil de détection des transitoires par défaut
constexpr float DEFAULT_TRANSIENT_PROTECTION = 0.8f;   // Protection des transitoires par défaut
```

#### Seuils de Détection de Contenu

```cpp
constexpr float SPEECH_DETECTION_THRESHOLD = 0.7f;     // Seuil de détection de parole
constexpr float MUSIC_DETECTION_THRESHOLD = 0.5f;      // Seuil de détection de musique
constexpr float TRANSIENT_DETECTION_THRESHOLD = 6.0f;  // Seuil de détection des transitoires
```

#### Poids des Algorithmes par Type de Contenu

```cpp
namespace AlgorithmWeights {
    // Poids pour la parole
    constexpr float SPEECH_WIENER = 0.8f;              // Poids Wiener pour la parole
    constexpr float SPEECH_SPECTRAL = 0.2f;            // Poids spectral pour la parole

    // Poids pour la musique
    constexpr float MUSIC_WIENER = 0.5f;               // Poids Wiener pour la musique
    constexpr float MUSIC_MULTIBAND = 0.5f;            // Poids multibande pour la musique

    // Poids pour le bruit
    constexpr float NOISE_SPECTRAL = 0.6f;             // Poids spectral pour le bruit
    constexpr float NOISE_WIENER = 0.4f;               // Poids Wiener pour le bruit
}
```

#### Paramètres de Traitement par Défaut

```cpp
constexpr size_t DEFAULT_BLOCK_SIZE = 512;             // Taille de bloc par défaut
constexpr bool DEFAULT_ENABLE_MULTIBAND = true;        // Activation multibande par défaut
constexpr bool DEFAULT_PRESERVE_TRANSIENTS = true;     // Préservation des transitoires par défaut
constexpr bool DEFAULT_REDUCE_MUSICAL_NOISE = true;    // Réduction du bruit musical par défaut
```

## 🔄 **Nombres Magiques Remplacés**

### Dans la Structure `Config` d'AdvancedSpectralNR

#### Paramètres de Base

```cpp
// Avant
uint32_t sampleRate = 48000;
size_t fftSize = 2048;
size_t hopSize = 512;

// Après
uint32_t sampleRate = AdvancedSpectralNRConstants::DEFAULT_SAMPLE_RATE;
size_t fftSize = AdvancedSpectralNRConstants::DEFAULT_FFT_SIZE;
size_t hopSize = AdvancedSpectralNRConstants::DEFAULT_HOP_SIZE;
```

#### Options de Traitement

```cpp
// Avant
bool enableMultiband = true;
bool preserveTransients = true;
bool reduceMusicalNoise = true;
float aggressiveness = 0.7f;

// Après
bool enableMultiband = AdvancedSpectralNRConstants::DEFAULT_ENABLE_MULTIBAND;
bool preserveTransients = AdvancedSpectralNRConstants::DEFAULT_PRESERVE_TRANSIENTS;
bool reduceMusicalNoise = AdvancedSpectralNRConstants::DEFAULT_REDUCE_MUSICAL_NOISE;
float aggressiveness = AdvancedSpectralNRConstants::DEFAULT_AGGRESSIVENESS;
```

### Dans la Structure `Advanced`

#### Paramètres IMCRA

```cpp
// Avant
float speechThreshold = 4.6f;
float noiseUpdateRate = 0.95f;

// Après
float speechThreshold = AdvancedSpectralNRConstants::DEFAULT_SPEECH_THRESHOLD;
float noiseUpdateRate = AdvancedSpectralNRConstants::DEFAULT_NOISE_UPDATE_RATE;
```

#### Paramètres Wiener

```cpp
// Avant
float wienerAlpha = 0.98f;
float minGain = 0.1f;
float maxGain = 1.0f;

// Après
float wienerAlpha = AdvancedSpectralNRConstants::DEFAULT_WIENER_ALPHA;
float minGain = AdvancedSpectralNRConstants::DEFAULT_MIN_GAIN;
float maxGain = AdvancedSpectralNRConstants::DEFAULT_MAX_GAIN;
```

#### Réduction du Bruit Musical

```cpp
// Avant
float temporalSmoothing = 0.7f;
float spectralSmoothing = 0.3f;

// Après
float temporalSmoothing = AdvancedSpectralNRConstants::DEFAULT_TEMPORAL_SMOOTHING;
float spectralSmoothing = AdvancedSpectralNRConstants::DEFAULT_SPECTRAL_SMOOTHING;
```

#### Préservation des Transitoires

```cpp
// Avant
float transientThreshold = 6.0f;
float transientProtection = 0.8f;

// Après
float transientThreshold = AdvancedSpectralNRConstants::DEFAULT_TRANSIENT_THRESHOLD;
float transientProtection = AdvancedSpectralNRConstants::DEFAULT_TRANSIENT_PROTECTION;
```

### Dans la Classe `HybridNoiseReducer`

#### Paramètres de Base

```cpp
// Avant
uint32_t sampleRate = 48000;
size_t blockSize = 512;

// Après
uint32_t sampleRate = AdvancedSpectralNRConstants::DEFAULT_SAMPLE_RATE;
size_t blockSize = AdvancedSpectralNRConstants::DEFAULT_BLOCK_SIZE;
```

#### Seuils de Décision

```cpp
// Avant
float speechThreshold = 0.7f;
float musicThreshold = 0.5f;
float transientThreshold = 6.0f;

// Après
float speechThreshold = AdvancedSpectralNRConstants::SPEECH_DETECTION_THRESHOLD;
float musicThreshold = AdvancedSpectralNRConstants::MUSIC_DETECTION_THRESHOLD;
float transientThreshold = AdvancedSpectralNRConstants::TRANSIENT_DETECTION_THRESHOLD;
```

#### Poids des Algorithmes

```cpp
// Avant
float speechWiener = 0.8f;
float speechSpectral = 0.2f;
float musicWiener = 0.5f;
float musicMultiband = 0.5f;
float noiseSpectral = 0.6f;
float noiseWiener = 0.4f;

// Après
float speechWiener = AdvancedSpectralNRConstants::AlgorithmWeights::SPEECH_WIENER;
float speechSpectral = AdvancedSpectralNRConstants::AlgorithmWeights::SPEECH_SPECTRAL;
float musicWiener = AdvancedSpectralNRConstants::AlgorithmWeights::MUSIC_WIENER;
float musicMultiband = AdvancedSpectralNRConstants::AlgorithmWeights::MUSIC_MULTIBAND;
float noiseSpectral = AdvancedSpectralNRConstants::AlgorithmWeights::NOISE_SPECTRAL;
float noiseWiener = AdvancedSpectralNRConstants::AlgorithmWeights::NOISE_WIENER;
```

## ✅ **Avantages Obtenus**

### 1. **Lisibilité**

- Valeurs de configuration sémantiquement significatives
- Plus besoin de deviner la signification des nombres
- Documentation intégrée dans les constantes

### 2. **Maintenabilité**

- Modification centralisée des valeurs par défaut
- Cohérence dans tout le composant
- Réduction des erreurs de saisie

### 3. **Configuration**

- Valeurs par défaut facilement modifiables
- Possibilité de créer des presets
- Intégration avec le système de constantes existant

### 4. **Réutilisabilité**

- Constantes disponibles pour d'autres composants
- Namespace organisé et extensible
- Cohérence avec le système de constantes Noise

## 📊 **Statistiques du Refactoring**

- **Constantes ajoutées** : 25+
- **Nombres magiques éliminés** : 20+
- **Structures modifiées** : 2 (Config + Advanced)
- **Classes modifiées** : 2 (AdvancedSpectralNR + HybridNoiseReducer)
- **Namespaces créés** : 1 nouveau + 1 sous-namespace

## 🎉 **Conclusion**

Le refactoring d'AdvancedSpectralNR a été un succès ! Nous avons :

1. **Éliminé tous les nombres magiques** du composant
2. **Ajouté 25+ nouvelles constantes** bien documentées
3. **Amélioré la configuration** avec des valeurs sémantiques
4. **Maintenu la cohérence** avec le système de constantes existant
5. **Préparé le terrain** pour de futurs composants avancés

Le composant AdvancedSpectralNR est maintenant beaucoup plus professionnel, configurable et conforme aux bonnes pratiques de développement C++. Tous les nombres magiques ont été remplacés par des constantes sémantiquement significatives.

## 🚀 **Prochaines Étapes Suggérées**

1. **Vérifier la compilation** du composant AdvancedSpectralNR
2. **Tester les configurations** avec les nouvelles constantes
3. **Étendre le refactoring** aux autres composants Spectral si nécessaire
4. **Créer des presets** de configuration basés sur les constantes
5. **Documenter l'utilisation** des nouvelles constantes
