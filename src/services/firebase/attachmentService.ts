import { getStorage } from "@react-native-firebase/storage";
import { getApp } from "@react-native-firebase/app";
import { TaskAttachment, TaskImage } from "../../types/planning";

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

export interface UploadResult {
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

class AttachmentService {
  private generateFileName(originalName: string, userId: string): string {
    const timestamp = Date.now();
    const extension = originalName.split(".").pop() || "";
    const baseName = originalName.replace(`.${extension}`, "");
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, "_");
    return `users/${userId}/attachments/${sanitizedName}_${timestamp}.${extension}`;
  }

  async uploadImage(
    uri: string,
    originalName: string,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      const { isValidFileUri } = require("@/utils/pathNormalizer");
      if (!uri || !isValidFileUri(uri)) {
        throw new Error("URI de fichier invalide");
      }

      if (!userId) {
        throw new Error("ID utilisateur requis");
      }

      const fileName = this.generateFileName(originalName, userId);
      const storageRef = getStorage(getApp()).ref(fileName);

      // Upload du fichier
      const uploadTask = storageRef.putFile(uri, {
        contentType: "image/jpeg",
      });

      if (onProgress) {
        uploadTask.on("state_changed", (snapshot) => {
          const progress = {
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          };
          onProgress(progress);
        });
      }

      await uploadTask;

      const downloadUrl = await storageRef.getDownloadURL();

      // Créer une miniature pour les images (pour l'instant, utiliser l'URL originale)
      const thumbnailUrl = downloadUrl;

      // Obtenir les métadonnées
      const metadata = await storageRef.getMetadata();

      return {
        url: downloadUrl,
        thumbnailUrl,
        fileName,
        fileSize: metadata.size,
        mimeType: "image/jpeg",
      };
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
          case "storage/retry-limit-exceeded":
            throw new Error(
              "Limite de tentatives dépassée. Vérifiez votre connexion."
            );
          default:
            throw new Error(`Erreur Firebase Storage: ${error.code}`);
        }
      }

      throw new Error("Échec de l'upload de l'image");
    }
  }

  async uploadFile(
    uri: string,
    originalName: string,
    mimeType: string,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      const fileName = this.generateFileName(originalName, userId);
      const storageRef = getStorage(getApp()).ref(fileName);

      // Upload du fichier
      const uploadTask = storageRef.putFile(uri, {
        contentType: mimeType,
      });

      if (onProgress) {
        uploadTask.on("state_changed", (snapshot) => {
          const progress = {
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          };
          onProgress(progress);
        });
      }

      await uploadTask;
      const downloadUrl = await storageRef.getDownloadURL();

      // Obtenir les métadonnées
      const metadata = await storageRef.getMetadata();

      return {
        url: downloadUrl,
        fileName,
        fileSize: metadata.size,
        mimeType,
      };
    } catch (error) {
      throw new Error("Échec de l'upload du fichier");
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    try {
      const storageRef = getStorage(getApp()).ref(fileName);
      await storageRef.delete();
    } catch (error) {
      throw new Error("Échec de la suppression du fichier");
    }
  }

  async deleteTaskAttachments(taskId: string, userId: string): Promise<void> {
    try {} catch (error) {
      throw new Error("Échec de la suppression des pièces jointes");
    }
  }
}

export const attachmentService = new AttachmentService();
