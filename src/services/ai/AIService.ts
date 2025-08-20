// Service AI principal refactorisé - Point d'entrée unique pour toutes les fonctionnalités IA
import {
  AIGenerationOptions,
  AIPrompt,
  AIServiceResponse,
  ScriptData,
} from "../../types/ai";
import { createLogger } from "../../utils/optimizedLogger";
import { FreeChatService } from "./chat/FreeChatService";
import { SpecializedChatService } from "./chat/SpecializedChatService";
import { ScriptGenerationService } from "./script/ScriptGenerationService";
import { planningTools } from "./tools/planningTools";
import { themeTools } from "./tools/themeTools";
import { AIProvider } from "./types";
import { AIUtilsService } from "./utils/AIUtilsService";
import { ApiKeyManager } from "./ApiKeyManager";
import { SERVER_CONFIG } from "../../config/serverConfig";
import { ApiClient } from "../api/ApiClient";

// Créer un logger spécifique pour le service AI
const logger = createLogger("AIService");

/**
 * Service AI principal refactorisé
 *
 * Ce service agit comme un point d'entrée unique pour toutes les fonctionnalités IA,
 * en déléguant les tâches aux services spécialisés appropriés.
 *
 * Architecture:
 * - FreeChatService: Chat libre (assistant conversationnel polyvalent)
 * - SpecializedChatService: Chat spécialisé (assistant téléprompter)
 * - ScriptGenerationService: Génération de scripts
 * - ScriptImprovementService: Amélioration de scripts
 * - AIUtilsService: Utilitaires et fonctions auxiliaires
 */
export class AIService {
  // ==========================================
  // SERVICES DE CHAT
  // ==========================================

  /**
   * Chat libre avec l'IA - Assistant conversationnel polyvalent
   * Répond librement aux questions sur n'importe quel sujet
   */
  static async chatWithAIFreeform(chatParams: {
    prompt: string;
    previousMessages?: Array<{ role: "user" | "assistant"; content: string }>;
  }): Promise<{ reply: string }> {
    logger.info("Délégation vers FreeChatService pour chat libre");
    return FreeChatService.chat(chatParams);
  }

  /**
   * Chat spécialisé avec l'IA - Assistant téléprompter
   * Spécialisé dans la création de scripts pour vidéos et téléprompter
   */
  static async chatWithAI(chatParams: {
    prompt: string;
    previousMessages?: Array<{ role: "user" | "assistant"; content: string }>;
  }): Promise<{ reply: string }> {
    logger.info("Délégation vers SpecializedChatService pour chat spécialisé");
    return SpecializedChatService.chat(chatParams);
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
    logger.info("Délégation vers AIUtilsService pour chat simplifié");
    return AIUtilsService.simpleChatWithAI(prompt, previousMessages);
  }

