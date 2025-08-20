import { loadAIMemory } from "../../../memory";
import { AIMemoryEntry } from "../../../memory/types";
import { getLocalizedTexts } from "../../language";
import { getTypeLabel } from "../utils";

/**
 * Construit le contexte de mémoire par type
 */
export const buildMemoryContextByType = async (
  userId: string,
  language: string,
  userName: string,
  types: string[] = []
): Promise<string> => {
  const memory = await loadAIMemory(userId);
  const texts = getLocalizedTexts(language);

  if (!memory || memory.entries.length === 0) {
    return texts.noMemory(userName);
  }

  // Filtrer par types si spécifié
  let filteredEntries = memory.entries;
  if (types.length > 0) {
    filteredEntries = memory.entries.filter((e: AIMemoryEntry) =>
      types.includes(e.type)
    );
  }

  if (filteredEntries.length === 0) {
    return language === "fr"
      ? `Aucune information mémorisée de type ${types.join(", ")} sur ${
          userName || "l'utilisateur"
        }.`
      : `No memorized information of type ${types.join(", ")} about ${
          userName || "the user"
        }.`;
  }

  let context =
    language === "fr"
      ? `MÉMOIRE SPÉCIALISÉE SUR ${
          userName.toUpperCase() || "L'UTILISATEUR"
        }:\n\n`
      : `SPECIALIZED MEMORY ABOUT ${userName.toUpperCase() || "THE USER"}:\n\n`;

  // Grouper par type
  const entriesByType: { [key: string]: AIMemoryEntry[] } = {};
  filteredEntries.forEach((entry: AIMemoryEntry) => {
    if (!entriesByType[entry.type]) {
      entriesByType[entry.type] = [];
    }
    entriesByType[entry.type].push(entry);
  });

  // Afficher par type
  Object.entries(entriesByType).forEach(([type, entries]) => {
    const typeLabel =
      language === "fr" ? getTypeLabel(type, "fr") : getTypeLabel(type, "en");

    context += `${typeLabel.toUpperCase()}:\n`;
    entries.forEach((entry: AIMemoryEntry, index: number) => {
      const date = new Date(entry.timestamp).toLocaleDateString();
      context += `${index + 1}. ${entry.content} (${date})\n`;
    });
    context += "\n";
  });

  return context;
};
