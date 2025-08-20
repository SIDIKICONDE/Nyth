import { Alert } from 'react-native';
import { 
  SocialPlatform, 
  ShareOptions, 
  ShareContent, 
  PlatformRecommendation,
  HashtagSuggestion 
} from './types';
import { SOCIAL_PLATFORMS } from './config/platforms';
import { AppDetector } from './utils/appDetector';
import { FileManager } from './utils/fileManager';
import { HashtagGenerator } from './utils/hashtagGenerator';
import { PlatformRecommender } from './utils/platformRecommender';
import { NativeSharer } from './sharers/nativeSharer';
import { WebSharer } from './sharers/webSharer';

/**
 * Service principal pour le partage social de vidéos
 */
export class SocialShareService {
  private static instance: SocialShareService;

  public static getInstance(): SocialShareService {
    if (!SocialShareService.instance) {
      SocialShareService.instance = new SocialShareService();
    }
    return SocialShareService.instance;
  }

  /**
   * Vérifie si une app est installée sur l'appareil
   */
  public async isAppInstalled(platform: SocialPlatform): Promise<boolean> {
    return await AppDetector.isAppInstalled(platform);
  }

  /**
   * Obtient toutes les plateformes installées
   */
  public async getInstalledPlatforms(): Promise<SocialPlatform[]> {
    return await AppDetector.getInstalledPlatforms(SOCIAL_PLATFORMS);
  }

  /**
   * Partage une vidéo vers une plateforme spécifique
   */
  public async shareToSocial(
    videoUri: string, 
    platform: SocialPlatform,
    options?: ShareOptions
  ): Promise<void> {
    try {
      // Valider le fichier vidéo
      await FileManager.validateVideoFile(videoUri);

      // Obtenir les informations du fichier
      const videoInfo = await FileManager.getVideoInfo(videoUri);

      // Valider selon les contraintes de la plateforme
      const validation = FileManager.validateForPlatform(videoInfo, platform.maxDuration);
      if (!validation.valid && validation.reason) {}

      // Vérifier si l'app est installée
      const isInstalled = await this.isAppInstalled(platform);

      if (isInstalled) {
        await NativeSharer.shareToNativeApp(videoUri, platform, options);
      } else {
        await WebSharer.shareToWebOrStore(platform, options);
      }
    } catch (error) {
      Alert.alert(
        '❌ Erreur de partage',
        `Impossible de partager vers ${platform.name}.\n\n${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        [{ text: 'OK' }]
      );
      throw error;
    }
  }

  /**
   * Obtient les plateformes recommandées selon le format de la vidéo
   */
  public getRecommendedPlatforms(
    aspectRatio: { width: number; height: number }
  ): PlatformRecommendation[] {
    return PlatformRecommender.getRecommendedPlatforms(SOCIAL_PLATFORMS, aspectRatio);
  }

  /**
   * Recommande des plateformes selon la durée de la vidéo
   */
  public recommendByDuration(videoDuration: number): PlatformRecommendation[] {
    return PlatformRecommender.recommendByDuration(SOCIAL_PLATFORMS, videoDuration);
  }

  /**
   * Génère des hashtags suggérés selon la plateforme
   */
  public generateHashtags(platform: SocialPlatform, topic?: string): string[] {
    return HashtagGenerator.generateHashtags(platform, topic);
  }

  /**
   * Génère des suggestions d'hashtags pour toutes les plateformes
   */
  public generateHashtagsForAllPlatforms(topic?: string): HashtagSuggestion[] {
    return HashtagGenerator.generateSuggestionsForAllPlatforms(SOCIAL_PLATFORMS, topic);
  }

  /**
   * Suggère des hashtags basés sur le contenu
   */
  public suggestHashtagsByContent(contentKeywords: string[]): string[] {
    return HashtagGenerator.suggestByContent(contentKeywords);
  }

  /**
   * Obtient toutes les plateformes supportées
   */
  public getSupportedPlatforms(): SocialPlatform[] {
    return [...SOCIAL_PLATFORMS];
  }

  /**
   * Trouve une plateforme par son ID
   */
  public findPlatformById(id: string): SocialPlatform | undefined {
    return SOCIAL_PLATFORMS.find(platform => platform.id === id);
  }

  /**
   * Filtre les plateformes par critères
   */
  public filterPlatforms(criteria: {
    maxDuration?: number;
    aspectRatio?: { width: number; height: number };
    quality?: '720p' | '1080p' | '4K';
  }): SocialPlatform[] {
    let platforms = [...SOCIAL_PLATFORMS];

    if (criteria.maxDuration) {
      platforms = platforms.filter(p => 
        !p.maxDuration || p.maxDuration >= criteria.maxDuration!
      );
    }

    if (criteria.quality) {
      platforms = platforms.filter(p => 
        p.recommendedFormat.quality === criteria.quality
      );
    }

    if (criteria.aspectRatio) {
      // Filtrer par compatibilité de ratio d'aspect
      const targetRatio = criteria.aspectRatio.width / criteria.aspectRatio.height;
      platforms = platforms.filter(p => {
        const platformRatio = p.recommendedFormat.aspectRatio.width / 
                             p.recommendedFormat.aspectRatio.height;
        const difference = Math.abs(targetRatio - platformRatio);
        return difference < 1; // Tolérance raisonnable
      });
    }

    return platforms;
  }

  /**
   * Obtient les statistiques d'installation
   */
  public async getInstallationStats(): Promise<{
    totalPlatforms: number;
    installedCount: number;
    installationRate: number;
    installedPlatforms: string[];
  }> {
    return await AppDetector.getInstallationStats(SOCIAL_PLATFORMS);
  }

  /**
   * Partage vers plusieurs plateformes
   */
  public async shareToMultiplePlatforms(
    videoUri: string,
    platformIds: string[],
    options?: ShareOptions
  ): Promise<{ success: string[]; failed: string[] }> {
    const results: { success: string[]; failed: string[] } = { success: [], failed: [] };

    for (const platformId of platformIds) {
      const platform = this.findPlatformById(platformId);
      if (!platform) {
        results.failed.push(platformId);
        continue;
      }

      try {
        await this.shareToSocial(videoUri, platform, options);
        results.success.push(platformId);
      } catch (error) {
        results.failed.push(platformId);
      }
    }

    return results;
  }

  /**
   * Prévisualise le partage (sans exécuter)
   */
  public async previewShare(
    videoUri: string,
    platform: SocialPlatform,
    options?: ShareOptions
  ): Promise<{
    platform: SocialPlatform;
    isInstalled: boolean;
    videoValid: boolean;
    estimatedDuration?: number;
    hashtags: string[];
    shareMethod: 'native' | 'web' | 'store';
  }> {
    const videoInfo = await FileManager.getVideoInfo(videoUri);
    const isInstalled = await this.isAppInstalled(platform);
    const hashtags = this.generateHashtags(platform, options?.title);

    let shareMethod: 'native' | 'web' | 'store' = 'store';
    if (isInstalled) {
      shareMethod = 'native';
    } else if (platform.webUrl) {
      shareMethod = 'web';
    }

    return {
      platform,
      isInstalled,
      videoValid: videoInfo.exists,
      estimatedDuration: videoInfo.size ? FileManager.estimateVideoDuration(videoInfo.size) : undefined,
      hashtags,
      shareMethod,
    };
  }
}

export default SocialShareService; 