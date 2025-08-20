import React, { useEffect, useState, useRef } from "react";
import { View, StatusBar, Text } from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import tw from "twrnc";

import { LoadingScreen } from "./components/LoadingScreen";
import { ErrorScreen } from "./components/ErrorScreen";
import { RecordingErrorBoundary } from "./components/ErrorBoundary";
import { useErrorRecovery } from "./hooks/useErrorRecovery";
import { useEmergencyRecordingSave } from "./hooks/useEmergencyRecordingSave";
import { CameraRecorder } from "./components/CameraRecorder";
import { TeleprompterSettingsModal } from "@/components/recording/teleprompter/TeleprompterSettingsModal";

import { useTheme } from "@/contexts/ThemeContext";
import { useScripts } from "@/contexts/ScriptsContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useGlobalPreferences } from "@/hooks/useGlobalPreferences";
import { useAuth } from "@/contexts/AuthContext";
import { CameraRecorderRef } from "./components/CameraRecorder";

// Hooks personnalisés
import { useRecordingData } from "./hooks/useRecordingData";
import { useRecordingLogic } from "./hooks/useRecordingLogic";
import { useRecordingSave } from "./hooks/useRecordingSave";
import { useRecordingEvents } from "./hooks/useRecordingEvents";

import { createLogger } from "@/utils/optimizedLogger";
import { RootStackParamList, RecordingSettings, Script } from "@/types";
import { TeleprompterSettings } from "@/components/recording/teleprompter/types";

const logger = createLogger("RecordingScreen");

type RecordingScreenRouteProp = RouteProp<RootStackParamList, "Recording">;
type RecordingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Recording"
>;

