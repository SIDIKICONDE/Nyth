import React from "react";
import { StyleProp, Text, TextStyle, View, TouchableOpacity } from "react-native";
import { GFMOptions, TableData } from './GFMFormatter';

/**
 * React Native Formatter pour GitHub Flavored Markdown
 * Supporte le rendu de tous les éléments GFM en composants React Native
 */

interface GFMReactOptions extends GFMOptions {
  baseStyle?: StyleProp<TextStyle>;
  tableStyle?: StyleProp<any>;
  taskListStyle?: StyleProp<TextStyle>;
  mentionStyle?: StyleProp<TextStyle>;
  issueStyle?: StyleProp<TextStyle>;
  linkStyle?: StyleProp<TextStyle>;
  emojiStyle?: StyleProp<TextStyle>;
  onMentionPress?: (username: string) => void;
  onIssuePress?: (issueNumber: string) => void;
  onLinkPress?: (url: string) => void;
  onTaskToggle?: (taskIndex: number, completed: boolean) => void;
  isComplete?: boolean;
}

export class GFMReactFormatter {
  /**
   * Traite un texte GFM complet en composants React
   */
  static processGFMText(
    text: string,
    options: GFMReactOptions = {}
  ): React.ReactNode {
    const paragraphs = text.split('\n\n');
    
    return paragraphs.map((paragraph, idx) => (
      <React.Fragment key={`gfm-paragraph-${idx}`}>
        {this.processGFMParagraph(paragraph, options)}
      </React.Fragment>
    ));
  }

