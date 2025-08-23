import { TurboModule, TurboModuleRegistry } from 'react-native';

// === Types d'erreurs ===
export type CoreError =
  | 'ok'
  | 'not_initialized'
  | 'already_running'
  | 'already_stopped'
  | 'module_error'
  | 'config_error'
  | 'processing_failed'
  | 'memory_error'
  | 'thread_error';

// === États du module ===
export type CoreState =
  | 'uninitialized'
  | 'initialized'
  | 'processing'
  | 'error';

// === Types de filtres ===
export type CoreFilterType =
  | 'lowpass'
  | 'highpass'
  | 'bandpass'
  | 'notch'
  | 'peak'
  | 'lowshelf'
  | 'highshelf'
  | 'allpass';

// === Types de configuration ===

// Configuration d'un filtre biquad
export interface CoreFilterConfig {
  frequency: number;
  q?: number;
  gainDB?: number;
  type?: CoreFilterType;
}

// Configuration d'une bande d'égaliseur
export interface CoreBandConfig {
  bandIndex?: number;
  frequency: number;
  gainDB: number;
  q?: number;
  type?: CoreFilterType;
  enabled?: boolean;
}

// Configuration de l'égaliseur
export interface CoreEqualizerConfig {
  numBands?: number;
  sampleRate?: number;
  masterGainDB?: number;
  bypass?: boolean;
}

// Informations sur un filtre
export interface CoreFilterInfo {
  a0: number;
  a1: number;
  a2: number;
  b1: number;
  b2: number;
  y1: number;
  y2: number;
}

// Informations sur l'égaliseur
export interface CoreEqualizerInfo {
  numBands: number;
  sampleRate: number;
  masterGainDB: number;
  bypass: boolean;
  state: CoreState;
}

// === Types de callbacks ===

export type CoreAudioCallback = (
  data: number[],
  frameCount: number,
  channels: number,
) => void;

export type CoreErrorCallback = (error: CoreError, message: string) => void;

export type CoreStateCallback = (oldState: CoreState, newState: CoreState) => void;

// === Interface du module ===

export interface Spec extends TurboModule {
  // === Gestion du cycle de vie ===

  // Initialise le module core
  readonly initialize: () => void;

  // Vérifie si le module est initialisé
  readonly isInitialized: () => boolean;

  // Libère toutes les ressources
  readonly dispose: () => void;

  // === État et informations ===

  // Obtient l'état actuel du module
  readonly getState: () => CoreState;

  // Obtient la description d'une erreur
  readonly getErrorString: (errorCode: number) => string;

  // === Égaliseur ===

  // Initialisation
  readonly equalizerInitialize: (config: CoreEqualizerConfig) => boolean;
  readonly equalizerIsInitialized: () => boolean;
  readonly equalizerRelease: () => void;

  // Configuration globale
  readonly equalizerSetMasterGain: (gainDB: number) => boolean;
  readonly equalizerSetBypass: (bypass: boolean) => boolean;
  readonly equalizerSetSampleRate: (sampleRate: number) => boolean;

  // Configuration des bandes
  readonly equalizerSetBand: (bandIndex: number, config: CoreBandConfig) => boolean;
  readonly equalizerGetBand: (bandIndex: number) => CoreBandConfig | null;
  readonly equalizerSetBandGain: (bandIndex: number, gainDB: number) => boolean;
  readonly equalizerSetBandFrequency: (bandIndex: number, frequency: number) => boolean;
  readonly equalizerSetBandQ: (bandIndex: number, q: number) => boolean;
  readonly equalizerSetBandType: (bandIndex: number, filterType: CoreFilterType) => boolean;
  readonly equalizerSetBandEnabled: (bandIndex: number, enabled: boolean) => boolean;

  // Informations
  readonly equalizerGetInfo: () => CoreEqualizerInfo;
  readonly equalizerGetNumBands: () => number;

  // Processing
  readonly equalizerProcessMono: (input: number[]) => number[];
  readonly equalizerProcessStereo: (inputL: number[], inputR: number[]) => { left: number[]; right: number[] };

  // Presets
  readonly equalizerLoadPreset: (presetName: string) => boolean;
  readonly equalizerSavePreset: (presetName: string) => boolean;
  readonly equalizerResetAllBands: () => boolean;

  // === Filtres biquad individuels ===

  // Gestion du cycle de vie
  readonly filterCreate: () => number; // Retourne l'ID du filtre créé
  readonly filterDestroy: (filterId: number) => boolean;

  // Configuration
  readonly filterSetConfig: (filterId: number, config: CoreFilterConfig) => boolean;
  readonly filterGetConfig: (filterId: number) => CoreFilterConfig | null;

