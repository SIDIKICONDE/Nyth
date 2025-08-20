import {
  MANAGED_API_CONFIG,
  SUBSCRIPTION_PLANS,
} from "../../constants/subscriptionPlans";
import { ApiKeyManager } from "../ai/ApiKeyManager";
import { createLogger } from "../../utils/optimizedLogger";
import { APICallOptions, ManagedAPIResponse } from "./types/api";
import { ProviderRegistry } from "./providers/ProviderRegistry";
import { RateLimitService } from "./rate-limiting/RateLimitService";
import { UsageTrackingService } from "./usage-tracking/UsageTrackingService";
import { getAuth } from "@react-native-firebase/auth";

const logger = createLogger("ManagedAPIService");

export class ManagedAPIService {
  /**
   * Vérifie si l'utilisateur a ses propres clés API
   */
  static async hasOwnKeys(): Promise<boolean> {
    try {
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
        "deepseek",
        "xai",
        "deepinfra",
        "openrouter",
        "azureopenai",
      ];

      for (const provider of providers) {
        const key = await this.getUserOwnKey(provider);
        if (key) {
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error("Error checking own keys:", error);
      return false;
    }
  }

  /**
   * Obtient une clé API selon la préférence de l'utilisateur et son plan
   */
  static async getAPIKey(
    provider: string,
    planId: string,
    preferOwnKeys: boolean = true
  ): Promise<string | null> {
    try {
      // Vérifier si l'utilisateur préfère et a ses propres clés
      if (preferOwnKeys) {
        const ownKey = await this.getUserOwnKey(provider);
        if (ownKey) {
          logger.info(`Using user's own ${provider} key`);
          return ownKey;
        }
      }

      // Utiliser les clés managées selon le plan
      return this.getManagedKey(provider, planId);
    } catch (error) {
      logger.error("Error getting API key:", error);
      return null;
    }
  }

  /**
   * Effectue un appel API avec la configuration managée
   */
  static async makeAPICall(
    options: APICallOptions
  ): Promise<ManagedAPIResponse> {
    const { provider, planId, userId } = options;

    try {
      // Vérifier que le fournisseur est supporté
      if (!ProviderRegistry.isProviderSupported(provider)) {
        return {
          success: false,
          error: `Fournisseur non supporté: ${provider}`,
        };
      }

      // Vérifier les limites de taux
      const rateLimitCheck = RateLimitService.checkRateLimit(userId, planId);
      if (!rateLimitCheck.allowed) {
        const resetTime = rateLimitCheck.resetTime || Date.now();
        const waitMinutes = Math.ceil((resetTime - Date.now()) / (60 * 1000));

        return {
          success: false,
          error: `Limite de taux dépassée. Réessayez dans ${waitMinutes} minute(s). Restant: ${
            rateLimitCheck.remainingDay || 0
          } req/jour`,
        };
      }

      // Vérifier que l'utilisateur peut utiliser cette API
      if (!this.canUseAPI(provider, planId)) {
        return {
          success: false,
          error: `${provider} n'est pas disponible sur le plan ${planId}`,
        };
      }

      // Obtenir la configuration pour le plan
      const planConfig =
        MANAGED_API_CONFIG[planId as keyof typeof MANAGED_API_CONFIG];
      if (!planConfig || typeof planConfig !== "object") {
        return {
          success: false,
          error: `Aucune configuration trouvée pour le plan ${planId}`,
        };
      }

      const config = (planConfig as any)[provider.toLowerCase()];
      if (!config) {
        return {
          success: false,
          error: `${provider} n'est pas disponible sur le plan ${planId}`,
        };
      }

      // Obtenir la clé API
      const apiKey = await this.getAPIKey(provider, planId, false); // Force managed keys
      if (!apiKey) {
        return {
          success: false,
          error: `Aucune clé API disponible pour ${provider}. Veuillez configurer votre propre clé API dans les paramètres.`,
        };
      }

      // Obtenir le fournisseur et faire l'appel
      const providerInstance = ProviderRegistry.getProvider(provider);
      if (!providerInstance) {
        return {
          success: false,
          error: `Impossible de charger le fournisseur ${provider}`,
        };
      }

      const result = await providerInstance.call(apiKey, options, config);

      // Tracker l'utilisation
      await UsageTrackingService.trackUsage(
        userId,
        provider,
        result.tokensUsed
      );

      return {
        success: true,
        data: result.data,
        tokensUsed: result.tokensUsed,
      };
    } catch (error) {
      logger.error("API call failed:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors de l'appel API",
      };
    }
  }

  /**
   * Obtient la clé API personnelle de l'utilisateur
   */
  private static async getUserOwnKey(provider: string): Promise<string | null> {
    switch (provider.toLowerCase()) {
      case "openai":
        return ApiKeyManager.getOpenAIKey();
      case "gemini":
        return ApiKeyManager.getGeminiKey();
      case "mistral":
        return ApiKeyManager.getMistralKey();
      case "cohere":
        return ApiKeyManager.getCohereKey();
      case "claude":
        return ApiKeyManager.getClaudeKey();
      case "perplexity":
        return ApiKeyManager.getPerplexityKey();
      case "together":
        return ApiKeyManager.getTogetherKey();
      case "groq":
        return ApiKeyManager.getGroqKey();
      case "fireworks":
        return ApiKeyManager.getFireworksKey();
      case "deepseek":
        return ApiKeyManager.getDeepSeekKey();
      case "xai":
        return ApiKeyManager.getXAIKey();
      case "deepinfra":
        return ApiKeyManager.getDeepInfraKey();
      case "openrouter":
        return ApiKeyManager.getOpenRouterKey();
      case "azureopenai":
        return ApiKeyManager.getAzureOpenAIKey();
      default:
        return null;
    }
  }

  /**
   * Obtient une clé API managée de manière sécurisée via Firebase
   */
  private static async getManagedKey(
    provider: string,
    planId: string
  ): Promise<string | null> {
    try {
      const user = getAuth().currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      const idToken = await user.getIdToken();

      const { FirebaseFunctionsFallbackService } = await import(
        "../firebaseFunctionsFallback"
      );
      const result = await FirebaseFunctionsFallbackService.callFunction<{
        apiKey: string;
      }>(
        "getManagedAPIKey",
        { provider: provider.toLowerCase(), planId },
        { useCache: true }
      );
      if (!result.success) {
        logger.warn(`getManagedAPIKey failed: ${result.error}`);
        return null;
      }
      const data = result.data as { apiKey: string } | undefined;
      return data?.apiKey ?? null;
    } catch (error) {
      logger.error(`Error getting managed key for ${provider}:`, error);
      return null;
    }
  }

  /**
   * Vérifie si l'utilisateur peut utiliser une API spécifique
   */
  static canUseAPI(provider: string, planId: string): boolean {
    const plan =
      SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS] ||
      SUBSCRIPTION_PLANS.free;
    return (
      plan.limits.apis.includes(provider.toLowerCase()) ||
      plan.limits.apis.includes("all")
    );
  }

  /**
   * Obtient les statistiques d'usage pour l'utilisateur
   */
  static async getUsageStats(userId: string): Promise<any> {
    return UsageTrackingService.getUsageStats(userId);
  }

  /**
   * Obtient les statistiques de rate limiting pour l'utilisateur
   */
  static getUserRateLimitStats(userId: string, planId: string) {
    return RateLimitService.getUserStats(userId, planId);
  }

  /**
   * Remet à zéro les limites de taux pour un utilisateur (admin uniquement)
   */
  static resetUserLimits(userId: string, planId: string): void {
    RateLimitService.resetUserLimits(userId, planId);
  }

  /**
   * Nettoie les données expirées (à exécuter périodiquement)
   */
  static performMaintenance(): void {
    RateLimitService.cleanupExpiredEntries();
    logger.info("Maintenance completed");
  }

  /**
   * Obtient la liste des fournisseurs supportés
   */
  static getSupportedProviders(): string[] {
    return ProviderRegistry.getSupportedProviders();
  }
}
