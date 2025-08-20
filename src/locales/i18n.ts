import i18next from "i18next";
import { initReactI18next } from "react-i18next";

// Import des modules refactorisés
import { getEnvironmentConfig } from "./i18nConfig";
import { languageDetector } from "./languageDetector";
import { buildAllResources } from "./resourcesBuilder";

// Export des configurations et utilitaires
export { languages, type LanguageInfo } from "./languageConfig";
export { getResourcesStats, isLanguageDivided } from "./resourcesBuilder";
export { getLanguageInfo } from "./languageConfig";

// Variable pour suivre l'état d'initialisation
let isInitializing = false;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Initialisation d'i18next avec gestion complète de l'asynchronisme
 */
const initializeI18n = async (): Promise<void> => {
  if (isInitialized) {
    return;
  }

  if (isInitializing) {
    return initializationPromise || Promise.resolve();
  }

  isInitializing = true;

  initializationPromise = new Promise<void>((resolve, reject) => {
    try {
      // Construction des ressources
      const resources = buildAllResources();

      // Configuration selon l'environnement
      const config = getEnvironmentConfig();

      // Initialisation asynchrone
      i18next
        .use(languageDetector)
        .use(initReactI18next)
        .init({
          ...config,
          resources,
          // Permettre l'initialisation asynchrone
          initImmediate: false,
        })
        .then(() => {
        isInitialized = true;
        isInitializing = false;
        resolve();
      })
        .catch((error) => {
        isInitializing = false;
        reject(error);
      });
    } catch (error) {
      isInitializing = false;
      reject(error);
    }
  });

  return initializationPromise;
};

/**
 * Vérifier si i18next est prêt à être utilisé
 */
export const isI18nReady = (): boolean => {
  return isInitialized && i18next.isInitialized;
};

/**
 * Attendre que i18next soit prêt
 */
export const waitForI18n = async (): Promise<void> => {
  if (isI18nReady()) {
    return;
  }

  if (!isInitializing && !isInitialized) {
    await initializeI18n();
  } else if (initializationPromise) {
    await initializationPromise;
  }
};

/**
 * Obtenir une traduction de manière sécurisée
 */
export const safeT = (key: string, fallback?: string): string => {
  if (!isI18nReady()) {
    return fallback || key;
  }

  try {
    const translation = i18next.t(key);
    // Si la traduction retourne la clé, utiliser le fallback
    if (translation === key && fallback) {
      return fallback;
    }
    return translation;
  } catch (error) {
    return fallback || key;
  }
};

// Initialiser immédiatement et de manière asynchrone
initializeI18n().catch((error) => {});

export default i18next;
