/**
 * FICHIER DE COMPATIBILITÉ - contextBuilder.ts
 *
 * Ce fichier maintient la compatibilité avec l'ancien système tout en
 * redirigeant vers les nouveaux modules refactorisés dans le dossier context/.
 *
 * ⚠️  DÉPRÉCIÉ : Utilisez directement les modules dans context/ pour les nouveaux développements.
 */

// Re-exports depuis les nouveaux modules pour maintenir la compatibilité
export {
  buildAdaptiveContext,
  buildContextualPrompt,
  buildMinimalContext,
  buildSpecializedContext,
  getUserLanguage,
} from "./context";

// Fonctions legacy maintenues pour compatibilité
export { buildMemoryContext, buildScriptsContext } from "./context";

// Types re-exportés pour compatibilité
export type {
  ContextBuilderOptions,
  ContextResult,
  FullContextOptions,
} from "./context";

// Import pour la fonction legacy
import { buildContextualPrompt } from "./context";

/**
 * @deprecated Utilisez buildContextualPrompt depuis ./context à la place
 */
export const buildContextualPromptLegacy = buildContextualPrompt;
