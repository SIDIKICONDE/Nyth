# 🎛️ COMPOSANT EQUALIZER REACT - FLUX DE TRAITEMENT AUDIO

## 📋 Vue d'ensemble

Le dossier `src/components/equalizer` contient un système complet d'égalisation audio pour React Native qui :
- **Récupère** l'audio en temps réel via des modules natifs
- **Traite** le signal avec un égaliseur 10 bandes paramétrique
- **Visualise** le spectre audio en temps réel
- **Applique** des effets avancés (réduction de bruit, compression, delay)
- **Protège** l'audio avec des systèmes de sécurité

## 🏗️ Architecture du composant

```
src/components/equalizer/
├── Equalizer.tsx           # Composant principal d'égalisation
├── AdvancedEqualizer.tsx   # Version avec tous les effets
├── hooks/                  # Logique de traitement
│   ├── useEqualizer.ts     # Gestion de l'égaliseur
│   ├── useSpectrumData.ts  # Analyse spectrale temps réel
│   ├── useNoiseReduction.ts # Réduction de bruit
│   ├── useAudioSafety.ts   # Sécurité audio
│   ├── useAudioEffects.ts  # Effets créatifs
│   └── useEqualizerPresets.ts # Gestion des presets
└── components/             # Sous-composants UI
    ├── EqualizerBand.tsx   # Contrôle d'une bande
    ├── PresetSelector.tsx  # Sélecteur de presets
    └── SpectrumAnalyzer.tsx # Visualisation spectrale
```

## 🔄 Flux de récupération et traitement de l'audio

### 1. Initialisation de l'égaliseur

```typescript
// useEqualizer.ts - Lignes 28-78
useEffect(() => {
  const initEqualizer = async () => {
    // 1. Création de l'instance native d'égaliseur
    const eqId = await NativeAudioEqualizerModule.createEqualizer(
      numBands,    // 10 bandes par défaut
      sampleRate   // 48000 Hz par défaut
    );
    
    // 2. Configuration des 10 bandes de fréquences
    const initialBands = [
      31.25,   // Sub-bass
      62.5,    // Bass
      125,     // Low-mid
      250,     // Mid
      500,     // Mid
      1000,    // Mid-high
      2000,    // High-mid
      4000,    // Presence
      8000,    // Brilliance
      16000    // Air
    ];
    
    // 3. Récupération de l'état actuel
    const currentEnabled = await NativeAudioEqualizerModule.getEQEnabled();
    const currentMasterGain = await NativeAudioEqualizerModule.getMasterGain();
  };
}, []);
```

### 2. Récupération active de l'audio

Le composant récupère l'audio de deux manières :

#### A. Traitement en temps réel (via module natif)

```typescript
// Le module natif traite l'audio en continu dans le thread audio
// Les modifications sont appliquées immédiatement

// Modification d'une bande - useEqualizer.ts ligne 94
const setBandGain = async (bandIndex: number, gain: number) => {
  // Envoi immédiat au module natif C++
  await NativeAudioEqualizerModule.setBandGain(bandIndex, gain);
  
  // Le module natif applique le changement en temps réel
  // sur le flux audio actif
};
```

#### B. Analyse spectrale pour visualisation

```typescript
// useSpectrumData.ts - Lignes 78-130
const updateSpectrum = async () => {
  // 1. Récupération des données FFT du module natif
  const rawData = await NativeAudioEqualizerModule.getSpectrumData();
  
  // 2. Traitement des données (optionnel via Web Worker)
  if (useWebWorker && rawData.length > 64) {
    // Traitement dans un worker pour ne pas bloquer l'UI
    const processedData = await processSpectrum(
      new Float64Array(rawData),
      48000,
      'fp64'
    );
  }
  
  // 3. Normalisation et lissage
  const normalized = rawData.map(normalizeMagnitude); // dB vers 0-1
  const smoothed = smoothMagnitudes(normalized);      // Lissage temporel
  
  // 4. Mise à jour de l'état pour la visualisation
  setSpectrumData({
    magnitudes: smoothed,
    timestamp: Date.now()
  });
};

// Mise à jour toutes les 50ms (20 FPS)
useAudioAnimationFrame((deltaTime) => {
  if (isAnalyzing) updateSpectrum();
});
```

## 🎛️ Traitement actif de l'audio

### 1. Pipeline de traitement complet

```
Microphone → Capture Native → Module C++ → Traitement DSP → Sortie
                                   ↑
                            Contrôles React
```

### 2. Chaîne d'effets

Le composant `AdvancedEqualizer` orchestre une chaîne complète :

