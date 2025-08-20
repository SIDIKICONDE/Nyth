import { MessageType } from "@/utils/contextual-messages/types";
import i18n from "i18next";
import { getDeviceLanguage } from "@/utils/languageDetector";

/**
 * Emojis par défaut pour chaque type de message
 */
export const DEFAULT_EMOJIS: Record<MessageType, string> = {
  welcome: "👋",
  motivation: "💪",
  tip: "💡",
  achievement: "🏆",
  reminder: "⏰",
  celebration: "🎉",
  educational: "📚",
  feature_discovery: "✨",
  milestone: "🎯",
  feedback_request: "💭",
  re_engagement: "🔄",
  seasonal: "🎄",
};

/**
 * Jours d'expiration par type de message
 */
export const EXPIRATION_DAYS: Partial<Record<MessageType, number>> = {
  seasonal: 30,
  welcome: 1,
  re_engagement: 7,
};

/**
 * Types de messages par défaut
 */
export const DEFAULT_MESSAGE_TYPES: MessageType[] = [
  "motivation",
  "tip",
  "reminder",
];

/**
 * Clés des tons de variation disponibles
 */
export const VARIATION_TONE_KEYS = [
  "formal",
  "casual",
  "motivational",
  "educational",
] as const;

/**
 * Obtient les tons de variation traduits
 */
export const getTranslatedVariationTones = (
  language?: string
): { key: (typeof VARIATION_TONE_KEYS)[number]; label: string }[] => {
  const lng = language || getDeviceLanguage();
  const t = i18n.getFixedT(lng, "tones");

  return VARIATION_TONE_KEYS.map((key) => ({
    key,
    label: t(`tones:${key}`),
  }));
};
