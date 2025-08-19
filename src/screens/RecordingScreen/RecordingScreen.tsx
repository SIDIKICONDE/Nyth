import React, { useCallback, useEffect } from "react";
import { View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { VideoFile } from "react-native-vision-camera";

import {
  RecordingScreenNavigationProp,
  RecordingScreenRouteProp,
} from "./types";

import {
  LoadingScreen,
  ErrorScreen,
  RecordingErrorBoundary,
} from "./components";

import { CameraRecorder } from "./components/CameraRecorder";
import { TeleprompterSettings } from "@/components/recording/teleprompter/types";
import { TeleprompterSettingsModal } from "@/components/recording/teleprompter/TeleprompterSettingsModal";

import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/hooks/useAuth";
import { createLogger } from "@/utils/optimizedLogger";

import { useRecordingPermissions } from "./hooks/useRecordingPermissions";
import { useRecordingState } from "./hooks/useRecordingState";
import { useRecordingHandlers } from "./hooks/useRecordingHandlers";
import { useRecordingData } from "./hooks/useRecordingData";
import { useErrorRecovery } from "./hooks/useErrorRecovery";
import { useEmergencyRecordingSave } from "./hooks/useEmergencyRecordingSave";

import { VideoSaveService } from "./services/videoSaveService";

const logger = createLogger("RecordingScreen");

export default function RecordingScreen() {
  const navigation = useNavigation<RecordingScreenNavigationProp>();
  const route = useRoute<RecordingScreenRouteProp>();
  const { scriptId, settings: routeSettings } = route.params;

  const { user } = useAuth();
  const { t } = useTranslation();

  // Permissions (caméra, micro, stockage)
  const {
    permissions,
    checkAllPermissions,
    requestCameraPermissions,
    hasAllPermissions,
  } = useRecordingPermissions();

  // State principal de l'écran
  const {
    // recording state
    script,
    settings,
    isLoading,
    error,
    isRecording,
    recordingDuration,
    // teleprompter state
    showSettingsModal,
    customSettings,
    scrollSpeed,
    backgroundOpacity,
    // setters
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

  // Chargement des données (script + paramètres)
  const { loadData, updateScript } = useRecordingData({
    scriptId,
    routeSettings: routeSettings || undefined,
    onError: (e) => setError(e.message),
    onDataLoaded: (loadedScript, loadedSettings) => {
      setScript(loadedScript);
      setSettings(loadedSettings);
      setIsLoading(false);
    },
    onTeleprompterSettingsLoaded: (tpSettings: Partial<TeleprompterSettings>) => {
      setCustomTeleprompterSettings(tpSettings);
    },
  });

  // Gestion d'erreurs et récupération
  const { captureError } = useErrorRecovery({
    onError: (e) => logger.error("Unhandled error", e),
  });

  // Callback de complétion d'enregistrement (sauvegarde + navigation)
  const handleRecordingComplete = useCallback(
    async (video: VideoFile) => {
      try {
        const result = await VideoSaveService.saveRecording({
          video,
          recordingDuration,
          script: script || undefined,
          settings: settings || undefined,
          userId: user?.uid,
          onNavigate: () => navigation.navigate("Library"),
          t: (key: string, fallback: string) => (t as any)(key, fallback),
        });

        if (!result.success && result.error) {
          throw result.error;
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        captureError(error, "onRecordingComplete");
        setError(error.message);
      }
    },
    [captureError, navigation, recordingDuration, script, settings, t, user?.uid, setError]
  );

  // Gestionnaires d'événements (start/stop/erreur/back)
  const {
    cameraRecorderRef,
    handleRecordingStart,
    handleRecordingStop,
    handleRecordingError,
    handleRecordingComplete: handlersRecordingComplete,
    handleSettingsPress,
    handleEditText,
    stopActiveRecordingAndGetPath,
  } = useRecordingHandlers({
    isRecording,
    setIsRecording,
    onRecordingComplete: handleRecordingComplete,
    onError: (e) => {
      captureError(e, "recording");
      setError(e.message);
    },
  });

  // Sauvegarde d'urgence (arrêt + sauvegarde minimale)
  const { performEmergencySave } = useEmergencyRecordingSave({
    stopActiveRecordingAndGetPath,
  });

  // Au montage: vérifier les permissions et charger les données
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        const p = await checkAllPermissions();
        if (!p.camera || !p.microphone) {
          await requestCameraPermissions();
        }
        // Charger les données (script + settings)
        await loadData();
      } catch (e) {
        const err = e as Error;
        setError(err.message);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [checkAllPermissions, requestCameraPermissions, loadData, setError, setIsLoading]);

  // Mettre à jour le script si le contexte change (focus/retour)
  useEffect(() => {
    updateScript();
  }, [updateScript]);

  // Rendu conditionnel: chargement/erreur
  if (isLoading || !hasAllPermissions()) {
    const msg = !hasAllPermissions()
      ? t("recording.loading.permissions", "Vérification des permissions...")
      : t("recording.loading.message", "Préparation de l'enregistrement...");
    return (
      <LoadingScreen message={msg} showPermissionStatus={!hasAllPermissions()} />
    );
  }

  if (error) {
    return (
      <ErrorScreen
        error={error}
        onRetry={async () => {
          setError(null);
          setIsLoading(true);
          try {
            await checkAllPermissions();
            await loadData();
          } finally {
            setIsLoading(false);
          }
        }}
        onGoBack={() => navigation.goBack()}
      />
    );
  }

  return (
    <RecordingErrorBoundary
      onError={(e) => {
        captureError(e as any);
        setError((e as any)?.message || "Unknown error");
      }}
    >
      <View style={{ flex: 1, backgroundColor: "#000000" }}>
        <CameraRecorder
          ref={cameraRecorderRef}
          script={script || undefined}
          settings={settings || undefined}
          isRecording={isRecording}
          teleprompterSettings={customSettings}
          scrollSpeed={scrollSpeed}
          backgroundOpacity={backgroundOpacity}
          onSettings={handleSettingsPress(() => setShowSettingsModal(true))}
          onEditText={handleEditText(script?.id)}
          onRecordingStart={handleRecordingStart}
          onRecordingStop={handleRecordingStop}
          onRecordingComplete={handlersRecordingComplete}
          onError={handleRecordingError}
        />

        <TeleprompterSettingsModal
          visible={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          settings={customSettings as Partial<TeleprompterSettings>}
          onSettingsChange={setCustomTeleprompterSettings}
          scrollSpeed={scrollSpeed}
          onScrollSpeedChange={setScrollSpeed}
          backgroundOpacity={backgroundOpacity}
          onBackgroundOpacityChange={setBackgroundOpacity}
        />
      </View>
    </RecordingErrorBoundary>
  );
}


