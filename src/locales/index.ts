/**
 * Point d'entrée principal pour le système d'internationalisation
 * Centralise tous les exports des modules i18n
 */

// Export principal d'i18next
export { default as i18n } from "./i18n";
export { isI18nReady, waitForI18n, safeT } from "./i18n";

// Export des informations sur les langues
export {
  languages,
  getResourcesStats,
  isLanguageDivided,
  getLanguageInfo,
} from "./i18n";

// Export des modules individuels (si nécessaire)
export { languageDetector } from "./languageDetector";
export { getEnvironmentConfig, i18nConfig } from "./i18nConfig";
export { buildAllResources } from "./resourcesBuilder";

// Export des types
export type { TranslationKey, TranslationResource } from "./translationImports";
