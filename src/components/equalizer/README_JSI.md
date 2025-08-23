# 🎵 Module Equalizer Audio Professionnel - JSI Connecté

Ce document explique comment utiliser le module Equalizer avec les vrais modules JSI natifs connectés.

## ✅ État Actuel

**TOUS LES MODULES JSI SONT MAINTENANT CONNECTÉS ET FONCTIONNELS !**

### 🔗 Modules JSI Connectés

| Module | État | Fonctionnalités |
|--------|------|-----------------|
| ✅ **NativeAudioCoreModule** | Connecté | Égaliseur 10 bandes, filtres biquad, presets |
| ✅ **NativeAudioEffectsModule** | Connecté | Compresseur, delay, chaîne d'effets |
| ✅ **NativeAudioNoiseModule** | Connecté | Réduction de bruit avancée (RNNoise, IMCRA, Wiener) |
| ✅ **NativeAudioSafetyModule** | Connecté | Limiteur, DC removal, détection feedback |
| ✅ **NativeAudioUtilsModule** | Connecté | Utilitaires SIMD, gestion mémoire |
| ✅ **NativeAudioPipelineModule** | Connecté | Pipeline complet orchestrateur |
| ✅ **NativeAudioCaptureModule** | Connecté | Capture audio temps réel |

## 🚀 Utilisation Rapide

### Import des Modules

```tsx
import {
  Equalizer,
  AdvancedEqualizer,
  useEqualizer,
  useNoiseReduction,
  useAudioSafety,
  useAudioEffects,
  // Modules JSI directs
  NativeAudioCoreModule,
  NativeAudioEffectsModule,
  NativeAudioNoiseModule
} from './components/equalizer';
```

### Égaliseur Simple

```tsx
function MyAudioApp() {
  return (
    <Equalizer
      numBands={10}
      sampleRate={48000}
      showSpectrum={true}
      onConfigChange={(config) => {
        console.log('Configuration:', config);
      }}
    />
  );
}
```

### Égaliseur Avancé avec Tous les Modules

```tsx
function ProAudioApp() {
  return <AdvancedEqualizer />;
}
```

### Utilisation Directe des Modules JSI

```tsx
// Utilisation directe du module core
const success = await NativeAudioCoreModule.initialize();
const equalizerConfig = {
  numBands: 10,
  sampleRate: 48000,
  masterGainDB: 0.0,
  bypass: false
};
await NativeAudioCoreModule.equalizerInitialize(equalizerConfig);

// Configuration d'une bande
await NativeAudioCoreModule.equalizerSetBand(0, {
  bandIndex: 0,
  frequency: 100.0,
  gainDB: 6.0,
  q: 0.707,
  type: 'peak'
});
```

## 🎛️ Fonctionnalités Disponibles

### Égaliseur Principal (NativeAudioCoreModule)
- **10 bandes de fréquence** (31Hz - 16kHz)
- **Types de filtres** : Peak, LowShelf, HighShelf, LowPass, HighPass, BandPass, Notch, AllPass
- **Gain master** : ±24dB
- **Presets intégrés** : Flat, Rock, Pop, Jazz, Classical, Electronic, etc.
- **Presets personnalisés** : Sauvegarde et chargement

### Réduction de Bruit Avancée (NativeAudioNoiseModule)
- **Modes standards** : Expander, RNNoise
- **Modes avancés** : IMCRA, Wiener MMSE-LSA, Two-Step, Multiband
- **Contrôle d'agressivité** : 0.0 - 3.0
- **Filtrage passe-haut** : Fréquence configurable
- **Métriques temps réel** : SNR, bins de bruit/parole

### Sécurité Audio (NativeAudioSafetyModule)
- **Limiteur intelligent** : Seuil configurable, knee souple
- **Suppression DC** : Seuil ajustable
- **Détection de feedback** : Avec seuil de corrélation
- **Métriques temps réel** : Peak, RMS, headroom, crête
- **Protection contre écrêtage**

### Effets Créatifs (NativeAudioEffectsModule)
- **Compresseur** : Seuil, ratio, attaque/relâchement
- **Delay** : Délai, feedback, mix
- **Chaîne d'effets** : Gestion de l'ordre et des paramètres
- **Bypass individuel** : Activation/désactivation par effet

### Pipeline Audio (NativeAudioPipelineModule)
- **Orchestration complète** : Capture → Égaliseur → Réduction Bruit → Effets → Sécurité
- **Configuration globale** : Activation/désactivation des modules
- **Métriques de performance** : CPU, latence, état des modules
- **Contrôle de workflow** : Start, stop, pause, resume

