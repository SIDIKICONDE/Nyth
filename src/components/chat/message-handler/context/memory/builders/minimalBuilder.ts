import { loadAIMemory } from "../../../memory";
import { AIMemoryEntry } from "../../../memory/types";
import { getLocalizedTexts } from "../../language";

/**
 * Construit un contexte de mémoire minimal
 */
export const buildMinimalMemoryContext = async (
  userId: string,
  language: string,
  userName: string,
  maxEntries: number = 5
): Promise<string> => {
  const memory = await loadAIMemory(userId);
  const texts = getLocalizedTexts(language);

  if (!memory || memory.entries.length === 0) {
    return texts.noMemory(userName);
  }

  // Prendre seulement les entrées les plus importantes
  const importantEntries = memory.entries
    .filter((e: AIMemoryEntry) => e.importance === "high")
    .slice(0, maxEntries);

  if (importantEntries.length === 0) {
    return texts.noMemory(userName);
  }

  let context =
    language === "fr"
      ? `MÉMOIRE ESSENTIELLE SUR ${
          userName.toUpperCase() || "L'UTILISATEUR"
        }:\n`
      : `ESSENTIAL MEMORY ABOUT ${userName.toUpperCase() || "THE USER"}:\n`;

  importantEntries.forEach((entry: AIMemoryEntry, index: number) => {
    context += `${index + 1}. ${entry.content}\n`;
  });

  return context + "\n";
};
