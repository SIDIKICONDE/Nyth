/**
 * @fileoverview Interface de liaison entre JavaScript et le module natif d'analyse spectrale
 * @module NativeAudioSpectrumModule
 */

import { TurboModule, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
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

/**
 * Enregistrement du module natif via TurboModuleRegistry
 * Le module sera automatiquement lié lors de la compilation
 */
const NativeModule = TurboModuleRegistry.getEnforcing<Spec>('NativeAudioSpectrumModule');

/**
 * Classe wrapper pour ajouter des validations et conversions côté JavaScript
 */
class NativeAudioSpectrumModuleWrapper implements Spec {
  /**
   * Initialise le module avec validation de la configuration
   */
  initialize(config: SpectrumConfig): boolean {
    if (!this.validateConfig(config)) {
      console.error('Invalid spectrum configuration provided');
      return false;
    }
    return NativeModule.initialize(config);
  }

  isInitialized(): boolean {
    return NativeModule.isInitialized();
  }

  /**
   * Libère les ressources et nettoie les callbacks
   */
  dispose(): boolean {
    // Nettoyer les callbacks locaux si nécessaire
    this._dataCallback = null;
    this._errorCallback = null;
    this._stateCallback = null;
    return NativeModule.dispose();
  }

  getState(): number {
    return NativeModule.getState();
  }

  getErrorString(errorCode: number): string {
    return NativeModule.getErrorString(errorCode);
  }

  setConfig(config: SpectrumConfig): boolean {
    if (!this.validateConfig(config)) {
      console.error('Invalid spectrum configuration provided');
      return false;
    }
    return NativeModule.setConfig(config);
  }

  getConfig(): SpectrumConfig {
    return NativeModule.getConfig();
  }

  startAnalysis(): boolean {
    return NativeModule.startAnalysis();
  }

  stopAnalysis(): boolean {
    return NativeModule.stopAnalysis();
  }

  isAnalyzing(): boolean {
    return NativeModule.isAnalyzing();
  }

  /**
   * Traite un buffer audio avec validation de taille
   */
  processAudioBuffer(audioBuffer: number[]): boolean {
    if (!audioBuffer || audioBuffer.length === 0) {
      console.error('Invalid audio buffer provided');
      return false;
    }
    return NativeModule.processAudioBuffer(audioBuffer);
  }

  /**
   * Traite des buffers stéréo avec validation
   */
  processAudioBufferStereo(audioBufferL: number[], audioBufferR: number[]): boolean {
    if (!audioBufferL || !audioBufferR || 
        audioBufferL.length === 0 || audioBufferR.length === 0 ||
        audioBufferL.length !== audioBufferR.length) {
      console.error('Invalid stereo audio buffers provided');
      return false;
    }
    return NativeModule.processAudioBufferStereo(audioBufferL, audioBufferR);
  }

  /**
   * Récupère les données spectrales avec validation
   */
  getSpectrumData(): SpectrumData | null {
    const data = NativeModule.getSpectrumData();
    if (data && data.magnitudes && data.frequencies) {
      return data;
    }
    return null;
  }

  calculateFFTSize(desiredSize: number): number {
    // Valider que c'est une puissance de 2
    const size = NativeModule.calculateFFTSize(desiredSize);
    return (size & (size - 1)) === 0 ? size : 1024;
  }

  validateConfig(config: SpectrumConfig): boolean {
    if (!config || typeof config !== 'object') return false;
    if (!config.sampleRate || config.sampleRate < 8000 || config.sampleRate > 192000) return false;
    if (config.fftSize && ((config.fftSize & (config.fftSize - 1)) !== 0)) return false;
    if (config.minFreq && config.maxFreq && config.minFreq >= config.maxFreq) return false;
    return true;
  }

  // Stockage local des callbacks pour le nettoyage
  private _dataCallback: ((data: SpectrumData) => void) | null = null;
  private _errorCallback: ((error: number, message: string) => void) | null = null;
  private _stateCallback: ((oldState: number, newState: number) => void) | null = null;

  setDataCallback(callback: (data: SpectrumData) => void): boolean {
    this._dataCallback = callback;
    return NativeModule.setDataCallback(callback);
  }

  setErrorCallback(callback: (error: number, message: string) => void): boolean {
    this._errorCallback = callback;
    return NativeModule.setErrorCallback(callback);
  }

  setStateCallback(callback: (oldState: number, newState: number) => void): boolean {
    this._stateCallback = callback;
    return NativeModule.setStateCallback(callback);
  }
}

export default new NativeAudioSpectrumModuleWrapper();
