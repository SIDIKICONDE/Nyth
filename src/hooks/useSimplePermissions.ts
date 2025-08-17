import { useState, useEffect, useCallback, useRef } from "react";
import { Platform, Linking, Alert, PermissionsAndroid } from "react-native";
import {
  Camera,
  useCameraPermission,
  useMicrophonePermission,
} from "react-native-vision-camera";
import { useTranslation } from "./useTranslation";
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  Permission,
} from "react-native-permissions";

interface MediaPermissions {
  camera: "granted" | "denied" | "not-determined";
  microphone: "granted" | "denied" | "not-determined";
  storage: "granted" | "denied" | "not-determined";
  isReady: boolean;
  isLoading: boolean;
}

// Cache global des permissions pour éviter les vérifications répétées
const permissionsCache = {
  camera: null as boolean | null,
  microphone: null as boolean | null,
  lastCheck: 0,
};

const CACHE_DURATION = 60000; // 1 minute de cache

export function useSimplePermissions() {
  const { t } = useTranslation();

  // Vérifier le cache avant de faire une vraie vérification
  const getCachedPermission = (
    type: "camera" | "microphone"
  ): boolean | null => {
    const now = Date.now();
    if (now - permissionsCache.lastCheck < CACHE_DURATION) {
      return permissionsCache[type];
    }
    return null;
  };

  const updateCache = (camera: boolean, microphone: boolean) => {
    permissionsCache.camera = camera;
    permissionsCache.microphone = microphone;
    permissionsCache.lastCheck = Date.now();
  };

  const [permissions, setPermissions] = useState<MediaPermissions>({
    camera: "not-determined",
    microphone: "not-determined",
    storage: "not-determined",
    isReady: false,
    isLoading: false, // Changé à false car on ne vérifie plus automatiquement
  });

  const getStoragePermissions = (): Permission[] => {
    if (Platform.OS === "android") {
      // Android 13+ (API 33+) utilise des permissions granulaires
      if (Platform.Version >= 33) {
        return [
          PERMISSIONS.ANDROID.READ_MEDIA_VIDEO,
          PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
        ];
      }
      // Android < 13 utilise WRITE_EXTERNAL_STORAGE
      return [PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE];
    }
    // iOS n'a pas besoin de permission explicite pour sauvegarder dans Photos
    // (gérée automatiquement par NSPhotoLibraryAddUsageDescription)
    return [];
  };

  const checkPermissions = useCallback(async () => {
    try {
      setPermissions((prev) => ({ ...prev, isLoading: true }));

      // Vérifier caméra
      const cameraPermission = Platform.select({
        ios: PERMISSIONS.IOS.CAMERA,
        android: PERMISSIONS.ANDROID.CAMERA,
      })!;

      // Vérifier micro
      const microphonePermission = Platform.select({
        ios: PERMISSIONS.IOS.MICROPHONE,
        android: PERMISSIONS.ANDROID.RECORD_AUDIO,
      })!;

      const [cameraResult, microphoneResult] = await Promise.all([
        check(cameraPermission),
        check(microphonePermission),
      ]);

      // Vérifier stockage (Android seulement)
      let storageResult = RESULTS.GRANTED; // iOS par défaut
      const storagePermissions = getStoragePermissions();

      if (storagePermissions.length > 0) {
        // Pour Android 13+, vérifier les permissions granulaires
        if (Platform.OS === "android" && Platform.Version >= 33) {
          const storageResults = await Promise.all(
            storagePermissions.map((permission) => check(permission))
          );

          // Au moins une permission doit être accordée
          storageResult = storageResults.some(
            (result) => result === RESULTS.GRANTED
          )
            ? RESULTS.GRANTED
            : (storageResults[0] as any); // Prendre le statut de la première permission
        } else {
          // Android < 13
          storageResult = (await check(storagePermissions[0])) as any;
        }
      }

      const newPermissions: MediaPermissions = {
        camera:
          cameraResult === RESULTS.GRANTED
            ? ("granted" as const)
            : cameraResult === RESULTS.DENIED ||
              cameraResult === RESULTS.BLOCKED
            ? ("denied" as const)
            : ("not-determined" as const),
        microphone:
          microphoneResult === RESULTS.GRANTED
            ? ("granted" as const)
            : microphoneResult === RESULTS.DENIED ||
              microphoneResult === RESULTS.BLOCKED
            ? ("denied" as const)
            : ("not-determined" as const),
        storage:
          storageResult === RESULTS.GRANTED
            ? ("granted" as const)
            : storageResult === RESULTS.DENIED ||
              storageResult === RESULTS.BLOCKED
            ? ("denied" as const)
            : ("not-determined" as const),
        isReady:
          cameraResult === RESULTS.GRANTED &&
          microphoneResult === RESULTS.GRANTED &&
          storageResult === RESULTS.GRANTED,
        isLoading: false,
      };

      setPermissions(newPermissions);

      return newPermissions.isReady;
    } catch (error) {
      setPermissions((prev) => ({ ...prev, isLoading: false }));
      return false;
    }
  }, []);

  const showPermissionDeniedAlert = () => {
    Alert.alert(
      t("permissions.denied.title"),
      t("permissions.denied.message"),
      [
        {
          text: t("permissions.denied.settings"),
          onPress: () => Linking.openSettings(),
        },
        {
          text: t("permissions.denied.cancel"),
          style: "cancel",
        },
      ]
    );
  };

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setPermissions((prev) => ({ ...prev, isLoading: true }));

      // Demander caméra et micro
      const cameraPermission = Platform.select({
        ios: PERMISSIONS.IOS.CAMERA,
        android: PERMISSIONS.ANDROID.CAMERA,
      })!;

      const microphonePermission = Platform.select({
        ios: PERMISSIONS.IOS.MICROPHONE,
        android: PERMISSIONS.ANDROID.RECORD_AUDIO,
      })!;

      const [cameraResult, microphoneResult] = await Promise.all([
        request(cameraPermission),
        request(microphonePermission),
      ]);

      // Demander stockage (Android seulement)
      let storageResult = RESULTS.GRANTED; // iOS par défaut
      const storagePermissions = getStoragePermissions();

      if (storagePermissions.length > 0) {
        if (Platform.OS === "android" && Platform.Version >= 33) {
          // Android 13+ : demander les permissions granulaires
          const storageResults = await Promise.all(
            storagePermissions.map((permission) => request(permission))
          );

          // Au moins une permission doit être accordée
          storageResult = storageResults.some(
            (result) => result === RESULTS.GRANTED
          )
            ? RESULTS.GRANTED
            : (storageResults[0] as any);
        } else {
          // Android < 13
          storageResult = (await request(storagePermissions[0])) as any;
        }
      }

      // Mettre à jour l'état
      const newPermissions = {
        camera:
          cameraResult === RESULTS.GRANTED
            ? "granted"
            : cameraResult === RESULTS.DENIED ||
              cameraResult === RESULTS.BLOCKED
            ? "denied"
            : "not-determined",
        microphone:
          microphoneResult === RESULTS.GRANTED
            ? "granted"
            : microphoneResult === RESULTS.DENIED ||
              microphoneResult === RESULTS.BLOCKED
            ? "denied"
            : "not-determined",
        storage:
          storageResult === RESULTS.GRANTED
            ? "granted"
            : storageResult === RESULTS.DENIED ||
              storageResult === RESULTS.BLOCKED
            ? "denied"
            : "not-determined",
        isReady:
          cameraResult === RESULTS.GRANTED &&
          microphoneResult === RESULTS.GRANTED &&
          storageResult === RESULTS.GRANTED,
        isLoading: false,
      } as MediaPermissions;

      setPermissions(newPermissions);

      // Vérifier si toutes les permissions sont accordées
      if (newPermissions.isReady) {
        return true;
      }

      // Gérer les permissions refusées
      if (
        newPermissions.camera === "denied" ||
        newPermissions.microphone === "denied" ||
        newPermissions.storage === "denied"
      ) {
        showPermissionDeniedAlert();
        return false;
      }

      return false;
    } catch (error) {
      setPermissions((prev) => ({ ...prev, isLoading: false }));
      return false;
    }
  }, []);

  const openAppSettings = useCallback(() => {
    try {
      if (Platform.OS === "ios") {
        Linking.openURL("app-settings:");
      } else {
        // openSettings(); // This function is not imported, so it's removed.
        // If openSettings is available, uncomment and use it.
        // For now, we'll just show an alert.
        Alert.alert(
          "Paramètres d'application",
          "Impossible d'ouvrir les paramètres automatiquement. Veuillez ouvrir les Paramètres > Applications > CamPrompt AI > Permissions et activer la caméra et le microphone.",
          [
            { text: "Annuler", style: "cancel" },
            {
              text: "Ouvrir les réglages",
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        "Erreur",
        "Impossible d'ouvrir les paramètres automatiquement. Veuillez ouvrir les Paramètres > Applications > CamPrompt AI > Permissions et activer la caméra et le microphone."
      );
    }
  }, []);

  // SUPPRIMÉ : Vérification automatique des permissions au montage
  // Les permissions seront vérifiées seulement quand nécessaire

  return {
    permissions,
    requestPermissions,
    checkPermissions, // Nouvelle fonction pour vérifier à la demande
    openSettings: openAppSettings,
    needsPermission: !permissions.isReady && !permissions.isLoading,
  };
}
