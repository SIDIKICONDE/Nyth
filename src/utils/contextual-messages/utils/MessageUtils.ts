import { getDeviceLanguage } from "@/utils/languageDetector";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RNLocalize from "react-native-localize";
import { MessageType, UserContext } from "../types";

/**
 * Utilitaires pour les messages contextuels
 */

/**
 * Détecte la langue système de l'utilisateur
 */
export const detectSystemLanguage = async (): Promise<string> => {
  try {
    // Essayer plusieurs clés possibles pour la langue utilisateur
    let userLanguage =
      (await AsyncStorage.getItem("userLanguage")) ||
      (await AsyncStorage.getItem("@language_preference")) ||
      (await AsyncStorage.getItem("app_language"));

    // Si pas de langue stockée, essayer getLocales avec protection
    if (!userLanguage) {
      try {
        const locales = RNLocalize.getLocales();
        if (locales && locales.length > 0 && locales[0]?.languageCode) {
          userLanguage = locales[0].languageCode;
        } else {
          userLanguage = getDeviceLanguage();
        }
      } catch (error) {
        userLanguage = getDeviceLanguage();
      }
    }

    return userLanguage;
  } catch (error) {
    return "fr"; // Fallback vers le français
  }
};

/**
 * Traduit le niveau de compétence
 */
export const translateSkillLevel = (
  level: UserContext["skillLevel"]
): string => {
  const translations = {
    beginner: "Débutant",
    intermediate: "Intermédiaire",
    advanced: "Avancé",
    expert: "Expert",
  };
  return translations[level] || level;
};

/**
 * Obtient la salutation appropriée selon l'heure et la langue
 * Utilise le système multilingue existant
 */
export const getTimeGreeting = async (
  timeOfDay?: UserContext["timeOfDay"],
  language?: string
): Promise<string> => {
  // Déterminer la langue à utiliser
  const systemLanguage = language || (await detectSystemLanguage());

  // Définition des salutations multilingues (basé sur useWelcomeBubble.ts)
  const greetings: {
    [key: string]: {
      morning: string;
      afternoon: string;
      evening: string;
      night: string;
    };
  } = {
    fr: {
      morning: "Bonjour",
      afternoon: "Bon après-midi",
      evening: "Bonsoir",
      night: "Bonne nuit",
    },
    en: {
      morning: "Good morning",
      afternoon: "Good afternoon",
      evening: "Good evening",
      night: "Good night",
    },
    es: {
      morning: "Buenos días",
      afternoon: "Buenas tardes",
      evening: "Buenas tardes",
      night: "Buenas noches",
    },
    ja: {
      morning: "おはようございます",
      afternoon: "こんにちは",
      evening: "こんばんは",
      night: "おやすみなさい",
    },
    de: {
      morning: "Guten Morgen",
      afternoon: "Guten Tag",
      evening: "Guten Abend",
      night: "Gute Nacht",
    },
    it: {
      morning: "Buongiorno",
      afternoon: "Buon pomeriggio",
      evening: "Buonasera",
      night: "Buonanotte",
    },
    pt: {
      morning: "Bom dia",
      afternoon: "Boa tarde",
      evening: "Boa noite",
      night: "Boa noite",
    },
    ru: {
      morning: "Доброе утро",
      afternoon: "Добрый день",
      evening: "Добрый вечер",
      night: "Спокойной ночи",
    },
    ko: {
      morning: "좋은 아침",
      afternoon: "안녕하세요",
      evening: "좋은 저녁",
      night: "안녕히 주무세요",
    },
    zh: {
      morning: "早上好",
      afternoon: "下午好",
      evening: "晚上好",
      night: "晚安",
    },
    ar: {
      morning: "صباح الخير",
      afternoon: "مساء الخير",
      evening: "مساء الخير",
      night: "تصبح على خير",
    },
    hi: {
      morning: "सुप्रभात",
      afternoon: "नमस्ते",
      evening: "शुभ संध्या",
      night: "शुभ रात्रि",
    },
  };

  // Obtenir les salutations pour la langue ou utiliser l'anglais par défaut
  const langGreetings = greetings[systemLanguage] || greetings.en;

  // Utiliser timeOfDay si fourni, sinon calculer selon l'heure actuelle
  if (timeOfDay) {
    const timeGreetings = {
      early_morning: langGreetings.morning,
      morning: langGreetings.morning,
      afternoon: langGreetings.afternoon,
      evening: langGreetings.evening,
      night: langGreetings.evening,
      late_night: langGreetings.night,
    };
    return timeGreetings[timeOfDay] || langGreetings.morning;
  }

  // Calculer selon l'heure actuelle
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return langGreetings.morning;
  else if (hour >= 12 && hour < 18) return langGreetings.afternoon;
  else if (hour >= 18 && hour < 22) return langGreetings.evening;
  else return langGreetings.night; // 22h à 5h du matin
};

