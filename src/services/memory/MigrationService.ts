import AsyncStorage from "@react-native-async-storage/async-storage";
import { createLogger } from "../../utils/optimizedLogger";
import { memoryManager, MemoryEntry } from "./MemoryManager";
import { MEMORY_CITATIONS_ENABLED } from "../../config/memoryConfig";

const logger = createLogger("MigrationService");

export interface MigrationStatus {
  isComplete: boolean;
  migratedSystems: string[];
  failedSystems: string[];
  totalEntries: number;
  errors: string[];
  migrationDate: string;
}

export interface LegacySystemData {
  systemName: string;
  storageKey: string;
  dataTransformer: (data: any) => Partial<MemoryEntry>[];
}

/**
 * MigrationService - Migration des systèmes de mémoire dispersés vers le système unifié
 * Unifie tous les systèmes actuels (useAIMemory, useGlobalPreferences, useUserStats, etc.)
 */
export class MigrationService {
  private static instance: MigrationService;
  private migrationStatus: Map<string, MigrationStatus> = new Map();

  private constructor() {}

  static getInstance(): MigrationService {
    if (!MigrationService.instance) {
      MigrationService.instance = new MigrationService();
    }
    return MigrationService.instance;
  }

  /**
   * Définition des systèmes legacy à migrer
   */
  private getLegacySystems(): LegacySystemData[] {
    return [
      {
        systemName: "AIMemory",
        storageKey: "@ai_memory",
        dataTransformer: this.transformAIMemoryData.bind(this),
      },
      {
        systemName: "GlobalPreferences",
        storageKey: "@guest_fab_enabled",
        dataTransformer: this.transformPreferencesData.bind(this),
      },
      {
        systemName: "UserStats",
        storageKey: "userCumulativeStats",
        dataTransformer: this.transformUserStatsData.bind(this),
      },
      {
        systemName: "ChatPreferences",
        storageKey: "@chat_preferences",
        dataTransformer: this.transformChatPreferencesData.bind(this),
      },
      {
        systemName: "DisplayPreferences",
        storageKey: "@display_preferences",
        dataTransformer: this.transformDisplayPreferencesData.bind(this),
      },
      {
        systemName: "RecordingSettings",
        storageKey: "recordingSettings",
        dataTransformer: this.transformRecordingSettingsData.bind(this),
      },
      {
        systemName: "SecuritySettings",
        storageKey: "@security_settings",
        dataTransformer: this.transformSecuritySettingsData.bind(this),
      },
      {
        systemName: "ThemeSettings",
        storageKey: "@selected_theme",
        dataTransformer: this.transformThemeSettingsData.bind(this),
      },
      {
        systemName: "LanguagePreference",
        storageKey: "@language_preference",
        dataTransformer: this.transformLanguagePreferenceData.bind(this),
      },
      {
        systemName: "FontPreference",
        storageKey: "@font_preference",
        dataTransformer: this.transformFontPreferenceData.bind(this),
      },
    ];
  }

  /**
   * Migration complète de tous les systèmes pour un utilisateur
   */
  async migrateAllSystems(userId: string): Promise<MigrationStatus> {
    try {
      logger.info(
        `🚀 Début migration systèmes mémoire pour utilisateur ${userId}`
      );

      // Nettoyer d'abord les données corrompues
      await this.cleanupCorruptedData();

      const legacySystems = this.getLegacySystems();
      const migratedSystems: string[] = [];
      const failedSystems: string[] = [];
      const errors: string[] = [];
      let totalEntries = 0;

      // Vérifier si migration déjà effectuée
      const migrationKey = `@migration_status_${userId}`;
      const existingMigration = await AsyncStorage.getItem(migrationKey);

      if (existingMigration) {
        const status: MigrationStatus = JSON.parse(existingMigration);
        if (status.isComplete) {
          logger.info("✅ Migration déjà effectuée");
          return status;
        }
      }

      // Migrer chaque système
      for (const system of legacySystems) {
        try {
          const migrated = await this.migrateLegacySystem(userId, system);
          if (migrated.success) {
            migratedSystems.push(system.systemName);
            totalEntries += migrated.entriesCount;
            logger.info(
              `✅ ${system.systemName} migré: ${migrated.entriesCount} entrées`
            );
          } else {
            failedSystems.push(system.systemName);
            errors.push(`${system.systemName}: ${migrated.error}`);
            logger.error(
              `❌ Échec migration ${system.systemName}: ${migrated.error}`
            );
          }
        } catch (error) {
          failedSystems.push(system.systemName);
          errors.push(`${system.systemName}: ${error}`);
          logger.error(`❌ Erreur migration ${system.systemName}:`, error);
        }
      }

      // Après migration complète, supprimer définitivement toutes les anciennes clés (format avec et sans userId)
      try {
        for (const system of legacySystems) {
          const keysToRemove = [
            `${system.storageKey}_${userId}`,
            system.storageKey,
            `${system.storageKey}_${userId}_MIGRATED`,
          ];
          for (const key of keysToRemove) {
            await AsyncStorage.removeItem(key);
          }
        }
        logger.info(`🧹 Anciennes clés legacy supprimées pour ${userId}`);
      } catch (cleanupError) {
        logger.warn(
          "⚠️ Erreur lors du nettoyage des anciennes clés:",
          cleanupError
        );
      }

      // Créer statut de migration
      const migrationStatus: MigrationStatus = {
        isComplete: failedSystems.length === 0,
        migratedSystems,
        failedSystems,
        totalEntries,
        errors,
        migrationDate: new Date().toISOString(),
      };

      // Sauvegarder statut
      await AsyncStorage.setItem(migrationKey, JSON.stringify(migrationStatus));
      this.migrationStatus.set(userId, migrationStatus);

      logger.info(
        `🎉 Migration terminée: ${migratedSystems.length}/${legacySystems.length} systèmes migrés`
      );
      return migrationStatus;
    } catch (error) {
      logger.error("❌ Erreur migration générale:", error);
      throw error;
    }
  }

