import { SocialPlatform, HashtagSuggestion } from '../types';
import { PLATFORM_HASHTAGS, COMMON_HASHTAGS } from '../config/platforms';

/**
 * Générateur d'hashtags pour les plateformes sociales
 */
export class HashtagGenerator {
  /**
   * Génère des hashtags suggérés selon la plateforme
   */
  public static generateHashtags(platform: SocialPlatform, topic?: string): string[] {
    const platformSpecific = PLATFORM_HASHTAGS[platform.id] || [];
    const result = [...COMMON_HASHTAGS, ...platformSpecific];

    if (topic) {
      result.unshift(topic);
    }

    return result.slice(0, 8); // Limiter à 8 hashtags
  }

  /**
   * Génère des suggestions d'hashtags pour toutes les plateformes
   */
  public static generateSuggestionsForAllPlatforms(
    platforms: SocialPlatform[],
    topic?: string
  ): HashtagSuggestion[] {
    return platforms.map(platform => ({
      platform,
      hashtags: this.generateHashtags(platform, topic),
      topic,
    }));
  }

  /**
   * Formate les hashtags pour l'affichage
   */
  public static formatHashtags(hashtags: string[]): string {
    return hashtags.map(tag => `#${tag}`).join(' ');
  }

  /**
   * Valide un hashtag
   */
  public static validateHashtag(hashtag: string): boolean {
    // Règles de base pour les hashtags
    const hashtagRegex = /^[a-zA-Z0-9_]+$/;
    return hashtagRegex.test(hashtag) && hashtag.length > 0 && hashtag.length <= 30;
  }

  /**
   * Nettoie et valide une liste d'hashtags
   */
  public static cleanHashtags(hashtags: string[]): string[] {
    return hashtags
      .map(tag => tag.replace(/^#/, '')) // Retirer le # si présent
      .filter(tag => this.validateHashtag(tag))
      .slice(0, 10); // Limiter à 10 hashtags max
  }

  /**
   * Obtient des hashtags populaires par catégorie
   */
  public static getPopularHashtagsByCategory(): { [category: string]: string[] } {
    return {
      video: ['Video', 'Content', 'Creator', 'Viral', 'Trending'],
      tech: ['Tech', 'Innovation', 'Digital', 'Technology', 'Future'],
      lifestyle: ['Lifestyle', 'Daily', 'Life', 'Inspiration', 'Motivation'],
      entertainment: ['Entertainment', 'Fun', 'Comedy', 'Music', 'Dance'],
      education: ['Education', 'Learning', 'Tips', 'Tutorial', 'Knowledge'],
      business: ['Business', 'Entrepreneur', 'Success', 'Marketing', 'Growth'],
    };
  }

  /**
   * Suggère des hashtags basés sur le contenu
   */
  public static suggestByContent(contentKeywords: string[]): string[] {
    const suggestions: string[] = [];
    const categories = this.getPopularHashtagsByCategory();

    contentKeywords.forEach(keyword => {
      const lowerKeyword = keyword.toLowerCase();
      
      // Rechercher dans les catégories
      Object.entries(categories).forEach(([category, hashtags]) => {
        if (hashtags.some(tag => tag.toLowerCase().includes(lowerKeyword))) {
          suggestions.push(...hashtags.slice(0, 2));
        }
      });
    });

    // Ajouter les mots-clés eux-mêmes s'ils sont valides
    contentKeywords.forEach(keyword => {
      if (this.validateHashtag(keyword)) {
        suggestions.push(keyword);
      }
    });

    // Retourner des suggestions uniques
    return [...new Set(suggestions)].slice(0, 8);
  }
} 