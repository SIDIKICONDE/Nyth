import React, { useContext } from "react";
import { Linking, StyleProp, Text, TextStyle, View } from "react-native";
import { FontContext } from "../../contexts/FontContext";

/**
 * Module unifié pour le formatage de texte avec composants React
 * Combine les fonctionnalités de textFormatting.tsx avec le système modulaire textFormatter
 */

/**
 * Hook personnalisé pour obtenir les styles de police courants
 */
export const useFormattingStyles = () => {
  const fontContext = useContext(FontContext);
  return {
    getFontFamily:
      fontContext?.getContentFontStyle || (() => ({ fontFamily: "System" })),
  };
};

/**
 * Interface pour les options de formatage React
 */
interface ReactFormatOptions {
  baseStyle?: StyleProp<TextStyle>;
  linkColor?: string;
  isComplete?: boolean;
  enableLinks?: boolean;
  enableMarkdown?: boolean;
}

/**
 * Classe principale pour le formatage React
 */
export class ReactFormatter {
  /**
   * Traite les liens dans un texte et les rend cliquables
   */
  static processLinks(
    textPart: string,
    options: ReactFormatOptions = {}
  ): React.ReactNode {
    const {
      isComplete = true,
      linkColor = "#3b82f6",
      baseStyle = {},
    } = options;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = textPart.split(urlRegex);

    if (parts.length === 1) {
      return textPart; // Pas de lien trouvé
    }

    return parts.map((part, idx) => {
      if (part.match(urlRegex)) {
        return (
          <Text
            key={idx}
            style={{
              color: linkColor,
              textDecorationLine: "underline",
              fontWeight: "600",
              ...(baseStyle as any),
            }}
            onPress={() => {
              if (isComplete) {
                Linking.openURL(part);
              }
            }}
          >
            {part}
          </Text>
        );
      }
      return part;
    });
  }

  /**
   * Traite le texte pour les mises en forme Markdown (gras, italique, surlignage, etc.)
   */
  static processMarkdownStyles(
    text: string,
    options: ReactFormatOptions = {}
  ): React.ReactNode {
    const { baseStyle = {}, isComplete = true } = options;

    const processedText = text;
    const elements: React.ReactNode[] = [];

    // Traiter d'abord le surlignage ^texte^
    const highlightRegex = /\^(.*?)\^/g;
    const highlightParts = processedText.split(highlightRegex);

    if (highlightParts.length > 1) {
      highlightParts.forEach((part, idx) => {
        if (idx % 2 === 0) {
          // Texte normal ou avec autres formatages
          if (part) {
            elements.push(
              ...this.processOtherMarkdown(
                part,
                baseStyle,
                `highlight-normal-${idx}`
              )
            );
          }
        } else {
          // Texte surligné
          elements.push(
            <Text
              key={`highlight-${idx}`}
              style={[
                baseStyle,
                { backgroundColor: "#FFFF00", color: "#000000" },
              ]}
            >
              {part}
            </Text>
          );
        }
      });
      return elements.length > 0 ? elements : text;
    }

    // Pas de surlignage, traiter les autres formatages
    return this.processOtherMarkdown(processedText, baseStyle, "main");
  }

  /**
   * Traite les autres formatages Markdown (gras, italique)
   */
  private static processOtherMarkdown(
    text: string,
    baseStyle: StyleProp<TextStyle>,
    keyPrefix: string
  ): React.ReactNode[] {
    const elements: React.ReactNode[] = [];

    // Pattern pour ***gras italique***
    const boldItalicRegex = /\*\*\*(.*?)\*\*\*/g;
    let lastIndex = 0;
    let match;

    // Traiter gras + italique
    while ((match = boldItalicRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        // Traiter le texte avant le match pour d'autres styles
        const beforeText = text.substring(lastIndex, match.index);
        elements.push(
          ...this.processRemainingStyles(
            beforeText,
            baseStyle,
            `${keyPrefix}-before-${match.index}`
          )
        );
      }

      elements.push(
        <Text
          key={`${keyPrefix}-bold-italic-${match.index}`}
          style={[baseStyle, { fontWeight: "bold", fontStyle: "italic" }]}
        >
          {match[1]}
        </Text>
      );

      lastIndex = match.index + match[0].length;
    }

    // Traiter le reste du texte
    if (lastIndex < text.length) {
      const remaining = text.substring(lastIndex);
      elements.push(
        ...this.processRemainingStyles(remaining, baseStyle, `${keyPrefix}-end`)
      );
    }

    return elements.length > 0 ? elements : [text];
  }

  /**
   * Traite les styles restants (gras seul, italique seul)
   */
  private static processRemainingStyles(
    text: string,
    baseStyle: StyleProp<TextStyle>,
    keyPrefix: string
  ): React.ReactNode[] {
    const elements: React.ReactNode[] = [];

    // Pattern pour **gras**
    const boldRegex = /\*\*(.*?)\*\*/g;
    const boldParts = text.split(boldRegex);

    if (boldParts.length > 1) {
      boldParts.forEach((part, idx) => {
        if (idx % 2 === 0) {
          // Texte normal ou italique
          if (part) {
            elements.push(
              ...this.processItalicStyles(
                part,
                baseStyle,
                `${keyPrefix}-normal-${idx}`
              )
            );
          }
        } else {
          // Texte en gras
          elements.push(
            <Text
              key={`${keyPrefix}-bold-${idx}`}
              style={[baseStyle, { fontWeight: "bold" }]}
            >
              {part}
            </Text>
          );
        }
      });
    } else {
      // Pas de gras, traiter l'italique
      elements.push(...this.processItalicStyles(text, baseStyle, keyPrefix));
    }

    return elements;
  }