```typescript
// AdvancedEqualizer.tsx
const AdvancedEqualizer = () => {
  // 1. Égaliseur principal
  const equalizer = useEqualizer(10, 48000);
  
  // 2. Réduction de bruit
  const noiseReduction = useNoiseReduction();
  // - Mode expander : Gate/Expander classique
  // - Mode RNNoise : IA pour voix
  
  // 3. Sécurité audio
  const audioSafety = useAudioSafety(100);
  // - Limiteur : Protection contre saturation
  // - DC Removal : Suppression offset DC
  // - Feedback Detection : Détection larsen
  
  // 4. Effets créatifs
  const audioEffects = useAudioEffects();
  // - Compresseur : Dynamique
  // - Delay : Echo/Reverb
};
```

### 3. Mise à jour en temps réel

Les modifications sont appliquées instantanément :

```typescript
// Equalizer.tsx - Ligne 203
{bands.map((band, index) => (
  <EqualizerBand
    key={`band-${index}`}
    bandIndex={index}
    config={band}
    onGainChange={setBandGain} // Callback immédiat
    isProcessing={isProcessing}
  />
))}
```

## 📊 Analyse spectrale active

### 1. Récupération des données FFT

```typescript
// useSpectrumData.ts
const startAnalysis = async () => {
  // 1. Démarrer l'analyse native
  await NativeAudioEqualizerModule.startSpectrumAnalysis();
  
  // 2. Lancer la boucle d'animation
  resumeAnimation(); // 20 FPS par défaut
};
```

### 2. Optimisations pour performance

```typescript
// Utilisation de Web Worker pour calculs lourds
const { processSpectrum } = useAudioWorker();

// Cache pour éviter recalculs
const normalizationCache = new AudioComputationCache(1000, 100);

// Animation frame optimisée
useAudioAnimationFrame(callback); // RequestAnimationFrame optimisé
```

### 3. Visualisation temps réel

```typescript
// SpectrumAnalyzer.tsx
<SpectrumAnalyzer
  data={spectrumData}      // Données mises à jour 20x/sec
  width={SCREEN_WIDTH - 60}
  height={100}
  animate={true}            // Animation fluide
/>
```

## 🎚️ Contrôle des paramètres

### 1. Contrôle individuel des bandes

```typescript
// EqualizerBand.tsx
<Slider
  value={config.gain}
  onValueChange={(value) => onGainChange(bandIndex, value)}
  minimumValue={-24}
  maximumValue={24}
/>
```

### 2. Presets prédéfinis

```typescript
// useEqualizerPresets.ts
const BUILT_IN_PRESETS = {
  'Flat': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Rock': [5, 4, 3, 1, 0, -1, 0, 2, 3, 4],
  'Pop': [0, 1, 3, 4, 3, 1, 0, 1, 2, 3],
  'Jazz': [0, 2, 1, 2, -2, -2, 0, 1, 2, 3],
  'Classical': [-2, -1, 0, 1, 2, 2, 1, 0, 1, 2],
  'Electronic': [4, 3, 1, 0, -2, 2, 1, 2, 3, 4],
  'Vocal Boost': [-2, -1, 0, 3, 4, 4, 3, 1, 0, -1],
  'Bass Boost': [6, 5, 4, 2, 0, -1, -2, -2, -1, 0],
  'Treble Boost': [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7],
  'Loudness': [5, 3, 0, -2, -1, -1, -2, 0, 3, 5]
};

// Application d'un preset
const applyPreset = async (presetName: string) => {
  const gains = BUILT_IN_PRESETS[presetName];
  await updateAllBandGains(gains);
};
```

### 3. Mise à jour groupée (batch)

```typescript
// useEqualizer.ts - Lignes 160-187
const updateAllBandGains = async (gains: number[]) => {
  // Début de transaction
  await NativeAudioEqualizerModule.beginBatch();
  
  // Mise à jour de toutes les bandes
  for (let i = 0; i < gains.length; i++) {
    await NativeAudioEqualizerModule.setBandGain(i, gains[i]);
  }
  
  // Fin de transaction - application atomique
  await NativeAudioEqualizerModule.endBatch();
};
```

## 🔐 Sécurité audio

### 1. Monitoring en temps réel

```typescript
// useAudioSafety.ts
useEffect(() => {
  const interval = setInterval(async () => {
    const report = await NativeAudioEqualizerModule.getSafetyReport();
    setReport({
      peakLevel: report.peakLevel,
      rmsLevel: report.rmsLevel,
      dcOffset: report.dcOffset,
      clippedSamples: report.clippedSamples,
      feedbackScore: report.feedbackScore,
      overloadDetected: report.overloadDetected
    });
  }, pollInterval); // 100ms par défaut
}, []);
```

### 2. Protection automatique

