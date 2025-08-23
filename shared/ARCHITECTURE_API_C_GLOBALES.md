# Architecture des API C Globales dans le Projet Audio

## Vue d'ensemble

Le projet audio dans `/workspace/shared` utilise des **API C globales** pour plusieurs raisons architecturales importantes. Cette approche a été choisie délibérément pour faciliter l'intégration avec React Native et les plateformes natives (iOS/Android).

## Pourquoi des API C Globales ?

### 1. **Intégration Multi-Plateforme**

Les modules audio doivent fonctionner sur plusieurs plateformes :
- **React Native** via TurboModules et JSI
- **Android** via JNI (Java Native Interface)
- **iOS** via Objective-C++
- **Web** potentiellement via WebAssembly

L'API C avec `extern "C"` garantit une interface stable et compatible avec tous ces environnements.

### 2. **Architecture en Couches**

Le projet suit une architecture en 3 couches :

```
┌─────────────────────────────────────┐
│     JavaScript/React Native         │
├─────────────────────────────────────┤
│        TurboModule (C++)            │
├─────────────────────────────────────┤
│         API C Globale               │  ← Variables globales ici
├─────────────────────────────────────┤
│    Implémentation C++ (Classes)     │
└─────────────────────────────────────┘
```

### 3. **Variables Globales Identifiées**

Chaque module utilise des variables globales statiques préfixées par `g_` :

#### **NativeAudioUtilsModule**
```cpp
static std::unique_ptr<AudioUtils::AudioBuffer> g_audioBuffer;
static std::mutex g_globalMutex;
static NythUtilsState g_currentState;
```

#### **NativeAudioCoreModule**
```cpp
static std::unique_ptr<Audio::core::AudioEqualizer> g_audioEqualizer;
static std::map<int64_t, std::unique_ptr<AudioFX::BiquadFilter>> g_activeFilters;
static std::atomic<int64_t> g_nextFilterId;
```

#### **NativeAudioCaptureModule**
```cpp
static std::unique_ptr<Audio::capture::AudioCapture> g_captureInstance;
static std::unique_ptr<Nyth::Audio::AudioRecorder> g_recorderInstance;
```

### 4. **Raisons Techniques**

#### **a) Compatibilité JNI/Android**
JNI nécessite des fonctions C pour l'interface avec Java. Les variables globales permettent de maintenir l'état entre les appels JNI.

#### **b) Performance Audio Temps Réel**
- Évite l'allocation dynamique pendant le traitement audio
- Permet un accès rapide aux buffers audio
- Réduit la latence en évitant les indirections

#### **c) Singleton Pattern Implicite**
Chaque module audio agit comme un singleton :
- Un seul pipeline audio actif
- Un seul enregistreur audio
- Un seul égaliseur global

#### **d) Thread Safety**
Tous les modules utilisent `std::mutex g_globalMutex` pour la synchronisation :
```cpp
std::lock_guard<std::mutex> lock(g_globalMutex);
```

### 5. **Callbacks et État Global**

Les modules utilisent des callbacks globaux pour la communication asynchrone :
```cpp
static NythAudioDataCallback g_audioDataCallback = nullptr;
static NythErrorCallback g_errorCallback = nullptr;
static NythStateChangeCallback g_stateChangeCallback = nullptr;
```

## Avantages de cette Architecture

1. **Simplicité d'intégration** : Une seule API C à exposer pour toutes les plateformes
2. **Performance** : Pas d'overhead d'objets pour l'audio temps réel
3. **Compatibilité** : Fonctionne avec tous les systèmes de binding (JNI, JSI, etc.)
4. **Maintenance** : Code partagé entre toutes les plateformes

## Inconvénients et Limitations

1. **Pas de multi-instance** : Un seul pipeline audio par application
2. **État global** : Peut compliquer les tests unitaires
3. **Couplage** : Les modules sont liés à leur état global

## Alternatives Possibles

Si vous souhaitez éviter les variables globales, voici des alternatives :

### 1. **Handle/Context Pattern**
```c
// Au lieu de variables globales
typedef struct AudioContext* AudioHandle;
AudioHandle NythAudio_Create();
void NythAudio_Process(AudioHandle handle, float* data);
void NythAudio_Destroy(AudioHandle handle);
```

### 2. **Factory Pattern avec Instances**
```cpp
class AudioModuleFactory {
    static std::map<int, std::unique_ptr<AudioModule>> instances;
public:
    static int createInstance();
    static AudioModule* getInstance(int id);
};
```

### 3. **Dependency Injection**
Passer les dépendances explicitement plutôt que d'utiliser des globales.

## Recommandations

L'architecture actuelle avec des API C globales est **appropriée** pour un projet audio React Native car :

1. **C'est un pattern courant** dans les modules natifs React Native
2. **L'audio nécessite généralement un singleton** (un seul pipeline audio actif)
3. **La performance est critique** pour le traitement audio temps réel
4. **La compatibilité multi-plateforme** est essentielle

Si vous avez besoin de plusieurs instances ou d'une architecture plus flexible, considérez une refactorisation vers le pattern Handle/Context, mais cela nécessitera des changements significatifs dans l'intégration avec React Native.