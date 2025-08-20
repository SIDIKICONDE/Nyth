/**
 * Configuration des langues disponibles dans l'application
 */

export interface LanguageInfo {
  code: string;
  name: string;
  flag: string;
  isDivided?: boolean;
}

/**
 * Liste des langues supportées avec leurs informations
 */
export const languages: LanguageInfo[] = [
  { code: "en", name: "English", flag: "🇬🇧", isDivided: true },
  { code: "fr", name: "Français", flag: "🇫🇷", isDivided: true },
];

/**
 * Langues avec support RTL (Right-to-Left)
 * Note: Aucune langue RTL n'est actuellement supportée
 */
export const rtlLanguages: string[] = [];

/**
 * Langues divisées en plusieurs fichiers
 */
export const dividedLanguages = languages
  .filter((lang) => lang.isDivided)
  .map((lang) => lang.code);

/**
 * Langue par défaut de l'application (sera remplacée par la langue du système)
 */
export const defaultLanguage = "en";

/**
 * Obtient les informations d'une langue par son code
 */
export const getLanguageInfo = (code: string): LanguageInfo | undefined => {
  return languages.find((lang) => lang.code === code);
};

/**
 * Vérifie si une langue est supportée
 */
export const isLanguageSupported = (code: string): boolean => {
  return languages.some((lang) => lang.code === code);
};

/**
 * Obtient la liste des codes de langues supportées
 */
export const getSupportedLanguageCodes = (): string[] => {
  return languages.map((lang) => lang.code);
};

/**
 * Obtient la langue par défaut si la langue demandée n'est pas supportée
 */
export const getValidLanguage = (code: string): string => {
  return isLanguageSupported(code) ? code : defaultLanguage;
};
