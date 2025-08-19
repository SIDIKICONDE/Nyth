import { useState, useEffect, useCallback, useRef } from "react";
import { Alert } from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useMicrophonePermission,
  VideoFile,
  CameraPosition,
  CameraProps,
} from "react-native-vision-camera";
import { RecordingState, CameraControls } from "../types";

// Options supplémentaires pour l'enregistrement, compatibles avec react-native-vision-camera
// Note: selon la version, certains champs peuvent être ignorés par la plateforme
interface StartRecordingExtraOptions {
  fileType?: "mp4" | "mov";
  videoCodec?: "h264" | "h265" | string;
  videoBitRate?: number;
  audioBitRate?: number;
}

export const useCamera = (initialPosition: CameraPosition = "back") => {
  const [position, setPosition] = useState<CameraPosition>(initialPosition);
  const [flash, setFlash] = useState<CameraProps["torch"]>("off");
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    videoFile: undefined, // S'assurer que videoFile est initialisé
  });
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice(position);

  // Options d'enregistrement dynamiques, alimentées depuis l'UI avancée
  const startOptionsRef = useRef<Partial<StartRecordingExtraOptions> | undefined>(
    undefined
  );
  // Pour permettre d'attendre la fin d'enregistrement quand on stoppe de force
  const stopResolverRef = useRef<((file: VideoFile | null) => void) | null>(null);

  // Utilisation des hooks natifs de react-native-vision-camera
  const {
    hasPermission: hasCameraPermission,
    requestPermission: requestCameraPermission,
  } = useCameraPermission();
  const {
    hasPermission: hasMicrophonePermission,
    requestPermission: requestMicrophonePermission,
  } = useMicrophonePermission();

  // Gestion centralisée du timer pour la durée d'enregistrement
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (recordingState.isRecording && !recordingState.isPaused) {
      timer = setInterval(() => {
        setRecordingState((prev) => ({
          ...prev,
          duration: prev.duration + 1,
        }));
      }, 1000);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [recordingState.isRecording, recordingState.isPaused]);

  const requestPermissions = useCallback(async () => {
    const cameraGranted = await requestCameraPermission();
    const microphoneGranted = await requestMicrophonePermission();
    return cameraGranted && microphoneGranted;
  }, [requestCameraPermission, requestMicrophonePermission]);

  const startRecording = useCallback(async () => {
    if (!cameraRef.current || recordingState.isRecording) return;

    // Vérifier les permissions avant l'enregistrement
    if (!hasCameraPermission || !hasMicrophonePermission) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          "Permissions requises",
          "L'accès à la caméra et au microphone est nécessaire pour enregistrer."
        );
        return;
      }
    }

    try {
      const extraOptions = startOptionsRef.current || {};
      await cameraRef.current.startRecording({
        // Ces options sont ignorées si non supportées par la plateforme
        fileType: extraOptions.fileType as any,
        videoCodec: extraOptions.videoCodec as any,
        // Certains champs peuvent ne pas être pris en charge selon la version/lib

        onRecordingFinished: (video: VideoFile) => {
          setRecordingState((prev) => ({
            ...prev,
            isRecording: false,
            isPaused: false,
            videoFile: video,
          }));
          // Résoudre toute attente en cours déclenchée par stopRecordingAndGetFile()
          if (stopResolverRef.current) {
            stopResolverRef.current(video);
            stopResolverRef.current = null;
          }
        },
        onRecordingError: (error) => {
          console.error("Recording Error:", error);
          setRecordingState((prev) => ({
            ...prev,
            isRecording: false,
            isPaused: false,
            error: error.message,
          }));
          if (stopResolverRef.current) {
            stopResolverRef.current(null);
            stopResolverRef.current = null;
          }
        },
      });

      setRecordingState((prev) => ({
        ...prev,
        isRecording: true,
        isPaused: false, // S'assurer que isPaused est false au démarrage
        duration: 0,
        videoFile: undefined,
        error: undefined,
      }));
    } catch (error) {
      console.error("Failed to start recording:", error);
      setRecordingState((prev) => ({
        ...prev,
        isRecording: false,
        error:
          error instanceof Error ? error.message : "Erreur de démarrage inconnue",
      }));
    }
  }, [
    hasCameraPermission,
    hasMicrophonePermission,
    requestPermissions,
    recordingState.isRecording,
  ]);

  const stopRecording = useCallback(async () => {
    if (!cameraRef.current || !recordingState.isRecording) return;

    try {
      await cameraRef.current.stopRecording();
      // L'état est déjà géré par onRecordingFinished
    } catch (error) {
      console.error("Failed to stop recording:", error);
    }
  }, [recordingState.isRecording]);

  const pauseRecording = useCallback(async () => {
    if (
      !cameraRef.current ||
      !recordingState.isRecording ||
      recordingState.isPaused
    )
      return;

    try {
      await cameraRef.current.pauseRecording();
      setRecordingState((prev) => ({ ...prev, isPaused: true }));
    } catch (error) {
      console.error("Failed to pause recording:", error);
    }
  }, [recordingState.isRecording, recordingState.isPaused]);

  const resumeRecording = useCallback(async () => {
    if (
      !cameraRef.current ||
      !recordingState.isRecording ||
      !recordingState.isPaused
    )
      return;

    try {
      await cameraRef.current.resumeRecording();
      setRecordingState((prev) => ({ ...prev, isPaused: false }));
    } catch (error) {
      console.error("Failed to resume recording:", error);
    }
  }, [recordingState.isRecording, recordingState.isPaused]);

  const switchCamera = useCallback(() => {
    setPosition((prev) => (prev === "back" ? "front" : "back"));
  }, []);

  const toggleFlash = useCallback(() => {
    setFlash((prev) => (prev === "off" ? "on" : "off"));
  }, []);

  // Permet de mettre à jour dynamiquement les options de démarrage d'enregistrement
  const setStartRecordingOptions = useCallback(
    (options?: Partial<StartRecordingExtraOptions>) => {
      startOptionsRef.current = options;
    },
    []
  );

  // Stoppe l'enregistrement en cours et renvoie le fichier vidéo une fois disponible
  const stopRecordingAndGetFile = useCallback(async (): Promise<VideoFile | null> => {
    try {
      if (!cameraRef.current) return null;
      if (!recordingState.isRecording) {
        return recordingState.videoFile ?? null;
      }
      return await new Promise<VideoFile | null>(async (resolve) => {
        stopResolverRef.current = resolve;
        try {
          await cameraRef.current!.stopRecording();
        } catch (e) {
          resolve(null);
        }
      });
    } catch (error) {
      return null;
    }
  }, [recordingState.isRecording, recordingState.videoFile]);

  const controls: CameraControls = {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    switchCamera,
    toggleFlash,
  };

  return {
    cameraRef,
    device,
    position,
    flash,
    recordingState,
    // Permissions natives via react-native-vision-camera
    hasCameraPermission,
    hasMicrophonePermission,
    requestPermissions,
    controls,
    setStartRecordingOptions,
    stopRecordingAndGetFile,
  };
};
