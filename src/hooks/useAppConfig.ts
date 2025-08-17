import { APP_CONFIG, SupportedLanguage } from "../config/appConfig";

/**
 * Hook pour accéder à la configuration de l'application
 */
export const useAppConfig = () => {
  /**
   * Obtient le nom de l'application à afficher
   */
  const getAppName = () => APP_CONFIG.APP_NAME;

  /**
   * Obtient le nom technique de l'application
   */
  const getTechnicalName = () => APP_CONFIG.TECHNICAL_NAME;

  /**
   * Vérifie si l'IA doit mentionner le nom de l'application
   */
  const shouldMentionAppName = () => APP_CONFIG.AI.MENTION_APP_NAME;

  /**
   * Obtient le nom de l'assistant IA
   */
  const getAssistantName = () => APP_CONFIG.AI.ASSISTANT_NAME;

  /**
   * Obtient le contexte de présentation de l'IA selon la langue
   */
  const getPresentationContext = (language: SupportedLanguage) => {
    return (
      APP_CONFIG.AI.PRESENTATION_CONTEXT[language] ||
      APP_CONFIG.AI.PRESENTATION_CONTEXT.en
    );
  };

  /**
   * Obtient les informations de contact
   */
  const getContactInfo = () => APP_CONFIG.CONTACT;

  /**
   * Obtient la version de l'application
   */
  const getVersion = () => APP_CONFIG.VERSION;

  return {
    // Getters
    getAppName,
    getTechnicalName,
    shouldMentionAppName,
    getAssistantName,
    getPresentationContext,
    getContactInfo,
    getVersion,

    // Configuration complète pour les cas avancés
    config: APP_CONFIG,
  };
};
