import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { PermissionsAndroid, Platform, Alert } from "react-native";
import { PERMISSIONS, RESULTS, request } from "react-native-permissions";
import RNFS from "react-native-fs";

/**
 * Utilitaire pour la gestion des fichiers vidéo
 */
export class FileManager {
  /**
   * Résout le chemin d'un fichier pour iOS en essayant plusieurs formats
   */
  private static async resolveIOSPath(uri: string): Promise<string | null> {
    if (Platform.OS !== "ios") return uri;
    
    const pathVariants = [
      // URI original
      uri,
      // Sans file://
      uri.startsWith("file://") ? uri.replace("file://", "") : uri,
      // Avec file:// si absent
      !uri.startsWith("file://") ? `file://${uri}` : uri,
      // Décodé
      decodeURIComponent(uri),
      // Décodé sans file://
      uri.startsWith("file://") ? decodeURIComponent(uri.replace("file://", "")) : decodeURIComponent(uri)
    ];
    
    // Supprimer les doublons
    const uniquePaths = [...new Set(pathVariants)];
    
    console.log(`[FileManager] iOS - Test de ${uniquePaths.length} variantes de chemin`);
    
    for (const path of uniquePaths) {
      try {
        const exists = await RNFS.exists(path);
        if (exists) {
          console.log(`[FileManager] iOS - Chemin valide trouvé : ${path}`);
          return path;
        }
      } catch (error) {
        // Ignorer les erreurs et essayer la variante suivante
      }
    }
    
    console.error(`[FileManager] iOS - Aucune variante de chemin valide trouvée`);
    return null;
  }
  
