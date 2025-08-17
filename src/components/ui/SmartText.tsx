import React from "react";
import { Text, TextProps, TextStyle } from "react-native";
import { useFont } from "../../contexts/FontContext";

// Interface pour les props étendues
interface SmartTextProps extends TextProps {
  /**
   * Type de police à appliquer
   * - 'auto': Détection automatique basée sur le contexte
   * - 'ui': Police pour l'interface utilisateur
   * - 'content': Police pour le contenu (messages, articles)
   * - 'heading': Police pour les titres
   * - 'code': Police pour le code
   */
  fontType?: "auto" | "ui" | "content" | "heading" | "code";

  /**
   * Désactiver l'application automatique des polices pour ce composant
   */
  disableSmartFont?: boolean;

  /**
   * Taille prédéfinie (optionnel)
   */
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

  /**
   * Poids prédéfini (optionnel)
   */
  weight?: "light" | "normal" | "medium" | "semibold" | "bold";
}

// Utilitaires pour les tailles et poids
const FONT_SIZES = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
};

const FONT_WEIGHTS: Record<string, TextStyle["fontWeight"]> = {
  light: "300",
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
};

/**
 * Composant SmartText qui applique automatiquement les bonnes polices
 * selon le contexte ou le type spécifié
 */
export const SmartText: React.FC<SmartTextProps> = ({
  children,
  style,
  fontType = "auto",
  disableSmartFont = false,
  size,
  weight,
  ...props
}) => {
  const {
    getUIFontStyle,
    getContentFontStyle,
    getHeadingFontStyle,
    getCodeFontStyle,
  } = useFont();

  // Si désactivé, utiliser le Text standard
  if (disableSmartFont) {
    return (
      <Text style={style} {...props}>
        {children}
      </Text>
    );
  }

  // Fonction pour détecter automatiquement le type de police
  const detectFontType = (): "ui" | "content" | "heading" | "code" => {
    if (fontType !== "auto") return fontType;

    // Analyser le style pour détecter le type
    const flatStyle = Array.isArray(style)
      ? Object.assign({}, ...style)
      : style || {};

    // Détection du code
    if (
      flatStyle.fontFamily?.toLowerCase().includes("mono") ||
      flatStyle.fontFamily?.toLowerCase().includes("courier") ||
      flatStyle.backgroundColor ||
      flatStyle.borderRadius
    ) {
      return "code";
    }

    // Détection des titres
    if (
      (flatStyle.fontSize && flatStyle.fontSize > 18) ||
      (flatStyle.fontWeight &&
        ["bold", "600", "700", "800", "900"].includes(
          String(flatStyle.fontWeight)
        )) ||
      flatStyle.marginBottom > 8
    ) {
      return "heading";
    }

    // Détection du contenu (texte long avec lineHeight)
    if (
      (flatStyle.lineHeight && flatStyle.lineHeight > 20) ||
      (flatStyle.fontSize && flatStyle.fontSize >= 16 && !flatStyle.fontWeight)
    ) {
      return "content";
    }

    // Par défaut: UI
    return "ui";
  };

  // Obtenir le style de police approprié
  const getFontStyleForType = () => {
    const type = detectFontType();
    switch (type) {
      case "content":
        return getContentFontStyle();
      case "heading":
        return getHeadingFontStyle();
      case "code":
        return getCodeFontStyle();
      case "ui":
      default:
        return getUIFontStyle();
    }
  };

  // Construire le style final
  const buildFinalStyle = () => {
    const fontStyle = getFontStyleForType();
    const sizeStyle = size ? { fontSize: FONT_SIZES[size] } : {};
    const weightStyle = weight ? { fontWeight: FONT_WEIGHTS[weight] } : {};

    return [fontStyle, sizeStyle, weightStyle, style];
  };

  return (
    <Text style={buildFinalStyle()} {...props}>
      {children}
    </Text>
  );
};

// Composants spécialisés pour un usage direct
export const UISmartText: React.FC<Omit<SmartTextProps, "fontType">> = (
  props
) => <SmartText fontType="ui" {...props} />;

export const ContentSmartText: React.FC<Omit<SmartTextProps, "fontType">> = (
  props
) => <SmartText fontType="content" {...props} />;

export const HeadingSmartText: React.FC<Omit<SmartTextProps, "fontType">> = (
  props
) => <SmartText fontType="heading" {...props} />;

export const CodeSmartText: React.FC<Omit<SmartTextProps, "fontType">> = (
  props
) => <SmartText fontType="code" {...props} />;

// HOC pour wrapper automatiquement les composants existants
export const withSmartFont = <P extends object>(
  Component: React.ComponentType<P>,
  defaultFontType: SmartTextProps["fontType"] = "auto"
) => {
  return React.forwardRef<any, P & SmartTextProps>((props, ref) => {
    const { fontType = defaultFontType, ...restProps } = props;
    return <Component ref={ref} fontType={fontType} {...(restProps as P)} />;
  });
};

// Hook pour obtenir directement un style de police
export const useSmartFontStyle = (
  fontType: "ui" | "content" | "heading" | "code"
) => {
  const {
    getUIFontStyle,
    getContentFontStyle,
    getHeadingFontStyle,
    getCodeFontStyle,
  } = useFont();

  switch (fontType) {
    case "content":
      return getContentFontStyle();
    case "heading":
      return getHeadingFontStyle();
    case "code":
      return getCodeFontStyle();
    case "ui":
    default:
      return getUIFontStyle();
  }
};
