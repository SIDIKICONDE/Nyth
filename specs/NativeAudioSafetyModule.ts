import { TurboModule, TurboModuleRegistry } from 'react-native';

// === Types d'erreurs ===
export type SafetyError =
  | 'ok'
  | 'null_buffer'
  | 'invalid_sample_rate'
  | 'invalid_channels'
  | 'invalid_threshold_db'
  | 'invalid_knee_width'
  | 'invalid_dc_threshold'
  | 'invalid_feedback_threshold'
  | 'processing_failed';

// === États du système de sécurité ===
export type SafetyState =
  | 'uninitialized'
  | 'initialized'
  | 'processing'
  | 'error';

// === Types de configuration ===

export interface SafetyConfig {
  enabled?: boolean;
  // DC removal
  dcRemovalEnabled?: boolean;
  dcThreshold?: number; // linear (~-54 dBFS)
  // Limiter
  limiterEnabled?: boolean;
  limiterThresholdDb?: number; // dBFS
  softKneeLimiter?: boolean;
  kneeWidthDb?: number;
  // Feedback detection
  feedbackDetectEnabled?: boolean;
  feedbackCorrThreshold?: number; // normalized autocorrelation
}

export interface SafetyOptimizationConfig {
  useOptimizedEngine?: boolean;    // Utiliser la version SIMD
  enableMemoryPool?: boolean;      // Pool de mémoire pour les rapports
  branchFreeProcessing?: boolean;  // Traitement sans branchement
  poolSize?: number;               // Taille du pool de mémoire
}

// === Types de rapports ===

export interface SafetyReport {
  peak: number;
  rms: number;
  dcOffset: number;
  clippedSamples: number;
  overloadActive: boolean;
  feedbackScore: number; // 0..1
  hasNaN: boolean;
  feedbackLikely: boolean; // score >= threshold
}

export interface SafetyStatistics {
  min: SafetyReport;
  max: SafetyReport;
  avg: SafetyReport;
}

// === Callbacks types ===

export type AudioDataCallback = (
  input: number[],
  output: number[],
  frameCount: number,
  channels: number,
) => void;

export type ErrorCallback = (error: SafetyError) => void;

export type StateChangeCallback = (
  oldState: SafetyState,
  newState: SafetyState,
) => void;

// === Interface du module ===

export interface Spec extends TurboModule {
  // === Gestion du cycle de vie ===

  // Initialise le système de sécurité audio
  readonly initialize: (sampleRate: number, channels: number) => boolean;

  // Vérifie si le système est initialisé
  readonly isInitialized: () => boolean;

  // Libère toutes les ressources
  readonly dispose: () => void;

  // === État et informations ===

  // Obtient l'état actuel du système de sécurité
  readonly getState: () => SafetyState;

  // Obtient la description d'une erreur
  readonly getErrorString: (errorCode: number) => string;

  // === Configuration ===

  // Définit la configuration de sécurité
  readonly setConfig: (config: SafetyConfig) => boolean;

  // Obtient la configuration actuelle
  readonly getConfig: () => SafetyConfig;

  // Définit la configuration d'optimisation
  readonly setOptimizationConfig: (config: SafetyOptimizationConfig) => boolean;

  // === Traitement audio ===

  // Traite un buffer audio mono
  readonly processMono: (buffer: number[]) => number[] | null;

  // Traite des buffers audio stéréo
  readonly processStereo: (
    left: number[],
    right: number[],
  ) => { left: number[]; right: number[] } | null;

  // === Analyse et rapports ===

  // Obtient le dernier rapport de sécurité
  readonly getLastReport: () => SafetyReport | null;

  // Vérifie si une surcharge est active
  readonly isOverloadActive: () => boolean;

  // Vérifie si un feedback est probable
  readonly hasFeedbackLikely: () => boolean;

  // Obtient le niveau de crête actuel
  readonly getCurrentPeak: () => number;

  // Obtient le niveau RMS actuel
  readonly getCurrentRMS: () => number;

  // === Contrôle avancé ===

  // Conversion dB/linéaire
  readonly dbToLinear: (db: number) => number;
  readonly linearToDb: (linear: number) => number;

  // Statistiques
  readonly resetStatistics: () => void;
  readonly getStatistics: () => SafetyStatistics;

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
  'NativeAudioSafetyModule',
);
