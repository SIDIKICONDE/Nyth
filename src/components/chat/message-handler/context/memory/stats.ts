import { loadAIMemory } from "../../memory";
import { AIMemoryEntry } from "../../memory/types";

/**
 * Calcule les statistiques de la mémoire
 */
export const getMemoryStats = async (userId: string) => {
  const memory = await loadAIMemory(userId);

  if (!memory || memory.entries.length === 0) {
    return {
      totalEntries: 0,
      byImportance: { high: 0, medium: 0, low: 0 },
      byType: {},
      averageAge: 0,
      oldestEntry: null,
      newestEntry: null,
    };
  }

  const totalEntries = memory.entries.length;

  // Distribution par importance
  const importanceDistribution = {
    high: memory.entries.filter((e: AIMemoryEntry) => e.importance === "high")
      .length,
    medium: memory.entries.filter(
      (e: AIMemoryEntry) => e.importance === "medium"
    ).length,
    low: memory.entries.filter((e: AIMemoryEntry) => e.importance === "low")
      .length,
  };

  // Distribution par type
  const typeDistribution: { [key: string]: number } = {};
  memory.entries.forEach((entry: AIMemoryEntry) => {
    if (!typeDistribution[entry.type]) {
      typeDistribution[entry.type] = 0;
    }
    typeDistribution[entry.type]++;
  });

  // Calcul de l'âge moyen
  const now = new Date().getTime();
  const ages = memory.entries.map((entry: AIMemoryEntry) => {
    return now - new Date(entry.timestamp).getTime();
  });
  const averageAge =
    ages.reduce((sum: number, age: number) => sum + age, 0) / ages.length;

  return {
    totalEntries,
    byImportance: importanceDistribution,
    byType: typeDistribution,
    averageAge: Math.round(averageAge / (1000 * 60 * 60 * 24)), // en jours
    oldestEntry:
      memory.entries.length > 0
        ? memory.entries[memory.entries.length - 1]
        : null,
    newestEntry: memory.entries.length > 0 ? memory.entries[0] : null,
  };
};

/**
 * Construit le contexte de statistiques de mémoire
 */
export const buildMemoryStatsContext = async (
  userId: string,
  language: string,
  userName: string
): Promise<string> => {
  const stats = await getMemoryStats(userId);

  if (stats.totalEntries === 0) {
    return language === "fr"
      ? `Aucune statistique de mémoire disponible pour ${
          userName || "l'utilisateur"
        }.\n`
      : `No memory statistics available for ${userName || "the user"}.\n`;
  }

  let context =
    language === "fr"
      ? `STATISTIQUES MÉMOIRE POUR ${
          userName.toUpperCase() || "L'UTILISATEUR"
        }:\n\n`
      : `MEMORY STATISTICS FOR ${userName.toUpperCase() || "THE USER"}:\n\n`;

  // Statistiques générales
  context +=
    language === "fr"
      ? `📊 Total: ${stats.totalEntries} souvenirs\n`
      : `📊 Total: ${stats.totalEntries} memories\n`;

  // Par importance
  const importanceLabels =
    language === "fr"
      ? { high: "Haute", medium: "Moyenne", low: "Faible" }
      : { high: "High", medium: "Medium", low: "Low" };

  context += language === "fr" ? "🎯 Par importance:\n" : "🎯 By importance:\n";
  Object.entries(stats.byImportance).forEach(([importance, count]) => {
    const label = importanceLabels[importance as keyof typeof importanceLabels];
    context += `   ${label}: ${count}\n`;
  });

  // Par type
  if (Object.keys(stats.byType).length > 0) {
    context += language === "fr" ? "📂 Par type:\n" : "📂 By type:\n";
    Object.entries(stats.byType).forEach(([type, count]) => {
      context += `   ${type}: ${count}\n`;
    });
  }

  return context + "\n";
};
