import { CustomTheme } from "../../types/theme";

// Fonction pour créer les thèmes avec traductions
export const createPresetThemes = (
  t: (key: string) => string
): CustomTheme[] => [
  // Light Default - Thème clair classique
  {
    id: "light-default",
    name: t("theme.presets.lightDefault"),
    isDark: false,
    colors: {
      primary: "#007AFF",
      secondary: "#5856D6",
      accent: "#FF3B30",
      background: "#F2F2F7",
      surface: "#FFFFFF",
      card: "#FFFFFF",
      text: "#000000",
      textSecondary: "#3C3C43",
      textMuted: "#8E8E93",
      border: "#C6C6C8",
      success: "#34C759",
      warning: "#FF9500",
      error: "#FF3B30",
      info: "#007AFF",
      gradient: ["#007AFF", "#5856D6"],
    },
  },
  // Dark Default - Thème sombre classique
  {
    id: "dark-default",
    name: t("theme.presets.darkDefault"),
    isDark: true,
    colors: {
      primary: "#0A84FF",
      secondary: "#5E5CE6",
      accent: "#FF453A",
      background: "#000000",
      surface: "#1C1C1E",
      card: "#2C2C2E",
      text: "#FFFFFF",
      textSecondary: "#EBEBF5",
      textMuted: "#8E8E93",
      border: "#38383A",
      success: "#32D74B",
      warning: "#FF9F0A",
      error: "#FF453A",
      info: "#0A84FF",
      gradient: ["#0A84FF", "#5E5CE6"],
    },
  },
];

// Thèmes prédéfinis avec traductions par défaut
export const PRESET_THEMES: CustomTheme[] = createPresetThemes(
  (key: string): string => {
    const translations: Record<string, string> = {
      "theme.presets.lightDefault": "☀️ Light Default",
      "theme.presets.darkDefault": "🌙 Dark Default",
    };
    return translations[key] || key;
  }
);

// Get default theme (Light Default - Thème clair classique par défaut)
export const getDefaultTheme = (): CustomTheme => {
  return (
    PRESET_THEMES.find((theme) => theme.id === "light-default") ||
    PRESET_THEMES[0]
  );
};
