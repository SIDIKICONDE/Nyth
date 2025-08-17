import { InitOptions } from "i18next";
import { defaultLanguage } from "./languageConfig";

/**
 * Configuration principale pour i18next
 */
export const i18nConfig: InitOptions = {
  fallbackLng: defaultLanguage,
  debug: false,
  saveMissing: true, // ✅ active la détection des clés manquantes

  interpolation: {
    escapeValue: false, // React échappe déjà les valeurs
  },

  react: {
    useSuspense: false, // Désactive Suspense pour React Native
  },

  returnObjects: true, // Permet de retourner des objets complexes
  returnNull: false, // Ne retourne pas null pour les clés manquantes
  returnEmptyString: false, // Ne retourne pas de chaîne vide

  // Gestion des clés manquantes
  missingKeyHandler: (
    lng: string | readonly string[],
    ns: string,
    key: string,
    fallbackValue: string
  ) => {
    const language = Array.isArray(lng) ? lng[0] : lng;

    // Log seulement pour les langues principales
    if (language === "fr" || language === "en") {}
  },

  // Configuration des namespaces
  defaultNS: "translation",
  ns: ["translation"],

  // Configuration du cache
  cleanCode: true,

  // Configuration de la détection de langue
  detection: {
    // Ordre de détection des langues
    order: ["localStorage", "navigator", "htmlTag", "path", "subdomain"],

    // Clés de stockage
    lookupLocalStorage: "userLanguage",

    // Cache la langue détectée
    caches: ["localStorage"],

    // Exclure certaines langues de la détection automatique
    excludeCacheFor: ["cimode"],
  },
};

/**
 * Configuration spécifique pour le développement
 */
export const developmentConfig: Partial<InitOptions> = {
  debug: true,
  saveMissing: true,

  // Affichage des clés manquantes en développement
  missingKeyHandler: (lng, ns, key, fallbackValue) => {},
};

/**
 * Configuration spécifique pour la production
 */
export const productionConfig: Partial<InitOptions> = {
  debug: false,
  saveMissing: false,

  // Pas de logs en production
  missingKeyHandler: () => {
    // Silencieux en production
  },
};

/**
 * Obtient la configuration selon l'environnement
 */
export const getEnvironmentConfig = (): InitOptions => {
  const isDevelopment = __DEV__;
  const envConfig = isDevelopment ? developmentConfig : productionConfig;

  return {
    ...i18nConfig,
    ...envConfig,
  };
};
