import { buildPlanningContext, buildVideosContext } from "./builders";
import { getLocalizedTexts, getUserLanguage } from "./language";
import { buildMemoryContext } from "./memoryContext";
import { buildScriptsContext } from "./scriptsContext";
import { FullContextOptions } from "./types";
import { buildUserProfileContext, getUserDisplayName } from "./userProfile";

/**
 * Assemble les sections de contexte dans l'ordre optimal
 */
export const assembleSections = (
  instructions: string,
  memoryContext: string,
  userContext: string,
  scriptsContext: string,
  planningContext: string,
  videosContext: string,
  userMessage: string,
  userQuestionLabel: string
): string => {
  // PLACE MÉMOIRE EN TÊTE POUR LA PRIORISER
  const sections = [
    instructions,
    memoryContext, // 🧠 Mémoire maintenant juste après les instructions
    userContext,
    scriptsContext,
    planningContext,
    videosContext,
    `${userQuestionLabel}: ${userMessage}`,
  ].filter((section) => section.trim().length > 0);

  return sections.join("\n\n");
};

/**
 * Assemble les sections pour un contexte minimal
 */
export const assembleMinimalSections = (sections: string[]): string => {
  return sections.filter((section) => section.trim().length > 0).join("\n\n");
};

/**
 * Construit toutes les sections de contexte
 */
export const buildAllContextSections = async (
  user: any,
  scripts: any[],
  userMessage: string,
  config: FullContextOptions
) => {
  const language = await getUserLanguage();
  const userName = getUserDisplayName(user);
  const texts = getLocalizedTexts(language);

  // Construire chaque section
  const userContext = buildUserProfileContext(
    user,
    language,
    config.userConfig!
  );

  const scriptsContext = buildScriptsContext(
    user,
    scripts,
    language,
    config.scriptsConfig!
  );

  const memoryContext = await buildMemoryContext(
    user?.uid || "",
    language,
    userName,
    config.memoryConfig!
  );

  // Ajouter le contexte de planification
  const planningContext = await buildPlanningContext(user, language);

  // Ajouter le contexte des vidéos
  const videosContext = await buildVideosContext(user, language);

  return {
    userContext,
    scriptsContext,
    memoryContext,
    planningContext,
    videosContext,
    texts,
    language,
    userName,
  };
};

/**
 * Crée les métadonnées pour un contexte
 */
export const createContextMetadata = (
  language: string,
  scripts: any[],
  memoryContext: string,
  fullContext: string,
  sections: string[]
) => {
  return {
    language,
    userHasScripts: scripts && scripts.length > 0,
    userHasMemory:
      memoryContext.includes("MÉMOIRE") || memoryContext.includes("MEMORY"),
    totalLength: fullContext.length,
    sections: sections.map((_, index) => {
      const sectionNames = [
        "instructions",
        "memory",
        "userProfile",
        "scripts",
        "planning",
        "videos",
        "userQuestion",
      ];
      return sectionNames[index] || `section${index}`;
    }),
  };
};
