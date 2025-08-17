import { MarkdownOptions } from './types';

/**
 * Formatage Markdown spécialisé pour le téléprompter
 */
export class MarkdownFormatter {
  /**
   * Applique le formatage Markdown au texte pour le téléprompter
   * @param text Texte à formater avec la syntaxe Markdown
   * @param options Options de formatage Markdown
   */
  static applyMarkdownFormatting(text: string, options: MarkdownOptions = {}): string {
    let result = text;
    
    // Options par défaut
    const {
      convertBold = true,
      convertItalic = true,
      convertHighlight = true,
      convertHeaders = true,
      convertLists = true
    } = options;
    
    // Formatage gras avec étoiles doubles (**texte** ou __texte__)
    if (convertBold) {
      result = result.replace(/\*\*(.*?)\*\*/g, '$1');
      result = result.replace(/__(.*?)__/g, '$1');
    }
    
    // Formatage italique avec étoiles simples (*texte* ou _texte_)
    if (convertItalic) {
      result = result.replace(/\*(.*?)\*/g, '$1');
      result = result.replace(/_(.*?)_/g, '$1');
    }
    
    // Formatage surligné avec accent circonflexe (^texte^)
    if (convertHighlight) {
      result = result.replace(/\^(.*?)\^/g, '$1');
    }
    
    // Formatage des titres (# Titre)
    if (convertHeaders) {
      result = result.replace(/^# (.*?)$/gm, '$1');
      result = result.replace(/^## (.*?)$/gm, '$1');
      result = result.replace(/^### (.*?)$/gm, '$1');
    }
    
    // Formatage des listes (- élément)
    if (convertLists) {
      // Remplacer les puces par un texte simple
      result = result.replace(/^- (.*?)$/gm, '• $1');
    }
    
    return result;
  }

  /**
   * Détecte et formate automatiquement le texte selon sa syntaxe
   * @param text Texte à analyser et formater
   */
  static autoFormatText(text: string): string {
    if (!text || typeof text !== 'string') {
      return text; // Protection contre les valeurs null ou non-string
    }
    
    let result = text;
    
    // Détecte si le texte contient des symboles Markdown
    const hasMarkdown = /(\*\*|\*|__|_|\^|^#+ |^- )/m.test(text);
    
    if (hasMarkdown) {
      try {
        result = this.applyMarkdownFormatting(result);
      } catch (error) {
        // En cas d'erreur, retourner le texte original
        return text;
      }
    }
    
    return result;
  }
} 