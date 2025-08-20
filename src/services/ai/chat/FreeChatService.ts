import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadAIMemory } from "../../../components/chat/message-handler/memory";
import { SYSTEM_PROMPT } from "../../../components/home/UnifiedHomeFAB/constants";
import { getDeviceLanguage } from "../../../utils/languageDetector";
import { createLogger } from "../../../utils/optimizedLogger";
import { ManagedAPIService } from "../../subscription";
import { ApiKeyManager } from "../ApiKeyManager";
import { ProviderRegistry } from "../../subscription/providers/ProviderRegistry";
import { detectTextLanguage } from "../../../components/chat/message-handler/context/language";

const logger = createLogger("FreeChatService");

// Constantes pour les providers
const AI_PROVIDERS = {
  OPENAI: "OPENAI",
  GEMINI: "GEMINI",
  MISTRAL: "MISTRAL",
  COHERE: "COHERE",
  CLAUDE: "CLAUDE",
  PERPLEXITY: "PERPLEXITY",
  TOGETHER: "TOGETHER",
  GROQ: "GROQ",
  FIREWORKS: "FIREWORKS",
} as const;

// Fonction pour obtenir les providers activés
const getEnabledProviders = async (): Promise<string[]> => {
  const providers = [];

  // Vérifier les clés API disponibles
  if (await ApiKeyManager.getOpenAIKey()) providers.push(AI_PROVIDERS.OPENAI);
  if (await ApiKeyManager.getGeminiKey()) providers.push(AI_PROVIDERS.GEMINI);
  if (await ApiKeyManager.getMistralKey()) providers.push(AI_PROVIDERS.MISTRAL);
  if (await ApiKeyManager.getCohereKey()) providers.push(AI_PROVIDERS.COHERE);
  if (await ApiKeyManager.getClaudeKey()) providers.push(AI_PROVIDERS.CLAUDE);
  if (await ApiKeyManager.getPerplexityKey())
    providers.push(AI_PROVIDERS.PERPLEXITY);
  if (await ApiKeyManager.getTogetherKey())
    providers.push(AI_PROVIDERS.TOGETHER);
  if (await ApiKeyManager.getGroqKey()) providers.push(AI_PROVIDERS.GROQ);
  if (await ApiKeyManager.getFireworksKey())
    providers.push(AI_PROVIDERS.FIREWORKS);

  return providers;
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Service de chat libre avec l'IA - Assistant conversationnel polyvalent
 *
 * Ce service permet des conversations libres sur n'importe quel sujet,
 * sans restriction au domaine du téléprompter.
 */
export class FreeChatService {
  /**
   * Chat libre avec l'IA
   * @param chatParams Paramètres du chat incluant le prompt et l'historique
   * @returns La réponse de l'IA
   */
  static async chat(chatParams: {
    prompt: string;
    previousMessages?: Array<{ role: "user" | "assistant"; content: string }>;
  }): Promise<{ reply: string }> {
    logger.info("Chat libre demandé", { prompt: chatParams.prompt });

    try {
      const { userId, planId } = await this.getUserInfo();

      // Construire le prompt complet avec contexte
      const fullPrompt = await this.buildFullPrompt(chatParams);

      // Récupérer les fournisseurs activés
      const enabledProviders = await getEnabledProviders();

      logger.info("Fournisseurs activés:", {
        providers: enabledProviders,
        count: enabledProviders.length,
      });

      // Si pas de fournisseurs activés, vérifier si on peut utiliser les API managées
      if (enabledProviders.length === 0) {
        logger.info("Aucun fournisseur activé, tentative avec API managées");

        // Essayer avec Gemini via API managée (disponible sur tous les plans)
        const managedResult = await this.tryManagedAPI(
          "gemini",
          fullPrompt,
          userId,
          planId
        );
        if (managedResult) {
          return { reply: managedResult };
        }

        throw new Error(
          "OFFLINE_ERROR: Le chat avec l'IA nécessite une connexion internet active et au moins une API configurée."
        );
      }

      // Essayer avec chaque fournisseur activé dans l'ordre
      for (const provider of enabledProviders) {
        try {
          logger.info(`Tentative de chat libre avec ${provider}`);

          const result = await this.tryManagedAPI(
            provider.toLowerCase(),
            fullPrompt,
            userId,
            planId
          );
          if (result) {
            return { reply: result };
          }

          const directResult = await this.tryProviderDirect(
            provider,
            fullPrompt,
            userId,
            planId
          );
          if (directResult) {
            return { reply: directResult };
          }
        } catch (error) {
          logger.error(`Erreur avec ${provider}`, error);
          // Continuer avec le prochain fournisseur
        }
      }

      throw new Error(
        "Impossible de se connecter aux services de chat. Veuillez vérifier votre connexion et les clés API."
      );
    } catch (error) {
      logger.error("Erreur dans le service de chat libre:", error);
      throw error;
    }
  }

  /**
   * Récupérer les informations utilisateur
   */
  private static async getUserInfo(): Promise<{
    userId: string;
    planId: string;
  }> {
    try {
      // Récupérer l'utilisateur actuel
      const currentUser = await AsyncStorage.getItem("@current_user");
      let userId = "anonymous";

      if (currentUser) {
        const userData = JSON.parse(currentUser);
        userId = userData.uid || "anonymous";
      }

      // Récupérer le plan d'abonnement
      const subscription = await AsyncStorage.getItem("user_subscription");
      let planId = "free";

      if (subscription) {
        const subscriptionData = JSON.parse(subscription);
        if (subscriptionData.status === "active") {
          planId = subscriptionData.planId || "free";
        }
      }

      return { userId, planId };
    } catch (error) {
      logger.error(
        "Erreur lors de la récupération des infos utilisateur:",
        error
      );
      return { userId: "anonymous", planId: "free" };
    }
  }

  /**
   * Essayer un appel API via le service managé
   */
  private static async tryManagedAPI(
    provider: string,
    prompt: string,
    userId: string,
    planId: string
  ): Promise<string | null> {
    try {
      // Vérifier si le provider est supporté par le plan
      if (!ManagedAPIService.canUseAPI(provider, planId)) {
        logger.info(`${provider} indisponible sur le plan ${planId}`);
        return null;
      }

      const response = await ManagedAPIService.makeAPICall({
        provider,
        prompt,
        userId,
        planId,
        maxTokens: 1000,
        temperature: 0.7,
      });

      if (!response.success) {
        logger.error(`Erreur API ${provider}:`, response.error);
        return null;
      }

      // Extraire la réponse selon le provider
      let reply: string | null = null;

      switch (provider.toLowerCase()) {
        case "gemini":
          reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
          break;
        case "openai":
          reply = response.data?.choices?.[0]?.message?.content;
          break;
        case "mistral":
          reply = response.data?.choices?.[0]?.message?.content;
          break;
        case "cohere":
          reply = response.data?.generations?.[0]?.text;
          break;
        // Nouveaux services AI Premium
        case "claude":
          reply = response.data?.content?.[0]?.text;
          break;
        case "perplexity":
          reply = response.data?.choices?.[0]?.message?.content;
          break;
        case "together":
          reply = response.data?.choices?.[0]?.message?.content;
          break;
        case "groq":
          reply = response.data?.choices?.[0]?.message?.content;
          break;
        case "fireworks":
          reply = response.data?.choices?.[0]?.message?.content;
          break;
        default:
          logger.warn(`Format de réponse non géré pour ${provider}`);
          return null;
      }

      return reply?.trim() || null;
    } catch (error) {
      logger.error(`Exception lors de l'appel API ${provider}:`, error);
      return null;
    }
  }

  /**
   * Construire le prompt complet avec contexte
   */
  private static async buildFullPrompt(chatParams: {
    prompt: string;
    previousMessages?: Array<{ role: "user" | "assistant"; content: string }>;
  }): Promise<string> {
    const raw = chatParams.prompt || "";
    const looksPrebuilt =
      /MESSAGE UTILISATEUR:|USER'S PERSISTENT MEMORY|SOUVENIR|MEMORY|INSTRUCTIONS:|CONTEXT:/i.test(
        raw
      );

    if (looksPrebuilt) {
      const endsWithAssistant = /Assistant:\s*$/i.test(raw.trim());
      return endsWithAssistant ? raw : `${raw}\nAssistant:`;
    }

    // Récupérer la langue du système depuis AsyncStorage
    const currentLanguage =
      (await AsyncStorage.getItem("userLanguage")) ||
      (await AsyncStorage.getItem("@language_preference")) ||
      (await AsyncStorage.getItem("app_language")) ||
      getDeviceLanguage();

    // Détecter la langue du message utilisateur et prioriser celle-ci si différente
    const detectedFromPrompt = detectTextLanguage(chatParams.prompt || "");
    const effectiveLanguage = detectedFromPrompt || currentLanguage;

    logger.info("🌐 Langue effective pour l'IA:", effectiveLanguage);

    // Récupérer les informations de l'utilisateur
    const currentUser = await AsyncStorage.getItem("@current_user");
    let userName = "";
    let userEmail = "";
    let userId = "";

    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        if (userData.uid) {
          userId = userData.uid;
          userName =
            (await AsyncStorage.getItem(`userName_${userData.uid}`)) ||
            userData.name ||
            "";
          userEmail =
            (await AsyncStorage.getItem(`userEmail_${userData.uid}`)) ||
            userData.email ||
            "";
        }
      } catch (error) {}
    }

    let userContext = "";
    if (userName) {
      const firstName = String(userName).split(/\s+/)[0] || userName;
      userContext =
        `\n\nUSER CONTEXT:` +
        ` The user's preferred form of address is "${firstName}".` +
        ` Use the name sparingly (only when it adds warmth or avoids ambiguity).` +
        ` Default to natural pronouns (tu/vous) and do not include the name in every reply.`;
    }

    // Charger la mémoire de l'IA
    let memoryContext = "";
    if (userId) {
      try {
        const memory = await loadAIMemory(userId);
        if (memory && memory.entries.length > 0) {
          memoryContext = `\n\nUSER'S PERSISTENT MEMORY (Use this to personalize your response):`;
          memory.entries.forEach((entry) => {
            memoryContext += `\n- [${entry.type}] ${entry.content} (Importance: ${entry.importance})`;
          });
        }
      } catch (error) {}
    }

    // Construire le prompt complet (sans directive de langue explicite)
    let fullPrompt = `${SYSTEM_PROMPT}${userContext}${memoryContext}`;

    // Ajouter les messages précédents au contexte (fenêtre récente uniquement)
    if (chatParams.previousMessages?.length) {
      const history = chatParams.previousMessages;
      const MAX_TURNS = 12; // Limiter pour garder le contexte pertinent
      const recent = history.slice(-MAX_TURNS);

      fullPrompt += "\n\nCONVERSATION CONTINUITY RULES:";
      fullPrompt +=
        "\n- Maintain the ongoing topic and context from recent turns." +
        "\n- Do NOT reset the conversation or ask the user to repeat if the intent is clear." +
        "\n- If the user's message relies on pronouns (e.g., 'continue', 'that', 'it'), infer from the recent turns." +
        "\n- Refer to prior constraints/choices unless the user changes them." +
        "\n- Keep answers concise and natural (2–4 sentences).";

      fullPrompt += "\n\nRECENT CONVERSATION (most recent last):";
      recent.forEach((msg) => {
        const role = msg.role === "user" ? "User" : "Assistant";
        fullPrompt += `\n${role}: ${msg.content}`;
      });
    }

    // Ajouter le message actuel
    fullPrompt += `\n\nUser: ${chatParams.prompt}\nAssistant:`;

    return fullPrompt;
  }

  private static async tryProviderDirect(
    provider: string,
    prompt: string,
    userId: string,
    planId: string
  ): Promise<string | null> {
    try {
      const instance = ProviderRegistry.getProvider(provider);
      if (!instance) {
        logger.warn(`Provider ${provider} non trouvé dans le registre`);
        return null;
      }

      const apiKey = await ApiKeyManager.getApiKey(provider);
      if (!apiKey) {
        logger.warn(`Clé API manquante pour ${provider}`);
        return null;
      }

      const response = await instance.call(
        apiKey,
        {
          provider: provider.toLowerCase(),
          prompt,
          maxTokens: 1000,
          temperature: 0.7,
          userId,
          planId,
        },
        {
          model: this.getDefaultModel(provider),
          maxTokens: 1000,
          temperature: 0.7,
        }
      );

      return this.extractContentFromResponse(provider, response.data);
    } catch (error) {
      logger.error(`Erreur appel direct ${provider}:`, error);
      return null;
    }
  }

  private static extractContentFromResponse(
    provider: string,
    data: unknown
  ): string | null {
    try {
      const obj = data as Record<string, unknown>;
      switch (provider.toLowerCase()) {
        case "openai":
        case "mistral":
          return (
            ((obj.choices as unknown[])?.[0] as Record<string, unknown>)
              ?.message as Record<string, unknown>
          )?.content as string | null;
        case "gemini": {
          const gem = data as {
            candidates?: Array<{
              content?: { parts?: Array<{ text?: string }> };
            }>;
          };
          const text = gem.candidates?.[0]?.content?.parts?.[0]?.text;
          return text ?? null;
        }
        case "cohere":
          return (
            (((obj.generations as unknown[])?.[0] as Record<string, unknown>)
              ?.text as string | undefined) || null
          );
        case "claude":
          return (
            (((obj.content as unknown[])?.[0] as Record<string, unknown>)
              ?.text as string | undefined) || null
          );
        case "perplexity":
        case "together":
        case "groq":
        case "fireworks":
          return (
            ((obj.choices as unknown[])?.[0] as Record<string, unknown>)
              ?.message as Record<string, unknown>
          )?.content as string | null;
        default:
          return null;
      }
    } catch {
      return null;
    }
  }

  private static getDefaultModel(provider: string): string {
    const defaults: Record<string, string> = {
      OPENAI: "gpt-3.5-turbo",
      GEMINI: "gemini-2.0-flash",
      MISTRAL: "mistral-tiny",
      COHERE: "command",
      CLAUDE: "claude-3-sonnet-20240229",
      PERPLEXITY: "llama-3.1-sonar-small-128k-online",
      TOGETHER: "meta-llama/Llama-2-7b-chat-hf",
      GROQ: "llama2-70b-4096",
      FIREWORKS: "accounts/fireworks/models/llama-v2-7b-chat",
    };
    return defaults[provider as keyof typeof defaults] || "default";
  }
}
