import { BaseProvider } from "./BaseProvider";
import {
  AIProviderConfig,
  APICallOptions,
  AIProviderResponse,
} from "../types/api";

export class FireworksProvider extends BaseProvider {
  name = "fireworks";
  apiUrl = "https://api.fireworks.ai/inference/v1/chat/completions";
  category: "classic" | "premium" = "premium";

  async call(
    apiKey: string,
    options: APICallOptions,
    config: AIProviderConfig
  ): Promise<AIProviderResponse> {
    const { model, maxTokens, temperature } = this.getModelConfig(
      options,
      config
    );

    const response = await this.makeRequest(
      this.apiUrl,
      { Authorization: `Bearer ${apiKey}` },
      {
        model: model || "accounts/fireworks/models/llama-v2-7b-chat",
        messages: [
          {
            role: "user",
            content: options.prompt,
          },
        ],
        max_tokens: maxTokens,
        temperature,
      }
    );

    const data = await response.json();
    const tokensUsed = data.usage?.total_tokens || 0;

    return { data, tokensUsed };
  }
}
