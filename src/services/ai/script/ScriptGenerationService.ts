import {
  AIPrompt,
  AIGenerationOptions,
  AIServiceResponse,
  ScriptData,
} from "../../../types/ai";
import { ApiKeyManager } from "../ApiKeyManager";
import { SecureApiKeyManager } from "../SecureApiKeyManager";
import {
  AI_PROVIDERS,
  DEFAULT_GENERATION_OPTIONS,
  getEnabledProviders,
} from "../../../config/aiConfig";
import { createLogger } from "../../../utils/optimizedLogger";
import { CacheManager } from "../CacheManager";
import { ApiClient } from "../../api/ApiClient";
import { SERVER_CONFIG } from "../../../config/serverConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ManagedAPIService } from "../../subscription";
import { ProviderRegistry } from "../../subscription/providers/ProviderRegistry";

const logger = createLogger("ScriptGenerationService");

export class ScriptGenerationService {
  /**
   * Génère un script en utilisant le système unifié d'IA
   */
  static async generateScript(
    prompt: AIPrompt,
    options: AIGenerationOptions = DEFAULT_GENERATION_OPTIONS
  ): Promise<AIServiceResponse> {
    const mergedOptions = { ...DEFAULT_GENERATION_OPTIONS, ...options };

    // Vérifier le cache
    const cachedResponse = await CacheManager.getCachedResponse(
      prompt,
      mergedOptions
    );
    if (cachedResponse) {
      logger.info("Réponse récupérée depuis le cache", { topic: prompt.topic });
      return cachedResponse;
    }

    // Essayer le serveur proxy d'abord
    if (!SERVER_CONFIG.BYPASS_PROXY) {
      try {
        const proxyResponse = await this.tryProxyGeneration(prompt);
        if (proxyResponse) {
          await CacheManager.cacheResponse(
            prompt,
            mergedOptions,
            proxyResponse,
            "PROXY"
          );
          return proxyResponse;
        }
      } catch (error) {
        logger.error("Erreur proxy, fallback vers API directe", error);
      }
    }

    // Utiliser le système unifié d'IA
    return this.generateWithUnifiedSystem(prompt, mergedOptions);
  }

  /**
   * Génération via le serveur proxy
   */
  private static async tryProxyGeneration(
    prompt: AIPrompt
  ): Promise<AIServiceResponse | null> {
    try {
      logger.info("Tentative via serveur proxy");
      return await ApiClient.generateScript({
        topic: prompt.topic,
        platform: prompt.platform,
        tone: prompt.tone,
        duration: prompt.duration || "medium",
        language: prompt.language,
        creativity: prompt.creativity || 0.7,
        characterCount: prompt.characterCount,
      });
    } catch (error) {
      logger.error("Échec du serveur proxy", error);
      return null;
    }
  }

  /**
   * Génération avec le système unifié d'IA
   */
  private static async generateWithUnifiedSystem(
    prompt: AIPrompt,
    options: AIGenerationOptions
  ): Promise<AIServiceResponse> {
    const enabledProviders = await getEnabledProviders();

    if (enabledProviders.length === 0) {
      throw new Error(await this.getNoProvidersErrorMessage());
    }

    // Récupérer les infos utilisateur pour le système managé
    const { userId, planId } = await this.getUserInfo();

    logger.info(`Providers disponibles: ${enabledProviders.join(", ")}`);

    // Essayer chaque provider
    for (const provider of enabledProviders) {
      try {
        logger.info(`Tentative avec ${provider}`);

        const result = await this.callProvider(
          provider,
          prompt,
          options,
          userId,
          planId
        );
        if (result) {
          await CacheManager.cacheResponse(prompt, options, result, provider);
          return result;
        }
      } catch (error) {
        logger.error(`Erreur avec ${provider}:`, error);
        continue;
      }
    }

    throw new Error(
      "Impossible de se connecter aux services d'IA. Vérifiez votre connexion et les clés API."
    );
  }

  /**
   * Appel à un provider spécifique
   */
  private static async callProvider(
    provider: string,
    prompt: AIPrompt,
    options: AIGenerationOptions,
    userId: string,
    planId: string
  ): Promise<AIServiceResponse | null> {
    // Construire le prompt pour la génération de script
    const fullPrompt = this.buildScriptPrompt(prompt, options);

    try {
      // Essayer d'abord le système managé
      if (ManagedAPIService.canUseAPI(provider, planId)) {
        const response = await ManagedAPIService.makeAPICall({
          provider: provider.toLowerCase(),
          prompt: fullPrompt,
          userId,
          planId,
          maxTokens: 1500,
          temperature: prompt.creativity || 0.7,
        });

        if (response.success) {
          const content = this.extractContentFromResponse(
            provider,
            response.data
          );
          if (content) {
            return this.formatScriptResponse(provider, content, prompt);
          }
        }
      }

      // Fallback sur appel direct
      return await this.callProviderDirect(provider, fullPrompt, prompt);
    } catch (error) {
      logger.error(`Erreur lors de l'appel à ${provider}:`, error);
      return null;
    }
  }

