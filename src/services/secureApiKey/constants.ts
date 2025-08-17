// Configuration et constantes
export const KEYCHAIN_SERVICE = "NAYA_AI_APIKeys";
export const ENCRYPTION_KEY = "NAYA_Secure_Key"; // En production, générer dynamiquement
export const API_KEY_EXPIRY_DAYS = 90; // Expiration après 90 jours

// Providers supportés
export const SUPPORTED_PROVIDERS = [
  "openai",
  "gemini",
  "mistral",
  "cohere",
  "claude",
  "perplexity",
  "together",
  "groq",
  "fireworks",
  "azureopenai",
  "openrouter",
  "deepinfra",
  "xai",
  "deepseek",
] as const;

// Configuration de migration
export const MIGRATION_MAPPINGS = [
  { old: "openai_api_key", provider: "openai" },
  { old: "gemini_api_key", provider: "gemini" },
  { old: "mistral_api_key", provider: "mistral" },
  { old: "cohere_api_key", provider: "cohere" },
  { old: "claude_api_key", provider: "claude" },
  { old: "perplexity_api_key", provider: "perplexity" },
  { old: "together_api_key", provider: "together" },
  { old: "groq_api_key", provider: "groq" },
  { old: "fireworks_api_key", provider: "fireworks" },
  { old: "azureopenai_api_key", provider: "azureopenai" },
  { old: "openrouter_api_key", provider: "openrouter" },
  { old: "deepinfra_api_key", provider: "deepinfra" },
  { old: "xai_api_key", provider: "xai" },
  { old: "deepseek_api_key", provider: "deepseek" },
] as const;
