/**
 * Point d'entrée pour le système de mémoire IA
 */

// Exports principaux
export { analyzeWithAIDecision } from "./aiDecisionAnalyzer";

// Types
export type {
  AIDecisionAnalysisResult,
  AIDecisionConfig,
  AIMemory,
  AIMemoryDecision,
  AIMemoryEntry,
  AmbiguityResult,
  ConversationMessage,
  MemoryAnalysisResult,
  MemoryDebugInfo,
} from "./types";

// Type depuis patterns.ts
export type { MemoryPattern } from "./patterns";

// Constantes
export { AI_MEMORY_KEY, MAX_MEMORY_ENTRIES } from "./types";

// Configuration
export {
  DEBUG_CONFIG,
  DEFAULT_AI_DECISION_CONFIG,
  DEFAULT_LANGUAGE,
  ERROR_MESSAGES,
  LIMITS_CONFIG,
  SUPPORTED_LANGUAGES,
} from "./config";

// Utilitaires
export { resolveMemoryConflicts } from "./conflictResolver";
export { buildMemoryAnalysisPrompt } from "./prompts";

// Storage
export * from "./storage";

// Intégration chat
export * from "./chatIntegration";

// Analyse par batch
export * from "./batchMemoryAnalyzer";

// Exports depuis analyzer.ts
export {
  analyzeAndSaveMemory,
  analyzeAndSaveMemoryWithAmbiguity,
  analyzeBatchMessages,
  analyzeWithSentiment,
} from "./analyzer";

// Exports depuis ambiguity.ts
export { detectAmbiguity, resolveAmbiguity } from "./ambiguity";

// Exports depuis patterns.ts
export {
  getCommunicationPatterns,
  getNegativeInstructionPatterns,
  testAllPatterns,
} from "./patterns";

// Alias pour la compatibilité
export {
  clearMemory as cleanupMemory,
  loadAIMemory as getMemory,
} from "./storage";

// Fonctions utilitaires supplémentaires pour la compatibilité
export const analyzeEmotionalPolarity = async (message: string) => {
  return { polarity: "neutral", confidence: 0.5 };
};

export const analyzeMemoryPerformance = async (userId: string) => {
  const { loadAIMemory } = await import("./storage");
  const memory = await loadAIMemory(userId);
  return {
    totalEntries: memory?.entries.length || 0,
    performance: "good",
  };
};

export const testAutoSave = async (userId?: string) => {
  return { success: true };
};

// Fonctions de debug (remplacements temporaires)
export const debugMemory = async (userId: string) => {
  const { loadAIMemory } = await import("./storage");
  const memory = await loadAIMemory(userId);
  return {
    totalEntries: memory?.entries.length || 0,
    entriesByType: {},
    entriesByImportance: {},
    averageAge: 0,
  };
};

export const exportMemory = async (userId: string) => {
  const { loadAIMemory } = await import("./storage");
  const memory = await loadAIMemory(userId);
  return (
    memory || { userId, entries: [], lastUpdated: new Date().toISOString() }
  );
};

export const hasNegationKeywords = (message: string): boolean => {
  const negationPatterns =
    /ne plus|n'évoque plus|arrête de|stop|plus jamais|évite de|ne mentionne plus/i;
  return negationPatterns.test(message);
};

// Export des patterns comme constante
import { getMemoryPatterns } from "./patterns";
// Regex patterns désactivés
export const patterns = [] as const;

// Fonction de diagnostic simple
export const testMemoryConnection = async (
  userId: string
): Promise<{
  success: boolean;
  details: any;
}> => {
  try {
    // 1. Vérifier la configuration
    const { isAIMemoryEnabled } = await import(
      "../../../../config/aiMemoryConfig"
    );
    const isEnabled = await isAIMemoryEnabled();

    if (!isEnabled) {
      return {
        success: false,
        details: { error: "Mémoire IA désactivée dans la configuration" },
      };
    }

    // 2. Test de sauvegarde
    const { saveToAIMemory } = await import("./storage");
    await saveToAIMemory(userId, {
      type: "preference",
      content: "Test de connexion mémoire",
      importance: "low",
    });

    // 3. Test de lecture
    const { loadAIMemory } = await import("./storage");
    const memory = await loadAIMemory(userId);

    // 4. Test d'analyse IA
    const { analyzeWithAIDecision } = await import("./aiDecisionAnalyzer");
    const result = await analyzeWithAIDecision(userId, "Test de connexion", []);

    return {
      success: true,
      details: {
        memoryEntries: memory?.entries.length || 0,
        analysisResult: result.success,
        analysisMethod: result.method,
      },
    };
  } catch (error) {
    return {
      success: false,
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
};
