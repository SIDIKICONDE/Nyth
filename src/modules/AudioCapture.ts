/**
 * Module de capture audio cross-platform pour React Native
 * Fournit une API unifiée pour la capture audio sur Android et iOS
 */

import NativeAudioCaptureModule, {
  type AudioCaptureConfig,
  type CaptureState,
  type CaptureStatistics,
  type AudioDeviceInfo,
  type RecordingOptions,
  type RecordingInfo,
  type AudioAnalysis,
  type AudioDataCallback,
  type ErrorCallback,
  type StateChangeCallback,
  type AnalysisCallback,
} from '../../specs/NativeAudioCaptureModule';

/**
 * Configuration par défaut pour la capture audio
 */
const DEFAULT_CONFIG: AudioCaptureConfig = {
  sampleRate: 44100,
  channelCount: 1,
  bitsPerSample: 16,
  bufferSizeFrames: 1024,
  enableEchoCancellation: false,
  enableNoiseSuppression: false,
  enableAutoGainControl: false,
  requestPermissionOnInit: true,
};

/**
 * Classe principale pour la capture audio
 */
export class AudioCapture {
  private static instance: AudioCapture | null = null;
  private config: AudioCaptureConfig;
  private isInitialized: boolean = false;
  private callbacks: {
    audioData?: AudioDataCallback;
    error?: ErrorCallback;
    stateChange?: StateChangeCallback;
    analysis?: AnalysisCallback;
  } = {};

