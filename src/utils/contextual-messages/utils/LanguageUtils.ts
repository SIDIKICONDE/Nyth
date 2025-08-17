import { UserContext } from "../types";
import { detectSystemLanguage, getTimeGreeting } from "./MessageUtils";

/**
 * Utilitaires pour la gestion multilingue
 */

/**
 * Langues supportées par l'application
 */
export const SUPPORTED_LANGUAGES = [
  "fr",
  "en",
  "es",
  "ja",
  "de",
  "it",
  "pt",
  "ru",
  "ko",
  "zh",
  "ar",
  "hi",
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Vérifie si une langue est supportée
 */
export const isSupportedLanguage = (
  language: string
): language is SupportedLanguage => {
  return SUPPORTED_LANGUAGES.includes(language as SupportedLanguage);
};

/**
 * Obtient la langue préférée de l'utilisateur depuis le contexte
 */
export const getUserPreferredLanguage = async (
  context: UserContext
): Promise<SupportedLanguage> => {
  // Priorité : langue du contexte > langue système détectée > fallback français
  if (
    context.preferredLanguage &&
    isSupportedLanguage(context.preferredLanguage)
  ) {
    return context.preferredLanguage as SupportedLanguage;
  }

  const systemLanguage = await detectSystemLanguage();
  if (isSupportedLanguage(systemLanguage)) {
    return systemLanguage as SupportedLanguage;
  }

  return "fr"; // Fallback
};

/**
 * Obtient une salutation localisée pour l'utilisateur
 */
export const getLocalizedGreeting = async (
  context: UserContext
): Promise<string> => {
  const language = await getUserPreferredLanguage(context);
  return getTimeGreeting(context.timeOfDay, language);
};

/**
 * Traduit un texte simple selon la langue de l'utilisateur
 */
export const getLocalizedText = (
  translations: Partial<Record<SupportedLanguage, string>>,
  language: SupportedLanguage,
  fallback: string = ""
): string => {
  return (
    translations[language] || translations.en || translations.fr || fallback
  );
};

/**
 * Messages de fallback multilingues pour les cas d'urgence
 */
export const EMERGENCY_MESSAGES: Record<SupportedLanguage, string> = {
  fr: "Bienvenue ! Je suis votre assistant IA.",
  en: "Welcome! I'm your AI assistant.",
  es: "¡Bienvenido! Soy tu asistente de IA.",
  ja: "ようこそ！私はあなたのAIアシスタントです。",
  de: "Willkommen! Ich bin Ihr KI-Assistent.",
  it: "Benvenuto! Sono il tuo assistente AI.",
  pt: "Bem-vindo! Sou seu assistente de IA.",
  ru: "Добро пожаловать! Я ваш ИИ-ассистент.",
  ko: "환영합니다! 저는 당신의 AI 어시스턴트입니다.",
  zh: "欢迎！我是您的AI助手。",
  ar: "مرحباً! أنا مساعدك الذكي.",
  hi: "स्वागत है! मैं आपका AI सहायक हूँ।",
};

/**
 * Obtient un message d'urgence localisé
 */
export const getEmergencyMessage = async (
  context: UserContext
): Promise<string> => {
  const language = await getUserPreferredLanguage(context);
  return EMERGENCY_MESSAGES[language];
};
