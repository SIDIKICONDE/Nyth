import AsyncStorage from "@react-native-async-storage/async-storage";
import { createLogger } from "./optimizedLogger";

const logger = createLogger("AsyncStorageValidator");

export interface AsyncStorageValidationResult {
  isValid: boolean;
  errors: string[];
  corruptedKeys: string[];
  repairedKeys: string[];
  stats: {
    totalKeys: number;
    validKeys: number;
    invalidKeys: number;
    repairedKeys: number;
  };
}

export interface StorageValidationOptions {
  /** Clés spécifiques à valider (si vide, valide toutes les clés) */
  keys?: string[];
  /** Tenter de réparer les données corrompues */
  autoRepair?: boolean;
  /** Supprimer les clés corrompues non réparables */
  removeCorrupted?: boolean;
  /** Callback pour chaque clé validée */
  onProgress?: (key: string, result: 'valid' | 'repaired' | 'corrupted') => void;
}

/**
 * Utilitaire de validation et réparation de la corruption d'AsyncStorage
 * Détecte et corrige les données JSON malformées ou corrompues
 */
export class AsyncStorageValidator {

  /**
   * Valide et répare AsyncStorage
   */
  static async validateAndRepair(options: StorageValidationOptions = {}): Promise<AsyncStorageValidationResult> {
    const {
      keys = [],
      autoRepair = true,
      removeCorrupted = true,
      onProgress
    } = options;

    const result: AsyncStorageValidationResult = {
      isValid: true,
      errors: [],
      corruptedKeys: [],
      repairedKeys: [],
      stats: {
        totalKeys: 0,
        validKeys: 0,
        invalidKeys: 0,
        repairedKeys: 0
      }
    };

    try {
      logger.info("Début validation AsyncStorage", { keys: keys.length || 'all', autoRepair, removeCorrupted });

      // Obtenir toutes les clés si aucune n'est spécifiée
      const allKeys = keys.length > 0 ? keys : await AsyncStorage.getAllKeys();
      result.stats.totalKeys = allKeys.length;

      for (const key of allKeys) {
        try {
          const validation = await this.validateKey(key, autoRepair);

          if (validation.isValid) {
            result.stats.validKeys++;
            onProgress?.(key, 'valid');
          } else if (validation.wasRepaired) {
            result.stats.repairedKeys++;
            result.repairedKeys.push(key);
            result.isValid = false;
            onProgress?.(key, 'repaired');
            logger.debug("Clé réparée", { key, oldValue: validation.oldValue, newValue: validation.newValue });
          } else {
            result.stats.invalidKeys++;
            result.corruptedKeys.push(key);
            result.isValid = false;
            result.errors.push(`Clé corrompue: ${key} - ${validation.error}`);

            if (removeCorrupted) {
              await AsyncStorage.removeItem(key);
              logger.warn("Clé corrompue supprimée", { key });
            }

            onProgress?.(key, 'corrupted');
          }
        } catch (keyError) {
          result.stats.invalidKeys++;
          result.corruptedKeys.push(key);
          result.isValid = false;
          result.errors.push(`Erreur validation clé ${key}: ${keyError instanceof Error ? keyError.message : String(keyError)}`);
          onProgress?.(key, 'corrupted');
          logger.error("Erreur lors de la validation d'une clé", { key, error: keyError });
        }
      }

      logger.info("Validation AsyncStorage terminée", result.stats);

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Erreur générale: ${error instanceof Error ? error.message : String(error)}`);
      logger.error("Erreur lors de la validation AsyncStorage", error);
    }

    return result;
  }

  /**
   * Valide une clé spécifique et tente de la réparer
   */
  private static async validateKey(
    key: string,
    autoRepair: boolean
  ): Promise<{
    isValid: boolean;
    wasRepaired: boolean;
    oldValue?: string;
    newValue?: string;
    error?: string;
  }> {
    try {
      const value = await AsyncStorage.getItem(key);

      // Si la valeur est null, c'est valide (pas de données)
      if (value === null) {
        return { isValid: true, wasRepaired: false };
      }

      // Déterminer le type de données attendu basé sur la clé
      const expectedType = this.getExpectedDataType(key);

      if (expectedType === 'string') {
        // Pour les chaînes simples, pas besoin de validation JSON
        return { isValid: true, wasRepaired: false };
      }

      if (expectedType === 'json') {
        try {
          // Tenter de parser le JSON
          JSON.parse(value);
          return { isValid: true, wasRepaired: false };
        } catch (jsonError) {
          // JSON corrompu
          if (autoRepair) {
            const repaired = await this.attemptRepair(key, value);
            if (repaired) {
              const newValue = await AsyncStorage.getItem(key);
              return {
                isValid: true,
                wasRepaired: true,
                oldValue: value,
                newValue: newValue || undefined
              };
            }
          }

          return {
            isValid: false,
            wasRepaired: false,
            error: `JSON malformé: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`
          };
        }
      }

      // Type non reconnu, considéré comme valide
      return { isValid: true, wasRepaired: false };

    } catch (error) {
      return {
        isValid: false,
        wasRepaired: false,
        error: `Erreur accès AsyncStorage: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Détermine le type de données attendu pour une clé
   */
  private static getExpectedDataType(key: string): 'string' | 'json' | 'unknown' {
    // Clés qui contiennent du JSON
    const jsonKeys = [
      'firestore_error_notifications',
      'permission_cache',
      'emergency_recordings_list',
      'emergency_recording_',
      'user_preferences',
      'app_settings',
      'recording_backup',
      'script_drafts',
      'offline_queue'
    ];

    if (jsonKeys.some(jsonKey => key.includes(jsonKey))) {
      return 'json';
    }

    // Clés qui contiennent des chaînes simples
    const stringKeys = [
      'current_session_id',
      'last_emergency_recovery',
      'user_token',
      'device_id'
    ];

    if (stringKeys.some(stringKey => key.includes(stringKey))) {
      return 'string';
    }

    // Par défaut, considérer comme JSON pour être prudent
    return 'json';
  }

  /**
   * Tente de réparer une valeur corrompue
   */
  private static async attemptRepair(key: string, corruptedValue: string): Promise<boolean> {
    try {
      // Essayer différentes stratégies de réparation selon la clé

      if (key.includes('firestore_error_notifications') || key.includes('permission_cache')) {
        // Pour les listes de notifications et cache de permissions, réinitialiser avec un tableau vide
        await AsyncStorage.setItem(key, JSON.stringify([]));
        return true;
      }

      if (key.includes('emergency_recordings_list')) {
        // Liste d'enregistrements d'urgence
        await AsyncStorage.setItem(key, JSON.stringify([]));
        return true;
      }

      if (key.includes('emergency_recording_')) {
        // Données d'un enregistrement d'urgence spécifique
        const id = key.replace('emergency_recording_', '');
        const defaultEmergencyData = {
          id,
          timestamp: Date.now(),
          scriptTitle: 'Enregistrement récupéré',
          recordingDuration: 0,
          metadata: {
            reason: 'manual_stop' as const,
            partialSave: true
          }
        };
        await AsyncStorage.setItem(key, JSON.stringify(defaultEmergencyData));
        return true;
      }

      if (key.includes('user_preferences') || key.includes('app_settings')) {
        // Préférences utilisateur, réinitialiser avec un objet vide
        await AsyncStorage.setItem(key, JSON.stringify({}));
        return true;
      }

      // Pour les autres clés, essayer de nettoyer le JSON corrompu
      const cleanedValue = this.cleanCorruptedJson(corruptedValue);
      if (cleanedValue && cleanedValue !== corruptedValue) {
        try {
          JSON.parse(cleanedValue); // Vérifier que c'est maintenant valide
          await AsyncStorage.setItem(key, cleanedValue);
          return true;
        } catch {
          // Le nettoyage n'a pas fonctionné
        }
      }

      // Si aucune réparation n'a fonctionné
      return false;

    } catch (error) {
      logger.error("Erreur lors de la tentative de réparation", { key, error });
      return false;
    }
  }

  /**
   * Tente de nettoyer un JSON corrompu
   */
  private static cleanCorruptedJson(corruptedJson: string): string | null {
    try {
      // Essayer de supprimer les caractères non-ASCII à la fin
      let cleaned = corruptedJson.replace(/[^\x00-\x7F]+$/g, '');

      // Essayer de fermer les objets ou tableaux non fermés
      if (cleaned.startsWith('{') && !cleaned.endsWith('}')) {
        cleaned += '}';
      } else if (cleaned.startsWith('[') && !cleaned.endsWith(']')) {
        cleaned += ']';
      }

      // Vérifier si c'est maintenant valide
      JSON.parse(cleaned);
      return cleaned;

    } catch {
      // Différentes tentatives de nettoyage
      const attempts = [
        // Supprimer la dernière ligne si elle semble corrompue
        corruptedJson.split('\n').slice(0, -1).join('\n'),
        // Garder seulement jusqu'à la dernière accolade valide
        corruptedJson.substring(0, corruptedJson.lastIndexOf('}') + 1),
        // Garder seulement jusqu'au dernier crochet valide
        corruptedJson.substring(0, corruptedJson.lastIndexOf(']') + 1),
        // Objet vide comme dernier recours
        '{}'
      ];

      for (const attempt of attempts) {
        try {
          if (attempt.trim()) {
            JSON.parse(attempt);
            return attempt;
          }
        } catch {
          continue;
        }
      }

      return null;
    }
  }

  /**
   * Obtient des statistiques sur AsyncStorage
   */
  static async getStorageStats(): Promise<{
    totalKeys: number;
    totalSize: number;
    largestKeys: Array<{ key: string; size: number }>;
  }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      const keySizes: Array<{ key: string; size: number }> = [];

      for (const key of allKeys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            const size = value.length * 2; // Approximation en bytes (UTF-16)
            totalSize += size;
            keySizes.push({ key, size });
          }
        } catch {
          // Ignorer les erreurs de lecture
        }
      }

