import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadAIMemory } from "../../../components/chat/message-handler/memory";
import { SYSTEM_PROMPT } from "../../../components/home/UnifiedHomeFAB/constants";
import { createLogger } from "../../../utils/optimizedLogger";
import { ApiKeyManager } from "../ApiKeyManager";
import { AI_PROVIDERS, getEnabledProviders } from "../../../config/aiConfig";
import { ProviderRegistry } from "../../subscription/providers/ProviderRegistry";
import { ManagedAPIService } from "../../subscription";
import { detectTextLanguage } from "../../../components/chat/message-handler/context/language";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const logger = createLogger("SpecializedChatService");

export interface SpecializedChatParams {
  prompt: string;
  previousMessages?: Array<{ role: "user" | "assistant"; content: string }>;
}

/**
 * Service de chat spécialisé avec l'IA - Assistant téléprompter
 *
 * Ce service est spécialisé dans l'assistance pour la création de scripts
 * et l'utilisation du téléprompter.
 */
export class SpecializedChatService {
  /**
   * Chat spécialisé avec l'IA pour la création de scripts
   * @param chatParams Paramètres du chat incluant le prompt et l'historique
   * @returns La réponse de l'IA
   */
  static async chat(chatParams: {
    prompt: string;
    previousMessages?: Array<{ role: "user" | "assistant"; content: string }>;
  }): Promise<{ reply: string }> {
    logger.info("Chat spécialisé demandé", { prompt: chatParams.prompt });

    // Récupérer les fournisseurs activés
    const enabledProviders = await getEnabledProviders();

    if (enabledProviders.length === 0) {
      throw new Error(
        "OFFLINE_ERROR: Cette fonctionnalité nécessite une connexion internet active et au moins une API configurée."
      );
    }

    // Construire les messages
    const messages = await this.buildMessages(chatParams);

    // Essayer avec chaque fournisseur activé dans l'ordre
    for (const provider of enabledProviders) {
      try {
        logger.info(`Tentative de chat spécialisé avec ${provider}`);

        const result = await this.tryProvider(provider, messages);
        if (result) {
          return { reply: result };
        }
      } catch (error) {
        logger.error(`Erreur avec ${provider}`, error);
        // Continuer avec le prochain fournisseur
      }
    }

    throw new Error(
      "Impossible de se connecter aux services de chat. Veuillez vérifier votre connexion et les clés API."
    );
  }

