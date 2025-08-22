import React from "react";
import { StyleProp, Text, TextStyle, View } from "react-native";

/**
 * Formatage React étendu pour les éléments Markdown
 * Supporte le rendu React de tous les éléments Markdown étendus
 */

interface ExtendedReactFormatOptions {
  baseStyle?: StyleProp<TextStyle>;
  codeStyle?: StyleProp<TextStyle>;
  quoteStyle?: StyleProp<TextStyle>;
  headingStyles?: {
    h1?: StyleProp<TextStyle>;
    h2?: StyleProp<TextStyle>;
    h3?: StyleProp<TextStyle>;
  };
  isComplete?: boolean;
  // Options Markdown étendues
  convertBold?: boolean;
  convertItalic?: boolean;
  convertStrikethrough?: boolean;
  convertCode?: boolean;
  convertCodeBlocks?: boolean;
  convertHeaders?: boolean;
  convertQuotes?: boolean;
  convertLists?: boolean;
  convertNumberedLists?: boolean;
  convertHighlight?: boolean;
}

export class ExtendedReactFormatter {
  /**
   * Traite un texte avec tous les formatages Markdown étendus
   */
  static processExtendedMarkdown(
    text: string,
    options: ExtendedReactFormatOptions = {}
  ): React.ReactNode {
    const { baseStyle = {} } = options;

    // Traiter d'abord les blocs de code pour éviter les conflits
    return this.processCodeBlocks(text, options);
  }

  /**
   * Traite les blocs de code ```
   */
  private static processCodeBlocks(
    text: string,
    options: ExtendedReactFormatOptions
  ): React.ReactNode {
    const { baseStyle = {}, codeStyle = {} } = options;
    const elements: React.ReactNode[] = [];

    const codeBlockRegex = /```([\s\S]*?)```/g;
    const parts = text.split(codeBlockRegex);

    if (parts.length === 1) {
      // Pas de bloc de code, continuer avec le code inline
      return this.processInlineCode(text, options);
    }

    parts.forEach((part, idx) => {
      if (idx % 2 === 0) {
        // Texte normal
        if (part.trim()) {
          const processed = this.processInlineCode(part, options);
          if (Array.isArray(processed)) {
            elements.push(...processed);
          } else {
            elements.push(processed);
          }
        }
      } else {
        // Bloc de code
        elements.push(
          <View
            key={`codeblock-${idx}`}
            style={{
              backgroundColor: "#f6f8fa",
              padding: 12,
              marginVertical: 8,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: "#e1e4e8",
            }}
          >
            <Text
              style={[
                baseStyle,
                {
                  fontFamily: "Courier",
                  fontSize: 14,
                  color: "#24292e",
                  lineHeight: 20,
                },
                codeStyle,
              ]}
            >
              {part.trim()}
            </Text>
          </View>
        );
      }
    });

    return elements;
  }

