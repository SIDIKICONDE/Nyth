import { AIMemory, AIMemoryEntry, MAX_MEMORY_ENTRIES } from "./types";
import {
  memoryManager,
  type MemoryEntry,
  type MemoryCollection,
} from "../../../../services/memory/MemoryManager";

/**
 * Charge la mémoire persistante de l'IA pour un utilisateur donné
 */
export const loadAIMemory = async (
  userId: string
): Promise<AIMemory | null> => {
  try {
    if (!userId) return null;

    const collection: MemoryCollection = await memoryManager.loadUserMemory(
      userId
    );

    const mappedEntries: AIMemoryEntry[] = collection.entries.map((e) => ({
      id: e.id,
      type: mapCategoryToAIType(e.category),
      content: e.content,
      importance: mapImportanceToAI(e.importance),
      timestamp: e.timestamp,
      embedding: e.embedding,
      subject: e.subject,
    }));

    return {
      userId,
      entries: mappedEntries.slice(0, MAX_MEMORY_ENTRIES),
      lastUpdated: collection.lastUpdated,
    };
  } catch (error) {
    return null;
  }
};

/**
 * Sauvegarde une nouvelle entrée dans la mémoire IA
 */
export const saveToAIMemory = async (
  userId: string,
  entry: Omit<AIMemoryEntry, "timestamp">
): Promise<void> => {
  try {
    if (!userId) return;

    await memoryManager.addMemory(userId, {
      title: `IA: ${entry.type}`,
      content: entry.content,
      category: mapAITypeToCategory(entry.type),
      importance: mapImportanceFromAI(entry.importance),
      citationRequired: false,
      tags: ["ai-memory", entry.type],
    });

    const collection = await memoryManager.loadUserMemory(userId);
    if (collection.entries.length > MAX_MEMORY_ENTRIES) {
      const sorted = [...collection.entries].sort((a, b) => {
        const order = { high: 3, medium: 2, low: 1 } as const;
        const impDiff = order[b.importance] - order[a.importance];
        if (impDiff !== 0) return impDiff;
        return (
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });
      const keepIds = new Set(
        sorted.slice(0, MAX_MEMORY_ENTRIES).map((e) => e.id)
      );
      const toDelete = collection.entries.filter((e) => !keepIds.has(e.id));
      for (const e of toDelete) {
        await memoryManager.deleteMemory(userId, e.id);
      }
    }
  } catch (error) {}
};

/**
 * Efface la mémoire d'un utilisateur
 */
export const clearMemory = async (userId: string): Promise<void> => {
  try {
    await memoryManager.clearUserMemory(userId);
  } catch (error) {}
};

/**
 * Obtient la taille de la mémoire pour un utilisateur
 */
export const getMemorySize = async (userId: string): Promise<number> => {
  try {
    const collection = await memoryManager.loadUserMemory(userId);
    return collection.entries.length;
  } catch (error) {
    return 0;
  }
};

/**
 * Vérifie si la mémoire existe pour un utilisateur
 */
export const hasMemory = async (userId: string): Promise<boolean> => {
  try {
    const collection = await memoryManager.loadUserMemory(userId);
    return collection.entries.length > 0;
  } catch (error) {
    return false;
  }
};

function mapCategoryToAIType(
  category: MemoryEntry["category"]
): AIMemoryEntry["type"] {
  switch (category) {
    case "preference":
      return "preference";
    case "rule":
      return "instruction";
    case "context":
      return "context";
    case "fact":
      return "fact";
    case "correction":
      return "instruction";
    default:
      return "context";
  }
}

function mapAITypeToCategory(
  type: AIMemoryEntry["type"]
): MemoryEntry["category"] {
  switch (type) {
    case "preference":
      return "preference";
    case "instruction":
      return "rule";
    case "context":
      return "context";
    case "fact":
      return "fact";
    case "goal":
    case "skill":
    case "habit":
    case "problem":
      return "context";
    default:
      return "context";
  }
}

function mapImportanceToAI(
  importance: MemoryEntry["importance"]
): AIMemoryEntry["importance"] {
  switch (importance) {
    case "high":
      return "high";
    case "low":
      return "low";
    default:
      return "medium";
  }
}

function mapImportanceFromAI(
  importance: AIMemoryEntry["importance"]
): MemoryEntry["importance"] {
  switch (importance) {
    case "high":
      return "high";
    case "low":
      return "low";
    default:
      return "medium";
  }
}
