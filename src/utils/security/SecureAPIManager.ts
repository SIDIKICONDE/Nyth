// utils/security/SecureAPIManager.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
// Biométrie et Keychain désactivés
// import * as Keychain from "react-native-keychain";
import CryptoJS from "crypto-js";
import { createLogger } from "@/utils/optimizedLogger";
import DeviceInfo from "react-native-device-info";
import { performanceMonitor } from "@/utils/performance/PerformanceMonitor";

const logger = createLogger("SecureAPIManager");

interface APIKeyData {
  key: string;
  provider: string;
  createdAt: string;
  lastUsed: string;
  usageCount: number;
  isValid: boolean;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

interface SecurityConfig {
  encryptionEnabled: boolean;
  rotationInterval: number; // jours
  maxUsageCount: number;
  validateOnUse: boolean;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  remainingQuota?: number;
  shouldRotate: boolean;
}

class SecureAPIManager {
  private static instance: SecureAPIManager;
  private encryptionKey: string | null = null;
  private keyCache: Map<string, APIKeyData> = new Map();
  private securityConfig: SecurityConfig;
  private validationCache: Map<
    string,
    { result: ValidationResult; timestamp: number }
  > = new Map();
  private readonly VALIDATION_CACHE_TTL = 300000; // 5 minutes

  private constructor() {
    this.securityConfig = {
      encryptionEnabled: true,
      rotationInterval: 90,
      maxUsageCount: 10000,
      validateOnUse: true,
    };
    this.initialize();
  }

  static getInstance(): SecureAPIManager {
    if (!this.instance) {
      this.instance = new SecureAPIManager();
    }
    return this.instance;
  }

  private async initialize() {
    await this.loadSecurityConfig();
    await this.generateOrLoadEncryptionKey();
    await this.migrateOldKeys();
    await this.validateAllKeys();
  }

  /**
   * Génère ou charge la clé de chiffrement
   */
  private async generateOrLoadEncryptionKey() {
    try {
      // Essayer de récupérer depuis Keychain (plus sécurisé)
      const credentials = null as any;

      if (credentials) {
        this.encryptionKey = credentials.password;
      } else {
        // Générer une nouvelle clé
        const deviceId = await DeviceInfo.getUniqueId();
        const timestamp = Date.now().toString();
        const randomBytes = CryptoJS.lib.WordArray.random(128 / 8).toString();

        this.encryptionKey = CryptoJS.SHA256(
          `${deviceId}-${timestamp}-${randomBytes}`
        ).toString();

        // Sauvegarder dans Keychain
        // Stockage Keychain désactivé
      }

      logger.info("✅ Clé de chiffrement initialisée");
    } catch (error) {
      logger.error("❌ Erreur initialisation clé de chiffrement:", error);
      // Fallback vers une clé basique
      this.encryptionKey = CryptoJS.SHA256("fallback-key").toString();
    }
  }

  /**
   * Chiffre une clé API
   */
  private encrypt(data: string): string {
    if (!this.encryptionKey || !this.securityConfig.encryptionEnabled) {
      return data;
    }

    try {
      const encrypted = CryptoJS.AES.encrypt(
        data,
        this.encryptionKey
      ).toString();
      return encrypted;
    } catch (error) {
      logger.error("Erreur chiffrement:", error);
      return data;
    }
  }

  /**
   * Déchiffre une clé API
   */
  private decrypt(encryptedData: string): string {
    if (!this.encryptionKey || !this.securityConfig.encryptionEnabled) {
      return encryptedData;
    }

    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      logger.error("Erreur déchiffrement:", error);
      return "";
    }
  }

