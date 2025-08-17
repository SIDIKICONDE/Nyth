import { SocialPlatform, PlatformRecommendation } from '../types';

/**
 * Recommandeur de plateformes basé sur les caractéristiques de la vidéo
 */
export class PlatformRecommender {
  /**
   * Obtient les plateformes recommandées selon le format de la vidéo
   */
  public static getRecommendedPlatforms(
    platforms: SocialPlatform[],
    aspectRatio: { width: number; height: number }
  ): PlatformRecommendation[] {
    const ratio = aspectRatio.width / aspectRatio.height;
    const recommendations: PlatformRecommendation[] = [];

    platforms.forEach(platform => {
      const recommendation = this.evaluatePlatform(platform, ratio);
      if (recommendation.score > 0) {
        recommendations.push(recommendation);
      }
    });

    // Trier par score décroissant
    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Évalue une plateforme pour un ratio d'aspect donné
   */
  private static evaluatePlatform(
    platform: SocialPlatform,
    videoRatio: number
  ): PlatformRecommendation {
    const platformRatio = platform.recommendedFormat.aspectRatio.width / 
                         platform.recommendedFormat.aspectRatio.height;
    
    let score = 0;
    const reasons: string[] = [];

    // Calcul du score basé sur la compatibilité du ratio
    const ratioDifference = Math.abs(videoRatio - platformRatio);
    
    if (ratioDifference < 0.1) {
      score += 100;
      reasons.push('Format parfaitement adapté');
    } else if (ratioDifference < 0.3) {
      score += 80;
      reasons.push('Format bien adapté');
    } else if (ratioDifference < 0.5) {
      score += 60;
      reasons.push('Format acceptable');
    } else if (ratioDifference < 1) {
      score += 40;
      reasons.push('Format moyennement adapté');
    } else {
      score += 20;
      reasons.push('Format peu adapté');
    }

    // Bonus selon le type de contenu
    if (videoRatio < 1) {
      // Format vertical
      if (['tiktok', 'instagram', 'youtube'].includes(platform.id)) {
        score += 20;
        reasons.push('Idéal pour le contenu vertical');
      }
    } else if (videoRatio > 1.5) {
      // Format paysage
      if (['youtube', 'facebook', 'twitter'].includes(platform.id)) {
        score += 20;
        reasons.push('Idéal pour le contenu paysage');
      }
    } else {
      // Format carré
      if (['instagram', 'facebook'].includes(platform.id)) {
        score += 20;
        reasons.push('Idéal pour le contenu carré');
      }
    }

    // Bonus de popularité
    const popularityBonus = this.getPopularityBonus(platform.id);
    score += popularityBonus;
    if (popularityBonus > 0) {
      reasons.push('Plateforme populaire');
    }

    return {
      platform,
      score: Math.min(score, 100), // Plafonner à 100
      reasons,
    };
  }

  /**
   * Obtient un bonus de popularité pour une plateforme
   */
  private static getPopularityBonus(platformId: string): number {
    const popularityScores: { [key: string]: number } = {
      tiktok: 15,
      instagram: 12,
      youtube: 10,
      facebook: 8,
      twitter: 5,
    };

    return popularityScores[platformId] || 0;
  }

  /**
   * Filtre les plateformes par score minimum
   */
  public static filterByMinScore(
    recommendations: PlatformRecommendation[],
    minScore: number = 50
  ): PlatformRecommendation[] {
    return recommendations.filter(rec => rec.score >= minScore);
  }

  /**
   * Obtient les meilleures recommandations (top N)
   */
  public static getTopRecommendations(
    recommendations: PlatformRecommendation[],
    count: number = 3
  ): PlatformRecommendation[] {
    return recommendations.slice(0, count);
  }

  /**
   * Génère un résumé des recommandations
   */
  public static generateRecommendationSummary(
    recommendations: PlatformRecommendation[]
  ): string {
    if (recommendations.length === 0) {
      return 'Aucune plateforme recommandée pour ce format';
    }

    const topPlatform = recommendations[0];
    const platformNames = recommendations.slice(0, 3).map(r => r.platform.name);

    if (topPlatform.score >= 80) {
      return `Excellent pour ${platformNames.join(', ')}`;
    } else if (topPlatform.score >= 60) {
      return `Bien adapté pour ${platformNames.join(', ')}`;
    } else {
      return `Acceptable pour ${platformNames.join(', ')}`;
    }
  }

  /**
   * Recommande des plateformes selon la durée de la vidéo
   */
  public static recommendByDuration(
    platforms: SocialPlatform[],
    videoDuration: number
  ): PlatformRecommendation[] {
    const recommendations: PlatformRecommendation[] = [];

    platforms.forEach(platform => {
      let score = 50; // Score de base
      const reasons: string[] = [];

      if (platform.maxDuration) {
        if (videoDuration <= platform.maxDuration) {
          score += 30;
          reasons.push(`Durée compatible (max ${platform.maxDuration}s)`);
        } else {
          score -= 20;
          reasons.push(`Durée trop longue (max ${platform.maxDuration}s)`);
        }
      }

      // Bonus pour les durées optimales par plateforme
      if (platform.id === 'tiktok' && videoDuration <= 60) {
        score += 20;
        reasons.push('Durée optimale pour TikTok');
      } else if (platform.id === 'instagram' && videoDuration <= 90) {
        score += 15;
        reasons.push('Durée optimale pour Instagram Reels');
      } else if (platform.id === 'youtube' && videoDuration <= 60) {
        score += 15;
        reasons.push('Durée optimale pour YouTube Shorts');
      }

      if (score > 0) {
        recommendations.push({
          platform,
          score: Math.min(score, 100),
          reasons,
        });
      }
    });

    return recommendations.sort((a, b) => b.score - a.score);
  }
} 