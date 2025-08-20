/**
 * @fileoverview Gestionnaire d'erreurs pour le traitement des messages
 * Centralise la gestion et le formatage des erreurs
 */

import { createLogger } from "@/utils/optimizedLogger";

const logger = createLogger("ErrorHandler");

/**
 * Types d'erreurs reconnues
 */
export enum ErrorType {
  AUTH_ERROR = "AUTH_ERROR",
  MODEL_ERROR = "MODEL_ERROR",
  CONFIG_ERROR = "CONFIG_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Messages d'erreur localisés
 */
export const ERROR_MESSAGES = {
  [ErrorType.AUTH_ERROR]: {
    fr: "❌ Erreur d'authentification. Veuillez vérifier vos clés API dans les paramètres.",
    en: "❌ Authentication error. Please check your API keys in settings.",
    es: "❌ Error de autenticación. Verifique sus claves API en la configuración.",
  },
  [ErrorType.MODEL_ERROR]: {
    fr: "❌ Erreur du modèle IA. Veuillez réessayer ou changer de modèle.",
    en: "❌ AI model error. Please try again or change model.",
    es: "❌ Error del modelo de IA. Inténtelo de nuevo o cambie de modelo.",
  },
  [ErrorType.CONFIG_ERROR]: {
    fr: "❌ Aucun service IA configuré. Veuillez configurer au moins une clé API (ex: Gemini gratuit) et activer le service dans les paramètres.",
    en: "❌ No AI service configured. Please configure an API key in settings.",
    es: "❌ Ningún servicio de IA configurado. Configure una clave API en la configuración.",
  },
  [ErrorType.NETWORK_ERROR]: {
    fr: "❌ Erreur de connexion. Vérifiez Internet ou réessayez. Si le problème persiste, ouvrez AI Settings et testez un provider.",
    en: "❌ Connection error. Check your internet connection.",
    es: "❌ Error de conexión. Verifique su conexión a internet.",
  },
  [ErrorType.UNKNOWN_ERROR]: {
    fr: "❌ Une erreur est survenue. Ouvrez AI Settings pour vérifier vos clés et l'état réseau, puis réessayez.",
    en: "❌ An error occurred while processing your message. Please try again.",
    es: "❌ Ocurrió un error al procesar su mensaje. Inténtelo de nuevo.",
  },
} as const;

/**
 * Détermine le type d'erreur à partir du message d'erreur
 */
export function categorizeError(error: Error | string): ErrorType {
  const errorMsg = error instanceof Error ? error.message : String(error);
  const lowerMsg = errorMsg.toLowerCase();

  if (
    lowerMsg.includes("aucun service ai configuré") ||
    lowerMsg.includes("no ai service") ||
    lowerMsg.includes("not configured") ||
    lowerMsg.includes("aucun service ia configuré") ||
    lowerMsg.includes("configure une clé api") ||
    lowerMsg.includes("aucun fournisseur activé") ||
    lowerMsg.includes("aucun provider activé") ||
    lowerMsg.includes("no providers") ||
    lowerMsg.includes("no provider enabled") ||
    lowerMsg.includes("no provider configured") ||
    lowerMsg.includes("aucune clé api configurée") ||
    lowerMsg.includes("no api key configured")
  ) {
    return ErrorType.CONFIG_ERROR;
  }

  if (
    lowerMsg.includes("auth_error") ||
    lowerMsg.includes("invalid or expired") ||
    lowerMsg.includes("unauthorized") ||
    lowerMsg.includes("api key") ||
    lowerMsg.includes("clé api") ||
    lowerMsg.includes("clés api") ||
    lowerMsg.includes("cle api") ||
    lowerMsg.includes("forbidden") ||
    lowerMsg.includes("401") ||
    lowerMsg.includes("403")
  ) {
    return ErrorType.AUTH_ERROR;
  }

  if (
    lowerMsg.includes("model_error") ||
    lowerMsg.includes("model") ||
    lowerMsg.includes("completion")
  ) {
    return ErrorType.MODEL_ERROR;
  }

  if (
    lowerMsg.includes("network") ||
    lowerMsg.includes("connection") ||
    lowerMsg.includes("connexion") ||
    lowerMsg.includes("réseau") ||
    lowerMsg.includes("timeout") ||
    lowerMsg.includes("fetch") ||
    lowerMsg.includes("failed to fetch") ||
    lowerMsg.includes("offline") ||
    lowerMsg.includes("hors ligne") ||
    lowerMsg.includes("impossible de se connecter") ||
    lowerMsg.includes("server error")
  ) {
    return ErrorType.NETWORK_ERROR;
  }

  return ErrorType.UNKNOWN_ERROR;
}

/**
 * Formate un message d'erreur pour l'utilisateur
 */
export function formatErrorMessage(
  error: Error | string,
  userLanguage: string = "fr"
): string {
  const errorType = categorizeError(error);
  const lang =
    userLanguage as keyof (typeof ERROR_MESSAGES)[ErrorType.AUTH_ERROR];

  // Fallback sur le français si la langue n'est pas supportée
  const supportedLang = ERROR_MESSAGES[errorType][lang] ? lang : "fr";

  logger.error("Erreur formatée:", {
    type: errorType,
    language: supportedLang,
    originalError: error instanceof Error ? error.message : error,
  });

  return ERROR_MESSAGES[errorType][supportedLang];
}

/**
 * Gère une erreur dans le contexte du traitement des messages
 */
export function handleMessageProcessingError(
  error: Error | string,
  context: {
    userId?: string;
    messageLength?: number;
    userLanguage?: string;
  } = {}
): string {
  const { userId, messageLength, userLanguage = "fr" } = context;

  logger.error("Erreur lors du traitement du message:", {
    error: error instanceof Error ? error.message : error,
    userId: userId?.substring(0, 8) + "..." || "unknown",
    messageLength: messageLength || 0,
    userLanguage,
  });

  return formatErrorMessage(error, userLanguage);
}
