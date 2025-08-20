/**
 * Point d'entrée principal pour le système de sauvegarde automatique refactorisé
 * Maintient la compatibilité avec l'ancienne API AutoSaveService
 */

// Exports des modules spécialisés
export { CleanupManager } from "./CleanupManager";
export { ConfigManager } from "./ConfigManager";
export { RecordingBackupManager } from "./RecordingBackupManager";
export { ScriptBackupManager } from "./ScriptBackupManager";
export * from "./types";

// Imports pour la classe de compatibilité
import { Recording, Script } from "../../types";
import { CleanupManager } from "./CleanupManager";
import { ConfigManager } from "./ConfigManager";
import { RecordingBackupManager } from "./RecordingBackupManager";
import { ScriptBackupManager } from "./ScriptBackupManager";
import { AutoSaveConfig, BackupMetadata, BackupStats } from "./types";

/**
 * Classe principale du service de sauvegarde automatique
 * Maintient la compatibilité avec l'ancienne API tout en utilisant les nouveaux modules
 */
export class AutoSaveService {
  private static instance: AutoSaveService | null = null;
  private saveInterval: ReturnType<typeof setTimeout> | null = null;
  private saveTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private isEnabled: boolean = true;

  /**
   * Singleton pattern pour maintenir la compatibilité
   */
  static getInstance(): AutoSaveService {
    if (!this.instance) {
      this.instance = new AutoSaveService();
    }
    return this.instance;
  }

  /**
   * Initialise le service de sauvegarde automatique
   */
  async initialize(): Promise<void> {
    try {
      const config = await ConfigManager.loadConfig();
      this.isEnabled = config.enabled;

      if (this.isEnabled) {
        this.startAutoSave(config.interval);
      }
    } catch (error) {}
  }

  /**
   * Démarre la sauvegarde automatique
   */
  private startAutoSave(interval: number): void {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }

    this.saveInterval = setInterval(async () => {
      try {
        await this.performAutoSave();
      } catch (error) {}
    }, interval);
  }

  /**
   * Arrête la sauvegarde automatique générale
   */
  private stopGeneralAutoSave(): void {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }
  }

  /**
   * Effectue une sauvegarde automatique
   */
  private async performAutoSave(): Promise<void> {}

  /**
   * Sauvegarde un script (API de compatibilité)
   */
  async saveScript(
    scriptId: string,
    scriptData: Partial<Script>
  ): Promise<void> {
    return ScriptBackupManager.saveScript(scriptId, scriptData);
  }

  /**
   * Sauvegarde un enregistrement (API de compatibilité)
   */
  async saveRecording(recording: Recording): Promise<void> {
    return RecordingBackupManager.saveRecording(recording);
  }

  /**
   * Nettoie les anciennes sauvegardes (API de compatibilité)
   */
  async cleanupOldBackups(): Promise<void> {
    const config = await ConfigManager.loadConfig();

    // Nettoyer les scripts
    const scriptDir = `${
      require("react-native-fs").RNFS.DocumentDirectoryPath
    }backups/scripts/`;
    await CleanupManager.cleanupOldBackups(scriptDir, config.maxLocalBackups);

    // Nettoyer les vidéos
    await RecordingBackupManager.cleanupOldRecordingBackups(
      config.maxLocalBackups
    );
  }

  /**
   * Obtient les statistiques des sauvegardes (API de compatibilité)
   */
  async getBackupStats(): Promise<BackupStats> {
    return CleanupManager.getBackupStats();
  }

  /**
   * Met à jour la configuration (API de compatibilité)
   */
  async updateConfig(config: Partial<AutoSaveConfig>): Promise<AutoSaveConfig> {
    const newConfig = await ConfigManager.saveConfig(config);

    // Redémarrer la sauvegarde automatique si nécessaire
    if (config.enabled !== undefined || config.interval !== undefined) {
      this.isEnabled = newConfig.enabled;

      if (this.isEnabled && newConfig.interval) {
        this.startAutoSave(newConfig.interval);
      } else {
        this.stopGeneralAutoSave();
      }
    }

    return newConfig;
  }

  /**
   * Récupère la configuration actuelle (API de compatibilité)
   */
  async getConfig(): Promise<AutoSaveConfig> {
    return ConfigManager.loadConfig();
  }

  /**
   * Nettoie toutes les sauvegardes (API de compatibilité)
   */
  async cleanupAllBackups(): Promise<void> {
    return CleanupManager.cleanupAllBackups();
  }

  /**
   * Démarre la sauvegarde automatique d'un script (API de compatibilité)
   */
  startAutoSaveScript(
    scriptId: string,
    getScriptData: () => Partial<Script>
  ): void {
    if (!this.isEnabled) return;

    // Annuler le timer précédent s'il existe
    this.stopAutoSave(scriptId);

    const timer = setInterval(async () => {
      try {
        const scriptData = getScriptData();
        if (scriptData.title && scriptData.content) {
          await this.saveScript(scriptId, scriptData);
        }
      } catch (error) {}
    }, 30000); // 30 secondes par défaut

    this.saveTimers.set(scriptId, timer);
  }

  /**
   * Démarre la sauvegarde automatique d'un enregistrement (API de compatibilité)
   */
  async startAutoSaveRecording(recording: Recording): Promise<void> {
    if (!this.isEnabled) return;

    try {
      // Sauvegarde locale immédiate
      await this.saveRecording(recording);
    } catch (error) {}
  }

  /**
   * Arrête la sauvegarde automatique pour un élément (API de compatibilité)
   */
  stopAutoSave(itemId: string): void {
    const timer = this.saveTimers.get(itemId);
    if (timer) {
      clearInterval(timer);
      this.saveTimers.delete(itemId);
    }
  }

  /**
   * Récupère la liste des sauvegardes disponibles (API de compatibilité)
   */
  async getAvailableBackups(
    type?: "script" | "recording"
  ): Promise<BackupMetadata[]> {
    try {
      const savedBackups =
        await require("@react-native-async-storage/async-storage").default.getItem(
          "backupMetadata"
        );
      const allBackups: BackupMetadata[] = savedBackups
        ? JSON.parse(savedBackups)
        : [];

      if (type) {
        return allBackups.filter((backup) => backup.type === type);
      }

      return allBackups.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      return [];
    }
  }

  /**
   * Restaure un script depuis une sauvegarde (API de compatibilité)
   */
  async restoreScript(backupId: string): Promise<Script | null> {
    return ScriptBackupManager.restoreScript(backupId);
  }

  /**
   * Nettoie les ressources au démontage (API de compatibilité)
   */
  cleanup(): void {
    this.saveTimers.forEach((timer) => clearInterval(timer));
    this.saveTimers.clear();

    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }
  }

  /**
   * Nettoie les sauvegardes redondantes (API de compatibilité)
   */
  async cleanupRedundantBackups(): Promise<void> {
    return CleanupManager.cleanupRedundantBackups();
  }
}
