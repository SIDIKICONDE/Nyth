import { TurboModule, TurboModuleRegistry } from 'react-native';

// === Types d'effets ===
export type EffectType = 'compressor' | 'delay';

export type EffectsState =
  | 'uninitialized'
  | 'initialized'
  | 'processing'
  | 'error';

// === Types de configuration ===

export interface CompressorConfig {
  thresholdDb?: number; // Seuil de compression en dB (-60 à 0)
  ratio?: number;       // Ratio de compression (1.0 à 20.0)
  attackMs?: number;    // Temps d'attaque en ms (0.1 à 100)
  releaseMs?: number;   // Temps de relâchement en ms (10 à 1000)
  makeupDb?: number;    // Gain de compensation en dB (-20 à 20)
}

export interface DelayConfig {
  delayMs?: number;   // Délai en ms (0.1 à 2000)
  feedback?: number;  // Feedback (0.0 à 0.99)
  mix?: number;       // Mixage (0.0 à 1.0)
}

export interface EffectConfig {
  type: EffectType;
  enabled?: boolean;      // Activation de l'effet
  sampleRate?: number;    // Taux d'échantillonnage
  channels?: number;      // Nombre de canaux
  compressor?: CompressorConfig; // Configuration spécifique au compresseur
  delay?: DelayConfig;    // Configuration spécifique au délai
}

// === Types de statistiques ===

export interface EffectsStatistics {
  inputLevel: number;       // Niveau d'entrée (0.0 à 1.0)
  outputLevel: number;      // Niveau de sortie (0.0 à 1.0)
  processedFrames: number;  // Nombre de frames traitées
  processedSamples: number; // Nombre d'échantillons traités
  durationMs: number;       // Durée de traitement en ms
  activeEffectsCount: number; // Nombre d'effets actifs
}

// === Types d'effets individuels ===

export interface EffectInfo {
  effectId: number;     // ID unique de l'effet
  type: EffectType;     // Type d'effet
  enabled: boolean;     // État d'activation
  sampleRate: number;   // Taux d'échantillonnage
  channels: number;     // Nombre de canaux
  compressor?: CompressorConfig; // Configuration compresseur
  delay?: DelayConfig;  // Configuration délai
}

// === Callbacks types ===

export type AudioDataCallback = (
  input: number[],
  output: number[],
  frameCount: number,
  channels: number,
) => void;

export type ErrorCallback = (error: string) => void;

export type StateChangeCallback = (
  oldState: EffectsState,
  newState: EffectsState,
) => void;

// === Interface du module ===

export interface Spec extends TurboModule {
  // === Gestion du cycle de vie ===

  // Initialise le système d'effets
  readonly initialize: () => boolean;

  // Démarre le traitement audio
  readonly start: () => boolean;

  // Arrête le traitement audio
  readonly stop: () => boolean;

  // Libère toutes les ressources
  readonly dispose: () => void;

  // === État et informations ===

  // Obtient l'état actuel du système d'effets
  readonly getState: () => EffectsState;

  // Obtient les statistiques du système d'effets
  readonly getStatistics: () => EffectsStatistics | null;

  // Réinitialise les statistiques
  readonly resetStatistics: () => void;

  // === Gestion des effets individuels ===

  // Crée un nouvel effet avec la configuration spécifiée
  readonly createEffect: (config: EffectConfig) => number; // Retourne l'effectId ou -1 en cas d'erreur

  // Détruit un effet spécifique
  readonly destroyEffect: (effectId: number) => boolean;

  // Met à jour la configuration d'un effet
  readonly updateEffect: (effectId: number, config: EffectConfig) => boolean;

  // Obtient la configuration d'un effet
  readonly getEffectConfig: (effectId: number) => EffectInfo | null;

  // === Contrôle des effets ===

  // Active/désactive un effet spécifique
  readonly enableEffect: (effectId: number, enabled: boolean) => boolean;

  // Vérifie si un effet est activé
  readonly isEffectEnabled: (effectId: number) => boolean;

  // Obtient le nombre d'effets actifs
  readonly getActiveEffectsCount: () => number;

  // Obtient la liste des IDs d'effets actifs
  readonly getActiveEffectIds: () => number[];

  // === Configuration des effets spécifiques ===

  // Configuration du compresseur
  readonly setCompressorParameters: (
    effectId: number,
    thresholdDb: number,
    ratio: number,
    attackMs: number,
    releaseMs: number,
    makeupDb: number,
  ) => boolean;

  readonly getCompressorParameters: (effectId: number) => CompressorConfig | null;

  // Configuration du délai
  readonly setDelayParameters: (
    effectId: number,
    delayMs: number,
    feedback: number,
    mix: number,
  ) => boolean;

  readonly getDelayParameters: (effectId: number) => DelayConfig | null;

  // === Traitement audio ===

  // Traite un buffer audio mono ou stéréo entrelacé
  readonly processAudio: (
    input: number[],
    channels: number,
  ) => number[] | null;

  // Traite des buffers audio stéréo séparés
  readonly processAudioStereo: (
    inputL: number[],
    inputR: number[],
  ) => { left: number[]; right: number[] } | null;

  // === Analyse audio ===

  // Obtient le niveau d'entrée actuel
  readonly getInputLevel: () => number;

  // Obtient le niveau de sortie actuel
  readonly getOutputLevel: () => number;

  // === Callbacks JavaScript ===

  // Définit le callback pour recevoir les données audio traitées
  readonly setAudioDataCallback: (callback: AudioDataCallback) => void;

  // Définit le callback pour les erreurs
  readonly setErrorCallback: (callback: ErrorCallback) => void;

  // Définit le callback pour les changements d'état
  readonly setStateChangeCallback: (callback: StateChangeCallback) => void;

  // === Installation du module (pour JSI direct) ===

  // Installe le module directement dans le runtime JSI
  readonly install?: () => void;
}

// Export du module
export default TurboModuleRegistry.getEnforcing<Spec>(
  'NativeAudioEffectsModule',
);
