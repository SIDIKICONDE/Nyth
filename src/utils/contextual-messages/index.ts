/**
 * Point d'entrée principal pour le système de messages contextuels
 */

// Export du système principal
export { ContextualMessageSystem } from "./core/ContextualMessageSystem";

// Export de l'API de compatibilité
export { ContextualMessageGenerator } from "./compatibility/LegacyAPI";

// Export des utilitaires
export {
  detectSystemLanguage,
  generateCacheKey,
  getCurrentUserId,
  getMessageTypeFromId,
  getTimeGreeting,
  getTimeGreetingSync,
  replacePersonalizationTokens,
} from "./utils/MessageUtils";

export {
  EMERGENCY_MESSAGES,
  SUPPORTED_LANGUAGES,
  getEmergencyMessage,
  getLocalizedGreeting,
  getLocalizedText,
  getUserPreferredLanguage,
  isSupportedLanguage,
  type SupportedLanguage,
} from "./utils/LanguageUtils";

export { cleanMarkdownText } from "./utils/TextCleaner";

// Export des types
export type {
  ContextualMessage,
  MessageCategory,
  MessageCondition,
  MessageInteraction,
  MessageMetadata,
  MessagePriority,
  MessageScore,
  MessageType,
  MessageVariation,
  UserContext,
} from "./types";

// Export de l'instance singleton pour faciliter l'utilisation
import { ContextualMessageSystem } from "./core/ContextualMessageSystem";
export const contextualMessageSystem = ContextualMessageSystem.getInstance();
