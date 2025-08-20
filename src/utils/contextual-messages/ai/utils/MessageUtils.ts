import {
  ContextualMessage,
  MessageCategory,
  MessageType,
  MessageVariation,
  UserContext,
} from "@/utils/contextual-messages/types";
import { DEFAULT_EMOJIS, EXPIRATION_DAYS } from "../types/MessageConstants";

/**
 * Nettoie le texte des caractères markdown pour l'affichage en texte simple
 */
export function cleanMarkdownText(text: string): string {
  if (!text) return text;

  return (text
    // Supprimer les caractères de formatage markdown
    .replace(/\*\*\*(.*?)\*\*\*/g, "$1") // ***gras italique*** -> texte
    .replace(/\*\*(.*?)\*\*/g, "$1") // **gras** -> texte
    .replace(/\*(.*?)\*/g, "$1") // *italique* -> texte
    .replace(/_(.*?)_/g, "$1") // _souligné_ -> texte
    .replace(/`(.*?)`/g, "$1") // `code` -> texte
    .replace(/#{1,6}\s+/g, "") // # Titre -> Titre
    .replace(/^\s*[-*+]\s+/gm, "• ") // - liste -> • liste
    .replace(/^\s*\d+\.\s+/gm, "") // 1. liste -> liste
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [lien](url) -> lien
    .replace(/\n\s*\n/g, "\n\n") // Normaliser les lignes vides
    .trim());
}

/**
 * Génère un ID unique pour un message
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Obtient l'emoji par défaut pour un type de message
 */
export function getDefaultEmoji(type: MessageType): string {
  return DEFAULT_EMOJIS[type] || "📝";
}

/**
 * Détermine la priorité d'un message
 */
export function determinePriority(
  type: MessageType,
  context: UserContext
): ContextualMessage["priority"] {
  if (type === "welcome" && context.isFirstLogin) return "critical";
  if (type === "achievement" || type === "milestone") return "high";
  if (type === "re_engagement" && context.daysSinceLastLogin > 30)
    return "high";
  if (type === "tip" || type === "educational") return "medium";
  return "low";
}

/**
 * Détermine la catégorie d'un message
 */
export function determineCategory(type: MessageType): MessageCategory {
  const categoryMap: Record<MessageType, MessageCategory> = {
    welcome: "onboarding",
    motivation: "motivation",
    tip: "education",
    achievement: "achievement",
    reminder: "retention",
    celebration: "achievement",
    educational: "education",
    feature_discovery: "feature_adoption",
    milestone: "achievement",
    feedback_request: "engagement",
    re_engagement: "retention",
    seasonal: "engagement",
  };
  return categoryMap[type] || "engagement";
}

/**
 * Génère les tags pour un message
 */
export function generateTags(
  type: MessageType,
  context: UserContext
): string[] {
  const tags: string[] = [type];

  if (context.isFirstLogin) tags.push("new_user", "onboarding");
  if (context.skillLevel === "beginner") tags.push("beginner_friendly");
  if (context.skillLevel === "expert") tags.push("advanced");
  if (context.consecutiveDays > 7) tags.push("engaged_user");
  if (context.deviceType === "mobile") tags.push("mobile_optimized");

  return tags;
}

/**
 * Génère les conditions pour un message
 */
export function generateConditions(
  type: MessageType,
  context: UserContext
): ContextualMessage["conditions"] {
  const conditions: ContextualMessage["conditions"] = [];

  // Conditions basées sur le type
  if (type === "welcome") {
    conditions.push({
      type: "user_property",
      property: "isFirstLogin",
      operator: "equals",
      value: true,
      weight: 1.0,
    });
  }

  if (type === "achievement") {
    conditions.push({
      type: "achievement",
      property: "achievements.length",
      operator: "greater_than",
      value: 0,
      weight: 0.8,
    });
  }

  // Conditions contextuelles
  conditions.push({
    type: "time",
    property: "timeOfDay",
    operator: "equals",
    value: context.timeOfDay,
    weight: 0.5,
  });

  return conditions;
}

/**
 * Détermine la longueur d'un message
 */
export function determineLength(content: string): MessageVariation["length"] {
  const wordCount = content.split(/\s+/).length;
  if (wordCount < 20) return "short";
  if (wordCount < 50) return "medium";
  return "long";
}

/**
 * Définit l'audience cible
 */
export function defineTargetAudience(
  message: ContextualMessage,
  context: UserContext
): string[] {
  const audience: string[] = [];

  audience.push(context.skillLevel);

  if (message.type === "educational" && context.skillLevel === "beginner") {
    audience.push("learners");
  }

  if (context.engagementScore > 70) {
    audience.push("power_users");
  }

  return audience;
}

/**
 * Définit l'audience à exclure
 */
export function defineExcludeAudience(
  message: ContextualMessage,
  context: UserContext
): string[] {
  const exclude: string[] = [];

  if (message.type === "welcome" && !context.isFirstLogin) {
    exclude.push("existing_users");
  }

  if (message.type === "educational" && context.skillLevel === "expert") {
    exclude.push("expert");
  }

  return exclude;
}

/**
 * Calcule la date d'expiration d'un message
 */
export function calculateExpiration(type: MessageType): string | undefined {
  const days = EXPIRATION_DAYS[type];
  if (!days) return undefined;

  const expiration = new Date();
  expiration.setDate(expiration.getDate() + days);
  return expiration.toISOString();
}

/**
 * Vérifie si l'utilisateur a un accomplissement récent
 */
export function hasRecentAchievement(context: UserContext): boolean {
  const recentAchievements = context.achievements.filter((a) => {
    const daysSince =
      (Date.now() - new Date(a.unlockedAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince < 7;
  });
  return recentAchievements.length > 0;
}

/**
 * Vérifie si l'utilisateur est proche d'un milestone
 */
export function isNearMilestone(context: UserContext): boolean {
  return context.milestoneProgress.some(
    (m) => m.progress > 0.8 && m.progress < 1
  );
}
