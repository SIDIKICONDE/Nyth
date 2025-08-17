/**
 * @deprecated Ce fichier est maintenant obsolète.
 * Utilisez le module refactorisé dans src/services/firebase/planning/
 *
 * Pour maintenir la compatibilité, ce fichier réexporte le service principal.
 */

// Réexporter depuis le nouveau module refactorisé
export { getPlanningContextForAI, planningService } from "./planning";
export * from "./planning/types";
