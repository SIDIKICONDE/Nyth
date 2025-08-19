import React, { useEffect, useCallback, useRef } from "react";
import { View, Alert, StatusBar, BackHandler, Platform, Linking } from "react-native";
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import tw from "twrnc";

// Components
import { LoadingScreen } from "./components/LoadingScreen";
import { ErrorScreen } from "./components/ErrorScreen";
import { RecordingErrorBoundary } from "./components/ErrorBoundary";
import { CameraRecorder, CameraRecorderRef } from "./components/CameraRecorder";
import { TeleprompterSettingsModal } from "@/components/recording/teleprompter/TeleprompterSettingsModal";

// Hooks
import { useErrorRecovery } from "./hooks/useErrorRecovery";
import { useEmergencyRecordingSave } from "./hooks/useEmergencyRecordingSave";
import { useRecordingState } from "./hooks/useRecordingState";
import { useRecordingData } from "./hooks/useRecordingData";
import { useRecordingHandlers } from "./hooks/useRecordingHandlers";
import { useRecordingPermissions } from "./hooks/useRecordingPermissions";

// Contexts
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useGlobalPreferences } from "@/hooks/useGlobalPreferences";

// Types
import { RecordingScreenRouteProp, RecordingScreenNavigationProp, RecordingScreenProps } from "./types";
import { createLogger } from "@/utils/optimizedLogger";

const logger = createLogger("RecordingScreen");

