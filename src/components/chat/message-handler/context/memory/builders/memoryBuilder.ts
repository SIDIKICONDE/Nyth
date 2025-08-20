import { loadAIMemory } from "../../../memory";
import { AIMemoryEntry } from "../../../memory/types";
import { getLocalizedTexts } from "../../language";
import { MemoryContextConfig } from "../../types";
import { DEFAULT_MEMORY_CONFIG } from "../config";
import { consolidateMemoryEntries } from "../consolidation";

/**
 * Construit le contexte de mémoire pour l'IA avec consolidation
 */
export const buildMemoryContext = async (
  userId: string,
  language: string,
  userName: string,
  config: MemoryContextConfig = DEFAULT_MEMORY_CONFIG
): Promise<string> => {
  const memory = await loadAIMemory(userId);
  const texts = getLocalizedTexts(language);

  if (!memory || memory.entries.length === 0) {
    return texts.noMemory(userName);
  }

  // Consolider les entrées pour éviter les conflits
  const consolidatedEntries = consolidateMemoryEntries(memory.entries);

  let context = texts.memoryHeader(userName) + "\n\n";

  // Ajouter une note sur la consolidation si des conflits ont été résolus
  if (consolidatedEntries.length < memory.entries.length) {
    context +=
      language === "fr"
        ? "Note: Les informations ont été consolidées pour refléter les préférences les plus récentes.\n\n"
        : "Note: Information has been consolidated to reflect the most recent preferences.\n\n";
  }

  if (config.groupByImportance) {
    // Grouper par catégorie et importance
    const highImportance = consolidatedEntries
      .filter((e: AIMemoryEntry) => e.importance === "high")
      .slice(0, config.maxEntriesHigh);
    const mediumImportance = consolidatedEntries
      .filter((e: AIMemoryEntry) => e.importance === "medium")
      .slice(0, config.maxEntriesMedium);
    const lowImportance = consolidatedEntries
      .filter((e: AIMemoryEntry) => e.importance === "low")
      .slice(0, config.maxEntriesLow);

    const addEntries = (entries: AIMemoryEntry[], title: string) => {
      if (entries.length > 0) {
        context += `${title}:\n`;
        entries.forEach((entry: AIMemoryEntry, index: number) => {
          const timestamp = config.includeTimestamps
            ? ` (${new Date(entry.timestamp).toLocaleDateString()})`
            : "";
          context += `${index + 1}. [${entry.type.toUpperCase()}] ${
            entry.content
          }${timestamp}\n`;
        });
        context += "\n";
      }
    };

    addEntries(highImportance, texts.memoryImportance.high);
    addEntries(mediumImportance, texts.memoryImportance.medium);
    addEntries(lowImportance, texts.memoryImportance.low);
  } else {
    // Affichage simple par ordre d'importance
    const sortedEntries = consolidatedEntries
      .sort((a: AIMemoryEntry, b: AIMemoryEntry) => {
        const importanceOrder: { [key: string]: number } = {
          high: 3,
          medium: 2,
          low: 1,
        };
        return importanceOrder[b.importance] - importanceOrder[a.importance];
      })
      .slice(
        0,
        config.maxEntriesHigh + config.maxEntriesMedium + config.maxEntriesLow
      );

    sortedEntries.forEach((entry: AIMemoryEntry, index: number) => {
      const timestamp = config.includeTimestamps
        ? ` (${new Date(entry.timestamp).toLocaleDateString()})`
        : "";
      context += `${index + 1}. [${entry.type.toUpperCase()}] ${
        entry.content
      }${timestamp}\n`;
    });
    context += "\n";
  }

  context += texts.memoryInstructions;

  return context;
};
