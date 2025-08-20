import { BaseProvider } from "./BaseProvider";
import {
  AIProviderConfig,
  APICallOptions,
  AIProviderResponse,
} from "../types/api";

export class CohereProvider extends BaseProvider {
  name = "cohere";
  apiUrl = "https://api.cohere.ai/v1/generate";
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
        model: model || "command",
        prompt: options.prompt,
        max_tokens: maxTokens,
        temperature,
      }
    );

    const data = await response.json();
    const responseText = data.generations?.[0]?.text || "";
    const tokensUsed = this.estimateTokens(options.prompt, responseText);

    return { data, tokensUsed };
  }
}
