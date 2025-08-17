import { ApiKeyManager, ApiPreference } from "../services/ai/ApiKeyManager";

// Constantes pour les providers d'IA
export const AI_PROVIDERS = {
  OPENAI: "OPENAI",
  GEMINI: "GEMINI",
  MISTRAL: "MISTRAL",
  COHERE: "COHERE",
  CLAUDE: "CLAUDE",
  PERPLEXITY: "PERPLEXITY",
  TOGETHER: "TOGETHER",
  GROQ: "GROQ",
  FIREWORKS: "FIREWORKS",
  AZUREOPENAI: "AZUREOPENAI",
  OPENROUTER: "OPENROUTER",
  DEEPINFRA: "DEEPINFRA",
  XAI: "XAI",
  DEEPSEEK: "DEEPSEEK",
} as const;

// Configuration par défaut pour les providers
export const AI_PROVIDER_CONFIG = {
  [AI_PROVIDERS.OPENAI]: {
    baseUrl: "https://api.openai.com/v1/chat/completions",
    defaultModel: "gpt-4o-mini",
  },
  [AI_PROVIDERS.GEMINI]: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    defaultModel: "gemini-2.0-flash",
  },
  [AI_PROVIDERS.MISTRAL]: {
    baseUrl: "https://api.mistral.ai/v1/chat/completions",
    defaultModel: "mistral-tiny",
  },
  [AI_PROVIDERS.COHERE]: {
    baseUrl: "https://api.cohere.ai/v1/generate",
    defaultModel: "command",
  },
  [AI_PROVIDERS.CLAUDE]: {
    baseUrl: "https://api.anthropic.com/v1/messages",
    defaultModel: "claude-3-sonnet-20240229",
  },
  [AI_PROVIDERS.PERPLEXITY]: {
    baseUrl: "https://api.perplexity.ai/chat/completions",
    defaultModel: "llama-3.1-sonar-small-128k-online",
  },
  [AI_PROVIDERS.TOGETHER]: {
    baseUrl: "https://api.together.xyz/v1/chat/completions",
    defaultModel: "meta-llama/Llama-2-7b-chat-hf",
  },
  [AI_PROVIDERS.GROQ]: {
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    defaultModel: "llama2-70b-4096",
  },
  [AI_PROVIDERS.FIREWORKS]: {
    baseUrl: "https://api.fireworks.ai/inference/v1/chat/completions",
    defaultModel: "accounts/fireworks/models/llama-v2-7b-chat",
  },
  [AI_PROVIDERS.AZUREOPENAI]: {
    baseUrl: "azure",
    defaultModel: "gpt-4o-mini",
  },
  [AI_PROVIDERS.OPENROUTER]: {
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    defaultModel: "openrouter/auto",
  },
  [AI_PROVIDERS.DEEPINFRA]: {
    baseUrl: "https://api.deepinfra.com/v1/openai/chat/completions",
    defaultModel: "meta-llama/Meta-Llama-3-70B-Instruct",
  },
  [AI_PROVIDERS.XAI]: {
    baseUrl: "https://api.x.ai/v1/chat/completions",
    defaultModel: "grok-beta",
  },
  [AI_PROVIDERS.DEEPSEEK]: {
    baseUrl: "https://api.deepseek.com/chat/completions",
    defaultModel: "deepseek-chat",
  },
};

// Ordre de priorité par défaut
export const AI_PROVIDER_PRIORITY = [
  AI_PROVIDERS.OPENAI,
  AI_PROVIDERS.GEMINI,
  AI_PROVIDERS.CLAUDE,
  AI_PROVIDERS.MISTRAL,
  AI_PROVIDERS.PERPLEXITY,
  AI_PROVIDERS.COHERE,
  AI_PROVIDERS.TOGETHER,
  AI_PROVIDERS.GROQ,
  AI_PROVIDERS.FIREWORKS,
  AI_PROVIDERS.AZUREOPENAI,
  AI_PROVIDERS.OPENROUTER,
  AI_PROVIDERS.DEEPINFRA,
  AI_PROVIDERS.XAI,
  AI_PROVIDERS.DEEPSEEK,
];

// Options de génération par défaut
export const DEFAULT_GENERATION_OPTIONS = {
  maxTokens: 1000,
  temperature: 0.7,
  includeHashtags: false,
  includeHooks: false,
  includeCallToAction: false,
};

