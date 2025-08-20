import { useState, useCallback } from "react";
import { Alert, Linking, Platform, PermissionsAndroid } from "react-native";
import { Camera } from "react-native-vision-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "@/hooks/useTranslation";
import { createLogger } from "@/utils/optimizedLogger";
import { Script, RecordingSettings } from "@/types";
import { VideoCodec, VideoQuality, VideoStabilization } from "@/types/video";

const logger = createLogger("useRecordingData");

interface UseRecordingDataProps {
  scriptId?: string;
  scripts: Script[];
  initialSettings?: RecordingSettings;
  onError?: (error: Error) => void;
}

export function useRecordingData({
  scriptId,
  scripts,
  initialSettings,
  onError
}: UseRecordingDataProps) {
  const { t } = useTranslation();
  const [script, setScript] = useState<Script | null>(null);
  const [settings, setSettings] = useState<RecordingSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkStoragePermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== "android") {
      return true;
    }

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

      return storagePermissionGranted;
    } catch (error) {
      logger.error("Erreur vérification permissions stockage", error);
      return false;
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      logger.info("Chargement des données d'enregistrement", { scriptId });

      // Vérifier les permissions natives
      const cameraPermission = await Camera.getCameraPermissionStatus();
      const microphonePermission = await Camera.getMicrophonePermissionStatus();

      logger.info("Statut des permissions", {
        cameraPermission,
        microphonePermission,
      });

      // Vérifier les permissions de stockage pour Android
      const storagePermissionGranted = await checkStoragePermissions();

      if (!storagePermissionGranted) {
        logger.warn("Permission de stockage refusée");
        Alert.alert(
          t("recording.error.storagePermission", "Permission de stockage requise"),
          t("recording.error.storagePermissionMessage", "Pour sauvegarder vos vidéos, veuillez autoriser l'accès au stockage dans les paramètres."),
          [
            { text: t("common.cancel", "Annuler") },
            { text: t("common.settings", "Paramètres"), onPress: () => {
              Linking.openSettings();
            }}
          ]
        );
        throw new Error("Permission de stockage refusée");
      }

      // Charger le script
      const foundScript = scripts.find((s) => s.id === scriptId);
      if (!foundScript) {
        throw new Error("Script non trouvé");
      }
      setScript(foundScript);

      // Charger les paramètres
      let recordingSettings = initialSettings;
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

      // Notifier l'erreur au parent
      onError?.(errorWithCatch);

      setError(errorMessage);

      // Afficher une alerte seulement si ce n'est pas une erreur de permissions
      if (
        !errorWithCatch.message.includes("permission") &&
        !errorWithCatch.message.includes("camera")
      ) {
        Alert.alert(
          t("recording.error.loadError", "Erreur de chargement"),
          errorMessage,
          [{ text: "OK" }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [scriptId, scripts, initialSettings, checkStoragePermissions, t, onError]);

  return {
    script,
    settings,
    isLoading,
    error,
    loadData,
    setError,
  };
}