  /**
   * Constructeur privé pour le pattern Singleton
   */
  private constructor(config?: Partial<AudioCaptureConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Obtient l'instance singleton de AudioCapture
   */
  static getInstance(config?: Partial<AudioCaptureConfig>): AudioCapture {
    if (!AudioCapture.instance) {
      AudioCapture.instance = new AudioCapture(config);
    }
    return AudioCapture.instance;
  }

  /**
   * Initialise la capture audio avec la configuration spécifiée
   */
  async initialize(config?: Partial<AudioCaptureConfig>): Promise<boolean> {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Demander les permissions si nécessaire
    if (this.config.requestPermissionOnInit && !this.hasPermission()) {
      const granted = await this.requestPermission();
      if (!granted) {
        throw new Error('Permissions audio refusées');
      }
    }

    const success = NativeAudioCaptureModule.initialize(this.config);
    if (success) {
      this.isInitialized = true;
      this.setupCallbacks();
    }
    return success;
  }

  /**
   * Configure les callbacks natifs
   */
  private setupCallbacks(): void {
    if (this.callbacks.audioData) {
      NativeAudioCaptureModule.setAudioDataCallback(this.callbacks.audioData);
    }
    if (this.callbacks.error) {
      NativeAudioCaptureModule.setErrorCallback(this.callbacks.error);
    }
    if (this.callbacks.stateChange) {
      NativeAudioCaptureModule.setStateChangeCallback(this.callbacks.stateChange);
    }
  }

  /**
   * Démarre la capture audio
   */
  async start(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return NativeAudioCaptureModule.start();
  }

  /**
   * Arrête la capture audio
   */
  stop(): boolean {
    return NativeAudioCaptureModule.stop();
  }

  /**
   * Met en pause la capture audio
   */
  pause(): boolean {
    return NativeAudioCaptureModule.pause();
  }

  /**
   * Reprend la capture audio
   */
  resume(): boolean {
    return NativeAudioCaptureModule.resume();
  }

  /**
   * Libère toutes les ressources
   */
  release(): void {
    NativeAudioCaptureModule.release();
    this.isInitialized = false;
  }

  /**
   * Obtient l'état actuel de la capture
   */
  getState(): CaptureState {
    return NativeAudioCaptureModule.getState();
  }

  /**
   * Vérifie si la capture est active
   */
  isCapturing(): boolean {
    return NativeAudioCaptureModule.isCapturing();
  }

  /**
   * Obtient les statistiques de capture
   */
  getStatistics(): CaptureStatistics | null {
    return NativeAudioCaptureModule.getStatistics();
  }

  /**
   * Réinitialise les statistiques
   */
  resetStatistics(): void {
    NativeAudioCaptureModule.resetStatistics();
  }

  /**
   * Obtient la configuration actuelle
   */
  getConfig(): AudioCaptureConfig {
    return NativeAudioCaptureModule.getConfig();
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(config: Partial<AudioCaptureConfig>): boolean {
    this.config = { ...this.config, ...config };
    return NativeAudioCaptureModule.updateConfig(this.config);
  }

  /**
   * Obtient le niveau audio actuel (0.0 à 1.0)
   */
  getCurrentLevel(): number {
    return NativeAudioCaptureModule.getCurrentLevel();
  }

  /**
   * Obtient le niveau de crête (0.0 à 1.0)
   */
  getPeakLevel(): number {
    return NativeAudioCaptureModule.getPeakLevel();
  }

  /**
   * Réinitialise le niveau de crête
   */
  resetPeakLevel(): void {
    NativeAudioCaptureModule.resetPeakLevel();
  }

  /**
   * Obtient le niveau RMS actuel
   */
  getRMS(): number {
    return NativeAudioCaptureModule.getRMS();
  }

  /**
   * Obtient le niveau RMS en dB
   */
  getRMSdB(): number {
    return NativeAudioCaptureModule.getRMSdB();
  }

  /**
   * Vérifie si le signal est silencieux
   */
  isSilent(threshold: number = 0.001): boolean {
    return NativeAudioCaptureModule.isSilent(threshold);
  }

  /**
   * Vérifie s'il y a du clipping
   */
  hasClipping(): boolean {
    return NativeAudioCaptureModule.hasClipping();
  }

  /**
   * Liste les périphériques audio disponibles
   */
  getAvailableDevices(): AudioDeviceInfo[] {
    return NativeAudioCaptureModule.getAvailableDevices();
  }

  /**
   * Sélectionne un périphérique spécifique
   */
  selectDevice(deviceId: string): boolean {
    return NativeAudioCaptureModule.selectDevice(deviceId);
  }

  /**
   * Obtient le périphérique actuellement sélectionné
   */
  getCurrentDevice(): AudioDeviceInfo | null {
    return NativeAudioCaptureModule.getCurrentDevice();
  }

  /**
   * Vérifie si les permissions sont accordées
   */
  hasPermission(): boolean {
    return NativeAudioCaptureModule.hasPermission();
  }

  /**
   * Demande les permissions nécessaires
   */
  async requestPermission(): Promise<boolean> {
    return NativeAudioCaptureModule.requestPermission();
  }

  /**
   * Démarre l'enregistrement dans un fichier
   */
  startRecording(filePath: string, options?: RecordingOptions): boolean {
    return NativeAudioCaptureModule.startRecording(filePath, options);
  }

  /**
   * Arrête l'enregistrement
   */
  stopRecording(): boolean {
    return NativeAudioCaptureModule.stopRecording();
  }

  /**
   * Met en pause l'enregistrement
   */
  pauseRecording(): boolean {
    return NativeAudioCaptureModule.pauseRecording();
  }

  /**
   * Reprend l'enregistrement
   */
  resumeRecording(): boolean {
    return NativeAudioCaptureModule.resumeRecording();
  }

  /**
   * Vérifie si un enregistrement est en cours
   */
  isRecording(): boolean {
    return NativeAudioCaptureModule.isRecording();
  }

  /**
   * Obtient les informations sur l'enregistrement en cours
   */
  getRecordingInfo(): RecordingInfo | null {
    return NativeAudioCaptureModule.getRecordingInfo();
  }

  /**
   * Définit le callback pour recevoir les données audio
   */
  onAudioData(callback: AudioDataCallback): void {
    this.callbacks.audioData = callback;
    NativeAudioCaptureModule.setAudioDataCallback(callback);
  }

  /**
   * Définit le callback pour les erreurs
   */
  onError(callback: ErrorCallback): void {
    this.callbacks.error = callback;
    NativeAudioCaptureModule.setErrorCallback(callback);
  }

  /**
   * Définit le callback pour les changements d'état
   */
  onStateChange(callback: StateChangeCallback): void {
    this.callbacks.stateChange = callback;
    NativeAudioCaptureModule.setStateChangeCallback(callback);
  }

  /**
   * Définit le callback pour l'analyse audio périodique
   */
  onAnalysis(callback: AnalysisCallback, intervalMs: number = 100): void {
    this.callbacks.analysis = callback;
    NativeAudioCaptureModule.setAnalysisCallback(callback, intervalMs);
  }

  /**
   * Analyse un fichier audio existant
   */
  async analyzeAudioFile(filePath: string): Promise<{
    duration: number;
    sampleRate: number;
    channels: number;
    bitDepth: number;
    format: string;
    averageLevel: number;
    peakLevel: number;
    hasClipping: boolean;
  }> {
    return NativeAudioCaptureModule.analyzeAudioFile(filePath);
  }
}

/**
 * Classe helper pour l'enregistrement audio
 */
export class AudioRecorder {
  private capture: AudioCapture;
  private recordingPath: string | null = null;

  constructor(capture?: AudioCapture) {
    this.capture = capture || AudioCapture.getInstance();
  }

  /**
   * Démarre un nouvel enregistrement
   */
  async startRecording(
    filePath: string,
    options?: RecordingOptions & { config?: Partial<AudioCaptureConfig> }
  ): Promise<boolean> {
    // Initialiser la capture si nécessaire
    if (this.capture.getState() === 'uninitialized') {
      await this.capture.initialize(options?.config);
    }

    // Démarrer la capture si elle n'est pas active
    if (!this.capture.isCapturing()) {
      await this.capture.start();
    }

    // Démarrer l'enregistrement
    const success = this.capture.startRecording(filePath, options);
    if (success) {
      this.recordingPath = filePath;
    }
    return success;
  }

  /**
   * Arrête l'enregistrement et retourne le chemin du fichier
   */
  stopRecording(): string | null {
    const success = this.capture.stopRecording();
    const path = this.recordingPath;
    this.recordingPath = null;
    return success ? path : null;
  }

  /**
   * Met en pause l'enregistrement
   */
  pauseRecording(): boolean {
    return this.capture.pauseRecording();
  }

  /**
   * Reprend l'enregistrement
   */
  resumeRecording(): boolean {
    return this.capture.resumeRecording();
  }

  /**
   * Obtient les informations sur l'enregistrement en cours
   */
  getRecordingInfo(): RecordingInfo | null {
    return this.capture.getRecordingInfo();
  }

  /**
   * Vérifie si un enregistrement est en cours
   */
  isRecording(): boolean {
    return this.capture.isRecording();
  }
}

/**
 * Classe helper pour l'analyse audio en temps réel
 */
export class AudioAnalyzer {
  private capture: AudioCapture;
  private analysisInterval: number | null = null;
  private analysisCallback: ((analysis: AudioAnalysis) => void) | null = null;

  constructor(capture?: AudioCapture) {
    this.capture = capture || AudioCapture.getInstance();
  }

  /**
   * Démarre l'analyse en temps réel
   */
  startAnalysis(
    callback: (analysis: AudioAnalysis) => void,
    intervalMs: number = 100
  ): void {
    this.analysisCallback = callback;
    this.capture.onAnalysis(callback, intervalMs);
    
    // Démarrer la capture si nécessaire
    if (!this.capture.isCapturing()) {
      this.capture.start();
    }
  }

  /**
   * Arrête l'analyse
   */
  stopAnalysis(): void {
    this.analysisCallback = null;
    // Note: Nous ne stoppons pas la capture ici car elle peut être utilisée ailleurs
  }

  /**
   * Obtient une analyse instantanée
   */
  getInstantAnalysis(): AudioAnalysis {
    return {
      currentLevel: this.capture.getCurrentLevel(),
      peakLevel: this.capture.getPeakLevel(),
      averageLevel: this.capture.getRMS(),
      framesProcessed: this.capture.getStatistics()?.framesProcessed || 0,
    };
  }

  /**
   * Vérifie si le signal est silencieux
   */
  isSilent(threshold: number = 0.001): boolean {
    return this.capture.isSilent(threshold);
  }

  /**
   * Vérifie s'il y a du clipping
   */
  hasClipping(): boolean {
    return this.capture.hasClipping();
  }

  /**
   * Obtient le niveau en dB
   */
  getLevelDB(): number {
    return this.capture.getRMSdB();
  }
}

// Export de l'instance singleton par défaut
export const audioCapture = AudioCapture.getInstance();

// Export des types
export type {
  AudioCaptureConfig,
  CaptureState,
  CaptureStatistics,
  AudioDeviceInfo,
  RecordingOptions,
  RecordingInfo,
  AudioAnalysis,
  AudioDataCallback,
  ErrorCallback,
  StateChangeCallback,
  AnalysisCallback,
};

// Export par défaut
export default AudioCapture;