import CameraRoll from "@react-native-camera-roll/camera-roll";
import { PermissionsAndroid, Platform, Alert, Linking } from "react-native";
import { PERMISSIONS, RESULTS, request } from "react-native-permissions";
import RNFS from "react-native-fs";
import {
  normalizeFilePath,
  toLocalPath as toLocalPathUtil,
  isValidFileUri
} from "@/utils/pathNormalizer";
import {
  PermissionCacheService,
  PermissionType,
  PermissionStatus
} from "@/services/PermissionCacheService";
import {
  waitForFileAvailability,
  DEFAULT_FILE_OPTIONS
} from "@/utils/fileAvailabilityChecker";

/**
 * Utilitaire pour la gestion des fichiers vidéo
 */
export class FileManager {
  /**
   * Convertit un URI en chemin local (sans préfixe file://)
   * Wrapper pour la fonction centralisée
   */
  private static toLocalPath(uri: string): string {
    const localPath = toLocalPathUtil(uri);

    // Décoder les espaces et autres caractères spéciaux pour iOS (logique spécifique conservée)
    if (Platform.OS === "ios") {
      try {
        return decodeURIComponent(localPath);
      } catch (error) {
        console.warn(`[FileManager] Erreur décodage URI iOS: ${error}`);
        return localPath;
      }
    }

    return localPath;
  }
  /**
   * Vérifie qu'un fichier vidéo existe
   */
  public static async validateVideoFile(videoUri: string): Promise<void> {
    try {
      // Utiliser la fonction centralisée pour normaliser le chemin
      const normalizedPath = await normalizeFilePath(videoUri, {
        validateExistence: true,
        forceFilePrefix: true
      });

      const localPath = this.toLocalPath(normalizedPath);

      // Vérifier que c'est bien un fichier
      const fileInfo = await RNFS.stat(localPath);
      if (!fileInfo.isFile()) {
        throw new Error("Le chemin ne pointe pas vers un fichier vidéo valide");
      }

      // Vérifier que le fichier n'est pas vide
      if (fileInfo.size === 0) {
        throw new Error("Le fichier vidéo est vide");
      }

      console.log(`[FileManager] Fichier validé avec succès : ${localPath}, taille: ${fileInfo.size} octets`);

    } catch (error) {
      console.error(`[FileManager] Erreur lors de la validation du fichier :`, error);

      // Si c'est déjà une erreur de notre normalizer, la relancer telle quelle
      if (error instanceof Error && error.message.includes("introuvable")) {
        throw error;
      }

      // Lister le contenu du répertoire parent pour débogage (fallback)
      if (Platform.OS === "ios") {
        try {
          const localPath = this.toLocalPath(videoUri);
          const dirPath = localPath.substring(0, localPath.lastIndexOf('/'));
          const files = await RNFS.readDir(dirPath);
          console.log(`[FileManager] Contenu du répertoire ${dirPath}:`);
          files.forEach(file => {
            console.log(`[FileManager] - ${file.name} (${file.isFile() ? 'fichier' : 'dossier'}, ${file.size} octets)`);
          });
        } catch (dirError) {
          console.error(`[FileManager] Impossible de lister le répertoire`, dirError);
        }
      }

      throw error;
    }
  }

