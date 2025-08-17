/**
 * Analyseur de mémoire basé sur les décisions de l'IA principale
 * L'IA analyse le contexte et décide ce qui doit être mémorisé
 */

import { isAIMemoryEnabled } from "@/config/aiMemoryConfig";
import { AIService } from "@/services/ai/AIService";
import { getUserLanguage } from "../context/language";
import { ERROR_MESSAGES } from "./config";
import { resolveMemoryConflicts } from "./conflictResolver";
import { buildMemoryAnalysisPrompt } from "./prompts";
import { loadAIMemory, saveToAIMemory } from "./storage";
import {
  AIDecisionAnalysisResult,
  AIMemoryDecision,
  ConversationMessage,
} from "./types";

/**
 * Analyse un message avec l'IA principale pour décider s'il faut le mémoriser
 * avec gestion des conflits
 */
export const analyzeWithAIDecision = async (
  userId: string,
  userMessage: string,
  conversationHistory: ConversationMessage[] = [],
  user?: any
): Promise<AIDecisionAnalysisResult> => {
  try {
    // Vérifier si la mémoire IA est activée
    const memoryEnabled = await isAIMemoryEnabled();
    if (!memoryEnabled) {
      return {
        success: false,
        method: "disabled",
        error: ERROR_MESSAGES.MEMORY_DISABLED,
      };
    }

    // Obtenir la langue de l'utilisateur
    const language = await getUserLanguage();

    // Charger la mémoire existante
    const existingMemory = await loadAIMemory(userId);
    const memoryEntries = existingMemory?.entries || [];

    // Construire le contexte de conversation (6 derniers messages)
    const recentHistory = conversationHistory.slice(-6);
    const conversationContext = recentHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    // Construire le prompt d'analyse avec mémoire existante
    const analysisPrompt = buildMemoryAnalysisPrompt(
      userMessage,
      conversationContext,
      memoryEntries,
      language
    );

    // Demander à l'IA d'analyser
    const aiResponse = await AIService.simpleChatWithAI(analysisPrompt, []);

    // Parser la réponse JSON
    const decision = await parseAIResponse(aiResponse);
    if (!decision) {
      return {
        success: false,
        method: "error",
        error: ERROR_MESSAGES.PARSING_ERROR,
      };
    }

    // Gérer les conflits si détectés
    if (decision.conflictDetected) {
      await resolveMemoryConflicts(userId, decision, memoryEntries);
    }

    // Si l'IA décide de mémoriser (et qu'il n'y a pas que de la suppression)
    if (shouldSaveMemory(decision)) {
      await saveMemoryIfNeeded(userId, decision);

      return {
        success: true,
        method: "ai-decision",
        decision,
      };
    }

    return {
      success: !!(
        decision.conflictDetected &&
        decision.conflictResolution === "delete_old"
      ),
      method: "ai-decision",
      decision,
    };
  } catch (error) {
    return {
      success: false,
      method: "error",
      error:
        error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
    };
  }
};

/**
 * Parse la réponse de l'IA et retourne la décision
 */
const parseAIResponse = async (
  aiResponse: string
): Promise<AIMemoryDecision | null> => {
  try {
    // Nettoyer la réponse (enlever les markdown si présents)
    const cleanResponse = aiResponse
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    return JSON.parse(cleanResponse);
  } catch (parseError) {
    return null;
  }
};

/**
 * Détermine si la mémoire doit être sauvegardée
 */
const shouldSaveMemory = (decision: AIMemoryDecision): boolean => {
  return !!(
    decision.shouldMemorize &&
    decision.content &&
    decision.type &&
    decision.conflictResolution !== "delete_old"
  );
};

/**
 * Sauvegarde la mémoire si nécessaire
 */
const saveMemoryIfNeeded = async (
  userId: string,
  decision: AIMemoryDecision
): Promise<void> => {
  // Sauvegarder seulement si ce n'est pas déjà fait par la résolution de conflit
  if (
    !decision.conflictDetected ||
    decision.conflictResolution === "keep_both"
  ) {
    await saveToAIMemory(userId, {
      content: decision.content!,
      type: decision.type!,
      importance: decision.importance || "medium",
    });
  }
};
