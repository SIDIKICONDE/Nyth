import { translations } from "./translationImports";

/**
 * Constructeur de ressources pour les traductions
 * Fusionne les fichiers divisés en ressources complètes pour chaque langue
 */

/**
 * Fusionne tous les fichiers d'une langue divisée en un seul objet
 */
function mergeLanguageFiles(languageData: any): any {
  if (typeof languageData !== "object" || languageData === null) {
    return languageData;
  }

  const merged = {};

  // Fusionner tous les fichiers de la langue
  Object.keys(languageData).forEach((key) => {
    if (typeof languageData[key] === "object" && languageData[key] !== null) {
      Object.assign(merged, languageData[key]);
    }
  });

  return merged;
}

/**
 * Construit les ressources pour une langue modulaire
 */
const buildModularLanguageResources = (languageCode: string) => {
  const languageData = translations[languageCode as keyof typeof translations];
  return mergeLanguageFiles(languageData);
};

/**
 * Construit les ressources pour l'anglais
 */
const buildEnglishResources = () => {
  return buildModularLanguageResources("en");
};

/**
 * Construit les ressources pour le français
 */
const buildFrenchResources = () => {
  return buildModularLanguageResources("fr");
};

/**
 * Construit les ressources pour toutes les langues
 */
export const buildAllResources = () => {
  return {
    en: { translation: buildEnglishResources() },
    fr: { translation: buildFrenchResources() },
  };
};

/**
 * Construit les ressources pour une langue spécifique
 */
export const buildLanguageResources = (languageCode: string) => {
  const allResources = buildAllResources();
  return allResources[languageCode as keyof typeof allResources];
};

/**
 * Vérifie si une langue est divisée en plusieurs fichiers
 * Maintenant toutes les langues sont modulaires !
 */
export const isLanguageDivided = (languageCode: string): boolean => {
  const modularLanguages = ["en", "fr"];
  return modularLanguages.includes(languageCode);
};

/**
 * Obtient la liste des sections disponibles pour une langue divisée
 */
export const getLanguageSections = (languageCode: string): string[] => {
  if (!isLanguageDivided(languageCode)) {
    return ["translation"];
  }

  const languageData = translations[languageCode as keyof typeof translations];
  if (typeof languageData === "object" && languageData !== null) {
    return Object.keys(languageData);
  }

  return ["translation"];
};

/**
 * Statistiques sur les ressources
 */
export const getResourcesStats = () => {
  const allResources = buildAllResources();
  const stats: Record<
    string,
    { sections: number; keys: number; isDivided: boolean }
  > = {};

  Object.keys(allResources).forEach((lang) => {
    const resource = allResources[lang as keyof typeof allResources];
    const isDivided = isLanguageDivided(lang);
    const sections = getLanguageSections(lang);

    let totalKeys = 0;
    if (resource && resource.translation) {
      totalKeys = Object.keys(resource.translation).length;
    }

    stats[lang] = {
      sections: sections.length,
      keys: totalKeys,
      isDivided,
    };
  });

  return stats;
};
