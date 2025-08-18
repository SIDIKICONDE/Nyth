import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Alert, StatusBar, BackHandler, Text } from "react-native";
import {
  RouteProp,
  useRoute,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";
import { LoadingScreen } from "./components/LoadingScreen";
import { ErrorScreen } from "./components/ErrorScreen";
import { RecordingErrorBoundary } from "./components/ErrorBoundary";
import { MemoryIndicator } from "./components/MemoryIndicator";
import { useErrorRecovery } from "./hooks/useErrorRecovery";
import { useMemoryMonitor } from "./hooks/useMemoryMonitor";
import { useEmergencyRecordingSave } from "./hooks/useEmergencyRecordingSave";
import { CameraRecorder } from "./components/CameraRecorder";
import { TeleprompterSettingsModal } from "@/components/recording/teleprompter/TeleprompterSettingsModal";

import { useTheme } from "@/contexts/ThemeContext";
import { useScripts } from "@/contexts/ScriptsContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useSimplePermissions } from "@/hooks/useSimplePermissions";
import { RootStackParamList, RecordingSettings, Script } from "@/types";
import { TeleprompterSettings } from "@/components/recording/teleprompter/types";
import { VideoCodec, VideoQuality, VideoStabilization } from "@/types/video";
import { useAuth } from "@/contexts/AuthContext";
import hybridStorageService, {
  VIDEO_DIR,
} from "@/services/firebase/hybridStorageService";
import { RecordingBackupManager } from "@/services/autoSave";
import { Recording } from "@/types";
import { VideoFile } from "react-native-vision-camera";
import { createLogger } from "@/utils/optimizedLogger";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGlobalPreferences } from "@/hooks/useGlobalPreferences";

const logger = createLogger("RecordingScreen");

type RecordingScreenRouteProp = RouteProp<RootStackParamList, "Recording">;
type RecordingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Recording"
>;

interface RecordingScreenProps {}

