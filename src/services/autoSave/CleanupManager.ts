import AsyncStorage from "@react-native-async-storage/async-storage";
import RNFS from "react-native-fs";
import { BackupMetadata, BackupStats } from "./types";

/**
 * Gestionnaire spécialisé pour le nettoyage et la maintenance des sauvegardes
 */
export class CleanupManager {
  /**
   * Nettoie les anciennes sauvegardes pour respecter le nombre maximum
   */
  static async cleanupOldBackups(
    backupDir: string,
    maxBackups: number
  ): Promise<void> {
    try {
      // Vérifier si le dossier existe
      const dirInfo = await RNFS.stat(backupDir);
      if (!dirInfo.isDirectory()) {
        return;
      }

      const files = await RNFS.readDir(backupDir);

      if (files.length <= maxBackups) {
        return;
      }

      // Grouper les fichiers par ID de script
      const backupsByScript = new Map<string, string[]>();

      files.forEach((file) => {
        // Format du nom: scriptId_timestamp.json
        const scriptId = file.name.split("_")[0];
        if (!backupsByScript.has(scriptId)) {
          backupsByScript.set(scriptId, []);
        }
        backupsByScript.get(scriptId)?.push(file.name);
      });

      // Pour chaque script, conserver uniquement les X sauvegardes les plus récentes
      const filesToDelete: string[] = [];

      backupsByScript.forEach((scriptFiles, scriptId) => {
        // Trier par date (du plus récent au plus ancien)
        scriptFiles.sort((a, b) => {
          const timestampA = parseInt(a.split("_")[1].split(".")[0]);
          const timestampB = parseInt(b.split("_")[1].split(".")[0]);
          return timestampB - timestampA;
        });

        // Garder uniquement les 2 plus récentes
        const toDelete = scriptFiles.slice(2);
        filesToDelete.push(...toDelete);
      });

      // Ensuite, si on a encore trop de sauvegardes, supprimer les plus anciennes
      const allSortedFiles = files.sort((a, b) => {
        const timestampA = parseInt(a.name.split("_")[1].split(".")[0]);
        const timestampB = parseInt(b.name.split("_")[1].split(".")[0]);
        return timestampA - timestampB;
      });

      // Ajouter à la liste des fichiers à supprimer les plus anciens
      const remainingToDelete = Math.max(
        0,
        files.length - maxBackups - filesToDelete.length
      );
      if (remainingToDelete > 0) {
        filesToDelete.push(
          ...allSortedFiles.slice(0, remainingToDelete).map((f) => f.name)
        );
      }

      // Supprimer les fichiers
      for (const file of filesToDelete) {
        await RNFS.unlink(`${backupDir}${file}`);
      }
    } catch (error) {}
  }

  /**
   * Supprime toutes les sauvegardes
   */
  static async cleanupAllBackups(): Promise<void> {
    try {
      // Nettoyer les scripts
      const scriptBackupDir = `${RNFS.DocumentDirectoryPath}backups/scripts/`;
      await this.deleteDirectoryContents(scriptBackupDir);

      // Nettoyer les vidéos
      const videoBackupDir = `${RNFS.DocumentDirectoryPath}backups/videos/`;
      await this.deleteDirectoryContents(videoBackupDir);

      // Nettoyer les métadonnées
      await AsyncStorage.removeItem("backupMetadata");
    } catch (error) {
      throw error;
    }
  }

  /**
   * Nettoie toutes les sauvegardes en conservant uniquement la version la plus récente de chaque script
   */
  static async cleanupRedundantBackups(): Promise<void> {
    try {
      // Nettoyer les scripts
      const backupDir = `${RNFS.DocumentDirectoryPath}backups/scripts/`;
      const dirInfo = await RNFS.stat(backupDir);
      if (!dirInfo.isDirectory()) {
        return;
      }

      const files = await RNFS.readDir(backupDir);

      // Grouper les fichiers par ID de script
      const backupsByScript = new Map<string, string[]>();

      files.forEach((file) => {
        // Format du nom: scriptId_timestamp.json
        const scriptId = file.name.split("_")[0];
        if (!backupsByScript.has(scriptId)) {
          backupsByScript.set(scriptId, []);
        }
        backupsByScript.get(scriptId)?.push(file.name);
      });

      // Pour chaque script, conserver uniquement la sauvegarde la plus récente
      const filesToDelete: string[] = [];

      backupsByScript.forEach((scriptFiles, scriptId) => {
        // Trier par date (du plus récent au plus ancien)
        scriptFiles.sort((a, b) => {
          const timestampA = parseInt(a.split("_")[1].split(".")[0]);
          const timestampB = parseInt(b.split("_")[1].split(".")[0]);
          return timestampB - timestampA;
        });

        // Garder uniquement la plus récente
        const toDelete = scriptFiles.slice(1);
        filesToDelete.push(...toDelete);
      });

      // Supprimer les fichiers
      for (const file of filesToDelete) {
        await RNFS.unlink(`${backupDir}${file}`);
      }

      // Mettre à jour les métadonnées
      const backups = await this.getAllBackups();
      const remainingBackups = backups.filter(
        (backup) =>
          !filesToDelete.some((file) => backup.id === file.split(".")[0])
      );

      await AsyncStorage.setItem(
        "backupMetadata",
        JSON.stringify(remainingBackups)
      );

      return;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calcule les statistiques des sauvegardes
   */
  static async getBackupStats(): Promise<BackupStats> {
    try {
      const backups = await this.getAllBackups();

      const scriptBackups = backups.filter((b) => b.type === "script");
      const recordingBackups = backups.filter((b) => b.type === "recording");

      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
      const timestamps = backups.map((b) => b.timestamp);
      const lastBackup = timestamps.length > 0 ? Math.max(...timestamps) : null;

      return {
        totalBackups: backups.length,
        scriptBackups: scriptBackups.length,
        recordingBackups: recordingBackups.length,
        totalSize,
        lastBackup,
      };
    } catch (error) {
      return {
        totalBackups: 0,
        scriptBackups: 0,
        recordingBackups: 0,
        totalSize: 0,
        lastBackup: null,
      };
    }
  }

  /**
   * Récupère toutes les sauvegardes
   */
  private static async getAllBackups(): Promise<BackupMetadata[]> {
    try {
      const savedBackups = await AsyncStorage.getItem("backupMetadata");
      return savedBackups ? JSON.parse(savedBackups) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Supprime le contenu d'un dossier
   */
  private static async deleteDirectoryContents(dirPath: string): Promise<void> {
    try {
      const dirInfo = await RNFS.stat(dirPath);
      if (!dirInfo.isDirectory()) {
        return;
      }

      const files = await RNFS.readDir(dirPath);

      for (const file of files) {
        await RNFS.unlink(`${dirPath}${file.name}`);
      }
    } catch (error) {}
  }
}
