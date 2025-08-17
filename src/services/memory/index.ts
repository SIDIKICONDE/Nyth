// Import des classes et types pour usage local
import { MemoryManager, type MemoryEntry } from "./MemoryManager";
import { CitationManager } from "./CitationManager";
import { MigrationService } from "./MigrationService";
import { useUnifiedMemory } from "../../hooks/useUnifiedMemory";

// Export des services principaux
export { memoryManager, MemoryManager } from "./MemoryManager";
export type {
  MemoryEntry,
  MemoryCollection,
  MemoryConflict,
} from "./MemoryManager";

export { citationManager, CitationManager } from "./CitationManager";
export type { CitationContext, MemoryUsage } from "./CitationManager";

export { migrationService, MigrationService } from "./MigrationService";
export type { MigrationStatus, LegacySystemData } from "./MigrationService";

// Export du hook unifié
export { useUnifiedMemory } from "../../hooks/useUnifiedMemory";
export type {
  UnifiedMemoryState,
  UnifiedMemoryActions,
} from "../../hooks/useUnifiedMemory";

// Constantes et utilitaires
export const MEMORY_CATEGORIES = [
  "preference",
  "rule",
  "context",
  "correction",
  "fact",
] as const;
export const MEMORY_IMPORTANCE_LEVELS = ["high", "medium", "low"] as const;

// Helpers utilitaires
export const MemoryUtils = {
  /**
   * Valide qu'une catégorie est valide
   */
  isValidCategory: (category: string): category is MemoryEntry["category"] => {
    return MEMORY_CATEGORIES.includes(category as any);
  },

  /**
   * Valide qu'un niveau d'importance est valide
   */
  isValidImportance: (
    importance: string
  ): importance is MemoryEntry["importance"] => {
    return MEMORY_IMPORTANCE_LEVELS.includes(importance as any);
  },

  /**
   * Génère des tags automatiques basés sur le contenu
   */
  generateAutoTags: (
    title: string,
    content: string,
    category: MemoryEntry["category"]
  ): string[] => {
    const tags: string[] = [category];

    // Tags basés sur la catégorie
    switch (category) {
      case "preference":
        tags.push("user-setting", "config");
        break;
      case "rule":
        tags.push("constraint", "requirement");
        break;
      case "context":
        tags.push("project", "background");
        break;
      case "correction":
        tags.push("fix", "update");
        break;
      case "fact":
        tags.push("information", "knowledge");
        break;
    }

    // Tags basés sur le contenu
    const contentLower = `${title} ${content}`.toLowerCase();

    if (contentLower.includes("theme") || contentLower.includes("couleur")) {
      tags.push("ui", "appearance");
    }
    if (contentLower.includes("langue") || contentLower.includes("language")) {
      tags.push("i18n", "locale");
    }
    if (
      contentLower.includes("recording") ||
      contentLower.includes("enregistrement")
    ) {
      tags.push("recording", "video");
    }
    if (
      contentLower.includes("chat") ||
      contentLower.includes("conversation")
    ) {
      tags.push("chat", "ai");
    }
    if (
      contentLower.includes("security") ||
      contentLower.includes("sécurité")
    ) {
      tags.push("security", "auth");
    }

    return [...new Set(tags)]; // Éviter les doublons
  },

  /**
   * Formate une citation pour affichage
   */
  formatCitation: (memoryId: string, memoryTitle?: string): string => {
    return memoryTitle ? `[Source: ${memoryTitle}]` : `[[memory:${memoryId}]]`;
  },

  /**
   * Extrait les mots-clés d'un texte pour recherche
   */
  extractKeywords: (text: string): string[] => {
    const stopWords = [
      "le",
      "la",
      "les",
      "un",
      "une",
      "des",
      "de",
      "du",
      "et",
      "ou",
      "mais",
      "donc",
      "car",
      "ni",
      "or",
    ];

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.includes(word))
      .slice(0, 10);
  },

  /**
   * Calcule un score de pertinence pour une recherche
   */
  calculateRelevanceScore: (
    memory: MemoryEntry,
    searchQuery: string
  ): number => {
    const query = searchQuery.toLowerCase();
    const title = memory.title.toLowerCase();
    const content = memory.content.toLowerCase();
    const tags = memory.tags?.join(" ").toLowerCase() || "";

    let score = 0;

    // Score titre (poids max)
    if (title.includes(query)) score += 100;
    if (title.startsWith(query)) score += 50;

    // Score contenu
    const contentMatches = (content.match(new RegExp(query, "g")) || []).length;
    score += contentMatches * 20;

    // Score tags
    if (tags.includes(query)) score += 30;

    // Bonus importance
    switch (memory.importance) {
      case "high":
        score += 15;
        break;
      case "medium":
        score += 10;
        break;
      case "low":
        score += 5;
        break;
    }

    return score;
  },
};

// Instances des services
const memoryManagerInstance = MemoryManager.getInstance();
const citationManagerInstance = CitationManager.getInstance();
const migrationServiceInstance = MigrationService.getInstance();

// Export global pour faciliter l'utilisation
export default {
  memoryManager: memoryManagerInstance,
  citationManager: citationManagerInstance,
  migrationService: migrationServiceInstance,
  useUnifiedMemory,
  MemoryUtils,
};
