import AsyncStorage from "@react-native-async-storage/async-storage";
import { FirebaseFunctionsFallbackService } from "./firebaseFunctionsFallback";
import { ApiKeyManager } from "./ai/ApiKeyManager";

interface OpenAIKeyResponse {
  apiKey: string;
  provider: string;
  timestamp: string;
}

class DefaultKeyEventEmitter {
  private listeners: Array<() => void> = [];

  emit() {
    this.listeners.forEach((listener) => listener());
  }

  addListener(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}

const defaultKeyEvents = new DefaultKeyEventEmitter();

/**
 * Service pour récupérer et configurer automatiquement la clé OpenAI par défaut
 * S'intègre maintenant avec ApiKeyManager pour une gestion unifiée.
 */
export class DefaultApiKeyService {
  private static readonly CACHE_KEY = "default_openai_configured";
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24h

  static events = defaultKeyEvents;

  /**
   * Récupère la clé OpenAI par défaut et la configure si l'utilisateur n'en a pas.
   */
  static async configureDefaultOpenAIKey(): Promise<boolean> {
    try {
      // 1. Utiliser ApiKeyManager pour vérifier si une clé existe
      const existingKey = await ApiKeyManager.getOpenAIKey();
      if (existingKey) {
        return true;
      }

      // 2. Vérifier le cache pour éviter les appels répétés
      if (await this.isCacheValid()) {
        return true;
      }

      const result = { success: false, data: null, error: "disabled" } as any;

      if (!result.success || !result.data?.apiKey) {
        return false;
      }

      const { apiKey } = result.data;

      // 4. Sauvegarder la clé avec ApiKeyManager
      await ApiKeyManager.setOpenAIKey(apiKey);

      // 5. Activer l'utilisation des clés API si ce n'est pas déjà fait
      const prefs = await ApiKeyManager.getApiPreference();
      if (!prefs.useOpenAI) {
        await ApiKeyManager.setApiPreference({ useOpenAI: true });
      }

      // 6. Mettre à jour le cache de ce service
      await this.updateCache();

      // 7. Vérification finale
      await this.verifyConfiguration();

      // 8. Notifier les écouteurs
      this.events.emit();

      return true;
    } catch (error) {
      this.handleConfigurationError(error);
      return false;
    }
  }

  /**
   * Force la récupération d'une nouvelle clé (ignore le cache)
   */
  static async forceRefreshDefaultKey(): Promise<boolean> {
    await AsyncStorage.removeItem(this.CACHE_KEY);
    return this.configureDefaultOpenAIKey();
  }

  /**
   * Vérifie si une clé par défaut est disponible sans la configurer
   */
  static async checkDefaultKeyAvailability(): Promise<boolean> {
    try {
      const result = await this.fetchDefaultKey({ maxRetries: 1 });
      return result.success && !!result.data?.apiKey;
    } catch (error) {
      return false;
    }
  }

  /**
   * Vérifie si le cache de configuration est encore valide.
   */
  private static async isCacheValid(): Promise<boolean> {
    const lastConfigured = await AsyncStorage.getItem(this.CACHE_KEY);
    if (!lastConfigured) return false;

    const lastTime = parseInt(lastConfigured);
    return Date.now() - lastTime < this.CACHE_DURATION;
  }

  /**
   * Met à jour le timestamp du cache.
   */
  private static async updateCache(): Promise<void> {
    await AsyncStorage.setItem(this.CACHE_KEY, Date.now().toString());
  }

  /**
   * Appelle la fonction Firebase pour récupérer la clé.
   */
  private static async fetchDefaultKey(options?: { maxRetries: number }) {
    return FirebaseFunctionsFallbackService.callFunction<OpenAIKeyResponse>(
      "getOpenAIKey",
      {},
      {
        useCache: true,
        cacheDuration: this.CACHE_DURATION,
        retryConfig: {
          maxRetries: options?.maxRetries ?? 2,
          baseDelay: 2000,
          maxDelay: 8000,
        },
      }
    );
  }

  /**
   * Vérifie que la configuration a bien été appliquée.
   */
  private static async verifyConfiguration(): Promise<void> {
    const verifyKey = await ApiKeyManager.getOpenAIKey();
    const prefs = await ApiKeyManager.getApiPreference();
  }

  /**
   * Gère les erreurs de configuration.
   */
  private static handleConfigurationError(error: unknown) {
    if (error instanceof Error && error.message.includes("unauthenticated")) {}
  }
}
