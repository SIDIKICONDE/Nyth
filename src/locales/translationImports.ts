/**
 * Gestionnaire d'imports pour tous les fichiers de traduction
 * Centralise l'importation des fichiers JSON de traduction modulaires
 */

// Import des fichiers modulaires pour l'anglais
import enAchievements from "./en/achievements.json";
import enAdmin from "./en/admin.json";
import enAuth from "./en/auth.json";
import enChat from "./en/chat.json";
import enCommon from "./en/common.json";
import enEditor from "./en/editor.json";
import enForms from "./en/forms.json";
import enHelp from "./en/help.json";
import enHome from "./en/home.json";
import enPlanning from "./en/planning.json";
import enSecurity from "./en/security.json";
import enSettings from "./en/settings.json";
import enSocial from "./en/social.json";
import enStorage from "./en/storage.json";
import enSubscription from "./en/subscription.json";
import enTeleprompter from "./en/teleprompter.json";
import enThemes from "./en/themes.json";
import enUi from "./en/ui.json";
import enRecording from "./en/recording.json";

// Import des fichiers modulaires pour le français
import frAchievements from "./fr/achievements.json";
import frAdmin from "./fr/admin.json";
import frAuth from "./fr/auth.json";
import frChat from "./fr/chat.json";
import frCommon from "./fr/common.json";
import frEditor from "./fr/editor.json";
import frForms from "./fr/forms.json";
import frHelp from "./fr/help.json";
import frHome from "./fr/home.json";
import frPermissions from "./fr/permissions.json";
import frPlanning from "./fr/planning.json";
import frRecording from "./fr/recording.json";
import frSecurity from "./fr/security.json";
import frSettings from "./fr/settings.json";
import frSocial from "./fr/social.json";
import frStorage from "./fr/storage.json";
import frSubscription from "./fr/subscription.json";
import frTeleprompter from "./fr/teleprompter.json";
import frThemes from "./fr/themes.json";
import frUi from "./fr/ui.json";

/**
 * Exports des traductions modulaires par langue
 */
export const translations = {
  // Anglais
  en: {
    achievements: enAchievements,
    admin: enAdmin,
    auth: enAuth,
    chat: enChat,
    common: enCommon,
    editor: enEditor,
    forms: enForms,
    help: enHelp,
    home: enHome,
    planning: enPlanning,
    recording: enRecording,
    security: enSecurity,
    settings: enSettings,
    social: enSocial,
    storage: enStorage,
    subscription: enSubscription,
    teleprompter: enTeleprompter,
    themes: enThemes,
    ui: enUi,
  },

  // Français
  fr: {
    achievements: frAchievements,
    admin: frAdmin,
    auth: frAuth,
    chat: frChat,
    common: frCommon,
    editor: frEditor,
    forms: frForms,
    help: frHelp,
    home: frHome,
    permissions: frPermissions,
    planning: frPlanning,
    recording: frRecording,
    security: frSecurity,
    settings: frSettings,
    social: frSocial,
    storage: frStorage,
    subscription: frSubscription,
    teleprompter: frTeleprompter,
    themes: frThemes,
    ui: frUi,
  },
};

/**
 * Type pour les clés de traduction disponibles
 */
export type TranslationKey = keyof typeof translations;

/**
 * Type pour les ressources de traduction
 */
export type TranslationResource = (typeof translations)[TranslationKey];
