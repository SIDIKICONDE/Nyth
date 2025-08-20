import {
  AIGenerationConfig,
  MessageType,
  UserContext,
} from "@/utils/contextual-messages/types";
import { getDeviceLanguage } from "@/utils/languageDetector";
import {
  buildBasicContext,
  buildComprehensiveContext,
  buildDetailedContext,
} from "../context/ContextBuilder";
import { getTypeSpecificInstructions } from "../instructions/TypeInstructions";
import { getLocalizedPrompts } from "./LocalizedPrompts";
import i18n from "i18next";

/**
 * Construit le prompt système pour l'IA
 */
export function buildSystemPrompt(language: string = "en"): string {
  const t = i18n.getFixedT(language, "prompts");

  return `${t("system.languageInstruction", { language })}

${t("system.assistantRole")}
${t("system.roleInstruction")}

${t("system.messageGoals")}

${t("system.strictRulesTitle")}
${t("system.strictRules")}

${t("system.writingStyleTitle")}
${t("system.writingStyle")}

${t("system.personalizationTitle")}
${t("system.personalization")}

${t("system.criticalReminder", { language })}`;
}

/**
 * Construit le prompt contextuel pour l'IA
 */
export function buildContextualPrompt(
  context: UserContext,
  messageType: MessageType,
  config: AIGenerationConfig
): string {
  const language = context.preferredLanguage || getDeviceLanguage();
  const t = i18n.getFixedT(language, "prompts");

  let prompt = `${t("contextual.generateMessage")} "${messageType}" ${t(
    "contextual.forUser"
  )}

${t("contextual.userContext")}:`;

  // Niveau de détail selon la configuration
  if (config.userContextDepth === "comprehensive") {
    prompt += buildComprehensiveContext(context);
  } else if (config.userContextDepth === "detailed") {
    prompt += buildDetailedContext(context);
  } else {
    prompt += buildBasicContext(context);
  }

  // Ajouter l'historique si demandé
  if (config.includeHistory && context.interactionHistory.length > 0) {
    prompt += `\n\n${t("contextual.recentHistory")}:`;
    context.interactionHistory.slice(-3).forEach((interaction) => {
      prompt += `\n- ${interaction.action} ${t("contextual.onMessage")} ${
        interaction.messageId
      }`;
    });
  }

  // Instructions spécifiques par type
  prompt += `\n\n${t("contextual.messageObjective")} "${messageType}":
${getTypeSpecificInstructions(messageType, context, language)}

${t("contextual.important")} ${t("contextual.generateDirectly")}

${t("contextual.expectedResponse")}
${t("contextual.generateOnly")}
${t("contextual.exampleGood")}

${t("contextual.criticalReminder")}
${t("contextual.responseRules")}`;

  return prompt;
}
