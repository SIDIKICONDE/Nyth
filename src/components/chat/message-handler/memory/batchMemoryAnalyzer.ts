/**
 * Analyseur de mémoire par lot - Traite plusieurs messages ensemble
 * pour extraire les informations les plus importantes
 */

import { isAIMemoryEnabled } from "@/config/aiMemoryConfig";
import { AIService } from "@/services/ai/AIService";
import { getUserLanguage } from "../context/language";
import { clearMemory, loadAIMemory, saveToAIMemory } from "./storage";
import { AIMemoryEntry } from "./types";

interface BatchMessage {
  content: string;
  timestamp: string;
  role: "user" | "assistant";
}

interface BatchAnalysisResult {
  success: boolean;
  method: "batch-analysis" | "disabled" | "error" | "insufficient-messages";
  extractedMemories: AIMemoryEntry[];
  totalMessages: number;
  error?: string;
}

/**
 * Configuration pour l'analyse par lot
 */
export interface BatchAnalysisConfig {
  minMessages: number; // Minimum de messages avant analyse
  maxMessages: number; // Maximum de messages à analyser en une fois
  triggerInterval: number; // Intervalle de déclenchement (en nombre de messages)
  enabled: boolean;
}

export const DEFAULT_BATCH_CONFIG: BatchAnalysisConfig = {
  minMessages: 3,
  maxMessages: 6,
  triggerInterval: 3, // Analyse tous les 3 messages
  enabled: true,
};

/**
 * Stockage temporaire des messages en attente d'analyse
 */
const pendingMessages: { [userId: string]: BatchMessage[] } = {};

/**
 * Compteur de messages par utilisateur
 */
const messageCounters: { [userId: string]: number } = {};

/**
 * Prompt pour l'analyse par lot
 */
const buildBatchAnalysisPrompt = (
  messages: BatchMessage[],
  existingMemory: AIMemoryEntry[],
  language: string
): string => {
  const messagesContext = messages
    .map((msg, index) => `Message ${index + 1} (${msg.role}): "${msg.content}"`)
    .join("\n");

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
    fr: `Tu es un assistant qui analyse des conversations par lot pour extraire les informations les plus importantes à mémoriser sur l'utilisateur.

MESSAGES À ANALYSER:
${messagesContext}
${memoryContext}

TÂCHE: Analyse TOUS ces messages ensemble et extrait UNIQUEMENT les informations les plus importantes et persistantes sur l'utilisateur.

Réponds UNIQUEMENT avec un JSON structuré comme suit:

{
  "shouldExtractMemories": true/false,
  "extractedMemories": [
    {
      "type": "preference|fact|instruction|goal|skill|problem|habit|context",
      "content": "Information claire et concise à mémoriser",
      "importance": "high|medium|low",
      "reason": "Pourquoi cette info est importante"
    }
  ],
  "conflictsResolved": [
    {
      "conflictingEntryIndex": 0,
      "resolution": "replace|merge|delete_old",
      "reason": "Explication du conflit résolu"
    }
  ]
}

CRITÈRES STRICTS pour extraire:
- Préférences EXPLICITES et DURABLES (pas temporaires)
- Instructions CLAIRES sur comment interagir
- Informations personnelles IMPORTANTES et STABLES
- Objectifs à LONG TERME mentionnés
- Compétences ou problèmes RÉCURRENTS
- Habitudes de travail ÉTABLIES

NE PAS extraire:
- Questions ponctuelles ou discussions temporaires
- Réflexions ou hésitations
- Détails techniques spécifiques à un projet
- Informations déjà bien représentées en mémoire
- Préférences contradictoires (résoudre les conflits)
- Demandes d'aide ou de conseil temporaires
- Discussions exploratoires sans engagement

RÉSOLUTION DE CONFLITS:
- Si nouvelle préférence contredit ancienne → remplacer
- Si nouvelle info complète ancienne → fusionner
- Si instruction annule ancienne → supprimer l'ancienne

IMPORTANT: Sois ULTRA-SÉLECTIF. Mieux vaut extraire 0 information que de mémoriser des questions temporaires ou des réflexions. SEULES les préférences CLAIRES, les faits DURABLES et les instructions EXPLICITES doivent être mémorisées. En cas de doute, NE PAS mémoriser.`,

    en: `You are an assistant that analyzes conversations in batches to extract the most important information to remember about the user.

MESSAGES TO ANALYZE:
${messagesContext}
${memoryContext}

TASK: Analyze ALL these messages together and extract ONLY the most important and persistent information about the user.

Reply ONLY with a structured JSON:

{
  "shouldExtractMemories": true/false,
  "extractedMemories": [
    {
      "type": "preference|fact|instruction|goal|skill|problem|habit|context",
      "content": "Clear and concise information to memorize",
      "importance": "high|medium|low",
      "reason": "Why this info is important"
    }
  ],
  "conflictsResolved": [
    {
      "conflictingEntryIndex": 0,
      "resolution": "replace|merge|delete_old",
      "reason": "Explanation of resolved conflict"
    }
  ]
}

STRICT CRITERIA to extract:
- EXPLICIT and DURABLE preferences (not temporary)
- CLEAR instructions on how to interact
- IMPORTANT and STABLE personal information
- LONG-TERM goals mentioned
- RECURRING skills or problems
- ESTABLISHED work habits

DO NOT extract:
- One-time questions or temporary discussions
- Reflections or hesitations
- Technical details specific to one project
- Information already well represented in memory
- Contradictory preferences (resolve conflicts)
- Temporary help requests or advice
- Exploratory discussions without commitment

CONFLICT RESOLUTION:
- If new preference contradicts old → replace
- If new info complements old → merge
- If instruction cancels old → delete old

IMPORTANT: Be ULTRA-SELECTIVE. Better to extract 0 information than to memorize temporary questions or reflections. ONLY CLEAR preferences, DURABLE facts and EXPLICIT instructions should be memorized. When in doubt, DO NOT memorize.`,
  };

  return prompts[language as keyof typeof prompts] || prompts.en;
};

