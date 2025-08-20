import i18n from "i18next";
import { getDeviceLanguage } from "@/utils/languageDetector";

/**
 * Interface pour les prompts localisés
 */
export interface LocalizedPrompt {
  generateMessage: string;
  forUser: string;
  userContext: string;
  recentHistory: string;
  onMessage: string;
  messageObjective: string;
  important: string;
  generateDirectly: string;
  expectedResponse: string;
  generateOnly: string;
  exampleGood: string;
  criticalReminder: string;
  responseRules: string;
}

/**
 * Obtient les prompts adaptatifs selon la langue
 */
export function getLocalizedPrompts(language: string): LocalizedPrompt {
  const t = i18n.getFixedT(language || getDeviceLanguage(), "prompts");

  return {
    generateMessage: t("contextual.generateMessage"),
    forUser: t("contextual.forUser"),
    userContext: t("contextual.userContext"),
    recentHistory: t("contextual.recentHistory"),
    onMessage: t("contextual.onMessage"),
    messageObjective: t("contextual.messageObjective"),
    important: t("contextual.important"),
    generateDirectly: t("contextual.generateDirectly"),
    expectedResponse: t("contextual.expectedResponse"),
    generateOnly: t("contextual.generateOnly"),
    exampleGood: t("contextual.exampleGood"),
    criticalReminder: t("contextual.criticalReminder"),
    responseRules: t("contextual.responseRules"),
  };
}