### Capture Audio (NativeAudioCaptureModule)
- **Capture temps réel** : Multi-périphériques
- **Configuration flexible** : Sample rate, canaux, format
- **Permissions** : Gestion iOS/Android
- **Enregistrement** : WAV avec métadonnées
- **Analyse audio** : RMS, peak, niveaux temps réel

## 🔧 Architecture Technique

### Hiérarchie des Modules

```
📱 React Native (JavaScript/TypeScript)
    ↕️ JSI Bridge
🧠 Modules JSI (C++)
    ↕️ C++ Core Audio
🎵 Audio Processing (C++17 + SIMD)
```

### Communication JSI

- **Synchronisation** : Méthodes bloquantes pour contrôle précis
- **Asynchrone** : Callbacks pour données audio temps réel
- **Types sûrs** : Conversion automatique JS ↔ C++
- **Performance** : Pas de sérialisation JSON

### Gestion Mémoire

- **Pools de mémoire** : Allocation temps réel optimisée
- **Gestion automatique** : RAII et smart pointers
- **Cache intelligent** : Calculs audio mis en cache
- **SIMD optimisé** : ARM NEON, x86 SSE/AVX

## 🎯 Cas d'Utilisation

### 1. Application Audio Simple
```tsx
<Equalizer numBands={5} showSpectrum={false} />
```

### 2. Application DJ/Production
```tsx
<AdvancedEqualizer />
// + utilisation directe des modules JSI pour contrôle avancé
```

### 3. Application de Voix/Vidéo
```tsx
// Pipeline complet avec réduction de bruit et sécurité
const pipelineConfig = {
  enableCapture: true,
  enableEqualizer: true,
  enableNoiseReduction: true,
  enableEffects: false,
  enableSafetyLimiter: true
};
await NativeAudioPipelineModule.initialize(pipelineConfig);
```

### 4. Application Scientifique/Audio Pro
```tsx
// Contrôle granulaire avec métriques temps réel
const core = NativeAudioCoreModule;
const safety = NativeAudioSafetyModule;

// Configuration avancée
await core.initialize();
await safety.initialize();

// Callbacks pour monitoring
safety.setMetricsCallback((metrics) => {
  console.log('Safety metrics:', metrics);
});
```

## ⚡ Performance

### Métriques Attendues
- **Latence** : < 5ms (faible latence), < 10ms (haute qualité)
- **CPU** : 5-15% sur mobile moderne
- **Mémoire** : < 50MB pour pipeline complet
- **Batterie** : Optimisé pour usage prolongé

### Optimisations
- **SIMD** : Accélération vectorielle activée
- **Cache** : Calculs fréquents mis en cache
- **Threading** : Traitement audio sur thread séparé
- **Batch processing** : Opérations groupées

## 🔧 Dépannage

### Problèmes Courants

#### Module non disponible
```tsx
if (!NativeAudioCoreModule) {
  console.error('NativeAudioCoreModule not linked');
  // Retour aux mocks ou message d'erreur
}
```

#### Erreur d'initialisation
```tsx
try {
  const success = await NativeAudioCoreModule.initialize();
  if (!success) {
    throw new Error('Failed to initialize core module');
  }
} catch (error) {
  console.error('Initialization error:', error);
  // Fallback ou message utilisateur
}
```

#### Permissions audio
```tsx
const hasPermission = await NativeAudioCaptureModule.hasPermission();
if (!hasPermission) {
  const granted = await NativeAudioCaptureModule.requestPermission();
  if (!granted) {
    // Gérer le refus de permission
  }
}
```

## 📚 Migration depuis Mocks

### Avant (Mocks)
```tsx
// Utilisait des mocks pour les tests
const { enabled, bands } = useEqualizer(10, 48000);
```

### Maintenant (JSI Réel)
```tsx
// Utilise les vrais modules C++ natifs
const { enabled, bands } = useEqualizer(10, 48000);

// Accès direct au module natif si nécessaire
await NativeAudioCoreModule.equalizerSetMasterGain(6.0);
```

## 🎉 Avantages de l'Intégration JSI

1. **Performance native** : Traitement audio optimisé C++
2. **Pas de bridge** : Communication directe JS ↔ C++
3. **SIMD activé** : Accélération vectorielle
4. **Mémoire optimisée** : Gestion C++ avancée
5. **Temps réel** : Latence minimale
6. **Fonctionnalités avancées** : Algorithmes pro disponibles

---

**🎵 Le module Equalizer est maintenant complètement fonctionnel avec tous les modules JSI natifs connectés !**
