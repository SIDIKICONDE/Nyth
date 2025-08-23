// Note: Using simplified interface for C API compatibility
// TODO: Update when TurboModule implementation is available

export interface Spec {
  // === Gestion du cycle de vie ===
  initialize(config: SpectrumConfig): boolean;
  isInitialized(): boolean;
  dispose(): boolean;

  // === État et informations ===
  getState(): number;
  getErrorString(errorCode: number): string;

  // === Configuration ===
  setConfig(config: SpectrumConfig): boolean;
  getConfig(): SpectrumConfig;

  // === Contrôle de l'analyse ===
  startAnalysis(): boolean;
  stopAnalysis(): boolean;
  isAnalyzing(): boolean;

  // === Traitement des données ===
  processAudioBuffer(audioBuffer: number[]): boolean;
  processAudioBufferStereo(audioBufferL: number[], audioBufferR: number[]): boolean;

  // === Récupération des données spectrales ===
  getSpectrumData(): SpectrumData | null;

  // === Utilitaires ===
  calculateFFTSize(desiredSize: number): number;
  validateConfig(config: SpectrumConfig): boolean;

  // === Callbacks JavaScript ===
  setDataCallback(callback: (data: SpectrumData) => void): boolean;
  setErrorCallback(callback: (error: number, message: string) => void): boolean;
  setStateCallback(callback: (oldState: number, newState: number) => void): boolean;
}

// === Types d'erreurs ===
export const SpectrumError = {
  OK: 0,
  NOT_INITIALIZED: -1,
  ALREADY_ANALYZING: -2,
  ALREADY_STOPPED: -3,
  FFT_FAILED: -4,
  INVALID_BUFFER: -5,
  MEMORY_ERROR: -6,
  THREAD_ERROR: -7,
} as const;

export type SpectrumErrorType = typeof SpectrumError[keyof typeof SpectrumError];

// === États du module ===
export const SpectrumState = {
  UNINITIALIZED: 0,
  INITIALIZED: 1,
  ANALYZING: 2,
  ERROR: 3,
} as const;

export type SpectrumStateType = typeof SpectrumState[keyof typeof SpectrumState];

// === Configuration de l'analyse spectrale ===
export interface SpectrumConfig {
  sampleRate: number;      // Taux d'échantillonnage en Hz
  fftSize?: number;        // Taille FFT (doit être une puissance de 2)
  hopSize?: number;        // Pas de déplacement pour l'overlap
  numBands?: number;       // Nombre de bandes de fréquence
  minFreq?: number;        // Fréquence minimale (Hz)
  maxFreq?: number;        // Fréquence maximale (Hz)
  useWindowing?: boolean;  // Utiliser fenêtrage de Hann
  useSIMD?: boolean;       // Utiliser optimisations SIMD
}

// === Données d'analyse spectrale ===
export interface SpectrumData {
  magnitudes: number[];    // Tableau des magnitudes (0-1)
  frequencies: number[];   // Tableau des fréquences centrales (Hz)
  timestamp: number;       // Timestamp en millisecondes
}

// === Configuration par défaut ===
export const DEFAULT_SPECTRUM_CONFIG: SpectrumConfig = {
  sampleRate: 48000,
  fftSize: 1024,
  hopSize: 512,
  numBands: 32,
  minFreq: 20,
  maxFreq: 20000,
  useWindowing: true,
  useSIMD: true,
};

// Temporary implementation using direct C API calls
// TODO: Replace with proper TurboModule when available

class NativeAudioSpectrumModuleImpl implements Spec {
  initialize(config: SpectrumConfig): boolean {
    // TODO: Implement C API call
    console.warn('NativeAudioSpectrumModule.initialize not yet implemented');
    return false;
  }

  isInitialized(): boolean {
    // TODO: Implement C API call
    console.warn('NativeAudioSpectrumModule.isInitialized not yet implemented');
    return false;
  }

  dispose(): boolean {
    // TODO: Implement C API call
    console.warn('NativeAudioSpectrumModule.dispose not yet implemented');
    return false;
  }

  getState(): number {
    // TODO: Implement C API call
    console.warn('NativeAudioSpectrumModule.getState not yet implemented');
    return 0;
  }

  getErrorString(errorCode: number): string {
    // TODO: Implement C API call
    console.warn('NativeAudioSpectrumModule.getErrorString not yet implemented');
    return 'Unknown error';
  }

  setConfig(config: SpectrumConfig): boolean {
    // TODO: Implement C API call
    console.warn('NativeAudioSpectrumModule.setConfig not yet implemented');
    return false;
  }

  getConfig(): SpectrumConfig {
    // TODO: Implement C API call
    console.warn('NativeAudioSpectrumModule.getConfig not yet implemented');
    return DEFAULT_SPECTRUM_CONFIG;
  }

  startAnalysis(): boolean {
    // TODO: Implement C API call
    console.warn('NativeAudioSpectrumModule.startAnalysis not yet implemented');
    return false;
  }

  stopAnalysis(): boolean {
    // TODO: Implement C API call
    console.warn('NativeAudioSpectrumModule.stopAnalysis not yet implemented');
    return false;
  }

  isAnalyzing(): boolean {
    // TODO: Implement C API call
    console.warn('NativeAudioSpectrumModule.isAnalyzing not yet implemented');
    return false;
  }

  processAudioBuffer(audioBuffer: number[]): boolean {
    // TODO: Implement C API call
    console.warn('NativeAudioSpectrumModule.processAudioBuffer not yet implemented');
    return false;
  }

  processAudioBufferStereo(audioBufferL: number[], audioBufferR: number[]): boolean {
    // TODO: Implement C API call
    console.warn('NativeAudioSpectrumModule.processAudioBufferStereo not yet implemented');
    return false;
  }

  getSpectrumData(): SpectrumData | null {
    // TODO: Implement C API call - This is the main function needed for useSpectrumData
    console.warn('NativeAudioSpectrumModule.getSpectrumData not yet implemented');
    return {
      magnitudes: new Array(32).fill(0),
      frequencies: new Array(32).fill(0),
      timestamp: Date.now()
    };
  }

  calculateFFTSize(desiredSize: number): number {
    // TODO: Implement C API call
    console.warn('NativeAudioSpectrumModule.calculateFFTSize not yet implemented');
    return 1024;
  }

  validateConfig(config: SpectrumConfig): boolean {
    // TODO: Implement C API call
    console.warn('NativeAudioSpectrumModule.validateConfig not yet implemented');
    return true;
  }

  setDataCallback(callback: (data: SpectrumData) => void): boolean {
    // TODO: Implement C API call
    console.warn('NativeAudioSpectrumModule.setDataCallback not yet implemented');
    return false;
  }

  setErrorCallback(callback: (error: number, message: string) => void): boolean {
    // TODO: Implement C API call
    console.warn('NativeAudioSpectrumModule.setErrorCallback not yet implemented');
    return false;
  }

  setStateCallback(callback: (oldState: number, newState: number) => void): boolean {
    // TODO: Implement C API call
    console.warn('NativeAudioSpectrumModule.setStateCallback not yet implemented');
    return false;
  }
}

export default new NativeAudioSpectrumModuleImpl();
