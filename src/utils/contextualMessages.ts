/**
 * Fichier de compatibilité pour l'ancien système de messages contextuels
 * Réexporte tout depuis la nouvelle architecture modulaire
 */

// Réexporter tout depuis le nouveau système modulaire
export {
  ContextualMessageGenerator,
  ContextualMessageSystem,
  contextualMessageSystem,
  type ContextualMessage,
  type MessageCategory,
  type MessageCondition,
  type MessageInteraction,
  type MessageMetadata,
  type MessagePriority,
  type MessageScore,
  type MessageType,
  type MessageVariation,
  type UserContext,
} from "./contextual-messages";
