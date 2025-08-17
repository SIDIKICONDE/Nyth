import { MemoryContextConfig } from "../types";

/**
 * Configuration par défaut pour le contexte de mémoire
 */
export const DEFAULT_MEMORY_CONFIG: MemoryContextConfig = {
  maxEntriesHigh: 10,
  maxEntriesMedium: 8,
  maxEntriesLow: 5,
  includeTimestamps: true,
  groupByImportance: true,
};

/**
 * Labels localisés pour les types de mémoire
 */
export const MEMORY_TYPE_LABELS: { [key: string]: { fr: string; en: string } } =
  {
    preference: { fr: "Préférences", en: "Preferences" },
    instruction: { fr: "Instructions", en: "Instructions" },
    fact: { fr: "Faits personnels", en: "Personal facts" },
    habit: { fr: "Habitudes", en: "Habits" },
    goal: { fr: "Objectifs", en: "Goals" },
    skill: { fr: "Compétences", en: "Skills" },
    problem: { fr: "Problèmes", en: "Problems" },
    context: { fr: "Contexte", en: "Context" },
  };
