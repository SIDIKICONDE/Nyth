import { TextFormatOptions, TextFormatType } from './types';
import { BasicFormatter } from './BasicFormatter';
import { TeleprompterFormatter } from './TeleprompterFormatter';
import { MarkdownFormatter } from './MarkdownFormatter';

/**
 * Formatage et gestion HTML
 */
export class HtmlFormatter {
  /**
   * Convertit les balises HTML en texte échappé
   * @param text Texte contenant des balises HTML
   */
  static escapeHtmlTags(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Supprime les entités HTML pour un affichage propre dans le téléprompter
   * @param text Texte contenant des entités HTML
   */
  static removeHtmlEntities(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/&lt;/g, '') // Supprimer complètement < au lieu de convertir
      .replace(/&gt;/g, '') // Supprimer complètement > au lieu de convertir
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  /**
   * Extrait le texte brut d'une chaîne contenant des balises HTML 
   * Utile pour afficher le texte sans formatage dans l'éditeur
   * @param text Texte avec balises HTML
   */
  static stripHtmlTags(text: string): string {
    if (!text) return '';
    
    // Remplacer toutes les balises HTML par des espaces
    return text.replace(/<\/?[^>]+(>|$)/g, '');
  }

  /**
   * Génère un texte formaté avec des balises HTML pour le rendu stylisé
   * Note: À utiliser uniquement pour l'affichage, pas pour le stockage
   */
  static formatWithHtml(text: string, options: TextFormatOptions): string {
    switch (options.type) {
      case TextFormatType.UPPERCASE:
        return BasicFormatter.toUpperCase(text);
      
      case TextFormatType.LOWERCASE:
        return BasicFormatter.toLowerCase(text);
      
      case TextFormatType.CAPITALIZE:
        return BasicFormatter.capitalize(text);
      
      case TextFormatType.HIGHLIGHT:
        return `<span style="background-color: ${options.highlightColor || '#FFFF00'};">${text}</span>`;
      
      case TextFormatType.COLOR:
        return `<span style="color: ${options.color || '#FF0000'};">${text}</span>`;
      
      case TextFormatType.SIZE:
        return `<span style="font-size: ${options.fontSize || 120}%;">${text}</span>`;
      
      case TextFormatType.EMPHASIS:
        let style = '';
        if (options.bold) style += 'font-weight: bold; ';
        if (options.italic) style += 'font-style: italic; ';
        return `<span style="${style}">${text}</span>`;
      
      case TextFormatType.AUTO_PAUSE:
        return TeleprompterFormatter.addAutoPauses(text, options.pauseMarker);
      
      case TextFormatType.SPLIT_SENTENCES:
        return TeleprompterFormatter.splitIntoSentences(text);
      
      case TextFormatType.NORMALIZE:
        return BasicFormatter.normalize(text);
      
      case TextFormatType.MARKDOWN:
        return MarkdownFormatter.autoFormatText(text);
      
      default:
        return text;
    }
  }
} 