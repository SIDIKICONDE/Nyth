import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
} from "react-native";
import {
  Camera,
  CameraPosition,
 
  VideoFile,
} from "react-native-vision-camera";
import { useCamera } from "./hooks/useCamera";
import { useAdvancedCamera } from "./hooks/useAdvancedCamera";
import { CameraControls } from "./components/CameraControls";
import type { RecordingState } from "./types";

interface CameraModuleProps {
  onRecordingComplete?: (video: VideoFile) => void;
  onError?: (error: Error) => void;
  initialPosition?: CameraPosition;
  showControls?: boolean;
  onSettingsPress?: () => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onTeleprompterToggle?: (enabled: boolean) => void;
  onRecordingStateChange?: (state: RecordingState) => void;
  onProvideEmergencyStop?: (fn: () => Promise<string | null>) => void;
}

export const CameraModule: React.FC<CameraModuleProps> = ({
  onRecordingComplete,
  initialPosition = "back",
  showControls = true,
  onSettingsPress,
  onRecordingStart,
  onRecordingStop,
  onTeleprompterToggle,
  onRecordingStateChange,
  onProvideEmergencyStop,
}) => {
  const {
    cameraRef,
    device,
    position,
    flash,
    recordingState,
    controls,
    setStartRecordingOptions,
    stopRecordingAndGetFile,
  } = useCamera(initialPosition);

  // Hook pour les options avancées
  const {
    config: advancedConfig,
    updateConfig: updateAdvancedConfig,
    capabilities,
    cameraProps,
    recordingOptions,
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

  // Propager tout changement d'état d'enregistrement (inclut pause/reprise)
  useEffect(() => {
    onRecordingStateChange?.(recordingState);
  }, [recordingState, onRecordingStateChange]);

  // Exposer une fonction d'arrêt d'urgence qui retourne le chemin du fichier
  useEffect(() => {
    if (!onProvideEmergencyStop) return;
    const provider = async () => {
      const file = await stopRecordingAndGetFile();
      return file?.path ?? null;
    };
    onProvideEmergencyStop(provider);
  }, [onProvideEmergencyStop, stopRecordingAndGetFile]);

  // Mettre à jour les options d'enregistrement lorsque la config avancée change
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
          torch={flash}
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
          flash={flash}
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
