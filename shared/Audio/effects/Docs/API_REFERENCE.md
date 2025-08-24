# 📖 Référence API - Effets Audio

## Vue d'ensemble

Cette référence détaille l'API complète du système d'effets audio, incluant l'interface JavaScript via JSI et les interfaces C++ natives.

## 🔧 API JavaScript

### Classe NativeAudioEffectsModule

#### Initialisation et cycle de vie

##### initialize()

Initialise le module et ses composants internes.

```javascript
const success = await effectsModule.initialize();
// Retourne: boolean
```

**Paramètres** : Aucun

**Retour** : `true` si l'initialisation réussit, `false` sinon

##### isInitialized()

Vérifie si le module est initialisé.

```javascript
const isReady = await effectsModule.isInitialized();
// Retourne: boolean
```

##### dispose()

Libère les ressources et nettoie le module.

```javascript
await effectsModule.dispose();
// Retourne: boolean
```

#### État et informations

##### getState()

Récupère l'état actuel du module.

```javascript
const state = await effectsModule.getState();
// Retourne: string - "uninitialized" | "initialized" | "processing" | "error"
```

##### getStatistics()

Récupère les statistiques de traitement.

```javascript
const stats = await effectsModule.getStatistics();
// Retourne: object | null
```

**Structure du retour** :

```javascript
{
  processingTime: number,    // Temps de traitement moyen (ms)
  cpuUsage: number,          // Utilisation CPU (%)
  activeEffects: number,     // Nombre d'effets actifs
  bufferSize: number,        // Taille des buffers audio
  sampleRate: number         // Taux d'échantillonnage
}
```

##### resetStatistics()

Réinitialise les statistiques de traitement.

```javascript
await effectsModule.resetStatistics();
// Retourne: boolean
```

#### Gestion des effets

##### createEffect(config)

Crée un nouvel effet audio.

```javascript
const effectId = await effectsModule.createEffect({
  type: string, // "compressor" | "delay"
  parameters: object, // Paramètres spécifiques à l'effet
  enabled: boolean, // État initial (défaut: true)
});
// Retourne: number - ID de l'effet (> 0) ou -1 en cas d'erreur
```

**Configuration compresseur** :

```javascript
{
  type: "compressor",
  parameters: {
    thresholdDb: number,    // Seuil en dB (-60 à 0, défaut: -10)
    ratio: number,          // Ratio (1 à 20, défaut: 4)
    attackMs: number,       // Attack en ms (0.1 à 100, défaut: 10)
    releaseMs: number,      // Release en ms (0.1 à 1000, défaut: 100)
    makeupDb: number        // Makeup gain en dB (-20 à 20, défaut: 0)
  },
  enabled: true
}
```

**Configuration delay** :

```javascript
{
  type: "delay",
  parameters: {
    delayMs: number,       // Délai en ms (0.1 à 4000, défaut: 100)
    feedback: number,      // Feedback (0.0 à 0.99, défaut: 0.5)
    mix: number           // Mix wet/dry (0.0 à 1.0, défaut: 0.5)
  },
  enabled: true
}
```

##### destroyEffect(effectId)

Détruit un effet audio.

```javascript
const success = await effectsModule.destroyEffect(effectId);
// Retourne: boolean
```

**Paramètres** :

- `effectId` : number - ID de l'effet à détruire

##### updateEffect(effectId, config)

Met à jour la configuration d'un effet.

```javascript
const success = await effectsModule.updateEffect(effectId, {
  thresholdDb: -6.0, // Nouveaux paramètres
  ratio: 6.0,
});
// Retourne: boolean
```

##### getEffectConfig(effectId)

Récupère la configuration actuelle d'un effet.

```javascript
const config = await effectsModule.getEffectConfig(effectId);
// Retourne: object | null
```

#### Contrôle des effets

##### enableEffect(effectId, enabled)

Active ou désactive un effet.

