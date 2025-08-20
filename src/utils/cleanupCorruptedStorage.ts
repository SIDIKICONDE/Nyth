import AsyncStorage from "@react-native-async-storage/async-storage";
import { createLogger } from "./optimizedLogger";

const logger = createLogger("CleanupUtility");

interface CleanupResult {
  cleaned: number;
  errors: string[];
}

interface StorageReport {
  totalKeys: number;
  totalSize: number;
  keysByPrefix: Record<string, number>;
  suspiciousKeys: string[];
}

interface AsyncStorageExtended {
  getAllKeys(): Promise<readonly string[]>;
  multiRemove(keys: readonly string[]): Promise<void>;
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const storage = AsyncStorage as unknown as AsyncStorageExtended;

export class StorageCleanupUtility {
  static async cleanupCorruptedData(): Promise<CleanupResult> {
    const errors: string[] = [];
    let cleanedCount = 0;

    try {
      const allKeys = await storage.getAllKeys();
      const corruptedKeys: string[] = [];

      logger.info(`🔍 Vérification de ${allKeys.length} clés AsyncStorage...`);

      for (const key of allKeys) {
        try {
          const data = await storage.getItem(key);

          if (!data) continue;

          // Détecter les patterns de corruption courante
          const isCorrupted =
            data.includes("|undefined") ||
            data.includes("NaN") ||
            data.includes("undefined") ||
            data.match(/[^\x20-\x7E\n\r\t]/) || // Caractères non-ASCII
            (data.startsWith("{") && !data.endsWith("}")) ||
            (data.startsWith("[") && !data.endsWith("]"));

          if (isCorrupted) {
            corruptedKeys.push(key);
            logger.warn(`💥 Données corrompues détectées: ${key}`);
          } else {
            // Tester si on peut parser le JSON (si c'est du JSON)
            if (data.startsWith("{") || data.startsWith("[")) {
              try {
                JSON.parse(data);
              } catch (parseError) {
                corruptedKeys.push(key);
                logger.warn(`📝 JSON invalide détecté: ${key}`);
              }
            }
          }
        } catch (error: unknown) {
          corruptedKeys.push(key);
          errors.push(`Erreur lecture ${key}: ${error}`);
          logger.warn(`⚠️ Erreur lecture clé: ${key}`);
        }
      }

      if (corruptedKeys.length > 0) {
        try {
          await storage.multiRemove(corruptedKeys);
          cleanedCount = corruptedKeys.length;
          logger.info(
            `🧹 ${cleanedCount} clés corrompues nettoyées avec succès`
          );
        } catch (removeError: unknown) {
          errors.push(`Erreur suppression: ${removeError}`);
          logger.error("❌ Erreur lors de la suppression des clés corrompues");
        }
      } else {
        logger.info("✅ Aucune corruption détectée dans AsyncStorage");
      }
    } catch (error: unknown) {
      errors.push(`Erreur globale: ${error}`);
      logger.error("❌ Erreur lors du nettoyage AsyncStorage:", error);
    }

    return {
      cleaned: cleanedCount,
      errors,
    };
  }

  static async cleanupSpecificKey(key: string): Promise<boolean> {
    try {
      const data = await storage.getItem(key);

      if (!data) {
        logger.info(`Clé ${key} n'existe pas`);
        return true;
      }

      try {
        const cleanedData = data
          .replace(/\|undefined/g, "")
          .replace(/undefined/g, '""')
          .replace(/NaN/g, "0")
          .replace(/,\s*}/g, "}")
          .replace(/,\s*]/g, "]")
          .trim();

        if (cleanedData.startsWith("{") || cleanedData.startsWith("[")) {
          JSON.parse(cleanedData);
          await storage.setItem(key, cleanedData);
          logger.info(`🔧 Clé ${key} réparée avec succès`);
          return true;
        }
      } catch (repairError: unknown) {
        await storage.removeItem(key);
        logger.warn(`🗑️ Clé ${key} supprimée (irréparable)`);
        return true;
      }

      return true;
    } catch (error: unknown) {
      logger.error(`❌ Erreur nettoyage clé ${key}:`, error);
      return false;
    }
  }

  static async generateStorageReport(): Promise<StorageReport> {
    try {
      const allKeys = await storage.getAllKeys();
      const keysByPrefix: Record<string, number> = {};
      const suspiciousKeys: string[] = [];
      let totalSize = 0;

      for (const key of allKeys) {
        const prefix = key.split("_")[0] || "other";
        keysByPrefix[prefix] = (keysByPrefix[prefix] || 0) + 1;

        try {
          const data = await storage.getItem(key);
          if (data) {
            totalSize += data.length;

            if (
              data.length > 1024 * 1024 ||
              data.includes("|undefined") ||
              key.includes("MIGRATED")
            ) {
              suspiciousKeys.push(key);
            }
          }
        } catch (error: unknown) {
          suspiciousKeys.push(key);
        }
      }

      logger.info(
        `📊 Rapport AsyncStorage: ${allKeys.length} clés, ${Math.round(
          totalSize / 1024
        )}KB`
      );

      return {
        totalKeys: allKeys.length,
        totalSize,
        keysByPrefix,
        suspiciousKeys,
      };
    } catch (error: unknown) {
      logger.error("❌ Erreur génération rapport storage:", error);
      throw error;
    }
  }
}

export default StorageCleanupUtility;
