import { SecureApiKeyService } from "../secureApiKey";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createLogger } from "../../utils/optimizedLogger";

const logger = createLogger("SecureApiKeyManager");

// Configuration pour la compatibilité
const USE_SECURE_STORAGE = true; // Peut être désactivé pour revenir à l'ancien système
const BIOMETRIC_SETTINGS_KEY = "biometric_settings";

interface BiometricSettings {
  enabled: boolean;
  requireForSave: boolean;
  requireForAccess: boolean;
  requiredForSettings?: boolean;
}

export class SecureApiKeyManager {
  private static readonly CACHE_TTL_MS = 120000;
  private static keyCache: Map<string, { value: string | null; ts: number }> =
    new Map();
  private static hasCache: Map<string, { value: boolean; ts: number }> =
    new Map();

  private static getCachedKey(provider: string): string | null | undefined {
    const entry = this.keyCache.get(provider);
    if (!entry) return undefined;
    if (Date.now() - entry.ts > this.CACHE_TTL_MS) {
      this.keyCache.delete(provider);
      return undefined;
    }
    return entry.value;
  }

  private static setCachedKey(provider: string, value: string | null): void {
    this.keyCache.set(provider, { value, ts: Date.now() });
  }

  private static getCachedHas(provider: string): boolean | undefined {
    const entry = this.hasCache.get(provider);
    if (!entry) return undefined;
    if (Date.now() - entry.ts > this.CACHE_TTL_MS) {
      this.hasCache.delete(provider);
      return undefined;
    }
    return entry.value;
  }

  private static setCachedHas(provider: string, value: boolean): void {
    this.hasCache.set(provider, { value, ts: Date.now() });
  }

  private static invalidateCache(provider: string): void {
    this.keyCache.delete(provider);
    this.hasCache.delete(provider);
  }

