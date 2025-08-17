import { DEFAULT_GENERATION_OPTIONS } from "../config/aiConfig";
import { Script } from "../types";
import { AIGenerationOptions, AIPrompt } from "../types/ai";
import { AIService as NewAIService } from "./ai/AIService";

// Export des interfaces pour la compatibilité
export { AIGenerationOptions, AIPrompt } from "../types/ai";

export class AIService {
  static getInstance() {
    throw new Error("Method not implemented.");
  }
  // Déléguer vers le nouveau service refactorisé
  static async generateScript(
    prompt: AIPrompt,
    options: AIGenerationOptions = DEFAULT_GENERATION_OPTIONS
  ): Promise<Script> {
    const result = await NewAIService.generateScript(prompt, options);

    // Convertir le résultat vers le type Script attendu avec gestion des champs optionnels
    return {
      id: result.id,
      title: result.title,
      content: result.content,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      isAIGenerated: result.isAIGenerated,
      aiPrompt: result.aiPrompt
        ? ({
            ...result.aiPrompt,
            // S'assurer que duration a une valeur par défaut si elle est undefined
            duration: result.aiPrompt.duration || "medium",
          } as Script["aiPrompt"])
        : undefined,
      aiOptions: result.aiOptions,
    };
  }

  static async improveScript(
    originalScript: string,
    improvements: string[]
  ): Promise<string> {
    return await NewAIService.improveScript(originalScript, improvements);
  }

  // Méthodes dépréciées - gardées pour la compatibilité
  private static apiEndpoint = "https://api.openai.com/v1/chat/completions";
  private static apiKey = process.env.OPENAI_API_KEY;

  // Endpoints alternatifs gratuits
  private static geminiEndpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
  private static mistralEndpoint = "https://api.mistral.ai/v1/chat/completions";
  private static cohereEndpoint = "https://api.cohere.ai/v1/generate";

  // Récupère la clé API depuis AsyncStorage ou l'environnement
  private static async getApiKey(): Promise<string | null> {
    try {
      // D'abord essayer AsyncStorage
      const { SecureApiKeyManager } = await import("./ai/SecureApiKeyManager");
      const storedKey = await SecureApiKeyManager.getApiKey("openai");
      if (storedKey && storedKey.trim()) {
        return storedKey.trim();
      }

      // Sinon utiliser la variable d'environnement
      return this.apiKey || null;
    } catch (error) {
      return this.apiKey || null;
    }
  }
}
