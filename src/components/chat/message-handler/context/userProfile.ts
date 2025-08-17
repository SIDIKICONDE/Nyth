import { APP_CONFIG } from "../../../../config/appConfig";
import { getLocalizedTexts } from "./language";
import { UserContextConfig, UserProfile } from "./types";

/**
 * Configuration par défaut pour le contexte utilisateur
 */
export const DEFAULT_USER_CONFIG: UserContextConfig = {
  includeProfile: true,
  includeEmail: true,
  includeTransparencyNote: true,
  mentionAppName: APP_CONFIG.AI.MENTION_APP_NAME,
};

/**
 * Extrait les informations du profil utilisateur
 */
export const extractUserProfile = (user: any): UserProfile => {
  return {
    name: user?.name || user?.displayName || "",
    displayName: user?.displayName || user?.name || "",
    email: user?.email || "",
    uid: user?.uid || "",
  };
};

/**
 * Obtient le nom d'affichage de l'utilisateur
 */
export const getUserDisplayName = (user: any): string => {
  return user?.name || user?.displayName || "";
};

/**
 * Vérifie si l'utilisateur a un profil complet
 */
export const hasCompleteProfile = (user: any): boolean => {
  const profile = extractUserProfile(user);
  return !!(profile.name && profile.email);
};

/**
 * Construit le contexte du profil utilisateur
 */
export const buildUserProfileContext = (
  user: any,
  language: string,
  config: UserContextConfig = DEFAULT_USER_CONFIG
): string => {
  const profile = extractUserProfile(user);
  const texts = getLocalizedTexts(language);
  const userName = getUserDisplayName(user);

  if (!config.includeProfile) {
    return "";
  }

  let context = texts.userInfoHeader + "\n";

  // Ajouter le nom d'utilisateur
  if (profile.name && userName) {
    context += `- ${
      texts.username
    }: ${userName.toUpperCase()} (enregistré dans son profil)\n`;
  }

  // Ajouter l'email si configuré
  if (config.includeEmail && profile.email) {
    const emailLabel =
      language === "fr"
        ? "enregistré lors de l'inscription"
        : "registered during signup";
    context += `- ${texts.email}: ${profile.email} (${emailLabel})\n`;
  }

  // Ajouter la note de transparence si configurée
  if (config.includeTransparencyNote) {
    const appName = config.mentionAppName ? APP_CONFIG.APP_NAME : undefined;
    context += texts.transparencyNote(appName);
  }

  return context;
};

/**
 * Construit un contexte utilisateur minimal
 */
export const buildMinimalUserContext = (
  user: any,
  language: string
): string => {
  const userName = getUserDisplayName(user);
  const texts = getLocalizedTexts(language);

  if (!userName) {
    return language === "fr"
      ? "Utilisateur non identifié.\n\n"
      : "Unidentified user.\n\n";
  }

  return language === "fr"
    ? `Utilisateur: ${userName.toUpperCase()}\n\n`
    : `User: ${userName.toUpperCase()}\n\n`;
};

/**
 * Construit le contexte d'identification utilisateur
 */
export const buildUserIdentityContext = (
  user: any,
  language: string,
  includeDetails: boolean = true
): string => {
  const profile = extractUserProfile(user);
  const userName = getUserDisplayName(user);

  if (!userName && !profile.email) {
    return language === "fr"
      ? "Utilisateur anonyme ou invité.\n"
      : "Anonymous or guest user.\n";
  }

  let context = "";

  if (userName) {
    context += language === "fr" ? `Nom: ${userName}\n` : `Name: ${userName}\n`;
  }

  if (includeDetails && profile.email) {
    context +=
      language === "fr"
        ? `Email: ${profile.email}\n`
        : `Email: ${profile.email}\n`;
  }

  if (includeDetails && profile.uid) {
    context +=
      language === "fr"
        ? `ID utilisateur: ${profile.uid.substring(0, 8)}...\n`
        : `User ID: ${profile.uid.substring(0, 8)}...\n`;
  }

  return context;
};

/**
 * Génère les instructions de transparence
 */
export const buildTransparencyInstructions = (
  userName: string,
  language: string,
  mentionAppName: boolean = false
): string => {
  const texts = getLocalizedTexts(language);
  const appName = mentionAppName ? APP_CONFIG.APP_NAME : undefined;

  return texts.finalInstructions(userName, appName);
};

/**
 * Valide les données du profil utilisateur
 */
export const validateUserProfile = (
  user: any
): {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
} => {
  const profile = extractUserProfile(user);
  const missingFields: string[] = [];
  const warnings: string[] = [];

  if (!profile.name && !profile.displayName) {
    missingFields.push("name");
  }

  if (!profile.email) {
    missingFields.push("email");
  }

  if (!profile.uid) {
    warnings.push("No user ID available");
  }

  // Vérifier la validité de l'email
  if (profile.email && !isValidEmail(profile.email)) {
    warnings.push("Invalid email format");
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings,
  };
};

/**
 * Vérifie si un email est valide (basique)
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Formate les informations utilisateur pour le debug
 */
export const formatUserForDebug = (user: any): string => {
  const profile = extractUserProfile(user);
  const validation = validateUserProfile(user);

  return JSON.stringify(
    {
      profile,
      validation,
      hasCompleteProfile: hasCompleteProfile(user),
      displayName: getUserDisplayName(user),
    },
    null,
    2
  );
};

/**
 * Construit un contexte personnalisé basé sur les préférences
 */
export const buildCustomUserContext = (
  user: any,
  language: string,
  preferences: {
    showEmail?: boolean;
    showId?: boolean;
    customGreeting?: string;
    includeStats?: boolean;
  }
): string => {
  const profile = extractUserProfile(user);
  const userName = getUserDisplayName(user);
  const texts = getLocalizedTexts(language);

  let context = "";

  // Salutation personnalisée
  if (preferences.customGreeting && userName) {
    context += `${preferences.customGreeting.replace("{name}", userName)}\n\n`;
  }

  // Informations de base
  context += texts.userInfoHeader + "\n";

  if (userName) {
    context += `- ${texts.username}: ${userName}\n`;
  }

  if (preferences.showEmail && profile.email) {
    context += `- ${texts.email}: ${profile.email}\n`;
  }

  if (preferences.showId && profile.uid) {
    context += `- ID: ${profile.uid.substring(0, 12)}...\n`;
  }

  // Statistiques si demandées
  if (preferences.includeStats) {
    const joinDate = new Date().toLocaleDateString(); // Placeholder
    context +=
      language === "fr"
        ? `- Membre depuis: ${joinDate}\n`
        : `- Member since: ${joinDate}\n`;
  }

  return context + "\n";
};
