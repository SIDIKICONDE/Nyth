import { ContextResult, FullContextOptions } from "./types";

import { buildPlanningInstructions } from "./builders";
import {
  assembleSections,
  buildAllContextSections,
  createContextMetadata,
} from "./contextAssembler";
import { getUserLanguage } from "./language";
import { DEFAULT_MEMORY_CONFIG } from "./memoryContext";
import { DEFAULT_SCRIPTS_CONFIG } from "./scriptsContext";
import {
  DEFAULT_USER_CONFIG,
  buildTransparencyInstructions,
} from "./userProfile";

/**
 * Construit le prompt contextuel complet (fonction principale)
 */
export const buildContextualPrompt = async (
  user: any,
  scripts: any[],
  userMessage: string,
  options?: Partial<FullContextOptions>
): Promise<string> => {
  // Configuration par défaut
  const config: FullContextOptions = {
    user,
    scripts,
    language: await getUserLanguage(),
    userConfig: { ...DEFAULT_USER_CONFIG, ...options?.userConfig },
    scriptsConfig: { ...DEFAULT_SCRIPTS_CONFIG, ...options?.scriptsConfig },
    memoryConfig: { ...DEFAULT_MEMORY_CONFIG, ...options?.memoryConfig },
    customInstructions: options?.customInstructions,
  };

  // Construire toutes les sections
  const {
    userContext,
    scriptsContext,
    memoryContext,
    planningContext,
    videosContext,
    texts,
    language,
    userName,
  } = await buildAllContextSections(user, scripts, userMessage, config);

  // Instructions finales
  const transparencyInstructions = buildTransparencyInstructions(
    userName,
    language,
    config.userConfig!.mentionAppName
  );

  // Instructions de planification simplifiées
  const planningInstructions = buildPlanningInstructions(language);

  let instructions = `${transparencyInstructions}${planningInstructions}`;

  if (config.customInstructions) {
    instructions += ` ${config.customInstructions}`;
  }

  // Assembler le contexte complet
  const assembled = assembleSections(
    instructions,
    memoryContext,
    userContext,
    scriptsContext,
    planningContext,
    videosContext,
    userMessage,
    texts.userQuestion
  );

  const addressPolicy = `\n\nADDRESSING POLICY:\n- Use the user's first name only when it adds warmth or clarity.\n- Prefer natural pronouns in follow-ups; do not repeat the name in every message.\n`;
  return `${assembled}${addressPolicy}`;
};

/**
 * Construit un contexte complet avec métadonnées détaillées
 */
export const buildFullContextWithMetadata = async (
  user: any,
  scripts: any[],
  userMessage: string,
  options?: Partial<FullContextOptions>
): Promise<ContextResult> => {
  // Configuration par défaut
  const config: FullContextOptions = {
    user,
    scripts,
    language: await getUserLanguage(),
    userConfig: { ...DEFAULT_USER_CONFIG, ...options?.userConfig },
    scriptsConfig: { ...DEFAULT_SCRIPTS_CONFIG, ...options?.scriptsConfig },
    memoryConfig: { ...DEFAULT_MEMORY_CONFIG, ...options?.memoryConfig },
    customInstructions: options?.customInstructions,
  };

  // Construire toutes les sections
  const {
    userContext,
    scriptsContext,
    memoryContext,
    planningContext,
    videosContext,
    texts,
    language,
    userName,
  } = await buildAllContextSections(user, scripts, userMessage, config);

  // Instructions
  const transparencyInstructions = buildTransparencyInstructions(
    userName,
    language,
    config.userConfig!.mentionAppName
  );

  let instructions = `${transparencyInstructions}`;

  if (config.customInstructions) {
    instructions += ` ${config.customInstructions}`;
  }

  // Contexte complet
  const fullContext = assembleSections(
    instructions,
    memoryContext,
    userContext,
    scriptsContext,
    planningContext,
    videosContext,
    userMessage,
    texts.userQuestion
  );

  // Métadonnées
  const metadata = createContextMetadata(
    language,
    scripts,
    memoryContext,
    fullContext,
    [
      instructions,
      memoryContext,
      userContext,
      scriptsContext,
      planningContext,
      videosContext,
      `${texts.userQuestion}: ${userMessage}`,
    ]
  );

  return {
    userContext,
    scriptsContext,
    memoryContext,
    instructions,
    fullContext,
    metadata,
  };
};

// Compatibilité avec l'ancien système
export { getUserLanguage } from "./language";
export { buildMemoryContext } from "./memoryContext";
export { buildScriptsContext } from "./scriptsContext";

// Exports des nouvelles fonctions
export {
  buildAdaptiveContext,
  buildOptimizedContext,
  buildSmartAdaptiveContext,
} from "./adaptiveContextBuilder";
export {
  estimateTokens,
  exceedsTokenLimit,
  optimizeContext,
  progressiveOptimization,
  truncateToTokenLimit,
} from "./contextOptimizer";
export { buildMinimalContext } from "./minimalContextBuilder";
export {
  buildCreativeContext,
  buildFollowUpContext,
  buildScriptAnalysisContext,
  buildSpecializedContext,
} from "./specializedContextBuilder";
