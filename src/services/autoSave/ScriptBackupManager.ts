import AsyncStorage from "@react-native-async-storage/async-storage";
import RNFS from "react-native-fs";
import { Script } from "../../types";
import { BackupMetadata } from "./types";

/**
 * Gestionnaire spécialisé pour les sauvegardes de scripts
 */
export class ScriptBackupManager {
  /**
   * Sauvegarde un script localement avec versioning
   */
  static async saveScript(
    scriptId: string,
    scriptData: Partial<Script>
  ): Promise<void> {
    try {
      // Charger les scripts existants
      const savedScripts = await AsyncStorage.getItem("scripts");
      const scripts: Script[] = savedScripts ? JSON.parse(savedScripts) : [];

      // Trouver et mettre à jour le script
      const existingIndex = scripts.findIndex((s) => s.id === scriptId);
      const timestamp = new Date().toISOString();

      if (existingIndex >= 0) {
        scripts[existingIndex] = {
          ...scripts[existingIndex],
          ...scriptData,
          updatedAt: timestamp,
        };
      } else {
        // Vérifier si un script avec le même titre existe déjà
        if (scriptData.title && scriptData.title.trim() !== "") {
          const titleIndex = scripts.findIndex(
            (s) => s.title.toLowerCase() === scriptData.title!.toLowerCase()
          );

          // Si un script avec le même titre existe, mettre à jour ce script au lieu d'en créer un nouveau
          if (titleIndex >= 0) {
            scripts[titleIndex] = {
              ...scripts[titleIndex],
              ...scriptData,
              updatedAt: timestamp,
            };

            // Sauvegarder
            await AsyncStorage.setItem("scripts", JSON.stringify(scripts));

            // Créer une sauvegarde versionnée
            await this.createScriptBackup(
              scripts[titleIndex].id,
              scripts[titleIndex]
            );

            return;
          }
        }

        // Nouveau script
        const newScript: Script = {
          id: scriptId,
          title: scriptData.title || "",
          content: scriptData.content || "",
          createdAt: timestamp,
          updatedAt: timestamp,
          estimatedDuration: Math.ceil(
            (scriptData.content?.split(" ").length || 0) / 150
          ),
        };
        scripts.push(newScript);
      }

      // Sauvegarder
      await AsyncStorage.setItem("scripts", JSON.stringify(scripts));

      // Créer une sauvegarde versionnée
      await this.createScriptBackup(
        scriptId,
        scripts[existingIndex >= 0 ? existingIndex : scripts.length - 1]
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crée une sauvegarde versionnée d'un script
   */
  static async createScriptBackup(
    scriptId: string,
    script: Script
  ): Promise<void> {
    try {
      // Vérifier si une sauvegarde récente existe déjà pour ce script
      const backups = await this.getScriptBackups();
      const recentBackups = backups.filter(
        (backup) =>
          backup.id.startsWith(scriptId) &&
          Date.now() - backup.timestamp < 5 * 60 * 1000 // 5 minutes
      );

      // Si une sauvegarde récente existe, ne pas créer de nouvelle sauvegarde
      if (recentBackups.length > 0) {
        return;
      }

      const backupDir = `${RNFS.DocumentDirectoryPath}backups/scripts/`;
      await RNFS.mkdir(backupDir);

      const backupFile = `${backupDir}${scriptId}_${Date.now()}.json`;
      await RNFS.writeFile(backupFile, JSON.stringify(script));

      // Sauvegarder les métadonnées
      await this.saveBackupMetadata({
        id: `${scriptId}_${Date.now()}`,
        type: "script",
        timestamp: Date.now(),
        size: JSON.stringify(script).length,
        localPath: backupFile,
      });
    } catch (error) {}
  }

  /**
   * Récupère la liste des sauvegardes de scripts
   */
  static async getScriptBackups(): Promise<BackupMetadata[]> {
    try {
      const savedBackups = await AsyncStorage.getItem("backupMetadata");
      const allBackups: BackupMetadata[] = savedBackups
        ? JSON.parse(savedBackups)
        : [];
      return allBackups.filter((backup) => backup.type === "script");
    } catch (error) {
      return [];
    }
  }

  /**
   * Restaure un script depuis une sauvegarde
   */
  static async restoreScript(backupId: string): Promise<Script | null> {
    try {
      const backups = await this.getScriptBackups();
      const backup = backups.find((b) => b.id === backupId);

      if (!backup || !backup.localPath) {
        return null;
      }

      const fileInfo = await RNFS.stat(backup.localPath);
      if (!fileInfo.isFile()) {
        return null;
      }

      const scriptData = await RNFS.readFile(backup.localPath);
      const script: Script = JSON.parse(scriptData);

      return script;
    } catch (error) {
      return null;
    }
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
