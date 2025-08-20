# Module Égaliseur Audio Professionnel

Ce module fournit un égaliseur audio professionnel complet avec réduction de bruit, sécurité audio et effets créatifs.

## Installation

Le module utilise un module natif C++ (`NativeAudioEqualizerModule`) qui doit être correctement lié dans votre projet React Native.

## Utilisation de base

```tsx
import { Equalizer } from './equalizer';

function MyComponent() {
  return (
    <Equalizer 
      numBands={10}           // Nombre de bandes (par défaut: 10)
      sampleRate={48000}      // Fréquence d'échantillonnage (par défaut: 48000)
      showSpectrum={true}     // Afficher l'analyseur de spectre
      onConfigChange={(config) => {
        console.log('Configuration:', config);
      }}
    />
  );
}
```

## Utilisation avancée

Pour accéder à toutes les fonctionnalités (réduction de bruit, sécurité audio, effets):

```tsx
import { AdvancedEqualizer } from './equalizer';

function MyComponent() {
  return <AdvancedEqualizer />;
}
```

## Hooks disponibles

### useEqualizer
Gère l'égaliseur principal avec les bandes de fréquence.

```tsx
const {
  isInitialized,
  enabled,
  masterGain,
  bands,
  isProcessing,
  toggleEnabled,
  setBandGain,
  updateMasterGain,
  resetAllBands,
  updateAllBandGains,
  getConfig
} = useEqualizer(numBands, sampleRate);
```

### useNoiseReduction
Contrôle la réduction de bruit avec deux modes: expander et RNNoise.

```tsx
const {
  isEnabled,
  mode,
  rnnoiseAggressiveness,
  config,
  toggleEnabled,
  changeMode,
  setAggressiveness,
  updateConfig
} = useNoiseReduction();
```

### useAudioSafety
Surveille et protège contre les problèmes audio (écrêtage, DC offset, feedback).

```tsx
const {
  config,
  report,
  updateConfig,
  fetchReport,
  getMetrics
} = useAudioSafety(pollInterval);
```

### useAudioEffects
Gère les effets créatifs (compresseur et delay).

```tsx
const {
  isEnabled,
  compressor,
  delay,
  toggleEnabled,
  updateCompressor,
  updateDelay,
  resetEffects
} = useAudioEffects();
```

### useEqualizerPresets
Gère les presets d'égaliseur (intégrés et personnalisés).

```tsx
const {
  presets,
  currentPreset,
  isLoading,
  applyPreset,
  saveCustomPreset,
  deleteCustomPreset,
  getPresetGains,
  isCustomPreset
} = useEqualizerPresets();
```

### useSpectrumData
Fournit les données d'analyse spectrale en temps réel.

```tsx
const {
  isAnalyzing,
  spectrumData,
  startAnalysis,
  stopAnalysis,
  toggleAnalysis,
  getMetrics
} = useSpectrumData({
  updateInterval: 50,      // ms
  smoothingFactor: 0.8,    // 0-1
  minDecibels: -60,
  maxDecibels: 0
});
```

## Composants

### EqualizerBand
Contrôle individuel pour chaque bande de fréquence.

### PresetSelector
Sélecteur de presets avec support pour les presets personnalisés.

### SpectrumAnalyzer
Visualisation en temps réel du spectre audio.

## Types

```typescript
interface BandConfig {
  frequency: number;
  gain: number;
  q: number;
  type: FilterType;
  enabled: boolean;
}

interface EqualizerPreset {
  name: string;
  gains: number[];
}

interface NoiseReductionConfig {
  enabled: boolean;
  mode: 'expander' | 'rnnoise' | 'off';
  rnnoiseAggressiveness: number;
  highPassEnabled: boolean;
  highPassHz: number;
  thresholdDb: number;
  ratio: number;
  floorDb: number;
  attackMs: number;
  releaseMs: number;
}

interface AudioSafetyConfig {
  enabled: boolean;
  dcRemovalEnabled: boolean;
  dcThreshold: number;
  limiterEnabled: boolean;
  limiterThresholdDb: number;
  softKneeLimiter: boolean;
  kneeWidthDb: number;
  feedbackDetectEnabled: boolean;
  feedbackCorrThreshold: number;
}
```

## Presets intégrés

- **Flat**: Toutes les bandes à 0 dB
- **Rock**: Accentue les basses et les aigus
- **Pop**: Boost des médiums pour la voix
- **Jazz**: Doux avec des médiums chauds
- **Classical**: Léger et équilibré
- **Electronic**: Fort dans les basses avec présence
- **Vocal Boost**: Met en avant les fréquences vocales
- **Bass Boost**: Accentue les basses fréquences
- **Treble Boost**: Accentue les hautes fréquences
- **Loudness**: Courbe de compensation loudness

## Intégration native

Le module s'appuie sur `NativeAudioEqualizerModule` qui expose l'API C++ suivante:

- Gestion des instances d'égaliseur
- Traitement audio temps réel
- Contrôle des bandes (gain, fréquence, Q, type)
- Gestion des presets
- Analyse spectrale
- Réduction de bruit (expander/RNNoise)
- Sécurité audio (limiteur, DC removal, détection feedback)
- Effets créatifs (compresseur, delay)

L'API C globale est disponible pour l'intégration avec les enregistreurs audio natifs iOS/Android.
