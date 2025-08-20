import { createLogger } from "../../utils/optimizedLogger";
import { AuthService } from "./auth.service";
import CryptoService from "./crypto.service";
import { StorageService } from "./storage.service";
import { MigrationService } from "./migration.service";
import { SUPPORTED_PROVIDERS } from "./constants";
import { KeyListItem, MigrationResult } from "./types";
import { USE_KEYCHAIN, STORAGE_PREFIX } from "./keychain.service";

const logger = createLogger("SecureApiKeyService");

export class SecureApiKeyService {
  static async authenticateUser(
    reason: string = "Accéder aux clés API"
  ): Promise<boolean> {
    void reason;
    return true;
  }

  /**
   * Sauvegarde une clé API de manière sécurisée
   */
  static async saveApiKey(
    provider: string,
    apiKey: string,
    requireAuth: boolean = false
  ): Promise<boolean> {
    try {
      if (!apiKey || apiKey.trim() === "") {
        return false;
      }
      // Authentification biométrique si requise
      // Biométrie désactivée – pas d'authentification requise

      return await StorageService.saveKey(provider, apiKey);
    } catch (error) {
      logger.error(`Erreur sauvegarde clé ${provider}:`, error);
      return false;
    }
  }

  /**
   * Récupère une clé API de manière sécurisée
   */
  static async getApiKey(
    provider: string,
    requireAuth: boolean = false
  ): Promise<string | null> {
    try {
      // Authentification biométrique si requise
      // Biométrie désactivée – pas d'authentification requise

      const keyData = await StorageService.getKey(provider);

      if (!keyData) {
        logger.debug(`Aucune clé trouvée pour ${provider}`);
        return null;
      }

      // Vérifier l'expiration
      if (StorageService.isKeyExpired(keyData.metadata.expiresAt)) {
        logger.warn(`Clé ${provider} expirée`);
        await this.deleteApiKey(provider, false);
        return null;
      }

      // Déchiffrer et retourner la clé (AES uniquement)
      const decryptedKey = await CryptoService.decrypt(
        JSON.parse(keyData.encrypted)
      );

      // Mettre à jour lastUsed
      keyData.metadata.lastUsed = new Date().toISOString();
      await StorageService.updateKeyMetadata(provider, keyData);

      return decryptedKey;
    } catch (error) {
      logger.error(`Erreur récupération clé ${provider}:`, error);
      return null;
    }
  }

  /**
   * Supprime une clé API
   */
  static async deleteApiKey(
    provider: string,
    requireAuth: boolean = false
  ): Promise<boolean> {
    try {
      // Biométrie désactivée – pas d'authentification requise

      return await StorageService.deleteKey(provider);
    } catch (error) {
      logger.error(`Erreur suppression clé ${provider}:`, error);
      return false;
    }
  }

  /**
   * Vérifie toutes les clés et supprime celles expirées
   */
  static async cleanupExpiredKeys(): Promise<void> {
    try {
      for (const provider of SUPPORTED_PROVIDERS) {
        const metadata = await StorageService.getKeyMetadata(provider);
        if (
          metadata &&
          metadata.expiresAt &&
          StorageService.isKeyExpired(metadata.expiresAt)
        ) {
          await this.deleteApiKey(provider, false);
          logger.info(`Clé expirée ${provider} supprimée`);
        }
      }
    } catch (error) {
      logger.error("Erreur nettoyage clés expirées:", error);
    }
  }

  /**
   * Obtient les métadonnées d'une clé sans l'authentification
   */
  static async getKeyMetadata(provider: string): Promise<any | null> {
    return StorageService.getKeyMetadata(provider);
  }

  /**
   * Liste toutes les clés disponibles (sans les valeurs)
   */
  static async listAvailableKeys(): Promise<KeyListItem[]> {
    try {
      const keys: KeyListItem[] = [];

      for (const provider of SUPPORTED_PROVIDERS) {
        const metadata = await this.getKeyMetadata(provider);
        if (metadata && metadata.hasKey) {
          const expiresAt = new Date(metadata.expiresAt);
          const now = new Date();
          const daysUntilExpiry = Math.floor(
            (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          keys.push({
            provider,
            createdAt: metadata.createdAt,
            expiresAt: metadata.expiresAt,
            isExpired: StorageService.isKeyExpired(metadata.expiresAt),
            daysUntilExpiry: Math.max(0, daysUntilExpiry),
            encryptionType: "AES",
          });
        }
      }

      return keys;
    } catch (error) {
      logger.error("Erreur liste des clés:", error);
      return [];
    }
  }

  /**
   * Migre les clés existantes vers le stockage sécurisé
   */
  static async migrateExistingKeys(): Promise<MigrationResult> {
    return MigrationService.migrateExistingKeys();
  }

  /**
   * Supprime toutes les clés sécurisées
   */
  static async deleteAllKeys(): Promise<void> {
    for (const provider of SUPPORTED_PROVIDERS) {
      try {
        await this.deleteApiKey(provider, false);
        logger.info(`Clé ${provider} supprimée`);
      } catch (error) {
        logger.error(`Erreur suppression ${provider}:`, error);
      }
    }
  }

  /**
   * Obtient des informations sur la configuration de stockage
   */
  static getStorageInfo(): {
    useKeychain: boolean;
    storagePrefix: string;
    supportedProviders: readonly string[];
  } {
    return {
      useKeychain: USE_KEYCHAIN,
      storagePrefix: STORAGE_PREFIX,
      supportedProviders: SUPPORTED_PROVIDERS,
    };
  }
}

// Export types pour utilisation externe
export * from "./types";
export { SUPPORTED_PROVIDERS } from "./constants";
