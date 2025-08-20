export interface APICallOptions {
  provider: string;
  model?: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  userId: string;
  planId: string;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
  dailyCount: number;
  dailyResetTime: number;
}

export interface ManagedAPIResponse {
  success: boolean;
  data?: any;
  error?: string;
  tokensUsed?: number;
}

export interface AIProviderConfig {
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface AIProviderResponse {
  data: any;
  tokensUsed: number;
}

export interface AIProvider {
  name: string;
  apiUrl: string;
  category: "classic" | "premium";
  call(
    apiKey: string,
    options: APICallOptions,
    config: AIProviderConfig
  ): Promise<AIProviderResponse>;
  testConnection(
    apiKey: string
  ): Promise<{ success: boolean; message: string }>;
}