  /**
   * Traite un paragraphe GFM
   */
  static processGFMParagraph(
    paragraph: string,
    options: GFMReactOptions = {}
  ): React.ReactNode {
    const { baseStyle = {} } = options;

    // Vérifier le type de paragraphe
    const isTable = this.isTable(paragraph);
    const isTaskList = this.isTaskList(paragraph);
    const isHeading = paragraph.match(/^(#{1,6}) (.+)$/);
    const isQuote = paragraph.match(/^> (.+)$/);
    const isList = paragraph.match(/^[-*+] (.+)$/);
    const isNumberedList = paragraph.match(/^(\d+)\. (.+)$/);

    if (isTable) {
      return this.renderTable(paragraph, options);
    }

    if (isTaskList) {
      return this.renderTaskList(paragraph, options);
    }

    if (isHeading) {
      return this.renderHeading(paragraph, options);
    }

    if (isQuote) {
      return this.renderQuote(paragraph, options);
    }

    if (isList) {
      return this.renderBulletList(paragraph, options);
    }

    if (isNumberedList) {
      return this.renderNumberedList(paragraph, options);
    }

    if (paragraph.trim() === "") {
      return <View style={{ height: 12 }} />;
    }

    // Paragraphe normal avec formatage inline
    return (
      <Text style={[baseStyle, { marginBottom: 8, lineHeight: 24 }]}>
        {this.processInlineGFM(paragraph, options)}
      </Text>
    );
  }

  /**
   * Traite le formatage inline GFM
   */
  static processInlineGFM(
    text: string,
    options: GFMReactOptions = {}
  ): React.ReactNode {
    // Traiter d'abord les emojis
    let processedText = this.processEmojis(text, options);
    
    // Puis les mentions et références
    processedText = this.processMentionsAndIssues(processedText, options);
    
    // Puis les liens automatiques
    processedText = this.processAutolinks(processedText, options);
    
    // Enfin le formatage Markdown standard
    return this.processStandardMarkdown(processedText, options);
  }

  /**
   * Vérifie si c'est un tableau
   */
  private static isTable(text: string): boolean {
    return /^\|(.+)\|\s*\n\|[-:\s|]+\|\s*\n/m.test(text);
  }

  /**
   * Vérifie si c'est une liste de tâches
   */
  private static isTaskList(text: string): boolean {
    return /^- \[[x ]\] /m.test(text);
  }

  /**
   * Rend un tableau
   */
  private static renderTable(
    text: string,
    options: GFMReactOptions
  ): React.ReactNode {
    const { tableStyle = {}, baseStyle = {} } = options;
    
    const tableRegex = /^\|(.+)\|\s*\n\|[-:\s|]+\|\s*\n((?:\|.+\|\s*\n?)*)/m;
    const match = text.match(tableRegex);
    
    if (!match) return null;

    const [, headerRow, bodyRows] = match;
    
    const headers = headerRow.split('|')
      .map((h: string) => h.trim())
      .filter((h: string) => h.length > 0);

    const rows = bodyRows.trim().split('\n')
      .map((row: string) => 
        row.split('|')
          .map((cell: string) => cell.trim())
          .filter((cell: string) => cell.length > 0)
      )
      .filter((row: string[]) => row.length > 0);

    return (
      <View style={[{
        borderWidth: 1,
        borderColor: '#ddd',
        marginVertical: 8,
        borderRadius: 4,
        overflow: 'hidden'
      }, tableStyle]}>
        {/* En-têtes */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: '#f5f5f5',
          borderBottomWidth: 1,
          borderBottomColor: '#ddd'
        }}>
          {headers.map((header, idx) => (
            <View key={`header-${idx}`} style={{
              flex: 1,
              padding: 8,
              borderRightWidth: idx < headers.length - 1 ? 1 : 0,
              borderRightColor: '#ddd'
            }}>
              <Text style={[baseStyle, { fontWeight: 'bold', fontSize: 14 }]}>
                {this.processInlineGFM(header, options)}
              </Text>
            </View>
          ))}
        </View>
        
        {/* Lignes de données */}
        {rows.map((row, rowIdx) => (
          <View key={`row-${rowIdx}`} style={{
            flexDirection: 'row',
            borderBottomWidth: rowIdx < rows.length - 1 ? 1 : 0,
            borderBottomColor: '#eee'
          }}>
            {row.map((cell, cellIdx) => (
              <View key={`cell-${rowIdx}-${cellIdx}`} style={{
                flex: 1,
                padding: 8,
                borderRightWidth: cellIdx < row.length - 1 ? 1 : 0,
                borderRightColor: '#eee'
              }}>
                <Text style={[baseStyle, { fontSize: 13 }]}>
                  {this.processInlineGFM(cell, options)}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  }

  /**
   * Rend une liste de tâches
   */
  private static renderTaskList(
    text: string,
    options: GFMReactOptions
  ): React.ReactNode {
    const { taskListStyle = {}, baseStyle = {}, onTaskToggle } = options;
    
    const lines = text.split('\n');
    let taskIndex = 0;

    return (
      <View style={{ marginVertical: 4 }}>
        {lines.map((line, idx) => {
          const taskMatch = line.match(/^- \[([x ])\] (.+)$/);
          if (!taskMatch) return null;

          const [, checked, taskText] = taskMatch;
          const isChecked = checked === 'x';
          const currentTaskIndex = taskIndex++;

          return (
            <TouchableOpacity
              key={`task-${idx}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 2,
                paddingVertical: 4
              }}
              onPress={() => onTaskToggle?.(currentTaskIndex, !isChecked)}
              disabled={!onTaskToggle}
            >
              <Text style={[
                baseStyle,
                {
                  fontSize: 16,
                  marginRight: 8,
                  minWidth: 20,
                  color: isChecked ? '#28a745' : '#6c757d'
                }
              ]}>
                {isChecked ? '✅' : '☐'}
              </Text>
              <Text style={[
                baseStyle,
                taskListStyle,
                {
                  flex: 1,
                  textDecorationLine: isChecked ? 'line-through' : 'none',
                  opacity: isChecked ? 0.7 : 1,
                  lineHeight: 20
                }
              ]}>
                {this.processInlineGFM(taskText, options)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  /**
   * Rend un titre
   */
  private static renderHeading(
    text: string,
    options: GFMReactOptions
  ): React.ReactNode {
    const { baseStyle = {} } = options;
    const match = text.match(/^(#{1,6}) (.+)$/);
    if (!match) return null;

    const [, hashes, content] = match;
    const level = hashes.length;
    const fontSize = level === 1 ? 28 : level === 2 ? 24 : level === 3 ? 20 : level === 4 ? 18 : level === 5 ? 16 : 14;

    return (
      <Text style={[
        baseStyle,
        {
          fontWeight: 'bold',
          fontSize,
          marginTop: level <= 2 ? 20 : 16,
          marginBottom: level <= 2 ? 12 : 8,
          color: '#1f2328'
        }
      ]}>
        {this.processInlineGFM(content, options)}
      </Text>
    );
  }

  /**
   * Rend une citation
   */
  private static renderQuote(
    text: string,
    options: GFMReactOptions
  ): React.ReactNode {
    const { baseStyle = {} } = options;
    const content = text.replace(/^> /, '');

    return (
      <View style={{
        borderLeftWidth: 4,
        borderLeftColor: '#d0d7de',
        paddingLeft: 16,
        paddingVertical: 8,
        marginVertical: 8,
        backgroundColor: '#f6f8fa'
      }}>
        <Text style={[
          baseStyle,
          {
            fontStyle: 'italic',
            color: '#656d76',
            lineHeight: 24
          }
        ]}>
          {this.processInlineGFM(content, options)}
        </Text>
      </View>
    );
  }

  /**
   * Rend une liste à puces
   */
  private static renderBulletList(
    text: string,
    options: GFMReactOptions
  ): React.ReactNode {
    const { baseStyle = {} } = options;
    const content = text.replace(/^[-*+] /, '');

    return (
      <View style={{
        flexDirection: 'row',
        marginVertical: 2,
        paddingLeft: 8
      }}>
        <Text style={[baseStyle, { fontWeight: '600', minWidth: 16 }]}>
          •{" "}
        </Text>
        <View style={{ flex: 1 }}>
          <Text style={[baseStyle, { lineHeight: 24 }]}>
            {this.processInlineGFM(content, options)}
          </Text>
        </View>
      </View>
    );
  }

  /**
   * Rend une liste numérotée
   */
  private static renderNumberedList(
    text: string,
    options: GFMReactOptions
  ): React.ReactNode {
    const { baseStyle = {} } = options;
    const match = text.match(/^(\d+)\. (.+)$/);
    if (!match) return null;

    const [, number, content] = match;

    return (
      <View style={{
        flexDirection: 'row',
        marginVertical: 2,
        paddingLeft: 8
      }}>
        <Text style={[baseStyle, { fontWeight: '600', minWidth: 24 }]}>
          {number}.{" "}
        </Text>
        <View style={{ flex: 1 }}>
          <Text style={[baseStyle, { lineHeight: 24 }]}>
            {this.processInlineGFM(content, options)}
          </Text>
        </View>
      </View>
    );
  }

  /**
   * Traite les emojis
   */
  private static processEmojis(
    text: string,
    options: GFMReactOptions
  ): React.ReactNode {
    const { emojiStyle = {} } = options;
    const elements: React.ReactNode[] = [];
    
    // Map d'emojis de base (version réduite pour React)
    const emojiMap: { [key: string]: string } = {
      ':smile:': '😄', ':heart:': '❤️', ':rocket:': '🚀', ':fire:': '🔥',
      ':thumbsup:': '👍', ':thumbsdown:': '👎', ':clap:': '👏', ':wave:': '👋',
      ':star:': '⭐', ':sparkles:': '✨', ':zap:': '⚡', ':boom:': '💥',
      ':ok_hand:': '👌', ':muscle:': '💪', ':pray:': '🙏', ':raised_hands:': '🙌',
      ':joy:': '😂', ':sob:': '😭', ':sweat_smile:': '😅', ':thinking:': '🤔',
      ':flushed:': '😳', ':scream:': '😱', ':sunglasses:': '😎', ':wink:': '😉',
      ':computer:': '💻', ':phone:': '📱', ':email:': '📧', ':gear:': '⚙️',
      ':wrench:': '🔧', ':hammer:': '🔨', ':bulb:': '💡', ':lock:': '🔒',
      ':key:': '🔑', ':mag:': '🔍', ':link:': '🔗', ':paperclip:': '📎',
      ':heavy_check_mark:': '✅', ':x:': '❌', ':warning:': '⚠️', ':exclamation:': '❗',
      ':question:': '❓', ':information_source:': 'ℹ️', ':arrow_right:': '➡️', ':arrow_left:': '⬅️'
    };

    const emojiRegex = /(:([a-z_]+):)/g;
    const parts = text.split(emojiRegex);

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (i % 3 === 1) { // C'est un emoji complet (:emoji:)
        const emoji = emojiMap[part] || part;
        elements.push(
          <Text key={`emoji-${i}`} style={[{ fontSize: 16 }, emojiStyle]}>
            {emoji}
          </Text>
        );
      } else if (i % 3 === 0 && part) { // Texte normal
        elements.push(part);
      }
    }

    return elements.length > 1 ? elements : text;
  }

  /**
   * Traite les mentions et références d'issues
   */
  private static processMentionsAndIssues(
    text: React.ReactNode,
    options: GFMReactOptions
  ): React.ReactNode {
    if (typeof text !== 'string') return text;
    
    const { mentionStyle = {}, issueStyle = {}, onMentionPress, onIssuePress } = options;
    const elements: React.ReactNode[] = [];
    
    // Pattern combiné pour mentions et issues
    const pattern = /(@([a-zA-Z0-9_-]+))|(#(\d+))/g;
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      // Ajouter le texte avant le match
      if (match.index > lastIndex) {
        elements.push(text.substring(lastIndex, match.index));
      }

      if (match[1]) { // C'est une mention @username
        const username = match[2];
        elements.push(
          <Text
            key={`mention-${match.index}`}
            style={[
              {
                color: '#0969da',
                fontWeight: '600'
              },
              mentionStyle
            ]}
            onPress={() => onMentionPress?.(username)}
          >
            @{username}
          </Text>
        );
      } else if (match[3]) { // C'est une référence d'issue #123
        const issueNumber = match[4];
        elements.push(
          <Text
            key={`issue-${match.index}`}
            style={[
              {
                color: '#0969da',
                fontWeight: '600'
              },
              issueStyle
            ]}
            onPress={() => onIssuePress?.(issueNumber)}
          >
            #{issueNumber}
          </Text>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Ajouter le reste du texte
    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }

    return elements.length > 1 ? elements : text;
  }

  /**
   * Traite les liens automatiques
   */
  private static processAutolinks(
    text: React.ReactNode,
    options: GFMReactOptions
  ): React.ReactNode {
    if (typeof text !== 'string') return text;
    
    const { linkStyle = {}, onLinkPress } = options;
    const elements: React.ReactNode[] = [];
    
    // Pattern pour URLs et emails
    const urlRegex = /(https?:\/\/[^\s<>]+)|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    let lastIndex = 0;
    let match;

    while ((match = urlRegex.exec(text)) !== null) {
      // Ajouter le texte avant le match
      if (match.index > lastIndex) {
        elements.push(text.substring(lastIndex, match.index));
      }

      const link = match[0];
      const isEmail = match[2];
      
      elements.push(
        <Text
          key={`link-${match.index}`}
          style={[
            {
              color: '#0969da',
              textDecorationLine: 'underline'
            },
            linkStyle
          ]}
          onPress={() => onLinkPress?.(isEmail ? `mailto:${link}` : link)}
        >
          {link}
        </Text>
      );

      lastIndex = match.index + match[0].length;
    }

    // Ajouter le reste du texte
    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }

    return elements.length > 1 ? elements : text;
  }

  /**
   * Traite le formatage Markdown standard
   */
  private static processStandardMarkdown(
    text: React.ReactNode,
    options: GFMReactOptions
  ): React.ReactNode {
    if (typeof text !== 'string') return text;
    
    const { baseStyle = {} } = options;
    const elements: React.ReactNode[] = [];

    // Traiter le code inline en premier
    const codeRegex = /`([^`]+)`/g;
    const codeParts = text.split(codeRegex);

    if (codeParts.length > 1) {
      codeParts.forEach((part, idx) => {
        if (idx % 2 === 0) {
          // Texte normal, continuer avec les autres formatages
          if (part) {
            elements.push(...this.processOtherFormatting(part, baseStyle));
          }
        } else {
          // Code inline
          elements.push(
            <Text
              key={`code-${idx}`}
              style={[
                baseStyle,
                {
                  fontFamily: 'Courier',
                  backgroundColor: '#f6f8fa',
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                  borderRadius: 3,
                  fontSize: 13,
                  color: '#d73a49'
                }
              ]}
            >
              {part}
            </Text>
          );
        }
      });
      return elements;
    }

    return this.processOtherFormatting(text, baseStyle);
  }

  /**
   * Traite les autres formatages (gras, italique, barré, surlignage)
   */
  private static processOtherFormatting(
    text: string,
    baseStyle: StyleProp<TextStyle>
  ): React.ReactNode[] {
    const elements: React.ReactNode[] = [];

    // Traiter le texte barré ~~texte~~
    const strikethroughRegex = /~~([^~]+)~~/g;
    const strikethroughParts = text.split(strikethroughRegex);

    if (strikethroughParts.length > 1) {
      strikethroughParts.forEach((part, idx) => {
        if (idx % 2 === 0) {
          if (part) {
            elements.push(...this.processBoldItalic(part, baseStyle, `strike-normal-${idx}`));
          }
        } else {
          elements.push(
            <Text
              key={`strikethrough-${idx}`}
              style={[baseStyle, { textDecorationLine: 'line-through', opacity: 0.7 }]}
            >
              {part}
            </Text>
          );
        }
      });
      return elements;
    }

    return this.processBoldItalic(text, baseStyle, 'main');
  }

  /**
   * Traite le gras et l'italique
   */
  private static processBoldItalic(
    text: string,
    baseStyle: StyleProp<TextStyle>,
    keyPrefix: string
  ): React.ReactNode[] {
    const elements: React.ReactNode[] = [];

    // Traiter le surlignage ^texte^ en premier
    const highlightRegex = /\^([^^]+)\^/g;
    const highlightParts = text.split(highlightRegex);

    if (highlightParts.length > 1) {
      highlightParts.forEach((part, idx) => {
        if (idx % 2 === 0) {
          if (part) {
            elements.push(...this.processBasicFormatting(part, baseStyle, `${keyPrefix}-highlight-normal-${idx}`));
          }
        } else {
          elements.push(
            <Text
              key={`${keyPrefix}-highlight-${idx}`}
              style={[baseStyle, { backgroundColor: '#fff3cd', color: '#856404' }]}
            >
              {part}
            </Text>
          );
        }
      });
      return elements;
    }

    return this.processBasicFormatting(text, baseStyle, keyPrefix);
  }

  /**
   * Traite le formatage de base (gras et italique)
   */
  private static processBasicFormatting(
    text: string,
    baseStyle: StyleProp<TextStyle>,
    keyPrefix: string
  ): React.ReactNode[] {
    const elements: React.ReactNode[] = [];

    // Gras et italique combiné ***texte***
    const boldItalicRegex = /\*\*\*([^*]+)\*\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldItalicRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        elements.push(...this.processBoldOnly(beforeText, baseStyle, `${keyPrefix}-before-${match.index}`));
      }

      elements.push(
        <Text
          key={`${keyPrefix}-bold-italic-${match.index}`}
          style={[baseStyle, { fontWeight: 'bold', fontStyle: 'italic' }]}
        >
          {match[1]}
        </Text>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      const remaining = text.substring(lastIndex);
      elements.push(...this.processBoldOnly(remaining, baseStyle, `${keyPrefix}-end`));
    }

    return elements.length > 0 ? elements : [text];
  }

  /**
   * Traite uniquement le gras
   */
  private static processBoldOnly(
    text: string,
    baseStyle: StyleProp<TextStyle>,
    keyPrefix: string
  ): React.ReactNode[] {
    const elements: React.ReactNode[] = [];

    // **texte** et __texte__
    const boldRegex = /(\*\*([^*]+)\*\*)|(__([^_]+)__)/g;
    const parts = text.split(boldRegex);

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (!part) continue;
      
      if (parts[i - 1] === '**' || parts[i - 1] === '__') {
        // C'est du texte gras
        elements.push(
          <Text key={`${keyPrefix}-bold-${i}`} style={[baseStyle, { fontWeight: 'bold' }]}>
            {part}
          </Text>
        );
      } else if (part !== '**' && part !== '__') {
        // Texte normal, traiter l'italique
        elements.push(...this.processItalicOnly(part, baseStyle, `${keyPrefix}-${i}`));
      }
    }

    return elements.length > 0 ? elements : [text];
  }

  /**
   * Traite uniquement l'italique
   */
  private static processItalicOnly(
    text: string,
    baseStyle: StyleProp<TextStyle>,
    keyPrefix: string
  ): React.ReactNode[] {
    const elements: React.ReactNode[] = [];

    // *texte* et _texte_
    const italicRegex = /(\*([^*]+)\*)|(_([^_]+)_)/g;
    const parts = text.split(italicRegex);

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (!part) continue;
      
      if (parts[i - 1] === '*' || parts[i - 1] === '_') {
        // C'est du texte italique
        elements.push(
          <Text key={`${keyPrefix}-italic-${i}`} style={[baseStyle, { fontStyle: 'italic' }]}>
            {part}
          </Text>
        );
      } else if (part !== '*' && part !== '_') {
        // Texte normal
        elements.push(
          <Text key={`${keyPrefix}-normal-${i}`} style={baseStyle}>
            {part}
          </Text>
        );
      }
    }

    return elements.length > 0 ? elements : [
      <Text key={`${keyPrefix}-plain`} style={baseStyle}>{text}</Text>
    ];
  }
}
