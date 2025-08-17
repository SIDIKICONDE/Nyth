import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLogger } from '../../utils/optimizedLogger';
import { MIGRATION_MAPPINGS } from './constants';
import { MigrationResult } from './types';
import { StorageService } from './storage.service';

const logger = createLogger('MigrationService');

export class MigrationService {
  /**
   * Migre les clés existantes vers le stockage sécurisé
   */
  static async migrateExistingKeys(): Promise<MigrationResult> {
    const result: MigrationResult = { success: 0, failed: 0, errors: [] };
    
    try {
      for (const { old, provider } of MIGRATION_MAPPINGS) {
        try {
          const existingKey = await AsyncStorage.getItem(old);
          if (existingKey && existingKey.trim() !== '') {
            logger.info(`Migration de la clé ${provider}...`);
            
            // Sauvegarder dans le nouveau système
            const success = await StorageService.saveKey(provider, existingKey);
            if (success) {
              // Conserver l'ancienne clé pour la compatibilité avec les préférences
              // await AsyncStorage.removeItem(old);
              logger.info(`Clé ${provider} migrée avec succès (conservée pour compatibilité)`);
              result.success++;
            } else {
              logger.error(`Échec de la migration de la clé ${provider}`);
              result.failed++;
              result.errors.push(`${provider}: Échec de la sauvegarde sécurisée`);
            }
          }
        } catch (error) {
          logger.error(`Erreur lors de la migration de ${provider}:`, error);
          result.failed++;
          result.errors.push(`${provider}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
      }
      
      logger.info(`Migration terminée: ${result.success} réussies, ${result.failed} échouées`);
    } catch (error) {
      logger.error('Erreur générale lors de la migration:', error);
      result.errors.push(`Erreur générale: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
    
    return result;
  }

  /**
   * Vérifie si une migration est nécessaire
   */
  static async isMigrationNeeded(): Promise<boolean> {
    try {
      for (const { old } of MIGRATION_MAPPINGS) {
        const existingKey = await AsyncStorage.getItem(old);
        if (existingKey && existingKey.trim() !== '') {
          return true;
        }
      }
      return false;
    } catch (error) {
      logger.error('Erreur vérification migration:', error);
      return false;
    }
  }

  /**
   * Nettoie les anciennes clés après migration
   */
  static async cleanupOldKeys(force: boolean = false): Promise<void> {
    if (!force) {
      logger.info('Nettoyage des anciennes clés ignoré (conservation pour compatibilité)');
      return;
    }

    try {
      for (const { old, provider } of MIGRATION_MAPPINGS) {
        try {
          await AsyncStorage.removeItem(old);
          logger.info(`Ancienne clé ${provider} supprimée`);
        } catch (error) {
          logger.error(`Erreur suppression ancienne clé ${provider}:`, error);
        }
      }
      logger.info('Nettoyage des anciennes clés terminé');
    } catch (error) {
      logger.error('Erreur générale lors du nettoyage:', error);
    }
  }

  /**
   * Obtient le statut de migration pour chaque provider
   */
  static async getMigrationStatus(): Promise<Record<string, {
    hasOldKey: boolean;
    hasNewKey: boolean;
    needsMigration: boolean;
  }>> {
    const status: Record<string, any> = {};

    try {
      for (const { old, provider } of MIGRATION_MAPPINGS) {
        const oldKey = await AsyncStorage.getItem(old);
        const metadata = await StorageService.getKeyMetadata(provider);
        
        status[provider] = {
          hasOldKey: !!oldKey && oldKey.trim() !== '',
          hasNewKey: !!metadata?.hasKey,
          needsMigration: !!oldKey && oldKey.trim() !== '' && !metadata?.hasKey
        };
      }
    } catch (error) {
      logger.error('Erreur obtention statut migration:', error);
    }

    return status;
  }
} 