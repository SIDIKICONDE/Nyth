import React, { useState } from "react";
import { Alert, Platform, Linking } from "react-native";
import {
  PERMISSIONS,
  RESULTS,
  request,
  requestMultiple,
  openSettings,
  Permission,
  PermissionStatus,
} from "react-native-permissions";

interface PermissionResult {
  success: boolean;
  permissions: {
    camera: boolean;
    microphone: boolean;
    storage: boolean;
  };
}

export class PermissionHandler {
  /**
   * Demande toutes les permissions nécessaires pour l'enregistrement vidéo
   */
  static async requestAllPermissions(): Promise<PermissionResult> {
    try {
      const permissions = this.getRequiredPermissions();

      // Demander toutes les permissions en une fois
      const results = await requestMultiple(permissions);

      // Analyser les résultats
      const cameraGranted = this.isPermissionGranted(results[permissions[0]]);
      const microphoneGranted = this.isPermissionGranted(
        results[permissions[1]]
      );

      // Pour le stockage, vérifier selon la plateforme
      let storageGranted = true; // iOS par défaut

      if (Platform.OS === "android") {
        if (Platform.Version >= 33) {
          // Android 13+ : au moins une permission média doit être accordée
          const videoPermission = results[PERMISSIONS.ANDROID.READ_MEDIA_VIDEO];
          const imagePermission =
            results[PERMISSIONS.ANDROID.READ_MEDIA_IMAGES];

          storageGranted =
            this.isPermissionGranted(videoPermission) ||
            this.isPermissionGranted(imagePermission);
        } else {
          // Android < 13
          const writePermission =
            results[PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE];
          storageGranted = this.isPermissionGranted(writePermission);
        }
      }

      const allGranted = cameraGranted && microphoneGranted && storageGranted;

      // Afficher une alerte si certaines permissions sont refusées
      if (!allGranted) {
        this.showPermissionDeniedAlert({
          camera: cameraGranted,
          microphone: microphoneGranted,
          storage: storageGranted,
        });
      }

      return {
        success: allGranted,
        permissions: {
          camera: cameraGranted,
          microphone: microphoneGranted,
          storage: storageGranted,
        },
      };
    } catch (error) {
      Alert.alert(
        "Erreur de permissions",
        "Impossible de demander les permissions. Veuillez les activer manuellement dans les paramètres.",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Paramètres", onPress: () => this.openAppSettings() },
        ]
      );

      return {
        success: false,
        permissions: {
          camera: false,
          microphone: false,
          storage: false,
        },
      };
    }
  }

  /**
   * Récupère la liste des permissions nécessaires selon la plateforme
   */
  private static getRequiredPermissions(): Permission[] {
    const permissions: Permission[] = [];

    // Caméra et micro (obligatoires)
    if (Platform.OS === "ios") {
      permissions.push(PERMISSIONS.IOS.CAMERA);
      permissions.push(PERMISSIONS.IOS.MICROPHONE);
    } else {
      permissions.push(PERMISSIONS.ANDROID.CAMERA);
      permissions.push(PERMISSIONS.ANDROID.RECORD_AUDIO);

      // Stockage selon la version Android
      if (Number(Platform.Version) >= 33) {
        permissions.push(PERMISSIONS.ANDROID.READ_MEDIA_VIDEO);
        permissions.push(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
      } else {
        permissions.push(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);
      }
    }

    return permissions;
  }

  /**
   * Vérifie si une permission est accordée
   */
  private static isPermissionGranted(status: PermissionStatus): boolean {
    return status === RESULTS.GRANTED;
  }

  /**
   * Affiche une alerte détaillée pour les permissions refusées
   */
  private static showPermissionDeniedAlert(permissions: {
    camera: boolean;
    microphone: boolean;
    storage: boolean;
  }) {
    const deniedPermissions = [];

    if (!permissions.camera) deniedPermissions.push("Caméra");
    if (!permissions.microphone) deniedPermissions.push("Microphone");
    if (!permissions.storage) deniedPermissions.push("Stockage/Galerie");

    const message =
      Platform.OS === "ios"
        ? `Pour utiliser cette application, vous devez autoriser l'accès à : ${deniedPermissions.join(
            ", "
          )}.\n\nVeuillez aller dans Réglages > Confidentialité et sécurité > ${deniedPermissions.join(
            " et "
          )} pour activer les permissions.`
        : `Pour utiliser cette application, vous devez autoriser l'accès à : ${deniedPermissions.join(
            ", "
          )}.\n\nVeuillez aller dans Paramètres > Applications > Nyth > Permissions pour activer les permissions manquantes.`;

    Alert.alert("Permissions requises", message, [
      { text: "Annuler", style: "cancel" },
      { text: "Ouvrir les paramètres", onPress: () => this.openAppSettings() },
    ]);
  }

  /**
   * Ouvre les paramètres de l'application
   */
  private static openAppSettings() {
    try {
      if (Platform.OS === "ios") {
        Linking.openURL("app-settings:");
      } else {
        openSettings();
      }
    } catch (error) {
      // Fallback pour Android
      Linking.openSettings();
    }
  }
}

/**
 * Hook pour utiliser le gestionnaire de permissions
 */
export const usePermissionHandler = () => {
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = async (): Promise<PermissionResult> => {
    setIsLoading(true);
    try {
      const result = await PermissionHandler.requestAllPermissions();
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    requestPermissions,
    isLoading,
  };
};
