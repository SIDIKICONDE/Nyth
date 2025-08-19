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
      return true; // iOS doesn't need explicit storage permissions
    }

    try {
      let storagePermissionGranted = true;

      if (Platform.Version >= 33) {
        // Android 13+ : check granular permissions
        const videoPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
        );
        
        if (!videoPermission) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
            {
              title: t(
                "recording.permissions.storageAndroid13Title",
                PERMISSION_MESSAGES.storageAndroid13Title
              ),
              message: t(
                "recording.permissions.storageAndroid13Message",
                PERMISSION_MESSAGES.storageAndroid13Message
              ),
              buttonNeutral: t("common.askLater", "Demander plus tard"),
              buttonNegative: t("common.cancel", "Annuler"),
              buttonPositive: t("common.ok", "OK"),
            }
          );
          storagePermissionGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } else {
        // Android < 13 : check WRITE_EXTERNAL_STORAGE
        const writePermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        
        if (!writePermission) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: t(
                "recording.permissions.storageTitle",
                PERMISSION_MESSAGES.storageTitle
              ),
              message: t(
                "recording.permissions.storageMessage",
                PERMISSION_MESSAGES.storageMessage
              ),
              buttonNeutral: t("common.askLater", "Demander plus tard"),
              buttonNegative: t("common.cancel", "Annuler"),
              buttonPositive: t("common.ok", "OK"),
            }
          );
          storagePermissionGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      }

      return storagePermissionGranted;
    } catch (error) {
      logger.error("Error checking storage permissions", error);
      return false;
    }
  }, [t]);

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
    let mounted = true;
    (async () => {
      try {
        await checkAllPermissions();
      } finally {
        if (!mounted) return;
      }
    })();
    return () => {
      mounted = false;
    };
  }, []); // exécuter une seule fois au montage

  return {
    permissions,
    checkAllPermissions,
    requestCameraPermissions,
    showStoragePermissionAlert,
    hasAllPermissions,
  };
}