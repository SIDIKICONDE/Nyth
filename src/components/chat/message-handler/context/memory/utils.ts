import { MEMORY_TYPE_LABELS } from "./config";
import { embeddingService } from "../../../../../services/embedding/EmbeddingService";

/**
 * Obtient le label localisé d'un type de mémoire
 */
export const getTypeLabel = (type: string, language: string): string => {
  return MEMORY_TYPE_LABELS[type]?.[language as "fr" | "en"] || type;
};

/**
 * Identifie le sujet d'une préférence pour détecter les conflits
 */
export const identifyPreferenceSubject = (content: string): string => {
  const lowerContent = content.toLowerCase();

  if (
    lowerContent.includes("script") &&
    (lowerContent.includes("court") || lowerContent.includes("short"))
  ) {
    return "script_length";
  }
  if (
    lowerContent.includes("script") &&
    (lowerContent.includes("long") || lowerContent.includes("détaillé"))
  ) {
    return "script_length";
  }
  if (lowerContent.includes("matin") || lowerContent.includes("morning")) {
    return "work_time";
  }
  if (lowerContent.includes("soir") || lowerContent.includes("evening")) {
    return "work_time";
  }

  // Par défaut, utiliser les premiers mots comme identifiant
  return content.split(" ").slice(0, 3).join(" ");
};

/**
 * Calcule un embedding optionnel pour texte libre (UI/RAG léger)
 */
export const tryEmbed = async (text: string): Promise<number[] | null> => {
  try {
    const v = await embeddingService.embedText(text);
    return v;
  } catch {
    return null;
  }
};
