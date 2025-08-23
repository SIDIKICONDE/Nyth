import { TurboModule, TurboModuleRegistry } from 'react-native';

// === Types d'algorithmes ===
export type NoiseAlgorithm =
  | 'spectral_subtraction'
  | 'wiener_filter'
  | 'multiband'
  | 'two_step'
  | 'hybrid'
  | 'advanced_spectral';

export type NoiseEstimationMethod =
  | 'simple'
  | 'mcra'
  | 'imcra';

export type NoiseState =
  | 'uninitialized'
  | 'initialized'
  | 'processing'
  | 'error';

// === Types de configuration ===

export interface NoiseConfig {
  algorithm?: NoiseAlgorithm;
  noiseMethod?: NoiseEstimationMethod;
  sampleRate?: number;
  channels?: number;
  fftSize?: number;
  hopSize?: number;
  aggressiveness?: number; // 0.0 - 3.0
  enableMultiband?: boolean;
  preserveTransients?: boolean;
  reduceMusicalNoise?: boolean;
  advanced?: {
    beta?: number;
    floorGain?: number;
    noiseUpdateRate?: number;
    speechThreshold?: number;
    transientThreshold?: number;
  };
}

export interface IMCRAConfig {
  fftSize?: number;
  sampleRate?: number;
  alphaS?: number;
  alphaD?: number;
  alphaD2?: number;
  betaMax?: number;
  gamma0?: number;
  gamma1?: number;
  zeta0?: number;
  windowLength?: number;
  subWindowLength?: number;
}

export interface WienerConfig {
  fftSize?: number;
  sampleRate?: number;
  alpha?: number;
  minGain?: number;
  maxGain?: number;
  useLSA?: boolean;
  gainSmoothing?: number;
  frequencySmoothing?: number;
  usePerceptualWeighting?: boolean;
}

export interface MultibandConfig {
  sampleRate?: number;
  fftSize?: number;
  subBassReduction?: number;
  bassReduction?: number;
  lowMidReduction?: number;
  midReduction?: number;
  highMidReduction?: number;
  highReduction?: number;
  ultraHighReduction?: number;
}

// === Types de statistiques ===

export interface NoiseStatistics {
  inputLevel: number;
  outputLevel: number;
  estimatedSNR: number;
  noiseReductionDB: number;
  processedFrames: number;
  processedSamples: number;
  durationMs: number;
  speechProbability: number;
  musicalNoiseLevel: number;
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
  oldState: NoiseState,
  newState: NoiseState,
) => void;

// === Interface du module ===

export interface Spec extends TurboModule {
  // === Gestion du cycle de vie ===

  // Initialise le système de réduction de bruit
  readonly initialize: (config: NoiseConfig) => boolean;

  // Démarre le traitement audio
  readonly start: () => boolean;

  // Arrête le traitement audio
  readonly stop: () => boolean;

  // Libère toutes les ressources
  readonly dispose: () => void;

  // === État et informations ===

  // Obtient l'état actuel du système de bruit
  readonly getState: () => NoiseState;

  // Obtient les statistiques du système de bruit
  readonly getStatistics: () => NoiseStatistics | null;

  // Réinitialise les statistiques
  readonly resetStatistics: () => void;

  // === Configuration ===

  // Obtient la configuration actuelle
  readonly getConfig: () => NoiseConfig;

  // Met à jour la configuration
  readonly updateConfig: (config: NoiseConfig) => boolean;

  // Change l'algorithme de réduction de bruit
  readonly setAlgorithm: (algorithm: NoiseAlgorithm) => boolean;

  // Définit l'agressivité de la réduction (0.0 - 3.0)
  readonly setAggressiveness: (aggressiveness: number) => boolean;

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

  // Obtient le SNR estimé
  readonly getEstimatedSNR: () => number;

  // Obtient la probabilité de présence de parole
  readonly getSpeechProbability: () => number;

  // Obtient le niveau de bruit musical
  readonly getMusicalNoiseLevel: () => number;

  // === Configuration avancée ===

  // Configuration IMCRA (Improved Minima Controlled Recursive Averaging)
  readonly initializeIMCRA: (config: IMCRAConfig) => boolean;
  readonly getIMCRAConfig: () => IMCRAConfig;
  readonly updateIMCRAConfig: (config: IMCRAConfig) => boolean;

  // Configuration Wiener Filter
  readonly initializeWiener: (config: WienerConfig) => boolean;
  readonly getWienerConfig: () => WienerConfig;
  readonly updateWienerConfig: (config: WienerConfig) => boolean;

  // Configuration Multi-bandes
  readonly initializeMultiband: (config: MultibandConfig) => boolean;
  readonly getMultibandConfig: () => MultibandConfig;
  readonly updateMultibandConfig: (config: MultibandConfig) => boolean;

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
  'NativeAudioNoiseModule',
);