```javascript
await effectsModule.enableEffect(effectId, true);
// Retourne: boolean
```

##### isEffectEnabled(effectId)

Vérifie si un effet est activé.

```javascript
const enabled = await effectsModule.isEffectEnabled(effectId);
// Retourne: boolean
```

##### getActiveEffectsCount()

Retourne le nombre d'effets actifs.

```javascript
const count = await effectsModule.getActiveEffectsCount();
// Retourne: number
```

##### getActiveEffectIds()

Retourne la liste des IDs d'effets actifs.

```javascript
const ids = await effectsModule.getActiveEffectIds();
// Retourne: number[]
```

#### Contrôle global

##### setBypassAll(bypass)

Active ou désactive tous les effets (bypass).

```javascript
await effectsModule.setBypassAll(true);
// Retourne: boolean
```

##### isBypassAll()

Vérifie si le bypass global est actif.

```javascript
const bypassed = await effectsModule.isBypassAll();
// Retourne: boolean
```

##### setMasterLevels(input, output)

Configure les niveaux master d'entrée et sortie.

```javascript
await effectsModule.setMasterLevels(0.8, 0.9);
// Retourne: boolean
```

**Paramètres** :

- `input` : number - Niveau d'entrée (0.0 à 1.0)
- `output` : number - Niveau de sortie (0.0 à 1.0)

##### getMasterLevels()

Récupère les niveaux master actuels.

```javascript
const levels = await effectsModule.getMasterLevels();
// Retourne: { input: number, output: number }
```

#### Traitement audio

##### processAudio(input, channels)

Traite un buffer audio avec les effets actifs.

```javascript
const inputBuffer = [0.1, 0.2, 0.3, 0.4]; // Samples audio (-1.0 à 1.0)
const processedBuffer = await effectsModule.processAudio(inputBuffer, 1);
// Retourne: number[] - Buffer traité
```

**Paramètres** :

- `input` : number[] - Buffer audio d'entrée
- `channels` : number - Nombre de canaux (1 = mono, 2 = stéréo entrelacé)

##### processAudioStereo(inputL, inputR)

Traite un buffer audio stéréo séparé.

```javascript
const leftChannel = [0.1, 0.2, 0.3, 0.4];
const rightChannel = [0.1, 0.2, 0.3, 0.4];
const result = await effectsModule.processAudioStereo(
  leftChannel,
  rightChannel,
);
// Retourne: { left: number[], right: number[] }
```

#### Analyse audio

##### getInputLevel()

Récupère le niveau d'entrée actuel.

```javascript
const level = await effectsModule.getInputLevel();
// Retourne: number - Niveau en dB
```

##### getOutputLevel()

Récupère le niveau de sortie actuel.

```javascript
const level = await effectsModule.getOutputLevel();
// Retourne: number - Niveau en dB
```

##### getProcessingMetrics()

Récupère les métriques de traitement détaillées.

```javascript
const metrics = await effectsModule.getProcessingMetrics();
// Retourne: object
```

**Structure des métriques** :

```javascript
{
  inputLevel: number,       // Niveau d'entrée (dB)
  outputLevel: number,      // Niveau de sortie (dB)
  processingTime: number,   // Temps de traitement (ms)
  latency: number,          // Latence totale (ms)
  effects: object[]         // Métriques par effet
}
```

#### Métriques spécifiques par effet

##### getCompressorMetrics(effectId)

Récupère les métriques spécifiques au compresseur.

```javascript
const metrics = await effectsModule.getCompressorMetrics(effectId);
// Retourne: object | null
```

**Métriques compresseur** :

```javascript
{
  inputLevel: number,       // Niveau d'entrée (dB)
  outputLevel: number,      // Niveau de sortie (dB)
  gainReduction: number,    // Réduction de gain (dB)
  compressionRatio: number, // Ratio de compression effectif
  isActive: boolean         // Compresseur actif
}
```

##### getDelayMetrics(effectId)

