/**
 * Configuration des fournisseurs d'IA pour les tests
 */

export const AI_PROVIDERS = {
  OPENAI: "OPENAI",
  GEMINI: "GEMINI",
  MISTRAL: "MISTRAL",
  CLAUDE: "CLAUDE",
  COHERE: "COHERE",
  PERPLEXITY: "PERPLEXITY",
  TOGETHER: "TOGETHER",
  GROQ: "GROQ",
  FIREWORKS: "FIREWORKS",
} as const;

export const getEnabledProviders = async (): Promise<string[]> => {
  // Pour les tests, retourner tous les providers
  return Object.values(AI_PROVIDERS);
};

// Script duration configurations
export const SCRIPT_DURATION = {
  SHORT: {
    seconds: 30,
    minWords: 60,
    maxWords: 90,
  },
  MEDIUM: {
    seconds: 60,
    minWords: 120,
    maxWords: 180,
  },
  LONG: {
    seconds: 120,
    minWords: 240,
    maxWords: 360,
  },
} as const;

export const secondsToDurationType = (seconds: number): string => {
  if (seconds <= SCRIPT_DURATION.SHORT.seconds) return "court";
  if (seconds <= SCRIPT_DURATION.MEDIUM.seconds) return "moyen";
  return "long";
};