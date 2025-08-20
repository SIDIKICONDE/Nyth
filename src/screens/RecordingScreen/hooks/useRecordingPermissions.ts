import { useCallback, useState, useEffect } from "react";
import { Alert, Linking, PermissionsAndroid, Platform } from "react-native";
import { Camera } from "react-native-vision-camera";
import { useTranslation } from "@/hooks/useTranslation";
import { createLogger } from "@/utils/optimizedLogger";
import { PermissionStatus } from "../types";
import { PERMISSION_MESSAGES } from "../constants";

const logger = createLogger("useRecordingPermissions");

export function useRecordingPermissions() {
  const { t } = useTranslation();
  const [permissions, setPermissions] = useState<PermissionStatus>({
    camera: false,
    microphone: false,
    storage: true, // Default to true, will check on Android
  });

  const checkCameraPermissions = useCallback(async () => {
    try {
      const cameraPermission = await Camera.getCameraPermissionStatus();
      const microphonePermission = await Camera.getMicrophonePermissionStatus();

      logger.info("Camera permissions status", {
        cameraPermission,
        microphonePermission,
      });

      return {
        camera: cameraPermission === "granted",
        microphone: microphonePermission === "granted",
      };
    } catch (error) {
      logger.error("Error checking camera permissions", error);
      return { camera: false, microphone: false };
    }
  }, []);

  const checkStoragePermissions = useCallback(async () => {
    if (Platform.OS !== "android") {
      return true; // iOS gère automatiquement les permissions de stockage
    }

    try {
      // Approche unifiée pour Android - demander les permissions essentielles
      const requiredPermissions = [];

      if (Platform.Version >= 33) {
        // Android 13+ : permissions granulaires
        requiredPermissions.push(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        );
      } else {
        // Android < 13 : permission de stockage classique
        requiredPermissions.push(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        );
      }

      // Vérifier les permissions existantes
      const permissionsToRequest = [];
      for (const permission of requiredPermissions) {
        const hasPermission = await PermissionsAndroid.check(permission);
        if (!hasPermission) {
          permissionsToRequest.push(permission);
        }
      }

      if (permissionsToRequest.length === 0) {
        return true; // Toutes les permissions sont déjà accordées
      }

      // Demander les permissions manquantes
      const granted = await PermissionsAndroid.requestMultiple(permissionsToRequest);

      // Vérifier si au moins les permissions vidéo sont accordées
      const videoPermission = Platform.Version >= 33
        ? granted[PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO]
        : granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE];

      return videoPermission === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      logger.error("Erreur vérification permissions stockage", error);
      return false;
    }
  }, []);

  const checkAllPermissions = useCallback(async () => {
    const cameraPerms = await checkCameraPermissions();
    const storageGranted = await checkStoragePermissions();

    const newPermissions: PermissionStatus = {
      camera: cameraPerms.camera,
      microphone: cameraPerms.microphone,
      storage: storageGranted,
    };

    setPermissions(newPermissions);
    
    logger.info("All permissions checked", newPermissions);
    
    return newPermissions;
  }, [checkCameraPermissions, checkStoragePermissions]);

  const requestCameraPermissions = useCallback(async () => {
    try {
      const cameraPermission = await Camera.requestCameraPermission();
      const microphonePermission = await Camera.requestMicrophonePermission();

      const granted = 
        cameraPermission === "granted" && 
        microphonePermission === "granted";

      if (granted) {
        setPermissions(prev => ({
          ...prev,
          camera: true,
          microphone: true,
        }));
      }

      return granted;
    } catch (error) {
      logger.error("Error requesting camera permissions", error);
      return false;
    }
  }, []);

  const showStoragePermissionAlert = useCallback((onCancel?: () => void) => {
    Alert.alert(
      t("recording.error.storagePermission", PERMISSION_MESSAGES.storageTitle),
      t("recording.error.storagePermissionMessage", PERMISSION_MESSAGES.storageMessage),
      [
        { 
          text: t("common.cancel", "Annuler"), 
          onPress: onCancel,
          style: "cancel"
        },
        { 
          text: t("common.settings", "Paramètres"), 
          onPress: () => {
            Linking.openSettings();
          }
        }
      ]
    );
  }, [t]);

  const hasAllPermissions = useCallback(() => {
    return permissions.camera && permissions.microphone && permissions.storage;
  }, [permissions]);

  // Check permissions on mount
  useEffect(() => {
    checkAllPermissions();
  }, [checkAllPermissions]);

  return {
    permissions,
    checkAllPermissions,
    requestCameraPermissions,
    showStoragePermissionAlert,
    hasAllPermissions,
  };
}