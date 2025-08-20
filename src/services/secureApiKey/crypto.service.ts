/**
 * Service de chiffrement sécurisé
 * Utilise AES-256-GCM pour le chiffrement des données sensibles
 * AUCUN FALLBACK EN BASE64 - Échec si le chiffrement n'est pas disponible
 */

import CryptoJS from "crypto-js";
  import AsyncStorage from "@react-native-async-storage/async-storage";

import { createLogger } from "../../utils/optimizedLogger";
import { KeychainService, USE_KEYCHAIN, STORAGE_PREFIX } from "./keychain.service";

const logger = createLogger("CryptoService");

// Import dynamique d'un moteur crypto supportant AES-GCM
let QuickCrypto: any = null;
try {
  QuickCrypto = require("react-native-quick-crypto");
} catch (_e) {
  QuickCrypto = null;
}

// Configuration du chiffrement
const ENCRYPTION_CONFIG = {
  algorithm: "AES-256-GCM",
  keySize: 256,
  iterations: 100000, // Augmenté pour plus de sécurité
  saltLength: 32,
  ivLength: 12, // 96 bits recommandé pour GCM
  tagLength: 16,
};

export class SecureCryptoService {
  private static masterKey: string | null = null;
  private static isInitialized = false;

  /**
   * Initialise le service de chiffrement
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Récupérer ou générer la clé maître
      if (USE_KEYCHAIN) {
        const credentials = await KeychainService.getInternetCredentials(
          "nyth_master_key"
        );
        if (credentials) {
          this.masterKey = credentials.password;
        } else {
          this.masterKey = this.generateSecureKey();
          const accessible = KeychainService.getAccessibleOption();
          await KeychainService.setInternetCredentials(
            "nyth_master_key",
            "master",
            this.masterKey,
            accessible
              ? {
                  accessible,
                  authenticationPrompt: { title: "Sécurité Naya" },
                }
              : undefined
          );
        }
      } else {
        const stored = await AsyncStorage.getItem(
          `${STORAGE_PREFIX}master_key`
        );
        if (stored) {
          this.masterKey = stored;
        } else {
          this.masterKey = this.generateSecureKey();
          await AsyncStorage.setItem(
            `${STORAGE_PREFIX}master_key`,
            this.masterKey
          );
        }
      }

      this.isInitialized = true;
      logger.info("CryptoService initialisé avec succès");
    } catch (error) {
      logger.error("Erreur initialisation CryptoService:", error);
      throw new Error(
        "Impossible d'initialiser le service de chiffrement. L'application ne peut pas continuer de manière sécurisée."
      );
    }
  }

  /**
   * Génère une clé sécurisée
   */
  private static generateSecureKey(): string {
    const randomBytes = CryptoJS.lib.WordArray.random(32);
    return randomBytes.toString(CryptoJS.enc.Hex);
  }

  /**
   * Dérive une clé à partir d'un mot de passe
   */
  private static deriveKey(
    password: string,
    salt: CryptoJS.lib.WordArray
  ): string {
    return CryptoJS.PBKDF2(password, salt, {
      keySize: ENCRYPTION_CONFIG.keySize / 32,
      iterations: ENCRYPTION_CONFIG.iterations,
      hasher: CryptoJS.algo.SHA256,
    }).toString();
  }

  // Helpers conversions sans dépendre de Buffer
  private static wordArrayToUint8Array(
    wordArray: CryptoJS.lib.WordArray
  ): Uint8Array {
    const { words, sigBytes } = wordArray;
    const result = new Uint8Array(sigBytes);
    let i = 0;
    let j = 0;
    while (i < sigBytes) {
      const word = words[j++];
      result[i++] = (word >> 24) & 0xff;
      if (i === sigBytes) break;
      result[i++] = (word >> 16) & 0xff;
      if (i === sigBytes) break;
      result[i++] = (word >> 8) & 0xff;
      if (i === sigBytes) break;
      result[i++] = word & 0xff;
    }
    return result;
  }

  private static uint8ArrayToWordArray(u8: Uint8Array): CryptoJS.lib.WordArray {
    const words = [] as number[];
    let i = 0;
    const len = u8.length;
    while (i < len) {
      words.push(
        (u8[i++] << 24) | (u8[i++] << 16) | (u8[i++] << 8) | (u8[i++] || 0)
      );
    }
    return CryptoJS.lib.WordArray.create(words, len);
  }