  /**
   * Migration d'un système legacy spécifique
   */
  private async migrateLegacySystem(
    userId: string,
    system: LegacySystemData
  ): Promise<{ success: boolean; entriesCount: number; error?: string }> {
    try {
      // Chercher données avec userId (format nouveau)
      let storageKey = `${system.storageKey}_${userId}`;
      let data = await AsyncStorage.getItem(storageKey);

      // Si pas trouvé, essayer format ancien (sans userId)
      if (!data) {
        storageKey = system.storageKey;
        data = await AsyncStorage.getItem(storageKey);
      }

      if (!data) {
        // Pas de données à migrer pour ce système
        return { success: true, entriesCount: 0 };
      }

      // Parser et transformer les données avec protection contre corruption
      let parsedData;
      try {
        // Nettoyer les caractères problématiques avant parsing
        const cleanData = data
          .replace(/\|/g, "")
          .replace(/undefined/g, '""')
          .trim();
        parsedData = JSON.parse(cleanData);
      } catch (parseError) {
        logger.warn(
          `Données corrompues pour ${system.systemName}, tentative de récupération...`
        );
        // Essayer de récupérer ce qui est possible ou utiliser des données par défaut
        try {
          // Tenter parsing avec substitution plus agressive
          const repairedData = data
            .replace(/[|]/g, "")
            .replace(/undefined/g, '""')
            .replace(/NaN/g, "0")
            .replace(/,\s*}/g, "}")
            .replace(/,\s*]/g, "]");
          parsedData = JSON.parse(repairedData);
        } catch (secondParseError) {
          // Si impossible à parser, créer des données par défaut basées sur le système
          logger.error(
            `Impossible de parser ${system.systemName}, utilisation de données par défaut`
          );
          parsedData = this.getDefaultDataForSystem(system.systemName);
        }
      }

      const transformedEntries = system.dataTransformer(parsedData);

      // Ajouter chaque entrée au nouveau système
      for (const entry of transformedEntries) {
        await memoryManager.addMemory(userId, {
          title: entry.title || `Migration ${system.systemName}`,
          content: entry.content || "Données migrées du système legacy",
          category: entry.category || "preference",
          importance: entry.importance || "medium",
          citationRequired: entry.citationRequired || false,
          tags: entry.tags || [system.systemName.toLowerCase(), "migration"],
        });
      }

      // Marquer l'ancien système comme migré (renommer la clé)
      await AsyncStorage.setItem(`${storageKey}_MIGRATED`, data);
      await AsyncStorage.removeItem(storageKey);