  /**
   * Récupère les paramètres biométriques
   */
  private static async getBiometricSettings(): Promise<BiometricSettings> {
    try {
      const saved = await AsyncStorage.getItem(BIOMETRIC_SETTINGS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      logger.error("Erreur lecture paramètres biométrie:", error);
    }

    return {
      enabled: false,
      requireForSave: false,
      requireForAccess: false,
      requiredForSettings: false,
    };
  }
  /**
   * Récupère une clé API (avec fallback sur l'ancien système)
   */
  static async getApiKey(provider: string): Promise<string | null> {
    try {
      if (USE_SECURE_STORAGE) {
        const settings = await this.getBiometricSettings();
        const requireAuth = settings.enabled && settings.requireForAccess;
        if (!requireAuth) {
          const cached = this.getCachedKey(provider);
          if (cached !== undefined) return cached;
        }
        const secureKey = await SecureApiKeyService.getApiKey(
          provider,
          requireAuth
        );
        if (!requireAuth) this.setCachedKey(provider, secureKey);
        if (secureKey) return secureKey;
      }

      // Fallback sur l'ancien système
      const legacyKey = await this.getLegacyKey(provider);
      if (legacyKey && USE_SECURE_STORAGE) {
        await SecureApiKeyService.saveApiKey(provider, legacyKey, false);
        await this.removeLegacyKey(provider);
        logger.info(`Clé ${provider} migrée automatiquement`);
      }
      if (USE_SECURE_STORAGE) this.setCachedKey(provider, legacyKey);
      return legacyKey;
    } catch (error) {
      logger.error(`Erreur récupération clé ${provider}:`, error);
      return null;
    }
  }

  /**
   * Sauvegarde une clé API
   */
  static async saveApiKey(provider: string, apiKey: string): Promise<boolean> {
    try {
      if (USE_SECURE_STORAGE) {
        const settings = await this.getBiometricSettings();
        const requireAuth = settings.enabled && settings.requireForSave;
        const { KeyVerifierService } = await import(
          "../secureApiKey/keyVerifier.service"
        );
        const isValid = await KeyVerifierService.verify(
          provider as any,
          apiKey
        );
        if (!isValid) {
          logger.warn(`Clé ${provider} invalide (vérification en ligne)`);
          return false;
        }

        const saved = await SecureApiKeyService.saveApiKey(
          provider,
          apiKey,
          requireAuth
        );
        if (saved) {
          await this.removeLegacyKey(provider);
          this.invalidateCache(provider);
        }
        return saved;
      }

      // Fallback sur l'ancien système
      await AsyncStorage.setItem(this.getLegacyKeyName(provider), apiKey);
      this.invalidateCache(provider);
      return true;
    } catch (error) {
      logger.error(`Erreur sauvegarde clé ${provider}:`, error);
      return false;
    }
  }

  /**
   * Supprime une clé API
   */
  static async deleteApiKey(provider: string): Promise<boolean> {
    try {
      if (USE_SECURE_STORAGE) {
        const settings = await this.getBiometricSettings();
        const requireAuth = settings.enabled;

        await SecureApiKeyService.deleteApiKey(provider, requireAuth);
      }

      // Supprimer aussi de l'ancien système
      await this.removeLegacyKey(provider);
      this.invalidateCache(provider);
      return true;
    } catch (error) {
      logger.error(`Erreur suppression clé ${provider}:`, error);
      return false;
    }
  }

  /**
   * Vérifie si une clé existe et est valide
   */
  static async hasValidKey(provider: string): Promise<boolean> {
    try {
      const cached = this.getCachedHas(provider);
      if (cached !== undefined) return cached;
      let has = false;
      if (USE_SECURE_STORAGE) {
        const secureKey = await this.getApiKey(provider);
        if (secureKey && secureKey.length > 10) has = true;
      }
      if (!has) {
        const legacyKey = await this.getLegacyKey(provider);
        has = !!legacyKey && legacyKey.length > 10;
      }
      this.setCachedHas(provider, has);
      return has;
    } catch {
      return false;
    }
  }

  /**
   * Obtient le statut de toutes les clés
   */
  static async getAllKeysStatus(): Promise<{ [key: string]: boolean }> {
    const providers = [
      "openai",
      "gemini",
      "mistral",
      "cohere",
      "claude",
      "perplexity",
      "together",
      "groq",
      "fireworks",
    ];
    const status: { [key: string]: boolean } = {};

    for (const provider of providers) {
      status[provider] = await this.hasValidKey(provider);
    }

    return status;
  }

  // Méthodes privées pour la compatibilité avec l'ancien système
  private static getLegacyKeyName(provider: string): string {
    const keyMap: { [key: string]: string } = {
      openai: "openai_api_key",
      gemini: "gemini_api_key",
      mistral: "mistral_api_key",
      cohere: "cohere_api_key",
      claude: "claude_api_key",
      perplexity: "perplexity_api_key",
      together: "together_api_key",
      groq: "groq_api_key",
      fireworks: "fireworks_api_key",
    };
    return keyMap[provider] || `${provider}_api_key`;
  }

  private static async getLegacyKey(provider: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.getLegacyKeyName(provider));
    } catch (error) {
      logger.error(`Erreur récupération clé legacy ${provider}:`, error);
      return null;
    }
  }

  private static async removeLegacyKey(provider: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.getLegacyKeyName(provider));
    } catch (error) {
      logger.error(`Erreur suppression clé legacy ${provider}:`, error);
    }
  }

  /**
   * Méthodes de compatibilité avec l'ancien ApiKeyManager
   */
  static async getOpenAIKey(): Promise<string | null> {
    return this.getApiKey("openai");
  }

  static async getGeminiKey(): Promise<string | null> {
    return this.getApiKey("gemini");
  }

  static async getMistralKey(): Promise<string | null> {
    return this.getApiKey("mistral");
  }

  static async getCohereKey(): Promise<string | null> {
    return this.getApiKey("cohere");
  }

  static async getPerplexityKey(): Promise<string | null> {
    return this.getApiKey("perplexity");
  }

  static async getTogetherKey(): Promise<string | null> {
    return this.getApiKey("together");
  }

  static async getGroqKey(): Promise<string | null> {
    return this.getApiKey("groq");
  }

  static async setClaudeKey(key: string): Promise<void> {
    await this.saveApiKey("claude", key);
  }

  static async setFireworksKey(key: string): Promise<void> {
    await this.saveApiKey("fireworks", key);
  }
}
