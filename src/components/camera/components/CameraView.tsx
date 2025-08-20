import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
} from "react-native";
import { Camera } from "react-native-vision-camera";
import { useCamera } from "../hooks/useCamera";
import { useAdvancedCamera } from "../hooks/useAdvancedCamera";

interface CameraViewProps {
  onRecordingComplete?: (video: any) => void;
  onError?: (error: Error) => void;
  initialPosition?: "front" | "back";
}

export const CameraView: React.FC<CameraViewProps> = ({
  onRecordingComplete,
  onError: _onError,
  initialPosition = "back",
}) => {
  const {
    cameraRef,
    device,
    flash,
    recordingState,
    hasCameraPermission,
    hasMicrophonePermission,
    setStartRecordingOptions,
  } = useCamera(initialPosition);

  // Appliquer également les options issues du hook avancé au cas où ce composant est utilisé seul
  const { cameraProps, recordingOptions } = useAdvancedCamera(initialPosition);

  useEffect(() => {
    if (recordingOptions) {
      setStartRecordingOptions({
        fileType: recordingOptions.fileType as any,
        videoCodec: recordingOptions.videoCodec as any,
        videoBitRate: (recordingOptions as any).videoBitRate,
        audioBitRate: (recordingOptions as any).audioBitRate,
      });
    }
  }, [recordingOptions, setStartRecordingOptions]);

  // Les permissions sont désormais gérées par l'écran parent (RecordingScreen)

  // Gérer la fin de l'enregistrement
  useEffect(() => {
    if (recordingState.videoFile && onRecordingComplete) {
      onRecordingComplete(recordingState.videoFile);
    }
  }, [recordingState.videoFile, onRecordingComplete]);

  if (!device) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Chargement de la caméra...</Text>
      </View>
    );
  }

  if (!hasCameraPermission || !hasMicrophonePermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Veuillez autoriser l'accès à la caméra et au microphone
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        video={true}
        audio={true}
        torch={flash}
        enableZoomGesture
        photo={true}
        {...cameraProps}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 20,
    fontSize: 16,
  },
  permissionText: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