      return { success: true, entriesCount: transformedEntries.length };
    } catch (error) {
      return { success: false, entriesCount: 0, error: String(error) };
    }
  }

  /**
   * Données par défaut en cas de corruption
   */
  private getDefaultDataForSystem(systemName: string): any {
    switch (systemName) {
      case "ThemeSettings":
        return { theme: "default" };
      case "LanguagePreference":
        return { language: "fr" };
      case "FontPreference":
        return { fontFamily: "System" };
      case "UserStats":
        return { totalUsage: 0, lastActive: new Date().toISOString() };
      case "AISettings":
        return { preference: "standard" };
      default:
        return {};
    }
  }

  /**
   * Transformateurs pour chaque type de données legacy
   */

  private transformAIMemoryData(data: any): Partial<MemoryEntry>[] {
    if (!data.entries || !Array.isArray(data.entries)) return [];

    return data.entries.map((entry: any) => ({
      title: `AI: ${entry.type || "Mémoire"}`,
      content: entry.content || "",
      category: this.mapAIMemoryType(entry.type),
      importance: entry.importance || "medium",
      citationRequired: MEMORY_CITATIONS_ENABLED,
      tags: ["ai-memory", entry.type, entry.category].filter(Boolean),
    }));
  }

  private transformPreferencesData(data: any): Partial<MemoryEntry>[] {
    // Format: simple boolean ou objet avec préférences
    const content =
      typeof data === "boolean"
        ? `FAB invité ${data ? "activé" : "désactivé"}`
        : JSON.stringify(data);

    return [
      {
        title: "Préférence FAB Invité",
        content,
        category: "preference",
        importance: "medium",
        citationRequired: MEMORY_CITATIONS_ENABLED,
        tags: ["preferences", "fab", "guest"],
      },
    ];
  }

  private transformUserStatsData(data: any): Partial<MemoryEntry>[] {
    if (!data) return [];

    return [
      {
        title: "Statistiques Utilisateur",
        content: `Temps total enregistrement: ${
          data.totalRecordingTime || 0
        }s, Enregistrements créés: ${data.totalRecordingsCreated || 0}`,
        category: "context",
        importance: "medium",
        citationRequired: false,
        tags: ["stats", "recording", "user-data"],
      },
    ];
  }

  private transformChatPreferencesData(data: any): Partial<MemoryEntry>[] {
    if (!data) return [];

    return [
      {
        title: "Préférences Chat",
        content: `Configuration chat: ${JSON.stringify(data)}`,
        category: "preference",
        importance: "medium",
        citationRequired: MEMORY_CITATIONS_ENABLED,
        tags: ["chat", "preferences", "ui"],
      },
    ];
  }

  private transformDisplayPreferencesData(data: any): Partial<MemoryEntry>[] {
    if (!data) return [];

    return [
      {
        title: "Préférences Affichage",
        content: `Configuration affichage: ${JSON.stringify(data)}`,
        category: "preference",
        importance: "medium",
        citationRequired: MEMORY_CITATIONS_ENABLED,
        tags: ["display", "ui", "preferences"],
      },
    ];
  }

  private transformRecordingSettingsData(data: any): Partial<MemoryEntry>[] {
    if (!data) return [];

    return [
      {
        title: "Paramètres Enregistrement",
        content: `Configuration enregistrement: qualité ${
          data.quality || "non définie"
        }, format ${data.format || "non défini"}`,
        category: "preference",
        importance: "high",
        citationRequired: MEMORY_CITATIONS_ENABLED,
        tags: ["recording", "settings", "quality"],
      },
    ];
  }

  private transformSecuritySettingsData(data: any): Partial<MemoryEntry>[] {
    if (!data) return [];

    return [
      {
        title: "Paramètres Sécurité",
        content: `Configuration sécurité: authentification ${
          data.authEnabled ? "activée" : "désactivée"
        }`,
        category: "preference",
        importance: "high",
        citationRequired: MEMORY_CITATIONS_ENABLED,
        tags: ["security", "auth", "settings"],
      },
    ];
  }

  private transformThemeSettingsData(data: any): Partial<MemoryEntry>[] {
    if (!data) return [];

    const theme = typeof data === "string" ? data : data.theme || "non défini";

    return [
      {
        title: "Préférence Thème",
        content: `Thème sélectionné: ${theme}`,
        category: "preference",
        importance: "low",
        citationRequired: MEMORY_CITATIONS_ENABLED,
        tags: ["theme", "ui", "appearance"],
      },
    ];
  }

  private transformLanguagePreferenceData(data: any): Partial<MemoryEntry>[] {
    if (!data) return [];

    const language =
      typeof data === "string" ? data : data.language || "non définie";

    return [
      {
        title: "Préférence Langue",
        content: `Langue préférée: ${language}`,
        category: "preference",
        importance: "high",
        citationRequired: MEMORY_CITATIONS_ENABLED,
        tags: ["language", "i18n", "locale"],
      },
    ];
  }

  private transformFontPreferenceData(data: any): Partial<MemoryEntry>[] {
    if (!data) return [];

    const font =
      typeof data === "string" ? data : data.fontFamily || "non définie";

    return [
      {
        title: "Préférence Police",
        content: `Police préférée: ${font}`,
        category: "preference",
        importance: "medium",
        citationRequired: MEMORY_CITATIONS_ENABLED,
        tags: ["font", "typography", "ui"],
      },
    ];
  }

  /**
   * Mapping des types AI Memory vers nouvelles catégories
   */
  private mapAIMemoryType(type: string): MemoryEntry["category"] {
    switch (type) {
      case "preference":
        return "preference";
      case "instruction":
        return "rule";
      case "context":
        return "context";
      case "fact":
        return "fact";
      default:
        return "context";
    }
  }

  /**
   * Vérification du statut de migration
   */
  async getMigrationStatus(userId: string): Promise<MigrationStatus | null> {
    try {
      // Vérifier cache
      if (this.migrationStatus.has(userId)) {
        return this.migrationStatus.get(userId)!;
      }

      // Charger depuis storage
      const migrationKey = `@migration_status_${userId}`;
      const stored = await AsyncStorage.getItem(migrationKey);

      if (stored) {
        const status: MigrationStatus = JSON.parse(stored);
        this.migrationStatus.set(userId, status);
        return status;
      }

      return null;
    } catch (error) {
      logger.error("❌ Erreur vérification statut migration:", error);
      return null;
    }
  }

  /**
   * Rollback migration (restaurer systèmes legacy)
   */
  async rollbackMigration(userId: string): Promise<void> {
    try {
      logger.warn(`🔄 Début rollback migration pour ${userId}`);

      const legacySystems = this.getLegacySystems();

      // Restaurer chaque système depuis les backups
      for (const system of legacySystems) {
        try {
          const backupKey = `${system.storageKey}_${userId}_MIGRATED`;
          const backupData = await AsyncStorage.getItem(backupKey);

          if (backupData) {
            // Restaurer données originales
            await AsyncStorage.setItem(
              `${system.storageKey}_${userId}`,
              backupData
            );
            await AsyncStorage.removeItem(backupKey);
            logger.info(`✅ ${system.systemName} restauré`);
          }
        } catch (error) {
          logger.error(`❌ Erreur rollback ${system.systemName}:`, error);
        }
      }

      // Nettoyer mémoire unifiée
      await memoryManager.clearUserMemory(userId);

      // Supprimer statut migration
      const migrationKey = `@migration_status_${userId}`;
      await AsyncStorage.removeItem(migrationKey);
      this.migrationStatus.delete(userId);

      logger.info("🎉 Rollback migration terminé");
    } catch (error) {
      logger.error("❌ Erreur rollback migration:", error);
      throw error;
    }
  }

  /**
   * Nettoyage des données de migration (supprimer backups)
   */
  async cleanupMigrationData(userId: string): Promise<void> {
    try {
      const legacySystems = this.getLegacySystems();

      for (const system of legacySystems) {
        const backupKey = `${system.storageKey}_${userId}_MIGRATED`;
        await AsyncStorage.removeItem(backupKey);
      }

      logger.info(`🧹 Données de migration nettoyées pour ${userId}`);
    } catch (error) {
      logger.error("❌ Erreur nettoyage migration:", error);
      throw error;
    }
  }

  /**
   * Rapport détaillé de migration
   */
  async generateMigrationReport(userId: string): Promise<{
    status: MigrationStatus | null;
    memoryStats: any;
    recommendations: string[];
  }> {
    try {
      const status = await this.getMigrationStatus(userId);
      const memoryStats = await memoryManager.getMemoryStats(userId);

      const recommendations: string[] = [];

      if (!status) {
        recommendations.push(
          "Migration non effectuée - Recommandé pour unifier les systèmes"
        );
      } else if (!status.isComplete) {
        recommendations.push(
          "Migration incomplète - Vérifier les erreurs et relancer"
        );
        recommendations.push(...status.errors.map((err) => `Erreur: ${err}`));
      } else {
        recommendations.push(
          "Migration complète - Système unifié opérationnel"
        );
        if (status.totalEntries > 0) {
          recommendations.push(
            `${status.totalEntries} entrées migrées avec succès`
          );
        }
      }

      return {
        status,
        memoryStats,
        recommendations,
      };
    } catch (error) {
      logger.error("❌ Erreur génération rapport migration:", error);
      throw error;
    }
  }

  /**
   * Nettoie les données corrompues d'AsyncStorage
   */
  async cleanupCorruptedData(): Promise<void> {
    try {
      const allKeys = await (AsyncStorage as any).getAllKeys();
      const corruptedKeys: string[] = [];

      for (const key of allKeys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (
            data &&
            (data.includes("|undefined") ||
              data.includes("NaN") ||
              data.match(/[^\x20-\x7E]/))
          ) {
            corruptedKeys.push(key);
            logger.warn(`Clé corrompue détectée: ${key}`);
          }
        } catch (error) {
          corruptedKeys.push(key);
          logger.warn(`Erreur lecture clé: ${key}`);
        }
      }

      if (corruptedKeys.length > 0) {
        await (AsyncStorage as any).multiRemove(corruptedKeys);
        logger.info(`🧹 ${corruptedKeys.length} clés corrompues nettoyées`);
      }
    } catch (error) {
      logger.error("Erreur nettoyage données corrompues:", error);
    }
  }
}

// Export de l'instance singleton
export const migrationService = MigrationService.getInstance();