      // Trier par taille décroissante et garder les 10 plus grosses
      keySizes.sort((a, b) => b.size - a.size);
      const largestKeys = keySizes.slice(0, 10);

      return {
        totalKeys: allKeys.length,
        totalSize,
        largestKeys
      };

    } catch (error) {
      logger.error("Erreur lors de la récupération des statistiques", error);
      return {
        totalKeys: 0,
        totalSize: 0,
        largestKeys: []
      };
    }
  }

  /**
   * Nettoie AsyncStorage (supprime les vieilles données)
   */
  static async cleanupStorage(maxAgeDays: number = 30): Promise<{
    cleanedKeys: string[];
    freedSpace: number;
  }> {
    try {
      const cutoffTime = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
      const cleanedKeys: string[] = [];
      let freedSpace = 0;

      // Clés qui peuvent être nettoyées (contiennent des timestamps)
      const cleanableKeyPatterns = [
        'firestore_error_notifications',
        'emergency_recording_',
        'script_drafts',
        'offline_queue'
      ];

      for (const pattern of cleanableKeyPatterns) {
        try {
          const keys = (await AsyncStorage.getAllKeys()).filter(key => key.includes(pattern));

          for (const key of keys) {
            const value = await AsyncStorage.getItem(key);
            if (value) {
              try {
                const data = JSON.parse(value);
                // Vérifier si les données ont un timestamp ancien
                if (data.timestamp && data.timestamp < cutoffTime) {
                  const size = value.length * 2;
                  await AsyncStorage.removeItem(key);
                  cleanedKeys.push(key);
                  freedSpace += size;
                  logger.debug("Clé nettoyée", { key, age: (Date.now() - data.timestamp) / (24 * 60 * 60 * 1000) });
                }
              } catch {
                // Si on ne peut pas parser, considérer comme vieux
                const size = value.length * 2;
                await AsyncStorage.removeItem(key);
                cleanedKeys.push(key);
                freedSpace += size;
              }
            }
          }
        } catch (error) {
          logger.error("Erreur lors du nettoyage du pattern", { pattern, error });
        }
      }

      logger.info("Nettoyage AsyncStorage terminé", { cleanedKeys: cleanedKeys.length, freedSpace });
      return { cleanedKeys, freedSpace };

    } catch (error) {
      logger.error("Erreur lors du nettoyage AsyncStorage", error);
      return { cleanedKeys: [], freedSpace: 0 };
    }
  }
}