  /**
   * Traite le code inline `code`
   */
  private static processInlineCode(
    text: string,
    options: ExtendedReactFormatOptions
  ): React.ReactNode {
    const { baseStyle = {}, codeStyle = {} } = options;
    const elements: React.ReactNode[] = [];

    const inlineCodeRegex = /`([^`]+)`/g;
    const parts = text.split(inlineCodeRegex);

    if (parts.length === 1) {
      // Pas de code inline, continuer avec le texte barré
      return this.processStrikethrough(text, options);
    }

    parts.forEach((part, idx) => {
      if (idx % 2 === 0) {
        // Texte normal
        if (part) {
          const processed = this.processStrikethrough(part, options);
          if (Array.isArray(processed)) {
            elements.push(...processed);
          } else {
            elements.push(processed);
          }
        }
      } else {
        // Code inline
        elements.push(
          <Text
            key={`inline-code-${idx}`}
            style={[
              baseStyle,
              {
                fontFamily: "Courier",
                backgroundColor: "#f3f4f4",
                paddingHorizontal: 4,
                paddingVertical: 2,
                borderRadius: 3,
                fontSize: 13,
                color: "#e36209",
              },
              codeStyle,
            ]}
          >
            {part}
          </Text>
        );
      }
    });

    return elements;
  }

  /**
   * Traite le texte barré ~~texte~~
   */
  private static processStrikethrough(
    text: string,
    options: ExtendedReactFormatOptions
  ): React.ReactNode {
    const { baseStyle = {} } = options;
    const elements: React.ReactNode[] = [];

    const strikethroughRegex = /~~([^~]+)~~/g;
    const parts = text.split(strikethroughRegex);

    if (parts.length === 1) {
      // Pas de texte barré, continuer avec le formatage standard
      return this.processStandardFormatting(text, options);
    }

    parts.forEach((part, idx) => {
      if (idx % 2 === 0) {
        // Texte normal
        if (part) {
          const processed = this.processStandardFormatting(part, options);
          if (Array.isArray(processed)) {
            elements.push(...processed);
          } else {
            elements.push(processed);
          }
        }
      } else {
        // Texte barré
        elements.push(
          <Text
            key={`strikethrough-${idx}`}
            style={[
              baseStyle,
              {
                textDecorationLine: "line-through",
                opacity: 0.7,
                color: "#6a737d",
              },
            ]}
          >
            {part}
          </Text>
        );
      }
    });

    return elements;
  }

  /**
   * Traite le formatage standard (gras, italique, surlignage)
   */
  private static processStandardFormatting(
    text: string,
    options: ExtendedReactFormatOptions
  ): React.ReactNode {
    const { baseStyle = {} } = options;
    const elements: React.ReactNode[] = [];

    // Traiter le surlignage ^texte^
    const highlightRegex = /\^([^^]+)\^/g;
    const parts = text.split(highlightRegex);

    if (parts.length === 1) {
      // Pas de surlignage, traiter gras/italique
      return this.processBoldItalic(text, options);
    }

    parts.forEach((part, idx) => {
      if (idx % 2 === 0) {
        // Texte normal
        if (part) {
          const processed = this.processBoldItalic(part, options);
          if (Array.isArray(processed)) {
            elements.push(...processed);
          } else {
            elements.push(processed);
          }
        }
      } else {
        // Texte surligné
        elements.push(
          <Text
            key={`highlight-${idx}`}
            style={[
              baseStyle,
              {
                backgroundColor: "#fff3cd",
                color: "#856404",
                paddingHorizontal: 2,
              },
            ]}
          >
            {part}
          </Text>
        );
      }
    });

    return elements;
  }

  /**
   * Traite le gras et l'italique
   */
  private static processBoldItalic(
    text: string,
    options: ExtendedReactFormatOptions
  ): React.ReactNode {
    const { baseStyle = {} } = options;
    const elements: React.ReactNode[] = [];

    // Traiter d'abord le gras et italique combiné ***texte***
    const boldItalicRegex = /\*\*\*([^*]+)\*\*\*/g;
    let remainingText = text;
    let lastIndex = 0;

    let match;
    while ((match = boldItalicRegex.exec(text)) !== null) {
      // Ajouter le texte avant le match
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        elements.push(...this.processBoldOnly(beforeText, options, `before-${match.index}`));
      }

      // Ajouter le texte gras et italique
      elements.push(
        <Text
          key={`bold-italic-${match.index}`}
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
      elements.push(...this.processBoldOnly(remaining, options, "remaining"));
    }

    return elements.length > 0 ? elements : [text];
  }

  /**
   * Traite uniquement le gras **texte** et __texte__
   */
  private static processBoldOnly(
    text: string,
    options: ExtendedReactFormatOptions,
    keyPrefix: string
  ): React.ReactNode[] {
    const { baseStyle = {} } = options;
    const elements: React.ReactNode[] = [];

    // Traiter **texte**
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const parts = text.split(boldRegex);

    if (parts.length > 1) {
      parts.forEach((part, idx) => {
        if (idx % 2 === 0) {
          // Texte normal, traiter l'italique
          if (part) {
            elements.push(...this.processItalicOnly(part, options, `${keyPrefix}-normal-${idx}`));
          }
        } else {
          // Texte gras
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
      // Pas de gras avec **, essayer __texte__
      const boldUnderscoreRegex = /__([^_]+)__/g;
      const underscoreParts = text.split(boldUnderscoreRegex);

      if (underscoreParts.length > 1) {
        underscoreParts.forEach((part, idx) => {
          if (idx % 2 === 0) {
            // Texte normal, traiter l'italique
            if (part) {
              elements.push(...this.processItalicOnly(part, options, `${keyPrefix}-underscore-normal-${idx}`));
            }
          } else {
            // Texte gras
            elements.push(
              <Text
                key={`${keyPrefix}-bold-underscore-${idx}`}
                style={[baseStyle, { fontWeight: "bold" }]}
              >
                {part}
              </Text>
            );
          }
        });
      } else {
        // Pas de gras, traiter l'italique
        elements.push(...this.processItalicOnly(text, options, keyPrefix));
      }
    }

    return elements;
  }

  /**
   * Traite uniquement l'italique *texte* et _texte_
   */
  private static processItalicOnly(
    text: string,
    options: ExtendedReactFormatOptions,
    keyPrefix: string
  ): React.ReactNode[] {
    const { baseStyle = {} } = options;
    const elements: React.ReactNode[] = [];

    // Traiter *texte* (en évitant les ** déjà traités)
    const italicRegex = /(?<!\*)\*([^*]+)\*(?!\*)/g;
    const parts = text.split(italicRegex);

    if (parts.length > 1) {
      parts.forEach((part, idx) => {
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
          // Texte italique
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
      // Pas d'italique avec *, essayer _texte_
      const italicUnderscoreRegex = /(?<!_)_([^_]+)_(?!_)/g;
      const underscoreParts = text.split(italicUnderscoreRegex);

      if (underscoreParts.length > 1) {
        underscoreParts.forEach((part, idx) => {
          if (idx % 2 === 0) {
            // Texte normal
            if (part) {
              elements.push(
                <Text key={`${keyPrefix}-underscore-normal-${idx}`} style={baseStyle}>
                  {part}
                </Text>
              );
            }
          } else {
            // Texte italique
            elements.push(
              <Text
                key={`${keyPrefix}-italic-underscore-${idx}`}
                style={[baseStyle, { fontStyle: "italic" }]}
              >
                {part}
              </Text>
            );
          }
        });
      } else {
        // Texte simple sans formatage
        elements.push(
          <Text key={`${keyPrefix}-plain`} style={baseStyle}>
            {text}
          </Text>
        );
      }
    }

    return elements;
  }

  /**
   * Traite un paragraphe complet avec tous les types (titres, citations, listes, etc.)
   */
  static processExtendedParagraph(
    paragraph: string,
    options: ExtendedReactFormatOptions = {}
  ): React.ReactNode {
    const { baseStyle = {}, headingStyles = {}, quoteStyle = {} } = options;

    // Vérifier le type de paragraphe
    const isHeading = paragraph.match(/^(#{1,3}) (.+)$/);
    const isQuote = paragraph.match(/^> (.+)$/);
    const isBulletList = paragraph.match(/^[-*+] (.+)$/);
    const isNumberedList = paragraph.match(/^(\d+)\. (.+)$/);

    if (isHeading) {
      const level = isHeading[1].length;
      const content = isHeading[2];
      const fontSize = level === 1 ? 24 : level === 2 ? 20 : 18;
      const headingStyle = level === 1 ? headingStyles.h1 : 
                          level === 2 ? headingStyles.h2 : headingStyles.h3;

      return (
        <Text
          style={[
            baseStyle,
            {
              fontWeight: "bold",
              fontSize,
              marginTop: level === 1 ? 16 : 12,
              marginBottom: 8,
              color: "#1f2328",
            },
            headingStyle,
          ]}
        >
          {this.processExtendedMarkdown(content, options)}
        </Text>
      );
    }

    if (isQuote) {
      const content = isQuote[1];
      
      return (
        <View
          style={{
            borderLeftWidth: 4,
            borderLeftColor: "#d0d7de",
            paddingLeft: 16,
            paddingVertical: 8,
            marginVertical: 8,
            backgroundColor: "#f6f8fa",
          }}
        >
          <Text
            style={[
              baseStyle,
              {
                fontStyle: "italic",
                color: "#656d76",
                lineHeight: 24,
              },
              quoteStyle,
            ]}
          >
            {this.processExtendedMarkdown(content, options)}
          </Text>
        </View>
      );
    }

    if (isBulletList) {
      const content = isBulletList[1];
      
      return (
        <View
          style={{
            flexDirection: "row",
            marginVertical: 2,
            paddingLeft: 8,
          }}
        >
          <Text style={[baseStyle, { fontWeight: "600", minWidth: 16 }]}>
            •{" "}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={[baseStyle, { lineHeight: 24 }]}>
              {this.processExtendedMarkdown(content, options)}
            </Text>
          </View>
        </View>
      );
    }

    if (isNumberedList) {
      const number = isNumberedList[1];
      const content = isNumberedList[2];
      
      return (
        <View
          style={{
            flexDirection: "row",
            marginVertical: 2,
            paddingLeft: 8,
          }}
        >
          <Text style={[baseStyle, { fontWeight: "600", minWidth: 24 }]}>
            {number}.{" "}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={[baseStyle, { lineHeight: 24 }]}>
              {this.processExtendedMarkdown(content, options)}
            </Text>
          </View>
        </View>
      );
    }

    // Paragraphe normal
    if (paragraph.trim() === "") {
      return <View style={{ height: 12 }} />;
    }

    return (
      <Text
        style={[
          baseStyle,
          {
            marginBottom: 8,
            lineHeight: 24,
          },
        ]}
      >
        {this.processExtendedMarkdown(paragraph, options)}
      </Text>
    );
  }

  /**
   * Traite un texte complet divisé en paragraphes
   */
  static processExtendedText(
    text: string,
    options: ExtendedReactFormatOptions = {}
  ): React.ReactNode {
    const paragraphs = text.split("\n");

    return paragraphs.map((paragraph, idx) => (
      <React.Fragment key={`paragraph-${idx}`}>
        {this.processExtendedParagraph(paragraph, options)}
      </React.Fragment>
    ));
  }
}