  /**
   * Demande les permissions nécessaires pour sauvegarder dans la galerie
   * Utilise le système de cache des permissions pour éviter les demandes répétées
   */
  private static async requestGalleryPermissions(): Promise<boolean> {
    const permissionCache = PermissionCacheService.getInstance();

    // Vérifier d'abord le cache
    const isAlreadyGranted = await permissionCache.isPermissionGranted(
      PermissionType.PHOTO_LIBRARY_ADD_ONLY
    );

    if (isAlreadyGranted) {
      console.log("[FileManager] Permission galerie trouvée en cache");
      return true;
    }

    if (Platform.OS === "android") {
      try {
        const androidVersion = Platform.Version;
        console.log(`[FileManager] Android version: ${androidVersion}`);

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

          const granted =
            videoPermission === PermissionsAndroid.RESULTS.GRANTED ||
            imagePermission === PermissionsAndroid.RESULTS.GRANTED;

          // Mettre à jour le cache
          await permissionCache.updatePermissionCache(
            PermissionType.READ_MEDIA_VIDEO,
            videoPermission === PermissionsAndroid.RESULTS.GRANTED
          );
          await permissionCache.updatePermissionCache(
            PermissionType.READ_MEDIA_IMAGES,
            imagePermission === PermissionsAndroid.RESULTS.GRANTED
          );

          return granted;
        } else {
          // Android < 13 utilise WRITE_EXTERNAL_STORAGE
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: "Permission d'accès au stockage",
              message:
                "Nyth a besoin d'accéder au stockage pour sauvegarder vos vidéos",
              buttonNeutral: "Demander plus tard",
              buttonNegative: "Annuler",
              buttonPositive: "OK",
            }
          );

          const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;

          // Mettre à jour le cache
          await permissionCache.updatePermissionCache(
            PermissionType.WRITE_EXTERNAL_STORAGE,
            isGranted
          );

          return isGranted;
        }
      } catch (err) {
        console.error("[FileManager] Erreur Android permissions:", err);
        return false;
      }
    }

    // iOS: demander explicitement l'autorisation via CameraRoll si disponible (plus fiable), sinon via react-native-permissions
    if (Platform.OS === "ios") {
      try {
        console.log("[FileManager] iOS - Vérification des permissions photo");

        const cr: any = CameraRoll as any;

        // 1) Utiliser l'API CameraRoll si disponible
        const hasCRHasPermission = typeof cr?.hasPermission === "function" || typeof cr?.hasPermissions === "function";
        const hasCRRequestPermission = typeof cr?.requestPermission === "function" || typeof cr?.requestPermissions === "function";

        const callCRHasPermission = async (): Promise<boolean | undefined> => {
          try {
            const fn = (cr.hasPermission || cr.hasPermissions).bind(cr);
            const res = await fn({ access: "addOnly" });
            // Accepter différents formats de retour
            if (res === true || res === "granted" || res === "limited") return true;
            if (res && (res.granted === true || res.status === "granted" || res.access === "granted")) return true;
            return false;
          } catch (_) {
            return undefined;
          }
        };

        const callCRRequestPermission = async (): Promise<boolean | undefined> => {
          try {
            const fn = (cr.requestPermission || cr.requestPermissions).bind(cr);
            let res = await fn({ access: "addOnly" });
            if (res === true || res === "granted" || res === "limited") return true;
            if (res && (res.granted === true || res.status === "granted" || res.access === "granted")) return true;
            // Réessayer en mode complet si addOnly est refusé
            res = await fn({ access: "readWrite" });
            if (res === true || res === "granted" || res === "limited") return true;
            if (res && (res.granted === true || res.status === "granted" || res.access === "granted")) return true;
            return false;
          } catch (_) {
            return undefined;
          }
        };

        if (hasCRHasPermission || hasCRRequestPermission) {
          const alreadyGranted = hasCRHasPermission ? await callCRHasPermission() : undefined;
          if (alreadyGranted === true) {
            console.log("[FileManager] iOS - Permission CameraRoll déjà accordée");
            await permissionCache.updatePermissionCache(
              PermissionType.PHOTO_LIBRARY_ADD_ONLY,
              true
            );
            return true;
          }

          const requested = await callCRRequestPermission();
          if (requested === true) {
            console.log("[FileManager] iOS - Permission CameraRoll accordée après requête");
            await permissionCache.updatePermissionCache(
              PermissionType.PHOTO_LIBRARY_ADD_ONLY,
              true
            );
            return true;
          }
          console.warn("[FileManager] iOS - CameraRoll n'a pas accordé la permission, fallback RNPermissions");
          await permissionCache.updatePermissionCache(
            PermissionType.PHOTO_LIBRARY_ADD_ONLY,
            false
          );
        }

        // 2) Fallback: utiliser react-native-permissions
        const addOnly = await request(PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY);
        console.log(`[FileManager] iOS - Permission PHOTO_LIBRARY_ADD_ONLY : ${addOnly}`);

        const addOnlyGranted = addOnly === RESULTS.GRANTED || addOnly === RESULTS.LIMITED;
        await permissionCache.updatePermissionCache(
          PermissionType.PHOTO_LIBRARY_ADD_ONLY,
          addOnlyGranted,
          addOnly === RESULTS.LIMITED
        );

        if (addOnlyGranted) {
          console.log("[FileManager] iOS - Permission d'ajout accordée");
          return true;
        }

        const full = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
        console.log(`[FileManager] iOS - Permission PHOTO_LIBRARY : ${full}`);

        const fullGranted = full === RESULTS.GRANTED || full === RESULTS.LIMITED;
        await permissionCache.updatePermissionCache(
          PermissionType.PHOTO_LIBRARY,
          fullGranted,
          full === RESULTS.LIMITED
        );

        if (fullGranted) {
          console.log("[FileManager] iOS - Permission complète accordée");
          return true;
        }

        console.error("[FileManager] iOS - Aucune permission photo accordée");
        return false;
      } catch (err) {
        console.error("[FileManager] iOS - Erreur lors de la demande de permissions", err);
        return false;
      }
    }

    return true;
  }

  /**
   * Demande les permissions caméra et microphone avec cache
   */
  public static async requestCameraAndMicrophonePermissions(): Promise<{
    camera: boolean;
    microphone: boolean;
    allGranted: boolean;
  }> {
    const permissionCache = PermissionCacheService.getInstance();

    // Vérifier le cache d'abord
    const [cameraCached, micCached] = await Promise.all([
      permissionCache.isPermissionGranted(PermissionType.CAMERA),
      permissionCache.isPermissionGranted(PermissionType.MICROPHONE)
    ]);

    if (cameraCached && micCached) {
      console.log("[FileManager] Permissions caméra et micro trouvées en cache");
      return { camera: true, microphone: true, allGranted: true };
    }

    try {
      // Importer les hooks de permissions de react-native-vision-camera
      const { useCameraPermission, useMicrophonePermission } = await import("react-native-vision-camera");

      const {
        hasPermission: hasCameraPermission,
        requestPermission: requestCameraPermission,
      } = useCameraPermission();

      const {
        hasPermission: hasMicrophonePermission,
        requestPermission: requestMicrophonePermission,
      } = useMicrophonePermission();

      // Demander les permissions
      const [cameraGranted, micGranted] = await Promise.all([
        hasCameraPermission ? Promise.resolve(true) : requestCameraPermission(),
        hasMicrophonePermission ? Promise.resolve(true) : requestMicrophonePermission()
      ]);

      // Mettre à jour le cache
      await permissionCache.updatePermissionCache(PermissionType.CAMERA, cameraGranted);
      await permissionCache.updatePermissionCache(PermissionType.MICROPHONE, micGranted);

      const allGranted = cameraGranted && micGranted;

      console.log(`[FileManager] Permissions - Camera: ${cameraGranted}, Micro: ${micGranted}`);

      return {
        camera: cameraGranted,
        microphone: micGranted,
        allGranted
      };
    } catch (error) {
      console.error("[FileManager] Erreur lors de la demande des permissions caméra/micro:", error);

      // En cas d'erreur, invalider le cache pour forcer une nouvelle demande
      await permissionCache.invalidatePermissionCache(PermissionType.CAMERA);
      await permissionCache.invalidatePermissionCache(PermissionType.MICROPHONE);

      return { camera: false, microphone: false, allGranted: false };
    }
  }

  /**
   * Méthodes publiques pour accéder au cache des permissions
   */
  public static async getCachedPermissionStatus(type: PermissionType) {
    const permissionCache = PermissionCacheService.getInstance();
    return await permissionCache.getCachedPermissionStatus(type);
  }

  public static async isPermissionGranted(type: PermissionType): Promise<boolean> {
    const permissionCache = PermissionCacheService.getInstance();
    return await permissionCache.isPermissionGranted(type);
  }

  public static async invalidatePermissionCache(type: PermissionType): Promise<void> {
    const permissionCache = PermissionCacheService.getInstance();
    return await permissionCache.invalidatePermissionCache(type);
  }

  public static getPermissionCacheStats() {
    const permissionCache = PermissionCacheService.getInstance();
    return permissionCache.getCacheStats();
  }

  /**
   * Sauvegarde une vidéo dans la galerie avec gestion d'erreurs améliorée
   */
  public static async saveToGallery(videoUri: string): Promise<boolean> {
    try {
      console.log(`[FileManager] Début de la sauvegarde dans la galerie : ${videoUri}`);

      // Utiliser la fonction centralisée pour normaliser le chemin
      const normalizedPath = await normalizeFilePath(videoUri, {
        forceFilePrefix: true,
        validateExistence: false // On vérifiera la disponibilité après
      });

      console.log(`[FileManager] Chemin normalisé pour CameraRoll: ${normalizedPath}`);

      // Attendre que le fichier soit réellement disponible et stable
      const isAvailable = await waitForFileAvailability(normalizedPath, {
        ...DEFAULT_FILE_OPTIONS.video,
        timeoutMs: 8000 // Timeout plus long pour les vidéos
      });

      if (!isAvailable) {
        console.error(`[FileManager] Fichier non disponible après timeout: ${normalizedPath}`);
        Alert.alert(
          "Erreur de fichier",
          "Le fichier vidéo n'est pas prêt ou est corrompu. Veuillez réessayer.",
          [{ text: "OK" }]
        );
        return false;
      }

      // Demander les permissions nécessaires
      const hasPermission = await this.requestGalleryPermissions();
      if (!hasPermission) {
        Alert.alert(
          "Permission requise",
          "Pour sauvegarder vos vidéos dans la galerie, veuillez autoriser l'accès aux médias dans les paramètres de l'application.",
          [
            { text: "Annuler", style: "cancel" },
            {
              text: "Paramètres",
              onPress: () => { Linking.openSettings(); },
            },
          ]
        );
        return false;
      }

      // Préparer l'URI pour CameraRoll
      let cameraRollUri: string = normalizedPath || "";

      // Sur iOS, s'assurer que l'URI est dans le bon format
      if (Platform.OS === "ios" && !cameraRollUri.startsWith("file://")) {
        cameraRollUri = `file://${cameraRollUri}`;
      }

      console.log(`[FileManager] URI pour CameraRoll: ${cameraRollUri}`);

      // Tenter la sauvegarde avec différentes options
      let result = null;
      const saveOptions = { type: "video" as const };

      try {
        // Première tentative: avec album spécifique
        result = await CameraRoll.save(cameraRollUri, {
          ...saveOptions,
          album: "Nyth"
        });
        console.log(`[FileManager] Sauvegarde réussie avec album: ${result}`);
      } catch (albumError) {
        console.warn(`[FileManager] Échec avec album, tentative sans album:`, albumError);

        try {
          // Seconde tentative: sans album spécifique
          result = await CameraRoll.save(cameraRollUri, saveOptions);
          console.log(`[FileManager] Sauvegarde réussie sans album: ${result}`);
        } catch (noAlbumError) {
          console.error(`[FileManager] Échec sans album:`, noAlbumError);
          throw noAlbumError;
        }
      }

      if (result) {
        Alert.alert(
          "Sauvegarde réussie",
          "Votre vidéo a été sauvegardée dans la galerie.",
          [{ text: "OK" }]
        );
        return true;
      }

      throw new Error("Échec de sauvegarde - aucun résultat retourné");

    } catch (error) {
      console.error(`[FileManager] Erreur lors de la sauvegarde dans la galerie:`, error);

      // Messages d'erreur plus spécifiques
      let errorMessage = "Une erreur inconnue est survenue lors de la sauvegarde.";

      if (error instanceof Error) {
        if (error.message.includes("Permission") || error.message.includes("denied")) {
          errorMessage = "Permissions insuffisantes pour sauvegarder dans la galerie.";
        } else if (error.message.includes("introuvable") || error.message.includes("not found")) {
          errorMessage = "Le fichier vidéo est introuvable ou corrompu.";
        } else if (error.message.includes("vide") || error.message.includes("empty")) {
          errorMessage = "Le fichier vidéo est vide ou corrompu.";
        } else if (error.message.includes("format") || error.message.includes("invalid")) {
          errorMessage = "Format de fichier non supporté.";
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
