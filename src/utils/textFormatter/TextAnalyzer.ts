import { TextStatistics } from './types';

/**
 * Analyse et statistiques de texte
 */
export class TextAnalyzer {
  /**
   * Estime le temps de lecture du texte en secondes
   * @param text Texte à analyser
   * @param wordsPerMinute Vitesse de lecture en mots par minute (défaut: 150)
   */
  static estimateReadingTime(text: string, wordsPerMinute: number = 150): number {
    const wordCount = text.split(/\s+/).length;
    const minutes = wordCount / wordsPerMinute;
    return Math.round(minutes * 60); // Convertit en secondes
  }

  /**
   * Calcule des statistiques sur le texte
   */
  static getTextStatistics(text: string): TextStatistics {
    // Supprime les espaces supplémentaires
    const cleanText = text.trim().replace(/\s+/g, ' ');
    
    // Calcule les statistiques de base
    const characters = text.length;
    const words = text.split(/\s+/).filter(word => word.length > 0).length;
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    
    // Estime le temps de lecture
    const estimatedSeconds = this.estimateReadingTime(text);
    
    return {
      characters,
      words,
      sentences,
      paragraphs,
      estimatedSeconds
    };
  }
} 