export default function RecordingScreen() {
  const route = useRoute<RecordingScreenRouteProp>();
  const navigation = useNavigation<RecordingScreenNavigationProp>();
  const { user } = useAuth();
  const { currentTheme } = useTheme();
  const { scripts } = useScripts();
  const { t } = useTranslation();
  const { preferences: globalPreferences, updateTeleprompterSettings } = useGlobalPreferences();

  // Paramètres de route
  const { scriptId, settings: routeSettings } = route.params;

  // Hooks personnalisés
  const {
    script,
    settings,
    isLoading: dataLoading,
    error: dataError,
    loadData,
    setError: setDataError,
  } = useRecordingData({
    scriptId,
    scripts,
    initialSettings: routeSettings,
    onError: (error) => captureError(error, "chargement_donnees"),
  });

  const [isRecording, setIsRecording] = useState(false);
  const {
    recordingDuration,
    startRecording,
    stopRecording,
    handleRecordingError,
    cleanup: cleanupRecording,
  } = useRecordingLogic({
    onRecordingStart: () => setIsRecording(true),
    onRecordingStop: () => setIsRecording(false),
    onRecordingError: (error) => captureError(error, "enregistrement"),
  });

  const { handleRecordingComplete } = useRecordingSave({
    script,
    settings,
    recordingDuration,
    onSaveSuccess: () => navigation.navigate("Home" as never),
    onSaveError: (error) => captureError(error, "sauvegarde"),
  });

  const { setupBackHandler } = useRecordingEvents({
    isRecording,
    onBackPress: () => stopRecording(),
  });

  // Système de récupération d'erreurs
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
      logger.error("Erreur capturée par le système de récupération", err);
    },
    onRecovered: () => {
      logger.info("Récupération réussie - rechargement des données");
      setDataError(null);
      loadData();
    },
  });

  // Sauvegarde d'urgence
  useEmergencyRecordingSave({
    onSaveStarted: () => {
      logger.info("Sauvegarde d'urgence démarrée");
      setDataError("Sauvegarde d'urgence en cours...");
    },
    onSaveCompleted: (savedData) => {
      logger.info("Sauvegarde d'urgence terminée", {
        id: savedData.id,
        duration: savedData.recordingDuration,
        videoPath: savedData.videoPath,
      });
      setDataError(null);
    },
    onSaveFailed: (error) => {
      logger.error("Échec sauvegarde d'urgence", error);
      setDataError(null);
      captureError(error, "sauvegarde_urgence");
    },
    stopActiveRecordingAndGetPath: async () => {
      try {
        if (cameraRecorderRef.current) {
          const videoFile = await cameraRecorderRef.current.stopRecordingAndGetFile();
          if (videoFile) {
            return videoFile.path;
          }
        }
        return null;
      } catch (stopError) {
        logger.error("Erreur lors de l'arrêt d'urgence", stopError);
        return null;
      }
    },
  });

  // États locaux restants
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [customTeleprompterSettings, setCustomTeleprompterSettings] = useState<Partial<TeleprompterSettings>>({
    fontSize: 24,
    textColor: "#FFFFFF",
    backgroundColor: "#000000",
    textAlignment: "center" as const,
    horizontalMargin: 10,
    isMirrored: false,
    textShadow: true,
    startPosition: "top" as const,
    positionOffset: 0,
    hideControls: false,
  });
  const [scrollSpeed, setScrollSpeed] = useState(50);
  const [backgroundOpacity, setBackgroundOpacity] = useState(80);

  // Ref pour le CameraRecorder
  const cameraRecorderRef = useRef<CameraRecorderRef>(null);

  // Charger les données au montage initial
  useEffect(() => {
    loadData();
  }, []);

  // Configuration du back handler
  useEffect(() => {
    return setupBackHandler();
  }, [setupBackHandler]);

  // Charger les réglages de téléprompteur persistés
  useEffect(() => {
    const saved = globalPreferences?.teleprompterSettings as Partial<TeleprompterSettings> | undefined;
    if (saved && Object.keys(saved).length > 0) {
      setCustomTeleprompterSettings((prev) => ({ ...prev, ...saved }));
    }
  }, [globalPreferences?.teleprompterSettings]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      cleanupRecording();
    };
  }, [cleanupRecording]);

  // Affichage de chargement
  if (dataLoading) {
    return (
      <>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={currentTheme.isDark ? "light-content" : "dark-content"}
        />
        <LoadingScreen
          message={t("recording.loading.data", "Chargement du script et des paramètres...")}
          showPermissionStatus={false}
        />
      </>
    );
  }

  // Affichage d'erreur
  if (dataError || recoveryError || !script || !settings) {
    const displayError = recoveryError?.message || dataError || t("recording.error.dataNotFound", "Script ou paramètres introuvables");

    return (
      <>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={currentTheme.isDark ? "light-content" : "dark-content"}
        />
        <ErrorScreen
          error={displayError}
          onRetry={canRecover ? () => {
            if (recoveryError) {
              manualRecovery();
            } else {
              setDataError(null);
              loadData();
            }
          } : undefined}
          onGoBack={() => {
            resetErrorState();
            navigation.goBack();
          }}
        />

        {/* Informations de debug en mode développement */}
        {__DEV__ && errorStats.totalErrors > 0 && (
          <View style={tw`absolute bottom-4 left-4 right-4 bg-gray-800 p-3 rounded-lg`}>
            <Text style={tw`text-xs text-gray-300 text-center`}>
              Debug: {errorStats.totalErrors} erreurs | {errorStats.recoveredErrors} récupérées | Taux: {errorStats.successRate.toFixed(1)}%
            </Text>
          </View>
        )}
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
        captureError(reactError, "react_component");
      }}
      onReset={() => {
        resetErrorState();
        navigation.goBack();
      }}
    >
      <View style={tw`flex-1 bg-black`}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
          hidden={true}
        />

        <CameraRecorder
          ref={cameraRecorderRef}
          onRecordingStart={startRecording}
          onRecordingStop={stopRecording}
          onRecordingComplete={handleRecordingComplete}
          onError={handleRecordingError}
          isRecording={isRecording}
          script={script}
          settings={settings}
          teleprompterSettings={customTeleprompterSettings}
          scrollSpeed={scrollSpeed}
          backgroundOpacity={backgroundOpacity}
          onSettings={() => setShowSettingsModal(true)}
          onEditText={() => navigation.navigate("Editor", { scriptId: script?.id })}
        />

        {/* Modal de réglages du téléprompteur */}
        <TeleprompterSettingsModal
          visible={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          settings={customTeleprompterSettings}
          onSettingsChange={(next) => {
            setCustomTeleprompterSettings(next);
            updateTeleprompterSettings(next);
          }}
          scrollSpeed={scrollSpeed}
          onScrollSpeedChange={setScrollSpeed}
          backgroundOpacity={backgroundOpacity}
          onBackgroundOpacityChange={setBackgroundOpacity}
        />
      </View>
    </RecordingErrorBoundary>
  );
}