  // Types de filtres
  readonly filterSetLowpass: (filterId: number, frequency: number, sampleRate: number, q: number) => boolean;
  readonly filterSetHighpass: (filterId: number, frequency: number, sampleRate: number, q: number) => boolean;
  readonly filterSetBandpass: (filterId: number, frequency: number, sampleRate: number, q: number) => boolean;
  readonly filterSetNotch: (filterId: number, frequency: number, sampleRate: number, q: number) => boolean;
  readonly filterSetPeaking: (filterId: number, frequency: number, sampleRate: number, q: number, gainDB: number) => boolean;
  readonly filterSetLowShelf: (filterId: number, frequency: number, sampleRate: number, q: number, gainDB: number) => boolean;
  readonly filterSetHighShelf: (filterId: number, frequency: number, sampleRate: number, q: number, gainDB: number) => boolean;
  readonly filterSetAllpass: (filterId: number, frequency: number, sampleRate: number, q: number) => boolean;

  // Processing
  readonly filterProcessMono: (filterId: number, input: number[]) => number[];
  readonly filterProcessStereo: (filterId: number, inputL: number[], inputR: number[]) => { left: number[]; right: number[] };

  // Informations
  readonly filterGetInfo: (filterId: number) => CoreFilterInfo | null;
  readonly filterReset: (filterId: number) => boolean;

  // === Utilitaires ===

  // Conversion dB/linéaire
  readonly dbToLinear: (db: number) => number;
  readonly linearToDb: (linear: number) => number;

  // Validation
  readonly validateFrequency: (frequency: number, sampleRate: number) => boolean;
  readonly validateQ: (q: number) => boolean;
  readonly validateGainDB: (gainDB: number) => boolean;

  // === Gestion mémoire ===

  readonly memoryInitialize: (poolSize: number) => boolean;
  readonly memoryRelease: () => void;
  readonly memoryGetAvailable: () => number;
  readonly memoryGetUsed: () => number;

  // === Callbacks JavaScript ===

  // Définit le callback pour les données audio traitées
  readonly setAudioCallback: (callback: CoreAudioCallback) => void;

  // Définit le callback pour les erreurs
  readonly setErrorCallback: (callback: CoreErrorCallback) => void;

  // Définit le callback pour les changements d'état
  readonly setStateCallback: (callback: CoreStateCallback) => void;

  // === Installation du module (pour JSI direct) ===

  // Installe le module directement dans le runtime JSI
  readonly install?: () => void;
}

// Export du module
export default TurboModuleRegistry.getEnforcing<Spec>(
  'NativeAudioCoreModule',
);

// === Constantes et presets ===

// Constantes de l'égaliseur
export const EqualizerConstants = {
  DEFAULT_SAMPLE_RATE: 48000,
  DEFAULT_NUM_BANDS: 10,
  DEFAULT_MASTER_GAIN: 0.0,
  MIN_GAIN_DB: -24.0,
  MAX_GAIN_DB: 24.0,
  MIN_Q: 0.1,
  MAX_Q: 10.0,
  DEFAULT_Q: 0.707,
  MIN_FREQUENCY_HZ: 20.0,
  MAX_FREQUENCY_HZ: 20000.0,
} as const;

// Fréquences par défaut des bandes d'égaliseur (10 bandes)
export const DEFAULT_BAND_FREQUENCIES = [
  31.25,   // Sub-bass
  62.5,    // Bass
  125.0,   // Low-mid
  250.0,   // Mid
  500.0,   // Mid
  1000.0,  // Mid-high
  2000.0,  // High-mid
  4000.0,  // Presence
  8000.0,  // Brilliance
  16000.0  // Air
] as const;

