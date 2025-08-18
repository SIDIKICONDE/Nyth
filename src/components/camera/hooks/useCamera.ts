import { useState, useEffect, useCallback, useRef } from "react";
import { Alert } from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useMicrophonePermission,
  VideoFile,
  CameraPosition,
} from "react-native-vision-camera";
import { RecordingState, CameraControls } from "../types";

export const useCamera = (initialPosition: CameraPosition = "back") => {
  const [position, setPosition] = useState<CameraPosition>(initialPosition);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
  });
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice(position);

  // Utilisation des hooks natifs de react-native-vision-camera
  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
  const { hasPermission: hasMicrophonePermission, requestPermission: requestMicrophonePermission } = useMicrophonePermission();

  // Timer pour la durée d'enregistrement
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, []);

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
      await cameraRef.current.startRecording({
        onRecordingFinished: (video: VideoFile) => {
          setRecordingState((prev) => ({
            ...prev,
            isRecording: false,
            isPaused: false,
            videoFile: video,
          }));
          if (recordingTimer.current) {
            clearInterval(recordingTimer.current);
          }
        },
        onRecordingError: (_error) => {
          setRecordingState((prev) => ({
            ...prev,
            isRecording: false,
            isPaused: false,
          }));
          if (recordingTimer.current) {
            clearInterval(recordingTimer.current);
          }
        },
      });

      setRecordingState((prev) => ({
        ...prev,
        isRecording: true,
        duration: 0,
      }));

      // Démarrer le timer
      recordingTimer.current = setInterval(() => {
        setRecordingState((prev) => ({
          ...prev,
          duration: prev.duration + 1,
        }));
      }, 1000);
    } catch (error) {}
  }, [hasCameraPermission, hasMicrophonePermission, requestPermissions, recordingState.isRecording]);

  const stopRecording = useCallback(async () => {
    if (!cameraRef.current || !recordingState.isRecording) return;

    try {
      await cameraRef.current.stopRecording();
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    } catch (error) {}
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
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    } catch (error) {}
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

      // Redémarrer le timer
      recordingTimer.current = setInterval(() => {
        setRecordingState((prev) => ({
          ...prev,
          duration: prev.duration + 1,
        }));
      }, 1000);
    } catch (error) {}
  }, [recordingState.isRecording, recordingState.isPaused]);

  const switchCamera = useCallback(() => {
    setPosition((prev) => (prev === "back" ? "front" : "back"));
  }, []);

  const toggleFlash = useCallback(() => {
    setIsFlashOn((prev) => !prev);
  }, []);

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
    isFlashOn,
    recordingState,
    // Permissions natives via react-native-vision-camera
    hasCameraPermission,
    hasMicrophonePermission,
    requestPermissions,
    controls,
  };
};
