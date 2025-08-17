import RNFS from "react-native-fs";
import { getStorage } from "@react-native-firebase/storage";
import { getApp } from "@react-native-firebase/app";
import imageOptimizationService from "../../imageOptimizationService";

export class ProfilePhotoService {
  private async cleanOldProfilePhotos(
    userId: string,
    keepFileName: string
  ): Promise<void> {
    try {
      const folderRef = getStorage(getApp()).ref(`users/${userId}/avatar`);
      const list = await folderRef.listAll();
      const deletions = list.items
        .filter((item) => item.name !== keepFileName)
        .map((item) => item.delete().catch(() => undefined));
      if (deletions.length > 0) {
        await Promise.all(deletions);
      }
    } catch {}
  }
  // Méthode alternative avec base64
  async uploadProfilePhotoBase64(
    userId: string,
    photoUri: string
  ): Promise<string> {
    try {
      // Vérifier que l'URI est valide
      if (!photoUri || !photoUri.startsWith("file://")) {
        throw new Error("URI de photo invalide");
      }

      // Vérifier que le fichier existe
      const fileInfo = await RNFS.stat(photoUri);
      if (!fileInfo.isFile()) {
        throw new Error("Le fichier photo n'existe pas");
      }

      const base64 = await RNFS.readFile(photoUri, "base64");

      if (!base64 || base64.length === 0) {
        throw new Error("Impossible de lire le fichier en base64");
      }

      // Générer un nom unique pour la photo
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const filename = `photo_${timestamp}_${randomId}.jpg`;
      const storageRef = getStorage(getApp()).ref(
        `users/${userId}/avatar/${filename}`
      );

      const uploadResult = await storageRef.putString(base64, "base64", {
        contentType: "image/jpeg",
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          userId: userId,
          originalSize: fileInfo.size?.toString() || "0",
        },
      });

      const downloadUrl = await storageRef.getDownloadURL();

      await this.cleanOldProfilePhotos(userId, filename);

      return downloadUrl;
    } catch (error: any) {
      // Gestion d'erreurs spécifiques Firebase
      if (error.code) {
        switch (error.code) {
          case "storage/unauthorized":
            throw new Error(
              "Accès non autorisé. Vérifiez que vous êtes bien connecté."
            );
          case "storage/canceled":
            throw new Error("Upload annulé par l'utilisateur.");
          case "storage/quota-exceeded":
            throw new Error("Quota de stockage dépassé.");
          case "storage/invalid-format":
            throw new Error("Format de fichier non supporté.");
          case "storage/invalid-argument":
            throw new Error("Argument invalide pour l'upload.");
          default:
            throw new Error(`Erreur Firebase Storage: ${error.code}`);
        }
      }

      throw error;
    }
  }

  async uploadProfilePhoto(userId: string, photoUri: string): Promise<string> {
    try {
      // Optimiser l'image en version ultra légère seulement
      const optimizedImage = await imageOptimizationService.optimizeImage(
        photoUri,
        {
          maxWidth: 400, // Taille réduite pour ultra léger
          maxHeight: 400, // Taille réduite pour ultra léger
          quality: 0.6, // Qualité réduite pour fichier plus léger
          format: "JPEG",
        }
      );

      // Générer un nom de fichier unique
      const fileName = imageOptimizationService.generateFileName(
        userId,
        "main"
      );
      const storageRef = getStorage(getApp()).ref(
        `users/${userId}/avatar/${fileName}`
      );

      const localPath = optimizedImage.uri.startsWith("file://")
        ? optimizedImage.uri.replace("file://", "")
        : optimizedImage.uri;

      try {
        await storageRef.putFile(optimizedImage.uri, {
          contentType: "image/jpeg",
          customMetadata: {
            type: "profile_photo_optimized",
            optimized: "true",
            ultraLight: "true",
            width: optimizedImage.width.toString(),
            height: optimizedImage.height.toString(),
          },
        });
      } catch (fileUploadError) {
        const base64 = await RNFS.readFile(localPath, "base64");
        await storageRef.putString(base64, "base64", {
          contentType: "image/jpeg",
          customMetadata: {
            type: "profile_photo_optimized",
            optimized: "true",
            ultraLight: "true",
            width: optimizedImage.width.toString(),
            height: optimizedImage.height.toString(),
          },
        });
      }

      // Obtenir l'URL de téléchargement
      const downloadUrl = await storageRef.getDownloadURL();

      await this.cleanOldProfilePhotos(userId, fileName);
      return downloadUrl;
    } catch (error: any) {
      // Gestion d'erreurs spécifiques
      if (error.code === "storage/unauthorized") {
        throw new Error("Non autorisé : vérifiez que vous êtes connecté");
      } else if (error.code === "storage/canceled") {
        throw new Error("Upload annulé");
      } else if (error.code === "storage/unknown") {
        throw new Error(
          "Erreur inconnue lors de l'upload. Vérifiez votre connexion."
        );
      }

      throw error;
    }
  }
}
