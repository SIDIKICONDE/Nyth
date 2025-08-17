import { BaseProvider } from "./BaseProvider";
import {
  AIProviderConfig,
  APICallOptions,
  AIProviderResponse,
} from "../types/api";

export class OpenAIProvider extends BaseProvider {
  name = "openai";
  apiUrl = "https://api.openai.com/v1/chat/completions";
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

    const response = await this.makeRequest(
      this.apiUrl,
      { Authorization: `Bearer ${apiKey}` },
      {
        model,
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
