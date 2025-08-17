import AsyncStorage from "@react-native-async-storage/async-storage";
import RNFS from "react-native-fs";
import { Recording } from "../../types";
import { BackupMetadata } from "./types";

/**
 * Gestionnaire spécialisé pour les sauvegardes d'enregistrements
 * NOTE: Les vidéos ne sont JAMAIS sauvegardées dans le cloud
 */
export class RecordingBackupManager {
  private static toLocalPath(uri: string): string {
    return uri && uri.startsWith("file://") ? uri.replace("file://", "") : uri;
  }
  /**
   * Sauvegarde un enregistrement localement
   * NOTE: Les vidéos ne sont PAS sauvegardées dans le cloud
   */
  static async saveRecording(recording: Recording): Promise<void> {
    try {
      // Charger les enregistrements existants
      const savedRecordings = await AsyncStorage.getItem("recordings");
      const recordings: Recording[] = savedRecordings
        ? JSON.parse(savedRecordings)
        : [];

      // Trouver et mettre à jour ou ajouter l'enregistrement
      const existingIndex = recordings.findIndex((r) => r.id === recording.id);

      if (existingIndex >= 0) {
        recordings[existingIndex] = recording;
      } else {
        recordings.push(recording);
      }

      // Sauvegarder la liste mise à jour
      await AsyncStorage.setItem("recordings", JSON.stringify(recordings));

      // Créer une sauvegarde locale du fichier vidéo
      await this.createVideoBackup(recording);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crée une sauvegarde locale d'un fichier vidéo
   * NOTE: Les vidéos ne sont JAMAIS sauvegardées dans le cloud
   */
  static async createVideoBackup(recording: Recording): Promise<void> {
    try {
      const backupDir = `${RNFS.DocumentDirectoryPath}/backups/videos/`;
      await RNFS.mkdir(backupDir);

      const sourcePath = this.toLocalPath(recording.videoUri);
      const fileInfo = await RNFS.stat(sourcePath);
      if (!fileInfo.isFile()) {
        return;
      }

      const backupFile = `${backupDir}${recording.id}_${Date.now()}.mp4`;
      await RNFS.copyFile(sourcePath, backupFile);

      // Sauvegarder les métadonnées (local uniquement)
      await this.saveBackupMetadata({
        id: `${recording.id}_${Date.now()}`,
        type: "recording",
        timestamp: Date.now(),
        size: (fileInfo as any).size || 0,
        localPath: backupFile,
        // cloudUrl: undefined - les vidéos ne vont jamais dans le cloud
      });
    } catch (error) {}
  }

  /**
   * Récupère la liste des sauvegardes d'enregistrements
   */
  static async getRecordingBackups(): Promise<BackupMetadata[]> {
    try {
      const savedBackups = await AsyncStorage.getItem("backupMetadata");
      const allBackups: BackupMetadata[] = savedBackups
        ? JSON.parse(savedBackups)
        : [];
      return allBackups.filter((backup) => backup.type === "recording");
    } catch (error) {
      return [];
    }
  }

  /**
   * Supprime les sauvegardes d'enregistrements anciennes
   */
  static async cleanupOldRecordingBackups(maxBackups: number): Promise<void> {
    try {
      const backupDir = `${RNFS.DocumentDirectoryPath}/backups/videos/`;

      // Vérifier si le dossier existe
      const dirInfo = await RNFS.stat(backupDir);
      if (!dirInfo.isDirectory()) {
        return;
      }

      const files = await RNFS.readDir(backupDir);

      if (files.length <= maxBackups) {
        return;
      }

      // Trier par date (du plus ancien au plus récent)
      const sortedFiles = files.sort((a, b) => {
        const timestampA = parseInt(a.name.split("_")[1].split(".")[0]);
        const timestampB = parseInt(b.name.split("_")[1].split(".")[0]);
        return timestampA - timestampB;
      });

      // Supprimer les plus anciens
      const filesToDelete = sortedFiles.slice(0, files.length - maxBackups);

      for (const file of filesToDelete) {
        await RNFS.unlink(`${backupDir}${file}`);
      }
    } catch (error) {}
  }

  /**
   * Sauvegarde les métadonnées de backup
   */
  private static async saveBackupMetadata(
    metadata: BackupMetadata
  ): Promise<void> {
    try {
      const savedBackups = await AsyncStorage.getItem("backupMetadata");
      const backups: BackupMetadata[] = savedBackups
        ? JSON.parse(savedBackups)
        : [];
      backups.push(metadata);
      await AsyncStorage.setItem("backupMetadata", JSON.stringify(backups));
    } catch (error) {}
  }
}
