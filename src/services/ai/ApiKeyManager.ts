import AsyncStorage from "@react-native-async-storage/async-storage";
import { SecureApiKeyManager } from "./SecureApiKeyManager";

// Clés pour le stockage local
const STORAGE_KEYS = {
  OPENAI_KEY: "openai_api_key",
  GEMINI_KEY: "gemini_api_key",
  MISTRAL_KEY: "mistral_api_key",
  COHERE_KEY: "cohere_api_key",
  CLAUDE_KEY: "claude_api_key",
  PERPLEXITY_KEY: "perplexity_api_key",
  TOGETHER_KEY: "together_api_key",
  GROQ_KEY: "groq_api_key",
  FIREWORKS_KEY: "fireworks_api_key",

  API_PREFERENCE: "api_preference",
};

// États possibles pour les clés API
export enum API_KEY_STATES {
  AVAILABLE = "available",
  NOT_AVAILABLE = "not_available",
  PENDING = "pending",
}

// Préférences par défaut
// Important: désactiver tout par défaut pour éviter d'exiger des clés
// pour des services non utilisés lors de la première sauvegarde.
const DEFAULT_PREFERENCES = {
  useOpenAI: false,
  useGemini: false,
  useMistral: false,
  useCohere: false,
  useClaude: false,
  usePerplexity: false,
  useTogether: false,
  useGroq: false,
  useFireworks: false,
  useAzureOpenAI: false,
  useOpenRouter: false,
  useDeepInfra: false,
  useXAI: false,
  useDeepSeek: false,
};

// API preference interface
export interface ApiPreference {
  provider?: string;
  useOpenAI: boolean; // alias de useCustomApi pour compat
  useGemini: boolean;
  useMistral: boolean;
  useCohere: boolean;
  useClaude: boolean;
  usePerplexity: boolean;
  useTogether: boolean;
  useGroq: boolean;
  useFireworks: boolean;
  useAzureOpenAI?: boolean;
  useOpenRouter?: boolean;
  useDeepInfra?: boolean;
  useXAI?: boolean;
  useDeepSeek?: boolean;

  lastUsed?: string;
}

// API preference management
export interface ApiPreferenceUpdate {
  provider?: string;
  useCustomApi?: boolean;
  useGemini?: boolean;
  useMistral?: boolean;
  useCohere?: boolean;
  useClaude?: boolean;
  usePerplexity?: boolean;
  useTogether?: boolean;
  useGroq?: boolean;
  useFireworks?: boolean;
  useAzureOpenAI?: boolean;
  useOpenRouter?: boolean;
  useDeepInfra?: boolean;
  useXAI?: boolean;
  useDeepSeek?: boolean;
}

export class ApiKeyManager {
  // Clés API
  static async getOpenAIKey(): Promise<string | null> {
    return SecureApiKeyManager.getOpenAIKey();
  }

  static async getGeminiKey(): Promise<string | null> {
    return SecureApiKeyManager.getGeminiKey();
  }

  static async getMistralKey(): Promise<string | null> {
    return SecureApiKeyManager.getMistralKey();
  }

  static async getCohereKey(): Promise<string | null> {
    return SecureApiKeyManager.getCohereKey();
  }

  static async getClaudeKey(): Promise<string | null> {
    return SecureApiKeyManager.getApiKey("claude");
  }

  static async getPerplexityKey(): Promise<string | null> {
    return SecureApiKeyManager.getApiKey("perplexity");
  }

  static async getTogetherKey(): Promise<string | null> {
    return SecureApiKeyManager.getApiKey("together");
  }

  static async getGroqKey(): Promise<string | null> {
    return SecureApiKeyManager.getApiKey("groq");
  }

  static async getFireworksKey(): Promise<string | null> {
    return SecureApiKeyManager.getApiKey("fireworks");
  }

  // Nouveaux providers
  static async getAzureOpenAIKey(): Promise<string | null> {
    return SecureApiKeyManager.getApiKey("azureopenai");
  }

  static async getOpenRouterKey(): Promise<string | null> {
    return SecureApiKeyManager.getApiKey("openrouter");
  }

  static async getDeepInfraKey(): Promise<string | null> {
    return SecureApiKeyManager.getApiKey("deepinfra");
  }

  static async getXAIKey(): Promise<string | null> {
    return SecureApiKeyManager.getApiKey("xai");
  }

  static async getDeepSeekKey(): Promise<string | null> {
    return SecureApiKeyManager.getApiKey("deepseek");
  }

  static async getApiKey(providerName: string): Promise<string | null> {
    return SecureApiKeyManager.getApiKey(providerName.toLowerCase());
  }

