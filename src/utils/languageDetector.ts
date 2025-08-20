import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules, Platform } from "react-native";
import { getLocales } from "react-native-localize";

// List of supported languages
export const SUPPORTED_LANGUAGES = [
  "en",
  "fr",
  "es",
  "pt",
  "it",
  "de",
  "ja",
  "ko",
  "hi",
  "zh",
  "ar",
  "ru",
];

/**
 * Get the device's preferred language
 * Uses react-native-localize for better cross-platform support
 */
export const getDeviceLanguage = (): string => {
  try {
    // Use react-native-localize API avec protection
    let locales;
    try {
      locales = getLocales();
    } catch (localeError) {
      return "fr"; // Fallback par défaut
    }

    if (locales && locales.length > 0 && locales[0]) {
      const locale = locales[0];
      const languageCode = locale.languageCode?.toLowerCase();

      if (languageCode && SUPPORTED_LANGUAGES.includes(languageCode)) {
        return languageCode;
      }
    }

    // Fallback to native modules
    let deviceLanguage = "en";

    if (Platform.OS === "ios") {
      deviceLanguage =
        NativeModules.SettingsManager?.settings?.AppleLocale ||
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
        "en";
    } else if (Platform.OS === "android") {
      deviceLanguage = NativeModules.I18nManager?.localeIdentifier || "en";
    }

    // Extract language code (e.g., 'fr-FR' -> 'fr')
    const languageCode = deviceLanguage
      .split("_")[0]
      .split("-")[0]
      .toLowerCase();

    return SUPPORTED_LANGUAGES.includes(languageCode) ? languageCode : "en";
  } catch (error) {
    return "en";
  }
};

/**
 * Get all device locales for debugging
 */
export const getDeviceLocales = () => {
  try {
    let locales;
    try {
      locales = getLocales();
    } catch (localeError) {
      return {
        locales: [],
        platform: Platform.OS,
        supportedLanguages: SUPPORTED_LANGUAGES,
        error: `getLocales() failed: ${
          localeError instanceof Error
            ? localeError.message
            : String(localeError)
        }`,
      };
    }

    if (!locales) {
      return {
        locales: [],
        platform: Platform.OS,
        supportedLanguages: SUPPORTED_LANGUAGES,
        error: "getLocales() returned undefined",
      };
    }

    return {
      locales: locales,
      platform: Platform.OS,
      supportedLanguages: SUPPORTED_LANGUAGES,
    };
  } catch (error) {
    return null;
  }
};

