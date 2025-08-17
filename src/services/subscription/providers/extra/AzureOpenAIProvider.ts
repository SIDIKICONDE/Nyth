import { BaseProvider } from "../BaseProvider";
import {
  AIProviderConfig,
  APICallOptions,
  AIProviderResponse,
} from "../../types/api";
import { ApiKeyManager } from "../../../ai/ApiKeyManager";

export class AzureOpenAIProvider extends BaseProvider {
  name = "azureopenai";
  apiUrl = "azure";
  category: "classic" | "premium" = "premium";

  async call(
    apiKey: string,
    options: APICallOptions,
    config: AIProviderConfig
  ): Promise<AIProviderResponse> {
    const { SERVER_CONFIG } = await import("../../../../config/serverConfig");
    const { ApiClient } = await import("../../../api/ApiClient");
    const body = {
      provider: this.name,
      messages: [{ role: "user", content: options.prompt }],
      model: config.model,
      options: { maxTokens: config.maxTokens, temperature: config.temperature },
    };
    // Utiliser le proxy serveur si possible, sinon direct via ManagedAPIService
    const data = await ApiClient.chatAI(body);
    return { data, tokensUsed: 0 };
  }

  override async testConnection(
    apiKey: string
  ): Promise<{ success: boolean; message: string }> {
    const key = await ApiKeyManager.getApiKey(this.name);
    return { success: !!key, message: key ? "Clé trouvée" : "Clé absente" };
  }
}
