export interface APISettings {
  // OpenAI
  apiKey: string;
  useCustomAPI: boolean;

  // Free APIs
  geminiKey: string;
  useGemini: boolean;
  mistralKey: string;
  useMistral: boolean;
  cohereKey: string;
  useCohere: boolean;

  // Nouveaux services AI Premium
  claudeKey: string;
  useClaude: boolean;
  perplexityKey: string;
  usePerplexity: boolean;
  togetherKey: string;
  useTogether: boolean;
  groqKey: string;
  useGroq: boolean;
  fireworksKey: string;
  useFireworks: boolean;

  // Nouveaux providers
  azureopenaiKey: string;
  useAzureOpenAI: boolean;
  openrouterKey: string;
  useOpenRouter: boolean;
  deepinfraKey: string;
  useDeepInfra: boolean;
  xaiKey: string;
  useXAI: boolean;
  deepseekKey: string;
  useDeepSeek: boolean;

  // Paramètres de génération
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface CacheStats {
  entryCount: number;
  sizeInBytes: number;
  oldestEntry: number;
  newestEntry: number;
}

export interface UseAISettingsReturn {
  // Settings state
  settings: APISettings;
  updateSetting: <K extends keyof APISettings>(
    key: K,
    value: APISettings[K]
  ) => void;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  testingApi: string;
  clearingCache: boolean;

  // Cache management
  cacheStats: CacheStats;
  clearCache: () => Promise<void>;
  refreshCacheStats: () => Promise<void>;

  // API testing
  testAPI: (apiName: string) => Promise<void>;

  // Settings management
  saveSettings: () => Promise<void>;
  loadSettings: () => Promise<void>;

  // Service management
  handleServiceToggle: (service: string, isEnabled: boolean) => Promise<void>;
}

export interface APITestResult {
  success: boolean;
  error?: string;
}