// Détecteur de langue simple basé sur des mots-clés
export const detectLanguage = (text: string): string => {
  const lowerText = text.toLowerCase();

  // Détection basique par mots-clés fréquents
  const frenchWords = [
    "le",
    "la",
    "les",
    "de",
    "du",
    "des",
    "un",
    "une",
    "et",
    "est",
    "dans",
    "pour",
    "que",
    "qui",
    "avec",
    "sur",
    "par",
    "plus",
    "ce",
    "ne",
    "pas",
    "vous",
    "nous",
    "ils",
    "elle",
    "être",
    "avoir",
    "faire",
    "dire",
    "aller",
    "voir",
    "savoir",
    "pouvoir",
    "vouloir",
    "venir",
    "devoir",
    "croire",
    "trouver",
    "donner",
    "falloir",
    "prendre",
  ];
  const englishWords = [
    "the",
    "be",
    "to",
    "of",
    "and",
    "a",
    "in",
    "that",
    "have",
    "i",
    "it",
    "for",
    "not",
    "on",
    "with",
    "he",
    "as",
    "you",
    "do",
    "at",
    "this",
    "but",
    "his",
    "by",
    "from",
    "they",
    "we",
    "say",
    "her",
    "she",
    "or",
    "an",
    "will",
    "my",
    "one",
    "all",
    "would",
    "there",
    "their",
  ];
  const spanishWords = [
    "el",
    "la",
    "de",
    "que",
    "y",
    "a",
    "en",
    "un",
    "ser",
    "se",
    "no",
    "haber",
    "por",
    "con",
    "su",
    "para",
    "como",
    "estar",
    "tener",
    "le",
    "lo",
    "todo",
    "pero",
    "más",
    "hacer",
    "o",
    "poder",
    "decir",
    "este",
    "ir",
    "otro",
    "ese",
    "si",
    "me",
    "ya",
    "ver",
    "porque",
    "dar",
    "cuando",
  ];
  const germanWords = [
    "der",
    "die",
    "das",
    "und",
    "in",
    "den",
    "von",
    "zu",
    "mit",
    "sich",
    "auf",
    "für",
    "ist",
    "im",
    "dem",
    "nicht",
    "ein",
    "eine",
    "als",
    "auch",
    "es",
    "an",
    "werden",
    "aus",
    "er",
    "hat",
    "dass",
    "sie",
    "nach",
    "wird",
    "bei",
    "einer",
    "um",
    "am",
    "sind",
    "noch",
    "wie",
    "einem",
    "über",
  ];
  const italianWords = [
    "di",
    "e",
    "il",
    "la",
    "che",
    "è",
    "per",
    "un",
    "in",
    "non",
    "con",
    "si",
    "da",
    "del",
    "al",
    "essere",
    "come",
    "ed",
    "i",
    "lo",
    "ha",
    "ma",
    "ad",
    "su",
    "mi",
    "una",
    "anche",
    "se",
    "o",
    "avere",
    "ne",
    "ci",
    "questo",
    "quando",
    "quello",
    "molto",
    "dei",
    "più",
    "tutti",
  ];
  const portugueseWords = [
    "de",
    "a",
    "o",
    "que",
    "e",
    "do",
    "da",
    "em",
    "um",
    "para",
    "é",
    "com",
    "não",
    "uma",
    "os",
    "no",
    "se",
    "na",
    "por",
    "mais",
    "as",
    "dos",
    "como",
    "mas",
    "foi",
    "ao",
    "ele",
    "das",
    "tem",
    "à",
    "seu",
    "sua",
    "ou",
    "ser",
    "quando",
    "muito",
    "há",
    "nos",
    "já",
  ];

  // Compter les mots de chaque langue
  const counts = {
    fr: 0,
    en: 0,
    es: 0,
    de: 0,
    it: 0,
    pt: 0,
  };

  const words = lowerText.split(/\s+/);

  words.forEach((word) => {
    if (frenchWords.includes(word)) counts.fr++;
    if (englishWords.includes(word)) counts.en++;
    if (spanishWords.includes(word)) counts.es++;
    if (germanWords.includes(word)) counts.de++;
    if (italianWords.includes(word)) counts.it++;
    if (portugueseWords.includes(word)) counts.pt++;
  });

  // Retourner la langue avec le plus de correspondances
  let maxCount = 0;
  let detectedLang = getDeviceLanguage(); // Par défaut langue du device au lieu de français

  Object.entries(counts).forEach(([lang, count]) => {
    if (count > maxCount) {
      maxCount = count;
      detectedLang = lang;
    }
  });

  return detectedLang;
};

// Mapper la langue détectée au code de langue pour l'API
export const getLanguageCode = (detectedLanguage: string): string => {
  // Retourne toujours 'fr' par défaut, mais l'IA répondra dans la langue détectée
  return "fr";
};

// Cette fonction n'est plus nécessaire car l'IA détecte automatiquement la langue
export const getLanguageInstruction = (detectedLanguage: string): string => {
  // Fonction conservée pour la compatibilité mais non utilisée
  return "";
};

/**
 * Récupère la langue du système depuis AsyncStorage
 * Essaie plusieurs clés possibles pour assurer la compatibilité
 * @returns Le code de langue (ex: 'fr', 'ja', 'en') ou la langue du device par défaut
 */
export async function getSystemLanguage(): Promise<string> {
  const language =
    (await AsyncStorage.getItem("userLanguage")) ||
    (await AsyncStorage.getItem("@language_preference")) ||
    (await AsyncStorage.getItem("app_language")) ||
    getDeviceLanguage();

  return language;
}
