import AsyncStorage from "@react-native-async-storage/async-storage";
import { createLogger } from "../../utils/optimizedLogger";
import {
  KeychainService,
  USE_KEYCHAIN,
  STORAGE_PREFIX,
} from "./keychain.service";
import { KEYCHAIN_SERVICE, API_KEY_EXPIRY_DAYS } from "./constants";
import { StoredKeyData, KeyMetadata } from "./types";
import CryptoService from "./crypto.service";

const logger = createLogger("StorageService");

export class StorageService {
  /**
   * Vérifie si une clé a expiré
   */
  static isKeyExpired(expiresAt: string): boolean {
    return new Date(expiresAt) < new Date();
  }

  /**
   * Sauvegarde une clé API chiffrée
   */
  static async saveKey(provider: string, apiKey: string): Promise<boolean> {
    try {
      // Validation de la clé API
      if (!apiKey || apiKey.trim() === "") {
        logger.error(`Clé API vide pour ${provider}`);
        return false;
      }

      // Préparer les métadonnées
      const createdAt = new Date().toISOString();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + API_KEY_EXPIRY_DAYS);

      // Chiffrer la clé (AES uniquement)
      let encryptedKey: string;
      try {
        const encryptedPayload = await CryptoService.encrypt(apiKey);
        encryptedKey = JSON.stringify(encryptedPayload);
      } catch (encryptError) {
        logger.error(
          `Erreur lors du chiffrement de la clé ${provider}:`,
          encryptError
        );
        return false;
      }

      const keyData: StoredKeyData = {
        encrypted: encryptedKey,
        metadata: {
          provider,
          createdAt,
          expiresAt: expiresAt.toISOString(),
        },
      };

      if (USE_KEYCHAIN) {
        // Sauvegarder dans Keychain (plus sécurisé sur mobile)
        try {
          const keychainKey = `${KEYCHAIN_SERVICE}_${provider}`;
          const accessible = KeychainService.getAccessibleOption();

          await KeychainService.setInternetCredentials(
            keychainKey,
            provider,
            JSON.stringify(keyData),
            accessible
              ? {
                  accessible,
                  accessControl: (KeychainService as any)["ACCESS_CONTROL"]
                    ?.BIOMETRY_CURRENT_SET,
                }
              : undefined
          );
          logger.info(`Clé ${provider} sauvegardée dans Keychain`);
        } catch (keychainError) {
          logger.error(`Erreur Keychain pour ${provider}:`, keychainError);
          // Ne pas fallback sur échec d'authentification biométrique
          return false;
        }
      } else {
        // Sur Windows/Web, utiliser AsyncStorage chiffré
        const secureKey = `${STORAGE_PREFIX}${provider}_key`;
        await AsyncStorage.setItem(secureKey, JSON.stringify(keyData));
        logger.info(
          `Clé ${provider} sauvegardée dans AsyncStorage avec préfixe ${STORAGE_PREFIX}`
        );
      }

      // Sauvegarder les métadonnées dans AsyncStorage (toujours)
      const metadata: KeyMetadata = {
        provider,
        createdAt,
        expiresAt: expiresAt.toISOString(),
        hasKey: true,
      };
      await AsyncStorage.setItem(
        `${provider}_metadata`,
        JSON.stringify(metadata)
      );

      logger.info(`Clé ${provider} sauvegardée de manière sécurisée`);
      return true;
    } catch (error) {
      logger.error(`Erreur sauvegarde clé ${provider}:`, error);
      return false;
    }
  }

  /**
   * Récupère une clé API stockée
   */
  static async getKey(provider: string): Promise<StoredKeyData | null> {
    try {
      let keyData: StoredKeyData | null = null;

      if (USE_KEYCHAIN) {
        // Récupérer depuis Keychain
        try {
          const keychainKey = `${KEYCHAIN_SERVICE}_${provider}`;
          const credentials = await KeychainService.getInternetCredentials(
            keychainKey
          );

          if (credentials) {
            keyData = JSON.parse(credentials.password);
            logger.info(`Clé ${provider} récupérée depuis Keychain`);
          }
        } catch (keychainError) {
          logger.warn(
            `Erreur Keychain lors de la récupération de ${provider}:`,
            keychainError
          );
          // Ne pas contourner si l'auth biométrique échoue
        }
      }

      // Fallback sur AsyncStorage
      if (!keyData) {
        const secureKey = `${STORAGE_PREFIX}${provider}_key`;
        const storedData = await AsyncStorage.getItem(secureKey);

        if (storedData) {
          keyData = JSON.parse(storedData);
          logger.info(`Clé ${provider} récupérée depuis AsyncStorage`);
        }
      }

      return keyData;
    } catch (error) {
      logger.error(`Erreur récupération clé ${provider}:`, error);
      return null;
    }
  }

  /**
   * Met à jour les métadonnées d'une clé
   */
  static async updateKeyMetadata(
    provider: string,
    keyData: StoredKeyData
  ): Promise<void> {
    try {
      if (USE_KEYCHAIN) {
        try {
          const keychainKey = `${KEYCHAIN_SERVICE}_${provider}`;
          const accessible = KeychainService.getAccessibleOption();

          await KeychainService.setInternetCredentials(
            keychainKey,
            provider,
            JSON.stringify(keyData),
            accessible
              ? {
                  accessible,
                  accessControl: (KeychainService as any)["ACCESS_CONTROL"]
                    ?.BIOMETRY_CURRENT_SET,
                }
              : undefined
          );
        } catch (updateError) {
          logger.warn(`Erreur mise à jour Keychain:`, updateError);
          return;
        }
      } else {
        // Mettre à jour dans AsyncStorage
        const secureKey = `${STORAGE_PREFIX}${provider}_key`;
        await AsyncStorage.setItem(secureKey, JSON.stringify(keyData));
      }
    } catch (error) {
      logger.error(`Erreur mise à jour métadonnées ${provider}:`, error);
    }
  }

  /**
   * Supprime une clé stockée
   */
  static async deleteKey(provider: string): Promise<boolean> {
    try {
      if (USE_KEYCHAIN) {
        const keychainKey = `${KEYCHAIN_SERVICE}_${provider}`;
        try {
          await KeychainService.resetInternetCredentials({
            server: keychainKey,
          });
          logger.info(`Clé ${provider} supprimée de Keychain`);
        } catch (error) {
          logger.warn(`Erreur suppression Keychain pour ${provider}:`, error);
        }
      }

      // Supprimer aussi de AsyncStorage
      const secureKey = `${STORAGE_PREFIX}${provider}_key`;
      await AsyncStorage.removeItem(secureKey);
      await AsyncStorage.removeItem(`${provider}_metadata`);

      logger.info(`Clé ${provider} supprimée`);
      return true;
    } catch (error) {
      logger.error(`Erreur suppression clé ${provider}:`, error);
      return false;
    }
  }

  /**
   * Obtient les métadonnées d'une clé
   */
  static async getKeyMetadata(provider: string): Promise<KeyMetadata | null> {
    try {
      const metadata = await AsyncStorage.getItem(`${provider}_metadata`);
      return metadata ? JSON.parse(metadata) : null;
    } catch (error) {
      logger.error(`Erreur récupération métadonnées ${provider}:`, error);
      return null;
    }
  }
}
