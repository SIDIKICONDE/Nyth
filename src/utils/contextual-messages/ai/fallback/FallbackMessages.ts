import { MessageType } from "@/utils/contextual-messages/types";
import i18n from "i18next";
import { getDeviceLanguage } from "@/utils/languageDetector";

/**
 * Récupère un message de fallback traduit dynamiquement.
 */
export const getFallbackMessage = (
  type: MessageType,
  language?: string
): { title: string; message: string } => {
  const lng = language || getDeviceLanguage();
  const t = i18n.getFixedT(lng, "fallback");

  return {
    title: t(`${type}.title`),
    message: t(`${type}.message`),
  };
};

/**
 * Pour la compatibilité, on peut exposer un objet contenant les messages dans la langue par défaut,
 * mais la méthode dynamique est recommandée.
 */
export const FALLBACK_MESSAGES = {
  welcome: getFallbackMessage("welcome"),
  motivation: getFallbackMessage("motivation"),
  tip: getFallbackMessage("tip"),
  achievement: getFallbackMessage("achievement"),
  reminder: getFallbackMessage("reminder"),
  celebration: getFallbackMessage("celebration"),
  educational: getFallbackMessage("educational"),
  feature_discovery: getFallbackMessage("feature_discovery"),
  milestone: getFallbackMessage("milestone"),
  feedback_request: getFallbackMessage("feedback_request"),
  re_engagement: getFallbackMessage("re_engagement"),
  seasonal: getFallbackMessage("seasonal"),
};