  /**
   * Chat avec possibilité d'utiliser des outils (Function Calling)
   * Cette méthode permet à l'IA d'appeler des fonctions spécialisées
   * Supporte tous les fournisseurs d'IA disponibles
   */
  public static async chatWithTools(
    prompt: string,
    history: { role: "user" | "assistant"; content: string }[]
  ): Promise<any> {
    try {
      // Constantes pour les providers (même que dans les autres services)
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

        if (await ApiKeyManager.getOpenAIKey())
          providers.push(AI_PROVIDERS.OPENAI);
        if (await ApiKeyManager.getGeminiKey())
          providers.push(AI_PROVIDERS.GEMINI);
        if (await ApiKeyManager.getMistralKey())
          providers.push(AI_PROVIDERS.MISTRAL);
        if (await ApiKeyManager.getCohereKey())
          providers.push(AI_PROVIDERS.COHERE);
        if (await ApiKeyManager.getClaudeKey())
          providers.push(AI_PROVIDERS.CLAUDE);
        if (await ApiKeyManager.getPerplexityKey())
          providers.push(AI_PROVIDERS.PERPLEXITY);
        if (await ApiKeyManager.getTogetherKey())
          providers.push(AI_PROVIDERS.TOGETHER);
        if (await ApiKeyManager.getGroqKey()) providers.push(AI_PROVIDERS.GROQ);
        if (await ApiKeyManager.getFireworksKey())
          providers.push(AI_PROVIDERS.FIREWORKS);

        return providers;
      };

      const enabledProviders = await getEnabledProviders();

      if (enabledProviders.length === 0) {
        throw new Error(
          "Aucun fournisseur d'IA configuré pour le function calling"
        );
      }

      // Essayer avec chaque fournisseur dans l'ordre
      for (const provider of enabledProviders) {
        try {
          const result = await this.callProviderWithTools(
            provider,
            prompt,
            history
          );
          if (result) {
            return result;
          }
        } catch (error) {
          logger.error(`Erreur avec ${provider}:`, error);
          // Continuer avec le prochain provider
        }
      }

      const response = await SpecializedChatService.chat({
        prompt,
        previousMessages: history,
      });
      return { type: "text", content: response.reply };
    } catch (error) {
      logger.error("Erreur dans chatWithTools:", error);
      throw error;
    }
  }

  /**
   * Appel à un provider spécifique avec support des tools
   */
  private static async callProviderWithTools(
    provider: string,
    prompt: string,
    history: { role: "user" | "assistant"; content: string }[]
  ): Promise<any> {
    switch (provider) {
      case "OPENAI":
        const openaiKey = await ApiKeyManager.getOpenAIKey();
        if (!openaiKey) throw new Error("Clé OpenAI non trouvée");
        return this.callOpenAIWithTools(openaiKey, prompt, history);

      case "GEMINI":
        const geminiKey = await ApiKeyManager.getGeminiKey();
        if (!geminiKey) throw new Error("Clé Gemini non trouvée");
        return this.callGeminiWithTools(geminiKey, prompt, history);

      case "MISTRAL":
        const mistralKey = await ApiKeyManager.getMistralKey();
        if (!mistralKey) throw new Error("Clé Mistral non trouvée");
        return this.callMistralWithTools(mistralKey, prompt, history);

      case "CLAUDE":
        const claudeKey = await ApiKeyManager.getClaudeKey();
        if (!claudeKey) throw new Error("Clé Claude non trouvée");
        return this.callClaudeWithTools(claudeKey, prompt, history);

      // Les autres providers utilisent un appel simple
      default:
        return this.callProviderSimple(provider, prompt, history);
    }
  }

  /**
   * Appel direct à l'API OpenAI avec support des tools
   */
  private static async callOpenAIWithTools(
    apiKey: string,
    prompt: string,
    history: { role: "user" | "assistant"; content: string }[]
  ): Promise<any> {
    const messages = [
      { role: "system", content: "Tu es un assistant IA utile et créatif." },
      ...history,
      { role: "user", content: prompt },
    ];

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4-turbo",
            messages,
            tools: [...planningTools, ...themeTools],
            tool_choice: "auto",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur API OpenAI: ${response.status}`);
      }

      const data = await response.json();
      const message = data.choices[0].message;

      return {
        content: message.content,
        tool_calls: message.tool_calls,
      };
    } catch (error) {
      logger.error("Erreur lors de l'appel à OpenAI:", error);
      throw new Error(
        "MODEL_ERROR: Erreur lors de la communication avec l'API OpenAI."
      );
    }
  }

  /**
   * Appel Gemini avec support des tools (function calling limité)
   */
  private static async callGeminiWithTools(
    apiKey: string,
    prompt: string,
    history: { role: "user" | "assistant"; content: string }[]
  ): Promise<any> {
    return this.callProviderSimple("GEMINI", prompt, history);
  }

  /**
   * Appel Mistral avec support des tools
   */
  private static async callMistralWithTools(
    apiKey: string,
    prompt: string,
    history: { role: "user" | "assistant"; content: string }[]
  ): Promise<any> {
    return this.callProviderSimple("MISTRAL", prompt, history);
  }

  /**
   * Appel Claude avec support des tools
   */
  private static async callClaudeWithTools(
    apiKey: string,
    prompt: string,
    history: { role: "user" | "assistant"; content: string }[]
  ): Promise<any> {
    return this.callProviderSimple("CLAUDE", prompt, history);
  }

  /**
   * Appel simple à un provider sans function calling
   */
  private static async callProviderSimple(
    provider: string,
    prompt: string,
    history: { role: "user" | "assistant"; content: string }[]
  ): Promise<any> {
    // Utiliser le service de chat spécialisé comme fallback
    const response = await SpecializedChatService.chat({
      prompt,
      previousMessages: history,
    });
    return { type: "text", content: response.reply };
  }

  // ==========================================
  // SERVICES DE GÉNÉRATION DE SCRIPTS
  // ==========================================

  /**
   * Génère un script en utilisant le premier fournisseur d'IA disponible
   */
  static async generateScript(
    prompt: AIPrompt,
    options?: AIGenerationOptions
  ): Promise<AIServiceResponse> {
    logger.info(
      "Délégation vers ScriptGenerationService pour génération de script"
    );
    return ScriptGenerationService.generateScript(prompt, options);
  }

  /**
   * Génère plusieurs variantes d'un script
   */
  static async generateVariants(
    basePrompt: AIPrompt,
    count: number = 3
  ): Promise<AIServiceResponse[]> {
    logger.info(
      "Délégation vers ScriptGenerationService pour génération de variantes"
    );
    return ScriptGenerationService.generateVariants(basePrompt, count);
  }

  /**
   * Sauvegarde un script
   */
  static async saveScript(script: ScriptData): Promise<boolean> {
    logger.info("Délégation vers ScriptGenerationService pour sauvegarde");
    return ScriptGenerationService.saveScript(script);
  }

  // ==========================================
  // SERVICES D'AMÉLIORATION DE SCRIPTS
  // ==========================================

  /**
   * Améliore un script existant en utilisant le système unifié
   */
  static async improveScript(
    originalScript: string,
    improvements: string[]
  ): Promise<string> {
    logger.info("Amélioration du script demandée via AIService", {
      improvements,
    });

    // Essayer le proxy d'abord
    if (!SERVER_CONFIG.BYPASS_PROXY) {
      try {
        const proxyResponse = await ApiClient.improveScript(
          originalScript,
          improvements
        );
        if (proxyResponse?.content) {
          logger.info("Script amélioré via le serveur proxy");
          return proxyResponse.content;
        }
      } catch (proxyError) {
        logger.error(
          "Erreur du serveur proxy, fallback vers API directe",
          proxyError
        );
      }
    }

    // Construire le prompt et appeler le service de génération
    const improvementPrompt = this.buildImprovementPrompt(
      originalScript,
      improvements
    );

    const prompt: AIPrompt = {
      topic: improvementPrompt,
      platform: "presentation",
      tone: "professional",
      duration: "medium",
      language: "auto",
    };

    // Notez que nous réutilisons generateScript qui est déjà dans AIService
    const result = await this.generateScript(prompt);
    return result.content;
  }

  /**
   * Construit le prompt pour l'amélioration du script (méthode privée)
   */
  private static buildImprovementPrompt(
    originalScript: string,
    improvements: string[]
  ): string {
    const improvementsList = improvements
      .map((imp, index) => `${index + 1}. ${imp}`)
      .join("\n");

    return `Améliore le script suivant en appliquant ces modifications:\n\n${improvementsList}\n\nScript original:\n${originalScript}\n\nFournis uniquement le script amélioré, sans commentaires ni explications.`;
  }

  /**
   * Génère un script avec des prompts personnalisés
   */
  static async generateWithCustomPrompt(
    systemPrompt: string,
    userPrompt: string,
    options: Partial<AIPrompt> = {}
  ): Promise<string> {
    logger.info("Génération avec prompt personnalisé via AIService");

    const fullUserPrompt = `${systemPrompt}\n\n${userPrompt}`;

    const prompt: AIPrompt = {
      topic: fullUserPrompt,
      platform: options.platform || "presentation",
      tone: options.tone || "professional",
      duration: options.duration || "medium",
      language: options.language || "auto",
      creativity: options.creativity || 0.7,
      ...options,
    };

    const result = await this.generateScript(prompt);
    return result.content;
  }

  // ==========================================
  // SERVICES D'AMÉLIORATION DE TEXTE
  // ==========================================

  /**
   * Corrige la grammaire et l'orthographe
   */
  static async correctGrammar(text: string): Promise<string> {
    logger.info("Correction grammaticale demandée via AIService");
    const systemPrompt = `Tu es un correcteur professionnel. Corrige UNIQUEMENT les erreurs (orthographe, grammaire, ponctuation) dans le texte suivant. Ne modifie ni le style, ni le contenu.`;
    const userPrompt = `Texte à corriger :\n\n${text}`;
    return this.generateWithCustomPrompt(systemPrompt, userPrompt);
  }

  /**
   * Améliore le style d'écriture d'un texte
   */
  static async improveStyle(text: string): Promise<string> {
    logger.info("Amélioration du style demandée via AIService");
    const systemPrompt = `Tu es un expert en rédaction. Améliore la fluidité, le rythme et le vocabulaire du texte suivant sans altérer son sens original.`;
    const userPrompt = `Texte à améliorer :\n\n${text}`;
    return this.generateWithCustomPrompt(systemPrompt, userPrompt);
  }

  /**
   * Raccourcit un texte en préservant l'essentiel
   */
  static async shortenText(
    text: string,
    targetReduction: number = 30
  ): Promise<string> {
    logger.info(
      `Raccourcissement du texte demandé via AIService (cible: ${targetReduction}%)`
    );
    const systemPrompt = `Tu es un expert en synthèse. Raccourcis le texte suivant d'environ ${targetReduction}% en gardant tous les points clés et le ton original.`;
    const userPrompt = `Texte à raccourcir :\n\n${text}`;
    return this.generateWithCustomPrompt(systemPrompt, userPrompt);
  }

  /**
   * Analyse le ton d'un texte
   */
  static async analyzeTone(text: string): Promise<{
    currentTone: string;
    suggestions: string[];
    analysis: string;
  }> {
    logger.info("Analyse de ton demandée via AIService");
    const systemPrompt = `Tu es un expert en analyse de communication. Analyse le ton du texte suivant et réponds en JSON avec la structure: {"currentTone": "...", "analysis": "...", "suggestions": ["...", "..."]}`;
    const userPrompt = `Analyse ce texte :\n\n${text}`;

    const response = await this.generateWithCustomPrompt(
      systemPrompt,
      userPrompt
    );

    try {
      return JSON.parse(response);
    } catch (e) {
      logger.error(
        "Impossible de parser la réponse JSON de l'analyse de ton",
        e
      );
      return {
        currentTone: "Non déterminé",
        analysis: response,
        suggestions: ["Erreur lors de l'analyse automatique."],
      };
    }
  }

  /**
   * Adapte un texte à une audience spécifique
   */
  static async adaptToAudience(
    text: string,
    targetAudience: string
  ): Promise<string> {
    logger.info(
      `Adaptation à l'audience "${targetAudience}" demandée via AIService`
    );
    const systemPrompt = `Tu es un expert en communication. Adapte le texte suivant pour une audience de "${targetAudience}" en ajustant le vocabulaire, le ton et les exemples.`;
    const userPrompt = `Texte à adapter :\n\n${text}`;
    return this.generateWithCustomPrompt(systemPrompt, userPrompt);
  }

  /**
   * Optimise un texte pour l'engagement
   */
  static async optimizeEngagement(
    text: string,
    platform?: string
  ): Promise<string> {
    const platformContext = platform ? ` pour la plateforme ${platform}` : "";
    logger.info(
      `Optimisation de l'engagement demandée via AIService${platformContext}`
    );
    const systemPrompt = `Tu es un expert en marketing de contenu. Optimise le texte suivant ${platformContext} pour maximiser l'engagement en utilisant des techniques de storytelling, des hooks et des appels à l'action.`;
    const userPrompt = `Texte à optimiser :\n\n${text}`;
    return this.generateWithCustomPrompt(systemPrompt, userPrompt);
  }

  // ==========================================
  // SERVICES UTILITAIRES
  // ==========================================

  /**
   * Vérifie si des clés API sont configurées
   * @returns Un objet indiquant si chaque fournisseur a une clé valide
   */
  static async checkConfiguredAPIKeys(): Promise<{ [key: string]: boolean }> {
    logger.info(
      "Délégation vers AIUtilsService pour vérification des clés API"
    );
    return AIUtilsService.checkConfiguredAPIKeys();
  }
}

// Export des services individuels pour un usage direct si nécessaire
export {
  AIUtilsService,
  FreeChatService,
  ScriptGenerationService,
  SpecializedChatService,
};
