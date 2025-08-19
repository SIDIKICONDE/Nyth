import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { PermissionsAndroid, Platform, Alert } from "react-native";
import { PERMISSIONS, RESULTS, request } from "react-native-permissions";
import RNFS from "react-native-fs";

/**
 * Utilitaire pour la gestion des fichiers vidéo
 */
export class FileManager {
  private static toLocalPath(uri: string): string {
    if (!uri) return uri;
    if (uri.startsWith("file://")) return uri.replace("file://", "");
    // Gérer les URI content:// en les copiant d'abord vers un chemin temporaire lisible par RNFS si besoin
    if (uri.startsWith("content://")) {
      // RNFS.stat échouera sur content://; laisser l'appelant gérer une copie si nécessaire
      return uri;
    }
    return uri;
  }
  /**
   * Vérifie qu'un fichier vidéo existe
   */
  public static async validateVideoFile(videoUri: string): Promise<void> {
    const localPath = this.toLocalPath(videoUri);
    if (localPath.startsWith("content://")) {
      throw new Error("Chemin content:// non supporté pour la validation");
    }
    const fileInfo = await RNFS.stat(localPath);
    if (!fileInfo.isFile()) {
      throw new Error("Fichier vidéo introuvable");
    }
  }

  /**
   * Demande les permissions nécessaires pour sauvegarder dans la galerie
   */
  private static async requestGalleryPermissions(): Promise<boolean> {
    if (Platform.OS === "android") {
      try {
        // Android 13+ (API 33+) utilise des permissions granulaires
        if (Platform.Version >= 33) {
          const permissions = [
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          ];

          const results = await PermissionsAndroid.requestMultiple(permissions);

          const videoPermission =
            results[PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO];
          const imagePermission =
            results[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES];

          return (
            videoPermission === PermissionsAndroid.RESULTS.GRANTED ||
            imagePermission === PermissionsAndroid.RESULTS.GRANTED
          );
        } else {
          // Android < 13 utilise WRITE_EXTERNAL_STORAGE
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: "Permission d'accès au stockage",
              message:
                "CamPrompt AI a besoin d'accéder au stockage pour sauvegarder vos vidéos",
              buttonNeutral: "Demander plus tard",
              buttonNegative: "Annuler",
              buttonPositive: "OK",
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        return false;
      }
    }

    // iOS: demander explicitement l'autorisation d'ajout à la photothèque
    if (Platform.OS === "ios") {
      try {
        const addOnly = await request(PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY);
        if (addOnly === RESULTS.GRANTED) return true;

        const full = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
        return full === RESULTS.GRANTED;
      } catch (err) {
        return false;
      }
    }

    return true;
  }

  /**
   * Sauvegarde une vidéo dans la galerie
   */
  public static async saveToGallery(videoUri: string): Promise<boolean> {
    try {
      // Demander les permissions nécessaires
      const hasPermission = await this.requestGalleryPermissions();
      if (!hasPermission) {
        // Afficher une alerte explicative à l'utilisateur
        Alert.alert(
          "Permission requise",
          "Pour sauvegarder vos vidéos dans la galerie, veuillez autoriser l'accès aux médias dans les paramètres de l'application.",
          [
            { text: "Annuler", style: "cancel" },
            {
              text: "Paramètres",
              onPress: () => {},
            },
          ]
        );
        return false;
      }

      // Préparer une URI exploitable par RNFS et CameraRoll
      let normalizedUri = videoUri || "";
      const isContent = normalizedUri.startsWith("content://");
      const isFile = normalizedUri.startsWith("file://");
      const isHttp = normalizedUri.startsWith("http://") || normalizedUri.startsWith("https://");

      if (!isHttp && !isFile && !isContent && normalizedUri.startsWith("/")) {
        normalizedUri = `file://${normalizedUri}`;
      }

      if (isContent) {
        const tmpPath = `${RNFS.CachesDirectoryPath}/export_${Date.now()}.mp4`;
        try {
          // Essayer une copie directe
          await RNFS.copyFile(normalizedUri as any, tmpPath as any);
          normalizedUri = `file://${tmpPath}`;
        } catch (copyErr) {
          try {
            // Fallback: lire en base64 puis écrire
            const base64 = await RNFS.readFile(normalizedUri as any, 'base64');
            await RNFS.writeFile(tmpPath, base64, 'base64');
            normalizedUri = `file://${tmpPath}`;
          } catch (readErr) {
            Alert.alert(
              "Erreur de sauvegarde",
              "Impossible d'accéder à la vidéo pour l'enregistrer dans la galerie.",
              [{ text: "OK" }]
            );
            return false;
          }
        }
      }

      // Vérifier que le fichier existe avant de continuer (après éventuelle conversion)
      await this.validateVideoFile(normalizedUri);

      // Sauvegarder la vidéo dans la galerie
      const result = await CameraRoll.save(normalizedUri, {
        type: "video",
        album: "Visions", // Créer un album spécifique
      });

      if (result) {
        // Afficher une confirmation à l'utilisateur
        Alert.alert(
          "Sauvegarde réussie",
          "Votre vidéo a été sauvegardée dans la galerie dans l'album 'Visions'.",
          [{ text: "OK" }]
        );

        return true;
      } else {
        Alert.alert(
          "Erreur de sauvegarde",
          "La sauvegarde de la vidéo a échoué. Veuillez réessayer.",
          [{ text: "OK" }]
        );

        return false;
      }
    } catch (error) {
      // Afficher une erreur plus détaillée selon le type d'erreur
      let errorMessage =
        "Une erreur inconnue est survenue lors de la sauvegarde.";

      if (error instanceof Error) {
        if (error.message.includes("Permission")) {
          errorMessage =
            "Permissions insuffisantes pour sauvegarder dans la galerie.";
        } else if (error.message.includes("file")) {
          errorMessage = "Le fichier vidéo est introuvable ou corrompu.";
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert("Erreur de sauvegarde", errorMessage, [{ text: "OK" }]);

      return false;
    }
  }

  /**
   * Obtient les informations d'un fichier vidéo
   */
  public static async getVideoInfo(videoUri: string): Promise<{
    exists: boolean;
    size?: number;
    uri: string;
  }> {
    try {
      const localPath = this.toLocalPath(videoUri);
      const fileInfo = await RNFS.stat(localPath);
      return {
        exists: fileInfo.isFile(),
        size: fileInfo.isFile() ? fileInfo.size : undefined,
        uri: videoUri,
      };
    } catch (error) {
      return {
        exists: false,
        uri: videoUri,
      };
    }
  }

  /**
   * Vérifie la durée d'une vidéo (estimation basée sur la taille)
   */
  public static estimateVideoDuration(fileSize: number): number {
    // Estimation approximative : 1MB ≈ 10 secondes pour une vidéo 1080p
    return Math.round((fileSize / (1024 * 1024)) * 10);
  }

  /**
   * Valide qu'une vidéo respecte les contraintes d'une plateforme
   */
  public static validateForPlatform(
    videoInfo: { size?: number; uri: string },
    maxDuration?: number
  ): { valid: boolean; reason?: string } {
    if (!videoInfo.size) {
      return {
        valid: false,
        reason: "Impossible de déterminer la taille du fichier",
      };
    }

    if (maxDuration) {
      const estimatedDuration = this.estimateVideoDuration(videoInfo.size);
      if (estimatedDuration > maxDuration) {
        return {
          valid: false,
          reason: `Durée estimée (${estimatedDuration}s) dépasse la limite (${maxDuration}s)`,
        };
      }
    }

    return { valid: true };
  }
}