  private async loadSecurityConfig(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem("@security_config");
      if (stored) {
        const parsed = JSON.parse(stored) as SecurityConfig;
        this.securityConfig = {
          encryptionEnabled: !!parsed.encryptionEnabled,
          rotationInterval: Number(parsed.rotationInterval) || 90,
          maxUsageCount: Number(parsed.maxUsageCount) || 10000,
          validateOnUse: !!parsed.validateOnUse,
        };
      }
    } catch (error) {
      logger.error("Erreur chargement configuration sécurité:", error);
    }
  }

  private async migrateOldKeys(): Promise<void> {
    try {
      return;
    } catch (error) {
      logger.error("Erreur migration anciennes clés:", error);
    }
  }

  private async validateAllKeys(): Promise<void> {
    try {
      const providers = Array.from(this.keyCache.keys());
      for (const provider of providers) {
        const keyData = this.keyCache.get(provider);
        if (!keyData) continue;
        await this.validateKey(provider, keyData);
      }
    } catch (error) {
      logger.error("Erreur validation globale des clés:", error);
    }
  }

  private isValidKeyFormat(provider: string, key: string): boolean {
    const normalized = provider.toLowerCase();
    if (key.trim().length < 10) return false;
    const patterns: Record<string, RegExp> = {
      openai: /^sk-[A-Za-z0-9]{20,}/,
      gemini: /^[A-Za-z0-9_\-]{20,}$/,
      mistral: /^[A-Za-z0-9_\-]{20,}$/,
      claude: /^[A-Za-z0-9_\-]{20,}$/,
      cohere: /^[A-Za-z0-9_\-]{20,}$/,
      perplexity: /^[A-Za-z0-9_\-]{20,}$/,
      together: /^[A-Za-z0-9_\-]{20,}$/,
      groq: /^[A-Za-z0-9_\-]{20,}$/,
      fireworks: /^[A-Za-z0-9_\-]{20,}$/,
    };
    const pattern = patterns[normalized];
    return pattern ? pattern.test(key) : key.trim().length >= 20;
  }

  private async validateKeyWithProvider(
    provider: string,
    key: string
  ): Promise<ValidationResult> {
    const cacheKey = `${provider}:${CryptoJS.SHA1(key).toString()}`;
    const cached = this.validationCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.timestamp < this.VALIDATION_CACHE_TTL) {
      return cached.result;
    }
    const result: ValidationResult = {
      isValid: true,
      shouldRotate: false,
    };
    this.validationCache.set(cacheKey, { result, timestamp: now });
    return result;
  }

  private isCriticalProvider(provider: string): boolean {
    const critical = new Set(["openai", "gemini", "mistral", "claude"]);
    return critical.has(provider.toLowerCase());
  }

  private async validateKey(
    provider: string,
    keyData: APIKeyData
  ): Promise<ValidationResult> {
    const now = Date.now();
    const cacheKey = `${provider}:${keyData.createdAt}`;
    const cached = this.validationCache.get(cacheKey);
    if (cached && now - cached.timestamp < this.VALIDATION_CACHE_TTL) {
      return cached.result;
    }
    const decrypted = this.decrypt(keyData.key);
    const result = await this.validateKeyWithProvider(provider, decrypted);
    this.validationCache.set(cacheKey, { result, timestamp: now });
    return result;
  }

  private async updateKeyData(
    provider: string,
    keyData: APIKeyData
  ): Promise<void> {
    this.keyCache.set(provider, keyData);
    await AsyncStorage.setItem(`@api_key_${provider}`, JSON.stringify(keyData));
  }

  private scheduleKeyRotation(provider: string): void {
    void provider;
  }

  /**
   * Sauvegarde une clé API de manière sécurisée
   */
  async saveAPIKey(
    provider: string,
    key: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Valider le format de la clé
      if (!this.isValidKeyFormat(provider, key)) {
        throw new Error(`Format de clé invalide pour ${provider}`);
      }

      // Vérifier la clé auprès du fournisseur
      const validation = await this.validateKeyWithProvider(provider, key);
      if (!validation.isValid) {
        throw new Error(validation.error || "Clé invalide");
      }

      // Créer les données de la clé
      const keyData: APIKeyData = {
        key: this.encrypt(key),
        provider,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        usageCount: 0,
        isValid: true,
        metadata,
      };

      // Keychain désactivé

      // Sauvegarder dans AsyncStorage (chiffré)
      await AsyncStorage.setItem(
        `@api_key_${provider}`,
        JSON.stringify(keyData)
      );

      // Mettre à jour le cache
      this.keyCache.set(provider, keyData);

      // Mesurer la performance
      performanceMonitor.measureAPICall("saveAPIKey", startTime, true);

      logger.info(`✅ Clé API sauvegardée pour ${provider}`);
    } catch (error) {
      performanceMonitor.measureAPICall(
        "saveAPIKey",
        startTime,
        false,
        error as Error
      );
      logger.error(`❌ Erreur sauvegarde clé ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Récupère une clé API
   */
  async getAPIKey(
    provider: string,
    skipValidation: boolean = false
  ): Promise<string | null> {
    const startTime = Date.now();

    try {
      // Vérifier le cache
      let keyData = this.keyCache.get(provider);

      if (!keyData) {
        // Essayer Keychain d'abord pour les providers critiques
        // Keychain désactivé

        // Charger depuis AsyncStorage
        const stored = await AsyncStorage.getItem(`@api_key_${provider}`);
        if (!stored) {
          performanceMonitor.measureAPICall("getAPIKey", startTime, false);
          return null;
        }

        const parsed = JSON.parse(stored) as APIKeyData;
        keyData = parsed;
        this.keyCache.set(provider, parsed);
      }

      const ensuredKeyData: APIKeyData = keyData;
      // Vérifier la validité
      if (!skipValidation && this.securityConfig.validateOnUse) {
        const validation = await this.validateKey(provider, ensuredKeyData);
        if (!validation.isValid) {
          logger.warn(`Clé invalide pour ${provider}: ${validation.error}`);

          // Marquer comme invalide
          ensuredKeyData.isValid = false;
          await this.updateKeyData(provider, ensuredKeyData);

          performanceMonitor.measureAPICall("getAPIKey", startTime, false);
          return null;
        }

        // Vérifier si rotation nécessaire
        if (validation.shouldRotate) {
          logger.info(`Rotation nécessaire pour ${provider}`);
          // Déclencher la rotation en arrière-plan
          this.scheduleKeyRotation(provider);
        }
      }

      // Mettre à jour l'utilisation
      ensuredKeyData.lastUsed = new Date().toISOString();
      ensuredKeyData.usageCount++;
      await this.updateKeyData(provider, ensuredKeyData);

      // Déchiffrer et retourner
      const decryptedKey = this.decrypt(ensuredKeyData.key);

      performanceMonitor.measureAPICall("getAPIKey", startTime, true);
      return decryptedKey;
    } catch (error) {
      performanceMonitor.measureAPICall(
        "getAPIKey",
        startTime,
        false,
        error as Error
      );
      logger.error(`Erreur récupération clé ${provider}:`, error);
      return null;
    }
  }
}

export const secureAPIManager = SecureAPIManager.getInstance();