Récupère les métriques spécifiques au delay.

```javascript
const metrics = await effectsModule.getDelayMetrics(effectId);
// Retourne: object | null
```

**Métriques delay** :

```javascript
{
  bufferSize: number,       // Taille du buffer delay (samples)
  delayTime: number,        // Temps de delay effectif (ms)
  feedbackLevel: number,    // Niveau de feedback
  wetLevel: number,         // Niveau wet
  dryLevel: number          // Niveau dry
}
```

#### Configuration spécifique par effet

##### getCompressorConfig(effectId)

Récupère la configuration actuelle du compresseur.

```javascript
const config = await effectsModule.getCompressorConfig(effectId);
// Retourne: object | null
```

##### getDelayConfig(effectId)

Récupère la configuration actuelle du delay.

```javascript
const config = await effectsModule.getDelayConfig(effectId);
// Retourne: object | null
```

#### Informations détaillées par effet

##### getEffectType(effectId)

Récupère le type d'un effet.

```javascript
const type = await effectsModule.getEffectType(effectId);
// Retourne: string - "compressor" | "delay" | "unknown"
```

##### getEffectState(effectId)

Récupère l'état détaillé d'un effet.

```javascript
const state = await effectsModule.getEffectState(effectId);
// Retourne: object | null
```

**Structure de l'état** :

```javascript
{
  enabled: boolean,         // État activé/désactivé
  processing: boolean,      // En cours de traitement
  latency: number,          // Latence actuelle (ms)
  lastError: string         // Dernière erreur (ou null)
}
```

##### getEffectLatency(effectId)

Récupère la latence d'un effet spécifique.

```javascript
const latency = await effectsModule.getEffectLatency(effectId);
// Retourne: number - Latence en ms
```

#### Callbacks JavaScript

##### setAudioDataCallback(callback)

Définit le callback pour les données audio traitées.

```javascript
effectsModule.setAudioDataCallback(data => {
  console.log('Audio processed:', data);
  // data: { input: number[], output: number[], timestamp: number }
});
```

##### setErrorCallback(callback)

Définit le callback pour les erreurs.

```javascript
effectsModule.setErrorCallback(error => {
  console.error('Audio effects error:', error);
  // error: { code: number, message: string, effectId?: number }
});
```

##### setStateChangeCallback(callback)

Définit le callback pour les changements d'état.

```javascript
effectsModule.setStateChangeCallback(state => {
  console.log('State changed:', state);
  // state: { oldState: string, newState: string, timestamp: number }
});
```

##### setProcessingCallback(callback)

Définit le callback pour les événements de traitement.

```javascript
effectsModule.setProcessingCallback(event => {
  console.log('Processing event:', event);
  // event: { type: string, effectId: number, metrics: object }
});
```

## 🏗️ API C++ Native

### Classe NativeAudioEffectsModule

#### Constructeur et destructeur

```cpp
// Constructeur
explicit NativeAudioEffectsModule(std::shared_ptr<CallInvoker> jsInvoker);

// Destructeur virtuel
~NativeAudioEffectsModule() override;
```

#### Méthodes principales

```cpp
// Cycle de vie
jsi::Value initialize(jsi::Runtime& rt);
jsi::Value isInitialized(jsi::Runtime& rt);
jsi::Value dispose(jsi::Runtime& rt);

// Gestion des effets
jsi::Value createEffect(jsi::Runtime& rt, const jsi::Object& config);
jsi::Value destroyEffect(jsi::Runtime& rt, int effectId);
jsi::Value updateEffect(jsi::Runtime& rt, int effectId, const jsi::Object& config);

// Traitement audio
jsi::Value processAudio(jsi::Runtime& rt, const jsi::Array& input, int channels);
jsi::Value processAudioStereo(jsi::Runtime& rt, const jsi::Array& inputL, const jsi::Array& inputR);
```

### Interface IAudioEffect

