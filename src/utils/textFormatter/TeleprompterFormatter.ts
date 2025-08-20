import { TeleprompterOptions } from './types';
import { BasicFormatter } from './BasicFormatter';
import { MarkdownFormatter } from './MarkdownFormatter';

/**
 * Formatage spécialisé pour le téléprompter
 */
export class TeleprompterFormatter {
  /**
   * Ajoute des marqueurs de pause automatiques dans le texte
   * @param text Texte à formater
   * @param pauseMarker Marqueur de pause (par défaut "...")
   */
  static addAutoPauses(text: string, pauseMarker: string = '...'): string {
    // Ajoute des pauses après les points, points d'exclamation et d'interrogation
    return text
      .replace(/\.\s+/g, `. ${pauseMarker} `)
      .replace(/\!\s+/g, `! ${pauseMarker} `)
      .replace(/\?\s+/g, `? ${pauseMarker} `)
      // Ajoute des pauses avant certaines conjonctions
      .replace(/\s+mais\s+/gi, ` ${pauseMarker} mais `)
      .replace(/\s+cependant\s+/gi, ` ${pauseMarker} cependant `)
      .replace(/\s+toutefois\s+/gi, ` ${pauseMarker} toutefois `);
  }

  /**
   * Divise le texte en phrases distinctes (une par ligne)
   */
  static splitIntoSentences(text: string): string {
    return text
      .replace(/([.!?])\s+/g, '$1\n')
      .replace(/([;:])\s+/g, '$1\n');
  }

  /**
   * Prépare le texte pour une lecture optimale sur téléprompter
   * @param text Texte à optimiser
   * @param options Options de formatage
   */
  static optimizeForTeleprompter(text: string, options: TeleprompterOptions = {}): string {
    let result = text;
    
    // Applique les différentes transformations selon les options
    if (options.capitalize) {
      result = BasicFormatter.capitalize(result);
    }
    
    if (options.splitSentences) {
      result = this.splitIntoSentences(result);
    }
    
    if (options.addPauses) {
      result = this.addAutoPauses(result, options.pauseMarker);
    }
    
    if (options.formatMarkdown) {
      result = MarkdownFormatter.autoFormatText(result);
    }
    
    return result;
  }
} 