  private static hexToUint8Array(hex: string): Uint8Array {
    const clean = hex.length % 2 === 0 ? hex : "0" + hex;
    const result = new Uint8Array(clean.length / 2);
    for (let i = 0; i < result.length; i++) {
      result[i] = parseInt(clean.substr(i * 2, 2), 16);
    }
    return result;
  }

  private static concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
    const out = new Uint8Array(a.length + b.length);
    out.set(a, 0);
    out.set(b, a.length);
    return out;
  }

  private static bytesToBase64(bytes: Uint8Array): string {
    const wa = this.uint8ArrayToWordArray(bytes);
    return CryptoJS.enc.Base64.stringify(wa);
  }

  private static base64ToBytes(b64: string): Uint8Array {
    const wa = CryptoJS.enc.Base64.parse(b64);
    return this.wordArrayToUint8Array(wa);
  }

  private static bytesToUtf8(bytes: Uint8Array): string {
    const wa = this.uint8ArrayToWordArray(bytes);
    return CryptoJS.enc.Utf8.stringify(wa);
  }

  /**
   * Chiffre une donnée sensible avec AES-256-GCM
   * @throws Error si le chiffrement échoue
   */
  static async encrypt(
    plaintext: string,
    key?: string
  ): Promise<{
    ciphertext: string;
    salt: string;
    iv: string;
    tag: string;
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.masterKey && !key) {
      throw new Error("Aucune clé de chiffrement disponible");
    }

    try {
      const encryptionKey = key || this.masterKey!;
      if (!QuickCrypto) {
        throw new Error(
          "AES-GCM nécessite react-native-quick-crypto. Veuillez installer la dépendance."
        );
      }

      // Générer salt et IV aléatoires
      const saltWA = CryptoJS.lib.WordArray.random(
        ENCRYPTION_CONFIG.saltLength
      );
      const ivBytes: Uint8Array = QuickCrypto.randomBytes
        ? QuickCrypto.randomBytes(ENCRYPTION_CONFIG.ivLength)
        : this.wordArrayToUint8Array(
            CryptoJS.lib.WordArray.random(ENCRYPTION_CONFIG.ivLength)
          );

      // Dériver la clé (hex -> bytes)
      const derivedKeyHex = this.deriveKey(encryptionKey, saltWA);
      const keyBytes = this.hexToUint8Array(derivedKeyHex);

      // Chiffrer avec AES-256-GCM
      const cipher = QuickCrypto.createCipheriv(
        "aes-256-gcm",
        keyBytes,
        ivBytes
      );
      const part1 = cipher.update(plaintext, "utf8");
      const part2 = cipher.final();
      const ciphertextBytes = this.concatBytes(
        part1 instanceof Uint8Array ? part1 : new Uint8Array(part1),
        part2 instanceof Uint8Array ? part2 : new Uint8Array(part2)
      );
      const tagBytes = cipher.getAuthTag();

      return {
        ciphertext: this.bytesToBase64(ciphertextBytes),
        salt: CryptoJS.enc.Base64.stringify(saltWA),
        iv: this.bytesToBase64(ivBytes),
        tag: this.bytesToBase64(
          tagBytes instanceof Uint8Array ? tagBytes : new Uint8Array(tagBytes)
        ),
      };
    } catch (error) {
      logger.error("Erreur de chiffrement:", error);
      throw new Error(
        "Le chiffrement a échoué. Impossible de sécuriser les données."
      );
    }
  }

  /**
   * Déchiffre une donnée sensible
   * @throws Error si le déchiffrement échoue
   */
  static async decrypt(
    encryptedData: {
      ciphertext: string;
      salt: string;
      iv: string;
      tag: string;
    },
    key?: string
  ): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.masterKey && !key) {
      throw new Error("Aucune clé de déchiffrement disponible");
    }

    try {
      const decryptionKey = key || this.masterKey!;
      if (!QuickCrypto) {
        throw new Error(
          "AES-GCM nécessite react-native-quick-crypto. Veuillez installer la dépendance."
        );
      }

      // Reconstruire les composants
      const saltWA = CryptoJS.enc.Base64.parse(encryptedData.salt);
      const ivBytes = this.base64ToBytes(encryptedData.iv);
      const ciphertextBytes = this.base64ToBytes(encryptedData.ciphertext);
      const tagBytes = this.base64ToBytes(encryptedData.tag);

      // Dériver la clé
      const derivedKeyHex = this.deriveKey(decryptionKey, saltWA);
      const keyBytes = this.hexToUint8Array(derivedKeyHex);

      // Déchiffrer AES-256-GCM
      const decipher = QuickCrypto.createDecipheriv(
        "aes-256-gcm",
        keyBytes,
        ivBytes
      );
      if (typeof decipher.setAuthTag === "function") {
        decipher.setAuthTag(tagBytes);
      }
      const p1 = decipher.update(ciphertextBytes);
      const p2 = decipher.final();
      const plaintextBytes = this.concatBytes(
        p1 instanceof Uint8Array ? p1 : new Uint8Array(p1),
        p2 instanceof Uint8Array ? p2 : new Uint8Array(p2)
      );
      const plaintext = this.bytesToUtf8(plaintextBytes);

      if (!plaintext) {
        throw new Error(
          "Déchiffrement échoué - données corrompues ou clé invalide"
        );
      }

      return plaintext;
    } catch (error) {
      logger.error("Erreur de déchiffrement:", error);
      throw new Error(
        "Le déchiffrement a échoué. Les données peuvent être corrompues."
      );
    }
  }

  /**
   * Stocke une donnée sensible de manière sécurisée
   */
  static async secureStore(key: string, value: string): Promise<void> {
    try {
      // Chiffrer la valeur
      const encrypted = await this.encrypt(value);

      if (USE_KEYCHAIN) {
        const accessible = KeychainService.getAccessibleOption();
        await KeychainService.setInternetCredentials(
          `nyth_secure_${key}`,
          "encrypted",
          JSON.stringify(encrypted),
          accessible
            ? {
                accessible,
                authenticationPrompt: { title: "Accès sécurisé" },
              }
            : undefined
        );
      } else {
        await AsyncStorage.setItem(
          `${STORAGE_PREFIX}secure_${key}`,
          JSON.stringify(encrypted)
        );
      }

      logger.info(`Donnée stockée de manière sécurisée: ${key}`);
    } catch (error) {
      logger.error("Erreur stockage sécurisé:", error);
      throw new Error("Impossible de stocker la donnée de manière sécurisée");
    }
  }

  /**
   * Récupère une donnée sensible stockée
   */
  static async secureRetrieve(key: string): Promise<string | null> {
    try {
      let encryptedString: string | null = null;
      if (USE_KEYCHAIN) {
        const credentials = await KeychainService.getInternetCredentials(
          `nyth_secure_${key}`
        );
        if (credentials) {
          encryptedString = credentials.password;
        } else {
          return null;
        }
      } else {
        const stored = await AsyncStorage.getItem(
          `${STORAGE_PREFIX}secure_${key}`
        );
        if (!stored) return null;
        encryptedString = stored;
      }

      // Déchiffrer
      const encrypted = JSON.parse(encryptedString);
      const decrypted = await this.decrypt(encrypted);

      return decrypted;
    } catch (error) {
      logger.error("Erreur récupération sécurisée:", error);
      return null;
    }
  }

  /**
   * Supprime une donnée sensible stockée
   */
  static async secureDelete(key: string): Promise<void> {
    try {
      if (USE_KEYCHAIN) {
        await KeychainService.resetInternetCredentials({
          server: `nyth_secure_${key}`,
        });
      } else {
        await AsyncStorage.removeItem(`${STORAGE_PREFIX}secure_${key}`);
      }
      logger.info(`Donnée supprimée: ${key}`);
    } catch (error) {
      logger.error("Erreur suppression sécurisée:", error);
    }
  }

  /**
   * Vérifie l'intégrité d'une donnée avec HMAC
   */
  static generateHMAC(data: string, key?: string): string {
    const hmacKey = key || this.masterKey || this.generateSecureKey();
    return CryptoJS.HmacSHA256(data, hmacKey).toString(CryptoJS.enc.Hex);
  }

  /**
   * Vérifie un HMAC
   */
  static verifyHMAC(data: string, hmac: string, key?: string): boolean {
    const computedHmac = this.generateHMAC(data, key);
    return computedHmac === hmac;
  }

  /**
   * Nettoie les données sensibles de la mémoire
   */
  static cleanup(): void {
    this.masterKey = null;
    this.isInitialized = false;
    logger.info("CryptoService nettoyé");
  }
}

// Export par défaut pour compatibilité
export default SecureCryptoService;
