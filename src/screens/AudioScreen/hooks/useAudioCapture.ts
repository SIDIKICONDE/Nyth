import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import NativeAudioCaptureModule, {
  AudioCaptureConfig,
  CaptureState,
  AudioAnalysis,
  RecordingInfo,
  RecordingOptions,
} from '../../../../specs/NativeAudioCaptureModule';
import { createOptimizedLogger } from '@/utils/optimizedLogger';

const logger = createOptimizedLogger('useAudioCapture');

interface UseAudioCaptureOptions {
  autoRequestPermission?: boolean;
  config?: AudioCaptureConfig;
  onError?: (error: string) => void;
  onStateChange?: (oldState: CaptureState, newState: CaptureState) => void;
  onAnalysis?: (analysis: AudioAnalysis) => void;
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

  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialiser le module
  const initialize = useCallback(async () => {
    try {
      logger.debug('🎤 Initialisation du module audio...');

      // Vérifier les permissions sur mobile
      if (Platform.OS !== 'web') {
        const permissionGranted =
          await NativeAudioCaptureModule.requestPermission();
        setHasPermission(permissionGranted);

        if (!permissionGranted) {
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
          NativeAudioCaptureModule.setErrorCallback(onError);
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

        logger.debug('✅ Module audio initialisé avec succès');
        return true;
      } else {
        logger.error("❌ Échec de l'initialisation du module audio");
        return false;
      }
    } catch (error) {
      logger.error("❌ Erreur lors de l'initialisation:", error);
      onError?.(String(error));
      return false;
    }
  }, [config, onError, onStateChange, onAnalysis]);

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
            setCurrentLevel(level);
            setPeakLevel(peak);

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
        logger.error("❌ Erreur lors du démarrage de l'enregistrement:", error);
        onError?.(String(error));
        return false;
      }
    },
    [isInitialized, initialize, onError],
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
      logger.error("❌ Erreur lors de l'arrêt de l'enregistrement:", error);
      onError?.(String(error));
      return false;
    }
  }, [onError]);

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
      logger.error('❌ Erreur lors de la mise en pause:', error);
      onError?.(String(error));
      return false;
    }
  }, [onError]);

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
      logger.error('❌ Erreur lors de la reprise:', error);
      onError?.(String(error));
      return false;
    }
  }, [onError]);

  // Analyser un fichier audio
  const analyzeAudioFile = useCallback(
    async (filePath: string) => {
      try {
        logger.debug('📊 Analyse du fichier audio:', filePath);
        const analysis = await NativeAudioCaptureModule.analyzeAudioFile(
          filePath,
        );
        logger.debug('✅ Analyse terminée:', analysis);
        return analysis;
      } catch (error) {
        logger.error("❌ Erreur lors de l'analyse:", error);
        onError?.(String(error));
        return null;
      }
    },
    [onError],
  );

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

      NativeAudioCaptureModule.release();
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
    isRecording,
    isPaused,
    captureState,
    hasPermission,
    recordingInfo,

    // Niveaux audio
    currentLevel,
    peakLevel,

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
