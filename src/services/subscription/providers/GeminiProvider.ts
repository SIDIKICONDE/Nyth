import { BaseProvider } from "./BaseProvider";
import {
  AIProviderConfig,
  APICallOptions,
  AIProviderResponse,
} from "../types/api";

export class GeminiProvider extends BaseProvider {
  name = "gemini";
  apiUrl = "https://generativelanguage.googleapis.com/v1beta/models";
  category: "classic" | "premium" = "classic";

  async call(
    apiKey: string,
    options: APICallOptions,
    config: AIProviderConfig
  ): Promise<AIProviderResponse> {
    const { model, maxTokens, temperature } = this.getModelConfig(
      options,
      config
    );
    const url = `${this.apiUrl}/${model}:generateContent?key=${apiKey}`;

    const response = await this.makeRequest(
      url,
      {},
      {
        contents: [
          {
            parts: [
              {
                text: options.prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }
    );

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const tokensUsed = this.estimateTokens(options.prompt, responseText);

    return { data, tokensUsed };
  }

  override async testConnection(
    apiKey: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`
      );

      if (response.ok) {
        return { success: true, message: "Votre clé API Gemini est valide" };
      } else {
        return {
          success: false,
          message: "Votre clé API Gemini semble invalide",
        };
      }
    } catch (error) {
      return {
        success: false,
        message:
          "Impossible de se connecter à Gemini. Vérifiez votre connexion internet.",
      };
    }
  }
}