/**
 * Version synchrone de getTimeGreeting pour compatibilité
 * Utilise une langue par défaut si non spécifiée
 */
export const getTimeGreetingSync = (
  timeOfDay: UserContext["timeOfDay"],
  language: string = "fr"
): string => {
  const greetings = {
    fr: {
      early_morning: "Bonjour",
      morning: "Bonjour",
      afternoon: "Bon après-midi",
      evening: "Bonsoir",
      night: "Bonsoir",
      late_night: "Bonne nuit",
    },
    en: {
      early_morning: "Good morning",
      morning: "Good morning",
      afternoon: "Good afternoon",
      evening: "Good evening",
      night: "Good evening",
      late_night: "Good night",
    },
  };

  const langGreetings =
    greetings[language as keyof typeof greetings] || greetings.fr;

  if (!timeOfDay) {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return langGreetings.morning;
    else if (hour >= 12 && hour < 18) return langGreetings.afternoon;
    else if (hour >= 18 && hour < 22) return langGreetings.evening;
    else return langGreetings.late_night;
  }

  return langGreetings[timeOfDay] || langGreetings.morning;
};

/**
 * Remplace les tokens de personnalisation dans un texte
 */
export const replacePersonalizationTokens = async (
  content: string,
  context: UserContext
): Promise<string> => {
  const timeGreeting = await getTimeGreeting(
    context.timeOfDay,
    context.preferredLanguage
  );

  const tokens: Record<string, string | number> = {
    "{name}": context.userName || "Créateur",
    "{userName}": context.userName || "Créateur",
    "{scriptsCount}": context.scriptsCount.toString(),
    "{scripts}": context.scriptsCount.toString(),
    "{words}": context.totalWordsWritten.toString(),
    "{wordsCount}": context.totalWordsWritten.toString(),
    "{days}": context.consecutiveDays.toString(),
    "{consecutiveDays}": context.consecutiveDays.toString(),
    "{level}": translateSkillLevel(context.skillLevel),
    "{timeOfDay}": timeGreeting,
    "{achievement}": context.achievements[0]?.name || "votre accomplissement",
  };

  let result = content;
  Object.entries(tokens).forEach(([token, value]) => {
    // Échapper les accolades pour le regex
    const escapedToken = token.replace(/[{}]/g, "\\$&");
    result = result.replace(new RegExp(escapedToken, "g"), value.toString());
  });

  return result;
};

/**
 * Extrait le type de message depuis l'ID
 */
export const getMessageTypeFromId = (messageId: string): MessageType => {
  // Logique pour extraire le type depuis l'ID
  // Simplification pour l'exemple
  const parts = messageId.split("_");
  return (parts[1] as MessageType) || "tip";
};

/**
 * Récupère l'ID de l'utilisateur actuel
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const stored = await AsyncStorage.getItem("@current_user_id");
    return stored;
  } catch {
    return null;
  }
};

/**
 * Génère une clé de cache
 */
export const generateCacheKey = (context: UserContext): string => {
  return `${context.userId}_${context.skillLevel}_${context.timeOfDay}_${context.isFirstLogin}`;
};
