import { useMemo } from "react";
import { useTheme } from "../contexts/ThemeContext";
import {
  detectContrastIssues,
  getContrastOptimizedColors,
  getOptimalContrastColor,
} from "../utils/contrastUtils";

/**
 * Hook pour optimiser automatiquement les couleurs selon le contraste
 */
export const useContrastOptimization = () => {
  const { currentTheme } = useTheme();

  const contrastAnalysis = useMemo(() => {
    return detectContrastIssues(currentTheme);
  }, [currentTheme]);

  const getOptimizedTabColors = (isActive: boolean = false) => {
    // N'activer que pour les thèmes sombres avec problèmes de contraste
    if (!currentTheme.isDark || !contrastAnalysis.hasIssues) {
      // Thème clair ou pas de problèmes de contraste, utiliser les couleurs originales
      return {
        background: isActive ? currentTheme.colors.primary : "transparent",
        text: isActive
          ? getOptimalContrastColor(
              currentTheme.colors.primary,
              currentTheme.isDark
            )
          : currentTheme.colors.textSecondary,
        border: currentTheme.colors.border,
      };
    }

    // Thème sombre avec problèmes de contraste, appliquer les corrections
    const optimized = getContrastOptimizedColors(
      currentTheme.colors.primary,
      currentTheme.colors.background,
      currentTheme.isDark
    );

    return {
      background: isActive ? optimized.background : "transparent",
      text: isActive ? optimized.text : currentTheme.colors.textSecondary,
      border: currentTheme.colors.border,
    };
  };

  const getOptimizedButtonColors = () => {
    // N'activer que pour les thèmes sombres avec problèmes de contraste
    if (!currentTheme.isDark || !contrastAnalysis.hasIssues) {
      return {
        background: currentTheme.colors.primary,
        text: getOptimalContrastColor(
          currentTheme.colors.primary,
          currentTheme.isDark
        ),
        shadow: currentTheme.colors.primary,
      };
    }

    const optimized = getContrastOptimizedColors(
      currentTheme.colors.primary,
      currentTheme.colors.background,
      currentTheme.isDark
    );

    return {
      background: optimized.background,
      text: optimized.text,
      shadow: optimized.background,
    };
  };

  const getOptimizedBadgeColors = (isActive: boolean = false) => {
    // N'activer que pour les thèmes sombres avec problèmes de contraste
    if (!currentTheme.isDark || !contrastAnalysis.hasIssues) {
      return {
        background: isActive
          ? currentTheme.colors.accent
          : currentTheme.colors.textSecondary,
        text: currentTheme.colors.background,
      };
    }

    return {
      background: isActive ? "#000000" : currentTheme.colors.textSecondary,
      text: isActive ? "#ffffff" : currentTheme.colors.background,
    };
  };

  return {
    hasContrastIssues: contrastAnalysis.hasIssues,
    contrastIssues: contrastAnalysis.issues,
    getOptimizedTabColors,
    getOptimizedButtonColors,
    getOptimizedBadgeColors,
    // Méthodes utilitaires
    getTextColor: (backgroundColor: string) =>
      getOptimalContrastColor(backgroundColor, currentTheme.isDark),
    getActiveBackground: () =>
      currentTheme.isDark && contrastAnalysis.hasIssues
        ? "#e0e0e0"
        : currentTheme.colors.primary,
  };
};
