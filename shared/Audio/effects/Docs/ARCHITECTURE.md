# 🏗️ Architecture du Système d'Effets Audio

## Vue d'ensemble de l'architecture

Le système d'effets audio de Nyth est conçu selon une architecture modulaire et extensible qui sépare clairement les responsabilités entre les différentes couches. Cette approche permet une maintenance facile, des tests unitaires robustes, et une évolution continue du système.

## 🏛️ Architecture en couches

### 1. Couche d'Interface (JSI/TurboModule)

**Fichier principal** : `NativeAudioEffectsModule.h/cpp`

Cette couche fournit l'interface JavaScript via le système JSI (JavaScript Interface) de React Native.

**Responsabilités** :

- Exposition des APIs JavaScript via TurboModule
- Conversion des types JSI vers types C++
- Gestion du cycle de vie du module
- Communication asynchrone via callbacks

**Caractéristiques techniques** :

- Héritage de `TurboModule` pour l'intégration React Native
- Utilisation de `jsi::Runtime` pour l'accès JavaScript
- Gestion thread-safe via mutex et atomic
- Callbacks JavaScript pour événements asynchrones

### 2. Couche de Gestion (Managers)

**Fichiers principaux** :

- `EffectManager.h/cpp` - Gestionnaire principal
- `CompressorManager.h/cpp` - Gestion spécialisé compresseur
- `DelayManager.h/cpp` - Gestion spécialisé delay

**Responsabilités** :

- Gestion du cycle de vie des effets
- Coordination entre les effets
- Validation des paramètres
- Gestion des ressources

**Architecture du gestionnaire** :

```cpp
class EffectManager {
private:
    std::unordered_map<int, std::unique_ptr<IAudioEffect>> activeEffects_;
    std::atomic<int> nextEffectId_;
    std::mutex effectsMutex_;
    EffectChain effectChain_;
    Nyth::Audio::EffectsConfig config_;
};
```

### 3. Couche de Traitement (Components)

**Fichiers principaux** :

- `EffectBase.hpp` - Interface de base
- `Compressor.hpp` - Implémentation compresseur
- `Delay.hpp` - Implémentation delay
- `EffectChain.hpp` - Chaînage d'effets

**Hiérarchie des classes** :

```
IAudioEffect (interface pure)
├── EffectBase (implémentation de base)
│   ├── CompressorEffect
│   ├── DelayEffect
│   └── (futurs effets)
```

## 🔄 Flux de données

### Flux audio

```
JavaScript Audio Buffer
        ↓
JSI Conversion (EffectsJSIConverter)
        ↓
EffectManager::processAudio()
        ↓
EffectChain::process()
        ↓
Effets individuels (Compressor, Delay, etc.)
        ↓
JSI Conversion retour
        ↓
JavaScript Audio Buffer traité
```

### Flux de contrôle

```
JavaScript API Call
        ↓
TurboModule Method (NativeAudioEffectsModule)
        ↓
EffectManager Method
        ↓
Effect Component
        ↓
Callback JavaScript (si nécessaire)
```

## 📊 Gestion des états

### États du système

```cpp
enum class ModuleState {
    UNINITIALIZED,  // Non initialisé
    INITIALIZED,    // Initialisé mais inactif
    PROCESSING,     // En cours de traitement
    ERROR          // Erreur critique
};
```

### États des effets

```cpp
struct EffectState {
    bool enabled;           // Actif/inactif
    bool processing;        // En cours de traitement
    float latency;          // Latence actuelle
    ProcessingMetrics metrics; // Métriques temps réel
};
```

## 🧵 Gestion de la concurrence

### Synchronisation

- **Mutex par effet** : Protection des accès individuels
- **Mutex global** : Protection des opérations système
- **Atomic operations** : Pour les compteurs et flags

### Threads

- **Thread principal** : Gestion et configuration
- **Thread audio** : Traitement en temps réel
- **Thread JSI** : Communication JavaScript

## 📈 Métriques et monitoring

### Métriques collectées

```cpp
struct ProcessingMetrics {
    float inputLevel;           // Niveau d'entrée (dB)
    float outputLevel;          // Niveau de sortie (dB)
    float processingTime;       // Temps de traitement (ms)
    float cpuUsage;            // Utilisation CPU (%)
    size_t bufferSize;         // Taille des buffers
    size_t effectsCount;       // Nombre d'effets actifs
};
```