  /**
   * Appel direct à un provider via le système centralisé
   */
  private static async callProviderDirect(
    provider: string,
    fullPrompt: string,
    originalPrompt: AIPrompt
  ): Promise<AIServiceResponse | null> {
    try {
      // Utiliser le système centralisé ProviderRegistry
      const providerInstance = ProviderRegistry.getProvider(provider);
      if (!providerInstance) {
        logger.warn(`Provider ${provider} non trouvé dans le registre`);
        return null;
      }

      const apiKey = await SecureApiKeyManager.getApiKey(
        provider.toLowerCase()
      );
      if (!apiKey) {
        logger.warn(`Clé API manquante pour ${provider}`);
        return null;
      }

      // Récupérer les infos utilisateur
      const { userId, planId } = await this.getUserInfo();

      // Appel unifié via le système centralisé
      const response = await providerInstance.call(
        apiKey,
        {
          provider: provider.toLowerCase(),
          prompt: fullPrompt,
          maxTokens: 1500,
          temperature: originalPrompt.creativity || 0.7,
          userId,
          planId,
          model: this.getDefaultModel(provider),
        },
        {
          model: this.getDefaultModel(provider),
          maxTokens: 1500,
          temperature: originalPrompt.creativity || 0.7,
        }
      );

      if (response.tokensUsed) {
        logger.info(`Tokens utilisés avec ${provider}: ${response.tokensUsed}`);
      }

      // Extraction du contenu via le système unifié
      const content = this.extractContentFromUnifiedResponse(
        provider,
        response.data
      );

      if (content) {
        return this.formatScriptResponse(provider, content, originalPrompt);
      }

      return null;
    } catch (error) {
      logger.error(`Erreur appel direct ${provider}:`, error);
      return null;
    }
  }

  /**
   * Construit le prompt pour la génération de script
   */
  private static buildScriptPrompt(
    prompt: AIPrompt,
    options: AIGenerationOptions
  ): string {
    const systemPrompt = `Tu es un assistant spécialisé dans la création de scripts pour vidéos et téléprompter. 
Crée des scripts captivants, structurés et adaptés à l'audience cible.

Règles importantes:
- Réponds dans la langue demandée: ${prompt.language || "français"}
- Adapte le ton: ${prompt.tone}
- Plateforme cible: ${prompt.platform}
- Durée approximative: ${prompt.duration || "medium"}
${options.includeHooks ? "- Inclure des accroches" : ""}
${options.includeCallToAction ? "- Inclure un appel à l'action" : ""}
${options.includeHashtags ? "- Inclure des hashtags pertinents" : ""}`;

    return `${systemPrompt}\n\nSujet: ${prompt.topic}\n\nCrée un script complet et engageant.`;
  }

  /**
   * Extrait le contenu de la réponse selon le provider
   */
  private static extractContentFromResponse(
    provider: string,
    data: any
  ): string | null {
    try {
      switch (provider.toLowerCase()) {
        case "openai":
        case "mistral":
          return data?.choices?.[0]?.message?.content;
        case "gemini":
          return data?.candidates?.[0]?.content?.parts?.[0]?.text;
        case "cohere":
          return data?.generations?.[0]?.text;
        case "claude":
          return data?.content?.[0]?.text;
        case "perplexity":
        case "together":
        case "groq":
        case "fireworks":
          return data?.choices?.[0]?.message?.content;
        default:
          return null;
      }
    } catch (error) {
      logger.error(`Erreur extraction contenu ${provider}:`, error);
      return null;
    }
  }

  /**
   * Extrait le contenu de la réponse unifiée
   */
  private static extractContentFromUnifiedResponse(
    provider: string,
    data: any
  ): string | null {
    // Le système centralisé retourne déjà des données normalisées
    // Mais on garde une extraction spécifique pour être sûr
    return this.extractContentFromResponse(provider, data);
  }

  /**
   * Formate la réponse en AIServiceResponse
   */
  private static formatScriptResponse(
    provider: string,
    content: string,
    prompt: AIPrompt
  ): AIServiceResponse {
    return {
      id: `${provider.toLowerCase()}_${Date.now()}`,
      title: `Script ${prompt.platform} - ${prompt.topic}`,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isAIGenerated: true,
      aiPrompt: prompt,
    };
  }

