import { BaseProvider } from "./BaseProvider";
import {
  AIProviderConfig,
  APICallOptions,
  AIProviderResponse,
} from "../types/api";

export class TogetherProvider extends BaseProvider {
  name = "together";
  apiUrl = "https://api.together.xyz/v1/chat/completions";
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
        model: model || "meta-llama/Llama-2-7b-chat-hf",
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
