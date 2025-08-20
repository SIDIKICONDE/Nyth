/**
 * Script de test et diagnostic pour la mémoire IA
 */

import { analyzeWithAIDecision } from "../components/chat/message-handler/memory/aiDecisionAnalyzer";
import { handleBatchMemoryAnalysis } from "../components/chat/message-handler/memory/batchMemoryAnalyzer";
import {
  loadAIMemory,
  saveToAIMemory,
} from "../components/chat/message-handler/memory/storage";
import {
  isAIMemoryEnabled,
  loadAIMemoryConfig,
} from "../config/aiMemoryConfig";

const TEST_USER_ID = "test_user_diagnostic";

/**
 * Test de base de la mémoire
 */
export const testBasicMemory = async () => {
  try {
    // 1. Vérifier la configuration
    const config = await loadAIMemoryConfig();

    const isEnabled = await isAIMemoryEnabled();

    if (!isEnabled) {
      return false;
    }

    // 2. Test de sauvegarde
    await saveToAIMemory(TEST_USER_ID, {
      type: "preference",
      content: "Test de sauvegarde automatique",
      importance: "medium",
    });

    // 3. Test de lecture
    const memory = await loadAIMemory(TEST_USER_ID);

    // 4. Test d'analyse IA
    const result = await analyzeWithAIDecision(
      TEST_USER_ID,
      "Je préfère les réponses courtes",
      []
    );

    // 5. Test d'analyse par lot
    await handleBatchMemoryAnalysis(TEST_USER_ID, "Test message batch");
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Test de connectivité avec l'IA
 */
export const testAIConnectivity = async () => {
  try {
    const { AIService } = await import("../services/ai/AIService");

    const response = await AIService.simpleChatWithAI(
      "Test de connectivité - réponds juste 'OK'",
      []
    );

    return response.includes("OK");
  } catch (error) {
    return false;
  }
};

/**
 * Diagnostic complet
 */
export const runFullDiagnostic = async () => {
  const results = {
    basicMemory: await testBasicMemory(),
    aiConnectivity: await testAIConnectivity(),
  };

  if (results.basicMemory && results.aiConnectivity) {} else {
    !results.basicMemory;
    !results.aiConnectivity;
  }

  return results;
};

// Export pour utilisation
export default {
  testBasicMemory,
  testAIConnectivity,
  runFullDiagnostic,
};