/**
 * Ajoute un message à la file d'attente pour analyse
 */
export const addMessageToBatch = async (
  userId: string,
  message: string,
  role: "user" | "assistant" = "user",
  config: BatchAnalysisConfig = DEFAULT_BATCH_CONFIG
): Promise<void> => {
  if (!config.enabled) return;

  // Initialiser les structures si nécessaire
  if (!pendingMessages[userId]) {
    pendingMessages[userId] = [];
  }
  if (!messageCounters[userId]) {
    messageCounters[userId] = 0;
  }

  // Ajouter le message à la file
  pendingMessages[userId].push({
    content: message,
    timestamp: new Date().toISOString(),
    role,
  });

  // Incrémenter le compteur
  messageCounters[userId]++;

  // Garder seulement les derniers messages (pour éviter l'accumulation)
  if (pendingMessages[userId].length > config.maxMessages) {
    pendingMessages[userId] = pendingMessages[userId].slice(
      -config.maxMessages
    );
  }
};

/**
 * Vérifie si une analyse par lot doit être déclenchée
 */
export const shouldTriggerBatchAnalysis = (
  userId: string,
  config: BatchAnalysisConfig = DEFAULT_BATCH_CONFIG
): boolean => {
  if (!config.enabled) return false;

  const messageCount = messageCounters[userId] || 0;
  const pendingCount = pendingMessages[userId]?.length || 0;

  // Déclencher si on a atteint l'intervalle ET qu'on a assez de messages
  return (
    messageCount % config.triggerInterval === 0 &&
    pendingCount >= config.minMessages
  );
};

/**
 * Analyse par lot des messages en attente
 */
