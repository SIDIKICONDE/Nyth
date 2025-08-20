import React, { createContext, useContext, useEffect } from "react";
import { Text, TextProps } from "react-native";
import { useFont } from "./FontContext";

import { createOptimizedLogger } from '../utils/optimizedLogger';
const logger = createOptimizedLogger('GlobalFontProvider');

// Interface pour le contexte global de police
interface GlobalFontContextType {
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

// Contexte global
const GlobalFontContext = createContext<GlobalFontContextType>({
  isEnabled: true,
  setEnabled: () => {},
});

// Hook pour utiliser le contexte global
export const useGlobalFont = () => useContext(GlobalFontContext);

// Sauvegarde du composant Text original
const OriginalText = Text;

// Interface pour les props étendues du composant Text
interface EnhancedTextProps extends TextProps {
  fontType?: "ui" | "content" | "heading" | "code" | "auto";
  disableGlobalFont?: boolean;
}

// Composant Text amélioré qui applique automatiquement les polices
const EnhancedText: React.FC<EnhancedTextProps> = ({
  style,
  fontType = "auto",
  disableGlobalFont = false,
  children,
  ...props
}) => {
  const {
    getUIFontStyle,
    getContentFontStyle,
    getHeadingFontStyle,
    getCodeFontStyle,
  } = useFont();
  const { isEnabled } = useGlobalFont();

  // Si le système global est désactivé ou si ce composant l'exclut explicitement
  if (!isEnabled || disableGlobalFont) {
    return (
      <OriginalText style={style} {...props}>
        {children}
      </OriginalText>
    );
  }

  // Déterminer automatiquement le type de police si 'auto'
  const determineFontType = (): "ui" | "content" | "heading" | "code" => {
    if (fontType !== "auto") return fontType;

    // Logique de détection automatique basée sur le style
    const flatStyle = Array.isArray(style)
      ? Object.assign({}, ...style)
      : style || {};

    // Si c'est du code (fontFamily monospace ou backgroundColor)
    if (flatStyle.fontFamily?.includes("mono") || flatStyle.backgroundColor) {
      return "code";
    }

    // Si c'est un titre (fontSize > 18 ou fontWeight bold)
    if (
      (flatStyle.fontSize && flatStyle.fontSize > 18) ||
      (flatStyle.fontWeight &&
        ["bold", "600", "700", "800", "900"].includes(
          flatStyle.fontWeight.toString()
        ))
    ) {
      return "heading";
    }

    // Si c'est dans un contexte de message/contenu (lineHeight élevé)
    if (flatStyle.lineHeight && flatStyle.lineHeight > 20) {
      return "content";
    }

    // Par défaut, UI
    return "ui";
  };

  // Obtenir le style de police approprié
  const getFontStyle = () => {
    const type = determineFontType();
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

  const fontStyle = getFontStyle();
  const combinedStyle = Array.isArray(style)
    ? [fontStyle, ...style]
    : [fontStyle, style];

  return (
    <OriginalText style={combinedStyle} {...props}>
      {children}
    </OriginalText>
  );
};

// Provider principal
export const GlobalFontProvider: React.FC<{
  children: React.ReactNode;
  enabled?: boolean;
}> = ({ children, enabled = true }) => {
  const [isEnabled, setEnabled] = React.useState(enabled);

  // Remplacer le composant Text global
  useEffect(() => {
    if (!isEnabled) {
      return; // Sortir tôt si désactivé
    }

    // Note: Cette approche est expérimentale et peut nécessiter des ajustements
    // Pour une approche plus stable, utilisez les composants Typography directement
    logger.debug("GlobalFontProvider activé - utilisation expérimentale");

    // Créer un proxy pour intercepter la création des composants Text
    const originalCreateElement = React.createElement;

    // @ts-ignore - Remplacement expérimental du composant Text global
    React.createElement = (type: any, props: any, ...children: any[]) => {
      if (type === OriginalText || type === Text) {
        return originalCreateElement(EnhancedText, props, ...children);
      }
      return originalCreateElement(type, props, ...children);
    };

    return () => {
      // Restaurer l'original au démontage
      // @ts-ignore
      React.createElement = originalCreateElement;
    };
  }, [isEnabled]);

  const contextValue: GlobalFontContextType = {
    isEnabled,
    setEnabled,
  };

  return (
    <GlobalFontContext.Provider value={contextValue}>
      {children}
    </GlobalFontContext.Provider>
  );
};

// Hook pour forcer un type de police spécifique
export const useTypedText = (
  fontType: "ui" | "content" | "heading" | "code"
) => {
  const {
    getUIFontStyle,
    getContentFontStyle,
    getHeadingFontStyle,
    getCodeFontStyle,
  } = useFont();

  const getStyle = () => {
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

  return getStyle();
};

// Composants utilitaires pour forcer un type spécifique
export const UITextGlobal: React.FC<TextProps> = (props) => (
  <EnhancedText fontType="ui" {...props} />
);

export const ContentTextGlobal: React.FC<TextProps> = (props) => (
  <EnhancedText fontType="content" {...props} />
);

export const HeadingTextGlobal: React.FC<TextProps> = (props) => (
  <EnhancedText fontType="heading" {...props} />
);

export const CodeTextGlobal: React.FC<TextProps> = (props) => (
  <EnhancedText fontType="code" {...props} />
);

// Export du composant Text amélioré
export { EnhancedText };