// Presets d'égaliseur prédéfinis
export const EqualizerPresets = {
  FLAT: {
    name: 'Flat',
    gains: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  },

  ROCK: {
    name: 'Rock',
    gains: [4.0, 3.0, -1.0, -2.0, -1.0, 2.0, 3.0, 4.0, 3.0, 2.0],
  },

  POP: {
    name: 'Pop',
    gains: [-1.0, 2.0, 4.0, 3.0, 0.0, -1.0, -1.0, 0.0, 2.0, 3.0],
  },

  JAZZ: {
    name: 'Jazz',
    gains: [0.0, 2.0, 1.0, 2.0, -2.0, -2.0, 0.0, 1.0, 2.0, 3.0],
  },

  CLASSICAL: {
    name: 'Classical',
    gains: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -2.0, -2.0, -2.0, -3.0],
  },

  ELECTRONIC: {
    name: 'Electronic',
    gains: [4.0, 3.0, 1.0, 0.0, -2.0, 2.0, 1.0, 1.0, 3.0, 4.0],
  },

  VOCAL_BOOST: {
    name: 'Vocal Boost',
    gains: [-2.0, -1.0, 0.0, 2.0, 4.0, 4.0, 3.0, 2.0, 0.0, -1.0],
  },

  BASS_BOOST: {
    name: 'Bass Boost',
    gains: [6.0, 5.0, 4.0, 2.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  },

  TREBLE_BOOST: {
    name: 'Treble Boost',
    gains: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 2.0, 4.0, 5.0, 6.0],
  },

  LOUDNESS: {
    name: 'Loudness',
    gains: [5.0, 3.0, 0.0, -1.0, -2.0, -2.0, -1.0, 0.0, 3.0, 5.0],
  },
} as const;

// Types d'effets disponibles
export const FilterTypes = {
  LOWPASS: 'lowpass' as CoreFilterType,
  HIGHPASS: 'highpass' as CoreFilterType,
  BANDPASS: 'bandpass' as CoreFilterType,
  NOTCH: 'notch' as CoreFilterType,
  PEAK: 'peak' as CoreFilterType,
  LOWSHELF: 'lowshelf' as CoreFilterType,
  HIGHSHELF: 'highshelf' as CoreFilterType,
  ALLPASS: 'allpass' as CoreFilterType,
} as const;

// === Utilitaires d'aide ===

// Classe helper pour la gestion d'égaliseur
export class AudioCoreHelper {
  private static module: Spec | null = null;

  // Obtenir l'instance du module
  static getModule(): Spec {
    if (!this.module) {
      // Import du module principal
      this.module = require('../specs/NativeAudioCoreModule').default;
    }
    return this.module;
  }

  // Initialiser l'égaliseur avec une configuration par défaut
  static async initializeDefaultEqualizer(): Promise<boolean> {
    const module = this.getModule();

    const config: CoreEqualizerConfig = {
      numBands: EqualizerConstants.DEFAULT_NUM_BANDS,
      sampleRate: EqualizerConstants.DEFAULT_SAMPLE_RATE,
      masterGainDB: EqualizerConstants.DEFAULT_MASTER_GAIN,
      bypass: false,
    };

    return module.equalizerInitialize(config);
  }

  // Créer un filtre avec une configuration
  static async createFilter(config: CoreFilterConfig): Promise<number> {
    const module = this.getModule();

    const filterId = module.filterCreate();
    if (filterId > 0) {
      const success = module.filterSetConfig(filterId, config);
      if (!success) {
        module.filterDestroy(filterId);
        return -1;
      }
    }

    return filterId;
  }

  // Appliquer un preset d'égaliseur
  static async applyPreset(presetName: keyof typeof EqualizerPresets): Promise<boolean> {
    const module = this.getModule();
    return module.equalizerLoadPreset(presetName.toLowerCase());
  }

  // Obtenir les informations sur l'égaliseur
  static async getEqualizerInfo(): Promise<CoreEqualizerInfo> {
    const module = this.getModule();
    return module.equalizerGetInfo();
  }

  // Traiter un signal mono
  static async processMono(input: number[]): Promise<number[]> {
    const module = this.getModule();
    return module.equalizerProcessMono(input);
  }

  // Traiter un signal stéréo
  static async processStereo(inputL: number[], inputR: number[]): Promise<{ left: number[]; right: number[] }> {
    const module = this.getModule();
    return module.equalizerProcessStereo(inputL, inputR);
  }

  // Convertir dB vers linéaire
  static dbToLinear(db: number): number {
    return 10 ** (db / 20);
  }

  // Convertir linéaire vers dB
  static linearToDb(linear: number): number {
    return 20 * Math.log10(Math.max(linear, 1e-10));
  }

  // Valider une fréquence
  static validateFrequency(frequency: number, sampleRate: number = EqualizerConstants.DEFAULT_SAMPLE_RATE): boolean {
    return frequency >= EqualizerConstants.MIN_FREQUENCY_HZ &&
           frequency <= sampleRate / 2;
  }

  // Valider un gain en dB
  static validateGain(gainDB: number): boolean {
    return gainDB >= EqualizerConstants.MIN_GAIN_DB &&
           gainDB <= EqualizerConstants.MAX_GAIN_DB;
  }

  // Valider un facteur Q
  static validateQ(q: number): boolean {
    return q >= EqualizerConstants.MIN_Q &&
           q <= EqualizerConstants.MAX_Q;
  }
}
