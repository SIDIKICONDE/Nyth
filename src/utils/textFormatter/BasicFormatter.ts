/**
 * Formatages de base pour les textes
 */
export class BasicFormatter {
  /**
   * Convertit un texte en majuscules
   */
  static toUpperCase(text: string): string {
    return text.toUpperCase();
  }

  /**
   * Convertit un texte en minuscules
   */
  static toLowerCase(text: string): string {
    return text.toLowerCase();
  }

  /**
   * Capitalise la première lettre de chaque mot
   */
  static capitalize(text: string): string {
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /** 
   * Normalise le texte (supprime les caractères spéciaux, accents, etc.)
   */
  static normalize(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .replace(/[^\w\s]/gi, '') // Supprime la ponctuation
      .replace(/\s+/g, ' ') // Normalise les espaces
      .trim();
  }
} 