```cpp
class IAudioEffect {
public:
    virtual ~IAudioEffect() noexcept = default;

    // Configuration
    virtual void setSampleRate(uint32_t sampleRate, int numChannels) noexcept = 0;
    virtual void setEnabled(bool enabled) noexcept = 0;
    virtual bool isEnabled() const noexcept = 0;

    // Traitement
    virtual void processMono(const float* input, float* output, size_t numSamples) = 0;
    virtual void processStereo(const float* inL, const float* inR,
                              float* outL, float* outR, size_t numSamples) = 0;
};
```

### Gestionnaire d'effets

```cpp
namespace EffectManager {
    class EffectManager {
    public:
        // Cycle de vie
        bool initialize(const Nyth::Audio::EffectsConfig& config);
        bool isInitialized() const;
        void release();

        // Gestion des effets
        int createEffect(EffectType type);
        bool destroyEffect(int effectId);
        bool hasEffect(int effectId) const;

        // Traitement
        bool processAudio(float* buffer, size_t numSamples, int channels);
        bool processAudioStereo(float* left, float* right, size_t numSamples);
    };
}
```

## 📊 Types et constantes

### Types d'effets

```cpp
enum class EffectType {
    COMPRESSOR = 1,
    DELAY = 2,
    // Futurs effets...
};
```

### États du module

```cpp
static constexpr int STATE_UNINITIALIZED = 0;
static constexpr int STATE_INITIALIZED = 1;
static constexpr int STATE_PROCESSING = 2;
static constexpr int STATE_ERROR = 3;
```

### Constantes audio

```cpp
// Configuration audio
static constexpr uint32_t DEFAULT_SAMPLE_RATE = 44100;
static constexpr int DEFAULT_CHANNELS = 2;
static constexpr int MONO_CHANNELS = 1;
static constexpr int STEREO_CHANNELS = 2;

// Limites
static constexpr double MIN_RATIO = 1.0;
static constexpr double MAX_RATIO = 20.0;
static constexpr double MIN_THRESHOLD_DB = -60.0;
static constexpr double MAX_THRESHOLD_DB = 0.0;
```

## 🚨 Codes d'erreur

| Code | Description                |
| ---- | -------------------------- |
| 0    | Succès                     |
| 1    | Module non initialisé      |
| 2    | Paramètre invalide         |
| 3    | Effet non trouvé           |
| 4    | Erreur de mémoire          |
| 5    | Erreur de traitement audio |
| 6    | Configuration invalide     |
| 7    | Limite dépassée            |

## 🔄 Types JSI

### Conversion automatique

Le système `EffectsJSIConverter` gère automatiquement la conversion entre les types JavaScript et C++ :

- `number[]` ↔ `std::vector<float>`
- `object` ↔ `EffectConfig`
- `boolean` ↔ `bool`
- `string` ↔ `std::string`

### Gestion des erreurs JSI

```cpp
// Les erreurs sont automatiquement converties en exceptions JavaScript
try {
    // Code natif
} catch (const std::exception& e) {
    // Automatiquement propagé vers JavaScript
    throw jsi::JSError(rt, e.what());
}
```

## 📝 Notes d'utilisation

### Bonnes pratiques

1. **Initialisation** : Toujours vérifier `isInitialized()` avant utilisation
2. **Gestion des erreurs** : Implémenter les callbacks d'erreur
3. **Performance** : Éviter les allocations dans les boucles de traitement
4. **Ressources** : Appeler `dispose()` pour libérer les ressources

### Gestion de la mémoire

- Les buffers audio sont gérés automatiquement
- Pas d'allocation dynamique pendant le traitement
- Utilisation de pools de mémoire pour optimiser les performances

### Thread-safety

- Toutes les méthodes publiques sont thread-safe
- Le traitement audio peut être appelé depuis n'importe quel thread
- Les callbacks JavaScript sont exécutés sur le thread JS

---

**Version API** : 1.0.0
**Dernière mise à jour** : 2024
