import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Alert, StatusBar, BackHandler, Text } from "react-native";
import {
  RouteProp,
  useRoute,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
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
import { Camera } from "react-native-vision-camera";
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
import { FileManager } from "@/services/social-share/utils/fileManager";
import { PermissionsAndroid, Platform, Linking } from "react-native";
import { CameraRecorderRef } from "./components/CameraRecorder";

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

  const { preferences: globalPreferences, updateTeleprompterSettings } =
    useGlobalPreferences();

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
      setError(null);
      setIsLoading(true);
    },
  });

  // Sauvegarde d'urgence
  useEmergencyRecordingSave({
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
    // Implémentation de l'arrêt d'urgence: utiliser la ref du CameraRecorder
    stopActiveRecordingAndGetPath: async () => {
      try {
        if (cameraRecorderRef.current) {
          const videoFile = await cameraRecorderRef.current.stopRecordingAndGetFile();
          if (videoFile) {
            // Retourner le chemin du fichier vidéo
            return videoFile.path;
          }
        }
        return null;
      } catch (error) {
        logger.error("Erreur lors de l'arrêt d'urgence", error);
        return null;
      }
    },
  });

  // Paramètres de l'écran
  const { scriptId, settings: routeSettings } = route.params;

  // Utiliser useRef pour les paramètres de route afin d'éviter les rechargements
  const routeSettingsRef = useRef(routeSettings);
  useEffect(() => {
    routeSettingsRef.current = routeSettings;
  }, [routeSettings]);

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
  // Ref pour accéder au CameraRecorder et arrêter l'enregistrement en urgence
  const cameraRecorderRef = useRef<CameraRecorderRef>(null);

  // Charger le script et les paramètres
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      logger.info("Chargement des données d'enregistrement", { scriptId });

      // Vérifier les permissions natives une seule fois au chargement
      const cameraPermission = await Camera.getCameraPermissionStatus();
      const microphonePermission = await Camera.getMicrophonePermissionStatus();

      logger.info("Statut des permissions", {
        cameraPermission,
        microphonePermission,
      });

      // Vérifier les permissions de stockage pour Android
      if (Platform.OS === "android") {
        try {
          let storagePermissionGranted = true;
          
          if (Platform.Version >= 33) {
            // Android 13+ : vérifier les permissions granulaires
            const videoPermission = await PermissionsAndroid.check(
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
            );
            if (!videoPermission) {
              const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
                {
                  title: "Permission d'accès aux vidéos",
                  message: "Nyth a besoin d'accéder à vos vidéos pour sauvegarder les enregistrements.",
                  buttonNeutral: "Demander plus tard",
                  buttonNegative: "Annuler",
                  buttonPositive: "OK",
                }
              );
              storagePermissionGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
            }
          } else {
            // Android < 13 : vérifier WRITE_EXTERNAL_STORAGE
            const writePermission = await PermissionsAndroid.check(
              PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
            );
            if (!writePermission) {
              const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                {
                  title: "Permission de stockage",
                  message: "Nyth a besoin d'accéder au stockage pour sauvegarder vos vidéos.",
                  buttonNeutral: "Demander plus tard",
                  buttonNegative: "Annuler",
                  buttonPositive: "OK",
                }
              );
              storagePermissionGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
            }
          }

          if (!storagePermissionGranted) {
            logger.warn("Permission de stockage refusée");
            Alert.alert(
              t("recording.error.storagePermission", "Permission de stockage requise"),
              t("recording.error.storagePermissionMessage", "Pour sauvegarder vos vidéos, veuillez autoriser l'accès au stockage dans les paramètres."),
              [
                { text: t("common.cancel", "Annuler"), onPress: () => navigation.goBack() },
                { text: t("common.settings", "Paramètres"), onPress: () => {
                  Linking.openSettings();
                }}
              ]
            );
            return;
          }
        } catch (error) {
          logger.error("Erreur lors de la vérification des permissions de stockage", error);
        }
      }

      // Charger le script
      const foundScript = scripts.find((s) => s.id === scriptId);
      if (!foundScript) {
        throw new Error("Script non trouvé");
      }
      setScript(foundScript);

      // Charger les paramètres
      let recordingSettings = routeSettingsRef.current;
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
      const errorWithCatch =
        err instanceof Error ? err : new Error("Erreur inconnue");
      const errorMessage = errorWithCatch.message;

      logger.error("Erreur lors du chargement", errorWithCatch);

      // Capturer l'erreur dans le système de récupération
      captureError(errorWithCatch, "chargement_donnees");

      setError(errorMessage);

      // Afficher une alerte seulement si ce n'est pas une erreur récupérable
      if (
        !errorWithCatch.message.includes("permission") &&
        !errorWithCatch.message.includes("camera")
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
  }, [scriptId, scripts, captureError, t, navigation]); // Retiré routeSettings des dépendances

  // Charger les données uniquement au montage initial
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Pas de dépendances pour éviter le rechargement

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
  }, []);

  const handleRecordingStop = useCallback(() => {
    logger.info("Enregistrement arrêté depuis RecordingScreen");
    setIsRecording(false);

    // Arrêter le timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const handleRecordingError = useCallback(
    (errorRecording: Error) => {
      logger.error("Erreur d'enregistrement", errorRecording);
      setIsRecording(false);

      // Arrêter le timer en cas d'erreur
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      // Capturer l'erreur
      captureError(errorRecording, "enregistrement");

      Alert.alert("Erreur d'enregistrement", errorRecording.message, [
        { text: "OK" },
      ]);
    },
    [captureError]
  );

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
          showPermissionStatus={false}
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
          hidden={true} // Masquer la barre de statut en mode enregistrement
        />

        <CameraRecorder
          ref={cameraRecorderRef}
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
              logger.info("Chemin de sauvegarde calculé", { 
                VIDEO_DIR, 
                recordingId, 
                savedVideoPath 
              });
              
              // Vérifier que le fichier existe bien à cet emplacement
              const RNFS = require("react-native-fs");
              const fileExists = await RNFS.exists(savedVideoPath);
              logger.info("Vérification de l'existence du fichier", { 
                savedVideoPath, 
                fileExists 
              });
              
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
                  stabilization:
                    settings.videoSettings.stabilization || "auto",
                };
              }

              // Sauvegarder dans AsyncStorage
              await RecordingBackupManager.saveRecording(newRecording);
              logger.info("Enregistrement sauvegardé dans AsyncStorage", {
                recordingId,
                videoUri: videoUriWithPrefix,
              });

              // Sauvegarder directement dans la galerie
              logger.info("Tentative de sauvegarde dans la galerie", { 
                videoUri: videoUriWithPrefix,
                savedVideoPath,
                fileExists 
              });
              
              let savedToGallery = false;
              try {
                savedToGallery = await FileManager.saveToGallery(videoUriWithPrefix);
                logger.info("Résultat de la sauvegarde dans la galerie", { savedToGallery });
              } catch (galleryError) {
                logger.error("Erreur lors de la sauvegarde dans la galerie", galleryError);
                savedToGallery = false;
              }
              
              if (savedToGallery) {
                logger.info("Vidéo sauvegardée dans la galerie avec succès");
                // Naviguer vers l'écran d'accueil après la sauvegarde réussie
                navigation.navigate("Home" as never);
              } else {
                logger.error("Échec de la sauvegarde dans la galerie");
                // Ne pas bloquer la navigation: le fichier est déjà sauvegardé localement
                Alert.alert(
                  "Galerie non disponible",
                  "La vidéo a été sauvegardée localement. Vous pourrez réessayer l'export vers la galerie depuis votre bibliothèque.",
                  [
                    { text: "OK", onPress: () => navigation.navigate("Home" as never) },
                    {
                      text: "Réessayer",
                      onPress: async () => {
                        await FileManager.saveToGallery(videoUriWithPrefix);
                        navigation.navigate("Home" as never);
                      },
                    },
                  ]
                );
              }
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
                  stabilization:
                    settings.videoSettings.stabilization || "auto",
                };
              }

              try {
                await RecordingBackupManager.saveRecording(fallbackRecording);
                logger.info("Enregistrement de secours sauvegardé", {
                  fallbackId,
                });
                
                // Essayer de sauvegarder dans la galerie même en cas d'erreur
                const savedToGallery = await FileManager.saveToGallery(fallbackVideoUri);
                if (savedToGallery) {
                  navigation.navigate("Home" as never);
                } else {
                  Alert.alert(
                    "Erreur",
                    "L'enregistrement a été sauvegardé localement mais n'a pas pu être exporté dans la galerie.",
                    [{ text: "OK", onPress: () => navigation.navigate("Home" as never) }]
                  );
                }
              } catch (backupError) {
                logger.error(
                  "Erreur lors de la sauvegarde de secours",
                  backupError
                );
                navigation.navigate("Home" as never);
              }
            }
          }}
          onError={handleRecordingError}
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
