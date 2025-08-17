import { useState, useEffect } from "react";
import { Platform, Alert, Linking } from "react-native";

// Types unifiés pour les permissions
export type UnifiedPermissionStatus =
  | "granted"
  | "denied"
  | "not-determined"
  | "unavailable";

export interface UnifiedMediaPermissions {
  camera: UnifiedPermissionStatus;
  microphone: UnifiedPermissionStatus;
  storage: UnifiedPermissionStatus;
  isReady: boolean;
  isLoading: boolean;
}

// Hook unifié pour gérer les permissions avec react-native-vision-camera
export const useUnifiedPermissions = () => {
  const [permissions, setPermissions] = useState<UnifiedMediaPermissions>({
    camera: "not-determined",
    microphone: "not-determined",
    storage: "not-determined",
    isReady: false,
    isLoading: true,
  });

  // Convertir les statuts de permissions entre les formats
  const normalizePermissionStatus = (status: any): UnifiedPermissionStatus => {
    if (typeof status === "string") {
      switch (status) {
        case "granted":
        case "authorized":
          return "granted";
        case "denied":
        case "blocked":
        case "restricted":
          return "denied";
        case "not-determined":
        case "undetermined":
          return "not-determined";
        default:
          return "unavailable";
      }
    }
    return "unavailable";
  };

  // Vérifier les permissions via vision-camera
  const checkVisionCameraPermissions =
    async (): Promise<UnifiedMediaPermissions> => {
      try {
        const { Camera } = await import("react-native-vision-camera");
        const { PERMISSIONS, RESULTS, check } = await import(
          "react-native-permissions"
        );

        const cameraStatus = await Camera.getCameraPermissionStatus();
        const microphoneStatus = await Camera.getMicrophonePermissionStatus();

        let storageStatus: UnifiedPermissionStatus = "granted"; // iOS par défaut

        // Vérifier le stockage sur Android
        if (Platform.OS === "android") {
          const storagePermission =
            Platform.Version >= 33
              ? PERMISSIONS.ANDROID.READ_MEDIA_VIDEO
              : PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE;

          const result = await check(storagePermission);
          storageStatus = result === RESULTS.GRANTED ? "granted" : "denied";
        }

        return {
          camera: normalizePermissionStatus(cameraStatus),
          microphone: normalizePermissionStatus(microphoneStatus),
          storage: storageStatus,
          isReady:
            normalizePermissionStatus(cameraStatus) === "granted" &&
            normalizePermissionStatus(microphoneStatus) === "granted" &&
            storageStatus === "granted",
          isLoading: false,
        };
      } catch (error) {
        return {
          camera: "unavailable",
          microphone: "unavailable",
          storage: "unavailable",
          isReady: false,
          isLoading: false,
        };
      }
    };

  // Demander les permissions via vision-camera
  const requestVisionCameraPermissions = async (): Promise<boolean> => {
    try {
      const { Camera } = await import("react-native-vision-camera");
      const { request, PERMISSIONS, RESULTS } = await import(
        "react-native-permissions"
      );

      const cameraPermission = await Camera.requestCameraPermission();
      const microphonePermission = await Camera.requestMicrophonePermission();

      let storagePermission: UnifiedPermissionStatus = "granted";

      // Demander permission de stockage sur Android
      if (Platform.OS === "android") {
        const storagePermissionType =
          Platform.Version >= 33
            ? PERMISSIONS.ANDROID.READ_MEDIA_VIDEO
            : PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE;

        const result = await request(storagePermissionType);
        storagePermission = result === RESULTS.GRANTED ? "granted" : "denied";
      }

      const newPermissions = {
        camera: normalizePermissionStatus(cameraPermission),
        microphone: normalizePermissionStatus(microphonePermission),
        storage: storagePermission,
        isReady:
          normalizePermissionStatus(cameraPermission) === "granted" &&
          normalizePermissionStatus(microphonePermission) === "granted" &&
          storagePermission === "granted",
        isLoading: false,
      };

      setPermissions(newPermissions);
      return newPermissions.isReady;
    } catch (error) {
      return false;
    }
  };

  // Fonction principale pour vérifier les permissions
  const checkPermissions = async () => {
    try {
      const result = await checkVisionCameraPermissions();
      setPermissions(result);
      return result;
    } catch (error) {
      setPermissions((prev) => ({ ...prev, isLoading: false }));
      return permissions;
    }
  };

  // Fonction principale pour demander les permissions
  const requestPermissions = async (): Promise<boolean> => {
    try {
      return await requestVisionCameraPermissions();
    } catch (error) {
      showPermissionErrorAlert();
      return false;
    }
  };

  // Afficher une alerte d'erreur de permissions
  const showPermissionErrorAlert = () => {
    Alert.alert(
      "Erreur de permissions",
      "Impossible de demander les permissions. Veuillez les activer manuellement dans les réglages.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Ouvrir les réglages", onPress: openAppSettings },
      ]
    );
  };

  // Ouvrir les paramètres de l'application
  const openAppSettings = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
    } else {
      const { openSettings } = require("react-native-permissions");
      openSettings();
    }
  };

  // Vérifier les permissions au montage
  useEffect(() => {
    checkPermissions();
  }, []);

  return {
    permissions,
    requestPermissions,
    checkPermissions,
    openSettings: openAppSettings,
    needsPermission: !permissions.isReady && !permissions.isLoading,
  };
};
