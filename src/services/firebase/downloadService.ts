import RNFS from "react-native-fs";
import { getStorage } from "@react-native-firebase/storage";
import { getApp } from "@react-native-firebase/app";
import { Platform } from "react-native";
import { getAuth } from "@react-native-firebase/auth";

export interface DownloadOptions {
  onProgress?: (progress: number) => void;
  headers?: Record<string, string>;
}

class FirebaseDownloadService {
  /**
   * Régénère une URL de téléchargement Firebase Storage à partir du chemin
   */
  async refreshDownloadUrl(storagePath: string): Promise<string> {
    try {
      const storageRef = getStorage(getApp()).ref(storagePath);
      const newUrl = await storageRef.getDownloadURL();
      return newUrl;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Extrait le chemin de stockage depuis une URL Firebase Storage
   */
  extractStoragePathFromUrl(url: string): string | null {
    try {
      // Format typique: https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Fto%2Ffile?alt=media&token=...
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/o\/(.+)$/);
      if (pathMatch) {
        // Décoder l'URL pour obtenir le vrai chemin
        return decodeURIComponent(pathMatch[1]);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Télécharge un fichier depuis Firebase Storage avec authentification
   */
  async downloadFile(
    url: string,
    destinationPath: string,
    options?: DownloadOptions
  ): Promise<RNFS.DownloadResult> {
    try {
      // Obtenir le token d'authentification Firebase
      const currentUser = getAuth().currentUser;
      let authToken: string | null = null;

      if (currentUser) {
        try {
          authToken = await currentUser.getIdToken();
        } catch (tokenError) {}
      }

      // Préparer les headers
      const headers: Record<string, string> = {
        "User-Agent": "Visions/1.0",
        ...options?.headers,
      };

      // Ajouter le token d'authentification si disponible
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      // Télécharger le fichier
      const downloadResult = await RNFS.downloadFile({
        fromUrl: url,
        toFile: destinationPath,
        background: true,
        discretionary: true,
        headers,
        progress: options?.onProgress
          ? (res) => {
              const progressPercent =
                (res.bytesWritten / res.contentLength) * 100;
              options.onProgress!(progressPercent);
            }
          : undefined,
      }).promise;

      return downloadResult;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Télécharge un fichier avec retry en cas d'URL expirée
   */
  async downloadFileWithRetry(
    url: string,
    destinationPath: string,
    storagePath?: string,
    options?: DownloadOptions
  ): Promise<RNFS.DownloadResult> {
    try {
      // Première tentative avec l'URL originale
      return await this.downloadFile(url, destinationPath, options);
    } catch (error: any) {
      // Si erreur 404 et qu'on a le chemin de stockage, essayer de régénérer l'URL
      if (error?.statusCode === 404 && storagePath) {
        try {
          const newUrl = await this.refreshDownloadUrl(storagePath);
          return await this.downloadFile(newUrl, destinationPath, options);
        } catch (retryError) {
          throw error; // Relancer l'erreur originale
        }
      }

      // Si pas de chemin de stockage, essayer d'extraire depuis l'URL
      if (error?.statusCode === 404 && !storagePath) {
        const extractedPath = this.extractStoragePathFromUrl(url);
        if (extractedPath) {
          try {
            const newUrl = await this.refreshDownloadUrl(extractedPath);
            return await this.downloadFile(newUrl, destinationPath, options);
          } catch (retryError) {}
        }
      }

      throw error;
    }
  }

  /**
   * Télécharge un fichier temporaire depuis Firebase Storage
   */
  async downloadTempFile(
    url: string,
    fileName: string,
    options?: DownloadOptions
  ): Promise<{ path: string; result: RNFS.DownloadResult }> {
    const tempDir =
      Platform.OS === "ios"
        ? RNFS.TemporaryDirectoryPath
        : RNFS.CachesDirectoryPath;

    const tempFileName = `temp_${Date.now()}_${fileName}`;
    const tempFilePath = `${tempDir}/${tempFileName}`;

    const result = await this.downloadFileWithRetry(
      url,
      tempFilePath,
      undefined,
      options
    );

    return {
      path: tempFilePath,
      result,
    };
  }

  /**
   * Nettoie un fichier temporaire après un délai
   */
  async cleanupTempFile(
    filePath: string,
    delayMs: number = 5000
  ): Promise<void> {
    setTimeout(async () => {
      try {
        await RNFS.unlink(filePath);
      } catch (error) {}
    }, delayMs);
  }

  /**
   * Vérifie si une URL Firebase Storage nécessite une authentification
   */
  isFirebaseStorageUrl(url: string): boolean {
    return (
      url.includes("firebasestorage.googleapis.com") ||
      url.includes("firebasestorage.app")
    );
  }
}

export default new FirebaseDownloadService();
