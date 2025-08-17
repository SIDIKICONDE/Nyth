import { useMemo } from "react";
import { TextStyle } from "react-native";
import { useFont } from "../contexts/FontContext";

// Types pour les catégories de police
export type FontCategory = "ui" | "content" | "heading" | "code";

// Interface pour les options du hook
interface UseCentralizedFontOptions {
  /**
   * Catégorie de police par défaut
   */
  defaultCategory?: FontCategory;

  /**
   * Taille de base (sera multipliée selon la catégorie)
   */
  baseSize?: number;

  /**
   * Poids de base
   */
  baseWeight?: TextStyle["fontWeight"];

  /**
   * Espacement des lignes automatique
   */
  autoLineHeight?: boolean;

  /**
   * Espacement des lettres automatique
   */
  autoLetterSpacing?: boolean;
}

/**
 * Hook centralisé pour la gestion des polices
 * Facilite l'adoption progressive et la migration des composants existants
 */
export const useCentralizedFont = (options: UseCentralizedFontOptions = {}) => {
  const {
    defaultCategory = "ui",
    baseSize = 16,
    baseWeight = "400",
    autoLineHeight = true,
    autoLetterSpacing = false,
  } = options;

  const {
    getUIFontStyle,
    getContentFontStyle,
    getHeadingFontStyle,
    getCodeFontStyle,
    fonts,
  } = useFont();

  // Mémoriser les styles de base pour chaque catégorie
  const styles = useMemo(() => {
    const baseStyles = {
      fontSize: baseSize,
      fontWeight: baseWeight,
    };

    // Calculer lineHeight et letterSpacing selon la catégorie
    const getEnhancedStyle = (category: FontCategory, fontStyle: any) => {
      const enhanced = { ...baseStyles, ...fontStyle };

      if (autoLineHeight) {
        switch (category) {
          case "content":
            enhanced.lineHeight = baseSize * 1.5; // Lecture confortable
            break;
          case "heading":
            enhanced.lineHeight = baseSize * 1.2; // Plus serré pour les titres
            break;
          case "code":
            enhanced.lineHeight = baseSize * 1.4; // Lisibilité du code
            break;
          case "ui":
          default:
            enhanced.lineHeight = baseSize * 1.3; // Standard UI
            break;
        }
      }

      if (autoLetterSpacing) {
        switch (category) {
          case "heading":
            enhanced.letterSpacing = -0.5; // Serré pour les titres
            break;
          case "code":
            enhanced.letterSpacing = 0.5; // Espacé pour le code
            break;
          case "content":
            enhanced.letterSpacing = 0.1; // Légèrement espacé pour la lecture
            break;
          case "ui":
          default:
            enhanced.letterSpacing = 0; // Standard
            break;
        }
      }

      return enhanced;
    };

    return {
      ui: getEnhancedStyle("ui", getUIFontStyle()),
      content: getEnhancedStyle("content", getContentFontStyle()),
      heading: getEnhancedStyle("heading", getHeadingFontStyle()),
      code: getEnhancedStyle("code", getCodeFontStyle()),
    };
  }, [
    getUIFontStyle,
    getContentFontStyle,
    getHeadingFontStyle,
    getCodeFontStyle,
    baseSize,
    baseWeight,
    autoLineHeight,
    autoLetterSpacing,
    fonts, // Dépendance pour re-calculer quand les polices changent
  ]);

  // Fonction pour obtenir un style par catégorie
  const getStyleForCategory = (category: FontCategory) => styles[category];

  // Fonction pour obtenir le style par défaut
  const getDefaultStyle = () => styles[defaultCategory];

  // Fonction pour créer un style personnalisé
  const createCustomStyle = (
    category: FontCategory,
    overrides: Partial<TextStyle> = {}
  ) => ({
    ...styles[category],
    ...overrides,
  });

  // Fonction pour détecter automatiquement la catégorie basée sur les props
  const detectCategory = (
    styleProps: Partial<TextStyle> = {}
  ): FontCategory => {
    // Code: monospace ou background
    if (
      styleProps.fontFamily?.toLowerCase().includes("mono") ||
      styleProps.backgroundColor
    ) {
      return "code";
    }

    // Heading: grande taille ou poids bold
    if (
      (styleProps.fontSize && styleProps.fontSize > 18) ||
      (styleProps.fontWeight &&
        ["bold", "600", "700", "800", "900"].includes(
          String(styleProps.fontWeight)
        ))
    ) {
      return "heading";
    }

    // Content: lineHeight élevé ou taille standard sans poids
    if (
      (styleProps.lineHeight && styleProps.lineHeight > 20) ||
      (styleProps.fontSize &&
        styleProps.fontSize >= 16 &&
        !styleProps.fontWeight)
    ) {
      return "content";
    }

    // Par défaut: UI
    return "ui";
  };

  // Fonction intelligente qui combine détection et style
  const getIntelligentStyle = (styleProps: Partial<TextStyle> = {}) => {
    const detectedCategory = detectCategory(styleProps);
    return createCustomStyle(detectedCategory, styleProps);
  };

  return {
    // Styles pré-calculés
    styles,

    // Fonctions utilitaires
    getStyleForCategory,
    getDefaultStyle,
    createCustomStyle,
    detectCategory,
    getIntelligentStyle,

    // Accès direct aux styles
    ui: styles.ui,
    content: styles.content,
    heading: styles.heading,
    code: styles.code,

    // Informations sur les polices actuelles
    currentFonts: fonts,
  };
};

/**
 * Hook simplifié pour une catégorie spécifique
 */
export const useUIFont = (overrides?: Partial<TextStyle>) => {
  const { ui } = useCentralizedFont();
  return useMemo(() => ({ ...ui, ...overrides }), [ui, overrides]);
};

export const useContentFont = (overrides?: Partial<TextStyle>) => {
  const { content } = useCentralizedFont();
  return useMemo(() => ({ ...content, ...overrides }), [content, overrides]);
};

export const useHeadingFont = (overrides?: Partial<TextStyle>) => {
  const { heading } = useCentralizedFont();
  return useMemo(() => ({ ...heading, ...overrides }), [heading, overrides]);
};

export const useCodeFont = (overrides?: Partial<TextStyle>) => {
  const { code } = useCentralizedFont();
  return useMemo(() => ({ ...code, ...overrides }), [code, overrides]);
};

/**
 * Hook pour migration progressive - remplace les styles existants
 */
export const useMigratedTextStyle = (
  originalStyle?: TextStyle | TextStyle[],
  category?: FontCategory
) => {
  const { getIntelligentStyle, getStyleForCategory } = useCentralizedFont();

  return useMemo(() => {
    const flatOriginal = Array.isArray(originalStyle)
      ? Object.assign({}, ...originalStyle)
      : originalStyle || {};

    if (category) {
      // Catégorie spécifiée - utiliser directement
      return [getStyleForCategory(category), flatOriginal];
    } else {
      // Détection automatique
      return getIntelligentStyle(flatOriginal);
    }
  }, [originalStyle, category, getIntelligentStyle, getStyleForCategory]);
};