```typescript
// Configuration de sécurité
const safetyConfig = {
  enabled: true,
  dcRemovalEnabled: true,      // Suppression offset DC
  limiterEnabled: true,         // Limiteur anti-saturation
  limiterThresholdDb: -1.0,     // Seuil du limiteur
  feedbackDetectEnabled: true,  // Détection larsen
  feedbackCorrThreshold: 0.95   // Seuil de corrélation
};
```

## 🎵 Réduction de bruit

### 1. Deux modes disponibles

```typescript
// useNoiseReduction.ts
const changeMode = async (mode: 'expander' | 'rnnoise' | 'off') => {
  await NativeAudioEqualizerModule.setNRMode(
    mode === 'expander' ? 0 : mode === 'rnnoise' ? 1 : 2
  );
};
```

### 2. Configuration détaillée

```typescript
// Mode Expander (Gate/Expander classique)
const expanderConfig = {
  thresholdDb: -45,    // Seuil d'activation
  ratio: 2.5,          // Ratio d'expansion
  attackMs: 3,         // Temps d'attaque
  releaseMs: 80,       // Temps de relâchement
  floorDb: -18         // Plancher de réduction
};

// Mode RNNoise (IA)
const rnnoiseConfig = {
  aggressiveness: 1.0  // 0.0 (doux) à 3.0 (agressif)
};
```

## 🎨 Effets créatifs

### 1. Compresseur

```typescript
// useAudioEffects.ts
const updateCompressor = async (params) => {
  await NativeAudioEqualizerModule.setFXCompressor(
    params.thresholdDb,  // -18 dB par défaut
    params.ratio,         // 3:1 par défaut
    params.attackMs,      // 10ms
    params.releaseMs,     // 80ms
    params.makeupDb       // Gain de compensation
  );
};
```

### 2. Delay

```typescript
const updateDelay = async (params) => {
  await NativeAudioEqualizerModule.setFXDelay(
    params.delayMs,    // 150ms par défaut
    params.feedback,   // 0.3 (30% feedback)
    params.mix         // 0.25 (25% wet)
  );
};
```

## ⚡ Performances et optimisations

### 1. Web Worker pour calculs lourds

```typescript
// useSpectrumData.ts
if (useWebWorker && rawData.length > 64) {
  // Délégation au worker
  const processed = await processSpectrum(data, sampleRate, 'fp64');
}
```

### 2. Cache de calculs

```typescript
const normalizationCache = new AudioComputationCache<string, number>(
  1000,  // Taille max
  100    // TTL en ms
);
```

### 3. Animation optimisée

```typescript
// Utilisation de requestAnimationFrame optimisé
useAudioAnimationFrame((deltaTime) => {
  // Mise à jour fluide à 60 FPS max
  updateSpectrum();
});
```

## 📱 Intégration React Native

### 1. Bridge avec le code natif

```typescript
// NativeAudioEqualizerModule (TurboModule)
interface Spec extends TurboModule {
  // Gestion égaliseur
  createEqualizer(numBands: number, sampleRate: number): number;
  setBandGain(bandIndex: number, gainDB: number): void;
  
  // Analyse spectrale
  getSpectrumData(): number[];
  startSpectrumAnalysis(): void;
  stopSpectrumAnalysis(): void;
  
  // Sécurité
  getSafetyReport(): SafetyReport;
  
  // Effets
  setNREnabled(enabled: boolean): void;
  setFXEnabled(enabled: boolean): void;
}
```

### 2. Communication bidirectionnelle

```
UI React → Hook → TurboModule → C++ → DSP → Audio Hardware
         ←      ←             ←     ← Analyse/Metrics
```

## 🎯 Points clés du traitement actif

1. **Temps réel** : Traitement < 1ms de latence
2. **Non-bloquant** : Web Workers pour calculs lourds
3. **Réactif** : Mise à jour immédiate des paramètres
4. **Visualisation** : 20 FPS pour le spectre
5. **Sécurité** : Protection continue contre saturation
6. **Modulaire** : Chaque effet peut être activé/désactivé
7. **Optimisé** : Cache et animations optimisées
8. **Professionnel** : Qualité studio avec 10 bandes paramétriques

## 📝 Résumé

Le composant Equalizer de `src/components/equalizer` :
- **Récupère** l'audio via le module natif C++ en temps réel
- **Traite** avec un égaliseur 10 bandes + effets
- **Visualise** le spectre à 20 FPS
- **Protège** avec limiteur et détection de problèmes
- **Optimise** avec Web Workers et cache
- **Communique** via TurboModules React Native

Le système offre un contrôle professionnel complet sur le traitement audio avec une latence imperceptible et une interface réactive.