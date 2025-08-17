import { useEffect, useState, useRef, useCallback } from "react";
import { NativeModules, NativeEventEmitter, Platform } from "react-native";

// Import avec vérification de sécurité
let AudioEqualizerService: any = null;
try {
  const audioEqualizerModule = require("../../native-modules/audio-equalizer/src");
  AudioEqualizerService = audioEqualizerModule?.AudioEqualizerService;
} catch (error) {
  AudioEqualizerService = null;
}

const { AudioEqualizer } = NativeModules;

interface UseVideoAudioEqualizerProps {
  videoUri: string;
  enabled?: boolean;
  onEqualizerReady?: () => void;
}

interface VideoAudioEqualizerState {
  isReady: boolean;
  isProcessing: boolean;
  currentGains: number[];
  currentPreset: string;
  cpuUsage: number;
}

export function useVideoAudioEqualizer({
  videoUri,
  enabled = true,
  onEqualizerReady,
}: UseVideoAudioEqualizerProps) {
  const [state, setState] = useState<VideoAudioEqualizerState>({
    isReady: false,
    isProcessing: false,
    currentGains: Array(10).fill(0),
    currentPreset: "Flat",
    cpuUsage: 0,
  });

  const videoRef = useRef<{ getAudioSessionId?: () => string | number } | null>(
    null
  );
  const audioSessionId = useRef<string | null>(null);
  const eventEmitter = useRef<NativeEventEmitter | null>(null);

  // Vérifier si l'égaliseur est disponible
  const isEqualizerAvailable = useCallback(() => {
    return AudioEqualizer && AudioEqualizerService;
  }, []);

  // Initialisation de l'égaliseur pour la vidéo
  const initializeForVideo = useCallback(async () => {
    try {
      if (!enabled || !videoUri || !isEqualizerAvailable()) {
        // Marquer comme prêt même si l'égaliseur n'est pas disponible
        setState((prev) => ({ ...prev, isReady: true }));
        onEqualizerReady?.();
        return;
      }

      // Initialiser le service d'égaliseur avec try-catch
      try {
        await AudioEqualizerService.initialize();
      } catch (serviceError) {
        // Continuer sans égaliseur
        setState((prev) => ({ ...prev, isReady: true }));
        onEqualizerReady?.();
        return;
      }

      // Créer une session audio pour cette vidéo
      try {
        if (Platform.OS === "ios") {
          audioSessionId.current = await AudioEqualizer.createAudioSession(
            videoUri
          );
        } else {
          // Android: attacher l'égaliseur à l'audio session ID du player
          audioSessionId.current = "android-session-" + Date.now();
        }
      } catch (sessionError) {}

      // Configurer les event listeners avec vérifications
      try {
        if (AudioEqualizer) {
          eventEmitter.current = new NativeEventEmitter(AudioEqualizer);

          eventEmitter.current.addListener("onSpectrumData", (data) => {});

          eventEmitter.current.addListener("onAudioLevel", (level) => {
            setState((prev) => ({ ...prev, cpuUsage: level.cpuUsage || 0 }));
          });
        }
      } catch (listenerError) {}

      setState((prev) => ({ ...prev, isReady: true }));
      onEqualizerReady?.();
    } catch (error) {
      // Marquer comme prêt pour éviter de bloquer l'interface
      setState((prev) => ({ ...prev, isReady: true }));
      onEqualizerReady?.();
    }
  }, [videoUri, enabled, onEqualizerReady, isEqualizerAvailable]);

  // Attacher l'égaliseur au lecteur vidéo
  const attachToVideoPlayer = useCallback(
    (playerRef: any) => {
      if (!playerRef || !audioSessionId.current || !isEqualizerAvailable()) {
        return;
      }

      try {
        videoRef.current = playerRef;

        if (Platform.OS === "ios") {
          // iOS: Utiliser AVAudioEngine pour intercepter l'audio
          AudioEqualizer.attachToVideoPlayer(audioSessionId.current, playerRef);
        } else {
          // Android: Utiliser l'AudioEffect API
          const audioSessionIdFromPlayer = playerRef.getAudioSessionId?.();
          if (audioSessionIdFromPlayer) {
            AudioEqualizer.attachToAudioSession(audioSessionIdFromPlayer);
          }
        }
      } catch (error) {}
    },
    [isEqualizerAvailable]
  );

  // Appliquer les gains en temps réel
  const applyGains = useCallback(
    async (gains: number[]) => {
      if (
        !state.isReady ||
        !audioSessionId.current ||
        !isEqualizerAvailable()
      ) {
        return;
      }

      try {
        setState((prev) => ({ ...prev, isProcessing: true }));

        // Appliquer les gains via le service
        await AudioEqualizerService.setGains(gains);

        // Notifier le moteur natif pour traitement temps réel
        if (AudioEqualizer && audioSessionId.current) {
          await AudioEqualizer.applyGainsToSession(
            audioSessionId.current,
            gains
          );
        }

        setState((prev) => ({
          ...prev,
          currentGains: gains,
          isProcessing: false,
        }));
      } catch (error) {
        setState((prev) => ({ ...prev, isProcessing: false }));
      }
    },
    [state.isReady, isEqualizerAvailable]
  );

  // Charger un preset
  const loadPreset = useCallback(
    async (presetName: string) => {
      if (!state.isReady || !isEqualizerAvailable()) {
        return;
      }

      try {
        setState((prev) => ({ ...prev, isProcessing: true }));

        await AudioEqualizerService.loadPreset(presetName);
        const gains = AudioEqualizerService.getCurrentGainsSync();

        await applyGains(gains);

        setState((prev) => ({
          ...prev,
          currentPreset: presetName,
          isProcessing: false,
        }));
      } catch (error) {
        setState((prev) => ({ ...prev, isProcessing: false }));
      }
    },
    [state.isReady, applyGains, isEqualizerAvailable]
  );

  // Préparer l'export avec les effets appliqués
  const prepareExport = useCallback(async () => {
    if (
      !state.isReady ||
      !audioSessionId.current ||
      !videoUri ||
      !isEqualizerAvailable()
    ) {
      // Retourner un objet d'export par défaut
      return {
        sessionId: null,
        hasEqualizer: false,
      };
    }

    try {
      const exportConfig = {
        videoUri,
        audioSessionId: audioSessionId.current,
        gains: state.currentGains,
        preset: state.currentPreset,
        // Options d'export audio
        audioCodec: "aac",
        audioBitrate: 256000,
        audioSampleRate: 44100,
      };

      // Préparer l'export côté natif
      const exportSession = await AudioEqualizer.prepareVideoExport(
        exportConfig
      );

      return exportSession;
    } catch (error) {
      // Retourner un objet d'export par défaut
      return {
        sessionId: null,
        hasEqualizer: false,
      };
    }
  }, [state, videoUri, isEqualizerAvailable]);

  // Nettoyer les ressources
  const cleanup = useCallback(() => {
    try {
      if (audioSessionId.current && AudioEqualizer) {
        AudioEqualizer.destroyAudioSession(audioSessionId.current);
        audioSessionId.current = null;
      }

      if (eventEmitter.current) {
        eventEmitter.current.removeAllListeners("onSpectrumData");
        eventEmitter.current.removeAllListeners("onAudioLevel");
        eventEmitter.current = null;
      }

      setState({
        isReady: false,
        isProcessing: false,
        currentGains: Array(10).fill(0),
        currentPreset: "Flat",
        cpuUsage: 0,
      });
    } catch (error) {}
  }, []);

  // Effets
  useEffect(() => {
    initializeForVideo();
    return cleanup;
  }, [videoUri, enabled]);

  return {
    // État
    isReady: state.isReady,
    isProcessing: state.isProcessing,
    currentGains: state.currentGains,
    currentPreset: state.currentPreset,
    cpuUsage: state.cpuUsage,

    // Actions
    attachToVideoPlayer,
    applyGains,
    loadPreset,
    prepareExport,
    cleanup,
  };
}
