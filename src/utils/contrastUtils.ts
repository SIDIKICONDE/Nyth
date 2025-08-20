// Utilitaires pour la détection et correction automatique du contraste

/**
 * Calcule la luminance relative d'une couleur (formule WCAG)
 */
export const getLuminance = (color: string): number => {
  // Convertir hex en RGB
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  // Appliquer la formule WCAG
  const [rs, gs, bs] = [r, g, b].map((c) => {
    if (c <= 0.03928) return c / 12.92;
    return Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Calcule le ratio de contraste entre deux couleurs
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
};

/**
 * Détermine si un contraste est suffisant (WCAG AA)
 */
export const isContrastSufficient = (
  color1: string,
  color2: string
): boolean => {
  const ratio = getContrastRatio(color1, color2);
  return ratio >= 4.5; // Standard WCAG AA pour le texte normal
};

/**
 * Génère une couleur de contraste optimale
 */
export const getOptimalContrastColor = (
  backgroundColor: string,
  isDarkTheme: boolean
): string => {
  const bgLuminance = getLuminance(backgroundColor);

  // Si le fond est sombre, utiliser du blanc
  if (bgLuminance < 0.5) {
    return "#ffffff";
  }

  // Si le fond est clair, utiliser du noir
  return "#000000";
};

/**
 * Ajuste automatiquement les couleurs pour un contraste optimal
 */
export const getContrastOptimizedColors = (
  primaryColor: string,
  backgroundColor: string,
  isDarkTheme: boolean
): {
  background: string;
  text: string;
  accent: string;
} => {
  const primaryLuminance = getLuminance(primaryColor);
  const bgLuminance = getLuminance(backgroundColor);

  // Détecter si le thème a des problèmes de contraste
  const isLowContrast = getContrastRatio(primaryColor, backgroundColor) < 4.5;

  if (isLowContrast) {
    if (isDarkTheme) {
      // Thème sombre avec contraste faible
      return {
        background: "#e0e0e0", // Gris clair pour fond actif
        text: "#000000", // Noir pour texte
        accent: "#000000", // Noir pour accent
      };
    } else {
      // Thème clair avec contraste faible
      return {
        background: "#ffffff", // Blanc pour fond actif
        text: "#000000", // Noir pour texte
        accent: "#000000", // Noir pour accent
      };
    }
  }

  // Contraste suffisant, utiliser les couleurs originales
  return {
    background: primaryColor,
    text: getOptimalContrastColor(primaryColor, isDarkTheme),
    accent: primaryColor,
  };
};

/**
 * Détecte si un thème a des problèmes de contraste
 */
export const detectContrastIssues = (
  theme: any
): {
  hasIssues: boolean;
  issues: string[];
} => {
  const issues: string[] = [];

  // Vérifier le contraste primary/background
  if (!isContrastSufficient(theme.colors.primary, theme.colors.background)) {
    issues.push("Contraste insuffisant entre primary et background");
  }

  // Vérifier le contraste text/background
  if (!isContrastSufficient(theme.colors.text, theme.colors.background)) {
    issues.push("Contraste insuffisant entre text et background");
  }

  // Vérifier le contraste textSecondary/background
  if (
    !isContrastSufficient(theme.colors.textSecondary, theme.colors.background)
  ) {
    issues.push("Contraste insuffisant entre textSecondary et background");
  }

  return {
    hasIssues: issues.length > 0,
    issues,
  };
};

/**
 * Hook personnalisé pour obtenir des couleurs optimisées
 */
export const useContrastOptimizedColors = (theme: any) => {
  const { hasIssues } = detectContrastIssues(theme);

  const getOptimizedColors = (baseColor: string, isActive: boolean = false) => {
    if (!hasIssues) {
      return {
        background: baseColor,
        text: getOptimalContrastColor(baseColor, theme.isDark),
        accent: baseColor,
      };
    }

    // Appliquer les corrections automatiques
    return getContrastOptimizedColors(
      baseColor,
      theme.colors.background,
      theme.isDark
    );
  };

  return {
    hasContrastIssues: hasIssues,
    getOptimizedColors,
    getActiveColors: () => getOptimizedColors(theme.colors.primary, true),
    getInactiveColors: () => getOptimizedColors(theme.colors.surface, false),
  };
};
