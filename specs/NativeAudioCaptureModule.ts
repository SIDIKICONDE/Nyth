import { TurboModule, TurboModuleRegistry } from 'react-native';

// === Types de configuration ===

export interface AudioCaptureConfig {
  sampleRate?: number;        // Taux d'échantillonnage (défaut: 44100)
  channelCount?: number;       // Nombre de canaux (1=mono, 2=stereo, défaut: 1)
  bitsPerSample?: number;      // Bits par échantillon (16 ou 32, défaut: 16)
  bufferSizeFrames?: number;   // Taille du buffer en frames (défaut: 1024)
  enableEchoCancellation?: boolean;
  enableNoiseSuppression?: boolean;
  enableAutoGainControl?: boolean;
  requestPermissionOnInit?: boolean;
}

export type CaptureState = 
  | 'uninitialized'
  | 'initialized'
  | 'starting'
  | 'running'
  | 'pausing'
  | 'paused'
  | 'stopping'
  | 'stopped'
  | 'error';

export interface CaptureStatistics {
  framesProcessed: number;
  bytesProcessed: number;
  averageLevel: number;
  peakLevel: number;
  overruns: number;
  underruns: number;
  durationMs: number;
}

export interface AudioDeviceInfo {
  id: string;
  name: string;
  isDefault: boolean;
  maxChannels: number;
  supportedSampleRates: number[];
}

export interface RecordingOptions {
  format?: 'wav' | 'raw';      // Format du fichier (défaut: 'wav')
  maxDuration?: number;         // Durée maximale en secondes
  maxFileSize?: number;         // Taille maximale en octets
}

export interface RecordingInfo {
  duration: number;             // Durée en secondes
  frames: number;               // Nombre de frames enregistrées
  path: string;                 // Chemin du fichier
  isRecording: boolean;
  isPaused: boolean;
}

export interface AudioAnalysis {
  currentLevel: number;         // Niveau actuel (0.0 à 1.0)
  peakLevel: number;           // Niveau de crête (0.0 à 1.0)
  averageLevel: number;        // Niveau moyen
  framesProcessed: number;
}

// === Callbacks types ===

export type AudioDataCallback = (
  data: Float32Array,
  frameCount: number,
  channels: number
) => void;

export type ErrorCallback = (error: string) => void;

export type StateChangeCallback = (
  oldState: CaptureState,
  newState: CaptureState
) => void;

export type AnalysisCallback = (analysis: AudioAnalysis) => void;

export type PermissionCallback = (granted: boolean) => void;

// === Interface du module ===

export interface Spec extends TurboModule {
  // === Gestion du cycle de vie ===
  
  // Initialise la capture avec la configuration spécifiée
  readonly initialize: (config: AudioCaptureConfig) => boolean;
  
  // Démarre la capture audio
  readonly start: () => boolean;
  
  // Arrête la capture audio
  readonly stop: () => boolean;
  
  // Met en pause la capture
  readonly pause: () => boolean;
  
  // Reprend la capture après une pause
  readonly resume: () => boolean;
  
  // Libère toutes les ressources
  readonly release: () => void;
  
  // === État et informations ===
  
  // Obtient l'état actuel de la capture
  readonly getState: () => CaptureState;
  
  // Vérifie si la capture est active
  readonly isCapturing: () => boolean;
  
  // Obtient les statistiques de capture
  readonly getStatistics: () => CaptureStatistics | null;
  
  // Réinitialise les statistiques
  readonly resetStatistics: () => void;
  
  // === Configuration ===
  
  // Obtient la configuration actuelle
  readonly getConfig: () => AudioCaptureConfig;
  
  // Met à jour la configuration (peut nécessiter un redémarrage)
  readonly updateConfig: (config: AudioCaptureConfig) => boolean;
  
  // === Niveaux audio ===
  
  // Obtient le niveau audio actuel (0.0 à 1.0)
  readonly getCurrentLevel: () => number;
  
  // Obtient le niveau de crête (0.0 à 1.0)
  readonly getPeakLevel: () => number;
  
  // Réinitialise le niveau de crête
  readonly resetPeakLevel: () => void;
  
  // === Analyse audio ===
  
  // Obtient le niveau RMS actuel
  readonly getRMS: () => number;
  
  // Obtient le niveau RMS en dB
  readonly getRMSdB: () => number;
  
  // Vérifie si le signal est silencieux
  readonly isSilent: (threshold?: number) => boolean;
  
  // Vérifie s'il y a du clipping
  readonly hasClipping: () => boolean;
  
  // === Périphériques audio ===
  
  // Liste les périphériques audio disponibles
  readonly getAvailableDevices: () => AudioDeviceInfo[];
  
  // Sélectionne un périphérique spécifique
  readonly selectDevice: (deviceId: string) => boolean;
  
  // Obtient le périphérique actuellement sélectionné
  readonly getCurrentDevice: () => AudioDeviceInfo | null;
  
  // === Permissions (mobile) ===
  
  // Vérifie si les permissions sont accordées
  readonly hasPermission: () => boolean;
  
  // Demande les permissions nécessaires (retourne une Promise)
  readonly requestPermission: () => Promise<boolean>;
  
  // === Enregistrement ===
  
  // Démarre l'enregistrement dans un fichier
  readonly startRecording: (
    filePath: string,
    options?: RecordingOptions
  ) => boolean;
  
  // Arrête l'enregistrement
  readonly stopRecording: () => boolean;
  
  // Met en pause l'enregistrement
  readonly pauseRecording: () => boolean;
  
  // Reprend l'enregistrement
  readonly resumeRecording: () => boolean;
  
  // Vérifie si un enregistrement est en cours
  readonly isRecording: () => boolean;
  
  // Obtient les informations sur l'enregistrement en cours
  readonly getRecordingInfo: () => RecordingInfo | null;
  
  // === Callbacks JavaScript ===
  
  // Définit le callback pour recevoir les données audio
  readonly setAudioDataCallback: (callback: AudioDataCallback) => void;
  
  // Définit le callback pour les erreurs
  readonly setErrorCallback: (callback: ErrorCallback) => void;
  
  // Définit le callback pour les changements d'état
  readonly setStateChangeCallback: (callback: StateChangeCallback) => void;
  
  // Définit le callback pour l'analyse audio périodique
  readonly setAnalysisCallback: (
    callback: AnalysisCallback,
    intervalMs: number
  ) => void;
  
  // === Méthodes utilitaires ===
  
  // Convertit des données audio entre différents formats
  readonly convertAudioFormat: (params: {
    input: ArrayBuffer;
    inputFormat: 'int16' | 'int32' | 'float32';
    outputFormat: 'int16' | 'int32' | 'float32';
    sampleRate?: number;
    channels?: number;
  }) => ArrayBuffer;
  
  // Analyse un fichier audio existant
  readonly analyzeAudioFile: (filePath: string) => Promise<{
    duration: number;
    sampleRate: number;
    channels: number;
    bitDepth: number;
    format: string;
    averageLevel: number;
    peakLevel: number;
    hasClipping: boolean;
  }>;
  
  // === Installation du module (pour JSI direct) ===
  
  // Installe le module directement dans le runtime JSI
  readonly install?: () => void;
}

// Export du module
export default TurboModuleRegistry.getEnforcing<Spec>('NativeAudioCaptureModule');