// Durées de script
export const SCRIPT_DURATION = {
  SHORT: {
    seconds: 30,
    minWords: 75,
    maxWords: 85,
    label: "Court",
  },
  MEDIUM: {
    seconds: 60,
    minWords: 160,
    maxWords: 170,
    label: "Moyen",
  },
  LONG: {
    seconds: 120,
    minWords: 325,
    maxWords: 335,
    label: "Long",
  },
  EXTENDED: {
    seconds: 300,
    minWords: 800,
    maxWords: 850,
    label: "Étendu",
  },
};

/**
 * Convertit une durée en secondes vers un type de durée lisible
 */
export const secondsToDurationType = (
  seconds: number
): "short" | "medium" | "long" => {
  if (seconds <= 30) return "short";
  if (seconds <= 60) return "medium";
  return "long";
};

/**
 * Obtient les fournisseurs d'IA activés (avec clés API configurées)
 */
export const getEnabledProviders = async (): Promise<string[]> => {
  const [
    prefs,
    openAIKey,
    geminiKey,
    mistralKey,
    cohereKey,
    claudeKey,
    perplexityKey,
    togetherKey,
    groqKey,
    fireworksKey,
    azureKey,
    openrouterKey,
    deepinfraKey,
    xaiKey,
    deepseekKey,
  ] = await Promise.all([
    ApiKeyManager.getApiPreference(),
    ApiKeyManager.getOpenAIKey(),
    ApiKeyManager.getGeminiKey(),
    ApiKeyManager.getMistralKey(),
    ApiKeyManager.getCohereKey(),
    ApiKeyManager.getClaudeKey(),
    ApiKeyManager.getPerplexityKey(),
    ApiKeyManager.getTogetherKey(),
    ApiKeyManager.getGroqKey(),
    ApiKeyManager.getFireworksKey(),
    ApiKeyManager.getApiKey("azureopenai"),
    ApiKeyManager.getApiKey("openrouter"),
    ApiKeyManager.getApiKey("deepinfra"),
    ApiKeyManager.getApiKey("xai"),
    ApiKeyManager.getApiKey("deepseek"),
  ]);

  const providers: string[] = [];

  if (openAIKey && prefs.useOpenAI) providers.push(AI_PROVIDERS.OPENAI);
  if (geminiKey && prefs.useGemini) providers.push(AI_PROVIDERS.GEMINI);
  if (mistralKey && prefs.useMistral) providers.push(AI_PROVIDERS.MISTRAL);
  if (cohereKey && prefs.useCohere) providers.push(AI_PROVIDERS.COHERE);
  if (claudeKey && prefs.useClaude) providers.push(AI_PROVIDERS.CLAUDE);
  if (perplexityKey && prefs.usePerplexity)
    providers.push(AI_PROVIDERS.PERPLEXITY);
  if (togetherKey && prefs.useTogether) providers.push(AI_PROVIDERS.TOGETHER);
  if (groqKey && prefs.useGroq) providers.push(AI_PROVIDERS.GROQ);
  if (fireworksKey && prefs.useFireworks)
    providers.push(AI_PROVIDERS.FIREWORKS);
  if (azureKey && (prefs as ApiPreference).useAzureOpenAI)
    providers.push(AI_PROVIDERS.AZUREOPENAI);
  if (openrouterKey && (prefs as ApiPreference).useOpenRouter)
    providers.push(AI_PROVIDERS.OPENROUTER);
  if (deepinfraKey && (prefs as ApiPreference).useDeepInfra)
    providers.push(AI_PROVIDERS.DEEPINFRA);
  if (xaiKey && (prefs as ApiPreference).useXAI)
    providers.push(AI_PROVIDERS.XAI);
  if (deepseekKey && (prefs as ApiPreference).useDeepSeek)
    providers.push(AI_PROVIDERS.DEEPSEEK);

  return providers;
};

/**
 * Sauvegarde l'ordre de priorité des API
 */
export const saveApiPriorityOrder = async (
  order: string[]
): Promise<void> => {};

/**
 * Récupère l'ordre de priorité des API
 */
export const getApiPriorityOrder = async (): Promise<string[]> => {
  // Retourner l'ordre par défaut pour l'instant
  return AI_PROVIDER_PRIORITY;
};
