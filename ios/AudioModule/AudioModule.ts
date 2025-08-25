/**
 * Interface TypeScript pour le module AudioRecorder
 * À utiliser côté JavaScript/React Native
 */

import { NativeModules, NativeEventEmitter } from 'react-native';

// Types
export interface RecordingOptions {
  fileName?: string;
  sampleRate?: number;
  channels?: number;
  quality?: 'low' | 'medium' | 'high';
}

export interface AudioOptions {
  category?: 'playback' | 'record' | 'playAndRecord';
  mode?: 'default' | 'voiceChat' | 'videoChat' | 'measurement';
  sampleRate?: number;
  ioBufferDuration?: number;
}

export interface RecordingResult {
  status: 'started' | 'stopped';
  filePath: string;
  duration?: number;
}

export interface RecordingStatus {
  isRecording: boolean;
  isPaused: boolean;
  currentFilePath: string | null;
}

export type AudioModuleEvents = {
  recordingStarted: {};
  recordingStopped: { filePath: string; duration?: number };
  recordingPaused: {};
  recordingResumed: {};
  audioLevel: { level: number };
  error: { code: number; message: string };
};

// Module natif
const { AudioModule } = NativeModules;

// Event Emitter
const audioModuleEmitter = new NativeEventEmitter(AudioModule);

// Classe wrapper
export class AudioRecorder {
  private listeners: Map<string, any> = new Map();

  /**
   * Démarre l'enregistrement audio
   */
  async startRecording(options?: RecordingOptions): Promise<RecordingResult> {
    return AudioModule.startRecording(options || {});
  }

  /**
   * Arrête l'enregistrement
   */
  async stopRecording(): Promise<RecordingResult> {
    return AudioModule.stopRecording();
  }

  /**
   * Met en pause l'enregistrement
   */
  async pauseRecording(): Promise<void> {
    return AudioModule.pauseRecording();
  }

  /**
   * Reprend l'enregistrement
   */
  async resumeRecording(): Promise<void> {
    return AudioModule.resumeRecording();
  }

  /**
   * Obtient le statut actuel de l'enregistrement
   */
  getRecordingStatus(): RecordingStatus {
    return AudioModule.getRecordingStatus();
  }

  /**
   * Configure les options audio avancées
   */
  async configureAudioOptions(options: AudioOptions): Promise<void> {
    return AudioModule.configureAudioOptions(options);
  }

  /**
   * Ajoute un listener pour un événement
   */
  addEventListener<K extends keyof AudioModuleEvents>(
    eventName: K,
    callback: (event: AudioModuleEvents[K]) => void
  ): void {
    const subscription = audioModuleEmitter.addListener(eventName, callback);
    this.listeners.set(eventName, subscription);
  }

  /**
   * Supprime un listener
   */
  removeEventListener(eventName: keyof AudioModuleEvents): void {
    const subscription = this.listeners.get(eventName);
    if (subscription) {
      subscription.remove();
      this.listeners.delete(eventName);
    }
  }

  /**
   * Supprime tous les listeners
   */
  removeAllListeners(): void {
    this.listeners.forEach(subscription => subscription.remove());
    this.listeners.clear();
  }
}

// Export par défaut
export default new AudioRecorder();

// Exemple d'utilisation
/*
import AudioRecorder from './AudioModule';

// Démarrer l'enregistrement
const result = await AudioRecorder.startRecording({
  fileName: 'my-recording.m4a',
  quality: 'high'
});

// Écouter les niveaux audio
AudioRecorder.addEventListener('audioLevel', ({ level }) => {
  console.log('Audio level:', level);
});

// Arrêter l'enregistrement
const { filePath, duration } = await AudioRecorder.stopRecording();
console.log(`Recording saved to ${filePath}, duration: ${duration}s`);
*/