export default function RecordingScreen({}: RecordingScreenProps) {
  const route = useRoute<RecordingScreenRouteProp>();
  const navigation = useNavigation<RecordingScreenNavigationProp>();
  const { user } = useAuth();

  const { currentTheme } = useTheme();
  const { scripts } = useScripts();
  const { t } = useTranslation();
  const { permissions, requestPermissions, needsPermission, openSettings } =
    useSimplePermissions();
  const { preferences: globalPreferences, updateTeleprompterSettings } =
    useGlobalPreferences();

  // Système de récupération d'erreurs
  const {
    error: recoveryError,
    isRecovering,
    retryCount,
    canRecover,
    captureError,
    manualRecovery,
    resetErrorState,
    safeExecute,
    errorStats,
  } = useErrorRecovery({
    maxRetries: 3,
    autoRecovery: true,
    onError: (err) => {
      logger.error("Erreur capturée par le système de récupération", err);
    },
    onRecovered: () => {
      logger.info("Récupération réussie - rechargement des données");
      setError(null);
      setIsLoading(true);
    },
  });

  // Sauvegarde d'urgence
  const {
    performEmergencySave,
    getEmergencyRecordings,
    checkForRecoveryData,
    isSaving: isEmergencySaving,
  } = useEmergencyRecordingSave({
    onSaveStarted: () => {
      logger.info("Sauvegarde d'urgence démarrée");
      setIsLoading(true);
    },
    onSaveCompleted: (savedData) => {
      logger.info("Sauvegarde d'urgence terminée", {
        id: savedData.id,
        duration: savedData.recordingDuration,
        videoPath: savedData.videoPath,
      });
      setIsLoading(false);
    },
    onSaveFailed: (error) => {
      logger.error("Échec sauvegarde d'urgence", error);
      setIsLoading(false);
      captureError(error, "sauvegarde_urgence");
    },
  });

  // Surveillance mémoire
  const {
    memoryStats,
    isMonitoring: isMemoryMonitoring,
    memoryStatus,
    recommendations,
    startMonitoring: startMemoryMonitoring,
    stopMonitoring: stopMemoryMonitoring,
    optimizeMemory,
    formatMemorySize,
  } = useMemoryMonitor({
    warningThreshold: 75,
    criticalThreshold: 85,
    monitoringInterval: 3000,
    onWarning: (stats) => {
      logger.warn("Mémoire faible détectée pendant l'enregistrement", {
        percentage: stats.percentage,
        used: formatMemorySize(stats.used),
        trend: stats.trend,
      });
    },
    onCritical: (stats) => {
      logger.error("Mémoire critique pendant l'enregistrement", stats);
      // Capturer comme erreur pour déclencher les mécanismes de récupération
      captureError(
        new Error(`Mémoire critique: ${stats.percentage.toFixed(1)}% utilisée`),
        "memoire_critique"
      );
    },
    onLowMemory: async () => {
      logger.error("Arrêt forcé de l'enregistrement - mémoire insuffisante");
      setIsRecording(false);

      Alert.alert(
        "Mémoire insuffisante",
        "L'enregistrement a été arrêté pour éviter un crash.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    },
  });

  // Paramètres de l'écran
  const { scriptId, settings: routeSettings } = route.params;

  // État local
  const [script, setScript] = useState<Script | null>(null);
  const [settings, setSettings] = useState<RecordingSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // État pour le modal de réglages
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [customTeleprompterSettings, setCustomTeleprompterSettings] = useState<
    Partial<TeleprompterSettings>
  >({
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

  // Timer pour suivre la durée d'enregistrement
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Charger le script et les paramètres
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      logger.info("Chargement des données d'enregistrement", { scriptId });

      // Ne PAS vérifier les permissions ici - on le fera quand l'utilisateur cliquera sur enregistrer

      // Charger le script
      const foundScript = scripts.find((s) => s.id === scriptId);
      if (!foundScript) {
        throw new Error("Script non trouvé");
      }
      setScript(foundScript);

      // Charger les paramètres
      let recordingSettings = routeSettings;
      if (!recordingSettings) {
        try {
          const savedSettings = await AsyncStorage.getItem("recordingSettings");
          if (savedSettings) {
            recordingSettings = JSON.parse(savedSettings);
          }
        } catch (storageError) {
          logger.warn(
            "Impossible de charger les paramètres sauvegardés",
            storageError
          );
        }
      }

      // Utiliser les paramètres par défaut si aucun n'est trouvé
      if (!recordingSettings) {
        recordingSettings = {
          audioEnabled: true,
          videoEnabled: true,
          quality: "high",
          countdown: 3,
          fontSize: 24,
          textColor: "#ffffff",
          horizontalMargin: 0,
          isCompactMode: false,
          scrollSpeed: 50,
          isMirrored: false,
          isMicEnabled: true,
          isVideoEnabled: true,
          textAlignment: "center",
          textShadow: false,
          showCountdown: true,
          countdownDuration: 3,
          videoQuality: "720p",
          scrollAreaTop: 15,
          scrollAreaBottom: 20,
          scrollStartLevel: 5,
          videoSettings: {
            codec: VideoCodec.H264,
            quality: VideoQuality["720p"],
            stabilization: VideoStabilization.auto,
          },
        };
      }

      setSettings(recordingSettings);

      logger.info("Données chargées avec succès", {
        scriptTitle: foundScript.title,
        settingsKeys: Object.keys(recordingSettings),
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erreur inconnue");
      const errorMessage = error.message;

      logger.error("Erreur lors du chargement", error);

      // Capturer l'erreur dans le système de récupération
      captureError(error, "chargement_donnees");

      setError(errorMessage);

      // Afficher une alerte seulement si ce n'est pas une erreur récupérable
      if (
        !error.message.includes("permission") &&
        !error.message.includes("camera")
      ) {
        Alert.alert(
          t("recording.error.loadError", "Erreur de chargement"),
          errorMessage,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [scriptId, routeSettings, scripts, captureError, t, navigation]);

  useEffect(() => {
    loadData();
  }, []);

  // Charger les réglages de téléprompteur persistés
  useEffect(() => {
    const saved = globalPreferences?.teleprompterSettings as
      | Partial<TeleprompterSettings>
      | undefined;
    if (saved && Object.keys(saved).length > 0) {
      setCustomTeleprompterSettings((prev) => ({ ...prev, ...saved }));
    }
  }, [globalPreferences?.teleprompterSettings]);

  useEffect(() => {
    if (!scriptId) return;
    const updated = scripts.find((s) => s.id === scriptId);
    if (updated) setScript(updated);
  }, [scripts, scriptId]);

  useFocusEffect(
    useCallback(() => {
      if (scriptId) {
        const updated = scripts.find((s) => s.id === scriptId);
        if (updated) setScript(updated);
      }
      return () => {};
    }, [scriptId, scripts])
  );

  // Gestion du bouton retour pendant l'enregistrement
  const handleBackPress = useCallback(() => {
    if (isRecording) {
      Alert.alert(
        t("recording.exitWarning.title", "Enregistrement en cours"),
        t(
          "recording.exitWarning.message",
          "Voulez-vous vraiment arrêter l'enregistrement et quitter ?"
        ),
        [
          {
            text: t("common.cancel", "Annuler"),
            style: "cancel",
          },
          {
            text: t("recording.exitWarning.stop", "Arrêter et quitter"),
            style: "destructive",
            onPress: () => {
              setIsRecording(false);
              navigation.goBack();
            },
          },
        ]
      );
      return true; // Empêcher la navigation par défaut
    }
    return false; // Permettre la navigation normale
  }, [isRecording, navigation, t]);

  // Écouter le bouton retour Android
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

  // Callbacks pour les événements d'enregistrement
  const handleRecordingStart = useCallback(() => {
    logger.info("Enregistrement démarré depuis RecordingScreen");
    setIsRecording(true);
    setRecordingDuration(0);

    // Nettoyer tout timer existant avant d'en créer un nouveau
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // Démarrer le timer de durée
    recordingTimerRef.current = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);

    // Démarrer le monitoring mémoire
    startMemoryMonitoring();
  }, [startMemoryMonitoring]);

  const handleRecordingStop = useCallback(() => {
    logger.info("Enregistrement arrêté depuis RecordingScreen");
    setIsRecording(false);

    // Arrêter le timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // Arrêter le monitoring mémoire
    stopMemoryMonitoring();
  }, [stopMemoryMonitoring]);

  const handleRecordingError = useCallback(
    (error: string) => {
      logger.error("Erreur d'enregistrement", error);
      setIsRecording(false);

      // Arrêter le timer en cas d'erreur
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      // Capturer l'erreur
      captureError(new Error(error), "enregistrement");

      Alert.alert("Erreur d'enregistrement", error, [{ text: "OK" }]);
    },
    [captureError]
  );

  const handlePhotoCapture = useCallback((uri: string) => {
    logger.info("Photo capturée", { uri });
    // Optionnel : afficher une notification ou sauvegarder l'info
  }, []);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      // Nettoyer le timer d'enregistrement
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    };
  }, []);

  // Affichage de chargement
  if (isLoading) {
    return (
      <>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={currentTheme.isDark ? "light-content" : "dark-content"}
        />
        <LoadingScreen
          message={t(
            "recording.loading.data",
            "Chargement du script et des paramètres..."
          )}
          showPermissionStatus={!permissions.isReady}
        />
      </>
    );
  }

  // Affichage d'erreur (avec système de récupération intégré)
  if (error || recoveryError || !script || !settings) {
    const displayError =
      recoveryError?.message ||
      error ||
      t("recording.error.dataNotFound", "Script ou paramètres introuvables");

    return (
      <>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={currentTheme.isDark ? "light-content" : "dark-content"}
        />
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
                  }
                }
              : undefined
          }
          onGoBack={() => {
            resetErrorState();
            navigation.goBack();
          }}
        />

        {/* Informations de debug en mode développement */}
        {__DEV__ && errorStats.totalErrors > 0 && (
          <View
            style={[
              tw`absolute bottom-4 left-4 right-4 bg-gray-800 p-3 rounded-lg`,
              { opacity: 0.8 },
            ]}
          >
            <Text style={tw`text-xs text-gray-300 text-center`}>
              Debug: {errorStats.totalErrors} erreurs |{" "}
              {errorStats.recoveredErrors} récupérées | Taux:{" "}
              {errorStats.successRate.toFixed(1)}% | Tentatives: {retryCount}
            </Text>
          </View>
        )}
      </>
    );
  }

  // Nous utilisons maintenant customTeleprompterSettings pour les réglages du téléprompter

  return (
    <RecordingErrorBoundary
      onError={(error, errorInfo) => {
        logger.error("Erreur React capturée par ErrorBoundary", {
          error: error.message,
          componentStack: errorInfo.componentStack,
        });
        captureError(error, "react_component");
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
          hidden={true} // Masquer la barre de statut en mode enregistrement
        />

        <CameraRecorder
          onRecordingStart={handleRecordingStart}
          onRecordingStop={handleRecordingStop}
          onRecordingComplete={async (video: VideoFile) => {
            try {
              logger.info("Enregistrement terminé", { videoPath: video.path });
              await hybridStorageService.initializeLocalStorage();
              const userId = user?.uid || "guest";
              const recordingId = await hybridStorageService.saveRecording(
                userId,
                video.path,
                recordingDuration,
                script?.id,
                script?.title
              );

              // Le chemin final de la vidéo après déplacement par hybridStorageService
              const savedVideoPath = `${VIDEO_DIR}${recordingId}.mp4`;
              // Ajouter le préfixe file:// si nécessaire pour la lecture vidéo
              const videoUriWithPrefix = savedVideoPath.startsWith("file://")
                ? savedVideoPath
                : `file://${savedVideoPath}`;

              // Créer l'objet Recording avec le chemin final correct
              const newRecording: Recording = {
                id: recordingId,
                videoUri: videoUriWithPrefix,
                uri: videoUriWithPrefix,
                duration: recordingDuration,
                scriptId: script?.id,
                scriptTitle: script?.title,
                createdAt: new Date().toISOString(),
                quality: settings?.quality || "high",
              };

              if (settings?.videoSettings) {
                (newRecording as any).videoSettings = {
                  codec: settings.videoSettings.codec || "h264",
                  stabilization: settings.videoSettings.stabilization || "auto",
                };
              }

              // Sauvegarder dans AsyncStorage pour que PreviewScreen puisse le récupérer
              await RecordingBackupManager.saveRecording(newRecording);

              navigation.navigate("Preview", {
                recordingId,
                videoUri: videoUriWithPrefix,
                duration: recordingDuration,
                scriptTitle: script?.title,
                scriptId: script?.id,
              } as never);
            } catch (e) {
              logger.error(
                "Erreur lors de la sauvegarde de l'enregistrement",
                e
              );
              const fallbackId = `rec_${Date.now()}`;
              // S'assurer que le chemin vidéo a le bon format
              const fallbackVideoUri = video.path.startsWith("file://")
                ? video.path
                : `file://${video.path}`;
              const fallbackRecording: Recording = {
                id: fallbackId,
                videoUri: fallbackVideoUri,
                uri: fallbackVideoUri,
                duration: recordingDuration,
                scriptId: script?.id,
                scriptTitle: script?.title,
                createdAt: new Date().toISOString(),
                quality: settings?.quality || "high",
              };

              if (settings?.videoSettings) {
                (fallbackRecording as any).videoSettings = {
                  codec: settings.videoSettings.codec || "h264",
                  stabilization: settings.videoSettings.stabilization || "auto",
                };
              }

              try {
                await RecordingBackupManager.saveRecording(fallbackRecording);
                logger.info("Enregistrement de secours sauvegardé", {
                  fallbackId,
                });
              } catch (backupError) {
                logger.error(
                  "Erreur lors de la sauvegarde de secours",
                  backupError
                );
              }
              navigation.navigate("Preview", {
                recordingId: fallbackId,
                videoUri: fallbackVideoUri,
                duration: recordingDuration,
                scriptTitle: script?.title,
                scriptId: script?.id,
              } as never);
            }
          }}
          onError={(error: Error) => {
            logger.error("Erreur camera", error);
            captureError(error, "camera_module");
          }}
          isRecording={isRecording}
          script={script}
          settings={settings}
          teleprompterSettings={customTeleprompterSettings}
          scrollSpeed={scrollSpeed}
          backgroundOpacity={backgroundOpacity}
          onSettings={() => {
            setShowSettingsModal(true);
          }}
          onEditText={() => {
            navigation.navigate("Editor", { scriptId: script?.id });
          }}
        />

        {/* Indicateur de mémoire pendant l'enregistrement */}
        {isRecording && (
          <MemoryIndicator
            memoryStats={memoryStats}
            memoryStatus={memoryStatus}
            isVisible={isMemoryMonitoring}
            onOptimize={optimizeMemory}
            formatMemorySize={formatMemorySize}
            compact={true} // Mode compact pour ne pas gêner l'enregistrement
          />
        )}

        {/* Modal de réglages du téléprompter */}
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
