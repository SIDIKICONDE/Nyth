/**
 * Configuration centralisée de l'application
 *
 * @example
 * // Pour désactiver les mentions du nom de l'application par l'IA :
 * APP_CONFIG.AI.MENTION_APP_NAME = false;
 *
 * // Pour utiliser dans un composant :
 * import { useAppConfig } from '../hooks/useAppConfig';
 * const { shouldMentionAppName, getAppName } = useAppConfig();
 */

export const APP_CONFIG = {
  // Nom de l'application
  APP_NAME: "Visions",

  // Nom alternatif/technique
  TECHNICAL_NAME: "Visions",

  // Version
  VERSION: "1.0.1",

  // Informations de contact
  CONTACT: {
    EMAIL: "conde.sidiki@outlook.fr",
    ADDRESS: "221 route de Schirmeck, 67200 Strasbourg, France",
  },

  // Configuration IA
  AI: {
    // Contrôle si l'IA doit mentionner le nom de l'application
    MENTION_APP_NAME: false,

    // Nom à utiliser si l'IA doit se présenter
    ASSISTANT_NAME: "Visions AI",

    // Contexte de présentation
    PRESENTATION_CONTEXT: {
      fr: "Je suis votre assistant IA intégré",
      en: "I am your integrated AI assistant",
    },
  },
} as const;

// Types pour la sécurité TypeScript
export type AppConfig = typeof APP_CONFIG;
export type SupportedLanguage = keyof typeof APP_CONFIG.AI.PRESENTATION_CONTEXT;
