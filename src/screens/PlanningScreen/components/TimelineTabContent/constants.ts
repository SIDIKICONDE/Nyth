import { TabType } from "./types";

export const tabConfig = {
  events: {
    icon: "📅",
    key: "events" as TabType,
    translationKey: "planning.events.title",
    defaultLabel: "Events", // ✅ Fallback en anglais
  },
  goals: {
    icon: "🎯",
    key: "goals" as TabType,
    translationKey: "planning.goals.title",
    defaultLabel: "Goals", // ✅ Fallback en anglais
  },
} as const;

export const TAB_STYLES = {
  buttonPadding: {
    vertical: 4,
    horizontal: 8,
  },
  navigationPadding: {
    horizontal: 8,
    vertical: 1,
  },
  borderRadius: 6,
  badgeMinWidth: 16,
  badgePadding: {
    horizontal: 4,
    vertical: 1,
  },
  badgeBorderRadius: 6,
} as const;

export const ANIMATION_CONFIG = {
  activeOpacity: 0.7,
  tabTransitionDuration: 200,
} as const;

export const ERROR_MESSAGES = {
  renderError: {
    title: "⚠️ Erreur lors de l'affichage",
    subtitle: "Veuillez redémarrer l'application",
  },
} as const;
