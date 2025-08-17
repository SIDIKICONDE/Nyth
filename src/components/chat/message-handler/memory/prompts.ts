/**
 * Prompts pour l'analyse de mémoire IA
 */

import { AIMemoryEntry } from "./types";

/**
 * Construit le prompt pour demander à l'IA d'analyser si une information doit être mémorisée
 * avec gestion des conflits
 */
export const buildMemoryAnalysisPrompt = (
  message: string,
  conversationContext: string,
  existingMemory: AIMemoryEntry[],
  language: string
): string => {
  const memoryContext =
    existingMemory.length > 0
      ? `\nMÉMOIRE EXISTANTE:\n${existingMemory
          .map(
            (entry, index) =>
              `${index}: [${entry.type}] ${entry.content} (${entry.importance})`
          )
          .join("\n")}`
      : "\nMÉMOIRE EXISTANTE: Aucune information stockée";

  const prompts = {
    fr: buildFrenchPrompt(message, conversationContext, memoryContext),
    en: buildEnglishPrompt(message, conversationContext, memoryContext),
  };

  return prompts[language as keyof typeof prompts] || prompts.en;
};

/**
 * Prompt en français pour l'analyse de mémoire
 */
const buildFrenchPrompt = (
  message: string,
  conversationContext: string,
  memoryContext: string
): string => {
  return `Tu es un assistant qui analyse les conversations pour identifier les informations importantes à mémoriser sur l'utilisateur.

CONTEXTE DE LA CONVERSATION:
${conversationContext}

MESSAGE ACTUEL:
"${message}"
${memoryContext}

ANALYSE CE MESSAGE et détermine s'il contient des informations importantes à mémoriser. 
VÉRIFIE S'IL Y A DES CONFLITS avec la mémoire existante.

Réponds UNIQUEMENT avec un JSON structuré comme suit:

{
  "shouldMemorize": true/false,
  "type": "preference|fact|instruction|goal|skill|problem|habit|context",
  "content": "Reformulation claire de l'information à mémoriser",
  "importance": "high|medium|low",
  "reason": "Explication courte de ta décision",
  "conflictDetected": true/false,
  "conflictResolution": "replace|merge|keep_both|delete_old",
  "conflictingEntries": [0, 1, 2]
}

CRITÈRES pour mémoriser:
- Préférences personnelles explicites
- Instructions sur comment interagir
- Informations personnelles importantes
- Objectifs ou projets mentionnés
- Problèmes récurrents
- Habitudes de travail

GESTION DES CONFLITS:
- Si la nouvelle info CONTREDIT une ancienne → "replace" (remplacer)
- Si la nouvelle info COMPLÈTE une ancienne → "merge" (fusionner)
- Si les deux infos sont VALIDES → "keep_both" (garder les deux)
- Si la nouvelle info ANNULE une ancienne → "delete_old" (supprimer l'ancienne)

EXEMPLES DE CONFLITS:
- "Je préfère les scripts courts" vs "Je préfère les scripts longs" → replace
- "Je suis photographe" vs "Je suis aussi vidéaste" → merge
- "N'évoque plus mes projets personnels" → delete_old (supprimer les projets)

IMPORTANT: Si shouldMemorize est false, mets uniquement {"shouldMemorize": false, "reason": "..."}`;
};

/**
 * Prompt en anglais pour l'analyse de mémoire
 */
const buildEnglishPrompt = (
  message: string,
  conversationContext: string,
  memoryContext: string
): string => {
  return `You are an assistant analyzing conversations to identify important information to remember about the user.

CONVERSATION CONTEXT:
${conversationContext}

CURRENT MESSAGE:
"${message}"
${memoryContext}

ANALYZE THIS MESSAGE and determine if it contains important information to memorize.
CHECK FOR CONFLICTS with existing memory.

Reply ONLY with a structured JSON:

{
  "shouldMemorize": true/false,
  "type": "preference|fact|instruction|goal|skill|problem|habit|context",
  "content": "Clear reformulation of the information to memorize",
  "importance": "high|medium|low",
  "reason": "Brief explanation of your decision",
  "conflictDetected": true/false,
  "conflictResolution": "replace|merge|keep_both|delete_old",
  "conflictingEntries": [0, 1, 2]
}

CRITERIA to memorize:
- Explicit personal preferences
- Instructions on how to interact
- Important personal information
- Mentioned goals or projects
- Recurring problems
- Work habits

CONFLICT MANAGEMENT:
- If new info CONTRADICTS old → "replace"
- If new info COMPLEMENTS old → "merge"
- If both infos are VALID → "keep_both"
- If new info CANCELS old → "delete_old"

CONFLICT EXAMPLES:
- "I prefer short scripts" vs "I prefer long scripts" → replace
- "I'm a photographer" vs "I'm also a videographer" → merge
- "Don't mention my personal projects anymore" → delete_old

IMPORTANT: If shouldMemorize is false, only put {"shouldMemorize": false, "reason": "..."}`;
};