  // Méthodes pour vérifier le statut des clés API
  static async getOpenAIKeyStatus(): Promise<API_KEY_STATES> {
    const key = await this.getOpenAIKey();
    const useOpenAI = await AsyncStorage.getItem("use_custom_api");
    return key && useOpenAI === "true"
      ? API_KEY_STATES.AVAILABLE
      : API_KEY_STATES.NOT_AVAILABLE;
  }

  static async getGeminiKeyStatus(): Promise<API_KEY_STATES> {
    const key = await this.getGeminiKey();
    const useGemini = await AsyncStorage.getItem("use_gemini");
    return key && useGemini === "true"
      ? API_KEY_STATES.AVAILABLE
      : API_KEY_STATES.NOT_AVAILABLE;
  }

  static async getMistralKeyStatus(): Promise<API_KEY_STATES> {
    const key = await this.getMistralKey();
    const useMistral = await AsyncStorage.getItem("use_mistral");
    return key && useMistral === "true"
      ? API_KEY_STATES.AVAILABLE
      : API_KEY_STATES.NOT_AVAILABLE;
  }

  static async getCohereKeyStatus(): Promise<API_KEY_STATES> {
    const key = await this.getCohereKey();
    const useCohere = await AsyncStorage.getItem("use_cohere");
    return key && useCohere === "true"
      ? API_KEY_STATES.AVAILABLE
      : API_KEY_STATES.NOT_AVAILABLE;
  }

  // Sauvegarde des clés
  static async setOpenAIKey(key: string): Promise<void> {
    await SecureApiKeyManager.saveApiKey("openai", key);
  }

  static async setGeminiKey(key: string): Promise<void> {
    await SecureApiKeyManager.saveApiKey("gemini", key);
  }

  static async setMistralKey(key: string): Promise<void> {
    await SecureApiKeyManager.saveApiKey("mistral", key);
  }

  static async setCohereKey(key: string): Promise<void> {
    await SecureApiKeyManager.saveApiKey("cohere", key);
  }

  static async setClaudeKey(key: string): Promise<void> {
    await SecureApiKeyManager.saveApiKey("claude", key);
  }

  static async setPerplexityKey(key: string): Promise<void> {
    await SecureApiKeyManager.saveApiKey("perplexity", key);
  }

  static async setTogetherKey(key: string): Promise<void> {
    await SecureApiKeyManager.saveApiKey("together", key);
  }

  static async setGroqKey(key: string): Promise<void> {
    await SecureApiKeyManager.saveApiKey("groq", key);
  }

  static async setFireworksKey(key: string): Promise<void> {
    await SecureApiKeyManager.saveApiKey("fireworks", key);
  }

  static async setAzureOpenAIKey(key: string): Promise<void> {
    await SecureApiKeyManager.saveApiKey("azureopenai", key);
  }

  static async setOpenRouterKey(key: string): Promise<void> {
    await SecureApiKeyManager.saveApiKey("openrouter", key);
  }

  static async setDeepInfraKey(key: string): Promise<void> {
    await SecureApiKeyManager.saveApiKey("deepinfra", key);
  }

  static async setXAIKey(key: string): Promise<void> {
    await SecureApiKeyManager.saveApiKey("xai", key);
  }

  static async setDeepSeekKey(key: string): Promise<void> {
    await SecureApiKeyManager.saveApiKey("deepseek", key);
  }

