import { buildContextualPrompt } from "./contextBuilder";
import { getUserLanguage } from "./language";
import { FullContextOptions } from "./types";

/**
 * Construit un contexte pour un type de conversation spécifique
 */
export const buildSpecializedContext = async (
  user: any,
  scripts: any[],
  userMessage: string,
  contextType: "script_analysis" | "memory_focused" | "general" | "creative"
): Promise<string> => {
  const language = await getUserLanguage();

  const specializedOptions: { [key: string]: Partial<FullContextOptions> } = {
    script_analysis: {
      scriptsConfig: {
        maxScripts: 15,
        includePreview: true,
        previewLength: 200,
        includeMetadata: true,
        includeWordCount: true,
      },
      memoryConfig: {
        maxEntriesHigh: 3,
        maxEntriesMedium: 2,
        maxEntriesLow: 0,
        includeTimestamps: false,
        groupByImportance: true,
      },
      customInstructions:
        language === "fr"
          ? "Focus sur l'analyse détaillée des scripts."
          : "Focus on detailed script analysis.",
    },
    memory_focused: {
      scriptsConfig: {
        maxScripts: 3,
        includePreview: false,
        previewLength: 50,
        includeMetadata: false,
        includeWordCount: false,
      },
      memoryConfig: {
        maxEntriesHigh: 15,
        maxEntriesMedium: 10,
        maxEntriesLow: 5,
        includeTimestamps: true,
        groupByImportance: true,
      },
      customInstructions:
        language === "fr"
          ? "Utilise prioritairement les informations mémorisées."
          : "Prioritize memorized information.",
    },
    creative: {
      scriptsConfig: {
        maxScripts: 5,
        includePreview: true,
        previewLength: 100,
        includeMetadata: false,
        includeWordCount: false,
      },
      memoryConfig: {
        maxEntriesHigh: 5,
        maxEntriesMedium: 3,
        maxEntriesLow: 2,
        includeTimestamps: false,
        groupByImportance: true,
      },
      customInstructions:
        language === "fr"
          ? "Sois créatif et inspirant dans tes réponses."
          : "Be creative and inspiring in your responses.",
    },
    general: {}, // Configuration par défaut
  };

  return buildContextualPrompt(
    user,
    scripts,
    userMessage,
    specializedOptions[contextType]
  );
};

/**
 * Construit un contexte pour l'analyse de scripts
 */
export const buildScriptAnalysisContext = async (
  user: any,
  scripts: any[],
  userMessage: string,
  focusedScriptId?: string
): Promise<string> => {
  const language = await getUserLanguage();

  const options: Partial<FullContextOptions> = {
    scriptsConfig: {
      maxScripts: focusedScriptId ? 1 : 10,
      includePreview: true,
      previewLength: 300,
      includeMetadata: true,
      includeWordCount: true,
    },
    memoryConfig: {
      maxEntriesHigh: 2,
      maxEntriesMedium: 1,
      maxEntriesLow: 0,
      includeTimestamps: false,
      groupByImportance: true,
    },
    customInstructions:
      language === "fr"
        ? "Analyse en détail le contenu, la structure et les améliorations possibles des scripts."
        : "Analyze in detail the content, structure and possible improvements of the scripts.",
  };

  return buildContextualPrompt(user, scripts, userMessage, options);
};

/**
 * Construit un contexte pour la génération créative
 */
export const buildCreativeContext = async (
  user: any,
  scripts: any[],
  userMessage: string,
  creativityLevel: "low" | "medium" | "high" = "medium"
): Promise<string> => {
  const language = await getUserLanguage();

  const creativityConfigs = {
    low: {
      scriptsConfig: {
        maxScripts: 8,
        includePreview: true,
        previewLength: 150,
        includeMetadata: true,
        includeWordCount: false,
      },
      memoryConfig: {
        maxEntriesHigh: 7,
        maxEntriesMedium: 5,
        maxEntriesLow: 3,
        includeTimestamps: false,
        groupByImportance: true,
      },
      customInstructions:
        language === "fr"
          ? "Reste proche du style et du contenu existant."
          : "Stay close to existing style and content.",
    },
    medium: {
      scriptsConfig: {
        maxScripts: 5,
        includePreview: true,
        previewLength: 100,
        includeMetadata: false,
        includeWordCount: false,
      },
      memoryConfig: {
        maxEntriesHigh: 5,
        maxEntriesMedium: 3,
        maxEntriesLow: 2,
        includeTimestamps: false,
        groupByImportance: true,
      },
      customInstructions:
        language === "fr"
          ? "Sois créatif tout en respectant le contexte utilisateur."
          : "Be creative while respecting user context.",
    },
    high: {
      scriptsConfig: {
        maxScripts: 3,
        includePreview: true,
        previewLength: 80,
        includeMetadata: false,
        includeWordCount: false,
      },
      memoryConfig: {
        maxEntriesHigh: 3,
        maxEntriesMedium: 2,
        maxEntriesLow: 1,
        includeTimestamps: false,
        groupByImportance: true,
      },
      customInstructions:
        language === "fr"
          ? "Sois très créatif et original, explore de nouvelles idées."
          : "Be very creative and original, explore new ideas.",
    },
  };

  return buildContextualPrompt(
    user,
    scripts,
    userMessage,
    creativityConfigs[creativityLevel]
  );
};

/**
 * Construit un contexte pour les conversations de suivi
 */
export const buildFollowUpContext = async (
  user: any,
  scripts: any[],
  userMessage: string,
  previousContext?: string
): Promise<string> => {
  const language = await getUserLanguage();

  const options: Partial<FullContextOptions> = {
    scriptsConfig: {
      maxScripts: 3,
      includePreview: true,
      previewLength: 100,
      includeMetadata: false,
      includeWordCount: false,
    },
    memoryConfig: {
      maxEntriesHigh: 8,
      maxEntriesMedium: 5,
      maxEntriesLow: 3,
      includeTimestamps: true,
      groupByImportance: true,
    },
    customInstructions:
      language === "fr"
        ? "Prends en compte le contexte de la conversation précédente."
        : "Take into account the context of the previous conversation.",
  };

  const context = await buildContextualPrompt(
    user,
    scripts,
    userMessage,
    options
  );

  if (previousContext) {
    const contextLabel =
      language === "fr" ? "Contexte précédent" : "Previous context";
    return `${context}\n\n${contextLabel}: ${previousContext.substring(
      0,
      500
    )}...`;
  }

  return context;
};