  /**
   * Construire les messages pour l'API
   */
  private static async buildMessages(
    chatParams: SpecializedChatParams
  ): Promise<ChatMessage[]> {
    // Récupérer la langue du système depuis AsyncStorage
    const currentLanguage =
      (await AsyncStorage.getItem("userLanguage")) ||
      (await AsyncStorage.getItem("@language_preference")) ||
      (await AsyncStorage.getItem("app_language")) ||
      "fr";

    // Détecter la langue du prompt et prioriser celle-ci si différente
    const detectedFromPrompt = detectTextLanguage(chatParams.prompt || "");
    const effectiveLanguage = detectedFromPrompt || currentLanguage;

    // Utiliser le nouveau prompt système avec instructions d'opinion
    const systemPrompt = this.getSystemPrompt(effectiveLanguage);

    // Charger la mémoire de l'IA
    let memoryContext = "";
    const currentUser = await AsyncStorage.getItem("@current_user");
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        if (userData.uid) {
          const memory = await loadAIMemory(userData.uid);
          if (memory && memory.entries.length > 0) {
            memoryContext = `\n\nUSER'S PERSISTENT MEMORY (Use this to personalize your response):`;
            memory.entries.forEach((entry) => {
              memoryContext += `\n- [${entry.type}] ${entry.content} (Importance: ${entry.importance})`;
            });
          }
        }
      } catch (error) {}
    }

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `${systemPrompt}\n\n${SYSTEM_PROMPT}${memoryContext}`,
      },
    ];

    // Ajouter les messages précédents
    if (chatParams.previousMessages?.length) {
      chatParams.previousMessages.forEach((msg) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });
    }

    // Ajouter le message actuel
    messages.push({
      role: "user",
      content: chatParams.prompt,
    });

    // Ajouter une préférence légère d'adresse si disponible
    try {
      const raw = await AsyncStorage.getItem("@current_user");
      if (raw) {
        const info = JSON.parse(raw);
        const name = info?.name || info?.displayName || "";
        if (name) {
          const firstName = String(name).split(/\s+/)[0] || name;
          messages.unshift({
            role: "system",
            content:
              `ADDRESSING RULES: Prefer using the user's first name "${firstName}" only when it adds warmth or clarity; ` +
              `otherwise omit the name and use natural pronouns. Never repeat the name in every message.`,
          });
        }
      }
    } catch {}

    return messages;
  }

  /**
   * Essayer un fournisseur spécifique via le système centralisé
   */
  private static async tryProvider(
    provider: string,
    messages: ChatMessage[]
  ): Promise<string | null> {
    try {
      // Récupérer les infos utilisateur
      const { userId, planId } = await this.getUserInfo();

      // Essayer d'abord le système managé
      const managedResult = await this.tryManagedAPI(
        provider,
        messages,
        userId,
        planId
      );
      if (managedResult) {
        return managedResult;
      }

      // Fallback sur le système centralisé
      return await this.tryProviderDirect(provider, messages);
    } catch (error) {
      logger.error(`Erreur avec provider ${provider}:`, error);
      return null;
    }
  }

  /**
   * Essayer via le système managé
   */
  private static async tryManagedAPI(
    provider: string,
    messages: ChatMessage[],
    userId: string,
    planId: string
  ): Promise<string | null> {
    try {
      if (!ManagedAPIService.canUseAPI(provider, planId)) {
        return null;
      }

      // Convertir les messages en prompt unique pour l'API managée
      const fullPrompt = this.messagesToPrompt(messages);

      const response = await ManagedAPIService.makeAPICall({
        provider: provider.toLowerCase(),
        prompt: fullPrompt,
        userId,
        planId,
        maxTokens: 1000,
        temperature: 0.7,
      });

      if (response.success) {
        return this.extractContentFromResponse(provider, response.data);
      }

      return null;
    } catch (error) {
      logger.error(`Erreur API managée ${provider}:`, error);
      return null;
    }
  }

  /**
   * Essayer via le système centralisé direct
   */
  private static async tryProviderDirect(
    provider: string,
    messages: ChatMessage[]
  ): Promise<string | null> {
    try {
      const providerInstance = ProviderRegistry.getProvider(provider);
      if (!providerInstance) {
        logger.warn(`Provider ${provider} non trouvé dans le registre`);
        return null;
      }

      const apiKey = await ApiKeyManager.getApiKey(provider);
      if (!apiKey) {
        logger.warn(`Clé API manquante pour ${provider}`);
        return null;
      }

      // Récupérer les infos utilisateur
      const { userId, planId } = await this.getUserInfo();

      // Convertir les messages en prompt pour le provider
      const fullPrompt = this.messagesToPrompt(messages);

      // Appel via le système centralisé
      const response = await providerInstance.call(
        apiKey,
        {
          provider: provider.toLowerCase(),
          prompt: fullPrompt,
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

  /**
   * Convertit les messages en prompt unique
   */
  private static messagesToPrompt(messages: ChatMessage[]): string {
    return messages
      .map((msg) => {
        if (msg.role === "system") return `[SYSTEM] ${msg.content}`;
        if (msg.role === "user") return `[USER] ${msg.content}`;
        if (msg.role === "assistant") return `[ASSISTANT] ${msg.content}`;
        return msg.content;
      })
      .join("\n\n");
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
   * Obtient le modèle par défaut pour un provider
   */
  private static getDefaultModel(provider: string): string {
    const defaultModels: Record<string, string> = {
      [AI_PROVIDERS.OPENAI]: "gpt-3.5-turbo",
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
   * Prompt système pour le chat spécialisé téléprompter
   */
  private static getSystemPrompt(language: string = "fr"): string {
    const prompts: { [key: string]: string } = {
      fr: `Tu es un assistant spécialisé dans la création de scripts pour vidéos et téléprompter.
Tu aides les créateurs de contenu à rédiger des scripts captivants, structurés et adaptés à leur audience.

IMPORTANT - Quand on te demande ton OPINION ou ce que tu PENSES :
- Donne des arguments objectifs (avantages/inconvénients)
- Propose des recommandations basées sur les bonnes pratiques
- Ne te contente PAS de reformuler les préférences de l'utilisateur
- Structure ta réponse avec des points clairs

IMPORTANT - SALUTATIONS :
- Ne dis "Bonjour", "Salut" ou autres salutations QUE pour le PREMIER message
- Dans une conversation en cours, réponds DIRECTEMENT sans salutation
- Ne commence jamais tes réponses par "Salut !" ou "Bonjour !" si ce n'est pas le début

Exemple : Si on te demande "Que penses-tu des scripts longs vs courts ?"
Tu dois répondre avec :
- Les avantages de chaque format
- Les contextes d'utilisation appropriés
- Des recommandations selon le type de contenu
- PAS juste dire "tu aimes les deux"

Tes compétences incluent :
- Rédaction de scripts engageants et naturels
- Adaptation du ton selon l'audience cible
- Structuration claire avec introduction, développement et conclusion
- Optimisation du rythme et du timing
- Conseils sur la présentation et la livraison
- Suggestions pour améliorer l'impact du message`,

      en: `You are an assistant specialized in creating scripts for videos and teleprompter.
You help content creators write captivating, structured scripts adapted to their audience.

IMPORTANT - When asked for your OPINION or what you THINK:
- Give objective arguments (pros/cons)
- Provide recommendations based on best practices
- Do NOT just reformulate the user's preferences
- Structure your response with clear points

IMPORTANT - GREETINGS:
- Only say "Hello", "Hi" or other greetings for the FIRST message
- In an ongoing conversation, respond DIRECTLY without greetings
- Never start your responses with "Hi!" or "Hello!" unless it's the beginning

Example: If asked "What do you think about long vs short scripts?"
You should respond with:
- The advantages of each format
- Appropriate use contexts
- Recommendations based on content type
- NOT just say "you like both"

Your skills include:
- Writing engaging and natural scripts
- Adapting tone to target audience
- Clear structure with introduction, development, and conclusion
- Rhythm and timing optimization
- Presentation and delivery advice
- Suggestions to improve message impact`,
    };

    return prompts[language] || prompts.en;
  }
}
