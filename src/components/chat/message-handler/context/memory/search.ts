import { loadAIMemory } from "../../memory";
import { AIMemoryEntry } from "../../memory/types";
import { getTypeLabel } from "./utils";
import { embeddingService } from "../../../../../services/embedding/EmbeddingService";

/**
 * Options de recherche dans la mémoire
 */
export interface MemorySearchOptions {
  caseSensitive?: boolean;
  searchInType?: boolean;
  maxResults?: number;
  importanceFilter?: ("high" | "medium" | "low")[];
  importance?: "high" | "medium" | "low";
  semantic?: boolean; // active la recherche sémantique
  minScore?: number;
}

/**
 * Recherche dans la mémoire par mots-clés et/ou similarité
 */
export const searchInMemory = async (
  userId: string,
  searchTerm: string,
  options: MemorySearchOptions = {}
): Promise<AIMemoryEntry[]> => {
  const memory = await loadAIMemory(userId);

  if (!memory || memory.entries.length === 0) {
    return [];
  }

  const {
    caseSensitive = false,
    searchInType = true,
    maxResults = 10,
    importanceFilter = [],
    importance,
    semantic = true,
    minScore = 0.3,
  } = options;

  const term = caseSensitive ? searchTerm : searchTerm.toLowerCase();

  let filteredEntries = memory.entries;

  // Filtrer par importance si spécifié
  if (importanceFilter.length > 0) {
    filteredEntries = filteredEntries.filter((entry: AIMemoryEntry) =>
      importanceFilter.includes(entry.importance)
    );
  }

  // Filtrer par importance si spécifiée
  if (importance) {
    filteredEntries = filteredEntries.filter(
      (entry: AIMemoryEntry) => entry.importance === importance
    );
  }

  // Essayer la recherche sémantique si activée
  if (semantic) {
    try {
      const q = await embeddingService.embedText(searchTerm);
      if (q && q.length > 0) {
        const candidates = filteredEntries as (AIMemoryEntry & {
          embedding?: number[];
        })[];
        const scored = candidates
          .filter((e) => Array.isArray((e as any).embedding) && (e as any).embedding.length > 0)
          .map((e) => ({
            entry: e,
            score: embeddingService.cosineSimilarity(
              q as number[],
              (e as any).embedding as number[]
            ),
          }))
          .filter((s) => s.score >= minScore)
          .sort((a, b) => b.score - a.score)
          .slice(0, maxResults)
          .map((s) => s.entry as AIMemoryEntry);

        if (scored.length > 0) {
          return scored;
        }
      }
    } catch {
      // Silent fallback to keyword search
    }
  }

  // Fallback: Recherche par contenu et type (mots-clés)
  const results = filteredEntries.filter((entry: AIMemoryEntry) => {
    const content = caseSensitive ? entry.content : entry.content.toLowerCase();
    const contentMatch = content.includes(term);

    let typeMatch = false;
    if (searchInType) {
      const type = caseSensitive ? entry.type : entry.type.toLowerCase();
      typeMatch = type.includes(term);
    }

    return contentMatch || typeMatch;
  });

  return results.slice(0, maxResults);
};

/**
 * Construit le contexte de résultats de recherche en mémoire
 */
export const buildMemorySearchContext = async (
  userId: string,
  searchTerm: string,
  language: string,
  userName: string
): Promise<string> => {
  const results = await searchInMemory(userId, searchTerm);

  if (results.length === 0) {
    return language === "fr"
      ? `Aucun souvenir trouvé pour "${searchTerm}".\n`
      : `No memories found for "${searchTerm}".\n`;
  }

  let context =
    language === "fr"
      ? `SOUVENIRS TROUVÉS POUR "${searchTerm}" (${results.length} résultat${
          results.length > 1 ? "s" : ""
        }):\n\n`
      : `MEMORIES FOUND FOR "${searchTerm}" (${results.length} result${
          results.length > 1 ? "s" : ""
        }):\n\n`;

  results.forEach((entry, index) => {
    const date = new Date(entry.timestamp).toLocaleDateString();
    const typeLabel = getTypeLabel(entry.type, language);
    context += `${index + 1}. [${typeLabel.toUpperCase()}] ${
      entry.content
    } (${date})\n`;
  });

  return context + "\n";
};
