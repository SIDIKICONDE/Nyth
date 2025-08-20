/**
 * Point d'entrée principal pour les utilitaires de formatage de texte
 * Maintient la compatibilité avec l'ancienne API TextFormatter
 */

// Exports des modules spécialisés
export { BasicFormatter } from "./BasicFormatter";
export { HtmlFormatter } from "./HtmlFormatter";
export { MarkdownFormatter } from "./MarkdownFormatter";
export {
  ReactFormatter,
  processFormattedParagraph,
  processFormattedText,
  processLinks,
  processTextStyles,
  useFormattingStyles,
} from "./ReactFormatter";
export { TeleprompterFormatter } from "./TeleprompterFormatter";
export { TextAnalyzer } from "./TextAnalyzer";
export * from "./types";

// Imports pour la classe de compatibilité
import { BasicFormatter } from "./BasicFormatter";
import { HtmlFormatter } from "./HtmlFormatter";
import { MarkdownFormatter } from "./MarkdownFormatter";
import { ReactFormatter } from "./ReactFormatter";
import { TeleprompterFormatter } from "./TeleprompterFormatter";
import { TextAnalyzer } from "./TextAnalyzer";
import { NoteFormatter } from "./NoteFormatter";

/**
 * Classe principale pour le formatage des textes
 * Maintient la compatibilité avec l'ancienne API
 */
export class TextFormatter {
  // === FORMATAGE DE BASE ===
  static toUpperCase = BasicFormatter.toUpperCase;
  static toLowerCase = BasicFormatter.toLowerCase;
  static capitalize = BasicFormatter.capitalize;
  static normalize = BasicFormatter.normalize;

  // === FORMATAGE MARKDOWN ===
  static applyMarkdownFormatting = MarkdownFormatter.applyMarkdownFormatting;
  static autoFormatText = MarkdownFormatter.autoFormatText;

  // === FORMATAGE TÉLÉPROMPTER ===
  static addAutoPauses = TeleprompterFormatter.addAutoPauses;
  static splitIntoSentences = TeleprompterFormatter.splitIntoSentences;
  static optimizeForTeleprompter =
    TeleprompterFormatter.optimizeForTeleprompter;

  // === FORMATAGE HTML ===
  static escapeHtmlTags = HtmlFormatter.escapeHtmlTags;
  static removeHtmlEntities = HtmlFormatter.removeHtmlEntities;
  static stripHtmlTags = HtmlFormatter.stripHtmlTags;
  static formatWithHtml = HtmlFormatter.formatWithHtml;

  // === ANALYSE DE TEXTE ===
  static estimateReadingTime = TextAnalyzer.estimateReadingTime;
  static getTextStatistics = TextAnalyzer.getTextStatistics;

  // === FORMATAGE REACT ===
  static processLinks = ReactFormatter.processLinks;
  static processMarkdownStyles = ReactFormatter.processMarkdownStyles;
  static processParagraph = ReactFormatter.processParagraph;
  static processTextWithAllStyles = ReactFormatter.processTextWithAllStyles;
  static processFormattedText = ReactFormatter.processFormattedText;

  // === FORMATAGE NOTES ===
  static cleanForDisplay = NoteFormatter.cleanForDisplay;
  static insertFormatting = NoteFormatter.insertFormatting;
  static hasFormatting = NoteFormatter.hasFormatting;
  static getStats = NoteFormatter.getStats;
}
