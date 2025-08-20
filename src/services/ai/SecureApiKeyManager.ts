import { SecureApiKeyService } from "../secureApiKey";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createLogger } from "../../utils/optimizedLogger";

const logger = createLogger("SecureApiKeyManager");

// Clé de préférence utilisateur pour activer/désactiver le chiffrement des clés API
const ENCRYPTION_PREF_KEY = "encrypt_api_keys";

export class SecureApiKeyManager {
  private static readonly CACHE_TTL_MS = 120000;
  private static keyCache: Map<string, { value: string | null; ts: number }> =
    new Map();
  private static hasCache: Map<string, { value: boolean; ts: number }> =
    new Map();

  /**
   * Indique si le stockage sécurisé (chiffrement) est activé par l'utilisateur.
   * Par défaut, on considère que le chiffrement est activé (compatibilité).
   */
  private static async isSecureStorageEnabled(): Promise<boolean> {
    try {
      const pref = await AsyncStorage.getItem(ENCRYPTION_PREF_KEY);
      if (pref === null) {
        // Par défaut: activé pour ne pas rompre l'accès aux clés déjà chiffrées
        return true;
      }
      return pref === "true";
    } catch (_e) {
      return true;
    }
  }

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
   * Récupère une clé API (avec fallback sur l'ancien système)
   */
  static async getApiKey(provider: string): Promise<string | null> {
    try {
      const cached = this.getCachedKey(provider);
      if (cached !== undefined) return cached;
      
      const useSecure = await this.isSecureStorageEnabled();

      if (useSecure) {
        const secureKey = await SecureApiKeyService.getApiKey(
          provider,
          false // No biometric auth
        );
        this.setCachedKey(provider, secureKey);
        if (secureKey) return secureKey;
      }

      // Fallback sur l'ancien système
      const legacyKey = await this.getLegacyKey(provider);
      if (legacyKey && useSecure) {
        await SecureApiKeyService.saveApiKey(provider, legacyKey, false);
        await this.removeLegacyKey(provider);
        logger.info(`Clé ${provider} migrée automatiquement`);
      }
      if (useSecure) this.setCachedKey(provider, legacyKey);
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
      const useSecure = await this.isSecureStorageEnabled();
      if (useSecure) {
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
          false
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
      if (await this.isSecureStorageEnabled()) {
        await SecureApiKeyService.deleteApiKey(provider, false);
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
      // Vérifier dans le stockage sécurisé
      const secureKey = await SecureApiKeyService.getApiKey(provider, false);
      if (secureKey && secureKey.length > 10) has = true;
      // Vérifier le legacy si pas trouvé
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
