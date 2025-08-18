import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Camera, CameraPosition, VideoFile } from "react-native-vision-camera";
import { useCamera } from "./hooks/useCamera";
import { useAdvancedCamera } from "./hooks/useAdvancedCamera";
import { CameraControls } from "./components/CameraControls";

interface CameraModuleProps {
  onRecordingComplete?: (video: VideoFile) => void;
  onError?: (error: Error) => void;
  initialPosition?: CameraPosition;
  showControls?: boolean;
  onSettingsPress?: () => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onTeleprompterToggle?: (enabled: boolean) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export const CameraModule: React.FC<CameraModuleProps> = ({
  onRecordingComplete,
  onError,
  initialPosition = "back",
  showControls = true,
  onSettingsPress,
  onRecordingStart,
  onRecordingStop,
  onTeleprompterToggle,
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

  // Hook pour les options avancées
  const {
    config: advancedConfig,
    updateConfig: updateAdvancedConfig,
    capabilities,
    cameraProps,
  } = useAdvancedCamera(position);

  // Les permissions sont désormais gérées en amont par RecordingScreen

  // Gérer la fin de l'enregistrement
  useEffect(() => {
    if (recordingState.videoFile && onRecordingComplete) {
      onRecordingComplete(recordingState.videoFile);
    }
  }, [recordingState.videoFile, onRecordingComplete]);

  // Relayer les événements start/stop aux parents
  useEffect(() => {
    // Utiliser directement les changements d'état au lieu du polling
    if (recordingState.isRecording) {
      onRecordingStart?.();
    } else if (recordingState.videoFile) {
      onRecordingStop?.();
    }
  }, [recordingState.isRecording, recordingState.videoFile, onRecordingStart, onRecordingStop]);

  useEffect(() => {
    onTeleprompterToggle?.(Boolean(advancedConfig.teleprompterEnabled));
  }, [advancedConfig.teleprompterEnabled, onTeleprompterToggle]);

  // Les contrôles sont utilisés directement
  const enhancedControls = controls;

  const shouldShowCamera = Boolean(device);

  return (
    <View style={styles.container}>
      {shouldShowCamera ? (
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device!}
          isActive={true}
          video={true}
          audio={true}
          torch={isFlashOn ? "on" : "off"}
          enableZoomGesture
          {...cameraProps}
        />
      ) : (
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Chargement de la caméra...</Text>
        </View>
      )}

      {showControls && (
        <CameraControls
          controls={enhancedControls}
          recordingState={recordingState}
          position={position}
          isFlashOn={isFlashOn}
          onSettingsPress={onSettingsPress}
          advancedConfig={advancedConfig}
          onAdvancedConfigChange={updateAdvancedConfig}
          capabilities={{
            ...capabilities,
            supportsManualFocus: false, // À implémenter selon les besoins
            supportsManualWhiteBalance: false, // À implémenter selon les besoins
          }}
        />
      )}
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
