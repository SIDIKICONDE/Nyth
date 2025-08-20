import { getStorage } from "@react-native-firebase/storage";
import { getApp } from "@react-native-firebase/app";
import { createLogger } from "../../utils/optimizedLogger";

const logger = createLogger("FirebaseStorageService");

class FirebaseStorageService {
  // Upload d'un fichier
  async uploadFile(
    filePath: string,
    localFilePath: string,
    metadata?: any
  ): Promise<string> {
    try {
      logger.info(`📤 Upload fichier vers: ${filePath}`);
      const reference = getStorage(getApp()).ref(filePath);

      await reference.putFile(localFilePath, metadata);
      const downloadURL = await reference.getDownloadURL();

      logger.info("✅ Fichier uploadé avec succès");
      return downloadURL;
    } catch (error) {
      logger.error("❌ Erreur lors de l'upload:", error);
      throw error;
    }
  }

  // Upload avec progression
  uploadFileWithProgress(
    filePath: string,
    localFilePath: string,
    onProgress?: (progress: number) => void,
    metadata?: any
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        logger.info(`📤 Upload avec progression vers: ${filePath}`);
        const reference = getStorage(getApp()).ref(filePath);
        const task = reference.putFile(localFilePath, metadata);

        task.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.(progress);
          },
          (error) => {
            logger.error("❌ Erreur upload avec progression:", error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await reference.getDownloadURL();
              logger.info("✅ Upload avec progression terminé");
              resolve(downloadURL);
            } catch (error) {
              reject(error);
            }
          }
        );
      } catch (error) {
        logger.error("❌ Erreur configuration upload:", error);
        reject(error);
      }
    });
  }

  // Télécharger l'URL d'un fichier
  async getDownloadURL(filePath: string): Promise<string> {
    try {
      const reference = getStorage(getApp()).ref(filePath);
      return await reference.getDownloadURL();
    } catch (error) {
      logger.error("❌ Erreur récupération URL:", error);
      throw error;
    }
  }

  // Supprimer un fichier
  async deleteFile(filePath: string): Promise<void> {
    try {
      const reference = getStorage(getApp()).ref(filePath);
      await reference.delete();
      logger.info(`🗑️ Fichier supprimé: ${filePath}`);
    } catch (error) {
      logger.error("❌ Erreur suppression fichier:", error);
      throw error;
    }
  }

  // Lister les fichiers dans un dossier
  async listFiles(folderPath: string): Promise<string[]> {
    try {
      const reference = getStorage(getApp()).ref(folderPath);
      const result = await reference.listAll();

      const fileNames = result.items.map((item) => item.name);
      logger.info(`📁 ${fileNames.length} fichiers trouvés dans ${folderPath}`);

      return fileNames;
    } catch (error) {
      logger.error("❌ Erreur listage fichiers:", error);
      throw error;
    }
  }

  // Obtenir les métadonnées d'un fichier
  async getFileMetadata(filePath: string): Promise<any> {
    try {
      const reference = getStorage(getApp()).ref(filePath);
      return await reference.getMetadata();
    } catch (error) {
      logger.error("❌ Erreur récupération métadonnées:", error);
      throw error;
    }
  }

  // Mettre à jour les métadonnées d'un fichier
  async updateFileMetadata(filePath: string, metadata: any): Promise<void> {
    try {
      const reference = getStorage(getApp()).ref(filePath);
      await reference.updateMetadata(metadata);
      logger.info(`📝 Métadonnées mises à jour: ${filePath}`);
    } catch (error) {
      logger.error("❌ Erreur mise à jour métadonnées:", error);
      throw error;
    }
  }

  // Vérifier si un fichier existe
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const reference = getStorage(getApp()).ref(filePath);
      await reference.getMetadata();
      return true;
    } catch (error: any) {
      if (error.code === "storage/object-not-found") {
        return false;
      }
      throw error;
    }
  }

  // Upload de données brutes (base64, buffer, etc.)
  async uploadData(
    filePath: string,
    data: string,
    format: "base64" | "raw" = "base64",
    metadata?: any
  ): Promise<string> {
    try {
      logger.info(`📤 Upload données vers: ${filePath}`);
      const reference = getStorage(getApp()).ref(filePath);

      let uploadTask;
      if (format === "base64") {
        uploadTask = reference.putString(data, "base64", metadata);
      } else {
        uploadTask = reference.putString(data, "raw", metadata);
      }

      await uploadTask;
      const downloadURL = await reference.getDownloadURL();

      logger.info("✅ Données uploadées avec succès");
      return downloadURL;
    } catch (error) {
      logger.error("❌ Erreur upload données:", error);
      throw error;
    }
  }
}

export const firebaseStorageService = new FirebaseStorageService();
export default firebaseStorageService;
