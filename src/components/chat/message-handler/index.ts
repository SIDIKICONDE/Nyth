/**
 * @fileoverview Point d'entrée principal du module message-handler
 * Exporte toutes les fonctions et types nécessaires
 */

// Processeur principal
export { processMessage } from "./messageProcessor";

// Composant principal
export { default as MessageHandler } from "./MessageHandler";

// Modules spécialisés
export {
  ERROR_MESSAGES,
  ErrorType,
  categorizeError,
  formatErrorMessage,
  handleMessageProcessingError,
} from "./errorHandler";
export {
  processFunctionCall,
  processFunctionCalls,
} from "./functionCallHandler";
export {
  INTENT_KEYWORDS,
  analyzeIntent,
  needsFunctionCalling,
} from "./intentAnalyzer";
export { getWelcomePromptByLanguage } from "./welcomeHandler";

// Types
export type { PlanningCommandResult, ProcessMessageOptions } from "./types";

// Utilitaires
export { sanitizeContent } from "./utils/sanitizer";

// Contexte et mémoire
export { buildContextualPrompt } from "./context/contextBuilder";
