import { BaseProvider } from "./BaseProvider";
import {
  AIProviderConfig,
  APICallOptions,
  AIProviderResponse,
} from "../types/api";

export class PerplexityProvider extends BaseProvider {
  name = "perplexity";
  apiUrl = "https://api.perplexity.ai/chat/completions";
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
        model: model || "llama-3.1-sonar-small-128k-online",
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
