import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StatusBar, View, Alert, Platform } from "react-native";
import tw from "twrnc";
import { RouteProp, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { VideoFile } from "react-native-vision-camera";

import { useTheme } from "@/contexts/ThemeContext";
import { useScripts } from "@/contexts/ScriptsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useGlobalPreferences } from "@/hooks/useGlobalPreferences";
import { createLogger } from "@/utils/optimizedLogger";

import { RootStackParamList, Recording as RecordingType, Script, RecordingSettings } from "@/types";

import { RecordingScreenNavigationProp, RecordingScreenRouteProp, RecordingScreenProps } from "./types";
import { DEFAULT_TELEPROMPTER_SETTINGS, ERROR_RECOVERY_CONFIG } from "./constants";
import { useRecordingData, useRecordingPermissions, useRecordingState, useRecordingHandlers, useEmergencyRecordingSave, useErrorRecovery } from "./hooks";
import { LoadingScreen, ErrorScreen, RecordingErrorBoundary } from "./components";
import { CameraRecorder, CameraRecorderRef } from "./components/CameraRecorder";

import hybridStorageService, { VIDEO_DIR } from "@/services/firebase/hybridStorageService";
import { RecordingBackupManager } from "@/services/autoSave";
import { FileManager } from "@/services/social-share/utils/fileManager";

const logger = createLogger("RecordingScreen");

export default function RecordingScreen({}: RecordingScreenProps) {
  const route = useRoute<RecordingScreenRouteProp>();
  const navigation = useNavigation<RecordingScreenNavigationProp>();
  const { user } = useAuth();
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const { scriptId, settings: routeSettings } = route.params;

  const {
    script,
    settings,
    isLoading,
    error,
    isRecording,
    recordingDuration,
    showSettingsModal,
    customSettings,
    scrollSpeed,
    backgroundOpacity,
    setScript,
    setSettings,
    setIsLoading,
    setError,
    setIsRecording,
    setShowSettingsModal,
    setCustomTeleprompterSettings,
    setScrollSpeed,
    setBackgroundOpacity,
  } = useRecordingState();

  // Permissions (ne s’exécute qu’au montage)
  const { permissions, hasAllPermissions } = useRecordingPermissions();

  // Charger données script + settings
  const { loadData, updateScript } = useRecordingData({
    scriptId,
    routeSettings: routeSettings as RecordingSettings | undefined,
    onError: (err) => {
      setError(err.message);
    },
    onDataLoaded: (loadedScript, loadedSettings) => {
      setScript(loadedScript);
      setSettings(loadedSettings);
      setIsLoading(false);
    },
    onTeleprompterSettingsLoaded: (tp) => {
      setCustomTeleprompterSettings({ ...DEFAULT_TELEPROMPTER_SETTINGS, ...tp });
    },
  });

  // Récupération erreurs
  const {
    error: recoveryError,
    retryCount,
    canRecover,
    captureError,
    manualRecovery,
    resetErrorState,
    errorStats,
  } = useErrorRecovery(ERROR_RECOVERY_CONFIG);

  // Charger au montage
  useEffect(() => {
    setIsLoading(true);
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mettre à jour le script si le contexte change
  useFocusEffect(
    useCallback(() => {
      updateScript();
      return () => {};
    }, [updateScript])
  );

  // Handlers enregistrement
  const {
    cameraRecorderRef,
    handleRecordingStart,
    handleRecordingStop,
    handleRecordingError,
    handleRecordingComplete,
    stopActiveRecordingAndGetPath,
    handleSettingsPress,
    handleEditText,
  } = useRecordingHandlers({
    isRecording,
    setIsRecording,
    onRecordingComplete: async (video: VideoFile) => {
      try {
        await hybridStorageService.initializeLocalStorage();
        const userId = user?.uid || "guest";
        const recordingId = await hybridStorageService.saveRecording(
          userId,
          video.path,
          recordingDuration,
          script?.id,
          script?.title
        );

        const savedVideoPath = `${VIDEO_DIR}${recordingId}.mp4`;
        const RNFS = require("react-native-fs");
        const savedFileExists = await RNFS.exists(savedVideoPath);
        const videoUriWithPrefix = savedVideoPath.startsWith("file://")
          ? savedVideoPath
          : `file://${savedVideoPath}`;

        const newRecording: RecordingType = {
          id: recordingId,
          videoUri: videoUriWithPrefix,
          uri: videoUriWithPrefix,
          duration: recordingDuration,
          scriptId: script?.id,
          scriptTitle: script?.title,
          createdAt: new Date().toISOString(),
          quality: settings?.quality || "high",
          videoSettings: settings?.videoSettings,
        };

        await RecordingBackupManager.saveRecording(newRecording);

        let savedToGallery = false;
        try {
          savedToGallery = await FileManager.saveToGallery(videoUriWithPrefix);
        } catch (galleryError) {
          logger.error("Erreur sauvegarde galerie", galleryError);
        }

        if (savedToGallery) {
          navigation.navigate("Home" as never);
        } else {
          Alert.alert(
            t("recording.gallery.errorTitle", "Galerie non disponible"),
            t(
              "recording.gallery.errorMessage",
              "La vidéo a été sauvegardée localement. Vous pourrez réessayer l'export vers la galerie depuis votre bibliothèque."
            ),
            [
              { text: t("common.ok", "OK"), onPress: () => navigation.navigate("Home" as never) },
              {
                text: t("common.retry", "Réessayer"),
                onPress: async () => {
                  await FileManager.saveToGallery(videoUriWithPrefix);
                  navigation.navigate("Home" as never);
                },
              },
            ]
          );
        }
      } catch (e) {
        logger.error("Erreur lors de la sauvegarde de l'enregistrement", e);
        const fallbackId = `rec_${Date.now()}`;
        const fallbackVideoUri = video.path.startsWith("file://")
          ? video.path
          : `file://${video.path}`;
        const fallbackRecording: RecordingType = {
          id: fallbackId,
          videoUri: fallbackVideoUri,
          uri: fallbackVideoUri,
          duration: recordingDuration,
          scriptId: script?.id,
          scriptTitle: script?.title,
          createdAt: new Date().toISOString(),
          quality: settings?.quality || "high",
          videoSettings: settings?.videoSettings,
        };
        try {
          await RecordingBackupManager.saveRecording(fallbackRecording);
          const savedToGallery = await FileManager.saveToGallery(fallbackVideoUri);
          if (savedToGallery) {
            navigation.navigate("Home" as never);
          } else {
            Alert.alert(
              t("recording.error.title", "Erreur"),
              t(
                "recording.gallery.partialSave",
                "L'enregistrement a été sauvegardé localement mais n'a pas pu être exporté dans la galerie."
              ),
              [{ text: t("common.ok", "OK"), onPress: () => navigation.navigate("Home" as never) }]
            );
          }
        } catch (backupError) {
          logger.error("Erreur sauvegarde de secours", backupError);
          navigation.navigate("Home" as never);
        }
      }
    },
    onError: (e) => captureError(e, "enregistrement" as any),
  });

  // Sauvegarde d'urgence
  useEmergencyRecordingSave({
    onSaveStarted: () => setIsLoading(true),
    onSaveCompleted: () => setIsLoading(false),
    onSaveFailed: () => setIsLoading(false),
    stopActiveRecordingAndGetPath,
  });

  // Rendu
  if (isLoading) {
    return (
      <>
        <StatusBar translucent backgroundColor="transparent" barStyle={currentTheme.isDark ? "light-content" : "dark-content"} />
        <LoadingScreen
          message={t(
            "recording.loading.data",
            "Chargement du script et des paramètres..."
          )}
          showPermissionStatus={false}
        />
      </>
    );
  }

  if (error || recoveryError || !script || !settings) {
    const displayError =
      recoveryError?.message ||
      error ||
      t("recording.error.dataNotFound", "Script ou paramètres introuvables");

    return (
      <>
        <StatusBar translucent backgroundColor="transparent" barStyle={currentTheme.isDark ? "light-content" : "dark-content"} />
        <ErrorScreen
          error={displayError}
          onRetry={
            canRecover
              ? () => {
                  if (recoveryError) {
                    manualRecovery();
                  } else {
                    setError(null);
                    setIsLoading(true);
                    loadData();
                  }
                }
              : undefined
          }
          onGoBack={() => {
            resetErrorState();
            navigation.goBack();
          }}
        />
      </>
    );
  }

  return (
    <RecordingErrorBoundary
      onError={(reactError, errorInfo) => {
        logger.error("Erreur React capturée par ErrorBoundary", {
          error: reactError.message,
          componentStack: errorInfo.componentStack,
        });
        captureError(reactError as any, "react_component" as any);
      }}
      onReset={() => {
        resetErrorState();
        navigation.goBack();
      }}
    >
      <View style={tw`flex-1 bg-black`}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" hidden={true} />

        <CameraRecorder
          ref={cameraRecorderRef}
          onRecordingStart={handleRecordingStart}
          onRecordingStop={handleRecordingStop}
          onRecordingComplete={handleRecordingComplete}
          onError={handleRecordingError}
          isRecording={isRecording}
          script={script || undefined}
          settings={settings || undefined}
          onSettings={handleSettingsPress(() => setShowSettingsModal(true))}
          onEditText={handleEditText(script?.id)}
          teleprompterSettings={customSettings}
          scrollSpeed={scrollSpeed}
          backgroundOpacity={backgroundOpacity}
        />
      </View>
    </RecordingErrorBoundary>
  );
}

