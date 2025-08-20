import { identifyPreferenceSubject } from "./utils";

/**
 * Nettoie et consolide les entrées de mémoire pour éviter les conflits
 */
export const consolidateMemoryEntries = (entries: any[]): any[] => {
  const consolidatedMap = new Map();

  // Grouper par type et identifier les conflits potentiels
  entries.forEach((entry) => {
    const key = entry.type;

    if (!consolidatedMap.has(key)) {
      consolidatedMap.set(key, []);
    }

    consolidatedMap.get(key).push(entry);
  });

  const consolidated: any[] = [];

  // Pour chaque type, résoudre les conflits
  consolidatedMap.forEach((typeEntries, type) => {
    if (type === "preference") {
      // Pour les préférences, garder seulement la plus récente par sujet
      const preferenceMap = new Map();

      typeEntries.forEach((entry: any) => {
        // Utiliser le sujet déjà calculé si dispo, sinon fallback heuristique
        const subject = entry.subject || identifyPreferenceSubject(entry.content);

        if (
          !preferenceMap.has(subject) ||
          new Date(entry.timestamp) > new Date(preferenceMap.get(subject).timestamp)
        ) {
          preferenceMap.set(subject, entry);
        }
      });

      preferenceMap.forEach((entry) => consolidated.push(entry));
    } else if (type === "instruction") {
      // Pour les instructions, vérifier les annulations
      const validInstructions = typeEntries.filter((entry: any) => {
        // Vérifier si une instruction ultérieure l'annule
        const isAnnulled = typeEntries.some(
          (other: any) =>
            new Date(other.timestamp) > new Date(entry.timestamp) &&
            (other.content.includes("ne plus") ||
              other.content.includes("n'évoque plus") ||
              other.content.includes("don't") ||
              other.content.includes("stop"))
        );

        return !isAnnulled;
      });

      consolidated.push(...validInstructions);
    } else {
      // Pour les autres types, garder les plus récentes et pertinentes
      const sorted = typeEntries.sort(
        (a: any, b: any) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Garder max 3 entrées par type
      consolidated.push(...sorted.slice(0, 3));
    }
  });

  return consolidated;
};
