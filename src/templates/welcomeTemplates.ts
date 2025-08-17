export interface WelcomeTemplate {
  title: string;
  content: string;
}

import { EN_WELCOME_TEMPLATE } from "./en";
import { ES_WELCOME_TEMPLATE } from "./es";
import { FR_WELCOME_TEMPLATE } from "./fr";

// Templates localisés pour le script de bienvenue par défaut
export const WELCOME_TEMPLATES: Record<string, WelcomeTemplate> = {
  fr: FR_WELCOME_TEMPLATE,
  en: EN_WELCOME_TEMPLATE,
  es: ES_WELCOME_TEMPLATE,
};

// Helper pour récupérer le template selon la langue, fallback sur EN
export const getWelcomeTemplate = (lang: string): WelcomeTemplate => {
  return WELCOME_TEMPLATES[lang] || WELCOME_TEMPLATES.en;
};
