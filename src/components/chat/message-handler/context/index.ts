/**
 * Module de construction de contexte IA - Exports centralisés
 *
 * Ce module fournit tous les outils nécessaires pour construire
 * des contextes riches et adaptatifs pour les conversations IA.
 */

// Export des types
export type {
  ContextBuilderOptions,
  ContextResult,
  ContextSection,
  FullContextOptions,
  LanguageInstructions,
  MemoryContextConfig,
  ScriptMetadata,
  ScriptsContextConfig,
  SectionConfig,
  SectionsConfig,
  UserContextConfig,
  UserProfile,
} from "./types";

// Export des fonctions principales
export {
  buildContextualPrompt,
  buildFullContextWithMetadata,
  buildMemoryContext,
  buildScriptsContext,
  getUserLanguage,
} from "./contextBuilder";

// Export des fonctions de contexte minimal
export {
  buildAdaptiveMinimalContext,
  buildFocusedMinimalContext,
  buildMinimalContext,
  buildUltraMinimalContext,
} from "./minimalContextBuilder";

// Export des fonctions de contexte adaptatif
export {
  buildAdaptiveContext,
  buildOptimizedContext,
  buildSmartAdaptiveContext,
} from "./adaptiveContextBuilder";

// Export des fonctions de contexte spécialisé
export {
  buildCreativeContext,
  buildFollowUpContext,
  buildScriptAnalysisContext,
  buildSpecializedContext,
} from "./specializedContextBuilder";

// Export des fonctions d'optimisation
export {
  estimateTokens,
  exceedsTokenLimit,
  optimizeContext,
  progressiveOptimization,
  truncateToTokenLimit,
} from "./contextOptimizer";

// Export des fonctions d'assemblage
export {
  assembleMinimalSections,
  assembleSections,
  buildAllContextSections,
  createContextMetadata,
} from "./contextAssembler";

// Export des constantes et configurations
export { DEFAULT_MEMORY_CONFIG } from "./memoryContext";
export { DEFAULT_SCRIPTS_CONFIG } from "./scriptsContext";
export { DEFAULT_USER_CONFIG } from "./userProfile";

// Export des fonctions utilitaires
export { getLanguageInstruction, getLocalizedTexts } from "./language";
