// Types pour les thèmes
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  gradient: string[];
}

export interface CustomTheme {
  id: string;
  name: string;
  isDark: boolean;
  isOfficial?: boolean;
  isSystemTheme?: boolean; // Nouveau: indique si c'est le thème automatique
  colors: ThemeColors;
}

export interface ThemeContextType {
  currentTheme: CustomTheme;
  setTheme: (theme: CustomTheme) => void;
  toggleDarkMode: () => void;
  customThemes: CustomTheme[];
  addCustomTheme: (theme: CustomTheme) => void;
  deleteCustomTheme: (themeId: string) => void;
  resetToDefaultTheme: () => void;
}
