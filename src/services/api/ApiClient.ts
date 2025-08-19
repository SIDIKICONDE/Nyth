import { AIPrompt, AIServiceResponse } from "../../types/ai";
import { createLogger } from "../../utils/optimizedLogger";
import { SERVER_CONFIG } from "../../config/serverConfig";
import {
  AI_PROVIDERS,
  AI_PROVIDER_CONFIG,
} from "../../config/aiConfig";
import { getSecureHeaders } from "../../utils/securityUtils";

const logger = createLogger("ApiClient");

export class ApiClient {
  private static baseUrl = SERVER_CONFIG.BASE_URL;

  /**
   * Génère un script via le serveur proxy
   */
  static async generateScript(prompt: {
    topic: string;
    platform: string;
    tone: string;
    duration: string;
    language: string;
    creativity: number;
    characterCount?: number;
  }): Promise<AIServiceResponse> {
    try {
      const secureHeaders = await getSecureHeaders();

      const promptTextParts: string[] = [
        `Sujet: ${prompt.topic}`,
        `Plateforme: ${prompt.platform}`,
        `Ton: ${prompt.tone}`,
        `Durée: ${prompt.duration}`,
        `Langue: ${prompt.language}`,
        `Créativité: ${prompt.creativity}`,
      ];
      if (typeof prompt.characterCount === "number") {
        promptTextParts.push(
          `Taille cible (caractères): ${prompt.characterCount}`
        );
      }
      const promptText = `Crée un script structuré, prêt à lire, avec sections claires (intro, points clés, conclusion). ${promptTextParts.join(
        " | "
      )}.`;

      const order = Object.values(AI_PROVIDERS);

      const buildPayload = (
        provider: string
      ): { url: string; body: unknown } => {
        const temperature = Math.max(0, Math.min(1, prompt.creativity));
        const maxTokens = 1200;
        switch (provider) {
          case AI_PROVIDERS.OPENAI: {
            const model = AI_PROVIDER_CONFIG[AI_PROVIDERS.OPENAI].defaultModel;
            return {
              url: `${this.baseUrl}/openaiProxy`,
              body: {
                model,
                messages: [{ role: "user", content: promptText }],
                temperature,
                max_tokens: maxTokens,
              },
            };
          }
          case AI_PROVIDERS.GEMINI: {
            const model = AI_PROVIDER_CONFIG[AI_PROVIDERS.GEMINI].defaultModel;
            return {
              url: `${this.baseUrl}/geminiProxy`,
              body: {
                model,
                contents: [{ role: "user", parts: [{ text: promptText }] }],
              },
            };
          }
          case AI_PROVIDERS.CLAUDE: {
            const model = AI_PROVIDER_CONFIG[AI_PROVIDERS.CLAUDE].defaultModel;
            return {
              url: `${this.baseUrl}/claudeProxy`,
              body: {
                model,
                messages: [{ role: "user", content: promptText }],
                max_tokens: maxTokens,
                temperature,
              },
            };
          }
          case AI_PROVIDERS.MISTRAL: {
            return {
              url: `${this.baseUrl}/mistralProxy`,
              body: {
                prompt: promptText,
                model: "mistral-small-latest",
                temperature,
                max_tokens: maxTokens,
              },
            };
          }
          case AI_PROVIDERS.PERPLEXITY: {
            const model =
              AI_PROVIDER_CONFIG[AI_PROVIDERS.PERPLEXITY].defaultModel;
            return {
              url: `${this.baseUrl}/perplexityProxy`,
              body: {
                model,
                messages: [{ role: "user", content: promptText }],
                temperature,
                max_tokens: maxTokens,
              },
            };
          }
          case AI_PROVIDERS.COHERE: {
            const model = AI_PROVIDER_CONFIG[AI_PROVIDERS.COHERE].defaultModel;
            return {
              url: `${this.baseUrl}/cohereProxy`,
              body: { model, prompt: promptText, temperature },
            };
          }
          case AI_PROVIDERS.TOGETHER: {
            const model =
              AI_PROVIDER_CONFIG[AI_PROVIDERS.TOGETHER].defaultModel;
            return {
              url: `${this.baseUrl}/togetherProxy`,
              body: {
                model,
                messages: [{ role: "user", content: promptText }],
                temperature,
                max_tokens: maxTokens,
              },
            };
          }
          case AI_PROVIDERS.GROQ: {
            const model = AI_PROVIDER_CONFIG[AI_PROVIDERS.GROQ].defaultModel;
            return {
              url: `${this.baseUrl}/groqProxy`,
              body: {
                model,
                messages: [{ role: "user", content: promptText }],
                temperature,
                max_tokens: maxTokens,
              },
            };
          }
          case AI_PROVIDERS.FIREWORKS: {
            const model =
              AI_PROVIDER_CONFIG[AI_PROVIDERS.FIREWORKS].defaultModel;
            return {
              url: `${this.baseUrl}/fireworksProxy`,
              body: {
                model,
                messages: [{ role: "user", content: promptText }],
                temperature,
                max_tokens: maxTokens,
              },
            };
          }
          default:
            return {
              url: `${this.baseUrl}/mistralProxy`,
              body: { prompt: promptText },
            };
        }
      };

      const extractContent = (
        provider: string,
        json: unknown
      ): string | null => {
        if (!json || typeof json !== "object") return null;
        const j = json as Record<string, unknown>;
        if (
          provider === AI_PROVIDERS.OPENAI ||
          provider === AI_PROVIDERS.MISTRAL ||
          provider === AI_PROVIDERS.PERPLEXITY ||
          provider === AI_PROVIDERS.TOGETHER ||
          provider === AI_PROVIDERS.GROQ ||
          provider === AI_PROVIDERS.FIREWORKS
        ) {
          const choices = j["choices"] as unknown;
          if (Array.isArray(choices) && choices[0]) {
            const first = choices[0] as Record<string, unknown>;
            const msg = first["message"] as Record<string, unknown> | undefined;
            const text =
              (first["text"] as string | undefined) ||
              (msg && (msg["content"] as string | undefined));
            return typeof text === "string" ? text : null;
          }
        }
        if (provider === AI_PROVIDERS.GEMINI) {
          const candidates = j["candidates"] as unknown;
          if (Array.isArray(candidates) && candidates[0]) {
            const content = (candidates[0] as Record<string, unknown>)[
              "content"
            ] as Record<string, unknown> | undefined;
            const parts = content?.["parts"] as unknown;
            if (Array.isArray(parts) && parts[0]) {
              const text = (parts[0] as Record<string, unknown>)["text"] as
                | string
                | undefined;
              return typeof text === "string" ? text : null;
            }
          }
        }
        if (provider === AI_PROVIDERS.COHERE) {
          const generations = j["generations"] as unknown;
          if (Array.isArray(generations) && generations[0]) {
            const text = (generations[0] as Record<string, unknown>)["text"] as
              | string
              | undefined;
            return typeof text === "string" ? text : null;
          }
        }
        if (provider === AI_PROVIDERS.CLAUDE) {
          const contentArr = j["content"] as unknown;
          if (Array.isArray(contentArr) && contentArr[0]) {
            const text = (contentArr[0] as Record<string, unknown>)["text"] as
              | string
              | undefined;
            return typeof text === "string" ? text : null;
          }
        }
        return null;
      };

      let lastStatus: number | null = null;
      for (const provider of order) {
        const { url, body } = buildPayload(provider);
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...SERVER_CONFIG.SECURITY.HEADERS,
            ...secureHeaders,
          },
          body: JSON.stringify(body),
        });
        lastStatus = response.status;
        if (!response.ok) continue;
        const json = (await response.json()) as unknown;
        const content = extractContent(provider, json);
        if (!content) continue;
        return {
          id: `script_${Date.now()}`,
          title: "Script généré",
          content: content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isAIGenerated: true,
          aiPrompt: prompt as AIPrompt,
        };
      }

      throw new Error(`Erreur serveur: ${lastStatus ?? 500}`);
    } catch (error) {
      logger.error("Erreur lors de l'appel au serveur proxy", error);
      throw error;
    }
  }

  /**
   * Améliore un script via le serveur proxy
   */
  static async improveScript(
    originalScript: string,
    improvements: string[]
  ): Promise<{ content: string }> {
    try {
      const secureHeaders = await getSecureHeaders();
      const response = await fetch(`${this.baseUrl}/api/improve-script`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...secureHeaders,
        },
        body: JSON.stringify({
          script: originalScript,
          improvements,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      const data = await response.json();
      return { content: data.improvedScript || data.content || originalScript };
    } catch (error) {
      logger.error("Erreur lors de l'amélioration du script", error);
      throw error;
    }
  }

  /**
   * Vérifie la santé du serveur
   */
  static async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      logger.warn("Le serveur proxy n'est pas accessible", error);
      return false;
    }
  }

  /**
   * Appel de chat générique via le proxy serveur
   */
  static async chatAI(payload: {
    provider: string;
    messages: { role: string; content: string }[];
    model?: string;
    options?: Record<string, unknown>;
  }): Promise<any> {
    try {
      const secureHeaders = await getSecureHeaders();

      const response = await fetch(
        `${this.baseUrl}${SERVER_CONFIG.ENDPOINTS.AI.CHAT}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...SERVER_CONFIG.SECURITY.HEADERS,
            ...secureHeaders,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error("Erreur lors de l'appel au chat IA", error);
      throw error;
    }
  }
}
