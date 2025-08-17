import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  Alert,
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
    isFlashOn,
    recordingState,
    hasCameraPermission,
    hasMicrophonePermission,
    requestPermissions,
    controls,
  } = useCamera(initialPosition);

  // Vérifier les permissions au montage
  useEffect(() => {
    const checkPermissions = async () => {
      if (!hasCameraPermission || !hasMicrophonePermission) {
        const granted = await requestPermissions();
        if (!granted) {
          Alert.alert(
            "Permissions requises",
            "L'application a besoin d'accéder à la caméra et au microphone pour enregistrer.",
            [
              {
                text: "OK",
                onPress: () => onError?.(new Error("Permissions refusées")),
              },
            ]
          );
        }
      }
    };
    checkPermissions();
  }, [
    hasCameraPermission,
    hasMicrophonePermission,
    requestPermissions,
    onError,
  ]);

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
        torch={isFlashOn ? "on" : "off"}
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