export default function RecordingScreen({}: RecordingScreenProps) {
  const route = useRoute<RecordingScreenRouteProp>();
  const navigation = useNavigation<RecordingScreenNavigationProp>();
  const cameraRecorderRef = useRef<CameraRecorderRef>(null);
  
  // Contexts
  const { user } = useAuth();
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { preferences: globalPreferences, updateTeleprompterSettings } = useGlobalPreferences();

  // State management
  const {
    recordingState,
    teleprompterState,
    updateRecordingState,
    updateTeleprompterState,
    startRecordingTimer,
    stopRecordingTimer,
    resetRecordingDuration,
  } = useRecordingState();

  // Load recording data
  const { loadingError: dataLoadingError } = useRecordingData({
    scriptId: route.params?.scriptId,
    settings: route.params?.settings,
    onDataLoaded: (script, settings) => {
      updateRecordingState({
        script,
        settings,
        isLoading: false,
        error: null,
      });
    },
    onError: (error) => {
      updateRecordingState({
        isLoading: false,
        error: error.message,
      });
    },
  });

  // Error recovery system
  const {
    error: recoveryError,
    retryCount,
    canRecover,
    captureError,
    manualRecovery,
    resetErrorState,
    errorStats,
  } = useErrorRecovery({
    maxRetries: 3,
    autoRecovery: true,
    onError: (err) => {
      logger.error("Error captured by recovery system", err);
    },
    onRecovered: () => {
      logger.info("Recovery successful - reloading data");
      updateRecordingState({ error: null, isLoading: true });
    },
  });

  // Emergency save
  useEmergencyRecordingSave({
    onSaveStarted: () => {
      logger.info("Emergency save started");
      updateRecordingState({ isLoading: true });
    },
    onSaveCompleted: (savedData) => {
      logger.info("Emergency save completed", {
        id: savedData.id,
        duration: savedData.recordingDuration,
        videoPath: savedData.videoPath,
      });
      updateRecordingState({ isLoading: false });
    },
    onSaveFailed: (error) => {
      logger.error("Emergency save failed", error);
      updateRecordingState({ isLoading: false });
      Alert.alert(
        t("recording.emergencySave.failed.title"),
        t("recording.emergencySave.failed.message"),
        [{ text: t("common.ok") }]
      );
    },
  });

  // Recording handlers
  const {
    handleStartRecording,
    handleStopRecording,
    handleRecordingError,
    handleRecordingSuccess,
  } = useRecordingHandlers({
    user,
    script: recordingState.script,
    settings: recordingState.settings,
    onRecordingStarted: () => {
      updateRecordingState({ isRecording: true });
      startRecordingTimer();
    },
    onRecordingStopped: () => {
      updateRecordingState({ isRecording: false });
      stopRecordingTimer();
    },
    onRecordingSuccess: (recording) => {
      navigation.navigate("Editor", { recording });
    },
    onRecordingError: (error) => {
      captureError(error);
      Alert.alert(
        t("recording.error.title"),
        t("recording.error.message"),
        [
          {
            text: t("common.retry"),
            onPress: () => manualRecovery(),
          },
          {
            text: t("common.cancel"),
            style: "cancel",
          },
        ]
      );
    },
  });

  // Permissions
  const { hasPermissions, requestPermissions } = useRecordingPermissions({
    onPermissionDenied: () => {
      Alert.alert(
        t("permissions.denied.title"),
        t("permissions.denied.message"),
        [
          {
            text: t("permissions.openSettings"),
            onPress: () => {
              if (Platform.OS === "ios") {
                Linking.openURL("app-settings:");
              } else {
                Linking.openSettings();
              }
            },
          },
          {
            text: t("common.cancel"),
            onPress: () => navigation.goBack(),
            style: "cancel",
          },
        ]
      );
    },
  });

  // Handle back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (recordingState.isRecording) {
          Alert.alert(
            t("recording.exitWhileRecording.title"),
            t("recording.exitWhileRecording.message"),
            [
              {
                text: t("common.cancel"),
                style: "cancel",
              },
              {
                text: t("common.confirm"),
                onPress: () => {
                  handleStopRecording();
                  navigation.goBack();
                },
                style: "destructive",
              },
            ]
          );
          return true;
        }
        return false;
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [recordingState.isRecording, navigation, t, handleStopRecording])
  );

  // Request permissions on mount
  useEffect(() => {
    requestPermissions();
  }, [requestPermissions]);

  // Handle teleprompter settings
  const handleTeleprompterSettingsChange = useCallback((settings: any) => {
    updateTeleprompterState({ customSettings: settings });
    updateTeleprompterSettings(settings);
  }, [updateTeleprompterState, updateTeleprompterSettings]);

  // Camera recorder handlers
  const handleCameraReady = useCallback(() => {
    logger.info("Camera ready");
  }, []);

  const handleCameraError = useCallback((error: any) => {
    logger.error("Camera error", error);
    captureError(error);
  }, [captureError]);

  // Show loading screen
  if (recordingState.isLoading) {
    return <LoadingScreen />;
  }

  // Show error screen
  const currentError = recordingState.error || dataLoadingError || recoveryError;
  if (currentError && !canRecover) {
    return (
      <ErrorScreen
        error={currentError}
        onRetry={manualRecovery}
        onGoBack={() => navigation.goBack()}
        retryCount={retryCount}
        errorStats={errorStats}
      />
    );
  }

  // Show permissions error
  if (!hasPermissions) {
    return (
      <ErrorScreen
        error={t("permissions.required")}
        onRetry={requestPermissions}
        onGoBack={() => navigation.goBack()}
      />
    );
  }

  return (
    <RecordingErrorBoundary
      onError={captureError}
      fallback={(error, retry) => (
        <ErrorScreen
          error={error.message}
          onRetry={retry}
          onGoBack={() => navigation.goBack()}
        />
      )}
    >
      <View style={tw`flex-1 bg-black`}>
        <StatusBar hidden />
        
        <CameraRecorder
          ref={cameraRecorderRef}
          script={recordingState.script}
          settings={recordingState.settings}
          teleprompterSettings={teleprompterState.customSettings}
          isRecording={recordingState.isRecording}
          recordingDuration={recordingState.recordingDuration}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onError={handleCameraError}
          onReady={handleCameraReady}
          onRecordingSuccess={handleRecordingSuccess}
          onOpenTeleprompterSettings={() => 
            updateTeleprompterState({ showSettingsModal: true })
          }
        />

        <TeleprompterSettingsModal
          visible={teleprompterState.showSettingsModal}
          onClose={() => updateTeleprompterState({ showSettingsModal: false })}
          settings={teleprompterState.customSettings}
          onSettingsChange={handleTeleprompterSettingsChange}
          scrollSpeed={teleprompterState.scrollSpeed}
          onScrollSpeedChange={(speed) => 
            updateTeleprompterState({ scrollSpeed: speed })
          }
          backgroundOpacity={teleprompterState.backgroundOpacity}
          onBackgroundOpacityChange={(opacity) => 
            updateTeleprompterState({ backgroundOpacity: opacity })
          }
        />
      </View>
    </RecordingErrorBoundary>
  );
}