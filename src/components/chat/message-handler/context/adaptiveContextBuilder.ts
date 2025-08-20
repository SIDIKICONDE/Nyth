import { buildContextualPrompt } from "./contextBuilder";
import { exceedsTokenLimit, progressiveOptimization } from "./contextOptimizer";
import { buildMinimalContext } from "./minimalContextBuilder";
import { FullContextOptions } from "./types";

/**
 * Construit un contexte adaptatif selon la longueur du message
 */
export const buildAdaptiveContext = async (
  user: any,
  scripts: any[],
  userMessage: string,
  maxTokens: number = 4000
): Promise<string> => {
  // Essayer le contexte complet d'abord
  const fullContext = await buildContextualPrompt(user, scripts, userMessage);

  if (!exceedsTokenLimit(fullContext, maxTokens)) {
    return fullContext;
  }

  // Réduire progressivement
  const reducedOptions = [
    // Réduction modérée
    {
      scriptsConfig: {
        maxScripts: 5,
        includePreview: true,
        previewLength: 100,
        includeMetadata: true,
        includeWordCount: false,
      },
      memoryConfig: {
        maxEntriesHigh: 5,
        maxEntriesMedium: 3,
        maxEntriesLow: 2,
        includeTimestamps: false,
        groupByImportance: true,
      },
    },
    // Réduction importante
    {
      scriptsConfig: {
        maxScripts: 3,
        includePreview: true,
        previewLength: 50,
        includeMetadata: false,
        includeWordCount: false,
      },
      memoryConfig: {
        maxEntriesHigh: 3,
        maxEntriesMedium: 2,
        maxEntriesLow: 0,
        includeTimestamps: false,
        groupByImportance: true,
      },
    },
  ];

  // Tester chaque niveau de réduction
  for (const options of reducedOptions) {
    const reducedContext = await buildContextualPrompt(
      user,
      scripts,
      userMessage,
      options
    );
    if (!exceedsTokenLimit(reducedContext, maxTokens)) {
      return reducedContext;
    }
  }

  // Dernier recours : contexte minimal
  return buildMinimalContext(user, scripts, userMessage, {
    maxScripts: 2,
    maxMemoryEntries: 2,
  });
};

/**
 * Construit un contexte avec optimisation progressive
 */
export const buildOptimizedContext = async (
  user: any,
  scripts: any[],
  userMessage: string,
  maxTokens: number = 4000
): Promise<string> => {
  const fullContext = await buildContextualPrompt(user, scripts, userMessage);

  if (!exceedsTokenLimit(fullContext, maxTokens)) {
    return fullContext;
  }

  return progressiveOptimization(fullContext, maxTokens);
};

/**
 * Construit un contexte adaptatif intelligent qui choisit la meilleure stratégie
 */
export const buildSmartAdaptiveContext = async (
  user: any,
  scripts: any[],
  userMessage: string,
  maxTokens: number = 4000,
  priority: "memory" | "scripts" | "balanced" = "balanced"
): Promise<string> => {
  // Analyser le message pour déterminer le contexte optimal
  const isScriptFocused =
    userMessage.toLowerCase().includes("script") ||
    userMessage.toLowerCase().includes("texte");
  const isMemoryFocused =
    userMessage.toLowerCase().includes("souviens") ||
    userMessage.toLowerCase().includes("rappelle") ||
    userMessage.toLowerCase().includes("remember");

  // Ajuster la priorité selon l'analyse
  let adjustedPriority = priority;
  if (isScriptFocused && priority === "balanced") {
    adjustedPriority = "scripts";
  } else if (isMemoryFocused && priority === "balanced") {
    adjustedPriority = "memory";
  }

  // Configurations selon la priorité
  const priorityConfigs: { [key: string]: Partial<FullContextOptions> } = {
    memory: {
      memoryConfig: {
        maxEntriesHigh: 10,
        maxEntriesMedium: 7,
        maxEntriesLow: 3,
        includeTimestamps: true,
        groupByImportance: true,
      },
      scriptsConfig: {
        maxScripts: 3,
        includePreview: true,
        previewLength: 50,
        includeMetadata: false,
        includeWordCount: false,
      },
    },
    scripts: {
      scriptsConfig: {
        maxScripts: 10,
        includePreview: true,
        previewLength: 150,
        includeMetadata: true,
        includeWordCount: true,
      },
      memoryConfig: {
        maxEntriesHigh: 3,
        maxEntriesMedium: 2,
        maxEntriesLow: 1,
        includeTimestamps: false,
        groupByImportance: true,
      },
    },
    balanced: {
      scriptsConfig: {
        maxScripts: 5,
        includePreview: true,
        previewLength: 100,
        includeMetadata: true,
        includeWordCount: false,
      },
      memoryConfig: {
        maxEntriesHigh: 5,
        maxEntriesMedium: 3,
        maxEntriesLow: 2,
        includeTimestamps: false,
        groupByImportance: true,
      },
    },
  };

  const context = await buildContextualPrompt(
    user,
    scripts,
    userMessage,
    priorityConfigs[adjustedPriority]
  );

  if (!exceedsTokenLimit(context, maxTokens)) {
    return context;
  }

  // Si encore trop long, utiliser l'optimisation progressive
  return progressiveOptimization(context, maxTokens);
};