  // Préférences API
  static async getApiPreference(): Promise<ApiPreference> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.API_PREFERENCE);
      if (data) {
        return JSON.parse(data);
      }

      const [
        useCustomAPI,
        useGemini,
        useMistral,
        useCohere,
        useClaude,
        usePerplexity,
        useTogether,
        useGroq,
        useFireworks,
      ] = await Promise.all([
        AsyncStorage.getItem("use_custom_api"),
        AsyncStorage.getItem("use_gemini"),
        AsyncStorage.getItem("use_mistral"),
        AsyncStorage.getItem("use_cohere"),
        AsyncStorage.getItem("use_claude"),
        AsyncStorage.getItem("use_perplexity"),
        AsyncStorage.getItem("use_together"),
        AsyncStorage.getItem("use_groq"),
        AsyncStorage.getItem("use_fireworks"),
      ]);

      const preferences: ApiPreference = {
        useOpenAI: useCustomAPI === "true" || DEFAULT_PREFERENCES.useOpenAI,
        useGemini: useGemini === "true" || DEFAULT_PREFERENCES.useGemini,
        useMistral: useMistral === "true" || DEFAULT_PREFERENCES.useMistral,
        useCohere: useCohere === "true" || DEFAULT_PREFERENCES.useCohere,
        useClaude: useClaude === "true" || DEFAULT_PREFERENCES.useClaude,
        usePerplexity:
          usePerplexity === "true" || DEFAULT_PREFERENCES.usePerplexity,
        useTogether: useTogether === "true" || DEFAULT_PREFERENCES.useTogether,
        useGroq: useGroq === "true" || DEFAULT_PREFERENCES.useGroq,
        useFireworks:
          useFireworks === "true" || DEFAULT_PREFERENCES.useFireworks,
        useAzureOpenAI: DEFAULT_PREFERENCES.useAzureOpenAI,
        useOpenRouter: DEFAULT_PREFERENCES.useOpenRouter,
        useDeepInfra: DEFAULT_PREFERENCES.useDeepInfra,
        useXAI: DEFAULT_PREFERENCES.useXAI,
        useDeepSeek: DEFAULT_PREFERENCES.useDeepSeek,
      };

      // Migrer vers la nouvelle structure si des clés individuelles ont été trouvées
      if (
        useCustomAPI ||
        useGemini ||
        useMistral ||
        useCohere ||
        useClaude ||
        usePerplexity ||
        useTogether ||
        useGroq ||
        useFireworks
      ) {
        await this.setApiPreference(preferences);
      }

      return preferences;
    } catch (error) {
      return DEFAULT_PREFERENCES;
    }
  }

  static async setApiPreference(preferences: {
    useOpenAI?: boolean;
    useGemini?: boolean;
    useMistral?: boolean;
    useCohere?: boolean;
    useClaude?: boolean;
    usePerplexity?: boolean;
    useTogether?: boolean;
    useGroq?: boolean;
    useFireworks?: boolean;
  }): Promise<void> {
    try {
      const currentPreferences = await this.getApiPreference();
      const updatedPreferences = { ...currentPreferences, ...preferences };

      // Sauvegarder dans la clé principale API_PREFERENCE
      await AsyncStorage.setItem(
        STORAGE_KEYS.API_PREFERENCE,
        JSON.stringify(updatedPreferences)
      );

      // Synchroniser avec les clés individuelles AsyncStorage pour compatibilité
      const synchronizationPromises = [];

      if (preferences.useOpenAI !== undefined) {
        synchronizationPromises.push(
          AsyncStorage.setItem(
            "use_custom_api",
            preferences.useOpenAI.toString()
          )
        );
      }
      if (preferences.useGemini !== undefined) {
        synchronizationPromises.push(
          AsyncStorage.setItem("use_gemini", preferences.useGemini.toString())
        );
      }
      if (preferences.useMistral !== undefined) {
        synchronizationPromises.push(
          AsyncStorage.setItem("use_mistral", preferences.useMistral.toString())
        );
      }
      if (preferences.useCohere !== undefined) {
        synchronizationPromises.push(
          AsyncStorage.setItem("use_cohere", preferences.useCohere.toString())
        );
      }
      if (preferences.useClaude !== undefined) {
        synchronizationPromises.push(
          AsyncStorage.setItem("use_claude", preferences.useClaude.toString())
        );
      }
      if (preferences.usePerplexity !== undefined) {
        synchronizationPromises.push(
          AsyncStorage.setItem(
            "use_perplexity",
            preferences.usePerplexity.toString()
          )
        );
      }
      if (preferences.useTogether !== undefined) {
        synchronizationPromises.push(
          AsyncStorage.setItem(
            "use_together",
            preferences.useTogether.toString()
          )
        );
      }
      if (preferences.useGroq !== undefined) {
        synchronizationPromises.push(
          AsyncStorage.setItem("use_groq", preferences.useGroq.toString())
        );
      }
      if (preferences.useFireworks !== undefined) {
        synchronizationPromises.push(
          AsyncStorage.setItem(
            "use_fireworks",
            preferences.useFireworks.toString()
          )
        );
      }
      // Nouveaux, on ne synchronise pas en legacy (pas de clés historiques)

      // Exécuter toutes les synchronisations en parallèle
      await Promise.all(synchronizationPromises);
    } catch (error) {}
  }

  /**
   * Récupère le statut de toutes les clés API connues
   */
  static async getAllKeysStatus(): Promise<
    { provider: string; status: API_KEY_STATES }[]
  > {
    const providers = [
      "OPENAI",
      "GEMINI",
      "MISTRAL",
      "COHERE",
      "CLAUDE",
      "PERPLEXITY",
      "TOGETHER",
      "GROQ",
      "FIREWORKS",
      "AZUREOPENAI",
      "OPENROUTER",
      "DEEPINFRA",
      "XAI",
      "DEEPSEEK",
    ];

    const statuses = await Promise.all(
      providers.map(async (provider) => {
        const key = await SecureApiKeyManager.getApiKey(provider.toLowerCase());
        return {
          provider,
          status: key ? API_KEY_STATES.AVAILABLE : API_KEY_STATES.NOT_AVAILABLE,
        };
      })
    );

    return statuses;
  }
}
