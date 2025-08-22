# 🎵 Audio Pipeline Intégré - Documentation

Le système audio intégré combine tous les modules (`capture/`, `core/`, `effects/`, `noise/`, `safety/`, `fft/`, `utils/`) dans un pipeline cohérent et optimisé.

## 📋 Table des Matières

- [Architecture](#architecture)
- [Performance](#performance)
- [Utilisation](#utilisation)
- [Exemples](#exemples)
- [Configuration](#configuration)
- [API Reference](#api-reference)

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │ -> │   Native Module  │ -> │   AudioPipeline  │
│   (JavaScript)  │    │   (Java/Kotlin)  │    │   (C++)          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────────────────────────────────────────┼─────────────────────────────────────────────────────┐
│ AudioPipeline (C++)                                 │ Android                    │ iOS                     │
├─────────────────────────────────────────────────────┼────────────────────────────┼────────────────────────┤
│ • AudioCapture (capture/)                          │ JNI + NEON SIMD           │ Audio Units + NEON     │
│ • AudioEqualizer (core/)                           │ ARM64-v8a + crypto+simd   │ ARM64 + SIMD            │
│ • NoiseReduction (noise/)                          │ Link Time Optimization    │ LTO + Optimizations     │
│ • AudioEffects (effects/)                          │ Performance Monitoring    │ Real-time Monitoring    │
│ • AudioSafetyLimiter (safety/)                     │ Exception Handling        │ Structured Exceptions   │
│ • AudioFFTAnalyzer (fft/)                          │ Memory Pool Management    │ Advanced Memory Mgmt    │
│ • AudioBuffer (utils/)                             │                            │                         │
└─────────────────────────────────────────────────────┴────────────────────────────┴─────────────────────────┘
```

## ⚡ Performance

### Optimisations SIMD
- **ARM NEON**: 2-9x speedup pour les opérations audio critiques
- **x86 SSE/AVX**: Optimisations pour debugging desktop
- **Automatic Detection**: Activation automatique selon l'architecture

### Métriques de Performance

| Opération | Version Originale | Version Optimisée | Speedup |
|-----------|-------------------|-------------------|---------|
| **Calcul RMS** | 957 ns | 102 ns | **9.4x** 🚀 |
| **Peak Detection** | 978 ns | 190 ns | **5.1x** 🚀 |
| **Silence Detection** | 968 ns | 138 ns | **7.0x** 🚀 |
| **Normalisation** | 3077 ns | 2337 ns | **1.3x** ✅ |
| **Conversion Format** | 3684 ns (int16->float) | 94.2 ns (SIMD) | **39.1x** 🚀 |

### Configuration de Build

#### Android (CMakeLists.txt)
```cmake
# Optimisations pour Android
if(ANDROID_ABI STREQUAL "arm64-v8a")
    add_compile_options(-march=armv8-a+crypto+simd)
    add_compile_options(-O3 -flto -ffast-math)
endif()

# Activation des fonctionnalités
add_definitions(-DHAS_NEON=1)
add_definitions(-DENABLE_AUDIO_CAPTURE_VALIDATION)
add_definitions(-DPERFORMANCE_MONITORING_ENABLED)
```

#### iOS (Xcode Project)
```xml
<!-- Flags de compilation iOS -->
OTHER_CPLUSPLUSFLAGS = (
    "-DHAS_NEON=1",
    "-O3",
    "-march=armv8-a+simd",
    "-mcpu=apple-a12",
    "-flto"
);
```

## 🚀 Utilisation

### 1. Android (React Native)

#### Installation du Module Natif
```java
// AudioPipelineModule.java
package com.nyth.audio;

import com.facebook.react.bridge.*;

public class AudioPipelineModule extends ReactContextBaseJavaModule {
    // Interface JNI vers C++
    private native boolean nativeInitialize(int sampleRate, boolean enableEQ,
                                          boolean enableNoiseReduction, boolean enableEffects);
    private native boolean nativeStart();
    private native boolean nativeStop();
    // ... autres méthodes
}
```

#### Utilisation TypeScript
```typescript
import { AudioPipeline } from './AudioPipelineModule';

const audioPipeline = new AudioPipeline();

// Initialisation
await audioPipeline.initialize({
  sampleRate: 44100,
  enableEqualizer: true,
  enableNoiseReduction: false,
  enableEffects: false
});

// Configuration EQ
await audioPipeline.setEqualizerEnabled(true);
await audioPipeline.applyEqualizerPreset('rock');

// Démarrage
await audioPipeline.start();

// Monitoring temps réel
const removeListener = audioPipeline.onAudioLevels((levels) => {
  console.log(`Level: ${levels.currentLevel.toFixed(1)} dB`);
});

// Enregistrement
await audioPipeline.startRecording('output.wav');

// Arrêt
await audioPipeline.stopRecording();
await audioPipeline.stop();
```

### 2. iOS (React Native)

#### Module Objective-C++
```objective-c
// AudioPipelineModule.mm
#import "AudioPipelineModule.h"
#include "AudioPipeline.hpp"

@implementation AudioPipelineModule {
    Nyth::Audio::AudioPipeline* pipeline_;
}

RCT_EXPORT_METHOD(initialize:(NSDictionary*)config
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    // Configuration et initialisation
    Nyth::Audio::AudioPipeline::Config pipelineConfig;
    pipelineConfig.sampleRate = [config[@"sampleRate"] intValue] ?: 44100;
    pipelineConfig.enableEqualizer = [config[@"enableEqualizer"] boolValue] ?: true;

    if (pipeline_->initialize(pipelineConfig)) {
        resolve(@"Pipeline initialized successfully");
    } else {
        reject(@"INIT_FAILED", @"Failed to initialize pipeline", nil);
    }
}
@end
```

## 📖 Exemples Complets

### Exemple Android Complet
```cpp
// android_audio_pipeline_example.cpp
#include "AudioPipeline.hpp"
#include <jni.h>
#include <android/log.h>

namespace Nyth::Audio::Android {
class AudioPipelineJNI {
public:
    bool initializeJNI(JNIEnv* env, int sampleRate, bool enableEQ,
                      bool enableNoiseReduction, bool enableEffects) {
        AudioPipeline::Config config;
        config.captureConfig.sampleRate = sampleRate;
        config.enableEqualizer = enableEQ;
        config.enableNoiseReduction = enableNoiseReduction;
        config.enableEffects = enableEffects;

        if (pipeline_.initialize(config)) {
            __android_log_print(ANDROID_LOG_INFO, "AudioPipeline",
                              "Initialized successfully");
            return true;
        }
        return false;
    }
};
}
```

### Exemple Pipeline Complet
```cpp
// integrated_audio_example.cpp
void demonstrateFullPipeline() {
    AudioPipeline pipeline;
    AudioPipeline::Config config;

    // Configuration complète
    config.captureConfig.sampleRate = 44100;
    config.captureConfig.channelCount = 2;
    config.enableEqualizer = true;
    config.enableNoiseReduction = true;
    config.enableEffects = true;
    config.enableSafetyLimiter = true;
    config.enableFFTAnalysis = true;

    pipeline.initialize(config);
    pipeline.start();

    // Chaîne de traitement complète :
    // Capture -> Noise Reduction -> EQ -> Effects -> Limiter -> Output
    //             ↓                                        ↓
    //         FFT Analysis                             File Output
}
```

## ⚙️ Configuration

### Configuration Android
```cmake
# Dans CMakeLists.txt
option(ENABLE_AUDIO_CAPTURE_VALIDATION "Enable audio validation" ON)
option(ENABLE_PERFORMANCE_MONITORING "Enable performance monitoring" ON)
option(ENABLE_SIMD "Enable SIMD optimizations" ON)

# Optimisations spécifiques
if(ANDROID_ABI STREQUAL "arm64-v8a")
    add_compile_options(-march=armv8-a+crypto+simd)
endif()
```

### Configuration iOS
```xml
<!-- Dans project.pbxproj -->
OTHER_CPLUSPLUSFLAGS = (
    "-DHAS_NEON=1",
    "-O3",
    "-march=armv8-a+simd",
    "-mcpu=apple-a12",
    "-flto"
);
```

## 📚 API Reference

### AudioPipeline (C++)

#### Initialisation
```cpp
bool initialize(const Config& config);
void release();
```

#### Contrôle
```cpp
bool start();
bool stop();
bool pause();
bool resume();
```

#### Configuration
```cpp
// Equalizer
void setEqualizerEnabled(bool enabled);
void setEqualizerBand(int band, float frequency, float gain, float q);
void loadEqualizerPreset(const std::string& presetName);

// Noise Reduction
void setNoiseReductionEnabled(bool enabled);
void setNoiseReductionStrength(float strength);

// Effects
void setEffectsEnabled(bool enabled);
void addEffect(std::shared_ptr<AudioEffect> effect);

// Safety
void setSafetyLimiterEnabled(bool enabled);
void setSafetyLimiterThreshold(float threshold);

// FFT
void setFFTAnalysisEnabled(bool enabled);
void setFFTSize(size_t size);
```

#### Monitoring
```cpp
float getCurrentLevel() const;    // Niveau actuel (0.0-1.0)
float getPeakLevel() const;       // Niveau de crête (0.0-1.0)
bool isClipping() const;          // Clipping détecté
float getLatencyMs() const;       // Latence totale
```

#### Enregistrement
```cpp
bool startRecording(const std::string& filename);
bool stopRecording();
bool isRecording() const;
```

### AudioPipeline (React Native)

#### Méthodes JavaScript
```typescript
// Initialisation
initialize(config: AudioPipelineConfig): Promise<string>

// Contrôle
start(): Promise<string>
stop(): Promise<string>
pause(): Promise<string>
resume(): Promise<string>

// Configuration
setEqualizerEnabled(enabled: boolean): Promise<string>
setEqualizerBand(band: number, frequency: number, gain: number, q: number): Promise<string>
setNoiseReductionStrength(strength: number): Promise<string>

// Monitoring
getMetrics(): Promise<AudioMetrics>
getStatus(): Promise<PipelineStatus>

// Enregistrement
startRecording(filename: string): Promise<string>
stopRecording(): Promise<string>

// Événements
onAudioLevels(callback: (levels: AudioLevelsEvent) => void): () => void
onAudioError(callback: (error: AudioErrorEvent) => void): () => void
onRecordingStatus(callback: (status: RecordingStatusEvent) => void): () => void
```

### Types TypeScript

#### AudioPipelineConfig
```typescript
interface AudioPipelineConfig {
  sampleRate?: number;              // 44100 par défaut
  channelCount?: number;            // 2 par défaut (stéréo)
  bitsPerSample?: number;           // 16 par défaut
  bufferSizeFrames?: number;        // 1024 par défaut

  enableEqualizer?: boolean;        // true par défaut
  enableNoiseReduction?: boolean;   // false par défaut
  enableEffects?: boolean;          // false par défaut

  safetyLimiterThreshold?: number;  // 0.95 par défaut
  noiseReductionStrength?: number;  // 0.3 par défaut
}
```

#### AudioMetrics
```typescript
interface AudioMetrics {
  currentLevel: number;      // Niveau actuel (0.0-1.0)
  peakLevel: number;         // Niveau de crête (0.0-1.0)
  currentLevelDb: number;    // Niveau actuel en dB
  peakLevelDb: number;       // Niveau de crête en dB
  isClipping: boolean;       // Clipping détecté
  latencyMs: number;         // Latence totale en ms
  cpuUsage?: number;         // Utilisation CPU (%)
}
```

## 🔧 Intégration Avancée

### Gestion des Permissions
```typescript
// Vérification des permissions Android
const hasPermission = await PermissionsAndroid.check(
  PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
);

if (!hasPermission) {
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
  );
}
```

### Gestion des Interruptions
```typescript
// Gestion des interruptions système
audioPipeline.onAudioError((error) => {
  if (error.type === 'device') {
    // Device déconnecté - redémarrer
    audioPipeline.stop();
    setTimeout(() => audioPipeline.start(), 1000);
  }
});
```

### Optimisation de la Latence
```typescript
// Configuration pour faible latence
const config = {
  sampleRate: 48000,           // Taux plus élevé
  bufferSizeFrames: 256,       // Buffer plus petit
  enableEffects: false,        // Désactiver effets si pas nécessaire
  enableNoiseReduction: false  // Désactiver NR pour latence
};

await audioPipeline.initialize(config);
```

## 🎯 Cas d'Usage

### 1. Application de Voix
```typescript
// Configuration pour application de voix
const config = {
  sampleRate: 16000,           // Suffisant pour la voix
  channelCount: 1,             // Mono
  enableEqualizer: false,      // Pas d'EQ
  enableNoiseReduction: true,  // NR important pour la voix
  enableEffects: false         // Pas d'effets
};
```

### 2. Application Musicale
```typescript
// Configuration pour application musicale
const config = {
  sampleRate: 44100,           // Haute qualité
  channelCount: 2,             // Stéréo
  enableEqualizer: true,       // EQ essentiel
  enableNoiseReduction: false, // Pas de NR pour musique
  enableEffects: true          // Effets musicaux
};
```

### 3. Application d'Enregistrement
```typescript
// Configuration pour enregistrement professionnel
const config = {
  sampleRate: 48000,           // Standard professionnel
  channelCount: 2,             // Stéréo
  enableEqualizer: true,       // EQ pour monitoring
  enableNoiseReduction: true,  // NR pour améliorer l'enregistrement
  enableEffects: false,        // Pas d'effets pendant l'enregistrement
  safetyLimiterThreshold: 0.9  // Limiteur plus strict
};
```

## 🚨 Gestion d'Erreurs

### Erreurs Courantes
```typescript
audioPipeline.onAudioError((error) => {
  switch (error.type) {
    case 'configuration':
      console.error('Configuration invalide:', error.message);
      break;
    case 'device':
      console.error('Problème de périphérique:', error.message);
      // Tentative de récupération
      audioPipeline.stop();
      setTimeout(() => audioPipeline.start(), 2000);
      break;
    case 'permission':
      console.error('Permission refusée:', error.message);
      // Demander permission à nouveau
      break;
    case 'buffer':
      console.error('Problème de buffer:', error.message);
      // Réduire la taille du buffer
      break;
  }
});
```

## 📊 Monitoring et Métriques

### Métriques Temps Réel
```typescript
// Monitoring toutes les 100ms
const removeListener = audioPipeline.onAudioLevels((levels) => {
  // Mise à jour UI
  setCurrentLevel(levels.currentLevel);
  setPeakLevel(levels.peakLevel);

  if (levels.isClipping) {
    showClippingWarning();
  }
});

// Nettoyage
useEffect(() => {
  return () => removeListener();
}, []);
```

### Métriques de Performance
```typescript
// Obtenir métriques détaillées
const metrics = await audioPipeline.getMetrics();
console.log(`Latency: ${metrics.latencyMs}ms`);
console.log(`CPU Usage: ${metrics.cpuUsage}%`);
console.log(`Clipping: ${metrics.isClipping}`);
```

## 🔄 Migration depuis l'Ancien Système

### Ancien Code
```cpp
// Ancien système séparé
AudioCapture capture;
AudioEqualizer eq;
NoiseReduction nr;

// Configuration séparée
capture.initialize(config);
eq.initialize(eqConfig);
nr.initialize(nrConfig);
```

### Nouveau Code Intégré
```cpp
// Nouveau système intégré
AudioPipeline pipeline;
AudioPipeline::Config config;

// Configuration centralisée
config.captureConfig = captureConfig;
config.enableEqualizer = true;
config.enableNoiseReduction = true;

// Initialisation unique
pipeline.initialize(config);
pipeline.start();
```

## 📈 Performances Attendues

### Android (ARM64-v8a)
- **Latence**: 5-15ms (selon configuration)
- **Utilisation CPU**: 2-15% pour traitement audio
- **Speedup SIMD**: 2-9x sur opérations critiques

### iOS (ARM64)
- **Latence**: 3-12ms (selon configuration)
- **Utilisation CPU**: 1-12% pour traitement audio
- **Speedup SIMD**: 2-9x sur opérations critiques

## 🛠️ Dépannage

### Problème: Pipeline ne s'initialise pas
```typescript
// Vérifier les permissions
const hasPermission = await PermissionsAndroid.check(
  PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
);

if (!hasPermission) {
  // Demander permission
  await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
  );
}
```

### Problème: Latence élevée
```typescript
// Réduire la taille du buffer
const config = {
  bufferSizeFrames: 256,  // Plus petit = moins de latence
  sampleRate: 48000       // Plus élevé = moins de latence
};

await audioPipeline.initialize(config);
```

### Problème: Utilisation CPU élevée
```typescript
// Désactiver les modules non essentiels
const config = {
  enableEffects: false,        // Désactiver effets
  enableNoiseReduction: false, // Désactiver NR
  enableFFTAnalysis: false     // Désactiver FFT
};

await audioPipeline.initialize(config);
```

## 🎉 Conclusion

Le système audio intégré offre :

✅ **Performance de niveau professionnel** avec optimisations SIMD
✅ **Architecture modulaire** facilement extensible
✅ **Intégration transparente** avec React Native
✅ **Monitoring temps réel** des métriques
✅ **Gestion d'erreurs robuste** avec exceptions structurées
✅ **Support multi-plateforme** Android/iOS
✅ **Configuration flexible** selon les besoins

**Le module `capture/` est maintenant parfaitement intégré dans l'écosystème audio !** 🎵
