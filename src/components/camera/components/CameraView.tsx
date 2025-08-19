import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Camera } from "react-native-vision-camera";
import { useCamera } from "../hooks/useCamera";

interface CameraViewProps {
  onRecordingComplete?: (video: any) => void;
  onError?: (error: Error) => void;
  initialPosition?: "front" | "back";
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export const CameraView: React.FC<CameraViewProps> = ({
  onRecordingComplete,
  onError,
  initialPosition = "back",
}) => {
  const {
    cameraRef,
    device,
    position,
    flash,
    recordingState,
    hasCameraPermission,
    hasMicrophonePermission,
    requestPermissions,
    controls,
  } = useCamera(initialPosition);

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
