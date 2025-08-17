/**
 * Configuration pour l'analyseur de décision IA
 */

import { AIDecisionConfig } from "./types";

/**
 * Configuration par défaut pour l'analyse par IA
 */
export const DEFAULT_AI_DECISION_CONFIG: AIDecisionConfig = {
  enabled: true,
  includeContext: true,
  maxContextMessages: 6,
};

/**
 * Configuration des logs pour le debug
 */
export const DEBUG_CONFIG = {
  enableConflictLogs: true,
  enableAnalysisLogs: true,
  enableMemoryLogs: true,
} as const;

/**
 * Configuration des timeouts et limites
 */
export const LIMITS_CONFIG = {
  maxPromptLength: 4000,
  maxMemoryEntries: 50,
  analysisTimeout: 30000, // 30 secondes
} as const;

/**
 * Messages d'erreur standardisés
 */
export const ERROR_MESSAGES = {
  MEMORY_DISABLED: "Mémoire IA désactivée",
  PARSING_ERROR: "Impossible de parser la décision de l'IA",
  UNKNOWN_ERROR: "Erreur inconnue",
  TIMEOUT_ERROR: "Timeout lors de l'analyse",
  INVALID_RESPONSE: "Réponse IA invalide",
} as const;

/**
 * Configuration des langues supportées
 */
export const SUPPORTED_LANGUAGES = ["fr", "en"] as const;

/**
 * Configuration par défaut de la langue
 */
export const DEFAULT_LANGUAGE = "fr" as const;
