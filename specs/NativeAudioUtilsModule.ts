import { TurboModule, TurboModuleRegistry } from 'react-native';

// === Types d'erreurs ===
export type UtilsError =
  | 'ok'
  | 'invalid_buffer'
  | 'invalid_channel'
  | 'invalid_sample'
  | 'out_of_memory'
  | 'processing_failed';

// === États du système d'utilitaires ===
export type UtilsState =
  | 'uninitialized'
  | 'initialized'
  | 'processing'
  | 'error';

// === Types de configuration ===

export interface AudioBufferConfig {
  numChannels?: number;
  numSamples?: number;
  useSIMD?: boolean;
  enableValidation?: boolean;
  alignment?: number;
}

// === Types d'informations et statistiques ===

export interface AudioBufferInfo {
  numChannels: number;
  numSamples: number;
  totalSizeBytes: number;
  alignment: number;
  isValid: boolean;
  hasSIMD: boolean;
}

export interface AudioBufferStats {
  peakLevel: number;
  rmsLevel: number;
  dcOffset: number;
  clippedSamples: number;
  hasNaN: boolean;
  hasInf: boolean;
}

export interface PlatformInfo {
  platform: string;
  compiler: string;
  simdSupport: string;
}

// === Types de configuration d'opération ===

export interface BufferOperationConfig {
  channel?: number;
  startSample?: number;
  numSamples?: number;
  gain?: number;
  startGain?: number;
  endGain?: number;
}

// === Callbacks types ===

export type BufferCallback = (operation: string, success: boolean) => void;
export type ErrorCallback = (error: UtilsError, message: string) => void;
export type StateChangeCallback = (
  oldState: UtilsState,
  newState: UtilsState,
) => void;

// === Interface du module ===

export interface Spec extends TurboModule {
  // === Gestion du cycle de vie du buffer ===

  // Crée un nouveau buffer audio
  readonly createBuffer: (numChannels: number, numSamples: number) => boolean;

  // Détruit le buffer audio actuel
  readonly destroyBuffer: () => boolean;

  // Vérifie si le buffer est valide
  readonly isBufferValid: () => boolean;

  // === Informations du buffer ===

  // Obtient les informations du buffer
  readonly getBufferInfo: () => AudioBufferInfo | null;

  // Obtient les statistiques d'un canal
  readonly getBufferStats: (
    channel: number,
    startSample: number,
    numSamples: number,
  ) => AudioBufferStats | null;

  // === Opérations de base ===

  // Efface tout le buffer
  readonly clearBuffer: () => boolean;

  // Efface un canal spécifique
  readonly clearChannel: (channel: number) => boolean;

  // Efface une plage d'échantillons
  readonly clearRange: (
    channel: number,
    startSample: number,
    numSamples: number,
  ) => boolean;

  // === Opérations de copie ===

  // Copie depuis le buffer lui-même
  readonly copyFromBuffer: () => boolean;

  // Copie entre canaux
  readonly copyFromChannel: (
    destChannel: number,
    destStartSample: number,
    srcChannel: number,
    srcStartSample: number,
    numSamples: number,
  ) => boolean;

  // Copie depuis un array JavaScript
  readonly copyFromArray: (
    destChannel: number,
    source: number[],
  ) => boolean;

  // === Opérations de mixage ===

  // Ajoute des données avec gain
  readonly addFrom: (
    destChannel: number,
    source: number[],
    gain: number,
  ) => boolean;

  // Ajoute depuis le buffer avec gain
  readonly addFromBuffer: (gain: number) => boolean;

  // === Opérations de gain ===

  // Applique un gain constant à un canal
  readonly applyGain: (channel: number, gain: number) => boolean;

  // Applique un gain à une plage
  readonly applyGainRange: (
    channel: number,
    startSample: number,
    numSamples: number,
    gain: number,
  ) => boolean;

  // Applique un gain variable (rampe)
  readonly applyGainRamp: (
    channel: number,
    startSample: number,
    numSamples: number,
    startGain: number,
    endGain: number,
  ) => boolean;

  // === Analyse du signal ===

  // Obtient le niveau de magnitude (pic)
  readonly getMagnitude: (
    channel: number,
    startSample: number,
    numSamples: number,
  ) => number;

  // Obtient le niveau RMS
  readonly getRMSLevel: (
    channel: number,
    startSample: number,
    numSamples: number,
  ) => number;

  // === Accès direct aux données ===

  // Obtient les données d'un canal (lecture seule)
  readonly getChannelData: (channel: number) => number[] | null;

  // Définit les données d'un canal
  readonly setChannelData: (channel: number, data: number[]) => boolean;

  // === Utilitaires de conversion ===

  // Conversion dB vers linéaire (float)
  readonly dbToLinear: (db: number) => number;

  // Conversion linéaire vers dB (float)
  readonly linearToDb: (linear: number) => number;

  // Conversion dB vers linéaire (double)
  readonly dbToLinearDouble: (db: number) => number;

  // Conversion linéaire vers dB (double)
  readonly linearToDbDouble: (linear: number) => number;

  // === Informations système ===

  // Obtient le nombre maximum de canaux supportés
  readonly getMaxChannels: () => number;

  // Obtient le nombre maximum d'échantillons par buffer
  readonly getMaxSamples: () => number;

  // Obtient l'alignement SIMD
  readonly getSIMDAlignment: () => number;

  // Vérifie le support SIMD
  readonly hasSIMDSupport: () => boolean;

  // Obtient les informations de la plateforme
  readonly getPlatformInfo: () => string;

  // === Callbacks JavaScript ===

  // Définit le callback pour les opérations de buffer
  readonly setBufferCallback: (callback: BufferCallback) => void;

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
  'NativeAudioUtilsModule',
);
