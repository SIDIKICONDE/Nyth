import { saveToAIMemory } from "./storage";
import { AIMemoryEntry } from "./types";

export interface MemoryAnalysisResult {
  saved: boolean;
  ambiguityDetected: boolean;
  extractedInfo?: {
    type: AIMemoryEntry["type"];
    content: string;
    importance: AIMemoryEntry["importance"];
    confidence: number;
  };
  error?: string;
}

/**
 * Analyse avancée avec gestion d'ambiguïté
 */
export const analyzeAndSaveMemoryWithAmbiguity = async (
  userId: string,
  userMessage: string,
  aiResponse: string
): Promise<MemoryAnalysisResult> => {
  return { saved: false, ambiguityDetected: false };
};

/**
 * Analyse la réponse de l'IA pour détecter de nouvelles informations à mémoriser
 */
export const analyzeAndSaveMemory = async (
  userId: string,
  userMessage: string,
  aiResponse: string
): Promise<MemoryAnalysisResult> => {
  const result = await analyzeAndSaveMemoryWithAmbiguity(
    userId,
    userMessage,
    aiResponse
  );

  return result;
};

/**
 * Analyse multiple de messages (pour traitement par lot)
 */
export const analyzeBatchMessages = async (
  userId: string,
  messages: Array<{ userMessage: string; aiResponse: string }>
): Promise<MemoryAnalysisResult[]> => {
  const results: MemoryAnalysisResult[] = [];

  for (const { userMessage, aiResponse } of messages) {
    const result = await analyzeAndSaveMemoryWithAmbiguity(
      userId,
      userMessage,
      aiResponse
    );
    results.push(result);

    // Petite pause pour éviter la surcharge
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
};

/**
 * Analyse de sentiment pour ajuster l'importance
 */
export const analyzeWithSentiment = async (
  userId: string,
  userMessage: string,
  aiResponse: string
): Promise<MemoryAnalysisResult> => {
  // Analyser le sentiment pour ajuster l'importance
  const sentiment = analyzeSentiment(userMessage);
  const result = await analyzeAndSaveMemoryWithAmbiguity(
    userId,
    userMessage,
    aiResponse
  );

  // Ajuster l'importance basée sur le sentiment
  if (result.saved && sentiment.intensity === "high") {}

  return result;
};

/**
 * Analyse de sentiment simple
 */
const analyzeSentiment = (
  message: string
): {
  polarity: "positive" | "negative" | "neutral";
  intensity: "low" | "medium" | "high";
} => {
  const strongPositive = /adore|génial|parfait|excellent|fantastique/i;
  const strongNegative = /déteste|horrible|nul|catastrophe|inacceptable/i;
  const mediumPositive = /aime|bien|bon|sympa|cool/i;
  const mediumNegative = /n'aime pas|mauvais|problème|ennuyeux/i;

  if (strongPositive.test(message)) {
    return { polarity: "positive", intensity: "high" };
  }
  if (strongNegative.test(message)) {
    return { polarity: "negative", intensity: "high" };
  }
  if (mediumPositive.test(message)) {
    return { polarity: "positive", intensity: "medium" };
  }
  if (mediumNegative.test(message)) {
    return { polarity: "negative", intensity: "medium" };
  }

  return { polarity: "neutral", intensity: "low" };
};
