import React from "react";
import { Text, TextProps, TextStyle } from "react-native";
import { useFont } from "../../contexts/FontContext";

// Interface de base pour tous les composants de texte
interface BaseTextProps extends TextProps {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
}

// Interface pour les composants avec tailles prédéfinies (compatible avec les anciennes API)
interface SizedTextProps extends BaseTextProps {
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | number;
  weight?:
    | "light"
    | "normal"
    | "medium"
    | "semibold"
    | "bold"
    | "300"
    | "400"
    | "500"
    | "600"
    | "700";
  color?: string;
  align?: "left" | "center" | "right" | "justify";
}

// Utilitaire pour obtenir la taille de police (compatible avec les anciennes API)
const getFontSize = (size: SizedTextProps["size"] = "base"): number => {
  if (typeof size === "number") {
    return size;
  }
  const sizes = {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  };
  return sizes[size];
};

// Utilitaire pour obtenir le poids de police (compatible avec les anciennes API)
const getFontWeight = (
  weight: SizedTextProps["weight"] = "normal"
): TextStyle["fontWeight"] => {
  // Si c'est déjà une valeur numérique, la retourner directement
  if (
    weight === "300" ||
    weight === "400" ||
    weight === "500" ||
    weight === "600" ||
    weight === "700"
  ) {
    return weight as TextStyle["fontWeight"];
  }

  const weights = {
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  };
  return weights[weight as keyof typeof weights] as TextStyle["fontWeight"];
};

// Composant de base pour le texte d'interface utilisateur
export const UIText: React.FC<SizedTextProps> = ({
  children,
  style,
  size = "base",
  weight = "normal",
  color,
  align,
  ...props
}) => {
  const { getUIFontStyle } = useFont();

  const textStyle: TextStyle = {
    fontSize: getFontSize(size),
    fontWeight: getFontWeight(weight),
    ...(color && { color }),
    ...(align && { textAlign: align }),
    ...getUIFontStyle(),
  };

  return (
    <Text style={[textStyle, style]} {...props}>
      {children}
    </Text>
  );
};

// Composant pour le texte de contenu (messages, articles, etc.)
export const ContentText: React.FC<SizedTextProps> = ({
  children,
  style,
  size = "base",
  weight = "normal",
  color,
  align,
  ...props
}) => {
  const { getContentFontStyle } = useFont();

  const textStyle: TextStyle = {
    fontSize: getFontSize(size),
    fontWeight: getFontWeight(weight),
    lineHeight: getFontSize(size) * 1.4, // Meilleur espacement pour la lecture
    ...(color && { color }),
    ...(align && { textAlign: align }),
    ...getContentFontStyle(),
  };

  return (
    <Text style={[textStyle, style]} {...props}>
      {children}
    </Text>
  );
};

// Composant pour les titres
export const HeadingText: React.FC<SizedTextProps> = ({
  children,
  style,
  size = "xl",
  weight = "bold",
  color,
  ...props
}) => {
  const { getHeadingFontStyle } = useFont();

  const textStyle: TextStyle = {
    fontSize: getFontSize(size),
    fontWeight: getFontWeight(weight),
    lineHeight: getFontSize(size) * 1.2, // Espacement plus serré pour les titres
    ...(color && { color }),
    ...getHeadingFontStyle(),
  };

  return (
    <Text style={[textStyle, style]} {...props}>
      {children}
    </Text>
  );
};

// Composant pour le code
export const CodeText: React.FC<SizedTextProps> = ({
  children,
  style,
  size = "sm",
  weight = "normal",
  ...props
}) => {
  const { getCodeFontStyle } = useFont();

  const textStyle: TextStyle = {
    fontSize: getFontSize(size),
    fontWeight: getFontWeight(weight),
    letterSpacing: 0.5, // Espacement pour améliorer la lisibilité du code
    ...getCodeFontStyle(),
  };

  return (
    <Text style={[textStyle, style]} {...props}>
      {children}
    </Text>
  );
};

// Composants de titre prédéfinis
export const H1: React.FC<BaseTextProps> = ({ children, style, ...props }) => (
  <HeadingText size="4xl" weight="bold" style={style} {...props}>
    {children}
  </HeadingText>
);

export const H2: React.FC<BaseTextProps> = ({ children, style, ...props }) => (
  <HeadingText size="3xl" weight="bold" style={style} {...props}>
    {children}
  </HeadingText>
);

export const H3: React.FC<BaseTextProps> = ({ children, style, ...props }) => (
  <HeadingText size="2xl" weight="semibold" style={style} {...props}>
    {children}
  </HeadingText>
);

export const H4: React.FC<BaseTextProps> = ({ children, style, ...props }) => (
  <HeadingText size="xl" weight="semibold" style={style} {...props}>
    {children}
  </HeadingText>
);

export const H5: React.FC<BaseTextProps> = ({ children, style, ...props }) => (
  <HeadingText size="lg" weight="medium" style={style} {...props}>
    {children}
  </HeadingText>
);

export const H6: React.FC<BaseTextProps> = ({ children, style, ...props }) => (
  <HeadingText size="base" weight="medium" style={style} {...props}>
    {children}
  </HeadingText>
);

// Composants de texte spécialisés
export const Paragraph: React.FC<BaseTextProps> = ({
  children,
  style,
  ...props
}) => (
  <ContentText size="base" weight="normal" style={style} {...props}>
    {children}
  </ContentText>
);

export const Caption: React.FC<BaseTextProps> = ({
  children,
  style,
  ...props
}) => (
  <UIText size="xs" weight="normal" style={style} {...props}>
    {children}
  </UIText>
);

export const Label: React.FC<SizedTextProps> = ({
  children,
  style,
  size = "sm",
  weight = "medium",
  ...props
}) => (
  <UIText size={size} weight={weight} style={style} {...props}>
    {children}
  </UIText>
);

export const ButtonText: React.FC<BaseTextProps> = ({
  children,
  style,
  ...props
}) => (
  <UIText size="base" weight="semibold" style={style} {...props}>
    {children}
  </UIText>
);

export const HelpText: React.FC<SizedTextProps> = ({
  children,
  style,
  ...props
}) => (
  <UIText size="xs" weight="normal" style={style} {...props}>
    {children}
  </UIText>
);

// Hook personnalisé pour obtenir les styles de texte
export const useTextStyles = () => {
  const {
    getUIFontStyle,
    getContentFontStyle,
    getHeadingFontStyle,
    getCodeFontStyle,
  } = useFont();

  return {
    ui: getUIFontStyle,
    content: getContentFontStyle,
    heading: getHeadingFontStyle,
    code: getCodeFontStyle,
  };
};
