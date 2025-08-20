/**
 * Gestionnaire pour les messages de bienvenue personnalisés
 * Génère des prompts adaptés à la langue du système
 */

import { getDeviceLanguage } from "@/utils/languageDetector";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "react-native-localize";

/**
 * Obtient l'instruction de bienvenue adaptée à la langue du système
 */
export async function getWelcomePromptByLanguage(
  message: string
): Promise<string> {
  // Récupérer la langue du système (même logique que useWelcomeBubble)
  let systemLanguage =
    (await AsyncStorage.getItem("userLanguage")) ||
    (await AsyncStorage.getItem("@language_preference")) ||
    (await AsyncStorage.getItem("app_language"));

  // Si pas de langue stockée, utiliser react-native-localize
  if (!systemLanguage) {
    try {
      const locales = getLocales();
      if (locales && locales.length > 0 && locales[0]?.languageCode) {
        systemLanguage =
          locales[0].languageCode.split("-")[0] || getDeviceLanguage();
      } else {
        systemLanguage = getDeviceLanguage();
      }
    } catch (error) {
      systemLanguage = getDeviceLanguage();
    }
  }

  // Instruction avec contexte du bouton "Discuter avec moi" (sans directive explicite de langue)
  return `CONTEXT: The user clicked the "💬 Chat with me" button from the home screen.

You are Naya's AI assistant. Below is the personalized welcome/context message prepared for the user (already shown in the UI as an overlay):

"${message}"

INSTRUCTIONS:
- Do NOT include any greeting (no "Bonjour", "Hello", etc.). The app UI already displays a localized greeting based on time and language.
- Do NOT mention or guess the user's name. The UI already shows it.
- Do NOT restate or quote the message above verbatim. Use it only to understand the context and intent.
- Start directly with helpful, contextual content (2–3 concise sentences), focusing on what the user can do now (scripts, planning, questions).
- Be kind, personalized and actionable.`;
}