  private static toLocalPath(uri: string): string {
    // Sur iOS, les chemins peuvent avoir des espaces encodés ou d'autres caractères spéciaux
    let localPath = uri.startsWith("file://") ? uri.replace("file://", "") : uri;
    
    // Décoder les espaces et autres caractères spéciaux pour iOS
    if (Platform.OS === "ios") {
      localPath = decodeURIComponent(localPath);
    }
    
    console.log(`[FileManager] toLocalPath - URI: ${uri} -> Local: ${localPath}`);
    return localPath;
  }
  /**
   * Vérifie qu'un fichier vidéo existe
   */
  public static async validateVideoFile(videoUri: string): Promise<void> {
    const localPath = this.toLocalPath(videoUri);
    
    // Vérifier d'abord si le fichier existe
    let fileExists = await RNFS.exists(localPath);
    
    // Sur iOS, si le fichier n'existe pas, essayer d'autres variantes de chemin
    if (!fileExists && Platform.OS === "ios") {
      console.warn(`[FileManager] iOS - Fichier non trouvé à : ${localPath}`);
      
      // Essayer sans décoder l'URI
      const alternativePath = videoUri.startsWith("file://") ? videoUri.replace("file://", "") : videoUri;
      fileExists = await RNFS.exists(alternativePath);
      
      if (fileExists) {
        console.log(`[FileManager] iOS - Fichier trouvé avec le chemin alternatif : ${alternativePath}`);
        localPath = alternativePath;
      } else {
        // Essayer avec l'URI original sans modification
        fileExists = await RNFS.exists(videoUri);
        if (fileExists) {
          console.log(`[FileManager] iOS - Fichier trouvé avec l'URI original : ${videoUri}`);
          localPath = videoUri;
        }
      }
    }
    
    if (!fileExists) {
      console.error(`[FileManager] Le fichier n'existe pas : ${localPath}`);
      console.error(`[FileManager] URI original : ${videoUri}`);
      
      // Lister le contenu du répertoire parent pour débogage
      if (Platform.OS === "ios") {
        try {
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
      
      throw new Error(`Fichier vidéo introuvable: ${localPath}`);
    }
    
    // Vérifier ensuite que c'est bien un fichier
    try {
      const fileInfo = await RNFS.stat(localPath);
      if (!fileInfo.isFile()) {
        console.error(`[FileManager] Le chemin n'est pas un fichier : ${localPath}`);
        throw new Error("Le chemin ne pointe pas vers un fichier vidéo valide");
      }
      
      // Vérifier que le fichier n'est pas vide
      if (fileInfo.size === 0) {
        console.error(`[FileManager] Le fichier est vide : ${localPath}`);
        throw new Error("Le fichier vidéo est vide");
      }
      
      console.log(`[FileManager] Fichier validé avec succès : ${localPath}, taille: ${fileInfo.size} octets`);
    } catch (error) {
      console.error(`[FileManager] Erreur lors de la validation du fichier :`, error);
      throw error;
    }
  }

  /**
   * Demande les permissions nécessaires pour sauvegarder dans la galerie
   */
  private static async requestGalleryPermissions(): Promise<boolean> {
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
        console.log("[FileManager] iOS - Vérification des permissions photo");
        
        // Essayer d'abord la permission d'ajout seulement (plus restrictive)
        const addOnly = await request(PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY);
        console.log(`[FileManager] iOS - Permission PHOTO_LIBRARY_ADD_ONLY : ${addOnly}`);
        
        if (addOnly === RESULTS.GRANTED) {
          console.log("[FileManager] iOS - Permission d'ajout accordée");
          return true;
        }
        
        // Si refusée, essayer la permission complète
        if (addOnly === RESULTS.DENIED || addOnly === RESULTS.BLOCKED) {
          console.log("[FileManager] iOS - Tentative avec la permission complète");
          const full = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
          console.log(`[FileManager] iOS - Permission PHOTO_LIBRARY : ${full}`);
          
          if (full === RESULTS.GRANTED) {
            console.log("[FileManager] iOS - Permission complète accordée");
            return true;
          }
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
   * Sauvegarde une vidéo dans la galerie
   */
  public static async saveToGallery(videoUri: string): Promise<boolean> {
    try {
      console.log(`[FileManager] Début de la sauvegarde dans la galerie : ${videoUri}`);
      
      // Sur iOS, résoudre le chemin et attendre un peu
      let resolvedUri = videoUri;
      if (Platform.OS === "ios") {
        console.log(`[FileManager] iOS - Attente de 500ms pour s'assurer que le fichier est prêt`);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Essayer de résoudre le chemin iOS
        const resolvedPath = await this.resolveIOSPath(videoUri);
        if (resolvedPath) {
          resolvedUri = resolvedPath;
          console.log(`[FileManager] iOS - Utilisation du chemin résolu : ${resolvedUri}`);
        } else {
          console.error(`[FileManager] iOS - Impossible de résoudre le chemin, utilisation de l'URI original`);
        }
      }
      
      // Vérifier que le fichier existe avant de continuer
      await this.validateVideoFile(resolvedUri);

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

      // Normaliser l'URI pour iOS et Android
      let normalizedUri = resolvedUri;
      
      if (Platform.OS === "ios") {
        // Sur iOS, vérifier plusieurs formats possibles
        if (!resolvedUri.startsWith("file://") && !resolvedUri.startsWith("ph://")) {
          normalizedUri = `file://${resolvedUri}`;
        }
        console.log(`[FileManager] iOS - URI normalisée : ${normalizedUri}`);
      } else {
        // Android
        if (!resolvedUri.startsWith("file://")) {
          normalizedUri = `file://${resolvedUri}`;
        }
        console.log(`[FileManager] Android - URI normalisée : ${normalizedUri}`);
      }

      // Sauvegarder la vidéo dans la galerie
      console.log(`[FileManager] Tentative de sauvegarde avec CameraRoll.save()`);
      console.log(`[FileManager] URI : ${normalizedUri}`);
      console.log(`[FileManager] Type : video`);
      console.log(`[FileManager] Album : Nyth`);
      
      let result;
      try {
        result = await CameraRoll.save(normalizedUri, {
          type: "video",
          album: "Nyth", // Créer un album spécifique
        });
        console.log(`[FileManager] Résultat CameraRoll.save : ${result}`);
      } catch (saveError) {
        console.error(`[FileManager] Erreur CameraRoll.save :`, saveError);
        
        // Sur iOS, essayer sans spécifier l'album si ça échoue
        if (Platform.OS === "ios") {
          console.log(`[FileManager] Tentative sans album spécifique sur iOS`);
          try {
            result = await CameraRoll.save(normalizedUri, {
              type: "video"
            });
            console.log(`[FileManager] Succès sans album : ${result}`);
          } catch (retryError) {
            console.error(`[FileManager] Échec aussi sans album :`, retryError);
            throw retryError;
          }
        } else {
          throw saveError;
        }
      }

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
        console.error(`[FileManager] Erreur lors de la sauvegarde dans la galerie :`, error);
        
        if (error.message.includes("Permission")) {
          errorMessage =
            "Permissions insuffisantes pour sauvegarder dans la galerie.";
        } else if (error.message.includes("Fichier vidéo introuvable")) {
          errorMessage = "Le fichier vidéo est introuvable ou corrompu.";
        } else if (error.message.includes("vide")) {
          errorMessage = "Le fichier vidéo est vide ou corrompu.";
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
