// Configuration et constantes
export { DEFAULT_MEMORY_CONFIG, MEMORY_TYPE_LABELS } from "./config";

// Utilitaires
export { getTypeLabel, identifyPreferenceSubject } from "./utils";

// Consolidation
export { consolidateMemoryEntries } from "./consolidation";

// Builders
export {
  buildMemoryContext,
  buildMemoryContextByType,
  buildMinimalMemoryContext,
  buildRecentMemoryContext,
} from "./builders";

// Statistiques
export { buildMemoryStatsContext } from "./stats";

// Recherche
export { buildMemorySearchContext, searchInMemory } from "./search";
export type { MemorySearchOptions } from "./search";
