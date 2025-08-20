import { CustomTheme, ThemeColors } from '../../../contexts/ThemeContext';

export interface ThemeCreationModalProps {
  visible: boolean;
  currentTheme: CustomTheme;
  newThemeName: string;
  customColors: ThemeColors;
  onClose: () => void;
  onCreateTheme: () => void;
  onThemeNameChange: (name: string) => void;
  onColorChange: (colors: Partial<ThemeColors>) => void;
  onToggleDarkMode: (isDark: boolean) => void;
}

export interface ColorCardProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  onColorChange: (color: string) => void;
  currentTheme: CustomTheme;
}

export interface CompactColorCardProps {
  title: string;
  icon: string;
  color: string;
  onColorChange: (color: string) => void;
  currentTheme: CustomTheme;
}

export interface ThemePreviewProps {
  colors: ThemeColors;
  currentTheme: CustomTheme;
}

export type ViewMode = 'cards' | 'compact'; 