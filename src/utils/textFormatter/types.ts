/**
 * Types et interfaces pour le formatage de texte
 */

/**
 * Types de formatage disponibles
 */
export enum TextFormatType {
  CAPITALIZE = 'capitalize',
  UPPERCASE = 'uppercase',
  LOWERCASE = 'lowercase',
  HIGHLIGHT = 'highlight',
  EMPHASIS = 'emphasis',
  COLOR = 'color',
  SIZE = 'size',
  SPLIT_SENTENCES = 'splitSentences',
  AUTO_PAUSE = 'autoPause',
  NORMALIZE = 'normalize',
  MARKDOWN = 'markdown'
}

/**
 * Options de formatage de texte
 */
export interface TextFormatOptions {
  type: TextFormatType;
  value?: string | number;
  color?: string;
  highlightColor?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  pauseMarker?: string;
  sentenceSeparator?: string;
}

/**
 * Options pour le formatage Markdown
 */
export interface MarkdownOptions {
  convertBold?: boolean;
  convertItalic?: boolean;
  convertHighlight?: boolean;
  convertHeaders?: boolean;
  convertLists?: boolean;
}

/**
 * Options pour l'optimisation téléprompter
 */
export interface TeleprompterOptions {
  addPauses?: boolean;
  splitSentences?: boolean;
  capitalize?: boolean;
  pauseMarker?: string;
  formatMarkdown?: boolean;
}

/**
 * Statistiques de texte
 */
export interface TextStatistics {
  characters: number;
  words: number;
  sentences: number;
  paragraphs: number;
  estimatedSeconds: number;
} 