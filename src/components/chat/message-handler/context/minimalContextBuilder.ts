import { assembleMinimalSections } from "./contextAssembler";
import { getLocalizedTexts, getUserLanguage } from "./language";
import { buildMinimalMemoryContext } from "./memoryContext";
import { getUserDisplayName } from "./userProfile";

/**
 * Construit un contexte minimal (pour économiser les tokens)
 */
export const buildMinimalContext = async (
  user: any,
  scripts: any[],
  userMessage: string,
  options?: {
    includeUserProfile?: boolean;
    maxScripts?: number;
    maxMemoryEntries?: number;
  }
): Promise<string> => {
  const language = await getUserLanguage();
  const userName = getUserDisplayName(user);
  const texts = getLocalizedTexts(language);

  const sections: string[] = [];

  // Profil utilisateur minimal
  if (options?.includeUserProfile !== false && userName) {
    sections.push(
      language === "fr" ? `Utilisateur: ${userName}` : `User: ${userName}`
    );
  }

  // Scripts limités
  if (scripts && scripts.length > 0) {
    const maxScripts = options?.maxScripts || 3;
    const limitedScripts = scripts.slice(0, maxScripts);

    const scriptsInfo =
      language === "fr"
        ? `Scripts (${scripts.length} total, ${limitedScripts.length} affichés):`
        : `Scripts (${scripts.length} total, ${limitedScripts.length} shown):`;

    const scriptsList = limitedScripts
      .map((script, index) => `${index + 1}. "${script.title}"`)
      .join("\n");

    sections.push(`${scriptsInfo}\n${scriptsList}`);
  }

  // Mémoire essentielle
  if (user?.uid) {
    const minimalMemory = await buildMinimalMemoryContext(
      user.uid,
      language,
      userName,
      options?.maxMemoryEntries || 3
    );

    if (
      minimalMemory &&
      !minimalMemory.includes("Aucune") &&
      !minimalMemory.includes("No")
    ) {
      sections.push(minimalMemory);
    }
  }

  // Question utilisateur
  sections.push(`${texts.userQuestion}: ${userMessage}`);

  // Pas d'instruction de langue explicite

  return assembleMinimalSections(sections);
};

/**
 * Construit un contexte ultra-minimal (pour les cas d'urgence)
 */
export const buildUltraMinimalContext = async (
  user: any,
  scripts: any[],
  userMessage: string
): Promise<string> => {
  const language = await getUserLanguage();
  const userName = getUserDisplayName(user);
  const texts = getLocalizedTexts(language);

  const sections: string[] = [];

  // Juste le nom d'utilisateur
  if (userName) {
    sections.push(
      language === "fr" ? `Utilisateur: ${userName}` : `User: ${userName}`
    );
  }

  // Un seul script si disponible
  if (scripts && scripts.length > 0) {
    const script = scripts[0];
    sections.push(
      language === "fr"
        ? `Script récent: "${script.title}"`
        : `Recent script: "${script.title}"`
    );
  }

  // Question utilisateur
  sections.push(`${texts.userQuestion}: ${userMessage}`);

  // Pas d'instruction de langue explicite

  return assembleMinimalSections(sections);
};

/**
 * Construit un contexte minimal focalisé sur un aspect spécifique
 */
export const buildFocusedMinimalContext = async (
  user: any,
  scripts: any[],
  userMessage: string,
  focus: "scripts" | "memory" | "user"
): Promise<string> => {
  const language = await getUserLanguage();
  const userName = getUserDisplayName(user);
  const texts = getLocalizedTexts(language);

  const sections: string[] = [];

  // Profil utilisateur (toujours inclus)
  if (userName) {
    sections.push(
      language === "fr" ? `Utilisateur: ${userName}` : `User: ${userName}`
    );
  }

  switch (focus) {
    case "scripts":
      if (scripts && scripts.length > 0) {
        const topScripts = scripts.slice(0, 5);
        const scriptsInfo =
          language === "fr"
            ? `Scripts principaux (${topScripts.length}/${scripts.length}):`
            : `Main scripts (${topScripts.length}/${scripts.length}):`;

        const scriptsList = topScripts
          .map((script, index) => `${index + 1}. "${script.title}"`)
          .join("\n");

        sections.push(`${scriptsInfo}\n${scriptsList}`);
      }
      break;

    case "memory":
      if (user?.uid) {
        const minimalMemory = await buildMinimalMemoryContext(
          user.uid,
          language,
          userName,
          5
        );

        if (
          minimalMemory &&
          !minimalMemory.includes("Aucune") &&
          !minimalMemory.includes("No")
        ) {
          sections.push(minimalMemory);
        }
      }
      break;

    case "user":
      // Focus sur l'utilisateur - déjà inclus au début
      break;
  }

  // Question utilisateur
  sections.push(`${texts.userQuestion}: ${userMessage}`);

  // Pas d'instruction de langue explicite

  return assembleMinimalSections(sections);
};

/**
 * Construit un contexte minimal adaptatif selon la longueur du message
 */
export const buildAdaptiveMinimalContext = async (
  user: any,
  scripts: any[],
  userMessage: string,
  maxLength: number = 1000
): Promise<string> => {
  // Commencer par le contexte ultra-minimal
  const context = await buildUltraMinimalContext(user, scripts, userMessage);

  if (context.length <= maxLength) {
    // Essayer d'ajouter plus de contenu
    const expandedContext = await buildMinimalContext(
      user,
      scripts,
      userMessage,
      {
        maxScripts: 2,
        maxMemoryEntries: 2,
      }
    );

    if (expandedContext.length <= maxLength) {
      return expandedContext;
    }
  }

  return context;
};