export const processBatchAnalysis = async (
  userId: string,
  config: BatchAnalysisConfig = DEFAULT_BATCH_CONFIG
): Promise<BatchAnalysisResult> => {
  try {
    // Vérifier si la mémoire IA est activée
    const memoryEnabled = await isAIMemoryEnabled();
    if (!memoryEnabled) {
      return {
        success: false,
        method: "disabled",
        extractedMemories: [],
        totalMessages: 0,
        error: "Mémoire IA désactivée",
      };
    }

    // Récupérer les messages en attente
    const messages = pendingMessages[userId] || [];
    if (messages.length < config.minMessages) {
      return {
        success: false,
        method: "insufficient-messages",
        extractedMemories: [],
        totalMessages: messages.length,
        error: `Pas assez de messages (${messages.length}/${config.minMessages})`,
      };
    }

    // Charger la mémoire existante
    const existingMemory = await loadAIMemory(userId);
    const memoryEntries = existingMemory?.entries || [];

    // Obtenir la langue
    const language = await getUserLanguage();

    // Construire le prompt d'analyse
    const analysisPrompt = buildBatchAnalysisPrompt(
      messages,
      memoryEntries,
      language
    );

    // Demander à l'IA d'analyser
    const aiResponse = await AIService.simpleChatWithAI(analysisPrompt, []);

    // Parser la réponse JSON
    let analysisResult;
    try {
      const cleanResponse = aiResponse
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      analysisResult = JSON.parse(cleanResponse);
    } catch (parseError) {
      return {
        success: false,
        method: "error",
        extractedMemories: [],
        totalMessages: messages.length,
        error: "Impossible de parser la réponse de l'IA",
      };
    }

    // Traiter les conflits identifiés
    if (analysisResult.conflictsResolved?.length > 0) {
      await resolveIdentifiedConflicts(
        userId,
        analysisResult.conflictsResolved,
        memoryEntries
      );
    }

    // Sauvegarder les nouvelles mémoires extraites
    const extractedMemories: AIMemoryEntry[] = [];
    if (
      analysisResult.shouldExtractMemories &&
      analysisResult.extractedMemories?.length > 0
    ) {
      for (const memory of analysisResult.extractedMemories) {
        // Vérifier si cette information existe déjà (déduplication)
        const alreadyExists = memoryEntries.some(
          (existingEntry: AIMemoryEntry) =>
            existingEntry.content.toLowerCase().trim() ===
              memory.content.toLowerCase().trim() ||
            existingEntry.content
              .toLowerCase()
              .includes(memory.content.toLowerCase()) ||
            memory.content
              .toLowerCase()
              .includes(existingEntry.content.toLowerCase())
        );

        if (alreadyExists) {
          continue;
        }

        const memoryEntry: AIMemoryEntry = {
          type: memory.type,
          content: memory.content,
          importance: memory.importance,
          timestamp: new Date().toISOString(),
        };

        await saveToAIMemory(userId, memoryEntry);
        extractedMemories.push(memoryEntry);
      }
    }

    // Nettoyer les messages traités
    pendingMessages[userId] = [];

    return {
      success: true,
      method: "batch-analysis",
      extractedMemories,
      totalMessages: messages.length,
    };
  } catch (error) {
    return {
      success: false,
      method: "error",
      extractedMemories: [],
      totalMessages: 0,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
};

/**
 * Résout les conflits identifiés par l'IA
 */
const resolveIdentifiedConflicts = async (
  userId: string,
  conflicts: any[],
  existingMemory: AIMemoryEntry[]
): Promise<void> => {
  for (const conflict of conflicts) {
    const { conflictingEntryIndex, resolution, reason } = conflict;

    switch (resolution) {
      case "replace":
      case "delete_old":
        // Supprimer l'entrée en conflit
        const filteredMemory = existingMemory.filter(
          (_, index) => index !== conflictingEntryIndex
        );

        await clearMemory(userId);
        for (const entry of filteredMemory) {
          await saveToAIMemory(userId, entry);
        }
        break;

      case "merge":
        break;
    }
  }
};

/**
 * Fonction principale à appeler depuis le processeur de messages
 */
export const handleBatchMemoryAnalysis = async (
  userId: string,
  userMessage: string,
  config: BatchAnalysisConfig = DEFAULT_BATCH_CONFIG
): Promise<void> => {
  // Ajouter le message à la file
  await addMessageToBatch(userId, userMessage, "user", config);

  // Vérifier si on doit déclencher l'analyse
  if (shouldTriggerBatchAnalysis(userId, config)) {
    // Lancer l'analyse en arrière-plan (sans bloquer)
    processBatchAnalysis(userId, config)
      .then((result) => {
        if (result.success) {} else {}
      })
      .catch((error) => {});
  }
};

/**
 * Réinitialise les compteurs et messages pour un utilisateur
 */
export const resetBatchMemoryForUser = (userId: string): void => {
  delete pendingMessages[userId];
  delete messageCounters[userId];
};

/**
 * Nettoie la mémoire corrompue (exemples fictifs mémorisés par erreur)
 */
export const cleanCorruptedMemory = async (userId: string): Promise<void> => {
  try {
    const memory = await loadAIMemory(userId);
    if (!memory || memory.entries.length === 0) {
      return;
    }

    // Exemples fictifs à supprimer
    const corruptedExamples = [
      "ne m'aide plus avec les introductions",
      "mon audience c'est les entrepreneurs",
      "audience entrepreneurs",
      "audience entrepreneur",
      "je préfère toujours les scripts de 2 minutes",
      "don't help me with introductions",
      "my audience is entrepreneurs",
      "i always prefer 2-minute scripts",
    ];

    const cleanedEntries = memory.entries.filter((entry: AIMemoryEntry) => {
      const content = entry.content.toLowerCase();
      const isCorrupted = corruptedExamples.some((example) =>
        content.includes(example.toLowerCase())
      );

      if (isCorrupted) {
        return false;
      }
      return true;
    });

    // Supprimer les doublons
    const uniqueEntries = cleanedEntries.filter(
      (entry: AIMemoryEntry, index: number, arr: AIMemoryEntry[]) => {
        return (
          arr.findIndex(
            (e: AIMemoryEntry) =>
              e.content.toLowerCase().trim() ===
              entry.content.toLowerCase().trim()
          ) === index
        );
      }
    );

    const removedCount = memory.entries.length - uniqueEntries.length;

    if (removedCount > 0) {
      // Sauvegarder la mémoire nettoyée
      await clearMemory(userId);
      for (const entry of uniqueEntries) {
        await saveToAIMemory(userId, entry);
      }
    } else {}
  } catch (error) {}
};

/**
 * Obtient les statistiques de l'analyse par lot
 */
export const getBatchMemoryStats = (userId: string) => {
  return {
    pendingMessages: pendingMessages[userId]?.length || 0,
    totalMessagesSent: messageCounters[userId] || 0,
    nextAnalysisIn:
      DEFAULT_BATCH_CONFIG.triggerInterval -
      ((messageCounters[userId] || 0) % DEFAULT_BATCH_CONFIG.triggerInterval),
  };
};