### Métriques par effet

- **Compresseur** : Réduction de gain, ratio effectif
- **Delay** : Taille buffer, feedback level
- **Général** : Latence, distorsion

## 🗂️ Gestion des ressources

### Allocation mémoire

- **Pool de buffers** pour éviter les allocations répétées
- **Pré-allocation** des ressources critiques
- **RAII** pour la gestion automatique

### Gestion des effets

```cpp
// Création d'effet
int effectId = nextEffectId_.fetch_add(1);
activeEffects_[effectId] = std::make_unique<CompressorEffect>();

// Destruction automatique
activeEffects_.erase(effectId);
```

## 🔌 Système de plugins

### Architecture extensible

```cpp
// Interface pour nouveaux effets
class IAudioEffect {
public:
    virtual ~IAudioEffect() = default;
    virtual void processMono(float*, float*, size_t) = 0;
    virtual void processStereo(float*, float*, float*, float*, size_t) = 0;
    virtual void setEnabled(bool) = 0;
    virtual bool isEnabled() const = 0;
};
```

### Enregistrement des effets

```cpp
// Factory pattern pour la création
std::unique_ptr<IAudioEffect> EffectManager::createEffectByType(EffectType type) {
    switch (type) {
        case EffectType::COMPRESSOR:
            return std::make_unique<CompressorEffect>();
        case EffectType::DELAY:
            return std::make_unique<DelayEffect>();
        default:
            return nullptr;
    }
}
```

## ⚙️ Configuration système

### Structure de configuration

```cpp
struct EffectsConfig {
    uint32_t sampleRate;          // Taux d'échantillonnage
    int channels;                 // Nombre de canaux
    size_t maxBufferSize;         // Taille max des buffers
    size_t maxEffects;           // Nombre max d'effets
    bool enableMetrics;          // Activation métriques
    bool enableDebug;           // Mode debug
};
```

### Validation de configuration

- **Limites hardware** : Détection automatique des capacités
- **Contraintes audio** : Validation des paramètres
- **Compatibilité** : Vérification des formats supportés

## 🚨 Gestion d'erreurs

### Stratégie de gestion

1. **Erreurs critiques** : Arrêt du traitement, notification JS
2. **Erreurs récupérables** : Bypass de l'effet, continuation
3. **Warnings** : Log et métriques, traitement normal

### Callbacks d'erreur

```cpp
// Callback JavaScript pour erreurs
setErrorCallback(jsi::Runtime& rt, const jsi::Function& callback) {
    callbackManager_->registerCallback("error", callback);
}
```

## 📊 Performance

### Optimisations implémentées

1. **Optimisations CPU** :

   - Unrolling de boucle (traitement par blocs de 4 échantillons)
   - Prefetching des données
   - Calculs vectorisés où possible

2. **Optimisations mémoire** :

   - Allocation alignée
   - Pool de buffers
   - Cache-friendly data structures

3. **Optimisations audio** :
   - Traitement par blocs
   - Évite les allocations en temps réel
   - Optimisations spécifiques par effet

### Benchmarks cibles

- **Latence** : < 2ms pour une chaîne d'effets
- **CPU** : < 5% sur appareils mobiles modernes
- **Mémoire** : < 10MB pour 10 effets actifs

## 🔄 Évolution et extensibilité

### Points d'extension

1. **Nouveaux effets** : Implémenter `IAudioEffect`
2. **Nouveaux formats** : Étendre `EffectsJSIConverter`
3. **Nouveaux gestionnaires** : Hériter d'`EffectManager`
4. **Nouvelles métriques** : Étendre `ProcessingMetrics`

### Migration future

- Support pour **Audio Worklets** (Web)
- **SIMD** pour les calculs vectorisés
- **GPU acceleration** pour certains effets
- **Machine learning** pour effets adaptatifs

## 🧪 Tests et validation

### Stratégie de tests

1. **Tests unitaires** : Chaque composant
2. **Tests d'intégration** : Flux complets
3. **Tests de performance** : Benchmarks
4. **Tests de régression** : Validation continue

### Outils de test

- **Google Test** pour les tests C++
- **Jest** pour les tests React Native
- **Benchmarks** personnalisés pour la performance
- **Audio analysis tools** pour la qualité

---

**Note** : Cette architecture est conçue pour être évolutive et maintenable. Les principes SOLID et les patterns de conception modernes sont appliqués tout au long du système.