  /**
   * Traite les styles italiques
   */
  private static processItalicStyles(
    text: string,
    baseStyle: StyleProp<TextStyle>,
    keyPrefix: string
  ): React.ReactNode[] {
    const elements: React.ReactNode[] = [];
    const italicRegex = /\*(.*?)\*/g;
    const italicParts = text.split(italicRegex);

    if (italicParts.length > 1) {
      italicParts.forEach((part, idx) => {
        if (idx % 2 === 0) {
          // Texte normal
          if (part) {
            elements.push(
              <Text key={`${keyPrefix}-normal-${idx}`} style={baseStyle}>
                {part}
              </Text>
            );
          }
        } else {
          // Texte en italique
          elements.push(
            <Text
              key={`${keyPrefix}-italic-${idx}`}
              style={[baseStyle, { fontStyle: "italic" }]}
            >
              {part}
            </Text>
          );
        }
      });
    } else {
      // Pas d'italique
      elements.push(
        <Text key={`${keyPrefix}-plain`} style={baseStyle}>
          {text}
        </Text>
      );
    }

    return elements;
  }

  /**
   * Traite un paragraphe complet avec tous les formatages
   */
  static processParagraph(
    paragraph: string,
    options: ReactFormatOptions = {}
  ): React.ReactNode {
    const { baseStyle = {}, isComplete = true } = options;

    // Vérifier le type de paragraphe
    const isListItem =
      paragraph.match(/^[\s]*[-*•][\s]+/) ||
      paragraph.match(/^[\s]*\d+\.[\s]+/);

    const isHeading = paragraph.match(/^#{1,3}[\s]+/);

    if (isListItem) {
      const indent = paragraph.match(/^[\s]+/) ? 12 : 0;
      const marker = paragraph.match(/^[\s]*[-*•]/)
        ? "• "
        : paragraph.match(/^[\s]*\d+\./)
        ? paragraph.match(/^[\s]*\d+\./)![0] + " "
        : "";

      const content = paragraph
        .replace(/^[\s]*[-*•][\s]+/, "")
        .replace(/^[\s]*\d+\.[\s]+/, "");

      return (
        <View
          style={{
            flexDirection: "row",
            marginVertical: 2,
            paddingLeft: indent,
          }}
        >
          <Text style={[baseStyle, { fontWeight: "700" }]}>{marker}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[baseStyle, { lineHeight: 21 }]}>
              {this.processTextWithAllStyles(content, options)}
            </Text>
          </View>
        </View>
      );
    } else if (isHeading) {
      const level = paragraph.match(/^#{1,3}/)![0].length;
      const fontSize = level === 1 ? 20 : level === 2 ? 18 : 16;
      const content = paragraph.replace(/^#{1,3}[\s]+/, "");

      return (
        <Text
          style={[
            baseStyle,
            {
              fontWeight: "bold",
              fontSize,
              marginTop: 6,
              marginBottom: 4,
            },
          ]}
        >
          {this.processTextWithAllStyles(content, options)}
        </Text>
      );
    } else if (paragraph.trim() === "") {
      return <View style={{ height: 8 }} />;
    } else {
      return (
        <Text
          style={[
            baseStyle,
            {
              marginBottom: 4,
              lineHeight: 21,
            },
          ]}
        >
          {this.processTextWithAllStyles(paragraph, options)}
        </Text>
      );
    }
  }

  /**
   * Traite un texte avec tous les styles (liens + markdown)
   */
  static processTextWithAllStyles(
    text: string,
    options: ReactFormatOptions = {}
  ): React.ReactNode {
    const { enableLinks = true, enableMarkdown = true } = options;

    // D'abord traiter les liens si activés
    if (enableLinks) {
      const processedWithLinks = this.processLinks(text, options);

      // Si c'est juste du texte, continuer avec le markdown
      if (typeof processedWithLinks === "string" && enableMarkdown) {
        return this.processMarkdownStyles(processedWithLinks, options);
      }

      return processedWithLinks;
    }

    // Sinon, traiter directement le markdown si activé
    if (enableMarkdown) {
      return this.processMarkdownStyles(text, options);
    }

    return text;
  }

  /**
   * Traite un texte complet divisé en paragraphes
   */
  static processFormattedText(
    text: string,
    options: ReactFormatOptions = {}
  ): React.ReactNode {
    const paragraphs = text.split("\n");

    return paragraphs.map((paragraph, idx) => (
      <React.Fragment key={idx}>
        {this.processParagraph(paragraph, options)}
      </React.Fragment>
    ));
  }
}

// Exports de compatibilité pour remplacer les anciennes fonctions
export const processLinks = (
  textPart: string,
  isComplete: boolean = true,
  linkColor: string = "#3b82f6",
  fontStyle?: StyleProp<TextStyle>
) =>
  ReactFormatter.processLinks(textPart, {
    isComplete,
    linkColor,
    baseStyle: fontStyle,
  });

export const processTextStyles = (
  text: string,
  baseStyle: StyleProp<TextStyle> = {},
  isComplete: boolean = true
) =>
  ReactFormatter.processTextWithAllStyles(text, {
    baseStyle,
    isComplete,
    enableLinks: true,
    enableMarkdown: true,
  });

export const processFormattedParagraph = (
  paragraph: string,
  baseStyle: StyleProp<TextStyle> = {},
  isComplete: boolean = true
) =>
  ReactFormatter.processParagraph(paragraph, {
    baseStyle,
    isComplete,
  });

export const processFormattedText = (
  text: string,
  baseStyle: StyleProp<TextStyle> = {},
  isComplete: boolean = true
) =>
  ReactFormatter.processFormattedText(text, {
    baseStyle,
    isComplete,
  });
