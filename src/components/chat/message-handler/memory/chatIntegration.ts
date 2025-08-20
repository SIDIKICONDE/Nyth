/**
 * Intégration du système de mémoire dans le chat existant
 * Utilise le système d'analyse RegEx pour la mémoire IA
 */

// Fallback RegEx désactivé: on ne l'utilise plus

/**
 * Configuration pour l'environnement de production
 */
const PRODUCTION_CONFIG = {
  fallbackToRegex: true,
  minConfidence: 0.7, // Plus strict en production
  enableDebug: false, // Pas de debug en production
};

/**
 * Configuration pour l'environnement de développement
 */
const DEVELOPMENT_CONFIG = {
  fallbackToRegex: true,
  minConfidence: 0.5, // Plus permissif en dev
  enableDebug: true, // Debug activé en dev
};

/**
 * Obtient la configuration selon l'environnement
 */
const getEnvironmentConfig = () => {
  const isDev = process.env.NODE_ENV === "development";
  return isDev ? DEVELOPMENT_CONFIG : PRODUCTION_CONFIG;
};

/**
 * Fonction principale d'analyse pour le chat
 * À intégrer dans le message handler existant
 */
export const analyzeChatMessage = async (
  userId: string,
  userMessage: string,
  user?: any,
  options?: {
    forceRegex?: boolean;
    customConfig?: any;
  }
): Promise<{
  analyzed: boolean;
  method: "failed" | "disabled" | "filtered";
  confidence?: number;
  processingTime: number;
}> => {
  const startTime = Date.now();

  try {
    const processingTime = Date.now() - startTime;

    return {
      analyzed: false,
      method: "failed",
      processingTime,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;

    return {
      analyzed: false,
      method: "failed",
      processingTime,
    };
  }
};

/**
 * Exemples d'utilisation dans le code existant
 */
export const integrationExamples = {
  // Dans un message handler existant
  handleUserMessage: async (userId: string, message: string, user: any) => {
    // Analyser le message pour la mémoire
    const analysisResult = await analyzeChatMessage(userId, message, user);

    if (analysisResult.analyzed) {}

    // Continuer avec le traitement normal du message...
  },
};

export default {
  analyzeChatMessage,
  integrationExamples,
};
