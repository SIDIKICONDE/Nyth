import AsyncStorage from "@react-native-async-storage/async-storage";
import { AI_PROVIDERS, getEnabledProviders } from "../../../config/aiConfig";
import { SecureApiKeyManager } from "../SecureApiKeyManager";
import { createLogger } from "../../../utils/optimizedLogger";

const logger = createLogger("AIUtilsService");

export class AIUtilsService {
  /**
   * Vérifie si des clés API sont configurées
   * @returns Un objet indiquant si chaque fournisseur a une clé valide
   */
  static async checkConfiguredAPIKeys(): Promise<{ [key: string]: boolean }> {
    try {
      const [
        openAI,
        gemini,
        mistral,
        cohere,
        claude,
        perplexity,
        together,
        groq,
        fireworks,
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

      const result = {
        openAI,
        gemini,
        mistral,
        cohere,
        claude,
        perplexity,
        together,
        groq,
        fireworks,
      };
      logger.info("Statut des clés API (sécurisé):", result);
      return result;
    } catch (error) {
      logger.error("Erreur lors de la vérification des clés API:", error);
      return { openAI: false, gemini: false, mistral: false, cohere: false };
    }
  }

  /**
   * Interface simplifiée pour le chat libre avec l'IA
   * @param prompt Le prompt de l'utilisateur
   * @param previousMessages Historique des messages précédents
   * @returns Une chaîne contenant la réponse
   */
  static async simpleChatWithAI(
    prompt: string,
    previousMessages?: Array<{ role: "user" | "assistant"; content: string }>
  ): Promise<string> {
    try {
      // Récupérer les fournisseurs activés
      const providers = await getEnabledProviders();
      logger.info("Fournisseurs activés pour le chat:", providers);

      // Vérifier s'il y a au moins un fournisseur activé autre que LOCAL
      const mainProviders = providers;

      // Si aucun fournisseur n'est configuré, vérifier directement les clés API et leur activation
      if (mainProviders.length === 0) {
        await this.autoEnableAPIs();

        // Mettre à jour la liste des fournisseurs après activation automatique
        const updatedProviders = await getEnabledProviders();
        logger.info(
          "Fournisseurs mis à jour après activation:",
          updatedProviders
        );

        if (updatedProviders.length === 0) {
          // Vérifier une dernière fois s'il y a des clés configurées
          const keys = await this.checkConfiguredAPIKeys();
          const hasAnyKey = Object.values(keys).some((hasKey) => hasKey);

          if (hasAnyKey) {
            // Si des clés existent, réessayer une fois de plus
            await new Promise((resolve) => setTimeout(resolve, 500)); // Petit délai
            const finalProviders = await getEnabledProviders();

            if (finalProviders.length > 0) {
              // Utiliser les providers finaux
              return this.simpleChatWithAI(prompt, previousMessages);
            }
          }

          // Message d'erreur plus détaillé avec instructions
          const errorMessage =
            `Aucun service AI configuré.\n\n` +
            `Pour utiliser le chat AI, vous devez :\n` +
            `1. Obtenir une clé API gratuite (Gemini, Mistral ou Cohere)\n` +
            `2. Aller dans Paramètres → Configuration AI\n` +
            `3. Entrer votre clé API et activer le service\n\n` +
            `Services gratuits recommandés :\n` +
            `• Gemini : makersuite.google.com\n` +
            `• Mistral : console.mistral.ai\n` +
            `• Cohere : dashboard.cohere.com`;

          throw new Error(errorMessage);
        }

        // Utiliser les providers mis à jour
        return this.simpleChatWithAI(prompt, previousMessages);
      }

      // Sinon utiliser FreeChatService
      const { FreeChatService } = await import("../chat/FreeChatService");
      const response = await FreeChatService.chat({
        prompt,
        previousMessages,
      });

      return response.reply;
    } catch (error) {
      logger.error("Erreur dans simpleChatWithAI:", error);
      throw error;
    }
  }

  /**
   * Active automatiquement les APIs qui ont des clés configurées
   */
  private static async autoEnableAPIs(): Promise<void> {
    const useOpenAI = (await AsyncStorage.getItem("use_custom_api")) === "true";
    const useGemini = (await AsyncStorage.getItem("use_gemini")) === "true";
    const useMistral = (await AsyncStorage.getItem("use_mistral")) === "true";
    const useCohere = (await AsyncStorage.getItem("use_cohere")) === "true";
    const useClaude = (await AsyncStorage.getItem("use_claude")) === "true";
    const usePerplexity =
      (await AsyncStorage.getItem("use_perplexity")) === "true";
    const useTogether = (await AsyncStorage.getItem("use_together")) === "true";
    const useGroq = (await AsyncStorage.getItem("use_groq")) === "true";
    const useFireworks =
      (await AsyncStorage.getItem("use_fireworks")) === "true";

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

    logger.info("Détail des configurations API:", {
      openai: { enabled: useOpenAI, hasKey: hasOpenAIKey },
      gemini: { enabled: useGemini, hasKey: hasGeminiKey },
      mistral: { enabled: useMistral, hasKey: hasMistralKey },
      cohere: { enabled: useCohere, hasKey: hasCohereKey },
      claude: { enabled: useClaude, hasKey: hasClaudeKey },
      perplexity: { enabled: usePerplexity, hasKey: hasPerplexityKey },
      together: { enabled: useTogether, hasKey: hasTogetherKey },
      groq: { enabled: useGroq, hasKey: hasGroqKey },
      fireworks: { enabled: useFireworks, hasKey: hasFireworksKey },
    });

    if (!useOpenAI && hasOpenAIKey) {
      await AsyncStorage.setItem("use_custom_api", "true");
    }
    if (!useGemini && hasGeminiKey) {
      await AsyncStorage.setItem("use_gemini", "true");
    }
    if (!useMistral && hasMistralKey) {
      await AsyncStorage.setItem("use_mistral", "true");
    }
    if (!useCohere && hasCohereKey) {
      await AsyncStorage.setItem("use_cohere", "true");
    }
    if (!useClaude && hasClaudeKey) {
      await AsyncStorage.setItem("use_claude", "true");
    }
    if (!usePerplexity && hasPerplexityKey) {
      await AsyncStorage.setItem("use_perplexity", "true");
    }
    if (!useTogether && hasTogetherKey) {
      await AsyncStorage.setItem("use_together", "true");
    }
    if (!useGroq && hasGroqKey) {
      await AsyncStorage.setItem("use_groq", "true");
    }
    if (!useFireworks && hasFireworksKey) {
      await AsyncStorage.setItem("use_fireworks", "true");
    }
  }
}
