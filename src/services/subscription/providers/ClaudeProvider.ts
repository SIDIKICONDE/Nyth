import { BaseProvider } from "./BaseProvider";
import {
  AIProviderConfig,
  APICallOptions,
  AIProviderResponse,
} from "../types/api";

export class ClaudeProvider extends BaseProvider {
  name = "claude";
  apiUrl = "https://api.anthropic.com/v1/messages";
  category: "classic" | "premium" = "premium";

  async call(
    apiKey: string,
    options: APICallOptions,
    config: AIProviderConfig
  ): Promise<AIProviderResponse> {
    const { model, maxTokens } = this.getModelConfig(options, config);

    const response = await this.makeRequest(
      this.apiUrl,
      {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      {
        model: model || "claude-3-sonnet-20240229",
        max_tokens: maxTokens,
        messages: [
          {
            role: "user",
            content: options.prompt,
          },
        ],
      }
    );

    const data = await response.json();
    const tokensUsed =
      data.usage?.input_tokens + data.usage?.output_tokens || 0;

    return { data, tokensUsed };
  }
}
