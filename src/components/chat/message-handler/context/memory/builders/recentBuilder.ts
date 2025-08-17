import { loadAIMemory } from "../../../memory";
import { AIMemoryEntry } from "../../../memory/types";
import { getLocalizedTexts } from "../../language";

/**
 * Construit le contexte de mémoire récente
 */
export const buildRecentMemoryContext = async (
  userId: string,
  language: string,
  userName: string,
  days: number = 7
): Promise<string> => {
  const memory = await loadAIMemory(userId);
  const texts = getLocalizedTexts(language);

  if (!memory || memory.entries.length === 0) {
    return texts.noMemory(userName);
  }

  // Filtrer par date récente
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const recentEntries = memory.entries.filter((entry: AIMemoryEntry) => {
    const entryDate = new Date(entry.timestamp);
    return entryDate >= cutoffDate;
  });

  if (recentEntries.length === 0) {
    return language === "fr"
      ? `Aucune information récente mémorisée sur ${
          userName || "l'utilisateur"
        } (${days} derniers jours).`
      : `No recent memorized information about ${
          userName || "the user"
        } (last ${days} days).`;
  }

  let context =
    language === "fr"
      ? `MÉMOIRE RÉCENTE SUR ${
          userName.toUpperCase() || "L'UTILISATEUR"
        } (${days} derniers jours):\n\n`
      : `RECENT MEMORY ABOUT ${
          userName.toUpperCase() || "THE USER"
        } (last ${days} days):\n\n`;

  // Trier par date (plus récent en premier)
  const sortedEntries = recentEntries.sort(
    (a: AIMemoryEntry, b: AIMemoryEntry) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
  );

  sortedEntries.forEach((entry: AIMemoryEntry, index: number) => {
    const date = new Date(entry.timestamp).toLocaleDateString();
    const time = new Date(entry.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    context += `${index + 1}. [${entry.type.toUpperCase()}] ${
      entry.content
    } (${date} ${time})\n`;
  });

  return context + "\n";
};
