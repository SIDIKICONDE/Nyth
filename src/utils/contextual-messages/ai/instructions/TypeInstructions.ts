import { MessageType, UserContext } from "@/utils/contextual-messages/types";
import i18n from "i18next";

/**
 * Obtient les instructions spécifiques pour chaque type de message
 */
export function getTypeSpecificInstructions(
  type: MessageType,
  context: UserContext,
  language: string
): string {
  const t = i18n.getFixedT(language, "instructions");
  return t(`instructions:${type}`);
}

/**
 * Obtient le contexte temporel adaptatif
 */
export function getTimeContext(
  timeOfDay: UserContext["timeOfDay"],
  language: string
): string {
  const t = i18n.getFixedT(language, "instructions");
  return t(`timeContexts:${timeOfDay}`);
}
