import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import NativeAudioCaptureModule, {
  AudioCaptureConfig,
  CaptureState,
  AudioAnalysis,
  RecordingInfo,
  RecordingOptions,
  CaptureStatistics,
  AudioDeviceInfo,
} from '../../../../specs/NativeAudioCaptureModule';
import { createOptimizedLogger } from '@/utils/optimizedLogger';

const logger = createOptimizedLogger('useAudioCapture');

export interface AudioCaptureError {
  code: string;
  message: string;
  timestamp: number;
  context?: string;
}

interface UseAudioCaptureOptions {
  autoRequestPermission?: boolean;
  config?: AudioCaptureConfig;
  onError?: (error: AudioCaptureError) => void;
  onStateChange?: (oldState: CaptureState, newState: CaptureState) => void;
  onAnalysis?: (analysis: AudioAnalysis) => void;
  enableErrorRecovery?: boolean;
  maxRetryAttempts?: number;
}

export function useAudioCapture(options: UseAudioCaptureOptions = {}) {
  const {
    autoRequestPermission = true,
    config = {
      sampleRate: 44100,
      channelCount: 2,
      bitsPerSample: 16,
      bufferSizeFrames: 1024,
      enableEchoCancellation: true,
      enableNoiseSuppression: true,
      enableAutoGainControl: true,
    },
    onError,
    onStateChange,
    onAnalysis,
    enableErrorRecovery = true,
    maxRetryAttempts = 3,
  } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [captureState, setCaptureState] =
    useState<CaptureState>('uninitialized');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [peakLevel, setPeakLevel] = useState(0);
  const [recordingInfo, setRecordingInfo] = useState<RecordingInfo | null>(
    null,
  );
  const [hasPermission, setHasPermission] = useState(false);
  const [statistics, setStatistics] = useState<CaptureStatistics | null>(null);
  const [availableDevices, setAvailableDevices] = useState<AudioDeviceInfo[]>([]);
  const [currentDevice, setCurrentDevice] = useState<AudioDeviceInfo | null>(null);
  const [isSilent, setIsSilent] = useState(false);
  const [hasClipping, setHasClipping] = useState(false);
  const [rmsLevel, setRmsLevel] = useState(0);
  const [rmsLevelDB, setRmsLevelDB] = useState(0);

  // États pour la gestion d'erreurs
  const [lastError, setLastError] = useState<AudioCaptureError | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction utilitaire pour créer des erreurs structurées
  const createError = useCallback((
    code: string,
    message: string,
    context?: string
  ): AudioCaptureError => {
    const error: AudioCaptureError = {
      code,
      message,
      timestamp: Date.now(),
      context,
    };

    setLastError(error);
    setErrorCount(prev => prev + 1);

    logger.error(`❌ Erreur audio [${code}]: ${message}` + (context ? ` (${context})` : ''));
    return error;
  }, []);

  // Fonction de récupération d'erreur
  const attemptRecovery = useCallback(async (error: AudioCaptureError) => {
    if (!enableErrorRecovery || retryCount >= maxRetryAttempts) {
      logger.warn('🚫 Récupération impossible - nombre maximum de tentatives atteint');
      return false;
    }

    setIsRecovering(true);
    setRetryCount(prev => prev + 1);

    logger.info(`🔄 Tentative de récupération ${retryCount + 1}/${maxRetryAttempts}...`);

    try {
      // Arrêter tout ce qui est en cours
      if (isRecording) {
        await new Promise<void>((resolve) => {
          NativeAudioCaptureModule.stopRecording();
          setTimeout(resolve, 100);
        });
      }

      // Nettoyer les ressources
      NativeAudioCaptureModule.dispose();

      // Attendre un moment avant de réessayer
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Réinitialiser l'état
      setIsInitialized(false);
      setIsRecording(false);
      setIsPaused(false);
      setCaptureState('uninitialized');

      // Tenter de réinitialiser
      const success = await initialize();

      if (success) {
        logger.info('✅ Récupération réussie');
        setRetryCount(0);
        setLastError(null);
        setIsRecovering(false);
        return true;
      } else {
        logger.warn('❌ Échec de la récupération');
        setIsRecovering(false);
        return false;
      }
    } catch (recoveryError) {
      logger.error('❌ Erreur lors de la récupération:', recoveryError);
      setIsRecovering(false);
      return false;
    }
  }, [enableErrorRecovery, retryCount, maxRetryAttempts, isRecording, createError]);

  // Initialiser le module
  const initialize = useCallback(async () => {
    try {
      logger.debug('🎤 Initialisation du module audio...');

      // Vérifier les permissions sur mobile
      if (Platform.OS !== 'web') {
        const permissionGranted = await new Promise<boolean>((resolve) => {
          NativeAudioCaptureModule.requestPermission((granted) => {
            setHasPermission(granted);
            resolve(granted);
          });
        });

        if (!permissionGranted) {
          const error = createError(
            'PERMISSION_DENIED',
            'Permission microphone refusée',
            'initialize'
          );
          onError?.(error);
          Alert.alert(
            'Permission requise',
            "L'accès au microphone est nécessaire pour enregistrer l'audio.",
          );
          return false;
        }
      }

      // Initialiser le module avec la configuration
      const success = NativeAudioCaptureModule.initialize(config);

      if (success) {
        setIsInitialized(true);
        setCaptureState('initialized');

        // Configurer les callbacks
        if (onError) {
          NativeAudioCaptureModule.setErrorCallback((nativeError) => {
            const error = createError(
              'NATIVE_MODULE_ERROR',
              nativeError,
              'native_callback'
            );
            onError(error);

            // Tenter une récupération automatique
            if (enableErrorRecovery) {
              attemptRecovery(error);
            }
          });
        }

        if (onStateChange) {
          NativeAudioCaptureModule.setStateChangeCallback(
            (oldState, newState) => {
              setCaptureState(newState);
              onStateChange(oldState, newState);
            },
          );
        }

        if (onAnalysis) {
          NativeAudioCaptureModule.setAnalysisCallback(onAnalysis, 100); // Mise à jour toutes les 100ms
        }

        // Récupérer les informations des périphériques
        const devices = NativeAudioCaptureModule.getAvailableDevices();
        setAvailableDevices(devices);

        const currentDev = NativeAudioCaptureModule.getCurrentDevice();
        setCurrentDevice(currentDev);

        logger.debug('✅ Module audio initialisé avec succès');
        logger.debug(`📱 Périphériques disponibles: ${devices.length}`);
        return true;
      } else {
        logger.error("❌ Échec de l'initialisation du module audio");
        return false;
      }
    } catch (error) {
      const audioError = createError(
        'INITIALIZATION_FAILED',
        `Erreur lors de l'initialisation: ${String(error)}`,
        'initialize'
      );
      onError?.(audioError);

      // Tenter une récupération
      if (enableErrorRecovery) {
        attemptRecovery(audioError);
      }

      return false;
    }
  }, [config, onError, onStateChange, onAnalysis, createError, attemptRecovery, enableErrorRecovery]);

  // Démarrer l'enregistrement
  const startRecording = useCallback(
    async (filePath: string, recordingOptions?: RecordingOptions) => {
      try {
        if (!isInitialized) {
          const initialized = await initialize();
          if (!initialized) return false;
        }

        logger.debug("🎤 Démarrage de l'enregistrement...");

        const success = NativeAudioCaptureModule.startRecording(
          filePath,
          recordingOptions,
        );

        if (success) {
          setIsRecording(true);
          setIsPaused(false);

          // Démarrer la mise à jour des niveaux
          if (analysisIntervalRef.current) {
            clearInterval(analysisIntervalRef.current);
          }

          analysisIntervalRef.current = setInterval(() => {
            const level = NativeAudioCaptureModule.getCurrentLevel();
            const peak = NativeAudioCaptureModule.getPeakLevel();
            const rms = NativeAudioCaptureModule.getRMS();
            const rmsDB = NativeAudioCaptureModule.getRMSdB();
            const silent = NativeAudioCaptureModule.isSilent(0.01);
            const clipping = NativeAudioCaptureModule.hasClipping();
            const stats = NativeAudioCaptureModule.getStatistics();

            setCurrentLevel(level);
            setPeakLevel(peak);
            setRmsLevel(rms);
            setRmsLevelDB(rmsDB);
            setIsSilent(silent);
            setHasClipping(clipping);
            setStatistics(stats);

            const info = NativeAudioCaptureModule.getRecordingInfo();
            if (info) {
              setRecordingInfo(info);
            }
          }, 100);

          logger.debug('✅ Enregistrement démarré');
          return true;
        } else {
          logger.error("❌ Échec du démarrage de l'enregistrement");
          return false;
        }
      } catch (error) {
        const audioError = createError(
          'RECORDING_FAILED',
          `Erreur lors du démarrage de l'enregistrement: ${String(error)}`,
          'startRecording'
        );
        onError?.(audioError);
        return false;
      }
    },
    [isInitialized, initialize, onError, createError],
  );

  // Arrêter l'enregistrement
  const stopRecording = useCallback(() => {
    try {
      logger.debug("🎤 Arrêt de l'enregistrement...");

      const success = NativeAudioCaptureModule.stopRecording();

      if (success) {
        setIsRecording(false);
        setIsPaused(false);

        // Arrêter la mise à jour des niveaux
        if (analysisIntervalRef.current) {
          clearInterval(analysisIntervalRef.current);
          analysisIntervalRef.current = null;
        }

        // Récupérer les informations finales
        const info = NativeAudioCaptureModule.getRecordingInfo();
        setRecordingInfo(info);

        logger.debug('✅ Enregistrement arrêté');
        return true;
      } else {
        logger.error("❌ Échec de l'arrêt de l'enregistrement");
        return false;
      }
    } catch (error) {
      const audioError = createError(
        'STOP_RECORDING_FAILED',
        `Erreur lors de l'arrêt de l'enregistrement: ${String(error)}`,
        'stopRecording'
      );
      onError?.(audioError);
      return false;
    }
  }, [onError, createError]);

  // Mettre en pause l'enregistrement
  const pauseRecording = useCallback(() => {
    try {
      const success = NativeAudioCaptureModule.pauseRecording();
      if (success) {
        setIsPaused(true);
        logger.debug('⏸️ Enregistrement mis en pause');
      }
      return success;
    } catch (error) {
      const audioError = createError(
        'PAUSE_RECORDING_FAILED',
        `Erreur lors de la mise en pause: ${String(error)}`,
        'pauseRecording'
      );
      onError?.(audioError);
      return false;
    }
  }, [onError, createError]);

  // Reprendre l'enregistrement
  const resumeRecording = useCallback(() => {
    try {
      const success = NativeAudioCaptureModule.resumeRecording();
      if (success) {
        setIsPaused(false);
        logger.debug('▶️ Enregistrement repris');
      }
      return success;
    } catch (error) {
      const audioError = createError(
        'RESUME_RECORDING_FAILED',
        `Erreur lors de la reprise: ${String(error)}`,
        'resumeRecording'
      );
      onError?.(audioError);
      return false;
    }
  }, [onError, createError]);

  // Analyser un fichier audio
  const analyzeAudioFile = useCallback(
    async (filePath: string) => {
      try {
        logger.debug('📊 Analyse du fichier audio:', filePath);
        return new Promise((resolve, reject) => {
          NativeAudioCaptureModule.analyzeAudioFile(filePath, (analysis) => {
            logger.debug('✅ Analyse terminée:', analysis);
            resolve(analysis);
          });
        });
      } catch (error) {
        const audioError = createError(
          'ANALYSIS_FAILED',
          `Erreur lors de l'analyse: ${String(error)}`,
          'analyzeAudioFile'
        );
        onError?.(audioError);
        return null;
      }
    },
    [onError],
  );

  // Sélectionner un périphérique audio
  const selectDevice = useCallback((deviceId: string) => {
    try {
      const success = NativeAudioCaptureModule.selectDevice(deviceId);
      if (success) {
        const currentDev = NativeAudioCaptureModule.getCurrentDevice();
        setCurrentDevice(currentDev);
        logger.debug('✅ Périphérique audio sélectionné:', currentDev?.name);
      }
      return success;
    } catch (error) {
      const audioError = createError(
        'DEVICE_SELECTION_FAILED',
        `Erreur lors de la sélection du périphérique: ${String(error)}`,
        'selectDevice'
      );
      onError?.(audioError);
      return false;
    }
  }, [onError, createError]);

  // Mettre à jour la configuration
  const updateConfig = useCallback((newConfig: Partial<AudioCaptureConfig>) => {
    try {
      const currentConfig = NativeAudioCaptureModule.getConfig();
      const updatedConfig = { ...currentConfig, ...newConfig };
      const success = NativeAudioCaptureModule.updateConfig(updatedConfig);
      if (success) {
        logger.debug('✅ Configuration audio mise à jour:', newConfig);
      }
      return success;
    } catch (error) {
      const audioError = createError(
        'CONFIG_UPDATE_FAILED',
        `Erreur lors de la mise à jour de la configuration: ${String(error)}`,
        'updateConfig'
      );
      onError?.(audioError);
      return false;
    }
  }, [onError, createError]);

  // Réinitialiser les statistiques
  const resetStatistics = useCallback(() => {
    try {
      NativeAudioCaptureModule.resetStatistics();
      setStatistics(null);
      logger.debug('📊 Statistiques réinitialisées');
    } catch (error) {
      const audioError = createError(
        'STATISTICS_RESET_FAILED',
        `Erreur lors de la réinitialisation des statistiques: ${String(error)}`,
        'resetStatistics'
      );
      onError?.(audioError);
    }
  }, [onError, createError]);

  // Réinitialiser le niveau de crête
  const resetPeakLevel = useCallback(() => {
    try {
      NativeAudioCaptureModule.resetPeakLevel();
      setPeakLevel(0);
      logger.debug('🔝 Niveau de crête réinitialisé');
    } catch (error) {
      const audioError = createError(
        'PEAK_RESET_FAILED',
        `Erreur lors de la réinitialisation du niveau de crête: ${String(error)}`,
        'resetPeakLevel'
      );
      onError?.(audioError);
    }
  }, [onError, createError]);

  // Nettoyer les ressources
  const cleanup = useCallback(() => {
    try {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }

      if (isRecording) {
        NativeAudioCaptureModule.stopRecording();
      }

      NativeAudioCaptureModule.dispose();
      setIsInitialized(false);
      setIsRecording(false);
      setIsPaused(false);
      setCaptureState('uninitialized');

      logger.debug('🧹 Ressources audio nettoyées');
    } catch (error) {
      logger.error('❌ Erreur lors du nettoyage:', error);
    }
  }, [isRecording]);

  // Initialiser automatiquement si demandé
  useEffect(() => {
    if (autoRequestPermission && !isInitialized) {
      initialize();
    }

    return () => {
      cleanup();
    };
  }, []);

  return {
    // État
    isInitialized,
    isLoading: !isInitialized || isRecovering,
    isRecording,
    isPaused,
    captureState,
    hasPermission,
    recordingInfo,

    // Niveaux audio
    currentLevel,
    peakLevel,
    rmsLevel,
    rmsLevelDB,
    isSilent,
    hasClipping,

    // Périphériques audio
    availableDevices,
    currentDevice,
    selectDevice,

    // Statistiques
    statistics,
    resetStatistics,
    resetPeakLevel,

    // Gestion d'erreurs
    lastError,
    errorCount,
    isRecovering,
    retryCount,
    createError,
    attemptRecovery,

    // Configuration
    updateConfig,

    // Actions
    initialize,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    analyzeAudioFile,
    cleanup,

    // Module direct (pour les fonctionnalités avancées)
    nativeModule: NativeAudioCaptureModule,
  };
}
