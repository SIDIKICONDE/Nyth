/**
 * Types et interfaces pour l'analyseur de mémoire IA
 */

// Constantes
export const AI_MEMORY_KEY = "ai_memory";
export const MAX_MEMORY_ENTRIES = 50;

export interface AIMemoryEntry {
  type:
    | "preference"
    | "fact"
    | "instruction"
    | "goal"
    | "skill"
    | "problem"
    | "habit"
    | "context";
  content: string;
  importance: "high" | "medium" | "low";
  timestamp: string;
  // Champs optionnels pour RAG léger / citations
  id?: string;
  embedding?: number[];
  subject?: string;
}

export interface AIMemory {
  userId: string;
  entries: AIMemoryEntry[];
  lastUpdated: string;
}

export interface AIMemoryDecision {
  shouldMemorize: boolean;
  type?: AIMemoryEntry["type"];
  content?: string;
  importance?: AIMemoryEntry["importance"];
  reason?: string;
  // Propriétés pour la gestion des conflits
  conflictDetected?: boolean;
  conflictResolution?: "replace" | "merge" | "keep_both" | "delete_old";
  conflictingEntries?: number[]; // Index des entrées en conflit
}

export interface AIDecisionAnalysisResult {
  success: boolean;
  method: "ai-decision" | "disabled" | "error";
  decision?: AIMemoryDecision;
  error?: string;
}

export interface AIDecisionConfig {
  enabled: boolean;
  includeContext: boolean;
  maxContextMessages: number;
}

export interface ConversationMessage {
  role: string;
  content: string;
}

// Types pour l'analyse d'ambiguïté
export interface AmbiguityResult {
  hasAmbiguity: boolean;
  ambiguityType: "preference" | "instruction" | "context" | "none";
  confidence: number;
  suggestions: string[];
  reason: string;
}

// Types pour l'analyse de mémoire
export interface MemoryAnalysisResult {
  success: boolean;
  method: "pattern" | "ai" | "hybrid" | "disabled";
  extractedInfo?: {
    type: AIMemoryEntry["type"];
    content: string;
    importance: AIMemoryEntry["importance"];
    confidence: number;
  };
  error?: string;
}

// Types pour le debug
export interface MemoryDebugInfo {
  totalEntries: number;
  entriesByType: { [key: string]: number };
  entriesByImportance: { [key: string]: number };
  averageAge: number;
  oldestEntry?: string;
  newestEntry?: string;
}