  /**
   * Obtient le modèle par défaut pour un provider
   */
  private static getDefaultModel(provider: string): string {
    const defaultModels: Record<string, string> = {
      [AI_PROVIDERS.OPENAI]: "gpt-4o-mini",
      [AI_PROVIDERS.GEMINI]: "gemini-2.0-flash",
      [AI_PROVIDERS.MISTRAL]: "mistral-tiny",
      [AI_PROVIDERS.COHERE]: "command",
      [AI_PROVIDERS.CLAUDE]: "claude-3-sonnet-20240229",
      [AI_PROVIDERS.PERPLEXITY]: "llama-3.1-sonar-small-128k-online",
      [AI_PROVIDERS.TOGETHER]: "meta-llama/Llama-2-7b-chat-hf",
      [AI_PROVIDERS.GROQ]: "llama2-70b-4096",
      [AI_PROVIDERS.FIREWORKS]: "accounts/fireworks/models/llama-v2-7b-chat",
    };

    return defaultModels[provider] || "default";
  }

  /**
   * Récupère les informations utilisateur
   */
  private static async getUserInfo(): Promise<{
    userId: string;
    planId: string;
  }> {
    try {
      const currentUser = await AsyncStorage.getItem("@current_user");
      const subscription = await AsyncStorage.getItem("user_subscription");

      let userId = "anonymous";
      let planId = "free";

      if (currentUser) {
        const userData = JSON.parse(currentUser);
        userId = userData.uid || "anonymous";
      }

      if (subscription) {
        const subscriptionData = JSON.parse(subscription);
        if (subscriptionData.status === "active") {
          planId = subscriptionData.planId || "free";
        }
      }

      return { userId, planId };
    } catch (error) {
      logger.error("Erreur récupération infos utilisateur:", error);
      return { userId: "anonymous", planId: "free" };
    }
  }

  /**
   * Message d'erreur quand aucun provider n'est disponible
   */
  private static async getNoProvidersErrorMessage(): Promise<string> {
    const [
      hasOpenAIKey,
      hasGeminiKey,
      hasMistralKey,
      hasCohereKey,
      hasClaudeKey,
      hasPerplexityKey,
      hasTogetherKey,
      hasGroqKey,
      hasFireworksKey,
    ] = await Promise.all([
      SecureApiKeyManager.hasValidKey("openai"),
      SecureApiKeyManager.hasValidKey("gemini"),
      SecureApiKeyManager.hasValidKey("mistral"),
      SecureApiKeyManager.hasValidKey("cohere"),
      SecureApiKeyManager.hasValidKey("claude"),
      SecureApiKeyManager.hasValidKey("perplexity"),
      SecureApiKeyManager.hasValidKey("together"),
      SecureApiKeyManager.hasValidKey("groq"),
      SecureApiKeyManager.hasValidKey("fireworks"),
    ]);

    const hasAnyKey =
      hasOpenAIKey ||
      hasGeminiKey ||
      hasMistralKey ||
      hasCohereKey ||
      hasClaudeKey ||
      hasPerplexityKey ||
      hasTogetherKey ||
      hasGroqKey ||
      hasFireworksKey;

    if (hasAnyKey) {
      return "🔌 Aucun service AI activé.\n\nVous avez des clés API configurées mais aucun service n'est activé.\n\nAllez dans Paramètres → Configuration AI et activez au moins un service.";
    } else {
      return "🔑 Aucune clé API configurée.\n\nPour utiliser la génération AI, vous devez :\n1. Obtenir une clé API gratuite (Gemini, Mistral ou Cohere)\n2. Aller dans Paramètres → Configuration AI\n3. Entrer votre clé et activer le service";
    }
  }

  /**
   * Génère plusieurs variantes d'un script
   */
  static async generateVariants(
    basePrompt: AIPrompt,
    count: number = 3
  ): Promise<AIServiceResponse[]> {
    const variants: AIServiceResponse[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const creativity = Math.min(
          1.0,
          Math.max(
            0.1,
            (basePrompt.creativity || 0.7) + (Math.random() * 0.2 - 0.1)
          )
        );

        const variantPrompt: AIPrompt = {
          ...basePrompt,
          creativity,
          ...(i === 1 && { emotionalTone: "positive" }),
          ...(i === 2 && { narrativeStructure: "story-based" }),
        };

        const result = await this.generateScript(variantPrompt);
        variants.push({
          ...result,
          title: `Variante ${i + 1}: ${result.title}`,
        });
      } catch (error) {
        logger.error(`Erreur variante ${i + 1}:`, error);
      }
    }

    if (variants.length === 0) {
      throw new Error(
        "Impossible de générer des variantes. Veuillez réessayer."
      );
    }

    return variants;
  }

  /**
   * Sauvegarde un script
   */
  static async saveScript(script: ScriptData): Promise<boolean> {
    try {
      // TODO: Implémenter la sauvegarde persistante
      logger.info("Script sauvegardé", { scriptId: script.id });
      return true;
    } catch (error) {
      logger.error("Erreur sauvegarde script:", error);
      return false;
    }
  }
}
