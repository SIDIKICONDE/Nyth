/**
 * Configuration pour le système de mémoire AI
 */

export const MEMORY_CITATIONS_ENABLED = true;

export const isMemoryCitationsEnabled = async (): Promise<boolean> => {
  return MEMORY_CITATIONS_ENABLED;
};

export interface AIMemoryConfig {
  enabled: boolean;
  analysisMode: "ai-decision" | "regex" | "mistral" | "batch";
  maxEntries: number;
  autoCleanup: boolean;
}

export const DEFAULT_AI_MEMORY_CONFIG: AIMemoryConfig = {
  enabled: true,
  analysisMode: "ai-decision",
  maxEntries: 50,
  autoCleanup: true,
};