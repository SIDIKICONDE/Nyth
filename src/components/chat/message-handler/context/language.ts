import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../../../../locales/i18n";
import { getDeviceLanguage } from "../../../../utils/languageDetector";
import { LanguageInstructions } from "./types";

/**
 * Instructions de langue explicites pour l'IA.
 * Simplifié pour ne contenir que l'instruction brute.
 */
export const LANGUAGE_INSTRUCTIONS: LanguageInstructions = {
  fr: "RÉPONDS EN FRANÇAIS",
  en: "RESPOND IN ENGLISH",
  es: "RESPONDE EN ESPAÑOL",
  pt: "RESPONDE EM PORTUGUÊS",
  it: "RISPONDI IN ITALIANO",
  de: "ANTWORTE AUF DEUTSCH",
  ja: "日本語で回答してください",
  ko: "한국어로 답변해주세요",
  hi: "हिंदी में उत्तर दें",
  zh: "请用中文回答",
  ru: "ОТВЕЧАЙ НА РУССКОМ",
};

/**
 * Obtient la langue de l'utilisateur.
 * Priorise la langue sauvegardée, sinon utilise la langue du device.
 */
export const getUserLanguage = async (): Promise<string> => {
  try {
    const savedLanguage = await AsyncStorage.getItem("userLanguage");
    if (savedLanguage) {
      return savedLanguage;
    }
    return getDeviceLanguage();
  } catch (error) {
    // En cas d'erreur, retourne la langue du device comme fallback sûr.
    return getDeviceLanguage();
  }
};

/**
 * Obtient l'instruction de langue explicite pour l'IA.
 */
export const getLanguageInstruction = (languageCode: string): string => {
  return (
    LANGUAGE_INSTRUCTIONS[languageCode] ||
    `RESPOND IN ${languageCode.toUpperCase()}`
  );
};

/**
 * Vérifie si une langue est supportée par nos instructions.
 */
export const isLanguageSupported = (languageCode: string): boolean => {
  return languageCode in LANGUAGE_INSTRUCTIONS;
};

/**
 * Obtient la liste des codes des langues supportées.
 */
export const getSupportedLanguages = (): string[] => {
  return Object.keys(LANGUAGE_INSTRUCTIONS);
};

/**
 * Obtient les textes localisés pour la construction de contexte en utilisant i18n.
 * @param language - Le code de la langue pour forcer une langue spécifique si nécessaire.
 */
export const getLocalizedTexts = (language?: string) => {
  const t = i18n.getFixedT(language || i18n.language);

  return {
    // En-têtes de sections
    userInfoHeader: t("context.userInfoHeader"),
    scriptsHeader: (userName: string) =>
      t("context.scriptsHeader", {
        userName: userName.toUpperCase() || t("common.user"),
      }),
    memoryHeader: (userName: string) =>
      t("context.memoryHeader", {
        userName: userName.toUpperCase() || t("common.user"),
      }),

    // Labels de champs
    username: t("context.username"),
    email: t("context.email"),
    totalScripts: t("context.totalScripts"),
    title: t("context.title"),
    words: t("context.words"),
    created: t("context.created"),
    favorite: t("context.favorite"),
    preview: t("context.preview"),
    yes: t("context.yes"),
    no: t("context.no"),

    // Messages par défaut
    noScripts: (userName: string) =>
      t("context.noScripts", { userName: userName || t("common.user") }),
    moreScripts: (count: number) => t("context.moreScripts", { count }),
    noMemory: (userName: string) =>
      t("context.noMemory", { userName: userName || t("common.user") }),

    // Notes de transparence
    transparencyNote: (appName?: string) =>
      t("context.transparencyNote", {
        appName: appName
          ? ` de l'application ${appName}`
          : " dans l'application",
      }),

    // Instructions finales
    finalInstructions: (userName: string, appName?: string) =>
      t("context.finalInstructions", {
        userName: userName || t("common.user"),
        appName: appName ? ` qui utilise ${appName}` : "",
      }),

    // Niveaux d'importance mémoire
    memoryImportance: t("context.memoryImportance", {
      returnObjects: true,
    }) as Record<"high" | "medium" | "low", string>,

    // Instructions mémoire
    memoryInstructions: t("context.memoryInstructions"),

    // Labels de questions
    userQuestion: t("context.userQuestion"),
  };
};

/**
 * Détecte la langue d'un texte (basique).
 * Amélioré pour inclure plus de langues et être légèrement plus robuste.
 * NOTE: Cette détection reste basique et peut être moins fiable pour les textes courts.
 * Pour une détection plus précise, une librairie spécialisée serait recommandée.
 */
export const detectTextLanguage = (text: string): string => {
  const lowerText = text.toLowerCase();

  // Scores pour chaque langue
  const scores: { [key: string]: number } = {
    fr: 0,
    en: 0,
    es: 0,
    pt: 0,
    it: 0,
    de: 0,
  };

  // Mots-clés par langue
  const keywords: { [key: string]: string[] } = {
    fr: [
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
      "je",
      "tu",
    ],
    en: [
      "the",
      "be",
      "to",
      "of",
      "and",
      "a",
      "in",
      "that",
      "have",
      "it",
      "for",
      "not",
      "on",
      "with",
      "he",
      "she",
    ],
    es: [
      "el",
      "la",
      "los",
      "las",
      "de",
      "que",
      "y",
      "a",
      "en",
      "un",
      "una",
      "ser",
      "se",
      "no",
      "por",
      "es",
    ],
    pt: [
      "o",
      "a",
      "os",
      "as",
      "de",
      "e",
      "em",
      "um",
      "uma",
      "para",
      "com",
      "não",
      "é",
      "são",
    ],
    it: [
      "il",
      "la",
      "le",
      "di",
      "e",
      "un",
      "in",
      "che",
      "per",
      "non",
      "è",
      "sono",
      "ha",
    ],
    de: [
      "der",
      "die",
      "das",
      "und",
      "in",
      "ein",
      "eine",
      "ist",
      "sind",
      "ich",
      "er",
      "sie",
      "es",
      "nicht",
    ],
  };

  const words = lowerText.split(/\s+/).slice(0, 25); // Analyser les 25 premiers mots

  words.forEach((word) => {
    for (const lang in keywords) {
      if (keywords[lang].includes(word)) {
        scores[lang]++;
      }
    }
  });

  // Trouver la langue avec le score le plus élevé
  let detectedLang = "en"; // Langue par défaut
  let maxScore = 0;

  for (const lang in scores) {
    if (scores[lang] > maxScore) {
      maxScore = scores[lang];
      detectedLang = lang;
    }
  }

  // Petite sécurité : si le score est très bas, on reste sur le défaut
  if (maxScore < 2 && words.length > 5) {
    return "en";
  }

  return detectedLang;
};

/**
 * Formate une instruction de langue avec un contexte additionnel.
 */
export const formatLanguageInstruction = (
  languageCode: string,
  context?: string
): string => {
  const baseInstruction = getLanguageInstruction(languageCode);

  if (!context) {
    return baseInstruction;
  }

  return `${baseInstruction}${context ? ` ${context}` : ""}`;
};
