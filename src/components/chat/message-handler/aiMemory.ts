/**
 * @deprecated Ce fichier est conservé pour la compatibilité.
 * Utilisez plutôt : import { ... } from './memory'
 *
 * Fichier de mémoire IA refactorisé en modules spécialisés.
 * Voir: ./memory/ pour la nouvelle structure modulaire.
 */

// Re-exports depuis les nouveaux modules pour la compatibilité
export {
  analyzeChatMessage,
  // Analyseurs
  analyzeWithAIDecision,
  cleanCorruptedMemory,
  clearMemory,
  getMemorySize,
  // Batch
  handleBatchMemoryAnalysis,
  hasMemory,
  // Stockage
  loadAIMemory,
  // Résolution de conflits
  resolveMemoryConflicts,
  saveToAIMemory,
  // Test
  testAutoSave,
  type AIDecisionAnalysisResult,
  type AIDecisionConfig,
  type AIMemoryDecision,
  // Types
  type AIMemoryEntry,
  type ConversationMessage,
} from "./memory";

// Import des types et constantes depuis types.ts
export {
  AI_MEMORY_KEY,
  MAX_MEMORY_ENTRIES,
  type AIMemory,
} from "./memory/types";

// Imports pour les fonctions de compatibilité
import { clearMemory as _clearMemory } from "./memory";

/**
 * @deprecated Utilisez clearMemory depuis ./memory
 */
export const clearMemoryLegacy = _clearMemory;
