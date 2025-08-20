/**
 * Gestionnaire de résolution des conflits de mémoire IA
 */

import { clearMemory, saveToAIMemory } from "./storage";
import { AIMemoryDecision, AIMemoryEntry } from "./types";

/**
 * Résout les conflits dans la mémoire selon la décision de l'IA
 */
export const resolveMemoryConflicts = async (
  userId: string,
  decision: AIMemoryDecision,
  existingMemory: AIMemoryEntry[]
): Promise<void> => {
  if (!decision.conflictDetected || !decision.conflictingEntries?.length) {
    return;
  }

  switch (decision.conflictResolution) {
    case "replace":
      await handleReplaceConflict(userId, decision, existingMemory);
      break;

    case "delete_old":
      await handleDeleteOldConflict(userId, decision, existingMemory);
      break;

    case "merge":
      await handleMergeConflict(userId, decision, existingMemory);
      break;

    case "keep_both":
      await handleKeepBothConflict();
      break;

    default:
  }
};

/**
 * Gère la résolution par remplacement
 */
const handleReplaceConflict = async (
  userId: string,
  decision: AIMemoryDecision,
  existingMemory: AIMemoryEntry[]
): Promise<void> => {
  // Remplacer les anciennes entrées par la nouvelle
  const newMemory = existingMemory.filter(
    (_, index) => !decision.conflictingEntries!.includes(index)
  );

  if (decision.content && decision.type) {
    newMemory.push({
      type: decision.type,
      content: decision.content,
      importance: decision.importance || "medium",
      timestamp: new Date().toISOString(),
    });
  }

  await clearMemory(userId);
  for (const entry of newMemory) {
    await saveToAIMemory(userId, entry);
  }
};

/**
 * Gère la résolution par suppression des anciennes entrées
 */
const handleDeleteOldConflict = async (
  userId: string,
  decision: AIMemoryDecision,
  existingMemory: AIMemoryEntry[]
): Promise<void> => {
  // Supprimer les anciennes entrées sans ajouter de nouvelle
  const filteredMemory = existingMemory.filter(
    (_, index) => !decision.conflictingEntries!.includes(index)
  );

  await clearMemory(userId);
  for (const entry of filteredMemory) {
    await saveToAIMemory(userId, entry);
  }
};

/**
 * Gère la résolution par fusion des informations
 */
const handleMergeConflict = async (
  userId: string,
  decision: AIMemoryDecision,
  existingMemory: AIMemoryEntry[]
): Promise<void> => {
  const conflictingEntry = existingMemory[decision.conflictingEntries![0]];

  if (conflictingEntry && decision.content) {
    const mergedContent = `${conflictingEntry.content}. ${decision.content}`;

    // Remplacer l'ancienne entrée par la version fusionnée
    const updatedMemory = existingMemory.map((entry, index) =>
      index === decision.conflictingEntries![0]
        ? {
            ...entry,
            content: mergedContent,
            timestamp: new Date().toISOString(),
          }
        : entry
    );

    await clearMemory(userId);
    for (const entry of updatedMemory) {
      await saveToAIMemory(userId, entry);
    }
  }
};

/**
 * Gère la résolution par conservation des deux informations
 */
const handleKeepBothConflict = async (): Promise<void> => {};
