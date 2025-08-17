import { BaseProvider } from "../BaseProvider";
import {
  AIProviderConfig,
  APICallOptions,
  AIProviderResponse,
} from "../../types/api";

export class XAIProvider extends BaseProvider {
  name = "xai";
  apiUrl = "https://api.x.ai/v1/chat/completions";
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
        model,
        messages: [{ role: "user", content: options.prompt }],
        max_tokens: maxTokens,
        temperature,
      }
    );
    const data = await response.json();
    return { data, tokensUsed: 0 };
  }
}
