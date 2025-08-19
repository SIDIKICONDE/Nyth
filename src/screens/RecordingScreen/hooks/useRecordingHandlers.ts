import { useCallback, useRef } from "react";
import { Alert, BackHandler } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "@/hooks/useTranslation";
import { createLogger } from "@/utils/optimizedLogger";
import { RecordingScreenNavigationProp } from "../types";
import { ALERT_MESSAGES } from "../constants";
import { CameraRecorderRef } from "../components/CameraRecorder";
import { VideoFile } from "react-native-vision-camera";

const logger = createLogger("useRecordingHandlers");

interface UseRecordingHandlersProps {
  isRecording: boolean;
  setIsRecording: (value: boolean) => void;
  onRecordingComplete: (video: VideoFile) => Promise<void>;
  onError: (error: Error) => void;
}

export function useRecordingHandlers({
  isRecording,
  setIsRecording,
  onRecordingComplete,
  onError,
}: UseRecordingHandlersProps) {
  const navigation = useNavigation<RecordingScreenNavigationProp>();
  const { t } = useTranslation();
  const cameraRecorderRef = useRef<CameraRecorderRef>(null);

  // Handle recording start
  const handleRecordingStart = useCallback(() => {
    logger.info("Recording started");
    setIsRecording(true);
  }, [setIsRecording]);

  // Handle recording stop
  const handleRecordingStop = useCallback(() => {
    logger.info("Recording stopped");
    setIsRecording(false);
  }, [setIsRecording]);

  // Handle recording error
  const handleRecordingError = useCallback((error: Error) => {
    logger.error("Recording error", error);
    setIsRecording(false);
    onError(error);

    Alert.alert(
      t("recording.error.title", ALERT_MESSAGES.recordingError.title),
      error.message,
      [{ text: t("common.ok", "OK") }]
    );
  }, [setIsRecording, onError, t]);

  // Handle back press during recording
  const handleBackPress = useCallback(() => {
    if (isRecording) {
      Alert.alert(
        t("recording.exitWarning.title", ALERT_MESSAGES.exitWarning.title),
        t("recording.exitWarning.message", ALERT_MESSAGES.exitWarning.message),
        [
          {
            text: t("common.cancel", "Annuler"),
            style: "cancel",
          },
          {
            text: t("recording.exitWarning.stop", ALERT_MESSAGES.exitWarning.stop),
            style: "destructive",
            onPress: () => {
              setIsRecording(false);
              navigation.goBack();
            },
          },
        ]
      );
      return true; // Prevent default navigation
    }
    return false; // Allow normal navigation
  }, [isRecording, navigation, setIsRecording, t]);

  // Listen to Android back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => handleBackPress();

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      
      return () => subscription.remove();
    }, [handleBackPress])
  );

  // Emergency stop function for error recovery
  const stopActiveRecordingAndGetPath = useCallback(async () => {
    try {
      if (cameraRecorderRef.current) {
        const videoFile = await cameraRecorderRef.current.stopRecordingAndGetFile();
        if (videoFile) {
          return videoFile.path;
        }
      }
      return null;
    } catch (error) {
      logger.error("Error during emergency stop", error);
      return null;
    }
  }, []);

  // Handle settings modal
  const handleSettingsPress = useCallback((onOpen: () => void) => {
    return () => {
      onOpen();
    };
  }, []);

  // Handle text edit navigation
  const handleEditText = useCallback((scriptId?: string) => {
    return () => {
      if (scriptId) {
        navigation.navigate("Editor", { scriptId });
      }
    };
  }, [navigation]);

  return {
    cameraRecorderRef,
    handleRecordingStart,
    handleRecordingStop,
    handleRecordingError,
    handleRecordingComplete: onRecordingComplete,
    handleBackPress,
    stopActiveRecordingAndGetPath,
    handleSettingsPress,
    handleEditText,
  };
}