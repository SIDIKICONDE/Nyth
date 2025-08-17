import {
  AIProvider,
  AIProviderConfig,
  APICallOptions,
  AIProviderResponse,
} from "../types/api";
import { createLogger } from "../../../utils/optimizedLogger";

const logger = createLogger("BaseProvider");

export abstract class BaseProvider implements AIProvider {
  abstract name: string;
  abstract apiUrl: string;
  abstract category: "classic" | "premium";

  abstract call(
    apiKey: string,
    options: APICallOptions,
    config: AIProviderConfig
  ): Promise<AIProviderResponse>;

  async testConnection(
    apiKey: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(
        this.apiUrl.replace("/chat/completions", "/models"),
        {
          headers: { Authorization: `Bearer ${apiKey.trim()}` },
        }
      );

      if (response.ok) {
        return {
          success: true,
          message: `Votre clé API ${this.name} est valide`,
        };
      } else {
        return {
          success: false,
          message: `Votre clé API ${this.name} semble invalide`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Impossible de se connecter à ${this.name}. Vérifiez votre connexion internet.`,
      };
    }
  }

  protected async makeRequest(
    url: string,
    headers: Record<string, string>,
    body: any
  ): Promise<Response> {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `${this.name} API error (${response.status}): ${
          errorData.error?.message || errorData.message || response.statusText
        }`
      );
    }

    return response;
  }

  protected estimateTokens(prompt: string, responseText: string = ""): number {
    return Math.ceil((prompt.length + responseText.length) / 4);
  }

  protected getModelConfig(options: APICallOptions, config: AIProviderConfig) {
    return {
      model: options.model || config.model,
      maxTokens: options.maxTokens || config.maxTokens,
      temperature: options.temperature || config.temperature,
    };
  }
}
