import CryptoJS from "crypto-js";
import { createLogger } from "../utils/optimizedLogger";

const logger = createLogger("CryptoService");

/**
 * Service de cryptographie compatible React Native
 * Utilise crypto-js avec les bonnes APIs
 */
export class CryptoService {
  /**
   * Chiffre une chaîne avec une clé (utilise AES)
   */
  static async encrypt(text: string, key: string): Promise<string> {
    try {
      // Vrai chiffrement AES
      const encrypted = CryptoJS.AES.encrypt(text, key).toString();
      return encrypted;
    } catch (error) {
      logger.error("Erreur lors du chiffrement:", error);
      throw error;
    }
  }

  /**
   * Déchiffre une chaîne (utilise AES)
   */
  static async decrypt(encryptedText: string, key: string): Promise<string> {
    try {
      // Vrai déchiffrement AES
      const decrypted = CryptoJS.AES.decrypt(encryptedText, key);
      const originalText = decrypted.toString(CryptoJS.enc.Utf8);

      if (!originalText) {
        throw new Error(
          "Clé de déchiffrement incorrecte ou données corrompues"
        );
      }

      return originalText;
    } catch (error) {
      logger.error("Erreur lors du déchiffrement:", error);
      throw error;
    }
  }

  /**
   * Génère un hash SHA256
   */
  static async hash(text: string): Promise<string> {
    return CryptoJS.SHA256(text).toString(CryptoJS.enc.Hex);
  }

  /**
   * Génère un UUID aléatoire
   */
  static generateUUID(): string {
    // Génération d'UUID compatible React Native
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }
}
