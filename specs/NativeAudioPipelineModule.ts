import { TurboModule, TurboModuleRegistry } from 'react-native';

// === Types d'erreurs ===
export type PipelineError =
  | 'ok'
  | 'not_initialized'
  | 'already_running'
  | 'already_stopped'
  | 'module_error'
  | 'config_error'
  | 'processing_failed';

// === États du pipeline ===
export type PipelineState =
  | 'uninitialized'
  | 'initialized'
  | 'starting'
  | 'running'
  | 'paused'
  | 'stopping'
  | 'error';

// === Types de configuration ===

export interface CaptureConfig {
  sampleRate?: number;
  channelCount?: number;
  bufferSizeFrames?: number;
  bitsPerSample?: number;
  enableEchoCancellation?: boolean;
  enableNoiseSuppression?: boolean;
  enableAutomaticGainControl?: boolean;
}

export interface PipelineConfig {
  captureConfig?: CaptureConfig;

  // Activation des modules
  enableEqualizer?: boolean;
  enableNoiseReduction?: boolean;
  enableEffects?: boolean;
  enableSafetyLimiter?: boolean;
  enableFFTAnalysis?: boolean;

  // Configuration des modules
  safetyLimiterThreshold?: number; // 0.0-1.0
  noiseReductionStrength?: number; // 0.0-1.0
  fftSize?: number; // 256, 512, 1024, 2048, 4096

  // Configuration avancée
  lowLatencyMode?: boolean;
  highQualityMode?: boolean;
  targetLatencyMs?: number;
}

// === Types d'informations et métriques ===

export interface PipelineMetrics {
  currentLevel: number;
  peakLevel: number;
  isClipping: boolean;
  cpuUsage: number;
  latencyMs: number;
  state: PipelineState;
  isRecording: boolean;
}

export interface ModuleStatus {
  equalizerActive: boolean;
  noiseReductionActive: boolean;
  effectsActive: boolean;
  safetyLimiterActive: boolean;
  fftAnalysisActive: boolean;
  activeEffectsCount: number;
}

// === Types de configuration pour les modules ===

export interface EqualizerBandConfig {
  band: number; // 0-9 for 10-band EQ
  frequency: number;
  gain: number; // dB
  q: number; // Quality factor
}

export interface EffectConfig {
  effectType: string; // "compressor", "delay", "reverb", etc.
  effectId: string;
  parameters?: { [key: string]: string | number | boolean }; // JSON object
}

// === Callbacks types ===

export type AudioDataCallback = (
  data: number[],
  frameCount: number,
  channels: number,
) => void;

export type FFTDataCallback = (
  magnitudes: number[],
  binCount: number,
  sampleRate: number,
) => void;

export type MetricsCallback = (metrics: PipelineMetrics) => void;

export type ErrorCallback = (error: PipelineError, message: string) => void;

export type StateChangeCallback = (
  oldState: PipelineState,
  newState: PipelineState,
) => void;

// === Interface du module ===

export interface Spec extends TurboModule {
  // === Gestion du cycle de vie ===

  // Initialise le pipeline avec une configuration
  readonly initialize: (config: PipelineConfig) => boolean;

  // Vérifie si le pipeline est initialisé
  readonly isInitialized: () => boolean;

  // Libère toutes les ressources
  readonly dispose: () => void;

  // === Contrôle du pipeline ===

  // Démarre le pipeline
  readonly start: () => boolean;

  // Arrête le pipeline
  readonly stop: () => boolean;

  // Met en pause le pipeline
  readonly pause: () => boolean;

  // Reprend le pipeline
  readonly resume: () => boolean;

  // === État et informations ===

  // Obtient l'état actuel du pipeline
  readonly getState: () => PipelineState;

  // Obtient la description d'une erreur
  readonly getErrorString: (errorCode: number) => string;

  // Obtient les métriques actuelles
  readonly getMetrics: () => PipelineMetrics;

  // Obtient le statut des modules
  readonly getModuleStatus: () => ModuleStatus;

  // === Configuration des modules ===

  // Equalizer
  readonly setEqualizerEnabled: (enabled: boolean) => boolean;
  readonly setEqualizerBand: (bandConfig: EqualizerBandConfig) => boolean;
  readonly loadEqualizerPreset: (presetName: string) => boolean;
  readonly resetEqualizer: () => boolean;

  // Noise Reduction
  readonly setNoiseReductionEnabled: (enabled: boolean) => boolean;
  readonly setNoiseReductionStrength: (strength: number) => boolean;
  readonly trainNoiseProfile: (durationSeconds: number) => boolean;

  // Effects
  readonly setEffectsEnabled: (enabled: boolean) => boolean;
  readonly addEffect: (effectConfig: EffectConfig) => boolean;
  readonly removeEffect: (effectId: string) => boolean;
  readonly setEffectParameter: (
    effectId: string,
    param: string,
    value: number,
  ) => boolean;
  readonly removeAllEffects: () => void;

  // Safety Limiter
  readonly setSafetyLimiterEnabled: (enabled: boolean) => boolean;
  readonly setSafetyLimiterThreshold: (threshold: number) => boolean;

  // FFT Analysis
  readonly setFFTAnalysisEnabled: (enabled: boolean) => boolean;
  readonly setFFTSize: (size: number) => boolean;

  // === Enregistrement ===

  // Démarre l'enregistrement
  readonly startRecording: (filename: string) => boolean;

  // Arrête l'enregistrement
  readonly stopRecording: () => boolean;

  // Vérifie si l'enregistrement est en cours
  readonly isRecording: () => boolean;

  // === Utilitaires ===

  // Obtient le niveau actuel (RMS)
  readonly getCurrentLevel: () => number;

  // Obtient le niveau de crête
  readonly getPeakLevel: () => number;

  // Vérifie si le clipping est détecté
  readonly isClipping: () => boolean;

  // Obtient la latence en millisecondes
  readonly getLatencyMs: () => number;

  // Obtient l'utilisation CPU
  readonly getCpuUsage: () => number;

  // === Callbacks JavaScript ===

  // Définit le callback pour les données audio traitées
  readonly setAudioDataCallback: (callback: AudioDataCallback) => void;

  // Définit le callback pour les données FFT
  readonly setFFTDataCallback: (callback: FFTDataCallback) => void;

  // Définit le callback pour les métriques
  readonly setMetricsCallback: (callback: MetricsCallback) => void;

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
  'NativeAudioPipelineModule',
);
