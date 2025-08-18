import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Dimensions,
} from "react-native";
import { CameraPosition, CameraProps } from "react-native-vision-camera";
import { CameraControls as CameraControlsType, RecordingState } from "../types";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { AdvancedCameraSettings } from "./AdvancedCameraSettings";
import type { AdvancedCameraConfig } from "../types/advanced";
import { ManualControls } from "./ManualControls";
import { CameraPresets } from "./CameraPresets";

interface CameraControlsProps {
  controls: CameraControlsType;
  recordingState: RecordingState;
  position: CameraPosition;
  flash: CameraProps["torch"];
  onSettingsPress?: () => void;
  // Options avancées
  advancedConfig?: AdvancedCameraConfig;
  onAdvancedConfigChange?: (config: AdvancedCameraConfig) => void;
  capabilities?: {
    maxZoom: number;
    minZoom: number;
    supportsHDR: boolean;
    supportsLowLight: boolean;
    supportedResolutions: string[];
    supportedCodecs: string[];
    supportsManualFocus: boolean;
    supportsManualWhiteBalance: boolean;
  };
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Calculs responsifs pour l'espacement
const getResponsiveSpacing = () => {
  const baseSpacing = 12;
  const buttonSize = 52;
  const minSpacing = 8;
  const maxSpacing = 20;

  // Espacement adaptatif basé sur la largeur d'écran
  const responsiveSpacing = Math.max(
    minSpacing,
    Math.min(maxSpacing, screenWidth * 0.04)
  );

  return {
    buttonSpacing: responsiveSpacing,
    containerPadding: Math.max(16, screenWidth * 0.05),
    buttonSize,
    bottomPadding: Math.max(30, screenHeight * 0.04),
  };
};

const responsiveLayout = getResponsiveSpacing();

export const CameraControls: React.FC<CameraControlsProps> = ({
  controls,
  recordingState,
  position,
  flash,
  onSettingsPress,
  advancedConfig,
  onAdvancedConfigChange,
  capabilities,
}) => {
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showManualControls, setShowManualControls] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.bottomBar}>
        <View style={styles.leftGroup}>
          <TouchableOpacity
            style={[
              styles.floatingButton,
              flash !== "off" && styles.floatingButtonActive,
            ]}
            onPress={controls.toggleFlash}
          >
            <MaterialCommunityIcons
              name={flash === "on" ? "flash" : "flash-off"}
              size={22}
              color="#FFFFFF"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={controls.switchCamera}
          >
            <MaterialCommunityIcons
              name="camera-flip"
              size={22}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.rightGroup}>
          <TouchableOpacity
            style={[
              styles.floatingButton,
              recordingState.isPaused && styles.floatingButtonActive,
            ]}
            onPress={
              recordingState.isPaused
                ? controls.resumeRecording
                : controls.pauseRecording
            }
          >
            <MaterialCommunityIcons
              name={recordingState.isPaused ? "play" : "pause"}
              size={22}
              color="#FFFFFF"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => setShowAdvancedSettings(true)}
          >
            <MaterialCommunityIcons name="tune" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.centerRecordButton} pointerEvents="box-none">
        <TouchableOpacity
          style={[
            styles.floatingRecordButton,
            recordingState.isRecording && styles.floatingRecordButtonActive,
          ]}
          onPress={
            recordingState.isRecording
              ? controls.stopRecording
              : controls.startRecording
          }
        >
          <View
            style={[
              styles.recordButtonInner,
              recordingState.isRecording && styles.recordButtonInnerActive,
            ]}
          />
        </TouchableOpacity>
      </View>

      {recordingState.isRecording && (
        <View style={styles.timerBottomOverlay} pointerEvents="none">
          <View style={styles.floatingTimerContainer}>
            <View
              style={[
                styles.recordingDot,
                recordingState.isPaused && styles.recordingPaused,
              ]}
            />
            <Text style={styles.timerText}>
              {formatDuration(recordingState.duration)}
            </Text>
          </View>
        </View>
      )}

      {/* Options avancées */}
      {advancedConfig && onAdvancedConfigChange && capabilities && (
        <>
          <AdvancedCameraSettings
            visible={showAdvancedSettings}
            onClose={() => setShowAdvancedSettings(false)}
            config={advancedConfig}
            onConfigChange={onAdvancedConfigChange}
            capabilities={capabilities}
          />

          <ManualControls
            visible={showManualControls && advancedConfig.manualControls}
            zoom={advancedConfig.zoom}
            exposure={advancedConfig.exposure}
            iso={advancedConfig.iso}
            onZoomChange={(value) =>
              onAdvancedConfigChange({ ...advancedConfig, zoom: value })
            }
            onExposureChange={(value) =>
              onAdvancedConfigChange({ ...advancedConfig, exposure: value })
            }
            onIsoChange={(value) =>
              onAdvancedConfigChange({ ...advancedConfig, iso: value })
            }
            capabilities={{
              maxZoom: capabilities.maxZoom,
              minZoom: capabilities.minZoom,
              supportsManualFocus: capabilities.supportsManualFocus,
              supportsManualWhiteBalance:
                capabilities.supportsManualWhiteBalance,
            }}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
    pointerEvents: "box-none",
    zIndex: 9998,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: responsiveLayout.containerPadding,
    paddingBottom: responsiveLayout.bottomPadding,
    pointerEvents: "box-none",
    minHeight: responsiveLayout.buttonSize + responsiveLayout.bottomPadding * 2,
  },
  centerRecordButton: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: responsiveLayout.bottomPadding - 10,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveLayout.buttonSpacing,
    pointerEvents: "auto",
    justifyContent: "flex-start",
    minWidth: responsiveLayout.buttonSize * 2 + responsiveLayout.buttonSpacing,
  },
  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveLayout.buttonSpacing,
    pointerEvents: "auto",
    justifyContent: "flex-end",
    minWidth: responsiveLayout.buttonSize * 2 + responsiveLayout.buttonSpacing,
  },
  floatingButton: {
    width: responsiveLayout.buttonSize,
    height: responsiveLayout.buttonSize,
    borderRadius: responsiveLayout.buttonSize / 2,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.25)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
    // Amélioration tactile
    minWidth: 44, // Taille minimale recommandée pour le touch
    minHeight: 44,
  },
  floatingButtonActive: {
    backgroundColor: "rgba(255, 193, 7, 0.9)",
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  floatingRecordButton: {
    width: Math.max(80, screenWidth * 0.2),
    height: Math.max(80, screenWidth * 0.2),
    borderRadius: Math.max(40, screenWidth * 0.1),
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.5)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    // Taille maximale pour éviter d'être trop grand sur les tablettes
    maxWidth: 100,
    maxHeight: 100,
  },
  floatingRecordButtonActive: {
    backgroundColor: "rgba(220, 53, 69, 0.95)",
    borderColor: "rgba(255, 255, 255, 0.7)",
  },
  recordButtonInner: {
    width: Math.max(58, Math.max(80, screenWidth * 0.2) * 0.73),
    height: Math.max(58, Math.max(80, screenWidth * 0.2) * 0.73),
    borderRadius: Math.max(29, Math.max(80, screenWidth * 0.2) * 0.365),
    backgroundColor: "#dc3545",
    maxWidth: 73,
    maxHeight: 73,
  },
  recordButtonInnerActive: {
    borderRadius: 8,
    width: Math.max(38, Math.max(80, screenWidth * 0.2) * 0.48),
    height: Math.max(38, Math.max(80, screenWidth * 0.2) * 0.48),
    backgroundColor: "#FFFFFF",
    maxWidth: 48,
    maxHeight: 48,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#dc3545",
    marginRight: 8,
  },
  recordingPaused: {
    backgroundColor: "#ffc107",
  },
  floatingTimerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  timerBottomOverlay: {
    position: "absolute",
    left: responsiveLayout.containerPadding / 2,
    bottom: responsiveLayout.bottomPadding + responsiveLayout.buttonSize + 20,
    alignItems: "flex-start",
    justifyContent: "center",
    zIndex: 9999,
  },
  timerText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "400",
    fontVariant: ["tabular-nums"],
  },
});
